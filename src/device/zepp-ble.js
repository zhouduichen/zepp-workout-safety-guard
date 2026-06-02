/**
 * Zepp OS BLE bridge adapter.
 * Wraps @zos/ble for sending UTF-8 envelope bytes to phone Side Service.
 *
 * This adapter is a thin placeholder. The GATT service/characteristic UUIDs
 * must be agreed with the phone Side Service implementation.
 *
 * BLE connection management (mstConnect/mstDisconnect) is handled by the
 * Zepp App — this adapter assumes an existing connection and focuses on
 * characteristic writes and notification handling.
 */
let _ble = null
let _logger = null

try {
  _ble = require('@zos/ble')
  _logger = require('@zos/utils').log
} catch {}

let _isConnected = false
let _connectId = null

export function createBleAdapter() {
  /**
   * Register BLE notification listener for incoming ACK messages.
   * @param {function} callback - called with decoded envelope objects
   */
  function onAcknowledged(callback) {
    if (!_ble) return
    try {
      _ble.mstOnCharaNotification((connectId, svcId, charaId, value) => {
        try {
          const json = new TextDecoder().decode(value)
          const envelope = JSON.parse(json)
          if (envelope.type === 'sync.ack') {
            callback(envelope)
          }
        } catch {}
      })
    } catch {}
  }

  /**
   * Send UTF-8 bytes to phone via BLE characteristic write.
   * @param {Uint8Array} bytes
   * @returns {boolean} true if send was attempted
   */
  function send(bytes) {
    if (!_ble || !_connectId) return false
    try {
      // Write to agreed characteristic UUIDs
      // _ble.mstWriteCharacteristic(_connectId, svcId, charaId, bytes)
      if (_logger) _logger.log('ble send:', bytes.length, 'bytes')
      return true
    } catch (e) {
      if (_logger) _logger.log('ble send failed')
      _isConnected = false
      return false
    }
  }

  function isConnected() {
    return _isConnected
  }

  /**
   * Initialize BLE connection state.
   * In a real environment, this would connect or check existing connection.
   */
  function init(connectId) {
    _connectId = connectId
    _isConnected = true
  }

  function disconnect() {
    if (_connectId != null && _ble) {
      try {
        _ble.mstDisconnect(_connectId)
      } catch {}
    }
    _connectId = null
    _isConnected = false
  }

  function cleanup() {
    if (_ble) {
      try { _ble.mstOffAllCb() } catch {}
    }
    _connectId = null
    _isConnected = false
  }

  return { onAcknowledged, send, isConnected, init, disconnect, cleanup }
}
