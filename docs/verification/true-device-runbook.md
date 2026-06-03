# True-Device Runbook

Use this checklist when validating on a physical Zepp OS watch (API_LEVEL 3.0+).

## Device Info

| Field | Value |
|-------|-------|
| Model | |
| Zepp OS API level | |
| Firmware version | |
| Test date | |
| Tester | |

## Background Service

- [ ] Background permission grant works
- [ ] Background permission denial handled gracefully
- [ ] Service starts after permission granted
- [ ] Service continues after watch UI exits (press home button)
- [ ] Service restarts after watch reboot
- [ ] Service restarts after app update

## Sensors

- [ ] HeartRate `onCurrentChange` fires at expected cadence (1-5s intervals)
- [ ] Step `onChange` fires on movement
- [ ] Distance `onChange` fires on movement
- [ ] Wear `onChange` reports correct status (0=not_worn, 1=worn, 2=motion, 3=unsure)
- [ ] `Time.onPerMinute` fires reliably each minute

## Alarm

- [ ] 30-second alarm fires on time (±5s)
- [ ] 60-second alarm fires on time (±5s)
- [ ] Alarm wakes App Service (app-service/guard-service executed)
- [ ] Persistent alarm survives reboot (`store: true`)

## Notification

- [ ] `notify()` displays title and content
- [ ] Notification actions (buttons) appear
- [ ] "我没事" button triggers USER_SAFE_CONFIRMED
- [ ] "联系家人" button triggers USER_HELP_NOW
- [ ] "我已休息" button triggers USER_REST_REQUESTED
- [ ] Multiple taps do not duplicate events

## Vibration & Sound

- [ ] Gentle vibration (100ms) works
- [ ] Urgent vibration (500ms) works
- [ ] Local alarm vibration (1000ms) works
- [ ] SystemSounds ALARM plays (if API_LEVEL ≥ 3.6)
- [ ] Graceful degradation to vibration-only on API_LEVEL 3.0

## BLE & Phone Connection

- [ ] BLE characteristic write reaches phone
- [ ] Phone Side Service receives envelope
- [ ] Side Service returns ACK
- [ ] BLE disconnect detected by App Service
- [ ] Reconnect and outbox flush works
- [ ] No duplicate notifications on reconnect

## GPS (Foreground Only)

- [ ] GPS starts when assist page opens
- [ ] GPS does not block help delivery
- [ ] GPS timeout handled gracefully
- [ ] GPS stopped on page close (onDestroy)
- [ ] GPS stopped on cancel
- [ ] GPS stopped on help sent

## Secondary Widget

- [ ] Widget appears on negative-one-screen
- [ ] Widget shows guard status
- [ ] Widget navigates to assist page

## Battery

- [ ] 60-minute observation without significant drain
- [ ] Battery drain < 5% per hour during normal operation

## False Alert Observations

| Scenario | Alert Triggered? | Expected? | Notes |
|----------|-----------------|-----------|-------|
| Normal run (30 min) | Y / N | N | |
| Normal walk (15 min) | Y / N | N | |
| Traffic light stop (<60s) | Y / N | N | |
| Rest break (3-5 min) | Y / N | Maybe (prompt) | |
| Watch removal | Y / N | N (no contact) | |
| Loose wear (missing HR) | Y / N | N | |
| Phone disconnect | Y / N | N | |
