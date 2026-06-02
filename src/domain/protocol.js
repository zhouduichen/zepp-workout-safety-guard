/**
 * @file Protocol for assistance message envelopes.
 *
 * Defines envelope creation, encoding (to UTF-8 JSON bytes for BLE transport),
 * and decoding with validation.
 *
 * Supported types:
 *   help.requested, help.location_updated, help.resolved, sync.outbox, sync.ack
 */

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

const SUPPORTED_TYPES = Object.freeze([
  'help.requested',
  'help.location_updated',
  'help.resolved',
  'sync.outbox',
  'sync.ack',
])

const CURRENT_SCHEMA_VERSION = 1

const FORBIDDEN_PAYLOAD_KEYS = Object.freeze([
  'rawHeartRateSamples',
  'contactPhoneNumbers',
])

const ALLOWED_ROOT_KEYS = Object.freeze([
  'schemaVersion',
  'messageId',
  'type',
  'occurredAtMs',
  'payload',
])

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function isValidType(type) {
  return typeof type === 'string' && SUPPORTED_TYPES.includes(type)
}

function hasForbiddenPayloadKeys(payload) {
  if (!payload || typeof payload !== 'object') return false
  return FORBIDDEN_PAYLOAD_KEYS.some(key => key in payload)
}

function hasUnknownRootKeys(obj) {
  const keys = Object.keys(obj)
  return keys.some(key => !ALLOWED_ROOT_KEYS.includes(key))
}

// ---------------------------------------------------------------------------
// createEnvelope
// ---------------------------------------------------------------------------

/**
 * Create a valid envelope object.
 *
 * @param {object} input
 * @param {string} input.messageId   - e.g. 'evt-1717300000000-0001'
 * @param {string} input.type        - one of SUPPORTED_TYPES
 * @param {number} input.occurredAtMs - epoch milliseconds
 * @param {object} input.payload     - free-form data (subject to blocklist)
 * @returns {object} envelope
 */
export function createEnvelope({ messageId, type, occurredAtMs, payload, ...rest }) {
  // Validate required fields
  if (!messageId) {
    throw new Error('required field messageId is missing')
  }
  if (!type) {
    throw new Error('required field type is missing')
  }
  if (occurredAtMs == null || !Number.isFinite(occurredAtMs)) {
    throw new Error('required field occurredAtMs is missing or invalid')
  }
  if (payload == null || typeof payload !== 'object') {
    throw new Error('required field payload is missing or invalid')
  }

  // Reject unknown root-level properties
  if (rest && Object.keys(rest).length > 0) {
    const extras = Object.keys(rest)
    throw new Error(`unknown root property: ${extras[0]}`)
  }

  // Validate type
  if (!isValidType(type)) {
    throw new Error(`unsupported type: ${type}`)
  }

  // Reject forbidden payload keys
  if (hasForbiddenPayloadKeys(payload)) {
    const found = FORBIDDEN_PAYLOAD_KEYS.find(key => key in payload)
    throw new Error(`payload must not contain ${found}`)
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    messageId,
    type,
    occurredAtMs,
    payload,
  }
}

// ---------------------------------------------------------------------------
// encodeEnvelope
// ---------------------------------------------------------------------------

/**
 * Encode an envelope to a Uint8Array of UTF-8 JSON bytes.
 *
 * The output is deterministic: same input always produces the same bytes.
 *
 * @param {object} envelope
 * @returns {Uint8Array}
 */
export function encodeEnvelope(envelope) {
  const json = JSON.stringify(envelope)
  return new TextEncoder().encode(json)
}

// ---------------------------------------------------------------------------
// decodeEnvelope
// ---------------------------------------------------------------------------

/**
 * Decode a Uint8Array of UTF-8 JSON bytes back into an envelope object.
 *
 * Validates the decoded structure and throws on invalid input.
 *
 * @param {Uint8Array} bytes
 * @returns {object} envelope
 */
export function decodeEnvelope(bytes) {
  let parsed
  try {
    const json = new TextDecoder().decode(bytes)
    parsed = JSON.parse(json)
  } catch {
    throw new Error('invalid JSON bytes')
  }

  // Check required fields
  const requiredFields = ['schemaVersion', 'messageId', 'type', 'occurredAtMs', 'payload']
  for (const field of requiredFields) {
    if (parsed[field] == null) {
      throw new Error(`required field ${field} is missing`)
    }
  }

  // Check schema version
  if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`unsupported schemaVersion: ${parsed.schemaVersion}`)
  }

  // Reject unknown root properties
  if (hasUnknownRootKeys(parsed)) {
    const unknownKey = Object.keys(parsed).find(key => !ALLOWED_ROOT_KEYS.includes(key))
    throw new Error(`unknown root property: ${unknownKey}`)
  }

  // Validate type
  if (!isValidType(parsed.type)) {
    throw new Error(`unsupported type: ${parsed.type}`)
  }

  // Reject forbidden payload keys
  if (hasForbiddenPayloadKeys(parsed.payload)) {
    const found = FORBIDDEN_PAYLOAD_KEYS.find(key => key in parsed.payload)
    throw new Error(`payload must not contain ${found}`)
  }

  return {
    schemaVersion: parsed.schemaVersion,
    messageId: parsed.messageId,
    type: parsed.type,
    occurredAtMs: parsed.occurredAtMs,
    payload: parsed.payload,
  }
}
