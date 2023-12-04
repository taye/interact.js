"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _plugin = _interopRequireDefault(require("../snappers/plugin.js"));
var _all = _interopRequireDefault(require("./all"));
var _base = _interopRequireDefault(require("./base"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */

/* eslint-enable import/no-duplicates */

const modifiers = {
  id: 'modifiers',
  install(scope) {
    const {
      interactStatic: interact
    } = scope;
    scope.usePlugin(_base.default);
    scope.usePlugin(_plugin.default);
    interact.modifiers = _all.default;

    // for backwrads compatibility
    for (const type in _all.default) {
      const {
        _defaults,
        _methods
      } = _all.default[type];
      _defaults._methods = _methods;
      scope.defaults.perAction[type] = _defaults;
    }
  }
};
var _default = exports.default = modifiers;
//# sourceMappingURL=plugin.js.map