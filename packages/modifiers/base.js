import extend from '@interactjs/utils/extend';

function init (scope) {
  const {
    interactions,
  } = scope;

  scope.modifiers = { names: [] };

  scope.defaults.perAction.modifiers = [];

  interactions.signals.on('new', function (interaction) {
    interaction.modifiers = {
      startOffset: { left: 0, right: 0, top: 0, bottom: 0 },
      offsets    : {},
      statuses   : null,
      result     : null,
    };
  });

  interactions.signals.on('before-action-start' , arg =>
    start(arg, scope.modifiers, arg.interaction.coords.start.page));

  interactions.signals.on('action-resume', arg => {
    beforeMove(arg, scope.modifiers);
    start(arg, scope.modifiers, arg.interaction.coords.cur.page);
  });

  interactions.signals.on('before-action-move', arg => beforeMove(arg, scope.modifiers));
  interactions.signals.on('before-action-end', arg => beforeEnd(arg, scope.modifiers));

  interactions.signals.on('before-action-start', arg => setCurCoords(arg, scope.modifiers));
  interactions.signals.on('before-action-move', arg => setCurCoords(arg, scope.modifiers));
}

function startAll (arg) {
  const { interaction, statuses, rect, pageCoords: page } = arg;
  const { modifiers: { startOffset } } = interaction;

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

  for (const status of statuses) {
    arg.status = status;
    status.methods.start(arg);
  }
}

function setAll (arg) {
  const { interaction, statuses, preEnd, requireEndOnly } = arg;

  arg.modifiedCoords = extend({}, arg.pageCoords);

  const result = {
    delta: { x: 0, y: 0 },
    coords: arg.modifiedCoords,
    shouldMove: true,
  };

  for (const status of statuses) {
    const { options } = status;

    if (!shouldDo(options, preEnd, requireEndOnly)) { continue; }

    arg.status = status;
    status.methods.set(arg);

    arg.modifiedCoords.x += status.delta.x;
    arg.modifiedCoords.y += status.delta.y;

    result.delta.x += status.delta.x;
    result.delta.y += status.delta.y;
  }

  const differsFromPrevCoords =
    interaction.coords.prev.page.x !== result.coords.x ||
    interaction.coords.prev.page.y !== result.coords.y;

  // a move should be fired if:
  //  - the modified coords are different to the prev interaction coords
  //  - there's a non zero result.delta
  result.shouldMove = differsFromPrevCoords ||
    result.delta.x !== 0 || result.delta.y !== 0;

  return result;
}

function prepareStatuses (modifierList) {
  const statuses = [];

  for (const { options, methods } of modifierList) {
    if (!options || options.enabled === false) { continue; }

    statuses.push({
      options,
      methods,
      delta: { x: 0, y: 0 },
    });
  }

  return statuses;
}

function resetStatus (status) {
  status.delta = { x: 0, y: 0 };
}

function start ({ interaction, phase }, modifiers, pageCoords) {
  const { target: interactable, element } = interaction;
  const rect = interactable.getRect(element);
  const modifierList = getModifierList(interaction);
  const statuses = prepareStatuses(modifierList, modifiers);

  const arg = {
    interaction,
    interactable,
    pageCoords,
    phase,
    rect,
    startOffset: interaction.modifiers.startOffset,
    statuses,
    preEnd: false,
    requireEndOnly: false,
  };

  interaction.modifiers.statuses = statuses;
  startAll(arg, modifiers);

  arg.pageCoords = extend({}, interaction.coords.start.page);
  interaction.modifiers.result = setAll(arg, modifiers);
}

function beforeMove ({ interaction, preEnd }, modifiers) {
  const modifierResult = setAll(
    {
      interaction,
      preEnd,
      pageCoords: interaction.coords.cur.page,
      statuses: interaction.modifiers.statuses,
      requireEndOnly: false,
    }, modifiers);

  interaction.modifiers.result = modifierResult;

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interaction.interacting()) {
    return false;
  }
}

function beforeEnd ({ interaction, event }) {
  const modifierList = getModifierList(interaction);

  for (const { options } of modifierList) {
    // if the endOnly option is true for any modifier
    if (shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({ event, preEnd: true });
      break;
    }
  }
}

function setCurCoords (arg) {
  const { interaction } = arg;
  const modifierArg = extend({
    page: interaction.coords.cur.page,
    client: interaction.coords.cur.client,
  }, arg);

  const { statuses } = interaction.modifiers;

  for (const { delta } of statuses) {
    modifierArg.page.x += delta.x;
    modifierArg.page.y += delta.y;
    modifierArg.client.x += delta.x;
    modifierArg.client.y += delta.y;
  }
}

function getModifierList (interaction) {
  const actionOptions = interaction.target.options[interaction.prepared.name];
  const actionModifiers = actionOptions.modifiers;

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers;
  }

  return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize']
    .map(type => {
      const options = actionOptions[type] || null;

      return options && {
        options,
        methods: options._methods,
      };
    })
    .filter(m => !!m);
}

function shouldDo (options, preEnd, requireEndOnly) {
  return (
    options &&
    options.enabled !== false &&
    (preEnd || !options.endOnly) &&
    (!requireEndOnly || options.endOnly)
  );
}

export default {
  init,
  startAll,
  setAll,
  prepareStatuses,
  resetStatus,
  start,
  beforeMove,
  beforeEnd,
  shouldDo,
  getModifierList,
};
