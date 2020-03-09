import "../types/index.js";
import actions from "../actions/index.js";
import autoScroll from "../auto-scroll/index.js";
import autoStart from "../auto-start/index.js";
import devTools from "../dev-tools/index.js";
import inertia from "../inertia/index.js";
import modifiers from "../modifiers/index.js";
import offset from "../offset/index.js";
import pointerEvents from "../pointer-events/index.js";
import reflow from "../reflow/index.js";
import interact, { init as initInteract } from "../interact/index.js";

if (typeof window === 'object' && !!window) {
  init(window);
}

export default interact;
export function init(win) {
  initInteract(win);
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

  return interact;
}
//# sourceMappingURL=index.js.map