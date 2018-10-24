import InteractEvent from './InteractEvent';
import * as utils    from '@interactjs/utils';

class Interaction {
  get pointerMoveTolerance () {
    return 1;
  }

  /** */
  constructor ({ pointerType, signals }) {
    this._signals = signals;

    this.target   = null; // current interactable being interacted with
    this.element  = null; // the target element of the interactable
    this.prepared = {     // action that's ready to be fired on next move event
      name : null,
      axis : null,
      edges: null,
    };

    // keep track of added pointers
    this.pointers = [/* { id, pointer, event, target, downTime }*/];

    this.coords = {
      // Starting InteractEvent pointer coordinates
      start: utils.pointer.newCoords(),
      // Previous native pointer move event coordinates
      prev: utils.pointer.newCoords(),
      // current native pointer move event coordinates
      cur: utils.pointer.newCoords(),
      // Change in coordinates and time of the pointer
      delta: utils.pointer.newCoords(),
      // pointer velocity
      velocity: utils.pointer.newCoords(),
    };

    this.downEvent   = null;    // pointerdown/mousedown/touchstart event
    this.downPointer = {};

    this._latestPointer = {
      pointer: null,
      event: null,
      eventTarget   : null,
    };

    this.prevEvent = null;      // previous action event

    this.pointerIsDown   = false;
    this.pointerWasMoved = false;
    this._interacting    = false;
    this._ending         = false;

    this.pointerType = pointerType;

    this._signals.fire('new', this);
  }

  pointerDown (pointer, event, eventTarget) {
    const pointerIndex = this.updatePointer(pointer, event, eventTarget, true);

    this._signals.fire('down', {
      pointer,
      event,
      eventTarget,
      pointerIndex,
      interaction: this,
    });
  }

  /**
   * ```js
   * interact(target)
   *   .draggable({
   *     // disable the default drag start by down->move
   *     manualStart: true
   *   })
   *   // start dragging after the user holds the pointer down
   *   .on('hold', function (event) {
   *     var interaction = event.interaction;
   *
   *     if (!interaction.interacting()) {
   *       interaction.start({ name: 'drag' },
   *                         event.interactable,
   *                         event.currentTarget);
   *     }
   * });
   * ```
   *
   * Start an action with the given Interactable and Element as tartgets. The
   * action must be enabled for the target Interactable and an appropriate
   * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
   *
   * Use it with `interactable.<action>able({ manualStart: false })` to always
   * [start actions manually](https://github.com/taye/interact.js/issues/114)
   *
   * @param {object} action   The action to be performed - drag, resize, etc.
   * @param {Interactable} target  The Interactable to target
   * @param {Element} element The DOM Element to target
   * @return {object} interact
   */
  start (action, target, element) {
    if (this.interacting()
        || !this.pointerIsDown
        || this.pointers.length < (action.name === 'gesture'? 2 : 1)) {
      return;
    }

    utils.copyAction(this.prepared, action);

    this.target       = target;
    this.element      = element;
    this._interacting = this._doPhase({
      interaction: this,
      event: this.downEvent,
      phase: 'start',
    });
  }

  pointerMove (pointer, event, eventTarget) {
    if (!this.simulation) {
      this.updatePointer(pointer, event, eventTarget, false);
      utils.pointer.setCoords(this.coords.cur, this.pointers.map(p => p.pointer));
    }

    const duplicateMove = (this.coords.cur.page.x === this.coords.prev.page.x
                           && this.coords.cur.page.y === this.coords.prev.page.y
                           && this.coords.cur.client.x === this.coords.prev.client.x
                           && this.coords.cur.client.y === this.coords.prev.client.y);

    let dx;
    let dy;

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.coords.cur.client.x - this.coords.start.client.x;
      dy = this.coords.cur.client.y - this.coords.start.client.y;

      this.pointerWasMoved = utils.hypot(dx, dy) > this.pointerMoveTolerance;
    }

    const signalArg = {
      pointer,
      pointerIndex: this.getPointerIndex(pointer),
      event,
      eventTarget,
      dx,
      dy,
      duplicate: duplicateMove,
      interaction: this,
    };

    if (!duplicateMove) {
      // set pointer coordinate, time changes and velocity
      utils.pointer.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
      utils.pointer.setCoordVelocity(this.coords.velocity, this.coords.delta);
    }

    this._signals.fire('move', signalArg);

    if (!duplicateMove) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        this.move(signalArg);
      }

      if (this.pointerWasMoved) {
        utils.pointer.copyCoords(this.coords.prev, this.coords.cur);
      }
    }
  }

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('dragmove', function (event) {
   *     if (someCondition) {
   *       // change the snap settings
   *       event.interactable.draggable({ snap: { targets: [] }});
   *       // fire another move event with re-calculated snap
   *       event.interaction.move();
   *     }
   *   });
   * ```
   *
   * Force a move of the current action at the same coordinates. Useful if
   * snap/restrict has been changed and you want a movement with the new
   * settings.
   */
  move (signalArg) {
    signalArg = utils.extend({
      pointer: this._latestPointer.pointer,
      event: this._latestPointer.event,
      eventTarget: this._latestPointer.eventTarget,
      interaction: this,
      noBefore: false,
    }, signalArg || {});

    signalArg.phase = 'move';

    this._doPhase(signalArg);
  }

  // End interact move events and stop auto-scroll unless simulation is running
  pointerUp (pointer, event, eventTarget, curEventTarget) {
    let pointerIndex = this.getPointerIndex(pointer);

    if (pointerIndex === -1) {
      pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
    }

    this._signals.fire(/cancel$/i.test(event.type)? 'cancel' : 'up', {
      pointer,
      pointerIndex,
      event,
      eventTarget,
      curEventTarget,
      interaction: this,
    });

    if (!this.simulation) {
      this.end(event);
    }

    this.pointerIsDown = false;
    this.removePointer(pointer, event);
  }

  documentBlur (event) {
    this.end(event);
    this._signals.fire('blur', { event, interaction: this });
  }

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('move', function (event) {
   *     if (event.pageX > 1000) {
   *       // end the current action
   *       event.interaction.end();
   *       // stop all further listeners from being called
   *       event.stopImmediatePropagation();
   *     }
   *   });
   * ```
   *
   * @param {PointerEvent} [event]
   */
  end (event) {
    this._ending = true;
    event = event || this._latestPointer.event;
    let endPhaseResult;

    if (this.interacting()) {
      endPhaseResult = this._doPhase({
        event,
        interaction: this,
        phase: 'end',
      });
    }

    this._ending = false;

    if (endPhaseResult === true) {
      this.stop();
    }
  }

  currentAction () {
    return this._interacting? this.prepared.name: null;
  }

  interacting () {
    return this._interacting;
  }

  /** */
  stop () {
    this._signals.fire('stop', { interaction: this });

    this.target = this.element = null;

    this._interacting = false;
    this.prepared.name = this.prevEvent = null;
  }

  getPointerIndex (pointer) {
    const pointerId = utils.pointer.getPointerId(pointer);

    // mouse and pen interactions may have only one pointer
    return (this.pointerType === 'mouse' || this.pointerType === 'pen')
      ? this.pointers.length - 1
      : utils.arr.findIndex(this.pointers, curPointer => curPointer.id === pointerId);
  }

  getPointerInfo (pointer) {
    return this.pointers[this.getPointerIndex(pointer)];
  }

  updatePointer (pointer, event, eventTarget, down) {
    const id = utils.pointer.getPointerId(pointer);
    let pointerIndex = this.getPointerIndex(pointer);
    let pointerInfo = this.pointers[pointerIndex];

    down = down === false
      ? false
      : down || /(down|start)$/i.test(event.type);

    if (!pointerInfo) {
      pointerInfo = {
        id,
        pointer,
        event,
        downTime: null,
        downTarget: null,
      };

      pointerIndex = this.pointers.length;
      this.pointers.push(pointerInfo);
    }
    else {
      pointerInfo.pointer = pointer;
    }

    if (down) {
      this.pointerIsDown = true;

      if (!this.interacting()) {
        utils.pointer.setCoords(this.coords.start, this.pointers.map(p => p.pointer));

        utils.pointer.copyCoords(this.coords.cur , this.coords.start);
        utils.pointer.copyCoords(this.coords.prev, this.coords.start);
        utils.pointer.pointerExtend(this.downPointer, pointer);

        this.downEvent = event;
        pointerInfo.downTime = this.coords.cur.timeStamp;
        pointerInfo.downTarget = eventTarget;

        this.pointerWasMoved = false;
      }
    }

    this._updateLatestPointer(pointer, event, eventTarget);

    this._signals.fire('update-pointer', {
      pointer,
      event,
      eventTarget,
      down,
      pointerInfo,
      pointerIndex,
      interaction: this,
    });

    return pointerIndex;
  }

  removePointer (pointer, event) {
    const pointerIndex = this.getPointerIndex(pointer);

    if (pointerIndex === -1) { return; }

    const pointerInfo = this.pointers[pointerIndex];

    this._signals.fire('remove-pointer', {
      pointer,
      event,
      pointerIndex,
      pointerInfo,
      interaction: this,
    });

    this.pointers.splice(pointerIndex, 1);
  }

  _updateLatestPointer (pointer, event, eventTarget) {
    this._latestPointer.pointer = pointer;
    this._latestPointer.event = event;
    this._latestPointer.eventTarget = eventTarget;
  }

  _createPreparedEvent (event, phase, preEnd, type) {
    const actionName = this.prepared.name;

    return new InteractEvent(this, event, actionName, phase, this.element, null, preEnd, type);
  }

  _fireEvent (iEvent) {
    this.target.fire(iEvent);

    if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
      this.prevEvent = iEvent;
    }
  }

  _doPhase (signalArg) {
    const { event, phase, preEnd, type } = signalArg;

    if (!signalArg.noBefore) {
      const beforeResult = this._signals.fire(`before-action-${phase}`, signalArg);

      if (beforeResult === false) {
        return false;
      }
    }

    const iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);

    this._signals.fire(`action-${phase}`, signalArg);

    this._fireEvent(iEvent);

    this._signals.fire(`after-action-${phase}`, signalArg);

    return true;
  }
}

/**
 * @alias Interaction.prototype.move
 */
Interaction.prototype.doMove = utils.warnOnce(
  function (signalArg) {
    this.move(signalArg);
  },
  'The interaction.doMove() method has been renamed to interaction.move()');

export default Interaction;
