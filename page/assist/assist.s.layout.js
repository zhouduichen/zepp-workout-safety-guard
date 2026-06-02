import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from "@zos/ui";

setStatusBarVisible(false);

export const W = px(390);
export const H = px(450);

export const TITLE_STYLE = {
  x: px(0),
  y: px(20),
  w: px(390),
  h: px(40),
  color: 0xffffff,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(70),
  w: px(390),
  h: px(100),
  color: 0xff4444,
  text_size: px(80),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CONN_LABEL_STYLE = {
  x: px(20),
  y: px(180),
  w: px(350),
  h: px(30),
  color: 0xaaaaaa,
  text_size: px(18),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CANCEL_BTN_STYLE = {
  x: px(20),
  y: px(230),
  w: px(160),
  h: px(50),
  radius: px(10),
  normal_color: 0x555555,
  press_color: 0x777777,
  text_size: px(20),
  text: "取消求助",
};

export const HELP_BTN_STYLE = {
  x: px(210),
  y: px(230),
  w: px(160),
  h: px(50),
  radius: px(10),
  normal_color: 0xcc3333,
  press_color: 0xee5555,
  text_size: px(20),
  text: "立即联系家人",
};

export const PHONE_BTN_STYLE = {
  x: px(20),
  y: px(300),
  w: px(350),
  h: px(50),
  radius: px(10),
  normal_color: 0x2266cc,
  press_color: 0x4488ee,
  text_size: px(20),
  text: "打开电话呼叫急救",
};

export const CONFIRM_PROMPT_STYLE = {
  x: px(0),
  y: px(170),
  w: px(390),
  h: px(36),
  color: 0xffcc00,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CONFIRM_YES_STYLE = {
  x: px(20),
  y: px(230),
  w: px(160),
  h: px(50),
  radius: px(10),
  normal_color: 0xcc3333,
  press_color: 0xee5555,
  text_size: px(20),
  text: "确认安全",
};

export const CONFIRM_NO_STYLE = {
  x: px(210),
  y: px(230),
  w: px(160),
  h: px(50),
  radius: px(10),
  normal_color: 0x555555,
  press_color: 0x777777,
  text_size: px(20),
  text: "返回",
};
