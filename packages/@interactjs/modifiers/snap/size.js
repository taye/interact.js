"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.snapSize = exports.default = void 0;
var _extend = _interopRequireDefault(require("../../utils/extend.js"));
var _is = _interopRequireDefault(require("../../utils/is.js"));
var _base = require("../base");
var _pointer = require("./pointer");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// This modifier allows snapping of the size of targets during resize
// interactions.

function start(arg) {
  const {
    state,
    edges
  } = arg;
  const {
    options
  } = state;
  if (!edges) {
    return null;
  }
  arg.state = {
    options: {
      targets: null,
      relativePoints: [{
        x: edges.left ? 0 : 1,
        y: edges.top ? 0 : 1
      }],
      offset: options.offset || 'self',
      origin: {
        x: 0,
        y: 0
      },
      range: options.range
    }
  };
  state.targetFields = state.targetFields || [['width', 'height'], ['x', 'y']];
  _pointer.snap.start(arg);
  state.offsets = arg.state.offsets;
  arg.state = state;
}
function set(arg) {
  const {
    interaction,
    state,
    coords
  } = arg;
  const {
    options,
    offsets
  } = state;
  const relative = {
    x: coords.x - offsets[0].x,
    y: coords.y - offsets[0].y
  };
  state.options = (0, _extend.default)({}, options);
  state.options.targets = [];
  for (const snapTarget of options.targets || []) {
    let target;
    if (_is.default.func(snapTarget)) {
      target = snapTarget(relative.x, relative.y, interaction);
    } else {
      target = snapTarget;
    }
    if (!target) {
      continue;
    }
    for (const [xField, yField] of state.targetFields) {
      if (xField in target || yField in target) {
        target.x = target[xField];
        target.y = target[yField];
        break;
      }
    }
    state.options.targets.push(target);
  }
  const returnValue = _pointer.snap.set(arg);
  state.options = options;
  return returnValue;
}
const defaults = {
  range: Infinity,
  targets: null,
  offset: null,
  endOnly: false,
  enabled: false
};
const snapSize = exports.snapSize = {
  start,
  set,
  defaults
};
var _default = exports.default = (0, _base.makeModifier)(snapSize, 'snapSize');
//# sourceMappingURL=size.js.map