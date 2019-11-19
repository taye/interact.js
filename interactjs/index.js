import interact, { init } from "/node_modules/@interactjs/interactjs/index.js";
export * from "/node_modules/@interactjs/interactjs/index.js";

if (typeof module === 'object' && !!module) {
  module.exports = interact;
}

interact.default = interact // tslint:disable-line no-string-literal
;
interact.init = init; // tslint:disable-line no-string-literal

export default interact;
//# sourceMappingURL=index.js.map