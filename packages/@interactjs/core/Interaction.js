"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Interaction = void 0;
Object.defineProperty(exports, "PointerInfo", {
  enumerable: true,
  get: function () {
    return _PointerInfo.PointerInfo;
  }
});
exports.default = exports._ProxyValues = exports._ProxyMethods = void 0;
var arr = _interopRequireWildcard(require("../utils/arr.js"));
var _extend = _interopRequireDefault(require("../utils/extend.js"));
var _hypot = _interopRequireDefault(require("../utils/hypot.js"));
var _misc = require("../utils/misc.js");
var pointerUtils = _interopRequireWildcard(require("../utils/pointerUtils.js"));
var rectUtils = _interopRequireWildcard(require("../utils/rect.js"));
var _InteractEvent = require("./InteractEvent");
var _PointerInfo = require("./PointerInfo");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let _ProxyValues = exports._ProxyValues = /*#__PURE__*/function (_ProxyValues) {
  _ProxyValues["interactable"] = "";
  _ProxyValues["element"] = "";
  _ProxyValues["prepared"] = "";
  _ProxyValues["pointerIsDown"] = "";
  _ProxyValues["pointerWasMoved"] = "";
  _ProxyValues["_proxy"] = "";
  return _ProxyValues;
}({});
let _ProxyMethods = exports._ProxyMethods = /*#__PURE__*/function (_ProxyMethods) {
  _ProxyMethods["start"] = "";
  _ProxyMethods["move"] = "";
  _ProxyMethods["end"] = "";
  _ProxyMethods["stop"] = "";
  _ProxyMethods["interacting"] = "";
  return _ProxyMethods;
}({});
let idCounter = 0;
class Interaction {
  /** current interactable being interacted with */
  interactable = null;

  /** the target element of the interactable */
  element = null;
  rect = null;
  /** @internal */
  _rects;
  /** @internal */
  edges = null;

  /** @internal */
  _scopeFire;

  // action that's ready to be fired on next move event
  prepared = {
    name: null,
    axis: null,
    edges: null
  };
  pointerType;

  /** @internal keep track of added pointers */
  pointers = [];

  /** @internal pointerdown/mousedown/touchstart event */
  downEvent = null;

  /** @internal */
  downPointer = {};

  /** @internal */
  _latestPointer = {
    pointer: null,
    event: null,
    eventTarget: null
  };

  /** @internal */
  prevEvent = null;
  pointerIsDown = false;
  pointerWasMoved = false;
  /** @internal */
  _interacting = false;
  /** @internal */
  _ending = false;
  /** @internal */
  _stopped = true;
  /** @internal */
  _proxy;

  /** @internal */
  simulation = null;

  /** @internal */
  get pointerMoveTolerance() {
    return 1;
  }
  doMove = (0, _misc.warnOnce)(function (signalArg) {
    this.move(signalArg);
  }, 'The interaction.doMove() method has been renamed to interaction.move()');
  coords = {
    // Starting InteractEvent pointer coordinates
    start: pointerUtils.newCoords(),
    // Previous native pointer move event coordinates
    prev: pointerUtils.newCoords(),
    // current native pointer move event coordinates
    cur: pointerUtils.newCoords(),
    // Change in coordinates and time of the pointer
    delta: pointerUtils.newCoords(),
    // pointer velocity
    velocity: pointerUtils.newCoords()
  };

  /** @internal */
  _id = idCounter++;
  constructor({
    pointerType,
    scopeFire
  }) {
    this._scopeFire = scopeFire;
    this.pointerType = pointerType;
    const that = this;
    this._proxy = {};
    for (const key in _ProxyValues) {
      Object.defineProperty(this._proxy, key, {
        get() {
          return that[key];
        }
      });
    }
    for (const key in _ProxyMethods) {
      Object.defineProperty(this._proxy, key, {
        value: (...args) => that[key](...args)
      });
    }
    this._scopeFire('interactions:new', {
      interaction: this
    });
  }
  pointerDown(pointer, event, eventTarget) {
    const pointerIndex = this.updatePointer(pointer, event, eventTarget, true);
    const pointerInfo = this.pointers[pointerIndex];
    this._scopeFire('interactions:down', {
      pointer,
      event,
      eventTarget,
      pointerIndex,
      pointerInfo,
      type: 'down',
      interaction: this
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
   *     var interaction = event.interaction
   *
   *     if (!interaction.interacting()) {
   *       interaction.start({ name: 'drag' },
   *                         event.interactable,
   *                         event.currentTarget)
   *     }
   * })
   * ```
   *
   * Start an action with the given Interactable and Element as tartgets. The
   * action must be enabled for the target Interactable and an appropriate
   * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
   *
   * Use it with `interactable.<action>able({ manualStart: false })` to always
   * [start actions manually](https://github.com/taye/interact.js/issues/114)
   *
   * @param action - The action to be performed - drag, resize, etc.
   * @param target - The Interactable to target
   * @param element - The DOM Element to target
   * @returns Whether the interaction was successfully started
   */
  start(action, interactable, element) {
    if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1) || !interactable.options[action.name].enabled) {
      return false;
    }
    (0, _misc.copyAction)(this.prepared, action);
    this.interactable = interactable;
    this.element = element;
    this.rect = interactable.getRect(element);
    this.edges = this.prepared.edges ? (0, _extend.default)({}, this.prepared.edges) : {
      left: true,
      right: true,
      top: true,
      bottom: true
    };
    this._stopped = false;
    this._interacting = this._doPhase({
      interaction: this,
      event: this.downEvent,
      phase: 'start'
    }) && !this._stopped;
    return this._interacting;
  }
  pointerMove(pointer, event, eventTarget) {
    if (!this.simulation && !(this.modification && this.modification.endResult)) {
      this.updatePointer(pointer, event, eventTarget, false);
    }
    const duplicateMove = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
    let dx;
    let dy;

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.coords.cur.client.x - this.coords.start.client.x;
      dy = this.coords.cur.client.y - this.coords.start.client.y;
      this.pointerWasMoved = (0, _hypot.default)(dx, dy) > this.pointerMoveTolerance;
    }
    const pointerIndex = this.getPointerIndex(pointer);
    const signalArg = {
      pointer,
      pointerIndex,
      pointerInfo: this.pointers[pointerIndex],
      event,
      type: 'move',
      eventTarget,
      dx,
      dy,
      duplicate: duplicateMove,
      interaction: this
    };
    if (!duplicateMove) {
      // set pointer coordinate, time changes and velocity
      pointerUtils.setCoordVelocity(this.coords.velocity, this.coords.delta);
    }
    this._scopeFire('interactions:move', signalArg);
    if (!duplicateMove && !this.simulation) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        signalArg.type = null;
        this.move(signalArg);
      }
      if (this.pointerWasMoved) {
        pointerUtils.copyCoords(this.coords.prev, this.coords.cur);
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
   *       event.interactable.draggable({ snap: { targets: [] }})
   *       // fire another move event with re-calculated snap
   *       event.interaction.move()
   *     }
   *   })
   * ```
   *
   * Force a move of the current action at the same coordinates. Useful if
   * snap/restrict has been changed and you want a movement with the new
   * settings.
   */
  move(signalArg) {
    if (!signalArg || !signalArg.event) {
      pointerUtils.setZeroCoords(this.coords.delta);
    }
    signalArg = (0, _extend.default)({
      pointer: this._latestPointer.pointer,
      event: this._latestPointer.event,
      eventTarget: this._latestPointer.eventTarget,
      interaction: this
    }, signalArg || {});
    signalArg.phase = 'move';
    this._doPhase(signalArg);
  }

  /**
   * @internal
   * End interact move events and stop auto-scroll unless simulation is running
   */
  pointerUp(pointer, event, eventTarget, curEventTarget) {
    let pointerIndex = this.getPointerIndex(pointer);
    if (pointerIndex === -1) {
      pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
    }
    const type = /cancel$/i.test(event.type) ? 'cancel' : 'up';
    this._scopeFire(`interactions:${type}`, {
      pointer,
      pointerIndex,
      pointerInfo: this.pointers[pointerIndex],
      event,
      eventTarget,
      type: type,
      curEventTarget,
      interaction: this
    });
    if (!this.simulation) {
      this.end(event);
    }
    this.removePointer(pointer, event);
  }

  /** @internal */
  documentBlur(event) {
    this.end(event);
    this._scopeFire('interactions:blur', {
      event,
      type: 'blur',
      interaction: this
    });
  }

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('move', function (event) {
   *     if (event.pageX > 1000) {
   *       // end the current action
   *       event.interaction.end()
   *       // stop all further listeners from being called
   *       event.stopImmediatePropagation()
   *     }
   *   })
   * ```
   */
  end(event) {
    this._ending = true;
    event = event || this._latestPointer.event;
    let endPhaseResult;
    if (this.interacting()) {
      endPhaseResult = this._doPhase({
        event,
        interaction: this,
        phase: 'end'
      });
    }
    this._ending = false;
    if (endPhaseResult === true) {
      this.stop();
    }
  }
  currentAction() {
    return this._interacting ? this.prepared.name : null;
  }
  interacting() {
    return this._interacting;
  }
  stop() {
    this._scopeFire('interactions:stop', {
      interaction: this
    });
    this.interactable = this.element = null;
    this._interacting = false;
    this._stopped = true;
    this.prepared.name = this.prevEvent = null;
  }

  /** @internal */
  getPointerIndex(pointer) {
    const pointerId = pointerUtils.getPointerId(pointer);

    // mouse and pen interactions may have only one pointer
    return this.pointerType === 'mouse' || this.pointerType === 'pen' ? this.pointers.length - 1 : arr.findIndex(this.pointers, curPointer => curPointer.id === pointerId);
  }

  /** @internal */
  getPointerInfo(pointer) {
    return this.pointers[this.getPointerIndex(pointer)];
  }

  /** @internal */
  updatePointer(pointer, event, eventTarget, down) {
    const id = pointerUtils.getPointerId(pointer);
    let pointerIndex = this.getPointerIndex(pointer);
    let pointerInfo = this.pointers[pointerIndex];
    down = down === false ? false : down || /(down|start)$/i.test(event.type);
    if (!pointerInfo) {
      pointerInfo = new _PointerInfo.PointerInfo(id, pointer, event, null, null);
      pointerIndex = this.pointers.length;
      this.pointers.push(pointerInfo);
    } else {
      pointerInfo.pointer = pointer;
    }
    pointerUtils.setCoords(this.coords.cur, this.pointers.map(p => p.pointer), this._now());
    pointerUtils.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
    if (down) {
      this.pointerIsDown = true;
      pointerInfo.downTime = this.coords.cur.timeStamp;
      pointerInfo.downTarget = eventTarget;
      pointerUtils.pointerExtend(this.downPointer, pointer);
      if (!this.interacting()) {
        pointerUtils.copyCoords(this.coords.start, this.coords.cur);
        pointerUtils.copyCoords(this.coords.prev, this.coords.cur);
        this.downEvent = event;
        this.pointerWasMoved = false;
      }
    }
    this._updateLatestPointer(pointer, event, eventTarget);
    this._scopeFire('interactions:update-pointer', {
      pointer,
      event,
      eventTarget,
      down,
      pointerInfo,
      pointerIndex,
      interaction: this
    });
    return pointerIndex;
  }

  /** @internal */
  removePointer(pointer, event) {
    const pointerIndex = this.getPointerIndex(pointer);
    if (pointerIndex === -1) return;
    const pointerInfo = this.pointers[pointerIndex];
    this._scopeFire('interactions:remove-pointer', {
      pointer,
      event,
      eventTarget: null,
      pointerIndex,
      pointerInfo,
      interaction: this
    });
    this.pointers.splice(pointerIndex, 1);
    this.pointerIsDown = false;
  }

  /** @internal */
  _updateLatestPointer(pointer, event, eventTarget) {
    this._latestPointer.pointer = pointer;
    this._latestPointer.event = event;
    this._latestPointer.eventTarget = eventTarget;
  }
  destroy() {
    this._latestPointer.pointer = null;
    this._latestPointer.event = null;
    this._latestPointer.eventTarget = null;
  }

  /** @internal */
  _createPreparedEvent(event, phase, preEnd, type) {
    return new _InteractEvent.InteractEvent(this, event, this.prepared.name, phase, this.element, preEnd, type);
  }

  /** @internal */
  _fireEvent(iEvent) {
    var _this$interactable;
    (_this$interactable = this.interactable) == null ? void 0 : _this$interactable.fire(iEvent);
    if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
      this.prevEvent = iEvent;
    }
  }

  /** @internal */
  _doPhase(signalArg) {
    const {
      event,
      phase,
      preEnd,
      type
    } = signalArg;
    const {
      rect
    } = this;
    if (rect && phase === 'move') {
      // update the rect changes due to pointer move
      rectUtils.addEdges(this.edges, rect, this.coords.delta[this.interactable.options.deltaSource]);
      rect.width = rect.right - rect.left;
      rect.height = rect.bottom - rect.top;
    }
    const beforeResult = this._scopeFire(`interactions:before-action-${phase}`, signalArg);
    if (beforeResult === false) {
      return false;
    }
    const iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);
    this._scopeFire(`interactions:action-${phase}`, signalArg);
    if (phase === 'start') {
      this.prevEvent = iEvent;
    }
    this._fireEvent(iEvent);
    this._scopeFire(`interactions:after-action-${phase}`, signalArg);
    return true;
  }

  /** @internal */
  _now() {
    return Date.now();
  }
}
exports.Interaction = Interaction;
var _default = exports.default = Interaction;
//# sourceMappingURL=Interaction.js.map