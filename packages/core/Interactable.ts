import * as arr from '@interactjs/utils/arr'
import browser from '@interactjs/utils/browser'
import clone from '@interactjs/utils/clone'
import { getElementRect, matchesUpTo, nodeContains, trySelector } from '@interactjs/utils/domUtils'
import events from '@interactjs/utils/events'
import extend from '@interactjs/utils/extend'
import * as is from '@interactjs/utils/is'
import normalizeListeners from '@interactjs/utils/normalizeListeners'
import { getWindow } from '@interactjs/utils/window'
import { ActionDefaults, Defaults, Options } from './defaultOptions'
import Eventable from './Eventable'
import { Actions } from './scope'

type IgnoreValue = string | Element | boolean

/** */
export class Interactable implements Partial<Eventable> {
  protected get _defaults (): Defaults {
    return {
      base: {},
      perAction: {},
      actions: {} as ActionDefaults,
    }
  }

  readonly options!: Required<Options>
  readonly _actions: Actions
  readonly target: Interact.Target
  readonly events = new Eventable()
  readonly _context: Document | Element
  readonly _win: Window
  readonly _doc: Document

  /** */
  constructor (target: Interact.Target, options: any, defaultContext: Document | Element) {
    this._actions = options.actions
    this.target   = target
    this._context = options.context || defaultContext
    this._win     = getWindow(trySelector(target) ? this._context : target)
    this._doc     = this._win.document

    this.set(options)
  }

  setOnEvents (actionName: string, phases: NonNullable<any>) {
    if (is.func(phases.onstart)) { this.on(`${actionName}start`, phases.onstart) }
    if (is.func(phases.onmove)) { this.on(`${actionName}move`, phases.onmove) }
    if (is.func(phases.onend)) { this.on(`${actionName}end`, phases.onend) }
    if (is.func(phases.oninertiastart)) { this.on(`${actionName}inertiastart`, phases.oninertiastart) }

    return this
  }

  updatePerActionListeners (actionName, prev, cur) {
    if (is.array(prev) || is.object(prev)) {
      this.off(actionName, prev)
    }

    if (is.array(cur) || is.object(cur)) {
      this.on(actionName, cur)
    }
  }

  setPerAction (actionName, options: Interact.OrBoolean<Options>) {
    const defaults = this._defaults

    // for all the default per-action options
    for (const optionName in options) {
      const actionOptions = this.options[actionName]
      const optionValue = options[optionName]
      const isArray = is.array(optionValue)

      // remove old event listeners and add new ones
      if (optionName === 'listeners') {
        this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue)
      }

      // if the option value is an array
      if (isArray) {
        actionOptions[optionName] = arr.from(optionValue)
      }
      // if the option value is an object
      else if (!isArray && is.plainObject(optionValue)) {
        // copy the object
        actionOptions[optionName] = extend(
          actionOptions[optionName] || {},
          clone(optionValue))

        // set anabled field to true if it exists in the defaults
        if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
          actionOptions[optionName].enabled = optionValue.enabled !== false
        }
      }
      // if the option value is a boolean and the default is an object
      else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
        actionOptions[optionName].enabled = optionValue
      }
      // if it's anything else, do a plain assignment
      else {
        actionOptions[optionName] = optionValue
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
  getRect (element: Element) {
    element = element || (is.element(this.target)
      ? this.target
      : null)

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
  rectChecker (checker: (element: Element) => any) {
    if (is.func(checker)) {
      this.getRect = checker

      return this
    }

    if (checker === null) {
      delete this.getRect

      return this
    }

    return this.getRect
  }

  _backCompatOption (optionName, newValue) {
    if (trySelector(newValue) || is.object(newValue)) {
      this.options[optionName] = newValue

      for (const action of this._actions.names) {
        this.options[action][optionName] = newValue
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
  origin (newValue) {
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
  deltaSource (newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue

      return this
    }

    return this.options.deltaSource
  }

  /**
   * Gets the selector context Node of the Interactable. The default is
   * `window.document`.
   *
   * @return {Node} The context Node of this Interactable
   */
  context () {
    return this._context
  }

  inContext (element) {
    return (this._context === element.ownerDocument ||
            nodeContains(this._context, element))
  }

  testIgnoreAllow (this: Interactable, options: { ignoreFrom: IgnoreValue, allowFrom: IgnoreValue }, targetNode: Node, eventTarget: Element) {
    return (!this.testIgnore(options.ignoreFrom, targetNode, eventTarget) &&
            this.testAllow(options.allowFrom, targetNode, eventTarget))
  }

  testAllow (this: Interactable, allowFrom: IgnoreValue, targetNode: Node, element: Element) {
    if (!allowFrom) { return true }

    if (!is.element(element)) { return false }

    if (is.string(allowFrom)) {
      return matchesUpTo(element, allowFrom, targetNode)
    }
    else if (is.element(allowFrom)) {
      return nodeContains(allowFrom, element)
    }

    return false
  }

  testIgnore (this: Interactable, ignoreFrom: IgnoreValue, targetNode: Node, element: Element) {
    if (!ignoreFrom || !is.element(element)) { return false }

    if (is.string(ignoreFrom)) {
      return matchesUpTo(element, ignoreFrom, targetNode)
    }
    else if (is.element(ignoreFrom)) {
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
  fire (iEvent) {
    this.events.fire(iEvent)

    return this
  }

  _onOff (method: 'on' | 'off', typeArg: Interact.EventTypes, listenerArg?: Interact.ListenersArg | null, options?: any) {
    if (is.object(typeArg) && !is.array(typeArg)) {
      options = listenerArg
      listenerArg = null
    }

    const addRemove = method === 'on' ? 'add' : 'remove'
    const listeners = normalizeListeners(typeArg, listenerArg)

    for (let type in listeners) {
      if (type === 'wheel') { type = browser.wheelEvent }

      for (const listener of listeners[type]) {
        // if it is an action event type
        if (arr.contains(this._actions.eventTypes, type)) {
          this.events[method](type, listener)
        }
        // delegated event
        else if (is.string(this.target)) {
          events[`${addRemove}Delegate`](this.target, this._context, type, listener, options)
        }
        // remove listener from this Interatable's element
        else {
          (events[addRemove] as typeof events.remove)(this.target, type, listener, options)
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
  on (types: Interact.EventTypes, listener?: Interact.ListenersArg, options?: any) {
    return this._onOff('on', types, listener, options)
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
  off (types: string | string[] | Interact.EventTypes, listener?: Interact.ListenersArg, options?: any) {
    return this._onOff('off', types, listener, options)
  }

  /**
   * Reset the options of this Interactable
   *
   * @param {object} options The new settings to apply
   * @return {object} This Interactable
   */
  set (options: Interact.OptionsArg) {
    const defaults = this._defaults

    if (!is.object(options)) {
      options = {}
    }

    (this.options as Required<Options>) = clone(defaults.base) as Required<Options>

    for (const actionName in this._actions.methodDict) {
      const methodName = this._actions.methodDict[actionName]

      this.options[actionName] = {}
      this.setPerAction(actionName, extend(extend({}, defaults.perAction), defaults.actions[actionName]))

      this[methodName](options[actionName])
    }

    for (const setting in options) {
      if (is.func(this[setting])) {
        this[setting](options[setting])
      }
    }

    return this
  }

  /**
   * Remove this interactable from the list of interactables and remove it's
   * action capabilities and event listeners
   *
   * @return {interact}
   */
  unset () {
    events.remove(this.target as Node, 'all')

    if (is.string(this.target)) {
      // remove delegated events
      for (const type in events.delegatedEvents) {
        const delegated = events.delegatedEvents[type]

        if (delegated.selectors[0] === this.target &&
            delegated.contexts[0] === this._context) {
          delegated.selectors.splice(0, 1)
          delegated.contexts.splice(0, 1)
          delegated.listeners.splice(0, 1)

          // remove the arrays if they are empty
          if (!delegated.selectors.length) {
            delegated[type] = null
          }
        }

        events.remove(this._context, type, events.delegateListener)
        events.remove(this._context, type, events.delegateUseCapture, true)
      }
    }
    else {
      events.remove(this.target as Node, 'all')
    }
  }
}

export default Interactable
