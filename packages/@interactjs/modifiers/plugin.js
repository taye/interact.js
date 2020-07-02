import snappers from "../snappers/plugin.js";
import all from "./all.js";
import base from "./base.js";
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