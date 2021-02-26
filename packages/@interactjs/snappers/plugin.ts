import type { Plugin } from '@interactjs/core/scope'
import extend from '@interactjs/utils/extend'

import * as allSnappers from './all'

declare module '@interactjs/core/InteractStatic' {
  export interface InteractStatic {
    snappers: typeof allSnappers
    createSnapGrid: typeof allSnappers.grid
  }
}

const snappersPlugin: Plugin = {
  id: 'snappers',
  install (scope) {
    const { interactStatic: interact } = scope

    interact.snappers = extend(interact.snappers || {}, allSnappers)
    interact.createSnapGrid = interact.snappers.grid
  },
}

export default snappersPlugin
