/* tslint:disable no-var-requires */
const { default: interact, init: initInteract } = require('@interactjs/interact')
const modifiers = require('@interactjs/modifiers')
const { default: extend } = require('@interactjs/utils/extend')
const snappers = require('@interactjs/utils/snappers')

declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        modifiers?: any
        snappers?: typeof snappers
        createSnapGrid?: typeof snappers.grid
    }
}

if (typeof window === 'object' && !!window) {
  init(window)
}

function init (win: Window) {
  initInteract(win)

  return interact.use({
    install (scope) {
      interact.modifiers = extend(scope.modifiers, modifiers)
      interact.snappers = snappers
      interact.createSnapGrid = interact.snappers.grid
    },
  })
}

module.exports = interact
module.exports.default = interact
module.exports.init = init

declare module 'interactjs' {
  export default interact

  const _init: typeof init
  export { _init as init }
}
