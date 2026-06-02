/**
 * Zepp OS alerts adapter.
 * Wraps notify, vibrator, and SystemSounds APIs.
 */
let _notify = null
let _vibrator = null
let _SystemSounds = null
let _sensor = null

try {
  _notify = require('@zos/notification')
  _vibrator = require('@zos/vibrator')
  _sensor = require('@zos/sensor')
  _SystemSounds = _sensor.SystemSounds
} catch {}

import { EffectType } from '../domain/constants.js'

export function createAlertsAdapter() {
  let systemSounds = null

  function apply(effect) {
    switch (effect.type) {
      case EffectType.VIBRATE_GENTLE:
        vibrate(100)
        break
      case EffectType.VIBRATE_URGENT:
        vibrate(500)
        break
      case EffectType.NOTIFY_INTENSITY:
        notify(
          '运动异常守护',
          '心率持续偏高，建议降低运动强度',
          [
            { title: '我已休息', param: JSON.stringify({ type: 'USER_REST_REQUESTED' }) },
          ],
        )
        break
      case EffectType.NOTIFY_CONFIRMATION:
        notify(
          '运动异常守护',
          '检测到运动异常，你还好吗？',
          [
            { title: '我没事', param: JSON.stringify({ type: 'USER_SAFE_CONFIRMED' }) },
            { title: '联系家人', param: JSON.stringify({ type: 'USER_HELP_NOW' }) },
          ],
        )
        break
      case EffectType.NOTIFY_GUARD_PAUSED:
        notify(
          '运动异常守护',
          '守护已暂停',
          [],
        )
        break
      case EffectType.START_LOCAL_ALARM:
        vibrate(1000)
        playSOS()
        break
      case EffectType.STOP_LOCAL_ALARM:
        stopVibration()
        stopSOS()
        break
    }
  }

  function vibrate(durationMs) {
    if (!_vibrator) return
    try {
      _vibrator.vibrate({ mode: 'continuous', duration: durationMs })
    } catch {}
  }

  function stopVibration() {
    if (!_vibrator) return
    try { _vibrator.stop() } catch {}
  }

  function notify(title, content, actions) {
    if (!_notify) return
    try {
      _notify.notify({
        title,
        content,
        actions: actions.map(a => ({
          title: a.title,
          url: 'app-service/guard-service',
          param: a.param,
        })),
      })
    } catch {}
  }

  function playSOS() {
    if (!_SystemSounds) return
    try {
      if (!systemSounds) systemSounds = new _SystemSounds()
      if (systemSounds.getEnabled()) {
        const alarmType = systemSounds.getSourceType().ALARM
        systemSounds.start(alarmType, 0)
      }
    } catch {}
  }

  function stopSOS() {
    // SystemSounds has no stop API documented — vibration stop is the fallback
    stopVibration()
  }

  return { apply }
}
