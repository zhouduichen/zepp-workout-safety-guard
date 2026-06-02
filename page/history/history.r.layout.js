import { px } from "@zos/utils";
import { align, text_style } from "@zos/ui";

export const W = px(480);
export const H = px(480);

export const TITLE_STYLE = {
  x: px(0),
  y: px(20),
  w: px(480),
  h: px(50),
  color: 0xffffff,
  text_size: px(28),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const EMPTY_STYLE = {
  x: px(0),
  y: px(200),
  w: px(480),
  h: px(60),
  color: 0x888888,
  text_size: px(26),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const FIRST_EVENT_Y = px(80);

export function EVENT_ROW_H(i) { return px(56) }

export function EVENT_ROW_BG(i) {
  return {
    x: px(10),
    y: px(80 + i * 60),
    w: px(460),
    h: px(52),
  };
}

export function EVENT_TRIGGER_STYLE(i) {
  return {
    x: px(20),
    y: px(80 + i * 60 + 4),
    w: px(180),
    h: px(26),
    text_size: px(18),
    align_h: align.LEFT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_STATUS_STYLE(i) {
  return {
    x: px(210),
    y: px(80 + i * 60 + 4),
    w: px(120),
    h: px(26),
    text_size: px(18),
    align_h: align.LEFT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TIME_STYLE(i) {
  return {
    x: px(330),
    y: px(80 + i * 60 + 4),
    w: px(80),
    h: px(26),
    text_size: px(16),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_LOC_STYLE(i) {
  return {
    x: px(420),
    y: px(80 + i * 60 + 2),
    w: px(30),
    h: px(28),
    text_size: px(18),
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_REPLAY_STYLE(i) {
  return {
    x: px(440),
    y: px(80 + i * 60 + 4),
    w: px(30),
    h: px(24),
    text_size: px(14),
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const MARK_SAFE_BTN_STYLE = {
  x: px(40),
  y: px(360),
  w: px(400),
  h: px(48),
  radius: px(12),
  normal_color: 0x338833,
  press_color: 0x55aa55,
  text_size: px(22),
  text: "标记安全",
};

export const CLEAR_BTN_STYLE = {
  x: px(40),
  y: px(416),
  w: px(180),
  h: px(44),
  radius: px(10),
  normal_color: 0x663333,
  press_color: 0x885555,
  text_size: px(18),
  text: "清除历史",
};

export const BACK_BTN_STYLE = {
  x: px(260),
  y: px(416),
  w: px(180),
  h: px(44),
  radius: px(10),
  normal_color: 0x444444,
  press_color: 0x666666,
  text_size: px(18),
  text: "返回",
};
