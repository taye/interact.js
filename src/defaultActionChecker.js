'use strict';

var utils = require('./utils');
var scope = require('./scope');

function defaultActionChecker (pointer, interaction, element) {
    var rect = this.getRect(element),
        shouldResize = false,
        action,
        resizeAxes = null,
        resizeEdges,
        page = utils.extend({}, interaction.curCoords.page),
        options = this.options;

    if (!rect) { return null; }

    if (scope.actionIsEnabled.resize && options.resize.enabled) {
        var resizeOptions = options.resize;

        resizeEdges = {
            left: false, right: false, top: false, bottom: false
        };

        // if using resize.edges
        if (scope.isObject(resizeOptions.edges)) {
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

            shouldResize = resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom;
        }
        else {
            var right  = options.resize.axis !== 'y' && page.x > (rect.right  - scope.margin),
                bottom = options.resize.axis !== 'x' && page.y > (rect.bottom - scope.margin);

            shouldResize = right || bottom;
            resizeAxes = (right? 'x' : '') + (bottom? 'y' : '');
        }
    }

    action = shouldResize
        ? 'resize'
        : scope.actionIsEnabled.drag && options.drag.enabled
        ? 'drag'
        : null;

    if (scope.actionIsEnabled.gesture
        && interaction.pointerIds.length >=2
        && !(interaction.dragging || interaction.resizing)) {
        action = 'gesture';
    }

    if (action) {
        return {
            name: action,
            axis: resizeAxes,
            edges: resizeEdges
        };
    }

    return null;
}

module.exports = defaultActionChecker;