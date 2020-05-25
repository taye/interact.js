import { Scope } from '@interactjs/core/scope'

const scope = new Scope()

const interact: import('@interactjs/core/interactStatic').InteractStatic = scope.interactStatic

export default interact

export const init = (win: Window) => scope.init(win)

if (typeof window === 'object' && !!window) {
  init(window)
}
