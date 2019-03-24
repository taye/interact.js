import pointerEvents from './base'
import holdRepeat from './holdRepeat'
import interactableTargets from './interactableTargets'

function install (scope) {
  pointerEvents.install(scope)
  holdRepeat.install(scope)
  interactableTargets.install(scope)
}

const id = 'pointer-events'

export { id, pointerEvents, holdRepeat, interactableTargets, install }
