import interact, { init as initInteract } from '../interact/index'
import { Modifier } from '../modifiers/base'
import * as modifiers from '../modifiers/index'
import '../types/index'
import extend from '../utils/extend'
import * as snappers from '../utils/snappers/index'

declare module '@interactjs/interact/interact' {
  interface InteractStatic {
    modifiers?: typeof modifiers & { [key: string]: (options?) => Modifier }
    snappers?: typeof snappers & { [key: string]: any }
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
