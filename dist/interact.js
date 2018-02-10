/**
 * interact.js v1.4.0-alpha.0+sha.33d59dd
 *
 * Copyright (c) 2012-2018 Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interact = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

/*
 * In a (windowless) server environment this file exports a factory function
 * that takes the window to use.
 *
 *     var interact = require('interact.js')(windowObject);
 *
 * See https://github.com/taye/interact.js/issues/187
 */
if (typeof window === 'undefined') {
  module.exports = function (window) {
    _dereq_('./src/utils/window').init(window);

    return _dereq_('./src/index');
  };
} else {
  module.exports = _dereq_('./src/index');
}

},{"./src/index":16,"./src/utils/window":53}],2:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var extend = _dereq_('./utils/extend.js');

function fireUntilImmediateStopped(event, listeners) {
  for (var _i = 0; _i < listeners.length; _i++) {
    var _ref;

    _ref = listeners[_i];
    var listener = _ref;

    if (event.immediatePropagationStopped) {
      break;
    }

    listener(event);
  }
}

var Eventable = function () {
  function Eventable(options) {
    _classCallCheck(this, Eventable);

    this.options = extend({}, options || {});
  }

  Eventable.prototype.fire = function fire(event) {
    var listeners = void 0;
    var onEvent = 'on' + event.type;
    var global = this.global;

    // Interactable#on() listeners
    if (listeners = this[event.type]) {
      fireUntilImmediateStopped(event, listeners);
    }

    // interactable.onevent listener
    if (this[onEvent]) {
      this[onEvent](event);
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type])) {
      fireUntilImmediateStopped(event, listeners);
    }
  };

  Eventable.prototype.on = function on(eventType, listener) {
    // if this type of event was never bound
    if (this[eventType]) {
      this[eventType].push(listener);
    } else {
      this[eventType] = [listener];
    }
  };

  Eventable.prototype.off = function off(eventType, listener) {
    // if it is an action event type
    var eventList = this[eventType];
    var index = eventList ? eventList.indexOf(listener) : -1;

    if (index !== -1) {
      eventList.splice(index, 1);
    }

    if (eventList && eventList.length === 0 || !listener) {
      this[eventType] = undefined;
    }
  };

  return Eventable;
}();

module.exports = Eventable;

},{"./utils/extend.js":40}],3:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var extend = _dereq_('./utils/extend');
var getOriginXY = _dereq_('./utils/getOriginXY');
var defaults = _dereq_('./defaultOptions');
var signals = _dereq_('./utils/Signals').new();

var InteractEvent = function () {
  /** */
  function InteractEvent(interaction, event, action, phase, element, related) {
    var preEnd = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;

    _classCallCheck(this, InteractEvent);

    var target = interaction.target;
    var deltaSource = (target && target.options || defaults).deltaSource;
    var origin = getOriginXY(target, element, action);
    var starting = phase === 'start';
    var ending = phase === 'end';
    var coords = starting ? interaction.startCoords : interaction.curCoords;
    var prevEvent = interaction.prevEvent;

    element = element || interaction.element;

    var page = extend({}, coords.page);
    var client = extend({}, coords.client);

    page.x -= origin.x;
    page.y -= origin.y;

    client.x -= origin.x;
    client.y -= origin.y;

    this.ctrlKey = event.ctrlKey;
    this.altKey = event.altKey;
    this.shiftKey = event.shiftKey;
    this.metaKey = event.metaKey;
    this.button = event.button;
    this.buttons = event.buttons;
    this.target = element;
    this.currentTarget = element;
    this.relatedTarget = related || null;
    this.preEnd = preEnd;
    this.type = action + (phase || '');
    this.interaction = interaction;
    this.interactable = target;

    this.t0 = starting ? interaction.downTimes[interaction.downTimes.length - 1] : prevEvent.t0;

    var signalArg = {
      interaction: interaction,
      event: event,
      action: action,
      phase: phase,
      element: element,
      related: related,
      page: page,
      client: client,
      coords: coords,
      starting: starting,
      ending: ending,
      deltaSource: deltaSource,
      iEvent: this
    };

    signals.fire('set-xy', signalArg);

    if (ending) {
      // use previous coords when ending
      this.pageX = prevEvent.pageX;
      this.pageY = prevEvent.pageY;
      this.clientX = prevEvent.clientX;
      this.clientY = prevEvent.clientY;
    } else {
      this.pageX = page.x;
      this.pageY = page.y;
      this.clientX = client.x;
      this.clientY = client.y;
    }

    this.x0 = interaction.startCoords.page.x - origin.x;
    this.y0 = interaction.startCoords.page.y - origin.y;
    this.clientX0 = interaction.startCoords.client.x - origin.x;
    this.clientY0 = interaction.startCoords.client.y - origin.y;

    signals.fire('set-delta', signalArg);

    this.timeStamp = coords.timeStamp;
    this.dt = interaction.pointerDelta.timeStamp;
    this.duration = this.timeStamp - this.t0;

    // speed and velocity in pixels per second
    this.speed = interaction.pointerDelta[deltaSource].speed;
    this.velocityX = interaction.pointerDelta[deltaSource].vx;
    this.velocityY = interaction.pointerDelta[deltaSource].vy;

    this.swipe = ending || phase === 'inertiastart' ? this.getSwipe() : null;

    signals.fire('new', signalArg);
  }

  InteractEvent.prototype.getSwipe = function getSwipe() {
    var interaction = this.interaction;

    if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
      return null;
    }

    var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
    var overlap = 22.5;

    if (angle < 0) {
      angle += 360;
    }

    var left = 135 - overlap <= angle && angle < 225 + overlap;
    var up = 225 - overlap <= angle && angle < 315 + overlap;

    var right = !left && (315 - overlap <= angle || angle < 45 + overlap);
    var down = !up && 45 - overlap <= angle && angle < 135 + overlap;

    return {
      up: up,
      down: down,
      left: left,
      right: right,
      angle: angle,
      speed: interaction.prevEvent.speed,
      velocity: {
        x: interaction.prevEvent.velocityX,
        y: interaction.prevEvent.velocityY
      }
    };
  };

  InteractEvent.prototype.preventDefault = function preventDefault() {};

  /** */


  InteractEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  /** */


  InteractEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  return InteractEvent;
}();

signals.on('set-delta', function (_ref) {
  var iEvent = _ref.iEvent,
      interaction = _ref.interaction,
      starting = _ref.starting,
      deltaSource = _ref.deltaSource;

  var prevEvent = starting ? iEvent : interaction.prevEvent;

  if (deltaSource === 'client') {
    iEvent.dx = iEvent.clientX - prevEvent.clientX;
    iEvent.dy = iEvent.clientY - prevEvent.clientY;
  } else {
    iEvent.dx = iEvent.pageX - prevEvent.pageX;
    iEvent.dy = iEvent.pageY - prevEvent.pageY;
  }
});

InteractEvent.signals = signals;

module.exports = InteractEvent;

},{"./defaultOptions":15,"./utils/Signals":33,"./utils/extend":40,"./utils/getOriginXY":41}],4:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var clone = _dereq_('./utils/clone');
var is = _dereq_('./utils/is');
var events = _dereq_('./utils/events');
var extend = _dereq_('./utils/extend');
var arr = _dereq_('./utils/arr');
var scope = _dereq_('./scope');
var Eventable = _dereq_('./Eventable');
var defaults = _dereq_('./defaultOptions');
var signals = _dereq_('./utils/Signals').new();

var _require = _dereq_('./utils/domUtils'),
    getElementRect = _require.getElementRect,
    nodeContains = _require.nodeContains,
    trySelector = _require.trySelector;

var _require2 = _dereq_('./utils/window'),
    getWindow = _require2.getWindow;

var _require3 = _dereq_('./utils/browser'),
    wheelEvent = _require3.wheelEvent;

var Interactable = function () {
  /** */
  function Interactable(target, options, defaultContext) {
    _classCallCheck(this, Interactable);

    this._signals = options.signals || Interactable.signals;
    this.target = target;
    this.events = new Eventable();
    this._context = options.context || defaultContext;
    this._win = getWindow(trySelector(target) ? this._context : target);
    this._doc = this._win.document;

    this._signals.fire('new', {
      target: target,
      options: options,
      interactable: this,
      win: this._win
    });

    this.set(options);
  }

  Interactable.prototype.setOnEvents = function setOnEvents(action, phases) {
    var onAction = 'on' + action;

    if (is.function(phases.onstart)) {
      this.events[onAction + 'start'] = phases.onstart;
    }
    if (is.function(phases.onmove)) {
      this.events[onAction + 'move'] = phases.onmove;
    }
    if (is.function(phases.onend)) {
      this.events[onAction + 'end'] = phases.onend;
    }
    if (is.function(phases.oninertiastart)) {
      this.events[onAction + 'inertiastart'] = phases.oninertiastart;
    }

    return this;
  };

  Interactable.prototype.setPerAction = function setPerAction(actionName, options) {
    // for all the default per-action options
    for (var optionName in options) {
      var actionOptions = this.options[actionName];
      var optionValue = options[optionName];
      var isArray = is.array(optionValue);

      // if the option value is an array
      if (isArray) {
        actionOptions[optionName] = arr.from(optionValue);
      }
      // if the option value is an object
      else if (!isArray && is.plainObject(optionValue)) {
          // copy the object
          actionOptions[optionName] = extend(actionOptions[optionName] || {}, clone(optionValue));

          // set anabled field to true if it exists in the defaults
          if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
            actionOptions[optionName].enabled = optionValue.enabled === false ? false : true;
          }
        }
        // if the option value is a boolean and the default is an object
        else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
            actionOptions[optionName].enabled = optionValue;
          }
          // if it's anything else, do a plain assignment
          else {
              actionOptions[optionName] = optionValue;
            }
    }
  };

  /**
   * The default function to get an Interactables bounding rect. Can be
   * overridden using {@link Interactable.rectChecker}.
   *
   * @param {Element} [element] The element to measure.
   * @return {object} The object's bounding rectangle.
   */


  Interactable.prototype.getRect = function getRect(element) {
    element = element || this.target;

    if (is.string(this.target) && !is.element(element)) {
      element = this._context.querySelector(this.target);
    }

    return getElementRect(element);
  };

  /**
   * Returns or sets the function used to calculate the interactable's
   * element's rectangle
   *
   * @param {function} [checker] A function which returns this Interactable's
   * bounding rectangle. See {@link Interactable.getRect}
   * @return {function | object} The checker function or this Interactable
   */


  Interactable.prototype.rectChecker = function rectChecker(checker) {
    if (is.function(checker)) {
      this.getRect = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.getRect;

      return this;
    }

    return this.getRect;
  };

  Interactable.prototype._backCompatOption = function _backCompatOption(optionName, newValue) {
    if (trySelector(newValue) || is.object(newValue)) {
      this.options[optionName] = newValue;

      for (var _i = 0; _i < scope.actions.names.length; _i++) {
        var _ref;

        _ref = scope.actions.names[_i];
        var action = _ref;

        this.options[action][optionName] = newValue;
      }

      return this;
    }

    return this.options[optionName];
  };

  /**
   * Gets or sets the origin of the Interactable's element.  The x and y
   * of the origin will be subtracted from action event coordinates.
   *
   * @param {Element | object | string} [origin] An HTML or SVG Element whose
   * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
   * or any CSS selector
   *
   * @return {object} The current origin or this Interactable
   */


  Interactable.prototype.origin = function origin(newValue) {
    return this._backCompatOption('origin', newValue);
  };

  /**
   * Returns or sets the mouse coordinate types used to calculate the
   * movement of the pointer.
   *
   * @param {string} [newValue] Use 'client' if you will be scrolling while
   * interacting; Use 'page' if you want autoScroll to work
   * @return {string | object} The current deltaSource or this Interactable
   */


  Interactable.prototype.deltaSource = function deltaSource(newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue;

      return this;
    }

    return this.options.deltaSource;
  };

  /**
   * Gets the selector context Node of the Interactable. The default is
   * `window.document`.
   *
   * @return {Node} The context Node of this Interactable
   */


  Interactable.prototype.context = function context() {
    return this._context;
  };

  Interactable.prototype.inContext = function inContext(element) {
    return this._context === element.ownerDocument || nodeContains(this._context, element);
  };

  /**
   * Calls listeners for the given InteractEvent type bound globally
   * and directly to this Interactable
   *
   * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
   * Interactable
   * @return {Interactable} this Interactable
   */


  Interactable.prototype.fire = function fire(iEvent) {
    this.events.fire(iEvent);

    return this;
  };

  Interactable.prototype._onOffMultiple = function _onOffMultiple(method, eventType, listener, options) {
    if (is.string(eventType) && eventType.search(' ') !== -1) {
      eventType = eventType.trim().split(/ +/);
    }

    if (is.array(eventType)) {
      for (var _i2 = 0; _i2 < eventType.length; _i2++) {
        var _ref2;

        _ref2 = eventType[_i2];
        var type = _ref2;

        this[method](type, listener, options);
      }

      return true;
    }

    if (is.object(eventType)) {
      for (var prop in eventType) {
        this[method](prop, eventType[prop], listener);
      }

      return true;
    }
  };

  /**
   * Binds a listener for an InteractEvent, pointerEvent or DOM event.
   *
   * @param {string | array | object} eventType  The types of events to listen
   * for
   * @param {function} listener   The function event (s)
   * @param {object | boolean} [options]    options object or useCapture flag
   * for addEventListener
   * @return {object} This Interactable
   */


  Interactable.prototype.on = function on(eventType, listener, options) {
    if (this._onOffMultiple('on', eventType, listener, options)) {
      return this;
    }

    if (eventType === 'wheel') {
      eventType = wheelEvent;
    }

    if (arr.contains(Interactable.eventTypes, eventType)) {
      this.events.on(eventType, listener);
    }
    // delegated event for selector
    else if (is.string(this.target)) {
        events.addDelegate(this.target, this._context, eventType, listener, options);
      } else {
        events.add(this.target, eventType, listener, options);
      }

    return this;
  };

  /**
   * Removes an InteractEvent, pointerEvent or DOM event listener
   *
   * @param {string | array | object} eventType The types of events that were
   * listened for
   * @param {function} listener The listener function to be removed
   * @param {object | boolean} [options] options object or useCapture flag for
   * removeEventListener
   * @return {object} This Interactable
   */


  Interactable.prototype.off = function off(eventType, listener, options) {
    if (this._onOffMultiple('off', eventType, listener, options)) {
      return this;
    }

    if (eventType === 'wheel') {
      eventType = wheelEvent;
    }

    // if it is an action event type
    if (arr.contains(Interactable.eventTypes, eventType)) {
      this.events.off(eventType, listener);
    }
    // delegated event
    else if (is.string(this.target)) {
        events.removeDelegate(this.target, this._context, eventType, listener, options);
      }
      // remove listener from this Interatable's element
      else {
          events.remove(this.target, eventType, listener, options);
        }

    return this;
  };

  /**
   * Reset the options of this Interactable
   *
   * @param {object} options The new settings to apply
   * @return {object} This Interactable
   */


  Interactable.prototype.set = function set(options) {
    if (!is.object(options)) {
      options = {};
    }

    this.options = extend({}, defaults.base);

    for (var actionName in scope.actions.methodDict) {
      var methodName = scope.actions.methodDict[actionName];

      this.options[actionName] = {};
      this.setPerAction(actionName, extend(extend({}, defaults.perAction), defaults[actionName]));

      this[methodName](options[actionName]);
    }

    for (var _i3 = 0; _i3 < Interactable.settingsMethods.length; _i3++) {
      var _ref3;

      _ref3 = Interactable.settingsMethods[_i3];
      var setting = _ref3;

      this.options[setting] = defaults.base[setting];

      if (setting in options) {
        this[setting](options[setting]);
      }
    }

    this._signals.fire('set', {
      options: options,
      interactable: this
    });

    return this;
  };

  /**
   * Remove this interactable from the list of interactables and remove it's
   * action capabilities and event listeners
   *
   * @return {interact}
   */


  Interactable.prototype.unset = function unset() {
    events.remove(this.target, 'all');

    if (is.string(this.target)) {
      // remove delegated events
      for (var type in events.delegatedEvents) {
        var delegated = events.delegatedEvents[type];

        if (delegated.selectors[0] === this.target && delegated.contexts[0] === this._context) {

          delegated.selectors.splice(0, 1);
          delegated.contexts.splice(0, 1);
          delegated.listeners.splice(0, 1);

          // remove the arrays if they are empty
          if (!delegated.selectors.length) {
            delegated[type] = null;
          }
        }

        events.remove(this._context, type, events.delegateListener);
        events.remove(this._context, type, events.delegateUseCapture, true);
      }
    } else {
      events.remove(this, 'all');
    }

    this._signals.fire('unset', { interactable: this });

    return scope.interact;
  };

  return Interactable;
}();

// all interact.js eventTypes


Interactable.eventTypes = [];

Interactable.signals = signals;

Interactable.settingsMethods = ['deltaSource', 'origin', 'preventDefault', 'rectChecker'];

module.exports = Interactable;

},{"./Eventable":2,"./defaultOptions":15,"./scope":30,"./utils/Signals":33,"./utils/arr":34,"./utils/browser":35,"./utils/clone":36,"./utils/domUtils":38,"./utils/events":39,"./utils/extend":40,"./utils/is":45,"./utils/window":53}],5:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InteractEvent = _dereq_('./InteractEvent');
var utils = _dereq_('./utils');

var Interaction = function () {
  /** */
  function Interaction(_ref) {
    var pointerType = _ref.pointerType,
        signals = _ref.signals;

    _classCallCheck(this, Interaction);

    this._signals = signals;

    this.target = null; // current interactable being interacted with
    this.element = null; // the target element of the interactable
    this.prepared = { // action that's ready to be fired on next move event
      name: null,
      axis: null,
      edges: null
    };

    // keep track of added pointers
    this.pointers = [];
    this.pointerIds = [];
    this.downTargets = [];
    this.downTimes = [];

    // Previous native pointer move event coordinates
    this.prevCoords = {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
      timeStamp: 0
    };
    // current native pointer move event coordinates
    this.curCoords = {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
      timeStamp: 0
    };

    // Starting InteractEvent pointer coordinates
    this.startCoords = {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
      timeStamp: 0
    };

    // Change in coordinates and time of the pointer
    this.pointerDelta = {
      page: { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
      client: { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
      timeStamp: 0
    };

    this.downEvent = null; // pointerdown/mousedown/touchstart event
    this.downPointer = {};

    this._eventTarget = null;
    this._curEventTarget = null;

    this.prevEvent = null; // previous action event

    this.pointerIsDown = false;
    this.pointerWasMoved = false;
    this._interacting = false;
    this._ending = false;

    this.pointerType = pointerType;

    this._signals.fire('new', this);
  }

  Interaction.prototype.pointerDown = function pointerDown(pointer, event, eventTarget) {
    var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);

    this._signals.fire('down', {
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      pointerIndex: pointerIndex,
      interaction: this
    });
  };

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


  Interaction.prototype.start = function start(action, target, element) {
    if (this.interacting() || !this.pointerIsDown || this.pointerIds.length < (action.name === 'gesture' ? 2 : 1)) {
      return;
    }

    utils.copyAction(this.prepared, action);
    this.target = target;
    this.element = element;

    this._interacting = true;
    var startEvent = this._createPreparedEvent(this.downEvent, 'start', false);
    var signalArg = {
      interaction: this,
      event: this.downEvent,
      iEvent: startEvent
    };

    this._signals.fire('action-start', signalArg);

    this._fireEvent(startEvent);

    this._signals.fire('after-action-start', signalArg);
  };

  Interaction.prototype.pointerMove = function pointerMove(pointer, event, eventTarget) {
    if (!this.simulation) {
      this.updatePointer(pointer, event, eventTarget, false);
      utils.pointer.setCoords(this.curCoords, this.pointers);
    }

    var duplicateMove = this.curCoords.page.x === this.prevCoords.page.x && this.curCoords.page.y === this.prevCoords.page.y && this.curCoords.client.x === this.prevCoords.client.x && this.curCoords.client.y === this.prevCoords.client.y;

    var dx = void 0;
    var dy = void 0;

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.curCoords.client.x - this.startCoords.client.x;
      dy = this.curCoords.client.y - this.startCoords.client.y;

      this.pointerWasMoved = utils.hypot(dx, dy) > Interaction.pointerMoveTolerance;
    }

    var signalArg = {
      pointer: pointer,
      pointerIndex: this.getPointerIndex(pointer),
      event: event,
      eventTarget: eventTarget,
      dx: dx,
      dy: dy,
      duplicate: duplicateMove,
      interaction: this,
      interactingBeforeMove: this.interacting()
    };

    if (!duplicateMove) {
      // set pointer coordinate, time changes and speeds
      utils.pointer.setCoordDeltas(this.pointerDelta, this.prevCoords, this.curCoords);
    }

    this._signals.fire('move', signalArg);

    if (!duplicateMove) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        this.doMove(signalArg);
      }

      if (this.pointerWasMoved) {
        utils.pointer.copyCoords(this.prevCoords, this.curCoords);
      }
    }
  };

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('dragmove', function (event) {
   *     if (someCondition) {
   *       // change the snap settings
   *       event.interactable.draggable({ snap: { targets: [] }});
   *       // fire another move event with re-calculated snap
   *       event.interaction.doMove();
   *     }
   *   });
   * ```
   *
   * Force a move of the current action at the same coordinates. Useful if
   * snap/restrict has been changed and you want a movement with the new
   * settings.
   */


  Interaction.prototype.doMove = function doMove(signalArg) {
    signalArg = utils.extend({
      pointer: this.pointers[0],
      event: this.prevEvent,
      eventTarget: this._eventTarget,
      interaction: this
    }, signalArg || {});

    var beforeMoveResult = this._signals.fire('before-action-move', signalArg);

    if (beforeMoveResult !== false) {
      var moveEvent = signalArg.iEvent = this._createPreparedEvent(signalArg.event, 'move', signalArg.preEnd);

      this._signals.fire('action-move', signalArg);

      this._fireEvent(moveEvent);

      this._signals.fire('after-action-move', signalArg);
    }
  };

  // End interact move events and stop auto-scroll unless simulation is running


  Interaction.prototype.pointerUp = function pointerUp(pointer, event, eventTarget, curEventTarget) {
    var pointerIndex = this.getPointerIndex(pointer);

    this._signals.fire(/cancel$/i.test(event.type) ? 'cancel' : 'up', {
      pointer: pointer,
      pointerIndex: pointerIndex,
      event: event,
      eventTarget: eventTarget,
      curEventTarget: curEventTarget,
      interaction: this
    });

    if (!this.simulation) {
      this.end(event);
    }

    this.pointerIsDown = false;
    this.removePointer(pointer, event);
  };

  Interaction.prototype.documentBlur = function documentBlur(event) {
    this.end(event);
    this._signals.fire('blur', { event: event, interaction: this });
  };

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


  Interaction.prototype.end = function end(event) {
    this._ending = true;
    event = event || this.prevEvent;

    if (this.interacting()) {
      var endEvent = this._createPreparedEvent(event, 'end', false);
      var signalArg = {
        event: event,
        iEvent: endEvent,
        interaction: this
      };

      var beforeEndResult = this._signals.fire('before-action-end', signalArg);

      if (beforeEndResult === false) {
        this._ending = false;
        return;
      }

      this._signals.fire('action-end', signalArg);

      this._fireEvent(endEvent);

      this._signals.fire('after-action-end', signalArg);
    }

    this._ending = false;
    this.stop();
  };

  Interaction.prototype.currentAction = function currentAction() {
    return this._interacting ? this.prepared.name : null;
  };

  Interaction.prototype.interacting = function interacting() {
    return this._interacting;
  };

  /** */


  Interaction.prototype.stop = function stop() {
    this._signals.fire('stop', { interaction: this });

    this.target = this.element = null;

    this._interacting = false;
    this.prepared.name = this.prevEvent = null;
  };

  Interaction.prototype.getPointerIndex = function getPointerIndex(pointer) {
    // mouse and pen interactions may have only one pointer
    if (this.pointerType === 'mouse' || this.pointerType === 'pen') {
      return 0;
    }

    return this.pointerIds.indexOf(utils.pointer.getPointerId(pointer));
  };

  Interaction.prototype.updatePointer = function updatePointer(pointer, event, eventTarget) {
    var down = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : event && /(down|start)$/i.test(event.type);

    var id = utils.pointer.getPointerId(pointer);
    var index = this.getPointerIndex(pointer);

    if (index === -1) {
      index = this.pointerIds.length;
      this.pointerIds[index] = id;
    }

    if (down) {
      this.pointerIds[index] = id;
      this.pointers[index] = pointer;
      this.pointerIsDown = true;

      if (!this.interacting()) {
        utils.pointer.setCoords(this.startCoords, this.pointers);

        utils.pointer.copyCoords(this.curCoords, this.startCoords);
        utils.pointer.copyCoords(this.prevCoords, this.startCoords);

        this.downEvent = event;
        this.downTimes[index] = this.curCoords.timeStamp;
        this.downTargets[index] = eventTarget;
        this.pointerWasMoved = false;

        utils.pointer.pointerExtend(this.downPointer, pointer);
      }

      this._signals.fire('update-pointer-down', {
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        down: down,
        pointerId: id,
        pointerIndex: index,
        interaction: this
      });
    }

    this.pointers[index] = pointer;

    return index;
  };

  Interaction.prototype.removePointer = function removePointer(pointer, event) {
    var index = this.getPointerIndex(pointer);

    if (index === -1) {
      return;
    }

    this._signals.fire('remove-pointer', {
      pointer: pointer,
      event: event,
      pointerIndex: index,
      interaction: this
    });

    this.pointers.splice(index, 1);
    this.pointerIds.splice(index, 1);
    this.downTargets.splice(index, 1);
    this.downTimes.splice(index, 1);
  };

  Interaction.prototype._updateEventTargets = function _updateEventTargets(target, currentTarget) {
    this._eventTarget = target;
    this._curEventTarget = currentTarget;
  };

  Interaction.prototype._createPreparedEvent = function _createPreparedEvent(event, phase, preEnd) {
    var actionName = this.prepared.name;

    return new InteractEvent(this, event, actionName, phase, this.element, null, preEnd);
  };

  Interaction.prototype._fireEvent = function _fireEvent(iEvent) {
    this.target.fire(iEvent);
    this.prevEvent = iEvent;
  };

  return Interaction;
}();

Interaction.pointerMoveTolerance = 1;

module.exports = Interaction;

},{"./InteractEvent":3,"./utils":43}],6:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('../utils/is');
var arr = _dereq_('../utils/arr');

function init(scope) {
  var actions = scope.actions,
      InteractEvent = scope.InteractEvent,
      Interactable = scope.Interactable,
      Interaction = scope.Interaction,
      defaults = scope.defaults;


  Interaction.signals.on('before-action-move', beforeMove);
  Interaction.signals.on('action-resume', beforeMove);

  // dragmove
  InteractEvent.signals.on('new', newInteractEvent);

  Interactable.prototype.draggable = module.exports.draggable;

  actions.drag = module.exports;
  actions.names.push('drag');
  arr.merge(Interactable.eventTypes, ['dragstart', 'dragmove', 'draginertiastart', 'draginertiaresume', 'dragend']);
  actions.methodDict.drag = 'draggable';

  defaults.drag = module.exports.defaults;
}

function beforeMove(_ref) {
  var interaction = _ref.interaction;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var axis = interaction.prepared.axis;

  if (axis === 'x') {
    interaction.curCoords.page.y = interaction.startCoords.page.y;
    interaction.curCoords.client.y = interaction.startCoords.client.y;

    interaction.pointerDelta.page.speed = Math.abs(interaction.pointerDelta.page.vx);
    interaction.pointerDelta.client.speed = Math.abs(interaction.pointerDelta.client.vx);
    interaction.pointerDelta.client.vy = 0;
    interaction.pointerDelta.page.vy = 0;
  } else if (axis === 'y') {
    interaction.curCoords.page.x = interaction.startCoords.page.x;
    interaction.curCoords.client.x = interaction.startCoords.client.x;

    interaction.pointerDelta.page.speed = Math.abs(interaction.pointerDelta.page.vy);
    interaction.pointerDelta.client.speed = Math.abs(interaction.pointerDelta.client.vy);
    interaction.pointerDelta.client.vx = 0;
    interaction.pointerDelta.page.vx = 0;
  }
}

function newInteractEvent(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (iEvent.type !== 'dragmove') {
    return;
  }

  var axis = interaction.prepared.axis;

  if (axis === 'x') {
    iEvent.pageY = interaction.startCoords.page.y;
    iEvent.clientY = interaction.startCoords.client.y;
    iEvent.dy = 0;
  } else if (axis === 'y') {
    iEvent.pageX = interaction.startCoords.page.x;
    iEvent.clientX = interaction.startCoords.client.x;
    iEvent.dx = 0;
  }
}

/**
 * ```js
 * interact(element).draggable({
 *     onstart: function (event) {},
 *     onmove : function (event) {},
 *     onend  : function (event) {},
 *
 *     // the axis in which the first movement must be
 *     // for the drag sequence to start
 *     // 'xy' by default - any direction
 *     startAxis: 'x' || 'y' || 'xy',
 *
 *     // 'xy' by default - don't restrict to one axis (move in any direction)
 *     // 'x' or 'y' to restrict movement to either axis
 *     // 'start' to restrict movement to the axis the drag started in
 *     lockAxis: 'x' || 'y' || 'xy' || 'start',
 *
 *     // max number of drags that can happen concurrently
 *     // with elements of this Interactable. Infinity by default
 *     max: Infinity,
 *
 *     // max number of drags that can target the same element+Interactable
 *     // 1 by default
 *     maxPerElement: 2
 * });
 *
 * var isDraggable = interact('element').draggable(); // true
 * ```
 *
 * Get or set whether drag actions can be performed on the target
 *
 * @alias Interactable.prototype.draggable
 *
 * @param {boolean | object} [options] true/false or An object with event
 * listeners to be fired on drag events (object makes the Interactable
 * draggable)
 * @return {boolean | Interactable} boolean indicating if this can be the
 * target of drag events, or this Interctable
 */
function draggable(options) {
  if (is.object(options)) {
    this.options.drag.enabled = options.enabled === false ? false : true;
    this.setPerAction('drag', options);
    this.setOnEvents('drag', options);

    if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
      this.options.drag.lockAxis = options.lockAxis;
    }
    if (/^(xy|x|y)$/.test(options.startAxis)) {
      this.options.drag.startAxis = options.startAxis;
    }

    return this;
  }

  if (is.bool(options)) {
    this.options.drag.enabled = options;

    if (!options) {
      this.ondragstart = this.ondragstart = this.ondragend = null;
    }

    return this;
  }

  return this.options.drag;
}

module.exports = {
  init: init,
  draggable: draggable,
  beforeMove: beforeMove,
  newInteractEvent: newInteractEvent,
  defaults: {
    startAxis: 'xy',
    lockAxis: 'xy'
  },

  checker: function checker(pointer, event, interactable) {
    var dragOptions = interactable.options.drag;

    return dragOptions.enabled ? {
      name: 'drag',
      axis: dragOptions.lockAxis === 'start' ? dragOptions.startAxis : dragOptions.lockAxis
    } : null;
  },
  getCursor: function getCursor() {
    return 'move';
  }
};

},{"../utils/arr":34,"../utils/is":45}],7:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('../utils');

function init(scope) {
  var actions = scope.actions,
      interact = scope.interact,
      Interactable = scope.Interactable,
      Interaction = scope.Interaction,
      defaults = scope.defaults;


  var dynamicDrop = false;

  Interaction.signals.on('after-action-start', function (_ref) {
    var interaction = _ref.interaction,
        event = _ref.event;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    // reset active dropzones
    interaction.activeDrops = null;
    interaction.dropEvents = null;

    if (!interaction.dynamicDrop) {
      interaction.activeDrops = getActiveDrops(scope, interaction.element);
    }

    var dragEvent = interaction.prevEvent;
    var dropEvents = getDropEvents(interaction, event, dragEvent);

    if (dropEvents.activate) {
      fireActivationEvents(interaction.activeDrops, dropEvents.activate);
    }
  });

  Interaction.signals.on('action-move', function (arg) {
    return onEventCreated(arg, scope, dynamicDrop);
  });
  Interaction.signals.on('action-end', function (arg) {
    return onEventCreated(arg, scope, dynamicDrop);
  });

  Interaction.signals.on('after-action-move', function (_ref2) {
    var interaction = _ref2.interaction;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    fireDropEvents(interaction, interaction.dropEvents);
  });

  Interaction.signals.on('after-action-end', function (_ref3) {
    var interaction = _ref3.interaction;

    if (interaction.prepared.name === 'drag') {
      fireDropEvents(interaction, interaction.dropEvents);
    }
  });

  Interaction.signals.on('stop', function (_ref4) {
    var interaction = _ref4.interaction;

    interaction.activeDrops = null;
    interaction.dropEvents = null;
  });

  /**
   * ```js
   * interact(target)
   * .dropChecker(function(dragEvent,         // related dragmove or dragend event
   *                       event,             // TouchEvent/PointerEvent/MouseEvent
   *                       dropped,           // bool result of the default checker
   *                       dropzone,          // dropzone Interactable
   *                       dropElement,       // dropzone elemnt
   *                       draggable,         // draggable Interactable
   *                       draggableElement) {// draggable element
   *
   *   return dropped && event.target.hasAttribute('allow-drop');
   * }
   * ```
   *
   * ```js
   * interact('.drop').dropzone({
   *   accept: '.can-drop' || document.getElementById('single-drop'),
   *   overlap: 'pointer' || 'center' || zeroToOne
   * }
   * ```
   *
   * Returns or sets whether draggables can be dropped onto this target to
   * trigger drop events
   *
   * Dropzones can receive the following events:
   *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
   *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
   *  - `dragmove` when a draggable that has entered the dropzone is moved
   *  - `drop` when a draggable is dropped into this dropzone
   *
   * Use the `accept` option to allow only elements that match the given CSS
   * selector or element. The value can be:
   *
   *  - **an Element** - only that element can be dropped into this dropzone.
   *  - **a string**, - the element being dragged must match it as a CSS selector.
   *  - **`null`** - accept options is cleared - it accepts any element.
   *
   * Use the `overlap` option to set how drops are checked for. The allowed
   * values are:
   *
   *   - `'pointer'`, the pointer must be over the dropzone (default)
   *   - `'center'`, the draggable element's center must be over the dropzone
   *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
   *   e.g. `0.5` for drop to happen when half of the area of the draggable is
   *   over the dropzone
   *
   * Use the `checker` option to specify a function to check if a dragged element
   * is over this Interactable.
   *
   * @param {boolean | object | null} [options] The new options to be set.
   * @return {boolean | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.dropzone = function (options) {
    if (utils.is.object(options)) {
      this.options.drop.enabled = options.enabled === false ? false : true;

      if (utils.is.function(options.ondrop)) {
        this.events.ondrop = options.ondrop;
      }
      if (utils.is.function(options.ondropactivate)) {
        this.events.ondropactivate = options.ondropactivate;
      }
      if (utils.is.function(options.ondropdeactivate)) {
        this.events.ondropdeactivate = options.ondropdeactivate;
      }
      if (utils.is.function(options.ondragenter)) {
        this.events.ondragenter = options.ondragenter;
      }
      if (utils.is.function(options.ondragleave)) {
        this.events.ondragleave = options.ondragleave;
      }
      if (utils.is.function(options.ondropmove)) {
        this.events.ondropmove = options.ondropmove;
      }

      if (/^(pointer|center)$/.test(options.overlap)) {
        this.options.drop.overlap = options.overlap;
      } else if (utils.is.number(options.overlap)) {
        this.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
      }
      if ('accept' in options) {
        this.options.drop.accept = options.accept;
      }
      if ('checker' in options) {
        this.options.drop.checker = options.checker;
      }

      return this;
    }

    if (utils.is.bool(options)) {
      this.options.drop.enabled = options;

      if (!options) {
        this.ondragenter = this.ondragleave = this.ondrop = this.ondropactivate = this.ondropdeactivate = null;
      }

      return this;
    }

    return this.options.drop;
  };

  Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
    var dropped = false;

    // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false
    if (!(rect = rect || this.getRect(dropElement))) {
      return this.options.drop.checker ? this.options.drop.checker(dragEvent, event, dropped, this, dropElement, draggable, draggableElement) : false;
    }

    var dropOverlap = this.options.drop.overlap;

    if (dropOverlap === 'pointer') {
      var origin = utils.getOriginXY(draggable, draggableElement, 'drag');
      var page = utils.pointer.getPageXY(dragEvent);

      page.x += origin.x;
      page.y += origin.y;

      var horizontal = page.x > rect.left && page.x < rect.right;
      var vertical = page.y > rect.top && page.y < rect.bottom;

      dropped = horizontal && vertical;
    }

    var dragRect = draggable.getRect(draggableElement);

    if (dragRect && dropOverlap === 'center') {
      var cx = dragRect.left + dragRect.width / 2;
      var cy = dragRect.top + dragRect.height / 2;

      dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }

    if (dragRect && utils.is.number(dropOverlap)) {
      var overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));

      var overlapRatio = overlapArea / (dragRect.width * dragRect.height);

      dropped = overlapRatio >= dropOverlap;
    }

    if (this.options.drop.checker) {
      dropped = this.options.drop.checker(dragEvent, event, dropped, this, dropElement, draggable, draggableElement);
    }

    return dropped;
  };

  Interactable.settingsMethods.push('dropChecker');

  Interaction.signals.on('new', function (interaction) {
    interaction.dropTarget = null; // the dropzone a drag target might be dropped into
    interaction.dropElement = null; // the element at the time of checking
    interaction.prevDropTarget = null; // the dropzone that was recently dragged away from
    interaction.prevDropElement = null; // the element at the time of checking
    interaction.dropEvents = null; // the dropEvents related to the current drag event
    interaction.activeDrops = null; // an array of { dropzone, element, rect }
  });

  Interaction.signals.on('stop', function (_ref5) {
    var interaction = _ref5.interaction;

    interaction.dropTarget = interaction.dropElement = interaction.prevDropTarget = interaction.prevDropElement = null;
  });

  /**
   * Returns or sets whether the dimensions of dropzone elements are calculated
   * on every dragmove or only on dragstart for the default dropChecker
   *
   * @param {boolean} [newValue] True to check on each move. False to check only
   * before start
   * @return {boolean | interact} The current setting or interact
   */
  interact.dynamicDrop = function (newValue) {
    if (utils.is.bool(newValue)) {
      //if (dragging && dynamicDrop !== newValue && !newValue) {
      //calcRects(dropzones);
      //}

      dynamicDrop = newValue;

      return interact;
    }
    return dynamicDrop;
  };

  utils.arr.merge(Interactable.eventTypes, ['dragenter', 'dragleave', 'dropactivate', 'dropdeactivate', 'dropmove', 'drop']);
  actions.methodDict.drop = 'dropzone';

  defaults.drop = module.exports.defaults;
}

function collectDrops(_ref6, draggableElement) {
  var interactables = _ref6.interactables;

  var drops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (var _i = 0; _i < interactables.length; _i++) {
    var _ref7;

    _ref7 = interactables[_i];
    var dropzone = _ref7;

    if (!dropzone.options.drop.enabled) {
      continue;
    }

    var accept = dropzone.options.drop.accept;

    // test the draggable draggableElement against the dropzone's accept setting
    if (utils.is.element(accept) && accept !== draggableElement || utils.is.string(accept) && !utils.dom.matchesSelector(draggableElement, accept)) {

      continue;
    }

    // query for new elements if necessary
    var dropElements = utils.is.string(dropzone.target) ? dropzone._context.querySelectorAll(dropzone.target) : [dropzone.target];

    for (var _i2 = 0; _i2 < dropElements.length; _i2++) {
      var _ref8;

      _ref8 = dropElements[_i2];
      var dropzoneElement = _ref8;

      if (dropzoneElement !== draggableElement) {
        drops.push({
          dropzone: dropzone,
          element: dropzoneElement
        });
      }
    }
  }

  return drops;
}

function fireActivationEvents(activeDrops, event) {
  var prevElement = void 0;

  // loop through all active dropzones and trigger event
  for (var _i3 = 0; _i3 < activeDrops.length; _i3++) {
    var _ref10;

    _ref10 = activeDrops[_i3];
    var _ref9 = _ref10;
    var dropzone = _ref9.dropzone;
    var element = _ref9.element;


    // prevent trigger of duplicate events on same element
    if (element !== prevElement) {
      // set current element as event target
      event.target = element;
      dropzone.fire(event);
    }
    prevElement = element;
  }
}

// return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true
function getActiveDrops(scope, dragElement) {
  // get dropzones and their elements that could receive the draggable
  var activeDrops = collectDrops(scope, dragElement);

  for (var _i4 = 0; _i4 < activeDrops.length; _i4++) {
    var _ref11;

    _ref11 = activeDrops[_i4];
    var activeDrop = _ref11;

    activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
  }

  return activeDrops;
}

function getDrop(_ref12, dragEvent, pointerEvent) {
  var activeDrops = _ref12.activeDrops,
      draggable = _ref12.target,
      dragElement = _ref12.element;
  var interaction = dragEvent.interaction;


  var validDrops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (var _i5 = 0; _i5 < activeDrops.length; _i5++) {
    var _ref14;

    _ref14 = activeDrops[_i5];
    var _ref13 = _ref14;
    var dropzone = _ref13.dropzone;
    var dropzoneElement = _ref13.element;
    var rect = _ref13.rect;

    validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect) ? dropzoneElement : null);
  }

  // get the most appropriate dropzone based on DOM depth and order
  var dropIndex = utils.dom.indexOfDeepestElement(validDrops);

  return interaction.activeDrops[dropIndex] || null;
}

function getDropEvents(interaction, pointerEvent, dragEvent) {
  var dropEvents = {
    enter: null,
    leave: null,
    activate: null,
    deactivate: null,
    move: null,
    drop: null
  };

  var tmpl = {
    dragEvent: dragEvent,
    interaction: interaction,
    target: interaction.dropElement,
    dropzone: interaction.dropTarget,
    relatedTarget: dragEvent.target,
    draggable: dragEvent.interactable,
    timeStamp: dragEvent.timeStamp
  };

  if (interaction.dropElement !== interaction.prevDropElement) {
    // if there was a prevDropTarget, create a dragleave event
    if (interaction.prevDropTarget) {
      dropEvents.leave = utils.extend({ type: 'dragleave' }, tmpl);

      dragEvent.dragLeave = dropEvents.leave.target = interaction.prevDropElement;
      dragEvent.prevDropzone = dropEvents.leave.dropzone = interaction.prevDropTarget;
    }
    // if the dropTarget is not null, create a dragenter event
    if (interaction.dropTarget) {
      dropEvents.enter = {
        dragEvent: dragEvent,
        interaction: interaction,
        target: interaction.dropElement,
        dropzone: interaction.dropTarget,
        relatedTarget: dragEvent.target,
        draggable: dragEvent.interactable,
        timeStamp: dragEvent.timeStamp,
        type: 'dragenter'
      };

      dragEvent.dragEnter = interaction.dropElement;
      dragEvent.dropzone = interaction.dropTarget;
    }
  }

  if (dragEvent.type === 'dragend' && interaction.dropTarget) {
    dropEvents.drop = utils.extend({ type: 'drop' }, tmpl);

    dragEvent.dropzone = interaction.dropTarget;
    dragEvent.relatedTarget = interaction.dropElement;
  }
  if (dragEvent.type === 'dragstart') {
    dropEvents.activate = utils.extend({ type: 'dropactivate' }, tmpl);

    dropEvents.activate.target = null;
    dropEvents.activate.dropzone = null;
  }
  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = utils.extend({ type: 'dropdeactivate' }, tmpl);

    dropEvents.deactivate.target = null;
    dropEvents.deactivate.dropzone = null;
  }
  if (dragEvent.type === 'dragmove' && interaction.dropTarget) {
    dropEvents.move = utils.extend({
      dragmove: dragEvent,
      type: 'dropmove'
    }, tmpl);

    dragEvent.dropzone = interaction.dropTarget;
  }

  return dropEvents;
}

function fireDropEvents(interaction, dropEvents) {
  var activeDrops = interaction.activeDrops,
      prevDropTarget = interaction.prevDropTarget,
      dropTarget = interaction.dropTarget,
      dropElement = interaction.dropElement;


  if (dropEvents.leave) {
    prevDropTarget.fire(dropEvents.leave);
  }
  if (dropEvents.move) {
    dropTarget.fire(dropEvents.move);
  }
  if (dropEvents.enter) {
    dropTarget.fire(dropEvents.enter);
  }
  if (dropEvents.drop) {
    dropTarget.fire(dropEvents.drop);
  }

  if (dropEvents.deactivate) {
    fireActivationEvents(activeDrops, dropEvents.deactivate);
  }

  interaction.prevDropTarget = dropTarget;
  interaction.prevDropElement = dropElement;
}

function onEventCreated(_ref15, scope, dynamicDrop) {
  var interaction = _ref15.interaction,
      iEvent = _ref15.iEvent,
      event = _ref15.event;

  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
    return;
  }

  if (dynamicDrop) {
    interaction.activeDrops = getActiveDrops(scope, interaction.element);
  }

  var dragEvent = iEvent;
  var dropResult = getDrop(interaction, dragEvent, event);

  interaction.dropTarget = dropResult && dropResult.dropzone;
  interaction.dropElement = dropResult && dropResult.element;

  interaction.dropEvents = getDropEvents(interaction, event, dragEvent);
}

module.exports = {
  init: init,
  getActiveDrops: getActiveDrops,
  getDrop: getDrop,
  getDropEvents: getDropEvents,
  fireDropEvents: fireDropEvents,
  defaults: {
    enabled: false,
    accept: null,
    overlap: 'pointer'
  }
};

},{"../utils":43}],8:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('../utils');

function init(scope) {
  var actions = scope.actions,
      InteractEvent = scope.InteractEvent,
      Interactable = scope.Interactable,
      Interaction = scope.Interaction,
      defaults = scope.defaults;


  var gesture = {
    defaults: {},

    checker: function checker(pointer, event, interactable, element, interaction) {
      if (interaction.pointerIds.length >= 2) {
        return { name: 'gesture' };
      }

      return null;
    },

    getCursor: function getCursor() {
      return '';
    }
  };

  InteractEvent.signals.on('new', function (_ref) {
    var iEvent = _ref.iEvent,
        interaction = _ref.interaction;

    if (iEvent.type !== 'gesturestart') {
      return;
    }
    iEvent.ds = 0;

    interaction.gesture.startDistance = interaction.gesture.prevDistance = iEvent.distance;
    interaction.gesture.startAngle = interaction.gesture.prevAngle = iEvent.angle;
    interaction.gesture.scale = 1;
  });

  InteractEvent.signals.on('new', function (_ref2) {
    var iEvent = _ref2.iEvent,
        interaction = _ref2.interaction;

    if (iEvent.type !== 'gesturemove') {
      return;
    }

    iEvent.ds = iEvent.scale - interaction.gesture.scale;

    interaction.target.fire(iEvent);

    interaction.gesture.prevAngle = iEvent.angle;
    interaction.gesture.prevDistance = iEvent.distance;

    if (iEvent.scale !== Infinity && iEvent.scale !== null && iEvent.scale !== undefined && !isNaN(iEvent.scale)) {

      interaction.gesture.scale = iEvent.scale;
    }
  });

  /**
   * ```js
   * interact(element).gesturable({
   *     onstart: function (event) {},
   *     onmove : function (event) {},
   *     onend  : function (event) {},
   *
   *     // limit multiple gestures.
   *     // See the explanation in {@link Interactable.draggable} example
   *     max: Infinity,
   *     maxPerElement: 1,
   * });
   *
   * var isGestureable = interact(element).gesturable();
   * ```
   *
   * Gets or sets whether multitouch gestures can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on gesture events (makes the Interactable gesturable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of gesture events, or this Interactable
   */
  Interactable.prototype.gesturable = function (options) {
    if (utils.is.object(options)) {
      this.options.gesture.enabled = options.enabled === false ? false : true;
      this.setPerAction('gesture', options);
      this.setOnEvents('gesture', options);

      return this;
    }

    if (utils.is.bool(options)) {
      this.options.gesture.enabled = options;

      if (!options) {
        this.ongesturestart = this.ongesturestart = this.ongestureend = null;
      }

      return this;
    }

    return this.options.gesture;
  };

  InteractEvent.signals.on('set-delta', function (_ref3) {
    var interaction = _ref3.interaction,
        iEvent = _ref3.iEvent,
        action = _ref3.action,
        event = _ref3.event,
        starting = _ref3.starting,
        ending = _ref3.ending,
        deltaSource = _ref3.deltaSource;

    if (action !== 'gesture') {
      return;
    }

    var pointers = interaction.pointers;

    iEvent.touches = [pointers[0], pointers[1]];

    if (starting) {
      iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource);
      iEvent.box = utils.pointer.touchBBox(pointers);
      iEvent.scale = 1;
      iEvent.ds = 0;
      iEvent.angle = utils.pointer.touchAngle(pointers, undefined, deltaSource);
      iEvent.da = 0;
    } else if (ending || event instanceof InteractEvent) {
      iEvent.distance = interaction.prevEvent.distance;
      iEvent.box = interaction.prevEvent.box;
      iEvent.scale = interaction.prevEvent.scale;
      iEvent.ds = iEvent.scale - 1;
      iEvent.angle = interaction.prevEvent.angle;
      iEvent.da = iEvent.angle - interaction.gesture.startAngle;
    } else {
      iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource);
      iEvent.box = utils.pointer.touchBBox(pointers);
      iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
      iEvent.angle = utils.pointer.touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);

      iEvent.ds = iEvent.scale - interaction.gesture.prevScale;
      iEvent.da = iEvent.angle - interaction.gesture.prevAngle;
    }
  });

  Interaction.signals.on('new', function (interaction) {
    interaction.gesture = {
      start: { x: 0, y: 0 },

      startDistance: 0, // distance between two touches of touchStart
      prevDistance: 0,
      distance: 0,

      scale: 1, // gesture.distance / gesture.startDistance

      startAngle: 0, // angle of line joining two touches
      prevAngle: 0 // angle of the previous gesture event
    };
  });

  actions.gesture = gesture;
  actions.names.push('gesture');
  utils.arr.merge(Interactable.eventTypes, ['gesturestart', 'gesturemove', 'gestureend']);
  actions.methodDict.gesture = 'gesturable';

  defaults.gesture = gesture.defaults;
}

module.exports = { init: init };

},{"../utils":43}],9:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('../utils');

function init(scope) {
  var actions = scope.actions,
      browser = scope.browser,
      InteractEvent = scope.InteractEvent,
      Interactable = scope.Interactable,
      Interaction = scope.Interaction,
      defaults = scope.defaults;

  // Less Precision with touch input

  var defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;

  var resize = {
    defaults: {
      square: false,
      preserveAspectRatio: false,
      axis: 'xy',

      // use default margin
      margin: NaN,

      // object with props left, right, top, bottom which are
      // true/false values to resize when the pointer is over that edge,
      // CSS selectors to match the handles for each direction
      // or the Elements for each handle
      edges: null,

      // a value of 'none' will limit the resize rect to a minimum of 0x0
      // 'negate' will alow the rect to have negative width/height
      // 'reposition' will keep the width/height positive by swapping
      // the top and bottom edges and/or swapping the left and right edges
      invert: 'none'
    },

    checker: function checker(pointer, event, interactable, element, interaction, rect) {
      if (!rect) {
        return null;
      }

      var page = utils.extend({}, interaction.curCoords.page);
      var options = interactable.options;

      if (options.resize.enabled) {
        var resizeOptions = options.resize;
        var resizeEdges = { left: false, right: false, top: false, bottom: false };

        // if using resize.edges
        if (utils.is.object(resizeOptions.edges)) {
          for (var edge in resizeEdges) {
            resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._eventTarget, element, rect, resizeOptions.margin || defaultMargin);
          }

          resizeEdges.left = resizeEdges.left && !resizeEdges.right;
          resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;

          if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
            return {
              name: 'resize',
              edges: resizeEdges
            };
          }
        } else {
          var right = options.resize.axis !== 'y' && page.x > rect.right - defaultMargin;
          var bottom = options.resize.axis !== 'x' && page.y > rect.bottom - defaultMargin;

          if (right || bottom) {
            return {
              name: 'resize',
              axes: (right ? 'x' : '') + (bottom ? 'y' : '')
            };
          }
        }
      }

      return null;
    },

    cursors: browser.isIe9 ? {
      x: 'e-resize',
      y: 's-resize',
      xy: 'se-resize',

      top: 'n-resize',
      left: 'w-resize',
      bottom: 's-resize',
      right: 'e-resize',
      topleft: 'se-resize',
      bottomright: 'se-resize',
      topright: 'ne-resize',
      bottomleft: 'ne-resize'
    } : {
      x: 'ew-resize',
      y: 'ns-resize',
      xy: 'nwse-resize',

      top: 'ns-resize',
      left: 'ew-resize',
      bottom: 'ns-resize',
      right: 'ew-resize',
      topleft: 'nwse-resize',
      bottomright: 'nwse-resize',
      topright: 'nesw-resize',
      bottomleft: 'nesw-resize'
    },

    getCursor: function getCursor(action) {
      if (action.axis) {
        return resize.cursors[action.name + action.axis];
      } else if (action.edges) {
        var cursorKey = '';
        var edgeNames = ['top', 'bottom', 'left', 'right'];

        for (var i = 0; i < 4; i++) {
          if (action.edges[edgeNames[i]]) {
            cursorKey += edgeNames[i];
          }
        }

        return resize.cursors[cursorKey];
      }
    }
  };

  // resizestart
  InteractEvent.signals.on('new', function (_ref) {
    var iEvent = _ref.iEvent,
        interaction = _ref.interaction;

    if (iEvent.type !== 'resizestart' || !interaction.prepared.edges) {
      return;
    }

    var startRect = interaction.target.getRect(interaction.element);
    var resizeOptions = interaction.target.options.resize;

    /*
     * When using the `resizable.square` or `resizable.preserveAspectRatio` options, resizing from one edge
     * will affect another. E.g. with `resizable.square`, resizing to make the right edge larger will make
     * the bottom edge larger by the same amount. We call these 'linked' edges. Any linked edges will depend
     * on the active edges and the edge being interacted with.
     */
    if (resizeOptions.square || resizeOptions.preserveAspectRatio) {
      var linkedEdges = utils.extend({}, interaction.prepared.edges);

      linkedEdges.top = linkedEdges.top || linkedEdges.left && !linkedEdges.bottom;
      linkedEdges.left = linkedEdges.left || linkedEdges.top && !linkedEdges.right;
      linkedEdges.bottom = linkedEdges.bottom || linkedEdges.right && !linkedEdges.top;
      linkedEdges.right = linkedEdges.right || linkedEdges.bottom && !linkedEdges.left;

      interaction.prepared._linkedEdges = linkedEdges;
    } else {
      interaction.prepared._linkedEdges = null;
    }

    // if using `resizable.preserveAspectRatio` option, record aspect ratio at the start of the resize
    if (resizeOptions.preserveAspectRatio) {
      interaction.resizeStartAspectRatio = startRect.width / startRect.height;
    }

    interaction.resizeRects = {
      start: startRect,
      current: utils.extend({}, startRect),
      inverted: utils.extend({}, startRect),
      previous: utils.extend({}, startRect),
      delta: {
        left: 0, right: 0, width: 0,
        top: 0, bottom: 0, height: 0
      }
    };

    iEvent.rect = interaction.resizeRects.inverted;
    iEvent.deltaRect = interaction.resizeRects.delta;
  });

  // resizemove
  InteractEvent.signals.on('new', function (_ref2) {
    var iEvent = _ref2.iEvent,
        phase = _ref2.phase,
        interaction = _ref2.interaction;

    if (phase !== 'move' || !interaction.prepared.edges) {
      return;
    }

    var resizeOptions = interaction.target.options.resize;
    var invert = resizeOptions.invert;
    var invertible = invert === 'reposition' || invert === 'negate';

    var edges = interaction.prepared.edges;

    var start = interaction.resizeRects.start;
    var current = interaction.resizeRects.current;
    var inverted = interaction.resizeRects.inverted;
    var delta = interaction.resizeRects.delta;
    var previous = utils.extend(interaction.resizeRects.previous, inverted);
    var originalEdges = edges;

    var dx = iEvent.dx;
    var dy = iEvent.dy;

    if (resizeOptions.preserveAspectRatio || resizeOptions.square) {
      // `resize.preserveAspectRatio` takes precedence over `resize.square`
      var startAspectRatio = resizeOptions.preserveAspectRatio ? interaction.resizeStartAspectRatio : 1;

      edges = interaction.prepared._linkedEdges;

      if (originalEdges.left && originalEdges.bottom || originalEdges.right && originalEdges.top) {
        dy = -dx / startAspectRatio;
      } else if (originalEdges.left || originalEdges.right) {
        dy = dx / startAspectRatio;
      } else if (originalEdges.top || originalEdges.bottom) {
        dx = dy * startAspectRatio;
      }
    }

    // update the 'current' rect without modifications
    if (edges.top) {
      current.top += dy;
    }
    if (edges.bottom) {
      current.bottom += dy;
    }
    if (edges.left) {
      current.left += dx;
    }
    if (edges.right) {
      current.right += dx;
    }

    if (invertible) {
      // if invertible, copy the current rect
      utils.extend(inverted, current);

      if (invert === 'reposition') {
        // swap edge values if necessary to keep width/height positive
        var swap = void 0;

        if (inverted.top > inverted.bottom) {
          swap = inverted.top;

          inverted.top = inverted.bottom;
          inverted.bottom = swap;
        }
        if (inverted.left > inverted.right) {
          swap = inverted.left;

          inverted.left = inverted.right;
          inverted.right = swap;
        }
      }
    } else {
      // if not invertible, restrict to minimum of 0x0 rect
      inverted.top = Math.min(current.top, start.bottom);
      inverted.bottom = Math.max(current.bottom, start.top);
      inverted.left = Math.min(current.left, start.right);
      inverted.right = Math.max(current.right, start.left);
    }

    inverted.width = inverted.right - inverted.left;
    inverted.height = inverted.bottom - inverted.top;

    for (var edge in inverted) {
      delta[edge] = inverted[edge] - previous[edge];
    }

    iEvent.edges = interaction.prepared.edges;
    iEvent.rect = inverted;
    iEvent.deltaRect = delta;
  });

  /**
   * ```js
   * interact(element).resizable({
   *   onstart: function (event) {},
   *   onmove : function (event) {},
   *   onend  : function (event) {},
   *
   *   edges: {
   *     top   : true,       // Use pointer coords to check for resize.
   *     left  : false,      // Disable resizing from left edge.
   *     bottom: '.resize-s',// Resize if pointer target matches selector
   *     right : handleEl    // Resize if pointer target is the given Element
   *   },
   *
   *     // Width and height can be adjusted independently. When `true`, width and
   *     // height are adjusted at a 1:1 ratio.
   *     square: false,
   *
   *     // Width and height can be adjusted independently. When `true`, width and
   *     // height maintain the aspect ratio they had when resizing started.
   *     preserveAspectRatio: false,
   *
   *   // a value of 'none' will limit the resize rect to a minimum of 0x0
   *   // 'negate' will allow the rect to have negative width/height
   *   // 'reposition' will keep the width/height positive by swapping
   *   // the top and bottom edges and/or swapping the left and right edges
   *   invert: 'none' || 'negate' || 'reposition'
   *
   *   // limit multiple resizes.
   *   // See the explanation in the {@link Interactable.draggable} example
   *   max: Infinity,
   *   maxPerElement: 1,
   * });
   *
   * var isResizeable = interact(element).resizable();
   * ```
   *
   * Gets or sets whether resize actions can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on resize events (object makes the Interactable
   * resizable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of resize elements, or this Interactable
   */
  Interactable.prototype.resizable = function (options) {
    if (utils.is.object(options)) {
      this.options.resize.enabled = options.enabled === false ? false : true;
      this.setPerAction('resize', options);
      this.setOnEvents('resize', options);

      if (/^x$|^y$|^xy$/.test(options.axis)) {
        this.options.resize.axis = options.axis;
      } else if (options.axis === null) {
        this.options.resize.axis = defaults.resize.axis;
      }

      if (utils.is.bool(options.preserveAspectRatio)) {
        this.options.resize.preserveAspectRatio = options.preserveAspectRatio;
      } else if (utils.is.bool(options.square)) {
        this.options.resize.square = options.square;
      }

      return this;
    }
    if (utils.is.bool(options)) {
      this.options.resize.enabled = options;

      if (!options) {
        this.onresizestart = this.onresizestart = this.onresizeend = null;
      }

      return this;
    }
    return this.options.resize;
  };

  function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) {
      return false;
    }

    // true value, use pointer coords and element rect
    if (value === true) {
      // if dimensions are negative, "switch" edges
      var width = utils.is.number(rect.width) ? rect.width : rect.right - rect.left;
      var height = utils.is.number(rect.height) ? rect.height : rect.bottom - rect.top;

      if (width < 0) {
        if (name === 'left') {
          name = 'right';
        } else if (name === 'right') {
          name = 'left';
        }
      }
      if (height < 0) {
        if (name === 'top') {
          name = 'bottom';
        } else if (name === 'bottom') {
          name = 'top';
        }
      }

      if (name === 'left') {
        return page.x < (width >= 0 ? rect.left : rect.right) + margin;
      }
      if (name === 'top') {
        return page.y < (height >= 0 ? rect.top : rect.bottom) + margin;
      }

      if (name === 'right') {
        return page.x > (width >= 0 ? rect.right : rect.left) - margin;
      }
      if (name === 'bottom') {
        return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
      }
    }

    // the remaining checks require an element
    if (!utils.is.element(element)) {
      return false;
    }

    return utils.is.element(value)
    // the value is an element to use as a resize handle
    ? value === element
    // otherwise check if element matches value as selector
    : utils.dom.matchesUpTo(element, value, interactableElement);
  }

  Interaction.signals.on('new', function (interaction) {
    interaction.resizeAxes = 'xy';
  });

  InteractEvent.signals.on('set-delta', function (_ref3) {
    var interaction = _ref3.interaction,
        iEvent = _ref3.iEvent,
        action = _ref3.action;

    if (action !== 'resize' || !interaction.resizeAxes) {
      return;
    }

    var options = interaction.target.options;

    if (options.resize.square) {
      if (interaction.resizeAxes === 'y') {
        iEvent.dx = iEvent.dy;
      } else {
        iEvent.dy = iEvent.dx;
      }
      iEvent.axes = 'xy';
    } else {
      iEvent.axes = interaction.resizeAxes;

      if (interaction.resizeAxes === 'x') {
        iEvent.dy = 0;
      } else if (interaction.resizeAxes === 'y') {
        iEvent.dx = 0;
      }
    }
  });

  actions.resize = resize;
  actions.names.push('resize');
  utils.arr.merge(Interactable.eventTypes, ['resizestart', 'resizemove', 'resizeinertiastart', 'resizeinertiaresume', 'resizeend']);
  actions.methodDict.resize = 'resizable';

  defaults.resize = resize.defaults;
}

module.exports = { init: init };

},{"../utils":43}],10:[function(_dereq_,module,exports){
'use strict';

var raf = _dereq_('./utils/raf');
var getWindow = _dereq_('./utils/window').getWindow;
var is = _dereq_('./utils/is');
var domUtils = _dereq_('./utils/domUtils');

function init(scope) {
  var Interaction = scope.Interaction,
      defaults = scope.defaults;


  var autoScroll = scope.autoScroll = {
    defaults: {
      enabled: false,
      container: null, // the item that is scrolled (Window or HTMLElement)
      margin: 60,
      speed: 300 // the scroll speed in pixels per second
    },

    interaction: null,
    i: null, // the handle returned by window.setInterval
    x: 0, y: 0, // Direction each pulse is to scroll in

    isScrolling: false,
    prevTime: 0,

    start: function start(interaction) {
      autoScroll.isScrolling = true;
      raf.cancel(autoScroll.i);

      autoScroll.interaction = interaction;
      autoScroll.prevTime = new Date().getTime();
      autoScroll.i = raf.request(autoScroll.scroll);
    },

    stop: function stop() {
      autoScroll.isScrolling = false;
      raf.cancel(autoScroll.i);
    },

    // scroll the window by the values in scroll.x/y
    scroll: function scroll() {
      var options = autoScroll.interaction.target.options[autoScroll.interaction.prepared.name].autoScroll;
      var container = options.container || getWindow(autoScroll.interaction.element);
      var now = new Date().getTime();
      // change in time in seconds
      var dt = (now - autoScroll.prevTime) / 1000;
      // displacement
      var s = options.speed * dt;

      if (s >= 1) {
        if (is.window(container)) {
          container.scrollBy(autoScroll.x * s, autoScroll.y * s);
        } else if (container) {
          container.scrollLeft += autoScroll.x * s;
          container.scrollTop += autoScroll.y * s;
        }

        autoScroll.prevTime = now;
      }

      if (autoScroll.isScrolling) {
        raf.cancel(autoScroll.i);
        autoScroll.i = raf.request(autoScroll.scroll);
      }
    },
    check: function check(interactable, actionName) {
      var options = interactable.options;

      return options[actionName].autoScroll && options[actionName].autoScroll.enabled;
    },
    onInteractionMove: function onInteractionMove(_ref) {
      var interaction = _ref.interaction,
          pointer = _ref.pointer;

      if (!(interaction.interacting() && autoScroll.check(interaction.target, interaction.prepared.name))) {
        return;
      }

      if (interaction.simulation) {
        autoScroll.x = autoScroll.y = 0;
        return;
      }

      var top = void 0;
      var right = void 0;
      var bottom = void 0;
      var left = void 0;

      var options = interaction.target.options[interaction.prepared.name].autoScroll;
      var container = options.container || getWindow(interaction.element);

      if (is.window(container)) {
        left = pointer.clientX < autoScroll.margin;
        top = pointer.clientY < autoScroll.margin;
        right = pointer.clientX > container.innerWidth - autoScroll.margin;
        bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
      } else {
        var rect = domUtils.getElementClientRect(container);

        left = pointer.clientX < rect.left + autoScroll.margin;
        top = pointer.clientY < rect.top + autoScroll.margin;
        right = pointer.clientX > rect.right - autoScroll.margin;
        bottom = pointer.clientY > rect.bottom - autoScroll.margin;
      }

      autoScroll.x = right ? 1 : left ? -1 : 0;
      autoScroll.y = bottom ? 1 : top ? -1 : 0;

      if (!autoScroll.isScrolling) {
        // set the autoScroll properties to those of the target
        autoScroll.margin = options.margin;
        autoScroll.speed = options.speed;

        autoScroll.start(interaction);
      }
    }
  };

  Interaction.signals.on('stop', autoScroll.stop);

  Interaction.signals.on('action-move', autoScroll.onInteractionMove);

  defaults.perAction.autoScroll = autoScroll.defaults;
}

module.exports = { init: init };

},{"./utils/domUtils":38,"./utils/is":45,"./utils/raf":49,"./utils/window":53}],11:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('../utils/is');
var domUtils = _dereq_('../utils/domUtils');

var _require = _dereq_('../utils'),
    warnOnce = _require.warnOnce;

function init(scope) {
  var Interactable = scope.Interactable,
      actions = scope.actions;


  Interactable.prototype.getAction = function (pointer, event, interaction, element) {
    var action = this.defaultActionChecker(pointer, event, interaction, element);

    if (this.options.actionChecker) {
      return this.options.actionChecker(pointer, event, action, this, element, interaction);
    }

    return action;
  };

  /**
   * ```js
   * interact(element, { ignoreFrom: document.getElementById('no-action') });
   * // or
   * interact(element).ignoreFrom('input, textarea, a');
   * ```
   * @deprecated
   * If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
   * of it's parents match the given CSS selector or Element, no
   * drag/resize/gesture is started.
   *
   * Don't use this method. Instead set the `ignoreFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .draggable({
   *     ignoreFrom: 'input, textarea, a[href]'',
   *   })
   *   .pointerEvents({
   *     ignoreFrom: '[no-pointer]',
   *   });
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to not ignore any elements
   * @return {string | Element | object} The current ignoreFrom value or this
   * Interactable
   */
  Interactable.prototype.ignoreFrom = warnOnce(function (newValue) {
    return this._backCompatOption('ignoreFrom', newValue);
  }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');

  /**
   * ```js
   *
   * @deprecated
   * A drag/resize/gesture is started only If the target of the `mousedown`,
   * `pointerdown` or `touchstart` event or any of it's parents match the given
   * CSS selector or Element.
   *
   * Don't use this method. Instead set the `allowFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .resizable({
   *     allowFrom: '.resize-handle',
   *   .pointerEvents({
   *     allowFrom: '.handle',,
   *   });
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to allow from any element
   * @return {string | Element | object} The current allowFrom value or this
   * Interactable
   */
  Interactable.prototype.allowFrom = warnOnce(function (newValue) {
    return this._backCompatOption('allowFrom', newValue);
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');

  Interactable.prototype.testIgnore = function (ignoreFrom, interactableElement, element) {
    if (!ignoreFrom || !is.element(element)) {
      return false;
    }

    if (is.string(ignoreFrom)) {
      return domUtils.matchesUpTo(element, ignoreFrom, interactableElement);
    } else if (is.element(ignoreFrom)) {
      return domUtils.nodeContains(ignoreFrom, element);
    }

    return false;
  };

  Interactable.prototype.testAllow = function (allowFrom, interactableElement, element) {
    if (!allowFrom) {
      return true;
    }

    if (!is.element(element)) {
      return false;
    }

    if (is.string(allowFrom)) {
      return domUtils.matchesUpTo(element, allowFrom, interactableElement);
    } else if (is.element(allowFrom)) {
      return domUtils.nodeContains(allowFrom, element);
    }

    return false;
  };

  Interactable.prototype.testIgnoreAllow = function (options, interactableElement, eventTarget) {
    return !this.testIgnore(options.ignoreFrom, interactableElement, eventTarget) && this.testAllow(options.allowFrom, interactableElement, eventTarget);
  };

  /**
   * ```js
   * interact('.resize-drag')
   *   .resizable(true)
   *   .draggable(true)
   *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
   *
   *   if (interact.matchesSelector(event.target, '.drag-handle') {
   *     // force drag with handle target
   *     action.name = drag;
   *   }
   *   else {
   *     // resize from the top and right edges
   *     action.name  = 'resize';
   *     action.edges = { top: true, right: true };
   *   }
   *
   *   return action;
   * });
   * ```
   *
   * Gets or sets the function used to check action to be performed on
   * pointerDown
   *
   * @param {function | null} [checker] A function which takes a pointer event,
   * defaultAction string, interactable, element and interaction as parameters
   * and returns an object with name property 'drag' 'resize' or 'gesture' and
   * optionally an `edges` object with boolean 'top', 'left', 'bottom' and right
   * props.
   * @return {Function | Interactable} The checker function or this Interactable
   */
  Interactable.prototype.actionChecker = function (checker) {
    if (is.function(checker)) {
      this.options.actionChecker = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.actionChecker;

      return this;
    }

    return this.options.actionChecker;
  };

  /**
   * Returns or sets whether the the cursor should be changed depending on the
   * action that would be performed if the mouse were pressed and dragged.
   *
   * @param {boolean} [newValue]
   * @return {boolean | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.styleCursor = function (newValue) {
    if (is.bool(newValue)) {
      this.options.styleCursor = newValue;

      return this;
    }

    if (newValue === null) {
      delete this.options.styleCursor;

      return this;
    }

    return this.options.styleCursor;
  };

  Interactable.prototype.defaultActionChecker = function (pointer, event, interaction, element) {
    var rect = this.getRect(element);
    var buttons = event.buttons || {
      0: 1,
      1: 4,
      3: 8,
      4: 16
    }[event.button];
    var action = null;

    for (var _i = 0; _i < actions.names.length; _i++) {
      var _ref;

      _ref = actions.names[_i];
      var actionName = _ref;

      // check mouseButton setting if the pointer is down
      if (interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & this.options[actionName].mouseButtons) === 0) {
        continue;
      }

      action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

      if (action) {
        return action;
      }
    }
  };
}

module.exports = { init: init };

},{"../utils":43,"../utils/domUtils":38,"../utils/is":45}],12:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('../utils');

function init(scope) {
  var interact = scope.interact,
      Interactable = scope.Interactable,
      Interaction = scope.Interaction,
      defaults = scope.defaults,
      Signals = scope.Signals;


  interact.use(_dereq_('./InteractableMethods'));

  // set cursor style on mousedown
  Interaction.signals.on('down', function (_ref) {
    var interaction = _ref.interaction,
        pointer = _ref.pointer,
        event = _ref.event,
        eventTarget = _ref.eventTarget;

    if (interaction.interacting()) {
      return;
    }

    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  });

  // set cursor style on mousemove
  Interaction.signals.on('move', function (_ref2) {
    var interaction = _ref2.interaction,
        pointer = _ref2.pointer,
        event = _ref2.event,
        eventTarget = _ref2.eventTarget;

    if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) {
      return;
    }

    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  });

  Interaction.signals.on('move', function (arg) {
    var interaction = arg.interaction,
        event = arg.event;


    if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
      return;
    }

    scope.autoStart.signals.fire('before-start', arg);

    var target = interaction.target;

    if (interaction.prepared.name && target) {
      // check manualStart and interaction limit
      if (target.options[interaction.prepared.name].manualStart || !withinInteractionLimit(target, interaction.element, interaction.prepared, scope)) {
        interaction.stop(event);
      } else {
        interaction.start(interaction.prepared, target, interaction.element);
      }
    }
  });

  Interaction.signals.on('stop', function (_ref3) {
    var interaction = _ref3.interaction;

    var target = interaction.target;

    if (target && target.options.styleCursor) {
      target._doc.documentElement.style.cursor = '';
    }
  });

  interact.maxInteractions = maxInteractions;

  Interactable.settingsMethods.push('styleCursor');
  Interactable.settingsMethods.push('actionChecker');
  Interactable.settingsMethods.push('ignoreFrom');
  Interactable.settingsMethods.push('allowFrom');

  defaults.base.actionChecker = null;
  defaults.base.styleCursor = true;

  utils.extend(defaults.perAction, {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1,
    allowFrom: null,
    ignoreFrom: null,

    // only allow left button by default
    // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
    mouseButtons: 1
  });

  /**
   * Returns or sets the maximum number of concurrent interactions allowed.  By
   * default only 1 interaction is allowed at a time (for backwards
   * compatibility). To allow multiple interactions on the same Interactables and
   * elements, you need to enable it in the draggable, resizable and gesturable
   * `'max'` and `'maxPerElement'` options.
   *
   * @alias module:interact.maxInteractions
   *
   * @param {number} [newValue] Any number. newValue <= 0 means no interactions.
   */
  interact.maxInteractions = function (newValue) {
    return maxInteractions(newValue, scope);
  };

  scope.autoStart = {
    // Allow this many interactions to happen simultaneously
    maxInteractions: Infinity,
    signals: Signals.new()
  };
}

// Check if the current target supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction(action, interactable, element, eventTarget, scope) {
  if (utils.is.object(action) && interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
    return action;
  }

  return null;
}

function validateSelector(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
  for (var i = 0, len = matches.length; i < len; i++) {
    var match = matches[i];
    var matchElement = matchElements[i];
    var action = validateAction(match.getAction(pointer, event, interaction, matchElement), match, matchElement, eventTarget, scope);

    if (action) {
      return {
        action: action,
        target: match,
        element: matchElement
      };
    }
  }

  return {};
}

function getActionInfo(interaction, pointer, event, eventTarget, scope) {
  var matches = [];
  var matchElements = [];

  var element = eventTarget;

  function pushMatches(interactable) {
    matches.push(interactable);
    matchElements.push(element);
  }

  while (utils.is.element(element)) {
    matches = [];
    matchElements = [];

    scope.interactables.forEachMatch(element, pushMatches);

    var actionInfo = validateSelector(interaction, pointer, event, matches, matchElements, eventTarget, scope);

    if (actionInfo.action && !actionInfo.target.options[actionInfo.action.name].manualStart) {
      return actionInfo;
    }

    element = utils.dom.parentNode(element);
  }

  return {};
}

function prepare(interaction, _ref4, scope) {
  var action = _ref4.action,
      target = _ref4.target,
      element = _ref4.element;

  action = action || {};

  if (interaction.target && interaction.target.options.styleCursor) {
    interaction.target._doc.documentElement.style.cursor = '';
  }

  interaction.target = target;
  interaction.element = element;
  utils.copyAction(interaction.prepared, action);

  if (target && target.options.styleCursor) {
    var cursor = action ? scope.actions[action.name].getCursor(action) : '';
    interaction.target._doc.documentElement.style.cursor = cursor;
  }

  scope.autoStart.signals.fire('prepared', { interaction: interaction });
}

function withinInteractionLimit(interactable, element, action, scope) {
  var options = interactable.options;
  var maxActions = options[action.name].max;
  var maxPerElement = options[action.name].maxPerElement;
  var autoStartMax = scope.autoStart.maxInteractions;
  var activeInteractions = 0;
  var targetCount = 0;
  var targetElementCount = 0;

  // no actions if any of these values == 0
  if (!(maxActions && maxPerElement && autoStartMax)) {
    return;
  }

  for (var _i = 0; _i < scope.interactions.length; _i++) {
    var _ref5;

    _ref5 = scope.interactions[_i];
    var interaction = _ref5;

    var otherAction = interaction.prepared.name;

    if (!interaction.interacting()) {
      continue;
    }

    activeInteractions++;

    if (activeInteractions >= autoStartMax) {
      return false;
    }

    if (interaction.target !== interactable) {
      continue;
    }

    targetCount += otherAction === action.name | 0;

    if (targetCount >= maxActions) {
      return false;
    }

    if (interaction.element === element) {
      targetElementCount++;

      if (otherAction !== action.name || targetElementCount >= maxPerElement) {
        return false;
      }
    }
  }

  return autoStartMax > 0;
}

function maxInteractions(newValue, scope) {
  if (utils.is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue;

    return this;
  }

  return scope.autoStart.maxInteractions;
}

module.exports = {
  init: init,
  maxInteractions: maxInteractions,
  withinInteractionLimit: withinInteractionLimit,
  validateAction: validateAction
};

},{"../utils":43,"./InteractableMethods":11}],13:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('../utils/is');

var _require = _dereq_('./base'),
    validateAction = _require.validateAction;

var _require2 = _dereq_('../utils/domUtils'),
    parentNode = _require2.parentNode;

function init(scope) {
  scope.autoStart.signals.on('before-start', function (_ref) {
    var interaction = _ref.interaction,
        eventTarget = _ref.eventTarget,
        dx = _ref.dx,
        dy = _ref.dy;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    // check if a drag is in the correct axis
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    var targetOptions = interaction.target.options.drag;
    var startAxis = targetOptions.startAxis;
    var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';

    interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : targetOptions.lockAxis;

    // if the movement isn't in the startAxis of the interactable
    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      // cancel the prepared action
      interaction.prepared.name = null;

      // then try to get a drag from another ineractable
      var element = eventTarget;

      var getDraggable = function getDraggable(interactable) {
        if (interactable === interaction.target) {
          return;
        }

        var options = interaction.target.options.drag;

        if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {

          var action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);

          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && validateAction(action, interactable, element, eventTarget, scope)) {

            return interactable;
          }
        }
      };

      // check all interactables
      while (is.element(element)) {
        var interactable = scope.interactables.forEachMatch(element, getDraggable);

        if (interactable) {
          interaction.prepared.name = 'drag';
          interaction.target = interactable;
          interaction.element = element;
          break;
        }

        element = parentNode(element);
      }
    }
  });

  function checkStartAxis(startAxis, interactable) {
    if (!interactable) {
      return false;
    }

    var thisAxis = interactable.options.drag.startAxis;

    return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
  }
}

module.exports = { init: init };

},{"../utils/domUtils":38,"../utils/is":45,"./base":12}],14:[function(_dereq_,module,exports){
'use strict';

function init(scope) {
  var autoStart = scope.autoStart,
      Interaction = scope.Interaction,
      defaults = scope.defaults;


  defaults.perAction.hold = 0;
  defaults.perAction.delay = 0;

  Interaction.signals.on('new', function (interaction) {
    interaction.autoStartHoldTimer = null;
  });

  autoStart.signals.on('prepared', function (_ref) {
    var interaction = _ref.interaction;

    var hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.autoStartHoldTimer = setTimeout(function () {
        interaction.start(interaction.prepared, interaction.target, interaction.element);
      }, hold);
    }
  });

  Interaction.signals.on('move', function (_ref2) {
    var interaction = _ref2.interaction,
        duplicate = _ref2.duplicate;

    if (interaction.pointerWasMoved && !duplicate) {
      clearTimeout(interaction.autoStartHoldTimer);
    }
  });

  // prevent regular down->move autoStart
  autoStart.signals.on('before-start', function (_ref3) {
    var interaction = _ref3.interaction;

    var hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.prepared.name = null;
    }
  });
}

function getHoldDuration(interaction) {
  var actionName = interaction.prepared && interaction.prepared.name;

  if (!actionName) {
    return null;
  }

  var options = interaction.target.options;

  return options[actionName].hold || options[actionName].delay;
}

module.exports = {
  init: init,
  getHoldDuration: getHoldDuration
};

},{}],15:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page'
  },

  perAction: {
    enabled: false,
    origin: { x: 0, y: 0 }
  }
};

},{}],16:[function(_dereq_,module,exports){
'use strict';

/* browser entry point */

var scope = _dereq_('./scope');

_dereq_('./interactions').init(scope);

scope.Interactable = _dereq_('./Interactable');
scope.InteractEvent = _dereq_('./InteractEvent');
_dereq_('./interactablePreventDefault.js');

var interact = _dereq_('./interact');

// modifiers
interact.use(_dereq_('./modifiers/base'));
interact.use(_dereq_('./modifiers/snap'));
interact.use(_dereq_('./modifiers/restrict'));

interact.snappers = _dereq_('./utils/snappers');
interact.createSnapGrid = interact.snappers.grid;

// inertia
interact.use(_dereq_('./simulations/base'));
interact.use(_dereq_('./simulations/inertia'));

// pointerEvents
interact.use(_dereq_('./pointerEvents/base'));
interact.use(_dereq_('./pointerEvents/holdRepeat'));
interact.use(_dereq_('./pointerEvents/interactableTargets'));

// autoStart hold
interact.use(_dereq_('./autoStart/base'));
interact.use(_dereq_('./autoStart/hold'));
interact.use(_dereq_('./autoStart/dragAxis'));

// actions
interact.use(_dereq_('./actions/gesture'));
interact.use(_dereq_('./actions/resize'));
interact.use(_dereq_('./actions/drag'));
interact.use(_dereq_('./actions/drop'));

// load these modifiers after resize is loaded
interact.use(_dereq_('./modifiers/snapSize'));
interact.use(_dereq_('./modifiers/restrictEdges'));
interact.use(_dereq_('./modifiers/restrictSize'));

// autoScroll
interact.use(_dereq_('./autoScroll'));

// export interact
module.exports = interact;

},{"./InteractEvent":3,"./Interactable":4,"./actions/drag":6,"./actions/drop":7,"./actions/gesture":8,"./actions/resize":9,"./autoScroll":10,"./autoStart/base":12,"./autoStart/dragAxis":13,"./autoStart/hold":14,"./interact":17,"./interactablePreventDefault.js":18,"./interactions":19,"./modifiers/base":20,"./modifiers/restrict":21,"./modifiers/restrictEdges":22,"./modifiers/restrictSize":23,"./modifiers/snap":24,"./modifiers/snapSize":25,"./pointerEvents/base":27,"./pointerEvents/holdRepeat":28,"./pointerEvents/interactableTargets":29,"./scope":30,"./simulations/base":31,"./simulations/inertia":32,"./utils/snappers":52}],17:[function(_dereq_,module,exports){
'use strict';

/** @module interact */

var browser = _dereq_('./utils/browser');
var events = _dereq_('./utils/events');
var utils = _dereq_('./utils');
var scope = _dereq_('./scope');
var Interactable = _dereq_('./Interactable');

var globalEvents = {};

/**
 * ```js
 * interact('#draggable').draggable(true);
 *
 * var rectables = interact('rect');
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   });
 * ```
 *
 * The methods of this variable can be used to set elements as interactables
 * and also to change various default settings.
 *
 * Calling it as a function and passing an element or a valid CSS selector
 * string returns an Interactable object which has various methods to configure
 * it.
 *
 * @global
 *
 * @param {Element | string} element The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */
function interact(element, options) {
  var interactable = scope.interactables.get(element, options);

  if (!interactable) {
    interactable = new Interactable(element, options || {}, scope.document);
    interactable.events.global = globalEvents;

    scope.addDocument(interactable._doc);

    scope.interactables.push(interactable);
  }

  return interactable;
}

/**
 * Use a plugin
 *
 * @alias module:interact.use
 *
 * @param {Object} plugin
 * @param {function} plugin.init
 * @return {interact}
*/
interact.use = function (plugin) {
  plugin.init(scope);
  return interact;
};

/**
 * Check if an element or selector has been set with the {@link interact}
 * function
 *
 * @alias module:interact.isSet
 *
 * @param {Element} element The Element being searched for
 * @return {boolean} Indicates if the element or CSS selector was previously
 * passed to interact
*/
interact.isSet = function (element, options) {
  return scope.interactables.indexOfElement(element, options && options.context) !== -1;
};

/**
 * Add a global listener for an InteractEvent or adds a DOM event to `document`
 *
 * @alias module:interact.on
 *
 * @param {string | array | object} type The types of events to listen for
 * @param {function} listener The function event (s)
 * @param {object | boolean} [options] object or useCapture flag for
 * addEventListener
 * @return {object} interact
 */
interact.on = function (type, listener, options) {
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.is.array(type)) {
    for (var _i = 0; _i < type.length; _i++) {
      var _ref;

      _ref = type[_i];
      var eventType = _ref;

      interact.on(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (var prop in type) {
      interact.on(prop, type[prop], listener);
    }

    return interact;
  }

  // if it is an InteractEvent type, add listener to globalEvents
  if (utils.arr.contains(Interactable.eventTypes, type)) {
    // if this type of event was never bound
    if (!globalEvents[type]) {
      globalEvents[type] = [listener];
    } else {
      globalEvents[type].push(listener);
    }
  }
  // If non InteractEvent type, addEventListener to document
  else {
      events.add(scope.document, type, listener, { options: options });
    }

  return interact;
};

/**
 * Removes a global InteractEvent listener or DOM event from `document`
 *
 * @alias module:interact.off
 *
 * @param {string | array | object} type The types of events that were listened
 * for
 * @param {function} listener The listener function to be removed
 * @param {object | boolean} options [options] object or useCapture flag for
 * removeEventListener
 * @return {object} interact
 */
interact.off = function (type, listener, options) {
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.is.array(type)) {
    for (var _i2 = 0; _i2 < type.length; _i2++) {
      var _ref2;

      _ref2 = type[_i2];
      var eventType = _ref2;

      interact.off(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (var prop in type) {
      interact.off(prop, type[prop], listener);
    }

    return interact;
  }

  if (!utils.arr.contains(Interactable.eventTypes, type)) {
    events.remove(scope.document, type, listener, options);
  } else {
    var index = void 0;

    if (type in globalEvents && (index = globalEvents[type].indexOf(listener)) !== -1) {
      globalEvents[type].splice(index, 1);
    }
  }

  return interact;
};

/**
 * Returns an object which exposes internal data

 * @alias module:interact.debug
 *
 * @return {object} An object with properties that outline the current state
 * and expose internal functions and variables
 */
interact.debug = function () {
  return scope;
};

// expose the functions used to calculate multi-touch properties
interact.getPointerAverage = utils.pointer.pointerAverage;
interact.getTouchBBox = utils.pointer.touchBBox;
interact.getTouchDistance = utils.pointer.touchDistance;
interact.getTouchAngle = utils.pointer.touchAngle;

interact.getElementRect = utils.dom.getElementRect;
interact.getElementClientRect = utils.dom.getElementClientRect;
interact.matchesSelector = utils.dom.matchesSelector;
interact.closest = utils.dom.closest;

/**
 * @alias module:interact.supportsTouch
 *
 * @return {boolean} Whether or not the browser supports touch input
 */
interact.supportsTouch = function () {
  return browser.supportsTouch;
};

/**
 * @alias module:interact.supportsPointerEvent
 *
 * @return {boolean} Whether or not the browser supports PointerEvents
 */
interact.supportsPointerEvent = function () {
  return browser.supportsPointerEvent;
};

/**
 * Cancels all interactions (end events are not fired)
 *
 * @alias module:interact.stop
 *
 * @param {Event} event An event on which to call preventDefault()
 * @return {object} interact
 */
interact.stop = function (event) {
  for (var i = scope.interactions.length - 1; i >= 0; i--) {
    scope.interactions[i].stop(event);
  }

  return interact;
};

/**
 * Returns or sets the distance the pointer must be moved before an action
 * sequence occurs. This also affects tolerance for tap events.
 *
 * @alias module:interact.pointerMoveTolerance
 *
 * @param {number} [newValue] The movement from the start position must be greater than this value
 * @return {interact | number}
 */
interact.pointerMoveTolerance = function (newValue) {
  if (utils.is.number(newValue)) {
    scope.Interaction.pointerMoveTolerance = newValue;

    return interact;
  }

  return scope.Interaction.pointerMoveTolerance;
};

Interactable.signals.on('unset', function (_ref3) {
  var interactable = _ref3.interactable;

  scope.interactables.splice(scope.interactables.indexOf(interactable), 1);

  // Stop related interactions when an Interactable is unset
  for (var _i3 = 0; _i3 < scope.interactions.length; _i3++) {
    var _ref4;

    _ref4 = scope.interactions[_i3];
    var interaction = _ref4;

    if (interaction.target === interactable && interaction.interacting() && interaction._ending) {
      interaction.stop();
    }
  }
});
interact.addDocument = scope.addDocument;
interact.removeDocument = scope.removeDocument;

// all set interactables
scope.interactables = [];

scope.interactables.indexOfElement = function indexOfElement(target, context) {
  context = context || scope.document;

  for (var i = 0; i < this.length; i++) {
    var interactable = this[i];

    if (interactable.target === target && interactable._context === context) {
      return i;
    }
  }
  return -1;
};

scope.interactables.get = function interactableGet(element, options, dontCheckInContext) {
  var ret = this[this.indexOfElement(element, options && options.context)];

  return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element)) ? ret : null;
};

scope.interactables.forEachMatch = function (element, callback) {
  for (var _i4 = 0; _i4 < this.length; _i4++) {
    var _ref5;

    _ref5 = this[_i4];
    var interactable = _ref5;

    var ret = void 0;

    if ((utils.is.string(interactable.target)
    // target is a selector and the element matches
    ? utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target) :
    // target is the element
    element === interactable.target) &&
    // the element is in context
    interactable.inContext(element)) {
      ret = callback(interactable);
    }

    if (ret !== undefined) {
      return ret;
    }
  }
};

scope.interact = interact;

module.exports = interact;

},{"./Interactable":4,"./scope":30,"./utils":43,"./utils/browser":35,"./utils/events":39}],18:[function(_dereq_,module,exports){
'use strict';

var Interactable = _dereq_('./Interactable');
var scope = _dereq_('./scope');
var is = _dereq_('./utils/is');
var events = _dereq_('./utils/events');
var browser = _dereq_('./utils/browser');

var _require = _dereq_('./utils/domUtils'),
    nodeContains = _require.nodeContains,
    matchesSelector = _require.matchesSelector;

var _require2 = _dereq_('./utils/window'),
    getWindow = _require2.getWindow;

/**
 * Returns or sets whether to prevent the browser's default behaviour in
 * response to pointer events. Can be set to:
 *  - `'always'` to always prevent
 *  - `'never'` to never prevent
 *  - `'auto'` to let interact.js try to determine what would be best
 *
 * @param {string} [newValue] `true`, `false` or `'auto'`
 * @return {string | Interactable} The current setting or this Interactable
 */


Interactable.prototype.preventDefault = function (newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    this.options.preventDefault = newValue;
    return this;
  }

  if (is.bool(newValue)) {
    this.options.preventDefault = newValue ? 'always' : 'never';
    return this;
  }

  return this.options.preventDefault;
};

Interactable.prototype.checkAndPreventDefault = function (event) {
  var setting = this.options.preventDefault;

  if (setting === 'never') {
    return;
  }

  if (setting === 'always') {
    event.preventDefault();
    return;
  }

  // setting === 'auto'

  // don't preventDefault of touch{start,move} events if the browser supports passive
  // events listeners. CSS touch-action and user-selecct should be used instead
  if (events.supportsPassive && /^touch(start|move)$/.test(event.type) && !browser.isIOS) {
    var docOptions = scope.getDocIndex(getWindow(event.target).document);

    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return;
    }
  }

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  }

  // don't preventDefault on editable elements
  if (is.element(event.target) && matchesSelector(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
    return;
  }

  event.preventDefault();
};

function onInteractionEvent(_ref) {
  var interaction = _ref.interaction,
      event = _ref.event;

  if (interaction.target) {
    interaction.target.checkAndPreventDefault(event);
  }
}

var _arr = ['down', 'move', 'up', 'cancel'];
for (var _i = 0; _i < _arr.length; _i++) {
  var eventSignal = _arr[_i];
  scope.Interaction.signals.on(eventSignal, onInteractionEvent);
}

// prevent native HTML5 drag on interact.js target elements
scope.Interaction.eventMap.dragstart = function preventNativeDrag(event) {
  for (var _i2 = 0; _i2 < scope.interactions.length; _i2++) {
    var _ref2;

    _ref2 = scope.interactions[_i2];
    var interaction = _ref2;


    if (interaction.element && (interaction.element === event.target || nodeContains(interaction.element, event.target))) {

      interaction.target.checkAndPreventDefault(event);
      return;
    }
  }
};

},{"./Interactable":4,"./scope":30,"./utils/browser":35,"./utils/domUtils":38,"./utils/events":39,"./utils/is":45,"./utils/window":53}],19:[function(_dereq_,module,exports){
'use strict';

var Interaction = _dereq_('./Interaction');
var events = _dereq_('./utils/events');
var finder = _dereq_('./utils/interactionFinder');
var browser = _dereq_('./utils/browser');
var domObjects = _dereq_('./utils/domObjects');
var pointerUtils = _dereq_('./utils/pointerUtils');
var Signals = _dereq_('./utils/Signals');

var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];

function init(scope) {
  var signals = Signals.new();

  var listeners = {};

  for (var _i = 0; _i < methodNames.length; _i++) {
    var method = methodNames[_i];
    listeners[method] = doOnInteractions(method, scope);
  }

  var eventMap = {/* 'eventType': listenerFunc */};
  var pEventTypes = browser.pEventTypes;

  if (domObjects.PointerEvent) {
    eventMap[pEventTypes.down] = listeners.pointerDown;
    eventMap[pEventTypes.move] = listeners.pointerMove;
    eventMap[pEventTypes.up] = listeners.pointerUp;
    eventMap[pEventTypes.cancel] = listeners.pointerUp;
  } else {
    eventMap.mousedown = listeners.pointerDown;
    eventMap.mousemove = listeners.pointerMove;
    eventMap.mouseup = listeners.pointerUp;

    eventMap.touchstart = listeners.pointerDown;
    eventMap.touchmove = listeners.pointerMove;
    eventMap.touchend = listeners.pointerUp;
    eventMap.touchcancel = listeners.pointerUp;
  }

  eventMap.blur = function (event) {
    for (var _i2 = 0; _i2 < scope.interactions.length; _i2++) {
      var _ref;

      _ref = scope.interactions[_i2];
      var interaction = _ref;

      interaction.documentBlur(event);
    }
  };

  scope.signals.on('add-document', onDocSignal);
  scope.signals.on('remove-document', onDocSignal);

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0;

  // all active and idle interactions
  scope.interactions = [];
  scope.Interaction = {
    signals: signals,
    Interaction: Interaction,
    new: function _new(options) {
      options.signals = signals;

      return new Interaction(options);
    },

    listeners: listeners,
    eventMap: eventMap
  };

  scope.actions = {
    names: [],
    methodDict: {}
  };
}

function doOnInteractions(method, scope) {
  return function (event) {
    var interactions = scope.interactions;


    var pointerType = pointerUtils.getPointerType(event);

    var _pointerUtils$getEven = pointerUtils.getEventTargets(event),
        eventTarget = _pointerUtils$getEven[0],
        curEventTarget = _pointerUtils$getEven[1];

    var matches = []; // [ [pointer, interaction], ...]

    if (browser.supportsTouch && /touch/.test(event.type)) {
      scope.prevTouchTime = new Date().getTime();

      for (var _i3 = 0; _i3 < event.changedTouches.length; _i3++) {
        var _ref2;

        _ref2 = event.changedTouches[_i3];
        var changedTouch = _ref2;

        var pointer = changedTouch;
        var pointerId = pointerUtils.getPointerId(pointer);
        var interaction = getInteraction({
          pointer: pointer,
          pointerId: pointerId,
          pointerType: pointerType,
          eventType: event.type,
          eventTarget: eventTarget,
          scope: scope
        });

        matches.push([pointer, interaction]);
      }
    } else {
      var invalidPointer = false;

      if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (var i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer || new Date().getTime() - scope.prevTouchTime < 500
        // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
        || event.timeStamp === 0;
      }

      if (!invalidPointer) {
        var _interaction = getInteraction({
          pointer: event,
          pointerId: pointerUtils.getPointerId(event),
          pointerType: pointerType,
          eventType: event.type,
          eventTarget: eventTarget,
          scope: scope
        });

        matches.push([event, _interaction]);
      }
    }

    for (var _i4 = 0; _i4 < matches.length; _i4++) {
      var _ref3 = matches[_i4];
      var _pointer = _ref3[0];
      var _interaction2 = _ref3[1];

      _interaction2._updateEventTargets(eventTarget, curEventTarget);
      _interaction2[method](_pointer, event, eventTarget, curEventTarget);
    }
  };
}

function getInteraction(searchDetails) {
  var pointerType = searchDetails.pointerType,
      scope = searchDetails.scope;


  var foundInteraction = finder.search(searchDetails);
  var signalArg = { interaction: foundInteraction, searchDetails: searchDetails };

  scope.Interaction.signals.fire('find', signalArg);

  return signalArg.interaction || newInteraction({ pointerType: pointerType }, scope);
}

function newInteraction(options, scope) {
  var interaction = scope.Interaction.new(options);

  scope.interactions.push(interaction);
  return interaction;
}

function onDocSignal(_ref4, signalName) {
  var doc = _ref4.doc,
      scope = _ref4.scope,
      options = _ref4.options;
  var eventMap = scope.Interaction.eventMap;

  var eventMethod = signalName.indexOf('add') === 0 ? events.add : events.remove;

  // delegate event listener
  for (var eventType in events.delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener);
    eventMethod(doc, eventType, events.delegateUseCapture, true);
  }

  var eventOptions = options && options.events;

  for (var _eventType in eventMap) {
    eventMethod(doc, _eventType, eventMap[_eventType], eventOptions);
  }
}

module.exports = {
  init: init,
  onDocSignal: onDocSignal,
  doOnInteractions: doOnInteractions,
  newInteraction: newInteraction,
  methodNames: methodNames
};

},{"./Interaction":5,"./utils/Signals":33,"./utils/browser":35,"./utils/domObjects":37,"./utils/events":39,"./utils/interactionFinder":44,"./utils/pointerUtils":48}],20:[function(_dereq_,module,exports){
'use strict';

var extend = _dereq_('../utils/extend');

function init(scope) {
  var InteractEvent = scope.InteractEvent,
      Interaction = scope.Interaction;


  scope.modifiers = { names: [] };

  Interaction.signals.on('new', function (interaction) {
    interaction.startOffset = { left: 0, right: 0, top: 0, bottom: 0 };
    interaction.modifierOffsets = {};
    interaction.modifierStatuses = resetStatuses({}, scope.modifiers);
    interaction.modifierResult = null;
  });

  Interaction.signals.on('action-start', function (arg) {
    return start(arg, scope.modifiers, arg.interaction.startCoords.page);
  });

  Interaction.signals.on('action-resume', function (arg) {
    beforeMove(arg, scope.modifiers);
    start(arg, scope.modifiers, arg.interaction.curCoords.page);
  });

  Interaction.signals.on('before-action-move', function (arg) {
    return beforeMove(arg, scope.modifiers);
  });
  Interaction.signals.on('action-end', function (arg) {
    return beforeEnd(arg, scope.modifiers);
  });

  InteractEvent.signals.on('set-xy', function (arg) {
    return setXY(arg, scope.modifiers);
  });
}

function setOffsets(arg, modifiers) {
  var interaction = arg.interaction,
      page = arg.pageCoords;
  var target = interaction.target,
      element = interaction.element,
      startOffset = interaction.startOffset;

  var rect = target.getRect(element);

  if (rect) {
    startOffset.left = page.x - rect.left;
    startOffset.top = page.y - rect.top;

    startOffset.right = rect.right - page.x;
    startOffset.bottom = rect.bottom - page.y;

    if (!('width' in rect)) {
      rect.width = rect.right - rect.left;
    }
    if (!('height' in rect)) {
      rect.height = rect.bottom - rect.top;
    }
  } else {
    startOffset.left = startOffset.top = startOffset.right = startOffset.bottom = 0;
  }

  arg.rect = rect;
  arg.interactable = target;
  arg.element = element;

  for (var _i = 0; _i < modifiers.names.length; _i++) {
    var _ref;

    _ref = modifiers.names[_i];
    var modifierName = _ref;

    arg.options = target.options[interaction.prepared.name][modifierName];

    if (!arg.options) {
      continue;
    }

    interaction.modifierOffsets[modifierName] = modifiers[modifierName].setOffset(arg);
  }
}

function setAll(arg, modifiers) {
  var interaction = arg.interaction,
      statuses = arg.statuses,
      preEnd = arg.preEnd,
      requireEndOnly = arg.requireEndOnly;

  var result = {
    dx: 0,
    dy: 0,
    changed: false,
    locked: false,
    shouldMove: true
  };

  arg.modifiedCoords = extend({}, arg.pageCoords);

  for (var _i2 = 0; _i2 < modifiers.names.length; _i2++) {
    var _ref2;

    _ref2 = modifiers.names[_i2];
    var modifierName = _ref2;

    var modifier = modifiers[modifierName];
    var options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!shouldDo(options, preEnd, requireEndOnly)) {
      continue;
    }

    arg.status = arg.status = statuses[modifierName];
    arg.options = options;
    arg.offset = arg.interaction.modifierOffsets[modifierName];

    modifier.set(arg);

    if (arg.status.locked) {
      arg.modifiedCoords.x += arg.status.dx;
      arg.modifiedCoords.y += arg.status.dy;

      result.dx += arg.status.dx;
      result.dy += arg.status.dy;

      result.locked = true;
    }
  }

  // a move should be fired if:
  //  - there are no modifiers enabled,
  //  - no modifiers are "locked" i.e. have changed the pointer's coordinates, or
  //  - the locked coords have changed since the last pointer move
  result.shouldMove = !arg.status || !result.locked || arg.status.changed;

  return result;
}

function resetStatuses(statuses, modifiers) {
  for (var _i3 = 0; _i3 < modifiers.names.length; _i3++) {
    var _ref3;

    _ref3 = modifiers.names[_i3];
    var modifierName = _ref3;

    var status = statuses[modifierName] || {};

    status.dx = status.dy = 0;
    status.modifiedX = status.modifiedY = NaN;
    status.locked = false;
    status.changed = true;

    statuses[modifierName] = status;
  }

  return statuses;
}

function start(_ref4, modifiers, pageCoords) {
  var interaction = _ref4.interaction;

  var arg = {
    interaction: interaction,
    pageCoords: pageCoords,
    startOffset: interaction.startOffset,
    statuses: interaction.modifierStatuses,
    preEnd: false,
    requireEndOnly: false
  };

  setOffsets(arg, modifiers);
  resetStatuses(arg.statuses, modifiers);

  arg.pageCoords = extend({}, interaction.startCoords.page);
  interaction.modifierResult = setAll(arg, modifiers);
}

function beforeMove(_ref5, modifiers) {
  var interaction = _ref5.interaction,
      preEnd = _ref5.preEnd,
      interactingBeforeMove = _ref5.interactingBeforeMove;

  var modifierResult = setAll({
    interaction: interaction,
    preEnd: preEnd,
    pageCoords: interaction.curCoords.page,
    statuses: interaction.modifierStatuses,
    requireEndOnly: false
  }, modifiers);

  interaction.modifierResult = modifierResult;

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interactingBeforeMove) {
    return false;
  }
}

function beforeEnd(_ref6, modifiers) {
  var interaction = _ref6.interaction,
      event = _ref6.event;

  for (var _i4 = 0; _i4 < modifiers.names.length; _i4++) {
    var _ref7;

    _ref7 = modifiers.names[_i4];
    var modifierName = _ref7;

    var options = interaction.target.options[interaction.prepared.name][modifierName];

    // if the endOnly option is true for any modifier
    if (shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.doMove({ event: event, preEnd: true });
      break;
    }
  }
}

function setXY(arg, modifiers) {
  var iEvent = arg.iEvent,
      interaction = arg.interaction;

  var modifierArg = extend({}, arg);

  for (var i = 0; i < modifiers.names.length; i++) {
    var modifierName = modifiers.names[i];
    modifierArg.options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!modifierArg.options) {
      continue;
    }

    var modifier = modifiers[modifierName];

    modifierArg.status = interaction.modifierStatuses[modifierName];

    iEvent[modifierName] = modifier.modifyCoords(modifierArg);
  }
}

function shouldDo(options, preEnd, requireEndOnly) {
  return options && options.enabled && (preEnd || !options.endOnly) && (!requireEndOnly || options.endOnly);
}

module.exports = {
  init: init,
  setOffsets: setOffsets,
  setAll: setAll,
  resetStatuses: resetStatuses,
  start: start,
  beforeMove: beforeMove,
  beforeEnd: beforeEnd,
  shouldDo: shouldDo
};

},{"../utils/extend":40}],21:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('../utils/is');
var extend = _dereq_('../utils/extend');
var rectUtils = _dereq_('../utils/rect');

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.restrict = module.exports;
  modifiers.names.push('restrict');

  defaults.perAction.restrict = module.exports.defaults;
}

function setOffset(_ref) {
  var rect = _ref.rect,
      startOffset = _ref.startOffset,
      options = _ref.options;

  var elementRect = options && options.elementRect;
  var offset = {};

  if (rect && elementRect) {
    offset.left = startOffset.left - rect.width * elementRect.left;
    offset.top = startOffset.top - rect.height * elementRect.top;

    offset.right = startOffset.right - rect.width * (1 - elementRect.right);
    offset.bottom = startOffset.bottom - rect.height * (1 - elementRect.bottom);
  } else {
    offset.left = offset.top = offset.right = offset.bottom = 0;
  }

  return offset;
}

function set(_ref2) {
  var modifiedCoords = _ref2.modifiedCoords,
      interaction = _ref2.interaction,
      status = _ref2.status,
      options = _ref2.options;

  if (!options) {
    return status;
  }

  var page = extend({}, modifiedCoords);

  var restriction = getRestrictionRect(options.restriction, interaction, page);

  if (!restriction) {
    return status;
  }

  status.dx = 0;
  status.dy = 0;
  status.locked = false;

  var rect = restriction;
  var modifiedX = page.x;
  var modifiedY = page.y;

  var offset = interaction.modifierOffsets.restrict;

  // object is assumed to have
  // x, y, width, height or
  // left, top, right, bottom
  if ('x' in restriction && 'y' in restriction) {
    modifiedX = Math.max(Math.min(rect.x + rect.width - offset.right, page.x), rect.x + offset.left);
    modifiedY = Math.max(Math.min(rect.y + rect.height - offset.bottom, page.y), rect.y + offset.top);
  } else {
    modifiedX = Math.max(Math.min(rect.right - offset.right, page.x), rect.left + offset.left);
    modifiedY = Math.max(Math.min(rect.bottom - offset.bottom, page.y), rect.top + offset.top);
  }

  status.dx = modifiedX - page.x;
  status.dy = modifiedY - page.y;

  status.changed = status.modifiedX !== modifiedX || status.modifiedY !== modifiedY;
  status.locked = !!(status.dx || status.dy);

  status.modifiedX = modifiedX;
  status.modifiedY = modifiedY;
}

function modifyCoords(_ref3) {
  var page = _ref3.page,
      client = _ref3.client,
      status = _ref3.status,
      phase = _ref3.phase,
      options = _ref3.options;

  var elementRect = options && options.elementRect;

  if (options && options.enabled && !(phase === 'start' && elementRect && status.locked)) {

    if (status.locked) {
      page.x += status.dx;
      page.y += status.dy;
      client.x += status.dx;
      client.y += status.dy;

      return {
        dx: status.dx,
        dy: status.dy
      };
    }
  }
}

function getRestrictionRect(value, interaction, page) {
  if (is.function(value)) {
    return rectUtils.resolveRectLike(value, interaction.target, interaction.element, [page.x, page.y, interaction]);
  } else {
    return rectUtils.resolveRectLike(value, interaction.target, interaction.element);
  }
}

module.exports = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  getRestrictionRect: getRestrictionRect,
  defaults: {
    enabled: false,
    endOnly: false,
    restriction: null,
    elementRect: null
  }
};

},{"../utils/extend":40,"../utils/is":45,"../utils/rect":50}],22:[function(_dereq_,module,exports){
'use strict';

// This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// });

var extend = _dereq_('../utils/extend');
var rectUtils = _dereq_('../utils/rect');
var restrict = _dereq_('./restrict');

var getRestrictionRect = restrict.getRestrictionRect;

var noInner = { top: +Infinity, left: +Infinity, bottom: -Infinity, right: -Infinity };
var noOuter = { top: -Infinity, left: -Infinity, bottom: +Infinity, right: +Infinity };

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults,
      actions = scope.actions;
  var resize = actions.resize;


  modifiers.restrictEdges = module.exports;
  modifiers.names.push('restrictEdges');

  defaults.perAction.restrictEdges = module.exports.defaults;
  resize.defaults.restrictEdges = module.exports.defaults;
}

function setOffset(_ref) {
  var interaction = _ref.interaction,
      options = _ref.options;

  var startOffset = interaction.startOffset;
  var offset = void 0;

  if (options) {
    var offsetRect = getRestrictionRect(options.offset, interaction, interaction.startCoords.page);

    offset = rectUtils.rectToXY(offsetRect);
  }

  offset = offset || { x: 0, y: 0 };

  return {
    top: offset.y + startOffset.top,
    left: offset.x + startOffset.left,
    bottom: offset.y - startOffset.bottom,
    right: offset.x - startOffset.right
  };
}

function set(_ref2) {
  var modifiedCoords = _ref2.modifiedCoords,
      interaction = _ref2.interaction,
      status = _ref2.status,
      offset = _ref2.offset,
      options = _ref2.options;

  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges) {
    return;
  }

  var page = extend({}, modifiedCoords);
  var inner = getRestrictionRect(options.inner, interaction, page) || {};
  var outer = getRestrictionRect(options.outer, interaction, page) || {};

  fixRect(inner, noInner);
  fixRect(outer, noOuter);

  var modifiedX = page.x;
  var modifiedY = page.y;

  status.dx = 0;
  status.dy = 0;
  status.locked = false;

  if (edges.top) {
    modifiedY = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
  } else if (edges.bottom) {
    modifiedY = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
  }
  if (edges.left) {
    modifiedX = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
  } else if (edges.right) {
    modifiedX = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
  }

  status.dx = modifiedX - page.x;
  status.dy = modifiedY - page.y;

  status.changed = status.modifiedX !== modifiedX || status.modifiedY !== modifiedY;
  status.locked = !!(status.dx || status.dy);

  status.modifiedX = modifiedX;
  status.modifiedY = modifiedY;
}

function modifyCoords(_ref3) {
  var page = _ref3.page,
      client = _ref3.client,
      status = _ref3.status,
      phase = _ref3.phase,
      options = _ref3.options;

  if (options && options.enabled && phase !== 'start') {

    if (status.locked) {
      page.x += status.dx;
      page.y += status.dy;
      client.x += status.dx;
      client.y += status.dy;

      return {
        dx: status.dx,
        dy: status.dy
      };
    }
  }
}

function fixRect(rect, defaults) {
  var _arr = ['top', 'left', 'bottom', 'right'];

  for (var _i = 0; _i < _arr.length; _i++) {
    var edge = _arr[_i];
    if (!(edge in rect)) {
      rect[edge] = defaults[edge];
    }
  }

  return rect;
}

module.exports = {
  init: init,
  noInner: noInner,
  noOuter: noOuter,
  getRestrictionRect: getRestrictionRect,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    inner: null,
    outer: null,
    offset: null
  }
};

},{"../utils/extend":40,"../utils/rect":50,"./restrict":21}],23:[function(_dereq_,module,exports){
'use strict';

// This module adds the options.resize.restrictSize setting which sets min and
// max width and height for the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictSize: {
//     min: { width: -600, height: -600 },
//     max: { width:  600, height:  600 },
//   },
// });

var extend = _dereq_('../utils/extend');
var rectUtils = _dereq_('../utils/rect');
var restrictEdges = _dereq_('./restrictEdges');

var noMin = { width: -Infinity, height: -Infinity };
var noMax = { width: +Infinity, height: +Infinity };

function init(scope) {
  var actions = scope.actions,
      modifiers = scope.modifiers,
      defaults = scope.defaults;
  var resize = actions.resize;


  modifiers.restrictSize = module.exports;
  modifiers.names.push('restrictSize');

  defaults.perAction.restrictSize = module.exports.defaults;
  resize.defaults.restrictSize = module.exports.defaults;
}

function setOffset(_ref) {
  var interaction = _ref.interaction;

  return restrictEdges.setOffset({ interaction: interaction });
}

function set(arg) {
  var interaction = arg.interaction,
      options = arg.options;

  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges) {
    return;
  }

  var rect = rectUtils.xywhToTlbr(interaction.resizeRects.inverted);

  var minSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.min, interaction)) || noMin;
  var maxSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.max, interaction)) || noMax;

  arg.options = {
    enabled: options.enabled,
    endOnly: options.endOnly,
    inner: extend({}, restrictEdges.noInner),
    outer: extend({}, restrictEdges.noOuter)
  };

  if (edges.top) {
    arg.options.inner.top = rect.bottom - minSize.height;
    arg.options.outer.top = rect.bottom - maxSize.height;
  } else if (edges.bottom) {
    arg.options.inner.bottom = rect.top + minSize.height;
    arg.options.outer.bottom = rect.top + maxSize.height;
  }
  if (edges.left) {
    arg.options.inner.left = rect.right - minSize.width;
    arg.options.outer.left = rect.right - maxSize.width;
  } else if (edges.right) {
    arg.options.inner.right = rect.left + minSize.width;
    arg.options.outer.right = rect.left + maxSize.width;
  }

  restrictEdges.set(arg);
}

module.exports = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: restrictEdges.modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    min: null,
    max: null
  }
};

},{"../utils/extend":40,"../utils/rect":50,"./restrictEdges":22}],24:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('../utils');

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.snap = module.exports;
  modifiers.names.push('snap');

  defaults.perAction.snap = module.exports.defaults;
}

function setOffset(_ref) {
  var interaction = _ref.interaction,
      interactable = _ref.interactable,
      element = _ref.element,
      rect = _ref.rect,
      startOffset = _ref.startOffset,
      options = _ref.options;

  var offsets = [];
  var optionsOrigin = utils.rect.rectToXY(utils.rect.resolveRectLike(options.origin));
  var origin = optionsOrigin || utils.getOriginXY(interactable, element, interaction.prepared.name);
  options = options || interactable.options[interaction.prepared.name].snap || {};

  var snapOffset = void 0;

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.startCoords.page.x - origin.x,
      y: interaction.startCoords.page.y - origin.y
    };
  } else {
    var offsetRect = utils.rect.resolveRectLike(options.offset, interactable, element, [interaction]);

    snapOffset = utils.rect.rectToXY(offsetRect) || { x: 0, y: 0 };
  }

  if (rect && options.relativePoints && options.relativePoints.length) {
    for (var _i = 0; _i < (options.relativePoints || []).length; _i++) {
      var _ref3;

      _ref3 = (options.relativePoints || [])[_i];
      var _ref2 = _ref3;
      var relativeX = _ref2.x;
      var relativeY = _ref2.y;

      offsets.push({
        x: startOffset.left - rect.width * relativeX + snapOffset.x,
        y: startOffset.top - rect.height * relativeY + snapOffset.y
      });
    }
  } else {
    offsets.push(snapOffset);
  }

  return offsets;
}

function set(_ref4) {
  var interaction = _ref4.interaction,
      modifiedCoords = _ref4.modifiedCoords,
      status = _ref4.status,
      options = _ref4.options,
      offsets = _ref4.offset;

  var origin = utils.getOriginXY(interaction.target, interaction.element, interaction.prepared.name);
  var page = utils.extend({}, modifiedCoords);
  var targets = [];
  var target = void 0;
  var i = void 0;

  page.x -= origin.x;
  page.y -= origin.y;

  status.realX = page.x;
  status.realY = page.y;

  var len = options.targets ? options.targets.length : 0;

  for (var _i2 = 0; _i2 < offsets.length; _i2++) {
    var _ref6;

    _ref6 = offsets[_i2];
    var _ref5 = _ref6;
    var offsetX = _ref5.x;
    var offsetY = _ref5.y;

    var relativeX = page.x - offsetX;
    var relativeY = page.y - offsetY;

    for (var _i3 = 0; _i3 < options.targets.length; _i3++) {
      var _ref7;

      _ref7 = options.targets[_i3];
      var snapTarget = _ref7;

      if (utils.is.function(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction);
      } else {
        target = snapTarget;
      }

      if (!target) {
        continue;
      }

      targets.push({
        x: utils.is.number(target.x) ? target.x + offsetX : relativeX,
        y: utils.is.number(target.y) ? target.y + offsetY : relativeY,

        range: utils.is.number(target.range) ? target.range : options.range
      });
    }
  }

  var closest = {
    target: null,
    inRange: false,
    distance: 0,
    range: 0,
    dx: 0,
    dy: 0
  };

  for (i = 0, len = targets.length; i < len; i++) {
    target = targets[i];

    var range = target.range;
    var dx = target.x - page.x;
    var dy = target.y - page.y;
    var distance = utils.hypot(dx, dy);
    var inRange = distance <= range;

    // Infinite targets count as being out of range
    // compared to non infinite ones that are in range
    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false;
    }

    if (!closest.target || (inRange
    // is the closest target in range?
    ? closest.inRange && range !== Infinity
    // the pointer is relatively deeper in this target
    ? distance / range < closest.distance / closest.range
    // this target has Infinite range and the closest doesn't
    : range === Infinity && closest.range !== Infinity ||
    // OR this target is closer that the previous closest
    distance < closest.distance :
    // The other is not in range and the pointer is closer to this target
    !closest.inRange && distance < closest.distance)) {

      closest.target = target;
      closest.distance = distance;
      closest.range = range;
      closest.inRange = inRange;
      closest.dx = dx;
      closest.dy = dy;

      status.range = range;
    }
  }

  var snapChanged = void 0;

  if (closest.target) {
    snapChanged = status.modifiedX !== closest.target.x || status.modifiedY !== closest.target.y;

    status.modifiedX = closest.target.x;
    status.modifiedY = closest.target.y;
  } else {
    snapChanged = true;

    status.modifiedX = NaN;
    status.modifiedY = NaN;
  }

  status.dx = closest.dx;
  status.dy = closest.dy;

  status.changed = snapChanged || closest.inRange && !status.locked;
  status.locked = closest.inRange;
}

function modifyCoords(_ref8) {
  var page = _ref8.page,
      client = _ref8.client,
      status = _ref8.status,
      phase = _ref8.phase,
      options = _ref8.options;

  var relativePoints = options && options.relativePoints;

  if (options && options.enabled && !(phase === 'start' && relativePoints && relativePoints.length)) {

    if (status.locked) {
      page.x += status.dx;
      page.y += status.dy;
      client.x += status.dx;
      client.y += status.dy;
    }

    return {
      range: status.range,
      locked: status.locked,
      x: status.modifiedX,
      y: status.modifiedY,
      realX: status.realX,
      realY: status.realY,
      dx: status.dx,
      dy: status.dy
    };
  }
}

module.exports = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    range: Infinity,
    targets: null,
    offsets: null,

    relativePoints: null
  }
};

},{"../utils":43}],25:[function(_dereq_,module,exports){
'use strict';

// This module allows snapping of the size of targets during resize
// interactions.

var extend = _dereq_('../utils/extend');
var is = _dereq_('../utils/is');
var snap = _dereq_('./snap');

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults,
      actions = scope.actions;


  modifiers.snapSize = module.exports;
  modifiers.names.push('snapSize');

  defaults.perAction.snapSize = module.exports.defaults;
  actions.resize.defaults.snapSize = module.exports.defaults;
}

function setOffset(arg) {
  var interaction = arg.interaction,
      options = arg.options;

  var edges = interaction.prepared.edges;

  if (!edges) {
    return;
  }

  arg.options = {
    relativePoints: [{
      x: edges.left ? 0 : 1,
      y: edges.top ? 0 : 1
    }],
    origin: { x: 0, y: 0 },
    offset: 'self',
    range: options.range
  };

  var offsets = snap.setOffset(arg);
  arg.options = options;

  return offsets;
}

function set(arg) {
  var interaction = arg.interaction,
      options = arg.options,
      offset = arg.offset,
      modifiedCoords = arg.modifiedCoords;

  var page = extend({}, modifiedCoords);
  var relativeX = page.x - offset[0].x;
  var relativeY = page.y - offset[0].y;

  arg.options = extend({}, options);
  arg.options.targets = [];

  for (var _i = 0; _i < (options.targets || []).length; _i++) {
    var _ref;

    _ref = (options.targets || [])[_i];
    var snapTarget = _ref;

    var target = void 0;

    if (is.function(snapTarget)) {
      target = snapTarget(relativeX, relativeY, interaction);
    } else {
      target = snapTarget;
    }

    if (!target) {
      continue;
    }

    if ('width' in target && 'height' in target) {
      target.x = target.width;
      target.y = target.height;
    }

    arg.options.targets.push(target);
  }

  snap.set(arg);
}

function modifyCoords(arg) {
  var options = arg.options;


  arg.options = extend({}, options);
  arg.options.enabled = options.enabled;
  arg.options.relativePoints = [null];

  snap.modifyCoords(arg);
}

module.exports = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    range: Infinity,
    targets: null,
    offsets: null
  }
};

},{"../utils/extend":40,"../utils/is":45,"./snap":24}],26:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var pointerUtils = _dereq_('../utils/pointerUtils');

module.exports = function () {
  /** */
  function PointerEvent(type, pointer, event, eventTarget, interaction) {
    _classCallCheck(this, PointerEvent);

    pointerUtils.pointerExtend(this, event);

    if (event !== pointer) {
      pointerUtils.pointerExtend(this, pointer);
    }

    this.interaction = interaction;

    this.timeStamp = new Date().getTime();
    this.originalEvent = event;
    this.type = type;
    this.pointerId = pointerUtils.getPointerId(pointer);
    this.pointerType = pointerUtils.getPointerType(pointer);
    this.target = eventTarget;
    this.currentTarget = null;

    if (type === 'tap') {
      var pointerIndex = interaction.getPointerIndex(pointer);
      this.dt = this.timeStamp - interaction.downTimes[pointerIndex];

      var interval = this.timeStamp - interaction.tapTime;

      this.double = !!(interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === this.target && interval < 500);
    } else if (type === 'doubletap') {
      this.dt = pointer.timeStamp - interaction.tapTime;
    }
  }

  PointerEvent.prototype.subtractOrigin = function subtractOrigin(_ref) {
    var originX = _ref.x,
        originY = _ref.y;

    this.pageX -= originX;
    this.pageY -= originY;
    this.clientX -= originX;
    this.clientY -= originY;

    return this;
  };

  PointerEvent.prototype.addOrigin = function addOrigin(_ref2) {
    var originX = _ref2.x,
        originY = _ref2.y;

    this.pageX += originX;
    this.pageY += originY;
    this.clientX += originX;
    this.clientY += originY;

    return this;
  };

  /** */


  PointerEvent.prototype.preventDefault = function preventDefault() {
    this.originalEvent.preventDefault();
  };

  /** */


  PointerEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  /** */


  PointerEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  return PointerEvent;
}();

},{"../utils/pointerUtils":48}],27:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('../utils');
var PointerEvent = _dereq_('./PointerEvent');

var signals = utils.Signals.new();
var simpleSignals = ['down', 'up', 'cancel'];
var simpleEvents = ['down', 'up', 'cancel'];

var pointerEvents = module.exports = {
  init: init,
  signals: signals,
  PointerEvent: PointerEvent,
  fire: fire,
  collectEventTargets: collectEventTargets,
  createSignalListener: createSignalListener,
  defaults: {
    holdDuration: 600,
    ignoreFrom: null,
    allowFrom: null,
    origin: { x: 0, y: 0 }
  },
  types: ['down', 'move', 'up', 'cancel', 'tap', 'doubletap', 'hold']
};

function fire(arg) {
  var interaction = arg.interaction,
      pointer = arg.pointer,
      event = arg.event,
      eventTarget = arg.eventTarget,
      _arg$type = arg.type,
      type = _arg$type === undefined ? arg.pointerEvent.type : _arg$type,
      _arg$targets = arg.targets,
      targets = _arg$targets === undefined ? collectEventTargets(arg) : _arg$targets,
      _arg$pointerEvent = arg.pointerEvent,
      pointerEvent = _arg$pointerEvent === undefined ? new PointerEvent(type, pointer, event, eventTarget, interaction) : _arg$pointerEvent;


  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    targets: targets,
    type: type,
    pointerEvent: pointerEvent
  };

  for (var i = 0; i < targets.length; i++) {
    var target = targets[i];

    for (var prop in target.props || {}) {
      pointerEvent[prop] = target.props[prop];
    }

    var origin = utils.getOriginXY(target.eventable, target.element);

    pointerEvent.subtractOrigin(origin);
    pointerEvent.eventable = target.eventable;
    pointerEvent.currentTarget = target.element;

    target.eventable.fire(pointerEvent);

    pointerEvent.addOrigin(origin);

    if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].element !== pointerEvent.currentTarget) {
      break;
    }
  }

  signals.fire('fired', signalArg);

  if (type === 'tap') {
    // if pointerEvent should make a double tap, create and fire a doubletap
    // PointerEvent and use that as the prevTap
    var prevTap = pointerEvent.double ? fire({
      interaction: interaction, pointer: pointer, event: event, eventTarget: eventTarget,
      type: 'doubletap'
    }) : pointerEvent;

    interaction.prevTap = prevTap;
    interaction.tapTime = prevTap.timeStamp;
  }

  return pointerEvent;
}

function collectEventTargets(_ref) {
  var interaction = _ref.interaction,
      pointer = _ref.pointer,
      event = _ref.event,
      eventTarget = _ref.eventTarget,
      type = _ref.type;

  var pointerIndex = interaction.getPointerIndex(pointer);

  // do not fire a tap event if the pointer was moved before being lifted
  if (type === 'tap' && (interaction.pointerWasMoved
  // or if the pointerup target is different to the pointerdown target
  || !(interaction.downTargets[pointerIndex] && interaction.downTargets[pointerIndex] === eventTarget))) {
    return [];
  }

  var path = utils.dom.getPath(eventTarget);
  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    type: type,
    path: path,
    targets: [],
    element: null
  };

  for (var _i = 0; _i < path.length; _i++) {
    var _ref2;

    _ref2 = path[_i];
    var element = _ref2;

    signalArg.element = element;

    signals.fire('collect-targets', signalArg);
  }

  if (type === 'hold') {
    signalArg.targets = signalArg.targets.filter(function (target) {
      return target.eventable.options.holdDuration === interaction.holdTimers[pointerIndex].duration;
    });
  }

  return signalArg.targets;
}

function init(scope) {
  var Interaction = scope.Interaction;


  scope.pointerEvents = pointerEvents;
  scope.defaults.pointerEvents = pointerEvents.defaults;

  Interaction.signals.on('new', function (interaction) {
    interaction.prevTap = null; // the most recent tap event on this interaction
    interaction.tapTime = 0; // time of the most recent tap event
    interaction.holdTimers = []; // [{ duration, timeout }]
  });

  Interaction.signals.on('update-pointer-down', function (_ref3) {
    var interaction = _ref3.interaction,
        pointerIndex = _ref3.pointerIndex;

    interaction.holdTimers[pointerIndex] = { duration: Infinity, timeout: null };
  });

  Interaction.signals.on('remove-pointer', function (_ref4) {
    var interaction = _ref4.interaction,
        pointerIndex = _ref4.pointerIndex;

    interaction.holdTimers.splice(pointerIndex, 1);
  });

  Interaction.signals.on('move', function (_ref5) {
    var interaction = _ref5.interaction,
        pointer = _ref5.pointer,
        event = _ref5.event,
        eventTarget = _ref5.eventTarget,
        duplicateMove = _ref5.duplicateMove;

    var pointerIndex = interaction.getPointerIndex(pointer);

    if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearTimeout(interaction.holdTimers[pointerIndex].timeout);
      }

      fire({
        interaction: interaction, pointer: pointer, event: event, eventTarget: eventTarget,
        type: 'move'
      });
    }
  });

  Interaction.signals.on('down', function (_ref6) {
    var interaction = _ref6.interaction,
        pointer = _ref6.pointer,
        event = _ref6.event,
        eventTarget = _ref6.eventTarget,
        pointerIndex = _ref6.pointerIndex;

    var timer = interaction.holdTimers[pointerIndex];
    var path = utils.dom.getPath(eventTarget);
    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'hold',
      targets: [],
      path: path,
      element: null
    };

    for (var _i2 = 0; _i2 < path.length; _i2++) {
      var _ref7;

      _ref7 = path[_i2];
      var element = _ref7;

      signalArg.element = element;

      signals.fire('collect-targets', signalArg);
    }

    if (!signalArg.targets.length) {
      return;
    }

    var minDuration = Infinity;

    for (var _i3 = 0; _i3 < signalArg.targets.length; _i3++) {
      var _ref8;

      _ref8 = signalArg.targets[_i3];
      var target = _ref8;

      var holdDuration = target.eventable.options.holdDuration;

      if (holdDuration < minDuration) {
        minDuration = holdDuration;
      }
    }

    timer.duration = minDuration;
    timer.timeout = setTimeout(function () {
      fire({
        interaction: interaction,
        eventTarget: eventTarget,
        pointer: pointer,
        event: event,
        type: 'hold'
      });
    }, minDuration);
  });

  Interaction.signals.on('up', function (_ref9) {
    var interaction = _ref9.interaction,
        pointer = _ref9.pointer,
        event = _ref9.event,
        eventTarget = _ref9.eventTarget;

    if (!interaction.pointerWasMoved) {
      fire({ interaction: interaction, eventTarget: eventTarget, pointer: pointer, event: event, type: 'tap' });
    }
  });

  var _arr = ['up', 'cancel'];
  for (var _i4 = 0; _i4 < _arr.length; _i4++) {
    var signalName = _arr[_i4];
    Interaction.signals.on(signalName, function (_ref10) {
      var interaction = _ref10.interaction,
          pointerIndex = _ref10.pointerIndex;

      if (interaction.holdTimers[pointerIndex]) {
        clearTimeout(interaction.holdTimers[pointerIndex].timeout);
      }
    });
  }

  for (var i = 0; i < simpleSignals.length; i++) {
    Interaction.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
  }
}

function createSignalListener(type) {
  return function (_ref11) {
    var interaction = _ref11.interaction,
        pointer = _ref11.pointer,
        event = _ref11.event,
        eventTarget = _ref11.eventTarget;

    fire({ interaction: interaction, eventTarget: eventTarget, pointer: pointer, event: event, type: type });
  };
}

},{"../utils":43,"./PointerEvent":26}],28:[function(_dereq_,module,exports){
'use strict';

var holdRepeat = {
  init: init
};

function init(scope) {
  var pointerEvents = scope.pointerEvents,
      Interaction = scope.Interaction;


  pointerEvents.signals.on('new', onNew);
  pointerEvents.signals.on('fired', function (arg) {
    return onFired(arg, pointerEvents);
  });

  var _arr = ['move', 'up', 'cancel', 'endall'];
  for (var _i = 0; _i < _arr.length; _i++) {
    var signal = _arr[_i];
    Interaction.signals.on(signal, endHoldRepeat);
  }

  // don't repeat by default
  pointerEvents.defaults.holdRepeatInterval = 0;
  pointerEvents.types.push('holdrepeat');

  pointerEvents.holdRepeat = holdRepeat;
}

function onNew(_ref) {
  var pointerEvent = _ref.pointerEvent;

  if (pointerEvent.type !== 'hold') {
    return;
  }

  pointerEvent.count = (pointerEvent.count || 0) + 1;
}

function onFired(_ref2, pointerEvents) {
  var interaction = _ref2.interaction,
      pointerEvent = _ref2.pointerEvent,
      eventTarget = _ref2.eventTarget,
      targets = _ref2.targets;

  if (pointerEvent.type !== 'hold' || !targets.length) {
    return;
  }

  // get the repeat interval from the first eventable
  var interval = targets[0].eventable.options.holdRepeatInterval;

  // don't repeat if the interval is 0 or less
  if (interval <= 0) {
    return;
  }

  // set a timeout to fire the holdrepeat event
  interaction.holdIntervalHandle = setTimeout(function () {
    pointerEvents.fire({
      interaction: interaction,
      eventTarget: eventTarget,
      type: 'hold',
      pointer: pointerEvent,
      event: pointerEvent
    });
  }, interval);
}

function endHoldRepeat(_ref3) {
  var interaction = _ref3.interaction;

  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle);
    interaction.holdIntervalHandle = null;
  }
}

module.exports = holdRepeat;

},{}],29:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('../utils/is');
var extend = _dereq_('../utils/extend');

var _require = _dereq_('../utils/arr'),
    merge = _require.merge;

function init(scope) {
  var pointerEvents = scope.pointerEvents,
      Interactable = scope.Interactable;


  pointerEvents.signals.on('collect-targets', function (_ref) {
    var targets = _ref.targets,
        element = _ref.element,
        type = _ref.type,
        eventTarget = _ref.eventTarget;

    scope.interactables.forEachMatch(element, function (interactable) {
      var eventable = interactable.events;
      var options = eventable.options;

      if (eventable[type] && is.element(element) && interactable.testIgnoreAllow(options, element, eventTarget)) {

        targets.push({
          element: element,
          eventable: eventable,
          props: { interactable: interactable }
        });
      }
    });
  });

  Interactable.signals.on('new', function (_ref2) {
    var interactable = _ref2.interactable;

    interactable.events.getRect = function (element) {
      return interactable.getRect(element);
    };
  });

  Interactable.signals.on('set', function (_ref3) {
    var interactable = _ref3.interactable,
        options = _ref3.options;

    extend(interactable.events.options, pointerEvents.defaults);
    extend(interactable.events.options, options);
  });

  merge(Interactable.eventTypes, pointerEvents.types);

  Interactable.prototype.pointerEvents = function (options) {
    extend(this.events.options, options);

    return this;
  };

  var __backCompatOption = Interactable.prototype._backCompatOption;

  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    var ret = __backCompatOption.call(this, optionName, newValue);

    if (ret === this) {
      this.events.options[optionName] = newValue;
    }

    return ret;
  };

  Interactable.settingsMethods.push('pointerEvents');
}

module.exports = {
  init: init
};

},{"../utils/arr":34,"../utils/extend":40,"../utils/is":45}],30:[function(_dereq_,module,exports){
'use strict';

var Eventable = _dereq_('./Eventable');
var defaults = _dereq_('./defaultOptions');
var utils = _dereq_('./utils');
var browser = _dereq_('./utils/browser');
var events = _dereq_('./utils/events');
var Signals = _dereq_('./utils/Signals');

var _require = _dereq_('./utils/window'),
    getWindow = _require.getWindow;

var scope = {
  Signals: Signals,
  signals: new Signals(),
  browser: browser,
  events: events,
  utils: utils,
  defaults: defaults,
  Eventable: Eventable,

  // main document
  document: _dereq_('./utils/domObjects').document,
  // all documents being listened to
  documents: [/* { doc, options } */],

  addDocument: function addDocument(doc, options) {
    // do nothing if document is already known
    if (scope.getDocIndex(doc) !== -1) {
      return false;
    }

    var win = getWindow(doc);

    scope.documents.push({ doc: doc, options: options });
    events.documents.push(doc);

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== scope.document) {
      events.add(win, 'unload', scope.onWindowUnload);
    }

    scope.signals.fire('add-document', { doc: doc, win: win, scope: scope, options: options });
  },
  removeDocument: function removeDocument(doc) {
    var index = scope.getDocIndex(doc);

    var win = getWindow(doc);
    var options = scope.documents[index].options;

    events.remove(win, 'unload', scope.onWindowUnload);

    scope.documents.splice(index, 1);
    events.documents.splice(index, 1);

    scope.signals.fire('remove-document', { doc: doc, win: win, scope: scope, options: options });
  },
  onWindowUnload: function onWindowUnload(event) {
    scope.removeDocument(event.target.document);
  },
  getDocIndex: function getDocIndex(doc) {
    for (var i = 0; i < scope.documents.length; i++) {
      if (scope.documents[i].doc === doc) {
        return i;
      }
    }

    return -1;
  }
};

module.exports = scope;

},{"./Eventable":2,"./defaultOptions":15,"./utils":43,"./utils/Signals":33,"./utils/browser":35,"./utils/domObjects":37,"./utils/events":39,"./utils/window":53}],31:[function(_dereq_,module,exports){
'use strict';

function init(scope) {
  var Interaction = scope.Interaction;


  Interaction.signals.on('new', function (interaction) {
    interaction.simulations = {};
  });
}

module.exports = {
  init: init
};

},{}],32:[function(_dereq_,module,exports){
'use strict';

var modifiers = _dereq_('../modifiers/base');
var utils = _dereq_('../utils');
var raf = _dereq_('../utils/raf');

function init(scope) {
  var Interaction = scope.Interaction,
      defaults = scope.defaults;


  Interaction.signals.on('new', function (interaction) {
    interaction.simulations.inertia = {
      active: false,
      smoothEnd: false,
      allowResume: false,

      startEvent: null,
      upCoords: {},

      xe: 0, ye: 0,
      sx: 0, sy: 0,

      t0: 0,
      vx0: 0, vys: 0,
      duration: 0,

      lambda_v0: 0,
      one_ve_v0: 0,
      i: null
    };
  });

  Interaction.signals.on('up', function (arg) {
    return release(arg, scope);
  });
  Interaction.signals.on('down', function (arg) {
    return resume(arg, scope);
  });
  Interaction.signals.on('stop', function (arg) {
    return stop(arg, scope);
  });

  defaults.perAction.inertia = {
    enabled: false,
    resistance: 10, // the lambda in exponential decay
    minSpeed: 100, // target speed must be above this for inertia to start
    endSpeed: 10, // the speed at which inertia is slow enough to stop
    allowResume: true, // allow resuming an action in inertia phase
    smoothEndDuration: 300 // animate to snap/restrict endOnly if there's no inertia
  };
}

function resume(_ref, scope) {
  var interaction = _ref.interaction,
      event = _ref.event,
      pointer = _ref.pointer,
      eventTarget = _ref.eventTarget;

  var status = interaction.simulations.inertia;

  // Check if the down event hits the current inertia target
  if (status.active) {
    var element = eventTarget;

    // climb up the DOM tree from the event target
    while (utils.is.element(element)) {

      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        raf.cancel(status.i);
        status.active = false;
        interaction.simulation = null;

        // update pointers to the down event's coordinates
        interaction.updatePointer(pointer, event, eventTarget, true);
        utils.pointer.setCoords(interaction.curCoords, interaction.pointers);

        // fire appropriate signals
        var signalArg = {
          interaction: interaction,
          iEvent: resumeEvent
        };

        scope.Interaction.signals.fire('action-resume', signalArg);

        // fire a reume event
        var resumeEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'inertiaresume', interaction.element);

        interaction.target.fire(resumeEvent);
        interaction.prevEvent = resumeEvent;
        modifiers.resetStatuses(interaction.modifierStatuses, scope.modifiers);

        utils.pointer.copyCoords(interaction.prevCoords, interaction.curCoords);
        break;
      }

      element = utils.dom.parentNode(element);
    }
  }
}

function release(_ref2, scope) {
  var interaction = _ref2.interaction,
      event = _ref2.event;

  var status = interaction.simulations.inertia;

  if (!interaction.interacting() || interaction.simulation && interaction.simulation.active) {
    return;
  }

  var options = getOptions(interaction);

  var now = new Date().getTime();
  var pointerSpeed = interaction.pointerDelta.client.speed;

  var smoothEnd = false;
  var modifierResult = void 0;

  // check if inertia should be started
  var inertiaPossible = options && options.enabled && interaction.prepared.name !== 'gesture' && event !== status.startEvent;

  var inertia = inertiaPossible && now - interaction.curCoords.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;

  var modifierArg = {
    interaction: interaction,
    pageCoords: utils.extend({}, interaction.curCoords.page),
    statuses: {},
    preEnd: true,
    requireEndOnly: true
  };

  // smoothEnd
  if (inertiaPossible && !inertia) {
    modifiers.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = modifiers.setAll(modifierArg, scope.modifiers);

    if (modifierResult.shouldMove && modifierResult.locked) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) {
    return;
  }

  utils.pointer.copyCoords(status.upCoords, interaction.curCoords);

  interaction.pointers[0] = status.startEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

  status.t0 = now;

  status.active = true;
  status.allowResume = options.allowResume;
  interaction.simulation = status;

  interaction.target.fire(status.startEvent);

  if (inertia) {
    status.vx0 = interaction.pointerDelta.client.vx;
    status.vy0 = interaction.pointerDelta.client.vy;
    status.v0 = pointerSpeed;

    calcInertia(interaction, status);

    utils.extend(modifierArg.pageCoords, interaction.curCoords.page);

    modifierArg.pageCoords.x += status.xe;
    modifierArg.pageCoords.y += status.ye;

    modifiers.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = modifiers.setAll(modifierArg, scope.modifiers);

    status.modifiedXe += modifierResult.dx;
    status.modifiedYe += modifierResult.dy;

    status.i = raf.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    status.smoothEnd = true;
    status.xe = modifierResult.dx;
    status.ye = modifierResult.dy;

    status.sx = status.sy = 0;

    status.i = raf.request(function () {
      return smothEndTick(interaction);
    });
  }
}

function stop(_ref3) {
  var interaction = _ref3.interaction;

  var status = interaction.simulations.inertia;

  if (status.active) {
    raf.cancel(status.i);
    status.active = false;
    interaction.simulation = null;
  }
}

function calcInertia(interaction, status) {
  var options = getOptions(interaction);
  var lambda = options.resistance;
  var inertiaDur = -Math.log(options.endSpeed / status.v0) / lambda;

  status.x0 = interaction.prevEvent.pageX;
  status.y0 = interaction.prevEvent.pageY;
  status.t0 = status.startEvent.timeStamp / 1000;
  status.sx = status.sy = 0;

  status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
  status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
  status.te = inertiaDur;

  status.lambda_v0 = lambda / status.v0;
  status.one_ve_v0 = 1 - options.endSpeed / status.v0;
}

function inertiaTick(interaction) {
  updateInertiaCoords(interaction);
  utils.pointer.setCoordDeltas(interaction.pointerDelta, interaction.prevCoords, interaction.curCoords);

  var status = interaction.simulations.inertia;
  var options = getOptions(interaction);
  var lambda = options.resistance;
  var t = new Date().getTime() / 1000 - status.t0;

  if (t < status.te) {

    var progress = 1 - (Math.exp(-lambda * t) - status.lambda_v0) / status.one_ve_v0;

    if (status.modifiedXe === status.xe && status.modifiedYe === status.ye) {
      status.sx = status.xe * progress;
      status.sy = status.ye * progress;
    } else {
      var quadPoint = utils.getQuadraticCurvePoint(0, 0, status.xe, status.ye, status.modifiedXe, status.modifiedYe, progress);

      status.sx = quadPoint.x;
      status.sy = quadPoint.y;
    }

    interaction.doMove();

    status.i = raf.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    status.sx = status.modifiedXe;
    status.sy = status.modifiedYe;

    interaction.doMove();
    interaction.end(status.startEvent);
    status.active = false;
    interaction.simulation = null;
  }

  utils.pointer.copyCoords(interaction.prevCoords, interaction.curCoords);
}

function smothEndTick(interaction) {
  updateInertiaCoords(interaction);

  var status = interaction.simulations.inertia;
  var t = new Date().getTime() - status.t0;

  var _getOptions = getOptions(interaction),
      duration = _getOptions.smoothEndDuration;

  if (t < duration) {
    status.sx = utils.easeOutQuad(t, 0, status.xe, duration);
    status.sy = utils.easeOutQuad(t, 0, status.ye, duration);

    interaction.doMove();

    status.i = raf.request(function () {
      return smothEndTick(interaction);
    });
  } else {
    status.sx = status.xe;
    status.sy = status.ye;

    interaction.doMove();
    interaction.end(status.startEvent);

    status.smoothEnd = status.active = false;
    interaction.simulation = null;
  }
}

function updateInertiaCoords(interaction) {
  var status = interaction.simulations.inertia;

  // return if inertia isn't running
  if (!status.active) {
    return;
  }

  var pageUp = status.upCoords.page;
  var clientUp = status.upCoords.client;

  utils.pointer.setCoords(interaction.curCoords, [{
    pageX: pageUp.x + status.sx,
    pageY: pageUp.y + status.sy,
    clientX: clientUp.x + status.sx,
    clientY: clientUp.y + status.sy
  }]);
}

function getOptions(_ref4) {
  var target = _ref4.target,
      prepared = _ref4.prepared;

  return target && target.options && prepared.name && target.options[prepared.name].inertia;
}

module.exports = {
  init: init,
  calcInertia: calcInertia,
  inertiaTick: inertiaTick,
  smothEndTick: smothEndTick,
  updateInertiaCoords: updateInertiaCoords
};

},{"../modifiers/base":20,"../utils":43,"../utils/raf":49}],33:[function(_dereq_,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Signals = function () {
  function Signals() {
    _classCallCheck(this, Signals);

    this.listeners = {
      // signalName: [listeners],
    };
  }

  Signals.prototype.on = function on(name, listener) {
    if (!this.listeners[name]) {
      this.listeners[name] = [listener];
      return;
    }

    this.listeners[name].push(listener);
  };

  Signals.prototype.off = function off(name, listener) {
    if (!this.listeners[name]) {
      return;
    }

    var index = this.listeners[name].indexOf(listener);

    if (index !== -1) {
      this.listeners[name].splice(index, 1);
    }
  };

  Signals.prototype.fire = function fire(name, arg) {
    var targetListeners = this.listeners[name];

    if (!targetListeners) {
      return;
    }

    for (var _i = 0; _i < targetListeners.length; _i++) {
      var _ref;

      _ref = targetListeners[_i];
      var listener = _ref;

      if (listener(arg, name) === false) {
        return false;
      }
    }
  };

  return Signals;
}();

Signals.new = function () {
  return new Signals();
};

module.exports = Signals;

},{}],34:[function(_dereq_,module,exports){
"use strict";

function contains(array, target) {
  return array.indexOf(target) !== -1;
}

function merge(target, source) {
  for (var _i = 0; _i < source.length; _i++) {
    var _ref;

    _ref = source[_i];
    var item = _ref;

    target.push(item);
  }

  return target;
}

function from(source) {
  return module.exports.merge([], source);
}

module.exports = {
  contains: contains,
  merge: merge,
  from: from
};

},{}],35:[function(_dereq_,module,exports){
'use strict';

var _require = _dereq_('./window'),
    window = _require.window;

var is = _dereq_('./is');
var domObjects = _dereq_('./domObjects');

var Element = domObjects.Element;
var navigator = window.navigator;

var browser = {
  // Does the browser support touch input?
  supportsTouch: !!('ontouchstart' in window || is.function(window.DocumentTouch) && domObjects.document instanceof window.DocumentTouch),

  // Does the browser support PointerEvents
  supportsPointerEvent: !!domObjects.PointerEvent,

  isIOS: /iP(hone|od|ad)/.test(navigator.platform),

  // scrolling doesn't change the result of getClientRects on iOS 7
  isIOS7: /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion),

  isIe9: /MSIE 9/.test(navigator.userAgent),

  // prefix matchesSelector
  prefixedMatchesSelector: 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector',

  pEventTypes: domObjects.PointerEvent ? domObjects.PointerEvent === window.MSPointerEvent ? {
    up: 'MSPointerUp',
    down: 'MSPointerDown',
    over: 'mouseover',
    out: 'mouseout',
    move: 'MSPointerMove',
    cancel: 'MSPointerCancel'
  } : {
    up: 'pointerup',
    down: 'pointerdown',
    over: 'pointerover',
    out: 'pointerout',
    move: 'pointermove',
    cancel: 'pointercancel'
  } : null,

  // because Webkit and Opera still use 'mousewheel' event type
  wheelEvent: 'onmousewheel' in domObjects.document ? 'mousewheel' : 'wheel'

};

// Opera Mobile must be handled differently
browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && navigator.userAgent.match('Presto');

module.exports = browser;

},{"./domObjects":37,"./is":45,"./window":53}],36:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('./is');

module.exports = function clone(source) {
  var dest = {};
  for (var prop in source) {
    if (is.plainObject(source[prop])) {
      dest[prop] = clone(source[prop]);
    } else {
      dest[prop] = source[prop];
    }
  }
  return dest;
};

},{"./is":45}],37:[function(_dereq_,module,exports){
'use strict';

var domObjects = {};
var win = _dereq_('./window').window;

function blank() {}

domObjects.document = win.document;
domObjects.DocumentFragment = win.DocumentFragment || blank;
domObjects.SVGElement = win.SVGElement || blank;
domObjects.SVGSVGElement = win.SVGSVGElement || blank;
domObjects.SVGElementInstance = win.SVGElementInstance || blank;
domObjects.Element = win.Element || blank;
domObjects.HTMLElement = win.HTMLElement || domObjects.Element;

domObjects.Event = win.Event;
domObjects.Touch = win.Touch || blank;
domObjects.PointerEvent = win.PointerEvent || win.MSPointerEvent;

module.exports = domObjects;

},{"./window":53}],38:[function(_dereq_,module,exports){
'use strict';

var win = _dereq_('./window');
var browser = _dereq_('./browser');
var is = _dereq_('./is');
var domObjects = _dereq_('./domObjects');

var domUtils = {
  nodeContains: function nodeContains(parent, child) {
    while (child) {
      if (child === parent) {
        return true;
      }

      child = child.parentNode;
    }

    return false;
  },

  closest: function closest(element, selector) {
    while (is.element(element)) {
      if (domUtils.matchesSelector(element, selector)) {
        return element;
      }

      element = domUtils.parentNode(element);
    }

    return null;
  },

  parentNode: function parentNode(node) {
    var parent = node.parentNode;

    if (is.docFrag(parent)) {
      // skip past #shado-root fragments
      while ((parent = parent.host) && is.docFrag(parent)) {
        continue;
      }

      return parent;
    }

    return parent;
  },

  matchesSelector: function matchesSelector(element, selector) {
    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (win.window !== win.realWindow) {
      selector = selector.replace(/\/deep\//g, ' ');
    }

    return element[browser.prefixedMatchesSelector](selector);
  },

  // Test for the element that's "above" all other qualifiers
  indexOfDeepestElement: function indexOfDeepestElement(elements) {
    var deepestZoneParents = [];
    var dropzoneParents = [];
    var dropzone = void 0;
    var deepestZone = elements[0];
    var index = deepestZone ? 0 : -1;
    var parent = void 0;
    var child = void 0;
    var i = void 0;
    var n = void 0;

    for (i = 1; i < elements.length; i++) {
      dropzone = elements[i];

      // an element might belong to multiple selector dropzones
      if (!dropzone || dropzone === deepestZone) {
        continue;
      }

      if (!deepestZone) {
        deepestZone = dropzone;
        index = i;
        continue;
      }

      // check if the deepest or current are document.documentElement or document.rootElement
      // - if the current dropzone is, do nothing and continue
      if (dropzone.parentNode === dropzone.ownerDocument) {
        continue;
      }
      // - if deepest is, update with the current dropzone and continue to next
      else if (deepestZone.parentNode === dropzone.ownerDocument) {
          deepestZone = dropzone;
          index = i;
          continue;
        }

      if (!deepestZoneParents.length) {
        parent = deepestZone;
        while (parent.parentNode && parent.parentNode !== parent.ownerDocument) {
          deepestZoneParents.unshift(parent);
          parent = parent.parentNode;
        }
      }

      // if this element is an svg element and the current deepest is
      // an HTMLElement
      if (deepestZone instanceof domObjects.HTMLElement && dropzone instanceof domObjects.SVGElement && !(dropzone instanceof domObjects.SVGSVGElement)) {

        if (dropzone === deepestZone.parentNode) {
          continue;
        }

        parent = dropzone.ownerSVGElement;
      } else {
        parent = dropzone;
      }

      dropzoneParents = [];

      while (parent.parentNode !== parent.ownerDocument) {
        dropzoneParents.unshift(parent);
        parent = parent.parentNode;
      }

      n = 0;

      // get (position of last common ancestor) + 1
      while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
        n++;
      }

      var parents = [dropzoneParents[n - 1], dropzoneParents[n], deepestZoneParents[n]];

      child = parents[0].lastChild;

      while (child) {
        if (child === parents[1]) {
          deepestZone = dropzone;
          index = i;
          deepestZoneParents = [];

          break;
        } else if (child === parents[2]) {
          break;
        }

        child = child.previousSibling;
      }
    }

    return index;
  },

  matchesUpTo: function matchesUpTo(element, selector, limit) {
    while (is.element(element)) {
      if (domUtils.matchesSelector(element, selector)) {
        return true;
      }

      element = domUtils.parentNode(element);

      if (element === limit) {
        return domUtils.matchesSelector(element, selector);
      }
    }

    return false;
  },

  getActualElement: function getActualElement(element) {
    return element instanceof domObjects.SVGElementInstance ? element.correspondingUseElement : element;
  },

  getScrollXY: function getScrollXY(relevantWindow) {
    relevantWindow = relevantWindow || win.window;
    return {
      x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
      y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
    };
  },

  getElementClientRect: function getElementClientRect(element) {
    var clientRect = element instanceof domObjects.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];

    return clientRect && {
      left: clientRect.left,
      right: clientRect.right,
      top: clientRect.top,
      bottom: clientRect.bottom,
      width: clientRect.width || clientRect.right - clientRect.left,
      height: clientRect.height || clientRect.bottom - clientRect.top
    };
  },

  getElementRect: function getElementRect(element) {
    var clientRect = domUtils.getElementClientRect(element);

    if (!browser.isIOS7 && clientRect) {
      var scroll = domUtils.getScrollXY(win.getWindow(element));

      clientRect.left += scroll.x;
      clientRect.right += scroll.x;
      clientRect.top += scroll.y;
      clientRect.bottom += scroll.y;
    }

    return clientRect;
  },

  getPath: function getPath(element) {
    var path = [];

    while (element) {
      path.push(element);
      element = domUtils.parentNode(element);
    }

    return path;
  },

  trySelector: function trySelector(value) {
    if (!is.string(value)) {
      return false;
    }

    // an exception will be raised if it is invalid
    domObjects.document.querySelector(value);
    return true;
  }
};

module.exports = domUtils;

},{"./browser":35,"./domObjects":37,"./is":45,"./window":53}],39:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('./is');
var domUtils = _dereq_('./domUtils');
var pointerUtils = _dereq_('./pointerUtils');
var pExtend = _dereq_('./pointerExtend');

var _require = _dereq_('./window'),
    window = _require.window;

var _require2 = _dereq_('./arr'),
    contains = _require2.contains;

var elements = [];
var targets = [];

// {
//   type: {
//     selectors: ['selector', ...],
//     contexts : [document, ...],
//     listeners: [[listener, capture, passive], ...]
//   }
//  }
var delegatedEvents = {};
var documents = [];

var supportsOptions = function () {
  var supported = false;

  window.document.createElement('div').addEventListener('test', null, {
    get capture() {
      supported = true;
    }
  });

  return supported;
}();

function add(element, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var elementIndex = elements.indexOf(element);
  var target = targets[elementIndex];

  if (!target) {
    target = {
      events: {},
      typeCount: 0
    };

    elementIndex = elements.push(element) - 1;
    targets.push(target);
  }

  if (!target.events[type]) {
    target.events[type] = [];
    target.typeCount++;
  }

  if (!contains(target.events[type], listener)) {
    element.addEventListener(type, listener, supportsOptions ? options : !!options.capture);
    target.events[type].push(listener);
  }
}

function remove(element, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var elementIndex = elements.indexOf(element);
  var target = targets[elementIndex];

  if (!target || !target.events) {
    return;
  }

  if (type === 'all') {
    for (type in target.events) {
      if (target.events.hasOwnProperty(type)) {
        remove(element, type, 'all');
      }
    }
    return;
  }

  if (target.events[type]) {
    var len = target.events[type].length;

    if (listener === 'all') {
      for (var i = 0; i < len; i++) {
        remove(element, type, target.events[type][i], options);
      }
      return;
    } else {
      for (var _i = 0; _i < len; _i++) {
        if (target.events[type][_i] === listener) {
          element.removeEventListener(type, listener, supportsOptions ? options : !!options.capture);
          target.events[type].splice(_i, 1);

          break;
        }
      }
    }

    if (target.events[type] && target.events[type].length === 0) {
      target.events[type] = null;
      target.typeCount--;
    }
  }

  if (!target.typeCount) {
    targets.splice(elementIndex, 1);
    elements.splice(elementIndex, 1);
  }
}

function addDelegate(selector, context, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  if (!delegatedEvents[type]) {
    delegatedEvents[type] = {
      selectors: [],
      contexts: [],
      listeners: []
    };

    // add delegate listener functions
    for (var _i2 = 0; _i2 < documents.length; _i2++) {
      var doc = documents[_i2];
      add(doc, type, delegateListener);
      add(doc, type, delegateUseCapture, true);
    }
  }

  var delegated = delegatedEvents[type];
  var index = void 0;

  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {
      break;
    }
  }

  if (index === -1) {
    index = delegated.selectors.length;

    delegated.selectors.push(selector);
    delegated.contexts.push(context);
    delegated.listeners.push([]);
  }

  // keep listener and capture and passive flags
  delegated.listeners[index].push([listener, !!options.capture, options.passive]);
}

function removeDelegate(selector, context, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var delegated = delegatedEvents[type];
  var matchFound = false;
  var index = void 0;

  if (!delegated) {
    return;
  }

  // count from last index of delegated to 0
  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    // look for matching selector and context Node
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {

      var listeners = delegated.listeners[index];

      // each item of the listeners array is an array: [function, capture, passive]
      for (var i = listeners.length - 1; i >= 0; i--) {
        var _listeners$i = listeners[i],
            fn = _listeners$i[0],
            capture = _listeners$i[1],
            passive = _listeners$i[2];

        // check if the listener functions and capture and passive flags match

        if (fn === listener && capture === !!options.capture && passive === options.passive) {
          // remove the listener from the array of listeners
          listeners.splice(i, 1);

          // if all listeners for this interactable have been removed
          // remove the interactable from the delegated arrays
          if (!listeners.length) {
            delegated.selectors.splice(index, 1);
            delegated.contexts.splice(index, 1);
            delegated.listeners.splice(index, 1);

            // remove delegate function from context
            remove(context, type, delegateListener);
            remove(context, type, delegateUseCapture, true);

            // remove the arrays if they are empty
            if (!delegated.selectors.length) {
              delegatedEvents[type] = null;
            }
          }

          // only remove one listener
          matchFound = true;
          break;
        }
      }

      if (matchFound) {
        break;
      }
    }
  }
}

// bound to the interactable context when a DOM event
// listener is added to a selector interactable
function delegateListener(event, optionalArg) {
  var options = getOptions(optionalArg);
  var fakeEvent = {};
  var delegated = delegatedEvents[event.type];

  var _pointerUtils$getEven = pointerUtils.getEventTargets(event),
      eventTarget = _pointerUtils$getEven[0];

  var element = eventTarget;

  // duplicate the event so that currentTarget can be changed
  pExtend(fakeEvent, event);

  fakeEvent.originalEvent = event;
  fakeEvent.preventDefault = preventOriginalDefault;

  // climb up document tree looking for selector matches
  while (is.element(element)) {
    for (var i = 0; i < delegated.selectors.length; i++) {
      var selector = delegated.selectors[i];
      var context = delegated.contexts[i];

      if (domUtils.matchesSelector(element, selector) && domUtils.nodeContains(context, eventTarget) && domUtils.nodeContains(context, element)) {

        var listeners = delegated.listeners[i];

        fakeEvent.currentTarget = element;

        for (var j = 0; j < listeners.length; j++) {
          var _listeners$j = listeners[j],
              fn = _listeners$j[0],
              capture = _listeners$j[1],
              passive = _listeners$j[2];


          if (capture === !!options.capture && passive === options.passive) {
            fn(fakeEvent);
          }
        }
      }
    }

    element = domUtils.parentNode(element);
  }
}

function delegateUseCapture(event) {
  return delegateListener.call(this, event, true);
}

function preventOriginalDefault() {
  this.originalEvent.preventDefault();
}

function getOptions(param) {
  return is.object(param) ? param : { capture: param };
}

module.exports = {
  add: add,
  remove: remove,

  addDelegate: addDelegate,
  removeDelegate: removeDelegate,

  delegateListener: delegateListener,
  delegateUseCapture: delegateUseCapture,
  delegatedEvents: delegatedEvents,
  documents: documents,

  supportsOptions: supportsOptions,

  _elements: elements,
  _targets: targets
};

},{"./arr":34,"./domUtils":38,"./is":45,"./pointerExtend":47,"./pointerUtils":48,"./window":53}],40:[function(_dereq_,module,exports){
"use strict";

module.exports = function extend(dest, source) {
  for (var prop in source) {
    dest[prop] = source[prop];
  }
  return dest;
};

},{}],41:[function(_dereq_,module,exports){
'use strict';

var _require = _dereq_('./rect'),
    resolveRectLike = _require.resolveRectLike,
    rectToXY = _require.rectToXY;

module.exports = function (target, element, action) {
  var actionOptions = target.options[action];
  var actionOrigin = actionOptions && actionOptions.origin;
  var origin = actionOrigin || target.options.origin;

  var originRect = resolveRectLike(origin, target, element, [target && element]);

  return rectToXY(originRect) || { x: 0, y: 0 };
};

},{"./rect":50}],42:[function(_dereq_,module,exports){
"use strict";

module.exports = function (x, y) {
  return Math.sqrt(x * x + y * y);
};

},{}],43:[function(_dereq_,module,exports){
'use strict';

var win = _dereq_('./window');

var utils = {
  warnOnce: function warnOnce(method, message) {
    var warned = false;

    return function () {
      if (!warned) {
        win.window.console.warn(message);
        warned = true;
      }

      return method.apply(this, arguments);
    };
  },

  // http://stackoverflow.com/a/5634528/2280888
  _getQBezierValue: function _getQBezierValue(t, p1, p2, p3) {
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
  },

  getQuadraticCurvePoint: function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
    return {
      x: utils._getQBezierValue(position, startX, cpX, endX),
      y: utils._getQBezierValue(position, startY, cpY, endY)
    };
  },

  // http://gizma.com/easing/
  easeOutQuad: function easeOutQuad(t, b, c, d) {
    t /= d;
    return -c * t * (t - 2) + b;
  },

  copyAction: function copyAction(dest, src) {
    dest.name = src.name;
    dest.axis = src.axis;
    dest.edges = src.edges;

    return dest;
  },

  Signals: _dereq_('./Signals'),
  arr: _dereq_('./arr'),
  dom: _dereq_('./domUtils'),
  extend: _dereq_('./extend'),
  getOriginXY: _dereq_('./getOriginXY'),
  hypot: _dereq_('./hypot'),
  is: _dereq_('./is'),
  pointer: _dereq_('./pointerUtils'),
  rect: _dereq_('./rect')
};

module.exports = utils;

},{"./Signals":33,"./arr":34,"./domUtils":38,"./extend":40,"./getOriginXY":41,"./hypot":42,"./is":45,"./pointerUtils":48,"./rect":50,"./window":53}],44:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./index');

var finder = {
  methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],

  search: function search(details) {
    for (var _i = 0; _i < finder.methodOrder.length; _i++) {
      var _ref;

      _ref = finder.methodOrder[_i];
      var method = _ref;

      var interaction = finder[method](details);

      if (interaction) {
        return interaction;
      }
    }
  },

  // try to resume simulation with a new pointer
  simulationResume: function simulationResume(_ref2) {
    var pointerType = _ref2.pointerType,
        eventType = _ref2.eventType,
        eventTarget = _ref2.eventTarget,
        scope = _ref2.scope;

    if (!/down|start/i.test(eventType)) {
      return null;
    }

    for (var _i2 = 0; _i2 < scope.interactions.length; _i2++) {
      var _ref3;

      _ref3 = scope.interactions[_i2];
      var interaction = _ref3;

      var element = eventTarget;

      if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }
          element = utils.dom.parentNode(element);
        }
      }
    }

    return null;
  },

  // if it's a mouse or pen interaction
  mouseOrPen: function mouseOrPen(_ref4) {
    var pointerId = _ref4.pointerId,
        pointerType = _ref4.pointerType,
        eventType = _ref4.eventType,
        scope = _ref4.scope;

    if (pointerType !== 'mouse' && pointerType !== 'pen') {
      return null;
    }

    var firstNonActive = void 0;

    for (var _i3 = 0; _i3 < scope.interactions.length; _i3++) {
      var _ref5;

      _ref5 = scope.interactions[_i3];
      var interaction = _ref5;

      if (interaction.pointerType === pointerType) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !utils.arr.contains(interaction.pointerIds, pointerId)) {
          continue;
        }

        // if the interaction is active, return it immediately
        if (interaction.interacting()) {
          return interaction;
        }
        // otherwise save it and look for another active interaction
        else if (!firstNonActive) {
            firstNonActive = interaction;
          }
      }
    }

    // if no active mouse interaction was found use the first inactive mouse
    // interaction
    if (firstNonActive) {
      return firstNonActive;
    }

    // find any mouse or pen interaction.
    // ignore the interaction if the eventType is a *down, and a simulation
    // is active
    for (var _i4 = 0; _i4 < scope.interactions.length; _i4++) {
      var _ref6;

      _ref6 = scope.interactions[_i4];
      var _interaction = _ref6;

      if (_interaction.pointerType === pointerType && !(/down/i.test(eventType) && _interaction.simulation)) {
        return _interaction;
      }
    }

    return null;
  },

  // get interaction that has this pointer
  hasPointer: function hasPointer(_ref7) {
    var pointerId = _ref7.pointerId,
        scope = _ref7.scope;

    for (var _i5 = 0; _i5 < scope.interactions.length; _i5++) {
      var _ref8;

      _ref8 = scope.interactions[_i5];
      var interaction = _ref8;

      if (utils.arr.contains(interaction.pointerIds, pointerId)) {
        return interaction;
      }
    }
  },

  // get first idle interaction with a matching pointerType
  idle: function idle(_ref9) {
    var pointerType = _ref9.pointerType,
        scope = _ref9.scope;

    for (var _i6 = 0; _i6 < scope.interactions.length; _i6++) {
      var _ref10;

      _ref10 = scope.interactions[_i6];
      var interaction = _ref10;

      // if there's already a pointer held down
      if (interaction.pointerIds.length === 1) {
        var target = interaction.target;
        // don't add this pointer if there is a target interactable and it
        // isn't gesturable
        if (target && !target.options.gesture.enabled) {
          continue;
        }
      }
      // maximum of 2 pointers per interaction
      else if (interaction.pointerIds.length >= 2) {
          continue;
        }

      if (!interaction.interacting() && pointerType === interaction.pointerType) {
        return interaction;
      }
    }

    return null;
  }
};

module.exports = finder;

},{"./index":43}],45:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var win = _dereq_('./window');
var isWindow = _dereq_('./isWindow');

var is = {
  array: function array() {},

  window: function window(thing) {
    return thing === win.window || isWindow(thing);
  },

  docFrag: function docFrag(thing) {
    return is.object(thing) && thing.nodeType === 11;
  },

  object: function object(thing) {
    return !!thing && (typeof thing === 'undefined' ? 'undefined' : _typeof(thing)) === 'object';
  },

  function: function _function(thing) {
    return typeof thing === 'function';
  },

  number: function number(thing) {
    return typeof thing === 'number';
  },

  bool: function bool(thing) {
    return typeof thing === 'boolean';
  },

  string: function string(thing) {
    return typeof thing === 'string';
  },

  element: function element(thing) {
    if (!thing || (typeof thing === 'undefined' ? 'undefined' : _typeof(thing)) !== 'object') {
      return false;
    }

    var _window = win.getWindow(thing) || win.window;

    return (/object|function/.test(_typeof(_window.Element)) ? thing instanceof _window.Element //DOM2
      : thing.nodeType === 1 && typeof thing.nodeName === 'string'
    );
  },

  plainObject: function plainObject(thing) {
    return is.object(thing) && thing.constructor.name === 'Object';
  }
};

is.array = function (thing) {
  return is.object(thing) && typeof thing.length !== 'undefined' && is.function(thing.splice);
};

module.exports = is;

},{"./isWindow":46,"./window":53}],46:[function(_dereq_,module,exports){
"use strict";

module.exports = function (thing) {
  return !!(thing && thing.Window) && thing instanceof thing.Window;
};

},{}],47:[function(_dereq_,module,exports){
'use strict';

function pointerExtend(dest, source) {
  for (var prop in source) {
    var prefixedPropREs = module.exports.prefixedPropREs;
    var deprecated = false;

    // skip deprecated prefixed properties
    for (var vendor in prefixedPropREs) {
      if (prop.indexOf(vendor) === 0 && prefixedPropREs[vendor].test(prop)) {
        deprecated = true;
        break;
      }
    }

    if (!deprecated && typeof source[prop] !== 'function') {
      dest[prop] = source[prop];
    }
  }
  return dest;
}

pointerExtend.prefixedPropREs = {
  webkit: /(Movement[XY]|Radius[XY]|RotationAngle|Force)$/
};

module.exports = pointerExtend;

},{}],48:[function(_dereq_,module,exports){
'use strict';

var hypot = _dereq_('./hypot');
var browser = _dereq_('./browser');
var dom = _dereq_('./domObjects');
var domUtils = _dereq_('./domUtils');
var domObjects = _dereq_('./domObjects');
var is = _dereq_('./is');
var pointerExtend = _dereq_('./pointerExtend');

var pointerUtils = {
  copyCoords: function copyCoords(dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;

    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;

    dest.timeStamp = src.timeStamp;
  },

  setCoordDeltas: function setCoordDeltas(targetObj, prev, cur) {
    targetObj.page.x = cur.page.x - prev.page.x;
    targetObj.page.y = cur.page.y - prev.page.y;
    targetObj.client.x = cur.client.x - prev.client.x;
    targetObj.client.y = cur.client.y - prev.client.y;
    targetObj.timeStamp = cur.timeStamp - prev.timeStamp;

    // set pointer velocity
    var dt = Math.max(targetObj.timeStamp / 1000, 0.001);

    targetObj.page.speed = hypot(targetObj.page.x, targetObj.page.y) / dt;
    targetObj.page.vx = targetObj.page.x / dt;
    targetObj.page.vy = targetObj.page.y / dt;

    targetObj.client.speed = hypot(targetObj.client.x, targetObj.page.y) / dt;
    targetObj.client.vx = targetObj.client.x / dt;
    targetObj.client.vy = targetObj.client.y / dt;
  },

  isNativePointer: function isNativePointer(pointer) {
    return pointer instanceof dom.Event || pointer instanceof dom.Touch;
  },

  // Get specified X/Y coords for mouse or event.touches[0]
  getXY: function getXY(type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';

    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];

    return xy;
  },

  getPageXY: function getPageXY(pointer, page) {
    page = page || {};

    // Opera Mobile handles the viewport and scrolling oddly
    if (browser.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      pointerUtils.getXY('screen', pointer, page);

      page.x += window.scrollX;
      page.y += window.scrollY;
    } else {
      pointerUtils.getXY('page', pointer, page);
    }

    return page;
  },

  getClientXY: function getClientXY(pointer, client) {
    client = client || {};

    if (browser.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      pointerUtils.getXY('screen', pointer, client);
    } else {
      pointerUtils.getXY('client', pointer, client);
    }

    return client;
  },

  getPointerId: function getPointerId(pointer) {
    return is.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
  },

  setCoords: function setCoords(targetObj, pointers, timeStamp) {
    var pointer = pointers.length > 1 ? pointerUtils.pointerAverage(pointers) : pointers[0];

    var tmpXY = {};

    pointerUtils.getPageXY(pointer, tmpXY);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;

    pointerUtils.getClientXY(pointer, tmpXY);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;

    targetObj.timeStamp = is.number(timeStamp) ? timeStamp : new Date().getTime();
  },

  pointerExtend: pointerExtend,

  getTouchPair: function getTouchPair(event) {
    var touches = [];

    // array of touches is supplied
    if (is.array(event)) {
      touches[0] = event[0];
      touches[1] = event[1];
    }
    // an event
    else {
        if (event.type === 'touchend') {
          if (event.touches.length === 1) {
            touches[0] = event.touches[0];
            touches[1] = event.changedTouches[0];
          } else if (event.touches.length === 0) {
            touches[0] = event.changedTouches[0];
            touches[1] = event.changedTouches[1];
          }
        } else {
          touches[0] = event.touches[0];
          touches[1] = event.touches[1];
        }
      }

    return touches;
  },

  pointerAverage: function pointerAverage(pointers) {
    var average = {
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0
    };

    for (var _i = 0; _i < pointers.length; _i++) {
      var _ref;

      _ref = pointers[_i];
      var pointer = _ref;

      for (var _prop in average) {
        average[_prop] += pointer[_prop];
      }
    }
    for (var prop in average) {
      average[prop] /= pointers.length;
    }

    return average;
  },

  touchBBox: function touchBBox(event) {
    if (!event.length && !(event.touches && event.touches.length > 1)) {
      return;
    }

    var touches = pointerUtils.getTouchPair(event);
    var minX = Math.min(touches[0].pageX, touches[1].pageX);
    var minY = Math.min(touches[0].pageY, touches[1].pageY);
    var maxX = Math.max(touches[0].pageX, touches[1].pageX);
    var maxY = Math.max(touches[0].pageY, touches[1].pageY);

    return {
      x: minX,
      y: minY,
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  touchDistance: function touchDistance(event, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);

    var dx = touches[0][sourceX] - touches[1][sourceX];
    var dy = touches[0][sourceY] - touches[1][sourceY];

    return hypot(dx, dy);
  },

  touchAngle: function touchAngle(event, prevAngle, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);
    var dx = touches[1][sourceX] - touches[0][sourceX];
    var dy = touches[1][sourceY] - touches[0][sourceY];
    var angle = 180 * Math.atan2(dy, dx) / Math.PI;

    return angle;
  },

  getPointerType: function getPointerType(pointer) {
    return is.string(pointer.pointerType) ? pointer.pointerType : is.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType]
    // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
    : /touch/.test(pointer.type) || pointer instanceof domObjects.Touch ? 'touch' : 'mouse';
  },

  // [ event.target, event.currentTarget ]
  getEventTargets: function getEventTargets(event) {
    var path = is.function(event.composedPath) ? event.composedPath() : event.path;

    return [domUtils.getActualElement(path ? path[0] : event.target), domUtils.getActualElement(event.currentTarget)];
  }
};

module.exports = pointerUtils;

},{"./browser":35,"./domObjects":37,"./domUtils":38,"./hypot":42,"./is":45,"./pointerExtend":47}],49:[function(_dereq_,module,exports){
'use strict';

var _require = _dereq_('./window'),
    window = _require.window;

var lastTime = 0;
var _request = window.requestAnimationFrame;
var _cancel = window.cancelAnimationFrame;

if (!_request) {
  var vendors = ['ms', 'moz', 'webkit', 'o'];

  for (var _i = 0; _i < vendors.length; _i++) {
    var vendor = vendors[_i];
    _request = window[vendor + 'RequestAnimationFrame'];
    _cancel = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
  }
}

if (!_request) {
  _request = function request(callback) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var token = setTimeout(function () {
      callback(currTime + timeToCall);
    }, timeToCall);

    lastTime = currTime + timeToCall;
    return token;
  };

  _cancel = function cancel(token) {
    return clearTimeout(token);
  };
}

module.exports = {
  request: function request(callback) {
    return _request(callback);
  },
  cancel: function cancel(token) {
    return _cancel(token);
  }
};

},{"./window":53}],50:[function(_dereq_,module,exports){
'use strict';

var extend = _dereq_('./extend');
var is = _dereq_('./is');

var _require = _dereq_('./domUtils'),
    closest = _require.closest,
    parentNode = _require.parentNode,
    getElementRect = _require.getElementRect;

var rectUtils = {
  getStringOptionResult: function getStringOptionResult(value, interactable, element) {
    if (!is.string(value)) {
      return null;
    }

    if (value === 'parent') {
      value = parentNode(element);
    } else if (value === 'self') {
      value = interactable.getRect(element);
    } else {
      value = closest(element, value);
    }

    return value;
  },

  resolveRectLike: function resolveRectLike(value, interactable, element, functionArgs) {
    value = rectUtils.getStringOptionResult(value, interactable, element) || value;

    if (is.function(value)) {
      value = value.apply(null, functionArgs);
    }

    if (is.element(value)) {
      value = getElementRect(value);
    }

    return value;
  },

  rectToXY: function rectToXY(rect) {
    return rect && {
      x: 'x' in rect ? rect.x : rect.left,
      y: 'y' in rect ? rect.y : rect.top
    };
  },

  xywhToTlbr: function xywhToTlbr(rect) {
    if (rect && !('left' in rect && 'top' in rect)) {
      rect = extend({}, rect);

      rect.left = rect.x || 0;
      rect.top = rect.y || 0;
      rect.right = rect.right || rect.left + rect.width;
      rect.bottom = rect.bottom || rect.top + rect.height;
    }

    return rect;
  },

  tlbrToXywh: function tlbrToXywh(rect) {
    if (rect && !('x' in rect && 'y' in rect)) {
      rect = extend({}, rect);

      rect.x = rect.left || 0;
      rect.top = rect.top || 0;
      rect.width = rect.width || rect.right - rect.x;
      rect.height = rect.height || rect.bottom - rect.y;
    }

    return rect;
  }
};

module.exports = rectUtils;

},{"./domUtils":38,"./extend":40,"./is":45}],51:[function(_dereq_,module,exports){
'use strict';

var is = _dereq_('../is');

module.exports = function (grid) {
  return function (x, y) {
    var gridX = grid.x,
        gridY = grid.y,
        range = grid.range,
        offset = grid.offset,
        _grid$limits = grid.limits,
        limits = _grid$limits === undefined ? {
      left: -Infinity,
      right: Infinity,
      top: -Infinity,
      bottom: Infinity
    } : _grid$limits;


    var offsetX = 0;
    var offsetY = 0;

    if (is.object(offset)) {
      offsetX = offset.x;
      offsetY = offset.y;
    }

    var gridx = Math.round((x - offsetX) / gridX);
    var gridy = Math.round((y - offsetY) / gridY);

    var newX = Math.max(limits.left, Math.min(limits.right, gridx * gridX + offsetX));
    var newY = Math.max(limits.top, Math.min(limits.bottom, gridy * gridY + offsetY));

    return {
      x: newX,
      y: newY,
      range: range
    };
  };
};

},{"../is":45}],52:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  grid: _dereq_('./grid')
};

},{"./grid":51}],53:[function(_dereq_,module,exports){
'use strict';

var win = module.exports;
var isWindow = _dereq_('./isWindow');

function init(window) {
  // get wrapped window if using Shadow DOM polyfill

  win.realWindow = window;

  // create a TextNode
  var el = window.document.createTextNode('');

  // check if it's wrapped by a polyfill
  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }

  win.window = window;
}

if (typeof window === 'undefined') {
  win.window = undefined;
  win.realWindow = undefined;
} else {
  init(window);
}

win.getWindow = function getWindow(node) {
  if (isWindow(node)) {
    return node;
  }

  var rootNode = node.ownerDocument || node;

  return rootNode.defaultView || win.window;
};

win.init = init;

},{"./isWindow":46}]},{},[1])(1)
});


//# sourceMappingURL=interact.js.map
