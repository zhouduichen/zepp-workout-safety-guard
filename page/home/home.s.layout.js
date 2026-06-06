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
  DIM: 0x636366,
  GREEN: 0x30d158,
  ORANGE: 0xff9f0a,
  RED: 0xff453a,
  BLUE: 0x0a84ff,
  PINK: 0xff375f,
};

export const TITLE_STYLE = {
  x: px(30),
  y: px(20),
  w: px(220),
  h: px(28),
  color: COLORS.TEXT,
  text_size: px(23),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_PILL_BG_STYLE = {
  x: px(270),
  y: px(23),
  w: px(86),
  h: px(24),
  radius: px(12),
};

export const STATUS_PILL_TEXT_STYLE = {
  x: px(270),
  y: px(24),
  w: px(86),
  h: px(22),
  color: COLORS.GREEN,
  text_size: px(12),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const RING_TRACK_STYLE = {
  x: px(120),
  y: px(56),
  w: px(150),
  h: px(150),
  radius: px(75),
  start_angle: -90,
  end_angle: 270,
  color: COLORS.STROKE,
  line_width: px(12),
};

export const RING_PROGRESS_STYLE = {
  ...RING_TRACK_STYLE,
  color: COLORS.GREEN,
};

export const SCORE_STYLE = {
  x: px(0),
  y: px(99),
  w: px(390),
  h: px(46),
  color: COLORS.TEXT,
  text_size: px(44),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const SCORE_LABEL_STYLE = {
  x: px(0),
  y: px(148),
  w: px(390),
  h: px(22),
  color: COLORS.MUTED,
  text_size: px(14),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const STAT_W = px(156);
const STAT_H = px(46);
const STAT_X = [px(30), px(204)];
const STAT_Y = [px(220), px(276)];

export function STAT_CARD_STYLE(index) {
  return {
    x: STAT_X[index % 2],
    y: STAT_Y[Math.floor(index / 2)],
    w: STAT_W,
    h: STAT_H,
    radius: px(16),
  };
}

export function STAT_VALUE_STYLE(index) {
  return {
    x: STAT_X[index % 2] + px(14),
    y: STAT_Y[Math.floor(index / 2)] + px(6),
    w: STAT_W - px(28),
    h: px(22),
    color: COLORS.TEXT,
    text_size: px(20),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function STAT_LABEL_STYLE(index) {
  return {
    x: STAT_X[index % 2] + px(14),
    y: STAT_Y[Math.floor(index / 2)] + px(27),
    w: STAT_W - px(28),
    h: px(15),
    color: COLORS.MUTED,
    text_size: px(12),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const TREND_LABEL_STYLE = {
  x: px(30),
  y: px(332),
  w: px(100),
  h: px(18),
  color: COLORS.MUTED,
  text_size: px(12),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export function TREND_BAR_STYLE(index, height, color) {
  return {
    x: px(140 + index * 21),
    y: px(349) - height,
    w: px(12),
    h: height,
    radius: px(6),
    color,
  };
}

export const BTN_UNWELL_STYLE = {
  x: px(30),
  y: px(354),
  w: px(330),
  h: px(44),
  radius: px(22),
  normal_color: COLORS.RED,
  press_color: 0xd1302b,
  text_size: px(18),
  text: "I Feel Unwell",
};

export const BTN_PRACTICE_STYLE = {
  x: px(50),
  y: px(406),
  w: px(132),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(14),
  text: "Practice",
};

export const BTN_HISTORY_STYLE = {
  x: px(208),
  y: px(406),
  w: px(132),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(14),
  text: "History",
};
