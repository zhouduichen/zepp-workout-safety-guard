import { createWidget, widget, prop } from "@zos/ui";
import { createModal, MODAL_CONFIRM } from "@zos/interaction";
import * as Styles from "zosLoader:./assist.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";
import { AssistState, createAssistController } from "../../src/pages/assist-controller.js";
import { createAssistSession } from "../../src/pages/assist-session.js";
import {
  loadOutbox,
  saveOutbox,
  loadEventHistory,
  saveEventHistory,
} from "../../src/device/storage.js";

function parseParams(params) {
  if (!params) return {};
  if (typeof params === "object") return params;
  try {
    return JSON.parse(params);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Localization
// ---------------------------------------------------------------------------
const ZH = Object.freeze({
  TITLE: "运动求助",
  COUNTDOWN_LABEL: "秒后自动联系",
  ONLINE: "在线",
  OFFLINE: "离线",
  CANCEL_BTN: "我安全了",
  CONTACT_BTN: "立即联系",
  PHONE_BTN: "打开电话",
  CONFIRM_TITLE: "确认安全？",
  CONFIRM_SUB: "取消自动联系，返回守护。",
  QUEUED: "已排队",
  CLOSE: "关闭",
  CANCELLED: "已取消",
  GPS_READY: "定位就绪",
  HELP_SENT: "求助已发出",
});

const EN = Object.freeze({
  TITLE: "Workout Help",
  COUNTDOWN_LABEL: "s to auto contact",
  ONLINE: "Online",
  OFFLINE: "Offline",
  CANCEL_BTN: "I'm safe",
  CONTACT_BTN: "Contact now",
  PHONE_BTN: "Open phone",
  CONFIRM_TITLE: "Confirm safe?",
  CONFIRM_SUB: "Cancel auto contact and return to guard.",
  QUEUED: "Queued",
  CLOSE: "Close",
  CANCELLED: "Cancelled",
  GPS_READY: "GPS ready",
  HELP_SENT: "Help queued",
});

const i18n = ZH;

function createStoragePort() {
  return { loadOutbox, saveOutbox, loadEventHistory, saveEventHistory };
}

Page({
  state: {
    remaining: 30,
    phoneOnline: true,
    canPhone: false,
    _assistController: null,
    _assistSession: null,
    _geo: null,
    _geoChangeHandler: null,
    _gpsTimeoutId: null,
    _title: null,
    _countdownTrack: null,
    _countdownArc: null,
    _countdown: null,
    _countdownLabel: null,
    _connLabel: null,
    _cancelBtn: null,
    _contactBtn: null,
    _phoneBtn: null,
    _confirmDialog: null,
    _confirmingSafe: false,
    _leaving: false,
    _helpSending: false,
  },

  onInit(params) {
    const parsed = parseParams(params);
    this.state.phoneOnline = parsed.phoneOnline !== "false";
    this.state.canPhone = parsed.canPhone === "true";
    this._detectPhoneCapability();
  },

  build() {
    createWidget(widget.FILL_RECT, {
      ...Common.SCREEN_STYLE,
      color: Styles.COLORS.BACKGROUND,
    });

    this.state._title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: i18n.TITLE,
    });

    createWidget(widget.FILL_RECT, {
      ...Styles.CONN_PILL_BG_STYLE,
      color: Styles.COLORS.SURFACE,
    });

    this.state._countdownTrack = createWidget(widget.ARC, {
      ...Styles.COUNTDOWN_TRACK_STYLE,
    });

    this.state._countdownArc = createWidget(widget.ARC, {
      ...Styles.COUNTDOWN_RING_STYLE,
      end_angle: this._countdownEndAngle(this.state.remaining),
    });

    this.state._countdown = createWidget(widget.TEXT, {
      ...Styles.COUNTDOWN_STYLE,
      text: "30",
    });

    this.state._countdownLabel = createWidget(widget.TEXT, {
      ...Styles.COUNTDOWN_LABEL_STYLE,
      text: `30${i18n.COUNTDOWN_LABEL}`,
    });
    this.state._countdownLabel.setEnable(false);

    this.state._connLabel = createWidget(widget.TEXT, {
      ...Styles.CONN_LABEL_STYLE,
      color: this.state.phoneOnline ? Styles.COLORS.GREEN : Styles.COLORS.ORANGE,
      text: this.state.phoneOnline ? i18n.ONLINE : i18n.OFFLINE,
    });

    this.state._cancelBtn = createWidget(widget.BUTTON, {
      ...Styles.CANCEL_BTN_STYLE,
      text: i18n.CANCEL_BTN,
      click_func: () => this._onCancelTap(),
    });

    this.state._contactBtn = createWidget(widget.BUTTON, {
      ...Styles.HELP_BTN_STYLE,
      text: i18n.CONTACT_BTN,
      click_func: () => this._onHelpNow(),
    });

    if (this.state.canPhone) {
      this.state._phoneBtn = createWidget(widget.BUTTON, {
        ...Styles.PHONE_BTN_STYLE,
        text: i18n.PHONE_BTN,
        click_func: () => this._onPhoneCall(),
      });
    }

    this._createConfirmDialog();

    this._startAssistFlow();
  },

  _createConfirmDialog() {
    try {
      this.state._confirmDialog = createModal({
        content: i18n.CONFIRM_TITLE,
        subtitle: i18n.CONFIRM_SUB,
        autoHide: false,
        show: false,
        onClick: (keyObj) => {
          if (keyObj?.type === MODAL_CONFIRM) {
            this._onConfirmCancel();
          } else {
            this._hideConfirmDialog();
            this._onAbortCancel();
          }
        },
      });
    } catch {
      this.state._confirmDialog = null;
    }
  },

  _detectPhoneCapability() {
    try {
      const router = require("@zos/router");
      if (typeof router.checkSystemApp !== "function" || router.SYSTEM_APP_PHONE == null) {
        return;
      }
      const result = router.checkSystemApp({ appId: router.SYSTEM_APP_PHONE });
      if (result === true || result?.available === true) {
        this.state.canPhone = true;
      }
    } catch {}
  },

  _startAssistFlow() {
    this.state._assistSession = createAssistSession({
      storage: createStoragePort(),
      now: () => Date.now(),
      trigger: "manual",
    });

    this.state._assistController = createAssistController({
      now: () => Date.now(),
      setTimeout: (fn, ms) => setTimeout(fn, ms),
      clearTimeout: (id) => clearTimeout(id),
      onCountdownChange: (remaining) => {
        this.state.remaining = remaining;
        this._updateCountdownDisplay();
      },
      onHelpSent: (payload) => this._onHelpSent(payload),
      onLocationAvailable: (lat, lng) => this._onLocationAvailable(lat, lng),
      onCancelled: () => this._finishCancelled(),
    });

    this.state._assistController.start();
  },

  _startGps() {
    if (this.state._geo || this.state._gpsTimeoutId != null) return;

    try {
      const sensor = require("@zos/sensor");
      const Geolocation = sensor.Geolocation;
      if (!Geolocation) return;

      const geo = new Geolocation();
      this.state._geo = geo;

      const onChange = () => {
        const position = this._readPosition();
        if (!position) return;
        if (this.state._assistController) {
          this.state._assistController.locationUpdate(position.lat, position.lng);
        }
        this._setWidgetText(this.state._connLabel, i18n.GPS_READY);
        this._stopGps();
      };

      if (typeof geo.start === "function") geo.start();
      if (typeof geo.onChange === "function") geo.onChange(onChange);
      this.state._geoChangeHandler = onChange;
      this.state._gpsTimeoutId = setTimeout(() => this._stopGps(), 15000);
    } catch {
      this._stopGps();
    }
  },

  _readPosition() {
    const geo = this.state._geo;
    if (!geo) return null;

    try {
      if (typeof geo.getCurrentPosition === "function") {
        const position = geo.getCurrentPosition();
        const lat = Number(position?.latitude ?? position?.lat);
        const lng = Number(position?.longitude ?? position?.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }

      if (typeof geo.getLatitude === "function" && typeof geo.getLongitude === "function") {
        const lat = Number(geo.getLatitude());
        const lng = Number(geo.getLongitude());
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    } catch {}

    return null;
  },

  _stopGps() {
    if (this.state._gpsTimeoutId != null) {
      clearTimeout(this.state._gpsTimeoutId);
      this.state._gpsTimeoutId = null;
    }

    const geo = this.state._geo;
    if (!geo) return;
    try {
      if (typeof geo.offChange === "function" && this.state._geoChangeHandler) {
        try {
          geo.offChange(this.state._geoChangeHandler);
        } catch {
          geo.offChange();
        }
      }
    } catch {}
    try {
      if (typeof geo.stop === "function") geo.stop();
    } catch {}
    this.state._geo = null;
    this.state._geoChangeHandler = null;
  },

  _onHelpSent(payload) {
    this.state._helpSending = false;
    try {
      this.state._assistSession.sendHelp(payload);
    } catch {}
    this._setWidgetText(this.state._connLabel, i18n.QUEUED);
    this._setEnabled(this.state._contactBtn, false);
    this._setWidgetText(this.state._cancelBtn, i18n.CLOSE);
    this._startGps();
  },

  _onLocationAvailable(lat, lng) {
    try {
      this.state._assistSession.sendLocationUpdate(lat, lng);
    } catch {}
  },

  _onCancelTap() {
    const currentState = this.state._assistController?.getState?.();
    if (
      currentState === AssistState.HELP_SENT ||
      currentState === AssistState.CANCELLED ||
      currentState == null
    ) {
      this._finishSafely();
      return;
    }

    this.state._assistController?.cancelRequest();
    this._setEnabled(this.state._cancelBtn, false);
    this._setEnabled(this.state._contactBtn, false);
    this._setEnabled(this.state._phoneBtn, false);
    this._showConfirmDialog();
  },

  _onConfirmCancel() {
    if (this.state._confirmingSafe || this.state._leaving) return;
    this.state._confirmingSafe = true;
    this._hideConfirmDialog();
    if (this.state._assistController) {
      this.state._assistController.confirmCancel();
    } else {
      this._finishCancelled();
    }
  },

  _onAbortCancel() {
    this.state._assistController?.abortCancel();
    this.state._confirmingSafe = false;
    this.state._helpSending = false;
    this._setEnabled(this.state._cancelBtn, true);
    this._setEnabled(this.state._contactBtn, true);
    this._setEnabled(this.state._phoneBtn, true);
  },

  _onHelpNow() {
    if (this.state._helpSending || this.state._leaving) return;
    this.state._helpSending = true;
    this._setEnabled(this.state._contactBtn, false);
    this._setEnabled(this.state._cancelBtn, false);
    this.state._assistController?.helpNow();
  },

  _onPhoneCall() {
    if (this.state._leaving) return;
    try {
      const { launchApp, SYSTEM_APP_PHONE } = require("@zos/router");
      launchApp({ appId: SYSTEM_APP_PHONE });
    } catch {}
  },

  _finishCancelled() {
    this._stopGps();
    this._setWidgetText(this.state._connLabel, i18n.CANCELLED);
    this._setWidgetText(this.state._cancelBtn, i18n.CLOSE);
    this._setEnabled(this.state._cancelBtn, true);
    this._hideConfirmDialog();
    this._leaveAssistPageSoon();
  },

  _updateCountdownDisplay() {
    const remaining = Math.max(0, this.state.remaining);
    this._setWidgetText(this.state._countdown, String(remaining));
    this._setWidgetText(this.state._countdownLabel, remaining > 0 ? `${remaining}${i18n.COUNTDOWN_LABEL}` : i18n.HELP_SENT);
    if (this.state._countdownArc) {
      try {
        this.state._countdownArc.setProperty(prop.MORE, {
          end_angle: this._countdownEndAngle(remaining),
          color: remaining <= 10 ? Styles.COLORS.RED : Styles.COLORS.ORANGE,
        });
      } catch {}
    }
  },

  _countdownEndAngle(remaining) {
    const progress = Math.max(0, Math.min(30, remaining)) / 30;
    return Math.round(-90 + progress * 360);
  },

  _setWidgetText(target, text) {
    if (!target) return;
    try {
      target.setProperty(prop.MORE, { text });
    } catch {}
  },

  _setEnabled(target, enabled) {
    if (!target) return;
    try {
      target.setEnable(enabled);
    } catch {
      try {
        target.setProperty(prop.MORE, { enable: enabled });
      } catch {}
    }
  },

  _showConfirmDialog() {
    try {
      this.state._confirmDialog?.show?.(true);
    } catch {
      this._onConfirmCancel();
    }
  },

  _hideConfirmDialog() {
    try {
      this.state._confirmDialog?.show?.(false);
    } catch {}
  },

  _finishSafely() {
    this._stopGps();
    this._leaveAssistPageSoon();
  },

  _leaveAssistPageSoon() {
    if (this.state._leaving) return;
    this.state._leaving = true;
    setTimeout(() => this._leaveAssistPage(), 0);
  },

  _leaveAssistPage() {
    try {
      const router = require("@zos/router");
      if (typeof router.replace === "function") {
        router.replace({ url: "/page/home/home" });
        return;
      }
      if (typeof router.push === "function") {
        router.push({ url: "/page/home/home" });
        return;
      }
      if (typeof router.back === "function") {
        router.back();
        return;
      }
      if (typeof router.finish === "function") {
        router.finish();
      }
    } catch (e) {
      console.log("Assist leave failed: " + (e.message || String(e)));
    }
  },

  onDestroy() {
    if (this.state._assistController) {
      this.state._assistController.destroy();
      this.state._assistController = null;
    }
    this._stopGps();
  },
});
