import autoStart from './base'
import dragAxis from './dragAxis'
import hold from './hold'

function install (scope) {
  scope.usePlugin(autoStart)
  scope.usePlugin(hold)
  scope.usePlugin(dragAxis)
}

const id = 'auto-start'

export {
  id,
  install,
  autoStart,
  hold,
  dragAxis,
}
