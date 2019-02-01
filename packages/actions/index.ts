/// <reference path="./types.d.ts" />
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

export {
  gesture,
  resize,
  drag,
  drop,
  install,
}
