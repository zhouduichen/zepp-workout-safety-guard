/**
 * app-side/protocol.js — Side Service protocol helpers.
 *
 * Validates incoming binary envelopes from the watch, deduplicates
 * by messageId, and acknowledges accepted envelopes.
 *
 * This is a pure module with no @zos imports for testability.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_SCHEMA_VERSION = 1

const SUPPORTED_TYPES = Object.freeze([
  'help.requested',
  'help.location_updated',
  'help.resolved',
  'sync.outbox',
  'sync.ack',
])

const ALLOWED_ROOT_KEYS = Object.freeze([
  'schemaVersion',
  'messageId',
  'type',
  'occurredAtMs',
  'payload',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a key is in the supported message types list.
 */
export function isSupportedType(type) {
  return SUPPORTED_TYPES.includes(type)
}

/**
 * Check if any unknown root-level keys exist.
 */
export function hasUnknownRootKeys(obj) {
  return Object.keys(obj).some(key => !ALLOWED_ROOT_KEYS.includes(key))
}

// ---------------------------------------------------------------------------
// decodeAndValidate
// ---------------------------------------------------------------------------

/**
 * Decode UTF-8 bytes into a buffer, parse JSON, and validate the envelope.
 *
 * @param {Uint8Array|ArrayBuffer} bytes - raw binary from watch
 * @returns {{ valid: true, envelope: object } | { valid: false, error: string }}
 */
export function decodeAndValidate(bytes) {
  // Handle ArrayBuffer
  const buf = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes

  // Decode UTF-8
  let parsed
  try {
    const json = new TextDecoder().decode(buf)
    parsed = JSON.parse(json)
  } catch {
    return { valid: false, error: 'invalid_json' }
  }

  // Check required fields
  const requiredFields = ['schemaVersion', 'messageId', 'type', 'occurredAtMs', 'payload']
  for (const field of requiredFields) {
    if (parsed[field] == null) {
      return { valid: false, error: `missing_field:${field}` }
    }
  }

  // Check schema version
  if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return { valid: false, error: `unsupported_schema_version:${parsed.schemaVersion}` }
  }

  // Reject unknown root properties
  if (hasUnknownRootKeys(parsed)) {
    return { valid: false, error: 'unknown_root_keys' }
  }

  // Validate message type
  if (!isSupportedType(parsed.type)) {
    return { valid: false, error: `unsupported_type:${parsed.type}` }
  }

  return {
    valid: true,
    envelope: {
      schemaVersion: parsed.schemaVersion,
      messageId: parsed.messageId,
      type: parsed.type,
      occurredAtMs: parsed.occurredAtMs,
      payload: parsed.payload,
    },
  }
}

// ---------------------------------------------------------------------------
// createAckEnvelope
// ---------------------------------------------------------------------------

/**
 * Create an acknowledgement envelope for a given messageId.
 *
 * @param {string} messageId - the message being acknowledged
 * @param {number} occurredAtMs - timestamp
 * @returns {object} acknowledgement envelope
 */
export function createAckEnvelope(messageId, occurredAtMs) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    messageId: `ack-${messageId}`,
    type: 'sync.ack',
    occurredAtMs,
    payload: { ackMessageId: messageId },
  }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Create a deduplication set for tracking seen message IDs.
 *
 * @returns {{ has: (id: string) => boolean, add: (id: string) => void, clear: () => void }}
 */
export function createDedupSet() {
  const seen = new Set()
  return {
    has(id) {
      return seen.has(id)
    },
    add(id) {
      seen.add(id)
    },
    clear() {
      seen.clear()
    },
  }
}

// ---------------------------------------------------------------------------
// Delivery result helpers
// ---------------------------------------------------------------------------

/**
 * Create a display-safe delivery result suitable for settingsStorage.
 *
 * @param {object} result
 * @param {string} result.sms_status
 * @param {string} result.voice_status
 * @param {string} envelopeType
 * @param {string} envelopeId
 * @returns {string} JSON string safe for storage
 */
export function serializeDeliveryResult({ sms_status, voice_status }, envelopeType, envelopeId) {
  return JSON.stringify({
    type: envelopeType,
    messageId: envelopeId,
    sms_status,
    voice_status,
    processedAt: Date.now(),
  })
}
