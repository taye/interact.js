import * as pointerEvents from "./base.js";
import holdRepeat from "./holdRepeat.js";
import interactableTargets from "./interactableTargets.js";

function install(scope) {
  scope.usePlugin(pointerEvents);
  scope.usePlugin(holdRepeat);
  scope.usePlugin(interactableTargets);
}

const id = 'pointer-events';
export { id, pointerEvents, holdRepeat, interactableTargets, install };
//# sourceMappingURL=index.js.map