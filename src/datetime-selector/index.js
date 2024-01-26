import { getEl, createElement } from "dom-utils";
import {
  createDate,
  formatDateTime,
  dFormatter,
  getParsedDate,
} from "date-utils";
import { defined } from "utils";

import DateTimeSelectorNav from "./datetime-selector-nav";
import DateTimeSelectorPortal from "./datetime-selector-portal";

import "./variables.scss";
import "./style.scss";

export default class DateTimeSelector {
  constructor(el, opts) {
    this.$el = getEl(el);

    if (!this.$el) return;

    this.$nav = createElement({ className: "air-dts air-dts--navigation" });
    this.$el.appendChild(this.$nav);

    this.opts = opts;
    this.portalState = null;

    if (!this.opts.includeDates || !this.opts.includeDates.length) {
      return;
    }

    // includeDates should be an array of dates
    this.includeDates = this.opts.includeDates.map((date) => createDate(date));

    // sort dates earliest to latest
    this.includeDates.sort((a, b) => a.getTime() - b.getTime());

    // min date
    this.minDate = this.includeDates[0];

    // max date
    this.maxDate = this.includeDates[this.includeDates.length - 1];

    const { selectedDate } = this.opts;

    if (selectedDate) {
      const selectedDateObj = createDate(selectedDate);

      // check if selectedDate exist in includeDates
      const exists = this.includeDates.find(
        (date) => date.getTime() === selectedDateObj.getTime()
      );

      if (exists) {
        this.selectedDate = selectedDateObj;
      } else {
        this.selectedDate = null;
      }
    } else {
      this.selectedDate = this.includeDates[this.includeDates.length - 1];
    }

    // initialize
    this.init();
  }

  init() {
    this._createComponents();
  }

  closePortal = () => {
    this.portal.hide();
  };

  _createComponents() {
    let { opts } = this;
    let dts = this;

    this.nav = new DateTimeSelectorNav(dts, {
      includeDates: this.includeDates,
      selectedDate: this.selectedDate,
      dateFormat: opts.dateFormat,
    });

    this.$nav.appendChild(this.nav.$el);

    this.portal = new DateTimeSelectorPortal(dts, {
      onSelect: this.opts.onSelect,
      dateFormat: opts.dateFormat,
      offset: 2,
    });
  }

  formatDate(date = this.selectedDate) {
    const { dateFormat } = this.opts;

    const formatedDate = defined(dateFormat)
      ? dFormatter(date, dateFormat.currentTime, dateFormat.asPeriod)
      : formatDateTime(date);

    return formatedDate;
  }

  // toggle selector on and off
  toggleSelector() {
    this.portal.toggleVisibility();
  }

  // go to previous time
  prevTime() {
    const currentTimeIndex = this._getCurrentTimeIndex();

    if (currentTimeIndex === 0) return;

    this.updateSelectedDate(this.includeDates[currentTimeIndex - 1]);
  }

  updateSelectedDate(date) {
    this.selectedDate = date;

    this.nav.update();

    if (this.opts.onSelect) {
      this.opts.onSelect(this.selectedDate);
    }

    if (this.portal && this.portal.visible) {
      this.portal.hide();
    }
  }

  // go to next time
  nextTime() {
    const currentTimeIndex = this._getCurrentTimeIndex();

    if (currentTimeIndex === this.includeDates.length - 1) return;

    this.updateSelectedDate(this.includeDates[currentTimeIndex + 1]);
  }

  _getCurrentTimeIndex = () => {
    const { includeDates, selectedDate } = this;

    return includeDates.findIndex(
      (d) => d.getTime() === createDate(selectedDate).getTime()
    );
  };

  render() {}

  get parsedSelectedDate() {
    return getParsedDate(this.selectedDate);
  }

  get portalStateDate() {
    if (!this.portalState) return;

    const { year, month } = this.portalState;

    if (year && month) {
      return createDate(`${year}-${month}-01`);
    }

    if (year) {
      return createDate(`${year}-01-01`);
    }

    return;
  }
}
