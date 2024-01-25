import consts from "consts";

import localeEn from "./locale/en";

import { deepMerge, defined } from "utils";

function replacer(str, reg, data) {
  return str.replace(reg, function (match, p1, p2, p3) {
    return p1 + data + p3;
  });
}

export function dateFormat(date, string, locale = localeEn) {
  date = createDate(date);

  let result = string,
    parsedDate = getParsedDate(date),
    dayPeriod = parsedDate.dayPeriod,
    decade = getDecade(date);

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
 * Calculates amount of days in passed date
 * @param {Date} date
 * @return {number}
 */
export function getDaysCount(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get detailed date object
 * @param {Date} date
 * @return {{
 *  date: number,
 *  hours: number,
 *  fullDate: (string|*),
 *  month: number,
 *  fullHours: (string|*),
 *  year: number,
 *  minutes: number,
 *  fullMonth: string,
 *  day: number,
 *  fullMinutes: (string|*),
 *  hours12: number,
 *  dayPeriod: 'am' | 'pm'
 * }}
 */
export function getParsedDate(date) {
  let hours = date.getHours(),
    { hours: hours12, dayPeriod } = getDayPeriodFromHours24(hours);

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    fullMonth:
      date.getMonth() + 1 < 10
        ? "0" + (date.getMonth() + 1)
        : date.getMonth() + 1, // One based
    date: date.getDate(),
    fullDate: date.getDate() < 10 ? "0" + date.getDate() : date.getDate(),
    day: date.getDay(),
    hours,
    fullHours: getLeadingZeroNum(hours),
    hours12,
    dayPeriod,
    fullHours12: getLeadingZeroNum(hours12),
    minutes: date.getMinutes(),
    fullMinutes:
      date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes(),
  };
}

export function getDayPeriodFromHours24(hours) {
  let hours12 = hours % 12 === 0 ? 12 : hours % 12;
  let dayPeriod = hours > 11 ? "pm" : "am";

  return {
    dayPeriod,
    hours: hours12,
  };
}

/**
 * Converts 1 -> 01
 * @param {Number} num
 * @return {String|Number}
 */
export function getLeadingZeroNum(num) {
  return num < 10 ? "0" + num : num;
}

/**
 * Calculates current decade
 * @param {Date} date
 * @return {number[]} - array of two years, decade start - decade end
 */
export function getDecade(date) {
  let firstYear = Math.floor(date.getFullYear() / 10) * 10;
  return [firstYear, firstYear + 9];
}

/**
 * Subtract days from date
 * @param {Date} date
 * @param {Number} days
 * @return {Date}
 */
export function subDays(date, days) {
  let { year, month, date: _date } = getParsedDate(date);
  return new Date(year, month, _date - days);
}

/**
 * Checks if passed dates are the same
 * @param {Date} date1
 * @param {Date} date2
 * @param {String} cellType - one of days|months|years
 * @return {boolean}
 */
export function isSameDate(date1, date2, cellType = consts.days) {
  if (!date1 || !date2) return false;
  let d1 = getParsedDate(date1),
    d2 = getParsedDate(date2),
    conditions = {
      [consts.days]:
        d1.date === d2.date && d1.month === d2.month && d1.year === d2.year,
      [consts.months]: d1.month === d2.month && d1.year === d2.year,
      [consts.years]: d1.year === d2.year,
    };

  return conditions[cellType];
}

export function isDateBigger(date, comparedDate, loose) {
  let d1 = copyDate(date, false).getTime(),
    d2 = copyDate(comparedDate, false).getTime();

  return loose ? d1 >= d2 : d1 > d2;
}

export function isDateSmaller(date, comparedDate) {
  return !isDateBigger(date, comparedDate, true);
}

/**
 * Copies date
 * @param {Date} date
 * @param {Boolean} [keepTime] - should keep the time in a new date or not
 * @return {Date}
 */
export function copyDate(date, keepTime = true) {
  let newDate = new Date(date.getTime());

  if (typeof keepTime === "boolean" && !keepTime) {
    resetTime(newDate);
  }

  return newDate;
}

export function resetTime(date) {
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isDateBetween(date, dateFrom, dateTo) {
  return isDateBigger(date, dateFrom) && isDateSmaller(date, dateTo);
}

/**
 * Creates Date object from string or number. If passed param is instance of Date, then just returns it.
 * @param {number|string|Date} date
 * @return {Date | boolean}
 */
export function createDate(date) {
  let resultDate = date;

  if (!(date instanceof Date)) {
    resultDate = new Date(date);
  }

  if (isNaN(resultDate.getTime())) {
    console.log(`Unable to convert value "${date}" to Date object`);
    resultDate = false;
  }

  return resultDate;
}

export function getWordBoundaryRegExp(sign) {
  let symbols = "\\s|\\.|-|/|\\\\|,|\\$|\\!|\\?|:|;";

  return new RegExp(
    "(^|>|" + symbols + ")(" + sign + ")($|<|" + symbols + ")",
    "g"
  );
}

export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Puts a leading 0 in front of a number of it's less than 10.
 *
 * @param {number} s A number to pad
 * @returns {string} A string representing a two-digit number.
 */
function pad(s) {
  return s < 10 ? "0" + s : `${s}`;
}

/**
 * Formats a date according to the locale if provided, otherwise in a dd/mm/yyyy format.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted date.
 */
export function formatDate(d, locale) {
  d = createDate(d);
  if (defined(locale)) {
    return dObj.toLocaleDateString(locale);
  }
  return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join("/");
}

/**
 * Formats the time according to the locale if provided, otherwise in a hh:mm:ss format.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted time.
 */
export function formatTime(d, locale) {
  d = createDate(d);
  if (defined(locale)) {
    return d.toLocaleTimeString(locale);
  }
  return [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(
    ":"
  );
}

/**
 * Combines {@link #formatDate} and {@link #formatTime}.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted date and time with a comma separating them.
 */
export function formatDateTime(d, locale) {
  d = createDate(d);
  return formatDate(d, locale) + ", " + formatTime(d, locale);
}

const getOrdinalNum = (number) => {
  let selector;

  if (number <= 0) {
    selector = 4;
  } else if ((number > 3 && number < 21) || number % 10 > 3) {
    selector = 0;
  } else {
    selector = number % 10;
  }

  return number + ["th", "st", "nd", "rd", ""][selector];
};

/**
 *
 *  Get the last day of the month.
 *
 * @param {Date} date
 * @returns {Date} The last day of the month.
 */

const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export function getPentadFromDateString(d) {
  d = createDate(d);

  const lastDayOfMonth = endOfMonth(d).getDate();

  const day = d.getDate();

  if (day <= 5) {
    return [1, "1-5th", 1];
  }

  if (day <= 10) {
    return [2, "6-10th", 6];
  }

  if (day <= 15) {
    return [3, "11-15th", 11];
  }

  if (day <= 20) {
    return [4, "16-20th", 16];
  }

  if (day <= 25) {
    return [4, "21-25th", 21];
  }
  return [6, `26-${getOrdinalNum(lastDayOfMonth)}`, 26];
}

export function dFormatter(d, format, asPeriod) {
  d = createDate(d);

  let formatted = dateFormat(d, format);

  if (asPeriod) {
    if (asPeriod === "pentadal") {
      const [pentad, duration] = getPentadFromDateString(d);

      formatted = `${formatted} - P${pentad} ${duration}`;
    }
  }

  return formatted;
}

export function daysInMonth(month, year) {
  const n = new Date(year, month, 0).getDate();
  return Array.apply(null, { length: n }).map(Number.call, Number);
}

function getOneYear(year, dates) {
  // All data from a given year.
  return dates.filter((d) => d.getFullYear() === year);
}

function getOneMonth(yearData, monthIndex) {
  // All data from certain month of that year.
  return yearData.filter((y) => y.getMonth() === monthIndex);
}

function getOneDay(monthData, dayIndex) {
  return monthData.filter((m) => m.getDate() === dayIndex);
}

function getMonthForYear(yearData) {
  // get available months for a given year
  return [...new Set(yearData.map((d) => d.getMonth()))];
}

function getDaysForMonth(monthData) {
  // Get all available days given a month in a year.
  return [...new Set(monthData.map((m) => m.getDate()))];
}

function getOneHour(dayData, hourIndex) {
  // All data from certain month of that year.
  return dayData.filter((y) => y.getHours() === hourIndex);
}

function getHoursForDay(dayData) {
  return [...new Set(dayData.map((m) => m.getHours()))];
}

function getOneCentury(century, dates) {
  return dates.filter((d) => Math.floor(d.getFullYear() / 100) === century);
}

/**
 * Process an array of dates into layered objects of years, months and days.
 * @param  {Date[]} An array of dates.
 * @return {Object} Returns an object whose keys are years, whose values are objects whose keys are months (0=Jan),
 *   whose values are objects whose keys are days, whose values are arrays of all the datetimes on that day.
 */
export function objectifyDates(dates) {
  const years = [...new Set(dates.map((date) => date.getFullYear()))];
  const centuries = [...new Set(years.map((year) => Math.floor(year / 100)))];
  const result = centuries.reduce(
    (accumulator, currentValue) =>
      deepMerge(accumulator, objectifyCenturyData(currentValue, dates, years)),
    {}
  );
  result.dates = dates;
  result.indice = centuries;
  return result;
}

function objectifyCenturyData(century, dates, years) {
  // century is a number like 18, 19 or 20.
  const yearsInThisCentury = years.filter(
    (year) => Math.floor(year / 100) === century
  );
  const centuryData = getOneCentury(century, dates);
  const centuryDates = {
    [century]: yearsInThisCentury.reduce(
      (accumulator, currentValue) =>
        deepMerge(accumulator, objectifyYearData(currentValue, dates, years)),
      {}
    ),
  };
  centuryDates[century].dates = centuryData;
  centuryDates[century].indice = yearsInThisCentury;
  return centuryDates;
}

function objectifyYearData(year, dates) {
  const yearData = getOneYear(year, dates);
  const monthInYear = {};
  getMonthForYear(yearData).forEach((monthIndex) => {
    const monthData = getOneMonth(yearData, monthIndex);
    const daysInMonth = {};

    getDaysForMonth(monthData).forEach((dayIndex) => {
      daysInMonth.dates = monthData;
      daysInMonth.indice = getDaysForMonth(monthData);
      const hoursInDay = {};
      const dayData = getOneDay(monthData, dayIndex);
      getHoursForDay(dayData).forEach((hourIndex) => {
        hoursInDay[hourIndex] = getOneHour(dayData, hourIndex);
        hoursInDay.dates = dayData;
        hoursInDay.indice = getHoursForDay(dayData);
      });

      daysInMonth[dayIndex] = hoursInDay;
    });
    monthInYear[monthIndex] = daysInMonth;
    monthInYear.indice = getMonthForYear(yearData);
    monthInYear.dates = yearData;
  });

  return { [year]: monthInYear };
}
