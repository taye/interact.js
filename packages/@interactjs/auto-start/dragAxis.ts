import type { Interactable } from '@interactjs/core/Interactable'
import type Interaction from '@interactjs/core/Interaction'
import type { SignalArgs, Scope } from '@interactjs/core/scope'
import type { ActionName, Element } from '@interactjs/core/types'
import { parentNode } from '@interactjs/utils/domUtils'
import is from '@interactjs/utils/is'

import autoStart from './base'

function beforeStart({ interaction, eventTarget, dx, dy }: SignalArgs['interactions:move'], scope: Scope) {
  if (interaction.prepared.name !== 'drag') return

  // check if a drag is in the correct axis
  const absX = Math.abs(dx)
  const absY = Math.abs(dy)
  const targetOptions = interaction.interactable.options.drag
  const startAxis = targetOptions.startAxis
  const currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy'

  interaction.prepared.axis =
    targetOptions.lockAxis === 'start'
      ? (currentAxis[0] as 'x' | 'y') // always lock to one axis even if currentAxis === 'xy'
      : targetOptions.lockAxis

  // if the movement isn't in the startAxis of the interactable
  if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
    // cancel the prepared action
    ;(interaction as Interaction<ActionName>).prepared.name = null

    // then try to get a drag from another ineractable
    let element = eventTarget as Element

    const getDraggable = function (interactable: Interactable): Interactable | void {
      if (interactable === interaction.interactable) return

      const options = interaction.interactable.options.drag

      if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
        const action = interactable.getAction(
          interaction.downPointer,
          interaction.downEvent,
          interaction,
          element,
        )

        if (
          action &&
          action.name === 'drag' &&
          checkStartAxis(currentAxis, interactable) &&
          autoStart.validateAction(action, interactable, element, eventTarget, scope)
        ) {
          return interactable
        }
      }
    }

    // check all interactables
    while (is.element(element)) {
      const interactable = scope.interactables.forEachMatch(element, getDraggable)

      if (interactable) {
        ;(interaction as Interaction<ActionName>).prepared.name = 'drag'
        interaction.interactable = interactable
        interaction.element = element
        break
      }

      element = parentNode(element) as Element
    }
  }
}

function checkStartAxis(startAxis: string, interactable: Interactable) {
  if (!interactable) {
    return false
  }

  const thisAxis = interactable.options.drag.startAxis

  return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis
}

export default {
  id: 'auto-start/dragAxis',
  listeners: { 'autoStart:before-start': beforeStart },
}
