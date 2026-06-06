import { px } from "@zos/utils";
import { setStatusBarVisible, align, text_style } from "@zos/ui";

setStatusBarVisible(false);

export const W = px(390);
export const H = px(450);

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
  x: px(28),
  y: px(24),
  w: px(240),
  h: px(30),
  color: COLORS.TEXT,
  text_size: px(23),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CONN_PILL_BG_STYLE = {
  x: px(270),
  y: px(26),
  w: px(92),
  h: px(26),
  radius: px(13),
};

export const CONN_LABEL_STYLE = {
  x: px(270),
  y: px(28),
  w: px(92),
  h: px(22),
  color: COLORS.GREEN,
  text_size: px(12),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_TRACK_STYLE = {
  x: px(86),
  y: px(64),
  w: px(218),
  h: px(218),
  radius: px(109),
  start_angle: -90,
  end_angle: 270,
  color: COLORS.STROKE,
  line_width: px(16),
};

export const COUNTDOWN_RING_STYLE = {
  ...COUNTDOWN_TRACK_STYLE,
  color: COLORS.ORANGE,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(124),
  w: px(390),
  h: px(86),
  color: COLORS.RED,
  text_size: px(82),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_LABEL_STYLE = {
  x: px(0),
  y: px(214),
  w: px(390),
  h: px(24),
  color: COLORS.MUTED,
  text_size: px(16),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CANCEL_BTN_STYLE = {
  x: px(46),
  y: px(296),
  w: px(298),
  h: px(44),
  radius: px(22),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(16),
  text: "I'm Safe",
};

export const HELP_BTN_STYLE = {
  x: px(46),
  y: px(350),
  w: px(298),
  h: px(44),
  radius: px(22),
  normal_color: COLORS.RED,
  press_color: 0xd1302b,
  text_size: px(16),
  text: "Contact Now",
};

export const PHONE_BTN_STYLE = {
  x: px(95),
  y: px(404),
  w: px(200),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.BLUE,
  press_color: 0x0867c8,
  text_size: px(13),
  text: "Open Phone",
};
