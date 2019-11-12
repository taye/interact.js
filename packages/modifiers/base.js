import extend from "../utils/extend.js";

function start({
  interaction,
  phase
}, pageCoords, prevCoords) {
  const {
    interactable,
    element
  } = interaction;
  const modifierList = getModifierList(interaction);
  const states = prepareStates(modifierList);
  const rect = extend({}, interaction.rect);

  if (!('width' in rect)) {
    rect.width = rect.right - rect.left;
  }

  if (!('height' in rect)) {
    rect.height = rect.bottom - rect.top;
  }

  const startOffset = getRectOffset(rect, pageCoords);
  interaction.modifiers.startOffset = startOffset;
  interaction.modifiers.startDelta = {
    x: 0,
    y: 0
  };
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
    prevCoords: prevCoords || (interaction.modifiers.result ? interaction.modifiers.result.coords : interaction.coords.prev.page)
  };
  interaction.modifiers.states = states;
  interaction.modifiers.result = null;
  startAll(arg);
  const result = interaction.modifiers.result = setAll(arg);
  return result;
}

export function startAll(arg) {
  const states = arg.states;

  for (const state of states) {
    if (state.methods.start) {
      arg.state = state;
      state.methods.start(arg);
    }
  }
}
export function setAll(arg) {
  const {
    prevCoords,
    phase,
    preEnd,
    requireEndOnly,
    rect,
    states
  } = arg;
  arg.coords = extend({}, arg.pageCoords);
  arg.rect = extend({}, rect);
  const result = {
    delta: {
      x: 0,
      y: 0
    },
    rectDelta: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },
    coords: arg.coords,
    changed: true
  };

  for (const state of states) {
    const {
      options
    } = state;

    if (!state.methods.set || !shouldDo(options, preEnd, requireEndOnly, phase)) {
      continue;
    }

    arg.state = state;
    state.methods.set(arg);
  }

  result.delta.x = arg.coords.x - arg.pageCoords.x;
  result.delta.y = arg.coords.y - arg.pageCoords.y;
  let rectChanged = false;

  if (rect) {
    result.rectDelta.left = arg.rect.left - rect.left;
    result.rectDelta.right = arg.rect.right - rect.right;
    result.rectDelta.top = arg.rect.top - rect.top;
    result.rectDelta.bottom = arg.rect.bottom - rect.bottom;
    rectChanged = result.rectDelta.left !== 0 || result.rectDelta.right !== 0 || result.rectDelta.top !== 0 || result.rectDelta.bottom !== 0;
  }

  result.changed = !prevCoords || prevCoords.x !== result.coords.x || prevCoords.y !== result.coords.y || rectChanged;
  return result;
}

function beforeMove(arg) {
  const {
    interaction,
    phase,
    preEnd,
    skipModifiers
  } = arg;
  const {
    interactable,
    element
  } = interaction;
  const states = skipModifiers ? interaction.modifiers.states.slice(skipModifiers) : interaction.modifiers.states;
  const prevCoords = arg.prevCoords || (interaction.modifiers.result ? interaction.modifiers.result.coords : interaction.coords.prev.page);
  const modifierResult = setAll({
    interaction,
    interactable,
    element,
    preEnd,
    phase,
    pageCoords: arg.modifiedCoords || interaction.coords.cur.page,
    prevCoords,
    rect: interaction.rect,
    states,
    requireEndOnly: false
  });
  interaction.modifiers.result = modifierResult; // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before

  if (!modifierResult.changed && interaction.interacting()) {
    return false;
  }

  if (arg.modifiedCoords) {
    const {
      page
    } = interaction.coords.cur;
    const adjustment = {
      x: arg.modifiedCoords.x - page.x,
      y: arg.modifiedCoords.y - page.y
    };
    modifierResult.coords.x += adjustment.x;
    modifierResult.coords.y += adjustment.y;
    modifierResult.delta.x += adjustment.x;
    modifierResult.delta.y += adjustment.y;
  }

  setCoords(arg);
}

function beforeEnd(arg) {
  const {
    interaction,
    event,
    noPreEnd
  } = arg;
  const states = interaction.modifiers.states;

  if (noPreEnd || !states || !states.length) {
    return;
  }

  let didPreEnd = false;

  for (const state of states) {
    arg.state = state;
    const {
      options,
      methods
    } = state;
    const endResult = methods.beforeEnd && methods.beforeEnd(arg);

    if (endResult === false) {
      interaction.modifiers.endPrevented = true;
      return false;
    } // if the endOnly option is true for any modifier


    if (!didPreEnd && shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({
        event,
        preEnd: true
      });
      didPreEnd = true;
    }
  }
}

function stop(arg) {
  const {
    interaction
  } = arg;
  const states = interaction.modifiers.states;

  if (!states || !states.length) {
    return;
  }

  const modifierArg = extend({
    states,
    interactable: interaction.interactable,
    element: interaction.element,
    rect: null
  }, arg);

  for (const state of states) {
    modifierArg.state = state;

    if (state.methods.stop) {
      state.methods.stop(modifierArg);
    }
  }

  arg.interaction.modifiers.states = null;
  arg.interaction.modifiers.endPrevented = null;
}

function getModifierList(interaction) {
  const actionOptions = interaction.interactable.options[interaction.prepared.name];
  const actionModifiers = actionOptions.modifiers;

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers.filter(modifier => !modifier.options || modifier.options.enabled !== false);
  }

  return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize'].map(type => {
    const options = actionOptions[type];
    return options && options.enabled && {
      options,
      methods: options._methods
    };
  }).filter(m => !!m);
}

export function prepareStates(modifierList) {
  const states = [];

  for (let index = 0; index < modifierList.length; index++) {
    const {
      options,
      methods,
      name
    } = modifierList[index];

    if (options && options.enabled === false) {
      continue;
    }

    states.push({
      options,
      methods,
      index,
      name
    });
  }

  return states;
}
export function setCoords(arg) {
  const {
    interaction,
    phase
  } = arg;
  const curCoords = interaction.coords.cur;
  const startCoords = interaction.coords.start;
  const {
    result,
    startDelta
  } = interaction.modifiers;
  const curDelta = result.delta;

  if (phase === 'start') {
    extend(interaction.modifiers.startDelta, result.delta);
  }

  for (const [coordsSet, delta] of [[startCoords, startDelta], [curCoords, curDelta]]) {
    coordsSet.page.x += delta.x;
    coordsSet.page.y += delta.y;
    coordsSet.client.x += delta.x;
    coordsSet.client.y += delta.y;
  }

  const {
    rectDelta
  } = interaction.modifiers.result;
  const rect = arg.rect || interaction.rect;
  rect.left += rectDelta.left;
  rect.right += rectDelta.right;
  rect.top += rectDelta.top;
  rect.bottom += rectDelta.bottom;
  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;
}
export function restoreCoords({
  interaction: {
    coords,
    rect,
    modifiers
  }
}) {
  if (!modifiers.result) {
    return;
  }

  const {
    startDelta
  } = modifiers;
  const {
    delta: curDelta,
    rectDelta
  } = modifiers.result;
  const coordsAndDeltas = [[coords.start, startDelta], [coords.cur, curDelta]];

  for (const [coordsSet, delta] of coordsAndDeltas) {
    coordsSet.page.x -= delta.x;
    coordsSet.page.y -= delta.y;
    coordsSet.client.x -= delta.x;
    coordsSet.client.y -= delta.y;
  }

  rect.left -= rectDelta.left;
  rect.right -= rectDelta.right;
  rect.top -= rectDelta.top;
  rect.bottom -= rectDelta.bottom;
}

function shouldDo(options, preEnd, requireEndOnly, phase) {
  return options ? options.enabled !== false && (preEnd || !options.endOnly) && (!requireEndOnly || options.endOnly || options.alwaysOnEnd) && (options.setStart || phase !== 'start') : !requireEndOnly;
}

function getRectOffset(rect, coords) {
  return rect ? {
    left: coords.x - rect.left,
    top: coords.y - rect.top,
    right: rect.right - coords.x,
    bottom: rect.bottom - coords.y
  } : {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  };
}

export function makeModifier(module, name) {
  const {
    defaults
  } = module;
  const methods = {
    start: module.start,
    set: module.set,
    beforeEnd: module.beforeEnd,
    stop: module.stop
  };

  const modifier = _options => {
    const options = _options || {};
    options.enabled = options.enabled !== false; // add missing defaults to options

    for (const prop in defaults) {
      if (!(prop in options)) {
        options[prop] = defaults[prop];
      }
    }

    const m = {
      options,
      methods,
      name
    };
    return m;
  };

  if (name && typeof name === 'string') {
    // for backwrads compatibility
    modifier._defaults = defaults;
    modifier._methods = methods;
  }

  return modifier;
}
export default {
  id: 'modifiers/base',
  install: scope => {
    scope.defaults.perAction.modifiers = [];
  },
  listeners: {
    'interactions:new': ({
      interaction
    }) => {
      interaction.modifiers = {
        startOffset: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        },
        offsets: {},
        states: null,
        result: null,
        endPrevented: false,
        startDelta: null
      };
    },
    'interactions:before-action-start': arg => {
      start(arg, arg.interaction.coords.start.page, arg.interaction.coords.prev.page);
      setCoords(arg);
    },
    'interactions:action-resume': arg => {
      stop(arg);
      start(arg, arg.interaction.coords.cur.page, arg.interaction.modifiers.result.coords);
      beforeMove(arg);
    },
    'interactions:after-action-move': restoreCoords,
    'interactions:before-action-move': beforeMove,
    'interactions:after-action-start': restoreCoords,
    'interactions:before-action-end': beforeEnd,
    'interactions:stop': stop
  },
  before: 'ations',
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
  makeModifier
};
//# sourceMappingURL=base.js.map