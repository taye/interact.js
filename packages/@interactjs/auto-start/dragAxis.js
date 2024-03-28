/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { parentNode } from "../utils/domUtils.js";
import is from "../utils/is.js";
import autoStart from './base.js';
import "../utils/extend.js";
import "../utils/misc.js";
import './InteractableMethods.js';
function beforeStart(_ref, scope) {
  let {
    interaction,
    eventTarget,
    dx,
    dy
  } = _ref;
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
    interaction.prepared.name = null;

    // then try to get a drag from another ineractable
    let element = eventTarget;
    const getDraggable = function (interactable) {
      if (interactable === interaction.interactable) return;
      const options = interaction.interactable.options.drag;
      if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
        const action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
        if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && autoStart.validateAction(action, interactable, element, eventTarget, scope)) {
          return interactable;
        }
      }
    };

    // check all interactables
    while (is.element(element)) {
      const interactable = scope.interactables.forEachMatch(element, getDraggable);
      if (interactable) {
        interaction.prepared.name = 'drag';
        interaction.interactable = interactable;
        interaction.element = element;
        break;
      }
      element = parentNode(element);
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
var dragAxis = {
  id: 'auto-start/dragAxis',
  listeners: {
    'autoStart:before-start': beforeStart
  }
};
export { dragAxis as default };
//# sourceMappingURL=dragAxis.js.map
