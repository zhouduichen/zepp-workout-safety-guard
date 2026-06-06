import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from '@zos/ui'

setStatusBarVisible(false)

export const W = px(390);
export const H = px(450);

export const COLORS = {
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
  PINK: 0xff375f,
};

export const PAGE_INDICATOR_STYLE = {
  x: px(0),
  y: px(24),
  w: px(390),
  h: px(20),
  color: COLORS.MUTED,
  text_size: px(14),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export function PROGRESS_DOT_STYLE(index, active) {
  return {
    x: px(104 + index * 24),
    y: px(52),
    w: active ? px(18) : px(8),
    h: px(8),
    radius: px(4),
    color: active ? COLORS.GREEN : COLORS.STROKE,
  };
}

export const CARD_STYLE = {
  x: px(30),
  y: px(80),
  w: px(330),
  h: px(222),
  radius: px(26),
};

export const TITLE_STYLE = {
  x: px(54),
  y: px(106),
  w: px(282),
  h: px(36),
  color: COLORS.TEXT,
  text_size: px(23),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const BODY_STYLE = {
  x: px(54),
  y: px(154),
  w: px(282),
  h: px(128),
  color: COLORS.MUTED,
  text_size: px(16),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const COUNTDOWN_TRACK_STYLE = {
  x: px(104),
  y: px(96),
  w: px(182),
  h: px(182),
  radius: px(91),
  start_angle: -90,
  end_angle: 270,
  color: COLORS.STROKE,
  line_width: px(13),
};

export const COUNTDOWN_RING_STYLE = {
  ...COUNTDOWN_TRACK_STYLE,
  color: COLORS.ORANGE,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(144),
  w: px(390),
  h: px(64),
  color: COLORS.TEXT,
  text_size: px(62),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_LABEL_STYLE = {
  x: px(0),
  y: px(210),
  w: px(390),
  h: px(24),
  color: COLORS.MUTED,
  text_size: px(16),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_PRIMARY_STYLE = {
  x: px(30),
  y: px(354),
  w: px(330),
  h: px(46),
  radius: px(23),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(19),
  text: "Next",
};

export const BTN_CANCEL_STYLE = {
  x: px(70),
  y: px(408),
  w: px(250),
  h: px(32),
  radius: px(16),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(14),
  text: "Cancel",
};
