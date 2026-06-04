import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createBleAdapter } from '../src/device/zepp-ble.js'

function createFakeBle() {
  const writes = []
  const disconnects = []
  let notificationHandler = null
  return {
    writes,
    disconnects,
    mstWriteCharacteristic(connectId, serviceId, characteristicId, value) {
      writes.push({ connectId, serviceId, characteristicId, value })
      return 0
    },
    mstOnCharaNotification(callback) {
      notificationHandler = callback
    },
    mstDisconnect(connectId) {
      disconnects.push(connectId)
    },
    mstOffAllCb() {
      notificationHandler = null
    },
    emitNotification(connectId, serviceId, characteristicId, envelope) {
      const bytes = new TextEncoder().encode(JSON.stringify(envelope))
      notificationHandler(connectId, serviceId, characteristicId, bytes)
    },
  }
}

describe('zepp BLE adapter', () => {
  it('does not report send success without connection and characteristic configuration', () => {
    const ble = createFakeBle()
    const bridge = createBleAdapter({ ble })

    const sent = bridge.send(new Uint8Array([1, 2, 3]))

    assert.equal(sent, false)
    assert.equal(ble.writes.length, 0)
  })

  it('writes envelope bytes to the configured BLE characteristic', () => {
    const ble = createFakeBle()
    const bridge = createBleAdapter({
      ble,
      serviceId: 'svc-help',
      characteristicId: 'chara-outbox',
    })

    bridge.init('conn-1')
    const bytes = new Uint8Array([10, 20, 30])
    const sent = bridge.send(bytes)

    assert.equal(sent, true)
    assert.equal(ble.writes.length, 1)
    assert.deepEqual(ble.writes[0], {
      connectId: 'conn-1',
      serviceId: 'svc-help',
      characteristicId: 'chara-outbox',
      value: bytes,
    })
  })

  it('parses sync.ack notification envelopes', () => {
    const ble = createFakeBle()
    const bridge = createBleAdapter({ ble })
    const acknowledgements = []

    bridge.onAcknowledged((envelope) => acknowledgements.push(envelope))
    ble.emitNotification('conn-1', 'svc-help', 'chara-inbox', {
      schemaVersion: 1,
      messageId: 'ack-evt-1',
      type: 'sync.ack',
      occurredAtMs: 1000,
      payload: { ackMessageId: 'evt-1' },
    })
    ble.emitNotification('conn-1', 'svc-help', 'chara-inbox', {
      schemaVersion: 1,
      messageId: 'evt-2',
      type: 'help.requested',
      occurredAtMs: 1001,
      payload: {},
    })

    assert.equal(acknowledgements.length, 1)
    assert.equal(acknowledgements[0].payload.ackMessageId, 'evt-1')
  })

  it('cleans up notification callbacks and connection state', () => {
    const ble = createFakeBle()
    const bridge = createBleAdapter({
      ble,
      serviceId: 'svc-help',
      characteristicId: 'chara-outbox',
    })

    bridge.init('conn-1')
    assert.equal(bridge.isConnected(), true)

    bridge.disconnect()

    assert.equal(bridge.isConnected(), false)
    assert.deepEqual(ble.disconnects, ['conn-1'])
    assert.equal(bridge.send(new Uint8Array([1])), false)
  })
})
