import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createAssistController, AssistState } from '../src/pages/assist-controller.js'

// ---------------------------------------------------------------------------
// Fake clock helpers
// ---------------------------------------------------------------------------

function createFakeClock() {
  let time = 1000000
  let timerId = 0
  const timers = new Map()

  return {
    now: () => time,
    setTimeout: (fn, ms) => {
      const id = ++timerId
      timers.set(id, { fn, ms, fired: false })
      return id
    },
    clearTimeout: (id) => {
      timers.delete(id)
    },
    /** Fire all pending timers in order, advancing the clock. */
    _fireNext() {
      for (const [id, timer] of timers) {
        if (!timer.fired) {
          timer.fired = true
          time += timer.ms
          timers.delete(id)
          timer.fn()
          return id
        }
      }
      return null
    },
    /** Fire N consecutive 1-second ticks (for countdown). */
    _fireTicks(n) {
      for (let i = 0; i < n; i++) {
        this._fireNext()
      }
    },
    /** Returns number of pending timers. */
    _pendingCount() {
      return timers.size
    },
    _reset() {
      time = 1000000
      timerId = 0
      timers.clear()
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('assist-controller', () => {
  let clock
  let countdownValues
  let helpSentPayload
  let locationPayloads
  let cancelledCalled

  beforeEach(() => {
    clock = createFakeClock()
    countdownValues = []
    helpSentPayload = null
    locationPayloads = []
    cancelledCalled = false
  })

  function createController() {
    return createAssistController({
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      onCountdownChange: (remaining) => { countdownValues.push(remaining) },
      onHelpSent: (payload) => { helpSentPayload = payload },
      onLocationAvailable: (lat, lng) => { locationPayloads.push({ lat, lng }) },
      onCancelled: () => { cancelledCalled = true },
    })
  }

  describe('initial state', () => {
    it('starts in COUNTDOWN state', () => {
      const ctrl = createController()
      ctrl.start()
      assert.equal(ctrl.getState(), AssistState.COUNTDOWN)
      assert.equal(ctrl.getRemaining(), 30)
      assert.equal(countdownValues[0], 30)
    })
  })

  describe('countdown progression', () => {
    it('decrements remaining each second', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(3)
      assert.equal(ctrl.getRemaining(), 27)
      assert.deepEqual(countdownValues, [30, 29, 28, 27])
    })

    it('sends help when countdown reaches 0', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(30)
      assert.equal(ctrl.getState(), AssistState.HELP_SENT)
      assert.equal(ctrl.getRemaining(), 0)
      assert.ok(helpSentPayload !== null, 'onHelpSent should be called')
      assert.equal(helpSentPayload.hasLocation, false)
    })
  })

  describe('immediate help (helpNow)', () => {
    it('sends help immediately from COUNTDOWN state', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(5) // 25 remaining
      ctrl.helpNow()

      assert.equal(ctrl.getState(), AssistState.HELP_SENT)
      assert.ok(helpSentPayload !== null)
      // No more timers countdown
      const remainingAfter = ctrl.getRemaining()
      assert.equal(remainingAfter, 25)
    })

    it('does nothing from CANCELLED state', () => {
      const ctrl = createController()
      ctrl.start()
      ctrl.cancelRequest()
      ctrl.confirmCancel()
      helpSentPayload = null // reset
      ctrl.helpNow()
      assert.equal(helpSentPayload, null)
    })
  })

  describe('cancellation', () => {
    it('enters CANCELLING state on first tap', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(5) // 25 remaining
      ctrl.cancelRequest()

      assert.equal(ctrl.getState(), AssistState.CANCELLING)
      // Timer should be cleared
      assert.equal(clock._pendingCount(), 0)
    })

    it('cancelRequest does nothing from HELP_SENT state', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(30) // help sent
      ctrl.cancelRequest()

      // Should still be HELP_SENT
      assert.equal(ctrl.getState(), AssistState.HELP_SENT)
    })

    it('abortCancel returns to countdown', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(10) // 20 remaining
      ctrl.cancelRequest()

      assert.equal(ctrl.getState(), AssistState.CANCELLING)

      ctrl.abortCancel()
      assert.equal(ctrl.getState(), AssistState.COUNTDOWN)
      // Timer should be re-established
      assert.ok(clock._pendingCount() >= 1)
    })

    it('confirmCancel enters CANCELLED state', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(3)
      ctrl.cancelRequest()
      ctrl.confirmCancel()

      assert.equal(ctrl.getState(), AssistState.CANCELLED)
      assert.ok(cancelledCalled, 'onCancelled should be called')
      assert.equal(clock._pendingCount(), 0)
    })

    it('two-step: tap cancel then tap confirm completes cancellation', () => {
      const ctrl = createController()
      ctrl.start()

      // Step 1: tap cancel request
      ctrl.cancelRequest()
      assert.equal(ctrl.getState(), AssistState.CANCELLING)

      // Step 2: tap confirm safe
      ctrl.confirmCancel()
      assert.equal(ctrl.getState(), AssistState.CANCELLED)
      assert.ok(cancelledCalled)
    })

    it('confirmCancel does nothing from COUNTDOWN state', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(5)
      ctrl.confirmCancel()

      // Should remain COUNTDOWN
      assert.equal(ctrl.getState(), AssistState.COUNTDOWN)
      assert.equal(cancelledCalled, false)
    })
  })

  describe('GPS location updates', () => {
    it('locationUpdate before help sent only records hasLocation', () => {
      const ctrl = createController()
      ctrl.start()
      ctrl.locationUpdate(39.9042, 116.4074)

      assert.equal(ctrl.hasLocationBeenAcquired(), true)
      assert.equal(locationPayloads.length, 0)
    })

    it('locationUpdate after help sent triggers onLocationAvailable', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(30) // help sent
      assert.equal(ctrl.getState(), AssistState.HELP_SENT)

      ctrl.locationUpdate(39.9042, 116.4074)

      assert.equal(locationPayloads.length, 1)
      assert.equal(locationPayloads[0].lat, 39.9042)
      assert.equal(locationPayloads[0].lng, 116.4074)
    })

    it('locationUpdate with hasLocation flag in helpSent', () => {
      const ctrl = createController()
      ctrl.start()
      ctrl.locationUpdate(39.9042, 116.4074)
      clock._fireTicks(30) // help sent

      assert.ok(helpSentPayload !== null)
      assert.equal(helpSentPayload.hasLocation, true)
    })

    it('sends the first help event before a pre-acquired location update', () => {
      const calls = []
      const ctrl = createAssistController({
        now: clock.now,
        setTimeout: clock.setTimeout,
        clearTimeout: clock.clearTimeout,
        onCountdownChange: () => {},
        onHelpSent: () => { calls.push('help') },
        onLocationAvailable: () => { calls.push('location') },
        onCancelled: () => {},
      })

      ctrl.start()
      ctrl.locationUpdate(39.9042, 116.4074)
      clock._fireTicks(30)

      assert.deepEqual(calls, ['help', 'location'])
    })

    it('locationUpdate after cancellation is ignored', () => {
      const ctrl = createController()
      ctrl.start()
      ctrl.cancelRequest()
      ctrl.confirmCancel()

      ctrl.locationUpdate(39.9042, 116.4074)
      assert.equal(locationPayloads.length, 0)
    })
  })

  describe('GPS timeout or failure', () => {
    it('help is sent even without GPS fix', () => {
      const ctrl = createController()
      ctrl.start()
      // No location update at all
      clock._fireTicks(30)

      assert.equal(ctrl.getState(), AssistState.HELP_SENT)
      assert.equal(helpSentPayload.hasLocation, false)
    })

    it('no crash if destroy is called before GPS callback', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(5)
      ctrl.destroy()

      // Must not throw
      ctrl.locationUpdate(39.9042, 116.4074)
    })
  })

  describe('cleanup idempotency', () => {
    it('destroy twice does not throw', () => {
      const ctrl = createController()
      ctrl.start()
      ctrl.destroy()
      ctrl.destroy() // must not throw
    })

    it('destroy clears timers', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(5)
      ctrl.destroy()
      const pending = clock._pendingCount()
      assert.equal(pending, 0)
    })

    it('start after destroy restarts cleanly', () => {
      const ctrl = createController()
      ctrl.start()
      clock._fireTicks(10)
      ctrl.destroy()
      helpSentPayload = null

      // Restart
      ctrl.start()
      assert.equal(ctrl.getState(), AssistState.COUNTDOWN)
      assert.equal(ctrl.getRemaining(), 30)
      clock._fireTicks(30)
      assert.equal(ctrl.getState(), AssistState.HELP_SENT)
      assert.ok(helpSentPayload !== null)
    })
  })
})
