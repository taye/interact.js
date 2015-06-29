'use strict';

var base = require('./base'),
    utils = require('../utils'),
    scope = base.scope,
    Interaction = require('../Interaction'),
    InteractEvent = require('../InteractEvent'),
    Interactable = require('../Interactable');

base.addEventTypes([
    'resizestart',
    'resizemove',
    'resizeinertiastart',
    'resizeend'
]);

base.checkers.push(function (pointer, event, interactable, element, interaction, rect) {
    if (!rect) { return null; }

    var page = utils.extend({}, interaction.curCoords.page),
        options = interactable.options;

    if (scope.actionIsEnabled.resize && options.resize.enabled) {
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
});

Interaction.prototype.resizeStart = function (event) {
    var resizeEvent = new InteractEvent(this, event, 'resize', 'start', this.element);

    if (this.prepared.edges) {
        var startRect = this.target.getRect(this.element);

        if (this.target.options.resize.square) {
            var squareEdges = utils.extend({}, this.prepared.edges);

            squareEdges.top    = squareEdges.top    || (squareEdges.left   && !squareEdges.bottom);
            squareEdges.left   = squareEdges.left   || (squareEdges.top    && !squareEdges.right );
            squareEdges.bottom = squareEdges.bottom || (squareEdges.right  && !squareEdges.top   );
            squareEdges.right  = squareEdges.right  || (squareEdges.bottom && !squareEdges.left  );

            this.prepared._squareEdges = squareEdges;
        }
        else {
            this.prepared._squareEdges = null;
        }

        this.resizeRects = {
            start     : startRect,
            current   : utils.extend({}, startRect),
            restricted: utils.extend({}, startRect),
            previous  : utils.extend({}, startRect),
            delta     : {
                left: 0, right : 0, width : 0,
                top : 0, bottom: 0, height: 0
            }
        };

        resizeEvent.rect = this.resizeRects.restricted;
        resizeEvent.deltaRect = this.resizeRects.delta;
    }

    this.target.fire(resizeEvent);

    this.resizing = true;

    return resizeEvent;
};

Interaction.prototype.resizeMove = function (event) {
    var resizeEvent = new InteractEvent(this, event, 'resize', 'move', this.element);

    var edges = this.prepared.edges,
        invert = this.target.options.resize.invert,
        invertible = invert === 'reposition' || invert === 'negate';

    if (edges) {
        var dx = resizeEvent.dx,
            dy = resizeEvent.dy,

            start      = this.resizeRects.start,
            current    = this.resizeRects.current,
            restricted = this.resizeRects.restricted,
            delta      = this.resizeRects.delta,
            previous   = utils.extend(this.resizeRects.previous, restricted);

        if (this.target.options.resize.square) {
            var originalEdges = edges;

            edges = this.prepared._squareEdges;

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

        resizeEvent.edges = this.prepared.edges;
        resizeEvent.rect = restricted;
        resizeEvent.deltaRect = delta;
    }

    this.target.fire(resizeEvent);

    return resizeEvent;
};

Interaction.prototype.resizeEnd = function (event) {
    var endEvent = new InteractEvent(this, event, 'resize', 'end', this.element);

    this.target.fire(endEvent);
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

/*\
 * Interactable.squareResize
 [ method ]
 *
 * Deprecated. Add a `square: true || false` property to @Interactable.resizable instead
 *
 * Gets or sets whether resizing is forced 1:1 aspect
 *
 = (boolean) Current setting
 *
 * or
 *
 - newValue (boolean) #optional
 = (object) this Interactable
\*/
Interactable.prototype.squareResize = function (newValue) {
    if (utils.isBool(newValue)) {
        this.options.resize.square = newValue;

        return this;
    }

    if (newValue === null) {
        delete this.options.resize.square;

        return this;
    }

    return this.options.resize.square;
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
