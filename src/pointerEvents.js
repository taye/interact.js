const scope = require('./scope');
const Interaction = require('./Interaction');
const InteractEvent = require('./InteractEvent');
const utils = require('./utils');
const browser = require('./utils/browser');
const events = require('./utils/events');
const signals = require('./utils/signals');
const simpleSignals = [
  'interaction-down',
  'interaction-up',
  'interaction-up',
  'interaction-cancel',
];
const simpleEvents = [
  'down',
  'up',
  'tap',
  'cancel',
];

function preventOriginalDefault () {
  this.originalEvent.preventDefault();
}

function firePointers (interaction, pointer, event, eventTarget, targets, elements, eventType) {
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
    utils.extend(pointerEvent, event);
    if (event !== pointer) {
      utils.extend(pointerEvent, pointer);
    }

    pointerEvent.preventDefault           = preventOriginalDefault;
    pointerEvent.stopPropagation          = InteractEvent.prototype.stopPropagation;
    pointerEvent.stopImmediatePropagation = InteractEvent.prototype.stopImmediatePropagation;
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

  for (i = 0; i < targets.length; i++) {
    pointerEvent.currentTarget = elements[i];
    pointerEvent.interactable = targets[i];
    targets[i].fire(pointerEvent);

    if (pointerEvent.immediatePropagationStopped
        || (pointerEvent.propagationStopped
            && elements[i + 1] !== pointerEvent.currentTarget)) {
      break;
    }
  }

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
  const elements = [];
  let element = eventTarget;

  function collectSelectors (interactable, selector, context) {
    const els = browser.useMatchesSelectorPolyfill
        ? context.querySelectorAll(selector)
        : undefined;

    if (interactable._iEvents[eventType]
        && utils.isElement(element)
        && scope.inContext(interactable, element)
        && !scope.testIgnore(interactable, element, eventTarget)
        && scope.testAllow(interactable, element, eventTarget)
        && utils.matchesSelector(element, selector, els)) {

      targets.push(interactable);
      elements.push(element);
    }
  }

  const interact = scope.interact;

  while (element) {
    if (interact.isSet(element) && interact(element)._iEvents[eventType]) {
      targets.push(interact(element));
      elements.push(element);
    }

    scope.interactables.forEachSelector(collectSelectors);

    element = utils.parentElement(element);
  }

  // create the tap event even if there are no listeners so that
  // doubletap can still be created and fired
  if (targets.length || eventType === 'tap') {
    firePointers(interaction, pointer, event, eventTarget, targets, elements, eventType);
  }
}

signals.on('interaction-move', function (arg) {
  const interaction = arg.interaction;
  const pointerIndex = (interaction.mouse
    ? 0
    : utils.indexOf(interaction.pointerIds, utils.getPointerId(arg.pointer)));

  if (!arg.duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
    if (interaction.pointerIsDown) {
      clearTimeout(interaction.holdTimers[pointerIndex]);
    }

    collectEventTargets(interaction, arg.pointer, arg.event, arg.eventTarget, 'move');
  }
});

signals.on('interaction-down', function (arg) {
  const interaction = arg.interaction;
  // copy event to be used in timeout for IE8
  const eventCopy = browser.isIE8? utils.extend({}, arg.event) : arg.event;

  interaction.holdTimers[arg.pointerIndex] = setTimeout(function () {

    collectEventTargets(interaction,
                        browser.isIE8? eventCopy : arg.pointer,
                        eventCopy,
                        arg.eventTarget,
                        'hold');

  }, scope.defaultOptions._holdDuration);
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
  signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
}

if (browser.ie8) {
  // http://www.quirksmode.org/dom/events/click.html
  // >Events leading to dblclick
  //
  // IE8 doesn't fire down event before dblclick.
  // This workaround tries to fire a tap and doubletap after dblclick
  const onIE8Dblclick = function (event) {
    const target = Interaction.getInteractionFromPointer(event);

    if (!target) { return; }

    const interaction = target.interaction;

    if (interaction.prevTap
        && event.clientX === interaction.prevTap.clientX
        && event.clientY === interaction.prevTap.clientY
        && target.eventTarget   === interaction.prevTap.target) {

      interaction.downTargets[0] = target.eventTarget;
      interaction.downTimes[0] = new Date().getTime();
      collectEventTargets(interaction, target.pointer, target.event, target.eventTarget, 'tap');
    }
  };

  signals.on('listen-to-document', function (arg) {
    events.add(arg.doc, 'dblclick', onIE8Dblclick);
  });
}

utils.merge(scope.eventTypes, [
  'down',
  'move',
  'up',
  'cancel',
  'tap',
  'doubletap',
  'hold',
]);

module.exports = {
  firePointers: firePointers,
  collectEventTargets: collectEventTargets,
  preventOriginalDefault: preventOriginalDefault,
};
