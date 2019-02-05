import { ActionName } from '@interactjs/core/scope'
import { parentNode } from '@interactjs/utils/domUtils'
import * as is from '@interactjs/utils/is'
import autoStart from './base'

type Scope = import ('@interactjs/core/scope').Scope

function install (scope: Scope) {
  scope.autoStart.signals.on('before-start',  ({ interaction, eventTarget, dx, dy }) => {
    if (interaction.prepared.name !== 'drag') { return }

    // check if a drag is in the correct axis
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    const targetOptions = interaction.target.options.drag
    const startAxis = targetOptions.startAxis
    const currentAxis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy')

    interaction.prepared.axis = targetOptions.lockAxis === 'start'
      ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
      : targetOptions.lockAxis

    // if the movement isn't in the startAxis of the interactable
    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      // cancel the prepared action
      interaction.prepared.name = null

      // then try to get a drag from another ineractable
      let element = eventTarget

      const getDraggable = function (interactable) {
        if (interactable === interaction.target) { return }

        const options = interaction.target.options.drag

        if (!options.manualStart &&
            interactable.testIgnoreAllow(options, element, eventTarget)) {
          const action = interactable.getAction(
            interaction.downPointer, interaction.downEvent, interaction, element)

          if (action &&
              action.name === 'drag' &&
              checkStartAxis(currentAxis, interactable) &&
              autoStart.validateAction(action, interactable, element, eventTarget, scope)) {
            return interactable
          }
        }
      }

      // check all interactables
      while (is.element(element)) {
        const interactable = scope.interactables.forEachMatch(element, getDraggable)

        if (interactable) {
          interaction.prepared.name = ActionName.Drag
          interaction.target = interactable
          interaction.element = element
          break
        }

        element = parentNode(element)
      }
    }
  })

  function checkStartAxis (startAxis, interactable) {
    if (!interactable) { return false }

    const thisAxis = interactable.options.drag.startAxis

    return (startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis)
  }
}

export default { install }
