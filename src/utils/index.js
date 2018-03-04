import win         from './window';
import browser     from './browser';
import Signals     from './Signals';
import * as arr    from './arr';
import * as dom    from './domUtils';
import raf         from './raf';
import extend      from './extend';
import getOriginXY from './getOriginXY';
import hypot       from './hypot';
import * as is     from './is';
import pointer     from './pointerUtils';
import rect        from './rect';

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

export {
  Signals,
  arr,
  dom,
  extend,
  getOriginXY,
  hypot,
  is,
  pointer,
  rect,
  raf,
  win,
  browser,
};
