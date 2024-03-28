/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { p as pointerEvents } from './base-45YfudGV.js';
import holdRepeat from './holdRepeat.js';
import plugin$1 from './interactableTargets.js';
import "../utils/domUtils.js";
import "../utils/extend.js";
import "../utils/getOriginXY.js";
import './PointerEvent.js';
import "../core/BaseEvent.js";
import "../utils/pointerUtils.js";

/* eslint-disable import/no-duplicates -- for typescript module augmentations */
/* eslint-enable import/no-duplicates */

const plugin = {
  id: 'pointer-events',
  install(scope) {
    scope.usePlugin(pointerEvents);
    scope.usePlugin(holdRepeat);
    scope.usePlugin(plugin$1);
  }
};
export { plugin as default };
//# sourceMappingURL=plugin.js.map
