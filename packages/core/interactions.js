import InteractionBase from './Interaction';
import events          from '@interactjs/utils/events';
import finder          from '@interactjs/utils/interactionFinder';
import browser         from '@interactjs/utils/browser';
import domObjects      from '@interactjs/utils/domObjects';
import pointerUtils    from '@interactjs/utils/pointerUtils';
import Signals         from '@interactjs/utils/Signals';

const methodNames = [
  'pointerDown', 'pointerMove', 'pointerUp',
  'updatePointer', 'removePointer', 'windowBlur',
];

function install (scope) {
  const signals = new Signals();

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
    for (const interaction of scope.interactions.list) {
      interaction.documentBlur(event);
    }
  };

  scope.signals.on('add-document'   , onDocSignal);
  scope.signals.on('remove-document', onDocSignal);

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0;

  scope.Interaction = class Interaction extends InteractionBase {
    get pointerMoveTolerance () {
      return scope.interactions.pointerMoveTolerance;
    }

    set pointerMoveTolerance (value) {
      scope.interactions.pointerMoveTolerance = value;
    }
  };
  scope.interactions = {
    signals,
    // all active and idle interactions
    list: [],
    new (options) {
      options.signals = signals;

      return new scope.Interaction(options);
    },
    listeners,
    eventMap,
    pointerMoveTolerance: 1,
  };

  scope.actions = {
    names: [],
    methodDict: {},
    eventTypes: [],
  };
}

function doOnInteractions (method, scope) {
  return (function (event) {
    const interactions = scope.interactions.list;

    const pointerType = pointerUtils.getPointerType(event);
    const [eventTarget, curEventTarget] = pointerUtils.getEventTargets(event);
    const matches = []; // [ [pointer, interaction], ...]

    if (browser.supportsTouch && /touch/.test(event.type)) {
      scope.prevTouchTime = new Date().getTime();

      for (const changedTouch of event.changedTouches) {
        const pointer = changedTouch;
        const pointerId = pointerUtils.getPointerId(pointer);
        const searchDetails = {
          pointer,
          pointerId,
          pointerType,
          eventType: event.type,
          eventTarget,
          curEventTarget,
          scope,
        };
        const interaction = getInteraction(searchDetails);

        matches.push([
          searchDetails.pointer,
          searchDetails.eventTarget,
          searchDetails.curEventTarget,
          interaction,
        ]);
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
        const searchDetails = {
          pointer: event,
          pointerId: pointerUtils.getPointerId(event),
          pointerType,
          eventType: event.type,
          curEventTarget,
          eventTarget,
          scope,
        };

        const interaction = getInteraction(searchDetails);

        matches.push([
          searchDetails.pointer,
          searchDetails.eventTarget,
          searchDetails.curEventTarget,
          interaction,
        ]);
      }
    }

    // eslint-disable-next-line no-shadow
    for (const [pointer, eventTarget, curEventTarget, interaction] of matches) {
      interaction[method](pointer, event, eventTarget, curEventTarget);
    }
  });
}

function getInteraction (searchDetails) {
  const { pointerType, scope } = searchDetails;

  const foundInteraction = finder.search(searchDetails);
  const signalArg = { interaction: foundInteraction, searchDetails };

  scope.interactions.signals.fire('find', signalArg);

  return signalArg.interaction || newInteraction({ pointerType }, scope);
}

export function newInteraction (options, scope) {
  const interaction = scope.interactions.new(options);

  scope.interactions.list.push(interaction);
  return interaction;
}

function onDocSignal ({ doc, scope, options }, signalName) {
  const { eventMap } = scope.interactions;
  const eventMethod = signalName.indexOf('add') === 0
    ? events.add : events.remove;

  if (scope.browser.isIOS && !options.events) {
    options.events = { passive: false };
  }

  // delegate event listener
  for (const eventType in events.delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener);
    eventMethod(doc, eventType, events.delegateUseCapture, true);
  }

  const eventOptions = options && options.events;

  for (const eventType in eventMap) {
    eventMethod(doc, eventType, eventMap[eventType], eventOptions);
  }
}

export default {
  install,
  onDocSignal,
  doOnInteractions,
  newInteraction,
  methodNames,
};
