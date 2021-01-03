import type { Scope } from '@interactjs/core/scope'

import autoStart from './base'
import dragAxis from './dragAxis'
import hold from './hold'

export default {
  id: 'auto-start',
  install (scope: Scope) {
    scope.usePlugin(autoStart)
    scope.usePlugin(hold)
    scope.usePlugin(dragAxis)
  },
}
