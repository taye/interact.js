/** @module interact */

import { Options } from '@interactjs/core/defaultOptions'
import Interactable from '@interactjs/core/Interactable'
import { Scope } from '@interactjs/core/scope'
import * as utils from '@interactjs/utils'
import browser from '@interactjs/utils/browser'
import events from '@interactjs/utils/events'

declare module '@interactjs/core/scope' {
  interface Scope {
    interact: InteractStatic
  }
}

export interface InteractStatic {
  (target: Interact.Target, options?: Options): Interactable
  on: typeof on
  pointerMoveTolerance: typeof pointerMoveTolerance
  stop: typeof stop
  supportsPointerEvent: typeof supportsPointerEvent
  supportsTouch: typeof supportsTouch
  debug: typeof debug
  off: typeof off
  isSet: typeof isSet
  use: typeof use
  getPointerAverage: typeof utils.pointer.pointerAverage
  getTouchBBox: typeof utils.pointer.touchBBox
  getTouchDistance: typeof utils.pointer.touchDistance
  getTouchAngle: typeof utils.pointer.touchAngle
  getElementRect: typeof utils.dom.getElementRect
  getElementClientRect: typeof utils.dom.getElementClientRect
  matchesSelector: typeof utils.dom.matchesSelector
  closest: typeof utils.dom.closest
  addDocument: typeof scope.addDocument
  removeDocument: typeof scope.removeDocument
  version: string
}

const globalEvents: any = {}
const scope = new Scope()

/**
 * ```js
 * interact('#draggable').draggable(true)
 *
 * var rectables = interact('rect')
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   })
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
 * @param {Element | string} target The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */
export const interact: InteractStatic = function interact (target: Interact.Target, options?: any) {
  let interactable = scope.interactables.get(target, options)

  if (!interactable) {
    interactable = scope.interactables.new(target, options)
    interactable.events.global = globalEvents
  }

  return interactable
} as InteractStatic

/**
 * Use a plugin
 *
 * @alias module:interact.use
 *
 * @param {Object} plugin
 * @param {function} plugin.install
 * @return {interact}
 */
interact.use = use
function use (plugin: Interact.Plugin, options?: { [key: string]: any }) {
  scope.usePlugin(plugin, options)

  return interact
}

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
interact.isSet = isSet
function isSet (target: Element, options?: any) {
  return !!scope.interactables.get(target, options && options.context)
}

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
interact.on = on
function on (type: string | Interact.EventTypes, listener: Interact.ListenersArg, options?) {
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/)
  }

  if (utils.is.array(type)) {
    for (const eventType of (type as any[])) {
      interact.on(eventType, listener, options)
    }

    return interact
  }

  if (utils.is.object(type)) {
    for (const prop in type) {
      interact.on(prop, (type as Interact.EventTypes)[prop], listener)
    }

    return interact
  }

  // if it is an InteractEvent type, add listener to globalEvents
  if (utils.arr.contains(scope.actions.eventTypes, type)) {
    // if this type of event was never bound
    if (!globalEvents[type]) {
      globalEvents[type] = [listener]
    }
    else {
      globalEvents[type].push(listener)
    }
  }
  // If non InteractEvent type, addEventListener to document
  else {
    events.add(scope.document, type, listener as Interact.Listener, { options })
  }

  return interact
}

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
interact.off = off
function off (type, listener, options) {
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/)
  }

  if (utils.is.array(type)) {
    for (const eventType of type) {
      interact.off(eventType, listener, options)
    }

    return interact
  }

  if (utils.is.object(type)) {
    for (const prop in type) {
      interact.off(prop, type[prop], listener)
    }

    return interact
  }

  if (!utils.arr.contains(scope.actions.eventTypes, type)) {
    events.remove(scope.document, type, listener, options)
  }
  else {
    let index

    if (type in globalEvents &&
        (index = globalEvents[type].indexOf(listener)) !== -1) {
      globalEvents[type].splice(index, 1)
    }
  }

  return interact
}

/**
 * Returns an object which exposes internal data
 * @alias module:interact.debug
 *
 * @return {object} An object with properties that outline the current state
 * and expose internal functions and variables
 */
interact.debug = debug
function debug () {
  return scope
}

// expose the functions used to calculate multi-touch properties
interact.getPointerAverage  = utils.pointer.pointerAverage
interact.getTouchBBox       = utils.pointer.touchBBox
interact.getTouchDistance   = utils.pointer.touchDistance
interact.getTouchAngle      = utils.pointer.touchAngle

interact.getElementRect       = utils.dom.getElementRect
interact.getElementClientRect = utils.dom.getElementClientRect
interact.matchesSelector      = utils.dom.matchesSelector
interact.closest              = utils.dom.closest

/**
 * @alias module:interact.supportsTouch
 *
 * @return {boolean} Whether or not the browser supports touch input
 */
interact.supportsTouch = supportsTouch
function supportsTouch () {
  return browser.supportsTouch
}

/**
 * @alias module:interact.supportsPointerEvent
 *
 * @return {boolean} Whether or not the browser supports PointerEvents
 */
interact.supportsPointerEvent = supportsPointerEvent
function supportsPointerEvent () {
  return browser.supportsPointerEvent
}

/**
 * Cancels all interactions (end events are not fired)
 *
 * @alias module:interact.stop
 *
 * @return {object} interact
 */
interact.stop = stop
function stop () {
  for (const interaction of scope.interactions.list) {
    interaction.stop()
  }

  return interact
}

/**
 * Returns or sets the distance the pointer must be moved before an action
 * sequence occurs. This also affects tolerance for tap events.
 *
 * @alias module:interact.pointerMoveTolerance
 *
 * @param {number} [newValue] The movement from the start position must be greater than this value
 * @return {interact | number}
 */
interact.pointerMoveTolerance = pointerMoveTolerance
function pointerMoveTolerance (newValue) {
  if (utils.is.number(newValue)) {
    scope.interactions.pointerMoveTolerance = newValue

    return interact
  }

  return scope.interactions.pointerMoveTolerance
}

scope.interactables.signals.on('unset', ({ interactable }) => {
  scope.interactables.list.splice(scope.interactables.list.indexOf(interactable), 1)

  // Stop related interactions when an Interactable is unset
  for (const interaction of scope.interactions.list) {
    if (interaction.interactable === interactable && interaction.interacting() && !interaction._ending) {
      interaction.stop()
    }
  }
})

interact.addDocument = (doc, options) => scope.addDocument(doc, options)
interact.removeDocument = (doc) => scope.removeDocument(doc)

scope.interact = interact

export { scope }
export default interact
