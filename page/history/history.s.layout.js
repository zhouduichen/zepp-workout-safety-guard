import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from "@zos/ui";

setStatusBarVisible(false);

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

export const COUNT_STYLE = {
  x: px(266),
  y: px(24),
  w: px(88),
  h: px(22),
  color: COLORS.MUTED,
  text_size: px(13),
  align_h: align.RIGHT_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const SUMMARY_X = [px(30), px(146), px(262)];
export function SUMMARY_CARD_STYLE(index) {
  return {
    x: SUMMARY_X[index],
    y: px(68),
    w: px(98),
    h: px(56),
    radius: px(16),
  };
}

export function SUMMARY_VALUE_STYLE(index) {
  return {
    x: SUMMARY_X[index] + px(12),
    y: px(75),
    w: px(74),
    h: px(24),
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
    y: px(102),
    w: px(74),
    h: px(15),
    color: COLORS.MUTED,
    text_size: px(11),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

const FIRST_EVENT = px(138);
export const FIRST_EVENT_Y = FIRST_EVENT;
export const MAX_VISIBLE_EVENTS = 3;

export function EVENT_ROW_BG(i) {
  return {
    x: px(30),
    y: px(138 + i * 58),
    w: px(330),
    h: px(48),
    radius: px(16),
  };
}

export function EVENT_TRIGGER_STYLE(i) {
  return {
    x: px(44),
    y: px(143 + i * 58),
    w: px(190),
    h: px(20),
    text_size: px(16),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_STATUS_STYLE(i) {
  return {
    x: px(44),
    y: px(164 + i * 58),
    w: px(190),
    h: px(16),
    text_size: px(12),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TIME_STYLE(i) {
  return {
    x: px(244),
    y: px(146 + i * 58),
    w: px(90),
    h: px(18),
    text_size: px(13),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TAG_STYLE(i) {
  return {
    x: px(240),
    y: px(166 + i * 58),
    w: px(94),
    h: px(14),
    text_size: px(10),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const MARK_SAFE_BTN_STYLE = {
  x: px(30),
  y: px(328),
  w: px(330),
  h: px(40),
  radius: px(20),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(17),
  text: "Mark Safe",
};

export const CLEAR_BTN_STYLE = {
  x: px(30),
  y: px(382),
  w: px(150),
  h: px(28),
  radius: px(14),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(13),
  text: "Clear",
};

export const BACK_BTN_STYLE = {
  x: px(210),
  y: px(382),
  w: px(150),
  h: px(28),
  radius: px(14),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(13),
  text: "Back",
};

export const EMPTY_CARD_STYLE = {
  x: px(30),
  y: px(138),
  w: px(330),
  h: px(110),
  radius: px(22),
};

export const EMPTY_STYLE = {
  x: px(0),
  y: px(162),
  w: px(390),
  h: px(28),
  color: COLORS.TEXT,
  text_size: px(20),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const EMPTY_SUB_STYLE = {
  x: px(46),
  y: px(196),
  w: px(298),
  h: px(32),
  color: COLORS.MUTED,
  text_size: px(14),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};
