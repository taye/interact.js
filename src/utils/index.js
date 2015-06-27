'use strict';

var utils = module.exports,
    extend = require('./extend'),
    win = require('./window');

utils.blank  = function () {};

utils.warnOnce = function (method, message) {
    var warned = false;

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
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
};

utils.getQuadraticCurvePoint = function (startX, startY, cpX, cpY, endX, endY, position) {
    return {
        x:  utils._getQBezierValue(position, startX, cpX, endX),
        y:  utils._getQBezierValue(position, startY, cpY, endY)
    };
};

// http://gizma.com/easing/
utils.easeOutQuad = function (t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
};


utils.extend  = extend;
utils.hypot   = require('./hypot');
utils.raf     = require('./raf');
utils.browser = require('./browser');

extend(utils, require('./arr'));
extend(utils, require('./isType'));
extend(utils, require('./domUtils'));
extend(utils, require('./pointerUtils'));
