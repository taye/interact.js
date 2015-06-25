(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interact = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * interact.js v1.2.4
 *
 * Copyright (c) 2012-2015 Taye Adeyemi <dev@taye.me>
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

    'use strict';

    // return early if there's no window to work with (eg. Node.js)
    if (!require('./utils/window').window) { return; }

    var scope = require('./scope'),
        utils = require('./utils'),
        browser = utils.browser;

    // Events wrapper
    var events = require('./utils/events');

    var Interaction = require('./Interaction');

    var InteractEvent = require('./InteractEvent');

    var listener = require('./listener');

    listener.bindInteractionListeners();


    scope.interactables.indexOfElement = function indexOfElement (element, context) {
        context = context || scope.document;

        for (var i = 0; i < this.length; i++) {
            var interactable = this[i];

            if ((interactable.selector === element
                && (interactable._context === context))
                || (!interactable.selector && interactable._element === element)) {

                return i;
            }
        }
        return -1;
    };

    scope.interactables.get = function interactableGet (element, options) {
        return this[this.indexOfElement(element, options && options.context)];
    };

    scope.interactables.forEachSelector = function (callback) {
        for (var i = 0; i < this.length; i++) {
            var interactable = this[i];

            if (!interactable.selector) {
                continue;
            }

            var ret = callback(interactable, interactable.selector, interactable._context, i, this);

            if (ret !== undefined) {
                return ret;
            }
        }
    };

    /*\
     * interact
     [ method ]
     *
     * The methods of this variable can be used to set elements as
     * interactables and also to change various default settings.
     *
     * Calling it as a function and passing an element or a valid CSS selector
     * string returns an Interactable object which has various methods to
     * configure it.
     *
     - element (Element | string) The HTML or SVG Element to interact with or CSS selector
     = (object) An @Interactable
     *
     > Usage
     | interact(document.getElementById('draggable')).draggable(true);
     |
     | var rectables = interact('rect');
     | rectables
     |     .gesturable(true)
     |     .on('gesturemove', function (event) {
     |         // something cool...
     |     })
     |     .autoScroll(true);
    \*/
    function interact (element, options) {
        return scope.interactables.get(element, options) || new Interactable(element, options);
    }

    var Interactable = require('./Interactable');

    /*\
     * interact.isSet
     [ method ]
     *
     * Check if an element has been set
     - element (Element) The Element being searched for
     = (boolean) Indicates if the element or CSS selector was previously passed to interact
    \*/
    interact.isSet = function(element, options) {
        return scope.interactables.indexOfElement(element, options && options.context) !== -1;
    };

    /*\
     * interact.on
     [ method ]
     *
     * Adds a global listener for an InteractEvent or adds a DOM event to
     * `document`
     *
     - type       (string | array | object) The types of events to listen for
     - listener   (function) The function to be called on the given event(s)
     - useCapture (boolean) #optional useCapture flag for addEventListener
     = (object) interact
    \*/
    interact.on = function (type, listener, useCapture) {
        if (scope.isString(type) && type.search(' ') !== -1) {
            type = type.trim().split(/ +/);
        }

        if (scope.isArray(type)) {
            for (var i = 0; i < type.length; i++) {
                interact.on(type[i], listener, useCapture);
            }

            return interact;
        }

        if (scope.isObject(type)) {
            for (var prop in type) {
                interact.on(prop, type[prop], listener);
            }

            return interact;
        }

        // if it is an InteractEvent type, add listener to globalEvents
        if (scope.contains(scope.eventTypes, type)) {
            // if this type of event was never bound
            if (!scope.globalEvents[type]) {
                scope.globalEvents[type] = [listener];
            }
            else {
                scope.globalEvents[type].push(listener);
            }
        }
        // If non InteractEvent type, addEventListener to document
        else {
            events.add(scope.document, type, listener, useCapture);
        }

        return interact;
    };

    /*\
     * interact.off
     [ method ]
     *
     * Removes a global InteractEvent listener or DOM event from `document`
     *
     - type       (string | array | object) The types of events that were listened for
     - listener   (function) The listener function to be removed
     - useCapture (boolean) #optional useCapture flag for removeEventListener
     = (object) interact
     \*/
    interact.off = function (type, listener, useCapture) {
        if (scope.isString(type) && type.search(' ') !== -1) {
            type = type.trim().split(/ +/);
        }

        if (scope.isArray(type)) {
            for (var i = 0; i < type.length; i++) {
                interact.off(type[i], listener, useCapture);
            }

            return interact;
        }

        if (scope.isObject(type)) {
            for (var prop in type) {
                interact.off(prop, type[prop], listener);
            }

            return interact;
        }

        if (!scope.contains(scope.eventTypes, type)) {
            events.remove(scope.document, type, listener, useCapture);
        }
        else {
            var index;

            if (type in scope.globalEvents
                && (index = scope.indexOf(scope.globalEvents[type], listener)) !== -1) {
                scope.globalEvents[type].splice(index, 1);
            }
        }

        return interact;
    };

    /*\
     * interact.enableDragging
     [ method ]
     *
     * Deprecated.
     *
     * Returns or sets whether dragging is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableDragging = utils.warnOnce(function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            scope.actionIsEnabled.drag = newValue;

            return interact;
        }
        return scope.actionIsEnabled.drag;
    }, 'interact.enableDragging is deprecated and will soon be removed.');

    /*\
     * interact.enableResizing
     [ method ]
     *
     * Deprecated.
     *
     * Returns or sets whether resizing is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableResizing = utils.warnOnce(function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            scope.actionIsEnabled.resize = newValue;

            return interact;
        }
        return scope.actionIsEnabled.resize;
    }, 'interact.enableResizing is deprecated and will soon be removed.');

    /*\
     * interact.enableGesturing
     [ method ]
     *
     * Deprecated.
     *
     * Returns or sets whether gesturing is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableGesturing = utils.warnOnce(function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            scope.actionIsEnabled.gesture = newValue;

            return interact;
        }
        return scope.actionIsEnabled.gesture;
    }, 'interact.enableGesturing is deprecated and will soon be removed.');

    interact.eventTypes = scope.eventTypes;

    /*\
     * interact.debug
     [ method ]
     *
     * Returns debugging data
     = (object) An object with properties that outline the current state and expose internal functions and variables
    \*/
    interact.debug = function () {
        var interaction = scope.interactions[0] || new Interaction();

        return {
            interactions          : scope.interactions,
            target                : interaction.target,
            dragging              : interaction.dragging,
            resizing              : interaction.resizing,
            gesturing             : interaction.gesturing,
            prepared              : interaction.prepared,
            matches               : interaction.matches,
            matchElements         : interaction.matchElements,

            prevCoords            : interaction.prevCoords,
            startCoords           : interaction.startCoords,

            pointerIds            : interaction.pointerIds,
            pointers              : interaction.pointers,
            addPointer            : listener.listeners.addPointer,
            removePointer         : listener.listeners.removePointer,
            recordPointer         : listener.listeners.recordPointer,

            snap                  : interaction.snapStatus,
            restrict              : interaction.restrictStatus,
            inertia               : interaction.inertiaStatus,

            downTime              : interaction.downTimes[0],
            downEvent             : interaction.downEvent,
            downPointer           : interaction.downPointer,
            prevEvent             : interaction.prevEvent,

            Interactable          : Interactable,
            interactables         : scope.interactables,
            pointerIsDown         : interaction.pointerIsDown,
            defaultOptions        : scope.defaultOptions,
            defaultActionChecker  : require('./defaultActionChecker'),

            actionCursors         : scope.actionCursors,
            dragMove              : listener.listeners.dragMove,
            resizeMove            : listener.listeners.resizeMove,
            gestureMove           : listener.listeners.gestureMove,
            pointerUp             : listener.listeners.pointerUp,
            pointerDown           : listener.listeners.pointerDown,
            pointerMove           : listener.listeners.pointerMove,
            pointerHover          : listener.listeners.pointerHover,

            eventTypes            : scope.eventTypes,

            events                : events,
            globalEvents          : scope.globalEvents,
            delegatedEvents       : listener.delegatedEvents
        };
    };

    // expose the functions used to calculate multi-touch properties
    interact.getTouchAverage  = utils.touchAverage;
    interact.getTouchBBox     = utils.touchBBox;
    interact.getTouchDistance = utils.touchDistance;
    interact.getTouchAngle    = utils.touchAngle;

    interact.getElementRect   = scope.getElementRect;
    interact.matchesSelector  = scope.matchesSelector;
    interact.closest          = scope.closest;

    /*\
     * interact.margin
     [ method ]
     *
     * Returns or sets the margin for autocheck resizing used in
     * @Interactable.getAction. That is the distance from the bottom and right
     * edges of an element clicking in which will start resizing
     *
     - newValue (number) #optional
     = (number | interact) The current margin value or interact
    \*/
    interact.margin = function (newvalue) {
        if (scope.isNumber(newvalue)) {
            scope.margin = newvalue;

            return interact;
        }
        return scope.margin;
    };

    /*\
     * interact.supportsTouch
     [ method ]
     *
     = (boolean) Whether or not the browser supports touch input
    \*/
    interact.supportsTouch = function () {
        return browser.supportsTouch;
    };

    /*\
     * interact.supportsPointerEvent
     [ method ]
     *
     = (boolean) Whether or not the browser supports PointerEvents
    \*/
    interact.supportsPointerEvent = function () {
        return browser.supportsPointerEvent;
    };

    /*\
     * interact.stop
     [ method ]
     *
     * Cancels all interactions (end events are not fired)
     *
     - event (Event) An event on which to call preventDefault()
     = (object) interact
    \*/
    interact.stop = function (event) {
        for (var i = scope.interactions.length - 1; i > 0; i--) {
            scope.interactions[i].stop(event);
        }

        return interact;
    };

    /*\
     * interact.dynamicDrop
     [ method ]
     *
     * Returns or sets whether the dimensions of dropzone elements are
     * calculated on every dragmove or only on dragstart for the default
     * dropChecker
     *
     - newValue (boolean) #optional True to check on each move. False to check only before start
     = (boolean | interact) The current setting or interact
    \*/
    interact.dynamicDrop = function (newValue) {
        if (scope.isBool(newValue)) {
            //if (dragging && dynamicDrop !== newValue && !newValue) {
                //calcRects(dropzones);
            //}

            scope.dynamicDrop = newValue;

            return interact;
        }
        return scope.dynamicDrop;
    };

    /*\
     * interact.pointerMoveTolerance
     [ method ]
     * Returns or sets the distance the pointer must be moved before an action
     * sequence occurs. This also affects tolerance for tap events.
     *
     - newValue (number) #optional The movement from the start position must be greater than this value
     = (number | Interactable) The current setting or interact
    \*/
    interact.pointerMoveTolerance = function (newValue) {
        if (scope.isNumber(newValue)) {
            scope.pointerMoveTolerance = newValue;

            return this;
        }

        return scope.pointerMoveTolerance;
    };

    /*\
     * interact.maxInteractions
     [ method ]
     **
     * Returns or sets the maximum number of concurrent interactions allowed.
     * By default only 1 interaction is allowed at a time (for backwards
     * compatibility). To allow multiple interactions on the same Interactables
     * and elements, you need to enable it in the draggable, resizable and
     * gesturable `'max'` and `'maxPerElement'` options.
     **
     - newValue (number) #optional Any number. newValue <= 0 means no interactions.
    \*/
    interact.maxInteractions = function (newValue) {
        if (scope.isNumber(newValue)) {
            scope.maxInteractions = newValue;

            return this;
        }

        return scope.maxInteractions;
    };

    listener.listenToDocument(scope.document);

    scope.interact = interact;
    scope.Interactable = Interactable;
    scope.Interaction = Interaction;
    scope.InteractEvent = InteractEvent;

    module.exports = interact;

},{"./InteractEvent":2,"./Interactable":3,"./Interaction":4,"./defaultActionChecker":6,"./listener":8,"./scope":9,"./utils":16,"./utils/events":13,"./utils/window":21}],2:[function(require,module,exports){
'use strict';

var scope = require('./scope');
var utils = require('./utils');

function InteractEvent (interaction, event, action, phase, element, related) {
    var client,
        page,
        target      = interaction.target,
        snapStatus  = interaction.snapStatus,
        restrictStatus  = interaction.restrictStatus,
        pointers    = interaction.pointers,
        deltaSource = (target && target.options || scope.defaultOptions).deltaSource,
        sourceX     = deltaSource + 'X',
        sourceY     = deltaSource + 'Y',
        options     = target? target.options: scope.defaultOptions,
        origin      = scope.getOriginXY(target, element),
        starting    = phase === 'start',
        ending      = phase === 'end',
        coords      = starting? interaction.startCoords : interaction.curCoords;

    element = element || interaction.element;

    page   = utils.extend({}, coords.page);
    client = utils.extend({}, coords.client);

    page.x -= origin.x;
    page.y -= origin.y;

    client.x -= origin.x;
    client.y -= origin.y;

    var relativePoints = options[action].snap && options[action].snap.relativePoints ;

    if (scope.checkSnap(target, action) && !(starting && relativePoints && relativePoints.length)) {
        this.snap = {
            range  : snapStatus.range,
            locked : snapStatus.locked,
            x      : snapStatus.snappedX,
            y      : snapStatus.snappedY,
            realX  : snapStatus.realX,
            realY  : snapStatus.realY,
            dx     : snapStatus.dx,
            dy     : snapStatus.dy
        };

        if (snapStatus.locked) {
            page.x += snapStatus.dx;
            page.y += snapStatus.dy;
            client.x += snapStatus.dx;
            client.y += snapStatus.dy;
        }
    }

    if (scope.checkRestrict(target, action) && !(starting && options[action].restrict.elementRect) && restrictStatus.restricted) {
        page.x += restrictStatus.dx;
        page.y += restrictStatus.dy;
        client.x += restrictStatus.dx;
        client.y += restrictStatus.dy;

        this.restrict = {
            dx: restrictStatus.dx,
            dy: restrictStatus.dy
        };
    }

    this.pageX     = page.x;
    this.pageY     = page.y;
    this.clientX   = client.x;
    this.clientY   = client.y;

    this.x0        = interaction.startCoords.page.x - origin.x;
    this.y0        = interaction.startCoords.page.y - origin.y;
    this.clientX0  = interaction.startCoords.client.x - origin.x;
    this.clientY0  = interaction.startCoords.client.y - origin.y;
    this.ctrlKey   = event.ctrlKey;
    this.altKey    = event.altKey;
    this.shiftKey  = event.shiftKey;
    this.metaKey   = event.metaKey;
    this.button    = event.button;
    this.target    = element;
    this.t0        = interaction.downTimes[0];
    this.type      = action + (phase || '');

    this.interaction = interaction;
    this.interactable = target;

    var inertiaStatus = interaction.inertiaStatus;

    if (inertiaStatus.active) {
        this.detail = 'inertia';
    }

    if (related) {
        this.relatedTarget = related;
    }

    // end event dx, dy is difference between start and end points
    if (ending) {
        if (deltaSource === 'client') {
            this.dx = client.x - interaction.startCoords.client.x;
            this.dy = client.y - interaction.startCoords.client.y;
        }
        else {
            this.dx = page.x - interaction.startCoords.page.x;
            this.dy = page.y - interaction.startCoords.page.y;
        }
    }
    else if (starting) {
        this.dx = 0;
        this.dy = 0;
    }
    // copy properties from previousmove if starting inertia
    else if (phase === 'inertiastart') {
        this.dx = interaction.prevEvent.dx;
        this.dy = interaction.prevEvent.dy;
    }
    else {
        if (deltaSource === 'client') {
            this.dx = client.x - interaction.prevEvent.clientX;
            this.dy = client.y - interaction.prevEvent.clientY;
        }
        else {
            this.dx = page.x - interaction.prevEvent.pageX;
            this.dy = page.y - interaction.prevEvent.pageY;
        }
    }
    if (interaction.prevEvent && interaction.prevEvent.detail === 'inertia'
        && !inertiaStatus.active
        && options[action].inertia && options[action].inertia.zeroResumeDelta) {

        inertiaStatus.resumeDx += this.dx;
        inertiaStatus.resumeDy += this.dy;

        this.dx = this.dy = 0;
    }

    if (action === 'resize' && interaction.resizeAxes) {
        if (options.resize.square) {
            if (interaction.resizeAxes === 'y') {
                this.dx = this.dy;
            }
            else {
                this.dy = this.dx;
            }
            this.axes = 'xy';
        }
        else {
            this.axes = interaction.resizeAxes;

            if (interaction.resizeAxes === 'x') {
                this.dy = 0;
            }
            else if (interaction.resizeAxes === 'y') {
                this.dx = 0;
            }
        }
    }
    else if (action === 'gesture') {
        this.touches = [pointers[0], pointers[1]];

        if (starting) {
            this.distance = utils.touchDistance(pointers, deltaSource);
            this.box      = utils.touchBBox(pointers);
            this.scale    = 1;
            this.ds       = 0;
            this.angle    = utils.touchAngle(pointers, undefined, deltaSource);
            this.da       = 0;
        }
        else if (ending || event instanceof InteractEvent) {
            this.distance = interaction.prevEvent.distance;
            this.box      = interaction.prevEvent.box;
            this.scale    = interaction.prevEvent.scale;
            this.ds       = this.scale - 1;
            this.angle    = interaction.prevEvent.angle;
            this.da       = this.angle - interaction.gesture.startAngle;
        }
        else {
            this.distance = utils.touchDistance(pointers, deltaSource);
            this.box      = utils.touchBBox(pointers);
            this.scale    = this.distance / interaction.gesture.startDistance;
            this.angle    = utils.touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);

            this.ds = this.scale - interaction.gesture.prevScale;
            this.da = this.angle - interaction.gesture.prevAngle;
        }
    }

    if (starting) {
        this.timeStamp = interaction.downTimes[0];
        this.dt        = 0;
        this.duration  = 0;
        this.speed     = 0;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    else if (phase === 'inertiastart') {
        this.timeStamp = interaction.prevEvent.timeStamp;
        this.dt        = interaction.prevEvent.dt;
        this.duration  = interaction.prevEvent.duration;
        this.speed     = interaction.prevEvent.speed;
        this.velocityX = interaction.prevEvent.velocityX;
        this.velocityY = interaction.prevEvent.velocityY;
    }
    else {
        this.timeStamp = new Date().getTime();
        this.dt        = this.timeStamp - interaction.prevEvent.timeStamp;
        this.duration  = this.timeStamp - interaction.downTimes[0];

        if (event instanceof InteractEvent) {
            var dx = this[sourceX] - interaction.prevEvent[sourceX],
                dy = this[sourceY] - interaction.prevEvent[sourceY],
                dt = this.dt / 1000;

            this.speed = utils.hypot(dx, dy) / dt;
            this.velocityX = dx / dt;
            this.velocityY = dy / dt;
        }
        // if normal move or end event, use previous user event coords
        else {
            // speed and velocity in pixels per second
            this.speed = interaction.pointerDelta[deltaSource].speed;
            this.velocityX = interaction.pointerDelta[deltaSource].vx;
            this.velocityY = interaction.pointerDelta[deltaSource].vy;
        }
    }

    if ((ending || phase === 'inertiastart')
        && interaction.prevEvent.speed > 600 && this.timeStamp - interaction.prevEvent.timeStamp < 150) {

        var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI,
            overlap = 22.5;

        if (angle < 0) {
            angle += 360;
        }

        var left = 135 - overlap <= angle && angle < 225 + overlap,
            up   = 225 - overlap <= angle && angle < 315 + overlap,

            right = !left && (315 - overlap <= angle || angle <  45 + overlap),
            down  = !up   &&   45 - overlap <= angle && angle < 135 + overlap;

        this.swipe = {
            up   : up,
            down : down,
            left : left,
            right: right,
            angle: angle,
            speed: interaction.prevEvent.speed,
            velocity: {
                x: interaction.prevEvent.velocityX,
                y: interaction.prevEvent.velocityY
            }
        };
    }
}

InteractEvent.prototype = {
    preventDefault: utils.blank,
    stopImmediatePropagation: function () {
        this.immediatePropagationStopped = this.propagationStopped = true;
    },
    stopPropagation: function () {
        this.propagationStopped = true;
    }
};

module.exports = InteractEvent;

},{"./scope":9,"./utils":16}],3:[function(require,module,exports){
'use strict';

var scope = require('./scope');
var listener = require('./listener');
var defaultActionChecker = require('./defaultActionChecker');
var utils = require('./utils');
var events = require('./utils/events');

/*\
 * Interactable
 [ property ]
 **
 * Object type returned by @interact
 \*/
function Interactable (element, options) {
    this._element = element;
    this._iEvents = this._iEvents || {};

    var _window;

    if (scope.trySelector(element)) {
        this.selector = element;

        var context = options && options.context;

        _window = context? scope.getWindow(context) : scope.window;

        if (context && (_window.Node
                ? context instanceof _window.Node
                : (utils.isElement(context) || context === _window.document))) {

            this._context = context;
        }
    }
    else {
        _window = scope.getWindow(element);

        if (utils.isElement(element, _window)) {

            if (scope.PointerEvent) {
                events.add(this._element, scope.pEventTypes.down, listener.listeners.pointerDown );
                events.add(this._element, scope.pEventTypes.move, listener.listeners.pointerHover);
            }
            else {
                events.add(this._element, 'mousedown' , listener.listeners.pointerDown );
                events.add(this._element, 'mousemove' , listener.listeners.pointerHover);
                events.add(this._element, 'touchstart', listener.listeners.pointerDown );
                events.add(this._element, 'touchmove' , listener.listeners.pointerHover);
            }
        }
    }

    this._doc = _window.document;

    if (!scope.contains(scope.documents, this._doc)) {
        listener.listenToDocument(this._doc);
    }

    scope.interactables.push(this);

    this.set(options);
}

Interactable.prototype = {
    setOnEvents: function (action, phases) {
        if (action === 'drop') {
            if (scope.isFunction(phases.ondrop)          ) { this.ondrop           = phases.ondrop          ; }
            if (scope.isFunction(phases.ondropactivate)  ) { this.ondropactivate   = phases.ondropactivate  ; }
            if (scope.isFunction(phases.ondropdeactivate)) { this.ondropdeactivate = phases.ondropdeactivate; }
            if (scope.isFunction(phases.ondragenter)     ) { this.ondragenter      = phases.ondragenter     ; }
            if (scope.isFunction(phases.ondragleave)     ) { this.ondragleave      = phases.ondragleave     ; }
            if (scope.isFunction(phases.ondropmove)      ) { this.ondropmove       = phases.ondropmove      ; }
        }
        else {
            action = 'on' + action;

            if (scope.isFunction(phases.onstart)       ) { this[action + 'start'         ] = phases.onstart         ; }
            if (scope.isFunction(phases.onmove)        ) { this[action + 'move'          ] = phases.onmove          ; }
            if (scope.isFunction(phases.onend)         ) { this[action + 'end'           ] = phases.onend           ; }
            if (scope.isFunction(phases.oninertiastart)) { this[action + 'inertiastart'  ] = phases.oninertiastart  ; }
        }

        return this;
    },

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
    draggable: function (options) {
        if (scope.isObject(options)) {
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

        if (scope.isBool(options)) {
            this.options.drag.enabled = options;

            return this;
        }

        return this.options.drag;
    },

    setPerAction: function (action, options) {
        // for all the default per-action options
        for (var option in options) {
            // if this option exists for this action
            if (option in scope.defaultOptions[action]) {
                // if the option in the options arg is an object value
                if (scope.isObject(options[option])) {
                    // duplicate the object
                    this.options[action][option] = utils.extend(this.options[action][option] || {}, options[option]);

                    if (scope.isObject(scope.defaultOptions.perAction[option]) && 'enabled' in scope.defaultOptions.perAction[option]) {
                        this.options[action][option].enabled = options[option].enabled === false? false : true;
                    }
                }
                else if (scope.isBool(options[option]) && scope.isObject(scope.defaultOptions.perAction[option])) {
                    this.options[action][option].enabled = options[option];
                }
                else if (options[option] !== undefined) {
                    // or if it's not undefined, do a plain assignment
                    this.options[action][option] = options[option];
                }
            }
        }
    },

    /*\
     * Interactable.dropzone
     [ method ]
     *
     * Returns or sets whether elements can be dropped onto this
     * Interactable to trigger drop events
     *
     * Dropzones can receive the following events:
     *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
     *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
     *  - `dragmove` when a draggable that has entered the dropzone is moved
     *  - `drop` when a draggable is dropped into this dropzone
     *
     *  Use the `accept` option to allow only elements that match the given CSS selector or element.
     *
     *  Use the `overlap` option to set how drops are checked for. The allowed values are:
     *   - `'pointer'`, the pointer must be over the dropzone (default)
     *   - `'center'`, the draggable element's center must be over the dropzone
     *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
     *       e.g. `0.5` for drop to happen when half of the area of the
     *       draggable is over the dropzone
     *
     - options (boolean | object | null) #optional The new value to be set.
     | interact('.drop').dropzone({
     |   accept: '.can-drop' || document.getElementById('single-drop'),
     |   overlap: 'pointer' || 'center' || zeroToOne
     | }
     = (boolean | object) The current setting or this Interactable
     \*/
    dropzone: function (options) {
        if (scope.isObject(options)) {
            this.options.drop.enabled = options.enabled === false? false: true;
            this.setOnEvents('drop', options);
            this.accept(options.accept);

            if (/^(pointer|center)$/.test(options.overlap)) {
                this.options.drop.overlap = options.overlap;
            }
            else if (scope.isNumber(options.overlap)) {
                this.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
            }

            return this;
        }

        if (scope.isBool(options)) {
            this.options.drop.enabled = options;

            return this;
        }

        return this.options.drop;
    },

    dropCheck: function (pointer, event, draggable, draggableElement, dropElement, rect) {
        var dropped = false;

        // if the dropzone has no rect (eg. display: none)
        // call the custom dropChecker or just return false
        if (!(rect = rect || this.getRect(dropElement))) {
            return (this.options.dropChecker
                ? this.options.dropChecker(pointer, event, dropped, this, dropElement, draggable, draggableElement)
                : false);
        }

        var dropOverlap = this.options.drop.overlap;

        if (dropOverlap === 'pointer') {
            var page = utils.getPageXY(pointer),
                origin = scope.getOriginXY(draggable, draggableElement),
                horizontal,
                vertical;

            page.x += origin.x;
            page.y += origin.y;

            horizontal = (page.x > rect.left) && (page.x < rect.right);
            vertical   = (page.y > rect.top ) && (page.y < rect.bottom);

            dropped = horizontal && vertical;
        }

        var dragRect = draggable.getRect(draggableElement);

        if (dropOverlap === 'center') {
            var cx = dragRect.left + dragRect.width  / 2,
                cy = dragRect.top  + dragRect.height / 2;

            dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
        }

        if (scope.isNumber(dropOverlap)) {
            var overlapArea  = (Math.max(0, Math.min(rect.right , dragRect.right ) - Math.max(rect.left, dragRect.left))
                * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top , dragRect.top ))),
                overlapRatio = overlapArea / (dragRect.width * dragRect.height);

            dropped = overlapRatio >= dropOverlap;
        }

        if (this.options.dropChecker) {
            dropped = this.options.dropChecker(pointer, dropped, this, dropElement, draggable, draggableElement);
        }

        return dropped;
    },

    /*\
     * Interactable.dropChecker
     [ method ]
     *
     * Gets or sets the function used to check if a dragged element is
     * over this Interactable.
     *
     - checker (function) #optional The function that will be called when checking for a drop
     = (Function | Interactable) The checker function or this Interactable
     *
     * The checker function takes the following arguments:
     *
     - pointer (Touch | PointerEvent | MouseEvent) The pointer/event that ends a drag
     - event (TouchEvent | PointerEvent | MouseEvent) The event related to the pointer
     - dropped (boolean) The value from the default drop check
     - dropzone (Interactable) The dropzone interactable
     - dropElement (Element) The dropzone element
     - draggable (Interactable) The Interactable being dragged
     - draggableElement (Element) The actual element that's being dragged
     *
     > Usage:
     | interact(target)
     | .dropChecker(function(pointer,           // Touch/PointerEvent/MouseEvent
     |                       event,             // TouchEvent/PointerEvent/MouseEvent
     |                       dropped,           // result of the default checker
     |                       dropzone,          // dropzone Interactable
     |                       dropElement,       // dropzone elemnt
     |                       draggable,         // draggable Interactable
     |                       draggableElement) {// draggable element
     |
     |   return dropped && event.target.hasAttribute('allow-drop');
     | }
     \*/
    dropChecker: function (checker) {
        if (scope.isFunction(checker)) {
            this.options.dropChecker = checker;

            return this;
        }
        if (checker === null) {
            delete this.options.getRect;

            return this;
        }

        return this.options.dropChecker;
    },

    /*\
     * Interactable.accept
     [ method ]
     *
     * Deprecated. add an `accept` property to the options object passed to
     * @Interactable.dropzone instead.
     *
     * Gets or sets the Element or CSS selector match that this
     * Interactable accepts if it is a dropzone.
     *
     - newValue (Element | string | null) #optional
     * If it is an Element, then only that element can be dropped into this dropzone.
     * If it is a string, the element being dragged must match it as a selector.
     * If it is null, the accept options is cleared - it accepts any element.
     *
     = (string | Element | null | Interactable) The current accept option if given `undefined` or this Interactable
     \*/
    accept: function (newValue) {
        if (utils.isElement(newValue)) {
            this.options.drop.accept = newValue;

            return this;
        }

        // test if it is a valid CSS selector
        if (scope.trySelector(newValue)) {
            this.options.drop.accept = newValue;

            return this;
        }

        if (newValue === null) {
            delete this.options.drop.accept;

            return this;
        }

        return this.options.drop.accept;
    },

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
    resizable: function (options) {
        if (scope.isObject(options)) {
            this.options.resize.enabled = options.enabled === false? false: true;
            this.setPerAction('resize', options);
            this.setOnEvents('resize', options);

            if (/^x$|^y$|^xy$/.test(options.axis)) {
                this.options.resize.axis = options.axis;
            }
            else if (options.axis === null) {
                this.options.resize.axis = scope.defaultOptions.resize.axis;
            }

            if (scope.isBool(options.square)) {
                this.options.resize.square = options.square;
            }

            return this;
        }
        if (scope.isBool(options)) {
            this.options.resize.enabled = options;

            return this;
        }
        return this.options.resize;
    },

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
    squareResize: function (newValue) {
        if (scope.isBool(newValue)) {
            this.options.resize.square = newValue;

            return this;
        }

        if (newValue === null) {
            delete this.options.resize.square;

            return this;
        }

        return this.options.resize.square;
    },

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
    gesturable: function (options) {
        if (scope.isObject(options)) {
            this.options.gesture.enabled = options.enabled === false? false: true;
            this.setPerAction('gesture', options);
            this.setOnEvents('gesture', options);

            return this;
        }

        if (scope.isBool(options)) {
            this.options.gesture.enabled = options;

            return this;
        }

        return this.options.gesture;
    },

    /*\
     * Interactable.autoScroll
     [ method ]
     **
     * Deprecated. Add an `autoscroll` property to the options object
     * passed to @Interactable.draggable or @Interactable.resizable instead.
     *
     * Returns or sets whether dragging and resizing near the edges of the
     * window/container trigger autoScroll for this Interactable
     *
     = (object) Object with autoScroll properties
     *
     * or
     *
     - options (object | boolean) #optional
     * options can be:
     * - an object with margin, distance and interval properties,
     * - true or false to enable or disable autoScroll or
     = (Interactable) this Interactable
     \*/
    autoScroll: function (options) {
        if (scope.isObject(options)) {
            options = utils.extend({ actions: ['drag', 'resize']}, options);
        }
        else if (scope.isBool(options)) {
            options = { actions: ['drag', 'resize'], enabled: options };
        }

        return this.setOptions('autoScroll', options);
    },

    /*\
     * Interactable.snap
     [ method ]
     **
     * Deprecated. Add a `snap` property to the options object passed
     * to @Interactable.draggable or @Interactable.resizable instead.
     *
     * Returns or sets if and how action coordinates are snapped. By
     * default, snapping is relative to the pointer coordinates. You can
     * change this by setting the
     * [`elementOrigin`](https://github.com/taye/interact.js/pull/72).
     **
     = (boolean | object) `false` if snap is disabled; object with snap properties if snap is enabled
     **
     * or
     **
     - options (object | boolean | null) #optional
     = (Interactable) this Interactable
     > Usage
     | interact(document.querySelector('#thing')).snap({
     |     targets: [
     |         // snap to this specific point
     |         {
     |             x: 100,
     |             y: 100,
     |             range: 25
     |         },
     |         // give this function the x and y page coords and snap to the object returned
     |         function (x, y) {
     |             return {
     |                 x: x,
     |                 y: (75 + 50 * Math.sin(x * 0.04)),
     |                 range: 40
     |             };
     |         },
     |         // create a function that snaps to a grid
     |         interact.createSnapGrid({
     |             x: 50,
     |             y: 50,
     |             range: 10,              // optional
     |             offset: { x: 5, y: 10 } // optional
     |         })
     |     ],
     |     // do not snap during normal movement.
     |     // Instead, trigger only one snapped move event
     |     // immediately before the end event.
     |     endOnly: true,
     |
     |     relativePoints: [
     |         { x: 0, y: 0 },  // snap relative to the top left of the element
     |         { x: 1, y: 1 },  // and also to the bottom right
     |     ],
     |
     |     // offset the snap target coordinates
     |     // can be an object with x/y or 'startCoords'
     |     offset: { x: 50, y: 50 }
     |   }
     | });
     \*/
    snap: function (options) {
        var ret = this.setOptions('snap', options);

        if (ret === this) { return this; }

        return ret.drag;
    },

    createSnapGrid: function (grid) {
        return function (x, y) {
            var offsetX = 0,
                offsetY = 0;

            if (scope.isObject(grid.offset)) {
                offsetX = grid.offset.x;
                offsetY = grid.offset.y;
            }

            var gridx = Math.round((x - offsetX) / grid.x),
                gridy = Math.round((y - offsetY) / grid.y),

                newX = gridx * grid.x + offsetX,
                newY = gridy * grid.y + offsetY;

            return {
                x: newX,
                y: newY,
                range: grid.range
            };
        };
    },

    setOptions: function (option, options) {
        var self = this;
        var actions = options && scope.isArray(options.actions)
            ? options.actions
            : ['drag'];

        var i;

        if (scope.isObject(options) || scope.isBool(options)) {
            for (i = 0; i < actions.length; i++) {
                var action = /resize/.test(actions[i])? 'resize' : actions[i];

                if (!scope.isObject(this.options[action])) { continue; }

                var thisOption = this.options[action][option];

                if (scope.isObject(options)) {
                    utils.extend(thisOption, options);
                    thisOption.enabled = options.enabled === false? false: true;

                    if (option === 'snap') {
                        if (thisOption.mode === 'grid') {
                            thisOption.targets = [
                                self.createSnapGrid(utils.extend({
                                    offset: thisOption.gridOffset || { x: 0, y: 0 }
                                }, thisOption.grid || {}))
                            ];
                        }
                        else if (thisOption.mode === 'anchor') {
                            thisOption.targets = thisOption.anchors;
                        }
                        else if (thisOption.mode === 'path') {
                            thisOption.targets = thisOption.paths;
                        }

                        if ('elementOrigin' in options) {
                            thisOption.relativePoints = [options.elementOrigin];
                        }
                    }
                }
                else if (scope.isBool(options)) {
                    thisOption.enabled = options;
                }
            }

            return this;
        }

        var ret = {},
            allActions = ['drag', 'resize', 'gesture'];

        for (i = 0; i < allActions.length; i++) {
            if (option in scope.defaultOptions[allActions[i]]) {
                ret[allActions[i]] = this.options[allActions[i]][option];
            }
        }

        return ret;
    },


    /*\
     * Interactable.inertia
     [ method ]
     **
     * Deprecated. Add an `inertia` property to the options object passed
     * to @Interactable.draggable or @Interactable.resizable instead.
     *
     * Returns or sets if and how events continue to run after the pointer is released
     **
     = (boolean | object) `false` if inertia is disabled; `object` with inertia properties if inertia is enabled
     **
     * or
     **
     - options (object | boolean | null) #optional
     = (Interactable) this Interactable
     > Usage
     | // enable and use default settings
     | interact(element).inertia(true);
     |
     | // enable and use custom settings
     | interact(element).inertia({
     |     // value greater than 0
     |     // high values slow the object down more quickly
     |     resistance     : 16,
     |
     |     // the minimum launch speed (pixels per second) that results in inertia start
     |     minSpeed       : 200,
     |
     |     // inertia will stop when the object slows down to this speed
     |     endSpeed       : 20,
     |
     |     // boolean; should actions be resumed when the pointer goes down during inertia
     |     allowResume    : true,
     |
     |     // boolean; should the jump when resuming from inertia be ignored in event.dx/dy
     |     zeroResumeDelta: false,
     |
     |     // if snap/restrict are set to be endOnly and inertia is enabled, releasing
     |     // the pointer without triggering inertia will animate from the release
     |     // point to the snaped/restricted point in the given amount of time (ms)
     |     smoothEndDuration: 300,
     |
     |     // an array of action types that can have inertia (no gesture)
     |     actions        : ['drag', 'resize']
     | });
     |
     | // reset custom settings and use all defaults
     | interact(element).inertia(null);
     \*/
    inertia: function (options) {
        var ret = this.setOptions('inertia', options);

        if (ret === this) { return this; }

        return ret.drag;
    },

    getAction: function (pointer, event, interaction, element) {
        var action = this.defaultActionChecker(pointer, interaction, element);

        if (this.options.actionChecker) {
            return this.options.actionChecker(pointer, event, action, this, element, interaction);
        }

        return action;
    },

    defaultActionChecker: defaultActionChecker,

    /*\
     * Interactable.actionChecker
     [ method ]
     *
     * Gets or sets the function used to check action to be performed on
     * pointerDown
     *
     - checker (function | null) #optional A function which takes a pointer event, defaultAction string, interactable, element and interaction as parameters and returns an object with name property 'drag' 'resize' or 'gesture' and optionally an `edges` object with boolean 'top', 'left', 'bottom' and right props.
     = (Function | Interactable) The checker function or this Interactable
     *
     | interact('.resize-drag')
     |   .resizable(true)
     |   .draggable(true)
     |   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
     |
     |   if (interact.matchesSelector(event.target, '.drag-handle') {
     |     // force drag with handle target
     |     action.name = drag;
     |   }
     |   else {
     |     // resize from the top and right edges
     |     action.name  = 'resize';
     |     action.edges = { top: true, right: true };
     |   }
     |
     |   return action;
     | });
     \*/
    actionChecker: function (checker) {
        if (scope.isFunction(checker)) {
            this.options.actionChecker = checker;

            return this;
        }

        if (checker === null) {
            delete this.options.actionChecker;

            return this;
        }

        return this.options.actionChecker;
    },

    /*\
     * Interactable.getRect
     [ method ]
     *
     * The default function to get an Interactables bounding rect. Can be
     * overridden using @Interactable.rectChecker.
     *
     - element (Element) #optional The element to measure.
     = (object) The object's bounding rectangle.
     o {
     o     top   : 0,
     o     left  : 0,
     o     bottom: 0,
     o     right : 0,
     o     width : 0,
     o     height: 0
     o }
     \*/
    getRect: function rectCheck (element) {
        element = element || this._element;

        if (this.selector && !(utils.isElement(element))) {
            element = this._context.querySelector(this.selector);
        }

        return scope.getElementRect(element);
    },

    /*\
     * Interactable.rectChecker
     [ method ]
     *
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     - checker (function) #optional A function which returns this Interactable's bounding rectangle. See @Interactable.getRect
     = (function | object) The checker function or this Interactable
     \*/
    rectChecker: function (checker) {
        if (scope.isFunction(checker)) {
            this.getRect = checker;

            return this;
        }

        if (checker === null) {
            delete this.options.getRect;

            return this;
        }

        return this.getRect;
    },

    /*\
     * Interactable.styleCursor
     [ method ]
     *
     * Returns or sets whether the action that would be performed when the
     * mouse on the element are checked on `mousemove` so that the cursor
     * may be styled appropriately
     *
     - newValue (boolean) #optional
     = (boolean | Interactable) The current setting or this Interactable
     \*/
    styleCursor: function (newValue) {
        if (scope.isBool(newValue)) {
            this.options.styleCursor = newValue;

            return this;
        }

        if (newValue === null) {
            delete this.options.styleCursor;

            return this;
        }

        return this.options.styleCursor;
    },

    /*\
     * Interactable.preventDefault
     [ method ]
     *
     * Returns or sets whether to prevent the browser's default behaviour
     * in response to pointer events. Can be set to:
     *  - `'always'` to always prevent
     *  - `'never'` to never prevent
     *  - `'auto'` to let interact.js try to determine what would be best
     *
     - newValue (string) #optional `true`, `false` or `'auto'`
     = (string | Interactable) The current setting or this Interactable
     \*/
    preventDefault: function (newValue) {
        if (/^(always|never|auto)$/.test(newValue)) {
            this.options.preventDefault = newValue;
            return this;
        }

        if (scope.isBool(newValue)) {
            this.options.preventDefault = newValue? 'always' : 'never';
            return this;
        }

        return this.options.preventDefault;
    },

    /*\
     * Interactable.origin
     [ method ]
     *
     * Gets or sets the origin of the Interactable's element.  The x and y
     * of the origin will be subtracted from action event coordinates.
     *
     - origin (object | string) #optional An object eg. { x: 0, y: 0 } or string 'parent', 'self' or any CSS selector
     * OR
     - origin (Element) #optional An HTML or SVG Element whose rect will be used
     **
     = (object) The current origin or this Interactable
     \*/
    origin: function (newValue) {
        if (scope.trySelector(newValue)) {
            this.options.origin = newValue;
            return this;
        }
        else if (scope.isObject(newValue)) {
            this.options.origin = newValue;
            return this;
        }

        return this.options.origin;
    },

    /*\
     * Interactable.deltaSource
     [ method ]
     *
     * Returns or sets the mouse coordinate types used to calculate the
     * movement of the pointer.
     *
     - newValue (string) #optional Use 'client' if you will be scrolling while interacting; Use 'page' if you want autoScroll to work
     = (string | object) The current deltaSource or this Interactable
     \*/
    deltaSource: function (newValue) {
        if (newValue === 'page' || newValue === 'client') {
            this.options.deltaSource = newValue;

            return this;
        }

        return this.options.deltaSource;
    },

    /*\
     * Interactable.restrict
     [ method ]
     **
     * Deprecated. Add a `restrict` property to the options object passed to
     * @Interactable.draggable, @Interactable.resizable or @Interactable.gesturable instead.
     *
     * Returns or sets the rectangles within which actions on this
     * interactable (after snap calculations) are restricted. By default,
     * restricting is relative to the pointer coordinates. You can change
     * this by setting the
     * [`elementRect`](https://github.com/taye/interact.js/pull/72).
     **
     - options (object) #optional an object with keys drag, resize, and/or gesture whose values are rects, Elements, CSS selectors, or 'parent' or 'self'
     = (object) The current restrictions object or this Interactable
     **
     | interact(element).restrict({
     |     // the rect will be `interact.getElementRect(element.parentNode)`
     |     drag: element.parentNode,
     |
     |     // x and y are relative to the the interactable's origin
     |     resize: { x: 100, y: 100, width: 200, height: 200 }
     | })
     |
     | interact('.draggable').restrict({
     |     // the rect will be the selected element's parent
     |     drag: 'parent',
     |
     |     // do not restrict during normal movement.
     |     // Instead, trigger only one restricted move event
     |     // immediately before the end event.
     |     endOnly: true,
     |
     |     // https://github.com/taye/interact.js/pull/72#issue-41813493
     |     elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
     | });
     \*/
    restrict: function (options) {
        if (!scope.isObject(options)) {
            return this.setOptions('restrict', options);
        }

        var actions = ['drag', 'resize', 'gesture'],
            ret;

        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];

            if (action in options) {
                var perAction = utils.extend({
                    actions: [action],
                    restriction: options[action]
                }, options);

                ret = this.setOptions('restrict', perAction);
            }
        }

        return ret;
    },

    /*\
     * Interactable.context
     [ method ]
     *
     * Gets the selector context Node of the Interactable. The default is `window.document`.
     *
     = (Node) The context Node of this Interactable
     **
     \*/
    context: function () {
        return this._context;
    },

    _context: scope.document,

    /*\
     * Interactable.ignoreFrom
     [ method ]
     *
     * If the target of the `mousedown`, `pointerdown` or `touchstart`
     * event or any of it's parents match the given CSS selector or
     * Element, no drag/resize/gesture is started.
     *
     - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to not ignore any elements
     = (string | Element | object) The current ignoreFrom value or this Interactable
     **
     | interact(element, { ignoreFrom: document.getElementById('no-action') });
     | // or
     | interact(element).ignoreFrom('input, textarea, a');
     \*/
    ignoreFrom: function (newValue) {
        if (scope.trySelector(newValue)) {            // CSS selector to match event.target
            this.options.ignoreFrom = newValue;
            return this;
        }

        if (utils.isElement(newValue)) {              // specific element
            this.options.ignoreFrom = newValue;
            return this;
        }

        return this.options.ignoreFrom;
    },

    /*\
     * Interactable.allowFrom
     [ method ]
     *
     * A drag/resize/gesture is started only If the target of the
     * `mousedown`, `pointerdown` or `touchstart` event or any of it's
     * parents match the given CSS selector or Element.
     *
     - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to allow from any element
     = (string | Element | object) The current allowFrom value or this Interactable
     **
     | interact(element, { allowFrom: document.getElementById('drag-handle') });
     | // or
     | interact(element).allowFrom('.handle');
     \*/
    allowFrom: function (newValue) {
        if (scope.trySelector(newValue)) {            // CSS selector to match event.target
            this.options.allowFrom = newValue;
            return this;
        }

        if (utils.isElement(newValue)) {              // specific element
            this.options.allowFrom = newValue;
            return this;
        }

        return this.options.allowFrom;
    },

    /*\
     * Interactable.element
     [ method ]
     *
     * If this is not a selector Interactable, it returns the element this
     * interactable represents
     *
     = (Element) HTML / SVG Element
     \*/
    element: function () {
        return this._element;
    },

    /*\
     * Interactable.fire
     [ method ]
     *
     * Calls listeners for the given InteractEvent type bound globally
     * and directly to this Interactable
     *
     - iEvent (InteractEvent) The InteractEvent object to be fired on this Interactable
     = (Interactable) this Interactable
     \*/
    fire: function (iEvent) {
        if (!(iEvent && iEvent.type) || !scope.contains(scope.eventTypes, iEvent.type)) {
            return this;
        }

        var listeners,
            i,
            len,
            onEvent = 'on' + iEvent.type,
            funcName = '';

        // Interactable#on() listeners
        if (iEvent.type in this._iEvents) {
            listeners = this._iEvents[iEvent.type];

            for (i = 0, len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
                funcName = listeners[i].name;
                listeners[i](iEvent);
            }
        }

        // interactable.onevent listener
        if (scope.isFunction(this[onEvent])) {
            funcName = this[onEvent].name;
            this[onEvent](iEvent);
        }

        // interact.on() listeners
        if (iEvent.type in scope.globalEvents && (listeners = scope.globalEvents[iEvent.type]))  {

            for (i = 0, len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
                funcName = listeners[i].name;
                listeners[i](iEvent);
            }
        }

        return this;
    },

    /*\
     * Interactable.on
     [ method ]
     *
     * Binds a listener for an InteractEvent or DOM event.
     *
     - eventType  (string | array | object) The types of events to listen for
     - listener   (function) The function to be called on the given event(s)
     - useCapture (boolean) #optional useCapture flag for addEventListener
     = (object) This Interactable
     \*/
    on: function (eventType, listener, useCapture) {
        var i;

        if (scope.isString(eventType) && eventType.search(' ') !== -1) {
            eventType = eventType.trim().split(/ +/);
        }

        if (scope.isArray(eventType)) {
            for (i = 0; i < eventType.length; i++) {
                this.on(eventType[i], listener, useCapture);
            }

            return this;
        }

        if (scope.isObject(eventType)) {
            for (var prop in eventType) {
                this.on(prop, eventType[prop], listener);
            }

            return this;
        }

        if (eventType === 'wheel') {
            eventType = scope.wheelEvent;
        }

        // convert to boolean
        useCapture = useCapture? true: false;

        if (scope.contains(scope.eventTypes, eventType)) {
            // if this type of event was never bound to this Interactable
            if (!(eventType in this._iEvents)) {
                this._iEvents[eventType] = [listener];
            }
            else {
                this._iEvents[eventType].push(listener);
            }
        }
        // delegated event for selector
        else if (this.selector) {
            if (!scope.delegatedEvents[eventType]) {
                scope.delegatedEvents[eventType] = {
                    selectors: [],
                    contexts : [],
                    listeners: []
                };

                // add delegate listener functions
                for (i = 0; i < scope.documents.length; i++) {
                    events.add(scope.documents[i], eventType, listener.delegateListener);
                    events.add(scope.documents[i], eventType, listener.delegateUseCapture, true);
                }
            }

            var delegated = scope.delegatedEvents[eventType],
                index;

            for (index = delegated.selectors.length - 1; index >= 0; index--) {
                if (delegated.selectors[index] === this.selector
                    && delegated.contexts[index] === this._context) {
                    break;
                }
            }

            if (index === -1) {
                index = delegated.selectors.length;

                delegated.selectors.push(this.selector);
                delegated.contexts .push(this._context);
                delegated.listeners.push([]);
            }

            // keep listener and useCapture flag
            delegated.listeners[index].push([listener, useCapture]);
        }
        else {
            events.add(this._element, eventType, listener, useCapture);
        }

        return this;
    },

    /*\
     * Interactable.off
     [ method ]
     *
     * Removes an InteractEvent or DOM event listener
     *
     - eventType  (string | array | object) The types of events that were listened for
     - listener   (function) The listener function to be removed
     - useCapture (boolean) #optional useCapture flag for removeEventListener
     = (object) This Interactable
     \*/
    off: function (eventType, listener, useCapture) {
        var i;

        if (scope.isString(eventType) && eventType.search(' ') !== -1) {
            eventType = eventType.trim().split(/ +/);
        }

        if (scope.isArray(eventType)) {
            for (i = 0; i < eventType.length; i++) {
                this.off(eventType[i], listener, useCapture);
            }

            return this;
        }

        if (scope.isObject(eventType)) {
            for (var prop in eventType) {
                this.off(prop, eventType[prop], listener);
            }

            return this;
        }

        var eventList,
            index = -1;

        // convert to boolean
        useCapture = useCapture? true: false;

        if (eventType === 'wheel') {
            eventType = scope.wheelEvent;
        }

        // if it is an action event type
        if (scope.contains(scope.eventTypes, eventType)) {
            eventList = this._iEvents[eventType];

            if (eventList && (index = scope.indexOf(eventList, listener)) !== -1) {
                this._iEvents[eventType].splice(index, 1);
            }
        }
        // delegated event
        else if (this.selector) {
            var delegated = scope.delegatedEvents[eventType],
                matchFound = false;

            if (!delegated) { return this; }

            // count from last index of delegated to 0
            for (index = delegated.selectors.length - 1; index >= 0; index--) {
                // look for matching selector and context Node
                if (delegated.selectors[index] === this.selector
                    && delegated.contexts[index] === this._context) {

                    var listeners = delegated.listeners[index];

                    // each item of the listeners array is an array: [function, useCaptureFlag]
                    for (i = listeners.length - 1; i >= 0; i--) {
                        var fn = listeners[i][0],
                            useCap = listeners[i][1];

                        // check if the listener functions and useCapture flags match
                        if (fn === listener && useCap === useCapture) {
                            // remove the listener from the array of listeners
                            listeners.splice(i, 1);

                            // if all listeners for this interactable have been removed
                            // remove the interactable from the delegated arrays
                            if (!listeners.length) {
                                delegated.selectors.splice(index, 1);
                                delegated.contexts .splice(index, 1);
                                delegated.listeners.splice(index, 1);

                                // remove delegate function from context
                                events.remove(this._context, eventType, listener.delegateListener);
                                events.remove(this._context, eventType, listener.delegateUseCapture, true);

                                // remove the arrays if they are empty
                                if (!delegated.selectors.length) {
                                    scope.delegatedEvents[eventType] = null;
                                }
                            }

                            // only remove one listener
                            matchFound = true;
                            break;
                        }
                    }

                    if (matchFound) { break; }
                }
            }
        }
        // remove listener from this Interatable's element
        else {
            events.remove(this._element, eventType, listener, useCapture);
        }

        return this;
    },

    /*\
     * Interactable.set
     [ method ]
     *
     * Reset the options of this Interactable
     - options (object) The new settings to apply
     = (object) This Interactablw
     \*/
    set: function (options) {
        if (!scope.isObject(options)) {
            options = {};
        }

        this.options = utils.extend({}, scope.defaultOptions.base);

        var i,
            len,
            actions = ['drag', 'drop', 'resize', 'gesture'],
            methods = ['draggable', 'dropzone', 'resizable', 'gesturable'],
            perActions = utils.extend(utils.extend({}, scope.defaultOptions.perAction), options[action] || {});

        for (i = 0; i < actions.length; i++) {
            var action = actions[i];

            this.options[action] = utils.extend({}, scope.defaultOptions[action]);

            this.setPerAction(action, perActions);

            this[methods[i]](options[action]);
        }

        var settings = [
            'accept', 'actionChecker', 'allowFrom', 'deltaSource',
            'dropChecker', 'ignoreFrom', 'origin', 'preventDefault',
            'rectChecker'
        ];

        for (i = 0, len = settings.length; i < len; i++) {
            var setting = settings[i];

            this.options[setting] = scope.defaultOptions.base[setting];

            if (setting in options) {
                this[setting](options[setting]);
            }
        }

        return this;
    },

    /*\
     * Interactable.unset
     [ method ]
     *
     * Remove this interactable from the list of interactables and remove
     * it's drag, drop, resize and gesture capabilities
     *
     \*/
    unset: function () {
        events.remove(this._element, 'all');

        if (!scope.isString(this.selector)) {
            events.remove(this, 'all');
            if (this.options.styleCursor) {
                this._element.style.cursor = '';
            }
        }
        else {
            // remove delegated events
            for (var type in scope.delegatedEvents) {
                var delegated = scope.delegatedEvents[type];

                for (var i = 0; i < delegated.selectors.length; i++) {
                    if (delegated.selectors[i] === this.selector
                        && delegated.contexts[i] === this._context) {

                        delegated.selectors.splice(i, 1);
                        delegated.contexts .splice(i, 1);
                        delegated.listeners.splice(i, 1);

                        // remove the arrays if they are empty
                        if (!delegated.selectors.length) {
                            scope.delegatedEvents[type] = null;
                        }
                    }

                    events.remove(this._context, type, listener.delegateListener);
                    events.remove(this._context, type, listener.delegateUseCapture, true);

                    break;
                }
            }
        }

        this.dropzone(false);

        scope.interactables.splice(scope.indexOf(scope.interactables, this), 1);
    }
};

Interactable.prototype.snap = utils.warnOnce(Interactable.prototype.snap,
    'Interactable#snap is deprecated. See the new documentation for snapping at http://interactjs.io/docs/snapping');
Interactable.prototype.restrict = utils.warnOnce(Interactable.prototype.restrict,
    'Interactable#restrict is deprecated. See the new documentation for resticting at http://interactjs.io/docs/restriction');
Interactable.prototype.inertia = utils.warnOnce(Interactable.prototype.inertia,
    'Interactable#inertia is deprecated. See the new documentation for inertia at http://interactjs.io/docs/inertia');
Interactable.prototype.autoScroll = utils.warnOnce(Interactable.prototype.autoScroll,
    'Interactable#autoScroll is deprecated. See the new documentation for autoScroll at http://interactjs.io/docs/#autoscroll');
Interactable.prototype.squareResize = utils.warnOnce(Interactable.prototype.squareResize,
    'Interactable#squareResize is deprecated. See http://interactjs.io/docs/#resize-square');

module.exports = Interactable;
},{"./defaultActionChecker":6,"./listener":8,"./scope":9,"./utils":16,"./utils/events":13}],4:[function(require,module,exports){
'use strict';

var scope = require('./scope');
var utils = require('./utils');
var animationFrame = utils.raf;
var InteractEvent = require('./InteractEvent');
var events = require('./utils/events');
var browser = require('./utils/browser');

function Interaction () {
    this.target          = null; // current interactable being interacted with
    this.element         = null; // the target element of the interactable
    this.dropTarget      = null; // the dropzone a drag target might be dropped into
    this.dropElement     = null; // the element at the time of checking
    this.prevDropTarget  = null; // the dropzone that was recently dragged away from
    this.prevDropElement = null; // the element at the time of checking

    this.prepared        = {     // action that's ready to be fired on next move event
        name : null,
        axis : null,
        edges: null
    };

    this.matches         = [];   // all selectors that are matched by target element
    this.matchElements   = [];   // corresponding elements

    this.inertiaStatus = {
        active       : false,
        smoothEnd    : false,

        startEvent: null,
        upCoords: {},

        xe: 0, ye: 0,
        sx: 0, sy: 0,

        t0: 0,
        vx0: 0, vys: 0,
        duration: 0,

        resumeDx: 0,
        resumeDy: 0,

        lambda_v0: 0,
        one_ve_v0: 0,
        i  : null
    };

    if (scope.isFunction(Function.prototype.bind)) {
        this.boundInertiaFrame = this.inertiaFrame.bind(this);
        this.boundSmoothEndFrame = this.smoothEndFrame.bind(this);
    }
    else {
        var that = this;

        this.boundInertiaFrame = function () { return that.inertiaFrame(); };
        this.boundSmoothEndFrame = function () { return that.smoothEndFrame(); };
    }

    this.activeDrops = {
        dropzones: [],      // the dropzones that are mentioned below
        elements : [],      // elements of dropzones that accept the target draggable
        rects    : []       // the rects of the elements mentioned above
    };

    // keep track of added pointers
    this.pointers    = [];
    this.pointerIds  = [];
    this.downTargets = [];
    this.downTimes   = [];
    this.holdTimers  = [];

    // Previous native pointer move event coordinates
    this.prevCoords = {
        page     : { x: 0, y: 0 },
        client   : { x: 0, y: 0 },
        timeStamp: 0
    };
    // current native pointer move event coordinates
    this.curCoords = {
        page     : { x: 0, y: 0 },
        client   : { x: 0, y: 0 },
        timeStamp: 0
    };

    // Starting InteractEvent pointer coordinates
    this.startCoords = {
        page     : { x: 0, y: 0 },
        client   : { x: 0, y: 0 },
        timeStamp: 0
    };

    // Change in coordinates and time of the pointer
    this.pointerDelta = {
        page     : { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
        client   : { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
        timeStamp: 0
    };

    this.downEvent   = null;    // pointerdown/mousedown/touchstart event
    this.downPointer = {};

    this._eventTarget    = null;
    this._curEventTarget = null;

    this.prevEvent = null;      // previous action event
    this.tapTime   = 0;         // time of the most recent tap event
    this.prevTap   = null;

    this.startOffset    = { left: 0, right: 0, top: 0, bottom: 0 };
    this.restrictOffset = { left: 0, right: 0, top: 0, bottom: 0 };
    this.snapOffsets    = [];

    this.gesture = {
        start: { x: 0, y: 0 },

        startDistance: 0,   // distance between two touches of touchStart
        prevDistance : 0,
        distance     : 0,

        scale: 1,           // gesture.distance / gesture.startDistance

        startAngle: 0,      // angle of line joining two touches
        prevAngle : 0       // angle of the previous gesture event
    };

    this.snapStatus = {
        x       : 0, y       : 0,
        dx      : 0, dy      : 0,
        realX   : 0, realY   : 0,
        snappedX: 0, snappedY: 0,
        targets : [],
        locked  : false,
        changed : false
    };

    this.restrictStatus = {
        dx         : 0, dy         : 0,
        restrictedX: 0, restrictedY: 0,
        snap       : null,
        restricted : false,
        changed    : false
    };

    this.restrictStatus.snap = this.snapStatus;

    this.pointerIsDown   = false;
    this.pointerWasMoved = false;
    this.gesturing       = false;
    this.dragging        = false;
    this.resizing        = false;
    this.resizeAxes      = 'xy';

    this.mouse = false;

    scope.interactions.push(this);
}

// Check if action is enabled globally and the current target supports it
// If so, return the validated action. Otherwise, return null
function validateAction (action, interactable) {
    if (!scope.isObject(action)) { return null; }

    var actionName = action.name,
        options = interactable.options;

    if ((  (actionName  === 'resize'   && options.resize.enabled )
        || (actionName      === 'drag'     && options.drag.enabled  )
        || (actionName      === 'gesture'  && options.gesture.enabled))
        && scope.actionIsEnabled[actionName]) {

        if (actionName === 'resize' || actionName === 'resizeyx') {
            actionName = 'resizexy';
        }

        return action;
    }
    return null;
}

function getActionCursor (action) {
    var cursor = '';

    if (action.name === 'drag') {
        cursor =  scope.actionCursors.drag;
    }
    if (action.name === 'resize') {
        if (action.axis) {
            cursor =  scope.actionCursors[action.name + action.axis];
        }
        else if (action.edges) {
            var cursorKey = 'resize',
                edgeNames = ['top', 'bottom', 'left', 'right'];

            for (var i = 0; i < 4; i++) {
                if (action.edges[edgeNames[i]]) {
                    cursorKey += edgeNames[i];
                }
            }

            cursor = scope.actionCursors[cursorKey];
        }
    }

    return cursor;
}

function preventOriginalDefault () {
    this.originalEvent.preventDefault();
}

Interaction.prototype = {
    getPageXY  : function (pointer, xy) { return   utils.getPageXY(pointer, xy, this); },
    getClientXY: function (pointer, xy) { return utils.getClientXY(pointer, xy, this); },
    setEventXY : function (target, ptr) { return  utils.setEventXY(target, ptr, this); },

    pointerOver: function (pointer, event, eventTarget) {
        if (this.prepared.name || !this.mouse) { return; }

        var curMatches = [],
            curMatchElements = [],
            prevTargetElement = this.element;

        this.addPointer(pointer);

        if (this.target
            && (scope.testIgnore(this.target, this.element, eventTarget)
            || !scope.testAllow(this.target, this.element, eventTarget))) {
            // if the eventTarget should be ignored or shouldn't be allowed
            // clear the previous target
            this.target = null;
            this.element = null;
            this.matches = [];
            this.matchElements = [];
        }

        var elementInteractable = scope.interactables.get(eventTarget),
            elementAction = (elementInteractable
            && !scope.testIgnore(elementInteractable, eventTarget, eventTarget)
            && scope.testAllow(elementInteractable, eventTarget, eventTarget)
            && validateAction(
                elementInteractable.getAction(pointer, event, this, eventTarget),
                elementInteractable));

        if (elementAction && !scope.withinInteractionLimit(elementInteractable, eventTarget, elementAction)) {
            elementAction = null;
        }

        function pushCurMatches (interactable, selector) {
            if (interactable
                && scope.inContext(interactable, eventTarget)
                && !scope.testIgnore(interactable, eventTarget, eventTarget)
                && scope.testAllow(interactable, eventTarget, eventTarget)
                && scope.matchesSelector(eventTarget, selector)) {

                curMatches.push(interactable);
                curMatchElements.push(eventTarget);
            }
        }

        if (elementAction) {
            this.target = elementInteractable;
            this.element = eventTarget;
            this.matches = [];
            this.matchElements = [];
        }
        else {
            scope.interactables.forEachSelector(pushCurMatches);

            if (this.validateSelector(pointer, event, curMatches, curMatchElements)) {
                this.matches = curMatches;
                this.matchElements = curMatchElements;

                this.pointerHover(pointer, event, this.matches, this.matchElements);
                events.add(eventTarget,
                    scope.PointerEvent? scope.pEventTypes.move : 'mousemove',
                    scope.listeners.pointerHover);
            }
            else if (this.target) {
                if (scope.nodeContains(prevTargetElement, eventTarget)) {
                    this.pointerHover(pointer, event, this.matches, this.matchElements);
                    events.add(this.element,
                        scope.PointerEvent? scope.pEventTypes.move : 'mousemove',
                        scope.listeners.pointerHover);
                }
                else {
                    this.target = null;
                    this.element = null;
                    this.matches = [];
                    this.matchElements = [];
                }
            }
        }
    },

    // Check what action would be performed on pointerMove target if a mouse
    // button were pressed and change the cursor accordingly
    pointerHover: function (pointer, event, eventTarget, curEventTarget, matches, matchElements) {
        var target = this.target;

        if (!this.prepared.name && this.mouse) {

            var action;

            // update pointer coords for defaultActionChecker to use
            this.setEventXY(this.curCoords, pointer);

            if (matches) {
                action = this.validateSelector(pointer, event, matches, matchElements);
            }
            else if (target) {
                action = validateAction(target.getAction(this.pointers[0], event, this, this.element), this.target);
            }

            if (target && target.options.styleCursor) {
                if (action) {
                    target._doc.documentElement.style.cursor = getActionCursor(action);
                }
                else {
                    target._doc.documentElement.style.cursor = '';
                }
            }
        }
        else if (this.prepared.name) {
            this.checkAndPreventDefault(event, target, this.element);
        }
    },

    pointerOut: function (pointer, event, eventTarget) {
        if (this.prepared.name) { return; }

        // Remove temporary event listeners for selector Interactables
        if (!scope.interactables.get(eventTarget)) {
            events.remove(eventTarget,
                scope.PointerEvent? scope.pEventTypes.move : 'mousemove',
                scope.listeners.pointerHover);
        }

        if (this.target && this.target.options.styleCursor && !this.interacting()) {
            this.target._doc.documentElement.style.cursor = '';
        }
    },

    selectorDown: function (pointer, event, eventTarget, curEventTarget) {
        var that = this,
        // copy event to be used in timeout for IE8
            eventCopy = events.useAttachEvent? utils.extend({}, event) : event,
            element = eventTarget,
            pointerIndex = this.addPointer(pointer),
            action;

        this.holdTimers[pointerIndex] = setTimeout(function () {
            that.pointerHold(events.useAttachEvent? eventCopy : pointer, eventCopy, eventTarget, curEventTarget);
        }, scope.defaultOptions._holdDuration);

        this.pointerIsDown = true;

        // Check if the down event hits the current inertia target
        if (this.inertiaStatus.active && this.target.selector) {
            // climb up the DOM tree from the event target
            while (utils.isElement(element)) {

                // if this element is the current inertia target element
                if (element === this.element
                        // and the prospective action is the same as the ongoing one
                    && validateAction(this.target.getAction(pointer, event, this, this.element), this.target).name === this.prepared.name) {

                    // stop inertia so that the next move will be a normal one
                    animationFrame.cancel(this.inertiaStatus.i);
                    this.inertiaStatus.active = false;

                    this.collectEventTargets(pointer, event, eventTarget, 'down');
                    return;
                }
                element = scope.parentElement(element);
            }
        }

        // do nothing if interacting
        if (this.interacting()) {
            this.collectEventTargets(pointer, event, eventTarget, 'down');
            return;
        }

        function pushMatches (interactable, selector, context) {
            var elements = scope.ie8MatchesSelector
                ? context.querySelectorAll(selector)
                : undefined;

            if (scope.inContext(interactable, element)
                && !scope.testIgnore(interactable, element, eventTarget)
                && scope.testAllow(interactable, element, eventTarget)
                && scope.matchesSelector(element, selector, elements)) {

                that.matches.push(interactable);
                that.matchElements.push(element);
            }
        }

        // update pointer coords for defaultActionChecker to use
        this.setEventXY(this.curCoords, pointer);
        this.downEvent = event;

        while (utils.isElement(element) && !action) {
            this.matches = [];
            this.matchElements = [];

            scope.interactables.forEachSelector(pushMatches);

            action = this.validateSelector(pointer, event, this.matches, this.matchElements);
            element = scope.parentElement(element);
        }

        if (action) {
            this.prepared.name  = action.name;
            this.prepared.axis  = action.axis;
            this.prepared.edges = action.edges;

            this.collectEventTargets(pointer, event, eventTarget, 'down');

            return this.pointerDown(pointer, event, eventTarget, curEventTarget, action);
        }
        else {
            // do these now since pointerDown isn't being called from here
            this.downTimes[pointerIndex] = new Date().getTime();
            this.downTargets[pointerIndex] = eventTarget;
            utils.extend(this.downPointer, pointer);

            utils.copyCoords(this.prevCoords, this.curCoords);
            this.pointerWasMoved = false;
        }

        this.collectEventTargets(pointer, event, eventTarget, 'down');
    },

    // Determine action to be performed on next pointerMove and add appropriate
    // style and event Listeners
    pointerDown: function (pointer, event, eventTarget, curEventTarget, forceAction) {
        if (!forceAction && !this.inertiaStatus.active && this.pointerWasMoved && this.prepared.name) {
            this.checkAndPreventDefault(event, this.target, this.element);

            return;
        }

        this.pointerIsDown = true;
        this.downEvent = event;

        var pointerIndex = this.addPointer(pointer),
            action;

        // If it is the second touch of a multi-touch gesture, keep the target
        // the same if a target was set by the first touch
        // Otherwise, set the target if there is no action prepared
        if ((this.pointerIds.length < 2 && !this.target) || !this.prepared.name) {

            var interactable = scope.interactables.get(curEventTarget);

            if (interactable
                && !scope.testIgnore(interactable, curEventTarget, eventTarget)
                && scope.testAllow(interactable, curEventTarget, eventTarget)
                && (action = validateAction(forceAction || interactable.getAction(pointer, event, this, curEventTarget), interactable, eventTarget))
                && scope.withinInteractionLimit(interactable, curEventTarget, action)) {
                this.target = interactable;
                this.element = curEventTarget;
            }
        }

        var target = this.target,
            options = target && target.options;

        if (target && (forceAction || !this.prepared.name)) {
            action = action || validateAction(forceAction || target.getAction(pointer, event, this, curEventTarget), target, this.element);

            this.setEventXY(this.startCoords);

            if (!action) { return; }

            if (options.styleCursor) {
                target._doc.documentElement.style.cursor = getActionCursor(action);
            }

            this.resizeAxes = action.name === 'resize'? action.axis : null;

            if (action === 'gesture' && this.pointerIds.length < 2) {
                action = null;
            }

            this.prepared.name  = action.name;
            this.prepared.axis  = action.axis;
            this.prepared.edges = action.edges;

            this.snapStatus.snappedX = this.snapStatus.snappedY =
                this.restrictStatus.restrictedX = this.restrictStatus.restrictedY = NaN;

            this.downTimes[pointerIndex] = new Date().getTime();
            this.downTargets[pointerIndex] = eventTarget;
            utils.extend(this.downPointer, pointer);

            this.setEventXY(this.prevCoords);
            this.pointerWasMoved = false;

            this.checkAndPreventDefault(event, target, this.element);
        }
        // if inertia is active try to resume action
        else if (this.inertiaStatus.active
            && curEventTarget === this.element
            && validateAction(target.getAction(pointer, event, this, this.element), target).name === this.prepared.name) {

            animationFrame.cancel(this.inertiaStatus.i);
            this.inertiaStatus.active = false;

            this.checkAndPreventDefault(event, target, this.element);
        }
    },

    setModifications: function (coords, preEnd) {
        var target         = this.target,
            shouldMove     = true,
            shouldSnap     = scope.checkSnap(target, this.prepared.name)     && (!target.options[this.prepared.name].snap.endOnly     || preEnd),
            shouldRestrict = scope.checkRestrict(target, this.prepared.name) && (!target.options[this.prepared.name].restrict.endOnly || preEnd);

        if (shouldSnap    ) { this.setSnapping   (coords); } else { this.snapStatus    .locked     = false; }
        if (shouldRestrict) { this.setRestriction(coords); } else { this.restrictStatus.restricted = false; }

        if (shouldSnap && this.snapStatus.locked && !this.snapStatus.changed) {
            shouldMove = shouldRestrict && this.restrictStatus.restricted && this.restrictStatus.changed;
        }
        else if (shouldRestrict && this.restrictStatus.restricted && !this.restrictStatus.changed) {
            shouldMove = false;
        }

        return shouldMove;
    },

    setStartOffsets: function (action, interactable, element) {
        var rect = interactable.getRect(element),
            origin = scope.getOriginXY(interactable, element),
            snap = interactable.options[this.prepared.name].snap,
            restrict = interactable.options[this.prepared.name].restrict,
            width, height;

        if (rect) {
            this.startOffset.left = this.startCoords.page.x - rect.left;
            this.startOffset.top  = this.startCoords.page.y - rect.top;

            this.startOffset.right  = rect.right  - this.startCoords.page.x;
            this.startOffset.bottom = rect.bottom - this.startCoords.page.y;

            if ('width' in rect) { width = rect.width; }
            else { width = rect.right - rect.left; }
            if ('height' in rect) { height = rect.height; }
            else { height = rect.bottom - rect.top; }
        }
        else {
            this.startOffset.left = this.startOffset.top = this.startOffset.right = this.startOffset.bottom = 0;
        }

        this.snapOffsets.splice(0);

        var snapOffset = snap && snap.offset === 'startCoords'
            ? {
            x: this.startCoords.page.x - origin.x,
            y: this.startCoords.page.y - origin.y
        }
            : snap && snap.offset || { x: 0, y: 0 };

        if (rect && snap && snap.relativePoints && snap.relativePoints.length) {
            for (var i = 0; i < snap.relativePoints.length; i++) {
                this.snapOffsets.push({
                    x: this.startOffset.left - (width  * snap.relativePoints[i].x) + snapOffset.x,
                    y: this.startOffset.top  - (height * snap.relativePoints[i].y) + snapOffset.y
                });
            }
        }
        else {
            this.snapOffsets.push(snapOffset);
        }

        if (rect && restrict.elementRect) {
            this.restrictOffset.left = this.startOffset.left - (width  * restrict.elementRect.left);
            this.restrictOffset.top  = this.startOffset.top  - (height * restrict.elementRect.top);

            this.restrictOffset.right  = this.startOffset.right  - (width  * (1 - restrict.elementRect.right));
            this.restrictOffset.bottom = this.startOffset.bottom - (height * (1 - restrict.elementRect.bottom));
        }
        else {
            this.restrictOffset.left = this.restrictOffset.top = this.restrictOffset.right = this.restrictOffset.bottom = 0;
        }
    },

    /*\
     * Interaction.start
     [ method ]
     *
     * Start an action with the given Interactable and Element as tartgets. The
     * action must be enabled for the target Interactable and an appropriate number
     * of pointers must be held down – 1 for drag/resize, 2 for gesture.
     *
     * Use it with `interactable.<action>able({ manualStart: false })` to always
     * [start actions manually](https://github.com/taye/interact.js/issues/114)
     *
     - action       (object)  The action to be performed - drag, resize, etc.
     - interactable (Interactable) The Interactable to target
     - element      (Element) The DOM Element to target
     = (object) interact
     **
     | interact(target)
     |   .draggable({
     |     // disable the default drag start by down->move
     |     manualStart: true
     |   })
     |   // start dragging after the user holds the pointer down
     |   .on('hold', function (event) {
     |     var interaction = event.interaction;
     |
     |     if (!interaction.interacting()) {
     |       interaction.start({ name: 'drag' },
     |                         event.interactable,
     |                         event.currentTarget);
     |     }
     | });
     \*/
    start: function (action, interactable, element) {
        if (this.interacting()
            || !this.pointerIsDown
            || this.pointerIds.length < (action.name === 'gesture'? 2 : 1)) {
            return;
        }

        // if this interaction had been removed after stopping
        // add it back
        if (scope.indexOf(scope.interactions, this) === -1) {
            scope.interactions.push(this);
        }

        this.prepared.name  = action.name;
        this.prepared.axis  = action.axis;
        this.prepared.edges = action.edges;
        this.target         = interactable;
        this.element        = element;

        this.setEventXY(this.startCoords);
        this.setStartOffsets(action.name, interactable, element);
        this.setModifications(this.startCoords.page);

        this.prevEvent = this[this.prepared.name + 'Start'](this.downEvent);
    },

    pointerMove: function (pointer, event, eventTarget, curEventTarget, preEnd) {
        this.recordPointer(pointer);

        this.setEventXY(this.curCoords, (pointer instanceof InteractEvent)
            ? this.inertiaStatus.startEvent
            : undefined);

        var duplicateMove = (this.curCoords.page.x === this.prevCoords.page.x
        && this.curCoords.page.y === this.prevCoords.page.y
        && this.curCoords.client.x === this.prevCoords.client.x
        && this.curCoords.client.y === this.prevCoords.client.y);

        var dx, dy,
            pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        // register movement greater than pointerMoveTolerance
        if (this.pointerIsDown && !this.pointerWasMoved) {
            dx = this.curCoords.client.x - this.startCoords.client.x;
            dy = this.curCoords.client.y - this.startCoords.client.y;

            this.pointerWasMoved = utils.hypot(dx, dy) > scope.pointerMoveTolerance;
        }

        if (!duplicateMove && (!this.pointerIsDown || this.pointerWasMoved)) {
            if (this.pointerIsDown) {
                clearTimeout(this.holdTimers[pointerIndex]);
            }

            this.collectEventTargets(pointer, event, eventTarget, 'move');
        }

        if (!this.pointerIsDown) { return; }

        if (duplicateMove && this.pointerWasMoved && !preEnd) {
            this.checkAndPreventDefault(event, this.target, this.element);
            return;
        }

        // set pointer coordinate, time changes and speeds
        utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

        if (!this.prepared.name) { return; }

        if (this.pointerWasMoved
                // ignore movement while inertia is active
            && (!this.inertiaStatus.active || (pointer instanceof InteractEvent && /inertiastart/.test(pointer.type)))) {

            // if just starting an action, calculate the pointer speed now
            if (!this.interacting()) {
                utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

                // check if a drag is in the correct axis
                if (this.prepared.name === 'drag') {
                    var absX = Math.abs(dx),
                        absY = Math.abs(dy),
                        targetAxis = this.target.options.drag.axis,
                        axis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy');

                    // if the movement isn't in the axis of the interactable
                    if (axis !== 'xy' && targetAxis !== 'xy' && targetAxis !== axis) {
                        // cancel the prepared action
                        this.prepared.name = null;

                        // then try to get a drag from another ineractable

                        var element = eventTarget;

                        // check element interactables
                        while (utils.isElement(element)) {
                            var elementInteractable = scope.interactables.get(element);

                            if (elementInteractable
                                && elementInteractable !== this.target
                                && !elementInteractable.options.drag.manualStart
                                && elementInteractable.getAction(this.downPointer, this.downEvent, this, element).name === 'drag'
                                && scope.checkAxis(axis, elementInteractable)) {

                                this.prepared.name = 'drag';
                                this.target = elementInteractable;
                                this.element = element;
                                break;
                            }

                            element = scope.parentElement(element);
                        }

                        // if there's no drag from element interactables,
                        // check the selector interactables
                        if (!this.prepared.name) {
                            var thisInteraction = this;

                            var getDraggable = function (interactable, selector, context) {
                                var elements = scope.ie8MatchesSelector
                                    ? context.querySelectorAll(selector)
                                    : undefined;

                                if (interactable === thisInteraction.target) { return; }

                                if (scope.inContext(interactable, eventTarget)
                                    && !interactable.options.drag.manualStart
                                    && !scope.testIgnore(interactable, element, eventTarget)
                                    && scope.testAllow(interactable, element, eventTarget)
                                    && scope.matchesSelector(element, selector, elements)
                                    && interactable.getAction(thisInteraction.downPointer, thisInteraction.downEvent, thisInteraction, element).name === 'drag'
                                    && scope.checkAxis(axis, interactable)
                                    && scope.withinInteractionLimit(interactable, element, 'drag')) {

                                    return interactable;
                                }
                            };

                            element = eventTarget;

                            while (utils.isElement(element)) {
                                var selectorInteractable = scope.interactables.forEachSelector(getDraggable);

                                if (selectorInteractable) {
                                    this.prepared.name = 'drag';
                                    this.target = selectorInteractable;
                                    this.element = element;
                                    break;
                                }

                                element = scope.parentElement(element);
                            }
                        }
                    }
                }
            }

            var starting = !!this.prepared.name && !this.interacting();

            if (starting
                && (this.target.options[this.prepared.name].manualStart
                || !scope.withinInteractionLimit(this.target, this.element, this.prepared))) {
                this.stop(event);
                return;
            }

            if (this.prepared.name && this.target) {
                if (starting) {
                    this.start(this.prepared, this.target, this.element);
                }

                var shouldMove = this.setModifications(this.curCoords.page, preEnd);

                // move if snapping or restriction doesn't prevent it
                if (shouldMove || starting) {
                    this.prevEvent = this[this.prepared.name + 'Move'](event);
                }

                this.checkAndPreventDefault(event, this.target, this.element);
            }
        }

        utils.copyCoords(this.prevCoords, this.curCoords);

        if (this.dragging || this.resizing) {
            this.autoScrollMove(pointer);
        }
    },

    dragStart: function (event) {
        var dragEvent = new InteractEvent(this, event, 'drag', 'start', this.element);

        this.dragging = true;
        this.target.fire(dragEvent);

        // reset active dropzones
        this.activeDrops.dropzones = [];
        this.activeDrops.elements  = [];
        this.activeDrops.rects     = [];

        if (!this.dynamicDrop) {
            this.setActiveDrops(this.element);
        }

        var dropEvents = this.getDropEvents(event, dragEvent);

        if (dropEvents.activate) {
            this.fireActiveDrops(dropEvents.activate);
        }

        return dragEvent;
    },

    dragMove: function (event) {
        var target = this.target,
            dragEvent  = new InteractEvent(this, event, 'drag', 'move', this.element),
            draggableElement = this.element,
            drop = this.getDrop(event, draggableElement);

        this.dropTarget = drop.dropzone;
        this.dropElement = drop.element;

        var dropEvents = this.getDropEvents(event, dragEvent);

        target.fire(dragEvent);

        if (dropEvents.leave) { this.prevDropTarget.fire(dropEvents.leave); }
        if (dropEvents.enter) {     this.dropTarget.fire(dropEvents.enter); }
        if (dropEvents.move ) {     this.dropTarget.fire(dropEvents.move ); }

        this.prevDropTarget  = this.dropTarget;
        this.prevDropElement = this.dropElement;

        return dragEvent;
    },

    resizeStart: function (event) {
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
    },

    resizeMove: function (event) {
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
    },

    gestureStart: function (event) {
        var gestureEvent = new InteractEvent(this, event, 'gesture', 'start', this.element);

        gestureEvent.ds = 0;

        this.gesture.startDistance = this.gesture.prevDistance = gestureEvent.distance;
        this.gesture.startAngle = this.gesture.prevAngle = gestureEvent.angle;
        this.gesture.scale = 1;

        this.gesturing = true;

        this.target.fire(gestureEvent);

        return gestureEvent;
    },

    gestureMove: function (event) {
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
    },

    pointerHold: function (pointer, event, eventTarget) {
        this.collectEventTargets(pointer, event, eventTarget, 'hold');
    },

    pointerUp: function (pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        clearTimeout(this.holdTimers[pointerIndex]);

        this.collectEventTargets(pointer, event, eventTarget, 'up' );
        this.collectEventTargets(pointer, event, eventTarget, 'tap');

        this.pointerEnd(pointer, event, eventTarget, curEventTarget);

        this.removePointer(pointer);
    },

    pointerCancel: function (pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        clearTimeout(this.holdTimers[pointerIndex]);

        this.collectEventTargets(pointer, event, eventTarget, 'cancel');
        this.pointerEnd(pointer, event, eventTarget, curEventTarget);

        this.removePointer(pointer);
    },

    // http://www.quirksmode.org/dom/events/click.html
    // >Events leading to dblclick
    //
    // IE8 doesn't fire down event before dblclick.
    // This workaround tries to fire a tap and doubletap after dblclick
    ie8Dblclick: function (pointer, event, eventTarget) {
        if (this.prevTap
            && event.clientX === this.prevTap.clientX
            && event.clientY === this.prevTap.clientY
            && eventTarget   === this.prevTap.target) {

            this.downTargets[0] = eventTarget;
            this.downTimes[0] = new Date().getTime();
            this.collectEventTargets(pointer, event, eventTarget, 'tap');
        }
    },

    // End interact move events and stop auto-scroll unless inertia is enabled
    pointerEnd: function (pointer, event, eventTarget, curEventTarget) {
        var endEvent,
            target = this.target,
            options = target && target.options,
            inertiaOptions = options && this.prepared.name && options[this.prepared.name].inertia,
            inertiaStatus = this.inertiaStatus;

        if (this.interacting()) {

            if (inertiaStatus.active) { return; }

            var pointerSpeed,
                now = new Date().getTime(),
                inertiaPossible = false,
                inertia = false,
                smoothEnd = false,
                endSnap = scope.checkSnap(target, this.prepared.name) && options[this.prepared.name].snap.endOnly,
                endRestrict = scope.checkRestrict(target, this.prepared.name) && options[this.prepared.name].restrict.endOnly,
                dx = 0,
                dy = 0,
                startEvent;

            if (this.dragging) {
                if      (options.drag.axis === 'x' ) { pointerSpeed = Math.abs(this.pointerDelta.client.vx); }
                else if (options.drag.axis === 'y' ) { pointerSpeed = Math.abs(this.pointerDelta.client.vy); }
                else   /*options.drag.axis === 'xy'*/{ pointerSpeed = this.pointerDelta.client.speed; }
            }
            else {
                pointerSpeed = this.pointerDelta.client.speed;
            }

            // check if inertia should be started
            inertiaPossible = (inertiaOptions && inertiaOptions.enabled
            && this.prepared.name !== 'gesture'
            && event !== inertiaStatus.startEvent);

            inertia = (inertiaPossible
            && (now - this.curCoords.timeStamp) < 50
            && pointerSpeed > inertiaOptions.minSpeed
            && pointerSpeed > inertiaOptions.endSpeed);

            if (inertiaPossible && !inertia && (endSnap || endRestrict)) {

                var snapRestrict = {};

                snapRestrict.snap = snapRestrict.restrict = snapRestrict;

                if (endSnap) {
                    this.setSnapping(this.curCoords.page, snapRestrict);
                    if (snapRestrict.locked) {
                        dx += snapRestrict.dx;
                        dy += snapRestrict.dy;
                    }
                }

                if (endRestrict) {
                    this.setRestriction(this.curCoords.page, snapRestrict);
                    if (snapRestrict.restricted) {
                        dx += snapRestrict.dx;
                        dy += snapRestrict.dy;
                    }
                }

                if (dx || dy) {
                    smoothEnd = true;
                }
            }

            if (inertia || smoothEnd) {
                utils.copyCoords(inertiaStatus.upCoords, this.curCoords);

                this.pointers[0] = inertiaStatus.startEvent = startEvent =
                    new InteractEvent(this, event, this.prepared.name, 'inertiastart', this.element);

                inertiaStatus.t0 = now;

                target.fire(inertiaStatus.startEvent);

                if (inertia) {
                    inertiaStatus.vx0 = this.pointerDelta.client.vx;
                    inertiaStatus.vy0 = this.pointerDelta.client.vy;
                    inertiaStatus.v0 = pointerSpeed;

                    this.calcInertia(inertiaStatus);

                    var page = utils.extend({}, this.curCoords.page),
                        origin = scope.getOriginXY(target, this.element),
                        statusObject;

                    page.x = page.x + inertiaStatus.xe - origin.x;
                    page.y = page.y + inertiaStatus.ye - origin.y;

                    statusObject = {
                        useStatusXY: true,
                        x: page.x,
                        y: page.y,
                        dx: 0,
                        dy: 0,
                        snap: null
                    };

                    statusObject.snap = statusObject;

                    dx = dy = 0;

                    if (endSnap) {
                        var snap = this.setSnapping(this.curCoords.page, statusObject);

                        if (snap.locked) {
                            dx += snap.dx;
                            dy += snap.dy;
                        }
                    }

                    if (endRestrict) {
                        var restrict = this.setRestriction(this.curCoords.page, statusObject);

                        if (restrict.restricted) {
                            dx += restrict.dx;
                            dy += restrict.dy;
                        }
                    }

                    inertiaStatus.modifiedXe += dx;
                    inertiaStatus.modifiedYe += dy;

                    inertiaStatus.i = animationFrame.request(this.boundInertiaFrame);
                }
                else {
                    inertiaStatus.smoothEnd = true;
                    inertiaStatus.xe = dx;
                    inertiaStatus.ye = dy;

                    inertiaStatus.sx = inertiaStatus.sy = 0;

                    inertiaStatus.i = animationFrame.request(this.boundSmoothEndFrame);
                }

                inertiaStatus.active = true;
                return;
            }

            if (endSnap || endRestrict) {
                // fire a move event at the snapped coordinates
                this.pointerMove(pointer, event, eventTarget, curEventTarget, true);
            }
        }

        if (this.dragging) {
            endEvent = new InteractEvent(this, event, 'drag', 'end', this.element);

            var draggableElement = this.element,
                drop = this.getDrop(event, draggableElement);

            this.dropTarget = drop.dropzone;
            this.dropElement = drop.element;

            var dropEvents = this.getDropEvents(event, endEvent);

            if (dropEvents.leave) { this.prevDropTarget.fire(dropEvents.leave); }
            if (dropEvents.enter) {     this.dropTarget.fire(dropEvents.enter); }
            if (dropEvents.drop ) {     this.dropTarget.fire(dropEvents.drop ); }
            if (dropEvents.deactivate) {
                this.fireActiveDrops(dropEvents.deactivate);
            }

            target.fire(endEvent);
        }
        else if (this.resizing) {
            endEvent = new InteractEvent(this, event, 'resize', 'end', this.element);
            target.fire(endEvent);
        }
        else if (this.gesturing) {
            endEvent = new InteractEvent(this, event, 'gesture', 'end', this.element);
            target.fire(endEvent);
        }

        this.stop(event);
    },

    collectDrops: function (element) {
        var drops = [],
            elements = [],
            i;

        element = element || this.element;

        // collect all dropzones and their elements which qualify for a drop
        for (i = 0; i < scope.interactables.length; i++) {
            if (!scope.interactables[i].options.drop.enabled) { continue; }

            var current = scope.interactables[i],
                accept = current.options.drop.accept;

            // test the draggable element against the dropzone's accept setting
            if ((utils.isElement(accept) && accept !== element)
                || (scope.isString(accept)
                && !scope.matchesSelector(element, accept))) {

                continue;
            }

            // query for new elements if necessary
            var dropElements = current.selector? current._context.querySelectorAll(current.selector) : [current._element];

            for (var j = 0, len = dropElements.length; j < len; j++) {
                var currentElement = dropElements[j];

                if (currentElement === element) {
                    continue;
                }

                drops.push(current);
                elements.push(currentElement);
            }
        }

        return {
            dropzones: drops,
            elements: elements
        };
    },

    fireActiveDrops: function (event) {
        var i,
            current,
            currentElement,
            prevElement;

        // loop through all active dropzones and trigger event
        for (i = 0; i < this.activeDrops.dropzones.length; i++) {
            current = this.activeDrops.dropzones[i];
            currentElement = this.activeDrops.elements [i];

            // prevent trigger of duplicate events on same element
            if (currentElement !== prevElement) {
                // set current element as event target
                event.target = currentElement;
                current.fire(event);
            }
            prevElement = currentElement;
        }
    },

    // Collect a new set of possible drops and save them in activeDrops.
    // setActiveDrops should always be called when a drag has just started or a
    // drag event happens while dynamicDrop is true
    setActiveDrops: function (dragElement) {
        // get dropzones and their elements that could receive the draggable
        var possibleDrops = this.collectDrops(dragElement, true);

        this.activeDrops.dropzones = possibleDrops.dropzones;
        this.activeDrops.elements  = possibleDrops.elements;
        this.activeDrops.rects     = [];

        for (var i = 0; i < this.activeDrops.dropzones.length; i++) {
            this.activeDrops.rects[i] = this.activeDrops.dropzones[i].getRect(this.activeDrops.elements[i]);
        }
    },

    getDrop: function (event, dragElement) {
        var validDrops = [];

        if (scope.dynamicDrop) {
            this.setActiveDrops(dragElement);
        }

        // collect all dropzones and their elements which qualify for a drop
        for (var j = 0; j < this.activeDrops.dropzones.length; j++) {
            var current        = this.activeDrops.dropzones[j],
                currentElement = this.activeDrops.elements [j],
                rect           = this.activeDrops.rects    [j];

            validDrops.push(current.dropCheck(this.pointers[0], event, this.target, dragElement, currentElement, rect)
                ? currentElement
                : null);
        }

        // get the most appropriate dropzone based on DOM depth and order
        var dropIndex = scope.indexOfDeepestElement(validDrops),
            dropzone  = this.activeDrops.dropzones[dropIndex] || null,
            element   = this.activeDrops.elements [dropIndex] || null;

        return {
            dropzone: dropzone,
            element: element
        };
    },

    getDropEvents: function (pointerEvent, dragEvent) {
        var dropEvents = {
            enter     : null,
            leave     : null,
            activate  : null,
            deactivate: null,
            move      : null,
            drop      : null
        };

        if (this.dropElement !== this.prevDropElement) {
            // if there was a prevDropTarget, create a dragleave event
            if (this.prevDropTarget) {
                dropEvents.leave = {
                    target       : this.prevDropElement,
                    dropzone     : this.prevDropTarget,
                    relatedTarget: dragEvent.target,
                    draggable    : dragEvent.interactable,
                    dragEvent    : dragEvent,
                    interaction  : this,
                    timeStamp    : dragEvent.timeStamp,
                    type         : 'dragleave'
                };

                dragEvent.dragLeave = this.prevDropElement;
                dragEvent.prevDropzone = this.prevDropTarget;
            }
            // if the dropTarget is not null, create a dragenter event
            if (this.dropTarget) {
                dropEvents.enter = {
                    target       : this.dropElement,
                    dropzone     : this.dropTarget,
                    relatedTarget: dragEvent.target,
                    draggable    : dragEvent.interactable,
                    dragEvent    : dragEvent,
                    interaction  : this,
                    timeStamp    : dragEvent.timeStamp,
                    type         : 'dragenter'
                };

                dragEvent.dragEnter = this.dropElement;
                dragEvent.dropzone = this.dropTarget;
            }
        }

        if (dragEvent.type === 'dragend' && this.dropTarget) {
            dropEvents.drop = {
                target       : this.dropElement,
                dropzone     : this.dropTarget,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                timeStamp    : dragEvent.timeStamp,
                type         : 'drop'
            };

            dragEvent.dropzone = this.dropTarget;
        }
        if (dragEvent.type === 'dragstart') {
            dropEvents.activate = {
                target       : null,
                dropzone     : null,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                timeStamp    : dragEvent.timeStamp,
                type         : 'dropactivate'
            };
        }
        if (dragEvent.type === 'dragend') {
            dropEvents.deactivate = {
                target       : null,
                dropzone     : null,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                timeStamp    : dragEvent.timeStamp,
                type         : 'dropdeactivate'
            };
        }
        if (dragEvent.type === 'dragmove' && this.dropTarget) {
            dropEvents.move = {
                target       : this.dropElement,
                dropzone     : this.dropTarget,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                dragmove     : dragEvent,
                timeStamp    : dragEvent.timeStamp,
                type         : 'dropmove'
            };
            dragEvent.dropzone = this.dropTarget;
        }

        return dropEvents;
    },

    currentAction: function () {
        return (this.dragging && 'drag') || (this.resizing && 'resize') || (this.gesturing && 'gesture') || null;
    },

    interacting: function () {
        return this.dragging || this.resizing || this.gesturing;
    },

    clearTargets: function () {
        this.target = this.element = null;

        this.dropTarget = this.dropElement = this.prevDropTarget = this.prevDropElement = null;
    },

    stop: function (event) {
        if (this.interacting()) {
            scope.autoScroll.stop();
            this.matches = [];
            this.matchElements = [];

            var target = this.target;

            if (target.options.styleCursor) {
                target._doc.documentElement.style.cursor = '';
            }

            // prevent Default only if were previously interacting
            if (event && scope.isFunction(event.preventDefault)) {
                this.checkAndPreventDefault(event, target, this.element);
            }

            if (this.dragging) {
                this.activeDrops.dropzones = this.activeDrops.elements = this.activeDrops.rects = null;
            }
        }

        this.clearTargets();

        this.pointerIsDown = this.snapStatus.locked = this.dragging = this.resizing = this.gesturing = false;
        this.prepared.name = this.prevEvent = null;
        this.inertiaStatus.resumeDx = this.inertiaStatus.resumeDy = 0;

        // remove pointers if their ID isn't in this.pointerIds
        for (var i = 0; i < this.pointers.length; i++) {
            if (scope.indexOf(this.pointerIds, utils.getPointerId(this.pointers[i])) === -1) {
                this.pointers.splice(i, 1);
            }
        }

        for (i = 0; i < scope.interactions.length; i++) {
            // remove this interaction if it's not the only one of it's type
            if (scope.interactions[i] !== this && scope.interactions[i].mouse === this.mouse) {
                scope.interactions.splice(scope.indexOf(scope.interactions, this), 1);
            }
        }
    },

    inertiaFrame: function () {
        var inertiaStatus = this.inertiaStatus,
            options = this.target.options[this.prepared.name].inertia,
            lambda = options.resistance,
            t = new Date().getTime() / 1000 - inertiaStatus.t0;

        if (t < inertiaStatus.te) {

            var progress =  1 - (Math.exp(-lambda * t) - inertiaStatus.lambda_v0) / inertiaStatus.one_ve_v0;

            if (inertiaStatus.modifiedXe === inertiaStatus.xe && inertiaStatus.modifiedYe === inertiaStatus.ye) {
                inertiaStatus.sx = inertiaStatus.xe * progress;
                inertiaStatus.sy = inertiaStatus.ye * progress;
            }
            else {
                var quadPoint = scope.getQuadraticCurvePoint(
                    0, 0,
                    inertiaStatus.xe, inertiaStatus.ye,
                    inertiaStatus.modifiedXe, inertiaStatus.modifiedYe,
                    progress);

                inertiaStatus.sx = quadPoint.x;
                inertiaStatus.sy = quadPoint.y;
            }

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.i = animationFrame.request(this.boundInertiaFrame);
        }
        else {
            inertiaStatus.sx = inertiaStatus.modifiedXe;
            inertiaStatus.sy = inertiaStatus.modifiedYe;

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.active = false;
            this.pointerEnd(inertiaStatus.startEvent, inertiaStatus.startEvent);
        }
    },

    smoothEndFrame: function () {
        var inertiaStatus = this.inertiaStatus,
            t = new Date().getTime() - inertiaStatus.t0,
            duration = this.target.options[this.prepared.name].inertia.smoothEndDuration;

        if (t < duration) {
            inertiaStatus.sx = scope.easeOutQuad(t, 0, inertiaStatus.xe, duration);
            inertiaStatus.sy = scope.easeOutQuad(t, 0, inertiaStatus.ye, duration);

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.i = animationFrame.request(this.boundSmoothEndFrame);
        }
        else {
            inertiaStatus.sx = inertiaStatus.xe;
            inertiaStatus.sy = inertiaStatus.ye;

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.active = false;
            inertiaStatus.smoothEnd = false;

            this.pointerEnd(inertiaStatus.startEvent, inertiaStatus.startEvent);
        }
    },

    addPointer: function (pointer) {
        var id = utils.getPointerId(pointer),
            index = this.mouse? 0 : scope.indexOf(this.pointerIds, id);

        if (index === -1) {
            index = this.pointerIds.length;
        }

        this.pointerIds[index] = id;
        this.pointers[index] = pointer;

        return index;
    },

    removePointer: function (pointer) {
        var id = utils.getPointerId(pointer),
            index = this.mouse? 0 : scope.indexOf(this.pointerIds, id);

        if (index === -1) { return; }

        if (!this.interacting()) {
            this.pointers.splice(index, 1);
        }

        this.pointerIds .splice(index, 1);
        this.downTargets.splice(index, 1);
        this.downTimes  .splice(index, 1);
        this.holdTimers .splice(index, 1);
    },

    recordPointer: function (pointer) {
        // Do not update pointers while inertia is active.
        // The inertia start event should be this.pointers[0]
        if (this.inertiaStatus.active) { return; }

        var index = this.mouse? 0: scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        if (index === -1) { return; }

        this.pointers[index] = pointer;
    },

    collectEventTargets: function (pointer, event, eventTarget, eventType) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        // do not fire a tap event if the pointer was moved before being lifted
        if (eventType === 'tap' && (this.pointerWasMoved
                // or if the pointerup target is different to the pointerdown target
            || !(this.downTargets[pointerIndex] && this.downTargets[pointerIndex] === eventTarget))) {
            return;
        }

        var targets = [],
            elements = [],
            element = eventTarget;

        function collectSelectors (interactable, selector, context) {
            var els = scope.ie8MatchesSelector
                ? context.querySelectorAll(selector)
                : undefined;

            if (interactable._iEvents[eventType]
                && utils.isElement(element)
                && scope.inContext(interactable, element)
                && !scope.testIgnore(interactable, element, eventTarget)
                && scope.testAllow(interactable, element, eventTarget)
                && scope.matchesSelector(element, selector, els)) {

                targets.push(interactable);
                elements.push(element);
            }
        }


        var interact = scope.interact;

        while (element) {
            if (interact.isSet(element) && interact(element)._iEvents[eventType]) {
                targets.push(interact(element));
                elements.push(element);
            }

            scope.interactables.forEachSelector(collectSelectors);

            element = scope.parentElement(element);
        }

        // create the tap event even if there are no listeners so that
        // doubletap can still be created and fired
        if (targets.length || eventType === 'tap') {
            this.firePointers(pointer, event, eventTarget, targets, elements, eventType);
        }
    },

    firePointers: function (pointer, event, eventTarget, targets, elements, eventType) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(utils.getPointerId(pointer)),
            pointerEvent = {},
            i,
        // for tap events
            interval, createNewDoubleTap;

        // if it's a doubletap then the event properties would have been
        // copied from the tap event and provided as the pointer argument
        if (eventType === 'doubletap') {
            pointerEvent = pointer;
        }
        else {
            utils.extend(pointerEvent, event);
            if (event !== pointer) {
                utils.extend(pointerEvent, pointer);
            }

            pointerEvent.preventDefault           = preventOriginalDefault;
            pointerEvent.stopPropagation          = InteractEvent.prototype.stopPropagation;
            pointerEvent.stopImmediatePropagation = InteractEvent.prototype.stopImmediatePropagation;
            pointerEvent.interaction              = this;

            pointerEvent.timeStamp     = new Date().getTime();
            pointerEvent.originalEvent = event;
            pointerEvent.type          = eventType;
            pointerEvent.pointerId     = utils.getPointerId(pointer);
            pointerEvent.pointerType   = this.mouse? 'mouse' : !browser.supportsPointerEvent? 'touch'
                : scope.isString(pointer.pointerType)
                ? pointer.pointerType
                : [,,'touch', 'pen', 'mouse'][pointer.pointerType];
        }

        if (eventType === 'tap') {
            pointerEvent.dt = pointerEvent.timeStamp - this.downTimes[pointerIndex];

            interval = pointerEvent.timeStamp - this.tapTime;
            createNewDoubleTap = !!(this.prevTap && this.prevTap.type !== 'doubletap'
            && this.prevTap.target === pointerEvent.target
            && interval < 500);

            pointerEvent.double = createNewDoubleTap;

            this.tapTime = pointerEvent.timeStamp;
        }

        for (i = 0; i < targets.length; i++) {
            pointerEvent.currentTarget = elements[i];
            pointerEvent.interactable = targets[i];
            targets[i].fire(pointerEvent);

            if (pointerEvent.immediatePropagationStopped
                ||(pointerEvent.propagationStopped && elements[i + 1] !== pointerEvent.currentTarget)) {
                break;
            }
        }

        if (createNewDoubleTap) {
            var doubleTap = {};

            utils.extend(doubleTap, pointerEvent);

            doubleTap.dt   = interval;
            doubleTap.type = 'doubletap';

            this.collectEventTargets(doubleTap, event, eventTarget, 'doubletap');

            this.prevTap = doubleTap;
        }
        else if (eventType === 'tap') {
            this.prevTap = pointerEvent;
        }
    },

    validateSelector: function (pointer, event, matches, matchElements) {
        for (var i = 0, len = matches.length; i < len; i++) {
            var match = matches[i],
                matchElement = matchElements[i],
                action = validateAction(match.getAction(pointer, event, this, matchElement), match);

            if (action && scope.withinInteractionLimit(match, matchElement, action)) {
                this.target = match;
                this.element = matchElement;

                return action;
            }
        }
    },

    setSnapping: function (pageCoords, status) {
        var snap = this.target.options[this.prepared.name].snap,
            targets = [],
            target,
            page,
            i;

        status = status || this.snapStatus;

        if (status.useStatusXY) {
            page = { x: status.x, y: status.y };
        }
        else {
            var origin = scope.getOriginXY(this.target, this.element);

            page = utils.extend({}, pageCoords);

            page.x -= origin.x;
            page.y -= origin.y;
        }

        status.realX = page.x;
        status.realY = page.y;

        page.x = page.x - this.inertiaStatus.resumeDx;
        page.y = page.y - this.inertiaStatus.resumeDy;

        var len = snap.targets? snap.targets.length : 0;

        for (var relIndex = 0; relIndex < this.snapOffsets.length; relIndex++) {
            var relative = {
                x: page.x - this.snapOffsets[relIndex].x,
                y: page.y - this.snapOffsets[relIndex].y
            };

            for (i = 0; i < len; i++) {
                if (scope.isFunction(snap.targets[i])) {
                    target = snap.targets[i](relative.x, relative.y, this);
                }
                else {
                    target = snap.targets[i];
                }

                if (!target) { continue; }

                targets.push({
                    x: scope.isNumber(target.x) ? (target.x + this.snapOffsets[relIndex].x) : relative.x,
                    y: scope.isNumber(target.y) ? (target.y + this.snapOffsets[relIndex].y) : relative.y,

                    range: scope.isNumber(target.range)? target.range: snap.range
                });
            }
        }

        var closest = {
            target: null,
            inRange: false,
            distance: 0,
            range: 0,
            dx: 0,
            dy: 0
        };

        for (i = 0, len = targets.length; i < len; i++) {
            target = targets[i];

            var range = target.range,
                dx = target.x - page.x,
                dy = target.y - page.y,
                distance = utils.hypot(dx, dy),
                inRange = distance <= range;

            // Infinite targets count as being out of range
            // compared to non infinite ones that are in range
            if (range === Infinity && closest.inRange && closest.range !== Infinity) {
                inRange = false;
            }

            if (!closest.target || (inRange
                    // is the closest target in range?
                    ? (closest.inRange && range !== Infinity
                    // the pointer is relatively deeper in this target
                    ? distance / range < closest.distance / closest.range
                    // this target has Infinite range and the closest doesn't
                    : (range === Infinity && closest.range !== Infinity)
                    // OR this target is closer that the previous closest
                || distance < closest.distance)
                    // The other is not in range and the pointer is closer to this target
                    : (!closest.inRange && distance < closest.distance))) {

                if (range === Infinity) {
                    inRange = true;
                }

                closest.target = target;
                closest.distance = distance;
                closest.range = range;
                closest.inRange = inRange;
                closest.dx = dx;
                closest.dy = dy;

                status.range = range;
            }
        }

        var snapChanged;

        if (closest.target) {
            snapChanged = (status.snappedX !== closest.target.x || status.snappedY !== closest.target.y);

            status.snappedX = closest.target.x;
            status.snappedY = closest.target.y;
        }
        else {
            snapChanged = true;

            status.snappedX = NaN;
            status.snappedY = NaN;
        }

        status.dx = closest.dx;
        status.dy = closest.dy;

        status.changed = (snapChanged || (closest.inRange && !status.locked));
        status.locked = closest.inRange;

        return status;
    },

    setRestriction: function (pageCoords, status) {
        var target = this.target,
            restrict = target && target.options[this.prepared.name].restrict,
            restriction = restrict && restrict.restriction,
            page;

        if (!restriction) {
            return status;
        }

        status = status || this.restrictStatus;

        page = status.useStatusXY
            ? page = { x: status.x, y: status.y }
            : page = utils.extend({}, pageCoords);

        if (status.snap && status.snap.locked) {
            page.x += status.snap.dx || 0;
            page.y += status.snap.dy || 0;
        }

        page.x -= this.inertiaStatus.resumeDx;
        page.y -= this.inertiaStatus.resumeDy;

        status.dx = 0;
        status.dy = 0;
        status.restricted = false;

        var rect, restrictedX, restrictedY;

        if (scope.isString(restriction)) {
            if (restriction === 'parent') {
                restriction = scope.parentElement(this.element);
            }
            else if (restriction === 'self') {
                restriction = target.getRect(this.element);
            }
            else {
                restriction = scope.closest(this.element, restriction);
            }

            if (!restriction) { return status; }
        }

        if (scope.isFunction(restriction)) {
            restriction = restriction(page.x, page.y, this.element);
        }

        if (utils.isElement(restriction)) {
            restriction = scope.getElementRect(restriction);
        }

        rect = restriction;

        if (!restriction) {
            restrictedX = page.x;
            restrictedY = page.y;
        }
        // object is assumed to have
        // x, y, width, height or
        // left, top, right, bottom
        else if ('x' in restriction && 'y' in restriction) {
            restrictedX = Math.max(Math.min(rect.x + rect.width  - this.restrictOffset.right , page.x), rect.x + this.restrictOffset.left);
            restrictedY = Math.max(Math.min(rect.y + rect.height - this.restrictOffset.bottom, page.y), rect.y + this.restrictOffset.top );
        }
        else {
            restrictedX = Math.max(Math.min(rect.right  - this.restrictOffset.right , page.x), rect.left + this.restrictOffset.left);
            restrictedY = Math.max(Math.min(rect.bottom - this.restrictOffset.bottom, page.y), rect.top  + this.restrictOffset.top );
        }

        status.dx = restrictedX - page.x;
        status.dy = restrictedY - page.y;

        status.changed = status.restrictedX !== restrictedX || status.restrictedY !== restrictedY;
        status.restricted = !!(status.dx || status.dy);

        status.restrictedX = restrictedX;
        status.restrictedY = restrictedY;

        return status;
    },

    checkAndPreventDefault: function (event, interactable, element) {
        if (!(interactable = interactable || this.target)) { return; }

        var options = interactable.options,
            prevent = options.preventDefault;

        if (prevent === 'auto' && element && !/^(input|select|textarea)$/i.test(event.target.nodeName)) {
            // do not preventDefault on pointerdown if the prepared action is a drag
            // and dragging can only start from a certain direction - this allows
            // a touch to pan the viewport if a drag isn't in the right direction
            if (/down|start/i.test(event.type)
                && this.prepared.name === 'drag' && options.drag.axis !== 'xy') {

                return;
            }

            // with manualStart, only preventDefault while interacting
            if (options[this.prepared.name] && options[this.prepared.name].manualStart
                && !this.interacting()) {
                return;
            }

            event.preventDefault();
            return;
        }

        if (prevent === 'always') {
            event.preventDefault();
            return;
        }
    },

    calcInertia: function (status) {
        var inertiaOptions = this.target.options[this.prepared.name].inertia,
            lambda = inertiaOptions.resistance,
            inertiaDur = -Math.log(inertiaOptions.endSpeed / status.v0) / lambda;

        status.x0 = this.prevEvent.pageX;
        status.y0 = this.prevEvent.pageY;
        status.t0 = status.startEvent.timeStamp / 1000;
        status.sx = status.sy = 0;

        status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
        status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
        status.te = inertiaDur;

        status.lambda_v0 = lambda / status.v0;
        status.one_ve_v0 = 1 - inertiaOptions.endSpeed / status.v0;
    },

    autoScrollMove: function (pointer) {
        if (!(this.interacting()
            && scope.checkAutoScroll(this.target, this.prepared.name))) {
            return;
        }

        if (this.inertiaStatus.active) {
            scope.autoScroll.x = scope.autoScroll.y = 0;
            return;
        }

        var top,
            right,
            bottom,
            left,
            options = this.target.options[this.prepared.name].autoScroll,
            container = options.container || scope.getWindow(this.element);

        if (scope.isWindow(container)) {
            left   = pointer.clientX < scope.autoScroll.margin;
            top    = pointer.clientY < scope.autoScroll.margin;
            right  = pointer.clientX > container.innerWidth  - scope.autoScroll.margin;
            bottom = pointer.clientY > container.innerHeight - scope.autoScroll.margin;
        }
        else {
            var rect = scope.getElementRect(container);

            left   = pointer.clientX < rect.left   + scope.autoScroll.margin;
            top    = pointer.clientY < rect.top    + scope.autoScroll.margin;
            right  = pointer.clientX > rect.right  - scope.autoScroll.margin;
            bottom = pointer.clientY > rect.bottom - scope.autoScroll.margin;
        }

        scope.autoScroll.x = (right ? 1: left? -1: 0);
        scope.autoScroll.y = (bottom? 1:  top? -1: 0);

        if (!scope.autoScroll.isScrolling) {
            // set the autoScroll properties to those of the target
            scope.autoScroll.margin = options.margin;
            scope.autoScroll.speed  = options.speed;

            scope.autoScroll.start(this);
        }
    },

    _updateEventTargets: function (target, currentTarget) {
        this._eventTarget    = target;
        this._curEventTarget = currentTarget;
    }

};

module.exports = Interaction;

},{"./InteractEvent":2,"./scope":9,"./utils":16,"./utils/browser":11,"./utils/events":13}],5:[function(require,module,exports){
'use strict';

var raf       = require('./utils/raf'),
    getWindow = require('./utils/window').getWindow,
    isWindow  = require('./utils/isType').isWindow;

var autoScroll = {

    interaction: null,
    i: null,    // the handle returned by window.setInterval
    x: 0, y: 0, // Direction each pulse is to scroll in

    isScrolling: false,
    prevTime: 0,

    start: function (interaction) {
        autoScroll.isScrolling = true;
        raf.cancel(autoScroll.i);

        autoScroll.interaction = interaction;
        autoScroll.prevTime = new Date().getTime();
        autoScroll.i = raf.request(autoScroll.scroll);
    },

    stop: function () {
        autoScroll.isScrolling = false;
        raf.cancel(autoScroll.i);
    },

    // scroll the window by the values in scroll.x/y
    scroll: function () {
        var options = autoScroll.interaction.target.options[autoScroll.interaction.prepared.name].autoScroll,
            container = options.container || getWindow(autoScroll.interaction.element),
            now = new Date().getTime(),
            // change in time in seconds
            dt = (now - autoScroll.prevTime) / 1000,
            // displacement
            s = options.speed * dt;

        if (s >= 1) {
            if (isWindow(container)) {
                container.scrollBy(autoScroll.x * s, autoScroll.y * s);
            }
            else if (container) {
                container.scrollLeft += autoScroll.x * s;
                container.scrollTop  += autoScroll.y * s;
            }

            autoScroll.prevTime = now;
        }

        if (autoScroll.isScrolling) {
            raf.cancel(autoScroll.i);
            autoScroll.i = raf.request(autoScroll.scroll);
        }
    }
};

module.exports = autoScroll;

},{"./utils/isType":17,"./utils/raf":20,"./utils/window":21}],6:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var scope = require('./scope');

function checkResizeEdge (name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) { return false; }

    // true value, use pointer coords and element rect
    if (value === true) {
        // if dimensions are negative, "switch" edges
        var width = scope.isNumber(rect.width)? rect.width : rect.right - rect.left,
            height = scope.isNumber(rect.height)? rect.height : rect.bottom - rect.top;

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
        : scope.matchesUpTo(element, value, interactableElement);
}


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
},{"./scope":9,"./utils":16}],7:[function(require,module,exports){
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

        axis: 'xy'
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

},{"./utils/domObjects":12}],8:[function(require,module,exports){
'use strict';

var events = require('./utils/events');
var scope = require('./scope');
var browser = require('./utils/browser');
var utils = require('./utils');
var Interaction = require('./Interaction');

var listeners = scope.listeners;

// {
//      type: {
//          selectors: ['selector', ...],
//          contexts : [document, ...],
//          listeners: [[listener, useCapture], ...]
//      }
//  }
var delegatedEvents = {};

var interactionListeners = [
    'dragStart',
    'dragMove',
    'resizeStart',
    'resizeMove',
    'gestureStart',
    'gestureMove',
    'pointerOver',
    'pointerOut',
    'pointerHover',
    'selectorDown',
    'pointerDown',
    'pointerMove',
    'pointerUp',
    'pointerCancel',
    'pointerEnd',
    'addPointer',
    'removePointer',
    'recordPointer',
    'autoScrollMove'
];

function endAllInteractions (event) {
    for (var i = 0; i < scope.interactions.length; i++) {
        scope.interactions[i].pointerEnd(event, event);
    }
}

function listenToDocument (doc) {
    if (scope.contains(scope.documents, doc)) { return; }

    var win = doc.defaultView || doc.parentWindow;

    // add delegate event listener
    for (var eventType in delegatedEvents) {
        events.add(doc, eventType, delegateListener);
        events.add(doc, eventType, delegateUseCapture, true);
    }

    if (scope.PointerEvent) {
        if (scope.PointerEvent === win.MSPointerEvent) {
            scope.pEventTypes = {
                up: 'MSPointerUp', down: 'MSPointerDown', over: 'mouseover',
                out: 'mouseout', move: 'MSPointerMove', cancel: 'MSPointerCancel' };
        }
        else {
            scope.pEventTypes = {
                up: 'pointerup', down: 'pointerdown', over: 'pointerover',
                out: 'pointerout', move: 'pointermove', cancel: 'pointercancel' };
        }

        events.add(doc, scope.pEventTypes.down  , listeners.selectorDown );
        events.add(doc, scope.pEventTypes.move  , listeners.pointerMove  );
        events.add(doc, scope.pEventTypes.over  , listeners.pointerOver  );
        events.add(doc, scope.pEventTypes.out   , listeners.pointerOut   );
        events.add(doc, scope.pEventTypes.up    , listeners.pointerUp    );
        events.add(doc, scope.pEventTypes.cancel, listeners.pointerCancel);

        // autoscroll
        events.add(doc, scope.pEventTypes.move, listeners.autoScrollMove);
    }
    else {
        events.add(doc, 'mousedown', listeners.selectorDown);
        events.add(doc, 'mousemove', listeners.pointerMove );
        events.add(doc, 'mouseup'  , listeners.pointerUp   );
        events.add(doc, 'mouseover', listeners.pointerOver );
        events.add(doc, 'mouseout' , listeners.pointerOut  );

        events.add(doc, 'touchstart' , listeners.selectorDown );
        events.add(doc, 'touchmove'  , listeners.pointerMove  );
        events.add(doc, 'touchend'   , listeners.pointerUp    );
        events.add(doc, 'touchcancel', listeners.pointerCancel);

        // autoscroll
        events.add(doc, 'mousemove', listeners.autoScrollMove);
        events.add(doc, 'touchmove', listeners.autoScrollMove);
    }

    events.add(win, 'blur', endAllInteractions);

    try {
        if (win.frameElement) {
            var parentDoc = win.frameElement.ownerDocument,
                parentWindow = parentDoc.defaultView;

            events.add(parentDoc   , 'mouseup'      , listeners.pointerEnd);
            events.add(parentDoc   , 'touchend'     , listeners.pointerEnd);
            events.add(parentDoc   , 'touchcancel'  , listeners.pointerEnd);
            events.add(parentDoc   , 'pointerup'    , listeners.pointerEnd);
            events.add(parentDoc   , 'MSPointerUp'  , listeners.pointerEnd);
            events.add(parentWindow, 'blur'         , endAllInteractions );
        }
    }
    catch (error) {
    }

    if (events.useAttachEvent) {
        // For IE's lack of Event#preventDefault
        events.add(doc, 'selectstart', function (event) {
            var interaction = scope.interactions[0];

            if (interaction.currentAction()) {
                interaction.checkAndPreventDefault(event);
            }
        });

        // For IE's bad dblclick event sequence
        events.add(doc, 'dblclick', doOnInteractions('ie8Dblclick'));
    }

    scope.documents.push(doc);
}

function doOnInteractions (method) {
    return (function (event) {
        var interaction,
            eventTarget = scope.getActualElement(event.path
                ? event.path[0]
                : event.target),
            curEventTarget = scope.getActualElement(event.currentTarget),
            i;

        if (browser.supportsTouch && /touch/.test(event.type)) {
            scope.prevTouchTime = new Date().getTime();

            for (i = 0; i < event.changedTouches.length; i++) {
                var pointer = event.changedTouches[i];

                interaction = getInteractionFromPointer(pointer, event.type, eventTarget);

                if (!interaction) { continue; }

                interaction._updateEventTargets(eventTarget, curEventTarget);

                interaction[method](pointer, event, eventTarget, curEventTarget);
            }
        }
        else {
            if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
                // ignore mouse events while touch interactions are active
                for (i = 0; i < scope.interactions.length; i++) {
                    if (!scope.interactions[i].mouse && scope.interactions[i].pointerIsDown) {
                        return;
                    }
                }

                // try to ignore mouse events that are simulated by the browser
                // after a touch event
                if (new Date().getTime() - scope.prevTouchTime < 500) {
                    return;
                }
            }

            interaction = getInteractionFromPointer(event, event.type, eventTarget);

            if (!interaction) { return; }

            interaction._updateEventTargets(eventTarget, curEventTarget);

            interaction[method](event, event, eventTarget, curEventTarget);
        }
    });
}

// bound to the interactable context when a DOM event
// listener is added to a selector interactable
function delegateListener (event, useCapture) {
    var fakeEvent = {},
        delegated = delegatedEvents[event.type],
        eventTarget = scope.getActualElement(event.path
            ? event.path[0]
            : event.target),
        element = eventTarget;

    useCapture = useCapture? true: false;

    // duplicate the event so that currentTarget can be changed
    for (var prop in event) {
        fakeEvent[prop] = event[prop];
    }

    fakeEvent.originalEvent = event;
    fakeEvent.preventDefault = preventOriginalDefault;

    // climb up document tree looking for selector matches
    while (utils.isElement(element)) {
        for (var i = 0; i < delegated.selectors.length; i++) {
            var selector = delegated.selectors[i],
                context = delegated.contexts[i];

            if (scope.matchesSelector(element, selector)
                && scope.nodeContains(context, eventTarget)
                && scope.nodeContains(context, element)) {

                var listeners = delegated.listeners[i];

                fakeEvent.currentTarget = element;

                for (var j = 0; j < listeners.length; j++) {
                    if (listeners[j][1] === useCapture) {
                        listeners[j][0](fakeEvent);
                    }
                }
            }
        }

        element = scope.parentElement(element);
    }
}

function getInteractionFromPointer (pointer, eventType, eventTarget) {
    var i = 0, len = scope.interactions.length,
        mouseEvent = (/mouse/i.test(pointer.pointerType || eventType)
            // MSPointerEvent.MSPOINTER_TYPE_MOUSE
        || pointer.pointerType === 4),
        interaction;

    var id = utils.getPointerId(pointer);

    // try to resume inertia with a new pointer
    if (/down|start/i.test(eventType)) {
        for (i = 0; i < len; i++) {
            interaction = scope.interactions[i];

            var element = eventTarget;

            if (interaction.inertiaStatus.active && interaction.target.options[interaction.prepared.name].inertia.allowResume
                && (interaction.mouse === mouseEvent)) {
                while (element) {
                    // if the element is the interaction element
                    if (element === interaction.element) {
                        // update the interaction's pointer
                        if (interaction.pointers[0]) {
                            interaction.removePointer(interaction.pointers[0]);
                        }
                        interaction.addPointer(pointer);

                        return interaction;
                    }
                    element = scope.parentElement(element);
                }
            }
        }
    }

    // if it's a mouse interaction
    if (mouseEvent || !(browser.supportsTouch || browser.supportsPointerEvent)) {

        // find a mouse interaction that's not in inertia phase
        for (i = 0; i < len; i++) {
            if (scope.interactions[i].mouse && !scope.interactions[i].inertiaStatus.active) {
                return scope.interactions[i];
            }
        }

        // find any interaction specifically for mouse.
        // if the eventType is a mousedown, and inertia is active
        // ignore the interaction
        for (i = 0; i < len; i++) {
            if (scope.interactions[i].mouse && !(/down/.test(eventType) && scope.interactions[i].inertiaStatus.active)) {
                return interaction;
            }
        }

        // create a new interaction for mouse
        interaction = new Interaction();
        interaction.mouse = true;

        return interaction;
    }

    // get interaction that has this pointer
    for (i = 0; i < len; i++) {
        if (scope.contains(scope.interactions[i].pointerIds, id)) {
            return scope.interactions[i];
        }
    }

    // at this stage, a pointerUp should not return an interaction
    if (/up|end|out/i.test(eventType)) {
        return null;
    }

    // get first idle interaction
    for (i = 0; i < len; i++) {
        interaction = scope.interactions[i];

        if ((!interaction.prepared.name || (interaction.target.options.gesture.enabled))
            && !interaction.interacting()
            && !(!mouseEvent && interaction.mouse)) {

            interaction.addPointer(pointer);

            return interaction;
        }
    }

    return new Interaction();
}

function preventOriginalDefault () {
    this.originalEvent.preventDefault();
}

function delegateUseCapture (event) {
    return delegateListener.call(this, event, true);
}

function bindInteractionListeners() {
    for (var i = 0, len = interactionListeners.length; i < len; i++) {
        var listenerName = interactionListeners[i];

        listeners[listenerName] = doOnInteractions(listenerName);
    }
}

var listener = {
    listenToDocument: listenToDocument,
    bindInteractionListeners: bindInteractionListeners,
    listeners: listeners,
    delegatedEvents: delegatedEvents,
    delegateListener: delegateListener,
    delegateUseCapture: delegateUseCapture
};

module.exports = listener;
},{"./Interaction":4,"./scope":9,"./utils":16,"./utils/browser":11,"./utils/events":13}],9:[function(require,module,exports){
'use strict';


var browser = require('./utils/browser');

var scope = {};
var extend = require('./utils/extend');
var utils = require('./utils/isType');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));
extend(scope, require('./utils/arr.js'));
extend(scope, require('./utils/isType'));

scope.pEventTypes = null;

scope.documents       = [];   // all documents being listened to

scope.interactables   = [];   // all set interactables
scope.interactions    = [];   // all interactions

scope.listeners = {};

scope.dynamicDrop     = false;

scope.defaultOptions = require('./defaultOptions');

// Things related to autoScroll
scope.autoScroll = require('./autoScroll');

// Less Precision with touch input
scope.margin = browser.supportsTouch || browser.supportsPointerEvent? 20: 10;

scope.pointerMoveTolerance = 1;

// for ignoring browser's simulated mouse events
scope.prevTouchTime = 0;

// Allow this many interactions to happen simultaneously
scope.maxInteractions = Infinity;

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

scope.actionIsEnabled = {
    drag   : true,
    resize : true,
    gesture: true
};

// because Webkit and Opera still use 'mousewheel' event type
scope.wheelEvent = 'onmousewheel' in scope.document? 'mousewheel': 'wheel';

scope.eventTypes = [
    'dragstart',
    'dragmove',
    'draginertiastart',
    'dragend',
    'dragenter',
    'dragleave',
    'dropactivate',
    'dropdeactivate',
    'dropmove',
    'drop',
    'resizestart',
    'resizemove',
    'resizeinertiastart',
    'resizeend',
    'gesturestart',
    'gesturemove',
    'gestureinertiastart',
    'gestureend',

    'down',
    'move',
    'up',
    'cancel',
    'tap',
    'doubletap',
    'hold'
];

scope.globalEvents = {};

// will be polyfill function if browser is IE8
scope.ie8MatchesSelector = null;

scope.trySelector = function (value) {
    if (!scope.isString(value)) { return false; }

    // an exception will be raised if it is invalid
    scope.document.querySelector(value);
    return true;
};

scope.getScrollXY = function (win) {
    win = win || scope.window;
    return {
        x: win.scrollX || win.document.documentElement.scrollLeft,
        y: win.scrollY || win.document.documentElement.scrollTop
    };
};

scope.getActualElement = function (element) {
    return (element instanceof scope.SVGElementInstance
        ? element.correspondingUseElement
        : element);
};

scope.getElementRect = function (element) {
    var scroll = browser.isIOS7orLower
            ? { x: 0, y: 0 }
            : scope.getScrollXY(scope.getWindow(element)),
        clientRect = (element instanceof scope.SVGElement)?
            element.getBoundingClientRect():
            element.getClientRects()[0];

    return clientRect && {
            left  : clientRect.left   + scroll.x,
            right : clientRect.right  + scroll.x,
            top   : clientRect.top    + scroll.y,
            bottom: clientRect.bottom + scroll.y,
            width : clientRect.width || clientRect.right - clientRect.left,
            height: clientRect.heigh || clientRect.bottom - clientRect.top
        };
};

scope.getOriginXY = function (interactable, element) {
    var origin = interactable
        ? interactable.options.origin
        : scope.defaultOptions.origin;

    if (origin === 'parent') {
        origin = scope.parentElement(element);
    }
    else if (origin === 'self') {
        origin = interactable.getRect(element);
    }
    else if (scope.trySelector(origin)) {
        origin = scope.closest(element, origin) || { x: 0, y: 0 };
    }

    if (scope.isFunction(origin)) {
        origin = origin(interactable && element);
    }

    if (utils.isElement(origin))  {
        origin = scope.getElementRect(origin);
    }

    origin.x = ('x' in origin)? origin.x : origin.left;
    origin.y = ('y' in origin)? origin.y : origin.top;

    return origin;
};

// http://stackoverflow.com/a/5634528/2280888
scope._getQBezierValue = function (t, p1, p2, p3) {
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
};

scope.getQuadraticCurvePoint = function (startX, startY, cpX, cpY, endX, endY, position) {
    return {
        x:  scope._getQBezierValue(position, startX, cpX, endX),
        y:  scope._getQBezierValue(position, startY, cpY, endY)
    };
};

// http://gizma.com/easing/
scope.easeOutQuad = function (t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
};

scope.nodeContains = function (parent, child) {
    while (child) {
        if (child === parent) {
            return true;
        }

        child = child.parentNode;
    }

    return false;
};

scope.closest = function (child, selector) {
    var parent = scope.parentElement(child);

    while (utils.isElement(parent)) {
        if (scope.matchesSelector(parent, selector)) { return parent; }

        parent = scope.parentElement(parent);
    }

    return null;
};

scope.parentElement = function (node) {
    var parent = node.parentNode;

    if (scope.isDocFrag(parent)) {
        // skip past #shado-root fragments
        while ((parent = parent.host) && scope.isDocFrag(parent)) {}

        return parent;
    }

    return parent;
};

scope.inContext = function (interactable, element) {
    return interactable._context === element.ownerDocument
        || scope.nodeContains(interactable._context, element);
};

scope.testIgnore = function (interactable, interactableElement, element) {
    var ignoreFrom = interactable.options.ignoreFrom;

    if (!ignoreFrom || !utils.isElement(element)) { return false; }

    if (scope.isString(ignoreFrom)) {
        return scope.matchesUpTo(element, ignoreFrom, interactableElement);
    }
    else if (utils.isElement(ignoreFrom)) {
        return scope.nodeContains(ignoreFrom, element);
    }

    return false;
};

scope.testAllow = function (interactable, interactableElement, element) {
    var allowFrom = interactable.options.allowFrom;

    if (!allowFrom) { return true; }

    if (!utils.isElement(element)) { return false; }

    if (scope.isString(allowFrom)) {
        return scope.matchesUpTo(element, allowFrom, interactableElement);
    }
    else if (utils.isElement(allowFrom)) {
        return scope.nodeContains(allowFrom, element);
    }

    return false;
};

scope.checkAxis = function (axis, interactable) {
    if (!interactable) { return false; }

    var thisAxis = interactable.options.drag.axis;

    return (axis === 'xy' || thisAxis === 'xy' || thisAxis === axis);
};

scope.checkSnap = function (interactable, action) {
    var options = interactable.options;

    if (/^resize/.test(action)) {
        action = 'resize';
    }

    return options[action].snap && options[action].snap.enabled;
};

scope.checkRestrict = function (interactable, action) {
    var options = interactable.options;

    if (/^resize/.test(action)) {
        action = 'resize';
    }

    return  options[action].restrict && options[action].restrict.enabled;
};

scope.checkAutoScroll = function (interactable, action) {
    var options = interactable.options;

    if (/^resize/.test(action)) {
        action = 'resize';
    }

    return  options[action].autoScroll && options[action].autoScroll.enabled;
};

scope.withinInteractionLimit = function (interactable, element, action) {
    var options = interactable.options,
        maxActions = options[action.name].max,
        maxPerElement = options[action.name].maxPerElement,
        activeInteractions = 0,
        targetCount = 0,
        targetElementCount = 0;

    for (var i = 0, len = scope.interactions.length; i < len; i++) {
        var interaction = scope.interactions[i],
            otherAction = interaction.prepared.name,
            active = interaction.interacting();

        if (!active) { continue; }

        activeInteractions++;

        if (activeInteractions >= scope.maxInteractions) {
            return false;
        }

        if (interaction.target !== interactable) { continue; }

        targetCount += (otherAction === action.name)|0;

        if (targetCount >= maxActions) {
            return false;
        }

        if (interaction.element === element) {
            targetElementCount++;

            if (otherAction !== action.name || targetElementCount >= maxPerElement) {
                return false;
            }
        }
    }

    return scope.maxInteractions > 0;
};

// Test for the element that's "above" all other qualifiers
scope.indexOfDeepestElement = function (elements) {
    var dropzone,
        deepestZone = elements[0],
        index = deepestZone? 0: -1,
        parent,
        deepestZoneParents = [],
        dropzoneParents = [],
        child,
        i,
        n;

    for (i = 1; i < elements.length; i++) {
        dropzone = elements[i];

        // an element might belong to multiple selector dropzones
        if (!dropzone || dropzone === deepestZone) {
            continue;
        }

        if (!deepestZone) {
            deepestZone = dropzone;
            index = i;
            continue;
        }

        // check if the deepest or current are document.documentElement or document.rootElement
        // - if the current dropzone is, do nothing and continue
        if (dropzone.parentNode === dropzone.ownerDocument) {
            continue;
        }
        // - if deepest is, update with the current dropzone and continue to next
        else if (deepestZone.parentNode === dropzone.ownerDocument) {
            deepestZone = dropzone;
            index = i;
            continue;
        }

        if (!deepestZoneParents.length) {
            parent = deepestZone;
            while (parent.parentNode && parent.parentNode !== parent.ownerDocument) {
                deepestZoneParents.unshift(parent);
                parent = parent.parentNode;
            }
        }

        // if this element is an svg element and the current deepest is
        // an HTMLElement
        if (deepestZone instanceof scope.HTMLElement
            && dropzone instanceof scope.SVGElement
            && !(dropzone instanceof scope.SVGSVGElement)) {

            if (dropzone === deepestZone.parentNode) {
                continue;
            }

            parent = dropzone.ownerSVGElement;
        }
        else {
            parent = dropzone;
        }

        dropzoneParents = [];

        while (parent.parentNode !== parent.ownerDocument) {
            dropzoneParents.unshift(parent);
            parent = parent.parentNode;
        }

        n = 0;

        // get (position of last common ancestor) + 1
        while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
            n++;
        }

        var parents = [
            dropzoneParents[n - 1],
            dropzoneParents[n],
            deepestZoneParents[n]
        ];

        child = parents[0].lastChild;

        while (child) {
            if (child === parents[1]) {
                deepestZone = dropzone;
                index = i;
                deepestZoneParents = [];

                break;
            }
            else if (child === parents[2]) {
                break;
            }

            child = child.previousSibling;
        }
    }

    return index;
};

scope.matchesSelector = function (element, selector, nodeList) {
    if (scope.ie8MatchesSelector) {
        return scope.ie8MatchesSelector(element, selector, nodeList);
    }

    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (scope.window !== scope.realWindow) {
        selector = selector.replace(/\/deep\//g, ' ');
    }

    return element[browser.prefixedMatchesSelector](selector);
};

scope.matchesUpTo = function (element, selector, limit) {
    while (utils.isElement(element)) {
        if (scope.matchesSelector(element, selector)) {
            return true;
        }

        element = scope.parentElement(element);

        if (element === limit) {
            return scope.matchesSelector(element, selector);
        }
    }

    return false;
};

// For IE8's lack of an Element#matchesSelector
// taken from http://tanalin.com/en/blog/2012/12/matches-selector-ie8/ and modified
if (!(browser.prefixedMatchesSelector in Element.prototype) || !scope.isFunction(Element.prototype[browser.prefixedMatchesSelector])) {
    scope.ie8MatchesSelector = function (element, selector, elems) {
        elems = elems || element.parentNode.querySelectorAll(selector);

        for (var i = 0, len = elems.length; i < len; i++) {
            if (elems[i] === element) {
                return true;
            }
        }

        return false;
    };
}



module.exports = scope;

},{"./autoScroll":5,"./defaultOptions":7,"./utils/arr.js":10,"./utils/browser":11,"./utils/domObjects":12,"./utils/extend":14,"./utils/isType":17,"./utils/window":21}],10:[function(require,module,exports){
'use strict';

function indexOf (array, target) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (array[i] === target) {
            return i;
        }
    }

    return -1;
}

function contains (array, target) {
    return indexOf(array, target) !== -1;
}

module.exports = {
    indexOf: indexOf,
    contains: contains
};

},{}],11:[function(require,module,exports){
'use strict';

var win = require('./window'),
    domObjects = require('./domObjects');

var browser = {
    // Does the browser support touch input?
    supportsTouch : !!(('ontouchstart' in win) || win.window.DocumentTouch
        && domObjects.document instanceof win.DocumentTouch),

    // Does the browser support PointerEvents
    supportsPointerEvent : !!domObjects.PointerEvent,

    // Opera Mobile must be handled differently
    isOperaMobile : (navigator.appName === 'Opera'
        && browser.supportsTouch
        && navigator.userAgent.match('Presto')),

    // scrolling doesn't change the result of
    // getBoundingClientRect/getClientRects on iOS <=7 but it does on iOS 8
    isIOS7orLower : (/iP(hone|od|ad)/.test(navigator.platform) && /OS [1-7][^\d]/.test(navigator.appVersion)),

    isIe9OrOlder : domObjects.document.all && !win.window.atob,

    // prefix matchesSelector
    prefixedMatchesSelector: 'matches' in Element.prototype?
            'matches': 'webkitMatchesSelector' in Element.prototype?
                'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype?
                    'mozMatchesSelector': 'oMatchesSelector' in Element.prototype?
                        'oMatchesSelector': 'msMatchesSelector'

};

module.exports = browser;

},{"./domObjects":12,"./window":21}],12:[function(require,module,exports){
'use strict';

var domObjects = {},
    win = require('./window').window,
    blank = function () {};

domObjects.document           = win.document;
domObjects.DocumentFragment   = win.DocumentFragment   || blank;
domObjects.SVGElement         = win.SVGElement         || blank;
domObjects.SVGSVGElement      = win.SVGSVGElement      || blank;
domObjects.SVGElementInstance = win.SVGElementInstance || blank;
domObjects.HTMLElement        = win.HTMLElement        || win.Element;

domObjects.PointerEvent = (win.PointerEvent || win.MSPointerEvent);

module.exports = domObjects;

},{"./window":21}],13:[function(require,module,exports){
'use strict';

var arr = require('./arr'),
    indexOf  = arr.indexOf,
    contains = arr.contains,
    getWindow = require('./window').getWindow,

    useAttachEvent = ('attachEvent' in window) && !('addEventListener' in window),
    addEvent       = useAttachEvent?  'attachEvent': 'addEventListener',
    removeEvent    = useAttachEvent?  'detachEvent': 'removeEventListener',
    on             = useAttachEvent? 'on': '',

    elements          = [],
    targets           = [],
    attachedListeners = [];

function add (element, type, listener, useCapture) {
    var elementIndex = indexOf(elements, element),
        target = targets[elementIndex];

    if (!target) {
        target = {
            events: {},
            typeCount: 0
        };

        elementIndex = elements.push(element) - 1;
        targets.push(target);

        attachedListeners.push((useAttachEvent ? {
                supplied: [],
                wrapped : [],
                useCount: []
            } : null));
    }

    if (!target.events[type]) {
        target.events[type] = [];
        target.typeCount++;
    }

    if (!contains(target.events[type], listener)) {
        var ret;

        if (useAttachEvent) {
            var listeners = attachedListeners[elementIndex],
                listenerIndex = indexOf(listeners.supplied, listener);

            var wrapped = listeners.wrapped[listenerIndex] || function (event) {
                if (!event.immediatePropagationStopped) {
                    event.target = event.srcElement;
                    event.currentTarget = element;

                    event.preventDefault = event.preventDefault || preventDef;
                    event.stopPropagation = event.stopPropagation || stopProp;
                    event.stopImmediatePropagation = event.stopImmediatePropagation || stopImmProp;

                    if (/mouse|click/.test(event.type)) {
                        event.pageX = event.clientX + getWindow(element).document.documentElement.scrollLeft;
                        event.pageY = event.clientY + getWindow(element).document.documentElement.scrollTop;
                    }

                    listener(event);
                }
            };

            ret = element[addEvent](on + type, wrapped, !!useCapture);

            if (listenerIndex === -1) {
                listeners.supplied.push(listener);
                listeners.wrapped.push(wrapped);
                listeners.useCount.push(1);
            }
            else {
                listeners.useCount[listenerIndex]++;
            }
        }
        else {
            ret = element[addEvent](type, listener, !!useCapture);
        }
        target.events[type].push(listener);

        return ret;
    }
}

function remove (element, type, listener, useCapture) {
    var i,
        elementIndex = indexOf(elements, element),
        target = targets[elementIndex],
        listeners,
        listenerIndex,
        wrapped = listener;

    if (!target || !target.events) {
        return;
    }

    if (useAttachEvent) {
        listeners = attachedListeners[elementIndex];
        listenerIndex = indexOf(listeners.supplied, listener);
        wrapped = listeners.wrapped[listenerIndex];
    }

    if (type === 'all') {
        for (type in target.events) {
            if (target.events.hasOwnProperty(type)) {
                remove(element, type, 'all');
            }
        }
        return;
    }

    if (target.events[type]) {
        var len = target.events[type].length;

        if (listener === 'all') {
            for (i = 0; i < len; i++) {
                remove(element, type, target.events[type][i], !!useCapture);
            }
            return;
        } else {
            for (i = 0; i < len; i++) {
                if (target.events[type][i] === listener) {
                    element[removeEvent](on + type, wrapped, !!useCapture);
                    target.events[type].splice(i, 1);

                    if (useAttachEvent && listeners) {
                        listeners.useCount[listenerIndex]--;
                        if (listeners.useCount[listenerIndex] === 0) {
                            listeners.supplied.splice(listenerIndex, 1);
                            listeners.wrapped.splice(listenerIndex, 1);
                            listeners.useCount.splice(listenerIndex, 1);
                        }
                    }

                    break;
                }
            }
        }

        if (target.events[type] && target.events[type].length === 0) {
            target.events[type] = null;
            target.typeCount--;
        }
    }

    if (!target.typeCount) {
        targets.splice(elementIndex, 1);
        elements.splice(elementIndex, 1);
        attachedListeners.splice(elementIndex, 1);
    }
}

function preventDef () {
    this.returnValue = false;
}

function stopProp () {
    this.cancelBubble = true;
}

function stopImmProp () {
    this.cancelBubble = true;
    this.immediatePropagationStopped = true;
}

module.exports = {
    add: add,
    remove: remove,
    useAttachEvent: useAttachEvent,

    _elements: elements,
    _targets: targets,
    _attachedListeners: attachedListeners
};

},{"./arr":10,"./window":21}],14:[function(require,module,exports){
'use strict';

module.exports = function extend (dest, source) {
    for (var prop in source) {
        dest[prop] = source[prop];
    }
    return dest;
};

},{}],15:[function(require,module,exports){
'use strict';

module.exports = function hypot (x, y) { return Math.sqrt(x * x + y * y); };

},{}],16:[function(require,module,exports){
'use strict';

var utils = module.exports,
    extend = require('./extend'),
    win = require('./window');

utils.blank  = function () {};

utils.warnOnce = function (method, message) {
    var warned = false;

    return function () {
        if (!warned) {
            win.window.console.warn(message);
            warned = true;
        }

        return method.apply(this, arguments);
    };
};

utils.extend  = extend;
utils.hypot   = require('./hypot');
utils.raf     = require('./raf');
utils.browser = require('./browser');

extend(utils, require('./arr'));
extend(utils, require('./isType'));
extend(utils, require('./pointerUtils'));

},{"./arr":10,"./browser":11,"./extend":14,"./hypot":15,"./isType":17,"./pointerUtils":19,"./raf":20,"./window":21}],17:[function(require,module,exports){
'use strict';

var win = require('./window'),
    domObjects = require('./domObjects');

var isType = {
    isElement : function (o) {
        if (!o || (typeof o !== 'object')) { return false; }
    
        var _window = win.getWindow(o) || win.window;
    
        return (/object|function/.test(typeof _window.Element)
            ? o instanceof _window.Element //DOM2
            : o.nodeType === 1 && typeof o.nodeName === "string");
    },

    isArray    : null,
    
    isWindow   : require('./isWindow'),

    isDocFrag  : function (thing) { return !!thing && thing instanceof domObjects.DocumentFragment; },

    isObject   : function (thing) { return !!thing && (typeof thing === 'object'); },

    isFunction : function (thing) { return typeof thing === 'function'; },

    isNumber   : function (thing) { return typeof thing === 'number'  ; },

    isBool     : function (thing) { return typeof thing === 'boolean' ; },

    isString   : function (thing) { return typeof thing === 'string'  ; }
    
};

isType.isArray = function (thing) {
    return isType.isObject(thing)
        && (typeof thing.length !== 'undefined')
        && isType.isFunction(thing.splice);
};

module.exports = isType;

},{"./domObjects":12,"./isWindow":18,"./window":21}],18:[function(require,module,exports){
'use strict';

module.exports = function isWindow (thing) {
    return !!(thing && thing.Window) && (thing instanceof thing.Window);
};

},{}],19:[function(require,module,exports){
'use strict';

var pointerUtils = {},
    // reduce object creation in getXY()
    tmpXY = {},
    win = require('./window'),
    hypot = require('./hypot'),
    extend = require('./extend'),
    browser = require('./browser'),
    isType = require('./isType'),
    InteractEvent = require('../InteractEvent');

pointerUtils.copyCoords = function (dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;

    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;

    dest.timeStamp = src.timeStamp;
};

pointerUtils.setEventXY = function (targetObj, pointer, interaction) {
    if (!pointer) {
        if (interaction.pointerIds.length > 1) {
            pointer = pointerUtils.touchAverage(interaction.pointers);
        }
        else {
            pointer = interaction.pointers[0];
        }
    }

    pointerUtils.getPageXY(pointer, tmpXY, interaction);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;

    pointerUtils.getClientXY(pointer, tmpXY, interaction);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;

    targetObj.timeStamp = new Date().getTime();
};

pointerUtils.setEventDeltas = function (targetObj, prev, cur) {
    targetObj.page.x     = cur.page.x      - prev.page.x;
    targetObj.page.y     = cur.page.y      - prev.page.y;
    targetObj.client.x   = cur.client.x    - prev.client.x;
    targetObj.client.y   = cur.client.y    - prev.client.y;
    targetObj.timeStamp = new Date().getTime() - prev.timeStamp;

    // set pointer velocity
    var dt = Math.max(targetObj.timeStamp / 1000, 0.001);
    targetObj.page.speed   = hypot(targetObj.page.x, targetObj.page.y) / dt;
    targetObj.page.vx      = targetObj.page.x / dt;
    targetObj.page.vy      = targetObj.page.y / dt;

    targetObj.client.speed = hypot(targetObj.client.x, targetObj.page.y) / dt;
    targetObj.client.vx    = targetObj.client.x / dt;
    targetObj.client.vy    = targetObj.client.y / dt;
};

// Get specified X/Y coords for mouse or event.touches[0]
pointerUtils.getXY = function (type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';

    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];

    return xy;
};

pointerUtils.getPageXY = function (pointer, page, interaction) {
    page = page || {};

    if (pointer instanceof InteractEvent) {
        if (/inertiastart/.test(pointer.type)) {
            interaction = interaction || pointer.interaction;

            extend(page, interaction.inertiaStatus.upCoords.page);

            page.x += interaction.inertiaStatus.sx;
            page.y += interaction.inertiaStatus.sy;
        }
        else {
            page.x = pointer.pageX;
            page.y = pointer.pageY;
        }
    }
    // Opera Mobile handles the viewport and scrolling oddly
    else if (browser.isOperaMobile) {
        pointerUtils.getXY('screen', pointer, page);

        page.x += win.window.scrollX;
        page.y += win.window.scrollY;
    }
    else {
        pointerUtils.getXY('page', pointer, page);
    }

    return page;
};

pointerUtils.getClientXY = function (pointer, client, interaction) {
    client = client || {};

    if (pointer instanceof InteractEvent) {
        if (/inertiastart/.test(pointer.type)) {
            extend(client, interaction.inertiaStatus.upCoords.client);

            client.x += interaction.inertiaStatus.sx;
            client.y += interaction.inertiaStatus.sy;
        }
        else {
            client.x = pointer.clientX;
            client.y = pointer.clientY;
        }
    }
    else {
        // Opera Mobile handles the viewport and scrolling oddly
        pointerUtils.getXY(browser.isOperaMobile? 'screen': 'client', pointer, client);
    }

    return client;
};

pointerUtils.getPointerId = function (pointer) {
    return isType.isNumber(pointer.pointerId)? pointer.pointerId : pointer.identifier;
};

module.exports = pointerUtils;

},{"../InteractEvent":2,"./browser":11,"./extend":14,"./hypot":15,"./isType":17,"./window":21}],20:[function(require,module,exports){
'use strict';

var lastTime = 0,
    vendors = ['ms', 'moz', 'webkit', 'o'],
    reqFrame,
    cancelFrame;

for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    reqFrame = window[vendors[x]+'RequestAnimationFrame'];
    cancelFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
}

if (!reqFrame) {
    reqFrame = function(callback) {
        var currTime = new Date().getTime(),
            timeToCall = Math.max(0, 16 - (currTime - lastTime)),
            id = setTimeout(function() { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
}

if (!cancelFrame) {
    cancelFrame = function(id) {
        clearTimeout(id);
    };
}

module.exports = {
    request: reqFrame,
    cancel: cancelFrame
};

},{}],21:[function(require,module,exports){
'use strict';

var isWindow = require('./isWindow');

var isShadowDom = function() {
    // create a TextNode
    var el = window.document.createTextNode('');

    // check if it's wrapped by a polyfill
    return el.ownerDocument !== window.document
        && typeof window.wrap === 'function'
        && window.wrap(el) === el;
};

var win = {

    window: undefined,

    realWindow: window,

    getWindow: function getWindow (node) {
        if (isWindow(node)) {
            return node;
        }

        var rootNode = (node.ownerDocument || node);

        return rootNode.defaultView || rootNode.parentWindow || win.window;
    }
};

if (typeof window !== 'undefined') {
    if (isShadowDom()) {
        win.window = window.wrap(window);
    } else {
        win.window = window;
    }
}

module.exports = win;

},{"./isWindow":18}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW50ZXJhY3QuanMiLCJzcmMvSW50ZXJhY3RFdmVudC5qcyIsInNyYy9JbnRlcmFjdGFibGUuanMiLCJzcmMvSW50ZXJhY3Rpb24uanMiLCJzcmMvYXV0b1Njcm9sbC5qcyIsInNyYy9kZWZhdWx0QWN0aW9uQ2hlY2tlci5qcyIsInNyYy9kZWZhdWx0T3B0aW9ucy5qcyIsInNyYy9saXN0ZW5lci5qcyIsInNyYy9zY29wZS5qcyIsInNyYy91dGlscy9hcnIuanMiLCJzcmMvdXRpbHMvYnJvd3Nlci5qcyIsInNyYy91dGlscy9kb21PYmplY3RzLmpzIiwic3JjL3V0aWxzL2V2ZW50cy5qcyIsInNyYy91dGlscy9leHRlbmQuanMiLCJzcmMvdXRpbHMvaHlwb3QuanMiLCJzcmMvdXRpbHMvaW5kZXguanMiLCJzcmMvdXRpbHMvaXNUeXBlLmpzIiwic3JjL3V0aWxzL2lzV2luZG93LmpzIiwic3JjL3V0aWxzL3BvaW50ZXJVdGlscy5qcyIsInNyYy91dGlscy9yYWYuanMiLCJzcmMvdXRpbHMvd2luZG93LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOWZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIGludGVyYWN0LmpzIHYxLjIuNFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMi0yMDE1IFRheWUgQWRleWVtaSA8ZGV2QHRheWUubWU+XG4gKiBPcGVuIHNvdXJjZSB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKiBodHRwczovL3Jhdy5naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvbWFzdGVyL0xJQ0VOU0VcbiAqL1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gcmV0dXJuIGVhcmx5IGlmIHRoZXJlJ3Mgbm8gd2luZG93IHRvIHdvcmsgd2l0aCAoZWcuIE5vZGUuanMpXG4gICAgaWYgKCFyZXF1aXJlKCcuL3V0aWxzL3dpbmRvdycpLndpbmRvdykgeyByZXR1cm47IH1cblxuICAgIHZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKSxcbiAgICAgICAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXG4gICAgICAgIGJyb3dzZXIgPSB1dGlscy5icm93c2VyO1xuXG4gICAgLy8gRXZlbnRzIHdyYXBwZXJcbiAgICB2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcblxuICAgIHZhciBJbnRlcmFjdGlvbiA9IHJlcXVpcmUoJy4vSW50ZXJhY3Rpb24nKTtcblxuICAgIHZhciBJbnRlcmFjdEV2ZW50ID0gcmVxdWlyZSgnLi9JbnRlcmFjdEV2ZW50Jyk7XG5cbiAgICB2YXIgbGlzdGVuZXIgPSByZXF1aXJlKCcuL2xpc3RlbmVyJyk7XG5cbiAgICBsaXN0ZW5lci5iaW5kSW50ZXJhY3Rpb25MaXN0ZW5lcnMoKTtcblxuXG4gICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5pbmRleE9mRWxlbWVudCA9IGZ1bmN0aW9uIGluZGV4T2ZFbGVtZW50IChlbGVtZW50LCBjb250ZXh0KSB7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHNjb3BlLmRvY3VtZW50O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0YWJsZSA9IHRoaXNbaV07XG5cbiAgICAgICAgICAgIGlmICgoaW50ZXJhY3RhYmxlLnNlbGVjdG9yID09PSBlbGVtZW50XG4gICAgICAgICAgICAgICAgJiYgKGludGVyYWN0YWJsZS5fY29udGV4dCA9PT0gY29udGV4dCkpXG4gICAgICAgICAgICAgICAgfHwgKCFpbnRlcmFjdGFibGUuc2VsZWN0b3IgJiYgaW50ZXJhY3RhYmxlLl9lbGVtZW50ID09PSBlbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICBzY29wZS5pbnRlcmFjdGFibGVzLmdldCA9IGZ1bmN0aW9uIGludGVyYWN0YWJsZUdldCAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpc1t0aGlzLmluZGV4T2ZFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0KV07XG4gICAgfTtcblxuICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0YWJsZSA9IHRoaXNbaV07XG5cbiAgICAgICAgICAgIGlmICghaW50ZXJhY3RhYmxlLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhpbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZS5zZWxlY3RvciwgaW50ZXJhY3RhYmxlLl9jb250ZXh0LCBpLCB0aGlzKTtcblxuICAgICAgICAgICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogVGhlIG1ldGhvZHMgb2YgdGhpcyB2YXJpYWJsZSBjYW4gYmUgdXNlZCB0byBzZXQgZWxlbWVudHMgYXNcbiAgICAgKiBpbnRlcmFjdGFibGVzIGFuZCBhbHNvIHRvIGNoYW5nZSB2YXJpb3VzIGRlZmF1bHQgc2V0dGluZ3MuXG4gICAgICpcbiAgICAgKiBDYWxsaW5nIGl0IGFzIGEgZnVuY3Rpb24gYW5kIHBhc3NpbmcgYW4gZWxlbWVudCBvciBhIHZhbGlkIENTUyBzZWxlY3RvclxuICAgICAqIHN0cmluZyByZXR1cm5zIGFuIEludGVyYWN0YWJsZSBvYmplY3Qgd2hpY2ggaGFzIHZhcmlvdXMgbWV0aG9kcyB0b1xuICAgICAqIGNvbmZpZ3VyZSBpdC5cbiAgICAgKlxuICAgICAtIGVsZW1lbnQgKEVsZW1lbnQgfCBzdHJpbmcpIFRoZSBIVE1MIG9yIFNWRyBFbGVtZW50IHRvIGludGVyYWN0IHdpdGggb3IgQ1NTIHNlbGVjdG9yXG4gICAgID0gKG9iamVjdCkgQW4gQEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgID4gVXNhZ2VcbiAgICAgfCBpbnRlcmFjdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHJhZ2dhYmxlJykpLmRyYWdnYWJsZSh0cnVlKTtcbiAgICAgfFxuICAgICB8IHZhciByZWN0YWJsZXMgPSBpbnRlcmFjdCgncmVjdCcpO1xuICAgICB8IHJlY3RhYmxlc1xuICAgICB8ICAgICAuZ2VzdHVyYWJsZSh0cnVlKVxuICAgICB8ICAgICAub24oJ2dlc3R1cmVtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgIHwgICAgICAgICAvLyBzb21ldGhpbmcgY29vbC4uLlxuICAgICB8ICAgICB9KVxuICAgICB8ICAgICAuYXV0b1Njcm9sbCh0cnVlKTtcbiAgICBcXCovXG4gICAgZnVuY3Rpb24gaW50ZXJhY3QgKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0YWJsZXMuZ2V0KGVsZW1lbnQsIG9wdGlvbnMpIHx8IG5ldyBJbnRlcmFjdGFibGUoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdmFyIEludGVyYWN0YWJsZSA9IHJlcXVpcmUoJy4vSW50ZXJhY3RhYmxlJyk7XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuaXNTZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQ2hlY2sgaWYgYW4gZWxlbWVudCBoYXMgYmVlbiBzZXRcbiAgICAgLSBlbGVtZW50IChFbGVtZW50KSBUaGUgRWxlbWVudCBiZWluZyBzZWFyY2hlZCBmb3JcbiAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoZSBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB3YXMgcHJldmlvdXNseSBwYXNzZWQgdG8gaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QuaXNTZXQgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGFibGVzLmluZGV4T2ZFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0KSAhPT0gLTE7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBBZGRzIGEgZ2xvYmFsIGxpc3RlbmVyIGZvciBhbiBJbnRlcmFjdEV2ZW50IG9yIGFkZHMgYSBET00gZXZlbnQgdG9cbiAgICAgKiBgZG9jdW1lbnRgXG4gICAgICpcbiAgICAgLSB0eXBlICAgICAgIChzdHJpbmcgfCBhcnJheSB8IG9iamVjdCkgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW4gZm9yXG4gICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gdGhlIGdpdmVuIGV2ZW50KHMpXG4gICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuICAgICA9IChvYmplY3QpIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0Lm9uID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyh0eXBlKSAmJiB0eXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgdHlwZSA9IHR5cGUudHJpbSgpLnNwbGl0KC8gKy8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGludGVyYWN0Lm9uKHR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KHR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHR5cGUpIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdC5vbihwcm9wLCB0eXBlW3Byb3BdLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIGl0IGlzIGFuIEludGVyYWN0RXZlbnQgdHlwZSwgYWRkIGxpc3RlbmVyIHRvIGdsb2JhbEV2ZW50c1xuICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgdHlwZSBvZiBldmVudCB3YXMgbmV2ZXIgYm91bmRcbiAgICAgICAgICAgIGlmICghc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdID0gW2xpc3RlbmVyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjb3BlLmdsb2JhbEV2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBub24gSW50ZXJhY3RFdmVudCB0eXBlLCBhZGRFdmVudExpc3RlbmVyIHRvIGRvY3VtZW50XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZXZlbnRzLmFkZChzY29wZS5kb2N1bWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3Qub2ZmXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJlbW92ZXMgYSBnbG9iYWwgSW50ZXJhY3RFdmVudCBsaXN0ZW5lciBvciBET00gZXZlbnQgZnJvbSBgZG9jdW1lbnRgXG4gICAgICpcbiAgICAgLSB0eXBlICAgICAgIChzdHJpbmcgfCBhcnJheSB8IG9iamVjdCkgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmUgbGlzdGVuZWQgZm9yXG4gICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBiZSByZW1vdmVkXG4gICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgICA9IChvYmplY3QpIGludGVyYWN0XG4gICAgIFxcKi9cbiAgICBpbnRlcmFjdC5vZmYgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKHR5cGUpICYmIHR5cGUuc2VhcmNoKCcgJykgIT09IC0xKSB7XG4gICAgICAgICAgICB0eXBlID0gdHlwZS50cmltKCkuc3BsaXQoLyArLyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Qub2ZmKHR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KHR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHR5cGUpIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdC5vZmYocHJvcCwgdHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIHR5cGUpKSB7XG4gICAgICAgICAgICBldmVudHMucmVtb3ZlKHNjb3BlLmRvY3VtZW50LCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW5kZXg7XG5cbiAgICAgICAgICAgIGlmICh0eXBlIGluIHNjb3BlLmdsb2JhbEV2ZW50c1xuICAgICAgICAgICAgICAgICYmIChpbmRleCA9IHNjb3BlLmluZGV4T2Yoc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdLCBsaXN0ZW5lcikpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHNjb3BlLmdsb2JhbEV2ZW50c1t0eXBlXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuZW5hYmxlRHJhZ2dpbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGRyYWdnaW5nIGlzIGVuYWJsZWQgZm9yIGFueSBJbnRlcmFjdGFibGVzXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIGB0cnVlYCB0byBhbGxvdyB0aGUgYWN0aW9uOyBgZmFsc2VgIHRvIGRpc2FibGUgYWN0aW9uIGZvciBhbGwgSW50ZXJhY3RhYmxlc1xuICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LmVuYWJsZURyYWdnaW5nID0gdXRpbHMud2Fybk9uY2UoZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZHJhZyA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5kcmFnO1xuICAgIH0sICdpbnRlcmFjdC5lbmFibGVEcmFnZ2luZyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIHNvb24gYmUgcmVtb3ZlZC4nKTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5lbmFibGVSZXNpemluZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEZXByZWNhdGVkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgcmVzaXppbmcgaXMgZW5hYmxlZCBmb3IgYW55IEludGVyYWN0YWJsZXNcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWwgYHRydWVgIHRvIGFsbG93IHRoZSBhY3Rpb247IGBmYWxzZWAgdG8gZGlzYWJsZSBhY3Rpb24gZm9yIGFsbCBJbnRlcmFjdGFibGVzXG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QuZW5hYmxlUmVzaXppbmcgPSB1dGlscy53YXJuT25jZShmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBudWxsICYmIG5ld1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5yZXNpemUgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5hY3Rpb25Jc0VuYWJsZWQucmVzaXplO1xuICAgIH0sICdpbnRlcmFjdC5lbmFibGVSZXNpemluZyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIHNvb24gYmUgcmVtb3ZlZC4nKTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5lbmFibGVHZXN0dXJpbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGdlc3R1cmluZyBpcyBlbmFibGVkIGZvciBhbnkgSW50ZXJhY3RhYmxlc1xuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbCBgdHJ1ZWAgdG8gYWxsb3cgdGhlIGFjdGlvbjsgYGZhbHNlYCB0byBkaXNhYmxlIGFjdGlvbiBmb3IgYWxsIEludGVyYWN0YWJsZXNcbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5lbmFibGVHZXN0dXJpbmcgPSB1dGlscy53YXJuT25jZShmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBudWxsICYmIG5ld1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5nZXN0dXJlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uSXNFbmFibGVkLmdlc3R1cmU7XG4gICAgfSwgJ2ludGVyYWN0LmVuYWJsZUdlc3R1cmluZyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIHNvb24gYmUgcmVtb3ZlZC4nKTtcblxuICAgIGludGVyYWN0LmV2ZW50VHlwZXMgPSBzY29wZS5ldmVudFR5cGVzO1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmRlYnVnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgZGVidWdnaW5nIGRhdGFcbiAgICAgPSAob2JqZWN0KSBBbiBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRoYXQgb3V0bGluZSB0aGUgY3VycmVudCBzdGF0ZSBhbmQgZXhwb3NlIGludGVybmFsIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzXG4gICAgXFwqL1xuICAgIGludGVyYWN0LmRlYnVnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnNbMF0gfHwgbmV3IEludGVyYWN0aW9uKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGludGVyYWN0aW9ucyAgICAgICAgICA6IHNjb3BlLmludGVyYWN0aW9ucyxcbiAgICAgICAgICAgIHRhcmdldCAgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnRhcmdldCxcbiAgICAgICAgICAgIGRyYWdnaW5nICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLmRyYWdnaW5nLFxuICAgICAgICAgICAgcmVzaXppbmcgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucmVzaXppbmcsXG4gICAgICAgICAgICBnZXN0dXJpbmcgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5nZXN0dXJpbmcsXG4gICAgICAgICAgICBwcmVwYXJlZCAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wcmVwYXJlZCxcbiAgICAgICAgICAgIG1hdGNoZXMgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLm1hdGNoZXMsXG4gICAgICAgICAgICBtYXRjaEVsZW1lbnRzICAgICAgICAgOiBpbnRlcmFjdGlvbi5tYXRjaEVsZW1lbnRzLFxuXG4gICAgICAgICAgICBwcmV2Q29vcmRzICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wcmV2Q29vcmRzLFxuICAgICAgICAgICAgc3RhcnRDb29yZHMgICAgICAgICAgIDogaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMsXG5cbiAgICAgICAgICAgIHBvaW50ZXJJZHMgICAgICAgICAgICA6IGludGVyYWN0aW9uLnBvaW50ZXJJZHMsXG4gICAgICAgICAgICBwb2ludGVycyAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wb2ludGVycyxcbiAgICAgICAgICAgIGFkZFBvaW50ZXIgICAgICAgICAgICA6IGxpc3RlbmVyLmxpc3RlbmVycy5hZGRQb2ludGVyLFxuICAgICAgICAgICAgcmVtb3ZlUG9pbnRlciAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLnJlbW92ZVBvaW50ZXIsXG4gICAgICAgICAgICByZWNvcmRQb2ludGVyICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucmVjb3JkUG9pbnRlcixcblxuICAgICAgICAgICAgc25hcCAgICAgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uc25hcFN0YXR1cyxcbiAgICAgICAgICAgIHJlc3RyaWN0ICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnJlc3RyaWN0U3RhdHVzLFxuICAgICAgICAgICAgaW5lcnRpYSAgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cyxcblxuICAgICAgICAgICAgZG93blRpbWUgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZG93blRpbWVzWzBdLFxuICAgICAgICAgICAgZG93bkV2ZW50ICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZG93bkV2ZW50LFxuICAgICAgICAgICAgZG93blBvaW50ZXIgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZG93blBvaW50ZXIsXG4gICAgICAgICAgICBwcmV2RXZlbnQgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQsXG5cbiAgICAgICAgICAgIEludGVyYWN0YWJsZSAgICAgICAgICA6IEludGVyYWN0YWJsZSxcbiAgICAgICAgICAgIGludGVyYWN0YWJsZXMgICAgICAgICA6IHNjb3BlLmludGVyYWN0YWJsZXMsXG4gICAgICAgICAgICBwb2ludGVySXNEb3duICAgICAgICAgOiBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duLFxuICAgICAgICAgICAgZGVmYXVsdE9wdGlvbnMgICAgICAgIDogc2NvcGUuZGVmYXVsdE9wdGlvbnMsXG4gICAgICAgICAgICBkZWZhdWx0QWN0aW9uQ2hlY2tlciAgOiByZXF1aXJlKCcuL2RlZmF1bHRBY3Rpb25DaGVja2VyJyksXG5cbiAgICAgICAgICAgIGFjdGlvbkN1cnNvcnMgICAgICAgICA6IHNjb3BlLmFjdGlvbkN1cnNvcnMsXG4gICAgICAgICAgICBkcmFnTW92ZSAgICAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMuZHJhZ01vdmUsXG4gICAgICAgICAgICByZXNpemVNb3ZlICAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucmVzaXplTW92ZSxcbiAgICAgICAgICAgIGdlc3R1cmVNb3ZlICAgICAgICAgICA6IGxpc3RlbmVyLmxpc3RlbmVycy5nZXN0dXJlTW92ZSxcbiAgICAgICAgICAgIHBvaW50ZXJVcCAgICAgICAgICAgICA6IGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVyVXAsXG4gICAgICAgICAgICBwb2ludGVyRG93biAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckRvd24sXG4gICAgICAgICAgICBwb2ludGVyTW92ZSAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlck1vdmUsXG4gICAgICAgICAgICBwb2ludGVySG92ZXIgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckhvdmVyLFxuXG4gICAgICAgICAgICBldmVudFR5cGVzICAgICAgICAgICAgOiBzY29wZS5ldmVudFR5cGVzLFxuXG4gICAgICAgICAgICBldmVudHMgICAgICAgICAgICAgICAgOiBldmVudHMsXG4gICAgICAgICAgICBnbG9iYWxFdmVudHMgICAgICAgICAgOiBzY29wZS5nbG9iYWxFdmVudHMsXG4gICAgICAgICAgICBkZWxlZ2F0ZWRFdmVudHMgICAgICAgOiBsaXN0ZW5lci5kZWxlZ2F0ZWRFdmVudHNcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gZXhwb3NlIHRoZSBmdW5jdGlvbnMgdXNlZCB0byBjYWxjdWxhdGUgbXVsdGktdG91Y2ggcHJvcGVydGllc1xuICAgIGludGVyYWN0LmdldFRvdWNoQXZlcmFnZSAgPSB1dGlscy50b3VjaEF2ZXJhZ2U7XG4gICAgaW50ZXJhY3QuZ2V0VG91Y2hCQm94ICAgICA9IHV0aWxzLnRvdWNoQkJveDtcbiAgICBpbnRlcmFjdC5nZXRUb3VjaERpc3RhbmNlID0gdXRpbHMudG91Y2hEaXN0YW5jZTtcbiAgICBpbnRlcmFjdC5nZXRUb3VjaEFuZ2xlICAgID0gdXRpbHMudG91Y2hBbmdsZTtcblxuICAgIGludGVyYWN0LmdldEVsZW1lbnRSZWN0ICAgPSBzY29wZS5nZXRFbGVtZW50UmVjdDtcbiAgICBpbnRlcmFjdC5tYXRjaGVzU2VsZWN0b3IgID0gc2NvcGUubWF0Y2hlc1NlbGVjdG9yO1xuICAgIGludGVyYWN0LmNsb3Nlc3QgICAgICAgICAgPSBzY29wZS5jbG9zZXN0O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0Lm1hcmdpblxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1hcmdpbiBmb3IgYXV0b2NoZWNrIHJlc2l6aW5nIHVzZWQgaW5cbiAgICAgKiBASW50ZXJhY3RhYmxlLmdldEFjdGlvbi4gVGhhdCBpcyB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgYm90dG9tIGFuZCByaWdodFxuICAgICAqIGVkZ2VzIG9mIGFuIGVsZW1lbnQgY2xpY2tpbmcgaW4gd2hpY2ggd2lsbCBzdGFydCByZXNpemluZ1xuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKG51bWJlcikgI29wdGlvbmFsXG4gICAgID0gKG51bWJlciB8IGludGVyYWN0KSBUaGUgY3VycmVudCBtYXJnaW4gdmFsdWUgb3IgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QubWFyZ2luID0gZnVuY3Rpb24gKG5ld3ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihuZXd2YWx1ZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLm1hcmdpbiA9IG5ld3ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLm1hcmdpbjtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LnN1cHBvcnRzVG91Y2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIFdoZXRoZXIgb3Igbm90IHRoZSBicm93c2VyIHN1cHBvcnRzIHRvdWNoIGlucHV0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LnN1cHBvcnRzVG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBicm93c2VyLnN1cHBvcnRzVG91Y2g7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5zdXBwb3J0c1BvaW50ZXJFdmVudFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgV2hldGhlciBvciBub3QgdGhlIGJyb3dzZXIgc3VwcG9ydHMgUG9pbnRlckV2ZW50c1xuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5zdXBwb3J0c1BvaW50ZXJFdmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQ7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5zdG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIENhbmNlbHMgYWxsIGludGVyYWN0aW9ucyAoZW5kIGV2ZW50cyBhcmUgbm90IGZpcmVkKVxuICAgICAqXG4gICAgIC0gZXZlbnQgKEV2ZW50KSBBbiBldmVudCBvbiB3aGljaCB0byBjYWxsIHByZXZlbnREZWZhdWx0KClcbiAgICAgPSAob2JqZWN0KSBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5zdG9wID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBzY29wZS5pbnRlcmFjdGlvbnMubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zW2ldLnN0b3AoZXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuZHluYW1pY0Ryb3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdGhlIGRpbWVuc2lvbnMgb2YgZHJvcHpvbmUgZWxlbWVudHMgYXJlXG4gICAgICogY2FsY3VsYXRlZCBvbiBldmVyeSBkcmFnbW92ZSBvciBvbmx5IG9uIGRyYWdzdGFydCBmb3IgdGhlIGRlZmF1bHRcbiAgICAgKiBkcm9wQ2hlY2tlclxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbCBUcnVlIHRvIGNoZWNrIG9uIGVhY2ggbW92ZS4gRmFsc2UgdG8gY2hlY2sgb25seSBiZWZvcmUgc3RhcnRcbiAgICAgPSAoYm9vbGVhbiB8IGludGVyYWN0KSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LmR5bmFtaWNEcm9wID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAvL2lmIChkcmFnZ2luZyAmJiBkeW5hbWljRHJvcCAhPT0gbmV3VmFsdWUgJiYgIW5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy9jYWxjUmVjdHMoZHJvcHpvbmVzKTtcbiAgICAgICAgICAgIC8vfVxuXG4gICAgICAgICAgICBzY29wZS5keW5hbWljRHJvcCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLmR5bmFtaWNEcm9wO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QucG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgZGlzdGFuY2UgdGhlIHBvaW50ZXIgbXVzdCBiZSBtb3ZlZCBiZWZvcmUgYW4gYWN0aW9uXG4gICAgICogc2VxdWVuY2Ugb2NjdXJzLiBUaGlzIGFsc28gYWZmZWN0cyB0b2xlcmFuY2UgZm9yIHRhcCBldmVudHMuXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAobnVtYmVyKSAjb3B0aW9uYWwgVGhlIG1vdmVtZW50IGZyb20gdGhlIHN0YXJ0IHBvc2l0aW9uIG11c3QgYmUgZ3JlYXRlciB0aGFuIHRoaXMgdmFsdWVcbiAgICAgPSAobnVtYmVyIHwgSW50ZXJhY3RhYmxlKSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LnBvaW50ZXJNb3ZlVG9sZXJhbmNlID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLnBvaW50ZXJNb3ZlVG9sZXJhbmNlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjb3BlLnBvaW50ZXJNb3ZlVG9sZXJhbmNlO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QubWF4SW50ZXJhY3Rpb25zXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNvbmN1cnJlbnQgaW50ZXJhY3Rpb25zIGFsbG93ZWQuXG4gICAgICogQnkgZGVmYXVsdCBvbmx5IDEgaW50ZXJhY3Rpb24gaXMgYWxsb3dlZCBhdCBhIHRpbWUgKGZvciBiYWNrd2FyZHNcbiAgICAgKiBjb21wYXRpYmlsaXR5KS4gVG8gYWxsb3cgbXVsdGlwbGUgaW50ZXJhY3Rpb25zIG9uIHRoZSBzYW1lIEludGVyYWN0YWJsZXNcbiAgICAgKiBhbmQgZWxlbWVudHMsIHlvdSBuZWVkIHRvIGVuYWJsZSBpdCBpbiB0aGUgZHJhZ2dhYmxlLCByZXNpemFibGUgYW5kXG4gICAgICogZ2VzdHVyYWJsZSBgJ21heCdgIGFuZCBgJ21heFBlckVsZW1lbnQnYCBvcHRpb25zLlxuICAgICAqKlxuICAgICAtIG5ld1ZhbHVlIChudW1iZXIpICNvcHRpb25hbCBBbnkgbnVtYmVyLiBuZXdWYWx1ZSA8PSAwIG1lYW5zIG5vIGludGVyYWN0aW9ucy5cbiAgICBcXCovXG4gICAgaW50ZXJhY3QubWF4SW50ZXJhY3Rpb25zID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLm1heEludGVyYWN0aW9ucyA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY29wZS5tYXhJbnRlcmFjdGlvbnM7XG4gICAgfTtcblxuICAgIGxpc3RlbmVyLmxpc3RlblRvRG9jdW1lbnQoc2NvcGUuZG9jdW1lbnQpO1xuXG4gICAgc2NvcGUuaW50ZXJhY3QgPSBpbnRlcmFjdDtcbiAgICBzY29wZS5JbnRlcmFjdGFibGUgPSBJbnRlcmFjdGFibGU7XG4gICAgc2NvcGUuSW50ZXJhY3Rpb24gPSBJbnRlcmFjdGlvbjtcbiAgICBzY29wZS5JbnRlcmFjdEV2ZW50ID0gSW50ZXJhY3RFdmVudDtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gaW50ZXJhY3Q7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuZnVuY3Rpb24gSW50ZXJhY3RFdmVudCAoaW50ZXJhY3Rpb24sIGV2ZW50LCBhY3Rpb24sIHBoYXNlLCBlbGVtZW50LCByZWxhdGVkKSB7XG4gICAgdmFyIGNsaWVudCxcbiAgICAgICAgcGFnZSxcbiAgICAgICAgdGFyZ2V0ICAgICAgPSBpbnRlcmFjdGlvbi50YXJnZXQsXG4gICAgICAgIHNuYXBTdGF0dXMgID0gaW50ZXJhY3Rpb24uc25hcFN0YXR1cyxcbiAgICAgICAgcmVzdHJpY3RTdGF0dXMgID0gaW50ZXJhY3Rpb24ucmVzdHJpY3RTdGF0dXMsXG4gICAgICAgIHBvaW50ZXJzICAgID0gaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgICAgIGRlbHRhU291cmNlID0gKHRhcmdldCAmJiB0YXJnZXQub3B0aW9ucyB8fCBzY29wZS5kZWZhdWx0T3B0aW9ucykuZGVsdGFTb3VyY2UsXG4gICAgICAgIHNvdXJjZVggICAgID0gZGVsdGFTb3VyY2UgKyAnWCcsXG4gICAgICAgIHNvdXJjZVkgICAgID0gZGVsdGFTb3VyY2UgKyAnWScsXG4gICAgICAgIG9wdGlvbnMgICAgID0gdGFyZ2V0PyB0YXJnZXQub3B0aW9uczogc2NvcGUuZGVmYXVsdE9wdGlvbnMsXG4gICAgICAgIG9yaWdpbiAgICAgID0gc2NvcGUuZ2V0T3JpZ2luWFkodGFyZ2V0LCBlbGVtZW50KSxcbiAgICAgICAgc3RhcnRpbmcgICAgPSBwaGFzZSA9PT0gJ3N0YXJ0JyxcbiAgICAgICAgZW5kaW5nICAgICAgPSBwaGFzZSA9PT0gJ2VuZCcsXG4gICAgICAgIGNvb3JkcyAgICAgID0gc3RhcnRpbmc/IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzIDogaW50ZXJhY3Rpb24uY3VyQ29vcmRzO1xuXG4gICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgaW50ZXJhY3Rpb24uZWxlbWVudDtcblxuICAgIHBhZ2UgICA9IHV0aWxzLmV4dGVuZCh7fSwgY29vcmRzLnBhZ2UpO1xuICAgIGNsaWVudCA9IHV0aWxzLmV4dGVuZCh7fSwgY29vcmRzLmNsaWVudCk7XG5cbiAgICBwYWdlLnggLT0gb3JpZ2luLng7XG4gICAgcGFnZS55IC09IG9yaWdpbi55O1xuXG4gICAgY2xpZW50LnggLT0gb3JpZ2luLng7XG4gICAgY2xpZW50LnkgLT0gb3JpZ2luLnk7XG5cbiAgICB2YXIgcmVsYXRpdmVQb2ludHMgPSBvcHRpb25zW2FjdGlvbl0uc25hcCAmJiBvcHRpb25zW2FjdGlvbl0uc25hcC5yZWxhdGl2ZVBvaW50cyA7XG5cbiAgICBpZiAoc2NvcGUuY2hlY2tTbmFwKHRhcmdldCwgYWN0aW9uKSAmJiAhKHN0YXJ0aW5nICYmIHJlbGF0aXZlUG9pbnRzICYmIHJlbGF0aXZlUG9pbnRzLmxlbmd0aCkpIHtcbiAgICAgICAgdGhpcy5zbmFwID0ge1xuICAgICAgICAgICAgcmFuZ2UgIDogc25hcFN0YXR1cy5yYW5nZSxcbiAgICAgICAgICAgIGxvY2tlZCA6IHNuYXBTdGF0dXMubG9ja2VkLFxuICAgICAgICAgICAgeCAgICAgIDogc25hcFN0YXR1cy5zbmFwcGVkWCxcbiAgICAgICAgICAgIHkgICAgICA6IHNuYXBTdGF0dXMuc25hcHBlZFksXG4gICAgICAgICAgICByZWFsWCAgOiBzbmFwU3RhdHVzLnJlYWxYLFxuICAgICAgICAgICAgcmVhbFkgIDogc25hcFN0YXR1cy5yZWFsWSxcbiAgICAgICAgICAgIGR4ICAgICA6IHNuYXBTdGF0dXMuZHgsXG4gICAgICAgICAgICBkeSAgICAgOiBzbmFwU3RhdHVzLmR5XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHNuYXBTdGF0dXMubG9ja2VkKSB7XG4gICAgICAgICAgICBwYWdlLnggKz0gc25hcFN0YXR1cy5keDtcbiAgICAgICAgICAgIHBhZ2UueSArPSBzbmFwU3RhdHVzLmR5O1xuICAgICAgICAgICAgY2xpZW50LnggKz0gc25hcFN0YXR1cy5keDtcbiAgICAgICAgICAgIGNsaWVudC55ICs9IHNuYXBTdGF0dXMuZHk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2NvcGUuY2hlY2tSZXN0cmljdCh0YXJnZXQsIGFjdGlvbikgJiYgIShzdGFydGluZyAmJiBvcHRpb25zW2FjdGlvbl0ucmVzdHJpY3QuZWxlbWVudFJlY3QpICYmIHJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWQpIHtcbiAgICAgICAgcGFnZS54ICs9IHJlc3RyaWN0U3RhdHVzLmR4O1xuICAgICAgICBwYWdlLnkgKz0gcmVzdHJpY3RTdGF0dXMuZHk7XG4gICAgICAgIGNsaWVudC54ICs9IHJlc3RyaWN0U3RhdHVzLmR4O1xuICAgICAgICBjbGllbnQueSArPSByZXN0cmljdFN0YXR1cy5keTtcblxuICAgICAgICB0aGlzLnJlc3RyaWN0ID0ge1xuICAgICAgICAgICAgZHg6IHJlc3RyaWN0U3RhdHVzLmR4LFxuICAgICAgICAgICAgZHk6IHJlc3RyaWN0U3RhdHVzLmR5XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5wYWdlWCAgICAgPSBwYWdlLng7XG4gICAgdGhpcy5wYWdlWSAgICAgPSBwYWdlLnk7XG4gICAgdGhpcy5jbGllbnRYICAgPSBjbGllbnQueDtcbiAgICB0aGlzLmNsaWVudFkgICA9IGNsaWVudC55O1xuXG4gICAgdGhpcy54MCAgICAgICAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5wYWdlLnggLSBvcmlnaW4ueDtcbiAgICB0aGlzLnkwICAgICAgICA9IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLnBhZ2UueSAtIG9yaWdpbi55O1xuICAgIHRoaXMuY2xpZW50WDAgID0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMuY2xpZW50LnggLSBvcmlnaW4ueDtcbiAgICB0aGlzLmNsaWVudFkwICA9IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC55IC0gb3JpZ2luLnk7XG4gICAgdGhpcy5jdHJsS2V5ICAgPSBldmVudC5jdHJsS2V5O1xuICAgIHRoaXMuYWx0S2V5ICAgID0gZXZlbnQuYWx0S2V5O1xuICAgIHRoaXMuc2hpZnRLZXkgID0gZXZlbnQuc2hpZnRLZXk7XG4gICAgdGhpcy5tZXRhS2V5ICAgPSBldmVudC5tZXRhS2V5O1xuICAgIHRoaXMuYnV0dG9uICAgID0gZXZlbnQuYnV0dG9uO1xuICAgIHRoaXMudGFyZ2V0ICAgID0gZWxlbWVudDtcbiAgICB0aGlzLnQwICAgICAgICA9IGludGVyYWN0aW9uLmRvd25UaW1lc1swXTtcbiAgICB0aGlzLnR5cGUgICAgICA9IGFjdGlvbiArIChwaGFzZSB8fCAnJyk7XG5cbiAgICB0aGlzLmludGVyYWN0aW9uID0gaW50ZXJhY3Rpb247XG4gICAgdGhpcy5pbnRlcmFjdGFibGUgPSB0YXJnZXQ7XG5cbiAgICB2YXIgaW5lcnRpYVN0YXR1cyA9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXM7XG5cbiAgICBpZiAoaW5lcnRpYVN0YXR1cy5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5kZXRhaWwgPSAnaW5lcnRpYSc7XG4gICAgfVxuXG4gICAgaWYgKHJlbGF0ZWQpIHtcbiAgICAgICAgdGhpcy5yZWxhdGVkVGFyZ2V0ID0gcmVsYXRlZDtcbiAgICB9XG5cbiAgICAvLyBlbmQgZXZlbnQgZHgsIGR5IGlzIGRpZmZlcmVuY2UgYmV0d2VlbiBzdGFydCBhbmQgZW5kIHBvaW50c1xuICAgIGlmIChlbmRpbmcpIHtcbiAgICAgICAgaWYgKGRlbHRhU291cmNlID09PSAnY2xpZW50Jykge1xuICAgICAgICAgICAgdGhpcy5keCA9IGNsaWVudC54IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMuY2xpZW50Lng7XG4gICAgICAgICAgICB0aGlzLmR5ID0gY2xpZW50LnkgLSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5jbGllbnQueTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZHggPSBwYWdlLnggLSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5wYWdlLng7XG4gICAgICAgICAgICB0aGlzLmR5ID0gcGFnZS55IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS55O1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHN0YXJ0aW5nKSB7XG4gICAgICAgIHRoaXMuZHggPSAwO1xuICAgICAgICB0aGlzLmR5ID0gMDtcbiAgICB9XG4gICAgLy8gY29weSBwcm9wZXJ0aWVzIGZyb20gcHJldmlvdXNtb3ZlIGlmIHN0YXJ0aW5nIGluZXJ0aWFcbiAgICBlbHNlIGlmIChwaGFzZSA9PT0gJ2luZXJ0aWFzdGFydCcpIHtcbiAgICAgICAgdGhpcy5keCA9IGludGVyYWN0aW9uLnByZXZFdmVudC5keDtcbiAgICAgICAgdGhpcy5keSA9IGludGVyYWN0aW9uLnByZXZFdmVudC5keTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChkZWx0YVNvdXJjZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgICAgIHRoaXMuZHggPSBjbGllbnQueCAtIGludGVyYWN0aW9uLnByZXZFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgdGhpcy5keSA9IGNsaWVudC55IC0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmNsaWVudFk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gcGFnZS54IC0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnBhZ2VYO1xuICAgICAgICAgICAgdGhpcy5keSA9IHBhZ2UueSAtIGludGVyYWN0aW9uLnByZXZFdmVudC5wYWdlWTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJldkV2ZW50ICYmIGludGVyYWN0aW9uLnByZXZFdmVudC5kZXRhaWwgPT09ICdpbmVydGlhJ1xuICAgICAgICAmJiAhaW5lcnRpYVN0YXR1cy5hY3RpdmVcbiAgICAgICAgJiYgb3B0aW9uc1thY3Rpb25dLmluZXJ0aWEgJiYgb3B0aW9uc1thY3Rpb25dLmluZXJ0aWEuemVyb1Jlc3VtZURlbHRhKSB7XG5cbiAgICAgICAgaW5lcnRpYVN0YXR1cy5yZXN1bWVEeCArPSB0aGlzLmR4O1xuICAgICAgICBpbmVydGlhU3RhdHVzLnJlc3VtZUR5ICs9IHRoaXMuZHk7XG5cbiAgICAgICAgdGhpcy5keCA9IHRoaXMuZHkgPSAwO1xuICAgIH1cblxuICAgIGlmIChhY3Rpb24gPT09ICdyZXNpemUnICYmIGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuZHggPSB0aGlzLmR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5keSA9IHRoaXMuZHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmF4ZXMgPSAneHknO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5heGVzID0gaW50ZXJhY3Rpb24ucmVzaXplQXhlcztcblxuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd4Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuZHkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9PT0gJ3knKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5keCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoYWN0aW9uID09PSAnZ2VzdHVyZScpIHtcbiAgICAgICAgdGhpcy50b3VjaGVzID0gW3BvaW50ZXJzWzBdLCBwb2ludGVyc1sxXV07XG5cbiAgICAgICAgaWYgKHN0YXJ0aW5nKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3RhbmNlID0gdXRpbHMudG91Y2hEaXN0YW5jZShwb2ludGVycywgZGVsdGFTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5ib3ggICAgICA9IHV0aWxzLnRvdWNoQkJveChwb2ludGVycyk7XG4gICAgICAgICAgICB0aGlzLnNjYWxlICAgID0gMTtcbiAgICAgICAgICAgIHRoaXMuZHMgICAgICAgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmdsZSAgICA9IHV0aWxzLnRvdWNoQW5nbGUocG9pbnRlcnMsIHVuZGVmaW5lZCwgZGVsdGFTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5kYSAgICAgICA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZW5kaW5nIHx8IGV2ZW50IGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZSA9IGludGVyYWN0aW9uLnByZXZFdmVudC5kaXN0YW5jZTtcbiAgICAgICAgICAgIHRoaXMuYm94ICAgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuYm94O1xuICAgICAgICAgICAgdGhpcy5zY2FsZSAgICA9IGludGVyYWN0aW9uLnByZXZFdmVudC5zY2FsZTtcbiAgICAgICAgICAgIHRoaXMuZHMgICAgICAgPSB0aGlzLnNjYWxlIC0gMTtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuYW5nbGU7XG4gICAgICAgICAgICB0aGlzLmRhICAgICAgID0gdGhpcy5hbmdsZSAtIGludGVyYWN0aW9uLmdlc3R1cmUuc3RhcnRBbmdsZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGlzdGFuY2UgPSB1dGlscy50b3VjaERpc3RhbmNlKHBvaW50ZXJzLCBkZWx0YVNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLmJveCAgICAgID0gdXRpbHMudG91Y2hCQm94KHBvaW50ZXJzKTtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgICAgPSB0aGlzLmRpc3RhbmNlIC8gaW50ZXJhY3Rpb24uZ2VzdHVyZS5zdGFydERpc3RhbmNlO1xuICAgICAgICAgICAgdGhpcy5hbmdsZSAgICA9IHV0aWxzLnRvdWNoQW5nbGUocG9pbnRlcnMsIGludGVyYWN0aW9uLmdlc3R1cmUucHJldkFuZ2xlLCBkZWx0YVNvdXJjZSk7XG5cbiAgICAgICAgICAgIHRoaXMuZHMgPSB0aGlzLnNjYWxlIC0gaW50ZXJhY3Rpb24uZ2VzdHVyZS5wcmV2U2NhbGU7XG4gICAgICAgICAgICB0aGlzLmRhID0gdGhpcy5hbmdsZSAtIGludGVyYWN0aW9uLmdlc3R1cmUucHJldkFuZ2xlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0aW5nKSB7XG4gICAgICAgIHRoaXMudGltZVN0YW1wID0gaW50ZXJhY3Rpb24uZG93blRpbWVzWzBdO1xuICAgICAgICB0aGlzLmR0ICAgICAgICA9IDA7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gID0gMDtcbiAgICAgICAgdGhpcy5zcGVlZCAgICAgPSAwO1xuICAgICAgICB0aGlzLnZlbG9jaXR5WCA9IDA7XG4gICAgICAgIHRoaXMudmVsb2NpdHlZID0gMDtcbiAgICB9XG4gICAgZWxzZSBpZiAocGhhc2UgPT09ICdpbmVydGlhc3RhcnQnKSB7XG4gICAgICAgIHRoaXMudGltZVN0YW1wID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnRpbWVTdGFtcDtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHQ7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmR1cmF0aW9uO1xuICAgICAgICB0aGlzLnNwZWVkICAgICA9IGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVggPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlYO1xuICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICB0aGlzLmR0ICAgICAgICA9IHRoaXMudGltZVN0YW1wIC0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnRpbWVTdGFtcDtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiAgPSB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLmRvd25UaW1lc1swXTtcblxuICAgICAgICBpZiAoZXZlbnQgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgZHggPSB0aGlzW3NvdXJjZVhdIC0gaW50ZXJhY3Rpb24ucHJldkV2ZW50W3NvdXJjZVhdLFxuICAgICAgICAgICAgICAgIGR5ID0gdGhpc1tzb3VyY2VZXSAtIGludGVyYWN0aW9uLnByZXZFdmVudFtzb3VyY2VZXSxcbiAgICAgICAgICAgICAgICBkdCA9IHRoaXMuZHQgLyAxMDAwO1xuXG4gICAgICAgICAgICB0aGlzLnNwZWVkID0gdXRpbHMuaHlwb3QoZHgsIGR5KSAvIGR0O1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eVggPSBkeCAvIGR0O1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eVkgPSBkeSAvIGR0O1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIG5vcm1hbCBtb3ZlIG9yIGVuZCBldmVudCwgdXNlIHByZXZpb3VzIHVzZXIgZXZlbnQgY29vcmRzXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gc3BlZWQgYW5kIHZlbG9jaXR5IGluIHBpeGVscyBwZXIgc2Vjb25kXG4gICAgICAgICAgICB0aGlzLnNwZWVkID0gaW50ZXJhY3Rpb24ucG9pbnRlckRlbHRhW2RlbHRhU291cmNlXS5zcGVlZDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlYID0gaW50ZXJhY3Rpb24ucG9pbnRlckRlbHRhW2RlbHRhU291cmNlXS52eDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlZID0gaW50ZXJhY3Rpb24ucG9pbnRlckRlbHRhW2RlbHRhU291cmNlXS52eTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgoZW5kaW5nIHx8IHBoYXNlID09PSAnaW5lcnRpYXN0YXJ0JylcbiAgICAgICAgJiYgaW50ZXJhY3Rpb24ucHJldkV2ZW50LnNwZWVkID4gNjAwICYmIHRoaXMudGltZVN0YW1wIC0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnRpbWVTdGFtcCA8IDE1MCkge1xuXG4gICAgICAgIHZhciBhbmdsZSA9IDE4MCAqIE1hdGguYXRhbjIoaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WSwgaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WCkgLyBNYXRoLlBJLFxuICAgICAgICAgICAgb3ZlcmxhcCA9IDIyLjU7XG5cbiAgICAgICAgaWYgKGFuZ2xlIDwgMCkge1xuICAgICAgICAgICAgYW5nbGUgKz0gMzYwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlZnQgPSAxMzUgLSBvdmVybGFwIDw9IGFuZ2xlICYmIGFuZ2xlIDwgMjI1ICsgb3ZlcmxhcCxcbiAgICAgICAgICAgIHVwICAgPSAyMjUgLSBvdmVybGFwIDw9IGFuZ2xlICYmIGFuZ2xlIDwgMzE1ICsgb3ZlcmxhcCxcblxuICAgICAgICAgICAgcmlnaHQgPSAhbGVmdCAmJiAoMzE1IC0gb3ZlcmxhcCA8PSBhbmdsZSB8fCBhbmdsZSA8ICA0NSArIG92ZXJsYXApLFxuICAgICAgICAgICAgZG93biAgPSAhdXAgICAmJiAgIDQ1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDEzNSArIG92ZXJsYXA7XG5cbiAgICAgICAgdGhpcy5zd2lwZSA9IHtcbiAgICAgICAgICAgIHVwICAgOiB1cCxcbiAgICAgICAgICAgIGRvd24gOiBkb3duLFxuICAgICAgICAgICAgbGVmdCA6IGxlZnQsXG4gICAgICAgICAgICByaWdodDogcmlnaHQsXG4gICAgICAgICAgICBhbmdsZTogYW5nbGUsXG4gICAgICAgICAgICBzcGVlZDogaW50ZXJhY3Rpb24ucHJldkV2ZW50LnNwZWVkLFxuICAgICAgICAgICAgdmVsb2NpdHk6IHtcbiAgICAgICAgICAgICAgICB4OiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlYLFxuICAgICAgICAgICAgICAgIHk6IGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59XG5cbkludGVyYWN0RXZlbnQucHJvdG90eXBlID0ge1xuICAgIHByZXZlbnREZWZhdWx0OiB1dGlscy5ibGFuayxcbiAgICBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG4gICAgfSxcbiAgICBzdG9wUHJvcGFnYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW50ZXJhY3RFdmVudDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNjb3BlID0gcmVxdWlyZSgnLi9zY29wZScpO1xudmFyIGxpc3RlbmVyID0gcmVxdWlyZSgnLi9saXN0ZW5lcicpO1xudmFyIGRlZmF1bHRBY3Rpb25DaGVja2VyID0gcmVxdWlyZSgnLi9kZWZhdWx0QWN0aW9uQ2hlY2tlcicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvZXZlbnRzJyk7XG5cbi8qXFxcbiAqIEludGVyYWN0YWJsZVxuIFsgcHJvcGVydHkgXVxuICoqXG4gKiBPYmplY3QgdHlwZSByZXR1cm5lZCBieSBAaW50ZXJhY3RcbiBcXCovXG5mdW5jdGlvbiBJbnRlcmFjdGFibGUgKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLl9lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLl9pRXZlbnRzID0gdGhpcy5faUV2ZW50cyB8fCB7fTtcblxuICAgIHZhciBfd2luZG93O1xuXG4gICAgaWYgKHNjb3BlLnRyeVNlbGVjdG9yKGVsZW1lbnQpKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0b3IgPSBlbGVtZW50O1xuXG4gICAgICAgIHZhciBjb250ZXh0ID0gb3B0aW9ucyAmJiBvcHRpb25zLmNvbnRleHQ7XG5cbiAgICAgICAgX3dpbmRvdyA9IGNvbnRleHQ/IHNjb3BlLmdldFdpbmRvdyhjb250ZXh0KSA6IHNjb3BlLndpbmRvdztcblxuICAgICAgICBpZiAoY29udGV4dCAmJiAoX3dpbmRvdy5Ob2RlXG4gICAgICAgICAgICAgICAgPyBjb250ZXh0IGluc3RhbmNlb2YgX3dpbmRvdy5Ob2RlXG4gICAgICAgICAgICAgICAgOiAodXRpbHMuaXNFbGVtZW50KGNvbnRleHQpIHx8IGNvbnRleHQgPT09IF93aW5kb3cuZG9jdW1lbnQpKSkge1xuXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgX3dpbmRvdyA9IHNjb3BlLmdldFdpbmRvdyhlbGVtZW50KTtcblxuICAgICAgICBpZiAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQsIF93aW5kb3cpKSB7XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5Qb2ludGVyRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsIHNjb3BlLnBFdmVudFR5cGVzLmRvd24sIGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVyRG93biApO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgc2NvcGUucEV2ZW50VHlwZXMubW92ZSwgbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJIb3Zlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsICdtb3VzZWRvd24nICwgbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJEb3duICk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAnbW91c2Vtb3ZlJyAsIGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgJ3RvdWNoc3RhcnQnLCBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckRvd24gKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsICd0b3VjaG1vdmUnICwgbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJIb3Zlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9kb2MgPSBfd2luZG93LmRvY3VtZW50O1xuXG4gICAgaWYgKCFzY29wZS5jb250YWlucyhzY29wZS5kb2N1bWVudHMsIHRoaXMuX2RvYykpIHtcbiAgICAgICAgbGlzdGVuZXIubGlzdGVuVG9Eb2N1bWVudCh0aGlzLl9kb2MpO1xuICAgIH1cblxuICAgIHNjb3BlLmludGVyYWN0YWJsZXMucHVzaCh0aGlzKTtcblxuICAgIHRoaXMuc2V0KG9wdGlvbnMpO1xufVxuXG5JbnRlcmFjdGFibGUucHJvdG90eXBlID0ge1xuICAgIHNldE9uRXZlbnRzOiBmdW5jdGlvbiAoYWN0aW9uLCBwaGFzZXMpIHtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2Ryb3AnKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wKSAgICAgICAgICApIHsgdGhpcy5vbmRyb3AgICAgICAgICAgID0gcGhhc2VzLm9uZHJvcCAgICAgICAgICA7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmRyb3BhY3RpdmF0ZSkgICkgeyB0aGlzLm9uZHJvcGFjdGl2YXRlICAgPSBwaGFzZXMub25kcm9wYWN0aXZhdGUgIDsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZHJvcGRlYWN0aXZhdGUpKSB7IHRoaXMub25kcm9wZGVhY3RpdmF0ZSA9IHBoYXNlcy5vbmRyb3BkZWFjdGl2YXRlOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcmFnZW50ZXIpICAgICApIHsgdGhpcy5vbmRyYWdlbnRlciAgICAgID0gcGhhc2VzLm9uZHJhZ2VudGVyICAgICA7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmRyYWdsZWF2ZSkgICAgICkgeyB0aGlzLm9uZHJhZ2xlYXZlICAgICAgPSBwaGFzZXMub25kcmFnbGVhdmUgICAgIDsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZHJvcG1vdmUpICAgICAgKSB7IHRoaXMub25kcm9wbW92ZSAgICAgICA9IHBoYXNlcy5vbmRyb3Btb3ZlICAgICAgOyB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhY3Rpb24gPSAnb24nICsgYWN0aW9uO1xuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25zdGFydCkgICAgICAgKSB7IHRoaXNbYWN0aW9uICsgJ3N0YXJ0JyAgICAgICAgIF0gPSBwaGFzZXMub25zdGFydCAgICAgICAgIDsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9ubW92ZSkgICAgICAgICkgeyB0aGlzW2FjdGlvbiArICdtb3ZlJyAgICAgICAgICBdID0gcGhhc2VzLm9ubW92ZSAgICAgICAgICA7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmVuZCkgICAgICAgICApIHsgdGhpc1thY3Rpb24gKyAnZW5kJyAgICAgICAgICAgXSA9IHBoYXNlcy5vbmVuZCAgICAgICAgICAgOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25pbmVydGlhc3RhcnQpKSB7IHRoaXNbYWN0aW9uICsgJ2luZXJ0aWFzdGFydCcgIF0gPSBwaGFzZXMub25pbmVydGlhc3RhcnQgIDsgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIGRyYWcgYWN0aW9ucyBjYW4gYmUgcGVyZm9ybWVkIG9uIHRoZVxuICAgICAqIEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIEluZGljYXRlcyBpZiB0aGlzIGNhbiBiZSB0aGUgdGFyZ2V0IG9mIGRyYWcgZXZlbnRzXG4gICAgIHwgdmFyIGlzRHJhZ2dhYmxlID0gaW50ZXJhY3QoJ3VsIGxpJykuZHJhZ2dhYmxlKCk7XG4gICAgICogb3JcbiAgICAgLSBvcHRpb25zIChib29sZWFuIHwgb2JqZWN0KSAjb3B0aW9uYWwgdHJ1ZS9mYWxzZSBvciBBbiBvYmplY3Qgd2l0aCBldmVudCBsaXN0ZW5lcnMgdG8gYmUgZmlyZWQgb24gZHJhZyBldmVudHMgKG9iamVjdCBtYWtlcyB0aGUgSW50ZXJhY3RhYmxlIGRyYWdnYWJsZSlcbiAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsZVxuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmRyYWdnYWJsZSh7XG4gICAgIHwgICAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9uZW5kICA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHxcbiAgICAgfCAgICAgLy8gdGhlIGF4aXMgaW4gd2hpY2ggdGhlIGZpcnN0IG1vdmVtZW50IG11c3QgYmVcbiAgICAgfCAgICAgLy8gZm9yIHRoZSBkcmFnIHNlcXVlbmNlIHRvIHN0YXJ0XG4gICAgIHwgICAgIC8vICd4eScgYnkgZGVmYXVsdCAtIGFueSBkaXJlY3Rpb25cbiAgICAgfCAgICAgYXhpczogJ3gnIHx8ICd5JyB8fCAneHknLFxuICAgICB8XG4gICAgIHwgICAgIC8vIG1heCBudW1iZXIgb2YgZHJhZ3MgdGhhdCBjYW4gaGFwcGVuIGNvbmN1cnJlbnRseVxuICAgICB8ICAgICAvLyB3aXRoIGVsZW1lbnRzIG9mIHRoaXMgSW50ZXJhY3RhYmxlLiBJbmZpbml0eSBieSBkZWZhdWx0XG4gICAgIHwgICAgIG1heDogSW5maW5pdHksXG4gICAgIHxcbiAgICAgfCAgICAgLy8gbWF4IG51bWJlciBvZiBkcmFncyB0aGF0IGNhbiB0YXJnZXQgdGhlIHNhbWUgZWxlbWVudCtJbnRlcmFjdGFibGVcbiAgICAgfCAgICAgLy8gMSBieSBkZWZhdWx0XG4gICAgIHwgICAgIG1heFBlckVsZW1lbnQ6IDJcbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIGRyYWdnYWJsZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJhZy5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbignZHJhZycsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygnZHJhZycsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICBpZiAoL154JHxeeSR8Xnh5JC8udGVzdChvcHRpb25zLmF4aXMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyYWcuYXhpcyA9IG9wdGlvbnMuYXhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuYXhpcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZHJhZy5heGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcmFnLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJhZztcbiAgICB9LFxuXG4gICAgc2V0UGVyQWN0aW9uOiBmdW5jdGlvbiAoYWN0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIGZvciBhbGwgdGhlIGRlZmF1bHQgcGVyLWFjdGlvbiBvcHRpb25zXG4gICAgICAgIGZvciAodmFyIG9wdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIG9wdGlvbiBleGlzdHMgZm9yIHRoaXMgYWN0aW9uXG4gICAgICAgICAgICBpZiAob3B0aW9uIGluIHNjb3BlLmRlZmF1bHRPcHRpb25zW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgb3B0aW9uIGluIHRoZSBvcHRpb25zIGFyZyBpcyBhbiBvYmplY3QgdmFsdWVcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9uc1tvcHRpb25dKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBkdXBsaWNhdGUgdGhlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dID0gdXRpbHMuZXh0ZW5kKHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbl0gfHwge30sIG9wdGlvbnNbb3B0aW9uXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KHNjb3BlLmRlZmF1bHRPcHRpb25zLnBlckFjdGlvbltvcHRpb25dKSAmJiAnZW5hYmxlZCcgaW4gc2NvcGUuZGVmYXVsdE9wdGlvbnMucGVyQWN0aW9uW29wdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbl0uZW5hYmxlZCA9IG9wdGlvbnNbb3B0aW9uXS5lbmFibGVkID09PSBmYWxzZT8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zW29wdGlvbl0pICYmIHNjb3BlLmlzT2JqZWN0KHNjb3BlLmRlZmF1bHRPcHRpb25zLnBlckFjdGlvbltvcHRpb25dKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dLmVuYWJsZWQgPSBvcHRpb25zW29wdGlvbl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnNbb3B0aW9uXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9yIGlmIGl0J3Mgbm90IHVuZGVmaW5lZCwgZG8gYSBwbGFpbiBhc3NpZ25tZW50XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbl0gPSBvcHRpb25zW29wdGlvbl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZHJvcHpvbmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgZWxlbWVudHMgY2FuIGJlIGRyb3BwZWQgb250byB0aGlzXG4gICAgICogSW50ZXJhY3RhYmxlIHRvIHRyaWdnZXIgZHJvcCBldmVudHNcbiAgICAgKlxuICAgICAqIERyb3B6b25lcyBjYW4gcmVjZWl2ZSB0aGUgZm9sbG93aW5nIGV2ZW50czpcbiAgICAgKiAgLSBgZHJvcGFjdGl2YXRlYCBhbmQgYGRyb3BkZWFjdGl2YXRlYCB3aGVuIGFuIGFjY2VwdGFibGUgZHJhZyBzdGFydHMgYW5kIGVuZHNcbiAgICAgKiAgLSBgZHJhZ2VudGVyYCBhbmQgYGRyYWdsZWF2ZWAgd2hlbiBhIGRyYWdnYWJsZSBlbnRlcnMgYW5kIGxlYXZlcyB0aGUgZHJvcHpvbmVcbiAgICAgKiAgLSBgZHJhZ21vdmVgIHdoZW4gYSBkcmFnZ2FibGUgdGhhdCBoYXMgZW50ZXJlZCB0aGUgZHJvcHpvbmUgaXMgbW92ZWRcbiAgICAgKiAgLSBgZHJvcGAgd2hlbiBhIGRyYWdnYWJsZSBpcyBkcm9wcGVkIGludG8gdGhpcyBkcm9wem9uZVxuICAgICAqXG4gICAgICogIFVzZSB0aGUgYGFjY2VwdGAgb3B0aW9uIHRvIGFsbG93IG9ubHkgZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgZ2l2ZW4gQ1NTIHNlbGVjdG9yIG9yIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiAgVXNlIHRoZSBgb3ZlcmxhcGAgb3B0aW9uIHRvIHNldCBob3cgZHJvcHMgYXJlIGNoZWNrZWQgZm9yLiBUaGUgYWxsb3dlZCB2YWx1ZXMgYXJlOlxuICAgICAqICAgLSBgJ3BvaW50ZXInYCwgdGhlIHBvaW50ZXIgbXVzdCBiZSBvdmVyIHRoZSBkcm9wem9uZSAoZGVmYXVsdClcbiAgICAgKiAgIC0gYCdjZW50ZXInYCwgdGhlIGRyYWdnYWJsZSBlbGVtZW50J3MgY2VudGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICAgKiAgIC0gYSBudW1iZXIgZnJvbSAwLTEgd2hpY2ggaXMgdGhlIGAoaW50ZXJzZWN0aW9uIGFyZWEpIC8gKGRyYWdnYWJsZSBhcmVhKWAuXG4gICAgICogICAgICAgZS5nLiBgMC41YCBmb3IgZHJvcCB0byBoYXBwZW4gd2hlbiBoYWxmIG9mIHRoZSBhcmVhIG9mIHRoZVxuICAgICAqICAgICAgIGRyYWdnYWJsZSBpcyBvdmVyIHRoZSBkcm9wem9uZVxuICAgICAqXG4gICAgIC0gb3B0aW9ucyAoYm9vbGVhbiB8IG9iamVjdCB8IG51bGwpICNvcHRpb25hbCBUaGUgbmV3IHZhbHVlIHRvIGJlIHNldC5cbiAgICAgfCBpbnRlcmFjdCgnLmRyb3AnKS5kcm9wem9uZSh7XG4gICAgIHwgICBhY2NlcHQ6ICcuY2FuLWRyb3AnIHx8IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaW5nbGUtZHJvcCcpLFxuICAgICB8ICAgb3ZlcmxhcDogJ3BvaW50ZXInIHx8ICdjZW50ZXInIHx8IHplcm9Ub09uZVxuICAgICB8IH1cbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgZHJvcHpvbmU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3AuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygnZHJvcCcsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5hY2NlcHQob3B0aW9ucy5hY2NlcHQpO1xuXG4gICAgICAgICAgICBpZiAoL14ocG9pbnRlcnxjZW50ZXIpJC8udGVzdChvcHRpb25zLm92ZXJsYXApKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3Aub3ZlcmxhcCA9IG9wdGlvbnMub3ZlcmxhcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNjb3BlLmlzTnVtYmVyKG9wdGlvbnMub3ZlcmxhcCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5vdmVybGFwID0gTWF0aC5tYXgoTWF0aC5taW4oMSwgb3B0aW9ucy5vdmVybGFwKSwgMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3AuZW5hYmxlZCA9IG9wdGlvbnM7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kcm9wO1xuICAgIH0sXG5cbiAgICBkcm9wQ2hlY2s6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50LCBkcm9wRWxlbWVudCwgcmVjdCkge1xuICAgICAgICB2YXIgZHJvcHBlZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGlmIHRoZSBkcm9wem9uZSBoYXMgbm8gcmVjdCAoZWcuIGRpc3BsYXk6IG5vbmUpXG4gICAgICAgIC8vIGNhbGwgdGhlIGN1c3RvbSBkcm9wQ2hlY2tlciBvciBqdXN0IHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoIShyZWN0ID0gcmVjdCB8fCB0aGlzLmdldFJlY3QoZHJvcEVsZW1lbnQpKSkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXJcbiAgICAgICAgICAgICAgICA/IHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlcihwb2ludGVyLCBldmVudCwgZHJvcHBlZCwgdGhpcywgZHJvcEVsZW1lbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudClcbiAgICAgICAgICAgICAgICA6IGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkcm9wT3ZlcmxhcCA9IHRoaXMub3B0aW9ucy5kcm9wLm92ZXJsYXA7XG5cbiAgICAgICAgaWYgKGRyb3BPdmVybGFwID09PSAncG9pbnRlcicpIHtcbiAgICAgICAgICAgIHZhciBwYWdlID0gdXRpbHMuZ2V0UGFnZVhZKHBvaW50ZXIpLFxuICAgICAgICAgICAgICAgIG9yaWdpbiA9IHNjb3BlLmdldE9yaWdpblhZKGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCksXG4gICAgICAgICAgICAgICAgaG9yaXpvbnRhbCxcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbDtcblxuICAgICAgICAgICAgcGFnZS54ICs9IG9yaWdpbi54O1xuICAgICAgICAgICAgcGFnZS55ICs9IG9yaWdpbi55O1xuXG4gICAgICAgICAgICBob3Jpem9udGFsID0gKHBhZ2UueCA+IHJlY3QubGVmdCkgJiYgKHBhZ2UueCA8IHJlY3QucmlnaHQpO1xuICAgICAgICAgICAgdmVydGljYWwgICA9IChwYWdlLnkgPiByZWN0LnRvcCApICYmIChwYWdlLnkgPCByZWN0LmJvdHRvbSk7XG5cbiAgICAgICAgICAgIGRyb3BwZWQgPSBob3Jpem9udGFsICYmIHZlcnRpY2FsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRyYWdSZWN0ID0gZHJhZ2dhYmxlLmdldFJlY3QoZHJhZ2dhYmxlRWxlbWVudCk7XG5cbiAgICAgICAgaWYgKGRyb3BPdmVybGFwID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgdmFyIGN4ID0gZHJhZ1JlY3QubGVmdCArIGRyYWdSZWN0LndpZHRoICAvIDIsXG4gICAgICAgICAgICAgICAgY3kgPSBkcmFnUmVjdC50b3AgICsgZHJhZ1JlY3QuaGVpZ2h0IC8gMjtcblxuICAgICAgICAgICAgZHJvcHBlZCA9IGN4ID49IHJlY3QubGVmdCAmJiBjeCA8PSByZWN0LnJpZ2h0ICYmIGN5ID49IHJlY3QudG9wICYmIGN5IDw9IHJlY3QuYm90dG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzTnVtYmVyKGRyb3BPdmVybGFwKSkge1xuICAgICAgICAgICAgdmFyIG92ZXJsYXBBcmVhICA9IChNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LnJpZ2h0ICwgZHJhZ1JlY3QucmlnaHQgKSAtIE1hdGgubWF4KHJlY3QubGVmdCwgZHJhZ1JlY3QubGVmdCkpXG4gICAgICAgICAgICAgICAgKiBNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LmJvdHRvbSwgZHJhZ1JlY3QuYm90dG9tKSAtIE1hdGgubWF4KHJlY3QudG9wICwgZHJhZ1JlY3QudG9wICkpKSxcbiAgICAgICAgICAgICAgICBvdmVybGFwUmF0aW8gPSBvdmVybGFwQXJlYSAvIChkcmFnUmVjdC53aWR0aCAqIGRyYWdSZWN0LmhlaWdodCk7XG5cbiAgICAgICAgICAgIGRyb3BwZWQgPSBvdmVybGFwUmF0aW8gPj0gZHJvcE92ZXJsYXA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyb3BDaGVja2VyKSB7XG4gICAgICAgICAgICBkcm9wcGVkID0gdGhpcy5vcHRpb25zLmRyb3BDaGVja2VyKHBvaW50ZXIsIGRyb3BwZWQsIHRoaXMsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRyb3BwZWQ7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZHJvcENoZWNrZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBmdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGlmIGEgZHJhZ2dlZCBlbGVtZW50IGlzXG4gICAgICogb3ZlciB0aGlzIEludGVyYWN0YWJsZS5cbiAgICAgKlxuICAgICAtIGNoZWNrZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgVGhlIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlbiBjaGVja2luZyBmb3IgYSBkcm9wXG4gICAgID0gKEZ1bmN0aW9uIHwgSW50ZXJhY3RhYmxlKSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgICogVGhlIGNoZWNrZXIgZnVuY3Rpb24gdGFrZXMgdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgICpcbiAgICAgLSBwb2ludGVyIChUb3VjaCB8IFBvaW50ZXJFdmVudCB8IE1vdXNlRXZlbnQpIFRoZSBwb2ludGVyL2V2ZW50IHRoYXQgZW5kcyBhIGRyYWdcbiAgICAgLSBldmVudCAoVG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudCB8IE1vdXNlRXZlbnQpIFRoZSBldmVudCByZWxhdGVkIHRvIHRoZSBwb2ludGVyXG4gICAgIC0gZHJvcHBlZCAoYm9vbGVhbikgVGhlIHZhbHVlIGZyb20gdGhlIGRlZmF1bHQgZHJvcCBjaGVja1xuICAgICAtIGRyb3B6b25lIChJbnRlcmFjdGFibGUpIFRoZSBkcm9wem9uZSBpbnRlcmFjdGFibGVcbiAgICAgLSBkcm9wRWxlbWVudCAoRWxlbWVudCkgVGhlIGRyb3B6b25lIGVsZW1lbnRcbiAgICAgLSBkcmFnZ2FibGUgKEludGVyYWN0YWJsZSkgVGhlIEludGVyYWN0YWJsZSBiZWluZyBkcmFnZ2VkXG4gICAgIC0gZHJhZ2dhYmxlRWxlbWVudCAoRWxlbWVudCkgVGhlIGFjdHVhbCBlbGVtZW50IHRoYXQncyBiZWluZyBkcmFnZ2VkXG4gICAgICpcbiAgICAgPiBVc2FnZTpcbiAgICAgfCBpbnRlcmFjdCh0YXJnZXQpXG4gICAgIHwgLmRyb3BDaGVja2VyKGZ1bmN0aW9uKHBvaW50ZXIsICAgICAgICAgICAvLyBUb3VjaC9Qb2ludGVyRXZlbnQvTW91c2VFdmVudFxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBldmVudCwgICAgICAgICAgICAgLy8gVG91Y2hFdmVudC9Qb2ludGVyRXZlbnQvTW91c2VFdmVudFxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcm9wcGVkLCAgICAgICAgICAgLy8gcmVzdWx0IG9mIHRoZSBkZWZhdWx0IGNoZWNrZXJcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUsICAgICAgICAgIC8vIGRyb3B6b25lIEludGVyYWN0YWJsZVxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcm9wRWxlbWVudCwgICAgICAgLy8gZHJvcHpvbmUgZWxlbW50XG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZSwgICAgICAgICAvLyBkcmFnZ2FibGUgSW50ZXJhY3RhYmxlXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZUVsZW1lbnQpIHsvLyBkcmFnZ2FibGUgZWxlbWVudFxuICAgICB8XG4gICAgIHwgICByZXR1cm4gZHJvcHBlZCAmJiBldmVudC50YXJnZXQuaGFzQXR0cmlidXRlKCdhbGxvdy1kcm9wJyk7XG4gICAgIHwgfVxuICAgICBcXCovXG4gICAgZHJvcENoZWNrZXI6IGZ1bmN0aW9uIChjaGVja2VyKSB7XG4gICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKGNoZWNrZXIpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXIgPSBjaGVja2VyO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hlY2tlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5nZXRSZWN0O1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXI7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuYWNjZXB0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIERlcHJlY2F0ZWQuIGFkZCBhbiBgYWNjZXB0YCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3QgcGFzc2VkIHRvXG4gICAgICogQEludGVyYWN0YWJsZS5kcm9wem9uZSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBFbGVtZW50IG9yIENTUyBzZWxlY3RvciBtYXRjaCB0aGF0IHRoaXNcbiAgICAgKiBJbnRlcmFjdGFibGUgYWNjZXB0cyBpZiBpdCBpcyBhIGRyb3B6b25lLlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKEVsZW1lbnQgfCBzdHJpbmcgfCBudWxsKSAjb3B0aW9uYWxcbiAgICAgKiBJZiBpdCBpcyBhbiBFbGVtZW50LCB0aGVuIG9ubHkgdGhhdCBlbGVtZW50IGNhbiBiZSBkcm9wcGVkIGludG8gdGhpcyBkcm9wem9uZS5cbiAgICAgKiBJZiBpdCBpcyBhIHN0cmluZywgdGhlIGVsZW1lbnQgYmVpbmcgZHJhZ2dlZCBtdXN0IG1hdGNoIGl0IGFzIGEgc2VsZWN0b3IuXG4gICAgICogSWYgaXQgaXMgbnVsbCwgdGhlIGFjY2VwdCBvcHRpb25zIGlzIGNsZWFyZWQgLSBpdCBhY2NlcHRzIGFueSBlbGVtZW50LlxuICAgICAqXG4gICAgID0gKHN0cmluZyB8IEVsZW1lbnQgfCBudWxsIHwgSW50ZXJhY3RhYmxlKSBUaGUgY3VycmVudCBhY2NlcHQgb3B0aW9uIGlmIGdpdmVuIGB1bmRlZmluZWRgIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBhY2NlcHQ6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAodXRpbHMuaXNFbGVtZW50KG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0ID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGVzdCBpZiBpdCBpcyBhIHZhbGlkIENTUyBzZWxlY3RvclxuICAgICAgICBpZiAoc2NvcGUudHJ5U2VsZWN0b3IobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5hY2NlcHQgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZHJvcC5hY2NlcHQ7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kcm9wLmFjY2VwdDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5yZXNpemFibGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXplIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGVcbiAgICAgKiBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICA9IChib29sZWFuKSBJbmRpY2F0ZXMgaWYgdGhpcyBjYW4gYmUgdGhlIHRhcmdldCBvZiByZXNpemUgZWxlbWVudHNcbiAgICAgfCB2YXIgaXNSZXNpemVhYmxlID0gaW50ZXJhY3QoJ2lucHV0W3R5cGU9dGV4dF0nKS5yZXNpemFibGUoKTtcbiAgICAgKiBvclxuICAgICAtIG9wdGlvbnMgKGJvb2xlYW4gfCBvYmplY3QpICNvcHRpb25hbCB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50IGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiByZXNpemUgZXZlbnRzIChvYmplY3QgbWFrZXMgdGhlIEludGVyYWN0YWJsZSByZXNpemFibGUpXG4gICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoe1xuICAgICB8ICAgICBvbnN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8XG4gICAgIHwgICAgIGVkZ2VzOiB7XG4gICAgIHwgICAgICAgdG9wICAgOiB0cnVlLCAgICAgICAvLyBVc2UgcG9pbnRlciBjb29yZHMgdG8gY2hlY2sgZm9yIHJlc2l6ZS5cbiAgICAgfCAgICAgICBsZWZ0ICA6IGZhbHNlLCAgICAgIC8vIERpc2FibGUgcmVzaXppbmcgZnJvbSBsZWZ0IGVkZ2UuXG4gICAgIHwgICAgICAgYm90dG9tOiAnLnJlc2l6ZS1zJywvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgbWF0Y2hlcyBzZWxlY3RvclxuICAgICB8ICAgICAgIHJpZ2h0IDogaGFuZGxlRWwgICAgLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IGlzIHRoZSBnaXZlbiBFbGVtZW50XG4gICAgIHwgICAgIH0sXG4gICAgIHxcbiAgICAgfCAgICAgLy8gYSB2YWx1ZSBvZiAnbm9uZScgd2lsbCBsaW1pdCB0aGUgcmVzaXplIHJlY3QgdG8gYSBtaW5pbXVtIG9mIDB4MFxuICAgICB8ICAgICAvLyAnbmVnYXRlJyB3aWxsIGFsbG93IHRoZSByZWN0IHRvIGhhdmUgbmVnYXRpdmUgd2lkdGgvaGVpZ2h0XG4gICAgIHwgICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgICB8ICAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgICB8ICAgICBpbnZlcnQ6ICdub25lJyB8fCAnbmVnYXRlJyB8fCAncmVwb3NpdGlvbidcbiAgICAgfFxuICAgICB8ICAgICAvLyBsaW1pdCBtdWx0aXBsZSByZXNpemVzLlxuICAgICB8ICAgICAvLyBTZWUgdGhlIGV4cGxhbmF0aW9uIGluIHRoZSBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBleGFtcGxlXG4gICAgIHwgICAgIG1heDogSW5maW5pdHksXG4gICAgIHwgICAgIG1heFBlckVsZW1lbnQ6IDEsXG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICByZXNpemFibGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbigncmVzaXplJywgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLnNldE9uRXZlbnRzKCdyZXNpemUnLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKC9eeCR8XnkkfF54eSQvLnRlc3Qob3B0aW9ucy5heGlzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuYXhpcyA9IG9wdGlvbnMuYXhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuYXhpcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuYXhpcyA9IHNjb3BlLmRlZmF1bHRPcHRpb25zLnJlc2l6ZS5heGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMuc3F1YXJlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuc3F1YXJlID0gb3B0aW9ucy5zcXVhcmU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnM7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMucmVzaXplO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnNxdWFyZVJlc2l6ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEZXByZWNhdGVkLiBBZGQgYSBgc3F1YXJlOiB0cnVlIHx8IGZhbHNlYCBwcm9wZXJ0eSB0byBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBpbnN0ZWFkXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciByZXNpemluZyBpcyBmb3JjZWQgMToxIGFzcGVjdFxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIEN1cnJlbnQgc2V0dGluZ1xuICAgICAqXG4gICAgICogb3JcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWxcbiAgICAgPSAob2JqZWN0KSB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgc3F1YXJlUmVzaXplOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuc3F1YXJlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLnJlc2l6ZS5zcXVhcmU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXNpemUuc3F1YXJlO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmdlc3R1cmFibGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgbXVsdGl0b3VjaCBnZXN0dXJlcyBjYW4gYmUgcGVyZm9ybWVkIG9uIHRoZVxuICAgICAqIEludGVyYWN0YWJsZSdzIGVsZW1lbnRcbiAgICAgKlxuICAgICA9IChib29sZWFuKSBJbmRpY2F0ZXMgaWYgdGhpcyBjYW4gYmUgdGhlIHRhcmdldCBvZiBnZXN0dXJlIGV2ZW50c1xuICAgICB8IHZhciBpc0dlc3R1cmVhYmxlID0gaW50ZXJhY3QoZWxlbWVudCkuZ2VzdHVyYWJsZSgpO1xuICAgICAqIG9yXG4gICAgIC0gb3B0aW9ucyAoYm9vbGVhbiB8IG9iamVjdCkgI29wdGlvbmFsIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnQgbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIGdlc3R1cmUgZXZlbnRzIChtYWtlcyB0aGUgSW50ZXJhY3RhYmxlIGdlc3R1cmFibGUpXG4gICAgID0gKG9iamVjdCkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5nZXN0dXJhYmxlKHtcbiAgICAgfCAgICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBsaW1pdCBtdWx0aXBsZSBnZXN0dXJlcy5cbiAgICAgfCAgICAgLy8gU2VlIHRoZSBleHBsYW5hdGlvbiBpbiBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBleGFtcGxlXG4gICAgIHwgICAgIG1heDogSW5maW5pdHksXG4gICAgIHwgICAgIG1heFBlckVsZW1lbnQ6IDEsXG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICBnZXN0dXJhYmxlOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0UGVyQWN0aW9uKCdnZXN0dXJlJywgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLnNldE9uRXZlbnRzKCdnZXN0dXJlJywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdlc3R1cmUuZW5hYmxlZCA9IG9wdGlvbnM7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5nZXN0dXJlO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmF1dG9TY3JvbGxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhbiBgYXV0b3Njcm9sbGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0XG4gICAgICogcGFzc2VkIHRvIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIG9yIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBkcmFnZ2luZyBhbmQgcmVzaXppbmcgbmVhciB0aGUgZWRnZXMgb2YgdGhlXG4gICAgICogd2luZG93L2NvbnRhaW5lciB0cmlnZ2VyIGF1dG9TY3JvbGwgZm9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgPSAob2JqZWN0KSBPYmplY3Qgd2l0aCBhdXRvU2Nyb2xsIHByb3BlcnRpZXNcbiAgICAgKlxuICAgICAqIG9yXG4gICAgICpcbiAgICAgLSBvcHRpb25zIChvYmplY3QgfCBib29sZWFuKSAjb3B0aW9uYWxcbiAgICAgKiBvcHRpb25zIGNhbiBiZTpcbiAgICAgKiAtIGFuIG9iamVjdCB3aXRoIG1hcmdpbiwgZGlzdGFuY2UgYW5kIGludGVydmFsIHByb3BlcnRpZXMsXG4gICAgICogLSB0cnVlIG9yIGZhbHNlIHRvIGVuYWJsZSBvciBkaXNhYmxlIGF1dG9TY3JvbGwgb3JcbiAgICAgPSAoSW50ZXJhY3RhYmxlKSB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgYXV0b1Njcm9sbDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gdXRpbHMuZXh0ZW5kKHsgYWN0aW9uczogWydkcmFnJywgJ3Jlc2l6ZSddfSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0geyBhY3Rpb25zOiBbJ2RyYWcnLCAncmVzaXplJ10sIGVuYWJsZWQ6IG9wdGlvbnMgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnNldE9wdGlvbnMoJ2F1dG9TY3JvbGwnLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5zbmFwXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkLiBBZGQgYSBgc25hcGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZFxuICAgICAqIHRvIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIG9yIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgaWYgYW5kIGhvdyBhY3Rpb24gY29vcmRpbmF0ZXMgYXJlIHNuYXBwZWQuIEJ5XG4gICAgICogZGVmYXVsdCwgc25hcHBpbmcgaXMgcmVsYXRpdmUgdG8gdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMuIFlvdSBjYW5cbiAgICAgKiBjaGFuZ2UgdGhpcyBieSBzZXR0aW5nIHRoZVxuICAgICAqIFtgZWxlbWVudE9yaWdpbmBdKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL3B1bGwvNzIpLlxuICAgICAqKlxuICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBgZmFsc2VgIGlmIHNuYXAgaXMgZGlzYWJsZWQ7IG9iamVjdCB3aXRoIHNuYXAgcHJvcGVydGllcyBpZiBzbmFwIGlzIGVuYWJsZWRcbiAgICAgKipcbiAgICAgKiBvclxuICAgICAqKlxuICAgICAtIG9wdGlvbnMgKG9iamVjdCB8IGJvb2xlYW4gfCBudWxsKSAjb3B0aW9uYWxcbiAgICAgPSAoSW50ZXJhY3RhYmxlKSB0aGlzIEludGVyYWN0YWJsZVxuICAgICA+IFVzYWdlXG4gICAgIHwgaW50ZXJhY3QoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3RoaW5nJykpLnNuYXAoe1xuICAgICB8ICAgICB0YXJnZXRzOiBbXG4gICAgIHwgICAgICAgICAvLyBzbmFwIHRvIHRoaXMgc3BlY2lmaWMgcG9pbnRcbiAgICAgfCAgICAgICAgIHtcbiAgICAgfCAgICAgICAgICAgICB4OiAxMDAsXG4gICAgIHwgICAgICAgICAgICAgeTogMTAwLFxuICAgICB8ICAgICAgICAgICAgIHJhbmdlOiAyNVxuICAgICB8ICAgICAgICAgfSxcbiAgICAgfCAgICAgICAgIC8vIGdpdmUgdGhpcyBmdW5jdGlvbiB0aGUgeCBhbmQgeSBwYWdlIGNvb3JkcyBhbmQgc25hcCB0byB0aGUgb2JqZWN0IHJldHVybmVkXG4gICAgIHwgICAgICAgICBmdW5jdGlvbiAoeCwgeSkge1xuICAgICB8ICAgICAgICAgICAgIHJldHVybiB7XG4gICAgIHwgICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgIHwgICAgICAgICAgICAgICAgIHk6ICg3NSArIDUwICogTWF0aC5zaW4oeCAqIDAuMDQpKSxcbiAgICAgfCAgICAgICAgICAgICAgICAgcmFuZ2U6IDQwXG4gICAgIHwgICAgICAgICAgICAgfTtcbiAgICAgfCAgICAgICAgIH0sXG4gICAgIHwgICAgICAgICAvLyBjcmVhdGUgYSBmdW5jdGlvbiB0aGF0IHNuYXBzIHRvIGEgZ3JpZFxuICAgICB8ICAgICAgICAgaW50ZXJhY3QuY3JlYXRlU25hcEdyaWQoe1xuICAgICB8ICAgICAgICAgICAgIHg6IDUwLFxuICAgICB8ICAgICAgICAgICAgIHk6IDUwLFxuICAgICB8ICAgICAgICAgICAgIHJhbmdlOiAxMCwgICAgICAgICAgICAgIC8vIG9wdGlvbmFsXG4gICAgIHwgICAgICAgICAgICAgb2Zmc2V0OiB7IHg6IDUsIHk6IDEwIH0gLy8gb3B0aW9uYWxcbiAgICAgfCAgICAgICAgIH0pXG4gICAgIHwgICAgIF0sXG4gICAgIHwgICAgIC8vIGRvIG5vdCBzbmFwIGR1cmluZyBub3JtYWwgbW92ZW1lbnQuXG4gICAgIHwgICAgIC8vIEluc3RlYWQsIHRyaWdnZXIgb25seSBvbmUgc25hcHBlZCBtb3ZlIGV2ZW50XG4gICAgIHwgICAgIC8vIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZW5kIGV2ZW50LlxuICAgICB8ICAgICBlbmRPbmx5OiB0cnVlLFxuICAgICB8XG4gICAgIHwgICAgIHJlbGF0aXZlUG9pbnRzOiBbXG4gICAgIHwgICAgICAgICB7IHg6IDAsIHk6IDAgfSwgIC8vIHNuYXAgcmVsYXRpdmUgdG8gdGhlIHRvcCBsZWZ0IG9mIHRoZSBlbGVtZW50XG4gICAgIHwgICAgICAgICB7IHg6IDEsIHk6IDEgfSwgIC8vIGFuZCBhbHNvIHRvIHRoZSBib3R0b20gcmlnaHRcbiAgICAgfCAgICAgXSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBvZmZzZXQgdGhlIHNuYXAgdGFyZ2V0IGNvb3JkaW5hdGVzXG4gICAgIHwgICAgIC8vIGNhbiBiZSBhbiBvYmplY3Qgd2l0aCB4L3kgb3IgJ3N0YXJ0Q29vcmRzJ1xuICAgICB8ICAgICBvZmZzZXQ6IHsgeDogNTAsIHk6IDUwIH1cbiAgICAgfCAgIH1cbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHNuYXA6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXQgPSB0aGlzLnNldE9wdGlvbnMoJ3NuYXAnLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAocmV0ID09PSB0aGlzKSB7IHJldHVybiB0aGlzOyB9XG5cbiAgICAgICAgcmV0dXJuIHJldC5kcmFnO1xuICAgIH0sXG5cbiAgICBjcmVhdGVTbmFwR3JpZDogZnVuY3Rpb24gKGdyaWQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0WCA9IDAsXG4gICAgICAgICAgICAgICAgb2Zmc2V0WSA9IDA7XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChncmlkLm9mZnNldCkpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gZ3JpZC5vZmZzZXQueDtcbiAgICAgICAgICAgICAgICBvZmZzZXRZID0gZ3JpZC5vZmZzZXQueTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdyaWR4ID0gTWF0aC5yb3VuZCgoeCAtIG9mZnNldFgpIC8gZ3JpZC54KSxcbiAgICAgICAgICAgICAgICBncmlkeSA9IE1hdGgucm91bmQoKHkgLSBvZmZzZXRZKSAvIGdyaWQueSksXG5cbiAgICAgICAgICAgICAgICBuZXdYID0gZ3JpZHggKiBncmlkLnggKyBvZmZzZXRYLFxuICAgICAgICAgICAgICAgIG5ld1kgPSBncmlkeSAqIGdyaWQueSArIG9mZnNldFk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogbmV3WCxcbiAgICAgICAgICAgICAgICB5OiBuZXdZLFxuICAgICAgICAgICAgICAgIHJhbmdlOiBncmlkLnJhbmdlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBzZXRPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBvcHRpb25zICYmIHNjb3BlLmlzQXJyYXkob3B0aW9ucy5hY3Rpb25zKVxuICAgICAgICAgICAgPyBvcHRpb25zLmFjdGlvbnNcbiAgICAgICAgICAgIDogWydkcmFnJ107XG5cbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpIHx8IHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0gL3Jlc2l6ZS8udGVzdChhY3Rpb25zW2ldKT8gJ3Jlc2l6ZScgOiBhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS5pc09iamVjdCh0aGlzLm9wdGlvbnNbYWN0aW9uXSkpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgICAgIHZhciB0aGlzT3B0aW9uID0gdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXTtcblxuICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5leHRlbmQodGhpc09wdGlvbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24uZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb24gPT09ICdzbmFwJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNPcHRpb24ubW9kZSA9PT0gJ2dyaWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi50YXJnZXRzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNyZWF0ZVNuYXBHcmlkKHV0aWxzLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHRoaXNPcHRpb24uZ3JpZE9mZnNldCB8fCB7IHg6IDAsIHk6IDAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB0aGlzT3B0aW9uLmdyaWQgfHwge30pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzT3B0aW9uLm1vZGUgPT09ICdhbmNob3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi50YXJnZXRzID0gdGhpc09wdGlvbi5hbmNob3JzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpc09wdGlvbi5tb2RlID09PSAncGF0aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnRhcmdldHMgPSB0aGlzT3B0aW9uLnBhdGhzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJ2VsZW1lbnRPcmlnaW4nIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnJlbGF0aXZlUG9pbnRzID0gW29wdGlvbnMuZWxlbWVudE9yaWdpbl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24uZW5hYmxlZCA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXQgPSB7fSxcbiAgICAgICAgICAgIGFsbEFjdGlvbnMgPSBbJ2RyYWcnLCAncmVzaXplJywgJ2dlc3R1cmUnXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWxsQWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbiBpbiBzY29wZS5kZWZhdWx0T3B0aW9uc1thbGxBY3Rpb25zW2ldXSkge1xuICAgICAgICAgICAgICAgIHJldFthbGxBY3Rpb25zW2ldXSA9IHRoaXMub3B0aW9uc1thbGxBY3Rpb25zW2ldXVtvcHRpb25dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmluZXJ0aWFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhbiBgaW5lcnRpYWAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZFxuICAgICAqIHRvIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIG9yIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgaWYgYW5kIGhvdyBldmVudHMgY29udGludWUgdG8gcnVuIGFmdGVyIHRoZSBwb2ludGVyIGlzIHJlbGVhc2VkXG4gICAgICoqXG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIGBmYWxzZWAgaWYgaW5lcnRpYSBpcyBkaXNhYmxlZDsgYG9iamVjdGAgd2l0aCBpbmVydGlhIHByb3BlcnRpZXMgaWYgaW5lcnRpYSBpcyBlbmFibGVkXG4gICAgICoqXG4gICAgICogb3JcbiAgICAgKipcbiAgICAgLSBvcHRpb25zIChvYmplY3QgfCBib29sZWFuIHwgbnVsbCkgI29wdGlvbmFsXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIGVuYWJsZSBhbmQgdXNlIGRlZmF1bHQgc2V0dGluZ3NcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pbmVydGlhKHRydWUpO1xuICAgICB8XG4gICAgIHwgLy8gZW5hYmxlIGFuZCB1c2UgY3VzdG9tIHNldHRpbmdzXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaW5lcnRpYSh7XG4gICAgIHwgICAgIC8vIHZhbHVlIGdyZWF0ZXIgdGhhbiAwXG4gICAgIHwgICAgIC8vIGhpZ2ggdmFsdWVzIHNsb3cgdGhlIG9iamVjdCBkb3duIG1vcmUgcXVpY2tseVxuICAgICB8ICAgICByZXNpc3RhbmNlICAgICA6IDE2LFxuICAgICB8XG4gICAgIHwgICAgIC8vIHRoZSBtaW5pbXVtIGxhdW5jaCBzcGVlZCAocGl4ZWxzIHBlciBzZWNvbmQpIHRoYXQgcmVzdWx0cyBpbiBpbmVydGlhIHN0YXJ0XG4gICAgIHwgICAgIG1pblNwZWVkICAgICAgIDogMjAwLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGluZXJ0aWEgd2lsbCBzdG9wIHdoZW4gdGhlIG9iamVjdCBzbG93cyBkb3duIHRvIHRoaXMgc3BlZWRcbiAgICAgfCAgICAgZW5kU3BlZWQgICAgICAgOiAyMCxcbiAgICAgfFxuICAgICB8ICAgICAvLyBib29sZWFuOyBzaG91bGQgYWN0aW9ucyBiZSByZXN1bWVkIHdoZW4gdGhlIHBvaW50ZXIgZ29lcyBkb3duIGR1cmluZyBpbmVydGlhXG4gICAgIHwgICAgIGFsbG93UmVzdW1lICAgIDogdHJ1ZSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBib29sZWFuOyBzaG91bGQgdGhlIGp1bXAgd2hlbiByZXN1bWluZyBmcm9tIGluZXJ0aWEgYmUgaWdub3JlZCBpbiBldmVudC5keC9keVxuICAgICB8ICAgICB6ZXJvUmVzdW1lRGVsdGE6IGZhbHNlLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGlmIHNuYXAvcmVzdHJpY3QgYXJlIHNldCB0byBiZSBlbmRPbmx5IGFuZCBpbmVydGlhIGlzIGVuYWJsZWQsIHJlbGVhc2luZ1xuICAgICB8ICAgICAvLyB0aGUgcG9pbnRlciB3aXRob3V0IHRyaWdnZXJpbmcgaW5lcnRpYSB3aWxsIGFuaW1hdGUgZnJvbSB0aGUgcmVsZWFzZVxuICAgICB8ICAgICAvLyBwb2ludCB0byB0aGUgc25hcGVkL3Jlc3RyaWN0ZWQgcG9pbnQgaW4gdGhlIGdpdmVuIGFtb3VudCBvZiB0aW1lIChtcylcbiAgICAgfCAgICAgc21vb3RoRW5kRHVyYXRpb246IDMwMCxcbiAgICAgfFxuICAgICB8ICAgICAvLyBhbiBhcnJheSBvZiBhY3Rpb24gdHlwZXMgdGhhdCBjYW4gaGF2ZSBpbmVydGlhIChubyBnZXN0dXJlKVxuICAgICB8ICAgICBhY3Rpb25zICAgICAgICA6IFsnZHJhZycsICdyZXNpemUnXVxuICAgICB8IH0pO1xuICAgICB8XG4gICAgIHwgLy8gcmVzZXQgY3VzdG9tIHNldHRpbmdzIGFuZCB1c2UgYWxsIGRlZmF1bHRzXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaW5lcnRpYShudWxsKTtcbiAgICAgXFwqL1xuICAgIGluZXJ0aWE6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXQgPSB0aGlzLnNldE9wdGlvbnMoJ2luZXJ0aWEnLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAocmV0ID09PSB0aGlzKSB7IHJldHVybiB0aGlzOyB9XG5cbiAgICAgICAgcmV0dXJuIHJldC5kcmFnO1xuICAgIH0sXG5cbiAgICBnZXRBY3Rpb246IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMuZGVmYXVsdEFjdGlvbkNoZWNrZXIocG9pbnRlciwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBhY3Rpb24sIHRoaXMsIGVsZW1lbnQsIGludGVyYWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgfSxcblxuICAgIGRlZmF1bHRBY3Rpb25DaGVja2VyOiBkZWZhdWx0QWN0aW9uQ2hlY2tlcixcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuYWN0aW9uQ2hlY2tlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvblxuICAgICAqIHBvaW50ZXJEb3duXG4gICAgICpcbiAgICAgLSBjaGVja2VyIChmdW5jdGlvbiB8IG51bGwpICNvcHRpb25hbCBBIGZ1bmN0aW9uIHdoaWNoIHRha2VzIGEgcG9pbnRlciBldmVudCwgZGVmYXVsdEFjdGlvbiBzdHJpbmcsIGludGVyYWN0YWJsZSwgZWxlbWVudCBhbmQgaW50ZXJhY3Rpb24gYXMgcGFyYW1ldGVycyBhbmQgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBuYW1lIHByb3BlcnR5ICdkcmFnJyAncmVzaXplJyBvciAnZ2VzdHVyZScgYW5kIG9wdGlvbmFsbHkgYW4gYGVkZ2VzYCBvYmplY3Qgd2l0aCBib29sZWFuICd0b3AnLCAnbGVmdCcsICdib3R0b20nIGFuZCByaWdodCBwcm9wcy5cbiAgICAgPSAoRnVuY3Rpb24gfCBJbnRlcmFjdGFibGUpIFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgfCBpbnRlcmFjdCgnLnJlc2l6ZS1kcmFnJylcbiAgICAgfCAgIC5yZXNpemFibGUodHJ1ZSlcbiAgICAgfCAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICAgfCAgIC5hY3Rpb25DaGVja2VyKGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uKSB7XG4gICAgIHxcbiAgICAgfCAgIGlmIChpbnRlcmFjdC5tYXRjaGVzU2VsZWN0b3IoZXZlbnQudGFyZ2V0LCAnLmRyYWctaGFuZGxlJykge1xuICAgICB8ICAgICAvLyBmb3JjZSBkcmFnIHdpdGggaGFuZGxlIHRhcmdldFxuICAgICB8ICAgICBhY3Rpb24ubmFtZSA9IGRyYWc7XG4gICAgIHwgICB9XG4gICAgIHwgICBlbHNlIHtcbiAgICAgfCAgICAgLy8gcmVzaXplIGZyb20gdGhlIHRvcCBhbmQgcmlnaHQgZWRnZXNcbiAgICAgfCAgICAgYWN0aW9uLm5hbWUgID0gJ3Jlc2l6ZSc7XG4gICAgIHwgICAgIGFjdGlvbi5lZGdlcyA9IHsgdG9wOiB0cnVlLCByaWdodDogdHJ1ZSB9O1xuICAgICB8ICAgfVxuICAgICB8XG4gICAgIHwgICByZXR1cm4gYWN0aW9uO1xuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgYWN0aW9uQ2hlY2tlcjogZnVuY3Rpb24gKGNoZWNrZXIpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oY2hlY2tlcikpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyID0gY2hlY2tlcjtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcjtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5nZXRSZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIHRvIGdldCBhbiBJbnRlcmFjdGFibGVzIGJvdW5kaW5nIHJlY3QuIENhbiBiZVxuICAgICAqIG92ZXJyaWRkZW4gdXNpbmcgQEludGVyYWN0YWJsZS5yZWN0Q2hlY2tlci5cbiAgICAgKlxuICAgICAtIGVsZW1lbnQgKEVsZW1lbnQpICNvcHRpb25hbCBUaGUgZWxlbWVudCB0byBtZWFzdXJlLlxuICAgICA9IChvYmplY3QpIFRoZSBvYmplY3QncyBib3VuZGluZyByZWN0YW5nbGUuXG4gICAgIG8ge1xuICAgICBvICAgICB0b3AgICA6IDAsXG4gICAgIG8gICAgIGxlZnQgIDogMCxcbiAgICAgbyAgICAgYm90dG9tOiAwLFxuICAgICBvICAgICByaWdodCA6IDAsXG4gICAgIG8gICAgIHdpZHRoIDogMCxcbiAgICAgbyAgICAgaGVpZ2h0OiAwXG4gICAgIG8gfVxuICAgICBcXCovXG4gICAgZ2V0UmVjdDogZnVuY3Rpb24gcmVjdENoZWNrIChlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuX2VsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0b3IgJiYgISh1dGlscy5pc0VsZW1lbnQoZWxlbWVudCkpKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5fY29udGV4dC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjb3BlLmdldEVsZW1lbnRSZWN0KGVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnJlY3RDaGVja2VyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjYWxjdWxhdGUgdGhlIGludGVyYWN0YWJsZSdzXG4gICAgICogZWxlbWVudCdzIHJlY3RhbmdsZVxuICAgICAqXG4gICAgIC0gY2hlY2tlciAoZnVuY3Rpb24pICNvcHRpb25hbCBBIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhpcyBJbnRlcmFjdGFibGUncyBib3VuZGluZyByZWN0YW5nbGUuIFNlZSBASW50ZXJhY3RhYmxlLmdldFJlY3RcbiAgICAgPSAoZnVuY3Rpb24gfCBvYmplY3QpIFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICByZWN0Q2hlY2tlcjogZnVuY3Rpb24gKGNoZWNrZXIpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oY2hlY2tlcikpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0UmVjdCA9IGNoZWNrZXI7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZ2V0UmVjdDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRSZWN0O1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnN0eWxlQ3Vyc29yXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRoZSBhY3Rpb24gdGhhdCB3b3VsZCBiZSBwZXJmb3JtZWQgd2hlbiB0aGVcbiAgICAgKiBtb3VzZSBvbiB0aGUgZWxlbWVudCBhcmUgY2hlY2tlZCBvbiBgbW91c2Vtb3ZlYCBzbyB0aGF0IHRoZSBjdXJzb3JcbiAgICAgKiBtYXkgYmUgc3R5bGVkIGFwcHJvcHJpYXRlbHlcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWxcbiAgICAgPSAoYm9vbGVhbiB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgc3R5bGVDdXJzb3I6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3I7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUucHJldmVudERlZmF1bHRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdG8gcHJldmVudCB0aGUgYnJvd3NlcidzIGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgICogaW4gcmVzcG9uc2UgdG8gcG9pbnRlciBldmVudHMuIENhbiBiZSBzZXQgdG86XG4gICAgICogIC0gYCdhbHdheXMnYCB0byBhbHdheXMgcHJldmVudFxuICAgICAqICAtIGAnbmV2ZXInYCB0byBuZXZlciBwcmV2ZW50XG4gICAgICogIC0gYCdhdXRvJ2AgdG8gbGV0IGludGVyYWN0LmpzIHRyeSB0byBkZXRlcm1pbmUgd2hhdCB3b3VsZCBiZSBiZXN0XG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoc3RyaW5nKSAjb3B0aW9uYWwgYHRydWVgLCBgZmFsc2VgIG9yIGAnYXV0bydgXG4gICAgID0gKHN0cmluZyB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoL14oYWx3YXlzfG5ldmVyfGF1dG8pJC8udGVzdChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnByZXZlbnREZWZhdWx0ID0gbmV3VmFsdWU/ICdhbHdheXMnIDogJ25ldmVyJztcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5vcmlnaW5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBvcmlnaW4gb2YgdGhlIEludGVyYWN0YWJsZSdzIGVsZW1lbnQuICBUaGUgeCBhbmQgeVxuICAgICAqIG9mIHRoZSBvcmlnaW4gd2lsbCBiZSBzdWJ0cmFjdGVkIGZyb20gYWN0aW9uIGV2ZW50IGNvb3JkaW5hdGVzLlxuICAgICAqXG4gICAgIC0gb3JpZ2luIChvYmplY3QgfCBzdHJpbmcpICNvcHRpb25hbCBBbiBvYmplY3QgZWcuIHsgeDogMCwgeTogMCB9IG9yIHN0cmluZyAncGFyZW50JywgJ3NlbGYnIG9yIGFueSBDU1Mgc2VsZWN0b3JcbiAgICAgKiBPUlxuICAgICAtIG9yaWdpbiAoRWxlbWVudCkgI29wdGlvbmFsIEFuIEhUTUwgb3IgU1ZHIEVsZW1lbnQgd2hvc2UgcmVjdCB3aWxsIGJlIHVzZWRcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBUaGUgY3VycmVudCBvcmlnaW4gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIG9yaWdpbjogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vcmlnaW4gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjb3BlLmlzT2JqZWN0KG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLm9yaWdpbiA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm9yaWdpbjtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5kZWx0YVNvdXJjZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1vdXNlIGNvb3JkaW5hdGUgdHlwZXMgdXNlZCB0byBjYWxjdWxhdGUgdGhlXG4gICAgICogbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXIuXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoc3RyaW5nKSAjb3B0aW9uYWwgVXNlICdjbGllbnQnIGlmIHlvdSB3aWxsIGJlIHNjcm9sbGluZyB3aGlsZSBpbnRlcmFjdGluZzsgVXNlICdwYWdlJyBpZiB5b3Ugd2FudCBhdXRvU2Nyb2xsIHRvIHdvcmtcbiAgICAgPSAoc3RyaW5nIHwgb2JqZWN0KSBUaGUgY3VycmVudCBkZWx0YVNvdXJjZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgZGVsdGFTb3VyY2U6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAobmV3VmFsdWUgPT09ICdwYWdlJyB8fCBuZXdWYWx1ZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2U7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUucmVzdHJpY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhIGByZXN0cmljdGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB0b1xuICAgICAqIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlLCBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBvciBASW50ZXJhY3RhYmxlLmdlc3R1cmFibGUgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgcmVjdGFuZ2xlcyB3aXRoaW4gd2hpY2ggYWN0aW9ucyBvbiB0aGlzXG4gICAgICogaW50ZXJhY3RhYmxlIChhZnRlciBzbmFwIGNhbGN1bGF0aW9ucykgYXJlIHJlc3RyaWN0ZWQuIEJ5IGRlZmF1bHQsXG4gICAgICogcmVzdHJpY3RpbmcgaXMgcmVsYXRpdmUgdG8gdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMuIFlvdSBjYW4gY2hhbmdlXG4gICAgICogdGhpcyBieSBzZXR0aW5nIHRoZVxuICAgICAqIFtgZWxlbWVudFJlY3RgXShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9wdWxsLzcyKS5cbiAgICAgKipcbiAgICAgLSBvcHRpb25zIChvYmplY3QpICNvcHRpb25hbCBhbiBvYmplY3Qgd2l0aCBrZXlzIGRyYWcsIHJlc2l6ZSwgYW5kL29yIGdlc3R1cmUgd2hvc2UgdmFsdWVzIGFyZSByZWN0cywgRWxlbWVudHMsIENTUyBzZWxlY3RvcnMsIG9yICdwYXJlbnQnIG9yICdzZWxmJ1xuICAgICA9IChvYmplY3QpIFRoZSBjdXJyZW50IHJlc3RyaWN0aW9ucyBvYmplY3Qgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5yZXN0cmljdCh7XG4gICAgIHwgICAgIC8vIHRoZSByZWN0IHdpbGwgYmUgYGludGVyYWN0LmdldEVsZW1lbnRSZWN0KGVsZW1lbnQucGFyZW50Tm9kZSlgXG4gICAgIHwgICAgIGRyYWc6IGVsZW1lbnQucGFyZW50Tm9kZSxcbiAgICAgfFxuICAgICB8ICAgICAvLyB4IGFuZCB5IGFyZSByZWxhdGl2ZSB0byB0aGUgdGhlIGludGVyYWN0YWJsZSdzIG9yaWdpblxuICAgICB8ICAgICByZXNpemU6IHsgeDogMTAwLCB5OiAxMDAsIHdpZHRoOiAyMDAsIGhlaWdodDogMjAwIH1cbiAgICAgfCB9KVxuICAgICB8XG4gICAgIHwgaW50ZXJhY3QoJy5kcmFnZ2FibGUnKS5yZXN0cmljdCh7XG4gICAgIHwgICAgIC8vIHRoZSByZWN0IHdpbGwgYmUgdGhlIHNlbGVjdGVkIGVsZW1lbnQncyBwYXJlbnRcbiAgICAgfCAgICAgZHJhZzogJ3BhcmVudCcsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gZG8gbm90IHJlc3RyaWN0IGR1cmluZyBub3JtYWwgbW92ZW1lbnQuXG4gICAgIHwgICAgIC8vIEluc3RlYWQsIHRyaWdnZXIgb25seSBvbmUgcmVzdHJpY3RlZCBtb3ZlIGV2ZW50XG4gICAgIHwgICAgIC8vIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZW5kIGV2ZW50LlxuICAgICB8ICAgICBlbmRPbmx5OiB0cnVlLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL3B1bGwvNzIjaXNzdWUtNDE4MTM0OTNcbiAgICAgfCAgICAgZWxlbWVudFJlY3Q6IHsgdG9wOiAwLCBsZWZ0OiAwLCBib3R0b206IDEsIHJpZ2h0OiAxIH1cbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHJlc3RyaWN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoIXNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRPcHRpb25zKCdyZXN0cmljdCcsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbJ2RyYWcnLCAncmVzaXplJywgJ2dlc3R1cmUnXSxcbiAgICAgICAgICAgIHJldDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICBpZiAoYWN0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGVyQWN0aW9uID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW2FjdGlvbl0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uOiBvcHRpb25zW2FjdGlvbl1cbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIHJldCA9IHRoaXMuc2V0T3B0aW9ucygncmVzdHJpY3QnLCBwZXJBY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5jb250ZXh0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgdGhlIHNlbGVjdG9yIGNvbnRleHQgTm9kZSBvZiB0aGUgSW50ZXJhY3RhYmxlLiBUaGUgZGVmYXVsdCBpcyBgd2luZG93LmRvY3VtZW50YC5cbiAgICAgKlxuICAgICA9IChOb2RlKSBUaGUgY29udGV4dCBOb2RlIG9mIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICoqXG4gICAgIFxcKi9cbiAgICBjb250ZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgIH0sXG5cbiAgICBfY29udGV4dDogc2NvcGUuZG9jdW1lbnQsXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmlnbm9yZUZyb21cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgXG4gICAgICogZXZlbnQgb3IgYW55IG9mIGl0J3MgcGFyZW50cyBtYXRjaCB0aGUgZ2l2ZW4gQ1NTIHNlbGVjdG9yIG9yXG4gICAgICogRWxlbWVudCwgbm8gZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkLlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKHN0cmluZyB8IEVsZW1lbnQgfCBudWxsKSAjb3B0aW9uYWwgYSBDU1Mgc2VsZWN0b3Igc3RyaW5nLCBhbiBFbGVtZW50IG9yIGBudWxsYCB0byBub3QgaWdub3JlIGFueSBlbGVtZW50c1xuICAgICA9IChzdHJpbmcgfCBFbGVtZW50IHwgb2JqZWN0KSBUaGUgY3VycmVudCBpZ25vcmVGcm9tIHZhbHVlIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICoqXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCwgeyBpZ25vcmVGcm9tOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm8tYWN0aW9uJykgfSk7XG4gICAgIHwgLy8gb3JcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pZ25vcmVGcm9tKCdpbnB1dCwgdGV4dGFyZWEsIGEnKTtcbiAgICAgXFwqL1xuICAgIGlnbm9yZUZyb206IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUudHJ5U2VsZWN0b3IobmV3VmFsdWUpKSB7ICAgICAgICAgICAgLy8gQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIGV2ZW50LnRhcmdldFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmlnbm9yZUZyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChuZXdWYWx1ZSkpIHsgICAgICAgICAgICAgIC8vIHNwZWNpZmljIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pZ25vcmVGcm9tID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaWdub3JlRnJvbTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5hbGxvd0Zyb21cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQSBkcmFnL3Jlc2l6ZS9nZXN0dXJlIGlzIHN0YXJ0ZWQgb25seSBJZiB0aGUgdGFyZ2V0IG9mIHRoZVxuICAgICAqIGBtb3VzZWRvd25gLCBgcG9pbnRlcmRvd25gIG9yIGB0b3VjaHN0YXJ0YCBldmVudCBvciBhbnkgb2YgaXQnc1xuICAgICAqIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvciBFbGVtZW50LlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKHN0cmluZyB8IEVsZW1lbnQgfCBudWxsKSAjb3B0aW9uYWwgYSBDU1Mgc2VsZWN0b3Igc3RyaW5nLCBhbiBFbGVtZW50IG9yIGBudWxsYCB0byBhbGxvdyBmcm9tIGFueSBlbGVtZW50XG4gICAgID0gKHN0cmluZyB8IEVsZW1lbnQgfCBvYmplY3QpIFRoZSBjdXJyZW50IGFsbG93RnJvbSB2YWx1ZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqKlxuICAgICB8IGludGVyYWN0KGVsZW1lbnQsIHsgYWxsb3dGcm9tOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHJhZy1oYW5kbGUnKSB9KTtcbiAgICAgfCAvLyBvclxuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmFsbG93RnJvbSgnLmhhbmRsZScpO1xuICAgICBcXCovXG4gICAgYWxsb3dGcm9tOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKHNjb3BlLnRyeVNlbGVjdG9yKG5ld1ZhbHVlKSkgeyAgICAgICAgICAgIC8vIENTUyBzZWxlY3RvciB0byBtYXRjaCBldmVudC50YXJnZXRcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hbGxvd0Zyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChuZXdWYWx1ZSkpIHsgICAgICAgICAgICAgIC8vIHNwZWNpZmljIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hbGxvd0Zyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hbGxvd0Zyb207XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZWxlbWVudFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBJZiB0aGlzIGlzIG5vdCBhIHNlbGVjdG9yIEludGVyYWN0YWJsZSwgaXQgcmV0dXJucyB0aGUgZWxlbWVudCB0aGlzXG4gICAgICogaW50ZXJhY3RhYmxlIHJlcHJlc2VudHNcbiAgICAgKlxuICAgICA9IChFbGVtZW50KSBIVE1MIC8gU1ZHIEVsZW1lbnRcbiAgICAgXFwqL1xuICAgIGVsZW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZmlyZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBDYWxscyBsaXN0ZW5lcnMgZm9yIHRoZSBnaXZlbiBJbnRlcmFjdEV2ZW50IHR5cGUgYm91bmQgZ2xvYmFsbHlcbiAgICAgKiBhbmQgZGlyZWN0bHkgdG8gdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICAtIGlFdmVudCAoSW50ZXJhY3RFdmVudCkgVGhlIEludGVyYWN0RXZlbnQgb2JqZWN0IHRvIGJlIGZpcmVkIG9uIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGZpcmU6IGZ1bmN0aW9uIChpRXZlbnQpIHtcbiAgICAgICAgaWYgKCEoaUV2ZW50ICYmIGlFdmVudC50eXBlKSB8fCAhc2NvcGUuY29udGFpbnMoc2NvcGUuZXZlbnRUeXBlcywgaUV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgb25FdmVudCA9ICdvbicgKyBpRXZlbnQudHlwZSxcbiAgICAgICAgICAgIGZ1bmNOYW1lID0gJyc7XG5cbiAgICAgICAgLy8gSW50ZXJhY3RhYmxlI29uKCkgbGlzdGVuZXJzXG4gICAgICAgIGlmIChpRXZlbnQudHlwZSBpbiB0aGlzLl9pRXZlbnRzKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSB0aGlzLl9pRXZlbnRzW2lFdmVudC50eXBlXTtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbiAmJiAhaUV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZnVuY05hbWUgPSBsaXN0ZW5lcnNbaV0ubmFtZTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0oaUV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGludGVyYWN0YWJsZS5vbmV2ZW50IGxpc3RlbmVyXG4gICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHRoaXNbb25FdmVudF0pKSB7XG4gICAgICAgICAgICBmdW5jTmFtZSA9IHRoaXNbb25FdmVudF0ubmFtZTtcbiAgICAgICAgICAgIHRoaXNbb25FdmVudF0oaUV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGludGVyYWN0Lm9uKCkgbGlzdGVuZXJzXG4gICAgICAgIGlmIChpRXZlbnQudHlwZSBpbiBzY29wZS5nbG9iYWxFdmVudHMgJiYgKGxpc3RlbmVycyA9IHNjb3BlLmdsb2JhbEV2ZW50c1tpRXZlbnQudHlwZV0pKSAge1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuICYmICFpRXZlbnQuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmdW5jTmFtZSA9IGxpc3RlbmVyc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXShpRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUub25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQmluZHMgYSBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCBvciBET00gZXZlbnQuXG4gICAgICpcbiAgICAgLSBldmVudFR5cGUgIChzdHJpbmcgfCBhcnJheSB8IG9iamVjdCkgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW4gZm9yXG4gICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gdGhlIGdpdmVuIGV2ZW50KHMpXG4gICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBvbjogZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKGV2ZW50VHlwZSkgJiYgZXZlbnRUeXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlLnRyaW0oKS5zcGxpdCgvICsvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0FycmF5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBldmVudFR5cGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uKGV2ZW50VHlwZVtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGV2ZW50VHlwZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub24ocHJvcCwgZXZlbnRUeXBlW3Byb3BdLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ3doZWVsJykge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gc2NvcGUud2hlZWxFdmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnZlcnQgdG8gYm9vbGVhblxuICAgICAgICB1c2VDYXB0dXJlID0gdXNlQ2FwdHVyZT8gdHJ1ZTogZmFsc2U7XG5cbiAgICAgICAgaWYgKHNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgdHlwZSBvZiBldmVudCB3YXMgbmV2ZXIgYm91bmQgdG8gdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgICAgIGlmICghKGV2ZW50VHlwZSBpbiB0aGlzLl9pRXZlbnRzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lFdmVudHNbZXZlbnRUeXBlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pRXZlbnRzW2V2ZW50VHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZGVsZWdhdGVkIGV2ZW50IGZvciBzZWxlY3RvclxuICAgICAgICBlbHNlIGlmICh0aGlzLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICBpZiAoIXNjb3BlLmRlbGVnYXRlZEV2ZW50c1tldmVudFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yczogW10sXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRzIDogW10sXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gYWRkIGRlbGVnYXRlIGxpc3RlbmVyIGZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzY29wZS5kb2N1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZChzY29wZS5kb2N1bWVudHNbaV0sIGV2ZW50VHlwZSwgbGlzdGVuZXIuZGVsZWdhdGVMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQoc2NvcGUuZG9jdW1lbnRzW2ldLCBldmVudFR5cGUsIGxpc3RlbmVyLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVsZWdhdGVkID0gc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0sXG4gICAgICAgICAgICAgICAgaW5kZXg7XG5cbiAgICAgICAgICAgIGZvciAoaW5kZXggPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCAtIDE7IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVsZWdhdGVkLnNlbGVjdG9yc1tpbmRleF0gPT09IHRoaXMuc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgJiYgZGVsZWdhdGVkLmNvbnRleHRzW2luZGV4XSA9PT0gdGhpcy5fY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5wdXNoKHRoaXMuc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0cyAucHVzaCh0aGlzLl9jb250ZXh0KTtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzLnB1c2goW10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBrZWVwIGxpc3RlbmVyIGFuZCB1c2VDYXB0dXJlIGZsYWdcbiAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnNbaW5kZXhdLnB1c2goW2xpc3RlbmVyLCB1c2VDYXB0dXJlXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsIGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUub2ZmXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJlbW92ZXMgYW4gSW50ZXJhY3RFdmVudCBvciBET00gZXZlbnQgbGlzdGVuZXJcbiAgICAgKlxuICAgICAtIGV2ZW50VHlwZSAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRoYXQgd2VyZSBsaXN0ZW5lZCBmb3JcbiAgICAgLSBsaXN0ZW5lciAgIChmdW5jdGlvbikgVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGJlIHJlbW92ZWRcbiAgICAgLSB1c2VDYXB0dXJlIChib29sZWFuKSAjb3B0aW9uYWwgdXNlQ2FwdHVyZSBmbGFnIGZvciByZW1vdmVFdmVudExpc3RlbmVyXG4gICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKGV2ZW50VHlwZSkgJiYgZXZlbnRUeXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlLnRyaW0oKS5zcGxpdCgvICsvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0FycmF5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBldmVudFR5cGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZihldmVudFR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3QoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBldmVudFR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZihwcm9wLCBldmVudFR5cGVbcHJvcF0sIGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXZlbnRMaXN0LFxuICAgICAgICAgICAgaW5kZXggPSAtMTtcblxuICAgICAgICAvLyBjb252ZXJ0IHRvIGJvb2xlYW5cbiAgICAgICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICd3aGVlbCcpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IHNjb3BlLndoZWVsRXZlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBpdCBpcyBhbiBhY3Rpb24gZXZlbnQgdHlwZVxuICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuZXZlbnRUeXBlcywgZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgZXZlbnRMaXN0ID0gdGhpcy5faUV2ZW50c1tldmVudFR5cGVdO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnRMaXN0ICYmIChpbmRleCA9IHNjb3BlLmluZGV4T2YoZXZlbnRMaXN0LCBsaXN0ZW5lcikpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lFdmVudHNbZXZlbnRUeXBlXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGRlbGVnYXRlZCBldmVudFxuICAgICAgICBlbHNlIGlmICh0aGlzLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICB2YXIgZGVsZWdhdGVkID0gc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0sXG4gICAgICAgICAgICAgICAgbWF0Y2hGb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoIWRlbGVnYXRlZCkgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgICAgICAvLyBjb3VudCBmcm9tIGxhc3QgaW5kZXggb2YgZGVsZWdhdGVkIHRvIDBcbiAgICAgICAgICAgIGZvciAoaW5kZXggPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCAtIDE7IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBtYXRjaGluZyBzZWxlY3RvciBhbmQgY29udGV4dCBOb2RlXG4gICAgICAgICAgICAgICAgaWYgKGRlbGVnYXRlZC5zZWxlY3RvcnNbaW5kZXhdID09PSB0aGlzLnNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgICYmIGRlbGVnYXRlZC5jb250ZXh0c1tpbmRleF0gPT09IHRoaXMuX2NvbnRleHQpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gZGVsZWdhdGVkLmxpc3RlbmVyc1tpbmRleF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZWFjaCBpdGVtIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkgaXMgYW4gYXJyYXk6IFtmdW5jdGlvbiwgdXNlQ2FwdHVyZUZsYWddXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gbGlzdGVuZXJzW2ldWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZUNhcCA9IGxpc3RlbmVyc1tpXVsxXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGxpc3RlbmVyIGZ1bmN0aW9ucyBhbmQgdXNlQ2FwdHVyZSBmbGFncyBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZuID09PSBsaXN0ZW5lciAmJiB1c2VDYXAgPT09IHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGFycmF5IG9mIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbGwgbGlzdGVuZXJzIGZvciB0aGlzIGludGVyYWN0YWJsZSBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgaW50ZXJhY3RhYmxlIGZyb20gdGhlIGRlbGVnYXRlZCBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMgLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgZGVsZWdhdGUgZnVuY3Rpb24gZnJvbSBjb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgZXZlbnRUeXBlLCBsaXN0ZW5lci5kZWxlZ2F0ZUxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCBldmVudFR5cGUsIGxpc3RlbmVyLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBhcnJheXMgaWYgdGhleSBhcmUgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSByZW1vdmUgb25lIGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hGb3VuZCkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgZnJvbSB0aGlzIEludGVyYXRhYmxlJ3MgZWxlbWVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fZWxlbWVudCwgZXZlbnRUeXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5zZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmVzZXQgdGhlIG9wdGlvbnMgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgLSBvcHRpb25zIChvYmplY3QpIFRoZSBuZXcgc2V0dGluZ3MgdG8gYXBwbHlcbiAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsd1xuICAgICBcXCovXG4gICAgc2V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoIXNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB1dGlscy5leHRlbmQoe30sIHNjb3BlLmRlZmF1bHRPcHRpb25zLmJhc2UpO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgYWN0aW9ucyA9IFsnZHJhZycsICdkcm9wJywgJ3Jlc2l6ZScsICdnZXN0dXJlJ10sXG4gICAgICAgICAgICBtZXRob2RzID0gWydkcmFnZ2FibGUnLCAnZHJvcHpvbmUnLCAncmVzaXphYmxlJywgJ2dlc3R1cmFibGUnXSxcbiAgICAgICAgICAgIHBlckFjdGlvbnMgPSB1dGlscy5leHRlbmQodXRpbHMuZXh0ZW5kKHt9LCBzY29wZS5kZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb24pLCBvcHRpb25zW2FjdGlvbl0gfHwge30pO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYWN0aW9uc1tpXTtcblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl0gPSB1dGlscy5leHRlbmQoe30sIHNjb3BlLmRlZmF1bHRPcHRpb25zW2FjdGlvbl0pO1xuXG4gICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbihhY3Rpb24sIHBlckFjdGlvbnMpO1xuXG4gICAgICAgICAgICB0aGlzW21ldGhvZHNbaV1dKG9wdGlvbnNbYWN0aW9uXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2V0dGluZ3MgPSBbXG4gICAgICAgICAgICAnYWNjZXB0JywgJ2FjdGlvbkNoZWNrZXInLCAnYWxsb3dGcm9tJywgJ2RlbHRhU291cmNlJyxcbiAgICAgICAgICAgICdkcm9wQ2hlY2tlcicsICdpZ25vcmVGcm9tJywgJ29yaWdpbicsICdwcmV2ZW50RGVmYXVsdCcsXG4gICAgICAgICAgICAncmVjdENoZWNrZXInXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gc2V0dGluZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0gc2V0dGluZ3NbaV07XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzZXR0aW5nXSA9IHNjb3BlLmRlZmF1bHRPcHRpb25zLmJhc2Vbc2V0dGluZ107XG5cbiAgICAgICAgICAgIGlmIChzZXR0aW5nIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRpbmddKG9wdGlvbnNbc2V0dGluZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUudW5zZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmVtb3ZlIHRoaXMgaW50ZXJhY3RhYmxlIGZyb20gdGhlIGxpc3Qgb2YgaW50ZXJhY3RhYmxlcyBhbmQgcmVtb3ZlXG4gICAgICogaXQncyBkcmFnLCBkcm9wLCByZXNpemUgYW5kIGdlc3R1cmUgY2FwYWJpbGl0aWVzXG4gICAgICpcbiAgICAgXFwqL1xuICAgIHVuc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fZWxlbWVudCwgJ2FsbCcpO1xuXG4gICAgICAgIGlmICghc2NvcGUuaXNTdHJpbmcodGhpcy5zZWxlY3RvcikpIHtcbiAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcywgJ2FsbCcpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgZGVsZWdhdGVkIGV2ZW50c1xuICAgICAgICAgICAgZm9yICh2YXIgdHlwZSBpbiBzY29wZS5kZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVsZWdhdGVkID0gc2NvcGUuZGVsZWdhdGVkRXZlbnRzW3R5cGVdO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzW2ldID09PSB0aGlzLnNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiBkZWxlZ2F0ZWQuY29udGV4dHNbaV0gPT09IHRoaXMuX2NvbnRleHQpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMgLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGFycmF5cyBpZiB0aGV5IGFyZSBlbXB0eVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmRlbGVnYXRlZEV2ZW50c1t0eXBlXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGxpc3RlbmVyLmRlbGVnYXRlTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGxpc3RlbmVyLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kcm9wem9uZShmYWxzZSk7XG5cbiAgICAgICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5zcGxpY2Uoc2NvcGUuaW5kZXhPZihzY29wZS5pbnRlcmFjdGFibGVzLCB0aGlzKSwgMSk7XG4gICAgfVxufTtcblxuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zbmFwID0gdXRpbHMud2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zbmFwLFxuICAgICdJbnRlcmFjdGFibGUjc25hcCBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBzbmFwcGluZyBhdCBodHRwOi8vaW50ZXJhY3Rqcy5pby9kb2NzL3NuYXBwaW5nJyk7XG5JbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc3RyaWN0ID0gdXRpbHMud2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5yZXN0cmljdCxcbiAgICAnSW50ZXJhY3RhYmxlI3Jlc3RyaWN0IGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIHJlc3RpY3RpbmcgYXQgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy9yZXN0cmljdGlvbicpO1xuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5pbmVydGlhID0gdXRpbHMud2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5pbmVydGlhLFxuICAgICdJbnRlcmFjdGFibGUjaW5lcnRpYSBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBpbmVydGlhIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvaW5lcnRpYScpO1xuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hdXRvU2Nyb2xsID0gdXRpbHMud2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hdXRvU2Nyb2xsLFxuICAgICdJbnRlcmFjdGFibGUjYXV0b1Njcm9sbCBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBhdXRvU2Nyb2xsIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvI2F1dG9zY3JvbGwnKTtcbkludGVyYWN0YWJsZS5wcm90b3R5cGUuc3F1YXJlUmVzaXplID0gdXRpbHMud2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zcXVhcmVSZXNpemUsXG4gICAgJ0ludGVyYWN0YWJsZSNzcXVhcmVSZXNpemUgaXMgZGVwcmVjYXRlZC4gU2VlIGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvI3Jlc2l6ZS1zcXVhcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmFjdGFibGU7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2NvcGUgPSByZXF1aXJlKCcuL3Njb3BlJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgYW5pbWF0aW9uRnJhbWUgPSB1dGlscy5yYWY7XG52YXIgSW50ZXJhY3RFdmVudCA9IHJlcXVpcmUoJy4vSW50ZXJhY3RFdmVudCcpO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvZXZlbnRzJyk7XG52YXIgYnJvd3NlciA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3NlcicpO1xuXG5mdW5jdGlvbiBJbnRlcmFjdGlvbiAoKSB7XG4gICAgdGhpcy50YXJnZXQgICAgICAgICAgPSBudWxsOyAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgICB0aGlzLmVsZW1lbnQgICAgICAgICA9IG51bGw7IC8vIHRoZSB0YXJnZXQgZWxlbWVudCBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gICAgdGhpcy5kcm9wVGFyZ2V0ICAgICAgPSBudWxsOyAvLyB0aGUgZHJvcHpvbmUgYSBkcmFnIHRhcmdldCBtaWdodCBiZSBkcm9wcGVkIGludG9cbiAgICB0aGlzLmRyb3BFbGVtZW50ICAgICA9IG51bGw7IC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG4gICAgdGhpcy5wcmV2RHJvcFRhcmdldCAgPSBudWxsOyAvLyB0aGUgZHJvcHpvbmUgdGhhdCB3YXMgcmVjZW50bHkgZHJhZ2dlZCBhd2F5IGZyb21cbiAgICB0aGlzLnByZXZEcm9wRWxlbWVudCA9IG51bGw7IC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG5cbiAgICB0aGlzLnByZXBhcmVkICAgICAgICA9IHsgICAgIC8vIGFjdGlvbiB0aGF0J3MgcmVhZHkgdG8gYmUgZmlyZWQgb24gbmV4dCBtb3ZlIGV2ZW50XG4gICAgICAgIG5hbWUgOiBudWxsLFxuICAgICAgICBheGlzIDogbnVsbCxcbiAgICAgICAgZWRnZXM6IG51bGxcbiAgICB9O1xuXG4gICAgdGhpcy5tYXRjaGVzICAgICAgICAgPSBbXTsgICAvLyBhbGwgc2VsZWN0b3JzIHRoYXQgYXJlIG1hdGNoZWQgYnkgdGFyZ2V0IGVsZW1lbnRcbiAgICB0aGlzLm1hdGNoRWxlbWVudHMgICA9IFtdOyAgIC8vIGNvcnJlc3BvbmRpbmcgZWxlbWVudHNcblxuICAgIHRoaXMuaW5lcnRpYVN0YXR1cyA9IHtcbiAgICAgICAgYWN0aXZlICAgICAgIDogZmFsc2UsXG4gICAgICAgIHNtb290aEVuZCAgICA6IGZhbHNlLFxuXG4gICAgICAgIHN0YXJ0RXZlbnQ6IG51bGwsXG4gICAgICAgIHVwQ29vcmRzOiB7fSxcblxuICAgICAgICB4ZTogMCwgeWU6IDAsXG4gICAgICAgIHN4OiAwLCBzeTogMCxcblxuICAgICAgICB0MDogMCxcbiAgICAgICAgdngwOiAwLCB2eXM6IDAsXG4gICAgICAgIGR1cmF0aW9uOiAwLFxuXG4gICAgICAgIHJlc3VtZUR4OiAwLFxuICAgICAgICByZXN1bWVEeTogMCxcblxuICAgICAgICBsYW1iZGFfdjA6IDAsXG4gICAgICAgIG9uZV92ZV92MDogMCxcbiAgICAgICAgaSAgOiBudWxsXG4gICAgfTtcblxuICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSkge1xuICAgICAgICB0aGlzLmJvdW5kSW5lcnRpYUZyYW1lID0gdGhpcy5pbmVydGlhRnJhbWUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5ib3VuZFNtb290aEVuZEZyYW1lID0gdGhpcy5zbW9vdGhFbmRGcmFtZS5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuYm91bmRJbmVydGlhRnJhbWUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGF0LmluZXJ0aWFGcmFtZSgpOyB9O1xuICAgICAgICB0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGF0LnNtb290aEVuZEZyYW1lKCk7IH07XG4gICAgfVxuXG4gICAgdGhpcy5hY3RpdmVEcm9wcyA9IHtcbiAgICAgICAgZHJvcHpvbmVzOiBbXSwgICAgICAvLyB0aGUgZHJvcHpvbmVzIHRoYXQgYXJlIG1lbnRpb25lZCBiZWxvd1xuICAgICAgICBlbGVtZW50cyA6IFtdLCAgICAgIC8vIGVsZW1lbnRzIG9mIGRyb3B6b25lcyB0aGF0IGFjY2VwdCB0aGUgdGFyZ2V0IGRyYWdnYWJsZVxuICAgICAgICByZWN0cyAgICA6IFtdICAgICAgIC8vIHRoZSByZWN0cyBvZiB0aGUgZWxlbWVudHMgbWVudGlvbmVkIGFib3ZlXG4gICAgfTtcblxuICAgIC8vIGtlZXAgdHJhY2sgb2YgYWRkZWQgcG9pbnRlcnNcbiAgICB0aGlzLnBvaW50ZXJzICAgID0gW107XG4gICAgdGhpcy5wb2ludGVySWRzICA9IFtdO1xuICAgIHRoaXMuZG93blRhcmdldHMgPSBbXTtcbiAgICB0aGlzLmRvd25UaW1lcyAgID0gW107XG4gICAgdGhpcy5ob2xkVGltZXJzICA9IFtdO1xuXG4gICAgLy8gUHJldmlvdXMgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHRoaXMucHJldkNvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcbiAgICAvLyBjdXJyZW50IG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICB0aGlzLmN1ckNvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcblxuICAgIC8vIFN0YXJ0aW5nIEludGVyYWN0RXZlbnQgcG9pbnRlciBjb29yZGluYXRlc1xuICAgIHRoaXMuc3RhcnRDb29yZHMgPSB7XG4gICAgICAgIHBhZ2UgICAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIGNsaWVudCAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIHRpbWVTdGFtcDogMFxuICAgIH07XG5cbiAgICAvLyBDaGFuZ2UgaW4gY29vcmRpbmF0ZXMgYW5kIHRpbWUgb2YgdGhlIHBvaW50ZXJcbiAgICB0aGlzLnBvaW50ZXJEZWx0YSA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAsIHZ4OiAwLCB2eTogMCwgc3BlZWQ6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAsIHZ4OiAwLCB2eTogMCwgc3BlZWQ6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcblxuICAgIHRoaXMuZG93bkV2ZW50ICAgPSBudWxsOyAgICAvLyBwb2ludGVyZG93bi9tb3VzZWRvd24vdG91Y2hzdGFydCBldmVudFxuICAgIHRoaXMuZG93blBvaW50ZXIgPSB7fTtcblxuICAgIHRoaXMuX2V2ZW50VGFyZ2V0ICAgID0gbnVsbDtcbiAgICB0aGlzLl9jdXJFdmVudFRhcmdldCA9IG51bGw7XG5cbiAgICB0aGlzLnByZXZFdmVudCA9IG51bGw7ICAgICAgLy8gcHJldmlvdXMgYWN0aW9uIGV2ZW50XG4gICAgdGhpcy50YXBUaW1lICAgPSAwOyAgICAgICAgIC8vIHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRhcCBldmVudFxuICAgIHRoaXMucHJldlRhcCAgID0gbnVsbDtcblxuICAgIHRoaXMuc3RhcnRPZmZzZXQgICAgPSB7IGxlZnQ6IDAsIHJpZ2h0OiAwLCB0b3A6IDAsIGJvdHRvbTogMCB9O1xuICAgIHRoaXMucmVzdHJpY3RPZmZzZXQgPSB7IGxlZnQ6IDAsIHJpZ2h0OiAwLCB0b3A6IDAsIGJvdHRvbTogMCB9O1xuICAgIHRoaXMuc25hcE9mZnNldHMgICAgPSBbXTtcblxuICAgIHRoaXMuZ2VzdHVyZSA9IHtcbiAgICAgICAgc3RhcnQ6IHsgeDogMCwgeTogMCB9LFxuXG4gICAgICAgIHN0YXJ0RGlzdGFuY2U6IDAsICAgLy8gZGlzdGFuY2UgYmV0d2VlbiB0d28gdG91Y2hlcyBvZiB0b3VjaFN0YXJ0XG4gICAgICAgIHByZXZEaXN0YW5jZSA6IDAsXG4gICAgICAgIGRpc3RhbmNlICAgICA6IDAsXG5cbiAgICAgICAgc2NhbGU6IDEsICAgICAgICAgICAvLyBnZXN0dXJlLmRpc3RhbmNlIC8gZ2VzdHVyZS5zdGFydERpc3RhbmNlXG5cbiAgICAgICAgc3RhcnRBbmdsZTogMCwgICAgICAvLyBhbmdsZSBvZiBsaW5lIGpvaW5pbmcgdHdvIHRvdWNoZXNcbiAgICAgICAgcHJldkFuZ2xlIDogMCAgICAgICAvLyBhbmdsZSBvZiB0aGUgcHJldmlvdXMgZ2VzdHVyZSBldmVudFxuICAgIH07XG5cbiAgICB0aGlzLnNuYXBTdGF0dXMgPSB7XG4gICAgICAgIHggICAgICAgOiAwLCB5ICAgICAgIDogMCxcbiAgICAgICAgZHggICAgICA6IDAsIGR5ICAgICAgOiAwLFxuICAgICAgICByZWFsWCAgIDogMCwgcmVhbFkgICA6IDAsXG4gICAgICAgIHNuYXBwZWRYOiAwLCBzbmFwcGVkWTogMCxcbiAgICAgICAgdGFyZ2V0cyA6IFtdLFxuICAgICAgICBsb2NrZWQgIDogZmFsc2UsXG4gICAgICAgIGNoYW5nZWQgOiBmYWxzZVxuICAgIH07XG5cbiAgICB0aGlzLnJlc3RyaWN0U3RhdHVzID0ge1xuICAgICAgICBkeCAgICAgICAgIDogMCwgZHkgICAgICAgICA6IDAsXG4gICAgICAgIHJlc3RyaWN0ZWRYOiAwLCByZXN0cmljdGVkWTogMCxcbiAgICAgICAgc25hcCAgICAgICA6IG51bGwsXG4gICAgICAgIHJlc3RyaWN0ZWQgOiBmYWxzZSxcbiAgICAgICAgY2hhbmdlZCAgICA6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMucmVzdHJpY3RTdGF0dXMuc25hcCA9IHRoaXMuc25hcFN0YXR1cztcblxuICAgIHRoaXMucG9pbnRlcklzRG93biAgID0gZmFsc2U7XG4gICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmdlc3R1cmluZyAgICAgICA9IGZhbHNlO1xuICAgIHRoaXMuZHJhZ2dpbmcgICAgICAgID0gZmFsc2U7XG4gICAgdGhpcy5yZXNpemluZyAgICAgICAgPSBmYWxzZTtcbiAgICB0aGlzLnJlc2l6ZUF4ZXMgICAgICA9ICd4eSc7XG5cbiAgICB0aGlzLm1vdXNlID0gZmFsc2U7XG5cbiAgICBzY29wZS5pbnRlcmFjdGlvbnMucHVzaCh0aGlzKTtcbn1cblxuLy8gQ2hlY2sgaWYgYWN0aW9uIGlzIGVuYWJsZWQgZ2xvYmFsbHkgYW5kIHRoZSBjdXJyZW50IHRhcmdldCBzdXBwb3J0cyBpdFxuLy8gSWYgc28sIHJldHVybiB0aGUgdmFsaWRhdGVkIGFjdGlvbi4gT3RoZXJ3aXNlLCByZXR1cm4gbnVsbFxuZnVuY3Rpb24gdmFsaWRhdGVBY3Rpb24gKGFjdGlvbiwgaW50ZXJhY3RhYmxlKSB7XG4gICAgaWYgKCFzY29wZS5pc09iamVjdChhY3Rpb24pKSB7IHJldHVybiBudWxsOyB9XG5cbiAgICB2YXIgYWN0aW9uTmFtZSA9IGFjdGlvbi5uYW1lLFxuICAgICAgICBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnM7XG5cbiAgICBpZiAoKCAgKGFjdGlvbk5hbWUgID09PSAncmVzaXplJyAgICYmIG9wdGlvbnMucmVzaXplLmVuYWJsZWQgKVxuICAgICAgICB8fCAoYWN0aW9uTmFtZSAgICAgID09PSAnZHJhZycgICAgICYmIG9wdGlvbnMuZHJhZy5lbmFibGVkICApXG4gICAgICAgIHx8IChhY3Rpb25OYW1lICAgICAgPT09ICdnZXN0dXJlJyAgJiYgb3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQpKVxuICAgICAgICAmJiBzY29wZS5hY3Rpb25Jc0VuYWJsZWRbYWN0aW9uTmFtZV0pIHtcblxuICAgICAgICBpZiAoYWN0aW9uTmFtZSA9PT0gJ3Jlc2l6ZScgfHwgYWN0aW9uTmFtZSA9PT0gJ3Jlc2l6ZXl4Jykge1xuICAgICAgICAgICAgYWN0aW9uTmFtZSA9ICdyZXNpemV4eSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0QWN0aW9uQ3Vyc29yIChhY3Rpb24pIHtcbiAgICB2YXIgY3Vyc29yID0gJyc7XG5cbiAgICBpZiAoYWN0aW9uLm5hbWUgPT09ICdkcmFnJykge1xuICAgICAgICBjdXJzb3IgPSAgc2NvcGUuYWN0aW9uQ3Vyc29ycy5kcmFnO1xuICAgIH1cbiAgICBpZiAoYWN0aW9uLm5hbWUgPT09ICdyZXNpemUnKSB7XG4gICAgICAgIGlmIChhY3Rpb24uYXhpcykge1xuICAgICAgICAgICAgY3Vyc29yID0gIHNjb3BlLmFjdGlvbkN1cnNvcnNbYWN0aW9uLm5hbWUgKyBhY3Rpb24uYXhpc107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYWN0aW9uLmVkZ2VzKSB7XG4gICAgICAgICAgICB2YXIgY3Vyc29yS2V5ID0gJ3Jlc2l6ZScsXG4gICAgICAgICAgICAgICAgZWRnZU5hbWVzID0gWyd0b3AnLCAnYm90dG9tJywgJ2xlZnQnLCAncmlnaHQnXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLmVkZ2VzW2VkZ2VOYW1lc1tpXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yS2V5ICs9IGVkZ2VOYW1lc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnNvciA9IHNjb3BlLmFjdGlvbkN1cnNvcnNbY3Vyc29yS2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjdXJzb3I7XG59XG5cbmZ1bmN0aW9uIHByZXZlbnRPcmlnaW5hbERlZmF1bHQgKCkge1xuICAgIHRoaXMub3JpZ2luYWxFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufVxuXG5JbnRlcmFjdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgZ2V0UGFnZVhZICA6IGZ1bmN0aW9uIChwb2ludGVyLCB4eSkgeyByZXR1cm4gICB1dGlscy5nZXRQYWdlWFkocG9pbnRlciwgeHksIHRoaXMpOyB9LFxuICAgIGdldENsaWVudFhZOiBmdW5jdGlvbiAocG9pbnRlciwgeHkpIHsgcmV0dXJuIHV0aWxzLmdldENsaWVudFhZKHBvaW50ZXIsIHh5LCB0aGlzKTsgfSxcbiAgICBzZXRFdmVudFhZIDogZnVuY3Rpb24gKHRhcmdldCwgcHRyKSB7IHJldHVybiAgdXRpbHMuc2V0RXZlbnRYWSh0YXJnZXQsIHB0ciwgdGhpcyk7IH0sXG5cbiAgICBwb2ludGVyT3ZlcjogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5uYW1lIHx8ICF0aGlzLm1vdXNlKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHZhciBjdXJNYXRjaGVzID0gW10sXG4gICAgICAgICAgICBjdXJNYXRjaEVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICBwcmV2VGFyZ2V0RWxlbWVudCA9IHRoaXMuZWxlbWVudDtcblxuICAgICAgICB0aGlzLmFkZFBvaW50ZXIocG9pbnRlcik7XG5cbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0XG4gICAgICAgICAgICAmJiAoc2NvcGUudGVzdElnbm9yZSh0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgIHx8ICFzY29wZS50ZXN0QWxsb3codGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCwgZXZlbnRUYXJnZXQpKSkge1xuICAgICAgICAgICAgLy8gaWYgdGhlIGV2ZW50VGFyZ2V0IHNob3VsZCBiZSBpZ25vcmVkIG9yIHNob3VsZG4ndCBiZSBhbGxvd2VkXG4gICAgICAgICAgICAvLyBjbGVhciB0aGUgcHJldmlvdXMgdGFyZ2V0XG4gICAgICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gW107XG4gICAgICAgICAgICB0aGlzLm1hdGNoRWxlbWVudHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbGVtZW50SW50ZXJhY3RhYmxlID0gc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZXZlbnRUYXJnZXQpLFxuICAgICAgICAgICAgZWxlbWVudEFjdGlvbiA9IChlbGVtZW50SW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShlbGVtZW50SW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coZWxlbWVudEludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgJiYgdmFsaWRhdGVBY3Rpb24oXG4gICAgICAgICAgICAgICAgZWxlbWVudEludGVyYWN0YWJsZS5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIGV2ZW50VGFyZ2V0KSxcbiAgICAgICAgICAgICAgICBlbGVtZW50SW50ZXJhY3RhYmxlKSk7XG5cbiAgICAgICAgaWYgKGVsZW1lbnRBY3Rpb24gJiYgIXNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQoZWxlbWVudEludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQsIGVsZW1lbnRBY3Rpb24pKSB7XG4gICAgICAgICAgICBlbGVtZW50QWN0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hDdXJNYXRjaGVzIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yKSB7XG4gICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUuaW5Db250ZXh0KGludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgIXNjb3BlLnRlc3RJZ25vcmUoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUudGVzdEFsbG93KGludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm1hdGNoZXNTZWxlY3RvcihldmVudFRhcmdldCwgc2VsZWN0b3IpKSB7XG5cbiAgICAgICAgICAgICAgICBjdXJNYXRjaGVzLnB1c2goaW50ZXJhY3RhYmxlKTtcbiAgICAgICAgICAgICAgICBjdXJNYXRjaEVsZW1lbnRzLnB1c2goZXZlbnRUYXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnRBY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gZWxlbWVudEludGVyYWN0YWJsZTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gW107XG4gICAgICAgICAgICB0aGlzLm1hdGNoRWxlbWVudHMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKHB1c2hDdXJNYXRjaGVzKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudmFsaWRhdGVTZWxlY3Rvcihwb2ludGVyLCBldmVudCwgY3VyTWF0Y2hlcywgY3VyTWF0Y2hFbGVtZW50cykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBjdXJNYXRjaGVzO1xuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IGN1ck1hdGNoRWxlbWVudHM7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJIb3Zlcihwb2ludGVyLCBldmVudCwgdGhpcy5tYXRjaGVzLCB0aGlzLm1hdGNoRWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQoZXZlbnRUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLlBvaW50ZXJFdmVudD8gc2NvcGUucEV2ZW50VHlwZXMubW92ZSA6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgICAgICAgICBzY29wZS5saXN0ZW5lcnMucG9pbnRlckhvdmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLm5vZGVDb250YWlucyhwcmV2VGFyZ2V0RWxlbWVudCwgZXZlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlckhvdmVyKHBvaW50ZXIsIGV2ZW50LCB0aGlzLm1hdGNoZXMsIHRoaXMubWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuUG9pbnRlckV2ZW50PyBzY29wZS5wRXZlbnRUeXBlcy5tb3ZlIDogJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5saXN0ZW5lcnMucG9pbnRlckhvdmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBDaGVjayB3aGF0IGFjdGlvbiB3b3VsZCBiZSBwZXJmb3JtZWQgb24gcG9pbnRlck1vdmUgdGFyZ2V0IGlmIGEgbW91c2VcbiAgICAvLyBidXR0b24gd2VyZSBwcmVzc2VkIGFuZCBjaGFuZ2UgdGhlIGN1cnNvciBhY2NvcmRpbmdseVxuICAgIHBvaW50ZXJIb3ZlcjogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIG1hdGNoZXMsIG1hdGNoRWxlbWVudHMpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgICAgIGlmICghdGhpcy5wcmVwYXJlZC5uYW1lICYmIHRoaXMubW91c2UpIHtcblxuICAgICAgICAgICAgdmFyIGFjdGlvbjtcblxuICAgICAgICAgICAgLy8gdXBkYXRlIHBvaW50ZXIgY29vcmRzIGZvciBkZWZhdWx0QWN0aW9uQ2hlY2tlciB0byB1c2VcbiAgICAgICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLmN1ckNvb3JkcywgcG9pbnRlcik7XG5cbiAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gdGhpcy52YWxpZGF0ZVNlbGVjdG9yKHBvaW50ZXIsIGV2ZW50LCBtYXRjaGVzLCBtYXRjaEVsZW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgIGFjdGlvbiA9IHZhbGlkYXRlQWN0aW9uKHRhcmdldC5nZXRBY3Rpb24odGhpcy5wb2ludGVyc1swXSwgZXZlbnQsIHRoaXMsIHRoaXMuZWxlbWVudCksIHRoaXMudGFyZ2V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRhcmdldCAmJiB0YXJnZXQub3B0aW9ucy5zdHlsZUN1cnNvcikge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9IGdldEFjdGlvbkN1cnNvcihhY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnByZXBhcmVkLm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHBvaW50ZXJPdXQ6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICAgICAgaWYgKHRoaXMucHJlcGFyZWQubmFtZSkgeyByZXR1cm47IH1cblxuICAgICAgICAvLyBSZW1vdmUgdGVtcG9yYXJ5IGV2ZW50IGxpc3RlbmVycyBmb3Igc2VsZWN0b3IgSW50ZXJhY3RhYmxlc1xuICAgICAgICBpZiAoIXNjb3BlLmludGVyYWN0YWJsZXMuZ2V0KGV2ZW50VGFyZ2V0KSkge1xuICAgICAgICAgICAgZXZlbnRzLnJlbW92ZShldmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICBzY29wZS5Qb2ludGVyRXZlbnQ/IHNjb3BlLnBFdmVudFR5cGVzLm1vdmUgOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICAgICBzY29wZS5saXN0ZW5lcnMucG9pbnRlckhvdmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnRhcmdldCAmJiB0aGlzLnRhcmdldC5vcHRpb25zLnN0eWxlQ3Vyc29yICYmICF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9ICcnO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNlbGVjdG9yRG93bjogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxuICAgICAgICAvLyBjb3B5IGV2ZW50IHRvIGJlIHVzZWQgaW4gdGltZW91dCBmb3IgSUU4XG4gICAgICAgICAgICBldmVudENvcHkgPSBldmVudHMudXNlQXR0YWNoRXZlbnQ/IHV0aWxzLmV4dGVuZCh7fSwgZXZlbnQpIDogZXZlbnQsXG4gICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQsXG4gICAgICAgICAgICBwb2ludGVySW5kZXggPSB0aGlzLmFkZFBvaW50ZXIocG9pbnRlciksXG4gICAgICAgICAgICBhY3Rpb247XG5cbiAgICAgICAgdGhpcy5ob2xkVGltZXJzW3BvaW50ZXJJbmRleF0gPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQucG9pbnRlckhvbGQoZXZlbnRzLnVzZUF0dGFjaEV2ZW50PyBldmVudENvcHkgOiBwb2ludGVyLCBldmVudENvcHksIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG4gICAgICAgIH0sIHNjb3BlLmRlZmF1bHRPcHRpb25zLl9ob2xkRHVyYXRpb24pO1xuXG4gICAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWU7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGRvd24gZXZlbnQgaGl0cyB0aGUgY3VycmVudCBpbmVydGlhIHRhcmdldFxuICAgICAgICBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSAmJiB0aGlzLnRhcmdldC5zZWxlY3Rvcikge1xuICAgICAgICAgICAgLy8gY2xpbWIgdXAgdGhlIERPTSB0cmVlIGZyb20gdGhlIGV2ZW50IHRhcmdldFxuICAgICAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBlbGVtZW50IGlzIHRoZSBjdXJyZW50IGluZXJ0aWEgdGFyZ2V0IGVsZW1lbnRcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gdGhpcy5lbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhbmQgdGhlIHByb3NwZWN0aXZlIGFjdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgb25nb2luZyBvbmVcbiAgICAgICAgICAgICAgICAgICAgJiYgdmFsaWRhdGVBY3Rpb24odGhpcy50YXJnZXQuZ2V0QWN0aW9uKHBvaW50ZXIsIGV2ZW50LCB0aGlzLCB0aGlzLmVsZW1lbnQpLCB0aGlzLnRhcmdldCkubmFtZSA9PT0gdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcCBpbmVydGlhIHNvIHRoYXQgdGhlIG5leHQgbW92ZSB3aWxsIGJlIGEgbm9ybWFsIG9uZVxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25GcmFtZS5jYW5jZWwodGhpcy5pbmVydGlhU3RhdHVzLmkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2Rvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRvIG5vdGhpbmcgaWYgaW50ZXJhY3RpbmdcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2Rvd24nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hNYXRjaGVzIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSBzY29wZS5pZThNYXRjaGVzU2VsZWN0b3JcbiAgICAgICAgICAgICAgICA/IGNvbnRleHQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgaWYgKHNjb3BlLmluQ29udGV4dChpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgJiYgIXNjb3BlLnRlc3RJZ25vcmUoaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIGVsZW1lbnRzKSkge1xuXG4gICAgICAgICAgICAgICAgdGhhdC5tYXRjaGVzLnB1c2goaW50ZXJhY3RhYmxlKTtcbiAgICAgICAgICAgICAgICB0aGF0Lm1hdGNoRWxlbWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSBwb2ludGVyIGNvb3JkcyBmb3IgZGVmYXVsdEFjdGlvbkNoZWNrZXIgdG8gdXNlXG4gICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLmN1ckNvb3JkcywgcG9pbnRlcik7XG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnQ7XG5cbiAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSAmJiAhYWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuXG4gICAgICAgICAgICBzY29wZS5pbnRlcmFjdGFibGVzLmZvckVhY2hTZWxlY3RvcihwdXNoTWF0Y2hlcyk7XG5cbiAgICAgICAgICAgIGFjdGlvbiA9IHRoaXMudmFsaWRhdGVTZWxlY3Rvcihwb2ludGVyLCBldmVudCwgdGhpcy5tYXRjaGVzLCB0aGlzLm1hdGNoRWxlbWVudHMpO1xuICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgID0gYWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLnByZXBhcmVkLmF4aXMgID0gYWN0aW9uLmF4aXM7XG4gICAgICAgICAgICB0aGlzLnByZXBhcmVkLmVkZ2VzID0gYWN0aW9uLmVkZ2VzO1xuXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wb2ludGVyRG93bihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZG8gdGhlc2Ugbm93IHNpbmNlIHBvaW50ZXJEb3duIGlzbid0IGJlaW5nIGNhbGxlZCBmcm9tIGhlcmVcbiAgICAgICAgICAgIHRoaXMuZG93blRpbWVzW3BvaW50ZXJJbmRleF0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSA9IGV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHRoaXMuZG93blBvaW50ZXIsIHBvaW50ZXIpO1xuXG4gICAgICAgICAgICB1dGlscy5jb3B5Q29vcmRzKHRoaXMucHJldkNvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdkb3duJyk7XG4gICAgfSxcblxuICAgIC8vIERldGVybWluZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIG5leHQgcG9pbnRlck1vdmUgYW5kIGFkZCBhcHByb3ByaWF0ZVxuICAgIC8vIHN0eWxlIGFuZCBldmVudCBMaXN0ZW5lcnNcbiAgICBwb2ludGVyRG93bjogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGZvcmNlQWN0aW9uKSB7XG4gICAgICAgIGlmICghZm9yY2VBY3Rpb24gJiYgIXRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgJiYgdGhpcy5wb2ludGVyV2FzTW92ZWQgJiYgdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrQW5kUHJldmVudERlZmF1bHQoZXZlbnQsIHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0cnVlO1xuICAgICAgICB0aGlzLmRvd25FdmVudCA9IGV2ZW50O1xuXG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLmFkZFBvaW50ZXIocG9pbnRlciksXG4gICAgICAgICAgICBhY3Rpb247XG5cbiAgICAgICAgLy8gSWYgaXQgaXMgdGhlIHNlY29uZCB0b3VjaCBvZiBhIG11bHRpLXRvdWNoIGdlc3R1cmUsIGtlZXAgdGhlIHRhcmdldFxuICAgICAgICAvLyB0aGUgc2FtZSBpZiBhIHRhcmdldCB3YXMgc2V0IGJ5IHRoZSBmaXJzdCB0b3VjaFxuICAgICAgICAvLyBPdGhlcndpc2UsIHNldCB0aGUgdGFyZ2V0IGlmIHRoZXJlIGlzIG5vIGFjdGlvbiBwcmVwYXJlZFxuICAgICAgICBpZiAoKHRoaXMucG9pbnRlcklkcy5sZW5ndGggPCAyICYmICF0aGlzLnRhcmdldCkgfHwgIXRoaXMucHJlcGFyZWQubmFtZSkge1xuXG4gICAgICAgICAgICB2YXIgaW50ZXJhY3RhYmxlID0gc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgJiYgIXNjb3BlLnRlc3RJZ25vcmUoaW50ZXJhY3RhYmxlLCBjdXJFdmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUudGVzdEFsbG93KGludGVyYWN0YWJsZSwgY3VyRXZlbnRUYXJnZXQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIChhY3Rpb24gPSB2YWxpZGF0ZUFjdGlvbihmb3JjZUFjdGlvbiB8fCBpbnRlcmFjdGFibGUuZ2V0QWN0aW9uKHBvaW50ZXIsIGV2ZW50LCB0aGlzLCBjdXJFdmVudFRhcmdldCksIGludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQpKVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQoaW50ZXJhY3RhYmxlLCBjdXJFdmVudFRhcmdldCwgYWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gaW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGN1ckV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRhcmdldCAmJiB0YXJnZXQub3B0aW9ucztcblxuICAgICAgICBpZiAodGFyZ2V0ICYmIChmb3JjZUFjdGlvbiB8fCAhdGhpcy5wcmVwYXJlZC5uYW1lKSkge1xuICAgICAgICAgICAgYWN0aW9uID0gYWN0aW9uIHx8IHZhbGlkYXRlQWN0aW9uKGZvcmNlQWN0aW9uIHx8IHRhcmdldC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIGN1ckV2ZW50VGFyZ2V0KSwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzLnNldEV2ZW50WFkodGhpcy5zdGFydENvb3Jkcyk7XG5cbiAgICAgICAgICAgIGlmICghYWN0aW9uKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdHlsZUN1cnNvcikge1xuICAgICAgICAgICAgICAgIHRhcmdldC5fZG9jLmRvY3VtZW50RWxlbWVudC5zdHlsZS5jdXJzb3IgPSBnZXRBY3Rpb25DdXJzb3IoYWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXNpemVBeGVzID0gYWN0aW9uLm5hbWUgPT09ICdyZXNpemUnPyBhY3Rpb24uYXhpcyA6IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb24gPT09ICdnZXN0dXJlJyAmJiB0aGlzLnBvaW50ZXJJZHMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICAgIGFjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSAgPSBhY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuZWRnZXMgPSBhY3Rpb24uZWRnZXM7XG5cbiAgICAgICAgICAgIHRoaXMuc25hcFN0YXR1cy5zbmFwcGVkWCA9IHRoaXMuc25hcFN0YXR1cy5zbmFwcGVkWSA9XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkWCA9IHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZFkgPSBOYU47XG5cbiAgICAgICAgICAgIHRoaXMuZG93blRpbWVzW3BvaW50ZXJJbmRleF0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSA9IGV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHRoaXMuZG93blBvaW50ZXIsIHBvaW50ZXIpO1xuXG4gICAgICAgICAgICB0aGlzLnNldEV2ZW50WFkodGhpcy5wcmV2Q29vcmRzKTtcbiAgICAgICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIGluZXJ0aWEgaXMgYWN0aXZlIHRyeSB0byByZXN1bWUgYWN0aW9uXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmVcbiAgICAgICAgICAgICYmIGN1ckV2ZW50VGFyZ2V0ID09PSB0aGlzLmVsZW1lbnRcbiAgICAgICAgICAgICYmIHZhbGlkYXRlQWN0aW9uKHRhcmdldC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIHRoaXMuZWxlbWVudCksIHRhcmdldCkubmFtZSA9PT0gdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG5cbiAgICAgICAgICAgIGFuaW1hdGlvbkZyYW1lLmNhbmNlbCh0aGlzLmluZXJ0aWFTdGF0dXMuaSk7XG4gICAgICAgICAgICB0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldE1vZGlmaWNhdGlvbnM6IGZ1bmN0aW9uIChjb29yZHMsIHByZUVuZCkge1xuICAgICAgICB2YXIgdGFyZ2V0ICAgICAgICAgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIHNob3VsZE1vdmUgICAgID0gdHJ1ZSxcbiAgICAgICAgICAgIHNob3VsZFNuYXAgICAgID0gc2NvcGUuY2hlY2tTbmFwKHRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSAgICAgJiYgKCF0YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnNuYXAuZW5kT25seSAgICAgfHwgcHJlRW5kKSxcbiAgICAgICAgICAgIHNob3VsZFJlc3RyaWN0ID0gc2NvcGUuY2hlY2tSZXN0cmljdCh0YXJnZXQsIHRoaXMucHJlcGFyZWQubmFtZSkgJiYgKCF0YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LmVuZE9ubHkgfHwgcHJlRW5kKTtcblxuICAgICAgICBpZiAoc2hvdWxkU25hcCAgICApIHsgdGhpcy5zZXRTbmFwcGluZyAgIChjb29yZHMpOyB9IGVsc2UgeyB0aGlzLnNuYXBTdGF0dXMgICAgLmxvY2tlZCAgICAgPSBmYWxzZTsgfVxuICAgICAgICBpZiAoc2hvdWxkUmVzdHJpY3QpIHsgdGhpcy5zZXRSZXN0cmljdGlvbihjb29yZHMpOyB9IGVsc2UgeyB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWQgPSBmYWxzZTsgfVxuXG4gICAgICAgIGlmIChzaG91bGRTbmFwICYmIHRoaXMuc25hcFN0YXR1cy5sb2NrZWQgJiYgIXRoaXMuc25hcFN0YXR1cy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICBzaG91bGRNb3ZlID0gc2hvdWxkUmVzdHJpY3QgJiYgdGhpcy5yZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkICYmIHRoaXMucmVzdHJpY3RTdGF0dXMuY2hhbmdlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzaG91bGRSZXN0cmljdCAmJiB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWQgJiYgIXRoaXMucmVzdHJpY3RTdGF0dXMuY2hhbmdlZCkge1xuICAgICAgICAgICAgc2hvdWxkTW92ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNob3VsZE1vdmU7XG4gICAgfSxcblxuICAgIHNldFN0YXJ0T2Zmc2V0czogZnVuY3Rpb24gKGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciByZWN0ID0gaW50ZXJhY3RhYmxlLmdldFJlY3QoZWxlbWVudCksXG4gICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5nZXRPcmlnaW5YWShpbnRlcmFjdGFibGUsIGVsZW1lbnQpLFxuICAgICAgICAgICAgc25hcCA9IGludGVyYWN0YWJsZS5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcCxcbiAgICAgICAgICAgIHJlc3RyaWN0ID0gaW50ZXJhY3RhYmxlLm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5yZXN0cmljdCxcbiAgICAgICAgICAgIHdpZHRoLCBoZWlnaHQ7XG5cbiAgICAgICAgaWYgKHJlY3QpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRPZmZzZXQubGVmdCA9IHRoaXMuc3RhcnRDb29yZHMucGFnZS54IC0gcmVjdC5sZWZ0O1xuICAgICAgICAgICAgdGhpcy5zdGFydE9mZnNldC50b3AgID0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnkgLSByZWN0LnRvcDtcblxuICAgICAgICAgICAgdGhpcy5zdGFydE9mZnNldC5yaWdodCAgPSByZWN0LnJpZ2h0ICAtIHRoaXMuc3RhcnRDb29yZHMucGFnZS54O1xuICAgICAgICAgICAgdGhpcy5zdGFydE9mZnNldC5ib3R0b20gPSByZWN0LmJvdHRvbSAtIHRoaXMuc3RhcnRDb29yZHMucGFnZS55O1xuXG4gICAgICAgICAgICBpZiAoJ3dpZHRoJyBpbiByZWN0KSB7IHdpZHRoID0gcmVjdC53aWR0aDsgfVxuICAgICAgICAgICAgZWxzZSB7IHdpZHRoID0gcmVjdC5yaWdodCAtIHJlY3QubGVmdDsgfVxuICAgICAgICAgICAgaWYgKCdoZWlnaHQnIGluIHJlY3QpIHsgaGVpZ2h0ID0gcmVjdC5oZWlnaHQ7IH1cbiAgICAgICAgICAgIGVsc2UgeyBoZWlnaHQgPSByZWN0LmJvdHRvbSAtIHJlY3QudG9wOyB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgPSB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCA9IHRoaXMuc3RhcnRPZmZzZXQucmlnaHQgPSB0aGlzLnN0YXJ0T2Zmc2V0LmJvdHRvbSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNuYXBPZmZzZXRzLnNwbGljZSgwKTtcblxuICAgICAgICB2YXIgc25hcE9mZnNldCA9IHNuYXAgJiYgc25hcC5vZmZzZXQgPT09ICdzdGFydENvb3JkcydcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgeDogdGhpcy5zdGFydENvb3Jkcy5wYWdlLnggLSBvcmlnaW4ueCxcbiAgICAgICAgICAgIHk6IHRoaXMuc3RhcnRDb29yZHMucGFnZS55IC0gb3JpZ2luLnlcbiAgICAgICAgfVxuICAgICAgICAgICAgOiBzbmFwICYmIHNuYXAub2Zmc2V0IHx8IHsgeDogMCwgeTogMCB9O1xuXG4gICAgICAgIGlmIChyZWN0ICYmIHNuYXAgJiYgc25hcC5yZWxhdGl2ZVBvaW50cyAmJiBzbmFwLnJlbGF0aXZlUG9pbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbmFwLnJlbGF0aXZlUG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zbmFwT2Zmc2V0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5zdGFydE9mZnNldC5sZWZ0IC0gKHdpZHRoICAqIHNuYXAucmVsYXRpdmVQb2ludHNbaV0ueCkgKyBzbmFwT2Zmc2V0LngsXG4gICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuc3RhcnRPZmZzZXQudG9wICAtIChoZWlnaHQgKiBzbmFwLnJlbGF0aXZlUG9pbnRzW2ldLnkpICsgc25hcE9mZnNldC55XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNuYXBPZmZzZXRzLnB1c2goc25hcE9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVjdCAmJiByZXN0cmljdC5lbGVtZW50UmVjdCkge1xuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC5sZWZ0ID0gdGhpcy5zdGFydE9mZnNldC5sZWZ0IC0gKHdpZHRoICAqIHJlc3RyaWN0LmVsZW1lbnRSZWN0LmxlZnQpO1xuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC50b3AgID0gdGhpcy5zdGFydE9mZnNldC50b3AgIC0gKGhlaWdodCAqIHJlc3RyaWN0LmVsZW1lbnRSZWN0LnRvcCk7XG5cbiAgICAgICAgICAgIHRoaXMucmVzdHJpY3RPZmZzZXQucmlnaHQgID0gdGhpcy5zdGFydE9mZnNldC5yaWdodCAgLSAod2lkdGggICogKDEgLSByZXN0cmljdC5lbGVtZW50UmVjdC5yaWdodCkpO1xuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC5ib3R0b20gPSB0aGlzLnN0YXJ0T2Zmc2V0LmJvdHRvbSAtIChoZWlnaHQgKiAoMSAtIHJlc3RyaWN0LmVsZW1lbnRSZWN0LmJvdHRvbSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC5sZWZ0ID0gdGhpcy5yZXN0cmljdE9mZnNldC50b3AgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnJpZ2h0ID0gdGhpcy5yZXN0cmljdE9mZnNldC5ib3R0b20gPSAwO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGlvbi5zdGFydFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBTdGFydCBhbiBhY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gSW50ZXJhY3RhYmxlIGFuZCBFbGVtZW50IGFzIHRhcnRnZXRzLiBUaGVcbiAgICAgKiBhY3Rpb24gbXVzdCBiZSBlbmFibGVkIGZvciB0aGUgdGFyZ2V0IEludGVyYWN0YWJsZSBhbmQgYW4gYXBwcm9wcmlhdGUgbnVtYmVyXG4gICAgICogb2YgcG9pbnRlcnMgbXVzdCBiZSBoZWxkIGRvd24g4oCTIDEgZm9yIGRyYWcvcmVzaXplLCAyIGZvciBnZXN0dXJlLlxuICAgICAqXG4gICAgICogVXNlIGl0IHdpdGggYGludGVyYWN0YWJsZS48YWN0aW9uPmFibGUoeyBtYW51YWxTdGFydDogZmFsc2UgfSlgIHRvIGFsd2F5c1xuICAgICAqIFtzdGFydCBhY3Rpb25zIG1hbnVhbGx5XShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9pc3N1ZXMvMTE0KVxuICAgICAqXG4gICAgIC0gYWN0aW9uICAgICAgIChvYmplY3QpICBUaGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAtIGRyYWcsIHJlc2l6ZSwgZXRjLlxuICAgICAtIGludGVyYWN0YWJsZSAoSW50ZXJhY3RhYmxlKSBUaGUgSW50ZXJhY3RhYmxlIHRvIHRhcmdldFxuICAgICAtIGVsZW1lbnQgICAgICAoRWxlbWVudCkgVGhlIERPTSBFbGVtZW50IHRvIHRhcmdldFxuICAgICA9IChvYmplY3QpIGludGVyYWN0XG4gICAgICoqXG4gICAgIHwgaW50ZXJhY3QodGFyZ2V0KVxuICAgICB8ICAgLmRyYWdnYWJsZSh7XG4gICAgIHwgICAgIC8vIGRpc2FibGUgdGhlIGRlZmF1bHQgZHJhZyBzdGFydCBieSBkb3duLT5tb3ZlXG4gICAgIHwgICAgIG1hbnVhbFN0YXJ0OiB0cnVlXG4gICAgIHwgICB9KVxuICAgICB8ICAgLy8gc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaG9sZHMgdGhlIHBvaW50ZXIgZG93blxuICAgICB8ICAgLm9uKCdob2xkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgIHwgICAgIHZhciBpbnRlcmFjdGlvbiA9IGV2ZW50LmludGVyYWN0aW9uO1xuICAgICB8XG4gICAgIHwgICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgICB8ICAgICAgIGludGVyYWN0aW9uLnN0YXJ0KHsgbmFtZTogJ2RyYWcnIH0sXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICB8ICAgICB9XG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICBzdGFydDogZnVuY3Rpb24gKGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKClcbiAgICAgICAgICAgIHx8ICF0aGlzLnBvaW50ZXJJc0Rvd25cbiAgICAgICAgICAgIHx8IHRoaXMucG9pbnRlcklkcy5sZW5ndGggPCAoYWN0aW9uLm5hbWUgPT09ICdnZXN0dXJlJz8gMiA6IDEpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGlzIGludGVyYWN0aW9uIGhhZCBiZWVuIHJlbW92ZWQgYWZ0ZXIgc3RvcHBpbmdcbiAgICAgICAgLy8gYWRkIGl0IGJhY2tcbiAgICAgICAgaWYgKHNjb3BlLmluZGV4T2Yoc2NvcGUuaW50ZXJhY3Rpb25zLCB0aGlzKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5wdXNoKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wcmVwYXJlZC5uYW1lICA9IGFjdGlvbi5uYW1lO1xuICAgICAgICB0aGlzLnByZXBhcmVkLmF4aXMgID0gYWN0aW9uLmF4aXM7XG4gICAgICAgIHRoaXMucHJlcGFyZWQuZWRnZXMgPSBhY3Rpb24uZWRnZXM7XG4gICAgICAgIHRoaXMudGFyZ2V0ICAgICAgICAgPSBpbnRlcmFjdGFibGU7XG4gICAgICAgIHRoaXMuZWxlbWVudCAgICAgICAgPSBlbGVtZW50O1xuXG4gICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLnN0YXJ0Q29vcmRzKTtcbiAgICAgICAgdGhpcy5zZXRTdGFydE9mZnNldHMoYWN0aW9uLm5hbWUsIGludGVyYWN0YWJsZSwgZWxlbWVudCk7XG4gICAgICAgIHRoaXMuc2V0TW9kaWZpY2F0aW9ucyh0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UpO1xuXG4gICAgICAgIHRoaXMucHJldkV2ZW50ID0gdGhpc1t0aGlzLnByZXBhcmVkLm5hbWUgKyAnU3RhcnQnXSh0aGlzLmRvd25FdmVudCk7XG4gICAgfSxcblxuICAgIHBvaW50ZXJNb3ZlOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgcHJlRW5kKSB7XG4gICAgICAgIHRoaXMucmVjb3JkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICB0aGlzLnNldEV2ZW50WFkodGhpcy5jdXJDb29yZHMsIChwb2ludGVyIGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudClcbiAgICAgICAgICAgID8gdGhpcy5pbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnRcbiAgICAgICAgICAgIDogdW5kZWZpbmVkKTtcblxuICAgICAgICB2YXIgZHVwbGljYXRlTW92ZSA9ICh0aGlzLmN1ckNvb3Jkcy5wYWdlLnggPT09IHRoaXMucHJldkNvb3Jkcy5wYWdlLnhcbiAgICAgICAgJiYgdGhpcy5jdXJDb29yZHMucGFnZS55ID09PSB0aGlzLnByZXZDb29yZHMucGFnZS55XG4gICAgICAgICYmIHRoaXMuY3VyQ29vcmRzLmNsaWVudC54ID09PSB0aGlzLnByZXZDb29yZHMuY2xpZW50LnhcbiAgICAgICAgJiYgdGhpcy5jdXJDb29yZHMuY2xpZW50LnkgPT09IHRoaXMucHJldkNvb3Jkcy5jbGllbnQueSk7XG5cbiAgICAgICAgdmFyIGR4LCBkeSxcbiAgICAgICAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMubW91c2U/IDAgOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpKTtcblxuICAgICAgICAvLyByZWdpc3RlciBtb3ZlbWVudCBncmVhdGVyIHRoYW4gcG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICAgICAgaWYgKHRoaXMucG9pbnRlcklzRG93biAmJiAhdGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgICAgICAgIGR4ID0gdGhpcy5jdXJDb29yZHMuY2xpZW50LnggLSB0aGlzLnN0YXJ0Q29vcmRzLmNsaWVudC54O1xuICAgICAgICAgICAgZHkgPSB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueSAtIHRoaXMuc3RhcnRDb29yZHMuY2xpZW50Lnk7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gdXRpbHMuaHlwb3QoZHgsIGR5KSA+IHNjb3BlLnBvaW50ZXJNb3ZlVG9sZXJhbmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFkdXBsaWNhdGVNb3ZlICYmICghdGhpcy5wb2ludGVySXNEb3duIHx8IHRoaXMucG9pbnRlcldhc01vdmVkKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlcklzRG93bikge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhvbGRUaW1lcnNbcG9pbnRlckluZGV4XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdtb3ZlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMucG9pbnRlcklzRG93bikgeyByZXR1cm47IH1cblxuICAgICAgICBpZiAoZHVwbGljYXRlTW92ZSAmJiB0aGlzLnBvaW50ZXJXYXNNb3ZlZCAmJiAhcHJlRW5kKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrQW5kUHJldmVudERlZmF1bHQoZXZlbnQsIHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2V0IHBvaW50ZXIgY29vcmRpbmF0ZSwgdGltZSBjaGFuZ2VzIGFuZCBzcGVlZHNcbiAgICAgICAgdXRpbHMuc2V0RXZlbnREZWx0YXModGhpcy5wb2ludGVyRGVsdGEsIHRoaXMucHJldkNvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuXG4gICAgICAgIGlmICghdGhpcy5wcmVwYXJlZC5uYW1lKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmICh0aGlzLnBvaW50ZXJXYXNNb3ZlZFxuICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBtb3ZlbWVudCB3aGlsZSBpbmVydGlhIGlzIGFjdGl2ZVxuICAgICAgICAgICAgJiYgKCF0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlIHx8IChwb2ludGVyIGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCAmJiAvaW5lcnRpYXN0YXJ0Ly50ZXN0KHBvaW50ZXIudHlwZSkpKSkge1xuXG4gICAgICAgICAgICAvLyBpZiBqdXN0IHN0YXJ0aW5nIGFuIGFjdGlvbiwgY2FsY3VsYXRlIHRoZSBwb2ludGVyIHNwZWVkIG5vd1xuICAgICAgICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5zZXRFdmVudERlbHRhcyh0aGlzLnBvaW50ZXJEZWx0YSwgdGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhIGRyYWcgaXMgaW4gdGhlIGNvcnJlY3QgYXhpc1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByZXBhcmVkLm5hbWUgPT09ICdkcmFnJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWJzWCA9IE1hdGguYWJzKGR4KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFic1kgPSBNYXRoLmFicyhkeSksXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRBeGlzID0gdGhpcy50YXJnZXQub3B0aW9ucy5kcmFnLmF4aXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBheGlzID0gKGFic1ggPiBhYnNZID8gJ3gnIDogYWJzWCA8IGFic1kgPyAneScgOiAneHknKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgbW92ZW1lbnQgaXNuJ3QgaW4gdGhlIGF4aXMgb2YgdGhlIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgICAgICBpZiAoYXhpcyAhPT0gJ3h5JyAmJiB0YXJnZXRBeGlzICE9PSAneHknICYmIHRhcmdldEF4aXMgIT09IGF4aXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbmNlbCB0aGUgcHJlcGFyZWQgYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVuIHRyeSB0byBnZXQgYSBkcmFnIGZyb20gYW5vdGhlciBpbmVyYWN0YWJsZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBlbGVtZW50IGludGVyYWN0YWJsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICh1dGlscy5pc0VsZW1lbnQoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudEludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMuZ2V0KGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRJbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgZWxlbWVudEludGVyYWN0YWJsZSAhPT0gdGhpcy50YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWVsZW1lbnRJbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIGVsZW1lbnRJbnRlcmFjdGFibGUuZ2V0QWN0aW9uKHRoaXMuZG93blBvaW50ZXIsIHRoaXMuZG93bkV2ZW50LCB0aGlzLCBlbGVtZW50KS5uYW1lID09PSAnZHJhZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUuY2hlY2tBeGlzKGF4aXMsIGVsZW1lbnRJbnRlcmFjdGFibGUpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5uYW1lID0gJ2RyYWcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IGVsZW1lbnRJbnRlcmFjdGFibGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSdzIG5vIGRyYWcgZnJvbSBlbGVtZW50IGludGVyYWN0YWJsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayB0aGUgc2VsZWN0b3IgaW50ZXJhY3RhYmxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc0ludGVyYWN0aW9uID0gdGhpcztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBnZXREcmFnZ2FibGUgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBzZWxlY3RvciwgY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudHMgPSBzY29wZS5pZThNYXRjaGVzU2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0YWJsZSA9PT0gdGhpc0ludGVyYWN0aW9uLnRhcmdldCkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaW5Db250ZXh0KGludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJhZy5tYW51YWxTdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgIXNjb3BlLnRlc3RJZ25vcmUoaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yLCBlbGVtZW50cylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIGludGVyYWN0YWJsZS5nZXRBY3Rpb24odGhpc0ludGVyYWN0aW9uLmRvd25Qb2ludGVyLCB0aGlzSW50ZXJhY3Rpb24uZG93bkV2ZW50LCB0aGlzSW50ZXJhY3Rpb24sIGVsZW1lbnQpLm5hbWUgPT09ICdkcmFnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUuY2hlY2tBeGlzKGF4aXMsIGludGVyYWN0YWJsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIHNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQoaW50ZXJhY3RhYmxlLCBlbGVtZW50LCAnZHJhZycpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGFibGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3JJbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmZvckVhY2hTZWxlY3RvcihnZXREcmFnZ2FibGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvckludGVyYWN0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5uYW1lID0gJ2RyYWcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBzZWxlY3RvckludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHN0YXJ0aW5nID0gISF0aGlzLnByZXBhcmVkLm5hbWUgJiYgIXRoaXMuaW50ZXJhY3RpbmcoKTtcblxuICAgICAgICAgICAgaWYgKHN0YXJ0aW5nXG4gICAgICAgICAgICAgICAgJiYgKHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5tYW51YWxTdGFydFxuICAgICAgICAgICAgICAgIHx8ICFzY29wZS53aXRoaW5JbnRlcmFjdGlvbkxpbWl0KHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQsIHRoaXMucHJlcGFyZWQpKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcChldmVudCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5uYW1lICYmIHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQodGhpcy5wcmVwYXJlZCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNob3VsZE1vdmUgPSB0aGlzLnNldE1vZGlmaWNhdGlvbnModGhpcy5jdXJDb29yZHMucGFnZSwgcHJlRW5kKTtcblxuICAgICAgICAgICAgICAgIC8vIG1vdmUgaWYgc25hcHBpbmcgb3IgcmVzdHJpY3Rpb24gZG9lc24ndCBwcmV2ZW50IGl0XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZE1vdmUgfHwgc3RhcnRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSB0aGlzW3RoaXMucHJlcGFyZWQubmFtZSArICdNb3ZlJ10oZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1dGlscy5jb3B5Q29vcmRzKHRoaXMucHJldkNvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuXG4gICAgICAgIGlmICh0aGlzLmRyYWdnaW5nIHx8IHRoaXMucmVzaXppbmcpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Njcm9sbE1vdmUocG9pbnRlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHJhZ1N0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGRyYWdFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZHJhZycsICdzdGFydCcsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMudGFyZ2V0LmZpcmUoZHJhZ0V2ZW50KTtcblxuICAgICAgICAvLyByZXNldCBhY3RpdmUgZHJvcHpvbmVzXG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHMgID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgID0gW107XG5cbiAgICAgICAgaWYgKCF0aGlzLmR5bmFtaWNEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLnNldEFjdGl2ZURyb3BzKHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHRoaXMuZ2V0RHJvcEV2ZW50cyhldmVudCwgZHJhZ0V2ZW50KTtcblxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5hY3RpdmF0ZSkge1xuICAgICAgICAgICAgdGhpcy5maXJlQWN0aXZlRHJvcHMoZHJvcEV2ZW50cy5hY3RpdmF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJhZ0V2ZW50O1xuICAgIH0sXG5cbiAgICBkcmFnTW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIGRyYWdFdmVudCAgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ2RyYWcnLCAnbW92ZScsIHRoaXMuZWxlbWVudCksXG4gICAgICAgICAgICBkcmFnZ2FibGVFbGVtZW50ID0gdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgZHJvcCA9IHRoaXMuZ2V0RHJvcChldmVudCwgZHJhZ2dhYmxlRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5kcm9wVGFyZ2V0ID0gZHJvcC5kcm9wem9uZTtcbiAgICAgICAgdGhpcy5kcm9wRWxlbWVudCA9IGRyb3AuZWxlbWVudDtcblxuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHRoaXMuZ2V0RHJvcEV2ZW50cyhldmVudCwgZHJhZ0V2ZW50KTtcblxuICAgICAgICB0YXJnZXQuZmlyZShkcmFnRXZlbnQpO1xuXG4gICAgICAgIGlmIChkcm9wRXZlbnRzLmxlYXZlKSB7IHRoaXMucHJldkRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmxlYXZlKTsgfVxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5lbnRlcikgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5lbnRlcik7IH1cbiAgICAgICAgaWYgKGRyb3BFdmVudHMubW92ZSApIHsgICAgIHRoaXMuZHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubW92ZSApOyB9XG5cbiAgICAgICAgdGhpcy5wcmV2RHJvcFRhcmdldCAgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIHRoaXMucHJldkRyb3BFbGVtZW50ID0gdGhpcy5kcm9wRWxlbWVudDtcblxuICAgICAgICByZXR1cm4gZHJhZ0V2ZW50O1xuICAgIH0sXG5cbiAgICByZXNpemVTdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciByZXNpemVFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5lZGdlcykge1xuICAgICAgICAgICAgdmFyIHN0YXJ0UmVjdCA9IHRoaXMudGFyZ2V0LmdldFJlY3QodGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Lm9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgICAgICAgICAgICAgIHZhciBzcXVhcmVFZGdlcyA9IHV0aWxzLmV4dGVuZCh7fSwgdGhpcy5wcmVwYXJlZC5lZGdlcyk7XG5cbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy50b3AgICAgPSBzcXVhcmVFZGdlcy50b3AgICAgfHwgKHNxdWFyZUVkZ2VzLmxlZnQgICAmJiAhc3F1YXJlRWRnZXMuYm90dG9tKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5sZWZ0ICAgPSBzcXVhcmVFZGdlcy5sZWZ0ICAgfHwgKHNxdWFyZUVkZ2VzLnRvcCAgICAmJiAhc3F1YXJlRWRnZXMucmlnaHQgKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5ib3R0b20gPSBzcXVhcmVFZGdlcy5ib3R0b20gfHwgKHNxdWFyZUVkZ2VzLnJpZ2h0ICAmJiAhc3F1YXJlRWRnZXMudG9wICAgKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5yaWdodCAgPSBzcXVhcmVFZGdlcy5yaWdodCAgfHwgKHNxdWFyZUVkZ2VzLmJvdHRvbSAmJiAhc3F1YXJlRWRnZXMubGVmdCAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuX3NxdWFyZUVkZ2VzID0gc3F1YXJlRWRnZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLl9zcXVhcmVFZGdlcyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucmVzaXplUmVjdHMgPSB7XG4gICAgICAgICAgICAgICAgc3RhcnQgICAgIDogc3RhcnRSZWN0LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQgICA6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgICAgICAgICAgICAgIGRlbHRhICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMCwgcmlnaHQgOiAwLCB3aWR0aCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvcCA6IDAsIGJvdHRvbTogMCwgaGVpZ2h0OiAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmVzaXplRXZlbnQucmVjdCA9IHRoaXMucmVzaXplUmVjdHMucmVzdHJpY3RlZDtcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmRlbHRhUmVjdCA9IHRoaXMucmVzaXplUmVjdHMuZGVsdGE7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKHJlc2l6ZUV2ZW50KTtcblxuICAgICAgICB0aGlzLnJlc2l6aW5nID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gcmVzaXplRXZlbnQ7XG4gICAgfSxcblxuICAgIHJlc2l6ZU1vdmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcmVzaXplRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ3Jlc2l6ZScsICdtb3ZlJywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICB2YXIgZWRnZXMgPSB0aGlzLnByZXBhcmVkLmVkZ2VzLFxuICAgICAgICAgICAgaW52ZXJ0ID0gdGhpcy50YXJnZXQub3B0aW9ucy5yZXNpemUuaW52ZXJ0LFxuICAgICAgICAgICAgaW52ZXJ0aWJsZSA9IGludmVydCA9PT0gJ3JlcG9zaXRpb24nIHx8IGludmVydCA9PT0gJ25lZ2F0ZSc7XG5cbiAgICAgICAgaWYgKGVkZ2VzKSB7XG4gICAgICAgICAgICB2YXIgZHggPSByZXNpemVFdmVudC5keCxcbiAgICAgICAgICAgICAgICBkeSA9IHJlc2l6ZUV2ZW50LmR5LFxuXG4gICAgICAgICAgICAgICAgc3RhcnQgICAgICA9IHRoaXMucmVzaXplUmVjdHMuc3RhcnQsXG4gICAgICAgICAgICAgICAgY3VycmVudCAgICA9IHRoaXMucmVzaXplUmVjdHMuY3VycmVudCxcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkID0gdGhpcy5yZXNpemVSZWN0cy5yZXN0cmljdGVkLFxuICAgICAgICAgICAgICAgIGRlbHRhICAgICAgPSB0aGlzLnJlc2l6ZVJlY3RzLmRlbHRhLFxuICAgICAgICAgICAgICAgIHByZXZpb3VzICAgPSB1dGlscy5leHRlbmQodGhpcy5yZXNpemVSZWN0cy5wcmV2aW91cywgcmVzdHJpY3RlZCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldC5vcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxFZGdlcyA9IGVkZ2VzO1xuXG4gICAgICAgICAgICAgICAgZWRnZXMgPSB0aGlzLnByZXBhcmVkLl9zcXVhcmVFZGdlcztcblxuICAgICAgICAgICAgICAgIGlmICgob3JpZ2luYWxFZGdlcy5sZWZ0ICYmIG9yaWdpbmFsRWRnZXMuYm90dG9tKVxuICAgICAgICAgICAgICAgICAgICB8fCAob3JpZ2luYWxFZGdlcy5yaWdodCAmJiBvcmlnaW5hbEVkZ2VzLnRvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSAtZHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMubGVmdCB8fCBvcmlnaW5hbEVkZ2VzLnJpZ2h0KSB7IGR5ID0gZHg7IH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLnRvcCB8fCBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgeyBkeCA9IGR5OyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgJ2N1cnJlbnQnIHJlY3Qgd2l0aG91dCBtb2RpZmljYXRpb25zXG4gICAgICAgICAgICBpZiAoZWRnZXMudG9wICAgKSB7IGN1cnJlbnQudG9wICAgICs9IGR5OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMuYm90dG9tKSB7IGN1cnJlbnQuYm90dG9tICs9IGR5OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMubGVmdCAgKSB7IGN1cnJlbnQubGVmdCAgICs9IGR4OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMucmlnaHQgKSB7IGN1cnJlbnQucmlnaHQgICs9IGR4OyB9XG5cbiAgICAgICAgICAgIGlmIChpbnZlcnRpYmxlKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgaW52ZXJ0aWJsZSwgY29weSB0aGUgY3VycmVudCByZWN0XG4gICAgICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHJlc3RyaWN0ZWQsIGN1cnJlbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGludmVydCA9PT0gJ3JlcG9zaXRpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN3YXAgZWRnZSB2YWx1ZXMgaWYgbmVjZXNzYXJ5IHRvIGtlZXAgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlXG4gICAgICAgICAgICAgICAgICAgIHZhciBzd2FwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN0cmljdGVkLnRvcCA+IHJlc3RyaWN0ZWQuYm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2FwID0gcmVzdHJpY3RlZC50b3A7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQudG9wID0gcmVzdHJpY3RlZC5ib3R0b207XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0cmljdGVkLmJvdHRvbSA9IHN3YXA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3RyaWN0ZWQubGVmdCA+IHJlc3RyaWN0ZWQucmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXAgPSByZXN0cmljdGVkLmxlZnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQubGVmdCA9IHJlc3RyaWN0ZWQucmlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0cmljdGVkLnJpZ2h0ID0gc3dhcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vdCBpbnZlcnRpYmxlLCByZXN0cmljdCB0byBtaW5pbXVtIG9mIDB4MCByZWN0XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC50b3AgICAgPSBNYXRoLm1pbihjdXJyZW50LnRvcCwgc3RhcnQuYm90dG9tKTtcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkLmJvdHRvbSA9IE1hdGgubWF4KGN1cnJlbnQuYm90dG9tLCBzdGFydC50b3ApO1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQubGVmdCAgID0gTWF0aC5taW4oY3VycmVudC5sZWZ0LCBzdGFydC5yaWdodCk7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC5yaWdodCAgPSBNYXRoLm1heChjdXJyZW50LnJpZ2h0LCBzdGFydC5sZWZ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdHJpY3RlZC53aWR0aCAgPSByZXN0cmljdGVkLnJpZ2h0ICAtIHJlc3RyaWN0ZWQubGVmdDtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWQuaGVpZ2h0ID0gcmVzdHJpY3RlZC5ib3R0b20gLSByZXN0cmljdGVkLnRvcCA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGVkZ2UgaW4gcmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgIGRlbHRhW2VkZ2VdID0gcmVzdHJpY3RlZFtlZGdlXSAtIHByZXZpb3VzW2VkZ2VdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNpemVFdmVudC5lZGdlcyA9IHRoaXMucHJlcGFyZWQuZWRnZXM7XG4gICAgICAgICAgICByZXNpemVFdmVudC5yZWN0ID0gcmVzdHJpY3RlZDtcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmRlbHRhUmVjdCA9IGRlbHRhO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShyZXNpemVFdmVudCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc2l6ZUV2ZW50O1xuICAgIH0sXG5cbiAgICBnZXN0dXJlU3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICBnZXN0dXJlRXZlbnQuZHMgPSAwO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyZS5zdGFydERpc3RhbmNlID0gdGhpcy5nZXN0dXJlLnByZXZEaXN0YW5jZSA9IGdlc3R1cmVFdmVudC5kaXN0YW5jZTtcbiAgICAgICAgdGhpcy5nZXN0dXJlLnN0YXJ0QW5nbGUgPSB0aGlzLmdlc3R1cmUucHJldkFuZ2xlID0gZ2VzdHVyZUV2ZW50LmFuZ2xlO1xuICAgICAgICB0aGlzLmdlc3R1cmUuc2NhbGUgPSAxO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyaW5nID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKGdlc3R1cmVFdmVudCk7XG5cbiAgICAgICAgcmV0dXJuIGdlc3R1cmVFdmVudDtcbiAgICB9LFxuXG4gICAgZ2VzdHVyZU1vdmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoIXRoaXMucG9pbnRlcklkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZFdmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnZXN0dXJlRXZlbnQ7XG5cbiAgICAgICAgZ2VzdHVyZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ21vdmUnLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICBnZXN0dXJlRXZlbnQuZHMgPSBnZXN0dXJlRXZlbnQuc2NhbGUgLSB0aGlzLmdlc3R1cmUuc2NhbGU7XG5cbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShnZXN0dXJlRXZlbnQpO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyZS5wcmV2QW5nbGUgPSBnZXN0dXJlRXZlbnQuYW5nbGU7XG4gICAgICAgIHRoaXMuZ2VzdHVyZS5wcmV2RGlzdGFuY2UgPSBnZXN0dXJlRXZlbnQuZGlzdGFuY2U7XG5cbiAgICAgICAgaWYgKGdlc3R1cmVFdmVudC5zY2FsZSAhPT0gSW5maW5pdHkgJiZcbiAgICAgICAgICAgIGdlc3R1cmVFdmVudC5zY2FsZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgZ2VzdHVyZUV2ZW50LnNjYWxlICE9PSB1bmRlZmluZWQgICYmXG4gICAgICAgICAgICAhaXNOYU4oZ2VzdHVyZUV2ZW50LnNjYWxlKSkge1xuXG4gICAgICAgICAgICB0aGlzLmdlc3R1cmUuc2NhbGUgPSBnZXN0dXJlRXZlbnQuc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2VzdHVyZUV2ZW50O1xuICAgIH0sXG5cbiAgICBwb2ludGVySG9sZDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnaG9sZCcpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyVXA6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcblxuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAndXAnICk7XG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICd0YXAnKTtcblxuICAgICAgICB0aGlzLnBvaW50ZXJFbmQocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyQ2FuY2VsOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhvbGRUaW1lcnNbcG9pbnRlckluZGV4XSk7XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2NhbmNlbCcpO1xuICAgICAgICB0aGlzLnBvaW50ZXJFbmQocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIpO1xuICAgIH0sXG5cbiAgICAvLyBodHRwOi8vd3d3LnF1aXJrc21vZGUub3JnL2RvbS9ldmVudHMvY2xpY2suaHRtbFxuICAgIC8vID5FdmVudHMgbGVhZGluZyB0byBkYmxjbGlja1xuICAgIC8vXG4gICAgLy8gSUU4IGRvZXNuJ3QgZmlyZSBkb3duIGV2ZW50IGJlZm9yZSBkYmxjbGljay5cbiAgICAvLyBUaGlzIHdvcmthcm91bmQgdHJpZXMgdG8gZmlyZSBhIHRhcCBhbmQgZG91YmxldGFwIGFmdGVyIGRibGNsaWNrXG4gICAgaWU4RGJsY2xpY2s6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICAgICAgaWYgKHRoaXMucHJldlRhcFxuICAgICAgICAgICAgJiYgZXZlbnQuY2xpZW50WCA9PT0gdGhpcy5wcmV2VGFwLmNsaWVudFhcbiAgICAgICAgICAgICYmIGV2ZW50LmNsaWVudFkgPT09IHRoaXMucHJldlRhcC5jbGllbnRZXG4gICAgICAgICAgICAmJiBldmVudFRhcmdldCAgID09PSB0aGlzLnByZXZUYXAudGFyZ2V0KSB7XG5cbiAgICAgICAgICAgIHRoaXMuZG93blRhcmdldHNbMF0gPSBldmVudFRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuZG93blRpbWVzWzBdID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAndGFwJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBpbmVydGlhIGlzIGVuYWJsZWRcbiAgICBwb2ludGVyRW5kOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgZW5kRXZlbnQsXG4gICAgICAgICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMsXG4gICAgICAgICAgICBpbmVydGlhT3B0aW9ucyA9IG9wdGlvbnMgJiYgdGhpcy5wcmVwYXJlZC5uYW1lICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLFxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cyA9IHRoaXMuaW5lcnRpYVN0YXR1cztcblxuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG5cbiAgICAgICAgICAgIGlmIChpbmVydGlhU3RhdHVzLmFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgdmFyIHBvaW50ZXJTcGVlZCxcbiAgICAgICAgICAgICAgICBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgICAgICAgICBpbmVydGlhUG9zc2libGUgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpbmVydGlhID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgc21vb3RoRW5kID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgZW5kU25hcCA9IHNjb3BlLmNoZWNrU25hcCh0YXJnZXQsIHRoaXMucHJlcGFyZWQubmFtZSkgJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnNuYXAuZW5kT25seSxcbiAgICAgICAgICAgICAgICBlbmRSZXN0cmljdCA9IHNjb3BlLmNoZWNrUmVzdHJpY3QodGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5yZXN0cmljdC5lbmRPbmx5LFxuICAgICAgICAgICAgICAgIGR4ID0gMCxcbiAgICAgICAgICAgICAgICBkeSA9IDAsXG4gICAgICAgICAgICAgICAgc3RhcnRFdmVudDtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAgICAgIChvcHRpb25zLmRyYWcuYXhpcyA9PT0gJ3gnICkgeyBwb2ludGVyU3BlZWQgPSBNYXRoLmFicyh0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudngpOyB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5kcmFnLmF4aXMgPT09ICd5JyApIHsgcG9pbnRlclNwZWVkID0gTWF0aC5hYnModGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnZ5KTsgfVxuICAgICAgICAgICAgICAgIGVsc2UgICAvKm9wdGlvbnMuZHJhZy5heGlzID09PSAneHknKi97IHBvaW50ZXJTcGVlZCA9IHRoaXMucG9pbnRlckRlbHRhLmNsaWVudC5zcGVlZDsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcG9pbnRlclNwZWVkID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnNwZWVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBpbmVydGlhIHNob3VsZCBiZSBzdGFydGVkXG4gICAgICAgICAgICBpbmVydGlhUG9zc2libGUgPSAoaW5lcnRpYU9wdGlvbnMgJiYgaW5lcnRpYU9wdGlvbnMuZW5hYmxlZFxuICAgICAgICAgICAgJiYgdGhpcy5wcmVwYXJlZC5uYW1lICE9PSAnZ2VzdHVyZSdcbiAgICAgICAgICAgICYmIGV2ZW50ICE9PSBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhID0gKGluZXJ0aWFQb3NzaWJsZVxuICAgICAgICAgICAgJiYgKG5vdyAtIHRoaXMuY3VyQ29vcmRzLnRpbWVTdGFtcCkgPCA1MFxuICAgICAgICAgICAgJiYgcG9pbnRlclNwZWVkID4gaW5lcnRpYU9wdGlvbnMubWluU3BlZWRcbiAgICAgICAgICAgICYmIHBvaW50ZXJTcGVlZCA+IGluZXJ0aWFPcHRpb25zLmVuZFNwZWVkKTtcblxuICAgICAgICAgICAgaWYgKGluZXJ0aWFQb3NzaWJsZSAmJiAhaW5lcnRpYSAmJiAoZW5kU25hcCB8fCBlbmRSZXN0cmljdCkpIHtcblxuICAgICAgICAgICAgICAgIHZhciBzbmFwUmVzdHJpY3QgPSB7fTtcblxuICAgICAgICAgICAgICAgIHNuYXBSZXN0cmljdC5zbmFwID0gc25hcFJlc3RyaWN0LnJlc3RyaWN0ID0gc25hcFJlc3RyaWN0O1xuXG4gICAgICAgICAgICAgICAgaWYgKGVuZFNuYXApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTbmFwcGluZyh0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzbmFwUmVzdHJpY3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc25hcFJlc3RyaWN0LmxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHggKz0gc25hcFJlc3RyaWN0LmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gc25hcFJlc3RyaWN0LmR5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVzdHJpY3Rpb24odGhpcy5jdXJDb29yZHMucGFnZSwgc25hcFJlc3RyaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNuYXBSZXN0cmljdC5yZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeCArPSBzbmFwUmVzdHJpY3QuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBzbmFwUmVzdHJpY3QuZHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZHggfHwgZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoRW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbmVydGlhIHx8IHNtb290aEVuZCkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmNvcHlDb29yZHMoaW5lcnRpYVN0YXR1cy51cENvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyc1swXSA9IGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCA9IHN0YXJ0RXZlbnQgPVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgdGhpcy5wcmVwYXJlZC5uYW1lLCAnaW5lcnRpYXN0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudDAgPSBub3c7XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQuZmlyZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZXJ0aWEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy52eDAgPSB0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudng7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudnkwID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnZ5O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnYwID0gcG9pbnRlclNwZWVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsY0luZXJ0aWEoaW5lcnRpYVN0YXR1cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSB1dGlscy5leHRlbmQoe30sIHRoaXMuY3VyQ29vcmRzLnBhZ2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luID0gc2NvcGUuZ2V0T3JpZ2luWFkodGFyZ2V0LCB0aGlzLmVsZW1lbnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzT2JqZWN0O1xuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UueCA9IHBhZ2UueCArIGluZXJ0aWFTdGF0dXMueGUgLSBvcmlnaW4ueDtcbiAgICAgICAgICAgICAgICAgICAgcGFnZS55ID0gcGFnZS55ICsgaW5lcnRpYVN0YXR1cy55ZSAtIG9yaWdpbi55O1xuXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c09iamVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZVN0YXR1c1hZOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFnZS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFnZS55LFxuICAgICAgICAgICAgICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkeTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNuYXA6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNPYmplY3Quc25hcCA9IHN0YXR1c09iamVjdDtcblxuICAgICAgICAgICAgICAgICAgICBkeCA9IGR5ID0gMDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5kU25hcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNuYXAgPSB0aGlzLnNldFNuYXBwaW5nKHRoaXMuY3VyQ29vcmRzLnBhZ2UsIHN0YXR1c09iamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzbmFwLmxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHNuYXAuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gc25hcC5keTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRSZXN0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3RyaWN0ID0gdGhpcy5zZXRSZXN0cmljdGlvbih0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzdGF0dXNPYmplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdHJpY3QucmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHJlc3RyaWN0LmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ICs9IHJlc3RyaWN0LmR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlICs9IGR4O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWUgKz0gZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5pID0gYW5pbWF0aW9uRnJhbWUucmVxdWVzdCh0aGlzLmJvdW5kSW5lcnRpYUZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc21vb3RoRW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy54ZSA9IGR4O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnllID0gZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IGluZXJ0aWFTdGF0dXMuc3kgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuaSA9IGFuaW1hdGlvbkZyYW1lLnJlcXVlc3QodGhpcy5ib3VuZFNtb290aEVuZEZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZW5kU25hcCB8fCBlbmRSZXN0cmljdCkge1xuICAgICAgICAgICAgICAgIC8vIGZpcmUgYSBtb3ZlIGV2ZW50IGF0IHRoZSBzbmFwcGVkIGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRyYWdnaW5nKSB7XG4gICAgICAgICAgICBlbmRFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZHJhZycsICdlbmQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICB2YXIgZHJhZ2dhYmxlRWxlbWVudCA9IHRoaXMuZWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wID0gdGhpcy5nZXREcm9wKGV2ZW50LCBkcmFnZ2FibGVFbGVtZW50KTtcblxuICAgICAgICAgICAgdGhpcy5kcm9wVGFyZ2V0ID0gZHJvcC5kcm9wem9uZTtcbiAgICAgICAgICAgIHRoaXMuZHJvcEVsZW1lbnQgPSBkcm9wLmVsZW1lbnQ7XG5cbiAgICAgICAgICAgIHZhciBkcm9wRXZlbnRzID0gdGhpcy5nZXREcm9wRXZlbnRzKGV2ZW50LCBlbmRFdmVudCk7XG5cbiAgICAgICAgICAgIGlmIChkcm9wRXZlbnRzLmxlYXZlKSB7IHRoaXMucHJldkRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmxlYXZlKTsgfVxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMuZW50ZXIpIHsgICAgIHRoaXMuZHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMuZW50ZXIpOyB9XG4gICAgICAgICAgICBpZiAoZHJvcEV2ZW50cy5kcm9wICkgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5kcm9wICk7IH1cbiAgICAgICAgICAgIGlmIChkcm9wRXZlbnRzLmRlYWN0aXZhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmVBY3RpdmVEcm9wcyhkcm9wRXZlbnRzLmRlYWN0aXZhdGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5yZXNpemluZykge1xuICAgICAgICAgICAgZW5kRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ3Jlc2l6ZScsICdlbmQnLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGFyZ2V0LmZpcmUoZW5kRXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuZ2VzdHVyaW5nKSB7XG4gICAgICAgICAgICBlbmRFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZ2VzdHVyZScsICdlbmQnLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGFyZ2V0LmZpcmUoZW5kRXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdG9wKGV2ZW50KTtcbiAgICB9LFxuXG4gICAgY29sbGVjdERyb3BzOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgZHJvcHMgPSBbXSxcbiAgICAgICAgICAgIGVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuZWxlbWVudDtcblxuICAgICAgICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2NvcGUuaW50ZXJhY3RhYmxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFzY29wZS5pbnRlcmFjdGFibGVzW2ldLm9wdGlvbnMuZHJvcC5lbmFibGVkKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gc2NvcGUuaW50ZXJhY3RhYmxlc1tpXSxcbiAgICAgICAgICAgICAgICBhY2NlcHQgPSBjdXJyZW50Lm9wdGlvbnMuZHJvcC5hY2NlcHQ7XG5cbiAgICAgICAgICAgIC8vIHRlc3QgdGhlIGRyYWdnYWJsZSBlbGVtZW50IGFnYWluc3QgdGhlIGRyb3B6b25lJ3MgYWNjZXB0IHNldHRpbmdcbiAgICAgICAgICAgIGlmICgodXRpbHMuaXNFbGVtZW50KGFjY2VwdCkgJiYgYWNjZXB0ICE9PSBlbGVtZW50KVxuICAgICAgICAgICAgICAgIHx8IChzY29wZS5pc1N0cmluZyhhY2NlcHQpXG4gICAgICAgICAgICAgICAgJiYgIXNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBhY2NlcHQpKSkge1xuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHF1ZXJ5IGZvciBuZXcgZWxlbWVudHMgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgICB2YXIgZHJvcEVsZW1lbnRzID0gY3VycmVudC5zZWxlY3Rvcj8gY3VycmVudC5fY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKGN1cnJlbnQuc2VsZWN0b3IpIDogW2N1cnJlbnQuX2VsZW1lbnRdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgbGVuID0gZHJvcEVsZW1lbnRzLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZHJvcEVsZW1lbnRzW2pdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRyb3BzLnB1c2goY3VycmVudCk7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChjdXJyZW50RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZHJvcHpvbmVzOiBkcm9wcyxcbiAgICAgICAgICAgIGVsZW1lbnRzOiBlbGVtZW50c1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBmaXJlQWN0aXZlRHJvcHM6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGN1cnJlbnQsXG4gICAgICAgICAgICBjdXJyZW50RWxlbWVudCxcbiAgICAgICAgICAgIHByZXZFbGVtZW50O1xuXG4gICAgICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgYWN0aXZlIGRyb3B6b25lcyBhbmQgdHJpZ2dlciBldmVudFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tpXTtcbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50ID0gdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyBbaV07XG5cbiAgICAgICAgICAgIC8vIHByZXZlbnQgdHJpZ2dlciBvZiBkdXBsaWNhdGUgZXZlbnRzIG9uIHNhbWUgZWxlbWVudFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRFbGVtZW50ICE9PSBwcmV2RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIC8vIHNldCBjdXJyZW50IGVsZW1lbnQgYXMgZXZlbnQgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0ID0gY3VycmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgY3VycmVudC5maXJlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByZXZFbGVtZW50ID0gY3VycmVudEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gQ29sbGVjdCBhIG5ldyBzZXQgb2YgcG9zc2libGUgZHJvcHMgYW5kIHNhdmUgdGhlbSBpbiBhY3RpdmVEcm9wcy5cbiAgICAvLyBzZXRBY3RpdmVEcm9wcyBzaG91bGQgYWx3YXlzIGJlIGNhbGxlZCB3aGVuIGEgZHJhZyBoYXMganVzdCBzdGFydGVkIG9yIGFcbiAgICAvLyBkcmFnIGV2ZW50IGhhcHBlbnMgd2hpbGUgZHluYW1pY0Ryb3AgaXMgdHJ1ZVxuICAgIHNldEFjdGl2ZURyb3BzOiBmdW5jdGlvbiAoZHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgLy8gZ2V0IGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgdGhhdCBjb3VsZCByZWNlaXZlIHRoZSBkcmFnZ2FibGVcbiAgICAgICAgdmFyIHBvc3NpYmxlRHJvcHMgPSB0aGlzLmNvbGxlY3REcm9wcyhkcmFnRWxlbWVudCwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMgPSBwb3NzaWJsZURyb3BzLmRyb3B6b25lcztcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyAgPSBwb3NzaWJsZURyb3BzLmVsZW1lbnRzO1xuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLnJlY3RzICAgICA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHNbaV0gPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tpXS5nZXRSZWN0KHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldERyb3A6IGZ1bmN0aW9uIChldmVudCwgZHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyIHZhbGlkRHJvcHMgPSBbXTtcblxuICAgICAgICBpZiAoc2NvcGUuZHluYW1pY0Ryb3ApIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlRHJvcHMoZHJhZ0VsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29sbGVjdCBhbGwgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB3aGljaCBxdWFsaWZ5IGZvciBhIGRyb3BcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnQgICAgICAgID0gdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXNbal0sXG4gICAgICAgICAgICAgICAgY3VycmVudEVsZW1lbnQgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtqXSxcbiAgICAgICAgICAgICAgICByZWN0ICAgICAgICAgICA9IHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgW2pdO1xuXG4gICAgICAgICAgICB2YWxpZERyb3BzLnB1c2goY3VycmVudC5kcm9wQ2hlY2sodGhpcy5wb2ludGVyc1swXSwgZXZlbnQsIHRoaXMudGFyZ2V0LCBkcmFnRWxlbWVudCwgY3VycmVudEVsZW1lbnQsIHJlY3QpXG4gICAgICAgICAgICAgICAgPyBjdXJyZW50RWxlbWVudFxuICAgICAgICAgICAgICAgIDogbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgdGhlIG1vc3QgYXBwcm9wcmlhdGUgZHJvcHpvbmUgYmFzZWQgb24gRE9NIGRlcHRoIGFuZCBvcmRlclxuICAgICAgICB2YXIgZHJvcEluZGV4ID0gc2NvcGUuaW5kZXhPZkRlZXBlc3RFbGVtZW50KHZhbGlkRHJvcHMpLFxuICAgICAgICAgICAgZHJvcHpvbmUgID0gdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXNbZHJvcEluZGV4XSB8fCBudWxsLFxuICAgICAgICAgICAgZWxlbWVudCAgID0gdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyBbZHJvcEluZGV4XSB8fCBudWxsO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkcm9wem9uZTogZHJvcHpvbmUsXG4gICAgICAgICAgICBlbGVtZW50OiBlbGVtZW50XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldERyb3BFdmVudHM6IGZ1bmN0aW9uIChwb2ludGVyRXZlbnQsIGRyYWdFdmVudCkge1xuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHtcbiAgICAgICAgICAgIGVudGVyICAgICA6IG51bGwsXG4gICAgICAgICAgICBsZWF2ZSAgICAgOiBudWxsLFxuICAgICAgICAgICAgYWN0aXZhdGUgIDogbnVsbCxcbiAgICAgICAgICAgIGRlYWN0aXZhdGU6IG51bGwsXG4gICAgICAgICAgICBtb3ZlICAgICAgOiBudWxsLFxuICAgICAgICAgICAgZHJvcCAgICAgIDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0aGlzLmRyb3BFbGVtZW50ICE9PSB0aGlzLnByZXZEcm9wRWxlbWVudCkge1xuICAgICAgICAgICAgLy8gaWYgdGhlcmUgd2FzIGEgcHJldkRyb3BUYXJnZXQsIGNyZWF0ZSBhIGRyYWdsZWF2ZSBldmVudFxuICAgICAgICAgICAgaWYgKHRoaXMucHJldkRyb3BUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICBkcm9wRXZlbnRzLmxlYXZlID0ge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiB0aGlzLnByZXZEcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5wcmV2RHJvcFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICAgICAgZHJhZ0V2ZW50ICAgIDogZHJhZ0V2ZW50LFxuICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgICAgICB0eXBlICAgICAgICAgOiAnZHJhZ2xlYXZlJ1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQuZHJhZ0xlYXZlID0gdGhpcy5wcmV2RHJvcEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LnByZXZEcm9wem9uZSA9IHRoaXMucHJldkRyb3BUYXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiB0aGUgZHJvcFRhcmdldCBpcyBub3QgbnVsbCwgY3JlYXRlIGEgZHJhZ2VudGVyIGV2ZW50XG4gICAgICAgICAgICBpZiAodGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgZHJvcEV2ZW50cy5lbnRlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5kcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICByZWxhdGVkVGFyZ2V0OiBkcmFnRXZlbnQudGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uICA6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcmFnZW50ZXInXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGRyYWdFdmVudC5kcmFnRW50ZXIgPSB0aGlzLmRyb3BFbGVtZW50O1xuICAgICAgICAgICAgICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IHRoaXMuZHJvcFRhcmdldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdlbmQnICYmIHRoaXMuZHJvcFRhcmdldCkge1xuICAgICAgICAgICAgZHJvcEV2ZW50cy5kcm9wID0ge1xuICAgICAgICAgICAgICAgIHRhcmdldCAgICAgICA6IHRoaXMuZHJvcEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5kcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wVGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdzdGFydCcpIHtcbiAgICAgICAgICAgIGRyb3BFdmVudHMuYWN0aXZhdGUgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogbnVsbCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wYWN0aXZhdGUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdlbmQnKSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogbnVsbCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wZGVhY3RpdmF0ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ21vdmUnICYmIHRoaXMuZHJvcFRhcmdldCkge1xuICAgICAgICAgICAgZHJvcEV2ZW50cy5tb3ZlID0ge1xuICAgICAgICAgICAgICAgIHRhcmdldCAgICAgICA6IHRoaXMuZHJvcEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5kcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICBkcmFnbW92ZSAgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgdGltZVN0YW1wICAgIDogZHJhZ0V2ZW50LnRpbWVTdGFtcCxcbiAgICAgICAgICAgICAgICB0eXBlICAgICAgICAgOiAnZHJvcG1vdmUnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wVGFyZ2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRyb3BFdmVudHM7XG4gICAgfSxcblxuICAgIGN1cnJlbnRBY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmRyYWdnaW5nICYmICdkcmFnJykgfHwgKHRoaXMucmVzaXppbmcgJiYgJ3Jlc2l6ZScpIHx8ICh0aGlzLmdlc3R1cmluZyAmJiAnZ2VzdHVyZScpIHx8IG51bGw7XG4gICAgfSxcblxuICAgIGludGVyYWN0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRyYWdnaW5nIHx8IHRoaXMucmVzaXppbmcgfHwgdGhpcy5nZXN0dXJpbmc7XG4gICAgfSxcblxuICAgIGNsZWFyVGFyZ2V0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRhcmdldCA9IHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kcm9wVGFyZ2V0ID0gdGhpcy5kcm9wRWxlbWVudCA9IHRoaXMucHJldkRyb3BUYXJnZXQgPSB0aGlzLnByZXZEcm9wRWxlbWVudCA9IG51bGw7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG5cbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgICAgICAgICAgaWYgKHRhcmdldC5vcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBwcmV2ZW50IERlZmF1bHQgb25seSBpZiB3ZXJlIHByZXZpb3VzbHkgaW50ZXJhY3RpbmdcbiAgICAgICAgICAgIGlmIChldmVudCAmJiBzY29wZS5pc0Z1bmN0aW9uKGV2ZW50LnByZXZlbnREZWZhdWx0KSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5kcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzID0gdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyA9IHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbGVhclRhcmdldHMoKTtcblxuICAgICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0aGlzLnNuYXBTdGF0dXMubG9ja2VkID0gdGhpcy5kcmFnZ2luZyA9IHRoaXMucmVzaXppbmcgPSB0aGlzLmdlc3R1cmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSB0aGlzLnByZXZFdmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeCA9IHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeSA9IDA7XG5cbiAgICAgICAgLy8gcmVtb3ZlIHBvaW50ZXJzIGlmIHRoZWlyIElEIGlzbid0IGluIHRoaXMucG9pbnRlcklkc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucG9pbnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgdXRpbHMuZ2V0UG9pbnRlcklkKHRoaXMucG9pbnRlcnNbaV0pKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzY29wZS5pbnRlcmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGlzIGludGVyYWN0aW9uIGlmIGl0J3Mgbm90IHRoZSBvbmx5IG9uZSBvZiBpdCdzIHR5cGVcbiAgICAgICAgICAgIGlmIChzY29wZS5pbnRlcmFjdGlvbnNbaV0gIT09IHRoaXMgJiYgc2NvcGUuaW50ZXJhY3Rpb25zW2ldLm1vdXNlID09PSB0aGlzLm1vdXNlKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLnNwbGljZShzY29wZS5pbmRleE9mKHNjb3BlLmludGVyYWN0aW9ucywgdGhpcyksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluZXJ0aWFGcmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5lcnRpYVN0YXR1cyA9IHRoaXMuaW5lcnRpYVN0YXR1cyxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uaW5lcnRpYSxcbiAgICAgICAgICAgIGxhbWJkYSA9IG9wdGlvbnMucmVzaXN0YW5jZSxcbiAgICAgICAgICAgIHQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDAgLSBpbmVydGlhU3RhdHVzLnQwO1xuXG4gICAgICAgIGlmICh0IDwgaW5lcnRpYVN0YXR1cy50ZSkge1xuXG4gICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSAgMSAtIChNYXRoLmV4cCgtbGFtYmRhICogdCkgLSBpbmVydGlhU3RhdHVzLmxhbWJkYV92MCkgLyBpbmVydGlhU3RhdHVzLm9uZV92ZV92MDtcblxuICAgICAgICAgICAgaWYgKGluZXJ0aWFTdGF0dXMubW9kaWZpZWRYZSA9PT0gaW5lcnRpYVN0YXR1cy54ZSAmJiBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWUgPT09IGluZXJ0aWFTdGF0dXMueWUpIHtcbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy54ZSAqIHByb2dyZXNzO1xuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBpbmVydGlhU3RhdHVzLnllICogcHJvZ3Jlc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVhZFBvaW50ID0gc2NvcGUuZ2V0UXVhZHJhdGljQ3VydmVQb2ludChcbiAgICAgICAgICAgICAgICAgICAgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy54ZSwgaW5lcnRpYVN0YXR1cy55ZSxcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlLCBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWUsXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzKTtcblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBxdWFkUG9pbnQueDtcbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN5ID0gcXVhZFBvaW50Lnk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlck1vdmUoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLmkgPSBhbmltYXRpb25GcmFtZS5yZXF1ZXN0KHRoaXMuYm91bmRJbmVydGlhRnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IGluZXJ0aWFTdGF0dXMubW9kaWZpZWRYZTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWU7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlck1vdmUoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyRW5kKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzbW9vdGhFbmRGcmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5lcnRpYVN0YXR1cyA9IHRoaXMuaW5lcnRpYVN0YXR1cyxcbiAgICAgICAgICAgIHQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIGluZXJ0aWFTdGF0dXMudDAsXG4gICAgICAgICAgICBkdXJhdGlvbiA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLnNtb290aEVuZER1cmF0aW9uO1xuXG4gICAgICAgIGlmICh0IDwgZHVyYXRpb24pIHtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBzY29wZS5lYXNlT3V0UXVhZCh0LCAwLCBpbmVydGlhU3RhdHVzLnhlLCBkdXJhdGlvbik7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN5ID0gc2NvcGUuZWFzZU91dFF1YWQodCwgMCwgaW5lcnRpYVN0YXR1cy55ZSwgZHVyYXRpb24pO1xuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcblxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5pID0gYW5pbWF0aW9uRnJhbWUucmVxdWVzdCh0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IGluZXJ0aWFTdGF0dXMueGU7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN5ID0gaW5lcnRpYVN0YXR1cy55ZTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnNtb290aEVuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJFbmQoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFkZFBvaW50ZXI6IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgICAgIHZhciBpZCA9IHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSxcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCBpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLnBvaW50ZXJJZHMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wb2ludGVySWRzW2luZGV4XSA9IGlkO1xuICAgICAgICB0aGlzLnBvaW50ZXJzW2luZGV4XSA9IHBvaW50ZXI7XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG5cbiAgICByZW1vdmVQb2ludGVyOiBmdW5jdGlvbiAocG9pbnRlcikge1xuICAgICAgICB2YXIgaWQgPSB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlciksXG4gICAgICAgICAgICBpbmRleCA9IHRoaXMubW91c2U/IDAgOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgaWQpO1xuXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgIHRoaXMucG9pbnRlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcklkcyAuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdGhpcy5kb3duVGFyZ2V0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmRvd25UaW1lcyAgLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMuaG9sZFRpbWVycyAuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9LFxuXG4gICAgcmVjb3JkUG9pbnRlcjogZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICAgICAgLy8gRG8gbm90IHVwZGF0ZSBwb2ludGVycyB3aGlsZSBpbmVydGlhIGlzIGFjdGl2ZS5cbiAgICAgICAgLy8gVGhlIGluZXJ0aWEgc3RhcnQgZXZlbnQgc2hvdWxkIGJlIHRoaXMucG9pbnRlcnNbMF1cbiAgICAgICAgaWYgKHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5tb3VzZT8gMDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkgeyByZXR1cm47IH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJzW2luZGV4XSA9IHBvaW50ZXI7XG4gICAgfSxcblxuICAgIGNvbGxlY3RFdmVudFRhcmdldHM6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGV2ZW50VHlwZSkge1xuICAgICAgICB2YXIgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIC8vIGRvIG5vdCBmaXJlIGEgdGFwIGV2ZW50IGlmIHRoZSBwb2ludGVyIHdhcyBtb3ZlZCBiZWZvcmUgYmVpbmcgbGlmdGVkXG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICd0YXAnICYmICh0aGlzLnBvaW50ZXJXYXNNb3ZlZFxuICAgICAgICAgICAgICAgIC8vIG9yIGlmIHRoZSBwb2ludGVydXAgdGFyZ2V0IGlzIGRpZmZlcmVudCB0byB0aGUgcG9pbnRlcmRvd24gdGFyZ2V0XG4gICAgICAgICAgICB8fCAhKHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSAmJiB0aGlzLmRvd25UYXJnZXRzW3BvaW50ZXJJbmRleF0gPT09IGV2ZW50VGFyZ2V0KSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0YXJnZXRzID0gW10sXG4gICAgICAgICAgICBlbGVtZW50cyA9IFtdLFxuICAgICAgICAgICAgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbGxlY3RTZWxlY3RvcnMgKGludGVyYWN0YWJsZSwgc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBlbHMgPSBzY29wZS5pZThNYXRjaGVzU2VsZWN0b3JcbiAgICAgICAgICAgICAgICA/IGNvbnRleHQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgaWYgKGludGVyYWN0YWJsZS5faUV2ZW50c1tldmVudFR5cGVdXG4gICAgICAgICAgICAgICAgJiYgdXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUuaW5Db250ZXh0KGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvciwgZWxzKSkge1xuXG4gICAgICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKGludGVyYWN0YWJsZSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIGludGVyYWN0ID0gc2NvcGUuaW50ZXJhY3Q7XG5cbiAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdC5pc1NldChlbGVtZW50KSAmJiBpbnRlcmFjdChlbGVtZW50KS5faUV2ZW50c1tldmVudFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKGludGVyYWN0KGVsZW1lbnQpKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzY29wZS5pbnRlcmFjdGFibGVzLmZvckVhY2hTZWxlY3Rvcihjb2xsZWN0U2VsZWN0b3JzKTtcblxuICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjcmVhdGUgdGhlIHRhcCBldmVudCBldmVuIGlmIHRoZXJlIGFyZSBubyBsaXN0ZW5lcnMgc28gdGhhdFxuICAgICAgICAvLyBkb3VibGV0YXAgY2FuIHN0aWxsIGJlIGNyZWF0ZWQgYW5kIGZpcmVkXG4gICAgICAgIGlmICh0YXJnZXRzLmxlbmd0aCB8fCBldmVudFR5cGUgPT09ICd0YXAnKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmVQb2ludGVycyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRhcmdldHMsIGVsZW1lbnRzLCBldmVudFR5cGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZpcmVQb2ludGVyczogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgdGFyZ2V0cywgZWxlbWVudHMsIGV2ZW50VHlwZSkge1xuICAgICAgICB2YXIgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpKSxcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudCA9IHt9LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgLy8gZm9yIHRhcCBldmVudHNcbiAgICAgICAgICAgIGludGVydmFsLCBjcmVhdGVOZXdEb3VibGVUYXA7XG5cbiAgICAgICAgLy8gaWYgaXQncyBhIGRvdWJsZXRhcCB0aGVuIHRoZSBldmVudCBwcm9wZXJ0aWVzIHdvdWxkIGhhdmUgYmVlblxuICAgICAgICAvLyBjb3BpZWQgZnJvbSB0aGUgdGFwIGV2ZW50IGFuZCBwcm92aWRlZCBhcyB0aGUgcG9pbnRlciBhcmd1bWVudFxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnZG91YmxldGFwJykge1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50ID0gcG9pbnRlcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHV0aWxzLmV4dGVuZChwb2ludGVyRXZlbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChldmVudCAhPT0gcG9pbnRlcikge1xuICAgICAgICAgICAgICAgIHV0aWxzLmV4dGVuZChwb2ludGVyRXZlbnQsIHBvaW50ZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb2ludGVyRXZlbnQucHJldmVudERlZmF1bHQgICAgICAgICAgID0gcHJldmVudE9yaWdpbmFsRGVmYXVsdDtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5zdG9wUHJvcGFnYXRpb24gICAgICAgICAgPSBJbnRlcmFjdEV2ZW50LnByb3RvdHlwZS5zdG9wUHJvcGFnYXRpb247XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gSW50ZXJhY3RFdmVudC5wcm90b3R5cGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmludGVyYWN0aW9uICAgICAgICAgICAgICA9IHRoaXM7XG5cbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC50aW1lU3RhbXAgICAgID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQub3JpZ2luYWxFdmVudCA9IGV2ZW50O1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnR5cGUgICAgICAgICAgPSBldmVudFR5cGU7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQucG9pbnRlcklkICAgICA9IHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKTtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5wb2ludGVyVHlwZSAgID0gdGhpcy5tb3VzZT8gJ21vdXNlJyA6ICFicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50PyAndG91Y2gnXG4gICAgICAgICAgICAgICAgOiBzY29wZS5pc1N0cmluZyhwb2ludGVyLnBvaW50ZXJUeXBlKVxuICAgICAgICAgICAgICAgID8gcG9pbnRlci5wb2ludGVyVHlwZVxuICAgICAgICAgICAgICAgIDogWywsJ3RvdWNoJywgJ3BlbicsICdtb3VzZSddW3BvaW50ZXIucG9pbnRlclR5cGVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ3RhcCcpIHtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5kdCA9IHBvaW50ZXJFdmVudC50aW1lU3RhbXAgLSB0aGlzLmRvd25UaW1lc1twb2ludGVySW5kZXhdO1xuXG4gICAgICAgICAgICBpbnRlcnZhbCA9IHBvaW50ZXJFdmVudC50aW1lU3RhbXAgLSB0aGlzLnRhcFRpbWU7XG4gICAgICAgICAgICBjcmVhdGVOZXdEb3VibGVUYXAgPSAhISh0aGlzLnByZXZUYXAgJiYgdGhpcy5wcmV2VGFwLnR5cGUgIT09ICdkb3VibGV0YXAnXG4gICAgICAgICAgICAmJiB0aGlzLnByZXZUYXAudGFyZ2V0ID09PSBwb2ludGVyRXZlbnQudGFyZ2V0XG4gICAgICAgICAgICAmJiBpbnRlcnZhbCA8IDUwMCk7XG5cbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5kb3VibGUgPSBjcmVhdGVOZXdEb3VibGVUYXA7XG5cbiAgICAgICAgICAgIHRoaXMudGFwVGltZSA9IHBvaW50ZXJFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFyZ2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmN1cnJlbnRUYXJnZXQgPSBlbGVtZW50c1tpXTtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5pbnRlcmFjdGFibGUgPSB0YXJnZXRzW2ldO1xuICAgICAgICAgICAgdGFyZ2V0c1tpXS5maXJlKHBvaW50ZXJFdmVudCk7XG5cbiAgICAgICAgICAgIGlmIChwb2ludGVyRXZlbnQuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkXG4gICAgICAgICAgICAgICAgfHwocG9pbnRlckV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCAmJiBlbGVtZW50c1tpICsgMV0gIT09IHBvaW50ZXJFdmVudC5jdXJyZW50VGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNyZWF0ZU5ld0RvdWJsZVRhcCkge1xuICAgICAgICAgICAgdmFyIGRvdWJsZVRhcCA9IHt9O1xuXG4gICAgICAgICAgICB1dGlscy5leHRlbmQoZG91YmxlVGFwLCBwb2ludGVyRXZlbnQpO1xuXG4gICAgICAgICAgICBkb3VibGVUYXAuZHQgICA9IGludGVydmFsO1xuICAgICAgICAgICAgZG91YmxlVGFwLnR5cGUgPSAnZG91YmxldGFwJztcblxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKGRvdWJsZVRhcCwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG91YmxldGFwJyk7XG5cbiAgICAgICAgICAgIHRoaXMucHJldlRhcCA9IGRvdWJsZVRhcDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChldmVudFR5cGUgPT09ICd0YXAnKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZUYXAgPSBwb2ludGVyRXZlbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdmFsaWRhdGVTZWxlY3RvcjogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBtYXRjaGVzLCBtYXRjaEVsZW1lbnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBtYXRjaGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSBtYXRjaGVzW2ldLFxuICAgICAgICAgICAgICAgIG1hdGNoRWxlbWVudCA9IG1hdGNoRWxlbWVudHNbaV0sXG4gICAgICAgICAgICAgICAgYWN0aW9uID0gdmFsaWRhdGVBY3Rpb24obWF0Y2guZ2V0QWN0aW9uKHBvaW50ZXIsIGV2ZW50LCB0aGlzLCBtYXRjaEVsZW1lbnQpLCBtYXRjaCk7XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb24gJiYgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChtYXRjaCwgbWF0Y2hFbGVtZW50LCBhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBtYXRjaDtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBtYXRjaEVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldFNuYXBwaW5nOiBmdW5jdGlvbiAocGFnZUNvb3Jkcywgc3RhdHVzKSB7XG4gICAgICAgIHZhciBzbmFwID0gdGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnNuYXAsXG4gICAgICAgICAgICB0YXJnZXRzID0gW10sXG4gICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBzdGF0dXMgPSBzdGF0dXMgfHwgdGhpcy5zbmFwU3RhdHVzO1xuXG4gICAgICAgIGlmIChzdGF0dXMudXNlU3RhdHVzWFkpIHtcbiAgICAgICAgICAgIHBhZ2UgPSB7IHg6IHN0YXR1cy54LCB5OiBzdGF0dXMueSB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG9yaWdpbiA9IHNjb3BlLmdldE9yaWdpblhZKHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICBwYWdlID0gdXRpbHMuZXh0ZW5kKHt9LCBwYWdlQ29vcmRzKTtcblxuICAgICAgICAgICAgcGFnZS54IC09IG9yaWdpbi54O1xuICAgICAgICAgICAgcGFnZS55IC09IG9yaWdpbi55O1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzLnJlYWxYID0gcGFnZS54O1xuICAgICAgICBzdGF0dXMucmVhbFkgPSBwYWdlLnk7XG5cbiAgICAgICAgcGFnZS54ID0gcGFnZS54IC0gdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR4O1xuICAgICAgICBwYWdlLnkgPSBwYWdlLnkgLSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHk7XG5cbiAgICAgICAgdmFyIGxlbiA9IHNuYXAudGFyZ2V0cz8gc25hcC50YXJnZXRzLmxlbmd0aCA6IDA7XG5cbiAgICAgICAgZm9yICh2YXIgcmVsSW5kZXggPSAwOyByZWxJbmRleCA8IHRoaXMuc25hcE9mZnNldHMubGVuZ3RoOyByZWxJbmRleCsrKSB7XG4gICAgICAgICAgICB2YXIgcmVsYXRpdmUgPSB7XG4gICAgICAgICAgICAgICAgeDogcGFnZS54IC0gdGhpcy5zbmFwT2Zmc2V0c1tyZWxJbmRleF0ueCxcbiAgICAgICAgICAgICAgICB5OiBwYWdlLnkgLSB0aGlzLnNuYXBPZmZzZXRzW3JlbEluZGV4XS55XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihzbmFwLnRhcmdldHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHNuYXAudGFyZ2V0c1tpXShyZWxhdGl2ZS54LCByZWxhdGl2ZS55LCB0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHNuYXAudGFyZ2V0c1tpXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldCkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogc2NvcGUuaXNOdW1iZXIodGFyZ2V0LngpID8gKHRhcmdldC54ICsgdGhpcy5zbmFwT2Zmc2V0c1tyZWxJbmRleF0ueCkgOiByZWxhdGl2ZS54LFxuICAgICAgICAgICAgICAgICAgICB5OiBzY29wZS5pc051bWJlcih0YXJnZXQueSkgPyAodGFyZ2V0LnkgKyB0aGlzLnNuYXBPZmZzZXRzW3JlbEluZGV4XS55KSA6IHJlbGF0aXZlLnksXG5cbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHNjb3BlLmlzTnVtYmVyKHRhcmdldC5yYW5nZSk/IHRhcmdldC5yYW5nZTogc25hcC5yYW5nZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNsb3Nlc3QgPSB7XG4gICAgICAgICAgICB0YXJnZXQ6IG51bGwsXG4gICAgICAgICAgICBpblJhbmdlOiBmYWxzZSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiAwLFxuICAgICAgICAgICAgcmFuZ2U6IDAsXG4gICAgICAgICAgICBkeDogMCxcbiAgICAgICAgICAgIGR5OiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gdGFyZ2V0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0c1tpXTtcblxuICAgICAgICAgICAgdmFyIHJhbmdlID0gdGFyZ2V0LnJhbmdlLFxuICAgICAgICAgICAgICAgIGR4ID0gdGFyZ2V0LnggLSBwYWdlLngsXG4gICAgICAgICAgICAgICAgZHkgPSB0YXJnZXQueSAtIHBhZ2UueSxcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSA9IHV0aWxzLmh5cG90KGR4LCBkeSksXG4gICAgICAgICAgICAgICAgaW5SYW5nZSA9IGRpc3RhbmNlIDw9IHJhbmdlO1xuXG4gICAgICAgICAgICAvLyBJbmZpbml0ZSB0YXJnZXRzIGNvdW50IGFzIGJlaW5nIG91dCBvZiByYW5nZVxuICAgICAgICAgICAgLy8gY29tcGFyZWQgdG8gbm9uIGluZmluaXRlIG9uZXMgdGhhdCBhcmUgaW4gcmFuZ2VcbiAgICAgICAgICAgIGlmIChyYW5nZSA9PT0gSW5maW5pdHkgJiYgY2xvc2VzdC5pblJhbmdlICYmIGNsb3Nlc3QucmFuZ2UgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgaW5SYW5nZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWNsb3Nlc3QudGFyZ2V0IHx8IChpblJhbmdlXG4gICAgICAgICAgICAgICAgICAgIC8vIGlzIHRoZSBjbG9zZXN0IHRhcmdldCBpbiByYW5nZT9cbiAgICAgICAgICAgICAgICAgICAgPyAoY2xvc2VzdC5pblJhbmdlICYmIHJhbmdlICE9PSBJbmZpbml0eVxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcG9pbnRlciBpcyByZWxhdGl2ZWx5IGRlZXBlciBpbiB0aGlzIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICA/IGRpc3RhbmNlIC8gcmFuZ2UgPCBjbG9zZXN0LmRpc3RhbmNlIC8gY2xvc2VzdC5yYW5nZVxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHRhcmdldCBoYXMgSW5maW5pdGUgcmFuZ2UgYW5kIHRoZSBjbG9zZXN0IGRvZXNuJ3RcbiAgICAgICAgICAgICAgICAgICAgOiAocmFuZ2UgPT09IEluZmluaXR5ICYmIGNsb3Nlc3QucmFuZ2UgIT09IEluZmluaXR5KVxuICAgICAgICAgICAgICAgICAgICAvLyBPUiB0aGlzIHRhcmdldCBpcyBjbG9zZXIgdGhhdCB0aGUgcHJldmlvdXMgY2xvc2VzdFxuICAgICAgICAgICAgICAgIHx8IGRpc3RhbmNlIDwgY2xvc2VzdC5kaXN0YW5jZSlcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG90aGVyIGlzIG5vdCBpbiByYW5nZSBhbmQgdGhlIHBvaW50ZXIgaXMgY2xvc2VyIHRvIHRoaXMgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIDogKCFjbG9zZXN0LmluUmFuZ2UgJiYgZGlzdGFuY2UgPCBjbG9zZXN0LmRpc3RhbmNlKSkpIHtcblxuICAgICAgICAgICAgICAgIGlmIChyYW5nZSA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5SYW5nZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2xvc2VzdC50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5kaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QucmFuZ2UgPSByYW5nZTtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LmluUmFuZ2UgPSBpblJhbmdlO1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QuZHggPSBkeDtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LmR5ID0gZHk7XG5cbiAgICAgICAgICAgICAgICBzdGF0dXMucmFuZ2UgPSByYW5nZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzbmFwQ2hhbmdlZDtcblxuICAgICAgICBpZiAoY2xvc2VzdC50YXJnZXQpIHtcbiAgICAgICAgICAgIHNuYXBDaGFuZ2VkID0gKHN0YXR1cy5zbmFwcGVkWCAhPT0gY2xvc2VzdC50YXJnZXQueCB8fCBzdGF0dXMuc25hcHBlZFkgIT09IGNsb3Nlc3QudGFyZ2V0LnkpO1xuXG4gICAgICAgICAgICBzdGF0dXMuc25hcHBlZFggPSBjbG9zZXN0LnRhcmdldC54O1xuICAgICAgICAgICAgc3RhdHVzLnNuYXBwZWRZID0gY2xvc2VzdC50YXJnZXQueTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNuYXBDaGFuZ2VkID0gdHJ1ZTtcblxuICAgICAgICAgICAgc3RhdHVzLnNuYXBwZWRYID0gTmFOO1xuICAgICAgICAgICAgc3RhdHVzLnNuYXBwZWRZID0gTmFOO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzLmR4ID0gY2xvc2VzdC5keDtcbiAgICAgICAgc3RhdHVzLmR5ID0gY2xvc2VzdC5keTtcblxuICAgICAgICBzdGF0dXMuY2hhbmdlZCA9IChzbmFwQ2hhbmdlZCB8fCAoY2xvc2VzdC5pblJhbmdlICYmICFzdGF0dXMubG9ja2VkKSk7XG4gICAgICAgIHN0YXR1cy5sb2NrZWQgPSBjbG9zZXN0LmluUmFuZ2U7XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgc2V0UmVzdHJpY3Rpb246IGZ1bmN0aW9uIChwYWdlQ29vcmRzLCBzdGF0dXMpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgcmVzdHJpY3QgPSB0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5yZXN0cmljdCxcbiAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gcmVzdHJpY3QgJiYgcmVzdHJpY3QucmVzdHJpY3Rpb24sXG4gICAgICAgICAgICBwYWdlO1xuXG4gICAgICAgIGlmICghcmVzdHJpY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMgPSBzdGF0dXMgfHwgdGhpcy5yZXN0cmljdFN0YXR1cztcblxuICAgICAgICBwYWdlID0gc3RhdHVzLnVzZVN0YXR1c1hZXG4gICAgICAgICAgICA/IHBhZ2UgPSB7IHg6IHN0YXR1cy54LCB5OiBzdGF0dXMueSB9XG4gICAgICAgICAgICA6IHBhZ2UgPSB1dGlscy5leHRlbmQoe30sIHBhZ2VDb29yZHMpO1xuXG4gICAgICAgIGlmIChzdGF0dXMuc25hcCAmJiBzdGF0dXMuc25hcC5sb2NrZWQpIHtcbiAgICAgICAgICAgIHBhZ2UueCArPSBzdGF0dXMuc25hcC5keCB8fCAwO1xuICAgICAgICAgICAgcGFnZS55ICs9IHN0YXR1cy5zbmFwLmR5IHx8IDA7XG4gICAgICAgIH1cblxuICAgICAgICBwYWdlLnggLT0gdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR4O1xuICAgICAgICBwYWdlLnkgLT0gdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR5O1xuXG4gICAgICAgIHN0YXR1cy5keCA9IDA7XG4gICAgICAgIHN0YXR1cy5keSA9IDA7XG4gICAgICAgIHN0YXR1cy5yZXN0cmljdGVkID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIHJlY3QsIHJlc3RyaWN0ZWRYLCByZXN0cmljdGVkWTtcblxuICAgICAgICBpZiAoc2NvcGUuaXNTdHJpbmcocmVzdHJpY3Rpb24pKSB7XG4gICAgICAgICAgICBpZiAocmVzdHJpY3Rpb24gPT09ICdwYXJlbnQnKSB7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSBzY29wZS5wYXJlbnRFbGVtZW50KHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChyZXN0cmljdGlvbiA9PT0gJ3NlbGYnKSB7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSB0YXJnZXQuZ2V0UmVjdCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSBzY29wZS5jbG9zZXN0KHRoaXMuZWxlbWVudCwgcmVzdHJpY3Rpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXJlc3RyaWN0aW9uKSB7IHJldHVybiBzdGF0dXM7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHJlc3RyaWN0aW9uKSkge1xuICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSByZXN0cmljdGlvbihwYWdlLngsIHBhZ2UueSwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlscy5pc0VsZW1lbnQocmVzdHJpY3Rpb24pKSB7XG4gICAgICAgICAgICByZXN0cmljdGlvbiA9IHNjb3BlLmdldEVsZW1lbnRSZWN0KHJlc3RyaWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlY3QgPSByZXN0cmljdGlvbjtcblxuICAgICAgICBpZiAoIXJlc3RyaWN0aW9uKSB7XG4gICAgICAgICAgICByZXN0cmljdGVkWCA9IHBhZ2UueDtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRZID0gcGFnZS55O1xuICAgICAgICB9XG4gICAgICAgIC8vIG9iamVjdCBpcyBhc3N1bWVkIHRvIGhhdmVcbiAgICAgICAgLy8geCwgeSwgd2lkdGgsIGhlaWdodCBvclxuICAgICAgICAvLyBsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b21cbiAgICAgICAgZWxzZSBpZiAoJ3gnIGluIHJlc3RyaWN0aW9uICYmICd5JyBpbiByZXN0cmljdGlvbikge1xuICAgICAgICAgICAgcmVzdHJpY3RlZFggPSBNYXRoLm1heChNYXRoLm1pbihyZWN0LnggKyByZWN0LndpZHRoICAtIHRoaXMucmVzdHJpY3RPZmZzZXQucmlnaHQgLCBwYWdlLngpLCByZWN0LnggKyB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQpO1xuICAgICAgICAgICAgcmVzdHJpY3RlZFkgPSBNYXRoLm1heChNYXRoLm1pbihyZWN0LnkgKyByZWN0LmhlaWdodCAtIHRoaXMucmVzdHJpY3RPZmZzZXQuYm90dG9tLCBwYWdlLnkpLCByZWN0LnkgKyB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdHJpY3RlZFggPSBNYXRoLm1heChNYXRoLm1pbihyZWN0LnJpZ2h0ICAtIHRoaXMucmVzdHJpY3RPZmZzZXQucmlnaHQgLCBwYWdlLngpLCByZWN0LmxlZnQgKyB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQpO1xuICAgICAgICAgICAgcmVzdHJpY3RlZFkgPSBNYXRoLm1heChNYXRoLm1pbihyZWN0LmJvdHRvbSAtIHRoaXMucmVzdHJpY3RPZmZzZXQuYm90dG9tLCBwYWdlLnkpLCByZWN0LnRvcCAgKyB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCApO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzLmR4ID0gcmVzdHJpY3RlZFggLSBwYWdlLng7XG4gICAgICAgIHN0YXR1cy5keSA9IHJlc3RyaWN0ZWRZIC0gcGFnZS55O1xuXG4gICAgICAgIHN0YXR1cy5jaGFuZ2VkID0gc3RhdHVzLnJlc3RyaWN0ZWRYICE9PSByZXN0cmljdGVkWCB8fCBzdGF0dXMucmVzdHJpY3RlZFkgIT09IHJlc3RyaWN0ZWRZO1xuICAgICAgICBzdGF0dXMucmVzdHJpY3RlZCA9ICEhKHN0YXR1cy5keCB8fCBzdGF0dXMuZHkpO1xuXG4gICAgICAgIHN0YXR1cy5yZXN0cmljdGVkWCA9IHJlc3RyaWN0ZWRYO1xuICAgICAgICBzdGF0dXMucmVzdHJpY3RlZFkgPSByZXN0cmljdGVkWTtcblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjaGVja0FuZFByZXZlbnREZWZhdWx0OiBmdW5jdGlvbiAoZXZlbnQsIGludGVyYWN0YWJsZSwgZWxlbWVudCkge1xuICAgICAgICBpZiAoIShpbnRlcmFjdGFibGUgPSBpbnRlcmFjdGFibGUgfHwgdGhpcy50YXJnZXQpKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHZhciBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMsXG4gICAgICAgICAgICBwcmV2ZW50ID0gb3B0aW9ucy5wcmV2ZW50RGVmYXVsdDtcblxuICAgICAgICBpZiAocHJldmVudCA9PT0gJ2F1dG8nICYmIGVsZW1lbnQgJiYgIS9eKGlucHV0fHNlbGVjdHx0ZXh0YXJlYSkkL2kudGVzdChldmVudC50YXJnZXQubm9kZU5hbWUpKSB7XG4gICAgICAgICAgICAvLyBkbyBub3QgcHJldmVudERlZmF1bHQgb24gcG9pbnRlcmRvd24gaWYgdGhlIHByZXBhcmVkIGFjdGlvbiBpcyBhIGRyYWdcbiAgICAgICAgICAgIC8vIGFuZCBkcmFnZ2luZyBjYW4gb25seSBzdGFydCBmcm9tIGEgY2VydGFpbiBkaXJlY3Rpb24gLSB0aGlzIGFsbG93c1xuICAgICAgICAgICAgLy8gYSB0b3VjaCB0byBwYW4gdGhlIHZpZXdwb3J0IGlmIGEgZHJhZyBpc24ndCBpbiB0aGUgcmlnaHQgZGlyZWN0aW9uXG4gICAgICAgICAgICBpZiAoL2Rvd258c3RhcnQvaS50ZXN0KGV2ZW50LnR5cGUpXG4gICAgICAgICAgICAgICAgJiYgdGhpcy5wcmVwYXJlZC5uYW1lID09PSAnZHJhZycgJiYgb3B0aW9ucy5kcmFnLmF4aXMgIT09ICd4eScpIHtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd2l0aCBtYW51YWxTdGFydCwgb25seSBwcmV2ZW50RGVmYXVsdCB3aGlsZSBpbnRlcmFjdGluZ1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXSAmJiBvcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0ubWFudWFsU3RhcnRcbiAgICAgICAgICAgICAgICAmJiAhdGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZXZlbnQgPT09ICdhbHdheXMnKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNhbGNJbmVydGlhOiBmdW5jdGlvbiAoc3RhdHVzKSB7XG4gICAgICAgIHZhciBpbmVydGlhT3B0aW9ucyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLFxuICAgICAgICAgICAgbGFtYmRhID0gaW5lcnRpYU9wdGlvbnMucmVzaXN0YW5jZSxcbiAgICAgICAgICAgIGluZXJ0aWFEdXIgPSAtTWF0aC5sb2coaW5lcnRpYU9wdGlvbnMuZW5kU3BlZWQgLyBzdGF0dXMudjApIC8gbGFtYmRhO1xuXG4gICAgICAgIHN0YXR1cy54MCA9IHRoaXMucHJldkV2ZW50LnBhZ2VYO1xuICAgICAgICBzdGF0dXMueTAgPSB0aGlzLnByZXZFdmVudC5wYWdlWTtcbiAgICAgICAgc3RhdHVzLnQwID0gc3RhdHVzLnN0YXJ0RXZlbnQudGltZVN0YW1wIC8gMTAwMDtcbiAgICAgICAgc3RhdHVzLnN4ID0gc3RhdHVzLnN5ID0gMDtcblxuICAgICAgICBzdGF0dXMubW9kaWZpZWRYZSA9IHN0YXR1cy54ZSA9IChzdGF0dXMudngwIC0gaW5lcnRpYUR1cikgLyBsYW1iZGE7XG4gICAgICAgIHN0YXR1cy5tb2RpZmllZFllID0gc3RhdHVzLnllID0gKHN0YXR1cy52eTAgLSBpbmVydGlhRHVyKSAvIGxhbWJkYTtcbiAgICAgICAgc3RhdHVzLnRlID0gaW5lcnRpYUR1cjtcblxuICAgICAgICBzdGF0dXMubGFtYmRhX3YwID0gbGFtYmRhIC8gc3RhdHVzLnYwO1xuICAgICAgICBzdGF0dXMub25lX3ZlX3YwID0gMSAtIGluZXJ0aWFPcHRpb25zLmVuZFNwZWVkIC8gc3RhdHVzLnYwO1xuICAgIH0sXG5cbiAgICBhdXRvU2Nyb2xsTW92ZTogZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICAgICAgaWYgKCEodGhpcy5pbnRlcmFjdGluZygpXG4gICAgICAgICAgICAmJiBzY29wZS5jaGVja0F1dG9TY3JvbGwodGhpcy50YXJnZXQsIHRoaXMucHJlcGFyZWQubmFtZSkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC54ID0gc2NvcGUuYXV0b1Njcm9sbC55ID0gMDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b3AsXG4gICAgICAgICAgICByaWdodCxcbiAgICAgICAgICAgIGJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICBvcHRpb25zID0gdGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmF1dG9TY3JvbGwsXG4gICAgICAgICAgICBjb250YWluZXIgPSBvcHRpb25zLmNvbnRhaW5lciB8fCBzY29wZS5nZXRXaW5kb3codGhpcy5lbGVtZW50KTtcblxuICAgICAgICBpZiAoc2NvcGUuaXNXaW5kb3coY29udGFpbmVyKSkge1xuICAgICAgICAgICAgbGVmdCAgID0gcG9pbnRlci5jbGllbnRYIDwgc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICB0b3AgICAgPSBwb2ludGVyLmNsaWVudFkgPCBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIHJpZ2h0ICA9IHBvaW50ZXIuY2xpZW50WCA+IGNvbnRhaW5lci5pbm5lcldpZHRoICAtIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgYm90dG9tID0gcG9pbnRlci5jbGllbnRZID4gY29udGFpbmVyLmlubmVySGVpZ2h0IC0gc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgcmVjdCA9IHNjb3BlLmdldEVsZW1lbnRSZWN0KGNvbnRhaW5lcik7XG5cbiAgICAgICAgICAgIGxlZnQgICA9IHBvaW50ZXIuY2xpZW50WCA8IHJlY3QubGVmdCAgICsgc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICB0b3AgICAgPSBwb2ludGVyLmNsaWVudFkgPCByZWN0LnRvcCAgICArIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgcmlnaHQgID0gcG9pbnRlci5jbGllbnRYID4gcmVjdC5yaWdodCAgLSBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIGJvdHRvbSA9IHBvaW50ZXIuY2xpZW50WSA+IHJlY3QuYm90dG9tIC0gc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnggPSAocmlnaHQgPyAxOiBsZWZ0PyAtMTogMCk7XG4gICAgICAgIHNjb3BlLmF1dG9TY3JvbGwueSA9IChib3R0b20/IDE6ICB0b3A/IC0xOiAwKTtcblxuICAgICAgICBpZiAoIXNjb3BlLmF1dG9TY3JvbGwuaXNTY3JvbGxpbmcpIHtcbiAgICAgICAgICAgIC8vIHNldCB0aGUgYXV0b1Njcm9sbCBwcm9wZXJ0aWVzIHRvIHRob3NlIG9mIHRoZSB0YXJnZXRcbiAgICAgICAgICAgIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luID0gb3B0aW9ucy5tYXJnaW47XG4gICAgICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnNwZWVkICA9IG9wdGlvbnMuc3BlZWQ7XG5cbiAgICAgICAgICAgIHNjb3BlLmF1dG9TY3JvbGwuc3RhcnQodGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZUV2ZW50VGFyZ2V0czogZnVuY3Rpb24gKHRhcmdldCwgY3VycmVudFRhcmdldCkge1xuICAgICAgICB0aGlzLl9ldmVudFRhcmdldCAgICA9IHRhcmdldDtcbiAgICAgICAgdGhpcy5fY3VyRXZlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0O1xuICAgIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmFjdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJhZiAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvcmFmJyksXG4gICAgZ2V0V2luZG93ID0gcmVxdWlyZSgnLi91dGlscy93aW5kb3cnKS5nZXRXaW5kb3csXG4gICAgaXNXaW5kb3cgID0gcmVxdWlyZSgnLi91dGlscy9pc1R5cGUnKS5pc1dpbmRvdztcblxudmFyIGF1dG9TY3JvbGwgPSB7XG5cbiAgICBpbnRlcmFjdGlvbjogbnVsbCxcbiAgICBpOiBudWxsLCAgICAvLyB0aGUgaGFuZGxlIHJldHVybmVkIGJ5IHdpbmRvdy5zZXRJbnRlcnZhbFxuICAgIHg6IDAsIHk6IDAsIC8vIERpcmVjdGlvbiBlYWNoIHB1bHNlIGlzIHRvIHNjcm9sbCBpblxuXG4gICAgaXNTY3JvbGxpbmc6IGZhbHNlLFxuICAgIHByZXZUaW1lOiAwLFxuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uIChpbnRlcmFjdGlvbikge1xuICAgICAgICBhdXRvU2Nyb2xsLmlzU2Nyb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgcmFmLmNhbmNlbChhdXRvU2Nyb2xsLmkpO1xuXG4gICAgICAgIGF1dG9TY3JvbGwuaW50ZXJhY3Rpb24gPSBpbnRlcmFjdGlvbjtcbiAgICAgICAgYXV0b1Njcm9sbC5wcmV2VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICBhdXRvU2Nyb2xsLmkgPSByYWYucmVxdWVzdChhdXRvU2Nyb2xsLnNjcm9sbCk7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXV0b1Njcm9sbC5pc1Njcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICByYWYuY2FuY2VsKGF1dG9TY3JvbGwuaSk7XG4gICAgfSxcblxuICAgIC8vIHNjcm9sbCB0aGUgd2luZG93IGJ5IHRoZSB2YWx1ZXMgaW4gc2Nyb2xsLngveVxuICAgIHNjcm9sbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGF1dG9TY3JvbGwuaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnNbYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lXS5hdXRvU2Nyb2xsLFxuICAgICAgICAgICAgY29udGFpbmVyID0gb3B0aW9ucy5jb250YWluZXIgfHwgZ2V0V2luZG93KGF1dG9TY3JvbGwuaW50ZXJhY3Rpb24uZWxlbWVudCksXG4gICAgICAgICAgICBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgICAgIC8vIGNoYW5nZSBpbiB0aW1lIGluIHNlY29uZHNcbiAgICAgICAgICAgIGR0ID0gKG5vdyAtIGF1dG9TY3JvbGwucHJldlRpbWUpIC8gMTAwMCxcbiAgICAgICAgICAgIC8vIGRpc3BsYWNlbWVudFxuICAgICAgICAgICAgcyA9IG9wdGlvbnMuc3BlZWQgKiBkdDtcblxuICAgICAgICBpZiAocyA+PSAxKSB7XG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coY29udGFpbmVyKSkge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5zY3JvbGxCeShhdXRvU2Nyb2xsLnggKiBzLCBhdXRvU2Nyb2xsLnkgKiBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5zY3JvbGxMZWZ0ICs9IGF1dG9TY3JvbGwueCAqIHM7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbFRvcCAgKz0gYXV0b1Njcm9sbC55ICogcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXV0b1Njcm9sbC5wcmV2VGltZSA9IG5vdztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhdXRvU2Nyb2xsLmlzU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICByYWYuY2FuY2VsKGF1dG9TY3JvbGwuaSk7XG4gICAgICAgICAgICBhdXRvU2Nyb2xsLmkgPSByYWYucmVxdWVzdChhdXRvU2Nyb2xsLnNjcm9sbCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGF1dG9TY3JvbGw7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcblxuZnVuY3Rpb24gY2hlY2tSZXNpemVFZGdlIChuYW1lLCB2YWx1ZSwgcGFnZSwgZWxlbWVudCwgaW50ZXJhY3RhYmxlRWxlbWVudCwgcmVjdCwgbWFyZ2luKSB7XG4gICAgLy8gZmFsc2UsICcnLCB1bmRlZmluZWQsIG51bGxcbiAgICBpZiAoIXZhbHVlKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgLy8gdHJ1ZSB2YWx1ZSwgdXNlIHBvaW50ZXIgY29vcmRzIGFuZCBlbGVtZW50IHJlY3RcbiAgICBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAgICAgLy8gaWYgZGltZW5zaW9ucyBhcmUgbmVnYXRpdmUsIFwic3dpdGNoXCIgZWRnZXNcbiAgICAgICAgdmFyIHdpZHRoID0gc2NvcGUuaXNOdW1iZXIocmVjdC53aWR0aCk/IHJlY3Qud2lkdGggOiByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0ID0gc2NvcGUuaXNOdW1iZXIocmVjdC5oZWlnaHQpPyByZWN0LmhlaWdodCA6IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7XG5cbiAgICAgICAgaWYgKHdpZHRoIDwgMCkge1xuICAgICAgICAgICAgaWYgICAgICAobmFtZSA9PT0gJ2xlZnQnICkgeyBuYW1lID0gJ3JpZ2h0JzsgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ3JpZ2h0JykgeyBuYW1lID0gJ2xlZnQnIDsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICBpZiAgICAgIChuYW1lID09PSAndG9wJyAgICkgeyBuYW1lID0gJ2JvdHRvbSc7IH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdib3R0b20nKSB7IG5hbWUgPSAndG9wJyAgIDsgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5hbWUgPT09ICdsZWZ0JyAgKSB7IHJldHVybiBwYWdlLnggPCAoKHdpZHRoICA+PSAwPyByZWN0LmxlZnQ6IHJlY3QucmlnaHQgKSArIG1hcmdpbik7IH1cbiAgICAgICAgaWYgKG5hbWUgPT09ICd0b3AnICAgKSB7IHJldHVybiBwYWdlLnkgPCAoKGhlaWdodCA+PSAwPyByZWN0LnRvcCA6IHJlY3QuYm90dG9tKSArIG1hcmdpbik7IH1cblxuICAgICAgICBpZiAobmFtZSA9PT0gJ3JpZ2h0JyApIHsgcmV0dXJuIHBhZ2UueCA+ICgod2lkdGggID49IDA/IHJlY3QucmlnaHQgOiByZWN0LmxlZnQpIC0gbWFyZ2luKTsgfVxuICAgICAgICBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgcmV0dXJuIHBhZ2UueSA+ICgoaGVpZ2h0ID49IDA/IHJlY3QuYm90dG9tOiByZWN0LnRvcCApIC0gbWFyZ2luKTsgfVxuICAgIH1cblxuICAgIC8vIHRoZSByZW1haW5pbmcgY2hlY2tzIHJlcXVpcmUgYW4gZWxlbWVudFxuICAgIGlmICghdXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgcmV0dXJuIHV0aWxzLmlzRWxlbWVudCh2YWx1ZSlcbiAgICAgICAgLy8gdGhlIHZhbHVlIGlzIGFuIGVsZW1lbnQgdG8gdXNlIGFzIGEgcmVzaXplIGhhbmRsZVxuICAgICAgICA/IHZhbHVlID09PSBlbGVtZW50XG4gICAgICAgIC8vIG90aGVyd2lzZSBjaGVjayBpZiBlbGVtZW50IG1hdGNoZXMgdmFsdWUgYXMgc2VsZWN0b3JcbiAgICAgICAgOiBzY29wZS5tYXRjaGVzVXBUbyhlbGVtZW50LCB2YWx1ZSwgaW50ZXJhY3RhYmxlRWxlbWVudCk7XG59XG5cblxuZnVuY3Rpb24gZGVmYXVsdEFjdGlvbkNoZWNrZXIgKHBvaW50ZXIsIGludGVyYWN0aW9uLCBlbGVtZW50KSB7XG4gICAgdmFyIHJlY3QgPSB0aGlzLmdldFJlY3QoZWxlbWVudCksXG4gICAgICAgIHNob3VsZFJlc2l6ZSA9IGZhbHNlLFxuICAgICAgICBhY3Rpb24sXG4gICAgICAgIHJlc2l6ZUF4ZXMgPSBudWxsLFxuICAgICAgICByZXNpemVFZGdlcyxcbiAgICAgICAgcGFnZSA9IHV0aWxzLmV4dGVuZCh7fSwgaW50ZXJhY3Rpb24uY3VyQ29vcmRzLnBhZ2UpLFxuICAgICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgaWYgKCFyZWN0KSB7IHJldHVybiBudWxsOyB9XG5cbiAgICBpZiAoc2NvcGUuYWN0aW9uSXNFbmFibGVkLnJlc2l6ZSAmJiBvcHRpb25zLnJlc2l6ZS5lbmFibGVkKSB7XG4gICAgICAgIHZhciByZXNpemVPcHRpb25zID0gb3B0aW9ucy5yZXNpemU7XG5cbiAgICAgICAgcmVzaXplRWRnZXMgPSB7XG4gICAgICAgICAgICBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChyZXNpemVPcHRpb25zLmVkZ2VzKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMuZWRnZXNbZWRnZV0sXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLl9ldmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgcmVjdCxcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplT3B0aW9ucy5tYXJnaW4gfHwgc2NvcGUubWFyZ2luKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzaXplRWRnZXMubGVmdCA9IHJlc2l6ZUVkZ2VzLmxlZnQgJiYgIXJlc2l6ZUVkZ2VzLnJpZ2h0O1xuICAgICAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbTtcblxuICAgICAgICAgICAgc2hvdWxkUmVzaXplID0gcmVzaXplRWRnZXMubGVmdCB8fCByZXNpemVFZGdlcy5yaWdodCB8fCByZXNpemVFZGdlcy50b3AgfHwgcmVzaXplRWRnZXMuYm90dG9tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd5JyAmJiBwYWdlLnggPiAocmVjdC5yaWdodCAgLSBzY29wZS5tYXJnaW4pLFxuICAgICAgICAgICAgICAgIGJvdHRvbSA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd4JyAmJiBwYWdlLnkgPiAocmVjdC5ib3R0b20gLSBzY29wZS5tYXJnaW4pO1xuXG4gICAgICAgICAgICBzaG91bGRSZXNpemUgPSByaWdodCB8fCBib3R0b207XG4gICAgICAgICAgICByZXNpemVBeGVzID0gKHJpZ2h0PyAneCcgOiAnJykgKyAoYm90dG9tPyAneScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhY3Rpb24gPSBzaG91bGRSZXNpemVcbiAgICAgICAgPyAncmVzaXplJ1xuICAgICAgICA6IHNjb3BlLmFjdGlvbklzRW5hYmxlZC5kcmFnICYmIG9wdGlvbnMuZHJhZy5lbmFibGVkXG4gICAgICAgID8gJ2RyYWcnXG4gICAgICAgIDogbnVsbDtcblxuICAgIGlmIChzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZ2VzdHVyZVxuICAgICAgICAmJiBpbnRlcmFjdGlvbi5wb2ludGVySWRzLmxlbmd0aCA+PTJcbiAgICAgICAgJiYgIShpbnRlcmFjdGlvbi5kcmFnZ2luZyB8fCBpbnRlcmFjdGlvbi5yZXNpemluZykpIHtcbiAgICAgICAgYWN0aW9uID0gJ2dlc3R1cmUnO1xuICAgIH1cblxuICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IGFjdGlvbixcbiAgICAgICAgICAgIGF4aXM6IHJlc2l6ZUF4ZXMsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0QWN0aW9uQ2hlY2tlcjsiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJhc2U6IHtcbiAgICAgICAgYWNjZXB0ICAgICAgICA6IG51bGwsXG4gICAgICAgIGFjdGlvbkNoZWNrZXIgOiBudWxsLFxuICAgICAgICBzdHlsZUN1cnNvciAgIDogdHJ1ZSxcbiAgICAgICAgcHJldmVudERlZmF1bHQ6ICdhdXRvJyxcbiAgICAgICAgb3JpZ2luICAgICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBkZWx0YVNvdXJjZSAgIDogJ3BhZ2UnLFxuICAgICAgICBhbGxvd0Zyb20gICAgIDogbnVsbCxcbiAgICAgICAgaWdub3JlRnJvbSAgICA6IG51bGwsXG4gICAgICAgIF9jb250ZXh0ICAgICAgOiByZXF1aXJlKCcuL3V0aWxzL2RvbU9iamVjdHMnKS5kb2N1bWVudCxcbiAgICAgICAgZHJvcENoZWNrZXIgICA6IG51bGxcbiAgICB9LFxuXG4gICAgZHJhZzoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgbWFudWFsU3RhcnQ6IHRydWUsXG4gICAgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgIG1heFBlckVsZW1lbnQ6IDEsXG5cbiAgICAgICAgc25hcDogbnVsbCxcbiAgICAgICAgcmVzdHJpY3Q6IG51bGwsXG4gICAgICAgIGluZXJ0aWE6IG51bGwsXG4gICAgICAgIGF1dG9TY3JvbGw6IG51bGwsXG5cbiAgICAgICAgYXhpczogJ3h5J1xuICAgIH0sXG5cbiAgICBkcm9wOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBhY2NlcHQ6IG51bGwsXG4gICAgICAgIG92ZXJsYXA6ICdwb2ludGVyJ1xuICAgIH0sXG5cbiAgICByZXNpemU6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiBudWxsLFxuICAgICAgICByZXN0cmljdDogbnVsbCxcbiAgICAgICAgaW5lcnRpYTogbnVsbCxcbiAgICAgICAgYXV0b1Njcm9sbDogbnVsbCxcblxuICAgICAgICBzcXVhcmU6IGZhbHNlLFxuICAgICAgICBheGlzOiAneHknLFxuXG4gICAgICAgIC8vIHVzZSBkZWZhdWx0IG1hcmdpblxuICAgICAgICBtYXJnaW46IE5hTixcblxuICAgICAgICAvLyBvYmplY3Qgd2l0aCBwcm9wcyBsZWZ0LCByaWdodCwgdG9wLCBib3R0b20gd2hpY2ggYXJlXG4gICAgICAgIC8vIHRydWUvZmFsc2UgdmFsdWVzIHRvIHJlc2l6ZSB3aGVuIHRoZSBwb2ludGVyIGlzIG92ZXIgdGhhdCBlZGdlLFxuICAgICAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgICAgICAvLyBvciB0aGUgRWxlbWVudHMgZm9yIGVhY2ggaGFuZGxlXG4gICAgICAgIGVkZ2VzOiBudWxsLFxuXG4gICAgICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAgICAgLy8gJ25lZ2F0ZScgd2lsbCBhbG93IHRoZSByZWN0IHRvIGhhdmUgbmVnYXRpdmUgd2lkdGgvaGVpZ2h0XG4gICAgICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgICAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgICAgICBpbnZlcnQ6ICdub25lJ1xuICAgIH0sXG5cbiAgICBnZXN0dXJlOiB7XG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgIG1heFBlckVsZW1lbnQ6IDEsXG5cbiAgICAgICAgcmVzdHJpY3Q6IG51bGxcbiAgICB9LFxuXG4gICAgcGVyQWN0aW9uOiB7XG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgZW5kT25seSAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIHJhbmdlICAgICAgIDogSW5maW5pdHksXG4gICAgICAgICAgICB0YXJnZXRzICAgICA6IG51bGwsXG4gICAgICAgICAgICBvZmZzZXRzICAgICA6IG51bGwsXG5cbiAgICAgICAgICAgIHJlbGF0aXZlUG9pbnRzOiBudWxsXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzdHJpY3Q6IHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgZW5kT25seTogZmFsc2VcbiAgICAgICAgfSxcblxuICAgICAgICBhdXRvU2Nyb2xsOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgY29udGFpbmVyICAgOiBudWxsLCAgICAgLy8gdGhlIGl0ZW0gdGhhdCBpcyBzY3JvbGxlZCAoV2luZG93IG9yIEhUTUxFbGVtZW50KVxuICAgICAgICAgICAgbWFyZ2luICAgICAgOiA2MCxcbiAgICAgICAgICAgIHNwZWVkICAgICAgIDogMzAwICAgICAgIC8vIHRoZSBzY3JvbGwgc3BlZWQgaW4gcGl4ZWxzIHBlciBzZWNvbmRcbiAgICAgICAgfSxcblxuICAgICAgICBpbmVydGlhOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICByZXNpc3RhbmNlICAgICAgIDogMTAsICAgIC8vIHRoZSBsYW1iZGEgaW4gZXhwb25lbnRpYWwgZGVjYXlcbiAgICAgICAgICAgIG1pblNwZWVkICAgICAgICAgOiAxMDAsICAgLy8gdGFyZ2V0IHNwZWVkIG11c3QgYmUgYWJvdmUgdGhpcyBmb3IgaW5lcnRpYSB0byBzdGFydFxuICAgICAgICAgICAgZW5kU3BlZWQgICAgICAgICA6IDEwLCAgICAvLyB0aGUgc3BlZWQgYXQgd2hpY2ggaW5lcnRpYSBpcyBzbG93IGVub3VnaCB0byBzdG9wXG4gICAgICAgICAgICBhbGxvd1Jlc3VtZSAgICAgIDogdHJ1ZSwgIC8vIGFsbG93IHJlc3VtaW5nIGFuIGFjdGlvbiBpbiBpbmVydGlhIHBoYXNlXG4gICAgICAgICAgICB6ZXJvUmVzdW1lRGVsdGEgIDogdHJ1ZSwgIC8vIGlmIGFuIGFjdGlvbiBpcyByZXN1bWVkIGFmdGVyIGxhdW5jaCwgc2V0IGR4L2R5IHRvIDBcbiAgICAgICAgICAgIHNtb290aEVuZER1cmF0aW9uOiAzMDAgICAgLy8gYW5pbWF0ZSB0byBzbmFwL3Jlc3RyaWN0IGVuZE9ubHkgaWYgdGhlcmUncyBubyBpbmVydGlhXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2hvbGREdXJhdGlvbjogNjAwXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcbnZhciBicm93c2VyID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgSW50ZXJhY3Rpb24gPSByZXF1aXJlKCcuL0ludGVyYWN0aW9uJyk7XG5cbnZhciBsaXN0ZW5lcnMgPSBzY29wZS5saXN0ZW5lcnM7XG5cbi8vIHtcbi8vICAgICAgdHlwZToge1xuLy8gICAgICAgICAgc2VsZWN0b3JzOiBbJ3NlbGVjdG9yJywgLi4uXSxcbi8vICAgICAgICAgIGNvbnRleHRzIDogW2RvY3VtZW50LCAuLi5dLFxuLy8gICAgICAgICAgbGlzdGVuZXJzOiBbW2xpc3RlbmVyLCB1c2VDYXB0dXJlXSwgLi4uXVxuLy8gICAgICB9XG4vLyAgfVxudmFyIGRlbGVnYXRlZEV2ZW50cyA9IHt9O1xuXG52YXIgaW50ZXJhY3Rpb25MaXN0ZW5lcnMgPSBbXG4gICAgJ2RyYWdTdGFydCcsXG4gICAgJ2RyYWdNb3ZlJyxcbiAgICAncmVzaXplU3RhcnQnLFxuICAgICdyZXNpemVNb3ZlJyxcbiAgICAnZ2VzdHVyZVN0YXJ0JyxcbiAgICAnZ2VzdHVyZU1vdmUnLFxuICAgICdwb2ludGVyT3ZlcicsXG4gICAgJ3BvaW50ZXJPdXQnLFxuICAgICdwb2ludGVySG92ZXInLFxuICAgICdzZWxlY3RvckRvd24nLFxuICAgICdwb2ludGVyRG93bicsXG4gICAgJ3BvaW50ZXJNb3ZlJyxcbiAgICAncG9pbnRlclVwJyxcbiAgICAncG9pbnRlckNhbmNlbCcsXG4gICAgJ3BvaW50ZXJFbmQnLFxuICAgICdhZGRQb2ludGVyJyxcbiAgICAncmVtb3ZlUG9pbnRlcicsXG4gICAgJ3JlY29yZFBvaW50ZXInLFxuICAgICdhdXRvU2Nyb2xsTW92ZSdcbl07XG5cbmZ1bmN0aW9uIGVuZEFsbEludGVyYWN0aW9ucyAoZXZlbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzY29wZS5pbnRlcmFjdGlvbnNbaV0ucG9pbnRlckVuZChldmVudCwgZXZlbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbGlzdGVuVG9Eb2N1bWVudCAoZG9jKSB7XG4gICAgaWYgKHNjb3BlLmNvbnRhaW5zKHNjb3BlLmRvY3VtZW50cywgZG9jKSkgeyByZXR1cm47IH1cblxuICAgIHZhciB3aW4gPSBkb2MuZGVmYXVsdFZpZXcgfHwgZG9jLnBhcmVudFdpbmRvdztcblxuICAgIC8vIGFkZCBkZWxlZ2F0ZSBldmVudCBsaXN0ZW5lclxuICAgIGZvciAodmFyIGV2ZW50VHlwZSBpbiBkZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIGV2ZW50VHlwZSwgZGVsZWdhdGVMaXN0ZW5lcik7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBldmVudFR5cGUsIGRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHNjb3BlLlBvaW50ZXJFdmVudCkge1xuICAgICAgICBpZiAoc2NvcGUuUG9pbnRlckV2ZW50ID09PSB3aW4uTVNQb2ludGVyRXZlbnQpIHtcbiAgICAgICAgICAgIHNjb3BlLnBFdmVudFR5cGVzID0ge1xuICAgICAgICAgICAgICAgIHVwOiAnTVNQb2ludGVyVXAnLCBkb3duOiAnTVNQb2ludGVyRG93bicsIG92ZXI6ICdtb3VzZW92ZXInLFxuICAgICAgICAgICAgICAgIG91dDogJ21vdXNlb3V0JywgbW92ZTogJ01TUG9pbnRlck1vdmUnLCBjYW5jZWw6ICdNU1BvaW50ZXJDYW5jZWwnIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzY29wZS5wRXZlbnRUeXBlcyA9IHtcbiAgICAgICAgICAgICAgICB1cDogJ3BvaW50ZXJ1cCcsIGRvd246ICdwb2ludGVyZG93bicsIG92ZXI6ICdwb2ludGVyb3ZlcicsXG4gICAgICAgICAgICAgICAgb3V0OiAncG9pbnRlcm91dCcsIG1vdmU6ICdwb2ludGVybW92ZScsIGNhbmNlbDogJ3BvaW50ZXJjYW5jZWwnIH07XG4gICAgICAgIH1cblxuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMuZG93biAgLCBsaXN0ZW5lcnMuc2VsZWN0b3JEb3duICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5tb3ZlICAsIGxpc3RlbmVycy5wb2ludGVyTW92ZSAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLm92ZXIgICwgbGlzdGVuZXJzLnBvaW50ZXJPdmVyICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMub3V0ICAgLCBsaXN0ZW5lcnMucG9pbnRlck91dCAgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy51cCAgICAsIGxpc3RlbmVycy5wb2ludGVyVXAgICAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLmNhbmNlbCwgbGlzdGVuZXJzLnBvaW50ZXJDYW5jZWwpO1xuXG4gICAgICAgIC8vIGF1dG9zY3JvbGxcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLm1vdmUsIGxpc3RlbmVycy5hdXRvU2Nyb2xsTW92ZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNlZG93bicsIGxpc3RlbmVycy5zZWxlY3RvckRvd24pO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNlbW92ZScsIGxpc3RlbmVycy5wb2ludGVyTW92ZSApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNldXAnICAsIGxpc3RlbmVycy5wb2ludGVyVXAgICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNlb3ZlcicsIGxpc3RlbmVycy5wb2ludGVyT3ZlciApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNlb3V0JyAsIGxpc3RlbmVycy5wb2ludGVyT3V0ICApO1xuXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAndG91Y2hzdGFydCcgLCBsaXN0ZW5lcnMuc2VsZWN0b3JEb3duICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAndG91Y2htb3ZlJyAgLCBsaXN0ZW5lcnMucG9pbnRlck1vdmUgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAndG91Y2hlbmQnICAgLCBsaXN0ZW5lcnMucG9pbnRlclVwICAgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAndG91Y2hjYW5jZWwnLCBsaXN0ZW5lcnMucG9pbnRlckNhbmNlbCk7XG5cbiAgICAgICAgLy8gYXV0b3Njcm9sbFxuICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNlbW92ZScsIGxpc3RlbmVycy5hdXRvU2Nyb2xsTW92ZSk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAndG91Y2htb3ZlJywgbGlzdGVuZXJzLmF1dG9TY3JvbGxNb3ZlKTtcbiAgICB9XG5cbiAgICBldmVudHMuYWRkKHdpbiwgJ2JsdXInLCBlbmRBbGxJbnRlcmFjdGlvbnMpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHdpbi5mcmFtZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnREb2MgPSB3aW4uZnJhbWVFbGVtZW50Lm93bmVyRG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgcGFyZW50V2luZG93ID0gcGFyZW50RG9jLmRlZmF1bHRWaWV3O1xuXG4gICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudERvYyAgICwgJ21vdXNldXAnICAgICAgLCBsaXN0ZW5lcnMucG9pbnRlckVuZCk7XG4gICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudERvYyAgICwgJ3RvdWNoZW5kJyAgICAgLCBsaXN0ZW5lcnMucG9pbnRlckVuZCk7XG4gICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudERvYyAgICwgJ3RvdWNoY2FuY2VsJyAgLCBsaXN0ZW5lcnMucG9pbnRlckVuZCk7XG4gICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudERvYyAgICwgJ3BvaW50ZXJ1cCcgICAgLCBsaXN0ZW5lcnMucG9pbnRlckVuZCk7XG4gICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudERvYyAgICwgJ01TUG9pbnRlclVwJyAgLCBsaXN0ZW5lcnMucG9pbnRlckVuZCk7XG4gICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudFdpbmRvdywgJ2JsdXInICAgICAgICAgLCBlbmRBbGxJbnRlcmFjdGlvbnMgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICB9XG5cbiAgICBpZiAoZXZlbnRzLnVzZUF0dGFjaEV2ZW50KSB7XG4gICAgICAgIC8vIEZvciBJRSdzIGxhY2sgb2YgRXZlbnQjcHJldmVudERlZmF1bHRcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zWzBdO1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uY3VycmVudEFjdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEZvciBJRSdzIGJhZCBkYmxjbGljayBldmVudCBzZXF1ZW5jZVxuICAgICAgICBldmVudHMuYWRkKGRvYywgJ2RibGNsaWNrJywgZG9PbkludGVyYWN0aW9ucygnaWU4RGJsY2xpY2snKSk7XG4gICAgfVxuXG4gICAgc2NvcGUuZG9jdW1lbnRzLnB1c2goZG9jKTtcbn1cblxuZnVuY3Rpb24gZG9PbkludGVyYWN0aW9ucyAobWV0aG9kKSB7XG4gICAgcmV0dXJuIChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGludGVyYWN0aW9uLFxuICAgICAgICAgICAgZXZlbnRUYXJnZXQgPSBzY29wZS5nZXRBY3R1YWxFbGVtZW50KGV2ZW50LnBhdGhcbiAgICAgICAgICAgICAgICA/IGV2ZW50LnBhdGhbMF1cbiAgICAgICAgICAgICAgICA6IGV2ZW50LnRhcmdldCksXG4gICAgICAgICAgICBjdXJFdmVudFRhcmdldCA9IHNjb3BlLmdldEFjdHVhbEVsZW1lbnQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGlmIChicm93c2VyLnN1cHBvcnRzVG91Y2ggJiYgL3RvdWNoLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICBzY29wZS5wcmV2VG91Y2hUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwb2ludGVyID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG5cbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uRnJvbVBvaW50ZXIocG9pbnRlciwgZXZlbnQudHlwZSwgZXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpbnRlcmFjdGlvbikgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uX3VwZGF0ZUV2ZW50VGFyZ2V0cyhldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25bbWV0aG9kXShwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCAmJiAvbW91c2UvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBpZ25vcmUgbW91c2UgZXZlbnRzIHdoaWxlIHRvdWNoIGludGVyYWN0aW9ucyBhcmUgYWN0aXZlXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNjb3BlLmludGVyYWN0aW9uc1tpXS5tb3VzZSAmJiBzY29wZS5pbnRlcmFjdGlvbnNbaV0ucG9pbnRlcklzRG93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIGlnbm9yZSBtb3VzZSBldmVudHMgdGhhdCBhcmUgc2ltdWxhdGVkIGJ5IHRoZSBicm93c2VyXG4gICAgICAgICAgICAgICAgLy8gYWZ0ZXIgYSB0b3VjaCBldmVudFxuICAgICAgICAgICAgICAgIGlmIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHNjb3BlLnByZXZUb3VjaFRpbWUgPCA1MDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW50ZXJhY3Rpb24gPSBnZXRJbnRlcmFjdGlvbkZyb21Qb2ludGVyKGV2ZW50LCBldmVudC50eXBlLCBldmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgIGlmICghaW50ZXJhY3Rpb24pIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgIGludGVyYWN0aW9uLl91cGRhdGVFdmVudFRhcmdldHMoZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcblxuICAgICAgICAgICAgaW50ZXJhY3Rpb25bbWV0aG9kXShldmVudCwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy8gYm91bmQgdG8gdGhlIGludGVyYWN0YWJsZSBjb250ZXh0IHdoZW4gYSBET00gZXZlbnRcbi8vIGxpc3RlbmVyIGlzIGFkZGVkIHRvIGEgc2VsZWN0b3IgaW50ZXJhY3RhYmxlXG5mdW5jdGlvbiBkZWxlZ2F0ZUxpc3RlbmVyIChldmVudCwgdXNlQ2FwdHVyZSkge1xuICAgIHZhciBmYWtlRXZlbnQgPSB7fSxcbiAgICAgICAgZGVsZWdhdGVkID0gZGVsZWdhdGVkRXZlbnRzW2V2ZW50LnR5cGVdLFxuICAgICAgICBldmVudFRhcmdldCA9IHNjb3BlLmdldEFjdHVhbEVsZW1lbnQoZXZlbnQucGF0aFxuICAgICAgICAgICAgPyBldmVudC5wYXRoWzBdXG4gICAgICAgICAgICA6IGV2ZW50LnRhcmdldCksXG4gICAgICAgIGVsZW1lbnQgPSBldmVudFRhcmdldDtcblxuICAgIHVzZUNhcHR1cmUgPSB1c2VDYXB0dXJlPyB0cnVlOiBmYWxzZTtcblxuICAgIC8vIGR1cGxpY2F0ZSB0aGUgZXZlbnQgc28gdGhhdCBjdXJyZW50VGFyZ2V0IGNhbiBiZSBjaGFuZ2VkXG4gICAgZm9yICh2YXIgcHJvcCBpbiBldmVudCkge1xuICAgICAgICBmYWtlRXZlbnRbcHJvcF0gPSBldmVudFtwcm9wXTtcbiAgICB9XG5cbiAgICBmYWtlRXZlbnQub3JpZ2luYWxFdmVudCA9IGV2ZW50O1xuICAgIGZha2VFdmVudC5wcmV2ZW50RGVmYXVsdCA9IHByZXZlbnRPcmlnaW5hbERlZmF1bHQ7XG5cbiAgICAvLyBjbGltYiB1cCBkb2N1bWVudCB0cmVlIGxvb2tpbmcgZm9yIHNlbGVjdG9yIG1hdGNoZXNcbiAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHNlbGVjdG9yID0gZGVsZWdhdGVkLnNlbGVjdG9yc1tpXSxcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gZGVsZWdhdGVkLmNvbnRleHRzW2ldO1xuXG4gICAgICAgICAgICBpZiAoc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm5vZGVDb250YWlucyhjb250ZXh0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5ub2RlQ29udGFpbnMoY29udGV4dCwgZWxlbWVudCkpIHtcblxuICAgICAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSBkZWxlZ2F0ZWQubGlzdGVuZXJzW2ldO1xuXG4gICAgICAgICAgICAgICAgZmFrZUV2ZW50LmN1cnJlbnRUYXJnZXQgPSBlbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsaXN0ZW5lcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tqXVsxXSA9PT0gdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2pdWzBdKGZha2VFdmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEludGVyYWN0aW9uRnJvbVBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50VHlwZSwgZXZlbnRUYXJnZXQpIHtcbiAgICB2YXIgaSA9IDAsIGxlbiA9IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGgsXG4gICAgICAgIG1vdXNlRXZlbnQgPSAoL21vdXNlL2kudGVzdChwb2ludGVyLnBvaW50ZXJUeXBlIHx8IGV2ZW50VHlwZSlcbiAgICAgICAgICAgIC8vIE1TUG9pbnRlckV2ZW50Lk1TUE9JTlRFUl9UWVBFX01PVVNFXG4gICAgICAgIHx8IHBvaW50ZXIucG9pbnRlclR5cGUgPT09IDQpLFxuICAgICAgICBpbnRlcmFjdGlvbjtcblxuICAgIHZhciBpZCA9IHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKTtcblxuICAgIC8vIHRyeSB0byByZXN1bWUgaW5lcnRpYSB3aXRoIGEgbmV3IHBvaW50ZXJcbiAgICBpZiAoL2Rvd258c3RhcnQvaS50ZXN0KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9uc1tpXTtcblxuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBldmVudFRhcmdldDtcblxuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuYWN0aXZlICYmIGludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zW2ludGVyYWN0aW9uLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEuYWxsb3dSZXN1bWVcbiAgICAgICAgICAgICAgICAmJiAoaW50ZXJhY3Rpb24ubW91c2UgPT09IG1vdXNlRXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIGVsZW1lbnQgaXMgdGhlIGludGVyYWN0aW9uIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT09IGludGVyYWN0aW9uLmVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW50ZXJhY3Rpb24ncyBwb2ludGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyKGludGVyYWN0aW9uLnBvaW50ZXJzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLmFkZFBvaW50ZXIocG9pbnRlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiBpdCdzIGEgbW91c2UgaW50ZXJhY3Rpb25cbiAgICBpZiAobW91c2VFdmVudCB8fCAhKGJyb3dzZXIuc3VwcG9ydHNUb3VjaCB8fCBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50KSkge1xuXG4gICAgICAgIC8vIGZpbmQgYSBtb3VzZSBpbnRlcmFjdGlvbiB0aGF0J3Mgbm90IGluIGluZXJ0aWEgcGhhc2VcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaW50ZXJhY3Rpb25zW2ldLm1vdXNlICYmICFzY29wZS5pbnRlcmFjdGlvbnNbaV0uaW5lcnRpYVN0YXR1cy5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuaW50ZXJhY3Rpb25zW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZmluZCBhbnkgaW50ZXJhY3Rpb24gc3BlY2lmaWNhbGx5IGZvciBtb3VzZS5cbiAgICAgICAgLy8gaWYgdGhlIGV2ZW50VHlwZSBpcyBhIG1vdXNlZG93biwgYW5kIGluZXJ0aWEgaXMgYWN0aXZlXG4gICAgICAgIC8vIGlnbm9yZSB0aGUgaW50ZXJhY3Rpb25cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaW50ZXJhY3Rpb25zW2ldLm1vdXNlICYmICEoL2Rvd24vLnRlc3QoZXZlbnRUeXBlKSAmJiBzY29wZS5pbnRlcmFjdGlvbnNbaV0uaW5lcnRpYVN0YXR1cy5hY3RpdmUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGludGVyYWN0aW9uIGZvciBtb3VzZVxuICAgICAgICBpbnRlcmFjdGlvbiA9IG5ldyBJbnRlcmFjdGlvbigpO1xuICAgICAgICBpbnRlcmFjdGlvbi5tb3VzZSA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgIH1cblxuICAgIC8vIGdldCBpbnRlcmFjdGlvbiB0aGF0IGhhcyB0aGlzIHBvaW50ZXJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKHNjb3BlLmNvbnRhaW5zKHNjb3BlLmludGVyYWN0aW9uc1tpXS5wb2ludGVySWRzLCBpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGlvbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhdCB0aGlzIHN0YWdlLCBhIHBvaW50ZXJVcCBzaG91bGQgbm90IHJldHVybiBhbiBpbnRlcmFjdGlvblxuICAgIGlmICgvdXB8ZW5kfG91dC9pLnRlc3QoZXZlbnRUeXBlKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBnZXQgZmlyc3QgaWRsZSBpbnRlcmFjdGlvblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9uc1tpXTtcblxuICAgICAgICBpZiAoKCFpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lIHx8IChpbnRlcmFjdGlvbi50YXJnZXQub3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQpKVxuICAgICAgICAgICAgJiYgIWludGVyYWN0aW9uLmludGVyYWN0aW5nKClcbiAgICAgICAgICAgICYmICEoIW1vdXNlRXZlbnQgJiYgaW50ZXJhY3Rpb24ubW91c2UpKSB7XG5cbiAgICAgICAgICAgIGludGVyYWN0aW9uLmFkZFBvaW50ZXIocG9pbnRlcik7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgSW50ZXJhY3Rpb24oKTtcbn1cblxuZnVuY3Rpb24gcHJldmVudE9yaWdpbmFsRGVmYXVsdCAoKSB7XG4gICAgdGhpcy5vcmlnaW5hbEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59XG5cbmZ1bmN0aW9uIGRlbGVnYXRlVXNlQ2FwdHVyZSAoZXZlbnQpIHtcbiAgICByZXR1cm4gZGVsZWdhdGVMaXN0ZW5lci5jYWxsKHRoaXMsIGV2ZW50LCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gYmluZEludGVyYWN0aW9uTGlzdGVuZXJzKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBpbnRlcmFjdGlvbkxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgbGlzdGVuZXJOYW1lID0gaW50ZXJhY3Rpb25MaXN0ZW5lcnNbaV07XG5cbiAgICAgICAgbGlzdGVuZXJzW2xpc3RlbmVyTmFtZV0gPSBkb09uSW50ZXJhY3Rpb25zKGxpc3RlbmVyTmFtZSk7XG4gICAgfVxufVxuXG52YXIgbGlzdGVuZXIgPSB7XG4gICAgbGlzdGVuVG9Eb2N1bWVudDogbGlzdGVuVG9Eb2N1bWVudCxcbiAgICBiaW5kSW50ZXJhY3Rpb25MaXN0ZW5lcnM6IGJpbmRJbnRlcmFjdGlvbkxpc3RlbmVycyxcbiAgICBsaXN0ZW5lcnM6IGxpc3RlbmVycyxcbiAgICBkZWxlZ2F0ZWRFdmVudHM6IGRlbGVnYXRlZEV2ZW50cyxcbiAgICBkZWxlZ2F0ZUxpc3RlbmVyOiBkZWxlZ2F0ZUxpc3RlbmVyLFxuICAgIGRlbGVnYXRlVXNlQ2FwdHVyZTogZGVsZWdhdGVVc2VDYXB0dXJlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3RlbmVyOyIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgYnJvd3NlciA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3NlcicpO1xuXG52YXIgc2NvcGUgPSB7fTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL3V0aWxzL2V4dGVuZCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9pc1R5cGUnKTtcblxuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL3dpbmRvdycpKTtcbmV4dGVuZChzY29wZSwgcmVxdWlyZSgnLi91dGlscy9kb21PYmplY3RzJykpO1xuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL2Fyci5qcycpKTtcbmV4dGVuZChzY29wZSwgcmVxdWlyZSgnLi91dGlscy9pc1R5cGUnKSk7XG5cbnNjb3BlLnBFdmVudFR5cGVzID0gbnVsbDtcblxuc2NvcGUuZG9jdW1lbnRzICAgICAgID0gW107ICAgLy8gYWxsIGRvY3VtZW50cyBiZWluZyBsaXN0ZW5lZCB0b1xuXG5zY29wZS5pbnRlcmFjdGFibGVzICAgPSBbXTsgICAvLyBhbGwgc2V0IGludGVyYWN0YWJsZXNcbnNjb3BlLmludGVyYWN0aW9ucyAgICA9IFtdOyAgIC8vIGFsbCBpbnRlcmFjdGlvbnNcblxuc2NvcGUubGlzdGVuZXJzID0ge307XG5cbnNjb3BlLmR5bmFtaWNEcm9wICAgICA9IGZhbHNlO1xuXG5zY29wZS5kZWZhdWx0T3B0aW9ucyA9IHJlcXVpcmUoJy4vZGVmYXVsdE9wdGlvbnMnKTtcblxuLy8gVGhpbmdzIHJlbGF0ZWQgdG8gYXV0b1Njcm9sbFxuc2NvcGUuYXV0b1Njcm9sbCA9IHJlcXVpcmUoJy4vYXV0b1Njcm9sbCcpO1xuXG4vLyBMZXNzIFByZWNpc2lvbiB3aXRoIHRvdWNoIGlucHV0XG5zY29wZS5tYXJnaW4gPSBicm93c2VyLnN1cHBvcnRzVG91Y2ggfHwgYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudD8gMjA6IDEwO1xuXG5zY29wZS5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IDE7XG5cbi8vIGZvciBpZ25vcmluZyBicm93c2VyJ3Mgc2ltdWxhdGVkIG1vdXNlIGV2ZW50c1xuc2NvcGUucHJldlRvdWNoVGltZSA9IDA7XG5cbi8vIEFsbG93IHRoaXMgbWFueSBpbnRlcmFjdGlvbnMgdG8gaGFwcGVuIHNpbXVsdGFuZW91c2x5XG5zY29wZS5tYXhJbnRlcmFjdGlvbnMgPSBJbmZpbml0eTtcblxuc2NvcGUuYWN0aW9uQ3Vyc29ycyA9IGJyb3dzZXIuaXNJZTlPck9sZGVyID8ge1xuICAgIGRyYWcgICAgOiAnbW92ZScsXG4gICAgcmVzaXpleCA6ICdlLXJlc2l6ZScsXG4gICAgcmVzaXpleSA6ICdzLXJlc2l6ZScsXG4gICAgcmVzaXpleHk6ICdzZS1yZXNpemUnLFxuXG4gICAgcmVzaXpldG9wICAgICAgICA6ICduLXJlc2l6ZScsXG4gICAgcmVzaXplbGVmdCAgICAgICA6ICd3LXJlc2l6ZScsXG4gICAgcmVzaXplYm90dG9tICAgICA6ICdzLXJlc2l6ZScsXG4gICAgcmVzaXplcmlnaHQgICAgICA6ICdlLXJlc2l6ZScsXG4gICAgcmVzaXpldG9wbGVmdCAgICA6ICdzZS1yZXNpemUnLFxuICAgIHJlc2l6ZWJvdHRvbXJpZ2h0OiAnc2UtcmVzaXplJyxcbiAgICByZXNpemV0b3ByaWdodCAgIDogJ25lLXJlc2l6ZScsXG4gICAgcmVzaXplYm90dG9tbGVmdCA6ICduZS1yZXNpemUnLFxuXG4gICAgZ2VzdHVyZSA6ICcnXG59IDoge1xuICAgIGRyYWcgICAgOiAnbW92ZScsXG4gICAgcmVzaXpleCA6ICdldy1yZXNpemUnLFxuICAgIHJlc2l6ZXkgOiAnbnMtcmVzaXplJyxcbiAgICByZXNpemV4eTogJ253c2UtcmVzaXplJyxcblxuICAgIHJlc2l6ZXRvcCAgICAgICAgOiAnbnMtcmVzaXplJyxcbiAgICByZXNpemVsZWZ0ICAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgcmVzaXplYm90dG9tICAgICA6ICducy1yZXNpemUnLFxuICAgIHJlc2l6ZXJpZ2h0ICAgICAgOiAnZXctcmVzaXplJyxcbiAgICByZXNpemV0b3BsZWZ0ICAgIDogJ253c2UtcmVzaXplJyxcbiAgICByZXNpemVib3R0b21yaWdodDogJ253c2UtcmVzaXplJyxcbiAgICByZXNpemV0b3ByaWdodCAgIDogJ25lc3ctcmVzaXplJyxcbiAgICByZXNpemVib3R0b21sZWZ0IDogJ25lc3ctcmVzaXplJyxcblxuICAgIGdlc3R1cmUgOiAnJ1xufTtcblxuc2NvcGUuYWN0aW9uSXNFbmFibGVkID0ge1xuICAgIGRyYWcgICA6IHRydWUsXG4gICAgcmVzaXplIDogdHJ1ZSxcbiAgICBnZXN0dXJlOiB0cnVlXG59O1xuXG4vLyBiZWNhdXNlIFdlYmtpdCBhbmQgT3BlcmEgc3RpbGwgdXNlICdtb3VzZXdoZWVsJyBldmVudCB0eXBlXG5zY29wZS53aGVlbEV2ZW50ID0gJ29ubW91c2V3aGVlbCcgaW4gc2NvcGUuZG9jdW1lbnQ/ICdtb3VzZXdoZWVsJzogJ3doZWVsJztcblxuc2NvcGUuZXZlbnRUeXBlcyA9IFtcbiAgICAnZHJhZ3N0YXJ0JyxcbiAgICAnZHJhZ21vdmUnLFxuICAgICdkcmFnaW5lcnRpYXN0YXJ0JyxcbiAgICAnZHJhZ2VuZCcsXG4gICAgJ2RyYWdlbnRlcicsXG4gICAgJ2RyYWdsZWF2ZScsXG4gICAgJ2Ryb3BhY3RpdmF0ZScsXG4gICAgJ2Ryb3BkZWFjdGl2YXRlJyxcbiAgICAnZHJvcG1vdmUnLFxuICAgICdkcm9wJyxcbiAgICAncmVzaXplc3RhcnQnLFxuICAgICdyZXNpemVtb3ZlJyxcbiAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAncmVzaXplZW5kJyxcbiAgICAnZ2VzdHVyZXN0YXJ0JyxcbiAgICAnZ2VzdHVyZW1vdmUnLFxuICAgICdnZXN0dXJlaW5lcnRpYXN0YXJ0JyxcbiAgICAnZ2VzdHVyZWVuZCcsXG5cbiAgICAnZG93bicsXG4gICAgJ21vdmUnLFxuICAgICd1cCcsXG4gICAgJ2NhbmNlbCcsXG4gICAgJ3RhcCcsXG4gICAgJ2RvdWJsZXRhcCcsXG4gICAgJ2hvbGQnXG5dO1xuXG5zY29wZS5nbG9iYWxFdmVudHMgPSB7fTtcblxuLy8gd2lsbCBiZSBwb2x5ZmlsbCBmdW5jdGlvbiBpZiBicm93c2VyIGlzIElFOFxuc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yID0gbnVsbDtcblxuc2NvcGUudHJ5U2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoIXNjb3BlLmlzU3RyaW5nKHZhbHVlKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIC8vIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHJhaXNlZCBpZiBpdCBpcyBpbnZhbGlkXG4gICAgc2NvcGUuZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5zY29wZS5nZXRTY3JvbGxYWSA9IGZ1bmN0aW9uICh3aW4pIHtcbiAgICB3aW4gPSB3aW4gfHwgc2NvcGUud2luZG93O1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHdpbi5zY3JvbGxYIHx8IHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgICAgeTogd2luLnNjcm9sbFkgfHwgd2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICB9O1xufTtcblxuc2NvcGUuZ2V0QWN0dWFsRWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgcmV0dXJuIChlbGVtZW50IGluc3RhbmNlb2Ygc2NvcGUuU1ZHRWxlbWVudEluc3RhbmNlXG4gICAgICAgID8gZWxlbWVudC5jb3JyZXNwb25kaW5nVXNlRWxlbWVudFxuICAgICAgICA6IGVsZW1lbnQpO1xufTtcblxuc2NvcGUuZ2V0RWxlbWVudFJlY3QgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIHZhciBzY3JvbGwgPSBicm93c2VyLmlzSU9TN29yTG93ZXJcbiAgICAgICAgICAgID8geyB4OiAwLCB5OiAwIH1cbiAgICAgICAgICAgIDogc2NvcGUuZ2V0U2Nyb2xsWFkoc2NvcGUuZ2V0V2luZG93KGVsZW1lbnQpKSxcbiAgICAgICAgY2xpZW50UmVjdCA9IChlbGVtZW50IGluc3RhbmNlb2Ygc2NvcGUuU1ZHRWxlbWVudCk/XG4gICAgICAgICAgICBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOlxuICAgICAgICAgICAgZWxlbWVudC5nZXRDbGllbnRSZWN0cygpWzBdO1xuXG4gICAgcmV0dXJuIGNsaWVudFJlY3QgJiYge1xuICAgICAgICAgICAgbGVmdCAgOiBjbGllbnRSZWN0LmxlZnQgICArIHNjcm9sbC54LFxuICAgICAgICAgICAgcmlnaHQgOiBjbGllbnRSZWN0LnJpZ2h0ICArIHNjcm9sbC54LFxuICAgICAgICAgICAgdG9wICAgOiBjbGllbnRSZWN0LnRvcCAgICArIHNjcm9sbC55LFxuICAgICAgICAgICAgYm90dG9tOiBjbGllbnRSZWN0LmJvdHRvbSArIHNjcm9sbC55LFxuICAgICAgICAgICAgd2lkdGggOiBjbGllbnRSZWN0LndpZHRoIHx8IGNsaWVudFJlY3QucmlnaHQgLSBjbGllbnRSZWN0LmxlZnQsXG4gICAgICAgICAgICBoZWlnaHQ6IGNsaWVudFJlY3QuaGVpZ2ggfHwgY2xpZW50UmVjdC5ib3R0b20gLSBjbGllbnRSZWN0LnRvcFxuICAgICAgICB9O1xufTtcblxuc2NvcGUuZ2V0T3JpZ2luWFkgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgdmFyIG9yaWdpbiA9IGludGVyYWN0YWJsZVxuICAgICAgICA/IGludGVyYWN0YWJsZS5vcHRpb25zLm9yaWdpblxuICAgICAgICA6IHNjb3BlLmRlZmF1bHRPcHRpb25zLm9yaWdpbjtcblxuICAgIGlmIChvcmlnaW4gPT09ICdwYXJlbnQnKSB7XG4gICAgICAgIG9yaWdpbiA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG9yaWdpbiA9PT0gJ3NlbGYnKSB7XG4gICAgICAgIG9yaWdpbiA9IGludGVyYWN0YWJsZS5nZXRSZWN0KGVsZW1lbnQpO1xuICAgIH1cbiAgICBlbHNlIGlmIChzY29wZS50cnlTZWxlY3RvcihvcmlnaW4pKSB7XG4gICAgICAgIG9yaWdpbiA9IHNjb3BlLmNsb3Nlc3QoZWxlbWVudCwgb3JpZ2luKSB8fCB7IHg6IDAsIHk6IDAgfTtcbiAgICB9XG5cbiAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihvcmlnaW4pKSB7XG4gICAgICAgIG9yaWdpbiA9IG9yaWdpbihpbnRlcmFjdGFibGUgJiYgZWxlbWVudCk7XG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLmlzRWxlbWVudChvcmlnaW4pKSAge1xuICAgICAgICBvcmlnaW4gPSBzY29wZS5nZXRFbGVtZW50UmVjdChvcmlnaW4pO1xuICAgIH1cblxuICAgIG9yaWdpbi54ID0gKCd4JyBpbiBvcmlnaW4pPyBvcmlnaW4ueCA6IG9yaWdpbi5sZWZ0O1xuICAgIG9yaWdpbi55ID0gKCd5JyBpbiBvcmlnaW4pPyBvcmlnaW4ueSA6IG9yaWdpbi50b3A7XG5cbiAgICByZXR1cm4gb3JpZ2luO1xufTtcblxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTYzNDUyOC8yMjgwODg4XG5zY29wZS5fZ2V0UUJlemllclZhbHVlID0gZnVuY3Rpb24gKHQsIHAxLCBwMiwgcDMpIHtcbiAgICB2YXIgaVQgPSAxIC0gdDtcbiAgICByZXR1cm4gaVQgKiBpVCAqIHAxICsgMiAqIGlUICogdCAqIHAyICsgdCAqIHQgKiBwMztcbn07XG5cbnNjb3BlLmdldFF1YWRyYXRpY0N1cnZlUG9pbnQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGNwWCwgY3BZLCBlbmRYLCBlbmRZLCBwb3NpdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6ICBzY29wZS5fZ2V0UUJlemllclZhbHVlKHBvc2l0aW9uLCBzdGFydFgsIGNwWCwgZW5kWCksXG4gICAgICAgIHk6ICBzY29wZS5fZ2V0UUJlemllclZhbHVlKHBvc2l0aW9uLCBzdGFydFksIGNwWSwgZW5kWSlcbiAgICB9O1xufTtcblxuLy8gaHR0cDovL2dpem1hLmNvbS9lYXNpbmcvXG5zY29wZS5lYXNlT3V0UXVhZCA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkKSB7XG4gICAgdCAvPSBkO1xuICAgIHJldHVybiAtYyAqIHQqKHQtMikgKyBiO1xufTtcblxuc2NvcGUubm9kZUNvbnRhaW5zID0gZnVuY3Rpb24gKHBhcmVudCwgY2hpbGQpIHtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgaWYgKGNoaWxkID09PSBwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hpbGQgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbnNjb3BlLmNsb3Nlc3QgPSBmdW5jdGlvbiAoY2hpbGQsIHNlbGVjdG9yKSB7XG4gICAgdmFyIHBhcmVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoY2hpbGQpO1xuXG4gICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChwYXJlbnQpKSB7XG4gICAgICAgIGlmIChzY29wZS5tYXRjaGVzU2VsZWN0b3IocGFyZW50LCBzZWxlY3RvcikpIHsgcmV0dXJuIHBhcmVudDsgfVxuXG4gICAgICAgIHBhcmVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQocGFyZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn07XG5cbnNjb3BlLnBhcmVudEVsZW1lbnQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cbiAgICBpZiAoc2NvcGUuaXNEb2NGcmFnKHBhcmVudCkpIHtcbiAgICAgICAgLy8gc2tpcCBwYXN0ICNzaGFkby1yb290IGZyYWdtZW50c1xuICAgICAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5ob3N0KSAmJiBzY29wZS5pc0RvY0ZyYWcocGFyZW50KSkge31cblxuICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgIH1cblxuICAgIHJldHVybiBwYXJlbnQ7XG59O1xuXG5zY29wZS5pbkNvbnRleHQgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgcmV0dXJuIGludGVyYWN0YWJsZS5fY29udGV4dCA9PT0gZWxlbWVudC5vd25lckRvY3VtZW50XG4gICAgICAgIHx8IHNjb3BlLm5vZGVDb250YWlucyhpbnRlcmFjdGFibGUuX2NvbnRleHQsIGVsZW1lbnQpO1xufTtcblxuc2NvcGUudGVzdElnbm9yZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZUVsZW1lbnQsIGVsZW1lbnQpIHtcbiAgICB2YXIgaWdub3JlRnJvbSA9IGludGVyYWN0YWJsZS5vcHRpb25zLmlnbm9yZUZyb207XG5cbiAgICBpZiAoIWlnbm9yZUZyb20gfHwgIXV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIGlmIChzY29wZS5pc1N0cmluZyhpZ25vcmVGcm9tKSkge1xuICAgICAgICByZXR1cm4gc2NvcGUubWF0Y2hlc1VwVG8oZWxlbWVudCwgaWdub3JlRnJvbSwgaW50ZXJhY3RhYmxlRWxlbWVudCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHV0aWxzLmlzRWxlbWVudChpZ25vcmVGcm9tKSkge1xuICAgICAgICByZXR1cm4gc2NvcGUubm9kZUNvbnRhaW5zKGlnbm9yZUZyb20sIGVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbnNjb3BlLnRlc3RBbGxvdyA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZUVsZW1lbnQsIGVsZW1lbnQpIHtcbiAgICB2YXIgYWxsb3dGcm9tID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuYWxsb3dGcm9tO1xuXG4gICAgaWYgKCFhbGxvd0Zyb20pIHsgcmV0dXJuIHRydWU7IH1cblxuICAgIGlmICghdXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgaWYgKHNjb3BlLmlzU3RyaW5nKGFsbG93RnJvbSkpIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLm1hdGNoZXNVcFRvKGVsZW1lbnQsIGFsbG93RnJvbSwgaW50ZXJhY3RhYmxlRWxlbWVudCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHV0aWxzLmlzRWxlbWVudChhbGxvd0Zyb20pKSB7XG4gICAgICAgIHJldHVybiBzY29wZS5ub2RlQ29udGFpbnMoYWxsb3dGcm9tLCBlbGVtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5zY29wZS5jaGVja0F4aXMgPSBmdW5jdGlvbiAoYXhpcywgaW50ZXJhY3RhYmxlKSB7XG4gICAgaWYgKCFpbnRlcmFjdGFibGUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICB2YXIgdGhpc0F4aXMgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnLmF4aXM7XG5cbiAgICByZXR1cm4gKGF4aXMgPT09ICd4eScgfHwgdGhpc0F4aXMgPT09ICd4eScgfHwgdGhpc0F4aXMgPT09IGF4aXMpO1xufTtcblxuc2NvcGUuY2hlY2tTbmFwID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgYWN0aW9uKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgIGFjdGlvbiA9ICdyZXNpemUnO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zW2FjdGlvbl0uc25hcCAmJiBvcHRpb25zW2FjdGlvbl0uc25hcC5lbmFibGVkO1xufTtcblxuc2NvcGUuY2hlY2tSZXN0cmljdCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGFjdGlvbikge1xuICAgIHZhciBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnM7XG5cbiAgICBpZiAoL15yZXNpemUvLnRlc3QoYWN0aW9uKSkge1xuICAgICAgICBhY3Rpb24gPSAncmVzaXplJztcbiAgICB9XG5cbiAgICByZXR1cm4gIG9wdGlvbnNbYWN0aW9uXS5yZXN0cmljdCAmJiBvcHRpb25zW2FjdGlvbl0ucmVzdHJpY3QuZW5hYmxlZDtcbn07XG5cbnNjb3BlLmNoZWNrQXV0b1Njcm9sbCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGFjdGlvbikge1xuICAgIHZhciBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnM7XG5cbiAgICBpZiAoL15yZXNpemUvLnRlc3QoYWN0aW9uKSkge1xuICAgICAgICBhY3Rpb24gPSAncmVzaXplJztcbiAgICB9XG5cbiAgICByZXR1cm4gIG9wdGlvbnNbYWN0aW9uXS5hdXRvU2Nyb2xsICYmIG9wdGlvbnNbYWN0aW9uXS5hdXRvU2Nyb2xsLmVuYWJsZWQ7XG59O1xuXG5zY29wZS53aXRoaW5JbnRlcmFjdGlvbkxpbWl0ID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgZWxlbWVudCwgYWN0aW9uKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucyxcbiAgICAgICAgbWF4QWN0aW9ucyA9IG9wdGlvbnNbYWN0aW9uLm5hbWVdLm1heCxcbiAgICAgICAgbWF4UGVyRWxlbWVudCA9IG9wdGlvbnNbYWN0aW9uLm5hbWVdLm1heFBlckVsZW1lbnQsXG4gICAgICAgIGFjdGl2ZUludGVyYWN0aW9ucyA9IDAsXG4gICAgICAgIHRhcmdldENvdW50ID0gMCxcbiAgICAgICAgdGFyZ2V0RWxlbWVudENvdW50ID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBzY29wZS5pbnRlcmFjdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldLFxuICAgICAgICAgICAgb3RoZXJBY3Rpb24gPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLFxuICAgICAgICAgICAgYWN0aXZlID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKTtcblxuICAgICAgICBpZiAoIWFjdGl2ZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIGFjdGl2ZUludGVyYWN0aW9ucysrO1xuXG4gICAgICAgIGlmIChhY3RpdmVJbnRlcmFjdGlvbnMgPj0gc2NvcGUubWF4SW50ZXJhY3Rpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW50ZXJhY3Rpb24udGFyZ2V0ICE9PSBpbnRlcmFjdGFibGUpIHsgY29udGludWU7IH1cblxuICAgICAgICB0YXJnZXRDb3VudCArPSAob3RoZXJBY3Rpb24gPT09IGFjdGlvbi5uYW1lKXwwO1xuXG4gICAgICAgIGlmICh0YXJnZXRDb3VudCA+PSBtYXhBY3Rpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW50ZXJhY3Rpb24uZWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgdGFyZ2V0RWxlbWVudENvdW50Kys7XG5cbiAgICAgICAgICAgIGlmIChvdGhlckFjdGlvbiAhPT0gYWN0aW9uLm5hbWUgfHwgdGFyZ2V0RWxlbWVudENvdW50ID49IG1heFBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2NvcGUubWF4SW50ZXJhY3Rpb25zID4gMDtcbn07XG5cbi8vIFRlc3QgZm9yIHRoZSBlbGVtZW50IHRoYXQncyBcImFib3ZlXCIgYWxsIG90aGVyIHF1YWxpZmllcnNcbnNjb3BlLmluZGV4T2ZEZWVwZXN0RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50cykge1xuICAgIHZhciBkcm9wem9uZSxcbiAgICAgICAgZGVlcGVzdFpvbmUgPSBlbGVtZW50c1swXSxcbiAgICAgICAgaW5kZXggPSBkZWVwZXN0Wm9uZT8gMDogLTEsXG4gICAgICAgIHBhcmVudCxcbiAgICAgICAgZGVlcGVzdFpvbmVQYXJlbnRzID0gW10sXG4gICAgICAgIGRyb3B6b25lUGFyZW50cyA9IFtdLFxuICAgICAgICBjaGlsZCxcbiAgICAgICAgaSxcbiAgICAgICAgbjtcblxuICAgIGZvciAoaSA9IDE7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkcm9wem9uZSA9IGVsZW1lbnRzW2ldO1xuXG4gICAgICAgIC8vIGFuIGVsZW1lbnQgbWlnaHQgYmVsb25nIHRvIG11bHRpcGxlIHNlbGVjdG9yIGRyb3B6b25lc1xuICAgICAgICBpZiAoIWRyb3B6b25lIHx8IGRyb3B6b25lID09PSBkZWVwZXN0Wm9uZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRlZXBlc3Rab25lKSB7XG4gICAgICAgICAgICBkZWVwZXN0Wm9uZSA9IGRyb3B6b25lO1xuICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayBpZiB0aGUgZGVlcGVzdCBvciBjdXJyZW50IGFyZSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgb3IgZG9jdW1lbnQucm9vdEVsZW1lbnRcbiAgICAgICAgLy8gLSBpZiB0aGUgY3VycmVudCBkcm9wem9uZSBpcywgZG8gbm90aGluZyBhbmQgY29udGludWVcbiAgICAgICAgaWYgKGRyb3B6b25lLnBhcmVudE5vZGUgPT09IGRyb3B6b25lLm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIC0gaWYgZGVlcGVzdCBpcywgdXBkYXRlIHdpdGggdGhlIGN1cnJlbnQgZHJvcHpvbmUgYW5kIGNvbnRpbnVlIHRvIG5leHRcbiAgICAgICAgZWxzZSBpZiAoZGVlcGVzdFpvbmUucGFyZW50Tm9kZSA9PT0gZHJvcHpvbmUub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgZGVlcGVzdFpvbmUgPSBkcm9wem9uZTtcbiAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFkZWVwZXN0Wm9uZVBhcmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnQgPSBkZWVwZXN0Wm9uZTtcbiAgICAgICAgICAgIHdoaWxlIChwYXJlbnQucGFyZW50Tm9kZSAmJiBwYXJlbnQucGFyZW50Tm9kZSAhPT0gcGFyZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICBkZWVwZXN0Wm9uZVBhcmVudHMudW5zaGlmdChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhpcyBlbGVtZW50IGlzIGFuIHN2ZyBlbGVtZW50IGFuZCB0aGUgY3VycmVudCBkZWVwZXN0IGlzXG4gICAgICAgIC8vIGFuIEhUTUxFbGVtZW50XG4gICAgICAgIGlmIChkZWVwZXN0Wm9uZSBpbnN0YW5jZW9mIHNjb3BlLkhUTUxFbGVtZW50XG4gICAgICAgICAgICAmJiBkcm9wem9uZSBpbnN0YW5jZW9mIHNjb3BlLlNWR0VsZW1lbnRcbiAgICAgICAgICAgICYmICEoZHJvcHpvbmUgaW5zdGFuY2VvZiBzY29wZS5TVkdTVkdFbGVtZW50KSkge1xuXG4gICAgICAgICAgICBpZiAoZHJvcHpvbmUgPT09IGRlZXBlc3Rab25lLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyZW50ID0gZHJvcHpvbmUub3duZXJTVkdFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50ID0gZHJvcHpvbmU7XG4gICAgICAgIH1cblxuICAgICAgICBkcm9wem9uZVBhcmVudHMgPSBbXTtcblxuICAgICAgICB3aGlsZSAocGFyZW50LnBhcmVudE5vZGUgIT09IHBhcmVudC5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICBkcm9wem9uZVBhcmVudHMudW5zaGlmdChwYXJlbnQpO1xuICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBuID0gMDtcblxuICAgICAgICAvLyBnZXQgKHBvc2l0aW9uIG9mIGxhc3QgY29tbW9uIGFuY2VzdG9yKSArIDFcbiAgICAgICAgd2hpbGUgKGRyb3B6b25lUGFyZW50c1tuXSAmJiBkcm9wem9uZVBhcmVudHNbbl0gPT09IGRlZXBlc3Rab25lUGFyZW50c1tuXSkge1xuICAgICAgICAgICAgbisrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBhcmVudHMgPSBbXG4gICAgICAgICAgICBkcm9wem9uZVBhcmVudHNbbiAtIDFdLFxuICAgICAgICAgICAgZHJvcHpvbmVQYXJlbnRzW25dLFxuICAgICAgICAgICAgZGVlcGVzdFpvbmVQYXJlbnRzW25dXG4gICAgICAgIF07XG5cbiAgICAgICAgY2hpbGQgPSBwYXJlbnRzWzBdLmxhc3RDaGlsZDtcblxuICAgICAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gcGFyZW50c1sxXSkge1xuICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZHJvcHpvbmU7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50cyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjaGlsZCA9PT0gcGFyZW50c1syXSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjaGlsZCA9IGNoaWxkLnByZXZpb3VzU2libGluZztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbmRleDtcbn07XG5cbnNjb3BlLm1hdGNoZXNTZWxlY3RvciA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3Rvciwgbm9kZUxpc3QpIHtcbiAgICBpZiAoc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBzY29wZS5pZThNYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIG5vZGVMaXN0KTtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgL2RlZXAvIGZyb20gc2VsZWN0b3JzIGlmIHNoYWRvd0RPTSBwb2x5ZmlsbCBpcyB1c2VkXG4gICAgaWYgKHNjb3BlLndpbmRvdyAhPT0gc2NvcGUucmVhbFdpbmRvdykge1xuICAgICAgICBzZWxlY3RvciA9IHNlbGVjdG9yLnJlcGxhY2UoL1xcL2RlZXBcXC8vZywgJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlbWVudFticm93c2VyLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yXShzZWxlY3Rvcik7XG59O1xuXG5zY29wZS5tYXRjaGVzVXBUbyA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3RvciwgbGltaXQpIHtcbiAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgIGlmIChzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgICAgIGlmIChlbGVtZW50ID09PSBsaW1pdCkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG4vLyBGb3IgSUU4J3MgbGFjayBvZiBhbiBFbGVtZW50I21hdGNoZXNTZWxlY3RvclxuLy8gdGFrZW4gZnJvbSBodHRwOi8vdGFuYWxpbi5jb20vZW4vYmxvZy8yMDEyLzEyL21hdGNoZXMtc2VsZWN0b3ItaWU4LyBhbmQgbW9kaWZpZWRcbmlmICghKGJyb3dzZXIucHJlZml4ZWRNYXRjaGVzU2VsZWN0b3IgaW4gRWxlbWVudC5wcm90b3R5cGUpIHx8ICFzY29wZS5pc0Z1bmN0aW9uKEVsZW1lbnQucHJvdG90eXBlW2Jyb3dzZXIucHJlZml4ZWRNYXRjaGVzU2VsZWN0b3JdKSkge1xuICAgIHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvciA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3RvciwgZWxlbXMpIHtcbiAgICAgICAgZWxlbXMgPSBlbGVtcyB8fCBlbGVtZW50LnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGVsZW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZWxlbXNbaV0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xufVxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBzY29wZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaW5kZXhPZiAoYXJyYXksIHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoYXJyYXlbaV0gPT09IHRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zIChhcnJheSwgdGFyZ2V0KSB7XG4gICAgcmV0dXJuIGluZGV4T2YoYXJyYXksIHRhcmdldCkgIT09IC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbmRleE9mOiBpbmRleE9mLFxuICAgIGNvbnRhaW5zOiBjb250YWluc1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93JyksXG4gICAgZG9tT2JqZWN0cyA9IHJlcXVpcmUoJy4vZG9tT2JqZWN0cycpO1xuXG52YXIgYnJvd3NlciA9IHtcbiAgICAvLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgdG91Y2ggaW5wdXQ/XG4gICAgc3VwcG9ydHNUb3VjaCA6ICEhKCgnb250b3VjaHN0YXJ0JyBpbiB3aW4pIHx8IHdpbi53aW5kb3cuRG9jdW1lbnRUb3VjaFxuICAgICAgICAmJiBkb21PYmplY3RzLmRvY3VtZW50IGluc3RhbmNlb2Ygd2luLkRvY3VtZW50VG91Y2gpLFxuXG4gICAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IFBvaW50ZXJFdmVudHNcbiAgICBzdXBwb3J0c1BvaW50ZXJFdmVudCA6ICEhZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQsXG5cbiAgICAvLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gICAgaXNPcGVyYU1vYmlsZSA6IChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ09wZXJhJ1xuICAgICAgICAmJiBicm93c2VyLnN1cHBvcnRzVG91Y2hcbiAgICAgICAgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgnUHJlc3RvJykpLFxuXG4gICAgLy8gc2Nyb2xsaW5nIGRvZXNuJ3QgY2hhbmdlIHRoZSByZXN1bHQgb2ZcbiAgICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QvZ2V0Q2xpZW50UmVjdHMgb24gaU9TIDw9NyBidXQgaXQgZG9lcyBvbiBpT1MgOFxuICAgIGlzSU9TN29yTG93ZXIgOiAoL2lQKGhvbmV8b2R8YWQpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkgJiYgL09TIFsxLTddW15cXGRdLy50ZXN0KG5hdmlnYXRvci5hcHBWZXJzaW9uKSksXG5cbiAgICBpc0llOU9yT2xkZXIgOiBkb21PYmplY3RzLmRvY3VtZW50LmFsbCAmJiAhd2luLndpbmRvdy5hdG9iLFxuXG4gICAgLy8gcHJlZml4IG1hdGNoZXNTZWxlY3RvclxuICAgIHByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yOiAnbWF0Y2hlcycgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAnbWF0Y2hlcyc6ICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlP1xuICAgICAgICAgICAgICAgICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InOiAnbW96TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAgICAgJ21vek1hdGNoZXNTZWxlY3Rvcic6ICdvTWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAgICAgICAgICdvTWF0Y2hlc1NlbGVjdG9yJzogJ21zTWF0Y2hlc1NlbGVjdG9yJ1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJyb3dzZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb21PYmplY3RzID0ge30sXG4gICAgd2luID0gcmVxdWlyZSgnLi93aW5kb3cnKS53aW5kb3csXG4gICAgYmxhbmsgPSBmdW5jdGlvbiAoKSB7fTtcblxuZG9tT2JqZWN0cy5kb2N1bWVudCAgICAgICAgICAgPSB3aW4uZG9jdW1lbnQ7XG5kb21PYmplY3RzLkRvY3VtZW50RnJhZ21lbnQgICA9IHdpbi5Eb2N1bWVudEZyYWdtZW50ICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR0VsZW1lbnQgICAgICAgICA9IHdpbi5TVkdFbGVtZW50ICAgICAgICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR1NWR0VsZW1lbnQgICAgICA9IHdpbi5TVkdTVkdFbGVtZW50ICAgICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR0VsZW1lbnRJbnN0YW5jZSA9IHdpbi5TVkdFbGVtZW50SW5zdGFuY2UgfHwgYmxhbms7XG5kb21PYmplY3RzLkhUTUxFbGVtZW50ICAgICAgICA9IHdpbi5IVE1MRWxlbWVudCAgICAgICAgfHwgd2luLkVsZW1lbnQ7XG5cbmRvbU9iamVjdHMuUG9pbnRlckV2ZW50ID0gKHdpbi5Qb2ludGVyRXZlbnQgfHwgd2luLk1TUG9pbnRlckV2ZW50KTtcblxubW9kdWxlLmV4cG9ydHMgPSBkb21PYmplY3RzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXJyID0gcmVxdWlyZSgnLi9hcnInKSxcbiAgICBpbmRleE9mICA9IGFyci5pbmRleE9mLFxuICAgIGNvbnRhaW5zID0gYXJyLmNvbnRhaW5zLFxuICAgIGdldFdpbmRvdyA9IHJlcXVpcmUoJy4vd2luZG93JykuZ2V0V2luZG93LFxuXG4gICAgdXNlQXR0YWNoRXZlbnQgPSAoJ2F0dGFjaEV2ZW50JyBpbiB3aW5kb3cpICYmICEoJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyksXG4gICAgYWRkRXZlbnQgICAgICAgPSB1c2VBdHRhY2hFdmVudD8gICdhdHRhY2hFdmVudCc6ICdhZGRFdmVudExpc3RlbmVyJyxcbiAgICByZW1vdmVFdmVudCAgICA9IHVzZUF0dGFjaEV2ZW50PyAgJ2RldGFjaEV2ZW50JzogJ3JlbW92ZUV2ZW50TGlzdGVuZXInLFxuICAgIG9uICAgICAgICAgICAgID0gdXNlQXR0YWNoRXZlbnQ/ICdvbic6ICcnLFxuXG4gICAgZWxlbWVudHMgICAgICAgICAgPSBbXSxcbiAgICB0YXJnZXRzICAgICAgICAgICA9IFtdLFxuICAgIGF0dGFjaGVkTGlzdGVuZXJzID0gW107XG5cbmZ1bmN0aW9uIGFkZCAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICB2YXIgZWxlbWVudEluZGV4ID0gaW5kZXhPZihlbGVtZW50cywgZWxlbWVudCksXG4gICAgICAgIHRhcmdldCA9IHRhcmdldHNbZWxlbWVudEluZGV4XTtcblxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHRhcmdldCA9IHtcbiAgICAgICAgICAgIGV2ZW50czoge30sXG4gICAgICAgICAgICB0eXBlQ291bnQ6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBlbGVtZW50SW5kZXggPSBlbGVtZW50cy5wdXNoKGVsZW1lbnQpIC0gMTtcbiAgICAgICAgdGFyZ2V0cy5wdXNoKHRhcmdldCk7XG5cbiAgICAgICAgYXR0YWNoZWRMaXN0ZW5lcnMucHVzaCgodXNlQXR0YWNoRXZlbnQgPyB7XG4gICAgICAgICAgICAgICAgc3VwcGxpZWQ6IFtdLFxuICAgICAgICAgICAgICAgIHdyYXBwZWQgOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VDb3VudDogW11cbiAgICAgICAgICAgIH0gOiBudWxsKSk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXQuZXZlbnRzW3R5cGVdKSB7XG4gICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0gPSBbXTtcbiAgICAgICAgdGFyZ2V0LnR5cGVDb3VudCsrO1xuICAgIH1cblxuICAgIGlmICghY29udGFpbnModGFyZ2V0LmV2ZW50c1t0eXBlXSwgbGlzdGVuZXIpKSB7XG4gICAgICAgIHZhciByZXQ7XG5cbiAgICAgICAgaWYgKHVzZUF0dGFjaEV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gYXR0YWNoZWRMaXN0ZW5lcnNbZWxlbWVudEluZGV4XSxcbiAgICAgICAgICAgICAgICBsaXN0ZW5lckluZGV4ID0gaW5kZXhPZihsaXN0ZW5lcnMuc3VwcGxpZWQsIGxpc3RlbmVyKTtcblxuICAgICAgICAgICAgdmFyIHdyYXBwZWQgPSBsaXN0ZW5lcnMud3JhcHBlZFtsaXN0ZW5lckluZGV4XSB8fCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBldmVudC5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0IHx8IHByZXZlbnREZWY7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IGV2ZW50LnN0b3BQcm9wYWdhdGlvbiB8fCBzdG9wUHJvcDtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIHx8IHN0b3BJbW1Qcm9wO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICgvbW91c2V8Y2xpY2svLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYID0gZXZlbnQuY2xpZW50WCArIGdldFdpbmRvdyhlbGVtZW50KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZID0gZXZlbnQuY2xpZW50WSArIGdldFdpbmRvdyhlbGVtZW50KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldCA9IGVsZW1lbnRbYWRkRXZlbnRdKG9uICsgdHlwZSwgd3JhcHBlZCwgISF1c2VDYXB0dXJlKTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVySW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnN1cHBsaWVkLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy53cmFwcGVkLnB1c2god3JhcHBlZCk7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnVzZUNvdW50LnB1c2goMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IGVsZW1lbnRbYWRkRXZlbnRdKHR5cGUsIGxpc3RlbmVyLCAhIXVzZUNhcHR1cmUpO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZSAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICB2YXIgaSxcbiAgICAgICAgZWxlbWVudEluZGV4ID0gaW5kZXhPZihlbGVtZW50cywgZWxlbWVudCksXG4gICAgICAgIHRhcmdldCA9IHRhcmdldHNbZWxlbWVudEluZGV4XSxcbiAgICAgICAgbGlzdGVuZXJzLFxuICAgICAgICBsaXN0ZW5lckluZGV4LFxuICAgICAgICB3cmFwcGVkID0gbGlzdGVuZXI7XG5cbiAgICBpZiAoIXRhcmdldCB8fCAhdGFyZ2V0LmV2ZW50cykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHVzZUF0dGFjaEV2ZW50KSB7XG4gICAgICAgIGxpc3RlbmVycyA9IGF0dGFjaGVkTGlzdGVuZXJzW2VsZW1lbnRJbmRleF07XG4gICAgICAgIGxpc3RlbmVySW5kZXggPSBpbmRleE9mKGxpc3RlbmVycy5zdXBwbGllZCwgbGlzdGVuZXIpO1xuICAgICAgICB3cmFwcGVkID0gbGlzdGVuZXJzLndyYXBwZWRbbGlzdGVuZXJJbmRleF07XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICdhbGwnKSB7XG4gICAgICAgIGZvciAodHlwZSBpbiB0YXJnZXQuZXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAodGFyZ2V0LmV2ZW50cy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZShlbGVtZW50LCB0eXBlLCAnYWxsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXQuZXZlbnRzW3R5cGVdKSB7XG4gICAgICAgIHZhciBsZW4gPSB0YXJnZXQuZXZlbnRzW3R5cGVdLmxlbmd0aDtcblxuICAgICAgICBpZiAobGlzdGVuZXIgPT09ICdhbGwnKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZW1vdmUoZWxlbWVudCwgdHlwZSwgdGFyZ2V0LmV2ZW50c1t0eXBlXVtpXSwgISF1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuZXZlbnRzW3R5cGVdW2ldID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50W3JlbW92ZUV2ZW50XShvbiArIHR5cGUsIHdyYXBwZWQsICEhdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0uc3BsaWNlKGksIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VBdHRhY2hFdmVudCAmJiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy51c2VDb3VudFtsaXN0ZW5lckluZGV4XS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVycy51c2VDb3VudFtsaXN0ZW5lckluZGV4XSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zdXBwbGllZC5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLndyYXBwZWQuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy51c2VDb3VudC5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0LmV2ZW50c1t0eXBlXSAmJiB0YXJnZXQuZXZlbnRzW3R5cGVdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGFyZ2V0LmV2ZW50c1t0eXBlXSA9IG51bGw7XG4gICAgICAgICAgICB0YXJnZXQudHlwZUNvdW50LS07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRhcmdldC50eXBlQ291bnQpIHtcbiAgICAgICAgdGFyZ2V0cy5zcGxpY2UoZWxlbWVudEluZGV4LCAxKTtcbiAgICAgICAgZWxlbWVudHMuc3BsaWNlKGVsZW1lbnRJbmRleCwgMSk7XG4gICAgICAgIGF0dGFjaGVkTGlzdGVuZXJzLnNwbGljZShlbGVtZW50SW5kZXgsIDEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJldmVudERlZiAoKSB7XG4gICAgdGhpcy5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBzdG9wUHJvcCAoKSB7XG4gICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBzdG9wSW1tUHJvcCAoKSB7XG4gICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgIHRoaXMuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmUsXG4gICAgdXNlQXR0YWNoRXZlbnQ6IHVzZUF0dGFjaEV2ZW50LFxuXG4gICAgX2VsZW1lbnRzOiBlbGVtZW50cyxcbiAgICBfdGFyZ2V0czogdGFyZ2V0cyxcbiAgICBfYXR0YWNoZWRMaXN0ZW5lcnM6IGF0dGFjaGVkTGlzdGVuZXJzXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCAoZGVzdCwgc291cmNlKSB7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgZGVzdFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGh5cG90ICh4LCB5KSB7IHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSk7IH07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IG1vZHVsZS5leHBvcnRzLFxuICAgIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyksXG4gICAgd2luID0gcmVxdWlyZSgnLi93aW5kb3cnKTtcblxudXRpbHMuYmxhbmsgID0gZnVuY3Rpb24gKCkge307XG5cbnV0aWxzLndhcm5PbmNlID0gZnVuY3Rpb24gKG1ldGhvZCwgbWVzc2FnZSkge1xuICAgIHZhciB3YXJuZWQgPSBmYWxzZTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2FybmVkKSB7XG4gICAgICAgICAgICB3aW4ud2luZG93LmNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn07XG5cbnV0aWxzLmV4dGVuZCAgPSBleHRlbmQ7XG51dGlscy5oeXBvdCAgID0gcmVxdWlyZSgnLi9oeXBvdCcpO1xudXRpbHMucmFmICAgICA9IHJlcXVpcmUoJy4vcmFmJyk7XG51dGlscy5icm93c2VyID0gcmVxdWlyZSgnLi9icm93c2VyJyk7XG5cbmV4dGVuZCh1dGlscywgcmVxdWlyZSgnLi9hcnInKSk7XG5leHRlbmQodXRpbHMsIHJlcXVpcmUoJy4vaXNUeXBlJykpO1xuZXh0ZW5kKHV0aWxzLCByZXF1aXJlKCcuL3BvaW50ZXJVdGlscycpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93JyksXG4gICAgZG9tT2JqZWN0cyA9IHJlcXVpcmUoJy4vZG9tT2JqZWN0cycpO1xuXG52YXIgaXNUeXBlID0ge1xuICAgIGlzRWxlbWVudCA6IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIGlmICghbyB8fCAodHlwZW9mIG8gIT09ICdvYmplY3QnKSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICBcbiAgICAgICAgdmFyIF93aW5kb3cgPSB3aW4uZ2V0V2luZG93KG8pIHx8IHdpbi53aW5kb3c7XG4gICAgXG4gICAgICAgIHJldHVybiAoL29iamVjdHxmdW5jdGlvbi8udGVzdCh0eXBlb2YgX3dpbmRvdy5FbGVtZW50KVxuICAgICAgICAgICAgPyBvIGluc3RhbmNlb2YgX3dpbmRvdy5FbGVtZW50IC8vRE9NMlxuICAgICAgICAgICAgOiBvLm5vZGVUeXBlID09PSAxICYmIHR5cGVvZiBvLm5vZGVOYW1lID09PSBcInN0cmluZ1wiKTtcbiAgICB9LFxuXG4gICAgaXNBcnJheSAgICA6IG51bGwsXG4gICAgXG4gICAgaXNXaW5kb3cgICA6IHJlcXVpcmUoJy4vaXNXaW5kb3cnKSxcblxuICAgIGlzRG9jRnJhZyAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuICEhdGhpbmcgJiYgdGhpbmcgaW5zdGFuY2VvZiBkb21PYmplY3RzLkRvY3VtZW50RnJhZ21lbnQ7IH0sXG5cbiAgICBpc09iamVjdCAgIDogZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiAhIXRoaW5nICYmICh0eXBlb2YgdGhpbmcgPT09ICdvYmplY3QnKTsgfSxcblxuICAgIGlzRnVuY3Rpb24gOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJzsgfSxcblxuICAgIGlzTnVtYmVyICAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ251bWJlcicgIDsgfSxcblxuICAgIGlzQm9vbCAgICAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Jvb2xlYW4nIDsgfSxcblxuICAgIGlzU3RyaW5nICAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ3N0cmluZycgIDsgfVxuICAgIFxufTtcblxuaXNUeXBlLmlzQXJyYXkgPSBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gaXNUeXBlLmlzT2JqZWN0KHRoaW5nKVxuICAgICAgICAmJiAodHlwZW9mIHRoaW5nLmxlbmd0aCAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICYmIGlzVHlwZS5pc0Z1bmN0aW9uKHRoaW5nLnNwbGljZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVHlwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1dpbmRvdyAodGhpbmcpIHtcbiAgICByZXR1cm4gISEodGhpbmcgJiYgdGhpbmcuV2luZG93KSAmJiAodGhpbmcgaW5zdGFuY2VvZiB0aGluZy5XaW5kb3cpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHBvaW50ZXJVdGlscyA9IHt9LFxuICAgIC8vIHJlZHVjZSBvYmplY3QgY3JlYXRpb24gaW4gZ2V0WFkoKVxuICAgIHRtcFhZID0ge30sXG4gICAgd2luID0gcmVxdWlyZSgnLi93aW5kb3cnKSxcbiAgICBoeXBvdCA9IHJlcXVpcmUoJy4vaHlwb3QnKSxcbiAgICBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpLFxuICAgIGJyb3dzZXIgPSByZXF1aXJlKCcuL2Jyb3dzZXInKSxcbiAgICBpc1R5cGUgPSByZXF1aXJlKCcuL2lzVHlwZScpLFxuICAgIEludGVyYWN0RXZlbnQgPSByZXF1aXJlKCcuLi9JbnRlcmFjdEV2ZW50Jyk7XG5cbnBvaW50ZXJVdGlscy5jb3B5Q29vcmRzID0gZnVuY3Rpb24gKGRlc3QsIHNyYykge1xuICAgIGRlc3QucGFnZSA9IGRlc3QucGFnZSB8fCB7fTtcbiAgICBkZXN0LnBhZ2UueCA9IHNyYy5wYWdlLng7XG4gICAgZGVzdC5wYWdlLnkgPSBzcmMucGFnZS55O1xuXG4gICAgZGVzdC5jbGllbnQgPSBkZXN0LmNsaWVudCB8fCB7fTtcbiAgICBkZXN0LmNsaWVudC54ID0gc3JjLmNsaWVudC54O1xuICAgIGRlc3QuY2xpZW50LnkgPSBzcmMuY2xpZW50Lnk7XG5cbiAgICBkZXN0LnRpbWVTdGFtcCA9IHNyYy50aW1lU3RhbXA7XG59O1xuXG5wb2ludGVyVXRpbHMuc2V0RXZlbnRYWSA9IGZ1bmN0aW9uICh0YXJnZXRPYmosIHBvaW50ZXIsIGludGVyYWN0aW9uKSB7XG4gICAgaWYgKCFwb2ludGVyKSB7XG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVySWRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyVXRpbHMudG91Y2hBdmVyYWdlKGludGVyYWN0aW9uLnBvaW50ZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvaW50ZXIgPSBpbnRlcmFjdGlvbi5wb2ludGVyc1swXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBvaW50ZXJVdGlscy5nZXRQYWdlWFkocG9pbnRlciwgdG1wWFksIGludGVyYWN0aW9uKTtcbiAgICB0YXJnZXRPYmoucGFnZS54ID0gdG1wWFkueDtcbiAgICB0YXJnZXRPYmoucGFnZS55ID0gdG1wWFkueTtcblxuICAgIHBvaW50ZXJVdGlscy5nZXRDbGllbnRYWShwb2ludGVyLCB0bXBYWSwgaW50ZXJhY3Rpb24pO1xuICAgIHRhcmdldE9iai5jbGllbnQueCA9IHRtcFhZLng7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC55ID0gdG1wWFkueTtcblxuICAgIHRhcmdldE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG5cbnBvaW50ZXJVdGlscy5zZXRFdmVudERlbHRhcyA9IGZ1bmN0aW9uICh0YXJnZXRPYmosIHByZXYsIGN1cikge1xuICAgIHRhcmdldE9iai5wYWdlLnggICAgID0gY3VyLnBhZ2UueCAgICAgIC0gcHJldi5wYWdlLng7XG4gICAgdGFyZ2V0T2JqLnBhZ2UueSAgICAgPSBjdXIucGFnZS55ICAgICAgLSBwcmV2LnBhZ2UueTtcbiAgICB0YXJnZXRPYmouY2xpZW50LnggICA9IGN1ci5jbGllbnQueCAgICAtIHByZXYuY2xpZW50Lng7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC55ICAgPSBjdXIuY2xpZW50LnkgICAgLSBwcmV2LmNsaWVudC55O1xuICAgIHRhcmdldE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHByZXYudGltZVN0YW1wO1xuXG4gICAgLy8gc2V0IHBvaW50ZXIgdmVsb2NpdHlcbiAgICB2YXIgZHQgPSBNYXRoLm1heCh0YXJnZXRPYmoudGltZVN0YW1wIC8gMTAwMCwgMC4wMDEpO1xuICAgIHRhcmdldE9iai5wYWdlLnNwZWVkICAgPSBoeXBvdCh0YXJnZXRPYmoucGFnZS54LCB0YXJnZXRPYmoucGFnZS55KSAvIGR0O1xuICAgIHRhcmdldE9iai5wYWdlLnZ4ICAgICAgPSB0YXJnZXRPYmoucGFnZS54IC8gZHQ7XG4gICAgdGFyZ2V0T2JqLnBhZ2UudnkgICAgICA9IHRhcmdldE9iai5wYWdlLnkgLyBkdDtcblxuICAgIHRhcmdldE9iai5jbGllbnQuc3BlZWQgPSBoeXBvdCh0YXJnZXRPYmouY2xpZW50LngsIHRhcmdldE9iai5wYWdlLnkpIC8gZHQ7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC52eCAgICA9IHRhcmdldE9iai5jbGllbnQueCAvIGR0O1xuICAgIHRhcmdldE9iai5jbGllbnQudnkgICAgPSB0YXJnZXRPYmouY2xpZW50LnkgLyBkdDtcbn07XG5cbi8vIEdldCBzcGVjaWZpZWQgWC9ZIGNvb3JkcyBmb3IgbW91c2Ugb3IgZXZlbnQudG91Y2hlc1swXVxucG9pbnRlclV0aWxzLmdldFhZID0gZnVuY3Rpb24gKHR5cGUsIHBvaW50ZXIsIHh5KSB7XG4gICAgeHkgPSB4eSB8fCB7fTtcbiAgICB0eXBlID0gdHlwZSB8fCAncGFnZSc7XG5cbiAgICB4eS54ID0gcG9pbnRlclt0eXBlICsgJ1gnXTtcbiAgICB4eS55ID0gcG9pbnRlclt0eXBlICsgJ1knXTtcblxuICAgIHJldHVybiB4eTtcbn07XG5cbnBvaW50ZXJVdGlscy5nZXRQYWdlWFkgPSBmdW5jdGlvbiAocG9pbnRlciwgcGFnZSwgaW50ZXJhY3Rpb24pIHtcbiAgICBwYWdlID0gcGFnZSB8fCB7fTtcblxuICAgIGlmIChwb2ludGVyIGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICBpZiAoL2luZXJ0aWFzdGFydC8udGVzdChwb2ludGVyLnR5cGUpKSB7XG4gICAgICAgICAgICBpbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uIHx8IHBvaW50ZXIuaW50ZXJhY3Rpb247XG5cbiAgICAgICAgICAgIGV4dGVuZChwYWdlLCBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnVwQ29vcmRzLnBhZ2UpO1xuXG4gICAgICAgICAgICBwYWdlLnggKz0gaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5zeDtcbiAgICAgICAgICAgIHBhZ2UueSArPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnN5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFnZS54ID0gcG9pbnRlci5wYWdlWDtcbiAgICAgICAgICAgIHBhZ2UueSA9IHBvaW50ZXIucGFnZVk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gT3BlcmEgTW9iaWxlIGhhbmRsZXMgdGhlIHZpZXdwb3J0IGFuZCBzY3JvbGxpbmcgb2RkbHlcbiAgICBlbHNlIGlmIChicm93c2VyLmlzT3BlcmFNb2JpbGUpIHtcbiAgICAgICAgcG9pbnRlclV0aWxzLmdldFhZKCdzY3JlZW4nLCBwb2ludGVyLCBwYWdlKTtcblxuICAgICAgICBwYWdlLnggKz0gd2luLndpbmRvdy5zY3JvbGxYO1xuICAgICAgICBwYWdlLnkgKz0gd2luLndpbmRvdy5zY3JvbGxZO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcG9pbnRlclV0aWxzLmdldFhZKCdwYWdlJywgcG9pbnRlciwgcGFnZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZ2U7XG59O1xuXG5wb2ludGVyVXRpbHMuZ2V0Q2xpZW50WFkgPSBmdW5jdGlvbiAocG9pbnRlciwgY2xpZW50LCBpbnRlcmFjdGlvbikge1xuICAgIGNsaWVudCA9IGNsaWVudCB8fCB7fTtcblxuICAgIGlmIChwb2ludGVyIGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICBpZiAoL2luZXJ0aWFzdGFydC8udGVzdChwb2ludGVyLnR5cGUpKSB7XG4gICAgICAgICAgICBleHRlbmQoY2xpZW50LCBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnVwQ29vcmRzLmNsaWVudCk7XG5cbiAgICAgICAgICAgIGNsaWVudC54ICs9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuc3g7XG4gICAgICAgICAgICBjbGllbnQueSArPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnN5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2xpZW50LnggPSBwb2ludGVyLmNsaWVudFg7XG4gICAgICAgICAgICBjbGllbnQueSA9IHBvaW50ZXIuY2xpZW50WTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gT3BlcmEgTW9iaWxlIGhhbmRsZXMgdGhlIHZpZXdwb3J0IGFuZCBzY3JvbGxpbmcgb2RkbHlcbiAgICAgICAgcG9pbnRlclV0aWxzLmdldFhZKGJyb3dzZXIuaXNPcGVyYU1vYmlsZT8gJ3NjcmVlbic6ICdjbGllbnQnLCBwb2ludGVyLCBjbGllbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBjbGllbnQ7XG59O1xuXG5wb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkID0gZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICByZXR1cm4gaXNUeXBlLmlzTnVtYmVyKHBvaW50ZXIucG9pbnRlcklkKT8gcG9pbnRlci5wb2ludGVySWQgOiBwb2ludGVyLmlkZW50aWZpZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBvaW50ZXJVdGlscztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGxhc3RUaW1lID0gMCxcbiAgICB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXSxcbiAgICByZXFGcmFtZSxcbiAgICBjYW5jZWxGcmFtZTtcblxuZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK3gpIHtcbiAgICByZXFGcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICBjYW5jZWxGcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbn1cblxuaWYgKCFyZXFGcmFtZSkge1xuICAgIHJlcUZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgICAgICB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpLFxuICAgICAgICAgICAgaWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LFxuICAgICAgICAgIHRpbWVUb0NhbGwpO1xuICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG59XG5cbmlmICghY2FuY2VsRnJhbWUpIHtcbiAgICBjYW5jZWxGcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVxdWVzdDogcmVxRnJhbWUsXG4gICAgY2FuY2VsOiBjYW5jZWxGcmFtZVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzV2luZG93ID0gcmVxdWlyZSgnLi9pc1dpbmRvdycpO1xuXG52YXIgaXNTaGFkb3dEb20gPSBmdW5jdGlvbigpIHtcbiAgICAvLyBjcmVhdGUgYSBUZXh0Tm9kZVxuICAgIHZhciBlbCA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG5cbiAgICAvLyBjaGVjayBpZiBpdCdzIHdyYXBwZWQgYnkgYSBwb2x5ZmlsbFxuICAgIHJldHVybiBlbC5vd25lckRvY3VtZW50ICE9PSB3aW5kb3cuZG9jdW1lbnRcbiAgICAgICAgJiYgdHlwZW9mIHdpbmRvdy53cmFwID09PSAnZnVuY3Rpb24nXG4gICAgICAgICYmIHdpbmRvdy53cmFwKGVsKSA9PT0gZWw7XG59O1xuXG52YXIgd2luID0ge1xuXG4gICAgd2luZG93OiB1bmRlZmluZWQsXG5cbiAgICByZWFsV2luZG93OiB3aW5kb3csXG5cbiAgICBnZXRXaW5kb3c6IGZ1bmN0aW9uIGdldFdpbmRvdyAobm9kZSkge1xuICAgICAgICBpZiAoaXNXaW5kb3cobm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJvb3ROb2RlID0gKG5vZGUub3duZXJEb2N1bWVudCB8fCBub2RlKTtcblxuICAgICAgICByZXR1cm4gcm9vdE5vZGUuZGVmYXVsdFZpZXcgfHwgcm9vdE5vZGUucGFyZW50V2luZG93IHx8IHdpbi53aW5kb3c7XG4gICAgfVxufTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKGlzU2hhZG93RG9tKCkpIHtcbiAgICAgICAgd2luLndpbmRvdyA9IHdpbmRvdy53cmFwKHdpbmRvdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2luLndpbmRvdyA9IHdpbmRvdztcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gd2luO1xuIl19
