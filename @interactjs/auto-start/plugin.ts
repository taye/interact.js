import * as Interact from '@interactjs/types/index'

import autoStart from './base'
import dragAxis from './dragAxis'
import hold from './hold'

export default {
  id: 'auto-start',
  install (scope: Interact.Scope) {
    scope.usePlugin(autoStart)
    scope.usePlugin(hold)
    scope.usePlugin(dragAxis)
  },
}
