import actions from "../actions/plugin.js";
import autoScroll from "../auto-scroll/plugin.js";
import autoStart from "../auto-start/plugin.js";
import interactablePreventDefault from "../core/interactablePreventDefault.js";
import devTools from "../dev-tools/plugin.js";
import inertia from "../inertia/plugin.js";
import interact from "../interact/index.js";
import modifiers from "../modifiers/plugin.js";
import offset from "../offset/plugin.js";
import pointerEvents from "../pointer-events/plugin.js";
import reflow from "../reflow/plugin.js";
interact.use(interactablePreventDefault);
interact.use(offset); // pointerEvents

interact.use(pointerEvents); // inertia

interact.use(inertia); // snap, resize, etc.

interact.use(modifiers); // autoStart, hold

interact.use(autoStart); // drag and drop, resize, gesture

interact.use(actions); // autoScroll

interact.use(autoScroll); // reflow

interact.use(reflow); // eslint-disable-next-line no-undef

if ("development" !== 'production') {
  interact.use(devTools);
}

export default interact;

if (typeof module === 'object' && !!module) {
  try {
    module.exports = interact;
  } catch (_unused) {}
}

;
interact.default = interact;
const _ = {
  actions,
  autoScroll,
  autoStart,
  interactablePreventDefault,
  devTools,
  inertia,
  interact,
  modifiers,
  offset,
  pointerEvents,
  reflow
}; // Exported so that the related module augmentations will be referenced in
// generated .d.ts file
//# sourceMappingURL=index.js.map