"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.restrictRect = exports.default = void 0;
var _extend = _interopRequireDefault(require("../../utils/extend.js"));
var _base = require("../base");
var _pointer = require("./pointer");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const defaults = (0, _extend.default)({
  get elementRect() {
    return {
      top: 0,
      left: 0,
      bottom: 1,
      right: 1
    };
  },
  set elementRect(_) {}
}, _pointer.restrict.defaults);
const restrictRect = exports.restrictRect = {
  start: _pointer.restrict.start,
  set: _pointer.restrict.set,
  defaults
};
var _default = exports.default = (0, _base.makeModifier)(restrictRect, 'restrictRect');
//# sourceMappingURL=rect.js.map