import * as pointerEvents from "./base.js";
import holdRepeat from "./holdRepeat.js";
import interactableTargets from "./interactableTargets.js";
const plugin = {
  id: 'pointer-events',

  install(scope) {
    scope.usePlugin(pointerEvents);
    scope.usePlugin(holdRepeat);
    scope.usePlugin(interactableTargets);
  }

};
export default plugin;
//# sourceMappingURL=plugin.js.map