"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.restrictSize = exports.default = void 0;
var _extend = _interopRequireDefault(require("../../utils/extend.js"));
var rectUtils = _interopRequireWildcard(require("../../utils/rect.js"));
var _base = require("../base");
var _edges = require("./edges");
var _pointer = require("./pointer");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const noMin = {
  width: -Infinity,
  height: -Infinity
};
const noMax = {
  width: +Infinity,
  height: +Infinity
};
function start(arg) {
  return _edges.restrictEdges.start(arg);
}
function set(arg) {
  const {
    interaction,
    state,
    rect,
    edges
  } = arg;
  const {
    options
  } = state;
  if (!edges) {
    return;
  }
  const minSize = rectUtils.tlbrToXywh((0, _pointer.getRestrictionRect)(options.min, interaction, arg.coords)) || noMin;
  const maxSize = rectUtils.tlbrToXywh((0, _pointer.getRestrictionRect)(options.max, interaction, arg.coords)) || noMax;
  state.options = {
    endOnly: options.endOnly,
    inner: (0, _extend.default)({}, _edges.restrictEdges.noInner),
    outer: (0, _extend.default)({}, _edges.restrictEdges.noOuter)
  };
  if (edges.top) {
    state.options.inner.top = rect.bottom - minSize.height;
    state.options.outer.top = rect.bottom - maxSize.height;
  } else if (edges.bottom) {
    state.options.inner.bottom = rect.top + minSize.height;
    state.options.outer.bottom = rect.top + maxSize.height;
  }
  if (edges.left) {
    state.options.inner.left = rect.right - minSize.width;
    state.options.outer.left = rect.right - maxSize.width;
  } else if (edges.right) {
    state.options.inner.right = rect.left + minSize.width;
    state.options.outer.right = rect.left + maxSize.width;
  }
  _edges.restrictEdges.set(arg);
  state.options = options;
}
const defaults = {
  min: null,
  max: null,
  endOnly: false,
  enabled: false
};
const restrictSize = exports.restrictSize = {
  start,
  set,
  defaults
};
var _default = exports.default = (0, _base.makeModifier)(restrictSize, 'restrictSize');
//# sourceMappingURL=size.js.map