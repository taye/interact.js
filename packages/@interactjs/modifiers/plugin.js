import snappers from "../snappers/plugin.js";
/* eslint-disable import/no-duplicates -- for typescript module augmentations */

import './all';
import './base';
import all from './all';
import base from './base';
/* eslint-enable import/no-duplicates */

const modifiers = {
  id: 'modifiers',

  install(scope) {
    const {
      interactStatic: interact
    } = scope;
    scope.usePlugin(base);
    scope.usePlugin(snappers);
    interact.modifiers = all; // for backwrads compatibility

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
export default modifiers;
//# sourceMappingURL=plugin.js.map