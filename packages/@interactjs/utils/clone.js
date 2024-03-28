/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { from } from './arr.js';
import is from './is.js';
import './isWindow.js';
import './window.js';

// tslint:disable-next-line ban-types
function clone(source) {
  const dest = {};
  for (const prop in source) {
    const value = source[prop];
    if (is.plainObject(value)) {
      dest[prop] = clone(value);
    } else if (is.array(value)) {
      dest[prop] = from(value);
    } else {
      dest[prop] = value;
    }
  }
  return dest;
}
export { clone as default };
//# sourceMappingURL=clone.js.map
