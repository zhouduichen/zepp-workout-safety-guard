import { px } from "@zos/utils";
import { align, text_style } from "@zos/ui";

export const W = px(480);
export const H = px(480);

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
  x: px(48),
  y: px(26),
  w: px(250),
  h: px(30),
  color: COLORS.TEXT,
  text_size: px(26),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNT_STYLE = {
  x: px(310),
  y: px(32),
  w: px(114),
  h: px(22),
  color: COLORS.MUTED,
  text_size: px(14),
  align_h: align.RIGHT_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const SUMMARY_X = [px(48), px(180), px(312)];
export function SUMMARY_CARD_STYLE(index) {
  return {
    x: SUMMARY_X[index],
    y: px(78),
    w: px(120),
    h: px(62),
    radius: px(18),
  };
}

export function SUMMARY_VALUE_STYLE(index) {
  return {
    x: SUMMARY_X[index] + px(14),
    y: px(87),
    w: px(92),
    h: px(26),
    color: COLORS.TEXT,
    text_size: px(24),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function SUMMARY_LABEL_STYLE(index) {
  return {
    x: SUMMARY_X[index] + px(14),
    y: px(116),
    w: px(92),
    h: px(16),
    color: COLORS.MUTED,
    text_size: px(12),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

const FIRST_EVENT = px(160);
export const FIRST_EVENT_Y = FIRST_EVENT;
export const MAX_VISIBLE_EVENTS = 3;

export function EVENT_ROW_BG(i) {
  return {
    x: px(48),
    y: px(160 + i * 60),
    w: px(384),
    h: px(50),
    radius: px(16),
  };
}

const EVENT_DOT_Y = px(178);

export function EVENT_TRIGGER_STYLE(i) {
  return {
    x: px(64),
    y: px(165 + i * 60),
    w: px(220),
    h: px(22),
    text_size: px(17),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_STATUS_STYLE(i) {
  return {
    x: px(64),
    y: px(187 + i * 60),
    w: px(220),
    h: px(16),
    text_size: px(13),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TIME_STYLE(i) {
  return {
    x: px(292),
    y: px(167 + i * 60),
    w: px(112),
    h: px(20),
    text_size: px(14),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TAG_STYLE(i) {
  return {
    x: px(300),
    y: px(189 + i * 60),
    w: px(104),
    h: px(14),
    text_size: px(11),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const MARK_SAFE_BTN_STYLE = {
  x: px(58),
  y: px(362),
  w: px(364),
  h: px(42),
  radius: px(21),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(18),
  text: "Mark Safe",
};

export const CLEAR_BTN_STYLE = {
  x: px(58),
  y: px(418),
  w: px(168),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(14),
  text: "Clear",
};

export const BACK_BTN_STYLE = {
  x: px(254),
  y: px(418),
  w: px(168),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(14),
  text: "Back",
};

export const EMPTY_CARD_STYLE = {
  x: px(48),
  y: px(160),
  w: px(384),
  h: px(120),
  radius: px(22),
};

export const EMPTY_STYLE = {
  x: px(0),
  y: px(184),
  w: px(480),
  h: px(30),
  color: COLORS.TEXT,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const EMPTY_SUB_STYLE = {
  x: px(68),
  y: px(220),
  w: px(344),
  h: px(36),
  color: COLORS.MUTED,
  text_size: px(15),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};
