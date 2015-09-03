const scope = {};
const utils = require('./utils');
const signals = require('./utils/signals');
const extend = utils.extend;

scope.documents       = [];   // all documents being listened to

scope.interactables   = [];   // all set interactables
scope.interactions    = [];   // all interactions

scope.defaultOptions = require('./defaultOptions');

scope.events = require('./utils/events');
scope.signals = require('./utils/signals');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));

scope.eventTypes = [];

scope.withinInteractionLimit = function (interactable, element, action) {
  const options = interactable.options;
  const maxActions = options[action.name].max;
  const maxPerElement = options[action.name].maxPerElement;
  let activeInteractions = 0;
  let targetCount = 0;
  let targetElementCount = 0;

  for (let i = 0, len = scope.interactions.length; i < len; i++) {
    const interaction = scope.interactions[i];
    const otherAction = interaction.prepared.name;

    if (!interaction.interacting()) { continue; }

    activeInteractions++;

    if (activeInteractions >= scope.maxInteractions) {
      return false;
    }

    if (interaction.target !== interactable) { continue; }

    targetCount += (otherAction === action.name)|0;

    if (targetCount >= maxActions) {
      return false;
    }

    if (interaction.element === element) {
      targetElementCount++;

      if (otherAction !== action.name || targetElementCount >= maxPerElement) {
        return false;
      }
    }
  }

  return scope.maxInteractions > 0;
};

scope.endAllInteractions = function (event) {
  for (let i = 0; i < scope.interactions.length; i++) {
    scope.interactions[i].pointerEnd(event, event);
  }
};

signals.on('listen-to-document', function (arg) {
  // if document is already known
  if (utils.contains(scope.documents, arg.doc)) {
    // don't call any further signal listeners
    return false;
  }
});

module.exports = scope;
