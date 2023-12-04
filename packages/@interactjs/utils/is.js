"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isWindow = _interopRequireDefault(require("./isWindow"));
var win = _interopRequireWildcard(require("./window"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const window = thing => thing === win.window || (0, _isWindow.default)(thing);
const docFrag = thing => object(thing) && thing.nodeType === 11;
const object = thing => !!thing && typeof thing === 'object';
const func = thing => typeof thing === 'function';
const number = thing => typeof thing === 'number';
const bool = thing => typeof thing === 'boolean';
const string = thing => typeof thing === 'string';
const element = thing => {
  if (!thing || typeof thing !== 'object') {
    return false;
  }
  const _window = win.getWindow(thing) || win.window;
  return /object|function/.test(typeof Element) ? thing instanceof Element || thing instanceof _window.Element : thing.nodeType === 1 && typeof thing.nodeName === 'string';
};
const plainObject = thing => object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString());
const array = thing => object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
var _default = exports.default = {
  window,
  docFrag,
  object,
  func,
  number,
  bool,
  string,
  element,
  plainObject,
  array
};
//# sourceMappingURL=is.js.map