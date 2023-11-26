import type { Scope } from '@interactjs/core/scope'

/* eslint-disable import/no-duplicates -- for typescript module augmentations */
import './drag/plugin'
import './drop/plugin'
import './gesture/plugin'
import './resize/plugin'

import drag from './drag/plugin'
import drop from './drop/plugin'
import gesture from './gesture/plugin'
import resize from './resize/plugin'
/* eslint-enable import/no-duplicates */

export default {
  id: 'actions',
  install(scope: Scope) {
    scope.usePlugin(gesture)
    scope.usePlugin(resize)
    scope.usePlugin(drag)
    scope.usePlugin(drop)
  },
}
