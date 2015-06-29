'use strict';

var base = require('./base'),
    scope = base.scope,
    utils = require('../utils'),
    Interaction = require('../Interaction'),
    InteractEvent = require('../InteractEvent'),
    Interactable = require('../Interactable');

base.addEventTypes([
    'gesturestart',
    'gesturemove',
    'gestureinertiastart',
    'gestureend'
]);

base.checkers.push(function (pointer, event, interactable, element, interaction) {
    if (scope.actionIsEnabled.gesture
        && interaction.pointerIds.length >=2
        && !(interaction.dragging || interaction.resizing)) {
            return { name: 'gesture' };
    }

    return null;
});

Interaction.prototype.gestureStart = function (event) {
    var gestureEvent = new InteractEvent(this, event, 'gesture', 'start', this.element);

    gestureEvent.ds = 0;

    this.gesture.startDistance = this.gesture.prevDistance = gestureEvent.distance;
    this.gesture.startAngle = this.gesture.prevAngle = gestureEvent.angle;
    this.gesture.scale = 1;

    this.gesturing = true;

    this.target.fire(gestureEvent);

    return gestureEvent;
};

Interaction.prototype.gestureMove = function (event) {
    if (!this.pointerIds.length) {
        return this.prevEvent;
    }

    var gestureEvent;

    gestureEvent = new InteractEvent(this, event, 'gesture', 'move', this.element);
    gestureEvent.ds = gestureEvent.scale - this.gesture.scale;

    this.target.fire(gestureEvent);

    this.gesture.prevAngle = gestureEvent.angle;
    this.gesture.prevDistance = gestureEvent.distance;

    if (gestureEvent.scale !== Infinity &&
        gestureEvent.scale !== null &&
        gestureEvent.scale !== undefined  &&
        !isNaN(gestureEvent.scale)) {

        this.gesture.scale = gestureEvent.scale;
    }

    return gestureEvent;
};

Interaction.prototype.gestureEnd = function (event) {
    var endEvent = new InteractEvent(this, event, 'gesture', 'end', this.element);

    this.target.fire(endEvent);
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

