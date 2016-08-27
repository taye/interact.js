function indexOf (array, target) {
  for (let i = 0, len = array.length; i < len; i++) {
    if (array[i] === target) {
      return i;
    }
  }

  return -1;
}

function contains (array, target) {
  return indexOf(array, target) !== -1;
}

function merge (target, source) {
  for (let i = 0; i < source.length; i++) {
    target.push(source[i]);
  }

  return target;
}

function filter (array, test) {
  const result = [];

  for (let i = 0; i < array.length; i++) {
    if (test(array[i])) {
      result.push(array[i]);
    }
  }

  return result;
}

module.exports = {
  indexOf,
  contains,
  merge,
  filter,
};
