/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import autoStart from './base.js';
import dragAxis from './dragAxis.js';
import hold from './hold.js';
import "../utils/domUtils.js";
import "../utils/extend.js";
import "../utils/is.js";
import "../utils/misc.js";
import './InteractableMethods.js';

/* eslint-disable import/no-duplicates -- for typescript module augmentations */
/* eslint-enable import/no-duplicates */

var plugin = {
  id: 'auto-start',
  install(scope) {
    scope.usePlugin(autoStart);
    scope.usePlugin(hold);
    scope.usePlugin(dragAxis);
  }
};
export { plugin as default };
//# sourceMappingURL=plugin.js.map
