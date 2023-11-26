/* eslint-disable no-dupe-class-members */
import * as arr from '@interactjs/utils/arr'
import browser from '@interactjs/utils/browser'
import clone from '@interactjs/utils/clone'
import { getElementRect, matchesUpTo, nodeContains, trySelector } from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'
import isNonNativeEvent from '@interactjs/utils/isNonNativeEvent'
import normalizeListeners from '@interactjs/utils/normalizeListeners'
import { getWindow } from '@interactjs/utils/window'

import type { Scope } from '@interactjs/core/scope'
import type {
  ActionMap,
  ActionMethod,
  ActionName,
  Actions,
  Context,
  Element,
  EventTypes,
  Listeners,
  ListenersArg,
  OrBoolean,
  Target,
} from '@interactjs/core/types'

import { Eventable } from './Eventable'
import type { ActionDefaults, Defaults, OptionsArg, PerActionDefaults, Options } from './options'

type IgnoreValue = string | Element | boolean
type DeltaSource = 'page' | 'client'

const enum OnOffMethod {
  On,
  Off,
}

/**
 * ```ts
 * const interactable = interact('.cards')
 *   .draggable({
 *     listeners: { move: event => console.log(event.type, event.pageX, event.pageY) }
 *   })
 *   .resizable({
 *     listeners: { move: event => console.log(event.rect) },
 *     modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })]
 *   })
 * ```
 */
export class Interactable implements Partial<Eventable> {
  /** @internal */ get _defaults(): Defaults {
    return {
      base: {},
      perAction: {},
      actions: {} as ActionDefaults,
    }
  }

  readonly target: Target
  /** @internal */ readonly options!: Required<Options>
  /** @internal */ readonly _actions: Actions
  /** @internal */ readonly events = new Eventable()
  /** @internal */ readonly _context: Context
  /** @internal */ readonly _win: Window
  /** @internal */ readonly _doc: Document
  /** @internal */ readonly _scopeEvents: Scope['events']

  constructor(
    target: Target,
    options: any,
    defaultContext: Document | Element,
    scopeEvents: Scope['events'],
  ) {
    this._actions = options.actions
    this.target = target
    this._context = options.context || defaultContext
    this._win = getWindow(trySelector(target) ? this._context : target)
    this._doc = this._win.document
    this._scopeEvents = scopeEvents

    this.set(options)
  }

  setOnEvents(actionName: ActionName, phases: NonNullable<any>) {
    if (is.func(phases.onstart)) {
      this.on(`${actionName}start`, phases.onstart)
    }
    if (is.func(phases.onmove)) {
      this.on(`${actionName}move`, phases.onmove)
    }
    if (is.func(phases.onend)) {
      this.on(`${actionName}end`, phases.onend)
    }
    if (is.func(phases.oninertiastart)) {
      this.on(`${actionName}inertiastart`, phases.oninertiastart)
    }

    return this
  }

  updatePerActionListeners(actionName: ActionName, prev: Listeners | undefined, cur: Listeners | undefined) {
    const actionFilter = (this._actions.map[actionName] as { filterEventType?: (type: string) => boolean })
      ?.filterEventType
    const filter = (type: string) =>
      (actionFilter == null || actionFilter(type)) && isNonNativeEvent(type, this._actions)

    if (is.array(prev) || is.object(prev)) {
      this._onOff(OnOffMethod.Off, actionName, prev, undefined, filter)
    }

    if (is.array(cur) || is.object(cur)) {
      this._onOff(OnOffMethod.On, actionName, cur, undefined, filter)
    }
  }

  setPerAction(actionName: ActionName, options: OrBoolean<Options>) {
    const defaults = this._defaults

    // for all the default per-action options
    for (const optionName_ in options) {
      const optionName = optionName_ as keyof PerActionDefaults
      const actionOptions = this.options[actionName]
      const optionValue: any = options[optionName]

      // remove old event listeners and add new ones
      if (optionName === 'listeners') {
        this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue as Listeners)
      }

      // if the option value is an array
      if (is.array(optionValue)) {
        ;(actionOptions[optionName] as any) = arr.from(optionValue)
      }
      // if the option value is an object
      else if (is.plainObject(optionValue)) {
        // copy the object
        ;(actionOptions[optionName] as any) = extend(
          actionOptions[optionName] || ({} as any),
          clone(optionValue),
        )

        // set anabled field to true if it exists in the defaults
        if (
          is.object(defaults.perAction[optionName]) &&
          'enabled' in (defaults.perAction[optionName] as any)
        ) {
          ;(actionOptions[optionName] as any).enabled = optionValue.enabled !== false
        }
      }
      // if the option value is a boolean and the default is an object
      else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
        ;(actionOptions[optionName] as any).enabled = optionValue
      }
      // if it's anything else, do a plain assignment
      else {
        ;(actionOptions[optionName] as any) = optionValue
      }
    }
  }

  /**
   * The default function to get an Interactables bounding rect. Can be
   * overridden using {@link Interactable.rectChecker}.
   *
   * @param {Element} [element] The element to measure.
   * @return {Rect} The object's bounding rectangle.
   */
  getRect(element: Element) {
    element = element || (is.element(this.target) ? this.target : null)

    if (is.string(this.target)) {
      element = element || this._context.querySelector(this.target)
    }

    return getElementRect(element)
  }

  /**
   * Returns or sets the function used to calculate the interactable's
   * element's rectangle
   *
   * @param {function} [checker] A function which returns this Interactable's
   * bounding rectangle. See {@link Interactable.getRect}
   * @return {function | object} The checker function or this Interactable
   */
  rectChecker(): (element: Element) => any | null
  rectChecker(checker: (element: Element) => any): this
  rectChecker(checker?: (element: Element) => any) {
    if (is.func(checker)) {
      this.getRect = (element) => {
        const rect = extend({}, checker.apply(this, element))

        if (!(('width' in rect) as unknown)) {
          rect.width = rect.right - rect.left
          rect.height = rect.bottom - rect.top
        }

        return rect
      }

      return this
    }

    if (checker === null) {
      delete (this as Partial<typeof this>).getRect

      return this
    }

    return this.getRect
  }

  /** @internal */
  _backCompatOption(optionName: keyof Options, newValue: any) {
    if (trySelector(newValue) || is.object(newValue)) {
      ;(this.options[optionName] as any) = newValue

      for (const action in this._actions.map) {
        ;(this.options[action as keyof ActionMap] as any)[optionName] = newValue
      }

      return this
    }

    return this.options[optionName]
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
  origin(newValue: any) {
    return this._backCompatOption('origin', newValue)
  }

  /**
   * Returns or sets the mouse coordinate types used to calculate the
   * movement of the pointer.
   *
   * @param {string} [newValue] Use 'client' if you will be scrolling while
   * interacting; Use 'page' if you want autoScroll to work
   * @return {string | object} The current deltaSource or this Interactable
   */
  deltaSource(): DeltaSource
  deltaSource(newValue: DeltaSource): this
  deltaSource(newValue?: DeltaSource) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue

      return this
    }

    return this.options.deltaSource
  }

  /** @internal */
  getAllElements(): Element[] {
    const { target } = this

    if (is.string(target)) {
      return Array.from(this._context.querySelectorAll(target))
    }

    if (is.func(target) && (target as any).getAllElements) {
      return (target as any).getAllElements()
    }

    return is.element(target) ? [target] : []
  }

  /**
   * Gets the selector context Node of the Interactable. The default is
   * `window.document`.
   *
   * @return {Node} The context Node of this Interactable
   */
  context() {
    return this._context
  }

  inContext(element: Document | Node) {
    return this._context === element.ownerDocument || nodeContains(this._context, element)
  }

  /** @internal */
  testIgnoreAllow(
    this: Interactable,
    options: { ignoreFrom?: IgnoreValue; allowFrom?: IgnoreValue },
    targetNode: Node,
    eventTarget: Node,
  ) {
    return (
      !this.testIgnore(options.ignoreFrom, targetNode, eventTarget) &&
      this.testAllow(options.allowFrom, targetNode, eventTarget)
    )
  }

  /** @internal */
  testAllow(this: Interactable, allowFrom: IgnoreValue | undefined, targetNode: Node, element: Node) {
    if (!allowFrom) {
      return true
    }

    if (!is.element(element)) {
      return false
    }

    if (is.string(allowFrom)) {
      return matchesUpTo(element, allowFrom, targetNode)
    } else if (is.element(allowFrom)) {
      return nodeContains(allowFrom, element)
    }

    return false
  }

  /** @internal */
  testIgnore(this: Interactable, ignoreFrom: IgnoreValue | undefined, targetNode: Node, element: Node) {
    if (!ignoreFrom || !is.element(element)) {
      return false
    }

    if (is.string(ignoreFrom)) {
      return matchesUpTo(element, ignoreFrom, targetNode)
    } else if (is.element(ignoreFrom)) {
      return nodeContains(ignoreFrom, element)
    }

    return false
  }

  /**
   * Calls listeners for the given InteractEvent type bound globally
   * and directly to this Interactable
   *
   * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
   * Interactable
   * @return {Interactable} this Interactable
   */
  fire<E extends { type: string }>(iEvent: E) {
    this.events.fire(iEvent)

    return this
  }

  /** @internal */
  _onOff(
    method: OnOffMethod,
    typeArg: EventTypes,
    listenerArg?: ListenersArg | null,
    options?: any,
    filter?: (type: string) => boolean,
  ) {
    if (is.object(typeArg) && !is.array(typeArg)) {
      options = listenerArg
      listenerArg = null
    }

    const listeners = normalizeListeners(typeArg, listenerArg, filter)

    for (let type in listeners) {
      if (type === 'wheel') {
        type = browser.wheelEvent
      }

      for (const listener of listeners[type]) {
        // if it is an action event type
        if (isNonNativeEvent(type, this._actions)) {
          this.events[method === OnOffMethod.On ? 'on' : 'off'](type, listener)
        }
        // delegated event
        else if (is.string(this.target)) {
          this._scopeEvents[method === OnOffMethod.On ? 'addDelegate' : 'removeDelegate'](
            this.target,
            this._context,
            type,
            listener,
            options,
          )
        }
        // remove listener from this Interactable's element
        else {
          this._scopeEvents[method === OnOffMethod.On ? 'add' : 'remove'](
            this.target,
            type,
            listener,
            options,
          )
        }
      }
    }

    return this
  }

  /**
   * Binds a listener for an InteractEvent, pointerEvent or DOM event.
   *
   * @param {string | array | object} types The types of events to listen
   * for
   * @param {function | array | object} [listener] The event listener function(s)
   * @param {object | boolean} [options] options object or useCapture flag for
   * addEventListener
   * @return {Interactable} This Interactable
   */
  on(types: EventTypes, listener?: ListenersArg, options?: any) {
    return this._onOff(OnOffMethod.On, types, listener, options)
  }

  /**
   * Removes an InteractEvent, pointerEvent or DOM event listener.
   *
   * @param {string | array | object} types The types of events that were
   * listened for
   * @param {function | array | object} [listener] The event listener function(s)
   * @param {object | boolean} [options] options object or useCapture flag for
   * removeEventListener
   * @return {Interactable} This Interactable
   */
  off(types: string | string[] | EventTypes, listener?: ListenersArg, options?: any) {
    return this._onOff(OnOffMethod.Off, types, listener, options)
  }

  /**
   * Reset the options of this Interactable
   *
   * @param {object} options The new settings to apply
   * @return {object} This Interactable
   */
  set(options: OptionsArg) {
    const defaults = this._defaults

    if (!is.object(options)) {
      options = {}
    }

    ;(this.options as Required<Options>) = clone(defaults.base) as Required<Options>

    for (const actionName_ in this._actions.methodDict) {
      const actionName = actionName_ as ActionName
      const methodName = this._actions.methodDict[actionName]

      this.options[actionName] = {}
      this.setPerAction(actionName, extend(extend({}, defaults.perAction), defaults.actions[actionName]))
      ;(this[methodName] as ActionMethod<unknown>)(options[actionName])
    }

    for (const setting in options) {
      if (setting === 'getRect') {
        this.rectChecker(options.getRect)
        continue
      }

      if (is.func((this as any)[setting])) {
        ;(this as any)[setting](options[setting as keyof typeof options])
      }
    }

    return this
  }

  /**
   * Remove this interactable from the list of interactables and remove it's
   * action capabilities and event listeners
   */
  unset() {
    if (is.string(this.target)) {
      // remove delegated events
      for (const type in this._scopeEvents.delegatedEvents) {
        const delegated = this._scopeEvents.delegatedEvents[type]

        for (let i = delegated.length - 1; i >= 0; i--) {
          const { selector, context, listeners } = delegated[i]

          if (selector === this.target && context === this._context) {
            delegated.splice(i, 1)
          }

          for (let l = listeners.length - 1; l >= 0; l--) {
            this._scopeEvents.removeDelegate(
              this.target,
              this._context,
              type,
              listeners[l][0],
              listeners[l][1],
            )
          }
        }
      }
    } else {
      this._scopeEvents.remove(this.target, 'all')
    }
  }
}
