/**
 * Zepp OS sensor adapter.
 * Subscribes to HeartRate, Step, Distance, Wear, and Time sensors.
 * Translates sensor callbacks into domain input events.
 */
let HeartRate = null
let Step = null
let Distance = null
let Wear = null
let Time = null
let logger = null

try {
  const sensor = require('@zos/sensor')
  HeartRate = sensor.HeartRate
  Step = sensor.Step
  Distance = sensor.Distance
  Wear = sensor.Wear
  Time = sensor.Time
  logger = require('@zos/utils').log
} catch {}

export function createSensorSubscriber(onInput) {
  let hr = null
  let step = null
  let distance = null
  let wear = null
  let time = null

  function start() {
    if (!HeartRate || !Step || !Distance || !Wear || !Time) {
      if (logger) logger.log('sensors unavailable (non-Zepp environment)')
      return
    }

    hr = new HeartRate()
    step = new Step()
    distance = new Distance()
    wear = new Wear()
    time = new Time()

    // Per-minute tick for low-frequency evaluation
    time.onPerMinute(() => {
      const atMs = time.getTime()
      onInput({ type: 'TICK', atMs, payload: {} })
    })

    // Step change — activity evidence
    step.onChange(() => {
      const atMs = time.getTime()
      onInput({ type: 'STEP_CHANGED', atMs, payload: {} })
    })

    // Distance change — activity evidence
    distance.onChange(() => {
      const atMs = time.getTime()
      onInput({ type: 'DISTANCE_CHANGED', atMs, payload: {} })
    })

    // Heart rate sample
    hr.onCurrentChange(() => {
      const bpm = hr.getCurrent()
      const atMs = time.getTime()
      onInput({ type: 'HEART_RATE_SAMPLE', atMs, payload: { bpm } })
    })

    // Wear status: 0=not_wearing, 1=wearing, 2=in_motion, 3=not_sure
    wear.onChange(() => {
      const wearStatus = wear.getStatus()
      const atMs = time.getTime()
      onInput({ type: 'WEAR_CHANGED', atMs, payload: { wearStatus } })
    })
  }

  function stop() {
    if (hr) {
      try { hr.offCurrentChange() } catch {}
    }
    if (step) {
      try { step.offChange() } catch {}
    }
    if (distance) {
      try { distance.offChange() } catch {}
    }
    if (wear) {
      try { wear.offChange() } catch {}
    }
    // Time.onPerMinute has no off — cannot unsubscribe
    hr = null; step = null; distance = null; wear = null; time = null
  }

  return { start, stop }
}
