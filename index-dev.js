/* eslint-disable */

import Dateselector from "dateselector";
import en from "locale/en";

let $input1 = document.querySelector("#ds1");

let opts = {
  locale: en,
  includeDates: [
    "2024-01-19T00:00:00.000Z",
    "2024-02-01T00:00:00.000Z",
    "2024-02-01T01:00:00.000Z",
  ],
  autoclose: false,
  inline: true,
};

window.ds1 = new Dateselector($input1, opts);

if (module.hot) {
  module.hot.accept();
}
