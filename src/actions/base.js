'use strict';

var scope = require('../scope'),
    browser = require('../utils/browser'),
    checkers = [];

var actions = {
    scope: scope,
    checkers: checkers,

    addEventTypes: function (eventTypes) {
        for (var i = 0; i < eventTypes.length; i++) {
            scope.eventTypes.push(eventTypes[i]);
        }
    },

    defaultActionChecker: function (pointer, interaction, element) {
        var rect = this.getRect(element),
            action = null;

        for (var i = 0; !action && i < checkers.length; i++) {
            action = checkers[i](pointer, event, this, element, interaction, rect);
        }

        return action;
    }
};

scope.actionCursors = browser.isIe9OrOlder ? {
    drag    : 'move',
    resizex : 'e-resize',
    resizey : 's-resize',
    resizexy: 'se-resize',

    resizetop        : 'n-resize',
    resizeleft       : 'w-resize',
    resizebottom     : 's-resize',
    resizeright      : 'e-resize',
    resizetopleft    : 'se-resize',
    resizebottomright: 'se-resize',
    resizetopright   : 'ne-resize',
    resizebottomleft : 'ne-resize',

    gesture : ''
} : {
    drag    : 'move',
    resizex : 'ew-resize',
    resizey : 'ns-resize',
    resizexy: 'nwse-resize',

    resizetop        : 'ns-resize',
    resizeleft       : 'ew-resize',
    resizebottom     : 'ns-resize',
    resizeright      : 'ew-resize',
    resizetopleft    : 'nwse-resize',
    resizebottomright: 'nwse-resize',
    resizetopright   : 'nesw-resize',
    resizebottomleft : 'nesw-resize',

    gesture : ''
};

module.exports = actions;
