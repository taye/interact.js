import { warnOnce } from '@interactjs/utils'
import * as is from '@interactjs/utils/is'

// TODO: there seems to be a @babel/preset-typescript bug causing regular import
// syntax to remain in js output
type Scope = import ('@interactjs/core/scope').Scope
type Actions = import ('@interactjs/core/scope').Actions
type Interaction = import ('@interactjs/core/Interaction').default
type Interactable = import ('@interactjs/core/Interactable').default

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    getAction: typeof getAction
    defaultActionChecker: (pointer: any, event: any, interaction: any, element: any) => any
    styleCursor: typeof styleCursor
    actionChecker: typeof actionChecker
    ignoreFrom: (...args: any) => boolean
    allowFrom: (...args: any) => boolean
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    pointerIsDown: boolean
  }
}

function install (scope: Scope) {
  const {
    /** @lends Interactable */
    Interactable, // tslint:disable-line no-shadowed-variable
    actions,
  } = scope

  Interactable.prototype.getAction = getAction

  /**
   * ```js
   * interact(element, { ignoreFrom: document.getElementById('no-action') })
   * // or
   * interact(element).ignoreFrom('input, textarea, a')
   * ```
   * @deprecated
   * If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
   * of it's parents match the given CSS selector or Element, no
   * drag/resize/gesture is started.
   *
   * Don't use this method. Instead set the `ignoreFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .draggable({
   *     ignoreFrom: 'input, textarea, a[href]'',
   *   })
   *   .pointerEvents({
   *     ignoreFrom: '[no-pointer]',
   *   })
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to not ignore any elements
   * @return {string | Element | object} The current ignoreFrom value or this
   * Interactable
   */
  Interactable.prototype.ignoreFrom = warnOnce(function (this: Interactable, newValue) {
    return this._backCompatOption('ignoreFrom', newValue)
  }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).')

  /**
   * @deprecated
   *
   * A drag/resize/gesture is started only If the target of the `mousedown`,
   * `pointerdown` or `touchstart` event or any of it's parents match the given
   * CSS selector or Element.
   *
   * Don't use this method. Instead set the `allowFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .resizable({
   *     allowFrom: '.resize-handle',
   *   .pointerEvents({
   *     allowFrom: '.handle',,
   *   })
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to allow from any element
   * @return {string | Element | object} The current allowFrom value or this
   * Interactable
   */
  Interactable.prototype.allowFrom = warnOnce(function (this: Interactable, newValue) {
    return this._backCompatOption('allowFrom', newValue)
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).')

  /**
   * ```js
   * interact('.resize-drag')
   *   .resizable(true)
   *   .draggable(true)
   *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
   *
   *   if (interact.matchesSelector(event.target, '.drag-handle')) {
   *     // force drag with handle target
   *     action.name = drag
   *   }
   *   else {
   *     // resize from the top and right edges
   *     action.name  = 'resize'
   *     action.edges = { top: true, right: true }
   *   }
   *
   *   return action
   * })
   * ```
   *
   * Returns or sets the function used to check action to be performed on
   * pointerDown
   *
   * @param {function | null} [checker] A function which takes a pointer event,
   * defaultAction string, interactable, element and interaction as parameters
   * and returns an object with name property 'drag' 'resize' or 'gesture' and
   * optionally an `edges` object with boolean 'top', 'left', 'bottom' and right
   * props.
   * @return {Function | Interactable} The checker function or this Interactable
   */
  Interactable.prototype.actionChecker = actionChecker

  /**
   * Returns or sets whether the the cursor should be changed depending on the
   * action that would be performed if the mouse were pressed and dragged.
   *
   * @param {boolean} [newValue]
   * @return {boolean | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.styleCursor = styleCursor

  Interactable.prototype.defaultActionChecker = function (this: Interactable, pointer, event, interaction, element) {
    return defaultActionChecker(this, pointer, event, interaction, element, actions)
  }
}

function getAction (this: Interactable, pointer: Interact.PointerType, event: Interact.PointerEventType, interaction: Interaction, element: Element): Interact.ActionProps {
  const action = this.defaultActionChecker(pointer, event, interaction, element)

  if (this.options.actionChecker) {
    return this.options.actionChecker(pointer, event, action, this, element, interaction)
  }

  return action
}

function defaultActionChecker (interactable: Interactable, pointer: Interact.PointerType, event: Interact.PointerEventType, interaction: Interaction, element: Element, actions: Actions) {
  const rect = interactable.getRect(element)
  const buttons = (event as MouseEvent).buttons || ({
    0: 1,
    1: 4,
    3: 8,
    4: 16,
  })[(event as MouseEvent).button as 0 | 1 | 3 | 4]
  let action = null

  for (const actionName of actions.names) {
    // check mouseButton setting if the pointer is down
    if (interaction.pointerIsDown &&
        /mouse|pointer/.test(interaction.pointerType) &&
      (buttons & interactable.options[actionName].mouseButtons) === 0) {
      continue
    }

    action = (actions[actionName as keyof Actions] as any).checker(pointer, event, interactable, element, interaction, rect)

    if (action) {
      return action
    }
  }
}

function styleCursor (this: Interactable, newValue?: boolean) {
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

function actionChecker (this: Interactable, checker: any) {
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
