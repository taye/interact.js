const extend = require('../utils/extend');

function init (scope) {
  const {
    Interaction,
  } = scope;

  scope.modifiers = { names: [] };

  Interaction.signals.on('new', function (interaction) {
    interaction.modifiers = {
      startOffset: { left: 0, right: 0, top: 0, bottom: 0 },
      offsets    : {},
      statuses   : resetStatuses({}, scope.modifiers),
      result     : null,
    };
  });

  Interaction.signals.on('before-action-start' , arg =>
    start(arg, scope.modifiers, arg.interaction.startCoords.page));

  Interaction.signals.on('action-resume', arg => {
    beforeMove(arg, scope.modifiers);
    start(arg, scope.modifiers, arg.interaction.curCoords.page);
  });

  Interaction.signals.on('before-action-move', arg => beforeMove(arg, scope.modifiers));
  Interaction.signals.on('before-action-end', arg => beforeEnd(arg, scope.modifiers));

  Interaction.signals.on('before-action-start', arg => setCurCoords(arg, scope.modifiers));
  Interaction.signals.on('before-action-move', arg => setCurCoords(arg, scope.modifiers));
}

function setOffsets (arg, modifiers) {
  const { interaction, pageCoords: page } = arg;
  const { target, element, modifiers: { startOffset } } = interaction;
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

  for (const modifierName of modifiers.names) {
    arg.options = target.options[interaction.prepared.name][modifierName];

    if (!arg.options) {
      continue;
    }

    interaction.modifiers.offsets[modifierName] = modifiers[modifierName].setOffset(arg);
  }
}

function setAll (arg, modifiers) {
  const { interaction, statuses, preEnd, requireEndOnly } = arg;
  const result = {
    dx: 0,
    dy: 0,
    changed: false,
    locked: false,
    shouldMove: true,
  };

  arg.modifiedCoords = extend({}, arg.pageCoords);

  for (const modifierName of modifiers.names) {
    const modifier = modifiers[modifierName];
    const options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!shouldDo(options, preEnd, requireEndOnly)) { continue; }

    arg.status = arg.status = statuses[modifierName];
    arg.options = options;
    arg.offset = arg.interaction.modifiers.offsets[modifierName];

    modifier.set(arg);

    if (arg.status.locked) {
      arg.modifiedCoords.x += arg.status.dx;
      arg.modifiedCoords.y += arg.status.dy;

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
}

function resetStatuses (statuses, modifiers) {
  for (const modifierName of modifiers.names) {
    const status = statuses[modifierName] || {};

    status.dx = status.dy = 0;
    status.modifiedX = status.modifiedY = NaN;
    status.realX = status.realY = NaN;
    status.locked = false;
    status.changed = true;

    statuses[modifierName] = status;
  }

  return statuses;
}

function start ({ interaction }, modifiers, pageCoords) {
  const arg = {
    interaction,
    pageCoords,
    startOffset: interaction.modifiers.startOffset,
    statuses: interaction.modifiers.statuses,
    preEnd: false,
    requireEndOnly: false,
  };

  setOffsets(arg, modifiers);
  resetStatuses(arg.statuses, modifiers);

  arg.pageCoords = extend({}, interaction.startCoords.page);
  interaction.modifiers.result = setAll(arg, modifiers);
}

function beforeMove ({ interaction, preEnd, interactingBeforeMove }, modifiers) {
  const modifierResult = setAll(
    {
      interaction,
      preEnd,
      pageCoords: interaction.curCoords.page,
      statuses: interaction.modifiers.statuses,
      requireEndOnly: false,
    }, modifiers);

  interaction.modifiers.result = modifierResult;

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interactingBeforeMove) {
    return false;
  }
}

function beforeEnd ({ interaction, event }, modifiers) {
  for (const modifierName of modifiers.names) {
    const options = interaction.target.options[interaction.prepared.name][modifierName];

    // if the endOnly option is true for any modifier
    if (shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({ event, preEnd: true });
      break;
    }
  }
}

function setCurCoords (arg, modifiers) {
  const { interaction } = arg;
  const modifierArg = extend({
    page: interaction.curCoords.page,
    client: interaction.curCoords.client,
  }, arg);

  for (let i = 0; i < modifiers.names.length; i++) {
    const modifierName = modifiers.names[i];
    modifierArg.options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!modifierArg.options) {
      continue;
    }

    const modifier = modifiers[modifierName];

    modifierArg.status = interaction.modifiers.statuses[modifierName];

    modifier.modifyCoords(modifierArg);
  }
}

function shouldDo (options, preEnd, requireEndOnly) {
  return (options && options.enabled
    && (preEnd || !options.endOnly)
    && (!requireEndOnly || options.endOnly));
}

module.exports = {
  init,
  setOffsets,
  setAll,
  resetStatuses,
  start,
  beforeMove,
  beforeEnd,
  shouldDo,
};
