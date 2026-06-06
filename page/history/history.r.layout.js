import { px } from "@zos/utils";
import { align, text_style } from "@zos/ui";

export const W = px(480);
export const H = px(480);

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
  x: px(48),
  y: px(28),
  w: px(250),
  h: px(34),
  color: COLORS.TEXT,
  text_size: px(28),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNT_STYLE = {
  x: px(312),
  y: px(34),
  w: px(112),
  h: px(26),
  color: COLORS.MUTED,
  text_size: px(15),
  align_h: align.RIGHT_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

const SUMMARY_X = [px(48), px(180), px(312)];
export function SUMMARY_CARD_STYLE(index) {
  return {
    x: SUMMARY_X[index],
    y: px(82),
    w: px(120),
    h: px(66),
    radius: px(20),
  };
}

export function SUMMARY_VALUE_STYLE(index) {
  return {
    x: SUMMARY_X[index] + px(14),
    y: px(92),
    w: px(92),
    h: px(28),
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
    y: px(122),
    w: px(92),
    h: px(18),
    color: COLORS.MUTED,
    text_size: px(13),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const EMPTY_CARD_STYLE = {
  x: px(52),
  y: px(176),
  w: px(376),
  h: px(136),
  radius: px(28),
};

export const EMPTY_STYLE = {
  x: px(78),
  y: px(204),
  w: px(324),
  h: px(34),
  color: COLORS.TEXT,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const EMPTY_SUB_STYLE = {
  x: px(82),
  y: px(246),
  w: px(316),
  h: px(42),
  color: COLORS.MUTED,
  text_size: px(16),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const FIRST_EVENT_Y = px(166);
export const MAX_VISIBLE_EVENTS = 3;

export function EVENT_ROW_BG(i) {
  return {
    x: px(48),
    y: px(166 + i * 62),
    w: px(384),
    h: px(54),
    radius: px(18),
  };
}

export function EVENT_STRIP_STYLE(i) {
  return {
    x: px(48),
    y: px(166 + i * 62),
    w: px(6),
    h: px(54),
    radius: px(3),
  };
}

export function EVENT_TRIGGER_STYLE(i) {
  return {
    x: px(68),
    y: px(172 + i * 62),
    w: px(184),
    h: px(24),
    text_size: px(18),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_STATUS_STYLE(i) {
  return {
    x: px(68),
    y: px(196 + i * 62),
    w: px(190),
    h: px(18),
    text_size: px(14),
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TIME_STYLE(i) {
  return {
    x: px(292),
    y: px(174 + i * 62),
    w: px(112),
    h: px(22),
    text_size: px(15),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TAG_STYLE(i) {
  return {
    x: px(300),
    y: px(198 + i * 62),
    w: px(104),
    h: px(16),
    text_size: px(12),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const MARK_SAFE_BTN_STYLE = {
  x: px(58),
  y: px(368),
  w: px(364),
  h: px(44),
  radius: px(22),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(18),
  text: "Mark Safe",
};

export const CLEAR_BTN_STYLE = {
  x: px(58),
  y: px(424),
  w: px(168),
  h: px(34),
  radius: px(17),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(15),
  text: "Clear",
};

export const BACK_BTN_STYLE = {
  x: px(254),
  y: px(424),
  w: px(168),
  h: px(34),
  radius: px(17),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(15),
  text: "Back",
};
