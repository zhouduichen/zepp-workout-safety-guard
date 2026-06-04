import { createEmptyOutbox, enqueue } from '../domain/outbox.js'
import { createEnvelope } from '../domain/protocol.js'

const MAX_HISTORY_ENTRIES = 20

function loadOutbox(storage) {
  return storage.loadOutbox() || createEmptyOutbox()
}

function loadHistory(storage) {
  return storage.loadEventHistory ? storage.loadEventHistory() || [] : []
}

function saveHistory(storage, entries) {
  if (storage.saveEventHistory) {
    storage.saveEventHistory(entries.slice(0, MAX_HISTORY_ENTRIES))
  }
}

function saveOutbox(storage, outbox) {
  storage.saveOutbox(outbox)
}

function putHistoryEntry(storage, entry) {
  const existing = loadHistory(storage).filter(item => item.eventId !== entry.eventId)
  saveHistory(storage, [entry, ...existing])
}

function updateHistoryEntry(storage, eventId, updates) {
  const history = loadHistory(storage)
  const next = history.map(entry => (
    entry.eventId === eventId ? { ...entry, ...updates } : entry
  ))
  saveHistory(storage, next)
}

function findLatestUnresolvedHelp(history) {
  return history.find(entry => entry.status === 'queued' || entry.status === 'acknowledged')
}

function hasHelpRequest(outbox, messageId) {
  return outbox.entries.some(entry => (
    entry.envelope.messageId === messageId && entry.envelope.type === 'help.requested'
  ))
}

function findResolution(outbox, helpMessageId) {
  return outbox.entries.find(entry => (
    entry.envelope.type === 'help.resolved' &&
    entry.envelope.payload?.resolvedMessageId === helpMessageId
  ))
}

export function createAssistSession({ storage, now, trigger = 'manual' }) {
  const startedAtMs = now()
  let helpEnvelope = null
  let locationEnvelope = null

  function sendHelp({ hasLocation = false } = {}) {
    if (helpEnvelope) {
      return { envelope: helpEnvelope, alreadyQueued: true }
    }

    const occurredAtMs = now()
    const messageId = `evt-${startedAtMs}-manual`
    helpEnvelope = createEnvelope({
      messageId,
      type: 'help.requested',
      occurredAtMs,
      payload: {
        trigger,
        offlineReplay: false,
        location: null,
      },
    })

    const outbox = enqueue(loadOutbox(storage), helpEnvelope)
    saveOutbox(storage, outbox)
    putHistoryEntry(storage, {
      eventId: messageId,
      trigger,
      occurredAtMs,
      status: 'queued',
      replayed: false,
      hasLocation: !!hasLocation,
    })

    return { envelope: helpEnvelope, alreadyQueued: false }
  }

  function sendLocationUpdate(lat, lng) {
    if (!helpEnvelope) return { envelope: null, alreadyQueued: false }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { envelope: null, alreadyQueued: false }
    }
    if (locationEnvelope) {
      return { envelope: locationEnvelope, alreadyQueued: true }
    }

    locationEnvelope = createEnvelope({
      messageId: `${helpEnvelope.messageId}-loc-0001`,
      type: 'help.location_updated',
      occurredAtMs: now(),
      payload: {
        helpMessageId: helpEnvelope.messageId,
        location: { lat, lng },
      },
    })

    const outbox = enqueue(loadOutbox(storage), locationEnvelope)
    saveOutbox(storage, outbox)
    updateHistoryEntry(storage, helpEnvelope.messageId, { hasLocation: true })

    return { envelope: locationEnvelope, alreadyQueued: false }
  }

  return {
    sendHelp,
    sendLocationUpdate,
    getHelpMessageId: () => helpEnvelope?.messageId || null,
  }
}

export function resolveLatestHelp({ storage, now }) {
  const history = loadHistory(storage)
  const latest = findLatestUnresolvedHelp(history)
  if (!latest) return { envelope: null, alreadyQueued: false }

  const outbox = loadOutbox(storage)
  if (!hasHelpRequest(outbox, latest.eventId)) {
    return { envelope: null, alreadyQueued: false }
  }

  const existing = findResolution(outbox, latest.eventId)
  if (existing) {
    updateHistoryEntry(storage, latest.eventId, { status: 'resolved' })
    return { envelope: existing.envelope, alreadyQueued: true }
  }

  const envelope = createEnvelope({
    messageId: `${latest.eventId}-resolved`,
    type: 'help.resolved',
    occurredAtMs: now(),
    payload: {
      resolved: true,
      resolvedMessageId: latest.eventId,
    },
  })

  saveOutbox(storage, enqueue(outbox, envelope))
  updateHistoryEntry(storage, latest.eventId, { status: 'resolved' })

  return { envelope, alreadyQueued: false }
}
