import '@interactjs/types/index'
import actions from '@interactjs/actions/index'
import autoScroll from '@interactjs/auto-scroll/index'
import autoStart from '@interactjs/auto-start/index'
import devTools from '@interactjs/dev-tools/index'
import inertia from '@interactjs/inertia/index'
import modifiers from '@interactjs/modifiers/index'
import offset from '@interactjs/offset'
import pointerEvents from '@interactjs/pointer-events/index'
import reflow from '@interactjs/reflow/index'
import interact, { init as initInteract } from '@interactjs/interact/index'

if (typeof window === 'object' && !!window) {
  init(window)
}

export default interact

export function init (win: Window) {
  initInteract(win)

  interact.use(offset)

  // pointerEvents
  interact.use(pointerEvents)

  // inertia
  interact.use(inertia)

  // snap, resize, etc.
  interact.use(modifiers)

  // autoStart, hold
  interact.use(autoStart)

  // drag and drop, resize, gesture
  interact.use(actions)

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
