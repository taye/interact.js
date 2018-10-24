import * as utils   from '@interactjs/utils';
import PointerEvent from './PointerEvent';

const signals       = new utils.Signals();
const simpleSignals = [ 'down', 'up', 'cancel' ];
const simpleEvents  = [ 'down', 'up', 'cancel' ];

const pointerEvents = {
  install,
  signals,
  PointerEvent,
  fire,
  collectEventTargets,
  createSignalListener,
  defaults: {
    holdDuration: 600,
    ignoreFrom  : null,
    allowFrom   : null,
    origin      : { x: 0, y: 0 },
  },
  types: [
    'down',
    'move',
    'up',
    'cancel',
    'tap',
    'doubletap',
    'hold',
  ],
};

function fire (arg) {
  const {
    interaction, pointer, event, eventTarget,
    type = arg.pointerEvent.type,
    targets = collectEventTargets(arg),
    pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction),
  } = arg;

  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    targets,
    type,
    pointerEvent,
  };

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];

    for (const prop in target.props || {}) {
      pointerEvent[prop] = target.props[prop];
    }

    const origin = utils.getOriginXY(target.eventable, target.element);

    pointerEvent.subtractOrigin(origin);
    pointerEvent.eventable = target.eventable;
    pointerEvent.currentTarget = target.element;

    target.eventable.fire(pointerEvent);

    pointerEvent.addOrigin(origin);

    if (pointerEvent.immediatePropagationStopped
        || (pointerEvent.propagationStopped
            && (i + 1) < targets.length && targets[i + 1].element !== pointerEvent.currentTarget)) {
      break;
    }
  }

  signals.fire('fired', signalArg);

  if (type === 'tap') {
    // if pointerEvent should make a double tap, create and fire a doubletap
    // PointerEvent and use that as the prevTap
    const prevTap = pointerEvent.double
      ? fire({
        interaction, pointer, event, eventTarget,
        type: 'doubletap',
      })
      : pointerEvent;

    interaction.prevTap = prevTap;
    interaction.tapTime = prevTap.timeStamp;
  }

  return pointerEvent;
}

function collectEventTargets ({ interaction, pointer, event, eventTarget, type }) {
  const pointerIndex = interaction.getPointerIndex(pointer);
  const pointerInfo = interaction.pointers[pointerIndex];

  // do not fire a tap event if the pointer was moved before being lifted
  if (type === 'tap' && (interaction.pointerWasMoved
      // or if the pointerup target is different to the pointerdown target
      || !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
    return [];
  }

  const path = utils.dom.getPath(eventTarget);
  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    type,
    path,
    targets: [],
    element: null,
  };

  for (const element of path) {
    signalArg.element = element;

    signals.fire('collect-targets', signalArg);
  }

  if (type === 'hold') {
    signalArg.targets = signalArg.targets.filter(target =>
      target.eventable.options.holdDuration === interaction.pointers[pointerIndex].hold.duration);
  }

  return signalArg.targets;
}

function install (scope) {
  const {
    interactions,
  } = scope;

  scope.pointerEvents = pointerEvents;
  scope.defaults.pointerEvents = pointerEvents.defaults;

  interactions.signals.on('new', interaction => {
    interaction.prevTap    = null;  // the most recent tap event on this interaction
    interaction.tapTime    = 0;     // time of the most recent tap event
  });

  interactions.signals.on('update-pointer', function ({ down, pointerInfo }) {
    if (!down && pointerInfo.hold) {
      return;
    }

    pointerInfo.hold = { duration: Infinity, timeout: null };
  });

  interactions.signals.on('move', function ({ interaction, pointer, event, eventTarget, duplicateMove }) {
    const pointerIndex = interaction.getPointerIndex(pointer);

    if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
      }

      fire({
        interaction, pointer, event, eventTarget,
        type: 'move',
      });
    }
  });

  interactions.signals.on('down', function ({ interaction, pointer, event, eventTarget, pointerIndex }) {
    const timer = interaction.pointers[pointerIndex].hold;
    const path = utils.dom.getPath(eventTarget);
    const signalArg = {
      interaction,
      pointer,
      event,
      eventTarget,
      type: 'hold',
      targets: [],
      path,
      element: null,
    };

    for (const element of path) {
      signalArg.element = element;

      signals.fire('collect-targets', signalArg);
    }

    if (!signalArg.targets.length) { return; }

    let minDuration = Infinity;

    for (const target of signalArg.targets) {
      const holdDuration = target.eventable.options.holdDuration;

      if (holdDuration < minDuration) {
        minDuration = holdDuration;
      }
    }

    timer.duration = minDuration;
    timer.timeout = setTimeout(function () {
      fire({
        interaction,
        eventTarget,
        pointer,
        event,
        type: 'hold',
      });
    }, minDuration);
  });

  interactions.signals.on('up', ({ interaction, pointer, event, eventTarget }) => {
    if (!interaction.pointerWasMoved) {
      fire({ interaction, eventTarget, pointer, event, type: 'tap' });
    }
  });

  for (const signalName of ['up', 'cancel']) {
    interactions.signals.on(signalName, function ({ interaction, pointerIndex }) {
      if (interaction.pointers[pointerIndex].hold) {
        clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
      }
    });
  }

  for (let i = 0; i < simpleSignals.length; i++) {
    interactions.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
  }
}

function createSignalListener (type) {
  return function ({ interaction, pointer, event, eventTarget }) {
    fire({ interaction, eventTarget, pointer, event, type });
  };
}

export default pointerEvents;
