const scope       = require('../scope');
const Interaction = require('../Interaction');
const utils       = require('../utils');
const browser     = require('../utils/browser');
const defaults    = require('../defaultOptions');
const signals     = require('../utils/Signals').new();

const simpleSignals = [ 'down', 'up', 'up', 'cancel' ];
const simpleEvents = [ 'down', 'up', 'tap', 'cancel' ];

function preventOriginalDefault () {
  this.originalEvent.preventDefault();
}

function stopImmediatePropagation () {
  this.immediatePropagationStopped = this.propagationStopped = true;
}

function stopPropagation () {
  this.propagationStopped = true;
}

function firePointers (interaction, pointer, event, eventTarget, targets, eventType) {
  const pointerIndex = interaction.mouse? 0 : utils.indexOf(interaction.pointerIds, utils.getPointerId(pointer));
  let pointerEvent = {};
  let i;
  // for tap events
  let interval;
  let createNewDoubleTap;

  // if it's a doubletap then the event properties would have been
  // copied from the tap event and provided as the pointer argument
  if (eventType === 'doubletap') {
    pointerEvent = pointer;
  }
  else {
    utils.pointerExtend(pointerEvent, event);
    if (event !== pointer) {
      utils.pointerExtend(pointerEvent, pointer);
    }

    pointerEvent.preventDefault           = preventOriginalDefault;
    pointerEvent.stopPropagation          = stopPropagation;
    pointerEvent.stopImmediatePropagation = stopImmediatePropagation;
    pointerEvent.interaction              = interaction;

    pointerEvent.timeStamp     = new Date().getTime();
    pointerEvent.originalEvent = event;
    pointerEvent.type          = eventType;
    pointerEvent.pointerId     = utils.getPointerId(pointer);
    pointerEvent.pointerType   = interaction.mouse? 'mouse' : !browser.supportsPointerEvent? 'touch'
      : utils.isString(pointer.pointerType)
        ? pointer.pointerType
        : [undefined, undefined,'touch', 'pen', 'mouse'][pointer.pointerType];
  }

  if (eventType === 'tap') {
    pointerEvent.dt = pointerEvent.timeStamp - interaction.downTimes[pointerIndex];

    interval = pointerEvent.timeStamp - interaction.tapTime;
    createNewDoubleTap = !!(interaction.prevTap && interaction.prevTap.type !== 'doubletap'
                            && interaction.prevTap.target === pointerEvent.target
                            && interval < 500);

    pointerEvent.double = createNewDoubleTap;

    interaction.tapTime = pointerEvent.timeStamp;
  }

  const signalArg = {
    pointerEvent,
    pointer,
    event,
    targets,
  };

  signals.fire('new', signalArg);

  for (i = 0; i < targets.length; i++) {
    const target = targets[i];

    pointerEvent.currentTarget = target.element;

    for (const prop in target.props || {}) {
      pointerEvent[prop] = target.props[prop];
    }

    target.eventable.fire(pointerEvent);

    if (pointerEvent.immediatePropagationStopped
        || (pointerEvent.propagationStopped
            && (i + 1) < targets.length && targets[i + 1].element !== pointerEvent.currentTarget)) {
      break;
    }
  }

  signals.fire('fired', signalArg);

  if (createNewDoubleTap) {
    const doubleTap = {};

    utils.extend(doubleTap, pointerEvent);

    doubleTap.dt   = interval;
    doubleTap.type = 'doubletap';

    collectEventTargets(interaction, doubleTap, event, eventTarget, 'doubletap');

    interaction.prevTap = doubleTap;
  }
  else if (eventType === 'tap') {
    interaction.prevTap = pointerEvent;
  }
}

function collectEventTargets (interaction, pointer, event, eventTarget, eventType) {
  const pointerIndex = interaction.mouse? 0 : utils.indexOf(interaction.pointerIds, utils.getPointerId(pointer));

  // do not fire a tap event if the pointer was moved before being lifted
  if (eventType === 'tap' && (interaction.pointerWasMoved
      // or if the pointerup target is different to the pointerdown target
      || !(interaction.downTargets[pointerIndex] && interaction.downTargets[pointerIndex] === eventTarget))) {
    return;
  }

  const targets = [];
  const path = utils.getPath(eventTarget);
  const signalArg = {
    targets,
    interaction,
    pointer,
    event,
    eventTarget,
    eventType,
    path,
    element: null,
  };

  for (const element of path) {
    signalArg.element = element;

    signals.fire('collect-targets', signalArg);
  }

  // create the tap event even if there are no listeners so that
  // doubletap can still be created and fired
  if (targets.length || eventType === 'tap') {
    firePointers(interaction, pointer, event, eventTarget, targets, eventType);
  }
}

Interaction.signals.on('move', function ({ interaction, pointer, event, eventTarget, duplicateMove }) {
  const pointerIndex = (interaction.mouse
    ? 0
    : utils.indexOf(interaction.pointerIds, utils.getPointerId(pointer)));

  if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
    if (interaction.pointerIsDown) {
      clearTimeout(interaction.holdTimers[pointerIndex]);
    }

    collectEventTargets(interaction, pointer, event, eventTarget, 'move');
  }
});

Interaction.signals.on('down', function ({ interaction, pointer, event, eventTarget, pointerIndex }) {
  // copy event to be used in timeout for IE8
  const eventCopy = browser.isIE8? utils.extend({}, event) : event;

  interaction.holdTimers[pointerIndex] = setTimeout(function () {

    collectEventTargets(interaction,
                        browser.isIE8? eventCopy : pointer,
                        eventCopy,
                        eventTarget,
                        'hold');

  }, defaults._holdDuration);
});

function createSignalListener (event) {
  return function (arg) {
    collectEventTargets(arg.interaction,
                        arg.pointer,
                        arg.event,
                        arg.eventTarget,
                        event);
  };
}

for (let i = 0; i < simpleSignals.length; i++) {
  Interaction.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
}

Interaction.signals.on('new', function (interaction) {
  interaction.prevTap = null;  // the most recent tap event on this interaction
  interaction.tapTime = 0;     // time of the most recent tap event
});

module.exports = scope.pointerEvents = {
  firePointers,
  collectEventTargets,
  preventOriginalDefault,
  signals,
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
