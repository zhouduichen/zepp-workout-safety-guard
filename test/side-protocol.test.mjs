/**
 * test/side-protocol.test.mjs — Tests for app-side protocol helpers.
 *
 * Covers envelope validation, deduplication, ACK generation,
 * and demo dispatcher behaviour.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  decodeAndValidate,
  createAckEnvelope,
  createDedupSet,
  isSupportedType,
  serializeDeliveryResult,
} from '../app-side/protocol.js'

import { demoDispatch } from '../app-side/demo-dispatcher.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_ENVELOPE_BYTES = new TextEncoder().encode(JSON.stringify({
  schemaVersion: 1,
  messageId: 'evt-1717300000000-0001',
  type: 'help.requested',
  occurredAtMs: 1717300000000,
  payload: { trigger: 'automatic_high_risk', offlineReplay: false, location: null },
}))

const VALID_TYPES = [
  'help.requested',
  'help.location_updated',
  'help.resolved',
  'sync.outbox',
  'sync.ack',
]

// ---------------------------------------------------------------------------
// Tests: isSupportedType
// ---------------------------------------------------------------------------

describe('isSupportedType', () => {
  it('returns true for help.requested', () => {
    assert.equal(isSupportedType('help.requested'), true)
  })

  it('returns true for help.location_updated', () => {
    assert.equal(isSupportedType('help.location_updated'), true)
  })

  it('returns true for help.resolved', () => {
    assert.equal(isSupportedType('help.resolved'), true)
  })

  it('returns true for sync.outbox', () => {
    assert.equal(isSupportedType('sync.outbox'), true)
  })

  it('returns true for sync.ack', () => {
    assert.equal(isSupportedType('sync.ack'), true)
  })

  it('returns false for unknown type', () => {
    assert.equal(isSupportedType('unknown.type'), false)
  })

  it('returns false for empty string', () => {
    assert.equal(isSupportedType(''), false)
  })
})

// ---------------------------------------------------------------------------
// Tests: decodeAndValidate
// ---------------------------------------------------------------------------

describe('decodeAndValidate', () => {
  it('decodes and validates a valid envelope', () => {
    const result = decodeAndValidate(VALID_ENVELOPE_BYTES)
    assert.equal(result.valid, true)
    assert.equal(result.envelope.schemaVersion, 1)
    assert.equal(result.envelope.messageId, 'evt-1717300000000-0001')
    assert.equal(result.envelope.type, 'help.requested')
    assert.equal(result.envelope.occurredAtMs, 1717300000000)
    assert.deepEqual(result.envelope.payload, {
      trigger: 'automatic_high_risk',
      offlineReplay: false,
      location: null,
    })
  })

  it('rejects invalid JSON bytes', () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x00, 0x01])
    const result = decodeAndValidate(bytes)
    assert.equal(result.valid, false)
    assert.ok(result.error.includes('invalid_json'))
  })

  it('rejects envelope with missing schemaVersion', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({
      messageId: 'x',
      type: 'help.requested',
      occurredAtMs: 1000,
      payload: {},
    }))
    const result = decodeAndValidate(bytes)
    assert.equal(result.valid, false)
    assert.ok(result.error.includes('missing_field'))
  })

  it('rejects envelope with missing messageId', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({
      schemaVersion: 1,
      type: 'help.requested',
      occurredAtMs: 1000,
      payload: {},
    }))
    const result = decodeAndValidate(bytes)
    assert.equal(result.valid, false)
    assert.ok(result.error.includes('missing_field'))
  })

  it('rejects envelope with unsupported schemaVersion', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({
      schemaVersion: 99,
      messageId: 'x',
      type: 'help.requested',
      occurredAtMs: 1000,
      payload: {},
    }))
    const result = decodeAndValidate(bytes)
    assert.equal(result.valid, false)
    assert.ok(result.error.includes('unsupported_schema_version'))
  })

  it('rejects envelope with unsupported type', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({
      schemaVersion: 1,
      messageId: 'x',
      type: 'unknown.type',
      occurredAtMs: 1000,
      payload: {},
    }))
    const result = decodeAndValidate(bytes)
    assert.equal(result.valid, false)
    assert.ok(result.error.includes('unsupported_type'))
  })

  it('rejects envelope with unknown root keys', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({
      schemaVersion: 1,
      messageId: 'x',
      type: 'help.requested',
      occurredAtMs: 1000,
      payload: {},
      extraField: 'bad',
    }))
    const result = decodeAndValidate(bytes)
    assert.equal(result.valid, false)
    assert.ok(result.error.includes('unknown_root_keys'))
  })

  it('handles all valid envelope types', () => {
    for (const type of VALID_TYPES) {
      const envelopePayload = JSON.stringify({
        schemaVersion: 1,
        messageId: 'evt-' + type,
        type,
        occurredAtMs: 2000,
        payload: {},
      })
      const bytes = new TextEncoder().encode(envelopePayload)
      const result = decodeAndValidate(bytes)
      assert.equal(result.valid, true, `type ${type} should be valid`)
      assert.equal(result.envelope.type, type)
    }
  })

  it('handles ArrayBuffer input', () => {
    const buffer = VALID_ENVELOPE_BYTES.buffer.slice(
      VALID_ENVELOPE_BYTES.byteOffset,
      VALID_ENVELOPE_BYTES.byteOffset + VALID_ENVELOPE_BYTES.byteLength,
    )
    const result = decodeAndValidate(buffer)
    assert.equal(result.valid, true)
    assert.equal(result.envelope.messageId, 'evt-1717300000000-0001')
  })
})

// ---------------------------------------------------------------------------
// Tests: createAckEnvelope
// ---------------------------------------------------------------------------

describe('createAckEnvelope', () => {
  it('creates an ack envelope with correct type', () => {
    const ack = createAckEnvelope('evt-123', 1717300000000)
    assert.equal(ack.type, 'sync.ack')
    assert.equal(ack.schemaVersion, 1)
  })

  it('creates messageId prefixed with ack-', () => {
    const ack = createAckEnvelope('evt-123', 1717300000000)
    assert.equal(ack.messageId, 'ack-evt-123')
  })

  it('includes original messageId in payload', () => {
    const ack = createAckEnvelope('evt-123', 1717300000000)
    assert.equal(ack.payload.ackMessageId, 'evt-123')
  })

  it('sets occurredAtMs from the parameter', () => {
    const ack = createAckEnvelope('evt-123', 987654321000)
    assert.equal(ack.occurredAtMs, 987654321000)
  })
})

// ---------------------------------------------------------------------------
// Tests: createDedupSet
// ---------------------------------------------------------------------------

describe('createDedupSet', () => {
  it('returns false for unseen id', () => {
    const ds = createDedupSet()
    assert.equal(ds.has('evt-123'), false)
  })

  it('returns true after add', () => {
    const ds = createDedupSet()
    ds.add('evt-123')
    assert.equal(ds.has('evt-123'), true)
  })

  it('tracks multiple ids independently', () => {
    const ds = createDedupSet()
    ds.add('evt-1')
    ds.add('evt-2')
    assert.equal(ds.has('evt-1'), true)
    assert.equal(ds.has('evt-2'), true)
    assert.equal(ds.has('evt-3'), false)
  })

  it('clear removes all ids', () => {
    const ds = createDedupSet()
    ds.add('evt-1')
    ds.add('evt-2')
    ds.clear()
    assert.equal(ds.has('evt-1'), false)
    assert.equal(ds.has('evt-2'), false)
  })

  it('is idempotent on repeated add', () => {
    const ds = createDedupSet()
    ds.add('evt-1')
    ds.add('evt-1')
    assert.equal(ds.has('evt-1'), true)
  })
})

// ---------------------------------------------------------------------------
// Tests: serializeDeliveryResult
// ---------------------------------------------------------------------------

describe('serializeDeliveryResult', () => {
  it('produces valid JSON string', () => {
    const result = { sms_status: 'simulated', voice_status: 'simulated' }
    const str = serializeDeliveryResult(result, 'help.requested', 'evt-123')
    const parsed = JSON.parse(str)
    assert.equal(parsed.sms_status, 'simulated')
    assert.equal(parsed.voice_status, 'simulated')
    assert.equal(parsed.type, 'help.requested')
    assert.equal(parsed.messageId, 'evt-123')
  })

  it('includes processedAt timestamp', () => {
    const result = { sms_status: 'simulated', voice_status: 'simulated' }
    const str = serializeDeliveryResult(result, 'help.requested', 'evt-123')
    const parsed = JSON.parse(str)
    assert.ok(typeof parsed.processedAt === 'number')
    assert.ok(parsed.processedAt > 0)
  })
})

// ---------------------------------------------------------------------------
// Tests: demoDispatch
// ---------------------------------------------------------------------------

describe('demoDispatch', () => {
  it('returns simulated sms_status', () => {
    const result = demoDispatch({ type: 'help.requested', messageId: 'evt-1' })
    assert.equal(result.sms_status, 'simulated')
  })

  it('returns simulated voice_status', () => {
    const result = demoDispatch({ type: 'help.requested', messageId: 'evt-1' })
    assert.equal(result.voice_status, 'simulated')
  })

  it('returns deterministic result for same input', () => {
    const input = { type: 'help.requested', messageId: 'evt-1', payload: {} }
    const r1 = demoDispatch(input)
    const r2 = demoDispatch(input)
    assert.deepEqual(r1, r2)
  })

  it('never returns real contact status values', () => {
    const result = demoDispatch({ type: 'help.requested', messageId: 'evt-1' })
    // These are the only allowed values for the demo dispatcher
    assert.ok(result.sms_status === 'simulated' || result.sms_status === 'failed')
    assert.ok(result.voice_status === 'simulated' || result.voice_status === 'failed')
  })
})
