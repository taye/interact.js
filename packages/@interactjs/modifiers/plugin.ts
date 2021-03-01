import type { Plugin } from '@interactjs/core/scope'
import snappers from '@interactjs/snappers/plugin'

import all from './all'
import base from './base'

declare module '@interactjs/core/InteractStatic' {
  export interface InteractStatic {
    modifiers: typeof all
  }
}

const modifiers: Plugin = {
  id: 'modifiers',
  install (scope) {
    const { interactStatic: interact } = scope

    scope.usePlugin(base)
    scope.usePlugin(snappers)

    interact.modifiers = all

    // for backwrads compatibility
    for (const type in all) {
      const { _defaults, _methods } = all[type as keyof typeof all]

      ;(_defaults as any)._methods = _methods
      ;(scope.defaults.perAction as any)[type] = _defaults
    }
  },
}

export default modifiers
