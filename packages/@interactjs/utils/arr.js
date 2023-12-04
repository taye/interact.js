"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.remove = exports.merge = exports.from = exports.findIndex = exports.find = exports.contains = void 0;
const contains = (array, target) => array.indexOf(target) !== -1;
exports.contains = contains;
const remove = (array, target) => array.splice(array.indexOf(target), 1);
exports.remove = remove;
const merge = (target, source) => {
  for (const item of source) {
    target.push(item);
  }
  return target;
};
exports.merge = merge;
const from = source => merge([], source);
exports.from = from;
const findIndex = (array, func) => {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i;
    }
  }
  return -1;
};
exports.findIndex = findIndex;
const find = (array, func) => array[findIndex(array, func)];
exports.find = find;
//# sourceMappingURL=arr.js.map