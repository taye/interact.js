/** @module interact */

import browser         from '@interactjs/utils/browser';
import events          from '@interactjs/utils/events';
import * as utils      from '@interactjs/utils';
import { createScope } from '@interactjs/core/scope';

const globalEvents = {};
const signals = new utils.Signals();
const scope = createScope();

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
function interact (element, options) {
  let interactable = scope.interactables.get(element, options);

  if (!interactable) {
    options = utils.extend(options || {}, {
      signals: signals,
      actions: scope.actions,
    });
    interactable = new scope.Interactable(element, options, scope.document);
    interactable.events.global = globalEvents;

    scope.addDocument(interactable._doc);

    scope.interactables.list.push(interactable);
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
    for (const eventType of type) {
      interact.on(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (const prop in type) {
      interact.on(prop, type[prop], listener);
    }

    return interact;
  }

  // if it is an InteractEvent type, add listener to globalEvents
  if (utils.arr.contains(scope.actions.eventTypes, type)) {
    // if this type of event was never bound
    if (!globalEvents[type]) {
      globalEvents[type] = [listener];
    }
    else {
      globalEvents[type].push(listener);
    }
  }
  // If non InteractEvent type, addEventListener to document
  else {
    events.add(scope.document, type, listener, { options });
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
    for (const eventType of type) {
      interact.off(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (const prop in type) {
      interact.off(prop, type[prop], listener);
    }

    return interact;
  }

  if (!utils.arr.contains(scope.actions.eventTypes, type)) {
    events.remove(scope.document, type, listener, options);
  }
  else {
    let index;

    if (type in globalEvents
        && (index = globalEvents[type].indexOf(listener)) !== -1) {
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
interact.getPointerAverage  = utils.pointer.pointerAverage;
interact.getTouchBBox       = utils.pointer.touchBBox;
interact.getTouchDistance   = utils.pointer.touchDistance;
interact.getTouchAngle      = utils.pointer.touchAngle;

interact.getElementRect       = utils.dom.getElementRect;
interact.getElementClientRect = utils.dom.getElementClientRect;
interact.matchesSelector      = utils.dom.matchesSelector;
interact.closest              = utils.dom.closest;

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
  for (const interaction of scope.interactions.list) {
    interaction.stop(event);
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
    scope.interactions.pointerMoveTolerance = newValue;

    return interact;
  }

  return scope.interactions.pointerMoveTolerance;
};

signals.on('unset', ({ interactable }) => {
  scope.interactables.list.splice(scope.interactables.list.indexOf(interactable), 1);

  // Stop related interactions when an Interactable is unset
  for (const interaction of scope.interactions.list) {
    if (interaction.target === interactable && interaction.interacting() && interaction._ending) {
      interaction.stop();
    }
  }
});
interact.addDocument    = scope.addDocument;
interact.removeDocument = scope.removeDocument;

scope.interactables = {
  // all set interactables
  list: [],

  indexOfElement (target, context) {
    context = context || scope.document;

    const list = this.list;

    for (let i = 0; i < list.length; i++) {
      const interactable = list[i];

      if (interactable.target === target && interactable._context === context) {
        return i;
      }
    }

    return -1;
  },

  get (element, options, dontCheckInContext) {
    const ret = this.list[this.indexOfElement(element, options && options.context)];

    return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element))? ret : null;
  },

  forEachMatch (element, callback) {
    for (const interactable of this.list) {
      let ret;

      if ((utils.is.string(interactable.target)
        // target is a selector and the element matches
        ? (utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target))
        // target is the element
        : element === interactable.target)
        // the element is in context
        && (interactable.inContext(element))) {
        ret = callback(interactable);
      }

      if (ret !== undefined) {
        return ret;
      }
    }
  },

  signals: signals,
};

scope.interact = interact;

export { scope };
export default interact;
