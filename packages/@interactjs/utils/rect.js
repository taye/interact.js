"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addEdges = addEdges;
exports.getStringOptionResult = getStringOptionResult;
exports.rectToXY = rectToXY;
exports.resolveRectLike = resolveRectLike;
exports.tlbrToXywh = tlbrToXywh;
exports.toFullRect = toFullRect;
exports.xywhToTlbr = xywhToTlbr;
var _domUtils = require("./domUtils");
var _extend = _interopRequireDefault(require("./extend"));
var _is = _interopRequireDefault(require("./is"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getStringOptionResult(value, target, element) {
  if (value === 'parent') {
    return (0, _domUtils.parentNode)(element);
  }
  if (value === 'self') {
    return target.getRect(element);
  }
  return (0, _domUtils.closest)(element, value);
}
function resolveRectLike(value, target, element, functionArgs) {
  let returnValue = value;
  if (_is.default.string(returnValue)) {
    returnValue = getStringOptionResult(returnValue, target, element);
  } else if (_is.default.func(returnValue)) {
    returnValue = returnValue(...functionArgs);
  }
  if (_is.default.element(returnValue)) {
    returnValue = (0, _domUtils.getElementRect)(returnValue);
  }
  return returnValue;
}
function toFullRect(rect) {
  var _rect$width, _rect$height;
  const {
    top,
    left,
    bottom,
    right
  } = rect;
  const width = (_rect$width = rect.width) != null ? _rect$width : rect.right - rect.left;
  const height = (_rect$height = rect.height) != null ? _rect$height : rect.bottom - rect.top;
  return {
    top,
    left,
    bottom,
    right,
    width,
    height
  };
}
function rectToXY(rect) {
  return rect && {
    x: 'x' in rect ? rect.x : rect.left,
    y: 'y' in rect ? rect.y : rect.top
  };
}
function xywhToTlbr(rect) {
  if (rect && !('left' in rect && 'top' in rect)) {
    rect = (0, _extend.default)({}, rect);
    rect.left = rect.x || 0;
    rect.top = rect.y || 0;
    rect.right = rect.right || rect.left + rect.width;
    rect.bottom = rect.bottom || rect.top + rect.height;
  }
  return rect;
}
function tlbrToXywh(rect) {
  if (rect && !('x' in rect && 'y' in rect)) {
    rect = (0, _extend.default)({}, rect);
    rect.x = rect.left || 0;
    rect.y = rect.top || 0;
    rect.width = rect.width || (rect.right || 0) - rect.x;
    rect.height = rect.height || (rect.bottom || 0) - rect.y;
  }
  return rect;
}
function addEdges(edges, rect, delta) {
  if (edges.left) {
    rect.left += delta.x;
  }
  if (edges.right) {
    rect.right += delta.x;
  }
  if (edges.top) {
    rect.top += delta.y;
  }
  if (edges.bottom) {
    rect.bottom += delta.y;
  }
  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;
}
//# sourceMappingURL=rect.js.map