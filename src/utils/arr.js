function contains (array, target) {
  return array.indexOf(target) !== -1;
}

function merge (target, source) {
  for (const item of source) {
    target.push(item);
  }

  return target;
}

function from (source) {
  return module.exports.merge([], source);
}

module.exports = {
  contains,
  merge,
  from,
};
