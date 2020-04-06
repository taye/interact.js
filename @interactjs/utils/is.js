// tslint:disable variable-name
import isWindow from "./isWindow.js";
import win from "./window.js";
export const window = thing => thing === win.window || isWindow(thing);
export const docFrag = thing => object(thing) && thing.nodeType === 11;
export const object = thing => !!thing && typeof thing === 'object';
export const func = thing => typeof thing === 'function';
export const number = thing => typeof thing === 'number';
export const bool = thing => typeof thing === 'boolean';
export const string = thing => typeof thing === 'string';
export const element = thing => {
  if (!thing || typeof thing !== 'object') {
    return false;
  }

  const _window = win.getWindow(thing) || win.window;

  return /object|function/.test(typeof _window.Element) ? thing instanceof _window.Element // DOM2
  : thing.nodeType === 1 && typeof thing.nodeName === 'string';
};
export const plainObject = thing => object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString());
export const array = thing => object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
//# sourceMappingURL=is.js.map