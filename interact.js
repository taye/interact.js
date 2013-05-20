/*
 * Copyright (c) 2012, 2013 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/biographer/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js
 * @name interact
 * @function interact
 * @param {HTMLElement | svgelement} element The previously set document element
 * @returns {Interactable | null} Returns an Interactable if the element passed
 *          was previously set. Returns null otherwise.
 * @description The properties of this variable can be used to set elements as
 *              interactables and also to change various settings. Calling it as
 *              a function with an element which was previously set returns an
 *              Interactable object which has various methods to configure it.
 */
window.interact = (function () {
   'use strict';

var document      = window.document,
    console       = window.console,
    SVGElement    = window.SVGElement    || blank,
    SVGSVGElement = window.SVGSVGElement || blank,
    HTMLElement   = window.HTMLElement   || window.Element,

    // Previous interact move event pointer position
    prevX       = 0,
    prevY       = 0,
    prevClientX = 0,
    prevClientY = 0,

    // Previous interact start event pointer position
    x0       = 0,
    y0       = 0,
    clientX0 = 0,
    clientY0 = 0,

    gesture = {
        start: { x: 0, y: 0 },

        startDistance: 0,   // distance between two touches of touchStart
        prevDistance : 0,
        distance     : 0,

        scale: 1,           // gesture.distance / gesture.startDistance

        startAngle: 0,      // angle of line joining two touches
        prevAngle : 0       // angle of the previous gesture event
    },

    interactables   = [],   // array of all set interactables
    dropzones       = [],   // array of all dropzone interactables
    target          = null, // current interactable being interacted with
    dropTarget      = null, // the dropzone a drag target might be dropped into
    prevDropTarget  = null, // the dropzone that was recently dragged away from

    // The default Interatable options which will be IOptions.prototype
    defaultOptions = {
        draggable   : false,
        dropzone    : false,
        resizeable  : false,
        squareResize: false,
        gestureable : false,

        styleCursor : true,
        snap        : snap,

        autoScroll  : {
            container: window,  // the item that is scrolled
            margin   : 60,
            interval : 20,      // pause in ms between each scroll pulse
            distance : 10,      // the distance in x and y that the page is scrolled
        },
        autoScrollEnabled: true
    },

    // Things related to autoScroll
    autoScroll = {
        margin   : 60,      // page margin in which pointer triggers autoScroll
        interval : 20,      // pause in ms between each scroll pulse
        i        : null,    // the handle returned by window.setInterval
        distance : 10,      // the distance in x and y that the page is scrolled

        x: 0,               // Direction each pulse is to scroll in
        y: 0,

        // scroll the window by the values in scroll.x/y
        scroll: function () {
            var container = target.options.autoScroll.container;

            if (container === window) {
                window.scrollBy(autoScroll.x, autoScroll.y);
            }
            else if (container) {
                container.scrollLeft += autoScroll.x;
                container.scrollTop  += autoScroll.y;
            }
        },

        edgeMove: function (event) {
            if (target && target.options.autoScrollEnabled && (dragging || resizing)) {
                var top,
                    right,
                    bottom,
                    left,
                    options = target.options.autoScroll;

                if (options.container === window) {
                    left   = event.clientX < autoScroll.margin;
                    top    = event.clientY < autoScroll.margin;
                    right  = event.clientX > window.innerWidth  - autoScroll.margin;
                    bottom = event.clientY > window.innerHeight - autoScroll.margin;
                }
                else {
                    calcRects([interact(options.container)]);
                    var rect = interact(options.container).rect;

                    left   = event.clientX < rect.left   + autoScroll.margin;
                    top    = event.clientY < rect.top    + autoScroll.margin;
                    right  = event.clientX > rect.right  - autoScroll.margin;
                    bottom = event.clientY > rect.bottom - autoScroll.margin;
                }

                autoScroll.x = autoScroll.distance * (right ? 1: left? -1: 0);
                autoScroll.y = autoScroll.distance * (bottom? 1:  top? -1: 0);

                if (!autoScroll.isScrolling) {
                    // set the autoScroll properties to those of the target
                    autoScroll.margin   = 'margin'   in options? options.margin  : autoScroll.margin;
                    autoScroll.distance = 'distance' in options? options.distance: autoScroll.distance;
                    autoScroll.interval = 'interval' in options? options.interval: autoScroll.interval;

                    autoScroll.start();
                }
            }
        },

        isScrolling: false,

        start: function () {
            autoScroll.isScrolling = true;
            window.clearInterval(autoScroll.i);
            autoScroll.i = window.setInterval(autoScroll.scroll, autoScroll.interval);
        },

        stop: function () {
            window.clearInterval(autoScroll.i);
            autoScroll.isScrolling = false;
        }
    },

    // aww snap
    snap = {
        enabled: false,

        mode: 'grid',
        range: Infinity,
        grid: {
            x: 100,
            y: 100
        },
        gridOffset: {
            x: 0,
            y: 0
        },
        anchors: [],

        locked: false,
        x : 0,
        y : 0,
        dx: 0,
        dy: 0,
        realX: 0,
        realY: 0
    },

    // Does the browser support touch input?
    supportsTouch = 'createTouch' in document,

    // Less Precision with touch input
    margin = supportsTouch? 20: 10,

    pointerIsDown   = false,
    pointerWasMoved = false,
    imPropStopped   = false,
    gesturing       = false,
    dragging        = false,
    dynamicDrop     = false,
    resizing        = false,
    resizeAxes      = 'xy',

    // What to do depending on action returned by getAction() of node
    // Dictates what styles should be used and what pointerMove event Listner
    // is to be added after pointerDown
    actions = {
        drag: {
            cursor      : 'move',
            moveListener: dragMove
        },
        resizex: {
            cursor      : 'e-resize',
            moveListener: resizeMove
        },
        resizey: {
            cursor      : 's-resize',
            moveListener: resizeMove
        },
        resizexy: {
            cursor      : 'se-resize',
            moveListener: resizeMove
        },
        gesture: {
            cursor      : '',
            moveListener: gestureMove
        }
    },

    actionIsEnabled = {
        drag   : true,
        resize : true,
        gesture: true
    },

    // Action that's ready to be fired on next move event
    prepared    = null,
    styleCursor = true,

    // because Webkit and Opera still use 'mousewheel' event type
    wheelEvent = 'onmousewheel' in document? 'mousewheel': 'wheel',

    eventTypes = [
        'resizestart',
        'resizemove',
        'resizeend',
        'dragstart',
        'dragmove',
        'dragend',
        'dragenter',
        'dragleave',
        'drop',
        'gesturestart',
        'gesturemove',
        'gestureend',

        'click'
    ],

    globalEvents = [],

    fireStates = {
        onevent   : 0,
        directBind: 1,
        globalBind: 2
    },

    // Opera Mobile must be handled differently
    isOperaMobile = navigator.appName == 'Opera' &&
        supportsTouch &&
        navigator.userAgent.match('Presto'),

    // used for adding event listeners to window and document
    windowTarget = {
        _element: window,
        events  : {}
    },
    docTarget = {
        _element: document,
        events  : {}
    },

    // Events wrapper
    events = (function () {
        var Event = window.Event,
            useAttachEvent = 'attachEvent' in window && !('addEventListener' in window),
            addEvent = !useAttachEvent?  'addEventListener': 'attachEvent',
            removeEvent = !useAttachEvent?  'removeEventListener': 'detachEvent',
            on = useAttachEvent? 'on': '',

            elements = [],
            targets  = [];

        if (!('indexOf' in Array.prototype)) {
            Array.prototype.indexOf = function(elt /*, from*/)   {
            var len = this.length >>> 0;

            var from = Number(arguments[1]) || 0;
            from = (from < 0)?
                Math.ceil(from):
                Math.floor(from);

            if (from < 0) {
                from += len;
            }

            for (; from < len; from++) {
                if (from in this && this[from] === elt) {
                    return from;
                }
            }

            return -1;
            };
        }
        if (!('stopPropagation' in Event.prototype)) {
            Event.prototype.stopPropagation = function () {
                this.cancelBubble = true;
            };
            Event.prototype.stopImmediatePropagation = function () {
                this.cancelBubble = true;
                this.immediatePropagationStopped = true;
            };
        }
        if (!('preventDefault' in Event.prototype)) {
            Event.prototype.preventDefault = function () {
                this.returnValue = false;
            };
        }
        if (!('hasOwnProperty' in Event.prototype)) {
            Event.prototype.hasOwnProperty = Object.prototype.hasOwnProperty;
        }

        function add (element, type, listener, useCapture) {
            var target = targets[elements.indexOf(element)];

            if (!target) {
                target = {
                    events: {},
                    typeCount: 0
                };

                elements.push(element);
                targets.push(target);
            }

            if (!(type in target.events)) {
                target.events[type] = [];
                target.typeCount++;
            }

            if (target.events[type].indexOf(listener) === -1) {
                var ret;

                if (useAttachEvent) {
                    ret = element[addEvent](on + type, function (event) {
                        if (!event.immediatePropagationStopped) {
                            event.target = event.srcElement;
                            event.currentTarget = element;

                            if (/mouse|click/.test(event.type)) {
                                event.pageX = event.clientX + document.documentElement.scrollLeft;
                                event.pageY = event.clientY + document.documentElement.scrollTop;
                            }

                            listener(event);
                        }
                    }, listener, useCapture || false);
                }
                else {
                    ret = element[addEvent](type, listener, useCapture || false);
                }
                target.events[type].push(listener);

                return ret;
            }
        }

        function remove (element, type, listener, useCapture) {
            var i,
            target = targets[elements.indexOf(element)];

            if (!target || !target.events) {
                return;
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
                        element[removeEvent](on + type, target.events[type][i], useCapture || false);
                    }
                    target.events[type] = null;
                    target.typeCount--;
                } else {
                    for (i = 0; i < len; i++) {
                        if (target.events[type][i] === listener) {

                            element[removeEvent](on + type, target.events[type][i], useCapture || false);
                            target.events[type].splice(i, 1);

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
                targets.splice(targets.indexOf(target), 1);
                elements.splice(elements.indexOf(element), 1);
            }
        }

        return {
            add: function (target, type, listener, useCapture) {
                add(target._element, type, listener, useCapture);
            },
            remove: function (target, type, listener, useCapture) {
                remove(target._element, type, listener, useCapture);
            },
            useAttachEvent: useAttachEvent
        };
    }());

    function setPrevXY (event) {
        prevX = event.pageX;
        prevY = event.pageY;

        prevClientX = event.clientX;
        prevClientY = event.clientY;
    }

    // Get specified X/Y coords for mouse or event.touches[0]
    function getXY (type, event) {
        var touch,
            x,
            y;

        type = type || 'page';

        if (event.touches) {
            touch = (event.touches.length)?
                event.touches[0]:
                event.changedTouches[0];
            x = touch[type + 'X'];
            y = touch[type + 'Y'];
        }
        else {
            x = event[type + 'X'];
            y = event[type + 'Y'];
        }

        return {
            x: x,
            y: y
        };
    }

    function getPageXY (event) {
        // Opera Mobile handles the viewport and scrolling oddly
        if (isOperaMobile) {
            var page = getXY('screen', event);

            page.x += window.scrollX;
            page.y += window.scrollY;

            return page;
        }
        return getXY('page', event);
    }

    function getClientXY (event) {
        // Opera Mobile handles the viewport and scrolling oddly
        return getXY(isOperaMobile? 'screen': 'client', event);
    }

    function getScrollXY () {
        return {
            x: window.scrollX || document.documentElement.scrollLeft,
            y: window.scrollY || document.documentElement.scrollTop
        };
    }

    function touchAverage (event) {
        var i,
            touches = event.touches,
            pageX = 0,
            pageY = 0,
            clientX = 0,
            clientY = 0;

        for (i = 0; i < touches.length; i++) {
            pageX += touches[i].pageX / touches.length;
            pageY += touches[i].pageY / touches.length;

            clientX += touches[i].clientX / touches.length;
            clientY += touches[i].clientY / touches.length;
        }

        return {
            pageX: pageX,
            pageY: pageY,
            clientX: clientX,
            clientY: clientY
        };
    }

    function getTouchBBox (event) {
        if (!event.touches.length) {
            return;
        }

        var i,
            touches = event.touches,
            minX = event.touches[0].pageX,
            minY = event.touches[0].pageY,
            maxX = minX,
            maxY = minY;

        for (i = 1; i < touches.length; i++) {
            minX = minX > event.touches[i].pageX?
                minX:
                event.touches[i].pageX;
            minY = minX > event.touches[i].pageX?
                minY:
                event.touches[i].pageY;
        }

        return {
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    function touchDistance (event) {
        var dx = event.touches[0].pageX,
            dy = event.touches[0].pageY;

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0].pageX;
            dy -= event.changedTouches[0].pageY;
        }
        else {
            dx -= event.touches[1].pageX;
            dy -= event.touches[1].pageY;
        }

        return Math.sqrt(dx * dx + dy * dy);
    }

    function touchAngle (event) {
        var dx = event.touches[0].pageX,
            dy = event.touches[0].pageY;

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0].pageX;
            dy -= event.changedTouches[0].pageY;
        }
        else {
            dx -= event.touches[1].pageX;
            dy -= event.touches[1].pageY;
        }

        return 180 * -Math.atan(dy / dx) / Math.PI;
    }

    function calcRects (interactables) {
        for (var i = 0, len = interactables.length; i < len; i++) {
            interactables[i].rect = interactables[i].getRect();
        }
    }

    // Test for the element that's "above" all other qualifiers
    function resolveDrops (elements) {
        if (elements.length) {

            var dropzone,
                deepestZone = elements[0],
                parent,
                deepestZoneParents = [],
                dropzoneParents = [],
                child,
                i,
                n;

            for (i = 1; i < elements.length; i++) {
                dropzone = elements[i];

                if (!deepestZoneParents.length) {
                    parent = deepestZone;
                    while (parent.parentNode !== document) {
                        deepestZoneParents.unshift(parent);
                        parent = parent.parentNode;
                    }
                }

                // if this element is an svg element and the current deepest is
                // an HTMLElement
                if (deepestZone instanceof HTMLElement &&
                        dropzone instanceof SVGElement &&
                        !(dropzone instanceof SVGSVGElement)) {

                    if (dropzone ===
                            deepestZone.parentNode) {
                        continue;
                    }
                    parent = dropzone.ownerSVGElement;
                }
                else {
                    parent = dropzone;
                }
                dropzoneParents = [];
                while (parent.parentNode !== document) {
                    dropzoneParents.unshift(parent);
                    parent = parent.parentNode;
                }

                // get (position of last common ancestor) + 1
                n = 0;
                while(dropzoneParents[n] &&
                        dropzoneParents[n] === deepestZoneParents[n]) {
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
                        deepestZoneParents = [];
                        break;
                    }
                    else if (child === parents[2]) {
                        break;
                    }
                    child = child.previousSibling;
                }
            }
            return {
                element: deepestZone,
                index: elements.indexOf(deepestZone)
            };
        }
    }

    function InteractEvent (event, action, phase) {
        var client,
            page,
            options = target.options;

        if (action === 'gesture') {
            var average = touchAverage(event);

            page   = { x: average.pageX,   y: average.pageY   };
            client = { x: average.clientX, y: average.clientY };
        }
        else {
            client = getClientXY(event);
            page = getPageXY(event);

            if (snap.enabled && snap.locked) {
                page.x += snap.dx;
                page.y += snap.dy;
                client.x += snap.dx;
                client.y += snap.dy;
            }
        }

        this.x0        = x0;
        this.y0        = y0;
        this.clientX0  = clientX0;
        this.clientY0  = clientY0;
        this.pageX     = page.x;
        this.pageY     = page.y;
        this.clientX   = client.x;
        this.clientY   = client.y;
        this.ctrlKey   = event.ctrlKey;
        this.altKey    = event.altKey;
        this.shiftKey  = event.shiftKey;
        this.metaKey   = event.metaKey;
        this.button    = event.button;
        this.target    = action === 'drop' && dropTarget._element || target._element;
        this.timeStamp = new Date().getTime();
        this.type      = action + (phase || '');

        // start/end event dx, dy is difference between start and current points
        if (phase === 'start' || phase === 'end' || action === 'drop') {
            this.dx = page.x - x0;
            this.dy = page.y - y0;
        }
        else {
            this.dx = page.x - prevX;
            this.dy = page.y - prevY;
        }

        if (action === 'resize') {
            if (options.squareResize || event.shiftKey) {
                if (resizeAxes === 'y') {
                    this.dx = this.dy;
                }
                else {
                    this.dy = this.dx;
                }
                this.axes = 'xy';
            }
            else {
                this.axes = resizeAxes;

                if (resizeAxes === 'x') {
                    this.dy = 0;
                }
                else if (resizeAxes === 'y') {
                    this.dx = 0;
                }
            }
        }
        else if (action === 'gesture') {
            this.touches  = event.touches;
            this.distance = touchDistance(event);
            this.box      = getTouchBBox(event);
            this.angle    = touchAngle(event);

            if (phase === 'start') {
                this.scale = 1;
                this.ds = 0;
                this.rotation = 0;
            }
            else {
                this.scale = this.distance / gesture.startDistance;
                if (phase === 'end') {
                    this.rotation = this.angle - gesture.startAngle;
                    this.ds = this.scale - 1;
                }
                else {
                    this.rotation = this.angle - gesture.prevAngle;
                    this.ds = this.scale - gesture.prevScale;
                }
            }
        }

        else if (action === 'drop' ||
                (action === 'drag' && (phase === 'enter' || phase === 'leave'))) {
            this.draggable = target._element;
        }
    }

    function blank () {}

    InteractEvent.prototype = {
        preventDefault: blank,
        stopImmediatePropagation: function (event) {
            imPropStopped = true;
        },
        stopPropagation: blank
    };

    // Check if action is enabled globally and the current target supports it
    // If so, return the validated action. Otherwise, return null
    function validateAction (action) {
        if (typeof action !== 'string') { return null; }

        var actionType = action.indexOf('resize') !== -1? 'resize': action,
            options = target.options;

        if (((actionType  === 'resize'   && options.resizeable) ||
                 (action      === 'drag'     && options.draggable) ||
                 (action      === 'gesture'  && options.gestureable)) &&
                actionIsEnabled[actionType]) {

            if (action === 'resize' || action === 'resizeyx') {
                action = 'resizexy';
            }

            return action;
        }
        return null;
    }

    /**
     * @private
     * @event
     * Determine action to be performed on next pointerMove and add appropriate
     * style and event Liseners
     */
    function pointerDown (event, forceAction) {
        // document and window can't be interacted with but their Interactables
        // can be used for binding events
        if (!((events.useAttachEvent? event.currentTarget: this) instanceof window.Element)) {
            return;
        }

        var action = '',
            average,
            page,
            client;

        if (event.touches) {
            average = touchAverage(event);
            page = {
                x: average.pageX,
                y: average.pageY
            };
            client = {
                x: average.clientX,
                y: average.clientY
            };
        }
        else {
            page = getPageXY(event);
            client = getClientXY(event);
        }

        // If it is the second touch of a multi-touch gesture, keep the target
        // the same if a target was set by the first touch
        // (not always the case with simulated touches)
        // Otherwise, set the target if the pointer is not down
        if ((event.touches && event.touches.length < 2 && !target) ||
                !(pointerIsDown)) {
            target = interactables.get(events.useAttachEvent? event.currentTarget: this);
        }

        if (target && !(dragging || resizing || gesturing)) {
            x0 = prevX = page.x;
            y0 = prevY = page.y;
            clientX0 = prevClientX = client.x;
            clientY0 = prevClientY = client.y;

            action = validateAction(forceAction || target.getAction(event));

            if (!action) {
                return event;
            }

            // Register that the pointer is down after succesfully validating
            // action. This way, a new target can be gotten in the next
            // downEvent propagation
            pointerIsDown = true;
            pointerWasMoved = false;

            if (defaultOptions.styleCursor) {
                document.documentElement.style.cursor =
                    actions[action].cursor + ' !important';
            }
            resizeAxes = (action === 'resizexy')?
                'xy':
                (action === 'resizex')?
                'x':
                (action === 'resizey')?
                'y':
                '';

            prepared = (action in actions)? action: null;

            event.preventDefault();
        }
    }

    function pointerMove (event) {
        if (pointerIsDown) {
            if (x0 === prevX && y0 === prevY) {
                pointerWasMoved = true;
            }
            if (prepared && target) {

                if (snap.enabled) {
                    var page = getPageXY(event),
                        inRange,
                        snapChanged;

                    snap.realX = page.x;
                    snap.realY = page.y;

                    // change to infinite range when range is negative
                    if (snap.range < 0) { snap.range = Infinity; }

                    if (snap.mode === 'anchor' && snap.anchors.length) {
                        var closest = {
                                anchor: null,
                                distance: 0,
                                range: 0,
                                distX: 0,
                                distY: 0
                            },
                            distX,
                            distY;

                        for (var i = 0, len = snap.anchors.length; i < len; i++) {
                            var anchor = snap.anchors[i],
                                distX = anchor.x - page.x,
                                distY = anchor.y - page.y,

                                range = typeof anchor.range === 'number'? anchor.range: snap.range,
                                distance = Math.sqrt(distX * distX + distY * distY);

                            inRange = distance < range;

                            // Infinite anchors count as being out of range
                            // compared to non infinite ones that are in range
                            if (range === Infinity && closest.inRange && closest.range !== Infinity) {
                                inRange = false;
                            }

                            if (!closest.anchor || (inRange?
                                // is the closest anchor in range?
                                (closest.inRange && range !== Infinity)?
                                    // the pointer is relatively deeper in this anchor
                                    distance / range < closest.distance / closest.range:
                                    //the pointer is closer to this anchor
                                    distance < closest.distance:
                                // The other is not in range and the pointer is closer to this anchor
                                (!closest.inRange && distance < closest.distance))) {

                                if (range === Infinity) {
                                    inRange = true;
                                }

                                closest = {
                                    anchor: anchor,
                                    distance: distance,
                                    range: range,
                                    inRange: inRange,
                                    distX: distX,
                                    distY: distY
                                };
                            }
                        }

                        inRange = closest.inRange;
                        snapChanged = (closest.anchor.x !== snap.x || closest.anchor.y !== snap.y);

                        snap.x = closest.anchor.x;
                        snap.y = closest.anchor.y;
                        snap.dx = closest.distX;
                        snap.dy = closest.distY;
                        snap.anchors.closest = closest.anchor;
                    }
                    else {
                        var gridx = Math.round((page.x - snap.gridOffset.x) / snap.grid.x),
                            gridy = Math.round((page.y - snap.gridOffset.y) / snap.grid.y),

                            newX = gridx * snap.grid.x + snap.gridOffset.x,
                            newY = gridy * snap.grid.y + snap.gridOffset.y,

                            distX = newX - page.x,
                            distY = newY - page.y,

                            distance = Math.sqrt(distX * distX + distY * distY);

                        inRange = distance < snap.range;
                        snapChanged = (newX !== snap.x || newY !== snap.y);

                        snap.x = newX;
                        snap.y = newY;
                        snap.dx = distX;
                        snap.dy = distY;
                    }

                    if ((snapChanged || !snap.locked) && inRange)  {
                        snap.locked = true;
                        actions[prepared].moveListener(event);
                    }
                    else if (snapChanged || !inRange) {
                        snap.locked = false;
                        actions[prepared].moveListener(event);
                    }
                }
                else {
                    actions[prepared].moveListener(event);
                }
            }
        }

        if (dragging || resizing) {
            autoScroll.edgeMove(event);
        }
    }

    function dragMove (event) {
        event.preventDefault();

        var dragEvent,
            dragEnterEvent,
            dragLeaveEvent,
            leaveDropTarget;

        if (!dragging) {
            dragEvent = new InteractEvent(event, 'drag', 'start');
            dragging = true;

            if (!dynamicDrop) {
                calcRects(dropzones);
            }
        }
        else {
            dragEvent = new InteractEvent(event, 'drag', 'move');

            if (dropzones.length) {
                var i,
                    drops = [],
                    elements = [],
                    drop;

                // collect all dropzones that qualify for a drop
                for (i = 0; i < dropzones.length; i++) {
                    if (dropzones[i].dropCheck(event)) {
                        drops.push(dropzones[i]);
                        elements.push(dropzones[i]._element);
                    }
                }

                // get the most apprpriate dropzone based on DOM depth and order
                drop = resolveDrops(elements);
                dropTarget = drop? dropzones[drop.index]: null;

                // if the current dropTarget is not the same as the previous one
                if (dropTarget !== prevDropTarget) {
                    // if there was a prevDropTarget, create a dragleave event
                    if (prevDropTarget) {
                        dragLeaveEvent = new InteractEvent(event, 'drag', 'leave');

                        dragEvent.dragLeave = prevDropTarget._element;
                        leaveDropTarget = prevDropTarget;
                        prevDropTarget = null;
                    }
                    // if the dropTarget is not null, create a dragenter event
                    if (dropTarget) {
                        dragEnterEvent = new InteractEvent(event, 'drag', 'enter');

                        dragEvent.dragEnter = dropTarget._element;
                        prevDropTarget = dropTarget;
                    }
                }
            }
        }

        target.fire(dragEvent);

        if (dragLeaveEvent) {
            leaveDropTarget.fire(dragLeaveEvent);
        }
        if (dragEnterEvent) {
            dropTarget.fire(dragEnterEvent);
        }

        setPrevXY(dragEvent);
    }

    function resizeMove (event) {
        event.preventDefault();

        var resizeEvent;

        if (!resizing) {
            resizeEvent = new InteractEvent(event, 'resize', 'start');
            target.fire(resizeEvent);

            resizing = true;
        }
        else {
            resizeEvent = new InteractEvent(event, 'resize', 'move');
            target.fire(resizeEvent);
        }

        setPrevXY(resizeEvent);
    }

    function gestureMove (event) {
        if (event.touches.length < 2) {
            return;
        }
        event.preventDefault();

        var gestureEvent;

        if (!gesturing) {

            gestureEvent = new InteractEvent(event, 'gesture', 'start');
            gestureEvent.ds = 0;

            gesture.startDistance = gestureEvent.distance;
            gesture.startAngle = gestureEvent.angle;
            gesture.scale = 1;

            target.fire(gestureEvent);

            gesturing = true;
        }
        else {
            gestureEvent = new InteractEvent(event, 'gesture', 'move');
            gestureEvent.ds = gestureEvent.scale - gesture.scale;

            target.fire(gestureEvent);
        }

        setPrevXY(gestureEvent);

        gesture.prevAngle = gestureEvent.angle;
        gesture.prevDistance = gestureEvent.distance;
        if (gestureEvent.scale !== Infinity &&
            gestureEvent.scale !== null &&
            gestureEvent.scale !== undefined  &&
            !isNaN(gestureEvent.scale)) {

            gesture.scale = gestureEvent.scale;
        }
    }

    function pointerOver (event) {
        if (pointerIsDown || dragging || resizing || gesturing) { return; }

        target = interactables.get(event.target);
    }


    /**
     * @private
     * @event
     * Check what action would be performed on pointerMove target if a mouse
     * button were pressed and change the cursor accordingly
     */
    function pointerHover (event) {
        if (!(pointerIsDown || dragging || resizing || gesturing) && target) {

            var action = validateAction(target.getAction(event));

            if (action) {
                if (styleCursor) {
                    if (action) {
                        target._element.style.cursor = actions[action].cursor;
                    }
                    else {
                        target._element.style.cursor = '';
                    }
                }
            }
            else if (dragging || resizing || gesturing) {
                event.preventDefault();
            }
        }
    }

    /**
     * @private
     * @event
     * End interact move events and stop auto-scroll
     */
    function docPointerUp (event) {
        var endEvent;

        if (dragging) {
            endEvent = new InteractEvent(event, 'drag', 'end');
            var dropEvent,
                drop;

            if (dropzones.length) {
                var i,
                    drops = [],
                    elements = [];

                // collect all dropzones that qualify for a drop
                for (i = 0; i < dropzones.length; i++) {
                    if (dropzones[i].dropCheck(event)) {
                        drops.push(dropzones[i]);
                        elements.push(dropzones[i]._element);
                    }
                }

                // get the most apprpriate dropzone based on DOM depth and order
                if ((drop = resolveDrops(elements))) {
                    dropTarget = drops[drop.index];
                    dropEvent = new InteractEvent(event, 'drop');

                    endEvent.dropzone = dropTarget._element;
                }

                // otherwise, if there was a prevDropTarget (perhaps if for
                // some reason this dragend happens without the mouse moving
                // out of the previousdroptarget)
                else if (prevDropTarget) {
                    var dragLeaveEvent = new InteractEvent(event, 'drag', 'leave');

                    prevDropTarget.fire(dragLeaveEvent);

                    endEvent.dragLeave = prevDropTarget._element;
                }
            }

            target.fire(endEvent);
            if (dropEvent) {
                dropTarget.fire(dropEvent);
            }
        }
        else if (resizing) {
            endEvent = new InteractEvent(event, 'resize', 'end');
            target.fire(endEvent);
        }
        else if (gesturing) {
            endEvent = new InteractEvent(event, 'gesture', 'end');
            endEvent.ds = endEvent.scale;
            target.fire(endEvent);
        }
        else if ((event.type === 'mouseup' || event.type === 'touchend') && target && pointerIsDown && !pointerWasMoved) {
            var click = {};

            for (var prop in event) {
                if (event.hasOwnProperty(prop)) {
                    click[prop] = event[prop];
                }
            }
            click.type = 'click';
            target.fire(click);
        }

        pointerIsDown = snap.locked = dragging = resizing = gesturing = false;

        pointerWasMoved = true;

        if (target) {
            if (styleCursor) {
                document.documentElement.style.cursor = '';
            }
            autoScroll.stop();
            clearTargets();

            // prevent Default only if were previously interacting
            event.preventDefault();
        }
        prepared = null;

        return event;
    }

    interactables.indexOfElement = dropzones.indexOfElement = function (element) {
        var i;

        for (i = 0; i < this.length; i++) {
            if (this[i]._element === element) {
                return i;
            }
        }
        return -1;
    };

    interactables.get = dropzones.get = function (element) {
        var i = this.indexOfElement(element) ;

        return interactables[i];
    };

    function clearTargets () {
        target = dropTarget = prevDropTarget = null;
    }

    function interact (element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        return interactables.get(element) || new Interactable(element);
    }

    /**
     * A class for easy inheritance and setting of an Interactable's options
     *
     * @class IOptions
     */
    function IOptions (options) {
        for (var option in defaultOptions) {
            if (options.hasOwnProperty(option)
                && typeof options[option] === typeof defaultOptions[option]) {
                this[option] = options[option];
            }
        }
    }

    IOptions.prototype = defaultOptions;

    /**
     * Object type returned by interact(element)
     *
     * @class Interactable
     * @name Interactable
     */
    function Interactable (element, options) {
        this._element = element,
        this._iEvents = this._iEvents || {};

        events.add(this, 'mousemove' , pointerHover);
        events.add(this, 'mousedown' , pointerDown );
        events.add(this, 'touchmove' , pointerHover);
        events.add(this, 'touchstart', pointerDown );

        interactables.push(this);

        this.set(options);
    }

    Interactable.prototype = {
        setOnEvents: function (action, phases) {
            var start = phases.onstart || phases.onStart,
                move  = phases.onmove  || phases.onMove,
                end   = phases.onend   || phases.onEnd;

            action = 'on' + action;

            if (typeof start === 'function') { this[action + 'start'] = start; }
            if (typeof move  === 'function') { this[action + 'move' ] = move ; }
            if (typeof end   === 'function') { this[action + 'end'  ] = end  ; }
        },

        /**
         * Returns or sets whether drag actions can be performed on the
         * Interactable
         *
         * @function
         * @param {bool} options
         * @returns {bool | Interactable}
         */
        draggable: function (options) {
            if (typeof options === 'object') {
                this.options.draggable = true;
                this.setOnEvents('drag', options);

                return this;
            }
            if (typeof options === 'boolean') {
                this.options.draggable = options;

                return this;
            }

            return this.options.draggable;
        },

        /**
         * Returns or sets whether elements can be dropped onto this
         * Interactable to trigger interactdrop events
         *
         * @function
         * @param {bool} options The new value to be set. Passing null returns
         *              the current value
         * @returns {bool | Interactable}
         */
        dropzone: function (options) {
            if (typeof options === 'object') {
                var ondrop = options.ondrop || options.onDrop;
                if (typeof ondrop === 'function') { this.ondrop = ondrop; }

                this.options.dropzone = true;
                dropzones.push(this);

                if (!dynamicDrop) {
                    calcRects([this]);
                }
                return this;
            }
            if (typeof options === 'boolean') {
                if (options) {
                    dropzones.push(this);

                    if (!dynamicDrop) {
                        calcRects([this]);
                    }
                }
                else {
                    var index = dropzones.indexOf(this);
                    if (index !== -1) {
                        dropzones.splice(index, 1);
                    }
                }

                this.options.dropzone = options;

                return this;
            }
            return this.options.dropzone;
        },

        /**
         * The default function to determine if an interactdragend event occured
         * over this Interactable's element
         *
         * @function
         * @param {MouseEvent | TouchEvent} event The event that ends an
         *          interactdrag
         * @returns {bool}
         */
        dropCheck: function (event) {
            if (target !== this) {
                var horizontal,
                    vertical;

                if (dynamicDrop) {

                    var clientRect = (this._element instanceof SVGElement)?
                            this._element.getBoundingClientRect():
                            this._element.getClientRects()[0],
                        client = getClientXY(event);

                    horizontal = (client.x > clientRect.left) && (client.x < clientRect.right);
                    vertical   = (client.y > clientRect.top ) && (client.y < clientRect.bottom);


                    return horizontal && vertical;
                }
                else {
                    var page = getPageXY(event);

                    horizontal = (page.x > this.rect.left) && (page.x < this.rect.right);
                    vertical   = (page.y > this.rect.top ) && (page.y < this.rect.bottom);

                    return horizontal && vertical;
                }
            }
        },

        /**
         * Returns or sets the function used to check if a dragged element is
         * dropped over this Interactable
         *
         * @function
         * @param {function} newValue A function which takes a mouseUp/touchEnd
         *                   event as a parameter and returns true or false to
         *                   indicate if the the current draggable can be
         *                   dropped into this Interactable
         * @returns {Function | Interactable}
         */
        dropChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.dropCheck = newValue;

                return this;
            }
            return this.dropCheck;
        },

        /**
         * Returns or sets whether resize actions can be performed on the
         * Interactable
         *
         * @function
         * @param {} options An object with event listeners to be fired on resize events
         * @returns {bool | Interactable}
         */
        resizeable: function (options) {
            if (typeof options === 'object') {
                this.options.resizeable = true;
                this.setOnEvents('resize', options);

                return this;
            }
            if (typeof options === 'boolean') {
                this.options.resizeable = options;

                return this;
            }
            return this.options.resizeable;
        },

        /**
         * Returns or sets whether resizing is forced 1:1 aspect
         *
         * @function
         * @param {bool} newValue
         * @returns {bool | Interactable}
         */
        squareResize: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this.options.squareResize = newValue;

                return this;
            }
            return this.options.squareResize;
        },

        /**
         * Returns or sets whether multitouch gestures can be performed on the
         * Interactables element
         *
         * @function
         * @param {bool} options
         * @returns {bool | Interactable}
         */
        gestureable: function (options) {
            if (typeof options === 'object') {
                this.options.gestureable = true;
                this.setOnEvents('gesture', options);

                return this;
            }
            if (options !== null && options !== undefined) {
                this.options.gestureable = options;

                return this;
            }
            return this.options.gestureable;
        },

        /**
         * Returns or sets whether or not any actions near the edges of the
         * window/container trigger autoScroll for this Interactable
         *
         * @function
         * @param {Object | Boolean | null} options either
         *          an object with margin, distance and interval properties,
         *          true or false to enable or disable autoScroll,
         *          null to use default settings
         * @returns {bool | interact}
         */
        autoScroll: function (newValue) {
            var defaults = defaultOptions.autoScroll;

            if (newValue instanceof Object) {
                if (newValue !== defaults) {
                    if (typeof (newValue.margin  ) !== 'number') { newValue.margin    = defaults.margin   ; }
                    if (typeof (newValue.distance) !== 'number') { newValue.distance  = defaults.distance ; }
                    if (typeof (newValue.interval) !== 'number') { newValue.interval  = defaults.interval ; }

                    if (!(newValue.container instanceof Element)){ newValue.container = defaults.container; }

                    this.options.autoScrollEnabled = true;
                    this.options.autoScroll = newValue;
                }

                return this;
            }

            if (typeof newValue === 'boolean') {
                this.options.autoScrollEnabled = newValue;

                return this;
            }

            return this.options.autoScrollEnabled? this.options.autoScroll: false;
        },

        /**
         * @private
         * @returns{String} action to be performed - drag/resize[axes]/gesture
         */
        getAction: function actionCheck (event) {
            var rect = this.getRect(),
                right,
                bottom,
                action,
                page = getPageXY(event),
                options = this.options;

            if (actionIsEnabled.resize && options.resizeable) {
                right  = page.x > (rect.right  - margin);
                bottom = page.y > (rect.bottom - margin);
            }

            if (actionIsEnabled.gesture &&
                    event.touches && event.touches.length >= 2 &&
                    !(dragging || resizing)) {
                action = 'gesture';
            }
            else {
                resizeAxes = (right?'x': '') + (bottom?'y': '');
                action = (resizeAxes)?
                    'resize' + resizeAxes:
                    actionIsEnabled.drag && options.draggable?
                        'drag':
                        null;
            }

            return action;
        },

        /**
         * Returns or sets the function used to check action to be performed on
         * pointerDown
         *
         * @function
         * @param {function} newValue
         * @returns {Function | Interactable}
         */
        actionChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.getAction = newValue;

                return this;
            }
            return this.getAction;
        },

        /**
         * Return an object with the left, right, top, bottom, width and height
         * of the interactable's element
         *
         * @function
         * @param {function} newValue
         * @returns {Function | Interactable}
         */
        getRect: function rectCheck () {
            var scroll = getScrollXY(),
                clientRect = (this._element instanceof SVGElement)?
                    this._element.getBoundingClientRect():
                    this._element.getClientRects()[0];

            return {
                left  : clientRect.left   + scroll.x,
                right : clientRect.right  + scroll.x,
                top   : clientRect.top    + scroll.y,
                bottom: clientRect.bottom + scroll.y,
                width : clientRect.width || clientRect.right - clientRect.left,
                height: clientRect.heigh || clientRect.top - clientRect.top
            };
        },

        /**
         * Returns or sets the function used to calculate the interactable's
         * element rectangle
         *
         * @function
         * @param {function} newValue
         * @returns {Function | Interactable}
         */
        rectChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.getRect = newValue;

                return this;
            }
            return this.getRect;
        },

        /**
         * Returns or sets whether the action that would be performed when the
         * mouse hovers over the element are checked. If so, the cursor may be
         * styled appropriately
         *
         * @function
         * @param {function} newValue
         * @returns {Function | Interactable}
         */
        styleCursor: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this.options.styleCursor = newValue;

                return this;
            }
            return this.options.styleCursor;
        },

        /**
         * returns the element this interactable represents
         *
         * @function
         * @returns {HTMLElement | SVGElement}
         */
        element: function () {
            return this._element;
        },

        /**
         * Calls listeners for the given event type bound globablly
         * and directly to this Interactable
         *
         * @function
         * @returns {Interactable}
         */
        fire: function (iEvent) {
            if (!(iEvent && iEvent.type) || eventTypes.indexOf(iEvent.type) === -1) {
                return this;
            }

            var listeners,
                fireState = 0,
                i = 0,
                len,
                onEvent = 'on' + iEvent.type;

            // Try-catch and loop so an exception thrown from a listener
            // doesn't ruin everything for everyone
            while (fireState < 3) {
                try {
                    switch (fireState) {
                        // interactable.onevent listener
                        case fireStates.onevent:
                            if (typeof this[onEvent] === 'function') {
                            this[onEvent](iEvent);
                        }
                        break;

                        // Interactable#bind() listeners
                        case fireStates.directBind:
                            if (iEvent.type in this._iEvents) {
                            listeners = this._iEvents[iEvent.type];

                            for (len = listeners.length; i < len && !imPropStopped; i++) {
                                listeners[i](iEvent);
                            }
                            break;
                        }

                        break;

                        // interact.bind() listeners
                        case fireStates.globalBind:
                            if (iEvent.type in globalEvents && (listeners = globalEvents[iEvent.type]))  {
                            listeners = globalEvents[iEvent.type];

                            for (len = listeners.length; i < len && !imPropStopped; i++) {
                                listeners[i](iEvent);
                            }
                        }
                    }

                    i = 0;
                    fireState++;
                }
                catch (error) {
                    console.error('Error thrown from ' + iEvent.type + ' listener');
                    console.error(error);
                    i++;

                    if (fireState === fireStates.onevent) {
                        fireState++;
                    }
                }
            }

            imPropStopped = false;

            return this;
        },

        /**
         * Binds a listener to an InteractEvent or DOM event
         *
         * @function
         * @returns {Interactable}
         */
        bind: function (eventType, listener, useCapture) {
            if (eventTypes.indexOf(eventType) !== -1) {
                // if this type of event was never bound to this Interactable
                if (!(eventType in this._iEvents)) {
                    this._iEvents[eventType] = [listener];
                }
                // if the event listener is not already bound for this type
                else if (this._iEvents[eventType].indexOf(listener) === -1) {
                    this._iEvents[eventType].push(listener);
                }
            }
            else {
                if (eventType === 'wheel') {
                    eventType = wheelEvent;
                }
                events.add(this, eventType, listener, useCapture);
            }

            return this;
        },

        /**
         * Unbinds an InteractEvent or DOM event listener
         *
         * @function
         * @returns {Interactable}
         */
        unbind: function (eventType, listener, useCapture) {
            if (eventTypes.indexOf(eventType) !== -1) {
                var eventArray = this._iEvents[eventType],
                    index;

                if (eventArray && (index = eventArray.indexOf(listener)) !== -1) {;
                    this._iEvents[eventType].splice(index, 1);
                }
            }
            else {
                if (eventType === 'wheel') {
                    eventType = wheelEvent;
                }
                events.remove(this._element, listener, useCapture);
            }

            return this;
        },

        /**
         * @function
         * @description Reset the options of this Interactable
         * @param {Object} options
         * @returns {Interactable}
         */
        set: function (options) {
            if (!options || typeof options !== 'object') {
                options = {};
            }
            this.options = new IOptions(options);

            this.draggable  ('draggable'   in options? options.draggable  : this.options.draggable  );
            this.dropzone   ('dropzone'    in options? options.dropzone   : this.options.dropzone   );
            this.resizeable ('resizeable'  in options? options.resizeable : this.options.resizeable );
            this.gestureable('gestureable' in options? options.gestureable: this.options.gestureable);

            if ('autoScroll'  in options) { this.autoScroll (options.autoScroll ); }

            return this;
        },

        /**
         * Remove this interactable from the list of interactables
         * and remove it's drag, drop, resize and gesture capabilities
         *
         * @function
         * @returns {} {@link interact}
         */
        unset: function () {
            events.remove(this, 'all');

            this.dropzone   (false);

            interactables.splice(interactables.indexOf(this), 1);

            return interact;
        }
    };

    /**
     * @function
     * @description Check if an element has been set
     * @param {HTMLElement | SVGElement} element The Element being searched for
     * @returns {bool}
     */
    interact.isSet = function(element) {
        return interactables.indexOfElement(element) !== -1;
    };

    /**
     * Binds a global listener to an InteractEvent
     *
     * @function
     * @returns {interact}
     */
    interact.bind = function (iEventType, listener) {
        // The event must be an InteractEvent type
        if (eventTypes.indexOf(iEventType) !== -1) {
            // if this type of event was never bound to this Interactable
            if (!globalEvents[iEventType]) {
                globalEvents[iEventType] = [listener];
            }

            // if the event listener is not already bound for this type
            else if (globalEvents[iEventType].indexOf(listener) === -1) {

                globalEvents[iEventType].push(listener);
            }
        }
        return interact;
    },

    /**
     * Unbinds a global InteractEvent listener
     *
     * @function
     * @returns {interact}
     */
    interact.unbind = function (iEventType, listener) {
        var index = globalEvents[iEventType].indexOf(listener);

        if (index !== -1) {
            globalEvents[iEventType].splice(index, 1);
        }
        return interact;
    },

    /**
     * @function
     * @description Simulate pointer down to interact with an interactable element
     * @param {String} action The action to be performed - drag, resize, etc.
     * @param {HTMLElement | SVGElement} element The DOM Element to resize/drag
     * @param {MouseEvent | TouchEvent} [pointerEvent] A pointer event whose pageX/Y
     *        coordinates will be the starting point of the interact drag/resize
     * @returns {} {@link interact}
     */
    interact.simulate = function (action, element, pointerEvent) {
        var event = {},
            prop,
            clientRect;

        if (action === 'resize') {
            action = 'resizexy';
        }
        // return if the action is not recognised
        if (!(action in actions)) {
            return interact;
        }

        if (pointerEvent) {
            for (prop in pointerEvent) {
                if (pointerEvent.hasOwnProperty(prop)) {
                    event[prop] = pointerEvent[prop];
                }
            }
        }
        else {
            clientRect = (target._element instanceof SVGElement)?
                element.getBoundingClientRect():
                clientRect = element.getClientRects()[0];

            if (action === 'drag') {
                event.pageX = clientRect.left + clientRect.width / 2;
                event.pageY = clientRect.top + clientRect.height / 2;
            }
            else {
                event.pageX = clientRect.right;
                event.pageY = clientRect.bottom;
            }
        }

        event.target = event.currentTarget = element;
        event.preventDefault = event.stopPropagation = function () {};

        pointerDown(event, action);

        return interact;
    };

    /**
     * Returns or sets whether dragging is disabled for all Interactables
     *
     * @function
     * @param {bool} newValue
     * @returns {bool | interact}
     */
    interact.enableDragging = function (value) {
        if (value !== null && value !== undefined) {
            actionIsEnabled.drag = value;

            return interact;
        }
        return actionIsEnabled.drag;
    };

    /**
     * Returns or sets whether resizing is disabled for all Interactables
     *
     * @function
     * @param {bool} newValue
     * @returns {bool | interact}
     */
    interact.enableResizing = function (value) {
        if (value !== null && value !== undefined) {
            actionIsEnabled.resize = value;

            return interact;
        }
        return actionIsEnabled.resize;
    };

    /**
     * Returns or sets whether gestures are disabled for all Interactables
     *
     * @function
     * @param {bool} newValue
     * @returns {bool | interact}
     */
    interact.enableGesturing = function (value) {
        if (value !== null && value !== undefined) {
            actionIsEnabled.gesture = value;

            return interact;
        }
        return actionIsEnabled.gesture;
    };

    interact.eventTypes = eventTypes;

    /**
     * Returns debugging data
     * @function
     */
    interact.debug = function () {
        return {
            target                : target,
            dragging              : dragging,
            resizing              : resizing,
            gesturing             : gesturing,
            prevX                 : prevX,
            prevY                 : prevY,
            x0                    : x0,
            y0                    : y0,
            Interactable          : Interactable,
            IOptions              : IOptions,
            interactables         : interactables,
            dropzones             : dropzones,
            pointerIsDown         : pointerIsDown,
            supportsTouch         : supportsTouch,
            defaultOptions        : defaultOptions,
            defaultActionChecker  : Interactable.prototype.getAction,
            dragMove              : dragMove,
            resizeMove            : resizeMove,
            gestureMove           : gestureMove,
            pointerUp             : docPointerUp,
            pointerDown           : pointerDown,
            pointerHover          : pointerHover,
            events                : events,
            log: function () {
                console.log('target         :  ' + target);
                console.log('prevX, prevY   :  ' + prevX, prevY);
                console.log('x0, y0         :  ' + x0, y0);
                console.log('supportsTouch  :  ' + supportsTouch);
                console.log('pointerIsDown  :  ' + pointerIsDown);
                console.log('currentAction  :  ' + interact.currentAction());
            }
        };
    };

    /**
     * Returns or sets the margin for autocheck resizing. That is the distance
     * from the bottom and right edges of an element clicking in which will
     * start resizing
     *
     * @function
     * @param {number} newValue
     * @returns {number | interact}
     */
    interact.margin = function (newMargin) {
        if (typeof newMargin === 'number') {
            margin = newMargin;

            return interact;
        }
        return margin;
    };

    /**
     * Returns or sets whether if the cursor style of the document is changed
     * depending on what action is being performed
     *
     * @function
     * @param {bool} newValue
     * @returns {bool | interact}
     */
    interact.styleCursor = function (newValue) {
        if (typeof newValue === 'boolean') {
            defaultOptions.styleCursor = newValue;

            return interact;
        }
        return defaultOptions.styleCursor;
    };

    /**
     * Returns or sets whether or not any actions near the edges of the page
     * trigger autoScroll by default
     *
     * @function
     * @param {bool | Object} options true or false to simply enable or disable
              or an object with margin, distance and interval properties
     * @returns {bool | interact}
     */
    interact.autoScroll = function (options) {
        var defaults = defaultOptions.autoScroll;
            
        if (typeof options === 'object') {
            defaultOptions.autoScrollEnabled = true;

            if (typeof (options.margin)   === 'number') { defaults.margin    = options.margin   ; }
            if (typeof (options.distance) === 'number') { defaults.distance  = options.distance ; }
            if (typeof (options.interval) === 'number') { defaults.interval  = options.interval ; }

            defaults.container = options.container instanceof Element?
                options.container:
                defaults.container;

            return interact;
        }

        if (typeof options === 'boolean') {
            defaultOptions.autoScrollEnabled = options;

            return interact;
        }

        // return the autoScroll settings if autoScroll is enabled
        // otherwise, return false
        return defaultOptions.autoScrollEnabled? defaults: false;
    };

    /**
     * Returns or sets whether actions are constrained to a grid or a
     * collection of coordinates
     *
     * @function
     * @param {bool | Object} options true or false to simply enable or disable
     *        or an object with properties
     *        mode   : 'grid' or 'anchor',
     *        range  : the distance within which snapping to a point occurs,
     *        grid   : an object with properties
     *                 x     : the distance between x-axis snap points,
     *                 y     : the distance between y-axis snap points,
     *                 offset: an object with
     *                         x, y: the x/y-axis values of the grid origin
     *        anchors: an array of objects with x, y and optional range
     *                 eg [{x: 200, y: 300, range: 40}, {x: 5, y: 0}],
     *
     * @returns {Object | interact}
     */
    interact.snap = function (options) {
        if (typeof options === 'object') {
            snap.enabled = true;

            if (typeof options.mode  === 'string') { snap.mode    = options.mode;   }
            if (typeof options.range === 'number') { snap.range   = options.range;  }
            if (typeof options.grid  === 'object') { snap.grid    = options.grid;   }
            if (typeof options.gridOffset === 'object') { snap.gridOffset = options.gridOffset; }
            if (options.anchors instanceof Array ) { snap.anchors = options.anchors;}

            return interact;
        }
        if (typeof options === 'boolean') {
            snap.enabled = options;

            return interact;
        }

        return {
            enabled   : snap.enabled,
            mode      : snap.mode,
            grid      : snap.grid,
            gridOffset: snap.gridOffset,
            anchors   : snap.anchors,
            range     : snap.range,
            locked    : snap.locked,
            x         : snap.x,
            y         : snap.y,
            realX     : snap.realX,
            realY     : snap.realY,
            dx        : snap.dx,
            dy        : snap.dy
        };
    };

    /**
     * Returns or sets whether or not the browser supports touch input
     *
     * @function
     * @returns {bool}
     */
    interact.supportsTouch = function () {
        return supportsTouch;
    };

    /**
     * Returns what action is currently being performed
     *
     * @function
     * @returns {String | null}
     */
    interact.currentAction = function () {
        return (dragging && 'drag') || (resizing && 'resize') || (gesturing && 'gesture') || null;
    };

    /**
     * Returns or sets wheather the dimensions of dropzone elements are
     * calculated on every dragmove or only on dragstart for the default
     * dropChecker
     *
     * @function
     * @param {bool} newValue True to check on each move
     * @returns {bool | @link interact}
     */
    interact.dynamicDrop = function (newValue) {
        if (typeof newValue === 'boolean') {
            if (dragging && dynamicDrop !== newValue && !newValue) {
                calcRects(dropzones);
            }

            dynamicDrop = newValue;

            return interact;
        }
        return dynamicDrop;
    };


    events.add(docTarget   , 'mousemove'    , pointerMove );
    events.add(docTarget   , 'touchmove'    , pointerMove );
    events.add(docTarget   , 'mouseover'    , pointerOver );
    events.add(docTarget   , 'mouseup'      , docPointerUp);
    events.add(docTarget   , 'touchend'     , docPointerUp);
    events.add(docTarget   , 'touchcancel'  , docPointerUp);
    events.add(windowTarget, 'blur'         , docPointerUp);

    // For IE's lack of preventDefault
    events.add(docTarget,    'selectstart', function (e) {
        if (dragging || resizing || gesturing) {
            e.preventDefault();
        }
    });

    return interact;
} ());
