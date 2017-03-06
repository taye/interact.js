const InteractEvent = require('../InteractEvent');
const Interaction   = require('../Interaction');
const extend        = require('../utils/extend');

const modifiers = {
  names: [],

  setOffsets: function (arg) {
    const { interaction, pageCoords: page } = arg;
    const { target, element, startOffset } = interaction;
    const rect = target.getRect(element);

    if (rect) {
      startOffset.left = page.x - rect.left;
      startOffset.top  = page.y - rect.top;

      startOffset.right  = rect.right  - page.x;
      startOffset.bottom = rect.bottom - page.y;

      if (!('width'  in rect)) { rect.width  = rect.right  - rect.left; }
      if (!('height' in rect)) { rect.height = rect.bottom - rect.top ; }
    }
    else {
      startOffset.left = startOffset.top = startOffset.right = startOffset.bottom = 0;
    }

    arg.rect = rect;
    arg.interactable = target;
    arg.element = element;

    for (let i = 0; i < modifiers.names.length; i++) {
      const modifierName = modifiers.names[i];

      arg.options = target.options[interaction.prepared.name][modifierName];

      if (!arg.options) {
        continue;
      }

      interaction.modifierOffsets[modifierName] = modifiers[modifierName].setOffset(arg);
    }
  },

  setAll: function (arg) {
    const { interaction, statuses, preEnd, requireEndOnly } = arg;
    const coords = extend({}, arg.pageCoords);
    const result = {
      dx: 0,
      dy: 0,
      changed: false,
      locked: false,
      shouldMove: true,
    };

    for (const modifierName of modifiers.names) {
      const modifier = modifiers[modifierName];
      const options = interaction.target.options[interaction.prepared.name][modifierName];

      if (!shouldDo(options, preEnd, requireEndOnly)) { continue; }

      arg.status = arg.status = statuses[modifierName];
      arg.options = options;
      arg.offset = arg.interaction.modifierOffsets[modifierName];

      modifier.set(arg);

      if (arg.status.locked) {
        coords.x += arg.status.dx;
        coords.y += arg.status.dy;

        result.dx += arg.status.dx;
        result.dy += arg.status.dy;

        result.locked = true;
      }
    }

    // a move should be fired if:
    //  - there are no modifiers enabled,
    //  - no modifiers are "locked" i.e. have changed the pointer's coordinates, or
    //  - the locked coords have changed since the last pointer move
    result.shouldMove = !arg.status || !result.locked || arg.status.changed;

    return result;
  },

  resetStatuses: function (statuses) {
    for (const modifierName of modifiers.names) {
      const status = statuses[modifierName] || {};

      status.dx = status.dy = 0;
      status.modifiedX = status.modifiedY = NaN;
      status.locked = false;
      status.changed = true;

      statuses[modifierName] = status;
    }

    return statuses;
  },

  start: function ({ interaction }, signalName) {
    const arg = {
      interaction,
      pageCoords: (signalName === 'action-resume' ?
                   interaction.curCoords : interaction.startCoords).page,
      startOffset: interaction.startOffset,
      statuses: interaction.modifierStatuses,
      preEnd: false,
      requireEndOnly: false,
    };

    modifiers.setOffsets(arg);
    modifiers.resetStatuses(arg.statuses);

    arg.pageCoords = extend({}, interaction.startCoords.page);
    interaction.modifierResult = modifiers.setAll(arg);
  },
};

Interaction.signals.on('new', function (interaction) {
  interaction.startOffset      = { left: 0, right: 0, top: 0, bottom: 0 };
  interaction.modifierOffsets  = {};
  interaction.modifierStatuses = modifiers.resetStatuses({});
  interaction.modifierResult   = null;
});

Interaction.signals.on('action-start' , modifiers.start);
Interaction.signals.on('action-resume', modifiers.start);

Interaction.signals.on('before-action-move', function ({ interaction, preEnd, interactingBeforeMove }) {
  const modifierResult = modifiers.setAll({
    interaction,
    preEnd,
    pageCoords: interaction.curCoords.page,
    statuses: interaction.modifierStatuses,
    requireEndOnly: false,
  });

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interactingBeforeMove) {
    interaction._dontFireMove = true;
  }

  interaction.modifierResult = modifierResult;
});

Interaction.signals.on('action-end', function ({ interaction, event }) {
  for (let i = 0; i < modifiers.names.length; i++) {
    const options = interaction.target.options[interaction.prepared.name][modifiers.names[i]];

    // if the endOnly option is true for any modifier
    if (shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.doMove({ event, preEnd: true });
      break;
    }
  }
});

InteractEvent.signals.on('set-xy', function (arg) {
  const { iEvent, interaction } = arg;
  const modifierArg = extend({}, arg);

  for (let i = 0; i < modifiers.names.length; i++) {
    const modifierName = modifiers.names[i];
    modifierArg.options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!modifierArg.options) {
      continue;
    }

    const modifier = modifiers[modifierName];

    modifierArg.status = interaction.modifierStatuses[modifierName];

    iEvent[modifierName] = modifier.modifyCoords(modifierArg);
  }
});

function shouldDo (options, preEnd, requireEndOnly) {
  return (options && options.enabled
          && (preEnd || !options.endOnly)
          && (!requireEndOnly || options.endOnly));
}

module.exports = modifiers;
