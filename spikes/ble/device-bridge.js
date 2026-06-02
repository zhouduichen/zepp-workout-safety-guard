/**
 * device-bridge.js — Platform spike: BLE bridge from App Service
 *
 * Verifies: @zos/ble API surface for connecting, sending, and
 * disconnecting from a phone-side GATT server.
 *
 * Reference: https://docs.zepp.com/docs/reference/device-app-api/newAPI/ble/send/
 *
 * Status: DOCUMENTED — cannot test BLE without paired phone.
 */

// In a real App Service file:
// import { mstConnect, mstDisconnect, mstOnCharaWriteComplete,
//          mstOnCharaNotification, mstOffAllCb,
//          mstWriteCharacteristic } from '@zos/ble'

/*
 * Flow:
 * 1. Connect to phone using known peer address or scanning
 * 2. Build GATT profile with service/characteristic UUIDs
 * 3. Write UTF-8 encoded JSON envelope to characteristic
 * 4. Handle write complete callback
 * 5. Handle incoming notifications (acknowledgement)
 * 6. Cleanup on destroy
 */

// Bridge interface (intended adapter shape):
// {
//   isConnected(),
//   send(bytes),
//   onAcknowledged(callback),
//   disconnect(),
// }

// @zos/ble API notes:
// - mstConnect(macAddress) → connectId
// - mstWriteCharacteristic(connectId, svcId, charaId, value) → result
// - mstOnCharaWriteComplete(callback) — write confirmation
// - mstOnCharaNotification(callback) — incoming data
// - mstOffAllCb() — remove all callbacks
// - mstDisconnect(connectId)

// Connection state must be stored in App Service state.
// GATT service/characteristic UUIDs must be agreed with phone Side Service.
