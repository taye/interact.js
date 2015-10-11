const isType  = require('./utils/isType');
const events  = require('./utils/events');
const extend  = require('./utils/extend');
const actions = require('./actions/base');
const scope   = require('./scope');

const { getElementRect }    = require('./utils/domUtils');
const { indexOf, contains } = require('./utils/arr');

const signals = new (require('./utils/Signals'));

// all set interactables
scope.interactables = [];

/*\
 * Interactable
 [ property ]
 **
 * Object type returned by @interact
\*/
class Interactable {
  constructor (element, options) {
    this._element = element;
    this._context = scope.document;
    this._iEvents = this._iEvents || {};

    let _window;

    if (isType.trySelector(element)) {
      this.selector = element;

      const context = options && options.context;

      _window = context? scope.getWindow(context) : scope.window;

      if (context && (_window.Node
        ? context instanceof _window.Node
        : (isType.isElement(context) || context === _window.document))) {

        this._context = context;
      }
    }
    else {
      _window = scope.getWindow(element);
    }

    this._doc = _window.document;

    signals.fire('new', {
      element,
      options,
      interactable: this,
      win: _window,
    });

    if (this._doc !== scope.document) {
      signals.fire('listen-to-document', {
        doc: this._doc,
        win: _window,
      });
    }

    scope.interactables.push(this);

    this.set(options);
  }

  setOnEvents (action, phases) {
    const onAction = 'on' + action;

    if (isType.isFunction(phases.onstart)       ) { this[onAction + 'start'        ] = phases.onstart         ; }
    if (isType.isFunction(phases.onmove)        ) { this[onAction + 'move'         ] = phases.onmove          ; }
    if (isType.isFunction(phases.onend)         ) { this[onAction + 'end'          ] = phases.onend           ; }
    if (isType.isFunction(phases.oninertiastart)) { this[onAction + 'inertiastart' ] = phases.oninertiastart  ; }

    return this;
  }

  setPerAction (action, options) {
    // for all the default per-action options
    for (const option in options) {
      // if this option exists for this action
      if (option in scope.defaultOptions[action]) {
        // if the option in the options arg is an object value
        if (isType.isObject(options[option])) {
          // duplicate the object
          this.options[action][option] = extend(this.options[action][option] || {}, options[option]);

          if (isType.isObject(scope.defaultOptions.perAction[option]) && 'enabled' in scope.defaultOptions.perAction[option]) {
            this.options[action][option].enabled = options[option].enabled === false? false : true;
          }
        }
        else if (isType.isBool(options[option]) && isType.isObject(scope.defaultOptions.perAction[option])) {
          this.options[action][option].enabled = options[option];
        }
        else if (options[option] !== undefined) {
          // or if it's not undefined, do a plain assignment
          this.options[action][option] = options[option];
        }
      }
    }
  }

  getAction (pointer, event, interaction, element) {
    const action = this.defaultActionChecker(pointer, event, interaction, element);

    if (this.options.actionChecker) {
      return this.options.actionChecker(pointer, event, action, this, element, interaction);
    }

    return action;
  }

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
  actionChecker (checker) {
    if (isType.isFunction(checker)) {
      this.options.actionChecker = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.actionChecker;

      return this;
    }

    return this.options.actionChecker;
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
    element = element || this._element;

    if (this.selector && !(isType.isElement(element))) {
      element = this._context.querySelector(this.selector);
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
   * Interactable.styleCursor
   [ method ]
   *
   * Returns or sets whether the action that would be performed when the
   * mouse on the element are checked on `mousemove` so that the cursor
   * may be styled appropriately
   *
   - newValue (boolean) #optional
   = (boolean | Interactable) The current setting or this Interactable
  \*/
  styleCursor (newValue) {
    if (isType.isBool(newValue)) {
      this.options.styleCursor = newValue;

      return this;
    }

    if (newValue === null) {
      delete this.options.styleCursor;

      return this;
    }

    return this.options.styleCursor;
  }

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
  preventDefault (newValue) {
    if (/^(always|never|auto)$/.test(newValue)) {
      this.options.preventDefault = newValue;
      return this;
    }

    if (isType.isBool(newValue)) {
      this.options.preventDefault = newValue? 'always' : 'never';
      return this;
    }

    return this.options.preventDefault;
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
  ignoreFrom (newValue) {
    if (isType.trySelector(newValue)) {            // CSS selector to match event.target
      this.options.ignoreFrom = newValue;
      return this;
    }

    if (isType.isElement(newValue)) {              // specific element
      this.options.ignoreFrom = newValue;
      return this;
    }

    return this.options.ignoreFrom;
  }

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
  allowFrom (newValue) {
    if (isType.trySelector(newValue)) {            // CSS selector to match event.target
      this.options.allowFrom = newValue;
      return this;
    }

    if (isType.isElement(newValue)) {              // specific element
      this.options.allowFrom = newValue;
      return this;
    }

    return this.options.allowFrom;
  }

  /*\
   * Interactable.element
   [ method ]
   *
   * If this is not a selector Interactable, it returns the element this
   * interactable represents
   *
   = (Element) HTML / SVG Element
  \*/
  element () {
    return this._element;
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
    if (!(iEvent && iEvent.type) || !contains(scope.eventTypes, iEvent.type)) {
      return this;
    }

    let listeners;
    const onEvent = 'on' + iEvent.type;

    // Interactable#on() listeners
    if (iEvent.type in this._iEvents) {
      listeners = this._iEvents[iEvent.type];

      for (let i = 0, len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
        listeners[i](iEvent);
      }
    }

    // interactable.onevent listener
    if (isType.isFunction(this[onEvent])) {
      this[onEvent](iEvent);
    }

    // interact.on() listeners
    if (iEvent.type in scope.globalEvents && (listeners = scope.globalEvents[iEvent.type]))  {

      for (let i = 0, len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
        listeners[i](iEvent);
      }
    }

    return this;
  }

  /*\
   * Interactable.on
   [ method ]
   *
   * Binds a listener for an InteractEvent or DOM event.
   *
   - eventType  (string | array | object) The types of events to listen for
   - listener   (function) The function event (s)
   - useCapture (boolean) #optional useCapture flag for addEventListener
   = (object) This Interactable
  \*/
  on (eventType, listener, useCapture) {
    if (isType.isString(eventType) && eventType.search(' ') !== -1) {
      eventType = eventType.trim().split(/ +/);
    }

    if (isType.isArray(eventType)) {
      for (let i = 0; i < eventType.length; i++) {
        this.on(eventType[i], listener, useCapture);
      }

      return this;
    }

    if (isType.isObject(eventType)) {
      for (const prop in eventType) {
        this.on(prop, eventType[prop], listener);
      }

      return this;
    }

    if (eventType === 'wheel') {
      eventType = scope.wheelEvent;
    }

    // convert to boolean
    useCapture = useCapture? true: false;

    if (contains(scope.eventTypes, eventType)) {
      // if this type of event was never bound to this Interactable
      if (!(eventType in this._iEvents)) {
        this._iEvents[eventType] = [listener];
      }
      else {
        this._iEvents[eventType].push(listener);
      }
    }
    // delegated event for selector
    else if (this.selector) {
      events.addDelegate(this.selector, this._context, eventType, listener, useCapture);
    }
    else {
      events.add(this._element, eventType, listener, useCapture);
    }

    return this;
  }

  /*\
   * Interactable.off
   [ method ]
   *
   * Removes an InteractEvent or DOM event listener
   *
   - eventType  (string | array | object) The types of events that were listened for
   - listener   (function) The listener function to be removed
   - useCapture (boolean) #optional useCapture flag for removeEventListener
   = (object) This Interactable
  \*/
  off (eventType, listener, useCapture) {
    if (isType.isString(eventType) && eventType.search(' ') !== -1) {
      eventType = eventType.trim().split(/ +/);
    }

    if (isType.isArray(eventType)) {
      for (let i = 0; i < eventType.length; i++) {
        this.off(eventType[i], listener, useCapture);
      }

      return this;
    }

    if (isType.isObject(eventType)) {
      for (const prop in eventType) {
        this.off(prop, eventType[prop], listener);
      }

      return this;
    }


    // convert to boolean
    useCapture = useCapture? true: false;

    if (eventType === 'wheel') {
      eventType = scope.wheelEvent;
    }

    // if it is an action event type
    if (contains(scope.eventTypes, eventType)) {
      const eventList = this._iEvents[eventType];
      const index     = eventList? indexOf(eventList, listener) : -1;

      if (index !== -1) {
        this._iEvents[eventType].splice(index, 1);
      }
    }
    // delegated event
    else if (this.selector) {
      events.removeDelegate(this.selector, this._context, eventType, listener, useCapture);
    }
    // remove listener from this Interatable's element
    else {
      events.remove(this._element, eventType, listener, useCapture);
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

    this.options = extend({}, scope.defaultOptions.base);

    const perActions = extend({}, scope.defaultOptions.perAction);

    for (const actionName in actions.methodDict) {
      const methodName = actions.methodDict[actionName];

      this.options[actionName] = extend({}, scope.defaultOptions[actionName]);

      this.setPerAction(actionName, perActions);

      this[methodName](options[actionName]);
    }

    const settings = [
      'accept', 'actionChecker', 'allowFrom', 'deltaSource',
      'dropChecker', 'ignoreFrom', 'origin', 'preventDefault',
      'rectChecker', 'styleCursor',
    ];

    for (let i = 0, len = settings.length; i < len; i++) {
      const setting = settings[i];

      this.options[setting] = scope.defaultOptions.base[setting];

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
    events.remove(this._element, 'all');

    if (!isType.isString(this.selector)) {
      events.remove(this, 'all');
      if (this.options.styleCursor) {
        this._element.style.cursor = '';
      }
    }
    else {
      // remove delegated events
      for (const type in events.delegatedEvents) {
        const delegated = events.delegatedEvents[type];

        for (let i = 0; i < delegated.selectors.length; i++) {
          if (delegated.selectors[i] === this.selector
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

    signals.fire('unset', { interactable: this });

    scope.interactables.splice(isType.indexOf(scope.interactables, this), 1);

    return scope.interact;
  }
}

Interactable.prototype.defaultActionChecker = actions.defaultChecker;

Interactable.signals = signals;

module.exports = Interactable;
