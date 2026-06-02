/**
 * demo-service.js — Platform spike: App Service skeleton
 *
 * Verifies: AppService constructor signature, onInit/onRun/onDestroy lifecycle,
 * sensor subscription patten inside App Service.
 *
 * Reference: https://docs.zepp.com/docs/guides/framework/device/app-service/
 *
 * Status: DOCUMENTED — cannot run in Node.js, requires Zeus simulator or device.
 */

// In a real App Service file, this would be:
// import { AppService } from '@zeppos/zml/app-service'
// import { HeartRate, Step, Distance, Wear, Time } from '@zos/sensor'
// import { log as logger } from '@zos/utils'

/*
AppService({
  onInit(params) {
    logger.log('guard-service onInit', params)
  },

  onRun(params) {
    logger.log('guard-service onRun', params)
  },

  onDestroy() {
    logger.log('guard-service onDestroy')
  },
})
*/

// Sensor subscription pattern (used inside AppService onInit):
//
// const heartRate = new HeartRate()
// const step = new Step()
// const distance = new Distance()
// const wear = new Wear()
// const time = new Time()
//
// // HeartRate callback with bpm value
// heartRate.onCurrentChange(() => {
//   const bpm = heartRate.getCurrent()
//   // Valid if Number.isFinite(bpm) && bpm > 0
// })
//
// // Step change callback (activity evidence)
// step.onChange(() => {
//   const current = step.getCurrent()
// })
//
// // Distance change callback
// distance.onChange(() => {
//   const current = distance.getCurrent()
// })
//
// // Wear status: 0=not_wearing, 1=wearing, 2=in_motion, 3=not_sure
// wear.onChange(() => {
//   const status = wear.getStatus()
// })
//
// // Per-minute tick for low-frequency checks
// time.onPerMinute(() => {
//   const now = time.getTime() // UTC ms
// })
