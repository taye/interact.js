'use strict';

module.exports = {
    base: {
        accept        : null,
        actionChecker : null,
        styleCursor   : true,
        preventDefault: 'auto',
        origin        : { x: 0, y: 0 },
        deltaSource   : 'page',
        allowFrom     : null,
        ignoreFrom    : null,
        _context      : require('./utils/domObjects').document,
        dropChecker   : null
    },

    drag: {
        enabled: false,
        manualStart: true,
        max: Infinity,
        maxPerElement: 1,

        snap: null,
        restrict: null,
        inertia: null,
        autoScroll: null,

        axis: 'xy',
    },

    drop: {
        enabled: false,
        accept: null,
        overlap: 'pointer'
    },

    resize: {
        enabled: false,
        manualStart: false,
        max: Infinity,
        maxPerElement: 1,

        snap: null,
        restrict: null,
        inertia: null,
        autoScroll: null,

        square: false,
        axis: 'xy',

        // use default margin
        margin: NaN,

        // object with props left, right, top, bottom which are
        // true/false values to resize when the pointer is over that edge,
        // CSS selectors to match the handles for each direction
        // or the Elements for each handle
        edges: null,

        // a value of 'none' will limit the resize rect to a minimum of 0x0
        // 'negate' will alow the rect to have negative width/height
        // 'reposition' will keep the width/height positive by swapping
        // the top and bottom edges and/or swapping the left and right edges
        invert: 'none'
    },

    gesture: {
        manualStart: false,
        enabled: false,
        max: Infinity,
        maxPerElement: 1,

        restrict: null
    },

    perAction: {
        manualStart: false,
        max: Infinity,
        maxPerElement: 1,

        snap: {
            enabled     : false,
            endOnly     : false,
            range       : Infinity,
            targets     : null,
            offsets     : null,

            relativePoints: null
        },

        restrict: {
            enabled: false,
            endOnly: false
        },

        autoScroll: {
            enabled     : false,
            container   : null,     // the item that is scrolled (Window or HTMLElement)
            margin      : 60,
            speed       : 300       // the scroll speed in pixels per second
        },

        inertia: {
            enabled          : false,
            resistance       : 10,    // the lambda in exponential decay
            minSpeed         : 100,   // target speed must be above this for inertia to start
            endSpeed         : 10,    // the speed at which inertia is slow enough to stop
            allowResume      : true,  // allow resuming an action in inertia phase
            zeroResumeDelta  : true,  // if an action is resumed after launch, set dx/dy to 0
            smoothEndDuration: 300    // animate to snap/restrict endOnly if there's no inertia
        }
    },

    _holdDuration: 600
};
