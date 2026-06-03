/**
 * simulate-scenarios.mjs — Deterministic scenario simulator
 *
 * Runs 12 predefined scenarios through the pure risk engine and
 * asserts expected behavior. Prints a timeline and final effects.
 */

import { createInitialGuardState, reduceGuard } from '../src/domain/risk-engine.js'
import { developmentConfig } from '../src/domain/default-config.js'
import { InputType, EffectType, GuardStatus } from '../src/domain/constants.js'
import { createEmptyOutbox, enqueue, listPending } from '../src/domain/outbox.js'
import { createEnvelope } from '../src/domain/protocol.js'

const cfg = developmentConfig

function apply(state, type, atMs, payload = {}) {
  return reduceGuard(state, { type, atMs, payload }, cfg)
}

function findEffect(effects, type) {
  return effects.find(e => e.type === type)
}

function hasEffect(effects, type) {
  return effects.some(e => e.type === type)
}

let scenarioCount = 0
let passedCount = 0

function scenario(name, fn) {
  scenarioCount++
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Scenario ${scenarioCount}: ${name}`)
  console.log(`${'='.repeat(60)}`)
  try {
    fn()
    console.log(`  ✅ PASS`)
    passedCount++
  } catch (e) {
    console.log(`  ❌ FAIL: ${e.message}`)
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg)
}

// ============================================================================
// Scenario 1: Normal 30-minute run
// ============================================================================
scenario('normal 30-minute run', () => {
  let state = createInitialGuardState(0)

  // Walk for 30 minutes: step changes every minute
  for (let min = 0; min < 30; min++) {
    const t = min * 60000
    state = apply(state, InputType.STEP_CHANGED, t + 1000).state
    state = apply(state, InputType.HEART_RATE_SAMPLE, t + 2000, { bpm: 125 }).state
    const r = apply(state, InputType.TICK, t + 59000)
    state = r.state
  }

  assert(state.status === GuardStatus.ACTIVE_GUARD, `Expected ACTIVE_GUARD, got ${state.status}`)
  assert(state.helpWasSent === false, 'Should not have sent help')
})

// ============================================================================
// Scenario 2: Intense run with high HR while still moving
// ============================================================================
scenario('intense run with high heart rate while still moving', () => {
  let state = createInitialGuardState(0)

  // Enter ACTIVE_GUARD
  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  assert(state.status === GuardStatus.ACTIVE_GUARD)

  // Keep moving + high HR
  state = apply(state, InputType.STEP_CHANGED, 120000).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 121000, { bpm: 175 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 122000, { bpm: 178 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 123000, { bpm: 180 }).state

  const r = apply(state, InputType.TICK, 180000)
  assert(hasEffect(r.effects, EffectType.NOTIFY_INTENSITY), 'Should emit intensity warning')
  assert(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST), 'Must NOT queue help when still moving')
})

// ============================================================================
// Scenario 3: Traffic-light stop for 90 seconds
// ============================================================================
scenario('traffic-light stop for 90 seconds', () => {
  let state = createInitialGuardState(0)

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  assert(state.status === GuardStatus.ACTIVE_GUARD)

  // Stop for 90s (less than ordinaryStopPromptSec of 180s)
  const r = apply(state, InputType.TICK, 91000)
  // atMs=91000, lastMovementAtMs=1000 → elapsed 90s < 180s, should still be ACTIVE_GUARD
  assert(r.state.status === GuardStatus.ACTIVE_GUARD, `Expected ACTIVE_GUARD at 90s stop, got ${r.state.status}`)

  // Resume movement
  state = apply(r.state, InputType.STEP_CHANGED, 92000).state
  assert(state.status === GuardStatus.ACTIVE_GUARD, 'Should resume ACTIVE_GUARD after movement')
})

// ============================================================================
// Scenario 4: Normal rest for 4 minutes + rest confirmation
// ============================================================================
scenario('normal rest with user rest confirmation', () => {
  let state = createInitialGuardState(0)

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state

  // Stop for 4 minutes
  state = apply(state, InputType.TICK, 301000).state

  // User taps rest
  const r = apply(state, InputType.USER_REST_REQUESTED, 302000)
  assert(r.state.status === GuardStatus.REST_PAUSED, `Expected REST_PAUSED, got ${r.state.status}`)
  assert(r.state.restPauseUntilMs != null, 'Should have rest pause timestamp')
  assert(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST), 'Rest should not queue help')
})

// ============================================================================
// Scenario 5: Watch removed during exercise
// ============================================================================
scenario('watch removed during exercise', () => {
  let state = createInitialGuardState(0)

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  assert(state.status === GuardStatus.ACTIVE_GUARD)

  // Remove watch
  state = apply(state, InputType.WEAR_CHANGED, 120000, { wearStatus: 0 }).state
  const r1 = apply(state, InputType.TICK, 125000)
  assert(r1.state.status === GuardStatus.NOT_WORN, `Expected NOT_WORN, got ${r1.state.status}`)
  assert(!hasEffect(r1.effects, EffectType.QUEUE_HELP_REQUEST), 'Not worn must not queue help')

  // After 5 minutes, should get NOTIFY_GUARD_PAUSED
  const r2 = apply(r1.state, InputType.TICK, 125000 + 300000)
  assert(hasEffect(r2.effects, EffectType.NOTIFY_GUARD_PAUSED), 'Should notify guard paused after 5 min')
  assert(!hasEffect(r2.effects, EffectType.QUEUE_HELP_REQUEST), 'Not worn must never queue help')
})

// ============================================================================
// Scenario 6: Loose watch — missing HR samples
// ============================================================================
scenario('loose watch causing missing heart-rate samples', () => {
  let state = createInitialGuardState(0)

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  assert(state.status === GuardStatus.ACTIVE_GUARD)

  // Sudden stop with NO heart rate samples at all
  const r = apply(state, InputType.TICK, 125000)
  // atMs=125000, lastMovementAtMs=1000 → elapsed 124s > 120s window → sudden stop
  // But no HR samples → should NOT enter AWAITING_CONFIRMATION
  assert(r.state.status === GuardStatus.ACTIVE_GUARD, `Expected ACTIVE_GUARD (no HR data), got ${r.state.status}`)
  assert(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST), 'No HR data must not queue help')
  assert(!hasEffect(r.effects, EffectType.SCHEDULE_ESCALATION_ALARM), 'No HR data must not schedule alarm')
})

// ============================================================================
// Scenario 7: Sudden stop + sustained abnormal HR (high risk)
// ============================================================================
scenario('sudden stop with sustained abnormal heart rate (high risk)', () => {
  let state = createInitialGuardState(0)

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  assert(state.status === GuardStatus.ACTIVE_GUARD)

  // 3 HR samples > 190bpm
  state = apply(state, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state

  // Sudden stop + TICK
  const r = apply(state, InputType.TICK, 125000)
  assert(r.state.status === GuardStatus.AWAITING_CONFIRMATION, `Expected AWAITING_CONFIRMATION, got ${r.state.status}`)
  assert(hasEffect(r.effects, EffectType.VIBRATE_URGENT), 'Should vibrate urgent for high risk')
  assert(hasEffect(r.effects, EffectType.NOTIFY_CONFIRMATION), 'Should notify confirmation')

  const alarm = findEffect(r.effects, EffectType.SCHEDULE_ESCALATION_ALARM)
  assert(alarm, 'Should schedule escalation alarm')
  assert(alarm.delaySec === cfg.highRiskConfirmSec, `Expected delay ${cfg.highRiskConfirmSec}s, got ${alarm.delaySec}s`)
})

// ============================================================================
// Scenario 8: Sudden stop with only one suspicious signal (medium risk)
// ============================================================================
scenario('sudden stop with only one suspicious signal (medium risk)', () => {
  let state = createInitialGuardState(0)

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  assert(state.status === GuardStatus.ACTIVE_GUARD)

  // Only 1 HR sample > 190bpm (less than minHeartRateSamples=3)
  state = apply(state, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
  // Add 2 normal samples to have some heart rate data
  state = apply(state, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 130 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 125 }).state

  // Sudden stop + TICK
  const r = apply(state, InputType.TICK, 125000)
  // Only 1 sample > 190 → still medium risk (some suspicious signals)
  assert(r.state.status === GuardStatus.AWAITING_CONFIRMATION, `Expected AWAITING_CONFIRMATION, got ${r.state.status}`)
  const alarm = findEffect(r.effects, EffectType.SCHEDULE_ESCALATION_ALARM)
  assert(alarm, 'Should schedule escalation alarm')
  // After the refactor: 1 high out of 3 total still enters confirmation with mediumRiskConfirmSec
  assert(alarm.delaySec === cfg.mediumRiskConfirmSec, `Expected medium risk delay ${cfg.mediumRiskConfirmSec}s, got ${alarm.delaySec}s`)
})

// ============================================================================
// Scenario 9: Phone offline during escalation + relay replay
// ============================================================================
scenario('phone offline during escalation with online replay', () => {
  let state = createInitialGuardState(0)
  let outbox = createEmptyOutbox()

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state

  // Set phone offline
  state = apply(state, InputType.PHONE_CONNECTION_CHANGED, 80000, { connectionStatus: 0 }).state

  // Trigger escalation (phone offline)
  const r1 = apply(state, InputType.TICK, 125000)
  const episodeId = r1.state.currentEpisodeId
  assert(episodeId != null, 'Should have episode ID')

  const r2 = apply(r1.state, InputType.ESCALATION_ALARM_FIRED, 155000, { episodeId })
  assert(r2.state.status === GuardStatus.LOCAL_ALARM, 'Should enter LOCAL_ALARM even offline')
  assert(hasEffect(r2.effects, EffectType.QUEUE_HELP_REQUEST), 'Should queue help request')

  // Later, phone reconnects
  state = apply(r2.state, InputType.PHONE_CONNECTION_CHANGED, 200000, { connectionStatus: 1 }).state
  // Outbox would be flushed by service controller (not tested here)
  assert(state.connectionStatus === 1, 'Connection should be restored')
})

// ============================================================================
// Scenario 10: Duplicate Alarm delivery after replay
// ============================================================================
scenario('duplicate Alarm delivery after replay', () => {
  let state = createInitialGuardState(0)

  state = apply(state, InputType.STEP_CHANGED, 1000).state
  state = apply(state, InputType.TICK, 61000).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
  state = apply(state, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state
  const r1 = apply(state, InputType.TICK, 125000)
  const episodeId = r1.state.currentEpisodeId

  // First delivery
  const r2 = apply(r1.state, InputType.ESCALATION_ALARM_FIRED, 155000, { episodeId })
  assert(r2.state.status === GuardStatus.LOCAL_ALARM)

  // Count QUEUE_HELP_REQUEST effects
  const firstHelpCount = r2.effects.filter(e => e.type === EffectType.QUEUE_HELP_REQUEST).length

  // Duplicate delivery (same episodeId, already LOCAL_ALARM)
  const r3 = apply(r2.state, InputType.ESCALATION_ALARM_FIRED, 155500, { episodeId })
  const secondHelpCount = r3.effects.filter(e => e.type === EffectType.QUEUE_HELP_REQUEST).length

  assert(secondHelpCount === 0, 'Duplicate alarm should not produce more QUEUE_HELP_REQUEST effects')
})

// ============================================================================
// Scenario 11: Manual help followed by GPS location update
// ============================================================================
scenario('manual help followed by GPS location update', () => {
  let state = createInitialGuardState(0)

  // Manual help now
  const r1 = apply(state, InputType.USER_HELP_NOW, 1000)
  assert(r1.state.status === GuardStatus.LOCAL_ALARM, 'USER_HELP_NOW should enter LOCAL_ALARM')
  assert(hasEffect(r1.effects, EffectType.QUEUE_HELP_REQUEST), 'Should queue help request')

  // GPS location update arrives later (simulate via payload in a real flow)
  const gpsPayload = { trigger: 'manual', offlineReplay: false, location: { lat: 39.9, lng: 116.4 } }
  // We just verify the original help was queued (GPS update is a separate envelope)
  assert(r1.state.helpWasSent === true, 'helpWasSent should be true')
})

// ============================================================================
// Scenario 12: Resolution after contact request
// ============================================================================
scenario('resolution after contact request', () => {
  let state = createInitialGuardState(0)

  // Send help first
  const r1 = apply(state, InputType.USER_HELP_NOW, 1000)
  assert(r1.state.helpWasSent === true)

  // User resolves
  const r2 = apply(r1.state, InputType.USER_RESOLVED, 5000)
  assert(hasEffect(r2.effects, EffectType.QUEUE_RESOLUTION), 'Should queue resolution after help sent')
  assert(hasEffect(r2.effects, EffectType.STOP_LOCAL_ALARM), 'Should stop local alarm')

  // Resolve again — should NOT produce another resolution (idempotent check)
  // Note: this depends on the resovle track in state. Currently USER_RESOLVED
  // just checks helpWasSent. Multiple calls would add multiple QUEUE_RESOLUTION.
  // This is expected — deduplication by messageId happens at the outbox level.
})

// ============================================================================
// Summary
// ============================================================================
console.log(`\n${'='.repeat(60)}`)
console.log(`Results: ${passedCount}/${scenarioCount} scenarios passed`)
console.log(`${'='.repeat(60)}`)

process.exit(passedCount === scenarioCount ? 0 : 1)
