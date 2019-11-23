import interact, { init as initInteract } from '@interactjs/interact/index'
import * as modifiers from '@interactjs/modifiers/index'
import '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import * as snappers from '@interactjs/utils/snappers/index'

declare module '@interactjs/interact/interact' {
  interface InteractStatic {
    modifiers?: typeof modifiers
    snappers?: typeof snappers
    createSnapGrid?: typeof snappers.grid
  }
}

if (typeof window === 'object' && !!window) {
  init(window)
}

export function init (win: Window) {
  initInteract(win)

  return interact.use({
    id: 'interactjs',
    install () {
      interact.modifiers = extend({}, modifiers)
      interact.snappers = snappers
      interact.createSnapGrid = interact.snappers.grid
    },
  })
}

export default interact
