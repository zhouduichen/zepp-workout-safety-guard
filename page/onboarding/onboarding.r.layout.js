import { px } from "@zos/utils";
import {
  align,
  text_style,
} from "@zos/ui";

export const W = px(480);
export const H = px(480);

export const COLORS = {
  BACKGROUND: 0x050607,
  SURFACE: 0x15171a,
  SURFACE_2: 0x202328,
  STROKE: 0x2c3036,
  TEXT: 0xf5f7fa,
  MUTED: 0x8b929c,
  GREEN: 0x32d74b,
  ORANGE: 0xff9f0a,
  RED: 0xff453a,
  BLUE: 0x0a84ff,
  PINK: 0xff2d92,
};

export const PAGE_INDICATOR_STYLE = {
  x: px(0),
  y: px(30),
  w: px(480),
  h: px(22),
  color: COLORS.MUTED,
  text_size: px(15),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export function PROGRESS_DOT_STYLE(index, active) {
  return {
    x: px(146 + index * 27),
    y: px(60),
    w: active ? px(18) : px(8),
    h: px(8),
    radius: px(4),
    color: active ? COLORS.GREEN : COLORS.STROKE,
  };
}

export const CARD_STYLE = {
  x: px(48),
  y: px(92),
  w: px(384),
  h: px(232),
  radius: px(28),
};

export const TITLE_STYLE = {
  x: px(76),
  y: px(122),
  w: px(328),
  h: px(42),
  color: COLORS.TEXT,
  text_size: px(28),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const BODY_STYLE = {
  x: px(76),
  y: px(176),
  w: px(328),
  h: px(128),
  color: COLORS.MUTED,
  text_size: px(19),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const COUNTDOWN_TRACK_STYLE = {
  x: px(136),
  y: px(108),
  w: px(208),
  h: px(208),
  radius: px(104),
  start_angle: -90,
  end_angle: 270,
  color: COLORS.STROKE,
  line_width: px(14),
};

export const COUNTDOWN_RING_STYLE = {
  ...COUNTDOWN_TRACK_STYLE,
  color: COLORS.ORANGE,
};

export const COUNTDOWN_STYLE = {
  x: px(0),
  y: px(162),
  w: px(480),
  h: px(72),
  color: COLORS.TEXT,
  text_size: px(70),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const COUNTDOWN_LABEL_STYLE = {
  x: px(0),
  y: px(236),
  w: px(480),
  h: px(26),
  color: COLORS.MUTED,
  text_size: px(18),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const BTN_PRIMARY_STYLE = {
  x: px(58),
  y: px(386),
  w: px(364),
  h: px(48),
  radius: px(24),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(20),
  text: "Next",
};

export const BTN_CANCEL_STYLE = {
  x: px(100),
  y: px(440),
  w: px(280),
  h: px(34),
  radius: px(17),
  normal_color: COLORS.SURFACE_2,
  press_color: COLORS.STROKE,
  text_size: px(16),
  text: "Cancel",
};
