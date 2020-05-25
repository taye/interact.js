/** @module interact */
import * as Interact from '@interactjs/types/index'
import browser from '@interactjs/utils/browser'
import * as domUtils from '@interactjs/utils/domUtils'
import is from '@interactjs/utils/is'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import { Interactable } from './Interactable'
import { Options } from './defaultOptions'
import isNonNativeEvent from './isNonNativeEvent'

export interface InteractStatic {
  (target: Interact.Target, options?: Options): Interactable
  getPointerAverage: typeof pointerUtils.pointerAverage
  getTouchBBox: typeof pointerUtils.touchBBox
  getTouchDistance: typeof pointerUtils.touchDistance
  getTouchAngle: typeof pointerUtils.touchAngle
  getElementRect: typeof domUtils.getElementRect
  getElementClientRect: typeof domUtils.getElementClientRect
  matchesSelector: typeof domUtils.matchesSelector
  closest: typeof domUtils.closest
  /** @internal */ globalEvents: any
  version: string
  /** @internal */ scope: Interact.Scope
  use(plugin: Interact.Plugin, options?: {
    [key: string]: any
  }): any
  isSet(target: Interact.Element, options?: any): boolean
  on(type: string | Interact.EventTypes, listener: Interact.ListenersArg, options?: object): any
  off(type: Interact.EventTypes, listener: any, options?: object): any
  debug(): any
  supportsTouch(): boolean
  supportsPointerEvent(): boolean
  stop(): any
  pointerMoveTolerance(newValue?: number): any
  addDocument(doc: Document, options?: object): void
  removeDocument(doc: Document): void
}

export function createInteractStatic (scope: Interact.Scope): Interact.InteractStatic {
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
  const interact = ((target, options) => {
    let interactable = scope.interactables.get(target, options)

    if (!interactable) {
      interactable = scope.interactables.new(target, options)
      interactable.events.global = interact.globalEvents
    }

    return interactable
  }) as InteractStatic

  // expose the functions used to calculate multi-touch properties
  interact.getPointerAverage = pointerUtils.pointerAverage
  interact.getTouchBBox = pointerUtils.touchBBox
  interact.getTouchDistance = pointerUtils.touchDistance
  interact.getTouchAngle = pointerUtils.touchAngle

  interact.getElementRect = domUtils.getElementRect
  interact.getElementClientRect = domUtils.getElementClientRect
  interact.matchesSelector = domUtils.matchesSelector
  interact.closest = domUtils.closest

  interact.globalEvents = {} as any

  // eslint-disable-next-line no-undef
  interact.version = process.env.npm_package_version
  interact.scope = scope
  /**
  * Use a plugin
  *
  * @alias module:interact.use
  *
  * @param {Object} plugin
  * @param {function} plugin.install
  * @return {Interact.InteractStatic}
   */
  interact.use = function (plugin, options) {
    this.scope.usePlugin(plugin, options)

    return this
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
  interact.isSet = function (target, options) {
    return !!this.scope.interactables.get(target, options && options.context)
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
  interact.on = function (type: string | Interact.EventTypes, listener: Interact.ListenersArg, options?: object) {
    if (is.string(type) && type.search(' ') !== -1) {
      type = type.trim().split(/ +/)
    }

    if (is.array(type)) {
      for (const eventType of (type as any[])) {
        this.on(eventType, listener, options)
      }

      return this
    }

    if (is.object(type)) {
      for (const prop in type) {
        this.on(prop, (type as any)[prop], listener)
      }

      return this
    }

    // if it is an InteractEvent type, add listener to globalEvents
    if (isNonNativeEvent(type, this.scope.actions)) {
      // if this type of event was never bound
      if (!this.globalEvents[type]) {
        this.globalEvents[type] = [listener]
      }
      else {
        this.globalEvents[type].push(listener)
      }
    }
    // If non InteractEvent type, addEventListener to document
    else {
      this.scope.events.add(this.scope.document, type, listener as Interact.Listener, { options })
    }

    return this
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
  interact.off = function (type: Interact.EventTypes, listener: any, options?: object) {
    if (is.string(type) && type.search(' ') !== -1) {
      type = type.trim().split(/ +/)
    }

    if (is.array(type)) {
      for (const eventType of type) {
        this.off(eventType, listener, options)
      }

      return this
    }

    if (is.object(type)) {
      for (const prop in type) {
        this.off(prop, type[prop], listener)
      }

      return this
    }

    if (isNonNativeEvent(type, this.scope.actions)) {
      let index: number

      if (type in this.globalEvents &&
            (index = this.globalEvents[type].indexOf(listener)) !== -1) {
        this.globalEvents[type].splice(index, 1)
      }
    }
    else {
      this.scope.events.remove(this.scope.document, type, listener, options)
    }

    return this
  }

  interact.debug = function () {
    return this.scope
  }

  /**
   * @alias module:interact.supportsTouch
   *
   * @return {boolean} Whether or not the browser supports touch input
   */
  interact.supportsTouch = function () {
    return browser.supportsTouch
  }

  /**
   * @alias module:interact.supportsPointerEvent
   *
   * @return {boolean} Whether or not the browser supports PointerEvents
   */
  interact.supportsPointerEvent = function () {
    return browser.supportsPointerEvent
  }

  /**
   * Cancels all interactions (end events are not fired)
   *
   * @alias module:interact.stop
   *
   * @return {object} interact
   */
  interact.stop = function () {
    for (const interaction of this.scope.interactions.list) {
      interaction.stop()
    }

    return this
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
  interact.pointerMoveTolerance = function (newValue?: number) {
    if (is.number(newValue)) {
      this.scope.interactions.pointerMoveTolerance = newValue

      return this
    }

    return this.scope.interactions.pointerMoveTolerance
  }

  interact.addDocument = function (doc: Document, options?: object) {
    this.scope.addDocument(doc, options)
  }

  interact.removeDocument = function (doc: Document) {
    this.scope.removeDocument(doc)
  }

  return interact as any
}
