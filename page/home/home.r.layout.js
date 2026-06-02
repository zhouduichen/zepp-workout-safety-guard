import { px } from "@zos/utils";
import {
  align,
  text_style,
} from "@zos/ui";

export const W = px(480);
export const H = px(480);

export const TITLE_STYLE = {
  x: px(0),
  y: px(20),
  w: px(480),
  h: px(40),
  color: 0xffffff,
  text_size: px(28),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

// Status row height
const ROW_H = px(32);
const ROW_GAP = px(4);
const START_Y = px(70);

export const STATUS_GUARD_STYLE = {
  x: px(30),
  y: px(START_Y + 0 * (ROW_H + ROW_GAP)),
  w: px(420),
  h: ROW_H,
  color: 0x4caf50,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_REMOTE_STYLE = {
  x: px(30),
  y: px(START_Y + 1 * (ROW_H + ROW_GAP)),
  w: px(420),
  h: ROW_H,
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_CONTACTS_STYLE = {
  x: px(30),
  y: px(START_Y + 2 * (ROW_H + ROW_GAP)),
  w: px(420),
  h: ROW_H,
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_OUTBOX_STYLE = {
  x: px(30),
  y: px(START_Y + 3 * (ROW_H + ROW_GAP)),
  w: px(420),
  h: ROW_H,
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

// Buttons
const BTN_Y_BASE = px(270);
const BTN_H = px(50);
const BTN_GAP = px(12);

export const BTN_UNWELL_STYLE = {
  x: px(60),
  y: BTN_Y_BASE + 0 * (BTN_H + BTN_GAP),
  w: px(360),
  h: BTN_H,
  color: 0xffffff,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_PRACTICE_STYLE = {
  x: px(60),
  y: BTN_Y_BASE + 1 * (BTN_H + BTN_GAP),
  w: px(360),
  h: BTN_H,
  color: 0xaaaaaa,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_HISTORY_STYLE = {
  x: px(60),
  y: BTN_Y_BASE + 2 * (BTN_H + BTN_GAP),
  w: px(360),
  h: BTN_H,
  color: 0x888888,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};
