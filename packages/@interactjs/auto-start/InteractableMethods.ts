import type { Interactable } from '@interactjs/core/Interactable'
import type { Interaction } from '@interactjs/core/Interaction'
import type { Scope } from '@interactjs/core/scope'
import type { ActionProps, PointerType, PointerEventType, Element } from '@interactjs/core/types'
import is from '@interactjs/utils/is'
import { warnOnce } from '@interactjs/utils/misc'

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    getAction: (
      this: Interactable,
      pointer: PointerType,
      event: PointerEventType,
      interaction: Interaction,
      element: Element,
    ) => ActionProps | null
    styleCursor(newValue: boolean): this
    styleCursor(): boolean
    /**
     * Returns or sets whether the the cursor should be changed depending on the
     * action that would be performed if the mouse were pressed and dragged.
     *
     * @param {boolean} [newValue]
     * @return {boolean | Interactable} The current setting or this Interactable
     */
    styleCursor(newValue?: boolean): boolean | this
    actionChecker(checker: Function): Interactable
    actionChecker(): Function
    /**
     * ```js
     * interact('.resize-drag')
     *   .resizable(true)
     *   .draggable(true)
     *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
     *
     *     if (interact.matchesSelector(event.target, '.drag-handle')) {
     *       // force drag with handle target
     *       action.name = drag
     *     }
     *     else {
     *       // resize from the top and right edges
     *       action.name  = 'resize'
     *       action.edges = { top: true, right: true }
     *     }
     *
     *     return action
     * })
     * ```
     *
     * Returns or sets the function used to check action to be performed on
     * pointerDown
     *
     * @param checker - A function which takes a pointer event,
     * defaultAction string, interactable, element and interaction as parameters
     * and returns an object with name property 'drag' 'resize' or 'gesture' and
     * optionally an `edges` object with boolean 'top', 'left', 'bottom' and right
     * props.
     * @returns The checker function or this Interactable
     */
    actionChecker(checker?: Function): Interactable | Function
    /** @returns This interactable */
    ignoreFrom(newValue: string | Element | null): Interactable
    /** @returns The current ignoreFrom value */
    ignoreFrom(): string | Element | null
    /**
     * If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
     * of it's parents match the given CSS selector or Element, no
     * drag/resize/gesture is started.
     *
     * @deprecated
     * Don't use this method. Instead set the `ignoreFrom` option for each action
     * or for `pointerEvents`
     *
     * ```js
     * interact(targett)
     *   .draggable({
     *     ignoreFrom: 'input, textarea, a[href]'',
     *   })
     *   .pointerEvents({
     *     ignoreFrom: '[no-pointer]',
     *   })
     * ```
     * Interactable
     */
    ignoreFrom(
      /** a CSS selector string, an Element or `null` to not ignore any elements */
      newValue?: string | Element | null,
    ): Interactable | string | Element | null
    allowFrom(): boolean
    /**
     *
     * A drag/resize/gesture is started only If the target of the `mousedown`,
     * `pointerdown` or `touchstart` event or any of it's parents match the given
     * CSS selector or Element.
     *
     * @deprecated
     * Don't use this method. Instead set the `allowFrom` option for each action
     * or for `pointerEvents`
     *
     * ```js
     * interact(targett)
     *   .resizable({
     *     allowFrom: '.resize-handle',
     *   .pointerEvents({
     *     allowFrom: '.handle',,
     *   })
     * ```
     *
     * @param {string | Element | null} [newValue]
     * @return {string | Element | object} The current allowFrom value or this
     * Interactable
     */
    allowFrom(
      /** A CSS selector string, an Element or `null` to allow from any element */
      newValue: string | Element | null,
    ): Interactable
  }
}

function install(scope: Scope) {
  const {
    Interactable, // tslint:disable-line no-shadowed-variable
  } = scope

  Interactable.prototype.getAction = function getAction(
    this: Interactable,
    pointer: PointerType,
    event: PointerEventType,
    interaction: Interaction,
    element: Element,
  ): ActionProps {
    const action = defaultActionChecker(this, event, interaction, element, scope)

    if (this.options.actionChecker) {
      return this.options.actionChecker(pointer, event, action, this, element, interaction)
    }

    return action
  }

  Interactable.prototype.ignoreFrom = warnOnce(function (this: Interactable, newValue) {
    return this._backCompatOption('ignoreFrom', newValue)
  }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).')

  Interactable.prototype.allowFrom = warnOnce(function (this: Interactable, newValue) {
    return this._backCompatOption('allowFrom', newValue)
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).')

  Interactable.prototype.actionChecker = actionChecker

  Interactable.prototype.styleCursor = styleCursor
}

function defaultActionChecker(
  interactable: Interactable,
  event: PointerEventType,
  interaction: Interaction,
  element: Element,
  scope: Scope,
) {
  const rect = interactable.getRect(element)
  const buttons =
    (event as MouseEvent).buttons ||
    {
      0: 1,
      1: 4,
      3: 8,
      4: 16,
    }[(event as MouseEvent).button as 0 | 1 | 3 | 4]
  const arg = {
    action: null,
    interactable,
    interaction,
    element,
    rect,
    buttons,
  }

  scope.fire('auto-start:check', arg)

  return arg.action
}

function styleCursor(this: Interactable, newValue?: boolean) {
  if (is.bool(newValue)) {
    this.options.styleCursor = newValue

    return this
  }

  if (newValue === null) {
    delete this.options.styleCursor

    return this
  }

  return this.options.styleCursor
}

function actionChecker(this: Interactable, checker?: any) {
  if (is.func(checker)) {
    this.options.actionChecker = checker

    return this
  }

  if (checker === null) {
    delete this.options.actionChecker

    return this
  }

  return this.options.actionChecker
}

export default {
  id: 'auto-start/interactableMethods',
  install,
}
