/**
 * @file Pure assist controller for the foreground assistance page.
 *
 * Manages a 30-second countdown, help-send lifecycle, two-step cancellation,
 * and GPS update delivery. All time operations use injected clock callbacks
 * (setTimeout, clearTimeout, Date.now) for testability.
 *
 * States:
 *   COUNTDOWN  — initial 30-second countdown running
 *   HELP_SENT  — help has been sent; GPS updates may still arrive
 *   CANCELLING — first cancel tap received; waiting for confirmation
 *   CANCELLED  — terminal; cancellation confirmed
 */

export const AssistState = Object.freeze({
  COUNTDOWN: 'COUNTDOWN',
  HELP_SENT: 'HELP_SENT',
  CANCELLING: 'CANCELLING',
  CANCELLED: 'CANCELLED',
})

/**
 * Create a pure assist controller with injected clock callbacks.
 *
 * @param {object} deps
 * @param {() => number} deps.now                  — returns epoch ms
 * @param {(fn: Function, ms: number) => any} deps.setTimeout
 * @param {(id: any) => void} deps.clearTimeout
 * @param {(remaining: number) => void} deps.onCountdownChange  — called each second during COUNTDOWN
 * @param {({ hasLocation: boolean }) => void} deps.onHelpSent  — called when help is dispatched
 * @param {(lat: number, lng: number) => void} deps.onLocationAvailable  — called when GPS arrives after help
 * @param {() => void} deps.onCancelled  — called when cancellation completes
 */
export function createAssistController({
  now,
  setTimeout,
  clearTimeout,
  onCountdownChange,
  onHelpSent,
  onLocationAvailable,
  onCancelled,
}) {
  let state = AssistState.COUNTDOWN
  let remaining = 30
  let timerId = null
  let _helpSent = false
  let _hasLocation = false

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  function cancelTimer() {
    if (timerId != null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  function tick() {
    remaining -= 1
    onCountdownChange(remaining)

    if (remaining <= 0) {
      doSendHelp()
    } else {
      timerId = setTimeout(tick, 1000)
    }
  }

  function doSendHelp() {
    if (_helpSent) return
    _helpSent = true
    state = AssistState.HELP_SENT
    cancelTimer()
    onHelpSent({ hasLocation: _hasLocation })
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  function start() {
    cancelTimer()
    state = AssistState.COUNTDOWN
    remaining = 30
    _helpSent = false
    _hasLocation = false
    timerId = setTimeout(tick, 1000)
    onCountdownChange(remaining)
  }

  /** Send help immediately, skipping remaining countdown. */
  function helpNow() {
    if (state === AssistState.CANCELLED) return
    cancelTimer()
    doSendHelp()
  }

  /** First cancel tap — enter CANCELLING state. */
  function cancelRequest() {
    if (state !== AssistState.COUNTDOWN) return
    cancelTimer()
    state = AssistState.CANCELLING
    // Notify with current remaining so UI can show it during confirmation
    onCountdownChange(remaining)
  }

  /** Abort cancellation and return to countdown. */
  function abortCancel() {
    if (state !== AssistState.CANCELLING) return
    state = AssistState.COUNTDOWN
    timerId = setTimeout(tick, 1000)
    onCountdownChange(remaining)
  }

  /** Confirm cancellation — terminal state. */
  function confirmCancel() {
    if (state !== AssistState.CANCELLING) return
    state = AssistState.CANCELLED
    cancelTimer()
    onCancelled()
  }

  /**
   * Report a GPS coordinate.
   *
   * If help was already sent, and we are not cancelled, emit the
   * onLocationAvailable callback immediately so the page can queue a
   * help.location_updated envelope.
   *
   * If help has not been sent yet, only record that a location exists.
   */
  function locationUpdate(lat, lng) {
    _hasLocation = true
    if (state === AssistState.CANCELLED) return
    if (_helpSent) {
      onLocationAvailable(lat, lng)
    }
  }

  /** Clean up timers and reset. Idempotent. */
  function destroy() {
    cancelTimer()
    state = null
  }

  /** @returns {string|null} current state */
  function getState() { return state }

  /** @returns {number} seconds remaining in countdown */
  function getRemaining() { return remaining }

  /** @returns {boolean} whether a GPS fix was acquired at any point */
  function hasLocationBeenAcquired() { return _hasLocation }

  return {
    start,
    helpNow,
    cancelRequest,
    abortCancel,
    confirmCancel,
    locationUpdate,
    destroy,
    getState,
    getRemaining,
    hasLocationBeenAcquired,
  }
}
