const scope          = require('./scope');
const utils          = require('./utils');
const InteractEvent  = require('./InteractEvent');
const Interactable   = require('./Interactable');
const events         = require('./utils/events');
const browser        = require('./utils/browser');
const finder         = require('./utils/interactionFinder');
const animationFrame = utils.raf;

const signals = new (require('./utils/Signals'))();

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

    this.inertiaStatus = {
      active   : false,
      smoothEnd: false,
      ending   : false,

      startEvent: null,
      upCoords  : {},

      xe: 0, ye: 0,
      sx: 0, sy: 0,

      t0: 0,
      vx0: 0, vys: 0,
      duration: 0,

      resumeDx: 0,
      resumeDy: 0,

      lambda_v0: 0,
      one_ve_v0: 0,
      i  : null,
    };

    this.boundInertiaFrame   = () => this.inertiaFrame  ();
    this.boundSmoothEndFrame = () => this.smoothEndFrame();

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

    // Check if the down event hits the current inertia target
    if (this.inertiaStatus.active) {
      let element = eventTarget;

      // climb up the DOM tree from the event target
      while (utils.isElement(element)) {

        // if this element is the current inertia target element
        if (element === this.element) {

          // stop inertia so that the next move will be a normal one
          animationFrame.cancel(this.inertiaStatus.i);
          this.inertiaStatus.active = false;

          this.doMove();
          break;
        }
        element = utils.parentElement(element);
      }
    }

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
    if (this.inertiaStatus.active) {
      const pageUp   = this.inertiaStatus.upCoords.page;
      const clientUp = this.inertiaStatus.upCoords.client;

      this.setEventXY(this.curCoords, [ {
        pageX  : pageUp.x   + this.inertiaStatus.sx,
        pageY  : pageUp.y   + this.inertiaStatus.sy,
        clientX: clientUp.x + this.inertiaStatus.sx,
        clientY: clientUp.y + this.inertiaStatus.sy,
      } ]);
    }
    else {
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

      // set pointer coordinate, time changes and speeds
      utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

      signals.fire('move', signalArg);

      // if interacting, fire a 'move-{action}' signal
      if (this.interacting()) {
        this.doMove(signalArg);
        this.checkAndPreventDefault(event);
      }

      if (this.pointerWasMoved) {
        utils.copyCoords(this.prevCoords, this.curCoords);
      }

      signals.fire('move-done', signalArg);
    }
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
    signalArg = utils.extend(signalArg || {}, {
      pointer: this.pointers[0],
      event: this.prevEvent,
      eventTarget: this._eventTarget,
      interaction: this,
    });

    signals.fire('before-action-move', signalArg);

    if (!this._dontFireMove) {
      signals.fire('move-' + this.prepared.name, signalArg);
    }

    this._dontFireMove = false;
  }

  // End interact move events and stop auto-scroll unless inertia is enabled
  pointerUp (pointer, event, eventTarget, curEventTarget) {
    const pointerIndex = this.mouse? 0 : utils.indexOf(this.pointerIds, utils.getPointerId(pointer));

    clearTimeout(this.holdTimers[pointerIndex]);

    signals.fire(/cancel$/i.test(event.type)? 'cancel' : 'up', {
      pointer,
      event,
      eventTarget,
      curEventTarget,
      interaction: this,
    });

    const target = this.target;
    const options = target && target.options;
    const inertiaOptions = options && this.prepared.name && options[this.prepared.name].inertia;
    const inertiaStatus = this.inertiaStatus;

    if (this.interacting()) {

      if (inertiaStatus.active && !inertiaStatus.ending) { return; }

      const now = new Date().getTime();
      const statuses = {};
      const page = utils.extend({}, this.curCoords.page);
      const pointerSpeed = this.pointerDelta.client.speed;
      let inertiaPossible = false;
      let inertia = false;
      let smoothEnd = false;
      let modifierResult;

      // check if inertia should be started
      inertiaPossible = (inertiaOptions && inertiaOptions.enabled
                         && this.prepared.name !== 'gesture'
                         && event !== inertiaStatus.startEvent);

      inertia = (inertiaPossible
                && (now - this.curCoords.timeStamp) < 50
                && pointerSpeed > inertiaOptions.minSpeed
                && pointerSpeed > inertiaOptions.endSpeed);

      const modifiers = (inertiaPossible? require('./modifiers') : null);

      // smoothEnd
      if (inertiaPossible && !inertia) {
        modifiers.resetStatuses(statuses);

        modifierResult = modifiers.setAll(this, page, statuses, true);

        if (modifierResult.shouldMove && modifierResult.locked) {
          smoothEnd = true;
        }
      }

      if (inertia || smoothEnd) {
        utils.copyCoords(inertiaStatus.upCoords, this.curCoords);

        this.pointers[0] = inertiaStatus.startEvent =
          new InteractEvent(this, event, this.prepared.name, 'inertiastart', this.element);

        inertiaStatus.t0 = now;

        target.fire(inertiaStatus.startEvent);

        if (inertia) {
          inertiaStatus.vx0 = this.pointerDelta.client.vx;
          inertiaStatus.vy0 = this.pointerDelta.client.vy;
          inertiaStatus.v0 = pointerSpeed;

          this.calcInertia(inertiaStatus);

          utils.extend(page, this.curCoords.page);

          page.x += inertiaStatus.xe;
          page.y += inertiaStatus.ye;

          modifiers.resetStatuses(statuses);

          modifierResult = modifiers.setAll(this, page, statuses, true, true);

          inertiaStatus.modifiedXe += modifierResult.dx;
          inertiaStatus.modifiedYe += modifierResult.dy;

          inertiaStatus.i = animationFrame.request(this.boundInertiaFrame);
        }
        else {
          inertiaStatus.smoothEnd = true;
          inertiaStatus.xe = modifierResult.dx;
          inertiaStatus.ye = modifierResult.dy;

          inertiaStatus.sx = inertiaStatus.sy = 0;

          inertiaStatus.i = animationFrame.request(this.boundSmoothEndFrame);
        }

        inertiaStatus.active = true;
        return;
      }
    }

    this.end(event);
    this.removePointer(pointer);
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

    this.stop(event);
  }

  currentAction () {
    return this._interacting? this.prepared.name: null;
  }

  interacting () {
    return this._interacting;
  }

  stop (event) {
    signals.fire('stop', { interaction: this });

    if (this._interacting) {
      signals.fire('stop-active', { interaction: this });

      // prevent Default only if were previously interacting
      if (event && utils.isFunction(event.preventDefault)) {
        this.checkAndPreventDefault(event);
      }

      signals.fire('stop-' + this.prepared.name, {
        event,
        interaction: this,
      });
    }

    this.target = this.element = null;

    this.pointerIsDown = this._interacting = false;
    this.prepared.name = this.prevEvent = null;
    this.inertiaStatus.resumeDx = this.inertiaStatus.resumeDy = 0;
  }

  inertiaFrame () {
    const inertiaStatus = this.inertiaStatus;
    const options = this.target.options[this.prepared.name].inertia;
    const lambda = options.resistance;
    const t = new Date().getTime() / 1000 - inertiaStatus.t0;

    if (t < inertiaStatus.te) {

      const progress =  1 - (Math.exp(-lambda * t) - inertiaStatus.lambda_v0) / inertiaStatus.one_ve_v0;

      if (inertiaStatus.modifiedXe === inertiaStatus.xe && inertiaStatus.modifiedYe === inertiaStatus.ye) {
        inertiaStatus.sx = inertiaStatus.xe * progress;
        inertiaStatus.sy = inertiaStatus.ye * progress;
      }
      else {
        const quadPoint = utils.getQuadraticCurvePoint(0, 0,
                                                       inertiaStatus.xe,
                                                       inertiaStatus.ye,
                                                       inertiaStatus.modifiedXe,
                                                       inertiaStatus.modifiedYe,
                                                       progress);

        inertiaStatus.sx = quadPoint.x;
        inertiaStatus.sy = quadPoint.y;
      }

      this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

      inertiaStatus.i = animationFrame.request(this.boundInertiaFrame);
    }
    else {
      inertiaStatus.ending = true;

      inertiaStatus.sx = inertiaStatus.modifiedXe;
      inertiaStatus.sy = inertiaStatus.modifiedYe;

      this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

      this.pointerUp(inertiaStatus.startEvent, inertiaStatus.startEvent);
      inertiaStatus.active = inertiaStatus.ending = false;
    }
  }

  smoothEndFrame () {
    const inertiaStatus = this.inertiaStatus;
    const t = new Date().getTime() - inertiaStatus.t0;
    const duration = this.target.options[this.prepared.name].inertia.smoothEndDuration;

    if (t < duration) {
      inertiaStatus.sx = utils.easeOutQuad(t, 0, inertiaStatus.xe, duration);
      inertiaStatus.sy = utils.easeOutQuad(t, 0, inertiaStatus.ye, duration);

      this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

      inertiaStatus.i = animationFrame.request(this.boundSmoothEndFrame);
    }
    else {
      inertiaStatus.ending = true;

      inertiaStatus.sx = inertiaStatus.xe;
      inertiaStatus.sy = inertiaStatus.ye;

      this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);
      this.pointerUp(inertiaStatus.startEvent, inertiaStatus.startEvent);

      inertiaStatus.smoothEnd =
        inertiaStatus.active = inertiaStatus.ending = false;
    }
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
    const setting = this.target && this.target.options.preventDefault;

    if (!this.target || setting === 'never') { return; }

    if (setting === 'always') {
      event.preventDefault();
      return;
    }

    // setting === 'auto'

    // don't preventDefault on input elements
    if (/^(input|select|textarea)$/i.test(event.target.nodeName)) {
      return;
    }

    const actionOptions = this.target.options[this.prepared.name];

    // Do not preventDefault on pointerdown if the prepared action is delayed
    // or it is a drag and dragging can only start from a certain direction.
    // This allows a touch to pan the viewport if the action doesn't actually
    // start>
    if (/down|start/i.test(event.type)
        && ((this.prepared.name === 'drag' && actionOptions.startAxis !== 'xy')
            || (actionOptions && actionOptions.delay > 0))) {

      return;
    }

    // with manualStart, only preventDefault while interacting
    if (actionOptions && actionOptions.manualStart
        && !this.interacting()) {
      return;
    }

    event.preventDefault();
  }

  calcInertia (status) {
    const inertiaOptions = this.target.options[this.prepared.name].inertia;
    const lambda = inertiaOptions.resistance;
    const inertiaDur = -Math.log(inertiaOptions.endSpeed / status.v0) / lambda;

    status.x0 = this.prevEvent.pageX;
    status.y0 = this.prevEvent.pageY;
    status.t0 = status.startEvent.timeStamp / 1000;
    status.sx = status.sy = 0;

    status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
    status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
    status.te = inertiaDur;

    status.lambda_v0 = lambda / status.v0;
    status.one_ve_v0 = 1 - inertiaOptions.endSpeed / status.v0;
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

scope.signals.on('listen-to-document', function ({ doc, win }) {
  const pEventTypes = browser.pEventTypes;

  // add delegate event listener
  for (const eventType in scope.delegatedEvents) {
    events.add(doc, eventType, events.delegateListener);
    events.add(doc, eventType, events.delegateUseCapture, true);
  }

  if (scope.PointerEvent) {
    events.add(doc, pEventTypes.down  , listeners.pointerDown  );
    events.add(doc, pEventTypes.move  , listeners.pointerMove  );
    events.add(doc, pEventTypes.move  , listeners.pointerHover );
    events.add(doc, pEventTypes.out   , listeners.pointerOut   );
    events.add(doc, pEventTypes.up    , listeners.pointerUp    );
    events.add(doc, pEventTypes.cancel, listeners.pointerUp    );
  }
  else {
    events.add(doc, 'mousedown', listeners.pointerDown );
    events.add(doc, 'mousemove', listeners.pointerMove );
    events.add(doc, 'mousemove', listeners.pointerHover);
    events.add(doc, 'mouseup'  , listeners.pointerUp   );
    events.add(doc, 'mouseout' , listeners.pointerOut  );

    events.add(doc, 'touchstart' , listeners.pointerDown  );
    events.add(doc, 'touchmove'  , listeners.pointerMove  );
    events.add(doc, 'touchend'   , listeners.pointerUp    );
    events.add(doc, 'touchcancel', listeners.pointerUp    );
  }

  events.add(win, 'blur', scope.endAllInteractions);

  try {
    if (win.frameElement) {
      const parentDoc = win.frameElement.ownerDocument;
      const parentWindow = parentDoc.defaultView;

      events.add(parentDoc   , 'mouseup'      , listeners.pointerUp);
      events.add(parentDoc   , 'touchend'     , listeners.pointerUp);
      events.add(parentDoc   , 'touchcancel'  , listeners.pointerUp);
      events.add(parentDoc   , 'pointerup'    , listeners.pointerUp);
      events.add(parentDoc   , 'MSPointerUp'  , listeners.pointerUp);
      events.add(parentWindow, 'blur'         , scope.endAllInteractions );
    }
  }
  catch (error) {
    scope.windowParentError = error;
  }

  // prevent native HTML5 drag on interact.js target elements
  events.add(doc, 'dragstart', function (event) {
    for (const interaction of scope.interactions) {

      if (interaction.element
          && (interaction.element === event.target
              || utils.nodeContains(interaction.element, event.target))) {

        interaction.checkAndPreventDefault(event);
        return;
      }
    }
  });

  scope.documents.push(doc);
  events.documents.push(doc);
});

scope.signals.fire('listen-to-document', {
  win: scope.window,
  doc: scope.document,
});

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
