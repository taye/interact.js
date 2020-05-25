import * as Interact from '@interactjs/types/index'

import drag from './drag/plugin'
import drop from './drop/plugin'
import gesture from './gesture/plugin'
import resize from './resize/plugin'

export default {
  id: 'actions',
  install (scope: Interact.Scope) {
    scope.usePlugin(gesture)
    scope.usePlugin(resize)
    scope.usePlugin(drag)
    scope.usePlugin(drop)
  },
}
