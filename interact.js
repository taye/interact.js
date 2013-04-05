/*
 * Copyright (c) 2012, 2013 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/biographer/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js
 * @name interact
 * @function interact
 * @param {HTMLElement | SVGElement} element The previously set document element
 * @returns {Interactable | null} Returns an Interactable if the element passed
 *          was previously set. Returns null otherwise.
 * @description The properties of this variable can be used to set elements as
 *              interactables and also to change various settings. Calling it as
 *              a function with an element which was previously set returns an
 *              Interactable object which has various methods to configure it.
 */
(function (window) {
   'use strict';

var document = window.document,
    console = window.console,
    SVGElement = window.SVGElement,
    SVGSVGElement = window.SVGSVGElement,
    HTMLElement = window.HTMLElement,

    // Previous interact move event mouse/touch position
    prevX       = 0,
    prevY       = 0,
    prevClientX = 0,
    prevClientY = 0,

    // Previos interact start event mouse/touch position
    x0       = 0,
    y0       = 0,
    clientX0 = 0,
    clientY0 = 0,

    gesture = {
        start: {
            x: 0,
            y: 0
        },

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

    // All things relating to autoScroll
    scrollMargin = 70,
    scroll = {
        isEnabled: true,
        margin   : scrollMargin,

        interval : 20,      // pause in ms between each scroll pulse
        i        : null,    // the handle returned by window.setInterval
        distance : 10,      // the distance in x and y that the page is scrolled

        x: 0,               // Direction each pulse is to scroll in
        y: 0,

        // scroll the window by the values in scroll.x/y
        autoScroll: function () {
            window.scrollBy(scroll.x, scroll.y);
        },

        edgeMove: function (event) {
            if (scroll.isEnabled && (dragging || resizing)) {
                var top = event.clientY < scroll.margin,
                    right = event.clientX > (window.innerWidth - scroll.margin),
                    bottom = event.clientY > (window.innerHeight - scroll.margin),
                    left = event.clientX < scroll.margin,
                    options = target.options;

                scroll.x = scroll.distance * (right ? 1: left? -1: 0);
                scroll.y = scroll.distance * (bottom? 1:  top? -1: 0);

                if (!scroll.isScrolling && options.autoScroll) {
                    scroll.start();
                }
            }
        },

        isScrolling: false,

        start: function () {
            scroll.isScrolling = true;
            window.clearInterval(scroll.i);
            scroll.i = window.setInterval(scroll.autoScroll, scroll.interval);
        },

        stop: function () {
            window.clearInterval(scroll.i);
            scroll.isScrolling = false;
        }
    },

    // Does the browser support touch input?
    supportsTouch = 'createTouch' in document,

    // Less Precision with touch input
    margin = supportsTouch ? 20 : 10,

    mouseIsDown   = false,
    mouseWasMoved = false,
    imPropStopped = false,
    gesturing     = false,
    dragging      = false,
    resizing      = false,
    resizeAxes    = 'xy',

    // What to do depending on action returned by getAction() of node
    // Dictates what styles should be used and what mouseMove event Listner
    // is to be added after mouseDown
    actions = {
        drag: {
            cursor      : 'move',
            className   : 'interact-dragging',
            moveListener: dragMove
        },
        resizex: {
            cursor      : 'e-resize',
            className   : 'interact-resizing',
            moveListener: resizeMove
        },
        resizey: {
            cursor      : 's-resize',
            className   : 'interact-resizing',
            moveListener: resizeMove
        },
        resizexy: {
            cursor      : 'se-resize',
            className   : 'interact-resizing',
            moveListener: resizeMove
        },
        gesture: {
            cursor      : '',
            className   : 'interact-gesturing',
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

    // User interaction event types. will be set depending on touch input is
    // supported
    downEvent,
    upEvent,
    moveEvent,
    overEvent,
    outEvent,
    enterEvent,
    leaveEvent,

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
        var addEvent = ('addEventListener' in document)?
                'addEventListener': 'attachEvent',
            removeEvent = ('removeEventListener' in document)?
                'removeEventListener': 'detachEvent',
            
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

        function add (element, type, listener, useCapture) {
            if (!(element instanceof window.Element) && element !== window.document) {
                return;
            }

            var target = targets[elements.indexOf(element)];

            if (!target) {
                target = {
                    events: {},
                    typeCount: 0
                };

                elements.push(element);
                targets.push(target);
            }
            if (!target.events[type]) {
                target.events[type] = [];
                target.typeCount++;
            }

            if (target.events[type].indexOf(listener) === -1) {
                target.events[type].push(listener);

                return element[addEvent](type, listener, useCapture || false);
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
                        element[removeEvent](type, target.events[type][i], useCapture || false);
                    }
                    target.events[type] = null;
                    target.typeCount--;
                } else {
                    for (i = 0; i < len; i++) {
                        if (target.events[type][i] === listener) {

                            element[removeEvent](type, target.events[type][i], useCapture || false);
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
            }
        };
    }());

    // Set event types to be used depending on input available
    if (supportsTouch) {
        downEvent   = 'touchstart',
        upEvent     = 'touchend',
        moveEvent   = 'touchmove',
        overEvent   = 'touchover',
        outEvent    = 'touchout';
        enterEvent  = 'touchover',
        leaveEvent  = 'touchout';
    }
    else {
        downEvent   = 'mousedown',
        upEvent     = 'mouseup',
        moveEvent   = 'mousemove',
        overEvent   = 'mouseover',
        outEvent    = 'mouseout';
        enterEvent  = 'touchenter',
        leaveEvent  = 'touchleave';
    }

    /**
     * @private
     * @returns{String} action to be performed - drag/resize[axes]/gesture
     */
    function actionCheck (event) {
        var clientRect,
            right,
            bottom,
            action,
            page = getPageXY(event),
            x = page.x - window.scrollX,
            y = page.y - window.scrollY,
            options = target.options;

        clientRect = (target._element instanceof SVGElement)?
            target._element.getBoundingClientRect():
            target._element.getClientRects()[0];


        if (actionIsEnabled.resize && options.resizeable) {
            right = (x - clientRect.left) > (clientRect.width - margin);
            bottom = (y - clientRect.top) > (clientRect.height - margin);
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
    }

    // Get specified X/Y coords for mouse or event.touches[0]
    function getXY (event, type) {
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

        // Opera Mobile handles the viewport and scrolling oddly
        if (window.navigator.appName == 'Opera' && supportsTouch) {
            x -= window.scrollX;
            y -= window.scrollY;
        }

        return {
            x: x,
            y: y
        };
    }

    function getPageXY (event) {
        return getXY(event, 'page');
    }

    function getClientXY (event) {
        return getXY(event, 'client');
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

    // Test for the dropzone element that's "above" all other qualifiers
    function resolveDrops (drops) {
        if (drops.length) {

            var dropzone,
                deepestZone = drops[0],
                parent,
                deepestZoneParents = [],
                dropzoneParents = [],
                child,
                i,
                n;

            for (i = 1; i < drops.length; i++) {
                dropzone = drops[i];

                if (!deepestZoneParents.length) {
                    parent = deepestZone._element;
                    while (parent.parentNode !== document) {
                        deepestZoneParents.unshift(parent);
                        parent = parent.parentNode;
                    }
                }

                // if this dropzone is an svg element and the current deepest is
                // an HTMLElement
                if (deepestZone._element instanceof HTMLElement &&
                        dropzone._element instanceof SVGElement &&
                        !(dropzone._element instanceof SVGSVGElement)) {

                    if (dropzone._element.ownerSVGElement.parentNode ===
                            deepestZone._element.parentNode) {
                        continue;
                    }
                    parent = dropzone._element.ownerSVGElement;
                }
                else {
                    parent = dropzone._element;
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

                parent = [
                    dropzoneParents[n - 1],
                    dropzoneParents[n],
                    deepestZoneParents[n]
                ];
                child = parent[0].lastChild;

                while (child) {
                    if (child === parent[1]) {
                        deepestZone = dropzone;
                        deepestZoneParents = [];
                        break;
                    }
                    else if (child === parent[2]) {
                        break;
                    }
                    child = child.previousSibling;
                }
            }
            return deepestZone;
        }
    }

    function InteractEvent (event, action, phase) {
        var client,
            page,
            options = target.options;

        if (action === 'gesture') {
            var average = touchAverage(event);

            page   = {x: average.pageX,   y: average.pageY};
            client = {x: average.clientX, y: average.clientY};
        }
        else {
            client = getClientXY(event);
            page = getPageXY(event);
        }

        this.x0       = x0;
        this.y0       = y0;
        this.clientX0 = clientX0;
        this.clientY0 = clientY0;
        this.pageX    = page.x;
        this.pageY    = page.y;
        this.clientX  = client.x;
        this.clientY  = client.y;
        this.ctrlKey  = event.ctrlKey;
        this.altKey   = event.altKey;
        this.shiftKey = event.shiftKey;
        this.metaKey  = event.metaKey;
        this.button   = event.button;
        this.target   = action === 'drop' && dropTarget._element || target._element;
        this.type     = action + (phase || '');

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
     * Determine action to be performed on next mouseMove and add appropriate
     * style and event Liseners
     */
    function mouseDown (event, forceAction) {
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
        // Otherwise, set the target if the mouse is not down
        if ((event.touches && event.touches.length < 2 && !target) ||
                !(mouseIsDown)) {
            target = interactables.get(this);
        }

        if (target && !(dragging || resizing || gesturing)) {
            var options = target.options;

            x0 = prevX = page.x;
            y0 = prevY = page.y;
            clientX0 = prevClientX = client.x;
            clientY0 = prevClientY = client.y;

            action = validateAction(forceAction || options.getAction(event));

            if (!action) {
                return event;
            }

            // Register that the mouse is down after succesfully validating
            // action. This way, a new target can be gotten in the next
            // downEvent propagation
            mouseIsDown = true;
            mouseWasMoved = false;

            if (styleCursor) {
                document.documentElement.style.cursor =
                    target._element.style.cursor =
                    actions[action].cursor;
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

    function mouseMove (event) {
        if (mouseIsDown) {
           if (x0 === prevX && y0 === prevY) { 
               mouseWasMoved = true;
           }
           if (prepared && target) {
            addClass(target._element, actions[prepared].className);
            actions[prepared].moveListener(event);
           }
        }

        if (dragging || resizing) {
            scroll.edgeMove(event);
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
        }
        else {
            dragEvent = new InteractEvent(event, 'drag', 'move');

            if (dropzones.length) {
                var i,
                    drops = [];

                // collect all dropzones that qualify for a drop
                for (i = 0; i < dropzones.length; i++) {
                    if (dropzones[i].dropCheck(event)) {
                        drops.push(dropzones[i]);
                    }
                }

                // get the most apprpriate dropzone based on DOM depth and order
                dropTarget = resolveDrops(drops);

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

        prevX = dragEvent.pageX;
        prevY = dragEvent.pageY;

        prevClientX = dragEvent.clientX;
        prevClientY = dragEvent.clientY;
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

        prevX = resizeEvent.pageX;
        prevY = resizeEvent.pageY;

        prevClientX = resizeEvent.clientX;
        prevClientY = resizeEvent.clientY;
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

        prevX = gestureEvent.pageX;
        prevY = gestureEvent.pageY;

        prevClientX = gestureEvent.clientX;
        prevClientY = gestureEvent.clientY;

        gesture.prevAngle = gestureEvent.angle;
        gesture.prevDistance = gestureEvent.distance;
        if (gestureEvent.scale !== Infinity && gestureEvent.scale !== null && gestureEvent.scale !== undefined  && !isNaN(gestureEvent.scale)) {
            gesture.scale = gestureEvent.scale;
        }
    }

    /**
     * @private
     * @event
     * Check what action would be performed on mouseMove target if the mouse
     * button were pressed and change the element classes accordingly
     */
    function mouseHover (event) {
        var action,
            options;

        // Check if target element or it's parent is interactable
        if (!(mouseIsDown || dragging || resizing || gesturing) &&
            (target = interactables.get(event.target) || interactables.get(event.target.parentNode))) {
            options = target.options;

        if ((options.resizeable || options.draggable) && options.checkOnHover) {
            action = validateAction(options.getAction(event));

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
    function docMouseUp (event) {
        var endEvent;

        if (dragging) {
            endEvent = new InteractEvent(event, 'drag', 'end');
            var dropEvent;

            if (dropzones.length) {
                var i,
                    drops = [];

                // collect all dropzones that qualify for a drop
                for (i = 0; i < dropzones.length; i++) {
                    if (dropzones[i].dropCheck(event)) {
                        drops.push(dropzones[i]);
                    }
                }

                // get the most apprpriate dropzone based on DOM depth and order
                if ((dropTarget = resolveDrops(drops))) {
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
        else if (event.type === 'mouseup' && target && mouseIsDown && !mouseWasMoved) {
            var click = {};

            for (var prop in event) {
                if (event.hasOwnProperty(prop)) {
                    click[prop] = event[prop];
                }
            }
            click.type = 'click';
            target.fire(click);
        }

        mouseIsDown = dragging = resizing = gesturing = false;

        mouseWasMoved = true;

        if (target) {
            if (styleCursor) {
                document.documentElement.style.cursor = '';
                target._element.style.cursor = '';
            }
            scroll.stop();
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

    function addClass (element, classNames) {
        var i;

        if (!element.classList) {
            return false;
        }

        classNames = classNames.split(' ');
        for (i = 0; i < classNames.length; i++) {
            if (classNames[i] !== '') {
                element.classList.add(classNames[i]);
            }
        }
    }

    function removeClass (element, classNames) {
        var i;

        if (!element.classList) {
            return false;
        }

        classNames = classNames.split(' ');
        for (i = 0; i < classNames.length; i++) {
            if (classNames[i] !== '') {
                element.classList.remove(classNames[i]);
            }
        }
    }

    function clearTargets () {
        if (target) {
            removeClass(target._element, 'interact-dragging interact-resizing interact-gesturing');
        }
        if (dropTarget) {
            removeClass(target._element, 'interact-droptarget');
        }
        target = dropTarget = prevDropTarget = null;
    }

    function interact (element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        return interactables.get(element) || new Interactable(element);
    }

    /**
     * A class for inheritance and easier setting of an Interactable's options
     *
     * @class IOptions
     */
    function IOptions (options) {
        for (var option in IOptions.prototype) {
            if (options.hasOwnProperty(option) && typeof options[option] === typeof IOptions.prototype[option]) {
                this[option] = options[option];
            }
        }
    }

    IOptions.prototype = {
        draggable   : false,
        dropzone    : false,
        resizeable  : false,
        gestureable : false,
        squareResize: false,
        autoScroll  : true,
        getAction   : actionCheck,
        checkOnHover: true
    };

    /**
     * Object type returned by interact(element)
     *
     * @class Interactable
     * @name Interactable
     */
    function Interactable (element, options) {
        this._element = element,
        this._iEvents = this._iEvents || {};

        events.add(this, moveEvent, mouseHover);
        events.add(this, downEvent, mouseDown);

        interactables.push(this);
        addClass(this._element, 'interactable');

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

                addClass(this._element, 'interact-draggable');

                return this;
            }
            if (typeof options === 'boolean') {
                this.options.draggable = options;

                if (options) {
                    addClass(this._element, 'interact-draggable');
                }
                else {
                    removeClass(this._element, 'interact-draggable interact-dragging');
                }
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
                addClass(this._element, 'interact-dropzone');

                return this;
            }
            if (typeof options === 'boolean') {
                if (this.options.dropzone !== options) {
                    if (options) {
                        dropzones.push(this);

                        addClass(this._element, 'interact-dropzone');
                    }
                    else {
                        dropzones.splice(dropzones.indexOf(this), 1);

                        removeClass(this._element, 'interact-dropzone');
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
                var clientRect = (this._element instanceof SVGElement)?
                    this._element.getBoundingClientRect():
                    this._element.getClientRects()[0],
                horizontal,
                vertical,
                page = getPageXY(event),
                x = page.x - window.scrollX,
                y = page.y - window.scrollY;

                horizontal = (x > clientRect.left) && (x < clientRect.left + clientRect.width);
                vertical   = (y > clientRect.top ) && (y < clientRect.top  + clientRect.height);

                return horizontal && vertical;
            }
        },

        /**
         * Returns or sets the function used to check if a dragged element is
         * dropped over this Interactable
         *
         * @function
         * @param {function} newValue A function which takes a mouseUp/touchEnd
         *                   event as a parameter and returns
         * @returns {Function | Interactable}
         */
        dropChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.dropChecker = newValue;

                return this;
            }
            return this.dropChecker;
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

                addClass(this._element, 'interact-resizeable');

                return this;
            }
            if (typeof options === 'boolean') {
                this.options.resizeable = options;

                if (options) {
                    addClass(this._element, 'interact-resizeable');
                }
                else {
                    removeClass(this._element, 'interact-resizeable interact-resizing');
                }
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

                addClass(this._element, 'interact-gestureable');

                return this;
            }
            if (options !== null && options !== undefined) {
                this.options.gestureable = options;

                if (options) {
                    addClass(this._element, 'interact-gestureable');
                }
                else {
                    removeClass(this._element, 'interact-gestureable interact-gesturing');
                }
                return this;
            }
            return this.options.gestureable;
        },

        /**
         * Returns or sets whether dragging and resizing near the edges of the
         * screen will trigger autoscroll
         *
         * @function
         * @param {bool} newValue
         * @returns {bool | Interactable}
         */
        autoScroll: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this.options.autoScroll = newValue;

                return this;
            }
            return this.options.autoScroll;
        },

        /**
         * Returns or sets the function used to check action to be performed on
         * mouseDown/touchStart
         *
         * @function
         * @param {function} newValue
         * @returns {Function | Interactable}
         */
        actionChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.options.getAction = newValue;

                return this;
            }
            return this.options.getAction;
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
        checkOnHover: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this.options.checkOnHover = newValue;

                return this;
            }
            return this.options.checkOnHover;
        },

        /**
         * returns the HTML or SVG element this interactable represents
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

                            for (var len = listeners.length; i < len && !imPropStopped; i++) {
                                listeners[i](iEvent);
                            }
                            break;
                        }

                        break;

                        // interact.bind() listeners
                        case fireStates.globalBind:
                            if (iEvent.type in globalEvents && (listeners = globalEvents[iEvent.type]))  {
                            listeners = globalEvents[iEvent.type];

                            for (var len = listeners.length; i < len && !imPropStopped; i++) {
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
                var index = this._iEvents[eventType].indexOf(listener);

                if (index !== -1) {
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

            this.draggable  (this.options.draggable);
            this.dropzone   (this.options.dropzone);
            this.resizeable (this.options.resizeable);
            this.gestureable(this.options.gestureable);

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
            if (styleCursor) {
                this._element.style.cursor = '';
            }

            this.draggable  (false);
            this.dropzone   (false);
            this.resizeable (false);
            this.gestureable(false);

            interactables.splice(interactables.indexOf(this), 1);
            removeClass(this._element, 'interactable');

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
     * @description Simulate mouse down to interact with an interactable element
     * @param {String} action The action to be performed - drag, resize, etc.
     * @param {HTMLElement | SVGElement} element The DOM Element to resize/drag
     * @param {MouseEvent | TouchEvent} [mouseEvent] A mouse event whose pageX/Y
     *        coordinates will be the starting point of the interact drag/resize
     * @returns {} {@link interact}
     */
    interact.simulate = function (action, element, mouseEvent) {
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

        if (mouseEvent) {
            for (prop in mouseEvent) {
                if (mouseEvent.hasOwnProperty(prop)) {
                    event[prop] = mouseEvent[prop];
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

        mouseDown(event, action);

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
            target              : target,
            dragging            : dragging,
            resizing            : resizing,
            gesturing           : gesturing,
            prevX               : prevX,
            prevY               : prevY,
            x0                  : x0,
            y0                  : y0,
            Interactable        : Interactable,
            interactables       : interactables,
            dropzones           : dropzones,
            mouseIsDown         : mouseIsDown,
            supportsTouch       : supportsTouch,
            defaultActionChecker: actionCheck,
            dragMove            : dragMove,
            resizeMove          : resizeMove,
            gestureMove         : gestureMove,
            mouseUp             : docMouseUp,
            mouseDown           : mouseDown,
            mouseHover          : mouseHover,
            log: function () {
                console.log('target         :  ' + target);
                console.log('prevX, prevY   :  ' + prevX, prevY);
                console.log('x0, y0         :  ' + x0, y0);
                console.log('supportsTouch  :  ' + supportsTouch);
                console.log('mouseIsDown    :  ' + mouseIsDown);
                console.log('dragging       :  ' + dragging);
                console.log('resizing       :  ' + resizing);
                console.log('gesturing      :  ' + gesturing);
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
        if (newValue !== null && newValue !== undefined) {
            var i;

            styleCursor = newValue;

            // If the element cursor styles are no longer being changed by
            // interact, clear the cursor style
            if (!styleCursor) {
                for (i = 0; i < interactables.length; i++) {
                    interactables[i]._element.style.cursor = '';
                }
            }
            return interact;
        }
        return styleCursor;
    };

    /**
     * Returns or sets whether or not any actions near the edges of the page
     * trigger autoScroll
     *
     * @function
     * @param {bool} newValue
     * @returns {bool | interact}
     */
    interact.enableAutoScroll = function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            scroll.isEnabled = newValue;

            return interact;
        }
        return scroll.isEnabled;
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

    events.add(docTarget,    upEvent,       docMouseUp);
    events.add(docTarget,    moveEvent,     mouseMove);
    events.add(docTarget,    'touchcancel', docMouseUp);
    events.add(windowTarget, 'blur',        docMouseUp);

    window.interact = interact;

} (window));
