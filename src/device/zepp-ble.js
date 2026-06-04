/**
 * Zepp OS BLE bridge adapter.
 * Wraps @zos/ble for sending UTF-8 envelope bytes to phone Side Service.
 *
 * The GATT service/characteristic IDs must be agreed with the phone Side
 * Service implementation. Without them, send() fails closed.
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

export function createBleAdapter(options = {}) {
  const ble = options.ble || _ble
  const logger = options.logger || _logger
  const serviceId = options.serviceId
  const characteristicId = options.characteristicId
  const decoder = options.textDecoder || (typeof TextDecoder !== 'undefined' ? new TextDecoder() : null)

  /**
   * Register BLE notification listener for incoming ACK messages.
   * @param {function} callback - called with decoded envelope objects
   */
  function onAcknowledged(callback) {
    if (!ble || typeof ble.mstOnCharaNotification !== 'function' || !decoder) return
    try {
      ble.mstOnCharaNotification((connectId, svcId, charaId, value) => {
        try {
          const json = decoder.decode(value)
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
    if (!ble || !_connectId || !serviceId || !characteristicId) return false
    try {
      if (typeof ble.mstWriteCharacteristic !== 'function') return false
      ble.mstWriteCharacteristic(_connectId, serviceId, characteristicId, bytes)
      if (logger) logger.log('ble send:', bytes.length, 'bytes')
      return true
    } catch (e) {
      if (logger) logger.log('ble send failed')
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
    if (_connectId != null && ble) {
      try {
        ble.mstDisconnect(_connectId)
      } catch {}
    }
    _connectId = null
    _isConnected = false
  }

  function cleanup() {
    if (ble) {
      try { ble.mstOffAllCb() } catch {}
    }
    _connectId = null
    _isConnected = false
  }

  return { onAcknowledged, send, isConnected, init, disconnect, cleanup }
}
