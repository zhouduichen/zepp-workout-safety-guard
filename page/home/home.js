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

export const ZH = Object.freeze({
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

export const EN = Object.freeze({
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
  BTN_HISTORY: "Event History",
  BTN_ONBOARDING: "Start Guide",
});

// Use Chinese as default
const i18n = ZH;

Page({
  state: {
    trainingComplete: false,
    guardEnabled: false,
    phoneOnline: false,
    contactCount: 0,
    outboxCount: 0,
    firstBuild: true,
    widgets: {
      title: null,
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
      } catch {
        this.state.guardEnabled = false;
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

    this.createUI();
  },

  createUI() {
    // Destroy existing widgets
    this.destroyUI();

    const s = this.state;

    // Title
    s.widgets.title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: i18n.TITLE,
    });
    s.widgets.title.setEnable(false);

    // Status: Guard enabled/disabled
    s.widgets.statusGuard = createWidget(widget.TEXT, {
      ...Styles.STATUS_GUARD_STYLE,
      text: s.guardEnabled ? i18n.GUARD_ENABLED : i18n.GUARD_DISABLED,
    });
    s.widgets.statusGuard.setEnable(false);

    // Status: Remote assistance
    s.widgets.statusRemote = createWidget(widget.TEXT, {
      ...Styles.STATUS_REMOTE_STYLE,
      text: s.phoneOnline ? i18n.REMOTE_ONLINE : i18n.REMOTE_OFFLINE,
    });
    s.widgets.statusRemote.setEnable(false);

    // Status: Contacts
    const contactText =
      s.contactCount > 0
        ? i18n.CONTACTS.replace("{0}", String(s.contactCount))
        : i18n.CONTACTS_NONE;
    s.widgets.statusContacts = createWidget(widget.TEXT, {
      ...Styles.STATUS_CONTACTS_STYLE,
      text: contactText,
    });
    s.widgets.statusContacts.setEnable(false);

    // Status: Outbox
    const outboxText =
      s.outboxCount > 0
        ? i18n.OUTBOX_PENDING.replace("{0}", String(s.outboxCount))
        : i18n.OUTBOX_NONE;
    s.widgets.statusOutbox = createWidget(widget.TEXT, {
      ...Styles.STATUS_OUTBOX_STYLE,
      text: outboxText,
    });
    s.widgets.statusOutbox.setEnable(false);

    if (s.trainingComplete) {
      // Button: I feel unwell
      s.widgets.btnUnwell = createWidget(widget.TEXT, {
        ...Styles.BTN_UNWELL_STYLE,
        text: i18n.BTN_UNWELL,
      });
      s.widgets.btnUnwell.addEventListener(event.CLICK_UP, () => {
        try {
          push({ url: "/page/assist/assist", params: { source: "home" } });
        } catch (e) {
          console.log("Assist nav failed: " + (e.message || String(e)));
        }
      });

      // Button: Practice
      s.widgets.btnPractice = createWidget(widget.TEXT, {
        ...Styles.BTN_PRACTICE_STYLE,
        text: i18n.BTN_PRACTICE,
      });
      s.widgets.btnPractice.addEventListener(event.CLICK_UP, () => {
        try {
          push({ url: "/page/onboarding/onboarding", params: { practiceOnly: "true" } });
        } catch (e) {
          console.log("Practice nav failed: " + (e.message || String(e)));
        }
      });

      // Button: Event history
      s.widgets.btnHistory = createWidget(widget.TEXT, {
        ...Styles.BTN_HISTORY_STYLE,
        text: i18n.BTN_HISTORY,
      });
      s.widgets.btnHistory.addEventListener(event.CLICK_UP, () => {
        try {
          push({ url: "/page/history/history" });
        } catch (e) {
          console.log("History nav failed: " + (e.message || String(e)));
        }
      });
    } else {
      // Training not done, show onboarding button
      s.widgets.btnUnwell = createWidget(widget.TEXT, {
        ...Styles.BTN_UNWELL_STYLE,
        text: i18n.BTN_ONBOARDING,
      });
      s.widgets.btnUnwell.addEventListener(event.CLICK_UP, () => {
        try {
          push({ url: "/page/onboarding/onboarding" });
        } catch (e) {
          console.log("Onboarding nav failed: " + (e.message || String(e)));
        }
      });
    }
  },

  destroyUI() {
    const s = this.state;
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
