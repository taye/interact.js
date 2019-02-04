import { Scope } from '@interactjs/core/scope'
import drag, { DragEvent } from './drag'
import drop from './drop'
import gesture, { GestureEvent } from './gesture'
import resize, { ResizeEvent } from './resize'

function install (scope: Scope) {
  gesture.install(scope)
  resize.install(scope)
  drag.install(scope)
  drop.install(scope)
}

export {
  gesture,
  GestureEvent,
  resize,
  ResizeEvent,
  drag,
  DragEvent,
  drop,
  install,
}
