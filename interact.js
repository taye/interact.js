/**
 * interact.js v1.0.21
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

        // Use PointerEvents only if the Gesture API is also available
        Gesture      = window.Gesture || window.MSGesture,
        PointerEvent = Gesture && (window.PointerEvent || window.MSPointerEvent),
        GestureEvent = Gesture && (window.GestureEvent || window.MSGestureEvent),
        pEventTypes,
        gEventTypes,

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

        // keep track of added PointerEvents or touches
        pointerIds   = [],
        pointerMoves = [],

        downTime  = 0,         // the timeStamp of the starting event
        downEvent = null,      // gesturestart/mousedown/touchstart event
        prevEvent = null,      // previous action event
        tapTime   = 0,         // time of the most recent tap event
        prevTap   = null,

        startOffset    = { left: 0, right: 0, top: 0, bottom: 0 },
        restrictOffset = { left: 0, right: 0, top: 0, bottom: 0 },
        snapOffset     = { x: 0, y: 0},

        tmpXY = {},     // reduce object creation in getXY()

        inertiaStatus = {
            active       : false,
            smoothEnd    : false,
            target       : null,
            targetElement: null,

            startEvent: null,
            pointerUp : {},

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

        activeDrops     = {
            dropzones: [],      // the dropzones that are mentioned below
            elements : [],      // elements of dropzones that accept the target draggable
            rects    : []       // the rects of the elements mentioned above
        },

        matches         = [],   // all selectors that are matched by target element
        selectorGesture = null, // MSGesture object for selector PointerEvents

        // {
        //      type: {
        //          selectors: ['selector', ...],
        //          contexts : [document, ...],
        //          listeners: [[listener, useCapture], ...]
        //      }
        //  }
        delegatedEvents = {},

        target          = null, // current interactable being interacted with
        dropTarget      = null, // the dropzone a drag target might be dropped into
        dropElement     = null, // the element at the time of checking
        prevDropTarget  = null, // the dropzone that was recently dragged away from
        prevDropElement = null, // the element at the time of checking

        defaultOptions = {
            draggable   : false,
            dragAxis    : 'xy',
            dropzone    : false,
            accept      : null,
            resizable   : false,
            squareResize: false,
            resizeAxis  : 'xy',
            gesturable  : false,

            pointerMoveTolerance: 1,

            actionChecker: null,

            styleCursor: true,
            preventDefault: 'auto',

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

                elementOrigin: null,

                arrayTypes  : /^anchors$|^paths$|^actions$/,
                objectTypes : /^grid$|^gridOffset$|^elementOrigin$/,
                stringTypes : /^mode$/,
                numberTypes : /^range$/,
                boolTypes   :  /^endOnly$/
            },
            snapEnabled: false,

            restrict: {
                drag: null,
                resize: null,
                gesture: null,
                endOnly: false
            },
            restrictEnabled: false,

            autoScroll: {
                container   : window,  // the item that is scrolled (Window or HTMLElement)
                margin      : 60,
                speed       : 300,      // the scroll speed in pixels per second

                numberTypes : /^margin$|^speed$/
            },
            autoScrollEnabled: false,

            inertia: {
                resistance       : 10,    // the lambda in exponential decay
                minSpeed         : 100,   // target speed must be above this for inertia to start
                endSpeed         : 10,    // the speed at which inertia is slow enough to stop
                zeroResumeDelta  : false, // if an action is resumed after launch, set dx/dy to 0
                smoothEndDuration: 300,   // animate to snap/restrict endOnly if there's no inertia
                actions          : ['drag', 'resize'],  // allow inertia on these actions. gesture might not work

                numberTypes: /^resistance$|^minSpeed$|^endSpeed$|^smoothEndDuration$/,
                arrayTypes : /^actions$/,
                boolTypes  : /^zeroResumeDelta$/
            },
            inertiaEnabled: false,

            origin      : { x: 0, y: 0 },
            deltaSource : 'page',

            context     : document        // the Node on which querySelector will be called
        },

        snapStatus = {
            locked : false,
            x      : 0, y      : 0,
            dx     : 0, dy     : 0,
            realX  : 0, realY  : 0,
            anchors: [],
            paths  : []
        },

        restrictStatus = {
            dx: 0, dy: 0,
            snap: snapStatus,
            restricted: false
        },

        // Things related to autoScroll
        autoScroll = {
            target: null,
            i: null,    // the handle returned by window.setInterval
            x: 0, y: 0, // Direction each pulse is to scroll in

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
        supportsTouch = (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch),

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
                cursor: 'move',
                start : dragStart,
                move  : dragMove
            },
            resizex: {
                cursor: 'e-resize',
                start : resizeStart,
                move  : resizeMove
            },
            resizey: {
                cursor: 's-resize',
                start : resizeStart,
                move  : resizeMove
            },
            resizexy: {
                cursor: 'se-resize',
                start : resizeStart,
                move  : resizeMove
            },
            gesture: {
                cursor: '',
                start : gestureStart,
                move  : gestureMove
            }
        },

        actionIsEnabled = {
            drag   : true,
            resize : true,
            gesture: true
        },

        // Action that's ready to be fired on next move event
        prepared = null,

        // because Webkit and Opera still use 'mousewheel' event type
        wheelEvent = 'onmousewheel' in document? 'mousewheel': 'wheel',

        eventTypes = [
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
        prefixedMatchesSelector = 'matchesSelector' in Element.prototype?
                'matchesSelector': 'webkitMatchesSelector' in Element.prototype?
                    'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype?
                        'mozMatchesSelector': 'oMatchesSelector' in Element.prototype?
                            'oMatchesSelector': 'msMatchesSelector',

        // will be polyfill function if browser is IE8
        ie8MatchesSelector,

        // native requestAnimationFrame or polyfill
        reqFrame = window.requestAnimationFrame,
        cancelFrame = window.cancelAnimationFrame,

        // used for adding event listeners to window and document
        windowTarget       = { _element: window       , events  : {} },
        docTarget          = { _element: document     , events  : {} },
        parentWindowTarget = { _element: window.parent, events  : {} },
        parentDocTarget    = { _element: null         , events  : {} },

        // Events wrapper
        events = (function () {
            var useAttachEvent = 'attachEvent' in window && !('addEventListener' in window),
                addEvent = !useAttachEvent?  'addEventListener': 'attachEvent',
                removeEvent = !useAttachEvent?  'removeEventListener': 'detachEvent',
                on = useAttachEvent? 'on': '',

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

            return {
                add: function (target, type, listener, useCapture) {
                    add(target._element, type, listener, useCapture);
                },
                remove: function (target, type, listener, useCapture) {
                    remove(target._element, type, listener, useCapture);
                },
                addToElement: add,
                removeFromElement: remove,
                useAttachEvent: useAttachEvent,

                indexOf: indexOf
            };
        }());

    function blank () {}

    function isElement (o) {
        return !!o && (typeof o === 'object') && (
            /object|function/.test(typeof Element)
                ? o instanceof Element //DOM2
                : o.nodeType === 1 && typeof o.nodeName === "string");
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
        targetObj.clientVX    = targetObj.clientX / dt;
        targetObj.clientVY    = targetObj.clientY / dt;
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

        // array of touches is supplied
        if (event instanceof Array) {
            touches[0] = event[0];
            touches[1] = event[1];
        }
        // an event
        else {
            if (event.type === 'touchend') {
                if (event.touches.length === 1) {
                    touches[0] = event.touches[0];
                    touches[1] = event.changedTouches[0];
                }
                else if (event.touches.length === 0) {
                    touches[0] = event.changedTouches[0];
                    touches[1] = event.changedTouches[1];
                }
            }
            else {
                touches[0] = event.touches[0];
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
            clientY: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    function touchBBox (event) {
        if (!(event.touches && event.touches.length) && !(pointerMoves.length)) {
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

    function calcInertia (status) {
        var inertiaOptions = status.target.options.inertia,
            lambda = inertiaOptions.resistance,
            inertiaDur = -Math.log(inertiaOptions.endSpeed / status.v0) / lambda;

        status.x0 = prevEvent.pageX;
        status.y0 = prevEvent.pageY;
        status.t0 = status.startEvent.timeStamp / 1000;
        status.sx = status.sy = 0;

        status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
        status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
        status.te = inertiaDur;

        status.lambda_v0 = lambda / status.v0;
        status.one_ve_v0 = 1 - inertiaOptions.endSpeed / status.v0;
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

            pointerMove(inertiaStatus.startEvent);

            inertiaStatus.active = false;
            pointerUp(inertiaStatus.startEvent);
        }
    }

    function smoothEndFrame () {
        var t = new Date().getTime() - inertiaStatus.t0,
            duration = inertiaStatus.target.options.inertia.smoothEndDuration;

        if (t < duration) {
            inertiaStatus.sx = easeOutQuad(t, 0, inertiaStatus.xe, duration);
            inertiaStatus.sy = easeOutQuad(t, 0, inertiaStatus.ye, duration);

            pointerMove(inertiaStatus.startEvent);

            inertiaStatus.i = reqFrame(smoothEndFrame);
        }
        else {
            inertiaStatus.active = false;
            inertiaStatus.smoothEnd = false;

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

    // http://gizma.com/easing/
    function easeOutQuad (t, b, c, d) {
        t /= d;
        return -c * t*(t-2) + b;
    }

    function nodeContains (parent, child) {
        while ((child = child.parentNode)) {

            if (child === parent) {
                return true;
            }
        }

        return false;
    }

    function inContext (interactable, element) {
        return interactable._context === document
                || nodeContains(interactable._context, element);
    }

    function testIgnore (interactable, element) {
        var ignoreFrom = interactable.options.ignoreFrom;

        if (!isElement(element)) { return false; }

        if (typeof ignoreFrom === 'string') {
            return matchesSelector(element, ignoreFrom) || testIgnore(interactable, element.parentNode);
        }
        else if (isElement(ignoreFrom)) {
            return element === ignoreFrom || nodeContains(ignoreFrom, element);
        }

        return false;
    }

    function testAllow (interactable, element) {
        var allowFrom = interactable.options.allowFrom;

        if (!allowFrom) { return true; }

        if (!isElement(element)) { return false; }

        if (typeof allowFrom === 'string') {
            return matchesSelector(element, allowFrom) || testAllow(interactable, element.parentNode);
        }
        else if (isElement(allowFrom)) {
            return element === allowFrom || nodeContains(allowFrom, element);
        }

        return false;
    }

    function checkAndPreventDefault (event, interactable) {
        if (!interactable) { return; }

        var options = interactable.options,
            prevent = options.preventDefault;

        if (prevent === 'auto' && !/^input$|^textarea$/i.test(target._element.nodeName)) {
            // do not preventDefault on pointerdown if the prepared action is a drag
            // and dragging can only start from a certain direction - this allows
            // a touch to pan the viewport if a drag isn't in the right direction
            if (/down|start/i.test(event.type)
                && prepared === 'drag' && options.dragAxis !== 'xy') {

                return;
            }

            event.preventDefault();
            return;
        }

        if (prevent === true) {
            event.preventDefault();
            return;
        }
    }

    function checkAxis (axis, interactable) {
        if (!interactable) { return false; }

        var thisAxis = interactable.options.dragAxis;

        return (axis === 'xy' || thisAxis === 'xy' || thisAxis === axis);
    }

    function checkSnap (interactable, action) {
        var options = interactable.options;

        action = action || prepared;

        if (/^resize/.test(action)) {
            action = 'resize';
        }

        return (options.snapEnabled && contains(options.snap.actions, action));
    }

    function checkRestrict (interactable, action) {
        var options = interactable.options;

        action = action || prepared;

        if (/^resize/.test(action)) {
            action = 'resize';
        }

        return options.restrictEnabled && options.restrict[action];
    }

    function collectDrops (event, element) {
        var drops = [],
            elements = [],
            i;

        element = element || target._element;

        // collect all dropzones and their elements which qualify for a drop
        for (i = 0; i < dropzones.length; i++) {
            var current = dropzones[i];

            // test the draggable element against the dropzone's accept setting
            if ((isElement(current.options.accept) && current.options.accept !== element)
                || (typeof current.options.accept === 'string'
                    && !matchesSelector(element, current.options.accept))) {

                continue;
            }

            // query for new elements if necessary
            if (current.selector) {
                current._dropElements = current._context.querySelectorAll(current.selector);
            }

            for (var j = 0, len = current._dropElements.length; j < len; j++) {
                var currentElement = current._dropElements[j];

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
    }

    function fireActiveDrops(event) {
        var i,
            current,
            currentElement,
            prevElement;

        // loop through all active dropzones and trigger event
        for (i = 0; i < activeDrops.dropzones.length; i++) {
            current = activeDrops.dropzones[i];
            currentElement = activeDrops.elements [i];

            // prevent trigger of duplicate events on same element
            if (currentElement !== prevElement) {
                // set current element as event target
                event.target = currentElement;
                current.fire(event);
            }
            prevElement = currentElement;
        }
    }

    // Test for the element that's "above" all other qualifiers
    function indexOfDeepestElement (elements) {
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
            if (dropzone.parentNode === document) {
                continue;
            }
            // - if deepest is, update with the current dropzone and continue to next
            else if (deepestZone.parentNode === document) {
                deepestZone = dropzone;
                index = i;
                continue;
            }

            if (!deepestZoneParents.length) {
                parent = deepestZone;
                while (parent.parentNode && parent.parentNode !== document) {
                    deepestZoneParents.unshift(parent);
                    parent = parent.parentNode;
                }
            }

            // if this element is an svg element and the current deepest is
            // an HTMLElement
            if (deepestZone instanceof HTMLElement
                && dropzone instanceof SVGElement
                && !(dropzone instanceof SVGSVGElement)) {

                if (dropzone === deepestZone.parentNode) {
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
    }

    // Collect a new set of possible drops and save them in activeDrops.
    // setActiveDrops should always be called when a drag has just started or a
    // drag event happens while dynamicDrop is true
    function setActiveDrops (event, dragElement) {
        // get dropzones and their elements that could recieve the draggable
        var possibleDrops = collectDrops(event, dragElement, true);

        activeDrops.dropzones = possibleDrops.dropzones;
        activeDrops.elements  = possibleDrops.elements;
        activeDrops.rects     = [];

        for (var i = 0; i < activeDrops.dropzones.length; i++) {
            activeDrops.rects[i] = activeDrops.dropzones[i].getRect(activeDrops.elements[i]);
        }
    }

    function getDrop (event, dragElement) {
        var validDrops = [];

        if (dynamicDrop) {
            setActiveDrops(event, dragElement);
        }

        // collect all dropzones and their elements which qualify for a drop
        for (var j = 0; j < activeDrops.dropzones.length; j++) {
            var current        = activeDrops.dropzones[j],
                currentElement = activeDrops.elements [j],
                rect           = activeDrops.rects    [j];

            validDrops.push(current.dropCheck(event, target, dragElement, rect)
                            ? currentElement
                            : null);
        }

        // get the most apprpriate dropzone based on DOM depth and order
        var dropIndex = indexOfDeepestElement(validDrops),
            dropzone  = activeDrops.dropzones[dropIndex] || null,
            element   = activeDrops.elements [dropIndex] || null;

        if (dropzone && dropzone.selector) {
            dropzone._element = element;
        }

        return {
            dropzone: dropzone,
            element: element
        };
    }

    function getDropEvents (pointerEvent, dragEvent, starting) {
        var dragLeaveEvent = null,
            dragEnterEvent = null,
            dropActivateEvent = null,
            dropDectivateEvent = null,
            dropMoveEvent = null,
            dropEvent = null;

        if (dropElement !== prevDropElement) {
            // if there was a prevDropTarget, create a dragleave event
            if (prevDropTarget) {
                dragLeaveEvent = new InteractEvent(pointerEvent, 'drag', 'leave', prevDropElement, dragEvent.target);
                dragEvent.dragLeave = prevDropElement;
            }
            // if the dropTarget is not null, create a dragenter event
            if (dropTarget) {
                dragEnterEvent = new InteractEvent(pointerEvent, 'drag', 'enter', dropElement, dragEvent.target);
                dragEvent.dragEnter = dropElement;
            }
        }

        if (dragEvent.type === 'dragend' && dropTarget) {
            dropEvent = new InteractEvent(pointerEvent, 'drop', null, dropElement, dragEvent.target);
        }
        if (dragEvent.type === 'dragmove' && starting) {
            dropActivateEvent = new InteractEvent(pointerEvent, 'drop', 'activate', null, dragEvent.target);
        }
        if (dragEvent.type === 'dragend' && !starting) {
            dropDectivateEvent = new InteractEvent(pointerEvent, 'drop', 'deactivate', null, dragEvent.target);
        }
        if (dragEvent.type === 'dragmove' && dropTarget) {
            dropMoveEvent = {
                target       : dropElement,
                relatedTarget: dragEvent.target,
                dragmove     : dragEvent,
                type         : 'dropmove',
                timeStamp    : dragEvent.timeStamp
            };
        }

        return {
            enter       : dragEnterEvent,
            leave       : dragLeaveEvent,
            activate    : dropActivateEvent,
            deactivate  : dropDectivateEvent,
            move        : dropMoveEvent,
            drop        : dropEvent
        };
    }

    function InteractEvent (event, action, phase, element, related) {
        var client,
            page,
            deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX     = deltaSource + 'X',
            sourceY     = deltaSource + 'Y',
            options     = target? target.options: defaultOptions,
            origin      = getOriginXY(target, element),
            starting    = phase === 'start',
            ending      = phase === 'end';

        element = element || target._element;

        if (action === 'gesture') {
            var average = touchAverage(pointerMoves);

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

            if (checkSnap(target) && !(starting && options.snap.elementOrigin)) {

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
        }

        if (checkRestrict(target) && !(starting && options.restrict.elementRect) && restrictStatus.restricted) {
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

        if (starting && !(event instanceof InteractEvent)) {
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

        this.interactbale = target;

        if (inertiaStatus.active) {
            this.detail = 'inertia';
        }

        if (related) {
            this.relatedTarget = related;
        }

        // end event dx, dy is difference between start and end points
        if (ending || action === 'drop') {
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
        if (prevEvent && prevEvent.detail === 'inertia'
            && !inertiaStatus.active && options.inertia.zeroResumeDelta) {

            inertiaStatus.resumeDx += this.dx;
            inertiaStatus.resumeDy += this.dy;

            this.dx = this.dy = 0;
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

            if (starting) {
                this.distance = touchDistance(pointerMoves);
                this.box      = touchBBox(pointerMoves);
                this.scale    = 1;
                this.ds       = 0;
                this.angle    = touchAngle(pointerMoves);
                this.da       = 0;
            }
            else if (ending || event instanceof InteractEvent) {
                this.distance = prevEvent.distance;
                this.box      = prevEvent.box;
                this.scale    = prevEvent.scale;
                this.ds       = this.scale - 1;
                this.angle    = prevEvent.angle;
                this.da       = this.angle - gesture.startAngle;
            }
            else {
                this.distance = touchDistance(pointerMoves);
                this.box      = touchBBox(pointerMoves);
                this.scale    = this.distance / gesture.startDistance;
                this.angle    = touchAngle(pointerMoves, gesture.prevAngle);

                this.ds = this.scale - gesture.prevScale;
                this.da = this.angle - gesture.prevAngle;
            }
        }

        if (starting) {
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
            if (ending || event instanceof InteractEvent) {
                // change in time in seconds
                // use event sequence duration for end events
                // => average speed of the event sequence
                // (minimum dt of 1ms)
                dt = Math.max((ending? this.duration: this.dt) / 1000, 0.001);
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

        if ((ending || phase === 'inertiastart')
            && prevEvent.speed > 600 && this.timeStamp - prevEvent.timeStamp < 150) {

            var angle = 180 * Math.atan2(prevEvent.velocityY, prevEvent.velocityX) / Math.PI,
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
                speed: prevEvent.speed,
                velocity: {
                    x: prevEvent.velocityX,
                    y: prevEvent.velocityY
                }
            };
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

    function preventOriginalDefault () {
        this.originalEvent.preventDefault();
    }

    function fireTaps (event, targets, elements) {
        var tap = {},
            prop, i;

        for (prop in event) {
            tap[prop] = event[prop];
        }

        tap.preventDefault           = preventOriginalDefault;
        tap.stopPropagation          = InteractEvent.prototype.stopPropagation;
        tap.stopImmediatePropagation = InteractEvent.prototype.stopImmediatePropagation;

        tap.timeStamp     = new Date().getTime();
        tap.originalEvent = event;
        tap.dt            = tap.timeStamp - downTime;
        tap.type          = 'tap';

        var interval = tap.timeStamp - tapTime,
            dbl = (prevTap && prevTap.type !== 'doubletap'
                   && prevTap.target === tap.target
                   && interval < 500);

        tapTime = tap.timeStamp;

        for (i = 0; i < targets.length; i++) {
            var origin = getOriginXY(targets[i], elements[i]);

            tap.pageX -= origin.x;
            tap.pageY -= origin.y;
            tap.clientX -= origin.x;
            tap.clientY -= origin.y;

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

            doubleTap.dt   = interval;
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
        if(downEvent) {
            if (pointerWasMoved
                || !(event instanceof downEvent.constructor)
                || downEvent.target !== event.target) {
                return;
            }
        }

        var tapTargets = [],
            tapElements = [];

        var eventTarget = (event.target instanceof SVGElementInstance
                ? event.target.correspondingUseElement
                : event.target),
            element = eventTarget;

        function collectSelectorTaps (interactable, selector, context) {
            var elements = ie8MatchesSelector
                    ? context.querySelectorAll(selector)
                    : undefined;

            if (element !== document
                && inContext(interactable, element)
                && !testIgnore(interactable, eventTarget)
                && testAllow(interactable, eventTarget)
                && matchesSelector(element, selector, elements)) {

                tapTargets.push(interactable);
                tapElements.push(element);
            }
        }

        while (element) {
            if (interact.isSet(element)) {
                tapTargets.push(interact(element));
                tapElements.push(element);
            }

            interactables.forEachSelector(collectSelectorTaps);

            element = element.parentNode;
        }

        if (tapTargets.length) {
            fireTaps(event, tapTargets, tapElements);
        }
    }

    function defaultActionChecker (event) {
        var rect = this.getRect(),
            right,
            bottom,
            action = null,
            page = getPageXY(event),
            options = this.options;

        if (!rect) { return null; }

        if (actionIsEnabled.resize && options.resizable) {
            right  = options.resizeAxis !== 'y' && page.x > (rect.right  - margin);
            bottom = options.resizeAxis !== 'x' && page.y > (rect.bottom - margin);
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
    }

    // Check if action is enabled globally and the current target supports it
    // If so, return the validated action. Otherwise, return null
    function validateAction (action, interactable) {
        if (typeof action !== 'string') { return null; }

        interactable = interactable || target;

        var actionType = action.search('resize') !== -1? 'resize': action,
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
            checkAndPreventDefault(event, target);
            return;
        }

        // try to ignore browser simulated mouse after touch
        if (downEvent
            && event.type === 'mousedown' && downEvent.type === 'touchstart'
            && event.timeStamp - downEvent.timeStamp < 300) {
            return;
        }

        pointerIsDown = true;

        var eventTarget = (event.target instanceof SVGElementInstance
            ? event.target.correspondingUseElement
            : event.target),
            element = eventTarget,
            action;

        addPointer(event);

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

                    // add the pointer to the gesture object
                    addPointer(event, selectorGesture);

                    return;
                }
                element = element.parentNode;
            }
        }

        // do nothing if interacting
        if (dragging || resizing || gesturing) {
            return;
        }

        function pushMatches (interactable, selector, context) {
            var elements = ie8MatchesSelector
                ? context.querySelectorAll(selector)
                : undefined;

            if (inContext(interactable, element)
                && !testIgnore(interactable, eventTarget)
                && testAllow(interactable, eventTarget)
                && matchesSelector(element, selector, elements)) {

                interactable._element = element;
                matches.push(interactable);
            }
        }

        if (matches.length && /mousedown|pointerdown/i.test(event.type)) {
            action = validateSelector(event, matches);
        }
        else {
            while (element && element !== document && !action) {
                matches = [];

                interactables.forEachSelector(pushMatches);

                action = validateSelector(event, matches);
                element = element.parentNode;
            }
        }

        if (action) {
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
            checkAndPreventDefault(event, target);

            return;
        }

        pointerIsDown = true;

        addPointer(event);

        // If it is the second touch of a multi-touch gesture, keep the target
        // the same if a target was set by the first touch
        // Otherwise, set the target if there is no action prepared
        if ((((event.touches && event.touches.length < 2) || (pointerIds && pointerIds.length < 2)) && !target)
            || !prepared) {

            var interactable = interactables.get(event.currentTarget);

            if (!testIgnore(interactable, event.target)
                && testAllow(interactable, event.target)) {
                target = interactable;
            }
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

            snapStatus.snappedX = null;
            snapStatus.snappedY = null;

            downTime = new Date().getTime();
            downEvent = event;
            setEventXY(prevCoords, event);
            pointerWasMoved = false;

            checkAndPreventDefault(event, target);
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

        page.x -= inertiaStatus.resumeDx;
        page.y -= inertiaStatus.resumeDy;

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

                dx = anchor.x - page.x + snapOffset.x;
                dy = anchor.y - page.y + snapOffset.y;
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

            status.snappedX = closest.anchor.x;
            status.snappedY = closest.anchor.y;
            status.dx = closest.dx;
            status.dy = closest.dy;
        }
        else if (snap.mode === 'grid') {
            var gridx = Math.round((page.x - snap.gridOffset.x - snapOffset.x) / snap.grid.x),
                gridy = Math.round((page.y - snap.gridOffset.y - snapOffset.y) / snap.grid.y),

                newX = gridx * snap.grid.x + snap.gridOffset.x + snapOffset.x,
                newY = gridy * snap.grid.y + snap.gridOffset.y + snapOffset.y;

            dx = newX - page.x;
            dy = newY - page.y;

            distance = hypot(dx, dy);

            inRange = distance < snap.range;
            snapChanged = (newX !== status.x || newY !== status.y);

            status.snappedX = newX;
            status.snappedY = newY;
            status.dx = dx;
            status.dy = dy;

            status.range = snap.range;
        }

        status.changed = (snapChanged || (inRange && !status.locked));
        status.locked = inRange;

        return status;
    }

    function setRestriction (event, status) {
        var restrict = target && target.options.restrict,
            restriction = restrict && restrict[prepared],
            page;

        if (!restriction) {
            return status;
        }

        status = status || restrictStatus;

        page = status.useStatusXY
                ? page = { x: status.x, y: status.y }
                : page = getPageXY(event);

        if (status.snap && status.snap.locked) {
            page.x += status.snap.dx || 0;
            page.y += status.snap.dy || 0;
        }

        page.x -= inertiaStatus.resumeDx;
        page.y -= inertiaStatus.resumeDy;

        status.dx = 0;
        status.dy = 0;
        status.restricted = false;

        var rect;

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

        status.dx = Math.max(Math.min(rect.right  - restrictOffset.right , page.x), rect.left + restrictOffset.left) - page.x;
        status.dy = Math.max(Math.min(rect.bottom - restrictOffset.bottom, page.y), rect.top  + restrictOffset.top ) - page.y;
        status.restricted = true;

        return status;
    }

    function pointerMove (event, preEnd) {
        if (!pointerIsDown) { return; }

        if (!(event instanceof InteractEvent)) {
            setEventXY(curCoords, event);
        }

        var dx, dy;

        // register movement of more than 1 pixel
        if (!pointerWasMoved) {
            dx = curCoords.clientX - startCoords.clientX;
            dy = curCoords.clientY - startCoords.clientY;

            pointerWasMoved = hypot(dx, dy) > defaultOptions.pointerMoveTolerance;
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

                // check if a drag is in the correct axis
                if (prepared === 'drag') {
                    var absX = Math.abs(dx),
                        absY = Math.abs(dy),
                        targetAxis = target.options.dragAxis,
                        axis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy');

                    // if the movement isn't in the axis of the interactable
                    if (axis !== 'xy' && targetAxis !== 'xy' && targetAxis !== axis) {
                        // cancel the prepared action
                        prepared = null;

                        // then try to get a drag from another ineractable

                        var eventTarget = (event.target instanceof SVGElementInstance
                                ? event.target.correspondingUseElement
                                : event.target),
                            element = eventTarget;

                        // check element interactables
                        while (element && element !== document) {
                            var elementInteractable = interactables.get(element);

                            if (elementInteractable
                                && elementInteractable !== target
                                && elementInteractable.getAction(downEvent) === 'drag'
                                && checkAxis(axis, elementInteractable)) {
                                prepared = 'drag';
                                target = elementInteractable;
                                break;
                            }

                            element = element.parentNode;
                        }

                        // if there's no drag from element interactables,
                        // check the selector interactables
                        if (!prepared) {
                            var getDraggable = function (interactable, selector, context) {
                                var elements = ie8MatchesSelector
                                    ? context.querySelectorAll(selector)
                                    : undefined;

                                if (interactable === target) { return; }

                                interactable._element = element;

                                if (inContext(interactable, eventTarget)
                                    && !testIgnore(interactable, eventTarget)
                                    && testAllow(interactable, eventTarget)
                                    && matchesSelector(element, selector, elements)
                                    && interactable.getAction(downEvent) === 'drag'
                                    && checkAxis(axis, interactable)) {

                                    return interactable;
                                }
                            };

                            element = eventTarget;

                            while (element && element !== document) {
                                var selectorInteractable = interactables.forEachSelector(getDraggable);

                                if (selectorInteractable) {
                                    prepared = 'drag';
                                    target = selectorInteractable;
                                    break;
                                }

                                element = element.parentNode;
                            }
                        }
                    }
                }
            }

            if (prepared && target) {
                var shouldRestrict = checkRestrict(target) && (!target.options.restrict.endOnly || preEnd),
                    starting = !(dragging || resizing || gesturing),
                    snapEvent = starting? downEvent: event;

                if (starting) {
                    prevEvent = downEvent;

                    var rect = target.getRect(),
                        snap = target.options.snap,
                        restrict = target.options.restrict;

                    if (rect) {
                        startOffset.left = startCoords.pageX - rect.left;
                        startOffset.top  = startCoords.pageY - rect.top;

                        startOffset.right  = rect.right  - startCoords.pageX;
                        startOffset.bottom = rect.bottom - startCoords.pageY;
                    }
                    else {
                        startOffset.left = startOffset.top = startOffset.right = startOffset.bottom = 0;
                    }

                    if (rect && snap.elementOrigin) {
                        snapOffset.x = startOffset.left + (rect.width  * snap.elementOrigin.x);
                        snapOffset.y = startOffset.top  + (rect.height * snap.elementOrigin.y);
                    }
                    else {
                        snapOffset.x = snapOffset.y = 0;
                    }

                    if (rect && restrict.elementRect) {
                        restrictOffset.left = startOffset.left - (rect.width  * restrict.elementRect.left);
                        restrictOffset.top  = startOffset.top  - (rect.height * restrict.elementRect.top);

                        restrictOffset.right  = startOffset.right  - (rect.width  * (1 - restrict.elementRect.right));
                        restrictOffset.bottom = startOffset.bottom - (rect.height * (1 - restrict.elementRect.bottom));
                    }
                    else {
                        restrictOffset.left = restrictOffset.top = restrictOffset.right = restrictOffset.bottom = 0;
                    }
                }

                if (!shouldRestrict) {
                    restrictStatus.restricted = false;
                }

                // check for snap
                if (checkSnap(target) && (!target.options.snap.endOnly || preEnd)) {

                    setSnapping(snapEvent);

                    // move if snapping doesn't prevent it or a restriction is in place
                    if ((snapStatus.changed || !snapStatus.locked) || shouldRestrict) {

                        if (shouldRestrict) {
                            setRestriction(event);
                        }

                        if (starting) {
                            prevEvent = actions[prepared].start(downEvent);

                            // set snapping for the next move event
                            if (target.options.snapEnabled && !target.options.snap.endOnly) {
                                setSnapping(event);
                            }
                        }

                        prevEvent = actions[prepared].move(event);
                    }
                }
                // if no snap, always move
                else {
                    if (shouldRestrict) {
                        setRestriction(event);
                    }

                    if (starting) {
                        prevEvent = actions[prepared].start(downEvent);

                        // set snapping for the next move event
                        if (target.options.snapEnabled && !target.options.snap.endOnly) {
                            setSnapping(event);
                        }
                    }

                    prevEvent = actions[prepared].move(event);
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

    function addPointer (event, gesture, type) {
        type = type || event.type;

        if (/touch/.test(event.type)) {
            var touches = (/cancel|touchend/.test(type)
                           ? event.changedTouches
                           : event.touches);

            for (var i = 0; i < touches.length; i++) {
                addPointer(touches[i], gesture, type);
            }

            return;
        }

        // dont add the event if it's not the same pointer type as the previous event
        if (pointerIds.length && pointerMoves[0].pointerType !== event.pointerType) {
            return;
        }

        var id = event.pointerId || event.identifier || 0;

        if (gesture) {
            gesture.addPointer(id);
        }

        var index = indexOf(pointerIds, id);

        if (index === -1) {
            pointerIds.push(id);

            // move events are kept so that multi-touch properties can still be
            // calculated at the end of a gesture; use pointerIds index
            pointerMoves[pointerIds.length - 1] = event;
        }
        else {
            pointerMoves[index] = event;
        }
    }

    function removePointer (event) {
        var index = indexOf(pointerIds, event.pointerId || event.identifier || 0);

        if (index === -1) { return; }

        pointerIds.splice(index, 1);

        // move events are kept so that multi-touch properties can still be
        // calculated at the end of a GestureEvnt sequence
        //pointerMoves.splice(index, 1);
    }

    function recordPointers (event, type) {
        var index = indexOf(pointerIds, event.pointerId || event.identifier || 0);

        if (index === -1) { return; }

        type = type || event.type;

        if (/move/i.test(type)) {
            pointerMoves[index] = event;
        }
        else if (/up|end|cancel/i.test(type)) {
            removePointer(event);

            // End the gesture InteractEvent if there are
            // fewer than 2 active pointers
            if (gesturing && target._gesture && pointerIds.length < 2) {
                target._gesture.stop();
            }
        }
    }

    function recordTouches (event) {
        var touches = (/cancel|touchend/.test(event.type)
                       ? event.changedTouches
                       : event.touches);

        for (var i = 0; i < touches.length; i++) {
            recordPointers(touches[i], event.type);
        }

        return;
    }

    function dragStart (event) {
        var dragEvent = new InteractEvent(event, 'drag', 'start');

        dragging = true;

        target.fire(dragEvent);

        // reset active dropzones
        activeDrops.dropzones = [];
        activeDrops.elements  = [];
        activeDrops.rects     = [];

        if (!dynamicDrop) {
            setActiveDrops(event, target._element);
        }

        return dragEvent;
    }

    function dragMove (event) {
        checkAndPreventDefault(event, target);

        var dragEvent  = new InteractEvent(event, 'drag', 'move'),
            draggableElement = target._element,
            drop = getDrop(dragEvent, draggableElement);

        dropTarget = drop.dropzone;
        dropElement = drop.element;

        // Make sure that the target selector draggable's element is
        // restored after dropChecks
        target._element = draggableElement;

        var dropEvents = getDropEvents(event, dragEvent);

        target.fire(dragEvent);

        if (dropEvents.activate) {
            fireActiveDrops(dropEvents.activate); 
        }
        if (dropEvents.leave) { prevDropTarget.fire(dropEvents.leave); }
        if (dropEvents.enter) {     dropTarget.fire(dropEvents.enter); }
        if (dropEvents.move ) {     dropTarget.fire(dropEvents.move ); }

        prevDropTarget  = dropTarget;
        prevDropElement = dropElement;

        return dragEvent;
    }

    function resizeStart (event) {
        var resizeEvent = new InteractEvent(event, 'resize', 'start');

        target.fire(resizeEvent);

        target.fire(resizeEvent);
        resizing = true;

        return resizeEvent;
    }

    function resizeMove (event) {
        checkAndPreventDefault(event, target);

        var resizeEvent;

        resizeEvent = new InteractEvent(event, 'resize', 'move');
        target.fire(resizeEvent);

        return resizeEvent;
    }

    function gestureStart (event) {
        var gestureEvent = new InteractEvent(event, 'gesture', 'start');

        gestureEvent.ds = 0;

        gesture.startDistance = gesture.prevDistance = gestureEvent.distance;
        gesture.startAngle = gesture.prevAngle = gestureEvent.angle;
        gesture.scale = 1;

        gesturing = true;

        target.fire(gestureEvent);

        return gestureEvent;
    }

    function gestureMove (event) {
        if ((!event.touches || event.touches.length < 2) && !PointerEvent) {
            return;
        }

        checkAndPreventDefault(event, target);

        var gestureEvent;

        gestureEvent = new InteractEvent(event, 'gesture', 'move');
        gestureEvent.ds = gestureEvent.scale - gesture.scale;

        target.fire(gestureEvent);

        gesture.prevAngle = gestureEvent.angle;
        gesture.prevDistance = gestureEvent.distance;

        if (gestureEvent.scale !== Infinity &&
            gestureEvent.scale !== null &&
            gestureEvent.scale !== undefined  &&
            !isNaN(gestureEvent.scale)) {

            gesture.scale = gestureEvent.scale;
        }

        return gestureEvent;
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
        if (prepared) { return; }

        var curMatches = [],
            prevTargetElement = target && target._element,
            eventTarget = (event.target instanceof SVGElementInstance
                ? event.target.correspondingUseElement
                : event.target);

        if (target
            && (testIgnore(target, eventTarget) || !testAllow(target, eventTarget))) {
            // if the eventTarget should be ignored or shouldn't be allowed
            // clear the previous target
            target = null;
            matches = [];
        }

        var elementInteractable = interactables.get(eventTarget),
            elementAction = (elementInteractable
                             && !testIgnore(elementInteractable, eventTarget)
                             && testAllow(elementInteractable, eventTarget)
                             && validateAction(
                                 elementInteractable.getAction(event),
                                 elementInteractable));

        function pushCurMatches (interactable, selector) {
            if (interactable
                && inContext(interactable, eventTarget)
                && !testIgnore(interactable, eventTarget)
                && testAllow(interactable, eventTarget)
                && matchesSelector(eventTarget, selector)) {

                interactable._element = eventTarget;
                curMatches.push(interactable);
            }
        }

        if (elementAction) {
            target = elementInteractable;
            matches = [];
        }
        else {
            interactables.forEachSelector(pushCurMatches);

            if (validateSelector(event, curMatches)) {
                matches = curMatches;

                pointerHover(event, matches);
                events.addToElement(eventTarget, 'mousemove', pointerHover);
            }
            else if (target) {
                var prevTargetChildren = prevTargetElement.querySelectorAll('*');

                if (contains(prevTargetChildren, eventTarget)) {

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
        if (prepared) { return; }

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
        if (!prepared) {

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
        else if (prepared) {
            checkAndPreventDefault(event, target);
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
            options = target && target.options,
            inertiaOptions = options && options.inertia,
            prop;

        if (dragging || resizing || gesturing) {

            if (inertiaStatus.active) { return; }

            var deltaSource = options.deltaSource,
                pointerSpeed = pointerDelta[deltaSource + 'Speed'],
                now = new Date().getTime(),
                inertiaPossible = false,
                inertia = false,
                smoothEnd = false,
                dx = 0,
                dy = 0,
                startEvent;

            // check if inertia should be started
            inertiaPossible = (options.inertiaEnabled
                               && prepared !== 'gesture'
                               && contains(inertiaOptions.actions, prepared)
                               && event !== inertiaStatus.startEvent);

            inertia = (inertiaPossible
                       && (now - curCoords.timeStamp) < 50
                       && pointerSpeed > inertiaOptions.minSpeed
                       && pointerSpeed > inertiaOptions.endSpeed);

            if (inertiaPossible && !inertia
                && ((options.snapEnabled && options.snap.endOnly
                    && contains(options.snap.actions, prepared))
                    || (options.restrictEnabled && options.restrict.endOnly))) {

                var snapRestrict = {};

                snapRestrict.snap = snapRestrict.restrict = snapRestrict;

                setSnapping(event, snapRestrict);
                if (snapRestrict.locked) {
                    dx += snapRestrict.dx;
                    dy += snapRestrict.dy;
                }

                setRestriction(event, snapRestrict);
                if (snapRestrict.restricted) {
                    dx += snapRestrict.dx;
                    dy += snapRestrict.dy;
                }

                if ((snapRestrict.locked || snapRestrict.restricted) && (dx || dy)) {
                    smoothEnd = true;
                }
            }

            if (inertia || smoothEnd) {
                if (events.useAttachEvent) {
                    // make a copy of the pointerdown event because IE8
                    // http://stackoverflow.com/a/3533725/2280888
                    for (prop in event) {
                        inertiaStatus.pointerUp[prop] = event[prop];
                    }
                }
                else {
                    inertiaStatus.pointerUp = event;
                }

                inertiaStatus.startEvent = startEvent = new InteractEvent(event, prepared, 'inertiastart');
                target.fire(inertiaStatus.startEvent);

                inertiaStatus.target = target;
                inertiaStatus.targetElement = target._element;
                inertiaStatus.t0 = now;

                if (inertia) {
                    inertiaStatus.vx0 = pointerDelta[deltaSource + 'VX'];
                    inertiaStatus.vy0 = pointerDelta[deltaSource + 'VY'];
                    inertiaStatus.v0 = pointerSpeed;

                    calcInertia(inertiaStatus);

                    var page = getPageXY(event),
                        origin = getOriginXY(target, target._element),
                        statusObject;

                    page.x = page.x + (inertia? inertiaStatus.xe: 0) - origin.x;
                    page.y = page.y + (inertia? inertiaStatus.ye: 0) - origin.y;

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

                    if (options.snapEnabled && options.snap.endOnly
                        && contains(options.snap.actions, prepared)) {

                        var snap = setSnapping(event, statusObject);

                        if (snap.locked) {
                            dx += snap.dx;
                            dy += snap.dy;
                        }
                    }

                    if (checkRestrict(target) && target.options.restrict.endOnly) {
                        var restrict = setRestriction(event, statusObject);

                        if (restrict.restricted) {
                            dx += restrict.dx;
                            dy += restrict.dy;
                        }
                    }

                    inertiaStatus.modifiedXe += dx;
                    inertiaStatus.modifiedYe += dy;

                    inertiaStatus.i = reqFrame(inertiaFrame);
                }
                else {
                    inertiaStatus.smoothEnd = true;
                    inertiaStatus.xe = dx;
                    inertiaStatus.ye = dy;

                    inertiaStatus.sx = inertiaStatus.sy = 0;

                    inertiaStatus.i = reqFrame(smoothEndFrame);
                }

                inertiaStatus.active = true;
                return;
            }

            if ((checkSnap(target) && target.options.snap.endOnly)
                || (checkRestrict(target) && target.options.restrict.endOnly)) {
                // fire a move event at the snapped coordinates
                pointerMove(event, true);
            }
        }

        if (dragging) {
            endEvent = new InteractEvent(event, 'drag', 'end');

            var dropEvent,
                draggableElement = target._element,
                drop = getDrop(endEvent, draggableElement);

            dropTarget = drop.dropzone;
            dropElement = drop.element;

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

            var dropEvents = getDropEvents(event, endEvent);

            target.fire(endEvent);

            if (dropEvents.leave) { prevDropTarget.fire(dropEvents.leave); }
            if (dropEvents.enter) {     dropTarget.fire(dropEvents.enter); }
            if (dropEvents.drop ) {     dropTarget.fire(dropEvents.drop ); }
            if (dropEvents.deactivate) {
                fireActiveDrops(dropEvents.deactivate);
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

    // bound to the interactable context when a DOM event
    // listener is added to a selector interactable
    function delegateListener (event, useCapture) {
        var fakeEvent = {},
            delegated = delegatedEvents[event.type],
            element = event.target;

        useCapture = useCapture? true: false;

        // duplicate the event so that currentTarget can be changed
        for (var prop in event) {
            fakeEvent[prop] = event[prop];
        }

        fakeEvent.originalEvent = event;
        fakeEvent.preventDefault = preventOriginalDefault;

        // climb up document tree looking for selector matches
        while (element && element !== document) {
            for (var i = 0; i < delegated.selectors.length; i++) {
                var selector = delegated.selectors[i],
                    context = delegated.contexts[i];

                if (matchesSelector(element, selector)
                    && context === event.currentTarget
                    && nodeContains(context, element)) {

                    var listeners = delegated.listeners[i];

                    fakeEvent.currentTarget = element;

                    for (var j = 0; j < listeners.length; j++) {
                        if (listeners[j][1] !== useCapture) { continue; }

                        try {
                            listeners[j][0](fakeEvent);
                        }
                        catch (error) {
                            console.error('Error thrown from delegated listener: ' +
                                          '"' + selector + '" ' + event.type + ' ' +
                                          (listeners[j][0].name? listeners[j][0].name: ''));
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

    interactables.indexOfElement = dropzones.indexOfElement = function indexOfElement (element, context) {
        for (var i = 0; i < this.length; i++) {
            var interactable = this[i];

            if ((interactable.selector === element
                && (interactable._context === (context || document)))

                || (!interactable.selector && interactable._element === element)) {

                return i;
            }
        }
        return -1;
    };

    interactables.get = dropzones.get = function interactableGet (element, options) {
        return this[this.indexOfElement(element, options && options.context)];
    };

    interactables.forEachSelector = function (callback) {
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
    function interact (element, options) {
        return interactables.get(element, options) || new Interactable(element, options);
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

            this.selector = element;
            this._gesture = selectorGesture;

            if (options && options.context
                && (window.Node
                    ? options.context instanceof window.Node
                    : (isElement(options.context) || options.context === document))) {
                this._context = options.context;
            }
        }
        else if (isElement(element)) {
            if (PointerEvent) {
                events.add(this, pEventTypes.down, pointerDown );
                events.add(this, pEventTypes.move, pointerHover);

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

        interactables.push(this);

        this.set(options);
    }

    Interactable.prototype = {
        setOnEvents: function (action, phases) {
            if (action === 'drop') {
                var drop            = phases.ondrop             || phases.onDrop            || phases.drop,
                    dropactivate    = phases.ondropactivate     || phases.onDropActivate    || phases.dropactivate,
                    dropdeactivate  = phases.ondropdeactivate   || phases.onDropDeactivate  || phases.dropdeactivate,
                    dragenter       = phases.ondragenter        || phases.onDropEnter       || phases.dragenter,
                    dragleave       = phases.ondragleave        || phases.onDropLeave       || phases.dragleave,
                    dropmove        = phases.ondropmove         || phases.onDropMove        || phases.dropmove;

                if (typeof drop             === 'function') { this.ondrop           = drop; }
                if (typeof dropactivate     === 'function') { this.ondropactivate   = dropactivate; }
                if (typeof dropdeactivate   === 'function') { this.ondropdeactivate = dropdeactivate; }
                if (typeof dragenter        === 'function') { this.ondragenter      = dragenter; }
                if (typeof dragleave        === 'function') { this.ondragleave      = dragleave; }
                if (typeof dropmove         === 'function') { this.ondropmove       = dropmove; }
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
         |     onend  : function (event) {},
         |
         |     // the axis in which the first movement must be
         |     // for the drag sequence to start
         |     // 'xy' by default - any direction
         |     axis: 'x' || 'y' || 'xy'
         | });
        \*/
        draggable: function (options) {
            if (options instanceof Object) {
                this.options.draggable = true;
                this.setOnEvents('drag', options);

                if (/^x$|^y$|^xy$/.test(options.axis)) {
                    this.options.dragAxis = options.axis;
                }
                else if (options.axis === null) {
                    delete this.options.dragAxis;
                }

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

                this._dropElements = this.selector? null: [this._element];
                dropzones.push(this);

                return this;
            }

            if (typeof options === 'boolean') {
                if (options) {
                    this._dropElements = this.selector? null: [this._element];
                    dropzones.push(this);
                }
                else {
                    var index = indexOf(dropzones, this);

                    if (index !== -1) {
                        dropzones.splice(index, 1);
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
        dropCheck: function (event, draggable, draggableElement, rect) {
            if (!(rect = rect || this.getRect())) {
                return false;
            }

            var page = getPageXY(event),
                origin = getOriginXY(draggable, draggableElement),
                horizontal,
                vertical;

            page.x += origin.x;
            page.y += origin.y;

            horizontal = (page.x > rect.left) && (page.x < rect.right);
            vertical   = (page.y > rect.top ) && (page.y < rect.bottom);

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
         |     onend  : function (event) {},
         |
         |     axis   : 'x' || 'y' || 'xy' // default is 'xy'
         | });
        \*/
        resizable: function (options) {
            if (options instanceof Object) {
                this.options.resizable = true;
                this.setOnEvents('resize', options);

                if (/^x$|^y$|^xy$/.test(options.axis)) {
                    this.options.resizeAxis = options.axis;
                }
                else if (options.axis === null) {
                    this.options.resizeAxis = defaultOptions.resizeAxis;
                }

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
         |     endOnly: true,
         |
         |     // https://github.com/taye/interact.js/pull/72#issue-41813493
         |     elementOrigin: { x: 0, y: 0 }
         | });
        \*/
        snap: function (options) {
            var defaults = defaultOptions.snap;

            if (options instanceof Object) {
                var snap = this.options.snap;

                if (snap === defaults) {
                   snap = {};
                }

                snap.mode          = this.validateSetting('snap', 'mode'         , options.mode);
                snap.endOnly       = this.validateSetting('snap', 'endOnly'      , options.endOnly);
                snap.actions       = this.validateSetting('snap', 'actions'      , options.actions);
                snap.range         = this.validateSetting('snap', 'range'        , options.range);
                snap.paths         = this.validateSetting('snap', 'paths'        , options.paths);
                snap.grid          = this.validateSetting('snap', 'grid'         , options.grid);
                snap.gridOffset    = this.validateSetting('snap', 'gridOffset'   , options.gridOffset);
                snap.anchors       = this.validateSetting('snap', 'anchors'      , options.anchors);
                snap.elementOrigin = this.validateSetting('snap', 'elementOrigin', options.elementOrigin);

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
         |     resistance     : 16,
         |
         |     // the minimum launch speed (pixels per second) that results in inertiastart
         |     minSpeed       : 200,
         |
         |     // inertia will stop when the object slows down to this speed
         |     endSpeed       : 20,
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
            var defaults = defaultOptions.inertia;

            if (options instanceof Object) {
                var inertia = this.options.inertia;

                if (inertia === defaults) {
                   inertia = this.options.inertia = {
                       resistance       : defaults.resistance,
                       minSpeed         : defaults.minSpeed,
                       endSpeed         : defaults.endSpeed,
                       actions          : defaults.actions,
                       zeroResumeDelta  : defaults.zeroResumeDelta,
                       smoothEndDuration: defaults.smoothEndDuration
                   };
                }

                inertia.resistance        = this.validateSetting('inertia', 'resistance'       , options.resistance);
                inertia.minSpeed          = this.validateSetting('inertia', 'minSpeed'         , options.minSpeed);
                inertia.endSpeed          = this.validateSetting('inertia', 'endSpeed'         , options.endSpeed);
                inertia.actions           = this.validateSetting('inertia', 'actions'          , options.actions);
                inertia.zeroResumeDelta   = this.validateSetting('inertia', 'zeroResumeDelta'  , options.zeroResumeDelta);
                inertia.smoothEndDuration = this.validateSetting('inertia', 'smoothEndDuration', options.smoothEndDuration);

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

        getAction: function (event) {
            var action = this.defaultActionChecker(event);

            if (this.options.actionChecker) {
                action = this.options.actionChecker(event, action, this);
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
         - checker (function | null) #optional A function which takes a pointer event, defaultAction string and an interactable as parameters and returns 'drag' 'resize[axes]' or 'gesture' or null.
         = (Function | Interactable) The checker function or this Interactable
        \*/
        actionChecker: function (newValue) {
            if (typeof newValue === 'function') {
                this.options.actionChecker = newValue;

                return this;
            }

            if (newValue === null) {
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
         - element (Element) #optional The element to measure. Meant to be used for selector Interactables which don't have a specific element.
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

            if (this.selector && !(isElement(element))) {
                element = this._context.querySelector(this.selector);
            }

            return getElementRect(element);
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
         - newValue (boolean) #optional
         = (boolean | Interactable) The current setting or this Interactable
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
         * Interactable.preventDefault
         [ method ]
         *
         * Returns or sets whether to prevent the browser's default behaviour
         * in response to pointer events. Can be set to
         *  - `true` to always prevent
         *  - `false` to never prevent
         *  - `'auto'` to allow interact.js to try to guess what would be best
         *  - `null` to set to the default ('auto')
         *
         - newValue (boolean | string | null) #optional `true`, `false` or `'auto'`
         = (boolean | string | Interactable) The current setting or this Interactable
        \*/
        preventDefault: function (newValue) {
            if (typeof newValue === 'boolean' || newValue === 'auto') {
                this.options.preventDefault = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.preventDefault;

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
         **
         * Returns or sets the rectangles within which actions on this
         * interactable (after snap calculations) are restricted. By default,
         * restricting is relative to the pointer coordinates. You can change
         * this by setting the
         * [`elementRect`](https://github.com/taye/interact.js/pull/72).
         **
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
         |     endOnly: true,
         |
         |     // https://github.com/taye/interact.js/pull/72#issue-41813493
         |     elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
         | });
        \*/
        restrict: function (newValue) {
            if (newValue === undefined) {
                return this.options.restrict;
            }

            if (typeof newValue === 'boolean') {
                defaultOptions.restrictEnabled = newValue;
            }
            else if (newValue instanceof Object) {
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

                if (newValue.elementRect instanceof Object) {
                    newRestrictions.elementRect = newValue.elementRect;
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
         * Interactable.context
         [ method ]
         *
         * Get's the selector context Node of the Interactable. The default is `window.document`.
         *
         = (Node) The context Node of this Interactable
         **
        \*/
        context: function () {
            return this._context;
        },

        _context: document,

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
            if (typeof newValue === 'string') {     // CSS selector to match event.target
                document.querySelector(newValue);   // test the selector
                this.options.ignoreFrom = newValue;
                return this;
            }

            if (isElement(newValue)) {              // specific element
                this.options.ignoreFrom = newValue;
                return this;
            }

            if (newValue === null) {
                delete this.options.ignoreFrom;
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
            if (typeof newValue === 'string') {     // CSS selector to match event.target
                document.querySelector(newValue);   // test the selector
                this.options.allowFrom = newValue;
                return this;
            }

            if (isElement(newValue)) {              // specific element
                this.options.allowFrom = newValue;
                return this;
            }

            if (newValue === null) {
                delete this.options.allowFrom;
                return this;
            }

            return this.options.allowFrom;
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
            if (!(iEvent && iEvent.type) || !contains(eventTypes, iEvent.type)) {
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

            // convert to boolean
            useCapture = useCapture? true: false;

            if (contains(eventTypes, eventType)) {
                // if this type of event was never bound to this Interactable
                if (!(eventType in this._iEvents)) {
                    this._iEvents[eventType] = [listener];
                }
                // if the event listener is not already bound for this type
                else if (!contains(this._iEvents[eventType], listener)) {
                    this._iEvents[eventType].push(listener);
                }
            }
            // delegated event for selector
            else if (this.selector) {
                if (!delegatedEvents[eventType]) {
                    delegatedEvents[eventType] = {
                        selectors: [],
                        contexts : [],
                        listeners: []
                    };

                    // add delegate listener functions
                    events.addToElement(this._context, eventType, delegateListener);
                    events.addToElement(this._context, eventType, delegateUseCapture, true);
                }

                var delegated = delegatedEvents[eventType],
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
            if (contains(eventTypes, eventType)) {
                eventList = this._iEvents[eventType];

                if (eventList && (index = indexOf(eventList, listener)) !== -1) {
                    this._iEvents[eventType].splice(index, 1);
                }
            }
            // delegated event
            else if (this.selector) {
                var delegated = delegatedEvents[eventType],
                    matchFound = false;

                if (!delegated) { return this; }

                // count from last index of delegated to 0
                for (index = delegated.selectors.length - 1; index >= 0; index--) {
                    // look for matching selector and context Node
                    if (delegated.selectors[index] === this.selector
                        && delegated.contexts[index] === this._context) {

                        var listeners = delegated.listeners[index];

                        // each item of the listeners array is an array: [function, useCaptureFlag]
                        for (var i = listeners.length - 1; i >= 0; i--) {
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
                                    events.removeFromElement(this._context, eventType, delegateListener);
                                    events.removeFromElement(this._context, eventType, delegateUseCapture, true);

                                    // remove the arrays if they are empty
                                    if (!delegated.selectors.length) {
                                        delegatedEvents[eventType] = null;
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
                events.remove(this, listener, useCapture);
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

            this.draggable ('draggable'  in options? options.draggable : this.options.draggable );
            this.dropzone  ('dropzone'   in options? options.dropzone  : this.options.dropzone  );
            this.resizable ('resizable'  in options? options.resizable : this.options.resizable );
            this.gesturable('gesturable' in options? options.gesturable: this.options.gesturable);

            var settings = [
                    'accept', 'actionChecker', 'allowFrom', 'autoScroll', 'deltaSource',
                    'dropChecker', 'ignoreFrom', 'inertia', 'origin', 'preventDefault',
                    'rectChecker', 'restrict', 'snap', 'styleCursor'
                ];

            for (var i = 0, len = settings.length; i < len; i++) {
                var setting = settings[i];

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
            events.remove(this, 'all');

            if (typeof this.selector !== 'string') {
                events.remove(this, 'all');
                if (this.options.styleCursor) {
                    this._element.style.cursor = '';
                }

                if (this._gesture) {
                    this._gesture.target = null;
                }
            }
            else {
                // remove delegated events
                for (var type in delegatedEvents) {
                    var delegated = delegatedEvents[type];

                    for (var i = 0; i < delegated.selectors.length; i++) {
                        if (delegated.selectors[i] === this.selector
                            && delegated.contexts[i] === this._context) {

                            delegated.selectors.splice(i, 1);
                            delegated.contexts .splice(i, 1);
                            delegated.listeners.splice(i, 1);

                            // remove the arrays if they are empty
                            if (!delegated.selectors.length) {
                                delegatedEvents[type] = null;
                            }
                        }

                        events.removeFromElement(this._context, type, delegateListener);
                        events.removeFromElement(this._context, type, delegateUseCapture, true);

                        break;
                    }
                }
            }

            this.dropzone(false);

            interactables.splice(indexOf(interactables, this), 1);

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
    interact.isSet = function(element, options) {
        return interactables.indexOfElement(element, options && options.context) !== -1;
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
        if (contains(eventTypes, type)) {
            // if this type of event was never bound
            if (!globalEvents[type]) {
                globalEvents[type] = [listener];
            }

            // if the event listener is not already bound for this type
            else if (!contains(globalEvents[type], listener)) {

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
        if (!contains(eventTypes, type)) {
            events.remove(docTarget, type, listener, useCapture);
        }
        else {
            var index;

            if (type in globalEvents
                && (index = indexOf(globalEvents[type], listener)) !== -1) {
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
                event[prop] = pointerEvent[prop];
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
            matches               : matches,

            prevCoords            : prevCoords,
            downCoords            : startCoords,

            pointerIds            : pointerIds,
            pointerMoves          : pointerMoves,
            addPointer            : addPointer,
            removePointer         : removePointer,
            recordPointers        : recordPointers,
            recordTouches         : recordTouches,

            snap                  : snapStatus,
            restrict              : restrictStatus,
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
            defaultActionChecker  : defaultActionChecker,

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
     o     actions: ['drag', 'resizex', 'resizey', 'resizexy'], an array of action types that can snapped (['drag'] by default) (no gesture)
     o     grid   : {
     o         x, y: the distances between the grid lines,
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
            if (options.actions       instanceof Array ) { snap.actions       = options.actions;       }
            if (options.anchors       instanceof Array ) { snap.anchors       = options.anchors;       }
            if (options.grid          instanceof Object) { snap.grid          = options.grid;          }
            if (options.gridOffset    instanceof Object) { snap.gridOffset    = options.gridOffset;    }
            if (options.elementOrigin instanceof Object) { snap.elementOrigin = options.elementOrigin; }

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
            x         : snapStatus.snappedX,
            y         : snapStatus.snappedY,
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
            if (typeof options.smoothEndDuration === 'number' ) { inertia.smoothEndDuration = options.smoothEndDuration;}
            if (typeof options.zeroResumeDelta   === 'boolean') { inertia.zeroResumeDelta   = options.zeroResumeDelta  ;}

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
            actions: inertia.actions,
            zeroResumeDelta: inertia.zeroResumeDelta
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

            // prevent Default only if were previously interacting
            if (event && typeof event.preventDefault === 'function') {
                checkAndPreventDefault(event, target);
            }

            if (dragging) {
                activeDrops.dropzones = activeDrops.elements = activeDrops.rects = null;

                for (var i = 0; i < dropzones.length; i++) {
                    if (dropzones[i].selector) {
                        dropzones[i]._dropElements = null;
                    }
                }
            }

            clearTargets();
        }

        pointerIds.splice(0);
        pointerMoves.splice(0);

        pointerIsDown = snapStatus.locked = dragging = resizing = gesturing = false;
        prepared = prevEvent = null;
        inertiaStatus.resumeDx = inertiaStatus.resumeDy = 0;

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
            //if (dragging && dynamicDrop !== newValue && !newValue) {
                //calcRects(dropzones);
            //}

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

        if (typeof newValue === 'boolean') {
            defaultOptions.restrictEnabled = newValue;
        }
        else if (newValue instanceof Object) {
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

            if (newValue.elementRect instanceof Object) {
                defaults.elementRect = newValue.elementRect;
            }

            defaultOptions.restrictEnabled = true;
        }
        else if (newValue === null) {
           defaults.drag = defaults.resize = defaults.gesture = null;
           defaults.endOnly = false;
        }

        return this;
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
        if (typeof newValue === 'number') {
            defaultOptions.pointerMoveTolerance = newValue;

            return this;
        }

        return defaultOptions.pointerMoveTolerance;
    };

    if (PointerEvent) {
        if (PointerEvent === window.MSPointerEvent) {
            pEventTypes = {
                up: 'MSPointerUp', down: 'MSPointerDown', over: 'MSPointerOver',
                out: 'MSPointerOut', move: 'MSPointerMove', cancel: 'MSPointerCancel' };
        }
        else {
            pEventTypes = {
                up: 'pointerup', down: 'pointerdown', over: 'pointerover',
                out: 'pointerout', move: 'pointermove', cancel: 'pointercancel' };
        }

        if (GestureEvent === window.MSGestureEvent) {
            gEventTypes = {
                start: 'MSGestureStart', change: 'MSGestureChange', inertia: 'MSInertiaStart', end: 'MSGestureEnd' };
        }
        else {
            gEventTypes = {
                start: 'gesturestart', change: 'gesturechange', inertia: 'inertiastart', end: 'gestureend' };
        }


        events.add(docTarget, pEventTypes.up, collectTaps);

        events.add(docTarget, pEventTypes.down   , selectorDown);
        events.add(docTarget, gEventTypes.change , pointerMove );
        events.add(docTarget, gEventTypes.end    , pointerUp   );
        events.add(docTarget, gEventTypes.inertia, pointerUp   );
        events.add(docTarget, pEventTypes.over   , pointerOver );
        events.add(docTarget, pEventTypes.out    , pointerOut  );

        events.add(docTarget, pEventTypes.move  , recordPointers);
        events.add(docTarget, pEventTypes.up    , recordPointers);
        events.add(docTarget, pEventTypes.cancel, recordPointers);

        // fix problems of wrong targets in IE
        events.add(docTarget, pEventTypes.up, function () {
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

        events.add(docTarget, 'touchmove'  , recordTouches);
        events.add(docTarget, 'touchend'   , recordTouches);
        events.add(docTarget, 'touchcancel', recordTouches);

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
            events.add(parentDocTarget   , 'MSPointerUp'  , pointerUp);
            events.add(parentWindowTarget, 'blur'         , pointerUp);
        }
    }
    catch (error) {
        interact.windowParentError = error;
    }

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

    // For IE's lack of Event#preventDefault
    events.add(docTarget, 'selectstart', function (event) {
        if (dragging || resizing || gesturing) {
            checkAndPreventDefault(event, target);
        }
    });

    function matchesSelector (element, selector, nodeList) {
        if (ie8MatchesSelector) {
            return ie8MatchesSelector(element, selector, nodeList);
        }

        return element[prefixedMatchesSelector](selector);
    }

    // For IE8's lack of an Element#matchesSelector
    // taken from http://tanalin.com/en/blog/2012/12/matches-selector-ie8/ and modified
    if (!(prefixedMatchesSelector in Element.prototype) || typeof (Element.prototype[prefixedMatchesSelector]) !== 'function') {
        ie8MatchesSelector = function (element, selector, elems) {
            elems = elems || element.parentNode.querySelectorAll(selector);

            for (var i = 0, len = elems.length; i < len; i++) {
                if (elems[i] === element) {
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

    /* global exports: true, module, define */

    // http://documentcloud.github.io/underscore/docs/underscore.html#section-11
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = interact;
        }
        exports.interact = interact;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define('interact', function() {
            return interact;
        });
    }
    else {
        window.interact = interact;
    }

} (this));
