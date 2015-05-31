'use strict';

var scope = {};

var win = require('./utils/window');

scope.window     = win.window;
scope.realWindow = win.realWindow;

module.exports = scope;
