/**
 * secondary-widget/index.js — Secondary Widget for Workout Safety Guard
 *
 * Displays guard status and a quick "I feel unwell" entry point on the
 * negative-one-screen. Routes to page/assist/assist on tap.
 *
 * Restrictions:
 * - Must NOT perform GPS, BLE dispatch, or risk evaluation itself.
 * - UI-only: reads state from storage, navigates to assist page.
 *
 * Reference: @zeppos/device-types SecondaryWidget({...})
 */

import { createWidget, widget, text_style, align } from '@zos/ui'
import { push } from '@zos/router'
import { px } from '@zos/utils'
import { loadGuardState } from '../src/device/storage.js'

const STATE_UNKNOWN = 'STATE_UNKNOWN'

SecondaryWidget({
  state: {
    guardEnabled: false,
    phoneOnline: false,
    _guardState: STATE_UNKNOWN,
  },

  onInit() {
    // Restore persisted state
    const saved = loadGuardState()
    if (saved) {
      this.state._guardState = saved.status || STATE_UNKNOWN
      this.state.guardEnabled = saved.guardEnabled !== false
      this.state.phoneOnline = saved.phoneOnline === true
    }
  },

  build() {
    // --- Product name ---
    createWidget(widget.TEXT, {
      x: px(0),
      y: px(10),
      w: px(200),
      h: px(30),
      color: 0xffffff,
      text_size: px(18),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: '运动异常守护',
    })

    // --- Guard status ---
    const guardText = this.state.guardEnabled ? '守护: 已开启' : '守护: 已关闭'
    createWidget(widget.TEXT, {
      x: px(0),
      y: px(48),
      w: px(200),
      h: px(24),
      color: this.state.guardEnabled ? 0x4caf50 : 0xaaaaaa,
      text_size: px(14),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: guardText,
    })

    // --- Phone connection status ---
    const connText = this.state.phoneOnline ? '手机: 在线' : '手机: 离线'
    createWidget(widget.TEXT, {
      x: px(0),
      y: px(76),
      w: px(200),
      h: px(24),
      color: this.state.phoneOnline ? 0x4caf50 : 0xff9800,
      text_size: px(14),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: connText,
    })

    // --- "I feel unwell" button (large, prominent) ---
    const unwellBtn = createWidget(widget.TEXT, {
      x: px(20),
      y: px(120),
      w: px(160),
      h: px(48),
      color: 0xff1744,
      text_size: px(20),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: '我感觉不适',
    })
    unwellBtn.setEnable(false)
  },

  onResume() {
    // Refresh state when widget gains focus
    const saved = loadGuardState()
    if (saved) {
      this.state._guardState = saved.status || STATE_UNKNOWN
      this.state.guardEnabled = saved.guardEnabled !== false
      this.state.phoneOnline = saved.phoneOnline === true
    }
  },

  onPause() {
    // No-op
  },

  onDestroy() {
    // Cleanup if needed
  },
})
