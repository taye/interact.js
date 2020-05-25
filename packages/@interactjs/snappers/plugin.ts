import * as Interact from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'

import * as allSnappers from './all'

declare module '@interactjs/core/interactStatic' {
  export interface InteractStatic {
    snappers: typeof allSnappers
    createSnapGrid: typeof allSnappers.grid
  }
}

const snappersPlugin: Interact.Plugin = {
  id: 'snappers',
  install (scope) {
    const { interactStatic: interact } = scope

    interact.snappers = extend(interact.snappers || {}, allSnappers)
    interact.createSnapGrid = interact.snappers.grid
  },
}

export default snappersPlugin
