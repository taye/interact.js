import * as actions from '../actions/index'
import autoScroll from '../auto-scroll/index'
import * as autoStart from '../auto-start/index'
import interactablePreventDefault from '../core/interactablePreventDefault'
import devTools from '../dev-tools/index'
import inertia from '../inertia/index'
import modifiersBase from '../modifiers/base'
import * as modifiers from '../modifiers/index'
import * as pointerEvents from '../pointer-events/index'
import reflow from '../reflow/index'
import interact, { scope } from './interact'

export function init (window: Window) {
  scope.init(window)

  interact.use(interactablePreventDefault)

  // pointerEvents
  interact.use(pointerEvents)

  // inertia
  interact.use(inertia)

  // snap, resize, etc.
  interact.use(modifiersBase)

  // autoStart, hold
  interact.use(autoStart)

  // drag and drop, resize, gesture
  interact.use(actions)

  // for backwrads compatibility
  for (const type in modifiers) {
    const { _defaults, _methods } = modifiers[type]

    _defaults._methods = _methods
    scope.defaults.perAction[type] = _defaults
  }

  // autoScroll
  interact.use(autoScroll)

  // reflow
  interact.use(reflow)

  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV !== 'production') {
    interact.use(devTools)
  }

  return interact
}

// eslint-disable-next-line no-undef
interact.version = process.env.npm_package_version

export default interact
export {
  interact,
  actions,
  autoScroll,
  interactablePreventDefault,
  inertia,
  modifiersBase as modifiers,
  pointerEvents,
  reflow,
}
