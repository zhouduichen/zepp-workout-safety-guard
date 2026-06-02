# Workout Safety Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Zepp OS v3 Mini Program that detects potentially dangerous unresponsive states during sustained activity, alerts the wearer locally, and queues or sends emergency-contact assistance requests without claiming to detect cardiac arrest.

**Architecture:** Keep medical-risk logic in a pure JavaScript reducer with injected timestamps and configuration. Put every Zepp OS API behind thin device adapters, use an `App Service` for background monitoring, use `Alarm` rather than background timers for delayed escalation, and use a versioned BLE event protocol to hand requests to the Zepp App `Side Service`. Keep real SMS and voice delivery disabled until true-device calibration, legal review, and a production backend are complete.

**Tech Stack:** Zepp OS Mini Program v3, JavaScript ES modules, Node.js built-in test runner, `@zeppos/device-types`, `@zeppos/zml`, Zeus CLI, Zepp OS `App Service`, `Alarm`, `notify`, sensor, BLE, `Settings App`, and `Side Service` APIs.

---

## 1. How To Use This Handoff

This document is intentionally split into small, reviewable tasks. Give only one task prompt to an implementation AI at a time. Require that AI to:

1. Read the design spec and this task only.
2. Inspect the current repository before editing.
3. Write failing tests before implementation whenever the task contains domain logic.
4. Run the task's verification commands.
5. Commit only the files created or modified by that task.
6. Return the commit hash, test output summary, and any unresolved platform uncertainty.
7. Stop after the task. Do not proceed automatically.

Repository:

```text
D:\huami\zepp-workout-safety-guard
```

Design spec:

```text
docs/superpowers/specs/2026-06-02-workout-safety-guard-design.md
```

Closest local Zepp OS reference:

```text
D:\huami\zepp-jogging-metronome
```

Local ZML examples:

```text
D:\huami\zepp-stretch-coach\node_modules\@zeppos\zml\examples
```

Windows note: PowerShell script execution is disabled on this machine. Use `zeus.cmd`, not `zeus`.

## 2. Non-Negotiable Safety Rules

These constraints are release blockers, not suggestions:

1. The app may describe a state as `potentially dangerous`, `movement anomaly`, or `user unresponsive`. It must not claim to detect cardiac arrest, sudden death, arrhythmia, or falls.
2. A single high heart-rate sample must never contact family members.
3. Missing heart-rate samples must never contact family members by themselves.
4. A Bluetooth disconnection must never contact family members by itself.
5. Removing the watch must pause risk detection. It may display a reminder after `5 minutes`; it must not contact family members.
6. High heart rate while the user remains active may trigger a gentle intensity warning only.
7. Automatic contact dispatch remains disabled in production settings until true-device calibration, sports-medicine review, and legal review are complete.
8. The development and simulator builds must use a demo dispatcher that never sends SMS messages or places calls.
9. GPS may run only from a foreground assistance page opened by the user. Never start `Geolocation` from `App Service`.
10. Do not use `Accelerometer`, `Geolocation`, or `Gyroscope` from `App Service`.
11. Do not use `setTimeout`, `setInterval`, or UI APIs inside `App Service`. Use `Alarm` for second-level delayed wakeups and `Time.onPerMinute()` for low-frequency checks.
12. Do not implement automatic emergency-service dialing. Only expose an optional manual `Open phone` action when the target device supports the system phone app.
13. Every assistance event must have an idempotency key. Reconnect, service restart, duplicate alarms, and retries must not notify contacts twice.
14. Do not log raw contact phone numbers, exact GPS coordinates, or sensitive health samples in production logs.

## 3. Platform Facts To Preserve

Official documentation currently establishes:

| Platform fact | Consequence |
| --- | --- |
| `App Service` continues after the watch UI exits and can resume after reboot while continuously running | Background monitoring is viable after one-time user permission |
| Continuous `App Service` needs `device:os.bg_service` and explicit user permission | Onboarding must request and explain this permission |
| `App Service` cannot use timers or high-power sensors | Delayed escalation uses `Alarm`; GPS stays in foreground pages |
| `App Service` may use low-power sensors such as `HeartRate`, audio playback APIs, notifications, and most `@zos/ble` APIs including `send` | Local alerting and a BLE handoff adapter are technically possible |
| A single-execution service awakened by alarm or notification has a `600 ms` execution limit | Alarm handlers must be short: load state, append effects, persist state, send or queue messages, and exit |
| Device App and Side Service communicate over BLE; Side Service and servers communicate through Fetch | Remote contact assistance requires a nearby connected phone |
| The Side Service messaging API is binary | Serialize a small versioned JSON envelope to UTF-8 bytes |
| `secondary-widget` exists in `app.json` | A negative-one-screen shortcut is possible but still needs simulator and true-device validation |

Primary documentation:

- [App Service](https://docs.zepp.com/docs/guides/framework/device/app-service/)
- [Mini Program Configuration](https://docs.zepp.com/docs/reference/app-json/)
- [Overall Architecture](https://docs.zepp.com/docs/guides/architecture/arc/)
- [Messaging API](https://docs.zepp.com/docs/reference/side-service-api/messaging/)
- [BLE send](https://docs.zepp.com/docs/reference/device-app-api/newAPI/ble/send/)
- [Alarm set](https://docs.zepp.com/zh-cn/docs/reference/device-app-api/newAPI/alarm/set/)
- [Notification notify](https://docs.zepp.com/zh-cn/docs/reference/device-app-api/newAPI/notification/notify/)

## 4. Target File Structure

Create focused files with one responsibility each:

```text
app.js
app.json
global.d.ts
jsconfig.json
package.json

app-service/
  guard-service.js

app-side/
  index.js
  demo-dispatcher.js
  protocol.js

secondary-widget/
  index.js

setting/
  index.js

page/
  common.r.layout.js
  common.s.layout.js
  home/
    home.js
    home.r.layout.js
    home.s.layout.js
  onboarding/
    onboarding.js
    onboarding.r.layout.js
    onboarding.s.layout.js
  assist/
    assist.js
    assist.r.layout.js
    assist.s.layout.js
  history/
    history.js
    history.r.layout.js
    history.s.layout.js

src/
  domain/
    constants.js
    default-config.js
    protocol.js
    risk-engine.js
    outbox.js
  device/
    service-controller.js
    storage.js
    zepp-alarm.js
    zepp-alerts.js
    zepp-ble.js
    zepp-sensors.js
  pages/
    assist-controller.js

assets/
  gt.r/
    icon.png
    secondary-preview.png
  gt.s/
    icon.png
    secondary-preview.png

scripts/
  validate-project.mjs
  simulate-scenarios.mjs

test/
  default-config.test.mjs
  risk-engine.test.mjs
  outbox.test.mjs
  service-controller.test.mjs
  protocol.test.mjs
  assist-controller.test.mjs

docs/
  verification/
    platform-capability-matrix.md
    true-device-runbook.md
    calibration-log-template.md
```

## 5. Domain Contracts

Use these names consistently across tasks.

### 5.1 Guard states

```js
export const GuardStatus = Object.freeze({
  STANDBY: 'STANDBY',
  ACTIVE_GUARD: 'ACTIVE_GUARD',
  NOT_WORN: 'NOT_WORN',
  REST_PAUSED: 'REST_PAUSED',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  LOCAL_ALARM: 'LOCAL_ALARM',
})
```

### 5.2 Input events

```js
export const InputType = Object.freeze({
  TICK: 'TICK',
  STEP_CHANGED: 'STEP_CHANGED',
  DISTANCE_CHANGED: 'DISTANCE_CHANGED',
  HEART_RATE_SAMPLE: 'HEART_RATE_SAMPLE',
  WEAR_CHANGED: 'WEAR_CHANGED',
  PHONE_CONNECTION_CHANGED: 'PHONE_CONNECTION_CHANGED',
  ESCALATION_ALARM_FIRED: 'ESCALATION_ALARM_FIRED',
  USER_SAFE_REQUESTED: 'USER_SAFE_REQUESTED',
  USER_SAFE_CONFIRMED: 'USER_SAFE_CONFIRMED',
  USER_REST_REQUESTED: 'USER_REST_REQUESTED',
  USER_HELP_REQUESTED: 'USER_HELP_REQUESTED',
  USER_HELP_NOW: 'USER_HELP_NOW',
  USER_RESOLVED: 'USER_RESOLVED',
})
```

Every input event uses:

```js
{
  type: InputType.TICK,
  atMs: 1717300000000,
  payload: {}
}
```

Never call `Date.now()` inside the reducer. Inject `atMs`.

### 5.3 Output effects

```js
export const EffectType = Object.freeze({
  VIBRATE_GENTLE: 'VIBRATE_GENTLE',
  VIBRATE_URGENT: 'VIBRATE_URGENT',
  NOTIFY_INTENSITY: 'NOTIFY_INTENSITY',
  NOTIFY_CONFIRMATION: 'NOTIFY_CONFIRMATION',
  NOTIFY_GUARD_PAUSED: 'NOTIFY_GUARD_PAUSED',
  SCHEDULE_ESCALATION_ALARM: 'SCHEDULE_ESCALATION_ALARM',
  CANCEL_ESCALATION_ALARM: 'CANCEL_ESCALATION_ALARM',
  QUEUE_HELP_REQUEST: 'QUEUE_HELP_REQUEST',
  QUEUE_RESOLUTION: 'QUEUE_RESOLUTION',
  START_LOCAL_ALARM: 'START_LOCAL_ALARM',
  STOP_LOCAL_ALARM: 'STOP_LOCAL_ALARM',
  LOG_EVENT: 'LOG_EVENT',
})
```

### 5.4 Default development configuration

This is a deterministic development configuration, not a medical recommendation:

```js
export const developmentConfig = Object.freeze({
  activityEvidenceWindowSec: 120,
  standbyReturnSec: 600,
  intensitySustainSec: 180,
  suddenStopSec: 30,
  ordinaryStopPromptSec: 180,
  ordinaryStopHelpSec: 600,
  notWornPromptSec: 300,
  restPauseSec: 600,
  highRiskConfirmSec: 30,
  mediumRiskConfirmSec: 60,
  safeCooldownSec: 300,
  minHeartRateSamples: 3,
  intensityAlertBpm: 170,
  highRiskCandidateBpm: 190,
  autoContactDispatch: false,
  dispatcherMode: 'demo',
})
```

Keep `autoContactDispatch: false` and `dispatcherMode: 'demo'` in every committed default configuration until calibration and legal approval are documented.

### 5.5 Assistance protocol

BLE and Side Service payloads use:

```js
{
  schemaVersion: 1,
  messageId: 'evt-1717300000000-0001',
  type: 'help.requested',
  occurredAtMs: 1717300000000,
  payload: {
    trigger: 'automatic_high_risk',
    offlineReplay: false,
    location: null,
  }
}
```

Supported `type` values:

```text
help.requested
help.location_updated
help.resolved
sync.outbox
sync.ack
```

The first release must not send raw heart-rate history to the phone backend. The trigger category and event time are sufficient.

---

### Task 0: Bootstrap The Independent Repository

**Files:**
- Create: `package.json`
- Create: `app.js`
- Create: `app.json`
- Create: `global.d.ts`
- Create: `jsconfig.json`
- Create: `scripts/validate-project.mjs`
- Create: `page/common.r.layout.js`
- Create: `page/common.s.layout.js`
- Create: `page/home/home.js`
- Create: `page/home/home.r.layout.js`
- Create: `page/home/home.s.layout.js`
- Create: `assets/gt.r/icon.png`
- Create: `assets/gt.s/icon.png`

**AI execution prompt:**

```text
You are implementing Task 0 only in D:\huami\zepp-workout-safety-guard.

Read:
- docs/superpowers/specs/2026-06-02-workout-safety-guard-design.md
- docs/superpowers/plans/2026-06-02-workout-safety-guard-implementation.md
- D:\huami\zepp-jogging-metronome\app.json
- D:\huami\zepp-jogging-metronome\app.js

Create the smallest Zepp OS v3 Device App skeleton that builds and opens a home page. Use development appId 9999999. Target API 3.0. Add only these initial permissions: data:os.device.info, device:os.local_storage, data:user.hd.heart_rate, data:user.hd.distance, device:os.bg_service.

Do not add App Service, BLE, GPS, Side Service, Settings App, Secondary Widget, medical logic, or copied assets from unrelated projects yet. Use simple generated development icon PNG files for round and square targets and a text-only home page showing the product name and the label "Development skeleton".

Add package scripts:
- test: node --test test/*.test.mjs
- validate: node scripts/validate-project.mjs
- build: zeus.cmd build

The validator must fail when app.json is invalid JSON, appId is missing, or the page list is empty. It must print "validation passed" on success.

Run npm install, npm run validate, and npm run build. Commit only Task 0 files with message:
chore: scaffold workout safety guard

Stop after reporting the commit hash and command results.
```

- [ ] **Step 1: Create the minimal skeleton**
- [ ] **Step 2: Install local dependencies**

Run:

```powershell
npm install
```

Expected: `package-lock.json` and `node_modules` are created.

- [ ] **Step 3: Validate**

Run:

```powershell
npm run validate
```

Expected:

```text
validation passed
```

- [ ] **Step 4: Build**

Run:

```powershell
npm run build
```

Expected: Zeus produces a ZAB build artifact. If login or simulator state blocks the command, capture the exact Zeus output and keep the skeleton validation passing.

- [ ] **Step 5: Commit**

```powershell
git add app.js app.json global.d.ts jsconfig.json package.json package-lock.json scripts page assets
git commit -m "chore: scaffold workout safety guard"
```

---

### Task 1: Run Platform Feasibility Spikes Before Product Integration

**Files:**
- Create: `docs/verification/platform-capability-matrix.md`
- Create: `spikes/app-service/demo-service.js`
- Create: `spikes/app-service/README.md`
- Create: `spikes/ble/device-bridge.js`
- Create: `spikes/ble/README.md`
- Create: `spikes/secondary-widget/index.js`
- Create: `spikes/secondary-widget/README.md`
- Create: `spikes/foreground-gps/README.md`

**AI execution prompt:**

```text
You are implementing Task 1 only in D:\huami\zepp-workout-safety-guard.

This is a platform feasibility task. Do not write product risk logic. Read the official Zepp OS docs linked in section 3 of the implementation plan and inspect the current app.json before editing.

Create isolated spike files and a platform capability matrix. Verify or document the exact official signatures and manifest declarations for:
1. app-service.services with AppService({ onInit, onRun, onDestroy })
2. continuous service permission device:os.bg_service and its request flow
3. Alarm set/cancel with second-level delay waking an App Service
4. notify actions invoking an App Service file
5. HeartRate, Step, Distance, Wear, and Time.onPerMinute availability inside App Service
6. @zos/ble createConnect, connectStatus, addListener, send, removeListener, disConnect availability inside App Service
7. Side Service binary messaging and fetch capability
8. secondary-widget app.json declaration and its route-opening behavior
9. foreground Geolocation start/stop lifecycle
10. SystemSounds SOS and @zos/media fallback availability by API level

The matrix must classify every capability as:
- DOCUMENTED
- SIMULATOR_CONFIRMED
- TRUE_DEVICE_REQUIRED
- NOT_SUPPORTED

Use DOCUMENTED when official docs establish the capability but no simulator or watch was exercised. Never upgrade a capability to SIMULATOR_CONFIRMED without recording the exact command and observed output.

Important:
- Do not assume ZML BasePage can run inside App Service.
- Prefer a thin @zos/ble adapter in App Service and the Side Service Messaging API on the phone side.
- Record that a single-execution App Service has a 600 ms limit.
- Record that App Service timers and high-power sensors are forbidden.
- Record that app-service reload configuration starts at API_LEVEL 4.0 and must not be added to the API_LEVEL 3.0 manifest.

Add spike declarations to app.json only while validating them, and keep each declaration minimal. If simulator access is not available, leave the status DOCUMENTED or TRUE_DEVICE_REQUIRED and explain the remaining uncertainty.

Run npm run validate and npm run build. Commit the matrix and spike files with:
docs: add Zepp platform capability spikes

Stop after reporting the matrix summary, commit hash, and any capability that blocks the rest of the plan.
```

- [ ] **Step 1: Verify official signatures and manifest declarations**
- [ ] **Step 2: Record the capability matrix**
- [ ] **Step 3: Build the spike configuration**

Run:

```powershell
npm run validate
npm run build
```

Expected: validation passes; build either succeeds or produces an exact Zeus environment blocker.

- [ ] **Step 4: Stop if a hard blocker exists**

Hard blockers:

- `HeartRate`, `Step`, `Distance`, or `Wear` cannot be used in continuously running `App Service`.
- `Alarm` cannot wake a registered `App Service` after a second-level delay.
- `notify` cannot invoke a service action.
- No BLE handoff can be made from `App Service` to the Zepp App Side Service.

If BLE handoff is blocked, continue only with a revised scope: background local alerts plus queued requests synchronized when the foreground app opens.

- [ ] **Step 5: Commit**

```powershell
git add app.json docs/verification spikes
git commit -m "docs: add Zepp platform capability spikes"
```

---

### Task 2: Implement The Pure Risk Engine With TDD

**Files:**
- Create: `src/domain/constants.js`
- Create: `src/domain/default-config.js`
- Create: `src/domain/risk-engine.js`
- Create: `test/default-config.test.mjs`
- Create: `test/risk-engine.test.mjs`

**AI execution prompt:**

```text
You are implementing Task 2 only in D:\huami\zepp-workout-safety-guard.

Implement a pure JavaScript risk reducer. It must import no @zos modules and call no wall-clock API. Read sections 2, 5, and 6 of the implementation plan.

Export:
- createInitialGuardState(atMs)
- reduceGuard(state, input, config)

reduceGuard returns:
{
  state,
  effects
}

Use immutable state updates. Store enough rolling state to determine:
- sustained activity evidence
- last movement timestamp
- last valid heart-rate timestamp
- recent heart-rate samples
- worn state
- confirmation episode
- rest pause
- safe cooldown
- connection state

Write failing tests first for:
1. sustained movement for 120 seconds enters ACTIVE_GUARD
2. high heart rate while movement continues emits an intensity warning only
3. one high heart-rate sample never queues help
4. stale heart rate alone never queues help
5. not-worn state pauses risk evaluation and emits only a five-minute reminder
6. sudden stop plus sustained abnormal heart rate creates AWAITING_CONFIRMATION and a 30-second escalation alarm effect
7. alarm fire for the active episode queues help and starts the local alarm
8. a stale or duplicated alarm id is ignored
9. medium risk escalates only after 60 seconds
10. ordinary stillness prompts at 3 minutes and escalates only after 10 minutes without response
11. safe confirmation cancels the alarm and starts a cooldown
12. rest request pauses stillness detection for 10 minutes
13. manual help request enters confirmation without requiring sensor evidence
14. help-now queues immediately

Use a deterministic developmentConfig with autoContactDispatch false and dispatcherMode demo. Do not implement age-derived thresholds yet.

The reducer must never emit QUEUE_HELP_REQUEST from a single high heart rate, missing heart rate, Bluetooth disconnect, or NOT_WORN input alone.

Run npm test. Commit with:
feat: add pure workout risk engine

Stop after reporting the commit hash and passing test count.
```

- [ ] **Step 1: Write failing tests**

Use a helper shaped like:

```js
function apply(state, config, type, atMs, payload = {}) {
  return reduceGuard(state, { type, atMs, payload }, config)
}
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```powershell
npm test
```

Expected: tests fail because domain files are not implemented.

- [ ] **Step 3: Implement the reducer**

Implementation rules:

- Prune heart-rate samples outside the configured risk window.
- Validate heart-rate samples with `Number.isFinite(bpm) && bpm > 0`.
- Give each confirmation episode a unique deterministic id derived from injected time plus a counter.
- Associate every scheduled alarm with the episode id.
- Ignore duplicate alarm delivery after state has already escalated or resolved.
- Emit effects; never perform side effects inside the reducer.

- [ ] **Step 4: Run tests**

```powershell
npm test
```

Expected: all risk-engine tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/domain test
git commit -m "feat: add pure workout risk engine"
```

---

### Task 3: Implement The Idempotent Offline Outbox

**Files:**
- Create: `src/domain/protocol.js`
- Create: `src/domain/outbox.js`
- Create: `test/protocol.test.mjs`
- Create: `test/outbox.test.mjs`

**AI execution prompt:**

```text
You are implementing Task 3 only in D:\huami\zepp-workout-safety-guard.

Build a pure JavaScript outbox for assistance messages. Read section 5.5 of the implementation plan.

Export:
- createEnvelope({ messageId, type, occurredAtMs, payload })
- encodeEnvelope(envelope)
- decodeEnvelope(bytes)
- createEmptyOutbox()
- enqueue(outbox, envelope)
- acknowledge(outbox, messageId, acknowledgedAtMs)
- listPending(outbox)
- markAttempt(outbox, messageId, attemptedAtMs)

Requirements:
- schemaVersion is exactly 1
- supported types are help.requested, help.location_updated, help.resolved, sync.outbox, sync.ack
- enqueue is idempotent by messageId
- acknowledge is idempotent
- order remains first-in-first-out
- retry metadata is stored without duplicating the envelope
- JSON UTF-8 encoding is deterministic enough for BLE transport
- reject envelopes containing rawHeartRateSamples, contactPhoneNumbers, or arbitrary unknown root properties

Write tests before implementation. Run npm test. Commit with:
feat: add idempotent assistance outbox

Stop after reporting the commit hash and passing test count.
```

- [ ] **Step 1: Write failing protocol and outbox tests**
- [ ] **Step 2: Confirm tests fail**

```powershell
npm test
```

- [ ] **Step 3: Implement protocol and outbox**
- [ ] **Step 4: Confirm tests pass**

```powershell
npm test
```

- [ ] **Step 5: Commit**

```powershell
git add src/domain test
git commit -m "feat: add idempotent assistance outbox"
```

---

### Task 4: Implement A Testable Service Controller

**Files:**
- Create: `src/device/service-controller.js`
- Create: `test/service-controller.test.mjs`

**AI execution prompt:**

```text
You are implementing Task 4 only in D:\huami\zepp-workout-safety-guard.

Create a framework-independent service controller that wires ports to the pure risk engine. Do not import any @zos module in this task.

Constructor:
createServiceController({
  config,
  storage,
  alerts,
  alarm,
  bridge,
  now,
})

Expose:
- start()
- stop()
- handleInput(input)
- handleEscalationAlarm({ episodeId, atMs })
- flushOutbox()

Port responsibilities:
- storage.loadGuardState(), saveGuardState(state), loadOutbox(), saveOutbox(outbox)
- alerts.apply(effect)
- alarm.schedule({ episodeId, delaySec }), cancel({ episodeId })
- bridge.isConnected(), send(envelope)
- now()

For every engine effect:
- execute local alert effects immediately through alerts
- persist queue effects through the outbox
- attempt BLE send only when bridge.isConnected() is true
- retain queued messages until sync.ack
- schedule and cancel escalation alarms through the alarm port

Write tests first using in-memory fake ports. Cover:
1. state persistence after every handled input
2. queued help remains pending offline
3. queued help sends once online
4. reconnect flush does not duplicate messages
5. duplicate alarm delivery does not duplicate help
6. ack removes pending delivery
7. local alarm starts even when phone is offline
8. resolution is queued only after a previously sent or queued help request

Run npm test. Commit with:
feat: add background guard service controller

Stop after reporting the commit hash and passing test count.
```

- [ ] **Step 1: Write fake-port tests**
- [ ] **Step 2: Confirm tests fail**

```powershell
npm test
```

- [ ] **Step 3: Implement the controller**
- [ ] **Step 4: Confirm tests pass**

```powershell
npm test
```

- [ ] **Step 5: Commit**

```powershell
git add src/device test
git commit -m "feat: add background guard service controller"
```

---

### Task 5: Add Zepp OS Device Adapters And Register App Service

**Files:**
- Create: `src/device/storage.js`
- Create: `src/device/zepp-sensors.js`
- Create: `src/device/zepp-alarm.js`
- Create: `src/device/zepp-alerts.js`
- Create: `src/device/zepp-ble.js`
- Create: `app-service/guard-service.js`
- Modify: `app.json`
- Modify: `scripts/validate-project.mjs`

**AI execution prompt:**

```text
You are implementing Task 5 only in D:\huami\zepp-workout-safety-guard.

Read the platform capability matrix from Task 1 before coding. Implement thin Zepp OS adapters and register app-service/guard-service. Do not change the domain reducer.

Required behavior:
- instantiate HeartRate, Step, Distance, Wear, and Time adapters only in zepp-sensors.js
- subscribe once during AppService onInit
- unsubscribe in onDestroy
- dispatch TICK from Time.onPerMinute
- translate callbacks into domain inputs with timestamps
- use @zos/alarm to schedule second-level escalation wakeups
- use @zos/notification notify for confirmation actions
- use vibration for gentle and urgent effects
- use @zos/ble through a small bridge adapter for UTF-8 envelope bytes
- persist guard state and outbox using local storage
- keep alarm wake handlers short because single execution has a 600 ms limit

Manifest:
- keep API_LEVEL 3.0 compatibility
- add app-service.services ["app-service/guard-service"]
- retain device:os.bg_service
- do not add reload because reload requires API_LEVEL 4.0
- do not add accelerometer, gyroscope, or background geolocation

Notification actions:
- user.safe.requested invokes the App Service and asks for a second confirmation
- user.safe.confirmed invokes the App Service and cancels the episode
- user.help.now invokes the App Service and queues help immediately

Do not rely on long-press events inside a system notification.

System SOS audio:
- capability-gate SystemSounds
- if the Task 1 spike did not prove an audio fallback path, fall back to urgent vibration only
- do not invent an unsupported media path

Run npm test, npm run validate, and npm run build. Commit with:
feat: integrate Zepp background guard service

Stop after reporting commit hash, test output, build output, and every adapter behavior still marked TRUE_DEVICE_REQUIRED.
```

- [ ] **Step 1: Implement local storage and sensor adapters**
- [ ] **Step 2: Implement Alarm, notification, vibration, and BLE adapters**
- [ ] **Step 3: Register App Service**
- [ ] **Step 4: Validate**

```powershell
npm test
npm run validate
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add app.json app-service src/device scripts
git commit -m "feat: integrate Zepp background guard service"
```

---

### Task 6: Add First-Run Onboarding And Background Permission Control

**Files:**
- Create: `page/onboarding/onboarding.js`
- Create: `page/onboarding/onboarding.r.layout.js`
- Create: `page/onboarding/onboarding.s.layout.js`
- Modify: `page/home/home.js`
- Modify: `page/home/home.r.layout.js`
- Modify: `page/home/home.s.layout.js`
- Modify: `app.json`

**AI execution prompt:**

```text
You are implementing Task 6 only in D:\huami\zepp-workout-safety-guard.

Add a first-run onboarding flow and a minimal home dashboard. Follow the existing imperative createWidget pattern from D:\huami\zepp-jogging-metronome.

Onboarding pages must explain:
1. This is movement-anomaly assistance, not a medical device.
2. It cannot detect cardiac arrest or falls.
3. It needs background-service permission.
4. GPS runs only when the user actively opens the assistance page.
5. A nearby connected phone is required to notify contacts.
6. Offline behavior is local alerting plus deferred replay.
7. Contacts are configured in the Zepp App Settings App.
8. A training exercise is required before enabling the guard.

Use the official @zos/app-service queryPermission, requestPermission, and start flow for device:os.bg_service. Start the guard service only after permission succeeds and the training marker is stored.

The final onboarding step must run an inline practice alert inside the onboarding page. It must:
- display a visible 30-second practice countdown
- exercise the same cancellation wording used by the assistance flow
- never enqueue help
- never start GPS
- never attempt BLE delivery
- store trainingComplete only after the user completes or cancels the rehearsal

Home dashboard:
- Auto guard enabled or disabled
- Remote assistance online or offline-local-only
- Contact configuration count 0 to 3
- Pending outbox count
- Button: I feel unwell
- Button: Practice alert
- Button: Event history

Keep Chinese and English copy in separate exported objects so localization can be added cleanly. Add both round and square layouts. Do not add animated decoration or medical claims.

Run npm test, npm run validate, and npm run build. Commit with:
feat: add safety onboarding and home dashboard

Stop after reporting commit hash and screenshots or simulator notes if available.
```

- [ ] **Step 1: Implement onboarding copy and permission flow**
- [ ] **Step 2: Implement home status dashboard**
- [ ] **Step 3: Register routes**
- [ ] **Step 4: Validate and build**

```powershell
npm test
npm run validate
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add app.json page
git commit -m "feat: add safety onboarding and home dashboard"
```

---

### Task 7: Add Foreground Assistance Page And Temporary GPS

**Files:**
- Create: `src/pages/assist-controller.js`
- Create: `page/assist/assist.js`
- Create: `page/assist/assist.r.layout.js`
- Create: `page/assist/assist.s.layout.js`
- Create: `test/assist-controller.test.mjs`
- Modify: `app.json`

**AI execution prompt:**

```text
You are implementing Task 7 only in D:\huami\zepp-workout-safety-guard.

Implement the foreground assistance page and a pure assist-controller. This page is opened only by an active user from the app or shortcut card.

Required UI:
- large 30-second countdown
- connection state: phone online or offline local alert only
- button: Contact family now
- button: Open phone for emergency call, shown only after checkSystemApp confirms SYSTEM_APP_PHONE
- cancel interaction

GPS behavior:
- start Geolocation only after this foreground page opens
- never block help delivery while waiting for GPS
- send help.requested first
- when a coordinate later arrives, queue help.location_updated
- stop Geolocation in every completion, cancellation, and onDestroy path
- treat GPS timeout or failure as a normal degraded state

Cancellation:
- First verify in official docs or a spike whether the foreground widget events support a reliable press-and-hold gesture.
- If confirmed, implement a visible two-second hold progress.
- If not confirmed, implement two-step cancellation: tap "Cancel request", then tap "Confirm I am safe".
- Do not simulate a hold with an unsupported event.

The assist-controller must be pure and unit-tested with injected clock callbacks. Cover countdown expiration, immediate help, cancellation, GPS update after initial send, GPS failure, and cleanup idempotency.

Run npm test, npm run validate, and npm run build. Commit with:
feat: add foreground assistance flow

Stop after reporting commit hash, tests, build output, and which cancel interaction was implemented.
```

- [ ] **Step 1: Write assist-controller tests**
- [ ] **Step 2: Implement pure assist controller**
- [ ] **Step 3: Implement foreground page and temporary GPS**
- [ ] **Step 4: Validate and build**

```powershell
npm test
npm run validate
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add app.json src/pages page/assist test
git commit -m "feat: add foreground assistance flow"
```

---

### Task 8: Add Event History And Local Resolution

**Files:**
- Create: `page/history/history.js`
- Create: `page/history/history.r.layout.js`
- Create: `page/history/history.s.layout.js`
- Modify: `app.json`
- Modify: `src/device/storage.js`
- Modify: `src/device/service-controller.js`
- Modify: `test/service-controller.test.mjs`

**AI execution prompt:**

```text
You are implementing Task 8 only in D:\huami\zepp-workout-safety-guard.

Add a local event history page and resolution flow.

Persist only:
- event id
- trigger category
- occurredAtMs
- delivery status: queued, acknowledged, resolved
- whether it was replayed after offline operation
- whether a recent location exists, without displaying exact coordinates in history

Do not persist raw heart-rate history or contact phone numbers.

History UI:
- newest events first
- maximum 20 retained events
- clear-history action with confirmation
- unresolved events visibly distinct
- action: Mark safe and send resolution

When resolution is recorded after help was queued or sent, enqueue exactly one help.resolved envelope. Repeated taps must not duplicate it.

Write or update tests before implementation. Run npm test, npm run validate, and npm run build. Commit with:
feat: add assistance event history

Stop after reporting commit hash and verification results.
```

- [ ] **Step 1: Extend tests for persisted history and idempotent resolution**
- [ ] **Step 2: Implement storage and controller updates**
- [ ] **Step 3: Implement history page**
- [ ] **Step 4: Validate and build**
- [ ] **Step 5: Commit**

```powershell
git add app.json page/history src/device test
git commit -m "feat: add assistance event history"
```

---

### Task 9: Add The Secondary Widget Shortcut

**Files:**
- Create: `secondary-widget/index.js`
- Create: `assets/gt.r/secondary-preview.png`
- Create: `assets/gt.s/secondary-preview.png`
- Modify: `app.json`
- Modify: `docs/verification/platform-capability-matrix.md`

**AI execution prompt:**

```text
You are implementing Task 9 only in D:\huami\zepp-workout-safety-guard.

Add the Zepp OS secondary-widget shortcut declared in app.json. Follow the official app.json secondary-widget.widgets schema exactly and confirm the runtime API from official documentation or the Task 1 spike.

Widget content:
- product name
- guard enabled or disabled
- phone online or offline
- large entry point: I feel unwell

The widget must route to page/assist/assist. It must not perform GPS, BLE dispatch, or risk evaluation itself.

Add preview PNG assets for supported screen variants. Update the capability matrix with build and simulator observations.

Run npm test, npm run validate, and npm run build. Commit with:
feat: add emergency shortcut widget

Stop after reporting commit hash, build output, and whether simulator interaction was confirmed or still requires a real watch.
```

- [ ] **Step 1: Add the widget declaration and files**
- [ ] **Step 2: Validate and build**

```powershell
npm test
npm run validate
npm run build
```

- [ ] **Step 3: Commit**

```powershell
git add app.json secondary-widget assets docs/verification/platform-capability-matrix.md
git commit -m "feat: add emergency shortcut widget"
```

---

### Task 10: Add Settings App, Side Service, And Demo Dispatcher

**Files:**
- Create: `setting/index.js`
- Create: `app-side/index.js`
- Create: `app-side/protocol.js`
- Create: `app-side/demo-dispatcher.js`
- Modify: `app.json`
- Create: `test/side-protocol.test.mjs`

**AI execution prompt:**

```text
You are implementing Task 10 only in D:\huami\zepp-workout-safety-guard.

Add the Zepp App Settings App and Side Service. Inspect:
- D:\huami\zepp-stretch-coach\node_modules\@zeppos\zml\examples\helloworld3\setting\index.js
- D:\huami\zepp-stretch-coach\node_modules\@zeppos\zml\examples\helloworld3\app-side\index.js
- official Side Service Messaging API docs

Manifest:
- add app-side.path "app-side/index"
- add setting.path "setting/index"

Settings App fields:
- nickname
- age bracket
- intensity reminder threshold
- high-risk candidate threshold labeled as test-only
- up to 3 emergency contacts
- offline local alert enabled, default true
- demo dispatcher enabled, locked true in this release
- training complete state

Contact fields must remain phone-side settings. Never send contact numbers to the watch.
Only synchronize a sanitized contact count from 0 to 3 to the watch so the home dashboard can show whether remote assistance is configured.

Side Service:
- parse binary UTF-8 envelopes
- validate schemaVersion and message type
- deduplicate messageId
- acknowledge every accepted envelope
- call demoDispatcher only
- save display-safe delivery results to settingsStorage

demoDispatcher:
- must never call fetch
- must never send SMS
- must never place calls
- return a deterministic simulated result listing sms_status "simulated" and voice_status "simulated"

Do not add a real backend URL. Add a prominent code comment explaining the production gate:
true-device calibration + sports-medicine review + legal review + production backend security review.

Write tests for protocol validation and dispatcher deduplication before implementation. Run npm test, npm run validate, and npm run build. Commit with:
feat: add companion settings and demo dispatcher

Stop after reporting commit hash and verification results.
```

- [ ] **Step 1: Write Side Service protocol tests**
- [ ] **Step 2: Add Settings App**
- [ ] **Step 3: Add Side Service and safe demo dispatcher**
- [ ] **Step 4: Validate and build**

```powershell
npm test
npm run validate
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add app.json setting app-side test
git commit -m "feat: add companion settings and demo dispatcher"
```

---

### Task 11: Add Scenario Simulator And Regression Gates

**Files:**
- Create: `scripts/simulate-scenarios.mjs`
- Modify: `scripts/validate-project.mjs`
- Create: `docs/verification/calibration-log-template.md`
- Create: `docs/verification/true-device-runbook.md`

**AI execution prompt:**

```text
You are implementing Task 11 only in D:\huami\zepp-workout-safety-guard.

Add a deterministic scenario simulator around the pure risk engine. It must print a concise timeline and final effects for each scenario.

Scenarios:
1. normal 30-minute run
2. intense run with high heart rate while still moving
3. traffic-light stop for 90 seconds
4. normal rest for 4 minutes followed by user rest confirmation
5. watch removed during exercise
6. loose watch causing missing heart-rate samples
7. sustained activity followed by sudden stop and sustained abnormal heart rate
8. sustained activity followed by sudden stop with only one suspicious signal
9. phone offline during automatic escalation and online replay later
10. duplicate Alarm delivery after replay
11. manual help followed by GPS location update
12. resolution after contact request

The validator must fail if:
- default config enables real dispatch
- default dispatcherMode is not demo
- app.json includes accelerometer or background geolocation permissions
- runtime source code contains marketing phrases for cardiac-arrest detection, fall detection, or guaranteed rescue; scan app.js, app-service, app-side, secondary-widget, setting, page, and src, but exclude docs and test fixtures
- app-side demo dispatcher imports fetch or contains a production HTTP URL

Write a true-device runbook with a checkbox table for:
- model
- Zepp OS API level
- firmware version
- background permission grant and denial
- reboot recovery
- sensor callback cadence
- Alarm delay accuracy while screen off
- notification action behavior
- vibration and sound behavior
- BLE disconnect and replay
- manual GPS success and timeout
- 60-minute battery observation
- false-alert observations during run, walk, stoplight, rest, removal, and loose wear

Write a calibration log template that records no personally identifying data.

Run npm test, npm run validate, node scripts/simulate-scenarios.mjs, and npm run build. Commit with:
test: add safety scenario regression gates

Stop after reporting commit hash and verification results.
```

- [ ] **Step 1: Add deterministic scenarios**
- [ ] **Step 2: Strengthen validation rules**
- [ ] **Step 3: Add true-device documents**
- [ ] **Step 4: Run complete verification**

```powershell
npm test
npm run validate
node scripts/simulate-scenarios.mjs
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add scripts docs/verification
git commit -m "test: add safety scenario regression gates"
```

---

### Task 12: Run Final Review Without Enabling Real Dispatch

**Files:**
- Review: all project files
- Modify only if verification exposes a defect

**AI execution prompt:**

```text
You are performing Task 12 only in D:\huami\zepp-workout-safety-guard.

Do a release-readiness review for a demo-only alpha build. Do not add production SMS, voice calls, backend URLs, or medical claims.

Review priorities:
1. Safety logic: no single signal can notify contacts
2. Idempotency: retries, replay, duplicate alarms, and service restart cannot duplicate messages
3. Lifecycle: every sensor, BLE, GPS, and foreground timer has cleanup
4. Background restrictions: no forbidden timers, UI, GPS, accelerometer, or gyroscope in App Service
5. Permissions: background permission requested explicitly and denial handled
6. Privacy: no contact numbers, exact locations, or heart-rate samples in logs
7. Capability gates: phone launch, SOS sound, widget behavior, and GPS degrade honestly
8. Copy: no cardiac-arrest detection, fall detection, automatic rescue, or guaranteed delivery claims

Run:
- git status --short
- npm test
- npm run validate
- node scripts/simulate-scenarios.mjs
- npm run build

Produce:
- release-readiness report
- list of true-device-only checks still open
- list of calibration-only checks still open
- explicit statement that real contact dispatch remains disabled

If code fixes are necessary, make minimal fixes, rerun all commands, and commit:
fix: address demo alpha review findings

Stop after reporting the review.
```

- [ ] **Step 1: Perform code review**
- [ ] **Step 2: Run complete verification**
- [ ] **Step 3: Confirm real dispatch remains disabled**
- [ ] **Step 4: Commit only if fixes were necessary**

---

## 6. Technical Traps And Required Countermeasures

| Trap | Why it matters | Required countermeasure |
| --- | --- | --- |
| Treating the app as cardiac-arrest detection | The public API lacks raw PPG, signal quality, accelerometer, and emergency-service integration | Use `movement anomaly` and `unresponsive` language only |
| Using one heart-rate reading | Optical wrist readings can spike during motion | Require multiple samples over a configurable window |
| Treating missing heart rate as zero | Loose wear may look like pulse loss | Missing samples may increase uncertainty but never trigger help alone |
| Assuming system workout state is public | Public APIs do not expose a universal system-workout-start event | Infer sustained activity from Step, Distance, Wear, and time |
| Using background timers | `App Service` forbids timer interfaces | Use `Time.onPerMinute()` and `Alarm` |
| Doing too much in alarm wakeup | Single-execution services have a `600 ms` limit | Keep wakeup work synchronous and short; queue work |
| Adding `reload` to API 3.0 manifest | `reload` starts at API level 4.0 | Omit it for the compatibility build |
| Assuming ZML BasePage works in App Service | ZML page wrappers are designed around Device App pages | Use a thin `@zos/ble` adapter in App Service; verify in Task 1 |
| Sending JSON objects directly over BLE | Side Service messaging is binary | UTF-8 encode a versioned envelope and validate on both ends |
| Duplicate remote notifications | Alarm delivery, reconnect, reboot, and retries may replay messages | Use stable `messageId`, outbox persistence, ACK, and deduplication |
| Starting GPS in background | High-power sensors are forbidden in App Service | Start and stop GPS only in the active assistance page |
| Waiting for GPS before seeking help | Indoor positioning can fail or take too long | Send help first; send a location update later |
| Assuming every watch can play SOS sound | `SystemSounds` availability depends on API level and settings | Capability-gate sound; degrade to urgent vibration |
| Assuming every watch can dial | System phone app availability and independent calling differ by model | Show manual phone action only after capability check |
| Hiding offline limits | Without a nearby phone, remote contact assistance cannot be delivered | Display `offline local alert only` prominently |
| Copying contact details onto the watch | It increases privacy exposure without helping the background detector | Keep contacts phone-side; synchronize only a sanitized count |
| Releasing auto dispatch before calibration | False alerts will destroy trust and may create liability | Keep production defaults demo-only until formal gates pass |

## 7. Production Enablement Is A Separate Project

Do not enable real SMS or voice calls as part of this plan. Create a separate reviewed plan after the alpha satisfies:

1. At least one `API_LEVEL 3.0+` true-device validation run.
2. False-alert calibration with real run, walk, stoplight, rest, removal, and loose-wear samples.
3. Sports-medicine review of high-risk combinations and user copy.
4. Legal review for each target market.
5. Privacy policy and separate sensitive-data consent.
6. Secure backend design with authentication, rate limits, audit logs, encrypted storage, deletion policy, and abuse controls.
7. SMS and voice supplier review.
8. Emergency-contact consent wording.
9. A rollout plan with feature flag, monitoring, and rollback.

## 8. Final Completion Criteria

The demo-only alpha is complete when:

- Tasks `0` through `12` are completed or explicitly blocked by a documented platform limitation.
- `npm test` passes.
- `npm run validate` passes.
- `node scripts/simulate-scenarios.mjs` passes all scenario assertions.
- `npm run build` succeeds or a Zeus login-only blocker is documented.
- The capability matrix clearly separates documented, simulator-confirmed, true-device-required, and unsupported capabilities.
- The app contains no medical claim.
- The app contains no real SMS, voice call, or production backend code.
- Default configuration keeps `autoContactDispatch: false` and `dispatcherMode: 'demo'`.
- True-device and calibration runbooks are ready for the next phase.
