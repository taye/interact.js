const scope   = require('../scope');
const utils   = require('./index');
const browser = require('./browser');

const finder = {
  methodOrder: [ 'simulationResume', 'mouse', 'hasPointer', 'idle' ],

  search: function (pointer, eventType, eventTarget) {
    const mouseEvent = (/mouse/i.test(pointer.pointerType || eventType)
                        // MSPointerEvent.MSPOINTER_TYPE_MOUSE
                        || pointer.pointerType === 4);
    const pointerId = utils.getPointerId(pointer);
    const details = { pointer, pointerId, mouseEvent, eventType, eventTarget };

    for (const method of finder.methodOrder) {
      const interaction = finder[method](details);

      if (interaction) {
        return interaction;
      }
    }
  },

  // try to resume simulation with a new pointer
  simulationResume: function ({ mouseEvent, eventType, eventTarget }) {
    if (!/down|start/i.test(eventType)) {
      return null;
    }

    for (const interaction of scope.interactions) {
      let element = eventTarget;

      if (interaction.simulation && interaction.simulation.allowResume
          && (interaction.mouse === mouseEvent)) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }
          element = utils.parentNode(element);
        }
      }
    }

    return null;
  },

  // if it's a mouse interaction
  mouse: function ({ pointerId, mouseEvent, eventType }) {
    if (!mouseEvent && (browser.supportsTouch || browser.supportsPointerEvent)) {
      return null;
    }

    let firstNonActive;

    for (const interaction of scope.interactions) {
      if (interaction.mouse) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !utils.contains(interaction.pointerIds, pointerId)) { continue; }

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

    // Find any interaction specifically for mouse.
    // ignore the interaction if the eventType is a mousedown, and a simulation
    // is active
    for (const interaction of scope.interactions) {
      if (interaction.mouse && !(/down/.test(eventType) && interaction.simulation)) {
        return interaction;
      }
    }

    return null;
  },

  // get interaction that has this pointer
  hasPointer: function ({ pointerId }) {
    for (const interaction of scope.interactions) {
      if (utils.contains(interaction.pointerIds, pointerId)) {
        return interaction;
      }
    }
  },

  // get first idle interaction
  idle: function ({ mouseEvent }) {
    for (const interaction of scope.interactions) {
      // if there's already a pointer held down
      if (interaction.pointerIds.length === 1) {
        const target = interaction.target;
        // don't add this pointer if there is a target interactable and it
        // isn't gesturable
        if (target && !target.options.gesture.enabled) {
          continue;
        }
      }
      // maximum of 2 pointers per interaction
      else if (interaction.pointerIds.length >= 2) {
        continue;
      }

      if (!interaction.interacting() && !(!mouseEvent && interaction.mouse)) {
        return interaction;
      }
    }

    return null;
  },
};

module.exports = finder;
