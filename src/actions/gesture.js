'use strict';

var base = require('./base'),
    utils = require('../utils'),
    InteractEvent = require('../InteractEvent'),
    Interactable = require('../Interactable'),
    scope = base.scope;

var gesture = {
    checker: function (pointer, event, interactable, element, interaction) {
        if (interaction.pointerIds.length >= 2) {
            return { name: 'gesture' };
        }

        return null;
    },

    getCursor: function () {
        return '';
    },

    beforeStart: utils.blank,

    start: function (interaction, event) {
        var gestureEvent = new InteractEvent(interaction, event, 'gesture', 'start', interaction.element);

        gestureEvent.ds = 0;

        interaction.gesture.startDistance = interaction.gesture.prevDistance = gestureEvent.distance;
        interaction.gesture.startAngle = interaction.gesture.prevAngle = gestureEvent.angle;
        interaction.gesture.scale = 1;

        interaction._interacting = true;

        interaction.target.fire(gestureEvent);

        return gestureEvent;
    },

    move: function (interaction, event) {
        if (!interaction.pointerIds.length) {
            return interaction.prevEvent;
        }

        var gestureEvent;

        gestureEvent = new InteractEvent(interaction, event, 'gesture', 'move', interaction.element);
        gestureEvent.ds = gestureEvent.scale - interaction.gesture.scale;

        interaction.target.fire(gestureEvent);

        interaction.gesture.prevAngle = gestureEvent.angle;
        interaction.gesture.prevDistance = gestureEvent.distance;

        if (gestureEvent.scale !== Infinity &&
            gestureEvent.scale !== null &&
            gestureEvent.scale !== undefined  &&
            !isNaN(gestureEvent.scale)) {

            interaction.gesture.scale = gestureEvent.scale;
        }

        return gestureEvent;
    },

    end: function (interaction, event) {
        var endEvent = new InteractEvent(interaction, event, 'gesture', 'end', interaction.element);

        interaction.target.fire(endEvent);
    },

    stop: utils.blank
};

/*\
 * Interactable.gesturable
 [ method ]
 *
 * Gets or sets whether multitouch gestures can be performed on the
 * Interactable's element
 *
 = (boolean) Indicates if this can be the target of gesture events
 | var isGestureable = interact(element).gesturable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on gesture events (makes the Interactable gesturable)
 = (object) this Interactable
 | interact(element).gesturable({
 |     onstart: function (event) {},
 |     onmove : function (event) {},
 |     onend  : function (event) {},
 |
 |     // limit multiple gestures.
 |     // See the explanation in @Interactable.draggable example
 |     max: Infinity,
 |     maxPerElement: 1,
 | });
\*/
Interactable.prototype.gesturable = function (options) {
    if (utils.isObject(options)) {
        this.options.gesture.enabled = options.enabled === false? false: true;
        this.setPerAction('gesture', options);
        this.setOnEvents('gesture', options);

        return this;
    }

    if (utils.isBool(options)) {
        this.options.gesture.enabled = options;

        return this;
    }

    return this.options.gesture;
};

base.gesture = gesture;
base.names.push('gesture');
scope.addEventTypes([
    'gesturestart',
    'gesturemove',
    'gestureinertiastart',
    'gestureend'
]);
base.methodDict.gesture = 'gesturable';

module.exports = gesture;
