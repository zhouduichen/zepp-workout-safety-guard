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
