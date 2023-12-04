"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _scope = require("../core/scope.js");
const scope = new _scope.Scope();
const interact = scope.interactStatic;
var _default = exports.default = interact;
const _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : void 0;
scope.init(_global);
//# sourceMappingURL=index.js.map