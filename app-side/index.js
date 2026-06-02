/**
 * app-side/index.js — Side Service for Workout Safety Guard.
 *
 * Receives binary assistance envelopes from the watch via BLE,
 * validates, deduplicates, dispatches via demoDispatcher, and
 * stores display-safe results.
 *
 * !!! NEVER call fetch/HTTP from this file !!!
 * !!! NEVER send real SMS or place calls !!!
 *
 * Reference:
 *   - AppSideService(BaseSideService({...}))
 *   - Messaging API: onRequest(req, res) with binary payload
 *   - settingsStorage shared with Settings App
 */

import { BaseSideService } from '@zeppos/zml/base-side'
import { settingsLib } from '@zeppos/zml/base-side'

import { decodeAndValidate, createAckEnvelope, createDedupSet, serializeDeliveryResult } from './protocol.js'
import { demoDispatch } from './demo-dispatcher.js'

const logger = Logger.getLogger('workout-safety-guard-side')
const dedup = createDedupSet()

AppSideService(
  BaseSideService({
    onInit() {
      logger.log('side-service onInit')
    },

    onRun() {
      logger.log('side-service onRun')
      // Clear dedup set on service run to avoid stale entries
      dedup.clear()
    },

    onDestroy() {
      logger.log('side-service onDestroy')
      dedup.clear()
    },

    /**
     * Handle incoming binary request from the watch.
     *
     * req.params contains the raw binary (Uint8Array | ArrayBuffer).
     * The envelope is UTF-8 encoded JSON.
     */
    onRequest(req, res) {
      // ---- 1. Decode and validate envelope ----
      const result = decodeAndValidate(req.params)
      if (!result.valid) {
        logger.error('invalid envelope:', result.error)
        res(null, {
          status: 'error',
          error: result.error,
        })
        return
      }

      const envelope = result.envelope

      // ---- 2. Deduplicate by messageId ----
      if (dedup.has(envelope.messageId)) {
        logger.log('duplicate messageId:', envelope.messageId)
        // Still acknowledge so the watch moves on
        const ack = createAckEnvelope(envelope.messageId, envelope.occurredAtMs)
        res(null, { status: 'acknowledged', ack })
        return
      }

      // ---- 3. Record as seen ----
      dedup.add(envelope.messageId)

      // ---- 4. Dispatch via demo dispatcher only ----
      // NEVER replace demoDispatch with a real fetch/SMS/voice module
      // until all production gates (see demo-dispatcher.js) have passed.
      const dispatchResult = demoDispatch(envelope)

      // ---- 5. Store display-safe result ----
      const safePayload = {
        sms_status: dispatchResult.sms_status,
        voice_status: dispatchResult.voice_status,
      }
      const deliveryKey = 'delivery_' + envelope.messageId
      settingsLib.setItem(deliveryKey, serializeDeliveryResult(safePayload, envelope.type, envelope.messageId))

      // ---- 6. Acknowledge ----
      const ack = createAckEnvelope(envelope.messageId, envelope.occurredAtMs)

      res(null, {
        status: 'success',
        dispatch: safePayload,
        ack,
      })
    },

    onSettingsChange({ key, newValue, oldValue }) {
      logger.log('settings change:', key, newValue, oldValue)
      // Forward contact count changes to watch via settingsStorage
      // Contact details themselves stay phone-side; only count crosses BLE.
    },

    /**
     * Handle incoming file from the watch (not used in this release).
     */
    onReceivedFile(file) {
      logger.log('received file (unused):', file.name)
    },
  }),
)
