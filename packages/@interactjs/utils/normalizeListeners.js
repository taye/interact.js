/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import is from './is.js';
import './isWindow.js';
import './window.js';
function normalize(type, listeners) {
  let filter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _typeOrPrefix => true;
  let result = arguments.length > 3 ? arguments[3] : undefined;
  result = result || {};
  if (is.string(type) && type.search(' ') !== -1) {
    type = split(type);
  }
  if (is.array(type)) {
    type.forEach(t => normalize(t, listeners, filter, result));
    return result;
  }

  // before:  type = [{ drag: () => {} }], listeners = undefined
  // after:   type = ''                  , listeners = [{ drag: () => {} }]
  if (is.object(type)) {
    listeners = type;
    type = '';
  }
  if (is.func(listeners) && filter(type)) {
    result[type] = result[type] || [];
    result[type].push(listeners);
  } else if (is.array(listeners)) {
    for (const l of listeners) {
      normalize(type, l, filter, result);
    }
  } else if (is.object(listeners)) {
    for (const prefix in listeners) {
      const combinedTypes = split(prefix).map(p => `${type}${p}`);
      normalize(combinedTypes, listeners[prefix], filter, result);
    }
  }
  return result;
}
function split(type) {
  return type.trim().split(/ +/);
}
export { normalize as default };
//# sourceMappingURL=normalizeListeners.js.map
