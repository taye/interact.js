'use strict';

var utils = require('../utils');

var modifiers = {
    names: [],

    setAll: function (interaction, coords, statuses, preEnd, requireEndOnly) {
        var result = {
                dx: 0,
                dy: 0,
                changed: false,
                locked: false,
                shouldMove: true
            },
            target = interaction.target,
            currentStatus;

        coords = utils.extend({}, coords);

        for (var i = 0; i < modifiers.names.length; i++) {
            var modifierName = modifiers.names[i],
                modifier = modifiers[modifierName];

            if (!modifier.shouldDo(target, interaction.prepared.name, preEnd, requireEndOnly)) { continue; }

            currentStatus = modifier.set(coords, interaction, statuses[modifierName]);

            if (currentStatus.locked) {
                coords.x += currentStatus.dx;
                coords.y += currentStatus.dy;

                result.dx += currentStatus.dx;
                result.dy += currentStatus.dy;
            }
        }

        // a move should be fired if the modified coords of
        // the last modifier status that was calculated changes
        result.shouldMove = !currentStatus || currentStatus.changed;

        return result;
    },

    resetStatuses: function (statuses) {
        for (var i = 0; i < modifiers.names.length; i++) {
            var modifierName = modifiers.names[i];

            statuses[modifierName] = modifiers[modifierName].reset(statuses[modifierName] || {});
        }

        return statuses;
    }
};

module.exports = modifiers;
