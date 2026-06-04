import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { listPending } from '../src/domain/outbox.js'
import {
  createAssistSession,
  resolveLatestHelp,
} from '../src/pages/assist-session.js'

function createFakeStorage() {
  let outbox = null
  let eventHistory = []

  return {
    loadOutbox: () => outbox,
    saveOutbox: (value) => { outbox = value },
    loadEventHistory: () => eventHistory,
    saveEventHistory: (value) => { eventHistory = value },
  }
}

function createFakeClock(startAtMs = 1000000) {
  let atMs = startAtMs
  return {
    now: () => atMs,
    advance: (ms) => { atMs += ms },
  }
}

describe('assist-session', () => {
  let storage
  let clock

  beforeEach(() => {
    storage = createFakeStorage()
    clock = createFakeClock()
  })

  it('queues one manual help request and records display-safe history', () => {
    const session = createAssistSession({ storage, now: clock.now })

    const first = session.sendHelp()
    const second = session.sendHelp()

    assert.equal(first.envelope.type, 'help.requested')
    assert.equal(second.envelope.messageId, first.envelope.messageId)
    assert.equal(listPending(storage.loadOutbox()).length, 1)
    assert.equal(storage.loadEventHistory().length, 1)
    assert.equal(storage.loadEventHistory()[0].eventId, first.envelope.messageId)
    assert.equal(storage.loadEventHistory()[0].hasLocation, false)
    assert.equal('location' in storage.loadEventHistory()[0], false)
  })

  it('queues location update only after help was requested', () => {
    const session = createAssistSession({ storage, now: clock.now })

    assert.equal(session.sendLocationUpdate(39.9, 116.4).envelope, null)

    const help = session.sendHelp()
    const location = session.sendLocationUpdate(39.9, 116.4)
    const duplicateLocation = session.sendLocationUpdate(40.0, 116.5)

    assert.equal(location.envelope.type, 'help.location_updated')
    assert.equal(location.envelope.payload.helpMessageId, help.envelope.messageId)
    assert.deepEqual(location.envelope.payload.location, { lat: 39.9, lng: 116.4 })
    assert.equal(duplicateLocation.envelope.messageId, location.envelope.messageId)
    assert.equal(listPending(storage.loadOutbox()).length, 2)
    assert.equal(storage.loadEventHistory()[0].hasLocation, true)
  })

  it('resolves the latest help event exactly once', () => {
    const session = createAssistSession({ storage, now: clock.now })
    const help = session.sendHelp()
    clock.advance(5000)

    const first = resolveLatestHelp({ storage, now: clock.now })
    const second = resolveLatestHelp({ storage, now: clock.now })

    assert.equal(first.envelope.type, 'help.resolved')
    assert.equal(first.envelope.payload.resolvedMessageId, help.envelope.messageId)
    assert.equal(second.envelope, null)
    assert.equal(
      storage.loadOutbox().entries.filter(entry => entry.envelope.type === 'help.resolved').length,
      1,
    )
    assert.equal(storage.loadEventHistory()[0].status, 'resolved')
  })

  it('does not queue a resolution when no help request exists', () => {
    const result = resolveLatestHelp({ storage, now: clock.now })

    assert.equal(result.envelope, null)
    assert.equal(storage.loadOutbox(), null)
    assert.deepEqual(storage.loadEventHistory(), [])
  })
})
