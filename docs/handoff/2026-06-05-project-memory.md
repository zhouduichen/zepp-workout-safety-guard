# 2026-06-05 Project Memory

This document is the handoff memory for future Codex conversations. Read it
first when continuing work on `zepp-workout-safety-guard`.

## Current State

- Workspace: `D:\huami\zepp-workout-safety-guard`
- Branch: `codex/demo-alpha-review`
- Latest functional implementation commit before this handoff document:
  `a1a4510`
- App target used for simulator work: `Amazfit Balance 2`
- Simulator endpoint: `http://127.0.0.1:7650`
- There is an unrelated uncommitted `.gitignore` modification. Do not stage or
  revert it unless the user explicitly asks.

## Source Documents

Start with these files:

- `docs/superpowers/plans/2026-06-02-workout-safety-guard-implementation.md`
- `docs/superpowers/specs/2026-06-02-workout-safety-guard-design.md`
- `docs/verification/simulator-test-flow.md`
- `docs/verification/phase-1-simulator-completion.md`
- `docs/verification/true-device-runbook.md`
- `docs/verification/platform-capability-matrix.md`

## Product Guardrails

- The product wording must stay in the range of "workout anomaly help" /
  "movement anomaly assistance". Do not claim sudden-death prevention, cardiac
  arrest detection, fall detection, or guaranteed rescue.
- No real SMS, phone call, or production HTTP dispatcher is allowed in this
  demo. `app-side/demo-dispatcher.js` must remain simulated.
- Emergency contacts stay on the phone side. The watch may only sync display
  safe counts/status, not raw phone numbers.
- A single high heart-rate reading, missing heart-rate data, Bluetooth
  disconnect, or not-worn state must never independently notify family.
- App Service must not use GPS, accelerometer, gyroscope, `setTimeout`, or
  `setInterval`. The 30-second automatic escalation uses `Alarm`.
- GPS is foreground-only and must not block help delivery. The current assist
  page sends help first, then starts GPS only to send a later location update.
- Every help event needs an idempotent message ID to prevent duplicate delivery
  after restart, reconnect, or duplicate Alarm.

## What Has Been Implemented

- Pure risk engine and safety regression scenarios.
- Offline outbox with idempotent enqueue/ack/retry behavior.
- App Service controller and Zepp adapters for alerts, sensors, BLE, storage,
  and Alarm.
- Foreground pages:
  - Home
  - Onboarding / practice drill
  - Manual assist countdown
  - History
- Secondary widget skeleton.
- Phone Side Service skeleton with demo dispatcher and protocol validation.
- Settings page support for phone-side configuration.
- Simulator test runbook.
- Phase 1 simulator completion report.
- True-device validation checklist.

## Important Recent Commits

- `a1a4510 fix: defer assist GPS until help is sent`
  - Changed assist page so GPS does not start when the page opens.
  - GPS now starts only after help is actually queued.
  - Updated true-device runbook accordingly.
- `a3ebcd5 fix: avoid assist cancel confirmation dead end`
  - Changed assist cancel completion to avoid depending only on `finish()`.
  - Added route fallback logic.
- `49958e0 fix: make simulator page entries non-exporting`
  - Fixed black screen caused by page entry files exporting `ZH` / `EN`.
  - Zepp page runtime did not have a valid `exports` object.
- `768c5fd fix: address demo alpha review findings`
  - Integrated assist session, BLE ACK handling, fail-closed behavior, and
    review fixes.

## Verification Commands

Run these from the project root:

```powershell
npm.cmd test
npm.cmd run validate
node scripts\simulate-scenarios.mjs
npm.cmd run build
zeus.cmd status
```

Last known results after `a1a4510`:

- `npm.cmd test`: 169/169 passed.
- `npm.cmd run validate`: passed.
- `node scripts\simulate-scenarios.mjs`: 12/12 scenarios passed.
- `npm.cmd run build`: passed.
- `zeus.cmd status`: simulator connected.
- `zeus.cmd dev -t "Amazfit Balance 2"` reached `refreshing simulator` and
  `watching the changes in this project`.

## Simulator Upload

Use:

```powershell
zeus.cmd dev -t "Amazfit Balance 2"
```

Expected:

```text
simulator connected
rebuilding...
rebuild done
refreshing simulator...
watching the changes in this project...
```

If running from automation, stop the temporary watch process after it reaches
`watching the changes in this project`; otherwise it can keep refreshing the
simulator while the user is testing.

## Current Simulator Notes

### Side Service DevTools Window

This app opens a Side Service DevTools window because `app.json` declares:

```json
"app-side": {
  "path": "app-side/index"
}
```

The DevTools messages below refer to the simulator's local Side Service debug
bridge, not to a phone Bluetooth connection:

```text
WebSocket connection to 'ws://localhost:7833/' failed: ERR_CONNECTION_REFUSED
side-service status:closed
```

Meaning:

- Port `7833` is the simulator's local side-service WebSocket bridge.
- If nothing is listening on `7833`, DevTools shows `ERR_CONNECTION_REFUSED`.
- This mainly affects Side Service simulation, contacts, ACK, and replay demos.
- It should not block the watch foreground page cancel flow.

Suggested handling:

- For watch-page-only testing, close or ignore the DevTools window.
- For Side Service testing, restart the simulator and keep `zeus.cmd dev -t
  "Amazfit Balance 2"` running.

### Confirm Safe Freeze

The user reported that tapping `Confirm safe` on the assist page still appeared
to freeze. Important context:

- This is not expected to be caused by phone disconnection.
- `Confirm safe` is a local foreground cancel path.
- Fix `a3ebcd5` added route fallbacks.
- Fix `a1a4510` changed GPS so it is not started on page open, avoiding the
  "start GPS then immediately stop GPS" simulator path.

Manual retest still needed after `a1a4510`:

1. Open the app in simulator.
2. From home, tap `I Feel Unwell`.
3. Tap `Cancel request`.
4. Tap `Confirm safe`.
5. Expected: the page leaves assist or at least changes to cancelled/close
   state without locking the simulator.

If it still freezes, investigate in this order:

1. Confirm the simulator actually installed a build containing `a1a4510`.
2. Check `D:\simulator\sim-debug.log` for `Mini Program Error`,
   `TypeError`, `ReferenceError`, `Assist leave failed`, or page load failures.
3. Add temporary logs around:
   - `_onConfirmCancel`
   - `confirmCancel`
   - `_finishCancelled`
   - `_leaveAssistPage`
4. If logs stop before `_onConfirmCancel`, the button event is not firing.
5. If logs reach `_leaveAssistPage`, isolate router behavior by temporarily
   using only `replace({ url: "/page/home/home" })`.
6. Test the `Back` button from the confirm state. If `Back` works but
   `Confirm safe` does not, the issue is in confirm completion, not general UI.

## Simulator-Only Test Scope

The simulator can validate:

- App opens without black screen.
- Home/onboarding/assist/history pages render.
- Onboarding practice countdown starts.
- Manual assist countdown starts at 30.
- Cancel request shows the confirmation step.
- Contact-now and countdown expiry queue demo help.
- History records queued/resolved events.
- Tests, validation, scenario simulation, and build pass.

The simulator cannot prove:

- Real sensor-driven automatic detection.
- App Service runtime while screen/UI is closed.
- `Alarm(delay: 30)` wake accuracy on a real watch.
- BLE handoff to the phone and ACK reliability.
- Notification action button reliability.
- Real GPS fix/timeout behavior.
- Secondary widget behavior on hardware.
- Battery impact.

## Common Debug Commands

Check simulator status:

```powershell
zeus.cmd status
```

Check page runtime errors:

```powershell
Get-Content -Tail 220 D:\simulator\sim-debug.log |
  Select-String -Pattern "Mini Program Error|TypeError|ReferenceError|load page|failed to load|Assist leave failed"
```

Check Side Service simulator log:

```powershell
Get-Content -Tail 220 C:\Users\33135\AppData\Roaming\simulator\logs\renderer.log |
  Select-String -Pattern "7833|side-service|ERR_CONNECTION_REFUSED|status:closed|status:opened|Error"
```

Check port `7833`:

```powershell
Get-NetTCPConnection -LocalPort 7833 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,State,OwningProcess
```

Stop leftover `zeus dev` processes:

```powershell
$matches = Get-CimInstance Win32_Process | Where-Object {
  ($_.Name -eq 'node.exe' -or $_.Name -eq 'cmd.exe') -and
  ($_.CommandLine -match 'zeus(\.cmd)?\s+dev|zeus-cli.*\bdev\b')
}
$matches | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

## Files Worth Reading Before Editing

- `page/assist/assist.js`
- `src/pages/assist-controller.js`
- `src/pages/assist-session.js`
- `src/device/service-controller.js`
- `src/domain/risk-engine.js`
- `src/domain/outbox.js`
- `src/domain/protocol.js`
- `app-service/guard-service.js`
- `app-side/index.js`
- `app-side/protocol.js`
- `app-side/demo-dispatcher.js`
- `scripts/simulate-scenarios.mjs`

## Suggested First Prompt For A New Conversation

Paste this into a new Codex conversation:

```text
Please read D:\huami\zepp-workout-safety-guard\docs\handoff\2026-06-05-project-memory.md first,
then continue the Zepp OS Workout Safety Guard project. Current focus:
simulator testing and retesting the Confirm safe cancel path.
Do not stage or revert the existing .gitignore change unless I explicitly ask.
```
