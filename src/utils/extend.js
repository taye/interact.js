module.exports = function extend (dest, source) {
  for (const prop in source) {
    dest[prop] = source[prop];
  }
  return dest;
};
