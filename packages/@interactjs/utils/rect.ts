import * as Interact from '@interactjs/types/index'

import { closest, getElementRect, parentNode } from './domUtils'
import extend from './extend'
import is from './is'

export function getStringOptionResult (value: any, target: Interact.HasGetRect, element: Node) {
  if (value === 'parent') { return parentNode(element) }

  if (value === 'self') { return target.getRect(element as Interact.Element) }

  return closest(element, value)
}

export function resolveRectLike<T extends any[]> (
  value: Interact.RectResolvable<T>,
  target?: Interact.HasGetRect,
  element?: Node,
  functionArgs?: T,
) {
  let returnValue: any = value
  if (is.string(returnValue)) {
    returnValue = getStringOptionResult(returnValue, target, element)
  }
  else if (is.func(returnValue)) {
    returnValue = returnValue(...functionArgs)
  }

  if (is.element(returnValue)) {
    returnValue = getElementRect(returnValue)
  }

  return returnValue as Interact.Rect
}

export function rectToXY (rect: Interact.Rect | Interact.Point) {
  return  rect && {
    x: 'x' in rect ? rect.x : rect.left,
    y: 'y' in rect ? rect.y : rect.top,
  }
}

export function xywhToTlbr<T extends Partial<Interact.Rect & Interact.Point>> (rect: T) {
  if (rect && !('left' in rect && 'top' in rect)) {
    rect = extend({}, rect)

    rect.left   = rect.x || 0
    rect.top    = rect.y || 0
    rect.right  = rect.right   || (rect.left + rect.width)
    rect.bottom = rect.bottom  || (rect.top + rect.height)
  }

  return rect as Interact.Rect & T
}

export function tlbrToXywh (rect: Interact.Rect & Partial<Interact.Point>) {
  if (rect && !('x' in rect && 'y' in rect)) {
    rect = extend({}, rect)

    rect.x      = rect.left || 0
    rect.y      = rect.top  || 0
    rect.width  = rect.width  || ((rect.right || 0)  - rect.x)
    rect.height = rect.height || ((rect.bottom || 0) - rect.y)
  }

  return rect as Interact.FullRect & Interact.Point
}

export function addEdges (edges: Interact.EdgeOptions, rect: Interact.Rect, delta: Interact.Point) {
  if (edges.left)   { rect.left   += delta.x }
  if (edges.right)  { rect.right  += delta.x }
  if (edges.top)    { rect.top    += delta.y }
  if (edges.bottom) { rect.bottom += delta.y }

  rect.width = rect.right - rect.left
  rect.height = rect.bottom - rect.top
}
