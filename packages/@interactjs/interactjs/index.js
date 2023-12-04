"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _plugin = _interopRequireDefault(require("../actions/plugin.js"));
var _plugin2 = _interopRequireDefault(require("../auto-scroll/plugin.js"));
var _plugin3 = _interopRequireDefault(require("../auto-start/plugin.js"));
var _interactablePreventDefault = _interopRequireDefault(require("../core/interactablePreventDefault.js"));
var _plugin4 = _interopRequireDefault(require("../dev-tools/plugin.js"));
var _plugin5 = _interopRequireDefault(require("../inertia/plugin.js"));
var _index = _interopRequireDefault(require("../interact/index.js"));
var _plugin6 = _interopRequireDefault(require("../modifiers/plugin.js"));
var _plugin7 = _interopRequireDefault(require("../offset/plugin.js"));
var _plugin8 = _interopRequireDefault(require("../pointer-events/plugin.js"));
var _plugin9 = _interopRequireDefault(require("../reflow/plugin.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */

/* eslint-enable import/no-duplicates */

_index.default.use(_interactablePreventDefault.default);
_index.default.use(_plugin7.default);

// pointerEvents
_index.default.use(_plugin8.default);

// inertia
_index.default.use(_plugin5.default);

// snap, resize, etc.
_index.default.use(_plugin6.default);

// autoStart, hold
_index.default.use(_plugin3.default);

// drag and drop, resize, gesture
_index.default.use(_plugin.default);

// autoScroll
_index.default.use(_plugin2.default);

// reflow
_index.default.use(_plugin9.default);

// eslint-disable-next-line no-undef
if ("development" !== 'production') {
  _index.default.use(_plugin4.default);
}
var _default = exports.default = _index.default;
_index.default.default = _index.default;
//# sourceMappingURL=index.js.map