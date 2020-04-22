import drag from './drag'
import drop from './drop/index'
import gesture from './gesture'
import resize from './resize'
import Scope from '@interactjs/core/scope'

export default {
  id: 'actions',
  install (scope: Scope) {
    scope.usePlugin(gesture)
    scope.usePlugin(resize)
    scope.usePlugin(drag)
    scope.usePlugin(drop)
  },
}

export {
  gesture,
  resize,
  drag,
  drop,
}
