/**
 * Zepp OS Alarm adapter.
 * Uses @zos/alarm for second-level delayed wakeups.
 * Alarm set/cancel with episodeId tracking.
 */
let _alarm = null
let _app = null

try {
  _alarm = require('@zos/alarm')
  _app = require('@zos/app')
} catch {}

export function createAlarmAdapter() {
  const alarmIds = new Map() // episodeId → alarmId

  /**
   * Schedule an escalation alarm.
   * @param {string} opts.episodeId
   * @param {number} opts.delaySec
   */
  function schedule({ episodeId, delaySec }) {
    if (!_alarm) return null
    try {
      const id = _alarm.set({
        url: 'app-service/guard-service',
        delay: delaySec,
        param: JSON.stringify({ episodeId, type: 'ESCALATION_ALARM_FIRED' }),
        store: true,
      })
      if (id != null) alarmIds.set(episodeId, id)
      return id
    } catch {
      return null
    }
  }

  /** Cancel all tracked escalation alarms. */
  function cancel() {
    if (!_alarm) return
    for (const [episodeId, alarmId] of alarmIds) {
      try {
        _alarm.cancel(alarmId)
      } catch {}
      alarmIds.delete(episodeId)
    }
  }

  return { schedule, cancel }
}
