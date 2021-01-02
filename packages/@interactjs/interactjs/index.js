import actions from "../actions/plugin.js";
import arrange from "../arrange/plugin.js";
import autoScroll from "../auto-scroll/plugin.js";
import autoStart from "../auto-start/plugin.js";
import clone from "../clone/plugin.js";
import interactablePreventDefault from "../core/interactablePreventDefault.js";
import devTools from "../dev-tools/plugin.js";
import feedback from "../feedback/plugin.js";
import inertia from "../inertia/plugin.js";
import interact from "../interact/index.js";
import modifiers from "../modifiers/plugin.js";
import multiTarget from "../multi-target/plugin.js";
import offset from "../offset/plugin.js";
import pointerEvents from "../pointer-events/plugin.js";
import reactComponents from "../react/plugin.js";
import reflow from "../reflow/plugin.js";
import vueComponents from "../vue/plugin.js";
interact.use(multiTarget);
interact.use(interactablePreventDefault);
interact.use(offset); // interaction element cloning

interact.use(clone); // sortable and swappable

interact.use(arrange); // pointerEvents

interact.use(pointerEvents); // inertia

interact.use(inertia); // snap, resize, etc.

interact.use(modifiers); // autoStart, hold

interact.use(autoStart); // drag and drop, resize, gesture

interact.use(actions); // autoScroll

interact.use(autoScroll); // reflow

interact.use(reflow);
interact.use(feedback);
interact.use(vueComponents);
interact.use(reactComponents); // eslint-disable-next-line no-undef

if ("development" !== 'production') {
  interact.use(devTools);
}

export default interact;

if (typeof module === 'object' && !!module) {
  try {
    module.exports = interact;
  } catch (_unused) {}
}

interact.default = interact;
//# sourceMappingURL=index.js.map