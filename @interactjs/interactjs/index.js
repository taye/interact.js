import interact, { init as initInteract } from "../interact/index.js";
import * as modifiers from "../modifiers/index.js";
import "../types/index.js";
import extend from "../utils/extend.js";
import * as snappers from "../utils/snappers/index.js";

if (typeof window === 'object' && !!window) {
  init(window);
}

export function init(win) {
  initInteract(win);
  return interact.use({
    id: 'interactjs',

    install() {
      interact.modifiers = extend({}, modifiers);
      interact.snappers = snappers;
      interact.createSnapGrid = interact.snappers.grid;
    }

  });
}
export default interact;
//# sourceMappingURL=index.js.map