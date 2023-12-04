"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _aspectRatio = _interopRequireDefault(require("./aspectRatio"));
var _avoid = _interopRequireDefault(require("./avoid/avoid"));
var _edges = _interopRequireDefault(require("./restrict/edges"));
var _pointer = _interopRequireDefault(require("./restrict/pointer"));
var _rect = _interopRequireDefault(require("./restrict/rect"));
var _size = _interopRequireDefault(require("./restrict/size"));
var _rubberband = _interopRequireDefault(require("./rubberband/rubberband"));
var _edges2 = _interopRequireDefault(require("./snap/edges"));
var _pointer2 = _interopRequireDefault(require("./snap/pointer"));
var _size2 = _interopRequireDefault(require("./snap/size"));
var _spring = _interopRequireDefault(require("./spring/spring"));
var _transform = _interopRequireDefault(require("./transform/transform"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable n/no-extraneous-import, import/no-unresolved */
var _default = exports.default = {
  aspectRatio: _aspectRatio.default,
  restrictEdges: _edges.default,
  restrict: _pointer.default,
  restrictRect: _rect.default,
  restrictSize: _size.default,
  snapEdges: _edges2.default,
  snap: _pointer2.default,
  snapSize: _size2.default,
  spring: _spring.default,
  avoid: _avoid.default,
  transform: _transform.default,
  rubberband: _rubberband.default
};
//# sourceMappingURL=all.js.map