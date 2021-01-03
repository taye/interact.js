import type { Plugin } from '@interactjs/core/scope'

import * as pointerEvents from './base'
import holdRepeat from './holdRepeat'
import interactableTargets from './interactableTargets'

const plugin: Plugin = {
  id: 'pointer-events',
  install (scope) {
    scope.usePlugin(pointerEvents)
    scope.usePlugin(holdRepeat)
    scope.usePlugin(interactableTargets)
  },
}

export default plugin
