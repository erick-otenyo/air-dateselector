import defaults from "./defaults";
import {
  createDate,
  createElement,
  deepCopy,
  deepMerge,
  getDecade,
  getEl,
  getParsedDate,
  getWordBoundaryRegExp,
  insertAfter,
  isDateBigger,
  isDateSmaller,
  isSameDate,
} from "./utils";

import DateselectorBody from "./dateselectorBody";
import DateselectorNav from "./dateselectorNav";
import DateselectorKeyboard from "./dateselectorKeyboard";
import withEvents from "./withEvents";
import consts from "./consts";

import "./dateselectorVars.scss";
import "./dateselector.scss";

let $dateselectorsContainer = "",
  $dateselectorOverlay = "",
  containerBuilt = false,
  baseTemplate =
    "" +
    '<i class="air-dateselector--pointer"></i>' +
    '<div class="air-dateselector--navigation"></div>' +
    '<div class="air-dateselector--content"></div>';

export default class Dateselector {
  static defaults = defaults;
  static version = "3.4.0";
  static defaultGlobalContainerId = "air-dateselector-global-container";
  static buildGlobalContainer(id) {
    containerBuilt = true;

    $dateselectorsContainer = createElement({ className: id, id });
    getEl("body").appendChild($dateselectorsContainer);
  }

  constructor(el, opts) {
    this.$el = getEl(el);

    if (!this.$el) return;

    this.$dateselector = createElement({ className: "air-dateselector" });
    this.opts = deepMerge({}, defaults, opts);
    this.$customContainer = this.opts.container
      ? getEl(this.opts.container)
      : false;

    let { startDate } = this.opts;

    if (!startDate) {
      this.opts.startDate = new Date();
    }

    if (this.$el.nodeName === "INPUT") {
      this.elIsInput = true;
    }

    this.inited = false;
    this.visible = false;

    this.viewDate = createDate(this.opts.startDate);
    this.focusDate = false;
    this.initialReadonly = this.$el.getAttribute("readonly");
    this.customHide = false;
    this.selectedDate = null;
    this.calendarView = null;
    this.keys = [];
    this.treatAsInline = this.opts.inline || !this.elIsInput;

    this.init();
  }

  init() {
    let {
      opts,
      treatAsInline,
      opts: { inline, isMobile, selectedDate, keyboardNav },
    } = this;
    let $body = getEl("body");

    let shouldBuildGlobalContainer =
      // Check if global container still exist in DOM
      (!containerBuilt ||
        (containerBuilt &&
          $dateselectorsContainer &&
          !$body.contains($dateselectorsContainer))) &&
      !inline &&
      this.elIsInput &&
      !this.$customContainer;

    if (shouldBuildGlobalContainer) {
      Dateselector.buildGlobalContainer(Dateselector.defaultGlobalContainerId);
    }

    if (isMobile && !$dateselectorOverlay && !treatAsInline) {
      this._createMobileOverlay();
    }

    this._handleLocale();
    this._bindSubEvents();

    this._createIncludeDates();
    this._limitViewDateByMaxMinDates();

    if (this.elIsInput) {
      if (!inline) {
        this._bindEvents();
      }

      if (keyboardNav) {
        this.keyboardNav = new DateselectorKeyboard({ ds: this, opts });
      }
    }

    if (selectedDate) {
      this.selectDate(selectedDate, { silent: true });
    }

    if (this.opts.visible && !treatAsInline) {
      this.show();
    }

    if (isMobile && !treatAsInline) {
      this.$el.setAttribute("readonly", true);
    }

    if (treatAsInline) {
      this._createComponents();
    }
  }

  _createMobileOverlay() {
    $dateselectorOverlay = createElement({
      className: "air-dateselector-overlay",
    });
    $dateselectorsContainer.appendChild($dateselectorOverlay);
  }

  _createComponents() {
    let {
      opts,
      treatAsInline,
      opts: { inline, position, classes, isMobile },
    } = this;
    let ds = this;

    this._buildBaseHtml();

    if (this.elIsInput) {
      if (!inline) {
        this._setPositionClasses(position);
      }
    }

    if (inline || !this.elIsInput) {
      this.$dateselector.classList.add("-inline-");
    }

    if (classes) {
      this.$dateselector.classList.add(...classes.split(" "));
    }

    if (isMobile && !treatAsInline) {
      this._addMobileAttributes();
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

  _addMobileAttributes() {
    $dateselectorOverlay.addEventListener("click", this._onClickOverlay);

    this.$dateselector.classList.add("-is-mobile-");
    this.$el.setAttribute("readonly", true);
  }

  _removeMobileAttributes() {
    $dateselectorOverlay.removeEventListener("click", this._onClickOverlay);

    this.$dateselector.classList.remove("-is-mobile-");

    if (!this.initialReadonly && this.initialReadonly !== "") {
      this.$el.removeAttribute("readonly");
    }
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
    this.on(consts.eventChangeFocusDate, this._onChangeFocusedDate);
  }

  _buildBaseHtml() {
    let { inline } = this.opts;

    if (this.elIsInput) {
      if (!inline) {
        this.$container.appendChild(this.$dateselector);
      } else {
        insertAfter(this.$dateselector, this.$el);
      }
    } else {
      this.$el.appendChild(this.$dateselector);
    }

    this.$dateselector.innerHTML = baseTemplate;

    this.$content = getEl(".air-dateselector--content", this.$dateselector);
    this.$pointer = getEl(".air-dateselector--pointer", this.$dateselector);
    this.$nav = getEl(".air-dateselector--navigation", this.$dateselector);
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

  _setPositionClasses(pos) {
    if (typeof pos === "function") {
      this.$dateselector.classList.add("-custom-position-");

      return;
    }

    pos = pos.split(" ");
    let main = pos[0],
      sec = pos[1],
      classes = `air-dateselector -${main}-${sec}- -from-${main}-`;

    this.$dateselector.classList.add(...classes.split(" "));
  }

  _bindEvents() {
    this.$el.addEventListener(this.opts.showEvent, this._onFocus);
    this.$el.addEventListener("blur", this._onBlur);
    this.$dateselector.addEventListener("mousedown", this._onMouseDown);
    this.$dateselector.addEventListener("mouseup", this._onMouseUp);
    window.addEventListener("resize", this._onResize);
  }

  formatDate(date = this.viewDate, string) {
    date = createDate(date);

    if (!(date instanceof Date)) return;

    let result = string,
      locale = this.locale,
      parsedDate = getParsedDate(date),
      dayPeriod = parsedDate.dayPeriod,
      decade = getDecade(date),
      replacer = Dateselector.replacer;

    let formats = {
      // Time in ms
      T: date.getTime(),

      // Minutes
      m: parsedDate.minutes,
      mm: parsedDate.fullMinutes,

      // Hours
      h: parsedDate.hours12,
      hh: parsedDate.fullHours12,
      H: parsedDate.hours,
      HH: parsedDate.fullHours,

      // Day period
      aa: dayPeriod,
      AA: dayPeriod.toUpperCase(),

      // Day of week
      E: locale.daysShort[parsedDate.day],
      EEEE: locale.days[parsedDate.day],

      // Date of month
      d: parsedDate.date,
      dd: parsedDate.fullDate,

      // Months
      M: parsedDate.month + 1,
      MM: parsedDate.fullMonth,
      MMM: locale.monthsShort[parsedDate.month],
      MMMM: locale.months[parsedDate.month],

      // Years
      yy: parsedDate.year.toString().slice(-2),
      yyyy: parsedDate.year,
      yyyy1: decade[0],
      yyyy2: decade[1],
    };

    for (let [format, data] of Object.entries(formats)) {
      result = replacer(result, getWordBoundaryRegExp(format), data);
    }

    return result;
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

    if (autoClose && this.visible) {
      this.hide();
    }

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
    let { onShow, isMobile } = this.opts;
    this._cancelScheduledCall();

    if (!this.visible && !this.hideAnimation) {
      this._createComponents();
    }

    this.setPosition(this.opts.position);

    this.$dateselector.classList.add("-active-");
    this.visible = true;

    if (onShow) {
      this._scheduleCallAfterTransition(onShow);
    }

    if (isMobile) {
      this._showMobileOverlay();
    }
  }

  hide() {
    let { onHide, isMobile } = this.opts;
    let hasTransition = this._hasTransition();

    this.visible = false;
    this.hideAnimation = true;

    this.$dateselector.classList.remove("-active-");

    if (this.customHide) {
      this.customHide();
    }

    if (this.elIsInput) {
      this.$el.blur();
    }

    this._scheduleCallAfterTransition((isAnimationCompleted) => {
      if (
        !this.customHide &&
        ((isAnimationCompleted && hasTransition) ||
          (!isAnimationCompleted && !hasTransition))
      ) {
        this._finishHide();
      }
      onHide && onHide(isAnimationCompleted);
    });

    if (isMobile) {
      $dateselectorOverlay.classList.remove("-active-");
    }
  }

  _finishHide = () => {
    this.hideAnimation = false;
    this._destroyComponents();
    this.$container.removeChild(this.$dateselector);
  };

  setPosition = (position) => {
    position = position || this.opts.position;

    if (typeof position === "function") {
      this.customHide = position({
        $dateselector: this.$dateselector,
        $target: this.$el,
        $pointer: this.$pointer,
        done: this._finishHide,
      });
      return;
    }

    let { isMobile } = this.opts;

    let vpDims = this.$el.getBoundingClientRect(),
      dims = this.$el.getBoundingClientRect(),
      $dpOffset = this.$dateselector.offsetParent,
      $elOffset = this.$el.offsetParent,
      selfDims = this.$dateselector.getBoundingClientRect(),
      pos = position.split(" "),
      top,
      left,
      scrollTop = window.scrollY,
      scrollLeft = window.scrollX,
      offset = this.opts.offset,
      main = pos[0],
      secondary = pos[1];

    if (isMobile) {
      this.$dateselector.style.cssText = "left: 50%; top: 50%";
      return;
    }

    // If dateselector's container is the same with target element
    if ($dpOffset === $elOffset && $dpOffset !== document.body) {
      dims = {
        top: this.$el.offsetTop,
        left: this.$el.offsetLeft,
        width: vpDims.width,
        height: this.$el.offsetHeight,
      };

      scrollTop = 0;
      scrollLeft = 0;
    }

    // If ds container is different from target offset parent
    // and ds offset parent has position not static (default case)
    if ($dpOffset !== $elOffset && $dpOffset !== document.body) {
      let dpOffsetDims = $dpOffset.getBoundingClientRect();

      dims = {
        top: vpDims.top - dpOffsetDims.top,
        left: vpDims.left - dpOffsetDims.left,
        width: vpDims.width,
        height: vpDims.height,
      };

      scrollTop = 0;
      scrollLeft = 0;
    }

    switch (main) {
      case "top":
        top = dims.top - selfDims.height - offset;
        break;
      case "right":
        left = dims.left + dims.width + offset;
        break;
      case "bottom":
        top = dims.top + dims.height + offset;
        break;
      case "left":
        left = dims.left - selfDims.width - offset;
        break;
    }

    switch (secondary) {
      case "top":
        top = dims.top;
        break;
      case "right":
        left = dims.left + dims.width - selfDims.width;
        break;
      case "bottom":
        top = dims.top + dims.height - selfDims.height;
        break;
      case "left":
        left = dims.left;
        break;
      case "center":
        if (/left|right/.test(main)) {
          top = dims.top + dims.height / 2 - selfDims.height / 2;
        } else {
          left = dims.left + dims.width / 2 - selfDims.width / 2;
        }
    }

    this.$dateselector.style.cssText = `left: ${left + scrollLeft}px; top: ${
      top + scrollTop
    }px`;
  };

  _setInputValue = () => {
    let {
      locale: { dateFormat },
    } = this;

    this.$el.value = this._getInputValue(dateFormat);
  };

  _getInputValue = (dateFormat) => {
    let { selectedDate } = this;

    if (!selectedDate) return "";

    let formatIsFunction = typeof dateFormat === "function";

    let value = formatIsFunction ? dateFormat(selectedDate) : selectedDate;

    return value;
  };

  _triggerOnSelect() {
    let date,
      formattedDate,
      dateselector = this,
      {
        selectedDate,
        locale,
        opts: { onSelect },
      } = dateselector,
      formatIsFunction = typeof locale.dateFormat === "function";

    date = selectedDate;
    formattedDate = formatIsFunction
      ? locale.dateFormat(selectedDate)
      : this.formatDate(selectedDate, locale.dateFormat);

    onSelect({
      date: date,
      formattedDate: formattedDate,
      dateselector,
    });
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

  _scheduleCallAfterTransition = (cb) => {
    this._cancelScheduledCall();

    cb && cb(false);

    this._onTransitionEnd = () => {
      cb && cb(true);
    };

    this.$dateselector.addEventListener(
      "transitionend",
      this._onTransitionEnd,
      {
        once: true,
      }
    );
  };

  _cancelScheduledCall = () => {
    this.$dateselector.removeEventListener(
      "transitionend",
      this._onTransitionEnd
    );
  };

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
    let { showEvent, isMobile } = this.opts;

    let parent = this.$dateselector.parentNode;

    if (parent) {
      parent.removeChild(this.$dateselector);
    }

    this.$el.removeEventListener(showEvent, this._onFocus);
    this.$el.removeEventListener("blur", this._onBlur);
    window.removeEventListener("resize", this._onResize);
    if (isMobile) {
      this._removeMobileAttributes();
    }

    if (this.keyboardNav) {
      this.keyboardNav.destroy();
    }

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

    let { selectedDate, isMobile } = this.opts;
    let shouldUpdateDOM = this.visible || this.treatAsInline;

    this._createMinMaxDates();
    this._limitViewDateByMaxMinDates();
    this._handleLocale();

    if (!prevOpts.selectedDate && selectedDate) {
      this.selectDate(selectedDate);
    }

    this._setInputValue();

    if (!prevOpts.isMobile && isMobile) {
      if (!this.treatAsInline && !$dateselectorOverlay) {
        this._createMobileOverlay();
      }
      this._addMobileAttributes();
      if (this.visible) {
        this._showMobileOverlay();
      }
    } else if (prevOpts.isMobile && !isMobile) {
      this._removeMobileAttributes();

      if (this.visible) {
        $dateselectorOverlay.classList.remove("-active-");
        if (typeof this.opts.position !== "function") {
          this.setPosition();
        }
      }
    }

    if (!shouldUpdateDOM) return;

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
      this._setInputValue();
      if (this.opts.onSelect && !silent) {
        this._triggerOnSelect();
      }
    });
  };

  _onChangeFocusedDate = (date, { viewDateTransition } = {}) => {
    if (!date) return;
    let shouldPerformTransition = false;

    if (viewDateTransition) {
      shouldPerformTransition =
        this.isOtherMonth(date) ||
        this.isOtherYear(date) ||
        this.isOtherDecade(date);
    }

    if (shouldPerformTransition) {
      this.setViewDate(date);
    }

    if (this.opts.onFocus) {
      this.opts.onFocus({ dateselector: this, date });
    }
  };

  _onFocus = (e) => {
    if (!this.visible) {
      this.show();
    }
  };

  _onBlur = (e) => {
    if (!this.inFocus && this.visible && !this.opts.isMobile) {
      this.hide();
    }
  };

  _onMouseDown = (e) => {
    this.inFocus = true;
  };

  _onMouseUp = (e) => {
    this.inFocus = false;
    this.$el.focus();
  };

  _onResize = () => {
    if (this.visible && typeof this.opts.position !== "function") {
      this.setPosition();
    }
  };

  _onClickOverlay = () => {
    if (this.visible) {
      this.hide();
    }
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

  static replacer(str, reg, data) {
    return str.replace(reg, function (match, p1, p2, p3) {
      return p1 + data + p3;
    });
  }
}

withEvents(Dateselector.prototype);
