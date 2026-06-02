import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from '@zos/ui'

setStatusBarVisible(false)

export const W = px(390);
export const H = px(450);

export const PAGE_INDICATOR_STYLE = {
  x: px(0),
  y: px(12),
  w: px(390),
  h: px(22),
  color: 0x666666,
  text_size: px(18),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const TITLE_STYLE = {
  x: px(20),
  y: px(44),
  w: px(350),
  h: px(34),
  color: 0xffffff,
  text_size: px(26),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BODY_STYLE = {
  x: px(20),
  y: px(88),
  w: px(350),
  h: px(210),
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(130),
  w: px(390),
  h: px(90),
  color: 0xff6644,
  text_size: px(72),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_LABEL_STYLE = {
  x: px(20),
  y: px(220),
  w: px(350),
  h: px(28),
  color: 0xaaaaaa,
  text_size: px(20),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_PRIMARY_STYLE = {
  x: px(60),
  y: px(380),
  w: px(270),
  h: px(44),
  color: 0xffffff,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_CANCEL_STYLE = {
  x: px(60),
  y: px(330),
  w: px(270),
  h: px(44),
  color: 0x999999,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};
