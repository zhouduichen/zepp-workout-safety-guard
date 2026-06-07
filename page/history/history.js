import { createWidget, deleteWidget, widget } from "@zos/ui";
import { px } from "@zos/utils";
import * as Styles from "zosLoader:./history.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";
import {
  loadOutbox,
  saveOutbox,
  loadEventHistory,
  saveEventHistory,
  clearEventHistory,
} from "../../src/device/storage.js";
import { resolveLatestHelp } from "../../src/pages/assist-session.js";

// ---------------------------------------------------------------------------
// Localization
// ---------------------------------------------------------------------------
const ZH = Object.freeze({
  TITLE: "事件历史",
  COUNT: "{0} 个事件",
  TOTAL: "总计",
  RESOLVED: "已解决",
  OPEN: "未解决",
  NO_EVENTS: "暂无事件",
  NO_EVENTS_SUB: "演练和求助事件将显示在此处。",
  MARK_SAFE: "标记安全",
  CLEAR: "清空",
  BACK: "返回",
  STATUS_RESOLVED: "已解决",
  STATUS_ACKED: "已发送，等待中",
  STATUS_QUEUED: "已排队",
  STATUS_OPEN: "待处理",
  TRIGGER_HIGH_RISK: "自动异常",
  TRIGGER_MANUAL: "手动求助",
  TRIGGER_DEFAULT: "求助事件",
  TAG_GPS_REPLAY: "GPS 重发",
  TAG_GPS: "GPS",
  TAG_REPLAY: "重发",
});

const EN = Object.freeze({
  TITLE: "History",
  COUNT: "{0} events",
  TOTAL: "Total",
  RESOLVED: "Resolved",
  OPEN: "Open",
  NO_EVENTS: "No events yet",
  NO_EVENTS_SUB: "Practice and help events will appear here.",
  MARK_SAFE: "Mark Safe",
  CLEAR: "Clear",
  BACK: "Back",
  STATUS_RESOLVED: "Resolved",
  STATUS_ACKED: "Sent, waiting",
  STATUS_QUEUED: "Queued",
  STATUS_OPEN: "Open",
  TRIGGER_HIGH_RISK: "Auto anomaly",
  TRIGGER_MANUAL: "Manual help",
  TRIGGER_DEFAULT: "Help event",
  TAG_GPS_REPLAY: "GPS Replay",
  TAG_GPS: "GPS",
  TAG_REPLAY: "Replay",
});

const i18n = ZH;

Page({
  state: {
    widgets: [],
    _clearing: false,
    _markingSafe: false,
  },

  build() {
    this.destroyWidgets();

    this.track(createWidget(widget.FILL_RECT, {
      ...Common.SCREEN_STYLE,
      color: Styles.COLORS.BACKGROUND,
    }));

    const events = loadEventHistory() || [];
    const unresolved = events.filter(e => e.status === "queued" || e.status === "acknowledged").length;
    const resolved = events.filter(e => e.status === "resolved").length;

    this.track(createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: i18n.TITLE,
    }));
    this.track(createWidget(widget.TEXT, {
      ...Styles.COUNT_STYLE,
      text: i18n.COUNT.replace("{0}", String(events.length)),
    }));

    this.createSummary(0, String(events.length), i18n.TOTAL, Styles.COLORS.BLUE);
    this.createSummary(1, String(resolved), i18n.RESOLVED, Styles.COLORS.GREEN);
    this.createSummary(2, String(unresolved), i18n.OPEN, unresolved > 0 ? Styles.COLORS.ORANGE : Styles.COLORS.MUTED);

    if (events.length === 0) {
      this.drawCard(Styles.EMPTY_CARD_STYLE, Styles.COLORS.SURFACE);
      this.track(createWidget(widget.TEXT, {
        ...Styles.EMPTY_CHECK_STYLE,
        text: "\u2713",
      }));
      this.track(createWidget(widget.TEXT, {
        ...Styles.EMPTY_STYLE,
        text: i18n.NO_EVENTS,
      }));
      this.track(createWidget(widget.TEXT, {
        ...Styles.EMPTY_SUB_STYLE,
        text: i18n.NO_EVENTS_SUB,
      }));
    } else {
      const visibleEvents = events.slice(0, Styles.MAX_VISIBLE_EVENTS);
      for (let i = 0; i < visibleEvents.length; i++) {
        this.createEventRow(i, visibleEvents[i]);
      }
    }

    if (unresolved > 0) {
      this.track(createWidget(widget.BUTTON, {
        ...Styles.MARK_SAFE_BTN_STYLE,
        text: i18n.MARK_SAFE,
        click_func: () => this._onMarkSafe(),
      }));
    }

    if (events.length === 0) {
      this.track(createWidget(widget.BUTTON, {
        ...Styles.EMPTY_BACK_BTN_STYLE,
        text: i18n.BACK,
        click_func: () => this._onBack(),
      }));
    } else {
      this.track(createWidget(widget.BUTTON, {
        ...Styles.CLEAR_BTN_STYLE,
        text: i18n.CLEAR,
        click_func: () => this._onClearHistory(),
      }));

      this.track(createWidget(widget.BUTTON, {
        ...Styles.BACK_BTN_STYLE,
        text: i18n.BACK,
        click_func: () => this._onBack(),
      }));
    }
  },

  createSummary(index, value, label, color) {
    this.drawCard(Styles.SUMMARY_CARD_STYLE(index), Styles.COLORS.SURFACE);
    this.track(createWidget(widget.TEXT, {
      ...Styles.SUMMARY_VALUE_STYLE(index),
      color,
      text: value,
    }));
    this.track(createWidget(widget.TEXT, {
      ...Styles.SUMMARY_LABEL_STYLE(index),
      text: label,
    }));
  },

  createEventRow(index, evt) {
    const dotColor = this.statusColor(evt.status);
    this.drawCard(Styles.EVENT_ROW_BG(index), Styles.COLORS.SURFACE);
    this.track(createWidget(widget.FILL_RECT, {
      x: Styles.EVENT_ROW_BG(index).x + px(12),
      y: Styles.EVENT_ROW_BG(index).y + px(19),
      w: px(10),
      h: px(10),
      radius: px(5),
      color: dotColor,
    }));

    this.track(createWidget(widget.TEXT, {
      ...Styles.EVENT_TRIGGER_STYLE(index),
      color: Styles.COLORS.TEXT,
      text: this.triggerLabel(evt.trigger),
    }));

    this.track(createWidget(widget.TEXT, {
      ...Styles.EVENT_STATUS_STYLE(index),
      color: dotColor,
      text: this.statusLabel(evt.status),
    }));

    this.track(createWidget(widget.TEXT, {
      ...Styles.EVENT_TIME_STYLE(index),
      color: Styles.COLORS.MUTED,
      text: this.formatTime(evt.occurredAtMs),
    }));

    const tag = this.eventTag(evt);
    if (tag) {
      this.track(createWidget(widget.TEXT, {
        ...Styles.EVENT_TAG_STYLE(index),
        color: Styles.COLORS.MUTED,
        text: tag,
      }));
    }
  },

  drawCard(style, color) {
    this.track(createWidget(widget.FILL_RECT, {
      ...style,
      y: style.y + px(4),
      color: 0x0a0a0c,
    }));
    this.track(createWidget(widget.FILL_RECT, {
      ...style,
      color,
    }));
  },

  statusColor(status) {
    if (status === "resolved") return Styles.COLORS.GREEN;
    if (status === "acknowledged") return Styles.COLORS.BLUE;
    if (status === "queued") return Styles.COLORS.ORANGE;
    return Styles.COLORS.RED;
  },

  statusLabel(status) {
    if (status === "resolved") return i18n.STATUS_RESOLVED;
    if (status === "acknowledged") return i18n.STATUS_ACKED;
    if (status === "queued") return i18n.STATUS_QUEUED;
    return i18n.STATUS_OPEN;
  },

  triggerLabel(trigger) {
    if (trigger === "automatic_high_risk") return i18n.TRIGGER_HIGH_RISK;
    if (trigger === "manual") return i18n.TRIGGER_MANUAL;
    return i18n.TRIGGER_DEFAULT;
  },

  eventTag(evt) {
    if (evt.hasLocation && evt.replayed) return i18n.TAG_GPS_REPLAY;
    if (evt.hasLocation) return i18n.TAG_GPS;
    if (evt.replayed) return i18n.TAG_REPLAY;
    return "";
  },

  formatTime(ms) {
    const time = new Date(ms);
    return `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
  },

  _onMarkSafe() {
    if (this.state._markingSafe) return;
    this.state._markingSafe = true;
    resolveLatestHelp({
      storage: { loadOutbox, saveOutbox, loadEventHistory, saveEventHistory },
      now: () => Date.now(),
    });
    this._onBack();
  },

  _onClearHistory() {
    if (this.state._clearing) return;
    this.state._clearing = true;
    clearEventHistory();
    this.build();
  },

  _onBack() {
    const { finish } = require("@zos/router");
    finish();
  },

  track(ref) {
    if (ref) this.state.widgets.push(ref);
    return ref;
  },

  destroyWidgets() {
    for (const w of this.state.widgets) {
      if (w !== null && typeof w === "object") {
        try { deleteWidget(w); } catch {}
      }
    }
    this.state.widgets = [];
  },

  onDestroy() {
    this.destroyWidgets();
  },
});
