'use strict';

var scope = {};

scope.extend = require('./utils/extend');

scope.extend(scope, require('./utils/window'));
scope.extend(scope, require('./utils/domObjects'));

module.exports = scope;
