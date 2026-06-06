import { px } from "@zos/utils";
import {
  align,
  text_style,
} from "@zos/ui";

export const W = px(480);
export const H = px(480);

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
  x: px(58),
  y: px(28),
  w: px(250),
  h: px(34),
  color: COLORS.TEXT,
  text_size: px(28),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_PILL_BG_STYLE = {
  x: px(316),
  y: px(32),
  w: px(108),
  h: px(30),
  radius: px(15),
};

export const STATUS_PILL_TEXT_STYLE = {
  x: px(316),
  y: px(34),
  w: px(108),
  h: px(26),
  color: COLORS.GREEN,
  text_size: px(15),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const RING_TRACK_STYLE = {
  x: px(142),
  y: px(70),
  w: px(196),
  h: px(196),
  radius: px(98),
  start_angle: -90,
  end_angle: 270,
  color: COLORS.STROKE,
  line_width: px(14),
};

export const RING_PROGRESS_STYLE = {
  ...RING_TRACK_STYLE,
  color: COLORS.GREEN,
};

export const SCORE_STYLE = {
  x: px(0),
  y: px(124),
  w: px(480),
  h: px(58),
  color: COLORS.TEXT,
  text_size: px(54),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const SCORE_LABEL_STYLE = {
  x: px(0),
  y: px(180),
  w: px(480),
  h: px(28),
  color: COLORS.MUTED,
  text_size: px(18),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const STAT_W = px(170);
const STAT_H = px(52);
const STAT_X = [px(58), px(252)];
const STAT_Y = [px(266), px(324)];

export function STAT_CARD_STYLE(index) {
  return {
    x: STAT_X[index % 2],
    y: STAT_Y[Math.floor(index / 2)],
    w: STAT_W,
    h: STAT_H,
    radius: px(18),
  };
}

export function STAT_VALUE_STYLE(index) {
  return {
    x: STAT_X[index % 2] + px(16),
    y: STAT_Y[Math.floor(index / 2)] + px(7),
    w: STAT_W - px(32),
    h: px(24),
    color: COLORS.TEXT,
    text_size: px(22),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function STAT_LABEL_STYLE(index) {
  return {
    x: STAT_X[index % 2] + px(16),
    y: STAT_Y[Math.floor(index / 2)] + px(29),
    w: STAT_W - px(32),
    h: px(18),
    color: COLORS.MUTED,
    text_size: px(14),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const TREND_LABEL_STYLE = {
  x: px(58),
  y: px(384),
  w: px(110),
  h: px(22),
  color: COLORS.MUTED,
  text_size: px(14),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export function TREND_BAR_STYLE(index, height, color) {
  return {
    x: px(172 + index * 24),
    y: px(404) - height,
    w: px(14),
    h: height,
    radius: px(7),
    color,
  };
}

export const BTN_UNWELL_STYLE = {
  x: px(58),
  y: px(406),
  w: px(364),
  h: px(42),
  radius: px(21),
  normal_color: COLORS.RED,
  press_color: 0xd9362f,
  text_size: px(20),
  text: "I Feel Unwell",
};

export const BTN_PRACTICE_STYLE = {
  x: px(92),
  y: px(454),
  w: px(136),
  h: px(28),
  radius: px(14),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(16),
  text: "Practice",
};

export const BTN_HISTORY_STYLE = {
  x: px(252),
  y: px(454),
  w: px(136),
  h: px(28),
  radius: px(14),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(16),
  text: "History",
};
