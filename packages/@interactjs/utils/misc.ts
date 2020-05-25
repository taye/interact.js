import * as Interact from '@interactjs/types/index'

import win from './window'

export function warnOnce<T> (this: T, method: (...args: any[]) => any, message: string) {
  let warned = false

  return function (this: T) {
    if (!warned) {
      (win.window as any).console.warn(message)
      warned = true
    }

    return method.apply(this, arguments)
  }
}

export function copyAction (dest: Interact.ActionProps, src: Interact.ActionProps) {
  dest.name  = src.name
  dest.axis  = src.axis
  dest.edges = src.edges

  return dest
}
