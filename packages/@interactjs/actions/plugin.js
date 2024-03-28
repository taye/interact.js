/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import drag from './drag/plugin.js';
import drop from './drop/plugin.js';
import gesture from './gesture/plugin.js';
import resize from './resize/plugin.js';
import "../utils/is.js";
import "../utils/domUtils.js";
import "../utils/extend.js";
import "../utils/getOriginXY.js";
import "../utils/normalizeListeners.js";
import "../utils/pointerUtils.js";
import './drop/DropEvent.js';
import "../core/BaseEvent.js";
import "../utils/arr.js";

/* eslint-disable import/no-duplicates -- for typescript module augmentations */
/* eslint-enable import/no-duplicates */

var plugin = {
  id: 'actions',
  install(scope) {
    scope.usePlugin(gesture);
    scope.usePlugin(resize);
    scope.usePlugin(drag);
    scope.usePlugin(drop);
  }
};
export { plugin as default };
//# sourceMappingURL=plugin.js.map
