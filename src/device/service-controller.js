import { createInitialGuardState, reduceGuard } from '../domain/risk-engine.js'
import { createEmptyOutbox, enqueue, acknowledge, listPending, markAttempt } from '../domain/outbox.js'
import { createEnvelope } from '../domain/protocol.js'
import { EffectType } from '../domain/constants.js'
import { saveEventHistory, loadEventHistory } from './storage.js'

let _messageCounter = 0

function nextMessageId(now) {
  _messageCounter += 1
  return `evt-${now}-${String(_messageCounter).padStart(4, '0')}`
}

export function resetMessageCounter() {
  _messageCounter = 0
}

export function createServiceController({ config, storage, alerts, alarm, bridge, now }) {
  let guardState = null
  let outbox = null
  let eventHistory = []

  function start() {
    guardState = storage.loadGuardState() || createInitialGuardState(now())
    outbox = storage.loadOutbox() || createEmptyOutbox()
    eventHistory = loadEventHistory()
  }

  function stop() {
    // no-op for now
  }

  function persist() {
    storage.saveGuardState(guardState)
    storage.saveOutbox(outbox)
    saveEventHistory(eventHistory)
  }

  // -----------------------------------------------------------------------
  // Event history helpers
  // -----------------------------------------------------------------------

  function recordHistory(entry) {
    // Prepend newest first
    eventHistory = [entry, ...eventHistory].slice(0, 20)
  }

  function updateHistory(messageId, updates) {
    const idx = eventHistory.findIndex(e => e.eventId === messageId)
    if (idx !== -1) {
      eventHistory[idx] = { ...eventHistory[idx], ...updates }
    }
  }

  function findHelpRequestEnvelopes() {
    return outbox.entries.filter(e => e.envelope.type === 'help.requested')
  }

  function findResolutionEnvelopes() {
    return outbox.entries.filter(e => e.envelope.type === 'help.resolved')
  }

  function handleInput(input) {
    const result = reduceGuard(guardState, input, config)
    guardState = result.state

    for (const effect of result.effects) {
      executeEffect(effect, input.atMs)
    }

    persist()
    return result
  }

  function handleEscalationAlarm({ episodeId, atMs }) {
    return handleInput({ type: 'ESCALATION_ALARM_FIRED', atMs, payload: { episodeId } })
  }

  function flushOutbox() {
    const pending = listPending(outbox)
    if (!bridge.isConnected()) return pending

    for (const env of pending) {
      try {
        const bytes = new TextEncoder().encode(JSON.stringify(env))
        bridge.send(bytes)
        outbox = markAttempt(outbox, env.messageId, now())
      } catch {
        // best-effort: stay in outbox
      }
    }
    storage.saveOutbox(outbox)
    return pending
  }

  function executeEffect(effect, atMs) {
    switch (effect.type) {
      case EffectType.VIBRATE_GENTLE:
      case EffectType.VIBRATE_URGENT:
      case EffectType.NOTIFY_INTENSITY:
      case EffectType.NOTIFY_CONFIRMATION:
      case EffectType.NOTIFY_GUARD_PAUSED:
      case EffectType.START_LOCAL_ALARM:
      case EffectType.STOP_LOCAL_ALARM:
        alerts.apply(effect)
        break

      case EffectType.SCHEDULE_ESCALATION_ALARM:
        alarm.schedule({ episodeId: effect.episodeId, delaySec: effect.delaySec })
        break

      case EffectType.CANCEL_ESCALATION_ALARM:
        alarm.cancel()
        break

      case EffectType.QUEUE_HELP_REQUEST: {
        const messageId = nextMessageId(atMs || now())
        const envelope = createEnvelope({
          messageId,
          type: 'help.requested',
          occurredAtMs: atMs || now(),
          payload: { trigger: 'automatic_high_risk', offlineReplay: false, location: null },
        })
        outbox = enqueue(outbox, envelope)

        // Record history entry
        const isOnline = bridge.isConnected()
        recordHistory({
          eventId: messageId,
          trigger: 'automatic_high_risk',
          occurredAtMs: atMs || now(),
          status: isOnline ? 'acknowledged' : 'queued',
          replayed: false,
          hasLocation: false,
        })

        // flush only if connected
        if (isOnline) {
          try {
            const bytes = new TextEncoder().encode(JSON.stringify(envelope))
            bridge.send(bytes)
            outbox = markAttempt(outbox, messageId, now())
          } catch { /* stay queued */ }
        }
        break
      }

      case EffectType.QUEUE_RESOLUTION: {
        const messageId = nextMessageId(atMs || now())
        const envelope = createEnvelope({
          messageId,
          type: 'help.resolved',
          occurredAtMs: atMs || now(),
          payload: { resolved: true },
        })
        outbox = enqueue(outbox, envelope)

        // Update matching help request history entry
        const helpRequests = findHelpRequestEnvelopes()
        const latestHelp = helpRequests[helpRequests.length - 1]
        if (latestHelp) {
          updateHistory(latestHelp.envelope.messageId, { status: 'resolved' })
        }

        if (bridge.isConnected()) {
          try {
            const bytes = new TextEncoder().encode(JSON.stringify(envelope))
            bridge.send(bytes)
            outbox = markAttempt(outbox, messageId, now())
          } catch { /* stay queued */ }
        }
        break
      }

      case EffectType.LOG_EVENT:
        // no-op in production; could be logged
        break
    }
  }

  function getState() { return guardState }
  function getOutbox() { return outbox }

  function getHistory() {
    return eventHistory
      .slice()
      .sort((a, b) => b.occurredAtMs - a.occurredAtMs)
  }

  function clearHistory() {
    eventHistory = []
    saveEventHistory(eventHistory)
  }

  function recordHelpRequestEntry({ messageId, trigger, occurredAtMs, hasLocation, isReplayed }) {
    const isOnline = bridge.isConnected()
    recordHistory({
      eventId: messageId,
      trigger: trigger || 'manual',
      occurredAtMs,
      status: isOnline ? 'acknowledged' : 'queued',
      replayed: !!isReplayed,
      hasLocation: !!hasLocation,
    })
  }

  function triggerResolved() {
    // Find the latest un-resolved help request and mark it resolved
    const reversed = [...eventHistory].reverse()
    const unresolved = reversed.find(
      e => (e.status === 'queued' || e.status === 'acknowledged') && e.trigger !== 'resolution'
    )
    if (unresolved) {
      updateHistory(unresolved.eventId, { status: 'resolved' })
    }
    persist()

    // Only enqueue help.resolved if a help.requested exists in outbox
    const helpRequests = findHelpRequestEnvelopes()
    if (helpRequests.length > 0) {
      const hasExistingResolution = findResolutionEnvelopes().length > 0
      if (!hasExistingResolution) {
        handleInput({ type: 'USER_RESOLVED', atMs: now(), payload: {} })
      }
      // Note: the engine's QUEUE_RESOLUTION effect will be handled in the
      // normal effect loop when USER_RESOLVED is processed.
    }
  }

  return {
    start, stop, handleInput, handleEscalationAlarm, flushOutbox, getState, getOutbox,
    getHistory, clearHistory, recordHelpRequestEntry, triggerResolved,
    _getEventHistory: () => eventHistory,
  }
}
