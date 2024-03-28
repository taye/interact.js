/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import extend from "../../utils/extend.js";
import { makeModifier } from '../base.js';
import { restrict } from './pointer.js';
import '../Modification.js';
import "../../utils/clone.js";
import "../../utils/rect.js";
import "../../utils/is.js";
const defaults = extend({
  get elementRect() {
    return {
      top: 0,
      left: 0,
      bottom: 1,
      right: 1
    };
  },
  set elementRect(_) {}
}, restrict.defaults);
const restrictRect = {
  start: restrict.start,
  set: restrict.set,
  defaults
};
var restrictRect$1 = makeModifier(restrictRect, 'restrictRect');
export { restrictRect$1 as default, restrictRect };
//# sourceMappingURL=rect.js.map
