"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extend;
function extend(dest, source) {
  for (const prop in source) {
    ;
    dest[prop] = source[prop];
  }
  const ret = dest;
  return ret;
}
//# sourceMappingURL=extend.js.map