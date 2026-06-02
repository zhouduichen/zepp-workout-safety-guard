import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from "@zos/ui";

setStatusBarVisible(false);

export const W = px(390);
export const H = px(450);

export const TITLE_STYLE = {
  x: px(0),
  y: px(10),
  w: px(390),
  h: px(40),
  color: 0xffffff,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const EMPTY_STYLE = {
  x: px(0),
  y: px(180),
  w: px(390),
  h: px(50),
  color: 0x888888,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const FIRST_EVENT_Y = px(60);

export function EVENT_ROW_H(i) { return px(48) }

export function EVENT_ROW_BG(i) {
  return {
    x: px(5),
    y: px(60 + i * 52),
    w: px(380),
    h: px(46),
  };
}

export function EVENT_TRIGGER_STYLE(i) {
  return {
    x: px(15),
    y: px(60 + i * 52 + 2),
    w: px(140),
    h: px(22),
    text_size: px(16),
    align_h: align.LEFT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_STATUS_STYLE(i) {
  return {
    x: px(160),
    y: px(60 + i * 52 + 2),
    w: px(90),
    h: px(22),
    text_size: px(16),
    align_h: align.LEFT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_TIME_STYLE(i) {
  return {
    x: px(260),
    y: px(60 + i * 52 + 2),
    w: px(70),
    h: px(22),
    text_size: px(14),
    align_h: align.RIGHT_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_LOC_STYLE(i) {
  return {
    x: px(340),
    y: px(60 + i * 52),
    w: px(22),
    h: px(22),
    text_size: px(14),
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export function EVENT_REPLAY_STYLE(i) {
  return {
    x: px(360),
    y: px(60 + i * 52 + 2),
    w: px(24),
    h: px(20),
    text_size: px(12),
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  };
}

export const MARK_SAFE_BTN_STYLE = {
  x: px(20),
  y: px(330),
  w: px(350),
  h: px(44),
  radius: px(10),
  normal_color: 0x338833,
  press_color: 0x55aa55,
  text_size: px(20),
  text: "标记安全",
};

export const CLEAR_BTN_STYLE = {
  x: px(20),
  y: px(382),
  w: px(160),
  h: px(40),
  radius: px(10),
  normal_color: 0x663333,
  press_color: 0x885555,
  text_size: px(16),
  text: "清除历史",
};

export const BACK_BTN_STYLE = {
  x: px(210),
  y: px(382),
  w: px(160),
  h: px(40),
  radius: px(10),
  normal_color: 0x444444,
  press_color: 0x666666,
  text_size: px(16),
  text: "返回",
};
