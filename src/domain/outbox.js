/**
 * @file Idempotent offline outbox for assistance messages.
 *
 * Maintains a FIFO queue of envelopes with retry metadata.
 * Idempotent by messageId for both enqueue and acknowledge.
 * All mutating operations return a new outbox (immutable).
 */

// ---------------------------------------------------------------------------
// createEmptyOutbox
// ---------------------------------------------------------------------------

/**
 * Create an empty outbox.
 *
 * @returns {{ entries: Array<{envelope: object, attemptCount: number, lastAttemptAtMs: number|null, acknowledgedAtMs: number|null}> }}
 */
export function createEmptyOutbox() {
  return { entries: [] }
}

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------

/**
 * Enqueue an envelope into the outbox.
 *
 * Idempotent: if an entry with the same messageId already exists, the
 * outbox is returned unchanged.
 *
 * @param {{ entries: Array }} outbox
 * @param {object} envelope
 * @returns {{ entries: Array }} new outbox
 */
export function enqueue(outbox, envelope) {
  // Idempotency check: skip if messageId already exists
  const exists = outbox.entries.some(
    entry => entry.envelope.messageId === envelope.messageId,
  )
  if (exists) {
    return outbox
  }

  const newEntry = {
    envelope,
    attemptCount: 0,
    lastAttemptAtMs: null,
    acknowledgedAtMs: null,
  }

  return {
    entries: [...outbox.entries, newEntry],
  }
}

// ---------------------------------------------------------------------------
// acknowledge
// ---------------------------------------------------------------------------

/**
 * Mark an envelope as acknowledged.
 *
 * Idempotent: if the messageId is already acknowledged or unknown, the
 * outbox is returned unchanged.
 *
 * @param {{ entries: Array }} outbox
 * @param {string} messageId
 * @param {number} acknowledgedAtMs
 * @returns {{ entries: Array }} new outbox
 */
export function acknowledge(outbox, messageId, acknowledgedAtMs) {
  let changed = false
  const newEntries = outbox.entries.map(entry => {
    if (entry.envelope.messageId === messageId && entry.acknowledgedAtMs === null) {
      changed = true
      return {
        ...entry,
        acknowledgedAtMs,
      }
    }
    return entry
  })

  if (!changed) {
    return outbox
  }

  return { entries: newEntries }
}

// ---------------------------------------------------------------------------
// listPending
// ---------------------------------------------------------------------------

/**
 * Return all unacknowledged envelopes from the outbox, in FIFO order.
 *
 * @param {{ entries: Array }} outbox
 * @returns {object[]} array of envelope objects
 */
export function listPending(outbox) {
  const pending = []
  for (const entry of outbox.entries) {
    if (entry.acknowledgedAtMs === null) {
      pending.push(entry.envelope)
    }
  }
  return pending
}

// ---------------------------------------------------------------------------
// markAttempt
// ---------------------------------------------------------------------------

/**
 * Record a delivery attempt for an envelope.
 *
 * @param {{ entries: Array }} outbox
 * @param {string} messageId
 * @param {number} attemptedAtMs
 * @returns {{ entries: Array }} new outbox
 */
export function markAttempt(outbox, messageId, attemptedAtMs) {
  let changed = false
  const newEntries = outbox.entries.map(entry => {
    if (entry.envelope.messageId === messageId) {
      changed = true
      return {
        ...entry,
        attemptCount: entry.attemptCount + 1,
        lastAttemptAtMs: attemptedAtMs,
      }
    }
    return entry
  })

  if (!changed) {
    return outbox
  }

  return { entries: newEntries }
}
