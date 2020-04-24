import '@interactjs/types'

import actions from '@interactjs/actions'
import arrange from '@interactjs/arrange'
import autoScroll from '@interactjs/auto-scroll'
import autoStart from '@interactjs/auto-start'
import clone from '@interactjs/clone'
import components from '@interactjs/components'
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault'
import devTools from '@interactjs/dev-tools'
import feedback from '@interactjs/feedback'
import inertia from '@interactjs/inertia'
import interact from '@interactjs/interact'
import modifiers from '@interactjs/modifiers/index'
import multiTarget from '@interactjs/multi-target'
import offset from '@interactjs/offset'
import pointerEvents from '@interactjs/pointer-events'
import reflow from '@interactjs/reflow'
import * as displace from '@interactjs/utils/displace'
import { exchange } from '@interactjs/utils/exchange'
import * as pointerUtils from '@interactjs/utils/pointerUtils'
import * as vueComponents from '@interactjs/vue'

declare module '@interactjs/core/InteractStatic' {
  interface InteractStatic {
    __utils: {
      exchange: typeof exchange
      displace: typeof displace
      pointer: typeof pointerUtils
    }
    vue: {
      components: typeof vueComponents
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

interact.use(components)

interact.vue = {
  components: vueComponents,
}

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
