import { createWidget, widget, prop, align, text_style } from "@zos/ui";
import { px } from "@zos/utils";
import * as Styles from "zosLoader:./history.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";
import { loadEventHistory, clearEventHistory } from "../../src/device/storage.js";

Page({
  state: {},

  build() {
    // ---- Background ----
    createWidget(widget.FILL_RECT, {
      ...Common.SCREEN_STYLE,
      color: 0x1a1a2e,
    });

    // ---- Title ----
    createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: "事件历史",
    });

    // ---- Load and display events ----
    const events = loadEventHistory();

    if (!events || events.length === 0) {
      // Empty state
      createWidget(widget.TEXT, {
        ...Styles.EMPTY_STYLE,
        text: "暂无事件记录",
      });
      return;
    }

    // Display events (newest first - already sorted by storage)
    let yOffset = Styles.FIRST_EVENT_Y;

    for (let i = 0; i < Math.min(events.length, 20); i++) {
      const evt = events[i];
      const isUnresolved = evt.status === "queued" || evt.status === "acknowledged";

      // Event background
      createWidget(widget.FILL_RECT, {
        ...Styles.EVENT_ROW_BG(i),
        color: isUnresolved ? 0x332222 : 0x222233,
      });

      // Trigger text
      const triggerLabel = evt.trigger === "automatic_high_risk"
        ? "自动检测异常"
        : evt.trigger === "manual"
          ? "主动求助"
          : evt.trigger;

      createWidget(widget.TEXT, {
        ...Styles.EVENT_TRIGGER_STYLE(i),
        color: isUnresolved ? 0xffcc00 : 0x88aaff,
        text: triggerLabel,
      });

      // Status text
      const statusLabel = evt.status === "resolved"
        ? "已解除"
        : evt.status === "acknowledged"
          ? "已发送待解除"
          : "待发送";

      createWidget(widget.TEXT, {
        ...Styles.EVENT_STATUS_STYLE(i),
        color: evt.status === "resolved" ? 0x44cc44 : 0xff8844,
        text: statusLabel,
      });

      // Time text
      const time = new Date(evt.occurredAtMs);
      const timeStr = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;

      createWidget(widget.TEXT, {
        ...Styles.EVENT_TIME_STYLE(i),
        color: 0x888888,
        text: timeStr,
      });

      // Location indicator
      if (evt.hasLocation) {
        createWidget(widget.TEXT, {
          ...Styles.EVENT_LOC_STYLE(i),
          color: 0x44aaff,
          text: "📍",
        });
      }

      // Replay indicator
      if (evt.replayed) {
        createWidget(widget.TEXT, {
          ...Styles.EVENT_REPLAY_STYLE(i),
          color: 0xffaa44,
          text: "补发",
        });
      }
    }

    // ---- Mark safe button (only if unresolved events exist) ----
    const hasUnresolved = events.some(
      e => e.status === "queued" || e.status === "acknowledged"
    );

    if (hasUnresolved) {
      // Place at bottom; for now mark safe navigates back (will hook up to controller later)
      createWidget(widget.BUTTON, {
        ...Styles.MARK_SAFE_BTN_STYLE,
        text: "标记安全",
        click_func: () => this._onMarkSafe(),
      });
    }

    // ---- Clear history button ----
    createWidget(widget.BUTTON, {
      ...Styles.CLEAR_BTN_STYLE,
      text: "清除历史",
      click_func: () => this._onClearHistory(),
    });

    // ---- Back button ----
    createWidget(widget.BUTTON, {
      ...Styles.BACK_BTN_STYLE,
      text: "返回",
      click_func: () => this._onBack(),
    });
  },

  _onMarkSafe() {
    // Record resolution and go back
    const { finish } = require("@zos/router");
    finish();
  },

  _onClearHistory() {
    // Confirm and clear
    clearEventHistory();
    // Rebuild page
    this.build();
  },

  _onBack() {
    const { finish } = require("@zos/router");
    finish();
  },

  onDestroy() {},
});
