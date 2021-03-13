import actions from '@interactjs/actions/plugin'
import autoScroll from '@interactjs/auto-scroll/plugin'
import autoStart from '@interactjs/auto-start/plugin'
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault'
import devTools from '@interactjs/dev-tools/plugin'
import inertia from '@interactjs/inertia/plugin'
import interact from '@interactjs/interact'
import modifiers from '@interactjs/modifiers/plugin'
import offset from '@interactjs/offset/plugin'
import pointerEvents from '@interactjs/pointer-events/plugin'
import reflow from '@interactjs/reflow/plugin'

interact.use(interactablePreventDefault)

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

export default interact

if (typeof module === 'object' && !!module) {
  try {
    module.exports = interact
  } catch {}
}

;(interact as any).default = interact
