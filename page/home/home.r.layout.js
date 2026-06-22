import { px } from "@zos/utils";
import {
  align,
  text_style,
} from "@zos/ui";

export const W = px(480);
export const H = px(480);

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
  x: px(58),
  y: px(26),
  w: px(250),
  h: px(30),
  color: COLORS.TEXT,
  text_size: px(26),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_PILL_BG_STYLE = {
  x: px(316),
  y: px(30),
  w: px(100),
  h: px(26),
  radius: px(13),
};

export const STATUS_PILL_TEXT_STYLE = {
  x: px(316),
  y: px(31),
  w: px(100),
  h: px(24),
  color: COLORS.GREEN,
  text_size: px(13),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const RING_TRACK_STYLE = {
  x: px(142),
  y: px(66),
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
  y: px(119),
  w: px(480),
  h: px(54),
  color: COLORS.TEXT,
  text_size: px(52),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const SCORE_LABEL_STYLE = {
  x: px(0),
  y: px(177),
  w: px(480),
  h: px(24),
  color: COLORS.MUTED,
  text_size: px(16),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const STAT_W = px(154);
const STAT_H = px(42);
const STAT_X = [px(78), px(248)];
const STAT_Y = [px(282), px(328)];

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
    y: STAT_Y[Math.floor(index / 2)] + px(5),
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
    y: STAT_Y[Math.floor(index / 2)] + px(25),
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
  x: px(58),
  y: px(264),
  w: px(110),
  h: px(20),
  color: COLORS.MUTED,
  text_size: px(13),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export function TREND_BAR_STYLE(index, height, color) {
  const barHeight = Math.min(height, px(18));
  return {
    x: px(172 + index * 24),
    y: px(282) - barHeight,
    w: px(14),
    h: barHeight,
    radius: px(7),
    color,
  };
}

export const BTN_UNWELL_STYLE = {
  x: px(88),
  y: px(366),
  w: px(304),
  h: px(44),
  radius: px(22),
  normal_color: COLORS.RED,
  press_color: 0xd9362f,
  text_size: px(18),
  text: "I Feel Unwell",
};

export const BTN_PRACTICE_STYLE = {
  x: px(130),
  y: px(418),
  w: px(100),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(14),
  text: "Practice",
};

export const BTN_HISTORY_STYLE = {
  x: px(250),
  y: px(418),
  w: px(100),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(14),
  text: "History",
};
