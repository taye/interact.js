"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copyAction = copyAction;
exports.sign = void 0;
exports.warnOnce = warnOnce;
var _window = require("./window");
function warnOnce(method, message) {
  let warned = false;
  return function () {
    if (!warned) {
      ;
      _window.window.console.warn(message);
      warned = true;
    }
    return method.apply(this, arguments);
  };
}
function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;
  return dest;
}
const sign = n => n >= 0 ? 1 : -1;
exports.sign = sign;
//# sourceMappingURL=misc.js.map