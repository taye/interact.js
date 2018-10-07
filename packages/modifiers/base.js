import extend from '@interactjs/utils/extend';

function install (scope) {
  const {
    interactions,
  } = scope;

  scope.defaults.perAction.modifiers = [];
  scope.modifiers = {};

  interactions.signals.on('new', function (interaction) {
    interaction.modifiers = {
      startOffset: { left: 0, right: 0, top: 0, bottom: 0 },
      offsets    : {},
      states   : null,
      result     : null,
    };
  });

  interactions.signals.on('before-action-start' , arg =>
    start(arg, arg.interaction.coords.start.page, scope.modifiers));

  interactions.signals.on('action-resume', arg => {
    beforeMove(arg);
    start(arg, arg.interaction.coords.cur.page, scope.modifiers);
  });

  interactions.signals.on('before-action-move', beforeMove);
  interactions.signals.on('before-action-end', beforeEnd);

  interactions.signals.on('before-action-start', setCoords);
  interactions.signals.on('before-action-move', setCoords);

  interactions.signals.on('after-action-start', restoreCoords);
  interactions.signals.on('after-action-move', restoreCoords);
  interactions.signals.on('stop', stop);
}

function startAll (arg) {
  for (const state of arg.states) {
    if (state.methods.start) {
      arg.state = state;
      state.methods.start(arg);
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

function start ({ interaction, phase }, pageCoords, registeredModifiers) {
  const { target: interactable, element } = interaction;
  const modifierList = getModifierList(interaction, registeredModifiers);
  const states = prepareStates(modifierList);

  const rect = extend({}, interactable.getRect(element));

  if (!('width'  in rect)) { rect.width  = rect.right  - rect.left; }
  if (!('height' in rect)) { rect.height = rect.bottom - rect.top ; }

  const startOffset = getRectOffset(rect, pageCoords);

  interaction.modifiers.startOffset = startOffset;
  interaction.modifiers.startDelta = { x: 0, y: 0 };

  const arg = {
    interaction,
    interactable,
    element,
    pageCoords,
    phase,
    rect,
    startOffset,
    states,
    preEnd: false,
    requireEndOnly: false,
  };

  interaction.modifiers.states = states;
  interaction.modifiers.result = null;
  startAll(arg);

  arg.pageCoords = extend({}, interaction.coords.start.page);

  const result = interaction.modifiers.result = setAll(arg);

  return result;
}

function setAll (arg) {
  const { interaction, phase, preEnd, requireEndOnly, rect, skipModifiers } = arg;

  const states = skipModifiers
    ? arg.states.slice(interaction.modifiers.skip)
    : arg.states;

  arg.coords = extend({}, arg.pageCoords);
  arg.rect = extend({}, rect);

  const result = {
    delta: { x: 0, y: 0 },
    coords: arg.coords,
    changed: true,
  };

  for (const state of states) {
    const { options } = state;

    if (!state.methods.set ||
      !shouldDo(options, preEnd, requireEndOnly, phase)) { continue; }

    arg.state = state;
    state.methods.set(arg);
  }

  result.delta.x = arg.coords.x - arg.pageCoords.x;
  result.delta.y = arg.coords.y - arg.pageCoords.y;

  const prevCoords = interaction.modifiers.result
    ? interaction.modifiers.result.coords
    : interaction.coords.prev.page;

  result.changed = (
    prevCoords.x !== result.coords.x ||
    prevCoords.y !== result.coords.y);

  return result;
}

function prepareStates (modifierList) {
  const states = [];

  for (let index = 0; index < modifierList.length; index++) {
    const { options, methods } = modifierList[index];

    if (options && options.enabled === false) { continue; }

    const state = {
      options,
      methods,
      index,
    };

    states.push(state);
  }

  return states;
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
      states: interaction.modifiers.states,
      requireEndOnly: false,
      skipModifiers,
    });

  interaction.modifiers.result = modifierResult;

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.changed && interaction.interacting()) {
    return false;
  }
}

function beforeEnd (arg) {
  const { interaction, event, noPreEnd } = arg;
  const states = interaction.modifiers.states;

  if (noPreEnd || !states || !states.length) {
    return;
  }

  let didPreEnd = false;

  for (const state of states) {
    arg.state = state;
    const { options, methods } = state;

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
  const states = interaction.modifiers.states;

  if (!states || !states.length) {
    return;
  }

  const modifierArg = extend({
    states,
    interactable: interaction.target,
    element: interaction.element,
  }, arg);


  restoreCoords(arg);

  for (const state of states) {
    modifierArg.state = state;

    if (state.methods.stop) { state.methods.stop(modifierArg); }
  }

  arg.interaction.modifiers.states = null;
}

function setCoords (arg) {
  const { interaction, phase } = arg;
  const curCoords = arg.curCoords || interaction.coords.cur;
  const startCoords = arg.startCoords || interaction.coords.start;
  const { result, startDelta } = interaction.modifiers;
  const curDelta = result.delta;

  if (phase === 'start') {
    extend(interaction.modifiers.startDelta, result.delta);
  }

  for (const [coordsSet, delta] of [[startCoords, startDelta], [curCoords, curDelta]]) {
    coordsSet.page.x   += delta.x;
    coordsSet.page.y   += delta.y;
    coordsSet.client.x += delta.x;
    coordsSet.client.y += delta.y;
  }
}

function restoreCoords ({ interaction: { coords, modifiers } }) {
  const { startDelta, result: { delta: curDelta } } = modifiers;

  for (const [coordsSet, delta] of [[coords.start, startDelta], [coords.cur, curDelta]]) {
    coordsSet.page.x -= delta.x;
    coordsSet.page.y -= delta.y;
    coordsSet.client.x -= delta.x;
    coordsSet.client.y -= delta.y;
  }

}

function getModifierList (interaction, registeredModifiers) {
  const actionOptions = interaction.target.options[interaction.prepared.name];
  const actionModifiers = actionOptions.modifiers;

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers.map(modifier => {
      if (!modifier.methods && modifier.type) {
        return registeredModifiers[modifier.type](modifier);
      }

      return modifier;
    });
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

function shouldDo (options, preEnd, requireEndOnly, phase) {
  return options
    ? options.enabled !== false &&
      (preEnd || !options.endOnly) &&
      (!requireEndOnly || options.endOnly) &&
      (options.setStart || phase !== 'start')
    : !requireEndOnly;
}

function makeModifier (module, name) {
  const { defaults } = module;
  const methods = {
    start: module.start,
    set: module.set,
    beforeEnd: module.beforeEnd,
    stop: module.stop,
  };

  const modifier = options => {
    options = options || {};

    // add missing defaults to options
    options.enabled = options.enabled !== false;

    for (const prop in defaults) {
      if (!(prop in options)) {
        options[prop] = defaults[prop];
      }
    }

    return { options, methods };
  };

  if (typeof name === 'string') {
    Object.defineProperty(
      modifier,
      'name',
      { value: name });

    // for backwrads compatibility
    modifier._defaults = defaults;
    modifier._methods = methods;
  }

  return modifier;
}

export default {
  install,
  startAll,
  setAll,
  prepareStates,
  start,
  beforeMove,
  beforeEnd,
  stop,
  shouldDo,
  getModifierList,
  getRectOffset,
  makeModifier,
};
