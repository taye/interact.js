import interact, { init } from "../@interactjs/interactjs/index.js";
export * from "../@interactjs/interactjs/index.js";

if (typeof module === 'object' && !!module) {
  module.exports = interact;
}

interact.default = interact // tslint:disable-line no-string-literal
;
interact.init = init; // tslint:disable-line no-string-literal
//# sourceMappingURL=index.js.map