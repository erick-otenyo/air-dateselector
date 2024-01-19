import consts from "./consts";
import { createElement, classNames, getParsedDate, isSameDate } from "./utils";

import "./dateselectorCell.scss";

export default class DateselectorCell {
  constructor({ date, ds, opts, body } = {}) {
    this.date = date;
    this.ds = ds;
    this.opts = opts;
    this.body = body;
    this.customData = false;

    this.init();
  }

  init() {
    // If includeDates option is set, then we should disable all dates except ones that are included
    if (!this.ds.includeDates) {
      this.customData = {
        disabled: true,
      };
    } else {
      let includeDate = this.ds.includeDates.find((date) =>
        isSameDate(date, this.date)
      );

      if (!includeDate) {
        this.customData = {
          disabled: true,
        };
      }
    }

    this._createElement();
    this._bindDateselectorEvents();
    this._handleInitialFocusStatus();
    if (this.ds.hasSelectedDate) {
      this._handleSelectedStatus();
    }
  }

  _bindDateselectorEvents() {
    this.ds.on(consts.eventChangeSelectedDate, this.onChangeSelectedDate);
    this.ds.on(consts.eventChangeFocusDate, this.onChangeFocusDate);
  }

  unbindDateselectorEvents() {
    this.ds.off(consts.eventChangeSelectedDate, this.onChangeSelectedDate);
    this.ds.off(consts.eventChangeFocusDate, this.onChangeFocusDate);
  }

  _createElement() {
    let { year, month, date } = getParsedDate(this.date);
    let extraAttrs = this.customData?.attrs || {};

    this.$cell = createElement({
      className: this._getClassName(),
      attrs: {
        "data-year": year,
        "data-month": month,
        "data-date": date,
        ...extraAttrs,
      },
    });
  }

  _getClassName() {
    let currentDate = new Date();
    let { selectOtherMonths } = this.opts;
    let { minDate, maxDate } = this.ds;
    let { day } = getParsedDate(this.date);
    let disabled = this.customData?.disabled;

    let classNameCommon = classNames("air-dateselector-cell", "-day-", {
      "-current-": isSameDate(currentDate, this.date),
      "-min-date-": minDate && isSameDate(minDate, this.date),
      "-max-date-": maxDate && isSameDate(maxDate, this.date),
    });

    const classNameType = classNames({
      "-weekend-": this.ds.isWeekend(day),
      "-other-month-": this.isOtherMonth,
      "-disabled-": (this.isOtherMonth && !selectOtherMonths) || disabled,
    });

    return classNames(classNameCommon, classNameType, this.customData?.classes);
  }

  _getHtml() {
    let { date } = getParsedDate(this.date);
    let { showOtherMonths } = this.opts;

    if (this.customData?.html) {
      return this.customData.html;
    }

    return !showOtherMonths && this.isOtherMonth ? "" : date;
  }

  destroy() {
    this.unbindDateselectorEvents();
  }

  focus = () => {
    this.$cell.classList.add("-focus-");
    this.focused = true;
  };

  removeFocus = () => {
    this.$cell.classList.remove("-focus-");
    this.focused = false;
  };

  select = () => {
    this.$cell.classList.add("-selected-");
    this.selected = true;
  };

  removeSelect = () => {
    this.$cell.classList.remove("-selected-");
    this.selected = false;
  };

  _handleSelectedStatus() {
    let selected = this.ds._checkIfDateIsSelected(this.date);

    if (selected) {
      this.select();
    } else if (!selected && this.selected) {
      this.removeSelect();
    }
  }

  _handleInitialFocusStatus() {
    let datesAreSame = isSameDate(this.ds.focusDate, this.date);

    if (datesAreSame) {
      this.focus();
    }
  }

  get isDisabled() {
    return this.$cell.matches(".-disabled-");
  }

  get isOtherMonth() {
    return this.ds.isOtherMonth(this.date);
  }

  get isOtherDecade() {
    return this.ds.isOtherDecade(this.date);
  }

  onChangeSelectedDate = () => {
    if (this.isDisabled) return;

    this._handleSelectedStatus();
  };

  onChangeFocusDate = (date) => {
    if (!date) {
      if (this.focused) {
        this.removeFocus();
      }
      return;
    }

    let datesAreSame = isSameDate(date, this.date);

    if (datesAreSame) {
      this.focus();
    } else if (!datesAreSame && this.focused) {
      this.removeFocus();
    }
  };

  render = () => {
    this.$cell.innerHTML = this._getHtml();
    this.$cell.adpCell = this;

    return this.$cell;
  };
}
