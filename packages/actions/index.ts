import { Scope } from '@interactjs/core/scope'
import drag from './drag'
import drop from './drop'
import gesture from './gesture'
import resize from './resize'

function install (scope: Scope) {
  gesture.install(scope)
  resize.install(scope)
  drag.install(scope)
  drop.install(scope)
}

export * from './drag'
export * from './resize'
export * from './gesture'
export * from './drop'

export {
  install,
}
