import localeEn from "locale/en";

export default {
  classes: "",
  locale: localeEn,
  startDate: new Date(),
  firstDay: "",
  weekends: [6, 0],
  dateFormat: "",
  selectedDate: false,

  showOtherMonths: true,
  selectOtherMonths: true,
  moveToOtherMonthsOnSelect: true,

  showOtherYears: true,
  selectOtherYears: true,
  moveToOtherYearsOnSelect: true,

  monthsField: "monthsShort",

  // navigation
  prevHtml: '<svg><path d="M 17,12 l -5,5 l 5,5"></path></svg>',
  nextHtml: '<svg><path d="M 14,12 l 5,5 l -5,5"></path></svg>',
  navTitles: {
    days: "MMMM, <i>yyyy</i>",
    months: "yyyy",
    years: "yyyy1 - yyyy2",
  },

  onSelect: false,
  onChangeViewDate: false,
  onShow: false,
  onHide: false,
};
