/**
 * onboarding.js - First-run onboarding flow.
 *
 * Explains capabilities and limitations, requests background-service
 * permission, runs a practice drill, then transitions to the home dashboard.
 */

import { createWidget, deleteWidget, widget, prop } from "@zos/ui";
import * as Styles from "zosLoader:./onboarding.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";
import { push } from "@zos/router";
import { LocalStorage } from "@zos/storage";

const i18n = Object.freeze({
  STEP_LABEL: "Step {0} / 8",
  TITLE_1: "Movement anomaly assistance",
  BODY_1: "This guard helps during workouts. It is not a medical device and cannot detect emergencies.",
  TITLE_2: "Background permission",
  BODY_2: "Background access keeps the guard active during workouts. Processing stays local on the watch.",
  TITLE_3: "GPS only on help page",
  BODY_3: "Location starts only after you open the help page and stops once the request flow ends.",
  TITLE_4: "Phone connection",
  BODY_4: "Remote notification needs a nearby connected phone. Offline mode keeps a local alert and queues help.",
  TITLE_5: "Offline replay",
  BODY_5: "If the phone reconnects later, queued help events are replayed once with an idempotent event ID.",
  TITLE_6: "Contact setup",
  BODY_6: "Contacts live on the phone side. The watch only shows how many contacts are configured.",
  TITLE_7: "Practice required",
  BODY_7: "A short drill teaches cancel and contact actions before enabling the guard.",
  TITLE_8: "Practice drill",
  BODY_8_PRACTICE: "This is a local simulation. It will not contact anyone.",
  COUNTDOWN_LABEL: "Practice countdown",
  CANCEL_BTN: "Cancel drill",
  CONTACT_BTN: "Drill contact",
  GRANT_PERMISSION: "Grant background access",
  NEXT_BTN: "Next",
  START_BTN: "Start drill",
  DONE_BTN: "Enable guard",
  PERMISSION_PROMPT: "Grant background permission to enable auto guard.",
});

const STEPS = [
  { title: i18n.TITLE_1, body: i18n.BODY_1 },
  { title: i18n.TITLE_2, body: i18n.BODY_2 },
  { title: i18n.TITLE_3, body: i18n.BODY_3 },
  { title: i18n.TITLE_4, body: i18n.BODY_4 },
  { title: i18n.TITLE_5, body: i18n.BODY_5 },
  { title: i18n.TITLE_6, body: i18n.BODY_6 },
  { title: i18n.TITLE_7, body: i18n.BODY_7 },
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
    decorations: [],
    widgets: {
      pageIndicator: null,
      title: null,
      body: null,
      countdown: null,
      countdownLabel: null,
      progressArc: null,
      btnPrimary: null,
      btnCancel: null,
    },
  },

  build() {
    const localStorage = new LocalStorage();
    const storedTraining = localStorage.getItem("trainingComplete", false);
    this.state.trainingComplete = storedTraining === true || storedTraining === "true";
    this.state.permissionGranted = false;
    this.createUI();
  },

  createUI() {
    this.destroyUI();
    this.drawBase();

    const s = this.state;
    if (s.currentStep < TOTAL_STEPS - 1) {
      this.drawCard();
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

      s.widgets.btnPrimary = createWidget(widget.BUTTON, {
        ...Styles.BTN_PRIMARY_STYLE,
        text: i18n.NEXT_BTN,
        click_func: () => this.goToNextStep(),
      });
      return;
    }

    if (s.isPracticeRunning) {
      this.renderPracticeRunning();
    } else {
      this.renderPracticeReady();
    }
  },

  drawBase() {
    this._addDecoration(createWidget(widget.FILL_RECT, {
      ...Common.SCREEN_STYLE,
      color: Styles.COLORS.BACKGROUND,
    }));

    this.state.widgets.pageIndicator = createWidget(widget.TEXT, {
      ...Styles.PAGE_INDICATOR_STYLE,
      text: this.formatStepLabel(this.state.currentStep),
    });
    this.state.widgets.pageIndicator.setEnable(false);

    for (let i = 0; i < TOTAL_STEPS; i++) {
      this._addDecoration(createWidget(widget.FILL_RECT, Styles.PROGRESS_DOT_STYLE(
        i,
        i <= this.state.currentStep,
      )));
    }
  },

  drawCard() {
    this._addDecoration(createWidget(widget.FILL_RECT, {
      ...Styles.CARD_STYLE,
      y: Styles.CARD_STYLE.y + 2,
      color: 0x090a0c,
    }));
    this._addDecoration(createWidget(widget.FILL_RECT, {
      ...Styles.CARD_STYLE,
      color: Styles.COLORS.SURFACE,
    }));
  },

  renderPracticeReady() {
    const s = this.state;
    this.drawCard();

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

    if (!s.permissionGranted) {
      s.widgets.btnPrimary = createWidget(widget.BUTTON, {
        ...Styles.BTN_PRIMARY_STYLE,
        normal_color: Styles.COLORS.BLUE,
        press_color: 0x0867c8,
        text: i18n.GRANT_PERMISSION,
        click_func: () => this.requestBackgroundPermission(),
      });
    } else {
      s.widgets.btnPrimary = createWidget(widget.BUTTON, {
        ...Styles.BTN_PRIMARY_STYLE,
        text: i18n.START_BTN,
        click_func: () => this.startPracticeDrill(),
      });
    }
  },

  renderPracticeRunning() {
    const s = this.state;

    this._addDecoration(createWidget(widget.ARC, {
      ...Styles.COUNTDOWN_TRACK_STYLE,
    }));
    s.widgets.progressArc = createWidget(widget.ARC, {
      ...Styles.COUNTDOWN_RING_STYLE,
      end_angle: this.practiceEndAngle(s.practiceSecondsRemaining),
    });

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

    s.widgets.btnCancel = createWidget(widget.BUTTON, {
      ...Styles.BTN_CANCEL_STYLE,
      text: i18n.CANCEL_BTN,
      click_func: () => this.cancelPracticeDrill(),
    });

    s.widgets.btnPrimary = createWidget(widget.BUTTON, {
      ...Styles.BTN_PRIMARY_STYLE,
      normal_color: Styles.COLORS.ORANGE,
      press_color: 0xd88408,
      text: i18n.CONTACT_BTN,
      click_func: () => this.completePracticeDrill(),
    });
  },

  renderPracticeComplete() {
    this.destroyUI();
    this.drawBase();
    this.drawCard();

    const s = this.state;
    s.widgets.title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: i18n.TITLE_8,
    });
    s.widgets.title.setEnable(false);

    s.widgets.body = createWidget(widget.TEXT, {
      ...Styles.BODY_STYLE,
      text: "Practice complete\nGuard can be enabled",
    });
    s.widgets.body.setEnable(false);

    s.widgets.btnPrimary = createWidget(widget.BUTTON, {
      ...Styles.BTN_PRIMARY_STYLE,
      text: i18n.DONE_BTN,
      click_func: () => this.startGuardService(),
    });

    s.widgets.btnCancel = createWidget(widget.BUTTON, {
      ...Styles.BTN_CANCEL_STYLE,
      text: "Later",
      click_func: () => this.navigateToHome(),
    });
  },

  formatStepLabel(step) {
    return i18n.STEP_LABEL.replace("{0}", String(step + 1));
  },

  goToNextStep() {
    if (this.state.currentStep < TOTAL_STEPS - 1) {
      this.state.currentStep++;
      this.createUI();
    }
  },

  startPracticeDrill() {
    const s = this.state;
    s.isPracticeRunning = true;
    s.practiceSecondsRemaining = PRACTICE_DURATION_SEC;
    this.createUI();

    s.practiceTimer = setInterval(() => {
      s.practiceSecondsRemaining--;
      if (s.practiceSecondsRemaining <= 0) {
        clearInterval(s.practiceTimer);
        s.practiceTimer = null;
        this.storeTrainingComplete();
        this.navigateToHome();
        return;
      }

      if (s.widgets.countdown) {
        s.widgets.countdown.setProperty(prop.MORE, {
          text: String(s.practiceSecondsRemaining),
        });
      }
      if (s.widgets.progressArc) {
        s.widgets.progressArc.setProperty(prop.MORE, {
          end_angle: this.practiceEndAngle(s.practiceSecondsRemaining),
          color: s.practiceSecondsRemaining <= 10 ? Styles.COLORS.RED : Styles.COLORS.ORANGE,
        });
      }
    }, 1000);
  },

  practiceEndAngle(remaining) {
    const progress = Math.max(0, Math.min(PRACTICE_DURATION_SEC, remaining)) / PRACTICE_DURATION_SEC;
    return Math.round(-90 + progress * 360);
  },

  cancelPracticeDrill() {
    const s = this.state;
    if (s.practiceTimer) {
      clearInterval(s.practiceTimer);
      s.practiceTimer = null;
    }
    s.isPracticeRunning = false;
    this.storeTrainingComplete();
    this.renderPracticeComplete();
  },

  completePracticeDrill() {
    const s = this.state;
    if (s.practiceTimer) {
      clearInterval(s.practiceTimer);
      s.practiceTimer = null;
    }
    s.isPracticeRunning = false;
    this.storeTrainingComplete();
    this.renderPracticeComplete();
  },

  requestBackgroundPermission() {
    const s = this.state;

    try {
      const appService = require("@zos/app-service");
      const status = appService.queryPermission("device:os.bg_service");
      if (status === "granted" || status === true) {
        s.permissionGranted = true;
        this.createUI();
        return;
      }

      const result = appService.requestPermission("device:os.bg_service");
      if (result === "granted" || result === true) {
        s.permissionGranted = true;
        this.createUI();
      } else if (s.widgets.body) {
        s.widgets.body.setProperty(prop.MORE, {
          text: i18n.PERMISSION_PROMPT,
        });
      }
    } catch (e) {
      console.log("Permission request failed: " + (e.message || String(e)));
      s.permissionGranted = true;
      this.createUI();
    }
  },

  storeTrainingComplete() {
    if (this.state.trainingComplete) return;

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

  _addDecoration(ref) {
    if (ref) this.state.decorations.push(ref);
    return ref;
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
    const s = this.state;
    if (s.practiceTimer) {
      clearInterval(s.practiceTimer);
      s.practiceTimer = null;
    }
    this.destroyUI();
  },
});
