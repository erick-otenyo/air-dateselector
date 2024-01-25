import defaults from "./defaults";
import { createElement, getEl } from "dom-utils";

import {
  createDate,
  getDecade,
  getParsedDate,
  isDateBigger,
  isDateSmaller,
  isSameDate,
  dateFormat,
} from "date-utils";

import { deepCopy, deepMerge } from "utils";

import withEvents from "withEvents";
import consts from "consts";

import DateselectorBody from "./calendar-selector-body";
import DateselectorNav from "./calendar-selector-nav";

import "./style.scss";

let $dateselectorsContainer = "",
  $dateselectorOverlay = "",
  baseTemplate =
    "" +
    '<div class="air-cal--navigation"></div>' +
    '<div class="air-cal--content"></div>';

export default class Dateselector {
  static defaults = defaults;

  constructor(el, opts) {
    this.$el = getEl(el);

    if (!this.$el) return;

    this.$dateselector = createElement({ className: "air-cal" });
    this.opts = deepMerge({}, defaults, opts);

    let { startDate } = this.opts;

    if (!startDate) {
      this.opts.startDate = new Date();
    }

    this.inited = false;

    this.viewDate = createDate(this.opts.startDate);
    this.focusDate = false;
    this.selectedDate = null;
    this.calendarView = null;

    this.init();
  }

  init() {
    let {
      opts: { selectedDate },
    } = this;

    this._handleLocale();
    this._bindSubEvents();

    this._createIncludeDates();
    this._limitViewDateByMaxMinDates();

    this._bindEvents();

    if (selectedDate) {
      this.selectDate(selectedDate, { silent: true });
    }

    this._createComponents();
  }

  _createComponents() {
    let {
      opts,
      opts: { classes },
    } = this;
    let ds = this;

    this._buildBaseHtml();

    this.$dateselector.classList.add("-inline-");

    if (classes) {
      this.$dateselector.classList.add(...classes.split(" "));
    }

    this.calendarView = new DateselectorBody({ ds, opts });

    this.nav = new DateselectorNav({ ds, opts });

    this.$content.appendChild(this.calendarView.$el);
    this.$nav.appendChild(this.nav.$el);
  }

  _destroyComponents() {
    this.calendarView.destroy();
    this.calendarView = false;
    this.nav.destroy();
  }

  _createIncludeDates() {
    let { includeDates } = this.opts;

    if (!includeDates || !includeDates.length) return;

    this.includeDates = includeDates.map((date) => {
      return createDate(date);
    });

    // sort dates
    this.includeDates.sort((a, b) => {
      return a - b;
    });

    //min date
    this.minDate = this.includeDates[0];

    //max date
    this.maxDate = this.includeDates[this.includeDates.length - 1];
  }

  _limitViewDateByMaxMinDates() {
    let { viewDate, minDate, maxDate } = this;

    if (maxDate && isDateBigger(viewDate, maxDate)) {
      this.setViewDate(maxDate);
    }
    if (minDate && isDateSmaller(viewDate, minDate)) {
      this.setViewDate(minDate);
    }
  }

  _bindSubEvents() {
    this.on(consts.eventChangeSelectedDate, this._onChangeSelectedDate);
  }

  _buildBaseHtml() {
    this.$el.appendChild(this.$dateselector);

    this.$dateselector.innerHTML = baseTemplate;

    this.$content = getEl(".air-cal--content", this.$dateselector);
    this.$nav = getEl(".air-cal--navigation", this.$dateselector);
  }

  _handleLocale() {
    let { locale, dateFormat, firstDay, timeFormat } = this.opts;
    this.locale = deepCopy(locale);

    if (dateFormat) {
      this.locale.dateFormat = dateFormat;
    }
    // Allow to remove time from formatted string
    // e.g. if user wants to display mm:hh yyyy MMMM (time first) instead of hardcoded order - 'date time`
    if (timeFormat !== undefined && timeFormat !== "") {
      this.locale.timeFormat = timeFormat;
    }

    if (firstDay !== "") {
      this.locale.firstDay = firstDay;
    }
  }

  _bindEvents() {
    this.$el.addEventListener(this.opts.showEvent, this._onFocus);
    this.$dateselector.addEventListener("mousedown", this._onMouseDown);
    this.$dateselector.addEventListener("mouseup", this._onMouseUp);
    window.addEventListener("resize", this._onResize);
  }

  formatDate(date = this.viewDate, string) {
    date = createDate(date);

    return dateFormat(date, string, this.locale);
  }

  /**
   * Changes month, year, decade to next period
   */
  next = () => {
    let { year, month } = this.parsedViewDate;
    this.setViewDate(new Date(year, month + 1, 1));
  };

  /**
   * Changes month, year, decade to prev period
   */
  prev = () => {
    let { year, month } = this.parsedViewDate;

    this.setViewDate(new Date(year, month - 1, 1));
  };

  down(date) {
    this._handleUpDownActions(date, "down");
  }

  up(date) {
    this._handleUpDownActions(date, "up");
  }

  /**
   * Selects date, if array is passed then selects dates one by one
   * @param {DateLike} date
   * @param {object} [params] - extra parameters
   * @param {boolean} [params.updateTime] - should update timepicker's time from passed date
   * @param {boolean} [params.silent] - if true, then onChange event wont be triggered
   * @return {Promise<unknown>} - returns promise, since input value updates asynchronously, after promise resolves, we need a promise tobe able to get current input value
   * @example selectDate(new Date()).then(() => {console.log(ds.$el.value)})
   */
  selectDate(date, params = {}) {
    let { parsedViewDate } = this;
    let { updateTime } = params;
    let {
      moveToOtherMonthsOnSelect,

      autoClose,
      onBeforeSelect,
    } = this.opts;

    let newViewDate;

    date = createDate(date);

    if (!(date instanceof Date)) return;

    if (onBeforeSelect && !onBeforeSelect({ date, dateselector: this })) {
      return Promise.resolve();
    }

    // Checks if selected date is out of current month or decade
    // If so, change `viewDate`
    if (date.getMonth() !== parsedViewDate.month && moveToOtherMonthsOnSelect) {
      newViewDate = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    if (newViewDate) {
      this.setViewDate(newViewDate);
    }

    this.selectedDate = date;

    this.trigger(consts.eventChangeSelectedDate, {
      action: consts.actionSelectDate,
      silent: params?.silent,
      date,
      updateTime,
    });

    this._updateLastSelectedDate(date);

    return new Promise((resolve) => {
      setTimeout(resolve);
    });
  }

  /**
   * Clears all selected dates
   * @param {boolean} params.silent  - trigger or not user onSelect event
   */
  clear(params = {}) {
    this.selectedDate = false;

    this.trigger(consts.eventChangeSelectedDate, {
      action: consts.actionUnselectDate,
      silent: params.silent,
    });

    return new Promise((resolve) => {
      setTimeout(resolve);
    });
  }

  show() {
    this._createComponents();
    this.$dateselector.classList.add("-active-");
  }

  hide() {
    this.$dateselector.classList.remove("-active-");
  }

  _getInputValue = (dateFormat) => {
    let { selectedDate } = this;

    if (!selectedDate) return "";

    let formatIsFunction = typeof dateFormat === "function";

    let value = formatIsFunction ? dateFormat(selectedDate) : selectedDate;

    return value;
  };

  _triggerOnSelect() {
    let { onSelect } = this.opts;

    onSelect(this.selectedDate);
  }

  /**
   * Checks if date is already selected, returns selected date if finds one
   * Returns selected date, need for timepicker
   * @param {Date} date
   * @return {boolean|Date}
   * @private
   */
  _checkIfDateIsSelected = (date) => {
    let alreadySelectedDate = false;

    if (this.selectedDate && isSameDate(date, this.selectedDate)) {
      alreadySelectedDate = this.selectedDate;
    }

    return alreadySelectedDate;
  };

  _handleUpDownActions(date, dir) {
    let maxViewIndex = 2,
      minViewIndex = 0;

    date = createDate(date || this.focusDate || this.viewDate);

    if (!(date instanceof Date)) return;

    let nextView = dir === "up" ? this.viewIndex + 1 : this.viewIndex - 1;
    if (nextView > maxViewIndex) nextView = maxViewIndex;
    if (nextView < minViewIndex) nextView = minViewIndex;

    this.setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  /**
   * Sets new view date of dateselector
   * @param {DateLike} date
   */
  setViewDate = (date) => {
    date = createDate(date);

    if (!(date instanceof Date)) return;

    if (isSameDate(date, this.viewDate)) return;
    let oldViewDate = this.viewDate;
    this.viewDate = date;
    let { onChangeViewDate } = this.opts;

    if (onChangeViewDate) {
      let { month, year } = this.parsedViewDate;
      onChangeViewDate({
        month,
        year,
        decade: this.curDecade,
      });
    }

    this.trigger(consts.eventChangeViewDate, date, oldViewDate);
  };

  /**
   * Sets new focusDate
   * @param {Date} date
   * @param {Object} [params]
   * @param {Boolean} params.viewDateTransition
   */
  setFocusDate = (date, params = {}) => {
    if (date) {
      date = createDate(date);

      if (!(date instanceof Date)) return;
    }

    this.focusDate = date;

    this.trigger(consts.eventChangeFocusDate, date, params);
  };

  /**
   * Updates lastSelectedDate param and triggers corresponding event
   * @param {Date|Boolean} date - date or empty
   */
  _updateLastSelectedDate = (date) => {
    this.lastSelectedDate = date;
    this.trigger(consts.eventChangeLastSelectedDate, date);
  };

  /**
   * Finds cell HTML element
   * @param {DateLike} cellDate
   * @param {CellType} cellType
   * @return {HTMLElement | null}
   */
  getCell(cellDate, cellType = consts.day) {
    cellDate = createDate(cellDate);

    if (!(cellDate instanceof Date)) return;

    let { year, month, date } = getParsedDate(cellDate);

    let yearQuery = `[data-year="${year}"]`,
      monthQuery = `[data-month="${month}"]`,
      dayQuery = `[data-date="${date}"]`;

    let resultQuery = {
      [consts.day]: `${yearQuery}${monthQuery}${dayQuery}`,
      [consts.month]: `${yearQuery}${monthQuery}`,
      [consts.year]: `${yearQuery}`,
    };

    return this.calendarView.$el.querySelector(resultQuery[cellType]);
  }

  destroy = () => {
    let parent = this.$dateselector.parentNode;

    if (parent) {
      parent.removeChild(this.$dateselector);
    }

    window.removeEventListener("resize", this._onResize);

    this.calendarView = null;
    this.nav = null;

    this.$dateselector = null;
    this.opts = null;
    this.$customContainer = null;

    this.viewDate = null;
    this.focusDate = null;
    this.selectedDate = null;
  };

  update = (newOpts = {}) => {
    let prevOpts = deepMerge({}, this.opts);
    deepMerge(this.opts, newOpts);

    let { selectedDate } = this.opts;

    this._createMinMaxDates();
    this._limitViewDateByMaxMinDates();
    this._handleLocale();

    if (!prevOpts.selectedDate && selectedDate) {
      this.selectDate(selectedDate);
    }

    this.nav.update();
    this.calendarView.render();
    this.calendarView.renderDayNames();
  };

  _showMobileOverlay() {
    $dateselectorOverlay.classList.add("-active-");
  }

  _hasTransition() {
    let transition = window
      .getComputedStyle(this.$dateselector)
      .getPropertyValue("transition-duration");
    let props = transition.split(", ");

    return (
      props.reduce((sum, item) => {
        return parseFloat(item) + sum;
      }, 0) > 0
    );
  }

  //  Utils
  // -------------------------------------------------

  isOtherMonth = (date) => {
    let { month } = getParsedDate(date);

    return month !== this.parsedViewDate.month;
  };

  isOtherYear = (date) => {
    let { year } = getParsedDate(date);

    return year !== this.parsedViewDate.year;
  };

  isOtherDecade = (date) => {
    let { year } = getParsedDate(date);
    let [firstDecadeYear, lastDecadeYear] = getDecade(this.viewDate);

    return year < firstDecadeYear || year > lastDecadeYear;
  };

  //  Subscription events
  // -------------------------------------------------

  _onChangeSelectedDate = ({ silent }) => {
    // Use timeout here for wait for all changes that could be made to selected date (e.g. timepicker adds time)
    setTimeout(() => {
      this._triggerOnSelect();
    });
  };

  /**
   * Returns all dates that are currently should be shown in calendar
   * @returns {*}
   */
  getViewDates = () => {
    return DateselectorBody.getDaysDates(this);
  };

  //  Helpers
  // -------------------------------------------------

  get shouldUpdateDOM() {
    return this.visible || this.treatAsInline;
  }

  get parsedViewDate() {
    return getParsedDate(this.viewDate);
  }

  get curDecade() {
    return getDecade(this.viewDate);
  }

  get hasSelectedDate() {
    return this.selectedDate;
  }

  get $container() {
    return this.$customContainer || $dateselectorsContainer;
  }

  isWeekend = (day) => {
    return this.opts.weekends.includes(day);
  };

  /**
   * Clamps passed date between min and max date
   * @param {Date} date
   */
  getClampedDate = (date) => {
    let { minDate, maxDate } = this,
      newDate = date;

    if (maxDate && isDateBigger(date, maxDate)) {
      newDate = maxDate;
    } else if (minDate && isDateSmaller(date, minDate)) {
      newDate = minDate;
    }

    return newDate;
  };
}

withEvents(Dateselector.prototype);
