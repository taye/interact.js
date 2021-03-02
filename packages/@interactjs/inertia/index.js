/* eslint-disable import/order, no-console, eol-last */
import interact, { init } from "../interact/index.js";
import plugin from "./plugin.js";

if (typeof window === 'object' && !!window) {
  init(window);
}

interact.use(plugin);
//# sourceMappingURL=index.js.map