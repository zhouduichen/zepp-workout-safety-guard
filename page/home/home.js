import { createWidget, widget, event, prop } from "@zos/ui";
import * as Styles from "zosLoader:./home.[pf].layout.js";
import * as Common from "zosLoader:./../common.[pf].layout.js";
import { px } from "@zos/utils";

Page({
  state: {},

  build() {
    // Title: 运动异常守护
    let title = createWidget(widget.TEXT, {
      ...Styles.TITLE_STYLE,
      text: "运动异常守护",
    });
    title.setEnable(false);

    // Label: Development skeleton
    let label = createWidget(widget.TEXT, {
      ...Styles.LABEL_STYLE,
      text: "Development skeleton",
    });
    label.setEnable(false);
  },
});
