import { endOfMonth, parseISO } from "date-fns";
import { format as dateFormat } from "date-fns/format";
import uniq from "lodash/uniq";
import merge from "lodash/merge";

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

export const defined = (value) => {
  return value !== undefined && value !== null;
};

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
  let dObj;
  if (typeof d === "string") {
    dObj = parseISO(d);
  } else {
    dObj = d;
  }

  if (defined(locale)) {
    return dObj.toLocaleDateString(locale);
  }
  return [
    pad(dObj.getDate()),
    pad(dObj.getMonth() + 1),
    dObj.getFullYear(),
  ].join("/");
}

/**
 * Formats the time according to the locale if provided, otherwise in a hh:mm:ss format.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted time.
 */
export function formatTime(d, locale) {
  let dObj;
  if (typeof d === "string") {
    dObj = parseISO(d);
  } else {
    dObj = d;
  }

  if (defined(locale)) {
    return dObj.toLocaleTimeString(locale);
  }
  return [
    pad(dObj.getHours()),
    pad(dObj.getMinutes()),
    pad(dObj.getSeconds()),
  ].join(":");
}

/**
 * Combines {@link #formatDate} and {@link #formatTime}.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted date and time with a comma separating them.
 */
export function formatDateTime(d, locale) {
  let dObj;
  if (typeof d === "string") {
    dObj = parseISO(d);
  } else {
    dObj = d;
  }

  return formatDate(dObj, locale) + ", " + formatTime(dObj, locale);
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

export function getPentadFromDateString(date) {
  let dateObj;

  if (typeof date === "string") {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  const lastDayOfMonth = endOfMonth(dateObj).getDate();

  const day = dateObj.getDate();

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

export function dFormatter(date, format, asPeriod) {
  let dateObj;

  if (typeof date === "string") {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  let formatted = dateFormat(dateObj, format);

  if (asPeriod) {
    if (asPeriod === "pentadal") {
      const [pentad, duration] = getPentadFromDateString(date);

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
  return uniq(yearData.map((d) => d.getMonth()));
}

function getDaysForMonth(monthData) {
  // Get all available days given a month in a year.
  return uniq(monthData.map((m) => m.getDate()));
}

function getOneHour(dayData, hourIndex) {
  // All data from certain month of that year.
  return dayData.filter((y) => y.getHours() === hourIndex);
}

function getHoursForDay(dayData) {
  return uniq(dayData.map((m) => m.getHours()));
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
  const years = uniq(dates.map((date) => date.getFullYear()));
  const centuries = uniq(years.map((year) => Math.floor(year / 100)));
  const result = centuries.reduce(
    (accumulator, currentValue) =>
      merge(accumulator, objectifyCenturyData(currentValue, dates, years)),
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
        merge(accumulator, objectifyYearData(currentValue, dates, years)),
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
