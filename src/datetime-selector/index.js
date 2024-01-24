import { getEl, createElement } from "utils";

import DateTimeSelectorNav from "./datetime-selector-nav";
import DateTimeSelectorPortal from "./datetime-selector-portal";

import "./dateTimeSelectorVars.scss";
import "./dateTimeSelector.scss";

export default class DateTimeSelector {
  constructor(el, opts) {
    this.$el = getEl(el);

    if (!this.$el) return;

    this.$nav = createElement({ className: "air-dts air-dts--navigation" });
    this.$el.appendChild(this.$nav);

    this.opts = opts;

    this.init();
  }

  init() {
    this._createComponents();

    this._bindEvents();
  }

  closePortal = () => {
    this.portal.hide();
  };

  _createComponents() {
    let { opts } = this;
    let dts = this;

    this.nav = new DateTimeSelectorNav({ dts, opts });
    this.$nav.appendChild(this.nav.$el);

    // NOTE: Fix getting offest from options
    opts = { ...opts, offset: 2 };

    this.portal = new DateTimeSelectorPortal({ dts, opts });
  }

  _bindEvents() {
    this.$nav.addEventListener("blur", this._onBlur);
  }

  _onBlur = (e) => {
    console.log("blur");
  };

  formatDate(date = this.selectedDate, string) {
    return "2024-01-01 00:00 AM";
  }

  // toggle selector on and off
  toggleSelector() {
    this.portal.toggleVisibility();
  }

  // go to previous time
  prevTime() {
    console.log("prevTime");
  }

  // go to next time
  nextTime() {
    console.log("nextTime");
  }

  render() {}
}
