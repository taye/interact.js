"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _domUtils = require("../utils/domUtils.js");
var _is = _interopRequireDefault(require("../utils/is.js"));
var _base = _interopRequireDefault(require("./base"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function beforeStart({
  interaction,
  eventTarget,
  dx,
  dy
}, scope) {
  if (interaction.prepared.name !== 'drag') return;

  // check if a drag is in the correct axis
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const targetOptions = interaction.interactable.options.drag;
  const startAxis = targetOptions.startAxis;
  const currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';
  interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
  : targetOptions.lockAxis;

  // if the movement isn't in the startAxis of the interactable
  if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
    // cancel the prepared action
    ;
    interaction.prepared.name = null;

    // then try to get a drag from another ineractable
    let element = eventTarget;
    const getDraggable = function (interactable) {
      if (interactable === interaction.interactable) return;
      const options = interaction.interactable.options.drag;
      if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
        const action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
        if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && _base.default.validateAction(action, interactable, element, eventTarget, scope)) {
          return interactable;
        }
      }
    };

    // check all interactables
    while (_is.default.element(element)) {
      const interactable = scope.interactables.forEachMatch(element, getDraggable);
      if (interactable) {
        ;
        interaction.prepared.name = 'drag';
        interaction.interactable = interactable;
        interaction.element = element;
        break;
      }
      element = (0, _domUtils.parentNode)(element);
    }
  }
}
function checkStartAxis(startAxis, interactable) {
  if (!interactable) {
    return false;
  }
  const thisAxis = interactable.options.drag.startAxis;
  return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
}
var _default = exports.default = {
  id: 'auto-start/dragAxis',
  listeners: {
    'autoStart:before-start': beforeStart
  }
};
//# sourceMappingURL=dragAxis.js.map