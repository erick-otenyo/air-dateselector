import localeEn from "./locale/en";
import consts from "./consts";

export default {
  classes: "",
  inline: false,
  locale: localeEn,
  startDate: new Date(),
  firstDay: "",
  weekends: [6, 0],
  dateFormat: "",
  keyboardNav: true,
  selectedDate: false,
  container: "",
  isMobile: false,
  visible: false,

  position: "bottom left",
  offset: 12,

  showOtherMonths: true,
  selectOtherMonths: true,
  moveToOtherMonthsOnSelect: true,

  showOtherYears: true,
  selectOtherYears: true,
  moveToOtherYearsOnSelect: true,

  monthsField: "monthsShort",

  showEvent: "focus",
  autoClose: true,

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
