/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import snappers from "../snappers/plugin.js";
import all from './all.js';
import modifiersBase from './base.js';
import './aspectRatio.js';
import "../utils/extend.js";
import "../utils/rect.js";
import './Modification.js';
import "../utils/clone.js";
import './restrict/edges.js';
import './restrict/pointer.js';
import "../utils/is.js";
import './restrict/rect.js';
import './restrict/size.js';
import './snap/edges.js';
import './snap/size.js';
import './snap/pointer.js';
import "../utils/getOriginXY.js";
import "../utils/hypot.js";
import './noop.js';

/* eslint-enable import/no-duplicates */

const modifiers = {
  id: 'modifiers',
  install(scope) {
    const {
      interactStatic: interact
    } = scope;
    scope.usePlugin(modifiersBase);
    scope.usePlugin(snappers);
    interact.modifiers = all;

    // for backwrads compatibility
    for (const type in all) {
      const {
        _defaults,
        _methods
      } = all[type];
      _defaults._methods = _methods;
      scope.defaults.perAction[type] = _defaults;
    }
  }
};
export { modifiers as default };
//# sourceMappingURL=plugin.js.map
