import browser from '@interactjs/utils/browser'
import * as domUtils from '@interactjs/utils/domUtils'
import is from '@interactjs/utils/is'
import isNonNativeEvent from '@interactjs/utils/isNonNativeEvent'
import { warnOnce } from '@interactjs/utils/misc'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import type { Scope, Plugin } from '@interactjs/core/scope'
import type { Context, EventTypes, Listener, ListenersArg, Target } from '@interactjs/core/types'

import type { Interactable } from './Interactable'
import type { Options } from './options'

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
 * @param {Element | string} target The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */
export interface InteractStatic {
  (target: Target, options?: Options): Interactable
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
  /** @internal */ scope: Scope
  /**
   * Use a plugin
   */
  use(
    plugin: Plugin,
    options?: {
      [key: string]: any
    },
  ): any
  /**
   * Check if an element or selector has been set with the `interact(target)`
   * function
   *
   * @return {boolean} Indicates if the element or CSS selector was previously
   * passed to interact
   */
  isSet(
    /* The Element or string being searched for */
    target: Target,
    options?: any,
  ): boolean
  on(type: string | EventTypes, listener: ListenersArg, options?: object): any
  off(type: EventTypes, listener: any, options?: object): any
  debug(): any
  /**
   * Whether or not the browser supports touch input
   */
  supportsTouch(): boolean
  /**
   * Whether or not the browser supports PointerEvents
   */
  supportsPointerEvent(): boolean
  /**
   * Cancels all interactions (end events are not fired)
   */
  stop(): InteractStatic
  /**
   * Returns or sets the distance the pointer must be moved before an action
   * sequence occurs. This also affects tolerance for tap events.
   */
  pointerMoveTolerance(
    /** The movement from the start position must be greater than this value */
    newValue?: number,
  ): InteractStatic | number
  addDocument(doc: Document, options?: object): void
  removeDocument(doc: Document): void
}

export function createInteractStatic(scope: Scope): InteractStatic {
  const interact = ((target: Target, options: Options) => {
    let interactable = scope.interactables.getExisting(target, options)

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
  interact.use = function (plugin, options) {
    this.scope.usePlugin(plugin, options)

    return this
  }

  interact.isSet = function (target: Target, options?: { context?: Context }): boolean {
    return !!this.scope.interactables.get(target, options && options.context)
  }

  interact.on = warnOnce(function on(type: string | EventTypes, listener: ListenersArg, options?: object) {
    if (is.string(type) && type.search(' ') !== -1) {
      type = type.trim().split(/ +/)
    }

    if (is.array(type)) {
      for (const eventType of type as any[]) {
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
      } else {
        this.globalEvents[type].push(listener)
      }
    }
    // If non InteractEvent type, addEventListener to document
    else {
      this.scope.events.add(this.scope.document, type, listener as Listener, { options })
    }

    return this
  }, 'The interact.on() method is being deprecated')

  interact.off = warnOnce(function off(type: EventTypes, listener: any, options?: object) {
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

      if (type in this.globalEvents && (index = this.globalEvents[type].indexOf(listener)) !== -1) {
        this.globalEvents[type].splice(index, 1)
      }
    } else {
      this.scope.events.remove(this.scope.document, type, listener, options)
    }

    return this
  }, 'The interact.off() method is being deprecated')

  interact.debug = function () {
    return this.scope
  }

  interact.supportsTouch = function () {
    return browser.supportsTouch
  }

  interact.supportsPointerEvent = function () {
    return browser.supportsPointerEvent
  }

  interact.stop = function () {
    for (const interaction of this.scope.interactions.list) {
      interaction.stop()
    }

    return this
  }

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

  return interact
}
