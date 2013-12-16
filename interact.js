/*
 * Copyright (c) 2012, 2013 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js
 * @name interact
 * @function interact
 * @param {HTMLElement | SVGelement} element The previously set document element
 * @returns {Interactable | null} Returns an Interactable if the element passed
 *          was previously set. Returns null otherwise.
 * @description The properties of this variable can be used to set elements as
 *              interactables and also to change various settings. Calling it as
 *              a function with an element which was previously set returns an
 *              Interactable object which has various methods to configure it.
 */
window.interact = (function () {
    'use strict';

    var document           = window.document,
        console            = window.console,
        SVGElement         = window.SVGElement         || blank,
        SVGSVGElement      = window.SVGSVGElement      || blank,
        SVGElementInstance = window.SVGElementInstance || blank,
        HTMLElement        = window.HTMLElement        || window.Element,

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

        interactables   = [],   // all set interactables
        dropzones       = [],   // all dropzone element interactables
        elements        = [],   // all elements that have been made interactable

        selectors       = {},   // all css selector interactables
        selectorDZs     = [],   // all dropzone selector interactables
        matches         = [],   // all selectors that are matched by target element

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

            // aww snap
            snap: {
                mode        : 'grid',
                range       : Infinity,
                grid        : { x: 100, y: 100 },
                gridOffset  : { x:   0, y:   0 },
                anchors     : [],
                paths       : [],

                arrayTypes  : /^anchors$|^paths$/,
                objectTypes : /^grid$|^gridOffset$/,
                stringTypes : /^mode$/,
                numberTypes : /^range$/
            },
            snapEnabled : false,

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

            'click'
        ],

        globalEvents = {},

        fireStates = {
            onevent   : 0,
            directBind: 1,
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
            _element: window.parent.document,
            events  : {}
        },

        // Events wrapper
        events = (function () {
            /* jshint -W001 */ // ignore warning about setting IE8 Event#hasOwnProperty
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
        var deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            dx = event.touches[0][sourceX],
            dy = event.touches[0][sourceX];

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0][sourceX];
            dy -= event.changedTouches[0][sourceX];
        }
        else {
            dx -= event.touches[1][sourceX];
            dy -= event.touches[1][sourceX];
        }

        return Math.sqrt(dx * dx + dy * dy);
    }

    function touchAngle (event) {
        var deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            dx = event.touches[0][sourceX],
            dy = event.touches[0][sourceX];

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0][sourceX];
            dy -= event.changedTouches[0][sourceX];
        }
        else {
            dx -= event.touches[1][sourceX];
            dy -= event.touches[1][sourceX];
        }

        return 180 * -Math.atan(dy / dx) / Math.PI;
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

    function getDrop (event, draggable) {
        if (dropzones.length || selectorDZs.length) {
            var i,
                drops = [],
                elements = [],
                selectorDrops = [],
                selectorElements = [],
                drop;

            // collect all element dropzones that qualify for a drop
            for (i = 0; i < dropzones.length; i++) {
                if (dropzones[i].dropCheck(event)) {
                    drops.push(dropzones[i]);
                    elements.push(dropzones[i]._element);
                }
            }

            // get the most apprpriate dropzone based on DOM depth and order
            drop = resolveDrops(elements);
            dropTarget = drop? dropzones[drop.index]: null;

            if (selectorDZs.length) {
                var draggableElement = target._element;

                for (i = 0; i < selectorDZs.length; i++) {
                    var selector = selectorDZs[i],
                        nodeList = document.querySelectorAll(selector.selector);

                    for (var j = 0, len = nodeList.length; j < len; j++) {
                        selector._element = nodeList[j];
                        selector.rect = selector.getRect();

                        if (selector._element !== draggableElement
                            && elements.indexOf(selector._element) === -1
                            && selectorElements.indexOf(selector._element === -1)
                            && selector.dropCheck(event)) {

                            selectorDrops.push(selector);
                            selectorElements.push(selector._element);
                        }
                    }
                }

                if (selectorElements.length) {
                    if (dropTarget) {
                        selectorDrops.push(dropTarget);
                        selectorElements.push(dropTarget._element);
                    }

                    drop = resolveDrops(selectorElements);

                    if (drop) {
                        dropTarget = selectorDrops[drop.index];

                        if (dropTarget.selector) {
                            dropTarget._element = selectorElements[drop.index];
                        }
                    }
                }
            }

            return dropTarget;
        }
    }

    function InteractEvent (event, action, phase, element, related) {
        var client,
            page,
            deltaSource = (target && target.options || defaultOptions).deltaSource,
            sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            options = target? target.options: defaultOptions;

        element = element || target._element;

        if (action === 'gesture') {
            var average = touchAverage(event);

            page   = { x: (average.pageX   - options.origin.x), y: (average.pageY   - options.origin.y) };
            client = { x: (average.clientX - options.origin.x), y: (average.clientY - options.origin.y) };
        }
        else {

            client = getClientXY(event);
            page = getPageXY(event);

            page.x -= options.origin.x;
            page.y -= options.origin.y;

            if (target.options.snapEnabled) {
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
        this.timeStamp = new Date().getTime();
        this.type      = action + (phase || '');

        if (related) {
            this.relatedTarget = related;
        }

        // start/end event dx, dy is difference between start and current points
        if (phase === 'start' || phase === 'end' || action === 'drop') {
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

        if (matches.length && event.type === 'mousedown') {
            action = validateSelector(event, matches);
        }
        else {
            var selector,
                element = (event.target instanceof SVGElementInstance
                ? event.target.correspondingUseElement
                : event.target),
                elements;

            while (element !== document.documentElement && !action) {
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

    /**
     * @private
     * @event
     * Determine action to be performed on next pointerMove and add appropriate
     * style and event Liseners
     */
    function pointerDown (event, forceAction) {
        // If it is the second touch of a multi-touch gesture, keep the target
        // the same if a target was set by the first touch
        // Otherwise, set the target if the pointer is not down
        if ((event.touches && event.touches.length < 2 && !target)
            || !pointerIsDown) {

            var getFrom = events.useAttachEvent? event.currentTarget: this;

            target = interactables.get(getFrom);
        }

        var options = target && target.options;

        if (target && !(dragging || resizing || gesturing)) {
            var action = validateAction(forceAction || target.getAction(event)),
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

            x0 = page.x - options.origin.x;
            y0 = page.y - options.origin.y;
            clientX0 = client.x - options.origin.x;
            clientY0 = client.y - options.origin.y;

            snapStatus.x = null;
            snapStatus.y = null;

            event.preventDefault();
        }
    }

    function pointerMove (event) {
        if (pointerIsDown) {
            if (x0 === prevX && y0 === prevY) {
                pointerWasMoved = true;
            }
            if (prepared && target) {
                if (target.options.snapEnabled) {
                    var snap = target.options.snap,
                        page = getPageXY(event),
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

                    page.x -= target.options.origin.x;
                    page.y -= target.options.origin.y;

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
            dragEvent = new InteractEvent(event, 'drag', 'start');
            dragging = true;

            if (!dynamicDrop) {
                calcRects(dropzones);
                for (var i = 0; i < selectorDZs.length; i++) {
                    selectorDZs[i]._elements = document.querySelectorAll(selectorDZs[i].selector);
                }
            }
        }
        else {
            var draggableElement = target._element,
                dropzoneElement  = dropTarget? dropTarget._element: null;

            dragEvent  = new InteractEvent(event, 'drag', 'move');
            dropTarget = getDrop(event, target);

            // Make sure that the target selector draggable's element is
            // restored after dropChecks
            target._element = draggableElement;

            if (dropTarget !== prevDropTarget) {
                // if there was a prevDropTarget, create a dragleave event
                if (prevDropTarget) {
                    dragLeaveEvent      = new InteractEvent(event, 'drag', 'leave', dropzoneElement, draggableElement);

                    dragEvent.dragLeave = prevDropTarget._element;
                    leaveDropTarget     = prevDropTarget;
                    prevDropTarget      = null;
                }
                // if the dropTarget is not null, create a dragenter event
                if (dropTarget) {
                    dragEnterEvent      = new InteractEvent(event, 'drag', 'enter', dropzoneElement, draggableElement);

                    dragEvent.dragEnter = dropTarget._element;
                    prevDropTarget      = dropTarget;
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
            action = elementInteractable
                     && validateAction(
                         elementInteractable.getAction(event, elementInteractable),
                         elementInteractable);

        if (!elementInteractable || !validateAction(elementInteractable.getAction(event))) {
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

    /**
     * @private
     * @event
     * Check what action would be performed on pointerMove target if a mouse
     * button were pressed and change the cursor accordingly
     */
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
                draggableElement = target._element,
                drop = getDrop(event, target),
                dropzoneElement = drop? drop._element: null;

            // getDrop changes target._element
            target._element = draggableElement;

            // get the most apprpriate dropzone based on DOM depth and order
            if (drop) {
                dropEvent = new InteractEvent(event, 'drop', null, dropzoneElement, draggableElement);

                endEvent.dropzone = dropzoneElement;
            }

            // if there was a prevDropTarget (perhaps if for some reason this
            // dragend happens without the mouse moving of the previous drop
            // target)
            else if (prevDropTarget) {
                var dragLeaveEvent = new InteractEvent(event, 'drag', 'leave', dropzoneElement, draggableElement);

                prevDropTarget.fire(dragLeaveEvent, draggableElement);

                endEvent.dragLeave = prevDropTarget._element;
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

        interact.stop();

        return event;
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
        if (!target.selector) {
            target = null;
        }

        dropTarget = prevDropTarget = null;
    }

    function interact (element) {
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
                events.add(this, 'mousemove' , pointerHover);
                events.add(this, 'mousedown' , pointerDown );
                events.add(this, 'touchmove' , pointerHover);
                events.add(this, 'touchstart', pointerDown );
            }

            elements.push(this);
        }

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
            if (options instanceof Object) {
                var ondrop = options.ondrop || options.onDrop;
                if (typeof ondrop === 'function') { this.ondrop = ondrop; }

                this.options.dropzone = true;
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

        /**
         * Returns or sets whether resizing is forced 1:1 aspect
         *
         * @function
         * @param {bool} newValue
         * @returns {bool | Interactable}
         */
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

        /**
         * Returns or sets whether multitouch gestures can be performed on the
         * Interactables element
         *
         * @function
         * @param {bool} options
         * @returns {bool | Interactable}
         */
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

        /**
         * Returns or sets whether or not any actions near the edges of the
         * window/container trigger autoScroll for this Interactable
         *
         * @function
         * @param {Object | Boolean | null} newValue either
         *          an object with margin, distance and interval properties,
         *          true or false to enable or disable autoScroll,
         *          null to use default settings
         * @returns {Boolean | Object | Interactable}
         */
        autoScroll: function (newValue) {
            var defaults = defaultOptions.autoScroll;

            if (newValue instanceof Object) {
                var autoScroll = this.options.autoScroll;

                if (autoScroll === defaults) {
                   autoScroll = this.options.autoScroll = {
                       margin   : defaults.margin,
                       distance : defaults.distance,
                       interval : defaults.interval,
                       container: defaults.container,
                   };
                }

                autoScroll.margin    = this.validateSetting('autoScroll', 'margin'   , newValue.margin);
                autoScroll.distance  = this.validateSetting('autoScroll', 'distance' , newValue.distance);
                autoScroll.interval  = this.validateSetting('autoScroll', 'interval' , newValue.interval);
                autoScroll.container = this.validateSetting('autoScroll', 'container', newValue.container);

                this.options.autoScrollEnabled = true;
                this.options.autoScroll = autoScroll;

                return this;
            }

            if (typeof newValue === 'boolean') {
                this.options.autoScrollEnabled = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.autoScrollEnabled;
                delete this.options.autoScroll;

                return this;
            }

            return (this.options.autoScrollEnabled
                ? this.options.autoScroll
                : false);
        },

        /**
         *
         * @function
         * @param {Object | Boolean | null} options either
         *          an object with margin, distance and interval properties,
         *          true or false to enable or disable autoScroll,
         *          null to use default settings
         * @returns {Boolean | Object | Interactable}
         */
        snap: function (newValue) {
            var defaults = defaultOptions.snap;

            if (newValue instanceof Object) {
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

                snap.mode       = this.validateSetting('snap', 'mode'      , newValue.mode);
                snap.range      = this.validateSetting('snap', 'range'     , newValue.range);
                snap.paths      = this.validateSetting('snap', 'paths'     , newValue.paths);
                snap.grid       = this.validateSetting('snap', 'grid'      , newValue.grid);
                snap.gridOffset = this.validateSetting('snap', 'gridOffset', newValue.gridOffset);
                snap.anchors    = this.validateSetting('snap', 'anchors'   , newValue.anchors);

                this.options.snapEnabled = true;
                this.options.snap = snap;

                return this;
            }

            if (typeof newValue === 'boolean') {
                this.options.snapEnabled = newValue;

                return this;
            }

            if (newValue === null) {
                delete this.options.snapEnabled;
                delete this.options.snap;

                return this;
            }

            return (this.options.snapEnabled
                ? this.options.snap
                : false);
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

            if (newValue === null) {
                delete this.options.getAction;

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
                height: clientRect.heigh || clientRect.bottom - clientRect.top
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

            if (newValue === null) {
                delete this.options.getRect;

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

        /**
         * Returns or sets the origin of the Interactable's element
         *
         * @function
         * @param {Object} newValue
         * @returns {Object | Interactable}
         */
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

        /**
         * @function
         * @param {String} context eg. 'snap', 'autoScroll'
         * @param {String} option The name of the value being set
         * @param {Array | Object | String | Number} value The value being validated
         * @returns {Null | Array | Object | String | Number}
         *             null if defaultOptions[context][value] is undefined
         *             value if it is the same type as defaultOptions[context][value],
         *             or this.options[context][value] if it is the same type as defaultOptions[context][value],
         *             or defaultOptions[context][value]
         */
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

                        // interact.on() listeners
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
            else if (this.selector) {
                var elements = document.querySelectorAll(this.selector);

                for (var i = 0, len = elements.length; i < len; i++) {
                    events.addToElement(elements[i], eventType, listener, useCapture);
                }
            }
            else {
                events.add(this, eventType, listener, useCapture);
            }

            return this;
        },

        /**
         * Removes an InteractEvent or DOM event listener
         *
         * @function
         * @returns {Interactable}
         */
        off: function (eventType, listener, useCapture) {
            if (eventType === 'wheel') {
                eventType = wheelEvent;
            }

            if (eventTypes.indexOf(eventType) !== -1) {
                var eventArray = this._iEvents[eventType],
                    index;

                if (eventArray && (index = eventArray.indexOf(listener)) !== -1) {
                    this._iEvents[eventType].splice(index, 1);
                }
            }
            else if (this.selector) {
                var elements = document.querySelectorAll(this.selector);

                for (var i = 0, len = elements.length; i < len; i++) {
                    events.removeFromElement(elements[i], eventType, listener, useCapture);
                }
            }
            else {
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
         *remove it's drag, drop, resize and gesture capabilities and remove it's drag, drop, resize and gesture capabilities
         *
         * @function
         * @returns {} {@link interact}
         */
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
                elements.splice(elements.indexOf(this.element()));
            }

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
     * Adds a global listener to an InteractEvent
     *
     * @function
     * @returns {interact}
     */
    interact.on = function (iEventType, listener) {
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
    };

    /**
     * Removes a global InteractEvent listener
     *
     * @function
     * @returns {interact}
     */
    interact.off = function (iEventType, listener) {
        var index = globalEvents[iEventType].indexOf(listener);

        if (index !== -1) {
            globalEvents[iEventType].splice(index, 1);
        }
        return interact;
    };

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
        event.preventDefault = event.stopPropagation = blank;

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
            globalEvents          : globalEvents,
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
        var snap = defaultOptions.snap;

        if (options instanceof Object) {
            defaultOptions.snapEnabled = true;

            if (typeof options.mode  === 'string') { snap.mode    = options.mode;   }
            if (typeof options.range === 'number') { snap.range   = options.range;  }
            if (options.anchors instanceof Array ) { snap.anchors = options.anchors;}
            if (options.grid instanceof   Object ) { snap.grid    = options.grid;   }
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
     * Ends the current action
     *
     * @function
     * @returns {@link interact}
     */
    interact.stop = function (event) {
        if (dragging || resizing || gesturing) {
            autoScroll.stop();
            matches = [];

            if (target.options.styleCursor) {
                document.documentElement.style.cursor = '';
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
        prepared = null;

        return interact;
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

    /**
     * Returns or sets weather pageX or clientX is used to calculate dx/dy
     *
     * @function
     * @param {string} newValue 'page' or 'client'
     * @returns {string | Interactable}
     */
    interact.deltaSource = function (newValue) {
        if (newValue === 'page' || newValue === 'client') {
            defaultOptions.deltaSource = newValue;

            return this;
        }
        return defaultOptions.deltaSource;
    };


    events.add(docTarget   , 'mousedown'    , selectorDown);
    events.add(docTarget   , 'touchstart'   , selectorDown);
    events.add(docTarget   , 'mousemove'    , pointerMove );
    events.add(docTarget   , 'touchmove'    , pointerMove );
    events.add(docTarget   , 'mouseover'    , pointerOver );
    events.add(docTarget   , 'mouseout'     , pointerOut  );
    events.add(docTarget   , 'mouseup'      , docPointerUp);
    events.add(docTarget   , 'touchend'     , docPointerUp);
    events.add(docTarget   , 'touchcancel'  , docPointerUp);
    events.add(windowTarget, 'blur'         , docPointerUp);

    if (window.parent !== window) {
        try {
            events.add(parentDocTarget   , 'mouseup'      , docPointerUp);
            events.add(parentDocTarget   , 'touchend'     , docPointerUp);
            events.add(parentDocTarget   , 'touchcancel'  , docPointerUp);
            events.add(parentWindowTarget, 'blur'         , docPointerUp);
        }
        catch (error) {
            interact.windowParentError = error;
        }
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

    return interact;
} ());
