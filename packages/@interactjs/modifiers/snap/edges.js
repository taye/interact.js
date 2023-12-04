"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.snapEdges = exports.default = void 0;
var _clone = _interopRequireDefault(require("../../utils/clone.js"));
var _extend = _interopRequireDefault(require("../../utils/extend.js"));
var _base = require("../base");
var _size = require("./size");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * @module modifiers/snapEdges
 *
 * @description
 * This modifier allows snapping of the edges of targets during resize
 * interactions.
 *
 * ```js
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
 *   },
 * })
 *
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [
 *       interact.snappers.grid({
 *        top: 50,
 *        left: 50,
 *        bottom: 100,
 *        right: 100,
 *       }),
 *     ],
 *   },
 * })
 * ```
 */

function start(arg) {
  const {
    edges
  } = arg;
  if (!edges) {
    return null;
  }
  arg.state.targetFields = arg.state.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];
  return _size.snapSize.start(arg);
}
const snapEdges = exports.snapEdges = {
  start,
  set: _size.snapSize.set,
  defaults: (0, _extend.default)((0, _clone.default)(_size.snapSize.defaults), {
    targets: undefined,
    range: undefined,
    offset: {
      x: 0,
      y: 0
    }
  })
};
var _default = exports.default = (0, _base.makeModifier)(snapEdges, 'snapEdges');
//# sourceMappingURL=edges.js.map