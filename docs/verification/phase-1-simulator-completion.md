# Phase 1 Simulator Completion Report

Date: 2026-06-05

## Scope

Phase 1 closes the code-level and simulator-level gates for the demo alpha.
It does not claim true-device validation. It is complete when:

- The repository builds.
- Unit tests pass.
- Safety scenario simulation passes.
- Project validator passes.
- The package uploads to the Zepp OS simulator.
- Known simulator-only behavior is documented.
- Hardware-only risks are explicitly carried into the true-device phase.

## Result

Phase 1 status: COMPLETE FOR CODE AND SIMULATOR GATES.

The project is ready to move to the next phase: true-device validation and
calibration. Real contact dispatch remains disabled.

## Verified Commands

Run from:

```powershell
D:\huami\zepp-workout-safety-guard
```

Required commands:

```powershell
npm.cmd test
npm.cmd run validate
node scripts\simulate-scenarios.mjs
npm.cmd run build
zeus.cmd status
zeus.cmd dev -t "Amazfit Balance 2"
```

Fresh results recorded on 2026-06-05:

- `npm.cmd test`: 169 tests pass.
- `npm.cmd run validate`: `validation passed`.
- `node scripts\simulate-scenarios.mjs`: 12/12 scenarios pass.
- `npm.cmd run build`: succeeds.
- `zeus.cmd status`: simulator connected on `127.0.0.1:7650`.
- `zeus.cmd dev -t "Amazfit Balance 2"`: reaches `refreshing simulator` and
  `watching the changes in this project`.
- Latest simulator log check: no `Mini Program Error`, `TypeError`,
  `ReferenceError`, page load failure, or `Assist leave failed` in the checked
  log window.

## Simulator Upload Notes

The dev command is a watch command. For unattended upload checks, it is safe to
stop the process after this output appears:

```text
refreshing simulator...
watching the changes in this project...
```

Leaving the watch process running is useful for active development, but it can
also keep refreshing the simulator while a human is testing.

## Confirm Safe Cancel Path

The assist page uses a local two-step cancellation:

1. `Cancel request`
2. `Confirm safe`

This flow is local to the foreground watch page. It does not require:

- a connected phone
- Side Service
- BLE ACK
- contact configuration

Mitigations already implemented:

- Page entry files no longer export top-level constants, avoiding the Zepp page
  runtime `exports` crash.
- Confirm-cancel completion no longer depends only on `router.finish()`.
- Assist GPS no longer starts when the page opens. GPS starts only after help
  is sent, so the cancel path does not synchronously stop a just-started GPS
  listener.

If a simulator still appears frozen after `Confirm safe`, treat it as a
simulator/runtime interaction issue, not a phone-connection issue. Continue
debugging with:

```powershell
Get-Content -Tail 220 D:\simulator\sim-debug.log |
  Select-String -Pattern "Mini Program Error|TypeError|ReferenceError|load page|failed to load|Assist leave failed"
```

No `Mini Program Error`, `TypeError`, `ReferenceError`, or
`Assist leave failed` messages were present in the latest checked simulator
log window before this report.

## Side Service DevTools Window

This project declares a phone companion service:

```json
"app-side": {
  "path": "app-side/index"
}
```

Because of that, the simulator may open a Chromium DevTools window for Side
Service. The following messages are simulator-side debug bridge messages:

```text
WebSocket connection to 'ws://localhost:7833/' failed: ERR_CONNECTION_REFUSED
side-service status:closed
```

Interpretation:

- `7833` is the simulator local Side Service WebSocket bridge.
- `ERR_CONNECTION_REFUSED` means that local bridge is not listening at that
  moment.
- This is not the same as a phone Bluetooth connection failure.
- It should not block foreground watch-page tests.
- It does affect Side Service simulator tests such as app-side ACK and replay
  behavior.

For watch-page-only simulator testing, close or ignore the DevTools window.
For app-side testing, restart the simulator and keep `zeus.cmd dev -t
"Amazfit Balance 2"` running.

## Still True-Device Required

The following items are not closed by Phase 1:

- App Service continuous background runtime while the UI is closed.
- App Service recovery after watch reboot.
- Live HeartRate, Step, Distance, Wear, and Time callback cadence.
- `Alarm(delay: 30)` and `Alarm(delay: 60)` accuracy while screen is off.
- Alarm wakeup of `app-service/guard-service` on hardware.
- Notification action button delivery to App Service.
- BLE handoff from App Service to the Zepp App phone side.
- ACK round trip and reconnect replay on a paired phone.
- Foreground GPS real fix/timeout behavior.
- Secondary widget availability and tap routing on the watch.
- Battery impact during a 60-minute observation.
- False-alert calibration for run, walk, stoplight, rest, removal, and loose
  wear cases.

These are tracked in:

```text
docs/verification/true-device-runbook.md
docs/verification/calibration-log-template.md
```

## Dispatch Safety

Real dispatch remains disabled:

- `autoContactDispatch` must remain `false`.
- `dispatcherMode` must remain `demo`.
- `app-side/demo-dispatcher.js` must not call `fetch`, send SMS, or place
  calls.
- No production backend URL is allowed in this phase.

## Phase 2 Entry Criteria

Begin Phase 2 only after a physical watch and paired phone are available.
Phase 2 should start with the true-device runbook and should not enable real
contact dispatch. The first hardware gate is BLE handoff and ACK round trip
between the watch App Service path and phone Side Service path.
