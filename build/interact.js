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

    createSnapGrid : function (grid) {
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

},{"./InteractEvent":1,"./Interactable":2,"./Interaction":3,"./autoScroll":4,"./defaultActionChecker":5,"./defaultOptions":6,"./listener":8,"./scope":9,"./utils":16,"./utils/events":13,"./utils/window":21}],8:[function(require,module,exports){
'use strict';

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvSW50ZXJhY3RFdmVudC5qcyIsInNyYy9JbnRlcmFjdGFibGUuanMiLCJzcmMvSW50ZXJhY3Rpb24uanMiLCJzcmMvYXV0b1Njcm9sbC5qcyIsInNyYy9kZWZhdWx0QWN0aW9uQ2hlY2tlci5qcyIsInNyYy9kZWZhdWx0T3B0aW9ucy5qcyIsInNyYy9pbnRlcmFjdC5qcyIsInNyYy9saXN0ZW5lci5qcyIsInNyYy9zY29wZS5qcyIsInNyYy91dGlscy9hcnIuanMiLCJzcmMvdXRpbHMvYnJvd3Nlci5qcyIsInNyYy91dGlscy9kb21PYmplY3RzLmpzIiwic3JjL3V0aWxzL2V2ZW50cy5qcyIsInNyYy91dGlscy9leHRlbmQuanMiLCJzcmMvdXRpbHMvaHlwb3QuanMiLCJzcmMvdXRpbHMvaW5kZXguanMiLCJzcmMvdXRpbHMvaXNUeXBlLmpzIiwic3JjL3V0aWxzL2lzV2luZG93LmpzIiwic3JjL3V0aWxzL3BvaW50ZXJVdGlscy5qcyIsInNyYy91dGlscy9yYWYuanMiLCJzcmMvdXRpbHMvd2luZG93LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdjhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2NvcGUgPSByZXF1aXJlKCcuL3Njb3BlJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbmZ1bmN0aW9uIEludGVyYWN0RXZlbnQgKGludGVyYWN0aW9uLCBldmVudCwgYWN0aW9uLCBwaGFzZSwgZWxlbWVudCwgcmVsYXRlZCkge1xuICAgIHZhciBjbGllbnQsXG4gICAgICAgIHBhZ2UsXG4gICAgICAgIHRhcmdldCAgICAgID0gaW50ZXJhY3Rpb24udGFyZ2V0LFxuICAgICAgICBzbmFwU3RhdHVzICA9IGludGVyYWN0aW9uLnNuYXBTdGF0dXMsXG4gICAgICAgIHJlc3RyaWN0U3RhdHVzICA9IGludGVyYWN0aW9uLnJlc3RyaWN0U3RhdHVzLFxuICAgICAgICBwb2ludGVycyAgICA9IGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgICBkZWx0YVNvdXJjZSA9ICh0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMgfHwgc2NvcGUuZGVmYXVsdE9wdGlvbnMpLmRlbHRhU291cmNlLFxuICAgICAgICBzb3VyY2VYICAgICA9IGRlbHRhU291cmNlICsgJ1gnLFxuICAgICAgICBzb3VyY2VZICAgICA9IGRlbHRhU291cmNlICsgJ1knLFxuICAgICAgICBvcHRpb25zICAgICA9IHRhcmdldD8gdGFyZ2V0Lm9wdGlvbnM6IHNjb3BlLmRlZmF1bHRPcHRpb25zLFxuICAgICAgICBvcmlnaW4gICAgICA9IHNjb3BlLmdldE9yaWdpblhZKHRhcmdldCwgZWxlbWVudCksXG4gICAgICAgIHN0YXJ0aW5nICAgID0gcGhhc2UgPT09ICdzdGFydCcsXG4gICAgICAgIGVuZGluZyAgICAgID0gcGhhc2UgPT09ICdlbmQnLFxuICAgICAgICBjb29yZHMgICAgICA9IHN0YXJ0aW5nPyBpbnRlcmFjdGlvbi5zdGFydENvb3JkcyA6IGludGVyYWN0aW9uLmN1ckNvb3JkcztcblxuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IGludGVyYWN0aW9uLmVsZW1lbnQ7XG5cbiAgICBwYWdlICAgPSB1dGlscy5leHRlbmQoe30sIGNvb3Jkcy5wYWdlKTtcbiAgICBjbGllbnQgPSB1dGlscy5leHRlbmQoe30sIGNvb3Jkcy5jbGllbnQpO1xuXG4gICAgcGFnZS54IC09IG9yaWdpbi54O1xuICAgIHBhZ2UueSAtPSBvcmlnaW4ueTtcblxuICAgIGNsaWVudC54IC09IG9yaWdpbi54O1xuICAgIGNsaWVudC55IC09IG9yaWdpbi55O1xuXG4gICAgdmFyIHJlbGF0aXZlUG9pbnRzID0gb3B0aW9uc1thY3Rpb25dLnNuYXAgJiYgb3B0aW9uc1thY3Rpb25dLnNuYXAucmVsYXRpdmVQb2ludHMgO1xuXG4gICAgaWYgKHNjb3BlLmNoZWNrU25hcCh0YXJnZXQsIGFjdGlvbikgJiYgIShzdGFydGluZyAmJiByZWxhdGl2ZVBvaW50cyAmJiByZWxhdGl2ZVBvaW50cy5sZW5ndGgpKSB7XG4gICAgICAgIHRoaXMuc25hcCA9IHtcbiAgICAgICAgICAgIHJhbmdlICA6IHNuYXBTdGF0dXMucmFuZ2UsXG4gICAgICAgICAgICBsb2NrZWQgOiBzbmFwU3RhdHVzLmxvY2tlZCxcbiAgICAgICAgICAgIHggICAgICA6IHNuYXBTdGF0dXMuc25hcHBlZFgsXG4gICAgICAgICAgICB5ICAgICAgOiBzbmFwU3RhdHVzLnNuYXBwZWRZLFxuICAgICAgICAgICAgcmVhbFggIDogc25hcFN0YXR1cy5yZWFsWCxcbiAgICAgICAgICAgIHJlYWxZICA6IHNuYXBTdGF0dXMucmVhbFksXG4gICAgICAgICAgICBkeCAgICAgOiBzbmFwU3RhdHVzLmR4LFxuICAgICAgICAgICAgZHkgICAgIDogc25hcFN0YXR1cy5keVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzbmFwU3RhdHVzLmxvY2tlZCkge1xuICAgICAgICAgICAgcGFnZS54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBwYWdlLnkgKz0gc25hcFN0YXR1cy5keTtcbiAgICAgICAgICAgIGNsaWVudC54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBjbGllbnQueSArPSBzbmFwU3RhdHVzLmR5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNjb3BlLmNoZWNrUmVzdHJpY3QodGFyZ2V0LCBhY3Rpb24pICYmICEoc3RhcnRpbmcgJiYgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0LmVsZW1lbnRSZWN0KSAmJiByZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkKSB7XG4gICAgICAgIHBhZ2UueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgcGFnZS55ICs9IHJlc3RyaWN0U3RhdHVzLmR5O1xuICAgICAgICBjbGllbnQueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgY2xpZW50LnkgKz0gcmVzdHJpY3RTdGF0dXMuZHk7XG5cbiAgICAgICAgdGhpcy5yZXN0cmljdCA9IHtcbiAgICAgICAgICAgIGR4OiByZXN0cmljdFN0YXR1cy5keCxcbiAgICAgICAgICAgIGR5OiByZXN0cmljdFN0YXR1cy5keVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMucGFnZVggICAgID0gcGFnZS54O1xuICAgIHRoaXMucGFnZVkgICAgID0gcGFnZS55O1xuICAgIHRoaXMuY2xpZW50WCAgID0gY2xpZW50Lng7XG4gICAgdGhpcy5jbGllbnRZICAgPSBjbGllbnQueTtcblxuICAgIHRoaXMueDAgICAgICAgID0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54IC0gb3JpZ2luLng7XG4gICAgdGhpcy55MCAgICAgICAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueTtcbiAgICB0aGlzLmNsaWVudFgwICA9IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54IC0gb3JpZ2luLng7XG4gICAgdGhpcy5jbGllbnRZMCAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5jbGllbnQueSAtIG9yaWdpbi55O1xuICAgIHRoaXMuY3RybEtleSAgID0gZXZlbnQuY3RybEtleTtcbiAgICB0aGlzLmFsdEtleSAgICA9IGV2ZW50LmFsdEtleTtcbiAgICB0aGlzLnNoaWZ0S2V5ICA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgIHRoaXMubWV0YUtleSAgID0gZXZlbnQubWV0YUtleTtcbiAgICB0aGlzLmJ1dHRvbiAgICA9IGV2ZW50LmJ1dHRvbjtcbiAgICB0aGlzLnRhcmdldCAgICA9IGVsZW1lbnQ7XG4gICAgdGhpcy50MCAgICAgICAgPSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG4gICAgdGhpcy50eXBlICAgICAgPSBhY3Rpb24gKyAocGhhc2UgfHwgJycpO1xuXG4gICAgdGhpcy5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGFyZ2V0O1xuXG4gICAgdmFyIGluZXJ0aWFTdGF0dXMgPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzO1xuXG4gICAgaWYgKGluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuZGV0YWlsID0gJ2luZXJ0aWEnO1xuICAgIH1cblxuICAgIGlmIChyZWxhdGVkKSB7XG4gICAgICAgIHRoaXMucmVsYXRlZFRhcmdldCA9IHJlbGF0ZWQ7XG4gICAgfVxuXG4gICAgLy8gZW5kIGV2ZW50IGR4LCBkeSBpcyBkaWZmZXJlbmNlIGJldHdlZW4gc3RhcnQgYW5kIGVuZCBwb2ludHNcbiAgICBpZiAoZW5kaW5nKSB7XG4gICAgICAgIGlmIChkZWx0YVNvdXJjZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgICAgIHRoaXMuZHggPSBjbGllbnQueCAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54O1xuICAgICAgICAgICAgdGhpcy5keSA9IGNsaWVudC55IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMuY2xpZW50Lnk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gcGFnZS54IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54O1xuICAgICAgICAgICAgdGhpcy5keSA9IHBhZ2UueSAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLnBhZ2UueTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLmR4ID0gMDtcbiAgICAgICAgdGhpcy5keSA9IDA7XG4gICAgfVxuICAgIC8vIGNvcHkgcHJvcGVydGllcyBmcm9tIHByZXZpb3VzbW92ZSBpZiBzdGFydGluZyBpbmVydGlhXG4gICAgZWxzZSBpZiAocGhhc2UgPT09ICdpbmVydGlhc3RhcnQnKSB7XG4gICAgICAgIHRoaXMuZHggPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHg7XG4gICAgICAgIHRoaXMuZHkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoZGVsdGFTb3VyY2UgPT09ICdjbGllbnQnKSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gY2xpZW50LnggLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBjbGllbnQueSAtIGludGVyYWN0aW9uLnByZXZFdmVudC5jbGllbnRZO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5keCA9IHBhZ2UueCAtIGludGVyYWN0aW9uLnByZXZFdmVudC5wYWdlWDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBwYWdlLnkgLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQucGFnZVk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXZFdmVudCAmJiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGV0YWlsID09PSAnaW5lcnRpYSdcbiAgICAgICAgJiYgIWluZXJ0aWFTdGF0dXMuYWN0aXZlXG4gICAgICAgICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhLnplcm9SZXN1bWVEZWx0YSkge1xuXG4gICAgICAgIGluZXJ0aWFTdGF0dXMucmVzdW1lRHggKz0gdGhpcy5keDtcbiAgICAgICAgaW5lcnRpYVN0YXR1cy5yZXN1bWVEeSArPSB0aGlzLmR5O1xuXG4gICAgICAgIHRoaXMuZHggPSB0aGlzLmR5ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uID09PSAncmVzaXplJyAmJiBpbnRlcmFjdGlvbi5yZXNpemVBeGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR4ID0gdGhpcy5keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZHkgPSB0aGlzLmR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5heGVzID0gJ3h5JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXM7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR5ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuZHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2dlc3R1cmUnKSB7XG4gICAgICAgIHRoaXMudG91Y2hlcyA9IFtwb2ludGVyc1swXSwgcG9pbnRlcnNbMV1dO1xuXG4gICAgICAgIGlmIChzdGFydGluZykge1xuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZSA9IHV0aWxzLnRvdWNoRGlzdGFuY2UocG9pbnRlcnMsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuYm94ICAgICAgPSB1dGlscy50b3VjaEJCb3gocG9pbnRlcnMpO1xuICAgICAgICAgICAgdGhpcy5zY2FsZSAgICA9IDE7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB1dGlscy50b3VjaEFuZ2xlKHBvaW50ZXJzLCB1bmRlZmluZWQsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuZGEgICAgICAgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVuZGluZyB8fCBldmVudCBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzdGFuY2UgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGlzdGFuY2U7XG4gICAgICAgICAgICB0aGlzLmJveCAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmJveDtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc2NhbGU7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gdGhpcy5zY2FsZSAtIDE7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmFuZ2xlO1xuICAgICAgICAgICAgdGhpcy5kYSAgICAgICA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnN0YXJ0QW5nbGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpc3RhbmNlID0gdXRpbHMudG91Y2hEaXN0YW5jZShwb2ludGVycywgZGVsdGFTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5ib3ggICAgICA9IHV0aWxzLnRvdWNoQkJveChwb2ludGVycyk7XG4gICAgICAgICAgICB0aGlzLnNjYWxlICAgID0gdGhpcy5kaXN0YW5jZSAvIGludGVyYWN0aW9uLmdlc3R1cmUuc3RhcnREaXN0YW5jZTtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB1dGlscy50b3VjaEFuZ2xlKHBvaW50ZXJzLCBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZSwgZGVsdGFTb3VyY2UpO1xuXG4gICAgICAgICAgICB0aGlzLmRzID0gdGhpcy5zY2FsZSAtIGludGVyYWN0aW9uLmdlc3R1cmUucHJldlNjYWxlO1xuICAgICAgICAgICAgdGhpcy5kYSA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLmRvd25UaW1lc1swXTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSAwO1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IDA7XG4gICAgICAgIHRoaXMuc3BlZWQgICAgID0gMDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVggPSAwO1xuICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBoYXNlID09PSAnaW5lcnRpYXN0YXJ0Jykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHQgICAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmR0O1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IGludGVyYWN0aW9uLnByZXZFdmVudC5kdXJhdGlvbjtcbiAgICAgICAgdGhpcy5zcGVlZCAgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHlYID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gID0gdGhpcy50aW1lU3RhbXAgLSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICAgICAgdmFyIGR4ID0gdGhpc1tzb3VyY2VYXSAtIGludGVyYWN0aW9uLnByZXZFdmVudFtzb3VyY2VYXSxcbiAgICAgICAgICAgICAgICBkeSA9IHRoaXNbc291cmNlWV0gLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnRbc291cmNlWV0sXG4gICAgICAgICAgICAgICAgZHQgPSB0aGlzLmR0IC8gMTAwMDtcblxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IHV0aWxzLmh5cG90KGR4LCBkeSkgLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlYID0gZHggLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlZID0gZHkgLyBkdDtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBub3JtYWwgbW92ZSBvciBlbmQgZXZlbnQsIHVzZSBwcmV2aW91cyB1c2VyIGV2ZW50IGNvb3Jkc1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNwZWVkIGFuZCB2ZWxvY2l0eSBpbiBwaXhlbHMgcGVyIHNlY29uZFxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0uc3BlZWQ7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udng7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udnk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKGVuZGluZyB8fCBwaGFzZSA9PT0gJ2luZXJ0aWFzdGFydCcpXG4gICAgICAgICYmIGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCA+IDYwMCAmJiB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXAgPCAxNTApIHtcblxuICAgICAgICB2YXIgYW5nbGUgPSAxODAgKiBNYXRoLmF0YW4yKGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVksIGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVgpIC8gTWF0aC5QSSxcbiAgICAgICAgICAgIG92ZXJsYXAgPSAyMi41O1xuXG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICAgIGFuZ2xlICs9IDM2MDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWZ0ID0gMTM1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDIyNSArIG92ZXJsYXAsXG4gICAgICAgICAgICB1cCAgID0gMjI1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDMxNSArIG92ZXJsYXAsXG5cbiAgICAgICAgICAgIHJpZ2h0ID0gIWxlZnQgJiYgKDMxNSAtIG92ZXJsYXAgPD0gYW5nbGUgfHwgYW5nbGUgPCAgNDUgKyBvdmVybGFwKSxcbiAgICAgICAgICAgIGRvd24gID0gIXVwICAgJiYgICA0NSAtIG92ZXJsYXAgPD0gYW5nbGUgJiYgYW5nbGUgPCAxMzUgKyBvdmVybGFwO1xuXG4gICAgICAgIHRoaXMuc3dpcGUgPSB7XG4gICAgICAgICAgICB1cCAgIDogdXAsXG4gICAgICAgICAgICBkb3duIDogZG93bixcbiAgICAgICAgICAgIGxlZnQgOiBsZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IHJpZ2h0LFxuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlLFxuICAgICAgICAgICAgc3BlZWQ6IGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCxcbiAgICAgICAgICAgIHZlbG9jaXR5OiB7XG4gICAgICAgICAgICAgICAgeDogaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WCxcbiAgICAgICAgICAgICAgICB5OiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5JbnRlcmFjdEV2ZW50LnByb3RvdHlwZSA9IHtcbiAgICBwcmV2ZW50RGVmYXVsdDogdXRpbHMuYmxhbmssXG4gICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgIH0sXG4gICAgc3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0RXZlbnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcbnZhciBsaXN0ZW5lciA9IHJlcXVpcmUoJy4vbGlzdGVuZXInKTtcbnZhciBkZWZhdWx0QWN0aW9uQ2hlY2tlciA9IHJlcXVpcmUoJy4vZGVmYXVsdEFjdGlvbkNoZWNrZXInKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBldmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL2V2ZW50cycpO1xuXG4vKlxcXG4gKiBJbnRlcmFjdGFibGVcbiBbIHByb3BlcnR5IF1cbiAqKlxuICogT2JqZWN0IHR5cGUgcmV0dXJuZWQgYnkgQGludGVyYWN0XG4gXFwqL1xuZnVuY3Rpb24gSW50ZXJhY3RhYmxlIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5faUV2ZW50cyA9IHRoaXMuX2lFdmVudHMgfHwge307XG5cbiAgICB2YXIgX3dpbmRvdztcblxuICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihlbGVtZW50KSkge1xuICAgICAgICB0aGlzLnNlbGVjdG9yID0gZWxlbWVudDtcblxuICAgICAgICB2YXIgY29udGV4dCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0O1xuXG4gICAgICAgIF93aW5kb3cgPSBjb250ZXh0PyBzY29wZS5nZXRXaW5kb3coY29udGV4dCkgOiBzY29wZS53aW5kb3c7XG5cbiAgICAgICAgaWYgKGNvbnRleHQgJiYgKF93aW5kb3cuTm9kZVxuICAgICAgICAgICAgICAgID8gY29udGV4dCBpbnN0YW5jZW9mIF93aW5kb3cuTm9kZVxuICAgICAgICAgICAgICAgIDogKHV0aWxzLmlzRWxlbWVudChjb250ZXh0KSB8fCBjb250ZXh0ID09PSBfd2luZG93LmRvY3VtZW50KSkpIHtcblxuICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIF93aW5kb3cgPSBzY29wZS5nZXRXaW5kb3coZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50LCBfd2luZG93KSkge1xuXG4gICAgICAgICAgICBpZiAoc2NvcGUuUG9pbnRlckV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCBzY29wZS5wRXZlbnRUeXBlcy5kb3duLCBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckRvd24gKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsIHNjb3BlLnBFdmVudFR5cGVzLm1vdmUsIGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAnbW91c2Vkb3duJyAsIGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVyRG93biApO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgJ21vdXNlbW92ZScgLCBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlckhvdmVyKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsICd0b3VjaHN0YXJ0JywgbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJEb3duICk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAndG91Y2htb3ZlJyAsIGxpc3RlbmVyLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZG9jID0gX3dpbmRvdy5kb2N1bWVudDtcblxuICAgIGlmICghc2NvcGUuY29udGFpbnMoc2NvcGUuZG9jdW1lbnRzLCB0aGlzLl9kb2MpKSB7XG4gICAgICAgIGxpc3RlbmVyLmxpc3RlblRvRG9jdW1lbnQodGhpcy5fZG9jKTtcbiAgICB9XG5cbiAgICBzY29wZS5pbnRlcmFjdGFibGVzLnB1c2godGhpcyk7XG5cbiAgICB0aGlzLnNldChvcHRpb25zKTtcbn1cblxuSW50ZXJhY3RhYmxlLnByb3RvdHlwZSA9IHtcbiAgICBzZXRPbkV2ZW50czogZnVuY3Rpb24gKGFjdGlvbiwgcGhhc2VzKSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdkcm9wJykge1xuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZHJvcCkgICAgICAgICAgKSB7IHRoaXMub25kcm9wICAgICAgICAgICA9IHBoYXNlcy5vbmRyb3AgICAgICAgICAgOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wYWN0aXZhdGUpICApIHsgdGhpcy5vbmRyb3BhY3RpdmF0ZSAgID0gcGhhc2VzLm9uZHJvcGFjdGl2YXRlICA7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmRyb3BkZWFjdGl2YXRlKSkgeyB0aGlzLm9uZHJvcGRlYWN0aXZhdGUgPSBwaGFzZXMub25kcm9wZGVhY3RpdmF0ZTsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZHJhZ2VudGVyKSAgICAgKSB7IHRoaXMub25kcmFnZW50ZXIgICAgICA9IHBoYXNlcy5vbmRyYWdlbnRlciAgICAgOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcmFnbGVhdmUpICAgICApIHsgdGhpcy5vbmRyYWdsZWF2ZSAgICAgID0gcGhhc2VzLm9uZHJhZ2xlYXZlICAgICA7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbmRyb3Btb3ZlKSAgICAgICkgeyB0aGlzLm9uZHJvcG1vdmUgICAgICAgPSBwaGFzZXMub25kcm9wbW92ZSAgICAgIDsgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYWN0aW9uID0gJ29uJyArIGFjdGlvbjtcblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uc3RhcnQpICAgICAgICkgeyB0aGlzW2FjdGlvbiArICdzdGFydCcgICAgICAgICBdID0gcGhhc2VzLm9uc3RhcnQgICAgICAgICA7IH1cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbm1vdmUpICAgICAgICApIHsgdGhpc1thY3Rpb24gKyAnbW92ZScgICAgICAgICAgXSA9IHBoYXNlcy5vbm1vdmUgICAgICAgICAgOyB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25lbmQpICAgICAgICAgKSB7IHRoaXNbYWN0aW9uICsgJ2VuZCcgICAgICAgICAgIF0gPSBwaGFzZXMub25lbmQgICAgICAgICAgIDsgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSkgeyB0aGlzW2FjdGlvbiArICdpbmVydGlhc3RhcnQnICBdID0gcGhhc2VzLm9uaW5lcnRpYXN0YXJ0ICA7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmRyYWdnYWJsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciBkcmFnIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGVcbiAgICAgKiBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICA9IChib29sZWFuKSBJbmRpY2F0ZXMgaWYgdGhpcyBjYW4gYmUgdGhlIHRhcmdldCBvZiBkcmFnIGV2ZW50c1xuICAgICB8IHZhciBpc0RyYWdnYWJsZSA9IGludGVyYWN0KCd1bCBsaScpLmRyYWdnYWJsZSgpO1xuICAgICAqIG9yXG4gICAgIC0gb3B0aW9ucyAoYm9vbGVhbiB8IG9iamVjdCkgI29wdGlvbmFsIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnQgbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIGRyYWcgZXZlbnRzIChvYmplY3QgbWFrZXMgdGhlIEludGVyYWN0YWJsZSBkcmFnZ2FibGUpXG4gICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5kcmFnZ2FibGUoe1xuICAgICB8ICAgICBvbnN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8XG4gICAgIHwgICAgIC8vIHRoZSBheGlzIGluIHdoaWNoIHRoZSBmaXJzdCBtb3ZlbWVudCBtdXN0IGJlXG4gICAgIHwgICAgIC8vIGZvciB0aGUgZHJhZyBzZXF1ZW5jZSB0byBzdGFydFxuICAgICB8ICAgICAvLyAneHknIGJ5IGRlZmF1bHQgLSBhbnkgZGlyZWN0aW9uXG4gICAgIHwgICAgIGF4aXM6ICd4JyB8fCAneScgfHwgJ3h5JyxcbiAgICAgfFxuICAgICB8ICAgICAvLyBtYXggbnVtYmVyIG9mIGRyYWdzIHRoYXQgY2FuIGhhcHBlbiBjb25jdXJyZW50bHlcbiAgICAgfCAgICAgLy8gd2l0aCBlbGVtZW50cyBvZiB0aGlzIEludGVyYWN0YWJsZS4gSW5maW5pdHkgYnkgZGVmYXVsdFxuICAgICB8ICAgICBtYXg6IEluZmluaXR5LFxuICAgICB8XG4gICAgIHwgICAgIC8vIG1heCBudW1iZXIgb2YgZHJhZ3MgdGhhdCBjYW4gdGFyZ2V0IHRoZSBzYW1lIGVsZW1lbnQrSW50ZXJhY3RhYmxlXG4gICAgIHwgICAgIC8vIDEgYnkgZGVmYXVsdFxuICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAyXG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICBkcmFnZ2FibGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyYWcuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oJ2RyYWcnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuc2V0T25FdmVudHMoJ2RyYWcnLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKC9eeCR8XnkkfF54eSQvLnRlc3Qob3B0aW9ucy5heGlzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcmFnLmF4aXMgPSBvcHRpb25zLmF4aXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmF4aXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmRyYWcuYXhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJhZy5lbmFibGVkID0gb3B0aW9ucztcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRyYWc7XG4gICAgfSxcblxuICAgIHNldFBlckFjdGlvbjogZnVuY3Rpb24gKGFjdGlvbiwgb3B0aW9ucykge1xuICAgICAgICAvLyBmb3IgYWxsIHRoZSBkZWZhdWx0IHBlci1hY3Rpb24gb3B0aW9uc1xuICAgICAgICBmb3IgKHZhciBvcHRpb24gaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBvcHRpb24gZXhpc3RzIGZvciB0aGlzIGFjdGlvblxuICAgICAgICAgICAgaWYgKG9wdGlvbiBpbiBzY29wZS5kZWZhdWx0T3B0aW9uc1thY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIG9wdGlvbiBpbiB0aGUgb3B0aW9ucyBhcmcgaXMgYW4gb2JqZWN0IHZhbHVlXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnNbb3B0aW9uXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZHVwbGljYXRlIHRoZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXSA9IHV0aWxzLmV4dGVuZCh0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dIHx8IHt9LCBvcHRpb25zW29wdGlvbl0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChzY29wZS5kZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb25bb3B0aW9uXSkgJiYgJ2VuYWJsZWQnIGluIHNjb3BlLmRlZmF1bHRPcHRpb25zLnBlckFjdGlvbltvcHRpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dLmVuYWJsZWQgPSBvcHRpb25zW29wdGlvbl0uZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzY29wZS5pc0Jvb2wob3B0aW9uc1tvcHRpb25dKSAmJiBzY29wZS5pc09iamVjdChzY29wZS5kZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb25bb3B0aW9uXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXS5lbmFibGVkID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zW29wdGlvbl0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvciBpZiBpdCdzIG5vdCB1bmRlZmluZWQsIGRvIGEgcGxhaW4gYXNzaWdubWVudFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmRyb3B6b25lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGVsZW1lbnRzIGNhbiBiZSBkcm9wcGVkIG9udG8gdGhpc1xuICAgICAqIEludGVyYWN0YWJsZSB0byB0cmlnZ2VyIGRyb3AgZXZlbnRzXG4gICAgICpcbiAgICAgKiBEcm9wem9uZXMgY2FuIHJlY2VpdmUgdGhlIGZvbGxvd2luZyBldmVudHM6XG4gICAgICogIC0gYGRyb3BhY3RpdmF0ZWAgYW5kIGBkcm9wZGVhY3RpdmF0ZWAgd2hlbiBhbiBhY2NlcHRhYmxlIGRyYWcgc3RhcnRzIGFuZCBlbmRzXG4gICAgICogIC0gYGRyYWdlbnRlcmAgYW5kIGBkcmFnbGVhdmVgIHdoZW4gYSBkcmFnZ2FibGUgZW50ZXJzIGFuZCBsZWF2ZXMgdGhlIGRyb3B6b25lXG4gICAgICogIC0gYGRyYWdtb3ZlYCB3aGVuIGEgZHJhZ2dhYmxlIHRoYXQgaGFzIGVudGVyZWQgdGhlIGRyb3B6b25lIGlzIG1vdmVkXG4gICAgICogIC0gYGRyb3BgIHdoZW4gYSBkcmFnZ2FibGUgaXMgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmVcbiAgICAgKlxuICAgICAqICBVc2UgdGhlIGBhY2NlcHRgIG9wdGlvbiB0byBhbGxvdyBvbmx5IGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvciBlbGVtZW50LlxuICAgICAqXG4gICAgICogIFVzZSB0aGUgYG92ZXJsYXBgIG9wdGlvbiB0byBzZXQgaG93IGRyb3BzIGFyZSBjaGVja2VkIGZvci4gVGhlIGFsbG93ZWQgdmFsdWVzIGFyZTpcbiAgICAgKiAgIC0gYCdwb2ludGVyJ2AsIHRoZSBwb2ludGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmUgKGRlZmF1bHQpXG4gICAgICogICAtIGAnY2VudGVyJ2AsIHRoZSBkcmFnZ2FibGUgZWxlbWVudCdzIGNlbnRlciBtdXN0IGJlIG92ZXIgdGhlIGRyb3B6b25lXG4gICAgICogICAtIGEgbnVtYmVyIGZyb20gMC0xIHdoaWNoIGlzIHRoZSBgKGludGVyc2VjdGlvbiBhcmVhKSAvIChkcmFnZ2FibGUgYXJlYSlgLlxuICAgICAqICAgICAgIGUuZy4gYDAuNWAgZm9yIGRyb3AgdG8gaGFwcGVuIHdoZW4gaGFsZiBvZiB0aGUgYXJlYSBvZiB0aGVcbiAgICAgKiAgICAgICBkcmFnZ2FibGUgaXMgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICAgKlxuICAgICAtIG9wdGlvbnMgKGJvb2xlYW4gfCBvYmplY3QgfCBudWxsKSAjb3B0aW9uYWwgVGhlIG5ldyB2YWx1ZSB0byBiZSBzZXQuXG4gICAgIHwgaW50ZXJhY3QoJy5kcm9wJykuZHJvcHpvbmUoe1xuICAgICB8ICAgYWNjZXB0OiAnLmNhbi1kcm9wJyB8fCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2luZ2xlLWRyb3AnKSxcbiAgICAgfCAgIG92ZXJsYXA6ICdwb2ludGVyJyB8fCAnY2VudGVyJyB8fCB6ZXJvVG9PbmVcbiAgICAgfCB9XG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGRyb3B6b25lOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0T25FdmVudHMoJ2Ryb3AnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuYWNjZXB0KG9wdGlvbnMuYWNjZXB0KTtcblxuICAgICAgICAgICAgaWYgKC9eKHBvaW50ZXJ8Y2VudGVyKSQvLnRlc3Qob3B0aW9ucy5vdmVybGFwKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLm92ZXJsYXAgPSBvcHRpb25zLm92ZXJsYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzY29wZS5pc051bWJlcihvcHRpb25zLm92ZXJsYXApKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3Aub3ZlcmxhcCA9IE1hdGgubWF4KE1hdGgubWluKDEsIG9wdGlvbnMub3ZlcmxhcCksIDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJvcDtcbiAgICB9LFxuXG4gICAgZHJvcENoZWNrOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgZHJvcEVsZW1lbnQsIHJlY3QpIHtcbiAgICAgICAgdmFyIGRyb3BwZWQgPSBmYWxzZTtcblxuICAgICAgICAvLyBpZiB0aGUgZHJvcHpvbmUgaGFzIG5vIHJlY3QgKGVnLiBkaXNwbGF5OiBub25lKVxuICAgICAgICAvLyBjYWxsIHRoZSBjdXN0b20gZHJvcENoZWNrZXIgb3IganVzdCByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKCEocmVjdCA9IHJlY3QgfHwgdGhpcy5nZXRSZWN0KGRyb3BFbGVtZW50KSkpIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5vcHRpb25zLmRyb3BDaGVja2VyXG4gICAgICAgICAgICAgICAgPyB0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXIocG9pbnRlciwgZXZlbnQsIGRyb3BwZWQsIHRoaXMsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpXG4gICAgICAgICAgICAgICAgOiBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZHJvcE92ZXJsYXAgPSB0aGlzLm9wdGlvbnMuZHJvcC5vdmVybGFwO1xuXG4gICAgICAgIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ3BvaW50ZXInKSB7XG4gICAgICAgICAgICB2YXIgcGFnZSA9IHV0aWxzLmdldFBhZ2VYWShwb2ludGVyKSxcbiAgICAgICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5nZXRPcmlnaW5YWShkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpLFxuICAgICAgICAgICAgICAgIGhvcml6b250YWwsXG4gICAgICAgICAgICAgICAgdmVydGljYWw7XG5cbiAgICAgICAgICAgIHBhZ2UueCArPSBvcmlnaW4ueDtcbiAgICAgICAgICAgIHBhZ2UueSArPSBvcmlnaW4ueTtcblxuICAgICAgICAgICAgaG9yaXpvbnRhbCA9IChwYWdlLnggPiByZWN0LmxlZnQpICYmIChwYWdlLnggPCByZWN0LnJpZ2h0KTtcbiAgICAgICAgICAgIHZlcnRpY2FsICAgPSAocGFnZS55ID4gcmVjdC50b3AgKSAmJiAocGFnZS55IDwgcmVjdC5ib3R0b20pO1xuXG4gICAgICAgICAgICBkcm9wcGVkID0gaG9yaXpvbnRhbCAmJiB2ZXJ0aWNhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkcmFnUmVjdCA9IGRyYWdnYWJsZS5nZXRSZWN0KGRyYWdnYWJsZUVsZW1lbnQpO1xuXG4gICAgICAgIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgIHZhciBjeCA9IGRyYWdSZWN0LmxlZnQgKyBkcmFnUmVjdC53aWR0aCAgLyAyLFxuICAgICAgICAgICAgICAgIGN5ID0gZHJhZ1JlY3QudG9wICArIGRyYWdSZWN0LmhlaWdodCAvIDI7XG5cbiAgICAgICAgICAgIGRyb3BwZWQgPSBjeCA+PSByZWN0LmxlZnQgJiYgY3ggPD0gcmVjdC5yaWdodCAmJiBjeSA+PSByZWN0LnRvcCAmJiBjeSA8PSByZWN0LmJvdHRvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihkcm9wT3ZlcmxhcCkpIHtcbiAgICAgICAgICAgIHZhciBvdmVybGFwQXJlYSAgPSAoTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5yaWdodCAsIGRyYWdSZWN0LnJpZ2h0ICkgLSBNYXRoLm1heChyZWN0LmxlZnQsIGRyYWdSZWN0LmxlZnQpKVxuICAgICAgICAgICAgICAgICogTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5ib3R0b20sIGRyYWdSZWN0LmJvdHRvbSkgLSBNYXRoLm1heChyZWN0LnRvcCAsIGRyYWdSZWN0LnRvcCApKSksXG4gICAgICAgICAgICAgICAgb3ZlcmxhcFJhdGlvID0gb3ZlcmxhcEFyZWEgLyAoZHJhZ1JlY3Qud2lkdGggKiBkcmFnUmVjdC5oZWlnaHQpO1xuXG4gICAgICAgICAgICBkcm9wcGVkID0gb3ZlcmxhcFJhdGlvID49IGRyb3BPdmVybGFwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlcikge1xuICAgICAgICAgICAgZHJvcHBlZCA9IHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlcihwb2ludGVyLCBkcm9wcGVkLCB0aGlzLCBkcm9wRWxlbWVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkcm9wcGVkO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmRyb3BDaGVja2VyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjaGVjayBpZiBhIGRyYWdnZWQgZWxlbWVudCBpc1xuICAgICAqIG92ZXIgdGhpcyBJbnRlcmFjdGFibGUuXG4gICAgICpcbiAgICAgLSBjaGVja2VyIChmdW5jdGlvbikgI29wdGlvbmFsIFRoZSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gY2hlY2tpbmcgZm9yIGEgZHJvcFxuICAgICA9IChGdW5jdGlvbiB8IEludGVyYWN0YWJsZSkgVGhlIGNoZWNrZXIgZnVuY3Rpb24gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICAqIFRoZSBjaGVja2VyIGZ1bmN0aW9uIHRha2VzIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICAqXG4gICAgIC0gcG9pbnRlciAoVG91Y2ggfCBQb2ludGVyRXZlbnQgfCBNb3VzZUV2ZW50KSBUaGUgcG9pbnRlci9ldmVudCB0aGF0IGVuZHMgYSBkcmFnXG4gICAgIC0gZXZlbnQgKFRvdWNoRXZlbnQgfCBQb2ludGVyRXZlbnQgfCBNb3VzZUV2ZW50KSBUaGUgZXZlbnQgcmVsYXRlZCB0byB0aGUgcG9pbnRlclxuICAgICAtIGRyb3BwZWQgKGJvb2xlYW4pIFRoZSB2YWx1ZSBmcm9tIHRoZSBkZWZhdWx0IGRyb3AgY2hlY2tcbiAgICAgLSBkcm9wem9uZSAoSW50ZXJhY3RhYmxlKSBUaGUgZHJvcHpvbmUgaW50ZXJhY3RhYmxlXG4gICAgIC0gZHJvcEVsZW1lbnQgKEVsZW1lbnQpIFRoZSBkcm9wem9uZSBlbGVtZW50XG4gICAgIC0gZHJhZ2dhYmxlIChJbnRlcmFjdGFibGUpIFRoZSBJbnRlcmFjdGFibGUgYmVpbmcgZHJhZ2dlZFxuICAgICAtIGRyYWdnYWJsZUVsZW1lbnQgKEVsZW1lbnQpIFRoZSBhY3R1YWwgZWxlbWVudCB0aGF0J3MgYmVpbmcgZHJhZ2dlZFxuICAgICAqXG4gICAgID4gVXNhZ2U6XG4gICAgIHwgaW50ZXJhY3QodGFyZ2V0KVxuICAgICB8IC5kcm9wQ2hlY2tlcihmdW5jdGlvbihwb2ludGVyLCAgICAgICAgICAgLy8gVG91Y2gvUG9pbnRlckV2ZW50L01vdXNlRXZlbnRcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQsICAgICAgICAgICAgIC8vIFRvdWNoRXZlbnQvUG9pbnRlckV2ZW50L01vdXNlRXZlbnRcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJvcHBlZCwgICAgICAgICAgIC8vIHJlc3VsdCBvZiB0aGUgZGVmYXVsdCBjaGVja2VyXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lLCAgICAgICAgICAvLyBkcm9wem9uZSBJbnRlcmFjdGFibGVcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJvcEVsZW1lbnQsICAgICAgIC8vIGRyb3B6b25lIGVsZW1udFxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUsICAgICAgICAgLy8gZHJhZ2dhYmxlIEludGVyYWN0YWJsZVxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGVFbGVtZW50KSB7Ly8gZHJhZ2dhYmxlIGVsZW1lbnRcbiAgICAgfFxuICAgICB8ICAgcmV0dXJuIGRyb3BwZWQgJiYgZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnYWxsb3ctZHJvcCcpO1xuICAgICB8IH1cbiAgICAgXFwqL1xuICAgIGRyb3BDaGVja2VyOiBmdW5jdGlvbiAoY2hlY2tlcikge1xuICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihjaGVja2VyKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3BDaGVja2VyID0gY2hlY2tlcjtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZ2V0UmVjdDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRyb3BDaGVja2VyO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmFjY2VwdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEZXByZWNhdGVkLiBhZGQgYW4gYGFjY2VwdGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB0b1xuICAgICAqIEBJbnRlcmFjdGFibGUuZHJvcHpvbmUgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgRWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgbWF0Y2ggdGhhdCB0aGlzXG4gICAgICogSW50ZXJhY3RhYmxlIGFjY2VwdHMgaWYgaXQgaXMgYSBkcm9wem9uZS5cbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChFbGVtZW50IHwgc3RyaW5nIHwgbnVsbCkgI29wdGlvbmFsXG4gICAgICogSWYgaXQgaXMgYW4gRWxlbWVudCwgdGhlbiBvbmx5IHRoYXQgZWxlbWVudCBjYW4gYmUgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmUuXG4gICAgICogSWYgaXQgaXMgYSBzdHJpbmcsIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQgbXVzdCBtYXRjaCBpdCBhcyBhIHNlbGVjdG9yLlxuICAgICAqIElmIGl0IGlzIG51bGwsIHRoZSBhY2NlcHQgb3B0aW9ucyBpcyBjbGVhcmVkIC0gaXQgYWNjZXB0cyBhbnkgZWxlbWVudC5cbiAgICAgKlxuICAgICA9IChzdHJpbmcgfCBFbGVtZW50IHwgbnVsbCB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgYWNjZXB0IG9wdGlvbiBpZiBnaXZlbiBgdW5kZWZpbmVkYCBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgYWNjZXB0OiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmFjY2VwdCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRlc3QgaWYgaXQgaXMgYSB2YWxpZCBDU1Mgc2VsZWN0b3JcbiAgICAgICAgaWYgKHNjb3BlLnRyeVNlbGVjdG9yKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0ID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0O1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJvcC5hY2NlcHQ7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUucmVzaXphYmxlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHJlc2l6ZSBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlXG4gICAgICogSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoaXMgY2FuIGJlIHRoZSB0YXJnZXQgb2YgcmVzaXplIGVsZW1lbnRzXG4gICAgIHwgdmFyIGlzUmVzaXplYWJsZSA9IGludGVyYWN0KCdpbnB1dFt0eXBlPXRleHRdJykucmVzaXphYmxlKCk7XG4gICAgICogb3JcbiAgICAgLSBvcHRpb25zIChib29sZWFuIHwgb2JqZWN0KSAjb3B0aW9uYWwgdHJ1ZS9mYWxzZSBvciBBbiBvYmplY3Qgd2l0aCBldmVudCBsaXN0ZW5lcnMgdG8gYmUgZmlyZWQgb24gcmVzaXplIGV2ZW50cyAob2JqZWN0IG1ha2VzIHRoZSBJbnRlcmFjdGFibGUgcmVzaXphYmxlKVxuICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkucmVzaXphYmxlKHtcbiAgICAgfCAgICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfFxuICAgICB8ICAgICBlZGdlczoge1xuICAgICB8ICAgICAgIHRvcCAgIDogdHJ1ZSwgICAgICAgLy8gVXNlIHBvaW50ZXIgY29vcmRzIHRvIGNoZWNrIGZvciByZXNpemUuXG4gICAgIHwgICAgICAgbGVmdCAgOiBmYWxzZSwgICAgICAvLyBEaXNhYmxlIHJlc2l6aW5nIGZyb20gbGVmdCBlZGdlLlxuICAgICB8ICAgICAgIGJvdHRvbTogJy5yZXNpemUtcycsLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IG1hdGNoZXMgc2VsZWN0b3JcbiAgICAgfCAgICAgICByaWdodCA6IGhhbmRsZUVsICAgIC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBpcyB0aGUgZ2l2ZW4gRWxlbWVudFxuICAgICB8ICAgICB9LFxuICAgICB8XG4gICAgIHwgICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAgfCAgICAgLy8gJ25lZ2F0ZScgd2lsbCBhbGxvdyB0aGUgcmVjdCB0byBoYXZlIG5lZ2F0aXZlIHdpZHRoL2hlaWdodFxuICAgICB8ICAgICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICAgfCAgICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIGFuZC9vciBzd2FwcGluZyB0aGUgbGVmdCBhbmQgcmlnaHQgZWRnZXNcbiAgICAgfCAgICAgaW52ZXJ0OiAnbm9uZScgfHwgJ25lZ2F0ZScgfHwgJ3JlcG9zaXRpb24nXG4gICAgIHxcbiAgICAgfCAgICAgLy8gbGltaXQgbXVsdGlwbGUgcmVzaXplcy5cbiAgICAgfCAgICAgLy8gU2VlIHRoZSBleHBsYW5hdGlvbiBpbiB0aGUgQEludGVyYWN0YWJsZS5kcmFnZ2FibGUgZXhhbXBsZVxuICAgICB8ICAgICBtYXg6IEluZmluaXR5LFxuICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAxLFxuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgcmVzaXphYmxlOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oJ3Jlc2l6ZScsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygncmVzaXplJywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIGlmICgvXngkfF55JHxeeHkkLy50ZXN0KG9wdGlvbnMuYXhpcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmF4aXMgPSBvcHRpb25zLmF4aXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmF4aXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmF4aXMgPSBzY29wZS5kZWZhdWx0T3B0aW9ucy5yZXNpemUuYXhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zLnNxdWFyZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLnNxdWFyZSA9IG9wdGlvbnMuc3F1YXJlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnJlc2l6ZTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5zcXVhcmVSZXNpemVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC4gQWRkIGEgYHNxdWFyZTogdHJ1ZSB8fCBmYWxzZWAgcHJvcGVydHkgdG8gQEludGVyYWN0YWJsZS5yZXNpemFibGUgaW5zdGVhZFxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXppbmcgaXMgZm9yY2VkIDE6MSBhc3BlY3RcbiAgICAgKlxuICAgICA9IChib29sZWFuKSBDdXJyZW50IHNldHRpbmdcbiAgICAgKlxuICAgICAqIG9yXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsXG4gICAgID0gKG9iamVjdCkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIHNxdWFyZVJlc2l6ZTogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLnNxdWFyZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5yZXNpemUuc3F1YXJlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMucmVzaXplLnNxdWFyZTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5nZXN0dXJhYmxlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIG11bHRpdG91Y2ggZ2VzdHVyZXMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGVcbiAgICAgKiBJbnRlcmFjdGFibGUncyBlbGVtZW50XG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoaXMgY2FuIGJlIHRoZSB0YXJnZXQgb2YgZ2VzdHVyZSBldmVudHNcbiAgICAgfCB2YXIgaXNHZXN0dXJlYWJsZSA9IGludGVyYWN0KGVsZW1lbnQpLmdlc3R1cmFibGUoKTtcbiAgICAgKiBvclxuICAgICAtIG9wdGlvbnMgKGJvb2xlYW4gfCBvYmplY3QpICNvcHRpb25hbCB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50IGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiBnZXN0dXJlIGV2ZW50cyAobWFrZXMgdGhlIEludGVyYWN0YWJsZSBnZXN0dXJhYmxlKVxuICAgICA9IChvYmplY3QpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuZ2VzdHVyYWJsZSh7XG4gICAgIHwgICAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9uZW5kICA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHxcbiAgICAgfCAgICAgLy8gbGltaXQgbXVsdGlwbGUgZ2VzdHVyZXMuXG4gICAgIHwgICAgIC8vIFNlZSB0aGUgZXhwbGFuYXRpb24gaW4gQEludGVyYWN0YWJsZS5kcmFnZ2FibGUgZXhhbXBsZVxuICAgICB8ICAgICBtYXg6IEluZmluaXR5LFxuICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAxLFxuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgZ2VzdHVyYWJsZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ2VzdHVyZS5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbignZ2VzdHVyZScsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygnZ2VzdHVyZScsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZ2VzdHVyZTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5hdXRvU2Nyb2xsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkLiBBZGQgYW4gYGF1dG9zY3JvbGxgIHByb3BlcnR5IHRvIHRoZSBvcHRpb25zIG9iamVjdFxuICAgICAqIHBhc3NlZCB0byBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBvciBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgZHJhZ2dpbmcgYW5kIHJlc2l6aW5nIG5lYXIgdGhlIGVkZ2VzIG9mIHRoZVxuICAgICAqIHdpbmRvdy9jb250YWluZXIgdHJpZ2dlciBhdXRvU2Nyb2xsIGZvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgID0gKG9iamVjdCkgT2JqZWN0IHdpdGggYXV0b1Njcm9sbCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBvclxuICAgICAqXG4gICAgIC0gb3B0aW9ucyAob2JqZWN0IHwgYm9vbGVhbikgI29wdGlvbmFsXG4gICAgICogb3B0aW9ucyBjYW4gYmU6XG4gICAgICogLSBhbiBvYmplY3Qgd2l0aCBtYXJnaW4sIGRpc3RhbmNlIGFuZCBpbnRlcnZhbCBwcm9wZXJ0aWVzLFxuICAgICAqIC0gdHJ1ZSBvciBmYWxzZSB0byBlbmFibGUgb3IgZGlzYWJsZSBhdXRvU2Nyb2xsIG9yXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGF1dG9TY3JvbGw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHV0aWxzLmV4dGVuZCh7IGFjdGlvbnM6IFsnZHJhZycsICdyZXNpemUnXX0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHsgYWN0aW9uczogWydkcmFnJywgJ3Jlc2l6ZSddLCBlbmFibGVkOiBvcHRpb25zIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zZXRPcHRpb25zKCdhdXRvU2Nyb2xsJywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuc25hcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZC4gQWRkIGEgYHNuYXBgIHByb3BlcnR5IHRvIHRoZSBvcHRpb25zIG9iamVjdCBwYXNzZWRcbiAgICAgKiB0byBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBvciBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIGlmIGFuZCBob3cgYWN0aW9uIGNvb3JkaW5hdGVzIGFyZSBzbmFwcGVkLiBCeVxuICAgICAqIGRlZmF1bHQsIHNuYXBwaW5nIGlzIHJlbGF0aXZlIHRvIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzLiBZb3UgY2FuXG4gICAgICogY2hhbmdlIHRoaXMgYnkgc2V0dGluZyB0aGVcbiAgICAgKiBbYGVsZW1lbnRPcmlnaW5gXShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9wdWxsLzcyKS5cbiAgICAgKipcbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgYGZhbHNlYCBpZiBzbmFwIGlzIGRpc2FibGVkOyBvYmplY3Qgd2l0aCBzbmFwIHByb3BlcnRpZXMgaWYgc25hcCBpcyBlbmFibGVkXG4gICAgICoqXG4gICAgICogb3JcbiAgICAgKipcbiAgICAgLSBvcHRpb25zIChvYmplY3QgfCBib29sZWFuIHwgbnVsbCkgI29wdGlvbmFsXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgPiBVc2FnZVxuICAgICB8IGludGVyYWN0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN0aGluZycpKS5zbmFwKHtcbiAgICAgfCAgICAgdGFyZ2V0czogW1xuICAgICB8ICAgICAgICAgLy8gc25hcCB0byB0aGlzIHNwZWNpZmljIHBvaW50XG4gICAgIHwgICAgICAgICB7XG4gICAgIHwgICAgICAgICAgICAgeDogMTAwLFxuICAgICB8ICAgICAgICAgICAgIHk6IDEwMCxcbiAgICAgfCAgICAgICAgICAgICByYW5nZTogMjVcbiAgICAgfCAgICAgICAgIH0sXG4gICAgIHwgICAgICAgICAvLyBnaXZlIHRoaXMgZnVuY3Rpb24gdGhlIHggYW5kIHkgcGFnZSBjb29yZHMgYW5kIHNuYXAgdG8gdGhlIG9iamVjdCByZXR1cm5lZFxuICAgICB8ICAgICAgICAgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgfCAgICAgICAgICAgICByZXR1cm4ge1xuICAgICB8ICAgICAgICAgICAgICAgICB4OiB4LFxuICAgICB8ICAgICAgICAgICAgICAgICB5OiAoNzUgKyA1MCAqIE1hdGguc2luKHggKiAwLjA0KSksXG4gICAgIHwgICAgICAgICAgICAgICAgIHJhbmdlOiA0MFxuICAgICB8ICAgICAgICAgICAgIH07XG4gICAgIHwgICAgICAgICB9LFxuICAgICB8ICAgICAgICAgLy8gY3JlYXRlIGEgZnVuY3Rpb24gdGhhdCBzbmFwcyB0byBhIGdyaWRcbiAgICAgfCAgICAgICAgIGludGVyYWN0LmNyZWF0ZVNuYXBHcmlkKHtcbiAgICAgfCAgICAgICAgICAgICB4OiA1MCxcbiAgICAgfCAgICAgICAgICAgICB5OiA1MCxcbiAgICAgfCAgICAgICAgICAgICByYW5nZTogMTAsICAgICAgICAgICAgICAvLyBvcHRpb25hbFxuICAgICB8ICAgICAgICAgICAgIG9mZnNldDogeyB4OiA1LCB5OiAxMCB9IC8vIG9wdGlvbmFsXG4gICAgIHwgICAgICAgICB9KVxuICAgICB8ICAgICBdLFxuICAgICB8ICAgICAvLyBkbyBub3Qgc25hcCBkdXJpbmcgbm9ybWFsIG1vdmVtZW50LlxuICAgICB8ICAgICAvLyBJbnN0ZWFkLCB0cmlnZ2VyIG9ubHkgb25lIHNuYXBwZWQgbW92ZSBldmVudFxuICAgICB8ICAgICAvLyBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGVuZCBldmVudC5cbiAgICAgfCAgICAgZW5kT25seTogdHJ1ZSxcbiAgICAgfFxuICAgICB8ICAgICByZWxhdGl2ZVBvaW50czogW1xuICAgICB8ICAgICAgICAgeyB4OiAwLCB5OiAwIH0sICAvLyBzbmFwIHJlbGF0aXZlIHRvIHRoZSB0b3AgbGVmdCBvZiB0aGUgZWxlbWVudFxuICAgICB8ICAgICAgICAgeyB4OiAxLCB5OiAxIH0sICAvLyBhbmQgYWxzbyB0byB0aGUgYm90dG9tIHJpZ2h0XG4gICAgIHwgICAgIF0sXG4gICAgIHxcbiAgICAgfCAgICAgLy8gb2Zmc2V0IHRoZSBzbmFwIHRhcmdldCBjb29yZGluYXRlc1xuICAgICB8ICAgICAvLyBjYW4gYmUgYW4gb2JqZWN0IHdpdGggeC95IG9yICdzdGFydENvb3JkcydcbiAgICAgfCAgICAgb2Zmc2V0OiB7IHg6IDUwLCB5OiA1MCB9XG4gICAgIHwgICB9XG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICBzbmFwOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgcmV0ID0gdGhpcy5zZXRPcHRpb25zKCdzbmFwJywgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKHJldCA9PT0gdGhpcykgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgIHJldHVybiByZXQuZHJhZztcbiAgICB9LFxuXG4gICAgY3JlYXRlU25hcEdyaWQgOiBmdW5jdGlvbiAoZ3JpZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHZhciBvZmZzZXRYID0gMCxcbiAgICAgICAgICAgICAgICBvZmZzZXRZID0gMDtcblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KGdyaWQub2Zmc2V0KSkge1xuICAgICAgICAgICAgICAgIG9mZnNldFggPSBncmlkLm9mZnNldC54O1xuICAgICAgICAgICAgICAgIG9mZnNldFkgPSBncmlkLm9mZnNldC55O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZ3JpZHggPSBNYXRoLnJvdW5kKCh4IC0gb2Zmc2V0WCkgLyBncmlkLngpLFxuICAgICAgICAgICAgICAgIGdyaWR5ID0gTWF0aC5yb3VuZCgoeSAtIG9mZnNldFkpIC8gZ3JpZC55KSxcblxuICAgICAgICAgICAgICAgIG5ld1ggPSBncmlkeCAqIGdyaWQueCArIG9mZnNldFgsXG4gICAgICAgICAgICAgICAgbmV3WSA9IGdyaWR5ICogZ3JpZC55ICsgb2Zmc2V0WTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBuZXdYLFxuICAgICAgICAgICAgICAgIHk6IG5ld1ksXG4gICAgICAgICAgICAgICAgcmFuZ2U6IGdyaWQucmFuZ2VcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHNldE9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgYWN0aW9ucyA9IG9wdGlvbnMgJiYgc2NvcGUuaXNBcnJheShvcHRpb25zLmFjdGlvbnMpXG4gICAgICAgICAgICA/IG9wdGlvbnMuYWN0aW9uc1xuICAgICAgICAgICAgOiBbJ2RyYWcnXTtcblxuICAgICAgICB2YXIgaTtcblxuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykgfHwgc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSAvcmVzaXplLy50ZXN0KGFjdGlvbnNbaV0pPyAncmVzaXplJyA6IGFjdGlvbnNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIXNjb3BlLmlzT2JqZWN0KHRoaXMub3B0aW9uc1thY3Rpb25dKSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNPcHRpb24gPSB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLmV4dGVuZCh0aGlzT3B0aW9uLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbiA9PT0gJ3NuYXAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc09wdGlvbi5tb2RlID09PSAnZ3JpZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnRhcmdldHMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY3JlYXRlU25hcEdyaWQodXRpbHMuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogdGhpc09wdGlvbi5ncmlkT2Zmc2V0IHx8IHsgeDogMCwgeTogMCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHRoaXNPcHRpb24uZ3JpZCB8fCB7fSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXNPcHRpb24ubW9kZSA9PT0gJ2FuY2hvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnRhcmdldHMgPSB0aGlzT3B0aW9uLmFuY2hvcnM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzT3B0aW9uLm1vZGUgPT09ICdwYXRoJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24udGFyZ2V0cyA9IHRoaXNPcHRpb24ucGF0aHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnZWxlbWVudE9yaWdpbicgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24ucmVsYXRpdmVQb2ludHMgPSBbb3B0aW9ucy5lbGVtZW50T3JpZ2luXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi5lbmFibGVkID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJldCA9IHt9LFxuICAgICAgICAgICAgYWxsQWN0aW9ucyA9IFsnZHJhZycsICdyZXNpemUnLCAnZ2VzdHVyZSddO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhbGxBY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9uIGluIHNjb3BlLmRlZmF1bHRPcHRpb25zW2FsbEFjdGlvbnNbaV1dKSB7XG4gICAgICAgICAgICAgICAgcmV0W2FsbEFjdGlvbnNbaV1dID0gdGhpcy5vcHRpb25zW2FsbEFjdGlvbnNbaV1dW29wdGlvbl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG5cblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuaW5lcnRpYVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZC4gQWRkIGFuIGBpbmVydGlhYCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3QgcGFzc2VkXG4gICAgICogdG8gQEludGVyYWN0YWJsZS5kcmFnZ2FibGUgb3IgQEludGVyYWN0YWJsZS5yZXNpemFibGUgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyBpZiBhbmQgaG93IGV2ZW50cyBjb250aW51ZSB0byBydW4gYWZ0ZXIgdGhlIHBvaW50ZXIgaXMgcmVsZWFzZWRcbiAgICAgKipcbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgYGZhbHNlYCBpZiBpbmVydGlhIGlzIGRpc2FibGVkOyBgb2JqZWN0YCB3aXRoIGluZXJ0aWEgcHJvcGVydGllcyBpZiBpbmVydGlhIGlzIGVuYWJsZWRcbiAgICAgKipcbiAgICAgKiBvclxuICAgICAqKlxuICAgICAtIG9wdGlvbnMgKG9iamVjdCB8IGJvb2xlYW4gfCBudWxsKSAjb3B0aW9uYWxcbiAgICAgPSAoSW50ZXJhY3RhYmxlKSB0aGlzIEludGVyYWN0YWJsZVxuICAgICA+IFVzYWdlXG4gICAgIHwgLy8gZW5hYmxlIGFuZCB1c2UgZGVmYXVsdCBzZXR0aW5nc1xuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmluZXJ0aWEodHJ1ZSk7XG4gICAgIHxcbiAgICAgfCAvLyBlbmFibGUgYW5kIHVzZSBjdXN0b20gc2V0dGluZ3NcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pbmVydGlhKHtcbiAgICAgfCAgICAgLy8gdmFsdWUgZ3JlYXRlciB0aGFuIDBcbiAgICAgfCAgICAgLy8gaGlnaCB2YWx1ZXMgc2xvdyB0aGUgb2JqZWN0IGRvd24gbW9yZSBxdWlja2x5XG4gICAgIHwgICAgIHJlc2lzdGFuY2UgICAgIDogMTYsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gdGhlIG1pbmltdW0gbGF1bmNoIHNwZWVkIChwaXhlbHMgcGVyIHNlY29uZCkgdGhhdCByZXN1bHRzIGluIGluZXJ0aWEgc3RhcnRcbiAgICAgfCAgICAgbWluU3BlZWQgICAgICAgOiAyMDAsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gaW5lcnRpYSB3aWxsIHN0b3Agd2hlbiB0aGUgb2JqZWN0IHNsb3dzIGRvd24gdG8gdGhpcyBzcGVlZFxuICAgICB8ICAgICBlbmRTcGVlZCAgICAgICA6IDIwLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGJvb2xlYW47IHNob3VsZCBhY3Rpb25zIGJlIHJlc3VtZWQgd2hlbiB0aGUgcG9pbnRlciBnb2VzIGRvd24gZHVyaW5nIGluZXJ0aWFcbiAgICAgfCAgICAgYWxsb3dSZXN1bWUgICAgOiB0cnVlLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGJvb2xlYW47IHNob3VsZCB0aGUganVtcCB3aGVuIHJlc3VtaW5nIGZyb20gaW5lcnRpYSBiZSBpZ25vcmVkIGluIGV2ZW50LmR4L2R5XG4gICAgIHwgICAgIHplcm9SZXN1bWVEZWx0YTogZmFsc2UsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gaWYgc25hcC9yZXN0cmljdCBhcmUgc2V0IHRvIGJlIGVuZE9ubHkgYW5kIGluZXJ0aWEgaXMgZW5hYmxlZCwgcmVsZWFzaW5nXG4gICAgIHwgICAgIC8vIHRoZSBwb2ludGVyIHdpdGhvdXQgdHJpZ2dlcmluZyBpbmVydGlhIHdpbGwgYW5pbWF0ZSBmcm9tIHRoZSByZWxlYXNlXG4gICAgIHwgICAgIC8vIHBvaW50IHRvIHRoZSBzbmFwZWQvcmVzdHJpY3RlZCBwb2ludCBpbiB0aGUgZ2l2ZW4gYW1vdW50IG9mIHRpbWUgKG1zKVxuICAgICB8ICAgICBzbW9vdGhFbmREdXJhdGlvbjogMzAwLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGFuIGFycmF5IG9mIGFjdGlvbiB0eXBlcyB0aGF0IGNhbiBoYXZlIGluZXJ0aWEgKG5vIGdlc3R1cmUpXG4gICAgIHwgICAgIGFjdGlvbnMgICAgICAgIDogWydkcmFnJywgJ3Jlc2l6ZSddXG4gICAgIHwgfSk7XG4gICAgIHxcbiAgICAgfCAvLyByZXNldCBjdXN0b20gc2V0dGluZ3MgYW5kIHVzZSBhbGwgZGVmYXVsdHNcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pbmVydGlhKG51bGwpO1xuICAgICBcXCovXG4gICAgaW5lcnRpYTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJldCA9IHRoaXMuc2V0T3B0aW9ucygnaW5lcnRpYScsIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmIChyZXQgPT09IHRoaXMpIHsgcmV0dXJuIHRoaXM7IH1cblxuICAgICAgICByZXR1cm4gcmV0LmRyYWc7XG4gICAgfSxcblxuICAgIGdldEFjdGlvbjogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBpbnRlcmFjdGlvbiwgZWxlbWVudCkge1xuICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5kZWZhdWx0QWN0aW9uQ2hlY2tlcihwb2ludGVyLCBpbnRlcmFjdGlvbiwgZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXIocG9pbnRlciwgZXZlbnQsIGFjdGlvbiwgdGhpcywgZWxlbWVudCwgaW50ZXJhY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFjdGlvbjtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEFjdGlvbkNoZWNrZXI6IGRlZmF1bHRBY3Rpb25DaGVja2VyLFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5hY3Rpb25DaGVja2VyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjaGVjayBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uXG4gICAgICogcG9pbnRlckRvd25cbiAgICAgKlxuICAgICAtIGNoZWNrZXIgKGZ1bmN0aW9uIHwgbnVsbCkgI29wdGlvbmFsIEEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgYSBwb2ludGVyIGV2ZW50LCBkZWZhdWx0QWN0aW9uIHN0cmluZywgaW50ZXJhY3RhYmxlLCBlbGVtZW50IGFuZCBpbnRlcmFjdGlvbiBhcyBwYXJhbWV0ZXJzIGFuZCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIG5hbWUgcHJvcGVydHkgJ2RyYWcnICdyZXNpemUnIG9yICdnZXN0dXJlJyBhbmQgb3B0aW9uYWxseSBhbiBgZWRnZXNgIG9iamVjdCB3aXRoIGJvb2xlYW4gJ3RvcCcsICdsZWZ0JywgJ2JvdHRvbScgYW5kIHJpZ2h0IHByb3BzLlxuICAgICA9IChGdW5jdGlvbiB8IEludGVyYWN0YWJsZSkgVGhlIGNoZWNrZXIgZnVuY3Rpb24gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICB8IGludGVyYWN0KCcucmVzaXplLWRyYWcnKVxuICAgICB8ICAgLnJlc2l6YWJsZSh0cnVlKVxuICAgICB8ICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgICB8ICAgLmFjdGlvbkNoZWNrZXIoZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudCwgaW50ZXJhY3Rpb24pIHtcbiAgICAgfFxuICAgICB8ICAgaWYgKGludGVyYWN0Lm1hdGNoZXNTZWxlY3RvcihldmVudC50YXJnZXQsICcuZHJhZy1oYW5kbGUnKSB7XG4gICAgIHwgICAgIC8vIGZvcmNlIGRyYWcgd2l0aCBoYW5kbGUgdGFyZ2V0XG4gICAgIHwgICAgIGFjdGlvbi5uYW1lID0gZHJhZztcbiAgICAgfCAgIH1cbiAgICAgfCAgIGVsc2Uge1xuICAgICB8ICAgICAvLyByZXNpemUgZnJvbSB0aGUgdG9wIGFuZCByaWdodCBlZGdlc1xuICAgICB8ICAgICBhY3Rpb24ubmFtZSAgPSAncmVzaXplJztcbiAgICAgfCAgICAgYWN0aW9uLmVkZ2VzID0geyB0b3A6IHRydWUsIHJpZ2h0OiB0cnVlIH07XG4gICAgIHwgICB9XG4gICAgIHxcbiAgICAgfCAgIHJldHVybiBhY3Rpb247XG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICBhY3Rpb25DaGVja2VyOiBmdW5jdGlvbiAoY2hlY2tlcikge1xuICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihjaGVja2VyKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXIgPSBjaGVja2VyO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXI7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmdldFJlY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgZnVuY3Rpb24gdG8gZ2V0IGFuIEludGVyYWN0YWJsZXMgYm91bmRpbmcgcmVjdC4gQ2FuIGJlXG4gICAgICogb3ZlcnJpZGRlbiB1c2luZyBASW50ZXJhY3RhYmxlLnJlY3RDaGVja2VyLlxuICAgICAqXG4gICAgIC0gZWxlbWVudCAoRWxlbWVudCkgI29wdGlvbmFsIFRoZSBlbGVtZW50IHRvIG1lYXN1cmUuXG4gICAgID0gKG9iamVjdCkgVGhlIG9iamVjdCdzIGJvdW5kaW5nIHJlY3RhbmdsZS5cbiAgICAgbyB7XG4gICAgIG8gICAgIHRvcCAgIDogMCxcbiAgICAgbyAgICAgbGVmdCAgOiAwLFxuICAgICBvICAgICBib3R0b206IDAsXG4gICAgIG8gICAgIHJpZ2h0IDogMCxcbiAgICAgbyAgICAgd2lkdGggOiAwLFxuICAgICBvICAgICBoZWlnaHQ6IDBcbiAgICAgbyB9XG4gICAgIFxcKi9cbiAgICBnZXRSZWN0OiBmdW5jdGlvbiByZWN0Q2hlY2sgKGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgdGhpcy5fZWxlbWVudDtcblxuICAgICAgICBpZiAodGhpcy5zZWxlY3RvciAmJiAhKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSB0aGlzLl9jb250ZXh0LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3Rvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2NvcGUuZ2V0RWxlbWVudFJlY3QoZWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUucmVjdENoZWNrZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHRoZSBmdW5jdGlvbiB1c2VkIHRvIGNhbGN1bGF0ZSB0aGUgaW50ZXJhY3RhYmxlJ3NcbiAgICAgKiBlbGVtZW50J3MgcmVjdGFuZ2xlXG4gICAgICpcbiAgICAgLSBjaGVja2VyIChmdW5jdGlvbikgI29wdGlvbmFsIEEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGlzIEludGVyYWN0YWJsZSdzIGJvdW5kaW5nIHJlY3RhbmdsZS4gU2VlIEBJbnRlcmFjdGFibGUuZ2V0UmVjdFxuICAgICA9IChmdW5jdGlvbiB8IG9iamVjdCkgVGhlIGNoZWNrZXIgZnVuY3Rpb24gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIHJlY3RDaGVja2VyOiBmdW5jdGlvbiAoY2hlY2tlcikge1xuICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihjaGVja2VyKSkge1xuICAgICAgICAgICAgdGhpcy5nZXRSZWN0ID0gY2hlY2tlcjtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5nZXRSZWN0O1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFJlY3Q7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuc3R5bGVDdXJzb3JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdGhlIGFjdGlvbiB0aGF0IHdvdWxkIGJlIHBlcmZvcm1lZCB3aGVuIHRoZVxuICAgICAqIG1vdXNlIG9uIHRoZSBlbGVtZW50IGFyZSBjaGVja2VkIG9uIGBtb3VzZW1vdmVgIHNvIHRoYXQgdGhlIGN1cnNvclxuICAgICAqIG1heSBiZSBzdHlsZWQgYXBwcm9wcmlhdGVseVxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbFxuICAgICA9IChib29sZWFuIHwgSW50ZXJhY3RhYmxlKSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBzdHlsZUN1cnNvcjogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3IgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3I7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvcjtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5wcmV2ZW50RGVmYXVsdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0byBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICAgKiBpbiByZXNwb25zZSB0byBwb2ludGVyIGV2ZW50cy4gQ2FuIGJlIHNldCB0bzpcbiAgICAgKiAgLSBgJ2Fsd2F5cydgIHRvIGFsd2F5cyBwcmV2ZW50XG4gICAgICogIC0gYCduZXZlcidgIHRvIG5ldmVyIHByZXZlbnRcbiAgICAgKiAgLSBgJ2F1dG8nYCB0byBsZXQgaW50ZXJhY3QuanMgdHJ5IHRvIGRldGVybWluZSB3aGF0IHdvdWxkIGJlIGJlc3RcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChzdHJpbmcpICNvcHRpb25hbCBgdHJ1ZWAsIGBmYWxzZWAgb3IgYCdhdXRvJ2BcbiAgICAgPSAoc3RyaW5nIHwgSW50ZXJhY3RhYmxlKSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmICgvXihhbHdheXN8bmV2ZXJ8YXV0bykkLy50ZXN0KG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnByZXZlbnREZWZhdWx0ID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucHJldmVudERlZmF1bHQgPSBuZXdWYWx1ZT8gJ2Fsd2F5cycgOiAnbmV2ZXInO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnByZXZlbnREZWZhdWx0O1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLm9yaWdpblxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIG9yaWdpbiBvZiB0aGUgSW50ZXJhY3RhYmxlJ3MgZWxlbWVudC4gIFRoZSB4IGFuZCB5XG4gICAgICogb2YgdGhlIG9yaWdpbiB3aWxsIGJlIHN1YnRyYWN0ZWQgZnJvbSBhY3Rpb24gZXZlbnQgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgLSBvcmlnaW4gKG9iamVjdCB8IHN0cmluZykgI29wdGlvbmFsIEFuIG9iamVjdCBlZy4geyB4OiAwLCB5OiAwIH0gb3Igc3RyaW5nICdwYXJlbnQnLCAnc2VsZicgb3IgYW55IENTUyBzZWxlY3RvclxuICAgICAqIE9SXG4gICAgIC0gb3JpZ2luIChFbGVtZW50KSAjb3B0aW9uYWwgQW4gSFRNTCBvciBTVkcgRWxlbWVudCB3aG9zZSByZWN0IHdpbGwgYmUgdXNlZFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIFRoZSBjdXJyZW50IG9yaWdpbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgb3JpZ2luOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKHNjb3BlLnRyeVNlbGVjdG9yKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLm9yaWdpbiA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2NvcGUuaXNPYmplY3QobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMub3JpZ2luID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMub3JpZ2luO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmRlbHRhU291cmNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgbW91c2UgY29vcmRpbmF0ZSB0eXBlcyB1c2VkIHRvIGNhbGN1bGF0ZSB0aGVcbiAgICAgKiBtb3ZlbWVudCBvZiB0aGUgcG9pbnRlci5cbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChzdHJpbmcpICNvcHRpb25hbCBVc2UgJ2NsaWVudCcgaWYgeW91IHdpbGwgYmUgc2Nyb2xsaW5nIHdoaWxlIGludGVyYWN0aW5nOyBVc2UgJ3BhZ2UnIGlmIHlvdSB3YW50IGF1dG9TY3JvbGwgdG8gd29ya1xuICAgICA9IChzdHJpbmcgfCBvYmplY3QpIFRoZSBjdXJyZW50IGRlbHRhU291cmNlIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBkZWx0YVNvdXJjZTogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gJ3BhZ2UnIHx8IG5ld1ZhbHVlID09PSAnY2xpZW50Jykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRlbHRhU291cmNlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5yZXN0cmljdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZC4gQWRkIGEgYHJlc3RyaWN0YCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3QgcGFzc2VkIHRvXG4gICAgICogQEludGVyYWN0YWJsZS5kcmFnZ2FibGUsIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIG9yIEBJbnRlcmFjdGFibGUuZ2VzdHVyYWJsZSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHRoZSByZWN0YW5nbGVzIHdpdGhpbiB3aGljaCBhY3Rpb25zIG9uIHRoaXNcbiAgICAgKiBpbnRlcmFjdGFibGUgKGFmdGVyIHNuYXAgY2FsY3VsYXRpb25zKSBhcmUgcmVzdHJpY3RlZC4gQnkgZGVmYXVsdCxcbiAgICAgKiByZXN0cmljdGluZyBpcyByZWxhdGl2ZSB0byB0aGUgcG9pbnRlciBjb29yZGluYXRlcy4gWW91IGNhbiBjaGFuZ2VcbiAgICAgKiB0aGlzIGJ5IHNldHRpbmcgdGhlXG4gICAgICogW2BlbGVtZW50UmVjdGBdKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL3B1bGwvNzIpLlxuICAgICAqKlxuICAgICAtIG9wdGlvbnMgKG9iamVjdCkgI29wdGlvbmFsIGFuIG9iamVjdCB3aXRoIGtleXMgZHJhZywgcmVzaXplLCBhbmQvb3IgZ2VzdHVyZSB3aG9zZSB2YWx1ZXMgYXJlIHJlY3RzLCBFbGVtZW50cywgQ1NTIHNlbGVjdG9ycywgb3IgJ3BhcmVudCcgb3IgJ3NlbGYnXG4gICAgID0gKG9iamVjdCkgVGhlIGN1cnJlbnQgcmVzdHJpY3Rpb25zIG9iamVjdCBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqKlxuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLnJlc3RyaWN0KHtcbiAgICAgfCAgICAgLy8gdGhlIHJlY3Qgd2lsbCBiZSBgaW50ZXJhY3QuZ2V0RWxlbWVudFJlY3QoZWxlbWVudC5wYXJlbnROb2RlKWBcbiAgICAgfCAgICAgZHJhZzogZWxlbWVudC5wYXJlbnROb2RlLFxuICAgICB8XG4gICAgIHwgICAgIC8vIHggYW5kIHkgYXJlIHJlbGF0aXZlIHRvIHRoZSB0aGUgaW50ZXJhY3RhYmxlJ3Mgb3JpZ2luXG4gICAgIHwgICAgIHJlc2l6ZTogeyB4OiAxMDAsIHk6IDEwMCwgd2lkdGg6IDIwMCwgaGVpZ2h0OiAyMDAgfVxuICAgICB8IH0pXG4gICAgIHxcbiAgICAgfCBpbnRlcmFjdCgnLmRyYWdnYWJsZScpLnJlc3RyaWN0KHtcbiAgICAgfCAgICAgLy8gdGhlIHJlY3Qgd2lsbCBiZSB0aGUgc2VsZWN0ZWQgZWxlbWVudCdzIHBhcmVudFxuICAgICB8ICAgICBkcmFnOiAncGFyZW50JyxcbiAgICAgfFxuICAgICB8ICAgICAvLyBkbyBub3QgcmVzdHJpY3QgZHVyaW5nIG5vcm1hbCBtb3ZlbWVudC5cbiAgICAgfCAgICAgLy8gSW5zdGVhZCwgdHJpZ2dlciBvbmx5IG9uZSByZXN0cmljdGVkIG1vdmUgZXZlbnRcbiAgICAgfCAgICAgLy8gaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBlbmQgZXZlbnQuXG4gICAgIHwgICAgIGVuZE9ubHk6IHRydWUsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvcHVsbC83MiNpc3N1ZS00MTgxMzQ5M1xuICAgICB8ICAgICBlbGVtZW50UmVjdDogeyB0b3A6IDAsIGxlZnQ6IDAsIGJvdHRvbTogMSwgcmlnaHQ6IDEgfVxuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgcmVzdHJpY3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmICghc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldE9wdGlvbnMoJ3Jlc3RyaWN0Jywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWN0aW9ucyA9IFsnZHJhZycsICdyZXNpemUnLCAnZ2VzdHVyZSddLFxuICAgICAgICAgICAgcmV0O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFjdGlvbnNbaV07XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb24gaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBwZXJBY3Rpb24gPSB1dGlscy5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbYWN0aW9uXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3Rpb246IG9wdGlvbnNbYWN0aW9uXVxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgcmV0ID0gdGhpcy5zZXRPcHRpb25zKCdyZXN0cmljdCcsIHBlckFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmNvbnRleHRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyB0aGUgc2VsZWN0b3IgY29udGV4dCBOb2RlIG9mIHRoZSBJbnRlcmFjdGFibGUuIFRoZSBkZWZhdWx0IGlzIGB3aW5kb3cuZG9jdW1lbnRgLlxuICAgICAqXG4gICAgID0gKE5vZGUpIFRoZSBjb250ZXh0IE5vZGUgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKipcbiAgICAgXFwqL1xuICAgIGNvbnRleHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgfSxcblxuICAgIF9jb250ZXh0OiBzY29wZS5kb2N1bWVudCxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuaWdub3JlRnJvbVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBJZiB0aGUgdGFyZ2V0IG9mIHRoZSBgbW91c2Vkb3duYCwgYHBvaW50ZXJkb3duYCBvciBgdG91Y2hzdGFydGBcbiAgICAgKiBldmVudCBvciBhbnkgb2YgaXQncyBwYXJlbnRzIG1hdGNoIHRoZSBnaXZlbiBDU1Mgc2VsZWN0b3Igb3JcbiAgICAgKiBFbGVtZW50LCBubyBkcmFnL3Jlc2l6ZS9nZXN0dXJlIGlzIHN0YXJ0ZWQuXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoc3RyaW5nIHwgRWxlbWVudCB8IG51bGwpICNvcHRpb25hbCBhIENTUyBzZWxlY3RvciBzdHJpbmcsIGFuIEVsZW1lbnQgb3IgYG51bGxgIHRvIG5vdCBpZ25vcmUgYW55IGVsZW1lbnRzXG4gICAgID0gKHN0cmluZyB8IEVsZW1lbnQgfCBvYmplY3QpIFRoZSBjdXJyZW50IGlnbm9yZUZyb20gdmFsdWUgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50LCB7IGlnbm9yZUZyb206IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduby1hY3Rpb24nKSB9KTtcbiAgICAgfCAvLyBvclxuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmlnbm9yZUZyb20oJ2lucHV0LCB0ZXh0YXJlYSwgYScpO1xuICAgICBcXCovXG4gICAgaWdub3JlRnJvbTogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihuZXdWYWx1ZSkpIHsgICAgICAgICAgICAvLyBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaWdub3JlRnJvbSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbHMuaXNFbGVtZW50KG5ld1ZhbHVlKSkgeyAgICAgICAgICAgICAgLy8gc3BlY2lmaWMgZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmlnbm9yZUZyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5pZ25vcmVGcm9tO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmFsbG93RnJvbVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBBIGRyYWcvcmVzaXplL2dlc3R1cmUgaXMgc3RhcnRlZCBvbmx5IElmIHRoZSB0YXJnZXQgb2YgdGhlXG4gICAgICogYG1vdXNlZG93bmAsIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgIGV2ZW50IG9yIGFueSBvZiBpdCdzXG4gICAgICogcGFyZW50cyBtYXRjaCB0aGUgZ2l2ZW4gQ1NTIHNlbGVjdG9yIG9yIEVsZW1lbnQuXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoc3RyaW5nIHwgRWxlbWVudCB8IG51bGwpICNvcHRpb25hbCBhIENTUyBzZWxlY3RvciBzdHJpbmcsIGFuIEVsZW1lbnQgb3IgYG51bGxgIHRvIGFsbG93IGZyb20gYW55IGVsZW1lbnRcbiAgICAgPSAoc3RyaW5nIHwgRWxlbWVudCB8IG9iamVjdCkgVGhlIGN1cnJlbnQgYWxsb3dGcm9tIHZhbHVlIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICoqXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCwgeyBhbGxvd0Zyb206IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcmFnLWhhbmRsZScpIH0pO1xuICAgICB8IC8vIG9yXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuYWxsb3dGcm9tKCcuaGFuZGxlJyk7XG4gICAgIFxcKi9cbiAgICBhbGxvd0Zyb206IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUudHJ5U2VsZWN0b3IobmV3VmFsdWUpKSB7ICAgICAgICAgICAgLy8gQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIGV2ZW50LnRhcmdldFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFsbG93RnJvbSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbHMuaXNFbGVtZW50KG5ld1ZhbHVlKSkgeyAgICAgICAgICAgICAgLy8gc3BlY2lmaWMgZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFsbG93RnJvbSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmFsbG93RnJvbTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5lbGVtZW50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIElmIHRoaXMgaXMgbm90IGEgc2VsZWN0b3IgSW50ZXJhY3RhYmxlLCBpdCByZXR1cm5zIHRoZSBlbGVtZW50IHRoaXNcbiAgICAgKiBpbnRlcmFjdGFibGUgcmVwcmVzZW50c1xuICAgICAqXG4gICAgID0gKEVsZW1lbnQpIEhUTUwgLyBTVkcgRWxlbWVudFxuICAgICBcXCovXG4gICAgZWxlbWVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5maXJlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIENhbGxzIGxpc3RlbmVycyBmb3IgdGhlIGdpdmVuIEludGVyYWN0RXZlbnQgdHlwZSBib3VuZCBnbG9iYWxseVxuICAgICAqIGFuZCBkaXJlY3RseSB0byB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgIC0gaUV2ZW50IChJbnRlcmFjdEV2ZW50KSBUaGUgSW50ZXJhY3RFdmVudCBvYmplY3QgdG8gYmUgZmlyZWQgb24gdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgPSAoSW50ZXJhY3RhYmxlKSB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgZmlyZTogZnVuY3Rpb24gKGlFdmVudCkge1xuICAgICAgICBpZiAoIShpRXZlbnQgJiYgaUV2ZW50LnR5cGUpIHx8ICFzY29wZS5jb250YWlucyhzY29wZS5ldmVudFR5cGVzLCBpRXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxpc3RlbmVycyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBvbkV2ZW50ID0gJ29uJyArIGlFdmVudC50eXBlLFxuICAgICAgICAgICAgZnVuY05hbWUgPSAnJztcblxuICAgICAgICAvLyBJbnRlcmFjdGFibGUjb24oKSBsaXN0ZW5lcnNcbiAgICAgICAgaWYgKGlFdmVudC50eXBlIGluIHRoaXMuX2lFdmVudHMpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycyA9IHRoaXMuX2lFdmVudHNbaUV2ZW50LnR5cGVdO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuICYmICFpRXZlbnQuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmdW5jTmFtZSA9IGxpc3RlbmVyc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXShpRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaW50ZXJhY3RhYmxlLm9uZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24odGhpc1tvbkV2ZW50XSkpIHtcbiAgICAgICAgICAgIGZ1bmNOYW1lID0gdGhpc1tvbkV2ZW50XS5uYW1lO1xuICAgICAgICAgICAgdGhpc1tvbkV2ZW50XShpRXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaW50ZXJhY3Qub24oKSBsaXN0ZW5lcnNcbiAgICAgICAgaWYgKGlFdmVudC50eXBlIGluIHNjb3BlLmdsb2JhbEV2ZW50cyAmJiAobGlzdGVuZXJzID0gc2NvcGUuZ2xvYmFsRXZlbnRzW2lFdmVudC50eXBlXSkpICB7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW4gJiYgIWlFdmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGZ1bmNOYW1lID0gbGlzdGVuZXJzW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2ldKGlFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBCaW5kcyBhIGxpc3RlbmVyIGZvciBhbiBJbnRlcmFjdEV2ZW50IG9yIERPTSBldmVudC5cbiAgICAgKlxuICAgICAtIGV2ZW50VHlwZSAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRvIGxpc3RlbiBmb3JcbiAgICAgLSBsaXN0ZW5lciAgIChmdW5jdGlvbikgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiB0aGUgZ2l2ZW4gZXZlbnQocylcbiAgICAgLSB1c2VDYXB0dXJlIChib29sZWFuKSAjb3B0aW9uYWwgdXNlQ2FwdHVyZSBmbGFnIGZvciBhZGRFdmVudExpc3RlbmVyXG4gICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIG9uOiBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBpZiAoc2NvcGUuaXNTdHJpbmcoZXZlbnRUeXBlKSAmJiBldmVudFR5cGUuc2VhcmNoKCcgJykgIT09IC0xKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGUudHJpbSgpLnNwbGl0KC8gKy8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQXJyYXkoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGV2ZW50VHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMub24oZXZlbnRUeXBlW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbihwcm9wLCBldmVudFR5cGVbcHJvcF0sIGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnd2hlZWwnKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBzY29wZS53aGVlbEV2ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29udmVydCB0byBib29sZWFuXG4gICAgICAgIHVzZUNhcHR1cmUgPSB1c2VDYXB0dXJlPyB0cnVlOiBmYWxzZTtcblxuICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuZXZlbnRUeXBlcywgZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyB0eXBlIG9mIGV2ZW50IHdhcyBuZXZlciBib3VuZCB0byB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICAgICAgaWYgKCEoZXZlbnRUeXBlIGluIHRoaXMuX2lFdmVudHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faUV2ZW50c1tldmVudFR5cGVdID0gW2xpc3RlbmVyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lFdmVudHNbZXZlbnRUeXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBkZWxlZ2F0ZWQgZXZlbnQgZm9yIHNlbGVjdG9yXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGlmICghc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0pIHtcbiAgICAgICAgICAgICAgICBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbZXZlbnRUeXBlXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3JzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dHMgOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBhZGQgZGVsZWdhdGUgbGlzdGVuZXIgZnVuY3Rpb25zXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNjb3BlLmRvY3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBldmVudHMuYWRkKHNjb3BlLmRvY3VtZW50c1tpXSwgZXZlbnRUeXBlLCBsaXN0ZW5lci5kZWxlZ2F0ZUxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZChzY29wZS5kb2N1bWVudHNbaV0sIGV2ZW50VHlwZSwgbGlzdGVuZXIuZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBkZWxlZ2F0ZWQgPSBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbZXZlbnRUeXBlXSxcbiAgICAgICAgICAgICAgICBpbmRleDtcblxuICAgICAgICAgICAgZm9yIChpbmRleCA9IGRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoIC0gMTsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzW2luZGV4XSA9PT0gdGhpcy5zZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAmJiBkZWxlZ2F0ZWQuY29udGV4dHNbaW5kZXhdID09PSB0aGlzLl9jb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuc2VsZWN0b3JzLnB1c2godGhpcy5zZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzIC5wdXNoKHRoaXMuX2NvbnRleHQpO1xuICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMucHVzaChbXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGtlZXAgbGlzdGVuZXIgYW5kIHVzZUNhcHR1cmUgZmxhZ1xuICAgICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVyc1tpbmRleF0ucHVzaChbbGlzdGVuZXIsIHVzZUNhcHR1cmVdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgZXZlbnRUeXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5vZmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmVtb3ZlcyBhbiBJbnRlcmFjdEV2ZW50IG9yIERPTSBldmVudCBsaXN0ZW5lclxuICAgICAqXG4gICAgIC0gZXZlbnRUeXBlICAoc3RyaW5nIHwgYXJyYXkgfCBvYmplY3QpIFRoZSB0eXBlcyBvZiBldmVudHMgdGhhdCB3ZXJlIGxpc3RlbmVkIGZvclxuICAgICAtIGxpc3RlbmVyICAgKGZ1bmN0aW9uKSBUaGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gYmUgcmVtb3ZlZFxuICAgICAtIHVzZUNhcHR1cmUgKGJvb2xlYW4pICNvcHRpb25hbCB1c2VDYXB0dXJlIGZsYWcgZm9yIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgb2ZmOiBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBpZiAoc2NvcGUuaXNTdHJpbmcoZXZlbnRUeXBlKSAmJiBldmVudFR5cGUuc2VhcmNoKCcgJykgIT09IC0xKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGUudHJpbSgpLnNwbGl0KC8gKy8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQXJyYXkoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGV2ZW50VHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmKGV2ZW50VHlwZVtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdChldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGV2ZW50VHlwZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmKHByb3AsIGV2ZW50VHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBldmVudExpc3QsXG4gICAgICAgICAgICBpbmRleCA9IC0xO1xuXG4gICAgICAgIC8vIGNvbnZlcnQgdG8gYm9vbGVhblxuICAgICAgICB1c2VDYXB0dXJlID0gdXNlQ2FwdHVyZT8gdHJ1ZTogZmFsc2U7XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ3doZWVsJykge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gc2NvcGUud2hlZWxFdmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIGl0IGlzIGFuIGFjdGlvbiBldmVudCB0eXBlXG4gICAgICAgIGlmIChzY29wZS5jb250YWlucyhzY29wZS5ldmVudFR5cGVzLCBldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBldmVudExpc3QgPSB0aGlzLl9pRXZlbnRzW2V2ZW50VHlwZV07XG5cbiAgICAgICAgICAgIGlmIChldmVudExpc3QgJiYgKGluZGV4ID0gc2NvcGUuaW5kZXhPZihldmVudExpc3QsIGxpc3RlbmVyKSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faUV2ZW50c1tldmVudFR5cGVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZGVsZWdhdGVkIGV2ZW50XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHZhciBkZWxlZ2F0ZWQgPSBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbZXZlbnRUeXBlXSxcbiAgICAgICAgICAgICAgICBtYXRjaEZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICghZGVsZWdhdGVkKSB7IHJldHVybiB0aGlzOyB9XG5cbiAgICAgICAgICAgIC8vIGNvdW50IGZyb20gbGFzdCBpbmRleCBvZiBkZWxlZ2F0ZWQgdG8gMFxuICAgICAgICAgICAgZm9yIChpbmRleCA9IGRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoIC0gMTsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgICAgICAgICAgIC8vIGxvb2sgZm9yIG1hdGNoaW5nIHNlbGVjdG9yIGFuZCBjb250ZXh0IE5vZGVcbiAgICAgICAgICAgICAgICBpZiAoZGVsZWdhdGVkLnNlbGVjdG9yc1tpbmRleF0gPT09IHRoaXMuc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgJiYgZGVsZWdhdGVkLmNvbnRleHRzW2luZGV4XSA9PT0gdGhpcy5fY29udGV4dCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSBkZWxlZ2F0ZWQubGlzdGVuZXJzW2luZGV4XTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBlYWNoIGl0ZW0gb2YgdGhlIGxpc3RlbmVycyBhcnJheSBpcyBhbiBhcnJheTogW2Z1bmN0aW9uLCB1c2VDYXB0dXJlRmxhZ11cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBsaXN0ZW5lcnNbaV1bMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlQ2FwID0gbGlzdGVuZXJzW2ldWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zIGFuZCB1c2VDYXB0dXJlIGZsYWdzIG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm4gPT09IGxpc3RlbmVyICYmIHVzZUNhcCA9PT0gdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIGFsbCBsaXN0ZW5lcnMgZm9yIHRoaXMgaW50ZXJhY3RhYmxlIGhhdmUgYmVlbiByZW1vdmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBpbnRlcmFjdGFibGUgZnJvbSB0aGUgZGVsZWdhdGVkIGFycmF5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuc2VsZWN0b3JzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0cyAuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBkZWxlZ2F0ZSBmdW5jdGlvbiBmcm9tIGNvbnRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCBldmVudFR5cGUsIGxpc3RlbmVyLmRlbGVnYXRlTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIGV2ZW50VHlwZSwgbGlzdGVuZXIuZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGFycmF5cyBpZiB0aGV5IGFyZSBlbXB0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbZXZlbnRUeXBlXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHJlbW92ZSBvbmUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaEZvdW5kKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBmcm9tIHRoaXMgSW50ZXJhdGFibGUncyBlbGVtZW50XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9lbGVtZW50LCBldmVudFR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnNldFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXNldCB0aGUgb3B0aW9ucyBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgICAtIG9wdGlvbnMgKG9iamVjdCkgVGhlIG5ldyBzZXR0aW5ncyB0byBhcHBseVxuICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmx3XG4gICAgIFxcKi9cbiAgICBzZXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmICghc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHV0aWxzLmV4dGVuZCh7fSwgc2NvcGUuZGVmYXVsdE9wdGlvbnMuYmFzZSk7XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBhY3Rpb25zID0gWydkcmFnJywgJ2Ryb3AnLCAncmVzaXplJywgJ2dlc3R1cmUnXSxcbiAgICAgICAgICAgIG1ldGhvZHMgPSBbJ2RyYWdnYWJsZScsICdkcm9wem9uZScsICdyZXNpemFibGUnLCAnZ2VzdHVyYWJsZSddLFxuICAgICAgICAgICAgcGVyQWN0aW9ucyA9IHV0aWxzLmV4dGVuZCh1dGlscy5leHRlbmQoe30sIHNjb3BlLmRlZmF1bHRPcHRpb25zLnBlckFjdGlvbiksIG9wdGlvbnNbYWN0aW9uXSB8fCB7fSk7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXSA9IHV0aWxzLmV4dGVuZCh7fSwgc2NvcGUuZGVmYXVsdE9wdGlvbnNbYWN0aW9uXSk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0UGVyQWN0aW9uKGFjdGlvbiwgcGVyQWN0aW9ucyk7XG5cbiAgICAgICAgICAgIHRoaXNbbWV0aG9kc1tpXV0ob3B0aW9uc1thY3Rpb25dKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IFtcbiAgICAgICAgICAgICdhY2NlcHQnLCAnYWN0aW9uQ2hlY2tlcicsICdhbGxvd0Zyb20nLCAnZGVsdGFTb3VyY2UnLFxuICAgICAgICAgICAgJ2Ryb3BDaGVja2VyJywgJ2lnbm9yZUZyb20nLCAnb3JpZ2luJywgJ3ByZXZlbnREZWZhdWx0JyxcbiAgICAgICAgICAgICdyZWN0Q2hlY2tlcidcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzZXR0aW5ncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSBzZXR0aW5nc1tpXTtcblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW3NldHRpbmddID0gc2NvcGUuZGVmYXVsdE9wdGlvbnMuYmFzZVtzZXR0aW5nXTtcblxuICAgICAgICAgICAgaWYgKHNldHRpbmcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHRoaXNbc2V0dGluZ10ob3B0aW9uc1tzZXR0aW5nXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS51bnNldFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZW1vdmUgdGhpcyBpbnRlcmFjdGFibGUgZnJvbSB0aGUgbGlzdCBvZiBpbnRlcmFjdGFibGVzIGFuZCByZW1vdmVcbiAgICAgKiBpdCdzIGRyYWcsIGRyb3AsIHJlc2l6ZSBhbmQgZ2VzdHVyZSBjYXBhYmlsaXRpZXNcbiAgICAgKlxuICAgICBcXCovXG4gICAgdW5zZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9lbGVtZW50LCAnYWxsJyk7XG5cbiAgICAgICAgaWYgKCFzY29wZS5pc1N0cmluZyh0aGlzLnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLCAnYWxsJyk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zdHlsZS5jdXJzb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBkZWxlZ2F0ZWQgZXZlbnRzXG4gICAgICAgICAgICBmb3IgKHZhciB0eXBlIGluIHNjb3BlLmRlbGVnYXRlZEV2ZW50cykge1xuICAgICAgICAgICAgICAgIHZhciBkZWxlZ2F0ZWQgPSBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbdHlwZV07XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGVnYXRlZC5zZWxlY3RvcnNbaV0gPT09IHRoaXMuc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGRlbGVnYXRlZC5jb250ZXh0c1tpXSA9PT0gdGhpcy5fY29udGV4dCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuc2VsZWN0b3JzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0cyAuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgYXJyYXlzIGlmIHRoZXkgYXJlIGVtcHR5XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuZGVsZWdhdGVkRXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgdHlwZSwgbGlzdGVuZXIuZGVsZWdhdGVMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgdHlwZSwgbGlzdGVuZXIuZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRyb3B6b25lKGZhbHNlKTtcblxuICAgICAgICBzY29wZS5pbnRlcmFjdGFibGVzLnNwbGljZShzY29wZS5pbmRleE9mKHNjb3BlLmludGVyYWN0YWJsZXMsIHRoaXMpLCAxKTtcbiAgICB9XG59O1xuXG5JbnRlcmFjdGFibGUucHJvdG90eXBlLnNuYXAgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLnNuYXAsXG4gICAgJ0ludGVyYWN0YWJsZSNzbmFwIGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIHNuYXBwaW5nIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3Mvc25hcHBpbmcnKTtcbkludGVyYWN0YWJsZS5wcm90b3R5cGUucmVzdHJpY3QgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc3RyaWN0LFxuICAgICdJbnRlcmFjdGFibGUjcmVzdHJpY3QgaXMgZGVwcmVjYXRlZC4gU2VlIHRoZSBuZXcgZG9jdW1lbnRhdGlvbiBmb3IgcmVzdGljdGluZyBhdCBodHRwOi8vaW50ZXJhY3Rqcy5pby9kb2NzL3Jlc3RyaWN0aW9uJyk7XG5JbnRlcmFjdGFibGUucHJvdG90eXBlLmluZXJ0aWEgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLmluZXJ0aWEsXG4gICAgJ0ludGVyYWN0YWJsZSNpbmVydGlhIGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIGluZXJ0aWEgYXQgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy9pbmVydGlhJyk7XG5JbnRlcmFjdGFibGUucHJvdG90eXBlLmF1dG9TY3JvbGwgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLmF1dG9TY3JvbGwsXG4gICAgJ0ludGVyYWN0YWJsZSNhdXRvU2Nyb2xsIGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIGF1dG9TY3JvbGwgYXQgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy8jYXV0b3Njcm9sbCcpO1xuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zcXVhcmVSZXNpemUgPSB1dGlscy53YXJuT25jZShJbnRlcmFjdGFibGUucHJvdG90eXBlLnNxdWFyZVJlc2l6ZSxcbiAgICAnSW50ZXJhY3RhYmxlI3NxdWFyZVJlc2l6ZSBpcyBkZXByZWNhdGVkLiBTZWUgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy8jcmVzaXplLXNxdWFyZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0YWJsZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBhbmltYXRpb25GcmFtZSA9IHV0aWxzLnJhZjtcbnZhciBJbnRlcmFjdEV2ZW50ID0gcmVxdWlyZSgnLi9JbnRlcmFjdEV2ZW50Jyk7XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcbnZhciBicm93c2VyID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyJyk7XG5cbmZ1bmN0aW9uIEludGVyYWN0aW9uICgpIHtcbiAgICB0aGlzLnRhcmdldCAgICAgICAgICA9IG51bGw7IC8vIGN1cnJlbnQgaW50ZXJhY3RhYmxlIGJlaW5nIGludGVyYWN0ZWQgd2l0aFxuICAgIHRoaXMuZWxlbWVudCAgICAgICAgID0gbnVsbDsgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgICB0aGlzLmRyb3BUYXJnZXQgICAgICA9IG51bGw7IC8vIHRoZSBkcm9wem9uZSBhIGRyYWcgdGFyZ2V0IG1pZ2h0IGJlIGRyb3BwZWQgaW50b1xuICAgIHRoaXMuZHJvcEVsZW1lbnQgICAgID0gbnVsbDsgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcbiAgICB0aGlzLnByZXZEcm9wVGFyZ2V0ICA9IG51bGw7IC8vIHRoZSBkcm9wem9uZSB0aGF0IHdhcyByZWNlbnRseSBkcmFnZ2VkIGF3YXkgZnJvbVxuICAgIHRoaXMucHJldkRyb3BFbGVtZW50ID0gbnVsbDsgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcblxuICAgIHRoaXMucHJlcGFyZWQgICAgICAgID0geyAgICAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgICAgICAgbmFtZSA6IG51bGwsXG4gICAgICAgIGF4aXMgOiBudWxsLFxuICAgICAgICBlZGdlczogbnVsbFxuICAgIH07XG5cbiAgICB0aGlzLm1hdGNoZXMgICAgICAgICA9IFtdOyAgIC8vIGFsbCBzZWxlY3RvcnMgdGhhdCBhcmUgbWF0Y2hlZCBieSB0YXJnZXQgZWxlbWVudFxuICAgIHRoaXMubWF0Y2hFbGVtZW50cyAgID0gW107ICAgLy8gY29ycmVzcG9uZGluZyBlbGVtZW50c1xuXG4gICAgdGhpcy5pbmVydGlhU3RhdHVzID0ge1xuICAgICAgICBhY3RpdmUgICAgICAgOiBmYWxzZSxcbiAgICAgICAgc21vb3RoRW5kICAgIDogZmFsc2UsXG5cbiAgICAgICAgc3RhcnRFdmVudDogbnVsbCxcbiAgICAgICAgdXBDb29yZHM6IHt9LFxuXG4gICAgICAgIHhlOiAwLCB5ZTogMCxcbiAgICAgICAgc3g6IDAsIHN5OiAwLFxuXG4gICAgICAgIHQwOiAwLFxuICAgICAgICB2eDA6IDAsIHZ5czogMCxcbiAgICAgICAgZHVyYXRpb246IDAsXG5cbiAgICAgICAgcmVzdW1lRHg6IDAsXG4gICAgICAgIHJlc3VtZUR5OiAwLFxuXG4gICAgICAgIGxhbWJkYV92MDogMCxcbiAgICAgICAgb25lX3ZlX3YwOiAwLFxuICAgICAgICBpICA6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpKSB7XG4gICAgICAgIHRoaXMuYm91bmRJbmVydGlhRnJhbWUgPSB0aGlzLmluZXJ0aWFGcmFtZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUgPSB0aGlzLnNtb290aEVuZEZyYW1lLmJpbmQodGhpcyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5ib3VuZEluZXJ0aWFGcmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoYXQuaW5lcnRpYUZyYW1lKCk7IH07XG4gICAgICAgIHRoaXMuYm91bmRTbW9vdGhFbmRGcmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoYXQuc21vb3RoRW5kRnJhbWUoKTsgfTtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZURyb3BzID0ge1xuICAgICAgICBkcm9wem9uZXM6IFtdLCAgICAgIC8vIHRoZSBkcm9wem9uZXMgdGhhdCBhcmUgbWVudGlvbmVkIGJlbG93XG4gICAgICAgIGVsZW1lbnRzIDogW10sICAgICAgLy8gZWxlbWVudHMgb2YgZHJvcHpvbmVzIHRoYXQgYWNjZXB0IHRoZSB0YXJnZXQgZHJhZ2dhYmxlXG4gICAgICAgIHJlY3RzICAgIDogW10gICAgICAgLy8gdGhlIHJlY3RzIG9mIHRoZSBlbGVtZW50cyBtZW50aW9uZWQgYWJvdmVcbiAgICB9O1xuXG4gICAgLy8ga2VlcCB0cmFjayBvZiBhZGRlZCBwb2ludGVyc1xuICAgIHRoaXMucG9pbnRlcnMgICAgPSBbXTtcbiAgICB0aGlzLnBvaW50ZXJJZHMgID0gW107XG4gICAgdGhpcy5kb3duVGFyZ2V0cyA9IFtdO1xuICAgIHRoaXMuZG93blRpbWVzICAgPSBbXTtcbiAgICB0aGlzLmhvbGRUaW1lcnMgID0gW107XG5cbiAgICAvLyBQcmV2aW91cyBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgdGhpcy5wcmV2Q29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuICAgIC8vIGN1cnJlbnQgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHRoaXMuY3VyQ29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuXG4gICAgLy8gU3RhcnRpbmcgSW50ZXJhY3RFdmVudCBwb2ludGVyIGNvb3JkaW5hdGVzXG4gICAgdGhpcy5zdGFydENvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcblxuICAgIC8vIENoYW5nZSBpbiBjb29yZGluYXRlcyBhbmQgdGltZSBvZiB0aGUgcG9pbnRlclxuICAgIHRoaXMucG9pbnRlckRlbHRhID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwLCBzcGVlZDogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwLCBzcGVlZDogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuXG4gICAgdGhpcy5kb3duRXZlbnQgICA9IG51bGw7ICAgIC8vIHBvaW50ZXJkb3duL21vdXNlZG93bi90b3VjaHN0YXJ0IGV2ZW50XG4gICAgdGhpcy5kb3duUG9pbnRlciA9IHt9O1xuXG4gICAgdGhpcy5fZXZlbnRUYXJnZXQgICAgPSBudWxsO1xuICAgIHRoaXMuX2N1ckV2ZW50VGFyZ2V0ID0gbnVsbDtcblxuICAgIHRoaXMucHJldkV2ZW50ID0gbnVsbDsgICAgICAvLyBwcmV2aW91cyBhY3Rpb24gZXZlbnRcbiAgICB0aGlzLnRhcFRpbWUgICA9IDA7ICAgICAgICAgLy8gdGltZSBvZiB0aGUgbW9zdCByZWNlbnQgdGFwIGV2ZW50XG4gICAgdGhpcy5wcmV2VGFwICAgPSBudWxsO1xuXG4gICAgdGhpcy5zdGFydE9mZnNldCAgICA9IHsgbGVmdDogMCwgcmlnaHQ6IDAsIHRvcDogMCwgYm90dG9tOiAwIH07XG4gICAgdGhpcy5yZXN0cmljdE9mZnNldCA9IHsgbGVmdDogMCwgcmlnaHQ6IDAsIHRvcDogMCwgYm90dG9tOiAwIH07XG4gICAgdGhpcy5zbmFwT2Zmc2V0cyAgICA9IFtdO1xuXG4gICAgdGhpcy5nZXN0dXJlID0ge1xuICAgICAgICBzdGFydDogeyB4OiAwLCB5OiAwIH0sXG5cbiAgICAgICAgc3RhcnREaXN0YW5jZTogMCwgICAvLyBkaXN0YW5jZSBiZXR3ZWVuIHR3byB0b3VjaGVzIG9mIHRvdWNoU3RhcnRcbiAgICAgICAgcHJldkRpc3RhbmNlIDogMCxcbiAgICAgICAgZGlzdGFuY2UgICAgIDogMCxcblxuICAgICAgICBzY2FsZTogMSwgICAgICAgICAgIC8vIGdlc3R1cmUuZGlzdGFuY2UgLyBnZXN0dXJlLnN0YXJ0RGlzdGFuY2VcblxuICAgICAgICBzdGFydEFuZ2xlOiAwLCAgICAgIC8vIGFuZ2xlIG9mIGxpbmUgam9pbmluZyB0d28gdG91Y2hlc1xuICAgICAgICBwcmV2QW5nbGUgOiAwICAgICAgIC8vIGFuZ2xlIG9mIHRoZSBwcmV2aW91cyBnZXN0dXJlIGV2ZW50XG4gICAgfTtcblxuICAgIHRoaXMuc25hcFN0YXR1cyA9IHtcbiAgICAgICAgeCAgICAgICA6IDAsIHkgICAgICAgOiAwLFxuICAgICAgICBkeCAgICAgIDogMCwgZHkgICAgICA6IDAsXG4gICAgICAgIHJlYWxYICAgOiAwLCByZWFsWSAgIDogMCxcbiAgICAgICAgc25hcHBlZFg6IDAsIHNuYXBwZWRZOiAwLFxuICAgICAgICB0YXJnZXRzIDogW10sXG4gICAgICAgIGxvY2tlZCAgOiBmYWxzZSxcbiAgICAgICAgY2hhbmdlZCA6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMucmVzdHJpY3RTdGF0dXMgPSB7XG4gICAgICAgIGR4ICAgICAgICAgOiAwLCBkeSAgICAgICAgIDogMCxcbiAgICAgICAgcmVzdHJpY3RlZFg6IDAsIHJlc3RyaWN0ZWRZOiAwLFxuICAgICAgICBzbmFwICAgICAgIDogbnVsbCxcbiAgICAgICAgcmVzdHJpY3RlZCA6IGZhbHNlLFxuICAgICAgICBjaGFuZ2VkICAgIDogZmFsc2VcbiAgICB9O1xuXG4gICAgdGhpcy5yZXN0cmljdFN0YXR1cy5zbmFwID0gdGhpcy5zbmFwU3RhdHVzO1xuXG4gICAgdGhpcy5wb2ludGVySXNEb3duICAgPSBmYWxzZTtcbiAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlO1xuICAgIHRoaXMuZ2VzdHVyaW5nICAgICAgID0gZmFsc2U7XG4gICAgdGhpcy5kcmFnZ2luZyAgICAgICAgPSBmYWxzZTtcbiAgICB0aGlzLnJlc2l6aW5nICAgICAgICA9IGZhbHNlO1xuICAgIHRoaXMucmVzaXplQXhlcyAgICAgID0gJ3h5JztcblxuICAgIHRoaXMubW91c2UgPSBmYWxzZTtcblxuICAgIHNjb3BlLmludGVyYWN0aW9ucy5wdXNoKHRoaXMpO1xufVxuXG4vLyBDaGVjayBpZiBhY3Rpb24gaXMgZW5hYmxlZCBnbG9iYWxseSBhbmQgdGhlIGN1cnJlbnQgdGFyZ2V0IHN1cHBvcnRzIGl0XG4vLyBJZiBzbywgcmV0dXJuIHRoZSB2YWxpZGF0ZWQgYWN0aW9uLiBPdGhlcndpc2UsIHJldHVybiBudWxsXG5mdW5jdGlvbiB2YWxpZGF0ZUFjdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUpIHtcbiAgICBpZiAoIXNjb3BlLmlzT2JqZWN0KGFjdGlvbikpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgIHZhciBhY3Rpb25OYW1lID0gYWN0aW9uLm5hbWUsXG4gICAgICAgIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgIGlmICgoICAoYWN0aW9uTmFtZSAgPT09ICdyZXNpemUnICAgJiYgb3B0aW9ucy5yZXNpemUuZW5hYmxlZCApXG4gICAgICAgIHx8IChhY3Rpb25OYW1lICAgICAgPT09ICdkcmFnJyAgICAgJiYgb3B0aW9ucy5kcmFnLmVuYWJsZWQgIClcbiAgICAgICAgfHwgKGFjdGlvbk5hbWUgICAgICA9PT0gJ2dlc3R1cmUnICAmJiBvcHRpb25zLmdlc3R1cmUuZW5hYmxlZCkpXG4gICAgICAgICYmIHNjb3BlLmFjdGlvbklzRW5hYmxlZFthY3Rpb25OYW1lXSkge1xuXG4gICAgICAgIGlmIChhY3Rpb25OYW1lID09PSAncmVzaXplJyB8fCBhY3Rpb25OYW1lID09PSAncmVzaXpleXgnKSB7XG4gICAgICAgICAgICBhY3Rpb25OYW1lID0gJ3Jlc2l6ZXh5JztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRBY3Rpb25DdXJzb3IgKGFjdGlvbikge1xuICAgIHZhciBjdXJzb3IgPSAnJztcblxuICAgIGlmIChhY3Rpb24ubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICAgIGN1cnNvciA9ICBzY29wZS5hY3Rpb25DdXJzb3JzLmRyYWc7XG4gICAgfVxuICAgIGlmIChhY3Rpb24ubmFtZSA9PT0gJ3Jlc2l6ZScpIHtcbiAgICAgICAgaWYgKGFjdGlvbi5heGlzKSB7XG4gICAgICAgICAgICBjdXJzb3IgPSAgc2NvcGUuYWN0aW9uQ3Vyc29yc1thY3Rpb24ubmFtZSArIGFjdGlvbi5heGlzXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY3Rpb24uZWRnZXMpIHtcbiAgICAgICAgICAgIHZhciBjdXJzb3JLZXkgPSAncmVzaXplJyxcbiAgICAgICAgICAgICAgICBlZGdlTmFtZXMgPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24uZWRnZXNbZWRnZU5hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3JLZXkgKz0gZWRnZU5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3Vyc29yID0gc2NvcGUuYWN0aW9uQ3Vyc29yc1tjdXJzb3JLZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnNvcjtcbn1cblxuZnVuY3Rpb24gcHJldmVudE9yaWdpbmFsRGVmYXVsdCAoKSB7XG4gICAgdGhpcy5vcmlnaW5hbEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59XG5cbkludGVyYWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICBnZXRQYWdlWFkgIDogZnVuY3Rpb24gKHBvaW50ZXIsIHh5KSB7IHJldHVybiAgIHV0aWxzLmdldFBhZ2VYWShwb2ludGVyLCB4eSwgdGhpcyk7IH0sXG4gICAgZ2V0Q2xpZW50WFk6IGZ1bmN0aW9uIChwb2ludGVyLCB4eSkgeyByZXR1cm4gdXRpbHMuZ2V0Q2xpZW50WFkocG9pbnRlciwgeHksIHRoaXMpOyB9LFxuICAgIHNldEV2ZW50WFkgOiBmdW5jdGlvbiAodGFyZ2V0LCBwdHIpIHsgcmV0dXJuICB1dGlscy5zZXRFdmVudFhZKHRhcmdldCwgcHRyLCB0aGlzKTsgfSxcblxuICAgIHBvaW50ZXJPdmVyOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIGlmICh0aGlzLnByZXBhcmVkLm5hbWUgfHwgIXRoaXMubW91c2UpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIGN1ck1hdGNoZXMgPSBbXSxcbiAgICAgICAgICAgIGN1ck1hdGNoRWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgIHByZXZUYXJnZXRFbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuXG4gICAgICAgIHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICBpZiAodGhpcy50YXJnZXRcbiAgICAgICAgICAgICYmIChzY29wZS50ZXN0SWdub3JlKHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgfHwgIXNjb3BlLnRlc3RBbGxvdyh0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50LCBldmVudFRhcmdldCkpKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgZXZlbnRUYXJnZXQgc2hvdWxkIGJlIGlnbm9yZWQgb3Igc2hvdWxkbid0IGJlIGFsbG93ZWRcbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBwcmV2aW91cyB0YXJnZXRcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVsZW1lbnRJbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmdldChldmVudFRhcmdldCksXG4gICAgICAgICAgICBlbGVtZW50QWN0aW9uID0gKGVsZW1lbnRJbnRlcmFjdGFibGVcbiAgICAgICAgICAgICYmICFzY29wZS50ZXN0SWdub3JlKGVsZW1lbnRJbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhlbGVtZW50SW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAmJiB2YWxpZGF0ZUFjdGlvbihcbiAgICAgICAgICAgICAgICBlbGVtZW50SW50ZXJhY3RhYmxlLmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgZXZlbnRUYXJnZXQpLFxuICAgICAgICAgICAgICAgIGVsZW1lbnRJbnRlcmFjdGFibGUpKTtcblxuICAgICAgICBpZiAoZWxlbWVudEFjdGlvbiAmJiAhc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChlbGVtZW50SW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZWxlbWVudEFjdGlvbikpIHtcbiAgICAgICAgICAgIGVsZW1lbnRBY3Rpb24gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHVzaEN1ck1hdGNoZXMgKGludGVyYWN0YWJsZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGV2ZW50VGFyZ2V0LCBzZWxlY3RvcikpIHtcblxuICAgICAgICAgICAgICAgIGN1ck1hdGNoZXMucHVzaChpbnRlcmFjdGFibGUpO1xuICAgICAgICAgICAgICAgIGN1ck1hdGNoRWxlbWVudHMucHVzaChldmVudFRhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBlbGVtZW50SW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5mb3JFYWNoU2VsZWN0b3IocHVzaEN1ck1hdGNoZXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0ZVNlbGVjdG9yKHBvaW50ZXIsIGV2ZW50LCBjdXJNYXRjaGVzLCBjdXJNYXRjaEVsZW1lbnRzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IGN1ck1hdGNoZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gY3VyTWF0Y2hFbGVtZW50cztcblxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlckhvdmVyKHBvaW50ZXIsIGV2ZW50LCB0aGlzLm1hdGNoZXMsIHRoaXMubWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZChldmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuUG9pbnRlckV2ZW50PyBzY29wZS5wRXZlbnRUeXBlcy5tb3ZlIDogJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUubm9kZUNvbnRhaW5zKHByZXZUYXJnZXRFbGVtZW50LCBldmVudFRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb2ludGVySG92ZXIocG9pbnRlciwgZXZlbnQsIHRoaXMubWF0Y2hlcywgdGhpcy5tYXRjaEVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLmVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5Qb2ludGVyRXZlbnQ/IHNjb3BlLnBFdmVudFR5cGVzLm1vdmUgOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIENoZWNrIHdoYXQgYWN0aW9uIHdvdWxkIGJlIHBlcmZvcm1lZCBvbiBwb2ludGVyTW92ZSB0YXJnZXQgaWYgYSBtb3VzZVxuICAgIC8vIGJ1dHRvbiB3ZXJlIHByZXNzZWQgYW5kIGNoYW5nZSB0aGUgY3Vyc29yIGFjY29yZGluZ2x5XG4gICAgcG9pbnRlckhvdmVyOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgbWF0Y2hlcywgbWF0Y2hFbGVtZW50cykge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUgJiYgdGhpcy5tb3VzZSkge1xuXG4gICAgICAgICAgICB2YXIgYWN0aW9uO1xuXG4gICAgICAgICAgICAvLyB1cGRhdGUgcG9pbnRlciBjb29yZHMgZm9yIGRlZmF1bHRBY3Rpb25DaGVja2VyIHRvIHVzZVxuICAgICAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuY3VyQ29vcmRzLCBwb2ludGVyKTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSB0aGlzLnZhbGlkYXRlU2VsZWN0b3IocG9pbnRlciwgZXZlbnQsIG1hdGNoZXMsIG1hdGNoRWxlbWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gdmFsaWRhdGVBY3Rpb24odGFyZ2V0LmdldEFjdGlvbih0aGlzLnBvaW50ZXJzWzBdLCBldmVudCwgdGhpcywgdGhpcy5lbGVtZW50KSwgdGhpcy50YXJnZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gZ2V0QWN0aW9uQ3Vyc29yKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucHJlcGFyZWQubmFtZSkge1xuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcG9pbnRlck91dDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5uYW1lKSB7IHJldHVybjsgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0ZW1wb3JhcnkgZXZlbnQgbGlzdGVuZXJzIGZvciBzZWxlY3RvciBJbnRlcmFjdGFibGVzXG4gICAgICAgIGlmICghc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZXZlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgICBldmVudHMucmVtb3ZlKGV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgIHNjb3BlLlBvaW50ZXJFdmVudD8gc2NvcGUucEV2ZW50VHlwZXMubW92ZSA6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICYmIHRoaXMudGFyZ2V0Lm9wdGlvbnMuc3R5bGVDdXJzb3IgJiYgIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2VsZWN0b3JEb3duOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXG4gICAgICAgIC8vIGNvcHkgZXZlbnQgdG8gYmUgdXNlZCBpbiB0aW1lb3V0IGZvciBJRThcbiAgICAgICAgICAgIGV2ZW50Q29weSA9IGV2ZW50cy51c2VBdHRhY2hFdmVudD8gdXRpbHMuZXh0ZW5kKHt9LCBldmVudCkgOiBldmVudCxcbiAgICAgICAgICAgIGVsZW1lbnQgPSBldmVudFRhcmdldCxcbiAgICAgICAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKSxcbiAgICAgICAgICAgIGFjdGlvbjtcblxuICAgICAgICB0aGlzLmhvbGRUaW1lcnNbcG9pbnRlckluZGV4XSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC5wb2ludGVySG9sZChldmVudHMudXNlQXR0YWNoRXZlbnQ/IGV2ZW50Q29weSA6IHBvaW50ZXIsIGV2ZW50Q29weSwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcbiAgICAgICAgfSwgc2NvcGUuZGVmYXVsdE9wdGlvbnMuX2hvbGREdXJhdGlvbik7XG5cbiAgICAgICAgdGhpcy5wb2ludGVySXNEb3duID0gdHJ1ZTtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgZG93biBldmVudCBoaXRzIHRoZSBjdXJyZW50IGluZXJ0aWEgdGFyZ2V0XG4gICAgICAgIGlmICh0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlICYmIHRoaXMudGFyZ2V0LnNlbGVjdG9yKSB7XG4gICAgICAgICAgICAvLyBjbGltYiB1cCB0aGUgRE9NIHRyZWUgZnJvbSB0aGUgZXZlbnQgdGFyZ2V0XG4gICAgICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGVsZW1lbnQgaXMgdGhlIGN1cnJlbnQgaW5lcnRpYSB0YXJnZXQgZWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLmVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCB0aGUgcHJvc3BlY3RpdmUgYWN0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBvbmdvaW5nIG9uZVxuICAgICAgICAgICAgICAgICAgICAmJiB2YWxpZGF0ZUFjdGlvbih0aGlzLnRhcmdldC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIHRoaXMuZWxlbWVudCksIHRoaXMudGFyZ2V0KS5uYW1lID09PSB0aGlzLnByZXBhcmVkLm5hbWUpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIGluZXJ0aWEgc28gdGhhdCB0aGUgbmV4dCBtb3ZlIHdpbGwgYmUgYSBub3JtYWwgb25lXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkZyYW1lLmNhbmNlbCh0aGlzLmluZXJ0aWFTdGF0dXMuaSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90aGluZyBpZiBpbnRlcmFjdGluZ1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHVzaE1hdGNoZXMgKGludGVyYWN0YWJsZSwgc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgID8gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaW5Db250ZXh0KGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvciwgZWxlbWVudHMpKSB7XG5cbiAgICAgICAgICAgICAgICB0aGF0Lm1hdGNoZXMucHVzaChpbnRlcmFjdGFibGUpO1xuICAgICAgICAgICAgICAgIHRoYXQubWF0Y2hFbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHBvaW50ZXIgY29vcmRzIGZvciBkZWZhdWx0QWN0aW9uQ2hlY2tlciB0byB1c2VcbiAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuY3VyQ29vcmRzLCBwb2ludGVyKTtcbiAgICAgICAgdGhpcy5kb3duRXZlbnQgPSBldmVudDtcblxuICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpICYmICFhY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG5cbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKHB1c2hNYXRjaGVzKTtcblxuICAgICAgICAgICAgYWN0aW9uID0gdGhpcy52YWxpZGF0ZVNlbGVjdG9yKHBvaW50ZXIsIGV2ZW50LCB0aGlzLm1hdGNoZXMsIHRoaXMubWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSAgPSBhY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuZWRnZXMgPSBhY3Rpb24uZWRnZXM7XG5cbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdkb3duJyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBvaW50ZXJEb3duKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyB0aGVzZSBub3cgc2luY2UgcG9pbnRlckRvd24gaXNuJ3QgYmVpbmcgY2FsbGVkIGZyb20gaGVyZVxuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB1dGlscy5leHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcik7XG5cbiAgICAgICAgICAgIHV0aWxzLmNvcHlDb29yZHModGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2Rvd24nKTtcbiAgICB9LFxuXG4gICAgLy8gRGV0ZXJtaW5lIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gbmV4dCBwb2ludGVyTW92ZSBhbmQgYWRkIGFwcHJvcHJpYXRlXG4gICAgLy8gc3R5bGUgYW5kIGV2ZW50IExpc3RlbmVyc1xuICAgIHBvaW50ZXJEb3duOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgZm9yY2VBY3Rpb24pIHtcbiAgICAgICAgaWYgKCFmb3JjZUFjdGlvbiAmJiAhdGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSAmJiB0aGlzLnBvaW50ZXJXYXNNb3ZlZCAmJiB0aGlzLnByZXBhcmVkLm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWU7XG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnQ7XG5cbiAgICAgICAgdmFyIHBvaW50ZXJJbmRleCA9IHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKSxcbiAgICAgICAgICAgIGFjdGlvbjtcblxuICAgICAgICAvLyBJZiBpdCBpcyB0aGUgc2Vjb25kIHRvdWNoIG9mIGEgbXVsdGktdG91Y2ggZ2VzdHVyZSwga2VlcCB0aGUgdGFyZ2V0XG4gICAgICAgIC8vIHRoZSBzYW1lIGlmIGEgdGFyZ2V0IHdhcyBzZXQgYnkgdGhlIGZpcnN0IHRvdWNoXG4gICAgICAgIC8vIE90aGVyd2lzZSwgc2V0IHRoZSB0YXJnZXQgaWYgdGhlcmUgaXMgbm8gYWN0aW9uIHByZXBhcmVkXG4gICAgICAgIGlmICgodGhpcy5wb2ludGVySWRzLmxlbmd0aCA8IDIgJiYgIXRoaXMudGFyZ2V0KSB8fCAhdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG5cbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmdldChjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGN1ckV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBjdXJFdmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgKGFjdGlvbiA9IHZhbGlkYXRlQWN0aW9uKGZvcmNlQWN0aW9uIHx8IGludGVyYWN0YWJsZS5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIGN1ckV2ZW50VGFyZ2V0KSwgaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCkpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChpbnRlcmFjdGFibGUsIGN1ckV2ZW50VGFyZ2V0LCBhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBpbnRlcmFjdGFibGU7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gY3VyRXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQsXG4gICAgICAgICAgICBvcHRpb25zID0gdGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zO1xuXG4gICAgICAgIGlmICh0YXJnZXQgJiYgKGZvcmNlQWN0aW9uIHx8ICF0aGlzLnByZXBhcmVkLm5hbWUpKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBhY3Rpb24gfHwgdmFsaWRhdGVBY3Rpb24oZm9yY2VBY3Rpb24gfHwgdGFyZ2V0LmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgY3VyRXZlbnRUYXJnZXQpLCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLnN0YXJ0Q29vcmRzKTtcblxuICAgICAgICAgICAgaWYgKCFhY3Rpb24pIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9IGdldEFjdGlvbkN1cnNvcihhY3Rpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUF4ZXMgPSBhY3Rpb24ubmFtZSA9PT0gJ3Jlc2l6ZSc/IGFjdGlvbi5heGlzIDogbnVsbDtcblxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2dlc3R1cmUnICYmIHRoaXMucG9pbnRlcklkcy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5uYW1lICA9IGFjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5heGlzICA9IGFjdGlvbi5heGlzO1xuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5lZGdlcyA9IGFjdGlvbi5lZGdlcztcblxuICAgICAgICAgICAgdGhpcy5zbmFwU3RhdHVzLnNuYXBwZWRYID0gdGhpcy5zbmFwU3RhdHVzLnNuYXBwZWRZID1cbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWRYID0gdGhpcy5yZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkWSA9IE5hTjtcblxuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB1dGlscy5leHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcik7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLnByZXZDb29yZHMpO1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgaW5lcnRpYSBpcyBhY3RpdmUgdHJ5IHRvIHJlc3VtZSBhY3Rpb25cbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZVxuICAgICAgICAgICAgJiYgY3VyRXZlbnRUYXJnZXQgPT09IHRoaXMuZWxlbWVudFxuICAgICAgICAgICAgJiYgdmFsaWRhdGVBY3Rpb24odGFyZ2V0LmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgdGhpcy5lbGVtZW50KSwgdGFyZ2V0KS5uYW1lID09PSB0aGlzLnByZXBhcmVkLm5hbWUpIHtcblxuICAgICAgICAgICAgYW5pbWF0aW9uRnJhbWUuY2FuY2VsKHRoaXMuaW5lcnRpYVN0YXR1cy5pKTtcbiAgICAgICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0TW9kaWZpY2F0aW9uczogZnVuY3Rpb24gKGNvb3JkcywgcHJlRW5kKSB7XG4gICAgICAgIHZhciB0YXJnZXQgICAgICAgICA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgc2hvdWxkTW92ZSAgICAgPSB0cnVlLFxuICAgICAgICAgICAgc2hvdWxkU25hcCAgICAgPSBzY29wZS5jaGVja1NuYXAodGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpICAgICAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcC5lbmRPbmx5ICAgICB8fCBwcmVFbmQpLFxuICAgICAgICAgICAgc2hvdWxkUmVzdHJpY3QgPSBzY29wZS5jaGVja1Jlc3RyaWN0KHRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0ucmVzdHJpY3QuZW5kT25seSB8fCBwcmVFbmQpO1xuXG4gICAgICAgIGlmIChzaG91bGRTbmFwICAgICkgeyB0aGlzLnNldFNuYXBwaW5nICAgKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMuc25hcFN0YXR1cyAgICAubG9ja2VkICAgICA9IGZhbHNlOyB9XG4gICAgICAgIGlmIChzaG91bGRSZXN0cmljdCkgeyB0aGlzLnNldFJlc3RyaWN0aW9uKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCA9IGZhbHNlOyB9XG5cbiAgICAgICAgaWYgKHNob3VsZFNuYXAgJiYgdGhpcy5zbmFwU3RhdHVzLmxvY2tlZCAmJiAhdGhpcy5zbmFwU3RhdHVzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgIHNob3VsZE1vdmUgPSBzaG91bGRSZXN0cmljdCAmJiB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWQgJiYgdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNob3VsZFJlc3RyaWN0ICYmIHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCAmJiAhdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICBzaG91bGRNb3ZlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hvdWxkTW92ZTtcbiAgICB9LFxuXG4gICAgc2V0U3RhcnRPZmZzZXRzOiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KSxcbiAgICAgICAgICAgIG9yaWdpbiA9IHNjb3BlLmdldE9yaWdpblhZKGludGVyYWN0YWJsZSwgZWxlbWVudCksXG4gICAgICAgICAgICBzbmFwID0gaW50ZXJhY3RhYmxlLm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5zbmFwLFxuICAgICAgICAgICAgcmVzdHJpY3QgPSBpbnRlcmFjdGFibGUub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LFxuICAgICAgICAgICAgd2lkdGgsIGhlaWdodDtcblxuICAgICAgICBpZiAocmVjdCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydE9mZnNldC5sZWZ0ID0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnggLSByZWN0LmxlZnQ7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueSAtIHJlY3QudG9wO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICA9IHJlY3QucmlnaHQgIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLng7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LmJvdHRvbSA9IHJlY3QuYm90dG9tIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnk7XG5cbiAgICAgICAgICAgIGlmICgnd2lkdGgnIGluIHJlY3QpIHsgd2lkdGggPSByZWN0LndpZHRoOyB9XG4gICAgICAgICAgICBlbHNlIHsgd2lkdGggPSByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0OyB9XG4gICAgICAgICAgICBpZiAoJ2hlaWdodCcgaW4gcmVjdCkgeyBoZWlnaHQgPSByZWN0LmhlaWdodDsgfVxuICAgICAgICAgICAgZWxzZSB7IGhlaWdodCA9IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7IH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRPZmZzZXQubGVmdCA9IHRoaXMuc3RhcnRPZmZzZXQudG9wID0gdGhpcy5zdGFydE9mZnNldC5yaWdodCA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc25hcE9mZnNldHMuc3BsaWNlKDApO1xuXG4gICAgICAgIHZhciBzbmFwT2Zmc2V0ID0gc25hcCAmJiBzbmFwLm9mZnNldCA9PT0gJ3N0YXJ0Q29vcmRzJ1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICB4OiB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueCAtIG9yaWdpbi54LFxuICAgICAgICAgICAgeTogdGhpcy5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueVxuICAgICAgICB9XG4gICAgICAgICAgICA6IHNuYXAgJiYgc25hcC5vZmZzZXQgfHwgeyB4OiAwLCB5OiAwIH07XG5cbiAgICAgICAgaWYgKHJlY3QgJiYgc25hcCAmJiBzbmFwLnJlbGF0aXZlUG9pbnRzICYmIHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBPZmZzZXRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogc25hcC5yZWxhdGl2ZVBvaW50c1tpXS54KSArIHNuYXBPZmZzZXQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogdGhpcy5zdGFydE9mZnNldC50b3AgIC0gKGhlaWdodCAqIHNuYXAucmVsYXRpdmVQb2ludHNbaV0ueSkgKyBzbmFwT2Zmc2V0LnlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc25hcE9mZnNldHMucHVzaChzbmFwT2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWN0ICYmIHJlc3RyaWN0LmVsZW1lbnRSZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogcmVzdHJpY3QuZWxlbWVudFJlY3QubGVmdCk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgLSAoaGVpZ2h0ICogcmVzdHJpY3QuZWxlbWVudFJlY3QudG9wKTtcblxuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICAtICh3aWR0aCAgKiAoMSAtIHJlc3RyaWN0LmVsZW1lbnRSZWN0LnJpZ2h0KSk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tIC0gKGhlaWdodCAqICgxIC0gcmVzdHJpY3QuZWxlbWVudFJlY3QuYm90dG9tKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCA9IHRoaXMucmVzdHJpY3RPZmZzZXQucmlnaHQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IDA7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0aW9uLnN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgICAqIGFjdGlvbiBtdXN0IGJlIGVuYWJsZWQgZm9yIHRoZSB0YXJnZXQgSW50ZXJhY3RhYmxlIGFuZCBhbiBhcHByb3ByaWF0ZSBudW1iZXJcbiAgICAgKiBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biDigJMgMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAgICpcbiAgICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAgICpcbiAgICAgLSBhY3Rpb24gICAgICAgKG9iamVjdCkgIFRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIC0gZHJhZywgcmVzaXplLCBldGMuXG4gICAgIC0gaW50ZXJhY3RhYmxlIChJbnRlcmFjdGFibGUpIFRoZSBJbnRlcmFjdGFibGUgdG8gdGFyZ2V0XG4gICAgIC0gZWxlbWVudCAgICAgIChFbGVtZW50KSBUaGUgRE9NIEVsZW1lbnQgdG8gdGFyZ2V0XG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdCh0YXJnZXQpXG4gICAgIHwgICAuZHJhZ2dhYmxlKHtcbiAgICAgfCAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICAgfCAgICAgbWFudWFsU3RhcnQ6IHRydWVcbiAgICAgfCAgIH0pXG4gICAgIHwgICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAgIHwgICAub24oJ2hvbGQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgfCAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb247XG4gICAgIHxcbiAgICAgfCAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAgIHwgICAgICAgaW50ZXJhY3Rpb24uc3RhcnQoeyBuYW1lOiAnZHJhZycgfSxcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgIHwgICAgIH1cbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgfHwgIXRoaXMucG9pbnRlcklzRG93blxuICAgICAgICAgICAgfHwgdGhpcy5wb2ludGVySWRzLmxlbmd0aCA8IChhY3Rpb24ubmFtZSA9PT0gJ2dlc3R1cmUnPyAyIDogMSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoaXMgaW50ZXJhY3Rpb24gaGFkIGJlZW4gcmVtb3ZlZCBhZnRlciBzdG9wcGluZ1xuICAgICAgICAvLyBhZGQgaXQgYmFja1xuICAgICAgICBpZiAoc2NvcGUuaW5kZXhPZihzY29wZS5pbnRlcmFjdGlvbnMsIHRoaXMpID09PSAtMSkge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLnB1c2godGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgID0gYWN0aW9uLm5hbWU7XG4gICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgdGhpcy5wcmVwYXJlZC5lZGdlcyA9IGFjdGlvbi5lZGdlcztcbiAgICAgICAgdGhpcy50YXJnZXQgICAgICAgICA9IGludGVyYWN0YWJsZTtcbiAgICAgICAgdGhpcy5lbGVtZW50ICAgICAgICA9IGVsZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuc3RhcnRDb29yZHMpO1xuICAgICAgICB0aGlzLnNldFN0YXJ0T2Zmc2V0cyhhY3Rpb24ubmFtZSwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KTtcbiAgICAgICAgdGhpcy5zZXRNb2RpZmljYXRpb25zKHRoaXMuc3RhcnRDb29yZHMucGFnZSk7XG5cbiAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSB0aGlzW3RoaXMucHJlcGFyZWQubmFtZSArICdTdGFydCddKHRoaXMuZG93bkV2ZW50KTtcbiAgICB9LFxuXG4gICAgcG9pbnRlck1vdmU6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBwcmVFbmQpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRQb2ludGVyKHBvaW50ZXIpO1xuXG4gICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLmN1ckNvb3JkcywgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50KVxuICAgICAgICAgICAgPyB0aGlzLmluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudFxuICAgICAgICAgICAgOiB1bmRlZmluZWQpO1xuXG4gICAgICAgIHZhciBkdXBsaWNhdGVNb3ZlID0gKHRoaXMuY3VyQ29vcmRzLnBhZ2UueCA9PT0gdGhpcy5wcmV2Q29vcmRzLnBhZ2UueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5wYWdlLnkgPT09IHRoaXMucHJldkNvb3Jkcy5wYWdlLnlcbiAgICAgICAgJiYgdGhpcy5jdXJDb29yZHMuY2xpZW50LnggPT09IHRoaXMucHJldkNvb3Jkcy5jbGllbnQueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueSA9PT0gdGhpcy5wcmV2Q29vcmRzLmNsaWVudC55KTtcblxuICAgICAgICB2YXIgZHgsIGR5LFxuICAgICAgICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIG1vdmVtZW50IGdyZWF0ZXIgdGhhbiBwb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgICAgICAgZHggPSB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueCAtIHRoaXMuc3RhcnRDb29yZHMuY2xpZW50Lng7XG4gICAgICAgICAgICBkeSA9IHRoaXMuY3VyQ29vcmRzLmNsaWVudC55IC0gdGhpcy5zdGFydENvb3Jkcy5jbGllbnQueTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gc2NvcGUucG9pbnRlck1vdmVUb2xlcmFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWR1cGxpY2F0ZU1vdmUgJiYgKCF0aGlzLnBvaW50ZXJJc0Rvd24gfHwgdGhpcy5wb2ludGVyV2FzTW92ZWQpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ21vdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5wb2ludGVySXNEb3duKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmIChkdXBsaWNhdGVNb3ZlICYmIHRoaXMucG9pbnRlcldhc01vdmVkICYmICFwcmVFbmQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgcG9pbnRlciBjb29yZGluYXRlLCB0aW1lIGNoYW5nZXMgYW5kIHNwZWVkc1xuICAgICAgICB1dGlscy5zZXRFdmVudERlbHRhcyh0aGlzLnBvaW50ZXJEZWx0YSwgdGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkXG4gICAgICAgICAgICAgICAgLy8gaWdub3JlIG1vdmVtZW50IHdoaWxlIGluZXJ0aWEgaXMgYWN0aXZlXG4gICAgICAgICAgICAmJiAoIXRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgfHwgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50ICYmIC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkpKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIGp1c3Qgc3RhcnRpbmcgYW4gYWN0aW9uLCBjYWxjdWxhdGUgdGhlIHBvaW50ZXIgc3BlZWQgbm93XG4gICAgICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNldEV2ZW50RGVsdGFzKHRoaXMucG9pbnRlckRlbHRhLCB0aGlzLnByZXZDb29yZHMsIHRoaXMuY3VyQ29vcmRzKTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGEgZHJhZyBpcyBpbiB0aGUgY29ycmVjdCBheGlzXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJlcGFyZWQubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhYnNYID0gTWF0aC5hYnMoZHgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWJzWSA9IE1hdGguYWJzKGR5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEF4aXMgPSB0aGlzLnRhcmdldC5vcHRpb25zLmRyYWcuYXhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXMgPSAoYWJzWCA+IGFic1kgPyAneCcgOiBhYnNYIDwgYWJzWSA/ICd5JyA6ICd4eScpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBtb3ZlbWVudCBpc24ndCBpbiB0aGUgYXhpcyBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgICAgIGlmIChheGlzICE9PSAneHknICYmIHRhcmdldEF4aXMgIT09ICd4eScgJiYgdGFyZ2V0QXhpcyAhPT0gYXhpcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuY2VsIHRoZSBwcmVwYXJlZCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRvIGdldCBhIGRyYWcgZnJvbSBhbm90aGVyIGluZXJhY3RhYmxlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGVsZW1lbnQgaW50ZXJhY3RhYmxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50SW50ZXJhY3RhYmxlID0gc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudEludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBlbGVtZW50SW50ZXJhY3RhYmxlICE9PSB0aGlzLnRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhZWxlbWVudEludGVyYWN0YWJsZS5vcHRpb25zLmRyYWcubWFudWFsU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgZWxlbWVudEludGVyYWN0YWJsZS5nZXRBY3Rpb24odGhpcy5kb3duUG9pbnRlciwgdGhpcy5kb3duRXZlbnQsIHRoaXMsIGVsZW1lbnQpLm5hbWUgPT09ICdkcmFnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5jaGVja0F4aXMoYXhpcywgZWxlbWVudEludGVyYWN0YWJsZSkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gZWxlbWVudEludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlJ3Mgbm8gZHJhZyBmcm9tIGVsZW1lbnQgaW50ZXJhY3RhYmxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBzZWxlY3RvciBpbnRlcmFjdGFibGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucHJlcGFyZWQubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzSW50ZXJhY3Rpb24gPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdldERyYWdnYWJsZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlID09PSB0aGlzSW50ZXJhY3Rpb24udGFyZ2V0KSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFpbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUudGVzdEFsbG93KGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIGVsZW1lbnRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgaW50ZXJhY3RhYmxlLmdldEFjdGlvbih0aGlzSW50ZXJhY3Rpb24uZG93blBvaW50ZXIsIHRoaXNJbnRlcmFjdGlvbi5kb3duRXZlbnQsIHRoaXNJbnRlcmFjdGlvbiwgZWxlbWVudCkubmFtZSA9PT0gJ2RyYWcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5jaGVja0F4aXMoYXhpcywgaW50ZXJhY3RhYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChpbnRlcmFjdGFibGUsIGVsZW1lbnQsICdkcmFnJykpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RvckludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKGdldERyYWdnYWJsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9ySW50ZXJhY3RhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IHNlbGVjdG9ySW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3RhcnRpbmcgPSAhIXRoaXMucHJlcGFyZWQubmFtZSAmJiAhdGhpcy5pbnRlcmFjdGluZygpO1xuXG4gICAgICAgICAgICBpZiAoc3RhcnRpbmdcbiAgICAgICAgICAgICAgICAmJiAodGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgfHwgIXNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQodGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCwgdGhpcy5wcmVwYXJlZCkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKGV2ZW50KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByZXBhcmVkLm5hbWUgJiYgdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydCh0aGlzLnByZXBhcmVkLCB0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc2hvdWxkTW92ZSA9IHRoaXMuc2V0TW9kaWZpY2F0aW9ucyh0aGlzLmN1ckNvb3Jkcy5wYWdlLCBwcmVFbmQpO1xuXG4gICAgICAgICAgICAgICAgLy8gbW92ZSBpZiBzbmFwcGluZyBvciByZXN0cmljdGlvbiBkb2Vzbid0IHByZXZlbnQgaXRcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkTW92ZSB8fCBzdGFydGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZFdmVudCA9IHRoaXNbdGhpcy5wcmVwYXJlZC5uYW1lICsgJ01vdmUnXShldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWxzLmNvcHlDb29yZHModGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcgfHwgdGhpcy5yZXNpemluZykge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2Nyb2xsTW92ZShwb2ludGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkcmFnU3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZHJhZ0V2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdkcmFnJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICB0aGlzLmRyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShkcmFnRXZlbnQpO1xuXG4gICAgICAgIC8vIHJlc2V0IGFjdGl2ZSBkcm9wem9uZXNcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyAgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyAgICAgPSBbXTtcblxuICAgICAgICBpZiAoIXRoaXMuZHluYW1pY0Ryb3ApIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlRHJvcHModGhpcy5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkcm9wRXZlbnRzID0gdGhpcy5nZXREcm9wRXZlbnRzKGV2ZW50LCBkcmFnRXZlbnQpO1xuXG4gICAgICAgIGlmIChkcm9wRXZlbnRzLmFjdGl2YXRlKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmVBY3RpdmVEcm9wcyhkcm9wRXZlbnRzLmFjdGl2YXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkcmFnRXZlbnQ7XG4gICAgfSxcblxuICAgIGRyYWdNb3ZlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgZHJhZ0V2ZW50ICA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZHJhZycsICdtb3ZlJywgdGhpcy5lbGVtZW50KSxcbiAgICAgICAgICAgIGRyYWdnYWJsZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnQsXG4gICAgICAgICAgICBkcm9wID0gdGhpcy5nZXREcm9wKGV2ZW50LCBkcmFnZ2FibGVFbGVtZW50KTtcblxuICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSBkcm9wLmRyb3B6b25lO1xuICAgICAgICB0aGlzLmRyb3BFbGVtZW50ID0gZHJvcC5lbGVtZW50O1xuXG4gICAgICAgIHZhciBkcm9wRXZlbnRzID0gdGhpcy5nZXREcm9wRXZlbnRzKGV2ZW50LCBkcmFnRXZlbnQpO1xuXG4gICAgICAgIHRhcmdldC5maXJlKGRyYWdFdmVudCk7XG5cbiAgICAgICAgaWYgKGRyb3BFdmVudHMubGVhdmUpIHsgdGhpcy5wcmV2RHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubGVhdmUpOyB9XG4gICAgICAgIGlmIChkcm9wRXZlbnRzLmVudGVyKSB7ICAgICB0aGlzLmRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmVudGVyKTsgfVxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5tb3ZlICkgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5tb3ZlICk7IH1cblxuICAgICAgICB0aGlzLnByZXZEcm9wVGFyZ2V0ICA9IHRoaXMuZHJvcFRhcmdldDtcbiAgICAgICAgdGhpcy5wcmV2RHJvcEVsZW1lbnQgPSB0aGlzLmRyb3BFbGVtZW50O1xuXG4gICAgICAgIHJldHVybiBkcmFnRXZlbnQ7XG4gICAgfSxcblxuICAgIHJlc2l6ZVN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlc2l6ZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdyZXNpemUnLCAnc3RhcnQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLnByZXBhcmVkLmVkZ2VzKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnRSZWN0ID0gdGhpcy50YXJnZXQuZ2V0UmVjdCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy50YXJnZXQub3B0aW9ucy5yZXNpemUuc3F1YXJlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNxdWFyZUVkZ2VzID0gdXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnByZXBhcmVkLmVkZ2VzKTtcblxuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLnRvcCAgICA9IHNxdWFyZUVkZ2VzLnRvcCAgICB8fCAoc3F1YXJlRWRnZXMubGVmdCAgICYmICFzcXVhcmVFZGdlcy5ib3R0b20pO1xuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLmxlZnQgICA9IHNxdWFyZUVkZ2VzLmxlZnQgICB8fCAoc3F1YXJlRWRnZXMudG9wICAgICYmICFzcXVhcmVFZGdlcy5yaWdodCApO1xuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLmJvdHRvbSA9IHNxdWFyZUVkZ2VzLmJvdHRvbSB8fCAoc3F1YXJlRWRnZXMucmlnaHQgICYmICFzcXVhcmVFZGdlcy50b3AgICApO1xuICAgICAgICAgICAgICAgIHNxdWFyZUVkZ2VzLnJpZ2h0ICA9IHNxdWFyZUVkZ2VzLnJpZ2h0ICB8fCAoc3F1YXJlRWRnZXMuYm90dG9tICYmICFzcXVhcmVFZGdlcy5sZWZ0ICApO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5fc3F1YXJlRWRnZXMgPSBzcXVhcmVFZGdlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuX3NxdWFyZUVkZ2VzID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXNpemVSZWN0cyA9IHtcbiAgICAgICAgICAgICAgICBzdGFydCAgICAgOiBzdGFydFJlY3QsXG4gICAgICAgICAgICAgICAgY3VycmVudCAgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQ6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICAgICAgICAgICAgICBwcmV2aW91cyAgOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgICAgICAgICAgICAgZGVsdGEgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLCByaWdodCA6IDAsIHdpZHRoIDogMCxcbiAgICAgICAgICAgICAgICAgICAgdG9wIDogMCwgYm90dG9tOiAwLCBoZWlnaHQ6IDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXNpemVFdmVudC5yZWN0ID0gdGhpcy5yZXNpemVSZWN0cy5yZXN0cmljdGVkO1xuICAgICAgICAgICAgcmVzaXplRXZlbnQuZGVsdGFSZWN0ID0gdGhpcy5yZXNpemVSZWN0cy5kZWx0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGFyZ2V0LmZpcmUocmVzaXplRXZlbnQpO1xuXG4gICAgICAgIHRoaXMucmVzaXppbmcgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiByZXNpemVFdmVudDtcbiAgICB9LFxuXG4gICAgcmVzaXplTW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciByZXNpemVFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ21vdmUnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIHZhciBlZGdlcyA9IHRoaXMucHJlcGFyZWQuZWRnZXMsXG4gICAgICAgICAgICBpbnZlcnQgPSB0aGlzLnRhcmdldC5vcHRpb25zLnJlc2l6ZS5pbnZlcnQsXG4gICAgICAgICAgICBpbnZlcnRpYmxlID0gaW52ZXJ0ID09PSAncmVwb3NpdGlvbicgfHwgaW52ZXJ0ID09PSAnbmVnYXRlJztcblxuICAgICAgICBpZiAoZWRnZXMpIHtcbiAgICAgICAgICAgIHZhciBkeCA9IHJlc2l6ZUV2ZW50LmR4LFxuICAgICAgICAgICAgICAgIGR5ID0gcmVzaXplRXZlbnQuZHksXG5cbiAgICAgICAgICAgICAgICBzdGFydCAgICAgID0gdGhpcy5yZXNpemVSZWN0cy5zdGFydCxcbiAgICAgICAgICAgICAgICBjdXJyZW50ICAgID0gdGhpcy5yZXNpemVSZWN0cy5jdXJyZW50LFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQgPSB0aGlzLnJlc2l6ZVJlY3RzLnJlc3RyaWN0ZWQsXG4gICAgICAgICAgICAgICAgZGVsdGEgICAgICA9IHRoaXMucmVzaXplUmVjdHMuZGVsdGEsXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgICA9IHV0aWxzLmV4dGVuZCh0aGlzLnJlc2l6ZVJlY3RzLnByZXZpb3VzLCByZXN0cmljdGVkKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Lm9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgICAgICAgICAgICAgIHZhciBvcmlnaW5hbEVkZ2VzID0gZWRnZXM7XG5cbiAgICAgICAgICAgICAgICBlZGdlcyA9IHRoaXMucHJlcGFyZWQuX3NxdWFyZUVkZ2VzO1xuXG4gICAgICAgICAgICAgICAgaWYgKChvcmlnaW5hbEVkZ2VzLmxlZnQgJiYgb3JpZ2luYWxFZGdlcy5ib3R0b20pXG4gICAgICAgICAgICAgICAgICAgIHx8IChvcmlnaW5hbEVkZ2VzLnJpZ2h0ICYmIG9yaWdpbmFsRWRnZXMudG9wKSkge1xuICAgICAgICAgICAgICAgICAgICBkeSA9IC1keDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy5sZWZ0IHx8IG9yaWdpbmFsRWRnZXMucmlnaHQpIHsgZHkgPSBkeDsgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMudG9wIHx8IG9yaWdpbmFsRWRnZXMuYm90dG9tKSB7IGR4ID0gZHk7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSAnY3VycmVudCcgcmVjdCB3aXRob3V0IG1vZGlmaWNhdGlvbnNcbiAgICAgICAgICAgIGlmIChlZGdlcy50b3AgICApIHsgY3VycmVudC50b3AgICAgKz0gZHk7IH1cbiAgICAgICAgICAgIGlmIChlZGdlcy5ib3R0b20pIHsgY3VycmVudC5ib3R0b20gKz0gZHk7IH1cbiAgICAgICAgICAgIGlmIChlZGdlcy5sZWZ0ICApIHsgY3VycmVudC5sZWZ0ICAgKz0gZHg7IH1cbiAgICAgICAgICAgIGlmIChlZGdlcy5yaWdodCApIHsgY3VycmVudC5yaWdodCAgKz0gZHg7IH1cblxuICAgICAgICAgICAgaWYgKGludmVydGlibGUpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBpbnZlcnRpYmxlLCBjb3B5IHRoZSBjdXJyZW50IHJlY3RcbiAgICAgICAgICAgICAgICB1dGlscy5leHRlbmQocmVzdHJpY3RlZCwgY3VycmVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW52ZXJ0ID09PSAncmVwb3NpdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3dhcCBlZGdlIHZhbHVlcyBpZiBuZWNlc3NhcnkgdG8ga2VlcCB3aWR0aC9oZWlnaHQgcG9zaXRpdmVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN3YXA7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3RyaWN0ZWQudG9wID4gcmVzdHJpY3RlZC5ib3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXAgPSByZXN0cmljdGVkLnRvcDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3RlZC50b3AgPSByZXN0cmljdGVkLmJvdHRvbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQuYm90dG9tID0gc3dhcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdHJpY3RlZC5sZWZ0ID4gcmVzdHJpY3RlZC5yaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dhcCA9IHJlc3RyaWN0ZWQubGVmdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3RlZC5sZWZ0ID0gcmVzdHJpY3RlZC5yaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQucmlnaHQgPSBzd2FwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgbm90IGludmVydGlibGUsIHJlc3RyaWN0IHRvIG1pbmltdW0gb2YgMHgwIHJlY3RcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkLnRvcCAgICA9IE1hdGgubWluKGN1cnJlbnQudG9wLCBzdGFydC5ib3R0b20pO1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQuYm90dG9tID0gTWF0aC5tYXgoY3VycmVudC5ib3R0b20sIHN0YXJ0LnRvcCk7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC5sZWZ0ICAgPSBNYXRoLm1pbihjdXJyZW50LmxlZnQsIHN0YXJ0LnJpZ2h0KTtcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkLnJpZ2h0ICA9IE1hdGgubWF4KGN1cnJlbnQucmlnaHQsIHN0YXJ0LmxlZnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN0cmljdGVkLndpZHRoICA9IHJlc3RyaWN0ZWQucmlnaHQgIC0gcmVzdHJpY3RlZC5sZWZ0O1xuICAgICAgICAgICAgcmVzdHJpY3RlZC5oZWlnaHQgPSByZXN0cmljdGVkLmJvdHRvbSAtIHJlc3RyaWN0ZWQudG9wIDtcblxuICAgICAgICAgICAgZm9yICh2YXIgZWRnZSBpbiByZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgZGVsdGFbZWRnZV0gPSByZXN0cmljdGVkW2VkZ2VdIC0gcHJldmlvdXNbZWRnZV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmVkZ2VzID0gdGhpcy5wcmVwYXJlZC5lZGdlcztcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LnJlY3QgPSByZXN0cmljdGVkO1xuICAgICAgICAgICAgcmVzaXplRXZlbnQuZGVsdGFSZWN0ID0gZGVsdGE7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKHJlc2l6ZUV2ZW50KTtcblxuICAgICAgICByZXR1cm4gcmVzaXplRXZlbnQ7XG4gICAgfSxcblxuICAgIGdlc3R1cmVTdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBnZXN0dXJlRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ2dlc3R1cmUnLCAnc3RhcnQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGdlc3R1cmVFdmVudC5kcyA9IDA7XG5cbiAgICAgICAgdGhpcy5nZXN0dXJlLnN0YXJ0RGlzdGFuY2UgPSB0aGlzLmdlc3R1cmUucHJldkRpc3RhbmNlID0gZ2VzdHVyZUV2ZW50LmRpc3RhbmNlO1xuICAgICAgICB0aGlzLmdlc3R1cmUuc3RhcnRBbmdsZSA9IHRoaXMuZ2VzdHVyZS5wcmV2QW5nbGUgPSBnZXN0dXJlRXZlbnQuYW5nbGU7XG4gICAgICAgIHRoaXMuZ2VzdHVyZS5zY2FsZSA9IDE7XG5cbiAgICAgICAgdGhpcy5nZXN0dXJpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMudGFyZ2V0LmZpcmUoZ2VzdHVyZUV2ZW50KTtcblxuICAgICAgICByZXR1cm4gZ2VzdHVyZUV2ZW50O1xuICAgIH0sXG5cbiAgICBnZXN0dXJlTW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5wb2ludGVySWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJldkV2ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdlc3R1cmVFdmVudDtcblxuICAgICAgICBnZXN0dXJlRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ2dlc3R1cmUnLCAnbW92ZScsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIGdlc3R1cmVFdmVudC5kcyA9IGdlc3R1cmVFdmVudC5zY2FsZSAtIHRoaXMuZ2VzdHVyZS5zY2FsZTtcblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKGdlc3R1cmVFdmVudCk7XG5cbiAgICAgICAgdGhpcy5nZXN0dXJlLnByZXZBbmdsZSA9IGdlc3R1cmVFdmVudC5hbmdsZTtcbiAgICAgICAgdGhpcy5nZXN0dXJlLnByZXZEaXN0YW5jZSA9IGdlc3R1cmVFdmVudC5kaXN0YW5jZTtcblxuICAgICAgICBpZiAoZ2VzdHVyZUV2ZW50LnNjYWxlICE9PSBJbmZpbml0eSAmJlxuICAgICAgICAgICAgZ2VzdHVyZUV2ZW50LnNjYWxlICE9PSBudWxsICYmXG4gICAgICAgICAgICBnZXN0dXJlRXZlbnQuc2NhbGUgIT09IHVuZGVmaW5lZCAgJiZcbiAgICAgICAgICAgICFpc05hTihnZXN0dXJlRXZlbnQuc2NhbGUpKSB7XG5cbiAgICAgICAgICAgIHRoaXMuZ2VzdHVyZS5zY2FsZSA9IGdlc3R1cmVFdmVudC5zY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXN0dXJlRXZlbnQ7XG4gICAgfSxcblxuICAgIHBvaW50ZXJIb2xkOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdob2xkJyk7XG4gICAgfSxcblxuICAgIHBvaW50ZXJVcDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpIHtcbiAgICAgICAgdmFyIHBvaW50ZXJJbmRleCA9IHRoaXMubW91c2U/IDAgOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpKTtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5ob2xkVGltZXJzW3BvaW50ZXJJbmRleF0pO1xuXG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICd1cCcgKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ3RhcCcpO1xuXG4gICAgICAgIHRoaXMucG9pbnRlckVuZChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlcik7XG4gICAgfSxcblxuICAgIHBvaW50ZXJDYW5jZWw6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcblxuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnY2FuY2VsJyk7XG4gICAgICAgIHRoaXMucG9pbnRlckVuZChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcblxuICAgICAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlcik7XG4gICAgfSxcblxuICAgIC8vIGh0dHA6Ly93d3cucXVpcmtzbW9kZS5vcmcvZG9tL2V2ZW50cy9jbGljay5odG1sXG4gICAgLy8gPkV2ZW50cyBsZWFkaW5nIHRvIGRibGNsaWNrXG4gICAgLy9cbiAgICAvLyBJRTggZG9lc24ndCBmaXJlIGRvd24gZXZlbnQgYmVmb3JlIGRibGNsaWNrLlxuICAgIC8vIFRoaXMgd29ya2Fyb3VuZCB0cmllcyB0byBmaXJlIGEgdGFwIGFuZCBkb3VibGV0YXAgYWZ0ZXIgZGJsY2xpY2tcbiAgICBpZThEYmxjbGljazogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5wcmV2VGFwXG4gICAgICAgICAgICAmJiBldmVudC5jbGllbnRYID09PSB0aGlzLnByZXZUYXAuY2xpZW50WFxuICAgICAgICAgICAgJiYgZXZlbnQuY2xpZW50WSA9PT0gdGhpcy5wcmV2VGFwLmNsaWVudFlcbiAgICAgICAgICAgICYmIGV2ZW50VGFyZ2V0ICAgPT09IHRoaXMucHJldlRhcC50YXJnZXQpIHtcblxuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1swXSA9IGV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbMF0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICd0YXAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBFbmQgaW50ZXJhY3QgbW92ZSBldmVudHMgYW5kIHN0b3AgYXV0by1zY3JvbGwgdW5sZXNzIGluZXJ0aWEgaXMgZW5hYmxlZFxuICAgIHBvaW50ZXJFbmQ6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBlbmRFdmVudCxcbiAgICAgICAgICAgIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRhcmdldCAmJiB0YXJnZXQub3B0aW9ucyxcbiAgICAgICAgICAgIGluZXJ0aWFPcHRpb25zID0gb3B0aW9ucyAmJiB0aGlzLnByZXBhcmVkLm5hbWUgJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEsXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzID0gdGhpcy5pbmVydGlhU3RhdHVzO1xuXG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcblxuICAgICAgICAgICAgaWYgKGluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICB2YXIgcG9pbnRlclNwZWVkLFxuICAgICAgICAgICAgICAgIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgICAgIGluZXJ0aWFQb3NzaWJsZSA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGluZXJ0aWEgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBzbW9vdGhFbmQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBlbmRTbmFwID0gc2NvcGUuY2hlY2tTbmFwKHRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSAmJiBvcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcC5lbmRPbmx5LFxuICAgICAgICAgICAgICAgIGVuZFJlc3RyaWN0ID0gc2NvcGUuY2hlY2tSZXN0cmljdCh0YXJnZXQsIHRoaXMucHJlcGFyZWQubmFtZSkgJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LmVuZE9ubHksXG4gICAgICAgICAgICAgICAgZHggPSAwLFxuICAgICAgICAgICAgICAgIGR5ID0gMCxcbiAgICAgICAgICAgICAgICBzdGFydEV2ZW50O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5kcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIGlmICAgICAgKG9wdGlvbnMuZHJhZy5heGlzID09PSAneCcgKSB7IHBvaW50ZXJTcGVlZCA9IE1hdGguYWJzKHRoaXMucG9pbnRlckRlbHRhLmNsaWVudC52eCk7IH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmRyYWcuYXhpcyA9PT0gJ3knICkgeyBwb2ludGVyU3BlZWQgPSBNYXRoLmFicyh0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudnkpOyB9XG4gICAgICAgICAgICAgICAgZWxzZSAgIC8qb3B0aW9ucy5kcmFnLmF4aXMgPT09ICd4eScqL3sgcG9pbnRlclNwZWVkID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnNwZWVkOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwb2ludGVyU3BlZWQgPSB0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQuc3BlZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGluZXJ0aWEgc2hvdWxkIGJlIHN0YXJ0ZWRcbiAgICAgICAgICAgIGluZXJ0aWFQb3NzaWJsZSA9IChpbmVydGlhT3B0aW9ucyAmJiBpbmVydGlhT3B0aW9ucy5lbmFibGVkXG4gICAgICAgICAgICAmJiB0aGlzLnByZXBhcmVkLm5hbWUgIT09ICdnZXN0dXJlJ1xuICAgICAgICAgICAgJiYgZXZlbnQgIT09IGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWEgPSAoaW5lcnRpYVBvc3NpYmxlXG4gICAgICAgICAgICAmJiAobm93IC0gdGhpcy5jdXJDb29yZHMudGltZVN0YW1wKSA8IDUwXG4gICAgICAgICAgICAmJiBwb2ludGVyU3BlZWQgPiBpbmVydGlhT3B0aW9ucy5taW5TcGVlZFxuICAgICAgICAgICAgJiYgcG9pbnRlclNwZWVkID4gaW5lcnRpYU9wdGlvbnMuZW5kU3BlZWQpO1xuXG4gICAgICAgICAgICBpZiAoaW5lcnRpYVBvc3NpYmxlICYmICFpbmVydGlhICYmIChlbmRTbmFwIHx8IGVuZFJlc3RyaWN0KSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNuYXBSZXN0cmljdCA9IHt9O1xuXG4gICAgICAgICAgICAgICAgc25hcFJlc3RyaWN0LnNuYXAgPSBzbmFwUmVzdHJpY3QucmVzdHJpY3QgPSBzbmFwUmVzdHJpY3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoZW5kU25hcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNuYXBwaW5nKHRoaXMuY3VyQ29vcmRzLnBhZ2UsIHNuYXBSZXN0cmljdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzbmFwUmVzdHJpY3QubG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeCArPSBzbmFwUmVzdHJpY3QuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBzbmFwUmVzdHJpY3QuZHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZW5kUmVzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRSZXN0cmljdGlvbih0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzbmFwUmVzdHJpY3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc25hcFJlc3RyaWN0LnJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHNuYXBSZXN0cmljdC5keDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5ICs9IHNuYXBSZXN0cmljdC5keTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChkeCB8fCBkeSkge1xuICAgICAgICAgICAgICAgICAgICBzbW9vdGhFbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGluZXJ0aWEgfHwgc21vb3RoRW5kKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuY29weUNvb3JkcyhpbmVydGlhU3RhdHVzLnVwQ29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJzWzBdID0gaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50ID0gc3RhcnRFdmVudCA9XG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCB0aGlzLnByZXBhcmVkLm5hbWUsICdpbmVydGlhc3RhcnQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy50MCA9IG5vdztcblxuICAgICAgICAgICAgICAgIHRhcmdldC5maXJlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5lcnRpYSkge1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnZ4MCA9IHRoaXMucG9pbnRlckRlbHRhLmNsaWVudC52eDtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy52eTAgPSB0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudnk7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudjAgPSBwb2ludGVyU3BlZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxjSW5lcnRpYShpbmVydGlhU3RhdHVzKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IHV0aWxzLmV4dGVuZCh7fSwgdGhpcy5jdXJDb29yZHMucGFnZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5nZXRPcmlnaW5YWSh0YXJnZXQsIHRoaXMuZWxlbWVudCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNPYmplY3Q7XG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS54ID0gcGFnZS54ICsgaW5lcnRpYVN0YXR1cy54ZSAtIG9yaWdpbi54O1xuICAgICAgICAgICAgICAgICAgICBwYWdlLnkgPSBwYWdlLnkgKyBpbmVydGlhU3RhdHVzLnllIC0gb3JpZ2luLnk7XG5cbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzT2JqZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlU3RhdHVzWFk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYWdlLngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYWdlLnksXG4gICAgICAgICAgICAgICAgICAgICAgICBkeDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc25hcDogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c09iamVjdC5zbmFwID0gc3RhdHVzT2JqZWN0O1xuXG4gICAgICAgICAgICAgICAgICAgIGR4ID0gZHkgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRTbmFwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc25hcCA9IHRoaXMuc2V0U25hcHBpbmcodGhpcy5jdXJDb29yZHMucGFnZSwgc3RhdHVzT2JqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNuYXAubG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHggKz0gc25hcC5keDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBzbmFwLmR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdHJpY3QgPSB0aGlzLnNldFJlc3RyaWN0aW9uKHRoaXMuY3VyQ29vcmRzLnBhZ2UsIHN0YXR1c09iamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN0cmljdC5yZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHggKz0gcmVzdHJpY3QuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gcmVzdHJpY3QuZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWGUgKz0gZHg7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZSArPSBkeTtcblxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLmkgPSBhbmltYXRpb25GcmFtZS5yZXF1ZXN0KHRoaXMuYm91bmRJbmVydGlhRnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zbW9vdGhFbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnhlID0gZHg7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMueWUgPSBkeTtcblxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy5zeSA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5pID0gYW5pbWF0aW9uRnJhbWUucmVxdWVzdCh0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbmRTbmFwIHx8IGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgLy8gZmlyZSBhIG1vdmUgZXZlbnQgYXQgdGhlIHNuYXBwZWQgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgICAgIGVuZEV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdkcmFnJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHZhciBkcmFnZ2FibGVFbGVtZW50ID0gdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgICAgIGRyb3AgPSB0aGlzLmdldERyb3AoZXZlbnQsIGRyYWdnYWJsZUVsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSBkcm9wLmRyb3B6b25lO1xuICAgICAgICAgICAgdGhpcy5kcm9wRWxlbWVudCA9IGRyb3AuZWxlbWVudDtcblxuICAgICAgICAgICAgdmFyIGRyb3BFdmVudHMgPSB0aGlzLmdldERyb3BFdmVudHMoZXZlbnQsIGVuZEV2ZW50KTtcblxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMubGVhdmUpIHsgdGhpcy5wcmV2RHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubGVhdmUpOyB9XG4gICAgICAgICAgICBpZiAoZHJvcEV2ZW50cy5lbnRlcikgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5lbnRlcik7IH1cbiAgICAgICAgICAgIGlmIChkcm9wRXZlbnRzLmRyb3AgKSB7ICAgICB0aGlzLmRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmRyb3AgKTsgfVxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMuZGVhY3RpdmF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZUFjdGl2ZURyb3BzKGRyb3BFdmVudHMuZGVhY3RpdmF0ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhcmdldC5maXJlKGVuZEV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnJlc2l6aW5nKSB7XG4gICAgICAgICAgICBlbmRFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5nZXN0dXJpbmcpIHtcbiAgICAgICAgICAgIGVuZEV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0b3AoZXZlbnQpO1xuICAgIH0sXG5cbiAgICBjb2xsZWN0RHJvcHM6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIHZhciBkcm9wcyA9IFtdLFxuICAgICAgICAgICAgZWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgdGhpcy5lbGVtZW50O1xuXG4gICAgICAgIC8vIGNvbGxlY3QgYWxsIGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgd2hpY2ggcXVhbGlmeSBmb3IgYSBkcm9wXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzY29wZS5pbnRlcmFjdGFibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXNjb3BlLmludGVyYWN0YWJsZXNbaV0ub3B0aW9ucy5kcm9wLmVuYWJsZWQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBzY29wZS5pbnRlcmFjdGFibGVzW2ldLFxuICAgICAgICAgICAgICAgIGFjY2VwdCA9IGN1cnJlbnQub3B0aW9ucy5kcm9wLmFjY2VwdDtcblxuICAgICAgICAgICAgLy8gdGVzdCB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQgYWdhaW5zdCB0aGUgZHJvcHpvbmUncyBhY2NlcHQgc2V0dGluZ1xuICAgICAgICAgICAgaWYgKCh1dGlscy5pc0VsZW1lbnQoYWNjZXB0KSAmJiBhY2NlcHQgIT09IGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgfHwgKHNjb3BlLmlzU3RyaW5nKGFjY2VwdClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIGFjY2VwdCkpKSB7XG5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcXVlcnkgZm9yIG5ldyBlbGVtZW50cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgIHZhciBkcm9wRWxlbWVudHMgPSBjdXJyZW50LnNlbGVjdG9yPyBjdXJyZW50Ll9jb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoY3VycmVudC5zZWxlY3RvcikgOiBbY3VycmVudC5fZWxlbWVudF07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBsZW4gPSBkcm9wRWxlbWVudHMubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEVsZW1lbnQgPSBkcm9wRWxlbWVudHNbal07XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZHJvcHMucHVzaChjdXJyZW50KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkcm9wem9uZXM6IGRyb3BzLFxuICAgICAgICAgICAgZWxlbWVudHM6IGVsZW1lbnRzXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGZpcmVBY3RpdmVEcm9wczogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgY3VycmVudCxcbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50LFxuICAgICAgICAgICAgcHJldkVsZW1lbnQ7XG5cbiAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGFsbCBhY3RpdmUgZHJvcHpvbmVzIGFuZCB0cmlnZ2VyIGV2ZW50XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudCA9IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzW2ldO1xuICAgICAgICAgICAgY3VycmVudEVsZW1lbnQgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtpXTtcblxuICAgICAgICAgICAgLy8gcHJldmVudCB0cmlnZ2VyIG9mIGR1cGxpY2F0ZSBldmVudHMgb24gc2FtZSBlbGVtZW50XG4gICAgICAgICAgICBpZiAoY3VycmVudEVsZW1lbnQgIT09IHByZXZFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0IGN1cnJlbnQgZWxlbWVudCBhcyBldmVudCB0YXJnZXRcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBjdXJyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICBjdXJyZW50LmZpcmUoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldkVsZW1lbnQgPSBjdXJyZW50RWxlbWVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBDb2xsZWN0IGEgbmV3IHNldCBvZiBwb3NzaWJsZSBkcm9wcyBhbmQgc2F2ZSB0aGVtIGluIGFjdGl2ZURyb3BzLlxuICAgIC8vIHNldEFjdGl2ZURyb3BzIHNob3VsZCBhbHdheXMgYmUgY2FsbGVkIHdoZW4gYSBkcmFnIGhhcyBqdXN0IHN0YXJ0ZWQgb3IgYVxuICAgIC8vIGRyYWcgZXZlbnQgaGFwcGVucyB3aGlsZSBkeW5hbWljRHJvcCBpcyB0cnVlXG4gICAgc2V0QWN0aXZlRHJvcHM6IGZ1bmN0aW9uIChkcmFnRWxlbWVudCkge1xuICAgICAgICAvLyBnZXQgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB0aGF0IGNvdWxkIHJlY2VpdmUgdGhlIGRyYWdnYWJsZVxuICAgICAgICB2YXIgcG9zc2libGVEcm9wcyA9IHRoaXMuY29sbGVjdERyb3BzKGRyYWdFbGVtZW50LCB0cnVlKTtcblxuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcyA9IHBvc3NpYmxlRHJvcHMuZHJvcHpvbmVzO1xuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzICA9IHBvc3NpYmxlRHJvcHMuZWxlbWVudHM7XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5yZWN0c1tpXSA9IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzW2ldLmdldFJlY3QodGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50c1tpXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0RHJvcDogZnVuY3Rpb24gKGV2ZW50LCBkcmFnRWxlbWVudCkge1xuICAgICAgICB2YXIgdmFsaWREcm9wcyA9IFtdO1xuXG4gICAgICAgIGlmIChzY29wZS5keW5hbWljRHJvcCkge1xuICAgICAgICAgICAgdGhpcy5zZXRBY3RpdmVEcm9wcyhkcmFnRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudCAgICAgICAgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tqXSxcbiAgICAgICAgICAgICAgICBjdXJyZW50RWxlbWVudCA9IHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHMgW2pdLFxuICAgICAgICAgICAgICAgIHJlY3QgICAgICAgICAgID0gdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyAgICBbal07XG5cbiAgICAgICAgICAgIHZhbGlkRHJvcHMucHVzaChjdXJyZW50LmRyb3BDaGVjayh0aGlzLnBvaW50ZXJzWzBdLCBldmVudCwgdGhpcy50YXJnZXQsIGRyYWdFbGVtZW50LCBjdXJyZW50RWxlbWVudCwgcmVjdClcbiAgICAgICAgICAgICAgICA/IGN1cnJlbnRFbGVtZW50XG4gICAgICAgICAgICAgICAgOiBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCB0aGUgbW9zdCBhcHByb3ByaWF0ZSBkcm9wem9uZSBiYXNlZCBvbiBET00gZGVwdGggYW5kIG9yZGVyXG4gICAgICAgIHZhciBkcm9wSW5kZXggPSBzY29wZS5pbmRleE9mRGVlcGVzdEVsZW1lbnQodmFsaWREcm9wcyksXG4gICAgICAgICAgICBkcm9wem9uZSAgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tkcm9wSW5kZXhdIHx8IG51bGwsXG4gICAgICAgICAgICBlbGVtZW50ICAgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtkcm9wSW5kZXhdIHx8IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRyb3B6b25lOiBkcm9wem9uZSxcbiAgICAgICAgICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0RHJvcEV2ZW50czogZnVuY3Rpb24gKHBvaW50ZXJFdmVudCwgZHJhZ0V2ZW50KSB7XG4gICAgICAgIHZhciBkcm9wRXZlbnRzID0ge1xuICAgICAgICAgICAgZW50ZXIgICAgIDogbnVsbCxcbiAgICAgICAgICAgIGxlYXZlICAgICA6IG51bGwsXG4gICAgICAgICAgICBhY3RpdmF0ZSAgOiBudWxsLFxuICAgICAgICAgICAgZGVhY3RpdmF0ZTogbnVsbCxcbiAgICAgICAgICAgIG1vdmUgICAgICA6IG51bGwsXG4gICAgICAgICAgICBkcm9wICAgICAgOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMuZHJvcEVsZW1lbnQgIT09IHRoaXMucHJldkRyb3BFbGVtZW50KSB7XG4gICAgICAgICAgICAvLyBpZiB0aGVyZSB3YXMgYSBwcmV2RHJvcFRhcmdldCwgY3JlYXRlIGEgZHJhZ2xlYXZlIGV2ZW50XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2RHJvcFRhcmdldCkge1xuICAgICAgICAgICAgICAgIGRyb3BFdmVudHMubGVhdmUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCAgICAgICA6IHRoaXMucHJldkRyb3BFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLnByZXZEcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICByZWxhdGVkVGFyZ2V0OiBkcmFnRXZlbnQudGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uICA6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcmFnbGVhdmUnXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGRyYWdFdmVudC5kcmFnTGVhdmUgPSB0aGlzLnByZXZEcm9wRWxlbWVudDtcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQucHJldkRyb3B6b25lID0gdGhpcy5wcmV2RHJvcFRhcmdldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHRoZSBkcm9wVGFyZ2V0IGlzIG5vdCBudWxsLCBjcmVhdGUgYSBkcmFnZW50ZXIgZXZlbnRcbiAgICAgICAgICAgIGlmICh0aGlzLmRyb3BUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICBkcm9wRXZlbnRzLmVudGVyID0ge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiB0aGlzLmRyb3BFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZSAgICA6IGRyYWdFdmVudC5pbnRlcmFjdGFibGUsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgdGltZVN0YW1wICAgIDogZHJhZ0V2ZW50LnRpbWVTdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2RyYWdlbnRlcidcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LmRyYWdFbnRlciA9IHRoaXMuZHJvcEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wVGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcgJiYgdGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLmRyb3AgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3AnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ3N0YXJ0Jykge1xuICAgICAgICAgICAgZHJvcEV2ZW50cy5hY3RpdmF0ZSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIGRyb3B6b25lICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3BhY3RpdmF0ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcpIHtcbiAgICAgICAgICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIGRyb3B6b25lICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3BkZWFjdGl2YXRlJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnbW92ZScgJiYgdGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLm1vdmUgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIGRyYWdtb3ZlICAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wbW92ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJvcEV2ZW50cztcbiAgICB9LFxuXG4gICAgY3VycmVudEFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuZHJhZ2dpbmcgJiYgJ2RyYWcnKSB8fCAodGhpcy5yZXNpemluZyAmJiAncmVzaXplJykgfHwgKHRoaXMuZ2VzdHVyaW5nICYmICdnZXN0dXJlJykgfHwgbnVsbDtcbiAgICB9LFxuXG4gICAgaW50ZXJhY3Rpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHJhZ2dpbmcgfHwgdGhpcy5yZXNpemluZyB8fCB0aGlzLmdlc3R1cmluZztcbiAgICB9LFxuXG4gICAgY2xlYXJUYXJnZXRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSB0aGlzLmRyb3BFbGVtZW50ID0gdGhpcy5wcmV2RHJvcFRhcmdldCA9IHRoaXMucHJldkRyb3BFbGVtZW50ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgIHNjb3BlLmF1dG9TY3JvbGwuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gW107XG4gICAgICAgICAgICB0aGlzLm1hdGNoRWxlbWVudHMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0Lm9wdGlvbnMuc3R5bGVDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHByZXZlbnQgRGVmYXVsdCBvbmx5IGlmIHdlcmUgcHJldmlvdXNseSBpbnRlcmFjdGluZ1xuICAgICAgICAgICAgaWYgKGV2ZW50ICYmIHNjb3BlLmlzRnVuY3Rpb24oZXZlbnQucHJldmVudERlZmF1bHQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRyYWdnaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzID0gdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyVGFyZ2V0cygpO1xuXG4gICAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRoaXMuc25hcFN0YXR1cy5sb2NrZWQgPSB0aGlzLmRyYWdnaW5nID0gdGhpcy5yZXNpemluZyA9IHRoaXMuZ2VzdHVyaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR4ID0gdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR5ID0gMDtcblxuICAgICAgICAvLyByZW1vdmUgcG9pbnRlcnMgaWYgdGhlaXIgSUQgaXNuJ3QgaW4gdGhpcy5wb2ludGVySWRzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wb2ludGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQodGhpcy5wb2ludGVyc1tpXSkpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoaXMgaW50ZXJhY3Rpb24gaWYgaXQncyBub3QgdGhlIG9ubHkgb25lIG9mIGl0J3MgdHlwZVxuICAgICAgICAgICAgaWYgKHNjb3BlLmludGVyYWN0aW9uc1tpXSAhPT0gdGhpcyAmJiBzY29wZS5pbnRlcmFjdGlvbnNbaV0ubW91c2UgPT09IHRoaXMubW91c2UpIHtcbiAgICAgICAgICAgICAgICBzY29wZS5pbnRlcmFjdGlvbnMuc3BsaWNlKHNjb3BlLmluZGV4T2Yoc2NvcGUuaW50ZXJhY3Rpb25zLCB0aGlzKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5lcnRpYUZyYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbmVydGlhU3RhdHVzID0gdGhpcy5pbmVydGlhU3RhdHVzLFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLFxuICAgICAgICAgICAgbGFtYmRhID0gb3B0aW9ucy5yZXNpc3RhbmNlLFxuICAgICAgICAgICAgdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCAtIGluZXJ0aWFTdGF0dXMudDA7XG5cbiAgICAgICAgaWYgKHQgPCBpbmVydGlhU3RhdHVzLnRlKSB7XG5cbiAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9ICAxIC0gKE1hdGguZXhwKC1sYW1iZGEgKiB0KSAtIGluZXJ0aWFTdGF0dXMubGFtYmRhX3YwKSAvIGluZXJ0aWFTdGF0dXMub25lX3ZlX3YwO1xuXG4gICAgICAgICAgICBpZiAoaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlID09PSBpbmVydGlhU3RhdHVzLnhlICYmIGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZSA9PT0gaW5lcnRpYVN0YXR1cy55ZSkge1xuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBpbmVydGlhU3RhdHVzLnhlICogcHJvZ3Jlc3M7XG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IGluZXJ0aWFTdGF0dXMueWUgKiBwcm9ncmVzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBxdWFkUG9pbnQgPSBzY29wZS5nZXRRdWFkcmF0aWNDdXJ2ZVBvaW50KFxuICAgICAgICAgICAgICAgICAgICAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnhlLCBpbmVydGlhU3RhdHVzLnllLFxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWGUsIGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MpO1xuXG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IHF1YWRQb2ludC54O1xuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBxdWFkUG9pbnQueTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuaSA9IGFuaW1hdGlvbkZyYW1lLnJlcXVlc3QodGhpcy5ib3VuZEluZXJ0aWFGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlO1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IGluZXJ0aWFTdGF0dXMubW9kaWZpZWRZZTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJFbmQoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNtb290aEVuZEZyYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbmVydGlhU3RhdHVzID0gdGhpcy5pbmVydGlhU3RhdHVzLFxuICAgICAgICAgICAgdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gaW5lcnRpYVN0YXR1cy50MCxcbiAgICAgICAgICAgIGR1cmF0aW9uID0gdGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEuc21vb3RoRW5kRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHQgPCBkdXJhdGlvbikge1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IHNjb3BlLmVhc2VPdXRRdWFkKHQsIDAsIGluZXJ0aWFTdGF0dXMueGUsIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBzY29wZS5lYXNlT3V0UXVhZCh0LCAwLCBpbmVydGlhU3RhdHVzLnllLCBkdXJhdGlvbik7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlck1vdmUoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLmkgPSBhbmltYXRpb25GcmFtZS5yZXF1ZXN0KHRoaXMuYm91bmRTbW9vdGhFbmRGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy54ZTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBpbmVydGlhU3RhdHVzLnllO1xuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcblxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc21vb3RoRW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlckVuZChpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkUG9pbnRlcjogZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICAgICAgdmFyIGlkID0gdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpLFxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIGlkKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBpbmRleCA9IHRoaXMucG9pbnRlcklkcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJJZHNbaW5kZXhdID0gaWQ7XG4gICAgICAgIHRoaXMucG9pbnRlcnNbaW5kZXhdID0gcG9pbnRlcjtcblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcblxuICAgIHJlbW92ZVBvaW50ZXI6IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgICAgIHZhciBpZCA9IHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSxcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCBpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkgeyByZXR1cm47IH1cblxuICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy5wb2ludGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wb2ludGVySWRzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmRvd25UYXJnZXRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMuZG93blRpbWVzICAuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdGhpcy5ob2xkVGltZXJzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH0sXG5cbiAgICByZWNvcmRQb2ludGVyOiBmdW5jdGlvbiAocG9pbnRlcikge1xuICAgICAgICAvLyBEbyBub3QgdXBkYXRlIHBvaW50ZXJzIHdoaWxlIGluZXJ0aWEgaXMgYWN0aXZlLlxuICAgICAgICAvLyBUaGUgaW5lcnRpYSBzdGFydCBldmVudCBzaG91bGQgYmUgdGhpcy5wb2ludGVyc1swXVxuICAgICAgICBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm1vdXNlPyAwOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcnNbaW5kZXhdID0gcG9pbnRlcjtcbiAgICB9LFxuXG4gICAgY29sbGVjdEV2ZW50VGFyZ2V0czogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZXZlbnRUeXBlKSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgLy8gZG8gbm90IGZpcmUgYSB0YXAgZXZlbnQgaWYgdGhlIHBvaW50ZXIgd2FzIG1vdmVkIGJlZm9yZSBiZWluZyBsaWZ0ZWRcbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ3RhcCcgJiYgKHRoaXMucG9pbnRlcldhc01vdmVkXG4gICAgICAgICAgICAgICAgLy8gb3IgaWYgdGhlIHBvaW50ZXJ1cCB0YXJnZXQgaXMgZGlmZmVyZW50IHRvIHRoZSBwb2ludGVyZG93biB0YXJnZXRcbiAgICAgICAgICAgIHx8ICEodGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdICYmIHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSA9PT0gZXZlbnRUYXJnZXQpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRhcmdldHMgPSBbXSxcbiAgICAgICAgICAgIGVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY29sbGVjdFNlbGVjdG9ycyAoaW50ZXJhY3RhYmxlLCBzZWxlY3RvciwgY29udGV4dCkge1xuICAgICAgICAgICAgdmFyIGVscyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgID8gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlLl9pRXZlbnRzW2V2ZW50VHlwZV1cbiAgICAgICAgICAgICAgICAmJiB1dGlscy5pc0VsZW1lbnQoZWxlbWVudClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuICAgICAgICAgICAgICAgICYmICFzY29wZS50ZXN0SWdub3JlKGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUudGVzdEFsbG93KGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yLCBlbHMpKSB7XG5cbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goaW50ZXJhY3RhYmxlKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgaW50ZXJhY3QgPSBzY29wZS5pbnRlcmFjdDtcblxuICAgICAgICB3aGlsZSAoZWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGludGVyYWN0LmlzU2V0KGVsZW1lbnQpICYmIGludGVyYWN0KGVsZW1lbnQpLl9pRXZlbnRzW2V2ZW50VHlwZV0pIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goaW50ZXJhY3QoZWxlbWVudCkpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKGNvbGxlY3RTZWxlY3RvcnMpO1xuXG4gICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgdGFwIGV2ZW50IGV2ZW4gaWYgdGhlcmUgYXJlIG5vIGxpc3RlbmVycyBzbyB0aGF0XG4gICAgICAgIC8vIGRvdWJsZXRhcCBjYW4gc3RpbGwgYmUgY3JlYXRlZCBhbmQgZmlyZWRcbiAgICAgICAgaWYgKHRhcmdldHMubGVuZ3RoIHx8IGV2ZW50VHlwZSA9PT0gJ3RhcCcpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZVBvaW50ZXJzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgdGFyZ2V0cywgZWxlbWVudHMsIGV2ZW50VHlwZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZmlyZVBvaW50ZXJzOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0YXJnZXRzLCBlbGVtZW50cywgZXZlbnRUeXBlKSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpLFxuICAgICAgICAgICAgcG9pbnRlckV2ZW50ID0ge30sXG4gICAgICAgICAgICBpLFxuICAgICAgICAvLyBmb3IgdGFwIGV2ZW50c1xuICAgICAgICAgICAgaW50ZXJ2YWwsIGNyZWF0ZU5ld0RvdWJsZVRhcDtcblxuICAgICAgICAvLyBpZiBpdCdzIGEgZG91YmxldGFwIHRoZW4gdGhlIGV2ZW50IHByb3BlcnRpZXMgd291bGQgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGNvcGllZCBmcm9tIHRoZSB0YXAgZXZlbnQgYW5kIHByb3ZpZGVkIGFzIHRoZSBwb2ludGVyIGFyZ3VtZW50XG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICdkb3VibGV0YXAnKSB7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQgPSBwb2ludGVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHBvaW50ZXJFdmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgaWYgKGV2ZW50ICE9PSBwb2ludGVyKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHBvaW50ZXJFdmVudCwgcG9pbnRlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5wcmV2ZW50RGVmYXVsdCAgICAgICAgICAgPSBwcmV2ZW50T3JpZ2luYWxEZWZhdWx0O1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnN0b3BQcm9wYWdhdGlvbiAgICAgICAgICA9IEludGVyYWN0RXZlbnQucHJvdG90eXBlLnN0b3BQcm9wYWdhdGlvbjtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gPSBJbnRlcmFjdEV2ZW50LnByb3RvdHlwZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb247XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuaW50ZXJhY3Rpb24gICAgICAgICAgICAgID0gdGhpcztcblxuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnRpbWVTdGFtcCAgICAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5vcmlnaW5hbEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQudHlwZSAgICAgICAgICA9IGV2ZW50VHlwZTtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5wb2ludGVySWQgICAgID0gdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnBvaW50ZXJUeXBlICAgPSB0aGlzLm1vdXNlPyAnbW91c2UnIDogIWJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQ/ICd0b3VjaCdcbiAgICAgICAgICAgICAgICA6IHNjb3BlLmlzU3RyaW5nKHBvaW50ZXIucG9pbnRlclR5cGUpXG4gICAgICAgICAgICAgICAgPyBwb2ludGVyLnBvaW50ZXJUeXBlXG4gICAgICAgICAgICAgICAgOiBbLCwndG91Y2gnLCAncGVuJywgJ21vdXNlJ11bcG9pbnRlci5wb2ludGVyVHlwZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAndGFwJykge1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmR0ID0gcG9pbnRlckV2ZW50LnRpbWVTdGFtcCAtIHRoaXMuZG93blRpbWVzW3BvaW50ZXJJbmRleF07XG5cbiAgICAgICAgICAgIGludGVydmFsID0gcG9pbnRlckV2ZW50LnRpbWVTdGFtcCAtIHRoaXMudGFwVGltZTtcbiAgICAgICAgICAgIGNyZWF0ZU5ld0RvdWJsZVRhcCA9ICEhKHRoaXMucHJldlRhcCAmJiB0aGlzLnByZXZUYXAudHlwZSAhPT0gJ2RvdWJsZXRhcCdcbiAgICAgICAgICAgICYmIHRoaXMucHJldlRhcC50YXJnZXQgPT09IHBvaW50ZXJFdmVudC50YXJnZXRcbiAgICAgICAgICAgICYmIGludGVydmFsIDwgNTAwKTtcblxuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmRvdWJsZSA9IGNyZWF0ZU5ld0RvdWJsZVRhcDtcblxuICAgICAgICAgICAgdGhpcy50YXBUaW1lID0gcG9pbnRlckV2ZW50LnRpbWVTdGFtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YXJnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuY3VycmVudFRhcmdldCA9IGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmludGVyYWN0YWJsZSA9IHRhcmdldHNbaV07XG4gICAgICAgICAgICB0YXJnZXRzW2ldLmZpcmUocG9pbnRlckV2ZW50KTtcblxuICAgICAgICAgICAgaWYgKHBvaW50ZXJFdmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWRcbiAgICAgICAgICAgICAgICB8fChwb2ludGVyRXZlbnQucHJvcGFnYXRpb25TdG9wcGVkICYmIGVsZW1lbnRzW2kgKyAxXSAhPT0gcG9pbnRlckV2ZW50LmN1cnJlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3JlYXRlTmV3RG91YmxlVGFwKSB7XG4gICAgICAgICAgICB2YXIgZG91YmxlVGFwID0ge307XG5cbiAgICAgICAgICAgIHV0aWxzLmV4dGVuZChkb3VibGVUYXAsIHBvaW50ZXJFdmVudCk7XG5cbiAgICAgICAgICAgIGRvdWJsZVRhcC5kdCAgID0gaW50ZXJ2YWw7XG4gICAgICAgICAgICBkb3VibGVUYXAudHlwZSA9ICdkb3VibGV0YXAnO1xuXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMoZG91YmxlVGFwLCBldmVudCwgZXZlbnRUYXJnZXQsICdkb3VibGV0YXAnKTtcblxuICAgICAgICAgICAgdGhpcy5wcmV2VGFwID0gZG91YmxlVGFwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ3RhcCcpIHtcbiAgICAgICAgICAgIHRoaXMucHJldlRhcCA9IHBvaW50ZXJFdmVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVNlbGVjdG9yOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIG1hdGNoZXMsIG1hdGNoRWxlbWVudHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG1hdGNoZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IG1hdGNoZXNbaV0sXG4gICAgICAgICAgICAgICAgbWF0Y2hFbGVtZW50ID0gbWF0Y2hFbGVtZW50c1tpXSxcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSB2YWxpZGF0ZUFjdGlvbihtYXRjaC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIG1hdGNoRWxlbWVudCksIG1hdGNoKTtcblxuICAgICAgICAgICAgaWYgKGFjdGlvbiAmJiBzY29wZS53aXRoaW5JbnRlcmFjdGlvbkxpbWl0KG1hdGNoLCBtYXRjaEVsZW1lbnQsIGFjdGlvbikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IG1hdGNoO1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG1hdGNoRWxlbWVudDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0U25hcHBpbmc6IGZ1bmN0aW9uIChwYWdlQ29vcmRzLCBzdGF0dXMpIHtcbiAgICAgICAgdmFyIHNuYXAgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcCxcbiAgICAgICAgICAgIHRhcmdldHMgPSBbXSxcbiAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIHN0YXR1cyA9IHN0YXR1cyB8fCB0aGlzLnNuYXBTdGF0dXM7XG5cbiAgICAgICAgaWYgKHN0YXR1cy51c2VTdGF0dXNYWSkge1xuICAgICAgICAgICAgcGFnZSA9IHsgeDogc3RhdHVzLngsIHk6IHN0YXR1cy55IH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgb3JpZ2luID0gc2NvcGUuZ2V0T3JpZ2luWFkodGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHBhZ2UgPSB1dGlscy5leHRlbmQoe30sIHBhZ2VDb29yZHMpO1xuXG4gICAgICAgICAgICBwYWdlLnggLT0gb3JpZ2luLng7XG4gICAgICAgICAgICBwYWdlLnkgLT0gb3JpZ2luLnk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMucmVhbFggPSBwYWdlLng7XG4gICAgICAgIHN0YXR1cy5yZWFsWSA9IHBhZ2UueTtcblxuICAgICAgICBwYWdlLnggPSBwYWdlLnggLSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHg7XG4gICAgICAgIHBhZ2UueSA9IHBhZ2UueSAtIHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeTtcblxuICAgICAgICB2YXIgbGVuID0gc25hcC50YXJnZXRzPyBzbmFwLnRhcmdldHMubGVuZ3RoIDogMDtcblxuICAgICAgICBmb3IgKHZhciByZWxJbmRleCA9IDA7IHJlbEluZGV4IDwgdGhpcy5zbmFwT2Zmc2V0cy5sZW5ndGg7IHJlbEluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciByZWxhdGl2ZSA9IHtcbiAgICAgICAgICAgICAgICB4OiBwYWdlLnggLSB0aGlzLnNuYXBPZmZzZXRzW3JlbEluZGV4XS54LFxuICAgICAgICAgICAgICAgIHk6IHBhZ2UueSAtIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLnlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHNuYXAudGFyZ2V0c1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gc25hcC50YXJnZXRzW2ldKHJlbGF0aXZlLngsIHJlbGF0aXZlLnksIHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gc25hcC50YXJnZXRzW2ldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiBzY29wZS5pc051bWJlcih0YXJnZXQueCkgPyAodGFyZ2V0LnggKyB0aGlzLnNuYXBPZmZzZXRzW3JlbEluZGV4XS54KSA6IHJlbGF0aXZlLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IHNjb3BlLmlzTnVtYmVyKHRhcmdldC55KSA/ICh0YXJnZXQueSArIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLnkpIDogcmVsYXRpdmUueSxcblxuICAgICAgICAgICAgICAgICAgICByYW5nZTogc2NvcGUuaXNOdW1iZXIodGFyZ2V0LnJhbmdlKT8gdGFyZ2V0LnJhbmdlOiBzbmFwLnJhbmdlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2xvc2VzdCA9IHtcbiAgICAgICAgICAgIHRhcmdldDogbnVsbCxcbiAgICAgICAgICAgIGluUmFuZ2U6IGZhbHNlLFxuICAgICAgICAgICAgZGlzdGFuY2U6IDAsXG4gICAgICAgICAgICByYW5nZTogMCxcbiAgICAgICAgICAgIGR4OiAwLFxuICAgICAgICAgICAgZHk6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSB0YXJnZXRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXRzW2ldO1xuXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSB0YXJnZXQucmFuZ2UsXG4gICAgICAgICAgICAgICAgZHggPSB0YXJnZXQueCAtIHBhZ2UueCxcbiAgICAgICAgICAgICAgICBkeSA9IHRhcmdldC55IC0gcGFnZS55LFxuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gdXRpbHMuaHlwb3QoZHgsIGR5KSxcbiAgICAgICAgICAgICAgICBpblJhbmdlID0gZGlzdGFuY2UgPD0gcmFuZ2U7XG5cbiAgICAgICAgICAgIC8vIEluZmluaXRlIHRhcmdldHMgY291bnQgYXMgYmVpbmcgb3V0IG9mIHJhbmdlXG4gICAgICAgICAgICAvLyBjb21wYXJlZCB0byBub24gaW5maW5pdGUgb25lcyB0aGF0IGFyZSBpbiByYW5nZVxuICAgICAgICAgICAgaWYgKHJhbmdlID09PSBJbmZpbml0eSAmJiBjbG9zZXN0LmluUmFuZ2UgJiYgY2xvc2VzdC5yYW5nZSAhPT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICBpblJhbmdlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY2xvc2VzdC50YXJnZXQgfHwgKGluUmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8gaXMgdGhlIGNsb3Nlc3QgdGFyZ2V0IGluIHJhbmdlP1xuICAgICAgICAgICAgICAgICAgICA/IChjbG9zZXN0LmluUmFuZ2UgJiYgcmFuZ2UgIT09IEluZmluaXR5XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBwb2ludGVyIGlzIHJlbGF0aXZlbHkgZGVlcGVyIGluIHRoaXMgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgID8gZGlzdGFuY2UgLyByYW5nZSA8IGNsb3Nlc3QuZGlzdGFuY2UgLyBjbG9zZXN0LnJhbmdlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgdGFyZ2V0IGhhcyBJbmZpbml0ZSByYW5nZSBhbmQgdGhlIGNsb3Nlc3QgZG9lc24ndFxuICAgICAgICAgICAgICAgICAgICA6IChyYW5nZSA9PT0gSW5maW5pdHkgJiYgY2xvc2VzdC5yYW5nZSAhPT0gSW5maW5pdHkpXG4gICAgICAgICAgICAgICAgICAgIC8vIE9SIHRoaXMgdGFyZ2V0IGlzIGNsb3NlciB0aGF0IHRoZSBwcmV2aW91cyBjbG9zZXN0XG4gICAgICAgICAgICAgICAgfHwgZGlzdGFuY2UgPCBjbG9zZXN0LmRpc3RhbmNlKVxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgb3RoZXIgaXMgbm90IGluIHJhbmdlIGFuZCB0aGUgcG9pbnRlciBpcyBjbG9zZXIgdG8gdGhpcyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgOiAoIWNsb3Nlc3QuaW5SYW5nZSAmJiBkaXN0YW5jZSA8IGNsb3Nlc3QuZGlzdGFuY2UpKSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKHJhbmdlID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgICAgICBpblJhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjbG9zZXN0LnRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5yYW5nZSA9IHJhbmdlO1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QuaW5SYW5nZSA9IGluUmFuZ2U7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5keCA9IGR4O1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QuZHkgPSBkeTtcblxuICAgICAgICAgICAgICAgIHN0YXR1cy5yYW5nZSA9IHJhbmdlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNuYXBDaGFuZ2VkO1xuXG4gICAgICAgIGlmIChjbG9zZXN0LnRhcmdldCkge1xuICAgICAgICAgICAgc25hcENoYW5nZWQgPSAoc3RhdHVzLnNuYXBwZWRYICE9PSBjbG9zZXN0LnRhcmdldC54IHx8IHN0YXR1cy5zbmFwcGVkWSAhPT0gY2xvc2VzdC50YXJnZXQueSk7XG5cbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWCA9IGNsb3Nlc3QudGFyZ2V0Lng7XG4gICAgICAgICAgICBzdGF0dXMuc25hcHBlZFkgPSBjbG9zZXN0LnRhcmdldC55O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc25hcENoYW5nZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBzdGF0dXMuc25hcHBlZFggPSBOYU47XG4gICAgICAgICAgICBzdGF0dXMuc25hcHBlZFkgPSBOYU47XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMuZHggPSBjbG9zZXN0LmR4O1xuICAgICAgICBzdGF0dXMuZHkgPSBjbG9zZXN0LmR5O1xuXG4gICAgICAgIHN0YXR1cy5jaGFuZ2VkID0gKHNuYXBDaGFuZ2VkIHx8IChjbG9zZXN0LmluUmFuZ2UgJiYgIXN0YXR1cy5sb2NrZWQpKTtcbiAgICAgICAgc3RhdHVzLmxvY2tlZCA9IGNsb3Nlc3QuaW5SYW5nZTtcblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBzZXRSZXN0cmljdGlvbjogZnVuY3Rpb24gKHBhZ2VDb29yZHMsIHN0YXR1cykge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQsXG4gICAgICAgICAgICByZXN0cmljdCA9IHRhcmdldCAmJiB0YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LFxuICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSByZXN0cmljdCAmJiByZXN0cmljdC5yZXN0cmljdGlvbixcbiAgICAgICAgICAgIHBhZ2U7XG5cbiAgICAgICAgaWYgKCFyZXN0cmljdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cyA9IHN0YXR1cyB8fCB0aGlzLnJlc3RyaWN0U3RhdHVzO1xuXG4gICAgICAgIHBhZ2UgPSBzdGF0dXMudXNlU3RhdHVzWFlcbiAgICAgICAgICAgID8gcGFnZSA9IHsgeDogc3RhdHVzLngsIHk6IHN0YXR1cy55IH1cbiAgICAgICAgICAgIDogcGFnZSA9IHV0aWxzLmV4dGVuZCh7fSwgcGFnZUNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKHN0YXR1cy5zbmFwICYmIHN0YXR1cy5zbmFwLmxvY2tlZCkge1xuICAgICAgICAgICAgcGFnZS54ICs9IHN0YXR1cy5zbmFwLmR4IHx8IDA7XG4gICAgICAgICAgICBwYWdlLnkgKz0gc3RhdHVzLnNuYXAuZHkgfHwgMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhZ2UueCAtPSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHg7XG4gICAgICAgIHBhZ2UueSAtPSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHk7XG5cbiAgICAgICAgc3RhdHVzLmR4ID0gMDtcbiAgICAgICAgc3RhdHVzLmR5ID0gMDtcbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgcmVjdCwgcmVzdHJpY3RlZFgsIHJlc3RyaWN0ZWRZO1xuXG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhyZXN0cmljdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChyZXN0cmljdGlvbiA9PT0gJ3BhcmVudCcpIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbiA9IHNjb3BlLnBhcmVudEVsZW1lbnQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHJlc3RyaWN0aW9uID09PSAnc2VsZicpIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbiA9IHRhcmdldC5nZXRSZWN0KHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbiA9IHNjb3BlLmNsb3Nlc3QodGhpcy5lbGVtZW50LCByZXN0cmljdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghcmVzdHJpY3Rpb24pIHsgcmV0dXJuIHN0YXR1czsgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocmVzdHJpY3Rpb24pKSB7XG4gICAgICAgICAgICByZXN0cmljdGlvbiA9IHJlc3RyaWN0aW9uKHBhZ2UueCwgcGFnZS55LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChyZXN0cmljdGlvbikpIHtcbiAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gc2NvcGUuZ2V0RWxlbWVudFJlY3QocmVzdHJpY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjdCA9IHJlc3RyaWN0aW9uO1xuXG4gICAgICAgIGlmICghcmVzdHJpY3Rpb24pIHtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRYID0gcGFnZS54O1xuICAgICAgICAgICAgcmVzdHJpY3RlZFkgPSBwYWdlLnk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0IGlzIGFzc3VtZWQgdG8gaGF2ZVxuICAgICAgICAvLyB4LCB5LCB3aWR0aCwgaGVpZ2h0IG9yXG4gICAgICAgIC8vIGxlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbVxuICAgICAgICBlbHNlIGlmICgneCcgaW4gcmVzdHJpY3Rpb24gJiYgJ3knIGluIHJlc3RyaWN0aW9uKSB7XG4gICAgICAgICAgICByZXN0cmljdGVkWCA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QueCArIHJlY3Qud2lkdGggIC0gdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAsIHBhZ2UueCksIHJlY3QueCArIHRoaXMucmVzdHJpY3RPZmZzZXQubGVmdCk7XG4gICAgICAgICAgICByZXN0cmljdGVkWSA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QueSArIHJlY3QuaGVpZ2h0IC0gdGhpcy5yZXN0cmljdE9mZnNldC5ib3R0b20sIHBhZ2UueSksIHJlY3QueSArIHRoaXMucmVzdHJpY3RPZmZzZXQudG9wICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXN0cmljdGVkWCA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QucmlnaHQgIC0gdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAsIHBhZ2UueCksIHJlY3QubGVmdCArIHRoaXMucmVzdHJpY3RPZmZzZXQubGVmdCk7XG4gICAgICAgICAgICByZXN0cmljdGVkWSA9IE1hdGgubWF4KE1hdGgubWluKHJlY3QuYm90dG9tIC0gdGhpcy5yZXN0cmljdE9mZnNldC5ib3R0b20sIHBhZ2UueSksIHJlY3QudG9wICArIHRoaXMucmVzdHJpY3RPZmZzZXQudG9wICk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMuZHggPSByZXN0cmljdGVkWCAtIHBhZ2UueDtcbiAgICAgICAgc3RhdHVzLmR5ID0gcmVzdHJpY3RlZFkgLSBwYWdlLnk7XG5cbiAgICAgICAgc3RhdHVzLmNoYW5nZWQgPSBzdGF0dXMucmVzdHJpY3RlZFggIT09IHJlc3RyaWN0ZWRYIHx8IHN0YXR1cy5yZXN0cmljdGVkWSAhPT0gcmVzdHJpY3RlZFk7XG4gICAgICAgIHN0YXR1cy5yZXN0cmljdGVkID0gISEoc3RhdHVzLmR4IHx8IHN0YXR1cy5keSk7XG5cbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWRYID0gcmVzdHJpY3RlZFg7XG4gICAgICAgIHN0YXR1cy5yZXN0cmljdGVkWSA9IHJlc3RyaWN0ZWRZO1xuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIGNoZWNrQW5kUHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uIChldmVudCwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgICAgIGlmICghKGludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZSB8fCB0aGlzLnRhcmdldCkpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucyxcbiAgICAgICAgICAgIHByZXZlbnQgPSBvcHRpb25zLnByZXZlbnREZWZhdWx0O1xuXG4gICAgICAgIGlmIChwcmV2ZW50ID09PSAnYXV0bycgJiYgZWxlbWVudCAmJiAhL14oaW5wdXR8c2VsZWN0fHRleHRhcmVhKSQvaS50ZXN0KGV2ZW50LnRhcmdldC5ub2RlTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdCBwcmV2ZW50RGVmYXVsdCBvbiBwb2ludGVyZG93biBpZiB0aGUgcHJlcGFyZWQgYWN0aW9uIGlzIGEgZHJhZ1xuICAgICAgICAgICAgLy8gYW5kIGRyYWdnaW5nIGNhbiBvbmx5IHN0YXJ0IGZyb20gYSBjZXJ0YWluIGRpcmVjdGlvbiAtIHRoaXMgYWxsb3dzXG4gICAgICAgICAgICAvLyBhIHRvdWNoIHRvIHBhbiB0aGUgdmlld3BvcnQgaWYgYSBkcmFnIGlzbid0IGluIHRoZSByaWdodCBkaXJlY3Rpb25cbiAgICAgICAgICAgIGlmICgvZG93bnxzdGFydC9pLnRlc3QoZXZlbnQudHlwZSlcbiAgICAgICAgICAgICAgICAmJiB0aGlzLnByZXBhcmVkLm5hbWUgPT09ICdkcmFnJyAmJiBvcHRpb25zLmRyYWcuYXhpcyAhPT0gJ3h5Jykge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3aXRoIG1hbnVhbFN0YXJ0LCBvbmx5IHByZXZlbnREZWZhdWx0IHdoaWxlIGludGVyYWN0aW5nXG4gICAgICAgICAgICBpZiAob3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5tYW51YWxTdGFydFxuICAgICAgICAgICAgICAgICYmICF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJldmVudCA9PT0gJ2Fsd2F5cycpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2FsY0luZXJ0aWE6IGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgdmFyIGluZXJ0aWFPcHRpb25zID0gdGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEsXG4gICAgICAgICAgICBsYW1iZGEgPSBpbmVydGlhT3B0aW9ucy5yZXNpc3RhbmNlLFxuICAgICAgICAgICAgaW5lcnRpYUR1ciA9IC1NYXRoLmxvZyhpbmVydGlhT3B0aW9ucy5lbmRTcGVlZCAvIHN0YXR1cy52MCkgLyBsYW1iZGE7XG5cbiAgICAgICAgc3RhdHVzLngwID0gdGhpcy5wcmV2RXZlbnQucGFnZVg7XG4gICAgICAgIHN0YXR1cy55MCA9IHRoaXMucHJldkV2ZW50LnBhZ2VZO1xuICAgICAgICBzdGF0dXMudDAgPSBzdGF0dXMuc3RhcnRFdmVudC50aW1lU3RhbXAgLyAxMDAwO1xuICAgICAgICBzdGF0dXMuc3ggPSBzdGF0dXMuc3kgPSAwO1xuXG4gICAgICAgIHN0YXR1cy5tb2RpZmllZFhlID0gc3RhdHVzLnhlID0gKHN0YXR1cy52eDAgLSBpbmVydGlhRHVyKSAvIGxhbWJkYTtcbiAgICAgICAgc3RhdHVzLm1vZGlmaWVkWWUgPSBzdGF0dXMueWUgPSAoc3RhdHVzLnZ5MCAtIGluZXJ0aWFEdXIpIC8gbGFtYmRhO1xuICAgICAgICBzdGF0dXMudGUgPSBpbmVydGlhRHVyO1xuXG4gICAgICAgIHN0YXR1cy5sYW1iZGFfdjAgPSBsYW1iZGEgLyBzdGF0dXMudjA7XG4gICAgICAgIHN0YXR1cy5vbmVfdmVfdjAgPSAxIC0gaW5lcnRpYU9wdGlvbnMuZW5kU3BlZWQgLyBzdGF0dXMudjA7XG4gICAgfSxcblxuICAgIGF1dG9TY3JvbGxNb3ZlOiBmdW5jdGlvbiAocG9pbnRlcikge1xuICAgICAgICBpZiAoISh0aGlzLmludGVyYWN0aW5nKClcbiAgICAgICAgICAgICYmIHNjb3BlLmNoZWNrQXV0b1Njcm9sbCh0aGlzLnRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnggPSBzY29wZS5hdXRvU2Nyb2xsLnkgPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRvcCxcbiAgICAgICAgICAgIHJpZ2h0LFxuICAgICAgICAgICAgYm90dG9tLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uYXV0b1Njcm9sbCxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG9wdGlvbnMuY29udGFpbmVyIHx8IHNjb3BlLmdldFdpbmRvdyh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGlmIChzY29wZS5pc1dpbmRvdyhjb250YWluZXIpKSB7XG4gICAgICAgICAgICBsZWZ0ICAgPSBwb2ludGVyLmNsaWVudFggPCBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIHRvcCAgICA9IHBvaW50ZXIuY2xpZW50WSA8IHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgcmlnaHQgID0gcG9pbnRlci5jbGllbnRYID4gY29udGFpbmVyLmlubmVyV2lkdGggIC0gc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICBib3R0b20gPSBwb2ludGVyLmNsaWVudFkgPiBjb250YWluZXIuaW5uZXJIZWlnaHQgLSBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gc2NvcGUuZ2V0RWxlbWVudFJlY3QoY29udGFpbmVyKTtcblxuICAgICAgICAgICAgbGVmdCAgID0gcG9pbnRlci5jbGllbnRYIDwgcmVjdC5sZWZ0ICAgKyBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIHRvcCAgICA9IHBvaW50ZXIuY2xpZW50WSA8IHJlY3QudG9wICAgICsgc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICByaWdodCAgPSBwb2ludGVyLmNsaWVudFggPiByZWN0LnJpZ2h0ICAtIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgYm90dG9tID0gcG9pbnRlci5jbGllbnRZID4gcmVjdC5ib3R0b20gLSBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmF1dG9TY3JvbGwueCA9IChyaWdodCA/IDE6IGxlZnQ/IC0xOiAwKTtcbiAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC55ID0gKGJvdHRvbT8gMTogIHRvcD8gLTE6IDApO1xuXG4gICAgICAgIGlmICghc2NvcGUuYXV0b1Njcm9sbC5pc1Njcm9sbGluZykge1xuICAgICAgICAgICAgLy8gc2V0IHRoZSBhdXRvU2Nyb2xsIHByb3BlcnRpZXMgdG8gdGhvc2Ugb2YgdGhlIHRhcmdldFxuICAgICAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW4gPSBvcHRpb25zLm1hcmdpbjtcbiAgICAgICAgICAgIHNjb3BlLmF1dG9TY3JvbGwuc3BlZWQgID0gb3B0aW9ucy5zcGVlZDtcblxuICAgICAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC5zdGFydCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlRXZlbnRUYXJnZXRzOiBmdW5jdGlvbiAodGFyZ2V0LCBjdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50VGFyZ2V0ICAgID0gdGFyZ2V0O1xuICAgICAgICB0aGlzLl9jdXJFdmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQ7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFmICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9yYWYnKSxcbiAgICBnZXRXaW5kb3cgPSByZXF1aXJlKCcuL3V0aWxzL3dpbmRvdycpLmdldFdpbmRvdyxcbiAgICBpc1dpbmRvdyAgPSByZXF1aXJlKCcuL3V0aWxzL2lzVHlwZScpLmlzV2luZG93O1xuXG52YXIgYXV0b1Njcm9sbCA9IHtcblxuICAgIGludGVyYWN0aW9uOiBudWxsLFxuICAgIGk6IG51bGwsICAgIC8vIHRoZSBoYW5kbGUgcmV0dXJuZWQgYnkgd2luZG93LnNldEludGVydmFsXG4gICAgeDogMCwgeTogMCwgLy8gRGlyZWN0aW9uIGVhY2ggcHVsc2UgaXMgdG8gc2Nyb2xsIGluXG5cbiAgICBpc1Njcm9sbGluZzogZmFsc2UsXG4gICAgcHJldlRpbWU6IDAsXG5cbiAgICBzdGFydDogZnVuY3Rpb24gKGludGVyYWN0aW9uKSB7XG4gICAgICAgIGF1dG9TY3JvbGwuaXNTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICByYWYuY2FuY2VsKGF1dG9TY3JvbGwuaSk7XG5cbiAgICAgICAgYXV0b1Njcm9sbC5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGF1dG9TY3JvbGwuaSA9IHJhZi5yZXF1ZXN0KGF1dG9TY3JvbGwuc2Nyb2xsKTtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBhdXRvU2Nyb2xsLmlzU2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIHJhZi5jYW5jZWwoYXV0b1Njcm9sbC5pKTtcbiAgICB9LFxuXG4gICAgLy8gc2Nyb2xsIHRoZSB3aW5kb3cgYnkgdGhlIHZhbHVlcyBpbiBzY3JvbGwueC95XG4gICAgc2Nyb2xsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi50YXJnZXQub3B0aW9uc1thdXRvU2Nyb2xsLmludGVyYWN0aW9uLnByZXBhcmVkLm5hbWVdLmF1dG9TY3JvbGwsXG4gICAgICAgICAgICBjb250YWluZXIgPSBvcHRpb25zLmNvbnRhaW5lciB8fCBnZXRXaW5kb3coYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi5lbGVtZW50KSxcbiAgICAgICAgICAgIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgLy8gY2hhbmdlIGluIHRpbWUgaW4gc2Vjb25kc1xuICAgICAgICAgICAgZHQgPSAobm93IC0gYXV0b1Njcm9sbC5wcmV2VGltZSkgLyAxMDAwLFxuICAgICAgICAgICAgLy8gZGlzcGxhY2VtZW50XG4gICAgICAgICAgICBzID0gb3B0aW9ucy5zcGVlZCAqIGR0O1xuXG4gICAgICAgIGlmIChzID49IDEpIHtcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhjb250YWluZXIpKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbEJ5KGF1dG9TY3JvbGwueCAqIHMsIGF1dG9TY3JvbGwueSAqIHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbExlZnQgKz0gYXV0b1Njcm9sbC54ICogcztcbiAgICAgICAgICAgICAgICBjb250YWluZXIuc2Nyb2xsVG9wICArPSBhdXRvU2Nyb2xsLnkgKiBzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbm93O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGF1dG9TY3JvbGwuaXNTY3JvbGxpbmcpIHtcbiAgICAgICAgICAgIHJhZi5jYW5jZWwoYXV0b1Njcm9sbC5pKTtcbiAgICAgICAgICAgIGF1dG9TY3JvbGwuaSA9IHJhZi5yZXF1ZXN0KGF1dG9TY3JvbGwuc2Nyb2xsKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXV0b1Njcm9sbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIHNjb3BlID0gcmVxdWlyZSgnLi9zY29wZScpO1xuXG5mdW5jdGlvbiBjaGVja1Jlc2l6ZUVkZ2UgKG5hbWUsIHZhbHVlLCBwYWdlLCBlbGVtZW50LCBpbnRlcmFjdGFibGVFbGVtZW50LCByZWN0LCBtYXJnaW4pIHtcbiAgICAvLyBmYWxzZSwgJycsIHVuZGVmaW5lZCwgbnVsbFxuICAgIGlmICghdmFsdWUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAvLyB0cnVlIHZhbHVlLCB1c2UgcG9pbnRlciBjb29yZHMgYW5kIGVsZW1lbnQgcmVjdFxuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBpZiBkaW1lbnNpb25zIGFyZSBuZWdhdGl2ZSwgXCJzd2l0Y2hcIiBlZGdlc1xuICAgICAgICB2YXIgd2lkdGggPSBzY29wZS5pc051bWJlcihyZWN0LndpZHRoKT8gcmVjdC53aWR0aCA6IHJlY3QucmlnaHQgLSByZWN0LmxlZnQsXG4gICAgICAgICAgICBoZWlnaHQgPSBzY29wZS5pc051bWJlcihyZWN0LmhlaWdodCk/IHJlY3QuaGVpZ2h0IDogcmVjdC5ib3R0b20gLSByZWN0LnRvcDtcblxuICAgICAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICBpZiAgICAgIChuYW1lID09PSAnbGVmdCcgKSB7IG5hbWUgPSAncmlnaHQnOyB9XG4gICAgICAgICAgICBlbHNlIGlmIChuYW1lID09PSAncmlnaHQnKSB7IG5hbWUgPSAnbGVmdCcgOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgIGlmICAgICAgKG5hbWUgPT09ICd0b3AnICAgKSB7IG5hbWUgPSAnYm90dG9tJzsgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgbmFtZSA9ICd0b3AnICAgOyB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmFtZSA9PT0gJ2xlZnQnICApIHsgcmV0dXJuIHBhZ2UueCA8ICgod2lkdGggID49IDA/IHJlY3QubGVmdDogcmVjdC5yaWdodCApICsgbWFyZ2luKTsgfVxuICAgICAgICBpZiAobmFtZSA9PT0gJ3RvcCcgICApIHsgcmV0dXJuIHBhZ2UueSA8ICgoaGVpZ2h0ID49IDA/IHJlY3QudG9wIDogcmVjdC5ib3R0b20pICsgbWFyZ2luKTsgfVxuXG4gICAgICAgIGlmIChuYW1lID09PSAncmlnaHQnICkgeyByZXR1cm4gcGFnZS54ID4gKCh3aWR0aCAgPj0gMD8gcmVjdC5yaWdodCA6IHJlY3QubGVmdCkgLSBtYXJnaW4pOyB9XG4gICAgICAgIGlmIChuYW1lID09PSAnYm90dG9tJykgeyByZXR1cm4gcGFnZS55ID4gKChoZWlnaHQgPj0gMD8gcmVjdC5ib3R0b206IHJlY3QudG9wICkgLSBtYXJnaW4pOyB9XG4gICAgfVxuXG4gICAgLy8gdGhlIHJlbWFpbmluZyBjaGVja3MgcmVxdWlyZSBhbiBlbGVtZW50XG4gICAgaWYgKCF1dGlscy5pc0VsZW1lbnQoZWxlbWVudCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICByZXR1cm4gdXRpbHMuaXNFbGVtZW50KHZhbHVlKVxuICAgICAgICAvLyB0aGUgdmFsdWUgaXMgYW4gZWxlbWVudCB0byB1c2UgYXMgYSByZXNpemUgaGFuZGxlXG4gICAgICAgID8gdmFsdWUgPT09IGVsZW1lbnRcbiAgICAgICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIGVsZW1lbnQgbWF0Y2hlcyB2YWx1ZSBhcyBzZWxlY3RvclxuICAgICAgICA6IHNjb3BlLm1hdGNoZXNVcFRvKGVsZW1lbnQsIHZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50KTtcbn1cblxuXG5mdW5jdGlvbiBkZWZhdWx0QWN0aW9uQ2hlY2tlciAocG9pbnRlciwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpIHtcbiAgICB2YXIgcmVjdCA9IHRoaXMuZ2V0UmVjdChlbGVtZW50KSxcbiAgICAgICAgc2hvdWxkUmVzaXplID0gZmFsc2UsXG4gICAgICAgIGFjdGlvbixcbiAgICAgICAgcmVzaXplQXhlcyA9IG51bGwsXG4gICAgICAgIHJlc2l6ZUVkZ2VzLFxuICAgICAgICBwYWdlID0gdXRpbHMuZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5jdXJDb29yZHMucGFnZSksXG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICBpZiAoIXJlY3QpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgIGlmIChzY29wZS5hY3Rpb25Jc0VuYWJsZWQucmVzaXplICYmIG9wdGlvbnMucmVzaXplLmVuYWJsZWQpIHtcbiAgICAgICAgdmFyIHJlc2l6ZU9wdGlvbnMgPSBvcHRpb25zLnJlc2l6ZTtcblxuICAgICAgICByZXNpemVFZGdlcyA9IHtcbiAgICAgICAgICAgIGxlZnQ6IGZhbHNlLCByaWdodDogZmFsc2UsIHRvcDogZmFsc2UsIGJvdHRvbTogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpZiB1c2luZyByZXNpemUuZWRnZXNcbiAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KHJlc2l6ZU9wdGlvbnMuZWRnZXMpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBlZGdlIGluIHJlc2l6ZUVkZ2VzKSB7XG4gICAgICAgICAgICAgICAgcmVzaXplRWRnZXNbZWRnZV0gPSBjaGVja1Jlc2l6ZUVkZ2UoZWRnZSxcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplT3B0aW9ucy5lZGdlc1tlZGdlXSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uX2V2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICByZWN0LFxuICAgICAgICAgICAgICAgICAgICByZXNpemVPcHRpb25zLm1hcmdpbiB8fCBzY29wZS5tYXJnaW4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNpemVFZGdlcy5sZWZ0ID0gcmVzaXplRWRnZXMubGVmdCAmJiAhcmVzaXplRWRnZXMucmlnaHQ7XG4gICAgICAgICAgICByZXNpemVFZGdlcy50b3AgID0gcmVzaXplRWRnZXMudG9wICAmJiAhcmVzaXplRWRnZXMuYm90dG9tO1xuXG4gICAgICAgICAgICBzaG91bGRSZXNpemUgPSByZXNpemVFZGdlcy5sZWZ0IHx8IHJlc2l6ZUVkZ2VzLnJpZ2h0IHx8IHJlc2l6ZUVkZ2VzLnRvcCB8fCByZXNpemVFZGdlcy5ib3R0b207XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgcmlnaHQgID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3knICYmIHBhZ2UueCA+IChyZWN0LnJpZ2h0ICAtIHNjb3BlLm1hcmdpbiksXG4gICAgICAgICAgICAgICAgYm90dG9tID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3gnICYmIHBhZ2UueSA+IChyZWN0LmJvdHRvbSAtIHNjb3BlLm1hcmdpbik7XG5cbiAgICAgICAgICAgIHNob3VsZFJlc2l6ZSA9IHJpZ2h0IHx8IGJvdHRvbTtcbiAgICAgICAgICAgIHJlc2l6ZUF4ZXMgPSAocmlnaHQ/ICd4JyA6ICcnKSArIChib3R0b20/ICd5JyA6ICcnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFjdGlvbiA9IHNob3VsZFJlc2l6ZVxuICAgICAgICA/ICdyZXNpemUnXG4gICAgICAgIDogc2NvcGUuYWN0aW9uSXNFbmFibGVkLmRyYWcgJiYgb3B0aW9ucy5kcmFnLmVuYWJsZWRcbiAgICAgICAgPyAnZHJhZydcbiAgICAgICAgOiBudWxsO1xuXG4gICAgaWYgKHNjb3BlLmFjdGlvbklzRW5hYmxlZC5nZXN0dXJlXG4gICAgICAgICYmIGludGVyYWN0aW9uLnBvaW50ZXJJZHMubGVuZ3RoID49MlxuICAgICAgICAmJiAhKGludGVyYWN0aW9uLmRyYWdnaW5nIHx8IGludGVyYWN0aW9uLnJlc2l6aW5nKSkge1xuICAgICAgICBhY3Rpb24gPSAnZ2VzdHVyZSc7XG4gICAgfVxuXG4gICAgaWYgKGFjdGlvbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogYWN0aW9uLFxuICAgICAgICAgICAgYXhpczogcmVzaXplQXhlcyxcbiAgICAgICAgICAgIGVkZ2VzOiByZXNpemVFZGdlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmF1bHRBY3Rpb25DaGVja2VyOyIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYmFzZToge1xuICAgICAgICBhY2NlcHQgICAgICAgIDogbnVsbCxcbiAgICAgICAgYWN0aW9uQ2hlY2tlciA6IG51bGwsXG4gICAgICAgIHN0eWxlQ3Vyc29yICAgOiB0cnVlLFxuICAgICAgICBwcmV2ZW50RGVmYXVsdDogJ2F1dG8nLFxuICAgICAgICBvcmlnaW4gICAgICAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIGRlbHRhU291cmNlICAgOiAncGFnZScsXG4gICAgICAgIGFsbG93RnJvbSAgICAgOiBudWxsLFxuICAgICAgICBpZ25vcmVGcm9tICAgIDogbnVsbCxcbiAgICAgICAgX2NvbnRleHQgICAgICA6IHJlcXVpcmUoJy4vdXRpbHMvZG9tT2JqZWN0cycpLmRvY3VtZW50LFxuICAgICAgICBkcm9wQ2hlY2tlciAgIDogbnVsbFxuICAgIH0sXG5cbiAgICBkcmFnOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBtYW51YWxTdGFydDogdHJ1ZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiBudWxsLFxuICAgICAgICByZXN0cmljdDogbnVsbCxcbiAgICAgICAgaW5lcnRpYTogbnVsbCxcbiAgICAgICAgYXV0b1Njcm9sbDogbnVsbCxcblxuICAgICAgICBheGlzOiAneHknXG4gICAgfSxcblxuICAgIGRyb3A6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgICAgb3ZlcmxhcDogJ3BvaW50ZXInXG4gICAgfSxcblxuICAgIHJlc2l6ZToge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgbWFudWFsU3RhcnQ6IGZhbHNlLFxuICAgICAgICBtYXg6IEluZmluaXR5LFxuICAgICAgICBtYXhQZXJFbGVtZW50OiAxLFxuXG4gICAgICAgIHNuYXA6IG51bGwsXG4gICAgICAgIHJlc3RyaWN0OiBudWxsLFxuICAgICAgICBpbmVydGlhOiBudWxsLFxuICAgICAgICBhdXRvU2Nyb2xsOiBudWxsLFxuXG4gICAgICAgIHNxdWFyZTogZmFsc2UsXG4gICAgICAgIGF4aXM6ICd4eScsXG5cbiAgICAgICAgLy8gdXNlIGRlZmF1bHQgbWFyZ2luXG4gICAgICAgIG1hcmdpbjogTmFOLFxuXG4gICAgICAgIC8vIG9iamVjdCB3aXRoIHByb3BzIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB3aGljaCBhcmVcbiAgICAgICAgLy8gdHJ1ZS9mYWxzZSB2YWx1ZXMgdG8gcmVzaXplIHdoZW4gdGhlIHBvaW50ZXIgaXMgb3ZlciB0aGF0IGVkZ2UsXG4gICAgICAgIC8vIENTUyBzZWxlY3RvcnMgdG8gbWF0Y2ggdGhlIGhhbmRsZXMgZm9yIGVhY2ggZGlyZWN0aW9uXG4gICAgICAgIC8vIG9yIHRoZSBFbGVtZW50cyBmb3IgZWFjaCBoYW5kbGVcbiAgICAgICAgZWRnZXM6IG51bGwsXG5cbiAgICAgICAgLy8gYSB2YWx1ZSBvZiAnbm9uZScgd2lsbCBsaW1pdCB0aGUgcmVzaXplIHJlY3QgdG8gYSBtaW5pbXVtIG9mIDB4MFxuICAgICAgICAvLyAnbmVnYXRlJyB3aWxsIGFsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAgICAgLy8gJ3JlcG9zaXRpb24nIHdpbGwga2VlcCB0aGUgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlIGJ5IHN3YXBwaW5nXG4gICAgICAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBhbmQvb3Igc3dhcHBpbmcgdGhlIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXG4gICAgICAgIGludmVydDogJ25vbmUnXG4gICAgfSxcblxuICAgIGdlc3R1cmU6IHtcbiAgICAgICAgbWFudWFsU3RhcnQ6IGZhbHNlLFxuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICByZXN0cmljdDogbnVsbFxuICAgIH0sXG5cbiAgICBwZXJBY3Rpb246IHtcbiAgICAgICAgbWFudWFsU3RhcnQ6IGZhbHNlLFxuICAgICAgICBtYXg6IEluZmluaXR5LFxuICAgICAgICBtYXhQZXJFbGVtZW50OiAxLFxuXG4gICAgICAgIHNuYXA6IHtcbiAgICAgICAgICAgIGVuYWJsZWQgICAgIDogZmFsc2UsXG4gICAgICAgICAgICBlbmRPbmx5ICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgcmFuZ2UgICAgICAgOiBJbmZpbml0eSxcbiAgICAgICAgICAgIHRhcmdldHMgICAgIDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldHMgICAgIDogbnVsbCxcblxuICAgICAgICAgICAgcmVsYXRpdmVQb2ludHM6IG51bGxcbiAgICAgICAgfSxcblxuICAgICAgICByZXN0cmljdDoge1xuICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICBlbmRPbmx5OiBmYWxzZVxuICAgICAgICB9LFxuXG4gICAgICAgIGF1dG9TY3JvbGw6IHtcbiAgICAgICAgICAgIGVuYWJsZWQgICAgIDogZmFsc2UsXG4gICAgICAgICAgICBjb250YWluZXIgICA6IG51bGwsICAgICAvLyB0aGUgaXRlbSB0aGF0IGlzIHNjcm9sbGVkIChXaW5kb3cgb3IgSFRNTEVsZW1lbnQpXG4gICAgICAgICAgICBtYXJnaW4gICAgICA6IDYwLFxuICAgICAgICAgICAgc3BlZWQgICAgICAgOiAzMDAgICAgICAgLy8gdGhlIHNjcm9sbCBzcGVlZCBpbiBwaXhlbHMgcGVyIHNlY29uZFxuICAgICAgICB9LFxuXG4gICAgICAgIGluZXJ0aWE6IHtcbiAgICAgICAgICAgIGVuYWJsZWQgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIHJlc2lzdGFuY2UgICAgICAgOiAxMCwgICAgLy8gdGhlIGxhbWJkYSBpbiBleHBvbmVudGlhbCBkZWNheVxuICAgICAgICAgICAgbWluU3BlZWQgICAgICAgICA6IDEwMCwgICAvLyB0YXJnZXQgc3BlZWQgbXVzdCBiZSBhYm92ZSB0aGlzIGZvciBpbmVydGlhIHRvIHN0YXJ0XG4gICAgICAgICAgICBlbmRTcGVlZCAgICAgICAgIDogMTAsICAgIC8vIHRoZSBzcGVlZCBhdCB3aGljaCBpbmVydGlhIGlzIHNsb3cgZW5vdWdoIHRvIHN0b3BcbiAgICAgICAgICAgIGFsbG93UmVzdW1lICAgICAgOiB0cnVlLCAgLy8gYWxsb3cgcmVzdW1pbmcgYW4gYWN0aW9uIGluIGluZXJ0aWEgcGhhc2VcbiAgICAgICAgICAgIHplcm9SZXN1bWVEZWx0YSAgOiB0cnVlLCAgLy8gaWYgYW4gYWN0aW9uIGlzIHJlc3VtZWQgYWZ0ZXIgbGF1bmNoLCBzZXQgZHgvZHkgdG8gMFxuICAgICAgICAgICAgc21vb3RoRW5kRHVyYXRpb246IDMwMCAgICAvLyBhbmltYXRlIHRvIHNuYXAvcmVzdHJpY3QgZW5kT25seSBpZiB0aGVyZSdzIG5vIGluZXJ0aWFcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaG9sZER1cmF0aW9uOiA2MDBcbn07XG4iLCIvKipcbiAqIGludGVyYWN0LmpzIHYxLjIuNFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMi0yMDE1IFRheWUgQWRleWVtaSA8ZGV2QHRheWUubWU+XG4gKiBPcGVuIHNvdXJjZSB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKiBodHRwczovL3Jhdy5naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvbWFzdGVyL0xJQ0VOU0VcbiAqL1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gcmV0dXJuIGVhcmx5IGlmIHRoZXJlJ3Mgbm8gd2luZG93IHRvIHdvcmsgd2l0aCAoZWcuIE5vZGUuanMpXG4gICAgaWYgKCFyZXF1aXJlKCcuL3V0aWxzL3dpbmRvdycpLndpbmRvdykgeyByZXR1cm47IH1cblxuICAgIHZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKSxcbiAgICAgICAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXG4gICAgICAgIGJyb3dzZXIgPSB1dGlscy5icm93c2VyO1xuXG4gICAgc2NvcGUucEV2ZW50VHlwZXMgPSBudWxsO1xuXG4gICAgc2NvcGUuZG9jdW1lbnRzICAgICAgID0gW107ICAgLy8gYWxsIGRvY3VtZW50cyBiZWluZyBsaXN0ZW5lZCB0b1xuXG4gICAgc2NvcGUuaW50ZXJhY3RhYmxlcyAgID0gW107ICAgLy8gYWxsIHNldCBpbnRlcmFjdGFibGVzXG4gICAgc2NvcGUuaW50ZXJhY3Rpb25zICAgID0gW107ICAgLy8gYWxsIGludGVyYWN0aW9uc1xuXG4gICAgc2NvcGUuZHluYW1pY0Ryb3AgICAgID0gZmFsc2U7XG5cbiAgICBzY29wZS5kZWZhdWx0T3B0aW9ucyA9IHJlcXVpcmUoJy4vZGVmYXVsdE9wdGlvbnMnKTtcblxuICAgIC8vIFRoaW5ncyByZWxhdGVkIHRvIGF1dG9TY3JvbGxcbiAgICBzY29wZS5hdXRvU2Nyb2xsID0gcmVxdWlyZSgnLi9hdXRvU2Nyb2xsJyk7XG5cbiAgICAvLyBMZXNzIFByZWNpc2lvbiB3aXRoIHRvdWNoIGlucHV0XG4gICAgc2NvcGUubWFyZ2luID0gYnJvd3Nlci5zdXBwb3J0c1RvdWNoIHx8IGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQ/IDIwOiAxMDtcblxuICAgIHNjb3BlLnBvaW50ZXJNb3ZlVG9sZXJhbmNlID0gMTtcblxuICAgIC8vIGZvciBpZ25vcmluZyBicm93c2VyJ3Mgc2ltdWxhdGVkIG1vdXNlIGV2ZW50c1xuICAgIHNjb3BlLnByZXZUb3VjaFRpbWUgPSAwO1xuXG4gICAgLy8gQWxsb3cgdGhpcyBtYW55IGludGVyYWN0aW9ucyB0byBoYXBwZW4gc2ltdWx0YW5lb3VzbHlcbiAgICBzY29wZS5tYXhJbnRlcmFjdGlvbnMgPSBJbmZpbml0eTtcblxuICAgIHNjb3BlLmFjdGlvbkN1cnNvcnMgPSBicm93c2VyLmlzSWU5T3JPbGRlciA/IHtcbiAgICAgICAgZHJhZyAgICA6ICdtb3ZlJyxcbiAgICAgICAgcmVzaXpleCA6ICdlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXkgOiAncy1yZXNpemUnLFxuICAgICAgICByZXNpemV4eTogJ3NlLXJlc2l6ZScsXG5cbiAgICAgICAgcmVzaXpldG9wICAgICAgICA6ICduLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWxlZnQgICAgICAgOiAndy1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b20gICAgIDogJ3MtcmVzaXplJyxcbiAgICAgICAgcmVzaXplcmlnaHQgICAgICA6ICdlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXRvcGxlZnQgICAgOiAnc2UtcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tcmlnaHQ6ICdzZS1yZXNpemUnLFxuICAgICAgICByZXNpemV0b3ByaWdodCAgIDogJ25lLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbWxlZnQgOiAnbmUtcmVzaXplJyxcblxuICAgICAgICBnZXN0dXJlIDogJydcbiAgICB9IDoge1xuICAgICAgICBkcmFnICAgIDogJ21vdmUnLFxuICAgICAgICByZXNpemV4IDogJ2V3LXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXkgOiAnbnMtcmVzaXplJyxcbiAgICAgICAgcmVzaXpleHk6ICdud3NlLXJlc2l6ZScsXG5cbiAgICAgICAgcmVzaXpldG9wICAgICAgICA6ICducy1yZXNpemUnLFxuICAgICAgICByZXNpemVsZWZ0ICAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbSAgICAgOiAnbnMtcmVzaXplJyxcbiAgICAgICAgcmVzaXplcmlnaHQgICAgICA6ICdldy1yZXNpemUnLFxuICAgICAgICByZXNpemV0b3BsZWZ0ICAgIDogJ253c2UtcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tcmlnaHQ6ICdud3NlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXRvcHJpZ2h0ICAgOiAnbmVzdy1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b21sZWZ0IDogJ25lc3ctcmVzaXplJyxcblxuICAgICAgICBnZXN0dXJlIDogJydcbiAgICB9O1xuXG4gICAgc2NvcGUuYWN0aW9uSXNFbmFibGVkID0ge1xuICAgICAgICBkcmFnICAgOiB0cnVlLFxuICAgICAgICByZXNpemUgOiB0cnVlLFxuICAgICAgICBnZXN0dXJlOiB0cnVlXG4gICAgfTtcblxuICAgIC8vIGJlY2F1c2UgV2Via2l0IGFuZCBPcGVyYSBzdGlsbCB1c2UgJ21vdXNld2hlZWwnIGV2ZW50IHR5cGVcbiAgICBzY29wZS53aGVlbEV2ZW50ID0gJ29ubW91c2V3aGVlbCcgaW4gc2NvcGUuZG9jdW1lbnQ/ICdtb3VzZXdoZWVsJzogJ3doZWVsJztcblxuICAgIHNjb3BlLmV2ZW50VHlwZXMgPSBbXG4gICAgICAgICdkcmFnc3RhcnQnLFxuICAgICAgICAnZHJhZ21vdmUnLFxuICAgICAgICAnZHJhZ2luZXJ0aWFzdGFydCcsXG4gICAgICAgICdkcmFnZW5kJyxcbiAgICAgICAgJ2RyYWdlbnRlcicsXG4gICAgICAgICdkcmFnbGVhdmUnLFxuICAgICAgICAnZHJvcGFjdGl2YXRlJyxcbiAgICAgICAgJ2Ryb3BkZWFjdGl2YXRlJyxcbiAgICAgICAgJ2Ryb3Btb3ZlJyxcbiAgICAgICAgJ2Ryb3AnLFxuICAgICAgICAncmVzaXplc3RhcnQnLFxuICAgICAgICAncmVzaXplbW92ZScsXG4gICAgICAgICdyZXNpemVpbmVydGlhc3RhcnQnLFxuICAgICAgICAncmVzaXplZW5kJyxcbiAgICAgICAgJ2dlc3R1cmVzdGFydCcsXG4gICAgICAgICdnZXN0dXJlbW92ZScsXG4gICAgICAgICdnZXN0dXJlaW5lcnRpYXN0YXJ0JyxcbiAgICAgICAgJ2dlc3R1cmVlbmQnLFxuXG4gICAgICAgICdkb3duJyxcbiAgICAgICAgJ21vdmUnLFxuICAgICAgICAndXAnLFxuICAgICAgICAnY2FuY2VsJyxcbiAgICAgICAgJ3RhcCcsXG4gICAgICAgICdkb3VibGV0YXAnLFxuICAgICAgICAnaG9sZCdcbiAgICBdO1xuXG4gICAgc2NvcGUuZ2xvYmFsRXZlbnRzID0ge307XG5cbiAgICAvLyBwcmVmaXggbWF0Y2hlc1NlbGVjdG9yXG4gICAgYnJvd3Nlci5wcmVmaXhlZE1hdGNoZXNTZWxlY3RvciA9ICdtYXRjaGVzJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICdtYXRjaGVzJzogJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAgICAgJ3dlYmtpdE1hdGNoZXNTZWxlY3Rvcic6ICdtb3pNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlP1xuICAgICAgICAgICAgICAgICAgICAnbW96TWF0Y2hlc1NlbGVjdG9yJzogJ29NYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlP1xuICAgICAgICAgICAgICAgICAgICAgICAgJ29NYXRjaGVzU2VsZWN0b3InOiAnbXNNYXRjaGVzU2VsZWN0b3InO1xuXG4gICAgLy8gd2lsbCBiZSBwb2x5ZmlsbCBmdW5jdGlvbiBpZiBicm93c2VyIGlzIElFOFxuICAgIHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvciA9IG51bGw7XG5cbiAgICAvLyBFdmVudHMgd3JhcHBlclxuICAgIHZhciBldmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL2V2ZW50cycpO1xuXG4gICAgc2NvcGUudHJ5U2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKCFzY29wZS5pc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgLy8gYW4gZXhjZXB0aW9uIHdpbGwgYmUgcmFpc2VkIGlmIGl0IGlzIGludmFsaWRcbiAgICAgICAgc2NvcGUuZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBzY29wZS5nZXRTY3JvbGxYWSA9IGZ1bmN0aW9uICh3aW4pIHtcbiAgICAgICAgd2luID0gd2luIHx8IHNjb3BlLndpbmRvdztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHdpbi5zY3JvbGxYIHx8IHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgIHk6IHdpbi5zY3JvbGxZIHx8IHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHNjb3BlLmdldEFjdHVhbEVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gKGVsZW1lbnQgaW5zdGFuY2VvZiBzY29wZS5TVkdFbGVtZW50SW5zdGFuY2VcbiAgICAgICAgICAgID8gZWxlbWVudC5jb3JyZXNwb25kaW5nVXNlRWxlbWVudFxuICAgICAgICAgICAgOiBlbGVtZW50KTtcbiAgICB9O1xuXG4gICAgc2NvcGUuZ2V0RWxlbWVudFJlY3QgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgc2Nyb2xsID0gYnJvd3Nlci5pc0lPUzdvckxvd2VyXG4gICAgICAgICAgICAgICAgPyB7IHg6IDAsIHk6IDAgfVxuICAgICAgICAgICAgICAgIDogc2NvcGUuZ2V0U2Nyb2xsWFkoc2NvcGUuZ2V0V2luZG93KGVsZW1lbnQpKSxcbiAgICAgICAgICAgIGNsaWVudFJlY3QgPSAoZWxlbWVudCBpbnN0YW5jZW9mIHNjb3BlLlNWR0VsZW1lbnQpP1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk6XG4gICAgICAgICAgICAgICAgZWxlbWVudC5nZXRDbGllbnRSZWN0cygpWzBdO1xuXG4gICAgICAgIHJldHVybiBjbGllbnRSZWN0ICYmIHtcbiAgICAgICAgICAgIGxlZnQgIDogY2xpZW50UmVjdC5sZWZ0ICAgKyBzY3JvbGwueCxcbiAgICAgICAgICAgIHJpZ2h0IDogY2xpZW50UmVjdC5yaWdodCAgKyBzY3JvbGwueCxcbiAgICAgICAgICAgIHRvcCAgIDogY2xpZW50UmVjdC50b3AgICAgKyBzY3JvbGwueSxcbiAgICAgICAgICAgIGJvdHRvbTogY2xpZW50UmVjdC5ib3R0b20gKyBzY3JvbGwueSxcbiAgICAgICAgICAgIHdpZHRoIDogY2xpZW50UmVjdC53aWR0aCB8fCBjbGllbnRSZWN0LnJpZ2h0IC0gY2xpZW50UmVjdC5sZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0OiBjbGllbnRSZWN0LmhlaWdoIHx8IGNsaWVudFJlY3QuYm90dG9tIC0gY2xpZW50UmVjdC50b3BcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgc2NvcGUuZ2V0T3JpZ2luWFkgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBvcmlnaW4gPSBpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICA/IGludGVyYWN0YWJsZS5vcHRpb25zLm9yaWdpblxuICAgICAgICAgICAgICAgIDogc2NvcGUuZGVmYXVsdE9wdGlvbnMub3JpZ2luO1xuXG4gICAgICAgIGlmIChvcmlnaW4gPT09ICdwYXJlbnQnKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9yaWdpbiA9PT0gJ3NlbGYnKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY29wZS50cnlTZWxlY3RvcihvcmlnaW4pKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5jbG9zZXN0KGVsZW1lbnQsIG9yaWdpbikgfHwgeyB4OiAwLCB5OiAwIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihvcmlnaW4pKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBvcmlnaW4oaW50ZXJhY3RhYmxlICYmIGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChvcmlnaW4pKSAge1xuICAgICAgICAgICAgb3JpZ2luID0gc2NvcGUuZ2V0RWxlbWVudFJlY3Qob3JpZ2luKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9yaWdpbi54ID0gKCd4JyBpbiBvcmlnaW4pPyBvcmlnaW4ueCA6IG9yaWdpbi5sZWZ0O1xuICAgICAgICBvcmlnaW4ueSA9ICgneScgaW4gb3JpZ2luKT8gb3JpZ2luLnkgOiBvcmlnaW4udG9wO1xuXG4gICAgICAgIHJldHVybiBvcmlnaW47XG4gICAgfTtcblxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU2MzQ1MjgvMjI4MDg4OFxuICAgIHNjb3BlLl9nZXRRQmV6aWVyVmFsdWUgPSBmdW5jdGlvbiAodCwgcDEsIHAyLCBwMykge1xuICAgICAgICB2YXIgaVQgPSAxIC0gdDtcbiAgICAgICAgcmV0dXJuIGlUICogaVQgKiBwMSArIDIgKiBpVCAqIHQgKiBwMiArIHQgKiB0ICogcDM7XG4gICAgfTtcblxuICAgIHNjb3BlLmdldFF1YWRyYXRpY0N1cnZlUG9pbnQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGNwWCwgY3BZLCBlbmRYLCBlbmRZLCBwb3NpdGlvbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogIHNjb3BlLl9nZXRRQmV6aWVyVmFsdWUocG9zaXRpb24sIHN0YXJ0WCwgY3BYLCBlbmRYKSxcbiAgICAgICAgICAgIHk6ICBzY29wZS5fZ2V0UUJlemllclZhbHVlKHBvc2l0aW9uLCBzdGFydFksIGNwWSwgZW5kWSlcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gaHR0cDovL2dpem1hLmNvbS9lYXNpbmcvXG4gICAgc2NvcGUuZWFzZU91dFF1YWQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xuICAgICAgICB0IC89IGQ7XG4gICAgICAgIHJldHVybiAtYyAqIHQqKHQtMikgKyBiO1xuICAgIH07XG5cbiAgICBzY29wZS5ub2RlQ29udGFpbnMgPSBmdW5jdGlvbiAocGFyZW50LCBjaGlsZCkge1xuICAgICAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgc2NvcGUuY2xvc2VzdCA9IGZ1bmN0aW9uIChjaGlsZCwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoY2hpbGQpO1xuXG4gICAgICAgIHdoaWxlICh1dGlscy5pc0VsZW1lbnQocGFyZW50KSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlLm1hdGNoZXNTZWxlY3RvcihwYXJlbnQsIHNlbGVjdG9yKSkgeyByZXR1cm4gcGFyZW50OyB9XG5cbiAgICAgICAgICAgIHBhcmVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQocGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5cbiAgICBzY29wZS5wYXJlbnRFbGVtZW50ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAoc2NvcGUuaXNEb2NGcmFnKHBhcmVudCkpIHtcbiAgICAgICAgICAgIC8vIHNraXAgcGFzdCAjc2hhZG8tcm9vdCBmcmFnbWVudHNcbiAgICAgICAgICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50Lmhvc3QpICYmIHNjb3BlLmlzRG9jRnJhZyhwYXJlbnQpKSB7fVxuXG4gICAgICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmVudDtcbiAgICB9O1xuXG4gICAgc2NvcGUuaW5Db250ZXh0ID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3RhYmxlLl9jb250ZXh0ID09PSBlbGVtZW50Lm93bmVyRG9jdW1lbnRcbiAgICAgICAgICAgICAgICB8fCBzY29wZS5ub2RlQ29udGFpbnMoaW50ZXJhY3RhYmxlLl9jb250ZXh0LCBlbGVtZW50KTtcbiAgICB9O1xuXG4gICAgc2NvcGUudGVzdElnbm9yZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZUVsZW1lbnQsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGlnbm9yZUZyb20gPSBpbnRlcmFjdGFibGUub3B0aW9ucy5pZ25vcmVGcm9tO1xuXG4gICAgICAgIGlmICghaWdub3JlRnJvbSB8fCAhdXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhpZ25vcmVGcm9tKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLm1hdGNoZXNVcFRvKGVsZW1lbnQsIGlnbm9yZUZyb20sIGludGVyYWN0YWJsZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHV0aWxzLmlzRWxlbWVudChpZ25vcmVGcm9tKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLm5vZGVDb250YWlucyhpZ25vcmVGcm9tLCBlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgc2NvcGUudGVzdEFsbG93ID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlRWxlbWVudCwgZWxlbWVudCkge1xuICAgICAgICB2YXIgYWxsb3dGcm9tID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuYWxsb3dGcm9tO1xuXG4gICAgICAgIGlmICghYWxsb3dGcm9tKSB7IHJldHVybiB0cnVlOyB9XG5cbiAgICAgICAgaWYgKCF1dGlscy5pc0VsZW1lbnQoZWxlbWVudCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKGFsbG93RnJvbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5tYXRjaGVzVXBUbyhlbGVtZW50LCBhbGxvd0Zyb20sIGludGVyYWN0YWJsZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHV0aWxzLmlzRWxlbWVudChhbGxvd0Zyb20pKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NvcGUubm9kZUNvbnRhaW5zKGFsbG93RnJvbSwgZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHNjb3BlLmNoZWNrQXhpcyA9IGZ1bmN0aW9uIChheGlzLCBpbnRlcmFjdGFibGUpIHtcbiAgICAgICAgaWYgKCFpbnRlcmFjdGFibGUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgdmFyIHRoaXNBeGlzID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJhZy5heGlzO1xuXG4gICAgICAgIHJldHVybiAoYXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gYXhpcyk7XG4gICAgfTtcblxuICAgIHNjb3BlLmNoZWNrU25hcCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGFjdGlvbikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zO1xuXG4gICAgICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSAncmVzaXplJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRpb25zW2FjdGlvbl0uc25hcCAmJiBvcHRpb25zW2FjdGlvbl0uc25hcC5lbmFibGVkO1xuICAgIH07XG5cbiAgICBzY29wZS5jaGVja1Jlc3RyaWN0ID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgYWN0aW9uKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnM7XG5cbiAgICAgICAgaWYgKC9ecmVzaXplLy50ZXN0KGFjdGlvbikpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9ICdyZXNpemUnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICBvcHRpb25zW2FjdGlvbl0ucmVzdHJpY3QgJiYgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0LmVuYWJsZWQ7XG4gICAgfTtcblxuICAgIHNjb3BlLmNoZWNrQXV0b1Njcm9sbCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGFjdGlvbikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zO1xuXG4gICAgICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSAncmVzaXplJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAgb3B0aW9uc1thY3Rpb25dLmF1dG9TY3JvbGwgJiYgb3B0aW9uc1thY3Rpb25dLmF1dG9TY3JvbGwuZW5hYmxlZDtcbiAgICB9O1xuXG4gICAgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGFjdGlvbikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zLFxuICAgICAgICAgICAgbWF4QWN0aW9ucyA9IG9wdGlvbnNbYWN0aW9uLm5hbWVdLm1heCxcbiAgICAgICAgICAgIG1heFBlckVsZW1lbnQgPSBvcHRpb25zW2FjdGlvbi5uYW1lXS5tYXhQZXJFbGVtZW50LFxuICAgICAgICAgICAgYWN0aXZlSW50ZXJhY3Rpb25zID0gMCxcbiAgICAgICAgICAgIHRhcmdldENvdW50ID0gMCxcbiAgICAgICAgICAgIHRhcmdldEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldLFxuICAgICAgICAgICAgICAgIG90aGVyQWN0aW9uID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSxcbiAgICAgICAgICAgICAgICBhY3RpdmUgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpO1xuXG4gICAgICAgICAgICBpZiAoIWFjdGl2ZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICBhY3RpdmVJbnRlcmFjdGlvbnMrKztcblxuICAgICAgICAgICAgaWYgKGFjdGl2ZUludGVyYWN0aW9ucyA+PSBzY29wZS5tYXhJbnRlcmFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi50YXJnZXQgIT09IGludGVyYWN0YWJsZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICB0YXJnZXRDb3VudCArPSAob3RoZXJBY3Rpb24gPT09IGFjdGlvbi5uYW1lKXwwO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0Q291bnQgPj0gbWF4QWN0aW9ucykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRFbGVtZW50Q291bnQrKztcblxuICAgICAgICAgICAgICAgIGlmIChvdGhlckFjdGlvbiAhPT0gYWN0aW9uLm5hbWUgfHwgdGFyZ2V0RWxlbWVudENvdW50ID49IG1heFBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY29wZS5tYXhJbnRlcmFjdGlvbnMgPiAwO1xuICAgIH07XG5cbiAgICAvLyBUZXN0IGZvciB0aGUgZWxlbWVudCB0aGF0J3MgXCJhYm92ZVwiIGFsbCBvdGhlciBxdWFsaWZpZXJzXG4gICAgc2NvcGUuaW5kZXhPZkRlZXBlc3RFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnRzKSB7XG4gICAgICAgIHZhciBkcm9wem9uZSxcbiAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZWxlbWVudHNbMF0sXG4gICAgICAgICAgICBpbmRleCA9IGRlZXBlc3Rab25lPyAwOiAtMSxcbiAgICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50cyA9IFtdLFxuICAgICAgICAgICAgZHJvcHpvbmVQYXJlbnRzID0gW10sXG4gICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBuO1xuXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZHJvcHpvbmUgPSBlbGVtZW50c1tpXTtcblxuICAgICAgICAgICAgLy8gYW4gZWxlbWVudCBtaWdodCBiZWxvbmcgdG8gbXVsdGlwbGUgc2VsZWN0b3IgZHJvcHpvbmVzXG4gICAgICAgICAgICBpZiAoIWRyb3B6b25lIHx8IGRyb3B6b25lID09PSBkZWVwZXN0Wm9uZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRlZXBlc3Rab25lKSB7XG4gICAgICAgICAgICAgICAgZGVlcGVzdFpvbmUgPSBkcm9wem9uZTtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBkZWVwZXN0IG9yIGN1cnJlbnQgYXJlIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCBvciBkb2N1bWVudC5yb290RWxlbWVudFxuICAgICAgICAgICAgLy8gLSBpZiB0aGUgY3VycmVudCBkcm9wem9uZSBpcywgZG8gbm90aGluZyBhbmQgY29udGludWVcbiAgICAgICAgICAgIGlmIChkcm9wem9uZS5wYXJlbnROb2RlID09PSBkcm9wem9uZS5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAtIGlmIGRlZXBlc3QgaXMsIHVwZGF0ZSB3aXRoIHRoZSBjdXJyZW50IGRyb3B6b25lIGFuZCBjb250aW51ZSB0byBuZXh0XG4gICAgICAgICAgICBlbHNlIGlmIChkZWVwZXN0Wm9uZS5wYXJlbnROb2RlID09PSBkcm9wem9uZS5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgZGVlcGVzdFpvbmUgPSBkcm9wem9uZTtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZGVlcGVzdFpvbmVQYXJlbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IGRlZXBlc3Rab25lO1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQucGFyZW50Tm9kZSAmJiBwYXJlbnQucGFyZW50Tm9kZSAhPT0gcGFyZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVlcGVzdFpvbmVQYXJlbnRzLnVuc2hpZnQocGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGlzIGVsZW1lbnQgaXMgYW4gc3ZnIGVsZW1lbnQgYW5kIHRoZSBjdXJyZW50IGRlZXBlc3QgaXNcbiAgICAgICAgICAgIC8vIGFuIEhUTUxFbGVtZW50XG4gICAgICAgICAgICBpZiAoZGVlcGVzdFpvbmUgaW5zdGFuY2VvZiBzY29wZS5IVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICYmIGRyb3B6b25lIGluc3RhbmNlb2Ygc2NvcGUuU1ZHRWxlbWVudFxuICAgICAgICAgICAgICAgICYmICEoZHJvcHpvbmUgaW5zdGFuY2VvZiBzY29wZS5TVkdTVkdFbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKGRyb3B6b25lID09PSBkZWVwZXN0Wm9uZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhcmVudCA9IGRyb3B6b25lLm93bmVyU1ZHRWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IGRyb3B6b25lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkcm9wem9uZVBhcmVudHMgPSBbXTtcblxuICAgICAgICAgICAgd2hpbGUgKHBhcmVudC5wYXJlbnROb2RlICE9PSBwYXJlbnQub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIGRyb3B6b25lUGFyZW50cy51bnNoaWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG4gPSAwO1xuXG4gICAgICAgICAgICAvLyBnZXQgKHBvc2l0aW9uIG9mIGxhc3QgY29tbW9uIGFuY2VzdG9yKSArIDFcbiAgICAgICAgICAgIHdoaWxlIChkcm9wem9uZVBhcmVudHNbbl0gJiYgZHJvcHpvbmVQYXJlbnRzW25dID09PSBkZWVwZXN0Wm9uZVBhcmVudHNbbl0pIHtcbiAgICAgICAgICAgICAgICBuKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwYXJlbnRzID0gW1xuICAgICAgICAgICAgICAgIGRyb3B6b25lUGFyZW50c1tuIC0gMV0sXG4gICAgICAgICAgICAgICAgZHJvcHpvbmVQYXJlbnRzW25dLFxuICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50c1tuXVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgY2hpbGQgPSBwYXJlbnRzWzBdLmxhc3RDaGlsZDtcblxuICAgICAgICAgICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkID09PSBwYXJlbnRzWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZHJvcHpvbmU7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgZGVlcGVzdFpvbmVQYXJlbnRzID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkID09PSBwYXJlbnRzWzJdKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH07XG5cbiAgICBzY29wZS5tYXRjaGVzU2VsZWN0b3IgPSBmdW5jdGlvbiAoZWxlbWVudCwgc2VsZWN0b3IsIG5vZGVMaXN0KSB7XG4gICAgICAgIGlmIChzY29wZS5pZThNYXRjaGVzU2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5pZThNYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIG5vZGVMaXN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSAvZGVlcC8gZnJvbSBzZWxlY3RvcnMgaWYgc2hhZG93RE9NIHBvbHlmaWxsIGlzIHVzZWRcbiAgICAgICAgaWYgKHNjb3BlLndpbmRvdyAhPT0gc2NvcGUucmVhbFdpbmRvdykge1xuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxlY3Rvci5yZXBsYWNlKC9cXC9kZWVwXFwvL2csICcgJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWxlbWVudFticm93c2VyLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yXShzZWxlY3Rvcik7XG4gICAgfTtcblxuICAgIHNjb3BlLm1hdGNoZXNVcFRvID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNlbGVjdG9yLCBsaW1pdCkge1xuICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT09IGxpbWl0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIC8vIEZvciBJRTgncyBsYWNrIG9mIGFuIEVsZW1lbnQjbWF0Y2hlc1NlbGVjdG9yXG4gICAgLy8gdGFrZW4gZnJvbSBodHRwOi8vdGFuYWxpbi5jb20vZW4vYmxvZy8yMDEyLzEyL21hdGNoZXMtc2VsZWN0b3ItaWU4LyBhbmQgbW9kaWZpZWRcbiAgICBpZiAoIShicm93c2VyLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yIGluIEVsZW1lbnQucHJvdG90eXBlKSB8fCAhc2NvcGUuaXNGdW5jdGlvbihFbGVtZW50LnByb3RvdHlwZVticm93c2VyLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yXSkpIHtcbiAgICAgICAgc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNlbGVjdG9yLCBlbGVtcykge1xuICAgICAgICAgICAgZWxlbXMgPSBlbGVtcyB8fCBlbGVtZW50LnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBlbGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChlbGVtc1tpXSA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgSW50ZXJhY3Rpb24gPSByZXF1aXJlKCcuL0ludGVyYWN0aW9uJyk7XG5cbiAgICB2YXIgSW50ZXJhY3RFdmVudCA9IHJlcXVpcmUoJy4vSW50ZXJhY3RFdmVudCcpO1xuXG4gICAgdmFyIGxpc3RlbmVyID0gcmVxdWlyZSgnLi9saXN0ZW5lcicpO1xuXG4gICAgbGlzdGVuZXIuYmluZEludGVyYWN0aW9uTGlzdGVuZXJzKCk7XG5cblxuICAgIHNjb3BlLmludGVyYWN0YWJsZXMuaW5kZXhPZkVsZW1lbnQgPSBmdW5jdGlvbiBpbmRleE9mRWxlbWVudCAoZWxlbWVudCwgY29udGV4dCkge1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCBzY29wZS5kb2N1bWVudDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGFibGUgPSB0aGlzW2ldO1xuXG4gICAgICAgICAgICBpZiAoKGludGVyYWN0YWJsZS5zZWxlY3RvciA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICAgICYmIChpbnRlcmFjdGFibGUuX2NvbnRleHQgPT09IGNvbnRleHQpKVxuICAgICAgICAgICAgICAgIHx8ICghaW50ZXJhY3RhYmxlLnNlbGVjdG9yICYmIGludGVyYWN0YWJsZS5fZWxlbWVudCA9PT0gZWxlbWVudCkpIHtcblxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG4gICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQgPSBmdW5jdGlvbiBpbnRlcmFjdGFibGVHZXQgKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbdGhpcy5pbmRleE9mRWxlbWVudChlbGVtZW50LCBvcHRpb25zICYmIG9wdGlvbnMuY29udGV4dCldO1xuICAgIH07XG5cbiAgICBzY29wZS5pbnRlcmFjdGFibGVzLmZvckVhY2hTZWxlY3RvciA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGFibGUgPSB0aGlzW2ldO1xuXG4gICAgICAgICAgICBpZiAoIWludGVyYWN0YWJsZS5zZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0ID0gY2FsbGJhY2soaW50ZXJhY3RhYmxlLCBpbnRlcmFjdGFibGUuc2VsZWN0b3IsIGludGVyYWN0YWJsZS5fY29udGV4dCwgaSwgdGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChyZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFRoZSBtZXRob2RzIG9mIHRoaXMgdmFyaWFibGUgY2FuIGJlIHVzZWQgdG8gc2V0IGVsZW1lbnRzIGFzXG4gICAgICogaW50ZXJhY3RhYmxlcyBhbmQgYWxzbyB0byBjaGFuZ2UgdmFyaW91cyBkZWZhdWx0IHNldHRpbmdzLlxuICAgICAqXG4gICAgICogQ2FsbGluZyBpdCBhcyBhIGZ1bmN0aW9uIGFuZCBwYXNzaW5nIGFuIGVsZW1lbnQgb3IgYSB2YWxpZCBDU1Mgc2VsZWN0b3JcbiAgICAgKiBzdHJpbmcgcmV0dXJucyBhbiBJbnRlcmFjdGFibGUgb2JqZWN0IHdoaWNoIGhhcyB2YXJpb3VzIG1ldGhvZHMgdG9cbiAgICAgKiBjb25maWd1cmUgaXQuXG4gICAgICpcbiAgICAgLSBlbGVtZW50IChFbGVtZW50IHwgc3RyaW5nKSBUaGUgSFRNTCBvciBTVkcgRWxlbWVudCB0byBpbnRlcmFjdCB3aXRoIG9yIENTUyBzZWxlY3RvclxuICAgICA9IChvYmplY3QpIEFuIEBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICA+IFVzYWdlXG4gICAgIHwgaW50ZXJhY3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RyYWdnYWJsZScpKS5kcmFnZ2FibGUodHJ1ZSk7XG4gICAgIHxcbiAgICAgfCB2YXIgcmVjdGFibGVzID0gaW50ZXJhY3QoJ3JlY3QnKTtcbiAgICAgfCByZWN0YWJsZXNcbiAgICAgfCAgICAgLmdlc3R1cmFibGUodHJ1ZSlcbiAgICAgfCAgICAgLm9uKCdnZXN0dXJlbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICB8ICAgICAgICAgLy8gc29tZXRoaW5nIGNvb2wuLi5cbiAgICAgfCAgICAgfSlcbiAgICAgfCAgICAgLmF1dG9TY3JvbGwodHJ1ZSk7XG4gICAgXFwqL1xuICAgIGZ1bmN0aW9uIGludGVyYWN0IChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGFibGVzLmdldChlbGVtZW50LCBvcHRpb25zKSB8fCBuZXcgSW50ZXJhY3RhYmxlKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHZhciBJbnRlcmFjdGFibGUgPSByZXF1aXJlKCcuL0ludGVyYWN0YWJsZScpO1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmlzU2V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIENoZWNrIGlmIGFuIGVsZW1lbnQgaGFzIGJlZW4gc2V0XG4gICAgIC0gZWxlbWVudCAoRWxlbWVudCkgVGhlIEVsZW1lbnQgYmVpbmcgc2VhcmNoZWQgZm9yXG4gICAgID0gKGJvb2xlYW4pIEluZGljYXRlcyBpZiB0aGUgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3Igd2FzIHByZXZpb3VzbHkgcGFzc2VkIHRvIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LmlzU2V0ID0gZnVuY3Rpb24oZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gc2NvcGUuaW50ZXJhY3RhYmxlcy5pbmRleE9mRWxlbWVudChlbGVtZW50LCBvcHRpb25zICYmIG9wdGlvbnMuY29udGV4dCkgIT09IC0xO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3Qub25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQWRkcyBhIGdsb2JhbCBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCBvciBhZGRzIGEgRE9NIGV2ZW50IHRvXG4gICAgICogYGRvY3VtZW50YFxuICAgICAqXG4gICAgIC0gdHlwZSAgICAgICAoc3RyaW5nIHwgYXJyYXkgfCBvYmplY3QpIFRoZSB0eXBlcyBvZiBldmVudHMgdG8gbGlzdGVuIGZvclxuICAgICAtIGxpc3RlbmVyICAgKGZ1bmN0aW9uKSBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHRoZSBnaXZlbiBldmVudChzKVxuICAgICAtIHVzZUNhcHR1cmUgKGJvb2xlYW4pICNvcHRpb25hbCB1c2VDYXB0dXJlIGZsYWcgZm9yIGFkZEV2ZW50TGlzdGVuZXJcbiAgICAgPSAob2JqZWN0KSBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5vbiA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNTdHJpbmcodHlwZSkgJiYgdHlwZS5zZWFyY2goJyAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRyaW0oKS5zcGxpdCgvICsvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0FycmF5KHR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdC5vbih0eXBlW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdCh0eXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiB0eXBlKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Qub24ocHJvcCwgdHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBpdCBpcyBhbiBJbnRlcmFjdEV2ZW50IHR5cGUsIGFkZCBsaXN0ZW5lciB0byBnbG9iYWxFdmVudHNcbiAgICAgICAgaWYgKHNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIHR5cGUpKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIHR5cGUgb2YgZXZlbnQgd2FzIG5ldmVyIGJvdW5kXG4gICAgICAgICAgICBpZiAoIXNjb3BlLmdsb2JhbEV2ZW50c1t0eXBlXSkge1xuICAgICAgICAgICAgICAgIHNjb3BlLmdsb2JhbEV2ZW50c1t0eXBlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY29wZS5nbG9iYWxFdmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgbm9uIEludGVyYWN0RXZlbnQgdHlwZSwgYWRkRXZlbnRMaXN0ZW5lciB0byBkb2N1bWVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoc2NvcGUuZG9jdW1lbnQsIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0Lm9mZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZW1vdmVzIGEgZ2xvYmFsIEludGVyYWN0RXZlbnQgbGlzdGVuZXIgb3IgRE9NIGV2ZW50IGZyb20gYGRvY3VtZW50YFxuICAgICAqXG4gICAgIC0gdHlwZSAgICAgICAoc3RyaW5nIHwgYXJyYXkgfCBvYmplY3QpIFRoZSB0eXBlcyBvZiBldmVudHMgdGhhdCB3ZXJlIGxpc3RlbmVkIGZvclxuICAgICAtIGxpc3RlbmVyICAgKGZ1bmN0aW9uKSBUaGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gYmUgcmVtb3ZlZFxuICAgICAtIHVzZUNhcHR1cmUgKGJvb2xlYW4pICNvcHRpb25hbCB1c2VDYXB0dXJlIGZsYWcgZm9yIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgPSAob2JqZWN0KSBpbnRlcmFjdFxuICAgICBcXCovXG4gICAgaW50ZXJhY3Qub2ZmID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyh0eXBlKSAmJiB0eXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgdHlwZSA9IHR5cGUudHJpbSgpLnNwbGl0KC8gKy8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGludGVyYWN0Lm9mZih0eXBlW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc09iamVjdCh0eXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiB0eXBlKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Qub2ZmKHByb3AsIHR5cGVbcHJvcF0sIGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzY29wZS5jb250YWlucyhzY29wZS5ldmVudFR5cGVzLCB0eXBlKSkge1xuICAgICAgICAgICAgZXZlbnRzLnJlbW92ZShzY29wZS5kb2N1bWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGluZGV4O1xuXG4gICAgICAgICAgICBpZiAodHlwZSBpbiBzY29wZS5nbG9iYWxFdmVudHNcbiAgICAgICAgICAgICAgICAmJiAoaW5kZXggPSBzY29wZS5pbmRleE9mKHNjb3BlLmdsb2JhbEV2ZW50c1t0eXBlXSwgbGlzdGVuZXIpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBzY29wZS5nbG9iYWxFdmVudHNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmVuYWJsZURyYWdnaW5nXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIERlcHJlY2F0ZWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBkcmFnZ2luZyBpcyBlbmFibGVkIGZvciBhbnkgSW50ZXJhY3RhYmxlc1xuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbCBgdHJ1ZWAgdG8gYWxsb3cgdGhlIGFjdGlvbjsgYGZhbHNlYCB0byBkaXNhYmxlIGFjdGlvbiBmb3IgYWxsIEludGVyYWN0YWJsZXNcbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5lbmFibGVEcmFnZ2luZyA9IHV0aWxzLndhcm5PbmNlKGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAobmV3VmFsdWUgIT09IG51bGwgJiYgbmV3VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2NvcGUuYWN0aW9uSXNFbmFibGVkLmRyYWcgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZHJhZztcbiAgICB9LCAnaW50ZXJhY3QuZW5hYmxlRHJhZ2dpbmcgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBzb29uIGJlIHJlbW92ZWQuJyk7XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuZW5hYmxlUmVzaXppbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHJlc2l6aW5nIGlzIGVuYWJsZWQgZm9yIGFueSBJbnRlcmFjdGFibGVzXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIGB0cnVlYCB0byBhbGxvdyB0aGUgYWN0aW9uOyBgZmFsc2VgIHRvIGRpc2FibGUgYWN0aW9uIGZvciBhbGwgSW50ZXJhY3RhYmxlc1xuICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LmVuYWJsZVJlc2l6aW5nID0gdXRpbHMud2Fybk9uY2UoZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzY29wZS5hY3Rpb25Jc0VuYWJsZWQucmVzaXplID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uSXNFbmFibGVkLnJlc2l6ZTtcbiAgICB9LCAnaW50ZXJhY3QuZW5hYmxlUmVzaXppbmcgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBzb29uIGJlIHJlbW92ZWQuJyk7XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuZW5hYmxlR2VzdHVyaW5nXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIERlcHJlY2F0ZWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBnZXN0dXJpbmcgaXMgZW5hYmxlZCBmb3IgYW55IEludGVyYWN0YWJsZXNcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWwgYHRydWVgIHRvIGFsbG93IHRoZSBhY3Rpb247IGBmYWxzZWAgdG8gZGlzYWJsZSBhY3Rpb24gZm9yIGFsbCBJbnRlcmFjdGFibGVzXG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QuZW5hYmxlR2VzdHVyaW5nID0gdXRpbHMud2Fybk9uY2UoZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZ2VzdHVyZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5nZXN0dXJlO1xuICAgIH0sICdpbnRlcmFjdC5lbmFibGVHZXN0dXJpbmcgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBzb29uIGJlIHJlbW92ZWQuJyk7XG5cbiAgICBpbnRlcmFjdC5ldmVudFR5cGVzID0gc2NvcGUuZXZlbnRUeXBlcztcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5kZWJ1Z1xuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGRlYnVnZ2luZyBkYXRhXG4gICAgID0gKG9iamVjdCkgQW4gb2JqZWN0IHdpdGggcHJvcGVydGllcyB0aGF0IG91dGxpbmUgdGhlIGN1cnJlbnQgc3RhdGUgYW5kIGV4cG9zZSBpbnRlcm5hbCBmdW5jdGlvbnMgYW5kIHZhcmlhYmxlc1xuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5kZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zWzBdIHx8IG5ldyBJbnRlcmFjdGlvbigpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbnRlcmFjdGlvbnMgICAgICAgICAgOiBzY29wZS5pbnRlcmFjdGlvbnMsXG4gICAgICAgICAgICB0YXJnZXQgICAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi50YXJnZXQsXG4gICAgICAgICAgICBkcmFnZ2luZyAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5kcmFnZ2luZyxcbiAgICAgICAgICAgIHJlc2l6aW5nICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnJlc2l6aW5nLFxuICAgICAgICAgICAgZ2VzdHVyaW5nICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZ2VzdHVyaW5nLFxuICAgICAgICAgICAgcHJlcGFyZWQgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucHJlcGFyZWQsXG4gICAgICAgICAgICBtYXRjaGVzICAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5tYXRjaGVzLFxuICAgICAgICAgICAgbWF0Y2hFbGVtZW50cyAgICAgICAgIDogaW50ZXJhY3Rpb24ubWF0Y2hFbGVtZW50cyxcblxuICAgICAgICAgICAgcHJldkNvb3JkcyAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucHJldkNvb3JkcyxcbiAgICAgICAgICAgIHN0YXJ0Q29vcmRzICAgICAgICAgICA6IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLFxuXG4gICAgICAgICAgICBwb2ludGVySWRzICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wb2ludGVySWRzLFxuICAgICAgICAgICAgcG9pbnRlcnMgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgICAgICAgICBhZGRQb2ludGVyICAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMuYWRkUG9pbnRlcixcbiAgICAgICAgICAgIHJlbW92ZVBvaW50ZXIgICAgICAgICA6IGxpc3RlbmVyLmxpc3RlbmVycy5yZW1vdmVQb2ludGVyLFxuICAgICAgICAgICAgcmVjb3JkUG9pbnRlciAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLnJlY29yZFBvaW50ZXIsXG5cbiAgICAgICAgICAgIHNuYXAgICAgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnNuYXBTdGF0dXMsXG4gICAgICAgICAgICByZXN0cmljdCAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5yZXN0cmljdFN0YXR1cyxcbiAgICAgICAgICAgIGluZXJ0aWEgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMsXG5cbiAgICAgICAgICAgIGRvd25UaW1lICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLmRvd25UaW1lc1swXSxcbiAgICAgICAgICAgIGRvd25FdmVudCAgICAgICAgICAgICA6IGludGVyYWN0aW9uLmRvd25FdmVudCxcbiAgICAgICAgICAgIGRvd25Qb2ludGVyICAgICAgICAgICA6IGludGVyYWN0aW9uLmRvd25Qb2ludGVyLFxuICAgICAgICAgICAgcHJldkV2ZW50ICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucHJldkV2ZW50LFxuXG4gICAgICAgICAgICBJbnRlcmFjdGFibGUgICAgICAgICAgOiBJbnRlcmFjdGFibGUsXG4gICAgICAgICAgICBpbnRlcmFjdGFibGVzICAgICAgICAgOiBzY29wZS5pbnRlcmFjdGFibGVzLFxuICAgICAgICAgICAgcG9pbnRlcklzRG93biAgICAgICAgIDogaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93bixcbiAgICAgICAgICAgIGRlZmF1bHRPcHRpb25zICAgICAgICA6IHNjb3BlLmRlZmF1bHRPcHRpb25zLFxuICAgICAgICAgICAgZGVmYXVsdEFjdGlvbkNoZWNrZXIgIDogcmVxdWlyZSgnLi9kZWZhdWx0QWN0aW9uQ2hlY2tlcicpLFxuXG4gICAgICAgICAgICBhY3Rpb25DdXJzb3JzICAgICAgICAgOiBzY29wZS5hY3Rpb25DdXJzb3JzLFxuICAgICAgICAgICAgZHJhZ01vdmUgICAgICAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLmRyYWdNb3ZlLFxuICAgICAgICAgICAgcmVzaXplTW92ZSAgICAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLnJlc2l6ZU1vdmUsXG4gICAgICAgICAgICBnZXN0dXJlTW92ZSAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMuZ2VzdHVyZU1vdmUsXG4gICAgICAgICAgICBwb2ludGVyVXAgICAgICAgICAgICAgOiBsaXN0ZW5lci5saXN0ZW5lcnMucG9pbnRlclVwLFxuICAgICAgICAgICAgcG9pbnRlckRvd24gICAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJEb3duLFxuICAgICAgICAgICAgcG9pbnRlck1vdmUgICAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJNb3ZlLFxuICAgICAgICAgICAgcG9pbnRlckhvdmVyICAgICAgICAgIDogbGlzdGVuZXIubGlzdGVuZXJzLnBvaW50ZXJIb3ZlcixcblxuICAgICAgICAgICAgZXZlbnRUeXBlcyAgICAgICAgICAgIDogc2NvcGUuZXZlbnRUeXBlcyxcblxuICAgICAgICAgICAgZXZlbnRzICAgICAgICAgICAgICAgIDogZXZlbnRzLFxuICAgICAgICAgICAgZ2xvYmFsRXZlbnRzICAgICAgICAgIDogc2NvcGUuZ2xvYmFsRXZlbnRzLFxuICAgICAgICAgICAgZGVsZWdhdGVkRXZlbnRzICAgICAgIDogbGlzdGVuZXIuZGVsZWdhdGVkRXZlbnRzXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIGV4cG9zZSB0aGUgZnVuY3Rpb25zIHVzZWQgdG8gY2FsY3VsYXRlIG11bHRpLXRvdWNoIHByb3BlcnRpZXNcbiAgICBpbnRlcmFjdC5nZXRUb3VjaEF2ZXJhZ2UgID0gdXRpbHMudG91Y2hBdmVyYWdlO1xuICAgIGludGVyYWN0LmdldFRvdWNoQkJveCAgICAgPSB1dGlscy50b3VjaEJCb3g7XG4gICAgaW50ZXJhY3QuZ2V0VG91Y2hEaXN0YW5jZSA9IHV0aWxzLnRvdWNoRGlzdGFuY2U7XG4gICAgaW50ZXJhY3QuZ2V0VG91Y2hBbmdsZSAgICA9IHV0aWxzLnRvdWNoQW5nbGU7XG5cbiAgICBpbnRlcmFjdC5nZXRFbGVtZW50UmVjdCAgID0gc2NvcGUuZ2V0RWxlbWVudFJlY3Q7XG4gICAgaW50ZXJhY3QubWF0Y2hlc1NlbGVjdG9yICA9IHNjb3BlLm1hdGNoZXNTZWxlY3RvcjtcbiAgICBpbnRlcmFjdC5jbG9zZXN0ICAgICAgICAgID0gc2NvcGUuY2xvc2VzdDtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5tYXJnaW5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtYXJnaW4gZm9yIGF1dG9jaGVjayByZXNpemluZyB1c2VkIGluXG4gICAgICogQEludGVyYWN0YWJsZS5nZXRBY3Rpb24uIFRoYXQgaXMgdGhlIGRpc3RhbmNlIGZyb20gdGhlIGJvdHRvbSBhbmQgcmlnaHRcbiAgICAgKiBlZGdlcyBvZiBhbiBlbGVtZW50IGNsaWNraW5nIGluIHdoaWNoIHdpbGwgc3RhcnQgcmVzaXppbmdcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChudW1iZXIpICNvcHRpb25hbFxuICAgICA9IChudW1iZXIgfCBpbnRlcmFjdCkgVGhlIGN1cnJlbnQgbWFyZ2luIHZhbHVlIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0Lm1hcmdpbiA9IGZ1bmN0aW9uIChuZXd2YWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNOdW1iZXIobmV3dmFsdWUpKSB7XG4gICAgICAgICAgICBzY29wZS5tYXJnaW4gPSBuZXd2YWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5tYXJnaW47XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5zdXBwb3J0c1RvdWNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICA9IChib29sZWFuKSBXaGV0aGVyIG9yIG5vdCB0aGUgYnJvd3NlciBzdXBwb3J0cyB0b3VjaCBpbnB1dFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5zdXBwb3J0c1RvdWNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYnJvd3Nlci5zdXBwb3J0c1RvdWNoO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3Quc3VwcG9ydHNQb2ludGVyRXZlbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIFdoZXRoZXIgb3Igbm90IHRoZSBicm93c2VyIHN1cHBvcnRzIFBvaW50ZXJFdmVudHNcbiAgICBcXCovXG4gICAgaW50ZXJhY3Quc3VwcG9ydHNQb2ludGVyRXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3Quc3RvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBDYW5jZWxzIGFsbCBpbnRlcmFjdGlvbnMgKGVuZCBldmVudHMgYXJlIG5vdCBmaXJlZClcbiAgICAgKlxuICAgICAtIGV2ZW50IChFdmVudCkgQW4gZXZlbnQgb24gd2hpY2ggdG8gY2FsbCBwcmV2ZW50RGVmYXVsdCgpXG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3Quc3RvcCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBpID0gc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0aW9uc1tpXS5zdG9wKGV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmR5bmFtaWNEcm9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRoZSBkaW1lbnNpb25zIG9mIGRyb3B6b25lIGVsZW1lbnRzIGFyZVxuICAgICAqIGNhbGN1bGF0ZWQgb24gZXZlcnkgZHJhZ21vdmUgb3Igb25seSBvbiBkcmFnc3RhcnQgZm9yIHRoZSBkZWZhdWx0XG4gICAgICogZHJvcENoZWNrZXJcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWwgVHJ1ZSB0byBjaGVjayBvbiBlYWNoIG1vdmUuIEZhbHNlIHRvIGNoZWNrIG9ubHkgYmVmb3JlIHN0YXJ0XG4gICAgID0gKGJvb2xlYW4gfCBpbnRlcmFjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5keW5hbWljRHJvcCA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgLy9pZiAoZHJhZ2dpbmcgJiYgZHluYW1pY0Ryb3AgIT09IG5ld1ZhbHVlICYmICFuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgIC8vY2FsY1JlY3RzKGRyb3B6b25lcyk7XG4gICAgICAgICAgICAvL31cblxuICAgICAgICAgICAgc2NvcGUuZHluYW1pY0Ryb3AgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5keW5hbWljRHJvcDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LnBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIGRpc3RhbmNlIHRoZSBwb2ludGVyIG11c3QgYmUgbW92ZWQgYmVmb3JlIGFuIGFjdGlvblxuICAgICAqIHNlcXVlbmNlIG9jY3Vycy4gVGhpcyBhbHNvIGFmZmVjdHMgdG9sZXJhbmNlIGZvciB0YXAgZXZlbnRzLlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKG51bWJlcikgI29wdGlvbmFsIFRoZSBtb3ZlbWVudCBmcm9tIHRoZSBzdGFydCBwb3NpdGlvbiBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB0aGlzIHZhbHVlXG4gICAgID0gKG51bWJlciB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNOdW1iZXIobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICBzY29wZS5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY29wZS5wb2ludGVyTW92ZVRvbGVyYW5jZTtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0Lm1heEludGVyYWN0aW9uc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBjb25jdXJyZW50IGludGVyYWN0aW9ucyBhbGxvd2VkLlxuICAgICAqIEJ5IGRlZmF1bHQgb25seSAxIGludGVyYWN0aW9uIGlzIGFsbG93ZWQgYXQgYSB0aW1lIChmb3IgYmFja3dhcmRzXG4gICAgICogY29tcGF0aWJpbGl0eSkuIFRvIGFsbG93IG11bHRpcGxlIGludGVyYWN0aW9ucyBvbiB0aGUgc2FtZSBJbnRlcmFjdGFibGVzXG4gICAgICogYW5kIGVsZW1lbnRzLCB5b3UgbmVlZCB0byBlbmFibGUgaXQgaW4gdGhlIGRyYWdnYWJsZSwgcmVzaXphYmxlIGFuZFxuICAgICAqIGdlc3R1cmFibGUgYCdtYXgnYCBhbmQgYCdtYXhQZXJFbGVtZW50J2Agb3B0aW9ucy5cbiAgICAgKipcbiAgICAgLSBuZXdWYWx1ZSAobnVtYmVyKSAjb3B0aW9uYWwgQW55IG51bWJlci4gbmV3VmFsdWUgPD0gMCBtZWFucyBubyBpbnRlcmFjdGlvbnMuXG4gICAgXFwqL1xuICAgIGludGVyYWN0Lm1heEludGVyYWN0aW9ucyA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNOdW1iZXIobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICBzY29wZS5tYXhJbnRlcmFjdGlvbnMgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2NvcGUubWF4SW50ZXJhY3Rpb25zO1xuICAgIH07XG5cbiAgICBsaXN0ZW5lci5saXN0ZW5Ub0RvY3VtZW50KHNjb3BlLmRvY3VtZW50KTtcblxuICAgIHNjb3BlLmludGVyYWN0ID0gaW50ZXJhY3Q7XG4gICAgc2NvcGUuSW50ZXJhY3RhYmxlID0gSW50ZXJhY3RhYmxlO1xuICAgIHNjb3BlLkludGVyYWN0aW9uID0gSW50ZXJhY3Rpb247XG4gICAgc2NvcGUuSW50ZXJhY3RFdmVudCA9IEludGVyYWN0RXZlbnQ7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGludGVyYWN0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcbnZhciBicm93c2VyID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgSW50ZXJhY3Rpb24gPSByZXF1aXJlKCcuL0ludGVyYWN0aW9uJyk7XG5cbnZhciBsaXN0ZW5lcnMgPSB7fTtcblxuLy8ge1xuLy8gICAgICB0eXBlOiB7XG4vLyAgICAgICAgICBzZWxlY3RvcnM6IFsnc2VsZWN0b3InLCAuLi5dLFxuLy8gICAgICAgICAgY29udGV4dHMgOiBbZG9jdW1lbnQsIC4uLl0sXG4vLyAgICAgICAgICBsaXN0ZW5lcnM6IFtbbGlzdGVuZXIsIHVzZUNhcHR1cmVdLCAuLi5dXG4vLyAgICAgIH1cbi8vICB9XG52YXIgZGVsZWdhdGVkRXZlbnRzID0ge307XG5cbnZhciBpbnRlcmFjdGlvbkxpc3RlbmVycyA9IFtcbiAgICAnZHJhZ1N0YXJ0JyxcbiAgICAnZHJhZ01vdmUnLFxuICAgICdyZXNpemVTdGFydCcsXG4gICAgJ3Jlc2l6ZU1vdmUnLFxuICAgICdnZXN0dXJlU3RhcnQnLFxuICAgICdnZXN0dXJlTW92ZScsXG4gICAgJ3BvaW50ZXJPdmVyJyxcbiAgICAncG9pbnRlck91dCcsXG4gICAgJ3BvaW50ZXJIb3ZlcicsXG4gICAgJ3NlbGVjdG9yRG93bicsXG4gICAgJ3BvaW50ZXJEb3duJyxcbiAgICAncG9pbnRlck1vdmUnLFxuICAgICdwb2ludGVyVXAnLFxuICAgICdwb2ludGVyQ2FuY2VsJyxcbiAgICAncG9pbnRlckVuZCcsXG4gICAgJ2FkZFBvaW50ZXInLFxuICAgICdyZW1vdmVQb2ludGVyJyxcbiAgICAncmVjb3JkUG9pbnRlcicsXG4gICAgJ2F1dG9TY3JvbGxNb3ZlJ1xuXTtcblxuZnVuY3Rpb24gZW5kQWxsSW50ZXJhY3Rpb25zIChldmVudCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNjb3BlLmludGVyYWN0aW9uc1tpXS5wb2ludGVyRW5kKGV2ZW50LCBldmVudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsaXN0ZW5Ub0RvY3VtZW50IChkb2MpIHtcbiAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuZG9jdW1lbnRzLCBkb2MpKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHdpbiA9IGRvYy5kZWZhdWx0VmlldyB8fCBkb2MucGFyZW50V2luZG93O1xuXG4gICAgLy8gYWRkIGRlbGVnYXRlIGV2ZW50IGxpc3RlbmVyXG4gICAgZm9yICh2YXIgZXZlbnRUeXBlIGluIGRlbGVnYXRlZEV2ZW50cykge1xuICAgICAgICBldmVudHMuYWRkKGRvYywgZXZlbnRUeXBlLCBkZWxlZ2F0ZUxpc3RlbmVyKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIGV2ZW50VHlwZSwgZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAoc2NvcGUuUG9pbnRlckV2ZW50KSB7XG4gICAgICAgIGlmIChzY29wZS5Qb2ludGVyRXZlbnQgPT09IHdpbi5NU1BvaW50ZXJFdmVudCkge1xuICAgICAgICAgICAgc2NvcGUucEV2ZW50VHlwZXMgPSB7XG4gICAgICAgICAgICAgICAgdXA6ICdNU1BvaW50ZXJVcCcsIGRvd246ICdNU1BvaW50ZXJEb3duJywgb3ZlcjogJ21vdXNlb3ZlcicsXG4gICAgICAgICAgICAgICAgb3V0OiAnbW91c2VvdXQnLCBtb3ZlOiAnTVNQb2ludGVyTW92ZScsIGNhbmNlbDogJ01TUG9pbnRlckNhbmNlbCcgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjb3BlLnBFdmVudFR5cGVzID0ge1xuICAgICAgICAgICAgICAgIHVwOiAncG9pbnRlcnVwJywgZG93bjogJ3BvaW50ZXJkb3duJywgb3ZlcjogJ3BvaW50ZXJvdmVyJyxcbiAgICAgICAgICAgICAgICBvdXQ6ICdwb2ludGVyb3V0JywgbW92ZTogJ3BvaW50ZXJtb3ZlJywgY2FuY2VsOiAncG9pbnRlcmNhbmNlbCcgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5kb3duICAsIGxpc3RlbmVycy5zZWxlY3RvckRvd24gKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLm1vdmUgICwgbGlzdGVuZXJzLnBvaW50ZXJNb3ZlICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMub3ZlciAgLCBsaXN0ZW5lcnMucG9pbnRlck92ZXIgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5vdXQgICAsIGxpc3RlbmVycy5wb2ludGVyT3V0ICAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLnVwICAgICwgbGlzdGVuZXJzLnBvaW50ZXJVcCAgICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMuY2FuY2VsLCBsaXN0ZW5lcnMucG9pbnRlckNhbmNlbCk7XG5cbiAgICAgICAgLy8gYXV0b3Njcm9sbFxuICAgICAgICBldmVudHMuYWRkKGRvYywgc2NvcGUucEV2ZW50VHlwZXMubW92ZSwgbGlzdGVuZXJzLmF1dG9TY3JvbGxNb3ZlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2Vkb3duJywgbGlzdGVuZXJzLnNlbGVjdG9yRG93bik7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2Vtb3ZlJywgbGlzdGVuZXJzLnBvaW50ZXJNb3ZlICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2V1cCcgICwgbGlzdGVuZXJzLnBvaW50ZXJVcCAgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2VvdmVyJywgbGlzdGVuZXJzLnBvaW50ZXJPdmVyICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2VvdXQnICwgbGlzdGVuZXJzLnBvaW50ZXJPdXQgICk7XG5cbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaHN0YXJ0JyAsIGxpc3RlbmVycy5zZWxlY3RvckRvd24gKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaG1vdmUnICAsIGxpc3RlbmVycy5wb2ludGVyTW92ZSAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaGVuZCcgICAsIGxpc3RlbmVycy5wb2ludGVyVXAgICAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaGNhbmNlbCcsIGxpc3RlbmVycy5wb2ludGVyQ2FuY2VsKTtcblxuICAgICAgICAvLyBhdXRvc2Nyb2xsXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2Vtb3ZlJywgbGlzdGVuZXJzLmF1dG9TY3JvbGxNb3ZlKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaG1vdmUnLCBsaXN0ZW5lcnMuYXV0b1Njcm9sbE1vdmUpO1xuICAgIH1cblxuICAgIGV2ZW50cy5hZGQod2luLCAnYmx1cicsIGVuZEFsbEludGVyYWN0aW9ucyk7XG5cbiAgICB0cnkge1xuICAgICAgICBpZiAod2luLmZyYW1lRWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudERvYyA9IHdpbi5mcmFtZUVsZW1lbnQub3duZXJEb2N1bWVudCxcbiAgICAgICAgICAgICAgICBwYXJlbnRXaW5kb3cgPSBwYXJlbnREb2MuZGVmYXVsdFZpZXc7XG5cbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAnbW91c2V1cCcgICAgICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAndG91Y2hlbmQnICAgICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAndG91Y2hjYW5jZWwnICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAncG9pbnRlcnVwJyAgICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAnTVNQb2ludGVyVXAnICAsIGxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50V2luZG93LCAnYmx1cicgICAgICAgICAsIGVuZEFsbEludGVyYWN0aW9ucyApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgIH1cblxuICAgIGlmIChldmVudHMudXNlQXR0YWNoRXZlbnQpIHtcbiAgICAgICAgLy8gRm9yIElFJ3MgbGFjayBvZiBFdmVudCNwcmV2ZW50RGVmYXVsdFxuICAgICAgICBldmVudHMuYWRkKGRvYywgJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnNbMF07XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5jdXJyZW50QWN0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRm9yIElFJ3MgYmFkIGRibGNsaWNrIGV2ZW50IHNlcXVlbmNlXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnZGJsY2xpY2snLCBkb09uSW50ZXJhY3Rpb25zKCdpZThEYmxjbGljaycpKTtcbiAgICB9XG5cbiAgICBzY29wZS5kb2N1bWVudHMucHVzaChkb2MpO1xufVxuXG5mdW5jdGlvbiBkb09uSW50ZXJhY3Rpb25zIChtZXRob2QpIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgaW50ZXJhY3Rpb24sXG4gICAgICAgICAgICBldmVudFRhcmdldCA9IHNjb3BlLmdldEFjdHVhbEVsZW1lbnQoZXZlbnQucGF0aFxuICAgICAgICAgICAgICAgID8gZXZlbnQucGF0aFswXVxuICAgICAgICAgICAgICAgIDogZXZlbnQudGFyZ2V0KSxcbiAgICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0ID0gc2NvcGUuZ2V0QWN0dWFsRWxlbWVudChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgaWYgKGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJiAvdG91Y2gvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgIHNjb3BlLnByZXZUb3VjaFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1tpXTtcblxuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb25Gcm9tUG9pbnRlcihwb2ludGVyLCBldmVudC50eXBlLCBldmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWludGVyYWN0aW9uKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5fdXBkYXRlRXZlbnRUYXJnZXRzKGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvblttZXRob2RdKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ICYmIC9tb3VzZS8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBtb3VzZSBldmVudHMgd2hpbGUgdG91Y2ggaW50ZXJhY3Rpb25zIGFyZSBhY3RpdmVcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NvcGUuaW50ZXJhY3Rpb25zW2ldLm1vdXNlICYmIHNjb3BlLmludGVyYWN0aW9uc1tpXS5wb2ludGVySXNEb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gaWdub3JlIG1vdXNlIGV2ZW50cyB0aGF0IGFyZSBzaW11bGF0ZWQgYnkgdGhlIGJyb3dzZXJcbiAgICAgICAgICAgICAgICAvLyBhZnRlciBhIHRvdWNoIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc2NvcGUucHJldlRvdWNoVGltZSA8IDUwMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uRnJvbVBvaW50ZXIoZXZlbnQsIGV2ZW50LnR5cGUsIGV2ZW50VGFyZ2V0KTtcblxuICAgICAgICAgICAgaWYgKCFpbnRlcmFjdGlvbikgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uX3VwZGF0ZUV2ZW50VGFyZ2V0cyhldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICBpbnRlcmFjdGlvblttZXRob2RdKGV2ZW50LCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vLyBib3VuZCB0byB0aGUgaW50ZXJhY3RhYmxlIGNvbnRleHQgd2hlbiBhIERPTSBldmVudFxuLy8gbGlzdGVuZXIgaXMgYWRkZWQgdG8gYSBzZWxlY3RvciBpbnRlcmFjdGFibGVcbmZ1bmN0aW9uIGRlbGVnYXRlTGlzdGVuZXIgKGV2ZW50LCB1c2VDYXB0dXJlKSB7XG4gICAgdmFyIGZha2VFdmVudCA9IHt9LFxuICAgICAgICBkZWxlZ2F0ZWQgPSBkZWxlZ2F0ZWRFdmVudHNbZXZlbnQudHlwZV0sXG4gICAgICAgIGV2ZW50VGFyZ2V0ID0gc2NvcGUuZ2V0QWN0dWFsRWxlbWVudChldmVudC5wYXRoXG4gICAgICAgICAgICA/IGV2ZW50LnBhdGhbMF1cbiAgICAgICAgICAgIDogZXZlbnQudGFyZ2V0KSxcbiAgICAgICAgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgLy8gZHVwbGljYXRlIHRoZSBldmVudCBzbyB0aGF0IGN1cnJlbnRUYXJnZXQgY2FuIGJlIGNoYW5nZWRcbiAgICBmb3IgKHZhciBwcm9wIGluIGV2ZW50KSB7XG4gICAgICAgIGZha2VFdmVudFtwcm9wXSA9IGV2ZW50W3Byb3BdO1xuICAgIH1cblxuICAgIGZha2VFdmVudC5vcmlnaW5hbEV2ZW50ID0gZXZlbnQ7XG4gICAgZmFrZUV2ZW50LnByZXZlbnREZWZhdWx0ID0gcHJldmVudE9yaWdpbmFsRGVmYXVsdDtcblxuICAgIC8vIGNsaW1iIHVwIGRvY3VtZW50IHRyZWUgbG9va2luZyBmb3Igc2VsZWN0b3IgbWF0Y2hlc1xuICAgIHdoaWxlICh1dGlscy5pc0VsZW1lbnQoZWxlbWVudCkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzW2ldLFxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBkZWxlZ2F0ZWQuY29udGV4dHNbaV07XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUubm9kZUNvbnRhaW5zKGNvbnRleHQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm5vZGVDb250YWlucyhjb250ZXh0LCBlbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IGRlbGVnYXRlZC5saXN0ZW5lcnNbaV07XG5cbiAgICAgICAgICAgICAgICBmYWtlRXZlbnQuY3VycmVudFRhcmdldCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpc3RlbmVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2pdWzFdID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbal1bMF0oZmFrZUV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0SW50ZXJhY3Rpb25Gcm9tUG9pbnRlciAocG9pbnRlciwgZXZlbnRUeXBlLCBldmVudFRhcmdldCkge1xuICAgIHZhciBpID0gMCwgbGVuID0gc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aCxcbiAgICAgICAgbW91c2VFdmVudCA9ICgvbW91c2UvaS50ZXN0KHBvaW50ZXIucG9pbnRlclR5cGUgfHwgZXZlbnRUeXBlKVxuICAgICAgICAgICAgLy8gTVNQb2ludGVyRXZlbnQuTVNQT0lOVEVSX1RZUEVfTU9VU0VcbiAgICAgICAgfHwgcG9pbnRlci5wb2ludGVyVHlwZSA9PT0gNCksXG4gICAgICAgIGludGVyYWN0aW9uO1xuXG4gICAgdmFyIGlkID0gdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpO1xuXG4gICAgLy8gdHJ5IHRvIHJlc3VtZSBpbmVydGlhIHdpdGggYSBuZXcgcG9pbnRlclxuICAgIGlmICgvZG93bnxzdGFydC9pLnRlc3QoZXZlbnRUeXBlKSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5hY3RpdmUgJiYgaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnNbaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZV0uaW5lcnRpYS5hbGxvd1Jlc3VtZVxuICAgICAgICAgICAgICAgICYmIChpbnRlcmFjdGlvbi5tb3VzZSA9PT0gbW91c2VFdmVudCkpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyB0aGUgaW50ZXJhY3Rpb24gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gaW50ZXJhY3Rpb24uZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbnRlcmFjdGlvbidzIHBvaW50ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVyc1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoaW50ZXJhY3Rpb24ucG9pbnRlcnNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGlmIGl0J3MgYSBtb3VzZSBpbnRlcmFjdGlvblxuICAgIGlmIChtb3VzZUV2ZW50IHx8ICEoYnJvd3Nlci5zdXBwb3J0c1RvdWNoIHx8IGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQpKSB7XG5cbiAgICAgICAgLy8gZmluZCBhIG1vdXNlIGludGVyYWN0aW9uIHRoYXQncyBub3QgaW4gaW5lcnRpYSBwaGFzZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pbnRlcmFjdGlvbnNbaV0ubW91c2UgJiYgIXNjb3BlLmludGVyYWN0aW9uc1tpXS5pbmVydGlhU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGlvbnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmaW5kIGFueSBpbnRlcmFjdGlvbiBzcGVjaWZpY2FsbHkgZm9yIG1vdXNlLlxuICAgICAgICAvLyBpZiB0aGUgZXZlbnRUeXBlIGlzIGEgbW91c2Vkb3duLCBhbmQgaW5lcnRpYSBpcyBhY3RpdmVcbiAgICAgICAgLy8gaWdub3JlIHRoZSBpbnRlcmFjdGlvblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pbnRlcmFjdGlvbnNbaV0ubW91c2UgJiYgISgvZG93bi8udGVzdChldmVudFR5cGUpICYmIHNjb3BlLmludGVyYWN0aW9uc1tpXS5pbmVydGlhU3RhdHVzLmFjdGl2ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgaW50ZXJhY3Rpb24gZm9yIG1vdXNlXG4gICAgICAgIGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKCk7XG4gICAgICAgIGludGVyYWN0aW9uLm1vdXNlID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb247XG4gICAgfVxuXG4gICAgLy8gZ2V0IGludGVyYWN0aW9uIHRoYXQgaGFzIHRoaXMgcG9pbnRlclxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJJZHMsIGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGF0IHRoaXMgc3RhZ2UsIGEgcG9pbnRlclVwIHNob3VsZCBub3QgcmV0dXJuIGFuIGludGVyYWN0aW9uXG4gICAgaWYgKC91cHxlbmR8b3V0L2kudGVzdChldmVudFR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIGdldCBmaXJzdCBpZGxlIGludGVyYWN0aW9uXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldO1xuXG4gICAgICAgIGlmICgoIWludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgfHwgKGludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zLmdlc3R1cmUuZW5hYmxlZCkpXG4gICAgICAgICAgICAmJiAhaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgJiYgISghbW91c2VFdmVudCAmJiBpbnRlcmFjdGlvbi5tb3VzZSkpIHtcblxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJbnRlcmFjdGlvbigpO1xufVxuXG5mdW5jdGlvbiBwcmV2ZW50T3JpZ2luYWxEZWZhdWx0ICgpIHtcbiAgICB0aGlzLm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbn1cblxuZnVuY3Rpb24gZGVsZWdhdGVVc2VDYXB0dXJlIChldmVudCkge1xuICAgIHJldHVybiBkZWxlZ2F0ZUxpc3RlbmVyLmNhbGwodGhpcywgZXZlbnQsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBiaW5kSW50ZXJhY3Rpb25MaXN0ZW5lcnMoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGludGVyYWN0aW9uTGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lck5hbWUgPSBpbnRlcmFjdGlvbkxpc3RlbmVyc1tpXTtcblxuICAgICAgICBsaXN0ZW5lcnNbbGlzdGVuZXJOYW1lXSA9IGRvT25JbnRlcmFjdGlvbnMobGlzdGVuZXJOYW1lKTtcbiAgICB9XG59XG5cbnZhciBsaXN0ZW5lciA9IHtcbiAgICBsaXN0ZW5Ub0RvY3VtZW50OiBsaXN0ZW5Ub0RvY3VtZW50LFxuICAgIGJpbmRJbnRlcmFjdGlvbkxpc3RlbmVyczogYmluZEludGVyYWN0aW9uTGlzdGVuZXJzLFxuICAgIGxpc3RlbmVyczogbGlzdGVuZXJzLFxuICAgIGRlbGVnYXRlZEV2ZW50czogZGVsZWdhdGVkRXZlbnRzLFxuICAgIGRlbGVnYXRlTGlzdGVuZXI6IGRlbGVnYXRlTGlzdGVuZXIsXG4gICAgZGVsZWdhdGVVc2VDYXB0dXJlOiBkZWxlZ2F0ZVVzZUNhcHR1cmVcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbGlzdGVuZXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2NvcGUgPSB7fSxcbiAgICBleHRlbmQgPSByZXF1aXJlKCcuL3V0aWxzL2V4dGVuZCcpO1xuXG5leHRlbmQoc2NvcGUsIHJlcXVpcmUoJy4vdXRpbHMvd2luZG93JykpO1xuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL2RvbU9iamVjdHMnKSk7XG5leHRlbmQoc2NvcGUsIHJlcXVpcmUoJy4vdXRpbHMvYXJyLmpzJykpO1xuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL2lzVHlwZScpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzY29wZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaW5kZXhPZiAoYXJyYXksIHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoYXJyYXlbaV0gPT09IHRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zIChhcnJheSwgdGFyZ2V0KSB7XG4gICAgcmV0dXJuIGluZGV4T2YoYXJyYXksIHRhcmdldCkgIT09IC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbmRleE9mOiBpbmRleE9mLFxuICAgIGNvbnRhaW5zOiBjb250YWluc1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93JyksXG4gICAgZG9tT2JqZWN0cyA9IHJlcXVpcmUoJy4vZG9tT2JqZWN0cycpO1xuXG52YXIgYnJvd3NlciA9IHtcbiAgICAvLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgdG91Y2ggaW5wdXQ/XG4gICAgc3VwcG9ydHNUb3VjaCA6ICEhKCgnb250b3VjaHN0YXJ0JyBpbiB3aW4pIHx8IHdpbi53aW5kb3cuRG9jdW1lbnRUb3VjaFxuICAgICAgICAmJiBkb21PYmplY3RzLmRvY3VtZW50IGluc3RhbmNlb2Ygd2luLkRvY3VtZW50VG91Y2gpLFxuXG4gICAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IFBvaW50ZXJFdmVudHNcbiAgICBzdXBwb3J0c1BvaW50ZXJFdmVudCA6ICEhZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQsXG5cbiAgICAvLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gICAgaXNPcGVyYU1vYmlsZSA6IChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ09wZXJhJ1xuICAgICAgICAmJiBicm93c2VyLnN1cHBvcnRzVG91Y2hcbiAgICAgICAgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgnUHJlc3RvJykpLFxuXG4gICAgLy8gc2Nyb2xsaW5nIGRvZXNuJ3QgY2hhbmdlIHRoZSByZXN1bHQgb2ZcbiAgICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QvZ2V0Q2xpZW50UmVjdHMgb24gaU9TIDw9NyBidXQgaXQgZG9lcyBvbiBpT1MgOFxuICAgIGlzSU9TN29yTG93ZXIgOiAoL2lQKGhvbmV8b2R8YWQpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkgJiYgL09TIFsxLTddW15cXGRdLy50ZXN0KG5hdmlnYXRvci5hcHBWZXJzaW9uKSksXG5cbiAgICBpc0llOU9yT2xkZXIgOiBkb21PYmplY3RzLmRvY3VtZW50LmFsbCAmJiAhd2luLndpbmRvdy5hdG9iLFxuXG4gICAgLy8gcHJlZml4IG1hdGNoZXNTZWxlY3RvclxuICAgIHByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yOiAnbWF0Y2hlcycgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAnbWF0Y2hlcyc6ICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlP1xuICAgICAgICAgICAgICAgICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InOiAnbW96TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAgICAgJ21vek1hdGNoZXNTZWxlY3Rvcic6ICdvTWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAgICAgICAgICdvTWF0Y2hlc1NlbGVjdG9yJzogJ21zTWF0Y2hlc1NlbGVjdG9yJ1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJyb3dzZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb21PYmplY3RzID0ge30sXG4gICAgd2luID0gcmVxdWlyZSgnLi93aW5kb3cnKS53aW5kb3csXG4gICAgYmxhbmsgPSBmdW5jdGlvbiAoKSB7fTtcblxuZG9tT2JqZWN0cy5kb2N1bWVudCAgICAgICAgICAgPSB3aW4uZG9jdW1lbnQ7XG5kb21PYmplY3RzLkRvY3VtZW50RnJhZ21lbnQgICA9IHdpbi5Eb2N1bWVudEZyYWdtZW50ICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR0VsZW1lbnQgICAgICAgICA9IHdpbi5TVkdFbGVtZW50ICAgICAgICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR1NWR0VsZW1lbnQgICAgICA9IHdpbi5TVkdTVkdFbGVtZW50ICAgICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR0VsZW1lbnRJbnN0YW5jZSA9IHdpbi5TVkdFbGVtZW50SW5zdGFuY2UgfHwgYmxhbms7XG5kb21PYmplY3RzLkhUTUxFbGVtZW50ICAgICAgICA9IHdpbi5IVE1MRWxlbWVudCAgICAgICAgfHwgd2luLkVsZW1lbnQ7XG5cbmRvbU9iamVjdHMuUG9pbnRlckV2ZW50ID0gKHdpbi5Qb2ludGVyRXZlbnQgfHwgd2luLk1TUG9pbnRlckV2ZW50KTtcblxubW9kdWxlLmV4cG9ydHMgPSBkb21PYmplY3RzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXJyID0gcmVxdWlyZSgnLi9hcnInKSxcbiAgICBpbmRleE9mICA9IGFyci5pbmRleE9mLFxuICAgIGNvbnRhaW5zID0gYXJyLmNvbnRhaW5zLFxuICAgIGdldFdpbmRvdyA9IHJlcXVpcmUoJy4vd2luZG93JykuZ2V0V2luZG93LFxuXG4gICAgdXNlQXR0YWNoRXZlbnQgPSAoJ2F0dGFjaEV2ZW50JyBpbiB3aW5kb3cpICYmICEoJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyksXG4gICAgYWRkRXZlbnQgICAgICAgPSB1c2VBdHRhY2hFdmVudD8gICdhdHRhY2hFdmVudCc6ICdhZGRFdmVudExpc3RlbmVyJyxcbiAgICByZW1vdmVFdmVudCAgICA9IHVzZUF0dGFjaEV2ZW50PyAgJ2RldGFjaEV2ZW50JzogJ3JlbW92ZUV2ZW50TGlzdGVuZXInLFxuICAgIG9uICAgICAgICAgICAgID0gdXNlQXR0YWNoRXZlbnQ/ICdvbic6ICcnLFxuXG4gICAgZWxlbWVudHMgICAgICAgICAgPSBbXSxcbiAgICB0YXJnZXRzICAgICAgICAgICA9IFtdLFxuICAgIGF0dGFjaGVkTGlzdGVuZXJzID0gW107XG5cbmZ1bmN0aW9uIGFkZCAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICB2YXIgZWxlbWVudEluZGV4ID0gaW5kZXhPZihlbGVtZW50cywgZWxlbWVudCksXG4gICAgICAgIHRhcmdldCA9IHRhcmdldHNbZWxlbWVudEluZGV4XTtcblxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHRhcmdldCA9IHtcbiAgICAgICAgICAgIGV2ZW50czoge30sXG4gICAgICAgICAgICB0eXBlQ291bnQ6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBlbGVtZW50SW5kZXggPSBlbGVtZW50cy5wdXNoKGVsZW1lbnQpIC0gMTtcbiAgICAgICAgdGFyZ2V0cy5wdXNoKHRhcmdldCk7XG5cbiAgICAgICAgYXR0YWNoZWRMaXN0ZW5lcnMucHVzaCgodXNlQXR0YWNoRXZlbnQgPyB7XG4gICAgICAgICAgICAgICAgc3VwcGxpZWQ6IFtdLFxuICAgICAgICAgICAgICAgIHdyYXBwZWQgOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VDb3VudDogW11cbiAgICAgICAgICAgIH0gOiBudWxsKSk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXQuZXZlbnRzW3R5cGVdKSB7XG4gICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0gPSBbXTtcbiAgICAgICAgdGFyZ2V0LnR5cGVDb3VudCsrO1xuICAgIH1cblxuICAgIGlmICghY29udGFpbnModGFyZ2V0LmV2ZW50c1t0eXBlXSwgbGlzdGVuZXIpKSB7XG4gICAgICAgIHZhciByZXQ7XG5cbiAgICAgICAgaWYgKHVzZUF0dGFjaEV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gYXR0YWNoZWRMaXN0ZW5lcnNbZWxlbWVudEluZGV4XSxcbiAgICAgICAgICAgICAgICBsaXN0ZW5lckluZGV4ID0gaW5kZXhPZihsaXN0ZW5lcnMuc3VwcGxpZWQsIGxpc3RlbmVyKTtcblxuICAgICAgICAgICAgdmFyIHdyYXBwZWQgPSBsaXN0ZW5lcnMud3JhcHBlZFtsaXN0ZW5lckluZGV4XSB8fCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBldmVudC5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0IHx8IHByZXZlbnREZWY7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IGV2ZW50LnN0b3BQcm9wYWdhdGlvbiB8fCBzdG9wUHJvcDtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIHx8IHN0b3BJbW1Qcm9wO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICgvbW91c2V8Y2xpY2svLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYID0gZXZlbnQuY2xpZW50WCArIGdldFdpbmRvdyhlbGVtZW50KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZID0gZXZlbnQuY2xpZW50WSArIGdldFdpbmRvdyhlbGVtZW50KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldCA9IGVsZW1lbnRbYWRkRXZlbnRdKG9uICsgdHlwZSwgd3JhcHBlZCwgISF1c2VDYXB0dXJlKTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVySW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnN1cHBsaWVkLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy53cmFwcGVkLnB1c2god3JhcHBlZCk7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnVzZUNvdW50LnB1c2goMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IGVsZW1lbnRbYWRkRXZlbnRdKHR5cGUsIGxpc3RlbmVyLCAhIXVzZUNhcHR1cmUpO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZSAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICB2YXIgaSxcbiAgICAgICAgZWxlbWVudEluZGV4ID0gaW5kZXhPZihlbGVtZW50cywgZWxlbWVudCksXG4gICAgICAgIHRhcmdldCA9IHRhcmdldHNbZWxlbWVudEluZGV4XSxcbiAgICAgICAgbGlzdGVuZXJzLFxuICAgICAgICBsaXN0ZW5lckluZGV4LFxuICAgICAgICB3cmFwcGVkID0gbGlzdGVuZXI7XG5cbiAgICBpZiAoIXRhcmdldCB8fCAhdGFyZ2V0LmV2ZW50cykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHVzZUF0dGFjaEV2ZW50KSB7XG4gICAgICAgIGxpc3RlbmVycyA9IGF0dGFjaGVkTGlzdGVuZXJzW2VsZW1lbnRJbmRleF07XG4gICAgICAgIGxpc3RlbmVySW5kZXggPSBpbmRleE9mKGxpc3RlbmVycy5zdXBwbGllZCwgbGlzdGVuZXIpO1xuICAgICAgICB3cmFwcGVkID0gbGlzdGVuZXJzLndyYXBwZWRbbGlzdGVuZXJJbmRleF07XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICdhbGwnKSB7XG4gICAgICAgIGZvciAodHlwZSBpbiB0YXJnZXQuZXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAodGFyZ2V0LmV2ZW50cy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZShlbGVtZW50LCB0eXBlLCAnYWxsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXQuZXZlbnRzW3R5cGVdKSB7XG4gICAgICAgIHZhciBsZW4gPSB0YXJnZXQuZXZlbnRzW3R5cGVdLmxlbmd0aDtcblxuICAgICAgICBpZiAobGlzdGVuZXIgPT09ICdhbGwnKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZW1vdmUoZWxlbWVudCwgdHlwZSwgdGFyZ2V0LmV2ZW50c1t0eXBlXVtpXSwgISF1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuZXZlbnRzW3R5cGVdW2ldID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50W3JlbW92ZUV2ZW50XShvbiArIHR5cGUsIHdyYXBwZWQsICEhdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0uc3BsaWNlKGksIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VBdHRhY2hFdmVudCAmJiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy51c2VDb3VudFtsaXN0ZW5lckluZGV4XS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVycy51c2VDb3VudFtsaXN0ZW5lckluZGV4XSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zdXBwbGllZC5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLndyYXBwZWQuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy51c2VDb3VudC5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0LmV2ZW50c1t0eXBlXSAmJiB0YXJnZXQuZXZlbnRzW3R5cGVdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGFyZ2V0LmV2ZW50c1t0eXBlXSA9IG51bGw7XG4gICAgICAgICAgICB0YXJnZXQudHlwZUNvdW50LS07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRhcmdldC50eXBlQ291bnQpIHtcbiAgICAgICAgdGFyZ2V0cy5zcGxpY2UoZWxlbWVudEluZGV4LCAxKTtcbiAgICAgICAgZWxlbWVudHMuc3BsaWNlKGVsZW1lbnRJbmRleCwgMSk7XG4gICAgICAgIGF0dGFjaGVkTGlzdGVuZXJzLnNwbGljZShlbGVtZW50SW5kZXgsIDEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJldmVudERlZiAoKSB7XG4gICAgdGhpcy5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBzdG9wUHJvcCAoKSB7XG4gICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBzdG9wSW1tUHJvcCAoKSB7XG4gICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgIHRoaXMuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmUsXG4gICAgdXNlQXR0YWNoRXZlbnQ6IHVzZUF0dGFjaEV2ZW50LFxuXG4gICAgX2VsZW1lbnRzOiBlbGVtZW50cyxcbiAgICBfdGFyZ2V0czogdGFyZ2V0cyxcbiAgICBfYXR0YWNoZWRMaXN0ZW5lcnM6IGF0dGFjaGVkTGlzdGVuZXJzXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCAoZGVzdCwgc291cmNlKSB7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgZGVzdFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGh5cG90ICh4LCB5KSB7IHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSk7IH07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IG1vZHVsZS5leHBvcnRzLFxuICAgIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyksXG4gICAgd2luID0gcmVxdWlyZSgnLi93aW5kb3cnKTtcblxudXRpbHMuYmxhbmsgID0gZnVuY3Rpb24gKCkge307XG5cbnV0aWxzLndhcm5PbmNlID0gZnVuY3Rpb24gKG1ldGhvZCwgbWVzc2FnZSkge1xuICAgIHZhciB3YXJuZWQgPSBmYWxzZTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2FybmVkKSB7XG4gICAgICAgICAgICB3aW4ud2luZG93LmNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn07XG5cbnV0aWxzLmV4dGVuZCAgPSBleHRlbmQ7XG51dGlscy5oeXBvdCAgID0gcmVxdWlyZSgnLi9oeXBvdCcpO1xudXRpbHMucmFmICAgICA9IHJlcXVpcmUoJy4vcmFmJyk7XG51dGlscy5icm93c2VyID0gcmVxdWlyZSgnLi9icm93c2VyJyk7XG5cbmV4dGVuZCh1dGlscywgcmVxdWlyZSgnLi9hcnInKSk7XG5leHRlbmQodXRpbHMsIHJlcXVpcmUoJy4vaXNUeXBlJykpO1xuZXh0ZW5kKHV0aWxzLCByZXF1aXJlKCcuL3BvaW50ZXJVdGlscycpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93JyksXG4gICAgZG9tT2JqZWN0cyA9IHJlcXVpcmUoJy4vZG9tT2JqZWN0cycpO1xuXG52YXIgaXNUeXBlID0ge1xuICAgIGlzRWxlbWVudCA6IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIGlmICghbyB8fCAodHlwZW9mIG8gIT09ICdvYmplY3QnKSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICBcbiAgICAgICAgdmFyIF93aW5kb3cgPSB3aW4uZ2V0V2luZG93KG8pIHx8IHdpbi53aW5kb3c7XG4gICAgXG4gICAgICAgIHJldHVybiAoL29iamVjdHxmdW5jdGlvbi8udGVzdCh0eXBlb2YgX3dpbmRvdy5FbGVtZW50KVxuICAgICAgICAgICAgPyBvIGluc3RhbmNlb2YgX3dpbmRvdy5FbGVtZW50IC8vRE9NMlxuICAgICAgICAgICAgOiBvLm5vZGVUeXBlID09PSAxICYmIHR5cGVvZiBvLm5vZGVOYW1lID09PSBcInN0cmluZ1wiKTtcbiAgICB9LFxuXG4gICAgaXNBcnJheSAgICA6IG51bGwsXG4gICAgXG4gICAgaXNXaW5kb3cgICA6IHJlcXVpcmUoJy4vaXNXaW5kb3cnKSxcblxuICAgIGlzRG9jRnJhZyAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuICEhdGhpbmcgJiYgdGhpbmcgaW5zdGFuY2VvZiBkb21PYmplY3RzLkRvY3VtZW50RnJhZ21lbnQ7IH0sXG5cbiAgICBpc09iamVjdCAgIDogZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiAhIXRoaW5nICYmICh0eXBlb2YgdGhpbmcgPT09ICdvYmplY3QnKTsgfSxcblxuICAgIGlzRnVuY3Rpb24gOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJzsgfSxcblxuICAgIGlzTnVtYmVyICAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ251bWJlcicgIDsgfSxcblxuICAgIGlzQm9vbCAgICAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Jvb2xlYW4nIDsgfSxcblxuICAgIGlzU3RyaW5nICAgOiBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ3N0cmluZycgIDsgfVxuICAgIFxufTtcblxuaXNUeXBlLmlzQXJyYXkgPSBmdW5jdGlvbiAodGhpbmcpIHtcbiAgICByZXR1cm4gaXNUeXBlLmlzT2JqZWN0KHRoaW5nKVxuICAgICAgICAmJiAodHlwZW9mIHRoaW5nLmxlbmd0aCAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICYmIGlzVHlwZS5pc0Z1bmN0aW9uKHRoaW5nLnNwbGljZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVHlwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1dpbmRvdyAodGhpbmcpIHtcbiAgICByZXR1cm4gISEodGhpbmcgJiYgdGhpbmcuV2luZG93KSAmJiAodGhpbmcgaW5zdGFuY2VvZiB0aGluZy5XaW5kb3cpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHBvaW50ZXJVdGlscyA9IHt9LFxuICAgIC8vIHJlZHVjZSBvYmplY3QgY3JlYXRpb24gaW4gZ2V0WFkoKVxuICAgIHRtcFhZID0ge30sXG4gICAgd2luID0gcmVxdWlyZSgnLi93aW5kb3cnKSxcbiAgICBoeXBvdCA9IHJlcXVpcmUoJy4vaHlwb3QnKSxcbiAgICBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpLFxuICAgIGJyb3dzZXIgPSByZXF1aXJlKCcuL2Jyb3dzZXInKSxcbiAgICBpc1R5cGUgPSByZXF1aXJlKCcuL2lzVHlwZScpLFxuICAgIEludGVyYWN0RXZlbnQgPSByZXF1aXJlKCcuLi9JbnRlcmFjdEV2ZW50Jyk7XG5cbnBvaW50ZXJVdGlscy5jb3B5Q29vcmRzID0gZnVuY3Rpb24gKGRlc3QsIHNyYykge1xuICAgIGRlc3QucGFnZSA9IGRlc3QucGFnZSB8fCB7fTtcbiAgICBkZXN0LnBhZ2UueCA9IHNyYy5wYWdlLng7XG4gICAgZGVzdC5wYWdlLnkgPSBzcmMucGFnZS55O1xuXG4gICAgZGVzdC5jbGllbnQgPSBkZXN0LmNsaWVudCB8fCB7fTtcbiAgICBkZXN0LmNsaWVudC54ID0gc3JjLmNsaWVudC54O1xuICAgIGRlc3QuY2xpZW50LnkgPSBzcmMuY2xpZW50Lnk7XG5cbiAgICBkZXN0LnRpbWVTdGFtcCA9IHNyYy50aW1lU3RhbXA7XG59O1xuXG5wb2ludGVyVXRpbHMuc2V0RXZlbnRYWSA9IGZ1bmN0aW9uICh0YXJnZXRPYmosIHBvaW50ZXIsIGludGVyYWN0aW9uKSB7XG4gICAgaWYgKCFwb2ludGVyKSB7XG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVySWRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyVXRpbHMudG91Y2hBdmVyYWdlKGludGVyYWN0aW9uLnBvaW50ZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvaW50ZXIgPSBpbnRlcmFjdGlvbi5wb2ludGVyc1swXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBvaW50ZXJVdGlscy5nZXRQYWdlWFkocG9pbnRlciwgdG1wWFksIGludGVyYWN0aW9uKTtcbiAgICB0YXJnZXRPYmoucGFnZS54ID0gdG1wWFkueDtcbiAgICB0YXJnZXRPYmoucGFnZS55ID0gdG1wWFkueTtcblxuICAgIHBvaW50ZXJVdGlscy5nZXRDbGllbnRYWShwb2ludGVyLCB0bXBYWSwgaW50ZXJhY3Rpb24pO1xuICAgIHRhcmdldE9iai5jbGllbnQueCA9IHRtcFhZLng7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC55ID0gdG1wWFkueTtcblxuICAgIHRhcmdldE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG5cbnBvaW50ZXJVdGlscy5zZXRFdmVudERlbHRhcyA9IGZ1bmN0aW9uICh0YXJnZXRPYmosIHByZXYsIGN1cikge1xuICAgIHRhcmdldE9iai5wYWdlLnggICAgID0gY3VyLnBhZ2UueCAgICAgIC0gcHJldi5wYWdlLng7XG4gICAgdGFyZ2V0T2JqLnBhZ2UueSAgICAgPSBjdXIucGFnZS55ICAgICAgLSBwcmV2LnBhZ2UueTtcbiAgICB0YXJnZXRPYmouY2xpZW50LnggICA9IGN1ci5jbGllbnQueCAgICAtIHByZXYuY2xpZW50Lng7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC55ICAgPSBjdXIuY2xpZW50LnkgICAgLSBwcmV2LmNsaWVudC55O1xuICAgIHRhcmdldE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHByZXYudGltZVN0YW1wO1xuXG4gICAgLy8gc2V0IHBvaW50ZXIgdmVsb2NpdHlcbiAgICB2YXIgZHQgPSBNYXRoLm1heCh0YXJnZXRPYmoudGltZVN0YW1wIC8gMTAwMCwgMC4wMDEpO1xuICAgIHRhcmdldE9iai5wYWdlLnNwZWVkICAgPSBoeXBvdCh0YXJnZXRPYmoucGFnZS54LCB0YXJnZXRPYmoucGFnZS55KSAvIGR0O1xuICAgIHRhcmdldE9iai5wYWdlLnZ4ICAgICAgPSB0YXJnZXRPYmoucGFnZS54IC8gZHQ7XG4gICAgdGFyZ2V0T2JqLnBhZ2UudnkgICAgICA9IHRhcmdldE9iai5wYWdlLnkgLyBkdDtcblxuICAgIHRhcmdldE9iai5jbGllbnQuc3BlZWQgPSBoeXBvdCh0YXJnZXRPYmouY2xpZW50LngsIHRhcmdldE9iai5wYWdlLnkpIC8gZHQ7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC52eCAgICA9IHRhcmdldE9iai5jbGllbnQueCAvIGR0O1xuICAgIHRhcmdldE9iai5jbGllbnQudnkgICAgPSB0YXJnZXRPYmouY2xpZW50LnkgLyBkdDtcbn07XG5cbi8vIEdldCBzcGVjaWZpZWQgWC9ZIGNvb3JkcyBmb3IgbW91c2Ugb3IgZXZlbnQudG91Y2hlc1swXVxucG9pbnRlclV0aWxzLmdldFhZID0gZnVuY3Rpb24gKHR5cGUsIHBvaW50ZXIsIHh5KSB7XG4gICAgeHkgPSB4eSB8fCB7fTtcbiAgICB0eXBlID0gdHlwZSB8fCAncGFnZSc7XG5cbiAgICB4eS54ID0gcG9pbnRlclt0eXBlICsgJ1gnXTtcbiAgICB4eS55ID0gcG9pbnRlclt0eXBlICsgJ1knXTtcblxuICAgIHJldHVybiB4eTtcbn07XG5cbnBvaW50ZXJVdGlscy5nZXRQYWdlWFkgPSBmdW5jdGlvbiAocG9pbnRlciwgcGFnZSwgaW50ZXJhY3Rpb24pIHtcbiAgICBwYWdlID0gcGFnZSB8fCB7fTtcblxuICAgIGlmIChwb2ludGVyIGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICBpZiAoL2luZXJ0aWFzdGFydC8udGVzdChwb2ludGVyLnR5cGUpKSB7XG4gICAgICAgICAgICBpbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uIHx8IHBvaW50ZXIuaW50ZXJhY3Rpb247XG5cbiAgICAgICAgICAgIGV4dGVuZChwYWdlLCBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnVwQ29vcmRzLnBhZ2UpO1xuXG4gICAgICAgICAgICBwYWdlLnggKz0gaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5zeDtcbiAgICAgICAgICAgIHBhZ2UueSArPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnN5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFnZS54ID0gcG9pbnRlci5wYWdlWDtcbiAgICAgICAgICAgIHBhZ2UueSA9IHBvaW50ZXIucGFnZVk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gT3BlcmEgTW9iaWxlIGhhbmRsZXMgdGhlIHZpZXdwb3J0IGFuZCBzY3JvbGxpbmcgb2RkbHlcbiAgICBlbHNlIGlmIChicm93c2VyLmlzT3BlcmFNb2JpbGUpIHtcbiAgICAgICAgcG9pbnRlclV0aWxzLmdldFhZKCdzY3JlZW4nLCBwb2ludGVyLCBwYWdlKTtcblxuICAgICAgICBwYWdlLnggKz0gd2luLndpbmRvdy5zY3JvbGxYO1xuICAgICAgICBwYWdlLnkgKz0gd2luLndpbmRvdy5zY3JvbGxZO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcG9pbnRlclV0aWxzLmdldFhZKCdwYWdlJywgcG9pbnRlciwgcGFnZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZ2U7XG59O1xuXG5wb2ludGVyVXRpbHMuZ2V0Q2xpZW50WFkgPSBmdW5jdGlvbiAocG9pbnRlciwgY2xpZW50LCBpbnRlcmFjdGlvbikge1xuICAgIGNsaWVudCA9IGNsaWVudCB8fCB7fTtcblxuICAgIGlmIChwb2ludGVyIGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICBpZiAoL2luZXJ0aWFzdGFydC8udGVzdChwb2ludGVyLnR5cGUpKSB7XG4gICAgICAgICAgICBleHRlbmQoY2xpZW50LCBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnVwQ29vcmRzLmNsaWVudCk7XG5cbiAgICAgICAgICAgIGNsaWVudC54ICs9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuc3g7XG4gICAgICAgICAgICBjbGllbnQueSArPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnN5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2xpZW50LnggPSBwb2ludGVyLmNsaWVudFg7XG4gICAgICAgICAgICBjbGllbnQueSA9IHBvaW50ZXIuY2xpZW50WTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gT3BlcmEgTW9iaWxlIGhhbmRsZXMgdGhlIHZpZXdwb3J0IGFuZCBzY3JvbGxpbmcgb2RkbHlcbiAgICAgICAgcG9pbnRlclV0aWxzLmdldFhZKGJyb3dzZXIuaXNPcGVyYU1vYmlsZT8gJ3NjcmVlbic6ICdjbGllbnQnLCBwb2ludGVyLCBjbGllbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBjbGllbnQ7XG59O1xuXG5wb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkID0gZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICByZXR1cm4gaXNUeXBlLmlzTnVtYmVyKHBvaW50ZXIucG9pbnRlcklkKT8gcG9pbnRlci5wb2ludGVySWQgOiBwb2ludGVyLmlkZW50aWZpZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBvaW50ZXJVdGlscztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGxhc3RUaW1lID0gMCxcbiAgICB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXSxcbiAgICByZXFGcmFtZSxcbiAgICBjYW5jZWxGcmFtZTtcblxuZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK3gpIHtcbiAgICByZXFGcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICBjYW5jZWxGcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbn1cblxuaWYgKCFyZXFGcmFtZSkge1xuICAgIHJlcUZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgICAgICB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpLFxuICAgICAgICAgICAgaWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LFxuICAgICAgICAgIHRpbWVUb0NhbGwpO1xuICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG59XG5cbmlmICghY2FuY2VsRnJhbWUpIHtcbiAgICBjYW5jZWxGcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVxdWVzdDogcmVxRnJhbWUsXG4gICAgY2FuY2VsOiBjYW5jZWxGcmFtZVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzV2luZG93ID0gcmVxdWlyZSgnLi9pc1dpbmRvdycpO1xuXG52YXIgaXNTaGFkb3dEb20gPSBmdW5jdGlvbigpIHtcbiAgICAvLyBjcmVhdGUgYSBUZXh0Tm9kZVxuICAgIHZhciBlbCA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG5cbiAgICAvLyBjaGVjayBpZiBpdCdzIHdyYXBwZWQgYnkgYSBwb2x5ZmlsbFxuICAgIHJldHVybiBlbC5vd25lckRvY3VtZW50ICE9PSB3aW5kb3cuZG9jdW1lbnRcbiAgICAgICAgJiYgdHlwZW9mIHdpbmRvdy53cmFwID09PSAnZnVuY3Rpb24nXG4gICAgICAgICYmIHdpbmRvdy53cmFwKGVsKSA9PT0gZWw7XG59O1xuXG52YXIgd2luID0ge1xuXG4gICAgd2luZG93OiB1bmRlZmluZWQsXG5cbiAgICByZWFsV2luZG93OiB3aW5kb3csXG5cbiAgICBnZXRXaW5kb3c6IGZ1bmN0aW9uIGdldFdpbmRvdyAobm9kZSkge1xuICAgICAgICBpZiAoaXNXaW5kb3cobm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJvb3ROb2RlID0gKG5vZGUub3duZXJEb2N1bWVudCB8fCBub2RlKTtcblxuICAgICAgICByZXR1cm4gcm9vdE5vZGUuZGVmYXVsdFZpZXcgfHwgcm9vdE5vZGUucGFyZW50V2luZG93IHx8IHdpbi53aW5kb3c7XG4gICAgfVxufTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKGlzU2hhZG93RG9tKCkpIHtcbiAgICAgICAgd2luLndpbmRvdyA9IHdpbmRvdy53cmFwKHdpbmRvdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2luLndpbmRvdyA9IHdpbmRvdztcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gd2luO1xuIl19
