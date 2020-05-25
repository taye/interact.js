import actions from '@interactjs/actions/plugin'
import arrange from '@interactjs/arrange/plugin'
import autoScroll from '@interactjs/auto-scroll/plugin'
import autoStart from '@interactjs/auto-start/plugin'
import clone from '@interactjs/clone/plugin'
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault'
import devTools from '@interactjs/dev-tools/plugin'
import feedback from '@interactjs/feedback/plugin'
import inertia from '@interactjs/inertia/plugin'
import interact from '@interactjs/interact'
import modifiers from '@interactjs/modifiers/plugin'
import multiTarget from '@interactjs/multi-target/plugin'
import offset from '@interactjs/offset/plugin'
import pointerEvents from '@interactjs/pointer-events/plugin'
import reactComponents from '@interactjs/react/plugin'
import reflow from '@interactjs/reflow/plugin'
import * as displace from '@interactjs/utils/displace'
import { exchange } from '@interactjs/utils/exchange'
import * as pointerUtils from '@interactjs/utils/pointerUtils'
import vueComponents from '@interactjs/vue/plugin'

declare module '@interactjs/core/interactStatic' {
  export interface InteractStatic {
    __utils: {
      exchange: typeof exchange
      displace: typeof displace
      pointer: typeof pointerUtils
    }
  }
}

interact.use(multiTarget)

interact.use(interactablePreventDefault)

interact.use(offset)

// interaction element cloning
interact.use(clone)

// sortable and swappable
interact.use(arrange)

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

interact.use(feedback)

interact.use(vueComponents)

interact.use(reactComponents)

interact.__utils = {
  exchange,
  displace,
  pointer: pointerUtils,
}

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'production') {
  interact.use(devTools)
}

export default interact

if (typeof module === 'object' && !!module) {
  try { module.exports = interact }
  catch {}
}

(interact as any).default = interact
