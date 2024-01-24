class Temp {
  _bindEvents() {
    window.addEventListener("click", this.closeSelector);
  }

  closeSelector() {}

  _setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  _objectifyDates() {
    if (this.includeDates) {
      this.datesObject = objectifyDates(this.includeDates);

      let defaultCentury = null;
      let defaultYear = null;
      let defaultMonth = null;
      let defaultDay = null;
      let defaultTime = null;
      let defaultGranularity = "century";

      if (this.datesObject.indice.length === 1) {
        // only one century
        const soleCentury = this.datesObject.indice[0];

        const dataFromThisCentury = this.datesObject[soleCentury];
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
  }

  _buildCenturyGrid() {
    if (!this.datesObject) return;

    if (this.datesObject.dates && this.datesObject.dates.length >= 12) {
      const centuries = this.datesObject.indice;

      const $centuryGrid = createElement({
        className: "grid",
        innerHtml: "" + '<div class="gridHeading"> Select a century</div>',
      });

      centuries.forEach((c) => {
        const $item = createElement({
          tagName: "button",
          className: "centuryBtn",
          innerHtml: `${c}00`,
        });

        $item.addEventListener("click", () => {
          this._setState({ century: c });
        });

        $centuryGrid.appendChild($item);
      });

      return $centuryGrid;
    } else {
      return this._buildList(this.datesObject.dates);
    }
  }

  _buildYearGrid() {
    if (!this.datesObject) return;

    if (this.datesObject.dates && this.datesObject.dates.length >= 12) {
      const years = datesObject.indice;
      const monthOfYear = Array.apply(null, { length: 12 }).map(
        Number.call,
        Number
      );

      const $yearGrid = createElement({
        className: "grid",
        innerHtml:
          "" +
          '<div class="gridHeading"> Select a year</div>' +
          '<div class="gridBody"></div>',
      });

      const $yearGridBody = getEl(".gridBody", $yearGrid);

      years.forEach((y) => {
        const $yearItem = createElement({
          tagName: "gridRow",
          innerHtml:
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
      return this._buildList(this.datesObject.dates);
    }
  }

  _buildMonthGrid() {
    if (!this.datesObject) return;

    const year = this.state.year;

    if (
      this.datesObject[year].dates &&
      this.datesObject[year].dates.length > 12
    ) {
      const $monthGrid = createElement({
        className: "grid",
        innerHtml:
          "" +
          '<div class="gridHeading"></div>' +
          '<div class="gridBody"></div>',
      });

      // add back btn
      const $backBtn = createElement({
        tagName: "button",
        className: "backbtn",
        innerHtml: this.state.year,
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
            inactiveGridRow: !defined(this.datesObject[year][i]),
          }),
          innerHtml:
            "" +
            `<span class="gridLabel">${m}</span>` +
            '<span class="gridRowInner31"></span>',
        });

        $mItem.addEventListener("click", () => {
          if (defined(this.datesObject[year][i])) {
            this._setState({ month: i, day: null, time: null });
          }
        });

        const $monthInner = getEl(".gridRowInner31", $mItem);
        daysInMonth(i, year).forEach((d) => {
          const $dItem = createElement({
            tagName: "span",
            className: classNames({
              activeGrid:
                defined(this.datesObject[year][i]) &&
                defined(this.datesObject[year][i][d + 1]),
            }),
          });
          $monthInner.appendChild($dItem);
        });

        return $monthGrid;
      });
    } else {
      return this._buildList(this.datesObject[year].dates);
    }
  }

  _buildDayView() {
    if (!this.datesObject) return;

    if (
      this.datesObject[this.state.year][this.state.month].dates &&
      this.datesObject[this.state.year][this.state.month].dates.length > 31
    ) {
      const $dayView = createElement({
        className: "dayPicker",
        innerHtml: "" + '<div class="daypicker-wrapper"></div>',
      });

      const $dayViewWrapper = getEl(".daypicker-wrapper", $dayView);

      const $yearBackBtn = createElement({
        tagName: "button",
        className: "backbtn",
        innerHtml: this.state.year,
      });

      $yearBackBtn.addEventListener("click", () => {
        this._setState({ year: null, month: null, day: null, time: null });
      });

      const $monthBackBtn = createElement({
        tagName: "button",
        className: "backbtn",
        innerHtml: monthNames[this.state.month],
      });

      $monthBackBtn.addEventListener("click", () => {
        this._setState({ month: null, day: null, time: null });
      });

      $dayViewWrapper.appendChild($yearBackBtn);
      $dayViewWrapper.appendChild($monthBackBtn);

      this.dateSelector = new DateSelector(this.$dayView, {
        inline: true,
        includeDates: this.includeDates,
      });

      return this.dateSelector.$el;
    } else {
      return this._buildList(
        this.datesObject[this.state.year][this.state.month].dates
      );
    }
  }

  _buildHourView() {
    if (!this.datesObject) return;

    const timeOptions = this.datesObject[this.state.year][this.state.month][
      this.state.day
    ].dates.map((m) => ({
      value: m,
      label: formatDateTime(m),
    }));

    if (timeOptions.length > 24) {
      const headingSuffix = `${this.state.day} ${
        monthNames[this.state.month + 1]
      } ${this.state.year} `;

      const $hourView = createElement({
        className: "grid",
        innerHtml:
          "" +
          `<div class="gridHeading">Select an hour on ${headingSuffix}</div>` +
          "<div class='gridBody'></div>",
      });

      const $gridBody = getEl(".gridBody", $hourView);

      this.datesObject[this.state.year][this.state.month][
        this.state.day
      ].indice.forEach((h) => {
        const optionsPrefix = `${
          this.datesObject[this.state.year][this.state.month][this.state.day][h]
            .length
        }`;

        const $hourItem = createElement({
          tagName: "button",
          className: "dateBtn",
          innerHtml:
            "" +
            `<span>${h} : 00 - ${h + 1} : 00 </span> ` +
            `<span>(${optionsPrefix} options)</span>`,
        });

        $hourItem.addEventListener("click", () => {
          this._setState({ hour: h });
        });

        $gridBody.appendChild($hourItem);
      });

      return $hourView;
    } else {
      return this._buildList(
        this.datesObject[this.state.year][this.state.month][this.state.day]
          .dates
      );
    }
  }

  _buildMinutesView() {
    if (!this.datesObject) return;

    const options =
      this.datesObject[this.state.year][this.state.month][this.state.day][
        this.state.hour
      ];

    return this._buildList(options);
  }

  _buildList(items) {
    if (!items) return;

    const $list = createElement({
      className: "grid",
      innerHtml:
        "" +
        '<div class="gridHeading">Select a time</div>' +
        '<div class="gridBody"></div>',
    });

    const $gridBody = getEl(".gridBody", $list);

    items.forEach((item) => {
      const $item = createElement({
        tagName: "button",
        className: "dateBtn",
        innerHtml: defined(this.opts.dateFormat)
          ? dFormatter(
              item,
              this.opts.dateFormat.currentTime,
              this.opts.dateFormat.asPeriod
            )
          : formatDateTime(item),
      });

      $item.addEventListener("click", () => {
        this.closePicker(item);

        if (this.opts.onChange) {
          this.opts.onChange(item);
        }
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
}
