import * as actions from "../actions/index.js";
import autoScroll from "../auto-scroll/index.js";
import * as autoStart from "../auto-start/index.js";
import interactablePreventDefault from "../core/interactablePreventDefault.js";
import devTools from "../dev-tools/index.js";
import inertia from "../inertia/index.js";
import modifiersBase from "../modifiers/base.js";
import * as modifiers from "../modifiers/index.js";
import * as pointerEvents from "../pointer-events/index.js";
import reflow from "../reflow/index.js";
import interact, { scope } from "./interact.js";
export function init(window) {
  scope.init(window);
  interact.use(interactablePreventDefault); // pointerEvents

  interact.use(pointerEvents); // inertia

  interact.use(inertia); // snap, resize, etc.

  interact.use(modifiersBase); // autoStart, hold

  interact.use(autoStart); // drag and drop, resize, gesture

  interact.use(actions); // for backwrads compatibility

  for (const type in modifiers) {
    const {
      _defaults,
      _methods
    } = modifiers[type];
    _defaults._methods = _methods;
    scope.defaults.perAction[type] = _defaults;
  } // autoScroll


  interact.use(autoScroll); // reflow

  interact.use(reflow); // eslint-disable-next-line no-undef

  if (undefined !== 'production') {
    interact.use(devTools);
  }

  return interact;
} // eslint-disable-next-line no-undef

interact.version = "1.7.3";
export default interact;
export { interact, actions, autoScroll, interactablePreventDefault, inertia, modifiersBase as modifiers, pointerEvents, reflow };
//# sourceMappingURL=index.js.map