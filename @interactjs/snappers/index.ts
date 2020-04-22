import * as allSnappers from './all'
import extend from '@interactjs/utils/extend'

declare module '@interactjs/core/InteractStatic' {
  interface InteractStatic {
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
