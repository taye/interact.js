/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { parentNode, closest, getElementRect } from './domUtils.js';
import extend from './extend.js';
import is from './is.js';
import './browser.js';
import './domObjects.js';
import './window.js';
import './isWindow.js';
function getStringOptionResult(value, target, element) {
  if (value === 'parent') {
    return parentNode(element);
  }
  if (value === 'self') {
    return target.getRect(element);
  }
  return closest(element, value);
}
function resolveRectLike(value, target, element, functionArgs) {
  let returnValue = value;
  if (is.string(returnValue)) {
    returnValue = getStringOptionResult(returnValue, target, element);
  } else if (is.func(returnValue)) {
    returnValue = returnValue(...functionArgs);
  }
  if (is.element(returnValue)) {
    returnValue = getElementRect(returnValue);
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
    rect = extend({}, rect);
    rect.left = rect.x || 0;
    rect.top = rect.y || 0;
    rect.right = rect.right || rect.left + rect.width;
    rect.bottom = rect.bottom || rect.top + rect.height;
  }
  return rect;
}
function tlbrToXywh(rect) {
  if (rect && !('x' in rect && 'y' in rect)) {
    rect = extend({}, rect);
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
export { addEdges, getStringOptionResult, rectToXY, resolveRectLike, tlbrToXywh, toFullRect, xywhToTlbr };
//# sourceMappingURL=rect.js.map
