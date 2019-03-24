import autoStart from './base'
import dragAxis from './dragAxis'
import hold from './hold'

function install (scope) {
  autoStart.install(scope)
  hold.install(scope)
  dragAxis.install(scope)
}

const id = 'auto-start'

export {
  id,
  install,
  autoStart,
  hold,
  dragAxis,
}
