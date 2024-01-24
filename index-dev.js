/* eslint-disable */

import DateTimeSelector from "datetime-selector";

let $input1 = document.querySelector("#ds1");

let opts = {
  includeDates: [
    "2024-01-19T00:00:00.000Z",
    "2024-02-01T00:00:00.000Z",
    "2024-02-01T01:00:00.000Z",
  ],
};

window.ds1 = new DateTimeSelector($input1, opts);

if (module.hot) {
  module.hot.accept();
}
