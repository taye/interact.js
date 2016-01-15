const isType    = require('./utils/isType');
const events    = require('./utils/events');
const extend    = require('./utils/extend');
const actions   = require('./actions');
const scope     = require('./scope');
const Eventable = require('./Eventable');
const defaults  = require('./defaultOptions');
const signals   = require('./utils/Signals').new();

const { getElementRect, nodeContains } = require('./utils/domUtils');
const { indexOf, contains }            = require('./utils/arr');
const { wheelEvent }                   = require('./utils/browser');

// all set interactables
scope.interactables = [];

/*\
 * Interactable
 [ property ]
 **
 * Object type returned by @interact
\*/
class Interactable {
  constructor (target, options) {
    this.target   = target;
    this._context = scope.document;
    this._iEvents = new Eventable();

    let _window;

    if (isType.trySelector(target)) {
      this.target = target;

      const context = options && options.context;

      _window = context? scope.getWindow(context) : scope.window;

      if (context && (_window.Node
        ? context instanceof _window.Node
        : (isType.isElement(context) || context === _window.document))) {

        this._context = context;
      }
    }
    else {
      _window = scope.getWindow(target);
    }

    this._doc = _window.document;

    signals.fire('new', {
      target,
      options,
      interactable: this,
      win: _window,
    });

    scope.addDocument( this._doc, _window );

    scope.interactables.push(this);

    this.set(options);
  }

  setOnEvents (action, phases) {
    const onAction = 'on' + action;

    if (isType.isFunction(phases.onstart)       ) { this._iEvents[onAction + 'start'        ] = phases.onstart         ; }
    if (isType.isFunction(phases.onmove)        ) { this._iEvents[onAction + 'move'         ] = phases.onmove          ; }
    if (isType.isFunction(phases.onend)         ) { this._iEvents[onAction + 'end'          ] = phases.onend           ; }
    if (isType.isFunction(phases.oninertiastart)) { this._iEvents[onAction + 'inertiastart' ] = phases.oninertiastart  ; }

    return this;
  }

  setPerAction (action, options) {
    // for all the default per-action options
    for (const option in options) {
      // if this option exists for this action
      if (option in defaults[action]) {
        // if the option in the options arg is an object value
        if (isType.isObject(options[option])) {
          // duplicate the object
          this.options[action][option] = extend(this.options[action][option] || {}, options[option]);

          if (isType.isObject(defaults.perAction[option]) && 'enabled' in defaults.perAction[option]) {
            this.options[action][option].enabled = options[option].enabled === false? false : true;
          }
        }
        else if (isType.isBool(options[option]) && isType.isObject(defaults.perAction[option])) {
          this.options[action][option].enabled = options[option];
        }
        else if (options[option] !== undefined) {
          // or if it's not undefined, do a plain assignment
          this.options[action][option] = options[option];
        }
      }
    }
  }

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
  getRect (element) {
    element = element || this.target;

    if (isType.isString(this.target) && !(isType.isElement(element))) {
      element = this._context.querySelector(this.target);
    }

    return getElementRect(element);
  }

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
  rectChecker (checker) {
    if (isType.isFunction(checker)) {
      this.getRect = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.getRect;

      return this;
    }

    return this.getRect;
  }

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
  origin (newValue) {
    if (isType.trySelector(newValue)) {
      this.options.origin = newValue;
      return this;
    }
    else if (isType.isObject(newValue)) {
      this.options.origin = newValue;
      return this;
    }

    return this.options.origin;
  }

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
  deltaSource (newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue;

      return this;
    }

    return this.options.deltaSource;
  }

  /*\
   * Interactable.context
   [ method ]
   *
   * Gets the selector context Node of the Interactable. The default is `window.document`.
   *
   = (Node) The context Node of this Interactable
   **
  \*/
  context () {
    return this._context;
  }

  inContext (element) {
    return (this._context === element.ownerDocument
            || nodeContains(this._context, element));
  }

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
  fire (iEvent) {
    this._iEvents.fire(iEvent);

    return this;
  }

  _onOffMultiple (method, eventType, listener, useCapture) {
    if (isType.isString(eventType) && eventType.search(' ') !== -1) {
      eventType = eventType.trim().split(/ +/);
    }

    if (isType.isArray(eventType)) {
      for (let i = 0; i < eventType.length; i++) {
        this[method](eventType[i], listener, useCapture);
      }

      return true;
    }

    if (isType.isObject(eventType)) {
      for (const prop in eventType) {
        this[method](prop, eventType[prop], listener);
      }

      return true;
    }
  }

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
  on (eventType, listener, useCapture) {
    // convert to boolean
    useCapture = !!useCapture;

    if (this._onOffMultiple('on', eventType, listener, useCapture)) {
      return this;
    }

    if (eventType === 'wheel') { eventType = wheelEvent; }

    if (contains(Interactable.eventTypes, eventType)) {
      this._iEvents.on(eventType, listener);
    }
    // delegated event for selector
    else if (isType.isString(this.target)) {
      events.addDelegate(this.target, this._context, eventType, listener, useCapture);
    }
    else {
      events.add(this.target, eventType, listener, useCapture);
    }

    return this;
  }

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
  off (eventType, listener, useCapture) {
    // convert to boolean
    useCapture = !!useCapture;

    if (this._onOffMultiple('off', eventType, listener, useCapture)) {
      return this;
    }

    if (eventType === 'wheel') { eventType = wheelEvent; }

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
  }

  /*\
   * Interactable.set
   [ method ]
   *
   * Reset the options of this Interactable
   - options (object) The new settings to apply
   = (object) This Interactable
  \*/
  set (options) {
    if (!isType.isObject(options)) {
      options = {};
    }

    this.options = extend({}, defaults.base);

    const perActions = extend({}, defaults.perAction);

    for (const actionName in actions.methodDict) {
      const methodName = actions.methodDict[actionName];

      this.options[actionName] = extend({}, defaults[actionName]);

      this.setPerAction(actionName, perActions);

      this[methodName](options[actionName]);
    }

    for (const setting of Interactable.settingsMethods) {
      this.options[setting] = defaults.base[setting];

      if (setting in options) {
        this[setting](options[setting]);
      }
    }

    return this;
  }

  /*\
   * Interactable.unset
   [ method ]
   *
   * Remove this interactable from the list of interactables and remove
   * it's action capabilities and event listeners
   *
   = (object) @interact
  \*/
  unset () {
    events.remove(this.target, 'all');

    if (isType.isString(this.target)) {
      // remove delegated events
      for (const type in events.delegatedEvents) {
        const delegated = events.delegatedEvents[type];

        for (let i = 0; i < delegated.selectors.length; i++) {
          if (delegated.selectors[i] === this.target
              && delegated.contexts[i] === this._context) {

            delegated.selectors.splice(i, 1);
            delegated.contexts .splice(i, 1);
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
    }
    else {
      events.remove(this, 'all');
    }

    signals.fire('unset', { interactable: this });

    scope.interactables.splice(indexOf(scope.interactables, this), 1);

    // Stop related interactions when an Interactable is unset
    for (const interaction of scope.interactions || []) {
      if (interaction.target === this && interaction.interacting()) {
        interaction.stop();
      }
    }

    return scope.interact;
  }
}

scope.interactables.indexOfElement = function indexOfElement (target, context) {
  context = context || scope.document;

  for (let i = 0; i < this.length; i++) {
    const interactable = this[i];

    if (interactable.target === target
        && (!isType.isString(target) || (interactable._context === context))) {
      return i;
    }
  }
  return -1;
};

scope.interactables.get = function interactableGet (element, options) {
  return this[this.indexOfElement(element, options && options.context)];
};

scope.interactables.forEachSelector = function (callback) {
  for (let i = 0; i < this.length; i++) {
    const interactable = this[i];

    // skip non CSS selector targets
    if (!isType.isString(interactable.target)) {
      continue;
    }

    const ret = callback(interactable, interactable.target, interactable._context, i, this);

    if (ret !== undefined) {
      return ret;
    }
  }
};

// all interact.js eventTypes
Interactable.eventTypes = scope.eventTypes = [];

Interactable.signals = signals;

Interactable.settingsMethods = [ 'deltaSource', 'origin', 'preventDefault', 'rectChecker' ];

module.exports = Interactable;
