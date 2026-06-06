import { px } from "@zos/utils";
import { align, text_style } from "@zos/ui";

export const W = px(480);
export const H = px(480);

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
  x: px(44),
  y: px(30),
  w: px(300),
  h: px(34),
  color: COLORS.TEXT,
  text_size: px(26),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CONN_PILL_BG_STYLE = {
  x: px(314),
  y: px(34),
  w: px(116),
  h: px(28),
  radius: px(14),
};

export const CONN_LABEL_STYLE = {
  x: px(314),
  y: px(36),
  w: px(116),
  h: px(24),
  color: COLORS.GREEN,
  text_size: px(13),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_TRACK_STYLE = {
  x: px(100),
  y: px(78),
  w: px(280),
  h: px(280),
  radius: px(140),
  start_angle: -90,
  end_angle: 270,
  color: COLORS.STROKE,
  line_width: px(18),
};

export const COUNTDOWN_RING_STYLE = {
  ...COUNTDOWN_TRACK_STYLE,
  color: COLORS.ORANGE,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(154),
  w: px(480),
  h: px(96),
  color: COLORS.RED,
  text_size: px(94),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_LABEL_STYLE = {
  x: px(0),
  y: px(250),
  w: px(480),
  h: px(28),
  color: COLORS.MUTED,
  text_size: px(18),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CANCEL_BTN_STYLE = {
  x: px(48),
  y: px(368),
  w: px(184),
  h: px(52),
  radius: px(26),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(18),
  text: "I'm Safe",
};

export const HELP_BTN_STYLE = {
  x: px(248),
  y: px(368),
  w: px(184),
  h: px(52),
  radius: px(26),
  normal_color: COLORS.RED,
  press_color: 0xd1302b,
  text_size: px(18),
  text: "Contact Now",
};

export const PHONE_BTN_STYLE = {
  x: px(86),
  y: px(432),
  w: px(308),
  h: px(36),
  radius: px(18),
  normal_color: COLORS.BLUE,
  press_color: 0x0867c8,
  text_size: px(16),
  text: "Open Phone",
};

export const CONFIRM_PROMPT_STYLE = {
  x: px(58),
  y: px(306),
  w: px(364),
  h: px(34),
  color: COLORS.ORANGE,
  text_size: px(18),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const CONFIRM_YES_STYLE = {
  x: px(48),
  y: px(368),
  w: px(184),
  h: px(52),
  radius: px(26),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(18),
  text: "I'm Safe",
};

export const CONFIRM_NO_STYLE = {
  x: px(248),
  y: px(368),
  w: px(184),
  h: px(52),
  radius: px(26),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(18),
  text: "Go Back",
};
