'use strict';

var scope = require('../scope');

var actions = {
    scope: scope,

    addEventTypes: function (eventTypes) {
        for (var i = 0; i < eventTypes.length; i++) {
            scope.eventTypes.push(eventTypes[i]);
        }
    },

    defaultChecker: function (pointer, event, interaction, element) {
        var rect = this.getRect(element),
            action = null;

        for (var i = 0; !action && i < actions.names.length; i++) {
            var actionName = actions.names[i];

            action = actions[actionName].checker(pointer, event, this, element, interaction, rect);
        }

        return action;
    },

    names: [],
    methodDict: {}
};

module.exports = actions;
