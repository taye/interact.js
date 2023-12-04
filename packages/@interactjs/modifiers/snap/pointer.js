"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.snap = exports.default = void 0;
var _extend = _interopRequireDefault(require("../../utils/extend.js"));
var _getOriginXY = _interopRequireDefault(require("../../utils/getOriginXY.js"));
var _hypot = _interopRequireDefault(require("../../utils/hypot.js"));
var _is = _interopRequireDefault(require("../../utils/is.js"));
var _rect = require("../../utils/rect.js");
var _base = require("../base");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function start(arg) {
  const {
    interaction,
    interactable,
    element,
    rect,
    state,
    startOffset
  } = arg;
  const {
    options
  } = state;
  const origin = options.offsetWithOrigin ? getOrigin(arg) : {
    x: 0,
    y: 0
  };
  let snapOffset;
  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x,
      y: interaction.coords.start.page.y
    };
  } else {
    const offsetRect = (0, _rect.resolveRectLike)(options.offset, interactable, element, [interaction]);
    snapOffset = (0, _rect.rectToXY)(offsetRect) || {
      x: 0,
      y: 0
    };
    snapOffset.x += origin.x;
    snapOffset.y += origin.y;
  }
  const {
    relativePoints
  } = options;
  state.offsets = rect && relativePoints && relativePoints.length ? relativePoints.map((relativePoint, index) => ({
    index,
    relativePoint,
    x: startOffset.left - rect.width * relativePoint.x + snapOffset.x,
    y: startOffset.top - rect.height * relativePoint.y + snapOffset.y
  })) : [{
    index: 0,
    relativePoint: null,
    x: snapOffset.x,
    y: snapOffset.y
  }];
}
function set(arg) {
  const {
    interaction,
    coords,
    state
  } = arg;
  const {
    options,
    offsets
  } = state;
  const origin = (0, _getOriginXY.default)(interaction.interactable, interaction.element, interaction.prepared.name);
  const page = (0, _extend.default)({}, coords);
  const targets = [];
  if (!options.offsetWithOrigin) {
    page.x -= origin.x;
    page.y -= origin.y;
  }
  for (const offset of offsets) {
    const relativeX = page.x - offset.x;
    const relativeY = page.y - offset.y;
    for (let index = 0, len = options.targets.length; index < len; index++) {
      const snapTarget = options.targets[index];
      let target;
      if (_is.default.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction._proxy, offset, index);
      } else {
        target = snapTarget;
      }
      if (!target) {
        continue;
      }
      targets.push({
        x: (_is.default.number(target.x) ? target.x : relativeX) + offset.x,
        y: (_is.default.number(target.y) ? target.y : relativeY) + offset.y,
        range: _is.default.number(target.range) ? target.range : options.range,
        source: snapTarget,
        index,
        offset
      });
    }
  }
  const closest = {
    target: null,
    inRange: false,
    distance: 0,
    range: 0,
    delta: {
      x: 0,
      y: 0
    }
  };
  for (const target of targets) {
    const range = target.range;
    const dx = target.x - page.x;
    const dy = target.y - page.y;
    const distance = (0, _hypot.default)(dx, dy);
    let inRange = distance <= range;

    // Infinite targets count as being out of range
    // compared to non infinite ones that are in range
    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false;
    }
    if (!closest.target || (inRange ?
    // is the closest target in range?
    closest.inRange && range !== Infinity ?
    // the pointer is relatively deeper in this target
    distance / range < closest.distance / closest.range :
    // this target has Infinite range and the closest doesn't
    range === Infinity && closest.range !== Infinity ||
    // OR this target is closer that the previous closest
    distance < closest.distance :
    // The other is not in range and the pointer is closer to this target
    !closest.inRange && distance < closest.distance)) {
      closest.target = target;
      closest.distance = distance;
      closest.range = range;
      closest.inRange = inRange;
      closest.delta.x = dx;
      closest.delta.y = dy;
    }
  }
  if (closest.inRange) {
    coords.x = closest.target.x;
    coords.y = closest.target.y;
  }
  state.closest = closest;
  return closest;
}
function getOrigin(arg) {
  const {
    element
  } = arg.interaction;
  const optionsOrigin = (0, _rect.rectToXY)((0, _rect.resolveRectLike)(arg.state.options.origin, null, null, [element]));
  const origin = optionsOrigin || (0, _getOriginXY.default)(arg.interactable, element, arg.interaction.prepared.name);
  return origin;
}
const defaults = {
  range: Infinity,
  targets: null,
  offset: null,
  offsetWithOrigin: true,
  origin: null,
  relativePoints: null,
  endOnly: false,
  enabled: false
};
const snap = exports.snap = {
  start,
  set,
  defaults
};
var _default = exports.default = (0, _base.makeModifier)(snap, 'snap');
//# sourceMappingURL=pointer.js.map