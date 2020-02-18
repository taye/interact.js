import * as actions from '@interactjs/actions/index'
import autoScroll from '@interactjs/auto-scroll/index'
import * as autoStart from '@interactjs/auto-start/index'
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault'
import devTools from '@interactjs/dev-tools/index'
import inertia from '@interactjs/inertia/index'
import modifiersBase from '@interactjs/modifiers/base'
import * as modifiers from '@interactjs/modifiers/index'
import * as pointerEvents from '@interactjs/pointer-events/index'
import reflow from '@interactjs/reflow/index'
import interact, { scope } from './interact'
import offset from '@interactjs/offset'

export function init (window: Window) {
  scope.init(window)

  interact.use(interactablePreventDefault)

  interact.use(offset)

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
    const { _defaults, _methods } = modifiers[type as keyof typeof modifiers]

    ;(_defaults as any)._methods = _methods
    ;(scope.defaults.perAction as any)[type] = _defaults
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
