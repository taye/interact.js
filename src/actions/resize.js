'use strict';

var base = require('./base'),
    utils = require('../utils'),
    browser = require('../utils/browser'),
    scope = base.scope,
    InteractEvent = require('../InteractEvent'),
    Interactable = require('../Interactable');

var resize = {
    checker: function (pointer, event, interactable, element, interaction, rect) {
        if (!rect) { return null; }

        var page = utils.extend({}, interaction.curCoords.page),
            options = interactable.options;

        if (options.resize.enabled) {
            var resizeOptions = options.resize,
                resizeEdges = {
                    left: false, right: false, top: false, bottom: false
                };

            // if using resize.edges
            if (utils.isObject(resizeOptions.edges)) {
                for (var edge in resizeEdges) {
                    resizeEdges[edge] = checkResizeEdge(edge,
                                                        resizeOptions.edges[edge],
                                                        page,
                                                        interaction._eventTarget,
                                                        element,
                                                        rect,
                                                        resizeOptions.margin || scope.margin);
                }

                resizeEdges.left = resizeEdges.left && !resizeEdges.right;
                resizeEdges.top  = resizeEdges.top  && !resizeEdges.bottom;

                if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
                    return {
                        name: 'resize',
                        edges: resizeEdges
                    };
                }
            }
            else {
                var right  = options.resize.axis !== 'y' && page.x > (rect.right  - scope.margin),
                    bottom = options.resize.axis !== 'x' && page.y > (rect.bottom - scope.margin);

                if (right || bottom) {
                    return {
                        name: 'resize',
                        axes: (right? 'x' : '') + (bottom? 'y' : '')
                    };
                }
            }
        }

        return null;
    },

    cursors: (browser.isIe9OrOlder ? {
        x : 'e-resize',
        y : 's-resize',
        xy: 'se-resize',

        top        : 'n-resize',
        left       : 'w-resize',
        bottom     : 's-resize',
        right      : 'e-resize',
        topleft    : 'se-resize',
        bottomright: 'se-resize',
        topright   : 'ne-resize',
        bottomleft : 'ne-resize',
    } : {
        x : 'ew-resize',
        y : 'ns-resize',
        xy: 'nwse-resize',

        top        : 'ns-resize',
        left       : 'ew-resize',
        bottom     : 'ns-resize',
        right      : 'ew-resize',
        topleft    : 'nwse-resize',
        bottomright: 'nwse-resize',
        topright   : 'nesw-resize',
        bottomleft : 'nesw-resize',
    }),

    getCursor: function (action) {
        if (action.axis) {
            return resize.cursors[action.name + action.axis];
        }
        else if (action.edges) {
            var cursorKey = '',
                edgeNames = ['top', 'bottom', 'left', 'right'];

            for (var i = 0; i < 4; i++) {
                if (action.edges[edgeNames[i]]) {
                    cursorKey += edgeNames[i];
                }
            }

            return resize.cursors[cursorKey];
        }
    },

    beforeStart: utils.blank,

    start: function (interaction, event) {
        var resizeEvent = new InteractEvent(interaction, event, 'resize', 'start', interaction.element);

        if (interaction.prepared.edges) {
            var startRect = interaction.target.getRect(interaction.element);

            if (interaction.target.options.resize.square) {
                var squareEdges = utils.extend({}, interaction.prepared.edges);

                squareEdges.top    = squareEdges.top    || (squareEdges.left   && !squareEdges.bottom);
                squareEdges.left   = squareEdges.left   || (squareEdges.top    && !squareEdges.right );
                squareEdges.bottom = squareEdges.bottom || (squareEdges.right  && !squareEdges.top   );
                squareEdges.right  = squareEdges.right  || (squareEdges.bottom && !squareEdges.left  );

                interaction.prepared._squareEdges = squareEdges;
            }
            else {
                interaction.prepared._squareEdges = null;
            }

            interaction.resizeRects = {
                start     : startRect,
                current   : utils.extend({}, startRect),
                restricted: utils.extend({}, startRect),
                previous  : utils.extend({}, startRect),
                delta     : {
                    left: 0, right : 0, width : 0,
                    top : 0, bottom: 0, height: 0
                }
            };

            resizeEvent.rect = interaction.resizeRects.restricted;
            resizeEvent.deltaRect = interaction.resizeRects.delta;
        }

        interaction.target.fire(resizeEvent);

        interaction._interacting = true;

        return resizeEvent;
    },

    move: function (interaction, event) {
        var resizeEvent = new InteractEvent(interaction, event, 'resize', 'move', interaction.element);

        var edges = interaction.prepared.edges,
            invert = interaction.target.options.resize.invert,
            invertible = invert === 'reposition' || invert === 'negate';

        if (edges) {
            var dx = resizeEvent.dx,
                dy = resizeEvent.dy,

                start      = interaction.resizeRects.start,
                current    = interaction.resizeRects.current,
                restricted = interaction.resizeRects.restricted,
                delta      = interaction.resizeRects.delta,
                previous   = utils.extend(interaction.resizeRects.previous, restricted);

            if (interaction.target.options.resize.square) {
                var originalEdges = edges;

                edges = interaction.prepared._squareEdges;

                if ((originalEdges.left && originalEdges.bottom)
                    || (originalEdges.right && originalEdges.top)) {
                    dy = -dx;
                }
                else if (originalEdges.left || originalEdges.right) { dy = dx; }
                else if (originalEdges.top || originalEdges.bottom) { dx = dy; }
            }

            // update the 'current' rect without modifications
            if (edges.top   ) { current.top    += dy; }
            if (edges.bottom) { current.bottom += dy; }
            if (edges.left  ) { current.left   += dx; }
            if (edges.right ) { current.right  += dx; }

            if (invertible) {
                // if invertible, copy the current rect
                utils.extend(restricted, current);

                if (invert === 'reposition') {
                    // swap edge values if necessary to keep width/height positive
                    var swap;

                    if (restricted.top > restricted.bottom) {
                        swap = restricted.top;

                        restricted.top = restricted.bottom;
                        restricted.bottom = swap;
                    }
                    if (restricted.left > restricted.right) {
                        swap = restricted.left;

                        restricted.left = restricted.right;
                        restricted.right = swap;
                    }
                }
            }
            else {
                // if not invertible, restrict to minimum of 0x0 rect
                restricted.top    = Math.min(current.top, start.bottom);
                restricted.bottom = Math.max(current.bottom, start.top);
                restricted.left   = Math.min(current.left, start.right);
                restricted.right  = Math.max(current.right, start.left);
            }

            restricted.width  = restricted.right  - restricted.left;
            restricted.height = restricted.bottom - restricted.top ;

            for (var edge in restricted) {
                delta[edge] = restricted[edge] - previous[edge];
            }

            resizeEvent.edges = interaction.prepared.edges;
            resizeEvent.rect = restricted;
            resizeEvent.deltaRect = delta;
        }

        interaction.target.fire(resizeEvent);

        return resizeEvent;
    },

    end: function (interaction, event) {
        var endEvent = new InteractEvent(interaction, event, 'resize', 'end', interaction.element);

        interaction.target.fire(endEvent);
    },

    stop: utils.blank
};

/*\
 * Interactable.resizable
 [ method ]
 *
 * Gets or sets whether resize actions can be performed on the
 * Interactable
 *
 = (boolean) Indicates if this can be the target of resize elements
 | var isResizeable = interact('input[type=text]').resizable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on resize events (object makes the Interactable resizable)
 = (object) This Interactable
 | interact(element).resizable({
 |     onstart: function (event) {},
 |     onmove : function (event) {},
 |     onend  : function (event) {},
 |
 |     edges: {
 |       top   : true,       // Use pointer coords to check for resize.
 |       left  : false,      // Disable resizing from left edge.
 |       bottom: '.resize-s',// Resize if pointer target matches selector
 |       right : handleEl    // Resize if pointer target is the given Element
 |     },
 |
 |     // a value of 'none' will limit the resize rect to a minimum of 0x0
 |     // 'negate' will allow the rect to have negative width/height
 |     // 'reposition' will keep the width/height positive by swapping
 |     // the top and bottom edges and/or swapping the left and right edges
 |     invert: 'none' || 'negate' || 'reposition'
 |
 |     // limit multiple resizes.
 |     // See the explanation in the @Interactable.draggable example
 |     max: Infinity,
 |     maxPerElement: 1,
 | });
\*/
Interactable.prototype.resizable = function (options) {
    if (utils.isObject(options)) {
        this.options.resize.enabled = options.enabled === false? false: true;
        this.setPerAction('resize', options);
        this.setOnEvents('resize', options);

        if (/^x$|^y$|^xy$/.test(options.axis)) {
            this.options.resize.axis = options.axis;
        }
        else if (options.axis === null) {
            this.options.resize.axis = scope.defaultOptions.resize.axis;
        }

        if (utils.isBool(options.square)) {
            this.options.resize.square = options.square;
        }

        return this;
    }
    if (utils.isBool(options)) {
        this.options.resize.enabled = options;

        return this;
    }
    return this.options.resize;
};

function checkResizeEdge (name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) { return false; }

    // true value, use pointer coords and element rect
    if (value === true) {
        // if dimensions are negative, "switch" edges
        var width = utils.isNumber(rect.width)? rect.width : rect.right - rect.left,
            height = utils.isNumber(rect.height)? rect.height : rect.bottom - rect.top;

        if (width < 0) {
            if      (name === 'left' ) { name = 'right'; }
            else if (name === 'right') { name = 'left' ; }
        }
        if (height < 0) {
            if      (name === 'top'   ) { name = 'bottom'; }
            else if (name === 'bottom') { name = 'top'   ; }
        }

        if (name === 'left'  ) { return page.x < ((width  >= 0? rect.left: rect.right ) + margin); }
        if (name === 'top'   ) { return page.y < ((height >= 0? rect.top : rect.bottom) + margin); }

        if (name === 'right' ) { return page.x > ((width  >= 0? rect.right : rect.left) - margin); }
        if (name === 'bottom') { return page.y > ((height >= 0? rect.bottom: rect.top ) - margin); }
    }

    // the remaining checks require an element
    if (!utils.isElement(element)) { return false; }

    return utils.isElement(value)
                // the value is an element to use as a resize handle
                ? value === element
                // otherwise check if element matches value as selector
                : utils.matchesUpTo(element, value, interactableElement);
}

base.resize = resize;
base.names.push('resize');
utils.merge(scope.eventTypes, [
    'resizestart',
    'resizemove',
    'resizeinertiastart',
    'resizeend'
]);
base.methodDict.resize = 'resizable';

module.exports = resize;
