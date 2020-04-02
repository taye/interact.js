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
}
export function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;
  return dest;
}
export { default as browser } from "./browser.js";
export { default as clone } from "./clone.js";
export { default as extend } from "./extend.js";
export { default as getOriginXY } from "./getOriginXY.js";
export { default as hypot } from "./hypot.js";
export { default as normalizeListeners } from "./normalizeListeners.js";
export { default as raf } from "./raf.js";
export { win, arr, dom, is, pointer, rect };
//# sourceMappingURL=index.js.map