# 2026-06-06 UI Deep Optimization Handoff

This document records what has already been done, what the user asked for next,
and how to continue the UI deep optimization and final packaging work for
`zepp-workout-safety-guard`.

The user-facing conversation is Chinese, but this handoff is written mostly in
English to avoid encoding issues in local tooling. Keep final product copy safe:
do not claim sudden-death prevention, cardiac-arrest detection, fall detection,
or guaranteed rescue.

## Current Workspace State

- Workspace: `D:\huami\zepp-workout-safety-guard`
- Branch: `codex/demo-alpha-review`
- Latest completed UI commit:
  - `9554ebd style: polish workout guard watch UI`
- Known unrelated dirty file:
  - `.gitignore`
  - Do not stage, revert, or modify it unless the user explicitly asks.

## User's Latest Direction

The first visual polish is still not enough. The user wants a deeper UI upgrade
with a higher-end Apple Fitness / watchOS workout feel.

Specific requirements from the user:

- Remove rough, cheap, web-template-like visual feeling.
- Build stronger card hierarchy, rounded corners, spacing, subtle depth, and
  clear information grouping.
- Feel like an Apple sports app: simple, restrained, but energetic.
- Emphasize data visualization:
  - workout progress ring
  - trend chart
  - statistics cards
  - target completion
- Use a premium dark or light background. The user recommended black / dark
  gray with sport accents such as green, orange, blue, and rose.
- Typography should feel close to San Francisco:
  - large, clear numeric data
  - clear titles
  - muted explanatory text
- Buttons, cards, navigation, and icon-like elements should feel iOS-like, not
  Android-like and not web-template-like.
- Keep information clear and breathable.
- Add micro-interaction suggestions:
  - progress ring loading
  - card entrance
  - number increment
  - button press feedback
- The history empty state must not show a centered ring graphic. The user said
  that felt too abrupt.
- Continue thinking about system operation smoothness, not only appearance.
- After the deeper optimization is complete, package the app so it can be
  uploaded/shared with someone else.

The user also allowed using the internet to study similar product design. Before
the next UI pass, research current official/public design references for Apple
Fitness, Apple Watch Activity, watchOS cards/controls, and comparable sport
products.

## Completed Work So Far

### Phase 1 Code And Simulator Gate

Already completed before the UI polish pass:

- Pure risk engine and safety regression scenarios.
- Offline outbox with idempotent enqueue, ACK, and retry behavior.
- App Service controller and Zepp adapters for alerts, sensors, BLE, storage,
  and Alarm.
- Foreground pages:
  - Home
  - Onboarding / practice drill
  - Manual assist countdown
  - History
- Secondary widget skeleton.
- Phone Side Service skeleton with demo dispatcher and protocol validation.
- Simulator test flow and Phase 1 completion report.
- True-device validation runbook.

Important safety fixes already landed:

- `49958e0 fix: make simulator page entries non-exporting`
  - Fixed black screen caused by page entry files exporting top-level constants.
- `a3ebcd5 fix: avoid assist cancel confirmation dead end`
  - Added safer route fallbacks after assist cancellation.
- `a1a4510 fix: defer assist GPS until help is sent`
  - GPS no longer starts when the assist page opens.
  - GPS starts only after help has been queued.
- `4962dea docs: complete phase 1 simulator handoff`
  - Closed code and simulator Phase 1 gates.

### First UI Polish Pass

Commit:

```text
9554ebd style: polish workout guard watch UI
```

Files changed in that commit:

- `page/home/home.js`
- `page/home/home.r.layout.js`
- `page/home/home.s.layout.js`
- `page/assist/assist.js`
- `page/assist/assist.r.layout.js`
- `page/assist/assist.s.layout.js`
- `page/onboarding/onboarding.js`
- `page/onboarding/onboarding.r.layout.js`
- `page/onboarding/onboarding.s.layout.js`
- `page/history/history.js`
- `page/history/history.r.layout.js`
- `page/history/history.s.layout.js`
- `secondary-widget/index.js`

What changed:

- Replaced the rough dark text-list UI with a unified dark sport palette.
- Added Zepp `ARC` usage for:
  - home guard score ring
  - assist countdown ring
  - onboarding practice countdown ring
  - secondary widget mini ring
- Converted many text-only tap targets to `BUTTON` widgets with press colors.
- Added home statistics cards:
  - contacts
  - queue
  - phone
  - service
- Added home readiness/trend bars.
  - If event history exists, the bars reflect recent event status.
  - If no history exists, they show current readiness baseline.
- Reworked assist page into:
  - title
  - online/offline status pill
  - central countdown ring
  - large countdown number
  - safe/contact action buttons
- Reworked onboarding into:
  - step indicator
  - progress dots
  - card-based explanation
  - practice countdown ring
- Reworked history into:
  - summary cards
  - event cards with status strip
  - quiet text empty state
  - no centered ring graphic
- Reworked secondary widget into a compact dark card with mini ring and a
  prominent help entry.

Verification after `9554ebd`:

```powershell
npm.cmd test
npm.cmd run validate
node scripts\simulate-scenarios.mjs
zeus.cmd build
zeus.cmd dev -t "Amazfit Balance 2"
```

Observed results:

- `npm.cmd test`: 169/169 passed.
- `npm.cmd run validate`: passed.
- `node scripts\simulate-scenarios.mjs`: 12/12 scenarios passed.
- `zeus.cmd build`: passed.
- `zeus.cmd dev -t "Amazfit Balance 2"`:
  - simulator connected
  - rebuild done
  - simulator refresh succeeded
  - output included `Updating devices, success`

## Why The UI Still Needs Work

The first UI polish pass made the app more coherent, but the user still judged
it insufficiently beautiful. Treat the next pass as a deeper design pass, not a
small color tweak.

Likely weak points to inspect in simulator:

- Home may still feel too much like a dashboard mock rather than a watch-native
  sports app.
- Cards may be too uniform and mechanical.
- The large score/ring concept may need more purposeful semantics.
- Typography may still feel generic because Zepp widgets expose limited font
  control.
- The UI currently uses English copy to avoid existing Chinese mojibake. If
  final sharing requires Chinese, localization encoding must be cleaned
  carefully.
- Preview assets (`secondary-preview*.png`) are still old/simple assets unless
  regenerated.
- Micro-interactions are limited to press colors and ring updates. Zepp widget
  runtime is not CSS, so motion needs to be simulated carefully.

## Next Work: Deep Visual Optimization

### 1. Research References

Before editing code, collect a small visual reference board from current public
sources. Use official or high-quality sources where possible.

Research targets:

- Apple Fitness app
- Apple Watch Activity rings
- watchOS Smart Stack / widgets
- Apple Human Interface Guidelines for watchOS
- Strava mobile activity summary
- Garmin Connect workout summary
- WHOOP recovery / strain screens

Look for:

- how dark surfaces are layered
- how numbers are framed
- how activity rings are sized and spaced
- how cards avoid looking like generic web cards
- how empty states stay quiet
- how dangerous actions are visually separated from normal sport data

Keep the research output short. It should become a practical Zepp UI checklist,
not a long moodboard essay.

### 2. Redesign The Home Page Again

Goal: make the home page feel like a watch-native fitness status screen, not a
mini web dashboard.

Ideas to explore:

- Replace the single numeric "Guard Score" with a more concrete status:
  - `Ready`
  - `Local`
  - `Needs Setup`
  - `Queued`
- Use one dominant circular visual and two smaller supporting stats instead of
  four equal cards.
- Make the main ring look more like activity rings:
  - thicker track
  - balanced spacing
  - possibly two nested rings if widget cost stays low
- Show fewer labels:
  - Phone
  - Contacts
  - Queue
- Keep the emergency action visible but not visually crude.
- Avoid equal 2x2 cards if they feel generic.

Possible structure:

```text
top:      product title + compact state pill
center:   activity-style readiness ring + large state word
lower:    two asymmetrical metric capsules
bottom:   primary help pill + two compact secondary actions
```

### 3. Redesign The Assist Page Again

Goal: feel urgent, calm, and premium.

Requirements:

- The countdown must remain readable above all else.
- Red must be reserved for the actual emergency/contact action and countdown
  threshold.
- Confirmation flow must stay two-step.
- Phone offline must not look like a fatal app error.

Ideas:

- Make the ring slightly larger and cleaner.
- Use a softer orange for 30-11 seconds, then red for 10-0.
- Add a tiny status timeline:
  - waiting
  - queued
  - GPS optional
- Use `I'm Safe` and `Contact Now` as short labels.
- Disable conflicting buttons while the confirm-safe prompt is visible.

### 4. Redesign Onboarding

Goal: onboarding should feel like watchOS setup cards, not dense legal text.

Ideas:

- Keep each step to one headline and one short paragraph.
- Use a single accent mark per card, not decorative clutter.
- Make step dots smaller and more refined.
- If Chinese localization is restored, keep strings short enough for round and
  square screens.
- Practice drill should visually match assist page but clearly say it is local
  simulation.

### 5. Redesign History

Goal: history should feel like activity records, not a table.

Requirements:

- Do not add a centered ring graphic in empty state.

Ideas:

- Keep summary cards, but reduce their visual weight.
- For events, use a clean timeline/list style:
  - small colored status strip or dot
  - title
  - status
  - time
- Do not show too many events in one screen.
- Empty state:
  - one quiet card
  - title: `No events yet`
  - subtext: `Practice and help events will appear here.`

### 6. Secondary Widget And Preview Assets

The secondary widget should match the final UI.

Next actions:

- Verify the widget size in simulator/hardware if possible.
- Recreate or regenerate secondary preview images after final UI polish.
- Keep the widget as UI-only:
  - no GPS
  - no BLE dispatch
  - no risk evaluation

## System Operation Smoothness Plan

The user explicitly asked to think about system operation smoothness. Treat this
as both UX smoothness and runtime smoothness.

### UX Smoothness

- Prevent repeated taps from causing duplicated navigation or duplicated help
  actions.
  - Add lightweight tap locks for critical buttons if simulator shows double
    activation.
- Disable conflicting buttons during transitional states:
  - while confirm-safe prompt is shown
  - after help is queued
  - while leaving a page
- Keep all button labels short to avoid wrap/reflow.
- Prefer `BUTTON` press colors for tactile feedback.
- Avoid visually changing too many widgets on each countdown tick.
- Keep the assist page state transitions obvious:
  - countdown
  - confirm cancel
  - queued
  - closed/resolved

### Runtime Smoothness

- Avoid full UI destroy/recreate during timers.
  - Countdown pages should update only `TEXT` and `ARC` properties via
    `setProperty(prop.MORE, ...)`.
- Avoid rebuilding whole pages repeatedly unless the page state truly changes.
  - Onboarding step changes can rebuild.
  - Countdown ticks should not rebuild.
  - Clearing history can rebuild once after storage changes.
- Keep widget count modest.
  - Avoid extra fake shadows on every small card if the simulator feels slow.
  - Use one background rectangle plus one surface rectangle, not many stacked
    layers.
- Use `setEnable(false)` on purely decorative or display-only text/widgets.
- Precompute layout constants in layout files, not inside tick handlers.
- Keep JSON parsing out of per-second paths.
- Do not add GPS, sensors, or BLE operations to foreground visual ticks.
- Do not use `redraw()` on every countdown tick. Use it only if a specific
  simulator rendering bug is proven.
- Maintain existing App Service constraints:
  - no GPS in App Service
  - no accelerometer/gyroscope in App Service
  - no `setTimeout`/`setInterval` in App Service
  - 30-second escalation continues to use `Alarm`
- Keep help dispatch idempotent:
  - repeated taps, reconnects, duplicate alarms, or page rebuilds must not
    duplicate notifications.

### Smoothness Tests To Add Or Run

Manual simulator checks:

- Rapidly tap `I Feel Unwell` multiple times.
  - Expected: only one assist page opens.
- Rapidly tap `Contact now`.
  - Expected: one help event, no duplicate history rows.
- On assist page, tap `I'm safe`, then rapidly tap confirm/back buttons.
  - Expected: no freeze, no duplicated navigation.
- Let the countdown run for the full 30 seconds.
  - Expected: no visible stutter or UI rebuild flicker.
- Start onboarding drill countdown.
  - Expected: only number/ring changes, no whole-screen flicker.
- Clear history repeatedly.
  - Expected: stable empty state, no stacked duplicate widgets.

Code-level checks:

```powershell
npm.cmd test
npm.cmd run validate
node scripts\simulate-scenarios.mjs
zeus.cmd build
```

Optional future tests:

- Add a pure test for UI tap lock helpers if such helpers are introduced.
- Add an assist page adapter-level test if page logic is extracted from Zepp
  widgets into testable pure functions.

## Packaging And Sharing Plan

After the second visual pass is complete:

1. Run verification:

   ```powershell
   npm.cmd test
   npm.cmd run validate
   node scripts\simulate-scenarios.mjs
   zeus.cmd build
   zeus.cmd dev -t "Amazfit Balance 2"
   ```

2. Confirm simulator smoke flow:

   - app opens without black screen
   - home renders
   - onboarding renders
   - assist countdown starts at 30
   - confirm-safe path does not freeze
   - history empty state has no centered ring

3. Locate generated package output under `dist`.

4. If the sharing format is unclear, run:

   ```powershell
   zeus.cmd --help
   zeus.cmd build --help
   ```

   Then document the exact artifact path and command used.

5. Prepare a small release note:

   - app version / commit hash
   - simulator target
   - verification commands and results
   - known limitations:
     - simulator-only
     - no real SMS/phone dispatch
     - true-device BLE/Alarm/sensor validation still required

6. Do not include unrelated `.gitignore` changes in the release commit unless
   explicitly requested.

## Acceptance Criteria For The Next Pass

The next UI pass is acceptable only if all of these are true:

- The user no longer sees the UI as rough, cheap, or web-like.
- Home has a clear premium sport-dashboard composition.
- Assist page is calm, urgent, and readable.
- History empty state is quiet and has no centered ring graphic.
- UI does not feel crowded.
- Countdown interactions do not flicker.
- Rapid taps do not produce obvious duplicate operations.
- All safety tests still pass.
- Zeus build succeeds.
- The simulator can be refreshed.
- A package artifact is identified and ready to share.

## Suggested Prompt For A New Conversation

Use this prompt to continue in another Codex conversation:

```text
Please read:
D:\huami\zepp-workout-safety-guard\docs\handoff\2026-06-06-ui-deep-optimization-handoff.md

Then continue the Zepp OS Workout Safety Guard UI deep optimization. The user
said the first polish is still not beautiful enough. Research Apple Fitness /
watchOS sports UI references, redesign the pages with a premium watch-native
feel, improve interaction/runtime smoothness, verify with tests and Zeus build,
upload to the Amazfit Balance 2 simulator, and prepare the final package for
sharing. Do not stage or revert the existing .gitignore change unless explicitly
asked.
```
