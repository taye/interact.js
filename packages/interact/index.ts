import * as actions from '@interactjs/actions'
import autoScroll from '@interactjs/auto-scroll'
import * as autoStart from '@interactjs/auto-start'
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault'
import devTools from '@interactjs/dev-tools'
import inertia from '@interactjs/inertia'
import * as modifiers from '@interactjs/modifiers'
import modifiersBase from '@interactjs/modifiers/base'
import * as pointerEvents from '@interactjs/pointer-events'
import reflow from '@interactjs/reflow'
import interact, { scope } from './interact'

export function init (window: Window) {
  scope.init(window)

  interact.use(interactablePreventDefault)

  // inertia
  interact.use(inertia)

  // pointerEvents
  interact.use(pointerEvents)

  // autoStart, hold
  interact.use(autoStart)

  // drag and drop, resize, gesture
  interact.use(actions)

  // snap, resize, etc.
  interact.use(modifiersBase)

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
