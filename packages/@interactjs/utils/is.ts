import isWindow from './isWindow'
import * as win from './window'

const window = (thing: any): thing is Window => thing === win.window || isWindow(thing)

const docFrag = (thing: any): thing is DocumentFragment => object(thing) && thing.nodeType === 11

const object = (thing: any): thing is { [index: string]: any } => !!thing && typeof thing === 'object'

const func = (thing: any): thing is (...args: any[]) => any => typeof thing === 'function'

const number = (thing: any): thing is number => typeof thing === 'number'

const bool = (thing: any): thing is boolean => typeof thing === 'boolean'

const string = (thing: any): thing is string => typeof thing === 'string'

const element = (thing: any): thing is HTMLElement | SVGElement => {
  if (!thing || typeof thing !== 'object') {
    return false
  }

  const _window = win.getWindow(thing) || win.window

  return /object|function/.test(typeof Element)
    ? thing instanceof Element || thing instanceof _window.Element
    : thing.nodeType === 1 && typeof thing.nodeName === 'string'
}

const plainObject: typeof object = (thing: any): thing is { [index: string]: any } =>
  object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString())

const array = <T extends unknown>(thing: any): thing is T[] =>
  object(thing) && typeof thing.length !== 'undefined' && func(thing.splice)

export default {
  window,
  docFrag,
  object,
  func,
  number,
  bool,
  string,
  element,
  plainObject,
  array,
}
