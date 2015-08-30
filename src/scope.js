'use strict';

var scope = {},
    utils = require('./utils'),
    signals = require('./utils/signals'),
    extend = utils.extend;

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
    var options = interactable.options,
        maxActions = options[action.name].max,
        maxPerElement = options[action.name].maxPerElement,
        activeInteractions = 0,
        targetCount = 0,
        targetElementCount = 0;

    for (var i = 0, len = scope.interactions.length; i < len; i++) {
        var interaction = scope.interactions[i],
            otherAction = interaction.prepared.name,
            active = interaction.interacting();

        if (!active) { continue; }

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
    for (var i = 0; i < scope.interactions.length; i++) {
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
