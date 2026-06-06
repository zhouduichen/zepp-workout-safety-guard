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
  DIM: 0x5f6670,
  GREEN: 0x32d74b,
  ORANGE: 0xff9f0a,
  RED: 0xff453a,
  BLUE: 0x0a84ff,
  PINK: 0xff2d92,
};

export const TITLE_STYLE = {
  x: px(30),
  y: px(22),
  w: px(226),
  h: px(32),
  color: COLORS.TEXT,
  text_size: px(25),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_PILL_BG_STYLE = {
  x: px(272),
  y: px(25),
  w: px(86),
  h: px(28),
  radius: px(14),
};

export const STATUS_PILL_TEXT_STYLE = {
  x: px(272),
  y: px(27),
  w: px(86),
  h: px(24),
  color: COLORS.GREEN,
  text_size: px(13),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const RING_TRACK_STYLE = {
  x: px(121),
  y: px(62),
  w: px(148),
  h: px(148),
  radius: px(74),
  start_angle: -90,
  end_angle: 270,
  color: COLORS.STROKE,
  line_width: px(11),
};

export const RING_PROGRESS_STYLE = {
  ...RING_TRACK_STYLE,
  color: COLORS.GREEN,
};

export const SCORE_STYLE = {
  x: px(0),
  y: px(104),
  w: px(390),
  h: px(50),
  color: COLORS.TEXT,
  text_size: px(46),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const SCORE_LABEL_STYLE = {
  x: px(0),
  y: px(154),
  w: px(390),
  h: px(24),
  color: COLORS.MUTED,
  text_size: px(16),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const STAT_W = px(156);
const STAT_H = px(48);
const STAT_X = [px(30), px(204)];
const STAT_Y = [px(224), px(280)];

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
    h: px(16),
    color: COLORS.MUTED,
    text_size: px(13),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const TREND_LABEL_STYLE = {
  x: px(30),
  y: px(335),
  w: px(100),
  h: px(20),
  color: COLORS.MUTED,
  text_size: px(13),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export function TREND_BAR_STYLE(index, height, color) {
  return {
    x: px(140 + index * 21),
    y: px(354) - height,
    w: px(12),
    h: height,
    radius: px(6),
    color,
  };
}

export const BTN_UNWELL_STYLE = {
  x: px(30),
  y: px(366),
  w: px(330),
  h: px(44),
  radius: px(22),
  normal_color: COLORS.RED,
  press_color: 0xd9362f,
  text_size: px(19),
  text: "I Feel Unwell",
};

export const BTN_PRACTICE_STYLE = {
  x: px(58),
  y: px(418),
  w: px(122),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(14),
  text: "Practice",
};

export const BTN_HISTORY_STYLE = {
  x: px(210),
  y: px(418),
  w: px(122),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(14),
  text: "History",
};
