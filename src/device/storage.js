/**
 * Local storage adapter for guard state and outbox persistence.
 * Wraps @zos/storage with JSON serialization.
 */
let _storage = null

try {
  _storage = require('@zos/storage')
} catch {
  // Fallback for test environment
}

export function saveGuardState(state) {
  try {
    const json = JSON.stringify(state)
    _storage.setItem('guard_state', json)
  } catch {}
}

export function loadGuardState() {
  try {
    const raw = _storage.getItem('guard_state')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveOutbox(outbox) {
  try {
    const json = JSON.stringify(outbox)
    _storage.setItem('guard_outbox', json)
  } catch {}
}

export function loadOutbox() {
  try {
    const raw = _storage.getItem('guard_outbox')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Event history persistence
// ---------------------------------------------------------------------------

const HISTORY_KEY = 'guard_history'
const MAX_HISTORY_ENTRIES = 20

export function saveEventHistory(entries) {
  try {
    // Trim to max
    const trimmed = entries.slice(0, MAX_HISTORY_ENTRIES)
    const json = JSON.stringify(trimmed)
    _storage.setItem(HISTORY_KEY, json)
  } catch {}
}

export function loadEventHistory() {
  try {
    const raw = _storage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearEventHistory() {
  try {
    _storage.setItem(HISTORY_KEY, '[]')
  } catch {}
}
