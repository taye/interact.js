const scope = require('../scope');
const utils = require('./index');
const browser = require('./browser');

const finder = {
  methodOrder: [ 'inertiaResume', 'mouse', 'hasPointer', 'idle' ],

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

  // try to resume inertia with a new pointer
  inertiaResume: function ({ mouseEvent, eventType, eventTarget }) {
    if (!/down|start/i.test(eventType)) {
      return null;
    }

    for (const interaction of scope.interactions) {
      let element = eventTarget;

      if (interaction.inertiaStatus.active && interaction.target.options[interaction.prepared.name].inertia.allowResume
          && (interaction.mouse === mouseEvent)) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }
          element = utils.parentElement(element);
        }
      }
    }

    return null;
  },

  // if it's a mouse interaction
  mouse: function ({ mouseEvent, eventType }) {
    if (!mouseEvent && (browser.supportsTouch || browser.supportsPointerEvent)) {
      return null;
    }

    // Find a mouse interaction that's not in inertia phase
    for (const interaction of scope.interactions) {
      if (interaction.mouse && !interaction.inertiaStatus.active) {
        return interaction;
      }
    }

    // Find any interaction specifically for mouse.
    // If the eventType is a mousedown, and inertia is active
    // ignore the interaction
    for (const interaction of scope.interactions) {
      if (interaction.mouse && !(/down/.test(eventType) && interaction.inertiaStatus.active)) {
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
      if ((!interaction.prepared.name || (interaction.target.options.gesture.enabled))
          && !interaction.interacting()
          && !(!mouseEvent && interaction.mouse)) {

        return interaction;
      }
    }

    return null;
  },
};

module.exports = finder;
