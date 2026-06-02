import { createInitialGuardState, reduceGuard } from '../domain/risk-engine.js'
import { createEmptyOutbox, enqueue, acknowledge, listPending, markAttempt } from '../domain/outbox.js'
import { createEnvelope } from '../domain/protocol.js'
import { EffectType } from '../domain/constants.js'

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

  function start() {
    guardState = storage.loadGuardState() || createInitialGuardState(now())
    outbox = storage.loadOutbox() || createEmptyOutbox()
  }

  function stop() {
    // no-op for now
  }

  function persist() {
    storage.saveGuardState(guardState)
    storage.saveOutbox(outbox)
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
        // flush only if connected
        if (bridge.isConnected()) {
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

  return { start, stop, handleInput, handleEscalationAlarm, flushOutbox, getState, getOutbox }
}
