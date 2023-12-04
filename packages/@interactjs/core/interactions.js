"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _browser = _interopRequireDefault(require("../utils/browser.js"));
var _domObjects = _interopRequireDefault(require("../utils/domObjects.js"));
var _domUtils = require("../utils/domUtils.js");
var pointerUtils = _interopRequireWildcard(require("../utils/pointerUtils.js"));
var _interactablePreventDefault = _interopRequireDefault(require("./interactablePreventDefault"));
var _Interaction = _interopRequireDefault(require("./Interaction"));
var _interactionFinder = _interopRequireDefault(require("./interactionFinder"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */

/* eslint-enable import/no-duplicates */

const methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];
function install(scope) {
  const listeners = {};
  for (const method of methodNames) {
    listeners[method] = doOnInteractions(method, scope);
  }
  const pEventTypes = _browser.default.pEventTypes;
  let docEvents;
  if (_domObjects.default.PointerEvent) {
    docEvents = [{
      type: pEventTypes.down,
      listener: releasePointersOnRemovedEls
    }, {
      type: pEventTypes.down,
      listener: listeners.pointerDown
    }, {
      type: pEventTypes.move,
      listener: listeners.pointerMove
    }, {
      type: pEventTypes.up,
      listener: listeners.pointerUp
    }, {
      type: pEventTypes.cancel,
      listener: listeners.pointerUp
    }];
  } else {
    docEvents = [{
      type: 'mousedown',
      listener: listeners.pointerDown
    }, {
      type: 'mousemove',
      listener: listeners.pointerMove
    }, {
      type: 'mouseup',
      listener: listeners.pointerUp
    }, {
      type: 'touchstart',
      listener: releasePointersOnRemovedEls
    }, {
      type: 'touchstart',
      listener: listeners.pointerDown
    }, {
      type: 'touchmove',
      listener: listeners.pointerMove
    }, {
      type: 'touchend',
      listener: listeners.pointerUp
    }, {
      type: 'touchcancel',
      listener: listeners.pointerUp
    }];
  }
  docEvents.push({
    type: 'blur',
    listener(event) {
      for (const interaction of scope.interactions.list) {
        interaction.documentBlur(event);
      }
    }
  });

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0;
  scope.Interaction = class extends _Interaction.default {
    get pointerMoveTolerance() {
      return scope.interactions.pointerMoveTolerance;
    }
    set pointerMoveTolerance(value) {
      scope.interactions.pointerMoveTolerance = value;
    }
    _now() {
      return scope.now();
    }
  };
  scope.interactions = {
    // all active and idle interactions
    list: [],
    new(options) {
      options.scopeFire = (name, arg) => scope.fire(name, arg);
      const interaction = new scope.Interaction(options);
      scope.interactions.list.push(interaction);
      return interaction;
    },
    listeners,
    docEvents,
    pointerMoveTolerance: 1
  };
  function releasePointersOnRemovedEls() {
    // for all inactive touch interactions with pointers down
    for (const interaction of scope.interactions.list) {
      if (!interaction.pointerIsDown || interaction.pointerType !== 'touch' || interaction._interacting) {
        continue;
      }

      // if a pointer is down on an element that is no longer in the DOM tree
      for (const pointer of interaction.pointers) {
        if (!scope.documents.some(({
          doc
        }) => (0, _domUtils.nodeContains)(doc, pointer.downTarget))) {
          // remove the pointer from the interaction
          interaction.removePointer(pointer.pointer, pointer.event);
        }
      }
    }
  }
  scope.usePlugin(_interactablePreventDefault.default);
}
function doOnInteractions(method, scope) {
  return function (event) {
    const interactions = scope.interactions.list;
    const pointerType = pointerUtils.getPointerType(event);
    const [eventTarget, curEventTarget] = pointerUtils.getEventTargets(event);
    const matches = []; // [ [pointer, interaction], ...]

    if (/^touch/.test(event.type)) {
      scope.prevTouchTime = scope.now();

      // @ts-expect-error
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
          scope
        };
        const interaction = getInteraction(searchDetails);
        matches.push([searchDetails.pointer, searchDetails.eventTarget, searchDetails.curEventTarget, interaction]);
      }
    } else {
      let invalidPointer = false;
      if (!_browser.default.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (let i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer || scope.now() - scope.prevTouchTime < 500 ||
        // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
        event.timeStamp === 0;
      }
      if (!invalidPointer) {
        const searchDetails = {
          pointer: event,
          pointerId: pointerUtils.getPointerId(event),
          pointerType,
          eventType: event.type,
          curEventTarget,
          eventTarget,
          scope
        };
        const interaction = getInteraction(searchDetails);
        matches.push([searchDetails.pointer, searchDetails.eventTarget, searchDetails.curEventTarget, interaction]);
      }
    }

    // eslint-disable-next-line no-shadow
    for (const [pointer, eventTarget, curEventTarget, interaction] of matches) {
      interaction[method](pointer, event, eventTarget, curEventTarget);
    }
  };
}
function getInteraction(searchDetails) {
  const {
    pointerType,
    scope
  } = searchDetails;
  const foundInteraction = _interactionFinder.default.search(searchDetails);
  const signalArg = {
    interaction: foundInteraction,
    searchDetails
  };
  scope.fire('interactions:find', signalArg);
  return signalArg.interaction || scope.interactions.new({
    pointerType
  });
}
function onDocSignal({
  doc,
  scope,
  options
}, eventMethodName) {
  const {
    interactions: {
      docEvents
    },
    events
  } = scope;
  const eventMethod = events[eventMethodName];
  if (scope.browser.isIOS && !options.events) {
    options.events = {
      passive: false
    };
  }

  // delegate event listener
  for (const eventType in events.delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener);
    eventMethod(doc, eventType, events.delegateUseCapture, true);
  }
  const eventOptions = options && options.events;
  for (const {
    type,
    listener
  } of docEvents) {
    eventMethod(doc, type, listener, eventOptions);
  }
}
const interactions = {
  id: 'core/interactions',
  install,
  listeners: {
    'scope:add-document': arg => onDocSignal(arg, 'add'),
    'scope:remove-document': arg => onDocSignal(arg, 'remove'),
    'interactable:unset': ({
      interactable
    }, scope) => {
      // Stop and destroy related interactions when an Interactable is unset
      for (let i = scope.interactions.list.length - 1; i >= 0; i--) {
        const interaction = scope.interactions.list[i];
        if (interaction.interactable !== interactable) {
          continue;
        }
        interaction.stop();
        scope.fire('interactions:destroy', {
          interaction
        });
        interaction.destroy();
        if (scope.interactions.list.length > 2) {
          scope.interactions.list.splice(i, 1);
        }
      }
    }
  },
  onDocSignal,
  doOnInteractions,
  methodNames
};
var _default = exports.default = interactions;
//# sourceMappingURL=interactions.js.map