import * as Interact from '@interactjs/types/index'
import * as domUtils from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'
import { copyAction } from '@interactjs/utils/misc'

import InteractableMethods from './InteractableMethods'

declare module '@interactjs/core/interactStatic' {
  export interface InteractStatic {
    maxInteractions: (newValue: any) => any
  }
}

declare module '@interactjs/core/scope' {
  interface Scope {
    autoStart: AutoStart
  }

  interface SignalArgs {
    'autoStart:before-start': Interact.SignalArgs['interactions:move']
    'autoStart:prepared': { interaction: Interact.Interaction }
    'auto-start:check': CheckSignalArg
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface BaseDefaults {
    actionChecker?: any
    cursorChecker?: any
    styleCursor?: any
  }

  interface PerActionDefaults {
    manualStart?: boolean
    max?: number
    maxPerElement?: number
    allowFrom?: string | Interact.Element
    ignoreFrom?: string | Interact.Element
    cursorChecker?: Interact.CursorChecker

    // only allow left button by default
    // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
    mouseButtons?: 0 | 1 | 2 | 4 | 16
  }
}

interface CheckSignalArg {
  interactable: Interact.Interactable
  interaction: Interact.Interaction
  element: Interact.Element
  action: Interact.ActionProps
  buttons: number
}

export interface AutoStart {
  // Allow this many interactions to happen simultaneously
  maxInteractions: number
  withinInteractionLimit: typeof withinInteractionLimit
  cursorElement: Interact.Element
}

function install (scope: Interact.Scope) {
  const {
    interactStatic: interact,
    defaults,
  } = scope

  scope.usePlugin(InteractableMethods)

  defaults.base.actionChecker = null
  defaults.base.styleCursor = true

  extend(defaults.perAction, {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1,
    allowFrom:  null,
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

function prepareOnDown ({ interaction, pointer, event, eventTarget }: Interact.SignalArgs['interactions:down'], scope: Interact.Scope) {
  if (interaction.interacting()) { return }

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope)
  prepare(interaction, actionInfo, scope)
}

function prepareOnMove ({ interaction, pointer, event, eventTarget }: Interact.SignalArgs['interactions:move'], scope: Interact.Scope) {
  if (interaction.pointerType !== 'mouse' ||
      interaction.pointerIsDown ||
      interaction.interacting()) { return }

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget as Interact.Element, scope)
  prepare(interaction, actionInfo, scope)
}

function startOnMove (arg: Interact.SignalArgs['interactions:move'], scope: Interact.Scope) {
  const { interaction } = arg

  if (!interaction.pointerIsDown ||
      interaction.interacting() ||
      !interaction.pointerWasMoved ||
      !interaction.prepared.name) {
    return
  }

  scope.fire('autoStart:before-start', arg)

  const { interactable } = interaction
  const actionName = interaction.prepared.name

  if (actionName && interactable) {
    // check manualStart and interaction limit
    if (interactable.options[actionName].manualStart ||
        !withinInteractionLimit(interactable, interaction.element, interaction.prepared, scope)) {
      interaction.stop()
    }
    else {
      interaction.start(interaction.prepared, interactable, interaction.element)
      setInteractionCursor(interaction, scope)
    }
  }
}

function clearCursorOnStop ({ interaction }: { interaction: Interact.Interaction }, scope: Interact.Scope) {
  const { interactable } = interaction

  if (interactable && interactable.options.styleCursor) {
    setCursor(interaction.element, '', scope)
  }
}

// Check if the current interactable supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction<T extends Interact.ActionName> (
  action: Interact.ActionProps<T>,
  interactable: Interact.Interactable,
  element: Interact.Element,
  eventTarget: Interact.EventTarget,
  scope: Interact.Scope,
) {
  if (interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) &&
      interactable.options[action.name].enabled &&
      withinInteractionLimit(interactable, element, action, scope)) {
    return action
  }

  return null
}

function validateMatches (
  interaction: Interact.Interaction,
  pointer: Interact.PointerType,
  event: Interact.PointerEventType,
  matches: Interact.Interactable[],
  matchElements: Interact.Element[],
  eventTarget: Interact.EventTarget,
  scope: Interact.Scope,
) {
  for (let i = 0, len = matches.length; i < len; i++) {
    const match = matches[i]
    const matchElement = matchElements[i]
    const matchAction = match.getAction(pointer, event, interaction, matchElement)

    if (!matchAction) { continue }

    const action = validateAction(
      matchAction,
      match,
      matchElement,
      eventTarget,
      scope)

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
  interaction: Interact.Interaction,
  pointer: Interact.PointerType,
  event: Interact.PointerEventType,
  eventTarget: Interact.EventTarget,
  scope: Interact.Scope,
) {
  let matches: Interact.Interactable[] = []
  let matchElements: Interact.Element[] = []

  let element = eventTarget as Interact.Element

  function pushMatches (interactable: Interact.Interactable) {
    matches.push(interactable)
    matchElements.push(element)
  }

  while (is.element(element)) {
    matches = []
    matchElements = []

    scope.interactables.forEachMatch(element, pushMatches)

    const actionInfo = validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope)

    if (actionInfo.action &&
      !actionInfo.interactable.options[actionInfo.action.name].manualStart) {
      return actionInfo
    }

    element = domUtils.parentNode(element) as Interact.Element
  }

  return { action: null, interactable: null, element: null }
}

function prepare (
  interaction: Interact.Interaction,
  { action, interactable, element }: {
    action: Interact.ActionProps
    interactable: Interact.Interactable
    element: Interact.Element
  },
  scope: Interact.Scope,
) {
  action = action || { name: null }

  interaction.interactable = interactable
  interaction.element = element
  copyAction(interaction.prepared, action)

  interaction.rect = interactable && action.name
    ? interactable.getRect(element)
    : null

  setInteractionCursor(interaction, scope)

  scope.fire('autoStart:prepared', { interaction })
}

function withinInteractionLimit<T extends Interact.ActionName> (
  interactable: Interact.Interactable,
  element: Interact.Element,
  action: Interact.ActionProps<T>,
  scope: Interact.Scope,
) {
  const options = interactable.options
  const maxActions = options[action.name].max
  const maxPerElement = options[action.name].maxPerElement
  const autoStartMax = scope.autoStart.maxInteractions
  let activeInteractions = 0
  let interactableCount = 0
  let elementCount = 0

  // no actions if any of these values == 0
  if (!(maxActions && maxPerElement && autoStartMax)) { return false }

  for (const interaction of scope.interactions.list) {
    const otherAction = interaction.prepared.name

    if (!interaction.interacting()) { continue }

    activeInteractions++

    if (activeInteractions >= autoStartMax) {
      return false
    }

    if (interaction.interactable !== interactable) { continue }

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

function maxInteractions (newValue: any, scope: Interact.Scope) {
  if (is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue

    return this
  }

  return scope.autoStart.maxInteractions
}

function setCursor (element: Interact.Element, cursor: string, scope: Interact.Scope) {
  const { cursorElement: prevCursorElement } = scope.autoStart

  if (prevCursorElement && prevCursorElement !== element) {
    prevCursorElement.style.cursor = ''
  }

  element.ownerDocument.documentElement.style.cursor = cursor
  element.style.cursor = cursor
  scope.autoStart.cursorElement = cursor ? element : null
}

function setInteractionCursor<T extends Interact.ActionName> (interaction: Interact.Interaction<T>, scope: Interact.Scope) {
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
    const cursorChecker: Interact.CursorChecker = interactable.options[prepared.name].cursorChecker

    if (is.func(cursorChecker)) {
      cursor = cursorChecker(prepared, interactable, element, interaction._interacting)
    }
    else {
      cursor = scope.actions.map[prepared.name].getCursor(prepared)
    }
  }

  setCursor(interaction.element, cursor || '', scope)
}

const autoStart: Interact.Plugin = {
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
} as Interact.Plugin

export default autoStart
