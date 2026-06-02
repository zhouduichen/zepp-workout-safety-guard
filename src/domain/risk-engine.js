import { GuardStatus, InputType, EffectType } from './constants.js'

/**
 * Create the initial guard state at the given timestamp.
 * @param {number} atMs - epoch milliseconds
 * @returns {object} initial state
 */
export function createInitialGuardState(atMs) {
  return {
    status: GuardStatus.STANDBY,
    lastMovementAtMs: null,
    lastHeartRateAtMs: null,
    heartRateSamples: [],
    wearStatus: 1,
    connectionStatus: null,
    currentEpisodeId: null,
    restPauseUntilMs: null,
    safeCooldownUntilMs: null,
    notWornLastNotifiedAtMs: null,
    lastOrdinaryPromptAtMs: null,
    lastIntensityNotifiedAtMs: null,
    helpWasSent: false,
    episodeCounter: 0,
    _createdAtMs: atMs,
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function generateEpisodeId(state, atMs) {
  return `ep-${atMs}-${state.episodeCounter}`
}

function pruneSamples(samples, atMs, windowMs) {
  const cutoff = atMs - windowMs
  return samples.filter(s => s.atMs >= cutoff)
}

// ---------------------------------------------------------------------------
// reducer
// ---------------------------------------------------------------------------

/**
 * Pure reducer: takes the current state and an input event, returns the next
 * state and a list of effects.
 *
 * @param {object}  state
 * @param {object}  input   - { type, atMs, payload }
 * @param {object}  config  - developmentConfig
 * @returns {{ state: object, effects: object[] }}
 */
export function reduceGuard(state, input, config) {
  const { type, atMs, payload = {} } = input
  const effects = []
  const s = { ...state }

  switch (type) {
    case InputType.TICK:
      return handleTick(s, atMs, config, effects)

    case InputType.STEP_CHANGED:
    case InputType.DISTANCE_CHANGED:
      s.lastMovementAtMs = atMs
      if (s.status === GuardStatus.NOT_WORN && s.wearStatus === 1) {
        s.status = GuardStatus.STANDBY
        s.notWornLastNotifiedAtMs = null
        effects.push({ type: EffectType.LOG_EVENT, message: 'movement while worn: exiting not_worn' })
      }
      return { state: s, effects }

    case InputType.HEART_RATE_SAMPLE:
      return handleHeartRateSample(s, atMs, payload, config, effects)

    case InputType.WEAR_CHANGED:
      return handleWearChanged(s, atMs, payload, config, effects)

    case InputType.PHONE_CONNECTION_CHANGED:
      s.connectionStatus = payload.connectionStatus
      return { state: s, effects }

    case InputType.ESCALATION_ALARM_FIRED:
      return handleEscalationAlarmFired(s, atMs, payload, effects)

    case InputType.USER_SAFE_REQUESTED:
      effects.push({ type: EffectType.LOG_EVENT, message: 'safe requested' })
      return { state: s, effects }

    case InputType.USER_SAFE_CONFIRMED:
      return handleUserSafeConfirmed(s, atMs, config, effects)

    case InputType.USER_REST_REQUESTED:
      return handleUserRestRequested(s, atMs, config, effects)

    case InputType.USER_HELP_REQUESTED:
      return handleUserHelpRequested(s, atMs, config, effects)

    case InputType.USER_HELP_NOW:
      return handleUserHelpNow(s, atMs, config, effects)

    case InputType.USER_RESOLVED:
      return handleUserResolved(s, atMs, effects)

    default:
      return { state: s, effects }
  }
}

// ---------------------------------------------------------------------------
// per-input handlers
// ---------------------------------------------------------------------------

function handleHeartRateSample(s, atMs, payload, config, effects) {
  const { bpm } = payload
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return { state: s, effects }
  }
  s.lastHeartRateAtMs = atMs
  s.heartRateSamples = [...s.heartRateSamples, { atMs, bpm }]
  // prune to keep within window
  const windowMs = config.activityEvidenceWindowSec * 1000
  s.heartRateSamples = pruneSamples(s.heartRateSamples, atMs, windowMs)
  return { state: s, effects }
}

function handleWearChanged(s, atMs, payload, config, effects) {
  s.wearStatus = payload.wearStatus
  if (s.wearStatus === 1 && s.status === GuardStatus.NOT_WORN) {
    s.status = GuardStatus.STANDBY
    s.notWornLastNotifiedAtMs = null
    effects.push({ type: EffectType.LOG_EVENT, message: 're-worn: returning to standby' })
  }
  return { state: s, effects }
}

// ---------------------------------------------------------------------------
// TICK (main evaluation cycle)
// ---------------------------------------------------------------------------

function handleTick(s, atMs, config, effects) {
  // Always prune old HR samples on tick
  const windowMs = config.activityEvidenceWindowSec * 1000
  s.heartRateSamples = pruneSamples(s.heartRateSamples, atMs, windowMs)

  switch (s.status) {
    case GuardStatus.STANDBY:
      return tickInStandby(s, atMs, config, effects)
    case GuardStatus.ACTIVE_GUARD:
      return tickInActiveGuard(s, atMs, config, effects)
    case GuardStatus.NOT_WORN:
      return tickInNotWorn(s, atMs, config, effects)
    case GuardStatus.REST_PAUSED:
      return tickInRestPaused(s, atMs, config, effects)
    default:
      // AWAITING_CONFIRMATION and LOCAL_ALARM do nothing on tick
      return { state: s, effects }
  }
}

function tickInStandby(s, atMs, config, effects) {
  // Expire safe cooldown
  if (s.safeCooldownUntilMs != null && atMs >= s.safeCooldownUntilMs) {
    s.safeCooldownUntilMs = null
  }

  // Not worn
  if (s.wearStatus === 0) {
    s.status = GuardStatus.NOT_WORN
    effects.push({ type: EffectType.LOG_EVENT, message: 'not worn: entering not_worn' })
    return { state: s, effects }
  }

  // In safe cooldown – do not activate
  if (s.safeCooldownUntilMs != null && atMs < s.safeCooldownUntilMs) {
    return { state: s, effects }
  }

  // Sustained activity → ACTIVE_GUARD
  if (s.lastMovementAtMs != null) {
    const elapsedMs = atMs - s.lastMovementAtMs
    if (elapsedMs <= config.activityEvidenceWindowSec * 1000) {
      s.status = GuardStatus.ACTIVE_GUARD
      effects.push({ type: EffectType.LOG_EVENT, message: 'sustained activity: entering active_guard' })
    }
  }

  return { state: s, effects }
}

function tickInActiveGuard(s, atMs, config, effects) {
  // Expire safe cooldown
  if (s.safeCooldownUntilMs != null && atMs >= s.safeCooldownUntilMs) {
    s.safeCooldownUntilMs = null
  }

  // Not worn
  if (s.wearStatus === 0) {
    s.status = GuardStatus.NOT_WORN
    effects.push({ type: EffectType.LOG_EVENT, message: 'not worn during guard: entering not_worn' })
    return { state: s, effects }
  }

  // Expire rest pause
  if (s.restPauseUntilMs != null && atMs >= s.restPauseUntilMs) {
    s.status = GuardStatus.STANDBY
    s.restPauseUntilMs = null
    effects.push({ type: EffectType.LOG_EVENT, message: 'rest pause expired: returning to standby' })
    return { state: s, effects }
  }

  // In safe cooldown
  if (s.safeCooldownUntilMs != null && atMs < s.safeCooldownUntilMs) {
    s.status = GuardStatus.STANDBY
    effects.push({ type: EffectType.LOG_EVENT, message: 'in safe cooldown: returning to standby' })
    return { state: s, effects }
  }

  const movementRecent =
    s.lastMovementAtMs != null &&
    atMs - s.lastMovementAtMs <= config.activityEvidenceWindowSec * 1000

  if (movementRecent) {
    return evaluateIntensity(s, atMs, config, effects)
  }

  // ---- Sudden stop / stillness detected ----
  const highRiskCount = s.heartRateSamples.filter(
    sample => sample.bpm >= config.highRiskCandidateBpm,
  ).length

  if (highRiskCount >= config.minHeartRateSamples) {
    return enterConfirmation(s, atMs, config, effects, config.highRiskConfirmSec, true)
  }

  if (highRiskCount > 0) {
    return enterConfirmation(s, atMs, config, effects, config.mediumRiskConfirmSec, false)
  }

  // Ordinary stillness – no abnormal HR
  return evaluateOrdinaryStillness(s, atMs, config, effects)
}

function tickInNotWorn(s, atMs, config, effects) {
  // Wear restored
  if (s.wearStatus === 1) {
    s.status = GuardStatus.STANDBY
    s.notWornLastNotifiedAtMs = null
    effects.push({ type: EffectType.LOG_EVENT, message: 're-worn: returning to standby' })
    return { state: s, effects }
  }

  // Periodic guard-paused reminder
  const elapsedSinceLastNotify =
    s.notWornLastNotifiedAtMs == null
      ? Infinity
      : atMs - s.notWornLastNotifiedAtMs

  if (elapsedSinceLastNotify >= config.notWornPromptSec * 1000) {
    s.notWornLastNotifiedAtMs = atMs
    effects.push({ type: EffectType.NOTIFY_GUARD_PAUSED })
    effects.push({ type: EffectType.LOG_EVENT, message: 'not worn: guard paused reminder' })
  }

  return { state: s, effects }
}

function tickInRestPaused(s, atMs, config, effects) {
  if (s.restPauseUntilMs != null && atMs >= s.restPauseUntilMs) {
    s.status = GuardStatus.STANDBY
    s.restPauseUntilMs = null
    effects.push({ type: EffectType.LOG_EVENT, message: 'rest pause expired: returning to standby' })
  }
  return { state: s, effects }
}

// ---------------------------------------------------------------------------
// evaluation helpers
// ---------------------------------------------------------------------------

function evaluateIntensity(s, atMs, config, effects) {
  const highCount = s.heartRateSamples.filter(
    sample => sample.bpm >= config.intensityAlertBpm,
  ).length

  const timeSinceLastNotify =
    s.lastIntensityNotifiedAtMs == null
      ? Infinity
      : atMs - s.lastIntensityNotifiedAtMs

  if (highCount >= config.minHeartRateSamples && timeSinceLastNotify >= config.intensitySustainSec * 1000) {
    s.lastIntensityNotifiedAtMs = atMs
    effects.push({ type: EffectType.VIBRATE_GENTLE })
    effects.push({ type: EffectType.NOTIFY_INTENSITY })
    effects.push({ type: EffectType.LOG_EVENT, message: 'intensity: high hr during activity' })
  }

  return { state: s, effects }
}

function enterConfirmation(s, atMs, config, effects, delaySec, isHighRisk) {
  s.episodeCounter += 1
  const episodeId = generateEpisodeId(s, atMs)
  s.currentEpisodeId = episodeId
  s.status = GuardStatus.AWAITING_CONFIRMATION

  effects.push({ type: EffectType.SCHEDULE_ESCALATION_ALARM, episodeId, delaySec })
  effects.push({ type: EffectType.NOTIFY_CONFIRMATION })

  if (isHighRisk) {
    effects.push({ type: EffectType.VIBRATE_URGENT })
  } else {
    effects.push({ type: EffectType.VIBRATE_GENTLE })
  }

  effects.push({
    type: EffectType.LOG_EVENT,
    message: `${isHighRisk ? 'high' : 'medium'} risk: confirmation (delay=${delaySec}s)`,
  })

  return { state: s, effects }
}

function evaluateOrdinaryStillness(s, atMs, config, effects) {
  const stopDurationSec = s.lastMovementAtMs == null ? 0 : (atMs - s.lastMovementAtMs) / 1000

  if (stopDurationSec >= config.ordinaryStopHelpSec) {
    // 10 min → escalate
    s.helpWasSent = true
    s.status = GuardStatus.LOCAL_ALARM
    effects.push({ type: EffectType.QUEUE_HELP_REQUEST })
    effects.push({ type: EffectType.START_LOCAL_ALARM })
    effects.push({ type: EffectType.LOG_EVENT, message: 'ordinary stillness: escalating after 10 min' })
    return { state: s, effects }
  }

  if (stopDurationSec >= config.ordinaryStopPromptSec) {
    const timeSinceLastPrompt =
      s.lastOrdinaryPromptAtMs == null
        ? Infinity
        : atMs - s.lastOrdinaryPromptAtMs

    if (timeSinceLastPrompt >= config.ordinaryStopPromptSec * 1000) {
      s.lastOrdinaryPromptAtMs = atMs
      effects.push({ type: EffectType.NOTIFY_CONFIRMATION })
      effects.push({ type: EffectType.VIBRATE_GENTLE })
      effects.push({ type: EffectType.LOG_EVENT, message: 'ordinary stillness: prompting at 3 min' })
    }
  }

  return { state: s, effects }
}

// ---------------------------------------------------------------------------
// user interaction handlers
// ---------------------------------------------------------------------------

function handleEscalationAlarmFired(s, atMs, payload, effects) {
  const { episodeId } = payload

  // Stale alarm – episodeId doesn't match current
  if (episodeId !== s.currentEpisodeId) {
    effects.push({ type: EffectType.LOG_EVENT, message: 'ignoring stale alarm' })
    return { state: s, effects }
  }

  // Already escalated
  if (s.status === GuardStatus.LOCAL_ALARM) {
    effects.push({ type: EffectType.LOG_EVENT, message: 'ignoring duplicate alarm' })
    return { state: s, effects }
  }

  // Not awaiting confirmation (e.g. already resolved)
  if (s.status !== GuardStatus.AWAITING_CONFIRMATION) {
    effects.push({ type: EffectType.LOG_EVENT, message: 'ignoring alarm: not awaiting confirmation' })
    return { state: s, effects }
  }

  s.status = GuardStatus.LOCAL_ALARM
  s.helpWasSent = true
  effects.push({ type: EffectType.QUEUE_HELP_REQUEST })
  effects.push({ type: EffectType.START_LOCAL_ALARM })
  effects.push({ type: EffectType.LOG_EVENT, message: 'alarm fired: help queued' })

  return { state: s, effects }
}

function handleUserSafeConfirmed(s, atMs, config, effects) {
  if (s.currentEpisodeId != null) {
    effects.push({ type: EffectType.CANCEL_ESCALATION_ALARM })
  }
  s.currentEpisodeId = null
  s.status = GuardStatus.STANDBY
  s.safeCooldownUntilMs = atMs + config.safeCooldownSec * 1000
  s.lastOrdinaryPromptAtMs = null
  s.lastIntensityNotifiedAtMs = null
  effects.push({ type: EffectType.STOP_LOCAL_ALARM })
  effects.push({ type: EffectType.LOG_EVENT, message: 'safe confirmed: cooldown started' })
  return { state: s, effects }
}

function handleUserRestRequested(s, atMs, config, effects) {
  s.status = GuardStatus.REST_PAUSED
  s.restPauseUntilMs = atMs + config.restPauseSec * 1000
  if (s.currentEpisodeId != null) {
    effects.push({ type: EffectType.CANCEL_ESCALATION_ALARM })
    s.currentEpisodeId = null
  }
  effects.push({ type: EffectType.NOTIFY_GUARD_PAUSED })
  effects.push({ type: EffectType.LOG_EVENT, message: 'rest requested: paused' })
  return { state: s, effects }
}

function handleUserHelpRequested(s, atMs, config, effects) {
  s.episodeCounter += 1
  const episodeId = generateEpisodeId(s, atMs)
  s.currentEpisodeId = episodeId
  s.status = GuardStatus.AWAITING_CONFIRMATION
  effects.push({ type: EffectType.SCHEDULE_ESCALATION_ALARM, episodeId, delaySec: config.mediumRiskConfirmSec })
  effects.push({ type: EffectType.NOTIFY_CONFIRMATION })
  effects.push({ type: EffectType.VIBRATE_URGENT })
  effects.push({ type: EffectType.LOG_EVENT, message: 'help requested: confirmation' })
  return { state: s, effects }
}

function handleUserHelpNow(s, atMs, config, effects) {
  s.helpWasSent = true
  s.status = GuardStatus.LOCAL_ALARM
  effects.push({ type: EffectType.QUEUE_HELP_REQUEST })
  effects.push({ type: EffectType.START_LOCAL_ALARM })
  effects.push({ type: EffectType.LOG_EVENT, message: 'help now: immediate' })
  return { state: s, effects }
}

function handleUserResolved(s, atMs, effects) {
  if (s.helpWasSent) {
    effects.push({ type: EffectType.QUEUE_RESOLUTION })
    effects.push({ type: EffectType.STOP_LOCAL_ALARM })
    effects.push({ type: EffectType.LOG_EVENT, message: 'resolved: resolution queued' })
  }
  return { state: s, effects }
}
