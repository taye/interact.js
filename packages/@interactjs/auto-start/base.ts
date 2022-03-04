import type { Interactable } from '@interactjs/core/Interactable'
import type { Interaction, ActionProps } from '@interactjs/core/Interaction'
import type { Scope, SignalArgs, ActionName, Plugin } from '@interactjs/core/scope'
import type { CursorChecker, PointerType, PointerEventType, Element } from '@interactjs/types/index'
import * as domUtils from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'
import { copyAction } from '@interactjs/utils/misc'

import InteractableMethods from './InteractableMethods'

declare module '@interactjs/core/InteractStatic' {
  export interface InteractStatic {
    maxInteractions: (newValue: any) => any
  }
}

declare module '@interactjs/core/scope' {
  interface Scope {
    autoStart: AutoStart
  }

  interface SignalArgs {
    'autoStart:before-start': Omit<SignalArgs['interactions:move'], 'interaction'> & {
      interaction: Interaction<ActionName>
    }
    'autoStart:prepared': { interaction: Interaction }
    'auto-start:check': CheckSignalArg
  }
}

declare module '@interactjs/core/options' {
  interface BaseDefaults {
    actionChecker?: any
    cursorChecker?: any
    styleCursor?: any
  }

  interface PerActionDefaults {
    manualStart?: boolean
    max?: number
    maxPerElement?: number
    allowFrom?: string | Element
    ignoreFrom?: string | Element
    cursorChecker?: CursorChecker

    // only allow left button by default
    // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
    // TODO: docst
    mouseButtons?: 0 | 1 | 2 | 4 | 8 | 16
  }
}

interface CheckSignalArg {
  interactable: Interactable
  interaction: Interaction
  element: Element
  action: ActionProps<ActionName>
  buttons: number
}

export interface AutoStart {
  // Allow this many interactions to happen simultaneously
  maxInteractions: number
  withinInteractionLimit: typeof withinInteractionLimit
  cursorElement: Element
}

function install (scope: Scope) {
  const { interactStatic: interact, defaults } = scope

  scope.usePlugin(InteractableMethods)

  defaults.base.actionChecker = null
  defaults.base.styleCursor = true

  extend(defaults.perAction, {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1,
    allowFrom: null,
    ignoreFrom: null,

    // only allow left button by default
    // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
    mouseButtons: 1,
  })

  /**
   * Returns or sets the maximum number of concurrent interactions allowed.  By
   * default only 1 interaction is allowed at a time (for backwards
   * compatibility). To allow multiple interactions on the same Interactables and
   * elements, you need to enable it in the draggable, resizable and gesturable
   * `'max'` and `'maxPerElement'` options.
   *
   * @alias module:interact.maxInteractions
   *
   * @param {number} [newValue] Any number. newValue <= 0 means no interactions.
   */
  interact.maxInteractions = (newValue: number) => maxInteractions(newValue, scope)

  scope.autoStart = {
    // Allow this many interactions to happen simultaneously
    maxInteractions: Infinity,
    withinInteractionLimit,
    cursorElement: null,
  }
}

function prepareOnDown (
  { interaction, pointer, event, eventTarget }: SignalArgs['interactions:down'],
  scope: Scope,
) {
  if (interaction.interacting()) return

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope)
  prepare(interaction, actionInfo, scope)
}

function prepareOnMove (
  { interaction, pointer, event, eventTarget }: SignalArgs['interactions:move'],
  scope: Scope,
) {
  if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) return

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget as Element, scope)
  prepare(interaction, actionInfo, scope)
}

function startOnMove (arg: SignalArgs['interactions:move'], scope: Scope) {
  const { interaction } = arg

  if (
    !interaction.pointerIsDown ||
    interaction.interacting() ||
    !interaction.pointerWasMoved ||
    !interaction.prepared.name
  ) {
    return
  }

  scope.fire('autoStart:before-start', arg)

  const { interactable } = interaction
  const actionName = (interaction as Interaction<ActionName>).prepared.name

  if (actionName && interactable) {
    // check manualStart and interaction limit
    if (
      interactable.options[actionName].manualStart ||
      !withinInteractionLimit(interactable, interaction.element, interaction.prepared, scope)
    ) {
      interaction.stop()
    } else {
      interaction.start(interaction.prepared, interactable, interaction.element)
      setInteractionCursor(interaction, scope)
    }
  }
}

function clearCursorOnStop ({ interaction }: { interaction: Interaction }, scope: Scope) {
  const { interactable } = interaction

  if (interactable && interactable.options.styleCursor) {
    setCursor(interaction.element, '', scope)
  }
}

// Check if the current interactable supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction<T extends ActionName> (
  action: ActionProps<T>,
  interactable: Interactable,
  element: Element,
  eventTarget: Node,
  scope: Scope,
) {
  if (
    interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) &&
    interactable.options[action.name].enabled &&
    withinInteractionLimit(interactable, element, action, scope)
  ) {
    return action
  }

  return null
}

function validateMatches (
  interaction: Interaction,
  pointer: PointerType,
  event: PointerEventType,
  matches: Interactable[],
  matchElements: Element[],
  eventTarget: Node,
  scope: Scope,
) {
  for (let i = 0, len = matches.length; i < len; i++) {
    const match = matches[i]
    const matchElement = matchElements[i]
    const matchAction = match.getAction(pointer, event, interaction, matchElement)

    if (!matchAction) {
      continue
    }

    const action = validateAction<ActionName>(matchAction, match, matchElement, eventTarget, scope)

    if (action) {
      return {
        action,
        interactable: match,
        element: matchElement,
      }
    }
  }

  return { action: null, interactable: null, element: null }
}

function getActionInfo (
  interaction: Interaction,
  pointer: PointerType,
  event: PointerEventType,
  eventTarget: Node,
  scope: Scope,
) {
  let matches: Interactable[] = []
  let matchElements: Element[] = []

  let element = eventTarget as Element

  function pushMatches (interactable: Interactable) {
    matches.push(interactable)
    matchElements.push(element)
  }

  while (is.element(element)) {
    matches = []
    matchElements = []

    scope.interactables.forEachMatch(element, pushMatches)

    const actionInfo = validateMatches(
      interaction,
      pointer,
      event,
      matches,
      matchElements,
      eventTarget,
      scope,
    )

    if (actionInfo.action && !actionInfo.interactable.options[actionInfo.action.name].manualStart) {
      return actionInfo
    }

    element = domUtils.parentNode(element) as Element
  }

  return { action: null, interactable: null, element: null }
}

function prepare (
  interaction: Interaction,
  {
    action,
    interactable,
    element,
  }: {
    action: ActionProps<any>
    interactable: Interactable
    element: Element
  },
  scope: Scope,
) {
  action = action || { name: null }

  interaction.interactable = interactable
  interaction.element = element
  copyAction(interaction.prepared, action)

  interaction.rect = interactable && action.name ? interactable.getRect(element) : null

  setInteractionCursor(interaction, scope)

  scope.fire('autoStart:prepared', { interaction })
}

function withinInteractionLimit<T extends ActionName> (
  interactable: Interactable,
  element: Element,
  action: ActionProps<T>,
  scope: Scope,
) {
  const options = interactable.options
  const maxActions = options[action.name].max
  const maxPerElement = options[action.name].maxPerElement
  const autoStartMax = scope.autoStart.maxInteractions
  let activeInteractions = 0
  let interactableCount = 0
  let elementCount = 0

  // no actions if any of these values == 0
  if (!(maxActions && maxPerElement && autoStartMax)) {
    return false
  }

  for (const interaction of scope.interactions.list) {
    const otherAction = interaction.prepared.name

    if (!interaction.interacting()) {
      continue
    }

    activeInteractions++

    if (activeInteractions >= autoStartMax) {
      return false
    }

    if (interaction.interactable !== interactable) {
      continue
    }

    interactableCount += otherAction === action.name ? 1 : 0

    if (interactableCount >= maxActions) {
      return false
    }

    if (interaction.element === element) {
      elementCount++

      if (otherAction === action.name && elementCount >= maxPerElement) {
        return false
      }
    }
  }

  return autoStartMax > 0
}

function maxInteractions (newValue: any, scope: Scope) {
  if (is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue

    return this
  }

  return scope.autoStart.maxInteractions
}

function setCursor (element: Element, cursor: string, scope: Scope) {
  const { cursorElement: prevCursorElement } = scope.autoStart

  if (prevCursorElement && prevCursorElement !== element) {
    prevCursorElement.style.cursor = ''
  }

  element.ownerDocument.documentElement.style.cursor = cursor
  element.style.cursor = cursor
  scope.autoStart.cursorElement = cursor ? element : null
}

function setInteractionCursor<T extends ActionName> (interaction: Interaction<T>, scope: Scope) {
  const { interactable, element, prepared } = interaction

  if (!(interaction.pointerType === 'mouse' && interactable && interactable.options.styleCursor)) {
    // clear previous target element cursor
    if (scope.autoStart.cursorElement) {
      setCursor(scope.autoStart.cursorElement, '', scope)
    }

    return
  }

  let cursor = ''

  if (prepared.name) {
    const cursorChecker = interactable.options[prepared.name].cursorChecker

    if (is.func(cursorChecker)) {
      cursor = cursorChecker(prepared, interactable, element, interaction._interacting)
    } else {
      cursor = scope.actions.map[prepared.name].getCursor(prepared)
    }
  }

  setCursor(interaction.element, cursor || '', scope)
}

const autoStart: Plugin = {
  id: 'auto-start/base',
  before: ['actions'],
  install,
  listeners: {
    'interactions:down': prepareOnDown,
    'interactions:move': (arg, scope) => {
      prepareOnMove(arg, scope)
      startOnMove(arg, scope)
    },
    'interactions:stop': clearCursorOnStop,
  },
  maxInteractions,
  withinInteractionLimit,
  validateAction,
}

export default autoStart
