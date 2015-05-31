'use strict';

var utils = {},
    extend = require('./extend'),
    win = require('./window');

utils.blank  = function () {};

utils.hypot = Math.hypot || function (x, y) { return Math.sqrt(x * x + y * y); };

utils.warnOnce = function (method, message) {
    var warned = false;

    return function () {
        if (!warned) {
            win.console.warn(message);
            warned = true;
        }

        return method.apply(this, arguments);
    };
};

utils.extend = extend;
utils.raf    = require('./raf');

extend(utils, require('./arr'));
extend(utils, require('./isType'));

module.exports = utils;
