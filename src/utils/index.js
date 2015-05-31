'use strict';

var utils = {},
    extend = require('./extend');

utils.extend = extend;
utils.blank  = function () {};
utils.raf    = require('./raf');

extend(utils, require('./arr'));
extend(utils, require('./isType'));

module.exports = utils;
