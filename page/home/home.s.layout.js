import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from '@zos/ui'

setStatusBarVisible(false)

export const W = px(390);
export const H = px(450);

export const TITLE_STYLE = {
  x: px(0),
  y: px(16),
  w: px(390),
  h: px(38),
  color: 0xffffff,
  text_size: px(28),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

// Status row height
const ROW_H = px(30);
const ROW_GAP = px(3);
const START_Y = px(64);

export const STATUS_GUARD_STYLE = {
  x: px(20),
  y: px(START_Y + 0 * (ROW_H + ROW_GAP)),
  w: px(350),
  h: ROW_H,
  color: 0x4caf50,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_REMOTE_STYLE = {
  x: px(20),
  y: px(START_Y + 1 * (ROW_H + ROW_GAP)),
  w: px(350),
  h: ROW_H,
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_CONTACTS_STYLE = {
  x: px(20),
  y: px(START_Y + 2 * (ROW_H + ROW_GAP)),
  w: px(350),
  h: ROW_H,
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const STATUS_OUTBOX_STYLE = {
  x: px(20),
  y: px(START_Y + 3 * (ROW_H + ROW_GAP)),
  w: px(350),
  h: ROW_H,
  color: 0xcccccc,
  text_size: px(20),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

// Buttons
const BTN_Y_BASE = px(256);
const BTN_H = px(46);
const BTN_GAP = px(10);

export const BTN_UNWELL_STYLE = {
  x: px(40),
  y: BTN_Y_BASE + 0 * (BTN_H + BTN_GAP),
  w: px(310),
  h: BTN_H,
  color: 0xffffff,
  text_size: px(24),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_PRACTICE_STYLE = {
  x: px(40),
  y: BTN_Y_BASE + 1 * (BTN_H + BTN_GAP),
  w: px(310),
  h: BTN_H,
  color: 0xaaaaaa,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_HISTORY_STYLE = {
  x: px(40),
  y: BTN_Y_BASE + 2 * (BTN_H + BTN_GAP),
  w: px(310),
  h: BTN_H,
  color: 0x888888,
  text_size: px(22),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};
