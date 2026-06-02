import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialGuardState, reduceGuard } from '../src/domain/risk-engine.js'
import { developmentConfig } from '../src/domain/default-config.js'
import { GuardStatus, InputType, EffectType } from '../src/domain/constants.js'

function apply(state, config, type, atMs, payload = {}) {
  const result = reduceGuard(state, { type, atMs, payload }, config)
  return { state: result.state, effects: result.effects || [] }
}

function findEffect(effects, type) {
  return effects.find(e => e.type === type)
}

function hasEffect(effects, type) {
  return effects.some(e => e.type === type)
}

describe('risk-engine', () => {
  const cfg = developmentConfig

  describe('createInitialGuardState', () => {
    it('creates state in STANDBY', () => {
      const state = createInitialGuardState(1000)
      assert.equal(state.status, GuardStatus.STANDBY)
      assert.equal(state.lastMovementAtMs, null)
      assert.equal(state.lastHeartRateAtMs, null)
      assert.deepEqual(state.heartRateSamples, [])
      assert.equal(state.currentEpisodeId, null)
    })
  })

  describe('test 1: sustained movement for 120 seconds enters ACTIVE_GUARD', () => {
    it('enters ACTIVE_GUARD when movement is within 120s window', () => {
      let state = createInitialGuardState(0)

      // Still in STANDBY with no movement
      const r1 = apply(state, cfg, InputType.TICK, 1000)
      assert.equal(r1.state.status, GuardStatus.STANDBY)

      // Step changes at t=2000
      const r2 = apply(r1.state, cfg, InputType.STEP_CHANGED, 2000)
      assert.equal(r2.state.lastMovementAtMs, 2000)

      // TICK 60 seconds later — within 120s window → ACTIVE_GUARD
      const r3 = apply(r2.state, cfg, InputType.TICK, 2000 + 60000)
      assert.equal(r3.state.status, GuardStatus.ACTIVE_GUARD)
    })

    it('stays in STANDBY when movement is outside 120s window', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state

      // TICK 121 seconds later — outside 120s window
      const r = apply(state, cfg, InputType.TICK, 1000 + 121000)
      assert.equal(r.state.status, GuardStatus.STANDBY)
    })
  })

  describe('test 2: high heart rate while movement continues emits only intensity warning', () => {
    it('emits VIBRATE_GENTLE + NOTIFY_INTENSITY but no QUEUE_HELP_REQUEST when moving with high HR', () => {
      // Start in ACTIVE_GUARD with recent movement
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state // now ACTIVE_GUARD
      assert.equal(state.status, GuardStatus.ACTIVE_GUARD)

      // Add 3 HR samples above intensityAlertBpm (170)
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 175 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 80000, { bpm: 178 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 90000, { bpm: 180 }).state

      // TICK while still active (within 120s window of last movement)
      const r = apply(state, cfg, InputType.TICK, 100000)
      assert.equal(r.state.status, GuardStatus.ACTIVE_GUARD)
      assert.ok(hasEffect(r.effects, EffectType.VIBRATE_GENTLE), 'should vibrate gentle')
      assert.ok(hasEffect(r.effects, EffectType.NOTIFY_INTENSITY), 'should notify intensity')
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST), 'must NOT queue help')
    })
  })

  describe('test 3: one high heart-rate sample never queues help', () => {
    it('does not queue help from a single high HR sample while active', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      // Only one high HR sample
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 200 }).state

      // TICK while active
      const r = apply(state, cfg, InputType.TICK, 75000)
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
    })

    it('does not queue help from a single high HR sample after sudden stop', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      // One high HR sample
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 200 }).state

      // Wait beyond 120s window for a sudden stop, then TICK
      // lastMovementAtMs was at 1000, so at 125000 it's 124s > 120s → stopped
      const r = apply(state, cfg, InputType.TICK, 125000)
      // Even with sudden stop, 1 sample is not enough to queue help directly
      // It might trigger medium risk AWAITING_CONFIRMATION, but not QUEUE_HELP_REQUEST
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
    })

    it('does not queue help from a single high HR alone in any state', () => {
      // HR sample with no movement context at all
      let state = createInitialGuardState(0)
      const r = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: 200 })
      // Just recording a sample should produce no effects
      assert.deepEqual(r.effects, [])
    })
  })

  describe('test 4: stale heart rate alone never queues help', () => {
    it('does not queue help when HR samples are too old', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      // 3 HR samples but very old (outside activityEvidenceWindowSec=120s)
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 2000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 3000, { bpm: 195 }).state

      // TICK much later — samples get pruned
      const r = apply(state, cfg, InputType.TICK, 300000)
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
    })

    it('prunes old heart rate samples on TICK', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: 150 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 5000, { bpm: 155 }).state

      // TICK far in the future — samples should be pruned
      const r = apply(state, cfg, InputType.TICK, 300000)
      assert.equal(r.state.heartRateSamples.length, 0)
    })
  })

  describe('test 5: not-worn state pauses risk evaluation and emits only a five-minute reminder', () => {
    it('transitions to NOT_WORN when wearStatus is 0', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      assert.equal(state.status, GuardStatus.ACTIVE_GUARD)

      // Wear changed to not worn
      state = apply(state, cfg, InputType.WEAR_CHANGED, 120000, { wearStatus: 0 }).state
      assert.equal(state.wearStatus, 0)

      // TICK should transition to NOT_WORN
      const r = apply(state, cfg, InputType.TICK, 125000)
      assert.equal(r.state.status, GuardStatus.NOT_WORN)
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
    })

    it('emits NOTIFY_GUARD_PAUSED after notWornPromptSec (300s)', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.WEAR_CHANGED, 1000, { wearStatus: 0 }).state
      state = apply(state, cfg, InputType.TICK, 5000).state // → NOT_WORN
      assert.equal(state.status, GuardStatus.NOT_WORN)

      // TICK after 5 minutes
      const r = apply(state, cfg, InputType.TICK, 5000 + 300 * 1000)
      assert.ok(hasEffect(r.effects, EffectType.NOTIFY_GUARD_PAUSED))
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
    })
  })

  describe('test 6: sudden stop + sustained abnormal HR creates AWAITING_CONFIRMATION and SCHEDULE_ESCALATION_ALARM', () => {
    it('transitions to AWAITING_CONFIRMATION with 30s escalation alarm for high risk', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      assert.equal(state.status, GuardStatus.ACTIVE_GUARD)

      // 3 HR samples above highRiskCandidateBpm (190)
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state

      // Wait until movement evidence window expires (lastMovementAtMs=1000, now=125000 → 124s > 120s)
      // Then TICK should detect sudden stop + sustained abnormal HR
      const r = apply(state, cfg, InputType.TICK, 125000)

      assert.equal(r.state.status, GuardStatus.AWAITING_CONFIRMATION)
      assert.ok(hasEffect(r.effects, EffectType.VIBRATE_URGENT))
      assert.ok(hasEffect(r.effects, EffectType.NOTIFY_CONFIRMATION))

      const alarmEffect = findEffect(r.effects, EffectType.SCHEDULE_ESCALATION_ALARM)
      assert.ok(alarmEffect, 'should have escalation alarm')
      assert.ok(alarmEffect.episodeId, 'alarm should carry episodeId')
      assert.equal(alarmEffect.delaySec, cfg.highRiskConfirmSec)
      assert.equal(r.state.currentEpisodeId, alarmEffect.episodeId)
    })
  })

  describe('test 7: alarm fire for active episode queues help and starts local alarm', () => {
    it('transitions to LOCAL_ALARM and queues help when escalation alarm fires', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state
      const r1 = apply(state, cfg, InputType.TICK, 125000)
      const episodeId = r1.state.currentEpisodeId

      // Fire the escalation alarm with matching episodeId
      const r2 = apply(r1.state, cfg, InputType.ESCALATION_ALARM_FIRED, 155000, { episodeId })

      assert.equal(r2.state.status, GuardStatus.LOCAL_ALARM)
      assert.ok(hasEffect(r2.effects, EffectType.QUEUE_HELP_REQUEST))
      assert.ok(hasEffect(r2.effects, EffectType.START_LOCAL_ALARM))
    })
  })

  describe('test 8: stale or duplicated alarm id is ignored', () => {
    it('ignores escalation alarm with wrong episodeId', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state
      const r1 = apply(state, cfg, InputType.TICK, 125000)
      assert.equal(r1.state.status, GuardStatus.AWAITING_CONFIRMATION)

      // Fire alarm with a DIFFERENT episodeId (simulating stale alarm)
      const r2 = apply(r1.state, cfg, InputType.ESCALATION_ALARM_FIRED, 155000, { episodeId: 'stale-id-123' })
      assert.equal(r2.state.status, GuardStatus.AWAITING_CONFIRMATION)
      assert.ok(!hasEffect(r2.effects, EffectType.QUEUE_HELP_REQUEST))
      assert.ok(!hasEffect(r2.effects, EffectType.START_LOCAL_ALARM))
    })

    it('ignores duplicate alarm after already in LOCAL_ALARM', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state
      const r1 = apply(state, cfg, InputType.TICK, 125000)
      const episodeId = r1.state.currentEpisodeId

      // First alarm fire -> LOCAL_ALARM
      const r2 = apply(r1.state, cfg, InputType.ESCALATION_ALARM_FIRED, 155000, { episodeId })
      assert.equal(r2.state.status, GuardStatus.LOCAL_ALARM)

      // Duplicate alarm fire with same episodeId
      const r3 = apply(r2.state, cfg, InputType.ESCALATION_ALARM_FIRED, 155500, { episodeId })
      assert.equal(r3.state.status, GuardStatus.LOCAL_ALARM)
      assert.ok(!hasEffect(r3.effects, EffectType.QUEUE_HELP_REQUEST))
    })
  })

  describe('test 9: medium risk escalates after 60 seconds', () => {
    it('uses mediumRiskConfirmSec when only some suspicious signals exist', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      // Only 1-2 HR samples above highRiskCandidateBpm (less than minHeartRateSamples=3)
      // But still some elevated readings
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 150 }).state

      // Wait for sudden stop and TICK
      const r = apply(state, cfg, InputType.TICK, 125000)

      assert.equal(r.state.status, GuardStatus.AWAITING_CONFIRMATION)

      const alarmEffect = findEffect(r.effects, EffectType.SCHEDULE_ESCALATION_ALARM)
      assert.ok(alarmEffect, 'should have escalation alarm for medium risk')
      assert.equal(alarmEffect.delaySec, cfg.mediumRiskConfirmSec)
    })
  })

  describe('test 10: ordinary stillness prompts at 3 minutes and escalates at 10 minutes', () => {
    it('emits NOTIFY_CONFIRMATION at ordinaryStopPromptSec (3 min) and QUEUE_HELP_REQUEST at ordinaryStopHelpSec (10 min)', () => {
      // Start in ACTIVE_GUARD
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 10000).state
      state = apply(state, cfg, InputType.TICK, 10000 + 60000).state
      assert.equal(state.status, GuardStatus.ACTIVE_GUARD)

      // Last movement at 10000ms (10s). No abnormal HR.
      // TICK at 3 min after last movement (at 10000 + 180000 = 190000)
      // This is within TICK cadence
      const r1 = apply(state, cfg, InputType.TICK, 10000 + 181000)
      // stopDuration = 181s - 10s = 171s (wait, no — atMs - lastMovementAtMs = 191000 - 10000 = 181000ms = 181s)

      // Actually: at 10000 + 181000 = 191000. atMs-lastMovementAtMs = 191000 - 10000 = 181000ms = 181s >= 180s → prompt
      assert.ok(hasEffect(r1.effects, EffectType.NOTIFY_CONFIRMATION), 'should prompt at 3 min')
      assert.equal(r1.state.status, GuardStatus.ACTIVE_GUARD, 'should stay in ACTIVE_GUARD after prompt')

      // TICK at 10 min after last movement
      const r2 = apply(r1.state, cfg, InputType.TICK, 10000 + 601000)
      // atMs-lastMovementAtMs = 611000 - 10000 = 601000ms = 601s >= 600s → escalate
      assert.ok(hasEffect(r2.effects, EffectType.QUEUE_HELP_REQUEST), 'should queue help at 10 min')
    })
  })

  describe('test 11: USER_SAFE_CONFIRMED cancels alarm and starts cooldown', () => {
    it('from AWAITING_CONFIRMATION, USER_SAFE_CONFIRMED cancels alarm and goes to STANDBY with cooldown', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state
      const r1 = apply(state, cfg, InputType.TICK, 125000)
      const episodeId = r1.state.currentEpisodeId

      // User confirms safe
      const r2 = apply(r1.state, cfg, InputType.USER_SAFE_CONFIRMED, 130000, { episodeId })

      assert.equal(r2.state.status, GuardStatus.STANDBY)
      assert.ok(hasEffect(r2.effects, EffectType.CANCEL_ESCALATION_ALARM))
      assert.ok(r2.state.safeCooldownUntilMs != null, 'should have cooldown timestamp')
    })

    it('from LOCAL_ALARM, USER_SAFE_CONFIRMED cancels alarm and transitions', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 65000, { bpm: 195 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 70000, { bpm: 198 }).state
      state = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 75000, { bpm: 192 }).state
      const r1 = apply(state, cfg, InputType.TICK, 125000)
      const episodeId = r1.state.currentEpisodeId

      // Fire alarm -> LOCAL_ALARM
      const r2 = apply(r1.state, cfg, InputType.ESCALATION_ALARM_FIRED, 155000, { episodeId })

      // User confirms safe
      const r3 = apply(r2.state, cfg, InputType.USER_SAFE_CONFIRMED, 160000)

      assert.equal(r3.state.status, GuardStatus.STANDBY)
      assert.ok(hasEffect(r3.effects, EffectType.CANCEL_ESCALATION_ALARM))
      assert.ok(r3.state.safeCooldownUntilMs != null)
    })
  })

  describe('test 12: rest request pauses detection for restPauseSec', () => {
    it('USER_REST_REQUESTED transitions to REST_PAUSED and stops movement evaluation', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      // Request rest
      const r1 = apply(state, cfg, InputType.USER_REST_REQUESTED, 65000)

      assert.equal(r1.state.status, GuardStatus.REST_PAUSED)
      assert.ok(r1.state.restPauseUntilMs != null)
      assert.equal(r1.state.restPauseUntilMs, 65000 + cfg.restPauseSec * 1000)
    })

    it('in REST_PAUSED, TICK does not evaluate movement', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      const r1 = apply(state, cfg, InputType.USER_REST_REQUESTED, 65000)
      assert.equal(r1.state.status, GuardStatus.REST_PAUSED)

      // TICK while in rest pause — no movement evaluation
      const r2 = apply(r1.state, cfg, InputType.TICK, 70000)
      assert.equal(r2.state.status, GuardStatus.REST_PAUSED)
      assert.ok(!hasEffect(r2.effects, EffectType.QUEUE_HELP_REQUEST))
    })

    it('returns to STANDBY after restPauseSec expires', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state
      const r1 = apply(state, cfg, InputType.USER_REST_REQUESTED, 65000)

      // TICK after restPauseSec has passed
      const r2 = apply(r1.state, cfg, InputType.TICK, 65000 + cfg.restPauseSec * 1000 + 1000)
      assert.equal(r2.state.status, GuardStatus.STANDBY)
    })
  })

  describe('test 13: manual help request enters confirmation without sensor evidence', () => {
    it('USER_HELP_REQUESTED transitions to AWAITING_CONFIRMATION', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      const r = apply(state, cfg, InputType.USER_HELP_REQUESTED, 65000)

      assert.equal(r.state.status, GuardStatus.AWAITING_CONFIRMATION)
      assert.ok(r.state.currentEpisodeId != null)

      // Should schedule an alarm with mediumRiskConfirmSec (since no sensor evidence)
      const alarmEffect = findEffect(r.effects, EffectType.SCHEDULE_ESCALATION_ALARM)
      assert.ok(alarmEffect)
      assert.equal(alarmEffect.episodeId, r.state.currentEpisodeId)
    })
  })

  describe('test 14: USER_HELP_NOW queues help immediately', () => {
    it('USER_HELP_NOW queues QUEUE_HELP_REQUEST directly', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      const r = apply(state, cfg, InputType.USER_HELP_NOW, 65000)

      assert.ok(hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
      assert.equal(r.state.status, GuardStatus.LOCAL_ALARM)
    })
  })

  describe('test 15: USER_RESOLVED queues resolution', () => {
    it('USER_RESOLVED after help was sent emits QUEUE_RESOLUTION', () => {
      let state = createInitialGuardState(0)
      // Set up a state where help was sent
      state = { ...state, helpWasSent: true }

      const r = apply(state, cfg, InputType.USER_RESOLVED, 10000)

      assert.ok(hasEffect(r.effects, EffectType.QUEUE_RESOLUTION))
    })

    it('USER_RESOLVED without help being sent does nothing', () => {
      let state = createInitialGuardState(0)
      const r = apply(state, cfg, InputType.USER_RESOLVED, 10000)

      assert.deepEqual(r.effects, [])
    })
  })

  describe('safety rules: critical protections', () => {
    it('bluetooth disconnect alone never queues help', () => {
      let state = createInitialGuardState(0)
      const r = apply(state, cfg, InputType.PHONE_CONNECTION_CHANGED, 1000, { connectionStatus: 0 })
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
    })

    it('not-worn alone never queues help', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.WEAR_CHANGED, 1000, { wearStatus: 0 }).state
      const r = apply(state, cfg, InputType.TICK, 5000)
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
    })

    it('missing heart-rate samples alone never queue help', () => {
      let state = createInitialGuardState(0)
      state = apply(state, cfg, InputType.STEP_CHANGED, 1000).state
      state = apply(state, cfg, InputType.TICK, 1000 + 60000).state

      // Sudden stop but NO HR samples at all
      const r = apply(state, cfg, InputType.TICK, 125000)
      // Should NOT queue help
      assert.ok(!hasEffect(r.effects, EffectType.QUEUE_HELP_REQUEST))
      // Should NOT enter AWAITING_CONFIRMATION
      assert.equal(r.state.status, GuardStatus.ACTIVE_GUARD)
    })
  })

  describe('invalid heart rate validation', () => {
    it('rejects non-finite bpm values', () => {
      let state = createInitialGuardState(0)
      const r1 = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: NaN })
      assert.equal(r1.state.heartRateSamples.length, 0)

      const r2 = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: Infinity })
      assert.equal(r2.state.heartRateSamples.length, 0)

      const r3 = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: -Infinity })
      assert.equal(r3.state.heartRateSamples.length, 0)
    })

    it('rejects zero or negative bpm', () => {
      let state = createInitialGuardState(0)
      const r1 = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: 0 })
      assert.equal(r1.state.heartRateSamples.length, 0)

      const r2 = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: -5 })
      assert.equal(r2.state.heartRateSamples.length, 0)
    })

    it('accepts valid bpm', () => {
      let state = createInitialGuardState(0)
      const r = apply(state, cfg, InputType.HEART_RATE_SAMPLE, 1000, { bpm: 120 })
      assert.equal(r.state.heartRateSamples.length, 1)
      assert.equal(r.state.lastHeartRateAtMs, 1000)
    })
  })
})
