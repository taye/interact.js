/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { window as win } from './window.js';
import './isWindow.js';
function warnOnce(method, message) {
  let warned = false;
  return function () {
    if (!warned) {
      win.console.warn(message);
      warned = true;
    }
    return method.apply(this, arguments);
  };
}
function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;
  return dest;
}
const sign = n => n >= 0 ? 1 : -1;
export { copyAction, sign, warnOnce };
//# sourceMappingURL=misc.js.map
