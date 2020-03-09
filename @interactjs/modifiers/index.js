import base from "./base.js";
import * as all from "./all.js";
import extend from "../utils/extend.js";
import * as snappers from "../utils/snappers/index.js";
const modifiers = {
  id: 'modifiers',

  install(scope) {
    const {
      interact
    } = scope;
    scope.usePlugin(base);
    interact.modifiers = extend(interact.modifiers || {}, all);
    interact.snappers = extend(interact.snappers || {}, snappers);
    interact.createSnapGrid = interact.snappers.grid; // for backwrads compatibility

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
//# sourceMappingURL=index.js.map