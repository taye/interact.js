import win from './window';

export function warnOnce (method, message) {
  let warned = false;

  return function () {
    if (!warned) {
      win.window.console.warn(message);
      warned = true;
    }

    return method.apply(this, arguments);
  };
}

// http://stackoverflow.com/a/5634528/2280888
export function _getQBezierValue (t, p1, p2, p3) {
  const iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}

export function getQuadraticCurvePoint (startX, startY, cpX, cpY, endX, endY, position) {
  return {
    x:  _getQBezierValue(position, startX, cpX, endX),
    y:  _getQBezierValue(position, startY, cpY, endY),
  };
}

// http://gizma.com/easing/
export function easeOutQuad (t, b, c, d) {
  t /= d;
  return -c * t*(t-2) + b;
}

export function copyAction (dest, src) {
  dest.name  = src.name;
  dest.axis  = src.axis;
  dest.edges = src.edges;

  return dest;
}

import * as arr    from './arr';
import * as dom    from './domUtils';
import * as is     from './is';

export {
  win,
  arr,
  dom,
  is,
};

export { default as browser }           from './browser';
export { default as Signals }           from './Signals';
export { default as raf }               from './raf';
export { default as extend }            from './extend';
export { default as clone }             from './clone';
export { default as getOriginXY }       from './getOriginXY';
export { default as pointer }           from './pointerUtils';
export { default as rect }              from './rect';
export { default as events }            from './events';
export { default as hypot }             from './hypot';
export { default as normalizeListeners } from './normalizeListeners';
