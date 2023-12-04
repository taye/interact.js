"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = normalize;
var _is = _interopRequireDefault(require("./is"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function normalize(type, listeners, filter = _typeOrPrefix => true, result) {
  result = result || {};
  if (_is.default.string(type) && type.search(' ') !== -1) {
    type = split(type);
  }
  if (_is.default.array(type)) {
    type.forEach(t => normalize(t, listeners, filter, result));
    return result;
  }

  // before:  type = [{ drag: () => {} }], listeners = undefined
  // after:   type = ''                  , listeners = [{ drag: () => {} }]
  if (_is.default.object(type)) {
    listeners = type;
    type = '';
  }
  if (_is.default.func(listeners) && filter(type)) {
    result[type] = result[type] || [];
    result[type].push(listeners);
  } else if (_is.default.array(listeners)) {
    for (const l of listeners) {
      normalize(type, l, filter, result);
    }
  } else if (_is.default.object(listeners)) {
    for (const prefix in listeners) {
      const combinedTypes = split(prefix).map(p => `${type}${p}`);
      normalize(combinedTypes, listeners[prefix], filter, result);
    }
  }
  return result;
}
function split(type) {
  return type.trim().split(/ +/);
}
//# sourceMappingURL=normalizeListeners.js.map