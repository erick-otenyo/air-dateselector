import { getParsedDate, getDaysCount } from "../utils";

export default class DateselectorKeyboard {
  pressedKeys = new Set();

  hotKeys = new Map([
    [
      [
        ["Control", "ArrowRight"],
        ["Control", "ArrowUp"],
      ],
      (dateParts) => dateParts.month++,
    ],
    [
      [
        ["Control", "ArrowLeft"],
        ["Control", "ArrowDown"],
      ],
      (dateParts) => dateParts.month--,
    ],
    [
      [
        ["Shift", "ArrowRight"],
        ["Shift", "ArrowUp"],
      ],
      (dateParts) => dateParts.year++,
    ],
    [
      [
        ["Shift", "ArrowLeft"],
        ["Shift", "ArrowDown"],
      ],
      (dateParts) => dateParts.year--,
    ],
    [
      [
        ["Alt", "ArrowRight"],
        ["Alt", "ArrowUp"],
      ],
      (dateParts) => (dateParts.year += 10),
    ],
    [
      [
        ["Alt", "ArrowLeft"],
        ["Alt", "ArrowDown"],
      ],
      (dateParts) => (dateParts.year -= 10),
    ],
    [["Control", "Shift", "ArrowUp"], (dateParts, ds) => ds.up()],
  ]);

  constructor({ ds, opts }) {
    this.ds = ds;
    this.opts = opts;

    this.init();
  }

  init() {
    this.bindKeyboardEvents();
  }

  bindKeyboardEvents() {
    let { $el } = this.ds;

    $el.addEventListener("keydown", this.onKeyDown);
    $el.addEventListener("keyup", this.onKeyUp);
  }

  destroy() {
    let { $el } = this.ds;

    $el.removeEventListener("keydown", this.onKeyDown);
    $el.removeEventListener("keyup", this.onKeyUp);
    this.hotKeys = null;
    this.pressedKeys = null;
  }

  getInitialFocusDate() {
    let {
      focusDate,
      selectedDate,
      parsedViewDate: { year, month },
    } = this.ds;

    let potentialFocused = focusDate || selectedDate;

    if (!potentialFocused) {
      potentialFocused = new Date(year, month, new Date().getDate());
    }

    return potentialFocused;
  }

  focusNextCell(keyName) {
    let initialFocusDate = this.getInitialFocusDate(),
      parsedFocusDate = getParsedDate(initialFocusDate),
      y = parsedFocusDate.year,
      m = parsedFocusDate.month,
      d = parsedFocusDate.date;

    switch (keyName) {
      case "ArrowLeft":
        d -= 1;
        break;
      case "ArrowUp":
        d -= 7;
        break;
      case "ArrowRight":
        d += 1;
        break;
      case "ArrowDown":
        d += 7;
        break;
    }

    let newFocusedDate = this.ds.getClampedDate(new Date(y, m, d));
    this.ds.setFocusDate(newFocusedDate, { viewDateTransition: true });
  }

  registerKey(keyName) {
    this.pressedKeys.add(keyName);
  }

  removeKey(keyName) {
    this.pressedKeys.delete(keyName);
  }

  handleHotKey = (combination) => {
    let fn = this.hotKeys.get(combination),
      dateParts = getParsedDate(this.getInitialFocusDate());

    fn(dateParts, this.ds);

    let { year, month, date } = dateParts;

    let totalDaysInNextMonth = getDaysCount(new Date(year, month));

    if (totalDaysInNextMonth < date) {
      date = totalDaysInNextMonth;
    }

    let newFocusedDate = this.ds.getClampedDate(new Date(year, month, date));

    this.ds.setFocusDate(newFocusedDate, { viewDateTransition: true });
  };

  /**
   * Checks if one of hot key is pressed. If so, then returns array of matched combinations
   * @return {boolean | Array}
   */
  isHotKeyPressed = () => {
    let hotKeyIsPressed = false;
    let pressedKeysLength = this.pressedKeys.size;
    let isAllKeysArePressed = (key) => this.pressedKeys.has(key);

    for (let [combinations] of this.hotKeys) {
      if (hotKeyIsPressed) break;
      if (Array.isArray(combinations[0])) {
        combinations.forEach((combination) => {
          if (hotKeyIsPressed || pressedKeysLength !== combination.length)
            return;
          hotKeyIsPressed =
            combination.every(isAllKeysArePressed) && combinations;
        });
      } else {
        if (pressedKeysLength !== combinations.length) continue;
        hotKeyIsPressed =
          combinations.every(isAllKeysArePressed) && combinations;
      }
    }

    return hotKeyIsPressed;
  };

  isArrow = (keyCode) => {
    return keyCode >= 37 && keyCode <= 40;
  };

  onKeyDown = (e) => {
    let { key, which } = e;
    let {
      ds,
      ds: { focusDate },
      opts,
    } = this;

    this.registerKey(key);

    let pressedHotKey = this.isHotKeyPressed();

    if (pressedHotKey) {
      e.preventDefault();
      this.handleHotKey(pressedHotKey);
      return;
    }

    if (this.isArrow(which)) {
      e.preventDefault();
      this.focusNextCell(key);
      return;
    }

    if (key === "Enter") {
      if (focusDate) {
        ds.selectDate(focusDate);
        return;
      }
    }

    if (key === "Escape") {
      this.ds.hide();
    }
  };

  onKeyUp = (e) => {
    this.removeKey(e.key);
  };
}
