/**
 * interact.js v1.0.8
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

        downTime  = 0,         // the timeStamp of the starting event
        downEvent = null,      // mousedown/touchstart event
        prevEvent = null,      // previous action event

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
            resizeable  : false,
            squareResize: false,
            gestureable : false,

            styleCursor : true,

            // aww snap
            snap: {
                mode        : 'grid',
                actions     : ['drag'],
                range       : Infinity,
                grid        : { x: 100, y: 100 },
                gridOffset  : { x:   0, y:   0 },
                anchors     : [],
                paths       : [],

                arrayTypes  : /^anchors$|^paths$|^actions$/,
                objectTypes : /^grid$|^gridOffset$/,
                stringTypes : /^mode$/,
                numberTypes : /^range$/
            },
            snapEnabled : false,

            restrictions: {},

            autoScroll: {
                container   : window,  // the item that is scrolled
                margin      : 60,
                interval    : 20,      // pause in ms between each scroll pulse
                distance    : 10,      // the distance in x and y that the page is scrolled

                elementTypes: /^container$/,
                numberTypes : /^range$|^interval$|^distance$/
            },
            autoScrollEnabled: false,

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
                        var rect = interact(options.container).getRect();

                        left   = event.clientX < rect.left   + autoScroll.margin;
                        top    = event.clientY < rect.top    + autoScroll.margin;
                        right  = event.clientX > rect.right  - autoScroll.margin;
                        bottom = event.clientY > rect.bottom - autoScroll.margin;
                    }

                    autoScroll.x = autoScroll.distance * (right ? 1: left? -1: 0);
                    autoScroll.y = autoScroll.distance * (bottom? 1:  top? -1: 0);

                    if (!autoScroll.isScrolling) {
                        // set the autoScroll properties to those of the target
                        autoScroll.margin   = options.margin;
                        autoScroll.distance = options.distance;
                        autoScroll.interval = options.interval;

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

            'tap'
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

    function setPrevXY (event) {
        prevX = event.pageX;
        prevY = event.pageY;

        prevClientX = event.clientX;
        prevClientY = event.clientY;

        prevEvent = event;
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
        var page;

        // Opera Mobile handles the viewport and scrolling oddly
        if (isOperaMobile) {
            page = getXY('screen', event);

            page.x += window.scrollX;
            page.y += window.scrollY;
        }
        else if (/gesture|inertia/i.test(event.type)) {
            page = getXY('client', event);

            page.x += document.documentElement.scrollLeft;
            page.y += document.documentElement.scrollTop;

            return page;
        }
        else {
            page = getXY('page', event);
        }

        return page;
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

    function touchBBox (event) {
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
        var deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            dx = event.touches[0][sourceX],
            dy = event.touches[0][sourceY];

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0][sourceX];
            dy -= event.changedTouches[0][sourceY];
        }
        else {
            dx -= event.touches[1][sourceX];
            dy -= event.touches[1][sourceY];
        }

        return Math.sqrt(dx * dx + dy * dy);
    }

    function touchAngle (event, prevAngle) {
        var deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            dx = event.touches[0][sourceX],
            dy = event.touches[0][sourceY];

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0][sourceX];
            dy -= event.changedTouches[0][sourceY];
        }
        else {
            dx -= event.touches[1][sourceX];
            dy -= event.touches[1][sourceY];
        }

        var angle = 180 * Math.atan(dy / dx) / Math.PI;

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

    function getOriginXY (interactable) {
        interactable = interactable || target;

        var origin = interactable
                ? interactable.options.origin
                : defaultOptions.origin;

        if (origin instanceof Element)  {
            origin = interact(origin).getRect();

            origin.x = origin.left;
            origin.y = origin.top;
        }
        else if (typeof origin === 'function') {
            origin = origin(interactable && interactable._element);
        }

        return origin;
    }

    function calcRects (interactableList) {
        for (var i = 0, len = interactableList.length; i < len; i++) {
            interactableList[i].rect = interactableList[i].getRect();
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
                if (current.options.accept instanceof Element) {
                    if (current.options.accept !== element) {
                        continue;
                    }
                }
                else if (typeof current.options.accept === 'string') {
                    if (!element[matchesSelector](current.options.accept)) {
                        continue;
                    }
                }

                if (element !== current._element && current.dropCheck(event)) {
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
                        if (selector.options.accept instanceof Element) {
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
                            && selector.dropCheck(event)) {

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
            origin = getOriginXY(target);

        element = element || target._element;

        if (action === 'gesture') {
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

            if (target.options.snapEnabled && target.options.snap.actions.indexOf(action) !== -1) {
                var snap = options.snap;

                this.snap = {
                    mode   : snap.mode,
                    anchors: snapStatus.anchors,
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
                    if (snap.mode === 'path') {
                        if (snapStatus.xInRange) {
                            page.x += snapStatus.dx;
                            client.x += snapStatus.dx;
                        }
                        if (snapStatus.yInRange) {
                            page.y += snapStatus.dy;
                            client.y += snapStatus.dy;
                        }
                    }
                    else {
                        page.x += snapStatus.dx;
                        page.y += snapStatus.dy;
                        client.x += snapStatus.dx;
                        client.y += snapStatus.dy;
                    }
                }
            }
        }

        if (target.options.restrictions[action]) {
            var restriction = target.options.restrictions[action],
                rect,
                originalPageX = page.x,
                originalPageY = page.y;

            if (restriction instanceof Element) {
                rect = interact(restriction).getRect();
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

            page.x = Math.max(Math.min(rect.right , page.x), rect.left);
            page.y = Math.max(Math.min(rect.bottom, page.y), rect.top );

            var restrictDx = page.x - originalPageX,
                restrictDy = page.y - originalPageY;

            client.x += restrictDx;
            client.y += restrictDy;
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
        this.target    = element;
        this.t0        = downTime;
        this.type      = action + (phase || '');

        if (related) {
            this.relatedTarget = related;
        }

        // end event dx, dy is difference between start and end points
        if (phase === 'end' || action === 'drop') {
            if (deltaSource === 'client') {
                this.dx = client.x - x0;
                this.dy = client.y - y0;
            }
            else {
                this.dx = page.x - x0;
                this.dy = page.y - y0;
            }
        }
        else {
            if (deltaSource === 'client') {
                this.dx = client.x - prevClientX;
                this.dy = client.y - prevClientY;
            }
            else {
                this.dx = page.x - prevX;
                this.dy = page.y - prevY;
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
            this.touches  = event.touches;
            this.distance = touchDistance(event);
            this.box      = touchBBox(event);

            if (phase === 'start') {
                this.scale = 1;
                this.ds = 0;

                this.angle = touchAngle(event);
                this.da = 0;
            }
            else {
                this.scale = this.distance / gesture.startDistance;
                this.angle = touchAngle(event, gesture.prevAngle);

                if (phase === 'end') {
                    this.da = this.angle - gesture.startAngle;
                    this.ds = this.scale - 1;
                }
                else {
                    this.da = this.angle - gesture.prevAngle;
                    this.ds = this.scale - gesture.prevScale;
                }
            }
        }

        if (phase === 'start') {
            this.timeStamp = downTime;
            this.dt        = 0;
            this.duration  = 0;
            this.speed     = 0;
        }
        else {
            this.timeStamp = new Date().getTime();
            this.dt        = this.timeStamp - prevEvent.timeStamp;
            this.duration  = this.timeStamp - downTime;

            // change in time in seconds
            // use event sequence duration for end events
            // => average speed of the event sequence
            var dt = (phase === 'end'? this.duration: this.dt) / 1000;

            // speed in pixels per second
            this.speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy) / dt;
        }
    }

    InteractEvent.prototype = {
        preventDefault: blank,
        stopImmediatePropagation: function (event) {
            imPropStopped = true;
        },
        stopPropagation: blank
    };

    // Check if action is enabled globally and the current target supports it
    // If so, return the validated action. Otherwise, return null
    function validateAction (action, interactable) {
        if (typeof action !== 'string') { return null; }

        interactable = interactable || target;

        var actionType = action.indexOf('resize') !== -1? 'resize': action,
            options = (interactable || target).options;

        if ((  (actionType  === 'resize'   && options.resizeable )
            || (action      === 'drag'     && options.draggable  )
            || (action      === 'gesture'  && options.gestureable))
            && actionIsEnabled[actionType]) {

            if (action === 'resize' || action === 'resizeyx') {
                action = 'resizexy';
            }

            return action;
        }
        return null;
    }

    function selectorDown (event, forceAction) {
        var action;

        // do nothing if interacting
        if (dragging || resizing || gesturing) {
            return;
        }

        if (matches.length && /mousedown|pointerdown/i.test(event.type)) {
            action = validateSelector(event, matches);
        }
        else {
            var selector,
                element = (event.target instanceof SVGElementInstance
                ? event.target.correspondingUseElement
                : event.target),
                elements;

            while (element !== document && !action) {
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
            return pointerDown(event, action);
        }
    }

    // Determine action to be performed on next pointerMove and add appropriate
    // style and event Liseners
    function pointerDown (event, forceAction) {
        // If it is the second touch of a multi-touch gesture, keep the target
        // the same if a target was set by the first touch
        // Otherwise, set the target if the pointer is not down
        if ((event.touches && event.touches.length < 2 && !target)
            || !pointerIsDown) {

            target = interactables.get(event.currentTarget);
        }

        var options = target && target.options;

        if (target && !(dragging || resizing || gesturing)) {
            var action = validateAction(forceAction || target.getAction(event)),
                average,
                page,
                client,
                origin = getOriginXY(target);

            if (PointerEvent && event instanceof PointerEvent) {
                if (target.selector) {
                    selectorGesture.addPointer(event.pointerId);
                }
                else {
                    // Dom modification seems to reset the gesture target
                    if (!target._gesture.target) {
                        target._gesture.target = target._element;
                    }

                    target._gesture.addPointer(event.pointerId);
                }
            }

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

            if (!action) {
                return event;
            }

            // Register that the pointer is down after succesfully validating
            // action. This way, a new target can be gotten in the next
            // downEvent propagation
            pointerIsDown = true;
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

            prepared = action;

            x0 = page.x - origin.x;
            y0 = page.y - origin.y;
            clientX0 = client.x - origin.x;
            clientY0 = client.y - origin.y;

            snapStatus.x = null;
            snapStatus.y = null;

            event.preventDefault();
            downTime = new Date().getTime();
            downEvent = event;
        }
    }

    function pointerMove (event) {
        if (pointerIsDown) {
            if (x0 === prevX && y0 === prevY) {
                pointerWasMoved = true;
            }

            if (prepared && target) {

                if (target.options.snapEnabled && target.options.snap.actions.indexOf(prepared) !== -1) {
                    var snap = target.options.snap,
                        page = getPageXY(event),
                        origin = getOriginXY(target),
                        closest,
                        range,
                        inRange,
                        snapChanged,
                        distX,
                        distY,
                        distance,
                        i, len;


                    snapStatus.realX = page.x;
                    snapStatus.realY = page.y;

                    page.x -= origin.x;
                    page.y -= origin.y;

                    // change to infinite range when range is negative
                    if (snap.range < 0) { snap.range = Infinity; }

                    if (snap.mode === 'anchor' && snap.anchors.length) {
                        closest = {
                            anchor: null,
                            distance: 0,
                            range: 0,
                            distX: 0,
                            distY: 0
                        };

                        for (i = 0, len = snap.anchors.length; i < len; i++) {
                            var anchor = snap.anchors[i];

                            range = typeof anchor.range === 'number'? anchor.range: snap.range;

                            distX = anchor.x - page.x;
                            distY = anchor.y - page.y;
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

                                closest.anchor = anchor;
                                closest.distance = distance;
                                closest.range = range;
                                closest.inRange = inRange;
                                closest.distX = distX;
                                closest.distY = distY;

                                snapStatus.range = range;
                            }
                        }

                        inRange = closest.inRange;
                        snapChanged = (closest.anchor.x !== snapStatus.x || closest.anchor.y !== snapStatus.y);

                        snapStatus.x = closest.anchor.x;
                        snapStatus.y = closest.anchor.y;
                        snapStatus.dx = closest.distX;
                        snapStatus.dy = closest.distY;
                        target.options.snap.anchors.closest = snapStatus.anchors.closest = closest.anchor;
                    }
                    else if (snap.mode === 'grid') {
                        var gridx = Math.round((page.x - snap.gridOffset.x) / snap.grid.x),
                            gridy = Math.round((page.y - snap.gridOffset.y) / snap.grid.y),

                            newX = gridx * snap.grid.x + snap.gridOffset.x,
                            newY = gridy * snap.grid.y + snap.gridOffset.y;

                        distX = newX - page.x;
                        distY = newY - page.y;

                        distance = Math.sqrt(distX * distX + distY * distY);

                        inRange = distance < snap.range;
                        snapChanged = (newX !== snapStatus.x || newY !== snapStatus.y);

                        snapStatus.x = newX;
                        snapStatus.y = newY;
                        snapStatus.dx = distX;
                        snapStatus.dy = distY;

                        snapStatus.range = snap.range;
                    }
                    if (snap.mode === 'path' && snap.paths.length) {
                        closest = {
                            path: {},
                            distX: 0,
                            distY: 0,
                            range: 0
                        };

                        for (i = 0, len = snap.paths.length; i < len; i++) {
                            var path = snap.paths[i],
                                snapToX = false,
                                snapToY = false,
                                pathXY = path,
                                pathX,
                                pathY;

                            if (typeof path === 'function') {
                                pathXY = path(page.x, page.y);
                            }

                            if (typeof pathXY.x === 'number') {
                                pathX = pathXY.x;
                                snapToX = true;
                            }
                            else {
                                pathX = page.x;
                            }

                            if (typeof pathXY.y === 'number') {
                                pathY = pathXY.y;
                                snapToY = true;
                            }
                            else {
                                pathY = page.y;
                            }

                            range = typeof pathXY.range === 'number'? pathXY.range: snap.range;

                            distX = pathX - page.x;
                            distY = pathY - page.y;

                            var xInRange = Math.abs(distX) < range && snapToX,
                                yInRange = Math.abs(distY) < range && snapToY;

                            // Infinite paths count as being out of range
                            // compared to non infinite ones that are in range
                            if (range === Infinity && closest.xInRange && closest.range !== Infinity) {
                                xInRange = false;
                            }

                            if (!('x' in closest.path) || (xInRange
                                // is the closest path in range?
                                ? (closest.xInRange && range !== Infinity)
                                    // the pointer is relatively deeper in this path
                                    ? distance / range < closest.distX / closest.range
                                    //the pointer is closer to this path
                                    : Math.abs(distX) < Math.abs(closest.distX)
                                // The other is not in range and the pointer is closer to this path
                                : (!closest.xInRange && Math.abs(distX) < Math.abs(closest.distX)))) {

                                if (range === Infinity) {
                                    xInRange = true;
                                }

                                closest.path.x   = pathX;
                                closest.distX    = distX;
                                closest.xInRange = xInRange;
                                closest.range    = range;

                                snapStatus.range = range;
                            }

                            // Infinite paths count as being out of range
                            // compared to non infinite ones that are in range
                            if (range === Infinity && closest.yInRange && closest.range !== Infinity) {
                                yInRange = false;
                            }
                            if (!('y' in closest.path) || (yInRange
                                // is the closest path in range?
                                ? (closest.yInRange && range !== Infinity)
                                    // the pointer is relatively deeper in this path
                                    ? distance / range < closest.distY / closest.range
                                    //the pointer is closer to this path
                                    : Math.abs(distY) < Math.abs(closest.distY)
                                // The other is not in range and the pointer is closer to this path
                                : (!closest.yInRange && Math.abs(distY) < Math.abs(closest.distY)))) {

                                if (range === Infinity) {
                                    yInRange = true;
                                }

                                closest.path.y   = pathY;
                                closest.distY    = distY;
                                closest.yInRange = yInRange;
                                closest.range    = range;

                                snapStatus.range = range;
                            }
                        }

                        inRange = closest.xInRange || closest.yInRange;

                        if (closest.xInRange && closest.yInRange && (!snapStatus.xInRange || !snapStatus.yInRange)) {
                            snapChanged = true;
                        }
                        else {
                            snapChanged = (!closest.xInRange || !closest.yInRange || closest.path.x !== snapStatus.x || closest.path.y !== snapStatus.y);
                        }

                        snapStatus.x = closest.path.x;
                        snapStatus.y = closest.path.y;
                        snapStatus.dx = closest.distX;
                        snapStatus.dy = closest.distY;

                        snapStatus.xInRange = closest.xInRange;
                        snapStatus.yInRange = closest.yInRange;

                        target.options.snap.paths.closest = snapStatus.paths.closest = closest.path;
                    }

                    if ((snapChanged || !snapStatus.locked) && inRange)  {
                        snapStatus.locked = true;

                        // if snap is locked at the start of an action
                        if (!(dragging || resizing || gesturing)) {
                            // set the starting point to be the snap coorinates
                            var p = getPageXY(event),
                                c = getClientXY(event);

                            x0 = p.x - origin.x + snapStatus.dx;
                            y0 = p.y - origin.y + snapStatus.dy;

                            clientX0 = c.x - origin.x + snapStatus.dx;
                            clientY0 = c.y - origin.y + snapStatus.dy;
                        }

                        actions[prepared].moveListener(event);
                    }
                    else if (snapChanged || !inRange) {
                        snapStatus.locked = false;
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
            dropTarget,
            leaveDropTarget;

        if (!dragging) {
            setPrevXY(downEvent);

            dragEvent = new InteractEvent(downEvent, 'drag', 'start');
            dragging = true;

            target.fire(dragEvent);

            if (!dynamicDrop) {
                calcRects(dropzones);
                for (var i = 0; i < selectorDZs.length; i++) {
                    selectorDZs[i]._elements = document.querySelectorAll(selectorDZs[i].selector);
                }
            }

            setPrevXY(dragEvent);
        }

        var draggableElement = target._element,
            drop = getDrop(event, draggableElement);

        dragEvent  = new InteractEvent(event, 'drag', 'move');

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

        setPrevXY(dragEvent);
    }

    function resizeMove (event) {
        event.preventDefault();

        var resizeEvent;

        if (!resizing) {
            setPrevXY(downEvent);

            resizeEvent = new InteractEvent(downEvent, 'resize', 'start');
            target.fire(resizeEvent);

            target.fire(resizeEvent);
            resizing = true;

            setPrevXY(resizeEvent);
        }

        resizeEvent = new InteractEvent(event, 'resize', 'move');
        target.fire(resizeEvent);

        setPrevXY(resizeEvent);
    }

    function gestureMove (event) {
        if (!event.touches || event.touches.length < 2) {
            return;
        }

        event.preventDefault();

        var gestureEvent;

        if (!gesturing) {
            setPrevXY(downEvent);

            gestureEvent = new InteractEvent(downEvent, 'gesture', 'start');
            gestureEvent.ds = 0;

            gesture.startDistance = gesture.prevDistance = gestureEvent.distance;
            gesture.startAngle = gesture.prevAngle = gestureEvent.angle;
            gesture.scale = 1;

            gesturing = true;

            target.fire(gestureEvent);

            setPrevXY(gestureEvent);
        }

        gestureEvent = new InteractEvent(event, 'gesture', 'move');
        gestureEvent.ds = gestureEvent.scale - gesture.scale;

        target.fire(gestureEvent);

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

    // End interact move events and stop auto-scroll
    function pointerUp (event) {
        var endEvent;

        if (event.touches && event.touches.length >= 2) {
            return;
        }

        if (dragging) {
            endEvent = new InteractEvent(event, 'drag', 'end');

            var dropEvent,
                draggableElement = target._element,
                drop = getDrop(event, draggableElement);

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
        else if (/mouseup|touchend|pointerup/i.test(event.type) && target && pointerIsDown && !pointerWasMoved) {
            var tap = {};

            for (var prop in event) {
                    tap[prop] = event[prop];
            }

            tap.currentTarget = target._element;
            tap.type = 'tap';
            target.fire(tap);
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
        while (element !== document) {
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
     |     .gestureable(true)
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
        }
        else {
            if(element instanceof Element) {
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
                    end       = phases.onend       || phases.onEnd       || phases.end,

                action = 'on' + action;

                if (typeof start === 'function') { this[action + 'start'] = start; }
                if (typeof move  === 'function') { this[action + 'move' ] = move ; }
                if (typeof end   === 'function') { this[action + 'end'  ] = end  ; }
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
        dropCheck: function (event) {
            var page = getPageXY(event),
                horizontal,
                vertical;

            if (dynamicDrop) {
                this.rect = this.getRect();
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
            if (newValue instanceof Element) {
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
         * Interactable.resizeable
         [ method ]
         *
         * Gets or sets whether resize actions can be performed on the
         * Interactable
         *
         = (boolean) Indicates if this can be the target of resize elements
         | var isResizeable = interact('input[type=text]').resizeable();
         * or
         - options (boolean | object) #optional true/false or An object with event listeners to be fired on resize events (object makes the Interactable resizeable)
         = (object) This Interactable
         | interact(element).resizeable({
         |     onstart: function (event) {},
         |     onmove : function (event) {},
         |     onend  : function (event) {}
         | });
        \*/
        resizeable: function (options) {
            if (options instanceof Object) {
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
         * Interactable.gestureable
         [ method ]
         *
         * Gets or sets whether multitouch gestures can be performed on the
         * Interactable's element
         *
         = (boolean) Indicates if this can be the target of gesture events
         | var isGestureable = interact(element).gestureable();
         * or
         - options (boolean | object) #optional true/false or An object with event listeners to be fired on gesture events (makes the Interactable gestureable)
         = (object) this Interactable
         | interact(element).gestureable({
         |     onmove: function (event) {}
         | });
        \*/
        gestureable: function (options) {
            if (options instanceof Object) {
                this.options.gestureable = true;
                this.setOnEvents('gesture', options);

                return this;
            }

            if (typeof options === 'boolean') {
                this.options.gestureable = options;

                return this;
            }

            if (options === null) {
                delete this.options.gestureable;

                return this;
            }

            return this.options.gestureable;
        },

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

                autoScroll.margin    = this.validateSetting('autoScroll', 'margin'   , options.margin);
                autoScroll.distance  = this.validateSetting('autoScroll', 'distance' , options.distance);
                autoScroll.interval  = this.validateSetting('autoScroll', 'interval' , options.interval);
                autoScroll.container = this.validateSetting('autoScroll', 'container', options.container);

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
         |     mode        : 'grid',
         |     range       : Infinity,
         |     grid        : { x: 100, y: 100 },
         |     gridOffset  : { x:   0, y:   0 },
         | });
         |
         | interact('.handle').snap({
         |     mode        : 'anchor',
         |     anchors     : [
         |         { x: 100, y: 100, range: 25 },
         |         { x: 200, y: 200 }
         |     ]
         | });
         |
         | interact(document.querySelector('#thing')).snap({
         |     mode : 'path',
         |     paths: [
         |         {
         |             x: 100,
         |             y: 100,
         |             range: 25
         |         },
         |         function (x, y) {
         |             return {
         |                 x: x,
         |                 y: (75 + 50 * Math.sin(x * 0.04)),
         |                 range: 40
         |             };
         |         }]
         | })
        \*/
        snap: function (options) {
            var defaults = defaultOptions.snap;

            if (options instanceof Object) {
                var snap = this.options.snap;

                if (snap === defaults) {
                   snap = this.options.snap = {
                       mode      : defaults.mode,
                       range     : defaults.range,
                       grid      : defaults.grid,
                       gridOffset: defaults.gridOffset,
                       anchors   : defaults.anchors
                   };
                }

                snap.mode       = this.validateSetting('snap', 'mode'      , options.mode);
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
            if (this.selector && !(this._element instanceof Element)) {
                this._element = document.querySelector(this.selector);
            }

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
                height: clientRect.heigh || clientRect.bottom - clientRect.top
            };
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
            if (newValue instanceof Object) {
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
         |     // the rect will be `interactable(element.parentNode).getRect()`
         |     drag: element.parentNode,
         |
         |     // x and y are relative to the the interactable's origin
         |     resize: { x: 100, y: 100, width: 200, height: 200 }
         | })
        \*/
        restrict: function (newValue) {
            if (newValue === undefined) {
                return this.options.restrictions;
            }

            if (newValue instanceof Object) {
                this.options.restrictions = newValue;
            }

            else if (newValue === null) {
               delete this.options.restrictions;
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

                if ('elementTypes' in defaults && defaults.elementTypes.test(option)) {
                    if (value instanceof Element) { return value; }
                    else {
                        return (option in current && current[option] instanceof Element
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

                            for (len = listeners.length; i < len && !imPropStopped; i++) {
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
            this.resizeable ('resizeable'  in options? options.resizeable : this.options.resizeable );
            this.gestureable('gestureable' in options? options.gestureable: this.options.gestureable);

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

            prevX                 : prevX,
            prevY                 : prevY,
            x0                    : x0,
            y0                    : y0,

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
            delegatedEvents       : delegatedEvents,

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

    // expose the functions used to caluclate multi-touch properties
    interact.getTouchAverage  = touchAverage;
    interact.getTouchBBox     = touchBBox;
    interact.getTouchDistance = touchDistance;
    interact.getTouchAngle    = touchAngle;

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

            if (typeof options.mode  === 'string') { snap.mode  = options.mode;  }
            if (typeof options.range === 'number') { snap.range = options.range; }
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
                selectorGesture.stop();
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

        pointerIsDown = snapStatus.locked = dragging = resizing = gesturing = false;
        pointerWasMoved = true;
        prepared = downEvent = prevEvent = null;

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
    interact.restrict = function (newValue, noArray) {
        if (newValue === undefined) {
            return defaultOptions.restrictions;
        }

        if (newValue instanceof Object) {
            defaultOptions.restrictions = newValue;
        }

        else if (newValue === null) {
           defaultOptions.restrictions = {};
        }

        return this;
    };

    if (PointerEvent) {
        events.add(docTarget, 'pointerdown'    , selectorDown);
        events.add(docTarget, 'pointercancel'  , pointerUp   );
        events.add(docTarget, 'MSGestureChange', pointerMove );
        events.add(docTarget, 'MSGestureEnd'   , pointerUp   );
        events.add(docTarget, 'MSInertiaStart' , pointerUp   );
        events.add(docTarget, 'pointerover'    , pointerOver );
        events.add(docTarget, 'pointerout'     , pointerOut  );

        selectorGesture = new Gesture();
        selectorGesture.target = document.documentElement;
    }
    else {
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
            count = elems.length;

            for (var i = 0; i < count; i++) {
                if (elems[i] === this) {
                    return true;
                }
            }

            return false;
        };
    }

    // http://documentcloud.github.io/underscore/docs/underscore.html#section-11
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
