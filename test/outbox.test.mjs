import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createEnvelope,
} from '../src/domain/protocol.js'
import {
  createEmptyOutbox,
  enqueue,
  acknowledge,
  listPending,
  markAttempt,
} from '../src/domain/outbox.js'

function makeEnvelope(messageId, type = 'help.requested', overrides = {}) {
  return createEnvelope({
    messageId,
    type,
    occurredAtMs: 1717300000000,
    payload: { trigger: 'test', offlineReplay: false, location: null },
    ...overrides,
  })
}

describe('outbox', () => {
  describe('createEmptyOutbox', () => {
    it('has empty entries array', () => {
      const outbox = createEmptyOutbox()
      assert.deepEqual(outbox, { entries: [] })
    })
  })

  describe('enqueue', () => {
    it('adds an envelope to the outbox', () => {
      const outbox = createEmptyOutbox()
      const env = makeEnvelope('evt-001')
      const updated = enqueue(outbox, env)
      assert.equal(updated.entries.length, 1)
      assert.equal(updated.entries[0].envelope.messageId, 'evt-001')
      assert.equal(updated.entries[0].attemptCount, 0)
      assert.equal(updated.entries[0].lastAttemptAtMs, null)
      assert.equal(updated.entries[0].acknowledgedAtMs, null)
    })

    it('is idempotent (same messageId does not duplicate)', () => {
      let outbox = createEmptyOutbox()
      const env = makeEnvelope('evt-001')
      outbox = enqueue(outbox, env)
      outbox = enqueue(outbox, env)
      assert.equal(outbox.entries.length, 1)
    })

    it('preserves FIFO order with different messageIds', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = enqueue(outbox, makeEnvelope('evt-002'))
      outbox = enqueue(outbox, makeEnvelope('evt-003'))
      assert.equal(outbox.entries.length, 3)
      assert.equal(outbox.entries[0].envelope.messageId, 'evt-001')
      assert.equal(outbox.entries[1].envelope.messageId, 'evt-002')
      assert.equal(outbox.entries[2].envelope.messageId, 'evt-003')
    })

    it('does not mutate the original outbox', () => {
      const outbox = createEmptyOutbox()
      const env = makeEnvelope('evt-001')
      enqueue(outbox, env)
      assert.equal(outbox.entries.length, 0)
    })

    it('idempotent: same messageId does not change order', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = enqueue(outbox, makeEnvelope('evt-002'))
      outbox = enqueue(outbox, makeEnvelope('evt-001')) // duplicate
      assert.equal(outbox.entries.length, 2)
      assert.equal(outbox.entries[0].envelope.messageId, 'evt-001')
      assert.equal(outbox.entries[1].envelope.messageId, 'evt-002')
    })
  })

  describe('listPending', () => {
    it('returns all envelopes before acknowledge', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = enqueue(outbox, makeEnvelope('evt-002'))
      const pending = listPending(outbox)
      assert.equal(pending.length, 2)
      assert.equal(pending[0].messageId, 'evt-001')
      assert.equal(pending[1].messageId, 'evt-002')
    })

    it('returns empty array when outbox is empty', () => {
      const outbox = createEmptyOutbox()
      assert.deepEqual(listPending(outbox), [])
    })

    it('excludes acknowledged entries', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = enqueue(outbox, makeEnvelope('evt-002'))
      outbox = acknowledge(outbox, 'evt-001', 2000)
      const pending = listPending(outbox)
      assert.equal(pending.length, 1)
      assert.equal(pending[0].messageId, 'evt-002')
    })

    it('returns entries in FIFO order', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = enqueue(outbox, makeEnvelope('evt-002'))
      outbox = enqueue(outbox, makeEnvelope('evt-003'))
      const pending = listPending(outbox)
      assert.equal(pending.length, 3)
      assert.equal(pending[0].messageId, 'evt-001')
      assert.equal(pending[1].messageId, 'evt-002')
      assert.equal(pending[2].messageId, 'evt-003')
    })
  })

  describe('acknowledge', () => {
    it('marks envelope as acknowledged', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = acknowledge(outbox, 'evt-001', 2000)
      assert.equal(outbox.entries[0].acknowledgedAtMs, 2000)
    })

    it('is idempotent', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = acknowledge(outbox, 'evt-001', 2000)
      outbox = acknowledge(outbox, 'evt-001', 3000)
      assert.equal(outbox.entries[0].acknowledgedAtMs, 2000) // first value sticks
    })

    it('ignores unknown messageId without throwing', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      const result = acknowledge(outbox, 'evt-unknown', 2000)
      assert.equal(result.entries[0].acknowledgedAtMs, null)
    })

    it('does not mutate the original outbox', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      acknowledge(outbox, 'evt-001', 2000)
      assert.equal(outbox.entries[0].acknowledgedAtMs, null)
    })
  })

  describe('markAttempt', () => {
    it('increments attemptCount', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = markAttempt(outbox, 'evt-001', 3000)
      assert.equal(outbox.entries[0].attemptCount, 1)
      assert.equal(outbox.entries[0].lastAttemptAtMs, 3000)
    })

    it('increments on multiple attempts', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = markAttempt(outbox, 'evt-001', 3000)
      outbox = markAttempt(outbox, 'evt-001', 4000)
      outbox = markAttempt(outbox, 'evt-001', 5000)
      assert.equal(outbox.entries[0].attemptCount, 3)
      assert.equal(outbox.entries[0].lastAttemptAtMs, 5000)
    })

    it('ignores unknown messageId without throwing', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      const result = markAttempt(outbox, 'evt-unknown', 3000)
      assert.equal(result.entries[0].attemptCount, 0)
    })

    it('does not mutate the original outbox', () => {
      let outbox = createEmptyOutbox()
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      markAttempt(outbox, 'evt-001', 3000)
      assert.equal(outbox.entries[0].attemptCount, 0)
    })
  })

  describe('multiple operations', () => {
    it('enqueue, acknowledge, and re-enqueue work correctly', () => {
      let outbox = createEmptyOutbox()

      // Add two messages
      outbox = enqueue(outbox, makeEnvelope('evt-001'))
      outbox = enqueue(outbox, makeEnvelope('evt-002'))
      assert.equal(listPending(outbox).length, 2)

      // Acknowledge first
      outbox = acknowledge(outbox, 'evt-001', 5000)
      assert.equal(listPending(outbox).length, 1)
      assert.equal(listPending(outbox)[0].messageId, 'evt-002')

      // Mark attempt on second
      outbox = markAttempt(outbox, 'evt-002', 6000)
      assert.equal(outbox.entries[1].attemptCount, 1)

      // Acknowledge second
      outbox = acknowledge(outbox, 'evt-002', 7000)
      assert.equal(listPending(outbox).length, 0)

      // New message after old ones are acknowledged
      outbox = enqueue(outbox, makeEnvelope('evt-003'))
      assert.equal(listPending(outbox).length, 1)
      assert.equal(listPending(outbox)[0].messageId, 'evt-003')
    })
  })
})
