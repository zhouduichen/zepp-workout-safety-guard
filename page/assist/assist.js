import { createWidget, widget, prop } from "@zos/ui";
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
    _countdown: null,
    _connLabel: null,
    _cancelBtn: null,
    _contactBtn: null,
    _phoneBtn: null,
    _confirmWrapper: null,
    _confirmYesBtn: null,
    _confirmNoBtn: null,
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
      color: 0x1a1a2e,
    });

    this.state._title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: "Workout anomaly help",
    });

    this.state._countdown = createWidget(widget.TEXT, {
      ...Styles.COUNTDOWN_STYLE,
      text: "30",
    });

    this.state._connLabel = createWidget(widget.TEXT, {
      ...Styles.CONN_LABEL_STYLE,
      text: this.state.phoneOnline ? "Phone online" : "Offline local alert only",
    });

    this.state._cancelBtn = createWidget(widget.BUTTON, {
      ...Styles.CANCEL_BTN_STYLE,
      text: "Cancel request",
      click_func: () => this._onCancelTap(),
    });

    this.state._contactBtn = createWidget(widget.BUTTON, {
      ...Styles.HELP_BTN_STYLE,
      text: "Contact now",
      click_func: () => this._onHelpNow(),
    });

    if (this.state.canPhone) {
      this.state._phoneBtn = createWidget(widget.BUTTON, {
        ...Styles.PHONE_BTN_STYLE,
        text: "Open phone",
        click_func: () => this._onPhoneCall(),
      });
    }

    this.state._confirmWrapper = createWidget(widget.TEXT, {
      ...Styles.CONFIRM_PROMPT_STYLE,
      text: "",
    });
    this.state._confirmWrapper.setEnable(false);

    this.state._confirmYesBtn = createWidget(widget.BUTTON, {
      ...Styles.CONFIRM_YES_STYLE,
      text: "Confirm safe",
      click_func: () => this._onConfirmCancel(),
    });
    this.state._confirmYesBtn.setEnable(false);

    this.state._confirmNoBtn = createWidget(widget.BUTTON, {
      ...Styles.CONFIRM_NO_STYLE,
      text: "Back",
      click_func: () => this._onAbortCancel(),
    });
    this.state._confirmNoBtn.setEnable(false);

    this._startAssistFlow();
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
        this._setWidgetText(this.state._connLabel, "Location captured");
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
    try {
      this.state._assistSession.sendHelp(payload);
    } catch {}
    this._setWidgetText(this.state._connLabel, "Help queued");
    this._setEnabled(this.state._contactBtn, false);
    this._setWidgetText(this.state._cancelBtn, "Close");
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
    this._setWidgetText(this.state._confirmWrapper, "Confirm you are safe?");
    this.state._confirmWrapper.setEnable(true);
    this.state._confirmYesBtn.setEnable(true);
    this.state._confirmNoBtn.setEnable(true);
  },

  _onConfirmCancel() {
    if (this.state._assistController) {
      this.state._assistController.confirmCancel();
    } else {
      this._finishCancelled();
    }
  },

  _onAbortCancel() {
    this.state._assistController?.abortCancel();
    this._setEnabled(this.state._cancelBtn, true);
    this.state._confirmWrapper.setEnable(false);
    this.state._confirmYesBtn.setEnable(false);
    this.state._confirmNoBtn.setEnable(false);
  },

  _onHelpNow() {
    this.state._assistController?.helpNow();
  },

  _onPhoneCall() {
    try {
      const { launchApp, SYSTEM_APP_PHONE } = require("@zos/router");
      launchApp({ appId: SYSTEM_APP_PHONE });
    } catch {}
  },

  _finishCancelled() {
    this._stopGps();
    this._setWidgetText(this.state._connLabel, "Request cancelled");
    this._setWidgetText(this.state._cancelBtn, "Close");
    this._setEnabled(this.state._cancelBtn, true);
    this.state._confirmWrapper?.setEnable(false);
    this.state._confirmYesBtn?.setEnable(false);
    this.state._confirmNoBtn?.setEnable(false);
    this._leaveAssistPage();
  },

  _updateCountdownDisplay() {
    this._setWidgetText(this.state._countdown, String(Math.max(0, this.state.remaining)));
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

  _finishSafely() {
    this._stopGps();
    this._leaveAssistPage();
  },

  _leaveAssistPage() {
    try {
      const router = require("@zos/router");
      if (typeof router.back === "function") {
        router.back();
        return;
      }
      if (typeof router.replace === "function") {
        router.replace({ url: "/page/home/home" });
        return;
      }
      if (typeof router.finish === "function") {
        router.finish();
        return;
      }
      if (typeof router.push === "function") {
        router.push({ url: "/page/home/home" });
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
