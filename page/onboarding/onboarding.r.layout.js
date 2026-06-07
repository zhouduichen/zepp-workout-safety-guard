import { px } from "@zos/utils";
import {
  align,
  text_style,
} from "@zos/ui";

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
  PINK: 0xff375f,
};

export const PAGE_INDICATOR_STYLE = {
  x: px(0),
  y: px(28),
  w: px(480),
  h: px(22),
  color: COLORS.MUTED,
  text_size: px(15),
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.NONE,
};

export const PROGRESS_TRACK_STYLE = {
  x: px(150),
  y: px(60),
  w: px(180),
  h: px(10),
  radius: px(5),
  color: COLORS.STROKE,
};

export function PROGRESS_FILL_STYLE(step, total) {
  const progress = Math.max(1, Math.min(total, step + 1));
  return {
    ...PROGRESS_TRACK_STYLE,
    w: Math.round(px(180) * progress / total),
    color: COLORS.GREEN,
  };
}

export function PROGRESS_CAP_STYLE(step, total) {
  return {
    x: px(150 + step * 180 / total - 1),
    y: px(59),
    w: px(3),
    h: px(12),
    radius: px(2),
    color: COLORS.BACKGROUND,
  };
}

export const CARD_STYLE = {
  x: px(58),
  y: px(88),
  w: px(364),
  h: px(236),
  radius: px(28),
};

export const TITLE_STYLE = {
  x: px(86),
  y: px(116),
  w: px(308),
  h: px(38),
  color: COLORS.TEXT,
  text_size: px(26),
  align_h: align.LEFT,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
};

export const BODY_STYLE = {
  x: px(86),
  y: px(168),
  w: px(308),
  h: px(134),
  color: COLORS.MUTED,
  text_size: px(18),
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
  x: px(80),
  y: px(358),
  w: px(320),
  h: px(44),
  radius: px(22),
  normal_color: COLORS.GREEN,
  press_color: 0x28b63d,
  text_size: px(19),
  text: "Next",
};

export const BTN_CANCEL_STYLE = {
  x: px(136),
  y: px(416),
  w: px(208),
  h: px(30),
  radius: px(15),
  normal_color: COLORS.SURFACE,
  press_color: COLORS.SURFACE_2,
  text_size: px(15),
  text: "Cancel",
};
