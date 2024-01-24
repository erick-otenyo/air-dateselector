import consts from "./consts";
import {
  addEventListener,
  classNames,
  closest,
  createElement,
  getDaysCount,
  getEl,
  getParsedDate,
  isSameDate,
  subDays,
} from "../../utils";

import DateselectorCell from "./dateselectorCell";

import "./dateselectorBody.scss";

const cellClassName = ".air-dateselector-cell";

export default class DateselectorBody {
  constructor({ ds, opts }) {
    this.ds = ds;
    this.opts = opts;
    this.cells = [];
    this.$el = "";
    this.pressed = false;
    this.isVisible = true;

    this.init();
  }

  init() {
    this._buildBaseHtml();

    this.renderDayNames();

    this.render();
    this._bindEvents();
    this._bindDateselectorEvents();
  }

  _bindEvents() {
    addEventListener(this.$el, "mouseover", this.onMouseOverCell);
    addEventListener(this.$el, "mouseout", this.onMouseOutCell);
    addEventListener(this.$el, "click", this.onClickBody);
  }

  _bindDateselectorEvents() {
    this.ds.on(consts.eventChangeViewDate, this.onChangeViewDate);
  }

  _buildBaseHtml() {
    this.$el = createElement({
      className: `air-dateselector-body -days-`,
      innerHtml:
        "" +
        '<div class="air-dateselector-body--day-names"></div>' +
        `<div class="air-dateselector-body--cells -days-"></div>`,
    });

    this.$names = getEl(".air-dateselector-body--day-names", this.$el);
    this.$cells = getEl(".air-dateselector-body--cells", this.$el);
  }

  _getDayNamesHtml(firstDay = this.ds.locale.firstDay) {
    let html = "",
      isWeekend = this.ds.isWeekend,
      { onClickDayName } = this.opts,
      curDay = firstDay,
      totalDays = 7,
      i = 0;

    while (i < totalDays) {
      let day = curDay % totalDays;
      let className = classNames("air-dateselector-body--day-name", {
        [consts.cssClassWeekend]: isWeekend(day),
        "-clickable-": !!onClickDayName,
      });
      let dayName = this.ds.locale.daysMin[day];

      html += `<div class="${className}" data-day-index='${day}'>${dayName}</div>`;

      i++;
      curDay++;
    }
    return html;
  }

  renderDayNames() {
    this.$names.innerHTML = this._getDayNamesHtml();
  }

  _generateCell(date) {
    let { ds, opts } = this;
    return new DateselectorCell({
      ds,
      opts,
      date,
      body: this,
    });
  }

  _generateCells() {
    DateselectorBody.getDaysDates(this.ds, (date) => {
      this.cells.push(this._generateCell(date));
    });
  }

  show() {
    this.isVisible = true;
    this.$el.classList.remove("-hidden-");
  }

  hide() {
    this.isVisible = false;
    this.$el.classList.add("-hidden-");
  }

  destroyCells() {
    this.cells.forEach((c) => c.destroy());
    this.cells = [];
    this.$cells.innerHTML = "";
  }

  destroy() {
    this.destroyCells();
    this.ds.off(consts.eventChangeViewDate, this.onChangeViewDate);
  }

  handleClick = (e) => {
    let $cell = e.target.closest(cellClassName);
    let cell = $cell.adpCell;
    if (cell.isDisabled) return;

    this.ds.selectDate(cell.date);
  };

  handleDayNameClick = (e) => {
    let index = e.target.getAttribute("data-day-index");

    this.opts.onClickDayName({
      dayIndex: Number(index),
      dateselector: this.ds,
    });
  };

  onMouseOverCell = (e) => {
    let $cell = closest(e.target, cellClassName);
    this.ds.setFocusDate($cell ? $cell.adpCell.date : false);
  };

  onMouseOutCell = () => {
    this.ds.setFocusDate(false);
  };

  onClickBody = (e) => {
    let { onClickDayName } = this.opts;
    let target = e.target;

    if (target.closest(cellClassName)) {
      this.handleClick(e);
    }

    if (onClickDayName && target.closest(".air-dateselector-body--day-name")) {
      this.handleDayNameClick(e);
    }
  };

  onMouseDown = (e) => {
    this.pressed = true;

    let $cell = closest(e.target, cellClassName),
      cell = $cell && $cell.adpCell;
  };

  onMouseUp = () => {
    this.pressed = false;
  };

  onChangeViewDate = (date, oldViewDate) => {
    // Handle only visible views
    if (!this.isVisible) return;

    // Prevent unnecessary cell rendering when going up or down to next view
    if (isSameDate(date, oldViewDate, consts.months)) {
      return;
    }

    this.render();
  };

  render = () => {
    this.destroyCells();

    this._generateCells();
    this.cells.forEach((c) => {
      this.$cells.appendChild(c.render());
    });
  };

  static getDaysDates(ds, cb) {
    let {
        viewDate,
        locale: { firstDay },
      } = ds,
      totalMonthDays = getDaysCount(viewDate),
      { year, month } = getParsedDate(viewDate),
      firstMonthDay = new Date(year, month, 1),
      lastMonthDay = new Date(year, month, totalMonthDays),
      daysFromPrevMonth = firstMonthDay.getDay() - firstDay,
      daysFromNextMonth = 6 - lastMonthDay.getDay() + firstDay;

    daysFromPrevMonth =
      daysFromPrevMonth < 0 ? daysFromPrevMonth + 7 : daysFromPrevMonth;
    daysFromNextMonth =
      daysFromNextMonth > 6 ? daysFromNextMonth - 7 : daysFromNextMonth;

    let firstRenderDate = subDays(firstMonthDay, daysFromPrevMonth),
      totalRenderDays = totalMonthDays + daysFromPrevMonth + daysFromNextMonth,
      firstRenderDayDate = firstRenderDate.getDate(),
      { year: renderYear, month: renderMonth } = getParsedDate(firstRenderDate),
      i = 0;

    const dates = [];

    while (i < totalRenderDays) {
      let date = new Date(renderYear, renderMonth, firstRenderDayDate + i);
      if (cb) {
        cb(date);
      }
      dates.push(date);
      i++;
    }

    return dates;
  }
}
