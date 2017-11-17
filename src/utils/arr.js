function contains (array, target) {
  return array.indexOf(target) !== -1;
}

function merge (target, source) {
  for (let i = 0; i < source.length; i++) {
    target.push(source[i]);
  }

  return target;
}

module.exports = {
  contains,
  merge,
};
