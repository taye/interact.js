import * as pointerEvents from "./base.js";
import holdRepeat from "./holdRepeat.js";
import interactableTargets from "./interactableTargets.js";
export default {
  id: 'pointer-events',

  install(scope) {
    scope.usePlugin(pointerEvents);
    scope.usePlugin(holdRepeat);
    scope.usePlugin(interactableTargets);
  }

};
export { pointerEvents, holdRepeat, interactableTargets };
//# sourceMappingURL=index.js.map