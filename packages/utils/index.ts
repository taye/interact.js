import * as arr from './arr'
import * as dom from './domUtils'
import * as is from './is'
import win from './window'

export function warnOnce<T> (this: T, method: (...args: any) => any, message: string) {
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

// http://stackoverflow.com/a/5634528/2280888
export function _getQBezierValue (t: number, p1: number, p2: number, p3: number) {
  const iT = 1 - t
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3
}

export function getQuadraticCurvePoint (
  startX: number, startY: number, cpX: number, cpY: number, endX: number, endY: number, position: number) {
  return {
    x:  _getQBezierValue(position, startX, cpX, endX),
    y:  _getQBezierValue(position, startY, cpY, endY),
  }
}

// http://gizma.com/easing/
export function easeOutQuad (t: number, b: number, c: number, d: number) {
  t /= d
  return -c * t * (t - 2) + b
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
export { default as pointer } from './pointerUtils'
export { default as raf } from './raf'
export { default as rect } from './rect'
export { default as Signals } from './Signals'
export { win, arr, dom, is }
