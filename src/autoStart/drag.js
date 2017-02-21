const autoStart = require('./base');
const scope     = require('../scope');
const browser   = require('../utils/browser');
const is        = require('../utils/is');

const { matchesSelector, parentNode } = require('../utils/domUtils');

autoStart.setActionDefaults(require('../actions/drag'));

autoStart.signals.on('before-start',  function ({ interaction, eventTarget, dx, dy }) {
  if (interaction.prepared.name !== 'drag') { return; }

  // check if a drag is in the correct axis
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const options = interaction.target.options.drag;
  const startAxis = options.startAxis;
  const currentAxis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy');

  interaction.prepared.axis = options.lockAxis === 'start'
    ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : options.lockAxis;

  // if the movement isn't in the startAxis of the interactable
  if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
    // cancel the prepared action
    interaction.prepared.name = null;

    // then try to get a drag from another ineractable

    if (!interaction.prepared.name) {

      let element = eventTarget;

      const getDraggable = function (interactable, selector, context) {
        const elements = browser.useMatchesSelectorPolyfill
            ? context.querySelectorAll(selector)
            : undefined;

        if (interactable === interaction.target) { return; }

        if (!options.manualStart
            && !interactable.testIgnoreAllow(options, element, eventTarget)
            && matchesSelector(element, selector, elements)) {

          const action = interactable.getAction(interaction.downPointer,
                                                interaction.downEvent,
                                                interaction,
                                                element);

          if (action
              && action.name === 'drag'
              && checkStartAxis(currentAxis, interactable)
              && autoStart.validateAction(action, interactable, element, eventTarget)) {

            return interactable;
          }
        }
      };

      let action = null;

      // check all interactables
      while (is.element(element)) {
        const elementInteractable = scope.interactables.get(element);

        if (elementInteractable
            && elementInteractable !== interaction.target
            && !elementInteractable.options.drag.manualStart) {

          action = elementInteractable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
        }
        if (action
            && action.name === 'drag'
            && checkStartAxis(currentAxis, elementInteractable)) {

          interaction.prepared.name = 'drag';
          interaction.target = elementInteractable;
          interaction.element = element;
          break;
        }

        const selectorInteractable = scope.interactables.forEachSelector(getDraggable, element);

        if (selectorInteractable) {
          interaction.prepared.name = 'drag';
          interaction.target = selectorInteractable;
          interaction.element = element;
          break;
        }

        element = parentNode(element);
      }
    }
  }
});

function checkStartAxis (startAxis, interactable) {
  if (!interactable) { return false; }

  const thisAxis = interactable.options.drag.startAxis;

  return (startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis);
}
