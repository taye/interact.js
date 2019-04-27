import { Scope } from '@interactjs/core/scope'
import drag, { DragEvent } from './drag'
import drop from './drop'
import gesture, { GestureEvent } from './gesture'
import resize, { ResizeEvent } from './resize'

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
  GestureEvent,
  resize,
  ResizeEvent,
  drag,
  DragEvent,
  drop,
}
