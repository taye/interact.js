const extend = require('../utils/extend');

const modifiers = {
  names: [],

  setOffsets: function (interaction, interactable, element, rect, offsets) {
    for (let i = 0; i < modifiers.names.length; i++) {
      const modifierName = modifiers.names[i];

      offsets[modifierName] =
        modifiers[modifiers.names[i]].setOffset(interaction,
                                                interactable, element, rect,
                                                interaction.startOffset);
    }
  },

  setAll: function (interaction, coordsArg, statuses, preEnd, requireEndOnly) {
    const result = {
      dx: 0,
      dy: 0,
      changed: false,
      locked: false,
      shouldMove: true,
    };
    const target = interaction.target;
    const coords = extend({}, coordsArg);

    let currentStatus;

    for (const modifierName of modifiers.names) {
      const modifier = modifiers[modifierName];

      if (!modifier.shouldDo(target, interaction.prepared.name, preEnd, requireEndOnly)) { continue; }

      currentStatus = modifier.set(coords, interaction, statuses[modifierName]);

      if (currentStatus.locked) {
        coords.x += currentStatus.dx;
        coords.y += currentStatus.dy;

        result.dx += currentStatus.dx;
        result.dy += currentStatus.dy;

        result.locked = true;
      }
    }

    // a move should be fired if the modified coords of
    // the last modifier status that was calculated changes
    result.shouldMove = !currentStatus || currentStatus.changed;

    return result;
  },

  resetStatuses: function (statuses) {
    for (const modifierName of modifiers.names) {
      statuses[modifierName] = modifiers[modifierName].reset(statuses[modifierName] || {});
    }

    return statuses;
  },
};

module.exports = modifiers;
