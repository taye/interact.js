/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import * as domUtils from "../utils/domUtils.js";
const finder = {
  methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
  search(details) {
    for (const method of finder.methodOrder) {
      const interaction = finder[method](details);
      if (interaction) {
        return interaction;
      }
    }
    return null;
  },
  // try to resume simulation with a new pointer
  simulationResume(_ref) {
    let {
      pointerType,
      eventType,
      eventTarget,
      scope
    } = _ref;
    if (!/down|start/i.test(eventType)) {
      return null;
    }
    for (const interaction of scope.interactions.list) {
      let element = eventTarget;
      if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }
          element = domUtils.parentNode(element);
        }
      }
    }
    return null;
  },
  // if it's a mouse or pen interaction
  mouseOrPen(_ref2) {
    let {
      pointerId,
      pointerType,
      eventType,
      scope
    } = _ref2;
    if (pointerType !== 'mouse' && pointerType !== 'pen') {
      return null;
    }
    let firstNonActive;
    for (const interaction of scope.interactions.list) {
      if (interaction.pointerType === pointerType) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
          continue;
        }

        // if the interaction is active, return it immediately
        if (interaction.interacting()) {
          return interaction;
        }
        // otherwise save it and look for another active interaction
        else if (!firstNonActive) {
          firstNonActive = interaction;
        }
      }
    }

    // if no active mouse interaction was found use the first inactive mouse
    // interaction
    if (firstNonActive) {
      return firstNonActive;
    }

    // find any mouse or pen interaction.
    // ignore the interaction if the eventType is a *down, and a simulation
    // is active
    for (const interaction of scope.interactions.list) {
      if (interaction.pointerType === pointerType && !(/down/i.test(eventType) && interaction.simulation)) {
        return interaction;
      }
    }
    return null;
  },
  // get interaction that has this pointer
  hasPointer(_ref3) {
    let {
      pointerId,
      scope
    } = _ref3;
    for (const interaction of scope.interactions.list) {
      if (hasPointerId(interaction, pointerId)) {
        return interaction;
      }
    }
    return null;
  },
  // get first idle interaction with a matching pointerType
  idle(_ref4) {
    let {
      pointerType,
      scope
    } = _ref4;
    for (const interaction of scope.interactions.list) {
      // if there's already a pointer held down
      if (interaction.pointers.length === 1) {
        const target = interaction.interactable;
        // don't add this pointer if there is a target interactable and it
        // isn't gesturable
        if (target && !(target.options.gesture && target.options.gesture.enabled)) {
          continue;
        }
      }
      // maximum of 2 pointers per interaction
      else if (interaction.pointers.length >= 2) {
        continue;
      }
      if (!interaction.interacting() && pointerType === interaction.pointerType) {
        return interaction;
      }
    }
    return null;
  }
};
function hasPointerId(interaction, pointerId) {
  return interaction.pointers.some(_ref5 => {
    let {
      id
    } = _ref5;
    return id === pointerId;
  });
}
export { finder as default };
//# sourceMappingURL=interactionFinder.js.map
