"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _base = _interopRequireDefault(require("./base"));
var _dragAxis = _interopRequireDefault(require("./dragAxis"));
var _hold = _interopRequireDefault(require("./hold"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */
/* eslint-enable import/no-duplicates */
var _default = exports.default = {
  id: 'auto-start',
  install(scope) {
    scope.usePlugin(_base.default);
    scope.usePlugin(_hold.default);
    scope.usePlugin(_dragAxis.default);
  }
};
//# sourceMappingURL=plugin.js.map