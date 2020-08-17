/* eslint-disable import/order, no-console, eol-last */
import interact, { init } from "../../interact/index.js";
import plugin from "./plugin.js";

if (typeof window === 'object' && !!window) {
  init(window);
} // eslint-disable-next-line no-undef


if (("development" !== 'production' || true) && !interact.__warnedUseImport) {
  interact.__warnedUseImport = true;
  console.warn('[interact.js] The "@interactjs/*/index" packages are not quite stable yet. Use them with caution.');
}

interact.use(plugin);
//# sourceMappingURL=index.js.map