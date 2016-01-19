/**
 * interact.js 1.2.6
 *
 * Copyright (c) 2012-2016 Taye Adeyemi <dev@taye.me>
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interact = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    require('./src/utils/window').init(window);

    return require('./src/index');
  };
} else {
  module.exports = require('./src/index');
}

},{"./src/index":18,"./src/utils/window":45}],2:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _require = require('./utils/arr');

var indexOf = _require.indexOf;

function fireUntilImmediateStopped(event, listeners) {
  for (var i = 0, len = listeners.length; i < len && !event.immediatePropagationStopped; i++) {
    listeners[i](event);
  }
}

var Eventable = (function () {
  function Eventable() {
    _classCallCheck(this, Eventable);
  }

  Eventable.prototype.fire = function fire(event) {
    var listeners = undefined;
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
    if (!(eventType in this)) {
      this[eventType] = [listener];
    } else {
      this[eventType].push(listener);
    }
  };

  Eventable.prototype.off = function off(eventType, listener) {
    // if it is an action event type
    var eventList = this[eventType];
    var index = eventList ? indexOf(eventList, listener) : -1;

    if (index !== -1) {
      this[eventType].splice(index, 1);
    }
  };

  return Eventable;
})();

module.exports = Eventable;

},{"./utils/arr":30}],3:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var extend = require('./utils/extend');
var getOriginXY = require('./utils/getOriginXY');
var defaults = require('./defaultOptions');
var signals = require('./utils/Signals')['new']();

var InteractEvent = (function () {
  function InteractEvent(interaction, event, action, phase, element, related) {
    _classCallCheck(this, InteractEvent);

    var target = interaction.target;
    var deltaSource = (target && target.options || defaults).deltaSource;
    var origin = getOriginXY(target, element);
    var starting = phase === 'start';
    var ending = phase === 'end';
    var coords = starting ? interaction.startCoords : interaction.curCoords;

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
    this.t0 = interaction.downTimes[interaction.downTimes.length - 1];
    this.type = action + (phase || '');
    this.interaction = interaction;
    this.interactable = target;

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
      var prevEvent = interaction.prevEvent;

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
    this.duration = this.timeStamp - interaction.downTimes[0];

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

  InteractEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  InteractEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  return InteractEvent;
})();

signals.on('set-delta', function (_ref) {
  var iEvent = _ref.iEvent;
  var interaction = _ref.interaction;
  var starting = _ref.starting;
  var deltaSource = _ref.deltaSource;

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

},{"./defaultOptions":17,"./utils/Signals":29,"./utils/extend":35,"./utils/getOriginXY":36}],4:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var isType = require('./utils/isType');
var events = require('./utils/events');
var extend = require('./utils/extend');
var actions = require('./actions');
var scope = require('./scope');
var Eventable = require('./Eventable');
var defaults = require('./defaultOptions');
var signals = require('./utils/Signals')['new']();

var _require = require('./utils/domUtils');

var getElementRect = _require.getElementRect;
var nodeContains = _require.nodeContains;

var _require2 = require('./utils/arr');

var indexOf = _require2.indexOf;
var contains = _require2.contains;

var _require3 = require('./utils/browser');

var wheelEvent = _require3.wheelEvent;

// all set interactables
scope.interactables = [];

/*\
 * Interactable
 [ property ]
 **
 * Object type returned by @interact
\*/

var Interactable = (function () {
  function Interactable(target, options) {
    _classCallCheck(this, Interactable);

    this.target = target;
    this._context = scope.document;
    this._iEvents = new Eventable();

    var _window = undefined;

    if (isType.trySelector(target)) {
      this.target = target;

      var context = options && options.context;

      _window = context ? scope.getWindow(context) : scope.window;

      if (context && (_window.Node ? context instanceof _window.Node : isType.isElement(context) || context === _window.document)) {

        this._context = context;
      }
    } else {
      _window = scope.getWindow(target);
    }

    this._doc = _window.document;

    signals.fire('new', {
      target: target,
      options: options,
      interactable: this,
      win: _window
    });

    scope.addDocument(this._doc, _window);

    scope.interactables.push(this);

    this.set(options);
  }

  Interactable.prototype.setOnEvents = function setOnEvents(action, phases) {
    var onAction = 'on' + action;

    if (isType.isFunction(phases.onstart)) {
      this._iEvents[onAction + 'start'] = phases.onstart;
    }
    if (isType.isFunction(phases.onmove)) {
      this._iEvents[onAction + 'move'] = phases.onmove;
    }
    if (isType.isFunction(phases.onend)) {
      this._iEvents[onAction + 'end'] = phases.onend;
    }
    if (isType.isFunction(phases.oninertiastart)) {
      this._iEvents[onAction + 'inertiastart'] = phases.oninertiastart;
    }

    return this;
  };

  Interactable.prototype.setPerAction = function setPerAction(action, options) {
    // for all the default per-action options
    for (var option in options) {
      // if this option exists for this action
      if (option in defaults[action]) {
        // if the option in the options arg is an object value
        if (isType.isObject(options[option])) {
          // duplicate the object
          this.options[action][option] = extend(this.options[action][option] || {}, options[option]);

          if (isType.isObject(defaults.perAction[option]) && 'enabled' in defaults.perAction[option]) {
            this.options[action][option].enabled = options[option].enabled === false ? false : true;
          }
        } else if (isType.isBool(options[option]) && isType.isObject(defaults.perAction[option])) {
          this.options[action][option].enabled = options[option];
        } else if (options[option] !== undefined) {
          // or if it's not undefined, do a plain assignment
          this.options[action][option] = options[option];
        }
      }
    }
  };

  /*\
   * Interactable.getRect
   [ method ]
   *
   * The default function to get an Interactables bounding rect. Can be
   * overridden using @Interactable.rectChecker.
   *
   - element (Element) #optional The element to measure.
   = (object) The object's bounding rectangle.
   o {
   o     top   : 0,
   o     left  : 0,
   o     bottom: 0,
   o     right : 0,
   o     width : 0,
   o     height: 0
   o }
  \*/

  Interactable.prototype.getRect = function getRect(element) {
    element = element || this.target;

    if (isType.isString(this.target) && !isType.isElement(element)) {
      element = this._context.querySelector(this.target);
    }

    return getElementRect(element);
  };

  /*\
   * Interactable.rectChecker
   [ method ]
   *
   * Returns or sets the function used to calculate the interactable's
   * element's rectangle
   *
   - checker (function) #optional A function which returns this Interactable's bounding rectangle. See @Interactable.getRect
   = (function | object) The checker function or this Interactable
  \*/

  Interactable.prototype.rectChecker = function rectChecker(checker) {
    if (isType.isFunction(checker)) {
      this.getRect = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.getRect;

      return this;
    }

    return this.getRect;
  };

  /*\
   * Interactable.origin
   [ method ]
   *
   * Gets or sets the origin of the Interactable's element.  The x and y
   * of the origin will be subtracted from action event coordinates.
   *
   - origin (object | string) #optional An object eg. { x: 0, y: 0 } or string 'parent', 'self' or any CSS selector
   * OR
   - origin (Element) #optional An HTML or SVG Element whose rect will be used
   **
   = (object) The current origin or this Interactable
  \*/

  Interactable.prototype.origin = function origin(newValue) {
    if (isType.trySelector(newValue)) {
      this.options.origin = newValue;
      return this;
    } else if (isType.isObject(newValue)) {
      this.options.origin = newValue;
      return this;
    }

    return this.options.origin;
  };

  /*\
   * Interactable.deltaSource
   [ method ]
   *
   * Returns or sets the mouse coordinate types used to calculate the
   * movement of the pointer.
   *
   - newValue (string) #optional Use 'client' if you will be scrolling while interacting; Use 'page' if you want autoScroll to work
   = (string | object) The current deltaSource or this Interactable
  \*/

  Interactable.prototype.deltaSource = function deltaSource(newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue;

      return this;
    }

    return this.options.deltaSource;
  };

  /*\
   * Interactable.context
   [ method ]
   *
   * Gets the selector context Node of the Interactable. The default is `window.document`.
   *
   = (Node) The context Node of this Interactable
   **
  \*/

  Interactable.prototype.context = function context() {
    return this._context;
  };

  Interactable.prototype.inContext = function inContext(element) {
    return this._context === element.ownerDocument || nodeContains(this._context, element);
  };

  /*\
   * Interactable.fire
   [ method ]
   *
   * Calls listeners for the given InteractEvent type bound globally
   * and directly to this Interactable
   *
   - iEvent (InteractEvent) The InteractEvent object to be fired on this Interactable
   = (Interactable) this Interactable
  \*/

  Interactable.prototype.fire = function fire(iEvent) {
    this._iEvents.fire(iEvent);

    return this;
  };

  Interactable.prototype._onOffMultiple = function _onOffMultiple(method, eventType, listener, useCapture) {
    if (isType.isString(eventType) && eventType.search(' ') !== -1) {
      eventType = eventType.trim().split(/ +/);
    }

    if (isType.isArray(eventType)) {
      for (var i = 0; i < eventType.length; i++) {
        this[method](eventType[i], listener, useCapture);
      }

      return true;
    }

    if (isType.isObject(eventType)) {
      for (var prop in eventType) {
        this[method](prop, eventType[prop], listener);
      }

      return true;
    }
  };

  /*\
   * Interactable.on
   [ method ]
   *
   * Binds a listener for an InteractEvent, pointerEvent or DOM event.
   *
   - eventType  (string | array | object) The types of events to listen for
   - listener   (function) The function event (s)
   - useCapture (boolean) #optional useCapture flag for addEventListener
   = (object) This Interactable
  \*/

  Interactable.prototype.on = function on(eventType, listener, useCapture) {
    // convert to boolean
    useCapture = !!useCapture;

    if (this._onOffMultiple('on', eventType, listener, useCapture)) {
      return this;
    }

    if (eventType === 'wheel') {
      eventType = wheelEvent;
    }

    if (contains(Interactable.eventTypes, eventType)) {
      this._iEvents.on(eventType, listener);
    }
    // delegated event for selector
    else if (isType.isString(this.target)) {
        events.addDelegate(this.target, this._context, eventType, listener, useCapture);
      } else {
        events.add(this.target, eventType, listener, useCapture);
      }

    return this;
  };

  /*\
   * Interactable.off
   [ method ]
   *
   * Removes an InteractEvent, pointerEvent or DOM event listener
   *
   - eventType  (string | array | object) The types of events that were listened for
   - listener   (function) The listener function to be removed
   - useCapture (boolean) #optional useCapture flag for removeEventListener
   = (object) This Interactable
  \*/

  Interactable.prototype.off = function off(eventType, listener, useCapture) {
    // convert to boolean
    useCapture = !!useCapture;

    if (this._onOffMultiple('off', eventType, listener, useCapture)) {
      return this;
    }

    if (eventType === 'wheel') {
      eventType = wheelEvent;
    }

    // if it is an action event type
    if (contains(Interactable.eventTypes, eventType)) {
      this._iEvents.on(eventType, listener);
    }
    // delegated event
    else if (isType.isString(this.target)) {
        events.removeDelegate(this.target, this._context, eventType, listener, useCapture);
      }
      // remove listener from this Interatable's element
      else {
          events.remove(this.target, eventType, listener, useCapture);
        }

    return this;
  };

  /*\
   * Interactable.set
   [ method ]
   *
   * Reset the options of this Interactable
   - options (object) The new settings to apply
   = (object) This Interactable
  \*/

  Interactable.prototype.set = function set(options) {
    if (!isType.isObject(options)) {
      options = {};
    }

    this.options = extend({}, defaults.base);

    var perActions = extend({}, defaults.perAction);

    for (var actionName in actions.methodDict) {
      var methodName = actions.methodDict[actionName];

      this.options[actionName] = extend({}, defaults[actionName]);

      this.setPerAction(actionName, perActions);

      this[methodName](options[actionName]);
    }

    for (var _iterator = Interactable.settingsMethods, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var setting = _ref;

      this.options[setting] = defaults.base[setting];

      if (setting in options) {
        this[setting](options[setting]);
      }
    }

    return this;
  };

  /*\
   * Interactable.unset
   [ method ]
   *
   * Remove this interactable from the list of interactables and remove
   * it's action capabilities and event listeners
   *
   = (object) @interact
  \*/

  Interactable.prototype.unset = function unset() {
    events.remove(this.target, 'all');

    if (isType.isString(this.target)) {
      // remove delegated events
      for (var type in events.delegatedEvents) {
        var delegated = events.delegatedEvents[type];

        for (var i = 0; i < delegated.selectors.length; i++) {
          if (delegated.selectors[i] === this.target && delegated.contexts[i] === this._context) {

            delegated.selectors.splice(i, 1);
            delegated.contexts.splice(i, 1);
            delegated.listeners.splice(i, 1);

            // remove the arrays if they are empty
            if (!delegated.selectors.length) {
              delegated[type] = null;
            }
          }

          events.remove(this._context, type, events.delegateListener);
          events.remove(this._context, type, events.delegateUseCapture, true);

          break;
        }
      }
    } else {
      events.remove(this, 'all');
    }

    signals.fire('unset', { interactable: this });

    scope.interactables.splice(indexOf(scope.interactables, this), 1);

    // Stop related interactions when an Interactable is unset
    for (var _iterator2 = scope.interactions || [], _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var interaction = _ref2;

      if (interaction.target === this && interaction.interacting()) {
        interaction.stop();
      }
    }

    return scope.interact;
  };

  return Interactable;
})();

scope.interactables.indexOfElement = function indexOfElement(target, context) {
  context = context || scope.document;

  for (var i = 0; i < this.length; i++) {
    var interactable = this[i];

    if (interactable.target === target && (!isType.isString(target) || interactable._context === context)) {
      return i;
    }
  }
  return -1;
};

scope.interactables.get = function interactableGet(element, options) {
  return this[this.indexOfElement(element, options && options.context)];
};

scope.interactables.forEachSelector = function (callback) {
  for (var i = 0; i < this.length; i++) {
    var interactable = this[i];

    // skip non CSS selector targets
    if (!isType.isString(interactable.target)) {
      continue;
    }

    var ret = callback(interactable, interactable.target, interactable._context, i, this);

    if (ret !== undefined) {
      return ret;
    }
  }
};

// all interact.js eventTypes
Interactable.eventTypes = scope.eventTypes = [];

Interactable.signals = signals;

Interactable.settingsMethods = ['deltaSource', 'origin', 'preventDefault', 'rectChecker'];

module.exports = Interactable;

},{"./Eventable":2,"./actions":9,"./defaultOptions":17,"./scope":28,"./utils/Signals":29,"./utils/arr":30,"./utils/browser":31,"./utils/domUtils":33,"./utils/events":34,"./utils/extend":35,"./utils/isType":40}],5:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var scope = require('./scope');
var utils = require('./utils');
var events = require('./utils/events');
var browser = require('./utils/browser');
var finder = require('./utils/interactionFinder');
var signals = require('./utils/Signals')['new']();

var listeners = {};
var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer'];

// for ignoring browser's simulated mouse events
var prevTouchTime = 0;

// all active and idle interactions
scope.interactions = [];

var Interaction = (function () {
  function Interaction() {
    _classCallCheck(this, Interaction);

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
    this.holdTimers = [];

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

    this.mouse = false;

    signals.fire('new', this);

    scope.interactions.push(this);
  }

  Interaction.prototype.pointerDown = function pointerDown(pointer, event, eventTarget) {
    var pointerIndex = this.updatePointer(pointer);

    this.pointerIsDown = true;

    if (!this.interacting()) {
      utils.setCoords(this.startCoords, this.pointers);

      utils.copyCoords(this.curCoords, this.startCoords);
      utils.copyCoords(this.prevCoords, this.startCoords);

      this.downEvent = event;

      this.downTimes[pointerIndex] = this.curCoords.timeStamp;
      this.downTargets[pointerIndex] = eventTarget;

      this.pointerWasMoved = false;

      utils.pointerExtend(this.downPointer, pointer);
    }

    signals.fire('down', {
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      pointerIndex: pointerIndex,
      interaction: this
    });
  };

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
   - action  (object)  The action to be performed - drag, resize, etc.
   - target  (Interactable) The Interactable to target
   - element (Element) The DOM Element to target
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

  Interaction.prototype.start = function start(action, target, element) {
    if (this.interacting() || !this.pointerIsDown || this.pointerIds.length < (action.name === 'gesture' ? 2 : 1)) {
      return;
    }

    // if this interaction had been removed after stopping
    // add it back
    if (utils.indexOf(scope.interactions, this) === -1) {
      scope.interactions.push(this);
    }

    utils.copyAction(this.prepared, action);
    this.target = target;
    this.element = element;

    signals.fire('action-start', {
      interaction: this,
      event: this.downEvent
    });
  };

  Interaction.prototype.pointerMove = function pointerMove(pointer, event, eventTarget) {
    if (!this.simulation) {
      this.updatePointer(pointer);
      utils.setCoords(this.curCoords, this.pointers);
    }

    var duplicateMove = this.curCoords.page.x === this.prevCoords.page.x && this.curCoords.page.y === this.prevCoords.page.y && this.curCoords.client.x === this.prevCoords.client.x && this.curCoords.client.y === this.prevCoords.client.y;

    var dx = undefined;
    var dy = undefined;

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.curCoords.client.x - this.startCoords.client.x;
      dy = this.curCoords.client.y - this.startCoords.client.y;

      this.pointerWasMoved = utils.hypot(dx, dy) > Interaction.pointerMoveTolerance;
    }

    var signalArg = {
      pointer: pointer,
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
      utils.setCoordDeltas(this.pointerDelta, this.prevCoords, this.curCoords);
    }

    signals.fire('move', signalArg);

    if (!duplicateMove) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        this.doMove(signalArg);
      }

      if (this.pointerWasMoved) {
        utils.copyCoords(this.prevCoords, this.curCoords);
      }
    }
  };

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

  Interaction.prototype.doMove = function doMove(signalArg) {
    signalArg = utils.extend({
      pointer: this.pointers[0],
      event: this.prevEvent,
      eventTarget: this._eventTarget,
      interaction: this
    }, signalArg || {});

    signals.fire('before-action-move', signalArg);

    if (!this._dontFireMove) {
      signals.fire('action-move', signalArg);
    }

    this._dontFireMove = false;
  };

  // End interact move events and stop auto-scroll unless simulation is running

  Interaction.prototype.pointerUp = function pointerUp(pointer, event, eventTarget, curEventTarget) {
    var pointerIndex = this.mouse ? 0 : utils.indexOf(this.pointerIds, utils.getPointerId(pointer));

    clearTimeout(this.holdTimers[pointerIndex]);

    signals.fire(/cancel$/i.test(event.type) ? 'cancel' : 'up', {
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      curEventTarget: curEventTarget,
      interaction: this
    });

    if (!this.simulation) {
      this.end(event);
      this.removePointer(pointer);
    }
  };

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

  Interaction.prototype.end = function end(event) {
    event = event || this.prevEvent;

    if (this.interacting()) {
      signals.fire('action-end', {
        event: event,
        interaction: this
      });
    }

    this.stop();
  };

  Interaction.prototype.currentAction = function currentAction() {
    return this._interacting ? this.prepared.name : null;
  };

  Interaction.prototype.interacting = function interacting() {
    return this._interacting;
  };

  Interaction.prototype.stop = function stop() {
    signals.fire('stop', { interaction: this });

    if (this._interacting) {
      signals.fire('stop-active', { interaction: this });
      signals.fire('stop-' + this.prepared.name, { interaction: this });
    }

    this.target = this.element = null;

    this.pointerIsDown = this._interacting = false;
    this.prepared.name = this.prevEvent = null;
  };

  Interaction.prototype.updatePointer = function updatePointer(pointer) {
    var id = utils.getPointerId(pointer);
    var index = this.mouse ? 0 : utils.indexOf(this.pointerIds, id);

    if (index === -1) {
      index = this.pointerIds.length;
    }

    this.pointerIds[index] = id;
    this.pointers[index] = pointer;

    return index;
  };

  Interaction.prototype.removePointer = function removePointer(pointer) {
    var id = utils.getPointerId(pointer);
    var index = this.mouse ? 0 : utils.indexOf(this.pointerIds, id);

    if (index === -1) {
      return;
    }

    this.pointers.splice(index, 1);
    this.pointerIds.splice(index, 1);
    this.downTargets.splice(index, 1);
    this.downTimes.splice(index, 1);
    this.holdTimers.splice(index, 1);
  };

  Interaction.prototype._updateEventTargets = function _updateEventTargets(target, currentTarget) {
    this._eventTarget = target;
    this._curEventTarget = currentTarget;
  };

  return Interaction;
})();

for (var i = 0, len = methodNames.length; i < len; i++) {
  var method = methodNames[i];

  listeners[method] = doOnInteractions(method);
}

function doOnInteractions(method) {
  return function (event) {
    var eventTarget = utils.getActualElement(event.path ? event.path[0] : event.target);
    var curEventTarget = utils.getActualElement(event.currentTarget);
    var matches = []; // [ [pointer, interaction], ...]

    if (browser.supportsTouch && /touch/.test(event.type)) {
      prevTouchTime = new Date().getTime();

      for (var i = 0; i < event.changedTouches.length; i++) {
        var pointer = event.changedTouches[i];
        var interaction = finder.search(pointer, event.type, eventTarget);

        matches.push([pointer, interaction || new Interaction()]);
      }
    } else {
      var invalidPointer = false;

      if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (var i = 0; i < scope.interactions.length && !invalidPointer; i++) {
          invalidPointer = !scope.interactions[i].mouse && scope.interactions[i].pointerIsDown;
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer || new Date().getTime() - prevTouchTime < 500;
      }

      if (!invalidPointer) {
        var interaction = finder.search(event, event.type, eventTarget);

        if (!interaction) {

          interaction = new Interaction();
          interaction.mouse = /mouse/i.test(event.pointerType || event.type)
          // MSPointerEvent.MSPOINTER_TYPE_MOUSE
           || event.pointerType === 4;
        }

        matches.push([event, interaction]);
      }
    }

    for (var _iterator = matches, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var pointer = _ref[0];
      var interaction = _ref[1];

      interaction._updateEventTargets(eventTarget, curEventTarget);
      interaction[method](pointer, event, eventTarget, curEventTarget);
    }
  };
}

function endAll(event) {
  for (var i = 0; i < scope.interactions.length; i++) {
    scope.interactions[i].end(event);
  }
}

var docEvents = {/* 'eventType': listenerFunc */};
var pEventTypes = browser.pEventTypes;

if (scope.PointerEvent) {
  docEvents[pEventTypes.down] = listeners.pointerDown;
  docEvents[pEventTypes.move] = listeners.pointerMove;
  docEvents[pEventTypes.up] = listeners.pointerUp;
  docEvents[pEventTypes.cancel] = listeners.pointerUp;
} else {
  docEvents.mousedown = listeners.pointerDown;
  docEvents.mousemove = listeners.pointerMove;
  docEvents.mouseup = listeners.pointerUp;

  docEvents.touchstart = listeners.pointerDown;
  docEvents.touchmove = listeners.pointerMove;
  docEvents.touchend = listeners.pointerUp;
  docEvents.touchcancel = listeners.pointerUp;
}

docEvents.blur = endAll;

function onDocSignal(_ref2, signalName) {
  var doc = _ref2.doc;

  var eventMethod = signalName.indexOf('add') === 0 ? events.add : events.remove;

  // delegate event listener
  for (var eventType in scope.delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener);
    eventMethod(doc, eventType, events.delegateUseCapture, true);
  }

  for (var eventType in docEvents) {
    eventMethod(doc, eventType, docEvents[eventType]);
  }
}

scope.signals.on('add-document', onDocSignal);
scope.signals.on('remove-document', onDocSignal);

Interaction.pointerMoveTolerance = 1;
Interaction.doOnInteractions = doOnInteractions;
Interaction.endAll = endAll;
Interaction.signals = signals;
Interaction.docEvents = docEvents;

scope.endAllInteractions = endAll;

module.exports = Interaction;

},{"./scope":28,"./utils":38,"./utils/Signals":29,"./utils/browser":31,"./utils/events":34,"./utils/interactionFinder":39}],6:[function(require,module,exports){
var actions = require('./index');
var utils = require('../utils');
var InteractEvent = require('../InteractEvent');
var Interactable = require('../Interactable');
var Interaction = require('../Interaction');
var defaultOptions = require('../defaultOptions');

var drag = {
  defaults: {
    enabled: false,

    snap: null,
    restrict: null,
    inertia: null,
    autoScroll: null,

    startAxis: 'xy',
    lockAxis: 'xy'
  },

  checker: function (pointer, event, interactable) {
    var dragOptions = interactable.options.drag;

    return dragOptions.enabled ? { name: 'drag', axis: dragOptions.lockAxis === 'start' ? dragOptions.startAxis : dragOptions.lockAxis } : null;
  },

  getCursor: function () {
    return 'move';
  }
};

Interaction.signals.on('action-start', function (_ref) {
  var interaction = _ref.interaction;
  var event = _ref.event;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var dragEvent = new InteractEvent(interaction, event, 'drag', 'start', interaction.element);

  interaction._interacting = true;
  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;
});

Interaction.signals.on('before-action-move', function (_ref2) {
  var interaction = _ref2.interaction;

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
});

Interaction.signals.on('action-move', function (_ref3) {
  var interaction = _ref3.interaction;
  var event = _ref3.event;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var dragEvent = new InteractEvent(interaction, event, 'drag', 'move', interaction.element);

  var axis = interaction.prepared.axis;

  if (axis === 'x') {
    dragEvent.pageY = interaction.startCoords.page.y;
    dragEvent.clientY = interaction.startCoords.client.y;
    dragEvent.dy = 0;
  } else if (axis === 'y') {
    dragEvent.pageX = interaction.startCoords.page.x;
    dragEvent.clientX = interaction.startCoords.client.x;
    dragEvent.dx = 0;
  }

  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;

  // if the action was ended in a dragmove listener
  if (!interaction.interacting()) {
    return false;
  }
});

Interaction.signals.on('action-end', function (_ref4) {
  var interaction = _ref4.interaction;
  var event = _ref4.event;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var dragEvent = new InteractEvent(interaction, event, 'drag', 'end', interaction.element);

  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;
});

/*\
 * Interactable.draggable
 [ method ]
 *
 * Gets or sets whether drag actions can be performed on the
 * Interactable
 *
 = (boolean) Indicates if this can be the target of drag events
 | var isDraggable = interact('ul li').draggable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on drag events (object makes the Interactable draggable)
 = (object) This Interactable
 | interact(element).draggable({
 |     onstart: function (event) {},
 |     onmove : function (event) {},
 |     onend  : function (event) {},
 |
 |     // the axis in which the first movement must be
 |     // for the drag sequence to start
 |     // 'xy' by default - any direction
 |     startAxis: 'x' || 'y' || 'xy',
 |
 |     // 'xy' by default - don't restrict to one axis (move in any direction)
 |     // 'x' or 'y' to restrict movement to either axis
 |     // 'start' to restrict movement to the axis the drag started in
 |     lockAxis: 'x' || 'y' || 'xy' || 'start',
 |
 |     // max number of drags that can happen concurrently
 |     // with elements of this Interactable. Infinity by default
 |     max: Infinity,
 |
 |     // max number of drags that can target the same element+Interactable
 |     // 1 by default
 |     maxPerElement: 2
 | });
\*/
Interactable.prototype.draggable = function (options) {
  if (utils.isObject(options)) {
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

  if (utils.isBool(options)) {
    this.options.drag.enabled = options;

    return this;
  }

  return this.options.drag;
};

actions.drag = drag;
actions.names.push('drag');
utils.merge(Interactable.eventTypes, ['dragstart', 'dragmove', 'draginertiastart', 'draginertiaresume', 'dragend']);
actions.methodDict.drag = 'draggable';

defaultOptions.drag = drag.defaults;

module.exports = drag;

},{"../InteractEvent":3,"../Interactable":4,"../Interaction":5,"../defaultOptions":17,"../utils":38,"./index":9}],7:[function(require,module,exports){
var actions = require('./index');
var utils = require('../utils');
var scope = require('../scope');
var interact = require('../interact');
var InteractEvent = require('../InteractEvent');
var Interactable = require('../Interactable');
var Interaction = require('../Interaction');
var defaultOptions = require('../defaultOptions');

var drop = {
  defaults: {
    enabled: false,
    accept: null,
    overlap: 'pointer'
  }
};

var dynamicDrop = false;

Interaction.signals.on('action-start', function (_ref2) {
  var interaction = _ref2.interaction;
  var event = _ref2.event;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  // reset active dropzones
  interaction.activeDrops.dropzones = [];
  interaction.activeDrops.elements = [];
  interaction.activeDrops.rects = [];

  interaction.dropEvents = null;

  if (!interaction.dynamicDrop) {
    setActiveDrops(interaction, interaction.element);
  }

  var dragEvent = interaction.prevEvent;
  var dropEvents = getDropEvents(interaction, event, dragEvent);

  if (dropEvents.activate) {
    fireActiveDrops(interaction, dropEvents.activate);
  }
});

InteractEvent.signals.on('new', function (_ref3) {
  var interaction = _ref3.interaction;
  var iEvent = _ref3.iEvent;
  var event = _ref3.event;

  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
    return;
  }

  var draggableElement = interaction.element;
  var dragEvent = iEvent;
  var dropResult = getDrop(dragEvent, event, draggableElement);

  interaction.dropTarget = dropResult.dropzone;
  interaction.dropElement = dropResult.element;

  interaction.dropEvents = getDropEvents(interaction, event, dragEvent);
});

Interaction.signals.on('action-move', function (_ref4) {
  var interaction = _ref4.interaction;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  fireDropEvents(interaction, interaction.dropEvents);
});

Interaction.signals.on('action-end', function (_ref5) {
  var interaction = _ref5.interaction;

  if (interaction.prepared.name === 'drag') {
    fireDropEvents(interaction, interaction.dropEvents);
  }
});

Interaction.signals.on('stop-drag', function (_ref6) {
  var interaction = _ref6.interaction;

  interaction.activeDrops.dropzones = interaction.activeDrops.elements = interaction.activeDrops.rects = interaction.dropEvents = null;
});

function collectDrops(interaction, element) {
  var drops = [];
  var elements = [];

  element = element || interaction.element;

  // collect all dropzones and their elements which qualify for a drop
  for (var _iterator = scope.interactables, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var current = _ref;

    if (!current.options.drop.enabled) {
      continue;
    }

    var accept = current.options.drop.accept;

    // test the draggable element against the dropzone's accept setting
    if (utils.isElement(accept) && accept !== element || utils.isString(accept) && !utils.matchesSelector(element, accept)) {

      continue;
    }

    // query for new elements if necessary
    var dropElements = utils.isString(current.target) ? current._context.querySelectorAll(current.target) : [current.target];

    for (var i = 0; i < dropElements.length; i++) {
      var currentElement = dropElements[i];

      if (currentElement !== element) {
        drops.push(current);
        elements.push(currentElement);
      }
    }
  }

  return {
    elements: elements,
    dropzones: drops
  };
}

function fireActiveDrops(interaction, event) {
  var prevElement = undefined;

  // loop through all active dropzones and trigger event
  for (var i = 0; i < interaction.activeDrops.dropzones.length; i++) {
    var current = interaction.activeDrops.dropzones[i];
    var currentElement = interaction.activeDrops.elements[i];

    // prevent trigger of duplicate events on same element
    if (currentElement !== prevElement) {
      // set current element as event target
      event.target = currentElement;
      current.fire(event);
    }
    prevElement = currentElement;
  }
}

// Collect a new set of possible drops and save them in activeDrops.
// setActiveDrops should always be called when a drag has just started or a
// drag event happens while dynamicDrop is true
function setActiveDrops(interaction, dragElement) {
  // get dropzones and their elements that could receive the draggable
  var possibleDrops = collectDrops(interaction, dragElement, true);

  interaction.activeDrops.dropzones = possibleDrops.dropzones;
  interaction.activeDrops.elements = possibleDrops.elements;
  interaction.activeDrops.rects = [];

  for (var i = 0; i < interaction.activeDrops.dropzones.length; i++) {
    interaction.activeDrops.rects[i] = interaction.activeDrops.dropzones[i].getRect(interaction.activeDrops.elements[i]);
  }
}

function getDrop(dragEvent, event, dragElement) {
  var interaction = dragEvent.interaction;
  var validDrops = [];

  if (dynamicDrop) {
    setActiveDrops(interaction, dragElement);
  }

  // collect all dropzones and their elements which qualify for a drop
  for (var j = 0; j < interaction.activeDrops.dropzones.length; j++) {
    var current = interaction.activeDrops.dropzones[j];
    var currentElement = interaction.activeDrops.elements[j];
    var rect = interaction.activeDrops.rects[j];

    validDrops.push(current.dropCheck(dragEvent, event, interaction.target, dragElement, currentElement, rect) ? currentElement : null);
  }

  // get the most appropriate dropzone based on DOM depth and order
  var dropIndex = utils.indexOfDeepestElement(validDrops);

  return {
    dropzone: interaction.activeDrops.dropzones[dropIndex] || null,
    element: interaction.activeDrops.elements[dropIndex] || null
  };
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
  if (dropEvents.leave) {
    interaction.prevDropTarget.fire(dropEvents.leave);
  }
  if (dropEvents.enter) {
    interaction.dropTarget.fire(dropEvents.enter);
  }
  if (dropEvents.drop) {
    interaction.dropTarget.fire(dropEvents.drop);
  }
  if (dropEvents.deactivate) {
    fireActiveDrops(interaction, dropEvents.deactivate);
  }

  interaction.prevDropTarget = interaction.dropTarget;
  interaction.prevDropElement = interaction.dropElement;
}

/*\
 * Interactable.dropzone
 [ method ]
 *
 * Returns or sets whether elements can be dropped onto this
 * Interactable to trigger drop events
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
 * Use the `checker` option to specify a function to check if a dragged
 * element is over this Interactable.
 *
 | interact(target)
 | .dropChecker(function(dragEvent,         // related dragmove or dragend event
 |                       event,             // TouchEvent/PointerEvent/MouseEvent
 |                       dropped,           // bool result of the default checker
 |                       dropzone,          // dropzone Interactable
 |                       dropElement,       // dropzone elemnt
 |                       draggable,         // draggable Interactable
 |                       draggableElement) {// draggable element
 |
 |   return dropped && event.target.hasAttribute('allow-drop');
 | }
 *
 *
 - options (boolean | object | null) #optional The new value to be set.
 | interact('.drop').dropzone({
 |   accept: '.can-drop' || document.getElementById('single-drop'),
 |   overlap: 'pointer' || 'center' || zeroToOne
 | }
 = (boolean | object) The current setting or this Interactable
\*/
Interactable.prototype.dropzone = function (options) {
  if (utils.isObject(options)) {
    this.options.drop.enabled = options.enabled === false ? false : true;

    if (utils.isFunction(options.ondrop)) {
      this._iEvents.ondrop = options.ondrop;
    }
    if (utils.isFunction(options.ondropactivate)) {
      this._iEvents.ondropactivate = options.ondropactivate;
    }
    if (utils.isFunction(options.ondropdeactivate)) {
      this._iEvents.ondropdeactivate = options.ondropdeactivate;
    }
    if (utils.isFunction(options.ondragenter)) {
      this._iEvents.ondragenter = options.ondragenter;
    }
    if (utils.isFunction(options.ondragleave)) {
      this._iEvents.ondragleave = options.ondragleave;
    }
    if (utils.isFunction(options.ondropmove)) {
      this._iEvents.ondropmove = options.ondropmove;
    }

    if (/^(pointer|center)$/.test(options.overlap)) {
      this.options.drop.overlap = options.overlap;
    } else if (utils.isNumber(options.overlap)) {
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

  if (utils.isBool(options)) {
    this.options.drop.enabled = options;

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
    var origin = utils.getOriginXY(draggable, draggableElement);
    var page = utils.getPageXY(dragEvent);
    var horizontal = undefined;
    var vertical = undefined;

    page.x += origin.x;
    page.y += origin.y;

    horizontal = page.x > rect.left && page.x < rect.right;
    vertical = page.y > rect.top && page.y < rect.bottom;

    dropped = horizontal && vertical;
  }

  var dragRect = draggable.getRect(draggableElement);

  if (dropOverlap === 'center') {
    var cx = dragRect.left + dragRect.width / 2;
    var cy = dragRect.top + dragRect.height / 2;

    dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
  }

  if (utils.isNumber(dropOverlap)) {
    var overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));

    var overlapRatio = overlapArea / (dragRect.width * dragRect.height);

    dropped = overlapRatio >= dropOverlap;
  }

  if (this.options.drop.checker) {
    dropped = this.options.drop.checker(dragEvent, event, dropped, this, dropElement, draggable, draggableElement);
  }

  return dropped;
};

Interactable.signals.on('unset', function (_ref7) {
  var interactable = _ref7.interactable;

  interactable.dropzone(false);
});

Interactable.settingsMethods.push('dropChecker');

Interaction.signals.on('new', function (interaction) {
  interaction.dropTarget = null; // the dropzone a drag target might be dropped into
  interaction.dropElement = null; // the element at the time of checking
  interaction.prevDropTarget = null; // the dropzone that was recently dragged away from
  interaction.prevDropElement = null; // the element at the time of checking
  interaction.dropEvents = null; // the dropEvents related to the current drag event

  interaction.activeDrops = {
    dropzones: [], // the dropzones that are mentioned below
    elements: [], // elements of dropzones that accept the target draggable
    rects: [] };
});

// the rects of the elements mentioned above
Interaction.signals.on('stop', function (_ref8) {
  var interaction = _ref8.interaction;

  interaction.dropTarget = interaction.dropElement = interaction.prevDropTarget = interaction.prevDropElement = null;
});

/*\
 * interact.dynamicDrop
 [ method ]
 *
 * Returns or sets whether the dimensions of dropzone elements are
 * calculated on every dragmove or only on dragstart for the default
 * dropChecker
 *
 - newValue (boolean) #optional True to check on each move. False to check only before start
 = (boolean | interact) The current setting or interact
\*/
interact.dynamicDrop = function (newValue) {
  if (utils.isBool(newValue)) {
    //if (dragging && dynamicDrop !== newValue && !newValue) {
    //calcRects(dropzones);
    //}

    dynamicDrop = newValue;

    return interact;
  }
  return dynamicDrop;
};

utils.merge(Interactable.eventTypes, ['dragenter', 'dragleave', 'dropactivate', 'dropdeactivate', 'dropmove', 'drop']);
actions.methodDict.drop = 'dropzone';

defaultOptions.drop = drop.defaults;

module.exports = drop;

},{"../InteractEvent":3,"../Interactable":4,"../Interaction":5,"../defaultOptions":17,"../interact":20,"../scope":28,"../utils":38,"./index":9}],8:[function(require,module,exports){
var actions = require('./index');
var utils = require('../utils');
var InteractEvent = require('../InteractEvent');
var Interactable = require('../Interactable');
var Interaction = require('../Interaction');
var defaultOptions = require('../defaultOptions');

var gesture = {
  defaults: {
    enabled: false,
    restrict: null
  },

  checker: function (pointer, event, interactable, element, interaction) {
    if (interaction.pointerIds.length >= 2) {
      return { name: 'gesture' };
    }

    return null;
  },

  getCursor: function () {
    return '';
  }
};

Interaction.signals.on('action-start', function (_ref) {
  var interaction = _ref.interaction;
  var event = _ref.event;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  var gestureEvent = new InteractEvent(interaction, event, 'gesture', 'start', interaction.element);

  gestureEvent.ds = 0;

  interaction.gesture.startDistance = interaction.gesture.prevDistance = gestureEvent.distance;
  interaction.gesture.startAngle = interaction.gesture.prevAngle = gestureEvent.angle;
  interaction.gesture.scale = 1;

  interaction._interacting = true;

  interaction.target.fire(gestureEvent);
  interaction.prevEvent = gestureEvent;
});

Interaction.signals.on('action-move', function (_ref2) {
  var interaction = _ref2.interaction;
  var event = _ref2.event;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  var gestureEvent = undefined;

  gestureEvent = new InteractEvent(interaction, event, 'gesture', 'move', interaction.element);
  gestureEvent.ds = gestureEvent.scale - interaction.gesture.scale;

  interaction.target.fire(gestureEvent);

  interaction.gesture.prevAngle = gestureEvent.angle;
  interaction.gesture.prevDistance = gestureEvent.distance;

  if (gestureEvent.scale !== Infinity && gestureEvent.scale !== null && gestureEvent.scale !== undefined && !isNaN(gestureEvent.scale)) {

    interaction.gesture.scale = gestureEvent.scale;
  }

  interaction.prevEvent = gestureEvent;

  // if the action was ended in a gesturemove listener
  if (!interaction.interacting()) {
    return false;
  }
});

Interaction.signals.on('action-end', function (_ref3) {
  var interaction = _ref3.interaction;
  var event = _ref3.event;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  var gestureEvent = new InteractEvent(interaction, event, 'gesture', 'end', interaction.element);

  interaction.target.fire(gestureEvent);
  interaction.prevEvent = gestureEvent;
});

/*\
 * Interactable.gesturable
 [ method ]
 *
 * Gets or sets whether multitouch gestures can be performed on the
 * Interactable's element
 *
 = (boolean) Indicates if this can be the target of gesture events
   | var isGestureable = interact(element).gesturable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on gesture events (makes the Interactable gesturable)
 = (object) this Interactable
 | interact(element).gesturable({
 |     onstart: function (event) {},
 |     onmove : function (event) {},
 |     onend  : function (event) {},
 |
 |     // limit multiple gestures.
 |     // See the explanation in @Interactable.draggable example
 |     max: Infinity,
 |     maxPerElement: 1,
 | });
\*/
Interactable.prototype.gesturable = function (options) {
  if (utils.isObject(options)) {
    this.options.gesture.enabled = options.enabled === false ? false : true;
    this.setPerAction('gesture', options);
    this.setOnEvents('gesture', options);

    return this;
  }

  if (utils.isBool(options)) {
    this.options.gesture.enabled = options;

    return this;
  }

  return this.options.gesture;
};

InteractEvent.signals.on('set-delta', function (_ref4) {
  var interaction = _ref4.interaction;
  var iEvent = _ref4.iEvent;
  var action = _ref4.action;
  var event = _ref4.event;
  var starting = _ref4.starting;
  var ending = _ref4.ending;
  var deltaSource = _ref4.deltaSource;

  if (action !== 'gesture') {
    return;
  }

  var pointers = interaction.pointers;

  iEvent.touches = [pointers[0], pointers[1]];

  if (starting) {
    iEvent.distance = utils.touchDistance(pointers, deltaSource);
    iEvent.box = utils.touchBBox(pointers);
    iEvent.scale = 1;
    iEvent.ds = 0;
    iEvent.angle = utils.touchAngle(pointers, undefined, deltaSource);
    iEvent.da = 0;
  } else if (ending || event instanceof InteractEvent) {
    iEvent.distance = interaction.prevEvent.distance;
    iEvent.box = interaction.prevEvent.box;
    iEvent.scale = interaction.prevEvent.scale;
    iEvent.ds = iEvent.scale - 1;
    iEvent.angle = interaction.prevEvent.angle;
    iEvent.da = iEvent.angle - interaction.gesture.startAngle;
  } else {
    iEvent.distance = utils.touchDistance(pointers, deltaSource);
    iEvent.box = utils.touchBBox(pointers);
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
    iEvent.angle = utils.touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);

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
    prevAngle: 0 };
});

// angle of the previous gesture event
actions.gesture = gesture;
actions.names.push('gesture');
utils.merge(Interactable.eventTypes, ['gesturestart', 'gesturemove', 'gestureend']);
actions.methodDict.gesture = 'gesturable';

defaultOptions.gesture = gesture.defaults;

module.exports = gesture;

},{"../InteractEvent":3,"../Interactable":4,"../Interaction":5,"../defaultOptions":17,"../utils":38,"./index":9}],9:[function(require,module,exports){
var actions = {
  names: [],
  methodDict: {}
};

module.exports = actions;

},{}],10:[function(require,module,exports){
var actions = require('./index');
var utils = require('../utils');
var browser = require('../utils/browser');
var InteractEvent = require('../InteractEvent');
var Interactable = require('../Interactable');
var Interaction = require('../Interaction');
var defaultOptions = require('../defaultOptions');

// Less Precision with touch input
var defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;

var resize = {
  defaults: {
    enabled: false,

    snap: null,
    restrict: null,
    inertia: null,
    autoScroll: null,

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

  checker: function (pointer, event, interactable, element, interaction, rect) {
    if (!rect) {
      return null;
    }

    var page = utils.extend({}, interaction.curCoords.page);
    var options = interactable.options;

    if (options.resize.enabled) {
      var resizeOptions = options.resize;
      var resizeEdges = { left: false, right: false, top: false, bottom: false };

      // if using resize.edges
      if (utils.isObject(resizeOptions.edges)) {
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

  cursors: browser.isIe9OrOlder ? {
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

  getCursor: function (action) {
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

Interaction.signals.on('action-start', function (_ref) {
  var interaction = _ref.interaction;
  var event = _ref.event;

  if (interaction.prepared.name !== 'resize') {
    return;
  }

  var resizeEvent = new InteractEvent(interaction, event, 'resize', 'start', interaction.element);

  if (interaction.prepared.edges) {
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
      restricted: utils.extend({}, startRect),
      previous: utils.extend({}, startRect),
      delta: {
        left: 0, right: 0, width: 0,
        top: 0, bottom: 0, height: 0
      }
    };

    resizeEvent.rect = interaction.resizeRects.restricted;
    resizeEvent.deltaRect = interaction.resizeRects.delta;
  }

  interaction.target.fire(resizeEvent);

  interaction._interacting = true;

  interaction.prevEvent = resizeEvent;
});

Interaction.signals.on('action-move', function (_ref2) {
  var interaction = _ref2.interaction;
  var event = _ref2.event;

  if (interaction.prepared.name !== 'resize') {
    return;
  }

  var resizeEvent = new InteractEvent(interaction, event, 'resize', 'move', interaction.element);
  var resizeOptions = interaction.target.options.resize;
  var invert = resizeOptions.invert;
  var invertible = invert === 'reposition' || invert === 'negate';

  var edges = interaction.prepared.edges;

  if (edges) {
    var start = interaction.resizeRects.start;
    var current = interaction.resizeRects.current;
    var restricted = interaction.resizeRects.restricted;
    var delta = interaction.resizeRects.delta;
    var previous = utils.extend(interaction.resizeRects.previous, restricted);
    var originalEdges = edges;

    var dx = resizeEvent.dx;
    var dy = resizeEvent.dy;

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
      utils.extend(restricted, current);

      if (invert === 'reposition') {
        // swap edge values if necessary to keep width/height positive
        var swap = undefined;

        if (restricted.top > restricted.bottom) {
          swap = restricted.top;

          restricted.top = restricted.bottom;
          restricted.bottom = swap;
        }
        if (restricted.left > restricted.right) {
          swap = restricted.left;

          restricted.left = restricted.right;
          restricted.right = swap;
        }
      }
    } else {
      // if not invertible, restrict to minimum of 0x0 rect
      restricted.top = Math.min(current.top, start.bottom);
      restricted.bottom = Math.max(current.bottom, start.top);
      restricted.left = Math.min(current.left, start.right);
      restricted.right = Math.max(current.right, start.left);
    }

    restricted.width = restricted.right - restricted.left;
    restricted.height = restricted.bottom - restricted.top;

    for (var edge in restricted) {
      delta[edge] = restricted[edge] - previous[edge];
    }

    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = restricted;
    resizeEvent.deltaRect = delta;
  }

  interaction.target.fire(resizeEvent);

  interaction.prevEvent = resizeEvent;

  // if the action was ended in a resizemove listener
  if (!interaction.interacting()) {
    return false;
  }
});

Interaction.signals.on('action-end', function (_ref3) {
  var interaction = _ref3.interaction;
  var event = _ref3.event;

  if (interaction.prepared.name !== 'resize') {
    return;
  }

  var resizeEvent = new InteractEvent(interaction, event, 'resize', 'end', interaction.element);

  interaction.target.fire(resizeEvent);
  interaction.prevEvent = resizeEvent;
});

/*\
 * Interactable.resizable
 [ method ]
 *
 * Gets or sets whether resize actions can be performed on the
 * Interactable
 *
 = (boolean) Indicates if this can be the target of resize elements
   | var isResizeable = interact('input[type=text]').resizable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on resize events (object makes the Interactable resizable)
 = (object) This Interactable
   | interact(element).resizable({
   |   onstart: function (event) {},
   |   onmove : function (event) {},
   |   onend  : function (event) {},
   |
   |   edges: {
   |     top   : true,       // Use pointer coords to check for resize.
   |     left  : false,      // Disable resizing from left edge.
   |     bottom: '.resize-s',// Resize if pointer target matches selector
   |     right : handleEl    // Resize if pointer target is the given Element
   |   },
   |
   |     // Width and height can be adjusted independently. When `true`, width and
   |     // height are adjusted at a 1:1 ratio.
   |     square: false,
   |
   |     // Width and height can be adjusted independently. When `true`, width and
   |     // height maintain the aspect ratio they had when resizing started.
   |     preserveAspectRatio: false,
   |
   |   // a value of 'none' will limit the resize rect to a minimum of 0x0
   |   // 'negate' will allow the rect to have negative width/height
   |   // 'reposition' will keep the width/height positive by swapping
   |   // the top and bottom edges and/or swapping the left and right edges
   |   invert: 'none' || 'negate' || 'reposition'
   |
   |   // limit multiple resizes.
   |   // See the explanation in the @Interactable.draggable example
   |   max: Infinity,
   |   maxPerElement: 1,
   | });
  \*/
Interactable.prototype.resizable = function (options) {
  if (utils.isObject(options)) {
    this.options.resize.enabled = options.enabled === false ? false : true;
    this.setPerAction('resize', options);
    this.setOnEvents('resize', options);

    if (/^x$|^y$|^xy$/.test(options.axis)) {
      this.options.resize.axis = options.axis;
    } else if (options.axis === null) {
      this.options.resize.axis = defaultOptions.resize.axis;
    }

    if (utils.isBool(options.preserveAspectRatio)) {
      this.options.resize.preserveAspectRatio = options.preserveAspectRatio;
    } else if (utils.isBool(options.square)) {
      this.options.resize.square = options.square;
    }

    return this;
  }
  if (utils.isBool(options)) {
    this.options.resize.enabled = options;

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
    var width = utils.isNumber(rect.width) ? rect.width : rect.right - rect.left;
    var height = utils.isNumber(rect.height) ? rect.height : rect.bottom - rect.top;

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
  if (!utils.isElement(element)) {
    return false;
  }

  return utils.isElement(value)
  // the value is an element to use as a resize handle
  ? value === element
  // otherwise check if element matches value as selector
  : utils.matchesUpTo(element, value, interactableElement);
}

Interaction.signals.on('new', function (interaction) {
  interaction.resizeAxes = 'xy';
});

InteractEvent.signals.on('set-delta', function (_ref4) {
  var interaction = _ref4.interaction;
  var iEvent = _ref4.iEvent;
  var action = _ref4.action;

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
utils.merge(Interactable.eventTypes, ['resizestart', 'resizemove', 'resizeinertiastart', 'resizeinertiaresume', 'resizeend']);
actions.methodDict.resize = 'resizable';

defaultOptions.resize = resize.defaults;

module.exports = resize;

},{"../InteractEvent":3,"../Interactable":4,"../Interaction":5,"../defaultOptions":17,"../utils":38,"../utils/browser":31,"./index":9}],11:[function(require,module,exports){
var raf = require('./utils/raf');
var getWindow = require('./utils/window').getWindow;
var isWindow = require('./utils/isType').isWindow;
var domUtils = require('./utils/domUtils');
var Interaction = require('./Interaction');
var defaultOptions = require('./defaultOptions');

var autoScroll = {
  defaults: {
    enabled: false,
    container: null, // the item that is scrolled (Window or HTMLElement)
    margin: 60,
    speed: 300 },

  // the scroll speed in pixels per second
  interaction: null,
  i: null, // the handle returned by window.setInterval
  x: 0, y: 0, // Direction each pulse is to scroll in

  isScrolling: false,
  prevTime: 0,

  start: function (interaction) {
    autoScroll.isScrolling = true;
    raf.cancel(autoScroll.i);

    autoScroll.interaction = interaction;
    autoScroll.prevTime = new Date().getTime();
    autoScroll.i = raf.request(autoScroll.scroll);
  },

  stop: function () {
    autoScroll.isScrolling = false;
    raf.cancel(autoScroll.i);
  },

  // scroll the window by the values in scroll.x/y
  scroll: function () {
    var options = autoScroll.interaction.target.options[autoScroll.interaction.prepared.name].autoScroll;
    var container = options.container || getWindow(autoScroll.interaction.element);
    var now = new Date().getTime();
    // change in time in seconds
    var dt = (now - autoScroll.prevTime) / 1000;
    // displacement
    var s = options.speed * dt;

    if (s >= 1) {
      if (isWindow(container)) {
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
  check: function (interactable, actionName) {
    var options = interactable.options;

    return options[actionName].autoScroll && options[actionName].autoScroll.enabled;
  },
  onInteractionMove: function (_ref) {
    var interaction = _ref.interaction;
    var pointer = _ref.pointer;

    if (!(interaction.interacting() && autoScroll.check(interaction.target, interaction.prepared.name))) {
      return;
    }

    if (interaction.simulation) {
      autoScroll.x = autoScroll.y = 0;
      return;
    }

    var top = undefined;
    var right = undefined;
    var bottom = undefined;
    var left = undefined;

    var options = interaction.target.options[interaction.prepared.name].autoScroll;
    var container = options.container || getWindow(interaction.element);

    if (isWindow(container)) {
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

Interaction.signals.on('stop-active', function () {
  autoScroll.stop();
});

Interaction.signals.on('action-move', autoScroll.onInteractionMove);

defaultOptions.perAction.autoScroll = autoScroll.defaults;

module.exports = autoScroll;

},{"./Interaction":5,"./defaultOptions":17,"./utils/domUtils":33,"./utils/isType":40,"./utils/raf":44,"./utils/window":45}],12:[function(require,module,exports){
var autoStart = require('./index');
var Interaction = require('../Interaction');

Interaction.signals.on('new', function (interaction) {
  interaction.delayTimer = null;
});

autoStart.signals.on('prepared', function (_ref) {
  var interaction = _ref.interaction;

  var actionName = interaction.prepared.name;

  if (!actionName) {
    return;
  }

  var delay = interaction.target.options[actionName].delay;

  if (delay > 0) {
    interaction.delayTimer = setTimeout(function () {
      interaction.start(interaction.prepared, interaction.target, interaction.element);
    }, delay);
  }
});

Interaction.signals.on('move', function (_ref2) {
  var interaction = _ref2.interaction;
  var duplicate = _ref2.duplicate;

  if (interaction.pointerWasMoved && !duplicate) {
    clearTimeout(interaction.delayTimer);
  }
});

// prevent regular down->move autoStart
autoStart.signals.on('before-start', function (_ref3) {
  var interaction = _ref3.interaction;

  var actionName = interaction.prepared.name;

  if (!actionName) {
    return;
  }

  var delay = interaction.target.options[actionName].delay;

  if (delay > 0) {
    interaction.prepared.name = null;
  }
});

},{"../Interaction":5,"./index":15}],13:[function(require,module,exports){
var autoStart = require('./index');
var scope = require('../scope');
var browser = require('../utils/browser');

var _require = require('../utils/isType');

var isElement = _require.isElement;

var _require2 = require('../utils/domUtils');

var matchesSelector = _require2.matchesSelector;
var parentNode = _require2.parentNode;

require('./index').setActionDefaults(require('../actions/drag'));

autoStart.signals.on('before-start', function (_ref) {
  var interaction = _ref.interaction;
  var eventTarget = _ref.eventTarget;
  var dx = _ref.dx;
  var dy = _ref.dy;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  // check if a drag is in the correct axis
  var absX = Math.abs(dx);
  var absY = Math.abs(dy);
  var dragOptions = interaction.target.options.drag;
  var startAxis = dragOptions.startAxis;
  var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';

  interaction.prepared.axis = dragOptions.lockAxis === 'start' ? currentAxis : dragOptions.lockAxis;

  // if the movement isn't in the startAxis of the interactable
  if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
    // cancel the prepared action
    interaction.prepared.name = null;

    // then try to get a drag from another ineractable

    if (!interaction.prepared.name) {
      (function () {

        var element = eventTarget;

        var getDraggable = function (interactable, selector, context) {
          var elements = browser.useMatchesSelectorPolyfill ? context.querySelectorAll(selector) : undefined;

          if (interactable === interaction.target) {
            return;
          }

          var action = null;

          if (interactable.inContext(eventTarget) && !interactable.options.drag.manualStart && !autoStart.testIgnore(interactable, element, eventTarget) && autoStart.testAllow(interactable, element, eventTarget) && matchesSelector(element, selector, elements)) {

            action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
          }
          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && autoStart.withinInteractionLimit(interactable, element, { name: 'drag' })) {

            return interactable;
          }
        };

        var action = null;

        // check all interactables
        while (isElement(element)) {
          var elementInteractable = scope.interactables.get(element);

          if (elementInteractable && elementInteractable !== interaction.target && !elementInteractable.options.drag.manualStart) {

            action = elementInteractable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
          }
          if (action && action.name === 'drag' && checkStartAxis(currentAxis, elementInteractable)) {

            interaction.prepared.name = 'drag';
            interaction.target = elementInteractable;
            interaction.element = element;
            break;
          }

          var selectorInteractable = scope.interactables.forEachSelector(getDraggable);

          if (selectorInteractable) {
            interaction.prepared.name = 'drag';
            interaction.target = selectorInteractable;
            interaction.element = element;
            break;
          }

          element = parentNode(element);
        }
      })();
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

},{"../actions/drag":6,"../scope":28,"../utils/browser":31,"../utils/domUtils":33,"../utils/isType":40,"./index":15}],14:[function(require,module,exports){
require('./index').setActionDefaults(require('../actions/gesture'));

},{"../actions/gesture":8,"./index":15}],15:[function(require,module,exports){
var interact = require('../interact');
var Interactable = require('../Interactable');
var Interaction = require('../Interaction');
var actions = require('../actions');
var defaultOptions = require('../defaultOptions');
var browser = require('../utils/browser');
var scope = require('../scope');
var utils = require('../utils');
var signals = require('../utils/Signals')['new']();

var autoStart = {
  signals: signals,
  testIgnore: testIgnore,
  testAllow: testAllow,
  withinInteractionLimit: withinInteractionLimit,
  // Allow this many interactions to happen simultaneously
  maxInteractions: Infinity,
  perActionDefaults: {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1
  },
  setActionDefaults: function (action) {
    utils.extend(action.defaults, autoStart.perActionDefaults);
  }
};

function testIgnore(interactable, interactableElement, element) {
  var ignoreFrom = interactable.options.ignoreFrom;

  if (!ignoreFrom || !utils.isElement(element)) {
    return false;
  }

  if (utils.isString(ignoreFrom)) {
    return utils.matchesUpTo(element, ignoreFrom, interactableElement);
  } else if (utils.isElement(ignoreFrom)) {
    return utils.nodeContains(ignoreFrom, element);
  }

  return false;
}

function testAllow(interactable, interactableElement, element) {
  var allowFrom = interactable.options.allowFrom;

  if (!allowFrom) {
    return true;
  }

  if (!utils.isElement(element)) {
    return false;
  }

  if (utils.isString(allowFrom)) {
    return utils.matchesUpTo(element, allowFrom, interactableElement);
  } else if (utils.isElement(allowFrom)) {
    return utils.nodeContains(allowFrom, element);
  }

  return false;
}

// set cursor style on mousedown
Interaction.signals.on('down', function (_ref2) {
  var interaction = _ref2.interaction;
  var pointer = _ref2.pointer;
  var event = _ref2.event;
  var eventTarget = _ref2.eventTarget;

  if (interaction.interacting()) {
    return;
  }

  var actionInfo = getActionInfo(interaction, pointer, event, eventTarget);
  prepare(interaction, actionInfo);
});

// set cursor style on mousemove
Interaction.signals.on('move', function (_ref3) {
  var interaction = _ref3.interaction;
  var pointer = _ref3.pointer;
  var event = _ref3.event;
  var eventTarget = _ref3.eventTarget;

  if (!interaction.mouse || interaction.pointerIsDown) {
    return;
  }

  var actionInfo = getActionInfo(interaction, pointer, event, eventTarget);
  prepare(interaction, actionInfo);
});

Interaction.signals.on('move', function (arg) {
  var interaction = arg.interaction;
  var event = arg.event;

  if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
    return;
  }

  signals.fire('before-start', arg);

  var target = interaction.target;

  if (interaction.prepared.name && target) {
    // check manualStart and interaction limit
    if (target.options[interaction.prepared.name].manualStart || !withinInteractionLimit(target, interaction.element, interaction.prepared)) {
      interaction.stop(event);
    } else {
      interaction.start(interaction.prepared, target, interaction.element);
    }
  }
});

// Check if the current target supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction(action, interactable) {
  if (utils.isObject(action) && interactable.options[action.name].enabled) {
    return action;
  }

  return null;
}

function validateSelector(interaction, pointer, event, matches, matchElements) {
  for (var i = 0, len = matches.length; i < len; i++) {
    var match = matches[i];
    var matchElement = matchElements[i];
    var action = validateAction(match.getAction(pointer, event, interaction, matchElement), match);

    if (action && withinInteractionLimit(match, matchElement, action)) {
      return {
        action: action,
        target: match,
        element: matchElement
      };
    }
  }

  return {};
}

function getActionInfo(interaction, pointer, event, eventTarget) {
  var matches = [];
  var matchElements = [];

  var element = eventTarget;
  var action = null;

  function pushMatches(interactable, selector, context) {
    var elements = browser.useMatchesSelectorPolyfill ? context.querySelectorAll(selector) : undefined;

    if (interactable.inContext(element) && !module.exports.testIgnore(interactable, element, eventTarget) && module.exports.testAllow(interactable, element, eventTarget) && utils.matchesSelector(element, selector, elements)) {

      matches.push(interactable);
      matchElements.push(element);
    }
  }

  while (utils.isElement(element)) {
    matches = [];
    matchElements = [];

    var elementInteractable = scope.interactables.get(element);

    if (elementInteractable && (action = validateAction(elementInteractable.getAction(pointer, event, interaction, element), elementInteractable)) && !elementInteractable.options[action.name].manualStart) {
      return {
        element: element,
        action: action,
        target: elementInteractable
      };
    } else {
      scope.interactables.forEachSelector(pushMatches);

      var actionInfo = validateSelector(interaction, pointer, event, matches, matchElements);

      if (actionInfo.action && !actionInfo.target.options[actionInfo.action.name].manualStart) {
        return actionInfo;
      }
    }

    element = utils.parentNode(element);
  }

  return {};
}

function prepare(interaction, _ref4) {
  var action = _ref4.action;
  var target = _ref4.target;
  var element = _ref4.element;

  action = action || {};

  if (interaction.target && interaction.target.options.styleCursor) {
    interaction.target._doc.documentElement.style.cursor = '';
  }

  interaction.target = target;
  interaction.element = element;
  utils.copyAction(interaction.prepared, action);

  if (target && target.options.styleCursor) {
    var cursor = action ? actions[action.name].getCursor(action) : '';
    interaction.target._doc.documentElement.style.cursor = cursor;
  }

  signals.fire('prepared', { interaction: interaction });
}

Interactable.prototype.getAction = function (pointer, event, interaction, element) {
  var action = this.defaultActionChecker(pointer, event, interaction, element);

  if (this.options.actionChecker) {
    return this.options.actionChecker(pointer, event, action, this, element, interaction);
  }

  return action;
};

/*\
 * Interactable.actionChecker
 [ method ]
 *
 * Gets or sets the function used to check action to be performed on
 * pointerDown
 *
 - checker (function | null) #optional A function which takes a pointer event, defaultAction string, interactable, element and interaction as parameters and returns an object with name property 'drag' 'resize' or 'gesture' and optionally an `edges` object with boolean 'top', 'left', 'bottom' and right props.
 = (Function | Interactable) The checker function or this Interactable
 *
 | interact('.resize-drag')
 |   .resizable(true)
 |   .draggable(true)
 |   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
 |
 |   if (interact.matchesSelector(event.target, '.drag-handle') {
 |     // force drag with handle target
 |     action.name = drag;
 |   }
 |   else {
 |     // resize from the top and right edges
 |     action.name  = 'resize';
 |     action.edges = { top: true, right: true };
 |   }
 |
 |   return action;
 | });
\*/
Interactable.prototype.actionChecker = function (checker) {
  if (utils.isFunction(checker)) {
    this.options.actionChecker = checker;

    return this;
  }

  if (checker === null) {
    delete this.options.actionChecker;

    return this;
  }

  return this.options.actionChecker;
};

/*\
 * Interactable.styleCursor
 [ method ]
 *
 * Returns or sets whether the the cursor should be changed depending on the
 * action that would be performed if the mouse were pressed and dragged.
 *
 - newValue (boolean) #optional
 = (boolean | Interactable) The current setting or this Interactable
\*/
Interactable.prototype.styleCursor = function (newValue) {
  if (utils.isBool(newValue)) {
    this.options.styleCursor = newValue;

    return this;
  }

  if (newValue === null) {
    delete this.options.styleCursor;

    return this;
  }

  return this.options.styleCursor;
};

/*\
 * Interactable.ignoreFrom
 [ method ]
 *
 * If the target of the `mousedown`, `pointerdown` or `touchstart`
 * event or any of it's parents match the given CSS selector or
 * Element, no drag/resize/gesture is started.
 *
 - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to not ignore any elements
 = (string | Element | object) The current ignoreFrom value or this Interactable
 **
 | interact(element, { ignoreFrom: document.getElementById('no-action') });
 | // or
 | interact(element).ignoreFrom('input, textarea, a');
\*/
Interactable.prototype.ignoreFrom = function (newValue) {
  if (utils.trySelector(newValue)) {
    // CSS selector to match event.target
    this.options.ignoreFrom = newValue;
    return this;
  }

  if (utils.isElement(newValue)) {
    // specific element
    this.options.ignoreFrom = newValue;
    return this;
  }

  return this.options.ignoreFrom;
};

/*\
 * Interactable.allowFrom
 [ method ]
 *
 * A drag/resize/gesture is started only If the target of the
 * `mousedown`, `pointerdown` or `touchstart` event or any of it's
 * parents match the given CSS selector or Element.
 *
 - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to allow from any element
 = (string | Element | object) The current allowFrom value or this Interactable
 **
 | interact(element, { allowFrom: document.getElementById('drag-handle') });
 | // or
 | interact(element).allowFrom('.handle');
\*/
Interactable.prototype.allowFrom = function (newValue) {
  if (utils.trySelector(newValue)) {
    // CSS selector to match event.target
    this.options.allowFrom = newValue;
    return this;
  }

  if (utils.isElement(newValue)) {
    // specific element
    this.options.allowFrom = newValue;
    return this;
  }

  return this.options.allowFrom;
};

Interaction.signals.on('stop', function (_ref5) {
  var interaction = _ref5.interaction;

  var target = interaction.target;

  if (target && target.options.styleCursor) {
    target._doc.documentElement.style.cursor = '';
  }
});

Interactable.prototype.defaultActionChecker = function (pointer, event, interaction, element) {
  var rect = this.getRect(element);
  var action = null;

  for (var _iterator = actions.names, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var actionName = _ref;

    action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

    if (action) {
      return action;
    }
  }
};

function withinInteractionLimit(interactable, element, action) {
  var options = interactable.options;
  var maxActions = options[action.name].max;
  var maxPerElement = options[action.name].maxPerElement;
  var activeInteractions = 0;
  var targetCount = 0;
  var targetElementCount = 0;

  // no actions if any of these values == 0
  if (!(maxActions && maxPerElement && autoStart.maxInteractions)) {
    return;
  }

  for (var i = 0, len = scope.interactions.length; i < len; i++) {
    var interaction = scope.interactions[i];
    var otherAction = interaction.prepared.name;

    if (!interaction.interacting()) {
      continue;
    }

    activeInteractions++;

    if (activeInteractions >= autoStart.maxInteractions) {
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

  return autoStart.maxInteractions > 0;
}

/*\
 * interact.maxInteractions
 [ method ]
 **
 * Returns or sets the maximum number of concurrent interactions allowed.
 * By default only 1 interaction is allowed at a time (for backwards
 * compatibility). To allow multiple interactions on the same Interactables
 * and elements, you need to enable it in the draggable, resizable and
 * gesturable `'max'` and `'maxPerElement'` options.
 **
 - newValue (number) #optional Any number. newValue <= 0 means no interactions.
\*/
interact.maxInteractions = function (newValue) {
  if (utils.isNumber(newValue)) {
    autoStart.maxInteractions = newValue;

    return this;
  }

  return autoStart.maxInteractions;
};

Interactable.settingsMethods.push('styleCursor');
Interactable.settingsMethods.push('actionChecker');
Interactable.settingsMethods.push('ignoreFrom');
Interactable.settingsMethods.push('allowFrom');

defaultOptions.base.actionChecker = null;
defaultOptions.base.ignoreFrom = null;
defaultOptions.base.allowFrom = null;
defaultOptions.base.styleCursor = true;

utils.extend(defaultOptions.perAction, autoStart.perActionDefaults);

module.exports = autoStart;

},{"../Interactable":4,"../Interaction":5,"../actions":9,"../defaultOptions":17,"../interact":20,"../scope":28,"../utils":38,"../utils/Signals":29,"../utils/browser":31}],16:[function(require,module,exports){
require('./index').setActionDefaults(require('../actions/resize'));

},{"../actions/resize":10,"./index":15}],17:[function(require,module,exports){
module.exports = {
  base: {
    accept: null,
    preventDefault: 'auto',
    origin: { x: 0, y: 0 },
    deltaSource: 'page',
    allowFrom: null
  },

  perAction: {
    inertia: {
      enabled: false,
      resistance: 10, // the lambda in exponential decay
      minSpeed: 100, // target speed must be above this for inertia to start
      endSpeed: 10, // the speed at which inertia is slow enough to stop
      allowResume: true, // allow resuming an action in inertia phase
      smoothEndDuration: 300 }
  },

  // animate to snap/restrict endOnly if there's no inertia
  _holdDuration: 600
};

},{}],18:[function(require,module,exports){
/* browser entry point */

// Legacy browser support
require('./legacyBrowsers');

// pointerEvents
require('./pointerEvents');
require('./pointerEvents/interactableTargets');

// inertia
require('./inertia');

// modifiers
require('./modifiers/snap');
require('./modifiers/restrict');

// delay
require('./autoStart/delay');

// actions
require('./autoStart/gesture');
require('./autoStart/resize');
require('./autoStart/drag');

require('./actions/drop');

// Interactable preventDefault setting
require('./interactablePreventDefault.js');

// autoScroll
require('./autoScroll');

// export interact
module.exports = require('./interact');

},{"./actions/drop":7,"./autoScroll":11,"./autoStart/delay":12,"./autoStart/drag":13,"./autoStart/gesture":14,"./autoStart/resize":16,"./inertia":19,"./interact":20,"./interactablePreventDefault.js":21,"./legacyBrowsers":22,"./modifiers/restrict":24,"./modifiers/snap":25,"./pointerEvents":26,"./pointerEvents/interactableTargets":27}],19:[function(require,module,exports){
var InteractEvent = require('./InteractEvent');
var Interaction = require('./Interaction');
var modifiers = require('./modifiers');
var utils = require('./utils');
var animationFrame = require('./utils/raf');

Interaction.signals.on('new', function (interaction) {
  interaction.inertiaStatus = {
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

  interaction.boundInertiaFrame = function () {
    return inertiaFrame.apply(interaction);
  };
  interaction.boundSmoothEndFrame = function () {
    return smoothEndFrame.apply(interaction);
  };
});

Interaction.signals.on('down', function (_ref) {
  var interaction = _ref.interaction;
  var event = _ref.event;
  var pointer = _ref.pointer;
  var eventTarget = _ref.eventTarget;

  var status = interaction.inertiaStatus;

  // Check if the down event hits the current inertia target
  if (status.active) {
    var element = eventTarget;

    // climb up the DOM tree from the event target
    while (utils.isElement(element)) {

      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        animationFrame.cancel(status.i);
        status.active = false;
        interaction.simulation = null;

        // update pointers to the down event's coordinates
        interaction.updatePointer(pointer);
        utils.setCoords(interaction.curCoords, interaction.pointers);

        // fire appropriate signals
        var signalArg = { interaction: interaction };
        Interaction.signals.fire('before-action-move', signalArg);
        Interaction.signals.fire('action-resume', signalArg);

        // fire a reume event
        var resumeEvent = new InteractEvent(interaction, event, interaction.prepared.name, 'inertiaresume', interaction.element);

        interaction.target.fire(resumeEvent);
        interaction.prevEvent = resumeEvent;
        modifiers.resetStatuses(interaction.modifierStatuses);

        utils.copyCoords(interaction.prevCoords, interaction.curCoords);
        break;
      }

      element = utils.parentNode(element);
    }
  }
});

Interaction.signals.on('up', function (_ref2) {
  var interaction = _ref2.interaction;
  var pointer = _ref2.pointer;
  var event = _ref2.event;

  var status = interaction.inertiaStatus;

  if (!interaction.interacting() || status.active) {
    return;
  }

  var target = interaction.target;
  var options = target && target.options;
  var inertiaOptions = options && interaction.prepared.name && options[interaction.prepared.name].inertia;

  var now = new Date().getTime();
  var statuses = {};
  var page = utils.extend({}, interaction.curCoords.page);
  var pointerSpeed = interaction.pointerDelta.client.speed;
  var inertiaPossible = false;
  var inertia = false;
  var smoothEnd = false;
  var modifierResult = undefined;

  // check if inertia should be started
  inertiaPossible = inertiaOptions && inertiaOptions.enabled && interaction.prepared.name !== 'gesture' && event !== status.startEvent;

  inertia = inertiaPossible && now - interaction.curCoords.timeStamp < 50 && pointerSpeed > inertiaOptions.minSpeed && pointerSpeed > inertiaOptions.endSpeed;

  // smoothEnd
  if (inertiaPossible && !inertia) {
    modifiers.resetStatuses(statuses);

    modifierResult = modifiers.setAll(interaction, page, statuses, true, true);

    if (modifierResult.shouldMove && modifierResult.locked) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) {
    return;
  }

  utils.copyCoords(status.upCoords, interaction.curCoords);

  interaction.pointers[0] = status.startEvent = new InteractEvent(interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

  status.t0 = now;

  status.active = true;
  status.allowResume = inertiaOptions.allowResume;
  interaction.simulation = status;

  target.fire(status.startEvent);

  if (inertia) {
    status.vx0 = interaction.pointerDelta.client.vx;
    status.vy0 = interaction.pointerDelta.client.vy;
    status.v0 = pointerSpeed;

    calcInertia(interaction, status);

    utils.extend(page, interaction.curCoords.page);

    page.x += status.xe;
    page.y += status.ye;

    modifiers.resetStatuses(statuses);

    modifierResult = modifiers.setAll(interaction, page, statuses, true, true);

    status.modifiedXe += modifierResult.dx;
    status.modifiedYe += modifierResult.dy;

    status.i = animationFrame.request(interaction.boundInertiaFrame);
  } else {
    status.smoothEnd = true;
    status.xe = modifierResult.dx;
    status.ye = modifierResult.dy;

    status.sx = status.sy = 0;

    status.i = animationFrame.request(interaction.boundSmoothEndFrame);
  }

  interaction.removePointer(pointer);
});

Interaction.signals.on('stop-active', function (_ref3) {
  var interaction = _ref3.interaction;

  var status = interaction.inertiaStatus;

  if (status.active) {
    animationFrame.cancel(status.i);
    status.active = false;
    interaction.simulation = null;
  }
});

function calcInertia(interaction, status) {
  var inertiaOptions = interaction.target.options[interaction.prepared.name].inertia;
  var lambda = inertiaOptions.resistance;
  var inertiaDur = -Math.log(inertiaOptions.endSpeed / status.v0) / lambda;

  status.x0 = interaction.prevEvent.pageX;
  status.y0 = interaction.prevEvent.pageY;
  status.t0 = status.startEvent.timeStamp / 1000;
  status.sx = status.sy = 0;

  status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
  status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
  status.te = inertiaDur;

  status.lambda_v0 = lambda / status.v0;
  status.one_ve_v0 = 1 - inertiaOptions.endSpeed / status.v0;
}

function inertiaFrame() {
  updateInertiaCoords(this);
  utils.setCoordDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

  var status = this.inertiaStatus;
  var options = this.target.options[this.prepared.name].inertia;
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

    this.doMove();

    status.i = animationFrame.request(this.boundInertiaFrame);
  } else {
    status.sx = status.modifiedXe;
    status.sy = status.modifiedYe;

    this.doMove();
    this.end(status.startEvent);
    status.active = false;
    this.simulation = null;
  }

  utils.copyCoords(this.prevCoords, this.curCoords);
}

function smoothEndFrame() {
  updateInertiaCoords(this);

  var status = this.inertiaStatus;
  var t = new Date().getTime() - status.t0;
  var duration = this.target.options[this.prepared.name].inertia.smoothEndDuration;

  if (t < duration) {
    status.sx = utils.easeOutQuad(t, 0, status.xe, duration);
    status.sy = utils.easeOutQuad(t, 0, status.ye, duration);

    this.pointerMove(status.startEvent, status.startEvent);

    status.i = animationFrame.request(this.boundSmoothEndFrame);
  } else {
    status.sx = status.xe;
    status.sy = status.ye;

    this.pointerMove(status.startEvent, status.startEvent);
    this.end(status.startEvent);

    status.smoothEnd = status.active = false;
    this.simulation = null;
  }
}

function updateInertiaCoords(interaction) {
  var status = interaction.inertiaStatus;

  // return if inertia isn't running
  if (!status.active) {
    return;
  }

  var pageUp = status.upCoords.page;
  var clientUp = status.upCoords.client;

  utils.setCoords(interaction.curCoords, [{
    pageX: pageUp.x + status.sx,
    pageY: pageUp.y + status.sy,
    clientX: clientUp.x + status.sx,
    clientY: clientUp.y + status.sy
  }]);
}

},{"./InteractEvent":3,"./Interaction":5,"./modifiers":23,"./utils":38,"./utils/raf":44}],20:[function(require,module,exports){
var browser = require('./utils/browser');
var events = require('./utils/events');
var utils = require('./utils');
var scope = require('./scope');
var Interactable = require('./Interactable');
var Interaction = require('./Interaction');

var globalEvents = {};

/*\
 * interact
 [ method ]
 *
 * The methods of this variable can be used to set elements as
 * interactables and also to change various default settings.
 *
 * Calling it as a function and passing an element or a valid CSS selector
 * string returns an Interactable object which has various methods to
 * configure it.
 *
 - element (Element | string) The HTML or SVG Element to interact with or CSS selector
 = (object) An @Interactable
 *
 > Usage
 | interact('#draggable').draggable(true);
 |
 | var rectables = interact('rect');
 | rectables
 |     .gesturable(true)
 |     .on('gesturemove', function (event) {
 |         // ...
 |     });
\*/
function interact(element, options) {
  var interactable = scope.interactables.get(element, options);

  if (!interactable) {
    interactable = new Interactable(element, options);
    interactable._iEvents.global = globalEvents;
  }

  return interactable;
}

/*\
 * interact.isSet
 [ method ]
 *
 * Check if an element has been set
 - element (Element) The Element being searched for
 = (boolean) Indicates if the element or CSS selector was previously passed to interact
\*/
interact.isSet = function (element, options) {
  return scope.interactables.indexOfElement(element, options && options.context) !== -1;
};

/*\
 * interact.on
 [ method ]
 *
 * Adds a global listener for an InteractEvent or adds a DOM event to
 * `document`
 *
 - type       (string | array | object) The types of events to listen for
 - listener   (function) The function event (s)
 - useCapture (boolean) #optional useCapture flag for addEventListener
 = (object) interact
\*/
interact.on = function (type, listener, useCapture) {
  if (utils.isString(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.isArray(type)) {
    for (var _iterator = type, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var eventType = _ref;

      interact.on(eventType, listener, useCapture);
    }

    return interact;
  }

  if (utils.isObject(type)) {
    for (var prop in type) {
      interact.on(prop, type[prop], listener);
    }

    return interact;
  }

  // if it is an InteractEvent type, add listener to globalEvents
  if (utils.contains(Interactable.eventTypes, type)) {
    // if this type of event was never bound
    if (!globalEvents[type]) {
      globalEvents[type] = [listener];
    } else {
      globalEvents[type].push(listener);
    }
  }
  // If non InteractEvent type, addEventListener to document
  else {
      events.add(scope.document, type, listener, useCapture);
    }

  return interact;
};

/*\
 * interact.off
 [ method ]
 *
 * Removes a global InteractEvent listener or DOM event from `document`
 *
 - type       (string | array | object) The types of events that were listened for
 - listener   (function) The listener function to be removed
 - useCapture (boolean) #optional useCapture flag for removeEventListener
 = (object) interact
 \*/
interact.off = function (type, listener, useCapture) {
  if (utils.isString(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.isArray(type)) {
    for (var _iterator2 = type, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var eventType = _ref2;

      interact.off(eventType, listener, useCapture);
    }

    return interact;
  }

  if (utils.isObject(type)) {
    for (var prop in type) {
      interact.off(prop, type[prop], listener);
    }

    return interact;
  }

  if (!utils.contains(Interactable.eventTypes, type)) {
    events.remove(scope.document, type, listener, useCapture);
  } else {
    var index = undefined;

    if (type in globalEvents && (index = utils.indexOf(globalEvents[type], listener)) !== -1) {
      globalEvents[type].splice(index, 1);
    }
  }

  return interact;
};

/*\
 * interact.debug
 [ method ]
 *
 * Returns an object which exposes internal data
 = (object) An object with properties that outline the current state and expose internal functions and variables
\*/
interact.debug = function () {
  return scope;
};

// expose the functions used to calculate multi-touch properties
interact.getPointerAverage = utils.pointerAverage;
interact.getTouchBBox = utils.touchBBox;
interact.getTouchDistance = utils.touchDistance;
interact.getTouchAngle = utils.touchAngle;

interact.getElementRect = utils.getElementRect;
interact.getElementClientRect = utils.getElementClientRect;
interact.matchesSelector = utils.matchesSelector;
interact.closest = utils.closest;

/*\
 * interact.supportsTouch
 [ method ]
 *
 = (boolean) Whether or not the browser supports touch input
\*/
interact.supportsTouch = function () {
  return browser.supportsTouch;
};

/*\
 * interact.supportsPointerEvent
 [ method ]
 *
 = (boolean) Whether or not the browser supports PointerEvents
\*/
interact.supportsPointerEvent = function () {
  return browser.supportsPointerEvent;
};

/*\
 * interact.stop
 [ method ]
 *
 * Cancels all interactions (end events are not fired)
 *
 - event (Event) An event on which to call preventDefault()
 = (object) interact
\*/
interact.stop = function (event) {
  for (var i = scope.interactions.length - 1; i >= 0; i--) {
    scope.interactions[i].stop(event);
  }

  return interact;
};

/*\
 * interact.pointerMoveTolerance
 [ method ]
 * Returns or sets the distance the pointer must be moved before an action
 * sequence occurs. This also affects tolerance for tap events.
 *
 - newValue (number) #optional The movement from the start position must be greater than this value
 = (number | Interactable) The current setting or interact
\*/
interact.pointerMoveTolerance = function (newValue) {
  if (utils.isNumber(newValue)) {
    Interaction.pointerMoveTolerance = newValue;

    return this;
  }

  return Interaction.pointerMoveTolerance;
};

interact.addDocument = scope.addDocument;
interact.removeDocument = scope.removeDocument;

scope.interact = interact;

module.exports = interact;

},{"./Interactable":4,"./Interaction":5,"./scope":28,"./utils":38,"./utils/browser":31,"./utils/events":34}],21:[function(require,module,exports){
var Interactable = require('./Interactable');
var Interaction = require('./Interaction');
var scope = require('./scope');
var isType = require('./utils/isType');

var _require = require('./utils/domUtils');

var nodeContains = _require.nodeContains;

/*\
 * Interactable.preventDefault
 [ method ]
 *
 * Returns or sets whether to prevent the browser's default behaviour
 * in response to pointer events. Can be set to:
 *  - `'always'` to always prevent
 *  - `'never'` to never prevent
 *  - `'auto'` to let interact.js try to determine what would be best
 *
 - newValue (string) #optional `true`, `false` or `'auto'`
 = (string | Interactable) The current setting or this Interactable
\*/
Interactable.prototype.preventDefault = function (newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    this.options.preventDefault = newValue;
    return this;
  }

  if (isType.isBool(newValue)) {
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

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  }

  // don't preventDefault on input elements
  if (/^(input|select|textarea)$/i.test(event.target.nodeName)) {
    return;
  }

  event.preventDefault();
};

function onInteractionEvent(_ref2) {
  var interaction = _ref2.interaction;
  var event = _ref2.event;

  if (interaction.target) {
    interaction.target.checkAndPreventDefault(event);
  }
}

var _arr = ['down', 'move', 'up', 'cancel'];
for (var _i = 0; _i < _arr.length; _i++) {
  var eventSignal = _arr[_i];
  Interaction.signals.on(eventSignal, onInteractionEvent);
}

// prevent native HTML5 drag on interact.js target elements
Interaction.docEvents.dragstart = function preventNativeDrag(event) {
  for (var _iterator = scope.interactions, _isArray = Array.isArray(_iterator), _i2 = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i2 >= _iterator.length) break;
      _ref = _iterator[_i2++];
    } else {
      _i2 = _iterator.next();
      if (_i2.done) break;
      _ref = _i2.value;
    }

    var interaction = _ref;

    if (interaction.element && (interaction.element === event.target || nodeContains(interaction.element, event.target))) {

      interaction.target.checkAndPreventDefault(event);
      return;
    }
  }
};

},{"./Interactable":4,"./Interaction":5,"./scope":28,"./utils/domUtils":33,"./utils/isType":40}],22:[function(require,module,exports){
var scope = require('./scope');
var events = require('./utils/events');
var browser = require('./utils/browser');
var iFinder = require('./utils/interactionFinder');

var toString = Object.prototype.toString;

if (!window.Array.isArray) {
  window.Array.isArray = function (obj) {
    return toString.call(obj) === '[object Array]';
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

// http://www.quirksmode.org/dom/events/click.html
// >Events leading to dblclick
//
// IE8 doesn't fire down event before dblclick.
// This workaround tries to fire a tap and doubletap after dblclick
function onIE8Dblclick(event) {
  var interaction = iFinder.search(event, event.type, event.target);

  if (!interaction) {
    return;
  }

  if (interaction.prevTap && event.clientX === interaction.prevTap.clientX && event.clientY === interaction.prevTap.clientY && event.target === interaction.prevTap.target) {

    interaction.downTargets[0] = event.target;
    interaction.downTimes[0] = new Date().getTime();

    scope.pointerEvents.collectEventTargets(interaction, event, event, event.target, 'tap');
  }
}

if (browser.isIE8) {
  (function () {
    var selectFix = function (event) {
      for (var _iterator = scope.interactions, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var interaction = _ref;

        if (interaction.interacting()) {
          interaction.target.checkAndPreventDefault(event);
        }
      }
    };

    var onDocIE8 = function onDocIE8(_ref2, signalName) {
      var doc = _ref2.doc;
      var win = _ref2.win;

      var eventMethod = signalName.indexOf('listen') === 0 ? events.add : events.remove;

      // For IE's lack of Event#preventDefault
      eventMethod(doc, 'selectstart', selectFix);

      if (scope.pointerEvents) {
        eventMethod(doc, 'dblclick', onIE8Dblclick);
      }
    };

    scope.signals.on('add-document', onDocIE8);
    scope.signals.on('remove-document', onDocIE8);
  })();
}

module.exports = null;

},{"./scope":28,"./utils/browser":31,"./utils/events":34,"./utils/interactionFinder":39}],23:[function(require,module,exports){
var InteractEvent = require('../InteractEvent');
var Interaction = require('../Interaction');
var extend = require('../utils/extend');

var modifiers = {
  names: [],

  setOffsets: function (interaction, coords) {
    var target = interaction.target;
    var element = interaction.element;

    var rect = target.getRect(element);

    if (rect) {
      interaction.startOffset.left = coords.page.x - rect.left;
      interaction.startOffset.top = coords.page.y - rect.top;

      interaction.startOffset.right = rect.right - coords.page.x;
      interaction.startOffset.bottom = rect.bottom - coords.page.y;

      if (!('width' in rect)) {
        rect.width = rect.right - rect.left;
      }
      if (!('height' in rect)) {
        rect.height = rect.bottom - rect.top;
      }
    } else {
      interaction.startOffset.left = interaction.startOffset.top = interaction.startOffset.right = interaction.startOffset.bottom = 0;
    }

    modifiers.setModifierOffsets(interaction, target, element, rect, interaction.modifierOffsets);
  },

  setModifierOffsets: function (interaction, interactable, element, rect, offsets) {
    for (var i = 0; i < modifiers.names.length; i++) {
      var modifierName = modifiers.names[i];

      offsets[modifierName] = modifiers[modifiers.names[i]].setOffset(interaction, interactable, element, rect, interaction.startOffset);
    }
  },

  setAll: function (interaction, coordsArg, statuses, preEnd, requireEndOnly) {
    var result = {
      dx: 0,
      dy: 0,
      changed: false,
      locked: false,
      shouldMove: true
    };
    var target = interaction.target;
    var coords = extend({}, coordsArg);

    var currentStatus = undefined;

    for (var _iterator = modifiers.names, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var modifierName = _ref;

      var modifier = modifiers[modifierName];

      if (!modifier.shouldDo(target, interaction.prepared.name, preEnd, requireEndOnly)) {
        continue;
      }

      currentStatus = modifier.set(coords, interaction, statuses[modifierName]);

      if (currentStatus.locked) {
        coords.x += currentStatus.dx;
        coords.y += currentStatus.dy;

        result.dx += currentStatus.dx;
        result.dy += currentStatus.dy;

        result.locked = true;
      }
    }

    // a move should be fired if the modified coords of
    // the last modifier status that was calculated changes
    result.shouldMove = !currentStatus || currentStatus.changed;

    return result;
  },

  resetStatuses: function (statuses) {
    for (var _iterator2 = modifiers.names, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var modifierName = _ref2;

      statuses[modifierName] = modifiers[modifierName].reset(statuses[modifierName] || {});
    }

    return statuses;
  },

  start: function (_ref3, signalName) {
    var interaction = _ref3.interaction;

    modifiers.setOffsets(interaction, signalName === 'action-resume' ? interaction.curCoords : interaction.startCoords);

    modifiers.resetStatuses(interaction.modifierStatuses);
    modifiers.setAll(interaction, interaction.startCoords.page, interaction.modifierStatuses);
  }
};

Interaction.signals.on('new', function (interaction) {
  interaction.startOffset = { left: 0, right: 0, top: 0, bottom: 0 };
  interaction.modifierOffsets = {};
  interaction.modifierStatuses = modifiers.resetStatuses({});
});

Interaction.signals.on('action-start', modifiers.start);
Interaction.signals.on('action-resume', modifiers.start);

Interaction.signals.on('before-action-move', function (_ref4) {
  var interaction = _ref4.interaction;
  var preEnd = _ref4.preEnd;
  var interactingBeforeMove = _ref4.interactingBeforeMove;

  var modifierResult = modifiers.setAll(interaction, interaction.curCoords.page, interaction.modifierStatuses, preEnd);

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interactingBeforeMove) {
    interaction._dontFireMove = true;
  }
});

Interaction.signals.on('action-end', function (_ref5) {
  var interaction = _ref5.interaction;
  var event = _ref5.event;

  for (var i = 0; i < modifiers.names.length; i++) {
    // if the endOnly option is true for any modifier
    if (modifiers[modifiers.names[i]].shouldDo(interaction.target, interaction.prepared.name, true, true)) {
      // fire a move event at the modified coordinates
      interaction.doMove({ event: event, preEnd: true });
      break;
    }
  }
});

InteractEvent.signals.on('set-xy', function (_ref6) {
  var iEvent = _ref6.iEvent;
  var interaction = _ref6.interaction;
  var page = _ref6.page;
  var client = _ref6.client;
  var phase = _ref6.phase;
  var actionName = _ref6.action;

  var target = interaction.target;

  for (var i = 0; i < modifiers.names.length; i++) {
    var modifierName = modifiers.names[i];
    var modifier = modifiers[modifierName];

    iEvent[modifierName] = modifier.modifyCoords(page, client, target, interaction.modifierStatuses[modifierName], actionName, phase);
  }
});

module.exports = modifiers;

},{"../InteractEvent":3,"../Interaction":5,"../utils/extend":35}],24:[function(require,module,exports){
var modifiers = require('./index');
var utils = require('../utils');
var defaultOptions = require('../defaultOptions');

var restrict = {
  defaults: {
    enabled: false,
    endOnly: false,
    restriction: null,
    elementRect: null
  },

  shouldDo: function (interactable, actionName, preEnd, requireEndOnly) {
    var restrictOptions = interactable.options[actionName].restrict;

    return restrictOptions && restrictOptions.enabled && (preEnd || !restrictOptions.endOnly) && (!requireEndOnly || restrictOptions.endOnly);
  },

  setOffset: function (interaction, interactable, element, rect, startOffset) {
    var elementRect = interactable.options[interaction.prepared.name].restrict.elementRect;
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
  },

  set: function (pageCoords, interaction, status) {
    var target = interaction.target;
    var restrictOptions = target && target.options[interaction.prepared.name].restrict;
    var restriction = restrictOptions && restrictOptions.restriction;

    if (!restriction) {
      return status;
    }

    var page = status.useStatusXY ? { x: status.x, y: status.y } : utils.extend({}, pageCoords);

    status.dx = 0;
    status.dy = 0;
    status.locked = false;

    var rect = undefined;
    var restrictedX = undefined;
    var restrictedY = undefined;

    if (utils.isString(restriction)) {
      if (restriction === 'parent') {
        restriction = utils.parentNode(interaction.element);
      } else if (restriction === 'self') {
        restriction = target.getRect(interaction.element);
      } else {
        restriction = utils.closest(interaction.element, restriction);
      }

      if (!restriction) {
        return status;
      }
    }

    if (utils.isFunction(restriction)) {
      restriction = restriction(page.x, page.y, interaction.element);
    }

    if (utils.isElement(restriction)) {
      restriction = utils.getElementRect(restriction);
    }

    rect = restriction;

    var offset = interaction.modifierOffsets.restrict;

    if (!restriction) {
      restrictedX = page.x;
      restrictedY = page.y;
    }
    // object is assumed to have
    // x, y, width, height or
    // left, top, right, bottom
    else if ('x' in restriction && 'y' in restriction) {
        restrictedX = Math.max(Math.min(rect.x + rect.width - offset.right, page.x), rect.x + offset.left);
        restrictedY = Math.max(Math.min(rect.y + rect.height - offset.bottom, page.y), rect.y + offset.top);
      } else {
        restrictedX = Math.max(Math.min(rect.right - offset.right, page.x), rect.left + offset.left);
        restrictedY = Math.max(Math.min(rect.bottom - offset.bottom, page.y), rect.top + offset.top);
      }

    status.dx = restrictedX - page.x;
    status.dy = restrictedY - page.y;

    status.changed = status.restrictedX !== restrictedX || status.restrictedY !== restrictedY;
    status.locked = !!(status.dx || status.dy);

    status.restrictedX = restrictedX;
    status.restrictedY = restrictedY;

    return status;
  },

  reset: function (status) {
    status.dx = status.dy = 0;
    status.modifiedX = status.modifiedY = NaN;
    status.locked = false;
    status.changed = true;

    return status;
  },

  modifyCoords: function (page, client, interactable, status, actionName, phase) {
    var options = interactable.options[actionName].restrict;
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
};

modifiers.restrict = restrict;
modifiers.names.push('restrict');

defaultOptions.perAction.restrict = restrict.defaults;

module.exports = restrict;

},{"../defaultOptions":17,"../utils":38,"./index":23}],25:[function(require,module,exports){
var modifiers = require('./index');
var interact = require('../interact');
var utils = require('../utils');
var defaultOptions = require('../defaultOptions');

var snap = {
  defaults: {
    enabled: false,
    endOnly: false,
    range: Infinity,
    targets: null,
    offsets: null,

    relativePoints: null
  },

  shouldDo: function (interactable, actionName, preEnd, requireEndOnly) {
    var snapOptions = interactable.options[actionName].snap;

    return snapOptions && snapOptions.enabled && (preEnd || !snapOptions.endOnly) && (!requireEndOnly || snapOptions.endOnly);
  },

  setOffset: function (interaction, interactable, element, rect, startOffset) {
    var offsets = [];
    var origin = utils.getOriginXY(interactable, element);
    var snapOptions = interactable.options[interaction.prepared.name].snap || {};
    var snapOffset = undefined;

    if (snapOptions.offset === 'startCoords') {
      snapOffset = {
        x: interaction.startCoords.page.x - origin.x,
        y: interaction.startCoords.page.y - origin.y
      };
    } else if (snapOptions.offset === 'self') {
      snapOffset = {
        x: rect.left - origin.x,
        y: rect.top - origin.y
      };
    } else {
      snapOffset = snapOptions.offset || { x: 0, y: 0 };
    }

    if (rect && snapOptions.relativePoints && snapOptions.relativePoints.length) {
      for (var _iterator = snapOptions.relativePoints, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var relativeX = _ref.x;
        var relativeY = _ref.y;

        offsets.push({
          x: startOffset.left - rect.width * relativeX + snapOffset.x,
          y: startOffset.top - rect.height * relativeY + snapOffset.y
        });
      }
    } else {
      offsets.push(snapOffset);
    }

    return offsets;
  },

  set: function (pageCoords, interaction, status) {
    var snapOptions = interaction.target.options[interaction.prepared.name].snap;
    var targets = [];
    var target = undefined;
    var page = undefined;
    var i = undefined;

    if (status.useStatusXY) {
      page = { x: status.x, y: status.y };
    } else {
      var origin = utils.getOriginXY(interaction.target, interaction.element);

      page = utils.extend({}, pageCoords);

      page.x -= origin.x;
      page.y -= origin.y;
    }

    status.realX = page.x;
    status.realY = page.y;

    var offsets = interaction.modifierOffsets.snap;
    var len = snapOptions.targets ? snapOptions.targets.length : 0;

    for (var _iterator2 = offsets, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var offsetX = _ref2.x;
      var offsetY = _ref2.y;

      var relativeX = page.x - offsetX;
      var relativeY = page.y - offsetY;

      for (var _iterator3 = snapOptions.targets, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref3;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref3 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref3 = _i3.value;
        }

        var snapTarget = _ref3;

        if (utils.isFunction(snapTarget)) {
          target = snapTarget(relativeX, relativeY, interaction);
        } else {
          target = snapTarget;
        }

        if (!target) {
          continue;
        }

        targets.push({
          x: utils.isNumber(target.x) ? target.x + offsetX : relativeX,
          y: utils.isNumber(target.y) ? target.y + offsetY : relativeY,

          range: utils.isNumber(target.range) ? target.range : snapOptions.range
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

    var snapChanged = undefined;

    if (closest.target) {
      snapChanged = status.snappedX !== closest.target.x || status.snappedY !== closest.target.y;

      status.snappedX = closest.target.x;
      status.snappedY = closest.target.y;
    } else {
      snapChanged = true;

      status.snappedX = NaN;
      status.snappedY = NaN;
    }

    status.dx = closest.dx;
    status.dy = closest.dy;

    status.changed = snapChanged || closest.inRange && !status.locked;
    status.locked = closest.inRange;

    return status;
  },

  reset: function (status) {
    status.dx = status.dy = 0;
    status.snappedX = status.snappedY = NaN;
    status.locked = false;
    status.changed = true;

    return status;
  },

  modifyCoords: function (page, client, interactable, status, actionName, phase) {
    var snapOptions = interactable.options[actionName].snap;
    var relativePoints = snapOptions && snapOptions.relativePoints;

    if (snapOptions && snapOptions.enabled && !(phase === 'start' && relativePoints && relativePoints.length)) {

      if (status.locked) {
        page.x += status.dx;
        page.y += status.dy;
        client.x += status.dx;
        client.y += status.dy;
      }

      return {
        range: status.range,
        locked: status.locked,
        x: status.snappedX,
        y: status.snappedY,
        realX: status.realX,
        realY: status.realY,
        dx: status.dx,
        dy: status.dy
      };
    }
  }
};

interact.createSnapGrid = function (grid) {
  return function (x, y) {
    var limits = grid.limits || {
      left: -Infinity,
      right: Infinity,
      top: -Infinity,
      bottom: Infinity
    };
    var offsetX = 0;
    var offsetY = 0;

    if (utils.isObject(grid.offset)) {
      offsetX = grid.offset.x;
      offsetY = grid.offset.y;
    }

    var gridx = Math.round((x - offsetX) / grid.x);
    var gridy = Math.round((y - offsetY) / grid.y);

    var newX = Math.max(limits.left, Math.min(limits.right, gridx * grid.x + offsetX));
    var newY = Math.max(limits.top, Math.min(limits.bottom, gridy * grid.y + offsetY));

    return {
      x: newX,
      y: newY,
      range: grid.range
    };
  };
};

modifiers.snap = snap;
modifiers.names.push('snap');

defaultOptions.perAction.snap = snap.defaults;

module.exports = snap;

},{"../defaultOptions":17,"../interact":20,"../utils":38,"./index":23}],26:[function(require,module,exports){
var scope = require('../scope');
var Interaction = require('../Interaction');
var utils = require('../utils');
var browser = require('../utils/browser');
var defaults = require('../defaultOptions');
var signals = require('../utils/Signals')['new']();

var simpleSignals = ['down', 'up', 'up', 'cancel'];
var simpleEvents = ['down', 'up', 'tap', 'cancel'];

function preventOriginalDefault() {
  this.originalEvent.preventDefault();
}

function stopImmediatePropagation() {
  this.immediatePropagationStopped = this.propagationStopped = true;
}

function stopPropagation() {
  this.propagationStopped = true;
}

function firePointers(interaction, pointer, event, eventTarget, targets, eventType) {
  var pointerIndex = interaction.mouse ? 0 : utils.indexOf(interaction.pointerIds, utils.getPointerId(pointer));
  var pointerEvent = {};
  var i = undefined;
  // for tap events
  var interval = undefined;
  var createNewDoubleTap = undefined;

  // if it's a doubletap then the event properties would have been
  // copied from the tap event and provided as the pointer argument
  if (eventType === 'doubletap') {
    pointerEvent = pointer;
  } else {
    utils.pointerExtend(pointerEvent, event);
    if (event !== pointer) {
      utils.pointerExtend(pointerEvent, pointer);
    }

    pointerEvent.preventDefault = preventOriginalDefault;
    pointerEvent.stopPropagation = stopPropagation;
    pointerEvent.stopImmediatePropagation = stopImmediatePropagation;
    pointerEvent.interaction = interaction;

    pointerEvent.timeStamp = new Date().getTime();
    pointerEvent.originalEvent = event;
    pointerEvent.type = eventType;
    pointerEvent.pointerId = utils.getPointerId(pointer);
    pointerEvent.pointerType = interaction.mouse ? 'mouse' : !browser.supportsPointerEvent ? 'touch' : utils.isString(pointer.pointerType) ? pointer.pointerType : [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType];
  }

  if (eventType === 'tap') {
    pointerEvent.dt = pointerEvent.timeStamp - interaction.downTimes[pointerIndex];

    interval = pointerEvent.timeStamp - interaction.tapTime;
    createNewDoubleTap = !!(interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === pointerEvent.target && interval < 500);

    pointerEvent.double = createNewDoubleTap;

    interaction.tapTime = pointerEvent.timeStamp;
  }

  var signalArg = {
    pointerEvent: pointerEvent,
    pointer: pointer,
    event: event,
    targets: targets
  };

  signals.fire('new', signalArg);

  for (i = 0; i < targets.length; i++) {
    var target = targets[i];

    pointerEvent.currentTarget = target.element;

    for (var prop in target.props || {}) {
      pointerEvent[prop] = target.props[prop];
    }

    target.eventable.fire(pointerEvent);

    if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].element !== pointerEvent.currentTarget) {
      break;
    }
  }

  signals.fire('fired', signalArg);

  if (createNewDoubleTap) {
    var doubleTap = {};

    utils.extend(doubleTap, pointerEvent);

    doubleTap.dt = interval;
    doubleTap.type = 'doubletap';

    collectEventTargets(interaction, doubleTap, event, eventTarget, 'doubletap');

    interaction.prevTap = doubleTap;
  } else if (eventType === 'tap') {
    interaction.prevTap = pointerEvent;
  }
}

function collectEventTargets(interaction, pointer, event, eventTarget, eventType) {
  var pointerIndex = interaction.mouse ? 0 : utils.indexOf(interaction.pointerIds, utils.getPointerId(pointer));

  // do not fire a tap event if the pointer was moved before being lifted
  if (eventType === 'tap' && (interaction.pointerWasMoved
  // or if the pointerup target is different to the pointerdown target
   || !(interaction.downTargets[pointerIndex] && interaction.downTargets[pointerIndex] === eventTarget))) {
    return;
  }

  var targets = [];
  var path = utils.getPath(eventTarget);
  var signalArg = {
    targets: targets,
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    eventType: eventType,
    path: path,
    element: null
  };

  for (var _iterator = path, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var element = _ref;

    signalArg.element = element;

    signals.fire('collect-targets', signalArg);
  }

  // create the tap event even if there are no listeners so that
  // doubletap can still be created and fired
  if (targets.length || eventType === 'tap') {
    firePointers(interaction, pointer, event, eventTarget, targets, eventType);
  }
}

Interaction.signals.on('move', function (_ref2) {
  var interaction = _ref2.interaction;
  var pointer = _ref2.pointer;
  var event = _ref2.event;
  var eventTarget = _ref2.eventTarget;
  var duplicateMove = _ref2.duplicateMove;

  var pointerIndex = interaction.mouse ? 0 : utils.indexOf(interaction.pointerIds, utils.getPointerId(pointer));

  if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
    if (interaction.pointerIsDown) {
      clearTimeout(interaction.holdTimers[pointerIndex]);
    }

    collectEventTargets(interaction, pointer, event, eventTarget, 'move');
  }
});

Interaction.signals.on('down', function (_ref3) {
  var interaction = _ref3.interaction;
  var pointer = _ref3.pointer;
  var event = _ref3.event;
  var eventTarget = _ref3.eventTarget;
  var pointerIndex = _ref3.pointerIndex;

  // copy event to be used in timeout for IE8
  var eventCopy = browser.isIE8 ? utils.extend({}, event) : event;

  interaction.holdTimers[pointerIndex] = setTimeout(function () {

    collectEventTargets(interaction, browser.isIE8 ? eventCopy : pointer, eventCopy, eventTarget, 'hold');
  }, defaults._holdDuration);
});

function createSignalListener(event) {
  return function (arg) {
    collectEventTargets(arg.interaction, arg.pointer, arg.event, arg.eventTarget, event);
  };
}

for (var i = 0; i < simpleSignals.length; i++) {
  Interaction.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
}

Interaction.signals.on('new', function (interaction) {
  interaction.prevTap = null; // the most recent tap event on this interaction
  interaction.tapTime = 0; // time of the most recent tap event
});

module.exports = scope.pointerEvents = {
  firePointers: firePointers,
  collectEventTargets: collectEventTargets,
  preventOriginalDefault: preventOriginalDefault,
  signals: signals,
  types: ['down', 'move', 'up', 'cancel', 'tap', 'doubletap', 'hold']
};

},{"../Interaction":5,"../defaultOptions":17,"../scope":28,"../utils":38,"../utils/Signals":29,"../utils/browser":31}],27:[function(require,module,exports){
var pointerEvents = require('./index');
var Interactable = require('../Interactable');
var browser = require('../utils/browser');
var isType = require('../utils/isType');
var domUtils = require('../utils/domUtils');
var scope = require('../scope');

var _require = require('../utils/arr');

var merge = _require.merge;

pointerEvents.signals.on('collect-targets', function (_ref) {
  var targets = _ref.targets;
  var element = _ref.element;
  var eventType = _ref.eventType;

  function collectSelectors(interactable, selector, context) {
    var els = browser.useMatchesSelectorPolyfill ? context.querySelectorAll(selector) : undefined;

    var eventable = interactable._iEvents;

    if (eventable[eventType] && isType.isElement(element) && interactable.inContext(element) && domUtils.matchesSelector(element, selector, els)) {

      targets.push({
        element: element,
        eventable: eventable,
        props: { interactable: interactable }
      });
    }
  }

  var interactable = scope.interactables.get(element);

  if (interactable) {
    var eventable = interactable._iEvents;

    if (eventable[eventType]) {
      targets.push({
        element: element,
        eventable: eventable,
        props: { interactable: interactable }
      });
    }
  }

  scope.interactables.forEachSelector(collectSelectors);
});

merge(Interactable.eventTypes, pointerEvents.types);

},{"../Interactable":4,"../scope":28,"../utils/arr":30,"../utils/browser":31,"../utils/domUtils":33,"../utils/isType":40,"./index":26}],28:[function(require,module,exports){
var utils = require('./utils');
var extend = require('./utils/extend');
var events = require('./utils/events');
var signals = require('./utils/Signals')['new']();

var scope = {
  signals: signals,
  events: events,
  utils: utils,

  documents: [], // all documents being listened to

  addDocument: function (doc, win) {
    // do nothing if document is already known
    if (utils.contains(scope.documents, doc)) {
      return false;
    }

    win = win || scope.getWindow(doc);

    scope.documents.push(doc);
    events.documents.push(doc);

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== scope.document) {
      events.add(win, 'unload', scope.onWindowUnload);
    }

    signals.fire('add-document', { doc: doc, win: win });
  },

  removeDocument: function (doc, win) {
    var index = utils.indexOf(scope.documents, doc);

    win = win || scope.getWindow(doc);

    events.remove(win, 'unload', scope.onWindowUnload);

    scope.documents.splice(index, 1);
    events.documents.splice(index, 1);

    signals.fire('remove-document', { win: win, doc: doc });
  },

  onWindowUnload: function () {
    scope.removeDocument(this.document, this);
  }
};

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));

module.exports = scope;

},{"./utils":38,"./utils/Signals":29,"./utils/domObjects":32,"./utils/events":34,"./utils/extend":35,"./utils/window":45}],29:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _require = require('./arr');

var indexOf = _require.indexOf;

var Signals = (function () {
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

    var index = indexOf(this.listeners[name], listener);

    if (index !== -1) {
      this.listeners[name].splice(index, 1);
    }
  };

  Signals.prototype.fire = function fire(name, arg) {
    var targetListeners = this.listeners[name];

    if (!targetListeners) {
      return;
    }

    for (var i = 0; i < targetListeners.length; i++) {
      if (targetListeners[i](arg, name) === false) {
        return;
      }
    }
  };

  return Signals;
})();

Signals['new'] = function () {
  return new Signals();
};

module.exports = Signals;

},{"./arr":30}],30:[function(require,module,exports){
function indexOf(array, target) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === target) {
      return i;
    }
  }

  return -1;
}

function contains(array, target) {
  return indexOf(array, target) !== -1;
}

function merge(target, source) {
  for (var i = 0; i < source.length; i++) {
    target.push(source[i]);
  }

  return target;
}

module.exports = {
  indexOf: indexOf,
  contains: contains,
  merge: merge
};

},{}],31:[function(require,module,exports){
var win = require('./window');
var isType = require('./isType');
var domObjects = require('./domObjects');

var browser = {
  // Does the browser support touch input?
  supportsTouch: !!('ontouchstart' in win.window || isType.isFunction(win.window.DocumentTouch) && domObjects.document instanceof win.DocumentTouch),

  // Does the browser support PointerEvents
  supportsPointerEvent: !!domObjects.PointerEvent,

  isIE8: 'attachEvent' in win.window && !('addEventListener' in win.window),

  // Opera Mobile must be handled differently
  isOperaMobile: navigator.appName === 'Opera' && browser.supportsTouch && navigator.userAgent.match('Presto'),

  // scrolling doesn't change the result of getClientRects on iOS 7
  isIOS7: /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion),

  isIe9OrOlder: domObjects.document.all && !win.window.atob,

  // prefix matchesSelector
  prefixedMatchesSelector: 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector',

  useMatchesSelectorPolyfill: false,

  pEventTypes: domObjects.PointerEvent ? domObjects.PointerEvent === win.window.MSPointerEvent ? { up: 'MSPointerUp', down: 'MSPointerDown', over: 'mouseover',
    out: 'mouseout', move: 'MSPointerMove', cancel: 'MSPointerCancel' } : { up: 'pointerup', down: 'pointerdown', over: 'pointerover',
    out: 'pointerout', move: 'pointermove', cancel: 'pointercancel' } : null,

  // because Webkit and Opera still use 'mousewheel' event type
  wheelEvent: 'onmousewheel' in domObjects.document ? 'mousewheel' : 'wheel'

};

browser.useMatchesSelectorPolyfill = !isType.isFunction(Element.prototype[browser.prefixedMatchesSelector]);

module.exports = browser;

},{"./domObjects":32,"./isType":40,"./window":45}],32:[function(require,module,exports){
var domObjects = {};
var win = require('./window').window;

function blank() {}

domObjects.document = win.document;
domObjects.DocumentFragment = win.DocumentFragment || blank;
domObjects.SVGElement = win.SVGElement || blank;
domObjects.SVGSVGElement = win.SVGSVGElement || blank;
domObjects.SVGElementInstance = win.SVGElementInstance || blank;
domObjects.HTMLElement = win.HTMLElement || win.Element;

domObjects.Event = win.Event;
domObjects.Touch = win.Touch || blank;
domObjects.PointerEvent = win.PointerEvent || win.MSPointerEvent;

module.exports = domObjects;

},{"./window":45}],33:[function(require,module,exports){
var win = require('./window');
var browser = require('./browser');
var isType = require('./isType');
var domObjects = require('./domObjects');

var domUtils = {
  nodeContains: function (parent, child) {
    while (child) {
      if (child === parent) {
        return true;
      }

      child = child.parentNode;
    }

    return false;
  },

  closest: function (element, selector) {
    while (isType.isElement(element)) {
      if (domUtils.matchesSelector(element, selector)) {
        return element;
      }

      element = domUtils.parentNode(element);
    }

    return null;
  },

  parentNode: function (node) {
    var parent = node.parentNode;

    if (isType.isDocFrag(parent)) {
      // skip past #shado-root fragments
      while ((parent = parent.host) && isType.isDocFrag(parent)) {
        continue;
      }

      return parent;
    }

    return parent;
  },

  // taken from http://tanalin.com/en/blog/2012/12/matches-selector-ie8/ and modified
  matchesSelectorPolyfill: browser.useMatchesSelectorPolyfill ? function (element, selector, elems) {
    elems = elems || element.parentNode.querySelectorAll(selector);

    for (var i = 0, len = elems.length; i < len; i++) {
      if (elems[i] === element) {
        return true;
      }
    }

    return false;
  } : null,

  matchesSelector: function (element, selector, nodeList) {
    if (browser.useMatchesSelectorPolyfill) {
      return domUtils.matchesSelectorPolyfill(element, selector, nodeList);
    }

    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (win.window !== win.realWindow) {
      selector = selector.replace(/\/deep\//g, ' ');
    }

    return element[browser.prefixedMatchesSelector](selector);
  },

  // Test for the element that's "above" all other qualifiers
  indexOfDeepestElement: function (elements) {
    var deepestZoneParents = [];
    var dropzoneParents = [];
    var dropzone = undefined;
    var deepestZone = elements[0];
    var index = deepestZone ? 0 : -1;
    var parent = undefined;
    var child = undefined;
    var i = undefined;
    var n = undefined;

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

  matchesUpTo: function (element, selector, limit) {
    while (isType.isElement(element)) {
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

  getActualElement: function (element) {
    return element instanceof domObjects.SVGElementInstance ? element.correspondingUseElement : element;
  },

  getScrollXY: function (relevantWindow) {
    relevantWindow = relevantWindow || win.window;
    return {
      x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
      y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
    };
  },

  getElementClientRect: function (element) {
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

  getElementRect: function (element) {
    var clientRect = domUtils.getElementClientRect(element);

    if (!browser.isIOS7 && clientRect) {
      var _scroll = domUtils.getScrollXY(win.getWindow(element));

      clientRect.left += _scroll.x;
      clientRect.right += _scroll.x;
      clientRect.top += _scroll.y;
      clientRect.bottom += _scroll.y;
    }

    return clientRect;
  },

  getPath: function (element) {
    var path = [];

    while (element) {
      path.push(element);
      element = domUtils.parentNode(element);
    }

    return path;
  }
};

module.exports = domUtils;

},{"./browser":31,"./domObjects":32,"./isType":40,"./window":45}],34:[function(require,module,exports){
var arr = require('./arr');
var isType = require('./isType');
var domUtils = require('./domUtils');
var indexOf = arr.indexOf;
var contains = arr.contains;
var getWindow = require('./window').getWindow;
var pExtend = require('./pointerExtend');

var useAttachEvent = 'attachEvent' in window && !('addEventListener' in window);
var addEvent = useAttachEvent ? 'attachEvent' : 'addEventListener';
var removeEvent = useAttachEvent ? 'detachEvent' : 'removeEventListener';
var on = useAttachEvent ? 'on' : '';

var elements = [];
var targets = [];
var attachedListeners = [];

// {
//   type: {
//     selectors: ['selector', ...],
//     contexts : [document, ...],
//     listeners: [[listener, useCapture], ...]
//   }
//  }
var delegatedEvents = {};

var documents = [];

function add(element, type, listener, useCapture) {
  var elementIndex = indexOf(elements, element);
  var target = targets[elementIndex];

  if (!target) {
    target = {
      events: {},
      typeCount: 0
    };

    elementIndex = elements.push(element) - 1;
    targets.push(target);

    attachedListeners.push(useAttachEvent ? {
      supplied: [],
      wrapped: [],
      useCount: []
    } : null);
  }

  if (!target.events[type]) {
    target.events[type] = [];
    target.typeCount++;
  }

  if (!contains(target.events[type], listener)) {
    var ret = undefined;

    if (useAttachEvent) {
      var _attachedListeners$elementIndex = attachedListeners[elementIndex];
      var supplied = _attachedListeners$elementIndex.supplied;
      var wrapped = _attachedListeners$elementIndex.wrapped;
      var useCount = _attachedListeners$elementIndex.useCount;

      var listenerIndex = indexOf(supplied, listener);

      var wrappedListener = wrapped[listenerIndex] || function (event) {
        if (!event.immediatePropagationStopped) {
          event.target = event.srcElement;
          event.currentTarget = element;

          event.preventDefault = event.preventDefault || preventDef;
          event.stopPropagation = event.stopPropagation || stopProp;
          event.stopImmediatePropagation = event.stopImmediatePropagation || stopImmProp;

          if (/mouse|click/.test(event.type)) {
            event.pageX = event.clientX + getWindow(element).document.documentElement.scrollLeft;
            event.pageY = event.clientY + getWindow(element).document.documentElement.scrollTop;
          }

          listener(event);
        }
      };

      ret = element[addEvent](on + type, wrappedListener, !!useCapture);

      if (listenerIndex === -1) {
        supplied.push(listener);
        wrapped.push(wrappedListener);
        useCount.push(1);
      } else {
        useCount[listenerIndex]++;
      }
    } else {
      ret = element[addEvent](type, listener, !!useCapture);
    }
    target.events[type].push(listener);

    return ret;
  }
}

function remove(element, type, listener, useCapture) {
  var elementIndex = indexOf(elements, element);
  var target = targets[elementIndex];

  if (!target || !target.events) {
    return;
  }

  var wrappedListener = listener;
  var listeners = undefined;
  var listenerIndex = undefined;

  if (useAttachEvent) {
    listeners = attachedListeners[elementIndex];
    listenerIndex = indexOf(listeners.supplied, listener);
    wrappedListener = listeners.wrapped[listenerIndex];
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
        remove(element, type, target.events[type][i], !!useCapture);
      }
      return;
    } else {
      for (var i = 0; i < len; i++) {
        if (target.events[type][i] === listener) {
          element[removeEvent](on + type, wrappedListener, !!useCapture);
          target.events[type].splice(i, 1);

          if (useAttachEvent && listeners) {
            listeners.useCount[listenerIndex]--;
            if (listeners.useCount[listenerIndex] === 0) {
              listeners.supplied.splice(listenerIndex, 1);
              listeners.wrapped.splice(listenerIndex, 1);
              listeners.useCount.splice(listenerIndex, 1);
            }
          }

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
    attachedListeners.splice(elementIndex, 1);
  }
}

function addDelegate(selector, context, type, listener, useCapture) {
  if (!delegatedEvents[type]) {
    delegatedEvents[type] = {
      selectors: [],
      contexts: [],
      listeners: []
    };

    // add delegate listener functions
    for (var i = 0; i < documents.length; i++) {
      add(documents[i], type, delegateListener);
      add(documents[i], type, delegateUseCapture, true);
    }
  }

  var delegated = delegatedEvents[type];
  var index = undefined;

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

  // keep listener and useCapture flag
  delegated.listeners[index].push([listener, useCapture]);
}

function removeDelegate(selector, context, type, listener, useCapture) {
  var delegated = delegatedEvents[type];
  var matchFound = false;
  var index = undefined;

  if (!delegated) {
    return;
  }

  // count from last index of delegated to 0
  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    // look for matching selector and context Node
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {

      var listeners = delegated.listeners[index];

      // each item of the listeners array is an array: [function, useCaptureFlag]
      for (var i = listeners.length - 1; i >= 0; i--) {
        var fn = listeners[i][0];
        var useCap = listeners[i][1];

        // check if the listener functions and useCapture flags match
        if (fn === listener && useCap === useCapture) {
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
function delegateListener(event, useCapture) {
  var fakeEvent = {};
  var delegated = delegatedEvents[event.type];
  var eventTarget = domUtils.getActualElement(event.path ? event.path[0] : event.target);
  var element = eventTarget;

  useCapture = useCapture ? true : false;

  // duplicate the event so that currentTarget can be changed
  pExtend(fakeEvent, event);

  fakeEvent.originalEvent = event;
  fakeEvent.preventDefault = preventOriginalDefault;

  // climb up document tree looking for selector matches
  while (isType.isElement(element)) {
    for (var i = 0; i < delegated.selectors.length; i++) {
      var selector = delegated.selectors[i];
      var context = delegated.contexts[i];

      if (domUtils.matchesSelector(element, selector) && domUtils.nodeContains(context, eventTarget) && domUtils.nodeContains(context, element)) {

        var listeners = delegated.listeners[i];

        fakeEvent.currentTarget = element;

        for (var j = 0; j < listeners.length; j++) {
          if (listeners[j][1] === useCapture) {
            listeners[j][0](fakeEvent);
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

function preventDef() {
  this.returnValue = false;
}

function preventOriginalDefault() {
  this.originalEvent.preventDefault();
}

function stopProp() {
  this.cancelBubble = true;
}

function stopImmProp() {
  this.cancelBubble = true;
  this.immediatePropagationStopped = true;
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

  useAttachEvent: useAttachEvent,

  _elements: elements,
  _targets: targets,
  _attachedListeners: attachedListeners
};

},{"./arr":30,"./domUtils":33,"./isType":40,"./pointerExtend":42,"./window":45}],35:[function(require,module,exports){
module.exports = function extend(dest, source) {
  for (var prop in source) {
    dest[prop] = source[prop];
  }
  return dest;
};

},{}],36:[function(require,module,exports){
var _require = require('./domUtils');

var closest = _require.closest;
var parentNode = _require.parentNode;
var getElementRect = _require.getElementRect;

var _require2 = require('./isType');

var isElement = _require2.isElement;
var isFunction = _require2.isFunction;
var trySelector = _require2.trySelector;

module.exports = function (interactable, element) {
  var origin = interactable.options.origin;

  if (origin === 'parent') {
    origin = parentNode(element);
  } else if (origin === 'self') {
    origin = interactable.getRect(element);
  } else if (trySelector(origin)) {
    origin = closest(element, origin) || { x: 0, y: 0 };
  }

  if (isFunction(origin)) {
    origin = origin(interactable && element);
  }

  if (isElement(origin)) {
    origin = getElementRect(origin);
  }

  origin.x = 'x' in origin ? origin.x : origin.left;
  origin.y = 'y' in origin ? origin.y : origin.top;

  return origin;
};

},{"./domUtils":33,"./isType":40}],37:[function(require,module,exports){
module.exports = function (x, y) {
  return Math.sqrt(x * x + y * y);
};

},{}],38:[function(require,module,exports){
var extend = require('./extend');
var win = require('./window');

var utils = {
  warnOnce: function (method, message) {
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
  _getQBezierValue: function (t, p1, p2, p3) {
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
  },

  getQuadraticCurvePoint: function (startX, startY, cpX, cpY, endX, endY, position) {
    return {
      x: utils._getQBezierValue(position, startX, cpX, endX),
      y: utils._getQBezierValue(position, startY, cpY, endY)
    };
  },

  // http://gizma.com/easing/
  easeOutQuad: function (t, b, c, d) {
    t /= d;
    return -c * t * (t - 2) + b;
  },

  copyAction: function (dest, src) {
    dest.name = src.name;
    dest.axis = src.axis;
    dest.edges = src.edges;

    return dest;
  },

  extend: extend,
  hypot: require('./hypot'),
  getOriginXY: require('./getOriginXY')
};

extend(utils, require('./arr'));
extend(utils, require('./isType'));
extend(utils, require('./domUtils'));
extend(utils, require('./pointerUtils'));

module.exports = utils;

},{"./arr":30,"./domUtils":33,"./extend":35,"./getOriginXY":36,"./hypot":37,"./isType":40,"./pointerUtils":43,"./window":45}],39:[function(require,module,exports){
var scope = require('../scope');
var utils = require('./index');
var browser = require('./browser');

var finder = {
  methodOrder: ['simulationResume', 'mouse', 'hasPointer', 'idle'],

  search: function (pointer, eventType, eventTarget) {
    var mouseEvent = /mouse/i.test(pointer.pointerType || eventType)
    // MSPointerEvent.MSPOINTER_TYPE_MOUSE
     || pointer.pointerType === 4;
    var pointerId = utils.getPointerId(pointer);
    var details = { pointer: pointer, pointerId: pointerId, mouseEvent: mouseEvent, eventType: eventType, eventTarget: eventTarget };

    for (var _iterator = finder.methodOrder, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var method = _ref;

      var interaction = finder[method](details);

      if (interaction) {
        return interaction;
      }
    }
  },

  // try to resume simulation with a new pointer
  simulationResume: function (_ref7) {
    var mouseEvent = _ref7.mouseEvent;
    var eventType = _ref7.eventType;
    var eventTarget = _ref7.eventTarget;

    if (!/down|start/i.test(eventType)) {
      return null;
    }

    for (var _iterator2 = scope.interactions, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var interaction = _ref2;

      var element = eventTarget;

      if (interaction.simulation && interaction.simulation.allowResume && interaction.mouse === mouseEvent) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }
          element = utils.parentNode(element);
        }
      }
    }

    return null;
  },

  // if it's a mouse interaction
  mouse: function (_ref8) {
    var pointerId = _ref8.pointerId;
    var mouseEvent = _ref8.mouseEvent;
    var eventType = _ref8.eventType;

    if (!mouseEvent && (browser.supportsTouch || browser.supportsPointerEvent)) {
      return null;
    }

    var firstNonActive = undefined;

    for (var _iterator3 = scope.interactions, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref3 = _i3.value;
      }

      var interaction = _ref3;

      if (interaction.mouse) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !utils.contains(interaction.pointerIds, pointerId)) {
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

    // Find any interaction specifically for mouse.
    // ignore the interaction if the eventType is a mousedown, and a simulation
    // is active
    for (var _iterator4 = scope.interactions, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      var _ref4;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref4 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref4 = _i4.value;
      }

      var interaction = _ref4;

      if (interaction.mouse && !(/down/.test(eventType) && interaction.simulation)) {
        return interaction;
      }
    }

    return null;
  },

  // get interaction that has this pointer
  hasPointer: function (_ref9) {
    var pointerId = _ref9.pointerId;

    for (var _iterator5 = scope.interactions, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
      var _ref5;

      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        _ref5 = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        _ref5 = _i5.value;
      }

      var interaction = _ref5;

      if (utils.contains(interaction.pointerIds, pointerId)) {
        return interaction;
      }
    }
  },

  // get first idle interaction
  idle: function (_ref10) {
    var mouseEvent = _ref10.mouseEvent;

    for (var _iterator6 = scope.interactions, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
      var _ref6;

      if (_isArray6) {
        if (_i6 >= _iterator6.length) break;
        _ref6 = _iterator6[_i6++];
      } else {
        _i6 = _iterator6.next();
        if (_i6.done) break;
        _ref6 = _i6.value;
      }

      var interaction = _ref6;

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

      if (!interaction.interacting() && !(!mouseEvent && interaction.mouse)) {
        return interaction;
      }
    }

    return null;
  }
};

module.exports = finder;

},{"../scope":28,"./browser":31,"./index":38}],40:[function(require,module,exports){
var win = require('./window');
var isWindow = require('./isWindow');
var domObjects = require('./domObjects');

var isType = {
  isElement: function (o) {
    if (!o || typeof o !== 'object') {
      return false;
    }

    var _window = win.getWindow(o) || win.window;

    return (/object|function/.test(typeof _window.Element) ? o instanceof _window.Element //DOM2
      : o.nodeType === 1 && typeof o.nodeName === 'string'
    );
  },

  isArray: null,

  isWindow: function (thing) {
    return thing === win.window || isWindow(thing);
  },

  isDocFrag: function (thing) {
    return isType.isObject(thing) && thing.nodeType === 11;
  },

  isObject: function (thing) {
    return !!thing && typeof thing === 'object';
  },

  isFunction: function (thing) {
    return typeof thing === 'function';
  },

  isNumber: function (thing) {
    return typeof thing === 'number';
  },

  isBool: function (thing) {
    return typeof thing === 'boolean';
  },

  isString: function (thing) {
    return typeof thing === 'string';
  },

  trySelector: function (value) {
    if (!isType.isString(value)) {
      return false;
    }

    // an exception will be raised if it is invalid
    domObjects.document.querySelector(value);
    return true;
  }
};

isType.isArray = function (thing) {
  return isType.isObject(thing) && typeof thing.length !== 'undefined' && isType.isFunction(thing.splice);
};

module.exports = isType;

},{"./domObjects":32,"./isWindow":41,"./window":45}],41:[function(require,module,exports){
module.exports = function (thing) {
  return !!(thing && thing.Window) && thing instanceof thing.Window;
};

},{}],42:[function(require,module,exports){
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

    if (!deprecated) {
      dest[prop] = source[prop];
    }
  }
  return dest;
}

pointerExtend.prefixedPropREs = {
  webkit: /(Movement[XY]|Radius[XY]|RotationAngle|Force)$/
};

module.exports = pointerExtend;

},{}],43:[function(require,module,exports){
var hypot = require('./hypot');
var browser = require('./browser');
var dom = require('./domObjects');
var isType = require('./isType');
var pointerExtend = require('./pointerExtend');

var pointerUtils = {
  copyCoords: function (dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;

    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;

    dest.timeStamp = src.timeStamp;
  },

  setCoordDeltas: function (targetObj, prev, cur) {
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

  isNativePointer: function (pointer) {
    return pointer instanceof dom.Event || pointer instanceof dom.Touch;
  },

  // Get specified X/Y coords for mouse or event.touches[0]
  getXY: function (type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';

    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];

    return xy;
  },

  getPageXY: function (pointer, page) {
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

  getClientXY: function (pointer, client) {
    client = client || {};

    if (browser.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      pointerUtils.getXY('screen', pointer, client);
    } else {
      pointerUtils.getXY('client', pointer, client);
    }

    return client;
  },

  getPointerId: function (pointer) {
    return isType.isNumber(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
  },

  setCoords: function (targetObj, pointers, timeStamp) {
    var pointer = pointers.length > 1 ? pointerUtils.pointerAverage(pointers) : pointers[0];

    var tmpXY = {};

    pointerUtils.getPageXY(pointer, tmpXY);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;

    pointerUtils.getClientXY(pointer, tmpXY);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;

    targetObj.timeStamp = isType.isNumber(timeStamp) ? timeStamp : new Date().getTime();
  },

  pointerExtend: pointerExtend,

  getTouchPair: function (event) {
    var touches = [];

    // array of touches is supplied
    if (isType.isArray(event)) {
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

  pointerAverage: function (pointers) {
    var average = {
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0
    };

    for (var _iterator = pointers, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var pointer = _ref;

      for (var prop in average) {
        average[prop] += pointer[prop];
      }
    }
    for (var prop in average) {
      average[prop] /= pointers.length;
    }

    return average;
  },

  touchBBox: function (event) {
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

  touchDistance: function (event, deltaSource) {
    deltaSource = deltaSource;

    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);

    var dx = touches[0][sourceX] - touches[1][sourceX];
    var dy = touches[0][sourceY] - touches[1][sourceY];

    return hypot(dx, dy);
  },

  touchAngle: function (event, prevAngle, deltaSource) {
    deltaSource = deltaSource;

    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);
    var dx = touches[1][sourceX] - touches[0][sourceX];
    var dy = touches[1][sourceY] - touches[0][sourceY];
    var angle = 180 * Math.atan2(dy, dx) / Math.PI;

    return angle;
  }
};

module.exports = pointerUtils;

},{"./browser":31,"./domObjects":32,"./hypot":37,"./isType":40,"./pointerExtend":42}],44:[function(require,module,exports){
var vendors = ['ms', 'moz', 'webkit', 'o'];
var lastTime = 0;
var request = undefined;
var cancel = undefined;

for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++) {
  request = window[vendors[x] + 'RequestAnimationFrame'];
  cancel = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

if (!request) {
  request = function (callback) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = setTimeout(function () {
      callback(currTime + timeToCall);
    }, timeToCall);

    lastTime = currTime + timeToCall;
    return id;
  };
}

if (!cancel) {
  cancel = function (id) {
    clearTimeout(id);
  };
}

module.exports = {
  request: request,
  cancel: cancel
};

},{}],45:[function(require,module,exports){
var win = module.exports;
var isWindow = require('./isWindow');

function init(window) {
  // get wrapped window if using Shadow DOM polyfill

  win.realWindow = window;

  // create a TextNode
  var el = window.document.createTextNode('');

  // check if it's wrapped by a polyfill
  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // return wrapped window
    win.window = window.wrap(window);
  }

  // no Shadow DOM polyfil or native implementation
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

  return rootNode.defaultView || rootNode.parentWindow || win.window;
};

win.init = init;

},{"./isWindow":41}]},{},[1])(1)
});
//# sourceMappingURL=interact.js.map
