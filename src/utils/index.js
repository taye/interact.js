'use strict';

var utils = module.exports,
    extend = require('./extend'),
    defaultOptions = require('../defaultOptions'),
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

utils.getOriginXY = function (interactable, element) {
    var origin = interactable
            ? interactable.options.origin
            : defaultOptions.origin;

    if (origin === 'parent') {
        origin = utils.parentElement(element);
    }
    else if (origin === 'self') {
        origin = interactable.getRect(element);
    }
    else if (utils.trySelector(origin)) {
        origin = utils.closest(element, origin) || { x: 0, y: 0 };
    }

    if (utils.isFunction(origin)) {
        origin = origin(interactable && element);
    }

    if (utils.isElement(origin))  {
        origin = utils.getElementRect(origin);
    }

    origin.x = ('x' in origin)? origin.x : origin.left;
    origin.y = ('y' in origin)? origin.y : origin.top;

    return origin;
};


utils.extend  = extend;
utils.hypot   = require('./hypot');
utils.raf     = require('./raf');
utils.browser = require('./browser');

extend(utils, require('./arr'));
extend(utils, require('./isType'));
extend(utils, require('./domUtils'));
extend(utils, require('./pointerUtils'));
