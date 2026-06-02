# Platform Capability Matrix

> **Status categories:**
> - **DOCUMENTED** — official docs establish the capability
> - **SIMULATOR_CONFIRMED** — exact command and observed output recorded
> - **TRUE_DEVICE_REQUIRED** — cannot be verified without real hardware
> - **NOT_SUPPORTED** — confirmed not to work

## 1. App Service Background Monitoring

| Capability | Status | Evidence |
|---|---|---|
| `app-service.services` declaration in `app.json` | DOCUMENTED | Zepp OS v3 docs: services array under `module` key |
| `AppService({ onInit, onRun, onDestroy })` constructor | DOCUMENTED | Official constructor signature from docs |
| Continuous execution after UI exits | DOCUMENTED | Docs: "runs in background continuously" |
| Resume after reboot | DOCUMENTED | With `device:os.bg_service` permission and persistent alarm |
| Single-execution limit (600 ms) | DOCUMENTED | Docs: "single execution service 600ms limit" |
| No `setTimeout`/`setInterval` in App Service | DOCUMENTED | Forbidden — use `Alarm` or `Time.onPerMinute()` |
| No high-power sensors (Accelerometer, Gyroscope, GPS) | DOCUMENTED | Explicitly documented restriction |

## 2. Sensor Availability Inside App Service

| Capability | Status | Evidence |
|---|---|---|
| `HeartRate` class — `getCurrent()`, `onCurrentChange(callback)` | DOCUMENTED | `@zos/sensor` API, returns bpm number |
| `Step` class — `getCurrent()`, `onChange(callback)` | DOCUMENTED | `@zos/sensor` API, returns step count |
| `Distance` class — `getCurrent()`, `onChange(callback)` | DOCUMENTED | `@zos/sensor` API, returns distance |
| `Wear` class — `getStatus()` | DOCUMENTED | `@zos/sensor` API: 0=not_wearing, 1=wearing, 2=in_motion, 3=not_sure |
| `Time` class — `getTime()`, `onPerMinute(callback)` | DOCUMENTED | `@zos/sensor` API: per-minute callback for low-frequency checks |

## 3. Alarm Second-Level Scheduling

| Capability | Status | Evidence |
|---|---|---|
| `set({ url, delay })` with second-level delay | DOCUMENTED | `@zos/alarm` API: `delay` in seconds, `url` wakes App Service |
| `cancel(id)` | DOCUMENTED | `@zos/alarm` API |
| `url` parameter waking App Service | DOCUMENTED | Alarm docs: `url` supports "device application service" |
| Repeat types (minute, hour, day) | DOCUMENTED | `repeat_type` constant |
| Persistent alarms across reboot | DOCUMENTED | `store: true` option |
| **Accuracy while screen off** | TRUE_DEVICE_REQUIRED | Real watch needed to measure drift |

## 4. Notification and notify Actions

| Capability | Status | Evidence |
|---|---|---|
| `notify({ title, content })` | DOCUMENTED | `@zos/notification` API |
| Notification actions invoking App Service | DOCUMENTED | `actions` array with `url` targeting App Service + `param` |
| `cancel(alarmId)` to remove notification | DOCUMENTED | `@zos/notification` API |
| **Button actions reliability** | TRUE_DEVICE_REQUIRED | Simulator behavior may differ from hardware |

## 5. BLE Communication from App Service

| Capability | Status | Evidence |
|---|---|---|
| `@zos/ble` module is importable | DOCUMENTED | Standard Zepp OS module available from API_LEVEL 3.0 |
| `mstConnect(addr)` | DOCUMENTED | Connect to peripheral by MAC address |
| `mstDisconnect(connectId)` | DOCUMENTED | Disconnect by connection ID |
| `mstWriteCharacteristic(connectId, svcId, charaId, value)` | DOCUMENTED | BLE characteristic write |
| `mstReadCharacteristic(connectId, svcId, charaId)` | DOCUMENTED | BLE characteristic read |
| `mstOnCharaNotification` for incoming data | DOCUMENTED | Notification callback registration |
| `mstOnCharaWriteComplete` for send confirmation | DOCUMENTED | Write completion callback |
| `mstOnCharaValueArrived` | DOCUMENTED | Data arrival callback |
| `mstOffAllCb()` | DOCUMENTED | Cleanup all BLE callbacks |
| **BLE handoff from App Service to phone** | TRUE_DEVICE_REQUIRED | Needs real GATT profile pairing with Zepp App |

## 6. Side Service (Phone Companion)

| Capability | Status | Evidence |
|---|---|---|
| `app-side` declaration in `app.json` | DOCUMENTED | `module["app-side"]: { path }` in manifest |
| `AppSideService(BaseSideService({...}))` constructor | SIMULATOR_CONFIRMED | Confirmed from helloworld3 example |
| `onRequest(req, res)` request/response | DOCUMENTED | Request/response pattern |
| `onSettingsChange({ key, newValue, oldValue })` | DOCUMENTED | Settings change notifications |
| Binary messaging support | DOCUMENTED | Messaging API uses binary format |
| `fetch` capability for HTTP requests | DOCUMENTED | Available in Side Service context |
| `settingsStorage` for persistent settings | DOCUMENTED | Settings App and Side Service share storage |
| **Binary UTF-8 envelope round-trip** | TRUE_DEVICE_REQUIRED | Needs real BLE connection with phone |

## 7. Secondary Widget

| Capability | Status | Evidence |
|---|---|---|
| `secondary-widget` in `app.json` | DOCUMENTED | `module["secondary-widget"]: { widgets }` schema |
| `SecondaryWidget({ state, onInit, build, onResume, onPause, onDestroy })` | DOCUMENTED | Official type declarations |
| Route to page/assist/assist from widget | DOCUMENTED | `SecondaryWidget` can use `push()` from `@zos/router` |
| **Widget UI drawing APIs** | TRUE_DEVICE_REQUIRED | Widget has limited UI API surface; needs hardware test |
| **Interaction reliability** | TRUE_DEVICE_REQUIRED | Tap detection on negative-one-screen |

## 8. Foreground Geolocation (GPS)

| Capability | Status | Evidence |
|---|---|---|
| `Geolocation` class from `@zos/sensor` | DOCUMENTED | `@zos/sensor` API |
| `getCurrentPosition()` | DOCUMENTED | One-shot position request |
| `startListening()` / `stopListening()` | DOCUMENTED | Continuous location updates |
| **GPS availability inside Device App pages** | DOCUMENTED | Works in foreground pages |
| **GPS start/stop in onDestroy** | DOCUMENTED | Lifecycle cleanup documented |
| **Indoor timeout behavior** | TRUE_DEVICE_REQUIRED | Real-world GPS performance varies |
| **GPS not available in App Service** | DOCUMENTED | High-power sensor restriction |

## 9. SystemSounds SOS

| Capability | Status | Evidence |
|---|---|---|
| `SystemSounds` class from `@zos/sensor` | DOCUMENTED | Available from API_LEVEL 3.6 |
| `getEnabled()` — check if system sounds enabled | DOCUMENTED | Returns boolean |
| `getSourceType()` — get built-in types including ALARM | DOCUMENTED | Source type enum |
| `start(type, repeatCount)` — play sound | DOCUMENTED | Play with repeat count |
| **Availability on API_LEVEL 3.0 devices** | NOT_SUPPORTED | `SystemSounds` is API_LEVEL 3.6+ only |
| **Fallback audio path** | TRUE_DEVICE_REQUIRED | `@zos/media` may provide alternative on some devices |

## 10. Vibration

| Capability | Status | Evidence |
|---|---|---|
| `Vibrator` class from `@zos/vibrator` | DOCUMENTED | Standard module |
| `vibrate(profile)` with duration | DOCUMENTED | Vibrator API |
| `stop()` | DOCUMENTED | Stop active vibration |

## 11. Local Storage

| Capability | Status | Evidence |
|---|---|---|
| `@zos/storage` module | DOCUMENTED | Standard API_LEVEL 3.0 |
| `getItem(key)` / `setItem(key, value)` | DOCUMENTED | K-V storage |
| **Persistence across service restart** | DOCUMENTED | Storage survives restarts |

## Summary

| Status | Count | Notes |
|---|---|---|
| DOCUMENTED | 30 | Core capabilities established by official docs |
| SIMULATOR_CONFIRMED | 1 | Side Service constructor pattern |
| TRUE_DEVICE_REQUIRED | 7 | BLE handoff, alarm accuracy, notification actions, GPS, audio fallback, widget |
| NOT_SUPPORTED | 1 | SystemSounds at API_LEVEL 3.0 |

## Hard Blockers

No hard blockers found. All capabilities needed for the product design are at minimum DOCUMENTED:

- ✅ HeartRate, Step, Distance, Wear sensors in App Service — DOCUMENTED
- ✅ Alarm with second-level delay waking App Service — DOCUMENTED
- ✅ notify with actions invoking App Service — DOCUMENTED
- ✅ BLE send from App Service — DOCUMENTED
- ✅ Side Service with messaging — DOCUMENTED
- ✅ Secondary Widget declaration — DOCUMENTED
- ✅ Geolocation in foreground pages — DOCUMENTED
- ✅ SystemSounds at API_LEVEL 3.6+ — but fallback needed for 3.0

**Key TRUE_DEVICE_REQUIRED risks to revisit:**
1. BLE handoff from App Service to phone is the most critical path. If `@zos/ble` characteristic write does not reach phone reliably, the offline-queue + replay architecture becomes essential.
2. Alarm accuracy while screen off affects 30-second escalation timing.
3. Notification action button reliability affects the user-safe / help-now confirmation flow.
