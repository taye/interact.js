import * as domUtils from "../utils/domUtils.js";
import extend from "../utils/extend.js";
import getOriginXY from "../utils/getOriginXY.js";
import { PointerEvent } from "./PointerEvent.js";
const defaults = {
  holdDuration: 600,
  ignoreFrom: null,
  allowFrom: null,
  origin: {
    x: 0,
    y: 0
  }
};
const pointerEvents = {
  id: 'pointer-events/base',
  before: ['inertia', 'modifiers', 'auto-start', 'actions'],
  install,
  listeners: {
    'interactions:new': addInteractionProps,
    'interactions:update-pointer': addHoldInfo,
    'interactions:move': moveAndClearHold,
    'interactions:down': (arg, scope) => {
      downAndStartHold(arg, scope);
      fire(arg, scope);
    },
    'interactions:up': (arg, scope) => {
      clearHold(arg);
      fire(arg, scope);
      tapAfterUp(arg, scope);
    },
    'interactions:cancel': (arg, scope) => {
      clearHold(arg);
      fire(arg, scope);
    }
  },
  PointerEvent,
  fire,
  collectEventTargets,
  defaults,
  types: {
    down: true,
    move: true,
    up: true,
    cancel: true,
    tap: true,
    doubletap: true,
    hold: true
  }
};

function fire(arg, scope) {
  const {
    interaction,
    pointer,
    event,
    eventTarget,
    type,
    targets = collectEventTargets(arg, scope)
  } = arg;
  const pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction, scope.now());
  scope.fire('pointerEvents:new', {
    pointerEvent
  });
  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    targets,
    type,
    pointerEvent
  };

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];

    for (const prop in target.props || {}) {
      ;
      pointerEvent[prop] = target.props[prop];
    }

    const origin = getOriginXY(target.eventable, target.node);

    pointerEvent._subtractOrigin(origin);

    pointerEvent.eventable = target.eventable;
    pointerEvent.currentTarget = target.node;
    target.eventable.fire(pointerEvent);

    pointerEvent._addOrigin(origin);

    if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].node !== pointerEvent.currentTarget) {
      break;
    }
  }

  scope.fire('pointerEvents:fired', signalArg);

  if (type === 'tap') {
    // if pointerEvent should make a double tap, create and fire a doubletap
    // PointerEvent and use that as the prevTap
    const prevTap = pointerEvent.double ? fire({
      interaction,
      pointer,
      event,
      eventTarget,
      type: 'doubletap'
    }, scope) : pointerEvent;
    interaction.prevTap = prevTap;
    interaction.tapTime = prevTap.timeStamp;
  }

  return pointerEvent;
}

function collectEventTargets({
  interaction,
  pointer,
  event,
  eventTarget,
  type
}, scope) {
  const pointerIndex = interaction.getPointerIndex(pointer);
  const pointerInfo = interaction.pointers[pointerIndex]; // do not fire a tap event if the pointer was moved before being lifted

  if (type === 'tap' && (interaction.pointerWasMoved || // or if the pointerup target is different to the pointerdown target
  !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
    return [];
  }

  const path = domUtils.getPath(eventTarget);
  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    type,
    path,
    targets: [],
    node: null
  };

  for (const node of path) {
    signalArg.node = node;
    scope.fire('pointerEvents:collect-targets', signalArg);
  }

  if (type === 'hold') {
    signalArg.targets = signalArg.targets.filter(target => {
      var _interaction$pointers;

      return target.eventable.options.holdDuration === ((_interaction$pointers = interaction.pointers[pointerIndex]) == null ? void 0 : _interaction$pointers.hold.duration);
    });
  }

  return signalArg.targets;
}

function addInteractionProps({
  interaction
}) {
  interaction.prevTap = null; // the most recent tap event on this interaction

  interaction.tapTime = 0; // time of the most recent tap event
}

function addHoldInfo({
  down,
  pointerInfo
}) {
  if (!down && pointerInfo.hold) {
    return;
  }

  pointerInfo.hold = {
    duration: Infinity,
    timeout: null
  };
}

function clearHold({
  interaction,
  pointerIndex
}) {
  const hold = interaction.pointers[pointerIndex].hold;

  if (hold && hold.timeout) {
    clearTimeout(hold.timeout);
    hold.timeout = null;
  }
}

function moveAndClearHold(arg, scope) {
  const {
    interaction,
    pointer,
    event,
    eventTarget,
    duplicate
  } = arg;

  if (!duplicate && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
    if (interaction.pointerIsDown) {
      clearHold(arg);
    }

    fire({
      interaction,
      pointer,
      event,
      eventTarget: eventTarget,
      type: 'move'
    }, scope);
  }
}

function downAndStartHold({
  interaction,
  pointer,
  event,
  eventTarget,
  pointerIndex
}, scope) {
  const timer = interaction.pointers[pointerIndex].hold;
  const path = domUtils.getPath(eventTarget);
  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    type: 'hold',
    targets: [],
    path,
    node: null
  };

  for (const node of path) {
    signalArg.node = node;
    scope.fire('pointerEvents:collect-targets', signalArg);
  }

  if (!signalArg.targets.length) return;
  let minDuration = Infinity;

  for (const target of signalArg.targets) {
    const holdDuration = target.eventable.options.holdDuration;

    if (holdDuration < minDuration) {
      minDuration = holdDuration;
    }
  }

  timer.duration = minDuration;
  timer.timeout = setTimeout(() => {
    fire({
      interaction,
      eventTarget,
      pointer,
      event,
      type: 'hold'
    }, scope);
  }, minDuration);
}

function tapAfterUp({
  interaction,
  pointer,
  event,
  eventTarget
}, scope) {
  if (!interaction.pointerWasMoved) {
    fire({
      interaction,
      eventTarget,
      pointer,
      event,
      type: 'tap'
    }, scope);
  }
}

function install(scope) {
  scope.pointerEvents = pointerEvents;
  scope.defaults.actions.pointerEvents = pointerEvents.defaults;
  extend(scope.actions.phaselessTypes, pointerEvents.types);
}

export default pointerEvents;
//# sourceMappingURL=base.js.map