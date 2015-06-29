'use strict';

var scope = require('../scope'),
    utils = require('../utils');

var actions = {

    checkResizeEdge: function (name, value, page, element, interactableElement, rect, margin) {
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
    },

    defaultActionChecker: function (pointer, interaction, element) {
        var rect = this.getRect(element),
            shouldResize = false,
            action = null,
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
            if (utils.isObject(resizeOptions.edges)) {
                for (var edge in resizeEdges) {
                    resizeEdges[edge] = actions.checkResizeEdge(edge,
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
};

module.exports = actions;
