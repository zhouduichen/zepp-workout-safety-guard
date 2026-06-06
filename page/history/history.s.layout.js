import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from "@zos/ui";

setStatusBarVisible(false);

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
};

export const TITLE_STYLE = {
  x: px(30),
  y: px(24),
  w: px(220),
  h: px(32),
  color: COLORS.TEXT,
  text_size: px(25),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNT_STYLE = {
  x: px(270),
  y: px(30),
  w: px(88),
  h: px(24),
  color: COLORS.MUTED,
  text_size: px(14),
  align_h: align.RIGHT_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const SUMMARY_X = [px(30), px(146), px(262)];
export function SUMMARY_CARD_STYLE(index) {
  return {
    x: SUMMARY_X[index],
    y: px(76),
    w: px(98),
    h: px(62),
    radius: px(18),
  };
}

export function SUMMARY_VALUE_STYLE(index) {
  return {
    x: SUMMARY_X[index] + px(12),
    y: px(85),
    w: px(74),
    h: px(26),
    color: COLORS.TEXT,
    text_size: px(22),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function SUMMARY_LABEL_STYLE(index) {
  return {
    x: SUMMARY_X[index] + px(12),
    y: px(114),
    w: px(74),
    h: px(17),
    color: COLORS.MUTED,
    text_size: px(12),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const EMPTY_CARD_STYLE = {
  x: px(30),
  y: px(164),
  w: px(330),
  h: px(128),
  radius: px(26),
};

export const EMPTY_STYLE = {
  x: px(54),
  y: px(190),
  w: px(282),
  h: px(32),
  color: COLORS.TEXT,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const EMPTY_SUB_STYLE = {
  x: px(58),
  y: px(230),
  w: px(274),
  h: px(38),
  color: COLORS.MUTED,
  text_size: px(15),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const FIRST_EVENT_Y = px(154);
export const MAX_VISIBLE_EVENTS = 3;

export function EVENT_ROW_BG(i) {
  return {
    x: px(30),
    y: px(154 + i * 58),
    w: px(330),
    h: px(50),
    radius: px(17),
  };
}

export function EVENT_STRIP_STYLE(i) {
  return {
    x: px(30),
    y: px(154 + i * 58),
    w: px(6),
    h: px(50),
    radius: px(3),
  };
}

export function EVENT_TRIGGER_STYLE(i) {
  return {
    x: px(48),
    y: px(160 + i * 58),
    w: px(160),
    h: px(22),
    text_size: px(16),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_STATUS_STYLE(i) {
  return {
    x: px(48),
    y: px(182 + i * 58),
    w: px(170),
    h: px(17),
    text_size: px(13),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TIME_STYLE(i) {
  return {
    x: px(246),
    y: px(162 + i * 58),
    w: px(90),
    h: px(20),
    text_size: px(14),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TAG_STYLE(i) {
  return {
    x: px(240),
    y: px(184 + i * 58),
    w: px(96),
    h: px(15),
    text_size: px(11),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const MARK_SAFE_BTN_STYLE = {
  x: px(30),
  y: px(342),
  w: px(330),
  h: px(42),
  radius: px(21),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(17),
  text: "Mark Safe",
};

export const CLEAR_BTN_STYLE = {
  x: px(30),
  y: px(396),
  w: px(150),
  h: px(32),
  radius: px(16),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(14),
  text: "Clear",
};

export const BACK_BTN_STYLE = {
  x: px(210),
  y: px(396),
  w: px(150),
  h: px(32),
  radius: px(16),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(14),
  text: "Back",
};
