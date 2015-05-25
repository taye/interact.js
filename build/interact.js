(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * interact.js v1.2.4
 *
 * Copyright (c) 2012-2015 Taye Adeyemi <dev@taye.me>
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

var realWindow = require('./utils/window');

// return early if there's no window to work with (eg. Node.js)
if (!realWindow) { return; }

var // get wrapped window if using Shadow DOM polyfill
    window = (function () {
        // create a TextNode
        var el = realWindow.document.createTextNode('');

        // check if it's wrapped by a polyfill
        if (el.ownerDocument !== realWindow.document
            && typeof realWindow.wrap === 'function'
            && realWindow.wrap(el) === el) {
            // return wrapped window
            return realWindow.wrap(realWindow);
        }

        // no Shadow DOM polyfil or native implementation
        return realWindow;
    }()),

    document           = window.document,
    DocumentFragment   = window.DocumentFragment   || blank,
    SVGElement         = window.SVGElement         || blank,
    SVGSVGElement      = window.SVGSVGElement      || blank,
    SVGElementInstance = window.SVGElementInstance || blank,
    HTMLElement        = window.HTMLElement        || window.Element,

    PointerEvent = (window.PointerEvent || window.MSPointerEvent),
    pEventTypes,

    hypot = Math.hypot || function (x, y) { return Math.sqrt(x * x + y * y); },

    tmpXY = {},     // reduce object creation in getXY()

    documents       = [],   // all documents being listened to

    interactables   = [],   // all set interactables
    interactions    = [],   // all interactions

    dynamicDrop     = false,

// {
//      type: {
//          selectors: ['selector', ...],
//          contexts : [document, ...],
//          listeners: [[listener, useCapture], ...]
//      }
//  }
    delegatedEvents = {},

    defaultOptions = {
        base: {
            accept        : null,
            actionChecker : null,
            styleCursor   : true,
            preventDefault: 'auto',
            origin        : { x: 0, y: 0 },
            deltaSource   : 'page',
            allowFrom     : null,
            ignoreFrom    : null,
            _context      : document,
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

            axis: 'xy',
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
    },

// Things related to autoScroll
    autoScroll = {
        interaction: null,
        i: null,    // the handle returned by window.setInterval
        x: 0, y: 0, // Direction each pulse is to scroll in

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
                cancelFrame(autoScroll.i);
                autoScroll.i = reqFrame(autoScroll.scroll);
            }
        },

        isScrolling: false,
        prevTime: 0,

        start: function (interaction) {
            autoScroll.isScrolling = true;
            cancelFrame(autoScroll.i);

            autoScroll.interaction = interaction;
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

// Does the browser support PointerEvents
    supportsPointerEvent = !!PointerEvent,

// Less Precision with touch input
    margin = supportsTouch || supportsPointerEvent? 20: 10,

    pointerMoveTolerance = 1,

// for ignoring browser's simulated mouse events
    prevTouchTime = 0,

// Allow this many interactions to happen simultaneously
    maxInteractions = Infinity,

// Check if is IE9 or older
    actionCursors = (document.all && !window.atob) ? {
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
    },

    actionIsEnabled = {
        drag   : true,
        resize : true,
        gesture: true
    },

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

        'down',
        'move',
        'up',
        'cancel',
        'tap',
        'doubletap',
        'hold'
    ],

    globalEvents = {},

// Opera Mobile must be handled differently
    isOperaMobile = navigator.appName == 'Opera' &&
        supportsTouch &&
        navigator.userAgent.match('Presto'),

// scrolling doesn't change the result of
// getBoundingClientRect/getClientRects on iOS <=7 but it does on iOS 8
    isIOS7orLower = (/iP(hone|od|ad)/.test(navigator.platform)
    && /OS [1-7][^\d]/.test(navigator.appVersion)),

// prefix matchesSelector
    prefixedMatchesSelector = 'matches' in Element.prototype?
        'matches': 'webkitMatchesSelector' in Element.prototype?
        'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype?
        'mozMatchesSelector': 'oMatchesSelector' in Element.prototype?
        'oMatchesSelector': 'msMatchesSelector',

// will be polyfill function if browser is IE8
    ie8MatchesSelector,

// native requestAnimationFrame or polyfill
    reqFrame = realWindow.requestAnimationFrame,
    cancelFrame = realWindow.cancelAnimationFrame,

// Events wrapper
    events = (function () {
        var useAttachEvent = ('attachEvent' in window) && !('addEventListener' in window),
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
                    return;
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

        return {
            add: add,
            remove: remove,
            useAttachEvent: useAttachEvent,

            _elements: elements,
            _targets: targets,
            _attachedListeners: attachedListeners
        };
    }());

function blank () {}

function isElement (o) {
    if (!o || (typeof o !== 'object')) { return false; }

    var _window = getWindow(o) || window;

    return (/object|function/.test(typeof _window.Element)
        ? o instanceof _window.Element //DOM2
        : o.nodeType === 1 && typeof o.nodeName === "string");
}
function isWindow (thing) { return !!(thing && thing.Window) && (thing instanceof thing.Window); }
function isDocFrag (thing) { return !!thing && thing instanceof DocumentFragment; }
function isArray (thing) {
    return isObject(thing)
        && (typeof thing.length !== undefined)
        && isFunction(thing.splice);
}
function isObject   (thing) { return !!thing && (typeof thing === 'object'); }
function isFunction (thing) { return typeof thing === 'function'; }
function isNumber   (thing) { return typeof thing === 'number'  ; }
function isBool     (thing) { return typeof thing === 'boolean' ; }
function isString   (thing) { return typeof thing === 'string'  ; }

function trySelector (value) {
    if (!isString(value)) { return false; }

    // an exception will be raised if it is invalid
    document.querySelector(value);
    return true;
}

function extend (dest, source) {
    for (var prop in source) {
        dest[prop] = source[prop];
    }
    return dest;
}

function copyCoords (dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;

    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;

    dest.timeStamp = src.timeStamp;
}

function setEventXY (targetObj, pointer, interaction) {
    if (!pointer) {
        if (interaction.pointerIds.length > 1) {
            pointer = touchAverage(interaction.pointers);
        }
        else {
            pointer = interaction.pointers[0];
        }
    }

    getPageXY(pointer, tmpXY, interaction);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;

    getClientXY(pointer, tmpXY, interaction);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;

    targetObj.timeStamp = new Date().getTime();
}

function setEventDeltas (targetObj, prev, cur) {
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
}

// Get specified X/Y coords for mouse or event.touches[0]
function getXY (type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';

    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];

    return xy;
}

function getPageXY (pointer, page, interaction) {
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
    else if (isOperaMobile) {
        getXY('screen', pointer, page);

        page.x += window.scrollX;
        page.y += window.scrollY;
    }
    else {
        getXY('page', pointer, page);
    }

    return page;
}

function getClientXY (pointer, client, interaction) {
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
        getXY(isOperaMobile? 'screen': 'client', pointer, client);
    }

    return client;
}

function getScrollXY (win) {
    win = win || window;
    return {
        x: win.scrollX || win.document.documentElement.scrollLeft,
        y: win.scrollY || win.document.documentElement.scrollTop
    };
}

function getPointerId (pointer) {
    return isNumber(pointer.pointerId)? pointer.pointerId : pointer.identifier;
}

function getActualElement (element) {
    return (element instanceof SVGElementInstance
        ? element.correspondingUseElement
        : element);
}

function getWindow (node) {
    if (isWindow(node)) {
        return node;
    }

    var rootNode = (node.ownerDocument || node);

    return rootNode.defaultView || rootNode.parentWindow || window;
}

function getElementRect (element) {
    var scroll = isIOS7orLower
            ? { x: 0, y: 0 }
            : getScrollXY(getWindow(element)),
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
    if (isArray(event)) {
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
    if (!event.length && !(event.touches && event.touches.length > 1)) {
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

function touchDistance (event, deltaSource) {
    deltaSource = deltaSource || defaultOptions.deltaSource;

    var sourceX = deltaSource + 'X',
        sourceY = deltaSource + 'Y',
        touches = getTouchPair(event);


    var dx = touches[0][sourceX] - touches[1][sourceX],
        dy = touches[0][sourceY] - touches[1][sourceY];

    return hypot(dx, dy);
}

function touchAngle (event, prevAngle, deltaSource) {
    deltaSource = deltaSource || defaultOptions.deltaSource;

    var sourceX = deltaSource + 'X',
        sourceY = deltaSource + 'Y',
        touches = getTouchPair(event),
        dx = touches[0][sourceX] - touches[1][sourceX],
        dy = touches[0][sourceY] - touches[1][sourceY],
        angle = 180 * Math.atan(dy / dx) / Math.PI;

    if (isNumber(prevAngle)) {
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
    var origin = interactable
        ? interactable.options.origin
        : defaultOptions.origin;

    if (origin === 'parent') {
        origin = parentElement(element);
    }
    else if (origin === 'self') {
        origin = interactable.getRect(element);
    }
    else if (trySelector(origin)) {
        origin = closest(element, origin) || { x: 0, y: 0 };
    }

    if (isFunction(origin)) {
        origin = origin(interactable && element);
    }

    if (isElement(origin))  {
        origin = getElementRect(origin);
    }

    origin.x = ('x' in origin)? origin.x : origin.left;
    origin.y = ('y' in origin)? origin.y : origin.top;

    return origin;
}

// http://stackoverflow.com/a/5634528/2280888
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
    while (child) {
        if (child === parent) {
            return true;
        }

        child = child.parentNode;
    }

    return false;
}

function closest (child, selector) {
    var parent = parentElement(child);

    while (isElement(parent)) {
        if (matchesSelector(parent, selector)) { return parent; }

        parent = parentElement(parent);
    }

    return null;
}

function parentElement (node) {
    var parent = node.parentNode;

    if (isDocFrag(parent)) {
        // skip past #shado-root fragments
        while ((parent = parent.host) && isDocFrag(parent)) {}

        return parent;
    }

    return parent;
}

function inContext (interactable, element) {
    return interactable._context === element.ownerDocument
        || nodeContains(interactable._context, element);
}

function testIgnore (interactable, interactableElement, element) {
    var ignoreFrom = interactable.options.ignoreFrom;

    if (!ignoreFrom || !isElement(element)) { return false; }

    if (isString(ignoreFrom)) {
        return matchesUpTo(element, ignoreFrom, interactableElement);
    }
    else if (isElement(ignoreFrom)) {
        return nodeContains(ignoreFrom, element);
    }

    return false;
}

function testAllow (interactable, interactableElement, element) {
    var allowFrom = interactable.options.allowFrom;

    if (!allowFrom) { return true; }

    if (!isElement(element)) { return false; }

    if (isString(allowFrom)) {
        return matchesUpTo(element, allowFrom, interactableElement);
    }
    else if (isElement(allowFrom)) {
        return nodeContains(allowFrom, element);
    }

    return false;
}

function checkAxis (axis, interactable) {
    if (!interactable) { return false; }

    var thisAxis = interactable.options.drag.axis;

    return (axis === 'xy' || thisAxis === 'xy' || thisAxis === axis);
}

function checkSnap (interactable, action) {
    var options = interactable.options;

    if (/^resize/.test(action)) {
        action = 'resize';
    }

    return options[action].snap && options[action].snap.enabled;
}

function checkRestrict (interactable, action) {
    var options = interactable.options;

    if (/^resize/.test(action)) {
        action = 'resize';
    }

    return  options[action].restrict && options[action].restrict.enabled;
}

function checkAutoScroll (interactable, action) {
    var options = interactable.options;

    if (/^resize/.test(action)) {
        action = 'resize';
    }

    return  options[action].autoScroll && options[action].autoScroll.enabled;
}

function withinInteractionLimit (interactable, element, action) {
    var options = interactable.options,
        maxActions = options[action.name].max,
        maxPerElement = options[action.name].maxPerElement,
        activeInteractions = 0,
        targetCount = 0,
        targetElementCount = 0;

    for (var i = 0, len = interactions.length; i < len; i++) {
        var interaction = interactions[i],
            otherAction = interaction.prepared.name,
            active = interaction.interacting();

        if (!active) { continue; }

        activeInteractions++;

        if (activeInteractions >= maxInteractions) {
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

    return maxInteractions > 0;
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
}

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

    if (isFunction(Function.prototype.bind)) {
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

    interactions.push(this);
}

Interaction.prototype = {
    getPageXY  : function (pointer, xy) { return   getPageXY(pointer, xy, this); },
    getClientXY: function (pointer, xy) { return getClientXY(pointer, xy, this); },
    setEventXY : function (target, ptr) { return  setEventXY(target, ptr, this); },

    pointerOver: function (pointer, event, eventTarget) {
        if (this.prepared.name || !this.mouse) { return; }

        var curMatches = [],
            curMatchElements = [],
            prevTargetElement = this.element;

        this.addPointer(pointer);

        if (this.target
            && (testIgnore(this.target, this.element, eventTarget)
            || !testAllow(this.target, this.element, eventTarget))) {
            // if the eventTarget should be ignored or shouldn't be allowed
            // clear the previous target
            this.target = null;
            this.element = null;
            this.matches = [];
            this.matchElements = [];
        }

        var elementInteractable = interactables.get(eventTarget),
            elementAction = (elementInteractable
            && !testIgnore(elementInteractable, eventTarget, eventTarget)
            && testAllow(elementInteractable, eventTarget, eventTarget)
            && validateAction(
                elementInteractable.getAction(pointer, event, this, eventTarget),
                elementInteractable));

        if (elementAction && !withinInteractionLimit(elementInteractable, eventTarget, elementAction)) {
            elementAction = null;
        }

        function pushCurMatches (interactable, selector) {
            if (interactable
                && inContext(interactable, eventTarget)
                && !testIgnore(interactable, eventTarget, eventTarget)
                && testAllow(interactable, eventTarget, eventTarget)
                && matchesSelector(eventTarget, selector)) {

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
            interactables.forEachSelector(pushCurMatches);

            if (this.validateSelector(pointer, event, curMatches, curMatchElements)) {
                this.matches = curMatches;
                this.matchElements = curMatchElements;

                this.pointerHover(pointer, event, this.matches, this.matchElements);
                events.add(eventTarget,
                    PointerEvent? pEventTypes.move : 'mousemove',
                    listeners.pointerHover);
            }
            else if (this.target) {
                if (nodeContains(prevTargetElement, eventTarget)) {
                    this.pointerHover(pointer, event, this.matches, this.matchElements);
                    events.add(this.element,
                        PointerEvent? pEventTypes.move : 'mousemove',
                        listeners.pointerHover);
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
        if (!interactables.get(eventTarget)) {
            events.remove(eventTarget,
                PointerEvent? pEventTypes.move : 'mousemove',
                listeners.pointerHover);
        }

        if (this.target && this.target.options.styleCursor && !this.interacting()) {
            this.target._doc.documentElement.style.cursor = '';
        }
    },

    selectorDown: function (pointer, event, eventTarget, curEventTarget) {
        var that = this,
        // copy event to be used in timeout for IE8
            eventCopy = events.useAttachEvent? extend({}, event) : event,
            element = eventTarget,
            pointerIndex = this.addPointer(pointer),
            action;

        this.holdTimers[pointerIndex] = setTimeout(function () {
            that.pointerHold(events.useAttachEvent? eventCopy : pointer, eventCopy, eventTarget, curEventTarget);
        }, defaultOptions._holdDuration);

        this.pointerIsDown = true;

        // Check if the down event hits the current inertia target
        if (this.inertiaStatus.active && this.target.selector) {
            // climb up the DOM tree from the event target
            while (isElement(element)) {

                // if this element is the current inertia target element
                if (element === this.element
                        // and the prospective action is the same as the ongoing one
                    && validateAction(this.target.getAction(pointer, event, this, this.element), this.target).name === this.prepared.name) {

                    // stop inertia so that the next move will be a normal one
                    cancelFrame(this.inertiaStatus.i);
                    this.inertiaStatus.active = false;

                    this.collectEventTargets(pointer, event, eventTarget, 'down');
                    return;
                }
                element = parentElement(element);
            }
        }

        // do nothing if interacting
        if (this.interacting()) {
            this.collectEventTargets(pointer, event, eventTarget, 'down');
            return;
        }

        function pushMatches (interactable, selector, context) {
            var elements = ie8MatchesSelector
                ? context.querySelectorAll(selector)
                : undefined;

            if (inContext(interactable, element)
                && !testIgnore(interactable, element, eventTarget)
                && testAllow(interactable, element, eventTarget)
                && matchesSelector(element, selector, elements)) {

                that.matches.push(interactable);
                that.matchElements.push(element);
            }
        }

        // update pointer coords for defaultActionChecker to use
        this.setEventXY(this.curCoords, pointer);
        this.downEvent = event;

        while (isElement(element) && !action) {
            this.matches = [];
            this.matchElements = [];

            interactables.forEachSelector(pushMatches);

            action = this.validateSelector(pointer, event, this.matches, this.matchElements);
            element = parentElement(element);
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
            extend(this.downPointer, pointer);

            copyCoords(this.prevCoords, this.curCoords);
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

            var interactable = interactables.get(curEventTarget);

            if (interactable
                && !testIgnore(interactable, curEventTarget, eventTarget)
                && testAllow(interactable, curEventTarget, eventTarget)
                && (action = validateAction(forceAction || interactable.getAction(pointer, event, this, curEventTarget), interactable, eventTarget))
                && withinInteractionLimit(interactable, curEventTarget, action)) {
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
            extend(this.downPointer, pointer);

            this.setEventXY(this.prevCoords);
            this.pointerWasMoved = false;

            this.checkAndPreventDefault(event, target, this.element);
        }
        // if inertia is active try to resume action
        else if (this.inertiaStatus.active
            && curEventTarget === this.element
            && validateAction(target.getAction(pointer, event, this, this.element), target).name === this.prepared.name) {

            cancelFrame(this.inertiaStatus.i);
            this.inertiaStatus.active = false;

            this.checkAndPreventDefault(event, target, this.element);
        }
    },

    setModifications: function (coords, preEnd) {
        var target         = this.target,
            shouldMove     = true,
            shouldSnap     = checkSnap(target, this.prepared.name)     && (!target.options[this.prepared.name].snap.endOnly     || preEnd),
            shouldRestrict = checkRestrict(target, this.prepared.name) && (!target.options[this.prepared.name].restrict.endOnly || preEnd);

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
            origin = getOriginXY(interactable, element),
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
        if (indexOf(interactions, this) === -1) {
            interactions.push(this);
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
            pointerIndex = this.mouse? 0 : indexOf(this.pointerIds, getPointerId(pointer));

        // register movement greater than pointerMoveTolerance
        if (this.pointerIsDown && !this.pointerWasMoved) {
            dx = this.curCoords.client.x - this.startCoords.client.x;
            dy = this.curCoords.client.y - this.startCoords.client.y;

            this.pointerWasMoved = hypot(dx, dy) > pointerMoveTolerance;
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
        setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

        if (!this.prepared.name) { return; }

        if (this.pointerWasMoved
                // ignore movement while inertia is active
            && (!this.inertiaStatus.active || (pointer instanceof InteractEvent && /inertiastart/.test(pointer.type)))) {

            // if just starting an action, calculate the pointer speed now
            if (!this.interacting()) {
                setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

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
                        while (isElement(element)) {
                            var elementInteractable = interactables.get(element);

                            if (elementInteractable
                                && elementInteractable !== this.target
                                && !elementInteractable.options.drag.manualStart
                                && elementInteractable.getAction(this.downPointer, this.downEvent, this, element).name === 'drag'
                                && checkAxis(axis, elementInteractable)) {

                                this.prepared.name = 'drag';
                                this.target = elementInteractable;
                                this.element = element;
                                break;
                            }

                            element = parentElement(element);
                        }

                        // if there's no drag from element interactables,
                        // check the selector interactables
                        if (!this.prepared.name) {
                            var thisInteraction = this;

                            var getDraggable = function (interactable, selector, context) {
                                var elements = ie8MatchesSelector
                                    ? context.querySelectorAll(selector)
                                    : undefined;

                                if (interactable === thisInteraction.target) { return; }

                                if (inContext(interactable, eventTarget)
                                    && !interactable.options.drag.manualStart
                                    && !testIgnore(interactable, element, eventTarget)
                                    && testAllow(interactable, element, eventTarget)
                                    && matchesSelector(element, selector, elements)
                                    && interactable.getAction(thisInteraction.downPointer, thisInteraction.downEvent, thisInteraction, element).name === 'drag'
                                    && checkAxis(axis, interactable)
                                    && withinInteractionLimit(interactable, element, 'drag')) {

                                    return interactable;
                                }
                            };

                            element = eventTarget;

                            while (isElement(element)) {
                                var selectorInteractable = interactables.forEachSelector(getDraggable);

                                if (selectorInteractable) {
                                    this.prepared.name = 'drag';
                                    this.target = selectorInteractable;
                                    this.element = element;
                                    break;
                                }

                                element = parentElement(element);
                            }
                        }
                    }
                }
            }

            var starting = !!this.prepared.name && !this.interacting();

            if (starting
                && (this.target.options[this.prepared.name].manualStart
                || !withinInteractionLimit(this.target, this.element, this.prepared))) {
                this.stop();
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

        copyCoords(this.prevCoords, this.curCoords);

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
                var squareEdges = extend({}, this.prepared.edges);

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
                current   : extend({}, startRect),
                restricted: extend({}, startRect),
                previous  : extend({}, startRect),
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
                previous   = extend(this.resizeRects.previous, restricted);

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
                extend(restricted, current);

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
        var pointerIndex = this.mouse? 0 : indexOf(this.pointerIds, getPointerId(pointer));

        clearTimeout(this.holdTimers[pointerIndex]);

        this.collectEventTargets(pointer, event, eventTarget, 'up' );
        this.collectEventTargets(pointer, event, eventTarget, 'tap');

        this.pointerEnd(pointer, event, eventTarget, curEventTarget);

        this.removePointer(pointer);
    },

    pointerCancel: function (pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.mouse? 0 : indexOf(this.pointerIds, getPointerId(pointer));

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
                endSnap = checkSnap(target, this.prepared.name) && options[this.prepared.name].snap.endOnly,
                endRestrict = checkRestrict(target, this.prepared.name) && options[this.prepared.name].restrict.endOnly,
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
                copyCoords(inertiaStatus.upCoords, this.curCoords);

                this.pointers[0] = inertiaStatus.startEvent = startEvent =
                    new InteractEvent(this, event, this.prepared.name, 'inertiastart', this.element);

                inertiaStatus.t0 = now;

                target.fire(inertiaStatus.startEvent);

                if (inertia) {
                    inertiaStatus.vx0 = this.pointerDelta.client.vx;
                    inertiaStatus.vy0 = this.pointerDelta.client.vy;
                    inertiaStatus.v0 = pointerSpeed;

                    this.calcInertia(inertiaStatus);

                    var page = extend({}, this.curCoords.page),
                        origin = getOriginXY(target, this.element),
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

                    inertiaStatus.i = reqFrame(this.boundInertiaFrame);
                }
                else {
                    inertiaStatus.smoothEnd = true;
                    inertiaStatus.xe = dx;
                    inertiaStatus.ye = dy;

                    inertiaStatus.sx = inertiaStatus.sy = 0;

                    inertiaStatus.i = reqFrame(this.boundSmoothEndFrame);
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
        for (i = 0; i < interactables.length; i++) {
            if (!interactables[i].options.drop.enabled) { continue; }

            var current = interactables[i],
                accept = current.options.drop.accept;

            // test the draggable element against the dropzone's accept setting
            if ((isElement(accept) && accept !== element)
                || (isString(accept)
                && !matchesSelector(element, accept))) {

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

        if (dynamicDrop) {
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
        var dropIndex = indexOfDeepestElement(validDrops),
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
            autoScroll.stop();
            this.matches = [];
            this.matchElements = [];

            var target = this.target;

            if (target.options.styleCursor) {
                target._doc.documentElement.style.cursor = '';
            }

            // prevent Default only if were previously interacting
            if (event && isFunction(event.preventDefault)) {
                this.checkAndPreventDefault(event, target, this.element);
            }

            if (this.dragging) {
                this.activeDrops.dropzones = this.activeDrops.elements = this.activeDrops.rects = null;
            }

            this.clearTargets();
        }

        this.pointerIsDown = this.snapStatus.locked = this.dragging = this.resizing = this.gesturing = false;
        this.prepared.name = this.prevEvent = null;
        this.inertiaStatus.resumeDx = this.inertiaStatus.resumeDy = 0;

        // remove pointers if their ID isn't in this.pointerIds
        for (var i = 0; i < this.pointers.length; i++) {
            if (indexOf(this.pointerIds, getPointerId(this.pointers[i])) === -1) {
                this.pointers.splice(i, 1);
            }
        }

        for (i = 0; i < interactions.length; i++) {
            // remove this interaction if it's not the only one of it's type
            if (interactions[i] !== this && interactions[i].mouse === this.mouse) {
                interactions.splice(indexOf(interactions, this), 1);
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
                var quadPoint = getQuadraticCurvePoint(
                    0, 0,
                    inertiaStatus.xe, inertiaStatus.ye,
                    inertiaStatus.modifiedXe, inertiaStatus.modifiedYe,
                    progress);

                inertiaStatus.sx = quadPoint.x;
                inertiaStatus.sy = quadPoint.y;
            }

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.i = reqFrame(this.boundInertiaFrame);
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
            inertiaStatus.sx = easeOutQuad(t, 0, inertiaStatus.xe, duration);
            inertiaStatus.sy = easeOutQuad(t, 0, inertiaStatus.ye, duration);

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.i = reqFrame(this.boundSmoothEndFrame);
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
        var id = getPointerId(pointer),
            index = this.mouse? 0 : indexOf(this.pointerIds, id);

        if (index === -1) {
            index = this.pointerIds.length;
        }

        this.pointerIds[index] = id;
        this.pointers[index] = pointer;

        return index;
    },

    removePointer: function (pointer) {
        var id = getPointerId(pointer),
            index = this.mouse? 0 : indexOf(this.pointerIds, id);

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

        var index = this.mouse? 0: indexOf(this.pointerIds, getPointerId(pointer));

        if (index === -1) { return; }

        this.pointers[index] = pointer;
    },

    collectEventTargets: function (pointer, event, eventTarget, eventType) {
        var pointerIndex = this.mouse? 0 : indexOf(this.pointerIds, getPointerId(pointer));

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
            var els = ie8MatchesSelector
                ? context.querySelectorAll(selector)
                : undefined;

            if (interactable._iEvents[eventType]
                && isElement(element)
                && inContext(interactable, element)
                && !testIgnore(interactable, element, eventTarget)
                && testAllow(interactable, element, eventTarget)
                && matchesSelector(element, selector, els)) {

                targets.push(interactable);
                elements.push(element);
            }
        }

        while (element) {
            if (interact.isSet(element) && interact(element)._iEvents[eventType]) {
                targets.push(interact(element));
                elements.push(element);
            }

            interactables.forEachSelector(collectSelectors);

            element = parentElement(element);
        }

        // create the tap event even if there are no listeners so that
        // doubletap can still be created and fired
        if (targets.length || eventType === 'tap') {
            this.firePointers(pointer, event, eventTarget, targets, elements, eventType);
        }
    },

    firePointers: function (pointer, event, eventTarget, targets, elements, eventType) {
        var pointerIndex = this.mouse? 0 : indexOf(getPointerId(pointer)),
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
            extend(pointerEvent, event);
            if (event !== pointer) {
                extend(pointerEvent, pointer);
            }

            pointerEvent.preventDefault           = preventOriginalDefault;
            pointerEvent.stopPropagation          = InteractEvent.prototype.stopPropagation;
            pointerEvent.stopImmediatePropagation = InteractEvent.prototype.stopImmediatePropagation;
            pointerEvent.interaction              = this;

            pointerEvent.timeStamp     = new Date().getTime();
            pointerEvent.originalEvent = event;
            pointerEvent.type          = eventType;
            pointerEvent.pointerId     = getPointerId(pointer);
            pointerEvent.pointerType   = this.mouse? 'mouse' : !supportsPointerEvent? 'touch'
                : isString(pointer.pointerType)
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

            extend(doubleTap, pointerEvent);

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

            if (action && withinInteractionLimit(match, matchElement, action)) {
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
            var origin = getOriginXY(this.target, this.element);

            page = extend({}, pageCoords);

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
                if (isFunction(snap.targets[i])) {
                    target = snap.targets[i](relative.x, relative.y, this);
                }
                else {
                    target = snap.targets[i];
                }

                if (!target) { continue; }

                targets.push({
                    x: isNumber(target.x) ? (target.x + this.snapOffsets[relIndex].x) : relative.x,
                    y: isNumber(target.y) ? (target.y + this.snapOffsets[relIndex].y) : relative.y,

                    range: isNumber(target.range)? target.range: snap.range
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
                distance = hypot(dx, dy),
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
            : page = extend({}, pageCoords);

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

        if (isString(restriction)) {
            if (restriction === 'parent') {
                restriction = parentElement(this.element);
            }
            else if (restriction === 'self') {
                restriction = target.getRect(this.element);
            }
            else {
                restriction = closest(this.element, restriction);
            }

            if (!restriction) { return status; }
        }

        if (isFunction(restriction)) {
            restriction = restriction(page.x, page.y, this.element);
        }

        if (isElement(restriction)) {
            restriction = getElementRect(restriction);
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
            && checkAutoScroll(this.target, this.prepared.name))) {
            return;
        }

        if (this.inertiaStatus.active) {
            autoScroll.x = autoScroll.y = 0;
            return;
        }

        var top,
            right,
            bottom,
            left,
            options = this.target.options[this.prepared.name].autoScroll,
            container = options.container || getWindow(this.element);

        if (isWindow(container)) {
            left   = pointer.clientX < autoScroll.margin;
            top    = pointer.clientY < autoScroll.margin;
            right  = pointer.clientX > container.innerWidth  - autoScroll.margin;
            bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
        }
        else {
            var rect = getElementRect(container);

            left   = pointer.clientX < rect.left   + autoScroll.margin;
            top    = pointer.clientY < rect.top    + autoScroll.margin;
            right  = pointer.clientX > rect.right  - autoScroll.margin;
            bottom = pointer.clientY > rect.bottom - autoScroll.margin;
        }

        autoScroll.x = (right ? 1: left? -1: 0);
        autoScroll.y = (bottom? 1:  top? -1: 0);

        if (!autoScroll.isScrolling) {
            // set the autoScroll properties to those of the target
            autoScroll.margin = options.margin;
            autoScroll.speed  = options.speed;

            autoScroll.start(this);
        }
    },

    _updateEventTargets: function (target, currentTarget) {
        this._eventTarget    = target;
        this._curEventTarget = currentTarget;
    }

};

function getInteractionFromPointer (pointer, eventType, eventTarget) {
    var i = 0, len = interactions.length,
        mouseEvent = (/mouse/i.test(pointer.pointerType || eventType)
            // MSPointerEvent.MSPOINTER_TYPE_MOUSE
        || pointer.pointerType === 4),
        interaction;

    var id = getPointerId(pointer);

    // try to resume inertia with a new pointer
    if (/down|start/i.test(eventType)) {
        for (i = 0; i < len; i++) {
            interaction = interactions[i];

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
                    element = parentElement(element);
                }
            }
        }
    }

    // if it's a mouse interaction
    if (mouseEvent || !(supportsTouch || supportsPointerEvent)) {

        // find a mouse interaction that's not in inertia phase
        for (i = 0; i < len; i++) {
            if (interactions[i].mouse && !interactions[i].inertiaStatus.active) {
                return interactions[i];
            }
        }

        // find any interaction specifically for mouse.
        // if the eventType is a mousedown, and inertia is active
        // ignore the interaction
        for (i = 0; i < len; i++) {
            if (interactions[i].mouse && !(/down/.test(eventType) && interactions[i].inertiaStatus.active)) {
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
        if (contains(interactions[i].pointerIds, id)) {
            return interactions[i];
        }
    }

    // at this stage, a pointerUp should not return an interaction
    if (/up|end|out/i.test(eventType)) {
        return null;
    }

    // get first idle interaction
    for (i = 0; i < len; i++) {
        interaction = interactions[i];

        if ((!interaction.prepared.name || (interaction.target.options.gesture.enabled))
            && !interaction.interacting()
            && !(!mouseEvent && interaction.mouse)) {

            interaction.addPointer(pointer);

            return interaction;
        }
    }

    return new Interaction();
}

function doOnInteractions (method) {
    return (function (event) {
        var interaction,
            eventTarget = getActualElement(event.path
                ? event.path[0]
                : event.target),
            curEventTarget = getActualElement(event.currentTarget),
            i;

        if (supportsTouch && /touch/.test(event.type)) {
            prevTouchTime = new Date().getTime();

            for (i = 0; i < event.changedTouches.length; i++) {
                var pointer = event.changedTouches[i];

                interaction = getInteractionFromPointer(pointer, event.type, eventTarget);

                if (!interaction) { continue; }

                interaction._updateEventTargets(eventTarget, curEventTarget);

                interaction[method](pointer, event, eventTarget, curEventTarget);
            }
        }
        else {
            if (!supportsPointerEvent && /mouse/.test(event.type)) {
                // ignore mouse events while touch interactions are active
                for (i = 0; i < interactions.length; i++) {
                    if (!interactions[i].mouse && interactions[i].pointerIsDown) {
                        return;
                    }
                }

                // try to ignore mouse events that are simulated by the browser
                // after a touch event
                if (new Date().getTime() - prevTouchTime < 500) {
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

function InteractEvent (interaction, event, action, phase, element, related) {
    var client,
        page,
        target      = interaction.target,
        snapStatus  = interaction.snapStatus,
        restrictStatus  = interaction.restrictStatus,
        pointers    = interaction.pointers,
        deltaSource = (target && target.options || defaultOptions).deltaSource,
        sourceX     = deltaSource + 'X',
        sourceY     = deltaSource + 'Y',
        options     = target? target.options: defaultOptions,
        origin      = getOriginXY(target, element),
        starting    = phase === 'start',
        ending      = phase === 'end',
        coords      = starting? interaction.startCoords : interaction.curCoords;

    element = element || interaction.element;

    page   = extend({}, coords.page);
    client = extend({}, coords.client);

    page.x -= origin.x;
    page.y -= origin.y;

    client.x -= origin.x;
    client.y -= origin.y;

    var relativePoints = options[action].snap && options[action].snap.relativePoints ;

    if (checkSnap(target, action) && !(starting && relativePoints && relativePoints.length)) {
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

    if (checkRestrict(target, action) && !(starting && options[action].restrict.elementRect) && restrictStatus.restricted) {
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
            this.distance = touchDistance(pointers, deltaSource);
            this.box      = touchBBox(pointers);
            this.scale    = 1;
            this.ds       = 0;
            this.angle    = touchAngle(pointers, undefined, deltaSource);
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
            this.distance = touchDistance(pointers, deltaSource);
            this.box      = touchBBox(pointers);
            this.scale    = this.distance / interaction.gesture.startDistance;
            this.angle    = touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);

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

            this.speed = hypot(dx, dy) / dt;
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

function getActionCursor (action) {
    var cursor = '';

    if (action.name === 'drag') {
        cursor =  actionCursors.drag;
    }
    if (action.name === 'resize') {
        if (action.axis) {
            cursor =  actionCursors[action.name + action.axis];
        }
        else if (action.edges) {
            var cursorKey = 'resize',
                edgeNames = ['top', 'bottom', 'left', 'right'];

            for (var i = 0; i < 4; i++) {
                if (action.edges[edgeNames[i]]) {
                    cursorKey += edgeNames[i];
                }
            }

            cursor = actionCursors[cursorKey];
        }
    }

    return cursor;
}

function checkResizeEdge (name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) { return false; }

    // true value, use pointer coords and element rect
    if (value === true) {
        // if dimensions are negative, "switch" edges
        var width = isNumber(rect.width)? rect.width : rect.right - rect.left,
            height = isNumber(rect.height)? rect.height : rect.bottom - rect.top;

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
    if (!isElement(element)) { return false; }

    return isElement(value)
        // the value is an element to use as a resize handle
        ? value === element
        // otherwise check if element matches value as selector
        : matchesUpTo(element, value, interactableElement);
}

function defaultActionChecker (pointer, interaction, element) {
    var rect = this.getRect(element),
        shouldResize = false,
        action = null,
        resizeAxes = null,
        resizeEdges,
        page = extend({}, interaction.curCoords.page),
        options = this.options;

    if (!rect) { return null; }

    if (actionIsEnabled.resize && options.resize.enabled) {
        var resizeOptions = options.resize;

        resizeEdges = {
            left: false, right: false, top: false, bottom: false
        };

        // if using resize.edges
        if (isObject(resizeOptions.edges)) {
            for (var edge in resizeEdges) {
                resizeEdges[edge] = checkResizeEdge(edge,
                    resizeOptions.edges[edge],
                    page,
                    interaction._eventTarget,
                    element,
                    rect,
                    resizeOptions.margin || margin);
            }

            resizeEdges.left = resizeEdges.left && !resizeEdges.right;
            resizeEdges.top  = resizeEdges.top  && !resizeEdges.bottom;

            shouldResize = resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom;
        }
        else {
            var right  = options.resize.axis !== 'y' && page.x > (rect.right  - margin),
                bottom = options.resize.axis !== 'x' && page.y > (rect.bottom - margin);

            shouldResize = right || bottom;
            resizeAxes = (right? 'x' : '') + (bottom? 'y' : '');
        }
    }

    action = shouldResize
        ? 'resize'
        : actionIsEnabled.drag && options.drag.enabled
        ? 'drag'
        : null;

    if (actionIsEnabled.gesture
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

// Check if action is enabled globally and the current target supports it
// If so, return the validated action. Otherwise, return null
function validateAction (action, interactable) {
    if (!isObject(action)) { return null; }

    var actionName = action.name,
        options = interactable.options;

    if ((  (actionName  === 'resize'   && options.resize.enabled )
        || (actionName      === 'drag'     && options.drag.enabled  )
        || (actionName      === 'gesture'  && options.gesture.enabled))
        && actionIsEnabled[actionName]) {

        if (actionName === 'resize' || actionName === 'resizeyx') {
            actionName = 'resizexy';
        }

        return action;
    }
    return null;
}

var listeners = {},
    interactionListeners = [
        'dragStart', 'dragMove', 'resizeStart', 'resizeMove', 'gestureStart', 'gestureMove',
        'pointerOver', 'pointerOut', 'pointerHover', 'selectorDown',
        'pointerDown', 'pointerMove', 'pointerUp', 'pointerCancel', 'pointerEnd',
        'addPointer', 'removePointer', 'recordPointer', 'autoScrollMove'
    ];

for (var i = 0, len = interactionListeners.length; i < len; i++) {
    var name = interactionListeners[i];

    listeners[name] = doOnInteractions(name);
}

// bound to the interactable context when a DOM event
// listener is added to a selector interactable
function delegateListener (event, useCapture) {
    var fakeEvent = {},
        delegated = delegatedEvents[event.type],
        eventTarget = getActualElement(event.path
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
    while (isElement(element)) {
        for (var i = 0; i < delegated.selectors.length; i++) {
            var selector = delegated.selectors[i],
                context = delegated.contexts[i];

            if (matchesSelector(element, selector)
                && nodeContains(context, eventTarget)
                && nodeContains(context, element)) {

                var listeners = delegated.listeners[i];

                fakeEvent.currentTarget = element;

                for (var j = 0; j < listeners.length; j++) {
                    if (listeners[j][1] === useCapture) {
                        listeners[j][0](fakeEvent);
                    }
                }
            }
        }

        element = parentElement(element);
    }
}

function delegateUseCapture (event) {
    return delegateListener.call(this, event, true);
}

interactables.indexOfElement = function indexOfElement (element, context) {
    context = context || document;

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

interactables.get = function interactableGet (element, options) {
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

    if (trySelector(element)) {
        this.selector = element;

        var context = options && options.context;

        _window = context? getWindow(context) : window;

        if (context && (_window.Node
                ? context instanceof _window.Node
                : (isElement(context) || context === _window.document))) {

            this._context = context;
        }
    }
    else {
        _window = getWindow(element);

        if (isElement(element, _window)) {

            if (PointerEvent) {
                events.add(this._element, pEventTypes.down, listeners.pointerDown );
                events.add(this._element, pEventTypes.move, listeners.pointerHover);
            }
            else {
                events.add(this._element, 'mousedown' , listeners.pointerDown );
                events.add(this._element, 'mousemove' , listeners.pointerHover);
                events.add(this._element, 'touchstart', listeners.pointerDown );
                events.add(this._element, 'touchmove' , listeners.pointerHover);
            }
        }
    }

    this._doc = _window.document;

    if (!contains(documents, this._doc)) {
        listenToDocument(this._doc);
    }

    interactables.push(this);

    this.set(options);
}

Interactable.prototype = {
    setOnEvents: function (action, phases) {
        if (action === 'drop') {
            if (isFunction(phases.ondrop)          ) { this.ondrop           = phases.ondrop          ; }
            if (isFunction(phases.ondropactivate)  ) { this.ondropactivate   = phases.ondropactivate  ; }
            if (isFunction(phases.ondropdeactivate)) { this.ondropdeactivate = phases.ondropdeactivate; }
            if (isFunction(phases.ondragenter)     ) { this.ondragenter      = phases.ondragenter     ; }
            if (isFunction(phases.ondragleave)     ) { this.ondragleave      = phases.ondragleave     ; }
            if (isFunction(phases.ondropmove)      ) { this.ondropmove       = phases.ondropmove      ; }
        }
        else {
            action = 'on' + action;

            if (isFunction(phases.onstart)       ) { this[action + 'start'         ] = phases.onstart         ; }
            if (isFunction(phases.onmove)        ) { this[action + 'move'          ] = phases.onmove          ; }
            if (isFunction(phases.onend)         ) { this[action + 'end'           ] = phases.onend           ; }
            if (isFunction(phases.oninertiastart)) { this[action + 'inertiastart'  ] = phases.oninertiastart  ; }
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
        if (isObject(options)) {
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

        if (isBool(options)) {
            this.options.drag.enabled = options;

            return this;
        }

        return this.options.drag;
    },

    setPerAction: function (action, options) {
        // for all the default per-action options
        for (var option in options) {
            // if this option exists for this action
            if (option in defaultOptions[action]) {
                // if the option in the options arg is an object value
                if (isObject(options[option])) {
                    // duplicate the object
                    this.options[action][option] = extend(this.options[action][option] || {}, options[option]);

                    if (isObject(defaultOptions.perAction[option]) && 'enabled' in defaultOptions.perAction[option]) {
                        this.options[action][option].enabled = options[option].enabled === false? false : true;
                    }
                }
                else if (isBool(options[option]) && isObject(defaultOptions.perAction[option])) {
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
        if (isObject(options)) {
            this.options.drop.enabled = options.enabled === false? false: true;
            this.setOnEvents('drop', options);
            this.accept(options.accept);

            if (/^(pointer|center)$/.test(options.overlap)) {
                this.options.drop.overlap = options.overlap;
            }
            else if (isNumber(options.overlap)) {
                this.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
            }

            return this;
        }

        if (isBool(options)) {
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
            var page = getPageXY(pointer),
                origin = getOriginXY(draggable, draggableElement),
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

        if (isNumber(dropOverlap)) {
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
        if (isFunction(checker)) {
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
        if (isElement(newValue)) {
            this.options.drop.accept = newValue;

            return this;
        }

        // test if it is a valid CSS selector
        if (trySelector(newValue)) {
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
        if (isObject(options)) {
            this.options.resize.enabled = options.enabled === false? false: true;
            this.setPerAction('resize', options);
            this.setOnEvents('resize', options);

            if (/^x$|^y$|^xy$/.test(options.axis)) {
                this.options.resize.axis = options.axis;
            }
            else if (options.axis === null) {
                this.options.resize.axis = defaultOptions.resize.axis;
            }

            if (isBool(options.square)) {
                this.options.resize.square = options.square;
            }

            return this;
        }
        if (isBool(options)) {
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
        if (isBool(newValue)) {
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
        if (isObject(options)) {
            this.options.gesture.enabled = options.enabled === false? false: true;
            this.setPerAction('gesture', options);
            this.setOnEvents('gesture', options);

            return this;
        }

        if (isBool(options)) {
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
        if (isObject(options)) {
            options = extend({ actions: ['drag', 'resize']}, options);
        }
        else if (isBool(options)) {
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
        var actions = options && isArray(options.actions)
            ? options.actions
            : ['drag'];

        var i;

        if (isObject(options) || isBool(options)) {
            for (i = 0; i < actions.length; i++) {
                var action = /resize/.test(actions[i])? 'resize' : actions[i];

                if (!isObject(this.options[action])) { continue; }

                var thisOption = this.options[action][option];

                if (isObject(options)) {
                    extend(thisOption, options);
                    thisOption.enabled = options.enabled === false? false: true;

                    if (option === 'snap') {
                        if (thisOption.mode === 'grid') {
                            thisOption.targets = [
                                interact.createSnapGrid(extend({
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
                else if (isBool(options)) {
                    thisOption.enabled = options;
                }
            }

            return this;
        }

        var ret = {},
            allActions = ['drag', 'resize', 'gesture'];

        for (i = 0; i < allActions.length; i++) {
            if (option in defaultOptions[allActions[i]]) {
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
        if (isFunction(checker)) {
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
    rectChecker: function (checker) {
        if (isFunction(checker)) {
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
        if (isBool(newValue)) {
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

        if (isBool(newValue)) {
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
        if (trySelector(newValue)) {
            this.options.origin = newValue;
            return this;
        }
        else if (isObject(newValue)) {
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
        if (!isObject(options)) {
            return this.setOptions('restrict', options);
        }

        var actions = ['drag', 'resize', 'gesture'],
            ret;

        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];

            if (action in options) {
                var perAction = extend({
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
        if (trySelector(newValue)) {            // CSS selector to match event.target
            this.options.ignoreFrom = newValue;
            return this;
        }

        if (isElement(newValue)) {              // specific element
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
        if (trySelector(newValue)) {            // CSS selector to match event.target
            this.options.allowFrom = newValue;
            return this;
        }

        if (isElement(newValue)) {              // specific element
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
        if (!(iEvent && iEvent.type) || !contains(eventTypes, iEvent.type)) {
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
        if (isFunction(this[onEvent])) {
            funcName = this[onEvent].name;
            this[onEvent](iEvent);
        }

        // interact.on() listeners
        if (iEvent.type in globalEvents && (listeners = globalEvents[iEvent.type]))  {

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

        if (isString(eventType) && eventType.search(' ') !== -1) {
            eventType = eventType.trim().split(/ +/);
        }

        if (isArray(eventType)) {
            for (i = 0; i < eventType.length; i++) {
                this.on(eventType[i], listener, useCapture);
            }

            return this;
        }

        if (isObject(eventType)) {
            for (var prop in eventType) {
                this.on(prop, eventType[prop], listener);
            }

            return this;
        }

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
            else {
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
                for (i = 0; i < documents.length; i++) {
                    events.add(documents[i], eventType, delegateListener);
                    events.add(documents[i], eventType, delegateUseCapture, true);
                }
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

        if (isString(eventType) && eventType.search(' ') !== -1) {
            eventType = eventType.trim().split(/ +/);
        }

        if (isArray(eventType)) {
            for (i = 0; i < eventType.length; i++) {
                this.off(eventType[i], listener, useCapture);
            }

            return this;
        }

        if (isObject(eventType)) {
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
        if (!isObject(options)) {
            options = {};
        }

        this.options = extend({}, defaultOptions.base);

        var i,
            actions = ['drag', 'drop', 'resize', 'gesture'],
            methods = ['draggable', 'dropzone', 'resizable', 'gesturable'],
            perActions = extend(extend({}, defaultOptions.perAction), options[action] || {});

        for (i = 0; i < actions.length; i++) {
            var action = actions[i];

            this.options[action] = extend({}, defaultOptions[action]);

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

            this.options[setting] = defaultOptions.base[setting];

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

        if (!isString(this.selector)) {
            events.remove(this, 'all');
            if (this.options.styleCursor) {
                this._element.style.cursor = '';
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

                    events.remove(this._context, type, delegateListener);
                    events.remove(this._context, type, delegateUseCapture, true);

                    break;
                }
            }
        }

        this.dropzone(false);

        interactables.splice(indexOf(interactables, this), 1);

        return interact;
    }
};

function warnOnce (method, message) {
    var warned = false;

    return function () {
        if (!warned) {
            window.console.warn(message);
            warned = true;
        }

        return method.apply(this, arguments);
    };
}

Interactable.prototype.snap = warnOnce(Interactable.prototype.snap,
    'Interactable#snap is deprecated. See the new documentation for snapping at http://interactjs.io/docs/snapping');
Interactable.prototype.restrict = warnOnce(Interactable.prototype.restrict,
    'Interactable#restrict is deprecated. See the new documentation for resticting at http://interactjs.io/docs/restriction');
Interactable.prototype.inertia = warnOnce(Interactable.prototype.inertia,
    'Interactable#inertia is deprecated. See the new documentation for inertia at http://interactjs.io/docs/inertia');
Interactable.prototype.autoScroll = warnOnce(Interactable.prototype.autoScroll,
    'Interactable#autoScroll is deprecated. See the new documentation for autoScroll at http://interactjs.io/docs/#autoscroll');
Interactable.prototype.squareResize = warnOnce(Interactable.prototype.squareResize,
    'Interactable#squareResize is deprecated. See http://interactjs.io/docs/#resize-square');

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
 - type       (string | array | object) The types of events to listen for
 - listener   (function) The function to be called on the given event(s)
 - useCapture (boolean) #optional useCapture flag for addEventListener
 = (object) interact
 \*/
interact.on = function (type, listener, useCapture) {
    if (isString(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
    }

    if (isArray(type)) {
        for (var i = 0; i < type.length; i++) {
            interact.on(type[i], listener, useCapture);
        }

        return interact;
    }

    if (isObject(type)) {
        for (var prop in type) {
            interact.on(prop, type[prop], listener);
        }

        return interact;
    }

    // if it is an InteractEvent type, add listener to globalEvents
    if (contains(eventTypes, type)) {
        // if this type of event was never bound
        if (!globalEvents[type]) {
            globalEvents[type] = [listener];
        }
        else {
            globalEvents[type].push(listener);
        }
    }
    // If non InteractEvent type, addEventListener to document
    else {
        events.add(document, type, listener, useCapture);
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
    if (isString(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
    }

    if (isArray(type)) {
        for (var i = 0; i < type.length; i++) {
            interact.off(type[i], listener, useCapture);
        }

        return interact;
    }

    if (isObject(type)) {
        for (var prop in type) {
            interact.off(prop, type[prop], listener);
        }

        return interact;
    }

    if (!contains(eventTypes, type)) {
        events.remove(document, type, listener, useCapture);
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
interact.enableDragging = warnOnce(function (newValue) {
    if (newValue !== null && newValue !== undefined) {
        actionIsEnabled.drag = newValue;

        return interact;
    }
    return actionIsEnabled.drag;
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
interact.enableResizing = warnOnce(function (newValue) {
    if (newValue !== null && newValue !== undefined) {
        actionIsEnabled.resize = newValue;

        return interact;
    }
    return actionIsEnabled.resize;
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
interact.enableGesturing = warnOnce(function (newValue) {
    if (newValue !== null && newValue !== undefined) {
        actionIsEnabled.gesture = newValue;

        return interact;
    }
    return actionIsEnabled.gesture;
}, 'interact.enableGesturing is deprecated and will soon be removed.');

interact.eventTypes = eventTypes;

/*\
 * interact.debug
 [ method ]
 *
 * Returns debugging data
 = (object) An object with properties that outline the current state and expose internal functions and variables
 \*/
interact.debug = function () {
    var interaction = interactions[0] || new Interaction();

    return {
        interactions          : interactions,
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
        addPointer            : listeners.addPointer,
        removePointer         : listeners.removePointer,
        recordPointer        : listeners.recordPointer,

        snap                  : interaction.snapStatus,
        restrict              : interaction.restrictStatus,
        inertia               : interaction.inertiaStatus,

        downTime              : interaction.downTimes[0],
        downEvent             : interaction.downEvent,
        downPointer           : interaction.downPointer,
        prevEvent             : interaction.prevEvent,

        Interactable          : Interactable,
        interactables         : interactables,
        pointerIsDown         : interaction.pointerIsDown,
        defaultOptions        : defaultOptions,
        defaultActionChecker  : defaultActionChecker,

        actionCursors         : actionCursors,
        dragMove              : listeners.dragMove,
        resizeMove            : listeners.resizeMove,
        gestureMove           : listeners.gestureMove,
        pointerUp             : listeners.pointerUp,
        pointerDown           : listeners.pointerDown,
        pointerMove           : listeners.pointerMove,
        pointerHover          : listeners.pointerHover,

        eventTypes            : eventTypes,

        events                : events,
        globalEvents          : globalEvents,
        delegatedEvents       : delegatedEvents
    };
};

// expose the functions used to calculate multi-touch properties
interact.getTouchAverage  = touchAverage;
interact.getTouchBBox     = touchBBox;
interact.getTouchDistance = touchDistance;
interact.getTouchAngle    = touchAngle;

interact.getElementRect   = getElementRect;
interact.matchesSelector  = matchesSelector;
interact.closest          = closest;

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
    if (isNumber(newvalue)) {
        margin = newvalue;

        return interact;
    }
    return margin;
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
 * interact.supportsPointerEvent
 [ method ]
 *
 = (boolean) Whether or not the browser supports PointerEvents
 \*/
interact.supportsPointerEvent = function () {
    return supportsPointerEvent;
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
    for (var i = interactions.length - 1; i > 0; i--) {
        interactions[i].stop(event);
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
    if (isBool(newValue)) {
        //if (dragging && dynamicDrop !== newValue && !newValue) {
        //calcRects(dropzones);
        //}

        dynamicDrop = newValue;

        return interact;
    }
    return dynamicDrop;
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
    if (isNumber(newValue)) {
        pointerMoveTolerance = newValue;

        return this;
    }

    return pointerMoveTolerance;
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
    if (isNumber(newValue)) {
        maxInteractions = newValue;

        return this;
    }

    return maxInteractions;
};

interact.createSnapGrid = function (grid) {
    return function (x, y) {
        var offsetX = 0,
            offsetY = 0;

        if (isObject(grid.offset)) {
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

function endAllInteractions (event) {
    for (var i = 0; i < interactions.length; i++) {
        interactions[i].pointerEnd(event, event);
    }
}

function listenToDocument (doc) {
    if (contains(documents, doc)) { return; }

    var win = doc.defaultView || doc.parentWindow;

    // add delegate event listener
    for (var eventType in delegatedEvents) {
        events.add(doc, eventType, delegateListener);
        events.add(doc, eventType, delegateUseCapture, true);
    }

    if (PointerEvent) {
        if (PointerEvent === win.MSPointerEvent) {
            pEventTypes = {
                up: 'MSPointerUp', down: 'MSPointerDown', over: 'mouseover',
                out: 'mouseout', move: 'MSPointerMove', cancel: 'MSPointerCancel' };
        }
        else {
            pEventTypes = {
                up: 'pointerup', down: 'pointerdown', over: 'pointerover',
                out: 'pointerout', move: 'pointermove', cancel: 'pointercancel' };
        }

        events.add(doc, pEventTypes.down  , listeners.selectorDown );
        events.add(doc, pEventTypes.move  , listeners.pointerMove  );
        events.add(doc, pEventTypes.over  , listeners.pointerOver  );
        events.add(doc, pEventTypes.out   , listeners.pointerOut   );
        events.add(doc, pEventTypes.up    , listeners.pointerUp    );
        events.add(doc, pEventTypes.cancel, listeners.pointerCancel);

        // autoscroll
        events.add(doc, pEventTypes.move, listeners.autoScrollMove);
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
            var interaction = interactions[0];

            if (interaction.currentAction()) {
                interaction.checkAndPreventDefault(event);
            }
        });

        // For IE's bad dblclick event sequence
        events.add(doc, 'dblclick', doOnInteractions('ie8Dblclick'));
    }

    documents.push(doc);
}

listenToDocument(document);

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

function matchesSelector (element, selector, nodeList) {
    if (ie8MatchesSelector) {
        return ie8MatchesSelector(element, selector, nodeList);
    }

    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (window !== realWindow) {
        selector = selector.replace(/\/deep\//g, ' ');
    }

    return element[prefixedMatchesSelector](selector);
}

function matchesUpTo (element, selector, limit) {
    while (isElement(element)) {
        if (matchesSelector(element, selector)) {
            return true;
        }

        element = parentElement(element);

        if (element === limit) {
            return matchesSelector(element, selector);
        }
    }

    return false;
}

// For IE8's lack of an Element#matchesSelector
// taken from http://tanalin.com/en/blog/2012/12/matches-selector-ie8/ and modified
if (!(prefixedMatchesSelector in Element.prototype) || !isFunction(Element.prototype[prefixedMatchesSelector])) {
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

    for(var x = 0; x < vendors.length && !realWindow.requestAnimationFrame; ++x) {
        reqFrame = realWindow[vendors[x]+'RequestAnimationFrame'];
        cancelFrame = realWindow[vendors[x]+'CancelAnimationFrame'] || realWindow[vendors[x]+'CancelRequestAnimationFrame'];
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
}());

// CommonJS
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = interact;
    }
    exports['interact'] = interact;
}
// AMD
else if (typeof define === 'function' && define.amd) {
    define('interact', function() {
        return interact;
    });
};

// Always export on the global scope
window['interact'] = interact;
},{"./utils/window":2}],2:[function(require,module,exports){
var interactWindow = typeof window === 'undefined' ? undefined : window;

module.exports = interactWindow;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW50ZXJhY3QuanMiLCJzcmMvdXRpbHMvd2luZG93LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaHVMQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIGludGVyYWN0LmpzIHYxLjIuNFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMi0yMDE1IFRheWUgQWRleWVtaSA8ZGV2QHRheWUubWU+XG4gKiBPcGVuIHNvdXJjZSB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKiBodHRwczovL3Jhdy5naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvbWFzdGVyL0xJQ0VOU0VcbiAqL1xuXG52YXIgcmVhbFdpbmRvdyA9IHJlcXVpcmUoJy4vdXRpbHMvd2luZG93Jyk7XG5cbi8vIHJldHVybiBlYXJseSBpZiB0aGVyZSdzIG5vIHdpbmRvdyB0byB3b3JrIHdpdGggKGVnLiBOb2RlLmpzKVxuaWYgKCFyZWFsV2luZG93KSB7IHJldHVybjsgfVxuXG52YXIgLy8gZ2V0IHdyYXBwZWQgd2luZG93IGlmIHVzaW5nIFNoYWRvdyBET00gcG9seWZpbGxcbiAgICB3aW5kb3cgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjcmVhdGUgYSBUZXh0Tm9kZVxuICAgICAgICB2YXIgZWwgPSByZWFsV2luZG93LmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcblxuICAgICAgICAvLyBjaGVjayBpZiBpdCdzIHdyYXBwZWQgYnkgYSBwb2x5ZmlsbFxuICAgICAgICBpZiAoZWwub3duZXJEb2N1bWVudCAhPT0gcmVhbFdpbmRvdy5kb2N1bWVudFxuICAgICAgICAgICAgJiYgdHlwZW9mIHJlYWxXaW5kb3cud3JhcCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgJiYgcmVhbFdpbmRvdy53cmFwKGVsKSA9PT0gZWwpIHtcbiAgICAgICAgICAgIC8vIHJldHVybiB3cmFwcGVkIHdpbmRvd1xuICAgICAgICAgICAgcmV0dXJuIHJlYWxXaW5kb3cud3JhcChyZWFsV2luZG93KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vIFNoYWRvdyBET00gcG9seWZpbCBvciBuYXRpdmUgaW1wbGVtZW50YXRpb25cbiAgICAgICAgcmV0dXJuIHJlYWxXaW5kb3c7XG4gICAgfSgpKSxcblxuICAgIGRvY3VtZW50ICAgICAgICAgICA9IHdpbmRvdy5kb2N1bWVudCxcbiAgICBEb2N1bWVudEZyYWdtZW50ICAgPSB3aW5kb3cuRG9jdW1lbnRGcmFnbWVudCAgIHx8IGJsYW5rLFxuICAgIFNWR0VsZW1lbnQgICAgICAgICA9IHdpbmRvdy5TVkdFbGVtZW50ICAgICAgICAgfHwgYmxhbmssXG4gICAgU1ZHU1ZHRWxlbWVudCAgICAgID0gd2luZG93LlNWR1NWR0VsZW1lbnQgICAgICB8fCBibGFuayxcbiAgICBTVkdFbGVtZW50SW5zdGFuY2UgPSB3aW5kb3cuU1ZHRWxlbWVudEluc3RhbmNlIHx8IGJsYW5rLFxuICAgIEhUTUxFbGVtZW50ICAgICAgICA9IHdpbmRvdy5IVE1MRWxlbWVudCAgICAgICAgfHwgd2luZG93LkVsZW1lbnQsXG5cbiAgICBQb2ludGVyRXZlbnQgPSAod2luZG93LlBvaW50ZXJFdmVudCB8fCB3aW5kb3cuTVNQb2ludGVyRXZlbnQpLFxuICAgIHBFdmVudFR5cGVzLFxuXG4gICAgaHlwb3QgPSBNYXRoLmh5cG90IHx8IGZ1bmN0aW9uICh4LCB5KSB7IHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSk7IH0sXG5cbiAgICB0bXBYWSA9IHt9LCAgICAgLy8gcmVkdWNlIG9iamVjdCBjcmVhdGlvbiBpbiBnZXRYWSgpXG5cbiAgICBkb2N1bWVudHMgICAgICAgPSBbXSwgICAvLyBhbGwgZG9jdW1lbnRzIGJlaW5nIGxpc3RlbmVkIHRvXG5cbiAgICBpbnRlcmFjdGFibGVzICAgPSBbXSwgICAvLyBhbGwgc2V0IGludGVyYWN0YWJsZXNcbiAgICBpbnRlcmFjdGlvbnMgICAgPSBbXSwgICAvLyBhbGwgaW50ZXJhY3Rpb25zXG5cbiAgICBkeW5hbWljRHJvcCAgICAgPSBmYWxzZSxcblxuLy8ge1xuLy8gICAgICB0eXBlOiB7XG4vLyAgICAgICAgICBzZWxlY3RvcnM6IFsnc2VsZWN0b3InLCAuLi5dLFxuLy8gICAgICAgICAgY29udGV4dHMgOiBbZG9jdW1lbnQsIC4uLl0sXG4vLyAgICAgICAgICBsaXN0ZW5lcnM6IFtbbGlzdGVuZXIsIHVzZUNhcHR1cmVdLCAuLi5dXG4vLyAgICAgIH1cbi8vICB9XG4gICAgZGVsZWdhdGVkRXZlbnRzID0ge30sXG5cbiAgICBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgYmFzZToge1xuICAgICAgICAgICAgYWNjZXB0ICAgICAgICA6IG51bGwsXG4gICAgICAgICAgICBhY3Rpb25DaGVja2VyIDogbnVsbCxcbiAgICAgICAgICAgIHN0eWxlQ3Vyc29yICAgOiB0cnVlLFxuICAgICAgICAgICAgcHJldmVudERlZmF1bHQ6ICdhdXRvJyxcbiAgICAgICAgICAgIG9yaWdpbiAgICAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgICAgIGRlbHRhU291cmNlICAgOiAncGFnZScsXG4gICAgICAgICAgICBhbGxvd0Zyb20gICAgIDogbnVsbCxcbiAgICAgICAgICAgIGlnbm9yZUZyb20gICAgOiBudWxsLFxuICAgICAgICAgICAgX2NvbnRleHQgICAgICA6IGRvY3VtZW50LFxuICAgICAgICAgICAgZHJvcENoZWNrZXIgICA6IG51bGxcbiAgICAgICAgfSxcblxuICAgICAgICBkcmFnOiB7XG4gICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgIG1hbnVhbFN0YXJ0OiB0cnVlLFxuICAgICAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgICAgIG1heFBlckVsZW1lbnQ6IDEsXG5cbiAgICAgICAgICAgIHNuYXA6IG51bGwsXG4gICAgICAgICAgICByZXN0cmljdDogbnVsbCxcbiAgICAgICAgICAgIGluZXJ0aWE6IG51bGwsXG4gICAgICAgICAgICBhdXRvU2Nyb2xsOiBudWxsLFxuXG4gICAgICAgICAgICBheGlzOiAneHknLFxuICAgICAgICB9LFxuXG4gICAgICAgIGRyb3A6IHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgYWNjZXB0OiBudWxsLFxuICAgICAgICAgICAgb3ZlcmxhcDogJ3BvaW50ZXInXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzaXplOiB7XG4gICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgICAgICBtYXhQZXJFbGVtZW50OiAxLFxuXG4gICAgICAgICAgICBzbmFwOiBudWxsLFxuICAgICAgICAgICAgcmVzdHJpY3Q6IG51bGwsXG4gICAgICAgICAgICBpbmVydGlhOiBudWxsLFxuICAgICAgICAgICAgYXV0b1Njcm9sbDogbnVsbCxcblxuICAgICAgICAgICAgc3F1YXJlOiBmYWxzZSxcbiAgICAgICAgICAgIGF4aXM6ICd4eScsXG5cbiAgICAgICAgICAgIC8vIHVzZSBkZWZhdWx0IG1hcmdpblxuICAgICAgICAgICAgbWFyZ2luOiBOYU4sXG5cbiAgICAgICAgICAgIC8vIG9iamVjdCB3aXRoIHByb3BzIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB3aGljaCBhcmVcbiAgICAgICAgICAgIC8vIHRydWUvZmFsc2UgdmFsdWVzIHRvIHJlc2l6ZSB3aGVuIHRoZSBwb2ludGVyIGlzIG92ZXIgdGhhdCBlZGdlLFxuICAgICAgICAgICAgLy8gQ1NTIHNlbGVjdG9ycyB0byBtYXRjaCB0aGUgaGFuZGxlcyBmb3IgZWFjaCBkaXJlY3Rpb25cbiAgICAgICAgICAgIC8vIG9yIHRoZSBFbGVtZW50cyBmb3IgZWFjaCBoYW5kbGVcbiAgICAgICAgICAgIGVkZ2VzOiBudWxsLFxuXG4gICAgICAgICAgICAvLyBhIHZhbHVlIG9mICdub25lJyB3aWxsIGxpbWl0IHRoZSByZXNpemUgcmVjdCB0byBhIG1pbmltdW0gb2YgMHgwXG4gICAgICAgICAgICAvLyAnbmVnYXRlJyB3aWxsIGFsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAgICAgICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgICAgICAgICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIGFuZC9vciBzd2FwcGluZyB0aGUgbGVmdCBhbmQgcmlnaHQgZWRnZXNcbiAgICAgICAgICAgIGludmVydDogJ25vbmUnXG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2VzdHVyZToge1xuICAgICAgICAgICAgbWFudWFsU3RhcnQ6IGZhbHNlLFxuICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICBtYXg6IEluZmluaXR5LFxuICAgICAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICAgICAgcmVzdHJpY3Q6IG51bGxcbiAgICAgICAgfSxcblxuICAgICAgICBwZXJBY3Rpb246IHtcbiAgICAgICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgICAgICBtYXhQZXJFbGVtZW50OiAxLFxuXG4gICAgICAgICAgICBzbmFwOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZCAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlbmRPbmx5ICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJhbmdlICAgICAgIDogSW5maW5pdHksXG4gICAgICAgICAgICAgICAgdGFyZ2V0cyAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIG9mZnNldHMgICAgIDogbnVsbCxcblxuICAgICAgICAgICAgICAgIHJlbGF0aXZlUG9pbnRzOiBudWxsXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXN0cmljdDoge1xuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVuZE9ubHk6IGZhbHNlXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhdXRvU2Nyb2xsOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZCAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjb250YWluZXIgICA6IG51bGwsICAgICAvLyB0aGUgaXRlbSB0aGF0IGlzIHNjcm9sbGVkIChXaW5kb3cgb3IgSFRNTEVsZW1lbnQpXG4gICAgICAgICAgICAgICAgbWFyZ2luICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgICBzcGVlZCAgICAgICA6IDMwMCAgICAgICAvLyB0aGUgc2Nyb2xsIHNwZWVkIGluIHBpeGVscyBwZXIgc2Vjb25kXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpbmVydGlhOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZCAgICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJlc2lzdGFuY2UgICAgICAgOiAxMCwgICAgLy8gdGhlIGxhbWJkYSBpbiBleHBvbmVudGlhbCBkZWNheVxuICAgICAgICAgICAgICAgIG1pblNwZWVkICAgICAgICAgOiAxMDAsICAgLy8gdGFyZ2V0IHNwZWVkIG11c3QgYmUgYWJvdmUgdGhpcyBmb3IgaW5lcnRpYSB0byBzdGFydFxuICAgICAgICAgICAgICAgIGVuZFNwZWVkICAgICAgICAgOiAxMCwgICAgLy8gdGhlIHNwZWVkIGF0IHdoaWNoIGluZXJ0aWEgaXMgc2xvdyBlbm91Z2ggdG8gc3RvcFxuICAgICAgICAgICAgICAgIGFsbG93UmVzdW1lICAgICAgOiB0cnVlLCAgLy8gYWxsb3cgcmVzdW1pbmcgYW4gYWN0aW9uIGluIGluZXJ0aWEgcGhhc2VcbiAgICAgICAgICAgICAgICB6ZXJvUmVzdW1lRGVsdGEgIDogdHJ1ZSwgIC8vIGlmIGFuIGFjdGlvbiBpcyByZXN1bWVkIGFmdGVyIGxhdW5jaCwgc2V0IGR4L2R5IHRvIDBcbiAgICAgICAgICAgICAgICBzbW9vdGhFbmREdXJhdGlvbjogMzAwICAgIC8vIGFuaW1hdGUgdG8gc25hcC9yZXN0cmljdCBlbmRPbmx5IGlmIHRoZXJlJ3Mgbm8gaW5lcnRpYVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9ob2xkRHVyYXRpb246IDYwMFxuICAgIH0sXG5cbi8vIFRoaW5ncyByZWxhdGVkIHRvIGF1dG9TY3JvbGxcbiAgICBhdXRvU2Nyb2xsID0ge1xuICAgICAgICBpbnRlcmFjdGlvbjogbnVsbCxcbiAgICAgICAgaTogbnVsbCwgICAgLy8gdGhlIGhhbmRsZSByZXR1cm5lZCBieSB3aW5kb3cuc2V0SW50ZXJ2YWxcbiAgICAgICAgeDogMCwgeTogMCwgLy8gRGlyZWN0aW9uIGVhY2ggcHVsc2UgaXMgdG8gc2Nyb2xsIGluXG5cbiAgICAgICAgLy8gc2Nyb2xsIHRoZSB3aW5kb3cgYnkgdGhlIHZhbHVlcyBpbiBzY3JvbGwueC95XG4gICAgICAgIHNjcm9sbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBhdXRvU2Nyb2xsLmludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zW2F1dG9TY3JvbGwuaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZV0uYXV0b1Njcm9sbCxcbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSBvcHRpb25zLmNvbnRhaW5lciB8fCBnZXRXaW5kb3coYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi5lbGVtZW50KSxcbiAgICAgICAgICAgICAgICBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgICAgIC8vIGNoYW5nZSBpbiB0aW1lIGluIHNlY29uZHNcbiAgICAgICAgICAgICAgICBkdCA9IChub3cgLSBhdXRvU2Nyb2xsLnByZXZUaW1lKSAvIDEwMDAsXG4gICAgICAgICAgICAvLyBkaXNwbGFjZW1lbnRcbiAgICAgICAgICAgICAgICBzID0gb3B0aW9ucy5zcGVlZCAqIGR0O1xuXG4gICAgICAgICAgICBpZiAocyA+PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzV2luZG93KGNvbnRhaW5lcikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbEJ5KGF1dG9TY3JvbGwueCAqIHMsIGF1dG9TY3JvbGwueSAqIHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbExlZnQgKz0gYXV0b1Njcm9sbC54ICogcztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbFRvcCAgKz0gYXV0b1Njcm9sbC55ICogcztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbm93O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYXV0b1Njcm9sbC5pc1Njcm9sbGluZykge1xuICAgICAgICAgICAgICAgIGNhbmNlbEZyYW1lKGF1dG9TY3JvbGwuaSk7XG4gICAgICAgICAgICAgICAgYXV0b1Njcm9sbC5pID0gcmVxRnJhbWUoYXV0b1Njcm9sbC5zY3JvbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGlzU2Nyb2xsaW5nOiBmYWxzZSxcbiAgICAgICAgcHJldlRpbWU6IDAsXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChpbnRlcmFjdGlvbikge1xuICAgICAgICAgICAgYXV0b1Njcm9sbC5pc1Njcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICBjYW5jZWxGcmFtZShhdXRvU2Nyb2xsLmkpO1xuXG4gICAgICAgICAgICBhdXRvU2Nyb2xsLmludGVyYWN0aW9uID0gaW50ZXJhY3Rpb247XG4gICAgICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICBhdXRvU2Nyb2xsLmkgPSByZXFGcmFtZShhdXRvU2Nyb2xsLnNjcm9sbCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYXV0b1Njcm9sbC5pc1Njcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgY2FuY2VsRnJhbWUoYXV0b1Njcm9sbC5pKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIERvZXMgdGhlIGJyb3dzZXIgc3VwcG9ydCB0b3VjaCBpbnB1dD9cbiAgICBzdXBwb3J0c1RvdWNoID0gKCgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHx8IHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2Ygd2luZG93LkRvY3VtZW50VG91Y2gpLFxuXG4vLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgUG9pbnRlckV2ZW50c1xuICAgIHN1cHBvcnRzUG9pbnRlckV2ZW50ID0gISFQb2ludGVyRXZlbnQsXG5cbi8vIExlc3MgUHJlY2lzaW9uIHdpdGggdG91Y2ggaW5wdXRcbiAgICBtYXJnaW4gPSBzdXBwb3J0c1RvdWNoIHx8IHN1cHBvcnRzUG9pbnRlckV2ZW50PyAyMDogMTAsXG5cbiAgICBwb2ludGVyTW92ZVRvbGVyYW5jZSA9IDEsXG5cbi8vIGZvciBpZ25vcmluZyBicm93c2VyJ3Mgc2ltdWxhdGVkIG1vdXNlIGV2ZW50c1xuICAgIHByZXZUb3VjaFRpbWUgPSAwLFxuXG4vLyBBbGxvdyB0aGlzIG1hbnkgaW50ZXJhY3Rpb25zIHRvIGhhcHBlbiBzaW11bHRhbmVvdXNseVxuICAgIG1heEludGVyYWN0aW9ucyA9IEluZmluaXR5LFxuXG4vLyBDaGVjayBpZiBpcyBJRTkgb3Igb2xkZXJcbiAgICBhY3Rpb25DdXJzb3JzID0gKGRvY3VtZW50LmFsbCAmJiAhd2luZG93LmF0b2IpID8ge1xuICAgICAgICBkcmFnICAgIDogJ21vdmUnLFxuICAgICAgICByZXNpemV4IDogJ2UtcmVzaXplJyxcbiAgICAgICAgcmVzaXpleSA6ICdzLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXh5OiAnc2UtcmVzaXplJyxcblxuICAgICAgICByZXNpemV0b3AgICAgICAgIDogJ24tcmVzaXplJyxcbiAgICAgICAgcmVzaXplbGVmdCAgICAgICA6ICd3LXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbSAgICAgOiAncy1yZXNpemUnLFxuICAgICAgICByZXNpemVyaWdodCAgICAgIDogJ2UtcmVzaXplJyxcbiAgICAgICAgcmVzaXpldG9wbGVmdCAgICA6ICdzZS1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b21yaWdodDogJ3NlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXRvcHJpZ2h0ICAgOiAnbmUtcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tbGVmdCA6ICduZS1yZXNpemUnLFxuXG4gICAgICAgIGdlc3R1cmUgOiAnJ1xuICAgIH0gOiB7XG4gICAgICAgIGRyYWcgICAgOiAnbW92ZScsXG4gICAgICAgIHJlc2l6ZXggOiAnZXctcmVzaXplJyxcbiAgICAgICAgcmVzaXpleSA6ICducy1yZXNpemUnLFxuICAgICAgICByZXNpemV4eTogJ253c2UtcmVzaXplJyxcblxuICAgICAgICByZXNpemV0b3AgICAgICAgIDogJ25zLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWxlZnQgICAgICAgOiAnZXctcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tICAgICA6ICducy1yZXNpemUnLFxuICAgICAgICByZXNpemVyaWdodCAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXRvcGxlZnQgICAgOiAnbndzZS1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b21yaWdodDogJ253c2UtcmVzaXplJyxcbiAgICAgICAgcmVzaXpldG9wcmlnaHQgICA6ICduZXN3LXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbWxlZnQgOiAnbmVzdy1yZXNpemUnLFxuXG4gICAgICAgIGdlc3R1cmUgOiAnJ1xuICAgIH0sXG5cbiAgICBhY3Rpb25Jc0VuYWJsZWQgPSB7XG4gICAgICAgIGRyYWcgICA6IHRydWUsXG4gICAgICAgIHJlc2l6ZSA6IHRydWUsXG4gICAgICAgIGdlc3R1cmU6IHRydWVcbiAgICB9LFxuXG4vLyBiZWNhdXNlIFdlYmtpdCBhbmQgT3BlcmEgc3RpbGwgdXNlICdtb3VzZXdoZWVsJyBldmVudCB0eXBlXG4gICAgd2hlZWxFdmVudCA9ICdvbm1vdXNld2hlZWwnIGluIGRvY3VtZW50PyAnbW91c2V3aGVlbCc6ICd3aGVlbCcsXG5cbiAgICBldmVudFR5cGVzID0gW1xuICAgICAgICAnZHJhZ3N0YXJ0JyxcbiAgICAgICAgJ2RyYWdtb3ZlJyxcbiAgICAgICAgJ2RyYWdpbmVydGlhc3RhcnQnLFxuICAgICAgICAnZHJhZ2VuZCcsXG4gICAgICAgICdkcmFnZW50ZXInLFxuICAgICAgICAnZHJhZ2xlYXZlJyxcbiAgICAgICAgJ2Ryb3BhY3RpdmF0ZScsXG4gICAgICAgICdkcm9wZGVhY3RpdmF0ZScsXG4gICAgICAgICdkcm9wbW92ZScsXG4gICAgICAgICdkcm9wJyxcbiAgICAgICAgJ3Jlc2l6ZXN0YXJ0JyxcbiAgICAgICAgJ3Jlc2l6ZW1vdmUnLFxuICAgICAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAgICAgJ3Jlc2l6ZWVuZCcsXG4gICAgICAgICdnZXN0dXJlc3RhcnQnLFxuICAgICAgICAnZ2VzdHVyZW1vdmUnLFxuICAgICAgICAnZ2VzdHVyZWluZXJ0aWFzdGFydCcsXG4gICAgICAgICdnZXN0dXJlZW5kJyxcblxuICAgICAgICAnZG93bicsXG4gICAgICAgICdtb3ZlJyxcbiAgICAgICAgJ3VwJyxcbiAgICAgICAgJ2NhbmNlbCcsXG4gICAgICAgICd0YXAnLFxuICAgICAgICAnZG91YmxldGFwJyxcbiAgICAgICAgJ2hvbGQnXG4gICAgXSxcblxuICAgIGdsb2JhbEV2ZW50cyA9IHt9LFxuXG4vLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gICAgaXNPcGVyYU1vYmlsZSA9IG5hdmlnYXRvci5hcHBOYW1lID09ICdPcGVyYScgJiZcbiAgICAgICAgc3VwcG9ydHNUb3VjaCAmJlxuICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKCdQcmVzdG8nKSxcblxuLy8gc2Nyb2xsaW5nIGRvZXNuJ3QgY2hhbmdlIHRoZSByZXN1bHQgb2Zcbi8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdC9nZXRDbGllbnRSZWN0cyBvbiBpT1MgPD03IGJ1dCBpdCBkb2VzIG9uIGlPUyA4XG4gICAgaXNJT1M3b3JMb3dlciA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKVxuICAgICYmIC9PUyBbMS03XVteXFxkXS8udGVzdChuYXZpZ2F0b3IuYXBwVmVyc2lvbikpLFxuXG4vLyBwcmVmaXggbWF0Y2hlc1NlbGVjdG9yXG4gICAgcHJlZml4ZWRNYXRjaGVzU2VsZWN0b3IgPSAnbWF0Y2hlcycgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICdtYXRjaGVzJzogJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InOiAnbW96TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgJ21vek1hdGNoZXNTZWxlY3Rvcic6ICdvTWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgJ29NYXRjaGVzU2VsZWN0b3InOiAnbXNNYXRjaGVzU2VsZWN0b3InLFxuXG4vLyB3aWxsIGJlIHBvbHlmaWxsIGZ1bmN0aW9uIGlmIGJyb3dzZXIgaXMgSUU4XG4gICAgaWU4TWF0Y2hlc1NlbGVjdG9yLFxuXG4vLyBuYXRpdmUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIG9yIHBvbHlmaWxsXG4gICAgcmVxRnJhbWUgPSByZWFsV2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSxcbiAgICBjYW5jZWxGcmFtZSA9IHJlYWxXaW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUsXG5cbi8vIEV2ZW50cyB3cmFwcGVyXG4gICAgZXZlbnRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVzZUF0dGFjaEV2ZW50ID0gKCdhdHRhY2hFdmVudCcgaW4gd2luZG93KSAmJiAhKCdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cpLFxuICAgICAgICAgICAgYWRkRXZlbnQgICAgICAgPSB1c2VBdHRhY2hFdmVudD8gICdhdHRhY2hFdmVudCc6ICdhZGRFdmVudExpc3RlbmVyJyxcbiAgICAgICAgICAgIHJlbW92ZUV2ZW50ICAgID0gdXNlQXR0YWNoRXZlbnQ/ICAnZGV0YWNoRXZlbnQnOiAncmVtb3ZlRXZlbnRMaXN0ZW5lcicsXG4gICAgICAgICAgICBvbiAgICAgICAgICAgICA9IHVzZUF0dGFjaEV2ZW50PyAnb24nOiAnJyxcblxuICAgICAgICAgICAgZWxlbWVudHMgICAgICAgICAgPSBbXSxcbiAgICAgICAgICAgIHRhcmdldHMgICAgICAgICAgID0gW10sXG4gICAgICAgICAgICBhdHRhY2hlZExpc3RlbmVycyA9IFtdO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZCAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50SW5kZXggPSBpbmRleE9mKGVsZW1lbnRzLCBlbGVtZW50KSxcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXRzW2VsZW1lbnRJbmRleF07XG5cbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHt9LFxuICAgICAgICAgICAgICAgICAgICB0eXBlQ291bnQ6IDBcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZWxlbWVudEluZGV4ID0gZWxlbWVudHMucHVzaChlbGVtZW50KSAtIDE7XG4gICAgICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKHRhcmdldCk7XG5cbiAgICAgICAgICAgICAgICBhdHRhY2hlZExpc3RlbmVycy5wdXNoKCh1c2VBdHRhY2hFdmVudCA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VwcGxpZWQ6IFtdLFxuICAgICAgICAgICAgICAgICAgICB3cmFwcGVkIDogW10sXG4gICAgICAgICAgICAgICAgICAgIHVzZUNvdW50OiBbXVxuICAgICAgICAgICAgICAgIH0gOiBudWxsKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGFyZ2V0LmV2ZW50c1t0eXBlXSkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB0YXJnZXQudHlwZUNvdW50Kys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY29udGFpbnModGFyZ2V0LmV2ZW50c1t0eXBlXSwgbGlzdGVuZXIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJldDtcblxuICAgICAgICAgICAgICAgIGlmICh1c2VBdHRhY2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gYXR0YWNoZWRMaXN0ZW5lcnNbZWxlbWVudEluZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVySW5kZXggPSBpbmRleE9mKGxpc3RlbmVycy5zdXBwbGllZCwgbGlzdGVuZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB3cmFwcGVkID0gbGlzdGVuZXJzLndyYXBwZWRbbGlzdGVuZXJJbmRleF0gfHwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFldmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0ID0gZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQgPSBldmVudC5wcmV2ZW50RGVmYXVsdCB8fCBwcmV2ZW50RGVmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24gPSBldmVudC5zdG9wUHJvcGFnYXRpb24gfHwgc3RvcFByb3A7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiA9IGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiB8fCBzdG9wSW1tUHJvcDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoL21vdXNlfGNsaWNrLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCA9IGV2ZW50LmNsaWVudFggKyBnZXRXaW5kb3coZWxlbWVudCkuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSA9IGV2ZW50LmNsaWVudFkgKyBnZXRXaW5kb3coZWxlbWVudCkuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHJldCA9IGVsZW1lbnRbYWRkRXZlbnRdKG9uICsgdHlwZSwgd3JhcHBlZCwgQm9vbGVhbih1c2VDYXB0dXJlKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVySW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3VwcGxpZWQucHVzaChsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMud3JhcHBlZC5wdXNoKHdyYXBwZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnVzZUNvdW50LnB1c2goMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0rKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gZWxlbWVudFthZGRFdmVudF0odHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0YXJnZXQuZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZSAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgIGVsZW1lbnRJbmRleCA9IGluZGV4T2YoZWxlbWVudHMsIGVsZW1lbnQpLFxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldHNbZWxlbWVudEluZGV4XSxcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMsXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJJbmRleCxcbiAgICAgICAgICAgICAgICB3cmFwcGVkID0gbGlzdGVuZXI7XG5cbiAgICAgICAgICAgIGlmICghdGFyZ2V0IHx8ICF0YXJnZXQuZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodXNlQXR0YWNoRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBhdHRhY2hlZExpc3RlbmVyc1tlbGVtZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVySW5kZXggPSBpbmRleE9mKGxpc3RlbmVycy5zdXBwbGllZCwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHdyYXBwZWQgPSBsaXN0ZW5lcnMud3JhcHBlZFtsaXN0ZW5lckluZGV4XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdhbGwnKSB7XG4gICAgICAgICAgICAgICAgZm9yICh0eXBlIGluIHRhcmdldC5ldmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5ldmVudHMuaGFzT3duUHJvcGVydHkodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShlbGVtZW50LCB0eXBlLCAnYWxsJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmV2ZW50c1t0eXBlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSB0YXJnZXQuZXZlbnRzW3R5cGVdLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gJ2FsbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmUoZWxlbWVudCwgdHlwZSwgdGFyZ2V0LmV2ZW50c1t0eXBlXVtpXSwgQm9vbGVhbih1c2VDYXB0dXJlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5ldmVudHNbdHlwZV1baV0gPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudFtyZW1vdmVFdmVudF0ob24gKyB0eXBlLCB3cmFwcGVkLCB1c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuZXZlbnRzW3R5cGVdLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VBdHRhY2hFdmVudCAmJiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnVzZUNvdW50W2xpc3RlbmVySW5kZXhdLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zdXBwbGllZC5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMud3JhcHBlZC5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnQuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmV2ZW50c1t0eXBlXSAmJiB0YXJnZXQuZXZlbnRzW3R5cGVdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnR5cGVDb3VudC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0YXJnZXQudHlwZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0cy5zcGxpY2UoZWxlbWVudEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5zcGxpY2UoZWxlbWVudEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBhdHRhY2hlZExpc3RlbmVycy5zcGxpY2UoZWxlbWVudEluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHByZXZlbnREZWYgKCkge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3RvcFByb3AgKCkge1xuICAgICAgICAgICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3RvcEltbVByb3AgKCkge1xuICAgICAgICAgICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFkZDogYWRkLFxuICAgICAgICAgICAgcmVtb3ZlOiByZW1vdmUsXG4gICAgICAgICAgICB1c2VBdHRhY2hFdmVudDogdXNlQXR0YWNoRXZlbnQsXG5cbiAgICAgICAgICAgIF9lbGVtZW50czogZWxlbWVudHMsXG4gICAgICAgICAgICBfdGFyZ2V0czogdGFyZ2V0cyxcbiAgICAgICAgICAgIF9hdHRhY2hlZExpc3RlbmVyczogYXR0YWNoZWRMaXN0ZW5lcnNcbiAgICAgICAgfTtcbiAgICB9KCkpO1xuXG5mdW5jdGlvbiBibGFuayAoKSB7fVxuXG5mdW5jdGlvbiBpc0VsZW1lbnQgKG8pIHtcbiAgICBpZiAoIW8gfHwgKHR5cGVvZiBvICE9PSAnb2JqZWN0JykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICB2YXIgX3dpbmRvdyA9IGdldFdpbmRvdyhvKSB8fCB3aW5kb3c7XG5cbiAgICByZXR1cm4gKC9vYmplY3R8ZnVuY3Rpb24vLnRlc3QodHlwZW9mIF93aW5kb3cuRWxlbWVudClcbiAgICAgICAgPyBvIGluc3RhbmNlb2YgX3dpbmRvdy5FbGVtZW50IC8vRE9NMlxuICAgICAgICA6IG8ubm9kZVR5cGUgPT09IDEgJiYgdHlwZW9mIG8ubm9kZU5hbWUgPT09IFwic3RyaW5nXCIpO1xufVxuZnVuY3Rpb24gaXNXaW5kb3cgKHRoaW5nKSB7IHJldHVybiAhISh0aGluZyAmJiB0aGluZy5XaW5kb3cpICYmICh0aGluZyBpbnN0YW5jZW9mIHRoaW5nLldpbmRvdyk7IH1cbmZ1bmN0aW9uIGlzRG9jRnJhZyAodGhpbmcpIHsgcmV0dXJuICEhdGhpbmcgJiYgdGhpbmcgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50OyB9XG5mdW5jdGlvbiBpc0FycmF5ICh0aGluZykge1xuICAgIHJldHVybiBpc09iamVjdCh0aGluZylcbiAgICAgICAgJiYgKHR5cGVvZiB0aGluZy5sZW5ndGggIT09IHVuZGVmaW5lZClcbiAgICAgICAgJiYgaXNGdW5jdGlvbih0aGluZy5zcGxpY2UpO1xufVxuZnVuY3Rpb24gaXNPYmplY3QgICAodGhpbmcpIHsgcmV0dXJuICEhdGhpbmcgJiYgKHR5cGVvZiB0aGluZyA9PT0gJ29iamVjdCcpOyB9XG5mdW5jdGlvbiBpc0Z1bmN0aW9uICh0aGluZykgeyByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nOyB9XG5mdW5jdGlvbiBpc051bWJlciAgICh0aGluZykgeyByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnbnVtYmVyJyAgOyB9XG5mdW5jdGlvbiBpc0Jvb2wgICAgICh0aGluZykgeyByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnYm9vbGVhbicgOyB9XG5mdW5jdGlvbiBpc1N0cmluZyAgICh0aGluZykgeyByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnc3RyaW5nJyAgOyB9XG5cbmZ1bmN0aW9uIHRyeVNlbGVjdG9yICh2YWx1ZSkge1xuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgLy8gYW4gZXhjZXB0aW9uIHdpbGwgYmUgcmFpc2VkIGlmIGl0IGlzIGludmFsaWRcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHZhbHVlKTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kIChkZXN0LCBzb3VyY2UpIHtcbiAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICBkZXN0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn1cblxuZnVuY3Rpb24gY29weUNvb3JkcyAoZGVzdCwgc3JjKSB7XG4gICAgZGVzdC5wYWdlID0gZGVzdC5wYWdlIHx8IHt9O1xuICAgIGRlc3QucGFnZS54ID0gc3JjLnBhZ2UueDtcbiAgICBkZXN0LnBhZ2UueSA9IHNyYy5wYWdlLnk7XG5cbiAgICBkZXN0LmNsaWVudCA9IGRlc3QuY2xpZW50IHx8IHt9O1xuICAgIGRlc3QuY2xpZW50LnggPSBzcmMuY2xpZW50Lng7XG4gICAgZGVzdC5jbGllbnQueSA9IHNyYy5jbGllbnQueTtcblxuICAgIGRlc3QudGltZVN0YW1wID0gc3JjLnRpbWVTdGFtcDtcbn1cblxuZnVuY3Rpb24gc2V0RXZlbnRYWSAodGFyZ2V0T2JqLCBwb2ludGVyLCBpbnRlcmFjdGlvbikge1xuICAgIGlmICghcG9pbnRlcikge1xuICAgICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcklkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBwb2ludGVyID0gdG91Y2hBdmVyYWdlKGludGVyYWN0aW9uLnBvaW50ZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvaW50ZXIgPSBpbnRlcmFjdGlvbi5wb2ludGVyc1swXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFBhZ2VYWShwb2ludGVyLCB0bXBYWSwgaW50ZXJhY3Rpb24pO1xuICAgIHRhcmdldE9iai5wYWdlLnggPSB0bXBYWS54O1xuICAgIHRhcmdldE9iai5wYWdlLnkgPSB0bXBYWS55O1xuXG4gICAgZ2V0Q2xpZW50WFkocG9pbnRlciwgdG1wWFksIGludGVyYWN0aW9uKTtcbiAgICB0YXJnZXRPYmouY2xpZW50LnggPSB0bXBYWS54O1xuICAgIHRhcmdldE9iai5jbGllbnQueSA9IHRtcFhZLnk7XG5cbiAgICB0YXJnZXRPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59XG5cbmZ1bmN0aW9uIHNldEV2ZW50RGVsdGFzICh0YXJnZXRPYmosIHByZXYsIGN1cikge1xuICAgIHRhcmdldE9iai5wYWdlLnggICAgID0gY3VyLnBhZ2UueCAgICAgIC0gcHJldi5wYWdlLng7XG4gICAgdGFyZ2V0T2JqLnBhZ2UueSAgICAgPSBjdXIucGFnZS55ICAgICAgLSBwcmV2LnBhZ2UueTtcbiAgICB0YXJnZXRPYmouY2xpZW50LnggICA9IGN1ci5jbGllbnQueCAgICAtIHByZXYuY2xpZW50Lng7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC55ICAgPSBjdXIuY2xpZW50LnkgICAgLSBwcmV2LmNsaWVudC55O1xuICAgIHRhcmdldE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHByZXYudGltZVN0YW1wO1xuXG4gICAgLy8gc2V0IHBvaW50ZXIgdmVsb2NpdHlcbiAgICB2YXIgZHQgPSBNYXRoLm1heCh0YXJnZXRPYmoudGltZVN0YW1wIC8gMTAwMCwgMC4wMDEpO1xuICAgIHRhcmdldE9iai5wYWdlLnNwZWVkICAgPSBoeXBvdCh0YXJnZXRPYmoucGFnZS54LCB0YXJnZXRPYmoucGFnZS55KSAvIGR0O1xuICAgIHRhcmdldE9iai5wYWdlLnZ4ICAgICAgPSB0YXJnZXRPYmoucGFnZS54IC8gZHQ7XG4gICAgdGFyZ2V0T2JqLnBhZ2UudnkgICAgICA9IHRhcmdldE9iai5wYWdlLnkgLyBkdDtcblxuICAgIHRhcmdldE9iai5jbGllbnQuc3BlZWQgPSBoeXBvdCh0YXJnZXRPYmouY2xpZW50LngsIHRhcmdldE9iai5wYWdlLnkpIC8gZHQ7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC52eCAgICA9IHRhcmdldE9iai5jbGllbnQueCAvIGR0O1xuICAgIHRhcmdldE9iai5jbGllbnQudnkgICAgPSB0YXJnZXRPYmouY2xpZW50LnkgLyBkdDtcbn1cblxuLy8gR2V0IHNwZWNpZmllZCBYL1kgY29vcmRzIGZvciBtb3VzZSBvciBldmVudC50b3VjaGVzWzBdXG5mdW5jdGlvbiBnZXRYWSAodHlwZSwgcG9pbnRlciwgeHkpIHtcbiAgICB4eSA9IHh5IHx8IHt9O1xuICAgIHR5cGUgPSB0eXBlIHx8ICdwYWdlJztcblxuICAgIHh5LnggPSBwb2ludGVyW3R5cGUgKyAnWCddO1xuICAgIHh5LnkgPSBwb2ludGVyW3R5cGUgKyAnWSddO1xuXG4gICAgcmV0dXJuIHh5O1xufVxuXG5mdW5jdGlvbiBnZXRQYWdlWFkgKHBvaW50ZXIsIHBhZ2UsIGludGVyYWN0aW9uKSB7XG4gICAgcGFnZSA9IHBhZ2UgfHwge307XG5cbiAgICBpZiAocG9pbnRlciBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgaWYgKC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkge1xuICAgICAgICAgICAgaW50ZXJhY3Rpb24gPSBpbnRlcmFjdGlvbiB8fCBwb2ludGVyLmludGVyYWN0aW9uO1xuXG4gICAgICAgICAgICBleHRlbmQocGFnZSwgaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy51cENvb3Jkcy5wYWdlKTtcblxuICAgICAgICAgICAgcGFnZS54ICs9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuc3g7XG4gICAgICAgICAgICBwYWdlLnkgKz0gaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5zeTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhZ2UueCA9IHBvaW50ZXIucGFnZVg7XG4gICAgICAgICAgICBwYWdlLnkgPSBwb2ludGVyLnBhZ2VZO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIE9wZXJhIE1vYmlsZSBoYW5kbGVzIHRoZSB2aWV3cG9ydCBhbmQgc2Nyb2xsaW5nIG9kZGx5XG4gICAgZWxzZSBpZiAoaXNPcGVyYU1vYmlsZSkge1xuICAgICAgICBnZXRYWSgnc2NyZWVuJywgcG9pbnRlciwgcGFnZSk7XG5cbiAgICAgICAgcGFnZS54ICs9IHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICBwYWdlLnkgKz0gd2luZG93LnNjcm9sbFk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnZXRYWSgncGFnZScsIHBvaW50ZXIsIHBhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiBwYWdlO1xufVxuXG5mdW5jdGlvbiBnZXRDbGllbnRYWSAocG9pbnRlciwgY2xpZW50LCBpbnRlcmFjdGlvbikge1xuICAgIGNsaWVudCA9IGNsaWVudCB8fCB7fTtcblxuICAgIGlmIChwb2ludGVyIGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICBpZiAoL2luZXJ0aWFzdGFydC8udGVzdChwb2ludGVyLnR5cGUpKSB7XG4gICAgICAgICAgICBleHRlbmQoY2xpZW50LCBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnVwQ29vcmRzLmNsaWVudCk7XG5cbiAgICAgICAgICAgIGNsaWVudC54ICs9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuc3g7XG4gICAgICAgICAgICBjbGllbnQueSArPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLnN5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2xpZW50LnggPSBwb2ludGVyLmNsaWVudFg7XG4gICAgICAgICAgICBjbGllbnQueSA9IHBvaW50ZXIuY2xpZW50WTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gT3BlcmEgTW9iaWxlIGhhbmRsZXMgdGhlIHZpZXdwb3J0IGFuZCBzY3JvbGxpbmcgb2RkbHlcbiAgICAgICAgZ2V0WFkoaXNPcGVyYU1vYmlsZT8gJ3NjcmVlbic6ICdjbGllbnQnLCBwb2ludGVyLCBjbGllbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBjbGllbnQ7XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbFhZICh3aW4pIHtcbiAgICB3aW4gPSB3aW4gfHwgd2luZG93O1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHdpbi5zY3JvbGxYIHx8IHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgICAgeTogd2luLnNjcm9sbFkgfHwgd2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRQb2ludGVySWQgKHBvaW50ZXIpIHtcbiAgICByZXR1cm4gaXNOdW1iZXIocG9pbnRlci5wb2ludGVySWQpPyBwb2ludGVyLnBvaW50ZXJJZCA6IHBvaW50ZXIuaWRlbnRpZmllcjtcbn1cblxuZnVuY3Rpb24gZ2V0QWN0dWFsRWxlbWVudCAoZWxlbWVudCkge1xuICAgIHJldHVybiAoZWxlbWVudCBpbnN0YW5jZW9mIFNWR0VsZW1lbnRJbnN0YW5jZVxuICAgICAgICA/IGVsZW1lbnQuY29ycmVzcG9uZGluZ1VzZUVsZW1lbnRcbiAgICAgICAgOiBlbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93IChub2RlKSB7XG4gICAgaWYgKGlzV2luZG93KG5vZGUpKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHZhciByb290Tm9kZSA9IChub2RlLm93bmVyRG9jdW1lbnQgfHwgbm9kZSk7XG5cbiAgICByZXR1cm4gcm9vdE5vZGUuZGVmYXVsdFZpZXcgfHwgcm9vdE5vZGUucGFyZW50V2luZG93IHx8IHdpbmRvdztcbn1cblxuZnVuY3Rpb24gZ2V0RWxlbWVudFJlY3QgKGVsZW1lbnQpIHtcbiAgICB2YXIgc2Nyb2xsID0gaXNJT1M3b3JMb3dlclxuICAgICAgICAgICAgPyB7IHg6IDAsIHk6IDAgfVxuICAgICAgICAgICAgOiBnZXRTY3JvbGxYWShnZXRXaW5kb3coZWxlbWVudCkpLFxuICAgICAgICBjbGllbnRSZWN0ID0gKGVsZW1lbnQgaW5zdGFuY2VvZiBTVkdFbGVtZW50KT9cbiAgICAgICAgICAgIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk6XG4gICAgICAgICAgICBlbGVtZW50LmdldENsaWVudFJlY3RzKClbMF07XG5cbiAgICByZXR1cm4gY2xpZW50UmVjdCAmJiB7XG4gICAgICAgICAgICBsZWZ0ICA6IGNsaWVudFJlY3QubGVmdCAgICsgc2Nyb2xsLngsXG4gICAgICAgICAgICByaWdodCA6IGNsaWVudFJlY3QucmlnaHQgICsgc2Nyb2xsLngsXG4gICAgICAgICAgICB0b3AgICA6IGNsaWVudFJlY3QudG9wICAgICsgc2Nyb2xsLnksXG4gICAgICAgICAgICBib3R0b206IGNsaWVudFJlY3QuYm90dG9tICsgc2Nyb2xsLnksXG4gICAgICAgICAgICB3aWR0aCA6IGNsaWVudFJlY3Qud2lkdGggfHwgY2xpZW50UmVjdC5yaWdodCAtIGNsaWVudFJlY3QubGVmdCxcbiAgICAgICAgICAgIGhlaWdodDogY2xpZW50UmVjdC5oZWlnaCB8fCBjbGllbnRSZWN0LmJvdHRvbSAtIGNsaWVudFJlY3QudG9wXG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldFRvdWNoUGFpciAoZXZlbnQpIHtcbiAgICB2YXIgdG91Y2hlcyA9IFtdO1xuXG4gICAgLy8gYXJyYXkgb2YgdG91Y2hlcyBpcyBzdXBwbGllZFxuICAgIGlmIChpc0FycmF5KGV2ZW50KSkge1xuICAgICAgICB0b3VjaGVzWzBdID0gZXZlbnRbMF07XG4gICAgICAgIHRvdWNoZXNbMV0gPSBldmVudFsxXTtcbiAgICB9XG4gICAgLy8gYW4gZXZlbnRcbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICd0b3VjaGVuZCcpIHtcbiAgICAgICAgICAgIGlmIChldmVudC50b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRvdWNoZXNbMF0gPSBldmVudC50b3VjaGVzWzBdO1xuICAgICAgICAgICAgICAgIHRvdWNoZXNbMV0gPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdG91Y2hlc1swXSA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgICAgICAgICAgICAgIHRvdWNoZXNbMV0gPSBldmVudC5jaGFuZ2VkVG91Y2hlc1sxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRvdWNoZXNbMF0gPSBldmVudC50b3VjaGVzWzBdO1xuICAgICAgICAgICAgdG91Y2hlc1sxXSA9IGV2ZW50LnRvdWNoZXNbMV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdG91Y2hlcztcbn1cblxuZnVuY3Rpb24gdG91Y2hBdmVyYWdlIChldmVudCkge1xuICAgIHZhciB0b3VjaGVzID0gZ2V0VG91Y2hQYWlyKGV2ZW50KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHBhZ2VYOiAodG91Y2hlc1swXS5wYWdlWCArIHRvdWNoZXNbMV0ucGFnZVgpIC8gMixcbiAgICAgICAgcGFnZVk6ICh0b3VjaGVzWzBdLnBhZ2VZICsgdG91Y2hlc1sxXS5wYWdlWSkgLyAyLFxuICAgICAgICBjbGllbnRYOiAodG91Y2hlc1swXS5jbGllbnRYICsgdG91Y2hlc1sxXS5jbGllbnRYKSAvIDIsXG4gICAgICAgIGNsaWVudFk6ICh0b3VjaGVzWzBdLmNsaWVudFkgKyB0b3VjaGVzWzFdLmNsaWVudFkpIC8gMlxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRvdWNoQkJveCAoZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50Lmxlbmd0aCAmJiAhKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHRvdWNoZXMgPSBnZXRUb3VjaFBhaXIoZXZlbnQpLFxuICAgICAgICBtaW5YID0gTWF0aC5taW4odG91Y2hlc1swXS5wYWdlWCwgdG91Y2hlc1sxXS5wYWdlWCksXG4gICAgICAgIG1pblkgPSBNYXRoLm1pbih0b3VjaGVzWzBdLnBhZ2VZLCB0b3VjaGVzWzFdLnBhZ2VZKSxcbiAgICAgICAgbWF4WCA9IE1hdGgubWF4KHRvdWNoZXNbMF0ucGFnZVgsIHRvdWNoZXNbMV0ucGFnZVgpLFxuICAgICAgICBtYXhZID0gTWF0aC5tYXgodG91Y2hlc1swXS5wYWdlWSwgdG91Y2hlc1sxXS5wYWdlWSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBtaW5YLFxuICAgICAgICB5OiBtaW5ZLFxuICAgICAgICBsZWZ0OiBtaW5YLFxuICAgICAgICB0b3A6IG1pblksXG4gICAgICAgIHdpZHRoOiBtYXhYIC0gbWluWCxcbiAgICAgICAgaGVpZ2h0OiBtYXhZIC0gbWluWVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRvdWNoRGlzdGFuY2UgKGV2ZW50LCBkZWx0YVNvdXJjZSkge1xuICAgIGRlbHRhU291cmNlID0gZGVsdGFTb3VyY2UgfHwgZGVmYXVsdE9wdGlvbnMuZGVsdGFTb3VyY2U7XG5cbiAgICB2YXIgc291cmNlWCA9IGRlbHRhU291cmNlICsgJ1gnLFxuICAgICAgICBzb3VyY2VZID0gZGVsdGFTb3VyY2UgKyAnWScsXG4gICAgICAgIHRvdWNoZXMgPSBnZXRUb3VjaFBhaXIoZXZlbnQpO1xuXG5cbiAgICB2YXIgZHggPSB0b3VjaGVzWzBdW3NvdXJjZVhdIC0gdG91Y2hlc1sxXVtzb3VyY2VYXSxcbiAgICAgICAgZHkgPSB0b3VjaGVzWzBdW3NvdXJjZVldIC0gdG91Y2hlc1sxXVtzb3VyY2VZXTtcblxuICAgIHJldHVybiBoeXBvdChkeCwgZHkpO1xufVxuXG5mdW5jdGlvbiB0b3VjaEFuZ2xlIChldmVudCwgcHJldkFuZ2xlLCBkZWx0YVNvdXJjZSkge1xuICAgIGRlbHRhU291cmNlID0gZGVsdGFTb3VyY2UgfHwgZGVmYXVsdE9wdGlvbnMuZGVsdGFTb3VyY2U7XG5cbiAgICB2YXIgc291cmNlWCA9IGRlbHRhU291cmNlICsgJ1gnLFxuICAgICAgICBzb3VyY2VZID0gZGVsdGFTb3VyY2UgKyAnWScsXG4gICAgICAgIHRvdWNoZXMgPSBnZXRUb3VjaFBhaXIoZXZlbnQpLFxuICAgICAgICBkeCA9IHRvdWNoZXNbMF1bc291cmNlWF0gLSB0b3VjaGVzWzFdW3NvdXJjZVhdLFxuICAgICAgICBkeSA9IHRvdWNoZXNbMF1bc291cmNlWV0gLSB0b3VjaGVzWzFdW3NvdXJjZVldLFxuICAgICAgICBhbmdsZSA9IDE4MCAqIE1hdGguYXRhbihkeSAvIGR4KSAvIE1hdGguUEk7XG5cbiAgICBpZiAoaXNOdW1iZXIocHJldkFuZ2xlKSkge1xuICAgICAgICB2YXIgZHIgPSBhbmdsZSAtIHByZXZBbmdsZSxcbiAgICAgICAgICAgIGRyQ2xhbXBlZCA9IGRyICUgMzYwO1xuXG4gICAgICAgIGlmIChkckNsYW1wZWQgPiAzMTUpIHtcbiAgICAgICAgICAgIGFuZ2xlIC09IDM2MCArIChhbmdsZSAvIDM2MCl8MCAqIDM2MDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkckNsYW1wZWQgPiAxMzUpIHtcbiAgICAgICAgICAgIGFuZ2xlIC09IDE4MCArIChhbmdsZSAvIDM2MCl8MCAqIDM2MDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkckNsYW1wZWQgPCAtMzE1KSB7XG4gICAgICAgICAgICBhbmdsZSArPSAzNjAgKyAoYW5nbGUgLyAzNjApfDAgKiAzNjA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHJDbGFtcGVkIDwgLTEzNSkge1xuICAgICAgICAgICAgYW5nbGUgKz0gMTgwICsgKGFuZ2xlIC8gMzYwKXwwICogMzYwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuICBhbmdsZTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZ2luWFkgKGludGVyYWN0YWJsZSwgZWxlbWVudCkge1xuICAgIHZhciBvcmlnaW4gPSBpbnRlcmFjdGFibGVcbiAgICAgICAgPyBpbnRlcmFjdGFibGUub3B0aW9ucy5vcmlnaW5cbiAgICAgICAgOiBkZWZhdWx0T3B0aW9ucy5vcmlnaW47XG5cbiAgICBpZiAob3JpZ2luID09PSAncGFyZW50Jykge1xuICAgICAgICBvcmlnaW4gPSBwYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgIH1cbiAgICBlbHNlIGlmIChvcmlnaW4gPT09ICdzZWxmJykge1xuICAgICAgICBvcmlnaW4gPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHJ5U2VsZWN0b3Iob3JpZ2luKSkge1xuICAgICAgICBvcmlnaW4gPSBjbG9zZXN0KGVsZW1lbnQsIG9yaWdpbikgfHwgeyB4OiAwLCB5OiAwIH07XG4gICAgfVxuXG4gICAgaWYgKGlzRnVuY3Rpb24ob3JpZ2luKSkge1xuICAgICAgICBvcmlnaW4gPSBvcmlnaW4oaW50ZXJhY3RhYmxlICYmIGVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmIChpc0VsZW1lbnQob3JpZ2luKSkgIHtcbiAgICAgICAgb3JpZ2luID0gZ2V0RWxlbWVudFJlY3Qob3JpZ2luKTtcbiAgICB9XG5cbiAgICBvcmlnaW4ueCA9ICgneCcgaW4gb3JpZ2luKT8gb3JpZ2luLnggOiBvcmlnaW4ubGVmdDtcbiAgICBvcmlnaW4ueSA9ICgneScgaW4gb3JpZ2luKT8gb3JpZ2luLnkgOiBvcmlnaW4udG9wO1xuXG4gICAgcmV0dXJuIG9yaWdpbjtcbn1cblxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTYzNDUyOC8yMjgwODg4XG5mdW5jdGlvbiBfZ2V0UUJlemllclZhbHVlKHQsIHAxLCBwMiwgcDMpIHtcbiAgICB2YXIgaVQgPSAxIC0gdDtcbiAgICByZXR1cm4gaVQgKiBpVCAqIHAxICsgMiAqIGlUICogdCAqIHAyICsgdCAqIHQgKiBwMztcbn1cblxuZnVuY3Rpb24gZ2V0UXVhZHJhdGljQ3VydmVQb2ludChzdGFydFgsIHN0YXJ0WSwgY3BYLCBjcFksIGVuZFgsIGVuZFksIHBvc2l0aW9uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogIF9nZXRRQmV6aWVyVmFsdWUocG9zaXRpb24sIHN0YXJ0WCwgY3BYLCBlbmRYKSxcbiAgICAgICAgeTogIF9nZXRRQmV6aWVyVmFsdWUocG9zaXRpb24sIHN0YXJ0WSwgY3BZLCBlbmRZKVxuICAgIH07XG59XG5cbi8vIGh0dHA6Ly9naXptYS5jb20vZWFzaW5nL1xuZnVuY3Rpb24gZWFzZU91dFF1YWQgKHQsIGIsIGMsIGQpIHtcbiAgICB0IC89IGQ7XG4gICAgcmV0dXJuIC1jICogdCoodC0yKSArIGI7XG59XG5cbmZ1bmN0aW9uIG5vZGVDb250YWlucyAocGFyZW50LCBjaGlsZCkge1xuICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgICBpZiAoY2hpbGQgPT09IHBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjaGlsZCA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjbG9zZXN0IChjaGlsZCwgc2VsZWN0b3IpIHtcbiAgICB2YXIgcGFyZW50ID0gcGFyZW50RWxlbWVudChjaGlsZCk7XG5cbiAgICB3aGlsZSAoaXNFbGVtZW50KHBhcmVudCkpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNTZWxlY3RvcihwYXJlbnQsIHNlbGVjdG9yKSkgeyByZXR1cm4gcGFyZW50OyB9XG5cbiAgICAgICAgcGFyZW50ID0gcGFyZW50RWxlbWVudChwYXJlbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBwYXJlbnRFbGVtZW50IChub2RlKSB7XG4gICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICAgIGlmIChpc0RvY0ZyYWcocGFyZW50KSkge1xuICAgICAgICAvLyBza2lwIHBhc3QgI3NoYWRvLXJvb3QgZnJhZ21lbnRzXG4gICAgICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50Lmhvc3QpICYmIGlzRG9jRnJhZyhwYXJlbnQpKSB7fVxuXG4gICAgICAgIHJldHVybiBwYXJlbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudDtcbn1cblxuZnVuY3Rpb24gaW5Db250ZXh0IChpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlLl9jb250ZXh0ID09PSBlbGVtZW50Lm93bmVyRG9jdW1lbnRcbiAgICAgICAgfHwgbm9kZUNvbnRhaW5zKGludGVyYWN0YWJsZS5fY29udGV4dCwgZWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIHRlc3RJZ25vcmUgKGludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlRWxlbWVudCwgZWxlbWVudCkge1xuICAgIHZhciBpZ25vcmVGcm9tID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuaWdub3JlRnJvbTtcblxuICAgIGlmICghaWdub3JlRnJvbSB8fCAhaXNFbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgaWYgKGlzU3RyaW5nKGlnbm9yZUZyb20pKSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVzVXBUbyhlbGVtZW50LCBpZ25vcmVGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNFbGVtZW50KGlnbm9yZUZyb20pKSB7XG4gICAgICAgIHJldHVybiBub2RlQ29udGFpbnMoaWdub3JlRnJvbSwgZWxlbWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiB0ZXN0QWxsb3cgKGludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlRWxlbWVudCwgZWxlbWVudCkge1xuICAgIHZhciBhbGxvd0Zyb20gPSBpbnRlcmFjdGFibGUub3B0aW9ucy5hbGxvd0Zyb207XG5cbiAgICBpZiAoIWFsbG93RnJvbSkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gICAgaWYgKCFpc0VsZW1lbnQoZWxlbWVudCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICBpZiAoaXNTdHJpbmcoYWxsb3dGcm9tKSkge1xuICAgICAgICByZXR1cm4gbWF0Y2hlc1VwVG8oZWxlbWVudCwgYWxsb3dGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNFbGVtZW50KGFsbG93RnJvbSkpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVDb250YWlucyhhbGxvd0Zyb20sIGVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBeGlzIChheGlzLCBpbnRlcmFjdGFibGUpIHtcbiAgICBpZiAoIWludGVyYWN0YWJsZSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIHZhciB0aGlzQXhpcyA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyYWcuYXhpcztcblxuICAgIHJldHVybiAoYXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gYXhpcyk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrU25hcCAoaW50ZXJhY3RhYmxlLCBhY3Rpb24pIHtcbiAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zO1xuXG4gICAgaWYgKC9ecmVzaXplLy50ZXN0KGFjdGlvbikpIHtcbiAgICAgICAgYWN0aW9uID0gJ3Jlc2l6ZSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnNbYWN0aW9uXS5zbmFwICYmIG9wdGlvbnNbYWN0aW9uXS5zbmFwLmVuYWJsZWQ7XG59XG5cbmZ1bmN0aW9uIGNoZWNrUmVzdHJpY3QgKGludGVyYWN0YWJsZSwgYWN0aW9uKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgIGFjdGlvbiA9ICdyZXNpemUnO1xuICAgIH1cblxuICAgIHJldHVybiAgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0ICYmIG9wdGlvbnNbYWN0aW9uXS5yZXN0cmljdC5lbmFibGVkO1xufVxuXG5mdW5jdGlvbiBjaGVja0F1dG9TY3JvbGwgKGludGVyYWN0YWJsZSwgYWN0aW9uKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgIGFjdGlvbiA9ICdyZXNpemUnO1xuICAgIH1cblxuICAgIHJldHVybiAgb3B0aW9uc1thY3Rpb25dLmF1dG9TY3JvbGwgJiYgb3B0aW9uc1thY3Rpb25dLmF1dG9TY3JvbGwuZW5hYmxlZDtcbn1cblxuZnVuY3Rpb24gd2l0aGluSW50ZXJhY3Rpb25MaW1pdCAoaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBhY3Rpb24pIHtcbiAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zLFxuICAgICAgICBtYXhBY3Rpb25zID0gb3B0aW9uc1thY3Rpb24ubmFtZV0ubWF4LFxuICAgICAgICBtYXhQZXJFbGVtZW50ID0gb3B0aW9uc1thY3Rpb24ubmFtZV0ubWF4UGVyRWxlbWVudCxcbiAgICAgICAgYWN0aXZlSW50ZXJhY3Rpb25zID0gMCxcbiAgICAgICAgdGFyZ2V0Q291bnQgPSAwLFxuICAgICAgICB0YXJnZXRFbGVtZW50Q291bnQgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGludGVyYWN0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBpbnRlcmFjdGlvbnNbaV0sXG4gICAgICAgICAgICBvdGhlckFjdGlvbiA9IGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUsXG4gICAgICAgICAgICBhY3RpdmUgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpO1xuXG4gICAgICAgIGlmICghYWN0aXZlKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgYWN0aXZlSW50ZXJhY3Rpb25zKys7XG5cbiAgICAgICAgaWYgKGFjdGl2ZUludGVyYWN0aW9ucyA+PSBtYXhJbnRlcmFjdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi50YXJnZXQgIT09IGludGVyYWN0YWJsZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIHRhcmdldENvdW50ICs9IChvdGhlckFjdGlvbiA9PT0gYWN0aW9uLm5hbWUpfDA7XG5cbiAgICAgICAgaWYgKHRhcmdldENvdW50ID49IG1heEFjdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi5lbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICB0YXJnZXRFbGVtZW50Q291bnQrKztcblxuICAgICAgICAgICAgaWYgKG90aGVyQWN0aW9uICE9PSBhY3Rpb24ubmFtZSB8fCB0YXJnZXRFbGVtZW50Q291bnQgPj0gbWF4UGVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtYXhJbnRlcmFjdGlvbnMgPiAwO1xufVxuXG4vLyBUZXN0IGZvciB0aGUgZWxlbWVudCB0aGF0J3MgXCJhYm92ZVwiIGFsbCBvdGhlciBxdWFsaWZpZXJzXG5mdW5jdGlvbiBpbmRleE9mRGVlcGVzdEVsZW1lbnQgKGVsZW1lbnRzKSB7XG4gICAgdmFyIGRyb3B6b25lLFxuICAgICAgICBkZWVwZXN0Wm9uZSA9IGVsZW1lbnRzWzBdLFxuICAgICAgICBpbmRleCA9IGRlZXBlc3Rab25lPyAwOiAtMSxcbiAgICAgICAgcGFyZW50LFxuICAgICAgICBkZWVwZXN0Wm9uZVBhcmVudHMgPSBbXSxcbiAgICAgICAgZHJvcHpvbmVQYXJlbnRzID0gW10sXG4gICAgICAgIGNoaWxkLFxuICAgICAgICBpLFxuICAgICAgICBuO1xuXG4gICAgZm9yIChpID0gMTsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGRyb3B6b25lID0gZWxlbWVudHNbaV07XG5cbiAgICAgICAgLy8gYW4gZWxlbWVudCBtaWdodCBiZWxvbmcgdG8gbXVsdGlwbGUgc2VsZWN0b3IgZHJvcHpvbmVzXG4gICAgICAgIGlmICghZHJvcHpvbmUgfHwgZHJvcHpvbmUgPT09IGRlZXBlc3Rab25lKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZGVlcGVzdFpvbmUpIHtcbiAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZHJvcHpvbmU7XG4gICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBkZWVwZXN0IG9yIGN1cnJlbnQgYXJlIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCBvciBkb2N1bWVudC5yb290RWxlbWVudFxuICAgICAgICAvLyAtIGlmIHRoZSBjdXJyZW50IGRyb3B6b25lIGlzLCBkbyBub3RoaW5nIGFuZCBjb250aW51ZVxuICAgICAgICBpZiAoZHJvcHpvbmUucGFyZW50Tm9kZSA9PT0gZHJvcHpvbmUub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gLSBpZiBkZWVwZXN0IGlzLCB1cGRhdGUgd2l0aCB0aGUgY3VycmVudCBkcm9wem9uZSBhbmQgY29udGludWUgdG8gbmV4dFxuICAgICAgICBlbHNlIGlmIChkZWVwZXN0Wm9uZS5wYXJlbnROb2RlID09PSBkcm9wem9uZS5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICBkZWVwZXN0Wm9uZSA9IGRyb3B6b25lO1xuICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRlZXBlc3Rab25lUGFyZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHBhcmVudCA9IGRlZXBlc3Rab25lO1xuICAgICAgICAgICAgd2hpbGUgKHBhcmVudC5wYXJlbnROb2RlICYmIHBhcmVudC5wYXJlbnROb2RlICE9PSBwYXJlbnQub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50cy51bnNoaWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGlzIGVsZW1lbnQgaXMgYW4gc3ZnIGVsZW1lbnQgYW5kIHRoZSBjdXJyZW50IGRlZXBlc3QgaXNcbiAgICAgICAgLy8gYW4gSFRNTEVsZW1lbnRcbiAgICAgICAgaWYgKGRlZXBlc3Rab25lIGluc3RhbmNlb2YgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICYmIGRyb3B6b25lIGluc3RhbmNlb2YgU1ZHRWxlbWVudFxuICAgICAgICAgICAgJiYgIShkcm9wem9uZSBpbnN0YW5jZW9mIFNWR1NWR0VsZW1lbnQpKSB7XG5cbiAgICAgICAgICAgIGlmIChkcm9wem9uZSA9PT0gZGVlcGVzdFpvbmUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJlbnQgPSBkcm9wem9uZS5vd25lclNWR0VsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQgPSBkcm9wem9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRyb3B6b25lUGFyZW50cyA9IFtdO1xuXG4gICAgICAgIHdoaWxlIChwYXJlbnQucGFyZW50Tm9kZSAhPT0gcGFyZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIGRyb3B6b25lUGFyZW50cy51bnNoaWZ0KHBhcmVudCk7XG4gICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG4gPSAwO1xuXG4gICAgICAgIC8vIGdldCAocG9zaXRpb24gb2YgbGFzdCBjb21tb24gYW5jZXN0b3IpICsgMVxuICAgICAgICB3aGlsZSAoZHJvcHpvbmVQYXJlbnRzW25dICYmIGRyb3B6b25lUGFyZW50c1tuXSA9PT0gZGVlcGVzdFpvbmVQYXJlbnRzW25dKSB7XG4gICAgICAgICAgICBuKys7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFyZW50cyA9IFtcbiAgICAgICAgICAgIGRyb3B6b25lUGFyZW50c1tuIC0gMV0sXG4gICAgICAgICAgICBkcm9wem9uZVBhcmVudHNbbl0sXG4gICAgICAgICAgICBkZWVwZXN0Wm9uZVBhcmVudHNbbl1cbiAgICAgICAgXTtcblxuICAgICAgICBjaGlsZCA9IHBhcmVudHNbMF0ubGFzdENoaWxkO1xuXG4gICAgICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgICAgICAgaWYgKGNoaWxkID09PSBwYXJlbnRzWzFdKSB7XG4gICAgICAgICAgICAgICAgZGVlcGVzdFpvbmUgPSBkcm9wem9uZTtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgZGVlcGVzdFpvbmVQYXJlbnRzID0gW107XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkID09PSBwYXJlbnRzWzJdKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGQucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG5mdW5jdGlvbiBJbnRlcmFjdGlvbiAoKSB7XG4gICAgdGhpcy50YXJnZXQgICAgICAgICAgPSBudWxsOyAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgICB0aGlzLmVsZW1lbnQgICAgICAgICA9IG51bGw7IC8vIHRoZSB0YXJnZXQgZWxlbWVudCBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gICAgdGhpcy5kcm9wVGFyZ2V0ICAgICAgPSBudWxsOyAvLyB0aGUgZHJvcHpvbmUgYSBkcmFnIHRhcmdldCBtaWdodCBiZSBkcm9wcGVkIGludG9cbiAgICB0aGlzLmRyb3BFbGVtZW50ICAgICA9IG51bGw7IC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG4gICAgdGhpcy5wcmV2RHJvcFRhcmdldCAgPSBudWxsOyAvLyB0aGUgZHJvcHpvbmUgdGhhdCB3YXMgcmVjZW50bHkgZHJhZ2dlZCBhd2F5IGZyb21cbiAgICB0aGlzLnByZXZEcm9wRWxlbWVudCA9IG51bGw7IC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG5cbiAgICB0aGlzLnByZXBhcmVkICAgICAgICA9IHsgICAgIC8vIGFjdGlvbiB0aGF0J3MgcmVhZHkgdG8gYmUgZmlyZWQgb24gbmV4dCBtb3ZlIGV2ZW50XG4gICAgICAgIG5hbWUgOiBudWxsLFxuICAgICAgICBheGlzIDogbnVsbCxcbiAgICAgICAgZWRnZXM6IG51bGxcbiAgICB9O1xuXG4gICAgdGhpcy5tYXRjaGVzICAgICAgICAgPSBbXTsgICAvLyBhbGwgc2VsZWN0b3JzIHRoYXQgYXJlIG1hdGNoZWQgYnkgdGFyZ2V0IGVsZW1lbnRcbiAgICB0aGlzLm1hdGNoRWxlbWVudHMgICA9IFtdOyAgIC8vIGNvcnJlc3BvbmRpbmcgZWxlbWVudHNcblxuICAgIHRoaXMuaW5lcnRpYVN0YXR1cyA9IHtcbiAgICAgICAgYWN0aXZlICAgICAgIDogZmFsc2UsXG4gICAgICAgIHNtb290aEVuZCAgICA6IGZhbHNlLFxuXG4gICAgICAgIHN0YXJ0RXZlbnQ6IG51bGwsXG4gICAgICAgIHVwQ29vcmRzOiB7fSxcblxuICAgICAgICB4ZTogMCwgeWU6IDAsXG4gICAgICAgIHN4OiAwLCBzeTogMCxcblxuICAgICAgICB0MDogMCxcbiAgICAgICAgdngwOiAwLCB2eXM6IDAsXG4gICAgICAgIGR1cmF0aW9uOiAwLFxuXG4gICAgICAgIHJlc3VtZUR4OiAwLFxuICAgICAgICByZXN1bWVEeTogMCxcblxuICAgICAgICBsYW1iZGFfdjA6IDAsXG4gICAgICAgIG9uZV92ZV92MDogMCxcbiAgICAgICAgaSAgOiBudWxsXG4gICAgfTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSkge1xuICAgICAgICB0aGlzLmJvdW5kSW5lcnRpYUZyYW1lID0gdGhpcy5pbmVydGlhRnJhbWUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5ib3VuZFNtb290aEVuZEZyYW1lID0gdGhpcy5zbW9vdGhFbmRGcmFtZS5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuYm91bmRJbmVydGlhRnJhbWUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGF0LmluZXJ0aWFGcmFtZSgpOyB9O1xuICAgICAgICB0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGF0LnNtb290aEVuZEZyYW1lKCk7IH07XG4gICAgfVxuXG4gICAgdGhpcy5hY3RpdmVEcm9wcyA9IHtcbiAgICAgICAgZHJvcHpvbmVzOiBbXSwgICAgICAvLyB0aGUgZHJvcHpvbmVzIHRoYXQgYXJlIG1lbnRpb25lZCBiZWxvd1xuICAgICAgICBlbGVtZW50cyA6IFtdLCAgICAgIC8vIGVsZW1lbnRzIG9mIGRyb3B6b25lcyB0aGF0IGFjY2VwdCB0aGUgdGFyZ2V0IGRyYWdnYWJsZVxuICAgICAgICByZWN0cyAgICA6IFtdICAgICAgIC8vIHRoZSByZWN0cyBvZiB0aGUgZWxlbWVudHMgbWVudGlvbmVkIGFib3ZlXG4gICAgfTtcblxuICAgIC8vIGtlZXAgdHJhY2sgb2YgYWRkZWQgcG9pbnRlcnNcbiAgICB0aGlzLnBvaW50ZXJzICAgID0gW107XG4gICAgdGhpcy5wb2ludGVySWRzICA9IFtdO1xuICAgIHRoaXMuZG93blRhcmdldHMgPSBbXTtcbiAgICB0aGlzLmRvd25UaW1lcyAgID0gW107XG4gICAgdGhpcy5ob2xkVGltZXJzICA9IFtdO1xuXG4gICAgLy8gUHJldmlvdXMgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHRoaXMucHJldkNvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcbiAgICAvLyBjdXJyZW50IG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICB0aGlzLmN1ckNvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcblxuICAgIC8vIFN0YXJ0aW5nIEludGVyYWN0RXZlbnQgcG9pbnRlciBjb29yZGluYXRlc1xuICAgIHRoaXMuc3RhcnRDb29yZHMgPSB7XG4gICAgICAgIHBhZ2UgICAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIGNsaWVudCAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIHRpbWVTdGFtcDogMFxuICAgIH07XG5cbiAgICAvLyBDaGFuZ2UgaW4gY29vcmRpbmF0ZXMgYW5kIHRpbWUgb2YgdGhlIHBvaW50ZXJcbiAgICB0aGlzLnBvaW50ZXJEZWx0YSA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAsIHZ4OiAwLCB2eTogMCwgc3BlZWQ6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAsIHZ4OiAwLCB2eTogMCwgc3BlZWQ6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcblxuICAgIHRoaXMuZG93bkV2ZW50ICAgPSBudWxsOyAgICAvLyBwb2ludGVyZG93bi9tb3VzZWRvd24vdG91Y2hzdGFydCBldmVudFxuICAgIHRoaXMuZG93blBvaW50ZXIgPSB7fTtcblxuICAgIHRoaXMuX2V2ZW50VGFyZ2V0ICAgID0gbnVsbDtcbiAgICB0aGlzLl9jdXJFdmVudFRhcmdldCA9IG51bGw7XG5cbiAgICB0aGlzLnByZXZFdmVudCA9IG51bGw7ICAgICAgLy8gcHJldmlvdXMgYWN0aW9uIGV2ZW50XG4gICAgdGhpcy50YXBUaW1lICAgPSAwOyAgICAgICAgIC8vIHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRhcCBldmVudFxuICAgIHRoaXMucHJldlRhcCAgID0gbnVsbDtcblxuICAgIHRoaXMuc3RhcnRPZmZzZXQgICAgPSB7IGxlZnQ6IDAsIHJpZ2h0OiAwLCB0b3A6IDAsIGJvdHRvbTogMCB9O1xuICAgIHRoaXMucmVzdHJpY3RPZmZzZXQgPSB7IGxlZnQ6IDAsIHJpZ2h0OiAwLCB0b3A6IDAsIGJvdHRvbTogMCB9O1xuICAgIHRoaXMuc25hcE9mZnNldHMgICAgPSBbXTtcblxuICAgIHRoaXMuZ2VzdHVyZSA9IHtcbiAgICAgICAgc3RhcnQ6IHsgeDogMCwgeTogMCB9LFxuXG4gICAgICAgIHN0YXJ0RGlzdGFuY2U6IDAsICAgLy8gZGlzdGFuY2UgYmV0d2VlbiB0d28gdG91Y2hlcyBvZiB0b3VjaFN0YXJ0XG4gICAgICAgIHByZXZEaXN0YW5jZSA6IDAsXG4gICAgICAgIGRpc3RhbmNlICAgICA6IDAsXG5cbiAgICAgICAgc2NhbGU6IDEsICAgICAgICAgICAvLyBnZXN0dXJlLmRpc3RhbmNlIC8gZ2VzdHVyZS5zdGFydERpc3RhbmNlXG5cbiAgICAgICAgc3RhcnRBbmdsZTogMCwgICAgICAvLyBhbmdsZSBvZiBsaW5lIGpvaW5pbmcgdHdvIHRvdWNoZXNcbiAgICAgICAgcHJldkFuZ2xlIDogMCAgICAgICAvLyBhbmdsZSBvZiB0aGUgcHJldmlvdXMgZ2VzdHVyZSBldmVudFxuICAgIH07XG5cbiAgICB0aGlzLnNuYXBTdGF0dXMgPSB7XG4gICAgICAgIHggICAgICAgOiAwLCB5ICAgICAgIDogMCxcbiAgICAgICAgZHggICAgICA6IDAsIGR5ICAgICAgOiAwLFxuICAgICAgICByZWFsWCAgIDogMCwgcmVhbFkgICA6IDAsXG4gICAgICAgIHNuYXBwZWRYOiAwLCBzbmFwcGVkWTogMCxcbiAgICAgICAgdGFyZ2V0cyA6IFtdLFxuICAgICAgICBsb2NrZWQgIDogZmFsc2UsXG4gICAgICAgIGNoYW5nZWQgOiBmYWxzZVxuICAgIH07XG5cbiAgICB0aGlzLnJlc3RyaWN0U3RhdHVzID0ge1xuICAgICAgICBkeCAgICAgICAgIDogMCwgZHkgICAgICAgICA6IDAsXG4gICAgICAgIHJlc3RyaWN0ZWRYOiAwLCByZXN0cmljdGVkWTogMCxcbiAgICAgICAgc25hcCAgICAgICA6IG51bGwsXG4gICAgICAgIHJlc3RyaWN0ZWQgOiBmYWxzZSxcbiAgICAgICAgY2hhbmdlZCAgICA6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMucmVzdHJpY3RTdGF0dXMuc25hcCA9IHRoaXMuc25hcFN0YXR1cztcblxuICAgIHRoaXMucG9pbnRlcklzRG93biAgID0gZmFsc2U7XG4gICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmdlc3R1cmluZyAgICAgICA9IGZhbHNlO1xuICAgIHRoaXMuZHJhZ2dpbmcgICAgICAgID0gZmFsc2U7XG4gICAgdGhpcy5yZXNpemluZyAgICAgICAgPSBmYWxzZTtcbiAgICB0aGlzLnJlc2l6ZUF4ZXMgICAgICA9ICd4eSc7XG5cbiAgICB0aGlzLm1vdXNlID0gZmFsc2U7XG5cbiAgICBpbnRlcmFjdGlvbnMucHVzaCh0aGlzKTtcbn1cblxuSW50ZXJhY3Rpb24ucHJvdG90eXBlID0ge1xuICAgIGdldFBhZ2VYWSAgOiBmdW5jdGlvbiAocG9pbnRlciwgeHkpIHsgcmV0dXJuICAgZ2V0UGFnZVhZKHBvaW50ZXIsIHh5LCB0aGlzKTsgfSxcbiAgICBnZXRDbGllbnRYWTogZnVuY3Rpb24gKHBvaW50ZXIsIHh5KSB7IHJldHVybiBnZXRDbGllbnRYWShwb2ludGVyLCB4eSwgdGhpcyk7IH0sXG4gICAgc2V0RXZlbnRYWSA6IGZ1bmN0aW9uICh0YXJnZXQsIHB0cikgeyByZXR1cm4gIHNldEV2ZW50WFkodGFyZ2V0LCBwdHIsIHRoaXMpOyB9LFxuXG4gICAgcG9pbnRlck92ZXI6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICAgICAgaWYgKHRoaXMucHJlcGFyZWQubmFtZSB8fCAhdGhpcy5tb3VzZSkgeyByZXR1cm47IH1cblxuICAgICAgICB2YXIgY3VyTWF0Y2hlcyA9IFtdLFxuICAgICAgICAgICAgY3VyTWF0Y2hFbGVtZW50cyA9IFtdLFxuICAgICAgICAgICAgcHJldlRhcmdldEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5hZGRQb2ludGVyKHBvaW50ZXIpO1xuXG4gICAgICAgIGlmICh0aGlzLnRhcmdldFxuICAgICAgICAgICAgJiYgKHRlc3RJZ25vcmUodGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICB8fCAhdGVzdEFsbG93KHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQsIGV2ZW50VGFyZ2V0KSkpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoZSBldmVudFRhcmdldCBzaG91bGQgYmUgaWdub3JlZCBvciBzaG91bGRuJ3QgYmUgYWxsb3dlZFxuICAgICAgICAgICAgLy8gY2xlYXIgdGhlIHByZXZpb3VzIHRhcmdldFxuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZWxlbWVudEludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZXMuZ2V0KGV2ZW50VGFyZ2V0KSxcbiAgICAgICAgICAgIGVsZW1lbnRBY3Rpb24gPSAoZWxlbWVudEludGVyYWN0YWJsZVxuICAgICAgICAgICAgJiYgIXRlc3RJZ25vcmUoZWxlbWVudEludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgJiYgdGVzdEFsbG93KGVsZW1lbnRJbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICYmIHZhbGlkYXRlQWN0aW9uKFxuICAgICAgICAgICAgICAgIGVsZW1lbnRJbnRlcmFjdGFibGUuZ2V0QWN0aW9uKHBvaW50ZXIsIGV2ZW50LCB0aGlzLCBldmVudFRhcmdldCksXG4gICAgICAgICAgICAgICAgZWxlbWVudEludGVyYWN0YWJsZSkpO1xuXG4gICAgICAgIGlmIChlbGVtZW50QWN0aW9uICYmICF3aXRoaW5JbnRlcmFjdGlvbkxpbWl0KGVsZW1lbnRJbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBlbGVtZW50QWN0aW9uKSkge1xuICAgICAgICAgICAgZWxlbWVudEFjdGlvbiA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwdXNoQ3VyTWF0Y2hlcyAoaW50ZXJhY3RhYmxlLCBzZWxlY3Rvcikge1xuICAgICAgICAgICAgaWYgKGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgICYmIGluQ29udGV4dChpbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmICF0ZXN0SWdub3JlKGludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHRlc3RBbGxvdyhpbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBtYXRjaGVzU2VsZWN0b3IoZXZlbnRUYXJnZXQsIHNlbGVjdG9yKSkge1xuXG4gICAgICAgICAgICAgICAgY3VyTWF0Y2hlcy5wdXNoKGludGVyYWN0YWJsZSk7XG4gICAgICAgICAgICAgICAgY3VyTWF0Y2hFbGVtZW50cy5wdXNoKGV2ZW50VGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50QWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnRhcmdldCA9IGVsZW1lbnRJbnRlcmFjdGFibGU7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBldmVudFRhcmdldDtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbnRlcmFjdGFibGVzLmZvckVhY2hTZWxlY3RvcihwdXNoQ3VyTWF0Y2hlcyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRlU2VsZWN0b3IocG9pbnRlciwgZXZlbnQsIGN1ck1hdGNoZXMsIGN1ck1hdGNoRWxlbWVudHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gY3VyTWF0Y2hlcztcbiAgICAgICAgICAgICAgICB0aGlzLm1hdGNoRWxlbWVudHMgPSBjdXJNYXRjaEVsZW1lbnRzO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVySG92ZXIocG9pbnRlciwgZXZlbnQsIHRoaXMubWF0Y2hlcywgdGhpcy5tYXRjaEVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKGV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBQb2ludGVyRXZlbnQ/IHBFdmVudFR5cGVzLm1vdmUgOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnBvaW50ZXJIb3Zlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlQ29udGFpbnMocHJldlRhcmdldEVsZW1lbnQsIGV2ZW50VGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJIb3Zlcihwb2ludGVyLCBldmVudCwgdGhpcy5tYXRjaGVzLCB0aGlzLm1hdGNoRWxlbWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuZWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFBvaW50ZXJFdmVudD8gcEV2ZW50VHlwZXMubW92ZSA6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnBvaW50ZXJIb3Zlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hdGNoRWxlbWVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gQ2hlY2sgd2hhdCBhY3Rpb24gd291bGQgYmUgcGVyZm9ybWVkIG9uIHBvaW50ZXJNb3ZlIHRhcmdldCBpZiBhIG1vdXNlXG4gICAgLy8gYnV0dG9uIHdlcmUgcHJlc3NlZCBhbmQgY2hhbmdlIHRoZSBjdXJzb3IgYWNjb3JkaW5nbHlcbiAgICBwb2ludGVySG92ZXI6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBtYXRjaGVzLCBtYXRjaEVsZW1lbnRzKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgICAgICBpZiAoIXRoaXMucHJlcGFyZWQubmFtZSAmJiB0aGlzLm1vdXNlKSB7XG5cbiAgICAgICAgICAgIHZhciBhY3Rpb247XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSBwb2ludGVyIGNvb3JkcyBmb3IgZGVmYXVsdEFjdGlvbkNoZWNrZXIgdG8gdXNlXG4gICAgICAgICAgICB0aGlzLnNldEV2ZW50WFkodGhpcy5jdXJDb29yZHMsIHBvaW50ZXIpO1xuXG4gICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgIGFjdGlvbiA9IHRoaXMudmFsaWRhdGVTZWxlY3Rvcihwb2ludGVyLCBldmVudCwgbWF0Y2hlcywgbWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSB2YWxpZGF0ZUFjdGlvbih0YXJnZXQuZ2V0QWN0aW9uKHRoaXMucG9pbnRlcnNbMF0sIGV2ZW50LCB0aGlzLCB0aGlzLmVsZW1lbnQpLCB0aGlzLnRhcmdldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMuc3R5bGVDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5fZG9jLmRvY3VtZW50RWxlbWVudC5zdHlsZS5jdXJzb3IgPSBnZXRBY3Rpb25DdXJzb3IoYWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5fZG9jLmRvY3VtZW50RWxlbWVudC5zdHlsZS5jdXJzb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5wcmVwYXJlZC5uYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrQW5kUHJldmVudERlZmF1bHQoZXZlbnQsIHRhcmdldCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwb2ludGVyT3V0OiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIGlmICh0aGlzLnByZXBhcmVkLm5hbWUpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRlbXBvcmFyeSBldmVudCBsaXN0ZW5lcnMgZm9yIHNlbGVjdG9yIEludGVyYWN0YWJsZXNcbiAgICAgICAgaWYgKCFpbnRlcmFjdGFibGVzLmdldChldmVudFRhcmdldCkpIHtcbiAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUoZXZlbnRUYXJnZXQsXG4gICAgICAgICAgICAgICAgUG9pbnRlckV2ZW50PyBwRXZlbnRUeXBlcy5tb3ZlIDogJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnBvaW50ZXJIb3Zlcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy50YXJnZXQgJiYgdGhpcy50YXJnZXQub3B0aW9ucy5zdHlsZUN1cnNvciAmJiAhdGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICB0aGlzLnRhcmdldC5fZG9jLmRvY3VtZW50RWxlbWVudC5zdHlsZS5jdXJzb3IgPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZWxlY3RvckRvd246IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcbiAgICAgICAgLy8gY29weSBldmVudCB0byBiZSB1c2VkIGluIHRpbWVvdXQgZm9yIElFOFxuICAgICAgICAgICAgZXZlbnRDb3B5ID0gZXZlbnRzLnVzZUF0dGFjaEV2ZW50PyBleHRlbmQoe30sIGV2ZW50KSA6IGV2ZW50LFxuICAgICAgICAgICAgZWxlbWVudCA9IGV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5hZGRQb2ludGVyKHBvaW50ZXIpLFxuICAgICAgICAgICAgYWN0aW9uO1xuXG4gICAgICAgIHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGF0LnBvaW50ZXJIb2xkKGV2ZW50cy51c2VBdHRhY2hFdmVudD8gZXZlbnRDb3B5IDogcG9pbnRlciwgZXZlbnRDb3B5LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuICAgICAgICB9LCBkZWZhdWx0T3B0aW9ucy5faG9sZER1cmF0aW9uKTtcblxuICAgICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0cnVlO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBkb3duIGV2ZW50IGhpdHMgdGhlIGN1cnJlbnQgaW5lcnRpYSB0YXJnZXRcbiAgICAgICAgaWYgKHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgJiYgdGhpcy50YXJnZXQuc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIC8vIGNsaW1iIHVwIHRoZSBET00gdHJlZSBmcm9tIHRoZSBldmVudCB0YXJnZXRcbiAgICAgICAgICAgIHdoaWxlIChpc0VsZW1lbnQoZWxlbWVudCkpIHtcblxuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgZWxlbWVudCBpcyB0aGUgY3VycmVudCBpbmVydGlhIHRhcmdldCBlbGVtZW50XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMuZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHRoZSBwcm9zcGVjdGl2ZSBhY3Rpb24gaXMgdGhlIHNhbWUgYXMgdGhlIG9uZ29pbmcgb25lXG4gICAgICAgICAgICAgICAgICAgICYmIHZhbGlkYXRlQWN0aW9uKHRoaXMudGFyZ2V0LmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgdGhpcy5lbGVtZW50KSwgdGhpcy50YXJnZXQpLm5hbWUgPT09IHRoaXMucHJlcGFyZWQubmFtZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgaW5lcnRpYSBzbyB0aGF0IHRoZSBuZXh0IG1vdmUgd2lsbCBiZSBhIG5vcm1hbCBvbmVcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsRnJhbWUodGhpcy5pbmVydGlhU3RhdHVzLmkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2Rvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gcGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRvIG5vdGhpbmcgaWYgaW50ZXJhY3RpbmdcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2Rvd24nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hNYXRjaGVzIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSBpZThNYXRjaGVzU2VsZWN0b3JcbiAgICAgICAgICAgICAgICA/IGNvbnRleHQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgaWYgKGluQ29udGV4dChpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgJiYgIXRlc3RJZ25vcmUoaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiB0ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBtYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIGVsZW1lbnRzKSkge1xuXG4gICAgICAgICAgICAgICAgdGhhdC5tYXRjaGVzLnB1c2goaW50ZXJhY3RhYmxlKTtcbiAgICAgICAgICAgICAgICB0aGF0Lm1hdGNoRWxlbWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSBwb2ludGVyIGNvb3JkcyBmb3IgZGVmYXVsdEFjdGlvbkNoZWNrZXIgdG8gdXNlXG4gICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLmN1ckNvb3JkcywgcG9pbnRlcik7XG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnQ7XG5cbiAgICAgICAgd2hpbGUgKGlzRWxlbWVudChlbGVtZW50KSAmJiAhYWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuXG4gICAgICAgICAgICBpbnRlcmFjdGFibGVzLmZvckVhY2hTZWxlY3RvcihwdXNoTWF0Y2hlcyk7XG5cbiAgICAgICAgICAgIGFjdGlvbiA9IHRoaXMudmFsaWRhdGVTZWxlY3Rvcihwb2ludGVyLCBldmVudCwgdGhpcy5tYXRjaGVzLCB0aGlzLm1hdGNoRWxlbWVudHMpO1xuICAgICAgICAgICAgZWxlbWVudCA9IHBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgID0gYWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLnByZXBhcmVkLmF4aXMgID0gYWN0aW9uLmF4aXM7XG4gICAgICAgICAgICB0aGlzLnByZXBhcmVkLmVkZ2VzID0gYWN0aW9uLmVkZ2VzO1xuXG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wb2ludGVyRG93bihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZG8gdGhlc2Ugbm93IHNpbmNlIHBvaW50ZXJEb3duIGlzbid0IGJlaW5nIGNhbGxlZCBmcm9tIGhlcmVcbiAgICAgICAgICAgIHRoaXMuZG93blRpbWVzW3BvaW50ZXJJbmRleF0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSA9IGV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgZXh0ZW5kKHRoaXMuZG93blBvaW50ZXIsIHBvaW50ZXIpO1xuXG4gICAgICAgICAgICBjb3B5Q29vcmRzKHRoaXMucHJldkNvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdkb3duJyk7XG4gICAgfSxcblxuICAgIC8vIERldGVybWluZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIG5leHQgcG9pbnRlck1vdmUgYW5kIGFkZCBhcHByb3ByaWF0ZVxuICAgIC8vIHN0eWxlIGFuZCBldmVudCBMaXN0ZW5lcnNcbiAgICBwb2ludGVyRG93bjogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGZvcmNlQWN0aW9uKSB7XG4gICAgICAgIGlmICghZm9yY2VBY3Rpb24gJiYgIXRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgJiYgdGhpcy5wb2ludGVyV2FzTW92ZWQgJiYgdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrQW5kUHJldmVudERlZmF1bHQoZXZlbnQsIHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0cnVlO1xuICAgICAgICB0aGlzLmRvd25FdmVudCA9IGV2ZW50O1xuXG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLmFkZFBvaW50ZXIocG9pbnRlciksXG4gICAgICAgICAgICBhY3Rpb247XG5cbiAgICAgICAgLy8gSWYgaXQgaXMgdGhlIHNlY29uZCB0b3VjaCBvZiBhIG11bHRpLXRvdWNoIGdlc3R1cmUsIGtlZXAgdGhlIHRhcmdldFxuICAgICAgICAvLyB0aGUgc2FtZSBpZiBhIHRhcmdldCB3YXMgc2V0IGJ5IHRoZSBmaXJzdCB0b3VjaFxuICAgICAgICAvLyBPdGhlcndpc2UsIHNldCB0aGUgdGFyZ2V0IGlmIHRoZXJlIGlzIG5vIGFjdGlvbiBwcmVwYXJlZFxuICAgICAgICBpZiAoKHRoaXMucG9pbnRlcklkcy5sZW5ndGggPCAyICYmICF0aGlzLnRhcmdldCkgfHwgIXRoaXMucHJlcGFyZWQubmFtZSkge1xuXG4gICAgICAgICAgICB2YXIgaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlcy5nZXQoY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgJiYgIXRlc3RJZ25vcmUoaW50ZXJhY3RhYmxlLCBjdXJFdmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgdGVzdEFsbG93KGludGVyYWN0YWJsZSwgY3VyRXZlbnRUYXJnZXQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIChhY3Rpb24gPSB2YWxpZGF0ZUFjdGlvbihmb3JjZUFjdGlvbiB8fCBpbnRlcmFjdGFibGUuZ2V0QWN0aW9uKHBvaW50ZXIsIGV2ZW50LCB0aGlzLCBjdXJFdmVudFRhcmdldCksIGludGVyYWN0YWJsZSwgZXZlbnRUYXJnZXQpKVxuICAgICAgICAgICAgICAgICYmIHdpdGhpbkludGVyYWN0aW9uTGltaXQoaW50ZXJhY3RhYmxlLCBjdXJFdmVudFRhcmdldCwgYWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gaW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGN1ckV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRhcmdldCAmJiB0YXJnZXQub3B0aW9ucztcblxuICAgICAgICBpZiAodGFyZ2V0ICYmIChmb3JjZUFjdGlvbiB8fCAhdGhpcy5wcmVwYXJlZC5uYW1lKSkge1xuICAgICAgICAgICAgYWN0aW9uID0gYWN0aW9uIHx8IHZhbGlkYXRlQWN0aW9uKGZvcmNlQWN0aW9uIHx8IHRhcmdldC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIGN1ckV2ZW50VGFyZ2V0KSwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzLnNldEV2ZW50WFkodGhpcy5zdGFydENvb3Jkcyk7XG5cbiAgICAgICAgICAgIGlmICghYWN0aW9uKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdHlsZUN1cnNvcikge1xuICAgICAgICAgICAgICAgIHRhcmdldC5fZG9jLmRvY3VtZW50RWxlbWVudC5zdHlsZS5jdXJzb3IgPSBnZXRBY3Rpb25DdXJzb3IoYWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXNpemVBeGVzID0gYWN0aW9uLm5hbWUgPT09ICdyZXNpemUnPyBhY3Rpb24uYXhpcyA6IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb24gPT09ICdnZXN0dXJlJyAmJiB0aGlzLnBvaW50ZXJJZHMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICAgIGFjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSAgPSBhY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuZWRnZXMgPSBhY3Rpb24uZWRnZXM7XG5cbiAgICAgICAgICAgIHRoaXMuc25hcFN0YXR1cy5zbmFwcGVkWCA9IHRoaXMuc25hcFN0YXR1cy5zbmFwcGVkWSA9XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkWCA9IHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZFkgPSBOYU47XG5cbiAgICAgICAgICAgIHRoaXMuZG93blRpbWVzW3BvaW50ZXJJbmRleF0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSA9IGV2ZW50VGFyZ2V0O1xuICAgICAgICAgICAgZXh0ZW5kKHRoaXMuZG93blBvaW50ZXIsIHBvaW50ZXIpO1xuXG4gICAgICAgICAgICB0aGlzLnNldEV2ZW50WFkodGhpcy5wcmV2Q29vcmRzKTtcbiAgICAgICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIGluZXJ0aWEgaXMgYWN0aXZlIHRyeSB0byByZXN1bWUgYWN0aW9uXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmVcbiAgICAgICAgICAgICYmIGN1ckV2ZW50VGFyZ2V0ID09PSB0aGlzLmVsZW1lbnRcbiAgICAgICAgICAgICYmIHZhbGlkYXRlQWN0aW9uKHRhcmdldC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIHRoaXMuZWxlbWVudCksIHRhcmdldCkubmFtZSA9PT0gdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG5cbiAgICAgICAgICAgIGNhbmNlbEZyYW1lKHRoaXMuaW5lcnRpYVN0YXR1cy5pKTtcbiAgICAgICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0TW9kaWZpY2F0aW9uczogZnVuY3Rpb24gKGNvb3JkcywgcHJlRW5kKSB7XG4gICAgICAgIHZhciB0YXJnZXQgICAgICAgICA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgc2hvdWxkTW92ZSAgICAgPSB0cnVlLFxuICAgICAgICAgICAgc2hvdWxkU25hcCAgICAgPSBjaGVja1NuYXAodGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpICAgICAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcC5lbmRPbmx5ICAgICB8fCBwcmVFbmQpLFxuICAgICAgICAgICAgc2hvdWxkUmVzdHJpY3QgPSBjaGVja1Jlc3RyaWN0KHRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0ucmVzdHJpY3QuZW5kT25seSB8fCBwcmVFbmQpO1xuXG4gICAgICAgIGlmIChzaG91bGRTbmFwICAgICkgeyB0aGlzLnNldFNuYXBwaW5nICAgKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMuc25hcFN0YXR1cyAgICAubG9ja2VkICAgICA9IGZhbHNlOyB9XG4gICAgICAgIGlmIChzaG91bGRSZXN0cmljdCkgeyB0aGlzLnNldFJlc3RyaWN0aW9uKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCA9IGZhbHNlOyB9XG5cbiAgICAgICAgaWYgKHNob3VsZFNuYXAgJiYgdGhpcy5zbmFwU3RhdHVzLmxvY2tlZCAmJiAhdGhpcy5zbmFwU3RhdHVzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgIHNob3VsZE1vdmUgPSBzaG91bGRSZXN0cmljdCAmJiB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWQgJiYgdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNob3VsZFJlc3RyaWN0ICYmIHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCAmJiAhdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICBzaG91bGRNb3ZlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hvdWxkTW92ZTtcbiAgICB9LFxuXG4gICAgc2V0U3RhcnRPZmZzZXRzOiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KSxcbiAgICAgICAgICAgIG9yaWdpbiA9IGdldE9yaWdpblhZKGludGVyYWN0YWJsZSwgZWxlbWVudCksXG4gICAgICAgICAgICBzbmFwID0gaW50ZXJhY3RhYmxlLm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5zbmFwLFxuICAgICAgICAgICAgcmVzdHJpY3QgPSBpbnRlcmFjdGFibGUub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LFxuICAgICAgICAgICAgd2lkdGgsIGhlaWdodDtcblxuICAgICAgICBpZiAocmVjdCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydE9mZnNldC5sZWZ0ID0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnggLSByZWN0LmxlZnQ7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueSAtIHJlY3QudG9wO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICA9IHJlY3QucmlnaHQgIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLng7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LmJvdHRvbSA9IHJlY3QuYm90dG9tIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnk7XG5cbiAgICAgICAgICAgIGlmICgnd2lkdGgnIGluIHJlY3QpIHsgd2lkdGggPSByZWN0LndpZHRoOyB9XG4gICAgICAgICAgICBlbHNlIHsgd2lkdGggPSByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0OyB9XG4gICAgICAgICAgICBpZiAoJ2hlaWdodCcgaW4gcmVjdCkgeyBoZWlnaHQgPSByZWN0LmhlaWdodDsgfVxuICAgICAgICAgICAgZWxzZSB7IGhlaWdodCA9IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7IH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRPZmZzZXQubGVmdCA9IHRoaXMuc3RhcnRPZmZzZXQudG9wID0gdGhpcy5zdGFydE9mZnNldC5yaWdodCA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc25hcE9mZnNldHMuc3BsaWNlKDApO1xuXG4gICAgICAgIHZhciBzbmFwT2Zmc2V0ID0gc25hcCAmJiBzbmFwLm9mZnNldCA9PT0gJ3N0YXJ0Q29vcmRzJ1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICB4OiB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueCAtIG9yaWdpbi54LFxuICAgICAgICAgICAgeTogdGhpcy5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueVxuICAgICAgICB9XG4gICAgICAgICAgICA6IHNuYXAgJiYgc25hcC5vZmZzZXQgfHwgeyB4OiAwLCB5OiAwIH07XG5cbiAgICAgICAgaWYgKHJlY3QgJiYgc25hcCAmJiBzbmFwLnJlbGF0aXZlUG9pbnRzICYmIHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBPZmZzZXRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogc25hcC5yZWxhdGl2ZVBvaW50c1tpXS54KSArIHNuYXBPZmZzZXQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogdGhpcy5zdGFydE9mZnNldC50b3AgIC0gKGhlaWdodCAqIHNuYXAucmVsYXRpdmVQb2ludHNbaV0ueSkgKyBzbmFwT2Zmc2V0LnlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc25hcE9mZnNldHMucHVzaChzbmFwT2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWN0ICYmIHJlc3RyaWN0LmVsZW1lbnRSZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogcmVzdHJpY3QuZWxlbWVudFJlY3QubGVmdCk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgLSAoaGVpZ2h0ICogcmVzdHJpY3QuZWxlbWVudFJlY3QudG9wKTtcblxuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICAtICh3aWR0aCAgKiAoMSAtIHJlc3RyaWN0LmVsZW1lbnRSZWN0LnJpZ2h0KSk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tIC0gKGhlaWdodCAqICgxIC0gcmVzdHJpY3QuZWxlbWVudFJlY3QuYm90dG9tKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCA9IHRoaXMucmVzdHJpY3RPZmZzZXQucmlnaHQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IDA7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0aW9uLnN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgICAqIGFjdGlvbiBtdXN0IGJlIGVuYWJsZWQgZm9yIHRoZSB0YXJnZXQgSW50ZXJhY3RhYmxlIGFuZCBhbiBhcHByb3ByaWF0ZSBudW1iZXJcbiAgICAgKiBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biDigJMgMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAgICpcbiAgICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAgICpcbiAgICAgLSBhY3Rpb24gICAgICAgKG9iamVjdCkgIFRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIC0gZHJhZywgcmVzaXplLCBldGMuXG4gICAgIC0gaW50ZXJhY3RhYmxlIChJbnRlcmFjdGFibGUpIFRoZSBJbnRlcmFjdGFibGUgdG8gdGFyZ2V0XG4gICAgIC0gZWxlbWVudCAgICAgIChFbGVtZW50KSBUaGUgRE9NIEVsZW1lbnQgdG8gdGFyZ2V0XG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdCh0YXJnZXQpXG4gICAgIHwgICAuZHJhZ2dhYmxlKHtcbiAgICAgfCAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICAgfCAgICAgbWFudWFsU3RhcnQ6IHRydWVcbiAgICAgfCAgIH0pXG4gICAgIHwgICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAgIHwgICAub24oJ2hvbGQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgfCAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb247XG4gICAgIHxcbiAgICAgfCAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAgIHwgICAgICAgaW50ZXJhY3Rpb24uc3RhcnQoeyBuYW1lOiAnZHJhZycgfSxcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgIHwgICAgIH1cbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgfHwgIXRoaXMucG9pbnRlcklzRG93blxuICAgICAgICAgICAgfHwgdGhpcy5wb2ludGVySWRzLmxlbmd0aCA8IChhY3Rpb24ubmFtZSA9PT0gJ2dlc3R1cmUnPyAyIDogMSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoaXMgaW50ZXJhY3Rpb24gaGFkIGJlZW4gcmVtb3ZlZCBhZnRlciBzdG9wcGluZ1xuICAgICAgICAvLyBhZGQgaXQgYmFja1xuICAgICAgICBpZiAoaW5kZXhPZihpbnRlcmFjdGlvbnMsIHRoaXMpID09PSAtMSkge1xuICAgICAgICAgICAgaW50ZXJhY3Rpb25zLnB1c2godGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgID0gYWN0aW9uLm5hbWU7XG4gICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgdGhpcy5wcmVwYXJlZC5lZGdlcyA9IGFjdGlvbi5lZGdlcztcbiAgICAgICAgdGhpcy50YXJnZXQgICAgICAgICA9IGludGVyYWN0YWJsZTtcbiAgICAgICAgdGhpcy5lbGVtZW50ICAgICAgICA9IGVsZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuc3RhcnRDb29yZHMpO1xuICAgICAgICB0aGlzLnNldFN0YXJ0T2Zmc2V0cyhhY3Rpb24ubmFtZSwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KTtcbiAgICAgICAgdGhpcy5zZXRNb2RpZmljYXRpb25zKHRoaXMuc3RhcnRDb29yZHMucGFnZSk7XG5cbiAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSB0aGlzW3RoaXMucHJlcGFyZWQubmFtZSArICdTdGFydCddKHRoaXMuZG93bkV2ZW50KTtcbiAgICB9LFxuXG4gICAgcG9pbnRlck1vdmU6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBwcmVFbmQpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRQb2ludGVyKHBvaW50ZXIpO1xuXG4gICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLmN1ckNvb3JkcywgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50KVxuICAgICAgICAgICAgPyB0aGlzLmluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudFxuICAgICAgICAgICAgOiB1bmRlZmluZWQpO1xuXG4gICAgICAgIHZhciBkdXBsaWNhdGVNb3ZlID0gKHRoaXMuY3VyQ29vcmRzLnBhZ2UueCA9PT0gdGhpcy5wcmV2Q29vcmRzLnBhZ2UueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5wYWdlLnkgPT09IHRoaXMucHJldkNvb3Jkcy5wYWdlLnlcbiAgICAgICAgJiYgdGhpcy5jdXJDb29yZHMuY2xpZW50LnggPT09IHRoaXMucHJldkNvb3Jkcy5jbGllbnQueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueSA9PT0gdGhpcy5wcmV2Q29vcmRzLmNsaWVudC55KTtcblxuICAgICAgICB2YXIgZHgsIGR5LFxuICAgICAgICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IGluZGV4T2YodGhpcy5wb2ludGVySWRzLCBnZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIG1vdmVtZW50IGdyZWF0ZXIgdGhhbiBwb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgICAgICAgZHggPSB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueCAtIHRoaXMuc3RhcnRDb29yZHMuY2xpZW50Lng7XG4gICAgICAgICAgICBkeSA9IHRoaXMuY3VyQ29vcmRzLmNsaWVudC55IC0gdGhpcy5zdGFydENvb3Jkcy5jbGllbnQueTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBoeXBvdChkeCwgZHkpID4gcG9pbnRlck1vdmVUb2xlcmFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWR1cGxpY2F0ZU1vdmUgJiYgKCF0aGlzLnBvaW50ZXJJc0Rvd24gfHwgdGhpcy5wb2ludGVyV2FzTW92ZWQpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ21vdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5wb2ludGVySXNEb3duKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmIChkdXBsaWNhdGVNb3ZlICYmIHRoaXMucG9pbnRlcldhc01vdmVkICYmICFwcmVFbmQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgcG9pbnRlciBjb29yZGluYXRlLCB0aW1lIGNoYW5nZXMgYW5kIHNwZWVkc1xuICAgICAgICBzZXRFdmVudERlbHRhcyh0aGlzLnBvaW50ZXJEZWx0YSwgdGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkXG4gICAgICAgICAgICAgICAgLy8gaWdub3JlIG1vdmVtZW50IHdoaWxlIGluZXJ0aWEgaXMgYWN0aXZlXG4gICAgICAgICAgICAmJiAoIXRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgfHwgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50ICYmIC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkpKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIGp1c3Qgc3RhcnRpbmcgYW4gYWN0aW9uLCBjYWxjdWxhdGUgdGhlIHBvaW50ZXIgc3BlZWQgbm93XG4gICAgICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgICAgIHNldEV2ZW50RGVsdGFzKHRoaXMucG9pbnRlckRlbHRhLCB0aGlzLnByZXZDb29yZHMsIHRoaXMuY3VyQ29vcmRzKTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGEgZHJhZyBpcyBpbiB0aGUgY29ycmVjdCBheGlzXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJlcGFyZWQubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhYnNYID0gTWF0aC5hYnMoZHgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWJzWSA9IE1hdGguYWJzKGR5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEF4aXMgPSB0aGlzLnRhcmdldC5vcHRpb25zLmRyYWcuYXhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXMgPSAoYWJzWCA+IGFic1kgPyAneCcgOiBhYnNYIDwgYWJzWSA/ICd5JyA6ICd4eScpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBtb3ZlbWVudCBpc24ndCBpbiB0aGUgYXhpcyBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgICAgIGlmIChheGlzICE9PSAneHknICYmIHRhcmdldEF4aXMgIT09ICd4eScgJiYgdGFyZ2V0QXhpcyAhPT0gYXhpcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuY2VsIHRoZSBwcmVwYXJlZCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRvIGdldCBhIGRyYWcgZnJvbSBhbm90aGVyIGluZXJhY3RhYmxlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGVsZW1lbnQgaW50ZXJhY3RhYmxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50SW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlcy5nZXQoZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudEludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBlbGVtZW50SW50ZXJhY3RhYmxlICE9PSB0aGlzLnRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhZWxlbWVudEludGVyYWN0YWJsZS5vcHRpb25zLmRyYWcubWFudWFsU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgZWxlbWVudEludGVyYWN0YWJsZS5nZXRBY3Rpb24odGhpcy5kb3duUG9pbnRlciwgdGhpcy5kb3duRXZlbnQsIHRoaXMsIGVsZW1lbnQpLm5hbWUgPT09ICdkcmFnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBjaGVja0F4aXMoYXhpcywgZWxlbWVudEludGVyYWN0YWJsZSkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gZWxlbWVudEludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlJ3Mgbm8gZHJhZyBmcm9tIGVsZW1lbnQgaW50ZXJhY3RhYmxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBzZWxlY3RvciBpbnRlcmFjdGFibGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucHJlcGFyZWQubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzSW50ZXJhY3Rpb24gPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdldERyYWdnYWJsZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IGllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlID09PSB0aGlzSW50ZXJhY3Rpb24udGFyZ2V0KSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFpbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhdGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgdGVzdEFsbG93KGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBtYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIGVsZW1lbnRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgaW50ZXJhY3RhYmxlLmdldEFjdGlvbih0aGlzSW50ZXJhY3Rpb24uZG93blBvaW50ZXIsIHRoaXNJbnRlcmFjdGlvbi5kb3duRXZlbnQsIHRoaXNJbnRlcmFjdGlvbiwgZWxlbWVudCkubmFtZSA9PT0gJ2RyYWcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBjaGVja0F4aXMoYXhpcywgaW50ZXJhY3RhYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgd2l0aGluSW50ZXJhY3Rpb25MaW1pdChpbnRlcmFjdGFibGUsIGVsZW1lbnQsICdkcmFnJykpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RvckludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKGdldERyYWdnYWJsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9ySW50ZXJhY3RhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IHNlbGVjdG9ySW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3RhcnRpbmcgPSAhIXRoaXMucHJlcGFyZWQubmFtZSAmJiAhdGhpcy5pbnRlcmFjdGluZygpO1xuXG4gICAgICAgICAgICBpZiAoc3RhcnRpbmdcbiAgICAgICAgICAgICAgICAmJiAodGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgfHwgIXdpdGhpbkludGVyYWN0aW9uTGltaXQodGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCwgdGhpcy5wcmVwYXJlZCkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5uYW1lICYmIHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQodGhpcy5wcmVwYXJlZCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNob3VsZE1vdmUgPSB0aGlzLnNldE1vZGlmaWNhdGlvbnModGhpcy5jdXJDb29yZHMucGFnZSwgcHJlRW5kKTtcblxuICAgICAgICAgICAgICAgIC8vIG1vdmUgaWYgc25hcHBpbmcgb3IgcmVzdHJpY3Rpb24gZG9lc24ndCBwcmV2ZW50IGl0XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZE1vdmUgfHwgc3RhcnRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSB0aGlzW3RoaXMucHJlcGFyZWQubmFtZSArICdNb3ZlJ10oZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb3B5Q29vcmRzKHRoaXMucHJldkNvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuXG4gICAgICAgIGlmICh0aGlzLmRyYWdnaW5nIHx8IHRoaXMucmVzaXppbmcpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Njcm9sbE1vdmUocG9pbnRlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHJhZ1N0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGRyYWdFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZHJhZycsICdzdGFydCcsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMudGFyZ2V0LmZpcmUoZHJhZ0V2ZW50KTtcblxuICAgICAgICAvLyByZXNldCBhY3RpdmUgZHJvcHpvbmVzXG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHMgID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgID0gW107XG5cbiAgICAgICAgaWYgKCF0aGlzLmR5bmFtaWNEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLnNldEFjdGl2ZURyb3BzKHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHRoaXMuZ2V0RHJvcEV2ZW50cyhldmVudCwgZHJhZ0V2ZW50KTtcblxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5hY3RpdmF0ZSkge1xuICAgICAgICAgICAgdGhpcy5maXJlQWN0aXZlRHJvcHMoZHJvcEV2ZW50cy5hY3RpdmF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJhZ0V2ZW50O1xuICAgIH0sXG5cbiAgICBkcmFnTW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIGRyYWdFdmVudCAgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ2RyYWcnLCAnbW92ZScsIHRoaXMuZWxlbWVudCksXG4gICAgICAgICAgICBkcmFnZ2FibGVFbGVtZW50ID0gdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgZHJvcCA9IHRoaXMuZ2V0RHJvcChldmVudCwgZHJhZ2dhYmxlRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5kcm9wVGFyZ2V0ID0gZHJvcC5kcm9wem9uZTtcbiAgICAgICAgdGhpcy5kcm9wRWxlbWVudCA9IGRyb3AuZWxlbWVudDtcblxuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHRoaXMuZ2V0RHJvcEV2ZW50cyhldmVudCwgZHJhZ0V2ZW50KTtcblxuICAgICAgICB0YXJnZXQuZmlyZShkcmFnRXZlbnQpO1xuXG4gICAgICAgIGlmIChkcm9wRXZlbnRzLmxlYXZlKSB7IHRoaXMucHJldkRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmxlYXZlKTsgfVxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5lbnRlcikgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5lbnRlcik7IH1cbiAgICAgICAgaWYgKGRyb3BFdmVudHMubW92ZSApIHsgICAgIHRoaXMuZHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubW92ZSApOyB9XG5cbiAgICAgICAgdGhpcy5wcmV2RHJvcFRhcmdldCAgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIHRoaXMucHJldkRyb3BFbGVtZW50ID0gdGhpcy5kcm9wRWxlbWVudDtcblxuICAgICAgICByZXR1cm4gZHJhZ0V2ZW50O1xuICAgIH0sXG5cbiAgICByZXNpemVTdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciByZXNpemVFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5lZGdlcykge1xuICAgICAgICAgICAgdmFyIHN0YXJ0UmVjdCA9IHRoaXMudGFyZ2V0LmdldFJlY3QodGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Lm9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgICAgICAgICAgICAgIHZhciBzcXVhcmVFZGdlcyA9IGV4dGVuZCh7fSwgdGhpcy5wcmVwYXJlZC5lZGdlcyk7XG5cbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy50b3AgICAgPSBzcXVhcmVFZGdlcy50b3AgICAgfHwgKHNxdWFyZUVkZ2VzLmxlZnQgICAmJiAhc3F1YXJlRWRnZXMuYm90dG9tKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5sZWZ0ICAgPSBzcXVhcmVFZGdlcy5sZWZ0ICAgfHwgKHNxdWFyZUVkZ2VzLnRvcCAgICAmJiAhc3F1YXJlRWRnZXMucmlnaHQgKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5ib3R0b20gPSBzcXVhcmVFZGdlcy5ib3R0b20gfHwgKHNxdWFyZUVkZ2VzLnJpZ2h0ICAmJiAhc3F1YXJlRWRnZXMudG9wICAgKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5yaWdodCAgPSBzcXVhcmVFZGdlcy5yaWdodCAgfHwgKHNxdWFyZUVkZ2VzLmJvdHRvbSAmJiAhc3F1YXJlRWRnZXMubGVmdCAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuX3NxdWFyZUVkZ2VzID0gc3F1YXJlRWRnZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLl9zcXVhcmVFZGdlcyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucmVzaXplUmVjdHMgPSB7XG4gICAgICAgICAgICAgICAgc3RhcnQgICAgIDogc3RhcnRSZWN0LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQgICA6IGV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkOiBleHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgIDogZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgICAgICAgICAgICAgIGRlbHRhICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMCwgcmlnaHQgOiAwLCB3aWR0aCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvcCA6IDAsIGJvdHRvbTogMCwgaGVpZ2h0OiAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmVzaXplRXZlbnQucmVjdCA9IHRoaXMucmVzaXplUmVjdHMucmVzdHJpY3RlZDtcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmRlbHRhUmVjdCA9IHRoaXMucmVzaXplUmVjdHMuZGVsdGE7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKHJlc2l6ZUV2ZW50KTtcblxuICAgICAgICB0aGlzLnJlc2l6aW5nID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gcmVzaXplRXZlbnQ7XG4gICAgfSxcblxuICAgIHJlc2l6ZU1vdmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcmVzaXplRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ3Jlc2l6ZScsICdtb3ZlJywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICB2YXIgZWRnZXMgPSB0aGlzLnByZXBhcmVkLmVkZ2VzLFxuICAgICAgICAgICAgaW52ZXJ0ID0gdGhpcy50YXJnZXQub3B0aW9ucy5yZXNpemUuaW52ZXJ0LFxuICAgICAgICAgICAgaW52ZXJ0aWJsZSA9IGludmVydCA9PT0gJ3JlcG9zaXRpb24nIHx8IGludmVydCA9PT0gJ25lZ2F0ZSc7XG5cbiAgICAgICAgaWYgKGVkZ2VzKSB7XG4gICAgICAgICAgICB2YXIgZHggPSByZXNpemVFdmVudC5keCxcbiAgICAgICAgICAgICAgICBkeSA9IHJlc2l6ZUV2ZW50LmR5LFxuXG4gICAgICAgICAgICAgICAgc3RhcnQgICAgICA9IHRoaXMucmVzaXplUmVjdHMuc3RhcnQsXG4gICAgICAgICAgICAgICAgY3VycmVudCAgICA9IHRoaXMucmVzaXplUmVjdHMuY3VycmVudCxcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkID0gdGhpcy5yZXNpemVSZWN0cy5yZXN0cmljdGVkLFxuICAgICAgICAgICAgICAgIGRlbHRhICAgICAgPSB0aGlzLnJlc2l6ZVJlY3RzLmRlbHRhLFxuICAgICAgICAgICAgICAgIHByZXZpb3VzICAgPSBleHRlbmQodGhpcy5yZXNpemVSZWN0cy5wcmV2aW91cywgcmVzdHJpY3RlZCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldC5vcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxFZGdlcyA9IGVkZ2VzO1xuXG4gICAgICAgICAgICAgICAgZWRnZXMgPSB0aGlzLnByZXBhcmVkLl9zcXVhcmVFZGdlcztcblxuICAgICAgICAgICAgICAgIGlmICgob3JpZ2luYWxFZGdlcy5sZWZ0ICYmIG9yaWdpbmFsRWRnZXMuYm90dG9tKVxuICAgICAgICAgICAgICAgICAgICB8fCAob3JpZ2luYWxFZGdlcy5yaWdodCAmJiBvcmlnaW5hbEVkZ2VzLnRvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSAtZHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMubGVmdCB8fCBvcmlnaW5hbEVkZ2VzLnJpZ2h0KSB7IGR5ID0gZHg7IH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLnRvcCB8fCBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgeyBkeCA9IGR5OyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgJ2N1cnJlbnQnIHJlY3Qgd2l0aG91dCBtb2RpZmljYXRpb25zXG4gICAgICAgICAgICBpZiAoZWRnZXMudG9wICAgKSB7IGN1cnJlbnQudG9wICAgICs9IGR5OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMuYm90dG9tKSB7IGN1cnJlbnQuYm90dG9tICs9IGR5OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMubGVmdCAgKSB7IGN1cnJlbnQubGVmdCAgICs9IGR4OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMucmlnaHQgKSB7IGN1cnJlbnQucmlnaHQgICs9IGR4OyB9XG5cbiAgICAgICAgICAgIGlmIChpbnZlcnRpYmxlKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgaW52ZXJ0aWJsZSwgY29weSB0aGUgY3VycmVudCByZWN0XG4gICAgICAgICAgICAgICAgZXh0ZW5kKHJlc3RyaWN0ZWQsIGN1cnJlbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGludmVydCA9PT0gJ3JlcG9zaXRpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN3YXAgZWRnZSB2YWx1ZXMgaWYgbmVjZXNzYXJ5IHRvIGtlZXAgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlXG4gICAgICAgICAgICAgICAgICAgIHZhciBzd2FwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN0cmljdGVkLnRvcCA+IHJlc3RyaWN0ZWQuYm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2FwID0gcmVzdHJpY3RlZC50b3A7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQudG9wID0gcmVzdHJpY3RlZC5ib3R0b207XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0cmljdGVkLmJvdHRvbSA9IHN3YXA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3RyaWN0ZWQubGVmdCA+IHJlc3RyaWN0ZWQucmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXAgPSByZXN0cmljdGVkLmxlZnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQubGVmdCA9IHJlc3RyaWN0ZWQucmlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0cmljdGVkLnJpZ2h0ID0gc3dhcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vdCBpbnZlcnRpYmxlLCByZXN0cmljdCB0byBtaW5pbXVtIG9mIDB4MCByZWN0XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC50b3AgICAgPSBNYXRoLm1pbihjdXJyZW50LnRvcCwgc3RhcnQuYm90dG9tKTtcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkLmJvdHRvbSA9IE1hdGgubWF4KGN1cnJlbnQuYm90dG9tLCBzdGFydC50b3ApO1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQubGVmdCAgID0gTWF0aC5taW4oY3VycmVudC5sZWZ0LCBzdGFydC5yaWdodCk7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC5yaWdodCAgPSBNYXRoLm1heChjdXJyZW50LnJpZ2h0LCBzdGFydC5sZWZ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdHJpY3RlZC53aWR0aCAgPSByZXN0cmljdGVkLnJpZ2h0ICAtIHJlc3RyaWN0ZWQubGVmdDtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWQuaGVpZ2h0ID0gcmVzdHJpY3RlZC5ib3R0b20gLSByZXN0cmljdGVkLnRvcCA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGVkZ2UgaW4gcmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgIGRlbHRhW2VkZ2VdID0gcmVzdHJpY3RlZFtlZGdlXSAtIHByZXZpb3VzW2VkZ2VdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNpemVFdmVudC5lZGdlcyA9IHRoaXMucHJlcGFyZWQuZWRnZXM7XG4gICAgICAgICAgICByZXNpemVFdmVudC5yZWN0ID0gcmVzdHJpY3RlZDtcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmRlbHRhUmVjdCA9IGRlbHRhO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShyZXNpemVFdmVudCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc2l6ZUV2ZW50O1xuICAgIH0sXG5cbiAgICBnZXN0dXJlU3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICBnZXN0dXJlRXZlbnQuZHMgPSAwO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyZS5zdGFydERpc3RhbmNlID0gdGhpcy5nZXN0dXJlLnByZXZEaXN0YW5jZSA9IGdlc3R1cmVFdmVudC5kaXN0YW5jZTtcbiAgICAgICAgdGhpcy5nZXN0dXJlLnN0YXJ0QW5nbGUgPSB0aGlzLmdlc3R1cmUucHJldkFuZ2xlID0gZ2VzdHVyZUV2ZW50LmFuZ2xlO1xuICAgICAgICB0aGlzLmdlc3R1cmUuc2NhbGUgPSAxO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyaW5nID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKGdlc3R1cmVFdmVudCk7XG5cbiAgICAgICAgcmV0dXJuIGdlc3R1cmVFdmVudDtcbiAgICB9LFxuXG4gICAgZ2VzdHVyZU1vdmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoIXRoaXMucG9pbnRlcklkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZFdmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnZXN0dXJlRXZlbnQ7XG5cbiAgICAgICAgZ2VzdHVyZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ21vdmUnLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICBnZXN0dXJlRXZlbnQuZHMgPSBnZXN0dXJlRXZlbnQuc2NhbGUgLSB0aGlzLmdlc3R1cmUuc2NhbGU7XG5cbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShnZXN0dXJlRXZlbnQpO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyZS5wcmV2QW5nbGUgPSBnZXN0dXJlRXZlbnQuYW5nbGU7XG4gICAgICAgIHRoaXMuZ2VzdHVyZS5wcmV2RGlzdGFuY2UgPSBnZXN0dXJlRXZlbnQuZGlzdGFuY2U7XG5cbiAgICAgICAgaWYgKGdlc3R1cmVFdmVudC5zY2FsZSAhPT0gSW5maW5pdHkgJiZcbiAgICAgICAgICAgIGdlc3R1cmVFdmVudC5zY2FsZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgZ2VzdHVyZUV2ZW50LnNjYWxlICE9PSB1bmRlZmluZWQgICYmXG4gICAgICAgICAgICAhaXNOYU4oZ2VzdHVyZUV2ZW50LnNjYWxlKSkge1xuXG4gICAgICAgICAgICB0aGlzLmdlc3R1cmUuc2NhbGUgPSBnZXN0dXJlRXZlbnQuc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2VzdHVyZUV2ZW50O1xuICAgIH0sXG5cbiAgICBwb2ludGVySG9sZDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnaG9sZCcpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyVXA6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIGdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcblxuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAndXAnICk7XG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICd0YXAnKTtcblxuICAgICAgICB0aGlzLnBvaW50ZXJFbmQocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyQ2FuY2VsOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IGluZGV4T2YodGhpcy5wb2ludGVySWRzLCBnZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhvbGRUaW1lcnNbcG9pbnRlckluZGV4XSk7XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2NhbmNlbCcpO1xuICAgICAgICB0aGlzLnBvaW50ZXJFbmQocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIpO1xuICAgIH0sXG5cbiAgICAvLyBodHRwOi8vd3d3LnF1aXJrc21vZGUub3JnL2RvbS9ldmVudHMvY2xpY2suaHRtbFxuICAgIC8vID5FdmVudHMgbGVhZGluZyB0byBkYmxjbGlja1xuICAgIC8vXG4gICAgLy8gSUU4IGRvZXNuJ3QgZmlyZSBkb3duIGV2ZW50IGJlZm9yZSBkYmxjbGljay5cbiAgICAvLyBUaGlzIHdvcmthcm91bmQgdHJpZXMgdG8gZmlyZSBhIHRhcCBhbmQgZG91YmxldGFwIGFmdGVyIGRibGNsaWNrXG4gICAgaWU4RGJsY2xpY2s6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICAgICAgaWYgKHRoaXMucHJldlRhcFxuICAgICAgICAgICAgJiYgZXZlbnQuY2xpZW50WCA9PT0gdGhpcy5wcmV2VGFwLmNsaWVudFhcbiAgICAgICAgICAgICYmIGV2ZW50LmNsaWVudFkgPT09IHRoaXMucHJldlRhcC5jbGllbnRZXG4gICAgICAgICAgICAmJiBldmVudFRhcmdldCAgID09PSB0aGlzLnByZXZUYXAudGFyZ2V0KSB7XG5cbiAgICAgICAgICAgIHRoaXMuZG93blRhcmdldHNbMF0gPSBldmVudFRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuZG93blRpbWVzWzBdID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAndGFwJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBpbmVydGlhIGlzIGVuYWJsZWRcbiAgICBwb2ludGVyRW5kOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgZW5kRXZlbnQsXG4gICAgICAgICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMsXG4gICAgICAgICAgICBpbmVydGlhT3B0aW9ucyA9IG9wdGlvbnMgJiYgdGhpcy5wcmVwYXJlZC5uYW1lICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLFxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cyA9IHRoaXMuaW5lcnRpYVN0YXR1cztcblxuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG5cbiAgICAgICAgICAgIGlmIChpbmVydGlhU3RhdHVzLmFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgdmFyIHBvaW50ZXJTcGVlZCxcbiAgICAgICAgICAgICAgICBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgICAgICAgICBpbmVydGlhUG9zc2libGUgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpbmVydGlhID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgc21vb3RoRW5kID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgZW5kU25hcCA9IGNoZWNrU25hcCh0YXJnZXQsIHRoaXMucHJlcGFyZWQubmFtZSkgJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnNuYXAuZW5kT25seSxcbiAgICAgICAgICAgICAgICBlbmRSZXN0cmljdCA9IGNoZWNrUmVzdHJpY3QodGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5yZXN0cmljdC5lbmRPbmx5LFxuICAgICAgICAgICAgICAgIGR4ID0gMCxcbiAgICAgICAgICAgICAgICBkeSA9IDAsXG4gICAgICAgICAgICAgICAgc3RhcnRFdmVudDtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAgICAgIChvcHRpb25zLmRyYWcuYXhpcyA9PT0gJ3gnICkgeyBwb2ludGVyU3BlZWQgPSBNYXRoLmFicyh0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudngpOyB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5kcmFnLmF4aXMgPT09ICd5JyApIHsgcG9pbnRlclNwZWVkID0gTWF0aC5hYnModGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnZ5KTsgfVxuICAgICAgICAgICAgICAgIGVsc2UgICAvKm9wdGlvbnMuZHJhZy5heGlzID09PSAneHknKi97IHBvaW50ZXJTcGVlZCA9IHRoaXMucG9pbnRlckRlbHRhLmNsaWVudC5zcGVlZDsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcG9pbnRlclNwZWVkID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnNwZWVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBpbmVydGlhIHNob3VsZCBiZSBzdGFydGVkXG4gICAgICAgICAgICBpbmVydGlhUG9zc2libGUgPSAoaW5lcnRpYU9wdGlvbnMgJiYgaW5lcnRpYU9wdGlvbnMuZW5hYmxlZFxuICAgICAgICAgICAgJiYgdGhpcy5wcmVwYXJlZC5uYW1lICE9PSAnZ2VzdHVyZSdcbiAgICAgICAgICAgICYmIGV2ZW50ICE9PSBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhID0gKGluZXJ0aWFQb3NzaWJsZVxuICAgICAgICAgICAgJiYgKG5vdyAtIHRoaXMuY3VyQ29vcmRzLnRpbWVTdGFtcCkgPCA1MFxuICAgICAgICAgICAgJiYgcG9pbnRlclNwZWVkID4gaW5lcnRpYU9wdGlvbnMubWluU3BlZWRcbiAgICAgICAgICAgICYmIHBvaW50ZXJTcGVlZCA+IGluZXJ0aWFPcHRpb25zLmVuZFNwZWVkKTtcblxuICAgICAgICAgICAgaWYgKGluZXJ0aWFQb3NzaWJsZSAmJiAhaW5lcnRpYSAmJiAoZW5kU25hcCB8fCBlbmRSZXN0cmljdCkpIHtcblxuICAgICAgICAgICAgICAgIHZhciBzbmFwUmVzdHJpY3QgPSB7fTtcblxuICAgICAgICAgICAgICAgIHNuYXBSZXN0cmljdC5zbmFwID0gc25hcFJlc3RyaWN0LnJlc3RyaWN0ID0gc25hcFJlc3RyaWN0O1xuXG4gICAgICAgICAgICAgICAgaWYgKGVuZFNuYXApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTbmFwcGluZyh0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzbmFwUmVzdHJpY3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc25hcFJlc3RyaWN0LmxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHggKz0gc25hcFJlc3RyaWN0LmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gc25hcFJlc3RyaWN0LmR5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVzdHJpY3Rpb24odGhpcy5jdXJDb29yZHMucGFnZSwgc25hcFJlc3RyaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNuYXBSZXN0cmljdC5yZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeCArPSBzbmFwUmVzdHJpY3QuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBzbmFwUmVzdHJpY3QuZHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZHggfHwgZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoRW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbmVydGlhIHx8IHNtb290aEVuZCkge1xuICAgICAgICAgICAgICAgIGNvcHlDb29yZHMoaW5lcnRpYVN0YXR1cy51cENvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyc1swXSA9IGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCA9IHN0YXJ0RXZlbnQgPVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgdGhpcy5wcmVwYXJlZC5uYW1lLCAnaW5lcnRpYXN0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudDAgPSBub3c7XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQuZmlyZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZXJ0aWEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy52eDAgPSB0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudng7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudnkwID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnZ5O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnYwID0gcG9pbnRlclNwZWVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsY0luZXJ0aWEoaW5lcnRpYVN0YXR1cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSBleHRlbmQoe30sIHRoaXMuY3VyQ29vcmRzLnBhZ2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luID0gZ2V0T3JpZ2luWFkodGFyZ2V0LCB0aGlzLmVsZW1lbnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzT2JqZWN0O1xuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UueCA9IHBhZ2UueCArIGluZXJ0aWFTdGF0dXMueGUgLSBvcmlnaW4ueDtcbiAgICAgICAgICAgICAgICAgICAgcGFnZS55ID0gcGFnZS55ICsgaW5lcnRpYVN0YXR1cy55ZSAtIG9yaWdpbi55O1xuXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c09iamVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZVN0YXR1c1hZOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFnZS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFnZS55LFxuICAgICAgICAgICAgICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkeTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNuYXA6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNPYmplY3Quc25hcCA9IHN0YXR1c09iamVjdDtcblxuICAgICAgICAgICAgICAgICAgICBkeCA9IGR5ID0gMDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5kU25hcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNuYXAgPSB0aGlzLnNldFNuYXBwaW5nKHRoaXMuY3VyQ29vcmRzLnBhZ2UsIHN0YXR1c09iamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzbmFwLmxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHNuYXAuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gc25hcC5keTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRSZXN0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3RyaWN0ID0gdGhpcy5zZXRSZXN0cmljdGlvbih0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzdGF0dXNPYmplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdHJpY3QucmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHJlc3RyaWN0LmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ICs9IHJlc3RyaWN0LmR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlICs9IGR4O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWUgKz0gZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5pID0gcmVxRnJhbWUodGhpcy5ib3VuZEluZXJ0aWFGcmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnNtb290aEVuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMueGUgPSBkeDtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy55ZSA9IGR5O1xuXG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBpbmVydGlhU3RhdHVzLnN5ID0gMDtcblxuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLmkgPSByZXFGcmFtZSh0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbmRTbmFwIHx8IGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgLy8gZmlyZSBhIG1vdmUgZXZlbnQgYXQgdGhlIHNuYXBwZWQgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgICAgIGVuZEV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdkcmFnJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHZhciBkcmFnZ2FibGVFbGVtZW50ID0gdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgICAgIGRyb3AgPSB0aGlzLmdldERyb3AoZXZlbnQsIGRyYWdnYWJsZUVsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSBkcm9wLmRyb3B6b25lO1xuICAgICAgICAgICAgdGhpcy5kcm9wRWxlbWVudCA9IGRyb3AuZWxlbWVudDtcblxuICAgICAgICAgICAgdmFyIGRyb3BFdmVudHMgPSB0aGlzLmdldERyb3BFdmVudHMoZXZlbnQsIGVuZEV2ZW50KTtcblxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMubGVhdmUpIHsgdGhpcy5wcmV2RHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubGVhdmUpOyB9XG4gICAgICAgICAgICBpZiAoZHJvcEV2ZW50cy5lbnRlcikgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5lbnRlcik7IH1cbiAgICAgICAgICAgIGlmIChkcm9wRXZlbnRzLmRyb3AgKSB7ICAgICB0aGlzLmRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmRyb3AgKTsgfVxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMuZGVhY3RpdmF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZUFjdGl2ZURyb3BzKGRyb3BFdmVudHMuZGVhY3RpdmF0ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhcmdldC5maXJlKGVuZEV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnJlc2l6aW5nKSB7XG4gICAgICAgICAgICBlbmRFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5nZXN0dXJpbmcpIHtcbiAgICAgICAgICAgIGVuZEV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ2VuZCcsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0b3AoZXZlbnQpO1xuICAgIH0sXG5cbiAgICBjb2xsZWN0RHJvcHM6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIHZhciBkcm9wcyA9IFtdLFxuICAgICAgICAgICAgZWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgdGhpcy5lbGVtZW50O1xuXG4gICAgICAgIC8vIGNvbGxlY3QgYWxsIGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgd2hpY2ggcXVhbGlmeSBmb3IgYSBkcm9wXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnRlcmFjdGFibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWludGVyYWN0YWJsZXNbaV0ub3B0aW9ucy5kcm9wLmVuYWJsZWQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBpbnRlcmFjdGFibGVzW2ldLFxuICAgICAgICAgICAgICAgIGFjY2VwdCA9IGN1cnJlbnQub3B0aW9ucy5kcm9wLmFjY2VwdDtcblxuICAgICAgICAgICAgLy8gdGVzdCB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQgYWdhaW5zdCB0aGUgZHJvcHpvbmUncyBhY2NlcHQgc2V0dGluZ1xuICAgICAgICAgICAgaWYgKChpc0VsZW1lbnQoYWNjZXB0KSAmJiBhY2NlcHQgIT09IGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgfHwgKGlzU3RyaW5nKGFjY2VwdClcbiAgICAgICAgICAgICAgICAmJiAhbWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIGFjY2VwdCkpKSB7XG5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcXVlcnkgZm9yIG5ldyBlbGVtZW50cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgIHZhciBkcm9wRWxlbWVudHMgPSBjdXJyZW50LnNlbGVjdG9yPyBjdXJyZW50Ll9jb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoY3VycmVudC5zZWxlY3RvcikgOiBbY3VycmVudC5fZWxlbWVudF07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBsZW4gPSBkcm9wRWxlbWVudHMubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEVsZW1lbnQgPSBkcm9wRWxlbWVudHNbal07XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZHJvcHMucHVzaChjdXJyZW50KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkcm9wem9uZXM6IGRyb3BzLFxuICAgICAgICAgICAgZWxlbWVudHM6IGVsZW1lbnRzXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGZpcmVBY3RpdmVEcm9wczogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgY3VycmVudCxcbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50LFxuICAgICAgICAgICAgcHJldkVsZW1lbnQ7XG5cbiAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGFsbCBhY3RpdmUgZHJvcHpvbmVzIGFuZCB0cmlnZ2VyIGV2ZW50XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudCA9IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzW2ldO1xuICAgICAgICAgICAgY3VycmVudEVsZW1lbnQgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtpXTtcblxuICAgICAgICAgICAgLy8gcHJldmVudCB0cmlnZ2VyIG9mIGR1cGxpY2F0ZSBldmVudHMgb24gc2FtZSBlbGVtZW50XG4gICAgICAgICAgICBpZiAoY3VycmVudEVsZW1lbnQgIT09IHByZXZFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0IGN1cnJlbnQgZWxlbWVudCBhcyBldmVudCB0YXJnZXRcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBjdXJyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICBjdXJyZW50LmZpcmUoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldkVsZW1lbnQgPSBjdXJyZW50RWxlbWVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBDb2xsZWN0IGEgbmV3IHNldCBvZiBwb3NzaWJsZSBkcm9wcyBhbmQgc2F2ZSB0aGVtIGluIGFjdGl2ZURyb3BzLlxuICAgIC8vIHNldEFjdGl2ZURyb3BzIHNob3VsZCBhbHdheXMgYmUgY2FsbGVkIHdoZW4gYSBkcmFnIGhhcyBqdXN0IHN0YXJ0ZWQgb3IgYVxuICAgIC8vIGRyYWcgZXZlbnQgaGFwcGVucyB3aGlsZSBkeW5hbWljRHJvcCBpcyB0cnVlXG4gICAgc2V0QWN0aXZlRHJvcHM6IGZ1bmN0aW9uIChkcmFnRWxlbWVudCkge1xuICAgICAgICAvLyBnZXQgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB0aGF0IGNvdWxkIHJlY2VpdmUgdGhlIGRyYWdnYWJsZVxuICAgICAgICB2YXIgcG9zc2libGVEcm9wcyA9IHRoaXMuY29sbGVjdERyb3BzKGRyYWdFbGVtZW50LCB0cnVlKTtcblxuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcyA9IHBvc3NpYmxlRHJvcHMuZHJvcHpvbmVzO1xuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzICA9IHBvc3NpYmxlRHJvcHMuZWxlbWVudHM7XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5yZWN0c1tpXSA9IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzW2ldLmdldFJlY3QodGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50c1tpXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0RHJvcDogZnVuY3Rpb24gKGV2ZW50LCBkcmFnRWxlbWVudCkge1xuICAgICAgICB2YXIgdmFsaWREcm9wcyA9IFtdO1xuXG4gICAgICAgIGlmIChkeW5hbWljRHJvcCkge1xuICAgICAgICAgICAgdGhpcy5zZXRBY3RpdmVEcm9wcyhkcmFnRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudCAgICAgICAgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tqXSxcbiAgICAgICAgICAgICAgICBjdXJyZW50RWxlbWVudCA9IHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHMgW2pdLFxuICAgICAgICAgICAgICAgIHJlY3QgICAgICAgICAgID0gdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyAgICBbal07XG5cbiAgICAgICAgICAgIHZhbGlkRHJvcHMucHVzaChjdXJyZW50LmRyb3BDaGVjayh0aGlzLnBvaW50ZXJzWzBdLCBldmVudCwgdGhpcy50YXJnZXQsIGRyYWdFbGVtZW50LCBjdXJyZW50RWxlbWVudCwgcmVjdClcbiAgICAgICAgICAgICAgICA/IGN1cnJlbnRFbGVtZW50XG4gICAgICAgICAgICAgICAgOiBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCB0aGUgbW9zdCBhcHByb3ByaWF0ZSBkcm9wem9uZSBiYXNlZCBvbiBET00gZGVwdGggYW5kIG9yZGVyXG4gICAgICAgIHZhciBkcm9wSW5kZXggPSBpbmRleE9mRGVlcGVzdEVsZW1lbnQodmFsaWREcm9wcyksXG4gICAgICAgICAgICBkcm9wem9uZSAgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tkcm9wSW5kZXhdIHx8IG51bGwsXG4gICAgICAgICAgICBlbGVtZW50ICAgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtkcm9wSW5kZXhdIHx8IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRyb3B6b25lOiBkcm9wem9uZSxcbiAgICAgICAgICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0RHJvcEV2ZW50czogZnVuY3Rpb24gKHBvaW50ZXJFdmVudCwgZHJhZ0V2ZW50KSB7XG4gICAgICAgIHZhciBkcm9wRXZlbnRzID0ge1xuICAgICAgICAgICAgZW50ZXIgICAgIDogbnVsbCxcbiAgICAgICAgICAgIGxlYXZlICAgICA6IG51bGwsXG4gICAgICAgICAgICBhY3RpdmF0ZSAgOiBudWxsLFxuICAgICAgICAgICAgZGVhY3RpdmF0ZTogbnVsbCxcbiAgICAgICAgICAgIG1vdmUgICAgICA6IG51bGwsXG4gICAgICAgICAgICBkcm9wICAgICAgOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMuZHJvcEVsZW1lbnQgIT09IHRoaXMucHJldkRyb3BFbGVtZW50KSB7XG4gICAgICAgICAgICAvLyBpZiB0aGVyZSB3YXMgYSBwcmV2RHJvcFRhcmdldCwgY3JlYXRlIGEgZHJhZ2xlYXZlIGV2ZW50XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2RHJvcFRhcmdldCkge1xuICAgICAgICAgICAgICAgIGRyb3BFdmVudHMubGVhdmUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCAgICAgICA6IHRoaXMucHJldkRyb3BFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLnByZXZEcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICByZWxhdGVkVGFyZ2V0OiBkcmFnRXZlbnQudGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uICA6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcmFnbGVhdmUnXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGRyYWdFdmVudC5kcmFnTGVhdmUgPSB0aGlzLnByZXZEcm9wRWxlbWVudDtcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQucHJldkRyb3B6b25lID0gdGhpcy5wcmV2RHJvcFRhcmdldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHRoZSBkcm9wVGFyZ2V0IGlzIG5vdCBudWxsLCBjcmVhdGUgYSBkcmFnZW50ZXIgZXZlbnRcbiAgICAgICAgICAgIGlmICh0aGlzLmRyb3BUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICBkcm9wRXZlbnRzLmVudGVyID0ge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiB0aGlzLmRyb3BFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZSAgICA6IGRyYWdFdmVudC5pbnRlcmFjdGFibGUsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgdGltZVN0YW1wICAgIDogZHJhZ0V2ZW50LnRpbWVTdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2RyYWdlbnRlcidcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LmRyYWdFbnRlciA9IHRoaXMuZHJvcEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wVGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcgJiYgdGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLmRyb3AgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3AnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ3N0YXJ0Jykge1xuICAgICAgICAgICAgZHJvcEV2ZW50cy5hY3RpdmF0ZSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIGRyb3B6b25lICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3BhY3RpdmF0ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcpIHtcbiAgICAgICAgICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIGRyb3B6b25lICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogJ2Ryb3BkZWFjdGl2YXRlJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnbW92ZScgJiYgdGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLm1vdmUgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiB0aGlzLmRyb3BUYXJnZXQsXG4gICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgIGRyYWdFdmVudCAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgIGRyYWdtb3ZlICAgICA6IGRyYWdFdmVudCxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wbW92ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJvcEV2ZW50cztcbiAgICB9LFxuXG4gICAgY3VycmVudEFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuZHJhZ2dpbmcgJiYgJ2RyYWcnKSB8fCAodGhpcy5yZXNpemluZyAmJiAncmVzaXplJykgfHwgKHRoaXMuZ2VzdHVyaW5nICYmICdnZXN0dXJlJykgfHwgbnVsbDtcbiAgICB9LFxuXG4gICAgaW50ZXJhY3Rpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHJhZ2dpbmcgfHwgdGhpcy5yZXNpemluZyB8fCB0aGlzLmdlc3R1cmluZztcbiAgICB9LFxuXG4gICAgY2xlYXJUYXJnZXRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmRyb3BUYXJnZXQgPSB0aGlzLmRyb3BFbGVtZW50ID0gdGhpcy5wcmV2RHJvcFRhcmdldCA9IHRoaXMucHJldkRyb3BFbGVtZW50ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgICAgIGF1dG9TY3JvbGwuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gW107XG4gICAgICAgICAgICB0aGlzLm1hdGNoRWxlbWVudHMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0Lm9wdGlvbnMuc3R5bGVDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHByZXZlbnQgRGVmYXVsdCBvbmx5IGlmIHdlcmUgcHJldmlvdXNseSBpbnRlcmFjdGluZ1xuICAgICAgICAgICAgaWYgKGV2ZW50ICYmIGlzRnVuY3Rpb24oZXZlbnQucHJldmVudERlZmF1bHQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRyYWdnaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzID0gdGhpcy5hY3RpdmVEcm9wcy5yZWN0cyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2xlYXJUYXJnZXRzKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0aGlzLnNuYXBTdGF0dXMubG9ja2VkID0gdGhpcy5kcmFnZ2luZyA9IHRoaXMucmVzaXppbmcgPSB0aGlzLmdlc3R1cmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSB0aGlzLnByZXZFdmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeCA9IHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeSA9IDA7XG5cbiAgICAgICAgLy8gcmVtb3ZlIHBvaW50ZXJzIGlmIHRoZWlyIElEIGlzbid0IGluIHRoaXMucG9pbnRlcklkc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucG9pbnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpbmRleE9mKHRoaXMucG9pbnRlcklkcywgZ2V0UG9pbnRlcklkKHRoaXMucG9pbnRlcnNbaV0pKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnRlcmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGlzIGludGVyYWN0aW9uIGlmIGl0J3Mgbm90IHRoZSBvbmx5IG9uZSBvZiBpdCdzIHR5cGVcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbnNbaV0gIT09IHRoaXMgJiYgaW50ZXJhY3Rpb25zW2ldLm1vdXNlID09PSB0aGlzLm1vdXNlKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zLnNwbGljZShpbmRleE9mKGludGVyYWN0aW9ucywgdGhpcyksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluZXJ0aWFGcmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5lcnRpYVN0YXR1cyA9IHRoaXMuaW5lcnRpYVN0YXR1cyxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uaW5lcnRpYSxcbiAgICAgICAgICAgIGxhbWJkYSA9IG9wdGlvbnMucmVzaXN0YW5jZSxcbiAgICAgICAgICAgIHQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDAgLSBpbmVydGlhU3RhdHVzLnQwO1xuXG4gICAgICAgIGlmICh0IDwgaW5lcnRpYVN0YXR1cy50ZSkge1xuXG4gICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSAgMSAtIChNYXRoLmV4cCgtbGFtYmRhICogdCkgLSBpbmVydGlhU3RhdHVzLmxhbWJkYV92MCkgLyBpbmVydGlhU3RhdHVzLm9uZV92ZV92MDtcblxuICAgICAgICAgICAgaWYgKGluZXJ0aWFTdGF0dXMubW9kaWZpZWRYZSA9PT0gaW5lcnRpYVN0YXR1cy54ZSAmJiBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWUgPT09IGluZXJ0aWFTdGF0dXMueWUpIHtcbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy54ZSAqIHByb2dyZXNzO1xuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBpbmVydGlhU3RhdHVzLnllICogcHJvZ3Jlc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVhZFBvaW50ID0gZ2V0UXVhZHJhdGljQ3VydmVQb2ludChcbiAgICAgICAgICAgICAgICAgICAgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy54ZSwgaW5lcnRpYVN0YXR1cy55ZSxcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlLCBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWUsXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzKTtcblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBxdWFkUG9pbnQueDtcbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN5ID0gcXVhZFBvaW50Lnk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlck1vdmUoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLmkgPSByZXFGcmFtZSh0aGlzLmJvdW5kSW5lcnRpYUZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWGU7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN5ID0gaW5lcnRpYVN0YXR1cy5tb2RpZmllZFllO1xuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcblxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucG9pbnRlckVuZChpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc21vb3RoRW5kRnJhbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluZXJ0aWFTdGF0dXMgPSB0aGlzLmluZXJ0aWFTdGF0dXMsXG4gICAgICAgICAgICB0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBpbmVydGlhU3RhdHVzLnQwLFxuICAgICAgICAgICAgZHVyYXRpb24gPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uaW5lcnRpYS5zbW9vdGhFbmREdXJhdGlvbjtcblxuICAgICAgICBpZiAodCA8IGR1cmF0aW9uKSB7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gZWFzZU91dFF1YWQodCwgMCwgaW5lcnRpYVN0YXR1cy54ZSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IGVhc2VPdXRRdWFkKHQsIDAsIGluZXJ0aWFTdGF0dXMueWUsIGR1cmF0aW9uKTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuaSA9IHJlcUZyYW1lKHRoaXMuYm91bmRTbW9vdGhFbmRGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gaW5lcnRpYVN0YXR1cy54ZTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3kgPSBpbmVydGlhU3RhdHVzLnllO1xuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcblxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc21vb3RoRW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlckVuZChpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkUG9pbnRlcjogZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICAgICAgdmFyIGlkID0gZ2V0UG9pbnRlcklkKHBvaW50ZXIpLFxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLm1vdXNlPyAwIDogaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIGlkKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBpbmRleCA9IHRoaXMucG9pbnRlcklkcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJJZHNbaW5kZXhdID0gaWQ7XG4gICAgICAgIHRoaXMucG9pbnRlcnNbaW5kZXhdID0gcG9pbnRlcjtcblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcblxuICAgIHJlbW92ZVBvaW50ZXI6IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgICAgIHZhciBpZCA9IGdldFBvaW50ZXJJZChwb2ludGVyKSxcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IGluZGV4T2YodGhpcy5wb2ludGVySWRzLCBpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkgeyByZXR1cm47IH1cblxuICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy5wb2ludGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wb2ludGVySWRzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmRvd25UYXJnZXRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMuZG93blRpbWVzICAuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdGhpcy5ob2xkVGltZXJzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH0sXG5cbiAgICByZWNvcmRQb2ludGVyOiBmdW5jdGlvbiAocG9pbnRlcikge1xuICAgICAgICAvLyBEbyBub3QgdXBkYXRlIHBvaW50ZXJzIHdoaWxlIGluZXJ0aWEgaXMgYWN0aXZlLlxuICAgICAgICAvLyBUaGUgaW5lcnRpYSBzdGFydCBldmVudCBzaG91bGQgYmUgdGhpcy5wb2ludGVyc1swXVxuICAgICAgICBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm1vdXNlPyAwOiBpbmRleE9mKHRoaXMucG9pbnRlcklkcywgZ2V0UG9pbnRlcklkKHBvaW50ZXIpKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcnNbaW5kZXhdID0gcG9pbnRlcjtcbiAgICB9LFxuXG4gICAgY29sbGVjdEV2ZW50VGFyZ2V0czogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZXZlbnRUeXBlKSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIGdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgLy8gZG8gbm90IGZpcmUgYSB0YXAgZXZlbnQgaWYgdGhlIHBvaW50ZXIgd2FzIG1vdmVkIGJlZm9yZSBiZWluZyBsaWZ0ZWRcbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ3RhcCcgJiYgKHRoaXMucG9pbnRlcldhc01vdmVkXG4gICAgICAgICAgICAgICAgLy8gb3IgaWYgdGhlIHBvaW50ZXJ1cCB0YXJnZXQgaXMgZGlmZmVyZW50IHRvIHRoZSBwb2ludGVyZG93biB0YXJnZXRcbiAgICAgICAgICAgIHx8ICEodGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdICYmIHRoaXMuZG93blRhcmdldHNbcG9pbnRlckluZGV4XSA9PT0gZXZlbnRUYXJnZXQpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRhcmdldHMgPSBbXSxcbiAgICAgICAgICAgIGVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY29sbGVjdFNlbGVjdG9ycyAoaW50ZXJhY3RhYmxlLCBzZWxlY3RvciwgY29udGV4dCkge1xuICAgICAgICAgICAgdmFyIGVscyA9IGllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgID8gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlLl9pRXZlbnRzW2V2ZW50VHlwZV1cbiAgICAgICAgICAgICAgICAmJiBpc0VsZW1lbnQoZWxlbWVudClcbiAgICAgICAgICAgICAgICAmJiBpbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuICAgICAgICAgICAgICAgICYmICF0ZXN0SWdub3JlKGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgdGVzdEFsbG93KGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgbWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yLCBlbHMpKSB7XG5cbiAgICAgICAgICAgICAgICB0YXJnZXRzLnB1c2goaW50ZXJhY3RhYmxlKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdC5pc1NldChlbGVtZW50KSAmJiBpbnRlcmFjdChlbGVtZW50KS5faUV2ZW50c1tldmVudFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKGludGVyYWN0KGVsZW1lbnQpKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnRlcmFjdGFibGVzLmZvckVhY2hTZWxlY3Rvcihjb2xsZWN0U2VsZWN0b3JzKTtcblxuICAgICAgICAgICAgZWxlbWVudCA9IHBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjcmVhdGUgdGhlIHRhcCBldmVudCBldmVuIGlmIHRoZXJlIGFyZSBubyBsaXN0ZW5lcnMgc28gdGhhdFxuICAgICAgICAvLyBkb3VibGV0YXAgY2FuIHN0aWxsIGJlIGNyZWF0ZWQgYW5kIGZpcmVkXG4gICAgICAgIGlmICh0YXJnZXRzLmxlbmd0aCB8fCBldmVudFR5cGUgPT09ICd0YXAnKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmVQb2ludGVycyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRhcmdldHMsIGVsZW1lbnRzLCBldmVudFR5cGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZpcmVQb2ludGVyczogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgdGFyZ2V0cywgZWxlbWVudHMsIGV2ZW50VHlwZSkge1xuICAgICAgICB2YXIgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IGluZGV4T2YoZ2V0UG9pbnRlcklkKHBvaW50ZXIpKSxcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudCA9IHt9LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgLy8gZm9yIHRhcCBldmVudHNcbiAgICAgICAgICAgIGludGVydmFsLCBjcmVhdGVOZXdEb3VibGVUYXA7XG5cbiAgICAgICAgLy8gaWYgaXQncyBhIGRvdWJsZXRhcCB0aGVuIHRoZSBldmVudCBwcm9wZXJ0aWVzIHdvdWxkIGhhdmUgYmVlblxuICAgICAgICAvLyBjb3BpZWQgZnJvbSB0aGUgdGFwIGV2ZW50IGFuZCBwcm92aWRlZCBhcyB0aGUgcG9pbnRlciBhcmd1bWVudFxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnZG91YmxldGFwJykge1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50ID0gcG9pbnRlcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGV4dGVuZChwb2ludGVyRXZlbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChldmVudCAhPT0gcG9pbnRlcikge1xuICAgICAgICAgICAgICAgIGV4dGVuZChwb2ludGVyRXZlbnQsIHBvaW50ZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb2ludGVyRXZlbnQucHJldmVudERlZmF1bHQgICAgICAgICAgID0gcHJldmVudE9yaWdpbmFsRGVmYXVsdDtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5zdG9wUHJvcGFnYXRpb24gICAgICAgICAgPSBJbnRlcmFjdEV2ZW50LnByb3RvdHlwZS5zdG9wUHJvcGFnYXRpb247XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gSW50ZXJhY3RFdmVudC5wcm90b3R5cGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LmludGVyYWN0aW9uICAgICAgICAgICAgICA9IHRoaXM7XG5cbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC50aW1lU3RhbXAgICAgID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQub3JpZ2luYWxFdmVudCA9IGV2ZW50O1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnR5cGUgICAgICAgICAgPSBldmVudFR5cGU7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQucG9pbnRlcklkICAgICA9IGdldFBvaW50ZXJJZChwb2ludGVyKTtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5wb2ludGVyVHlwZSAgID0gdGhpcy5tb3VzZT8gJ21vdXNlJyA6ICFzdXBwb3J0c1BvaW50ZXJFdmVudD8gJ3RvdWNoJ1xuICAgICAgICAgICAgICAgIDogaXNTdHJpbmcocG9pbnRlci5wb2ludGVyVHlwZSlcbiAgICAgICAgICAgICAgICA/IHBvaW50ZXIucG9pbnRlclR5cGVcbiAgICAgICAgICAgICAgICA6IFssLCd0b3VjaCcsICdwZW4nLCAnbW91c2UnXVtwb2ludGVyLnBvaW50ZXJUeXBlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICd0YXAnKSB7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuZHQgPSBwb2ludGVyRXZlbnQudGltZVN0YW1wIC0gdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XTtcblxuICAgICAgICAgICAgaW50ZXJ2YWwgPSBwb2ludGVyRXZlbnQudGltZVN0YW1wIC0gdGhpcy50YXBUaW1lO1xuICAgICAgICAgICAgY3JlYXRlTmV3RG91YmxlVGFwID0gISEodGhpcy5wcmV2VGFwICYmIHRoaXMucHJldlRhcC50eXBlICE9PSAnZG91YmxldGFwJ1xuICAgICAgICAgICAgJiYgdGhpcy5wcmV2VGFwLnRhcmdldCA9PT0gcG9pbnRlckV2ZW50LnRhcmdldFxuICAgICAgICAgICAgJiYgaW50ZXJ2YWwgPCA1MDApO1xuXG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuZG91YmxlID0gY3JlYXRlTmV3RG91YmxlVGFwO1xuXG4gICAgICAgICAgICB0aGlzLnRhcFRpbWUgPSBwb2ludGVyRXZlbnQudGltZVN0YW1wO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhcmdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5jdXJyZW50VGFyZ2V0ID0gZWxlbWVudHNbaV07XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuaW50ZXJhY3RhYmxlID0gdGFyZ2V0c1tpXTtcbiAgICAgICAgICAgIHRhcmdldHNbaV0uZmlyZShwb2ludGVyRXZlbnQpO1xuXG4gICAgICAgICAgICBpZiAocG9pbnRlckV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZFxuICAgICAgICAgICAgICAgIHx8KHBvaW50ZXJFdmVudC5wcm9wYWdhdGlvblN0b3BwZWQgJiYgZWxlbWVudHNbaSArIDFdICE9PSBwb2ludGVyRXZlbnQuY3VycmVudFRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjcmVhdGVOZXdEb3VibGVUYXApIHtcbiAgICAgICAgICAgIHZhciBkb3VibGVUYXAgPSB7fTtcblxuICAgICAgICAgICAgZXh0ZW5kKGRvdWJsZVRhcCwgcG9pbnRlckV2ZW50KTtcblxuICAgICAgICAgICAgZG91YmxlVGFwLmR0ICAgPSBpbnRlcnZhbDtcbiAgICAgICAgICAgIGRvdWJsZVRhcC50eXBlID0gJ2RvdWJsZXRhcCc7XG5cbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhkb3VibGVUYXAsIGV2ZW50LCBldmVudFRhcmdldCwgJ2RvdWJsZXRhcCcpO1xuXG4gICAgICAgICAgICB0aGlzLnByZXZUYXAgPSBkb3VibGVUYXA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXZlbnRUeXBlID09PSAndGFwJykge1xuICAgICAgICAgICAgdGhpcy5wcmV2VGFwID0gcG9pbnRlckV2ZW50O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHZhbGlkYXRlU2VsZWN0b3I6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgbWF0Y2hlcywgbWF0Y2hFbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbWF0Y2hlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gbWF0Y2hlc1tpXSxcbiAgICAgICAgICAgICAgICBtYXRjaEVsZW1lbnQgPSBtYXRjaEVsZW1lbnRzW2ldLFxuICAgICAgICAgICAgICAgIGFjdGlvbiA9IHZhbGlkYXRlQWN0aW9uKG1hdGNoLmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgbWF0Y2hFbGVtZW50KSwgbWF0Y2gpO1xuXG4gICAgICAgICAgICBpZiAoYWN0aW9uICYmIHdpdGhpbkludGVyYWN0aW9uTGltaXQobWF0Y2gsIG1hdGNoRWxlbWVudCwgYWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gbWF0Y2g7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gbWF0Y2hFbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRTbmFwcGluZzogZnVuY3Rpb24gKHBhZ2VDb29yZHMsIHN0YXR1cykge1xuICAgICAgICB2YXIgc25hcCA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5zbmFwLFxuICAgICAgICAgICAgdGFyZ2V0cyA9IFtdLFxuICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgc3RhdHVzID0gc3RhdHVzIHx8IHRoaXMuc25hcFN0YXR1cztcblxuICAgICAgICBpZiAoc3RhdHVzLnVzZVN0YXR1c1hZKSB7XG4gICAgICAgICAgICBwYWdlID0geyB4OiBzdGF0dXMueCwgeTogc3RhdHVzLnkgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBvcmlnaW4gPSBnZXRPcmlnaW5YWSh0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgcGFnZSA9IGV4dGVuZCh7fSwgcGFnZUNvb3Jkcyk7XG5cbiAgICAgICAgICAgIHBhZ2UueCAtPSBvcmlnaW4ueDtcbiAgICAgICAgICAgIHBhZ2UueSAtPSBvcmlnaW4ueTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cy5yZWFsWCA9IHBhZ2UueDtcbiAgICAgICAgc3RhdHVzLnJlYWxZID0gcGFnZS55O1xuXG4gICAgICAgIHBhZ2UueCA9IHBhZ2UueCAtIHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeDtcbiAgICAgICAgcGFnZS55ID0gcGFnZS55IC0gdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR5O1xuXG4gICAgICAgIHZhciBsZW4gPSBzbmFwLnRhcmdldHM/IHNuYXAudGFyZ2V0cy5sZW5ndGggOiAwO1xuXG4gICAgICAgIGZvciAodmFyIHJlbEluZGV4ID0gMDsgcmVsSW5kZXggPCB0aGlzLnNuYXBPZmZzZXRzLmxlbmd0aDsgcmVsSW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHJlbGF0aXZlID0ge1xuICAgICAgICAgICAgICAgIHg6IHBhZ2UueCAtIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLngsXG4gICAgICAgICAgICAgICAgeTogcGFnZS55IC0gdGhpcy5zbmFwT2Zmc2V0c1tyZWxJbmRleF0ueVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24oc25hcC50YXJnZXRzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBzbmFwLnRhcmdldHNbaV0ocmVsYXRpdmUueCwgcmVsYXRpdmUueSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBzbmFwLnRhcmdldHNbaV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgICAgIHRhcmdldHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IGlzTnVtYmVyKHRhcmdldC54KSA/ICh0YXJnZXQueCArIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLngpIDogcmVsYXRpdmUueCxcbiAgICAgICAgICAgICAgICAgICAgeTogaXNOdW1iZXIodGFyZ2V0LnkpID8gKHRhcmdldC55ICsgdGhpcy5zbmFwT2Zmc2V0c1tyZWxJbmRleF0ueSkgOiByZWxhdGl2ZS55LFxuXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBpc051bWJlcih0YXJnZXQucmFuZ2UpPyB0YXJnZXQucmFuZ2U6IHNuYXAucmFuZ2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjbG9zZXN0ID0ge1xuICAgICAgICAgICAgdGFyZ2V0OiBudWxsLFxuICAgICAgICAgICAgaW5SYW5nZTogZmFsc2UsXG4gICAgICAgICAgICBkaXN0YW5jZTogMCxcbiAgICAgICAgICAgIHJhbmdlOiAwLFxuICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICBkeTogMFxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHRhcmdldHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldHNbaV07XG5cbiAgICAgICAgICAgIHZhciByYW5nZSA9IHRhcmdldC5yYW5nZSxcbiAgICAgICAgICAgICAgICBkeCA9IHRhcmdldC54IC0gcGFnZS54LFxuICAgICAgICAgICAgICAgIGR5ID0gdGFyZ2V0LnkgLSBwYWdlLnksXG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBoeXBvdChkeCwgZHkpLFxuICAgICAgICAgICAgICAgIGluUmFuZ2UgPSBkaXN0YW5jZSA8PSByYW5nZTtcblxuICAgICAgICAgICAgLy8gSW5maW5pdGUgdGFyZ2V0cyBjb3VudCBhcyBiZWluZyBvdXQgb2YgcmFuZ2VcbiAgICAgICAgICAgIC8vIGNvbXBhcmVkIHRvIG5vbiBpbmZpbml0ZSBvbmVzIHRoYXQgYXJlIGluIHJhbmdlXG4gICAgICAgICAgICBpZiAocmFuZ2UgPT09IEluZmluaXR5ICYmIGNsb3Nlc3QuaW5SYW5nZSAmJiBjbG9zZXN0LnJhbmdlICE9PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgIGluUmFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjbG9zZXN0LnRhcmdldCB8fCAoaW5SYW5nZVxuICAgICAgICAgICAgICAgICAgICAvLyBpcyB0aGUgY2xvc2VzdCB0YXJnZXQgaW4gcmFuZ2U/XG4gICAgICAgICAgICAgICAgICAgID8gKGNsb3Nlc3QuaW5SYW5nZSAmJiByYW5nZSAhPT0gSW5maW5pdHlcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHBvaW50ZXIgaXMgcmVsYXRpdmVseSBkZWVwZXIgaW4gdGhpcyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgPyBkaXN0YW5jZSAvIHJhbmdlIDwgY2xvc2VzdC5kaXN0YW5jZSAvIGNsb3Nlc3QucmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB0YXJnZXQgaGFzIEluZmluaXRlIHJhbmdlIGFuZCB0aGUgY2xvc2VzdCBkb2Vzbid0XG4gICAgICAgICAgICAgICAgICAgIDogKHJhbmdlID09PSBJbmZpbml0eSAmJiBjbG9zZXN0LnJhbmdlICE9PSBJbmZpbml0eSlcbiAgICAgICAgICAgICAgICAgICAgLy8gT1IgdGhpcyB0YXJnZXQgaXMgY2xvc2VyIHRoYXQgdGhlIHByZXZpb3VzIGNsb3Nlc3RcbiAgICAgICAgICAgICAgICB8fCBkaXN0YW5jZSA8IGNsb3Nlc3QuZGlzdGFuY2UpXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBvdGhlciBpcyBub3QgaW4gcmFuZ2UgYW5kIHRoZSBwb2ludGVyIGlzIGNsb3NlciB0byB0aGlzIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICA6ICghY2xvc2VzdC5pblJhbmdlICYmIGRpc3RhbmNlIDwgY2xvc2VzdC5kaXN0YW5jZSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAocmFuZ2UgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgIGluUmFuZ2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNsb3Nlc3QudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QuZGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LnJhbmdlID0gcmFuZ2U7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5pblJhbmdlID0gaW5SYW5nZTtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LmR4ID0gZHg7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5keSA9IGR5O1xuXG4gICAgICAgICAgICAgICAgc3RhdHVzLnJhbmdlID0gcmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc25hcENoYW5nZWQ7XG5cbiAgICAgICAgaWYgKGNsb3Nlc3QudGFyZ2V0KSB7XG4gICAgICAgICAgICBzbmFwQ2hhbmdlZCA9IChzdGF0dXMuc25hcHBlZFggIT09IGNsb3Nlc3QudGFyZ2V0LnggfHwgc3RhdHVzLnNuYXBwZWRZICE9PSBjbG9zZXN0LnRhcmdldC55KTtcblxuICAgICAgICAgICAgc3RhdHVzLnNuYXBwZWRYID0gY2xvc2VzdC50YXJnZXQueDtcbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWSA9IGNsb3Nlc3QudGFyZ2V0Lnk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzbmFwQ2hhbmdlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWCA9IE5hTjtcbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWSA9IE5hTjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cy5keCA9IGNsb3Nlc3QuZHg7XG4gICAgICAgIHN0YXR1cy5keSA9IGNsb3Nlc3QuZHk7XG5cbiAgICAgICAgc3RhdHVzLmNoYW5nZWQgPSAoc25hcENoYW5nZWQgfHwgKGNsb3Nlc3QuaW5SYW5nZSAmJiAhc3RhdHVzLmxvY2tlZCkpO1xuICAgICAgICBzdGF0dXMubG9ja2VkID0gY2xvc2VzdC5pblJhbmdlO1xuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIHNldFJlc3RyaWN0aW9uOiBmdW5jdGlvbiAocGFnZUNvb3Jkcywgc3RhdHVzKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIHJlc3RyaWN0ID0gdGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0ucmVzdHJpY3QsXG4gICAgICAgICAgICByZXN0cmljdGlvbiA9IHJlc3RyaWN0ICYmIHJlc3RyaWN0LnJlc3RyaWN0aW9uLFxuICAgICAgICAgICAgcGFnZTtcblxuICAgICAgICBpZiAoIXJlc3RyaWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzID0gc3RhdHVzIHx8IHRoaXMucmVzdHJpY3RTdGF0dXM7XG5cbiAgICAgICAgcGFnZSA9IHN0YXR1cy51c2VTdGF0dXNYWVxuICAgICAgICAgICAgPyBwYWdlID0geyB4OiBzdGF0dXMueCwgeTogc3RhdHVzLnkgfVxuICAgICAgICAgICAgOiBwYWdlID0gZXh0ZW5kKHt9LCBwYWdlQ29vcmRzKTtcblxuICAgICAgICBpZiAoc3RhdHVzLnNuYXAgJiYgc3RhdHVzLnNuYXAubG9ja2VkKSB7XG4gICAgICAgICAgICBwYWdlLnggKz0gc3RhdHVzLnNuYXAuZHggfHwgMDtcbiAgICAgICAgICAgIHBhZ2UueSArPSBzdGF0dXMuc25hcC5keSB8fCAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFnZS54IC09IHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeDtcbiAgICAgICAgcGFnZS55IC09IHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeTtcblxuICAgICAgICBzdGF0dXMuZHggPSAwO1xuICAgICAgICBzdGF0dXMuZHkgPSAwO1xuICAgICAgICBzdGF0dXMucmVzdHJpY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgIHZhciByZWN0LCByZXN0cmljdGVkWCwgcmVzdHJpY3RlZFk7XG5cbiAgICAgICAgaWYgKGlzU3RyaW5nKHJlc3RyaWN0aW9uKSkge1xuICAgICAgICAgICAgaWYgKHJlc3RyaWN0aW9uID09PSAncGFyZW50Jykge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gcGFyZW50RWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocmVzdHJpY3Rpb24gPT09ICdzZWxmJykge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gdGFyZ2V0LmdldFJlY3QodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gY2xvc2VzdCh0aGlzLmVsZW1lbnQsIHJlc3RyaWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFyZXN0cmljdGlvbikgeyByZXR1cm4gc3RhdHVzOyB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNGdW5jdGlvbihyZXN0cmljdGlvbikpIHtcbiAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gcmVzdHJpY3Rpb24ocGFnZS54LCBwYWdlLnksIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNFbGVtZW50KHJlc3RyaWN0aW9uKSkge1xuICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSBnZXRFbGVtZW50UmVjdChyZXN0cmljdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICByZWN0ID0gcmVzdHJpY3Rpb247XG5cbiAgICAgICAgaWYgKCFyZXN0cmljdGlvbikge1xuICAgICAgICAgICAgcmVzdHJpY3RlZFggPSBwYWdlLng7XG4gICAgICAgICAgICByZXN0cmljdGVkWSA9IHBhZ2UueTtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgaXMgYXNzdW1lZCB0byBoYXZlXG4gICAgICAgIC8vIHgsIHksIHdpZHRoLCBoZWlnaHQgb3JcbiAgICAgICAgLy8gbGVmdCwgdG9wLCByaWdodCwgYm90dG9tXG4gICAgICAgIGVsc2UgaWYgKCd4JyBpbiByZXN0cmljdGlvbiAmJiAneScgaW4gcmVzdHJpY3Rpb24pIHtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRYID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC54ICsgcmVjdC53aWR0aCAgLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnJpZ2h0ICwgcGFnZS54KSwgcmVjdC54ICsgdGhpcy5yZXN0cmljdE9mZnNldC5sZWZ0KTtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRZID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC55ICsgcmVjdC5oZWlnaHQgLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSwgcGFnZS55KSwgcmVjdC55ICsgdGhpcy5yZXN0cmljdE9mZnNldC50b3AgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRYID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC5yaWdodCAgLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnJpZ2h0ICwgcGFnZS54KSwgcmVjdC5sZWZ0ICsgdGhpcy5yZXN0cmljdE9mZnNldC5sZWZ0KTtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRZID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC5ib3R0b20gLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSwgcGFnZS55KSwgcmVjdC50b3AgICsgdGhpcy5yZXN0cmljdE9mZnNldC50b3AgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cy5keCA9IHJlc3RyaWN0ZWRYIC0gcGFnZS54O1xuICAgICAgICBzdGF0dXMuZHkgPSByZXN0cmljdGVkWSAtIHBhZ2UueTtcblxuICAgICAgICBzdGF0dXMuY2hhbmdlZCA9IHN0YXR1cy5yZXN0cmljdGVkWCAhPT0gcmVzdHJpY3RlZFggfHwgc3RhdHVzLnJlc3RyaWN0ZWRZICE9PSByZXN0cmljdGVkWTtcbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWQgPSAhIShzdGF0dXMuZHggfHwgc3RhdHVzLmR5KTtcblxuICAgICAgICBzdGF0dXMucmVzdHJpY3RlZFggPSByZXN0cmljdGVkWDtcbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWRZID0gcmVzdHJpY3RlZFk7XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2hlY2tBbmRQcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24gKGV2ZW50LCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKCEoaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlIHx8IHRoaXMudGFyZ2V0KSkgeyByZXR1cm47IH1cblxuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zLFxuICAgICAgICAgICAgcHJldmVudCA9IG9wdGlvbnMucHJldmVudERlZmF1bHQ7XG5cbiAgICAgICAgaWYgKHByZXZlbnQgPT09ICdhdXRvJyAmJiBlbGVtZW50ICYmICEvXihpbnB1dHxzZWxlY3R8dGV4dGFyZWEpJC9pLnRlc3QoZXZlbnQudGFyZ2V0Lm5vZGVOYW1lKSkge1xuICAgICAgICAgICAgLy8gZG8gbm90IHByZXZlbnREZWZhdWx0IG9uIHBvaW50ZXJkb3duIGlmIHRoZSBwcmVwYXJlZCBhY3Rpb24gaXMgYSBkcmFnXG4gICAgICAgICAgICAvLyBhbmQgZHJhZ2dpbmcgY2FuIG9ubHkgc3RhcnQgZnJvbSBhIGNlcnRhaW4gZGlyZWN0aW9uIC0gdGhpcyBhbGxvd3NcbiAgICAgICAgICAgIC8vIGEgdG91Y2ggdG8gcGFuIHRoZSB2aWV3cG9ydCBpZiBhIGRyYWcgaXNuJ3QgaW4gdGhlIHJpZ2h0IGRpcmVjdGlvblxuICAgICAgICAgICAgaWYgKC9kb3dufHN0YXJ0L2kudGVzdChldmVudC50eXBlKVxuICAgICAgICAgICAgICAgICYmIHRoaXMucHJlcGFyZWQubmFtZSA9PT0gJ2RyYWcnICYmIG9wdGlvbnMuZHJhZy5heGlzICE9PSAneHknKSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHdpdGggbWFudWFsU3RhcnQsIG9ubHkgcHJldmVudERlZmF1bHQgd2hpbGUgaW50ZXJhY3RpbmdcbiAgICAgICAgICAgIGlmIChvcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0gJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgJiYgIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmV2ZW50ID09PSAnYWx3YXlzJykge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjYWxjSW5lcnRpYTogZnVuY3Rpb24gKHN0YXR1cykge1xuICAgICAgICB2YXIgaW5lcnRpYU9wdGlvbnMgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uaW5lcnRpYSxcbiAgICAgICAgICAgIGxhbWJkYSA9IGluZXJ0aWFPcHRpb25zLnJlc2lzdGFuY2UsXG4gICAgICAgICAgICBpbmVydGlhRHVyID0gLU1hdGgubG9nKGluZXJ0aWFPcHRpb25zLmVuZFNwZWVkIC8gc3RhdHVzLnYwKSAvIGxhbWJkYTtcblxuICAgICAgICBzdGF0dXMueDAgPSB0aGlzLnByZXZFdmVudC5wYWdlWDtcbiAgICAgICAgc3RhdHVzLnkwID0gdGhpcy5wcmV2RXZlbnQucGFnZVk7XG4gICAgICAgIHN0YXR1cy50MCA9IHN0YXR1cy5zdGFydEV2ZW50LnRpbWVTdGFtcCAvIDEwMDA7XG4gICAgICAgIHN0YXR1cy5zeCA9IHN0YXR1cy5zeSA9IDA7XG5cbiAgICAgICAgc3RhdHVzLm1vZGlmaWVkWGUgPSBzdGF0dXMueGUgPSAoc3RhdHVzLnZ4MCAtIGluZXJ0aWFEdXIpIC8gbGFtYmRhO1xuICAgICAgICBzdGF0dXMubW9kaWZpZWRZZSA9IHN0YXR1cy55ZSA9IChzdGF0dXMudnkwIC0gaW5lcnRpYUR1cikgLyBsYW1iZGE7XG4gICAgICAgIHN0YXR1cy50ZSA9IGluZXJ0aWFEdXI7XG5cbiAgICAgICAgc3RhdHVzLmxhbWJkYV92MCA9IGxhbWJkYSAvIHN0YXR1cy52MDtcbiAgICAgICAgc3RhdHVzLm9uZV92ZV92MCA9IDEgLSBpbmVydGlhT3B0aW9ucy5lbmRTcGVlZCAvIHN0YXR1cy52MDtcbiAgICB9LFxuXG4gICAgYXV0b1Njcm9sbE1vdmU6IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgICAgIGlmICghKHRoaXMuaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgJiYgY2hlY2tBdXRvU2Nyb2xsKHRoaXMudGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUpIHtcbiAgICAgICAgICAgIGF1dG9TY3JvbGwueCA9IGF1dG9TY3JvbGwueSA9IDA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9wLFxuICAgICAgICAgICAgcmlnaHQsXG4gICAgICAgICAgICBib3R0b20sXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5hdXRvU2Nyb2xsLFxuICAgICAgICAgICAgY29udGFpbmVyID0gb3B0aW9ucy5jb250YWluZXIgfHwgZ2V0V2luZG93KHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKGlzV2luZG93KGNvbnRhaW5lcikpIHtcbiAgICAgICAgICAgIGxlZnQgICA9IHBvaW50ZXIuY2xpZW50WCA8IGF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgdG9wICAgID0gcG9pbnRlci5jbGllbnRZIDwgYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICByaWdodCAgPSBwb2ludGVyLmNsaWVudFggPiBjb250YWluZXIuaW5uZXJXaWR0aCAgLSBhdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIGJvdHRvbSA9IHBvaW50ZXIuY2xpZW50WSA+IGNvbnRhaW5lci5pbm5lckhlaWdodCAtIGF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlY3QgPSBnZXRFbGVtZW50UmVjdChjb250YWluZXIpO1xuXG4gICAgICAgICAgICBsZWZ0ICAgPSBwb2ludGVyLmNsaWVudFggPCByZWN0LmxlZnQgICArIGF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgdG9wICAgID0gcG9pbnRlci5jbGllbnRZIDwgcmVjdC50b3AgICAgKyBhdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIHJpZ2h0ICA9IHBvaW50ZXIuY2xpZW50WCA+IHJlY3QucmlnaHQgIC0gYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICBib3R0b20gPSBwb2ludGVyLmNsaWVudFkgPiByZWN0LmJvdHRvbSAtIGF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV0b1Njcm9sbC54ID0gKHJpZ2h0ID8gMTogbGVmdD8gLTE6IDApO1xuICAgICAgICBhdXRvU2Nyb2xsLnkgPSAoYm90dG9tPyAxOiAgdG9wPyAtMTogMCk7XG5cbiAgICAgICAgaWYgKCFhdXRvU2Nyb2xsLmlzU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICAvLyBzZXQgdGhlIGF1dG9TY3JvbGwgcHJvcGVydGllcyB0byB0aG9zZSBvZiB0aGUgdGFyZ2V0XG4gICAgICAgICAgICBhdXRvU2Nyb2xsLm1hcmdpbiA9IG9wdGlvbnMubWFyZ2luO1xuICAgICAgICAgICAgYXV0b1Njcm9sbC5zcGVlZCAgPSBvcHRpb25zLnNwZWVkO1xuXG4gICAgICAgICAgICBhdXRvU2Nyb2xsLnN0YXJ0KHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF91cGRhdGVFdmVudFRhcmdldHM6IGZ1bmN0aW9uICh0YXJnZXQsIGN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRUYXJnZXQgICAgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMuX2N1ckV2ZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldDtcbiAgICB9XG5cbn07XG5cbmZ1bmN0aW9uIGdldEludGVyYWN0aW9uRnJvbVBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50VHlwZSwgZXZlbnRUYXJnZXQpIHtcbiAgICB2YXIgaSA9IDAsIGxlbiA9IGludGVyYWN0aW9ucy5sZW5ndGgsXG4gICAgICAgIG1vdXNlRXZlbnQgPSAoL21vdXNlL2kudGVzdChwb2ludGVyLnBvaW50ZXJUeXBlIHx8IGV2ZW50VHlwZSlcbiAgICAgICAgICAgIC8vIE1TUG9pbnRlckV2ZW50Lk1TUE9JTlRFUl9UWVBFX01PVVNFXG4gICAgICAgIHx8IHBvaW50ZXIucG9pbnRlclR5cGUgPT09IDQpLFxuICAgICAgICBpbnRlcmFjdGlvbjtcblxuICAgIHZhciBpZCA9IGdldFBvaW50ZXJJZChwb2ludGVyKTtcblxuICAgIC8vIHRyeSB0byByZXN1bWUgaW5lcnRpYSB3aXRoIGEgbmV3IHBvaW50ZXJcbiAgICBpZiAoL2Rvd258c3RhcnQvaS50ZXN0KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uc1tpXTtcblxuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBldmVudFRhcmdldDtcblxuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuYWN0aXZlICYmIGludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zW2ludGVyYWN0aW9uLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEuYWxsb3dSZXN1bWVcbiAgICAgICAgICAgICAgICAmJiAoaW50ZXJhY3Rpb24ubW91c2UgPT09IG1vdXNlRXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIGVsZW1lbnQgaXMgdGhlIGludGVyYWN0aW9uIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT09IGludGVyYWN0aW9uLmVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW50ZXJhY3Rpb24ncyBwb2ludGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyKGludGVyYWN0aW9uLnBvaW50ZXJzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLmFkZFBvaW50ZXIocG9pbnRlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gcGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiBpdCdzIGEgbW91c2UgaW50ZXJhY3Rpb25cbiAgICBpZiAobW91c2VFdmVudCB8fCAhKHN1cHBvcnRzVG91Y2ggfHwgc3VwcG9ydHNQb2ludGVyRXZlbnQpKSB7XG5cbiAgICAgICAgLy8gZmluZCBhIG1vdXNlIGludGVyYWN0aW9uIHRoYXQncyBub3QgaW4gaW5lcnRpYSBwaGFzZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbnNbaV0ubW91c2UgJiYgIWludGVyYWN0aW9uc1tpXS5pbmVydGlhU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvbnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmaW5kIGFueSBpbnRlcmFjdGlvbiBzcGVjaWZpY2FsbHkgZm9yIG1vdXNlLlxuICAgICAgICAvLyBpZiB0aGUgZXZlbnRUeXBlIGlzIGEgbW91c2Vkb3duLCBhbmQgaW5lcnRpYSBpcyBhY3RpdmVcbiAgICAgICAgLy8gaWdub3JlIHRoZSBpbnRlcmFjdGlvblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbnNbaV0ubW91c2UgJiYgISgvZG93bi8udGVzdChldmVudFR5cGUpICYmIGludGVyYWN0aW9uc1tpXS5pbmVydGlhU3RhdHVzLmFjdGl2ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgaW50ZXJhY3Rpb24gZm9yIG1vdXNlXG4gICAgICAgIGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKCk7XG4gICAgICAgIGludGVyYWN0aW9uLm1vdXNlID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb247XG4gICAgfVxuXG4gICAgLy8gZ2V0IGludGVyYWN0aW9uIHRoYXQgaGFzIHRoaXMgcG9pbnRlclxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoY29udGFpbnMoaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJJZHMsIGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGF0IHRoaXMgc3RhZ2UsIGEgcG9pbnRlclVwIHNob3VsZCBub3QgcmV0dXJuIGFuIGludGVyYWN0aW9uXG4gICAgaWYgKC91cHxlbmR8b3V0L2kudGVzdChldmVudFR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIGdldCBmaXJzdCBpZGxlIGludGVyYWN0aW9uXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGludGVyYWN0aW9uID0gaW50ZXJhY3Rpb25zW2ldO1xuXG4gICAgICAgIGlmICgoIWludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgfHwgKGludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zLmdlc3R1cmUuZW5hYmxlZCkpXG4gICAgICAgICAgICAmJiAhaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgJiYgISghbW91c2VFdmVudCAmJiBpbnRlcmFjdGlvbi5tb3VzZSkpIHtcblxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJbnRlcmFjdGlvbigpO1xufVxuXG5mdW5jdGlvbiBkb09uSW50ZXJhY3Rpb25zIChtZXRob2QpIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgaW50ZXJhY3Rpb24sXG4gICAgICAgICAgICBldmVudFRhcmdldCA9IGdldEFjdHVhbEVsZW1lbnQoZXZlbnQucGF0aFxuICAgICAgICAgICAgICAgID8gZXZlbnQucGF0aFswXVxuICAgICAgICAgICAgICAgIDogZXZlbnQudGFyZ2V0KSxcbiAgICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0ID0gZ2V0QWN0dWFsRWxlbWVudChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgaWYgKHN1cHBvcnRzVG91Y2ggJiYgL3RvdWNoLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICBwcmV2VG91Y2hUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwb2ludGVyID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG5cbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uRnJvbVBvaW50ZXIocG9pbnRlciwgZXZlbnQudHlwZSwgZXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpbnRlcmFjdGlvbikgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uX3VwZGF0ZUV2ZW50VGFyZ2V0cyhldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25bbWV0aG9kXShwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghc3VwcG9ydHNQb2ludGVyRXZlbnQgJiYgL21vdXNlLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgLy8gaWdub3JlIG1vdXNlIGV2ZW50cyB3aGlsZSB0b3VjaCBpbnRlcmFjdGlvbnMgYXJlIGFjdGl2ZVxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnRlcmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnRlcmFjdGlvbnNbaV0ubW91c2UgJiYgaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJJc0Rvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHRyeSB0byBpZ25vcmUgbW91c2UgZXZlbnRzIHRoYXQgYXJlIHNpbXVsYXRlZCBieSB0aGUgYnJvd3NlclxuICAgICAgICAgICAgICAgIC8vIGFmdGVyIGEgdG91Y2ggZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBwcmV2VG91Y2hUaW1lIDwgNTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb25Gcm9tUG9pbnRlcihldmVudCwgZXZlbnQudHlwZSwgZXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICBpZiAoIWludGVyYWN0aW9uKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICBpbnRlcmFjdGlvbi5fdXBkYXRlRXZlbnRUYXJnZXRzKGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgIGludGVyYWN0aW9uW21ldGhvZF0oZXZlbnQsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIEludGVyYWN0RXZlbnQgKGludGVyYWN0aW9uLCBldmVudCwgYWN0aW9uLCBwaGFzZSwgZWxlbWVudCwgcmVsYXRlZCkge1xuICAgIHZhciBjbGllbnQsXG4gICAgICAgIHBhZ2UsXG4gICAgICAgIHRhcmdldCAgICAgID0gaW50ZXJhY3Rpb24udGFyZ2V0LFxuICAgICAgICBzbmFwU3RhdHVzICA9IGludGVyYWN0aW9uLnNuYXBTdGF0dXMsXG4gICAgICAgIHJlc3RyaWN0U3RhdHVzICA9IGludGVyYWN0aW9uLnJlc3RyaWN0U3RhdHVzLFxuICAgICAgICBwb2ludGVycyAgICA9IGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgICBkZWx0YVNvdXJjZSA9ICh0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMgfHwgZGVmYXVsdE9wdGlvbnMpLmRlbHRhU291cmNlLFxuICAgICAgICBzb3VyY2VYICAgICA9IGRlbHRhU291cmNlICsgJ1gnLFxuICAgICAgICBzb3VyY2VZICAgICA9IGRlbHRhU291cmNlICsgJ1knLFxuICAgICAgICBvcHRpb25zICAgICA9IHRhcmdldD8gdGFyZ2V0Lm9wdGlvbnM6IGRlZmF1bHRPcHRpb25zLFxuICAgICAgICBvcmlnaW4gICAgICA9IGdldE9yaWdpblhZKHRhcmdldCwgZWxlbWVudCksXG4gICAgICAgIHN0YXJ0aW5nICAgID0gcGhhc2UgPT09ICdzdGFydCcsXG4gICAgICAgIGVuZGluZyAgICAgID0gcGhhc2UgPT09ICdlbmQnLFxuICAgICAgICBjb29yZHMgICAgICA9IHN0YXJ0aW5nPyBpbnRlcmFjdGlvbi5zdGFydENvb3JkcyA6IGludGVyYWN0aW9uLmN1ckNvb3JkcztcblxuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IGludGVyYWN0aW9uLmVsZW1lbnQ7XG5cbiAgICBwYWdlICAgPSBleHRlbmQoe30sIGNvb3Jkcy5wYWdlKTtcbiAgICBjbGllbnQgPSBleHRlbmQoe30sIGNvb3Jkcy5jbGllbnQpO1xuXG4gICAgcGFnZS54IC09IG9yaWdpbi54O1xuICAgIHBhZ2UueSAtPSBvcmlnaW4ueTtcblxuICAgIGNsaWVudC54IC09IG9yaWdpbi54O1xuICAgIGNsaWVudC55IC09IG9yaWdpbi55O1xuXG4gICAgdmFyIHJlbGF0aXZlUG9pbnRzID0gb3B0aW9uc1thY3Rpb25dLnNuYXAgJiYgb3B0aW9uc1thY3Rpb25dLnNuYXAucmVsYXRpdmVQb2ludHMgO1xuXG4gICAgaWYgKGNoZWNrU25hcCh0YXJnZXQsIGFjdGlvbikgJiYgIShzdGFydGluZyAmJiByZWxhdGl2ZVBvaW50cyAmJiByZWxhdGl2ZVBvaW50cy5sZW5ndGgpKSB7XG4gICAgICAgIHRoaXMuc25hcCA9IHtcbiAgICAgICAgICAgIHJhbmdlICA6IHNuYXBTdGF0dXMucmFuZ2UsXG4gICAgICAgICAgICBsb2NrZWQgOiBzbmFwU3RhdHVzLmxvY2tlZCxcbiAgICAgICAgICAgIHggICAgICA6IHNuYXBTdGF0dXMuc25hcHBlZFgsXG4gICAgICAgICAgICB5ICAgICAgOiBzbmFwU3RhdHVzLnNuYXBwZWRZLFxuICAgICAgICAgICAgcmVhbFggIDogc25hcFN0YXR1cy5yZWFsWCxcbiAgICAgICAgICAgIHJlYWxZICA6IHNuYXBTdGF0dXMucmVhbFksXG4gICAgICAgICAgICBkeCAgICAgOiBzbmFwU3RhdHVzLmR4LFxuICAgICAgICAgICAgZHkgICAgIDogc25hcFN0YXR1cy5keVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzbmFwU3RhdHVzLmxvY2tlZCkge1xuICAgICAgICAgICAgcGFnZS54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBwYWdlLnkgKz0gc25hcFN0YXR1cy5keTtcbiAgICAgICAgICAgIGNsaWVudC54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBjbGllbnQueSArPSBzbmFwU3RhdHVzLmR5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNoZWNrUmVzdHJpY3QodGFyZ2V0LCBhY3Rpb24pICYmICEoc3RhcnRpbmcgJiYgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0LmVsZW1lbnRSZWN0KSAmJiByZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkKSB7XG4gICAgICAgIHBhZ2UueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgcGFnZS55ICs9IHJlc3RyaWN0U3RhdHVzLmR5O1xuICAgICAgICBjbGllbnQueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgY2xpZW50LnkgKz0gcmVzdHJpY3RTdGF0dXMuZHk7XG5cbiAgICAgICAgdGhpcy5yZXN0cmljdCA9IHtcbiAgICAgICAgICAgIGR4OiByZXN0cmljdFN0YXR1cy5keCxcbiAgICAgICAgICAgIGR5OiByZXN0cmljdFN0YXR1cy5keVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMucGFnZVggICAgID0gcGFnZS54O1xuICAgIHRoaXMucGFnZVkgICAgID0gcGFnZS55O1xuICAgIHRoaXMuY2xpZW50WCAgID0gY2xpZW50Lng7XG4gICAgdGhpcy5jbGllbnRZICAgPSBjbGllbnQueTtcblxuICAgIHRoaXMueDAgICAgICAgID0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54IC0gb3JpZ2luLng7XG4gICAgdGhpcy55MCAgICAgICAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueTtcbiAgICB0aGlzLmNsaWVudFgwICA9IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54IC0gb3JpZ2luLng7XG4gICAgdGhpcy5jbGllbnRZMCAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5jbGllbnQueSAtIG9yaWdpbi55O1xuICAgIHRoaXMuY3RybEtleSAgID0gZXZlbnQuY3RybEtleTtcbiAgICB0aGlzLmFsdEtleSAgICA9IGV2ZW50LmFsdEtleTtcbiAgICB0aGlzLnNoaWZ0S2V5ICA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgIHRoaXMubWV0YUtleSAgID0gZXZlbnQubWV0YUtleTtcbiAgICB0aGlzLmJ1dHRvbiAgICA9IGV2ZW50LmJ1dHRvbjtcbiAgICB0aGlzLnRhcmdldCAgICA9IGVsZW1lbnQ7XG4gICAgdGhpcy50MCAgICAgICAgPSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG4gICAgdGhpcy50eXBlICAgICAgPSBhY3Rpb24gKyAocGhhc2UgfHwgJycpO1xuXG4gICAgdGhpcy5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGFyZ2V0O1xuXG4gICAgdmFyIGluZXJ0aWFTdGF0dXMgPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzO1xuXG4gICAgaWYgKGluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuZGV0YWlsID0gJ2luZXJ0aWEnO1xuICAgIH1cblxuICAgIGlmIChyZWxhdGVkKSB7XG4gICAgICAgIHRoaXMucmVsYXRlZFRhcmdldCA9IHJlbGF0ZWQ7XG4gICAgfVxuXG4gICAgLy8gZW5kIGV2ZW50IGR4LCBkeSBpcyBkaWZmZXJlbmNlIGJldHdlZW4gc3RhcnQgYW5kIGVuZCBwb2ludHNcbiAgICBpZiAoZW5kaW5nKSB7XG4gICAgICAgIGlmIChkZWx0YVNvdXJjZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgICAgIHRoaXMuZHggPSBjbGllbnQueCAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54O1xuICAgICAgICAgICAgdGhpcy5keSA9IGNsaWVudC55IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMuY2xpZW50Lnk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gcGFnZS54IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54O1xuICAgICAgICAgICAgdGhpcy5keSA9IHBhZ2UueSAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLnBhZ2UueTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLmR4ID0gMDtcbiAgICAgICAgdGhpcy5keSA9IDA7XG4gICAgfVxuICAgIC8vIGNvcHkgcHJvcGVydGllcyBmcm9tIHByZXZpb3VzbW92ZSBpZiBzdGFydGluZyBpbmVydGlhXG4gICAgZWxzZSBpZiAocGhhc2UgPT09ICdpbmVydGlhc3RhcnQnKSB7XG4gICAgICAgIHRoaXMuZHggPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHg7XG4gICAgICAgIHRoaXMuZHkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoZGVsdGFTb3VyY2UgPT09ICdjbGllbnQnKSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gY2xpZW50LnggLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBjbGllbnQueSAtIGludGVyYWN0aW9uLnByZXZFdmVudC5jbGllbnRZO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5keCA9IHBhZ2UueCAtIGludGVyYWN0aW9uLnByZXZFdmVudC5wYWdlWDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBwYWdlLnkgLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQucGFnZVk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXZFdmVudCAmJiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGV0YWlsID09PSAnaW5lcnRpYSdcbiAgICAgICAgJiYgIWluZXJ0aWFTdGF0dXMuYWN0aXZlXG4gICAgICAgICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhLnplcm9SZXN1bWVEZWx0YSkge1xuXG4gICAgICAgIGluZXJ0aWFTdGF0dXMucmVzdW1lRHggKz0gdGhpcy5keDtcbiAgICAgICAgaW5lcnRpYVN0YXR1cy5yZXN1bWVEeSArPSB0aGlzLmR5O1xuXG4gICAgICAgIHRoaXMuZHggPSB0aGlzLmR5ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uID09PSAncmVzaXplJyAmJiBpbnRlcmFjdGlvbi5yZXNpemVBeGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR4ID0gdGhpcy5keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZHkgPSB0aGlzLmR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5heGVzID0gJ3h5JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXM7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR5ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuZHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2dlc3R1cmUnKSB7XG4gICAgICAgIHRoaXMudG91Y2hlcyA9IFtwb2ludGVyc1swXSwgcG9pbnRlcnNbMV1dO1xuXG4gICAgICAgIGlmIChzdGFydGluZykge1xuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZSA9IHRvdWNoRGlzdGFuY2UocG9pbnRlcnMsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuYm94ICAgICAgPSB0b3VjaEJCb3gocG9pbnRlcnMpO1xuICAgICAgICAgICAgdGhpcy5zY2FsZSAgICA9IDE7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB0b3VjaEFuZ2xlKHBvaW50ZXJzLCB1bmRlZmluZWQsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuZGEgICAgICAgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVuZGluZyB8fCBldmVudCBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzdGFuY2UgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGlzdGFuY2U7XG4gICAgICAgICAgICB0aGlzLmJveCAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmJveDtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc2NhbGU7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gdGhpcy5zY2FsZSAtIDE7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmFuZ2xlO1xuICAgICAgICAgICAgdGhpcy5kYSAgICAgICA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnN0YXJ0QW5nbGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpc3RhbmNlID0gdG91Y2hEaXN0YW5jZShwb2ludGVycywgZGVsdGFTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5ib3ggICAgICA9IHRvdWNoQkJveChwb2ludGVycyk7XG4gICAgICAgICAgICB0aGlzLnNjYWxlICAgID0gdGhpcy5kaXN0YW5jZSAvIGludGVyYWN0aW9uLmdlc3R1cmUuc3RhcnREaXN0YW5jZTtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB0b3VjaEFuZ2xlKHBvaW50ZXJzLCBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZSwgZGVsdGFTb3VyY2UpO1xuXG4gICAgICAgICAgICB0aGlzLmRzID0gdGhpcy5zY2FsZSAtIGludGVyYWN0aW9uLmdlc3R1cmUucHJldlNjYWxlO1xuICAgICAgICAgICAgdGhpcy5kYSA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLmRvd25UaW1lc1swXTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSAwO1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IDA7XG4gICAgICAgIHRoaXMuc3BlZWQgICAgID0gMDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVggPSAwO1xuICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBoYXNlID09PSAnaW5lcnRpYXN0YXJ0Jykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHQgICAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmR0O1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IGludGVyYWN0aW9uLnByZXZFdmVudC5kdXJhdGlvbjtcbiAgICAgICAgdGhpcy5zcGVlZCAgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHlYID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gID0gdGhpcy50aW1lU3RhbXAgLSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICAgICAgdmFyIGR4ID0gdGhpc1tzb3VyY2VYXSAtIGludGVyYWN0aW9uLnByZXZFdmVudFtzb3VyY2VYXSxcbiAgICAgICAgICAgICAgICBkeSA9IHRoaXNbc291cmNlWV0gLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnRbc291cmNlWV0sXG4gICAgICAgICAgICAgICAgZHQgPSB0aGlzLmR0IC8gMTAwMDtcblxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IGh5cG90KGR4LCBkeSkgLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlYID0gZHggLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlZID0gZHkgLyBkdDtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBub3JtYWwgbW92ZSBvciBlbmQgZXZlbnQsIHVzZSBwcmV2aW91cyB1c2VyIGV2ZW50IGNvb3Jkc1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNwZWVkIGFuZCB2ZWxvY2l0eSBpbiBwaXhlbHMgcGVyIHNlY29uZFxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0uc3BlZWQ7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udng7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udnk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKGVuZGluZyB8fCBwaGFzZSA9PT0gJ2luZXJ0aWFzdGFydCcpXG4gICAgICAgICYmIGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCA+IDYwMCAmJiB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXAgPCAxNTApIHtcblxuICAgICAgICB2YXIgYW5nbGUgPSAxODAgKiBNYXRoLmF0YW4yKGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVksIGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVgpIC8gTWF0aC5QSSxcbiAgICAgICAgICAgIG92ZXJsYXAgPSAyMi41O1xuXG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICAgIGFuZ2xlICs9IDM2MDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWZ0ID0gMTM1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDIyNSArIG92ZXJsYXAsXG4gICAgICAgICAgICB1cCAgID0gMjI1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDMxNSArIG92ZXJsYXAsXG5cbiAgICAgICAgICAgIHJpZ2h0ID0gIWxlZnQgJiYgKDMxNSAtIG92ZXJsYXAgPD0gYW5nbGUgfHwgYW5nbGUgPCAgNDUgKyBvdmVybGFwKSxcbiAgICAgICAgICAgIGRvd24gID0gIXVwICAgJiYgICA0NSAtIG92ZXJsYXAgPD0gYW5nbGUgJiYgYW5nbGUgPCAxMzUgKyBvdmVybGFwO1xuXG4gICAgICAgIHRoaXMuc3dpcGUgPSB7XG4gICAgICAgICAgICB1cCAgIDogdXAsXG4gICAgICAgICAgICBkb3duIDogZG93bixcbiAgICAgICAgICAgIGxlZnQgOiBsZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IHJpZ2h0LFxuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlLFxuICAgICAgICAgICAgc3BlZWQ6IGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCxcbiAgICAgICAgICAgIHZlbG9jaXR5OiB7XG4gICAgICAgICAgICAgICAgeDogaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WCxcbiAgICAgICAgICAgICAgICB5OiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5JbnRlcmFjdEV2ZW50LnByb3RvdHlwZSA9IHtcbiAgICBwcmV2ZW50RGVmYXVsdDogYmxhbmssXG4gICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgIH0sXG4gICAgc3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBwcmV2ZW50T3JpZ2luYWxEZWZhdWx0ICgpIHtcbiAgICB0aGlzLm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbn1cblxuZnVuY3Rpb24gZ2V0QWN0aW9uQ3Vyc29yIChhY3Rpb24pIHtcbiAgICB2YXIgY3Vyc29yID0gJyc7XG5cbiAgICBpZiAoYWN0aW9uLm5hbWUgPT09ICdkcmFnJykge1xuICAgICAgICBjdXJzb3IgPSAgYWN0aW9uQ3Vyc29ycy5kcmFnO1xuICAgIH1cbiAgICBpZiAoYWN0aW9uLm5hbWUgPT09ICdyZXNpemUnKSB7XG4gICAgICAgIGlmIChhY3Rpb24uYXhpcykge1xuICAgICAgICAgICAgY3Vyc29yID0gIGFjdGlvbkN1cnNvcnNbYWN0aW9uLm5hbWUgKyBhY3Rpb24uYXhpc107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYWN0aW9uLmVkZ2VzKSB7XG4gICAgICAgICAgICB2YXIgY3Vyc29yS2V5ID0gJ3Jlc2l6ZScsXG4gICAgICAgICAgICAgICAgZWRnZU5hbWVzID0gWyd0b3AnLCAnYm90dG9tJywgJ2xlZnQnLCAncmlnaHQnXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLmVkZ2VzW2VkZ2VOYW1lc1tpXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yS2V5ICs9IGVkZ2VOYW1lc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnNvciA9IGFjdGlvbkN1cnNvcnNbY3Vyc29yS2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjdXJzb3I7XG59XG5cbmZ1bmN0aW9uIGNoZWNrUmVzaXplRWRnZSAobmFtZSwgdmFsdWUsIHBhZ2UsIGVsZW1lbnQsIGludGVyYWN0YWJsZUVsZW1lbnQsIHJlY3QsIG1hcmdpbikge1xuICAgIC8vIGZhbHNlLCAnJywgdW5kZWZpbmVkLCBudWxsXG4gICAgaWYgKCF2YWx1ZSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIC8vIHRydWUgdmFsdWUsIHVzZSBwb2ludGVyIGNvb3JkcyBhbmQgZWxlbWVudCByZWN0XG4gICAgaWYgKHZhbHVlID09PSB0cnVlKSB7XG4gICAgICAgIC8vIGlmIGRpbWVuc2lvbnMgYXJlIG5lZ2F0aXZlLCBcInN3aXRjaFwiIGVkZ2VzXG4gICAgICAgIHZhciB3aWR0aCA9IGlzTnVtYmVyKHJlY3Qud2lkdGgpPyByZWN0LndpZHRoIDogcmVjdC5yaWdodCAtIHJlY3QubGVmdCxcbiAgICAgICAgICAgIGhlaWdodCA9IGlzTnVtYmVyKHJlY3QuaGVpZ2h0KT8gcmVjdC5oZWlnaHQgOiByZWN0LmJvdHRvbSAtIHJlY3QudG9wO1xuXG4gICAgICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgIGlmICAgICAgKG5hbWUgPT09ICdsZWZ0JyApIHsgbmFtZSA9ICdyaWdodCc7IH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgbmFtZSA9ICdsZWZ0JyA7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgaWYgICAgICAobmFtZSA9PT0gJ3RvcCcgICApIHsgbmFtZSA9ICdib3R0b20nOyB9XG4gICAgICAgICAgICBlbHNlIGlmIChuYW1lID09PSAnYm90dG9tJykgeyBuYW1lID0gJ3RvcCcgICA7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lID09PSAnbGVmdCcgICkgeyByZXR1cm4gcGFnZS54IDwgKCh3aWR0aCAgPj0gMD8gcmVjdC5sZWZ0OiByZWN0LnJpZ2h0ICkgKyBtYXJnaW4pOyB9XG4gICAgICAgIGlmIChuYW1lID09PSAndG9wJyAgICkgeyByZXR1cm4gcGFnZS55IDwgKChoZWlnaHQgPj0gMD8gcmVjdC50b3AgOiByZWN0LmJvdHRvbSkgKyBtYXJnaW4pOyB9XG5cbiAgICAgICAgaWYgKG5hbWUgPT09ICdyaWdodCcgKSB7IHJldHVybiBwYWdlLnggPiAoKHdpZHRoICA+PSAwPyByZWN0LnJpZ2h0IDogcmVjdC5sZWZ0KSAtIG1hcmdpbik7IH1cbiAgICAgICAgaWYgKG5hbWUgPT09ICdib3R0b20nKSB7IHJldHVybiBwYWdlLnkgPiAoKGhlaWdodCA+PSAwPyByZWN0LmJvdHRvbTogcmVjdC50b3AgKSAtIG1hcmdpbik7IH1cbiAgICB9XG5cbiAgICAvLyB0aGUgcmVtYWluaW5nIGNoZWNrcyByZXF1aXJlIGFuIGVsZW1lbnRcbiAgICBpZiAoIWlzRWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIHJldHVybiBpc0VsZW1lbnQodmFsdWUpXG4gICAgICAgIC8vIHRoZSB2YWx1ZSBpcyBhbiBlbGVtZW50IHRvIHVzZSBhcyBhIHJlc2l6ZSBoYW5kbGVcbiAgICAgICAgPyB2YWx1ZSA9PT0gZWxlbWVudFxuICAgICAgICAvLyBvdGhlcndpc2UgY2hlY2sgaWYgZWxlbWVudCBtYXRjaGVzIHZhbHVlIGFzIHNlbGVjdG9yXG4gICAgICAgIDogbWF0Y2hlc1VwVG8oZWxlbWVudCwgdmFsdWUsIGludGVyYWN0YWJsZUVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0QWN0aW9uQ2hlY2tlciAocG9pbnRlciwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpIHtcbiAgICB2YXIgcmVjdCA9IHRoaXMuZ2V0UmVjdChlbGVtZW50KSxcbiAgICAgICAgc2hvdWxkUmVzaXplID0gZmFsc2UsXG4gICAgICAgIGFjdGlvbiA9IG51bGwsXG4gICAgICAgIHJlc2l6ZUF4ZXMgPSBudWxsLFxuICAgICAgICByZXNpemVFZGdlcyxcbiAgICAgICAgcGFnZSA9IGV4dGVuZCh7fSwgaW50ZXJhY3Rpb24uY3VyQ29vcmRzLnBhZ2UpLFxuICAgICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgaWYgKCFyZWN0KSB7IHJldHVybiBudWxsOyB9XG5cbiAgICBpZiAoYWN0aW9uSXNFbmFibGVkLnJlc2l6ZSAmJiBvcHRpb25zLnJlc2l6ZS5lbmFibGVkKSB7XG4gICAgICAgIHZhciByZXNpemVPcHRpb25zID0gb3B0aW9ucy5yZXNpemU7XG5cbiAgICAgICAgcmVzaXplRWRnZXMgPSB7XG4gICAgICAgICAgICBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICAgIGlmIChpc09iamVjdChyZXNpemVPcHRpb25zLmVkZ2VzKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMuZWRnZXNbZWRnZV0sXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLl9ldmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgcmVjdCxcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplT3B0aW9ucy5tYXJnaW4gfHwgbWFyZ2luKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzaXplRWRnZXMubGVmdCA9IHJlc2l6ZUVkZ2VzLmxlZnQgJiYgIXJlc2l6ZUVkZ2VzLnJpZ2h0O1xuICAgICAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbTtcblxuICAgICAgICAgICAgc2hvdWxkUmVzaXplID0gcmVzaXplRWRnZXMubGVmdCB8fCByZXNpemVFZGdlcy5yaWdodCB8fCByZXNpemVFZGdlcy50b3AgfHwgcmVzaXplRWRnZXMuYm90dG9tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd5JyAmJiBwYWdlLnggPiAocmVjdC5yaWdodCAgLSBtYXJnaW4pLFxuICAgICAgICAgICAgICAgIGJvdHRvbSA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd4JyAmJiBwYWdlLnkgPiAocmVjdC5ib3R0b20gLSBtYXJnaW4pO1xuXG4gICAgICAgICAgICBzaG91bGRSZXNpemUgPSByaWdodCB8fCBib3R0b207XG4gICAgICAgICAgICByZXNpemVBeGVzID0gKHJpZ2h0PyAneCcgOiAnJykgKyAoYm90dG9tPyAneScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhY3Rpb24gPSBzaG91bGRSZXNpemVcbiAgICAgICAgPyAncmVzaXplJ1xuICAgICAgICA6IGFjdGlvbklzRW5hYmxlZC5kcmFnICYmIG9wdGlvbnMuZHJhZy5lbmFibGVkXG4gICAgICAgID8gJ2RyYWcnXG4gICAgICAgIDogbnVsbDtcblxuICAgIGlmIChhY3Rpb25Jc0VuYWJsZWQuZ2VzdHVyZVxuICAgICAgICAmJiBpbnRlcmFjdGlvbi5wb2ludGVySWRzLmxlbmd0aCA+PTJcbiAgICAgICAgJiYgIShpbnRlcmFjdGlvbi5kcmFnZ2luZyB8fCBpbnRlcmFjdGlvbi5yZXNpemluZykpIHtcbiAgICAgICAgYWN0aW9uID0gJ2dlc3R1cmUnO1xuICAgIH1cblxuICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IGFjdGlvbixcbiAgICAgICAgICAgIGF4aXM6IHJlc2l6ZUF4ZXMsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8gQ2hlY2sgaWYgYWN0aW9uIGlzIGVuYWJsZWQgZ2xvYmFsbHkgYW5kIHRoZSBjdXJyZW50IHRhcmdldCBzdXBwb3J0cyBpdFxuLy8gSWYgc28sIHJldHVybiB0aGUgdmFsaWRhdGVkIGFjdGlvbi4gT3RoZXJ3aXNlLCByZXR1cm4gbnVsbFxuZnVuY3Rpb24gdmFsaWRhdGVBY3Rpb24gKGFjdGlvbiwgaW50ZXJhY3RhYmxlKSB7XG4gICAgaWYgKCFpc09iamVjdChhY3Rpb24pKSB7IHJldHVybiBudWxsOyB9XG5cbiAgICB2YXIgYWN0aW9uTmFtZSA9IGFjdGlvbi5uYW1lLFxuICAgICAgICBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnM7XG5cbiAgICBpZiAoKCAgKGFjdGlvbk5hbWUgID09PSAncmVzaXplJyAgICYmIG9wdGlvbnMucmVzaXplLmVuYWJsZWQgKVxuICAgICAgICB8fCAoYWN0aW9uTmFtZSAgICAgID09PSAnZHJhZycgICAgICYmIG9wdGlvbnMuZHJhZy5lbmFibGVkICApXG4gICAgICAgIHx8IChhY3Rpb25OYW1lICAgICAgPT09ICdnZXN0dXJlJyAgJiYgb3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQpKVxuICAgICAgICAmJiBhY3Rpb25Jc0VuYWJsZWRbYWN0aW9uTmFtZV0pIHtcblxuICAgICAgICBpZiAoYWN0aW9uTmFtZSA9PT0gJ3Jlc2l6ZScgfHwgYWN0aW9uTmFtZSA9PT0gJ3Jlc2l6ZXl4Jykge1xuICAgICAgICAgICAgYWN0aW9uTmFtZSA9ICdyZXNpemV4eSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxudmFyIGxpc3RlbmVycyA9IHt9LFxuICAgIGludGVyYWN0aW9uTGlzdGVuZXJzID0gW1xuICAgICAgICAnZHJhZ1N0YXJ0JywgJ2RyYWdNb3ZlJywgJ3Jlc2l6ZVN0YXJ0JywgJ3Jlc2l6ZU1vdmUnLCAnZ2VzdHVyZVN0YXJ0JywgJ2dlc3R1cmVNb3ZlJyxcbiAgICAgICAgJ3BvaW50ZXJPdmVyJywgJ3BvaW50ZXJPdXQnLCAncG9pbnRlckhvdmVyJywgJ3NlbGVjdG9yRG93bicsXG4gICAgICAgICdwb2ludGVyRG93bicsICdwb2ludGVyTW92ZScsICdwb2ludGVyVXAnLCAncG9pbnRlckNhbmNlbCcsICdwb2ludGVyRW5kJyxcbiAgICAgICAgJ2FkZFBvaW50ZXInLCAncmVtb3ZlUG9pbnRlcicsICdyZWNvcmRQb2ludGVyJywgJ2F1dG9TY3JvbGxNb3ZlJ1xuICAgIF07XG5cbmZvciAodmFyIGkgPSAwLCBsZW4gPSBpbnRlcmFjdGlvbkxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHZhciBuYW1lID0gaW50ZXJhY3Rpb25MaXN0ZW5lcnNbaV07XG5cbiAgICBsaXN0ZW5lcnNbbmFtZV0gPSBkb09uSW50ZXJhY3Rpb25zKG5hbWUpO1xufVxuXG4vLyBib3VuZCB0byB0aGUgaW50ZXJhY3RhYmxlIGNvbnRleHQgd2hlbiBhIERPTSBldmVudFxuLy8gbGlzdGVuZXIgaXMgYWRkZWQgdG8gYSBzZWxlY3RvciBpbnRlcmFjdGFibGVcbmZ1bmN0aW9uIGRlbGVnYXRlTGlzdGVuZXIgKGV2ZW50LCB1c2VDYXB0dXJlKSB7XG4gICAgdmFyIGZha2VFdmVudCA9IHt9LFxuICAgICAgICBkZWxlZ2F0ZWQgPSBkZWxlZ2F0ZWRFdmVudHNbZXZlbnQudHlwZV0sXG4gICAgICAgIGV2ZW50VGFyZ2V0ID0gZ2V0QWN0dWFsRWxlbWVudChldmVudC5wYXRoXG4gICAgICAgICAgICA/IGV2ZW50LnBhdGhbMF1cbiAgICAgICAgICAgIDogZXZlbnQudGFyZ2V0KSxcbiAgICAgICAgZWxlbWVudCA9IGV2ZW50VGFyZ2V0O1xuXG4gICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgLy8gZHVwbGljYXRlIHRoZSBldmVudCBzbyB0aGF0IGN1cnJlbnRUYXJnZXQgY2FuIGJlIGNoYW5nZWRcbiAgICBmb3IgKHZhciBwcm9wIGluIGV2ZW50KSB7XG4gICAgICAgIGZha2VFdmVudFtwcm9wXSA9IGV2ZW50W3Byb3BdO1xuICAgIH1cblxuICAgIGZha2VFdmVudC5vcmlnaW5hbEV2ZW50ID0gZXZlbnQ7XG4gICAgZmFrZUV2ZW50LnByZXZlbnREZWZhdWx0ID0gcHJldmVudE9yaWdpbmFsRGVmYXVsdDtcblxuICAgIC8vIGNsaW1iIHVwIGRvY3VtZW50IHRyZWUgbG9va2luZyBmb3Igc2VsZWN0b3IgbWF0Y2hlc1xuICAgIHdoaWxlIChpc0VsZW1lbnQoZWxlbWVudCkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzW2ldLFxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBkZWxlZ2F0ZWQuY29udGV4dHNbaV07XG5cbiAgICAgICAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgJiYgbm9kZUNvbnRhaW5zKGNvbnRleHQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIG5vZGVDb250YWlucyhjb250ZXh0LCBlbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IGRlbGVnYXRlZC5saXN0ZW5lcnNbaV07XG5cbiAgICAgICAgICAgICAgICBmYWtlRXZlbnQuY3VycmVudFRhcmdldCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpc3RlbmVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2pdWzFdID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbal1bMF0oZmFrZUV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQgPSBwYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVsZWdhdGVVc2VDYXB0dXJlIChldmVudCkge1xuICAgIHJldHVybiBkZWxlZ2F0ZUxpc3RlbmVyLmNhbGwodGhpcywgZXZlbnQsIHRydWUpO1xufVxuXG5pbnRlcmFjdGFibGVzLmluZGV4T2ZFbGVtZW50ID0gZnVuY3Rpb24gaW5kZXhPZkVsZW1lbnQgKGVsZW1lbnQsIGNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gY29udGV4dCB8fCBkb2N1bWVudDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaW50ZXJhY3RhYmxlID0gdGhpc1tpXTtcblxuICAgICAgICBpZiAoKGludGVyYWN0YWJsZS5zZWxlY3RvciA9PT0gZWxlbWVudFxuICAgICAgICAgICAgJiYgKGludGVyYWN0YWJsZS5fY29udGV4dCA9PT0gY29udGV4dCkpXG4gICAgICAgICAgICB8fCAoIWludGVyYWN0YWJsZS5zZWxlY3RvciAmJiBpbnRlcmFjdGFibGUuX2VsZW1lbnQgPT09IGVsZW1lbnQpKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn07XG5cbmludGVyYWN0YWJsZXMuZ2V0ID0gZnVuY3Rpb24gaW50ZXJhY3RhYmxlR2V0IChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXNbdGhpcy5pbmRleE9mRWxlbWVudChlbGVtZW50LCBvcHRpb25zICYmIG9wdGlvbnMuY29udGV4dCldO1xufTtcblxuaW50ZXJhY3RhYmxlcy5mb3JFYWNoU2VsZWN0b3IgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGludGVyYWN0YWJsZSA9IHRoaXNbaV07XG5cbiAgICAgICAgaWYgKCFpbnRlcmFjdGFibGUuc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJldCA9IGNhbGxiYWNrKGludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlLnNlbGVjdG9yLCBpbnRlcmFjdGFibGUuX2NvbnRleHQsIGksIHRoaXMpO1xuXG4gICAgICAgIGlmIChyZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qXFxcbiAqIGludGVyYWN0XG4gWyBtZXRob2QgXVxuICpcbiAqIFRoZSBtZXRob2RzIG9mIHRoaXMgdmFyaWFibGUgY2FuIGJlIHVzZWQgdG8gc2V0IGVsZW1lbnRzIGFzXG4gKiBpbnRlcmFjdGFibGVzIGFuZCBhbHNvIHRvIGNoYW5nZSB2YXJpb3VzIGRlZmF1bHQgc2V0dGluZ3MuXG4gKlxuICogQ2FsbGluZyBpdCBhcyBhIGZ1bmN0aW9uIGFuZCBwYXNzaW5nIGFuIGVsZW1lbnQgb3IgYSB2YWxpZCBDU1Mgc2VsZWN0b3JcbiAqIHN0cmluZyByZXR1cm5zIGFuIEludGVyYWN0YWJsZSBvYmplY3Qgd2hpY2ggaGFzIHZhcmlvdXMgbWV0aG9kcyB0b1xuICogY29uZmlndXJlIGl0LlxuICpcbiAtIGVsZW1lbnQgKEVsZW1lbnQgfCBzdHJpbmcpIFRoZSBIVE1MIG9yIFNWRyBFbGVtZW50IHRvIGludGVyYWN0IHdpdGggb3IgQ1NTIHNlbGVjdG9yXG4gPSAob2JqZWN0KSBBbiBASW50ZXJhY3RhYmxlXG4gKlxuID4gVXNhZ2VcbiB8IGludGVyYWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcmFnZ2FibGUnKSkuZHJhZ2dhYmxlKHRydWUpO1xuIHxcbiB8IHZhciByZWN0YWJsZXMgPSBpbnRlcmFjdCgncmVjdCcpO1xuIHwgcmVjdGFibGVzXG4gfCAgICAgLmdlc3R1cmFibGUodHJ1ZSlcbiB8ICAgICAub24oJ2dlc3R1cmVtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gfCAgICAgICAgIC8vIHNvbWV0aGluZyBjb29sLi4uXG4gfCAgICAgfSlcbiB8ICAgICAuYXV0b1Njcm9sbCh0cnVlKTtcbiBcXCovXG5mdW5jdGlvbiBpbnRlcmFjdCAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHJldHVybiBpbnRlcmFjdGFibGVzLmdldChlbGVtZW50LCBvcHRpb25zKSB8fCBuZXcgSW50ZXJhY3RhYmxlKGVsZW1lbnQsIG9wdGlvbnMpO1xufVxuXG4vKlxcXG4gKiBJbnRlcmFjdGFibGVcbiBbIHByb3BlcnR5IF1cbiAqKlxuICogT2JqZWN0IHR5cGUgcmV0dXJuZWQgYnkgQGludGVyYWN0XG4gXFwqL1xuZnVuY3Rpb24gSW50ZXJhY3RhYmxlIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5faUV2ZW50cyA9IHRoaXMuX2lFdmVudHMgfHwge307XG5cbiAgICB2YXIgX3dpbmRvdztcblxuICAgIGlmICh0cnlTZWxlY3RvcihlbGVtZW50KSkge1xuICAgICAgICB0aGlzLnNlbGVjdG9yID0gZWxlbWVudDtcblxuICAgICAgICB2YXIgY29udGV4dCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0O1xuXG4gICAgICAgIF93aW5kb3cgPSBjb250ZXh0PyBnZXRXaW5kb3coY29udGV4dCkgOiB3aW5kb3c7XG5cbiAgICAgICAgaWYgKGNvbnRleHQgJiYgKF93aW5kb3cuTm9kZVxuICAgICAgICAgICAgICAgID8gY29udGV4dCBpbnN0YW5jZW9mIF93aW5kb3cuTm9kZVxuICAgICAgICAgICAgICAgIDogKGlzRWxlbWVudChjb250ZXh0KSB8fCBjb250ZXh0ID09PSBfd2luZG93LmRvY3VtZW50KSkpIHtcblxuICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIF93aW5kb3cgPSBnZXRXaW5kb3coZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50LCBfd2luZG93KSkge1xuXG4gICAgICAgICAgICBpZiAoUG9pbnRlckV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCBwRXZlbnRUeXBlcy5kb3duLCBsaXN0ZW5lcnMucG9pbnRlckRvd24gKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsIHBFdmVudFR5cGVzLm1vdmUsIGxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAnbW91c2Vkb3duJyAsIGxpc3RlbmVycy5wb2ludGVyRG93biApO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgJ21vdXNlbW92ZScgLCBsaXN0ZW5lcnMucG9pbnRlckhvdmVyKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsICd0b3VjaHN0YXJ0JywgbGlzdGVuZXJzLnBvaW50ZXJEb3duICk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAndG91Y2htb3ZlJyAsIGxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZG9jID0gX3dpbmRvdy5kb2N1bWVudDtcblxuICAgIGlmICghY29udGFpbnMoZG9jdW1lbnRzLCB0aGlzLl9kb2MpKSB7XG4gICAgICAgIGxpc3RlblRvRG9jdW1lbnQodGhpcy5fZG9jKTtcbiAgICB9XG5cbiAgICBpbnRlcmFjdGFibGVzLnB1c2godGhpcyk7XG5cbiAgICB0aGlzLnNldChvcHRpb25zKTtcbn1cblxuSW50ZXJhY3RhYmxlLnByb3RvdHlwZSA9IHtcbiAgICBzZXRPbkV2ZW50czogZnVuY3Rpb24gKGFjdGlvbiwgcGhhc2VzKSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdkcm9wJykge1xuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ocGhhc2VzLm9uZHJvcCkgICAgICAgICAgKSB7IHRoaXMub25kcm9wICAgICAgICAgICA9IHBoYXNlcy5vbmRyb3AgICAgICAgICAgOyB9XG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwaGFzZXMub25kcm9wYWN0aXZhdGUpICApIHsgdGhpcy5vbmRyb3BhY3RpdmF0ZSAgID0gcGhhc2VzLm9uZHJvcGFjdGl2YXRlICA7IH1cbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHBoYXNlcy5vbmRyb3BkZWFjdGl2YXRlKSkgeyB0aGlzLm9uZHJvcGRlYWN0aXZhdGUgPSBwaGFzZXMub25kcm9wZGVhY3RpdmF0ZTsgfVxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ocGhhc2VzLm9uZHJhZ2VudGVyKSAgICAgKSB7IHRoaXMub25kcmFnZW50ZXIgICAgICA9IHBoYXNlcy5vbmRyYWdlbnRlciAgICAgOyB9XG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwaGFzZXMub25kcmFnbGVhdmUpICAgICApIHsgdGhpcy5vbmRyYWdsZWF2ZSAgICAgID0gcGhhc2VzLm9uZHJhZ2xlYXZlICAgICA7IH1cbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHBoYXNlcy5vbmRyb3Btb3ZlKSAgICAgICkgeyB0aGlzLm9uZHJvcG1vdmUgICAgICAgPSBwaGFzZXMub25kcm9wbW92ZSAgICAgIDsgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYWN0aW9uID0gJ29uJyArIGFjdGlvbjtcblxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ocGhhc2VzLm9uc3RhcnQpICAgICAgICkgeyB0aGlzW2FjdGlvbiArICdzdGFydCcgICAgICAgICBdID0gcGhhc2VzLm9uc3RhcnQgICAgICAgICA7IH1cbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHBoYXNlcy5vbm1vdmUpICAgICAgICApIHsgdGhpc1thY3Rpb24gKyAnbW92ZScgICAgICAgICAgXSA9IHBoYXNlcy5vbm1vdmUgICAgICAgICAgOyB9XG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwaGFzZXMub25lbmQpICAgICAgICAgKSB7IHRoaXNbYWN0aW9uICsgJ2VuZCcgICAgICAgICAgIF0gPSBwaGFzZXMub25lbmQgICAgICAgICAgIDsgfVxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ocGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSkgeyB0aGlzW2FjdGlvbiArICdpbmVydGlhc3RhcnQnICBdID0gcGhhc2VzLm9uaW5lcnRpYXN0YXJ0ICA7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmRyYWdnYWJsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciBkcmFnIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGVcbiAgICAgKiBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICA9IChib29sZWFuKSBJbmRpY2F0ZXMgaWYgdGhpcyBjYW4gYmUgdGhlIHRhcmdldCBvZiBkcmFnIGV2ZW50c1xuICAgICB8IHZhciBpc0RyYWdnYWJsZSA9IGludGVyYWN0KCd1bCBsaScpLmRyYWdnYWJsZSgpO1xuICAgICAqIG9yXG4gICAgIC0gb3B0aW9ucyAoYm9vbGVhbiB8IG9iamVjdCkgI29wdGlvbmFsIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnQgbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIGRyYWcgZXZlbnRzIChvYmplY3QgbWFrZXMgdGhlIEludGVyYWN0YWJsZSBkcmFnZ2FibGUpXG4gICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5kcmFnZ2FibGUoe1xuICAgICB8ICAgICBvbnN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8ICAgICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICB8XG4gICAgIHwgICAgIC8vIHRoZSBheGlzIGluIHdoaWNoIHRoZSBmaXJzdCBtb3ZlbWVudCBtdXN0IGJlXG4gICAgIHwgICAgIC8vIGZvciB0aGUgZHJhZyBzZXF1ZW5jZSB0byBzdGFydFxuICAgICB8ICAgICAvLyAneHknIGJ5IGRlZmF1bHQgLSBhbnkgZGlyZWN0aW9uXG4gICAgIHwgICAgIGF4aXM6ICd4JyB8fCAneScgfHwgJ3h5JyxcbiAgICAgfFxuICAgICB8ICAgICAvLyBtYXggbnVtYmVyIG9mIGRyYWdzIHRoYXQgY2FuIGhhcHBlbiBjb25jdXJyZW50bHlcbiAgICAgfCAgICAgLy8gd2l0aCBlbGVtZW50cyBvZiB0aGlzIEludGVyYWN0YWJsZS4gSW5maW5pdHkgYnkgZGVmYXVsdFxuICAgICB8ICAgICBtYXg6IEluZmluaXR5LFxuICAgICB8XG4gICAgIHwgICAgIC8vIG1heCBudW1iZXIgb2YgZHJhZ3MgdGhhdCBjYW4gdGFyZ2V0IHRoZSBzYW1lIGVsZW1lbnQrSW50ZXJhY3RhYmxlXG4gICAgIHwgICAgIC8vIDEgYnkgZGVmYXVsdFxuICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAyXG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICBkcmFnZ2FibGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyYWcuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oJ2RyYWcnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuc2V0T25FdmVudHMoJ2RyYWcnLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKC9eeCR8XnkkfF54eSQvLnRlc3Qob3B0aW9ucy5heGlzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcmFnLmF4aXMgPSBvcHRpb25zLmF4aXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmF4aXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmRyYWcuYXhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJhZy5lbmFibGVkID0gb3B0aW9ucztcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRyYWc7XG4gICAgfSxcblxuICAgIHNldFBlckFjdGlvbjogZnVuY3Rpb24gKGFjdGlvbiwgb3B0aW9ucykge1xuICAgICAgICAvLyBmb3IgYWxsIHRoZSBkZWZhdWx0IHBlci1hY3Rpb24gb3B0aW9uc1xuICAgICAgICBmb3IgKHZhciBvcHRpb24gaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBvcHRpb24gZXhpc3RzIGZvciB0aGlzIGFjdGlvblxuICAgICAgICAgICAgaWYgKG9wdGlvbiBpbiBkZWZhdWx0T3B0aW9uc1thY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIG9wdGlvbiBpbiB0aGUgb3B0aW9ucyBhcmcgaXMgYW4gb2JqZWN0IHZhbHVlXG4gICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KG9wdGlvbnNbb3B0aW9uXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZHVwbGljYXRlIHRoZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXSA9IGV4dGVuZCh0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dIHx8IHt9LCBvcHRpb25zW29wdGlvbl0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc09iamVjdChkZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb25bb3B0aW9uXSkgJiYgJ2VuYWJsZWQnIGluIGRlZmF1bHRPcHRpb25zLnBlckFjdGlvbltvcHRpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dLmVuYWJsZWQgPSBvcHRpb25zW29wdGlvbl0uZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChpc0Jvb2wob3B0aW9uc1tvcHRpb25dKSAmJiBpc09iamVjdChkZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb25bb3B0aW9uXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXS5lbmFibGVkID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zW29wdGlvbl0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvciBpZiBpdCdzIG5vdCB1bmRlZmluZWQsIGRvIGEgcGxhaW4gYXNzaWdubWVudFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmRyb3B6b25lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGVsZW1lbnRzIGNhbiBiZSBkcm9wcGVkIG9udG8gdGhpc1xuICAgICAqIEludGVyYWN0YWJsZSB0byB0cmlnZ2VyIGRyb3AgZXZlbnRzXG4gICAgICpcbiAgICAgKiBEcm9wem9uZXMgY2FuIHJlY2VpdmUgdGhlIGZvbGxvd2luZyBldmVudHM6XG4gICAgICogIC0gYGRyb3BhY3RpdmF0ZWAgYW5kIGBkcm9wZGVhY3RpdmF0ZWAgd2hlbiBhbiBhY2NlcHRhYmxlIGRyYWcgc3RhcnRzIGFuZCBlbmRzXG4gICAgICogIC0gYGRyYWdlbnRlcmAgYW5kIGBkcmFnbGVhdmVgIHdoZW4gYSBkcmFnZ2FibGUgZW50ZXJzIGFuZCBsZWF2ZXMgdGhlIGRyb3B6b25lXG4gICAgICogIC0gYGRyYWdtb3ZlYCB3aGVuIGEgZHJhZ2dhYmxlIHRoYXQgaGFzIGVudGVyZWQgdGhlIGRyb3B6b25lIGlzIG1vdmVkXG4gICAgICogIC0gYGRyb3BgIHdoZW4gYSBkcmFnZ2FibGUgaXMgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmVcbiAgICAgKlxuICAgICAqICBVc2UgdGhlIGBhY2NlcHRgIG9wdGlvbiB0byBhbGxvdyBvbmx5IGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvciBlbGVtZW50LlxuICAgICAqXG4gICAgICogIFVzZSB0aGUgYG92ZXJsYXBgIG9wdGlvbiB0byBzZXQgaG93IGRyb3BzIGFyZSBjaGVja2VkIGZvci4gVGhlIGFsbG93ZWQgdmFsdWVzIGFyZTpcbiAgICAgKiAgIC0gYCdwb2ludGVyJ2AsIHRoZSBwb2ludGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmUgKGRlZmF1bHQpXG4gICAgICogICAtIGAnY2VudGVyJ2AsIHRoZSBkcmFnZ2FibGUgZWxlbWVudCdzIGNlbnRlciBtdXN0IGJlIG92ZXIgdGhlIGRyb3B6b25lXG4gICAgICogICAtIGEgbnVtYmVyIGZyb20gMC0xIHdoaWNoIGlzIHRoZSBgKGludGVyc2VjdGlvbiBhcmVhKSAvIChkcmFnZ2FibGUgYXJlYSlgLlxuICAgICAqICAgICAgIGUuZy4gYDAuNWAgZm9yIGRyb3AgdG8gaGFwcGVuIHdoZW4gaGFsZiBvZiB0aGUgYXJlYSBvZiB0aGVcbiAgICAgKiAgICAgICBkcmFnZ2FibGUgaXMgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICAgKlxuICAgICAtIG9wdGlvbnMgKGJvb2xlYW4gfCBvYmplY3QgfCBudWxsKSAjb3B0aW9uYWwgVGhlIG5ldyB2YWx1ZSB0byBiZSBzZXQuXG4gICAgIHwgaW50ZXJhY3QoJy5kcm9wJykuZHJvcHpvbmUoe1xuICAgICB8ICAgYWNjZXB0OiAnLmNhbi1kcm9wJyB8fCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2luZ2xlLWRyb3AnKSxcbiAgICAgfCAgIG92ZXJsYXA6ICdwb2ludGVyJyB8fCAnY2VudGVyJyB8fCB6ZXJvVG9PbmVcbiAgICAgfCB9XG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGRyb3B6b25lOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0T25FdmVudHMoJ2Ryb3AnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuYWNjZXB0KG9wdGlvbnMuYWNjZXB0KTtcblxuICAgICAgICAgICAgaWYgKC9eKHBvaW50ZXJ8Y2VudGVyKSQvLnRlc3Qob3B0aW9ucy5vdmVybGFwKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLm92ZXJsYXAgPSBvcHRpb25zLm92ZXJsYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc051bWJlcihvcHRpb25zLm92ZXJsYXApKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3Aub3ZlcmxhcCA9IE1hdGgubWF4KE1hdGgubWluKDEsIG9wdGlvbnMub3ZlcmxhcCksIDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJvcDtcbiAgICB9LFxuXG4gICAgZHJvcENoZWNrOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgZHJvcEVsZW1lbnQsIHJlY3QpIHtcbiAgICAgICAgdmFyIGRyb3BwZWQgPSBmYWxzZTtcblxuICAgICAgICAvLyBpZiB0aGUgZHJvcHpvbmUgaGFzIG5vIHJlY3QgKGVnLiBkaXNwbGF5OiBub25lKVxuICAgICAgICAvLyBjYWxsIHRoZSBjdXN0b20gZHJvcENoZWNrZXIgb3IganVzdCByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKCEocmVjdCA9IHJlY3QgfHwgdGhpcy5nZXRSZWN0KGRyb3BFbGVtZW50KSkpIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5vcHRpb25zLmRyb3BDaGVja2VyXG4gICAgICAgICAgICAgICAgPyB0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXIocG9pbnRlciwgZXZlbnQsIGRyb3BwZWQsIHRoaXMsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpXG4gICAgICAgICAgICAgICAgOiBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZHJvcE92ZXJsYXAgPSB0aGlzLm9wdGlvbnMuZHJvcC5vdmVybGFwO1xuXG4gICAgICAgIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ3BvaW50ZXInKSB7XG4gICAgICAgICAgICB2YXIgcGFnZSA9IGdldFBhZ2VYWShwb2ludGVyKSxcbiAgICAgICAgICAgICAgICBvcmlnaW4gPSBnZXRPcmlnaW5YWShkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpLFxuICAgICAgICAgICAgICAgIGhvcml6b250YWwsXG4gICAgICAgICAgICAgICAgdmVydGljYWw7XG5cbiAgICAgICAgICAgIHBhZ2UueCArPSBvcmlnaW4ueDtcbiAgICAgICAgICAgIHBhZ2UueSArPSBvcmlnaW4ueTtcblxuICAgICAgICAgICAgaG9yaXpvbnRhbCA9IChwYWdlLnggPiByZWN0LmxlZnQpICYmIChwYWdlLnggPCByZWN0LnJpZ2h0KTtcbiAgICAgICAgICAgIHZlcnRpY2FsICAgPSAocGFnZS55ID4gcmVjdC50b3AgKSAmJiAocGFnZS55IDwgcmVjdC5ib3R0b20pO1xuXG4gICAgICAgICAgICBkcm9wcGVkID0gaG9yaXpvbnRhbCAmJiB2ZXJ0aWNhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkcmFnUmVjdCA9IGRyYWdnYWJsZS5nZXRSZWN0KGRyYWdnYWJsZUVsZW1lbnQpO1xuXG4gICAgICAgIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgIHZhciBjeCA9IGRyYWdSZWN0LmxlZnQgKyBkcmFnUmVjdC53aWR0aCAgLyAyLFxuICAgICAgICAgICAgICAgIGN5ID0gZHJhZ1JlY3QudG9wICArIGRyYWdSZWN0LmhlaWdodCAvIDI7XG5cbiAgICAgICAgICAgIGRyb3BwZWQgPSBjeCA+PSByZWN0LmxlZnQgJiYgY3ggPD0gcmVjdC5yaWdodCAmJiBjeSA+PSByZWN0LnRvcCAmJiBjeSA8PSByZWN0LmJvdHRvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc051bWJlcihkcm9wT3ZlcmxhcCkpIHtcbiAgICAgICAgICAgIHZhciBvdmVybGFwQXJlYSAgPSAoTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5yaWdodCAsIGRyYWdSZWN0LnJpZ2h0ICkgLSBNYXRoLm1heChyZWN0LmxlZnQsIGRyYWdSZWN0LmxlZnQpKVxuICAgICAgICAgICAgICAgICogTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5ib3R0b20sIGRyYWdSZWN0LmJvdHRvbSkgLSBNYXRoLm1heChyZWN0LnRvcCAsIGRyYWdSZWN0LnRvcCApKSksXG4gICAgICAgICAgICAgICAgb3ZlcmxhcFJhdGlvID0gb3ZlcmxhcEFyZWEgLyAoZHJhZ1JlY3Qud2lkdGggKiBkcmFnUmVjdC5oZWlnaHQpO1xuXG4gICAgICAgICAgICBkcm9wcGVkID0gb3ZlcmxhcFJhdGlvID49IGRyb3BPdmVybGFwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlcikge1xuICAgICAgICAgICAgZHJvcHBlZCA9IHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlcihwb2ludGVyLCBkcm9wcGVkLCB0aGlzLCBkcm9wRWxlbWVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkcm9wcGVkO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmRyb3BDaGVja2VyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjaGVjayBpZiBhIGRyYWdnZWQgZWxlbWVudCBpc1xuICAgICAqIG92ZXIgdGhpcyBJbnRlcmFjdGFibGUuXG4gICAgICpcbiAgICAgLSBjaGVja2VyIChmdW5jdGlvbikgI29wdGlvbmFsIFRoZSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gY2hlY2tpbmcgZm9yIGEgZHJvcFxuICAgICA9IChGdW5jdGlvbiB8IEludGVyYWN0YWJsZSkgVGhlIGNoZWNrZXIgZnVuY3Rpb24gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICAqIFRoZSBjaGVja2VyIGZ1bmN0aW9uIHRha2VzIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICAqXG4gICAgIC0gcG9pbnRlciAoVG91Y2ggfCBQb2ludGVyRXZlbnQgfCBNb3VzZUV2ZW50KSBUaGUgcG9pbnRlci9ldmVudCB0aGF0IGVuZHMgYSBkcmFnXG4gICAgIC0gZXZlbnQgKFRvdWNoRXZlbnQgfCBQb2ludGVyRXZlbnQgfCBNb3VzZUV2ZW50KSBUaGUgZXZlbnQgcmVsYXRlZCB0byB0aGUgcG9pbnRlclxuICAgICAtIGRyb3BwZWQgKGJvb2xlYW4pIFRoZSB2YWx1ZSBmcm9tIHRoZSBkZWZhdWx0IGRyb3AgY2hlY2tcbiAgICAgLSBkcm9wem9uZSAoSW50ZXJhY3RhYmxlKSBUaGUgZHJvcHpvbmUgaW50ZXJhY3RhYmxlXG4gICAgIC0gZHJvcEVsZW1lbnQgKEVsZW1lbnQpIFRoZSBkcm9wem9uZSBlbGVtZW50XG4gICAgIC0gZHJhZ2dhYmxlIChJbnRlcmFjdGFibGUpIFRoZSBJbnRlcmFjdGFibGUgYmVpbmcgZHJhZ2dlZFxuICAgICAtIGRyYWdnYWJsZUVsZW1lbnQgKEVsZW1lbnQpIFRoZSBhY3R1YWwgZWxlbWVudCB0aGF0J3MgYmVpbmcgZHJhZ2dlZFxuICAgICAqXG4gICAgID4gVXNhZ2U6XG4gICAgIHwgaW50ZXJhY3QodGFyZ2V0KVxuICAgICB8IC5kcm9wQ2hlY2tlcihmdW5jdGlvbihwb2ludGVyLCAgICAgICAgICAgLy8gVG91Y2gvUG9pbnRlckV2ZW50L01vdXNlRXZlbnRcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQsICAgICAgICAgICAgIC8vIFRvdWNoRXZlbnQvUG9pbnRlckV2ZW50L01vdXNlRXZlbnRcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJvcHBlZCwgICAgICAgICAgIC8vIHJlc3VsdCBvZiB0aGUgZGVmYXVsdCBjaGVja2VyXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lLCAgICAgICAgICAvLyBkcm9wem9uZSBJbnRlcmFjdGFibGVcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJvcEVsZW1lbnQsICAgICAgIC8vIGRyb3B6b25lIGVsZW1udFxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUsICAgICAgICAgLy8gZHJhZ2dhYmxlIEludGVyYWN0YWJsZVxuICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGVFbGVtZW50KSB7Ly8gZHJhZ2dhYmxlIGVsZW1lbnRcbiAgICAgfFxuICAgICB8ICAgcmV0dXJuIGRyb3BwZWQgJiYgZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnYWxsb3ctZHJvcCcpO1xuICAgICB8IH1cbiAgICAgXFwqL1xuICAgIGRyb3BDaGVja2VyOiBmdW5jdGlvbiAoY2hlY2tlcikge1xuICAgICAgICBpZiAoaXNGdW5jdGlvbihjaGVja2VyKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3BDaGVja2VyID0gY2hlY2tlcjtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZ2V0UmVjdDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRyb3BDaGVja2VyO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmFjY2VwdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEZXByZWNhdGVkLiBhZGQgYW4gYGFjY2VwdGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB0b1xuICAgICAqIEBJbnRlcmFjdGFibGUuZHJvcHpvbmUgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgRWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgbWF0Y2ggdGhhdCB0aGlzXG4gICAgICogSW50ZXJhY3RhYmxlIGFjY2VwdHMgaWYgaXQgaXMgYSBkcm9wem9uZS5cbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChFbGVtZW50IHwgc3RyaW5nIHwgbnVsbCkgI29wdGlvbmFsXG4gICAgICogSWYgaXQgaXMgYW4gRWxlbWVudCwgdGhlbiBvbmx5IHRoYXQgZWxlbWVudCBjYW4gYmUgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmUuXG4gICAgICogSWYgaXQgaXMgYSBzdHJpbmcsIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQgbXVzdCBtYXRjaCBpdCBhcyBhIHNlbGVjdG9yLlxuICAgICAqIElmIGl0IGlzIG51bGwsIHRoZSBhY2NlcHQgb3B0aW9ucyBpcyBjbGVhcmVkIC0gaXQgYWNjZXB0cyBhbnkgZWxlbWVudC5cbiAgICAgKlxuICAgICA9IChzdHJpbmcgfCBFbGVtZW50IHwgbnVsbCB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgYWNjZXB0IG9wdGlvbiBpZiBnaXZlbiBgdW5kZWZpbmVkYCBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgYWNjZXB0OiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKGlzRWxlbWVudChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmFjY2VwdCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRlc3QgaWYgaXQgaXMgYSB2YWxpZCBDU1Mgc2VsZWN0b3JcbiAgICAgICAgaWYgKHRyeVNlbGVjdG9yKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0ID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0O1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJvcC5hY2NlcHQ7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUucmVzaXphYmxlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHJlc2l6ZSBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlXG4gICAgICogSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoaXMgY2FuIGJlIHRoZSB0YXJnZXQgb2YgcmVzaXplIGVsZW1lbnRzXG4gICAgIHwgdmFyIGlzUmVzaXplYWJsZSA9IGludGVyYWN0KCdpbnB1dFt0eXBlPXRleHRdJykucmVzaXphYmxlKCk7XG4gICAgICogb3JcbiAgICAgLSBvcHRpb25zIChib29sZWFuIHwgb2JqZWN0KSAjb3B0aW9uYWwgdHJ1ZS9mYWxzZSBvciBBbiBvYmplY3Qgd2l0aCBldmVudCBsaXN0ZW5lcnMgdG8gYmUgZmlyZWQgb24gcmVzaXplIGV2ZW50cyAob2JqZWN0IG1ha2VzIHRoZSBJbnRlcmFjdGFibGUgcmVzaXphYmxlKVxuICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkucmVzaXphYmxlKHtcbiAgICAgfCAgICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfCAgICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgfFxuICAgICB8ICAgICBlZGdlczoge1xuICAgICB8ICAgICAgIHRvcCAgIDogdHJ1ZSwgICAgICAgLy8gVXNlIHBvaW50ZXIgY29vcmRzIHRvIGNoZWNrIGZvciByZXNpemUuXG4gICAgIHwgICAgICAgbGVmdCAgOiBmYWxzZSwgICAgICAvLyBEaXNhYmxlIHJlc2l6aW5nIGZyb20gbGVmdCBlZGdlLlxuICAgICB8ICAgICAgIGJvdHRvbTogJy5yZXNpemUtcycsLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IG1hdGNoZXMgc2VsZWN0b3JcbiAgICAgfCAgICAgICByaWdodCA6IGhhbmRsZUVsICAgIC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBpcyB0aGUgZ2l2ZW4gRWxlbWVudFxuICAgICB8ICAgICB9LFxuICAgICB8XG4gICAgIHwgICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAgfCAgICAgLy8gJ25lZ2F0ZScgd2lsbCBhbGxvdyB0aGUgcmVjdCB0byBoYXZlIG5lZ2F0aXZlIHdpZHRoL2hlaWdodFxuICAgICB8ICAgICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICAgfCAgICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIGFuZC9vciBzd2FwcGluZyB0aGUgbGVmdCBhbmQgcmlnaHQgZWRnZXNcbiAgICAgfCAgICAgaW52ZXJ0OiAnbm9uZScgfHwgJ25lZ2F0ZScgfHwgJ3JlcG9zaXRpb24nXG4gICAgIHxcbiAgICAgfCAgICAgLy8gbGltaXQgbXVsdGlwbGUgcmVzaXplcy5cbiAgICAgfCAgICAgLy8gU2VlIHRoZSBleHBsYW5hdGlvbiBpbiB0aGUgQEludGVyYWN0YWJsZS5kcmFnZ2FibGUgZXhhbXBsZVxuICAgICB8ICAgICBtYXg6IEluZmluaXR5LFxuICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAxLFxuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgcmVzaXphYmxlOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oJ3Jlc2l6ZScsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygncmVzaXplJywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIGlmICgvXngkfF55JHxeeHkkLy50ZXN0KG9wdGlvbnMuYXhpcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmF4aXMgPSBvcHRpb25zLmF4aXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLmF4aXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmF4aXMgPSBkZWZhdWx0T3B0aW9ucy5yZXNpemUuYXhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzQm9vbChvcHRpb25zLnNxdWFyZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLnNxdWFyZSA9IG9wdGlvbnMuc3F1YXJlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnJlc2l6ZTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5zcXVhcmVSZXNpemVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRGVwcmVjYXRlZC4gQWRkIGEgYHNxdWFyZTogdHJ1ZSB8fCBmYWxzZWAgcHJvcGVydHkgdG8gQEludGVyYWN0YWJsZS5yZXNpemFibGUgaW5zdGVhZFxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXppbmcgaXMgZm9yY2VkIDE6MSBhc3BlY3RcbiAgICAgKlxuICAgICA9IChib29sZWFuKSBDdXJyZW50IHNldHRpbmdcbiAgICAgKlxuICAgICAqIG9yXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsXG4gICAgID0gKG9iamVjdCkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIHNxdWFyZVJlc2l6ZTogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChpc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLnNxdWFyZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5yZXNpemUuc3F1YXJlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMucmVzaXplLnNxdWFyZTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5nZXN0dXJhYmxlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIG11bHRpdG91Y2ggZ2VzdHVyZXMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGVcbiAgICAgKiBJbnRlcmFjdGFibGUncyBlbGVtZW50XG4gICAgICpcbiAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoaXMgY2FuIGJlIHRoZSB0YXJnZXQgb2YgZ2VzdHVyZSBldmVudHNcbiAgICAgfCB2YXIgaXNHZXN0dXJlYWJsZSA9IGludGVyYWN0KGVsZW1lbnQpLmdlc3R1cmFibGUoKTtcbiAgICAgKiBvclxuICAgICAtIG9wdGlvbnMgKGJvb2xlYW4gfCBvYmplY3QpICNvcHRpb25hbCB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50IGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiBnZXN0dXJlIGV2ZW50cyAobWFrZXMgdGhlIEludGVyYWN0YWJsZSBnZXN0dXJhYmxlKVxuICAgICA9IChvYmplY3QpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuZ2VzdHVyYWJsZSh7XG4gICAgIHwgICAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHwgICAgIG9uZW5kICA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgIHxcbiAgICAgfCAgICAgLy8gbGltaXQgbXVsdGlwbGUgZ2VzdHVyZXMuXG4gICAgIHwgICAgIC8vIFNlZSB0aGUgZXhwbGFuYXRpb24gaW4gQEludGVyYWN0YWJsZS5kcmFnZ2FibGUgZXhhbXBsZVxuICAgICB8ICAgICBtYXg6IEluZmluaXR5LFxuICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAxLFxuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgZ2VzdHVyYWJsZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ2VzdHVyZS5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbignZ2VzdHVyZScsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygnZ2VzdHVyZScsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZ2VzdHVyZTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5hdXRvU2Nyb2xsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkLiBBZGQgYW4gYGF1dG9zY3JvbGxgIHByb3BlcnR5IHRvIHRoZSBvcHRpb25zIG9iamVjdFxuICAgICAqIHBhc3NlZCB0byBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBvciBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgZHJhZ2dpbmcgYW5kIHJlc2l6aW5nIG5lYXIgdGhlIGVkZ2VzIG9mIHRoZVxuICAgICAqIHdpbmRvdy9jb250YWluZXIgdHJpZ2dlciBhdXRvU2Nyb2xsIGZvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqXG4gICAgID0gKG9iamVjdCkgT2JqZWN0IHdpdGggYXV0b1Njcm9sbCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBvclxuICAgICAqXG4gICAgIC0gb3B0aW9ucyAob2JqZWN0IHwgYm9vbGVhbikgI29wdGlvbmFsXG4gICAgICogb3B0aW9ucyBjYW4gYmU6XG4gICAgICogLSBhbiBvYmplY3Qgd2l0aCBtYXJnaW4sIGRpc3RhbmNlIGFuZCBpbnRlcnZhbCBwcm9wZXJ0aWVzLFxuICAgICAqIC0gdHJ1ZSBvciBmYWxzZSB0byBlbmFibGUgb3IgZGlzYWJsZSBhdXRvU2Nyb2xsIG9yXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGF1dG9TY3JvbGw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IGV4dGVuZCh7IGFjdGlvbnM6IFsnZHJhZycsICdyZXNpemUnXX0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHsgYWN0aW9uczogWydkcmFnJywgJ3Jlc2l6ZSddLCBlbmFibGVkOiBvcHRpb25zIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zZXRPcHRpb25zKCdhdXRvU2Nyb2xsJywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuc25hcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZC4gQWRkIGEgYHNuYXBgIHByb3BlcnR5IHRvIHRoZSBvcHRpb25zIG9iamVjdCBwYXNzZWRcbiAgICAgKiB0byBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBvciBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIGlmIGFuZCBob3cgYWN0aW9uIGNvb3JkaW5hdGVzIGFyZSBzbmFwcGVkLiBCeVxuICAgICAqIGRlZmF1bHQsIHNuYXBwaW5nIGlzIHJlbGF0aXZlIHRvIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzLiBZb3UgY2FuXG4gICAgICogY2hhbmdlIHRoaXMgYnkgc2V0dGluZyB0aGVcbiAgICAgKiBbYGVsZW1lbnRPcmlnaW5gXShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9wdWxsLzcyKS5cbiAgICAgKipcbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgYGZhbHNlYCBpZiBzbmFwIGlzIGRpc2FibGVkOyBvYmplY3Qgd2l0aCBzbmFwIHByb3BlcnRpZXMgaWYgc25hcCBpcyBlbmFibGVkXG4gICAgICoqXG4gICAgICogb3JcbiAgICAgKipcbiAgICAgLSBvcHRpb25zIChvYmplY3QgfCBib29sZWFuIHwgbnVsbCkgI29wdGlvbmFsXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgPiBVc2FnZVxuICAgICB8IGludGVyYWN0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN0aGluZycpKS5zbmFwKHtcbiAgICAgfCAgICAgdGFyZ2V0czogW1xuICAgICB8ICAgICAgICAgLy8gc25hcCB0byB0aGlzIHNwZWNpZmljIHBvaW50XG4gICAgIHwgICAgICAgICB7XG4gICAgIHwgICAgICAgICAgICAgeDogMTAwLFxuICAgICB8ICAgICAgICAgICAgIHk6IDEwMCxcbiAgICAgfCAgICAgICAgICAgICByYW5nZTogMjVcbiAgICAgfCAgICAgICAgIH0sXG4gICAgIHwgICAgICAgICAvLyBnaXZlIHRoaXMgZnVuY3Rpb24gdGhlIHggYW5kIHkgcGFnZSBjb29yZHMgYW5kIHNuYXAgdG8gdGhlIG9iamVjdCByZXR1cm5lZFxuICAgICB8ICAgICAgICAgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgfCAgICAgICAgICAgICByZXR1cm4ge1xuICAgICB8ICAgICAgICAgICAgICAgICB4OiB4LFxuICAgICB8ICAgICAgICAgICAgICAgICB5OiAoNzUgKyA1MCAqIE1hdGguc2luKHggKiAwLjA0KSksXG4gICAgIHwgICAgICAgICAgICAgICAgIHJhbmdlOiA0MFxuICAgICB8ICAgICAgICAgICAgIH07XG4gICAgIHwgICAgICAgICB9LFxuICAgICB8ICAgICAgICAgLy8gY3JlYXRlIGEgZnVuY3Rpb24gdGhhdCBzbmFwcyB0byBhIGdyaWRcbiAgICAgfCAgICAgICAgIGludGVyYWN0LmNyZWF0ZVNuYXBHcmlkKHtcbiAgICAgfCAgICAgICAgICAgICB4OiA1MCxcbiAgICAgfCAgICAgICAgICAgICB5OiA1MCxcbiAgICAgfCAgICAgICAgICAgICByYW5nZTogMTAsICAgICAgICAgICAgICAvLyBvcHRpb25hbFxuICAgICB8ICAgICAgICAgICAgIG9mZnNldDogeyB4OiA1LCB5OiAxMCB9IC8vIG9wdGlvbmFsXG4gICAgIHwgICAgICAgICB9KVxuICAgICB8ICAgICBdLFxuICAgICB8ICAgICAvLyBkbyBub3Qgc25hcCBkdXJpbmcgbm9ybWFsIG1vdmVtZW50LlxuICAgICB8ICAgICAvLyBJbnN0ZWFkLCB0cmlnZ2VyIG9ubHkgb25lIHNuYXBwZWQgbW92ZSBldmVudFxuICAgICB8ICAgICAvLyBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGVuZCBldmVudC5cbiAgICAgfCAgICAgZW5kT25seTogdHJ1ZSxcbiAgICAgfFxuICAgICB8ICAgICByZWxhdGl2ZVBvaW50czogW1xuICAgICB8ICAgICAgICAgeyB4OiAwLCB5OiAwIH0sICAvLyBzbmFwIHJlbGF0aXZlIHRvIHRoZSB0b3AgbGVmdCBvZiB0aGUgZWxlbWVudFxuICAgICB8ICAgICAgICAgeyB4OiAxLCB5OiAxIH0sICAvLyBhbmQgYWxzbyB0byB0aGUgYm90dG9tIHJpZ2h0XG4gICAgIHwgICAgIF0sXG4gICAgIHxcbiAgICAgfCAgICAgLy8gb2Zmc2V0IHRoZSBzbmFwIHRhcmdldCBjb29yZGluYXRlc1xuICAgICB8ICAgICAvLyBjYW4gYmUgYW4gb2JqZWN0IHdpdGggeC95IG9yICdzdGFydENvb3JkcydcbiAgICAgfCAgICAgb2Zmc2V0OiB7IHg6IDUwLCB5OiA1MCB9XG4gICAgIHwgICB9XG4gICAgIHwgfSk7XG4gICAgIFxcKi9cbiAgICBzbmFwOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgcmV0ID0gdGhpcy5zZXRPcHRpb25zKCdzbmFwJywgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKHJldCA9PT0gdGhpcykgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgIHJldHVybiByZXQuZHJhZztcbiAgICB9LFxuXG4gICAgc2V0T3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgYWN0aW9ucyA9IG9wdGlvbnMgJiYgaXNBcnJheShvcHRpb25zLmFjdGlvbnMpXG4gICAgICAgICAgICA/IG9wdGlvbnMuYWN0aW9uc1xuICAgICAgICAgICAgOiBbJ2RyYWcnXTtcblxuICAgICAgICB2YXIgaTtcblxuICAgICAgICBpZiAoaXNPYmplY3Qob3B0aW9ucykgfHwgaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSAvcmVzaXplLy50ZXN0KGFjdGlvbnNbaV0pPyAncmVzaXplJyA6IGFjdGlvbnNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWlzT2JqZWN0KHRoaXMub3B0aW9uc1thY3Rpb25dKSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNPcHRpb24gPSB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZCh0aGlzT3B0aW9uLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbiA9PT0gJ3NuYXAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc09wdGlvbi5tb2RlID09PSAnZ3JpZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnRhcmdldHMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0LmNyZWF0ZVNuYXBHcmlkKGV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHRoaXNPcHRpb24uZ3JpZE9mZnNldCB8fCB7IHg6IDAsIHk6IDAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB0aGlzT3B0aW9uLmdyaWQgfHwge30pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzT3B0aW9uLm1vZGUgPT09ICdhbmNob3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi50YXJnZXRzID0gdGhpc09wdGlvbi5hbmNob3JzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpc09wdGlvbi5tb2RlID09PSAncGF0aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnRhcmdldHMgPSB0aGlzT3B0aW9uLnBhdGhzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJ2VsZW1lbnRPcmlnaW4nIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnJlbGF0aXZlUG9pbnRzID0gW29wdGlvbnMuZWxlbWVudE9yaWdpbl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24uZW5hYmxlZCA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXQgPSB7fSxcbiAgICAgICAgICAgIGFsbEFjdGlvbnMgPSBbJ2RyYWcnLCAncmVzaXplJywgJ2dlc3R1cmUnXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWxsQWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbiBpbiBkZWZhdWx0T3B0aW9uc1thbGxBY3Rpb25zW2ldXSkge1xuICAgICAgICAgICAgICAgIHJldFthbGxBY3Rpb25zW2ldXSA9IHRoaXMub3B0aW9uc1thbGxBY3Rpb25zW2ldXVtvcHRpb25dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmluZXJ0aWFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhbiBgaW5lcnRpYWAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZFxuICAgICAqIHRvIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIG9yIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgaWYgYW5kIGhvdyBldmVudHMgY29udGludWUgdG8gcnVuIGFmdGVyIHRoZSBwb2ludGVyIGlzIHJlbGVhc2VkXG4gICAgICoqXG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIGBmYWxzZWAgaWYgaW5lcnRpYSBpcyBkaXNhYmxlZDsgYG9iamVjdGAgd2l0aCBpbmVydGlhIHByb3BlcnRpZXMgaWYgaW5lcnRpYSBpcyBlbmFibGVkXG4gICAgICoqXG4gICAgICogb3JcbiAgICAgKipcbiAgICAgLSBvcHRpb25zIChvYmplY3QgfCBib29sZWFuIHwgbnVsbCkgI29wdGlvbmFsXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIGVuYWJsZSBhbmQgdXNlIGRlZmF1bHQgc2V0dGluZ3NcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pbmVydGlhKHRydWUpO1xuICAgICB8XG4gICAgIHwgLy8gZW5hYmxlIGFuZCB1c2UgY3VzdG9tIHNldHRpbmdzXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaW5lcnRpYSh7XG4gICAgIHwgICAgIC8vIHZhbHVlIGdyZWF0ZXIgdGhhbiAwXG4gICAgIHwgICAgIC8vIGhpZ2ggdmFsdWVzIHNsb3cgdGhlIG9iamVjdCBkb3duIG1vcmUgcXVpY2tseVxuICAgICB8ICAgICByZXNpc3RhbmNlICAgICA6IDE2LFxuICAgICB8XG4gICAgIHwgICAgIC8vIHRoZSBtaW5pbXVtIGxhdW5jaCBzcGVlZCAocGl4ZWxzIHBlciBzZWNvbmQpIHRoYXQgcmVzdWx0cyBpbiBpbmVydGlhIHN0YXJ0XG4gICAgIHwgICAgIG1pblNwZWVkICAgICAgIDogMjAwLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGluZXJ0aWEgd2lsbCBzdG9wIHdoZW4gdGhlIG9iamVjdCBzbG93cyBkb3duIHRvIHRoaXMgc3BlZWRcbiAgICAgfCAgICAgZW5kU3BlZWQgICAgICAgOiAyMCxcbiAgICAgfFxuICAgICB8ICAgICAvLyBib29sZWFuOyBzaG91bGQgYWN0aW9ucyBiZSByZXN1bWVkIHdoZW4gdGhlIHBvaW50ZXIgZ29lcyBkb3duIGR1cmluZyBpbmVydGlhXG4gICAgIHwgICAgIGFsbG93UmVzdW1lICAgIDogdHJ1ZSxcbiAgICAgfFxuICAgICB8ICAgICAvLyBib29sZWFuOyBzaG91bGQgdGhlIGp1bXAgd2hlbiByZXN1bWluZyBmcm9tIGluZXJ0aWEgYmUgaWdub3JlZCBpbiBldmVudC5keC9keVxuICAgICB8ICAgICB6ZXJvUmVzdW1lRGVsdGE6IGZhbHNlLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGlmIHNuYXAvcmVzdHJpY3QgYXJlIHNldCB0byBiZSBlbmRPbmx5IGFuZCBpbmVydGlhIGlzIGVuYWJsZWQsIHJlbGVhc2luZ1xuICAgICB8ICAgICAvLyB0aGUgcG9pbnRlciB3aXRob3V0IHRyaWdnZXJpbmcgaW5lcnRpYSB3aWxsIGFuaW1hdGUgZnJvbSB0aGUgcmVsZWFzZVxuICAgICB8ICAgICAvLyBwb2ludCB0byB0aGUgc25hcGVkL3Jlc3RyaWN0ZWQgcG9pbnQgaW4gdGhlIGdpdmVuIGFtb3VudCBvZiB0aW1lIChtcylcbiAgICAgfCAgICAgc21vb3RoRW5kRHVyYXRpb246IDMwMCxcbiAgICAgfFxuICAgICB8ICAgICAvLyBhbiBhcnJheSBvZiBhY3Rpb24gdHlwZXMgdGhhdCBjYW4gaGF2ZSBpbmVydGlhIChubyBnZXN0dXJlKVxuICAgICB8ICAgICBhY3Rpb25zICAgICAgICA6IFsnZHJhZycsICdyZXNpemUnXVxuICAgICB8IH0pO1xuICAgICB8XG4gICAgIHwgLy8gcmVzZXQgY3VzdG9tIHNldHRpbmdzIGFuZCB1c2UgYWxsIGRlZmF1bHRzXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaW5lcnRpYShudWxsKTtcbiAgICAgXFwqL1xuICAgIGluZXJ0aWE6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXQgPSB0aGlzLnNldE9wdGlvbnMoJ2luZXJ0aWEnLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAocmV0ID09PSB0aGlzKSB7IHJldHVybiB0aGlzOyB9XG5cbiAgICAgICAgcmV0dXJuIHJldC5kcmFnO1xuICAgIH0sXG5cbiAgICBnZXRBY3Rpb246IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMuZGVmYXVsdEFjdGlvbkNoZWNrZXIocG9pbnRlciwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBhY3Rpb24sIHRoaXMsIGVsZW1lbnQsIGludGVyYWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgfSxcblxuICAgIGRlZmF1bHRBY3Rpb25DaGVja2VyOiBkZWZhdWx0QWN0aW9uQ2hlY2tlcixcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuYWN0aW9uQ2hlY2tlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvblxuICAgICAqIHBvaW50ZXJEb3duXG4gICAgICpcbiAgICAgLSBjaGVja2VyIChmdW5jdGlvbiB8IG51bGwpICNvcHRpb25hbCBBIGZ1bmN0aW9uIHdoaWNoIHRha2VzIGEgcG9pbnRlciBldmVudCwgZGVmYXVsdEFjdGlvbiBzdHJpbmcsIGludGVyYWN0YWJsZSwgZWxlbWVudCBhbmQgaW50ZXJhY3Rpb24gYXMgcGFyYW1ldGVycyBhbmQgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBuYW1lIHByb3BlcnR5ICdkcmFnJyAncmVzaXplJyBvciAnZ2VzdHVyZScgYW5kIG9wdGlvbmFsbHkgYW4gYGVkZ2VzYCBvYmplY3Qgd2l0aCBib29sZWFuICd0b3AnLCAnbGVmdCcsICdib3R0b20nIGFuZCByaWdodCBwcm9wcy5cbiAgICAgPSAoRnVuY3Rpb24gfCBJbnRlcmFjdGFibGUpIFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgfCBpbnRlcmFjdCgnLnJlc2l6ZS1kcmFnJylcbiAgICAgfCAgIC5yZXNpemFibGUodHJ1ZSlcbiAgICAgfCAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICAgfCAgIC5hY3Rpb25DaGVja2VyKGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uKSB7XG4gICAgIHxcbiAgICAgfCAgIGlmIChpbnRlcmFjdC5tYXRjaGVzU2VsZWN0b3IoZXZlbnQudGFyZ2V0LCAnLmRyYWctaGFuZGxlJykge1xuICAgICB8ICAgICAvLyBmb3JjZSBkcmFnIHdpdGggaGFuZGxlIHRhcmdldFxuICAgICB8ICAgICBhY3Rpb24ubmFtZSA9IGRyYWc7XG4gICAgIHwgICB9XG4gICAgIHwgICBlbHNlIHtcbiAgICAgfCAgICAgLy8gcmVzaXplIGZyb20gdGhlIHRvcCBhbmQgcmlnaHQgZWRnZXNcbiAgICAgfCAgICAgYWN0aW9uLm5hbWUgID0gJ3Jlc2l6ZSc7XG4gICAgIHwgICAgIGFjdGlvbi5lZGdlcyA9IHsgdG9wOiB0cnVlLCByaWdodDogdHJ1ZSB9O1xuICAgICB8ICAgfVxuICAgICB8XG4gICAgIHwgICByZXR1cm4gYWN0aW9uO1xuICAgICB8IH0pO1xuICAgICBcXCovXG4gICAgYWN0aW9uQ2hlY2tlcjogZnVuY3Rpb24gKGNoZWNrZXIpIHtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oY2hlY2tlcikpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyID0gY2hlY2tlcjtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcjtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5nZXRSZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIHRvIGdldCBhbiBJbnRlcmFjdGFibGVzIGJvdW5kaW5nIHJlY3QuIENhbiBiZVxuICAgICAqIG92ZXJyaWRkZW4gdXNpbmcgQEludGVyYWN0YWJsZS5yZWN0Q2hlY2tlci5cbiAgICAgKlxuICAgICAtIGVsZW1lbnQgKEVsZW1lbnQpICNvcHRpb25hbCBUaGUgZWxlbWVudCB0byBtZWFzdXJlLlxuICAgICA9IChvYmplY3QpIFRoZSBvYmplY3QncyBib3VuZGluZyByZWN0YW5nbGUuXG4gICAgIG8ge1xuICAgICBvICAgICB0b3AgICA6IDAsXG4gICAgIG8gICAgIGxlZnQgIDogMCxcbiAgICAgbyAgICAgYm90dG9tOiAwLFxuICAgICBvICAgICByaWdodCA6IDAsXG4gICAgIG8gICAgIHdpZHRoIDogMCxcbiAgICAgbyAgICAgaGVpZ2h0OiAwXG4gICAgIG8gfVxuICAgICBcXCovXG4gICAgZ2V0UmVjdDogZnVuY3Rpb24gcmVjdENoZWNrIChlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuX2VsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0b3IgJiYgIShpc0VsZW1lbnQoZWxlbWVudCkpKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5fY29udGV4dC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldEVsZW1lbnRSZWN0KGVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnJlY3RDaGVja2VyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjYWxjdWxhdGUgdGhlIGludGVyYWN0YWJsZSdzXG4gICAgICogZWxlbWVudCdzIHJlY3RhbmdsZVxuICAgICAqXG4gICAgIC0gY2hlY2tlciAoZnVuY3Rpb24pICNvcHRpb25hbCBBIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhpcyBJbnRlcmFjdGFibGUncyBib3VuZGluZyByZWN0YW5nbGUuIFNlZSBASW50ZXJhY3RhYmxlLmdldFJlY3RcbiAgICAgPSAoZnVuY3Rpb24gfCBvYmplY3QpIFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICByZWN0Q2hlY2tlcjogZnVuY3Rpb24gKGNoZWNrZXIpIHtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oY2hlY2tlcikpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0UmVjdCA9IGNoZWNrZXI7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZ2V0UmVjdDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRSZWN0O1xuICAgIH0sXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLnN0eWxlQ3Vyc29yXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRoZSBhY3Rpb24gdGhhdCB3b3VsZCBiZSBwZXJmb3JtZWQgd2hlbiB0aGVcbiAgICAgKiBtb3VzZSBvbiB0aGUgZWxlbWVudCBhcmUgY2hlY2tlZCBvbiBgbW91c2Vtb3ZlYCBzbyB0aGF0IHRoZSBjdXJzb3JcbiAgICAgKiBtYXkgYmUgc3R5bGVkIGFwcHJvcHJpYXRlbHlcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWxcbiAgICAgPSAoYm9vbGVhbiB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgc3R5bGVDdXJzb3I6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoaXNCb29sKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3I7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUucHJldmVudERlZmF1bHRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdG8gcHJldmVudCB0aGUgYnJvd3NlcidzIGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgICogaW4gcmVzcG9uc2UgdG8gcG9pbnRlciBldmVudHMuIENhbiBiZSBzZXQgdG86XG4gICAgICogIC0gYCdhbHdheXMnYCB0byBhbHdheXMgcHJldmVudFxuICAgICAqICAtIGAnbmV2ZXInYCB0byBuZXZlciBwcmV2ZW50XG4gICAgICogIC0gYCdhdXRvJ2AgdG8gbGV0IGludGVyYWN0LmpzIHRyeSB0byBkZXRlcm1pbmUgd2hhdCB3b3VsZCBiZSBiZXN0XG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoc3RyaW5nKSAjb3B0aW9uYWwgYHRydWVgLCBgZmFsc2VgIG9yIGAnYXV0bydgXG4gICAgID0gKHN0cmluZyB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoL14oYWx3YXlzfG5ldmVyfGF1dG8pJC8udGVzdChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNCb29sKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnByZXZlbnREZWZhdWx0ID0gbmV3VmFsdWU/ICdhbHdheXMnIDogJ25ldmVyJztcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5vcmlnaW5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBvcmlnaW4gb2YgdGhlIEludGVyYWN0YWJsZSdzIGVsZW1lbnQuICBUaGUgeCBhbmQgeVxuICAgICAqIG9mIHRoZSBvcmlnaW4gd2lsbCBiZSBzdWJ0cmFjdGVkIGZyb20gYWN0aW9uIGV2ZW50IGNvb3JkaW5hdGVzLlxuICAgICAqXG4gICAgIC0gb3JpZ2luIChvYmplY3QgfCBzdHJpbmcpICNvcHRpb25hbCBBbiBvYmplY3QgZWcuIHsgeDogMCwgeTogMCB9IG9yIHN0cmluZyAncGFyZW50JywgJ3NlbGYnIG9yIGFueSBDU1Mgc2VsZWN0b3JcbiAgICAgKiBPUlxuICAgICAtIG9yaWdpbiAoRWxlbWVudCkgI29wdGlvbmFsIEFuIEhUTUwgb3IgU1ZHIEVsZW1lbnQgd2hvc2UgcmVjdCB3aWxsIGJlIHVzZWRcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBUaGUgY3VycmVudCBvcmlnaW4gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIG9yaWdpbjogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmICh0cnlTZWxlY3RvcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vcmlnaW4gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzT2JqZWN0KG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLm9yaWdpbiA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm9yaWdpbjtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5kZWx0YVNvdXJjZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1vdXNlIGNvb3JkaW5hdGUgdHlwZXMgdXNlZCB0byBjYWxjdWxhdGUgdGhlXG4gICAgICogbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXIuXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoc3RyaW5nKSAjb3B0aW9uYWwgVXNlICdjbGllbnQnIGlmIHlvdSB3aWxsIGJlIHNjcm9sbGluZyB3aGlsZSBpbnRlcmFjdGluZzsgVXNlICdwYWdlJyBpZiB5b3Ugd2FudCBhdXRvU2Nyb2xsIHRvIHdvcmtcbiAgICAgPSAoc3RyaW5nIHwgb2JqZWN0KSBUaGUgY3VycmVudCBkZWx0YVNvdXJjZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICBcXCovXG4gICAgZGVsdGFTb3VyY2U6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAobmV3VmFsdWUgPT09ICdwYWdlJyB8fCBuZXdWYWx1ZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2U7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUucmVzdHJpY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhIGByZXN0cmljdGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB0b1xuICAgICAqIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlLCBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBvciBASW50ZXJhY3RhYmxlLmdlc3R1cmFibGUgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgcmVjdGFuZ2xlcyB3aXRoaW4gd2hpY2ggYWN0aW9ucyBvbiB0aGlzXG4gICAgICogaW50ZXJhY3RhYmxlIChhZnRlciBzbmFwIGNhbGN1bGF0aW9ucykgYXJlIHJlc3RyaWN0ZWQuIEJ5IGRlZmF1bHQsXG4gICAgICogcmVzdHJpY3RpbmcgaXMgcmVsYXRpdmUgdG8gdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMuIFlvdSBjYW4gY2hhbmdlXG4gICAgICogdGhpcyBieSBzZXR0aW5nIHRoZVxuICAgICAqIFtgZWxlbWVudFJlY3RgXShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9wdWxsLzcyKS5cbiAgICAgKipcbiAgICAgLSBvcHRpb25zIChvYmplY3QpICNvcHRpb25hbCBhbiBvYmplY3Qgd2l0aCBrZXlzIGRyYWcsIHJlc2l6ZSwgYW5kL29yIGdlc3R1cmUgd2hvc2UgdmFsdWVzIGFyZSByZWN0cywgRWxlbWVudHMsIENTUyBzZWxlY3RvcnMsIG9yICdwYXJlbnQnIG9yICdzZWxmJ1xuICAgICA9IChvYmplY3QpIFRoZSBjdXJyZW50IHJlc3RyaWN0aW9ucyBvYmplY3Qgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5yZXN0cmljdCh7XG4gICAgIHwgICAgIC8vIHRoZSByZWN0IHdpbGwgYmUgYGludGVyYWN0LmdldEVsZW1lbnRSZWN0KGVsZW1lbnQucGFyZW50Tm9kZSlgXG4gICAgIHwgICAgIGRyYWc6IGVsZW1lbnQucGFyZW50Tm9kZSxcbiAgICAgfFxuICAgICB8ICAgICAvLyB4IGFuZCB5IGFyZSByZWxhdGl2ZSB0byB0aGUgdGhlIGludGVyYWN0YWJsZSdzIG9yaWdpblxuICAgICB8ICAgICByZXNpemU6IHsgeDogMTAwLCB5OiAxMDAsIHdpZHRoOiAyMDAsIGhlaWdodDogMjAwIH1cbiAgICAgfCB9KVxuICAgICB8XG4gICAgIHwgaW50ZXJhY3QoJy5kcmFnZ2FibGUnKS5yZXN0cmljdCh7XG4gICAgIHwgICAgIC8vIHRoZSByZWN0IHdpbGwgYmUgdGhlIHNlbGVjdGVkIGVsZW1lbnQncyBwYXJlbnRcbiAgICAgfCAgICAgZHJhZzogJ3BhcmVudCcsXG4gICAgIHxcbiAgICAgfCAgICAgLy8gZG8gbm90IHJlc3RyaWN0IGR1cmluZyBub3JtYWwgbW92ZW1lbnQuXG4gICAgIHwgICAgIC8vIEluc3RlYWQsIHRyaWdnZXIgb25seSBvbmUgcmVzdHJpY3RlZCBtb3ZlIGV2ZW50XG4gICAgIHwgICAgIC8vIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZW5kIGV2ZW50LlxuICAgICB8ICAgICBlbmRPbmx5OiB0cnVlLFxuICAgICB8XG4gICAgIHwgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL3B1bGwvNzIjaXNzdWUtNDE4MTM0OTNcbiAgICAgfCAgICAgZWxlbWVudFJlY3Q6IHsgdG9wOiAwLCBsZWZ0OiAwLCBib3R0b206IDEsIHJpZ2h0OiAxIH1cbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHJlc3RyaWN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRPcHRpb25zKCdyZXN0cmljdCcsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbJ2RyYWcnLCAncmVzaXplJywgJ2dlc3R1cmUnXSxcbiAgICAgICAgICAgIHJldDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICBpZiAoYWN0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGVyQWN0aW9uID0gZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW2FjdGlvbl0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uOiBvcHRpb25zW2FjdGlvbl1cbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIHJldCA9IHRoaXMuc2V0T3B0aW9ucygncmVzdHJpY3QnLCBwZXJBY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5jb250ZXh0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEdldHMgdGhlIHNlbGVjdG9yIGNvbnRleHQgTm9kZSBvZiB0aGUgSW50ZXJhY3RhYmxlLiBUaGUgZGVmYXVsdCBpcyBgd2luZG93LmRvY3VtZW50YC5cbiAgICAgKlxuICAgICA9IChOb2RlKSBUaGUgY29udGV4dCBOb2RlIG9mIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICoqXG4gICAgIFxcKi9cbiAgICBjb250ZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgIH0sXG5cbiAgICBfY29udGV4dDogZG9jdW1lbnQsXG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlLmlnbm9yZUZyb21cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgXG4gICAgICogZXZlbnQgb3IgYW55IG9mIGl0J3MgcGFyZW50cyBtYXRjaCB0aGUgZ2l2ZW4gQ1NTIHNlbGVjdG9yIG9yXG4gICAgICogRWxlbWVudCwgbm8gZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkLlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKHN0cmluZyB8IEVsZW1lbnQgfCBudWxsKSAjb3B0aW9uYWwgYSBDU1Mgc2VsZWN0b3Igc3RyaW5nLCBhbiBFbGVtZW50IG9yIGBudWxsYCB0byBub3QgaWdub3JlIGFueSBlbGVtZW50c1xuICAgICA9IChzdHJpbmcgfCBFbGVtZW50IHwgb2JqZWN0KSBUaGUgY3VycmVudCBpZ25vcmVGcm9tIHZhbHVlIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICoqXG4gICAgIHwgaW50ZXJhY3QoZWxlbWVudCwgeyBpZ25vcmVGcm9tOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm8tYWN0aW9uJykgfSk7XG4gICAgIHwgLy8gb3JcbiAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pZ25vcmVGcm9tKCdpbnB1dCwgdGV4dGFyZWEsIGEnKTtcbiAgICAgXFwqL1xuICAgIGlnbm9yZUZyb206IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAodHJ5U2VsZWN0b3IobmV3VmFsdWUpKSB7ICAgICAgICAgICAgLy8gQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIGV2ZW50LnRhcmdldFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmlnbm9yZUZyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzRWxlbWVudChuZXdWYWx1ZSkpIHsgICAgICAgICAgICAgIC8vIHNwZWNpZmljIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pZ25vcmVGcm9tID0gbmV3VmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaWdub3JlRnJvbTtcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5hbGxvd0Zyb21cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQSBkcmFnL3Jlc2l6ZS9nZXN0dXJlIGlzIHN0YXJ0ZWQgb25seSBJZiB0aGUgdGFyZ2V0IG9mIHRoZVxuICAgICAqIGBtb3VzZWRvd25gLCBgcG9pbnRlcmRvd25gIG9yIGB0b3VjaHN0YXJ0YCBldmVudCBvciBhbnkgb2YgaXQnc1xuICAgICAqIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvciBFbGVtZW50LlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKHN0cmluZyB8IEVsZW1lbnQgfCBudWxsKSAjb3B0aW9uYWwgYSBDU1Mgc2VsZWN0b3Igc3RyaW5nLCBhbiBFbGVtZW50IG9yIGBudWxsYCB0byBhbGxvdyBmcm9tIGFueSBlbGVtZW50XG4gICAgID0gKHN0cmluZyB8IEVsZW1lbnQgfCBvYmplY3QpIFRoZSBjdXJyZW50IGFsbG93RnJvbSB2YWx1ZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAqKlxuICAgICB8IGludGVyYWN0KGVsZW1lbnQsIHsgYWxsb3dGcm9tOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHJhZy1oYW5kbGUnKSB9KTtcbiAgICAgfCAvLyBvclxuICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmFsbG93RnJvbSgnLmhhbmRsZScpO1xuICAgICBcXCovXG4gICAgYWxsb3dGcm9tOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKHRyeVNlbGVjdG9yKG5ld1ZhbHVlKSkgeyAgICAgICAgICAgIC8vIENTUyBzZWxlY3RvciB0byBtYXRjaCBldmVudC50YXJnZXRcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hbGxvd0Zyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzRWxlbWVudChuZXdWYWx1ZSkpIHsgICAgICAgICAgICAgIC8vIHNwZWNpZmljIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hbGxvd0Zyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hbGxvd0Zyb207XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZWxlbWVudFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBJZiB0aGlzIGlzIG5vdCBhIHNlbGVjdG9yIEludGVyYWN0YWJsZSwgaXQgcmV0dXJucyB0aGUgZWxlbWVudCB0aGlzXG4gICAgICogaW50ZXJhY3RhYmxlIHJlcHJlc2VudHNcbiAgICAgKlxuICAgICA9IChFbGVtZW50KSBIVE1MIC8gU1ZHIEVsZW1lbnRcbiAgICAgXFwqL1xuICAgIGVsZW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUuZmlyZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBDYWxscyBsaXN0ZW5lcnMgZm9yIHRoZSBnaXZlbiBJbnRlcmFjdEV2ZW50IHR5cGUgYm91bmQgZ2xvYmFsbHlcbiAgICAgKiBhbmQgZGlyZWN0bHkgdG8gdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgKlxuICAgICAtIGlFdmVudCAoSW50ZXJhY3RFdmVudCkgVGhlIEludGVyYWN0RXZlbnQgb2JqZWN0IHRvIGJlIGZpcmVkIG9uIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIGZpcmU6IGZ1bmN0aW9uIChpRXZlbnQpIHtcbiAgICAgICAgaWYgKCEoaUV2ZW50ICYmIGlFdmVudC50eXBlKSB8fCAhY29udGFpbnMoZXZlbnRUeXBlcywgaUV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgb25FdmVudCA9ICdvbicgKyBpRXZlbnQudHlwZSxcbiAgICAgICAgICAgIGZ1bmNOYW1lID0gJyc7XG5cbiAgICAgICAgLy8gSW50ZXJhY3RhYmxlI29uKCkgbGlzdGVuZXJzXG4gICAgICAgIGlmIChpRXZlbnQudHlwZSBpbiB0aGlzLl9pRXZlbnRzKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSB0aGlzLl9pRXZlbnRzW2lFdmVudC50eXBlXTtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbiAmJiAhaUV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZnVuY05hbWUgPSBsaXN0ZW5lcnNbaV0ubmFtZTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0oaUV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGludGVyYWN0YWJsZS5vbmV2ZW50IGxpc3RlbmVyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbb25FdmVudF0pKSB7XG4gICAgICAgICAgICBmdW5jTmFtZSA9IHRoaXNbb25FdmVudF0ubmFtZTtcbiAgICAgICAgICAgIHRoaXNbb25FdmVudF0oaUV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGludGVyYWN0Lm9uKCkgbGlzdGVuZXJzXG4gICAgICAgIGlmIChpRXZlbnQudHlwZSBpbiBnbG9iYWxFdmVudHMgJiYgKGxpc3RlbmVycyA9IGdsb2JhbEV2ZW50c1tpRXZlbnQudHlwZV0pKSAge1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuICYmICFpRXZlbnQuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmdW5jTmFtZSA9IGxpc3RlbmVyc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXShpRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUub25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogQmluZHMgYSBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCBvciBET00gZXZlbnQuXG4gICAgICpcbiAgICAgLSBldmVudFR5cGUgIChzdHJpbmcgfCBhcnJheSB8IG9iamVjdCkgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW4gZm9yXG4gICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gdGhlIGdpdmVuIGV2ZW50KHMpXG4gICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmxlXG4gICAgIFxcKi9cbiAgICBvbjogZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgaWYgKGlzU3RyaW5nKGV2ZW50VHlwZSkgJiYgZXZlbnRUeXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlLnRyaW0oKS5zcGxpdCgvICsvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0FycmF5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBldmVudFR5cGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uKGV2ZW50VHlwZVtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc09iamVjdChldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGV2ZW50VHlwZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub24ocHJvcCwgZXZlbnRUeXBlW3Byb3BdLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ3doZWVsJykge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gd2hlZWxFdmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnZlcnQgdG8gYm9vbGVhblxuICAgICAgICB1c2VDYXB0dXJlID0gdXNlQ2FwdHVyZT8gdHJ1ZTogZmFsc2U7XG5cbiAgICAgICAgaWYgKGNvbnRhaW5zKGV2ZW50VHlwZXMsIGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoaXMgdHlwZSBvZiBldmVudCB3YXMgbmV2ZXIgYm91bmQgdG8gdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgICAgIGlmICghKGV2ZW50VHlwZSBpbiB0aGlzLl9pRXZlbnRzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lFdmVudHNbZXZlbnRUeXBlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pRXZlbnRzW2V2ZW50VHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZGVsZWdhdGVkIGV2ZW50IGZvciBzZWxlY3RvclxuICAgICAgICBlbHNlIGlmICh0aGlzLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICBpZiAoIWRlbGVnYXRlZEV2ZW50c1tldmVudFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yczogW10sXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRzIDogW10sXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gYWRkIGRlbGVnYXRlIGxpc3RlbmVyIGZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkb2N1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZChkb2N1bWVudHNbaV0sIGV2ZW50VHlwZSwgZGVsZWdhdGVMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jdW1lbnRzW2ldLCBldmVudFR5cGUsIGRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVsZWdhdGVkID0gZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0sXG4gICAgICAgICAgICAgICAgaW5kZXg7XG5cbiAgICAgICAgICAgIGZvciAoaW5kZXggPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCAtIDE7IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVsZWdhdGVkLnNlbGVjdG9yc1tpbmRleF0gPT09IHRoaXMuc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgJiYgZGVsZWdhdGVkLmNvbnRleHRzW2luZGV4XSA9PT0gdGhpcy5fY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5wdXNoKHRoaXMuc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0cyAucHVzaCh0aGlzLl9jb250ZXh0KTtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzLnB1c2goW10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBrZWVwIGxpc3RlbmVyIGFuZCB1c2VDYXB0dXJlIGZsYWdcbiAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnNbaW5kZXhdLnB1c2goW2xpc3RlbmVyLCB1c2VDYXB0dXJlXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsIGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUub2ZmXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJlbW92ZXMgYW4gSW50ZXJhY3RFdmVudCBvciBET00gZXZlbnQgbGlzdGVuZXJcbiAgICAgKlxuICAgICAtIGV2ZW50VHlwZSAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRoYXQgd2VyZSBsaXN0ZW5lZCBmb3JcbiAgICAgLSBsaXN0ZW5lciAgIChmdW5jdGlvbikgVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGJlIHJlbW92ZWRcbiAgICAgLSB1c2VDYXB0dXJlIChib29sZWFuKSAjb3B0aW9uYWwgdXNlQ2FwdHVyZSBmbGFnIGZvciByZW1vdmVFdmVudExpc3RlbmVyXG4gICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgXFwqL1xuICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgaWYgKGlzU3RyaW5nKGV2ZW50VHlwZSkgJiYgZXZlbnRUeXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlLnRyaW0oKS5zcGxpdCgvICsvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0FycmF5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBldmVudFR5cGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZihldmVudFR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNPYmplY3QoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBldmVudFR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZihwcm9wLCBldmVudFR5cGVbcHJvcF0sIGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXZlbnRMaXN0LFxuICAgICAgICAgICAgaW5kZXggPSAtMTtcblxuICAgICAgICAvLyBjb252ZXJ0IHRvIGJvb2xlYW5cbiAgICAgICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICd3aGVlbCcpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IHdoZWVsRXZlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBpdCBpcyBhbiBhY3Rpb24gZXZlbnQgdHlwZVxuICAgICAgICBpZiAoY29udGFpbnMoZXZlbnRUeXBlcywgZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgZXZlbnRMaXN0ID0gdGhpcy5faUV2ZW50c1tldmVudFR5cGVdO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnRMaXN0ICYmIChpbmRleCA9IGluZGV4T2YoZXZlbnRMaXN0LCBsaXN0ZW5lcikpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lFdmVudHNbZXZlbnRUeXBlXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGRlbGVnYXRlZCBldmVudFxuICAgICAgICBlbHNlIGlmICh0aGlzLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICB2YXIgZGVsZWdhdGVkID0gZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0sXG4gICAgICAgICAgICAgICAgbWF0Y2hGb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoIWRlbGVnYXRlZCkgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgICAgICAvLyBjb3VudCBmcm9tIGxhc3QgaW5kZXggb2YgZGVsZWdhdGVkIHRvIDBcbiAgICAgICAgICAgIGZvciAoaW5kZXggPSBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCAtIDE7IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBtYXRjaGluZyBzZWxlY3RvciBhbmQgY29udGV4dCBOb2RlXG4gICAgICAgICAgICAgICAgaWYgKGRlbGVnYXRlZC5zZWxlY3RvcnNbaW5kZXhdID09PSB0aGlzLnNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgICYmIGRlbGVnYXRlZC5jb250ZXh0c1tpbmRleF0gPT09IHRoaXMuX2NvbnRleHQpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gZGVsZWdhdGVkLmxpc3RlbmVyc1tpbmRleF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZWFjaCBpdGVtIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkgaXMgYW4gYXJyYXk6IFtmdW5jdGlvbiwgdXNlQ2FwdHVyZUZsYWddXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gbGlzdGVuZXJzW2ldWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZUNhcCA9IGxpc3RlbmVyc1tpXVsxXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGxpc3RlbmVyIGZ1bmN0aW9ucyBhbmQgdXNlQ2FwdHVyZSBmbGFncyBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZuID09PSBsaXN0ZW5lciAmJiB1c2VDYXAgPT09IHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGFycmF5IG9mIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbGwgbGlzdGVuZXJzIGZvciB0aGlzIGludGVyYWN0YWJsZSBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgaW50ZXJhY3RhYmxlIGZyb20gdGhlIGRlbGVnYXRlZCBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMgLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgZGVsZWdhdGUgZnVuY3Rpb24gZnJvbSBjb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgZXZlbnRUeXBlLCBkZWxlZ2F0ZUxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCBldmVudFR5cGUsIGRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBhcnJheXMgaWYgdGhleSBhcmUgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSByZW1vdmUgb25lIGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hGb3VuZCkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgZnJvbSB0aGlzIEludGVyYXRhYmxlJ3MgZWxlbWVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fZWxlbWVudCwgZXZlbnRUeXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0YWJsZS5zZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmVzZXQgdGhlIG9wdGlvbnMgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgLSBvcHRpb25zIChvYmplY3QpIFRoZSBuZXcgc2V0dGluZ3MgdG8gYXBwbHlcbiAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsd1xuICAgICBcXCovXG4gICAgc2V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoIWlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb25zLmJhc2UpO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgYWN0aW9ucyA9IFsnZHJhZycsICdkcm9wJywgJ3Jlc2l6ZScsICdnZXN0dXJlJ10sXG4gICAgICAgICAgICBtZXRob2RzID0gWydkcmFnZ2FibGUnLCAnZHJvcHpvbmUnLCAncmVzaXphYmxlJywgJ2dlc3R1cmFibGUnXSxcbiAgICAgICAgICAgIHBlckFjdGlvbnMgPSBleHRlbmQoZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb24pLCBvcHRpb25zW2FjdGlvbl0gfHwge30pO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYWN0aW9uc1tpXTtcblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl0gPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb25zW2FjdGlvbl0pO1xuXG4gICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbihhY3Rpb24sIHBlckFjdGlvbnMpO1xuXG4gICAgICAgICAgICB0aGlzW21ldGhvZHNbaV1dKG9wdGlvbnNbYWN0aW9uXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2V0dGluZ3MgPSBbXG4gICAgICAgICAgICAnYWNjZXB0JywgJ2FjdGlvbkNoZWNrZXInLCAnYWxsb3dGcm9tJywgJ2RlbHRhU291cmNlJyxcbiAgICAgICAgICAgICdkcm9wQ2hlY2tlcicsICdpZ25vcmVGcm9tJywgJ29yaWdpbicsICdwcmV2ZW50RGVmYXVsdCcsXG4gICAgICAgICAgICAncmVjdENoZWNrZXInXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gc2V0dGluZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0gc2V0dGluZ3NbaV07XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzZXR0aW5nXSA9IGRlZmF1bHRPcHRpb25zLmJhc2Vbc2V0dGluZ107XG5cbiAgICAgICAgICAgIGlmIChzZXR0aW5nIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRpbmddKG9wdGlvbnNbc2V0dGluZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qXFxcbiAgICAgKiBJbnRlcmFjdGFibGUudW5zZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmVtb3ZlIHRoaXMgaW50ZXJhY3RhYmxlIGZyb20gdGhlIGxpc3Qgb2YgaW50ZXJhY3RhYmxlcyBhbmQgcmVtb3ZlXG4gICAgICogaXQncyBkcmFnLCBkcm9wLCByZXNpemUgYW5kIGdlc3R1cmUgY2FwYWJpbGl0aWVzXG4gICAgICpcbiAgICAgPSAob2JqZWN0KSBAaW50ZXJhY3RcbiAgICAgXFwqL1xuICAgIHVuc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fZWxlbWVudCwgJ2FsbCcpO1xuXG4gICAgICAgIGlmICghaXNTdHJpbmcodGhpcy5zZWxlY3RvcikpIHtcbiAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcywgJ2FsbCcpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgZGVsZWdhdGVkIGV2ZW50c1xuICAgICAgICAgICAgZm9yICh2YXIgdHlwZSBpbiBkZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVsZWdhdGVkID0gZGVsZWdhdGVkRXZlbnRzW3R5cGVdO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzW2ldID09PSB0aGlzLnNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiBkZWxlZ2F0ZWQuY29udGV4dHNbaV0gPT09IHRoaXMuX2NvbnRleHQpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMgLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGFycmF5cyBpZiB0aGV5IGFyZSBlbXB0eVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZEV2ZW50c1t0eXBlXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGRlbGVnYXRlTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kcm9wem9uZShmYWxzZSk7XG5cbiAgICAgICAgaW50ZXJhY3RhYmxlcy5zcGxpY2UoaW5kZXhPZihpbnRlcmFjdGFibGVzLCB0aGlzKSwgMSk7XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHdhcm5PbmNlIChtZXRob2QsIG1lc3NhZ2UpIHtcbiAgICB2YXIgd2FybmVkID0gZmFsc2U7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgICAgICAgd2luZG93LmNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zbmFwID0gd2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zbmFwLFxuICAgICdJbnRlcmFjdGFibGUjc25hcCBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBzbmFwcGluZyBhdCBodHRwOi8vaW50ZXJhY3Rqcy5pby9kb2NzL3NuYXBwaW5nJyk7XG5JbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc3RyaWN0ID0gd2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5yZXN0cmljdCxcbiAgICAnSW50ZXJhY3RhYmxlI3Jlc3RyaWN0IGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIHJlc3RpY3RpbmcgYXQgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy9yZXN0cmljdGlvbicpO1xuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5pbmVydGlhID0gd2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5pbmVydGlhLFxuICAgICdJbnRlcmFjdGFibGUjaW5lcnRpYSBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBpbmVydGlhIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvaW5lcnRpYScpO1xuSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hdXRvU2Nyb2xsID0gd2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hdXRvU2Nyb2xsLFxuICAgICdJbnRlcmFjdGFibGUjYXV0b1Njcm9sbCBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBhdXRvU2Nyb2xsIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvI2F1dG9zY3JvbGwnKTtcbkludGVyYWN0YWJsZS5wcm90b3R5cGUuc3F1YXJlUmVzaXplID0gd2Fybk9uY2UoSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zcXVhcmVSZXNpemUsXG4gICAgJ0ludGVyYWN0YWJsZSNzcXVhcmVSZXNpemUgaXMgZGVwcmVjYXRlZC4gU2VlIGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvI3Jlc2l6ZS1zcXVhcmUnKTtcblxuLypcXFxuICogaW50ZXJhY3QuaXNTZXRcbiBbIG1ldGhvZCBdXG4gKlxuICogQ2hlY2sgaWYgYW4gZWxlbWVudCBoYXMgYmVlbiBzZXRcbiAtIGVsZW1lbnQgKEVsZW1lbnQpIFRoZSBFbGVtZW50IGJlaW5nIHNlYXJjaGVkIGZvclxuID0gKGJvb2xlYW4pIEluZGljYXRlcyBpZiB0aGUgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3Igd2FzIHByZXZpb3VzbHkgcGFzc2VkIHRvIGludGVyYWN0XG4gXFwqL1xuaW50ZXJhY3QuaXNTZXQgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGludGVyYWN0YWJsZXMuaW5kZXhPZkVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyAmJiBvcHRpb25zLmNvbnRleHQpICE9PSAtMTtcbn07XG5cbi8qXFxcbiAqIGludGVyYWN0Lm9uXG4gWyBtZXRob2QgXVxuICpcbiAqIEFkZHMgYSBnbG9iYWwgbGlzdGVuZXIgZm9yIGFuIEludGVyYWN0RXZlbnQgb3IgYWRkcyBhIERPTSBldmVudCB0b1xuICogYGRvY3VtZW50YFxuICpcbiAtIHR5cGUgICAgICAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRvIGxpc3RlbiBmb3JcbiAtIGxpc3RlbmVyICAgKGZ1bmN0aW9uKSBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHRoZSBnaXZlbiBldmVudChzKVxuIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuID0gKG9iamVjdCkgaW50ZXJhY3RcbiBcXCovXG5pbnRlcmFjdC5vbiA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgIGlmIChpc1N0cmluZyh0eXBlKSAmJiB0eXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICB0eXBlID0gdHlwZS50cmltKCkuc3BsaXQoLyArLyk7XG4gICAgfVxuXG4gICAgaWYgKGlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpbnRlcmFjdC5vbih0eXBlW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgfVxuXG4gICAgaWYgKGlzT2JqZWN0KHR5cGUpKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gdHlwZSkge1xuICAgICAgICAgICAgaW50ZXJhY3Qub24ocHJvcCwgdHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH1cblxuICAgIC8vIGlmIGl0IGlzIGFuIEludGVyYWN0RXZlbnQgdHlwZSwgYWRkIGxpc3RlbmVyIHRvIGdsb2JhbEV2ZW50c1xuICAgIGlmIChjb250YWlucyhldmVudFR5cGVzLCB0eXBlKSkge1xuICAgICAgICAvLyBpZiB0aGlzIHR5cGUgb2YgZXZlbnQgd2FzIG5ldmVyIGJvdW5kXG4gICAgICAgIGlmICghZ2xvYmFsRXZlbnRzW3R5cGVdKSB7XG4gICAgICAgICAgICBnbG9iYWxFdmVudHNbdHlwZV0gPSBbbGlzdGVuZXJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ2xvYmFsRXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIElmIG5vbiBJbnRlcmFjdEV2ZW50IHR5cGUsIGFkZEV2ZW50TGlzdGVuZXIgdG8gZG9jdW1lbnRcbiAgICBlbHNlIHtcbiAgICAgICAgZXZlbnRzLmFkZChkb2N1bWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdDtcbn07XG5cbi8qXFxcbiAqIGludGVyYWN0Lm9mZlxuIFsgbWV0aG9kIF1cbiAqXG4gKiBSZW1vdmVzIGEgZ2xvYmFsIEludGVyYWN0RXZlbnQgbGlzdGVuZXIgb3IgRE9NIGV2ZW50IGZyb20gYGRvY3VtZW50YFxuICpcbiAtIHR5cGUgICAgICAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRoYXQgd2VyZSBsaXN0ZW5lZCBmb3JcbiAtIGxpc3RlbmVyICAgKGZ1bmN0aW9uKSBUaGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gYmUgcmVtb3ZlZFxuIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuID0gKG9iamVjdCkgaW50ZXJhY3RcbiBcXCovXG5pbnRlcmFjdC5vZmYgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICBpZiAoaXNTdHJpbmcodHlwZSkgJiYgdHlwZS5zZWFyY2goJyAnKSAhPT0gLTEpIHtcbiAgICAgICAgdHlwZSA9IHR5cGUudHJpbSgpLnNwbGl0KC8gKy8pO1xuICAgIH1cblxuICAgIGlmIChpc0FycmF5KHR5cGUpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaW50ZXJhY3Qub2ZmKHR5cGVbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9XG5cbiAgICBpZiAoaXNPYmplY3QodHlwZSkpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiB0eXBlKSB7XG4gICAgICAgICAgICBpbnRlcmFjdC5vZmYocHJvcCwgdHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH1cblxuICAgIGlmICghY29udGFpbnMoZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgZXZlbnRzLnJlbW92ZShkb2N1bWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGluZGV4O1xuXG4gICAgICAgIGlmICh0eXBlIGluIGdsb2JhbEV2ZW50c1xuICAgICAgICAgICAgJiYgKGluZGV4ID0gaW5kZXhPZihnbG9iYWxFdmVudHNbdHlwZV0sIGxpc3RlbmVyKSkgIT09IC0xKSB7XG4gICAgICAgICAgICBnbG9iYWxFdmVudHNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdDtcbn07XG5cbi8qXFxcbiAqIGludGVyYWN0LmVuYWJsZURyYWdnaW5nXG4gWyBtZXRob2QgXVxuICpcbiAqIERlcHJlY2F0ZWQuXG4gKlxuICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgZHJhZ2dpbmcgaXMgZW5hYmxlZCBmb3IgYW55IEludGVyYWN0YWJsZXNcbiAqXG4gLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIGB0cnVlYCB0byBhbGxvdyB0aGUgYWN0aW9uOyBgZmFsc2VgIHRvIGRpc2FibGUgYWN0aW9uIGZvciBhbGwgSW50ZXJhY3RhYmxlc1xuID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiBcXCovXG5pbnRlcmFjdC5lbmFibGVEcmFnZ2luZyA9IHdhcm5PbmNlKGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgIGlmIChuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFjdGlvbklzRW5hYmxlZC5kcmFnID0gbmV3VmFsdWU7XG5cbiAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgIH1cbiAgICByZXR1cm4gYWN0aW9uSXNFbmFibGVkLmRyYWc7XG59LCAnaW50ZXJhY3QuZW5hYmxlRHJhZ2dpbmcgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBzb29uIGJlIHJlbW92ZWQuJyk7XG5cbi8qXFxcbiAqIGludGVyYWN0LmVuYWJsZVJlc2l6aW5nXG4gWyBtZXRob2QgXVxuICpcbiAqIERlcHJlY2F0ZWQuXG4gKlxuICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgcmVzaXppbmcgaXMgZW5hYmxlZCBmb3IgYW55IEludGVyYWN0YWJsZXNcbiAqXG4gLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIGB0cnVlYCB0byBhbGxvdyB0aGUgYWN0aW9uOyBgZmFsc2VgIHRvIGRpc2FibGUgYWN0aW9uIGZvciBhbGwgSW50ZXJhY3RhYmxlc1xuID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiBcXCovXG5pbnRlcmFjdC5lbmFibGVSZXNpemluZyA9IHdhcm5PbmNlKGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgIGlmIChuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFjdGlvbklzRW5hYmxlZC5yZXNpemUgPSBuZXdWYWx1ZTtcblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgfVxuICAgIHJldHVybiBhY3Rpb25Jc0VuYWJsZWQucmVzaXplO1xufSwgJ2ludGVyYWN0LmVuYWJsZVJlc2l6aW5nIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgc29vbiBiZSByZW1vdmVkLicpO1xuXG4vKlxcXG4gKiBpbnRlcmFjdC5lbmFibGVHZXN0dXJpbmdcbiBbIG1ldGhvZCBdXG4gKlxuICogRGVwcmVjYXRlZC5cbiAqXG4gKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBnZXN0dXJpbmcgaXMgZW5hYmxlZCBmb3IgYW55IEludGVyYWN0YWJsZXNcbiAqXG4gLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIGB0cnVlYCB0byBhbGxvdyB0aGUgYWN0aW9uOyBgZmFsc2VgIHRvIGRpc2FibGUgYWN0aW9uIGZvciBhbGwgSW50ZXJhY3RhYmxlc1xuID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiBcXCovXG5pbnRlcmFjdC5lbmFibGVHZXN0dXJpbmcgPSB3YXJuT25jZShmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICBpZiAobmV3VmFsdWUgIT09IG51bGwgJiYgbmV3VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhY3Rpb25Jc0VuYWJsZWQuZ2VzdHVyZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9XG4gICAgcmV0dXJuIGFjdGlvbklzRW5hYmxlZC5nZXN0dXJlO1xufSwgJ2ludGVyYWN0LmVuYWJsZUdlc3R1cmluZyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIHNvb24gYmUgcmVtb3ZlZC4nKTtcblxuaW50ZXJhY3QuZXZlbnRUeXBlcyA9IGV2ZW50VHlwZXM7XG5cbi8qXFxcbiAqIGludGVyYWN0LmRlYnVnXG4gWyBtZXRob2QgXVxuICpcbiAqIFJldHVybnMgZGVidWdnaW5nIGRhdGFcbiA9IChvYmplY3QpIEFuIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgdGhhdCBvdXRsaW5lIHRoZSBjdXJyZW50IHN0YXRlIGFuZCBleHBvc2UgaW50ZXJuYWwgZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXNcbiBcXCovXG5pbnRlcmFjdC5kZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW50ZXJhY3Rpb24gPSBpbnRlcmFjdGlvbnNbMF0gfHwgbmV3IEludGVyYWN0aW9uKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbnRlcmFjdGlvbnMgICAgICAgICAgOiBpbnRlcmFjdGlvbnMsXG4gICAgICAgIHRhcmdldCAgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnRhcmdldCxcbiAgICAgICAgZHJhZ2dpbmcgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZHJhZ2dpbmcsXG4gICAgICAgIHJlc2l6aW5nICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnJlc2l6aW5nLFxuICAgICAgICBnZXN0dXJpbmcgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5nZXN0dXJpbmcsXG4gICAgICAgIHByZXBhcmVkICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnByZXBhcmVkLFxuICAgICAgICBtYXRjaGVzICAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5tYXRjaGVzLFxuICAgICAgICBtYXRjaEVsZW1lbnRzICAgICAgICAgOiBpbnRlcmFjdGlvbi5tYXRjaEVsZW1lbnRzLFxuXG4gICAgICAgIHByZXZDb29yZHMgICAgICAgICAgICA6IGludGVyYWN0aW9uLnByZXZDb29yZHMsXG4gICAgICAgIHN0YXJ0Q29vcmRzICAgICAgICAgICA6IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLFxuXG4gICAgICAgIHBvaW50ZXJJZHMgICAgICAgICAgICA6IGludGVyYWN0aW9uLnBvaW50ZXJJZHMsXG4gICAgICAgIHBvaW50ZXJzICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgICBhZGRQb2ludGVyICAgICAgICAgICAgOiBsaXN0ZW5lcnMuYWRkUG9pbnRlcixcbiAgICAgICAgcmVtb3ZlUG9pbnRlciAgICAgICAgIDogbGlzdGVuZXJzLnJlbW92ZVBvaW50ZXIsXG4gICAgICAgIHJlY29yZFBvaW50ZXIgICAgICAgIDogbGlzdGVuZXJzLnJlY29yZFBvaW50ZXIsXG5cbiAgICAgICAgc25hcCAgICAgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uc25hcFN0YXR1cyxcbiAgICAgICAgcmVzdHJpY3QgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucmVzdHJpY3RTdGF0dXMsXG4gICAgICAgIGluZXJ0aWEgICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMsXG5cbiAgICAgICAgZG93blRpbWUgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZG93blRpbWVzWzBdLFxuICAgICAgICBkb3duRXZlbnQgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5kb3duRXZlbnQsXG4gICAgICAgIGRvd25Qb2ludGVyICAgICAgICAgICA6IGludGVyYWN0aW9uLmRvd25Qb2ludGVyLFxuICAgICAgICBwcmV2RXZlbnQgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQsXG5cbiAgICAgICAgSW50ZXJhY3RhYmxlICAgICAgICAgIDogSW50ZXJhY3RhYmxlLFxuICAgICAgICBpbnRlcmFjdGFibGVzICAgICAgICAgOiBpbnRlcmFjdGFibGVzLFxuICAgICAgICBwb2ludGVySXNEb3duICAgICAgICAgOiBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duLFxuICAgICAgICBkZWZhdWx0T3B0aW9ucyAgICAgICAgOiBkZWZhdWx0T3B0aW9ucyxcbiAgICAgICAgZGVmYXVsdEFjdGlvbkNoZWNrZXIgIDogZGVmYXVsdEFjdGlvbkNoZWNrZXIsXG5cbiAgICAgICAgYWN0aW9uQ3Vyc29ycyAgICAgICAgIDogYWN0aW9uQ3Vyc29ycyxcbiAgICAgICAgZHJhZ01vdmUgICAgICAgICAgICAgIDogbGlzdGVuZXJzLmRyYWdNb3ZlLFxuICAgICAgICByZXNpemVNb3ZlICAgICAgICAgICAgOiBsaXN0ZW5lcnMucmVzaXplTW92ZSxcbiAgICAgICAgZ2VzdHVyZU1vdmUgICAgICAgICAgIDogbGlzdGVuZXJzLmdlc3R1cmVNb3ZlLFxuICAgICAgICBwb2ludGVyVXAgICAgICAgICAgICAgOiBsaXN0ZW5lcnMucG9pbnRlclVwLFxuICAgICAgICBwb2ludGVyRG93biAgICAgICAgICAgOiBsaXN0ZW5lcnMucG9pbnRlckRvd24sXG4gICAgICAgIHBvaW50ZXJNb3ZlICAgICAgICAgICA6IGxpc3RlbmVycy5wb2ludGVyTW92ZSxcbiAgICAgICAgcG9pbnRlckhvdmVyICAgICAgICAgIDogbGlzdGVuZXJzLnBvaW50ZXJIb3ZlcixcblxuICAgICAgICBldmVudFR5cGVzICAgICAgICAgICAgOiBldmVudFR5cGVzLFxuXG4gICAgICAgIGV2ZW50cyAgICAgICAgICAgICAgICA6IGV2ZW50cyxcbiAgICAgICAgZ2xvYmFsRXZlbnRzICAgICAgICAgIDogZ2xvYmFsRXZlbnRzLFxuICAgICAgICBkZWxlZ2F0ZWRFdmVudHMgICAgICAgOiBkZWxlZ2F0ZWRFdmVudHNcbiAgICB9O1xufTtcblxuLy8gZXhwb3NlIHRoZSBmdW5jdGlvbnMgdXNlZCB0byBjYWxjdWxhdGUgbXVsdGktdG91Y2ggcHJvcGVydGllc1xuaW50ZXJhY3QuZ2V0VG91Y2hBdmVyYWdlICA9IHRvdWNoQXZlcmFnZTtcbmludGVyYWN0LmdldFRvdWNoQkJveCAgICAgPSB0b3VjaEJCb3g7XG5pbnRlcmFjdC5nZXRUb3VjaERpc3RhbmNlID0gdG91Y2hEaXN0YW5jZTtcbmludGVyYWN0LmdldFRvdWNoQW5nbGUgICAgPSB0b3VjaEFuZ2xlO1xuXG5pbnRlcmFjdC5nZXRFbGVtZW50UmVjdCAgID0gZ2V0RWxlbWVudFJlY3Q7XG5pbnRlcmFjdC5tYXRjaGVzU2VsZWN0b3IgID0gbWF0Y2hlc1NlbGVjdG9yO1xuaW50ZXJhY3QuY2xvc2VzdCAgICAgICAgICA9IGNsb3Nlc3Q7XG5cbi8qXFxcbiAqIGludGVyYWN0Lm1hcmdpblxuIFsgbWV0aG9kIF1cbiAqXG4gKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1hcmdpbiBmb3IgYXV0b2NoZWNrIHJlc2l6aW5nIHVzZWQgaW5cbiAqIEBJbnRlcmFjdGFibGUuZ2V0QWN0aW9uLiBUaGF0IGlzIHRoZSBkaXN0YW5jZSBmcm9tIHRoZSBib3R0b20gYW5kIHJpZ2h0XG4gKiBlZGdlcyBvZiBhbiBlbGVtZW50IGNsaWNraW5nIGluIHdoaWNoIHdpbGwgc3RhcnQgcmVzaXppbmdcbiAqXG4gLSBuZXdWYWx1ZSAobnVtYmVyKSAjb3B0aW9uYWxcbiA9IChudW1iZXIgfCBpbnRlcmFjdCkgVGhlIGN1cnJlbnQgbWFyZ2luIHZhbHVlIG9yIGludGVyYWN0XG4gXFwqL1xuaW50ZXJhY3QubWFyZ2luID0gZnVuY3Rpb24gKG5ld3ZhbHVlKSB7XG4gICAgaWYgKGlzTnVtYmVyKG5ld3ZhbHVlKSkge1xuICAgICAgICBtYXJnaW4gPSBuZXd2YWx1ZTtcblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgfVxuICAgIHJldHVybiBtYXJnaW47XG59O1xuXG4vKlxcXG4gKiBpbnRlcmFjdC5zdXBwb3J0c1RvdWNoXG4gWyBtZXRob2QgXVxuICpcbiA9IChib29sZWFuKSBXaGV0aGVyIG9yIG5vdCB0aGUgYnJvd3NlciBzdXBwb3J0cyB0b3VjaCBpbnB1dFxuIFxcKi9cbmludGVyYWN0LnN1cHBvcnRzVG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHN1cHBvcnRzVG91Y2g7XG59O1xuXG4vKlxcXG4gKiBpbnRlcmFjdC5zdXBwb3J0c1BvaW50ZXJFdmVudFxuIFsgbWV0aG9kIF1cbiAqXG4gPSAoYm9vbGVhbikgV2hldGhlciBvciBub3QgdGhlIGJyb3dzZXIgc3VwcG9ydHMgUG9pbnRlckV2ZW50c1xuIFxcKi9cbmludGVyYWN0LnN1cHBvcnRzUG9pbnRlckV2ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzdXBwb3J0c1BvaW50ZXJFdmVudDtcbn07XG5cbi8qXFxcbiAqIGludGVyYWN0LnN0b3BcbiBbIG1ldGhvZCBdXG4gKlxuICogQ2FuY2VscyBhbGwgaW50ZXJhY3Rpb25zIChlbmQgZXZlbnRzIGFyZSBub3QgZmlyZWQpXG4gKlxuIC0gZXZlbnQgKEV2ZW50KSBBbiBldmVudCBvbiB3aGljaCB0byBjYWxsIHByZXZlbnREZWZhdWx0KClcbiA9IChvYmplY3QpIGludGVyYWN0XG4gXFwqL1xuaW50ZXJhY3Quc3RvcCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIGZvciAodmFyIGkgPSBpbnRlcmFjdGlvbnMubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICBpbnRlcmFjdGlvbnNbaV0uc3RvcChldmVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVyYWN0O1xufTtcblxuLypcXFxuICogaW50ZXJhY3QuZHluYW1pY0Ryb3BcbiBbIG1ldGhvZCBdXG4gKlxuICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdGhlIGRpbWVuc2lvbnMgb2YgZHJvcHpvbmUgZWxlbWVudHMgYXJlXG4gKiBjYWxjdWxhdGVkIG9uIGV2ZXJ5IGRyYWdtb3ZlIG9yIG9ubHkgb24gZHJhZ3N0YXJ0IGZvciB0aGUgZGVmYXVsdFxuICogZHJvcENoZWNrZXJcbiAqXG4gLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIFRydWUgdG8gY2hlY2sgb24gZWFjaCBtb3ZlLiBGYWxzZSB0byBjaGVjayBvbmx5IGJlZm9yZSBzdGFydFxuID0gKGJvb2xlYW4gfCBpbnRlcmFjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuIFxcKi9cbmludGVyYWN0LmR5bmFtaWNEcm9wID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgaWYgKGlzQm9vbChuZXdWYWx1ZSkpIHtcbiAgICAgICAgLy9pZiAoZHJhZ2dpbmcgJiYgZHluYW1pY0Ryb3AgIT09IG5ld1ZhbHVlICYmICFuZXdWYWx1ZSkge1xuICAgICAgICAvL2NhbGNSZWN0cyhkcm9wem9uZXMpO1xuICAgICAgICAvL31cblxuICAgICAgICBkeW5hbWljRHJvcCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9XG4gICAgcmV0dXJuIGR5bmFtaWNEcm9wO1xufTtcblxuLypcXFxuICogaW50ZXJhY3QucG9pbnRlck1vdmVUb2xlcmFuY2VcbiBbIG1ldGhvZCBdXG4gKiBSZXR1cm5zIG9yIHNldHMgdGhlIGRpc3RhbmNlIHRoZSBwb2ludGVyIG11c3QgYmUgbW92ZWQgYmVmb3JlIGFuIGFjdGlvblxuICogc2VxdWVuY2Ugb2NjdXJzLiBUaGlzIGFsc28gYWZmZWN0cyB0b2xlcmFuY2UgZm9yIHRhcCBldmVudHMuXG4gKlxuIC0gbmV3VmFsdWUgKG51bWJlcikgI29wdGlvbmFsIFRoZSBtb3ZlbWVudCBmcm9tIHRoZSBzdGFydCBwb3NpdGlvbiBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB0aGlzIHZhbHVlXG4gPSAobnVtYmVyIHwgSW50ZXJhY3RhYmxlKSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gXFwqL1xuaW50ZXJhY3QucG9pbnRlck1vdmVUb2xlcmFuY2UgPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICBpZiAoaXNOdW1iZXIobmV3VmFsdWUpKSB7XG4gICAgICAgIHBvaW50ZXJNb3ZlVG9sZXJhbmNlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvaW50ZXJNb3ZlVG9sZXJhbmNlO1xufTtcblxuLypcXFxuICogaW50ZXJhY3QubWF4SW50ZXJhY3Rpb25zXG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNvbmN1cnJlbnQgaW50ZXJhY3Rpb25zIGFsbG93ZWQuXG4gKiBCeSBkZWZhdWx0IG9ubHkgMSBpbnRlcmFjdGlvbiBpcyBhbGxvd2VkIGF0IGEgdGltZSAoZm9yIGJhY2t3YXJkc1xuICogY29tcGF0aWJpbGl0eSkuIFRvIGFsbG93IG11bHRpcGxlIGludGVyYWN0aW9ucyBvbiB0aGUgc2FtZSBJbnRlcmFjdGFibGVzXG4gKiBhbmQgZWxlbWVudHMsIHlvdSBuZWVkIHRvIGVuYWJsZSBpdCBpbiB0aGUgZHJhZ2dhYmxlLCByZXNpemFibGUgYW5kXG4gKiBnZXN0dXJhYmxlIGAnbWF4J2AgYW5kIGAnbWF4UGVyRWxlbWVudCdgIG9wdGlvbnMuXG4gKipcbiAtIG5ld1ZhbHVlIChudW1iZXIpICNvcHRpb25hbCBBbnkgbnVtYmVyLiBuZXdWYWx1ZSA8PSAwIG1lYW5zIG5vIGludGVyYWN0aW9ucy5cbiBcXCovXG5pbnRlcmFjdC5tYXhJbnRlcmFjdGlvbnMgPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICBpZiAoaXNOdW1iZXIobmV3VmFsdWUpKSB7XG4gICAgICAgIG1heEludGVyYWN0aW9ucyA9IG5ld1ZhbHVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBtYXhJbnRlcmFjdGlvbnM7XG59O1xuXG5pbnRlcmFjdC5jcmVhdGVTbmFwR3JpZCA9IGZ1bmN0aW9uIChncmlkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHZhciBvZmZzZXRYID0gMCxcbiAgICAgICAgICAgIG9mZnNldFkgPSAwO1xuXG4gICAgICAgIGlmIChpc09iamVjdChncmlkLm9mZnNldCkpIHtcbiAgICAgICAgICAgIG9mZnNldFggPSBncmlkLm9mZnNldC54O1xuICAgICAgICAgICAgb2Zmc2V0WSA9IGdyaWQub2Zmc2V0Lnk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ3JpZHggPSBNYXRoLnJvdW5kKCh4IC0gb2Zmc2V0WCkgLyBncmlkLngpLFxuICAgICAgICAgICAgZ3JpZHkgPSBNYXRoLnJvdW5kKCh5IC0gb2Zmc2V0WSkgLyBncmlkLnkpLFxuXG4gICAgICAgICAgICBuZXdYID0gZ3JpZHggKiBncmlkLnggKyBvZmZzZXRYLFxuICAgICAgICAgICAgbmV3WSA9IGdyaWR5ICogZ3JpZC55ICsgb2Zmc2V0WTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogbmV3WCxcbiAgICAgICAgICAgIHk6IG5ld1ksXG4gICAgICAgICAgICByYW5nZTogZ3JpZC5yYW5nZVxuICAgICAgICB9O1xuICAgIH07XG59O1xuXG5mdW5jdGlvbiBlbmRBbGxJbnRlcmFjdGlvbnMgKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnRlcmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJFbmQoZXZlbnQsIGV2ZW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxpc3RlblRvRG9jdW1lbnQgKGRvYykge1xuICAgIGlmIChjb250YWlucyhkb2N1bWVudHMsIGRvYykpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgd2luID0gZG9jLmRlZmF1bHRWaWV3IHx8IGRvYy5wYXJlbnRXaW5kb3c7XG5cbiAgICAvLyBhZGQgZGVsZWdhdGUgZXZlbnQgbGlzdGVuZXJcbiAgICBmb3IgKHZhciBldmVudFR5cGUgaW4gZGVsZWdhdGVkRXZlbnRzKSB7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBldmVudFR5cGUsIGRlbGVnYXRlTGlzdGVuZXIpO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgZXZlbnRUeXBlLCBkZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpO1xuICAgIH1cblxuICAgIGlmIChQb2ludGVyRXZlbnQpIHtcbiAgICAgICAgaWYgKFBvaW50ZXJFdmVudCA9PT0gd2luLk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICAgICAgICBwRXZlbnRUeXBlcyA9IHtcbiAgICAgICAgICAgICAgICB1cDogJ01TUG9pbnRlclVwJywgZG93bjogJ01TUG9pbnRlckRvd24nLCBvdmVyOiAnbW91c2VvdmVyJyxcbiAgICAgICAgICAgICAgICBvdXQ6ICdtb3VzZW91dCcsIG1vdmU6ICdNU1BvaW50ZXJNb3ZlJywgY2FuY2VsOiAnTVNQb2ludGVyQ2FuY2VsJyB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcEV2ZW50VHlwZXMgPSB7XG4gICAgICAgICAgICAgICAgdXA6ICdwb2ludGVydXAnLCBkb3duOiAncG9pbnRlcmRvd24nLCBvdmVyOiAncG9pbnRlcm92ZXInLFxuICAgICAgICAgICAgICAgIG91dDogJ3BvaW50ZXJvdXQnLCBtb3ZlOiAncG9pbnRlcm1vdmUnLCBjYW5jZWw6ICdwb2ludGVyY2FuY2VsJyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHBFdmVudFR5cGVzLmRvd24gICwgbGlzdGVuZXJzLnNlbGVjdG9yRG93biApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgcEV2ZW50VHlwZXMubW92ZSAgLCBsaXN0ZW5lcnMucG9pbnRlck1vdmUgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBwRXZlbnRUeXBlcy5vdmVyICAsIGxpc3RlbmVycy5wb2ludGVyT3ZlciAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsIHBFdmVudFR5cGVzLm91dCAgICwgbGlzdGVuZXJzLnBvaW50ZXJPdXQgICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgcEV2ZW50VHlwZXMudXAgICAgLCBsaXN0ZW5lcnMucG9pbnRlclVwICAgICk7XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBwRXZlbnRUeXBlcy5jYW5jZWwsIGxpc3RlbmVycy5wb2ludGVyQ2FuY2VsKTtcblxuICAgICAgICAvLyBhdXRvc2Nyb2xsXG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCBwRXZlbnRUeXBlcy5tb3ZlLCBsaXN0ZW5lcnMuYXV0b1Njcm9sbE1vdmUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZWRvd24nLCBsaXN0ZW5lcnMuc2VsZWN0b3JEb3duKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZW1vdmUnLCBsaXN0ZW5lcnMucG9pbnRlck1vdmUgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZXVwJyAgLCBsaXN0ZW5lcnMucG9pbnRlclVwICAgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZW92ZXInLCBsaXN0ZW5lcnMucG9pbnRlck92ZXIgKTtcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZW91dCcgLCBsaXN0ZW5lcnMucG9pbnRlck91dCAgKTtcblxuICAgICAgICBldmVudHMuYWRkKGRvYywgJ3RvdWNoc3RhcnQnICwgbGlzdGVuZXJzLnNlbGVjdG9yRG93biApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ3RvdWNobW92ZScgICwgbGlzdGVuZXJzLnBvaW50ZXJNb3ZlICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ3RvdWNoZW5kJyAgICwgbGlzdGVuZXJzLnBvaW50ZXJVcCAgICApO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ3RvdWNoY2FuY2VsJywgbGlzdGVuZXJzLnBvaW50ZXJDYW5jZWwpO1xuXG4gICAgICAgIC8vIGF1dG9zY3JvbGxcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZW1vdmUnLCBsaXN0ZW5lcnMuYXV0b1Njcm9sbE1vdmUpO1xuICAgICAgICBldmVudHMuYWRkKGRvYywgJ3RvdWNobW92ZScsIGxpc3RlbmVycy5hdXRvU2Nyb2xsTW92ZSk7XG4gICAgfVxuXG4gICAgZXZlbnRzLmFkZCh3aW4sICdibHVyJywgZW5kQWxsSW50ZXJhY3Rpb25zKTtcblxuICAgIHRyeSB7XG4gICAgICAgIGlmICh3aW4uZnJhbWVFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50RG9jID0gd2luLmZyYW1lRWxlbWVudC5vd25lckRvY3VtZW50LFxuICAgICAgICAgICAgICAgIHBhcmVudFdpbmRvdyA9IHBhcmVudERvYy5kZWZhdWx0VmlldztcblxuICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnREb2MgICAsICdtb3VzZXVwJyAgICAgICwgbGlzdGVuZXJzLnBvaW50ZXJFbmQpO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnREb2MgICAsICd0b3VjaGVuZCcgICAgICwgbGlzdGVuZXJzLnBvaW50ZXJFbmQpO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnREb2MgICAsICd0b3VjaGNhbmNlbCcgICwgbGlzdGVuZXJzLnBvaW50ZXJFbmQpO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnREb2MgICAsICdwb2ludGVydXAnICAgICwgbGlzdGVuZXJzLnBvaW50ZXJFbmQpO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnREb2MgICAsICdNU1BvaW50ZXJVcCcgICwgbGlzdGVuZXJzLnBvaW50ZXJFbmQpO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnRXaW5kb3csICdibHVyJyAgICAgICAgICwgZW5kQWxsSW50ZXJhY3Rpb25zICk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGludGVyYWN0LndpbmRvd1BhcmVudEVycm9yID0gZXJyb3I7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50cy51c2VBdHRhY2hFdmVudCkge1xuICAgICAgICAvLyBGb3IgSUUncyBsYWNrIG9mIEV2ZW50I3ByZXZlbnREZWZhdWx0XG4gICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnc2VsZWN0c3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uc1swXTtcblxuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmN1cnJlbnRBY3Rpb24oKSkge1xuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLmNoZWNrQW5kUHJldmVudERlZmF1bHQoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBGb3IgSUUncyBiYWQgZGJsY2xpY2sgZXZlbnQgc2VxdWVuY2VcbiAgICAgICAgZXZlbnRzLmFkZChkb2MsICdkYmxjbGljaycsIGRvT25JbnRlcmFjdGlvbnMoJ2llOERibGNsaWNrJykpO1xuICAgIH1cblxuICAgIGRvY3VtZW50cy5wdXNoKGRvYyk7XG59XG5cbmxpc3RlblRvRG9jdW1lbnQoZG9jdW1lbnQpO1xuXG5mdW5jdGlvbiBpbmRleE9mIChhcnJheSwgdGFyZ2V0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmIChhcnJheVtpXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gY29udGFpbnMgKGFycmF5LCB0YXJnZXQpIHtcbiAgICByZXR1cm4gaW5kZXhPZihhcnJheSwgdGFyZ2V0KSAhPT0gLTE7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNTZWxlY3RvciAoZWxlbWVudCwgc2VsZWN0b3IsIG5vZGVMaXN0KSB7XG4gICAgaWYgKGllOE1hdGNoZXNTZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gaWU4TWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yLCBub2RlTGlzdCk7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIC9kZWVwLyBmcm9tIHNlbGVjdG9ycyBpZiBzaGFkb3dET00gcG9seWZpbGwgaXMgdXNlZFxuICAgIGlmICh3aW5kb3cgIT09IHJlYWxXaW5kb3cpIHtcbiAgICAgICAgc2VsZWN0b3IgPSBzZWxlY3Rvci5yZXBsYWNlKC9cXC9kZWVwXFwvL2csICcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW1lbnRbcHJlZml4ZWRNYXRjaGVzU2VsZWN0b3JdKHNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc1VwVG8gKGVsZW1lbnQsIHNlbGVjdG9yLCBsaW1pdCkge1xuICAgIHdoaWxlIChpc0VsZW1lbnQoZWxlbWVudCkpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvcikpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudCA9IHBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKGVsZW1lbnQgPT09IGxpbWl0KSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy8gRm9yIElFOCdzIGxhY2sgb2YgYW4gRWxlbWVudCNtYXRjaGVzU2VsZWN0b3Jcbi8vIHRha2VuIGZyb20gaHR0cDovL3RhbmFsaW4uY29tL2VuL2Jsb2cvMjAxMi8xMi9tYXRjaGVzLXNlbGVjdG9yLWllOC8gYW5kIG1vZGlmaWVkXG5pZiAoIShwcmVmaXhlZE1hdGNoZXNTZWxlY3RvciBpbiBFbGVtZW50LnByb3RvdHlwZSkgfHwgIWlzRnVuY3Rpb24oRWxlbWVudC5wcm90b3R5cGVbcHJlZml4ZWRNYXRjaGVzU2VsZWN0b3JdKSkge1xuICAgIGllOE1hdGNoZXNTZWxlY3RvciA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3RvciwgZWxlbXMpIHtcbiAgICAgICAgZWxlbXMgPSBlbGVtcyB8fCBlbGVtZW50LnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGVsZW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZWxlbXNbaV0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xufVxuXG4vLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcG9seWZpbGxcbihmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwLFxuICAgICAgICB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcblxuICAgIGZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhcmVhbFdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xuICAgICAgICByZXFGcmFtZSA9IHJlYWxXaW5kb3dbdmVuZG9yc1t4XSsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICAgIGNhbmNlbEZyYW1lID0gcmVhbFdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8IHJlYWxXaW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgfVxuXG4gICAgaWYgKCFyZXFGcmFtZSkge1xuICAgICAgICByZXFGcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgICAgICAgICB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpLFxuICAgICAgICAgICAgICAgIGlkID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSxcbiAgICAgICAgICAgICAgICAgICAgdGltZVRvQ2FsbCk7XG4gICAgICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoIWNhbmNlbEZyYW1lKSB7XG4gICAgICAgIGNhbmNlbEZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgICAgIH07XG4gICAgfVxufSgpKTtcblxuLy8gQ29tbW9uSlNcbmlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gaW50ZXJhY3Q7XG4gICAgfVxuICAgIGV4cG9ydHNbJ2ludGVyYWN0J10gPSBpbnRlcmFjdDtcbn1cbi8vIEFNRFxuZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCdpbnRlcmFjdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgfSk7XG59O1xuXG4vLyBBbHdheXMgZXhwb3J0IG9uIHRoZSBnbG9iYWwgc2NvcGVcbndpbmRvd1snaW50ZXJhY3QnXSA9IGludGVyYWN0OyIsInZhciBpbnRlcmFjdFdpbmRvdyA9IHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogd2luZG93O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGludGVyYWN0V2luZG93OyJdfQ==
