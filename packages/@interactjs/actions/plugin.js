"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _plugin = _interopRequireDefault(require("./drag/plugin"));
var _plugin2 = _interopRequireDefault(require("./drop/plugin"));
var _plugin3 = _interopRequireDefault(require("./gesture/plugin"));
var _plugin4 = _interopRequireDefault(require("./resize/plugin"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */
/* eslint-enable import/no-duplicates */
var _default = exports.default = {
  id: 'actions',
  install(scope) {
    scope.usePlugin(_plugin3.default);
    scope.usePlugin(_plugin4.default);
    scope.usePlugin(_plugin.default);
    scope.usePlugin(_plugin2.default);
  }
};
//# sourceMappingURL=plugin.js.map