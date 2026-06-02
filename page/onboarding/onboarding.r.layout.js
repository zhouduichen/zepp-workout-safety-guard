import { px } from "@zos/utils";
import {
  align,
  text_style,
} from "@zos/ui";

export const W = px(480);
export const H = px(480);

export const PAGE_INDICATOR_STYLE = {
  x: px(0),
  y: px(16),
  w: px(480),
  h: px(24),
  color: 0x666666,
  text_size: px(18),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const TITLE_STYLE = {
  x: px(30),
  y: px(50),
  w: px(420),
  h: px(36),
  color: 0xffffff,
  text_size: px(26),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BODY_STYLE = {
  x: px(30),
  y: px(100),
  w: px(420),
  h: px(240),
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(140),
  w: px(480),
  h: px(100),
  color: 0xff6644,
  text_size: px(72),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_LABEL_STYLE = {
  x: px(30),
  y: px(240),
  w: px(420),
  h: px(30),
  color: 0xaaaaaa,
  text_size: px(20),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_PRIMARY_STYLE = {
  x: px(80),
  y: px(400),
  w: px(320),
  h: px(48),
  color: 0xffffff,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_CANCEL_STYLE = {
  x: px(80),
  y: px(340),
  w: px(320),
  h: px(48),
  color: 0x999999,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};
