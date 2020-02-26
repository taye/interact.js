import * as arr from './arr'
import * as dom from './domUtils'
import * as is from './is'
import * as pointer from './pointerUtils'
import * as rect from './rect'
import win from './window'

export function warnOnce<T> (this: T, method: (...args: any[]) => any, message: string) {
  let warned = false

  // eslint-disable-next-line no-shadow
  return function (this: T) {
    if (!warned) {
      (win as any).window.console.warn(message)
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

export { default as browser } from './browser'
export { default as clone } from './clone'
export { default as events } from './events'
export { default as extend } from './extend'
export { default as getOriginXY } from './getOriginXY'
export { default as hypot } from './hypot'
export { default as normalizeListeners } from './normalizeListeners'
export { default as raf } from './raf'
export { win, arr, dom, is, pointer, rect }
