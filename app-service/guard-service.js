/**
 * guard-service.js — App Service entry point.
 *
 * This is the background monitoring service for the Workout Safety Guard.
 * It is awakened by:
 * 1. Continuous background mode (after device:os.bg_service permission)
 * 2. Alarm fire (second-level escalation wakeup)
 * 3. Notification action
 *
 * Lifecycle:
 * - onInit: subscribe sensors, initialize controller
 * - onRun: handle alarm or notification wakeup parameters
 * - onDestroy: unsubscribe sensors, clean up BLE
 *
 * Restrictions (App Service):
 * - No setTimeout/setInterval
 * - No high-power sensors (Accelerometer, Gyroscope, GPS)
 * - 600 ms execution limit for single-execution wakeups
 * - No UI APIs (createWidget, etc.)
 */

import { AppService } from '@zeppos/zml/app-service'
import { log as logger } from '@zos/utils'

import { developmentConfig } from '../src/domain/default-config.js'
import { createServiceController } from '../src/device/service-controller.js'
import { saveGuardState, loadGuardState, saveOutbox, loadOutbox } from '../src/device/storage.js'
import { createSensorSubscriber } from '../src/device/zepp-sensors.js'
import { createAlarmAdapter } from '../src/device/zepp-alarm.js'
import { createAlertsAdapter } from '../src/device/zepp-alerts.js'
import { createBleAdapter } from '../src/device/zepp-ble.js'

AppService({
  onInit(params) {
    logger.log('guard-service onInit')

    // Parse wakeup parameters from alarm/notification
    let wakeupData = null
    if (params) {
      try { wakeupData = JSON.parse(params) } catch {}
    }

    // Create adapters
    const storage = { saveGuardState, loadGuardState, saveOutbox, loadOutbox }
    const alerts = createAlertsAdapter()
    const alarm = createAlarmAdapter()
    const bridge = createBleAdapter()
    const now = () => Date.now()

    // Create controller
    this._ctrl = createServiceController({ config: developmentConfig, storage, alerts, alarm, bridge, now })
    this._ctrl.start()

    // Subscribe sensors for continuous monitoring
    this._sensors = createSensorSubscriber((input) => {
      if (this._ctrl) {
        this._ctrl.handleInput(input)
      }
    })
    this._sensors.start()

    // Handle alarm-triggered wakeup
    if (wakeupData && wakeupData.type === 'ESCALATION_ALARM_FIRED') {
      logger.log('guard-service alarm wakeup:', wakeupData.episodeId)
      this._ctrl.handleEscalationAlarm({
        episodeId: wakeupData.episodeId,
        atMs: now(),
      })
    }

    // Handle notification action wakeup
    if (wakeupData && wakeupData.type) {
      const typeMap = {
        'USER_SAFE_CONFIRMED': 'USER_SAFE_CONFIRMED',
        'USER_HELP_NOW': 'USER_HELP_NOW',
        'USER_REST_REQUESTED': 'USER_REST_REQUESTED',
        'USER_SAFE_REQUESTED': 'USER_SAFE_REQUESTED',
      }
      const inputType = typeMap[wakeupData.type]
      if (inputType) {
        this._ctrl.handleInput({ type: inputType, atMs: now(), payload: {} })
      }
    }

    logger.log('guard-service started')
  },

  onRun(params) {
    logger.log('guard-service onRun')
    // Re-initialize on run (single-execution wakeup or service restart)
    this.onInit(params)
  },

  onDestroy() {
    logger.log('guard-service onDestroy')

    if (this._sensors) {
      this._sensors.stop()
      this._sensors = null
    }

    if (this._ctrl) {
      this._ctrl.stop()
      this._ctrl = null
    }

    logger.log('guard-service destroyed')
  },
})
