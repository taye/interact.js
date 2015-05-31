'use strict';

var scope = {},
    extend = require('./utils/extend');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));
extend(scope, require('./utils/arr.js'));
extend(scope, require('./utils/isType'));

module.exports = scope;
