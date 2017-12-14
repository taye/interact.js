const is = require('./is');

module.exports = function clone (source) {
  const dest = {};
  for (const prop in source) {
    if (is.object(source[prop])) {
      dest[prop] = clone(source[prop]);
    } else {
      dest[prop] = source[prop];
    }
  }
  return dest;
};
