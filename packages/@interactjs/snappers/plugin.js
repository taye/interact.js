/**
 * interact.js 1.10.26
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import extend from "../utils/extend.js";
import { a as allSnappers } from './all-cc9e2779.js';
import './edgeTarget.js';
import './elements.js';
import './grid.js';
const snappersPlugin = {
  id: 'snappers',
  install(scope) {
    const {
      interactStatic: interact
    } = scope;
    interact.snappers = extend(interact.snappers || {}, allSnappers);
    interact.createSnapGrid = interact.snappers.grid;
  }
};
export { snappersPlugin as default };
//# sourceMappingURL=plugin.js.map
