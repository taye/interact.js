// tslint:disable variable-name

import isWindow from './isWindow'
import win from './window'

export const window = (thing: any): thing is Window =>
  thing === win.window || isWindow(thing)

export const docFrag = (thing: any): thing is DocumentFragment =>
  object(thing) && thing.nodeType === 11

export const object = (thing: any): thing is { [index: string]: any } =>
  !!thing && (typeof thing === 'object')

export const func = (thing: any): thing is (...args: any) => any =>
  typeof thing === 'function'

export const number = (thing: any): thing is number =>
  typeof thing === 'number'

export const bool = (thing: any): thing is boolean =>
  typeof thing === 'boolean'

export const string = (thing: any): thing is string =>
  typeof thing === 'string'

export const element = (thing: any): thing is Element => {
  if (!thing || (typeof thing !== 'object')) { return false }

  const _window = win.getWindow(thing) || win.window

  return (/object|function/.test(typeof _window.Element)
    ? thing instanceof _window.Element // DOM2
    : thing.nodeType === 1 && typeof thing.nodeName === 'string')
}

export const plainObject: typeof object = (thing: any): thing is { [index: string]: any } =>
  object(thing) &&
  !!thing.constructor &&
  /function Object\b/.test(thing.constructor.toString())

export const array = (thing: any): thing is any[] =>
  (object(thing) &&
  (typeof thing.length !== 'undefined') &&
  func(thing.splice))
