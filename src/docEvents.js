const utils        = require('./utils');
const events       = require('./utils/events');
const finder       = require('./utils/interactionFinder');
const browser      = require('./utils/browser');
const domObjects   = require('./utils/domObjects');

const methodNames = [
  'pointerDown', 'pointerMove', 'pointerUp',
  'updatePointer', 'removePointer', 'windowBlur',
];

function init (scope) {
  const listeners = {};

  for (const method of methodNames) {
    listeners[method] = doOnInteractions(method, scope);
  }

  const eventMap = { /* 'eventType': listenerFunc */ };
  const pEventTypes = browser.pEventTypes;

  if (domObjects.PointerEvent) {
    eventMap[pEventTypes.down  ] = listeners.pointerDown;
    eventMap[pEventTypes.move  ] = listeners.pointerMove;
    eventMap[pEventTypes.up    ] = listeners.pointerUp;
    eventMap[pEventTypes.cancel] = listeners.pointerUp;
  }
  else {
    eventMap.mousedown   = listeners.pointerDown;
    eventMap.mousemove   = listeners.pointerMove;
    eventMap.mouseup     = listeners.pointerUp;

    eventMap.touchstart  = listeners.pointerDown;
    eventMap.touchmove   = listeners.pointerMove;
    eventMap.touchend    = listeners.pointerUp;
    eventMap.touchcancel = listeners.pointerUp;
  }

  eventMap.blur = event => {
    for (const interaction of scope.interactions) {
      interaction.documentBlur(event);
    }
  };

  scope.signals.on('add-document'   , onDocSignal);
  scope.signals.on('remove-document', onDocSignal);

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0;

  scope.docEvents = {
    listeners,
    eventMap,
  };
}

function doOnInteractions (method, scope) {
  return (function (event) {
    const { interactions } = scope;

    const pointerType = utils.getPointerType(event);
    const [eventTarget, curEventTarget] = utils.getEventTargets(event);
    const matches = []; // [ [pointer, interaction], ...]

    if (browser.supportsTouch && /touch/.test(event.type)) {
      scope.prevTouchTime = new Date().getTime();

      for (const changedTouch of event.changedTouches) {
        const pointer = changedTouch;
        const interaction = finder.search(pointer, event.type, eventTarget, scope);

        matches.push([pointer, interaction || newInteraction({ pointerType }, scope)]);
      }
    }
    else {
      let invalidPointer = false;

      if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (let i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer
          || (new Date().getTime() - scope.prevTouchTime < 500)
          // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
          || event.timeStamp === 0;
      }

      if (!invalidPointer) {
        let interaction = finder.search(event, event.type, eventTarget, scope);

        if (!interaction) {
          interaction = newInteraction({ pointerType }, scope);
        }

        matches.push([event, interaction]);
      }
    }

    for (const [pointer, interaction] of matches) {
      interaction._updateEventTargets(eventTarget, curEventTarget);
      interaction[method](pointer, event, eventTarget, curEventTarget);
    }
  });
}

function newInteraction (options, scope) {
  const interaction = scope.Interaction.new(options);

  scope.interactions.push(interaction);
  return interaction;
}

function onDocSignal ({ doc, scope, options }, signalName) {
  const { delegatedEvents, eventMap } = scope.docEvents;
  const eventMethod = signalName.indexOf('add') === 0
    ? events.add : events.remove;

  // delegate event listener
  for (const eventType in delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener);
    eventMethod(doc, eventType, events.delegateUseCapture, true);
  }

  const eventOptions = options && options.events;

  for (const eventType in eventMap) {
    eventMethod(doc, eventType, eventMap[eventType], eventOptions);
  }
}

module.exports = {
  init,
  onDocSignal,
  doOnInteractions,
  newInteraction,
  methodNames,
};
