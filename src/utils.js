export const defined = (value) => {
  return value !== undefined && value !== null;
};

/**
 * Makes object deep copy
 * @param {Object} obj
 * @return {Object}
 */
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Clamps number between min and max
 * @param {Number} val
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 */
export function clamp(val, min, max) {
  return val > max ? max : val < min ? min : val;
}

/**
 * Deep merge of objects or arrays, used to merge options
 * @param {object|array} target - target object or array
 * @param {object|array} objects - source objects
 * @return {object|array}
 */
export function deepMerge(target, ...objects) {
  objects
    .filter((o) => o)
    .forEach((obj) => {
      for (let [key, value] of Object.entries(obj)) {
        let arrayOrObject =
          value !== undefined
            ? value.toString() === ("[object Object]" || "[object Array]")
            : false;

        if (arrayOrObject) {
          let targetType =
              target[key] !== undefined ? target[key].toString() : undefined,
            sourceType = value.toString(),
            initialValue = Array.isArray(value) ? [] : {};

          // If target and source types are different, e.g. we try to merge number with object,
          // then take source type
          target[key] = target[key]
            ? targetType !== sourceType
              ? initialValue
              : target[key]
            : initialValue;

          deepMerge(target[key], value);
        } else {
          target[key] = value;
        }
      }
    });

  return target;
}
