import type { Scope } from '@interactjs/core/scope'

import drag from './drag/plugin'
import drop from './drop/plugin'
import gesture from './gesture/plugin'
import resize from './resize/plugin'

export default {
  id: 'actions',
  install (scope: Scope) {
    scope.usePlugin(gesture)
    scope.usePlugin(resize)
    scope.usePlugin(drag)
    scope.usePlugin(drop)
  },
}
