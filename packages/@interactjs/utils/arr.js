/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

const contains = (array, target) => array.indexOf(target) !== -1;
const remove = (array, target) => array.splice(array.indexOf(target), 1);
const merge = (target, source) => {
  for (const item of source) {
    target.push(item);
  }
  return target;
};
const from = source => merge([], source);
const findIndex = (array, func) => {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i;
    }
  }
  return -1;
};
const find = (array, func) => array[findIndex(array, func)];
export { contains, find, findIndex, from, merge, remove };
//# sourceMappingURL=arr.js.map
