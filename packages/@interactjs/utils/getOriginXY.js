/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { resolveRectLike, rectToXY } from './rect.js';
import './domUtils.js';
import './browser.js';
import './domObjects.js';
import './is.js';
import './isWindow.js';
import './window.js';
import './extend.js';
function getOriginXY(target, element, actionName) {
  const actionOptions = actionName && target.options[actionName];
  const actionOrigin = actionOptions && actionOptions.origin;
  const origin = actionOrigin || target.options.origin;
  const originRect = resolveRectLike(origin, target, element, [target && element]);
  return rectToXY(originRect) || {
    x: 0,
    y: 0
  };
}
export { getOriginXY as default };
//# sourceMappingURL=getOriginXY.js.map
