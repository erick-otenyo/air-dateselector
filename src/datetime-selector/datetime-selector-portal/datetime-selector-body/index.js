import { getEl, createElement, classNames } from "dom-utils";

import {
  dFormatter,
  formatDateTime,
  objectifyDates,
  monthNames,
  daysInMonth,
} from "date-utils";

import { defined } from "utils";

import CalendarSelector from "./calendar-selector";

import "./style.scss";

export default class DateTimeSelectorBody {
  constructor(dts, opts) {
    this.dts = dts;
    this.opts = opts;

    this.$el = createElement({
      className: "air-dts--content",
    });

    this.datesObject = objectifyDates(this.dts.includeDates);

    this.state = {
      century: null,
      year: null,
      month: null,
      day: null,
      time: null,
      hour: null,
      granularity: null,
    };

    this.init();
  }

  init() {
    this._initState();
  }

  _initState() {
    if (this.dts.portalState) {
      this._setState(this.dts.portalState);
      return;
    }

    let defaultCentury = null;
    let defaultYear = null;
    let defaultMonth = null;
    let defaultDay = null;
    let defaultTime = null;
    let defaultGranularity = "century";

    const { datesObject } = this;

    if (datesObject.indice.length === 1) {
      // only one century
      const soleCentury = datesObject.indice[0];

      const dataFromThisCentury = datesObject[soleCentury];
      defaultCentury = soleCentury;

      if (dataFromThisCentury.indice.length === 1) {
        // only one year, check if this year has only one month
        const soleYear = dataFromThisCentury.indice[0];
        const dataFromThisYear = dataFromThisCentury[soleYear];
        defaultYear = soleYear;
        defaultGranularity = "year";

        if (dataFromThisYear.indice.length === 1) {
          // only one month data from this one year, need to check day then
          const soleMonth = dataFromThisYear.indice[0];
          const dataFromThisMonth = dataFromThisYear[soleMonth];
          defaultMonth = soleMonth;
          defaultGranularity = "month";

          if (dataFromThisMonth.indice === 1) {
            // only one day has data
            defaultDay = dataFromThisMonth.indice[0];
          }
        }
      }
    }

    this._setState({
      century: defaultCentury,
      year: defaultYear,
      month: defaultMonth,
      day: defaultDay,
      time: defaultTime,
      granularity: defaultGranularity,
    });
  }

  _setState(newState) {
    this.state = { ...this.state, ...newState };

    this.dts.portalState = this.state;

    this.render();
  }

  _buildCenturyGrid(datesObject) {
    if (datesObject.dates && datesObject.dates.length >= 12) {
      const centuries = datesObject.indice;

      const $centuryGrid = createElement({
        className: "grid",
        innerHTML: "" + '<div class="gridHeading"> Select a century</div>',
      });

      centuries.forEach((c) => {
        const $item = createElement({
          tagName: "button",
          className: "centuryBtn",
          innerHTML: `${c}00`,
        });

        $item.addEventListener("click", () => {
          this._setState({ century: c });
        });

        $centuryGrid.appendChild($item);
      });

      return $centuryGrid;
    } else {
      return this._buildList(datesObject.dates);
    }
  }

  _buildYearGrid(datesObject) {
    if (datesObject.dates && datesObject.dates.length >= 12) {
      const years = datesObject.indice;
      const monthOfYear = Array.apply(null, { length: 12 }).map(
        Number.call,
        Number
      );

      const $yearGrid = createElement({
        className: "grid",
        innerHTML:
          "" +
          '<div class="gridHeading"> Select a year</div>' +
          '<div class="gridBody"></div>',
      });

      const $yearGridBody = getEl(".gridBody", $yearGrid);

      years.forEach((y) => {
        const $yearItem = createElement({
          className: "gridRow",
          innerHTML:
            "" +
            `<span class="gridLabel">${y}</span>` +
            `<span class="gridRowInner12"></span>`,
        });

        $yearItem.addEventListener("click", () => {
          this._setState({ year: y, month: null, day: null, time: null });
        });

        monthOfYear.forEach((m) => {
          const $mItem = createElement({
            tagName: "span",
            className: datesObject[y][m] ? "activeGrid" : "",
          });

          const $yearInner = getEl(".gridRowInner12", $yearItem);

          $yearInner.appendChild($mItem);
        });

        $yearGridBody.appendChild($yearItem);
      });

      return $yearGrid;
    } else {
      return this._buildList(datesObject.dates);
    }
  }

  _buildMonthGrid(datesObject) {
    const year = this.state.year;

    if (datesObject[year].dates && datesObject[year].dates.length > 12) {
      const $monthGrid = createElement({
        className: "grid",
        innerHTML:
          "" +
          '<div class="gridHeading"></div>' +
          '<div class="gridBody"></div>',
      });

      const $monthGridBody = getEl(".gridBody", $monthGrid);

      // add back btn
      const $backBtn = createElement({
        tagName: "button",
        className: "backbtn",
        innerHTML: this.state.year,
      });

      $backBtn.addEventListener("click", () => {
        this._setState({
          year: null,
          month: null,
          day: null,
          time: null,
        });
      });

      const $gridHeading = getEl(".gridHeading", $monthGrid);
      $gridHeading.appendChild($backBtn);

      monthNames.forEach((m, i) => {
        const $mItem = createElement({
          className: classNames("gridRow", {
            inactiveGridRow: !defined(datesObject[year][i]),
          }),
          innerHTML:
            "" +
            `<span class="gridLabel">${m}</span>` +
            '<span class="gridRowInner31"></span>',
        });

        $mItem.addEventListener("click", () => {
          if (defined(datesObject[year][i])) {
            this._setState({ month: i, day: null, time: null });
          }
        });

        const $monthInner = getEl(".gridRowInner31", $mItem);
        daysInMonth(i, year).forEach((d) => {
          const $dItem = createElement({
            tagName: "span",
            className: classNames({
              activeGrid:
                defined(datesObject[year][i]) &&
                defined(datesObject[year][i][d + 1]),
            }),
          });
          $monthInner.appendChild($dItem);
        });

        $monthGridBody.appendChild($mItem);
      });

      return $monthGrid;
    } else {
      return this._buildList(datesObject[year].dates);
    }
  }

  _buildDayView(datesObject) {
    if (
      datesObject[this.state.year][this.state.month].dates &&
      datesObject[this.state.year][this.state.month].dates.length > 31
    ) {
      const $dayView = createElement({
        className: "dayPicker",
        innerHTML: "" + '<div class="daypicker-wrapper"></div>',
      });

      const $dayViewWrapper = getEl(".daypicker-wrapper", $dayView);

      const $yearBackBtn = createElement({
        tagName: "button",
        className: "backbtn",
        innerHTML: this.state.year,
      });

      $yearBackBtn.addEventListener("click", () => {
        this._setState({ year: null, month: null, day: null, time: null });
      });

      const $monthBackBtn = createElement({
        tagName: "button",
        className: "backbtn",
        innerHTML: monthNames[this.state.month],
      });

      $monthBackBtn.addEventListener("click", () => {
        this._setState({ month: null, day: null, time: null });
      });

      $dayViewWrapper.appendChild($yearBackBtn);
      $dayViewWrapper.appendChild($monthBackBtn);

      this.dateSelector = new CalendarSelector($dayView, this.dts, {
        ...this.opts.calendarOptions,
        onSelect: (date) => {
          this._setState({ day: date.getDate(), month: date.getMonth() });
        },
      });
      return this.dateSelector.$el;
    } else {
      return this._buildList(
        datesObject[this.state.year][this.state.month].dates
      );
    }
  }

  _buildHourView(datesObject) {
    const timeOptions = datesObject[this.state.year][this.state.month][
      this.state.day
    ].dates.map((m) => ({
      value: m,
      label: formatDateTime(m),
    }));

    if (timeOptions.length > 24) {
      const headingSuffix = `${this.state.day} ${
        monthNames[this.state.month]
      } ${this.state.year} `;

      const $hourView = createElement({
        className: "grid",
        innerHTML:
          "" +
          `<div class="gridHeading">Select an hour on ${headingSuffix}</div>` +
          "<div class='gridBody'></div>",
      });

      const $gridBody = getEl(".gridBody", $hourView);

      datesObject[this.state.year][this.state.month][
        this.state.day
      ].indice.forEach((h) => {
        const optionsPrefix = `${
          datesObject[this.state.year][this.state.month][this.state.day][h]
            .length
        }`;

        const $hourItem = createElement({
          tagName: "button",
          className: "dateBtn",
          innerHTML:
            "" +
            `<span>${h}:00 - ${h + 1}:00 </span> ` +
            `<span>  (${optionsPrefix} options)</span>`,
        });

        $hourItem.addEventListener("click", () => {
          this._setState({ hour: h });
        });

        $gridBody.appendChild($hourItem);
      });

      return $hourView;
    } else {
      return this._buildList(
        datesObject[this.state.year][this.state.month][this.state.day].dates
      );
    }
  }

  _buildMinutesView(datesObject) {
    const options =
      datesObject[this.state.year][this.state.month][this.state.day][
        this.state.hour
      ];

    return this._buildList(options);
  }

  _buildList(items) {
    const $list = createElement({
      className: "grid",
      innerHTML:
        "" +
        '<div class="gridHeading">Select a time</div>' +
        '<div class="gridBody"></div>',
    });

    const $gridBody = getEl(".gridBody", $list);

    items.forEach((item) => {
      const $item = createElement({
        tagName: "button",
        className: "dateBtn",
        innerHTML: defined(this.opts.dateFormat)
          ? dFormatter(
              item,
              this.opts.dateFormat.currentTime,
              this.opts.dateFormat.asPeriod
            )
          : formatDateTime(item),
      });

      $item.addEventListener("click", () => {
        this.dts.updateSelectedDate(item);
      });

      $gridBody.appendChild($item);
    });

    return $list;
  }

  goBack = () => {
    if (defined(this.state.time)) {
      if (!defined(this.state.month)) {
        this._setState({
          year: null,
          month: null,
          day: null,
        });
      }

      if (!defined(this.state.hour)) {
        this._setState({
          day: null,
        });
      }

      if (!defined(this.state.day)) {
        this._setState({
          month: null,
          day: null,
        });
      }

      this._setState({
        hour: null,
        time: null,
      });
    } else if (defined(this.state.hour)) {
      this._setState({
        hour: null,
        time: null,
      });
    } else if (defined(this.state.day)) {
      this._setState({
        day: null,
        time: null,
        hour: null,
      });
    } else if (defined(this.state.month)) {
      this._setState({
        month: null,
        time: null,
        day: null,
        hour: null,
      });
    } else if (defined(this.state.year)) {
      this._setState({
        year: null,
        month: null,
        time: null,
        day: null,
        hour: null,
      });
    } else if (defined(this.state.century)) {
      this._setState({
        century: null,
        year: null,
        month: null,
        time: null,
        day: null,
        hour: null,
      });
    }
  };

  destroy() {
    this.$el.innerHTML = "";
  }

  _buildBackBtn() {
    const disabled = !this.state[this.state.granularity];

    const $backBtn = createElement({
      tagName: "button",
      className: "backbutton",
      innerHTML: '<svg><path d="M 17,12 l -5,5 l 5,5"></path></svg>',
      attrs: { ...(disabled && { disabled: true }) },
    });

    $backBtn.addEventListener("click", this.goBack);

    return $backBtn;
  }

  render() {
    this.destroy();

    const { datesObject } = this;
    const { century, year, month, day, hour } = this.state;

    this.$el.appendChild(this._buildBackBtn());

    if (!defined(century)) {
      this.$el.appendChild(this._buildCenturyGrid(datesObject));
      return;
    }

    if (defined(century) && !defined(year)) {
      this.$el.appendChild(this._buildYearGrid(datesObject[century]));
      return;
    }

    if (defined(year) && !defined(month)) {
      this.$el.appendChild(this._buildMonthGrid(datesObject[century]));
      return;
    }

    if (defined(year) && defined(month) && !defined(day)) {
      this.$el.appendChild(this._buildDayView(datesObject[century]));
      return;
    }

    if (defined(year) && defined(month) && defined(day) && !defined(hour)) {
      this.$el.appendChild(this._buildHourView(datesObject[century]));
      return;
    }

    if (defined(year) && defined(month) && defined(day) && defined(hour)) {
      this.$el.appendChild(this._buildMinutesView(datesObject[century]));
      return;
    }

    return;
  }
}
