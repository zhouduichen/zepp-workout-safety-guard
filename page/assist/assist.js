import { createWidget, widget, prop, align, text_style } from "@zos/ui";
import { px } from "@zos/utils";
import * as Styles from "zosLoader:./assist.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";

Page({
  state: {
    remaining: 30,
    stateText: "COUNTDOWN",
    phoneOnline: true,
    canPhone: false,
  },

  onInit(params) {
    // Parse optional params: phoneOnline (string "true"/"false")
    const parsed = params ? JSON.parse(params) : {}
    this.state.phoneOnline = parsed.phoneOnline !== "false"
    this.state.canPhone = parsed.canPhone === "true"
  },

  build() {
    // ---- Background ----
    createWidget(widget.FILL_RECT, {
      ...Common.SCREEN_STYLE,
      color: 0x1a1a2e,
    });

    // ---- Title ----
    let title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: "运动异常守护",
    });
    this.state._title = title;

    // ---- Large countdown ----
    let countdown = createWidget(widget.TEXT, {
      ...Styles.COUNTDOWN_STYLE,
      text: "30",
    });
    this.state._countdown = countdown;

    // ---- Connection state label ----
    let connLabel = createWidget(widget.TEXT, {
      ...Styles.CONN_LABEL_STYLE,
      text: this.state.phoneOnline ? "手机在线" : "离线仅本地警报",
    });
    this.state._connLabel = connLabel;

    // ---- Cancel button (left) ----
    let cancelBtn = createWidget(widget.BUTTON, {
      ...Styles.CANCEL_BTN_STYLE,
      text: "取消求助",
      click_func: () => this._onCancelTap(),
    });
    this.state._cancelBtn = cancelBtn;

    // ---- Contact family now button (right) ----
    let contactBtn = createWidget(widget.BUTTON, {
      ...Styles.HELP_BTN_STYLE,
      text: "立即联系家人",
      click_func: () => this._onHelpNow(),
    });
    this.state._contactBtn = contactBtn;

    // ---- Phone call button (conditionally shown) ----
    if (this.state.canPhone) {
      let phoneBtn = createWidget(widget.BUTTON, {
        ...Styles.PHONE_BTN_STYLE,
        text: "打开电话呼叫急救",
        click_func: () => this._onPhoneCall(),
      });
      this.state._phoneBtn = phoneBtn;
    }

    // ---- Cancel confirmation area (hidden initially) ----
    let confirmWrapper = createWidget(widget.TEXT, {
      ...Styles.CONFIRM_PROMPT_STYLE,
      text: "",
    });
    this.state._confirmWrapper = confirmWrapper;
    confirmWrapper.setEnable(false);

    let confirmYesBtn = createWidget(widget.BUTTON, {
      ...Styles.CONFIRM_YES_STYLE,
      text: "确认安全",
      click_func: () => this._onConfirmCancel(),
    });
    confirmYesBtn.setEnable(false);
    this.state._confirmYesBtn = confirmYesBtn;

    let confirmNoBtn = createWidget(widget.BUTTON, {
      ...Styles.CONFIRM_NO_STYLE,
      text: "返回",
      click_func: () => this._onAbortCancel(),
    });
    confirmNoBtn.setEnable(false);
    this.state._confirmNoBtn = confirmNoBtn;

    // Start initial countdown display
    this._updateCountdownDisplay();
  },

  _onCancelTap() {
    // Two-step cancellation: first tap shows confirmation
    this.state._cancelBtn.setProperty(prop.MORE, { enable: false });
    this.state._confirmWrapper.setProperty(prop.MORE, { text: "确认取消求助？" });
    this.state._confirmWrapper.setEnable(true);
    this.state._confirmYesBtn.setEnable(true);
    this.state._confirmNoBtn.setEnable(true);

    // Freeze countdown display
  },

  _onConfirmCancel() {
    // Confirm cancellation - close page
    this.state._cancelBtn.setProperty(prop.MORE, { enable: true });
    this.state._confirmWrapper.setEnable(false);
    this.state._confirmYesBtn.setEnable(false);
    this.state._confirmNoBtn.setEnable(false);

    // Navigate back
    const { finish } = require("@zos/router");
    finish();
  },

  _onAbortCancel() {
    // Abort cancellation - return to normal
    this.state._cancelBtn.setProperty(prop.MORE, { enable: true });
    this.state._confirmWrapper.setEnable(false);
    this.state._confirmYesBtn.setEnable(false);
    this.state._confirmNoBtn.setEnable(false);
  },

  _onHelpNow() {
    // Navigate back - help already enqueued by assist-controller
  },

  _onPhoneCall() {
    const { launchApp, SYSTEM_APP_PHONE } = require("@zos/router");
    launchApp({ appId: SYSTEM_APP_PHONE });
  },

  _updateCountdownDisplay() {
    // Overridden by assist-controller integration
  },

  onDestroy() {
    // GPS and timer cleanup happens in the assist controller
  },
});
