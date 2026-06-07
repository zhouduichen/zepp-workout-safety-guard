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

Page({
  state: {
    widgets: [],
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
      text: "History",
    }));
    this.track(createWidget(widget.TEXT, {
      ...Styles.COUNT_STYLE,
      text: `${events.length} events`,
    }));

    this.createSummary(0, String(events.length), "Total", Styles.COLORS.BLUE);
    this.createSummary(1, String(resolved), "Resolved", Styles.COLORS.GREEN);
    this.createSummary(2, String(unresolved), "Open", unresolved > 0 ? Styles.COLORS.ORANGE : Styles.COLORS.MUTED);

    if (events.length === 0) {
      this.drawCard(Styles.EMPTY_CARD_STYLE, Styles.COLORS.SURFACE);
      this.track(createWidget(widget.TEXT, {
        ...Styles.EMPTY_CHECK_STYLE,
        text: "\u2713",
      }));
      this.track(createWidget(widget.TEXT, {
        ...Styles.EMPTY_STYLE,
        text: "No events yet",
      }));
      this.track(createWidget(widget.TEXT, {
        ...Styles.EMPTY_SUB_STYLE,
        text: "Practice and help events will appear here.",
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
        text: "Mark Safe",
        click_func: () => this._onMarkSafe(),
      }));
    }

    if (events.length === 0) {
      this.track(createWidget(widget.BUTTON, {
        ...Styles.EMPTY_BACK_BTN_STYLE,
        text: "Back",
        click_func: () => this._onBack(),
      }));
    } else {
      this.track(createWidget(widget.BUTTON, {
        ...Styles.CLEAR_BTN_STYLE,
        text: "Clear",
        click_func: () => this._onClearHistory(),
      }));

      this.track(createWidget(widget.BUTTON, {
        ...Styles.BACK_BTN_STYLE,
        text: "Back",
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
    if (status === "resolved") return "Resolved";
    if (status === "acknowledged") return "Sent, waiting";
    if (status === "queued") return "Queued";
    return "Open";
  },

  triggerLabel(trigger) {
    if (trigger === "automatic_high_risk") return "Auto anomaly";
    if (trigger === "manual") return "Manual help";
    return "Help event";
  },

  eventTag(evt) {
    if (evt.hasLocation && evt.replayed) return "GPS Replay";
    if (evt.hasLocation) return "GPS";
    if (evt.replayed) return "Replay";
    return "";
  },

  formatTime(ms) {
    const time = new Date(ms);
    return `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
  },

  _onMarkSafe() {
    resolveLatestHelp({
      storage: { loadOutbox, saveOutbox, loadEventHistory, saveEventHistory },
      now: () => Date.now(),
    });
    this._onBack();
  },

  _onClearHistory() {
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
