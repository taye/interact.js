/**
 * interact.js v1.2.5
 *
 * Copyright (c) 2012-2015 Taye Adeyemi <dev@taye.me>
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

const browser      = require('./utils/browser');
const events       = require('./utils/events');
const utils        = require('./utils');
const scope        = require('./scope');
const Interactable = require('./Interactable');

scope.dynamicDrop = false;

// Less Precision with touch input
scope.margin = browser.supportsTouch || browser.supportsPointerEvent? 20: 10;

scope.pointerMoveTolerance = 1;

// Allow this many interactions to happen simultaneously
scope.maxInteractions = Infinity;

// because Webkit and Opera still use 'mousewheel' event type
scope.wheelEvent = 'onmousewheel' in scope.document? 'mousewheel': 'wheel';

scope.globalEvents = {};

scope.inContext = function (interactable, element) {
  return (interactable._context === element.ownerDocument
          || utils.nodeContains(interactable._context, element));
};

scope.testIgnore = function (interactable, interactableElement, element) {
  const ignoreFrom = interactable.options.ignoreFrom;

  if (!ignoreFrom || !utils.isElement(element)) { return false; }

  if (utils.isString(ignoreFrom)) {
    return utils.matchesUpTo(element, ignoreFrom, interactableElement);
  }
  else if (utils.isElement(ignoreFrom)) {
    return utils.nodeContains(ignoreFrom, element);
  }

  return false;
};

scope.testAllow = function (interactable, interactableElement, element) {
  const allowFrom = interactable.options.allowFrom;

  if (!allowFrom) { return true; }

  if (!utils.isElement(element)) { return false; }

  if (utils.isString(allowFrom)) {
    return utils.matchesUpTo(element, allowFrom, interactableElement);
  }
  else if (utils.isElement(allowFrom)) {
    return utils.nodeContains(allowFrom, element);
  }

  return false;
};

scope.interactables.indexOfElement = function indexOfElement (element, context) {
  context = context || scope.document;

  for (let i = 0; i < this.length; i++) {
    const interactable = this[i];

    if ((interactable.selector === element
      && (interactable._context === context))
      || (!interactable.selector && interactable._element === element)) {

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

    if (!interactable.selector) {
      continue;
    }

    const ret = callback(interactable, interactable.selector, interactable._context, i, this);

    if (ret !== undefined) {
      return ret;
    }
  }
};

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
 | interact(document.getElementById('draggable')).draggable(true);
 |
 | var rectables = interact('rect');
 | rectables
 |     .gesturable(true)
 |     .on('gesturemove', function (event) {
 |         // something cool...
 |     })
 |     .autoScroll(true);
\*/
function interact (element, options) {
  return scope.interactables.get(element, options) || new Interactable(element, options);
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
    for (const eventType of type) {
      interact.on(eventType, listener, useCapture);
    }

    return interact;
  }

  if (utils.isObject(type)) {
    for (const prop in type) {
      interact.on(prop, type[prop], listener);
    }

    return interact;
  }

  // if it is an InteractEvent type, add listener to globalEvents
  if (utils.contains(scope.eventTypes, type)) {
    // if this type of event was never bound
    if (!scope.globalEvents[type]) {
      scope.globalEvents[type] = [listener];
    }
    else {
      scope.globalEvents[type].push(listener);
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
    for (const eventType of type) {
      interact.off(eventType, listener, useCapture);
    }

    return interact;
  }

  if (utils.isObject(type)) {
    for (const prop in type) {
      interact.off(prop, type[prop], listener);
    }

    return interact;
  }

  if (!utils.contains(scope.eventTypes, type)) {
    events.remove(scope.document, type, listener, useCapture);
  }
  else {
    let index;

    if (type in scope.globalEvents
        && (index = utils.indexOf(scope.globalEvents[type], listener)) !== -1) {
      scope.globalEvents[type].splice(index, 1);
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
interact.getPointerAverage  = utils.pointerAverage;
interact.getTouchBBox       = utils.touchBBox;
interact.getTouchDistance   = utils.touchDistance;
interact.getTouchAngle      = utils.touchAngle;

interact.getElementRect       = utils.getElementRect;
interact.getElementClientRect = utils.getElementClientRect;
interact.matchesSelector      = utils.matchesSelector;
interact.closest              = utils.closest;

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
  for (let i = scope.interactions.length - 1; i >= 0; i--) {
    scope.interactions[i].stop(event);
  }

  return interact;
};

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

    scope.dynamicDrop = newValue;

    return interact;
  }
  return scope.dynamicDrop;
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
    scope.pointerMoveTolerance = newValue;

    return this;
  }

  return scope.pointerMoveTolerance;
};

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
    scope.maxInteractions = newValue;

    return this;
  }

  return scope.maxInteractions;
};

scope.interact = interact;

module.exports = interact;
