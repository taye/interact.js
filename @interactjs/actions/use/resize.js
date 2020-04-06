import interact, { init } from "../../interact/index.js";
import plugin from "../resize.js";

if (typeof window === 'object' && !!window) {
  init(window);
} // eslint-disable-next-line no-undef


if (("development" !== 'production' || true) && !interact.__warnedUseImport) {
  interact.__warnedUseImport = true; // eslint-disable-next-line no-console

  console.warn('[interact.js] The "@interactjs/*/use" packages are not quite stable yet. Use them with caution.');
}

interact.use(plugin);
//# sourceMappingURL=resize.js.map