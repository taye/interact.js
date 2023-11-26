import { matchesSelector, nodeContains } from '@interactjs/utils/domUtils'
import is from '@interactjs/utils/is'
import { getWindow } from '@interactjs/utils/window'

import type { Interactable } from '@interactjs/core/Interactable'
import type Interaction from '@interactjs/core/Interaction'
import type { Scope } from '@interactjs/core/scope'
import type { PointerEventType } from '@interactjs/core/types'

type PreventDefaultValue = 'always' | 'never' | 'auto'

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    preventDefault(newValue: PreventDefaultValue): this
    preventDefault(): PreventDefaultValue
    /**
     * Returns or sets whether to prevent the browser's default behaviour in
     * response to pointer events. Can be set to:
     *  - `'always'` to always prevent
     *  - `'never'` to never prevent
     *  - `'auto'` to let interact.js try to determine what would be best
     *
     * @param newValue - `'always'`, `'never'` or `'auto'`
     * @returns The current setting or this Interactable
     */
    preventDefault(newValue?: PreventDefaultValue): PreventDefaultValue | this
    checkAndPreventDefault(event: Event): void
  }
}

const preventDefault = function preventDefault(this: Interactable, newValue?: PreventDefaultValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    this.options.preventDefault = newValue
    return this
  }

  if (is.bool(newValue)) {
    this.options.preventDefault = newValue ? 'always' : 'never'
    return this
  }

  return this.options.preventDefault
} as Interactable['preventDefault']

function checkAndPreventDefault(interactable: Interactable, scope: Scope, event: Event) {
  const setting = interactable.options.preventDefault

  if (setting === 'never') return

  if (setting === 'always') {
    event.preventDefault()
    return
  }

  // setting === 'auto'

  // if the browser supports passive event listeners and isn't running on iOS,
  // don't preventDefault of touch{start,move} events. CSS touch-action and
  // user-select should be used instead of calling event.preventDefault().
  if (scope.events.supportsPassive && /^touch(start|move)$/.test(event.type)) {
    const doc = getWindow(event.target).document
    const docOptions = scope.getDocOptions(doc)

    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return
    }
  }

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return
  }

  // don't preventDefault on editable elements
  if (
    is.element(event.target) &&
    matchesSelector(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')
  ) {
    return
  }

  event.preventDefault()
}

function onInteractionEvent({ interaction, event }: { interaction: Interaction; event: PointerEventType }) {
  if (interaction.interactable) {
    interaction.interactable.checkAndPreventDefault(event as Event)
  }
}

export function install(scope: Scope) {
  const { Interactable } = scope

  Interactable.prototype.preventDefault = preventDefault

  Interactable.prototype.checkAndPreventDefault = function (event) {
    return checkAndPreventDefault(this, scope, event)
  }

  // prevent native HTML5 drag on interact.js target elements
  scope.interactions.docEvents.push({
    type: 'dragstart',
    listener(event) {
      for (const interaction of scope.interactions.list) {
        if (
          interaction.element &&
          (interaction.element === event.target || nodeContains(interaction.element, event.target))
        ) {
          interaction.interactable.checkAndPreventDefault(event)
          return
        }
      }
    },
  })
}

export default {
  id: 'core/interactablePreventDefault',
  install,
  listeners: ['down', 'move', 'up', 'cancel'].reduce((acc, eventType) => {
    acc[`interactions:${eventType}`] = onInteractionEvent
    return acc
  }, {} as any),
}
