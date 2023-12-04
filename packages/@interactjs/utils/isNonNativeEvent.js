"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isNonNativeEvent;
function isNonNativeEvent(type, actions) {
  if (actions.phaselessTypes[type]) {
    return true;
  }
  for (const name in actions.map) {
    if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
      return true;
    }
  }
  return false;
}
//# sourceMappingURL=isNonNativeEvent.js.map