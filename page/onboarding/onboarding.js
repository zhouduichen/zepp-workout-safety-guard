/**
 * onboarding.js — First-run onboarding flow.
 *
 * Explains capabilities and limitations of the safety guard,
 * requests background-service permission, runs a practice alert,
 * then transitions to the home dashboard.
 */

import { createWidget, deleteWidget, widget, event, prop } from "@zos/ui";
import * as Styles from "zosLoader:./onboarding.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";
import { push } from "@zos/router";
import { px } from "@zos/utils";
import { LocalStorage } from "@zos/storage";

// ---------------------------------------------------------------------------
// Localization copy
// ---------------------------------------------------------------------------

const ZH = Object.freeze({
  STEP_LABEL: "第 {0} / 8 步",
  TITLE_1: "运动异常求助辅助",
  BODY_1: "本应用是运动异常求助辅助，不是医疗设备。不能检测心脏骤停或跌倒。如有急症，请立即拨打急救电话。",
  TITLE_2: "权限说明",
  BODY_2: "应用需要后台运行权限，以便在运动期间持续监测。仅用于本地判断，不会在后台上传个人数据。",
  TITLE_3: "GPS 仅在求助时使用",
  BODY_3: "定位仅在您主动打开求助页面时临时获取，不会在后台持续运行。结束后立即关闭。",
  TITLE_4: "需要手机连接",
  BODY_4: "通知紧急联系人需要手表通过蓝牙连接附近的手机。手机不在身边时无法联系联系人。",
  TITLE_5: "离线模式",
  BODY_5: "手机离线时，应用会发出本地警报。恢复连接后自动补发求助通知。",
  TITLE_6: "配置联系人",
  BODY_6: "请在 Zepp App 的设置页面中配置紧急联系人，最多可添加 3 位。未配置联系人时仍可使用本地守护。",
  TITLE_7: "需要完成演练",
  BODY_7: "每次使用前，需要完成一次模拟演练，熟悉求助、取消和立即联系操作。演练不会联系任何人。",
  TITLE_8: "模拟演练",
  BODY_8_PRACTICE: "这是模拟演练。下面的倒计时模拟求助等待。",
  COUNTDOWN_LABEL: "演练倒计时",
  CANCEL_BTN: "点此取消",
  CONTACT_BTN: "演练：联系家人",
  GRANT_PERMISSION: "授权后台权限",
  PERMISSION_GRANTED: "后台权限已授权",
  NEXT_BTN: "下一步",
  START_BTN: "开始演练",
  DONE_BTN: "完成并开启守护",
  PERMISSION_PROMPT: "请授权后台运行权限以开启自动守护",
});

const EN = Object.freeze({
  STEP_LABEL: "Step {0} / 8",
  TITLE_1: "Movement Anomaly Assistance",
  BODY_1: "This app provides movement anomaly assistance. It is not a medical device and cannot detect cardiac arrest or falls. If you have a medical emergency, call emergency services immediately.",
  TITLE_2: "Permission Notice",
  BODY_2: "This app needs background running permission to monitor during workouts. Data is processed locally and not uploaded in the background.",
  TITLE_3: "GPS Usage",
  BODY_3: "GPS runs only when you actively open the assistance page. It stops immediately afterward and never runs in the background.",
  TITLE_4: "Phone Connection Required",
  BODY_4: "Notifying emergency contacts requires the watch to be connected to a nearby phone via Bluetooth. Contacts cannot be reached when the phone is not nearby.",
  TITLE_5: "Offline Mode",
  BODY_5: "When offline, the app alerts locally. Notifications are replayed automatically when connectivity is restored.",
  TITLE_6: "Configure Contacts",
  BODY_6: "Configure up to 3 emergency contacts in the Zepp App settings page. Local monitoring still works without contacts.",
  TITLE_7: "Training Required",
  BODY_7: "A practice drill is required before enabling the guard. It will not contact anyone.",
  TITLE_8: "Practice Drill",
  BODY_8_PRACTICE: "This is a practice drill. The countdown simulates the assistance waiting period.",
  COUNTDOWN_LABEL: "Practice Countdown",
  CANCEL_BTN: "Tap to Cancel",
  CONTACT_BTN: "Drill: Contact Family",
  GRANT_PERMISSION: "Grant Background Permission",
  PERMISSION_GRANTED: "Background Permission Granted",
  NEXT_BTN: "Next",
  START_BTN: "Start Drill",
  DONE_BTN: "Done & Enable Guard",
  PERMISSION_PROMPT: "Grant background permission to enable auto guard",
});

// Use Chinese as default
const i18n = ZH;

// ---------------------------------------------------------------------------
// Onboarding step definitions
// ---------------------------------------------------------------------------

const STEPS = [
  { title: i18n.TITLE_1, body: i18n.BODY_1 },
  { title: i18n.TITLE_2, body: i18n.BODY_2 },
  { title: i18n.TITLE_3, body: i18n.BODY_3 },
  { title: i18n.TITLE_4, body: i18n.BODY_4 },
  { title: i18n.TITLE_5, body: i18n.BODY_5 },
  { title: i18n.TITLE_6, body: i18n.BODY_6 },
  { title: i18n.TITLE_7, body: i18n.BODY_7 },
  // Step 8 is the practice drill (special rendering)
];

const TOTAL_STEPS = 8;
const PRACTICE_DURATION_SEC = 30;

Page({
  state: {
    currentStep: 0,
    practiceSecondsRemaining: PRACTICE_DURATION_SEC,
    permissionGranted: false,
    trainingComplete: false,
    isPracticeRunning: false,
    practiceTimer: null,
    widgets: {
      pageIndicator: null,
      title: null,
      body: null,
      countdown: null,
      countdownLabel: null,
      btnPrimary: null,
      btnCancel: null,
    },
  },

  build() {
    // Read trainingComplete and permissionGranted from localStorage
    const localStorage = new LocalStorage();
    const storedTraining = localStorage.getItem("trainingComplete", false);
    this.state.trainingComplete = storedTraining === true || storedTraining === "true";

    // Check if background permission was already granted from previous session
    this.state.permissionGranted = false; // will be rechecked via queryPermission

    this.createUI();
  },

  createUI() {
    // Destroy existing UI widgets before re-creating
    this.destroyUI();

    const s = this.state;

    // Page indicator
    s.widgets.pageIndicator = createWidget(widget.TEXT, {
      ...Styles.PAGE_INDICATOR_STYLE,
      text: this.formatStepLabel(s.currentStep),
    });

    if (s.currentStep < TOTAL_STEPS - 1) {
      // Regular info step
      const step = STEPS[s.currentStep];

      s.widgets.title = createWidget(widget.TEXT, {
        ...Styles.TITLE_STYLE,
        text: step.title,
      });
      s.widgets.title.setEnable(false);

      s.widgets.body = createWidget(widget.TEXT, {
        ...Styles.BODY_STYLE,
        text: step.body,
      });
      s.widgets.body.setEnable(false);

      // Next button
      s.widgets.btnPrimary = createWidget(widget.TEXT, {
        ...Styles.BTN_PRIMARY_STYLE,
        text: i18n.NEXT_BTN,
      });
      s.widgets.btnPrimary.addEventListener(event.CLICK_UP, () => {
        this.goToNextStep();
      });

      // No cancel button on regular steps
    } else {
      // Step 8: Practice drill step with countdown and buttons
      // We render either the "ready" state or the "running" state
      if (!s.isPracticeRunning) {
        this.renderPracticeReady();
      } else {
        this.renderPracticeRunning();
      }
    }
  },

  renderPracticeReady() {
    const s = this.state;

    s.widgets.title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: i18n.TITLE_8,
    });
    s.widgets.title.setEnable(false);

    s.widgets.body = createWidget(widget.TEXT, {
      ...Styles.BODY_STYLE,
      text: i18n.BODY_8_PRACTICE,
    });
    s.widgets.body.setEnable(false);

    // Show permission grant button if not granted
    if (!s.permissionGranted) {
      s.widgets.btnPrimary = createWidget(widget.TEXT, {
        ...Styles.BTN_PRIMARY_STYLE,
        text: i18n.GRANT_PERMISSION,
      });
      s.widgets.btnPrimary.addEventListener(event.CLICK_UP, () => {
        this.requestBackgroundPermission();
      });
    } else {
      s.widgets.btnPrimary = createWidget(widget.TEXT, {
        ...Styles.BTN_PRIMARY_STYLE,
        text: i18n.START_BTN,
      });
      s.widgets.btnPrimary.addEventListener(event.CLICK_UP, () => {
        this.startPracticeDrill();
      });
    }
  },

  renderPracticeRunning() {
    const s = this.state;

    // Large countdown
    s.widgets.countdown = createWidget(widget.TEXT, {
      ...Styles.COUNTDOWN_STYLE,
      text: String(s.practiceSecondsRemaining),
    });
    s.widgets.countdown.setEnable(false);

    s.widgets.countdownLabel = createWidget(widget.TEXT, {
      ...Styles.COUNTDOWN_LABEL_STYLE,
      text: i18n.COUNTDOWN_LABEL,
    });
    s.widgets.countdownLabel.setEnable(false);

    // Cancel button
    s.widgets.btnCancel = createWidget(widget.TEXT, {
      ...Styles.BTN_CANCEL_STYLE,
      text: i18n.CANCEL_BTN,
    });
    s.widgets.btnCancel.addEventListener(event.CLICK_UP, () => {
      this.cancelPracticeDrill();
    });

    // Contact button (practice, never actually sends)
    s.widgets.btnPrimary = createWidget(widget.TEXT, {
      ...Styles.BTN_PRIMARY_STYLE,
      text: i18n.CONTACT_BTN,
    });
    s.widgets.btnPrimary.addEventListener(event.CLICK_UP, () => {
      // In practice mode, simulate contact without actually sending
      this.completePracticeDrill();
    });
  },

  formatStepLabel(step) {
    return i18n.STEP_LABEL.replace("{0}", String(step + 1));
  },

  goToNextStep() {
    const s = this.state;
    if (s.currentStep < TOTAL_STEPS - 1) {
      s.currentStep++;
      this.createUI();
    }
  },

  startPracticeDrill() {
    const s = this.state;
    s.isPracticeRunning = true;
    s.practiceSecondsRemaining = PRACTICE_DURATION_SEC;

    this.createUI();

    // Start countdown timer
    s.practiceTimer = setInterval(() => {
      s.practiceSecondsRemaining--;
      if (s.practiceSecondsRemaining <= 0) {
        // Practice countdown expired — treat as completed
        clearInterval(s.practiceTimer);
        s.practiceTimer = null;
        // Store training complete (user went through the full drill)
        this.storeTrainingComplete();
        this.navigateToHome();
        return;
      }

      // Update countdown display
      if (s.widgets.countdown) {
        s.widgets.countdown.setProperty(prop.MORE, {
          text: String(s.practiceSecondsRemaining),
        });
      }
    }, 1000);
  },

  cancelPracticeDrill() {
    const s = this.state;
    if (s.practiceTimer) {
      clearInterval(s.practiceTimer);
      s.practiceTimer = null;
    }
    s.isPracticeRunning = false;

    // Store training complete (user cancelled but was shown the interaction)
    this.storeTrainingComplete();

    // Show done button
    this.renderPracticeComplete();
  },

  completePracticeDrill() {
    const s = this.state;
    if (s.practiceTimer) {
      clearInterval(s.practiceTimer);
      s.practiceTimer = null;
    }
    s.isPracticeRunning = false;

    // Store training complete
    this.storeTrainingComplete();

    this.renderPracticeComplete();
  },

  renderPracticeComplete() {
    // Clear UI and show completion state
    this.destroyUI();

    const s = this.state;

    s.widgets.pageIndicator = createWidget(widget.TEXT, {
      ...Styles.PAGE_INDICATOR_STYLE,
      text: i18n.STEP_LABEL.replace("{0}", "8"),
    });

    s.widgets.title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: i18n.TITLE_8,
    });
    s.widgets.title.setEnable(false);

    s.widgets.body = createWidget(widget.TEXT, {
      ...Styles.BODY_STYLE,
      text: i18n.PERMISSION_GRANTED + "\n" + (s.trainingComplete ? "演练已完成" : ""),
    });
    s.widgets.body.setEnable(false);

    s.widgets.btnPrimary = createWidget(widget.TEXT, {
      ...Styles.BTN_PRIMARY_STYLE,
      text: i18n.DONE_BTN,
    });
    s.widgets.btnPrimary.addEventListener(event.CLICK_UP, () => {
      this.startGuardService();
    });

    // Also provide a cancel for users who want to go to home without starting
    s.widgets.btnCancel = createWidget(widget.TEXT, {
      ...Styles.BTN_CANCEL_STYLE,
      text: "稍后再说",
    });
    s.widgets.btnCancel.addEventListener(event.CLICK_UP, () => {
      this.navigateToHome();
    });
  },

  requestBackgroundPermission() {
    const s = this.state;

    try {
      // Use @zos/app-service for permission flow
      const appService = require("@zos/app-service");

      // First query if permission is already granted
      const status = appService.queryPermission("device:os.bg_service");
      if (status === "granted" || status === true) {
        s.permissionGranted = true;
        this.createUI();
        return;
      }

      // Request permission
      const result = appService.requestPermission("device:os.bg_service");
      if (result === "granted" || result === true) {
        s.permissionGranted = true;
        this.createUI();
      } else {
        // Permission denied — show prompt and stay on same step
        if (s.widgets.body) {
          s.widgets.body.setProperty(prop.MORE, {
            text: i18n.PERMISSION_PROMPT,
          });
        }
      }
    } catch (e) {
      console.log("Permission request failed: " + (e.message || String(e)));
      // If app-service module is not available, treat as granted for development
      s.permissionGranted = true;
      this.createUI();
    }
  },

  storeTrainingComplete() {
    if (this.state.trainingComplete) return; // already stored

    this.state.trainingComplete = true;
    try {
      const localStorage = new LocalStorage();
      localStorage.setItem("trainingComplete", "true");
    } catch (e) {
      console.log("Failed to store trainingComplete: " + (e.message || String(e)));
    }
  },

  startGuardService() {
    try {
      const appService = require("@zos/app-service");
      // Start the background guard service
      appService.start({
        serviceId: "guard-service",
        params: JSON.stringify({ source: "onboarding" }),
      });
    } catch (e) {
      console.log("Failed to start guard service: " + (e.message || String(e)));
    }

    this.navigateToHome();
  },

  navigateToHome() {
    try {
      push({ url: "/page/home/home" });
    } catch (e) {
      console.log("Navigation failed: " + (e.message || String(e)));
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
    // Clean up timer if page is being destroyed
    const s = this.state;
    if (s.practiceTimer) {
      clearInterval(s.practiceTimer);
      s.practiceTimer = null;
    }
    this.destroyUI();
  },
});
