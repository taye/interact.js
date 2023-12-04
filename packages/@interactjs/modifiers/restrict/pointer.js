"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getRestrictionRect = getRestrictionRect;
exports.restrict = void 0;
var _extend = _interopRequireDefault(require("../../utils/extend.js"));
var _is = _interopRequireDefault(require("../../utils/is.js"));
var rectUtils = _interopRequireWildcard(require("../../utils/rect.js"));
var _base = require("../base");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function start({
  rect,
  startOffset,
  state,
  interaction,
  pageCoords
}) {
  const {
    options
  } = state;
  const {
    elementRect
  } = options;
  const offset = (0, _extend.default)({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  }, options.offset || {});
  if (rect && elementRect) {
    const restriction = getRestrictionRect(options.restriction, interaction, pageCoords);
    if (restriction) {
      const widthDiff = restriction.right - restriction.left - rect.width;
      const heightDiff = restriction.bottom - restriction.top - rect.height;
      if (widthDiff < 0) {
        offset.left += widthDiff;
        offset.right += widthDiff;
      }
      if (heightDiff < 0) {
        offset.top += heightDiff;
        offset.bottom += heightDiff;
      }
    }
    offset.left += startOffset.left - rect.width * elementRect.left;
    offset.top += startOffset.top - rect.height * elementRect.top;
    offset.right += startOffset.right - rect.width * (1 - elementRect.right);
    offset.bottom += startOffset.bottom - rect.height * (1 - elementRect.bottom);
  }
  state.offset = offset;
}
function set({
  coords,
  interaction,
  state
}) {
  const {
    options,
    offset
  } = state;
  const restriction = getRestrictionRect(options.restriction, interaction, coords);
  if (!restriction) return;
  const rect = rectUtils.xywhToTlbr(restriction);
  coords.x = Math.max(Math.min(rect.right - offset.right, coords.x), rect.left + offset.left);
  coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top + offset.top);
}
function getRestrictionRect(value, interaction, coords) {
  if (_is.default.func(value)) {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction]);
  } else {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element);
  }
}
const defaults = {
  restriction: null,
  elementRect: null,
  offset: null,
  endOnly: false,
  enabled: false
};
const restrict = exports.restrict = {
  start,
  set,
  defaults
};
var _default = exports.default = (0, _base.makeModifier)(restrict, 'restrict');
//# sourceMappingURL=pointer.js.map