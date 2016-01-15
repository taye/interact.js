const Interactable = require('./Interactable');
const Interaction  = require('./Interaction');
const scope        = require('./scope');
const isType       = require('./utils/isType');

const { nodeContains } = require('./utils/domUtils');

/*\
 * Interactable.preventDefault
 [ method ]
 *
 * Returns or sets whether to prevent the browser's default behaviour
 * in response to pointer events. Can be set to:
 *  - `'always'` to always prevent
 *  - `'never'` to never prevent
 *  - `'auto'` to let interact.js try to determine what would be best
 *
 - newValue (string) #optional `true`, `false` or `'auto'`
 = (string | Interactable) The current setting or this Interactable
\*/
Interactable.prototype.preventDefault = function (newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    this.options.preventDefault = newValue;
    return this;
  }

  if (isType.isBool(newValue)) {
    this.options.preventDefault = newValue? 'always' : 'never';
    return this;
  }

  return this.options.preventDefault;
};

Interactable.prototype.checkAndPreventDefault = function (event) {
  const setting = this.options.preventDefault;

  if (setting === 'never') { return; }

  if (setting === 'always') {
    event.preventDefault();
    return;
  }

  // setting === 'auto'

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  }

  // don't preventDefault on input elements
  if (/^(input|select|textarea)$/i.test(event.target.nodeName)) {
    return;
  }

  event.preventDefault();
};

function onInteractionEvent ({ interaction, event }) {
  if (interaction.target) {
    interaction.target.checkAndPreventDefault(event);
  }
}

for (const eventSignal of ['down', 'move', 'up', 'cancel']) {
  Interaction.signals.on(eventSignal, onInteractionEvent);
}

// prevent native HTML5 drag on interact.js target elements
Interaction.docEvents.dragstart = function preventNativeDrag (event) {
  for (const interaction of scope.interactions) {

    if (interaction.element
        && (interaction.element === event.target
            || nodeContains(interaction.element, event.target))) {

      interaction.target.checkAndPreventDefault(event);
      return;
    }
  }
};
