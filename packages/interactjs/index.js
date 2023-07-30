// eslint-disable-next-line import/no-extraneous-dependencies
import interact from "../@interactjs/interactjs/index.js";
export default interact;

if (typeof module === 'object' && !!module) {
  try {
    module.exports = interact;
  } catch (_unused) {}
}

;
interact.default = interact;
//# sourceMappingURL=index.js.map