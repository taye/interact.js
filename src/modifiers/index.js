const InteractEvent = require('../InteractEvent');
const Interaction   = require('../Interaction');
const extend        = require('../utils/extend');

const modifiers = {
  names: [],

  setStartOffsets: function (interaction) {
    const { target, element } = interaction;
    const rect = target.getRect(element);

    if (rect) {
      interaction.startOffset.left = interaction.startCoords.page.x - rect.left;
      interaction.startOffset.top  = interaction.startCoords.page.y - rect.top;

      interaction.startOffset.right  = rect.right  - interaction.startCoords.page.x;
      interaction.startOffset.bottom = rect.bottom - interaction.startCoords.page.y;

      if (!('width'  in rect)) { rect.width  = rect.right  - rect.left; }
      if (!('height' in rect)) { rect.height = rect.bottom - rect.top ; }
    }
    else {
      interaction.startOffset.left = interaction.startOffset.top = interaction.startOffset.right = interaction.startOffset.bottom = 0;
    }

    modifiers.setOffsets(interaction, target, element, rect, interaction.modifierOffsets);
  },

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

Interaction.signals.on('new', function (interaction) {
  interaction.startOffset      = { left: 0, right: 0, top: 0, bottom: 0 };
  interaction.modifierOffsets  = {};
  interaction.modifierStatuses = modifiers.resetStatuses({});
});

Interaction.signals.on('start', function ({ interaction }) {
  modifiers.setStartOffsets(interaction);

  modifiers.resetStatuses(interaction.modifierStatuses);
  modifiers.setAll(interaction, interaction.startCoords.page, interaction.modifierStatuses);
});

Interaction.signals.on('before-action-move', function ({ interaction, preEnd, interactingBeforeMove }) {
  const modifierResult = modifiers.setAll(interaction, interaction.curCoords.page, interaction.modifierStatuses, preEnd);

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interactingBeforeMove) {
    interaction._dontFireMove = true;
  }
});

Interaction.signals.on('action-end', function ({ interaction }) {
  for (let i = 0; i < modifiers.names.length; i++) {
    // if the endOnly option is true for any modifier
    if (modifiers[modifiers.names[i]].shouldDo(interaction.target, interaction.prepared.name, true, true)) {
      // fire a move event at the modified coordinates
      interaction.doMove(true /* preEnd */);
      break;
    }
  }
});

InteractEvent.signals.on('set-xy', function ({ iEvent, interaction, page, client, phase, action: actionName }) {
  const target = interaction.target;

  for (let i = 0; i < modifiers.names.length; i++) {
    const modifierName = modifiers.names[i];
    const modifier = modifiers[modifierName];

    iEvent[modifierName] = modifier.modifyCoords(page, client, target, interaction.modifierStatuses[modifierName], actionName, phase);
  }
});

module.exports = modifiers;
