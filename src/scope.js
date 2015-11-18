const scope   = {};
const utils   = require('./utils');
const events  = require('./utils/events');
const signals = require('./utils/Signals').new();

scope.defaultOptions = require('./defaultOptions');
scope.signals        = signals;
scope.events         = events;

utils.extend(scope, require('./utils/window'));
utils.extend(scope, require('./utils/domObjects'));

scope.documents  = [];  // all documents being listened to
scope.eventTypes = [];  // all event types specific to interact.js

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
    scope.interactions[i].end(event);
  }
};

scope.prefixedPropREs = utils.prefixedPropREs;

scope.addDocument = function (doc, win) {
  // do nothing if document is already known
  if (utils.contains(scope.documents, doc)) { return false; }

  win = win || scope.getWindow(doc);

  scope.documents.push(doc);
  events.documents.push(doc);

  // don't add an unload event for the main document
  // so that the page may be cached in browser history
  if (doc !== scope.document) {
    events.add(win, 'unload', scope.onWindowUnload);
  }

  signals.fire('add-document', { doc, win });
};

scope.removeDocument = function (doc, win) {
  const index = utils.indexOf(scope.documents, doc);

  if (index === -1) { return false; }

  win = win || scope.getWindow(doc);

  events.remove(win, 'unload', scope.onWindowUnload);

  scope.documents.splice(index, 1);
  events.documents.splice(index, 1);

  signals.fire('remove-document', { win, doc });
};

scope.onWindowUnload = function () {
  scope.removeDocument(this.document, this);
};

module.exports = scope;
