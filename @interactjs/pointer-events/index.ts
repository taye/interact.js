import * as pointerEvents from './base'
import holdRepeat from './holdRepeat'
import interactableTargets from './interactableTargets'

export default {
  id: 'pointer-events',
  install (scope: Interact.Scope) {
    scope.usePlugin(pointerEvents)
    scope.usePlugin(holdRepeat)
    scope.usePlugin(interactableTargets)
  },
}

export {
  pointerEvents,
  holdRepeat,
  interactableTargets,
}
