"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.aspectRatio = void 0;
var _extend = _interopRequireDefault(require("../utils/extend.js"));
var _rect = require("../utils/rect.js");
var _base = require("./base");
var _Modification = require("./Modification");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * @module modifiers/aspectRatio
 *
 * @description
 * This modifier forces elements to be resized with a specified dx/dy ratio.
 *
 * ```js
 * interact(target).resizable({
 *   modifiers: [
 *     interact.modifiers.snapSize({
 *       targets: [ interact.snappers.grid({ x: 20, y: 20 }) ],
 *     }),
 *     interact.aspectRatio({ ratio: 'preserve' }),
 *   ],
 * });
 * ```
 */

const aspectRatio = exports.aspectRatio = {
  start(arg) {
    const {
      state,
      rect,
      edges,
      pageCoords: coords
    } = arg;
    let {
      ratio,
      enabled
    } = state.options;
    const {
      equalDelta,
      modifiers
    } = state.options;
    if (ratio === 'preserve') {
      ratio = rect.width / rect.height;
    }
    state.startCoords = (0, _extend.default)({}, coords);
    state.startRect = (0, _extend.default)({}, rect);
    state.ratio = ratio;
    state.equalDelta = equalDelta;
    const linkedEdges = state.linkedEdges = {
      top: edges.top || edges.left && !edges.bottom,
      left: edges.left || edges.top && !edges.right,
      bottom: edges.bottom || edges.right && !edges.top,
      right: edges.right || edges.bottom && !edges.left
    };
    state.xIsPrimaryAxis = !!(edges.left || edges.right);
    if (state.equalDelta) {
      const sign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1);
      state.edgeSign = {
        x: sign,
        y: sign
      };
    } else {
      state.edgeSign = {
        x: linkedEdges.left ? -1 : 1,
        y: linkedEdges.top ? -1 : 1
      };
    }
    if (enabled !== false) {
      (0, _extend.default)(edges, linkedEdges);
    }
    if (!(modifiers != null && modifiers.length)) return;
    const subModification = new _Modification.Modification(arg.interaction);
    subModification.copyFrom(arg.interaction.modification);
    subModification.prepareStates(modifiers);
    state.subModification = subModification;
    subModification.startAll({
      ...arg
    });
  },
  set(arg) {
    const {
      state,
      rect,
      coords
    } = arg;
    const {
      linkedEdges
    } = state;
    const initialCoords = (0, _extend.default)({}, coords);
    const aspectMethod = state.equalDelta ? setEqualDelta : setRatio;
    (0, _extend.default)(arg.edges, linkedEdges);
    aspectMethod(state, state.xIsPrimaryAxis, coords, rect);
    if (!state.subModification) {
      return null;
    }
    const correctedRect = (0, _extend.default)({}, rect);
    (0, _rect.addEdges)(linkedEdges, correctedRect, {
      x: coords.x - initialCoords.x,
      y: coords.y - initialCoords.y
    });
    const result = state.subModification.setAll({
      ...arg,
      rect: correctedRect,
      edges: linkedEdges,
      pageCoords: coords,
      prevCoords: coords,
      prevRect: correctedRect
    });
    const {
      delta
    } = result;
    if (result.changed) {
      const xIsCriticalAxis = Math.abs(delta.x) > Math.abs(delta.y);

      // do aspect modification again with critical edge axis as primary
      aspectMethod(state, xIsCriticalAxis, result.coords, result.rect);
      (0, _extend.default)(coords, result.coords);
    }
    return result.eventProps;
  },
  defaults: {
    ratio: 'preserve',
    equalDelta: false,
    modifiers: [],
    enabled: false
  }
};
function setEqualDelta({
  startCoords,
  edgeSign
}, xIsPrimaryAxis, coords) {
  if (xIsPrimaryAxis) {
    coords.y = startCoords.y + (coords.x - startCoords.x) * edgeSign.y;
  } else {
    coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign.x;
  }
}
function setRatio({
  startRect,
  startCoords,
  ratio,
  edgeSign
}, xIsPrimaryAxis, coords, rect) {
  if (xIsPrimaryAxis) {
    const newHeight = rect.width / ratio;
    coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign.y;
  } else {
    const newWidth = rect.height * ratio;
    coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign.x;
  }
}
var _default = exports.default = (0, _base.makeModifier)(aspectRatio, 'aspectRatio');
//# sourceMappingURL=aspectRatio.js.map