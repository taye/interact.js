/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import isWindow from './isWindow.js';
import { window as win, getWindow } from './window.js';
const window = thing => thing === win || isWindow(thing);
const docFrag = thing => object(thing) && thing.nodeType === 11;
const object = thing => !!thing && typeof thing === 'object';
const func = thing => typeof thing === 'function';
const number = thing => typeof thing === 'number';
const bool = thing => typeof thing === 'boolean';
const string = thing => typeof thing === 'string';
const element = thing => {
  if (!thing || typeof thing !== 'object') {
    return false;
  }
  const _window = getWindow(thing) || win;
  return /object|function/.test(typeof Element) ? thing instanceof Element || thing instanceof _window.Element : thing.nodeType === 1 && typeof thing.nodeName === 'string';
};
const plainObject = thing => object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString());
const array = thing => object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
var is = {
  window,
  docFrag,
  object,
  func,
  number,
  bool,
  string,
  element,
  plainObject,
  array
};
export { is as default };
//# sourceMappingURL=is.js.map
