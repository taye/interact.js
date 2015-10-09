const utils = module.exports;
const extend = require('./extend');
const win = require('./window');

utils.blank = function () {};

utils.warnOnce = function (method, message) {
  let warned = false;

  return function () {
    if (!warned) {
      win.window.console.warn(message);
      warned = true;
    }

    return method.apply(this, arguments);
  };
};

// http://stackoverflow.com/a/5634528/2280888
utils._getQBezierValue = function (t, p1, p2, p3) {
  const iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
};

utils.getQuadraticCurvePoint = function (startX, startY, cpX, cpY, endX, endY, position) {
  return {
    x:  utils._getQBezierValue(position, startX, cpX, endX),
    y:  utils._getQBezierValue(position, startY, cpY, endY),
  };
};

// http://gizma.com/easing/
utils.easeOutQuad = function (t, b, c, d) {
  t /= d;
  return -c * t*(t-2) + b;
};

utils.copyAction = function (dest, src) {
  dest.name  = src.name;
  dest.axis  = src.axis;
  dest.edges = src.edges;

  return dest;
};

utils.extend      = extend;
utils.hypot       = require('./hypot');
utils.raf         = require('./raf');
utils.browser     = require('./browser');
utils.getOriginXY = require('./getOriginXY');

extend(utils, require('./arr'));
extend(utils, require('./isType'));
extend(utils, require('./domUtils'));
extend(utils, require('./pointerUtils'));
