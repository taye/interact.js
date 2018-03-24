import clone     from '@interactjs/utils/clone';
import * as is   from '@interactjs/utils/is';
import events    from '@interactjs/utils/events';
import extend    from '@interactjs/utils/extend';
import * as arr  from '@interactjs/utils/arr';
import Eventable from './Eventable';

import {
  getElementRect,
  nodeContains,
  trySelector,
}                     from '@interactjs/utils/domUtils';
import { getWindow }  from '@interactjs/utils/window';
import { wheelEvent } from '@interactjs/utils/browser';

class Interactable {
  get _defaults () {
    return {
      base: {},
      perAction: {},
    };
  }

  /** */
  constructor (target, options, defaultContext) {
    this._signals = options.signals;
    this._actions = options.actions;
    this.target   = target;
    this.events   = new Eventable();
    this._context = options.context || defaultContext;
    this._win     = getWindow(trySelector(target)? this._context : target);
    this._doc     = this._win.document;

    this._signals.fire('new', {
      target,
      options,
      interactable: this,
      win: this._win,
    });

    this.set(options);
  }

  setOnEvents (action, phases) {
    const onAction = 'on' + action;

    if (is.func(phases.onstart)       ) { this.events[onAction + 'start'        ] = phases.onstart         ; }
    if (is.func(phases.onmove)        ) { this.events[onAction + 'move'         ] = phases.onmove          ; }
    if (is.func(phases.onend)         ) { this.events[onAction + 'end'          ] = phases.onend           ; }
    if (is.func(phases.oninertiastart)) { this.events[onAction + 'inertiastart' ] = phases.oninertiastart  ; }

    return this;
  }

  setPerAction (actionName, options) {
    const defaults = this._defaults;

    // for all the default per-action options
    for (const optionName in options) {
      const actionOptions = this.options[actionName];
      const optionValue = options[optionName];
      const isArray = is.array(optionValue);

      // if the option value is an array
      if (isArray) {
        actionOptions[optionName] = arr.from(optionValue);
      }
      // if the option value is an object
      else if (!isArray && is.plainObject(optionValue)) {
        // copy the object
        actionOptions[optionName] = extend(
          actionOptions[optionName] || {},
          clone(optionValue));

        // set anabled field to true if it exists in the defaults
        if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
          actionOptions[optionName].enabled = optionValue.enabled === false? false : true;
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
  }

  /**
   * The default function to get an Interactables bounding rect. Can be
   * overridden using {@link Interactable.rectChecker}.
   *
   * @param {Element} [element] The element to measure.
   * @return {object} The object's bounding rectangle.
   */
  getRect (element) {
    element = element || this.target;

    if (is.string(this.target) && !(is.element(element))) {
      element = this._context.querySelector(this.target);
    }

    return getElementRect(element);
  }

  /**
   * Returns or sets the function used to calculate the interactable's
   * element's rectangle
   *
   * @param {function} [checker] A function which returns this Interactable's
   * bounding rectangle. See {@link Interactable.getRect}
   * @return {function | object} The checker function or this Interactable
   */
  rectChecker (checker) {
    if (is.func(checker)) {
      this.getRect = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.getRect;

      return this;
    }

    return this.getRect;
  }

  _backCompatOption (optionName, newValue) {
    if (trySelector(newValue) || is.object(newValue)) {
      this.options[optionName] = newValue;

      for (const action of this._actions.names) {
        this.options[action][optionName] = newValue;
      }

      return this;
    }

    return this.options[optionName];
  }

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
  origin (newValue) {
    return this._backCompatOption('origin', newValue);
  }

  /**
   * Returns or sets the mouse coordinate types used to calculate the
   * movement of the pointer.
   *
   * @param {string} [newValue] Use 'client' if you will be scrolling while
   * interacting; Use 'page' if you want autoScroll to work
   * @return {string | object} The current deltaSource or this Interactable
   */
  deltaSource (newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue;

      return this;
    }

    return this.options.deltaSource;
  }

  /**
   * Gets the selector context Node of the Interactable. The default is
   * `window.document`.
   *
   * @return {Node} The context Node of this Interactable
   */
  context () {
    return this._context;
  }

  inContext (element) {
    return (this._context === element.ownerDocument
            || nodeContains(this._context, element));
  }

  /**
   * Calls listeners for the given InteractEvent type bound globally
   * and directly to this Interactable
   *
   * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
   * Interactable
   * @return {Interactable} this Interactable
   */
  fire (iEvent) {
    this.events.fire(iEvent);

    return this;
  }

  _onOffMultiple (method, eventType, listener, options) {
    if (is.string(eventType) && eventType.search(' ') !== -1) {
      eventType = eventType.trim().split(/ +/);
    }

    if (is.array(eventType)) {
      for (const type of eventType) {
        this[method](type, listener, options);
      }

      return true;
    }

    if (is.object(eventType)) {
      for (const prop in eventType) {
        this[method](prop, eventType[prop], listener);
      }

      return true;
    }
  }

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
  on (eventType, listener, options) {
    if (this._onOffMultiple('on', eventType, listener, options)) {
      return this;
    }

    if (arr.contains(this._actions.eventTypes, eventType)) {
      this.events.on(eventType, listener);
    }
    // delegated event for selector
    else if (is.string(this.target)) {
      events.addDelegate(this.target, this._context, eventType, listener, options);
    }
    else {
      events.add(this.target, eventType, listener, options);
    }

    return this;
  }

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
  off (eventType, listener, options) {
    if (this._onOffMultiple('off', eventType, listener, options)) {
      return this;
    }

    if (eventType === 'wheel') { eventType = wheelEvent; }

    // if it is an action event type
    if (arr.contains(this._actions.eventTypes, eventType)) {
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
  }

  /**
   * Reset the options of this Interactable
   *
   * @param {object} options The new settings to apply
   * @return {object} This Interactable
   */
  set (options) {
    const defaults = this._defaults;

    if (!is.object(options)) {
      options = {};
    }

    this.options = clone(defaults.base);

    for (const actionName in this._actions.methodDict) {
      const methodName = this._actions.methodDict[actionName];

      this.options[actionName] = {};
      this.setPerAction(actionName, extend(extend({}, defaults.perAction), defaults[actionName]));

      this[methodName](options[actionName]);
    }

    for (const setting in options) {
      if (is.func(this[setting])) {
        this[setting](options[setting]);
      }
    }

    this._signals.fire('set', {
      options,
      interactable: this,
    });

    return this;
  }

  /**
   * Remove this interactable from the list of interactables and remove it's
   * action capabilities and event listeners
   *
   * @return {interact}
   */
  unset () {
    events.remove(this.target, 'all');

    if (is.string(this.target)) {
      // remove delegated events
      for (const type in events.delegatedEvents) {
        const delegated = events.delegatedEvents[type];

        if (delegated.selectors[0] === this.target
            && delegated.contexts[0] === this._context) {

          delegated.selectors.splice(0, 1);
          delegated.contexts .splice(0, 1);
          delegated.listeners.splice(0, 1);

          // remove the arrays if they are empty
          if (!delegated.selectors.length) {
            delegated[type] = null;
          }
        }

        events.remove(this._context, type, events.delegateListener);
        events.remove(this._context, type, events.delegateUseCapture, true);
      }
    }
    else {
      events.remove(this, 'all');
    }

    this._signals.fire('unset', { interactable: this });
  }
}

export default Interactable;
