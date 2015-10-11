const scope          = require('./scope');
const utils          = require('./utils');
const InteractEvent  = require('./InteractEvent');
const Interactable   = require('./Interactable');
const events         = require('./utils/events');
const browser        = require('./utils/browser');
const finder         = require('./utils/interactionFinder');
const actions        = require('./actions/base');
const modifiers      = require('./modifiers/base');
const animationFrame = utils.raf;

const signals = new (require('./utils/Signals'));

const listeners   = {};
const methodNames = [
  'pointerOver', 'pointerOut', 'pointerHover', 'selectorDown',
  'pointerDown', 'pointerMove', 'pointerUp', 'pointerCancel', 'pointerEnd',
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

    this.matches       = [];   // all selectors that are matched by target element
    this.matchElements = [];   // corresponding elements

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

    this.startOffset      = { left: 0, right: 0, top: 0, bottom: 0 };
    this.modifierOffsets  = {};
    this.modifierStatuses = modifiers.resetStatuses({});

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

  pointerOver (pointer, event, eventTarget) {
    if (this.prepared.name || !this.mouse) { return; }

    const curMatches = [];
    const curMatchElements = [];
    const prevTargetElement = this.element;

    this.addPointer(pointer);

    if (this.target
        && (scope.testIgnore(this.target, this.element, eventTarget)
        || !scope.testAllow(this.target, this.element, eventTarget))) {
      // if the eventTarget should be ignored or shouldn't be allowed
      // clear the previous target
      this.target = null;
      this.element = null;
      this.matches = [];
      this.matchElements = [];
    }

    const elementInteractable = scope.interactables.get(eventTarget);
    let elementAction = (elementInteractable
                         && !scope.testIgnore(elementInteractable, eventTarget, eventTarget)
                         && scope.testAllow(elementInteractable, eventTarget, eventTarget)
                         && validateAction(
                           elementInteractable.getAction(pointer, event, this, eventTarget),
                           elementInteractable));

    if (elementAction && !scope.withinInteractionLimit(elementInteractable, eventTarget, elementAction)) {
      elementAction = null;
    }

    function pushCurMatches (interactable, selector) {
      if (interactable
          && scope.inContext(interactable, eventTarget)
          && !scope.testIgnore(interactable, eventTarget, eventTarget)
          && scope.testAllow(interactable, eventTarget, eventTarget)
          && utils.matchesSelector(eventTarget, selector)) {

        curMatches.push(interactable);
        curMatchElements.push(eventTarget);
      }
    }

    if (elementAction) {
      this.target = elementInteractable;
      this.element = eventTarget;
      this.matches = [];
      this.matchElements = [];
    }
    else {
      scope.interactables.forEachSelector(pushCurMatches);

      if (this.validateSelector(pointer, event, curMatches, curMatchElements)) {
        this.matches = curMatches;
        this.matchElements = curMatchElements;

        this.pointerHover(pointer, event, this.matches, this.matchElements);
        events.add(eventTarget,
                   scope.PointerEvent? browser.pEventTypes.move : 'mousemove',
                   listeners.pointerHover);
      }
      else if (this.target) {
        if (utils.nodeContains(prevTargetElement, eventTarget)) {
          this.pointerHover(pointer, event, this.matches, this.matchElements);
          events.add(this.element,
                     scope.PointerEvent? browser.pEventTypes.move : 'mousemove',
                     listeners.pointerHover);
        }
        else {
          this.target = null;
          this.element = null;
          this.matches = [];
          this.matchElements = [];
        }
      }
    }
  }

  // Check what action would be performed on pointerMove target if a mouse
  // button were pressed and change the cursor accordingly
  pointerHover (pointer, event, eventTarget, curEventTarget, matches, matchElements) {
    const target = this.target;

    if (!this.prepared.name && this.mouse) {

      let action;

      // update pointer coords for defaultActionChecker to use
      this.setEventXY(this.curCoords, [pointer]);

      if (matches) {
        action = this.validateSelector(pointer, event, matches, matchElements);
      }
      else if (target) {
        action = validateAction(target.getAction(this.pointers[0], event, this, this.element), this.target);
      }

      if (target && target.options.styleCursor) {
        if (action) {
          target._doc.documentElement.style.cursor = actions[action.name].getCursor(action);
        }
        else {
          target._doc.documentElement.style.cursor = '';
        }
      }
    }
    else if (this.prepared.name) {
      this.checkAndPreventDefault(event, target, this.element);
    }
  }

  pointerOut (pointer, event, eventTarget) {
    if (this.prepared.name) { return; }

    // Remove temporary event listeners for selector Interactables
    if (!scope.interactables.get(eventTarget)) {
      events.remove(eventTarget,
                    scope.PointerEvent? browser.pEventTypes.move : 'mousemove',
                    listeners.pointerHover);
    }

    if (this.target && this.target.options.styleCursor && !this.interacting()) {
      this.target._doc.documentElement.style.cursor = '';
    }
  }

  selectorDown (pointer, event, eventTarget, curEventTarget) {
    const pointerIndex = this.addPointer(pointer);
    let element = eventTarget;
    let action;

    this.pointerIsDown = true;

    signals.fire('down', {
      pointer,
      event,
      eventTarget,
      pointerIndex,
      interaction: this,
    });

    // Check if the down event hits the current inertia target
    if (this.inertiaStatus.active && this.target.selector) {
      // climb up the DOM tree from the event target
      while (utils.isElement(element)) {

        // if this element is the current inertia target element
        if (element === this.element
            // and the prospective action is the same as the ongoing one
            && validateAction(this.target.getAction(pointer, event, this, this.element), this.target).name === this.prepared.name) {

          // stop inertia so that the next move will be a normal one
          animationFrame.cancel(this.inertiaStatus.i);
          this.inertiaStatus.active = false;

          return;
        }
        element = utils.parentElement(element);
      }
    }

    // do nothing if interacting
    if (this.interacting()) {
      return;
    }

    const pushMatches = (interactable, selector, context) => {
      const elements = (browser.useMatchesSelectorPolyfill
        ? context.querySelectorAll(selector)
        : undefined);

      if (scope.inContext(interactable, element)
          && !scope.testIgnore(interactable, element, eventTarget)
        && scope.testAllow(interactable, element, eventTarget)
        && utils.matchesSelector(element, selector, elements)) {

        this.matches.push(interactable);
        this.matchElements.push(element);
      }
    };

    // update pointer coords for defaultActionChecker to use
    this.setEventXY(this.curCoords, [pointer]);
    this.downEvent = event;

    while (utils.isElement(element) && !action) {
      this.matches = [];
      this.matchElements = [];

      scope.interactables.forEachSelector(pushMatches);

      action = this.validateSelector(pointer, event, this.matches, this.matchElements);
      element = utils.parentElement(element);
    }

    if (action) {
      utils.copyAction(this.prepared, action);

      return this.pointerDown(pointer, event, eventTarget, curEventTarget, action);
    }
    else {
      // do these now since pointerDown isn't being called from here
      this.downTimes[pointerIndex] = new Date().getTime();
      this.downTargets[pointerIndex] = eventTarget;
      utils.pointerExtend(this.downPointer, pointer);

      utils.copyCoords(this.prevCoords, this.curCoords);
      this.pointerWasMoved = false;
    }
  }

  // Determine action to be performed on next pointerMove and add appropriate
  // style and event Listeners
  pointerDown (pointer, event, eventTarget, curEventTarget, forceAction) {
    if (!forceAction && !this.inertiaStatus.active && this.pointerWasMoved && this.prepared.name) {
      this.checkAndPreventDefault(event, this.target, this.element);

      return;
    }

    this.pointerIsDown = true;
    this.downEvent = event;

    const pointerIndex = this.addPointer(pointer);
    let action;

    // If it is the second touch of a multi-touch gesture, keep the
    // target the same and get a new action if a target was set by the
    // first touch
    if (this.pointerIds.length > 1 && this.target._element === this.element) {
      const newAction = validateAction(forceAction || this.target.getAction(pointer, event, this, this.element), this.target);

      if (scope.withinInteractionLimit(this.target, this.element, newAction)) {
        action = newAction;
      }

      this.prepared.name = null;
    }
    // Otherwise, set the target if there is no action prepared
    else if (!this.prepared.name) {
      const interactable = scope.interactables.get(curEventTarget);

      if (interactable
          && !scope.testIgnore(interactable, curEventTarget, eventTarget)
          && scope.testAllow(interactable, curEventTarget, eventTarget)
          && (action = validateAction(forceAction || interactable.getAction(pointer, event, this, curEventTarget), interactable, eventTarget))
          && scope.withinInteractionLimit(interactable, curEventTarget, action)) {
        this.target = interactable;
        this.element = curEventTarget;
      }
    }

    const target = this.target;
    const options = target && target.options;

    if (target && (forceAction || !this.prepared.name)) {
      action = action || validateAction(forceAction || target.getAction(pointer, event, this, curEventTarget), target, this.element);

      this.setEventXY(this.startCoords, this.pointers);

      if (!action) { return; }

      if (options.styleCursor) {
        target._doc.documentElement.style.cursor = actions[action.name].getCursor(action);
      }

      this.resizeAxes = action.name === 'resize'? action.axis : null;

      if (action === 'gesture' && this.pointerIds.length < 2) {
        action = null;
      }

      utils.copyAction(this.prepared, action);

      modifiers.resetStatuses(this.modifierStatuses);

      this.downTimes[pointerIndex] = new Date().getTime();
      this.downTargets[pointerIndex] = eventTarget;
      utils.pointerExtend(this.downPointer, pointer);

      utils.copyCoords(this.prevCoords, this.startCoords);
      this.pointerWasMoved = false;

      signals.fire('prepared', {
        interaction: this,
      });

      this.checkAndPreventDefault(event, target, this.element);
    }
    // if inertia is active try to resume action
    else if (this.inertiaStatus.active
             && curEventTarget === this.element
             && validateAction(target.getAction(pointer, event, this, this.element), target).name === this.prepared.name) {

      animationFrame.cancel(this.inertiaStatus.i);
      this.inertiaStatus.active = false;

      this.checkAndPreventDefault(event, target, this.element);
    }
  }

  setStartOffsets (action, interactable, element) {
    const rect = interactable.getRect(element);

    if (rect) {
      this.startOffset.left = this.startCoords.page.x - rect.left;
      this.startOffset.top  = this.startCoords.page.y - rect.top;

      this.startOffset.right  = rect.right  - this.startCoords.page.x;
      this.startOffset.bottom = rect.bottom - this.startCoords.page.y;

      if (!('width'  in rect)) { rect.width  = rect.right  - rect.left; }
      if (!('height' in rect)) { rect.height = rect.bottom - rect.top ; }
    }
    else {
      this.startOffset.left = this.startOffset.top = this.startOffset.right = this.startOffset.bottom = 0;
    }

    modifiers.setOffsets(this, interactable, element, rect, this.modifierOffsets);
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

    this.setStartOffsets(action.name, interactable, element, this.modifierOffsets);

    modifiers.setAll(this, this.startCoords.page, this.modifierStatuses);

    signals.fire('start-' + this.prepared.name, {
      interaction: this,
      event: this.downEvent,
    });
  }

  pointerMove (pointer, event, eventTarget, curEventTarget, preEnd) {
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

    const signalArg = {
      pointer,
      event,
      eventTarget,
      dx,
      dy,
      interaction: this,
      duplicate: duplicateMove,
    };

    signals.fire('move', signalArg);

    if (!this.pointerIsDown) { return; }

    if (duplicateMove && this.pointerWasMoved && !preEnd) {
      this.checkAndPreventDefault(event, this.target, this.element);
      return;
    }

    // set pointer coordinate, time changes and speeds
    utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

    if (!this.prepared.name) { return; }

    if (this.pointerWasMoved
        // ignore movement while inertia is active
        && (!this.inertiaStatus.active || (pointer instanceof InteractEvent && /inertiastart/.test(pointer.type)))) {

      // if just starting an action, calculate the pointer speed now
      if (!this.interacting()) {
        utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

        signals.fire('before-start-' + this.prepared.name, signalArg);
      }

      const starting = !!this.prepared.name && !this.interacting();

      if (starting
          && (this.target.options[this.prepared.name].manualStart
          || !scope.withinInteractionLimit(this.target, this.element, this.prepared))) {
        this.stop(event);
        return;
      }

      if (this.prepared.name && this.target) {
        if (starting) {
          this.start(this.prepared, this.target, this.element);
        }

        const modifierResult = modifiers.setAll(this, this.curCoords.page, this.modifierStatuses, preEnd);

        // move if snapping or restriction doesn't prevent it
        if (modifierResult.shouldMove || starting) {
          signals.fire('move-' + this.prepared.name, signalArg);
        }

        this.checkAndPreventDefault(event, this.target, this.element);
      }
    }

    utils.copyCoords(this.prevCoords, this.curCoords);

    signals.fire('move-done', signalArg);
  }

  pointerUp (pointer, event, eventTarget, curEventTarget) {
    const pointerIndex = this.mouse? 0 : utils.indexOf(this.pointerIds, utils.getPointerId(pointer));

    clearTimeout(this.holdTimers[pointerIndex]);

    signals.fire('up', {
      pointer,
      event,
      eventTarget,
      curEventTarget,
      interaction: this,
    });


    this.pointerEnd(pointer, event, eventTarget, curEventTarget);

    this.removePointer(pointer);
  }

  pointerCancel (pointer, event, eventTarget, curEventTarget) {
    const pointerIndex = this.mouse? 0 : utils.indexOf(this.pointerIds, utils.getPointerId(pointer));

    clearTimeout(this.holdTimers[pointerIndex]);

    signals.fire('cancel', {
      pointer,
      event,
      eventTarget,
      interaction: this,
    });

    this.pointerEnd(pointer, event, eventTarget, curEventTarget);

    this.removePointer(pointer);
  }

  // End interact move events and stop auto-scroll unless inertia is enabled
  pointerEnd (pointer, event, eventTarget, curEventTarget) {
    const target = this.target;
    const options = target && target.options;
    const inertiaOptions = options && this.prepared.name && options[this.prepared.name].inertia;
    const inertiaStatus = this.inertiaStatus;

    if (this.interacting()) {

      if (inertiaStatus.active && !inertiaStatus.ending) { return; }

      const now = new Date().getTime();
      const statuses = {};
      const page = utils.extend({}, this.curCoords.page);
      let pointerSpeed;
      let inertiaPossible = false;
      let inertia = false;
      let smoothEnd = false;
      let modifierResult;

      if (this.dragging) {
        if      (options.drag.axis === 'x' ) { pointerSpeed = Math.abs(this.pointerDelta.client.vx); }
        else if (options.drag.axis === 'y' ) { pointerSpeed = Math.abs(this.pointerDelta.client.vy); }
        else   /*options.drag.axis === 'xy'*/{ pointerSpeed = this.pointerDelta.client.speed; }
      }
      else {
        pointerSpeed = this.pointerDelta.client.speed;
      }

      // check if inertia should be started
      inertiaPossible = (inertiaOptions && inertiaOptions.enabled
                         && this.prepared.name !== 'gesture'
                         && event !== inertiaStatus.startEvent);

      inertia = (inertiaPossible
                && (now - this.curCoords.timeStamp) < 50
                && pointerSpeed > inertiaOptions.minSpeed
                && pointerSpeed > inertiaOptions.endSpeed);

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

      for (let i = 0; i < modifiers.names.length; i++) {
        // if the endOnly option is true for any modifier
        if (modifiers[modifiers.names[i]].shouldDo(target, this.prepared.name, true, true)) {
          // fire a move event at the snapped coordinates
          this.pointerMove(pointer, event, eventTarget, curEventTarget, true);
          break;
        }
      }
    }

    if (this.interacting()) {
      signals.fire('end-' + this.prepared.name, {
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

      this.matches = [];
      this.matchElements = [];

      const target = this.target;

      if (target.options.styleCursor) {
        target._doc.documentElement.style.cursor = '';
      }

      // prevent Default only if were previously interacting
      if (event && utils.isFunction(event.preventDefault)) {
        this.checkAndPreventDefault(event, target, this.element);
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

    modifiers.resetStatuses(this.modifierStatuses);

    // remove pointers if their ID isn't in this.pointerIds
    for (let i = 0; i < this.pointers.length; i++) {
      if (utils.indexOf(this.pointerIds, utils.getPointerId(this.pointers[i])) === -1) {
        this.pointers.splice(i, 1);
      }
    }
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

      this.pointerEnd(inertiaStatus.startEvent, inertiaStatus.startEvent);
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
      this.pointerEnd(inertiaStatus.startEvent, inertiaStatus.startEvent);

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

  validateSelector (pointer, event, matches, matchElements) {
    for (let i = 0, len = matches.length; i < len; i++) {
      const match = matches[i];
      const matchElement = matchElements[i];
      const action = validateAction(match.getAction(pointer, event, this, matchElement), match);

      if (action && scope.withinInteractionLimit(match, matchElement, action)) {
        this.target = match;
        this.element = matchElement;

        return action;
      }
    }
  }

  checkAndPreventDefault (event, interactable, element) {
    if (!(interactable = interactable || this.target)) { return; }

    const options = interactable.options;
    const prevent = options.preventDefault;

    if (prevent === 'auto' && element && !/^(input|select|textarea)$/i.test(event.target.nodeName)) {
      const actionOptions = options[this.prepared.name];

      // do not preventDefault on pointerdown if the prepared action is delayed
      // or it is a drag and dragging can only start from a certain direction -
      // this allows a touch to pan the viewport if a drag isn't in the right
      // direction
      if (/down|start/i.test(event.type)
          && ((this.prepared.name === 'drag' && options.drag.axis !== 'xy')
              || actionOptions.delay > 0)) {

        return;
      }

      // with manualStart, only preventDefault while interacting
      if (actionOptions && actionOptions.manualStart
          && !this.interacting()) {
        return;
      }

      event.preventDefault();
      return;
    }

    if (prevent === 'always') {
      event.preventDefault();
      return;
    }
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

      for (const pointer of event.changedTouches) {
        const interaction = finder.search(pointer, event.type, eventTarget);

        matches.push([pointer, interaction || new Interaction]);
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

Interactable.signals.on('new', function ({ interactable, win }) {
  const element = interactable._element;

  if (utils.isElement(element, win)) {
    if (scope.PointerEvent) {
      events.add(element, browser.pEventTypes.down, listeners.pointerDown );
      events.add(element, browser.pEventTypes.move, listeners.pointerHover);
    }
    else {
      events.add(element, 'mousedown' , listeners.pointerDown );
      events.add(element, 'mousemove' , listeners.pointerHover);
      events.add(element, 'touchstart', listeners.pointerDown );
      events.add(element, 'touchmove' , listeners.pointerHover);
    }
  }
});

Interactable.signals.on('unset', function ({ interactable, win }) {
  const element = interactable._element;

  if (!interactable.selector && utils.isElement(element, win)) {
    if (scope.PointerEvent) {
      events.remove(element, browser.pEventTypes.down, listeners.pointerDown );
      events.remove(element, browser.pEventTypes.move, listeners.pointerHover);
    }
    else {
      events.remove(element, 'mousedown' , listeners.pointerDown );
      events.remove(element, 'mousemove' , listeners.pointerHover);
      events.remove(element, 'touchstart', listeners.pointerDown );
      events.remove(element, 'touchmove' , listeners.pointerHover);
    }
  }
});

scope.signals.on('listen-to-document', function ({ doc, win }) {
  const pEventTypes = browser.pEventTypes;

  // add delegate event listener
  for (const eventType in scope.delegatedEvents) {
    events.add(doc, eventType, events.delegateListener);
    events.add(doc, eventType, events.delegateUseCapture, true);
  }

  if (scope.PointerEvent) {
    events.add(doc, pEventTypes.down  , listeners.selectorDown );
    events.add(doc, pEventTypes.move  , listeners.pointerMove  );
    events.add(doc, pEventTypes.over  , listeners.pointerOver  );
    events.add(doc, pEventTypes.out   , listeners.pointerOut   );
    events.add(doc, pEventTypes.up    , listeners.pointerUp    );
    events.add(doc, pEventTypes.cancel, listeners.pointerCancel);
  }
  else {
    events.add(doc, 'mousedown', listeners.selectorDown);
    events.add(doc, 'mousemove', listeners.pointerMove );
    events.add(doc, 'mouseup'  , listeners.pointerUp   );
    events.add(doc, 'mouseover', listeners.pointerOver );
    events.add(doc, 'mouseout' , listeners.pointerOut  );

    events.add(doc, 'touchstart' , listeners.selectorDown );
    events.add(doc, 'touchmove'  , listeners.pointerMove  );
    events.add(doc, 'touchend'   , listeners.pointerUp    );
    events.add(doc, 'touchcancel', listeners.pointerCancel);
  }

  events.add(win, 'blur', scope.endAllInteractions);

  try {
    if (win.frameElement) {
      const parentDoc = win.frameElement.ownerDocument;
      const parentWindow = parentDoc.defaultView;

      events.add(parentDoc   , 'mouseup'      , listeners.pointerEnd);
      events.add(parentDoc   , 'touchend'     , listeners.pointerEnd);
      events.add(parentDoc   , 'touchcancel'  , listeners.pointerEnd);
      events.add(parentDoc   , 'pointerup'    , listeners.pointerEnd);
      events.add(parentDoc   , 'MSPointerUp'  , listeners.pointerEnd);
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

        interaction.checkAndPreventDefault(event, interaction.target, interaction.element);
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

Interaction.doOnInteractions = doOnInteractions;
Interaction.withinLimit = scope.withinInteractionLimit;
Interaction.signals = signals;

module.exports = Interaction;
