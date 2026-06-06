import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from '@zos/ui'

setStatusBarVisible(false)

export const W = px(390);
export const H = px(450);

export const COLORS = {
  BACKGROUND: 0x050607,
  SURFACE: 0x15171a,
  SURFACE_2: 0x202328,
  STROKE: 0x2c3036,
  TEXT: 0xf5f7fa,
  MUTED: 0x8b929c,
  GREEN: 0x32d74b,
  ORANGE: 0xff9f0a,
  RED: 0xff453a,
  BLUE: 0x0a84ff,
  PINK: 0xff2d92,
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
  y: px(84),
  w: px(330),
  h: px(218),
  radius: px(26),
};

export const TITLE_STYLE = {
  x: px(54),
  y: px(112),
  w: px(282),
  h: px(38),
  color: COLORS.TEXT,
  text_size: px(25),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const BODY_STYLE = {
  x: px(54),
  y: px(162),
  w: px(282),
  h: px(118),
  color: COLORS.MUTED,
  text_size: px(17),
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
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(15),
  text: "Cancel",
};
