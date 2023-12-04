"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = clone;
var arr = _interopRequireWildcard(require("./arr"));
var _is = _interopRequireDefault(require("./is"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// tslint:disable-next-line ban-types
function clone(source) {
  const dest = {};
  for (const prop in source) {
    const value = source[prop];
    if (_is.default.plainObject(value)) {
      dest[prop] = clone(value);
    } else if (_is.default.array(value)) {
      dest[prop] = arr.from(value);
    } else {
      dest[prop] = value;
    }
  }
  return dest;
}
//# sourceMappingURL=clone.js.map