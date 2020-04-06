import interact from "../@interactjs/interactjs/index.js";

if (typeof module === 'object' && !!module) {
  try {
    module.exports = interact;
  } catch {}
}

interact.default = interact;
export default interact;
//# sourceMappingURL=index.js.map