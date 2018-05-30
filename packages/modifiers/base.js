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
    start(arg, arg.interaction.coords.start.page));

  interactions.signals.on('action-resume', arg => {
    beforeMove(arg);
    start(arg, arg.interaction.coords.cur.page);
  });

  interactions.signals.on('before-action-move', beforeMove);
  interactions.signals.on('before-action-end', beforeEnd);

  interactions.signals.on('before-action-start', setCurCoords);
  interactions.signals.on('before-action-move', setCurCoords);

  interactions.signals.on('after-action-start', restoreCurCoords);
  interactions.signals.on('after-action-move', restoreCurCoords);
  interactions.signals.on('stop', stop);
}

function startAll (arg) {
  for (const status of arg.statuses) {
    if (status.methods.start) {
      arg.status = status;
      status.methods.start(arg);
    }
  }
}

function getRectOffset (rect, coords) {
  return rect
    ? {
      left  : coords.x - rect.left,
      top   : coords.y - rect.top,
      right : rect.right  - coords.x,
      bottom: rect.bottom - coords.y,
    }
    : {
      left  : 0,
      top   : 0,
      right : 0,
      bottom: 0,
    };
}

function start ({ interaction, phase }, pageCoords) {
  const { target: interactable, element } = interaction;
  const modifierList = getModifierList(interaction);
  const statuses = prepareStatuses(modifierList);

  const rect = extend({}, interactable.getRect(element));

  if (!('width'  in rect)) { rect.width  = rect.right  - rect.left; }
  if (!('height' in rect)) { rect.height = rect.bottom - rect.top ; }

  const startOffset = getRectOffset(rect, pageCoords);
  interaction.modifiers.startOffset = startOffset;

  const arg = {
    interaction,
    interactable,
    element,
    pageCoords,
    phase,
    rect,
    startOffset,
    statuses,
    preEnd: false,
    requireEndOnly: false,
  };

  interaction.modifiers.statuses = statuses;
  startAll(arg);

  arg.pageCoords = extend({}, interaction.coords.start.page);

  const result = interaction.modifiers.result = setAll(arg);

  return result;
}

function setAll (arg) {
  const { interaction, preEnd, requireEndOnly, rect, skipModifiers } = arg;

  const statuses = skipModifiers
    ? arg.statuses.slice(interaction.modifiers.skil)
    : arg.statuses;

  arg.coords = extend({}, arg.pageCoords);
  arg.rect = extend({}, rect);

  const result = {
    delta: { x: 0, y: 0 },
    coords: arg.coords,
    shouldMove: true,
  };

  for (const status of statuses) {
    const { options } = status;

    if (!status.methods.set ||
      !shouldDo(options, preEnd, requireEndOnly)) { continue; }

    arg.status = status;
    status.methods.set(arg);
  }

  result.delta.x = arg.coords.x - arg.pageCoords.x;
  result.delta.y = arg.coords.y - arg.pageCoords.y;


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

  for (let index = 0; index < modifierList.length; index++) {
    const { options, methods } = modifierList[index];

    if (options && options.enabled === false) { continue; }

    const status = {
      options,
      methods,
      index,
    };

    statuses.push(status);
  }

  return statuses;
}

function beforeMove ({ interaction, phase, preEnd, skipModifiers }) {
  const { target: interactable, element } = interaction;
  const modifierResult = setAll(
    {
      interaction,
      interactable,
      element,
      preEnd,
      phase,
      pageCoords: interaction.coords.cur.page,
      rect: interactable.getRect(element),
      statuses: interaction.modifiers.statuses,
      requireEndOnly: false,
      skipModifiers,
    });

  interaction.modifiers.result = modifierResult;

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interaction.interacting()) {
    return false;
  }
}

function beforeEnd (arg) {
  const { interaction, event } = arg;
  const statuses = interaction.modifiers.statuses;

  if (!statuses || !statuses.length) {
    return;
  }

  let didPreEnd = false;

  for (const status of statuses) {
    arg.status = status;
    const { options, methods } = status;

    const endResult = methods.beforeEnd && methods.beforeEnd(arg);

    if (endResult === false) {
      return false;
    }

    // if the endOnly option is true for any modifier
    if (!didPreEnd && shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({ event, preEnd: true });
      didPreEnd = true;
    }
  }
}

function stop (arg) {
  const { interaction } = arg;
  const statuses = interaction.modifiers.statuses;

  if (!statuses || !statuses.length) {
    return;
  }

  const modifierArg = extend({
    statuses,
    interactable: interaction.target,
    element: interaction.element,
  }, arg);


  restoreCurCoords(arg);

  for (const status of statuses) {
    modifierArg.status = status;

    if (status.methods.stop) { status.methods.stop(modifierArg); }
  }

  arg.interaction.modifiers.statuses = null;
}

function setCurCoords (arg) {
  const { interaction } = arg;
  const modifierArg = extend({
    page: interaction.coords.cur.page,
    client: interaction.coords.cur.client,
  }, arg);

  const { delta } = interaction.modifiers.result;

  modifierArg.page.x   += delta.x;
  modifierArg.page.y   += delta.y;
  modifierArg.client.x += delta.x;
  modifierArg.client.y += delta.y;
}

function restoreCurCoords ({ interaction: { coords, modifiers } }) {
  const { delta } = modifiers.result;

  coords.cur.page.x -= delta.x;
  coords.cur.page.y -= delta.y;
  coords.cur.client.x -= delta.x;
  coords.cur.client.y -= delta.y;
}

function getModifierList (interaction) {
  const actionOptions = interaction.target.options[interaction.prepared.name];
  const actionModifiers = actionOptions.modifiers;

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers;
  }

  return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize']
    .map(type => {
      const options = actionOptions[type];

      return options && options.enabled && {
        options,
        methods: options._methods,
      };
    })
    .filter(m => !!m);
}

function shouldDo (options, preEnd, requireEndOnly) {
  return options
    ? options.enabled !== false &&
      (preEnd || !options.endOnly) &&
      (!requireEndOnly || options.endOnly)
    : !requireEndOnly;
}

export default {
  init,
  startAll,
  setAll,
  prepareStatuses,
  start,
  beforeMove,
  beforeEnd,
  stop,
  shouldDo,
  getModifierList,
  getRectOffset,
};
