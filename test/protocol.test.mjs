import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createEnvelope,
  encodeEnvelope,
  decodeEnvelope,
} from '../src/domain/protocol.js'

const VALID_ARGS = {
  messageId: 'evt-1717300000000-0001',
  type: 'help.requested',
  occurredAtMs: 1717300000000,
  payload: { trigger: 'automatic_high_risk', offlineReplay: false, location: null },
}

const VALID_TYPES = [
  'help.requested',
  'help.location_updated',
  'help.resolved',
  'sync.outbox',
  'sync.ack',
]

describe('protocol', () => {
  describe('createEnvelope', () => {
    it('sets schemaVersion to 1', () => {
      const envelope = createEnvelope(VALID_ARGS)
      assert.equal(envelope.schemaVersion, 1)
    })

    it('copies messageId from input', () => {
      const envelope = createEnvelope(VALID_ARGS)
      assert.equal(envelope.messageId, VALID_ARGS.messageId)
    })

    it('copies type from input', () => {
      const envelope = createEnvelope(VALID_ARGS)
      assert.equal(envelope.type, VALID_ARGS.type)
    })

    it('copies occurredAtMs from input', () => {
      const envelope = createEnvelope(VALID_ARGS)
      assert.equal(envelope.occurredAtMs, VALID_ARGS.occurredAtMs)
    })

    it('copies payload from input', () => {
      const envelope = createEnvelope(VALID_ARGS)
      assert.deepEqual(envelope.payload, VALID_ARGS.payload)
    })

    it('supports all valid types', () => {
      for (const type of VALID_TYPES) {
        const envelope = createEnvelope({ ...VALID_ARGS, type })
        assert.equal(envelope.type, type)
      }
    })

    it('rejects unknown type', () => {
      assert.throws(() => {
        createEnvelope({ ...VALID_ARGS, type: 'unknown.type' })
      }, /unsupported type/i)
    })

    it('rejects payload with rawHeartRateSamples', () => {
      assert.throws(() => {
        createEnvelope({
          ...VALID_ARGS,
          payload: { rawHeartRateSamples: [80, 85, 90] },
        })
      }, /rawHeartRateSamples/i)
    })

    it('rejects payload with contactPhoneNumbers', () => {
      assert.throws(() => {
        createEnvelope({
          ...VALID_ARGS,
          payload: { contactPhoneNumbers: ['1234567890'] },
        })
      }, /contactPhoneNumbers/i)
    })

    it('rejects unknown root-level properties', () => {
      assert.throws(() => {
        createEnvelope({
          ...VALID_ARGS,
          extraField: 'bad',
        })
      }, /unknown root property/i)
    })

    it('rejects missing messageId', () => {
      assert.throws(() => {
        createEnvelope({ ...VALID_ARGS, messageId: undefined })
      }, /messageId/i)
    })

    it('rejects missing type', () => {
      assert.throws(() => {
        createEnvelope({ ...VALID_ARGS, type: undefined })
      }, /type/i)
    })

    it('rejects missing occurredAtMs', () => {
      assert.throws(() => {
        createEnvelope({ ...VALID_ARGS, occurredAtMs: undefined })
      }, /occurredAtMs/i)
    })

    it('rejects missing payload', () => {
      assert.throws(() => {
        createEnvelope({ ...VALID_ARGS, payload: undefined })
      }, /payload/i)
    })
  })

  describe('encodeEnvelope', () => {
    it('produces a Uint8Array', () => {
      const envelope = createEnvelope(VALID_ARGS)
      const bytes = encodeEnvelope(envelope)
      assert.ok(bytes instanceof Uint8Array)
    })

    it('produces valid UTF-8 JSON bytes', () => {
      const envelope = createEnvelope(VALID_ARGS)
      const bytes = encodeEnvelope(envelope)
      const decoded = new TextDecoder().decode(bytes)
      const parsed = JSON.parse(decoded)
      assert.equal(parsed.schemaVersion, 1)
      assert.equal(parsed.messageId, VALID_ARGS.messageId)
    })

    it('produces deterministic output for same input', () => {
      const envelope = createEnvelope(VALID_ARGS)
      const bytes1 = encodeEnvelope(envelope)
      const bytes2 = encodeEnvelope(envelope)
      assert.deepEqual(bytes1, bytes2)
    })

    it('encodes with schemaVersion field present', () => {
      const envelope = createEnvelope(VALID_ARGS)
      const json = new TextDecoder().decode(encodeEnvelope(envelope))
      const parsed = JSON.parse(json)
      assert.equal(parsed.schemaVersion, 1)
    })
  })

  describe('decodeEnvelope', () => {
    it('round-trips a valid envelope correctly', () => {
      const envelope = createEnvelope(VALID_ARGS)
      const bytes = encodeEnvelope(envelope)
      const decoded = decodeEnvelope(bytes)
      assert.equal(decoded.schemaVersion, 1)
      assert.equal(decoded.messageId, VALID_ARGS.messageId)
      assert.equal(decoded.type, VALID_ARGS.type)
      assert.equal(decoded.occurredAtMs, VALID_ARGS.occurredAtMs)
      assert.deepEqual(decoded.payload, VALID_ARGS.payload)
    })

    it('rejects envelope with rawHeartRateSamples in payload', () => {
      const rawJson = JSON.stringify({
        schemaVersion: 1,
        messageId: 'evt-test',
        type: 'help.requested',
        occurredAtMs: 1000,
        payload: { rawHeartRateSamples: [80] },
      })
      const rawBytes = new TextEncoder().encode(rawJson)
      assert.throws(() => decodeEnvelope(rawBytes), /rawHeartRateSamples/i)
    })

    it('rejects envelope with contactPhoneNumbers in payload', () => {
      const rawJson = JSON.stringify({
        schemaVersion: 1,
        messageId: 'evt-test',
        type: 'help.requested',
        occurredAtMs: 1000,
        payload: { contactPhoneNumbers: ['123'] },
      })
      const rawBytes = new TextEncoder().encode(rawJson)
      assert.throws(() => decodeEnvelope(rawBytes), /contactPhoneNumbers/i)
    })

    it('rejects envelope with unknown root properties', () => {
      const rawJson = JSON.stringify({
        schemaVersion: 1,
        messageId: 'evt-test',
        type: 'help.requested',
        occurredAtMs: 1000,
        payload: {},
        extraField: 'bad',
      })
      const rawBytes = new TextEncoder().encode(rawJson)
      assert.throws(() => decodeEnvelope(rawBytes), /unknown root property/i)
    })

    it('throws on invalid JSON bytes', () => {
      const badBytes = new Uint8Array([0xff, 0xfe, 0x00, 0x01])
      assert.throws(() => decodeEnvelope(badBytes), /invalid/i)
    })

    it('throws on missing required fields', () => {
      const missingFields = [
        {},
        { schemaVersion: 1 },
        { schemaVersion: 1, messageId: 'x' },
        { schemaVersion: 1, messageId: 'x', type: 'help.requested' },
        { schemaVersion: 1, messageId: 'x', type: 'help.requested', occurredAtMs: 1000 },
      ]
      for (const obj of missingFields) {
        const bytes = new TextEncoder().encode(JSON.stringify(obj))
        assert.throws(() => decodeEnvelope(bytes), /required/i)
      }
    })

    it('rejects envelope with wrong schemaVersion', () => {
      const rawJson = JSON.stringify({
        schemaVersion: 99,
        messageId: 'evt-test',
        type: 'help.requested',
        occurredAtMs: 1000,
        payload: {},
      })
      const rawBytes = new TextEncoder().encode(rawJson)
      assert.throws(() => decodeEnvelope(rawBytes), /schemaVersion/i)
    })

    it('rejects envelope with unsupported type', () => {
      const rawJson = JSON.stringify({
        schemaVersion: 1,
        messageId: 'evt-test',
        type: 'unknown.type',
        occurredAtMs: 1000,
        payload: {},
      })
      const rawBytes = new TextEncoder().encode(rawJson)
      assert.throws(() => decodeEnvelope(rawBytes), /unsupported type/i)
    })
  })
})
