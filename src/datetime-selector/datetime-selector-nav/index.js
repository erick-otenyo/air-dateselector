import { getEl, createElement, closest } from "dom-utils";
import { getParsedDate } from "date-utils";

import "./style.scss";

export default class DateTimeSelectorNav {
  constructor({ dts, opts }) {
    this.dts = dts;
    this.opts = opts;

    this.init();
  }

  init() {
    this._createElement();
    this._buildBaseHtml();
    this._defineDOM();

    this.render();

    this.handleNavStatus();
    this._bindEvents();
  }

  _createElement() {
    this.$el = createElement({
      tagName: "nav",
      className: "air-dts-nav",
    });
  }

  _buildBaseHtml() {
    const prevHtml = '<svg><path d="M 17,12 l -5,5 l 5,5"></path></svg>';
    const nextHtml = '<svg><path d="M 14,12 l 5,5 l -5,5"></path></svg>';

    this.$el.innerHTML =
      "" +
      `<div class="air-dts-nav--action" data-action="prevTime">${prevHtml}</div>` +
      '<button class="air-dts-nav--title"></button>' +
      `<div class="air-dts-nav--action" data-action="nextTime">${nextHtml}</div>`;
  }

  _defineDOM() {
    this.$title = getEl(".air-dts-nav--title", this.$el);
    this.$prevTime = getEl('[data-action="prevTime"]', this.$el);
    this.$nextTime = getEl('[data-action="nextTime"]', this.$el);
  }

  _bindEvents() {
    this.$el.addEventListener("click", this.onClickNav);
    this.$title.addEventListener("click", this.onClickNavTitle);
    this.$title.addEventListener("blur", this._onBlur);
  }

  _onBlur = (e) => {
    if (!this.dts.portal.inFocus && this.dts.portal.visible) {
      this.dts.portal.hide();
    }
  };

  _getTitle() {
    let { dts, opts } = this;
    let template = opts.dateFormat;

    return dts.formatDate(dts.selectedDate, template);
  }

  _disableNav(actionName) {
    getEl('[data-action="' + actionName + '"]', this.$el).classList.add(
      "-disabled-"
    );
  }

  _resetNavStatus() {
    removeClass(
      this.$el.querySelectorAll(".air-dts-nav--action"),
      "-disabled-"
    );
  }

  onClickNav = (e) => {
    let $item = closest(e.target, ".air-dts-nav--action");
    if (!$item) return;

    let actionName = $item.dataset.action;

    this.dts[actionName]();
  };

  onClickNavTitle = () => {
    this.dts.toggleSelector();
  };

  handleNavStatus() {
    let { minDate, maxDate, parsedSelectedDate } = this.dts;

    let minDateParsed = minDate ? getParsedDate(minDate) : false;
    let maxDateParsed = maxDate ? getParsedDate(maxDate) : false;

    if (minDate && minDateParsed >= parsedSelectedDate) {
      this._disableNav("prevTime");
    }
    if (maxDate && maxDateParsed <= parsedSelectedDate) {
      this._disableNav("nextTime");
    }
  }

  renderDelay = () => {
    setTimeout(this.render);
  };

  render = () => {
    this.$title.innerHTML = this._getTitle();
  };
}
