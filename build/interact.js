(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./scope":9,"./utils":16}],2:[function(require,module,exports){
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

    setOptions: function (option, options) {
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
                                interact.createSnapGrid(utils.extend({
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
                    events.add(scope.documents[i], eventType, delegateListener);
                    events.add(scope.documents[i], eventType, delegateUseCapture, true);
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
                                events.remove(this._context, eventType, delegateListener);
                                events.remove(this._context, eventType, delegateUseCapture, true);

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
     = (object) @interact
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

                    events.remove(this._context, type, delegateListener);
                    events.remove(this._context, type, delegateUseCapture, true);

                    break;
                }
            }
        }

        this.dropzone(false);

        scope.interactables.splice(scope.indexOf(scope.interactables, this), 1);

        return interact;
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
},{"./defaultActionChecker":5,"./listener":8,"./scope":9,"./utils":16,"./utils/events":13}],3:[function(require,module,exports){
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

},{"./InteractEvent":1,"./scope":9,"./utils":16,"./utils/browser":11,"./utils/events":13}],4:[function(require,module,exports){
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

},{"./utils/isType":17,"./utils/raf":20,"./utils/window":21}],5:[function(require,module,exports){
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
},{"./scope":9,"./utils":16}],6:[function(require,module,exports){
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

},{"./utils/domObjects":12}],7:[function(require,module,exports){
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

    scope.pEventTypes = null;

    scope.documents       = [];   // all documents being listened to

    scope.interactables   = [];   // all set interactables
    scope.interactions    = [];   // all interactions

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

    // prefix matchesSelector
    browser.prefixedMatchesSelector = 'matches' in Element.prototype?
            'matches': 'webkitMatchesSelector' in Element.prototype?
                'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype?
                    'mozMatchesSelector': 'oMatchesSelector' in Element.prototype?
                        'oMatchesSelector': 'msMatchesSelector';

    // will be polyfill function if browser is IE8
    scope.ie8MatchesSelector = null;

    // Events wrapper
    var events = require('./utils/events');

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

    var Interaction = require('./Interaction');

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

    interact.createSnapGrid = function (grid) {
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
    };

    listener.listenToDocument(scope.document);

    scope.interact = interact;
    scope.Interactable = Interactable;
    scope.Interaction = Interaction;
    scope.InteractEvent = InteractEvent;

    module.exports = interact;

},{"./InteractEvent":1,"./Interactable":2,"./Interaction":3,"./autoScroll":4,"./defaultActionChecker":5,"./defaultOptions":6,"./listener":8,"./scope":9,"./utils":16,"./utils/events":13,"./utils/window":21}],8:[function(require,module,exports){
var events = require('./utils/events');
var scope = require('./scope');
var browser = require('./utils/browser');
var utils = require('./utils');
var Interaction = require('./Interaction');

var listeners = {};

// {
//      type: {
//          selectors: ['selector', ...],
//          contexts : [document, ...],
//          listeners: [[listener, useCapture], ...]
//      }
//  }
delegatedEvents = {};

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
        interact.windowParentError = error;
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
    delegatedEvents: delegatedEvents
};

module.exports = listener;
},{"./Interaction":3,"./scope":9,"./utils":16,"./utils/browser":11,"./utils/events":13}],9:[function(require,module,exports){
'use strict';

var scope = {},
    extend = require('./utils/extend');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));
extend(scope, require('./utils/arr.js'));
extend(scope, require('./utils/isType'));

module.exports = scope;

},{"./utils/arr.js":10,"./utils/domObjects":12,"./utils/extend":14,"./utils/isType":17,"./utils/window":21}],10:[function(require,module,exports){
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

},{"../InteractEvent":1,"./browser":11,"./extend":14,"./hypot":15,"./isType":17,"./window":21}],20:[function(require,module,exports){
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

},{"./isWindow":18}]},{},[7])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvSW50ZXJhY3RFdmVudC5qcyIsInNyYy9JbnRlcmFjdGFibGUuanMiLCJzcmMvSW50ZXJhY3Rpb24uanMiLCJzcmMvYXV0b1Njcm9sbC5qcyIsInNyYy9kZWZhdWx0QWN0aW9uQ2hlY2tlci5qcyIsInNyYy9kZWZhdWx0T3B0aW9ucy5qcyIsInNyYy9pbnRlcmFjdC5qcyIsInNyYy9saXN0ZW5lci5qcyIsInNyYy9zY29wZS5qcyIsInNyYy91dGlscy9hcnIuanMiLCJzcmMvdXRpbHMvYnJvd3Nlci5qcyIsInNyYy91dGlscy9kb21PYmplY3RzLmpzIiwic3JjL3V0aWxzL2V2ZW50cy5qcyIsInNyYy91dGlscy9leHRlbmQuanMiLCJzcmMvdXRpbHMvaHlwb3QuanMiLCJzcmMvdXRpbHMvaW5kZXguanMiLCJzcmMvdXRpbHMvaXNUeXBlLmpzIiwic3JjL3V0aWxzL2lzV2luZG93LmpzIiwic3JjL3V0aWxzL3BvaW50ZXJVdGlscy5qcyIsInNyYy91dGlscy9yYWYuanMiLCJzcmMvdXRpbHMvd2luZG93LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDejVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hpRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2NvcGUgPSByZXF1aXJlKCcuL3Njb3BlJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbmZ1bmN0aW9uIEludGVyYWN0RXZlbnQgKGludGVyYWN0aW9uLCBldmVudCwgYWN0aW9uLCBwaGFzZSwgZWxlbWVudCwgcmVsYXRlZCkge1xuICAgIHZhciBjbGllbnQsXG4gICAgICAgIHBhZ2UsXG4gICAgICAgIHRhcmdldCAgICAgID0gaW50ZXJhY3Rpb24udGFyZ2V0LFxuICAgICAgICBzbmFwU3RhdHVzICA9IGludGVyYWN0aW9uLnNuYXBTdGF0dXMsXG4gICAgICAgIHJlc3RyaWN0U3RhdHVzICA9IGludGVyYWN0aW9uLnJlc3RyaWN0U3RhdHVzLFxuICAgICAgICBwb2ludGVycyAgICA9IGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgICBkZWx0YVNvdXJjZSA9ICh0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMgfHwgc2NvcGUuZGVmYXVsdE9wdGlvbnMpLmRlbHRhU291cmNlLFxuICAgICAgICBzb3VyY2VYICAgICA9IGRlbHRhU291cmNlICsgJ1gnLFxuICAgICAgICBzb3VyY2VZICAgICA9IGRlbHRhU291cmNlICsgJ1knLFxuICAgICAgICBvcHRpb25zICAgICA9IHRhcmdldD8gdGFyZ2V0Lm9wdGlvbnM6IHNjb3BlLmRlZmF1bHRPcHRpb25zLFxuICAgICAgICBvcmlnaW4gICAgICA9IHNjb3BlLmdldE9yaWdpblhZKHRhcmdldCwgZWxlbWVudCksXG4gICAgICAgIHN0YXJ0aW5nICAgID0gcGhhc2UgPT09ICdzdGFydCcsXG4gICAgICAgIGVuZGluZyAgICAgID0gcGhhc2UgPT09ICdlbmQnLFxuICAgICAgICBjb29yZHMgICAgICA9IHN0YXJ0aW5nPyBpbnRlcmFjdGlvbi5zdGFydENvb3JkcyA6IGludGVyYWN0aW9uLmN1ckNvb3JkcztcblxuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IGludGVyYWN0aW9uLmVsZW1lbnQ7XG5cbiAgICBwYWdlICAgPSB1dGlscy5leHRlbmQoe30sIGNvb3Jkcy5wYWdlKTtcbiAgICBjbGllbnQgPSB1dGlscy5leHRlbmQoe30sIGNvb3Jkcy5jbGllbnQpO1xuXG4gICAgcGFnZS54IC09IG9yaWdpbi54O1xuICAgIHBhZ2UueSAtPSBvcmlnaW4ueTtcblxuICAgIGNsaWVudC54IC09IG9yaWdpbi54O1xuICAgIGNsaWVudC55IC09IG9yaWdpbi55O1xuXG4gICAgdmFyIHJlbGF0aXZlUG9pbnRzID0gb3B0aW9uc1thY3Rpb25dLnNuYXAgJiYgb3B0aW9uc1thY3Rpb25dLnNuYXAucmVsYXRpdmVQb2ludHMgO1xuXG4gICAgaWYgKHNjb3BlLmNoZWNrU25hcCh0YXJnZXQsIGFjdGlvbikgJiYgIShzdGFydGluZyAmJiByZWxhdGl2ZVBvaW50cyAmJiByZWxhdGl2ZVBvaW50cy5sZW5ndGgpKSB7XG4gICAgICAgIHRoaXMuc25hcCA9IHtcbiAgICAgICAgICAgIHJhbmdlICA6IHNuYXBTdGF0dXMucmFuZ2UsXG4gICAgICAgICAgICBsb2NrZWQgOiBzbmFwU3RhdHVzLmxvY2tlZCxcbiAgICAgICAgICAgIHggICAgICA6IHNuYXBTdGF0dXMuc25hcHBlZFgsXG4gICAgICAgICAgICB5ICAgICAgOiBzbmFwU3RhdHVzLnNuYXBwZWRZLFxuICAgICAgICAgICAgcmVhbFggIDogc25hcFN0YXR1cy5yZWFsWCxcbiAgICAgICAgICAgIHJlYWxZICA6IHNuYXBTdGF0dXMucmVhbFksXG4gICAgICAgICAgICBkeCAgICAgOiBzbmFwU3RhdHVzLmR4LFxuICAgICAgICAgICAgZHkgICAgIDogc25hcFN0YXR1cy5keVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzbmFwU3RhdHVzLmxvY2tlZCkge1xuICAgICAgICAgICAgcGFnZS54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBwYWdlLnkgKz0gc25hcFN0YXR1cy5keTtcbiAgICAgICAgICAgIGNsaWVudC54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBjbGllbnQueSArPSBzbmFwU3RhdHVzLmR5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNjb3BlLmNoZWNrUmVzdHJpY3QodGFyZ2V0LCBhY3Rpb24pICYmICEoc3RhcnRpbmcgJiYgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0LmVsZW1lbnRSZWN0KSAmJiByZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkKSB7XG4gICAgICAgIHBhZ2UueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgcGFnZS55ICs9IHJlc3RyaWN0U3RhdHVzLmR5O1xuICAgICAgICBjbGllbnQueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgY2xpZW50LnkgKz0gcmVzdHJpY3RTdGF0dXMuZHk7XG5cbiAgICAgICAgdGhpcy5yZXN0cmljdCA9IHtcbiAgICAgICAgICAgIGR4OiByZXN0cmljdFN0YXR1cy5keCxcbiAgICAgICAgICAgIGR5OiByZXN0cmljdFN0YXR1cy5keVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMucGFnZVggICAgID0gcGFnZS54O1xuICAgIHRoaXMucGFnZVkgICAgID0gcGFnZS55O1xuICAgIHRoaXMuY2xpZW50WCAgID0gY2xpZW50Lng7XG4gICAgdGhpcy5jbGllbnRZICAgPSBjbGllbnQueTtcblxuICAgIHRoaXMueDAgICAgICAgID0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54IC0gb3JpZ2luLng7XG4gICAgdGhpcy55MCAgICAgICAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueTtcbiAgICB0aGlzLmNsaWVudFgwICA9IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54IC0gb3JpZ2luLng7XG4gICAgdGhpcy5jbGllbnRZMCAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5jbGllbnQueSAtIG9yaWdpbi55O1xuICAgIHRoaXMuY3RybEtleSAgID0gZXZlbnQuY3RybEtleTtcbiAgICB0aGlzLmFsdEtleSAgICA9IGV2ZW50LmFsdEtleTtcbiAgICB0aGlzLnNoaWZ0S2V5ICA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgIHRoaXMubWV0YUtleSAgID0gZXZlbnQubWV0YUtleTtcbiAgICB0aGlzLmJ1dHRvbiAgICA9IGV2ZW50LmJ1dHRvbjtcbiAgICB0aGlzLnRhcmdldCAgICA9IGVsZW1lbnQ7XG4gICAgdGhpcy50MCAgICAgICAgPSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG4gICAgdGhpcy50eXBlICAgICAgPSBhY3Rpb24gKyAocGhhc2UgfHwgJycpO1xuXG4gICAgdGhpcy5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGFyZ2V0O1xuXG4gICAgdmFyIGluZXJ0aWFTdGF0dXMgPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzO1xuXG4gICAgaWYgKGluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuZGV0YWlsID0gJ2luZXJ0aWEnO1xuICAgIH1cblxuICAgIGlmIChyZWxhdGVkKSB7XG4gICAgICAgIHRoaXMucmVsYXRlZFRhcmdldCA9IHJlbGF0ZWQ7XG4gICAgfVxuXG4gICAgLy8gZW5kIGV2ZW50IGR4LCBkeSBpcyBkaWZmZXJlbmNlIGJldHdlZW4gc3RhcnQgYW5kIGVuZCBwb2ludHNcbiAgICBpZiAoZW5kaW5nKSB7XG4gICAgICAgIGlmIChkZWx0YVNvdXJjZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgICAgIHRoaXMuZHggPSBjbGllbnQueCAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54O1xuICAgICAgICAgICAgdGhpcy5keSA9IGNsaWVudC55IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMuY2xpZW50Lnk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gcGFnZS54IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54O1xuICAgICAgICAgICAgdGhpcy5keSA9IHBhZ2UueSAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLnBhZ2UueTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLmR4ID0gMDtcbiAgICAgICAgdGhpcy5keSA9IDA7XG4gICAgfVxuICAgIC8vIGNvcHkgcHJvcGVydGllcyBmcm9tIHByZXZpb3VzbW92ZSBpZiBzdGFydGluZyBpbmVydGlhXG4gICAgZWxzZSBpZiAocGhhc2UgPT09ICdpbmVydGlhc3RhcnQnKSB7XG4gICAgICAgIHRoaXMuZHggPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHg7XG4gICAgICAgIHRoaXMuZHkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoZGVsdGFTb3VyY2UgPT09ICdjbGllbnQnKSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gY2xpZW50LnggLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBjbGllbnQueSAtIGludGVyYWN0aW9uLnByZXZFdmVudC5jbGllbnRZO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5keCA9IHBhZ2UueCAtIGludGVyYWN0aW9uLnByZXZFdmVudC5wYWdlWDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBwYWdlLnkgLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQucGFnZVk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXZFdmVudCAmJiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGV0YWlsID09PSAnaW5lcnRpYSdcbiAgICAgICAgJiYgIWluZXJ0aWFTdGF0dXMuYWN0aXZlXG4gICAgICAgICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhLnplcm9SZXN1bWVEZWx0YSkge1xuXG4gICAgICAgIGluZXJ0aWFTdGF0dXMucmVzdW1lRHggKz0gdGhpcy5keDtcbiAgICAgICAgaW5lcnRpYVN0YXR1cy5yZXN1bWVEeSArPSB0aGlzLmR5O1xuXG4gICAgICAgIHRoaXMuZHggPSB0aGlzLmR5ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uID09PSAncmVzaXplJyAmJiBpbnRlcmFjdGlvbi5yZXNpemVBeGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR4ID0gdGhpcy5keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZHkgPSB0aGlzLmR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5heGVzID0gJ3h5JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXM7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR5ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuZHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2dlc3R1cmUnKSB7XG4gICAgICAgIHRoaXMudG91Y2hlcyA9IFtwb2ludGVyc1swXSwgcG9pbnRlcnNbMV1dO1xuXG4gICAgICAgIGlmIChzdGFydGluZykge1xuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZSA9IHV0aWxzLnRvdWNoRGlzdGFuY2UocG9pbnRlcnMsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuYm94ICAgICAgPSB1dGlscy50b3VjaEJCb3gocG9pbnRlcnMpO1xuICAgICAgICAgICAgdGhpcy5zY2FsZSAgICA9IDE7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB1dGlscy50b3VjaEFuZ2xlKHBvaW50ZXJzLCB1bmRlZmluZWQsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuZGEgICAgICAgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVuZGluZyB8fCBldmVudCBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzdGFuY2UgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGlzdGFuY2U7XG4gICAgICAgICAgICB0aGlzLmJveCAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmJveDtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc2NhbGU7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gdGhpcy5zY2FsZSAtIDE7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmFuZ2xlO1xuICAgICAgICAgICAgdGhpcy5kYSAgICAgICA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnN0YXJ0QW5nbGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpc3RhbmNlID0gdXRpbHMudG91Y2hEaXN0YW5jZShwb2ludGVycywgZGVsdGFTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5ib3ggICAgICA9IHV0aWxzLnRvdWNoQkJveChwb2ludGVycyk7XG4gICAgICAgICAgICB0aGlzLnNjYWxlICAgID0gdGhpcy5kaXN0YW5jZSAvIGludGVyYWN0aW9uLmdlc3R1cmUuc3RhcnREaXN0YW5jZTtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB1dGlscy50b3VjaEFuZ2xlKHBvaW50ZXJzLCBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZSwgZGVsdGFTb3VyY2UpO1xuXG4gICAgICAgICAgICB0aGlzLmRzID0gdGhpcy5zY2FsZSAtIGludGVyYWN0aW9uLmdlc3R1cmUucHJldlNjYWxlO1xuICAgICAgICAgICAgdGhpcy5kYSA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLmRvd25UaW1lc1swXTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSAwO1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IDA7XG4gICAgICAgIHRoaXMuc3BlZWQgICAgID0gMDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVggPSAwO1xuICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBoYXNlID09PSAnaW5lcnRpYXN0YXJ0Jykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHQgICAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmR0O1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IGludGVyYWN0aW9uLnByZXZFdmVudC5kdXJhdGlvbjtcbiAgICAgICAgdGhpcy5zcGVlZCAgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHlYID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gID0gdGhpcy50aW1lU3RhbXAgLSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICAgICAgdmFyIGR4ID0gdGhpc1tzb3VyY2VYXSAtIGludGVyYWN0aW9uLnByZXZFdmVudFtzb3VyY2VYXSxcbiAgICAgICAgICAgICAgICBkeSA9IHRoaXNbc291cmNlWV0gLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnRbc291cmNlWV0sXG4gICAgICAgICAgICAgICAgZHQgPSB0aGlzLmR0IC8gMTAwMDtcblxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IHV0aWxzLmh5cG90KGR4LCBkeSkgLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlYID0gZHggLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlZID0gZHkgLyBkdDtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBub3JtYWwgbW92ZSBvciBlbmQgZXZlbnQsIHVzZSBwcmV2aW91cyB1c2VyIGV2ZW50IGNvb3Jkc1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNwZWVkIGFuZCB2ZWxvY2l0eSBpbiBwaXhlbHMgcGVyIHNlY29uZFxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0uc3BlZWQ7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udng7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udnk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKGVuZGluZyB8fCBwaGFzZSA9PT0gJ2luZXJ0aWFzdGFydCcpXG4gICAgICAgICYmIGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCA+IDYwMCAmJiB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXAgPCAxNTApIHtcblxuICAgICAgICB2YXIgYW5nbGUgPSAxODAgKiBNYXRoLmF0YW4yKGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVksIGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVgpIC8gTWF0aC5QSSxcbiAgICAgICAgICAgIG92ZXJsYXAgPSAyMi41O1xuXG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICAgIGFuZ2xlICs9IDM2MDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWZ0ID0gMTM1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDIyNSArIG92ZXJsYXAsXG4gICAgICAgICAgICB1cCAgID0gMjI1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDMxNSArIG92ZXJsYXAsXG5cbiAgICAgICAgICAgIHJpZ2h0ID0gIWxlZnQgJiYgKDMxNSAtIG92ZXJsYXAgPD0gYW5nbGUgfHwgYW5nbGUgPCAgNDUgKyBvdmVybGFwKSxcbiAgICAgICAgICAgIGRvd24gID0gIXVwICAgJiYgICA0NSAtIG92ZXJsYXAgPD0gYW5nbGUgJiYgYW5nbGUgPCAxMzUgKyBvdmVybGFwO1xuXG4gICAgICAgIHRoaXMuc3dpcGUgPSB7XG4gICAgICAgICAgICB1cCAgIDogdXAsXG4gICAgICAgICAgICBkb3duIDogZG93bixcbiAgICAgICAgICAgIGxlZnQgOiBsZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IHJpZ2h0LFxuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlLFxuICAgICAgICAgICAgc3BlZWQ6IGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCxcbiAgICAgICAgICAgIHZlbG9jaXR5OiB7XG4gICAgICAgICAgICAgICAgeDogaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WCxcbiAgICAgICAgICAgICAgICB5OiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5JbnRlcmFjdEV2ZW50LnByb3RvdHlwZSA9IHtcbiAgICBwcmV2ZW50RGVmYXVsdDogdXRpbHMuYmxhbmssXG4gICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgIH0sXG4gICAgc3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0RXZlbnQ7XG4iLCJ2YXIgc2NvcGUgPSByZXF1aXJlKCcuL3Njb3BlJyk7XG52YXIgbGlzdGVuZXIgPSByZXF1aXJlKCcuL2xpc3RlbmVyJyk7XG52YXIgZGVmYXVsdEFjdGlvbkNoZWNrZXIgPSByZXF1aXJlKCcuL2RlZmF1bHRBY3Rpb25DaGVja2VyJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcblxuLypcXFxuICogSW50ZXJhY3RhYmxlXG4gWyBwcm9wZXJ0eSBdXG4gKipcbiAqIE9iamVjdCB0eXBlIHJldHVybmVkIGJ5IEBpbnRlcmFjdFxuIFxcKi9cbmZ1bmN0aW9uIEludGVyYWN0YWJsZSAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuX2lFdmVudHMgPSB0aGlzLl9pRXZlbnRzIHx8IHt9O1xuXG4gICAgdmFyIF93aW5kb3c7XG5cbiAgICBpZiAoc2NvcGUudHJ5U2VsZWN0b3IoZWxlbWVudCkpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RvciA9IGVsZW1lbnQ7XG5cbiAgICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zICYmIG9wdGlvbnMuY29udGV4dDtcblxuICAgICAgICBfd2luZG93ID0gY29udGV4dD8gc2NvcGUuZ2V0V2luZG93KGNvbnRleHQpIDogc2NvcGUud2luZG93O1xuXG4gICAgICAgIGlmIChjb250ZXh0ICYmIChfd2luZG93Lk5vZGVcbiAgICAgICAgICAgICAgICA/IGNvbnRleHQgaW5zdGFuY2VvZiBfd2luZG93Lk5vZGVcbiAgICAgICAgICAgICAgICA6ICh1dGlscy5pc0VsZW1lbnQoY29udGV4dCkgfHwgY29udGV4dCA9PT0gX3dpbmRvdy5kb2N1bWVudCkpKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBfd2luZG93ID0gc2NvcGUuZ2V0V2luZG93KGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh1dGlscy5pc0VsZW1lbnQoZWxlbWVudCwgX3dpbmRvdykpIHtcblxuICAgICAgICAgICAgaWYgKHNjb3BlLlBvaW50ZXJFdmVudCkge1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgc2NvcGUucEV2ZW50VHlwZXMuZG93biwgbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJEb3duICk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCBzY29wZS5wRXZlbnRUeXBlcy5tb3ZlLCBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckhvdmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgJ21vdXNlZG93bicgLCBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckRvd24gKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsICdtb3VzZW1vdmUnICwgbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJIb3Zlcik7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAndG91Y2hzdGFydCcsIGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVyRG93biApO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgJ3RvdWNobW92ZScgLCBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckhvdmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2RvYyA9IF93aW5kb3cuZG9jdW1lbnQ7XG5cbiAgICBpZiAoIXNjb3BlLmNvbnRhaW5zKHNjb3BlLmRvY3VtZW50cywgdGhpcy5fZG9jKSkge1xuICAgICAgICBsaXN0ZW5lci5saXN0ZW5Ub0RvY3VtZW50KHRoaXMuX2RvYyk7XG4gICAgfVxuXG4gICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5wdXNoKHRoaXMpO1xuXG4gICAgdGhpcy5zZXQob3B0aW9ucyk7XG59XG5cbkludGVyYWN0YWJsZS5wcm90b3R5cGUgPSB7XG4gICAgc2V0T25FdmVudHM6IGZ1bmN0aW9uIChhY3Rpb24sIHBoYXNlcykge1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnZHJvcCcpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmRyb3ApICAgICAgICAgICkgeyB0aGlzLm9uZHJvcCAgICAgICAgICAgPSBwaGFzZXMub25kcm9wICAgICAgICAgIDsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZHJvcGFjdGl2YXRlKSAgKSB7IHRoaXMub25kcm9wYWN0aXZhdGUgICA9IHBoYXNlcy5vbmRyb3BhY3RpdmF0ZSAgOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wZGVhY3RpdmF0ZSkpIHsgdGhpcy5vbmRyb3BkZWFjdGl2YXRlID0gcGhhc2VzLm9uZHJvcGRlYWN0aXZhdGU7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmRyYWdlbnRlcikgICAgICkgeyB0aGlzLm9uZHJhZ2VudGVyICAgICAgPSBwaGFzZXMub25kcmFnZW50ZXIgICAgIDsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZHJhZ2xlYXZlKSAgICAgKSB7IHRoaXMub25kcmFnbGVhdmUgICAgICA9IHBoYXNlcy5vbmRyYWdsZWF2ZSAgICAgOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wbW92ZSkgICAgICApIHsgdGhpcy5vbmRyb3Btb3ZlICAgICAgID0gcGhhc2VzLm9uZHJvcG1vdmUgICAgICA7IH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFjdGlvbiA9ICdvbicgKyBhY3Rpb247XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbnN0YXJ0KSAgICAgICApIHsgdGhpc1thY3Rpb24gKyAnc3RhcnQnICAgICAgICAgXSA9IHBoYXNlcy5vbnN0YXJ0ICAgICAgICAgOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25tb3ZlKSAgICAgICAgKSB7IHRoaXNbYWN0aW9uICsgJ21vdmUnICAgICAgICAgIF0gPSBwaGFzZXMub25tb3ZlICAgICAgICAgIDsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZW5kKSAgICAgICAgICkgeyB0aGlzW2FjdGlvbiArICdlbmQnICAgICAgICAgICBdID0gcGhhc2VzLm9uZW5kICAgICAgICAgICA7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmluZXJ0aWFzdGFydCkpIHsgdGhpc1thY3Rpb24gKyAnaW5lcnRpYXN0YXJ0JyAgXSA9IHBoYXNlcy5vbmluZXJ0aWFzdGFydCAgOyB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5kcmFnZ2FibGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgZHJhZyBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlXG4gICAgICogSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoaXMgY2FuIGJlIHRoZSB0YXJnZXQgb2YgZHJhZyBldmVudHNcbiAgICAgfCB2YXIgaXNEcmFnZ2FibGUgPSBpbnRlcmFjdCgndWwgbGknKS5kcmFnZ2FibGUoKTtcbiAgICAgKiBvclxuICAgICAtIG9wdGlvbnMgKGJvb2xlYW4gfCBvYmplY3QpICNvcHRpb25hbCB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50IGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiBkcmFnIGV2ZW50cyAob2JqZWN0IG1ha2VzIHRoZSBJbnRlcmFjdGFibGUgZHJhZ2dhYmxlKVxuICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuZHJhZ2dhYmxlKHtcbiAgICAgfCAgICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfFxuICAgICB8ICAgICAvLyB0aGUgYXhpcyBpbiB3aGljaCB0aGUgZmlyc3QgbW92ZW1lbnQgbXVzdCBiZVxuICAgICB8ICAgICAvLyBmb3IgdGhlIGRyYWcgc2VxdWVuY2UgdG8gc3RhcnRcbiAgICAgfCAgICAgLy8gJ3h5JyBieSBkZWZhdWx0IC0gYW55IGRpcmVjdGlvblxuICAgICB8ICAgICBheGlzOiAneCcgfHwgJ3knIHx8ICd4eScsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gbWF4IG51bWJlciBvZiBkcmFncyB0aGF0IGNhbiBoYXBwZW4gY29uY3VycmVudGx5XG4gICAgIHwgICAgIC8vIHdpdGggZWxlbWVudHMgb2YgdGhpcyBJbnRlcmFjdGFibGUuIEluZmluaXR5IGJ5IGRlZmF1bHRcbiAgICAgfCAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBtYXggbnVtYmVyIG9mIGRyYWdzIHRoYXQgY2FuIHRhcmdldCB0aGUgc2FtZSBlbGVtZW50K0ludGVyYWN0YWJsZVxuICAgICB8ICAgICAvLyAxIGJ5IGRlZmF1bHRcbiAgICAgfCAgICAgbWF4UGVyRWxlbWVudDogMlxuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgZHJhZ2dhYmxlOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcmFnLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0UGVyQWN0aW9uKCdkcmFnJywgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLnNldE9uRXZlbnRzKCdkcmFnJywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIGlmICgvXngkfF55JHxeeHkkLy50ZXN0KG9wdGlvbnMuYXhpcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJhZy5heGlzID0gb3B0aW9ucy5heGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5heGlzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5kcmFnLmF4aXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyYWcuZW5hYmxlZCA9IG9wdGlvbnM7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kcmFnO1xuICAgIH0sXG5cbiAgICBzZXRQZXJBY3Rpb246IGZ1bmN0aW9uIChhY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gZm9yIGFsbCB0aGUgZGVmYXVsdCBwZXItYWN0aW9uIG9wdGlvbnNcbiAgICAgICAgZm9yICh2YXIgb3B0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgb3B0aW9uIGV4aXN0cyBmb3IgdGhpcyBhY3Rpb25cbiAgICAgICAgICAgIGlmIChvcHRpb24gaW4gc2NvcGUuZGVmYXVsdE9wdGlvbnNbYWN0aW9uXSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBvcHRpb24gaW4gdGhlIG9wdGlvbnMgYXJnIGlzIGFuIG9iamVjdCB2YWx1ZVxuICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zW29wdGlvbl0pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGR1cGxpY2F0ZSB0aGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbl0gPSB1dGlscy5leHRlbmQodGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXSB8fCB7fSwgb3B0aW9uc1tvcHRpb25dKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qoc2NvcGUuZGVmYXVsdE9wdGlvbnMucGVyQWN0aW9uW29wdGlvbl0pICYmICdlbmFibGVkJyBpbiBzY29wZS5kZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb25bb3B0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXS5lbmFibGVkID0gb3B0aW9uc1tvcHRpb25dLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZSA6IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnNbb3B0aW9uXSkgJiYgc2NvcGUuaXNPYmplY3Qoc2NvcGUuZGVmYXVsdE9wdGlvbnMucGVyQWN0aW9uW29wdGlvbl0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbl0uZW5hYmxlZCA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9uc1tvcHRpb25dICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb3IgaWYgaXQncyBub3QgdW5kZWZpbmVkLCBkbyBhIHBsYWluIGFzc2lnbm1lbnRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5kcm9wem9uZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBlbGVtZW50cyBjYW4gYmUgZHJvcHBlZCBvbnRvIHRoaXNcbiAgICAgKiBJbnRlcmFjdGFibGUgdG8gdHJpZ2dlciBkcm9wIGV2ZW50c1xuICAgICAqXG4gICAgICogRHJvcHpvbmVzIGNhbiByZWNlaXZlIHRoZSBmb2xsb3dpbmcgZXZlbnRzOlxuICAgICAqICAtIGBkcm9wYWN0aXZhdGVgIGFuZCBgZHJvcGRlYWN0aXZhdGVgIHdoZW4gYW4gYWNjZXB0YWJsZSBkcmFnIHN0YXJ0cyBhbmQgZW5kc1xuICAgICAqICAtIGBkcmFnZW50ZXJgIGFuZCBgZHJhZ2xlYXZlYCB3aGVuIGEgZHJhZ2dhYmxlIGVudGVycyBhbmQgbGVhdmVzIHRoZSBkcm9wem9uZVxuICAgICAqICAtIGBkcmFnbW92ZWAgd2hlbiBhIGRyYWdnYWJsZSB0aGF0IGhhcyBlbnRlcmVkIHRoZSBkcm9wem9uZSBpcyBtb3ZlZFxuICAgICAqICAtIGBkcm9wYCB3aGVuIGEgZHJhZ2dhYmxlIGlzIGRyb3BwZWQgaW50byB0aGlzIGRyb3B6b25lXG4gICAgICpcbiAgICAgKiAgVXNlIHRoZSBgYWNjZXB0YCBvcHRpb24gdG8gYWxsb3cgb25seSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBnaXZlbiBDU1Mgc2VsZWN0b3Igb3IgZWxlbWVudC5cbiAgICAgKlxuICAgICAqICBVc2UgdGhlIGBvdmVybGFwYCBvcHRpb24gdG8gc2V0IGhvdyBkcm9wcyBhcmUgY2hlY2tlZCBmb3IuIFRoZSBhbGxvd2VkIHZhbHVlcyBhcmU6XG4gICAgICogICAtIGAncG9pbnRlcidgLCB0aGUgcG9pbnRlciBtdXN0IGJlIG92ZXIgdGhlIGRyb3B6b25lIChkZWZhdWx0KVxuICAgICAqICAgLSBgJ2NlbnRlcidgLCB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQncyBjZW50ZXIgbXVzdCBiZSBvdmVyIHRoZSBkcm9wem9uZVxuICAgICAqICAgLSBhIG51bWJlciBmcm9tIDAtMSB3aGljaCBpcyB0aGUgYChpbnRlcnNlY3Rpb24gYXJlYSkgLyAoZHJhZ2dhYmxlIGFyZWEpYC5cbiAgICAgKiAgICAgICBlLmcuIGAwLjVgIGZvciBkcm9wIHRvIGhhcHBlbiB3aGVuIGhhbGYgb2YgdGhlIGFyZWEgb2YgdGhlXG4gICAgICogICAgICAgZHJhZ2dhYmxlIGlzIG92ZXIgdGhlIGRyb3B6b25lXG4gICAgICpcbiAgICAgLSBvcHRpb25zIChib29sZWFuIHwgb2JqZWN0IHwgbnVsbCkgI29wdGlvbmFsIFRoZSBuZXcgdmFsdWUgdG8gYmUgc2V0LlxuICAgICB8IGludGVyYWN0KCcuZHJvcCcpLmRyb3B6b25lKHtcbiAgICAgfCAgIGFjY2VwdDogJy5jYW4tZHJvcCcgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpbmdsZS1kcm9wJyksXG4gICAgIHwgICBvdmVybGFwOiAncG9pbnRlcicgfHwgJ2NlbnRlcicgfHwgemVyb1RvT25lXG4gICAgIHwgfVxuICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBkcm9wem9uZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldE9uRXZlbnRzKCdkcm9wJywgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLmFjY2VwdChvcHRpb25zLmFjY2VwdCk7XG5cbiAgICAgICAgICAgIGlmICgvXihwb2ludGVyfGNlbnRlcikkLy50ZXN0KG9wdGlvbnMub3ZlcmxhcCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5vdmVybGFwID0gb3B0aW9ucy5vdmVybGFwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2NvcGUuaXNOdW1iZXIob3B0aW9ucy5vdmVybGFwKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLm92ZXJsYXAgPSBNYXRoLm1heChNYXRoLm1pbigxLCBvcHRpb25zLm92ZXJsYXApLCAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5lbmFibGVkID0gb3B0aW9ucztcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRyb3A7XG4gICAgfSxcblxuICAgIGRyb3BDaGVjazogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQsIGRyb3BFbGVtZW50LCByZWN0KSB7XG4gICAgICAgIHZhciBkcm9wcGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gaWYgdGhlIGRyb3B6b25lIGhhcyBubyByZWN0IChlZy4gZGlzcGxheTogbm9uZSlcbiAgICAgICAgLy8gY2FsbCB0aGUgY3VzdG9tIGRyb3BDaGVja2VyIG9yIGp1c3QgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmICghKHJlY3QgPSByZWN0IHx8IHRoaXMuZ2V0UmVjdChkcm9wRWxlbWVudCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gKHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlclxuICAgICAgICAgICAgICAgID8gdGhpcy5vcHRpb25zLmRyb3BDaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBkcm9wcGVkLCB0aGlzLCBkcm9wRWxlbWVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50KVxuICAgICAgICAgICAgICAgIDogZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRyb3BPdmVybGFwID0gdGhpcy5vcHRpb25zLmRyb3Aub3ZlcmxhcDtcblxuICAgICAgICBpZiAoZHJvcE92ZXJsYXAgPT09ICdwb2ludGVyJykge1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSB1dGlscy5nZXRQYWdlWFkocG9pbnRlciksXG4gICAgICAgICAgICAgICAgb3JpZ2luID0gc2NvcGUuZ2V0T3JpZ2luWFkoZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50KSxcbiAgICAgICAgICAgICAgICBob3Jpem9udGFsLFxuICAgICAgICAgICAgICAgIHZlcnRpY2FsO1xuXG4gICAgICAgICAgICBwYWdlLnggKz0gb3JpZ2luLng7XG4gICAgICAgICAgICBwYWdlLnkgKz0gb3JpZ2luLnk7XG5cbiAgICAgICAgICAgIGhvcml6b250YWwgPSAocGFnZS54ID4gcmVjdC5sZWZ0KSAmJiAocGFnZS54IDwgcmVjdC5yaWdodCk7XG4gICAgICAgICAgICB2ZXJ0aWNhbCAgID0gKHBhZ2UueSA+IHJlY3QudG9wICkgJiYgKHBhZ2UueSA8IHJlY3QuYm90dG9tKTtcblxuICAgICAgICAgICAgZHJvcHBlZCA9IGhvcml6b250YWwgJiYgdmVydGljYWw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZHJhZ1JlY3QgPSBkcmFnZ2FibGUuZ2V0UmVjdChkcmFnZ2FibGVFbGVtZW50KTtcblxuICAgICAgICBpZiAoZHJvcE92ZXJsYXAgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICB2YXIgY3ggPSBkcmFnUmVjdC5sZWZ0ICsgZHJhZ1JlY3Qud2lkdGggIC8gMixcbiAgICAgICAgICAgICAgICBjeSA9IGRyYWdSZWN0LnRvcCAgKyBkcmFnUmVjdC5oZWlnaHQgLyAyO1xuXG4gICAgICAgICAgICBkcm9wcGVkID0gY3ggPj0gcmVjdC5sZWZ0ICYmIGN4IDw9IHJlY3QucmlnaHQgJiYgY3kgPj0gcmVjdC50b3AgJiYgY3kgPD0gcmVjdC5ib3R0b207XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNOdW1iZXIoZHJvcE92ZXJsYXApKSB7XG4gICAgICAgICAgICB2YXIgb3ZlcmxhcEFyZWEgID0gKE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QucmlnaHQgLCBkcmFnUmVjdC5yaWdodCApIC0gTWF0aC5tYXgocmVjdC5sZWZ0LCBkcmFnUmVjdC5sZWZ0KSlcbiAgICAgICAgICAgICAgICAqIE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QuYm90dG9tLCBkcmFnUmVjdC5ib3R0b20pIC0gTWF0aC5tYXgocmVjdC50b3AgLCBkcmFnUmVjdC50b3AgKSkpLFxuICAgICAgICAgICAgICAgIG92ZXJsYXBSYXRpbyA9IG92ZXJsYXBBcmVhIC8gKGRyYWdSZWN0LndpZHRoICogZHJhZ1JlY3QuaGVpZ2h0KTtcblxuICAgICAgICAgICAgZHJvcHBlZCA9IG92ZXJsYXBSYXRpbyA+PSBkcm9wT3ZlcmxhcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXIpIHtcbiAgICAgICAgICAgIGRyb3BwZWQgPSB0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXIocG9pbnRlciwgZHJvcHBlZCwgdGhpcywgZHJvcEVsZW1lbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJvcHBlZDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5kcm9wQ2hlY2tlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaWYgYSBkcmFnZ2VkIGVsZW1lbnQgaXNcbiAgICAgKiBvdmVyIHRoaXMgSW50ZXJhY3RhYmxlLlxuICAgICAqXG4gICAgIC0gY2hlY2tlciAoZnVuY3Rpb24pICNvcHRpb25hbCBUaGUgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCB3aGVuIGNoZWNraW5nIGZvciBhIGRyb3BcbiAgICAgPSAoRnVuY3Rpb24gfCBJbnRlcmFjdGFibGUpIFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgKiBUaGUgY2hlY2tlciBmdW5jdGlvbiB0YWtlcyB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAgKlxuICAgICAtIHBvaW50ZXIgKFRvdWNoIHwgUG9pbnRlckV2ZW50IHwgTW91c2VFdmVudCkgVGhlIHBvaW50ZXIvZXZlbnQgdGhhdCBlbmRzIGEgZHJhZ1xuICAgICAtIGV2ZW50IChUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50IHwgTW91c2VFdmVudCkgVGhlIGV2ZW50IHJlbGF0ZWQgdG8gdGhlIHBvaW50ZXJcbiAgICAgLSBkcm9wcGVkIChib29sZWFuKSBUaGUgdmFsdWUgZnJvbSB0aGUgZGVmYXVsdCBkcm9wIGNoZWNrXG4gICAgIC0gZHJvcHpvbmUgKEludGVyYWN0YWJsZSkgVGhlIGRyb3B6b25lIGludGVyYWN0YWJsZVxuICAgICAtIGRyb3BFbGVtZW50IChFbGVtZW50KSBUaGUgZHJvcHpvbmUgZWxlbWVudFxuICAgICAtIGRyYWdnYWJsZSAoSW50ZXJhY3RhYmxlKSBUaGUgSW50ZXJhY3RhYmxlIGJlaW5nIGRyYWdnZWRcbiAgICAgLSBkcmFnZ2FibGVFbGVtZW50IChFbGVtZW50KSBUaGUgYWN0dWFsIGVsZW1lbnQgdGhhdCdzIGJlaW5nIGRyYWdnZWRcbiAgICAgKlxuICAgICA+IFVzYWdlOlxuICAgICB8IGludGVyYWN0KHRhcmdldClcbiAgICAgfCAuZHJvcENoZWNrZXIoZnVuY3Rpb24ocG9pbnRlciwgICAgICAgICAgIC8vIFRvdWNoL1BvaW50ZXJFdmVudC9Nb3VzZUV2ZW50XG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LCAgICAgICAgICAgICAvLyBUb3VjaEV2ZW50L1BvaW50ZXJFdmVudC9Nb3VzZUV2ZW50XG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgIGRyb3BwZWQsICAgICAgICAgICAvLyByZXN1bHQgb2YgdGhlIGRlZmF1bHQgY2hlY2tlclxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSwgICAgICAgICAgLy8gZHJvcHpvbmUgSW50ZXJhY3RhYmxlXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgIGRyb3BFbGVtZW50LCAgICAgICAvLyBkcm9wem9uZSBlbGVtbnRcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlLCAgICAgICAgIC8vIGRyYWdnYWJsZSBJbnRlcmFjdGFibGVcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlRWxlbWVudCkgey8vIGRyYWdnYWJsZSBlbGVtZW50XG4gICAgIHxcbiAgICAgfCAgIHJldHVybiBkcm9wcGVkICYmIGV2ZW50LnRhcmdldC5oYXNBdHRyaWJ1dGUoJ2FsbG93LWRyb3AnKTtcbiAgICAgfCB9XG4gICAgIFxcKi9cbiAgICBkcm9wQ2hlY2tlcjogZnVuY3Rpb24gKGNoZWNrZXIpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oY2hlY2tlcikpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlciA9IGNoZWNrZXI7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmdldFJlY3Q7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlcjtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5hY2NlcHRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC4gYWRkIGFuIGBhY2NlcHRgIHByb3BlcnR5IHRvIHRoZSBvcHRpb25zIG9iamVjdCBwYXNzZWQgdG9cbiAgICAgKiBASW50ZXJhY3RhYmxlLmRyb3B6b25lIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIEVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIG1hdGNoIHRoYXQgdGhpc1xuICAgICAqIEludGVyYWN0YWJsZSBhY2NlcHRzIGlmIGl0IGlzIGEgZHJvcHpvbmUuXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoRWxlbWVudCB8IHN0cmluZyB8IG51bGwpICNvcHRpb25hbFxuICAgICAqIElmIGl0IGlzIGFuIEVsZW1lbnQsIHRoZW4gb25seSB0aGF0IGVsZW1lbnQgY2FuIGJlIGRyb3BwZWQgaW50byB0aGlzIGRyb3B6b25lLlxuICAgICAqIElmIGl0IGlzIGEgc3RyaW5nLCB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkIG11c3QgbWF0Y2ggaXQgYXMgYSBzZWxlY3Rvci5cbiAgICAgKiBJZiBpdCBpcyBudWxsLCB0aGUgYWNjZXB0IG9wdGlvbnMgaXMgY2xlYXJlZCAtIGl0IGFjY2VwdHMgYW55IGVsZW1lbnQuXG4gICAgICpcbiAgICAgPSAoc3RyaW5nIHwgRWxlbWVudCB8IG51bGwgfCBJbnRlcmFjdGFibGUpIFRoZSBjdXJyZW50IGFjY2VwdCBvcHRpb24gaWYgZ2l2ZW4gYHVuZGVmaW5lZGAgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGFjY2VwdDogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmICh1dGlscy5pc0VsZW1lbnQobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5hY2NlcHQgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0ZXN0IGlmIGl0IGlzIGEgdmFsaWQgQ1NTIHNlbGVjdG9yXG4gICAgICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmFjY2VwdCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5kcm9wLmFjY2VwdDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0O1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnJlc2l6YWJsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciByZXNpemUgYWN0aW9ucyBjYW4gYmUgcGVyZm9ybWVkIG9uIHRoZVxuICAgICAqIEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIEluZGljYXRlcyBpZiB0aGlzIGNhbiBiZSB0aGUgdGFyZ2V0IG9mIHJlc2l6ZSBlbGVtZW50c1xuICAgICB8IHZhciBpc1Jlc2l6ZWFibGUgPSBpbnRlcmFjdCgnaW5wdXRbdHlwZT10ZXh0XScpLnJlc2l6YWJsZSgpO1xuICAgICAqIG9yXG4gICAgIC0gb3B0aW9ucyAoYm9vbGVhbiB8IG9iamVjdCkgI29wdGlvbmFsIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnQgbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIHJlc2l6ZSBldmVudHMgKG9iamVjdCBtYWtlcyB0aGUgSW50ZXJhY3RhYmxlIHJlc2l6YWJsZSlcbiAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsZVxuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLnJlc2l6YWJsZSh7XG4gICAgIHwgICAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9uZW5kICA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHxcbiAgICAgfCAgICAgZWRnZXM6IHtcbiAgICAgfCAgICAgICB0b3AgICA6IHRydWUsICAgICAgIC8vIFVzZSBwb2ludGVyIGNvb3JkcyB0byBjaGVjayBmb3IgcmVzaXplLlxuICAgICB8ICAgICAgIGxlZnQgIDogZmFsc2UsICAgICAgLy8gRGlzYWJsZSByZXNpemluZyBmcm9tIGxlZnQgZWRnZS5cbiAgICAgfCAgICAgICBib3R0b206ICcucmVzaXplLXMnLC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBtYXRjaGVzIHNlbGVjdG9yXG4gICAgIHwgICAgICAgcmlnaHQgOiBoYW5kbGVFbCAgICAvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgaXMgdGhlIGdpdmVuIEVsZW1lbnRcbiAgICAgfCAgICAgfSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBhIHZhbHVlIG9mICdub25lJyB3aWxsIGxpbWl0IHRoZSByZXNpemUgcmVjdCB0byBhIG1pbmltdW0gb2YgMHgwXG4gICAgIHwgICAgIC8vICduZWdhdGUnIHdpbGwgYWxsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAgfCAgICAgLy8gJ3JlcG9zaXRpb24nIHdpbGwga2VlcCB0aGUgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlIGJ5IHN3YXBwaW5nXG4gICAgIHwgICAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBhbmQvb3Igc3dhcHBpbmcgdGhlIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXG4gICAgIHwgICAgIGludmVydDogJ25vbmUnIHx8ICduZWdhdGUnIHx8ICdyZXBvc2l0aW9uJ1xuICAgICB8XG4gICAgIHwgICAgIC8vIGxpbWl0IG11bHRpcGxlIHJlc2l6ZXMuXG4gICAgIHwgICAgIC8vIFNlZSB0aGUgZXhwbGFuYXRpb24gaW4gdGhlIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIGV4YW1wbGVcbiAgICAgfCAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgfCAgICAgbWF4UGVyRWxlbWVudDogMSxcbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHJlc2l6YWJsZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0UGVyQWN0aW9uKCdyZXNpemUnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuc2V0T25FdmVudHMoJ3Jlc2l6ZScsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICBpZiAoL154JHxeeSR8Xnh5JC8udGVzdChvcHRpb25zLmF4aXMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5heGlzID0gb3B0aW9ucy5heGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5heGlzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5heGlzID0gc2NvcGUuZGVmYXVsdE9wdGlvbnMucmVzaXplLmF4aXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucy5zcXVhcmUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5zcXVhcmUgPSBvcHRpb25zLnNxdWFyZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9ucztcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXNpemU7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuc3F1YXJlUmVzaXplXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhIGBzcXVhcmU6IHRydWUgfHwgZmFsc2VgIHByb3BlcnR5IHRvIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWRcbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHJlc2l6aW5nIGlzIGZvcmNlZCAxOjEgYXNwZWN0XG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgQ3VycmVudCBzZXR0aW5nXG4gICAgICpcbiAgICAgKiBvclxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbFxuICAgICA9IChvYmplY3QpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBzcXVhcmVSZXNpemU6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5zcXVhcmUgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMucmVzaXplLnNxdWFyZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnJlc2l6ZS5zcXVhcmU7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZ2VzdHVyYWJsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciBtdWx0aXRvdWNoIGdlc3R1cmVzIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlXG4gICAgICogSW50ZXJhY3RhYmxlJ3MgZWxlbWVudFxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIEluZGljYXRlcyBpZiB0aGlzIGNhbiBiZSB0aGUgdGFyZ2V0IG9mIGdlc3R1cmUgZXZlbnRzXG4gICAgIHwgdmFyIGlzR2VzdHVyZWFibGUgPSBpbnRlcmFjdChlbGVtZW50KS5nZXN0dXJhYmxlKCk7XG4gICAgICogb3JcbiAgICAgLSBvcHRpb25zIChib29sZWFuIHwgb2JqZWN0KSAjb3B0aW9uYWwgdHJ1ZS9mYWxzZSBvciBBbiBvYmplY3Qgd2l0aCBldmVudCBsaXN0ZW5lcnMgdG8gYmUgZmlyZWQgb24gZ2VzdHVyZSBldmVudHMgKG1ha2VzIHRoZSBJbnRlcmFjdGFibGUgZ2VzdHVyYWJsZSlcbiAgICAgPSAob2JqZWN0KSB0aGlzIEludGVyYWN0YWJsZVxuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmdlc3R1cmFibGUoe1xuICAgICB8ICAgICBvbnN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8XG4gICAgIHwgICAgIC8vIGxpbWl0IG11bHRpcGxlIGdlc3R1cmVzLlxuICAgICB8ICAgICAvLyBTZWUgdGhlIGV4cGxhbmF0aW9uIGluIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIGV4YW1wbGVcbiAgICAgfCAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgfCAgICAgbWF4UGVyRWxlbWVudDogMSxcbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIGdlc3R1cmFibGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdlc3R1cmUuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oJ2dlc3R1cmUnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuc2V0T25FdmVudHMoJ2dlc3R1cmUnLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ2VzdHVyZS5lbmFibGVkID0gb3B0aW9ucztcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmdlc3R1cmU7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuYXV0b1Njcm9sbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZC4gQWRkIGFuIGBhdXRvc2Nyb2xsYCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3RcbiAgICAgKiBwYXNzZWQgdG8gQEludGVyYWN0YWJsZS5kcmFnZ2FibGUgb3IgQEludGVyYWN0YWJsZS5yZXNpemFibGUgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGRyYWdnaW5nIGFuZCByZXNpemluZyBuZWFyIHRoZSBlZGdlcyBvZiB0aGVcbiAgICAgKiB3aW5kb3cvY29udGFpbmVyIHRyaWdnZXIgYXV0b1Njcm9sbCBmb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICA9IChvYmplY3QpIE9iamVjdCB3aXRoIGF1dG9TY3JvbGwgcHJvcGVydGllc1xuICAgICAqXG4gICAgICogb3JcbiAgICAgKlxuICAgICAtIG9wdGlvbnMgKG9iamVjdCB8IGJvb2xlYW4pICNvcHRpb25hbFxuICAgICAqIG9wdGlvbnMgY2FuIGJlOlxuICAgICAqIC0gYW4gb2JqZWN0IHdpdGggbWFyZ2luLCBkaXN0YW5jZSBhbmQgaW50ZXJ2YWwgcHJvcGVydGllcyxcbiAgICAgKiAtIHRydWUgb3IgZmFsc2UgdG8gZW5hYmxlIG9yIGRpc2FibGUgYXV0b1Njcm9sbCBvclxuICAgICA9IChJbnRlcmFjdGFibGUpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBhdXRvU2Nyb2xsOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB1dGlscy5leHRlbmQoeyBhY3Rpb25zOiBbJ2RyYWcnLCAncmVzaXplJ119LCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IGFjdGlvbnM6IFsnZHJhZycsICdyZXNpemUnXSwgZW5hYmxlZDogb3B0aW9ucyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0T3B0aW9ucygnYXV0b1Njcm9sbCcsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnNuYXBcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhIGBzbmFwYCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3QgcGFzc2VkXG4gICAgICogdG8gQEludGVyYWN0YWJsZS5kcmFnZ2FibGUgb3IgQEludGVyYWN0YWJsZS5yZXNpemFibGUgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyBpZiBhbmQgaG93IGFjdGlvbiBjb29yZGluYXRlcyBhcmUgc25hcHBlZC4gQnlcbiAgICAgKiBkZWZhdWx0LCBzbmFwcGluZyBpcyByZWxhdGl2ZSB0byB0aGUgcG9pbnRlciBjb29yZGluYXRlcy4gWW91IGNhblxuICAgICAqIGNoYW5nZSB0aGlzIGJ5IHNldHRpbmcgdGhlXG4gICAgICogW2BlbGVtZW50T3JpZ2luYF0oaHR0cHM6Ly9naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvcHVsbC83MikuXG4gICAgICoqXG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIGBmYWxzZWAgaWYgc25hcCBpcyBkaXNhYmxlZDsgb2JqZWN0IHdpdGggc25hcCBwcm9wZXJ0aWVzIGlmIHNuYXAgaXMgZW5hYmxlZFxuICAgICAqKlxuICAgICAqIG9yXG4gICAgICoqXG4gICAgIC0gb3B0aW9ucyAob2JqZWN0IHwgYm9vbGVhbiB8IG51bGwpICNvcHRpb25hbFxuICAgICA9IChJbnRlcmFjdGFibGUpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgID4gVXNhZ2VcbiAgICAgfCBpbnRlcmFjdChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdGhpbmcnKSkuc25hcCh7XG4gICAgIHwgICAgIHRhcmdldHM6IFtcbiAgICAgfCAgICAgICAgIC8vIHNuYXAgdG8gdGhpcyBzcGVjaWZpYyBwb2ludFxuICAgICB8ICAgICAgICAge1xuICAgICB8ICAgICAgICAgICAgIHg6IDEwMCxcbiAgICAgfCAgICAgICAgICAgICB5OiAxMDAsXG4gICAgIHwgICAgICAgICAgICAgcmFuZ2U6IDI1XG4gICAgIHwgICAgICAgICB9LFxuICAgICB8ICAgICAgICAgLy8gZ2l2ZSB0aGlzIGZ1bmN0aW9uIHRoZSB4IGFuZCB5IHBhZ2UgY29vcmRzIGFuZCBzbmFwIHRvIHRoZSBvYmplY3QgcmV0dXJuZWRcbiAgICAgfCAgICAgICAgIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgIHwgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgfCAgICAgICAgICAgICAgICAgeDogeCxcbiAgICAgfCAgICAgICAgICAgICAgICAgeTogKDc1ICsgNTAgKiBNYXRoLnNpbih4ICogMC4wNCkpLFxuICAgICB8ICAgICAgICAgICAgICAgICByYW5nZTogNDBcbiAgICAgfCAgICAgICAgICAgICB9O1xuICAgICB8ICAgICAgICAgfSxcbiAgICAgfCAgICAgICAgIC8vIGNyZWF0ZSBhIGZ1bmN0aW9uIHRoYXQgc25hcHMgdG8gYSBncmlkXG4gICAgIHwgICAgICAgICBpbnRlcmFjdC5jcmVhdGVTbmFwR3JpZCh7XG4gICAgIHwgICAgICAgICAgICAgeDogNTAsXG4gICAgIHwgICAgICAgICAgICAgeTogNTAsXG4gICAgIHwgICAgICAgICAgICAgcmFuZ2U6IDEwLCAgICAgICAgICAgICAgLy8gb3B0aW9uYWxcbiAgICAgfCAgICAgICAgICAgICBvZmZzZXQ6IHsgeDogNSwgeTogMTAgfSAvLyBvcHRpb25hbFxuICAgICB8ICAgICAgICAgfSlcbiAgICAgfCAgICAgXSxcbiAgICAgfCAgICAgLy8gZG8gbm90IHNuYXAgZHVyaW5nIG5vcm1hbCBtb3ZlbWVudC5cbiAgICAgfCAgICAgLy8gSW5zdGVhZCwgdHJpZ2dlciBvbmx5IG9uZSBzbmFwcGVkIG1vdmUgZXZlbnRcbiAgICAgfCAgICAgLy8gaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBlbmQgZXZlbnQuXG4gICAgIHwgICAgIGVuZE9ubHk6IHRydWUsXG4gICAgIHxcbiAgICAgfCAgICAgcmVsYXRpdmVQb2ludHM6IFtcbiAgICAgfCAgICAgICAgIHsgeDogMCwgeTogMCB9LCAgLy8gc25hcCByZWxhdGl2ZSB0byB0aGUgdG9wIGxlZnQgb2YgdGhlIGVsZW1lbnRcbiAgICAgfCAgICAgICAgIHsgeDogMSwgeTogMSB9LCAgLy8gYW5kIGFsc28gdG8gdGhlIGJvdHRvbSByaWdodFxuICAgICB8ICAgICBdLFxuICAgICB8XG4gICAgIHwgICAgIC8vIG9mZnNldCB0aGUgc25hcCB0YXJnZXQgY29vcmRpbmF0ZXNcbiAgICAgfCAgICAgLy8gY2FuIGJlIGFuIG9iamVjdCB3aXRoIHgveSBvciAnc3RhcnRDb29yZHMnXG4gICAgIHwgICAgIG9mZnNldDogeyB4OiA1MCwgeTogNTAgfVxuICAgICB8ICAgfVxuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgc25hcDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJldCA9IHRoaXMuc2V0T3B0aW9ucygnc25hcCcsIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmIChyZXQgPT09IHRoaXMpIHsgcmV0dXJuIHRoaXM7IH1cblxuICAgICAgICByZXR1cm4gcmV0LmRyYWc7XG4gICAgfSxcblxuICAgIHNldE9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBvcHRpb25zICYmIHNjb3BlLmlzQXJyYXkob3B0aW9ucy5hY3Rpb25zKVxuICAgICAgICAgICAgPyBvcHRpb25zLmFjdGlvbnNcbiAgICAgICAgICAgIDogWydkcmFnJ107XG5cbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpIHx8IHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0gL3Jlc2l6ZS8udGVzdChhY3Rpb25zW2ldKT8gJ3Jlc2l6ZScgOiBhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS5pc09iamVjdCh0aGlzLm9wdGlvbnNbYWN0aW9uXSkpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgICAgIHZhciB0aGlzT3B0aW9uID0gdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXTtcblxuICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5leHRlbmQodGhpc09wdGlvbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24uZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb24gPT09ICdzbmFwJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNPcHRpb24ubW9kZSA9PT0gJ2dyaWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi50YXJnZXRzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdC5jcmVhdGVTbmFwR3JpZCh1dGlscy5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiB0aGlzT3B0aW9uLmdyaWRPZmZzZXQgfHwgeyB4OiAwLCB5OiAwIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgdGhpc09wdGlvbi5ncmlkIHx8IHt9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpc09wdGlvbi5tb2RlID09PSAnYW5jaG9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24udGFyZ2V0cyA9IHRoaXNPcHRpb24uYW5jaG9ycztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXNPcHRpb24ubW9kZSA9PT0gJ3BhdGgnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi50YXJnZXRzID0gdGhpc09wdGlvbi5wYXRocztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdlbGVtZW50T3JpZ2luJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi5yZWxhdGl2ZVBvaW50cyA9IFtvcHRpb25zLmVsZW1lbnRPcmlnaW5dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLmVuYWJsZWQgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmV0ID0ge30sXG4gICAgICAgICAgICBhbGxBY3Rpb25zID0gWydkcmFnJywgJ3Jlc2l6ZScsICdnZXN0dXJlJ107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFsbEFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChvcHRpb24gaW4gc2NvcGUuZGVmYXVsdE9wdGlvbnNbYWxsQWN0aW9uc1tpXV0pIHtcbiAgICAgICAgICAgICAgICByZXRbYWxsQWN0aW9uc1tpXV0gPSB0aGlzLm9wdGlvbnNbYWxsQWN0aW9uc1tpXV1bb3B0aW9uXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcblxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5pbmVydGlhXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkLiBBZGQgYW4gYGluZXJ0aWFgIHByb3BlcnR5IHRvIHRoZSBvcHRpb25zIG9iamVjdCBwYXNzZWRcbiAgICAgKiB0byBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBvciBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIGlmIGFuZCBob3cgZXZlbnRzIGNvbnRpbnVlIHRvIHJ1biBhZnRlciB0aGUgcG9pbnRlciBpcyByZWxlYXNlZFxuICAgICAqKlxuICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBgZmFsc2VgIGlmIGluZXJ0aWEgaXMgZGlzYWJsZWQ7IGBvYmplY3RgIHdpdGggaW5lcnRpYSBwcm9wZXJ0aWVzIGlmIGluZXJ0aWEgaXMgZW5hYmxlZFxuICAgICAqKlxuICAgICAqIG9yXG4gICAgICoqXG4gICAgIC0gb3B0aW9ucyAob2JqZWN0IHwgYm9vbGVhbiB8IG51bGwpICNvcHRpb25hbFxuICAgICA9IChJbnRlcmFjdGFibGUpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgID4gVXNhZ2VcbiAgICAgfCAvLyBlbmFibGUgYW5kIHVzZSBkZWZhdWx0IHNldHRpbmdzXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaW5lcnRpYSh0cnVlKTtcbiAgICAgfFxuICAgICB8IC8vIGVuYWJsZSBhbmQgdXNlIGN1c3RvbSBzZXR0aW5nc1xuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmluZXJ0aWEoe1xuICAgICB8ICAgICAvLyB2YWx1ZSBncmVhdGVyIHRoYW4gMFxuICAgICB8ICAgICAvLyBoaWdoIHZhbHVlcyBzbG93IHRoZSBvYmplY3QgZG93biBtb3JlIHF1aWNrbHlcbiAgICAgfCAgICAgcmVzaXN0YW5jZSAgICAgOiAxNixcbiAgICAgfFxuICAgICB8ICAgICAvLyB0aGUgbWluaW11bSBsYXVuY2ggc3BlZWQgKHBpeGVscyBwZXIgc2Vjb25kKSB0aGF0IHJlc3VsdHMgaW4gaW5lcnRpYSBzdGFydFxuICAgICB8ICAgICBtaW5TcGVlZCAgICAgICA6IDIwMCxcbiAgICAgfFxuICAgICB8ICAgICAvLyBpbmVydGlhIHdpbGwgc3RvcCB3aGVuIHRoZSBvYmplY3Qgc2xvd3MgZG93biB0byB0aGlzIHNwZWVkXG4gICAgIHwgICAgIGVuZFNwZWVkICAgICAgIDogMjAsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gYm9vbGVhbjsgc2hvdWxkIGFjdGlvbnMgYmUgcmVzdW1lZCB3aGVuIHRoZSBwb2ludGVyIGdvZXMgZG93biBkdXJpbmcgaW5lcnRpYVxuICAgICB8ICAgICBhbGxvd1Jlc3VtZSAgICA6IHRydWUsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gYm9vbGVhbjsgc2hvdWxkIHRoZSBqdW1wIHdoZW4gcmVzdW1pbmcgZnJvbSBpbmVydGlhIGJlIGlnbm9yZWQgaW4gZXZlbnQuZHgvZHlcbiAgICAgfCAgICAgemVyb1Jlc3VtZURlbHRhOiBmYWxzZSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBpZiBzbmFwL3Jlc3RyaWN0IGFyZSBzZXQgdG8gYmUgZW5kT25seSBhbmQgaW5lcnRpYSBpcyBlbmFibGVkLCByZWxlYXNpbmdcbiAgICAgfCAgICAgLy8gdGhlIHBvaW50ZXIgd2l0aG91dCB0cmlnZ2VyaW5nIGluZXJ0aWEgd2lsbCBhbmltYXRlIGZyb20gdGhlIHJlbGVhc2VcbiAgICAgfCAgICAgLy8gcG9pbnQgdG8gdGhlIHNuYXBlZC9yZXN0cmljdGVkIHBvaW50IGluIHRoZSBnaXZlbiBhbW91bnQgb2YgdGltZSAobXMpXG4gICAgIHwgICAgIHNtb290aEVuZER1cmF0aW9uOiAzMDAsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gYW4gYXJyYXkgb2YgYWN0aW9uIHR5cGVzIHRoYXQgY2FuIGhhdmUgaW5lcnRpYSAobm8gZ2VzdHVyZSlcbiAgICAgfCAgICAgYWN0aW9ucyAgICAgICAgOiBbJ2RyYWcnLCAncmVzaXplJ11cbiAgICAgfCB9KTtcbiAgICAgfFxuICAgICB8IC8vIHJlc2V0IGN1c3RvbSBzZXR0aW5ncyBhbmQgdXNlIGFsbCBkZWZhdWx0c1xuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmluZXJ0aWEobnVsbCk7XG4gICAgIFxcKi9cbiAgICBpbmVydGlhOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgcmV0ID0gdGhpcy5zZXRPcHRpb25zKCdpbmVydGlhJywgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKHJldCA9PT0gdGhpcykgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgIHJldHVybiByZXQuZHJhZztcbiAgICB9LFxuXG4gICAgZ2V0QWN0aW9uOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGludGVyYWN0aW9uLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLmRlZmF1bHRBY3Rpb25DaGVja2VyKHBvaW50ZXIsIGludGVyYWN0aW9uLCBlbGVtZW50KTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcihwb2ludGVyLCBldmVudCwgYWN0aW9uLCB0aGlzLCBlbGVtZW50LCBpbnRlcmFjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0QWN0aW9uQ2hlY2tlcjogZGVmYXVsdEFjdGlvbkNoZWNrZXIsXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmFjdGlvbkNoZWNrZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBmdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb25cbiAgICAgKiBwb2ludGVyRG93blxuICAgICAqXG4gICAgIC0gY2hlY2tlciAoZnVuY3Rpb24gfCBudWxsKSAjb3B0aW9uYWwgQSBmdW5jdGlvbiB3aGljaCB0YWtlcyBhIHBvaW50ZXIgZXZlbnQsIGRlZmF1bHRBY3Rpb24gc3RyaW5nLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQgYW5kIGludGVyYWN0aW9uIGFzIHBhcmFtZXRlcnMgYW5kIHJldHVybnMgYW4gb2JqZWN0IHdpdGggbmFtZSBwcm9wZXJ0eSAnZHJhZycgJ3Jlc2l6ZScgb3IgJ2dlc3R1cmUnIGFuZCBvcHRpb25hbGx5IGFuIGBlZGdlc2Agb2JqZWN0IHdpdGggYm9vbGVhbiAndG9wJywgJ2xlZnQnLCAnYm90dG9tJyBhbmQgcmlnaHQgcHJvcHMuXG4gICAgID0gKEZ1bmN0aW9uIHwgSW50ZXJhY3RhYmxlKSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgIHwgaW50ZXJhY3QoJy5yZXNpemUtZHJhZycpXG4gICAgIHwgICAucmVzaXphYmxlKHRydWUpXG4gICAgIHwgICAuZHJhZ2dhYmxlKHRydWUpXG4gICAgIHwgICAuYWN0aW9uQ2hlY2tlcihmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBpbnRlcmFjdGlvbikge1xuICAgICB8XG4gICAgIHwgICBpZiAoaW50ZXJhY3QubWF0Y2hlc1NlbGVjdG9yKGV2ZW50LnRhcmdldCwgJy5kcmFnLWhhbmRsZScpIHtcbiAgICAgfCAgICAgLy8gZm9yY2UgZHJhZyB3aXRoIGhhbmRsZSB0YXJnZXRcbiAgICAgfCAgICAgYWN0aW9uLm5hbWUgPSBkcmFnO1xuICAgICB8ICAgfVxuICAgICB8ICAgZWxzZSB7XG4gICAgIHwgICAgIC8vIHJlc2l6ZSBmcm9tIHRoZSB0b3AgYW5kIHJpZ2h0IGVkZ2VzXG4gICAgIHwgICAgIGFjdGlvbi5uYW1lICA9ICdyZXNpemUnO1xuICAgICB8ICAgICBhY3Rpb24uZWRnZXMgPSB7IHRvcDogdHJ1ZSwgcmlnaHQ6IHRydWUgfTtcbiAgICAgfCAgIH1cbiAgICAgfFxuICAgICB8ICAgcmV0dXJuIGFjdGlvbjtcbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIGFjdGlvbkNoZWNrZXI6IGZ1bmN0aW9uIChjaGVja2VyKSB7XG4gICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKGNoZWNrZXIpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlciA9IGNoZWNrZXI7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcjtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXI7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZ2V0UmVjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCBmdW5jdGlvbiB0byBnZXQgYW4gSW50ZXJhY3RhYmxlcyBib3VuZGluZyByZWN0LiBDYW4gYmVcbiAgICAgKiBvdmVycmlkZGVuIHVzaW5nIEBJbnRlcmFjdGFibGUucmVjdENoZWNrZXIuXG4gICAgICpcbiAgICAgLSBlbGVtZW50IChFbGVtZW50KSAjb3B0aW9uYWwgVGhlIGVsZW1lbnQgdG8gbWVhc3VyZS5cbiAgICAgPSAob2JqZWN0KSBUaGUgb2JqZWN0J3MgYm91bmRpbmcgcmVjdGFuZ2xlLlxuICAgICBvIHtcbiAgICAgbyAgICAgdG9wICAgOiAwLFxuICAgICBvICAgICBsZWZ0ICA6IDAsXG4gICAgIG8gICAgIGJvdHRvbTogMCxcbiAgICAgbyAgICAgcmlnaHQgOiAwLFxuICAgICBvICAgICB3aWR0aCA6IDAsXG4gICAgIG8gICAgIGhlaWdodDogMFxuICAgICBvIH1cbiAgICAgXFwqL1xuICAgIGdldFJlY3Q6IGZ1bmN0aW9uIHJlY3RDaGVjayAoZWxlbWVudCkge1xuICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCB0aGlzLl9lbGVtZW50O1xuXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdG9yICYmICEodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuX2NvbnRleHQucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY29wZS5nZXRFbGVtZW50UmVjdChlbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5yZWN0Q2hlY2tlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSBpbnRlcmFjdGFibGUnc1xuICAgICAqIGVsZW1lbnQncyByZWN0YW5nbGVcbiAgICAgKlxuICAgICAtIGNoZWNrZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgQSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoaXMgSW50ZXJhY3RhYmxlJ3MgYm91bmRpbmcgcmVjdGFuZ2xlLiBTZWUgQEludGVyYWN0YWJsZS5nZXRSZWN0XG4gICAgID0gKGZ1bmN0aW9uIHwgb2JqZWN0KSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgcmVjdENoZWNrZXI6IGZ1bmN0aW9uIChjaGVja2VyKSB7XG4gICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKGNoZWNrZXIpKSB7XG4gICAgICAgICAgICB0aGlzLmdldFJlY3QgPSBjaGVja2VyO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmdldFJlY3Q7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVjdDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5zdHlsZUN1cnNvclxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0aGUgYWN0aW9uIHRoYXQgd291bGQgYmUgcGVyZm9ybWVkIHdoZW4gdGhlXG4gICAgICogbW91c2Ugb24gdGhlIGVsZW1lbnQgYXJlIGNoZWNrZWQgb24gYG1vdXNlbW92ZWAgc28gdGhhdCB0aGUgY3Vyc29yXG4gICAgICogbWF5IGJlIHN0eWxlZCBhcHByb3ByaWF0ZWx5XG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsXG4gICAgID0gKGJvb2xlYW4gfCBJbnRlcmFjdGFibGUpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIHN0eWxlQ3Vyc29yOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvciA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvcjtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnByZXZlbnREZWZhdWx0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRvIHByZXZlbnQgdGhlIGJyb3dzZXIncyBkZWZhdWx0IGJlaGF2aW91clxuICAgICAqIGluIHJlc3BvbnNlIHRvIHBvaW50ZXIgZXZlbnRzLiBDYW4gYmUgc2V0IHRvOlxuICAgICAqICAtIGAnYWx3YXlzJ2AgdG8gYWx3YXlzIHByZXZlbnRcbiAgICAgKiAgLSBgJ25ldmVyJ2AgdG8gbmV2ZXIgcHJldmVudFxuICAgICAqICAtIGAnYXV0bydgIHRvIGxldCBpbnRlcmFjdC5qcyB0cnkgdG8gZGV0ZXJtaW5lIHdoYXQgd291bGQgYmUgYmVzdFxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKHN0cmluZykgI29wdGlvbmFsIGB0cnVlYCwgYGZhbHNlYCBvciBgJ2F1dG8nYFxuICAgICA9IChzdHJpbmcgfCBJbnRlcmFjdGFibGUpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKC9eKGFsd2F5c3xuZXZlcnxhdXRvKSQvLnRlc3QobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucHJldmVudERlZmF1bHQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCA9IG5ld1ZhbHVlPyAnYWx3YXlzJyA6ICduZXZlcic7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMucHJldmVudERlZmF1bHQ7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUub3JpZ2luXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgb3JpZ2luIG9mIHRoZSBJbnRlcmFjdGFibGUncyBlbGVtZW50LiAgVGhlIHggYW5kIHlcbiAgICAgKiBvZiB0aGUgb3JpZ2luIHdpbGwgYmUgc3VidHJhY3RlZCBmcm9tIGFjdGlvbiBldmVudCBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAtIG9yaWdpbiAob2JqZWN0IHwgc3RyaW5nKSAjb3B0aW9uYWwgQW4gb2JqZWN0IGVnLiB7IHg6IDAsIHk6IDAgfSBvciBzdHJpbmcgJ3BhcmVudCcsICdzZWxmJyBvciBhbnkgQ1NTIHNlbGVjdG9yXG4gICAgICogT1JcbiAgICAgLSBvcmlnaW4gKEVsZW1lbnQpICNvcHRpb25hbCBBbiBIVE1MIG9yIFNWRyBFbGVtZW50IHdob3NlIHJlY3Qgd2lsbCBiZSB1c2VkXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgVGhlIGN1cnJlbnQgb3JpZ2luIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBvcmlnaW46IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUudHJ5U2VsZWN0b3IobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMub3JpZ2luID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY29wZS5pc09iamVjdChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vcmlnaW4gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5vcmlnaW47XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZGVsdGFTb3VyY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtb3VzZSBjb29yZGluYXRlIHR5cGVzIHVzZWQgdG8gY2FsY3VsYXRlIHRoZVxuICAgICAqIG1vdmVtZW50IG9mIHRoZSBwb2ludGVyLlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKHN0cmluZykgI29wdGlvbmFsIFVzZSAnY2xpZW50JyBpZiB5b3Ugd2lsbCBiZSBzY3JvbGxpbmcgd2hpbGUgaW50ZXJhY3Rpbmc7IFVzZSAncGFnZScgaWYgeW91IHdhbnQgYXV0b1Njcm9sbCB0byB3b3JrXG4gICAgID0gKHN0cmluZyB8IG9iamVjdCkgVGhlIGN1cnJlbnQgZGVsdGFTb3VyY2Ugb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGRlbHRhU291cmNlOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSAncGFnZScgfHwgbmV3VmFsdWUgPT09ICdjbGllbnQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2UgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRlbHRhU291cmNlO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnJlc3RyaWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkLiBBZGQgYSBgcmVzdHJpY3RgIHByb3BlcnR5IHRvIHRoZSBvcHRpb25zIG9iamVjdCBwYXNzZWQgdG9cbiAgICAgKiBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSwgQEludGVyYWN0YWJsZS5yZXNpemFibGUgb3IgQEludGVyYWN0YWJsZS5nZXN0dXJhYmxlIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIHJlY3RhbmdsZXMgd2l0aGluIHdoaWNoIGFjdGlvbnMgb24gdGhpc1xuICAgICAqIGludGVyYWN0YWJsZSAoYWZ0ZXIgc25hcCBjYWxjdWxhdGlvbnMpIGFyZSByZXN0cmljdGVkLiBCeSBkZWZhdWx0LFxuICAgICAqIHJlc3RyaWN0aW5nIGlzIHJlbGF0aXZlIHRvIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzLiBZb3UgY2FuIGNoYW5nZVxuICAgICAqIHRoaXMgYnkgc2V0dGluZyB0aGVcbiAgICAgKiBbYGVsZW1lbnRSZWN0YF0oaHR0cHM6Ly9naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvcHVsbC83MikuXG4gICAgICoqXG4gICAgIC0gb3B0aW9ucyAob2JqZWN0KSAjb3B0aW9uYWwgYW4gb2JqZWN0IHdpdGgga2V5cyBkcmFnLCByZXNpemUsIGFuZC9vciBnZXN0dXJlIHdob3NlIHZhbHVlcyBhcmUgcmVjdHMsIEVsZW1lbnRzLCBDU1Mgc2VsZWN0b3JzLCBvciAncGFyZW50JyBvciAnc2VsZidcbiAgICAgPSAob2JqZWN0KSBUaGUgY3VycmVudCByZXN0cmljdGlvbnMgb2JqZWN0IG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICoqXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkucmVzdHJpY3Qoe1xuICAgICB8ICAgICAvLyB0aGUgcmVjdCB3aWxsIGJlIGBpbnRlcmFjdC5nZXRFbGVtZW50UmVjdChlbGVtZW50LnBhcmVudE5vZGUpYFxuICAgICB8ICAgICBkcmFnOiBlbGVtZW50LnBhcmVudE5vZGUsXG4gICAgIHxcbiAgICAgfCAgICAgLy8geCBhbmQgeSBhcmUgcmVsYXRpdmUgdG8gdGhlIHRoZSBpbnRlcmFjdGFibGUncyBvcmlnaW5cbiAgICAgfCAgICAgcmVzaXplOiB7IHg6IDEwMCwgeTogMTAwLCB3aWR0aDogMjAwLCBoZWlnaHQ6IDIwMCB9XG4gICAgIHwgfSlcbiAgICAgfFxuICAgICB8IGludGVyYWN0KCcuZHJhZ2dhYmxlJykucmVzdHJpY3Qoe1xuICAgICB8ICAgICAvLyB0aGUgcmVjdCB3aWxsIGJlIHRoZSBzZWxlY3RlZCBlbGVtZW50J3MgcGFyZW50XG4gICAgIHwgICAgIGRyYWc6ICdwYXJlbnQnLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGRvIG5vdCByZXN0cmljdCBkdXJpbmcgbm9ybWFsIG1vdmVtZW50LlxuICAgICB8ICAgICAvLyBJbnN0ZWFkLCB0cmlnZ2VyIG9ubHkgb25lIHJlc3RyaWN0ZWQgbW92ZSBldmVudFxuICAgICB8ICAgICAvLyBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGVuZCBldmVudC5cbiAgICAgfCAgICAgZW5kT25seTogdHJ1ZSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9wdWxsLzcyI2lzc3VlLTQxODEzNDkzXG4gICAgIHwgICAgIGVsZW1lbnRSZWN0OiB7IHRvcDogMCwgbGVmdDogMCwgYm90dG9tOiAxLCByaWdodDogMSB9XG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICByZXN0cmljdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0T3B0aW9ucygncmVzdHJpY3QnLCBvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhY3Rpb25zID0gWydkcmFnJywgJ3Jlc2l6ZScsICdnZXN0dXJlJ10sXG4gICAgICAgICAgICByZXQ7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYWN0aW9uc1tpXTtcblxuICAgICAgICAgICAgaWYgKGFjdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBlckFjdGlvbiA9IHV0aWxzLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFthY3Rpb25dLFxuICAgICAgICAgICAgICAgICAgICByZXN0cmljdGlvbjogb3B0aW9uc1thY3Rpb25dXG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICByZXQgPSB0aGlzLnNldE9wdGlvbnMoJ3Jlc3RyaWN0JywgcGVyQWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuY29udGV4dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIHRoZSBzZWxlY3RvciBjb250ZXh0IE5vZGUgb2YgdGhlIEludGVyYWN0YWJsZS4gVGhlIGRlZmF1bHQgaXMgYHdpbmRvdy5kb2N1bWVudGAuXG4gICAgICpcbiAgICAgPSAoTm9kZSkgVGhlIGNvbnRleHQgTm9kZSBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqKlxuICAgICBcXCovXG4gICAgY29udGV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICB9LFxuXG4gICAgX2NvbnRleHQ6IHNjb3BlLmRvY3VtZW50LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5pZ25vcmVGcm9tXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIElmIHRoZSB0YXJnZXQgb2YgdGhlIGBtb3VzZWRvd25gLCBgcG9pbnRlcmRvd25gIG9yIGB0b3VjaHN0YXJ0YFxuICAgICAqIGV2ZW50IG9yIGFueSBvZiBpdCdzIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvclxuICAgICAqIEVsZW1lbnQsIG5vIGRyYWcvcmVzaXplL2dlc3R1cmUgaXMgc3RhcnRlZC5cbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChzdHJpbmcgfCBFbGVtZW50IHwgbnVsbCkgI29wdGlvbmFsIGEgQ1NTIHNlbGVjdG9yIHN0cmluZywgYW4gRWxlbWVudCBvciBgbnVsbGAgdG8gbm90IGlnbm9yZSBhbnkgZWxlbWVudHNcbiAgICAgPSAoc3RyaW5nIHwgRWxlbWVudCB8IG9iamVjdCkgVGhlIGN1cnJlbnQgaWdub3JlRnJvbSB2YWx1ZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqKlxuICAgICB8IGludGVyYWN0KGVsZW1lbnQsIHsgaWdub3JlRnJvbTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vLWFjdGlvbicpIH0pO1xuICAgICB8IC8vIG9yXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaWdub3JlRnJvbSgnaW5wdXQsIHRleHRhcmVhLCBhJyk7XG4gICAgIFxcKi9cbiAgICBpZ25vcmVGcm9tOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKHNjb3BlLnRyeVNlbGVjdG9yKG5ld1ZhbHVlKSkgeyAgICAgICAgICAgIC8vIENTUyBzZWxlY3RvciB0byBtYXRjaCBldmVudC50YXJnZXRcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pZ25vcmVGcm9tID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlscy5pc0VsZW1lbnQobmV3VmFsdWUpKSB7ICAgICAgICAgICAgICAvLyBzcGVjaWZpYyBlbGVtZW50XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaWdub3JlRnJvbSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmlnbm9yZUZyb207XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuYWxsb3dGcm9tXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEEgZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkIG9ubHkgSWYgdGhlIHRhcmdldCBvZiB0aGVcbiAgICAgKiBgbW91c2Vkb3duYCwgYHBvaW50ZXJkb3duYCBvciBgdG91Y2hzdGFydGAgZXZlbnQgb3IgYW55IG9mIGl0J3NcbiAgICAgKiBwYXJlbnRzIG1hdGNoIHRoZSBnaXZlbiBDU1Mgc2VsZWN0b3Igb3IgRWxlbWVudC5cbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChzdHJpbmcgfCBFbGVtZW50IHwgbnVsbCkgI29wdGlvbmFsIGEgQ1NTIHNlbGVjdG9yIHN0cmluZywgYW4gRWxlbWVudCBvciBgbnVsbGAgdG8gYWxsb3cgZnJvbSBhbnkgZWxlbWVudFxuICAgICA9IChzdHJpbmcgfCBFbGVtZW50IHwgb2JqZWN0KSBUaGUgY3VycmVudCBhbGxvd0Zyb20gdmFsdWUgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50LCB7IGFsbG93RnJvbTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RyYWctaGFuZGxlJykgfSk7XG4gICAgIHwgLy8gb3JcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5hbGxvd0Zyb20oJy5oYW5kbGUnKTtcbiAgICAgXFwqL1xuICAgIGFsbG93RnJvbTogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihuZXdWYWx1ZSkpIHsgICAgICAgICAgICAvLyBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYWxsb3dGcm9tID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlscy5pc0VsZW1lbnQobmV3VmFsdWUpKSB7ICAgICAgICAgICAgICAvLyBzcGVjaWZpYyBlbGVtZW50XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYWxsb3dGcm9tID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYWxsb3dGcm9tO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmVsZW1lbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogSWYgdGhpcyBpcyBub3QgYSBzZWxlY3RvciBJbnRlcmFjdGFibGUsIGl0IHJldHVybnMgdGhlIGVsZW1lbnQgdGhpc1xuICAgICAqIGludGVyYWN0YWJsZSByZXByZXNlbnRzXG4gICAgICpcbiAgICAgPSAoRWxlbWVudCkgSFRNTCAvIFNWRyBFbGVtZW50XG4gICAgIFxcKi9cbiAgICBlbGVtZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmZpcmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQ2FsbHMgbGlzdGVuZXJzIGZvciB0aGUgZ2l2ZW4gSW50ZXJhY3RFdmVudCB0eXBlIGJvdW5kIGdsb2JhbGx5XG4gICAgICogYW5kIGRpcmVjdGx5IHRvIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgLSBpRXZlbnQgKEludGVyYWN0RXZlbnQpIFRoZSBJbnRlcmFjdEV2ZW50IG9iamVjdCB0byBiZSBmaXJlZCBvbiB0aGlzIEludGVyYWN0YWJsZVxuICAgICA9IChJbnRlcmFjdGFibGUpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBmaXJlOiBmdW5jdGlvbiAoaUV2ZW50KSB7XG4gICAgICAgIGlmICghKGlFdmVudCAmJiBpRXZlbnQudHlwZSkgfHwgIXNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIGlFdmVudC50eXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGlzdGVuZXJzLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIG9uRXZlbnQgPSAnb24nICsgaUV2ZW50LnR5cGUsXG4gICAgICAgICAgICBmdW5jTmFtZSA9ICcnO1xuXG4gICAgICAgIC8vIEludGVyYWN0YWJsZSNvbigpIGxpc3RlbmVyc1xuICAgICAgICBpZiAoaUV2ZW50LnR5cGUgaW4gdGhpcy5faUV2ZW50cykge1xuICAgICAgICAgICAgbGlzdGVuZXJzID0gdGhpcy5faUV2ZW50c1tpRXZlbnQudHlwZV07XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW4gJiYgIWlFdmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGZ1bmNOYW1lID0gbGlzdGVuZXJzW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2ldKGlFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbnRlcmFjdGFibGUub25ldmVudCBsaXN0ZW5lclxuICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbih0aGlzW29uRXZlbnRdKSkge1xuICAgICAgICAgICAgZnVuY05hbWUgPSB0aGlzW29uRXZlbnRdLm5hbWU7XG4gICAgICAgICAgICB0aGlzW29uRXZlbnRdKGlFdmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbnRlcmFjdC5vbigpIGxpc3RlbmVyc1xuICAgICAgICBpZiAoaUV2ZW50LnR5cGUgaW4gc2NvcGUuZ2xvYmFsRXZlbnRzICYmIChsaXN0ZW5lcnMgPSBzY29wZS5nbG9iYWxFdmVudHNbaUV2ZW50LnR5cGVdKSkgIHtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbiAmJiAhaUV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZnVuY05hbWUgPSBsaXN0ZW5lcnNbaV0ubmFtZTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0oaUV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLm9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEJpbmRzIGEgbGlzdGVuZXIgZm9yIGFuIEludGVyYWN0RXZlbnQgb3IgRE9NIGV2ZW50LlxuICAgICAqXG4gICAgIC0gZXZlbnRUeXBlICAoc3RyaW5nIHwgYXJyYXkgfCBvYmplY3QpIFRoZSB0eXBlcyBvZiBldmVudHMgdG8gbGlzdGVuIGZvclxuICAgICAtIGxpc3RlbmVyICAgKGZ1bmN0aW9uKSBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHRoZSBnaXZlbiBldmVudChzKVxuICAgICAtIHVzZUNhcHR1cmUgKGJvb2xlYW4pICNvcHRpb25hbCB1c2VDYXB0dXJlIGZsYWcgZm9yIGFkZEV2ZW50TGlzdGVuZXJcbiAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgb246IGZ1bmN0aW9uIChldmVudFR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhldmVudFR5cGUpICYmIGV2ZW50VHlwZS5zZWFyY2goJyAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IGV2ZW50VHlwZS50cmltKCkuc3BsaXQoLyArLyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNBcnJheShldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnRUeXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbihldmVudFR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3QoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBldmVudFR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uKHByb3AsIGV2ZW50VHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICd3aGVlbCcpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IHNjb3BlLndoZWVsRXZlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb252ZXJ0IHRvIGJvb2xlYW5cbiAgICAgICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgICAgIGlmIChzY29wZS5jb250YWlucyhzY29wZS5ldmVudFR5cGVzLCBldmVudFR5cGUpKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIHR5cGUgb2YgZXZlbnQgd2FzIG5ldmVyIGJvdW5kIHRvIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgICAgICBpZiAoIShldmVudFR5cGUgaW4gdGhpcy5faUV2ZW50cykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pRXZlbnRzW2V2ZW50VHlwZV0gPSBbbGlzdGVuZXJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faUV2ZW50c1tldmVudFR5cGVdLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGRlbGVnYXRlZCBldmVudCBmb3Igc2VsZWN0b3JcbiAgICAgICAgZWxzZSBpZiAodGhpcy5zZWxlY3Rvcikge1xuICAgICAgICAgICAgaWYgKCFzY29wZS5kZWxlZ2F0ZWRFdmVudHNbZXZlbnRUeXBlXSkge1xuICAgICAgICAgICAgICAgIHNjb3BlLmRlbGVnYXRlZEV2ZW50c1tldmVudFR5cGVdID0ge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnM6IFtdLFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0cyA6IFtdLFxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIGFkZCBkZWxlZ2F0ZSBsaXN0ZW5lciBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2NvcGUuZG9jdW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQoc2NvcGUuZG9jdW1lbnRzW2ldLCBldmVudFR5cGUsIGRlbGVnYXRlTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMuYWRkKHNjb3BlLmRvY3VtZW50c1tpXSwgZXZlbnRUeXBlLCBkZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGRlbGVnYXRlZCA9IHNjb3BlLmRlbGVnYXRlZEV2ZW50c1tldmVudFR5cGVdLFxuICAgICAgICAgICAgICAgIGluZGV4O1xuXG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlbGVnYXRlZC5zZWxlY3RvcnNbaW5kZXhdID09PSB0aGlzLnNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgICYmIGRlbGVnYXRlZC5jb250ZXh0c1tpbmRleF0gPT09IHRoaXMuX2NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5zZWxlY3RvcnMucHVzaCh0aGlzLnNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMgLnB1c2godGhpcy5fY29udGV4dCk7XG4gICAgICAgICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVycy5wdXNoKFtdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8ga2VlcCBsaXN0ZW5lciBhbmQgdXNlQ2FwdHVyZSBmbGFnXG4gICAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzW2luZGV4XS5wdXNoKFtsaXN0ZW5lciwgdXNlQ2FwdHVyZV0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCBldmVudFR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLm9mZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZW1vdmVzIGFuIEludGVyYWN0RXZlbnQgb3IgRE9NIGV2ZW50IGxpc3RlbmVyXG4gICAgICpcbiAgICAgLSBldmVudFR5cGUgIChzdHJpbmcgfCBhcnJheSB8IG9iamVjdCkgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmUgbGlzdGVuZWQgZm9yXG4gICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBiZSByZW1vdmVkXG4gICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBvZmY6IGZ1bmN0aW9uIChldmVudFR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhldmVudFR5cGUpICYmIGV2ZW50VHlwZS5zZWFyY2goJyAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IGV2ZW50VHlwZS50cmltKCkuc3BsaXQoLyArLyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNBcnJheShldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnRUeXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmYoZXZlbnRUeXBlW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmYocHJvcCwgZXZlbnRUeXBlW3Byb3BdLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGV2ZW50TGlzdCxcbiAgICAgICAgICAgIGluZGV4ID0gLTE7XG5cbiAgICAgICAgLy8gY29udmVydCB0byBib29sZWFuXG4gICAgICAgIHVzZUNhcHR1cmUgPSB1c2VDYXB0dXJlPyB0cnVlOiBmYWxzZTtcblxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnd2hlZWwnKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBzY29wZS53aGVlbEV2ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgaXQgaXMgYW4gYWN0aW9uIGV2ZW50IHR5cGVcbiAgICAgICAgaWYgKHNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdCA9IHRoaXMuX2lFdmVudHNbZXZlbnRUeXBlXTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50TGlzdCAmJiAoaW5kZXggPSBzY29wZS5pbmRleE9mKGV2ZW50TGlzdCwgbGlzdGVuZXIpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pRXZlbnRzW2V2ZW50VHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBkZWxlZ2F0ZWQgZXZlbnRcbiAgICAgICAgZWxzZSBpZiAodGhpcy5zZWxlY3Rvcikge1xuICAgICAgICAgICAgdmFyIGRlbGVnYXRlZCA9IHNjb3BlLmRlbGVnYXRlZEV2ZW50c1tldmVudFR5cGVdLFxuICAgICAgICAgICAgICAgIG1hdGNoRm91bmQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQpIHsgcmV0dXJuIHRoaXM7IH1cblxuICAgICAgICAgICAgLy8gY291bnQgZnJvbSBsYXN0IGluZGV4IG9mIGRlbGVnYXRlZCB0byAwXG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgICAgICAgICAgICAgLy8gbG9vayBmb3IgbWF0Y2hpbmcgc2VsZWN0b3IgYW5kIGNvbnRleHQgTm9kZVxuICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzW2luZGV4XSA9PT0gdGhpcy5zZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAmJiBkZWxlZ2F0ZWQuY29udGV4dHNbaW5kZXhdID09PSB0aGlzLl9jb250ZXh0KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IGRlbGVnYXRlZC5saXN0ZW5lcnNbaW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGVhY2ggaXRlbSBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGlzIGFuIGFycmF5OiBbZnVuY3Rpb24sIHVzZUNhcHR1cmVGbGFnXVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IGxpc3RlbmVyc1tpXVswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VDYXAgPSBsaXN0ZW5lcnNbaV1bMV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMgYW5kIHVzZUNhcHR1cmUgZmxhZ3MgbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmbiA9PT0gbGlzdGVuZXIgJiYgdXNlQ2FwID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgYWxsIGxpc3RlbmVycyBmb3IgdGhpcyBpbnRlcmFjdGFibGUgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGludGVyYWN0YWJsZSBmcm9tIHRoZSBkZWxlZ2F0ZWQgYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5zZWxlY3RvcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGRlbGVnYXRlIGZ1bmN0aW9uIGZyb20gY29udGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIGV2ZW50VHlwZSwgZGVsZWdhdGVMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgZXZlbnRUeXBlLCBkZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgYXJyYXlzIGlmIHRoZXkgYXJlIGVtcHR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmRlbGVnYXRlZEV2ZW50c1tldmVudFR5cGVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgcmVtb3ZlIG9uZSBsaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoRm91bmQpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlIGxpc3RlbmVyIGZyb20gdGhpcyBJbnRlcmF0YWJsZSdzIGVsZW1lbnRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2VsZW1lbnQsIGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuc2V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJlc2V0IHRoZSBvcHRpb25zIG9mIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIC0gb3B0aW9ucyAob2JqZWN0KSBUaGUgbmV3IHNldHRpbmdzIHRvIGFwcGx5XG4gICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibHdcbiAgICAgXFwqL1xuICAgIHNldDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0gdXRpbHMuZXh0ZW5kKHt9LCBzY29wZS5kZWZhdWx0T3B0aW9ucy5iYXNlKTtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGFjdGlvbnMgPSBbJ2RyYWcnLCAnZHJvcCcsICdyZXNpemUnLCAnZ2VzdHVyZSddLFxuICAgICAgICAgICAgbWV0aG9kcyA9IFsnZHJhZ2dhYmxlJywgJ2Ryb3B6b25lJywgJ3Jlc2l6YWJsZScsICdnZXN0dXJhYmxlJ10sXG4gICAgICAgICAgICBwZXJBY3Rpb25zID0gdXRpbHMuZXh0ZW5kKHV0aWxzLmV4dGVuZCh7fSwgc2NvcGUuZGVmYXVsdE9wdGlvbnMucGVyQWN0aW9uKSwgb3B0aW9uc1thY3Rpb25dIHx8IHt9KTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFjdGlvbnNbaV07XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dID0gdXRpbHMuZXh0ZW5kKHt9LCBzY29wZS5kZWZhdWx0T3B0aW9uc1thY3Rpb25dKTtcblxuICAgICAgICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oYWN0aW9uLCBwZXJBY3Rpb25zKTtcblxuICAgICAgICAgICAgdGhpc1ttZXRob2RzW2ldXShvcHRpb25zW2FjdGlvbl0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNldHRpbmdzID0gW1xuICAgICAgICAgICAgJ2FjY2VwdCcsICdhY3Rpb25DaGVja2VyJywgJ2FsbG93RnJvbScsICdkZWx0YVNvdXJjZScsXG4gICAgICAgICAgICAnZHJvcENoZWNrZXInLCAnaWdub3JlRnJvbScsICdvcmlnaW4nLCAncHJldmVudERlZmF1bHQnLFxuICAgICAgICAgICAgJ3JlY3RDaGVja2VyJ1xuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHNldHRpbmdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZyA9IHNldHRpbmdzW2ldO1xuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNbc2V0dGluZ10gPSBzY29wZS5kZWZhdWx0T3B0aW9ucy5iYXNlW3NldHRpbmddO1xuXG4gICAgICAgICAgICBpZiAoc2V0dGluZyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzZXR0aW5nXShvcHRpb25zW3NldHRpbmddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnVuc2V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJlbW92ZSB0aGlzIGludGVyYWN0YWJsZSBmcm9tIHRoZSBsaXN0IG9mIGludGVyYWN0YWJsZXMgYW5kIHJlbW92ZVxuICAgICAqIGl0J3MgZHJhZywgZHJvcCwgcmVzaXplIGFuZCBnZXN0dXJlIGNhcGFiaWxpdGllc1xuICAgICAqXG4gICAgID0gKG9iamVjdCkgQGludGVyYWN0XG4gICAgIFxcKi9cbiAgICB1bnNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2VsZW1lbnQsICdhbGwnKTtcblxuICAgICAgICBpZiAoIXNjb3BlLmlzU3RyaW5nKHRoaXMuc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMsICdhbGwnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLmN1cnNvciA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIGRlbGVnYXRlZCBldmVudHNcbiAgICAgICAgICAgIGZvciAodmFyIHR5cGUgaW4gc2NvcGUuZGVsZWdhdGVkRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGVnYXRlZCA9IHNjb3BlLmRlbGVnYXRlZEV2ZW50c1t0eXBlXTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZWdhdGVkLnNlbGVjdG9yc1tpXSA9PT0gdGhpcy5zZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgZGVsZWdhdGVkLmNvbnRleHRzW2ldID09PSB0aGlzLl9jb250ZXh0KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5zZWxlY3RvcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzIC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBhcnJheXMgaWYgdGhleSBhcmUgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbdHlwZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCB0eXBlLCBkZWxlZ2F0ZUxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCB0eXBlLCBkZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZHJvcHpvbmUoZmFsc2UpO1xuXG4gICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuc3BsaWNlKHNjb3BlLmluZGV4T2Yoc2NvcGUuaW50ZXJhY3RhYmxlcywgdGhpcyksIDEpO1xuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9XG59O1xuXG5JbnRlcmFjdGFibGUucHJvdG90eXBlLnNuYXAgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLnNuYXAsXG4gICAgJ0ludGVyYWN0YWJsZSNzbmFwIGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIHNuYXBwaW5nIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3Mvc25hcHBpbmcnKTtcbkludGVyYWN0YWJsZS5wcm90b3R5cGUucmVzdHJpY3QgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc3RyaWN0LFxuICAgICdJbnRlcmFjdGFibGUjcmVzdHJpY3QgaXMgZGVwcmVjYXRlZC4gU2VlIHRoZSBuZXcgZG9jdW1lbnRhdGlvbiBmb3IgcmVzdGljdGluZyBhdCBodHRwOi8vaW50ZXJhY3Rqcy5pby9kb2NzL3Jlc3RyaWN0aW9uJyk7XG5JbnRlcmFjdGFibGUucHJvdG90eXBlLmluZXJ0aWEgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLmluZXJ0aWEsXG4gICAgJ0ludGVyYWN0YWJsZSNpbmVydGlhIGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIGluZXJ0aWEgYXQgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy9pbmVydGlhJyk7XG5JbnRlcmFjdGFibGUucHJvdG90eXBlLmF1dG9TY3JvbGwgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLmF1dG9TY3JvbGwsXG4gICAgJ0ludGVyYWN0YWJsZSNhdXRvU2Nyb2xsIGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIGF1dG9TY3JvbGwgYXQgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy8jYXV0b3Njcm9sbCcpO1xuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zcXVhcmVSZXNpemUgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLnNxdWFyZVJlc2l6ZSxcbiAgICAnSW50ZXJhY3RhYmxlI3NxdWFyZVJlc2l6ZSBpcyBkZXByZWNhdGVkLiBTZWUgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy8jcmVzaXplLXNxdWFyZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0YWJsZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBhbmltYXRpb25GcmFtZSA9IHV0aWxzLnJhZjtcbnZhciBJbnRlcmFjdEV2ZW50ID0gcmVxdWlyZSgnLi9JbnRlcmFjdEV2ZW50Jyk7XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcbnZhciBicm93c2VyID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyJyk7XG5cbmZ1bmN0aW9uIEludGVyYWN0aW9uICgpIHtcbiAgICB0aGlzLnRhcmdldCAgICAgICAgICA9IG51bGw7IC8vIGN1cnJlbnQgaW50ZXJhY3RhYmxlIGJlaW5nIGludGVyYWN0ZWQgd2l0aFxuICAgIHRoaXMuZWxlbWVudCAgICAgICAgID0gbnVsbDsgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgICB0aGlzLmRyb3BUYXJnZXQgICAgICA9IG51bGw7IC8vIHRoZSBkcm9wem9uZSBhIGRyYWcgdGFyZ2V0IG1pZ2h0IGJlIGRyb3BwZWQgaW50b1xuICAgIHRoaXMuZHJvcEVsZW1lbnQgICAgID0gbnVsbDsgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcbiAgICB0aGlzLnByZXZEcm9wVGFyZ2V0ICA9IG51bGw7IC8vIHRoZSBkcm9wem9uZSB0aGF0IHdhcyByZWNlbnRseSBkcmFnZ2VkIGF3YXkgZnJvbVxuICAgIHRoaXMucHJldkRyb3BFbGVtZW50ID0gbnVsbDsgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcblxuICAgIHRoaXMucHJlcGFyZWQgICAgICAgID0geyAgICAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgICAgICAgbmFtZSA6IG51bGwsXG4gICAgICAgIGF4aXMgOiBudWxsLFxuICAgICAgICBlZGdlczogbnVsbFxuICAgIH07XG5cbiAgICB0aGlzLm1hdGNoZXMgICAgICAgICA9IFtdOyAgIC8vIGFsbCBzZWxlY3RvcnMgdGhhdCBhcmUgbWF0Y2hlZCBieSB0YXJnZXQgZWxlbWVudFxuICAgIHRoaXMubWF0Y2hFbGVtZW50cyAgID0gW107ICAgLy8gY29ycmVzcG9uZGluZyBlbGVtZW50c1xuXG4gICAgdGhpcy5pbmVydGlhU3RhdHVzID0ge1xuICAgICAgICBhY3RpdmUgICAgICAgOiBmYWxzZSxcbiAgICAgICAgc21vb3RoRW5kICAgIDogZmFsc2UsXG5cbiAgICAgICAgc3RhcnRFdmVudDogbnVsbCxcbiAgICAgICAgdXBDb29yZHM6IHt9LFxuXG4gICAgICAgIHhlOiAwLCB5ZTogMCxcbiAgICAgICAgc3g6IDAsIHN5OiAwLFxuXG4gICAgICAgIHQwOiAwLFxuICAgICAgICB2eDA6IDAsIHZ5czogMCxcbiAgICAgICAgZHVyYXRpb246IDAsXG5cbiAgICAgICAgcmVzdW1lRHg6IDAsXG4gICAgICAgIHJlc3VtZUR5OiAwLFxuXG4gICAgICAgIGxhbWJkYV92MDogMCxcbiAgICAgICAgb25lX3ZlX3YwOiAwLFxuICAgICAgICBpICA6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpKSB7XG4gICAgICAgIHRoaXMuYm91bmRJbmVydGlhRnJhbWUgPSB0aGlzLmluZXJ0aWFGcmFtZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUgPSB0aGlzLnNtb290aEVuZEZyYW1lLmJpbmQodGhpcyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5ib3VuZEluZXJ0aWFGcmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoYXQuaW5lcnRpYUZyYW1lKCk7IH07XG4gICAgICAgIHRoaXMuYm91bmRTbW9vdGhFbmRGcmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoYXQuc21vb3RoRW5kRnJhbWUoKTsgfTtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZURyb3BzID0ge1xuICAgICAgICBkcm9wem9uZXM6IFtdLCAgICAgIC8vIHRoZSBkcm9wem9uZXMgdGhhdCBhcmUgbWVudGlvbmVkIGJlbG93XG4gICAgICAgIGVsZW1lbnRzIDogW10sICAgICAgLy8gZWxlbWVudHMgb2YgZHJvcHpvbmVzIHRoYXQgYWNjZXB0IHRoZSB0YXJnZXQgZHJhZ2dhYmxlXG4gICAgICAgIHJlY3RzICAgIDogW10gICAgICAgLy8gdGhlIHJlY3RzIG9mIHRoZSBlbGVtZW50cyBtZW50aW9uZWQgYWJvdmVcbiAgICB9O1xuXG4gICAgLy8ga2VlcCB0cmFjayBvZiBhZGRlZCBwb2ludGVyc1xuICAgIHRoaXMucG9pbnRlcnMgICAgPSBbXTtcbiAgICB0aGlzLnBvaW50ZXJJZHMgID0gW107XG4gICAgdGhpcy5kb3duVGFyZ2V0cyA9IFtdO1xuICAgIHRoaXMuZG93blRpbWVzICAgPSBbXTtcbiAgICB0aGlzLmhvbGRUaW1lcnMgID0gW107XG5cbiAgICAvLyBQcmV2aW91cyBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgdGhpcy5wcmV2Q29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuICAgIC8vIGN1cnJlbnQgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHRoaXMuY3VyQ29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuXG4gICAgLy8gU3RhcnRpbmcgSW50ZXJhY3RFdmVudCBwb2ludGVyIGNvb3JkaW5hdGVzXG4gICAgdGhpcy5zdGFydENvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcblxuICAgIC8vIENoYW5nZSBpbiBjb29yZGluYXRlcyBhbmQgdGltZSBvZiB0aGUgcG9pbnRlclxuICAgIHRoaXMucG9pbnRlckRlbHRhID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwLCBzcGVlZDogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwLCBzcGVlZDogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuXG4gICAgdGhpcy5kb3duRXZlbnQgICA9IG51bGw7ICAgIC8vIHBvaW50ZXJkb3duL21vdXNlZG93bi90b3VjaHN0YXJ0IGV2ZW50XG4gICAgdGhpcy5kb3duUG9pbnRlciA9IHt9O1xuXG4gICAgdGhpcy5fZXZlbnRUYXJnZXQgICAgPSBudWxsO1xuICAgIHRoaXMuX2N1ckV2ZW50VGFyZ2V0ID0gbnVsbDtcblxuICAgIHRoaXMucHJldkV2ZW50ID0gbnVsbDsgICAgICAvLyBwcmV2aW91cyBhY3Rpb24gZXZlbnRcbiAgICB0aGlzLnRhcFRpbWUgICA9IDA7ICAgICAgICAgLy8gdGltZSBvZiB0aGUgbW9zdCByZWNlbnQgdGFwIGV2ZW50XG4gICAgdGhpcy5wcmV2VGFwICAgPSBudWxsO1xuXG4gICAgdGhpcy5zdGFydE9mZnNldCAgICA9IHsgbGVmdDogMCwgcmlnaHQ6IDAsIHRvcDogMCwgYm90dG9tOiAwIH07XG4gICAgdGhpcy5yZXN0cmljdE9mZnNldCA9IHsgbGVmdDogMCwgcmlnaHQ6IDAsIHRvcDogMCwgYm90dG9tOiAwIH07XG4gICAgdGhpcy5zbmFwT2Zmc2V0cyAgICA9IFtdO1xuXG4gICAgdGhpcy5nZXN0dXJlID0ge1xuICAgICAgICBzdGFydDogeyB4OiAwLCB5OiAwIH0sXG5cbiAgICAgICAgc3RhcnREaXN0YW5jZTogMCwgICAvLyBkaXN0YW5jZSBiZXR3ZWVuIHR3byB0b3VjaGVzIG9mIHRvdWNoU3RhcnRcbiAgICAgICAgcHJldkRpc3RhbmNlIDogMCxcbiAgICAgICAgZGlzdGFuY2UgICAgIDogMCxcblxuICAgICAgICBzY2FsZTogMSwgICAgICAgICAgIC8vIGdlc3R1cmUuZGlzdGFuY2UgLyBnZXN0dXJlLnN0YXJ0RGlzdGFuY2VcblxuICAgICAgICBzdGFydEFuZ2xlOiAwLCAgICAgIC8vIGFuZ2xlIG9mIGxpbmUgam9pbmluZyB0d28gdG91Y2hlc1xuICAgICAgICBwcmV2QW5nbGUgOiAwICAgICAgIC8vIGFuZ2xlIG9mIHRoZSBwcmV2aW91cyBnZXN0dXJlIGV2ZW50XG4gICAgfTtcblxuICAgIHRoaXMuc25hcFN0YXR1cyA9IHtcbiAgICAgICAgeCAgICAgICA6IDAsIHkgICAgICAgOiAwLFxuICAgICAgICBkeCAgICAgIDogMCwgZHkgICAgICA6IDAsXG4gICAgICAgIHJlYWxYICAgOiAwLCByZWFsWSAgIDogMCxcbiAgICAgICAgc25hcHBlZFg6IDAsIHNuYXBwZWRZOiAwLFxuICAgICAgICB0YXJnZXRzIDogW10sXG4gICAgICAgIGxvY2tlZCAgOiBmYWxzZSxcbiAgICAgICAgY2hhbmdlZCA6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMucmVzdHJpY3RTdGF0dXMgPSB7XG4gICAgICAgIGR4ICAgICAgICAgOiAwLCBkeSAgICAgICAgIDogMCxcbiAgICAgICAgcmVzdHJpY3RlZFg6IDAsIHJlc3RyaWN0ZWRZOiAwLFxuICAgICAgICBzbmFwICAgICAgIDogbnVsbCxcbiAgICAgICAgcmVzdHJpY3RlZCA6IGZhbHNlLFxuICAgICAgICBjaGFuZ2VkICAgIDogZmFsc2VcbiAgICB9O1xuXG4gICAgdGhpcy5yZXN0cmljdFN0YXR1cy5zbmFwID0gdGhpcy5zbmFwU3RhdHVzO1xuXG4gICAgdGhpcy5wb2ludGVySXNEb3duICAgPSBmYWxzZTtcbiAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlO1xuICAgIHRoaXMuZ2VzdHVyaW5nICAgICAgID0gZmFsc2U7XG4gICAgdGhpcy5kcmFnZ2luZyAgICAgICAgPSBmYWxzZTtcbiAgICB0aGlzLnJlc2l6aW5nICAgICAgICA9IGZhbHNlO1xuICAgIHRoaXMucmVzaXplQXhlcyAgICAgID0gJ3h5JztcblxuICAgIHRoaXMubW91c2UgPSBmYWxzZTtcblxuICAgIHNjb3BlLmludGVyYWN0aW9ucy5wdXNoKHRoaXMpO1xufVxuXG4vLyBDaGVjayBpZiBhY3Rpb24gaXMgZW5hYmxlZCBnbG9iYWxseSBhbmQgdGhlIGN1cnJlbnQgdGFyZ2V0IHN1cHBvcnRzIGl0XG4vLyBJZiBzbywgcmV0dXJuIHRoZSB2YWxpZGF0ZWQgYWN0aW9uLiBPdGhlcndpc2UsIHJldHVybiBudWxsXG5mdW5jdGlvbiB2YWxpZGF0ZUFjdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUpIHtcbiAgICBpZiAoIXNjb3BlLmlzT2JqZWN0KGFjdGlvbikpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgIHZhciBhY3Rpb25OYW1lID0gYWN0aW9uLm5hbWUsXG4gICAgICAgIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgIGlmICgoICAoYWN0aW9uTmFtZSAgPT09ICdyZXNpemUnICAgJiYgb3B0aW9ucy5yZXNpemUuZW5hYmxlZCApXG4gICAgICAgIHx8IChhY3Rpb25OYW1lICAgICAgPT09ICdkcmFnJyAgICAgJiYgb3B0aW9ucy5kcmFnLmVuYWJsZWQgIClcbiAgICAgICAgfHwgKGFjdGlvbk5hbWUgICAgICA9PT0gJ2dlc3R1cmUnICAmJiBvcHRpb25zLmdlc3R1cmUuZW5hYmxlZCkpXG4gICAgICAgICYmIHNjb3BlLmFjdGlvbklzRW5hYmxlZFthY3Rpb25OYW1lXSkge1xuXG4gICAgICAgIGlmIChhY3Rpb25OYW1lID09PSAncmVzaXplJyB8fCBhY3Rpb25OYW1lID09PSAncmVzaXpleXgnKSB7XG4gICAgICAgICAgICBhY3Rpb25OYW1lID0gJ3Jlc2l6ZXh5JztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRBY3Rpb25DdXJzb3IgKGFjdGlvbikge1xuICAgIHZhciBjdXJzb3IgPSAnJztcblxuICAgIGlmIChhY3Rpb24ubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICAgIGN1cnNvciA9ICBzY29wZS5hY3Rpb25DdXJzb3JzLmRyYWc7XG4gICAgfVxuICAgIGlmIChhY3Rpb24ubmFtZSA9PT0gJ3Jlc2l6ZScpIHtcbiAgICAgICAgaWYgKGFjdGlvbi5heGlzKSB7XG4gICAgICAgICAgICBjdXJzb3IgPSAgc2NvcGUuYWN0aW9uQ3Vyc29yc1thY3Rpb24ubmFtZSArIGFjdGlvbi5heGlzXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY3Rpb24uZWRnZXMpIHtcbiAgICAgICAgICAgIHZhciBjdXJzb3JLZXkgPSAncmVzaXplJyxcbiAgICAgICAgICAgICAgICBlZGdlTmFtZXMgPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24uZWRnZXNbZWRnZU5hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3JLZXkgKz0gZWRnZU5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3Vyc29yID0gc2NvcGUuYWN0aW9uQ3Vyc29yc1tjdXJzb3JLZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnNvcjtcbn1cblxuZnVuY3Rpb24gcHJldmVudE9yaWdpbmFsRGVmYXVsdCAoKSB7XG4gICAgdGhpcy5vcmlnaW5hbEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59XG5cbkludGVyYWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICBnZXRQYWdlWFkgIDogZnVuY3Rpb24gKHBvaW50ZXIsIHh5KSB7IHJldHVybiAgIHV0aWxzLmdldFBhZ2VYWShwb2ludGVyLCB4eSwgdGhpcyk7IH0sXG4gICAgZ2V0Q2xpZW50WFk6IGZ1bmN0aW9uIChwb2ludGVyLCB4eSkgeyByZXR1cm4gdXRpbHMuZ2V0Q2xpZW50WFkocG9pbnRlciwgeHksIHRoaXMpOyB9LFxuICAgIHNldEV2ZW50WFkgOiBmdW5jdGlvbiAodGFyZ2V0LCBwdHIpIHsgcmV0dXJuICB1dGlscy5zZXRFdmVudFhZKHRhcmdldCwgcHRyLCB0aGlzKTsgfSxcblxuICAgIHBvaW50ZXJPdmVyOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIGlmICh0aGlzLnByZXBhcmVkLm5hbWUgfHwgIXRoaXMubW91c2UpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIGN1ck1hdGNoZXMgPSBbXSxcbiAgICAgICAgICAgIGN1ck1hdGNoRWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgIHByZXZUYXJnZXRFbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuXG4gICAgICAgIHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICBpZiAodGhpcy50YXJnZXRcbiAgICAgICAgICAgICYmIChzY29wZS50ZXN0SWdub3JlKHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgfHwgIXNjb3BlLnRlc3RBbGxvdyh0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50LCBldmVudFRhcmdldCkpKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgZXZlbnRUYXJnZXQgc2hvdWxkIGJlIGlnbm9yZWQgb3Igc2hvdWxkbid0IGJlIGFsbG93ZWRcbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBwcmV2aW91cyB0YXJnZXRcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVsZW1lbnRJbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmdldChldmVudFRhcmdldCksXG4gICAgICAgICAgICBlbGVtZW50QWN0aW9uID0gKGVsZW1lbnRJbnRlcmFjdGFibGVcbiAgICAgICAgICAgICYmICFzY29wZS50ZXN0SWdub3JlKGVsZW1lbnRJbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhlbGVtZW50SW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAmJiB2YWxpZGF0ZUFjdGlvbihcbiAgICAgICAgICAgICAgICBlbGVtZW50SW50ZXJhY3RhYmxlLmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgZXZlbnRUYXJnZXQpLFxuICAgICAgICAgICAgICAgIGVsZW1lbnRJbnRlcmFjdGFibGUpKTtcblxuICAgICAgICBpZiAoZWxlbWVudEFjdGlvbiAmJiAhc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChlbGVtZW50SW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZWxlbWVudEFjdGlvbikpIHtcbiAgICAgICAgICAgIGVsZW1lbnRBY3Rpb24gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHVzaEN1ck1hdGNoZXMgKGludGVyYWN0YWJsZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGV2ZW50VGFyZ2V0LCBzZWxlY3RvcikpIHtcblxuICAgICAgICAgICAgICAgIGN1ck1hdGNoZXMucHVzaChpbnRlcmFjdGFibGUpO1xuICAgICAgICAgICAgICAgIGN1ck1hdGNoRWxlbWVudHMucHVzaChldmVudFRhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBlbGVtZW50SW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5mb3JFYWNoU2VsZWN0b3IocHVzaEN1ck1hdGNoZXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0ZVNlbGVjdG9yKHBvaW50ZXIsIGV2ZW50LCBjdXJNYXRjaGVzLCBjdXJNYXRjaEVsZW1lbnRzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IGN1ck1hdGNoZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gY3VyTWF0Y2hFbGVtZW50cztcblxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlckhvdmVyKHBvaW50ZXIsIGV2ZW50LCB0aGlzLm1hdGNoZXMsIHRoaXMubWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZChldmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuUG9pbnRlckV2ZW50PyBzY29wZS5wRXZlbnRUeXBlcy5tb3ZlIDogJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUubm9kZUNvbnRhaW5zKHByZXZUYXJnZXRFbGVtZW50LCBldmVudFRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb2ludGVySG92ZXIocG9pbnRlciwgZXZlbnQsIHRoaXMubWF0Y2hlcywgdGhpcy5tYXRjaEVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLmVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5Qb2ludGVyRXZlbnQ/IHNjb3BlLnBFdmVudFR5cGVzLm1vdmUgOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIENoZWNrIHdoYXQgYWN0aW9uIHdvdWxkIGJlIHBlcmZvcm1lZCBvbiBwb2ludGVyTW92ZSB0YXJnZXQgaWYgYSBtb3VzZVxuICAgIC8vIGJ1dHRvbiB3ZXJlIHByZXNzZWQgYW5kIGNoYW5nZSB0aGUgY3Vyc29yIGFjY29yZGluZ2x5XG4gICAgcG9pbnRlckhvdmVyOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgbWF0Y2hlcywgbWF0Y2hFbGVtZW50cykge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUgJiYgdGhpcy5tb3VzZSkge1xuXG4gICAgICAgICAgICB2YXIgYWN0aW9uO1xuXG4gICAgICAgICAgICAvLyB1cGRhdGUgcG9pbnRlciBjb29yZHMgZm9yIGRlZmF1bHRBY3Rpb25DaGVja2VyIHRvIHVzZVxuICAgICAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuY3VyQ29vcmRzLCBwb2ludGVyKTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSB0aGlzLnZhbGlkYXRlU2VsZWN0b3IocG9pbnRlciwgZXZlbnQsIG1hdGNoZXMsIG1hdGNoRWxlbWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gdmFsaWRhdGVBY3Rpb24odGFyZ2V0LmdldEFjdGlvbih0aGlzLnBvaW50ZXJzWzBdLCBldmVudCwgdGhpcywgdGhpcy5lbGVtZW50KSwgdGhpcy50YXJnZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gZ2V0QWN0aW9uQ3Vyc29yKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucHJlcGFyZWQubmFtZSkge1xuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcG9pbnRlck91dDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5uYW1lKSB7IHJldHVybjsgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0ZW1wb3JhcnkgZXZlbnQgbGlzdGVuZXJzIGZvciBzZWxlY3RvciBJbnRlcmFjdGFibGVzXG4gICAgICAgIGlmICghc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZXZlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgICBldmVudHMucmVtb3ZlKGV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgIHNjb3BlLlBvaW50ZXJFdmVudD8gc2NvcGUucEV2ZW50VHlwZXMubW92ZSA6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICYmIHRoaXMudGFyZ2V0Lm9wdGlvbnMuc3R5bGVDdXJzb3IgJiYgIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2VsZWN0b3JEb3duOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXG4gICAgICAgIC8vIGNvcHkgZXZlbnQgdG8gYmUgdXNlZCBpbiB0aW1lb3V0IGZvciBJRThcbiAgICAgICAgICAgIGV2ZW50Q29weSA9IGV2ZW50cy51c2VBdHRhY2hFdmVudD8gdXRpbHMuZXh0ZW5kKHt9LCBldmVudCkgOiBldmVudCxcbiAgICAgICAgICAgIGVsZW1lbnQgPSBldmVudFRhcmdldCxcbiAgICAgICAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKSxcbiAgICAgICAgICAgIGFjdGlvbjtcblxuICAgICAgICB0aGlzLmhvbGRUaW1lcnNbcG9pbnRlckluZGV4XSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC5wb2ludGVySG9sZChldmVudHMudXNlQXR0YWNoRXZlbnQ/IGV2ZW50Q29weSA6IHBvaW50ZXIsIGV2ZW50Q29weSwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcbiAgICAgICAgfSwgc2NvcGUuZGVmYXVsdE9wdGlvbnMuX2hvbGREdXJhdGlvbik7XG5cbiAgICAgICAgdGhpcy5wb2ludGVySXNEb3duID0gdHJ1ZTtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgZG93biBldmVudCBoaXRzIHRoZSBjdXJyZW50IGluZXJ0aWEgdGFyZ2V0XG4gICAgICAgIGlmICh0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlICYmIHRoaXMudGFyZ2V0LnNlbGVjdG9yKSB7XG4gICAgICAgICAgICAvLyBjbGltYiB1cCB0aGUgRE9NIHRyZWUgZnJvbSB0aGUgZXZlbnQgdGFyZ2V0XG4gICAgICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGVsZW1lbnQgaXMgdGhlIGN1cnJlbnQgaW5lcnRpYSB0YXJnZXQgZWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLmVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCB0aGUgcHJvc3BlY3RpdmUgYWN0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBvbmdvaW5nIG9uZVxuICAgICAgICAgICAgICAgICAgICAmJiB2YWxpZGF0ZUFjdGlvbih0aGlzLnRhcmdldC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIHRoaXMuZWxlbWVudCksIHRoaXMudGFyZ2V0KS5uYW1lID09PSB0aGlzLnByZXBhcmVkLm5hbWUpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIGluZXJ0aWEgc28gdGhhdCB0aGUgbmV4dCBtb3ZlIHdpbGwgYmUgYSBub3JtYWwgb25lXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkZyYW1lLmNhbmNlbCh0aGlzLmluZXJ0aWFTdGF0dXMuaSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90aGluZyBpZiBpbnRlcmFjdGluZ1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHVzaE1hdGNoZXMgKGludGVyYWN0YWJsZSwgc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgID8gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaW5Db250ZXh0KGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvciwgZWxlbWVudHMpKSB7XG5cbiAgICAgICAgICAgICAgICB0aGF0Lm1hdGNoZXMucHVzaChpbnRlcmFjdGFibGUpO1xuICAgICAgICAgICAgICAgIHRoYXQubWF0Y2hFbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHBvaW50ZXIgY29vcmRzIGZvciBkZWZhdWx0QWN0aW9uQ2hlY2tlciB0byB1c2VcbiAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuY3VyQ29vcmRzLCBwb2ludGVyKTtcbiAgICAgICAgdGhpcy5kb3duRXZlbnQgPSBldmVudDtcblxuICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpICYmICFhY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG5cbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKHB1c2hNYXRjaGVzKTtcblxuICAgICAgICAgICAgYWN0aW9uID0gdGhpcy52YWxpZGF0ZVNlbGVjdG9yKHBvaW50ZXIsIGV2ZW50LCB0aGlzLm1hdGNoZXMsIHRoaXMubWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSAgPSBhY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuZWRnZXMgPSBhY3Rpb24uZWRnZXM7XG5cbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdkb3duJyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBvaW50ZXJEb3duKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyB0aGVzZSBub3cgc2luY2UgcG9pbnRlckRvd24gaXNuJ3QgYmVpbmcgY2FsbGVkIGZyb20gaGVyZVxuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB1dGlscy5leHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcik7XG5cbiAgICAgICAgICAgIHV0aWxzLmNvcHlDb29yZHModGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2Rvd24nKTtcbiAgICB9LFxuXG4gICAgLy8gRGV0ZXJtaW5lIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gbmV4dCBwb2ludGVyTW92ZSBhbmQgYWRkIGFwcHJvcHJpYXRlXG4gICAgLy8gc3R5bGUgYW5kIGV2ZW50IExpc3RlbmVyc1xuICAgIHBvaW50ZXJEb3duOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgZm9yY2VBY3Rpb24pIHtcbiAgICAgICAgaWYgKCFmb3JjZUFjdGlvbiAmJiAhdGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSAmJiB0aGlzLnBvaW50ZXJXYXNNb3ZlZCAmJiB0aGlzLnByZXBhcmVkLm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWU7XG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnQ7XG5cbiAgICAgICAgdmFyIHBvaW50ZXJJbmRleCA9IHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKSxcbiAgICAgICAgICAgIGFjdGlvbjtcblxuICAgICAgICAvLyBJZiBpdCBpcyB0aGUgc2Vjb25kIHRvdWNoIG9mIGEgbXVsdGktdG91Y2ggZ2VzdHVyZSwga2VlcCB0aGUgdGFyZ2V0XG4gICAgICAgIC8vIHRoZSBzYW1lIGlmIGEgdGFyZ2V0IHdhcyBzZXQgYnkgdGhlIGZpcnN0IHRvdWNoXG4gICAgICAgIC8vIE90aGVyd2lzZSwgc2V0IHRoZSB0YXJnZXQgaWYgdGhlcmUgaXMgbm8gYWN0aW9uIHByZXBhcmVkXG4gICAgICAgIGlmICgodGhpcy5wb2ludGVySWRzLmxlbmd0aCA8IDIgJiYgIXRoaXMudGFyZ2V0KSB8fCAhdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG5cbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmdldChjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGN1ckV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBjdXJFdmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgKGFjdGlvbiA9IHZhbGlkYXRlQWN0aW9uKGZvcmNlQWN0aW9uIHx8IGludGVyYWN0YWJsZS5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIGN1ckV2ZW50VGFyZ2V0KSwgaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCkpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChpbnRlcmFjdGFibGUsIGN1ckV2ZW50VGFyZ2V0LCBhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBpbnRlcmFjdGFibGU7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gY3VyRXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQsXG4gICAgICAgICAgICBvcHRpb25zID0gdGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zO1xuXG4gICAgICAgIGlmICh0YXJnZXQgJiYgKGZvcmNlQWN0aW9uIHx8ICF0aGlzLnByZXBhcmVkLm5hbWUpKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBhY3Rpb24gfHwgdmFsaWRhdGVBY3Rpb24oZm9yY2VBY3Rpb24gfHwgdGFyZ2V0LmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgY3VyRXZlbnRUYXJnZXQpLCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLnN0YXJ0Q29vcmRzKTtcblxuICAgICAgICAgICAgaWYgKCFhY3Rpb24pIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9IGdldEFjdGlvbkN1cnNvcihhY3Rpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUF4ZXMgPSBhY3Rpb24ubmFtZSA9PT0gJ3Jlc2l6ZSc/IGFjdGlvbi5heGlzIDogbnVsbDtcblxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2dlc3R1cmUnICYmIHRoaXMucG9pbnRlcklkcy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5uYW1lICA9IGFjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5heGlzICA9IGFjdGlvbi5heGlzO1xuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5lZGdlcyA9IGFjdGlvbi5lZGdlcztcblxuICAgICAgICAgICAgdGhpcy5zbmFwU3RhdHVzLnNuYXBwZWRYID0gdGhpcy5zbmFwU3RhdHVzLnNuYXBwZWRZID1cbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWRYID0gdGhpcy5yZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkWSA9IE5hTjtcblxuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB1dGlscy5leHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcik7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLnByZXZDb29yZHMpO1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgaW5lcnRpYSBpcyBhY3RpdmUgdHJ5IHRvIHJlc3VtZSBhY3Rpb25cbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZVxuICAgICAgICAgICAgJiYgY3VyRXZlbnRUYXJnZXQgPT09IHRoaXMuZWxlbWVudFxuICAgICAgICAgICAgJiYgdmFsaWRhdGVBY3Rpb24odGFyZ2V0LmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgdGhpcy5lbGVtZW50KSwgdGFyZ2V0KS5uYW1lID09PSB0aGlzLnByZXBhcmVkLm5hbWUpIHtcblxuICAgICAgICAgICAgYW5pbWF0aW9uRnJhbWUuY2FuY2VsKHRoaXMuaW5lcnRpYVN0YXR1cy5pKTtcbiAgICAgICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0TW9kaWZpY2F0aW9uczogZnVuY3Rpb24gKGNvb3JkcywgcHJlRW5kKSB7XG4gICAgICAgIHZhciB0YXJnZXQgICAgICAgICA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgc2hvdWxkTW92ZSAgICAgPSB0cnVlLFxuICAgICAgICAgICAgc2hvdWxkU25hcCAgICAgPSBzY29wZS5jaGVja1NuYXAodGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpICAgICAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcC5lbmRPbmx5ICAgICB8fCBwcmVFbmQpLFxuICAgICAgICAgICAgc2hvdWxkUmVzdHJpY3QgPSBzY29wZS5jaGVja1Jlc3RyaWN0KHRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0ucmVzdHJpY3QuZW5kT25seSB8fCBwcmVFbmQpO1xuXG4gICAgICAgIGlmIChzaG91bGRTbmFwICAgICkgeyB0aGlzLnNldFNuYXBwaW5nICAgKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMuc25hcFN0YXR1cyAgICAubG9ja2VkICAgICA9IGZhbHNlOyB9XG4gICAgICAgIGlmIChzaG91bGRSZXN0cmljdCkgeyB0aGlzLnNldFJlc3RyaWN0aW9uKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCA9IGZhbHNlOyB9XG5cbiAgICAgICAgaWYgKHNob3VsZFNuYXAgJiYgdGhpcy5zbmFwU3RhdHVzLmxvY2tlZCAmJiAhdGhpcy5zbmFwU3RhdHVzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgIHNob3VsZE1vdmUgPSBzaG91bGRSZXN0cmljdCAmJiB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWQgJiYgdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNob3VsZFJlc3RyaWN0ICYmIHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCAmJiAhdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICBzaG91bGRNb3ZlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hvdWxkTW92ZTtcbiAgICB9LFxuXG4gICAgc2V0U3RhcnRPZmZzZXRzOiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KSxcbiAgICAgICAgICAgIG9yaWdpbiA9IHNjb3BlLmdldE9yaWdpblhZKGludGVyYWN0YWJsZSwgZWxlbWVudCksXG4gICAgICAgICAgICBzbmFwID0gaW50ZXJhY3RhYmxlLm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5zbmFwLFxuICAgICAgICAgICAgcmVzdHJpY3QgPSBpbnRlcmFjdGFibGUub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LFxuICAgICAgICAgICAgd2lkdGgsIGhlaWdodDtcblxuICAgICAgICBpZiAocmVjdCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydE9mZnNldC5sZWZ0ID0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnggLSByZWN0LmxlZnQ7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueSAtIHJlY3QudG9wO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICA9IHJlY3QucmlnaHQgIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLng7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LmJvdHRvbSA9IHJlY3QuYm90dG9tIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnk7XG5cbiAgICAgICAgICAgIGlmICgnd2lkdGgnIGluIHJlY3QpIHsgd2lkdGggPSByZWN0LndpZHRoOyB9XG4gICAgICAgICAgICBlbHNlIHsgd2lkdGggPSByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0OyB9XG4gICAgICAgICAgICBpZiAoJ2hlaWdodCcgaW4gcmVjdCkgeyBoZWlnaHQgPSByZWN0LmhlaWdodDsgfVxuICAgICAgICAgICAgZWxzZSB7IGhlaWdodCA9IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7IH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRPZmZzZXQubGVmdCA9IHRoaXMuc3RhcnRPZmZzZXQudG9wID0gdGhpcy5zdGFydE9mZnNldC5yaWdodCA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc25hcE9mZnNldHMuc3BsaWNlKDApO1xuXG4gICAgICAgIHZhciBzbmFwT2Zmc2V0ID0gc25hcCAmJiBzbmFwLm9mZnNldCA9PT0gJ3N0YXJ0Q29vcmRzJ1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICB4OiB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueCAtIG9yaWdpbi54LFxuICAgICAgICAgICAgeTogdGhpcy5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueVxuICAgICAgICB9XG4gICAgICAgICAgICA6IHNuYXAgJiYgc25hcC5vZmZzZXQgfHwgeyB4OiAwLCB5OiAwIH07XG5cbiAgICAgICAgaWYgKHJlY3QgJiYgc25hcCAmJiBzbmFwLnJlbGF0aXZlUG9pbnRzICYmIHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBPZmZzZXRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogc25hcC5yZWxhdGl2ZVBvaW50c1tpXS54KSArIHNuYXBPZmZzZXQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogdGhpcy5zdGFydE9mZnNldC50b3AgIC0gKGhlaWdodCAqIHNuYXAucmVsYXRpdmVQb2ludHNbaV0ueSkgKyBzbmFwT2Zmc2V0LnlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc25hcE9mZnNldHMucHVzaChzbmFwT2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWN0ICYmIHJlc3RyaWN0LmVsZW1lbnRSZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogcmVzdHJpY3QuZWxlbWVudFJlY3QubGVmdCk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgLSAoaGVpZ2h0ICogcmVzdHJpY3QuZWxlbWVudFJlY3QudG9wKTtcblxuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICAtICh3aWR0aCAgKiAoMSAtIHJlc3RyaWN0LmVsZW1lbnRSZWN0LnJpZ2h0KSk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tIC0gKGhlaWdodCAqICgxIC0gcmVzdHJpY3QuZWxlbWVudFJlY3QuYm90dG9tKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCA9IHRoaXMucmVzdHJpY3RPZmZzZXQucmlnaHQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IDA7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0aW9uLnN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgICAqIGFjdGlvbiBtdXN0IGJlIGVuYWJsZWQgZm9yIHRoZSB0YXJnZXQgSW50ZXJhY3RhYmxlIGFuZCBhbiBhcHByb3ByaWF0ZSBudW1iZXJcbiAgICAgKiBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biDigJMgMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAgICpcbiAgICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAgICpcbiAgICAgLSBhY3Rpb24gICAgICAgKG9iamVjdCkgIFRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIC0gZHJhZywgcmVzaXplLCBldGMuXG4gICAgIC0gaW50ZXJhY3RhYmxlIChJbnRlcmFjdGFibGUpIFRoZSBJbnRlcmFjdGFibGUgdG8gdGFyZ2V0XG4gICAgIC0gZWxlbWVudCAgICAgIChFbGVtZW50KSBUaGUgRE9NIEVsZW1lbnQgdG8gdGFyZ2V0XG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdCh0YXJnZXQpXG4gICAgIHwgICAuZHJhZ2dhYmxlKHtcbiAgICAgfCAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICAgfCAgICAgbWFudWFsU3RhcnQ6IHRydWVcbiAgICAgfCAgIH0pXG4gICAgIHwgICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAgIHwgICAub24oJ2hvbGQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgfCAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb247XG4gICAgIHxcbiAgICAgfCAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAgIHwgICAgICAgaW50ZXJhY3Rpb24uc3RhcnQoeyBuYW1lOiAnZHJhZycgfSxcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgIHwgICAgIH1cbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgfHwgIXRoaXMucG9pbnRlcklzRG93blxuICAgICAgICAgICAgfHwgdGhpcy5wb2ludGVySWRzLmxlbmd0aCA8IChhY3Rpb24ubmFtZSA9PT0gJ2dlc3R1cmUnPyAyIDogMSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoaXMgaW50ZXJhY3Rpb24gaGFkIGJlZW4gcmVtb3ZlZCBhZnRlciBzdG9wcGluZ1xuICAgICAgICAvLyBhZGQgaXQgYmFja1xuICAgICAgICBpZiAoc2NvcGUuaW5kZXhPZihzY29wZS5pbnRlcmFjdGlvbnMsIHRoaXMpID09PSAtMSkge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLnB1c2godGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgID0gYWN0aW9uLm5hbWU7XG4gICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgdGhpcy5wcmVwYXJlZC5lZGdlcyA9IGFjdGlvbi5lZGdlcztcbiAgICAgICAgdGhpcy50YXJnZXQgICAgICAgICA9IGludGVyYWN0YWJsZTtcbiAgICAgICAgdGhpcy5lbGVtZW50ICAgICAgICA9IGVsZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuc3RhcnRDb29yZHMpO1xuICAgICAgICB0aGlzLnNldFN0YXJ0T2Zmc2V0cyhhY3Rpb24ubmFtZSwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KTtcbiAgICAgICAgdGhpcy5zZXRNb2RpZmljYXRpb25zKHRoaXMuc3RhcnRDb29yZHMucGFnZSk7XG5cbiAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSB0aGlzW3RoaXMucHJlcGFyZWQubmFtZSArICdTdGFydCddKHRoaXMuZG93bkV2ZW50KTtcbiAgICB9LFxuXG4gICAgcG9pbnRlck1vdmU6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBwcmVFbmQpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRQb2ludGVyKHBvaW50ZXIpO1xuXG4gICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLmN1ckNvb3JkcywgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50KVxuICAgICAgICAgICAgPyB0aGlzLmluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudFxuICAgICAgICAgICAgOiB1bmRlZmluZWQpO1xuXG4gICAgICAgIHZhciBkdXBsaWNhdGVNb3ZlID0gKHRoaXMuY3VyQ29vcmRzLnBhZ2UueCA9PT0gdGhpcy5wcmV2Q29vcmRzLnBhZ2UueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5wYWdlLnkgPT09IHRoaXMucHJldkNvb3Jkcy5wYWdlLnlcbiAgICAgICAgJiYgdGhpcy5jdXJDb29yZHMuY2xpZW50LnggPT09IHRoaXMucHJldkNvb3Jkcy5jbGllbnQueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueSA9PT0gdGhpcy5wcmV2Q29vcmRzLmNsaWVudC55KTtcblxuICAgICAgICB2YXIgZHgsIGR5LFxuICAgICAgICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIG1vdmVtZW50IGdyZWF0ZXIgdGhhbiBwb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgICAgICAgZHggPSB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueCAtIHRoaXMuc3RhcnRDb29yZHMuY2xpZW50Lng7XG4gICAgICAgICAgICBkeSA9IHRoaXMuY3VyQ29vcmRzLmNsaWVudC55IC0gdGhpcy5zdGFydENvb3Jkcy5jbGllbnQueTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gc2NvcGUucG9pbnRlck1vdmVUb2xlcmFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWR1cGxpY2F0ZU1vdmUgJiYgKCF0aGlzLnBvaW50ZXJJc0Rvd24gfHwgdGhpcy5wb2ludGVyV2FzTW92ZWQpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ21vdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5wb2ludGVySXNEb3duKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmIChkdXBsaWNhdGVNb3ZlICYmIHRoaXMucG9pbnRlcldhc01vdmVkICYmICFwcmVFbmQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgcG9pbnRlciBjb29yZGluYXRlLCB0aW1lIGNoYW5nZXMgYW5kIHNwZWVkc1xuICAgICAgICB1dGlscy5zZXRFdmVudERlbHRhcyh0aGlzLnBvaW50ZXJEZWx0YSwgdGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkXG4gICAgICAgICAgICAgICAgLy8gaWdub3JlIG1vdmVtZW50IHdoaWxlIGluZXJ0aWEgaXMgYWN0aXZlXG4gICAgICAgICAgICAmJiAoIXRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgfHwgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50ICYmIC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkpKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIGp1c3Qgc3RhcnRpbmcgYW4gYWN0aW9uLCBjYWxjdWxhdGUgdGhlIHBvaW50ZXIgc3BlZWQgbm93XG4gICAgICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNldEV2ZW50RGVsdGFzKHRoaXMucG9pbnRlckRlbHRhLCB0aGlzLnByZXZDb29yZHMsIHRoaXMuY3VyQ29vcmRzKTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGEgZHJhZyBpcyBpbiB0aGUgY29ycmVjdCBheGlzXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJlcGFyZWQubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhYnNYID0gTWF0aC5hYnMoZHgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWJzWSA9IE1hdGguYWJzKGR5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEF4aXMgPSB0aGlzLnRhcmdldC5vcHRpb25zLmRyYWcuYXhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXMgPSAoYWJzWCA+IGFic1kgPyAneCcgOiBhYnNYIDwgYWJzWSA/ICd5JyA6ICd4eScpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBtb3ZlbWVudCBpc24ndCBpbiB0aGUgYXhpcyBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgICAgIGlmIChheGlzICE9PSAneHknICYmIHRhcmdldEF4aXMgIT09ICd4eScgJiYgdGFyZ2V0QXhpcyAhPT0gYXhpcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuY2VsIHRoZSBwcmVwYXJlZCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRvIGdldCBhIGRyYWcgZnJvbSBhbm90aGVyIGluZXJhY3RhYmxlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGVsZW1lbnQgaW50ZXJhY3RhYmxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50SW50ZXJhY3RhYmxlID0gc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudEludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBlbGVtZW50SW50ZXJhY3RhYmxlICE9PSB0aGlzLnRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhZWxlbWVudEludGVyYWN0YWJsZS5vcHRpb25zLmRyYWcubWFudWFsU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgZWxlbWVudEludGVyYWN0YWJsZS5nZXRBY3Rpb24odGhpcy5kb3duUG9pbnRlciwgdGhpcy5kb3duRXZlbnQsIHRoaXMsIGVsZW1lbnQpLm5hbWUgPT09ICdkcmFnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5jaGVja0F4aXMoYXhpcywgZWxlbWVudEludGVyYWN0YWJsZSkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gZWxlbWVudEludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlJ3Mgbm8gZHJhZyBmcm9tIGVsZW1lbnQgaW50ZXJhY3RhYmxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBzZWxlY3RvciBpbnRlcmFjdGFibGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucHJlcGFyZWQubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzSW50ZXJhY3Rpb24gPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdldERyYWdnYWJsZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlID09PSB0aGlzSW50ZXJhY3Rpb24udGFyZ2V0KSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFpbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUudGVzdEFsbG93KGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIGVsZW1lbnRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgaW50ZXJhY3RhYmxlLmdldEFjdGlvbih0aGlzSW50ZXJhY3Rpb24uZG93blBvaW50ZXIsIHRoaXNJbnRlcmFjdGlvbi5kb3duRXZlbnQsIHRoaXNJbnRlcmFjdGlvbiwgZWxlbWVudCkubmFtZSA9PT0gJ2RyYWcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5jaGVja0F4aXMoYXhpcywgaW50ZXJhY3RhYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChpbnRlcmFjdGFibGUsIGVsZW1lbnQsICdkcmFnJykpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RvckludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKGdldERyYWdnYWJsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9ySW50ZXJhY3RhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IHNlbGVjdG9ySW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3RhcnRpbmcgPSAhIXRoaXMucHJlcGFyZWQubmFtZSAmJiAhdGhpcy5pbnRlcmFjdGluZygpO1xuXG4gICAgICAgICAgICBpZiAoc3RhcnRpbmdcbiAgICAgICAgICAgICAgICAmJiAodGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgfHwgIXNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQodGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCwgdGhpcy5wcmVwYXJlZCkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKGV2ZW50KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByZXBhcmVkLm5hbWUgJiYgdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydCh0aGlzLnByZXBhcmVkLCB0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc2hvdWxkTW92ZSA9IHRoaXMuc2V0TW9kaWZpY2F0aW9ucyh0aGlzLmN1ckNvb3Jkcy5wYWdlLCBwcmVFbmQpO1xuXG4gICAgICAgICAgICAgICAgLy8gbW92ZSBpZiBzbmFwcGluZyBvciByZXN0cmljdGlvbiBkb2Vzbid0IHByZXZlbnQgaXRcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkTW92ZSB8fCBzdGFydGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZFdmVudCA9IHRoaXNbdGhpcy5wcmVwYXJlZC5uYW1lICsgJ01vdmUnXShldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWxzLmNvcHlDb29yZHModGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcgfHwgdGhpcy5yZXNpemluZykge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2Nyb2xsTW92ZShwb2ludGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkcmFnU3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZHJhZ0V2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdkcmFnJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICB0aGlzLmRyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShkcmFnRXZlbnQpO1xuXG4gICAgICAgIC8vIHJlc2V0IGFjdGl2ZSBkcm9wem9uZXNcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyAgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyAgICAgPSBbXTtcblxuICAgICAgICBpZiAoIXRoaXMuZHluYW1pY0Ryb3ApIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlRHJvcHModGhpcy5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkcm9wRXZlbnRzID0gdGhpcy5nZXREcm9wRXZlbnRzKGV2ZW50LCBkcmFnRXZlbnQpO1xuXG4gICAgICAgIGlmIChkcm9wRXZlbnRzLmFjdGl2YXRlKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmVBY3RpdmVEcm9wcyhkcm9wRXZlbnRzLmFjdGl2YXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkcmFnRXZlbnQ7XG4gICAgfSxcblxuICAgIGRyYWdNb3ZlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgZHJhZ0V2ZW50ICA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZHJhZycsICdtb3ZlJywgdGhpcy5lbGVtZW50KSxcbiAgICAgICAgICAgIGRyYWdnYWJsZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnQsXG4gICAgICAgICAgICBkcm9wID0gdGhpcy5nZXREcm9wKGV2ZW50LCBkcmFnZ2FibGVFbGVtZW50KTtcblxuICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSBkcm9wLmRyb3B6b25lO1xuICAgICAgICB0aGlzLmRyb3BFbGVtZW50ID0gZHJvcC5lbGVtZW50O1xuXG4gICAgICAgIHZhciBkcm9wRXZlbnRzID0gdGhpcy5nZXREcm9wRXZlbnRzKGV2ZW50LCBkcmFnRXZlbnQpO1xuXG4gICAgICAgIHRhcmdldC5maXJlKGRyYWdFdmVudCk7XG5cbiAgICAgICAgaWYgKGRyb3BFdmVudHMubGVhdmUpIHsgdGhpcy5wcmV2RHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubGVhdmUpOyB9XG4gICAgICAgIGlmIChkcm9wRXZlbnRzLmVudGVyKSB7ICAgICB0aGlzLmRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmVudGVyKTsgfVxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5tb3ZlICkgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5tb3ZlICk7IH1cblxuICAgICAgICB0aGlzLnByZXZEcm9wVGFyZ2V0ICA9IHRoaXMuZHJvcFRhcmdldDtcbiAgICAgICAgdGhpcy5wcmV2RHJvcEVsZW1lbnQgPSB0aGlzLmRyb3BFbGVtZW50O1xuXG4gICAgICAgIHJldHVybiBkcmFnRXZlbnQ7XG4gICAgfSxcblxuICAgIHJlc2l6ZVN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlc2l6ZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdyZXNpemUnLCAnc3RhcnQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLnByZXBhcmVkLmVkZ2VzKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnRSZWN0ID0gdGhpcy50YXJnZXQuZ2V0UmVjdCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy50YXJnZXQub3B0aW9ucy5yZXNpemUuc3F1YXJlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNxdWFyZUVkZ2VzID0gdXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnByZXBhcmVkLmVkZ2VzKTtcblxuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLnRvcCAgICA9IHNxdWFyZUVkZ2VzLnRvcCAgICB8fCAoc3F1YXJlRWRnZXMubGVmdCAgICYmICFzcXVhcmVFZGdlcy5ib3R0b20pO1xuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLmxlZnQgICA9IHNxdWFyZUVkZ2VzLmxlZnQgICB8fCAoc3F1YXJlRWRnZXMudG9wICAgICYmICFzcXVhcmVFZGdlcy5yaWdodCApO1xuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLmJvdHRvbSA9IHNxdWFyZUVkZ2VzLmJvdHRvbSB8fCAoc3F1YXJlRWRnZXMucmlnaHQgICYmICFzcXVhcmVFZGdlcy50b3AgICApO1xuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLnJpZ2h0ICA9IHNxdWFyZUVkZ2VzLnJpZ2h0ICB8fCAoc3F1YXJlRWRnZXMuYm90dG9tICYmICFzcXVhcmVFZGdlcy5sZWZ0ICApO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5fc3F1YXJlRWRnZXMgPSBzcXVhcmVFZGdlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuX3NxdWFyZUVkZ2VzID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXNpemVSZWN0cyA9IHtcbiAgICAgICAgICAgICAgICBzdGFydCAgICAgOiBzdGFydFJlY3QsXG4gICAgICAgICAgICAgICAgY3VycmVudCAgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQ6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICAgICAgICAgICAgICBwcmV2aW91cyAgOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgICAgICAgICAgICAgZGVsdGEgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLCByaWdodCA6IDAsIHdpZHRoIDogMCxcbiAgICAgICAgICAgICAgICAgICAgdG9wIDogMCwgYm90dG9tOiAwLCBoZWlnaHQ6IDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXNpemVFdmVudC5yZWN0ID0gdGhpcy5yZXNpemVSZWN0cy5yZXN0cmljdGVkO1xuICAgICAgICAgICAgcmVzaXplRXZlbnQuZGVsdGFSZWN0ID0gdGhpcy5yZXNpemVSZWN0cy5kZWx0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGFyZ2V0LmZpcmUocmVzaXplRXZlbnQpO1xuXG4gICAgICAgIHRoaXMucmVzaXppbmcgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiByZXNpemVFdmVudDtcbiAgICB9LFxuXG4gICAgcmVzaXplTW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciByZXNpemVFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ21vdmUnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIHZhciBlZGdlcyA9IHRoaXMucHJlcGFyZWQuZWRnZXMsXG4gICAgICAgICAgICBpbnZlcnQgPSB0aGlzLnRhcmdldC5vcHRpb25zLnJlc2l6ZS5pbnZlcnQsXG4gICAgICAgICAgICBpbnZlcnRpYmxlID0gaW52ZXJ0ID09PSAncmVwb3NpdGlvbicgfHwgaW52ZXJ0ID09PSAnbmVnYXRlJztcblxuICAgICAgICBpZiAoZWRnZXMpIHtcbiAgICAgICAgICAgIHZhciBkeCA9IHJlc2l6ZUV2ZW50LmR4LFxuICAgICAgICAgICAgICAgIGR5ID0gcmVzaXplRXZlbnQuZHksXG5cbiAgICAgICAgICAgICAgICBzdGFydCAgICAgID0gdGhpcy5yZXNpemVSZWN0cy5zdGFydCxcbiAgICAgICAgICAgICAgICBjdXJyZW50ICAgID0gdGhpcy5yZXNpemVSZWN0cy5jdXJyZW50LFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQgPSB0aGlzLnJlc2l6ZVJlY3RzLnJlc3RyaWN0ZWQsXG4gICAgICAgICAgICAgICAgZGVsdGEgICAgICA9IHRoaXMucmVzaXplUmVjdHMuZGVsdGEsXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgICA9IHV0aWxzLmV4dGVuZCh0aGlzLnJlc2l6ZVJlY3RzLnByZXZpb3VzLCByZXN0cmljdGVkKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Lm9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgICAgICAgICAgICAgIHZhciBvcmlnaW5hbEVkZ2VzID0gZWRnZXM7XG5cbiAgICAgICAgICAgICAgICBlZGdlcyA9IHRoaXMucHJlcGFyZWQuX3NxdWFyZUVkZ2VzO1xuXG4gICAgICAgICAgICAgICAgaWYgKChvcmlnaW5hbEVkZ2VzLmxlZnQgJiYgb3JpZ2luYWxFZGdlcy5ib3R0b20pXG4gICAgICAgICAgICAgICAgICAgIHx8IChvcmlnaW5hbEVkZ2VzLnJpZ2h0ICYmIG9yaWdpbmFsRWRnZXMudG9wKSkge1xuICAgICAgICAgICAgICAgICAgICBkeSA9IC1keDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy5sZWZ0IHx8IG9yaWdpbmFsRWRnZXMucmlnaHQpIHsgZHkgPSBkeDsgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMudG9wIHx8IG9yaWdpbmFsRWRnZXMuYm90dG9tKSB7IGR4ID0gZHk7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSAnY3VycmVudCcgcmVjdCB3aXRob3V0IG1vZGlmaWNhdGlvbnNcbiAgICAgICAgICAgIGlmIChlZGdlcy50b3AgICApIHsgY3VycmVudC50b3AgICAgKz0gZHk7IH1cbiAgICAgICAgICAgIGlmIChlZGdlcy5ib3R0b20pIHsgY3VycmVudC5ib3R0b20gKz0gZHk7IH1cbiAgICAgICAgICAgIGlmIChlZGdlcy5sZWZ0ICApIHsgY3VycmVudC5sZWZ0ICAgKz0gZHg7IH1cbiAgICAgICAgICAgIGlmIChlZGdlcy5yaWdodCApIHsgY3VycmVudC5yaWdodCAgKz0gZHg7IH1cblxuICAgICAgICAgICAgaWYgKGludmVydGlibGUpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBpbnZlcnRpYmxlLCBjb3B5IHRoZSBjdXJyZW50IHJlY3RcbiAgICAgICAgICAgICAgICB1dGlscy5leHRlbmQocmVzdHJpY3RlZCwgY3VycmVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW52ZXJ0ID09PSAncmVwb3NpdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3dhcCBlZGdlIHZhbHVlcyBpZiBuZWNlc3NhcnkgdG8ga2VlcCB3aWR0aC9oZWlnaHQgcG9zaXRpdmVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN3YXA7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3RyaWN0ZWQudG9wID4gcmVzdHJpY3RlZC5ib3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXAgPSByZXN0cmljdGVkLnRvcDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3RlZC50b3AgPSByZXN0cmljdGVkLmJvdHRvbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQuYm90dG9tID0gc3dhcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdHJpY3RlZC5sZWZ0ID4gcmVzdHJpY3RlZC5yaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dhcCA9IHJlc3RyaWN0ZWQubGVmdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3RlZC5sZWZ0ID0gcmVzdHJpY3RlZC5yaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQucmlnaHQgPSBzd2FwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgbm90IGludmVydGlibGUsIHJlc3RyaWN0IHRvIG1pbmltdW0gb2YgMHgwIHJlY3RcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkLnRvcCAgICA9IE1hdGgubWluKGN1cnJlbnQudG9wLCBzdGFydC5ib3R0b20pO1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQuYm90dG9tID0gTWF0aC5tYXgoY3VycmVudC5ib3R0b20sIHN0YXJ0LnRvcCk7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC5sZWZ0ICAgPSBNYXRoLm1pbihjdXJyZW50LmxlZnQsIHN0YXJ0LnJpZ2h0KTtcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkLnJpZ2h0ICA9IE1hdGgubWF4KGN1cnJlbnQucmlnaHQsIHN0YXJ0LmxlZnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN0cmljdGVkLndpZHRoICA9IHJlc3RyaWN0ZWQucmlnaHQgIC0gcmVzdHJpY3RlZC5sZWZ0O1xuICAgICAgICAgICAgcmVzdHJpY3RlZC5oZWlnaHQgPSByZXN0cmljdGVkLmJvdHRvbSAtIHJlc3RyaWN0ZWQudG9wIDtcblxuICAgICAgICAgICAgZm9yICh2YXIgZWRnZSBpbiByZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgZGVsdGFbZWRnZV0gPSByZXN0cmljdGVkW2VkZ2VdIC0gcHJldmlvdXNbZWRnZV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmVkZ2VzID0gdGhpcy5wcmVwYXJlZC5lZGdlcztcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LnJlY3QgPSByZXN0cmljdGVkO1xuICAgICAgICAgICAgcmVzaXplRXZlbnQuZGVsdGFSZWN0ID0gZGVsdGE7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKHJlc2l6ZUV2ZW50KTtcblxuICAgICAgICByZXR1cm4gcmVzaXplRXZlbnQ7XG4gICAgfSxcblxuICAgIGdlc3R1cmVTdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBnZXN0dXJlRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ2dlc3R1cmUnLCAnc3RhcnQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGdlc3R1cmVFdmVudC5kcyA9IDA7XG5cbiAgICAgICAgdGhpcy5nZXN0dXJlLnN0YXJ0RGlzdGFuY2UgPSB0aGlzLmdlc3R1cmUucHJldkRpc3RhbmNlID0gZ2VzdHVyZUV2ZW50LmRpc3RhbmNlO1xuICAgICAgICB0aGlzLmdlc3R1cmUuc3RhcnRBbmdsZSA9IHRoaXMuZ2VzdHVyZS5wcmV2QW5nbGUgPSBnZXN0dXJlRXZlbnQuYW5nbGU7XG4gICAgICAgIHRoaXMuZ2VzdHVyZS5zY2FsZSA9IDE7XG5cbiAgICAgICAgdGhpcy5nZXN0dXJpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMudGFyZ2V0LmZpcmUoZ2VzdHVyZUV2ZW50KTtcblxuICAgICAgICByZXR1cm4gZ2VzdHVyZUV2ZW50O1xuICAgIH0sXG5cbiAgICBnZXN0dXJlTW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5wb2ludGVySWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJldkV2ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdlc3R1cmVFdmVudDtcblxuICAgICAgICBnZXN0dXJlRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ2dlc3R1cmUnLCAnbW92ZScsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIGdlc3R1cmVFdmVudC5kcyA9IGdlc3R1cmVFdmVudC5zY2FsZSAtIHRoaXMuZ2VzdHVyZS5zY2FsZTtcblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKGdlc3R1cmVFdmVudCk7XG5cbiAgICAgICAgdGhpcy5nZXN0dXJlLnByZXZBbmdsZSA9IGdlc3R1cmVFdmVudC5hbmdsZTtcbiAgICAgICAgdGhpcy5nZXN0dXJlLnByZXZEaXN0YW5jZSA9IGdlc3R1cmVFdmVudC5kaXN0YW5jZTtcblxuICAgICAgICBpZiAoZ2VzdHVyZUV2ZW50LnNjYWxlICE9PSBJbmZpbml0eSAmJlxuICAgICAgICAgICAgZ2VzdHVyZUV2ZW50LnNjYWxlICE9PSBudWxsICYmXG4gICAgICAgICAgICBnZXN0dXJlRXZlbnQuc2NhbGUgIT09IHVuZGVmaW5lZCAgJiZcbiAgICAgICAgICAgICFpc05hTihnZXN0dXJlRXZlbnQuc2NhbGUpKSB7XG5cbiAgICAgICAgICAgIHRoaXMuZ2VzdHVyZS5zY2FsZSA9IGdlc3R1cmVFdmVudC5zY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXN0dXJlRXZlbnQ7XG4gICAgfSxcblxuICAgIHBvaW50ZXJIb2xkOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdob2xkJyk7XG4gICAgfSxcblxuICAgIHBvaW50ZXJVcDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpIHtcbiAgICAgICAgdmFyIHBvaW50ZXJJbmRleCA9IHRoaXMubW91c2U/IDAgOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpKTtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5ob2xkVGltZXJzW3BvaW50ZXJJbmRleF0pO1xuXG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICd1cCcgKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ3RhcCcpO1xuXG4gICAgICAgIHRoaXMucG9pbnRlckVuZChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlcik7XG4gICAgfSxcblxuICAgIHBvaW50ZXJDYW5jZWw6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcblxuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnY2FuY2VsJyk7XG4gICAgICAgIHRoaXMucG9pbnRlckVuZChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlcik7XG4gICAgfSxcblxuICAgIC8vIGh0dHA6Ly93d3cucXVpcmtzbW9kZS5vcmcvZG9tL2V2ZW50cy9jbGljay5odG1sXG4gICAgLy8gPkV2ZW50cyBsZWFkaW5nIHRvIGRibGNsaWNrXG4gICAgLy9cbiAgICAvLyBJRTggZG9lc24ndCBmaXJlIGRvd24gZXZlbnQgYmVmb3JlIGRibGNsaWNrLlxuICAgIC8vIFRoaXMgd29ya2Fyb3VuZCB0cmllcyB0byBmaXJlIGEgdGFwIGFuZCBkb3VibGV0YXAgYWZ0ZXIgZGJsY2xpY2tcbiAgICBpZThEYmxjbGljazogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5wcmV2VGFwXG4gICAgICAgICAgICAmJiBldmVudC5jbGllbnRYID09PSB0aGlzLnByZXZUYXAuY2xpZW50WFxuICAgICAgICAgICAgJiYgZXZlbnQuY2xpZW50WSA9PT0gdGhpcy5wcmV2VGFwLmNsaWVudFlcbiAgICAgICAgICAgICYmIGV2ZW50VGFyZ2V0ICAgPT09IHRoaXMucHJldlRhcC50YXJnZXQpIHtcblxuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1swXSA9IGV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbMF0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICd0YXAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBFbmQgaW50ZXJhY3QgbW92ZSBldmVudHMgYW5kIHN0b3AgYXV0by1zY3JvbGwgdW5sZXNzIGluZXJ0aWEgaXMgZW5hYmxlZFxuICAgIHBvaW50ZXJFbmQ6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBlbmRFdmVudCxcbiAgICAgICAgICAgIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRhcmdldCAmJiB0YXJnZXQub3B0aW9ucyxcbiAgICAgICAgICAgIGluZXJ0aWFPcHRpb25zID0gb3B0aW9ucyAmJiB0aGlzLnByZXBhcmVkLm5hbWUgJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEsXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzID0gdGhpcy5pbmVydGlhU3RhdHVzO1xuXG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcblxuICAgICAgICAgICAgaWYgKGluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICB2YXIgcG9pbnRlclNwZWVkLFxuICAgICAgICAgICAgICAgIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgICAgIGluZXJ0aWFQb3NzaWJsZSA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGluZXJ0aWEgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBzbW9vdGhFbmQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBlbmRTbmFwID0gc2NvcGUuY2hlY2tTbmFwKHRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSAmJiBvcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcC5lbmRPbmx5LFxuICAgICAgICAgICAgICAgIGVuZFJlc3RyaWN0ID0gc2NvcGUuY2hlY2tSZXN0cmljdCh0YXJnZXQsIHRoaXMucHJlcGFyZWQubmFtZSkgJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LmVuZE9ubHksXG4gICAgICAgICAgICAgICAgZHggPSAwLFxuICAgICAgICAgICAgICAgIGR5ID0gMCxcbiAgICAgICAgICAgICAgICBzdGFydEV2ZW50O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5kcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIGlmICAgICAgKG9wdGlvbnMuZHJhZy5heGlzID09PSAneCcgKSB7IHBvaW50ZXJTcGVlZCA9IE1hdGguYWJzKHRoaXMucG9pbnRlckRlbHRhLmNsaWVudC52eCk7IH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmRyYWcuYXhpcyA9PT0gJ3knICkgeyBwb2ludGVyU3BlZWQgPSBNYXRoLmFicyh0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudnkpOyB9XG4gICAgICAgICAgICAgICAgZWxzZSAgIC8qb3B0aW9ucy5kcmFnLmF4aXMgPT09ICd4eScqL3sgcG9pbnRlclNwZWVkID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnNwZWVkOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwb2ludGVyU3BlZWQgPSB0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQuc3BlZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGluZXJ0aWEgc2hvdWxkIGJlIHN0YXJ0ZWRcbiAgICAgICAgICAgIGluZXJ0aWFQb3NzaWJsZSA9IChpbmVydGlhT3B0aW9ucyAmJiBpbmVydGlhT3B0aW9ucy5lbmFibGVkXG4gICAgICAgICAgICAmJiB0aGlzLnByZXBhcmVkLm5hbWUgIT09ICdnZXN0dXJlJ1xuICAgICAgICAgICAgJiYgZXZlbnQgIT09IGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWEgPSAoaW5lcnRpYVBvc3NpYmxlXG4gICAgICAgICAgICAmJiAobm93IC0gdGhpcy5jdXJDb29yZHMudGltZVN0YW1wKSA8IDUwXG4gICAgICAgICAgICAmJiBwb2ludGVyU3BlZWQgPiBpbmVydGlhT3B0aW9ucy5taW5TcGVlZFxuICAgICAgICAgICAgJiYgcG9pbnRlclNwZWVkID4gaW5lcnRpYU9wdGlvbnMuZW5kU3BlZWQpO1xuXG4gICAgICAgICAgICBpZiAoaW5lcnRpYVBvc3NpYmxlICYmICFpbmVydGlhICYmIChlbmRTbmFwIHx8IGVuZFJlc3RyaWN0KSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNuYXBSZXN0cmljdCA9IHt9O1xuXG4gICAgICAgICAgICAgICAgc25hcFJlc3RyaWN0LnNuYXAgPSBzbmFwUmVzdHJpY3QucmVzdHJpY3QgPSBzbmFwUmVzdHJpY3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoZW5kU25hcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNuYXBwaW5nKHRoaXMuY3VyQ29vcmRzLnBhZ2UsIHNuYXBSZXN0cmljdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzbmFwUmVzdHJpY3QubG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeCArPSBzbmFwUmVzdHJpY3QuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBzbmFwUmVzdHJpY3QuZHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZW5kUmVzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRSZXN0cmljdGlvbih0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzbmFwUmVzdHJpY3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc25hcFJlc3RyaWN0LnJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHNuYXBSZXN0cmljdC5keDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5ICs9IHNuYXBSZXN0cmljdC5keTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChkeCB8fCBkeSkge1xuICAgICAgICAgICAgICAgICAgICBzbW9vdGhFbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGluZXJ0aWEgfHwgc21vb3RoRW5kKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuY29weUNvb3JkcyhpbmVydGlhU3RhdHVzLnVwQ29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJzWzBdID0gaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50ID0gc3RhcnRFdmVudCA9XG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCB0aGlzLnByZXBhcmVkLm5hbWUsICdpbmVydGlhc3RhcnQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy50MCA9IG5vdztcblxuICAgICAgICAgICAgICAgIHRhcmdldC5maXJlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5lcnRpYSkge1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnZ4MCA9IHRoaXMucG9pbnRlckRlbHRhLmNsaWVudC52eDtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy52eTAgPSB0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudnk7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudjAgPSBwb2ludGVyU3BlZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxjSW5lcnRpYShpbmVydGlhU3RhdHVzKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IHV0aWxzLmV4dGVuZCh7fSwgdGhpcy5jdXJDb29yZHMucGFnZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5nZXRPcmlnaW5YWSh0YXJnZXQsIHRoaXMuZWxlbWVudCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNPYmplY3Q7XG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS54ID0gcGFnZS54ICsgaW5lcnRpYVN0YXR1cy54ZSAtIG9yaWdpbi54O1xuICAgICAgICAgICAgICAgICAgICBwYWdlLnkgPSBwYWdlLnkgKyBpbmVydGlhU3RhdHVzLnllIC0gb3JpZ2luLnk7XG5cbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzT2JqZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlU3RhdHVzWFk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYWdlLngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYWdlLnksXG4gICAgICAgICAgICAgICAgICAgICAgICBkeDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc25hcDogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c09iamVjdC5zbmFwID0gc3RhdHVzT2JqZWN0O1xuXG4gICAgICAgICAgICAgICAgICAgIGR4ID0gZHkgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRTbmFwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc25hcCA9IHRoaXMuc2V0U25hcHBpbmcodGhpcy5jdXJDb29yZHMucGFnZSwgc3RhdHVzT2JqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNuYXAubG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHggKz0gc25hcC5keDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBzbmFwLmR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdHJpY3QgPSB0aGlzLnNldFJlc3RyaWN0aW9uKHRoaXMuY3VyQ29vcmRzLnBhZ2UsIHN0YXR1c09iamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN0cmljdC5yZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHggKz0gcmVzdHJpY3QuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gcmVzdHJpY3QuZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWGUgKz0gZHg7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZSArPSBkeTtcblxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLmkgPSBhbmltYXRpb25GcmFtZS5yZXF1ZXN0KHRoaXMuYm91bmRJbmVydGlhRnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zbW9vdGhFbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnhlID0gZHg7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMueWUgPSBkeTtcblxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy5zeSA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5pID0gYW5pbWF0aW9uRnJhbWUucmVxdWVzdCh0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbmRTbmFwIHx8IGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgLy8gZmlyZSBhIG1vdmUgZXZlbnQgYXQgdGhlIHNuYXBwZWQgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgICAgIGVuZEV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdkcmFnJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHZhciBkcmFnZ2FibGVFbGVtZW50ID0gdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgICAgIGRyb3AgPSB0aGlzLmdldERyb3AoZXZlbnQsIGRyYWdnYWJsZUVsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSBkcm9wLmRyb3B6b25lO1xuICAgICAgICAgICAgdGhpcy5kcm9wRWxlbWVudCA9IGRyb3AuZWxlbWVudDtcblxuICAgICAgICAgICAgdmFyIGRyb3BFdmVudHMgPSB0aGlzLmdldERyb3BFdmVudHMoZXZlbnQsIGVuZEV2ZW50KTtcblxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMubGVhdmUpIHsgdGhpcy5wcmV2RHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubGVhdmUpOyB9XG4gICAgICAgICAgICBpZiAoZHJvcEV2ZW50cy5lbnRlcikgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5lbnRlcik7IH1cbiAgICAgICAgICAgIGlmIChkcm9wRXZlbnRzLmRyb3AgKSB7ICAgICB0aGlzLmRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmRyb3AgKTsgfVxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMuZGVhY3RpdmF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZUFjdGl2ZURyb3BzKGRyb3BFdmVudHMuZGVhY3RpdmF0ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhcmdldC5maXJlKGVuZEV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnJlc2l6aW5nKSB7XG4gICAgICAgICAgICBlbmRFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5nZXN0dXJpbmcpIHtcbiAgICAgICAgICAgIGVuZEV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0b3AoZXZlbnQpO1xuICAgIH0sXG5cbiAgICBjb2xsZWN0RHJvcHM6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIHZhciBkcm9wcyA9IFtdLFxuICAgICAgICAgICAgZWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgdGhpcy5lbGVtZW50O1xuXG4gICAgICAgIC8vIGNvbGxlY3QgYWxsIGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgd2hpY2ggcXVhbGlmeSBmb3IgYSBkcm9wXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzY29wZS5pbnRlcmFjdGFibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXNjb3BlLmludGVyYWN0YWJsZXNbaV0ub3B0aW9ucy5kcm9wLmVuYWJsZWQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBzY29wZS5pbnRlcmFjdGFibGVzW2ldLFxuICAgICAgICAgICAgICAgIGFjY2VwdCA9IGN1cnJlbnQub3B0aW9ucy5kcm9wLmFjY2VwdDtcblxuICAgICAgICAgICAgLy8gdGVzdCB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQgYWdhaW5zdCB0aGUgZHJvcHpvbmUncyBhY2NlcHQgc2V0dGluZ1xuICAgICAgICAgICAgaWYgKCh1dGlscy5pc0VsZW1lbnQoYWNjZXB0KSAmJiBhY2NlcHQgIT09IGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgfHwgKHNjb3BlLmlzU3RyaW5nKGFjY2VwdClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIGFjY2VwdCkpKSB7XG5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcXVlcnkgZm9yIG5ldyBlbGVtZW50cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgIHZhciBkcm9wRWxlbWVudHMgPSBjdXJyZW50LnNlbGVjdG9yPyBjdXJyZW50Ll9jb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoY3VycmVudC5zZWxlY3RvcikgOiBbY3VycmVudC5fZWxlbWVudF07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBsZW4gPSBkcm9wRWxlbWVudHMubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEVsZW1lbnQgPSBkcm9wRWxlbWVudHNbal07XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZHJvcHMucHVzaChjdXJyZW50KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkcm9wem9uZXM6IGRyb3BzLFxuICAgICAgICAgICAgZWxlbWVudHM6IGVsZW1lbnRzXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGZpcmVBY3RpdmVEcm9wczogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgY3VycmVudCxcbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50LFxuICAgICAgICAgICAgcHJldkVsZW1lbnQ7XG5cbiAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGFsbCBhY3RpdmUgZHJvcHpvbmVzIGFuZCB0cmlnZ2VyIGV2ZW50XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudCA9IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzW2ldO1xuICAgICAgICAgICAgY3VycmVudEVsZW1lbnQgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtpXTtcblxuICAgICAgICAgICAgLy8gcHJldmVudCB0cmlnZ2VyIG9mIGR1cGxpY2F0ZSBldmVudHMgb24gc2FtZSBlbGVtZW50XG4gICAgICAgICAgICBpZiAoY3VycmVudEVsZW1lbnQgIT09IHByZXZFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0IGN1cnJlbnQgZWxlbWVudCBhcyBldmVudCB0YXJnZXRcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBjdXJyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICBjdXJyZW50LmZpcmUoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldkVsZW1lbnQgPSBjdXJyZW50RWxlbWVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBDb2xsZWN0IGEgbmV3IHNldCBvZiBwb3NzaWJsZSBkcm9wcyBhbmQgc2F2ZSB0aGVtIGluIGFjdGl2ZURyb3BzLlxuICAgIC8vIHNldEFjdGl2ZURyb3BzIHNob3VsZCBhbHdheXMgYmUgY2FsbGVkIHdoZW4gYSBkcmFnIGhhcyBqdXN0IHN0YXJ0ZWQgb3IgYVxuICAgIC8vIGRyYWcgZXZlbnQgaGFwcGVucyB3aGlsZSBkeW5hbWljRHJvcCBpcyB0cnVlXG4gICAgc2V0QWN0aXZlRHJvcHM6IGZ1bmN0aW9uIChkcmFnRWxlbWVudCkge1xuICAgICAgICAvLyBnZXQgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB0aGF0IGNvdWxkIHJlY2VpdmUgdGhlIGRyYWdnYWJsZVxuICAgICAgICB2YXIgcG9zc2libGVEcm9wcyA9IHRoaXMuY29sbGVjdERyb3BzKGRyYWdFbGVtZW50LCB0cnVlKTtcblxuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcyA9IHBvc3NpYmxlRHJvcHMuZHJvcHpvbmVzO1xuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzICA9IHBvc3NpYmxlRHJvcHMuZWxlbWVudHM7XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5yZWN0c1tpXSA9IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzW2ldLmdldFJlY3QodGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50c1tpXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0RHJvcDogZnVuY3Rpb24gKGV2ZW50LCBkcmFnRWxlbWVudCkge1xuICAgICAgICB2YXIgdmFsaWREcm9wcyA9IFtdO1xuXG4gICAgICAgIGlmIChzY29wZS5keW5hbWljRHJvcCkge1xuICAgICAgICAgICAgdGhpcy5zZXRBY3RpdmVEcm9wcyhkcmFnRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudCAgICAgICAgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tqXSxcbiAgICAgICAgICAgICAgICBjdXJyZW50RWxlbWVudCA9IHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHMgW2pdLFxuICAgICAgICAgICAgICAgIHJlY3QgICAgICAgICAgID0gdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyAgICBbal07XG5cbiAgICAgICAgICAgIHZhbGlkRHJvcHMucHVzaChjdXJyZW50LmRyb3BDaGVjayh0aGlzLnBvaW50ZXJzWzBdLCBldmVudCwgdGhpcy50YXJnZXQsIGRyYWdFbGVtZW50LCBjdXJyZW50RWxlbWVudCwgcmVjdClcbiAgICAgICAgICAgICAgICA/IGN1cnJlbnRFbGVtZW50XG4gICAgICAgICAgICAgICAgOiBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCB0aGUgbW9zdCBhcHByb3ByaWF0ZSBkcm9wem9uZSBiYXNlZCBvbiBET00gZGVwdGggYW5kIG9yZGVyXG4gICAgICAgIHZhciBkcm9wSW5kZXggPSBzY29wZS5pbmRleE9mRGVlcGVzdEVsZW1lbnQodmFsaWREcm9wcyksXG4gICAgICAgICAgICBkcm9wem9uZSAgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tkcm9wSW5kZXhdIHx8IG51bGwsXG4gICAgICAgICAgICBlbGVtZW50ICAgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtkcm9wSW5kZXhdIHx8IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRyb3B6b25lOiBkcm9wem9uZSxcbiAgICAgICAgICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0RHJvcEV2ZW50czogZnVuY3Rpb24gKHBvaW50ZXJFdmVudCwgZHJhZ0V2ZW50KSB7XG4gICAgICAgIHZhciBkcm9wRXZlbnRzID0ge1xuICAgICAgICAgICAgZW50ZXIgICAgIDogbnVsbCxcbiAgICAgICAgICAgIGxlYXZlICAgICA6IG51bGwsXG4gICAgICAgICAgICBhY3RpdmF0ZSAgOiBudWxsLFxuICAgICAgICAgICAgZGVhY3RpdmF0ZTogbnVsbCxcbiAgICAgICAgICAgIG1vdmUgICAgICA6IG51bGwsXG4gICAgICAgICAgICBkcm9wICAgICAgOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMuZHJvcEVsZW1lbnQgIT09IHRoaXMucHJldkRyb3BFbGVtZW50KSB7XG4gICAgICAgICAgICAvLyBpZiB0aGVyZSB3YXMgYSBwcmV2RHJvcFRhcmdldCwgY3JlYXRlIGEgZHJhZ2xlYXZlIGV2ZW50XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2RHJvcFRhcmdldCkge1xuICAgICAgICAgICAgICAgIGRyb3BFdmVudHMubGVhdmUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCAgICAgICA6IHRoaXMucHJldkRyb3BFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLnByZXZEcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICByZWxhdGVkVGFyZ2V0OiBkcmFnRXZlbnQudGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uICA6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcmFnbGVhdmUnXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGRyYWdFdmVudC5kcmFnTGVhdmUgPSB0aGlzLnByZXZEcm9wRWxlbWVudDtcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQucHJldkRyb3B6b25lID0gdGhpcy5wcmV2RHJvcFRhcmdldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHRoZSBkcm9wVGFyZ2V0IGlzIG5vdCBudWxsLCBjcmVhdGUgYSBkcmFnZW50ZXIgZXZlbnRcbiAgICAgICAgICAgIGlmICh0aGlzLmRyb3BUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICBkcm9wRXZlbnRzLmVudGVyID0ge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiB0aGlzLmRyb3BFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZSAgICA6IGRyYWdFdmVudC5pbnRlcmFjdGFibGUsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgdGltZVN0YW1wICAgIDogZHJhZ0V2ZW50LnRpbWVTdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2RyYWdlbnRlcidcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LmRyYWdFbnRlciA9IHRoaXMuZHJvcEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wVGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcgJiYgdGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLmRyb3AgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3AnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ3N0YXJ0Jykge1xuICAgICAgICAgICAgZHJvcEV2ZW50cy5hY3RpdmF0ZSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIGRyb3B6b25lICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3BhY3RpdmF0ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcpIHtcbiAgICAgICAgICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIGRyb3B6b25lICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3BkZWFjdGl2YXRlJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnbW92ZScgJiYgdGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLm1vdmUgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIGRyYWdtb3ZlICAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wbW92ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJvcEV2ZW50cztcbiAgICB9LFxuXG4gICAgY3VycmVudEFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuZHJhZ2dpbmcgJiYgJ2RyYWcnKSB8fCAodGhpcy5yZXNpemluZyAmJiAncmVzaXplJykgfHwgKHRoaXMuZ2VzdHVyaW5nICYmICdnZXN0dXJlJykgfHwgbnVsbDtcbiAgICB9LFxuXG4gICAgaW50ZXJhY3Rpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHJhZ2dpbmcgfHwgdGhpcy5yZXNpemluZyB8fCB0aGlzLmdlc3R1cmluZztcbiAgICB9LFxuXG4gICAgY2xlYXJUYXJnZXRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSB0aGlzLmRyb3BFbGVtZW50ID0gdGhpcy5wcmV2RHJvcFRhcmdldCA9IHRoaXMucHJldkRyb3BFbGVtZW50ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgIHNjb3BlLmF1dG9TY3JvbGwuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gW107XG4gICAgICAgICAgICB0aGlzLm1hdGNoRWxlbWVudHMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0Lm9wdGlvbnMuc3R5bGVDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHByZXZlbnQgRGVmYXVsdCBvbmx5IGlmIHdlcmUgcHJldmlvdXNseSBpbnRlcmFjdGluZ1xuICAgICAgICAgICAgaWYgKGV2ZW50ICYmIHNjb3BlLmlzRnVuY3Rpb24oZXZlbnQucHJldmVudERlZmF1bHQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRyYWdnaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzID0gdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyVGFyZ2V0cygpO1xuXG4gICAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRoaXMuc25hcFN0YXR1cy5sb2NrZWQgPSB0aGlzLmRyYWdnaW5nID0gdGhpcy5yZXNpemluZyA9IHRoaXMuZ2VzdHVyaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR4ID0gdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR5ID0gMDtcblxuICAgICAgICAvLyByZW1vdmUgcG9pbnRlcnMgaWYgdGhlaXIgSUQgaXNuJ3QgaW4gdGhpcy5wb2ludGVySWRzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wb2ludGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQodGhpcy5wb2ludGVyc1tpXSkpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoaXMgaW50ZXJhY3Rpb24gaWYgaXQncyBub3QgdGhlIG9ubHkgb25lIG9mIGl0J3MgdHlwZVxuICAgICAgICAgICAgaWYgKHNjb3BlLmludGVyYWN0aW9uc1tpXSAhPT0gdGhpcyAmJiBzY29wZS5pbnRlcmFjdGlvbnNbaV0ubW91c2UgPT09IHRoaXMubW91c2UpIHtcbiAgICAgICAgICAgICAgICBzY29wZS5pbnRlcmFjdGlvbnMuc3BsaWNlKHNjb3BlLmluZGV4T2Yoc2NvcGUuaW50ZXJhY3Rpb25zLCB0aGlzKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5lcnRpYUZyYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbmVydGlhU3RhdHVzID0gdGhpcy5pbmVydGlhU3RhdHVzLFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLFxuICAgICAgICAgICAgbGFtYmRhID0gb3B0aW9ucy5yZXNpc3RhbmNlLFxuICAgICAgICAgICAgdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCAtIGluZXJ0aWFTdGF0dXMudDA7XG5cbiAgICAgICAgaWYgKHQgPCBpbmVydGlhU3RhdHVzLnRlKSB7XG5cbiAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9ICAxIC0gKE1hdGguZXhwKC1sYW1iZGEgKiB0KSAtIGluZXJ0aWFTdGF0dXMubGFtYmRhX3YwKSAvIGluZXJ0aWFTdGF0dXMub25lX3ZlX3YwO1xuXG4gICAgICAgICAgICBpZiAoaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlID09PSBpbmVydGlhU3RhdHVzLnhlICYmIGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZSA9PT0gaW5lcnRpYVN0YXR1cy55ZSkge1xuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBpbmVydGlhU3RhdHVzLnhlICogcHJvZ3Jlc3M7XG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IGluZXJ0aWFTdGF0dXMueWUgKiBwcm9ncmVzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBxdWFkUG9pbnQgPSBzY29wZS5nZXRRdWFkcmF0aWNDdXJ2ZVBvaW50KFxuICAgICAgICAgICAgICAgICAgICAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnhlLCBpbmVydGlhU3RhdHVzLnllLFxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWGUsIGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MpO1xuXG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IHF1YWRQb2ludC54O1xuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBxdWFkUG9pbnQueTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuaSA9IGFuaW1hdGlvbkZyYW1lLnJlcXVlc3QodGhpcy5ib3VuZEluZXJ0aWFGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlO1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJFbmQoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNtb290aEVuZEZyYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbmVydGlhU3RhdHVzID0gdGhpcy5pbmVydGlhU3RhdHVzLFxuICAgICAgICAgICAgdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gaW5lcnRpYVN0YXR1cy50MCxcbiAgICAgICAgICAgIGR1cmF0aW9uID0gdGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEuc21vb3RoRW5kRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHQgPCBkdXJhdGlvbikge1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IHNjb3BlLmVhc2VPdXRRdWFkKHQsIDAsIGluZXJ0aWFTdGF0dXMueGUsIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBzY29wZS5lYXNlT3V0UXVhZCh0LCAwLCBpbmVydGlhU3RhdHVzLnllLCBkdXJhdGlvbik7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlck1vdmUoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLmkgPSBhbmltYXRpb25GcmFtZS5yZXF1ZXN0KHRoaXMuYm91bmRTbW9vdGhFbmRGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy54ZTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBpbmVydGlhU3RhdHVzLnllO1xuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcblxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc21vb3RoRW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlckVuZChpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkUG9pbnRlcjogZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICAgICAgdmFyIGlkID0gdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpLFxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIGlkKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBpbmRleCA9IHRoaXMucG9pbnRlcklkcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJJZHNbaW5kZXhdID0gaWQ7XG4gICAgICAgIHRoaXMucG9pbnRlcnNbaW5kZXhdID0gcG9pbnRlcjtcblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcblxuICAgIHJlbW92ZVBvaW50ZXI6IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgICAgIHZhciBpZCA9IHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSxcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCBpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkgeyByZXR1cm47IH1cblxuICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy5wb2ludGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wb2ludGVySWRzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmRvd25UYXJnZXRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMuZG93blRpbWVzICAuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdGhpcy5ob2xkVGltZXJzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH0sXG5cbiAgICByZWNvcmRQb2ludGVyOiBmdW5jdGlvbiAocG9pbnRlcikge1xuICAgICAgICAvLyBEbyBub3QgdXBkYXRlIHBvaW50ZXJzIHdoaWxlIGluZXJ0aWEgaXMgYWN0aXZlLlxuICAgICAgICAvLyBUaGUgaW5lcnRpYSBzdGFydCBldmVudCBzaG91bGQgYmUgdGhpcy5wb2ludGVyc1swXVxuICAgICAgICBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm1vdXNlPyAwOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcnNbaW5kZXhdID0gcG9pbnRlcjtcbiAgICB9LFxuXG4gICAgY29sbGVjdEV2ZW50VGFyZ2V0czogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZXZlbnRUeXBlKSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgLy8gZG8gbm90IGZpcmUgYSB0YXAgZXZlbnQgaWYgdGhlIHBvaW50ZXIgd2FzIG1vdmVkIGJlZm9yZSBiZWluZyBsaWZ0ZWRcbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ3RhcCcgJiYgKHRoaXMucG9pbnRlcldhc01vdmVkXG4gICAgICAgICAgICAgICAgLy8gb3IgaWYgdGhlIHBvaW50ZXJ1cCB0YXJnZXQgaXMgZGlmZmVyZW50IHRvIHRoZSBwb2ludGVyZG93biB0YXJnZXRcbiAgICAgICAgICAgIHx8ICEodGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdICYmIHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSA9PT0gZXZlbnRUYXJnZXQpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRhcmdldHMgPSBbXSxcbiAgICAgICAgICAgIGVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY29sbGVjdFNlbGVjdG9ycyAoaW50ZXJhY3RhYmxlLCBzZWxlY3RvciwgY29udGV4dCkge1xuICAgICAgICAgICAgdmFyIGVscyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgID8gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlLl9pRXZlbnRzW2V2ZW50VHlwZV1cbiAgICAgICAgICAgICAgICAmJiB1dGlscy5pc0VsZW1lbnQoZWxlbWVudClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuICAgICAgICAgICAgICAgICYmICFzY29wZS50ZXN0SWdub3JlKGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUudGVzdEFsbG93KGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yLCBlbHMpKSB7XG5cbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goaW50ZXJhY3RhYmxlKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgaW50ZXJhY3QgPSBzY29wZS5pbnRlcmFjdDtcblxuICAgICAgICB3aGlsZSAoZWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGludGVyYWN0LmlzU2V0KGVsZW1lbnQpICYmIGludGVyYWN0KGVsZW1lbnQpLl9pRXZlbnRzW2V2ZW50VHlwZV0pIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goaW50ZXJhY3QoZWxlbWVudCkpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKGNvbGxlY3RTZWxlY3RvcnMpO1xuXG4gICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgdGFwIGV2ZW50IGV2ZW4gaWYgdGhlcmUgYXJlIG5vIGxpc3RlbmVycyBzbyB0aGF0XG4gICAgICAgIC8vIGRvdWJsZXRhcCBjYW4gc3RpbGwgYmUgY3JlYXRlZCBhbmQgZmlyZWRcbiAgICAgICAgaWYgKHRhcmdldHMubGVuZ3RoIHx8IGV2ZW50VHlwZSA9PT0gJ3RhcCcpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZVBvaW50ZXJzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgdGFyZ2V0cywgZWxlbWVudHMsIGV2ZW50VHlwZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZmlyZVBvaW50ZXJzOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0YXJnZXRzLCBlbGVtZW50cywgZXZlbnRUeXBlKSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpLFxuICAgICAgICAgICAgcG9pbnRlckV2ZW50ID0ge30sXG4gICAgICAgICAgICBpLFxuICAgICAgICAvLyBmb3IgdGFwIGV2ZW50c1xuICAgICAgICAgICAgaW50ZXJ2YWwsIGNyZWF0ZU5ld0RvdWJsZVRhcDtcblxuICAgICAgICAvLyBpZiBpdCdzIGEgZG91YmxldGFwIHRoZW4gdGhlIGV2ZW50IHByb3BlcnRpZXMgd291bGQgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGNvcGllZCBmcm9tIHRoZSB0YXAgZXZlbnQgYW5kIHByb3ZpZGVkIGFzIHRoZSBwb2ludGVyIGFyZ3VtZW50XG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICdkb3VibGV0YXAnKSB7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQgPSBwb2ludGVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHBvaW50ZXJFdmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgaWYgKGV2ZW50ICE9PSBwb2ludGVyKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHBvaW50ZXJFdmVudCwgcG9pbnRlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5wcmV2ZW50RGVmYXVsdCAgICAgICAgICAgPSBwcmV2ZW50T3JpZ2luYWxEZWZhdWx0O1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnN0b3BQcm9wYWdhdGlvbiAgICAgICAgICA9IEludGVyYWN0RXZlbnQucHJvdG90eXBlLnN0b3BQcm9wYWdhdGlvbjtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gPSBJbnRlcmFjdEV2ZW50LnByb3RvdHlwZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb247XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuaW50ZXJhY3Rpb24gICAgICAgICAgICAgID0gdGhpcztcblxuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnRpbWVTdGFtcCAgICAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5vcmlnaW5hbEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQudHlwZSAgICAgICAgICA9IGV2ZW50VHlwZTtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5wb2ludGVySWQgICAgID0gdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnBvaW50ZXJUeXBlICAgPSB0aGlzLm1vdXNlPyAnbW91c2UnIDogIWJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQ/ICd0b3VjaCdcbiAgICAgICAgICAgICAgICA6IHNjb3BlLmlzU3RyaW5nKHBvaW50ZXIucG9pbnRlclR5cGUpXG4gICAgICAgICAgICAgICAgPyBwb2ludGVyLnBvaW50ZXJUeXBlXG4gICAgICAgICAgICAgICAgOiBbLCwndG91Y2gnLCAncGVuJywgJ21vdXNlJ11bcG9pbnRlci5wb2ludGVyVHlwZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAndGFwJykge1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmR0ID0gcG9pbnRlckV2ZW50LnRpbWVTdGFtcCAtIHRoaXMuZG93blRpbWVzW3BvaW50ZXJJbmRleF07XG5cbiAgICAgICAgICAgIGludGVydmFsID0gcG9pbnRlckV2ZW50LnRpbWVTdGFtcCAtIHRoaXMudGFwVGltZTtcbiAgICAgICAgICAgIGNyZWF0ZU5ld0RvdWJsZVRhcCA9ICEhKHRoaXMucHJldlRhcCAmJiB0aGlzLnByZXZUYXAudHlwZSAhPT0gJ2RvdWJsZXRhcCdcbiAgICAgICAgICAgICYmIHRoaXMucHJldlRhcC50YXJnZXQgPT09IHBvaW50ZXJFdmVudC50YXJnZXRcbiAgICAgICAgICAgICYmIGludGVydmFsIDwgNTAwKTtcblxuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmRvdWJsZSA9IGNyZWF0ZU5ld0RvdWJsZVRhcDtcblxuICAgICAgICAgICAgdGhpcy50YXBUaW1lID0gcG9pbnRlckV2ZW50LnRpbWVTdGFtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YXJnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuY3VycmVudFRhcmdldCA9IGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmludGVyYWN0YWJsZSA9IHRhcmdldHNbaV07XG4gICAgICAgICAgICB0YXJnZXRzW2ldLmZpcmUocG9pbnRlckV2ZW50KTtcblxuICAgICAgICAgICAgaWYgKHBvaW50ZXJFdmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWRcbiAgICAgICAgICAgICAgICB8fChwb2ludGVyRXZlbnQucHJvcGFnYXRpb25TdG9wcGVkICYmIGVsZW1lbnRzW2kgKyAxXSAhPT0gcG9pbnRlckV2ZW50LmN1cnJlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3JlYXRlTmV3RG91YmxlVGFwKSB7XG4gICAgICAgICAgICB2YXIgZG91YmxlVGFwID0ge307XG5cbiAgICAgICAgICAgIHV0aWxzLmV4dGVuZChkb3VibGVUYXAsIHBvaW50ZXJFdmVudCk7XG5cbiAgICAgICAgICAgIGRvdWJsZVRhcC5kdCAgID0gaW50ZXJ2YWw7XG4gICAgICAgICAgICBkb3VibGVUYXAudHlwZSA9ICdkb3VibGV0YXAnO1xuXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMoZG91YmxlVGFwLCBldmVudCwgZXZlbnRUYXJnZXQsICdkb3VibGV0YXAnKTtcblxuICAgICAgICAgICAgdGhpcy5wcmV2VGFwID0gZG91YmxlVGFwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ3RhcCcpIHtcbiAgICAgICAgICAgIHRoaXMucHJldlRhcCA9IHBvaW50ZXJFdmVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVNlbGVjdG9yOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIG1hdGNoZXMsIG1hdGNoRWxlbWVudHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG1hdGNoZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IG1hdGNoZXNbaV0sXG4gICAgICAgICAgICAgICAgbWF0Y2hFbGVtZW50ID0gbWF0Y2hFbGVtZW50c1tpXSxcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSB2YWxpZGF0ZUFjdGlvbihtYXRjaC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIG1hdGNoRWxlbWVudCksIG1hdGNoKTtcblxuICAgICAgICAgICAgaWYgKGFjdGlvbiAmJiBzY29wZS53aXRoaW5JbnRlcmFjdGlvbkxpbWl0KG1hdGNoLCBtYXRjaEVsZW1lbnQsIGFjdGlvbikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IG1hdGNoO1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG1hdGNoRWxlbWVudDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0U25hcHBpbmc6IGZ1bmN0aW9uIChwYWdlQ29vcmRzLCBzdGF0dXMpIHtcbiAgICAgICAgdmFyIHNuYXAgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcCxcbiAgICAgICAgICAgIHRhcmdldHMgPSBbXSxcbiAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIHN0YXR1cyA9IHN0YXR1cyB8fCB0aGlzLnNuYXBTdGF0dXM7XG5cbiAgICAgICAgaWYgKHN0YXR1cy51c2VTdGF0dXNYWSkge1xuICAgICAgICAgICAgcGFnZSA9IHsgeDogc3RhdHVzLngsIHk6IHN0YXR1cy55IH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgb3JpZ2luID0gc2NvcGUuZ2V0T3JpZ2luWFkodGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHBhZ2UgPSB1dGlscy5leHRlbmQoe30sIHBhZ2VDb29yZHMpO1xuXG4gICAgICAgICAgICBwYWdlLnggLT0gb3JpZ2luLng7XG4gICAgICAgICAgICBwYWdlLnkgLT0gb3JpZ2luLnk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMucmVhbFggPSBwYWdlLng7XG4gICAgICAgIHN0YXR1cy5yZWFsWSA9IHBhZ2UueTtcblxuICAgICAgICBwYWdlLnggPSBwYWdlLnggLSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHg7XG4gICAgICAgIHBhZ2UueSA9IHBhZ2UueSAtIHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeTtcblxuICAgICAgICB2YXIgbGVuID0gc25hcC50YXJnZXRzPyBzbmFwLnRhcmdldHMubGVuZ3RoIDogMDtcblxuICAgICAgICBmb3IgKHZhciByZWxJbmRleCA9IDA7IHJlbEluZGV4IDwgdGhpcy5zbmFwT2Zmc2V0cy5sZW5ndGg7IHJlbEluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciByZWxhdGl2ZSA9IHtcbiAgICAgICAgICAgICAgICB4OiBwYWdlLnggLSB0aGlzLnNuYXBPZmZzZXRzW3JlbEluZGV4XS54LFxuICAgICAgICAgICAgICAgIHk6IHBhZ2UueSAtIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLnlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHNuYXAudGFyZ2V0c1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gc25hcC50YXJnZXRzW2ldKHJlbGF0aXZlLngsIHJlbGF0aXZlLnksIHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gc25hcC50YXJnZXRzW2ldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiBzY29wZS5pc051bWJlcih0YXJnZXQueCkgPyAodGFyZ2V0LnggKyB0aGlzLnNuYXBPZmZzZXRzW3JlbEluZGV4XS54KSA6IHJlbGF0aXZlLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IHNjb3BlLmlzTnVtYmVyKHRhcmdldC55KSA/ICh0YXJnZXQueSArIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLnkpIDogcmVsYXRpdmUueSxcblxuICAgICAgICAgICAgICAgICAgICByYW5nZTogc2NvcGUuaXNOdW1iZXIodGFyZ2V0LnJhbmdlKT8gdGFyZ2V0LnJhbmdlOiBzbmFwLnJhbmdlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2xvc2VzdCA9IHtcbiAgICAgICAgICAgIHRhcmdldDogbnVsbCxcbiAgICAgICAgICAgIGluUmFuZ2U6IGZhbHNlLFxuICAgICAgICAgICAgZGlzdGFuY2U6IDAsXG4gICAgICAgICAgICByYW5nZTogMCxcbiAgICAgICAgICAgIGR4OiAwLFxuICAgICAgICAgICAgZHk6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSB0YXJnZXRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXRzW2ldO1xuXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSB0YXJnZXQucmFuZ2UsXG4gICAgICAgICAgICAgICAgZHggPSB0YXJnZXQueCAtIHBhZ2UueCxcbiAgICAgICAgICAgICAgICBkeSA9IHRhcmdldC55IC0gcGFnZS55LFxuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gdXRpbHMuaHlwb3QoZHgsIGR5KSxcbiAgICAgICAgICAgICAgICBpblJhbmdlID0gZGlzdGFuY2UgPD0gcmFuZ2U7XG5cbiAgICAgICAgICAgIC8vIEluZmluaXRlIHRhcmdldHMgY291bnQgYXMgYmVpbmcgb3V0IG9mIHJhbmdlXG4gICAgICAgICAgICAvLyBjb21wYXJlZCB0byBub24gaW5maW5pdGUgb25lcyB0aGF0IGFyZSBpbiByYW5nZVxuICAgICAgICAgICAgaWYgKHJhbmdlID09PSBJbmZpbml0eSAmJiBjbG9zZXN0LmluUmFuZ2UgJiYgY2xvc2VzdC5yYW5nZSAhPT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICBpblJhbmdlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY2xvc2VzdC50YXJnZXQgfHwgKGluUmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8gaXMgdGhlIGNsb3Nlc3QgdGFyZ2V0IGluIHJhbmdlP1xuICAgICAgICAgICAgICAgICAgICA/IChjbG9zZXN0LmluUmFuZ2UgJiYgcmFuZ2UgIT09IEluZmluaXR5XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBwb2ludGVyIGlzIHJlbGF0aXZlbHkgZGVlcGVyIGluIHRoaXMgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgID8gZGlzdGFuY2UgLyByYW5nZSA8IGNsb3Nlc3QuZGlzdGFuY2UgLyBjbG9zZXN0LnJhbmdlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgdGFyZ2V0IGhhcyBJbmZpbml0ZSByYW5nZSBhbmQgdGhlIGNsb3Nlc3QgZG9lc24ndFxuICAgICAgICAgICAgICAgICAgICA6IChyYW5nZSA9PT0gSW5maW5pdHkgJiYgY2xvc2VzdC5yYW5nZSAhPT0gSW5maW5pdHkpXG4gICAgICAgICAgICAgICAgICAgIC8vIE9SIHRoaXMgdGFyZ2V0IGlzIGNsb3NlciB0aGF0IHRoZSBwcmV2aW91cyBjbG9zZXN0XG4gICAgICAgICAgICAgICAgfHwgZGlzdGFuY2UgPCBjbG9zZXN0LmRpc3RhbmNlKVxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgb3RoZXIgaXMgbm90IGluIHJhbmdlIGFuZCB0aGUgcG9pbnRlciBpcyBjbG9zZXIgdG8gdGhpcyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgOiAoIWNsb3Nlc3QuaW5SYW5nZSAmJiBkaXN0YW5jZSA8IGNsb3Nlc3QuZGlzdGFuY2UpKSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKHJhbmdlID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgICAgICBpblJhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjbG9zZXN0LnRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5yYW5nZSA9IHJhbmdlO1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QuaW5SYW5nZSA9IGluUmFuZ2U7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5keCA9IGR4O1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QuZHkgPSBkeTtcblxuICAgICAgICAgICAgICAgIHN0YXR1cy5yYW5nZSA9IHJhbmdlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNuYXBDaGFuZ2VkO1xuXG4gICAgICAgIGlmIChjbG9zZXN0LnRhcmdldCkge1xuICAgICAgICAgICAgc25hcENoYW5nZWQgPSAoc3RhdHVzLnNuYXBwZWRYICE9PSBjbG9zZXN0LnRhcmdldC54IHx8IHN0YXR1cy5zbmFwcGVkWSAhPT0gY2xvc2VzdC50YXJnZXQueSk7XG5cbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWCA9IGNsb3Nlc3QudGFyZ2V0Lng7XG4gICAgICAgICAgICBzdGF0dXMuc25hcHBlZFkgPSBjbG9zZXN0LnRhcmdldC55O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc25hcENoYW5nZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBzdGF0dXMuc25hcHBlZFggPSBOYU47XG4gICAgICAgICAgICBzdGF0dXMuc25hcHBlZFkgPSBOYU47XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMuZHggPSBjbG9zZXN0LmR4O1xuICAgICAgICBzdGF0dXMuZHkgPSBjbG9zZXN0LmR5O1xuXG4gICAgICAgIHN0YXR1cy5jaGFuZ2VkID0gKHNuYXBDaGFuZ2VkIHx8IChjbG9zZXN0LmluUmFuZ2UgJiYgIXN0YXR1cy5sb2NrZWQpKTtcbiAgICAgICAgc3RhdHVzLmxvY2tlZCA9IGNsb3Nlc3QuaW5SYW5nZTtcblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBzZXRSZXN0cmljdGlvbjogZnVuY3Rpb24gKHBhZ2VDb29yZHMsIHN0YXR1cykge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQsXG4gICAgICAgICAgICByZXN0cmljdCA9IHRhcmdldCAmJiB0YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LFxuICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSByZXN0cmljdCAmJiByZXN0cmljdC5yZXN0cmljdGlvbixcbiAgICAgICAgICAgIHBhZ2U7XG5cbiAgICAgICAgaWYgKCFyZXN0cmljdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cyA9IHN0YXR1cyB8fCB0aGlzLnJlc3RyaWN0U3RhdHVzO1xuXG4gICAgICAgIHBhZ2UgPSBzdGF0dXMudXNlU3RhdHVzWFlcbiAgICAgICAgICAgID8gcGFnZSA9IHsgeDogc3RhdHVzLngsIHk6IHN0YXR1cy55IH1cbiAgICAgICAgICAgIDogcGFnZSA9IHV0aWxzLmV4dGVuZCh7fSwgcGFnZUNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKHN0YXR1cy5zbmFwICYmIHN0YXR1cy5zbmFwLmxvY2tlZCkge1xuICAgICAgICAgICAgcGFnZS54ICs9IHN0YXR1cy5zbmFwLmR4IHx8IDA7XG4gICAgICAgICAgICBwYWdlLnkgKz0gc3RhdHVzLnNuYXAuZHkgfHwgMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhZ2UueCAtPSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHg7XG4gICAgICAgIHBhZ2UueSAtPSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHk7XG5cbiAgICAgICAgc3RhdHVzLmR4ID0gMDtcbiAgICAgICAgc3RhdHVzLmR5ID0gMDtcbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgcmVjdCwgcmVzdHJpY3RlZFgsIHJlc3RyaWN0ZWRZO1xuXG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhyZXN0cmljdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChyZXN0cmljdGlvbiA9PT0gJ3BhcmVudCcpIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbiA9IHNjb3BlLnBhcmVudEVsZW1lbnQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHJlc3RyaWN0aW9uID09PSAnc2VsZicpIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbiA9IHRhcmdldC5nZXRSZWN0KHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbiA9IHNjb3BlLmNsb3Nlc3QodGhpcy5lbGVtZW50LCByZXN0cmljdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghcmVzdHJpY3Rpb24pIHsgcmV0dXJuIHN0YXR1czsgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocmVzdHJpY3Rpb24pKSB7XG4gICAgICAgICAgICByZXN0cmljdGlvbiA9IHJlc3RyaWN0aW9uKHBhZ2UueCwgcGFnZS55LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChyZXN0cmljdGlvbikpIHtcbiAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gc2NvcGUuZ2V0RWxlbWVudFJlY3QocmVzdHJpY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjdCA9IHJlc3RyaWN0aW9uO1xuXG4gICAgICAgIGlmICghcmVzdHJpY3Rpb24pIHtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRYID0gcGFnZS54O1xuICAgICAgICAgICAgcmVzdHJpY3RlZFkgPSBwYWdlLnk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0IGlzIGFzc3VtZWQgdG8gaGF2ZVxuICAgICAgICAvLyB4LCB5LCB3aWR0aCwgaGVpZ2h0IG9yXG4gICAgICAgIC8vIGxlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbVxuICAgICAgICBlbHNlIGlmICgneCcgaW4gcmVzdHJpY3Rpb24gJiYgJ3knIGluIHJlc3RyaWN0aW9uKSB7XG4gICAgICAgICAgICByZXN0cmljdGVkWCA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QueCArIHJlY3Qud2lkdGggIC0gdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAsIHBhZ2UueCksIHJlY3QueCArIHRoaXMucmVzdHJpY3RPZmZzZXQubGVmdCk7XG4gICAgICAgICAgICByZXN0cmljdGVkWSA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QueSArIHJlY3QuaGVpZ2h0IC0gdGhpcy5yZXN0cmljdE9mZnNldC5ib3R0b20sIHBhZ2UueSksIHJlY3QueSArIHRoaXMucmVzdHJpY3RPZmZzZXQudG9wICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXN0cmljdGVkWCA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QucmlnaHQgIC0gdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAsIHBhZ2UueCksIHJlY3QubGVmdCArIHRoaXMucmVzdHJpY3RPZmZzZXQubGVmdCk7XG4gICAgICAgICAgICByZXN0cmljdGVkWSA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QuYm90dG9tIC0gdGhpcy5yZXN0cmljdE9mZnNldC5ib3R0b20sIHBhZ2UueSksIHJlY3QudG9wICArIHRoaXMucmVzdHJpY3RPZmZzZXQudG9wICk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMuZHggPSByZXN0cmljdGVkWCAtIHBhZ2UueDtcbiAgICAgICAgc3RhdHVzLmR5ID0gcmVzdHJpY3RlZFkgLSBwYWdlLnk7XG5cbiAgICAgICAgc3RhdHVzLmNoYW5nZWQgPSBzdGF0dXMucmVzdHJpY3RlZFggIT09IHJlc3RyaWN0ZWRYIHx8IHN0YXR1cy5yZXN0cmljdGVkWSAhPT0gcmVzdHJpY3RlZFk7XG4gICAgICAgIHN0YXR1cy5yZXN0cmljdGVkID0gISEoc3RhdHVzLmR4IHx8IHN0YXR1cy5keSk7XG5cbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWRYID0gcmVzdHJpY3RlZFg7XG4gICAgICAgIHN0YXR1cy5yZXN0cmljdGVkWSA9IHJlc3RyaWN0ZWRZO1xuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIGNoZWNrQW5kUHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uIChldmVudCwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgICAgIGlmICghKGludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZSB8fCB0aGlzLnRhcmdldCkpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucyxcbiAgICAgICAgICAgIHByZXZlbnQgPSBvcHRpb25zLnByZXZlbnREZWZhdWx0O1xuXG4gICAgICAgIGlmIChwcmV2ZW50ID09PSAnYXV0bycgJiYgZWxlbWVudCAmJiAhL14oaW5wdXR8c2VsZWN0fHRleHRhcmVhKSQvaS50ZXN0KGV2ZW50LnRhcmdldC5ub2RlTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdCBwcmV2ZW50RGVmYXVsdCBvbiBwb2ludGVyZG93biBpZiB0aGUgcHJlcGFyZWQgYWN0aW9uIGlzIGEgZHJhZ1xuICAgICAgICAgICAgLy8gYW5kIGRyYWdnaW5nIGNhbiBvbmx5IHN0YXJ0IGZyb20gYSBjZXJ0YWluIGRpcmVjdGlvbiAtIHRoaXMgYWxsb3dzXG4gICAgICAgICAgICAvLyBhIHRvdWNoIHRvIHBhbiB0aGUgdmlld3BvcnQgaWYgYSBkcmFnIGlzbid0IGluIHRoZSByaWdodCBkaXJlY3Rpb25cbiAgICAgICAgICAgIGlmICgvZG93bnxzdGFydC9pLnRlc3QoZXZlbnQudHlwZSlcbiAgICAgICAgICAgICAgICAmJiB0aGlzLnByZXBhcmVkLm5hbWUgPT09ICdkcmFnJyAmJiBvcHRpb25zLmRyYWcuYXhpcyAhPT0gJ3h5Jykge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3aXRoIG1hbnVhbFN0YXJ0LCBvbmx5IHByZXZlbnREZWZhdWx0IHdoaWxlIGludGVyYWN0aW5nXG4gICAgICAgICAgICBpZiAob3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5tYW51YWxTdGFydFxuICAgICAgICAgICAgICAgICYmICF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJldmVudCA9PT0gJ2Fsd2F5cycpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2FsY0luZXJ0aWE6IGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgdmFyIGluZXJ0aWFPcHRpb25zID0gdGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEsXG4gICAgICAgICAgICBsYW1iZGEgPSBpbmVydGlhT3B0aW9ucy5yZXNpc3RhbmNlLFxuICAgICAgICAgICAgaW5lcnRpYUR1ciA9IC1NYXRoLmxvZyhpbmVydGlhT3B0aW9ucy5lbmRTcGVlZCAvIHN0YXR1cy52MCkgLyBsYW1iZGE7XG5cbiAgICAgICAgc3RhdHVzLngwID0gdGhpcy5wcmV2RXZlbnQucGFnZVg7XG4gICAgICAgIHN0YXR1cy55MCA9IHRoaXMucHJldkV2ZW50LnBhZ2VZO1xuICAgICAgICBzdGF0dXMudDAgPSBzdGF0dXMuc3RhcnRFdmVudC50aW1lU3RhbXAgLyAxMDAwO1xuICAgICAgICBzdGF0dXMuc3ggPSBzdGF0dXMuc3kgPSAwO1xuXG4gICAgICAgIHN0YXR1cy5tb2RpZmllZFhlID0gc3RhdHVzLnhlID0gKHN0YXR1cy52eDAgLSBpbmVydGlhRHVyKSAvIGxhbWJkYTtcbiAgICAgICAgc3RhdHVzLm1vZGlmaWVkWWUgPSBzdGF0dXMueWUgPSAoc3RhdHVzLnZ5MCAtIGluZXJ0aWFEdXIpIC8gbGFtYmRhO1xuICAgICAgICBzdGF0dXMudGUgPSBpbmVydGlhRHVyO1xuXG4gICAgICAgIHN0YXR1cy5sYW1iZGFfdjAgPSBsYW1iZGEgLyBzdGF0dXMudjA7XG4gICAgICAgIHN0YXR1cy5vbmVfdmVfdjAgPSAxIC0gaW5lcnRpYU9wdGlvbnMuZW5kU3BlZWQgLyBzdGF0dXMudjA7XG4gICAgfSxcblxuICAgIGF1dG9TY3JvbGxNb3ZlOiBmdW5jdGlvbiAocG9pbnRlcikge1xuICAgICAgICBpZiAoISh0aGlzLmludGVyYWN0aW5nKClcbiAgICAgICAgICAgICYmIHNjb3BlLmNoZWNrQXV0b1Njcm9sbCh0aGlzLnRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnggPSBzY29wZS5hdXRvU2Nyb2xsLnkgPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRvcCxcbiAgICAgICAgICAgIHJpZ2h0LFxuICAgICAgICAgICAgYm90dG9tLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uYXV0b1Njcm9sbCxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG9wdGlvbnMuY29udGFpbmVyIHx8IHNjb3BlLmdldFdpbmRvdyh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGlmIChzY29wZS5pc1dpbmRvdyhjb250YWluZXIpKSB7XG4gICAgICAgICAgICBsZWZ0ICAgPSBwb2ludGVyLmNsaWVudFggPCBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIHRvcCAgICA9IHBvaW50ZXIuY2xpZW50WSA8IHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgcmlnaHQgID0gcG9pbnRlci5jbGllbnRYID4gY29udGFpbmVyLmlubmVyV2lkdGggIC0gc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICBib3R0b20gPSBwb2ludGVyLmNsaWVudFkgPiBjb250YWluZXIuaW5uZXJIZWlnaHQgLSBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gc2NvcGUuZ2V0RWxlbWVudFJlY3QoY29udGFpbmVyKTtcblxuICAgICAgICAgICAgbGVmdCAgID0gcG9pbnRlci5jbGllbnRYIDwgcmVjdC5sZWZ0ICAgKyBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIHRvcCAgICA9IHBvaW50ZXIuY2xpZW50WSA8IHJlY3QudG9wICAgICsgc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICByaWdodCAgPSBwb2ludGVyLmNsaWVudFggPiByZWN0LnJpZ2h0ICAtIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgYm90dG9tID0gcG9pbnRlci5jbGllbnRZID4gcmVjdC5ib3R0b20gLSBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmF1dG9TY3JvbGwueCA9IChyaWdodCA/IDE6IGxlZnQ/IC0xOiAwKTtcbiAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC55ID0gKGJvdHRvbT8gMTogIHRvcD8gLTE6IDApO1xuXG4gICAgICAgIGlmICghc2NvcGUuYXV0b1Njcm9sbC5pc1Njcm9sbGluZykge1xuICAgICAgICAgICAgLy8gc2V0IHRoZSBhdXRvU2Nyb2xsIHByb3BlcnRpZXMgdG8gdGhvc2Ugb2YgdGhlIHRhcmdldFxuICAgICAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW4gPSBvcHRpb25zLm1hcmdpbjtcbiAgICAgICAgICAgIHNjb3BlLmF1dG9TY3JvbGwuc3BlZWQgID0gb3B0aW9ucy5zcGVlZDtcblxuICAgICAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC5zdGFydCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlRXZlbnRUYXJnZXRzOiBmdW5jdGlvbiAodGFyZ2V0LCBjdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50VGFyZ2V0ICAgID0gdGFyZ2V0O1xuICAgICAgICB0aGlzLl9jdXJFdmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQ7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFmICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9yYWYnKSxcbiAgICBnZXRXaW5kb3cgPSByZXF1aXJlKCcuL3V0aWxzL3dpbmRvdycpLmdldFdpbmRvdyxcbiAgICBpc1dpbmRvdyAgPSByZXF1aXJlKCcuL3V0aWxzL2lzVHlwZScpLmlzV2luZG93O1xuXG52YXIgYXV0b1Njcm9sbCA9IHtcblxuICAgIGludGVyYWN0aW9uOiBudWxsLFxuICAgIGk6IG51bGwsICAgIC8vIHRoZSBoYW5kbGUgcmV0dXJuZWQgYnkgd2luZG93LnNldEludGVydmFsXG4gICAgeDogMCwgeTogMCwgLy8gRGlyZWN0aW9uIGVhY2ggcHVsc2UgaXMgdG8gc2Nyb2xsIGluXG5cbiAgICBpc1Njcm9sbGluZzogZmFsc2UsXG4gICAgcHJldlRpbWU6IDAsXG5cbiAgICBzdGFydDogZnVuY3Rpb24gKGludGVyYWN0aW9uKSB7XG4gICAgICAgIGF1dG9TY3JvbGwuaXNTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICByYWYuY2FuY2VsKGF1dG9TY3JvbGwuaSk7XG5cbiAgICAgICAgYXV0b1Njcm9sbC5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGF1dG9TY3JvbGwuaSA9IHJhZi5yZXF1ZXN0KGF1dG9TY3JvbGwuc2Nyb2xsKTtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBhdXRvU2Nyb2xsLmlzU2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIHJhZi5jYW5jZWwoYXV0b1Njcm9sbC5pKTtcbiAgICB9LFxuXG4gICAgLy8gc2Nyb2xsIHRoZSB3aW5kb3cgYnkgdGhlIHZhbHVlcyBpbiBzY3JvbGwueC95XG4gICAgc2Nyb2xsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi50YXJnZXQub3B0aW9uc1thdXRvU2Nyb2xsLmludGVyYWN0aW9uLnByZXBhcmVkLm5hbWVdLmF1dG9TY3JvbGwsXG4gICAgICAgICAgICBjb250YWluZXIgPSBvcHRpb25zLmNvbnRhaW5lciB8fCBnZXRXaW5kb3coYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi5lbGVtZW50KSxcbiAgICAgICAgICAgIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgLy8gY2hhbmdlIGluIHRpbWUgaW4gc2Vjb25kc1xuICAgICAgICAgICAgZHQgPSAobm93IC0gYXV0b1Njcm9sbC5wcmV2VGltZSkgLyAxMDAwLFxuICAgICAgICAgICAgLy8gZGlzcGxhY2VtZW50XG4gICAgICAgICAgICBzID0gb3B0aW9ucy5zcGVlZCAqIGR0O1xuXG4gICAgICAgIGlmIChzID49IDEpIHtcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhjb250YWluZXIpKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbEJ5KGF1dG9TY3JvbGwueCAqIHMsIGF1dG9TY3JvbGwueSAqIHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbExlZnQgKz0gYXV0b1Njcm9sbC54ICogcztcbiAgICAgICAgICAgICAgICBjb250YWluZXIuc2Nyb2xsVG9wICArPSBhdXRvU2Nyb2xsLnkgKiBzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbm93O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGF1dG9TY3JvbGwuaXNTY3JvbGxpbmcpIHtcbiAgICAgICAgICAgIHJhZi5jYW5jZWwoYXV0b1Njcm9sbC5pKTtcbiAgICAgICAgICAgIGF1dG9TY3JvbGwuaSA9IHJhZi5yZXF1ZXN0KGF1dG9TY3JvbGwuc2Nyb2xsKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXV0b1Njcm9sbDtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcblxuZnVuY3Rpb24gZGVmYXVsdEFjdGlvbkNoZWNrZXIgKHBvaW50ZXIsIGludGVyYWN0aW9uLCBlbGVtZW50KSB7XG4gICAgdmFyIHJlY3QgPSB0aGlzLmdldFJlY3QoZWxlbWVudCksXG4gICAgICAgIHNob3VsZFJlc2l6ZSA9IGZhbHNlLFxuICAgICAgICBhY3Rpb24sXG4gICAgICAgIHJlc2l6ZUF4ZXMgPSBudWxsLFxuICAgICAgICByZXNpemVFZGdlcyxcbiAgICAgICAgcGFnZSA9IHV0aWxzLmV4dGVuZCh7fSwgaW50ZXJhY3Rpb24uY3VyQ29vcmRzLnBhZ2UpLFxuICAgICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgaWYgKCFyZWN0KSB7IHJldHVybiBudWxsOyB9XG5cbiAgICBpZiAoc2NvcGUuYWN0aW9uSXNFbmFibGVkLnJlc2l6ZSAmJiBvcHRpb25zLnJlc2l6ZS5lbmFibGVkKSB7XG4gICAgICAgIHZhciByZXNpemVPcHRpb25zID0gb3B0aW9ucy5yZXNpemU7XG5cbiAgICAgICAgcmVzaXplRWRnZXMgPSB7XG4gICAgICAgICAgICBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChyZXNpemVPcHRpb25zLmVkZ2VzKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMuZWRnZXNbZWRnZV0sXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLl9ldmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgcmVjdCxcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplT3B0aW9ucy5tYXJnaW4gfHwgc2NvcGUubWFyZ2luKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzaXplRWRnZXMubGVmdCA9IHJlc2l6ZUVkZ2VzLmxlZnQgJiYgIXJlc2l6ZUVkZ2VzLnJpZ2h0O1xuICAgICAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbTtcblxuICAgICAgICAgICAgc2hvdWxkUmVzaXplID0gcmVzaXplRWRnZXMubGVmdCB8fCByZXNpemVFZGdlcy5yaWdodCB8fCByZXNpemVFZGdlcy50b3AgfHwgcmVzaXplRWRnZXMuYm90dG9tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd5JyAmJiBwYWdlLnggPiAocmVjdC5yaWdodCAgLSBzY29wZS5tYXJnaW4pLFxuICAgICAgICAgICAgICAgIGJvdHRvbSA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd4JyAmJiBwYWdlLnkgPiAocmVjdC5ib3R0b20gLSBzY29wZS5tYXJnaW4pO1xuXG4gICAgICAgICAgICBzaG91bGRSZXNpemUgPSByaWdodCB8fCBib3R0b207XG4gICAgICAgICAgICByZXNpemVBeGVzID0gKHJpZ2h0PyAneCcgOiAnJykgKyAoYm90dG9tPyAneScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhY3Rpb24gPSBzaG91bGRSZXNpemVcbiAgICAgICAgPyAncmVzaXplJ1xuICAgICAgICA6IHNjb3BlLmFjdGlvbklzRW5hYmxlZC5kcmFnICYmIG9wdGlvbnMuZHJhZy5lbmFibGVkXG4gICAgICAgID8gJ2RyYWcnXG4gICAgICAgIDogbnVsbDtcblxuICAgIGlmIChzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZ2VzdHVyZVxuICAgICAgICAmJiBpbnRlcmFjdGlvbi5wb2ludGVySWRzLmxlbmd0aCA+PTJcbiAgICAgICAgJiYgIShpbnRlcmFjdGlvbi5kcmFnZ2luZyB8fCBpbnRlcmFjdGlvbi5yZXNpemluZykpIHtcbiAgICAgICAgYWN0aW9uID0gJ2dlc3R1cmUnO1xuICAgIH1cblxuICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IGFjdGlvbixcbiAgICAgICAgICAgIGF4aXM6IHJlc2l6ZUF4ZXMsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0QWN0aW9uQ2hlY2tlcjsiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJhc2U6IHtcbiAgICAgICAgYWNjZXB0ICAgICAgICA6IG51bGwsXG4gICAgICAgIGFjdGlvbkNoZWNrZXIgOiBudWxsLFxuICAgICAgICBzdHlsZUN1cnNvciAgIDogdHJ1ZSxcbiAgICAgICAgcHJldmVudERlZmF1bHQ6ICdhdXRvJyxcbiAgICAgICAgb3JpZ2luICAgICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBkZWx0YVNvdXJjZSAgIDogJ3BhZ2UnLFxuICAgICAgICBhbGxvd0Zyb20gICAgIDogbnVsbCxcbiAgICAgICAgaWdub3JlRnJvbSAgICA6IG51bGwsXG4gICAgICAgIF9jb250ZXh0ICAgICAgOiByZXF1aXJlKCcuL3V0aWxzL2RvbU9iamVjdHMnKS5kb2N1bWVudCxcbiAgICAgICAgZHJvcENoZWNrZXIgICA6IG51bGxcbiAgICB9LFxuXG4gICAgZHJhZzoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgbWFudWFsU3RhcnQ6IHRydWUsXG4gICAgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgIG1heFBlckVsZW1lbnQ6IDEsXG5cbiAgICAgICAgc25hcDogbnVsbCxcbiAgICAgICAgcmVzdHJpY3Q6IG51bGwsXG4gICAgICAgIGluZXJ0aWE6IG51bGwsXG4gICAgICAgIGF1dG9TY3JvbGw6IG51bGwsXG5cbiAgICAgICAgYXhpczogJ3h5J1xuICAgIH0sXG5cbiAgICBkcm9wOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBhY2NlcHQ6IG51bGwsXG4gICAgICAgIG92ZXJsYXA6ICdwb2ludGVyJ1xuICAgIH0sXG5cbiAgICByZXNpemU6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiBudWxsLFxuICAgICAgICByZXN0cmljdDogbnVsbCxcbiAgICAgICAgaW5lcnRpYTogbnVsbCxcbiAgICAgICAgYXV0b1Njcm9sbDogbnVsbCxcblxuICAgICAgICBzcXVhcmU6IGZhbHNlLFxuICAgICAgICBheGlzOiAneHknLFxuXG4gICAgICAgIC8vIHVzZSBkZWZhdWx0IG1hcmdpblxuICAgICAgICBtYXJnaW46IE5hTixcblxuICAgICAgICAvLyBvYmplY3Qgd2l0aCBwcm9wcyBsZWZ0LCByaWdodCwgdG9wLCBib3R0b20gd2hpY2ggYXJlXG4gICAgICAgIC8vIHRydWUvZmFsc2UgdmFsdWVzIHRvIHJlc2l6ZSB3aGVuIHRoZSBwb2ludGVyIGlzIG92ZXIgdGhhdCBlZGdlLFxuICAgICAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgICAgICAvLyBvciB0aGUgRWxlbWVudHMgZm9yIGVhY2ggaGFuZGxlXG4gICAgICAgIGVkZ2VzOiBudWxsLFxuXG4gICAgICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAgICAgLy8gJ25lZ2F0ZScgd2lsbCBhbG93IHRoZSByZWN0IHRvIGhhdmUgbmVnYXRpdmUgd2lkdGgvaGVpZ2h0XG4gICAgICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgICAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgICAgICBpbnZlcnQ6ICdub25lJ1xuICAgIH0sXG5cbiAgICBnZXN0dXJlOiB7XG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgIG1heFBlckVsZW1lbnQ6IDEsXG5cbiAgICAgICAgcmVzdHJpY3Q6IG51bGxcbiAgICB9LFxuXG4gICAgcGVyQWN0aW9uOiB7XG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgZW5kT25seSAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIHJhbmdlICAgICAgIDogSW5maW5pdHksXG4gICAgICAgICAgICB0YXJnZXRzICAgICA6IG51bGwsXG4gICAgICAgICAgICBvZmZzZXRzICAgICA6IG51bGwsXG5cbiAgICAgICAgICAgIHJlbGF0aXZlUG9pbnRzOiBudWxsXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzdHJpY3Q6IHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgZW5kT25seTogZmFsc2VcbiAgICAgICAgfSxcblxuICAgICAgICBhdXRvU2Nyb2xsOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgY29udGFpbmVyICAgOiBudWxsLCAgICAgLy8gdGhlIGl0ZW0gdGhhdCBpcyBzY3JvbGxlZCAoV2luZG93IG9yIEhUTUxFbGVtZW50KVxuICAgICAgICAgICAgbWFyZ2luICAgICAgOiA2MCxcbiAgICAgICAgICAgIHNwZWVkICAgICAgIDogMzAwICAgICAgIC8vIHRoZSBzY3JvbGwgc3BlZWQgaW4gcGl4ZWxzIHBlciBzZWNvbmRcbiAgICAgICAgfSxcblxuICAgICAgICBpbmVydGlhOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICByZXNpc3RhbmNlICAgICAgIDogMTAsICAgIC8vIHRoZSBsYW1iZGEgaW4gZXhwb25lbnRpYWwgZGVjYXlcbiAgICAgICAgICAgIG1pblNwZWVkICAgICAgICAgOiAxMDAsICAgLy8gdGFyZ2V0IHNwZWVkIG11c3QgYmUgYWJvdmUgdGhpcyBmb3IgaW5lcnRpYSB0byBzdGFydFxuICAgICAgICAgICAgZW5kU3BlZWQgICAgICAgICA6IDEwLCAgICAvLyB0aGUgc3BlZWQgYXQgd2hpY2ggaW5lcnRpYSBpcyBzbG93IGVub3VnaCB0byBzdG9wXG4gICAgICAgICAgICBhbGxvd1Jlc3VtZSAgICAgIDogdHJ1ZSwgIC8vIGFsbG93IHJlc3VtaW5nIGFuIGFjdGlvbiBpbiBpbmVydGlhIHBoYXNlXG4gICAgICAgICAgICB6ZXJvUmVzdW1lRGVsdGEgIDogdHJ1ZSwgIC8vIGlmIGFuIGFjdGlvbiBpcyByZXN1bWVkIGFmdGVyIGxhdW5jaCwgc2V0IGR4L2R5IHRvIDBcbiAgICAgICAgICAgIHNtb290aEVuZER1cmF0aW9uOiAzMDAgICAgLy8gYW5pbWF0ZSB0byBzbmFwL3Jlc3RyaWN0IGVuZE9ubHkgaWYgdGhlcmUncyBubyBpbmVydGlhXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2hvbGREdXJhdGlvbjogNjAwXG59O1xuIiwiLyoqXG4gKiBpbnRlcmFjdC5qcyB2MS4yLjRcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTItMjAxNSBUYXllIEFkZXllbWkgPGRldkB0YXllLm1lPlxuICogT3BlbiBzb3VyY2UgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuICogaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL21hc3Rlci9MSUNFTlNFXG4gKi9cblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIHJldHVybiBlYXJseSBpZiB0aGVyZSdzIG5vIHdpbmRvdyB0byB3b3JrIHdpdGggKGVnLiBOb2RlLmpzKVxuICAgIGlmICghcmVxdWlyZSgnLi91dGlscy93aW5kb3cnKS53aW5kb3cpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgc2NvcGUgPSByZXF1aXJlKCcuL3Njb3BlJyksXG4gICAgICAgIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxuICAgICAgICBicm93c2VyID0gdXRpbHMuYnJvd3NlcjtcblxuICAgIHNjb3BlLnBFdmVudFR5cGVzID0gbnVsbDtcblxuICAgIHNjb3BlLmRvY3VtZW50cyAgICAgICA9IFtdOyAgIC8vIGFsbCBkb2N1bWVudHMgYmVpbmcgbGlzdGVuZWQgdG9cblxuICAgIHNjb3BlLmludGVyYWN0YWJsZXMgICA9IFtdOyAgIC8vIGFsbCBzZXQgaW50ZXJhY3RhYmxlc1xuICAgIHNjb3BlLmludGVyYWN0aW9ucyAgICA9IFtdOyAgIC8vIGFsbCBpbnRlcmFjdGlvbnNcblxuICAgIHNjb3BlLmR5bmFtaWNEcm9wICAgICA9IGZhbHNlO1xuXG4gICAgc2NvcGUuZGVmYXVsdE9wdGlvbnMgPSByZXF1aXJlKCcuL2RlZmF1bHRPcHRpb25zJyk7XG5cbiAgICAvLyBUaGluZ3MgcmVsYXRlZCB0byBhdXRvU2Nyb2xsXG4gICAgc2NvcGUuYXV0b1Njcm9sbCA9IHJlcXVpcmUoJy4vYXV0b1Njcm9sbCcpO1xuXG4gICAgLy8gTGVzcyBQcmVjaXNpb24gd2l0aCB0b3VjaCBpbnB1dFxuICAgIHNjb3BlLm1hcmdpbiA9IGJyb3dzZXIuc3VwcG9ydHNUb3VjaCB8fCBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50PyAyMDogMTA7XG5cbiAgICBzY29wZS5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IDE7XG5cbiAgICAvLyBmb3IgaWdub3JpbmcgYnJvd3NlcidzIHNpbXVsYXRlZCBtb3VzZSBldmVudHNcbiAgICBzY29wZS5wcmV2VG91Y2hUaW1lID0gMDtcblxuICAgIC8vIEFsbG93IHRoaXMgbWFueSBpbnRlcmFjdGlvbnMgdG8gaGFwcGVuIHNpbXVsdGFuZW91c2x5XG4gICAgc2NvcGUubWF4SW50ZXJhY3Rpb25zID0gSW5maW5pdHk7XG5cbiAgICBzY29wZS5hY3Rpb25DdXJzb3JzID0gYnJvd3Nlci5pc0llOU9yT2xkZXIgPyB7XG4gICAgICAgIGRyYWcgICAgOiAnbW92ZScsXG4gICAgICAgIHJlc2l6ZXggOiAnZS1yZXNpemUnLFxuICAgICAgICByZXNpemV5IDogJ3MtcmVzaXplJyxcbiAgICAgICAgcmVzaXpleHk6ICdzZS1yZXNpemUnLFxuXG4gICAgICAgIHJlc2l6ZXRvcCAgICAgICAgOiAnbi1yZXNpemUnLFxuICAgICAgICByZXNpemVsZWZ0ICAgICAgIDogJ3ctcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tICAgICA6ICdzLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXJpZ2h0ICAgICAgOiAnZS1yZXNpemUnLFxuICAgICAgICByZXNpemV0b3BsZWZ0ICAgIDogJ3NlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbXJpZ2h0OiAnc2UtcmVzaXplJyxcbiAgICAgICAgcmVzaXpldG9wcmlnaHQgICA6ICduZS1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b21sZWZ0IDogJ25lLXJlc2l6ZScsXG5cbiAgICAgICAgZ2VzdHVyZSA6ICcnXG4gICAgfSA6IHtcbiAgICAgICAgZHJhZyAgICA6ICdtb3ZlJyxcbiAgICAgICAgcmVzaXpleCA6ICdldy1yZXNpemUnLFxuICAgICAgICByZXNpemV5IDogJ25zLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXh5OiAnbndzZS1yZXNpemUnLFxuXG4gICAgICAgIHJlc2l6ZXRvcCAgICAgICAgOiAnbnMtcmVzaXplJyxcbiAgICAgICAgcmVzaXplbGVmdCAgICAgICA6ICdldy1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b20gICAgIDogJ25zLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXJpZ2h0ICAgICAgOiAnZXctcmVzaXplJyxcbiAgICAgICAgcmVzaXpldG9wbGVmdCAgICA6ICdud3NlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbXJpZ2h0OiAnbndzZS1yZXNpemUnLFxuICAgICAgICByZXNpemV0b3ByaWdodCAgIDogJ25lc3ctcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tbGVmdCA6ICduZXN3LXJlc2l6ZScsXG5cbiAgICAgICAgZ2VzdHVyZSA6ICcnXG4gICAgfTtcblxuICAgIHNjb3BlLmFjdGlvbklzRW5hYmxlZCA9IHtcbiAgICAgICAgZHJhZyAgIDogdHJ1ZSxcbiAgICAgICAgcmVzaXplIDogdHJ1ZSxcbiAgICAgICAgZ2VzdHVyZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBiZWNhdXNlIFdlYmtpdCBhbmQgT3BlcmEgc3RpbGwgdXNlICdtb3VzZXdoZWVsJyBldmVudCB0eXBlXG4gICAgc2NvcGUud2hlZWxFdmVudCA9ICdvbm1vdXNld2hlZWwnIGluIHNjb3BlLmRvY3VtZW50PyAnbW91c2V3aGVlbCc6ICd3aGVlbCc7XG5cbiAgICBzY29wZS5ldmVudFR5cGVzID0gW1xuICAgICAgICAnZHJhZ3N0YXJ0JyxcbiAgICAgICAgJ2RyYWdtb3ZlJyxcbiAgICAgICAgJ2RyYWdpbmVydGlhc3RhcnQnLFxuICAgICAgICAnZHJhZ2VuZCcsXG4gICAgICAgICdkcmFnZW50ZXInLFxuICAgICAgICAnZHJhZ2xlYXZlJyxcbiAgICAgICAgJ2Ryb3BhY3RpdmF0ZScsXG4gICAgICAgICdkcm9wZGVhY3RpdmF0ZScsXG4gICAgICAgICdkcm9wbW92ZScsXG4gICAgICAgICdkcm9wJyxcbiAgICAgICAgJ3Jlc2l6ZXN0YXJ0JyxcbiAgICAgICAgJ3Jlc2l6ZW1vdmUnLFxuICAgICAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAgICAgJ3Jlc2l6ZWVuZCcsXG4gICAgICAgICdnZXN0dXJlc3RhcnQnLFxuICAgICAgICAnZ2VzdHVyZW1vdmUnLFxuICAgICAgICAnZ2VzdHVyZWluZXJ0aWFzdGFydCcsXG4gICAgICAgICdnZXN0dXJlZW5kJyxcblxuICAgICAgICAnZG93bicsXG4gICAgICAgICdtb3ZlJyxcbiAgICAgICAgJ3VwJyxcbiAgICAgICAgJ2NhbmNlbCcsXG4gICAgICAgICd0YXAnLFxuICAgICAgICAnZG91YmxldGFwJyxcbiAgICAgICAgJ2hvbGQnXG4gICAgXTtcblxuICAgIHNjb3BlLmdsb2JhbEV2ZW50cyA9IHt9O1xuXG4gICAgLy8gcHJlZml4IG1hdGNoZXNTZWxlY3RvclxuICAgIGJyb3dzZXIucHJlZml4ZWRNYXRjaGVzU2VsZWN0b3IgPSAnbWF0Y2hlcycgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAnbWF0Y2hlcyc6ICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlP1xuICAgICAgICAgICAgICAgICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InOiAnbW96TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAgICAgJ21vek1hdGNoZXNTZWxlY3Rvcic6ICdvTWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAgICAgICAgICdvTWF0Y2hlc1NlbGVjdG9yJzogJ21zTWF0Y2hlc1NlbGVjdG9yJztcblxuICAgIC8vIHdpbGwgYmUgcG9seWZpbGwgZnVuY3Rpb24gaWYgYnJvd3NlciBpcyBJRThcbiAgICBzY29wZS5pZThNYXRjaGVzU2VsZWN0b3IgPSBudWxsO1xuXG4gICAgLy8gRXZlbnRzIHdyYXBwZXJcbiAgICB2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcblxuICAgIHNjb3BlLnRyeVNlbGVjdG9yID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICghc2NvcGUuaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgIC8vIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHJhaXNlZCBpZiBpdCBpcyBpbnZhbGlkXG4gICAgICAgIHNjb3BlLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodmFsdWUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgc2NvcGUuZ2V0U2Nyb2xsWFkgPSBmdW5jdGlvbiAod2luKSB7XG4gICAgICAgIHdpbiA9IHdpbiB8fCBzY29wZS53aW5kb3c7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB3aW4uc2Nyb2xsWCB8fCB3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQsXG4gICAgICAgICAgICB5OiB3aW4uc2Nyb2xsWSB8fCB3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBzY29wZS5nZXRBY3R1YWxFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50IGluc3RhbmNlb2Ygc2NvcGUuU1ZHRWxlbWVudEluc3RhbmNlXG4gICAgICAgICAgICA/IGVsZW1lbnQuY29ycmVzcG9uZGluZ1VzZUVsZW1lbnRcbiAgICAgICAgICAgIDogZWxlbWVudCk7XG4gICAgfTtcblxuICAgIHNjb3BlLmdldEVsZW1lbnRSZWN0ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHNjcm9sbCA9IGJyb3dzZXIuaXNJT1M3b3JMb3dlclxuICAgICAgICAgICAgICAgID8geyB4OiAwLCB5OiAwIH1cbiAgICAgICAgICAgICAgICA6IHNjb3BlLmdldFNjcm9sbFhZKHNjb3BlLmdldFdpbmRvdyhlbGVtZW50KSksXG4gICAgICAgICAgICBjbGllbnRSZWN0ID0gKGVsZW1lbnQgaW5zdGFuY2VvZiBzY29wZS5TVkdFbGVtZW50KT9cbiAgICAgICAgICAgICAgICBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOlxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZ2V0Q2xpZW50UmVjdHMoKVswXTtcblxuICAgICAgICByZXR1cm4gY2xpZW50UmVjdCAmJiB7XG4gICAgICAgICAgICBsZWZ0ICA6IGNsaWVudFJlY3QubGVmdCAgICsgc2Nyb2xsLngsXG4gICAgICAgICAgICByaWdodCA6IGNsaWVudFJlY3QucmlnaHQgICsgc2Nyb2xsLngsXG4gICAgICAgICAgICB0b3AgICA6IGNsaWVudFJlY3QudG9wICAgICsgc2Nyb2xsLnksXG4gICAgICAgICAgICBib3R0b206IGNsaWVudFJlY3QuYm90dG9tICsgc2Nyb2xsLnksXG4gICAgICAgICAgICB3aWR0aCA6IGNsaWVudFJlY3Qud2lkdGggfHwgY2xpZW50UmVjdC5yaWdodCAtIGNsaWVudFJlY3QubGVmdCxcbiAgICAgICAgICAgIGhlaWdodDogY2xpZW50UmVjdC5oZWlnaCB8fCBjbGllbnRSZWN0LmJvdHRvbSAtIGNsaWVudFJlY3QudG9wXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHNjb3BlLmdldE9yaWdpblhZID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgZWxlbWVudCkge1xuICAgICAgICB2YXIgb3JpZ2luID0gaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgPyBpbnRlcmFjdGFibGUub3B0aW9ucy5vcmlnaW5cbiAgICAgICAgICAgICAgICA6IHNjb3BlLmRlZmF1bHRPcHRpb25zLm9yaWdpbjtcblxuICAgICAgICBpZiAob3JpZ2luID09PSAncGFyZW50Jykge1xuICAgICAgICAgICAgb3JpZ2luID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcmlnaW4gPT09ICdzZWxmJykge1xuICAgICAgICAgICAgb3JpZ2luID0gaW50ZXJhY3RhYmxlLmdldFJlY3QoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2NvcGUudHJ5U2VsZWN0b3Iob3JpZ2luKSkge1xuICAgICAgICAgICAgb3JpZ2luID0gc2NvcGUuY2xvc2VzdChlbGVtZW50LCBvcmlnaW4pIHx8IHsgeDogMCwgeTogMCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ob3JpZ2luKSkge1xuICAgICAgICAgICAgb3JpZ2luID0gb3JpZ2luKGludGVyYWN0YWJsZSAmJiBlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlscy5pc0VsZW1lbnQob3JpZ2luKSkgIHtcbiAgICAgICAgICAgIG9yaWdpbiA9IHNjb3BlLmdldEVsZW1lbnRSZWN0KG9yaWdpbik7XG4gICAgICAgIH1cblxuICAgICAgICBvcmlnaW4ueCA9ICgneCcgaW4gb3JpZ2luKT8gb3JpZ2luLnggOiBvcmlnaW4ubGVmdDtcbiAgICAgICAgb3JpZ2luLnkgPSAoJ3knIGluIG9yaWdpbik/IG9yaWdpbi55IDogb3JpZ2luLnRvcDtcblxuICAgICAgICByZXR1cm4gb3JpZ2luO1xuICAgIH07XG5cbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81NjM0NTI4LzIyODA4ODhcbiAgICBzY29wZS5fZ2V0UUJlemllclZhbHVlID0gZnVuY3Rpb24gKHQsIHAxLCBwMiwgcDMpIHtcbiAgICAgICAgdmFyIGlUID0gMSAtIHQ7XG4gICAgICAgIHJldHVybiBpVCAqIGlUICogcDEgKyAyICogaVQgKiB0ICogcDIgKyB0ICogdCAqIHAzO1xuICAgIH07XG5cbiAgICBzY29wZS5nZXRRdWFkcmF0aWNDdXJ2ZVBvaW50ID0gZnVuY3Rpb24gKHN0YXJ0WCwgc3RhcnRZLCBjcFgsIGNwWSwgZW5kWCwgZW5kWSwgcG9zaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6ICBzY29wZS5fZ2V0UUJlemllclZhbHVlKHBvc2l0aW9uLCBzdGFydFgsIGNwWCwgZW5kWCksXG4gICAgICAgICAgICB5OiAgc2NvcGUuX2dldFFCZXppZXJWYWx1ZShwb3NpdGlvbiwgc3RhcnRZLCBjcFksIGVuZFkpXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIGh0dHA6Ly9naXptYS5jb20vZWFzaW5nL1xuICAgIHNjb3BlLmVhc2VPdXRRdWFkID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcbiAgICAgICAgdCAvPSBkO1xuICAgICAgICByZXR1cm4gLWMgKiB0Kih0LTIpICsgYjtcbiAgICB9O1xuXG4gICAgc2NvcGUubm9kZUNvbnRhaW5zID0gZnVuY3Rpb24gKHBhcmVudCwgY2hpbGQpIHtcbiAgICAgICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICAgICAgICBpZiAoY2hpbGQgPT09IHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjaGlsZCA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHNjb3BlLmNsb3Nlc3QgPSBmdW5jdGlvbiAoY2hpbGQsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGNoaWxkKTtcblxuICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KHBhcmVudCkpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5tYXRjaGVzU2VsZWN0b3IocGFyZW50LCBzZWxlY3RvcikpIHsgcmV0dXJuIHBhcmVudDsgfVxuXG4gICAgICAgICAgICBwYXJlbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgc2NvcGUucGFyZW50RWxlbWVudCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzRG9jRnJhZyhwYXJlbnQpKSB7XG4gICAgICAgICAgICAvLyBza2lwIHBhc3QgI3NoYWRvLXJvb3QgZnJhZ21lbnRzXG4gICAgICAgICAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5ob3N0KSAmJiBzY29wZS5pc0RvY0ZyYWcocGFyZW50KSkge31cblxuICAgICAgICAgICAgcmV0dXJuIHBhcmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYXJlbnQ7XG4gICAgfTtcblxuICAgIHNjb3BlLmluQ29udGV4dCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0YWJsZS5fY29udGV4dCA9PT0gZWxlbWVudC5vd25lckRvY3VtZW50XG4gICAgICAgICAgICAgICAgfHwgc2NvcGUubm9kZUNvbnRhaW5zKGludGVyYWN0YWJsZS5fY29udGV4dCwgZWxlbWVudCk7XG4gICAgfTtcblxuICAgIHNjb3BlLnRlc3RJZ25vcmUgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBpbnRlcmFjdGFibGVFbGVtZW50LCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBpZ25vcmVGcm9tID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuaWdub3JlRnJvbTtcblxuICAgICAgICBpZiAoIWlnbm9yZUZyb20gfHwgIXV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNTdHJpbmcoaWdub3JlRnJvbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5tYXRjaGVzVXBUbyhlbGVtZW50LCBpZ25vcmVGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1dGlscy5pc0VsZW1lbnQoaWdub3JlRnJvbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5ub2RlQ29udGFpbnMoaWdub3JlRnJvbSwgZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHNjb3BlLnRlc3RBbGxvdyA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZUVsZW1lbnQsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGFsbG93RnJvbSA9IGludGVyYWN0YWJsZS5vcHRpb25zLmFsbG93RnJvbTtcblxuICAgICAgICBpZiAoIWFsbG93RnJvbSkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gICAgICAgIGlmICghdXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhhbGxvd0Zyb20pKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NvcGUubWF0Y2hlc1VwVG8oZWxlbWVudCwgYWxsb3dGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1dGlscy5pc0VsZW1lbnQoYWxsb3dGcm9tKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLm5vZGVDb250YWlucyhhbGxvd0Zyb20sIGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBzY29wZS5jaGVja0F4aXMgPSBmdW5jdGlvbiAoYXhpcywgaW50ZXJhY3RhYmxlKSB7XG4gICAgICAgIGlmICghaW50ZXJhY3RhYmxlKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgIHZhciB0aGlzQXhpcyA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyYWcuYXhpcztcblxuICAgICAgICByZXR1cm4gKGF4aXMgPT09ICd4eScgfHwgdGhpc0F4aXMgPT09ICd4eScgfHwgdGhpc0F4aXMgPT09IGF4aXMpO1xuICAgIH07XG5cbiAgICBzY29wZS5jaGVja1NuYXAgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgICAgICBpZiAoL15yZXNpemUvLnRlc3QoYWN0aW9uKSkge1xuICAgICAgICAgICAgYWN0aW9uID0gJ3Jlc2l6ZSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3B0aW9uc1thY3Rpb25dLnNuYXAgJiYgb3B0aW9uc1thY3Rpb25dLnNuYXAuZW5hYmxlZDtcbiAgICB9O1xuXG4gICAgc2NvcGUuY2hlY2tSZXN0cmljdCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGFjdGlvbikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zO1xuXG4gICAgICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSAncmVzaXplJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0ICYmIG9wdGlvbnNbYWN0aW9uXS5yZXN0cmljdC5lbmFibGVkO1xuICAgIH07XG5cbiAgICBzY29wZS5jaGVja0F1dG9TY3JvbGwgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgICAgICBpZiAoL15yZXNpemUvLnRlc3QoYWN0aW9uKSkge1xuICAgICAgICAgICAgYWN0aW9uID0gJ3Jlc2l6ZSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gIG9wdGlvbnNbYWN0aW9uXS5hdXRvU2Nyb2xsICYmIG9wdGlvbnNbYWN0aW9uXS5hdXRvU2Nyb2xsLmVuYWJsZWQ7XG4gICAgfTtcblxuICAgIHNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucyxcbiAgICAgICAgICAgIG1heEFjdGlvbnMgPSBvcHRpb25zW2FjdGlvbi5uYW1lXS5tYXgsXG4gICAgICAgICAgICBtYXhQZXJFbGVtZW50ID0gb3B0aW9uc1thY3Rpb24ubmFtZV0ubWF4UGVyRWxlbWVudCxcbiAgICAgICAgICAgIGFjdGl2ZUludGVyYWN0aW9ucyA9IDAsXG4gICAgICAgICAgICB0YXJnZXRDb3VudCA9IDAsXG4gICAgICAgICAgICB0YXJnZXRFbGVtZW50Q291bnQgPSAwO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBzY29wZS5pbnRlcmFjdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9uc1tpXSxcbiAgICAgICAgICAgICAgICBvdGhlckFjdGlvbiA9IGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUsXG4gICAgICAgICAgICAgICAgYWN0aXZlID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKTtcblxuICAgICAgICAgICAgaWYgKCFhY3RpdmUpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgYWN0aXZlSW50ZXJhY3Rpb25zKys7XG5cbiAgICAgICAgICAgIGlmIChhY3RpdmVJbnRlcmFjdGlvbnMgPj0gc2NvcGUubWF4SW50ZXJhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24udGFyZ2V0ICE9PSBpbnRlcmFjdGFibGUpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgdGFyZ2V0Q291bnQgKz0gKG90aGVyQWN0aW9uID09PSBhY3Rpb24ubmFtZSl8MDtcblxuICAgICAgICAgICAgaWYgKHRhcmdldENvdW50ID49IG1heEFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5lbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RWxlbWVudENvdW50Kys7XG5cbiAgICAgICAgICAgICAgICBpZiAob3RoZXJBY3Rpb24gIT09IGFjdGlvbi5uYW1lIHx8IHRhcmdldEVsZW1lbnRDb3VudCA+PSBtYXhQZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2NvcGUubWF4SW50ZXJhY3Rpb25zID4gMDtcbiAgICB9O1xuXG4gICAgLy8gVGVzdCBmb3IgdGhlIGVsZW1lbnQgdGhhdCdzIFwiYWJvdmVcIiBhbGwgb3RoZXIgcXVhbGlmaWVyc1xuICAgIHNjb3BlLmluZGV4T2ZEZWVwZXN0RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50cykge1xuICAgICAgICB2YXIgZHJvcHpvbmUsXG4gICAgICAgICAgICBkZWVwZXN0Wm9uZSA9IGVsZW1lbnRzWzBdLFxuICAgICAgICAgICAgaW5kZXggPSBkZWVwZXN0Wm9uZT8gMDogLTEsXG4gICAgICAgICAgICBwYXJlbnQsXG4gICAgICAgICAgICBkZWVwZXN0Wm9uZVBhcmVudHMgPSBbXSxcbiAgICAgICAgICAgIGRyb3B6b25lUGFyZW50cyA9IFtdLFxuICAgICAgICAgICAgY2hpbGQsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbjtcblxuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGRyb3B6b25lID0gZWxlbWVudHNbaV07XG5cbiAgICAgICAgICAgIC8vIGFuIGVsZW1lbnQgbWlnaHQgYmVsb25nIHRvIG11bHRpcGxlIHNlbGVjdG9yIGRyb3B6b25lc1xuICAgICAgICAgICAgaWYgKCFkcm9wem9uZSB8fCBkcm9wem9uZSA9PT0gZGVlcGVzdFpvbmUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFkZWVwZXN0Wm9uZSkge1xuICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZHJvcHpvbmU7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgZGVlcGVzdCBvciBjdXJyZW50IGFyZSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgb3IgZG9jdW1lbnQucm9vdEVsZW1lbnRcbiAgICAgICAgICAgIC8vIC0gaWYgdGhlIGN1cnJlbnQgZHJvcHpvbmUgaXMsIGRvIG5vdGhpbmcgYW5kIGNvbnRpbnVlXG4gICAgICAgICAgICBpZiAoZHJvcHpvbmUucGFyZW50Tm9kZSA9PT0gZHJvcHpvbmUub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gLSBpZiBkZWVwZXN0IGlzLCB1cGRhdGUgd2l0aCB0aGUgY3VycmVudCBkcm9wem9uZSBhbmQgY29udGludWUgdG8gbmV4dFxuICAgICAgICAgICAgZWxzZSBpZiAoZGVlcGVzdFpvbmUucGFyZW50Tm9kZSA9PT0gZHJvcHpvbmUub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZHJvcHpvbmU7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRlZXBlc3Rab25lUGFyZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBkZWVwZXN0Wm9uZTtcbiAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50LnBhcmVudE5vZGUgJiYgcGFyZW50LnBhcmVudE5vZGUgIT09IHBhcmVudC5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50cy51bnNoaWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhpcyBlbGVtZW50IGlzIGFuIHN2ZyBlbGVtZW50IGFuZCB0aGUgY3VycmVudCBkZWVwZXN0IGlzXG4gICAgICAgICAgICAvLyBhbiBIVE1MRWxlbWVudFxuICAgICAgICAgICAgaWYgKGRlZXBlc3Rab25lIGluc3RhbmNlb2Ygc2NvcGUuSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAmJiBkcm9wem9uZSBpbnN0YW5jZW9mIHNjb3BlLlNWR0VsZW1lbnRcbiAgICAgICAgICAgICAgICAmJiAhKGRyb3B6b25lIGluc3RhbmNlb2Ygc2NvcGUuU1ZHU1ZHRWxlbWVudCkpIHtcblxuICAgICAgICAgICAgICAgIGlmIChkcm9wem9uZSA9PT0gZGVlcGVzdFpvbmUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBkcm9wem9uZS5vd25lclNWR0VsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBkcm9wem9uZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZHJvcHpvbmVQYXJlbnRzID0gW107XG5cbiAgICAgICAgICAgIHdoaWxlIChwYXJlbnQucGFyZW50Tm9kZSAhPT0gcGFyZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICBkcm9wem9uZVBhcmVudHMudW5zaGlmdChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuID0gMDtcblxuICAgICAgICAgICAgLy8gZ2V0IChwb3NpdGlvbiBvZiBsYXN0IGNvbW1vbiBhbmNlc3RvcikgKyAxXG4gICAgICAgICAgICB3aGlsZSAoZHJvcHpvbmVQYXJlbnRzW25dICYmIGRyb3B6b25lUGFyZW50c1tuXSA9PT0gZGVlcGVzdFpvbmVQYXJlbnRzW25dKSB7XG4gICAgICAgICAgICAgICAgbisrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcGFyZW50cyA9IFtcbiAgICAgICAgICAgICAgICBkcm9wem9uZVBhcmVudHNbbiAtIDFdLFxuICAgICAgICAgICAgICAgIGRyb3B6b25lUGFyZW50c1tuXSxcbiAgICAgICAgICAgICAgICBkZWVwZXN0Wm9uZVBhcmVudHNbbl1cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGNoaWxkID0gcGFyZW50c1swXS5sYXN0Q2hpbGQ7XG5cbiAgICAgICAgICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gcGFyZW50c1sxXSkge1xuICAgICAgICAgICAgICAgICAgICBkZWVwZXN0Wm9uZSA9IGRyb3B6b25lO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50cyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjaGlsZCA9PT0gcGFyZW50c1syXSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9O1xuXG4gICAgc2NvcGUubWF0Y2hlc1NlbGVjdG9yID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNlbGVjdG9yLCBub2RlTGlzdCkge1xuICAgICAgICBpZiAoc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yLCBub2RlTGlzdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZW1vdmUgL2RlZXAvIGZyb20gc2VsZWN0b3JzIGlmIHNoYWRvd0RPTSBwb2x5ZmlsbCBpcyB1c2VkXG4gICAgICAgIGlmIChzY29wZS53aW5kb3cgIT09IHNjb3BlLnJlYWxXaW5kb3cpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IucmVwbGFjZSgvXFwvZGVlcFxcLy9nLCAnICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnRbYnJvd3Nlci5wcmVmaXhlZE1hdGNoZXNTZWxlY3Rvcl0oc2VsZWN0b3IpO1xuICAgIH07XG5cbiAgICBzY29wZS5tYXRjaGVzVXBUbyA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3RvciwgbGltaXQpIHtcbiAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSBsaW1pdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvLyBGb3IgSUU4J3MgbGFjayBvZiBhbiBFbGVtZW50I21hdGNoZXNTZWxlY3RvclxuICAgIC8vIHRha2VuIGZyb20gaHR0cDovL3RhbmFsaW4uY29tL2VuL2Jsb2cvMjAxMi8xMi9tYXRjaGVzLXNlbGVjdG9yLWllOC8gYW5kIG1vZGlmaWVkXG4gICAgaWYgKCEoYnJvd3Nlci5wcmVmaXhlZE1hdGNoZXNTZWxlY3RvciBpbiBFbGVtZW50LnByb3RvdHlwZSkgfHwgIXNjb3BlLmlzRnVuY3Rpb24oRWxlbWVudC5wcm90b3R5cGVbYnJvd3Nlci5wcmVmaXhlZE1hdGNoZXNTZWxlY3Rvcl0pKSB7XG4gICAgICAgIHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvciA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3RvciwgZWxlbXMpIHtcbiAgICAgICAgICAgIGVsZW1zID0gZWxlbXMgfHwgZWxlbWVudC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZWxlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbXNbaV0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIEludGVyYWN0aW9uID0gcmVxdWlyZSgnLi9JbnRlcmFjdGlvbicpO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tSZXNpemVFZGdlIChuYW1lLCB2YWx1ZSwgcGFnZSwgZWxlbWVudCwgaW50ZXJhY3RhYmxlRWxlbWVudCwgcmVjdCwgbWFyZ2luKSB7XG4gICAgICAgIC8vIGZhbHNlLCAnJywgdW5kZWZpbmVkLCBudWxsXG4gICAgICAgIGlmICghdmFsdWUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgLy8gdHJ1ZSB2YWx1ZSwgdXNlIHBvaW50ZXIgY29vcmRzIGFuZCBlbGVtZW50IHJlY3RcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAvLyBpZiBkaW1lbnNpb25zIGFyZSBuZWdhdGl2ZSwgXCJzd2l0Y2hcIiBlZGdlc1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gc2NvcGUuaXNOdW1iZXIocmVjdC53aWR0aCk/IHJlY3Qud2lkdGggOiByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgIGhlaWdodCA9IHNjb3BlLmlzTnVtYmVyKHJlY3QuaGVpZ2h0KT8gcmVjdC5oZWlnaHQgOiByZWN0LmJvdHRvbSAtIHJlY3QudG9wO1xuXG4gICAgICAgICAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICAgICAgaWYgICAgICAobmFtZSA9PT0gJ2xlZnQnICkgeyBuYW1lID0gJ3JpZ2h0JzsgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgbmFtZSA9ICdsZWZ0JyA7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgaWYgICAgICAobmFtZSA9PT0gJ3RvcCcgICApIHsgbmFtZSA9ICdib3R0b20nOyB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgbmFtZSA9ICd0b3AnICAgOyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnbGVmdCcgICkgeyByZXR1cm4gcGFnZS54IDwgKCh3aWR0aCAgPj0gMD8gcmVjdC5sZWZ0OiByZWN0LnJpZ2h0ICkgKyBtYXJnaW4pOyB9XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ3RvcCcgICApIHsgcmV0dXJuIHBhZ2UueSA8ICgoaGVpZ2h0ID49IDA/IHJlY3QudG9wIDogcmVjdC5ib3R0b20pICsgbWFyZ2luKTsgfVxuXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ3JpZ2h0JyApIHsgcmV0dXJuIHBhZ2UueCA+ICgod2lkdGggID49IDA/IHJlY3QucmlnaHQgOiByZWN0LmxlZnQpIC0gbWFyZ2luKTsgfVxuICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdib3R0b20nKSB7IHJldHVybiBwYWdlLnkgPiAoKGhlaWdodCA+PSAwPyByZWN0LmJvdHRvbTogcmVjdC50b3AgKSAtIG1hcmdpbik7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZSByZW1haW5pbmcgY2hlY2tzIHJlcXVpcmUgYW4gZWxlbWVudFxuICAgICAgICBpZiAoIXV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICByZXR1cm4gdXRpbHMuaXNFbGVtZW50KHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgdmFsdWUgaXMgYW4gZWxlbWVudCB0byB1c2UgYXMgYSByZXNpemUgaGFuZGxlXG4gICAgICAgICAgICAgICAgICAgID8gdmFsdWUgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIGVsZW1lbnQgbWF0Y2hlcyB2YWx1ZSBhcyBzZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICA6IHNjb3BlLm1hdGNoZXNVcFRvKGVsZW1lbnQsIHZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50KTtcbiAgICB9XG5cblxuICAgIHZhciBJbnRlcmFjdEV2ZW50ID0gcmVxdWlyZSgnLi9JbnRlcmFjdEV2ZW50Jyk7XG5cbiAgICB2YXIgbGlzdGVuZXIgPSByZXF1aXJlKCcuL2xpc3RlbmVyJyk7XG5cbiAgICBsaXN0ZW5lci5iaW5kSW50ZXJhY3Rpb25MaXN0ZW5lcnMoKTtcblxuXG4gICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5pbmRleE9mRWxlbWVudCA9IGZ1bmN0aW9uIGluZGV4T2ZFbGVtZW50IChlbGVtZW50LCBjb250ZXh0KSB7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHNjb3BlLmRvY3VtZW50O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0YWJsZSA9IHRoaXNbaV07XG5cbiAgICAgICAgICAgIGlmICgoaW50ZXJhY3RhYmxlLnNlbGVjdG9yID09PSBlbGVtZW50XG4gICAgICAgICAgICAgICAgJiYgKGludGVyYWN0YWJsZS5fY29udGV4dCA9PT0gY29udGV4dCkpXG4gICAgICAgICAgICAgICAgfHwgKCFpbnRlcmFjdGFibGUuc2VsZWN0b3IgJiYgaW50ZXJhY3RhYmxlLl9lbGVtZW50ID09PSBlbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICBzY29wZS5pbnRlcmFjdGFibGVzLmdldCA9IGZ1bmN0aW9uIGludGVyYWN0YWJsZUdldCAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpc1t0aGlzLmluZGV4T2ZFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0KV07XG4gICAgfTtcblxuICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0YWJsZSA9IHRoaXNbaV07XG5cbiAgICAgICAgICAgIGlmICghaW50ZXJhY3RhYmxlLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhpbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZS5zZWxlY3RvciwgaW50ZXJhY3RhYmxlLl9jb250ZXh0LCBpLCB0aGlzKTtcblxuICAgICAgICAgICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogVGhlIG1ldGhvZHMgb2YgdGhpcyB2YXJpYWJsZSBjYW4gYmUgdXNlZCB0byBzZXQgZWxlbWVudHMgYXNcbiAgICAgKiBpbnRlcmFjdGFibGVzIGFuZCBhbHNvIHRvIGNoYW5nZSB2YXJpb3VzIGRlZmF1bHQgc2V0dGluZ3MuXG4gICAgICpcbiAgICAgKiBDYWxsaW5nIGl0IGFzIGEgZnVuY3Rpb24gYW5kIHBhc3NpbmcgYW4gZWxlbWVudCBvciBhIHZhbGlkIENTUyBzZWxlY3RvclxuICAgICAqIHN0cmluZyByZXR1cm5zIGFuIEludGVyYWN0YWJsZSBvYmplY3Qgd2hpY2ggaGFzIHZhcmlvdXMgbWV0aG9kcyB0b1xuICAgICAqIGNvbmZpZ3VyZSBpdC5cbiAgICAgKlxuICAgICAtIGVsZW1lbnQgKEVsZW1lbnQgfCBzdHJpbmcpIFRoZSBIVE1MIG9yIFNWRyBFbGVtZW50IHRvIGludGVyYWN0IHdpdGggb3IgQ1NTIHNlbGVjdG9yXG4gICAgID0gKG9iamVjdCkgQW4gQEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgID4gVXNhZ2VcbiAgICAgfCBpbnRlcmFjdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHJhZ2dhYmxlJykpLmRyYWdnYWJsZSh0cnVlKTtcbiAgICAgfFxuICAgICB8IHZhciByZWN0YWJsZXMgPSBpbnRlcmFjdCgncmVjdCcpO1xuICAgICB8IHJlY3RhYmxlc1xuICAgICB8ICAgICAuZ2VzdHVyYWJsZSh0cnVlKVxuICAgICB8ICAgICAub24oJ2dlc3R1cmVtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgIHwgICAgICAgICAvLyBzb21ldGhpbmcgY29vbC4uLlxuICAgICB8ICAgICB9KVxuICAgICB8ICAgICAuYXV0b1Njcm9sbCh0cnVlKTtcbiAgICBcXCovXG4gICAgZnVuY3Rpb24gaW50ZXJhY3QgKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0YWJsZXMuZ2V0KGVsZW1lbnQsIG9wdGlvbnMpIHx8IG5ldyBJbnRlcmFjdGFibGUoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdmFyIEludGVyYWN0YWJsZSA9IHJlcXVpcmUoJy4vSW50ZXJhY3RhYmxlJyk7XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuaXNTZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQ2hlY2sgaWYgYW4gZWxlbWVudCBoYXMgYmVlbiBzZXRcbiAgICAgLSBlbGVtZW50IChFbGVtZW50KSBUaGUgRWxlbWVudCBiZWluZyBzZWFyY2hlZCBmb3JcbiAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoZSBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB3YXMgcHJldmlvdXNseSBwYXNzZWQgdG8gaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QuaXNTZXQgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGFibGVzLmluZGV4T2ZFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0KSAhPT0gLTE7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBBZGRzIGEgZ2xvYmFsIGxpc3RlbmVyIGZvciBhbiBJbnRlcmFjdEV2ZW50IG9yIGFkZHMgYSBET00gZXZlbnQgdG9cbiAgICAgKiBgZG9jdW1lbnRgXG4gICAgICpcbiAgICAgLSB0eXBlICAgICAgIChzdHJpbmcgfCBhcnJheSB8IG9iamVjdCkgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW4gZm9yXG4gICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gdGhlIGdpdmVuIGV2ZW50KHMpXG4gICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuICAgICA9IChvYmplY3QpIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0Lm9uID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyh0eXBlKSAmJiB0eXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgdHlwZSA9IHR5cGUudHJpbSgpLnNwbGl0KC8gKy8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGludGVyYWN0Lm9uKHR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KHR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHR5cGUpIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdC5vbihwcm9wLCB0eXBlW3Byb3BdLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIGl0IGlzIGFuIEludGVyYWN0RXZlbnQgdHlwZSwgYWRkIGxpc3RlbmVyIHRvIGdsb2JhbEV2ZW50c1xuICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgdHlwZSBvZiBldmVudCB3YXMgbmV2ZXIgYm91bmRcbiAgICAgICAgICAgIGlmICghc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdID0gW2xpc3RlbmVyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjb3BlLmdsb2JhbEV2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBub24gSW50ZXJhY3RFdmVudCB0eXBlLCBhZGRFdmVudExpc3RlbmVyIHRvIGRvY3VtZW50XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZXZlbnRzLmFkZChzY29wZS5kb2N1bWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3Qub2ZmXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJlbW92ZXMgYSBnbG9iYWwgSW50ZXJhY3RFdmVudCBsaXN0ZW5lciBvciBET00gZXZlbnQgZnJvbSBgZG9jdW1lbnRgXG4gICAgICpcbiAgICAgLSB0eXBlICAgICAgIChzdHJpbmcgfCBhcnJheSB8IG9iamVjdCkgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmUgbGlzdGVuZWQgZm9yXG4gICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBiZSByZW1vdmVkXG4gICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgICA9IChvYmplY3QpIGludGVyYWN0XG4gICAgIFxcKi9cbiAgICBpbnRlcmFjdC5vZmYgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKHR5cGUpICYmIHR5cGUuc2VhcmNoKCcgJykgIT09IC0xKSB7XG4gICAgICAgICAgICB0eXBlID0gdHlwZS50cmltKCkuc3BsaXQoLyArLyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Qub2ZmKHR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KHR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHR5cGUpIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdC5vZmYocHJvcCwgdHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIHR5cGUpKSB7XG4gICAgICAgICAgICBldmVudHMucmVtb3ZlKHNjb3BlLmRvY3VtZW50LCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW5kZXg7XG5cbiAgICAgICAgICAgIGlmICh0eXBlIGluIHNjb3BlLmdsb2JhbEV2ZW50c1xuICAgICAgICAgICAgICAgICYmIChpbmRleCA9IHNjb3BlLmluZGV4T2Yoc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdLCBsaXN0ZW5lcikpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHNjb3BlLmdsb2JhbEV2ZW50c1t0eXBlXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuZW5hYmxlRHJhZ2dpbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGRyYWdnaW5nIGlzIGVuYWJsZWQgZm9yIGFueSBJbnRlcmFjdGFibGVzXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIGB0cnVlYCB0byBhbGxvdyB0aGUgYWN0aW9uOyBgZmFsc2VgIHRvIGRpc2FibGUgYWN0aW9uIGZvciBhbGwgSW50ZXJhY3RhYmxlc1xuICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LmVuYWJsZURyYWdnaW5nID0gdXRpbHMud2Fybk9uY2UoZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZHJhZyA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5kcmFnO1xuICAgIH0sICdpbnRlcmFjdC5lbmFibGVEcmFnZ2luZyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIHNvb24gYmUgcmVtb3ZlZC4nKTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5lbmFibGVSZXNpemluZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEZXByZWNhdGVkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgcmVzaXppbmcgaXMgZW5hYmxlZCBmb3IgYW55IEludGVyYWN0YWJsZXNcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWwgYHRydWVgIHRvIGFsbG93IHRoZSBhY3Rpb247IGBmYWxzZWAgdG8gZGlzYWJsZSBhY3Rpb24gZm9yIGFsbCBJbnRlcmFjdGFibGVzXG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QuZW5hYmxlUmVzaXppbmcgPSB1dGlscy53YXJuT25jZShmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBudWxsICYmIG5ld1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5yZXNpemUgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5hY3Rpb25Jc0VuYWJsZWQucmVzaXplO1xuICAgIH0sICdpbnRlcmFjdC5lbmFibGVSZXNpemluZyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIHNvb24gYmUgcmVtb3ZlZC4nKTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5lbmFibGVHZXN0dXJpbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGdlc3R1cmluZyBpcyBlbmFibGVkIGZvciBhbnkgSW50ZXJhY3RhYmxlc1xuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbCBgdHJ1ZWAgdG8gYWxsb3cgdGhlIGFjdGlvbjsgYGZhbHNlYCB0byBkaXNhYmxlIGFjdGlvbiBmb3IgYWxsIEludGVyYWN0YWJsZXNcbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5lbmFibGVHZXN0dXJpbmcgPSB1dGlscy53YXJuT25jZShmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBudWxsICYmIG5ld1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5nZXN0dXJlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uSXNFbmFibGVkLmdlc3R1cmU7XG4gICAgfSwgJ2ludGVyYWN0LmVuYWJsZUdlc3R1cmluZyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIHNvb24gYmUgcmVtb3ZlZC4nKTtcblxuICAgIGludGVyYWN0LmV2ZW50VHlwZXMgPSBzY29wZS5ldmVudFR5cGVzO1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmRlYnVnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgZGVidWdnaW5nIGRhdGFcbiAgICAgPSAob2JqZWN0KSBBbiBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRoYXQgb3V0bGluZSB0aGUgY3VycmVudCBzdGF0ZSBhbmQgZXhwb3NlIGludGVybmFsIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzXG4gICAgXFwqL1xuICAgIGludGVyYWN0LmRlYnVnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnNbMF0gfHwgbmV3IEludGVyYWN0aW9uKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGludGVyYWN0aW9ucyAgICAgICAgICA6IHNjb3BlLmludGVyYWN0aW9ucyxcbiAgICAgICAgICAgIHRhcmdldCAgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnRhcmdldCxcbiAgICAgICAgICAgIGRyYWdnaW5nICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLmRyYWdnaW5nLFxuICAgICAgICAgICAgcmVzaXppbmcgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucmVzaXppbmcsXG4gICAgICAgICAgICBnZXN0dXJpbmcgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5nZXN0dXJpbmcsXG4gICAgICAgICAgICBwcmVwYXJlZCAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wcmVwYXJlZCxcbiAgICAgICAgICAgIG1hdGNoZXMgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLm1hdGNoZXMsXG4gICAgICAgICAgICBtYXRjaEVsZW1lbnRzICAgICAgICAgOiBpbnRlcmFjdGlvbi5tYXRjaEVsZW1lbnRzLFxuXG4gICAgICAgICAgICBwcmV2Q29vcmRzICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wcmV2Q29vcmRzLFxuICAgICAgICAgICAgc3RhcnRDb29yZHMgICAgICAgICAgIDogaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMsXG5cbiAgICAgICAgICAgIHBvaW50ZXJJZHMgICAgICAgICAgICA6IGludGVyYWN0aW9uLnBvaW50ZXJJZHMsXG4gICAgICAgICAgICBwb2ludGVycyAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wb2ludGVycyxcbiAgICAgICAgICAgIGFkZFBvaW50ZXIgICAgICAgICAgICA6IGxpc3RlbmVyLmxpc3RlbmVycy5hZGRQb2ludGVyLFxuICAgICAgICAgICAgcmVtb3ZlUG9pbnRlciAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLnJlbW92ZVBvaW50ZXIsXG4gICAgICAgICAgICByZWNvcmRQb2ludGVyICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucmVjb3JkUG9pbnRlcixcblxuICAgICAgICAgICAgc25hcCAgICAgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uc25hcFN0YXR1cyxcbiAgICAgICAgICAgIHJlc3RyaWN0ICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnJlc3RyaWN0U3RhdHVzLFxuICAgICAgICAgICAgaW5lcnRpYSAgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cyxcblxuICAgICAgICAgICAgZG93blRpbWUgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZG93blRpbWVzWzBdLFxuICAgICAgICAgICAgZG93bkV2ZW50ICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZG93bkV2ZW50LFxuICAgICAgICAgICAgZG93blBvaW50ZXIgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZG93blBvaW50ZXIsXG4gICAgICAgICAgICBwcmV2RXZlbnQgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQsXG5cbiAgICAgICAgICAgIEludGVyYWN0YWJsZSAgICAgICAgICA6IEludGVyYWN0YWJsZSxcbiAgICAgICAgICAgIGludGVyYWN0YWJsZXMgICAgICAgICA6IHNjb3BlLmludGVyYWN0YWJsZXMsXG4gICAgICAgICAgICBwb2ludGVySXNEb3duICAgICAgICAgOiBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duLFxuICAgICAgICAgICAgZGVmYXVsdE9wdGlvbnMgICAgICAgIDogc2NvcGUuZGVmYXVsdE9wdGlvbnMsXG4gICAgICAgICAgICBkZWZhdWx0QWN0aW9uQ2hlY2tlciAgOiByZXF1aXJlKCcuL2RlZmF1bHRBY3Rpb25DaGVja2VyJyksXG5cbiAgICAgICAgICAgIGFjdGlvbkN1cnNvcnMgICAgICAgICA6IHNjb3BlLmFjdGlvbkN1cnNvcnMsXG4gICAgICAgICAgICBkcmFnTW92ZSAgICAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMuZHJhZ01vdmUsXG4gICAgICAgICAgICByZXNpemVNb3ZlICAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucmVzaXplTW92ZSxcbiAgICAgICAgICAgIGdlc3R1cmVNb3ZlICAgICAgICAgICA6IGxpc3RlbmVyLmxpc3RlbmVycy5nZXN0dXJlTW92ZSxcbiAgICAgICAgICAgIHBvaW50ZXJVcCAgICAgICAgICAgICA6IGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVyVXAsXG4gICAgICAgICAgICBwb2ludGVyRG93biAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckRvd24sXG4gICAgICAgICAgICBwb2ludGVyTW92ZSAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlck1vdmUsXG4gICAgICAgICAgICBwb2ludGVySG92ZXIgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckhvdmVyLFxuXG4gICAgICAgICAgICBldmVudFR5cGVzICAgICAgICAgICAgOiBzY29wZS5ldmVudFR5cGVzLFxuXG4gICAgICAgICAgICBldmVudHMgICAgICAgICAgICAgICAgOiBldmVudHMsXG4gICAgICAgICAgICBnbG9iYWxFdmVudHMgICAgICAgICAgOiBzY29wZS5nbG9iYWxFdmVudHMsXG4gICAgICAgICAgICBkZWxlZ2F0ZWRFdmVudHMgICAgICAgOiBsaXN0ZW5lci5kZWxlZ2F0ZWRFdmVudHNcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gZXhwb3NlIHRoZSBmdW5jdGlvbnMgdXNlZCB0byBjYWxjdWxhdGUgbXVsdGktdG91Y2ggcHJvcGVydGllc1xuICAgIGludGVyYWN0LmdldFRvdWNoQXZlcmFnZSAgPSB1dGlscy50b3VjaEF2ZXJhZ2U7XG4gICAgaW50ZXJhY3QuZ2V0VG91Y2hCQm94ICAgICA9IHV0aWxzLnRvdWNoQkJveDtcbiAgICBpbnRlcmFjdC5nZXRUb3VjaERpc3RhbmNlID0gdXRpbHMudG91Y2hEaXN0YW5jZTtcbiAgICBpbnRlcmFjdC5nZXRUb3VjaEFuZ2xlICAgID0gdXRpbHMudG91Y2hBbmdsZTtcblxuICAgIGludGVyYWN0LmdldEVsZW1lbnRSZWN0ICAgPSBzY29wZS5nZXRFbGVtZW50UmVjdDtcbiAgICBpbnRlcmFjdC5tYXRjaGVzU2VsZWN0b3IgID0gc2NvcGUubWF0Y2hlc1NlbGVjdG9yO1xuICAgIGludGVyYWN0LmNsb3Nlc3QgICAgICAgICAgPSBzY29wZS5jbG9zZXN0O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0Lm1hcmdpblxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1hcmdpbiBmb3IgYXV0b2NoZWNrIHJlc2l6aW5nIHVzZWQgaW5cbiAgICAgKiBASW50ZXJhY3RhYmxlLmdldEFjdGlvbi4gVGhhdCBpcyB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgYm90dG9tIGFuZCByaWdodFxuICAgICAqIGVkZ2VzIG9mIGFuIGVsZW1lbnQgY2xpY2tpbmcgaW4gd2hpY2ggd2lsbCBzdGFydCByZXNpemluZ1xuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKG51bWJlcikgI29wdGlvbmFsXG4gICAgID0gKG51bWJlciB8IGludGVyYWN0KSBUaGUgY3VycmVudCBtYXJnaW4gdmFsdWUgb3IgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QubWFyZ2luID0gZnVuY3Rpb24gKG5ld3ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihuZXd2YWx1ZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLm1hcmdpbiA9IG5ld3ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLm1hcmdpbjtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LnN1cHBvcnRzVG91Y2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIFdoZXRoZXIgb3Igbm90IHRoZSBicm93c2VyIHN1cHBvcnRzIHRvdWNoIGlucHV0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LnN1cHBvcnRzVG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBicm93c2VyLnN1cHBvcnRzVG91Y2g7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5zdXBwb3J0c1BvaW50ZXJFdmVudFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgV2hldGhlciBvciBub3QgdGhlIGJyb3dzZXIgc3VwcG9ydHMgUG9pbnRlckV2ZW50c1xuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5zdXBwb3J0c1BvaW50ZXJFdmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQ7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5zdG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIENhbmNlbHMgYWxsIGludGVyYWN0aW9ucyAoZW5kIGV2ZW50cyBhcmUgbm90IGZpcmVkKVxuICAgICAqXG4gICAgIC0gZXZlbnQgKEV2ZW50KSBBbiBldmVudCBvbiB3aGljaCB0byBjYWxsIHByZXZlbnREZWZhdWx0KClcbiAgICAgPSAob2JqZWN0KSBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5zdG9wID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBzY29wZS5pbnRlcmFjdGlvbnMubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zW2ldLnN0b3AoZXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuZHluYW1pY0Ryb3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdGhlIGRpbWVuc2lvbnMgb2YgZHJvcHpvbmUgZWxlbWVudHMgYXJlXG4gICAgICogY2FsY3VsYXRlZCBvbiBldmVyeSBkcmFnbW92ZSBvciBvbmx5IG9uIGRyYWdzdGFydCBmb3IgdGhlIGRlZmF1bHRcbiAgICAgKiBkcm9wQ2hlY2tlclxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbCBUcnVlIHRvIGNoZWNrIG9uIGVhY2ggbW92ZS4gRmFsc2UgdG8gY2hlY2sgb25seSBiZWZvcmUgc3RhcnRcbiAgICAgPSAoYm9vbGVhbiB8IGludGVyYWN0KSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LmR5bmFtaWNEcm9wID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAvL2lmIChkcmFnZ2luZyAmJiBkeW5hbWljRHJvcCAhPT0gbmV3VmFsdWUgJiYgIW5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy9jYWxjUmVjdHMoZHJvcHpvbmVzKTtcbiAgICAgICAgICAgIC8vfVxuXG4gICAgICAgICAgICBzY29wZS5keW5hbWljRHJvcCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLmR5bmFtaWNEcm9wO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QucG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgZGlzdGFuY2UgdGhlIHBvaW50ZXIgbXVzdCBiZSBtb3ZlZCBiZWZvcmUgYW4gYWN0aW9uXG4gICAgICogc2VxdWVuY2Ugb2NjdXJzLiBUaGlzIGFsc28gYWZmZWN0cyB0b2xlcmFuY2UgZm9yIHRhcCBldmVudHMuXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAobnVtYmVyKSAjb3B0aW9uYWwgVGhlIG1vdmVtZW50IGZyb20gdGhlIHN0YXJ0IHBvc2l0aW9uIG11c3QgYmUgZ3JlYXRlciB0aGFuIHRoaXMgdmFsdWVcbiAgICAgPSAobnVtYmVyIHwgSW50ZXJhY3RhYmxlKSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LnBvaW50ZXJNb3ZlVG9sZXJhbmNlID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLnBvaW50ZXJNb3ZlVG9sZXJhbmNlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjb3BlLnBvaW50ZXJNb3ZlVG9sZXJhbmNlO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QubWF4SW50ZXJhY3Rpb25zXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNvbmN1cnJlbnQgaW50ZXJhY3Rpb25zIGFsbG93ZWQuXG4gICAgICogQnkgZGVmYXVsdCBvbmx5IDEgaW50ZXJhY3Rpb24gaXMgYWxsb3dlZCBhdCBhIHRpbWUgKGZvciBiYWNrd2FyZHNcbiAgICAgKiBjb21wYXRpYmlsaXR5KS4gVG8gYWxsb3cgbXVsdGlwbGUgaW50ZXJhY3Rpb25zIG9uIHRoZSBzYW1lIEludGVyYWN0YWJsZXNcbiAgICAgKiBhbmQgZWxlbWVudHMsIHlvdSBuZWVkIHRvIGVuYWJsZSBpdCBpbiB0aGUgZHJhZ2dhYmxlLCByZXNpemFibGUgYW5kXG4gICAgICogZ2VzdHVyYWJsZSBgJ21heCdgIGFuZCBgJ21heFBlckVsZW1lbnQnYCBvcHRpb25zLlxuICAgICAqKlxuICAgICAtIG5ld1ZhbHVlIChudW1iZXIpICNvcHRpb25hbCBBbnkgbnVtYmVyLiBuZXdWYWx1ZSA8PSAwIG1lYW5zIG5vIGludGVyYWN0aW9ucy5cbiAgICBcXCovXG4gICAgaW50ZXJhY3QubWF4SW50ZXJhY3Rpb25zID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLm1heEludGVyYWN0aW9ucyA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY29wZS5tYXhJbnRlcmFjdGlvbnM7XG4gICAgfTtcblxuICAgIGludGVyYWN0LmNyZWF0ZVNuYXBHcmlkID0gZnVuY3Rpb24gKGdyaWQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0WCA9IDAsXG4gICAgICAgICAgICAgICAgb2Zmc2V0WSA9IDA7XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChncmlkLm9mZnNldCkpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gZ3JpZC5vZmZzZXQueDtcbiAgICAgICAgICAgICAgICBvZmZzZXRZID0gZ3JpZC5vZmZzZXQueTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdyaWR4ID0gTWF0aC5yb3VuZCgoeCAtIG9mZnNldFgpIC8gZ3JpZC54KSxcbiAgICAgICAgICAgICAgICBncmlkeSA9IE1hdGgucm91bmQoKHkgLSBvZmZzZXRZKSAvIGdyaWQueSksXG5cbiAgICAgICAgICAgICAgICBuZXdYID0gZ3JpZHggKiBncmlkLnggKyBvZmZzZXRYLFxuICAgICAgICAgICAgICAgIG5ld1kgPSBncmlkeSAqIGdyaWQueSArIG9mZnNldFk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogbmV3WCxcbiAgICAgICAgICAgICAgICB5OiBuZXdZLFxuICAgICAgICAgICAgICAgIHJhbmdlOiBncmlkLnJhbmdlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBsaXN0ZW5lci5saXN0ZW5Ub0RvY3VtZW50KHNjb3BlLmRvY3VtZW50KTtcblxuICAgIHNjb3BlLmludGVyYWN0ID0gaW50ZXJhY3Q7XG4gICAgc2NvcGUuSW50ZXJhY3RhYmxlID0gSW50ZXJhY3RhYmxlO1xuICAgIHNjb3BlLkludGVyYWN0aW9uID0gSW50ZXJhY3Rpb247XG4gICAgc2NvcGUuSW50ZXJhY3RFdmVudCA9IEludGVyYWN0RXZlbnQ7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGludGVyYWN0O1xuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvZXZlbnRzJyk7XG52YXIgc2NvcGUgPSByZXF1aXJlKCcuL3Njb3BlJyk7XG52YXIgYnJvd3NlciA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3NlcicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEludGVyYWN0aW9uID0gcmVxdWlyZSgnLi9JbnRlcmFjdGlvbicpO1xuXG52YXIgbGlzdGVuZXJzID0ge307XG5cbi8vIHtcbi8vICAgICAgdHlwZToge1xuLy8gICAgICAgICAgc2VsZWN0b3JzOiBbJ3NlbGVjdG9yJywgLi4uXSxcbi8vICAgICAgICAgIGNvbnRleHRzIDogW2RvY3VtZW50LCAuLi5dLFxuLy8gICAgICAgICAgbGlzdGVuZXJzOiBbW2xpc3RlbmVyLCB1c2VDYXB0dXJlXSwgLi4uXVxuLy8gICAgICB9XG4vLyAgfVxuZGVsZWdhdGVkRXZlbnRzID0ge307XG5cbnZhciBpbnRlcmFjdGlvbkxpc3RlbmVycyA9IFtcbiAgICAnZHJhZ1N0YXJ0JyxcbiAgICAnZHJhZ01vdmUnLFxuICAgICdyZXNpemVTdGFydCcsXG4gICAgJ3Jlc2l6ZU1vdmUnLFxuICAgICdnZXN0dXJlU3RhcnQnLFxuICAgICdnZXN0dXJlTW92ZScsXG4gICAgJ3BvaW50ZXJPdmVyJyxcbiAgICAncG9pbnRlck91dCcsXG4gICAgJ3BvaW50ZXJIb3ZlcicsXG4gICAgJ3NlbGVjdG9yRG93bicsXG4gICAgJ3BvaW50ZXJEb3duJyxcbiAgICAncG9pbnRlck1vdmUnLFxuICAgICdwb2ludGVyVXAnLFxuICAgICdwb2ludGVyQ2FuY2VsJyxcbiAgICAncG9pbnRlckVuZCcsXG4gICAgJ2FkZFBvaW50ZXInLFxuICAgICdyZW1vdmVQb2ludGVyJyxcbiAgICAncmVjb3JkUG9pbnRlcicsXG4gICAgJ2F1dG9TY3JvbGxNb3ZlJ1xuXTtcblxuZnVuY3Rpb24gZW5kQWxsSW50ZXJhY3Rpb25zIChldmVudCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNjb3BlLmludGVyYWN0aW9uc1tpXS5wb2ludGVyRW5kKGV2ZW50LCBldmVudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsaXN0ZW5Ub0RvY3VtZW50IChkb2MpIHtcbiAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuZG9jdW1lbnRzLCBkb2MpKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHdpbiA9IGRvYy5kZWZhdWx0VmlldyB8fCBkb2MucGFyZW50V2luZG93O1xuXG4gICAgLy8gYWRkIGRlbGVnYXRlIGV2ZW50IGxpc3RlbmVyXG4gICAgZm9yICh2YXIgZXZlbnRUeXBlIGluIGRlbGVnYXRlZEV2ZW50cykge1xuICAgICAgICBldmVudHMuYWRkKGRvYywgZXZlbnRUeXBlLCBkZWxlZ2F0ZUxpc3RlbmVyKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIGV2ZW50VHlwZSwgZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAoc2NvcGUuUG9pbnRlckV2ZW50KSB7XG4gICAgICAgIGlmIChzY29wZS5Qb2ludGVyRXZlbnQgPT09IHdpbi5NU1BvaW50ZXJFdmVudCkge1xuICAgICAgICAgICAgc2NvcGUucEV2ZW50VHlwZXMgPSB7XG4gICAgICAgICAgICAgICAgdXA6ICdNU1BvaW50ZXJVcCcsIGRvd246ICdNU1BvaW50ZXJEb3duJywgb3ZlcjogJ21vdXNlb3ZlcicsXG4gICAgICAgICAgICAgICAgb3V0OiAnbW91c2VvdXQnLCBtb3ZlOiAnTVNQb2ludGVyTW92ZScsIGNhbmNlbDogJ01TUG9pbnRlckNhbmNlbCcgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjb3BlLnBFdmVudFR5cGVzID0ge1xuICAgICAgICAgICAgICAgIHVwOiAncG9pbnRlcnVwJywgZG93bjogJ3BvaW50ZXJkb3duJywgb3ZlcjogJ3BvaW50ZXJvdmVyJyxcbiAgICAgICAgICAgICAgICBvdXQ6ICdwb2ludGVyb3V0JywgbW92ZTogJ3BvaW50ZXJtb3ZlJywgY2FuY2VsOiAncG9pbnRlcmNhbmNlbCcgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5kb3duICAsIGxpc3RlbmVycy5zZWxlY3RvckRvd24gKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLm1vdmUgICwgbGlzdGVuZXJzLnBvaW50ZXJNb3ZlICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMub3ZlciAgLCBsaXN0ZW5lcnMucG9pbnRlck92ZXIgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5vdXQgICAsIGxpc3RlbmVycy5wb2ludGVyT3V0ICAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLnVwICAgICwgbGlzdGVuZXJzLnBvaW50ZXJVcCAgICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMuY2FuY2VsLCBsaXN0ZW5lcnMucG9pbnRlckNhbmNlbCk7XG5cbiAgICAgICAgLy8gYXV0b3Njcm9sbFxuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMubW92ZSwgbGlzdGVuZXJzLmF1dG9TY3JvbGxNb3ZlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2Vkb3duJywgbGlzdGVuZXJzLnNlbGVjdG9yRG93bik7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2Vtb3ZlJywgbGlzdGVuZXJzLnBvaW50ZXJNb3ZlICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2V1cCcgICwgbGlzdGVuZXJzLnBvaW50ZXJVcCAgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2VvdmVyJywgbGlzdGVuZXJzLnBvaW50ZXJPdmVyICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2VvdXQnICwgbGlzdGVuZXJzLnBvaW50ZXJPdXQgICk7XG5cbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaHN0YXJ0JyAsIGxpc3RlbmVycy5zZWxlY3RvckRvd24gKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaG1vdmUnICAsIGxpc3RlbmVycy5wb2ludGVyTW92ZSAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaGVuZCcgICAsIGxpc3RlbmVycy5wb2ludGVyVXAgICAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaGNhbmNlbCcsIGxpc3RlbmVycy5wb2ludGVyQ2FuY2VsKTtcblxuICAgICAgICAvLyBhdXRvc2Nyb2xsXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2Vtb3ZlJywgbGlzdGVuZXJzLmF1dG9TY3JvbGxNb3ZlKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaG1vdmUnLCBsaXN0ZW5lcnMuYXV0b1Njcm9sbE1vdmUpO1xuICAgIH1cblxuICAgIGV2ZW50cy5hZGQod2luLCAnYmx1cicsIGVuZEFsbEludGVyYWN0aW9ucyk7XG5cbiAgICB0cnkge1xuICAgICAgICBpZiAod2luLmZyYW1lRWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudERvYyA9IHdpbi5mcmFtZUVsZW1lbnQub3duZXJEb2N1bWVudCxcbiAgICAgICAgICAgICAgICBwYXJlbnRXaW5kb3cgPSBwYXJlbnREb2MuZGVmYXVsdFZpZXc7XG5cbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAnbW91c2V1cCcgICAgICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAndG91Y2hlbmQnICAgICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAndG91Y2hjYW5jZWwnICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAncG9pbnRlcnVwJyAgICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAnTVNQb2ludGVyVXAnICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50V2luZG93LCAnYmx1cicgICAgICAgICAsIGVuZEFsbEludGVyYWN0aW9ucyApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBpbnRlcmFjdC53aW5kb3dQYXJlbnRFcnJvciA9IGVycm9yO1xuICAgIH1cblxuICAgIGlmIChldmVudHMudXNlQXR0YWNoRXZlbnQpIHtcbiAgICAgICAgLy8gRm9yIElFJ3MgbGFjayBvZiBFdmVudCNwcmV2ZW50RGVmYXVsdFxuICAgICAgICBldmVudHMuYWRkKGRvYywgJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnNbMF07XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5jdXJyZW50QWN0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRm9yIElFJ3MgYmFkIGRibGNsaWNrIGV2ZW50IHNlcXVlbmNlXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnZGJsY2xpY2snLCBkb09uSW50ZXJhY3Rpb25zKCdpZThEYmxjbGljaycpKTtcbiAgICB9XG5cbiAgICBzY29wZS5kb2N1bWVudHMucHVzaChkb2MpO1xufVxuXG5mdW5jdGlvbiBkb09uSW50ZXJhY3Rpb25zIChtZXRob2QpIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgaW50ZXJhY3Rpb24sXG4gICAgICAgICAgICBldmVudFRhcmdldCA9IHNjb3BlLmdldEFjdHVhbEVsZW1lbnQoZXZlbnQucGF0aFxuICAgICAgICAgICAgICAgID8gZXZlbnQucGF0aFswXVxuICAgICAgICAgICAgICAgIDogZXZlbnQudGFyZ2V0KSxcbiAgICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0ID0gc2NvcGUuZ2V0QWN0dWFsRWxlbWVudChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgaWYgKGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJiAvdG91Y2gvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLnByZXZUb3VjaFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1tpXTtcblxuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb25Gcm9tUG9pbnRlcihwb2ludGVyLCBldmVudC50eXBlLCBldmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWludGVyYWN0aW9uKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5fdXBkYXRlRXZlbnRUYXJnZXRzKGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvblttZXRob2RdKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ICYmIC9tb3VzZS8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBtb3VzZSBldmVudHMgd2hpbGUgdG91Y2ggaW50ZXJhY3Rpb25zIGFyZSBhY3RpdmVcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NvcGUuaW50ZXJhY3Rpb25zW2ldLm1vdXNlICYmIHNjb3BlLmludGVyYWN0aW9uc1tpXS5wb2ludGVySXNEb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gaWdub3JlIG1vdXNlIGV2ZW50cyB0aGF0IGFyZSBzaW11bGF0ZWQgYnkgdGhlIGJyb3dzZXJcbiAgICAgICAgICAgICAgICAvLyBhZnRlciBhIHRvdWNoIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc2NvcGUucHJldlRvdWNoVGltZSA8IDUwMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uRnJvbVBvaW50ZXIoZXZlbnQsIGV2ZW50LnR5cGUsIGV2ZW50VGFyZ2V0KTtcblxuICAgICAgICAgICAgaWYgKCFpbnRlcmFjdGlvbikgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uX3VwZGF0ZUV2ZW50VGFyZ2V0cyhldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICBpbnRlcmFjdGlvblttZXRob2RdKGV2ZW50LCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vLyBib3VuZCB0byB0aGUgaW50ZXJhY3RhYmxlIGNvbnRleHQgd2hlbiBhIERPTSBldmVudFxuLy8gbGlzdGVuZXIgaXMgYWRkZWQgdG8gYSBzZWxlY3RvciBpbnRlcmFjdGFibGVcbmZ1bmN0aW9uIGRlbGVnYXRlTGlzdGVuZXIgKGV2ZW50LCB1c2VDYXB0dXJlKSB7XG4gICAgdmFyIGZha2VFdmVudCA9IHt9LFxuICAgICAgICBkZWxlZ2F0ZWQgPSBkZWxlZ2F0ZWRFdmVudHNbZXZlbnQudHlwZV0sXG4gICAgICAgIGV2ZW50VGFyZ2V0ID0gc2NvcGUuZ2V0QWN0dWFsRWxlbWVudChldmVudC5wYXRoXG4gICAgICAgICAgICA/IGV2ZW50LnBhdGhbMF1cbiAgICAgICAgICAgIDogZXZlbnQudGFyZ2V0KSxcbiAgICAgICAgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgLy8gZHVwbGljYXRlIHRoZSBldmVudCBzbyB0aGF0IGN1cnJlbnRUYXJnZXQgY2FuIGJlIGNoYW5nZWRcbiAgICBmb3IgKHZhciBwcm9wIGluIGV2ZW50KSB7XG4gICAgICAgIGZha2VFdmVudFtwcm9wXSA9IGV2ZW50W3Byb3BdO1xuICAgIH1cblxuICAgIGZha2VFdmVudC5vcmlnaW5hbEV2ZW50ID0gZXZlbnQ7XG4gICAgZmFrZUV2ZW50LnByZXZlbnREZWZhdWx0ID0gcHJldmVudE9yaWdpbmFsRGVmYXVsdDtcblxuICAgIC8vIGNsaW1iIHVwIGRvY3VtZW50IHRyZWUgbG9va2luZyBmb3Igc2VsZWN0b3IgbWF0Y2hlc1xuICAgIHdoaWxlICh1dGlscy5pc0VsZW1lbnQoZWxlbWVudCkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzW2ldLFxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBkZWxlZ2F0ZWQuY29udGV4dHNbaV07XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUubm9kZUNvbnRhaW5zKGNvbnRleHQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm5vZGVDb250YWlucyhjb250ZXh0LCBlbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IGRlbGVnYXRlZC5saXN0ZW5lcnNbaV07XG5cbiAgICAgICAgICAgICAgICBmYWtlRXZlbnQuY3VycmVudFRhcmdldCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpc3RlbmVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2pdWzFdID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbal1bMF0oZmFrZUV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0SW50ZXJhY3Rpb25Gcm9tUG9pbnRlciAocG9pbnRlciwgZXZlbnRUeXBlLCBldmVudFRhcmdldCkge1xuICAgIHZhciBpID0gMCwgbGVuID0gc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aCxcbiAgICAgICAgbW91c2VFdmVudCA9ICgvbW91c2UvaS50ZXN0KHBvaW50ZXIucG9pbnRlclR5cGUgfHwgZXZlbnRUeXBlKVxuICAgICAgICAgICAgLy8gTVNQb2ludGVyRXZlbnQuTVNQT0lOVEVSX1RZUEVfTU9VU0VcbiAgICAgICAgfHwgcG9pbnRlci5wb2ludGVyVHlwZSA9PT0gNCksXG4gICAgICAgIGludGVyYWN0aW9uO1xuXG4gICAgdmFyIGlkID0gdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpO1xuXG4gICAgLy8gdHJ5IHRvIHJlc3VtZSBpbmVydGlhIHdpdGggYSBuZXcgcG9pbnRlclxuICAgIGlmICgvZG93bnxzdGFydC9pLnRlc3QoZXZlbnRUeXBlKSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5hY3RpdmUgJiYgaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnNbaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZV0uaW5lcnRpYS5hbGxvd1Jlc3VtZVxuICAgICAgICAgICAgICAgICYmIChpbnRlcmFjdGlvbi5tb3VzZSA9PT0gbW91c2VFdmVudCkpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyB0aGUgaW50ZXJhY3Rpb24gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gaW50ZXJhY3Rpb24uZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbnRlcmFjdGlvbidzIHBvaW50ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVyc1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoaW50ZXJhY3Rpb24ucG9pbnRlcnNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGlmIGl0J3MgYSBtb3VzZSBpbnRlcmFjdGlvblxuICAgIGlmIChtb3VzZUV2ZW50IHx8ICEoYnJvd3Nlci5zdXBwb3J0c1RvdWNoIHx8IGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQpKSB7XG5cbiAgICAgICAgLy8gZmluZCBhIG1vdXNlIGludGVyYWN0aW9uIHRoYXQncyBub3QgaW4gaW5lcnRpYSBwaGFzZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pbnRlcmFjdGlvbnNbaV0ubW91c2UgJiYgIXNjb3BlLmludGVyYWN0aW9uc1tpXS5pbmVydGlhU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGlvbnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmaW5kIGFueSBpbnRlcmFjdGlvbiBzcGVjaWZpY2FsbHkgZm9yIG1vdXNlLlxuICAgICAgICAvLyBpZiB0aGUgZXZlbnRUeXBlIGlzIGEgbW91c2Vkb3duLCBhbmQgaW5lcnRpYSBpcyBhY3RpdmVcbiAgICAgICAgLy8gaWdub3JlIHRoZSBpbnRlcmFjdGlvblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pbnRlcmFjdGlvbnNbaV0ubW91c2UgJiYgISgvZG93bi8udGVzdChldmVudFR5cGUpICYmIHNjb3BlLmludGVyYWN0aW9uc1tpXS5pbmVydGlhU3RhdHVzLmFjdGl2ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgaW50ZXJhY3Rpb24gZm9yIG1vdXNlXG4gICAgICAgIGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKCk7XG4gICAgICAgIGludGVyYWN0aW9uLm1vdXNlID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb247XG4gICAgfVxuXG4gICAgLy8gZ2V0IGludGVyYWN0aW9uIHRoYXQgaGFzIHRoaXMgcG9pbnRlclxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJJZHMsIGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGF0IHRoaXMgc3RhZ2UsIGEgcG9pbnRlclVwIHNob3VsZCBub3QgcmV0dXJuIGFuIGludGVyYWN0aW9uXG4gICAgaWYgKC91cHxlbmR8b3V0L2kudGVzdChldmVudFR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIGdldCBmaXJzdCBpZGxlIGludGVyYWN0aW9uXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldO1xuXG4gICAgICAgIGlmICgoIWludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgfHwgKGludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zLmdlc3R1cmUuZW5hYmxlZCkpXG4gICAgICAgICAgICAmJiAhaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgJiYgISghbW91c2VFdmVudCAmJiBpbnRlcmFjdGlvbi5tb3VzZSkpIHtcblxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJbnRlcmFjdGlvbigpO1xufVxuXG5mdW5jdGlvbiBwcmV2ZW50T3JpZ2luYWxEZWZhdWx0ICgpIHtcbiAgICB0aGlzLm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbn1cblxuZnVuY3Rpb24gZGVsZWdhdGVVc2VDYXB0dXJlIChldmVudCkge1xuICAgIHJldHVybiBkZWxlZ2F0ZUxpc3RlbmVyLmNhbGwodGhpcywgZXZlbnQsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBiaW5kSW50ZXJhY3Rpb25MaXN0ZW5lcnMoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGludGVyYWN0aW9uTGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lck5hbWUgPSBpbnRlcmFjdGlvbkxpc3RlbmVyc1tpXTtcblxuICAgICAgICBsaXN0ZW5lcnNbbGlzdGVuZXJOYW1lXSA9IGRvT25JbnRlcmFjdGlvbnMobGlzdGVuZXJOYW1lKTtcbiAgICB9XG59XG5cbnZhciBsaXN0ZW5lciA9IHtcbiAgICBsaXN0ZW5Ub0RvY3VtZW50OiBsaXN0ZW5Ub0RvY3VtZW50LFxuICAgIGJpbmRJbnRlcmFjdGlvbkxpc3RlbmVyczogYmluZEludGVyYWN0aW9uTGlzdGVuZXJzLFxuICAgIGxpc3RlbmVyczogbGlzdGVuZXJzLFxuICAgIGRlbGVnYXRlZEV2ZW50czogZGVsZWdhdGVkRXZlbnRzXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3RlbmVyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNjb3BlID0ge30sXG4gICAgZXh0ZW5kID0gcmVxdWlyZSgnLi91dGlscy9leHRlbmQnKTtcblxuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL3dpbmRvdycpKTtcbmV4dGVuZChzY29wZSwgcmVxdWlyZSgnLi91dGlscy9kb21PYmplY3RzJykpO1xuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL2Fyci5qcycpKTtcbmV4dGVuZChzY29wZSwgcmVxdWlyZSgnLi91dGlscy9pc1R5cGUnKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2NvcGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGluZGV4T2YgKGFycmF5LCB0YXJnZXQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKGFycmF5W2ldID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBjb250YWlucyAoYXJyYXksIHRhcmdldCkge1xuICAgIHJldHVybiBpbmRleE9mKGFycmF5LCB0YXJnZXQpICE9PSAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5kZXhPZjogaW5kZXhPZixcbiAgICBjb250YWluczogY29udGFpbnNcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB3aW4gPSByZXF1aXJlKCcuL3dpbmRvdycpLFxuICAgIGRvbU9iamVjdHMgPSByZXF1aXJlKCcuL2RvbU9iamVjdHMnKTtcblxudmFyIGJyb3dzZXIgPSB7XG4gICAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IHRvdWNoIGlucHV0P1xuICAgIHN1cHBvcnRzVG91Y2ggOiAhISgoJ29udG91Y2hzdGFydCcgaW4gd2luKSB8fCB3aW4ud2luZG93LkRvY3VtZW50VG91Y2hcbiAgICAgICAgJiYgZG9tT2JqZWN0cy5kb2N1bWVudCBpbnN0YW5jZW9mIHdpbi5Eb2N1bWVudFRvdWNoKSxcblxuICAgIC8vIERvZXMgdGhlIGJyb3dzZXIgc3VwcG9ydCBQb2ludGVyRXZlbnRzXG4gICAgc3VwcG9ydHNQb2ludGVyRXZlbnQgOiAhIWRvbU9iamVjdHMuUG9pbnRlckV2ZW50LFxuXG4gICAgLy8gT3BlcmEgTW9iaWxlIG11c3QgYmUgaGFuZGxlZCBkaWZmZXJlbnRseVxuICAgIGlzT3BlcmFNb2JpbGUgOiAobmF2aWdhdG9yLmFwcE5hbWUgPT09ICdPcGVyYSdcbiAgICAgICAgJiYgYnJvd3Nlci5zdXBwb3J0c1RvdWNoXG4gICAgICAgICYmIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goJ1ByZXN0bycpKSxcblxuICAgIC8vIHNjcm9sbGluZyBkb2Vzbid0IGNoYW5nZSB0aGUgcmVzdWx0IG9mXG4gICAgLy8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0L2dldENsaWVudFJlY3RzIG9uIGlPUyA8PTcgYnV0IGl0IGRvZXMgb24gaU9TIDhcbiAgICBpc0lPUzdvckxvd2VyIDogKC9pUChob25lfG9kfGFkKS8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pICYmIC9PUyBbMS03XVteXFxkXS8udGVzdChuYXZpZ2F0b3IuYXBwVmVyc2lvbikpLFxuXG4gICAgaXNJZTlPck9sZGVyIDogZG9tT2JqZWN0cy5kb2N1bWVudC5hbGwgJiYgIXdpbi53aW5kb3cuYXRvYixcblxuICAgIC8vIHByZWZpeCBtYXRjaGVzU2VsZWN0b3JcbiAgICBwcmVmaXhlZE1hdGNoZXNTZWxlY3RvcjogJ21hdGNoZXMnIGluIEVsZW1lbnQucHJvdG90eXBlP1xuICAgICAgICAgICAgJ21hdGNoZXMnOiAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJzogJ21vek1hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAgICAgICAgICdtb3pNYXRjaGVzU2VsZWN0b3InOiAnb01hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAgICAgICAgICAgICAnb01hdGNoZXNTZWxlY3Rvcic6ICdtc01hdGNoZXNTZWxlY3RvcidcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBicm93c2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9tT2JqZWN0cyA9IHt9LFxuICAgIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93Jykud2luZG93LFxuICAgIGJsYW5rID0gZnVuY3Rpb24gKCkge307XG5cbmRvbU9iamVjdHMuZG9jdW1lbnQgICAgICAgICAgID0gd2luLmRvY3VtZW50O1xuZG9tT2JqZWN0cy5Eb2N1bWVudEZyYWdtZW50ICAgPSB3aW4uRG9jdW1lbnRGcmFnbWVudCAgIHx8IGJsYW5rO1xuZG9tT2JqZWN0cy5TVkdFbGVtZW50ICAgICAgICAgPSB3aW4uU1ZHRWxlbWVudCAgICAgICAgIHx8IGJsYW5rO1xuZG9tT2JqZWN0cy5TVkdTVkdFbGVtZW50ICAgICAgPSB3aW4uU1ZHU1ZHRWxlbWVudCAgICAgIHx8IGJsYW5rO1xuZG9tT2JqZWN0cy5TVkdFbGVtZW50SW5zdGFuY2UgPSB3aW4uU1ZHRWxlbWVudEluc3RhbmNlIHx8IGJsYW5rO1xuZG9tT2JqZWN0cy5IVE1MRWxlbWVudCAgICAgICAgPSB3aW4uSFRNTEVsZW1lbnQgICAgICAgIHx8IHdpbi5FbGVtZW50O1xuXG5kb21PYmplY3RzLlBvaW50ZXJFdmVudCA9ICh3aW4uUG9pbnRlckV2ZW50IHx8IHdpbi5NU1BvaW50ZXJFdmVudCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZG9tT2JqZWN0cztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFyciA9IHJlcXVpcmUoJy4vYXJyJyksXG4gICAgaW5kZXhPZiAgPSBhcnIuaW5kZXhPZixcbiAgICBjb250YWlucyA9IGFyci5jb250YWlucyxcbiAgICBnZXRXaW5kb3cgPSByZXF1aXJlKCcuL3dpbmRvdycpLmdldFdpbmRvdyxcblxuICAgIHVzZUF0dGFjaEV2ZW50ID0gKCdhdHRhY2hFdmVudCcgaW4gd2luZG93KSAmJiAhKCdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cpLFxuICAgIGFkZEV2ZW50ICAgICAgID0gdXNlQXR0YWNoRXZlbnQ/ICAnYXR0YWNoRXZlbnQnOiAnYWRkRXZlbnRMaXN0ZW5lcicsXG4gICAgcmVtb3ZlRXZlbnQgICAgPSB1c2VBdHRhY2hFdmVudD8gICdkZXRhY2hFdmVudCc6ICdyZW1vdmVFdmVudExpc3RlbmVyJyxcbiAgICBvbiAgICAgICAgICAgICA9IHVzZUF0dGFjaEV2ZW50PyAnb24nOiAnJyxcblxuICAgIGVsZW1lbnRzICAgICAgICAgID0gW10sXG4gICAgdGFyZ2V0cyAgICAgICAgICAgPSBbXSxcbiAgICBhdHRhY2hlZExpc3RlbmVycyA9IFtdO1xuXG5mdW5jdGlvbiBhZGQgKGVsZW1lbnQsIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgdmFyIGVsZW1lbnRJbmRleCA9IGluZGV4T2YoZWxlbWVudHMsIGVsZW1lbnQpLFxuICAgICAgICB0YXJnZXQgPSB0YXJnZXRzW2VsZW1lbnRJbmRleF07XG5cbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICB0YXJnZXQgPSB7XG4gICAgICAgICAgICBldmVudHM6IHt9LFxuICAgICAgICAgICAgdHlwZUNvdW50OiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgZWxlbWVudEluZGV4ID0gZWxlbWVudHMucHVzaChlbGVtZW50KSAtIDE7XG4gICAgICAgIHRhcmdldHMucHVzaCh0YXJnZXQpO1xuXG4gICAgICAgIGF0dGFjaGVkTGlzdGVuZXJzLnB1c2goKHVzZUF0dGFjaEV2ZW50ID8ge1xuICAgICAgICAgICAgICAgIHN1cHBsaWVkOiBbXSxcbiAgICAgICAgICAgICAgICB3cmFwcGVkIDogW10sXG4gICAgICAgICAgICAgICAgdXNlQ291bnQ6IFtdXG4gICAgICAgICAgICB9IDogbnVsbCkpO1xuICAgIH1cblxuICAgIGlmICghdGFyZ2V0LmV2ZW50c1t0eXBlXSkge1xuICAgICAgICB0YXJnZXQuZXZlbnRzW3R5cGVdID0gW107XG4gICAgICAgIHRhcmdldC50eXBlQ291bnQrKztcbiAgICB9XG5cbiAgICBpZiAoIWNvbnRhaW5zKHRhcmdldC5ldmVudHNbdHlwZV0sIGxpc3RlbmVyKSkge1xuICAgICAgICB2YXIgcmV0O1xuXG4gICAgICAgIGlmICh1c2VBdHRhY2hFdmVudCkge1xuICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IGF0dGFjaGVkTGlzdGVuZXJzW2VsZW1lbnRJbmRleF0sXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJJbmRleCA9IGluZGV4T2YobGlzdGVuZXJzLnN1cHBsaWVkLCBsaXN0ZW5lcik7XG5cbiAgICAgICAgICAgIHZhciB3cmFwcGVkID0gbGlzdGVuZXJzLndyYXBwZWRbbGlzdGVuZXJJbmRleF0gfHwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFldmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0ID0gZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQgPSBldmVudC5wcmV2ZW50RGVmYXVsdCB8fCBwcmV2ZW50RGVmO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24gPSBldmVudC5zdG9wUHJvcGFnYXRpb24gfHwgc3RvcFByb3A7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiA9IGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiB8fCBzdG9wSW1tUHJvcDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoL21vdXNlfGNsaWNrLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCA9IGV2ZW50LmNsaWVudFggKyBnZXRXaW5kb3coZWxlbWVudCkuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSA9IGV2ZW50LmNsaWVudFkgKyBnZXRXaW5kb3coZWxlbWVudCkuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXQgPSBlbGVtZW50W2FkZEV2ZW50XShvbiArIHR5cGUsIHdyYXBwZWQsICEhdXNlQ2FwdHVyZSk7XG5cbiAgICAgICAgICAgIGlmIChsaXN0ZW5lckluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zdXBwbGllZC5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMud3JhcHBlZC5wdXNoKHdyYXBwZWQpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy51c2VDb3VudC5wdXNoKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnVzZUNvdW50W2xpc3RlbmVySW5kZXhdKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXQgPSBlbGVtZW50W2FkZEV2ZW50XSh0eXBlLCBsaXN0ZW5lciwgISF1c2VDYXB0dXJlKTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQuZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmUgKGVsZW1lbnQsIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgdmFyIGksXG4gICAgICAgIGVsZW1lbnRJbmRleCA9IGluZGV4T2YoZWxlbWVudHMsIGVsZW1lbnQpLFxuICAgICAgICB0YXJnZXQgPSB0YXJnZXRzW2VsZW1lbnRJbmRleF0sXG4gICAgICAgIGxpc3RlbmVycyxcbiAgICAgICAgbGlzdGVuZXJJbmRleCxcbiAgICAgICAgd3JhcHBlZCA9IGxpc3RlbmVyO1xuXG4gICAgaWYgKCF0YXJnZXQgfHwgIXRhcmdldC5ldmVudHMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh1c2VBdHRhY2hFdmVudCkge1xuICAgICAgICBsaXN0ZW5lcnMgPSBhdHRhY2hlZExpc3RlbmVyc1tlbGVtZW50SW5kZXhdO1xuICAgICAgICBsaXN0ZW5lckluZGV4ID0gaW5kZXhPZihsaXN0ZW5lcnMuc3VwcGxpZWQsIGxpc3RlbmVyKTtcbiAgICAgICAgd3JhcHBlZCA9IGxpc3RlbmVycy53cmFwcGVkW2xpc3RlbmVySW5kZXhdO1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSAnYWxsJykge1xuICAgICAgICBmb3IgKHR5cGUgaW4gdGFyZ2V0LmV2ZW50cykge1xuICAgICAgICAgICAgaWYgKHRhcmdldC5ldmVudHMuaGFzT3duUHJvcGVydHkodHlwZSkpIHtcbiAgICAgICAgICAgICAgICByZW1vdmUoZWxlbWVudCwgdHlwZSwgJ2FsbCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0LmV2ZW50c1t0eXBlXSkge1xuICAgICAgICB2YXIgbGVuID0gdGFyZ2V0LmV2ZW50c1t0eXBlXS5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxpc3RlbmVyID09PSAnYWxsJykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlKGVsZW1lbnQsIHR5cGUsIHRhcmdldC5ldmVudHNbdHlwZV1baV0sICEhdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmV2ZW50c1t0eXBlXVtpXSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudFtyZW1vdmVFdmVudF0ob24gKyB0eXBlLCB3cmFwcGVkLCAhIXVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuZXZlbnRzW3R5cGVdLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlQXR0YWNoRXZlbnQgJiYgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0tLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3VwcGxpZWQuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy53cmFwcGVkLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnQuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRhcmdldC5ldmVudHNbdHlwZV0gJiYgdGFyZ2V0LmV2ZW50c1t0eXBlXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0gPSBudWxsO1xuICAgICAgICAgICAgdGFyZ2V0LnR5cGVDb3VudC0tO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXQudHlwZUNvdW50KSB7XG4gICAgICAgIHRhcmdldHMuc3BsaWNlKGVsZW1lbnRJbmRleCwgMSk7XG4gICAgICAgIGVsZW1lbnRzLnNwbGljZShlbGVtZW50SW5kZXgsIDEpO1xuICAgICAgICBhdHRhY2hlZExpc3RlbmVycy5zcGxpY2UoZWxlbWVudEluZGV4LCAxKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHByZXZlbnREZWYgKCkge1xuICAgIHRoaXMucmV0dXJuVmFsdWUgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc3RvcFByb3AgKCkge1xuICAgIHRoaXMuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc3RvcEltbVByb3AgKCkge1xuICAgIHRoaXMuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICB0aGlzLmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlLFxuICAgIHVzZUF0dGFjaEV2ZW50OiB1c2VBdHRhY2hFdmVudCxcblxuICAgIF9lbGVtZW50czogZWxlbWVudHMsXG4gICAgX3RhcmdldHM6IHRhcmdldHMsXG4gICAgX2F0dGFjaGVkTGlzdGVuZXJzOiBhdHRhY2hlZExpc3RlbmVyc1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQgKGRlc3QsIHNvdXJjZSkge1xuICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGRlc3RbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBoeXBvdCAoeCwgeSkgeyByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpOyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSBtb2R1bGUuZXhwb3J0cyxcbiAgICBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpLFxuICAgIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93Jyk7XG5cbnV0aWxzLmJsYW5rICA9IGZ1bmN0aW9uICgpIHt9O1xuXG51dGlscy53YXJuT25jZSA9IGZ1bmN0aW9uIChtZXRob2QsIG1lc3NhZ2UpIHtcbiAgICB2YXIgd2FybmVkID0gZmFsc2U7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgICAgICAgd2luLndpbmRvdy5jb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICAgICAgICB3YXJuZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG59O1xuXG51dGlscy5leHRlbmQgID0gZXh0ZW5kO1xudXRpbHMuaHlwb3QgICA9IHJlcXVpcmUoJy4vaHlwb3QnKTtcbnV0aWxzLnJhZiAgICAgPSByZXF1aXJlKCcuL3JhZicpO1xudXRpbHMuYnJvd3NlciA9IHJlcXVpcmUoJy4vYnJvd3NlcicpO1xuXG5leHRlbmQodXRpbHMsIHJlcXVpcmUoJy4vYXJyJykpO1xuZXh0ZW5kKHV0aWxzLCByZXF1aXJlKCcuL2lzVHlwZScpKTtcbmV4dGVuZCh1dGlscywgcmVxdWlyZSgnLi9wb2ludGVyVXRpbHMnKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB3aW4gPSByZXF1aXJlKCcuL3dpbmRvdycpLFxuICAgIGRvbU9iamVjdHMgPSByZXF1aXJlKCcuL2RvbU9iamVjdHMnKTtcblxudmFyIGlzVHlwZSA9IHtcbiAgICBpc0VsZW1lbnQgOiBmdW5jdGlvbiAobykge1xuICAgICAgICBpZiAoIW8gfHwgKHR5cGVvZiBvICE9PSAnb2JqZWN0JykpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgXG4gICAgICAgIHZhciBfd2luZG93ID0gd2luLmdldFdpbmRvdyhvKSB8fCB3aW4ud2luZG93O1xuICAgIFxuICAgICAgICByZXR1cm4gKC9vYmplY3R8ZnVuY3Rpb24vLnRlc3QodHlwZW9mIF93aW5kb3cuRWxlbWVudClcbiAgICAgICAgICAgID8gbyBpbnN0YW5jZW9mIF93aW5kb3cuRWxlbWVudCAvL0RPTTJcbiAgICAgICAgICAgIDogby5ub2RlVHlwZSA9PT0gMSAmJiB0eXBlb2Ygby5ub2RlTmFtZSA9PT0gXCJzdHJpbmdcIik7XG4gICAgfSxcblxuICAgIGlzQXJyYXkgICAgOiBudWxsLFxuICAgIFxuICAgIGlzV2luZG93ICAgOiByZXF1aXJlKCcuL2lzV2luZG93JyksXG5cbiAgICBpc0RvY0ZyYWcgIDogZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiAhIXRoaW5nICYmIHRoaW5nIGluc3RhbmNlb2YgZG9tT2JqZWN0cy5Eb2N1bWVudEZyYWdtZW50OyB9LFxuXG4gICAgaXNPYmplY3QgICA6IGZ1bmN0aW9uICh0aGluZykgeyByZXR1cm4gISF0aGluZyAmJiAodHlwZW9mIHRoaW5nID09PSAnb2JqZWN0Jyk7IH0sXG5cbiAgICBpc0Z1bmN0aW9uIDogZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbic7IH0sXG5cbiAgICBpc051bWJlciAgIDogZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdudW1iZXInICA7IH0sXG5cbiAgICBpc0Jvb2wgICAgIDogZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdib29sZWFuJyA7IH0sXG5cbiAgICBpc1N0cmluZyAgIDogZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdzdHJpbmcnICA7IH1cbiAgICBcbn07XG5cbmlzVHlwZS5pc0FycmF5ID0gZnVuY3Rpb24gKHRoaW5nKSB7XG4gICAgcmV0dXJuIGlzVHlwZS5pc09iamVjdCh0aGluZylcbiAgICAgICAgJiYgKHR5cGVvZiB0aGluZy5sZW5ndGggIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAmJiBpc1R5cGUuaXNGdW5jdGlvbih0aGluZy5zcGxpY2UpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc1R5cGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNXaW5kb3cgKHRoaW5nKSB7XG4gICAgcmV0dXJuICEhKHRoaW5nICYmIHRoaW5nLldpbmRvdykgJiYgKHRoaW5nIGluc3RhbmNlb2YgdGhpbmcuV2luZG93KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBwb2ludGVyVXRpbHMgPSB7fSxcbiAgICAvLyByZWR1Y2Ugb2JqZWN0IGNyZWF0aW9uIGluIGdldFhZKClcbiAgICB0bXBYWSA9IHt9LFxuICAgIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93JyksXG4gICAgaHlwb3QgPSByZXF1aXJlKCcuL2h5cG90JyksXG4gICAgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKSxcbiAgICBicm93c2VyID0gcmVxdWlyZSgnLi9icm93c2VyJyksXG4gICAgaXNUeXBlID0gcmVxdWlyZSgnLi9pc1R5cGUnKSxcbiAgICBJbnRlcmFjdEV2ZW50ID0gcmVxdWlyZSgnLi4vSW50ZXJhY3RFdmVudCcpO1xuXG5wb2ludGVyVXRpbHMuY29weUNvb3JkcyA9IGZ1bmN0aW9uIChkZXN0LCBzcmMpIHtcbiAgICBkZXN0LnBhZ2UgPSBkZXN0LnBhZ2UgfHwge307XG4gICAgZGVzdC5wYWdlLnggPSBzcmMucGFnZS54O1xuICAgIGRlc3QucGFnZS55ID0gc3JjLnBhZ2UueTtcblxuICAgIGRlc3QuY2xpZW50ID0gZGVzdC5jbGllbnQgfHwge307XG4gICAgZGVzdC5jbGllbnQueCA9IHNyYy5jbGllbnQueDtcbiAgICBkZXN0LmNsaWVudC55ID0gc3JjLmNsaWVudC55O1xuXG4gICAgZGVzdC50aW1lU3RhbXAgPSBzcmMudGltZVN0YW1wO1xufTtcblxucG9pbnRlclV0aWxzLnNldEV2ZW50WFkgPSBmdW5jdGlvbiAodGFyZ2V0T2JqLCBwb2ludGVyLCBpbnRlcmFjdGlvbikge1xuICAgIGlmICghcG9pbnRlcikge1xuICAgICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcklkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlclV0aWxzLnRvdWNoQXZlcmFnZShpbnRlcmFjdGlvbi5wb2ludGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwb2ludGVyID0gaW50ZXJhY3Rpb24ucG9pbnRlcnNbMF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwb2ludGVyVXRpbHMuZ2V0UGFnZVhZKHBvaW50ZXIsIHRtcFhZLCBpbnRlcmFjdGlvbik7XG4gICAgdGFyZ2V0T2JqLnBhZ2UueCA9IHRtcFhZLng7XG4gICAgdGFyZ2V0T2JqLnBhZ2UueSA9IHRtcFhZLnk7XG5cbiAgICBwb2ludGVyVXRpbHMuZ2V0Q2xpZW50WFkocG9pbnRlciwgdG1wWFksIGludGVyYWN0aW9uKTtcbiAgICB0YXJnZXRPYmouY2xpZW50LnggPSB0bXBYWS54O1xuICAgIHRhcmdldE9iai5jbGllbnQueSA9IHRtcFhZLnk7XG5cbiAgICB0YXJnZXRPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuXG5wb2ludGVyVXRpbHMuc2V0RXZlbnREZWx0YXMgPSBmdW5jdGlvbiAodGFyZ2V0T2JqLCBwcmV2LCBjdXIpIHtcbiAgICB0YXJnZXRPYmoucGFnZS54ICAgICA9IGN1ci5wYWdlLnggICAgICAtIHByZXYucGFnZS54O1xuICAgIHRhcmdldE9iai5wYWdlLnkgICAgID0gY3VyLnBhZ2UueSAgICAgIC0gcHJldi5wYWdlLnk7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC54ICAgPSBjdXIuY2xpZW50LnggICAgLSBwcmV2LmNsaWVudC54O1xuICAgIHRhcmdldE9iai5jbGllbnQueSAgID0gY3VyLmNsaWVudC55ICAgIC0gcHJldi5jbGllbnQueTtcbiAgICB0YXJnZXRPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBwcmV2LnRpbWVTdGFtcDtcblxuICAgIC8vIHNldCBwb2ludGVyIHZlbG9jaXR5XG4gICAgdmFyIGR0ID0gTWF0aC5tYXgodGFyZ2V0T2JqLnRpbWVTdGFtcCAvIDEwMDAsIDAuMDAxKTtcbiAgICB0YXJnZXRPYmoucGFnZS5zcGVlZCAgID0gaHlwb3QodGFyZ2V0T2JqLnBhZ2UueCwgdGFyZ2V0T2JqLnBhZ2UueSkgLyBkdDtcbiAgICB0YXJnZXRPYmoucGFnZS52eCAgICAgID0gdGFyZ2V0T2JqLnBhZ2UueCAvIGR0O1xuICAgIHRhcmdldE9iai5wYWdlLnZ5ICAgICAgPSB0YXJnZXRPYmoucGFnZS55IC8gZHQ7XG5cbiAgICB0YXJnZXRPYmouY2xpZW50LnNwZWVkID0gaHlwb3QodGFyZ2V0T2JqLmNsaWVudC54LCB0YXJnZXRPYmoucGFnZS55KSAvIGR0O1xuICAgIHRhcmdldE9iai5jbGllbnQudnggICAgPSB0YXJnZXRPYmouY2xpZW50LnggLyBkdDtcbiAgICB0YXJnZXRPYmouY2xpZW50LnZ5ICAgID0gdGFyZ2V0T2JqLmNsaWVudC55IC8gZHQ7XG59O1xuXG4vLyBHZXQgc3BlY2lmaWVkIFgvWSBjb29yZHMgZm9yIG1vdXNlIG9yIGV2ZW50LnRvdWNoZXNbMF1cbnBvaW50ZXJVdGlscy5nZXRYWSA9IGZ1bmN0aW9uICh0eXBlLCBwb2ludGVyLCB4eSkge1xuICAgIHh5ID0geHkgfHwge307XG4gICAgdHlwZSA9IHR5cGUgfHwgJ3BhZ2UnO1xuXG4gICAgeHkueCA9IHBvaW50ZXJbdHlwZSArICdYJ107XG4gICAgeHkueSA9IHBvaW50ZXJbdHlwZSArICdZJ107XG5cbiAgICByZXR1cm4geHk7XG59O1xuXG5wb2ludGVyVXRpbHMuZ2V0UGFnZVhZID0gZnVuY3Rpb24gKHBvaW50ZXIsIHBhZ2UsIGludGVyYWN0aW9uKSB7XG4gICAgcGFnZSA9IHBhZ2UgfHwge307XG5cbiAgICBpZiAocG9pbnRlciBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgaWYgKC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkge1xuICAgICAgICAgICAgaW50ZXJhY3Rpb24gPSBpbnRlcmFjdGlvbiB8fCBwb2ludGVyLmludGVyYWN0aW9uO1xuXG4gICAgICAgICAgICBleHRlbmQocGFnZSwgaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy51cENvb3Jkcy5wYWdlKTtcblxuICAgICAgICAgICAgcGFnZS54ICs9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuc3g7XG4gICAgICAgICAgICBwYWdlLnkgKz0gaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5zeTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhZ2UueCA9IHBvaW50ZXIucGFnZVg7XG4gICAgICAgICAgICBwYWdlLnkgPSBwb2ludGVyLnBhZ2VZO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIE9wZXJhIE1vYmlsZSBoYW5kbGVzIHRoZSB2aWV3cG9ydCBhbmQgc2Nyb2xsaW5nIG9kZGx5XG4gICAgZWxzZSBpZiAoYnJvd3Nlci5pc09wZXJhTW9iaWxlKSB7XG4gICAgICAgIHBvaW50ZXJVdGlscy5nZXRYWSgnc2NyZWVuJywgcG9pbnRlciwgcGFnZSk7XG5cbiAgICAgICAgcGFnZS54ICs9IHdpbi53aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgcGFnZS55ICs9IHdpbi53aW5kb3cuc2Nyb2xsWTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHBvaW50ZXJVdGlscy5nZXRYWSgncGFnZScsIHBvaW50ZXIsIHBhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiBwYWdlO1xufTtcblxucG9pbnRlclV0aWxzLmdldENsaWVudFhZID0gZnVuY3Rpb24gKHBvaW50ZXIsIGNsaWVudCwgaW50ZXJhY3Rpb24pIHtcbiAgICBjbGllbnQgPSBjbGllbnQgfHwge307XG5cbiAgICBpZiAocG9pbnRlciBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgaWYgKC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkge1xuICAgICAgICAgICAgZXh0ZW5kKGNsaWVudCwgaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy51cENvb3Jkcy5jbGllbnQpO1xuXG4gICAgICAgICAgICBjbGllbnQueCArPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnN4O1xuICAgICAgICAgICAgY2xpZW50LnkgKz0gaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5zeTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNsaWVudC54ID0gcG9pbnRlci5jbGllbnRYO1xuICAgICAgICAgICAgY2xpZW50LnkgPSBwb2ludGVyLmNsaWVudFk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIE9wZXJhIE1vYmlsZSBoYW5kbGVzIHRoZSB2aWV3cG9ydCBhbmQgc2Nyb2xsaW5nIG9kZGx5XG4gICAgICAgIHBvaW50ZXJVdGlscy5nZXRYWShicm93c2VyLmlzT3BlcmFNb2JpbGU/ICdzY3JlZW4nOiAnY2xpZW50JywgcG9pbnRlciwgY2xpZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xpZW50O1xufTtcblxucG9pbnRlclV0aWxzLmdldFBvaW50ZXJJZCA9IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgcmV0dXJuIGlzVHlwZS5pc051bWJlcihwb2ludGVyLnBvaW50ZXJJZCk/IHBvaW50ZXIucG9pbnRlcklkIDogcG9pbnRlci5pZGVudGlmaWVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwb2ludGVyVXRpbHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBsYXN0VGltZSA9IDAsXG4gICAgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ10sXG4gICAgcmVxRnJhbWUsXG4gICAgY2FuY2VsRnJhbWU7XG5cbmZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG4gICAgcmVxRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgY2FuY2VsRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXSB8fCB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG59XG5cbmlmICghcmVxRnJhbWUpIHtcbiAgICByZXFGcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKSxcbiAgICAgICAgICAgIGlkID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSxcbiAgICAgICAgICB0aW1lVG9DYWxsKTtcbiAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9O1xufVxuXG5pZiAoIWNhbmNlbEZyYW1lKSB7XG4gICAgY2FuY2VsRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaWQpO1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlcXVlc3Q6IHJlcUZyYW1lLFxuICAgIGNhbmNlbDogY2FuY2VsRnJhbWVcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc1dpbmRvdyA9IHJlcXVpcmUoJy4vaXNXaW5kb3cnKTtcblxudmFyIGlzU2hhZG93RG9tID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gY3JlYXRlIGEgVGV4dE5vZGVcbiAgICB2YXIgZWwgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuXG4gICAgLy8gY2hlY2sgaWYgaXQncyB3cmFwcGVkIGJ5IGEgcG9seWZpbGxcbiAgICByZXR1cm4gZWwub3duZXJEb2N1bWVudCAhPT0gd2luZG93LmRvY3VtZW50XG4gICAgICAgICYmIHR5cGVvZiB3aW5kb3cud3JhcCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAmJiB3aW5kb3cud3JhcChlbCkgPT09IGVsO1xufTtcblxudmFyIHdpbiA9IHtcblxuICAgIHdpbmRvdzogdW5kZWZpbmVkLFxuXG4gICAgcmVhbFdpbmRvdzogd2luZG93LFxuXG4gICAgZ2V0V2luZG93OiBmdW5jdGlvbiBnZXRXaW5kb3cgKG5vZGUpIHtcbiAgICAgICAgaWYgKGlzV2luZG93KG5vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290Tm9kZSA9IChub2RlLm93bmVyRG9jdW1lbnQgfHwgbm9kZSk7XG5cbiAgICAgICAgcmV0dXJuIHJvb3ROb2RlLmRlZmF1bHRWaWV3IHx8IHJvb3ROb2RlLnBhcmVudFdpbmRvdyB8fCB3aW4ud2luZG93O1xuICAgIH1cbn07XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChpc1NoYWRvd0RvbSgpKSB7XG4gICAgICAgIHdpbi53aW5kb3cgPSB3aW5kb3cud3JhcCh3aW5kb3cpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbi53aW5kb3cgPSB3aW5kb3c7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdpbjtcbiJdfQ==
