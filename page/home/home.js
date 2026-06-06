/**
 * home.js — Dashboard for the Workout Safety Guard.
 *
 * Displays status information and action buttons.
 * Redirects to onboarding if training has not been completed.
 */

import { createWidget, deleteWidget, widget, event, prop } from "@zos/ui";
import * as Styles from "zosLoader:./home.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";
import { push } from "@zos/router";
import { px } from "@zos/utils";
import { LocalStorage } from "@zos/storage";

// ---------------------------------------------------------------------------
// Localization copy (Chinese)
// ---------------------------------------------------------------------------

const ZH = Object.freeze({
  TITLE: "运动异常守护",
  GUARD_ENABLED: "自动守护：已开启",
  GUARD_DISABLED: "自动守护：未开启",
  REMOTE_ONLINE: "远程求助：手机在线",
  REMOTE_OFFLINE: "远程求助：离线仅本地警报",
  CONTACTS: "紧急联系人：已配置 {0} / 3",
  CONTACTS_NONE: "紧急联系人：未配置",
  OUTBOX_NONE: "待发送事件：无",
  OUTBOX_PENDING: "待发送事件：{0} 条",
  NO_TRAINING: "请先完成演练",
  BTN_UNWELL: "我感觉不适",
  BTN_PRACTICE: "演练",
  BTN_HISTORY: "事件历史",
  BTN_ONBOARDING: "开始引导",
});

// ---------------------------------------------------------------------------
// Localization copy (English)
// ---------------------------------------------------------------------------

const EN = Object.freeze({
  TITLE: "Workout Safety Guard",
  GUARD_ENABLED: "Auto Guard: Enabled",
  GUARD_DISABLED: "Auto Guard: Disabled",
  REMOTE_ONLINE: "Remote Help: Online",
  REMOTE_OFFLINE: "Remote Help: Offline Local Only",
  CONTACTS: "Contacts: {0} / 3",
  CONTACTS_NONE: "Contacts: Not Configured",
  OUTBOX_NONE: "Pending Outbox: None",
  OUTBOX_PENDING: "Pending Outbox: {0}",
  NO_TRAINING: "Complete training first",
  BTN_UNWELL: "I Feel Unwell",
  BTN_PRACTICE: "Practice",
  BTN_HISTORY: "History",
  BTN_ONBOARDING: "Start Guide",
});

const i18n = EN;

Page({
  state: {
    trainingComplete: false,
    guardEnabled: false,
    phoneOnline: false,
    contactCount: 0,
    outboxCount: 0,
    history: [],
    decorations: [],
    firstBuild: true,
    widgets: {
      title: null,
      statusPill: null,
      score: null,
      scoreLabel: null,
      statusGuard: null,
      statusRemote: null,
      statusContacts: null,
      statusOutbox: null,
      btnUnwell: null,
      btnPractice: null,
      btnHistory: null,
    },
  },

  build() {
    const localStorage = new LocalStorage();

    // Check if training is complete
    const stored = localStorage.getItem("trainingComplete", false);
    this.state.trainingComplete = stored === true || stored === "true";

    if (!this.state.trainingComplete && this.state.firstBuild) {
      this.state.firstBuild = false;
      // Navigate to onboarding
      try {
        push({ url: "/page/onboarding/onboarding" });
        return;
      } catch (e) {
        console.log("Onboarding nav failed: " + (e.message || String(e)));
      }
    }

    // Load contacts count
    const contactsRaw = localStorage.getItem("contacts", "[]");
    try {
      const contacts = JSON.parse(contactsRaw);
      this.state.contactCount = Array.isArray(contacts) ? contacts.length : 0;
    } catch {
      this.state.contactCount = 0;
    }

    // Check if guard is running via stored state
    const guardRaw = localStorage.getItem("guard_state", null);
    if (guardRaw) {
      try {
        const guardState = JSON.parse(guardRaw);
        this.state.guardEnabled = guardState && guardState.guardEnabled !== false;
        this.state.phoneOnline = guardState && guardState.phoneOnline === true;
      } catch {
        this.state.guardEnabled = false;
        this.state.phoneOnline = false;
      }
    }

    // Check outbox count
    const outboxRaw = localStorage.getItem("guard_outbox", null);
    if (outboxRaw) {
      try {
        const outbox = JSON.parse(outboxRaw);
        const entries = outbox && outbox.entries ? outbox.entries : [];
        this.state.outboxCount = entries.filter(
          (e) => e.acknowledgedAtMs === null
        ).length;
      } catch {
        this.state.outboxCount = 0;
      }
    }

    const historyRaw = localStorage.getItem("guard_history", "[]");
    try {
      const history = JSON.parse(historyRaw);
      this.state.history = Array.isArray(history) ? history : [];
    } catch {
      this.state.history = [];
    }

    this.createUI();
  },

  createUI() {
    this.destroyUI();

    const s = this.state;
    const colors = Styles.COLORS;
    const guardScore = this._computeGuardScore();
    const scoreColor = this._scoreColor(guardScore);

    this._addDecoration(createWidget(widget.FILL_RECT, {
      ...Common.SCREEN_STYLE,
      color: colors.BACKGROUND,
    }));

    this._drawCard(Styles.STATUS_PILL_BG_STYLE, colors.SURFACE);

    s.widgets.title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: "Fitness Guard",
    });
    s.widgets.title.setEnable(false);

    s.widgets.statusPill = createWidget(widget.TEXT, {
      ...Styles.STATUS_PILL_TEXT_STYLE,
      color: s.guardEnabled ? colors.GREEN : colors.ORANGE,
      text: s.guardEnabled ? "ACTIVE" : "SETUP",
    });
    s.widgets.statusPill.setEnable(false);

    this._addDecoration(createWidget(widget.ARC, {
      ...Styles.RING_TRACK_STYLE,
    }));
    this._addDecoration(createWidget(widget.ARC, {
      ...Styles.RING_PROGRESS_STYLE,
      end_angle: this._progressEndAngle(guardScore),
      color: scoreColor,
    }));

    s.widgets.score = createWidget(widget.TEXT, {
      ...Styles.SCORE_STYLE,
      color: colors.TEXT,
      text: String(guardScore),
    });
    s.widgets.score.setEnable(false);

    s.widgets.scoreLabel = createWidget(widget.TEXT, {
      ...Styles.SCORE_LABEL_STYLE,
      text: "Guard Score",
    });
    s.widgets.scoreLabel.setEnable(false);

    this._createStat(0, `${s.contactCount}/3`, "Contacts", s.contactCount > 0 ? colors.GREEN : colors.ORANGE);
    this._createStat(1, String(s.outboxCount), "Queue", s.outboxCount > 0 ? colors.RED : colors.GREEN);
    this._createStat(2, s.phoneOnline ? "On" : "Off", "Phone", s.phoneOnline ? colors.GREEN : colors.ORANGE);
    this._createStat(3, s.guardEnabled ? "On" : "Off", "Service", s.guardEnabled ? colors.BLUE : colors.DIM);

    s.widgets.statusOutbox = createWidget(widget.TEXT, {
      ...Styles.TREND_LABEL_STYLE,
      text: "Readiness",
    });
    s.widgets.statusOutbox.setEnable(false);

    const bars = this._readinessBars(guardScore);
    for (let i = 0; i < bars.length; i++) {
      this._addDecoration(createWidget(widget.FILL_RECT, Styles.TREND_BAR_STYLE(
        i,
        px(bars[i].height),
        bars[i].color,
      )));
    }

    if (s.trainingComplete) {
      s.widgets.btnUnwell = createWidget(widget.BUTTON, {
        ...Styles.BTN_UNWELL_STYLE,
        text: i18n.BTN_UNWELL,
        click_func: () => {
          try {
            push({ url: "/page/assist/assist", params: { source: "home" } });
          } catch (e) {
            console.log("Assist nav failed: " + (e.message || String(e)));
          }
        },
      });

      s.widgets.btnPractice = createWidget(widget.BUTTON, {
        ...Styles.BTN_PRACTICE_STYLE,
        text: i18n.BTN_PRACTICE,
        click_func: () => {
          try {
            push({ url: "/page/onboarding/onboarding", params: { practiceOnly: "true" } });
          } catch (e) {
            console.log("Practice nav failed: " + (e.message || String(e)));
          }
        },
      });

      s.widgets.btnHistory = createWidget(widget.BUTTON, {
        ...Styles.BTN_HISTORY_STYLE,
        text: i18n.BTN_HISTORY,
        click_func: () => {
          try {
            push({ url: "/page/history/history" });
          } catch (e) {
            console.log("History nav failed: " + (e.message || String(e)));
          }
        },
      });
    } else {
      s.widgets.btnUnwell = createWidget(widget.BUTTON, {
        ...Styles.BTN_UNWELL_STYLE,
        text: i18n.BTN_ONBOARDING,
        normal_color: colors.BLUE,
        press_color: 0x0867c8,
        click_func: () => {
          try {
            push({ url: "/page/onboarding/onboarding" });
          } catch (e) {
            console.log("Onboarding nav failed: " + (e.message || String(e)));
          }
        },
      });
    }
  },

  _addDecoration(ref) {
    if (ref) this.state.decorations.push(ref);
    return ref;
  },

  _drawCard(style, color) {
    this._addDecoration(createWidget(widget.FILL_RECT, {
      ...style,
      y: style.y + px(4),
      color: 0x0a0a0c,
    }));
    return this._addDecoration(createWidget(widget.FILL_RECT, {
      ...style,
      color,
    }));
  },

  _createStat(index, value, label, color) {
    this._drawCard(Styles.STAT_CARD_STYLE(index), Styles.COLORS.SURFACE);
    this.state.widgets[`status${index}`] = createWidget(widget.TEXT, {
      ...Styles.STAT_VALUE_STYLE(index),
      color,
      text: value,
    });
    this.state.widgets[`status${index}`].setEnable(false);
    this.state.widgets[`statusLabel${index}`] = createWidget(widget.TEXT, {
      ...Styles.STAT_LABEL_STYLE(index),
      text: label,
    });
    this.state.widgets[`statusLabel${index}`].setEnable(false);
  },

  _computeGuardScore() {
    let score = 42;
    if (this.state.guardEnabled) score += 24;
    if (this.state.phoneOnline) score += 16;
    if (this.state.contactCount >= 3) score += 10;
    else if (this.state.contactCount > 0) score += 6;
    if (this.state.outboxCount === 0) score += 8;
    else score -= Math.min(24, this.state.outboxCount * 8);
    return Math.max(0, Math.min(100, score));
  },

  _scoreColor(score) {
    if (this.state.outboxCount > 0) return Styles.COLORS.RED;
    if (!this.state.phoneOnline) return Styles.COLORS.ORANGE;
    if (score >= 80) return Styles.COLORS.GREEN;
    return Styles.COLORS.BLUE;
  },

  _progressEndAngle(score) {
    return Math.round(-90 + (Math.max(0, Math.min(100, score)) / 100) * 360);
  },

  _readinessBars(score) {
    const recent = this.state.history.slice(0, 6).reverse();
    if (recent.length > 0) {
      return recent.map((evt, index) => {
        let color = Styles.COLORS.ORANGE;
        let height = 22 + index * 2;
        if (evt.status === "resolved") {
          color = Styles.COLORS.GREEN;
          height = 34;
        } else if (evt.status === "acknowledged") {
          color = Styles.COLORS.BLUE;
          height = 30;
        } else if (evt.status === "queued") {
          color = Styles.COLORS.ORANGE;
          height = 26;
        } else {
          color = Styles.COLORS.RED;
          height = 38;
        }
        return { height, color };
      });
    }

    const base = [18, 26, 22, 34, 29, 38];
    return base.map((height, index) => {
      let color = index % 3 === 0 ? Styles.COLORS.GREEN : Styles.COLORS.BLUE;
      if (!this.state.phoneOnline && index >= 4) color = Styles.COLORS.ORANGE;
      if (this.state.outboxCount > 0 && index >= 5) color = Styles.COLORS.RED;
      return {
        height: index === base.length - 1 ? Math.max(14, Math.round(score * 0.38)) : height,
        color,
      };
    });
  },

  destroyUI() {
    const s = this.state;
    for (const w of s.decorations) {
      if (w !== null && typeof w === "object") {
        try { deleteWidget(w); } catch {}
      }
    }
    s.decorations = [];
    for (const key of Object.keys(s.widgets)) {
      const w = s.widgets[key];
      if (w !== null && typeof w === "object") {
        try { deleteWidget(w); } catch {}
      }
      s.widgets[key] = null;
    }
  },

  onDestroy() {
    this.destroyUI();
  },
});
