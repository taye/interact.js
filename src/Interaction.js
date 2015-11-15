const scope          = require('./scope');
const utils          = require('./utils');
const Interactable   = require('./Interactable');
const events         = require('./utils/events');
const browser        = require('./utils/browser');
const finder         = require('./utils/interactionFinder');
const signals        = require('./utils/Signals').new();

const listeners   = {};
const methodNames = [
  'pointerDown', 'pointerMove', 'pointerUp',
  'addPointer', 'removePointer', 'recordPointer',
];

// for ignoring browser's simulated mouse events
let prevTouchTime = 0;

// all active and idle interactions
scope.interactions = [];

class Interaction {
  constructor () {
    this.target        = null; // current interactable being interacted with
    this.element       = null; // the target element of the interactable

    this.prepared      = {     // action that's ready to be fired on next move event
      name : null,
      axis : null,
      edges: null,
    };

    // keep track of added pointers
    this.pointers    = [];
    this.pointerIds  = [];
    this.downTargets = [];
    this.downTimes   = [];
    this.holdTimers  = [];

    // Previous native pointer move event coordinates
    this.prevCoords = {
      page     : { x: 0, y: 0 },
      client   : { x: 0, y: 0 },
      timeStamp: 0,
    };
    // current native pointer move event coordinates
    this.curCoords = {
      page     : { x: 0, y: 0 },
      client   : { x: 0, y: 0 },
      timeStamp: 0,
    };

    // Starting InteractEvent pointer coordinates
    this.startCoords = {
      page     : { x: 0, y: 0 },
      client   : { x: 0, y: 0 },
      timeStamp: 0,
    };

    // Change in coordinates and time of the pointer
    this.pointerDelta = {
      page     : { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
      client   : { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
      timeStamp: 0,
    };

    this.downEvent   = null;    // pointerdown/mousedown/touchstart event
    this.downPointer = {};

    this._eventTarget    = null;
    this._curEventTarget = null;

    this.prevEvent = null;      // previous action event

    this.pointerIsDown   = false;
    this.pointerWasMoved = false;
    this._interacting    = false;

    this.allowIfDuplicateMove = false;

    this.mouse = false;

    signals.fire('new', this);

    scope.interactions.push(this);
  }

  setEventXY (targetObj, pointers) {
    const pointer = (pointers.length > 1
                     ? utils.pointerAverage(pointers)
                     : pointers[0]);

    const tmpXY = {};

    utils.getPageXY(pointer, tmpXY, this);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;

    utils.getClientXY(pointer, tmpXY, this);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;

    targetObj.timeStamp = new Date().getTime();
  }

  pointerDown (pointer, event, eventTarget) {
    const pointerIndex = this.addPointer(pointer);

    this.pointerIsDown = true;

    if (!this.interacting()) {
      this.setEventXY(this.curCoords, this.pointers);
    }

    signals.fire('down', {
      pointer,
      event,
      eventTarget,
      pointerIndex,
      interaction: this,
    });

    if (!this.interacting()) {
      this.pointerIsDown = true;
      this.downEvent = event;

      this.downTimes[pointerIndex] = new Date().getTime();
      this.downTargets[pointerIndex] = eventTarget;

      this.pointerWasMoved = false;

      utils.pointerExtend(this.downPointer, pointer);
      utils.copyCoords(this.prevCoords, this.curCoords);
    }

    this.checkAndPreventDefault(event);
  }

  /*\
   * Interaction.start
   [ method ]
   *
   * Start an action with the given Interactable and Element as tartgets. The
   * action must be enabled for the target Interactable and an appropriate number
   * of pointers must be held down - 1 for drag/resize, 2 for gesture.
   *
   * Use it with `interactable.<action>able({ manualStart: false })` to always
   * [start actions manually](https://github.com/taye/interact.js/issues/114)
   *
   - action       (object)  The action to be performed - drag, resize, etc.
   - interactable (Interactable) The Interactable to target
   - element      (Element) The DOM Element to target
   = (object) interact
   **
   | interact(target)
   |   .draggable({
   |     // disable the default drag start by down->move
   |     manualStart: true
   |   })
   |   // start dragging after the user holds the pointer down
   |   .on('hold', function (event) {
   |     var interaction = event.interaction;
   |
   |     if (!interaction.interacting()) {
   |       interaction.start({ name: 'drag' },
   |                         event.interactable,
   |                         event.currentTarget);
   |     }
   | });
   \*/
  start (action, interactable, element) {
    if (this.interacting()
        || !this.pointerIsDown
        || this.pointerIds.length < (action.name === 'gesture'? 2 : 1)) {
      return;
    }

    // if this interaction had been removed after stopping
    // add it back
    if (utils.indexOf(scope.interactions, this) === -1) {
      scope.interactions.push(this);
    }

    // set the startCoords if there was no prepared action
    if (!this.prepared.name) {
      this.setEventXY(this.startCoords, this.pointers);
    }

    utils.copyAction(this.prepared, action);
    this.target         = interactable;
    this.element        = element;

    signals.fire('start', { interaction: this });

    signals.fire('start-' + this.prepared.name, {
      interaction: this,
      event: this.downEvent,
    });
  }

  pointerMove (pointer, event, eventTarget) {
    if (!this.simulation) {
      this.recordPointer(pointer);
      this.setEventXY(this.curCoords, this.pointers);
    }

    const duplicateMove = !this.allowIfDuplicateMove
      && (this.curCoords.page.x === this.prevCoords.page.x
          && this.curCoords.page.y === this.prevCoords.page.y
          && this.curCoords.client.x === this.prevCoords.client.x
          && this.curCoords.client.y === this.prevCoords.client.y);

    this.allowIfDuplicateMove = false;

    let dx;
    let dy;

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.curCoords.client.x - this.startCoords.client.x;
      dy = this.curCoords.client.y - this.startCoords.client.y;

      this.pointerWasMoved = utils.hypot(dx, dy) > scope.pointerMoveTolerance;
    }

    if (!duplicateMove) {
      // set pointer coordinate, time changes and speeds
      utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

      const signalArg = {
        pointer,
        event,
        eventTarget,
        dx,
        dy,
        duplicate: duplicateMove,
        interaction: this,
        interactingBeforeMove: this.interacting(),
      };

      signals.fire('move', signalArg);

      // if interacting, fire a 'move-{action}' signal
      if (this.interacting()) {
        this.doMove(signalArg);
      }

      if (this.pointerWasMoved) {
        utils.copyCoords(this.prevCoords, this.curCoords);
      }

      signals.fire('move-done', signalArg);
    }

    this.checkAndPreventDefault(event);
  }

  /*\
   * Interaction.doMove
   [ method ]
   *
   * Force a move of the current action at the same coordinates. Useful if
   * snap/restrict has been changed and you want a movement with the new
   * settings.
   *
   **
   | interact(target)
   |   .draggable(true)
   |   .on('dragmove', function (event) {
   |     if (someCondition) {
   |       // change the snap settings
   |       event.interactable.draggable({ snap: { targets: [] }});
   |       // fire another move event with re-calculated snap
   |       event.interaction.doMove();
   |     }
   |   });
   \*/
  doMove (signalArg) {
    signalArg = utils.extend({
      pointer: this.pointers[0],
      event: this.prevEvent,
      eventTarget: this._eventTarget,
      interaction: this,
    }, signalArg || {});

    signals.fire('before-action-move', signalArg);

    if (!this._dontFireMove) {
      signals.fire('move-' + this.prepared.name, signalArg);
    }

    this._dontFireMove = false;
  }

  // End interact move events and stop auto-scroll unless simulation is running
  pointerUp (pointer, event, eventTarget, curEventTarget) {
    this.checkAndPreventDefault(event);

    const pointerIndex = this.mouse? 0 : utils.indexOf(this.pointerIds, utils.getPointerId(pointer));

    clearTimeout(this.holdTimers[pointerIndex]);

    signals.fire(/cancel$/i.test(event.type)? 'cancel' : 'up', {
      pointer,
      event,
      eventTarget,
      curEventTarget,
      interaction: this,
    });

    if (!this.simulation) {
      this.end(event);
      this.removePointer(pointer);
    }
  }

  /*\
   * Interaction.end
   [ method ]
   *
   * Stop the current action and fire an end event. Inertial movement does
   * not happen.
   *
   - event (PointerEvent) #optional
   **
   | interact(target)
   |   .draggable(true)
   |   .on('move', function (event) {
   |     if (event.pageX > 1000) {
   |       // end the current action
   |       event.interaction.end();
   |       // stop all further listeners from being called
   |       event.stopImmediatePropagation();
   |     }
   |   });
   \*/
  end (event) {
    event = event || this.prevEvent;

    if (this.interacting()) {
      signals.fire('action-end', {
        event,
        interaction: this,
      });
    }

    this.stop();
  }

  currentAction () {
    return this._interacting? this.prepared.name: null;
  }

  interacting () {
    return this._interacting;
  }

  stop () {
    signals.fire('stop', { interaction: this });

    if (this._interacting) {
      signals.fire('stop-active', { interaction: this });
      signals.fire('stop-' + this.prepared.name, { interaction: this });
    }

    this.target = this.element = null;

    this.pointerIsDown = this._interacting = false;
    this.prepared.name = this.prevEvent = null;
  }

  addPointer (pointer) {
    const id = utils.getPointerId(pointer);
    let index = this.mouse? 0 : utils.indexOf(this.pointerIds, id);

    if (index === -1) {
      index = this.pointerIds.length;
    }

    this.pointerIds[index] = id;
    this.pointers[index] = pointer;

    return index;
  }

  removePointer (pointer) {
    const id = utils.getPointerId(pointer);
    const index = this.mouse? 0 : utils.indexOf(this.pointerIds, id);

    if (index === -1) { return; }

    this.pointers   .splice(index, 1);
    this.pointerIds .splice(index, 1);
    this.downTargets.splice(index, 1);
    this.downTimes  .splice(index, 1);
    this.holdTimers .splice(index, 1);
  }

  recordPointer (pointer) {
    const index = this.mouse? 0: utils.indexOf(this.pointerIds, utils.getPointerId(pointer));

    if (index === -1) { return; }

    this.pointers[index] = pointer;
  }

  checkAndPreventDefault (event) {
    const setting = this.target? this.target.options.preventDefault : 'never';

    if (setting === 'never') { return; }

    if (setting === 'always') {
      event.preventDefault();
      return;
    }

    // setting === 'auto'

    // don't preventDefault of pointerdown events
    if (/down|start/i.test(event.type)) {
      return;
    }

    // don't preventDefault on input elements
    if (/^(input|select|textarea)$/i.test(event.target.nodeName)) {
      return;
    }

    event.preventDefault();
  }

  _updateEventTargets (target, currentTarget) {
    this._eventTarget    = target;
    this._curEventTarget = currentTarget;
  }
}

// Check if the current target supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction (action, interactable) {
  if (utils.isObject(action) && interactable.options[action.name].enabled) {
    return action;
  }

  return null;
}

for (let i = 0, len = methodNames.length; i < len; i++) {
  const method = methodNames[i];

  listeners[method] = doOnInteractions(method);
}

function doOnInteractions (method) {
  return (function (event) {
    const eventTarget = utils.getActualElement(event.path ? event.path[0] : event.target);
    const curEventTarget = utils.getActualElement(event.currentTarget);
    const matches = []; // [ [pointer, interaction], ...]

    if (browser.supportsTouch && /touch/.test(event.type)) {
      prevTouchTime = new Date().getTime();

      for (let i = 0; i < event.changedTouches.length; i++) {
        const pointer = event.changedTouches[i];
        const interaction = finder.search(pointer, event.type, eventTarget);

        matches.push([pointer, interaction || new Interaction()]);
      }
    }
    else {
      let invalidPointer = false;

      if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (let i = 0; i < scope.interactions.length && !invalidPointer; i++) {
          invalidPointer = !scope.interactions[i].mouse && scope.interactions[i].pointerIsDown;
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer || (new Date().getTime() - prevTouchTime < 500);
      }

      if (!invalidPointer) {
        let interaction = finder.search(event, event.type, eventTarget);

        if (!interaction) {

          interaction = new Interaction();
          interaction.mouse = (/mouse/i.test(event.pointerType || event.type)
                               // MSPointerEvent.MSPOINTER_TYPE_MOUSE
                               || event.pointerType === 4);
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

// prevent native HTML5 drag on interact.js target elements
function preventNativeDrag (event) {
  for (const interaction of scope.interactions) {

    if (interaction.element
        && (interaction.element === event.target
            || utils.nodeContains(interaction.element, event.target))) {

      interaction.checkAndPreventDefault(event);
      return;
    }
  }
}

const docEvents = { /* 'eventType': listenerFunc */ };
const pEventTypes = browser.pEventTypes;

if (scope.PointerEvent) {
  docEvents[pEventTypes.down  ] = listeners.pointerDown;
  docEvents[pEventTypes.move  ] = listeners.pointerMove;
  docEvents[pEventTypes.up    ] = listeners.pointerUp;
  docEvents[pEventTypes.cancel] = listeners.pointerUp;
}
else {
  docEvents.mousedown   = listeners.pointerDown;
  docEvents.mousemove   = listeners.pointerMove;
  docEvents.mouseup     = listeners.pointerUp;

  docEvents.touchstart  = listeners.pointerDown;
  docEvents.touchmove   = listeners.pointerMove;
  docEvents.touchend    = listeners.pointerUp;
  docEvents.touchcancel = listeners.pointerUp;
}

docEvents.blur = scope.endAllInteractions;
docEvents.dragstart = preventNativeDrag;

function onDocSignal ({ doc }, signalName) {
  const eventMethod = signalName.indexOf('add') === 0
    ? events.add : events.remove;

  // delegate event listener
  for (const eventType in scope.delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener);
    eventMethod(doc, eventType, events.delegateUseCapture, true);
  }

  for (const eventType in docEvents) {
    eventMethod(doc, eventType, docEvents[eventType]);
  }
}

scope.signals.on('add-document'   , onDocSignal);
scope.signals.on('remove-document', onDocSignal);

// Stop related interactions when an Interactable is unset
Interactable.signals.on('unset', function ( {interactable} ) {
  for (const interaction of scope.interactions) {
    if (interaction.target === interactable && interaction.interacting()) {
      interaction.end();
    }
  }
});

Interaction.doOnInteractions = doOnInteractions;
Interaction.withinLimit = scope.withinInteractionLimit;
Interaction.validateAction = validateAction;
Interaction.signals = signals;

module.exports = Interaction;
