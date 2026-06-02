# BLE Bridge Spike

## Purpose

Verify `@zos/ble` API availability and patterns for handoff from watch App Service to phone Side Service.

## Key Findings

### API Surface (from @zos/ble)

| Function | Purpose |
|---|---|
| `mstConnect(addr)` | Connect to BLE peripheral |
| `mstDisconnect(connectId)` | Disconnect |
| `mstWriteCharacteristic(connId, svcId, charId, value)` | Send binary data |
| `mstReadCharacteristic(connId, svcId, charId)` | Read data |
| `mstOnCharaWriteComplete(cb)` | Write confirmation callback |
| `mstOnCharaNotification(cb)` | Incoming notification |
| `mstOnCharaValueArrived(cb)` | Incoming data |
| `mstOffAllCb()` | Remove all BLE callbacks |
| `mstBuildProfile(profile)` | Build GATT profile |
| `mstPrepare(profile)` | Prepare connection profile |

### Handoff Strategy

Watch → Phone:
1. Watch App Service constructs a JSON envelope
2. UTF-8 encode to bytes
3. Write to a known GATT characteristic via `mstWriteCharacteristic`
4. Phone Side Service receives via Messaging API

Phone → Watch (ACK):
1. Phone writes ACK to another characteristic
2. Watch receives via `mstOnCharaNotification`
3. Service marks message as acknowledged in outbox

### Critical Questions

- **GATT UUID negotiation**: Watch and phone must agree on service/characteristic UUIDs. These can be private (custom) UUIDs since both ends are our code.
- **Connection management**: The watch is already BLE-connected to the phone for normal Zepp App communication. Can we use the existing connection, or must we create a new GATT profile?
- **Reliability**: What happens when the phone is out of range? BLE write will fail, and the message must remain in the outbox.

### Remaining Uncertainty

- Exact GATT profile setup required for custom data channel
- Whether `mstConnect` can use a cached connection or must scan first
- Real-world latency and reliability of characteristic writes

**Status: DOCUMENTED** — Requires real paired phone for TRUE_DEVICE_CONFIRMED.
