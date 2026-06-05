# Simulator Test Flow

This runbook is for simulator-only validation. It proves build, page loading,
basic UI flows, manual assistance, local outbox/history behavior, and the pure
risk-engine scenarios. It does not replace the true-device runbook.

## Scope

Can be validated in simulator:

- App installs and opens without a black screen.
- Home, onboarding, assist, and history pages render.
- Onboarding practice countdown starts and can be completed or cancelled.
- Manual assist page starts a 30-second countdown.
- Manual "contact now" queues a demo help event.
- Countdown expiry queues a demo help event.
- Cancel flow requires a second confirmation.
- History records queued/resolved help events.
- Project validation, unit tests, scenario simulation, and package build pass.

Must still be validated on a real watch:

- Sensor-driven automatic abnormal detection from live heart rate, movement, and wear status.
- App Service background runtime while the UI is closed.
- `Alarm(delay: 30)` wake accuracy and screen-off delivery.
- BLE delivery to the phone side and ACK round trip.
- Notification action buttons.
- Foreground GPS real fix/timeout behavior.
- Secondary widget behavior.
- Battery impact.

## Preflight

Run from the project root:

```powershell
cd D:\huami\zepp-workout-safety-guard
npm.cmd test
npm.cmd run validate
node scripts\simulate-scenarios.mjs
npm.cmd run build
zeus.cmd status
```

Expected:

- All unit tests pass.
- Validation reports `validation passed`.
- Scenario simulation reports all scenarios passed.
- Build exits successfully.
- `zeus.cmd status` shows the simulator as connected.

## Upload

Start the Zepp simulator first, then run:

```powershell
zeus.cmd dev -t "Amazfit Balance 2"
```

Expected console output:

```text
simulator connected
rebuilding...
rebuild done
refreshing simulator...
watching the changes in this project...
```

If the simulator shows an Electron popup such as `side window not existed`,
close the popup, restart the simulator, and run `zeus.cmd status` again before
re-uploading.

## Smoke Test

1. Open the app in the simulator.
2. Confirm the screen is not black.
3. If first launch redirects to onboarding, confirm the guide page renders.
4. Check the simulator log for runtime page errors:

```powershell
Get-Content -Tail 220 D:\simulator\sim-debug.log |
  Select-String -Pattern "Mini Program Error|TypeError|load page|failed to load"
```

Expected: no `Mini Program Error`, no `TypeError`, and no page load failure.

## Trigger A 30-Second Countdown

There are two simulator-friendly ways:

1. Onboarding practice countdown:
   - Tap through the onboarding guide to step 8.
   - Tap the background-permission button if shown.
   - Tap the start-practice button.
   - The practice countdown starts at `30`.

2. Manual assistance countdown:
   - Complete onboarding so the home page is available.
   - Tap the "I Feel Unwell" button on home.
   - The assist page opens and starts at `30`.

Do not use simulator-only results to claim that automatic abnormal detection
can trigger the 30-second escalation. That path depends on App Service sensor
inputs and `Alarm(delay: 30)`, so the simulator can verify the reducer logic
with tests but not real sensor/alarm reliability.

## Manual Assist Flow

On the assist page:

- Wait for the countdown to reach `0`.
  Expected: the page changes to help queued / local assistance state.
- Tap "Contact now".
  Expected: a demo help event is queued immediately; no real SMS or phone call
  is made.
- Tap "Cancel request".
  Expected: the page asks for a second confirmation.
- Tap "Back".
  Expected: returns to the countdown state.
- Tap "Cancel request", then "Confirm safe".
  Expected: the request closes without queuing a new help event.

## History Flow

1. Trigger a manual help event by countdown expiry or "Contact now".
2. Open the history page from home.
3. Confirm a help event is visible.
4. Use "Mark safe" if an unresolved event exists.
5. Reopen history and confirm the event is resolved.
6. Use "Clear history".
7. Confirm the empty state is shown.

## Regression Checklist

- [ ] No black screen after upload.
- [ ] No `Mini Program Error` in `D:\simulator\sim-debug.log`.
- [ ] Onboarding page renders.
- [ ] Onboarding practice countdown starts at 30.
- [ ] Home page renders after onboarding.
- [ ] Manual assist countdown starts at 30.
- [ ] Countdown expiry queues a demo help event.
- [ ] "Contact now" queues one demo help event.
- [ ] Cancel requires confirmation.
- [ ] History shows queued/resolved events.
- [ ] Clearing history works.
- [ ] No real SMS or phone service is invoked.
