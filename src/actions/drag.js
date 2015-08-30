'use strict';

var base = require('./base'),
    drop = require('./drop'),
    scope = base.scope,
    utils = require('../utils'),
    browser = utils.browser,
    InteractEvent = require('../InteractEvent'),
    Interactable = require('../Interactable'),
    defaultOptions = require('../defaultOptions');

var drag = {
    defaults: {
        enabled: false,
        manualStart: true,
        max: Infinity,
        maxPerElement: 1,

        snap: null,
        restrict: null,
        inertia: null,
        autoScroll: null,

        axis: 'xy'
    },

    checker: function (pointer, event, interactable) {
        return interactable.options.drag.enabled
            ? { name: 'drag' }
            : null;
    },

    getCursor: function () {
        return 'move';
    },

    beforeStart: function (interaction, pointer, event, eventTarget, curEventTarget, dx, dy) {
        // check if a drag is in the correct axis
        var absX = Math.abs(dx),
            absY = Math.abs(dy),
            targetAxis = interaction.target.options.drag.axis,
            axis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy');

        // if the movement isn't in the axis of the interactable
        if (axis !== 'xy' && targetAxis !== 'xy' && targetAxis !== axis) {
            // cancel the prepared action
            interaction.prepared.name = null;

            // then try to get a drag from another ineractable

            var element = eventTarget;

            // check element interactables
            while (utils.isElement(element)) {
                var elementInteractable = scope.interactables.get(element);

                if (elementInteractable
                    && elementInteractable !== interaction.target
                    && !elementInteractable.options.drag.manualStart
                    && elementInteractable.getAction(interaction.downPointer, interaction.downEvent, interaction, element).name === 'drag'
                    && checkAxis(axis, elementInteractable)) {

                    interaction.prepared.name = 'drag';
                    interaction.target = elementInteractable;
                    interaction.element = element;
                    break;
                }

                element = utils.parentElement(element);
            }

            // if there's no drag from element interactables,
            // check the selector interactables
            if (!interaction.prepared.name) {
                var interactionInteraction = interaction;

                var getDraggable = function (interactable, selector, context) {
                    var elements = browser.useMatchesSelectorPolyfill
                        ? context.querySelectorAll(selector)
                        : undefined;

                    if (interactable === interactionInteraction.target) { return; }

                    if (scope.inContext(interactable, eventTarget)
                        && !interactable.options.drag.manualStart
                        && !scope.testIgnore(interactable, element, eventTarget)
                        && scope.testAllow(interactable, element, eventTarget)
                        && utils.matchesSelector(element, selector, elements)
                        && interactable.getAction(interactionInteraction.downPointer, interactionInteraction.downEvent, interactionInteraction, element).name === 'drag'
                        && checkAxis(axis, interactable)
                        && scope.withinInteractionLimit(interactable, element, 'drag')) {

                        return interactable;
                    }
                };

                element = eventTarget;

                while (utils.isElement(element)) {
                    var selectorInteractable = scope.interactables.forEachSelector(getDraggable);

                    if (selectorInteractable) {
                        interaction.prepared.name = 'drag';
                        interaction.target = selectorInteractable;
                        interaction.element = element;
                        break;
                    }

                    element = utils.parentElement(element);
                }
            }
        }
    },

    start: function (interaction, event) {
        var dragEvent = new InteractEvent(interaction, event, 'drag', 'start', interaction.element);

        interaction._interacting = true;
        interaction.target.fire(dragEvent);

        drop.start(interaction, event, dragEvent);

        return dragEvent;
    },

    move: function (interaction, event) {
        var dragEvent  = new InteractEvent(interaction, event, 'drag', 'move', interaction.element);

        drop.move(interaction, event, dragEvent);

        return dragEvent;
    },

    end: function (interaction, event) {
        var endEvent = new InteractEvent(interaction, event, 'drag', 'end', interaction.element);

        drop.end(interaction, event, endEvent);

        interaction.target.fire(endEvent);
    },

    stop: drop.stop
};

function checkAxis (axis, interactable) {
    if (!interactable) { return false; }

    var thisAxis = interactable.options.drag.axis;

    return (axis === 'xy' || thisAxis === 'xy' || thisAxis === axis);
}

/*\
 * Interactable.draggable
 [ method ]
 *
 * Gets or sets whether drag actions can be performed on the
 * Interactable
 *
 = (boolean) Indicates if this can be the target of drag events
 | var isDraggable = interact('ul li').draggable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on drag events (object makes the Interactable draggable)
 = (object) This Interactable
 | interact(element).draggable({
 |     onstart: function (event) {},
 |     onmove : function (event) {},
 |     onend  : function (event) {},
 |
 |     // the axis in which the first movement must be
 |     // for the drag sequence to start
 |     // 'xy' by default - any direction
 |     axis: 'x' || 'y' || 'xy',
 |
 |     // max number of drags that can happen concurrently
 |     // with elements of this Interactable. Infinity by default
 |     max: Infinity,
 |
 |     // max number of drags that can target the same element+Interactable
 |     // 1 by default
 |     maxPerElement: 2
 | });
\*/
Interactable.prototype.draggable = function (options) {
    if (utils.isObject(options)) {
        this.options.drag.enabled = options.enabled === false? false: true;
        this.setPerAction('drag', options);
        this.setOnEvents('drag', options);

        if (/^x$|^y$|^xy$/.test(options.axis)) {
            this.options.drag.axis = options.axis;
        }
        else if (options.axis === null) {
            delete this.options.drag.axis;
        }

        return this;
    }

    if (utils.isBool(options)) {
        this.options.drag.enabled = options;

        return this;
    }

    return this.options.drag;
};

base.drag = drag;
base.names.push('drag');
utils.merge(scope.eventTypes, [
    'dragstart',
    'dragmove',
    'draginertiastart',
    'dragend'
]);
base.methodDict.drag = 'draggable';

defaultOptions.drag = drag.defaults;

module.exports = drag;
