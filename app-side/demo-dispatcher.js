/**
 * app-side/demo-dispatcher.js — Demo dispatcher for Side Service.
 *
 * !!! SAFETY: This is a DEMO-ONLY dispatcher.
 *
 * It MUST never:
 *   - call fetch/HTTP
 *   - send SMS messages
 *   - place voice calls
 *   - connect to any production backend
 *
 * PRODUCTION GATE REQUIREMENTS (must all pass before replacing this module):
 *   1. True-device calibration with real workout samples
 *   2. Sports-medicine review of high-risk combinations
 *   3. Legal review for each target market
 *   4. Production backend with auth, rate limits, audit, and abuse controls
 *   5. SMS and voice supplier integration review
 *   6. Emergency-contact consent wording review
 *   7. Separate sensitive-data consent flow
 *   8. Rollout plan with feature flag, monitoring, and rollback
 *
 * Until all gates pass, this module is the ONLY allowed dispatcher.
 */

/**
 * Dispatch an assistance request.
 *
 * @param {object} envelope - validated assistance envelope
 * @returns {{ sms_status: string, voice_status: string }}
 */
export function demoDispatch(envelope) {
  // Deterministic simulated result — never reaches a real contact
  return {
    sms_status: 'simulated',
    voice_status: 'simulated',
  }
}
