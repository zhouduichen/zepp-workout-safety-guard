/**
 * Secondary Widget for Workout Safety Guard.
 *
 * UI-only quick entry. It reads persisted guard state and lets the
 * configured widget route open page/assist/assist.
 */

import { createWidget, widget, text_style, align } from '@zos/ui'
import { px } from '@zos/utils'
import { loadGuardState } from '../src/device/storage.js'

const COLORS = {
  BACKGROUND: 0x000000,
  SURFACE: 0x1c1c1e,
  SURFACE_2: 0x2c2c2e,
  STROKE: 0x38383a,
  TEXT: 0xffffff,
  MUTED: 0x8e8e93,
  GREEN: 0x30d158,
  ORANGE: 0xff9f0a,
  RED: 0xff453a,
  BLUE: 0x0a84ff,
}

const STATE_UNKNOWN = 'STATE_UNKNOWN'

SecondaryWidget({
  state: {
    guardEnabled: false,
    phoneOnline: false,
    _guardState: STATE_UNKNOWN,
  },

  onInit() {
    this.refreshState()
  },

  build() {
    const ringColor = this.state.guardEnabled
      ? (this.state.phoneOnline ? COLORS.GREEN : COLORS.ORANGE)
      : COLORS.BLUE

    createWidget(widget.FILL_RECT, {
      x: px(0),
      y: px(0),
      w: px(200),
      h: px(180),
      radius: px(22),
      color: COLORS.BACKGROUND,
    })

    createWidget(widget.FILL_RECT, {
      x: px(8),
      y: px(6),
      w: px(184),
      h: px(168),
      radius: px(24),
      color: COLORS.SURFACE,
    })

    const title = createWidget(widget.TEXT, {
      x: px(22),
      y: px(16),
      w: px(128),
      h: px(24),
      color: COLORS.TEXT,
      text_size: px(16),
      align_h: align.LEFT,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: 'Fitness Guard',
    })
    title.setEnable(false)

    createWidget(widget.FILL_RECT, {
      x: px(164),
      y: px(24),
      w: px(8),
      h: px(8),
      radius: px(4),
      color: ringColor,
    })

    createWidget(widget.ARC, {
      x: px(24),
      y: px(54),
      w: px(58),
      h: px(58),
      radius: px(29),
      start_angle: -90,
      end_angle: 270,
      color: COLORS.STROKE,
      line_width: px(5),
    })

    createWidget(widget.ARC, {
      x: px(24),
      y: px(54),
      w: px(58),
      h: px(58),
      radius: px(29),
      start_angle: -90,
      end_angle: this.state.guardEnabled ? 246 : 90,
      color: ringColor,
      line_width: px(5),
    })

    const ringLabel = createWidget(widget.TEXT, {
      x: px(24),
      y: px(73),
      w: px(58),
      h: px(20),
      color: ringColor,
      text_size: px(13),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: this.state.guardEnabled ? 'ON' : 'SET',
    })
    ringLabel.setEnable(false)

    const stateText = createWidget(widget.TEXT, {
      x: px(96),
      y: px(56),
      w: px(82),
      h: px(24),
      color: ringColor,
      text_size: px(19),
      align_h: align.LEFT,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: this.state.guardEnabled ? 'Ready' : 'Setup',
    })
    stateText.setEnable(false)

    const phoneText = createWidget(widget.TEXT, {
      x: px(96),
      y: px(84),
      w: px(82),
      h: px(20),
      color: COLORS.MUTED,
      text_size: px(13),
      align_h: align.LEFT,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: this.state.phoneOnline ? 'Phone online' : 'Local alert',
    })
    phoneText.setEnable(false)

    createWidget(widget.FILL_RECT, {
      x: px(20),
      y: px(124),
      w: px(160),
      h: px(36),
      radius: px(18),
      color: COLORS.RED,
    })

    const helpText = createWidget(widget.TEXT, {
      x: px(20),
      y: px(128),
      w: px(160),
      h: px(28),
      color: COLORS.TEXT,
      text_size: px(16),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      text: 'I Feel Unwell',
    })
    helpText.setEnable(false)
  },

  refreshState() {
    const saved = loadGuardState()
    if (saved) {
      this.state._guardState = saved.status || STATE_UNKNOWN
      this.state.guardEnabled = saved.guardEnabled !== false
      this.state.phoneOnline = saved.phoneOnline === true
    }
  },

  onResume() {
    this.refreshState()
  },

  onPause() {},

  onDestroy() {},
})
