'use strict';

var scope = {},
    extend = require('./utils/extend');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));

module.exports = scope;
