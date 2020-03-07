import base from './base'

import * as all from './all'
import extend from '@interactjs/utils/extend'
import * as snappers from '@interactjs/utils/snappers/index'

declare module '@interactjs/interact/index' {
  interface InteractStatic {
    modifiers: typeof all
    snappers: typeof snappers
    createSnapGrid: typeof snappers.grid
  }
}

const modifiers: Interact.Plugin = {
  id: 'modifiers',
  install (scope) {
    const { interact } = scope

    scope.usePlugin(base)

    interact.modifiers = extend(interact.modifiers || {}, all)
    interact.snappers = extend(interact.snappers || {}, snappers)
    interact.createSnapGrid = interact.snappers.grid

    // for backwrads compatibility
    for (const type in all) {
      const { _defaults, _methods } = all[type as keyof typeof all]

      ;(_defaults as any)._methods = _methods
      ;(scope.defaults.perAction as any)[type] = _defaults
    }
  },
}

export default modifiers
