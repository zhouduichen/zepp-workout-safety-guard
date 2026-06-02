import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createServiceController, resetMessageCounter } from '../src/device/service-controller.js'
import { createInitialGuardState } from '../src/domain/risk-engine.js'
import { createEmptyOutbox, enqueue, listPending } from '../src/domain/outbox.js'
import { createEnvelope } from '../src/domain/protocol.js'
import { acknowledge } from '../src/domain/outbox.js'
import { developmentConfig } from '../src/domain/default-config.js'
import { GuardStatus, InputType, EffectType } from '../src/domain/constants.js'

// ---------------------------------------------------------------------------
// Fake ports
// ---------------------------------------------------------------------------

function createFakeStorage() {
  let guardState = null
  let outbox = null
  return {
    loadGuardState: () => guardState,
    saveGuardState: (s) => { guardState = s },
    loadOutbox: () => outbox,
    saveOutbox: (o) => { outbox = o },
    _reset: () => { guardState = null; outbox = null },
  }
}

function createFakeAlerts() {
  const applied = []
  return {
    apply: (effect) => { applied.push(effect) },
    applied,
    _reset: () => { applied.length = 0 },
  }
}

function createFakeAlarm() {
  const scheduled = []
  let cancelled = false
  return {
    schedule: ({ episodeId, delaySec }) => {
      scheduled.push({ episodeId, delaySec })
      return scheduled.length
    },
    cancel: () => { cancelled = true },
    scheduled,
    cancelled,
    _reset: () => { scheduled.length = 0; cancelled = false },
  }
}

function createFakeBridge(initialConnected = false) {
  let connected = initialConnected
  const sent = []
  return {
    isConnected: () => connected,
    send: (bytes) => { sent.push(bytes) },
    _setConnected: (v) => { connected = v },
    sent,
    _reset: () => { sent.length = 0; connected = initialConnected },
  }
}

function createFakeNow(initialTime = 1000000) {
  let t = initialTime
  return {
    now: () => t,
    _advance: (ms) => { t += ms },
    _set: (v) => { t = v },
    _reset: () => { t = initialTime },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('service-controller', () => {
  let storage, alerts, alarm, bridge, now

  beforeEach(() => {
    storage = createFakeStorage()
    alerts = createFakeAlerts()
    alarm = createFakeAlarm()
    bridge = createFakeBridge(false)
    now = createFakeNow(1000000)
    resetMessageCounter()
  })

  function createController() {
    const ctrl = createServiceController({ config: developmentConfig, storage, alerts, alarm, bridge, now: now.now })
    ctrl.start()
    return ctrl
  }

  describe('start', () => {
    it('initializes guard state and outbox from storage', () => {
      const ctrl = createController()
      const state = ctrl.getState()
      assert.equal(state.status, GuardStatus.STANDBY)
      assert.ok(state._createdAtMs != null)
      assert.deepEqual(ctrl.getOutbox(), { entries: [] })
    })

    it('restores persisted state from storage', () => {
      const saved = createInitialGuardState(5000)
      saved.status = GuardStatus.ACTIVE_GUARD
      storage.saveGuardState(saved)
      storage.saveOutbox(createEmptyOutbox())

      const ctrl = createController()
      assert.equal(ctrl.getState().status, GuardStatus.ACTIVE_GUARD)
      assert.equal(ctrl.getState()._createdAtMs, 5000)
    })
  })

  describe('handleInput', () => {
    it('persists state after input', () => {
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.STEP_CHANGED, atMs: 2000, payload: {} })

      // State should be saved
      const loaded = storage.loadGuardState()
      assert.notEqual(loaded, null)
      assert.equal(loaded.lastMovementAtMs, 2000)
    })

    it('returns engine result with state and effects', () => {
      const ctrl = createController()
      const result = ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 1000, payload: {} })
      assert.equal(result.state.status, GuardStatus.LOCAL_ALARM)
      assert.ok(result.effects.length > 0)
    })

    it('executes alert effects through alerts port', () => {
      const ctrl = createController()
      // Start activity
      ctrl.handleInput({ type: InputType.STEP_CHANGED, atMs: 0, payload: {} })
      ctrl.handleInput({ type: InputType.TICK, atMs: 0 + 60000, payload: {} })
      // Add HR samples
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 65000, payload: { bpm: 195 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 70000, payload: { bpm: 198 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 75000, payload: { bpm: 192 } })
      // Sudden stop + tick
      const r = ctrl.handleInput({ type: InputType.TICK, atMs: 125000, payload: {} })

      // Should produce VIBRATE_URGENT and NOTIFY_CONFIRMATION
      const urgent = r.effects.find(e => e.type === EffectType.VIBRATE_URGENT)
      assert.ok(urgent, 'should have vibrate urgent effect')
      const notifyConfirm = r.effects.find(e => e.type === EffectType.NOTIFY_CONFIRMATION)
      assert.ok(notifyConfirm, 'should have notify confirmation effect')
    })
  })

  describe('test 1: state persistence after every handled input', () => {
    it('persists state after each input', () => {
      const ctrl = createController()

      ctrl.handleInput({ type: InputType.STEP_CHANGED, atMs: 5000, payload: {} })
      let t1 = storage.loadGuardState()
      assert.equal(t1.lastMovementAtMs, 5000)

      ctrl.handleInput({ type: InputType.WEAR_CHANGED, atMs: 6000, payload: { wearStatus: 0 } })
      let t2 = storage.loadGuardState()
      assert.equal(t2.wearStatus, 0)
    })
  })

  describe('test 2: queued help remains pending offline', () => {
    it('queues help but does not send when bridge is not connected', () => {
      bridge._setConnected(false)
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })

      const pending = listPending(ctrl.getOutbox())
      assert.equal(pending.length, 1)
      assert.equal(pending[0].type, 'help.requested')
      assert.equal(bridge.sent.length, 0, 'should not send when offline')
    })
  })

  describe('test 3: queued help sends once online', () => {
    it('sends queued messages when bridge is connected', () => {
      bridge._setConnected(true)
      const ctrl = createController()

      // Queue help while potentially offline, but our fake bridge is connected
      ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })

      // Should have sent via bridge
      assert.ok(bridge.sent.length >= 1, 'should send when connected')
    })
  })

  describe('test 4: reconnect flush does not duplicate messages', () => {
    it('flushOutbox sends pending and marks attempts', () => {
      bridge._setConnected(false)
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })
      assert.equal(bridge.sent.length, 0)
      assert.equal(listPending(ctrl.getOutbox()).length, 1)

      // Connect and flush
      bridge._setConnected(true)
      const outboxBefore = ctrl.getOutbox()
      ctrl.flushOutbox()

      // Should still have 1 pending (marked attempt but not acknowledged)
      const pending = listPending(ctrl.getOutbox())
      assert.equal(listPending(ctrl.getOutbox()).length, 1)
      // But it should have been sent via bridge
      assert.ok(bridge.sent.length >= 1, 'should send on flush')
    })
  })

  describe('test 5: duplicate alarm delivery does not duplicate help', () => {
    it('duplicate alarm does not queue duplicate help', () => {
      bridge._setConnected(false)
      const ctrl = createController()

      ctrl.handleInput({ type: InputType.STEP_CHANGED, atMs: 0, payload: {} })
      ctrl.handleInput({ type: InputType.TICK, atMs: 60000, payload: {} })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 65000, payload: { bpm: 195 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 70000, payload: { bpm: 198 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 75000, payload: { bpm: 192 } })
      const r1 = ctrl.handleInput({ type: InputType.TICK, atMs: 125000, payload: {} })
      const episodeId = r1.state.currentEpisodeId

      // First alarm
      const r2 = ctrl.handleEscalationAlarm({ episodeId, atMs: 155000 })
      assert.equal(r2.state.status, GuardStatus.LOCAL_ALARM)

      const helpCountBefore = listPending(ctrl.getOutbox()).filter(e => e.type === 'help.requested').length

      // Duplicate alarm
      const r3 = ctrl.handleEscalationAlarm({ episodeId, atMs: 155500 })
      assert.equal(r3.state.status, GuardStatus.LOCAL_ALARM)

      const helpCountAfter = listPending(ctrl.getOutbox()).filter(e => e.type === 'help.requested').length
      assert.equal(helpCountAfter, helpCountBefore, 'duplicate alarm should not add more help')
    })
  })

  describe('test 6: ack removes pending delivery', () => {
    it('messages are removed from pending after acknowledgment', () => {
      bridge._setConnected(false)
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })
      assert.equal(listPending(ctrl.getOutbox()).length, 1)

      // Simulate ack (via direct outbox manipulation like a side service would)
      const outbox = ctrl.getOutbox()
      const msgId = outbox.entries[0].envelope.messageId
      const acked = acknowledge(outbox, msgId, 3000)
      // Store it back
      storage.saveOutbox(acked)

      // Reload
      const ctrl2 = createController()
      assert.equal(listPending(ctrl2.getOutbox()).length, 0)
    })
  })

  describe('test 7: local alarm starts even when phone is offline', () => {
    it('starts LOCAL_ALARM even when bridge disconnected', () => {
      bridge._setConnected(false)
      const ctrl = createController()
      const result = ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })

      assert.equal(result.state.status, GuardStatus.LOCAL_ALARM)

      const startAlarm = result.effects.find(e => e.type === EffectType.START_LOCAL_ALARM)
      assert.ok(startAlarm, 'local alarm effect should be present')
    })
  })

  describe('test 8: resolution queued only after help sent', () => {
    it('queues resolution when help was sent', () => {
      bridge._setConnected(false)
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })

      const helpCount = listPending(ctrl.getOutbox()).filter(e => e.type === 'help.requested').length
      assert.equal(helpCount, 1)

      // Resolve
      ctrl.handleInput({ type: InputType.USER_RESOLVED, atMs: 5000, payload: {} })
      const resolutionCount = listPending(ctrl.getOutbox()).filter(e => e.type === 'help.resolved').length
      assert.equal(resolutionCount, 1, 'resolution should be queued')
    })

    it('does not queue resolution when no help was sent', () => {
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.USER_RESOLVED, atMs: 5000, payload: {} })
      const pending = listPending(ctrl.getOutbox())
      assert.equal(pending.length, 0, 'no resolution without help sent')
    })
  })

  describe('test 9: flushOutbox sends only pending entries', () => {
    it('sends unacknowledged entries on flush', () => {
      bridge._setConnected(false)
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })
      ctrl.handleInput({ type: InputType.USER_RESOLVED, atMs: 5000, payload: {} })

      // Both pending
      assert.equal(listPending(ctrl.getOutbox()).length, 2)

      bridge._setConnected(true)
      ctrl.flushOutbox()

      // Should have sent via bridge
      assert.ok(bridge.sent.length >= 1, 'should send pending on flush')
    })
  })

  describe('test 10: handleEscalationAlarm with matching episodeId', () => {
    it('queues help when alarm fires with matching episodeId', () => {
      bridge._setConnected(false)
      const ctrl = createController()

      ctrl.handleInput({ type: InputType.STEP_CHANGED, atMs: 0, payload: {} })
      ctrl.handleInput({ type: InputType.TICK, atMs: 60000, payload: {} })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 65000, payload: { bpm: 195 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 70000, payload: { bpm: 198 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 75000, payload: { bpm: 192 } })
      const r1 = ctrl.handleInput({ type: InputType.TICK, atMs: 125000, payload: {} })
      const episodeId = r1.state.currentEpisodeId

      // Fire alarm
      const r2 = ctrl.handleEscalationAlarm({ episodeId, atMs: 155000 })
      assert.equal(r2.state.status, GuardStatus.LOCAL_ALARM)

      const helpCount = listPending(ctrl.getOutbox()).filter(e => e.type === 'help.requested').length
      assert.equal(helpCount, 1, 'alarm should queue help request')
    })
  })

  describe('ESCALATION_ALARM scheduling', () => {
    it('schedules alarm via alarm port when entering confirmation', () => {
      const ctrl = createController()
      ctrl.handleInput({ type: InputType.STEP_CHANGED, atMs: 0, payload: {} })
      ctrl.handleInput({ type: InputType.TICK, atMs: 60000, payload: {} })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 65000, payload: { bpm: 195 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 70000, payload: { bpm: 198 } })
      ctrl.handleInput({ type: InputType.HEART_RATE_SAMPLE, atMs: 75000, payload: { bpm: 192 } })
      ctrl.handleInput({ type: InputType.TICK, atMs: 125000, payload: {} })

      assert.equal(alarm.scheduled.length, 1)
      assert.equal(alarm.scheduled[0].delaySec, developmentConfig.highRiskConfirmSec)
    })
  })

  describe('event history', () => {
    it('getHistory returns empty array initially', () => {
      const ctrl = createController()
      const history = ctrl.getHistory()
      assert.ok(Array.isArray(history))
      assert.equal(history.length, 0)
    })

    it('recordHelpRequestEntry adds a history entry', () => {
      bridge._setConnected(true)
      const ctrl = createController()

      ctrl.recordHelpRequestEntry({
        messageId: 'evt-1000-0001',
        trigger: 'manual',
        occurredAtMs: 1000,
        hasLocation: false,
        isReplayed: false,
      })

      const history = ctrl.getHistory()
      assert.equal(history.length, 1)
      assert.equal(history[0].eventId, 'evt-1000-0001')
      assert.equal(history[0].trigger, 'manual')
      assert.equal(history[0].status, 'acknowledged')
    })

    it('recordHelpRequestEntry for offline marks status as queued', () => {
      bridge._setConnected(false)
      const ctrl = createController()

      ctrl.recordHelpRequestEntry({
        messageId: 'evt-2000-0001',
        trigger: 'automatic_high_risk',
        occurredAtMs: 2000,
        hasLocation: true,
        isReplayed: false,
      })

      const history = ctrl.getHistory()
      assert.equal(history.length, 1)
      assert.equal(history[0].status, 'queued')
      assert.equal(history[0].hasLocation, true)
    })

    it('getHistory returns newest first', () => {
      bridge._setConnected(true)
      const ctrl = createController()

      ctrl.recordHelpRequestEntry({
        messageId: 'evt-1000-0001',
        trigger: 'automatic_high_risk',
        occurredAtMs: 1000,
        hasLocation: false,
        isReplayed: false,
      })
      ctrl.recordHelpRequestEntry({
        messageId: 'evt-2000-0001',
        trigger: 'manual',
        occurredAtMs: 2000,
        hasLocation: false,
        isReplayed: false,
      })

      const history = ctrl.getHistory()
      assert.equal(history.length, 2)
      assert.equal(history[0].eventId, 'evt-2000-0001')
      assert.equal(history[1].eventId, 'evt-1000-0001')
    })

    it('clearHistory empties the event list', () => {
      bridge._setConnected(true)
      const ctrl = createController()

      ctrl.recordHelpRequestEntry({
        messageId: 'evt-1000-0001',
        trigger: 'manual',
        occurredAtMs: 1000,
        hasLocation: false,
        isReplayed: false,
      })
      assert.equal(ctrl.getHistory().length, 1)

      ctrl.clearHistory()
      assert.equal(ctrl.getHistory().length, 0)
    })

    it('replayed flag is recorded correctly', () => {
      bridge._setConnected(true)
      const ctrl = createController()

      ctrl.recordHelpRequestEntry({
        messageId: 'evt-1000-0001',
        trigger: 'manual',
        occurredAtMs: 1000,
        hasLocation: false,
        isReplayed: true,
      })

      const history = ctrl.getHistory()
      assert.equal(history[0].replayed, true)
    })
  })

  describe('triggerResolved', () => {
    it('marks unresolved help as resolved', () => {
      bridge._setConnected(true)
      const ctrl = createController()

      ctrl.recordHelpRequestEntry({
        messageId: 'evt-1000-0001',
        trigger: 'manual',
        occurredAtMs: 1000,
        hasLocation: false,
        isReplayed: false,
      })

      assert.equal(ctrl.getHistory()[0].status, 'acknowledged')

      ctrl.triggerResolved()
      assert.equal(ctrl.getHistory()[0].status, 'resolved')
    })

    it('does not duplicate resolution on repeated calls', () => {
      bridge._setConnected(true)
      const ctrl = createController()

      ctrl.handleInput({ type: InputType.USER_HELP_NOW, atMs: 2000, payload: {} })
      const helpCount = ctrl.getOutbox().entries.filter(e => e.envelope.type === 'help.requested').length
      assert.equal(helpCount, 1)

      ctrl.triggerResolved()

      // Second call must not add another resolution
      ctrl.triggerResolved()
      const resCount = ctrl.getOutbox().entries.filter(e => e.envelope.type === 'help.resolved').length
      assert.equal(resCount, 1)
    })

    it('does not enqueue resolution if no help was sent', () => {
      const ctrl = createController()
      ctrl.triggerResolved()

      const resCount = ctrl.getOutbox().entries.filter(e => e.envelope.type === 'help.resolved').length
      assert.equal(resCount, 0)
    })
  })
})
