function contains (array, target) {
  return array.indexOf(target) !== -1;
}

function merge (target, source) {
  for (const item of source) {
    target.push(item);
  }

  return target;
}

module.exports = {
  contains,
  merge,
};
