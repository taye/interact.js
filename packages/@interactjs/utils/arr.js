export const contains = (array, target) => array.indexOf(target) !== -1;
export const remove = (array, target) => array.splice(array.indexOf(target), 1);
export const merge = (target, source) => {
  for (const item of source) {
    target.push(item);
  }

  return target;
};
export const from = source => merge([], source);
export const findIndex = (array, func) => {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i;
    }
  }

  return -1;
};
export const find = (array, func) => array[findIndex(array, func)];
//# sourceMappingURL=arr.js.map