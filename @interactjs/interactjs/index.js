import "../types/index.js";
import actions from "../actions/index.js";
import arrange from "../arrange/index.js";
import autoScroll from "../auto-scroll/index.js";
import autoStart from "../auto-start/index.js";
import clone from "../clone/index.js";
import components from "../components/index.js";
import interactablePreventDefault from "../core/interactablePreventDefault.js";
import devTools from "../dev-tools/index.js";
import * as feedback from "../feedback/index.js";
import inertia from "../inertia/index.js";
import interact from "../interact/index.js";
import modifiers from "../modifiers/index.js";
import multiTarget from "../multi-target/index.js";
import offset from "../offset/index.js";
import pointerEvents from "../pointer-events/index.js";
import reflow from "../reflow/index.js";
import * as displace from "../utils/displace.js";
import { exchange } from "../utils/exchange.js";
import * as pointerUtils from "../utils/pointerUtils.js";
import * as vueComponents from "../vue/index.js";
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
interact.feedback = feedback;
interact.use(components);
interact.vue = {
  components: vueComponents
};
interact.__utils = {
  exchange,
  displace,
  pointer: pointerUtils
}; // eslint-disable-next-line no-undef

if ("development" !== 'production') {
  interact.use(devTools);
}

export default interact;
//# sourceMappingURL=index.js.map