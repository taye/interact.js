'use strict';

var scope = {},
    extend = require('./utils/extend');

scope.documents       = [];   // all documents being listened to

scope.interactables   = [];   // all set interactables
scope.interactions    = [];   // all interactions

scope.defaultOptions = require('./defaultOptions');

scope.events = require('./utils/events');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));

scope.eventTypes = [];

scope.addEventTypes = function (eventTypes) {
    for (var i = 0; i < eventTypes.length; i++) {
        scope.eventTypes.push(eventTypes[i]);
    }
};

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


module.exports = scope;
