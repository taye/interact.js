/**
 * interact.js v1.0.12
 *
 * Copyright (c) 2012, 2013, 2014 Taye Adeyemi <dev@taye.me>
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */
(function (window) {
    'use strict';

    var document           = window.document,
        console            = window.console,
        SVGElement         = window.SVGElement         || blank,
        SVGSVGElement      = window.SVGSVGElement      || blank,
        SVGElementInstance = window.SVGElementInstance || blank,
        HTMLElement        = window.HTMLElement        || window.Element,

        PointerEvent = window.PointerEvent || window.MSPointerEvent,
        GestureEvent = window.GestureEvent || window.MSGestureEvent,
        Gesture      = window.Gesture      || window.MSGesture,

        hypot = Math.hypot || function (x, y) { return Math.sqrt(x * x + y * y); },

        // Previous native pointer move event coordinates
        prevCoords = {
            pageX: 0,
            pageY: 0,
            clientX: 0,
            clientY: 0,
            timeStamp: 0
        },
        // current native pointer move event coordinates
        curCoords = {
            pageX: 0,
            pageY: 0,
            clientX: 0,
            clientY: 0,
            timeStamp: 0
        },

        // Starting InteractEvent pointer coordinates
        startCoords = {
            pageX: 0,
            pageY: 0,
            clientX: 0,
            clientY: 0,
            timeStamp: 0
        },

        // Change in coordinates and time of the pointer
        pointerDelta = {
            pageX: 0,
            pageY: 0,
            clientX: 0,
            clientY: 0,
            timeStamp: 0,
            pageSpeed: 0,
            clientSpeed: 0
        },

        // keep track of added PointerEvents if browser supports them
        pointerIds   = PointerEvent? []: null,
        pointerMoves = PointerEvent? []: null,

        downTime  = 0,         // the timeStamp of the starting event
        downEvent = null,      // gesturestart/mousedown/touchstart event
        prevEvent = null,      // previous action event
        tapTime   = 0,         // time of the most recent tap event
        prevTap   = null,

        tmpXY = {},     // reduce object creation in getXY()

        inertiaStatus = {
            active       : false,
            target       : null,
            targetElement: null,

            startEvent: null,
            pointerUp : {},

            xe : 0,
            ye : 0,
            duration: 0,

            t0 : 0,
            vx0: 0,
            vys: 0,

            lambda_v0: 0,
            one_ve_v0: 0,
            i  : null
        },

        gesture = {
            start: { x: 0, y: 0 },

            startDistance: 0,   // distance between two touches of touchStart
            prevDistance : 0,
            distance     : 0,

            scale: 1,           // gesture.distance / gesture.startDistance

            startAngle: 0,      // angle of line joining two touches
            prevAngle : 0       // angle of the previous gesture event
        },

        interactables   = [],   // all set interactables
        dropzones       = [],   // all dropzone element interactables
        elements        = [],   // all elements that have been made interactable

        selectors       = {},   // all css selector interactables
        selectorDZs     = [],   // all dropzone selector interactables
        matches         = [],   // all selectors that are matched by target element
        delegatedEvents = {},   // { type: { selector: [[listener, useCapture]} }
        selectorGesture = null, // MSGesture object for selector PointerEvents

        target          = null, // current interactable being interacted with
        dropTarget      = null, // the dropzone a drag target might be dropped into
        dropElement     = null, // the element at the time of checking
        prevDropTarget  = null, // the dropzone that was recently dragged away from
        prevDropElement = null, // the element at the time of checking

        defaultOptions = {
            draggable   : false,
            dropzone    : false,
            accept      : null,
            resizable  : false,
            squareResize: false,
            gesturable : false,

            styleCursor : true,

            // aww snap
            snap: {
                mode        : 'grid',
                endOnly     : false,
                actions     : ['drag'],
                range       : Infinity,
                grid        : { x: 100, y: 100 },
                gridOffset  : { x:   0, y:   0 },
                anchors     : [],
                paths       : [],

                arrayTypes  : /^anchors$|^paths$|^actions$/,
                objectTypes : /^grid$|^gridOffset$/,
                stringTypes : /^mode$/,
                numberTypes : /^range$/,
                boolTypes   :  /^endOnly$/
            },
            snapEnabled : false,

            restrict: {
                drag: null,
                resize: null,
                gesture: null,
                endOnly: false
            },
            restrictEnabled: true,

            autoScroll: {
                container   : window,  // the item that is scrolled (Window or HTMLElement)
                margin      : 60,
                speed       : 300,      // the scroll speed in pixels per second

                numberTypes : /^margin$|^speed$/
            },
            autoScrollEnabled: false,

            inertia: {
                resistance : 10,    // the lambda in exponential decay
                minSpeed   : 100,   // target speed must be above this for inertia to start
                endSpeed   : 10,    // the speed at which inertia is slow enough to stop
                actions    : ['drag', 'resize'],

                numberTypes: /^resistance$|^minSpeed$|^endSpeed$/,
                arrayTypes : /^actions$/
            },
            inertiaEnabled: false,

            origin      : { x: 0, y: 0 },
            deltaSource : 'page'
        },

        snapStatus = {
            locked : false,
            x      : 0,
            y      : 0,
            dx     : 0,
            dy     : 0,
            realX  : 0,
            realY  : 0,
            anchors: [],
            paths  : []
        },

        restrictStatus = {
            dx: 0,
            dy: 0,
            restricted: false
        },

        // Things related to autoScroll
        autoScroll = {
            target: null,
            i: null,    // the handle returned by window.setInterval
            x: 0,       // Direction each pulse is to scroll in
            y: 0,

            // scroll the window by the values in scroll.x/y
            scroll: function () {
                var options = autoScroll.target.options.autoScroll,
                    container = options.container,
                    now = new Date().getTime(),
                    // change in time in seconds
                    dt = (now - autoScroll.prevTime) / 1000,
                    // displacement
                    s = options.speed * dt;

                if (s >= 1) {
                    if (container instanceof window.Window) {
                        container.scrollBy(autoScroll.x * s, autoScroll.y * s);
                    }
                    else if (container) {
                        container.scrollLeft += autoScroll.x * s;
                        container.scrollTop  += autoScroll.y * s;
                    }

                    autoScroll.prevTime = now;
                }

                if (autoScroll.isScrolling) {
                    cancelFrame(autoScroll.i);
                    autoScroll.i = reqFrame(autoScroll.scroll);
                }
            },

            edgeMove: function (event) {
                if (target && target.options.autoScrollEnabled && (dragging || resizing)) {
                    var top,
                        right,
                        bottom,
                        left,
                        options = target.options.autoScroll;

                    if (options.container instanceof window.Window) {
                        left   = event.clientX < autoScroll.margin;
                        top    = event.clientY < autoScroll.margin;
                        right  = event.clientX > options.container.innerWidth  - autoScroll.margin;
                        bottom = event.clientY > options.container.innerHeight - autoScroll.margin;
                    }
                    else {
                        var rect = getElementRect(options.container);

                        left   = event.clientX < rect.left   + autoScroll.margin;
                        top    = event.clientY < rect.top    + autoScroll.margin;
                        right  = event.clientX > rect.right  - autoScroll.margin;
                        bottom = event.clientY > rect.bottom - autoScroll.margin;
                    }

                    autoScroll.x = (right ? 1: left? -1: 0);
                    autoScroll.y = (bottom? 1:  top? -1: 0);

                    if (!autoScroll.isScrolling) {
                        // set the autoScroll properties to those of the target
                        autoScroll.margin = options.margin;
                        autoScroll.speed  = options.speed;

                        autoScroll.start(target);
                    }
                }
            },

            isScrolling: false,
            prevTime: 0,

            start: function (target) {
                autoScroll.isScrolling = true;
                cancelFrame(autoScroll.i);

                autoScroll.target = target;
                autoScroll.prevTime = new Date().getTime();
                autoScroll.i = reqFrame(autoScroll.scroll);
            },

            stop: function () {
                autoScroll.isScrolling = false;
                cancelFrame(autoScroll.i);
            }
        },

        // Does the browser support touch input?
        supportsTouch = 'createTouch' in document,

        // Less Precision with touch input
        margin = supportsTouch? 20: 10,

        pointerIsDown   = false,
        pointerWasMoved = false,
        gesturing       = false,
        dragging        = false,
        dynamicDrop     = false,
        resizing        = false,
        resizeAxes      = 'xy',

        // What to do depending on action returned by getAction() of interactable
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

        // because Webkit and Opera still use 'mousewheel' event type
        wheelEvent = 'onmousewheel' in document? 'mousewheel': 'wheel',

        eventTypes = [
            'dragstart',
            'dragmove',
            'draginertiastart',
            'dragend',
            'dragenter',
            'dragleave',
            'drop',
            'resizestart',
            'resizemove',
            'resizeinertiastart',
            'resizeend',
            'gesturestart',
            'gesturemove',
            'gestureinertiastart',
            'gestureend',

            'tap',
            'doubletap'
        ],

        globalEvents = {},

        fireStates = {
            directBind: 0,
            onevent   : 1,
            globalBind: 2
        },

        // Opera Mobile must be handled differently
        isOperaMobile = navigator.appName == 'Opera' &&
            supportsTouch &&
            navigator.userAgent.match('Presto'),

        // prefix matchesSelector
        matchesSelector = 'matchesSelector' in Element.prototype?
                'matchesSelector': 'webkitMatchesSelector' in Element.prototype?
                    'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype?
                        'mozMatchesSelector': 'oMatchesSelector' in Element.prototype?
                            'oMatchesSelector': 'msMatchesSelector',

        // will be polyfill function if browser is IE8
        IE8MatchesSelector,

        // native requestAnimationFrame or polyfill
        reqFrame = window.requestAnimationFrame,
        cancelFrame = window.cancelAnimationFrame,

        // used for adding event listeners to window and document
        windowTarget = {
            _element: window,
            events  : {}
        },
        docTarget = {
            _element: document,
            events  : {}
        },
        parentWindowTarget = {
            _element: window.parent,
            events  : {}
        },
        parentDocTarget = {
            _element: null,
            events  : {}
        },

        // Events wrapper
        events = (function () {
            var Event = window.Event,
                useAttachEvent = 'attachEvent' in window && !('addEventListener' in window),
                addEvent = !useAttachEvent?  'addEventListener': 'attachEvent',
                removeEvent = !useAttachEvent?  'removeEventListener': 'detachEvent',
                on = useAttachEvent? 'on': '',

                elements          = [],
                targets           = [],
                attachedListeners = [];

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
                /* jshint -W001 */ // ignore warning about setting IE8 Event#hasOwnProperty
                Event.prototype.hasOwnProperty = Object.prototype.hasOwnProperty;
            }

            function add (element, type, listener, useCapture) {
                var elementIndex = elements.indexOf(element),
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
                            wrapped:  [],
                            useCount: []
                        } : null));
                }

                if (!target.events[type]) {
                    target.events[type] = [];
                    target.typeCount++;
                }

                if (target.events[type].indexOf(listener) === -1) {
                    var ret;

                    if (useAttachEvent) {
                        var listeners = attachedListeners[elementIndex],
                            listenerIndex = listeners.supplied.indexOf(listener);

                        var wrapped = listeners.wrapped[listenerIndex] || function (event) {
                            if (!event.immediatePropagationStopped) {
                                event.target = event.srcElement;
                                event.currentTarget = element;

                                if (/mouse|click/.test(event.type)) {
                                    event.pageX = event.clientX + document.documentElement.scrollLeft;
                                    event.pageY = event.clientY + document.documentElement.scrollTop;
                                }

                                listener(event);
                            }
                        };

                        ret = element[addEvent](on + type, wrapped, Boolean(useCapture));

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
                        ret = element[addEvent](type, listener, useCapture || false);
                    }
                    target.events[type].push(listener);

                    return ret;
                }
            }

            function remove (element, type, listener, useCapture) {
                var i,
                    elementIndex = elements.indexOf(element),
                    target = targets[elementIndex],
                    listeners,
                    listenerIndex,
                    wrapped = listener;

                if (!target || !target.events) {
                    return;
                }

                if (useAttachEvent) {
                    listeners = attachedListeners[elementIndex];
                    listenerIndex = listeners.supplied.indexOf(listener);
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
                            remove(element, type, target.events[type][i], Boolean(useCapture));
                        }
                    } else {
                        for (i = 0; i < len; i++) {
                            if (target.events[type][i] === listener) {
                                element[removeEvent](on + type, wrapped, useCapture || false);
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
                    targets.splice(elementIndex);
                    elements.splice(elementIndex);
                    attachedListeners.splice(elementIndex);
                }
            }

            return {
                add: function (target, type, listener, useCapture) {
                    add(target._element, type, listener, useCapture);
                },
                remove: function (target, type, listener, useCapture) {
                    remove(target._element, type, listener, useCapture);
                },
                addToElement: add,
                removeFromElement: remove,
                useAttachEvent: useAttachEvent
            };
        }());

    function blank () {}

    function isElement (o) {
        return !!o && (
            typeof Element === "object" ? o instanceof Element : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
        );
    }

    function setEventXY (targetObj, source) {
        getPageXY(source, tmpXY);
        targetObj.pageX = tmpXY.x;
        targetObj.pageY = tmpXY.y;

        getClientXY(source, tmpXY);
        targetObj.clientX = tmpXY.x;
        targetObj.clientY = tmpXY.y;

        targetObj.timeStamp = new Date().getTime();
    }

    function setEventDeltas (targetObj, prev, cur) {
        targetObj.pageX     = cur.pageX      - prev.pageX;
        targetObj.pageY     = cur.pageY      - prev.pageY;
        targetObj.clientX   = cur.clientX    - prev.clientX;
        targetObj.clientY   = cur.clientY    - prev.clientY;
        targetObj.timeStamp = new Date().getTime() - prev.timeStamp;

        // set pointer velocity
        var dt = Math.max(targetObj.timeStamp / 1000, 0.001);
        targetObj.pageSpeed   = hypot(targetObj.pageX, targetObj.pageY) / dt;
        targetObj.pageVX      = targetObj.pageX / dt;
        targetObj.pageVY      = targetObj.pageY / dt;

        targetObj.clientSpeed = hypot(targetObj.clientX, targetObj.pageY) / dt;
        targetObj.clientVX      = targetObj.clientX / dt;
        targetObj.clientVY      = targetObj.clientY / dt;
    }

    // Get specified X/Y coords for mouse or event.touches[0]
    function getXY (type, event, xy) {
        var touch,
            x,
            y;

        xy = xy || {};
        type = type || 'page';

        if (/touch/.test(event.type) && event.touches) {
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

        xy.x = x;
        xy.y = y;

        return xy;
    }

    function getPageXY (event, page) {
        page = page || {};

        if (event instanceof InteractEvent) {
            if (/inertiastart/.test(event.type)) {
                getPageXY(inertiaStatus.pointerUp, page);

                page.x += inertiaStatus.sx;
                page.y += inertiaStatus.sy;
            }
            else {
                page.x = event.pageX;
                page.y = event.pageY;
            }
        }
        // Opera Mobile handles the viewport and scrolling oddly
        else if (isOperaMobile) {
            getXY('screen', event, page);

            page.x += window.scrollX;
            page.y += window.scrollY;
        }
        // MSGesture events don't have pageX/Y
        else if (/gesture|inertia/i.test(event.type)) {
            getXY('client', event, page);

            page.x += document.documentElement.scrollLeft;
            page.y += document.documentElement.scrollTop;
        }
        else {
            getXY('page', event, page);
        }

        return page;
    }

    function getClientXY (event, client) {
        client = client || {};

        if (event instanceof InteractEvent) {
            if (/inertiastart/.test(event.type)) {
                getClientXY(inertiaStatus.pointerUp, client);

                client.x += inertiaStatus.sx;
                client.y += inertiaStatus.sy;
            }
            else {
                client.x = event.clientX;
                client.y = event.clientY;
            }
        }
        else {
            // Opera Mobile handles the viewport and scrolling oddly
            getXY(isOperaMobile? 'screen': 'client', event, client);
        }

        return client;
    }

    function getScrollXY () {
        return {
            x: window.scrollX || document.documentElement.scrollLeft,
            y: window.scrollY || document.documentElement.scrollTop
        };
    }

    function getElementRect (element) {
        var scroll = /ipad|iphone|ipod/i.test(navigator.userAgent)
                ? { x: 0, y: 0 }
                : getScrollXY(),
            clientRect = (element instanceof SVGElement)?
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
    }

    function getTouchPair (event) {
        var touches = [];

        if (event instanceof Array) {
            touches[0] = event[0];
            touches[1] = event[1];
        }
        else if (PointerEvent) {
            touches[0] = pointerMoves[0];
            touches[1] = pointerMoves[1];
        }
        else {
            touches[0] = event.touches[0];

            if (event.type === 'touchend' && event.touches.length === 1) {
                touches[1] = event.changedTouches[0];
            }
            else {
                touches[1] = event.touches[1];
            }
        }

        return touches;
    }

    function touchAverage (event) {
        var touches = getTouchPair(event);

        return {
            pageX: (touches[0].pageX + touches[1].pageX) / 2,
            pageY: (touches[0].pageY + touches[1].pageY) / 2,
            clientX: (touches[0].clientX + touches[1].clientX) / 2,
            clientY: (touches[0].clientY + touches[1].clientY) / 2,
        };
    }

    function touchBBox (event) {
        if (!(event.touches && event.touches.length) && !(PointerEvent && pointerMoves.length)) {
            return;
        }

        var touches = getTouchPair(event),
            minX = Math.min(touches[0].pageX, touches[1].pageX),
            minY = Math.min(touches[0].pageY, touches[1].pageY),
            maxX = Math.max(touches[0].pageX, touches[1].pageX),
            maxY = Math.max(touches[0].pageY, touches[1].pageY);

        return {
            x: minX,
            y: minY,
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    function touchDistance (event) {
        var deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            touches = getTouchPair(event);


        var dx = touches[0][sourceX] - touches[1][sourceX],
            dy = touches[0][sourceY] - touches[1][sourceY];

        return hypot(dx, dy);
    }

    function touchAngle (event, prevAngle) {
        var deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            touches = getTouchPair(event),
            dx = touches[0][sourceX] - touches[1][sourceX],
            dy = touches[0][sourceY] - touches[1][sourceY],
            angle = 180 * Math.atan(dy / dx) / Math.PI;

        if (typeof prevAngle === 'number') {
            var dr = angle - prevAngle,
                drClamped = dr % 360;

            if (drClamped > 315) {
                angle -= 360 + (angle / 360)|0 * 360;
            }
            else if (drClamped > 135) {
                angle -= 180 + (angle / 360)|0 * 360;
            }
            else if (drClamped < -315) {
                angle += 360 + (angle / 360)|0 * 360;
            }
            else if (drClamped < -135) {
                angle += 180 + (angle / 360)|0 * 360;
            }
        }

        return  angle;
    }

    function getOriginXY (interactable, element) {
        interactable = interactable || target;

        var origin = interactable
                ? interactable.options.origin
                : defaultOptions.origin;

        element = element || interactable._element;

        if (origin === 'parent') {
            origin = element.parentNode;
        }
        else if (origin === 'self') {
            origin = element;
        }

        if (isElement(origin))  {
            origin = getElementRect(origin);

            origin.x = origin.left;
            origin.y = origin.top;
        }
        else if (typeof origin === 'function') {
            origin = origin(interactable && element);
        }

        return origin;
    }

    function calcRects (interactableList) {
        for (var i = 0, len = interactableList.length; i < len; i++) {
            interactableList[i].rect = interactableList[i].getRect();
        }
    }

    function inertiaFrame () {
        var options = inertiaStatus.target.options.inertia,
            lambda = options.resistance,
            t = new Date().getTime() / 1000 - inertiaStatus.t0;

        if (t < inertiaStatus.te) {

            var progress =  1 - (Math.exp(-lambda * t) - inertiaStatus.lambda_v0) / inertiaStatus.one_ve_v0;

            if (inertiaStatus.modifiedXe === inertiaStatus.xe && inertiaStatus.modifiedYe === inertiaStatus.ye) {
                inertiaStatus.sx = inertiaStatus.xe * progress;
                inertiaStatus.sy = inertiaStatus.ye * progress;
            }
            else {
                var quadPoint = getQuadraticCurvePoint(
                        0, 0,
                        inertiaStatus.xe, inertiaStatus.ye,
                        inertiaStatus.modifiedXe, inertiaStatus.modifiedYe,
                        progress);

                inertiaStatus.sx = quadPoint.x;
                inertiaStatus.sy = quadPoint.y;
            }

            pointerMove(inertiaStatus.startEvent);

            inertiaStatus.i = reqFrame(inertiaFrame);
        }
        else {
            inertiaStatus.sx = inertiaStatus.modifiedXe;
            inertiaStatus.sy = inertiaStatus.modifiedYe;

            inertiaStatus.active = false;

            pointerMove(inertiaStatus.startEvent);
            pointerUp(inertiaStatus.startEvent);
        }
    }

    function _getQBezierValue(t, p1, p2, p3) {
        var iT = 1 - t;
        return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
    }

    function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
        return {
            x:  _getQBezierValue(position, startX, cpX, endX),
            y:  _getQBezierValue(position, startY, cpY, endY)
        };
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

    function getDrop (event, element) {
        if (dropzones.length || selectorDZs.length) {
            var i,
                drops = [],
                elements = [],
                selectorDrops = [],
                selectorElements = [],
                drop,
                dropzone;

            element = element || target._element;

            // collect all element dropzones that qualify for a drop
            for (i = 0; i < dropzones.length; i++) {
                var current = dropzones[i];

                // if the dropzone has an accept option, test against it
                if (isElement(current.options.accept)) {
                    if (current.options.accept !== element) {
                        continue;
                    }
                }
                else if (typeof current.options.accept === 'string') {
                    if (!element[matchesSelector](current.options.accept)) {
                        continue;
                    }
                }

                if (element !== current._element && current.dropCheck(event, target, element)) {
                    drops.push(current);
                    elements.push(current._element);
                }
            }

            // get the most apprpriate dropzone based on DOM depth and order
            drop = resolveDrops(elements);
            dropzone = drop? drops[drop.index]: null;

            if (selectorDZs.length) {
                for (i = 0; i < selectorDZs.length; i++) {
                    var selector = selectorDZs[i],
                        nodeList = document.querySelectorAll(selector.selector);

                    for (var j = 0, len = nodeList.length; j < len; j++) {
                        selector._element = nodeList[j];
                        selector.rect = selector.getRect();

                        // if the dropzone has an accept option, test against it
                        if (isElement(selector.options.accept)) {
                            if (selector.options.accept !== element) {
                                continue;
                            }
                        }
                        else if (typeof selector.options.accept === 'string') {
                            if (!element[matchesSelector](selector.options.accept)) {
                                continue;
                            }
                        }

                        if (selector._element !== element
                            && elements.indexOf(selector._element) === -1
                            && selectorElements.indexOf(selector._element === -1)
                            && selector.dropCheck(event, target)) {

                            selectorDrops.push(selector);
                            selectorElements.push(selector._element);
                        }
                    }
                }

                if (selectorElements.length) {
                    if (dropzone) {
                        selectorDrops.push(dropzone);
                        selectorElements.push(dropzone._element);
                    }

                    drop = resolveDrops(selectorElements);

                    if (drop) {
                        dropzone = selectorDrops[drop.index];

                        if (dropzone.selector) {
                            dropzone._element = selectorElements[drop.index];
                        }
                    }
                }
            }

            return dropzone? {
                dropzone: dropzone,
                element: dropzone._element
            }: null;
        }
    }

    function InteractEvent (event, action, phase, element, related) {
        var client,
            page,
            deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            options = target? target.options: defaultOptions,
            origin = getOriginXY(target, element);

        element = element || target._element;

        if (action === 'gesture' && !PointerEvent) {
            var average = touchAverage(event);

            page   = { x: (average.pageX   - origin.x), y: (average.pageY   - origin.y) };
            client = { x: (average.clientX - origin.x), y: (average.clientY - origin.y) };
        }
        else {

            page   = getPageXY(event);
            client = getClientXY(event);

            page.x -= origin.x;
            page.y -= origin.y;

            client.x -= origin.x;
            client.y -= origin.y;

            if (options.snapEnabled && options.snap.actions.indexOf(action) !== -1) {

                this.snap = {
                    range  : snapStatus.range,
                    locked : snapStatus.locked,
                    x      : snapStatus.x,
                    y      : snapStatus.y,
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
        }

        if (target.options.restrict[action] && restrictStatus.restricted) {
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

        if (phase === 'start' && !(event instanceof InteractEvent)) {
            setEventXY(startCoords, this);
        }

        this.x0        = startCoords.pageX;
        this.y0        = startCoords.pageY;
        this.clientX0  = startCoords.clientX;
        this.clientY0  = startCoords.clientY;
        this.ctrlKey   = event.ctrlKey;
        this.altKey    = event.altKey;
        this.shiftKey  = event.shiftKey;
        this.metaKey   = event.metaKey;
        this.button    = event.button;
        this.target    = element;
        this.t0        = downTime;
        this.type      = action + (phase || '');

        if (inertiaStatus.active) {
            this.detail = 'inertia';
        }

        if (related) {
            this.relatedTarget = related;
        }

        // end event dx, dy is difference between start and end points
        if (phase === 'end' || action === 'drop') {
            if (deltaSource === 'client') {
                this.dx = client.x - startCoords.clientX;
                this.dy = client.y - startCoords.clientY;
            }
            else {
                this.dx = page.x - startCoords.pageX;
                this.dy = page.y - startCoords.pageY;
            }
        }
        // copy properties from previousmove if starting inertia
        else if (phase === 'inertiastart') {
            this.dx = prevEvent.dx;
            this.dy = prevEvent.dy;
        }
        else {
            if (deltaSource === 'client') {
                this.dx = client.x - prevEvent.clientX;
                this.dy = client.y - prevEvent.clientY;
            }
            else {
                this.dx = page.x - prevEvent.pageX;
                this.dy = page.y - prevEvent.pageY;
            }
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
            this.touches = (PointerEvent
                            ? [pointerMoves[0], pointerMoves[1]]
                            : event.touches);

            if (phase === 'start') {
                this.distance = touchDistance(event);
                this.box      = touchBBox(event);
                this.scale    = 1;
                this.ds       = 0;
                this.angle    = touchAngle(event);
                this.da       = 0;
            }
            else if (phase === 'end' || event instanceof InteractEvent) {
                this.distance = prevEvent.distance;
                this.box      = prevEvent.box;
                this.scale    = prevEvent.scale;
                this.ds       = this.scale - 1;
                this.angle    = prevEvent.angle;
                this.da       = this.angle - gesture.startAngle;
            }
            else {
                this.distance = touchDistance(event);
                this.box      = touchBBox(event);
                this.scale    = this.distance / gesture.startDistance;
                this.angle    = touchAngle(event, gesture.prevAngle);

                this.ds = this.scale - gesture.prevScale;
                this.da = this.angle - gesture.prevAngle;
            }
        }

        if (phase === 'start') {
            this.timeStamp = downTime;
            this.dt        = 0;
            this.duration  = 0;
            this.speed     = 0;
            this.velocityX = 0;
            this.velocityY = 0;
        }
        else if (phase === 'inertiastart') {
            this.timeStamp = new Date().getTime();
            this.dt        = prevEvent.dt;
            this.duration  = prevEvent.duration;
            this.speed     = prevEvent.speed;
            this.velocityX = prevEvent.velocityX;
            this.velocityY = prevEvent.velocityY;
        }
        else {
            this.timeStamp = new Date().getTime();
            this.dt        = this.timeStamp - prevEvent.timeStamp;
            this.duration  = this.timeStamp - downTime;

            var dx, dy, dt;

            // Use natural event coordinates (without snapping/restricions)
            // subtract modifications from previous event if event given is
            // not a native event
            if (phase === 'end' || event instanceof InteractEvent) {
                // change in time in seconds
                // use event sequence duration for end events
                // => average speed of the event sequence
                // (minimum dt of 1ms)
                dt = Math.max((phase === 'end'? this.duration: this.dt) / 1000, 0.001);
                dx = this[sourceX] - prevEvent[sourceX];
                dy = this[sourceY] - prevEvent[sourceY];

                if (this.snap && this.snap.locked) {
                    dx -= this.snap.dx;
                    dy -= this.snap.dy;
                }

                if (this.restrict) {
                    dx -= this.restrict.dx;
                    dy -= this.restrict.dy;
                }

                if (prevEvent.snap && prevEvent.snap.locked) {
                    dx -= (prevEvent[sourceX] - prevEvent.snap.dx);
                    dy -= (prevEvent[sourceY] - prevEvent.snap.dy);
                }

                if (prevEvent.restrict) {
                    dx += prevEvent.restrict.dx;
                    dy += prevEvent.restrict.dy;
                }

                // speed and velocity in pixels per second
                this.speed = hypot(dx, dy) / dt;
                this.velocityX = dx / dt;
                this.velocityY = dy / dt;
            }
            // if normal move event, use previous user event coords
            else {
                this.speed = pointerDelta[deltaSource + 'Speed'];
                this.velocityX = pointerDelta[deltaSource + 'VX'];
                this.velocityY = pointerDelta[deltaSource + 'VY'];
            }
        }
    }

    InteractEvent.prototype = {
        preventDefault: blank,
        stopImmediatePropagation: function () {
            this.immediatePropagationStopped = this.propagationStopped = true;
        },
        stopPropagation: function () {
            this.propagationStopped = true;
        }
    };

    function fireTaps (event, targets, elements) {
        var tap = {},
            prop, i;

        for (prop in event) {
            tap[prop] = event[prop];
        }

        tap.preventDefault = function () {
            this.originalEvent.preventDefault();
        };
        tap.stopPropagation = InteractEvent.prototype.stopPropagation;
        tap.stopImmediatePropagation = InteractEvent.prototype.stopImmediatePropagation;

        tap.timeStamp = new Date().getTime();
        tap.originalEvent = event;
        tap.dt = tap.timeStamp - downTime;
        tap.type = 'tap';

        var interval = tap.timeStamp - tapTime,
            dbl = (prevTap && prevTap.type !== 'dubletap'
                   && prevTap.target === tap.target
                   && interval < 500);

        tapTime = tap.timeStamp;

        for (i = 0; i < targets.length; i++) {
            tap.currentTarget = elements[i];
            targets[i].fire(tap);

            if (tap.immediatePropagationStopped
                ||(tap.propagationStopped && targets[i + 1] !== tap.currentTarget)) {
                break;
            }
        }

        if (dbl) {
            var doubleTap = {};

            for (prop in tap) {
                doubleTap[prop] = tap[prop];
            }

            doubleTap.dt = interval;
            doubleTap.type = 'doubletap';

            for (i = 0; i < targets.length; i++) {
                doubleTap.currentTarget = elements[i];
                targets[i].fire(doubleTap);

                if (doubleTap.immediatePropagationStopped
                    ||(doubleTap.propagationStopped && targets[i + 1] !== doubleTap.currentTarget)) {
                    break;
                }
            }

            prevTap = doubleTap;
        }
        else {
            prevTap = tap;
        }
    }

    function collectTaps (event) {
        if (pointerWasMoved
            || !(event instanceof downEvent.constructor)
            || downEvent.target !== event.target) {
            return;
        }

        var tapTargets = [],
            tapElements = [];

        var element = event.target;

        while (element) {
            if (interact.isSet(element)) {
                tapTargets.push(interact(element));
                tapElements.push(element);
            }

            for (var selector in selectors) {
                var elements = Element.prototype[matchesSelector] === IE8MatchesSelector
                        ? document.querySelectorAll(selector)
                        : undefined;

                if (element !== document && element[matchesSelector](selector, elements)) {
                    tapTargets.push(selectors[selector]);
                    tapElements.push(element);
                }
            }

            element = element.parentNode;
        }

        fireTaps(event, tapTargets, tapElements);
    }

    // Check if action is enabled globally and the current target supports it
    // If so, return the validated action. Otherwise, return null
    function validateAction (action, interactable) {
        if (typeof action !== 'string') { return null; }

        interactable = interactable || target;

        var actionType = action.indexOf('resize') !== -1? 'resize': action,
            options = (interactable || target).options;

        if ((  (actionType  === 'resize'   && options.resizable )
            || (action      === 'drag'     && options.draggable  )
            || (action      === 'gesture'  && options.gesturable))
            && actionIsEnabled[actionType]) {

            if (action === 'resize' || action === 'resizeyx') {
                action = 'resizexy';
            }

            return action;
        }
        return null;
    }

    function selectorDown (event) {
        if (prepared && downEvent && event.type !== downEvent.type) {
            if (!(/^input$|^textarea$/i.test(target._element.nodeName))) {
                event.preventDefault();
            }
            return;
        }

        // try to ignore browser simulated mouse after touch
        if (downEvent
            && event.type === 'mousedown' && downEvent.type === 'touchstart'
            && event.timeStamp - downEvent.timeStamp < 300) {
            return;
        }

        var element = (event.target instanceof SVGElementInstance
            ? event.target.correspondingUseElement
            : event.target),
            action;

        if (PointerEvent) {
            addPointer(event);
        }

        // Check if the down event hits the current inertia target
        if (inertiaStatus.active && target.selector) {
            // climb up the DOM tree from the event target
            while (element && element !== document) {

                // if this element is the current inertia target element
                if (element === inertiaStatus.targetElement
                    // and the prospective action is the same as the ongoing one
                    && validateAction(target.getAction(event)) === prepared) {

                    // stop inertia so that the next move will be a normal one
                    cancelFrame(inertiaStatus.i);
                    inertiaStatus.active = false;

                    if (PointerEvent) {
                        // add the pointer to the gesture object
                        addPointer(event, selectorGesture);
                    }

                    return;
                }
                element = element.parentNode;
            }
        }

        // do nothing if interacting
        if (dragging || resizing || gesturing) {
            return;
        }

        if (matches.length && /mousedown|pointerdown/i.test(event.type)) {
            action = validateSelector(event, matches);
        }
        else {
            var selector,
                elements;

            while (element && element !== document && !action) {
                matches = [];

                for (selector in selectors) {
                    elements = Element.prototype[matchesSelector] === IE8MatchesSelector?
                        document.querySelectorAll(selector): undefined;

                    if (element[matchesSelector](selector, elements)) {
                        selectors[selector]._element = element;
                        matches.push(selectors[selector]);
                    }
                }

                action = validateSelector(event, matches);
                element = element.parentNode;
            }
        }

        if (action) {
            pointerIsDown = true;
            prepared = action;

            return pointerDown(event, action);
        }
        else {
            // do these now since pointerDown isn't being called from here
            downTime = new Date().getTime();
            downEvent = event;
            setEventXY(prevCoords, event);
            pointerWasMoved = false;
        }
    }

    // Determine action to be performed on next pointerMove and add appropriate
    // style and event Liseners
    function pointerDown (event, forceAction) {
        if (!forceAction && pointerIsDown && downEvent && event.type !== downEvent.type) {
            if (!(/^input$|^textarea$/i.test(target._element.nodeName))) {
                event.preventDefault();
            }
            return;
        }

        pointerIsDown = true;

        if (PointerEvent) {
            addPointer(event);
        }

        // If it is the second touch of a multi-touch gesture, keep the target
        // the same if a target was set by the first touch
        // Otherwise, set the target if there is no action prepared
        if ((((event.touches && event.touches.length < 2) || (pointerIds && pointerIds.length < 2)) && !target)
            || !prepared) {

            target = interactables.get(event.currentTarget);
        }

        var options = target && target.options;

        if (target && !(dragging || resizing || gesturing)) {
            var action = validateAction(forceAction || target.getAction(event));

            setEventXY(startCoords, event);

            if (PointerEvent && event instanceof PointerEvent) {
                // Dom modification seems to reset the gesture target
                if (!target._gesture.target) {
                    target._gesture.target = target._element;
                }

                addPointer(event, target._gesture);
            }

            if (!action) {
                return event;
            }

            pointerWasMoved = false;

            if (options.styleCursor) {
                document.documentElement.style.cursor = actions[action].cursor;
            }

            resizeAxes = action === 'resizexy'?
                    'xy':
                    action === 'resizex'?
                        'x':
                        action === 'resizey'?
                            'y':
                            '';

            if (action === 'gesture'
                && ((event.touches && event.touches.length < 2)
                    || PointerEvent && pointerIds.length < 2)) {
                        action = null;
            }

            prepared = action;

            snapStatus.x = null;
            snapStatus.y = null;

            downTime = new Date().getTime();
            downEvent = event;
            setEventXY(prevCoords, event);
            pointerWasMoved = false;

            if (!(/^input$|^textarea$/i.test(target._element.nodeName))) {
                event.preventDefault();
            }
        }
        // if inertia is active try to resume action
        else if (inertiaStatus.active
            && event.currentTarget === inertiaStatus.targetElement
            && target === inertiaStatus.target
            && validateAction(target.getAction(event)) === prepared) {

            cancelFrame(inertiaStatus.i);
            inertiaStatus.active = false;

            if (PointerEvent) {
                if (!target._gesture.target) {
                    target._gesture.target = target._element;
                }
                // add the pointer to the gesture object
                addPointer(event, target._gesture);
            }
        }
    }

    function setSnapping (event, status) {
        var snap = target.options.snap,
            anchors = snap.anchors,
            page,
            closest,
            range,
            inRange,
            snapChanged,
            dx,
            dy,
            distance,
            i, len;

        status = status || snapStatus;

        if (status.useStatusXY) {
            page = { x: status.x, y: status.y };
        }
        else {
            var origin = getOriginXY(target);

            page = getPageXY(event);

            page.x -= origin.x;
            page.y -= origin.y;
        }

        status.realX = page.x;
        status.realY = page.y;

        // change to infinite range when range is negative
        if (snap.range < 0) { snap.range = Infinity; }

        // create an anchor representative for each path's returned point
        if (snap.mode === 'path') {
            anchors = [];

            for (i = 0, len = snap.paths.length; i < len; i++) {
                var path = snap.paths[i];

                if (typeof path === 'function') {
                    path = path(page.x, page.y);
                }

                anchors.push({
                    x: typeof path.x === 'number' ? path.x : page.x,
                    y: typeof path.y === 'number' ? path.y : page.y,

                    range: typeof path.range === 'number'? path.range: snap.range
                });
            }
        }

        if ((snap.mode === 'anchor' || snap.mode === 'path') && anchors.length) {
            closest = {
                anchor: null,
                distance: 0,
                range: 0,
                dx: 0,
                dy: 0
            };

            for (i = 0, len = anchors.length; i < len; i++) {
                var anchor = anchors[i];

                range = typeof anchor.range === 'number'? anchor.range: snap.range;

                dx = anchor.x - page.x;
                dy = anchor.y - page.y;
                distance = hypot(dx, dy);

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

                    closest.anchor = anchor;
                    closest.distance = distance;
                    closest.range = range;
                    closest.inRange = inRange;
                    closest.dx = dx;
                    closest.dy = dy;

                    status.range = range;
                }
            }

            inRange = closest.inRange;
            snapChanged = (closest.anchor.x !== status.x || closest.anchor.y !== status.y);

            status.x = closest.anchor.x;
            status.y = closest.anchor.y;
            status.dx = closest.dx;
            status.dy = closest.dy;
        }
        else if (snap.mode === 'grid') {
            var gridx = Math.round((page.x - snap.gridOffset.x) / snap.grid.x),
                gridy = Math.round((page.y - snap.gridOffset.y) / snap.grid.y),

                newX = gridx * snap.grid.x + snap.gridOffset.x,
                newY = gridy * snap.grid.y + snap.gridOffset.y;

            dx = newX - page.x;
            dy = newY - page.y;

            distance = hypot(dx, dy);

            inRange = distance < snap.range;
            snapChanged = (newX !== status.x || newY !== status.y);

            status.x = newX;
            status.y = newY;
            status.dx = dx;
            status.dy = dy;

            status.range = snap.range;
        }

        status.changed = (snapChanged || (inRange && !status.locked));
        status.locked = inRange;

        return status;
    }

    function setRestriction (event, status) {
        var action = interact.currentAction() || prepared,
            restriction = target && target.options.restrict[action],
            page;

        status = status || restrictStatus;

        if (status.useStatusXY) {
            page = { x: status.x, y: status.y };
        }
        else {
            var origin = getOriginXY(target);

            page = getPageXY(event);

            page.x -= origin.x;
            page.y -= origin.y;
        }

        status.dx = 0;
        status.dy = 0;
        status.restricted = false;

        if (!action || !restriction) {
            return;
        }

        var rect,
            originalPageX = page.x,
            originalPageY = page.y;

        if (restriction === 'parent') {
            restriction = target._element.parentNode;
        }
        else if (restriction === 'self') {
            restriction = target._element;
        }

        if (isElement(restriction)) {
            rect = getElementRect(restriction);
        }
        else {
            if (typeof restriction === 'function') {
                restriction = restriction(page.x, page.y, target._element);
            }

            rect = restriction;

            // object is assumed to have
            // x, y, width, height or
            // left, top, right, bottom
            if ('x' in restriction && 'y' in restriction) {
                rect = {
                    left  : restriction.x,
                    top   : restriction.y,
                    right : restriction.x + restriction.width,
                    bottom: restriction.y + restriction.height
                };
            }
        }

        status.dx = Math.max(Math.min(rect.right , page.x), rect.left) - originalPageX;
        status.dy = Math.max(Math.min(rect.bottom, page.y), rect.top ) - originalPageY;
        status.restricted = true;

        return status;
    }

    function pointerMove (event, preEnd) {
        if (!pointerIsDown) { return; }

        if (!(event instanceof InteractEvent)) {
            setEventXY(curCoords, event);
        }

        // register movement of more than 1 pixel
        if (!pointerWasMoved) {
            var dx = curCoords.clientX - prevCoords.clientX,
                dy = curCoords.clientY - prevCoords.clientY;

            pointerWasMoved = hypot(dx, dy) > 1;
        }

        // return if there is no prepared action
        if (!prepared
            // or this is a mousemove event but the down event was a touch
            || (event.type === 'mousemove' && downEvent.type === 'touchstart')) {

            return;
        }

        if (pointerWasMoved
            // ignore movement while inertia is active
            && (!inertiaStatus.active || (event instanceof InteractEvent && /inertiastart/.test(event.type)))) {

            // if just starting an action, calculate the pointer speed now
            if (!(dragging || resizing || gesturing)) {
                setEventDeltas(pointerDelta, prevCoords, curCoords);
            }

            if (prepared && target) {
                var shouldRestrict = target.options.restrictEnabled && (!target.options.restrict.endOnly || preEnd),
                    starting = !(dragging || resizing || gesturing),
                    snapEvent = starting? downEvent: event;

                if (starting) {
                    prevEvent = downEvent;
                }

                if (!shouldRestrict) {
                    restrictStatus.restricted = false;
                }

                // check for snap
                if (target.options.snapEnabled
                    && target.options.snap.actions.indexOf(prepared) !== -1
                    && (!target.options.snap.endOnly || preEnd)) {

                    setSnapping(snapEvent);

                    // move if snapping doesn't prevent it or a restriction is in place
                    if ((snapStatus.changed || !snapStatus.locked) || shouldRestrict) {

                        if (shouldRestrict) {
                            setRestriction(event);
                        }

                        actions[prepared].moveListener(event);
                    }
                }
                // if no snap, always move
                else {
                    if (shouldRestrict) {
                        setRestriction(event);
                    }

                    actions[prepared].moveListener(event);
                }
            }
        }

        if (!(event instanceof InteractEvent)) {
            // set pointer coordinate, time changes and speeds
            setEventDeltas(pointerDelta, prevCoords, curCoords);
            setEventXY(prevCoords, event);
        }

        if (dragging || resizing) {
            autoScroll.edgeMove(event);
        }
    }

    function addPointer (event, gesture) {
        // dont add the event if it's not the same pointer type as the previous event
        if (pointerMoves.length && pointerMoves[0].pointerType !== event.pointerType) {
            return;
        }

        if (gesture) {
            gesture.addPointer(event.pointerId);
        }

        var index = pointerIds.indexOf(event.pointerId);

        if (index === -1) {
            pointerIds.push(event.pointerId);
            pointerMoves.push(event);
        }
        else {
            pointerMoves[index] = event;
        }
    }

    function removePointer (event) {
        var index = pointerIds.indexOf(event.pointerId);

        if (index === -1) { return; }

        pointerIds.splice(index, 1);
        pointerMoves.splice(index, 1);
    }

    function recordPointers (event) {
        var index = pointerIds.indexOf(event.pointerId);

        if (index === -1) { return; }

        if (/move/i.test(event.type)) {
            pointerMoves[index] = event;
        }
        else if (/up|cancel/i.test(event.type)) {
            removePointer(event);

            // End the gesture InteractEvent if there are
            // fewer than 2 active pointers
            if (gesturing && pointerIds.length < 2) {
                target._gesture.stop();
            }
        }
    }

    function dragMove (event) {
        event.preventDefault();

        var dragEvent,
            dragEnterEvent,
            dragLeaveEvent,
            dropTarget,
            leaveDropTarget;

        if (!dragging) {
            dragEvent = new InteractEvent(downEvent, 'drag', 'start');
            dragging = true;

            target.fire(dragEvent);

            if (!dynamicDrop) {
                calcRects(dropzones);
                for (var i = 0; i < selectorDZs.length; i++) {
                    selectorDZs[i]._elements = document.querySelectorAll(selectorDZs[i].selector);
                }
            }

            prevEvent = dragEvent;

            // set snapping for the next move event
            if (target.options.snapEnabled && !target.options.snap.endOnly) {
                setSnapping(event);
            }
        }

        dragEvent  = new InteractEvent(event, 'drag', 'move');

        var draggableElement = target._element,
            drop = getDrop(dragEvent, draggableElement);

        if (drop) {
            dropTarget = drop.dropzone;
            dropElement = drop.element;
        }
        else {
            dropTarget = dropElement = null;
        }

        // Make sure that the target selector draggable's element is
        // restored after dropChecks
        target._element = draggableElement;

        if (dropElement !== prevDropElement) {
            // if there was a prevDropTarget, create a dragleave event
            if (prevDropTarget) {
                dragLeaveEvent = new InteractEvent(event, 'drag', 'leave', prevDropElement, draggableElement);

                dragEvent.dragLeave = prevDropElement;
                leaveDropTarget = prevDropTarget;
                prevDropTarget = prevDropElement = null;
            }
            // if the dropTarget is not null, create a dragenter event
            if (dropTarget) {
                dragEnterEvent      = new InteractEvent(event, 'drag', 'enter', dropElement, draggableElement);

                dragEvent.dragEnter = dropTarget._element;
                prevDropTarget      = dropTarget;
                prevDropElement     = prevDropTarget._element;
            }
        }

        target.fire(dragEvent);

        if (dragLeaveEvent) {
            leaveDropTarget.fire(dragLeaveEvent);
        }
        if (dragEnterEvent) {
            dropTarget.fire(dragEnterEvent);
        }

        prevEvent = dragEvent;
    }

    function resizeMove (event) {
        event.preventDefault();

        var resizeEvent;

        if (!resizing) {
            resizeEvent = new InteractEvent(downEvent, 'resize', 'start');
            target.fire(resizeEvent);

            target.fire(resizeEvent);
            resizing = true;

            prevEvent = resizeEvent;

            // set snapping for the next move event
            if (target.options.snapEnabled && !target.options.snap.endOnly) {
                setSnapping(event);
            }
        }

        resizeEvent = new InteractEvent(event, 'resize', 'move');
        target.fire(resizeEvent);

        prevEvent = resizeEvent;
    }

    function gestureMove (event) {
        if ((!event.touches || event.touches.length < 2) && !PointerEvent) {
            return;
        }

        event.preventDefault();

        var gestureEvent;

        if (!gesturing) {
            gestureEvent = new InteractEvent(downEvent, 'gesture', 'start');
            gestureEvent.ds = 0;

            gesture.startDistance = gesture.prevDistance = gestureEvent.distance;
            gesture.startAngle = gesture.prevAngle = gestureEvent.angle;
            gesture.scale = 1;

            gesturing = true;

            target.fire(gestureEvent);

            prevEvent = gestureEvent;

            // set snapping for the next move event
            if (target.options.snapEnabled && !target.options.snap.endOnly) {
                setSnapping(event);
            }
        }

        gestureEvent = new InteractEvent(event, 'gesture', 'move');
        gestureEvent.ds = gestureEvent.scale - gesture.scale;

        target.fire(gestureEvent);

        prevEvent = gestureEvent;

        gesture.prevAngle = gestureEvent.angle;
        gesture.prevDistance = gestureEvent.distance;

        if (gestureEvent.scale !== Infinity &&
            gestureEvent.scale !== null &&
            gestureEvent.scale !== undefined  &&
            !isNaN(gestureEvent.scale)) {

            gesture.scale = gestureEvent.scale;
        }
    }

    function validateSelector (event, matches) {
        for (var i = 0, len = matches.length; i < len; i++) {
            var match = matches[i],
                action = validateAction(match.getAction(event, match), match);

            if (action) {
                target = match;

                return action;
            }
        }
    }

    function pointerOver (event) {
        if (pointerIsDown || dragging || resizing || gesturing) { return; }

        var curMatches = [],
            prevTargetElement = target && target._element,
            eventTarget = (event.target instanceof SVGElementInstance
                ? event.target.correspondingUseElement
                : event.target);

        for (var selector in selectors) {
            if (selectors.hasOwnProperty(selector)
                && selectors[selector]
                && eventTarget[matchesSelector](selector)) {

                selectors[selector]._element = eventTarget;
                curMatches.push(selectors[selector]);
            }
        }

        var elementInteractable = interactables.get(eventTarget),
            elementAction = elementInteractable
                     && validateAction(
                         elementInteractable.getAction(event),
                         elementInteractable);

        if (elementAction) {
            target = elementInteractable;
            matches = [];
        }
        else {
            if (validateSelector(event, curMatches)) {
                matches = curMatches;

                pointerHover(event, matches);
                events.addToElement(eventTarget, 'mousemove', pointerHover);
            }
            else if (target) {
                var prevTargetChildren = prevTargetElement.querySelectorAll('*');

                if (Array.prototype.indexOf.call(prevTargetChildren, eventTarget) !== -1) {

                    // reset the elements of the matches to the old target
                    for (var i = 0; i < matches.length; i++) {
                        matches[i]._element = prevTargetElement;
                    }

                    pointerHover(event, matches);
                    events.addToElement(target._element, 'mousemove', pointerHover);
                }
                else {
                    target = null;
                    matches = [];
                }
            }
        }
    }

    function pointerOut (event) {
        if (pointerIsDown || dragging || resizing || gesturing) { return; }

        // Remove temporary event listeners for selector Interactables
        var eventTarget = (event.target instanceof SVGElementInstance
            ? event.target.correspondingUseElement
            : event.target);

        if (!interactables.get(eventTarget)) {
            events.removeFromElement(eventTarget, pointerHover);
        }

        if (target && target.options.styleCursor && !(dragging || resizing || gesturing)) {
            document.documentElement.style.cursor = '';
        }
    }

    // Check what action would be performed on pointerMove target if a mouse
    // button were pressed and change the cursor accordingly
    function pointerHover (event, matches) {
        if (!(pointerIsDown || dragging || resizing || gesturing)) {

            var action;

            if (matches) {
                action = validateSelector(event, matches);
            }
            else if (target) {
                action = validateAction(target.getAction(event));
            }

            if (target && target.options.styleCursor) {
                if (action) {
                    document.documentElement.style.cursor = actions[action].cursor;
                }
                else {
                    document.documentElement.style.cursor = '';
                }
            }
        }
        else {
            event.preventDefault();
        }
    }

    // End interact move events and stop auto-scroll unless inertia is enabled
    function pointerUp (event) {
        // don't return if the event is an InteractEvent (in the case of inertia end)
        // or if the browser uses PointerEvents (event would always be a gestureend)
        if (!(event instanceof InteractEvent || PointerEvent)
            && pointerIsDown && downEvent
            && !(event instanceof downEvent.constructor)) {

            return;
        }

        if (event.touches && event.touches.length >= 2) {
            return;
        }

        // Stop native GestureEvent inertia
        if (GestureEvent && (event instanceof GestureEvent) && /inertiastart/i.test(event.type)) {
            event.gestureObject.stop();
            return;
        }

        var endEvent,
            inertiaOptions = target && target.options.inertia,
            prop;

        if (dragging || resizing || gesturing) {

            if (inertiaStatus.active) { return; }

            var deltaSource =target.options.deltaSource,
                pointerSpeed = pointerDelta[deltaSource + 'Speed'];

            // check if inertia should be started
            if (target.options.inertiaEnabled
                && prepared !== 'gesture'
                && inertiaOptions.actions.indexOf(prepared) !== -1
                && event !== inertiaStatus.startEvent
                && (new Date().getTime() - curCoords.timeStamp) < 50
                && pointerSpeed > inertiaOptions.minSpeed
                && pointerSpeed > inertiaOptions.endSpeed) {


                var lambda = inertiaOptions.resistance,
                    inertiaDur = -Math.log(inertiaOptions.endSpeed / pointerSpeed) / lambda,
                    startEvent;

                inertiaStatus.active = true;
                inertiaStatus.target = target;
                inertiaStatus.targetElement = target._element;

                if (events.useAttachEvent) {
                    // make a copy of the pointerdown event because IE8
                    // http://stackoverflow.com/a/3533725/2280888
                    for (prop in event) {
                        if (event.hasOwnProperty(prop)) {
                            inertiaStatus.pointerUp[prop] = event[prop];
                        }
                    }
                }
                else {
                    inertiaStatus.pointerUp = event;
                }

                inertiaStatus.startEvent = startEvent = new InteractEvent(event, 'drag', 'inertiastart');

                inertiaStatus.vx0 = pointerDelta[deltaSource + 'VX'];
                inertiaStatus.vy0 = pointerDelta[deltaSource + 'VY'];
                inertiaStatus.v0 = pointerSpeed;
                inertiaStatus.x0 = prevEvent.pageX;
                inertiaStatus.y0 = prevEvent.pageY;
                inertiaStatus.t0 = inertiaStatus.startEvent.timeStamp / 1000;
                inertiaStatus.sx = inertiaStatus.sy = 0;

                inertiaStatus.modifiedXe = inertiaStatus.xe = (inertiaStatus.vx0 - inertiaDur) / lambda;
                inertiaStatus.modifiedYe = inertiaStatus.ye = (inertiaStatus.vy0 - inertiaDur) / lambda;
                inertiaStatus.te = inertiaDur;

                inertiaStatus.lambda_v0 = lambda / inertiaStatus.v0;
                inertiaStatus.one_ve_v0 = 1 - inertiaOptions.endSpeed / inertiaStatus.v0;

                var startX = startEvent.pageX,
                    startY = startEvent.pageY,
                    statusObject;

                if (startEvent.snap && startEvent.snap.locked) {
                    startX -= startEvent.snap.dx;
                    startY -= startEvent.snap.dy;
                }

                if (startEvent.restrict) {
                    startX -= startEvent.restrict.dx;
                    startY -= startEvent.restrict.dy;
                }

                statusObject = {
                    useStatusXY: true,
                    x: startX + inertiaStatus.xe,
                    y: startY + inertiaStatus.ye
                };

                if (target.options.snapEnabled && target.options.snap.endOnly) {
                    var snap = setSnapping(event, statusObject);

                    if (snap.locked) {
                        inertiaStatus.modifiedXe += snap.dx;
                        inertiaStatus.modifiedYe += snap.dy;
                    }
                }

                if (target.options.restrictEnabled && target.options.restrict.endOnly) {
                    var restrict = setRestriction(event, statusObject);

                    inertiaStatus.modifiedXe += restrict.dx;
                    inertiaStatus.modifiedYe += restrict.dy;
                }

                cancelFrame(inertiaStatus.i);
                inertiaStatus.i = reqFrame(inertiaFrame);

                target.fire(inertiaStatus.startEvent);

                return;
            }

            if ((target.options.snapEnabled && target.options.snap.endOnly)
                || (target.options.restrictEnabled && target.options.restrict.endOnly)) {
                // fire a move event at the snapped coordinates
                pointerMove(event, true);
            }
        }

        if (dragging) {
            endEvent = new InteractEvent(event, 'drag', 'end');

            var dropEvent,
                draggableElement = target._element,
                drop = getDrop(endEvent, draggableElement);

            if (drop) {
                dropTarget = drop.dropzone;
                dropElement = drop.element;
            }
            else {
                dropTarget = null;
                dropElement = null;
            }

            // getDrop changes target._element
            target._element = draggableElement;

            // get the most apprpriate dropzone based on DOM depth and order
            if (dropTarget) {
                dropEvent = new InteractEvent(event, 'drop', null, dropElement, draggableElement);

                endEvent.dropzone = dropElement;
            }

            // if there was a prevDropTarget (perhaps if for some reason this
            // dragend happens without the mouse moving of the previous drop
            // target)
            else if (prevDropTarget) {
                var dragLeaveEvent = new InteractEvent(event, 'drag', 'leave', dropElement, draggableElement);

                prevDropTarget.fire(dragLeaveEvent, draggableElement);

                endEvent.dragLeave = prevDropElement;
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
            target.fire(endEvent);
        }

        interact.stop();
    }

    // bound to document when a listener is added to a selector interactable
    function delegateListener (event, useCapture) {
        var fakeEvent = {},
            selectors = delegatedEvents[event.type],
            selector,
            element = event.target,
            i;

        useCapture = useCapture? true: false;

        // duplicate the event so that currentTarget can be changed
        for (var prop in event) {
            fakeEvent[prop] = event[prop];
        }

        fakeEvent.preventDefault = function () {
            event.preventDefault();
        };

        // climb up document tree looking for selector matches
        while (element && element !== document) {
            for (selector in selectors) {
                if (element[matchesSelector](selector)) {
                    var listeners = selectors[selector];

                    fakeEvent.currentTarget = element;

                    for (i = 0; i < listeners.length; i++) {
                        if (listeners[i][1] !== useCapture) { continue; }

                        try {
                            listeners[i][0](fakeEvent);
                        }
                        catch (error) {
                            console.error('Error thrown from delegated listener: ' +
                                          '"' + selector + '" ' + event.type + ' ' +
                                          (listeners[i][0].name? listeners[i][0].name: ''));
                            console.log(error);
                        }
                    }
                }
            }

            element = element.parentNode;
        }
    }

    function delegateUseCapture (event) {
        return delegateListener.call(this, event, true);
    }

    interactables.indexOfElement = dropzones.indexOfElement = function indexOfElement (element) {
        for (var i = 0; i < this.length; i++) {
            var interactable = this[i];

            if (interactable.selector === element
                || (!interactable.selector && interactable._element === element)) {
                return i;
            }
        }
        return -1;
    };

    interactables.get = function interactableGet (element) {
        if (typeof element === 'string') {
            return selectors[element];
        }

        return this[this.indexOfElement(element)];
    };

    dropzones.get = function dropzoneGet (element) {
        return this[this.indexOfElement(element)];
    };

    function clearTargets () {
        if (target && !target.selector) {
            target = null;
        }

        dropTarget = dropElement = prevDropTarget = prevDropElement = null;
    }

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
    function interact (element) {
        return interactables.get(element) || new Interactable(element);
    }

    // A class for easy inheritance and setting of an Interactable's options
    function IOptions (options) {
        for (var option in defaultOptions) {
            if (options.hasOwnProperty(option)
                && typeof options[option] === typeof defaultOptions[option]) {
                this[option] = options[option];
            }
        }
    }

    IOptions.prototype = defaultOptions;

    /*\
     * Interactable
     [ property ]
     **
     * Object type returned by @interact
    \*/
    function Interactable (element, options) {
        this._element = element;
        this._iEvents = this._iEvents || {};

        if (typeof element === 'string') {
            // if the selector is invalid,
            // an exception will be raised
            document.querySelector(element);
            selectors[element] = this;
            this.selector = element;
            this._gesture = selectorGesture;
        }
        else {
            if(isElement(element)) {
                if (PointerEvent) {
                    events.add(this, 'pointerdown', pointerDown );
                    events.add(this, 'pointermove', pointerHover);

                    this._gesture = new Gesture();
                    this._gesture.target = element;
                }
                else {
                    events.add(this, 'mousedown' , pointerDown );
                    events.add(this, 'mousemove' , pointerHover);
                    events.add(this, 'touchstart', pointerDown );
                    events.add(this, 'touchmove' , pointerHover);
                }
            }

            elements.push(this);
        }

        interactables.push(this);

        this.set(options);
    }

    Interactable.prototype = {
        setOnEvents: function (action, phases) {
            if (action === 'drop') {
                var drop      = phases.ondrop      || phases.onDrop      || phases.drop,
                    dragenter = phases.ondragenter || phases.onDropEnter || phases.dragenter,
                    dragleave = phases.ondragleave || phases.onDropLeave || phases.dragleave;

                if (typeof drop      === 'function') { this.ondrop      = drop     ; }
                if (typeof dragenter === 'function') { this.ondragenter = dragenter; }
                if (typeof dragleave === 'function') { this.ondragleave = dragleave; }
            }
            else {
                var start     = phases.onstart     || phases.onStart     || phases.start,
                    move      = phases.onmove      || phases.onMove      || phases.move,
                    end       = phases.onend       || phases.onEnd       || phases.end;

                var inertiastart = phases.oninertiastart || phases.onInertiaStart || phases.inertiastart;

                action = 'on' + action;

                if (typeof start === 'function') { this[action + 'start'] = start; }
                if (typeof move  === 'function') { this[action + 'move' ] = move ; }
                if (typeof end   === 'function') { this[action + 'end'  ] = end  ; }

                if (typeof inertiastart === 'function') { this[action + 'inertiastart'  ] = inertiastart  ; }
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
         |     onend  : function (event) {}
         | });
        \*/
        draggable: function (options) {
            if (options instanceof Object) {
                this.options.draggable = true;
                this.setOnEvents('drag', options);

                return this;
            }

            if (typeof options === 'boolean') {
                this.options.draggable = options;

                return this;
            }

            if (options === null) {
                delete this.options.draggable;

                return this;
            }

            return this.options.draggable;
        },

        /*\
         * Interactable.dropzone
         [ method ]
         *
         * Returns or sets whether elements can be dropped onto this
         * Interactable to trigger drop events
         *
         - options (boolean | object | null) #optional The new value to be set.
         = (boolean | object) The current setting or this Interactable
        \*/
        dropzone: function (options) {
            if (options instanceof Object) {
                this.options.dropzone = true;
                this.setOnEvents('drop', options);
                this.accept(options.accept);

                (this.selector? selectorDZs: dropzones).push(this);

                if (!dynamicDrop && !this.selector) {
                    this.rect = this.getRect();
                }
                return this;
            }

            if (typeof options === 'boolean') {
                if (options) {
                    (this.selector? selectorDZs: dropzones).push(this);

                    if (!dynamicDrop && !this.selector) {
                        this.rect = this.getRect();
                    }
                }
                else {
                    var array = this.selector? selectorDZs: dropzones,
                        index = array.indexOf(this);
                    if (index !== -1) {
                        array.splice(index, 1);
                    }
                }

                this.options.dropzone = options;

                return this;
            }

            if (options === null) {
                delete this.options.dropzone;

                return this;
            }

            return this.options.dropzone;
        },

        /*\
         * Interactable.dropCheck
         [ method ]
         *
         * The default function to determine if a dragend event occured over
         * this Interactable's element. Can be overridden using
         * @Interactable.dropChecker.
         *
         - event (MouseEvent | TouchEvent) The event that ends a drag
         = (boolean) whether the pointer was over this Interactable
        \*/
        dropCheck: function (event, draggable, element) {
            var page = getPageXY(event),
                origin = getOriginXY(draggable, element),
                horizontal,
                vertical;

            page.x += origin.x;
            page.y += origin.y;

            if (dynamicDrop) {
                this.rect = this.getRect();
            }

            if (!this.rect) {
                return false;
            }

            horizontal = (page.x > this.rect.left) && (page.x < this.rect.right);
            vertical   = (page.y > this.rect.top ) && (page.y < this.rect.bottom);

            return horizontal && vertical;
        },

        /*\
         * Interactable.dropChecker
         [ method ]
         *
         * Gets or sets the function used to check if a dragged element is
         * over this Interactable. See @Interactable.dropCheck.
         *
         - checker (function) #optional
         * The checker is a function which takes a mouseUp/touchEnd event as a
         * parameter and returns true or false to indicate if the the current
         * draggable can be dropped into this Interactable
         *
         = (Function | Interactable) The checker function or this Interactable
        \*/
        dropChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.dropCheck = newValue;

                return this;
            }
            return this.dropCheck;
        },

        /*\
         * Interactable.accept
         [ method ]
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
            if (isElement(newValue)) {
                this.options.accept = newValue;

                return this;
            }

            if (typeof newValue === 'string') {
                // test if it is a valid CSS selector
                document.querySelector(newValue);
                this.options.accept = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.accept;

                return this;
            }

            return this.options.accept;
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
         |     onend  : function (event) {}
         | });
        \*/
        resizable: function (options) {
            if (options instanceof Object) {
                this.options.resizable = true;
                this.setOnEvents('resize', options);

                return this;
            }
            if (typeof options === 'boolean') {
                this.options.resizable = options;

                return this;
            }
            return this.options.resizable;
        },

        // misspelled alias
        resizeable: blank,

        /*\
         * Interactable.squareResize
         [ method ]
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
            if (typeof newValue === 'boolean') {
                this.options.squareResize = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.squareResize;

                return this;
            }

            return this.options.squareResize;
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
         |     onmove: function (event) {}
         | });
        \*/
        gesturable: function (options) {
            if (options instanceof Object) {
                this.options.gesturable = true;
                this.setOnEvents('gesture', options);

                return this;
            }

            if (typeof options === 'boolean') {
                this.options.gesturable = options;

                return this;
            }

            if (options === null) {
                delete this.options.gesturable;

                return this;
            }

            return this.options.gesturable;
        },

        // misspelled alias
        gestureable: blank,

        /*\
         * Interactable.autoScroll
         [ method ]
         *
         * Returns or sets whether or not any actions near the edges of the
         * window/container trigger autoScroll for this Interactable
         *
         = (boolean | object)
         * `false` if autoScroll is disabled; object with autoScroll properties
         * if autoScroll is enabled
         *
         * or
         *
         - options (object | boolean | null) #optional
         * options can be:
         * - an object with margin, distance and interval properties,
         * - true or false to enable or disable autoScroll or
         * - null to use default settings
         = (Interactable) this Interactable
        \*/
        autoScroll: function (options) {
            var defaults = defaultOptions.autoScroll;

            if (options instanceof Object) {
                var autoScroll = this.options.autoScroll;

                if (autoScroll === defaults) {
                   autoScroll = this.options.autoScroll = {
                       margin   : defaults.margin,
                       distance : defaults.distance,
                       interval : defaults.interval,
                       container: defaults.container
                   };
                }

                autoScroll.margin = this.validateSetting('autoScroll', 'margin', options.margin);
                autoScroll.speed  = this.validateSetting('autoScroll', 'speed' , options.speed);

                autoScroll.container =
                    (isElement(options.container) || options.container instanceof window.Window
                     ? options.container
                     : defaults.container);


                this.options.autoScrollEnabled = true;
                this.options.autoScroll = autoScroll;

                return this;
            }

            if (typeof options === 'boolean') {
                this.options.autoScrollEnabled = options;

                return this;
            }

            if (options === null) {
                delete this.options.autoScrollEnabled;
                delete this.options.autoScroll;

                return this;
            }

            return (this.options.autoScrollEnabled
                ? this.options.autoScroll
                : false);
        },

        /*\
         * Interactable.snap
         [ method ]
         **
         * Returns or sets if and how action coordinates are snapped
         **
         = (boolean | object) `false` if snap is disabled; object with snap properties if snap is enabled
         **
         * or
         **
         - options (object | boolean | null) #optional
         = (Interactable) this Interactable
         > Usage
         | interact('.handle').snap({
         |     mode        : 'grid',                // event coords should snap to the corners of a grid
         |     range       : Infinity,              // the effective distance of snap ponts
         |     grid        : { x: 100, y: 100 },    // the x and y spacing of the grid points
         |     gridOffset  : { x:   0, y:   0 },    // the offset of the grid points
         | });
         |
         | interact('.handle').snap({
         |     mode        : 'anchor',              // snap to specified points
         |     anchors     : [
         |         { x: 100, y: 100, range: 25 },   // a point with x, y and a specific range
         |         { x: 200, y: 200 }               // a point with x and y. it uses the default range
         |     ]
         | });
         |
         | interact(document.querySelector('#thing')).snap({
         |     mode : 'path',
         |     paths: [
         |         {            // snap to points on these x and y axes
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
         |         }]
         | })
         |
         | interact(element).snap({
         |     // do not snap during normal movement.
         |     // Instead, trigger only one snapped move event
         |     // immediately before the end event.
         |     endOnly: true       
         | });
        \*/
        snap: function (options) {
            var defaults = defaultOptions.snap;

            if (options instanceof Object) {
                var snap = this.options.snap;

                if (snap === defaults) {
                   snap = {};
                }

                snap.mode       = this.validateSetting('snap', 'mode'      , options.mode);
                snap.endOnly    = this.validateSetting('snap', 'endOnly'   , options.endOnly);
                snap.actions    = this.validateSetting('snap', 'actions'   , options.actions);
                snap.range      = this.validateSetting('snap', 'range'     , options.range);
                snap.paths      = this.validateSetting('snap', 'paths'     , options.paths);
                snap.grid       = this.validateSetting('snap', 'grid'      , options.grid);
                snap.gridOffset = this.validateSetting('snap', 'gridOffset', options.gridOffset);
                snap.anchors    = this.validateSetting('snap', 'anchors'   , options.anchors);

                this.options.snapEnabled = true;
                this.options.snap = snap;

                return this;
            }

            if (typeof options === 'boolean') {
                this.options.snapEnabled = options;

                return this;
            }

            if (options === null) {
                delete this.options.snapEnabled;
                delete this.options.snap;

                return this;
            }

            return (this.options.snapEnabled
                ? this.options.snap
                : false);
        },

        /*\
         * Interactable.inertia
         [ method ]
         **
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
         |     resistance  : 16,
         |
         |     // the minimum launch speed (pixels per second) that results in inertiastart
         |     minSpeed    : 200,
         |
         |     // inertia will stop when the object slows down to this speed
         |     endSpeed    : 20,
         |
         |     // an array of action types that can have inertia (no gesture)
         |     actions     : ['drag', 'resize']
         | });
         |
         | // reset custom settings and use all defaults
         | interact(element).inertia(null);
        \*/
        inertia: function (options) {
            var defaults = defaultOptions.inertia;

            if (options instanceof Object) {
                var inertia = this.options.inertia;

                if (inertia === defaults) {
                   inertia = this.options.inertia = {
                       resistance: defaults.resistance,
                       minSpeed  : defaults.minSpeed,
                       endSpeed  : defaults.endSpeed
                   };
                }

                inertia.resistance = this.validateSetting('inertia', 'resistance', options.resistance);
                inertia.minSpeed   = this.validateSetting('inertia', 'minSpeed'  , options.minSpeed);
                inertia.endSpeed   = this.validateSetting('inertia', 'endSpeed'  , options.endSpeed);
                inertia.actions    = this.validateSetting('inertia', 'actions'   , options.actions);

                this.options.inertiaEnabled = true;
                this.options.inertia = inertia;

                return this;
            }

            if (typeof options === 'boolean') {
                this.options.inertiaEnabled = options;

                return this;
            }

            if (options === null) {
                delete this.options.inertiaEnabled;
                delete this.options.inertia;

                return this;
            }

            return (this.options.inertiaEnabled
                ? this.options.inertia
                : false);
        },

        /*\
         * Interactable.getAction
         [ method ]
         *
         * The default function to get the action resulting from a pointer
         * event. overridden using @Interactable.actionChecker
         *
         - event (object) The mouse/touch event
         *
         = (string | null) The action (drag/resize[axes]/gesture) or null if none can be performed
        \*/
        getAction: function actionCheck (event) {
            var rect = this.getRect(),
                right,
                bottom,
                action,
                page = getPageXY(event),
                options = this.options;

            if (actionIsEnabled.resize && options.resizable) {
                right  = page.x > (rect.right  - margin);
                bottom = page.y > (rect.bottom - margin);
            }

            resizeAxes = (right?'x': '') + (bottom?'y': '');
            action = (resizeAxes)?
                'resize' + resizeAxes:
                actionIsEnabled.drag && options.draggable?
                    'drag':
                    null;

            if (actionIsEnabled.gesture
                && ((event.touches && event.touches.length >= 2)
                    || (PointerEvent && pointerIds.length >=2)) &&
                    !(dragging || resizing)) {
                action = 'gesture';
            }

            return action;
        },

        /*\
         * Interactable.actionChecker
         [ method ]
         *
         * Gets or sets the function used to check action to be performed on
         * pointerDown
         *
         - checker (function) #optional A function which takes a mouse or touch event event as a parameter and returns 'drag' 'resize' or 'gesture' or null
         = (Function | Interactable) The checker function or this Interactable
        \*/
        actionChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.getAction = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.getAction;

                return this;
            }

            return this.getAction;
        },

        /*\
         * Interactable.getRect
         [ method ]
         *
         * The default function to get an Interactables bounding rect. Can be
         * overridden using @Interactable.rectChecker.
         *
         = (object) The object's bounding rectangle. The properties are numbers with no units.
         o {
         o     top: -,
         o     left: -, 
         o     bottom: -,
         o     right: -,
         o     width: -,
         o     height: -
         o }
        \*/
        getRect: function rectCheck () {
            if (this.selector && !(isElement(this._element))) {
                this._element = document.querySelector(this.selector);
            }

            return getElementRect(this._element);
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
        rectChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.getRect = newValue;

                return this;
            }

            if (newValue === null) {
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
         - newValue (function) #optional
         = (Function | Interactable) The current setting or this Interactable
        \*/
        styleCursor: function (newValue) {
            if (typeof newValue === 'boolean') {
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
         * Interactable.origin
         [ method ]
         *
         * Gets or sets the origin of the Interactable's element.  The x and y
         * of the origin will be subtracted from action event coordinates.
         *
         - origin (object) #optional An object with x and y properties which are numbers
         * OR
         - origin (Element) #optional An HTML or SVG Element whose rect will be used
         **
         = (object) The current origin or this Interactable
        \*/
        origin: function (newValue) {
            if (newValue instanceof Object || /^parent$|^self$/.test(newValue)) {
                this.options.origin = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.origin;

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
         - source (string) #optional Use 'client' if you will be scrolling while interacting; Use 'page' if you want autoScroll to work
         = (string | object) The current deltaSource or this Interactable
        \*/
        deltaSource: function (newValue) {
            if (newValue === 'page' || newValue === 'client') {
                this.options.deltaSource = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.deltaSource;

                return this;
            }

            return this.options.deltaSource;
        },

        /*\
         * Interactable.restrict
         [ method ]
         *
         * Returns or sets the rectangles within which actions on this
         * interactable (after snap calculations) are restricted.
         *
         - newValue (object) #optional an object with keys drag, resize, and/or gesture and rects or Elements as values
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
         |     endOnly: true       
         | });
        \*/
        restrict: function (newValue) {
            if (newValue === undefined) {
                return this.options.restrict;
            }

            if (newValue instanceof Object) {
                var newRestrictions = {};

                if (newValue.drag instanceof Object || /^parent$|^self$/.test(newValue.drag)) {
                    newRestrictions.drag = newValue.drag;
                }
                if (newValue.resize instanceof Object || /^parent$|^self$/.test(newValue.resize)) {
                    newRestrictions.resize = newValue.resize;
                }
                if (newValue.gesture instanceof Object || /^parent$|^self$/.test(newValue.gesture)) {
                    newRestrictions.gesture = newValue.gesture;
                }

                if (typeof newValue.endOnly === 'boolean') {
                    newRestrictions.endOnly = newValue.endOnly;
                }

                this.options.restrictEnabled = true;
                this.options.restrict = newRestrictions;
            }

            else if (newValue === null) {
               delete this.options.restrict;
               delete this.options.restrictEnabled;
            }

            return this;
        },

        /*\
         * Interactable.validateSetting
         [ method ]
         *
         - context (string) eg. 'snap', 'autoScroll'
         - option (string) The name of the value being set
         - value (any type) The value being validated
         *
         = (typeof value) A valid value for the give context-option pair
         * - null if defaultOptions[context][value] is undefined
         * - value if it is the same type as defaultOptions[context][value],
         * - this.options[context][value] if it is the same type as defaultOptions[context][value],
         * - or defaultOptions[context][value]
        \*/
        validateSetting: function (context, option, value) {
            var defaults = defaultOptions[context],
                current = this.options[context];

            if (defaults !== undefined && defaults[option] !== undefined) {
                if ('objectTypes' in defaults && defaults.objectTypes.test(option)) {
                    if (value instanceof Object) { return value; }
                    else {
                        return (option in current && current[option] instanceof Object
                            ? current [option]
                            : defaults[option]);
                    }
                }

                if ('arrayTypes' in defaults && defaults.arrayTypes.test(option)) {
                    if (value instanceof Array) { return value; }
                    else {
                        return (option in current && current[option] instanceof Array
                            ? current[option]
                            : defaults[option]);
                    }
                }

                if ('stringTypes' in defaults && defaults.stringTypes.test(option)) {
                    if (typeof value === 'string') { return value; }
                    else {
                        return (option in current && typeof current[option] === 'string'
                            ? current[option]
                            : defaults[option]);
                    }
                }

                if ('numberTypes' in defaults && defaults.numberTypes.test(option)) {
                    if (typeof value === 'number') { return value; }
                    else {
                        return (option in current && typeof current[option] === 'number'
                            ? current[option]
                            : defaults[option]);
                    }
                }

                if ('boolTypes' in defaults && defaults.boolTypes.test(option)) {
                    if (typeof value === 'boolean') { return value; }
                    else {
                        return (option in current && typeof current[option] === 'boolean'
                            ? current[option]
                            : defaults[option]);
                    }
                }

                if ('elementTypes' in defaults && defaults.elementTypes.test(option)) {
                    if (isElement(value)) { return value; }
                    else {
                        return (option in current && isElement(current[option])
                            ? current[option]
                            : defaults[option]);
                    }
                }
            }

            return null;
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
         * Calls listeners for the given InteractEvent type bound globablly
         * and directly to this Interactable
         *
         - iEvent (InteractEvent) The InteractEvent object to be fired on this Interactable
         = (Interactable) this Interactable
        \*/
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
                        // Interactable#on() listeners
                        case fireStates.directBind:
                            if (iEvent.type in this._iEvents) {
                            listeners = this._iEvents[iEvent.type];

                            for (len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
                                listeners[i](iEvent);
                            }
                            break;
                        }

                        break;

                        // interactable.onevent listener
                        case fireStates.onevent:
                            if (typeof this[onEvent] === 'function') {
                            this[onEvent](iEvent);
                        }
                        break;

                        // interact.on() listeners
                        case fireStates.globalBind:
                            if (iEvent.type in globalEvents && (listeners = globalEvents[iEvent.type]))  {

                            for (len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
                                listeners[i](iEvent);
                            }
                        }
                    }

                    if (iEvent.propagationStopped) {
                        break;
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

            return this;
        },

        /*\
         * Interactable.on
         [ method ]
         *
         * Binds a listener for an InteractEvent or DOM event.
         *
         - eventType  (string)   The type of event to listen for
         - listener   (function) The function to be called on that event
         - useCapture (boolean) #optional useCapture flag for addEventListener
         = (object) This Interactable
        \*/
        on: function (eventType, listener, useCapture) {
            if (eventType === 'wheel') {
                eventType = wheelEvent;
            }

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
            // delegated event for selector
            else if (this.selector) {
                if (!delegatedEvents[eventType]) {
                    delegatedEvents[eventType] = {};
                }

                var delegated = delegatedEvents[eventType];

                if (!delegated[this.selector]) {
                    delegated[this.selector] = [];
                }

                // keep listener and useCapture flag
                delegated[this.selector].push([listener, useCapture? true: false]);

                // add appropriate delegate listener
                events.add(docTarget,
                           eventType,
                           useCapture? delegateUseCapture: delegateListener,
                           useCapture);
            }
            else {
                events.add(this, eventType, listener, useCapture);
            }

            return this;
        },

        /*\
         * Interactable.off
         [ method ]
         *
         * Removes an InteractEvent or DOM event listener
         *
         - eventType  (string)   The type of event that was listened for
         - listener   (function) The listener function to be removed
         - useCapture (boolean) #optional useCapture flag for removeEventListener
         = (object) This Interactable
        \*/
        off: function (eventType, listener, useCapture) {
            var eventList,
                index = -1;

            // convert to boolean
            useCapture = useCapture? true: false;

            if (eventType === 'wheel') {
                eventType = wheelEvent;
            }

            // if it is an action event type
            if (eventTypes.indexOf(eventType) !== -1) {
                eventList = this._iEvents[eventType];

                if (eventList && (index = eventList.indexOf(listener)) !== -1) {
                    this._iEvents[eventType].splice(index, 1);
                }
            }
            // delegated event
            else if (this.selector) {
                var delegated = delegatedEvents[eventType];

                if (delegated && (eventList = delegated[this.selector])) {

                    // look for listener with matching useCapture flag
                    for (index = 0; index < eventList.length; index++) {
                        if (eventList[index][1] === useCapture) {
                            break;
                        }
                    }

                    // remove found listener from delegated list
                    if (index < eventList.length) {
                        eventList.splice(index, 1);
                    }
                }
            }
            // remove listener from this Interatable's element
            else {
                events.remove(this._element, listener, useCapture);
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
            if (!options || typeof options !== 'object') {
                options = {};
            }
            this.options = new IOptions(options);

            this.draggable  ('draggable'   in options? options.draggable  : this.options.draggable  );
            this.dropzone   ('dropzone'    in options? options.dropzone   : this.options.dropzone   );
            this.resizable ('resizable'  in options? options.resizable : this.options.resizable );
            this.gesturable('gesturable' in options? options.gesturable: this.options.gesturable);

            if ('autoScroll'  in options) { this.autoScroll (options.autoScroll ); }

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
            events.remove(this, 'all');

            if (typeof this.selector === 'string') {
                delete selectors[this.selector];
            }
            else {
                events.remove(this, 'all');
                if (this.options.styleCursor) {
                    this._element.style.cursor = '';
                }

                if (this._gesture) {
                    this._gesture.target = null;
                }

                elements.splice(elements.indexOf(this.element()));
            }

            this.dropzone(false);

            interactables.splice(interactables.indexOf(this), 1);

            return interact;
        }
    };

    Interactable.prototype.gestureable = Interactable.prototype.gesturable;
    Interactable.prototype.resizeable = Interactable.prototype.resizable;

    /*\
     * interact.isSet
     [ method ]
     *
     * Check if an element has been set
     - element (Element) The Element being searched for
     = (boolean) Indicates if the element or CSS selector was previously passed to interact
    \*/
    interact.isSet = function(element) {
        return interactables.indexOfElement(element) !== -1;
    };

    /*\
     * interact.on
     [ method ]
     *
     * Adds a global listener for an InteractEvent or adds a DOM event to
     * `document`
     *
     - type       (string)   The type of event to listen for
     - listener   (function) The function to be called on that event
     - useCapture (boolean) #optional useCapture flag for addEventListener
     = (object) interact
    \*/
    interact.on = function (type, listener, useCapture) {
        // if it is an InteractEvent type, add listener to globalEvents
        if (eventTypes.indexOf(type) !== -1) {
            // if this type of event was never bound
            if (!globalEvents[type]) {
                globalEvents[type] = [listener];
            }

            // if the event listener is not already bound for this type
            else if (globalEvents[type].indexOf(listener) === -1) {

                globalEvents[type].push(listener);
            }
        }
        // If non InteratEvent type, addEventListener to document
        else {
            events.add(docTarget, type, listener, useCapture);
        }

        return interact;
    };

    /*\
     * interact.off
     [ method ]
     *
     * Removes a global InteractEvent listener or DOM event from `document`
     *
     - type       (string)   The type of event that was listened for
     - listener   (function) The listener function to be removed
     - useCapture (boolean) #optional useCapture flag for removeEventListener
     = (object) interact
    \*/
    interact.off = function (type, listener, useCapture) {
        if (eventTypes.indexOf(type) === -1) {
            events.remove(docTarget, type, listener, useCapture);
        }
        else {
            var index;

            if (type in globalEvents
                && (index = globalEvents[type].indexOf(listener)) !== -1) {
                globalEvents[type].splice(index, 1);
            }
        }

        return interact;
    };

    /*\
     * interact.simulate
     [ method ]
     *
     * Simulate pointer down to begin to interact with an interactable element
     - action       (string)  The action to be performed - drag, resize, etc.
     - element      (Element) The DOM Element to resize/drag
     - pointerEvent (object) #optional Pointer event whose pageX/Y coordinates will be the starting point of the interact drag/resize
     = (object) interact
    \*/
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
        event.preventDefault = event.stopPropagation = blank;

        pointerDown(event, action);

        return interact;
    };

    /*\
     * interact.enableDragging
     [ method ]
     *
     * Returns or sets whether dragging is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableDragging = function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            actionIsEnabled.drag = newValue;

            return interact;
        }
        return actionIsEnabled.drag;
    };

    /*\
     * interact.enableResizing
     [ method ]
     *
     * Returns or sets whether resizing is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableResizing = function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            actionIsEnabled.resize = newValue;

            return interact;
        }
        return actionIsEnabled.resize;
    };

    /*\
     * interact.enableGesturing
     [ method ]
     *
     * Returns or sets whether gesturing is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableGesturing = function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            actionIsEnabled.gesture = newValue;

            return interact;
        }
        return actionIsEnabled.gesture;
    };

    interact.eventTypes = eventTypes;

    /*\
     * interact.debug
     [ method ]
     *
     * Returns debugging data
     = (object) An object with properties that outline the current state and expose internal functions and variables
    \*/
    interact.debug = function () {
        return {
            target                : target,
            dragging              : dragging,
            resizing              : resizing,
            gesturing             : gesturing,
            prepared              : prepared,

            prevCoords            : prevCoords,
            downCoords            : startCoords,

            pointerIds            : pointerIds,
            pointerMoves          : pointerMoves,
            addPointer            : addPointer,
            removePointer         : removePointer,
            recordPointers        : recordPointers,

            inertia               : inertiaStatus,

            downTime              : downTime,
            downEvent             : downEvent,
            prevEvent             : prevEvent,

            Interactable          : Interactable,
            IOptions              : IOptions,
            interactables         : interactables,
            dropzones             : dropzones,
            pointerIsDown         : pointerIsDown,
            defaultOptions        : defaultOptions,

            actions               : actions,
            dragMove              : dragMove,
            resizeMove            : resizeMove,
            gestureMove           : gestureMove,
            pointerUp             : pointerUp,
            pointerDown           : pointerDown,
            pointerMove           : pointerMove,
            pointerHover          : pointerHover,

            events                : events,
            globalEvents          : globalEvents,
            delegatedEvents       : delegatedEvents
        };
    };

    // expose the functions used to caluclate multi-touch properties
    interact.getTouchAverage  = touchAverage;
    interact.getTouchBBox     = touchBBox;
    interact.getTouchDistance = touchDistance;
    interact.getTouchAngle    = touchAngle;

    interact.getElementRect   = getElementRect;

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
        if (typeof newvalue === 'number') {
            margin = newvalue;

            return interact;
        }
        return margin;
    };

    /*\
     * interact.styleCursor
     [ styleCursor ]
     *
     * Returns or sets whether the cursor style of the document is changed
     * depending on what action is being performed
     *
     - newValue (boolean) #optional
     = (boolean | interact) The current setting of interact
    \*/
    interact.styleCursor = function (newValue) {
        if (typeof newValue === 'boolean') {
            defaultOptions.styleCursor = newValue;

            return interact;
        }
        return defaultOptions.styleCursor;
    };

    /*\
     * interact.autoScroll
     [ method ]
     *
     * Returns or sets whether or not actions near the edges of the window or
     * specified container element trigger autoScroll by default
     *
     - options (boolean | object) true or false to simply enable or disable or an object with margin, distance, container and interval properties
     = (object) interact
     * or
     = (boolean | object) `false` if autoscroll is disabled and the default autoScroll settings if it is enabled
    \*/
    interact.autoScroll = function (options) {
        var defaults = defaultOptions.autoScroll;

        if (options instanceof Object) {
            defaultOptions.autoScrollEnabled = true;

            if (typeof (options.margin) === 'number') { defaults.margin = options.margin;}
            if (typeof (options.speed)  === 'number') { defaults.speed  = options.speed ;}

            defaults.container =
                (isElement(options.container) || options.container instanceof window.Window
                 ? options.container
                 : defaults.container);

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

    /*\
     * interact.snap
     [ method ]
     *
     * Returns or sets whether actions are constrained to a grid or a
     * collection of coordinates
     *
     - options (boolean | object) #optional New settings
     * `true` or `false` to simply enable or disable
     * or an object with some of the following properties
     o {
     o     mode   : 'grid', 'anchor' or 'path',
     o     range  : the distance within which snapping to a point occurs,
     o     grid   : {
     o         x: the distance between x-axis snap points,
     o         y: the distance between y-axis snap points
     o     },
     o     gridOffset: {
     o             x, y: the x/y-axis values of the grid origin
     o     },
     o     anchors: [
     o         {
     o             x: x coordinate to snap to,
     o             y: y coordinate to snap to,
     o             range: optional range for this anchor
     o         }
     o         {
     o             another anchor
     o         }
     o     ]
     o }
     *
     = (object | interact) The default snap settings object or interact
    \*/
    interact.snap = function (options) {
        var snap = defaultOptions.snap;

        if (options instanceof Object) {
            defaultOptions.snapEnabled = true;

            if (typeof options.mode    === 'string' ) { snap.mode    = options.mode;    }
            if (typeof options.endOnly === 'boolean') { snap.endOnly = options.endOnly; }
            if (typeof options.range   === 'number' ) { snap.range   = options.range;   }
            if (options.actions    instanceof Array ) { snap.actions    = options.actions;    }
            if (options.anchors    instanceof Array ) { snap.anchors    = options.anchors;    }
            if (options.grid       instanceof Object) { snap.grid       = options.grid;       }
            if (options.gridOffset instanceof Object) { snap.gridOffset = options.gridOffset; }

            return interact;
        }
        if (typeof options === 'boolean') {
            defaultOptions.snapEnabled = options;

            return interact;
        }

        return {
            enabled   : defaultOptions.snapEnabled,
            mode      : snap.mode,
            actions   : snap.actions,
            grid      : snap.grid,
            gridOffset: snap.gridOffset,
            anchors   : snap.anchors,
            paths     : snap.paths,
            range     : snap.range,
            locked    : snapStatus.locked,
            x         : snapStatus.x,
            y         : snapStatus.y,
            realX     : snapStatus.realX,
            realY     : snapStatus.realY,
            dx        : snapStatus.dx,
            dy        : snapStatus.dy
        };
    };

    /*\
     * interact.inertia
     [ method ]
     *
     * Returns or sets inertia settings.
     *
     * See @Interactable.inertia
     *
     - options (boolean | object) #optional New settings
     * `true` or `false` to simply enable or disable
     * or an object of inertia options
     = (object | interact) The default inertia settings object or interact
    \*/
    interact.inertia = function (options) {
        var inertia = defaultOptions.inertia;

        if (options instanceof Object) {
            defaultOptions.inertiaEnabled = true;

            if (typeof options.resistance === 'number') { inertia.resistance = options.resistance;}
            if (typeof options.minSpeed   === 'number') { inertia.minSpeed   = options.minSpeed  ;}
            if (typeof options.endSpeed   === 'number') { inertia.endSpeed   = options.endSpeed  ;}

            if (options.actions instanceof Array) { inertia.actions = options.actions; }

            return interact;
        }
        if (typeof options === 'boolean') {
            defaultOptions.inertiaEnabled = options;

            return interact;
        }

        return {
            enabled: defaultOptions.inertiaEnabled,
            resistance: inertia.resistance,
            minSpeed: inertia.minSpeed,
            endSpeed: inertia.endSpeed,
            actions: inertia.actions
        };
    };

    /*\
     * interact.supportsTouch
     [ method ]
     *
     = (boolean) Whether or not the browser supports touch input
    \*/
    interact.supportsTouch = function () {
        return supportsTouch;
    };

    /*\
     * interact.currentAction
     [ method ]
     *
     = (string) What action is currently being performed
    \*/
    interact.currentAction = function () {
        return (dragging && 'drag') || (resizing && 'resize') || (gesturing && 'gesture') || null;
    };

    /*\
     * interact.stop
     [ method ]
     *
     * Ends the current interaction
     *
     - event (Event) An event on which to call preventDefault()
     = (object) interact
    \*/
    interact.stop = function (event) {
        if (dragging || resizing || gesturing) {
            autoScroll.stop();
            matches = [];

            if (target.options.styleCursor) {
                document.documentElement.style.cursor = '';
            }

            if (target._gesture) {
                target._gesture.stop();
            }

            clearTargets();

            for (var i = 0; i < selectorDZs.length; i++) {
                selectorDZs._elements = [];
            }

            // prevent Default only if were previously interacting
            if (event && typeof event.preventDefault === 'function') {
               event.preventDefault();
            }
        }

        if (pointerIds && pointerIds.length) {
            pointerIds.splice(0);
            pointerMoves.splice(0);
        }

        pointerIsDown = snapStatus.locked = dragging = resizing = gesturing = false;
        prepared = prevEvent = null;
        // do not clear the downEvent so that it can be used to
        // test for browser-simulated mouse events after touch

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
        if (typeof newValue === 'boolean') {
            if (dragging && dynamicDrop !== newValue && !newValue) {
                calcRects(dropzones);
            }

            dynamicDrop = newValue;

            return interact;
        }
        return dynamicDrop;
    };

    /*\
     * interact.deltaSource
     [ method ]
     * Returns or sets weather pageX/Y or clientX/Y is used to calculate dx/dy.
     *
     * See @Interactable.deltaSource
     *
     - newValue (string) #optional 'page' or 'client'
     = (string | Interactable) The current setting or interact
    \*/
    interact.deltaSource = function (newValue) {
        if (newValue === 'page' || newValue === 'client') {
            defaultOptions.deltaSource = newValue;

            return this;
        }
        return defaultOptions.deltaSource;
    };


    /*\
     * interact.restrict
     [ method ]
     *
     * Returns or sets the default rectangles within which actions (after snap
     * calculations) are restricted.
     *
     * See @Interactable.restrict
     *
     - newValue (object) #optional an object with keys drag, resize, and/or gesture and rects or Elements as values
     = (object) The current restrictions object or interact
    \*/
    interact.restrict = function (newValue) {
        var defaults = defaultOptions.restrict;

        if (newValue === undefined) {
            return defaultOptions.restrict;
        }

        if (newValue instanceof Object) {
            if (newValue.drag instanceof Object || /^parent$|^self$/.test(newValue.drag)) {
                defaults.drag = newValue.drag;
            }
            if (newValue.resize instanceof Object || /^parent$|^self$/.test(newValue.resize)) {
                defaults.resize = newValue.resize;
            }
            if (newValue.gesture instanceof Object || /^parent$|^self$/.test(newValue.gesture)) {
                defaults.gesture = newValue.gesture;
            }

            if (typeof newValue.endOnly === 'boolean') {
                defaults.endOnly = newValue.endOnly;
            }
        }

        else if (newValue === null) {
           defaults.drag = defaults.resize = defaults.gesture = null;
           defaults.endOnly = false;
        }

        return this;
    };

    if (PointerEvent) {
        events.add(docTarget, 'pointerup', collectTaps);

        events.add(docTarget, 'pointerdown'    , selectorDown);
        events.add(docTarget, 'MSGestureChange', pointerMove );
        events.add(docTarget, 'MSGestureEnd'   , pointerUp   );
        events.add(docTarget, 'MSInertiaStart' , pointerUp   );
        events.add(docTarget, 'pointerover'    , pointerOver );
        events.add(docTarget, 'pointerout'     , pointerOut  );

        events.add(docTarget, 'pointermove'  , recordPointers);
        events.add(docTarget, 'pointerup'    , recordPointers);
        events.add(docTarget, 'pointercancel', recordPointers);

        // fix problems of wrong targets in IE
        events.add(docTarget, 'pointerup', function () {
            if (!(dragging || resizing || gesturing)) {
                pointerIsDown = false;
            }
        });

        selectorGesture = new Gesture();
        selectorGesture.target = document.documentElement;
    }
    else {
        events.add(docTarget, 'mouseup' , collectTaps);
        events.add(docTarget, 'touchend', collectTaps);

        events.add(docTarget, 'mousedown', selectorDown);
        events.add(docTarget, 'mousemove', pointerMove );
        events.add(docTarget, 'mouseup'  , pointerUp   );
        events.add(docTarget, 'mouseover', pointerOver );
        events.add(docTarget, 'mouseout' , pointerOut  );

        events.add(docTarget, 'touchstart' , selectorDown);
        events.add(docTarget, 'touchmove'  , pointerMove );
        events.add(docTarget, 'touchend'   , pointerUp   );
        events.add(docTarget, 'touchcancel', pointerUp   );
    }

    events.add(windowTarget, 'blur', pointerUp);

    try {
        if (window.frameElement) {
            parentDocTarget._element = window.frameElement.ownerDocument;

            events.add(parentDocTarget   , 'mouseup'      , pointerUp);
            events.add(parentDocTarget   , 'touchend'     , pointerUp);
            events.add(parentDocTarget   , 'touchcancel'  , pointerUp);
            events.add(parentDocTarget   , 'pointerup'    , pointerUp);
            events.add(parentWindowTarget, 'blur'         , pointerUp);
        }
    }
    catch (error) {
        interact.windowParentError = error;
    }

    // For IE's lack of Event#preventDefault
    events.add(docTarget,    'selectstart', function (e) {
        if (dragging || resizing || gesturing) {
            e.preventDefault();
        }
    });

    // For IE8's lack of an Element#matchesSelector
    if (!(matchesSelector in Element.prototype) || typeof (Element.prototype[matchesSelector]) !== 'function') {
        Element.prototype[matchesSelector] = IE8MatchesSelector = function (selector, elems) {
            // http://tanalin.com/en/blog/2012/12/matches-selector-ie8/
            // modified for better performance
            elems = elems || this.parentNode.querySelectorAll(selector);
            var count = elems.length;

            for (var i = 0; i < count; i++) {
                if (elems[i] === this) {
                    return true;
                }
            }

            return false;
        };
    }

    // requestAnimationFrame polyfill
    (function() {
        var lastTime = 0,
            vendors = ['ms', 'moz', 'webkit', 'o'];

        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            reqFrame = window[vendors[x]+'RequestAnimationFrame'];
            cancelFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!reqFrame) {
            reqFrame = function(callback) {
                var currTime = new Date().getTime(),
                    timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                    id = window.setTimeout(function() { callback(currTime + timeToCall); },
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
    }());

    // http://documentcloud.github.io/underscore/docs/underscore.html#section-11
    /* global exports: true, module */
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = interact;
        }
        exports.interact = interact;
    }
    else {
        window.interact = interact;
    }

} (this));
