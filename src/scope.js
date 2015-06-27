'use strict';

var scope = {},
    extend = require('./utils/extend');

scope.pEventTypes = null;

scope.documents       = [];   // all documents being listened to

scope.interactables   = [];   // all set interactables
scope.interactions    = [];   // all interactions

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));

module.exports = scope;
