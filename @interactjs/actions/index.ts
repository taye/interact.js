import { Scope } from '@interactjs/core/scope'
import drag from './drag'
import drop from './drop/index'
import gesture from './gesture'
import resize from './resize'

function install (scope: Scope) {
  scope.usePlugin(gesture)
  scope.usePlugin(resize)
  scope.usePlugin(drag)
  scope.usePlugin(drop)
}

const id = 'actions'

export {
  id,
  install,
  gesture,
  resize,
  drag,
  drop,
}
