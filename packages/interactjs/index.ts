import interact, { init as initInteract } from '@interactjs/interact'
import * as modifiers from '@interactjs/modifiers'
import { Modifier } from '@interactjs/modifiers/base'
import '@interactjs/types'
import extend from '@interactjs/utils/extend'
import * as snappers from '@interactjs/utils/snappers'

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
interact['default'] = interact // tslint:disable-line no-string-literal
interact['init'] = init // tslint:disable-line no-string-literal

if (typeof module === 'object' && !!module) {
  module.exports = interact
}
