import { px } from "@zos/utils";
import { align, text_style } from "@zos/ui";

export const W = px(480);
export const H = px(480);

export const TITLE_STYLE = {
  x: px(0),
  y: px(30),
  w: px(480),
  h: px(50),
  color: 0xffffff,
  text_size: px(28),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(90),
  w: px(480),
  h: px(120),
  color: 0xff4444,
  text_size: px(96),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CONN_LABEL_STYLE = {
  x: px(40),
  y: px(220),
  w: px(400),
  h: px(36),
  color: 0xaaaaaa,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CANCEL_BTN_STYLE = {
  x: px(40),
  y: px(280),
  w: px(190),
  h: px(56),
  radius: px(12),
  normal_color: 0x555555,
  press_color: 0x777777,
  text_size: px(22),
  text: "取消求助",
};

export const HELP_BTN_STYLE = {
  x: px(250),
  y: px(280),
  w: px(190),
  h: px(56),
  radius: px(12),
  normal_color: 0xcc3333,
  press_color: 0xee5555,
  text_size: px(22),
  text: "立即联系家人",
};

export const PHONE_BTN_STYLE = {
  x: px(40),
  y: px(360),
  w: px(400),
  h: px(56),
  radius: px(12),
  normal_color: 0x2266cc,
  press_color: 0x4488ee,
  text_size: px(22),
  text: "打开电话呼叫急救",
};

export const CONFIRM_PROMPT_STYLE = {
  x: px(0),
  y: px(210),
  w: px(480),
  h: px(40),
  color: 0xffcc00,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CONFIRM_YES_STYLE = {
  x: px(40),
  y: px(280),
  w: px(190),
  h: px(56),
  radius: px(12),
  normal_color: 0xcc3333,
  press_color: 0xee5555,
  text_size: px(22),
  text: "确认安全",
};

export const CONFIRM_NO_STYLE = {
  x: px(250),
  y: px(280),
  w: px(190),
  h: px(56),
  radius: px(12),
  normal_color: 0x555555,
  press_color: 0x777777,
  text_size: px(22),
  text: "返回",
};
