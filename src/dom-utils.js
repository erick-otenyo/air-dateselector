/**
 * Finds DOM element
 * @param {HTMLElement, String} el
 * @param {Document|HTMLElement} [context=document]
 */
export function getEl(el, context = document) {
  return typeof el === "string" ? context["querySelector"](el) : el;
}

/**
 * Creates HTML DOM element
 * @param {String} [tagName] - element's tag name
 * @param {String} [className]
 * @param {String} [innerHTML]
 * @param {String} [id]
 * @param {Object} [attrs]
 * @returns {HTMLElement}
 */
export function createElement({
  tagName = "div",
  className = "",
  innerHTML = "",
  id = "",
  attrs = {},
} = {}) {
  let $element = document.createElement(tagName);
  if (className) $element.classList.add(...className.split(" "));
  if (id) $element.id = id;

  if (innerHTML) {
    $element.innerHTML = innerHTML;
  }

  if (attrs) {
    setAttribute($element, attrs);
  }

  return $element;
}

/**
 * Sets multiple attributes of element
 * @param {HTMLElement} el
 * @param {Object} attrs - attributes object
 * @returns {HTMLElement}
 */
export function setAttribute(el, attrs) {
  for (let [name, value] of Object.entries(attrs)) {
    if (value === undefined) continue;

    el.setAttribute(name, value);
  }
  return el;
}

/**
 * Inserts newElement after targetElement
 * @param {HTMLElement} newElement - element to be inserted
 * @param {HTMLElement} targetElement - after which must be inserted
 * @return {HTMLElement} newElement
 */
export function insertAfter(newElement, targetElement) {
  targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
  return newElement;
}

export function toggleClass(el, classes) {
  for (let className in classes) {
    if (classes[className]) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }
}

export function addClass(el, ...classes) {
  if (el.length) {
    el.forEach((node) => {
      node.classList.add(...classes);
    });
  } else {
    el.classList.add(...classes);
  }
}

export function removeClass(el, ...classes) {
  if (el.length) {
    el.forEach((node) => {
      node.classList.remove(...classes);
    });
  } else {
    el.classList.remove(...classes);
  }
}

/**
 * Class names' handler, inspired by https://github.com/JedWatson/classnames but very simplified
 * @param {String|Object} classes - class names, could contain strings or object
 */
export function classNames(...classes) {
  let classNames = [];

  classes.forEach((c) => {
    if (typeof c === "object") {
      for (let cName in c) {
        if (c[cName]) {
          classNames.push(cName);
        }
      }
    } else if (c) {
      classNames.push(c);
    }
  });
  return classNames.join(" ");
}

/**
 * Adds event listener to DOM element
 * @param {HTMLElement|HTMLCollection} el
 * @param {String} type
 * @param {Function} listener
 */
export function addEventListener(el, type, listener) {
  if (el.length) {
    el.forEach((e) => {
      e.addEventListener(type, listener);
    });
  } else {
    el.addEventListener(type, listener);
  }
}

/**
 * Finds closest DOM element to passed target. Similar to jQuery.closest()
 * @param {HTMLElement} target
 * @param {String} selector
 * @return {HTMLElement|Boolean}
 */
export function closest(target, selector) {
  if (!target || target === document || target instanceof DocumentFragment)
    return false;

  if (target.matches(selector)) {
    return target;
  }

  return closest(target.parentNode, selector);
}
