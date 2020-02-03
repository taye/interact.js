import * as arr from "./arr.js";
import * as dom from "./domUtils.js";
import * as is from "./is.js";
import * as pointer from "./pointerUtils.js";
import * as rect from "./rect.js";
import win from "./window.js";
export function warnOnce(method, message) {
  let warned = false; // eslint-disable-next-line no-shadow

  return function () {
    if (!warned) {
      win.window.console.warn(message);
      warned = true;
    }

    return method.apply(this, arguments);
  };
} // http://stackoverflow.com/a/5634528/2280888

export function _getQBezierValue(t, p1, p2, p3) {
  const iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}
export function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
  return {
    x: _getQBezierValue(position, startX, cpX, endX),
    y: _getQBezierValue(position, startY, cpY, endY)
  };
} // http://gizma.com/easing/

export function easeOutQuad(t, b, c, d) {
  t /= d;
  return -c * t * (t - 2) + b;
}
export function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;
  return dest;
}
export { default as browser } from "./browser.js";
export { default as clone } from "./clone.js";
export { default as events } from "./events.js";
export { default as extend } from "./extend.js";
export { default as getOriginXY } from "./getOriginXY.js";
export { default as hypot } from "./hypot.js";
export { default as normalizeListeners } from "./normalizeListeners.js";
export { default as raf } from "./raf.js";
export { win, arr, dom, is, pointer, rect };
//# sourceMappingURL=index.js.map