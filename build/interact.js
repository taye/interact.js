(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

    // {
    //      type: {
    //          selectors: ['selector', ...],
    //          contexts : [document, ...],
    //          listeners: [[listener, useCapture], ...]
    //      }
    //  }
    scope.delegatedEvents = {};

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
    scope.prefixedMatchesSelector = 'matches' in Element.prototype?
            'matches': 'webkitMatchesSelector' in Element.prototype?
                'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype?
                    'mozMatchesSelector': 'oMatchesSelector' in Element.prototype?
                        'oMatchesSelector': 'msMatchesSelector';

    // will be polyfill function if browser is IE8
    scope.ie8MatchesSelector = null;

    // Events wrapper
    var events = require('./utils/events');

    scope.listeners = {};

    var interactionListeners = [
        'dragStart', 'dragMove', 'resizeStart', 'resizeMove', 'gestureStart', 'gestureMove',
        'pointerOver', 'pointerOut', 'pointerHover', 'selectorDown',
        'pointerDown', 'pointerMove', 'pointerUp', 'pointerCancel', 'pointerEnd',
        'addPointer', 'removePointer', 'recordPointer', 'autoScrollMove'
    ];

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

    utils.getTouchPair = function (event) {
        var touches = [];

        // array of touches is supplied
        if (scope.isArray(event)) {
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
    };

    utils.touchAverage = function (event) {
        var touches = utils.getTouchPair(event);

        return {
            pageX: (touches[0].pageX + touches[1].pageX) / 2,
            pageY: (touches[0].pageY + touches[1].pageY) / 2,
            clientX: (touches[0].clientX + touches[1].clientX) / 2,
            clientY: (touches[0].clientY + touches[1].clientY) / 2
        };
    };

    utils.touchBBox = function (event) {
        if (!event.length && !(event.touches && event.touches.length > 1)) {
            return;
        }

        var touches = utils.getTouchPair(event),
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
    };

    utils.touchDistance = function (event, deltaSource) {
        deltaSource = deltaSource || scope.defaultOptions.deltaSource;

        var sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            touches = utils.getTouchPair(event);


        var dx = touches[0][sourceX] - touches[1][sourceX],
            dy = touches[0][sourceY] - touches[1][sourceY];

        return utils.hypot(dx, dy);
    };

    utils.touchAngle = function (event, prevAngle, deltaSource) {
        deltaSource = deltaSource || scope.defaultOptions.deltaSource;

        var sourceX = deltaSource + 'X',
            sourceY = deltaSource + 'Y',
            touches = utils.getTouchPair(event),
            dx = touches[0][sourceX] - touches[1][sourceX],
            dy = touches[0][sourceY] - touches[1][sourceY],
            angle = 180 * Math.atan(dy / dx) / Math.PI;

        if (scope.isNumber(prevAngle)) {
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

        return element[scope.prefixedMatchesSelector](selector);
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
    if (!(scope.prefixedMatchesSelector in Element.prototype) || !scope.isFunction(Element.prototype[scope.prefixedMatchesSelector])) {
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

    function preventOriginalDefault () {
        this.originalEvent.preventDefault();
    }

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
            action = null,
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

    var InteractEvent = require('./InteractEvent');

    for (var i = 0, len = interactionListeners.length; i < len; i++) {
        var listenerName = interactionListeners[i];

        scope.listeners[listenerName] = doOnInteractions(listenerName);
    }

    // bound to the interactable context when a DOM event
    // listener is added to a selector interactable
    function delegateListener (event, useCapture) {
        var fakeEvent = {},
            delegated = scope.delegatedEvents[event.type],
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

    function delegateUseCapture (event) {
        return delegateListener.call(this, event, true);
    }

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
                    events.add(this._element, scope.pEventTypes.down, scope.listeners.pointerDown );
                    events.add(this._element, scope.pEventTypes.move, scope.listeners.pointerHover);
                }
                else {
                    events.add(this._element, 'mousedown' , scope.listeners.pointerDown );
                    events.add(this._element, 'mousemove' , scope.listeners.pointerHover);
                    events.add(this._element, 'touchstart', scope.listeners.pointerDown );
                    events.add(this._element, 'touchmove' , scope.listeners.pointerHover);
                }
            }
        }

        this._doc = _window.document;

        if (!scope.contains(scope.documents, this._doc)) {
            listenToDocument(this._doc);
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
            addPointer            : scope.listeners.addPointer,
            removePointer         : scope.listeners.removePointer,
            recordPointer         : scope.listeners.recordPointer,

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
            defaultActionChecker  : defaultActionChecker,

            actionCursors         : scope.actionCursors,
            dragMove              : scope.listeners.dragMove,
            resizeMove            : scope.listeners.resizeMove,
            gestureMove           : scope.listeners.gestureMove,
            pointerUp             : scope.listeners.pointerUp,
            pointerDown           : scope.listeners.pointerDown,
            pointerMove           : scope.listeners.pointerMove,
            pointerHover          : scope.listeners.pointerHover,

            eventTypes            : scope.eventTypes,

            events                : events,
            globalEvents          : scope.globalEvents,
            delegatedEvents       : scope.delegatedEvents
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

    function endAllInteractions (event) {
        for (var i = 0; i < scope.interactions.length; i++) {
            scope.interactions[i].pointerEnd(event, event);
        }
    }

    function listenToDocument (doc) {
        if (scope.contains(scope.documents, doc)) { return; }

        var win = doc.defaultView || doc.parentWindow;

        // add delegate event listener
        for (var eventType in scope.delegatedEvents) {
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

            events.add(doc, scope.pEventTypes.down  , scope.listeners.selectorDown );
            events.add(doc, scope.pEventTypes.move  , scope.listeners.pointerMove  );
            events.add(doc, scope.pEventTypes.over  , scope.listeners.pointerOver  );
            events.add(doc, scope.pEventTypes.out   , scope.listeners.pointerOut   );
            events.add(doc, scope.pEventTypes.up    , scope.listeners.pointerUp    );
            events.add(doc, scope.pEventTypes.cancel, scope.listeners.pointerCancel);

            // autoscroll
            events.add(doc, scope.pEventTypes.move, scope.listeners.autoScrollMove);
        }
        else {
            events.add(doc, 'mousedown', scope.listeners.selectorDown);
            events.add(doc, 'mousemove', scope.listeners.pointerMove );
            events.add(doc, 'mouseup'  , scope.listeners.pointerUp   );
            events.add(doc, 'mouseover', scope.listeners.pointerOver );
            events.add(doc, 'mouseout' , scope.listeners.pointerOut  );

            events.add(doc, 'touchstart' , scope.listeners.selectorDown );
            events.add(doc, 'touchmove'  , scope.listeners.pointerMove  );
            events.add(doc, 'touchend'   , scope.listeners.pointerUp    );
            events.add(doc, 'touchcancel', scope.listeners.pointerCancel);

            // autoscroll
            events.add(doc, 'mousemove', scope.listeners.autoScrollMove);
            events.add(doc, 'touchmove', scope.listeners.autoScrollMove);
        }

        events.add(win, 'blur', endAllInteractions);

        try {
            if (win.frameElement) {
                var parentDoc = win.frameElement.ownerDocument,
                    parentWindow = parentDoc.defaultView;

                events.add(parentDoc   , 'mouseup'      , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'touchend'     , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'touchcancel'  , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'pointerup'    , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'MSPointerUp'  , scope.listeners.pointerEnd);
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

    listenToDocument(scope.document);

    scope.interact = interact;
    scope.Interactable = Interactable;
    scope.Interaction = Interaction;
    scope.InteractEvent = InteractEvent;

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
        scope.realWindow.interact = interact;
    }

},{"./InteractEvent":2,"./Interaction":3,"./autoScroll":4,"./defaultOptions":5,"./scope":6,"./utils":13,"./utils/events":10,"./utils/window":17}],2:[function(require,module,exports){
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

},{"./scope":6,"./utils":13}],3:[function(require,module,exports){
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

            this.clearTargets();
        }

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
},{"./InteractEvent":2,"./scope":6,"./utils":13,"./utils/browser":8,"./utils/events":10}],4:[function(require,module,exports){
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

},{"./utils/isType":14,"./utils/raf":16,"./utils/window":17}],5:[function(require,module,exports){
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
};

},{"./utils/domObjects":9}],6:[function(require,module,exports){
'use strict';

var scope = {},
    extend = require('./utils/extend');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));
extend(scope, require('./utils/arr.js'));
extend(scope, require('./utils/isType'));

module.exports = scope;

},{"./utils/arr.js":7,"./utils/domObjects":9,"./utils/extend":11,"./utils/isType":14,"./utils/window":17}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

    isIe9OrOlder : domObjects.document.all && !win.window.atob
};

module.exports = browser;

},{"./domObjects":9,"./window":17}],9:[function(require,module,exports){
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

},{"./window":17}],10:[function(require,module,exports){
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

module.exports = {
    add: add,
    remove: remove,
    useAttachEvent: useAttachEvent,

    _elements: elements,
    _targets: targets,
    _attachedListeners: attachedListeners
};

},{"./arr":7,"./window":17}],11:[function(require,module,exports){
'use strict';

module.exports = function extend (dest, source) {
    for (var prop in source) {
        dest[prop] = source[prop];
    }
    return dest;
};

},{}],12:[function(require,module,exports){
'use strict';

module.exports = function hypot (x, y) { return Math.sqrt(x * x + y * y); };

},{}],13:[function(require,module,exports){
'use strict';

var utils = {},
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

module.exports = utils;

},{"./arr":7,"./browser":8,"./extend":11,"./hypot":12,"./isType":14,"./pointerUtils":15,"./raf":16,"./window":17}],14:[function(require,module,exports){
'use strict';

var win = require('./window'),
    domObjects = require('./domObjects');

module.exports.isElement = function (o) {
    if (!o || (typeof o !== 'object')) { return false; }

    var _window = win.getWindow(o) || win.window;

    return (/object|function/.test(typeof _window.Element)
        ? o instanceof _window.Element //DOM2
        : o.nodeType === 1 && typeof o.nodeName === "string");
};

module.exports.isWindow   = function (thing) { return !!(thing && thing.Window) && (thing instanceof thing.Window); };
module.exports.isDocFrag  = function (thing) { return !!thing && thing instanceof domObjects.DocumentFragment; };
module.exports.isArray    = function (thing) {
    return module.exports.isObject(thing)
    && (typeof thing.length !== undefined)
    && module.exports.isFunction(thing.splice);
};
module.exports.isObject   = function (thing) { return !!thing && (typeof thing === 'object'); };
module.exports.isFunction = function (thing) { return typeof thing === 'function'; };
module.exports.isNumber   = function (thing) { return typeof thing === 'number'  ; };
module.exports.isBool     = function (thing) { return typeof thing === 'boolean' ; };
module.exports.isString   = function (thing) { return typeof thing === 'string'  ; };


},{"./domObjects":9,"./window":17}],15:[function(require,module,exports){
'use strict';

var pointerUtils = {},
    // reduce object creation in getXY()
    tmpXY = {},
    win = require('./window'),
    hypot = require('./hypot'),
    extend = require('./extend'),

    // scope shouldn't be necessary in this module
    scope = require('../scope');

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

    if (pointer instanceof scope.InteractEvent) {
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
    else if (scope.isOperaMobile) {
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

    if (pointer instanceof scope.InteractEvent) {
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
        pointerUtils.getXY(scope.isOperaMobile? 'screen': 'client', pointer, client);
    }

    return client;
};

pointerUtils.getPointerId = function (pointer) {
    return scope.isNumber(pointer.pointerId)? pointer.pointerId : pointer.identifier;
};

module.exports = pointerUtils;

},{"../scope":6,"./extend":11,"./hypot":12,"./window":17}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
'use strict';

if (typeof window === 'undefined') {
    module.exports.window     = undefined;
    module.exports.realWindow = undefined;
}
else {
    // get wrapped window if using Shadow DOM polyfill

    module.exports.realWindow = window;

    // create a TextNode
    var el = window.document.createTextNode('');

    // check if it's wrapped by a polyfill
    if (el.ownerDocument !== window.document
        && typeof window.wrap === 'function'
        && window.wrap(el) === el) {
        // return wrapped window
        module.exports.window = window.wrap(window);
    }

    // no Shadow DOM polyfil or native implementation
    module.exports.window = window;
}

var isWindow = require('./isType').isWindow;

module.exports.getWindow = function getWindow (node) {
    if (isWindow(node)) {
        return node;
    }

    var rootNode = (node.ownerDocument || node);

    return rootNode.defaultView || rootNode.parentWindow || module.exports.window;
};

},{"./isType":14}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW50ZXJhY3QuanMiLCJzcmMvSW50ZXJhY3RFdmVudC5qcyIsInNyYy9JbnRlcmFjdGlvbi5qcyIsInNyYy9hdXRvU2Nyb2xsLmpzIiwic3JjL2RlZmF1bHRPcHRpb25zLmpzIiwic3JjL3Njb3BlLmpzIiwic3JjL3V0aWxzL2Fyci5qcyIsInNyYy91dGlscy9icm93c2VyLmpzIiwic3JjL3V0aWxzL2RvbU9iamVjdHMuanMiLCJzcmMvdXRpbHMvZXZlbnRzLmpzIiwic3JjL3V0aWxzL2V4dGVuZC5qcyIsInNyYy91dGlscy9oeXBvdC5qcyIsInNyYy91dGlscy9pbmRleC5qcyIsInNyYy91dGlscy9pc1R5cGUuanMiLCJzcmMvdXRpbHMvcG9pbnRlclV0aWxzLmpzIiwic3JjL3V0aWxzL3JhZi5qcyIsInNyYy91dGlscy93aW5kb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDRGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9oRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogaW50ZXJhY3QuanMgdjEuMi40XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEyLTIwMTUgVGF5ZSBBZGV5ZW1pIDxkZXZAdGF5ZS5tZT5cbiAqIE9wZW4gc291cmNlIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9tYXN0ZXIvTElDRU5TRVxuICovXG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyByZXR1cm4gZWFybHkgaWYgdGhlcmUncyBubyB3aW5kb3cgdG8gd29yayB3aXRoIChlZy4gTm9kZS5qcylcbiAgICBpZiAoIXJlcXVpcmUoJy4vdXRpbHMvd2luZG93Jykud2luZG93KSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNjb3BlID0gcmVxdWlyZSgnLi9zY29wZScpLFxuICAgICAgICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcbiAgICAgICAgYnJvd3NlciA9IHV0aWxzLmJyb3dzZXI7XG5cbiAgICBzY29wZS5wRXZlbnRUeXBlcyA9IG51bGw7XG5cbiAgICBzY29wZS5kb2N1bWVudHMgICAgICAgPSBbXTsgICAvLyBhbGwgZG9jdW1lbnRzIGJlaW5nIGxpc3RlbmVkIHRvXG5cbiAgICBzY29wZS5pbnRlcmFjdGFibGVzICAgPSBbXTsgICAvLyBhbGwgc2V0IGludGVyYWN0YWJsZXNcbiAgICBzY29wZS5pbnRlcmFjdGlvbnMgICAgPSBbXTsgICAvLyBhbGwgaW50ZXJhY3Rpb25zXG5cbiAgICBzY29wZS5keW5hbWljRHJvcCAgICAgPSBmYWxzZTtcblxuICAgIC8vIHtcbiAgICAvLyAgICAgIHR5cGU6IHtcbiAgICAvLyAgICAgICAgICBzZWxlY3RvcnM6IFsnc2VsZWN0b3InLCAuLi5dLFxuICAgIC8vICAgICAgICAgIGNvbnRleHRzIDogW2RvY3VtZW50LCAuLi5dLFxuICAgIC8vICAgICAgICAgIGxpc3RlbmVyczogW1tsaXN0ZW5lciwgdXNlQ2FwdHVyZV0sIC4uLl1cbiAgICAvLyAgICAgIH1cbiAgICAvLyAgfVxuICAgIHNjb3BlLmRlbGVnYXRlZEV2ZW50cyA9IHt9O1xuXG4gICAgc2NvcGUuZGVmYXVsdE9wdGlvbnMgPSByZXF1aXJlKCcuL2RlZmF1bHRPcHRpb25zJyk7XG5cbiAgICAvLyBUaGluZ3MgcmVsYXRlZCB0byBhdXRvU2Nyb2xsXG4gICAgc2NvcGUuYXV0b1Njcm9sbCA9IHJlcXVpcmUoJy4vYXV0b1Njcm9sbCcpO1xuXG4gICAgLy8gTGVzcyBQcmVjaXNpb24gd2l0aCB0b3VjaCBpbnB1dFxuICAgIHNjb3BlLm1hcmdpbiA9IGJyb3dzZXIuc3VwcG9ydHNUb3VjaCB8fCBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50PyAyMDogMTA7XG5cbiAgICBzY29wZS5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IDE7XG5cbiAgICAvLyBmb3IgaWdub3JpbmcgYnJvd3NlcidzIHNpbXVsYXRlZCBtb3VzZSBldmVudHNcbiAgICBzY29wZS5wcmV2VG91Y2hUaW1lID0gMDtcblxuICAgIC8vIEFsbG93IHRoaXMgbWFueSBpbnRlcmFjdGlvbnMgdG8gaGFwcGVuIHNpbXVsdGFuZW91c2x5XG4gICAgc2NvcGUubWF4SW50ZXJhY3Rpb25zID0gSW5maW5pdHk7XG5cbiAgICBzY29wZS5hY3Rpb25DdXJzb3JzID0gYnJvd3Nlci5pc0llOU9yT2xkZXIgPyB7XG4gICAgICAgIGRyYWcgICAgOiAnbW92ZScsXG4gICAgICAgIHJlc2l6ZXggOiAnZS1yZXNpemUnLFxuICAgICAgICByZXNpemV5IDogJ3MtcmVzaXplJyxcbiAgICAgICAgcmVzaXpleHk6ICdzZS1yZXNpemUnLFxuXG4gICAgICAgIHJlc2l6ZXRvcCAgICAgICAgOiAnbi1yZXNpemUnLFxuICAgICAgICByZXNpemVsZWZ0ICAgICAgIDogJ3ctcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tICAgICA6ICdzLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXJpZ2h0ICAgICAgOiAnZS1yZXNpemUnLFxuICAgICAgICByZXNpemV0b3BsZWZ0ICAgIDogJ3NlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbXJpZ2h0OiAnc2UtcmVzaXplJyxcbiAgICAgICAgcmVzaXpldG9wcmlnaHQgICA6ICduZS1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b21sZWZ0IDogJ25lLXJlc2l6ZScsXG5cbiAgICAgICAgZ2VzdHVyZSA6ICcnXG4gICAgfSA6IHtcbiAgICAgICAgZHJhZyAgICA6ICdtb3ZlJyxcbiAgICAgICAgcmVzaXpleCA6ICdldy1yZXNpemUnLFxuICAgICAgICByZXNpemV5IDogJ25zLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXh5OiAnbndzZS1yZXNpemUnLFxuXG4gICAgICAgIHJlc2l6ZXRvcCAgICAgICAgOiAnbnMtcmVzaXplJyxcbiAgICAgICAgcmVzaXplbGVmdCAgICAgICA6ICdldy1yZXNpemUnLFxuICAgICAgICByZXNpemVib3R0b20gICAgIDogJ25zLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZXJpZ2h0ICAgICAgOiAnZXctcmVzaXplJyxcbiAgICAgICAgcmVzaXpldG9wbGVmdCAgICA6ICdud3NlLXJlc2l6ZScsXG4gICAgICAgIHJlc2l6ZWJvdHRvbXJpZ2h0OiAnbndzZS1yZXNpemUnLFxuICAgICAgICByZXNpemV0b3ByaWdodCAgIDogJ25lc3ctcmVzaXplJyxcbiAgICAgICAgcmVzaXplYm90dG9tbGVmdCA6ICduZXN3LXJlc2l6ZScsXG5cbiAgICAgICAgZ2VzdHVyZSA6ICcnXG4gICAgfTtcblxuICAgIHNjb3BlLmFjdGlvbklzRW5hYmxlZCA9IHtcbiAgICAgICAgZHJhZyAgIDogdHJ1ZSxcbiAgICAgICAgcmVzaXplIDogdHJ1ZSxcbiAgICAgICAgZ2VzdHVyZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBiZWNhdXNlIFdlYmtpdCBhbmQgT3BlcmEgc3RpbGwgdXNlICdtb3VzZXdoZWVsJyBldmVudCB0eXBlXG4gICAgc2NvcGUud2hlZWxFdmVudCA9ICdvbm1vdXNld2hlZWwnIGluIHNjb3BlLmRvY3VtZW50PyAnbW91c2V3aGVlbCc6ICd3aGVlbCc7XG5cbiAgICBzY29wZS5ldmVudFR5cGVzID0gW1xuICAgICAgICAnZHJhZ3N0YXJ0JyxcbiAgICAgICAgJ2RyYWdtb3ZlJyxcbiAgICAgICAgJ2RyYWdpbmVydGlhc3RhcnQnLFxuICAgICAgICAnZHJhZ2VuZCcsXG4gICAgICAgICdkcmFnZW50ZXInLFxuICAgICAgICAnZHJhZ2xlYXZlJyxcbiAgICAgICAgJ2Ryb3BhY3RpdmF0ZScsXG4gICAgICAgICdkcm9wZGVhY3RpdmF0ZScsXG4gICAgICAgICdkcm9wbW92ZScsXG4gICAgICAgICdkcm9wJyxcbiAgICAgICAgJ3Jlc2l6ZXN0YXJ0JyxcbiAgICAgICAgJ3Jlc2l6ZW1vdmUnLFxuICAgICAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAgICAgJ3Jlc2l6ZWVuZCcsXG4gICAgICAgICdnZXN0dXJlc3RhcnQnLFxuICAgICAgICAnZ2VzdHVyZW1vdmUnLFxuICAgICAgICAnZ2VzdHVyZWluZXJ0aWFzdGFydCcsXG4gICAgICAgICdnZXN0dXJlZW5kJyxcblxuICAgICAgICAnZG93bicsXG4gICAgICAgICdtb3ZlJyxcbiAgICAgICAgJ3VwJyxcbiAgICAgICAgJ2NhbmNlbCcsXG4gICAgICAgICd0YXAnLFxuICAgICAgICAnZG91YmxldGFwJyxcbiAgICAgICAgJ2hvbGQnXG4gICAgXTtcblxuICAgIHNjb3BlLmdsb2JhbEV2ZW50cyA9IHt9O1xuXG4gICAgLy8gcHJlZml4IG1hdGNoZXNTZWxlY3RvclxuICAgIHNjb3BlLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yID0gJ21hdGNoZXMnIGluIEVsZW1lbnQucHJvdG90eXBlP1xuICAgICAgICAgICAgJ21hdGNoZXMnOiAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZT9cbiAgICAgICAgICAgICAgICAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJzogJ21vek1hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAgICAgICAgICdtb3pNYXRjaGVzU2VsZWN0b3InOiAnb01hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGU/XG4gICAgICAgICAgICAgICAgICAgICAgICAnb01hdGNoZXNTZWxlY3Rvcic6ICdtc01hdGNoZXNTZWxlY3Rvcic7XG5cbiAgICAvLyB3aWxsIGJlIHBvbHlmaWxsIGZ1bmN0aW9uIGlmIGJyb3dzZXIgaXMgSUU4XG4gICAgc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yID0gbnVsbDtcblxuICAgIC8vIEV2ZW50cyB3cmFwcGVyXG4gICAgdmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvZXZlbnRzJyk7XG5cbiAgICBzY29wZS5saXN0ZW5lcnMgPSB7fTtcblxuICAgIHZhciBpbnRlcmFjdGlvbkxpc3RlbmVycyA9IFtcbiAgICAgICAgJ2RyYWdTdGFydCcsICdkcmFnTW92ZScsICdyZXNpemVTdGFydCcsICdyZXNpemVNb3ZlJywgJ2dlc3R1cmVTdGFydCcsICdnZXN0dXJlTW92ZScsXG4gICAgICAgICdwb2ludGVyT3ZlcicsICdwb2ludGVyT3V0JywgJ3BvaW50ZXJIb3ZlcicsICdzZWxlY3RvckRvd24nLFxuICAgICAgICAncG9pbnRlckRvd24nLCAncG9pbnRlck1vdmUnLCAncG9pbnRlclVwJywgJ3BvaW50ZXJDYW5jZWwnLCAncG9pbnRlckVuZCcsXG4gICAgICAgICdhZGRQb2ludGVyJywgJ3JlbW92ZVBvaW50ZXInLCAncmVjb3JkUG9pbnRlcicsICdhdXRvU2Nyb2xsTW92ZSdcbiAgICBdO1xuXG4gICAgc2NvcGUudHJ5U2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKCFzY29wZS5pc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgLy8gYW4gZXhjZXB0aW9uIHdpbGwgYmUgcmFpc2VkIGlmIGl0IGlzIGludmFsaWRcbiAgICAgICAgc2NvcGUuZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBzY29wZS5nZXRTY3JvbGxYWSA9IGZ1bmN0aW9uICh3aW4pIHtcbiAgICAgICAgd2luID0gd2luIHx8IHNjb3BlLndpbmRvdztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHdpbi5zY3JvbGxYIHx8IHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgIHk6IHdpbi5zY3JvbGxZIHx8IHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHNjb3BlLmdldEFjdHVhbEVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gKGVsZW1lbnQgaW5zdGFuY2VvZiBzY29wZS5TVkdFbGVtZW50SW5zdGFuY2VcbiAgICAgICAgICAgID8gZWxlbWVudC5jb3JyZXNwb25kaW5nVXNlRWxlbWVudFxuICAgICAgICAgICAgOiBlbGVtZW50KTtcbiAgICB9O1xuXG4gICAgc2NvcGUuZ2V0RWxlbWVudFJlY3QgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgc2Nyb2xsID0gYnJvd3Nlci5pc0lPUzdvckxvd2VyXG4gICAgICAgICAgICAgICAgPyB7IHg6IDAsIHk6IDAgfVxuICAgICAgICAgICAgICAgIDogc2NvcGUuZ2V0U2Nyb2xsWFkoc2NvcGUuZ2V0V2luZG93KGVsZW1lbnQpKSxcbiAgICAgICAgICAgIGNsaWVudFJlY3QgPSAoZWxlbWVudCBpbnN0YW5jZW9mIHNjb3BlLlNWR0VsZW1lbnQpP1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk6XG4gICAgICAgICAgICAgICAgZWxlbWVudC5nZXRDbGllbnRSZWN0cygpWzBdO1xuXG4gICAgICAgIHJldHVybiBjbGllbnRSZWN0ICYmIHtcbiAgICAgICAgICAgIGxlZnQgIDogY2xpZW50UmVjdC5sZWZ0ICAgKyBzY3JvbGwueCxcbiAgICAgICAgICAgIHJpZ2h0IDogY2xpZW50UmVjdC5yaWdodCAgKyBzY3JvbGwueCxcbiAgICAgICAgICAgIHRvcCAgIDogY2xpZW50UmVjdC50b3AgICAgKyBzY3JvbGwueSxcbiAgICAgICAgICAgIGJvdHRvbTogY2xpZW50UmVjdC5ib3R0b20gKyBzY3JvbGwueSxcbiAgICAgICAgICAgIHdpZHRoIDogY2xpZW50UmVjdC53aWR0aCB8fCBjbGllbnRSZWN0LnJpZ2h0IC0gY2xpZW50UmVjdC5sZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0OiBjbGllbnRSZWN0LmhlaWdoIHx8IGNsaWVudFJlY3QuYm90dG9tIC0gY2xpZW50UmVjdC50b3BcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdXRpbHMuZ2V0VG91Y2hQYWlyID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciB0b3VjaGVzID0gW107XG5cbiAgICAgICAgLy8gYXJyYXkgb2YgdG91Y2hlcyBpcyBzdXBwbGllZFxuICAgICAgICBpZiAoc2NvcGUuaXNBcnJheShldmVudCkpIHtcbiAgICAgICAgICAgIHRvdWNoZXNbMF0gPSBldmVudFswXTtcbiAgICAgICAgICAgIHRvdWNoZXNbMV0gPSBldmVudFsxXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhbiBldmVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSAndG91Y2hlbmQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoZXNbMF0gPSBldmVudC50b3VjaGVzWzBdO1xuICAgICAgICAgICAgICAgICAgICB0b3VjaGVzWzFdID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoZXNbMF0gPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2hlc1sxXSA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRvdWNoZXNbMF0gPSBldmVudC50b3VjaGVzWzBdO1xuICAgICAgICAgICAgICAgIHRvdWNoZXNbMV0gPSBldmVudC50b3VjaGVzWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRvdWNoZXM7XG4gICAgfTtcblxuICAgIHV0aWxzLnRvdWNoQXZlcmFnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgdG91Y2hlcyA9IHV0aWxzLmdldFRvdWNoUGFpcihldmVudCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhZ2VYOiAodG91Y2hlc1swXS5wYWdlWCArIHRvdWNoZXNbMV0ucGFnZVgpIC8gMixcbiAgICAgICAgICAgIHBhZ2VZOiAodG91Y2hlc1swXS5wYWdlWSArIHRvdWNoZXNbMV0ucGFnZVkpIC8gMixcbiAgICAgICAgICAgIGNsaWVudFg6ICh0b3VjaGVzWzBdLmNsaWVudFggKyB0b3VjaGVzWzFdLmNsaWVudFgpIC8gMixcbiAgICAgICAgICAgIGNsaWVudFk6ICh0b3VjaGVzWzBdLmNsaWVudFkgKyB0b3VjaGVzWzFdLmNsaWVudFkpIC8gMlxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB1dGlscy50b3VjaEJCb3ggPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKCFldmVudC5sZW5ndGggJiYgIShldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b3VjaGVzID0gdXRpbHMuZ2V0VG91Y2hQYWlyKGV2ZW50KSxcbiAgICAgICAgICAgIG1pblggPSBNYXRoLm1pbih0b3VjaGVzWzBdLnBhZ2VYLCB0b3VjaGVzWzFdLnBhZ2VYKSxcbiAgICAgICAgICAgIG1pblkgPSBNYXRoLm1pbih0b3VjaGVzWzBdLnBhZ2VZLCB0b3VjaGVzWzFdLnBhZ2VZKSxcbiAgICAgICAgICAgIG1heFggPSBNYXRoLm1heCh0b3VjaGVzWzBdLnBhZ2VYLCB0b3VjaGVzWzFdLnBhZ2VYKSxcbiAgICAgICAgICAgIG1heFkgPSBNYXRoLm1heCh0b3VjaGVzWzBdLnBhZ2VZLCB0b3VjaGVzWzFdLnBhZ2VZKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogbWluWCxcbiAgICAgICAgICAgIHk6IG1pblksXG4gICAgICAgICAgICBsZWZ0OiBtaW5YLFxuICAgICAgICAgICAgdG9wOiBtaW5ZLFxuICAgICAgICAgICAgd2lkdGg6IG1heFggLSBtaW5YLFxuICAgICAgICAgICAgaGVpZ2h0OiBtYXhZIC0gbWluWVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB1dGlscy50b3VjaERpc3RhbmNlID0gZnVuY3Rpb24gKGV2ZW50LCBkZWx0YVNvdXJjZSkge1xuICAgICAgICBkZWx0YVNvdXJjZSA9IGRlbHRhU291cmNlIHx8IHNjb3BlLmRlZmF1bHRPcHRpb25zLmRlbHRhU291cmNlO1xuXG4gICAgICAgIHZhciBzb3VyY2VYID0gZGVsdGFTb3VyY2UgKyAnWCcsXG4gICAgICAgICAgICBzb3VyY2VZID0gZGVsdGFTb3VyY2UgKyAnWScsXG4gICAgICAgICAgICB0b3VjaGVzID0gdXRpbHMuZ2V0VG91Y2hQYWlyKGV2ZW50KTtcblxuXG4gICAgICAgIHZhciBkeCA9IHRvdWNoZXNbMF1bc291cmNlWF0gLSB0b3VjaGVzWzFdW3NvdXJjZVhdLFxuICAgICAgICAgICAgZHkgPSB0b3VjaGVzWzBdW3NvdXJjZVldIC0gdG91Y2hlc1sxXVtzb3VyY2VZXTtcblxuICAgICAgICByZXR1cm4gdXRpbHMuaHlwb3QoZHgsIGR5KTtcbiAgICB9O1xuXG4gICAgdXRpbHMudG91Y2hBbmdsZSA9IGZ1bmN0aW9uIChldmVudCwgcHJldkFuZ2xlLCBkZWx0YVNvdXJjZSkge1xuICAgICAgICBkZWx0YVNvdXJjZSA9IGRlbHRhU291cmNlIHx8IHNjb3BlLmRlZmF1bHRPcHRpb25zLmRlbHRhU291cmNlO1xuXG4gICAgICAgIHZhciBzb3VyY2VYID0gZGVsdGFTb3VyY2UgKyAnWCcsXG4gICAgICAgICAgICBzb3VyY2VZID0gZGVsdGFTb3VyY2UgKyAnWScsXG4gICAgICAgICAgICB0b3VjaGVzID0gdXRpbHMuZ2V0VG91Y2hQYWlyKGV2ZW50KSxcbiAgICAgICAgICAgIGR4ID0gdG91Y2hlc1swXVtzb3VyY2VYXSAtIHRvdWNoZXNbMV1bc291cmNlWF0sXG4gICAgICAgICAgICBkeSA9IHRvdWNoZXNbMF1bc291cmNlWV0gLSB0b3VjaGVzWzFdW3NvdXJjZVldLFxuICAgICAgICAgICAgYW5nbGUgPSAxODAgKiBNYXRoLmF0YW4oZHkgLyBkeCkgLyBNYXRoLlBJO1xuXG4gICAgICAgIGlmIChzY29wZS5pc051bWJlcihwcmV2QW5nbGUpKSB7XG4gICAgICAgICAgICB2YXIgZHIgPSBhbmdsZSAtIHByZXZBbmdsZSxcbiAgICAgICAgICAgICAgICBkckNsYW1wZWQgPSBkciAlIDM2MDtcblxuICAgICAgICAgICAgaWYgKGRyQ2xhbXBlZCA+IDMxNSkge1xuICAgICAgICAgICAgICAgIGFuZ2xlIC09IDM2MCArIChhbmdsZSAvIDM2MCl8MCAqIDM2MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGRyQ2xhbXBlZCA+IDEzNSkge1xuICAgICAgICAgICAgICAgIGFuZ2xlIC09IDE4MCArIChhbmdsZSAvIDM2MCl8MCAqIDM2MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGRyQ2xhbXBlZCA8IC0zMTUpIHtcbiAgICAgICAgICAgICAgICBhbmdsZSArPSAzNjAgKyAoYW5nbGUgLyAzNjApfDAgKiAzNjA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChkckNsYW1wZWQgPCAtMTM1KSB7XG4gICAgICAgICAgICAgICAgYW5nbGUgKz0gMTgwICsgKGFuZ2xlIC8gMzYwKXwwICogMzYwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICBhbmdsZTtcbiAgICB9O1xuXG4gICAgc2NvcGUuZ2V0T3JpZ2luWFkgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBvcmlnaW4gPSBpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICA/IGludGVyYWN0YWJsZS5vcHRpb25zLm9yaWdpblxuICAgICAgICAgICAgICAgIDogc2NvcGUuZGVmYXVsdE9wdGlvbnMub3JpZ2luO1xuXG4gICAgICAgIGlmIChvcmlnaW4gPT09ICdwYXJlbnQnKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9yaWdpbiA9PT0gJ3NlbGYnKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY29wZS50cnlTZWxlY3RvcihvcmlnaW4pKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBzY29wZS5jbG9zZXN0KGVsZW1lbnQsIG9yaWdpbikgfHwgeyB4OiAwLCB5OiAwIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihvcmlnaW4pKSB7XG4gICAgICAgICAgICBvcmlnaW4gPSBvcmlnaW4oaW50ZXJhY3RhYmxlICYmIGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChvcmlnaW4pKSAge1xuICAgICAgICAgICAgb3JpZ2luID0gc2NvcGUuZ2V0RWxlbWVudFJlY3Qob3JpZ2luKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9yaWdpbi54ID0gKCd4JyBpbiBvcmlnaW4pPyBvcmlnaW4ueCA6IG9yaWdpbi5sZWZ0O1xuICAgICAgICBvcmlnaW4ueSA9ICgneScgaW4gb3JpZ2luKT8gb3JpZ2luLnkgOiBvcmlnaW4udG9wO1xuXG4gICAgICAgIHJldHVybiBvcmlnaW47XG4gICAgfTtcblxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU2MzQ1MjgvMjI4MDg4OFxuICAgIHNjb3BlLl9nZXRRQmV6aWVyVmFsdWUgPSBmdW5jdGlvbiAodCwgcDEsIHAyLCBwMykge1xuICAgICAgICB2YXIgaVQgPSAxIC0gdDtcbiAgICAgICAgcmV0dXJuIGlUICogaVQgKiBwMSArIDIgKiBpVCAqIHQgKiBwMiArIHQgKiB0ICogcDM7XG4gICAgfTtcblxuICAgIHNjb3BlLmdldFF1YWRyYXRpY0N1cnZlUG9pbnQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGNwWCwgY3BZLCBlbmRYLCBlbmRZLCBwb3NpdGlvbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogIHNjb3BlLl9nZXRRQmV6aWVyVmFsdWUocG9zaXRpb24sIHN0YXJ0WCwgY3BYLCBlbmRYKSxcbiAgICAgICAgICAgIHk6ICBzY29wZS5fZ2V0UUJlemllclZhbHVlKHBvc2l0aW9uLCBzdGFydFksIGNwWSwgZW5kWSlcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gaHR0cDovL2dpem1hLmNvbS9lYXNpbmcvXG4gICAgc2NvcGUuZWFzZU91dFF1YWQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xuICAgICAgICB0IC89IGQ7XG4gICAgICAgIHJldHVybiAtYyAqIHQqKHQtMikgKyBiO1xuICAgIH07XG5cbiAgICBzY29wZS5ub2RlQ29udGFpbnMgPSBmdW5jdGlvbiAocGFyZW50LCBjaGlsZCkge1xuICAgICAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgc2NvcGUuY2xvc2VzdCA9IGZ1bmN0aW9uIChjaGlsZCwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoY2hpbGQpO1xuXG4gICAgICAgIHdoaWxlICh1dGlscy5pc0VsZW1lbnQocGFyZW50KSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlLm1hdGNoZXNTZWxlY3RvcihwYXJlbnQsIHNlbGVjdG9yKSkgeyByZXR1cm4gcGFyZW50OyB9XG5cbiAgICAgICAgICAgIHBhcmVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQocGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5cbiAgICBzY29wZS5wYXJlbnRFbGVtZW50ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICAgICAgICBpZiAoc2NvcGUuaXNEb2NGcmFnKHBhcmVudCkpIHtcbiAgICAgICAgICAgIC8vIHNraXAgcGFzdCAjc2hhZG8tcm9vdCBmcmFnbWVudHNcbiAgICAgICAgICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50Lmhvc3QpICYmIHNjb3BlLmlzRG9jRnJhZyhwYXJlbnQpKSB7fVxuXG4gICAgICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmVudDtcbiAgICB9O1xuXG4gICAgc2NvcGUuaW5Db250ZXh0ID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3RhYmxlLl9jb250ZXh0ID09PSBlbGVtZW50Lm93bmVyRG9jdW1lbnRcbiAgICAgICAgICAgICAgICB8fCBzY29wZS5ub2RlQ29udGFpbnMoaW50ZXJhY3RhYmxlLl9jb250ZXh0LCBlbGVtZW50KTtcbiAgICB9O1xuXG4gICAgc2NvcGUudGVzdElnbm9yZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZUVsZW1lbnQsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGlnbm9yZUZyb20gPSBpbnRlcmFjdGFibGUub3B0aW9ucy5pZ25vcmVGcm9tO1xuXG4gICAgICAgIGlmICghaWdub3JlRnJvbSB8fCAhdXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhpZ25vcmVGcm9tKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLm1hdGNoZXNVcFRvKGVsZW1lbnQsIGlnbm9yZUZyb20sIGludGVyYWN0YWJsZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHV0aWxzLmlzRWxlbWVudChpZ25vcmVGcm9tKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLm5vZGVDb250YWlucyhpZ25vcmVGcm9tLCBlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgc2NvcGUudGVzdEFsbG93ID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlRWxlbWVudCwgZWxlbWVudCkge1xuICAgICAgICB2YXIgYWxsb3dGcm9tID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuYWxsb3dGcm9tO1xuXG4gICAgICAgIGlmICghYWxsb3dGcm9tKSB7IHJldHVybiB0cnVlOyB9XG5cbiAgICAgICAgaWYgKCF1dGlscy5pc0VsZW1lbnQoZWxlbWVudCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKGFsbG93RnJvbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5tYXRjaGVzVXBUbyhlbGVtZW50LCBhbGxvd0Zyb20sIGludGVyYWN0YWJsZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHV0aWxzLmlzRWxlbWVudChhbGxvd0Zyb20pKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NvcGUubm9kZUNvbnRhaW5zKGFsbG93RnJvbSwgZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHNjb3BlLmNoZWNrQXhpcyA9IGZ1bmN0aW9uIChheGlzLCBpbnRlcmFjdGFibGUpIHtcbiAgICAgICAgaWYgKCFpbnRlcmFjdGFibGUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgdmFyIHRoaXNBeGlzID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJhZy5heGlzO1xuXG4gICAgICAgIHJldHVybiAoYXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gYXhpcyk7XG4gICAgfTtcblxuICAgIHNjb3BlLmNoZWNrU25hcCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGFjdGlvbikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zO1xuXG4gICAgICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSAncmVzaXplJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRpb25zW2FjdGlvbl0uc25hcCAmJiBvcHRpb25zW2FjdGlvbl0uc25hcC5lbmFibGVkO1xuICAgIH07XG5cbiAgICBzY29wZS5jaGVja1Jlc3RyaWN0ID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSwgYWN0aW9uKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnM7XG5cbiAgICAgICAgaWYgKC9ecmVzaXplLy50ZXN0KGFjdGlvbikpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9ICdyZXNpemUnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICBvcHRpb25zW2FjdGlvbl0ucmVzdHJpY3QgJiYgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0LmVuYWJsZWQ7XG4gICAgfTtcblxuICAgIHNjb3BlLmNoZWNrQXV0b1Njcm9sbCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGFjdGlvbikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zO1xuXG4gICAgICAgIGlmICgvXnJlc2l6ZS8udGVzdChhY3Rpb24pKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSAncmVzaXplJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAgb3B0aW9uc1thY3Rpb25dLmF1dG9TY3JvbGwgJiYgb3B0aW9uc1thY3Rpb25dLmF1dG9TY3JvbGwuZW5hYmxlZDtcbiAgICB9O1xuXG4gICAgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdCA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGFjdGlvbikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zLFxuICAgICAgICAgICAgbWF4QWN0aW9ucyA9IG9wdGlvbnNbYWN0aW9uLm5hbWVdLm1heCxcbiAgICAgICAgICAgIG1heFBlckVsZW1lbnQgPSBvcHRpb25zW2FjdGlvbi5uYW1lXS5tYXhQZXJFbGVtZW50LFxuICAgICAgICAgICAgYWN0aXZlSW50ZXJhY3Rpb25zID0gMCxcbiAgICAgICAgICAgIHRhcmdldENvdW50ID0gMCxcbiAgICAgICAgICAgIHRhcmdldEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldLFxuICAgICAgICAgICAgICAgIG90aGVyQWN0aW9uID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSxcbiAgICAgICAgICAgICAgICBhY3RpdmUgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpO1xuXG4gICAgICAgICAgICBpZiAoIWFjdGl2ZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICBhY3RpdmVJbnRlcmFjdGlvbnMrKztcblxuICAgICAgICAgICAgaWYgKGFjdGl2ZUludGVyYWN0aW9ucyA+PSBzY29wZS5tYXhJbnRlcmFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi50YXJnZXQgIT09IGludGVyYWN0YWJsZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICB0YXJnZXRDb3VudCArPSAob3RoZXJBY3Rpb24gPT09IGFjdGlvbi5uYW1lKXwwO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0Q291bnQgPj0gbWF4QWN0aW9ucykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRFbGVtZW50Q291bnQrKztcblxuICAgICAgICAgICAgICAgIGlmIChvdGhlckFjdGlvbiAhPT0gYWN0aW9uLm5hbWUgfHwgdGFyZ2V0RWxlbWVudENvdW50ID49IG1heFBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY29wZS5tYXhJbnRlcmFjdGlvbnMgPiAwO1xuICAgIH07XG5cbiAgICAvLyBUZXN0IGZvciB0aGUgZWxlbWVudCB0aGF0J3MgXCJhYm92ZVwiIGFsbCBvdGhlciBxdWFsaWZpZXJzXG4gICAgc2NvcGUuaW5kZXhPZkRlZXBlc3RFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnRzKSB7XG4gICAgICAgIHZhciBkcm9wem9uZSxcbiAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZWxlbWVudHNbMF0sXG4gICAgICAgICAgICBpbmRleCA9IGRlZXBlc3Rab25lPyAwOiAtMSxcbiAgICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50cyA9IFtdLFxuICAgICAgICAgICAgZHJvcHpvbmVQYXJlbnRzID0gW10sXG4gICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBuO1xuXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZHJvcHpvbmUgPSBlbGVtZW50c1tpXTtcblxuICAgICAgICAgICAgLy8gYW4gZWxlbWVudCBtaWdodCBiZWxvbmcgdG8gbXVsdGlwbGUgc2VsZWN0b3IgZHJvcHpvbmVzXG4gICAgICAgICAgICBpZiAoIWRyb3B6b25lIHx8IGRyb3B6b25lID09PSBkZWVwZXN0Wm9uZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRlZXBlc3Rab25lKSB7XG4gICAgICAgICAgICAgICAgZGVlcGVzdFpvbmUgPSBkcm9wem9uZTtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBkZWVwZXN0IG9yIGN1cnJlbnQgYXJlIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCBvciBkb2N1bWVudC5yb290RWxlbWVudFxuICAgICAgICAgICAgLy8gLSBpZiB0aGUgY3VycmVudCBkcm9wem9uZSBpcywgZG8gbm90aGluZyBhbmQgY29udGludWVcbiAgICAgICAgICAgIGlmIChkcm9wem9uZS5wYXJlbnROb2RlID09PSBkcm9wem9uZS5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAtIGlmIGRlZXBlc3QgaXMsIHVwZGF0ZSB3aXRoIHRoZSBjdXJyZW50IGRyb3B6b25lIGFuZCBjb250aW51ZSB0byBuZXh0XG4gICAgICAgICAgICBlbHNlIGlmIChkZWVwZXN0Wm9uZS5wYXJlbnROb2RlID09PSBkcm9wem9uZS5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgZGVlcGVzdFpvbmUgPSBkcm9wem9uZTtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZGVlcGVzdFpvbmVQYXJlbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IGRlZXBlc3Rab25lO1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQucGFyZW50Tm9kZSAmJiBwYXJlbnQucGFyZW50Tm9kZSAhPT0gcGFyZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVlcGVzdFpvbmVQYXJlbnRzLnVuc2hpZnQocGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGlzIGVsZW1lbnQgaXMgYW4gc3ZnIGVsZW1lbnQgYW5kIHRoZSBjdXJyZW50IGRlZXBlc3QgaXNcbiAgICAgICAgICAgIC8vIGFuIEhUTUxFbGVtZW50XG4gICAgICAgICAgICBpZiAoZGVlcGVzdFpvbmUgaW5zdGFuY2VvZiBzY29wZS5IVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICYmIGRyb3B6b25lIGluc3RhbmNlb2Ygc2NvcGUuU1ZHRWxlbWVudFxuICAgICAgICAgICAgICAgICYmICEoZHJvcHpvbmUgaW5zdGFuY2VvZiBzY29wZS5TVkdTVkdFbGVtZW50KSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKGRyb3B6b25lID09PSBkZWVwZXN0Wm9uZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhcmVudCA9IGRyb3B6b25lLm93bmVyU1ZHRWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IGRyb3B6b25lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkcm9wem9uZVBhcmVudHMgPSBbXTtcblxuICAgICAgICAgICAgd2hpbGUgKHBhcmVudC5wYXJlbnROb2RlICE9PSBwYXJlbnQub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIGRyb3B6b25lUGFyZW50cy51bnNoaWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG4gPSAwO1xuXG4gICAgICAgICAgICAvLyBnZXQgKHBvc2l0aW9uIG9mIGxhc3QgY29tbW9uIGFuY2VzdG9yKSArIDFcbiAgICAgICAgICAgIHdoaWxlIChkcm9wem9uZVBhcmVudHNbbl0gJiYgZHJvcHpvbmVQYXJlbnRzW25dID09PSBkZWVwZXN0Wm9uZVBhcmVudHNbbl0pIHtcbiAgICAgICAgICAgICAgICBuKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwYXJlbnRzID0gW1xuICAgICAgICAgICAgICAgIGRyb3B6b25lUGFyZW50c1tuIC0gMV0sXG4gICAgICAgICAgICAgICAgZHJvcHpvbmVQYXJlbnRzW25dLFxuICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lUGFyZW50c1tuXVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgY2hpbGQgPSBwYXJlbnRzWzBdLmxhc3RDaGlsZDtcblxuICAgICAgICAgICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkID09PSBwYXJlbnRzWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZXBlc3Rab25lID0gZHJvcHpvbmU7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgZGVlcGVzdFpvbmVQYXJlbnRzID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkID09PSBwYXJlbnRzWzJdKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH07XG5cbiAgICBzY29wZS5tYXRjaGVzU2VsZWN0b3IgPSBmdW5jdGlvbiAoZWxlbWVudCwgc2VsZWN0b3IsIG5vZGVMaXN0KSB7XG4gICAgICAgIGlmIChzY29wZS5pZThNYXRjaGVzU2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5pZThNYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIG5vZGVMaXN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSAvZGVlcC8gZnJvbSBzZWxlY3RvcnMgaWYgc2hhZG93RE9NIHBvbHlmaWxsIGlzIHVzZWRcbiAgICAgICAgaWYgKHNjb3BlLndpbmRvdyAhPT0gc2NvcGUucmVhbFdpbmRvdykge1xuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxlY3Rvci5yZXBsYWNlKC9cXC9kZWVwXFwvL2csICcgJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWxlbWVudFtzY29wZS5wcmVmaXhlZE1hdGNoZXNTZWxlY3Rvcl0oc2VsZWN0b3IpO1xuICAgIH07XG5cbiAgICBzY29wZS5tYXRjaGVzVXBUbyA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3RvciwgbGltaXQpIHtcbiAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSBsaW1pdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvLyBGb3IgSUU4J3MgbGFjayBvZiBhbiBFbGVtZW50I21hdGNoZXNTZWxlY3RvclxuICAgIC8vIHRha2VuIGZyb20gaHR0cDovL3RhbmFsaW4uY29tL2VuL2Jsb2cvMjAxMi8xMi9tYXRjaGVzLXNlbGVjdG9yLWllOC8gYW5kIG1vZGlmaWVkXG4gICAgaWYgKCEoc2NvcGUucHJlZml4ZWRNYXRjaGVzU2VsZWN0b3IgaW4gRWxlbWVudC5wcm90b3R5cGUpIHx8ICFzY29wZS5pc0Z1bmN0aW9uKEVsZW1lbnQucHJvdG90eXBlW3Njb3BlLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yXSkpIHtcbiAgICAgICAgc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNlbGVjdG9yLCBlbGVtcykge1xuICAgICAgICAgICAgZWxlbXMgPSBlbGVtcyB8fCBlbGVtZW50LnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBlbGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChlbGVtc1tpXSA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgSW50ZXJhY3Rpb24gPSByZXF1aXJlKCcuL0ludGVyYWN0aW9uJyk7XG5cbiAgICBmdW5jdGlvbiBnZXRJbnRlcmFjdGlvbkZyb21Qb2ludGVyIChwb2ludGVyLCBldmVudFR5cGUsIGV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBpID0gMCwgbGVuID0gc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aCxcbiAgICAgICAgICAgIG1vdXNlRXZlbnQgPSAoL21vdXNlL2kudGVzdChwb2ludGVyLnBvaW50ZXJUeXBlIHx8IGV2ZW50VHlwZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTVNQb2ludGVyRXZlbnQuTVNQT0lOVEVSX1RZUEVfTU9VU0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgcG9pbnRlci5wb2ludGVyVHlwZSA9PT0gNCksXG4gICAgICAgICAgICBpbnRlcmFjdGlvbjtcblxuICAgICAgICB2YXIgaWQgPSB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcik7XG5cbiAgICAgICAgLy8gdHJ5IHRvIHJlc3VtZSBpbmVydGlhIHdpdGggYSBuZXcgcG9pbnRlclxuICAgICAgICBpZiAoL2Rvd258c3RhcnQvaS50ZXN0KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBldmVudFRhcmdldDtcblxuICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLmFjdGl2ZSAmJiBpbnRlcmFjdGlvbi50YXJnZXQub3B0aW9uc1tpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLmFsbG93UmVzdW1lXG4gICAgICAgICAgICAgICAgICAgICYmIChpbnRlcmFjdGlvbi5tb3VzZSA9PT0gbW91c2VFdmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBlbGVtZW50IGlzIHRoZSBpbnRlcmFjdGlvbiBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gaW50ZXJhY3Rpb24uZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW50ZXJhY3Rpb24ncyBwb2ludGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJzWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoaW50ZXJhY3Rpb24ucG9pbnRlcnNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5hZGRQb2ludGVyKHBvaW50ZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBpdCdzIGEgbW91c2UgaW50ZXJhY3Rpb25cbiAgICAgICAgaWYgKG1vdXNlRXZlbnQgfHwgIShicm93c2VyLnN1cHBvcnRzVG91Y2ggfHwgYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCkpIHtcblxuICAgICAgICAgICAgLy8gZmluZCBhIG1vdXNlIGludGVyYWN0aW9uIHRoYXQncyBub3QgaW4gaW5lcnRpYSBwaGFzZVxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLmludGVyYWN0aW9uc1tpXS5tb3VzZSAmJiAhc2NvcGUuaW50ZXJhY3Rpb25zW2ldLmluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmaW5kIGFueSBpbnRlcmFjdGlvbiBzcGVjaWZpY2FsbHkgZm9yIG1vdXNlLlxuICAgICAgICAgICAgLy8gaWYgdGhlIGV2ZW50VHlwZSBpcyBhIG1vdXNlZG93biwgYW5kIGluZXJ0aWEgaXMgYWN0aXZlXG4gICAgICAgICAgICAvLyBpZ25vcmUgdGhlIGludGVyYWN0aW9uXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaW50ZXJhY3Rpb25zW2ldLm1vdXNlICYmICEoL2Rvd24vLnRlc3QoZXZlbnRUeXBlKSAmJiBzY29wZS5pbnRlcmFjdGlvbnNbaV0uaW5lcnRpYVN0YXR1cy5hY3RpdmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBpbnRlcmFjdGlvbiBmb3IgbW91c2VcbiAgICAgICAgICAgIGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKCk7XG4gICAgICAgICAgICBpbnRlcmFjdGlvbi5tb3VzZSA9IHRydWU7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCBpbnRlcmFjdGlvbiB0aGF0IGhhcyB0aGlzIHBvaW50ZXJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJJZHMsIGlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGlvbnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhdCB0aGlzIHN0YWdlLCBhIHBvaW50ZXJVcCBzaG91bGQgbm90IHJldHVybiBhbiBpbnRlcmFjdGlvblxuICAgICAgICBpZiAoL3VwfGVuZHxvdXQvaS50ZXN0KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZ2V0IGZpcnN0IGlkbGUgaW50ZXJhY3Rpb25cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9uc1tpXTtcblxuICAgICAgICAgICAgaWYgKCghaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSB8fCAoaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnMuZ2VzdHVyZS5lbmFibGVkKSlcbiAgICAgICAgICAgICAgICAmJiAhaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgICAgICYmICEoIW1vdXNlRXZlbnQgJiYgaW50ZXJhY3Rpb24ubW91c2UpKSB7XG5cbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5hZGRQb2ludGVyKHBvaW50ZXIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlcmFjdGlvbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvT25JbnRlcmFjdGlvbnMgKG1ldGhvZCkge1xuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uLFxuICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0ID0gc2NvcGUuZ2V0QWN0dWFsRWxlbWVudChldmVudC5wYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZXZlbnQucGF0aFswXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGV2ZW50LnRhcmdldCksXG4gICAgICAgICAgICAgICAgY3VyRXZlbnRUYXJnZXQgPSBzY29wZS5nZXRBY3R1YWxFbGVtZW50KGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgIGlmIChicm93c2VyLnN1cHBvcnRzVG91Y2ggJiYgL3RvdWNoLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUucHJldlRvdWNoVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb2ludGVyID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gPSBnZXRJbnRlcmFjdGlvbkZyb21Qb2ludGVyKHBvaW50ZXIsIGV2ZW50LnR5cGUsIGV2ZW50VGFyZ2V0KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWludGVyYWN0aW9uKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uX3VwZGF0ZUV2ZW50VGFyZ2V0cyhldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uW21ldGhvZF0ocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ICYmIC9tb3VzZS8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZ25vcmUgbW91c2UgZXZlbnRzIHdoaWxlIHRvdWNoIGludGVyYWN0aW9ucyBhcmUgYWN0aXZlXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzY29wZS5pbnRlcmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2NvcGUuaW50ZXJhY3Rpb25zW2ldLm1vdXNlICYmIHNjb3BlLmludGVyYWN0aW9uc1tpXS5wb2ludGVySXNEb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdHJ5IHRvIGlnbm9yZSBtb3VzZSBldmVudHMgdGhhdCBhcmUgc2ltdWxhdGVkIGJ5IHRoZSBicm93c2VyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFmdGVyIGEgdG91Y2ggZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc2NvcGUucHJldlRvdWNoVGltZSA8IDUwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gPSBnZXRJbnRlcmFjdGlvbkZyb21Qb2ludGVyKGV2ZW50LCBldmVudC50eXBlLCBldmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWludGVyYWN0aW9uKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uX3VwZGF0ZUV2ZW50VGFyZ2V0cyhldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25bbWV0aG9kXShldmVudCwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRPcmlnaW5hbERlZmF1bHQgKCkge1xuICAgICAgICB0aGlzLm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1Jlc2l6ZUVkZ2UgKG5hbWUsIHZhbHVlLCBwYWdlLCBlbGVtZW50LCBpbnRlcmFjdGFibGVFbGVtZW50LCByZWN0LCBtYXJnaW4pIHtcbiAgICAgICAgLy8gZmFsc2UsICcnLCB1bmRlZmluZWQsIG51bGxcbiAgICAgICAgaWYgKCF2YWx1ZSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAvLyB0cnVlIHZhbHVlLCB1c2UgcG9pbnRlciBjb29yZHMgYW5kIGVsZW1lbnQgcmVjdFxuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIC8vIGlmIGRpbWVuc2lvbnMgYXJlIG5lZ2F0aXZlLCBcInN3aXRjaFwiIGVkZ2VzXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBzY29wZS5pc051bWJlcihyZWN0LndpZHRoKT8gcmVjdC53aWR0aCA6IHJlY3QucmlnaHQgLSByZWN0LmxlZnQsXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gc2NvcGUuaXNOdW1iZXIocmVjdC5oZWlnaHQpPyByZWN0LmhlaWdodCA6IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7XG5cbiAgICAgICAgICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgICAgICBpZiAgICAgIChuYW1lID09PSAnbGVmdCcgKSB7IG5hbWUgPSAncmlnaHQnOyB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ3JpZ2h0JykgeyBuYW1lID0gJ2xlZnQnIDsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICBpZiAgICAgIChuYW1lID09PSAndG9wJyAgICkgeyBuYW1lID0gJ2JvdHRvbSc7IH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChuYW1lID09PSAnYm90dG9tJykgeyBuYW1lID0gJ3RvcCcgICA7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdsZWZ0JyAgKSB7IHJldHVybiBwYWdlLnggPCAoKHdpZHRoICA+PSAwPyByZWN0LmxlZnQ6IHJlY3QucmlnaHQgKSArIG1hcmdpbik7IH1cbiAgICAgICAgICAgIGlmIChuYW1lID09PSAndG9wJyAgICkgeyByZXR1cm4gcGFnZS55IDwgKChoZWlnaHQgPj0gMD8gcmVjdC50b3AgOiByZWN0LmJvdHRvbSkgKyBtYXJnaW4pOyB9XG5cbiAgICAgICAgICAgIGlmIChuYW1lID09PSAncmlnaHQnICkgeyByZXR1cm4gcGFnZS54ID4gKCh3aWR0aCAgPj0gMD8gcmVjdC5yaWdodCA6IHJlY3QubGVmdCkgLSBtYXJnaW4pOyB9XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgcmV0dXJuIHBhZ2UueSA+ICgoaGVpZ2h0ID49IDA/IHJlY3QuYm90dG9tOiByZWN0LnRvcCApIC0gbWFyZ2luKTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIHJlbWFpbmluZyBjaGVja3MgcmVxdWlyZSBhbiBlbGVtZW50XG4gICAgICAgIGlmICghdXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgIHJldHVybiB1dGlscy5pc0VsZW1lbnQodmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSB2YWx1ZSBpcyBhbiBlbGVtZW50IHRvIHVzZSBhcyBhIHJlc2l6ZSBoYW5kbGVcbiAgICAgICAgICAgICAgICAgICAgPyB2YWx1ZSA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgY2hlY2sgaWYgZWxlbWVudCBtYXRjaGVzIHZhbHVlIGFzIHNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgIDogc2NvcGUubWF0Y2hlc1VwVG8oZWxlbWVudCwgdmFsdWUsIGludGVyYWN0YWJsZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRBY3Rpb25DaGVja2VyIChwb2ludGVyLCBpbnRlcmFjdGlvbiwgZWxlbWVudCkge1xuICAgICAgICB2YXIgcmVjdCA9IHRoaXMuZ2V0UmVjdChlbGVtZW50KSxcbiAgICAgICAgICAgIHNob3VsZFJlc2l6ZSA9IGZhbHNlLFxuICAgICAgICAgICAgYWN0aW9uID0gbnVsbCxcbiAgICAgICAgICAgIHJlc2l6ZUF4ZXMgPSBudWxsLFxuICAgICAgICAgICAgcmVzaXplRWRnZXMsXG4gICAgICAgICAgICBwYWdlID0gdXRpbHMuZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5jdXJDb29yZHMucGFnZSksXG4gICAgICAgICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgICAgIGlmICghcmVjdCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgICAgIGlmIChzY29wZS5hY3Rpb25Jc0VuYWJsZWQucmVzaXplICYmIG9wdGlvbnMucmVzaXplLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHZhciByZXNpemVPcHRpb25zID0gb3B0aW9ucy5yZXNpemU7XG5cbiAgICAgICAgICAgIHJlc2l6ZUVkZ2VzID0ge1xuICAgICAgICAgICAgICAgIGxlZnQ6IGZhbHNlLCByaWdodDogZmFsc2UsIHRvcDogZmFsc2UsIGJvdHRvbTogZmFsc2VcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGlmIHVzaW5nIHJlc2l6ZS5lZGdlc1xuICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KHJlc2l6ZU9wdGlvbnMuZWRnZXMpKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgICAgICAgICAgICByZXNpemVFZGdlc1tlZGdlXSA9IGNoZWNrUmVzaXplRWRnZShlZGdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpemVPcHRpb25zLmVkZ2VzW2VkZ2VdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5fZXZlbnRUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMubWFyZ2luIHx8IHNjb3BlLm1hcmdpbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzaXplRWRnZXMubGVmdCA9IHJlc2l6ZUVkZ2VzLmxlZnQgJiYgIXJlc2l6ZUVkZ2VzLnJpZ2h0O1xuICAgICAgICAgICAgICAgIHJlc2l6ZUVkZ2VzLnRvcCAgPSByZXNpemVFZGdlcy50b3AgICYmICFyZXNpemVFZGdlcy5ib3R0b207XG5cbiAgICAgICAgICAgICAgICBzaG91bGRSZXNpemUgPSByZXNpemVFZGdlcy5sZWZ0IHx8IHJlc2l6ZUVkZ2VzLnJpZ2h0IHx8IHJlc2l6ZUVkZ2VzLnRvcCB8fCByZXNpemVFZGdlcy5ib3R0b207XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmlnaHQgID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3knICYmIHBhZ2UueCA+IChyZWN0LnJpZ2h0ICAtIHNjb3BlLm1hcmdpbiksXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbSA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd4JyAmJiBwYWdlLnkgPiAocmVjdC5ib3R0b20gLSBzY29wZS5tYXJnaW4pO1xuXG4gICAgICAgICAgICAgICAgc2hvdWxkUmVzaXplID0gcmlnaHQgfHwgYm90dG9tO1xuICAgICAgICAgICAgICAgIHJlc2l6ZUF4ZXMgPSAocmlnaHQ/ICd4JyA6ICcnKSArIChib3R0b20/ICd5JyA6ICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFjdGlvbiA9IHNob3VsZFJlc2l6ZVxuICAgICAgICAgICAgPyAncmVzaXplJ1xuICAgICAgICAgICAgOiBzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZHJhZyAmJiBvcHRpb25zLmRyYWcuZW5hYmxlZFxuICAgICAgICAgICAgICAgID8gJ2RyYWcnXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuXG4gICAgICAgIGlmIChzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZ2VzdHVyZVxuICAgICAgICAgICAgJiYgaW50ZXJhY3Rpb24ucG9pbnRlcklkcy5sZW5ndGggPj0yXG4gICAgICAgICAgICAmJiAhKGludGVyYWN0aW9uLmRyYWdnaW5nIHx8IGludGVyYWN0aW9uLnJlc2l6aW5nKSkge1xuICAgICAgICAgICAgYWN0aW9uID0gJ2dlc3R1cmUnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBhY3Rpb24sXG4gICAgICAgICAgICAgICAgYXhpczogcmVzaXplQXhlcyxcbiAgICAgICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgSW50ZXJhY3RFdmVudCA9IHJlcXVpcmUoJy4vSW50ZXJhY3RFdmVudCcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGludGVyYWN0aW9uTGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lck5hbWUgPSBpbnRlcmFjdGlvbkxpc3RlbmVyc1tpXTtcblxuICAgICAgICBzY29wZS5saXN0ZW5lcnNbbGlzdGVuZXJOYW1lXSA9IGRvT25JbnRlcmFjdGlvbnMobGlzdGVuZXJOYW1lKTtcbiAgICB9XG5cbiAgICAvLyBib3VuZCB0byB0aGUgaW50ZXJhY3RhYmxlIGNvbnRleHQgd2hlbiBhIERPTSBldmVudFxuICAgIC8vIGxpc3RlbmVyIGlzIGFkZGVkIHRvIGEgc2VsZWN0b3IgaW50ZXJhY3RhYmxlXG4gICAgZnVuY3Rpb24gZGVsZWdhdGVMaXN0ZW5lciAoZXZlbnQsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgdmFyIGZha2VFdmVudCA9IHt9LFxuICAgICAgICAgICAgZGVsZWdhdGVkID0gc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50LnR5cGVdLFxuICAgICAgICAgICAgZXZlbnRUYXJnZXQgPSBzY29wZS5nZXRBY3R1YWxFbGVtZW50KGV2ZW50LnBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50LnBhdGhbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGV2ZW50LnRhcmdldCksXG4gICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgICAgIC8vIGR1cGxpY2F0ZSB0aGUgZXZlbnQgc28gdGhhdCBjdXJyZW50VGFyZ2V0IGNhbiBiZSBjaGFuZ2VkXG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gZXZlbnQpIHtcbiAgICAgICAgICAgIGZha2VFdmVudFtwcm9wXSA9IGV2ZW50W3Byb3BdO1xuICAgICAgICB9XG5cbiAgICAgICAgZmFrZUV2ZW50Lm9yaWdpbmFsRXZlbnQgPSBldmVudDtcbiAgICAgICAgZmFrZUV2ZW50LnByZXZlbnREZWZhdWx0ID0gcHJldmVudE9yaWdpbmFsRGVmYXVsdDtcblxuICAgICAgICAvLyBjbGltYiB1cCBkb2N1bWVudCB0cmVlIGxvb2tpbmcgZm9yIHNlbGVjdG9yIG1hdGNoZXNcbiAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9yID0gZGVsZWdhdGVkLnNlbGVjdG9yc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGRlbGVnYXRlZC5jb250ZXh0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmIChzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgICAgICYmIHNjb3BlLm5vZGVDb250YWlucyhjb250ZXh0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUubm9kZUNvbnRhaW5zKGNvbnRleHQsIGVsZW1lbnQpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IGRlbGVnYXRlZC5saXN0ZW5lcnNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgZmFrZUV2ZW50LmN1cnJlbnRUYXJnZXQgPSBlbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGlzdGVuZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2pdWzFdID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2pdWzBdKGZha2VFdmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVsZWdhdGVVc2VDYXB0dXJlIChldmVudCkge1xuICAgICAgICByZXR1cm4gZGVsZWdhdGVMaXN0ZW5lci5jYWxsKHRoaXMsIGV2ZW50LCB0cnVlKTtcbiAgICB9XG5cbiAgICBzY29wZS5pbnRlcmFjdGFibGVzLmluZGV4T2ZFbGVtZW50ID0gZnVuY3Rpb24gaW5kZXhPZkVsZW1lbnQgKGVsZW1lbnQsIGNvbnRleHQpIHtcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgc2NvcGUuZG9jdW1lbnQ7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaW50ZXJhY3RhYmxlID0gdGhpc1tpXTtcblxuICAgICAgICAgICAgaWYgKChpbnRlcmFjdGFibGUuc2VsZWN0b3IgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAmJiAoaW50ZXJhY3RhYmxlLl9jb250ZXh0ID09PSBjb250ZXh0KSlcbiAgICAgICAgICAgICAgICB8fCAoIWludGVyYWN0YWJsZS5zZWxlY3RvciAmJiBpbnRlcmFjdGFibGUuX2VsZW1lbnQgPT09IGVsZW1lbnQpKSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZ2V0ID0gZnVuY3Rpb24gaW50ZXJhY3RhYmxlR2V0IChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzW3RoaXMuaW5kZXhPZkVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyAmJiBvcHRpb25zLmNvbnRleHQpXTtcbiAgICB9O1xuXG4gICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5mb3JFYWNoU2VsZWN0b3IgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaW50ZXJhY3RhYmxlID0gdGhpc1tpXTtcblxuICAgICAgICAgICAgaWYgKCFpbnRlcmFjdGFibGUuc2VsZWN0b3IpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJldCA9IGNhbGxiYWNrKGludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlLnNlbGVjdG9yLCBpbnRlcmFjdGFibGUuX2NvbnRleHQsIGksIHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBUaGUgbWV0aG9kcyBvZiB0aGlzIHZhcmlhYmxlIGNhbiBiZSB1c2VkIHRvIHNldCBlbGVtZW50cyBhc1xuICAgICAqIGludGVyYWN0YWJsZXMgYW5kIGFsc28gdG8gY2hhbmdlIHZhcmlvdXMgZGVmYXVsdCBzZXR0aW5ncy5cbiAgICAgKlxuICAgICAqIENhbGxpbmcgaXQgYXMgYSBmdW5jdGlvbiBhbmQgcGFzc2luZyBhbiBlbGVtZW50IG9yIGEgdmFsaWQgQ1NTIHNlbGVjdG9yXG4gICAgICogc3RyaW5nIHJldHVybnMgYW4gSW50ZXJhY3RhYmxlIG9iamVjdCB3aGljaCBoYXMgdmFyaW91cyBtZXRob2RzIHRvXG4gICAgICogY29uZmlndXJlIGl0LlxuICAgICAqXG4gICAgIC0gZWxlbWVudCAoRWxlbWVudCB8IHN0cmluZykgVGhlIEhUTUwgb3IgU1ZHIEVsZW1lbnQgdG8gaW50ZXJhY3Qgd2l0aCBvciBDU1Mgc2VsZWN0b3JcbiAgICAgPSAob2JqZWN0KSBBbiBASW50ZXJhY3RhYmxlXG4gICAgICpcbiAgICAgPiBVc2FnZVxuICAgICB8IGludGVyYWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcmFnZ2FibGUnKSkuZHJhZ2dhYmxlKHRydWUpO1xuICAgICB8XG4gICAgIHwgdmFyIHJlY3RhYmxlcyA9IGludGVyYWN0KCdyZWN0Jyk7XG4gICAgIHwgcmVjdGFibGVzXG4gICAgIHwgICAgIC5nZXN0dXJhYmxlKHRydWUpXG4gICAgIHwgICAgIC5vbignZ2VzdHVyZW1vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgfCAgICAgICAgIC8vIHNvbWV0aGluZyBjb29sLi4uXG4gICAgIHwgICAgIH0pXG4gICAgIHwgICAgIC5hdXRvU2Nyb2xsKHRydWUpO1xuICAgIFxcKi9cbiAgICBmdW5jdGlvbiBpbnRlcmFjdCAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZWxlbWVudCwgb3B0aW9ucykgfHwgbmV3IEludGVyYWN0YWJsZShlbGVtZW50LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKlxcXG4gICAgICogSW50ZXJhY3RhYmxlXG4gICAgIFsgcHJvcGVydHkgXVxuICAgICAqKlxuICAgICAqIE9iamVjdCB0eXBlIHJldHVybmVkIGJ5IEBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBmdW5jdGlvbiBJbnRlcmFjdGFibGUgKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIHRoaXMuX2lFdmVudHMgPSB0aGlzLl9pRXZlbnRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBfd2luZG93O1xuXG4gICAgICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihlbGVtZW50KSkge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RvciA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gb3B0aW9ucyAmJiBvcHRpb25zLmNvbnRleHQ7XG5cbiAgICAgICAgICAgIF93aW5kb3cgPSBjb250ZXh0PyBzY29wZS5nZXRXaW5kb3coY29udGV4dCkgOiBzY29wZS53aW5kb3c7XG5cbiAgICAgICAgICAgIGlmIChjb250ZXh0ICYmIChfd2luZG93Lk5vZGVcbiAgICAgICAgICAgICAgICAgICAgPyBjb250ZXh0IGluc3RhbmNlb2YgX3dpbmRvdy5Ob2RlXG4gICAgICAgICAgICAgICAgICAgIDogKHV0aWxzLmlzRWxlbWVudChjb250ZXh0KSB8fCBjb250ZXh0ID09PSBfd2luZG93LmRvY3VtZW50KSkpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgX3dpbmRvdyA9IHNjb3BlLmdldFdpbmRvdyhlbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50LCBfd2luZG93KSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLlBvaW50ZXJFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsIHNjb3BlLnBFdmVudFR5cGVzLmRvd24sIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyRG93biApO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsIHNjb3BlLnBFdmVudFR5cGVzLm1vdmUsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAnbW91c2Vkb3duJyAsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyRG93biApO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMuYWRkKHRoaXMuX2VsZW1lbnQsICdtb3VzZW1vdmUnICwgc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJIb3Zlcik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgJ3RvdWNoc3RhcnQnLCBzY29wZS5saXN0ZW5lcnMucG9pbnRlckRvd24gKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLl9lbGVtZW50LCAndG91Y2htb3ZlJyAsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2RvYyA9IF93aW5kb3cuZG9jdW1lbnQ7XG5cbiAgICAgICAgaWYgKCFzY29wZS5jb250YWlucyhzY29wZS5kb2N1bWVudHMsIHRoaXMuX2RvYykpIHtcbiAgICAgICAgICAgIGxpc3RlblRvRG9jdW1lbnQodGhpcy5fZG9jKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMucHVzaCh0aGlzKTtcblxuICAgICAgICB0aGlzLnNldChvcHRpb25zKTtcbiAgICB9XG5cbiAgICBJbnRlcmFjdGFibGUucHJvdG90eXBlID0ge1xuICAgICAgICBzZXRPbkV2ZW50czogZnVuY3Rpb24gKGFjdGlvbiwgcGhhc2VzKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnZHJvcCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wKSAgICAgICAgICApIHsgdGhpcy5vbmRyb3AgICAgICAgICAgID0gcGhhc2VzLm9uZHJvcCAgICAgICAgICA7IH1cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wYWN0aXZhdGUpICApIHsgdGhpcy5vbmRyb3BhY3RpdmF0ZSAgID0gcGhhc2VzLm9uZHJvcGFjdGl2YXRlICA7IH1cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wZGVhY3RpdmF0ZSkpIHsgdGhpcy5vbmRyb3BkZWFjdGl2YXRlID0gcGhhc2VzLm9uZHJvcGRlYWN0aXZhdGU7IH1cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcmFnZW50ZXIpICAgICApIHsgdGhpcy5vbmRyYWdlbnRlciAgICAgID0gcGhhc2VzLm9uZHJhZ2VudGVyICAgICA7IH1cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcmFnbGVhdmUpICAgICApIHsgdGhpcy5vbmRyYWdsZWF2ZSAgICAgID0gcGhhc2VzLm9uZHJhZ2xlYXZlICAgICA7IH1cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25kcm9wbW92ZSkgICAgICApIHsgdGhpcy5vbmRyb3Btb3ZlICAgICAgID0gcGhhc2VzLm9uZHJvcG1vdmUgICAgICA7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFjdGlvbiA9ICdvbicgKyBhY3Rpb247XG5cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25zdGFydCkgICAgICAgKSB7IHRoaXNbYWN0aW9uICsgJ3N0YXJ0JyAgICAgICAgIF0gPSBwaGFzZXMub25zdGFydCAgICAgICAgIDsgfVxuICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHBoYXNlcy5vbm1vdmUpICAgICAgICApIHsgdGhpc1thY3Rpb24gKyAnbW92ZScgICAgICAgICAgXSA9IHBoYXNlcy5vbm1vdmUgICAgICAgICAgOyB9XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24ocGhhc2VzLm9uZW5kKSAgICAgICAgICkgeyB0aGlzW2FjdGlvbiArICdlbmQnICAgICAgICAgICBdID0gcGhhc2VzLm9uZW5kICAgICAgICAgICA7IH1cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihwaGFzZXMub25pbmVydGlhc3RhcnQpKSB7IHRoaXNbYWN0aW9uICsgJ2luZXJ0aWFzdGFydCcgIF0gPSBwaGFzZXMub25pbmVydGlhc3RhcnQgIDsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5kcmFnZ2FibGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgZHJhZyBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlXG4gICAgICAgICAqIEludGVyYWN0YWJsZVxuICAgICAgICAgKlxuICAgICAgICAgPSAoYm9vbGVhbikgSW5kaWNhdGVzIGlmIHRoaXMgY2FuIGJlIHRoZSB0YXJnZXQgb2YgZHJhZyBldmVudHNcbiAgICAgICAgIHwgdmFyIGlzRHJhZ2dhYmxlID0gaW50ZXJhY3QoJ3VsIGxpJykuZHJhZ2dhYmxlKCk7XG4gICAgICAgICAqIG9yXG4gICAgICAgICAtIG9wdGlvbnMgKGJvb2xlYW4gfCBvYmplY3QpICNvcHRpb25hbCB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50IGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiBkcmFnIGV2ZW50cyAob2JqZWN0IG1ha2VzIHRoZSBJbnRlcmFjdGFibGUgZHJhZ2dhYmxlKVxuICAgICAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsZVxuICAgICAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5kcmFnZ2FibGUoe1xuICAgICAgICAgfCAgICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgICAgIHwgICAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgICAgICB8ICAgICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gdGhlIGF4aXMgaW4gd2hpY2ggdGhlIGZpcnN0IG1vdmVtZW50IG11c3QgYmVcbiAgICAgICAgIHwgICAgIC8vIGZvciB0aGUgZHJhZyBzZXF1ZW5jZSB0byBzdGFydFxuICAgICAgICAgfCAgICAgLy8gJ3h5JyBieSBkZWZhdWx0IC0gYW55IGRpcmVjdGlvblxuICAgICAgICAgfCAgICAgYXhpczogJ3gnIHx8ICd5JyB8fCAneHknLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gbWF4IG51bWJlciBvZiBkcmFncyB0aGF0IGNhbiBoYXBwZW4gY29uY3VycmVudGx5XG4gICAgICAgICB8ICAgICAvLyB3aXRoIGVsZW1lbnRzIG9mIHRoaXMgSW50ZXJhY3RhYmxlLiBJbmZpbml0eSBieSBkZWZhdWx0XG4gICAgICAgICB8ICAgICBtYXg6IEluZmluaXR5LFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gbWF4IG51bWJlciBvZiBkcmFncyB0aGF0IGNhbiB0YXJnZXQgdGhlIHNhbWUgZWxlbWVudCtJbnRlcmFjdGFibGVcbiAgICAgICAgIHwgICAgIC8vIDEgYnkgZGVmYXVsdFxuICAgICAgICAgfCAgICAgbWF4UGVyRWxlbWVudDogMlxuICAgICAgICAgfCB9KTtcbiAgICAgICAgXFwqL1xuICAgICAgICBkcmFnZ2FibGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJhZy5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkID09PSBmYWxzZT8gZmFsc2U6IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oJ2RyYWcnLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldE9uRXZlbnRzKCdkcmFnJywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoL154JHxeeSR8Xnh5JC8udGVzdChvcHRpb25zLmF4aXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcmFnLmF4aXMgPSBvcHRpb25zLmF4aXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuYXhpcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmRyYWcuYXhpcztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcmFnLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJhZztcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRQZXJBY3Rpb246IGZ1bmN0aW9uIChhY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIGZvciBhbGwgdGhlIGRlZmF1bHQgcGVyLWFjdGlvbiBvcHRpb25zXG4gICAgICAgICAgICBmb3IgKHZhciBvcHRpb24gaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgb3B0aW9uIGV4aXN0cyBmb3IgdGhpcyBhY3Rpb25cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uIGluIHNjb3BlLmRlZmF1bHRPcHRpb25zW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIG9wdGlvbiBpbiB0aGUgb3B0aW9ucyBhcmcgaXMgYW4gb2JqZWN0IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zW29wdGlvbl0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkdXBsaWNhdGUgdGhlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXSA9IHV0aWxzLmV4dGVuZCh0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25dIHx8IHt9LCBvcHRpb25zW29wdGlvbl0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qoc2NvcGUuZGVmYXVsdE9wdGlvbnMucGVyQWN0aW9uW29wdGlvbl0pICYmICdlbmFibGVkJyBpbiBzY29wZS5kZWZhdWx0T3B0aW9ucy5wZXJBY3Rpb25bb3B0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbl0uZW5hYmxlZCA9IG9wdGlvbnNbb3B0aW9uXS5lbmFibGVkID09PSBmYWxzZT8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zW29wdGlvbl0pICYmIHNjb3BlLmlzT2JqZWN0KHNjb3BlLmRlZmF1bHRPcHRpb25zLnBlckFjdGlvbltvcHRpb25dKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXS5lbmFibGVkID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnNbb3B0aW9uXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvciBpZiBpdCdzIG5vdCB1bmRlZmluZWQsIGRvIGEgcGxhaW4gYXNzaWdubWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5kcm9wem9uZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBlbGVtZW50cyBjYW4gYmUgZHJvcHBlZCBvbnRvIHRoaXNcbiAgICAgICAgICogSW50ZXJhY3RhYmxlIHRvIHRyaWdnZXIgZHJvcCBldmVudHNcbiAgICAgICAgICpcbiAgICAgICAgICogRHJvcHpvbmVzIGNhbiByZWNlaXZlIHRoZSBmb2xsb3dpbmcgZXZlbnRzOlxuICAgICAgICAgKiAgLSBgZHJvcGFjdGl2YXRlYCBhbmQgYGRyb3BkZWFjdGl2YXRlYCB3aGVuIGFuIGFjY2VwdGFibGUgZHJhZyBzdGFydHMgYW5kIGVuZHNcbiAgICAgICAgICogIC0gYGRyYWdlbnRlcmAgYW5kIGBkcmFnbGVhdmVgIHdoZW4gYSBkcmFnZ2FibGUgZW50ZXJzIGFuZCBsZWF2ZXMgdGhlIGRyb3B6b25lXG4gICAgICAgICAqICAtIGBkcmFnbW92ZWAgd2hlbiBhIGRyYWdnYWJsZSB0aGF0IGhhcyBlbnRlcmVkIHRoZSBkcm9wem9uZSBpcyBtb3ZlZFxuICAgICAgICAgKiAgLSBgZHJvcGAgd2hlbiBhIGRyYWdnYWJsZSBpcyBkcm9wcGVkIGludG8gdGhpcyBkcm9wem9uZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgVXNlIHRoZSBgYWNjZXB0YCBvcHRpb24gdG8gYWxsb3cgb25seSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBnaXZlbiBDU1Mgc2VsZWN0b3Igb3IgZWxlbWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogIFVzZSB0aGUgYG92ZXJsYXBgIG9wdGlvbiB0byBzZXQgaG93IGRyb3BzIGFyZSBjaGVja2VkIGZvci4gVGhlIGFsbG93ZWQgdmFsdWVzIGFyZTpcbiAgICAgICAgICogICAtIGAncG9pbnRlcidgLCB0aGUgcG9pbnRlciBtdXN0IGJlIG92ZXIgdGhlIGRyb3B6b25lIChkZWZhdWx0KVxuICAgICAgICAgKiAgIC0gYCdjZW50ZXInYCwgdGhlIGRyYWdnYWJsZSBlbGVtZW50J3MgY2VudGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICAgICAgICogICAtIGEgbnVtYmVyIGZyb20gMC0xIHdoaWNoIGlzIHRoZSBgKGludGVyc2VjdGlvbiBhcmVhKSAvIChkcmFnZ2FibGUgYXJlYSlgLlxuICAgICAgICAgKiAgICAgICBlLmcuIGAwLjVgIGZvciBkcm9wIHRvIGhhcHBlbiB3aGVuIGhhbGYgb2YgdGhlIGFyZWEgb2YgdGhlXG4gICAgICAgICAqICAgICAgIGRyYWdnYWJsZSBpcyBvdmVyIHRoZSBkcm9wem9uZVxuICAgICAgICAgKlxuICAgICAgICAgLSBvcHRpb25zIChib29sZWFuIHwgb2JqZWN0IHwgbnVsbCkgI29wdGlvbmFsIFRoZSBuZXcgdmFsdWUgdG8gYmUgc2V0LlxuICAgICAgICAgfCBpbnRlcmFjdCgnLmRyb3AnKS5kcm9wem9uZSh7XG4gICAgICAgICB8ICAgYWNjZXB0OiAnLmNhbi1kcm9wJyB8fCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2luZ2xlLWRyb3AnKSxcbiAgICAgICAgIHwgICBvdmVybGFwOiAncG9pbnRlcicgfHwgJ2NlbnRlcicgfHwgemVyb1RvT25lXG4gICAgICAgICB8IH1cbiAgICAgICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgXFwqL1xuICAgICAgICBkcm9wem9uZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldE9uRXZlbnRzKCdkcm9wJywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5hY2NlcHQob3B0aW9ucy5hY2NlcHQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKC9eKHBvaW50ZXJ8Y2VudGVyKSQvLnRlc3Qob3B0aW9ucy5vdmVybGFwKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5vdmVybGFwID0gb3B0aW9ucy5vdmVybGFwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzY29wZS5pc051bWJlcihvcHRpb25zLm92ZXJsYXApKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLm92ZXJsYXAgPSBNYXRoLm1heChNYXRoLm1pbigxLCBvcHRpb25zLm92ZXJsYXApLCAwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJvcDtcbiAgICAgICAgfSxcblxuICAgICAgICBkcm9wQ2hlY2s6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50LCBkcm9wRWxlbWVudCwgcmVjdCkge1xuICAgICAgICAgICAgdmFyIGRyb3BwZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIGRyb3B6b25lIGhhcyBubyByZWN0IChlZy4gZGlzcGxheTogbm9uZSlcbiAgICAgICAgICAgIC8vIGNhbGwgdGhlIGN1c3RvbSBkcm9wQ2hlY2tlciBvciBqdXN0IHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKCEocmVjdCA9IHJlY3QgfHwgdGhpcy5nZXRSZWN0KGRyb3BFbGVtZW50KSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlclxuICAgICAgICAgICAgICAgICAgICA/IHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlcihwb2ludGVyLCBldmVudCwgZHJvcHBlZCwgdGhpcywgZHJvcEVsZW1lbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgOiBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBkcm9wT3ZlcmxhcCA9IHRoaXMub3B0aW9ucy5kcm9wLm92ZXJsYXA7XG5cbiAgICAgICAgICAgIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ3BvaW50ZXInKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSB1dGlscy5nZXRQYWdlWFkocG9pbnRlciksXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbiA9IHNjb3BlLmdldE9yaWdpblhZKGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCksXG4gICAgICAgICAgICAgICAgICAgIGhvcml6b250YWwsXG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsO1xuXG4gICAgICAgICAgICAgICAgcGFnZS54ICs9IG9yaWdpbi54O1xuICAgICAgICAgICAgICAgIHBhZ2UueSArPSBvcmlnaW4ueTtcblxuICAgICAgICAgICAgICAgIGhvcml6b250YWwgPSAocGFnZS54ID4gcmVjdC5sZWZ0KSAmJiAocGFnZS54IDwgcmVjdC5yaWdodCk7XG4gICAgICAgICAgICAgICAgdmVydGljYWwgICA9IChwYWdlLnkgPiByZWN0LnRvcCApICYmIChwYWdlLnkgPCByZWN0LmJvdHRvbSk7XG5cbiAgICAgICAgICAgICAgICBkcm9wcGVkID0gaG9yaXpvbnRhbCAmJiB2ZXJ0aWNhbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGRyYWdSZWN0ID0gZHJhZ2dhYmxlLmdldFJlY3QoZHJhZ2dhYmxlRWxlbWVudCk7XG5cbiAgICAgICAgICAgIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3ggPSBkcmFnUmVjdC5sZWZ0ICsgZHJhZ1JlY3Qud2lkdGggIC8gMixcbiAgICAgICAgICAgICAgICAgICAgY3kgPSBkcmFnUmVjdC50b3AgICsgZHJhZ1JlY3QuaGVpZ2h0IC8gMjtcblxuICAgICAgICAgICAgICAgIGRyb3BwZWQgPSBjeCA+PSByZWN0LmxlZnQgJiYgY3ggPD0gcmVjdC5yaWdodCAmJiBjeSA+PSByZWN0LnRvcCAmJiBjeSA8PSByZWN0LmJvdHRvbTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzTnVtYmVyKGRyb3BPdmVybGFwKSkge1xuICAgICAgICAgICAgICAgIHZhciBvdmVybGFwQXJlYSAgPSAoTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5yaWdodCAsIGRyYWdSZWN0LnJpZ2h0ICkgLSBNYXRoLm1heChyZWN0LmxlZnQsIGRyYWdSZWN0LmxlZnQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5ib3R0b20sIGRyYWdSZWN0LmJvdHRvbSkgLSBNYXRoLm1heChyZWN0LnRvcCAsIGRyYWdSZWN0LnRvcCApKSksXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXBSYXRpbyA9IG92ZXJsYXBBcmVhIC8gKGRyYWdSZWN0LndpZHRoICogZHJhZ1JlY3QuaGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgIGRyb3BwZWQgPSBvdmVybGFwUmF0aW8gPj0gZHJvcE92ZXJsYXA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXIpIHtcbiAgICAgICAgICAgICAgICBkcm9wcGVkID0gdGhpcy5vcHRpb25zLmRyb3BDaGVja2VyKHBvaW50ZXIsIGRyb3BwZWQsIHRoaXMsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZHJvcHBlZDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5kcm9wQ2hlY2tlclxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKlxuICAgICAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaWYgYSBkcmFnZ2VkIGVsZW1lbnQgaXNcbiAgICAgICAgICogb3ZlciB0aGlzIEludGVyYWN0YWJsZS5cbiAgICAgICAgICpcbiAgICAgICAgIC0gY2hlY2tlciAoZnVuY3Rpb24pICNvcHRpb25hbCBUaGUgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCB3aGVuIGNoZWNraW5nIGZvciBhIGRyb3BcbiAgICAgICAgID0gKEZ1bmN0aW9uIHwgSW50ZXJhY3RhYmxlKSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2hlY2tlciBmdW5jdGlvbiB0YWtlcyB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAgICAgICpcbiAgICAgICAgIC0gcG9pbnRlciAoVG91Y2ggfCBQb2ludGVyRXZlbnQgfCBNb3VzZUV2ZW50KSBUaGUgcG9pbnRlci9ldmVudCB0aGF0IGVuZHMgYSBkcmFnXG4gICAgICAgICAtIGV2ZW50IChUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50IHwgTW91c2VFdmVudCkgVGhlIGV2ZW50IHJlbGF0ZWQgdG8gdGhlIHBvaW50ZXJcbiAgICAgICAgIC0gZHJvcHBlZCAoYm9vbGVhbikgVGhlIHZhbHVlIGZyb20gdGhlIGRlZmF1bHQgZHJvcCBjaGVja1xuICAgICAgICAgLSBkcm9wem9uZSAoSW50ZXJhY3RhYmxlKSBUaGUgZHJvcHpvbmUgaW50ZXJhY3RhYmxlXG4gICAgICAgICAtIGRyb3BFbGVtZW50IChFbGVtZW50KSBUaGUgZHJvcHpvbmUgZWxlbWVudFxuICAgICAgICAgLSBkcmFnZ2FibGUgKEludGVyYWN0YWJsZSkgVGhlIEludGVyYWN0YWJsZSBiZWluZyBkcmFnZ2VkXG4gICAgICAgICAtIGRyYWdnYWJsZUVsZW1lbnQgKEVsZW1lbnQpIFRoZSBhY3R1YWwgZWxlbWVudCB0aGF0J3MgYmVpbmcgZHJhZ2dlZFxuICAgICAgICAgKlxuICAgICAgICAgPiBVc2FnZTpcbiAgICAgICAgIHwgaW50ZXJhY3QodGFyZ2V0KVxuICAgICAgICAgfCAuZHJvcENoZWNrZXIoZnVuY3Rpb24ocG9pbnRlciwgICAgICAgICAgIC8vIFRvdWNoL1BvaW50ZXJFdmVudC9Nb3VzZUV2ZW50XG4gICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBldmVudCwgICAgICAgICAgICAgLy8gVG91Y2hFdmVudC9Qb2ludGVyRXZlbnQvTW91c2VFdmVudFxuICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJvcHBlZCwgICAgICAgICAgIC8vIHJlc3VsdCBvZiB0aGUgZGVmYXVsdCBjaGVja2VyXG4gICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSwgICAgICAgICAgLy8gZHJvcHpvbmUgSW50ZXJhY3RhYmxlXG4gICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcm9wRWxlbWVudCwgICAgICAgLy8gZHJvcHpvbmUgZWxlbW50XG4gICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUsICAgICAgICAgLy8gZHJhZ2dhYmxlIEludGVyYWN0YWJsZVxuICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlRWxlbWVudCkgey8vIGRyYWdnYWJsZSBlbGVtZW50XG4gICAgICAgICB8XG4gICAgICAgICB8ICAgcmV0dXJuIGRyb3BwZWQgJiYgZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnYWxsb3ctZHJvcCcpO1xuICAgICAgICAgfCB9XG4gICAgICAgIFxcKi9cbiAgICAgICAgZHJvcENoZWNrZXI6IGZ1bmN0aW9uIChjaGVja2VyKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihjaGVja2VyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kcm9wQ2hlY2tlciA9IGNoZWNrZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5nZXRSZWN0O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZHJvcENoZWNrZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUuYWNjZXB0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcHJlY2F0ZWQuIGFkZCBhbiBgYWNjZXB0YCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3QgcGFzc2VkIHRvXG4gICAgICAgICAqIEBJbnRlcmFjdGFibGUuZHJvcHpvbmUgaW5zdGVhZC5cbiAgICAgICAgICpcbiAgICAgICAgICogR2V0cyBvciBzZXRzIHRoZSBFbGVtZW50IG9yIENTUyBzZWxlY3RvciBtYXRjaCB0aGF0IHRoaXNcbiAgICAgICAgICogSW50ZXJhY3RhYmxlIGFjY2VwdHMgaWYgaXQgaXMgYSBkcm9wem9uZS5cbiAgICAgICAgICpcbiAgICAgICAgIC0gbmV3VmFsdWUgKEVsZW1lbnQgfCBzdHJpbmcgfCBudWxsKSAjb3B0aW9uYWxcbiAgICAgICAgICogSWYgaXQgaXMgYW4gRWxlbWVudCwgdGhlbiBvbmx5IHRoYXQgZWxlbWVudCBjYW4gYmUgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmUuXG4gICAgICAgICAqIElmIGl0IGlzIGEgc3RyaW5nLCB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkIG11c3QgbWF0Y2ggaXQgYXMgYSBzZWxlY3Rvci5cbiAgICAgICAgICogSWYgaXQgaXMgbnVsbCwgdGhlIGFjY2VwdCBvcHRpb25zIGlzIGNsZWFyZWQgLSBpdCBhY2NlcHRzIGFueSBlbGVtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgPSAoc3RyaW5nIHwgRWxlbWVudCB8IG51bGwgfCBJbnRlcmFjdGFibGUpIFRoZSBjdXJyZW50IGFjY2VwdCBvcHRpb24gaWYgZ2l2ZW4gYHVuZGVmaW5lZGAgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgXFwqL1xuICAgICAgICBhY2NlcHQ6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcC5hY2NlcHQgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0ZXN0IGlmIGl0IGlzIGEgdmFsaWQgQ1NTIHNlbGVjdG9yXG4gICAgICAgICAgICBpZiAoc2NvcGUudHJ5U2VsZWN0b3IobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0ID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5kcm9wLmFjY2VwdDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRyb3AuYWNjZXB0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLnJlc2l6YWJsZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKlxuICAgICAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciByZXNpemUgYWN0aW9ucyBjYW4gYmUgcGVyZm9ybWVkIG9uIHRoZVxuICAgICAgICAgKiBJbnRlcmFjdGFibGVcbiAgICAgICAgICpcbiAgICAgICAgID0gKGJvb2xlYW4pIEluZGljYXRlcyBpZiB0aGlzIGNhbiBiZSB0aGUgdGFyZ2V0IG9mIHJlc2l6ZSBlbGVtZW50c1xuICAgICAgICAgfCB2YXIgaXNSZXNpemVhYmxlID0gaW50ZXJhY3QoJ2lucHV0W3R5cGU9dGV4dF0nKS5yZXNpemFibGUoKTtcbiAgICAgICAgICogb3JcbiAgICAgICAgIC0gb3B0aW9ucyAoYm9vbGVhbiB8IG9iamVjdCkgI29wdGlvbmFsIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnQgbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIHJlc2l6ZSBldmVudHMgKG9iamVjdCBtYWtlcyB0aGUgSW50ZXJhY3RhYmxlIHJlc2l6YWJsZSlcbiAgICAgICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgIHwgaW50ZXJhY3QoZWxlbWVudCkucmVzaXphYmxlKHtcbiAgICAgICAgIHwgICAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgICAgICB8ICAgICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICAgICAgfCAgICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgICAgIHxcbiAgICAgICAgIHwgICAgIGVkZ2VzOiB7XG4gICAgICAgICB8ICAgICAgIHRvcCAgIDogdHJ1ZSwgICAgICAgLy8gVXNlIHBvaW50ZXIgY29vcmRzIHRvIGNoZWNrIGZvciByZXNpemUuXG4gICAgICAgICB8ICAgICAgIGxlZnQgIDogZmFsc2UsICAgICAgLy8gRGlzYWJsZSByZXNpemluZyBmcm9tIGxlZnQgZWRnZS5cbiAgICAgICAgIHwgICAgICAgYm90dG9tOiAnLnJlc2l6ZS1zJywvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgbWF0Y2hlcyBzZWxlY3RvclxuICAgICAgICAgfCAgICAgICByaWdodCA6IGhhbmRsZUVsICAgIC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBpcyB0aGUgZ2l2ZW4gRWxlbWVudFxuICAgICAgICAgfCAgICAgfSxcbiAgICAgICAgIHxcbiAgICAgICAgIHwgICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAgICAgIHwgICAgIC8vICduZWdhdGUnIHdpbGwgYWxsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAgICAgIHwgICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgICAgICAgfCAgICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIGFuZC9vciBzd2FwcGluZyB0aGUgbGVmdCBhbmQgcmlnaHQgZWRnZXNcbiAgICAgICAgIHwgICAgIGludmVydDogJ25vbmUnIHx8ICduZWdhdGUnIHx8ICdyZXBvc2l0aW9uJ1xuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gbGltaXQgbXVsdGlwbGUgcmVzaXplcy5cbiAgICAgICAgIHwgICAgIC8vIFNlZSB0aGUgZXhwbGFuYXRpb24gaW4gdGhlIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIGV4YW1wbGVcbiAgICAgICAgIHwgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAxLFxuICAgICAgICAgfCB9KTtcbiAgICAgICAgXFwqL1xuICAgICAgICByZXNpemFibGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbigncmVzaXplJywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygncmVzaXplJywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoL154JHxeeSR8Xnh5JC8udGVzdChvcHRpb25zLmF4aXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuYXhpcyA9IG9wdGlvbnMuYXhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5heGlzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuYXhpcyA9IHNjb3BlLmRlZmF1bHRPcHRpb25zLnJlc2l6ZS5heGlzO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucy5zcXVhcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZXNpemUuc3F1YXJlID0gb3B0aW9ucy5zcXVhcmU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9ucztcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXNpemU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUuc3F1YXJlUmVzaXplXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhIGBzcXVhcmU6IHRydWUgfHwgZmFsc2VgIHByb3BlcnR5IHRvIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWRcbiAgICAgICAgICpcbiAgICAgICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXppbmcgaXMgZm9yY2VkIDE6MSBhc3BlY3RcbiAgICAgICAgICpcbiAgICAgICAgID0gKGJvb2xlYW4pIEN1cnJlbnQgc2V0dGluZ1xuICAgICAgICAgKlxuICAgICAgICAgKiBvclxuICAgICAgICAgKlxuICAgICAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsXG4gICAgICAgICA9IChvYmplY3QpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgIFxcKi9cbiAgICAgICAgc3F1YXJlUmVzaXplOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZS5zcXVhcmUgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLnJlc2l6ZS5zcXVhcmU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXNpemUuc3F1YXJlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLmdlc3R1cmFibGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgbXVsdGl0b3VjaCBnZXN0dXJlcyBjYW4gYmUgcGVyZm9ybWVkIG9uIHRoZVxuICAgICAgICAgKiBJbnRlcmFjdGFibGUncyBlbGVtZW50XG4gICAgICAgICAqXG4gICAgICAgICA9IChib29sZWFuKSBJbmRpY2F0ZXMgaWYgdGhpcyBjYW4gYmUgdGhlIHRhcmdldCBvZiBnZXN0dXJlIGV2ZW50c1xuICAgICAgICAgfCB2YXIgaXNHZXN0dXJlYWJsZSA9IGludGVyYWN0KGVsZW1lbnQpLmdlc3R1cmFibGUoKTtcbiAgICAgICAgICogb3JcbiAgICAgICAgIC0gb3B0aW9ucyAoYm9vbGVhbiB8IG9iamVjdCkgI29wdGlvbmFsIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnQgbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIGdlc3R1cmUgZXZlbnRzIChtYWtlcyB0aGUgSW50ZXJhY3RhYmxlIGdlc3R1cmFibGUpXG4gICAgICAgICA9IChvYmplY3QpIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgICB8IGludGVyYWN0KGVsZW1lbnQpLmdlc3R1cmFibGUoe1xuICAgICAgICAgfCAgICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICAgICAgIHwgICAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAgICAgICB8ICAgICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gbGltaXQgbXVsdGlwbGUgZ2VzdHVyZXMuXG4gICAgICAgICB8ICAgICAvLyBTZWUgdGhlIGV4cGxhbmF0aW9uIGluIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIGV4YW1wbGVcbiAgICAgICAgIHwgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgICB8ICAgICBtYXhQZXJFbGVtZW50OiAxLFxuICAgICAgICAgfCB9KTtcbiAgICAgICAgXFwqL1xuICAgICAgICBnZXN0dXJhYmxlOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdlc3R1cmUuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2U/IGZhbHNlOiB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0UGVyQWN0aW9uKCdnZXN0dXJlJywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRPbkV2ZW50cygnZ2VzdHVyZScsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Jvb2wob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ2VzdHVyZS5lbmFibGVkID0gb3B0aW9ucztcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmdlc3R1cmU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUuYXV0b1Njcm9sbFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogRGVwcmVjYXRlZC4gQWRkIGFuIGBhdXRvc2Nyb2xsYCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3RcbiAgICAgICAgICogcGFzc2VkIHRvIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIG9yIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGRyYWdnaW5nIGFuZCByZXNpemluZyBuZWFyIHRoZSBlZGdlcyBvZiB0aGVcbiAgICAgICAgICogd2luZG93L2NvbnRhaW5lciB0cmlnZ2VyIGF1dG9TY3JvbGwgZm9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgICAqXG4gICAgICAgICA9IChvYmplY3QpIE9iamVjdCB3aXRoIGF1dG9TY3JvbGwgcHJvcGVydGllc1xuICAgICAgICAgKlxuICAgICAgICAgKiBvclxuICAgICAgICAgKlxuICAgICAgICAgLSBvcHRpb25zIChvYmplY3QgfCBib29sZWFuKSAjb3B0aW9uYWxcbiAgICAgICAgICogb3B0aW9ucyBjYW4gYmU6XG4gICAgICAgICAqIC0gYW4gb2JqZWN0IHdpdGggbWFyZ2luLCBkaXN0YW5jZSBhbmQgaW50ZXJ2YWwgcHJvcGVydGllcyxcbiAgICAgICAgICogLSB0cnVlIG9yIGZhbHNlIHRvIGVuYWJsZSBvciBkaXNhYmxlIGF1dG9TY3JvbGwgb3JcbiAgICAgICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgXFwqL1xuICAgICAgICBhdXRvU2Nyb2xsOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHV0aWxzLmV4dGVuZCh7IGFjdGlvbnM6IFsnZHJhZycsICdyZXNpemUnXX0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2NvcGUuaXNCb29sKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHsgYWN0aW9uczogWydkcmFnJywgJ3Jlc2l6ZSddLCBlbmFibGVkOiBvcHRpb25zIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldE9wdGlvbnMoJ2F1dG9TY3JvbGwnLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5zbmFwXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBEZXByZWNhdGVkLiBBZGQgYSBgc25hcGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZFxuICAgICAgICAgKiB0byBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSBvciBASW50ZXJhY3RhYmxlLnJlc2l6YWJsZSBpbnN0ZWFkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXR1cm5zIG9yIHNldHMgaWYgYW5kIGhvdyBhY3Rpb24gY29vcmRpbmF0ZXMgYXJlIHNuYXBwZWQuIEJ5XG4gICAgICAgICAqIGRlZmF1bHQsIHNuYXBwaW5nIGlzIHJlbGF0aXZlIHRvIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzLiBZb3UgY2FuXG4gICAgICAgICAqIGNoYW5nZSB0aGlzIGJ5IHNldHRpbmcgdGhlXG4gICAgICAgICAqIFtgZWxlbWVudE9yaWdpbmBdKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL3B1bGwvNzIpLlxuICAgICAgICAgKipcbiAgICAgICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIGBmYWxzZWAgaWYgc25hcCBpcyBkaXNhYmxlZDsgb2JqZWN0IHdpdGggc25hcCBwcm9wZXJ0aWVzIGlmIHNuYXAgaXMgZW5hYmxlZFxuICAgICAgICAgKipcbiAgICAgICAgICogb3JcbiAgICAgICAgICoqXG4gICAgICAgICAtIG9wdGlvbnMgKG9iamVjdCB8IGJvb2xlYW4gfCBudWxsKSAjb3B0aW9uYWxcbiAgICAgICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgID4gVXNhZ2VcbiAgICAgICAgIHwgaW50ZXJhY3QoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3RoaW5nJykpLnNuYXAoe1xuICAgICAgICAgfCAgICAgdGFyZ2V0czogW1xuICAgICAgICAgfCAgICAgICAgIC8vIHNuYXAgdG8gdGhpcyBzcGVjaWZpYyBwb2ludFxuICAgICAgICAgfCAgICAgICAgIHtcbiAgICAgICAgIHwgICAgICAgICAgICAgeDogMTAwLFxuICAgICAgICAgfCAgICAgICAgICAgICB5OiAxMDAsXG4gICAgICAgICB8ICAgICAgICAgICAgIHJhbmdlOiAyNVxuICAgICAgICAgfCAgICAgICAgIH0sXG4gICAgICAgICB8ICAgICAgICAgLy8gZ2l2ZSB0aGlzIGZ1bmN0aW9uIHRoZSB4IGFuZCB5IHBhZ2UgY29vcmRzIGFuZCBzbmFwIHRvIHRoZSBvYmplY3QgcmV0dXJuZWRcbiAgICAgICAgIHwgICAgICAgICBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgfCAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgfCAgICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgIHwgICAgICAgICAgICAgICAgIHk6ICg3NSArIDUwICogTWF0aC5zaW4oeCAqIDAuMDQpKSxcbiAgICAgICAgIHwgICAgICAgICAgICAgICAgIHJhbmdlOiA0MFxuICAgICAgICAgfCAgICAgICAgICAgICB9O1xuICAgICAgICAgfCAgICAgICAgIH0sXG4gICAgICAgICB8ICAgICAgICAgLy8gY3JlYXRlIGEgZnVuY3Rpb24gdGhhdCBzbmFwcyB0byBhIGdyaWRcbiAgICAgICAgIHwgICAgICAgICBpbnRlcmFjdC5jcmVhdGVTbmFwR3JpZCh7XG4gICAgICAgICB8ICAgICAgICAgICAgIHg6IDUwLFxuICAgICAgICAgfCAgICAgICAgICAgICB5OiA1MCxcbiAgICAgICAgIHwgICAgICAgICAgICAgcmFuZ2U6IDEwLCAgICAgICAgICAgICAgLy8gb3B0aW9uYWxcbiAgICAgICAgIHwgICAgICAgICAgICAgb2Zmc2V0OiB7IHg6IDUsIHk6IDEwIH0gLy8gb3B0aW9uYWxcbiAgICAgICAgIHwgICAgICAgICB9KVxuICAgICAgICAgfCAgICAgXSxcbiAgICAgICAgIHwgICAgIC8vIGRvIG5vdCBzbmFwIGR1cmluZyBub3JtYWwgbW92ZW1lbnQuXG4gICAgICAgICB8ICAgICAvLyBJbnN0ZWFkLCB0cmlnZ2VyIG9ubHkgb25lIHNuYXBwZWQgbW92ZSBldmVudFxuICAgICAgICAgfCAgICAgLy8gaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBlbmQgZXZlbnQuXG4gICAgICAgICB8ICAgICBlbmRPbmx5OiB0cnVlLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgcmVsYXRpdmVQb2ludHM6IFtcbiAgICAgICAgIHwgICAgICAgICB7IHg6IDAsIHk6IDAgfSwgIC8vIHNuYXAgcmVsYXRpdmUgdG8gdGhlIHRvcCBsZWZ0IG9mIHRoZSBlbGVtZW50XG4gICAgICAgICB8ICAgICAgICAgeyB4OiAxLCB5OiAxIH0sICAvLyBhbmQgYWxzbyB0byB0aGUgYm90dG9tIHJpZ2h0XG4gICAgICAgICB8ICAgICBdLCAgXG4gICAgICAgICB8XG4gICAgICAgICB8ICAgICAvLyBvZmZzZXQgdGhlIHNuYXAgdGFyZ2V0IGNvb3JkaW5hdGVzXG4gICAgICAgICB8ICAgICAvLyBjYW4gYmUgYW4gb2JqZWN0IHdpdGggeC95IG9yICdzdGFydENvb3JkcydcbiAgICAgICAgIHwgICAgIG9mZnNldDogeyB4OiA1MCwgeTogNTAgfVxuICAgICAgICAgfCAgIH1cbiAgICAgICAgIHwgfSk7XG4gICAgICAgIFxcKi9cbiAgICAgICAgc25hcDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciByZXQgPSB0aGlzLnNldE9wdGlvbnMoJ3NuYXAnLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKHJldCA9PT0gdGhpcykgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0LmRyYWc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0T3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbiwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSBvcHRpb25zICYmIHNjb3BlLmlzQXJyYXkob3B0aW9ucy5hY3Rpb25zKVxuICAgICAgICAgICAgICAgICAgICA/IG9wdGlvbnMuYWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICA6IFsnZHJhZyddO1xuXG4gICAgICAgICAgICB2YXIgaTtcblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpIHx8IHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSAvcmVzaXplLy50ZXN0KGFjdGlvbnNbaV0pPyAncmVzaXplJyA6IGFjdGlvbnNbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY29wZS5pc09iamVjdCh0aGlzLm9wdGlvbnNbYWN0aW9uXSkpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc09wdGlvbiA9IHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbl07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5leHRlbmQodGhpc09wdGlvbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlPyBmYWxzZTogdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbiA9PT0gJ3NuYXAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNPcHRpb24ubW9kZSA9PT0gJ2dyaWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNPcHRpb24udGFyZ2V0cyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0LmNyZWF0ZVNuYXBHcmlkKHV0aWxzLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiB0aGlzT3B0aW9uLmdyaWRPZmZzZXQgfHwgeyB4OiAwLCB5OiAwIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHRoaXNPcHRpb24uZ3JpZCB8fCB7fSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXNPcHRpb24ubW9kZSA9PT0gJ2FuY2hvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi50YXJnZXRzID0gdGhpc09wdGlvbi5hbmNob3JzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzT3B0aW9uLm1vZGUgPT09ICdwYXRoJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnRhcmdldHMgPSB0aGlzT3B0aW9uLnBhdGhzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnZWxlbWVudE9yaWdpbicgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3B0aW9uLnJlbGF0aXZlUG9pbnRzID0gW29wdGlvbnMuZWxlbWVudE9yaWdpbl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjb3BlLmlzQm9vbChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc09wdGlvbi5lbmFibGVkID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0ID0ge30sXG4gICAgICAgICAgICAgICAgYWxsQWN0aW9ucyA9IFsnZHJhZycsICdyZXNpemUnLCAnZ2VzdHVyZSddO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWxsQWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb24gaW4gc2NvcGUuZGVmYXVsdE9wdGlvbnNbYWxsQWN0aW9uc1tpXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0W2FsbEFjdGlvbnNbaV1dID0gdGhpcy5vcHRpb25zW2FsbEFjdGlvbnNbaV1dW29wdGlvbl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUuaW5lcnRpYVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogRGVwcmVjYXRlZC4gQWRkIGFuIGBpbmVydGlhYCBwcm9wZXJ0eSB0byB0aGUgb3B0aW9ucyBvYmplY3QgcGFzc2VkXG4gICAgICAgICAqIHRvIEBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlIG9yIEBJbnRlcmFjdGFibGUucmVzaXphYmxlIGluc3RlYWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgb3Igc2V0cyBpZiBhbmQgaG93IGV2ZW50cyBjb250aW51ZSB0byBydW4gYWZ0ZXIgdGhlIHBvaW50ZXIgaXMgcmVsZWFzZWRcbiAgICAgICAgICoqXG4gICAgICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBgZmFsc2VgIGlmIGluZXJ0aWEgaXMgZGlzYWJsZWQ7IGBvYmplY3RgIHdpdGggaW5lcnRpYSBwcm9wZXJ0aWVzIGlmIGluZXJ0aWEgaXMgZW5hYmxlZFxuICAgICAgICAgKipcbiAgICAgICAgICogb3JcbiAgICAgICAgICoqXG4gICAgICAgICAtIG9wdGlvbnMgKG9iamVjdCB8IGJvb2xlYW4gfCBudWxsKSAjb3B0aW9uYWxcbiAgICAgICAgID0gKEludGVyYWN0YWJsZSkgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgID4gVXNhZ2VcbiAgICAgICAgIHwgLy8gZW5hYmxlIGFuZCB1c2UgZGVmYXVsdCBzZXR0aW5nc1xuICAgICAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pbmVydGlhKHRydWUpO1xuICAgICAgICAgfFxuICAgICAgICAgfCAvLyBlbmFibGUgYW5kIHVzZSBjdXN0b20gc2V0dGluZ3NcbiAgICAgICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaW5lcnRpYSh7XG4gICAgICAgICB8ICAgICAvLyB2YWx1ZSBncmVhdGVyIHRoYW4gMFxuICAgICAgICAgfCAgICAgLy8gaGlnaCB2YWx1ZXMgc2xvdyB0aGUgb2JqZWN0IGRvd24gbW9yZSBxdWlja2x5XG4gICAgICAgICB8ICAgICByZXNpc3RhbmNlICAgICA6IDE2LFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gdGhlIG1pbmltdW0gbGF1bmNoIHNwZWVkIChwaXhlbHMgcGVyIHNlY29uZCkgdGhhdCByZXN1bHRzIGluIGluZXJ0aWEgc3RhcnRcbiAgICAgICAgIHwgICAgIG1pblNwZWVkICAgICAgIDogMjAwLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gaW5lcnRpYSB3aWxsIHN0b3Agd2hlbiB0aGUgb2JqZWN0IHNsb3dzIGRvd24gdG8gdGhpcyBzcGVlZFxuICAgICAgICAgfCAgICAgZW5kU3BlZWQgICAgICAgOiAyMCxcbiAgICAgICAgIHxcbiAgICAgICAgIHwgICAgIC8vIGJvb2xlYW47IHNob3VsZCBhY3Rpb25zIGJlIHJlc3VtZWQgd2hlbiB0aGUgcG9pbnRlciBnb2VzIGRvd24gZHVyaW5nIGluZXJ0aWFcbiAgICAgICAgIHwgICAgIGFsbG93UmVzdW1lICAgIDogdHJ1ZSxcbiAgICAgICAgIHxcbiAgICAgICAgIHwgICAgIC8vIGJvb2xlYW47IHNob3VsZCB0aGUganVtcCB3aGVuIHJlc3VtaW5nIGZyb20gaW5lcnRpYSBiZSBpZ25vcmVkIGluIGV2ZW50LmR4L2R5XG4gICAgICAgICB8ICAgICB6ZXJvUmVzdW1lRGVsdGE6IGZhbHNlLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gaWYgc25hcC9yZXN0cmljdCBhcmUgc2V0IHRvIGJlIGVuZE9ubHkgYW5kIGluZXJ0aWEgaXMgZW5hYmxlZCwgcmVsZWFzaW5nXG4gICAgICAgICB8ICAgICAvLyB0aGUgcG9pbnRlciB3aXRob3V0IHRyaWdnZXJpbmcgaW5lcnRpYSB3aWxsIGFuaW1hdGUgZnJvbSB0aGUgcmVsZWFzZVxuICAgICAgICAgfCAgICAgLy8gcG9pbnQgdG8gdGhlIHNuYXBlZC9yZXN0cmljdGVkIHBvaW50IGluIHRoZSBnaXZlbiBhbW91bnQgb2YgdGltZSAobXMpXG4gICAgICAgICB8ICAgICBzbW9vdGhFbmREdXJhdGlvbjogMzAwLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gYW4gYXJyYXkgb2YgYWN0aW9uIHR5cGVzIHRoYXQgY2FuIGhhdmUgaW5lcnRpYSAobm8gZ2VzdHVyZSlcbiAgICAgICAgIHwgICAgIGFjdGlvbnMgICAgICAgIDogWydkcmFnJywgJ3Jlc2l6ZSddXG4gICAgICAgICB8IH0pO1xuICAgICAgICAgfFxuICAgICAgICAgfCAvLyByZXNldCBjdXN0b20gc2V0dGluZ3MgYW5kIHVzZSBhbGwgZGVmYXVsdHNcbiAgICAgICAgIHwgaW50ZXJhY3QoZWxlbWVudCkuaW5lcnRpYShudWxsKTtcbiAgICAgICAgXFwqL1xuICAgICAgICBpbmVydGlhOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJldCA9IHRoaXMuc2V0T3B0aW9ucygnaW5lcnRpYScsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICBpZiAocmV0ID09PSB0aGlzKSB7IHJldHVybiB0aGlzOyB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXQuZHJhZztcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRBY3Rpb246IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLmRlZmF1bHRBY3Rpb25DaGVja2VyKHBvaW50ZXIsIGludGVyYWN0aW9uLCBlbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBhY3Rpb24sIHRoaXMsIGVsZW1lbnQsIGludGVyYWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbjtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWZhdWx0QWN0aW9uQ2hlY2tlcjogZGVmYXVsdEFjdGlvbkNoZWNrZXIsXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUuYWN0aW9uQ2hlY2tlclxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKlxuICAgICAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvblxuICAgICAgICAgKiBwb2ludGVyRG93blxuICAgICAgICAgKlxuICAgICAgICAgLSBjaGVja2VyIChmdW5jdGlvbiB8IG51bGwpICNvcHRpb25hbCBBIGZ1bmN0aW9uIHdoaWNoIHRha2VzIGEgcG9pbnRlciBldmVudCwgZGVmYXVsdEFjdGlvbiBzdHJpbmcsIGludGVyYWN0YWJsZSwgZWxlbWVudCBhbmQgaW50ZXJhY3Rpb24gYXMgcGFyYW1ldGVycyBhbmQgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBuYW1lIHByb3BlcnR5ICdkcmFnJyAncmVzaXplJyBvciAnZ2VzdHVyZScgYW5kIG9wdGlvbmFsbHkgYW4gYGVkZ2VzYCBvYmplY3Qgd2l0aCBib29sZWFuICd0b3AnLCAnbGVmdCcsICdib3R0b20nIGFuZCByaWdodCBwcm9wcy5cbiAgICAgICAgID0gKEZ1bmN0aW9uIHwgSW50ZXJhY3RhYmxlKSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICAgKlxuICAgICAgICAgfCBpbnRlcmFjdCgnLnJlc2l6ZS1kcmFnJylcbiAgICAgICAgIHwgICAucmVzaXphYmxlKHRydWUpXG4gICAgICAgICB8ICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgICAgICAgfCAgIC5hY3Rpb25DaGVja2VyKGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uKSB7XG4gICAgICAgICB8XG4gICAgICAgICB8ICAgaWYgKGludGVyYWN0Lm1hdGNoZXNTZWxlY3RvcihldmVudC50YXJnZXQsICcuZHJhZy1oYW5kbGUnKSB7XG4gICAgICAgICB8ICAgICAvLyBmb3JjZSBkcmFnIHdpdGggaGFuZGxlIHRhcmdldFxuICAgICAgICAgfCAgICAgYWN0aW9uLm5hbWUgPSBkcmFnO1xuICAgICAgICAgfCAgIH1cbiAgICAgICAgIHwgICBlbHNlIHtcbiAgICAgICAgIHwgICAgIC8vIHJlc2l6ZSBmcm9tIHRoZSB0b3AgYW5kIHJpZ2h0IGVkZ2VzXG4gICAgICAgICB8ICAgICBhY3Rpb24ubmFtZSAgPSAncmVzaXplJztcbiAgICAgICAgIHwgICAgIGFjdGlvbi5lZGdlcyA9IHsgdG9wOiB0cnVlLCByaWdodDogdHJ1ZSB9O1xuICAgICAgICAgfCAgIH1cbiAgICAgICAgIHxcbiAgICAgICAgIHwgICByZXR1cm4gYWN0aW9uO1xuICAgICAgICAgfCB9KTtcbiAgICAgICAgXFwqL1xuICAgICAgICBhY3Rpb25DaGVja2VyOiBmdW5jdGlvbiAoY2hlY2tlcikge1xuICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oY2hlY2tlcikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlciA9IGNoZWNrZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLmdldFJlY3RcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGRlZmF1bHQgZnVuY3Rpb24gdG8gZ2V0IGFuIEludGVyYWN0YWJsZXMgYm91bmRpbmcgcmVjdC4gQ2FuIGJlXG4gICAgICAgICAqIG92ZXJyaWRkZW4gdXNpbmcgQEludGVyYWN0YWJsZS5yZWN0Q2hlY2tlci5cbiAgICAgICAgICpcbiAgICAgICAgIC0gZWxlbWVudCAoRWxlbWVudCkgI29wdGlvbmFsIFRoZSBlbGVtZW50IHRvIG1lYXN1cmUuXG4gICAgICAgICA9IChvYmplY3QpIFRoZSBvYmplY3QncyBib3VuZGluZyByZWN0YW5nbGUuXG4gICAgICAgICBvIHtcbiAgICAgICAgIG8gICAgIHRvcCAgIDogMCxcbiAgICAgICAgIG8gICAgIGxlZnQgIDogMCxcbiAgICAgICAgIG8gICAgIGJvdHRvbTogMCxcbiAgICAgICAgIG8gICAgIHJpZ2h0IDogMCxcbiAgICAgICAgIG8gICAgIHdpZHRoIDogMCxcbiAgICAgICAgIG8gICAgIGhlaWdodDogMFxuICAgICAgICAgbyB9XG4gICAgICAgIFxcKi9cbiAgICAgICAgZ2V0UmVjdDogZnVuY3Rpb24gcmVjdENoZWNrIChlbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCB0aGlzLl9lbGVtZW50O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RvciAmJiAhKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5fY29udGV4dC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2NvcGUuZ2V0RWxlbWVudFJlY3QoZWxlbWVudCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUucmVjdENoZWNrZXJcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogUmV0dXJucyBvciBzZXRzIHRoZSBmdW5jdGlvbiB1c2VkIHRvIGNhbGN1bGF0ZSB0aGUgaW50ZXJhY3RhYmxlJ3NcbiAgICAgICAgICogZWxlbWVudCdzIHJlY3RhbmdsZVxuICAgICAgICAgKlxuICAgICAgICAgLSBjaGVja2VyIChmdW5jdGlvbikgI29wdGlvbmFsIEEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGlzIEludGVyYWN0YWJsZSdzIGJvdW5kaW5nIHJlY3RhbmdsZS4gU2VlIEBJbnRlcmFjdGFibGUuZ2V0UmVjdFxuICAgICAgICAgPSAoZnVuY3Rpb24gfCBvYmplY3QpIFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgIFxcKi9cbiAgICAgICAgcmVjdENoZWNrZXI6IGZ1bmN0aW9uIChjaGVja2VyKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihjaGVja2VyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UmVjdCA9IGNoZWNrZXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmdldFJlY3Q7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVjdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5zdHlsZUN1cnNvclxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0aGUgYWN0aW9uIHRoYXQgd291bGQgYmUgcGVyZm9ybWVkIHdoZW4gdGhlXG4gICAgICAgICAqIG1vdXNlIG9uIHRoZSBlbGVtZW50IGFyZSBjaGVja2VkIG9uIGBtb3VzZW1vdmVgIHNvIHRoYXQgdGhlIGN1cnNvclxuICAgICAgICAgKiBtYXkgYmUgc3R5bGVkIGFwcHJvcHJpYXRlbHlcbiAgICAgICAgICpcbiAgICAgICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbFxuICAgICAgICAgPSAoYm9vbGVhbiB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICBcXCovXG4gICAgICAgIHN0eWxlQ3Vyc29yOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLnByZXZlbnREZWZhdWx0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRvIHByZXZlbnQgdGhlIGJyb3dzZXIncyBkZWZhdWx0IGJlaGF2aW91clxuICAgICAgICAgKiBpbiByZXNwb25zZSB0byBwb2ludGVyIGV2ZW50cy4gQ2FuIGJlIHNldCB0bzpcbiAgICAgICAgICogIC0gYCdhbHdheXMnYCB0byBhbHdheXMgcHJldmVudFxuICAgICAgICAgKiAgLSBgJ25ldmVyJ2AgdG8gbmV2ZXIgcHJldmVudFxuICAgICAgICAgKiAgLSBgJ2F1dG8nYCB0byBsZXQgaW50ZXJhY3QuanMgdHJ5IHRvIGRldGVybWluZSB3aGF0IHdvdWxkIGJlIGJlc3RcbiAgICAgICAgICpcbiAgICAgICAgIC0gbmV3VmFsdWUgKHN0cmluZykgI29wdGlvbmFsIGB0cnVlYCwgYGZhbHNlYCBvciBgJ2F1dG8nYFxuICAgICAgICAgPSAoc3RyaW5nIHwgSW50ZXJhY3RhYmxlKSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgIFxcKi9cbiAgICAgICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgaWYgKC9eKGFsd2F5c3xuZXZlcnxhdXRvKSQvLnRlc3QobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnByZXZlbnREZWZhdWx0ID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Jvb2wobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnByZXZlbnREZWZhdWx0ID0gbmV3VmFsdWU/ICdhbHdheXMnIDogJ25ldmVyJztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5vcmlnaW5cbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogR2V0cyBvciBzZXRzIHRoZSBvcmlnaW4gb2YgdGhlIEludGVyYWN0YWJsZSdzIGVsZW1lbnQuICBUaGUgeCBhbmQgeVxuICAgICAgICAgKiBvZiB0aGUgb3JpZ2luIHdpbGwgYmUgc3VidHJhY3RlZCBmcm9tIGFjdGlvbiBldmVudCBjb29yZGluYXRlcy5cbiAgICAgICAgICpcbiAgICAgICAgIC0gb3JpZ2luIChvYmplY3QgfCBzdHJpbmcpICNvcHRpb25hbCBBbiBvYmplY3QgZWcuIHsgeDogMCwgeTogMCB9IG9yIHN0cmluZyAncGFyZW50JywgJ3NlbGYnIG9yIGFueSBDU1Mgc2VsZWN0b3JcbiAgICAgICAgICogT1JcbiAgICAgICAgIC0gb3JpZ2luIChFbGVtZW50KSAjb3B0aW9uYWwgQW4gSFRNTCBvciBTVkcgRWxlbWVudCB3aG9zZSByZWN0IHdpbGwgYmUgdXNlZFxuICAgICAgICAgKipcbiAgICAgICAgID0gKG9iamVjdCkgVGhlIGN1cnJlbnQgb3JpZ2luIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgIFxcKi9cbiAgICAgICAgb3JpZ2luOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMub3JpZ2luID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzY29wZS5pc09iamVjdChuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMub3JpZ2luID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMub3JpZ2luO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLmRlbHRhU291cmNlXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgbW91c2UgY29vcmRpbmF0ZSB0eXBlcyB1c2VkIHRvIGNhbGN1bGF0ZSB0aGVcbiAgICAgICAgICogbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAtIG5ld1ZhbHVlIChzdHJpbmcpICNvcHRpb25hbCBVc2UgJ2NsaWVudCcgaWYgeW91IHdpbGwgYmUgc2Nyb2xsaW5nIHdoaWxlIGludGVyYWN0aW5nOyBVc2UgJ3BhZ2UnIGlmIHlvdSB3YW50IGF1dG9TY3JvbGwgdG8gd29ya1xuICAgICAgICAgPSAoc3RyaW5nIHwgb2JqZWN0KSBUaGUgY3VycmVudCBkZWx0YVNvdXJjZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICBcXCovXG4gICAgICAgIGRlbHRhU291cmNlOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gJ3BhZ2UnIHx8IG5ld1ZhbHVlID09PSAnY2xpZW50Jykge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUucmVzdHJpY3RcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIERlcHJlY2F0ZWQuIEFkZCBhIGByZXN0cmljdGAgcHJvcGVydHkgdG8gdGhlIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB0b1xuICAgICAgICAgKiBASW50ZXJhY3RhYmxlLmRyYWdnYWJsZSwgQEludGVyYWN0YWJsZS5yZXNpemFibGUgb3IgQEludGVyYWN0YWJsZS5nZXN0dXJhYmxlIGluc3RlYWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgb3Igc2V0cyB0aGUgcmVjdGFuZ2xlcyB3aXRoaW4gd2hpY2ggYWN0aW9ucyBvbiB0aGlzXG4gICAgICAgICAqIGludGVyYWN0YWJsZSAoYWZ0ZXIgc25hcCBjYWxjdWxhdGlvbnMpIGFyZSByZXN0cmljdGVkLiBCeSBkZWZhdWx0LFxuICAgICAgICAgKiByZXN0cmljdGluZyBpcyByZWxhdGl2ZSB0byB0aGUgcG9pbnRlciBjb29yZGluYXRlcy4gWW91IGNhbiBjaGFuZ2VcbiAgICAgICAgICogdGhpcyBieSBzZXR0aW5nIHRoZVxuICAgICAgICAgKiBbYGVsZW1lbnRSZWN0YF0oaHR0cHM6Ly9naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvcHVsbC83MikuXG4gICAgICAgICAqKlxuICAgICAgICAgLSBvcHRpb25zIChvYmplY3QpICNvcHRpb25hbCBhbiBvYmplY3Qgd2l0aCBrZXlzIGRyYWcsIHJlc2l6ZSwgYW5kL29yIGdlc3R1cmUgd2hvc2UgdmFsdWVzIGFyZSByZWN0cywgRWxlbWVudHMsIENTUyBzZWxlY3RvcnMsIG9yICdwYXJlbnQnIG9yICdzZWxmJ1xuICAgICAgICAgPSAob2JqZWN0KSBUaGUgY3VycmVudCByZXN0cmljdGlvbnMgb2JqZWN0IG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgICAqKlxuICAgICAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5yZXN0cmljdCh7XG4gICAgICAgICB8ICAgICAvLyB0aGUgcmVjdCB3aWxsIGJlIGBpbnRlcmFjdC5nZXRFbGVtZW50UmVjdChlbGVtZW50LnBhcmVudE5vZGUpYFxuICAgICAgICAgfCAgICAgZHJhZzogZWxlbWVudC5wYXJlbnROb2RlLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8geCBhbmQgeSBhcmUgcmVsYXRpdmUgdG8gdGhlIHRoZSBpbnRlcmFjdGFibGUncyBvcmlnaW5cbiAgICAgICAgIHwgICAgIHJlc2l6ZTogeyB4OiAxMDAsIHk6IDEwMCwgd2lkdGg6IDIwMCwgaGVpZ2h0OiAyMDAgfVxuICAgICAgICAgfCB9KVxuICAgICAgICAgfFxuICAgICAgICAgfCBpbnRlcmFjdCgnLmRyYWdnYWJsZScpLnJlc3RyaWN0KHtcbiAgICAgICAgIHwgICAgIC8vIHRoZSByZWN0IHdpbGwgYmUgdGhlIHNlbGVjdGVkIGVsZW1lbnQncyBwYXJlbnRcbiAgICAgICAgIHwgICAgIGRyYWc6ICdwYXJlbnQnLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gZG8gbm90IHJlc3RyaWN0IGR1cmluZyBub3JtYWwgbW92ZW1lbnQuXG4gICAgICAgICB8ICAgICAvLyBJbnN0ZWFkLCB0cmlnZ2VyIG9ubHkgb25lIHJlc3RyaWN0ZWQgbW92ZSBldmVudFxuICAgICAgICAgfCAgICAgLy8gaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBlbmQgZXZlbnQuXG4gICAgICAgICB8ICAgICBlbmRPbmx5OiB0cnVlLFxuICAgICAgICAgfFxuICAgICAgICAgfCAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvcHVsbC83MiNpc3N1ZS00MTgxMzQ5M1xuICAgICAgICAgfCAgICAgZWxlbWVudFJlY3Q6IHsgdG9wOiAwLCBsZWZ0OiAwLCBib3R0b206IDEsIHJpZ2h0OiAxIH1cbiAgICAgICAgIHwgfSk7XG4gICAgICAgIFxcKi9cbiAgICAgICAgcmVzdHJpY3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIXNjb3BlLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0T3B0aW9ucygncmVzdHJpY3QnLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSBbJ2RyYWcnLCAncmVzaXplJywgJ2dlc3R1cmUnXSxcbiAgICAgICAgICAgICAgICByZXQ7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwZXJBY3Rpb24gPSB1dGlscy5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFthY3Rpb25dLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uOiBvcHRpb25zW2FjdGlvbl1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldCA9IHRoaXMuc2V0T3B0aW9ucygncmVzdHJpY3QnLCBwZXJBY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5jb250ZXh0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIEdldHMgdGhlIHNlbGVjdG9yIGNvbnRleHQgTm9kZSBvZiB0aGUgSW50ZXJhY3RhYmxlLiBUaGUgZGVmYXVsdCBpcyBgd2luZG93LmRvY3VtZW50YC5cbiAgICAgICAgICpcbiAgICAgICAgID0gKE5vZGUpIFRoZSBjb250ZXh0IE5vZGUgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgICoqXG4gICAgICAgIFxcKi9cbiAgICAgICAgY29udGV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NvbnRleHQ6IHNjb3BlLmRvY3VtZW50LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLmlnbm9yZUZyb21cbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgXG4gICAgICAgICAqIGV2ZW50IG9yIGFueSBvZiBpdCdzIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvclxuICAgICAgICAgKiBFbGVtZW50LCBubyBkcmFnL3Jlc2l6ZS9nZXN0dXJlIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAqXG4gICAgICAgICAtIG5ld1ZhbHVlIChzdHJpbmcgfCBFbGVtZW50IHwgbnVsbCkgI29wdGlvbmFsIGEgQ1NTIHNlbGVjdG9yIHN0cmluZywgYW4gRWxlbWVudCBvciBgbnVsbGAgdG8gbm90IGlnbm9yZSBhbnkgZWxlbWVudHNcbiAgICAgICAgID0gKHN0cmluZyB8IEVsZW1lbnQgfCBvYmplY3QpIFRoZSBjdXJyZW50IGlnbm9yZUZyb20gdmFsdWUgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgICoqXG4gICAgICAgICB8IGludGVyYWN0KGVsZW1lbnQsIHsgaWdub3JlRnJvbTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vLWFjdGlvbicpIH0pO1xuICAgICAgICAgfCAvLyBvclxuICAgICAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5pZ25vcmVGcm9tKCdpbnB1dCwgdGV4dGFyZWEsIGEnKTtcbiAgICAgICAgXFwqL1xuICAgICAgICBpZ25vcmVGcm9tOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS50cnlTZWxlY3RvcihuZXdWYWx1ZSkpIHsgICAgICAgICAgICAvLyBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmlnbm9yZUZyb20gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzRWxlbWVudChuZXdWYWx1ZSkpIHsgICAgICAgICAgICAgIC8vIHNwZWNpZmljIGVsZW1lbnRcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaWdub3JlRnJvbSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmlnbm9yZUZyb207XG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBJbnRlcmFjdGFibGUuYWxsb3dGcm9tXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIEEgZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkIG9ubHkgSWYgdGhlIHRhcmdldCBvZiB0aGVcbiAgICAgICAgICogYG1vdXNlZG93bmAsIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgIGV2ZW50IG9yIGFueSBvZiBpdCdzXG4gICAgICAgICAqIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvciBFbGVtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgLSBuZXdWYWx1ZSAoc3RyaW5nIHwgRWxlbWVudCB8IG51bGwpICNvcHRpb25hbCBhIENTUyBzZWxlY3RvciBzdHJpbmcsIGFuIEVsZW1lbnQgb3IgYG51bGxgIHRvIGFsbG93IGZyb20gYW55IGVsZW1lbnRcbiAgICAgICAgID0gKHN0cmluZyB8IEVsZW1lbnQgfCBvYmplY3QpIFRoZSBjdXJyZW50IGFsbG93RnJvbSB2YWx1ZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICAgKipcbiAgICAgICAgIHwgaW50ZXJhY3QoZWxlbWVudCwgeyBhbGxvd0Zyb206IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcmFnLWhhbmRsZScpIH0pO1xuICAgICAgICAgfCAvLyBvclxuICAgICAgICAgfCBpbnRlcmFjdChlbGVtZW50KS5hbGxvd0Zyb20oJy5oYW5kbGUnKTtcbiAgICAgICAgXFwqL1xuICAgICAgICBhbGxvd0Zyb206IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlLnRyeVNlbGVjdG9yKG5ld1ZhbHVlKSkgeyAgICAgICAgICAgIC8vIENTUyBzZWxlY3RvciB0byBtYXRjaCBldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuYWxsb3dGcm9tID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5pc0VsZW1lbnQobmV3VmFsdWUpKSB7ICAgICAgICAgICAgICAvLyBzcGVjaWZpYyBlbGVtZW50XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFsbG93RnJvbSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmFsbG93RnJvbTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5lbGVtZW50XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIHRoaXMgaXMgbm90IGEgc2VsZWN0b3IgSW50ZXJhY3RhYmxlLCBpdCByZXR1cm5zIHRoZSBlbGVtZW50IHRoaXNcbiAgICAgICAgICogaW50ZXJhY3RhYmxlIHJlcHJlc2VudHNcbiAgICAgICAgICpcbiAgICAgICAgID0gKEVsZW1lbnQpIEhUTUwgLyBTVkcgRWxlbWVudFxuICAgICAgICBcXCovXG4gICAgICAgIGVsZW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLmZpcmVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogQ2FsbHMgbGlzdGVuZXJzIGZvciB0aGUgZ2l2ZW4gSW50ZXJhY3RFdmVudCB0eXBlIGJvdW5kIGdsb2JhbGx5XG4gICAgICAgICAqIGFuZCBkaXJlY3RseSB0byB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICAgKlxuICAgICAgICAgLSBpRXZlbnQgKEludGVyYWN0RXZlbnQpIFRoZSBJbnRlcmFjdEV2ZW50IG9iamVjdCB0byBiZSBmaXJlZCBvbiB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICAgPSAoSW50ZXJhY3RhYmxlKSB0aGlzIEludGVyYWN0YWJsZVxuICAgICAgICBcXCovXG4gICAgICAgIGZpcmU6IGZ1bmN0aW9uIChpRXZlbnQpIHtcbiAgICAgICAgICAgIGlmICghKGlFdmVudCAmJiBpRXZlbnQudHlwZSkgfHwgIXNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIGlFdmVudC50eXBlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzLFxuICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgIG9uRXZlbnQgPSAnb24nICsgaUV2ZW50LnR5cGUsXG4gICAgICAgICAgICAgICAgZnVuY05hbWUgPSAnJztcblxuICAgICAgICAgICAgLy8gSW50ZXJhY3RhYmxlI29uKCkgbGlzdGVuZXJzXG4gICAgICAgICAgICBpZiAoaUV2ZW50LnR5cGUgaW4gdGhpcy5faUV2ZW50cykge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IHRoaXMuX2lFdmVudHNbaUV2ZW50LnR5cGVdO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbiAmJiAhaUV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmNOYW1lID0gbGlzdGVuZXJzW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXShpRXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaW50ZXJhY3RhYmxlLm9uZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgICAgIGlmIChzY29wZS5pc0Z1bmN0aW9uKHRoaXNbb25FdmVudF0pKSB7XG4gICAgICAgICAgICAgICAgZnVuY05hbWUgPSB0aGlzW29uRXZlbnRdLm5hbWU7XG4gICAgICAgICAgICAgICAgdGhpc1tvbkV2ZW50XShpRXZlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpbnRlcmFjdC5vbigpIGxpc3RlbmVyc1xuICAgICAgICAgICAgaWYgKGlFdmVudC50eXBlIGluIHNjb3BlLmdsb2JhbEV2ZW50cyAmJiAobGlzdGVuZXJzID0gc2NvcGUuZ2xvYmFsRXZlbnRzW2lFdmVudC50eXBlXSkpICB7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuICYmICFpRXZlbnQuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuY05hbWUgPSBsaXN0ZW5lcnNbaV0ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2ldKGlFdmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5vblxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKlxuICAgICAgICAgKiBCaW5kcyBhIGxpc3RlbmVyIGZvciBhbiBJbnRlcmFjdEV2ZW50IG9yIERPTSBldmVudC5cbiAgICAgICAgICpcbiAgICAgICAgIC0gZXZlbnRUeXBlICAoc3RyaW5nIHwgYXJyYXkgfCBvYmplY3QpIFRoZSB0eXBlcyBvZiBldmVudHMgdG8gbGlzdGVuIGZvclxuICAgICAgICAgLSBsaXN0ZW5lciAgIChmdW5jdGlvbikgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiB0aGUgZ2l2ZW4gZXZlbnQocylcbiAgICAgICAgIC0gdXNlQ2FwdHVyZSAoYm9vbGVhbikgI29wdGlvbmFsIHVzZUNhcHR1cmUgZmxhZyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuICAgICAgICAgPSAob2JqZWN0KSBUaGlzIEludGVyYWN0YWJsZVxuICAgICAgICBcXCovXG4gICAgICAgIG9uOiBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc1N0cmluZyhldmVudFR5cGUpICYmIGV2ZW50VHlwZS5zZWFyY2goJyAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGUudHJpbSgpLnNwbGl0KC8gKy8pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNBcnJheShldmVudFR5cGUpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGV2ZW50VHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uKGV2ZW50VHlwZVtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3QoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub24ocHJvcCwgZXZlbnRUeXBlW3Byb3BdLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudFR5cGUgPT09ICd3aGVlbCcpIHtcbiAgICAgICAgICAgICAgICBldmVudFR5cGUgPSBzY29wZS53aGVlbEV2ZW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb252ZXJ0IHRvIGJvb2xlYW5cbiAgICAgICAgICAgIHVzZUNhcHR1cmUgPSB1c2VDYXB0dXJlPyB0cnVlOiBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHNjb3BlLmNvbnRhaW5zKHNjb3BlLmV2ZW50VHlwZXMsIGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIHR5cGUgb2YgZXZlbnQgd2FzIG5ldmVyIGJvdW5kIHRvIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgaWYgKCEoZXZlbnRUeXBlIGluIHRoaXMuX2lFdmVudHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2lFdmVudHNbZXZlbnRUeXBlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pRXZlbnRzW2V2ZW50VHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZGVsZWdhdGVkIGV2ZW50IGZvciBzZWxlY3RvclxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIGlmICghc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuZGVsZWdhdGVkRXZlbnRzW2V2ZW50VHlwZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dHMgOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBhZGQgZGVsZWdhdGUgbGlzdGVuZXIgZnVuY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzY29wZS5kb2N1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQoc2NvcGUuZG9jdW1lbnRzW2ldLCBldmVudFR5cGUsIGRlbGVnYXRlTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZChzY29wZS5kb2N1bWVudHNbaV0sIGV2ZW50VHlwZSwgZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBkZWxlZ2F0ZWQgPSBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbZXZlbnRUeXBlXSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGluZGV4ID0gZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzW2luZGV4XSA9PT0gdGhpcy5zZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgZGVsZWdhdGVkLmNvbnRleHRzW2luZGV4XSA9PT0gdGhpcy5fY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5wdXNoKHRoaXMuc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMgLnB1c2godGhpcy5fY29udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMucHVzaChbXSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8ga2VlcCBsaXN0ZW5lciBhbmQgdXNlQ2FwdHVyZSBmbGFnXG4gICAgICAgICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVyc1tpbmRleF0ucHVzaChbbGlzdGVuZXIsIHVzZUNhcHR1cmVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQodGhpcy5fZWxlbWVudCwgZXZlbnRUeXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLm9mZlxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKlxuICAgICAgICAgKiBSZW1vdmVzIGFuIEludGVyYWN0RXZlbnQgb3IgRE9NIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgICAqXG4gICAgICAgICAtIGV2ZW50VHlwZSAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRoYXQgd2VyZSBsaXN0ZW5lZCBmb3JcbiAgICAgICAgIC0gbGlzdGVuZXIgICAoZnVuY3Rpb24pIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBiZSByZW1vdmVkXG4gICAgICAgICAtIHVzZUNhcHR1cmUgKGJvb2xlYW4pICNvcHRpb25hbCB1c2VDYXB0dXJlIGZsYWcgZm9yIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgICAgID0gKG9iamVjdCkgVGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgXFwqL1xuICAgICAgICBvZmY6IGZ1bmN0aW9uIChldmVudFR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICB2YXIgaTtcblxuICAgICAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKGV2ZW50VHlwZSkgJiYgZXZlbnRUeXBlLnNlYXJjaCgnICcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGV2ZW50VHlwZSA9IGV2ZW50VHlwZS50cmltKCkuc3BsaXQoLyArLyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5pc0FycmF5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnRUeXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2ZmKGV2ZW50VHlwZVtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3QoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2ZmKHByb3AsIGV2ZW50VHlwZVtwcm9wXSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZXZlbnRMaXN0LFxuICAgICAgICAgICAgICAgIGluZGV4ID0gLTE7XG5cbiAgICAgICAgICAgIC8vIGNvbnZlcnQgdG8gYm9vbGVhblxuICAgICAgICAgICAgdXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU/IHRydWU6IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnd2hlZWwnKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlID0gc2NvcGUud2hlZWxFdmVudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgaXQgaXMgYW4gYWN0aW9uIGV2ZW50IHR5cGVcbiAgICAgICAgICAgIGlmIChzY29wZS5jb250YWlucyhzY29wZS5ldmVudFR5cGVzLCBldmVudFR5cGUpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRMaXN0ID0gdGhpcy5faUV2ZW50c1tldmVudFR5cGVdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50TGlzdCAmJiAoaW5kZXggPSBzY29wZS5pbmRleE9mKGV2ZW50TGlzdCwgbGlzdGVuZXIpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faUV2ZW50c1tldmVudFR5cGVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZGVsZWdhdGVkIGV2ZW50XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGVnYXRlZCA9IHNjb3BlLmRlbGVnYXRlZEV2ZW50c1tldmVudFR5cGVdLFxuICAgICAgICAgICAgICAgICAgICBtYXRjaEZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWRlbGVnYXRlZCkgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgICAgICAgICAgLy8gY291bnQgZnJvbSBsYXN0IGluZGV4IG9mIGRlbGVnYXRlZCB0byAwXG4gICAgICAgICAgICAgICAgZm9yIChpbmRleCA9IGRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoIC0gMTsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBtYXRjaGluZyBzZWxlY3RvciBhbmQgY29udGV4dCBOb2RlXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzW2luZGV4XSA9PT0gdGhpcy5zZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgZGVsZWdhdGVkLmNvbnRleHRzW2luZGV4XSA9PT0gdGhpcy5fY29udGV4dCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gZGVsZWdhdGVkLmxpc3RlbmVyc1tpbmRleF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVhY2ggaXRlbSBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGlzIGFuIGFycmF5OiBbZnVuY3Rpb24sIHVzZUNhcHR1cmVGbGFnXVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gbGlzdGVuZXJzW2ldWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VDYXAgPSBsaXN0ZW5lcnNbaV1bMV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zIGFuZCB1c2VDYXB0dXJlIGZsYWdzIG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZuID09PSBsaXN0ZW5lciAmJiB1c2VDYXAgPT09IHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbGwgbGlzdGVuZXJzIGZvciB0aGlzIGludGVyYWN0YWJsZSBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGludGVyYWN0YWJsZSBmcm9tIHRoZSBkZWxlZ2F0ZWQgYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgZGVsZWdhdGUgZnVuY3Rpb24gZnJvbSBjb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIGV2ZW50VHlwZSwgZGVsZWdhdGVMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIGV2ZW50VHlwZSwgZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBhcnJheXMgaWYgdGhleSBhcmUgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbZXZlbnRUeXBlXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHJlbW92ZSBvbmUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoRm91bmQpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBmcm9tIHRoaXMgSW50ZXJhdGFibGUncyBlbGVtZW50XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2VsZW1lbnQsIGV2ZW50VHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxcXG4gICAgICAgICAqIEludGVyYWN0YWJsZS5zZXRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICpcbiAgICAgICAgICogUmVzZXQgdGhlIG9wdGlvbnMgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICAgICAgIC0gb3B0aW9ucyAob2JqZWN0KSBUaGUgbmV3IHNldHRpbmdzIHRvIGFwcGx5XG4gICAgICAgICA9IChvYmplY3QpIFRoaXMgSW50ZXJhY3RhYmx3XG4gICAgICAgIFxcKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCFzY29wZS5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gdXRpbHMuZXh0ZW5kKHt9LCBzY29wZS5kZWZhdWx0T3B0aW9ucy5iYXNlKTtcblxuICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IFsnZHJhZycsICdkcm9wJywgJ3Jlc2l6ZScsICdnZXN0dXJlJ10sXG4gICAgICAgICAgICAgICAgbWV0aG9kcyA9IFsnZHJhZ2dhYmxlJywgJ2Ryb3B6b25lJywgJ3Jlc2l6YWJsZScsICdnZXN0dXJhYmxlJ10sXG4gICAgICAgICAgICAgICAgcGVyQWN0aW9ucyA9IHV0aWxzLmV4dGVuZCh1dGlscy5leHRlbmQoe30sIHNjb3BlLmRlZmF1bHRPcHRpb25zLnBlckFjdGlvbiksIG9wdGlvbnNbYWN0aW9uXSB8fCB7fSk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFjdGlvbnNbaV07XG5cbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXSA9IHV0aWxzLmV4dGVuZCh7fSwgc2NvcGUuZGVmYXVsdE9wdGlvbnNbYWN0aW9uXSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFBlckFjdGlvbihhY3Rpb24sIHBlckFjdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgdGhpc1ttZXRob2RzW2ldXShvcHRpb25zW2FjdGlvbl0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBbXG4gICAgICAgICAgICAgICAgICAgICdhY2NlcHQnLCAnYWN0aW9uQ2hlY2tlcicsICdhbGxvd0Zyb20nLCAnZGVsdGFTb3VyY2UnLFxuICAgICAgICAgICAgICAgICAgICAnZHJvcENoZWNrZXInLCAnaWdub3JlRnJvbScsICdvcmlnaW4nLCAncHJldmVudERlZmF1bHQnLFxuICAgICAgICAgICAgICAgICAgICAncmVjdENoZWNrZXInXG4gICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gc2V0dGluZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc2V0dGluZyA9IHNldHRpbmdzW2ldO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW3NldHRpbmddID0gc2NvcGUuZGVmYXVsdE9wdGlvbnMuYmFzZVtzZXR0aW5nXTtcblxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tzZXR0aW5nXShvcHRpb25zW3NldHRpbmddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogSW50ZXJhY3RhYmxlLnVuc2V0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqXG4gICAgICAgICAqIFJlbW92ZSB0aGlzIGludGVyYWN0YWJsZSBmcm9tIHRoZSBsaXN0IG9mIGludGVyYWN0YWJsZXMgYW5kIHJlbW92ZVxuICAgICAgICAgKiBpdCdzIGRyYWcsIGRyb3AsIHJlc2l6ZSBhbmQgZ2VzdHVyZSBjYXBhYmlsaXRpZXNcbiAgICAgICAgICpcbiAgICAgICAgID0gKG9iamVjdCkgQGludGVyYWN0XG4gICAgICAgIFxcKi9cbiAgICAgICAgdW5zZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fZWxlbWVudCwgJ2FsbCcpO1xuXG4gICAgICAgICAgICBpZiAoIXNjb3BlLmlzU3RyaW5nKHRoaXMuc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLCAnYWxsJyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLmN1cnNvciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBkZWxlZ2F0ZWQgZXZlbnRzXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdHlwZSBpbiBzY29wZS5kZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlbGVnYXRlZCA9IHNjb3BlLmRlbGVnYXRlZEV2ZW50c1t0eXBlXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzW2ldID09PSB0aGlzLnNlbGVjdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgZGVsZWdhdGVkLmNvbnRleHRzW2ldID09PSB0aGlzLl9jb250ZXh0KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuc2VsZWN0b3JzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMgLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgYXJyYXlzIGlmIHRoZXkgYXJlIGVtcHR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5kZWxlZ2F0ZWRFdmVudHNbdHlwZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCB0eXBlLCBkZWxlZ2F0ZUxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgdHlwZSwgZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZHJvcHpvbmUoZmFsc2UpO1xuXG4gICAgICAgICAgICBzY29wZS5pbnRlcmFjdGFibGVzLnNwbGljZShzY29wZS5pbmRleE9mKHNjb3BlLmludGVyYWN0YWJsZXMsIHRoaXMpLCAxKTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEludGVyYWN0YWJsZS5wcm90b3R5cGUuc25hcCA9IHV0aWxzLndhcm5PbmNlKEludGVyYWN0YWJsZS5wcm90b3R5cGUuc25hcCxcbiAgICAgICAgICdJbnRlcmFjdGFibGUjc25hcCBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBzbmFwcGluZyBhdCBodHRwOi8vaW50ZXJhY3Rqcy5pby9kb2NzL3NuYXBwaW5nJyk7XG4gICAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5yZXN0cmljdCA9IHV0aWxzLndhcm5PbmNlKEludGVyYWN0YWJsZS5wcm90b3R5cGUucmVzdHJpY3QsXG4gICAgICAgICAnSW50ZXJhY3RhYmxlI3Jlc3RyaWN0IGlzIGRlcHJlY2F0ZWQuIFNlZSB0aGUgbmV3IGRvY3VtZW50YXRpb24gZm9yIHJlc3RpY3RpbmcgYXQgaHR0cDovL2ludGVyYWN0anMuaW8vZG9jcy9yZXN0cmljdGlvbicpO1xuICAgIEludGVyYWN0YWJsZS5wcm90b3R5cGUuaW5lcnRpYSA9IHV0aWxzLndhcm5PbmNlKEludGVyYWN0YWJsZS5wcm90b3R5cGUuaW5lcnRpYSxcbiAgICAgICAgICdJbnRlcmFjdGFibGUjaW5lcnRpYSBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBpbmVydGlhIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvaW5lcnRpYScpO1xuICAgIEludGVyYWN0YWJsZS5wcm90b3R5cGUuYXV0b1Njcm9sbCA9IHV0aWxzLndhcm5PbmNlKEludGVyYWN0YWJsZS5wcm90b3R5cGUuYXV0b1Njcm9sbCxcbiAgICAgICAgICdJbnRlcmFjdGFibGUjYXV0b1Njcm9sbCBpcyBkZXByZWNhdGVkLiBTZWUgdGhlIG5ldyBkb2N1bWVudGF0aW9uIGZvciBhdXRvU2Nyb2xsIGF0IGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvI2F1dG9zY3JvbGwnKTtcbiAgICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnNxdWFyZVJlc2l6ZSA9IHV0aWxzLndhcm5PbmNlKEludGVyYWN0YWJsZS5wcm90b3R5cGUuc3F1YXJlUmVzaXplLFxuICAgICAgICAgJ0ludGVyYWN0YWJsZSNzcXVhcmVSZXNpemUgaXMgZGVwcmVjYXRlZC4gU2VlIGh0dHA6Ly9pbnRlcmFjdGpzLmlvL2RvY3MvI3Jlc2l6ZS1zcXVhcmUnKTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5pc1NldFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBDaGVjayBpZiBhbiBlbGVtZW50IGhhcyBiZWVuIHNldFxuICAgICAtIGVsZW1lbnQgKEVsZW1lbnQpIFRoZSBFbGVtZW50IGJlaW5nIHNlYXJjaGVkIGZvclxuICAgICA9IChib29sZWFuKSBJbmRpY2F0ZXMgaWYgdGhlIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHdhcyBwcmV2aW91c2x5IHBhc3NlZCB0byBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5pc1NldCA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0YWJsZXMuaW5kZXhPZkVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyAmJiBvcHRpb25zLmNvbnRleHQpICE9PSAtMTtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0Lm9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIEFkZHMgYSBnbG9iYWwgbGlzdGVuZXIgZm9yIGFuIEludGVyYWN0RXZlbnQgb3IgYWRkcyBhIERPTSBldmVudCB0b1xuICAgICAqIGBkb2N1bWVudGBcbiAgICAgKlxuICAgICAtIHR5cGUgICAgICAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRvIGxpc3RlbiBmb3JcbiAgICAgLSBsaXN0ZW5lciAgIChmdW5jdGlvbikgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiB0aGUgZ2l2ZW4gZXZlbnQocylcbiAgICAgLSB1c2VDYXB0dXJlIChib29sZWFuKSAjb3B0aW9uYWwgdXNlQ2FwdHVyZSBmbGFnIGZvciBhZGRFdmVudExpc3RlbmVyXG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3Qub24gPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKHR5cGUpICYmIHR5cGUuc2VhcmNoKCcgJykgIT09IC0xKSB7XG4gICAgICAgICAgICB0eXBlID0gdHlwZS50cmltKCkuc3BsaXQoLyArLyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Qub24odHlwZVtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3QodHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gdHlwZSkge1xuICAgICAgICAgICAgICAgIGludGVyYWN0Lm9uKHByb3AsIHR5cGVbcHJvcF0sIGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgaXQgaXMgYW4gSW50ZXJhY3RFdmVudCB0eXBlLCBhZGQgbGlzdGVuZXIgdG8gZ2xvYmFsRXZlbnRzXG4gICAgICAgIGlmIChzY29wZS5jb250YWlucyhzY29wZS5ldmVudFR5cGVzLCB0eXBlKSkge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyB0eXBlIG9mIGV2ZW50IHdhcyBuZXZlciBib3VuZFxuICAgICAgICAgICAgaWYgKCFzY29wZS5nbG9iYWxFdmVudHNbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICBzY29wZS5nbG9iYWxFdmVudHNbdHlwZV0gPSBbbGlzdGVuZXJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIG5vbiBJbnRlcmFjdEV2ZW50IHR5cGUsIGFkZEV2ZW50TGlzdGVuZXIgdG8gZG9jdW1lbnRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBldmVudHMuYWRkKHNjb3BlLmRvY3VtZW50LCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5vZmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmVtb3ZlcyBhIGdsb2JhbCBJbnRlcmFjdEV2ZW50IGxpc3RlbmVyIG9yIERPTSBldmVudCBmcm9tIGBkb2N1bWVudGBcbiAgICAgKlxuICAgICAtIHR5cGUgICAgICAgKHN0cmluZyB8IGFycmF5IHwgb2JqZWN0KSBUaGUgdHlwZXMgb2YgZXZlbnRzIHRoYXQgd2VyZSBsaXN0ZW5lZCBmb3JcbiAgICAgLSBsaXN0ZW5lciAgIChmdW5jdGlvbikgVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGJlIHJlbW92ZWRcbiAgICAgLSB1c2VDYXB0dXJlIChib29sZWFuKSAjb3B0aW9uYWwgdXNlQ2FwdHVyZSBmbGFnIGZvciByZW1vdmVFdmVudExpc3RlbmVyXG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICAgXFwqL1xuICAgIGludGVyYWN0Lm9mZiA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNTdHJpbmcodHlwZSkgJiYgdHlwZS5zZWFyY2goJyAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRyaW0oKS5zcGxpdCgvICsvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzY29wZS5pc0FycmF5KHR5cGUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdC5vZmYodHlwZVtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3QodHlwZSkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gdHlwZSkge1xuICAgICAgICAgICAgICAgIGludGVyYWN0Lm9mZihwcm9wLCB0eXBlW3Byb3BdLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2NvcGUuY29udGFpbnMoc2NvcGUuZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgICAgIGV2ZW50cy5yZW1vdmUoc2NvcGUuZG9jdW1lbnQsIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpbmRleDtcblxuICAgICAgICAgICAgaWYgKHR5cGUgaW4gc2NvcGUuZ2xvYmFsRXZlbnRzXG4gICAgICAgICAgICAgICAgJiYgKGluZGV4ID0gc2NvcGUuaW5kZXhPZihzY29wZS5nbG9iYWxFdmVudHNbdHlwZV0sIGxpc3RlbmVyKSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2xvYmFsRXZlbnRzW3R5cGVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5lbmFibGVEcmFnZ2luZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEZXByZWNhdGVkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgZHJhZ2dpbmcgaXMgZW5hYmxlZCBmb3IgYW55IEludGVyYWN0YWJsZXNcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWwgYHRydWVgIHRvIGFsbG93IHRoZSBhY3Rpb247IGBmYWxzZWAgdG8gZGlzYWJsZSBhY3Rpb24gZm9yIGFsbCBJbnRlcmFjdGFibGVzXG4gICAgID0gKGJvb2xlYW4gfCBvYmplY3QpIFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3QuZW5hYmxlRHJhZ2dpbmcgPSB1dGlscy53YXJuT25jZShmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBudWxsICYmIG5ld1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5kcmFnID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uSXNFbmFibGVkLmRyYWc7XG4gICAgfSwgJ2ludGVyYWN0LmVuYWJsZURyYWdnaW5nIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgc29vbiBiZSByZW1vdmVkLicpO1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmVuYWJsZVJlc2l6aW5nXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIERlcHJlY2F0ZWQuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciByZXNpemluZyBpcyBlbmFibGVkIGZvciBhbnkgSW50ZXJhY3RhYmxlc1xuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKGJvb2xlYW4pICNvcHRpb25hbCBgdHJ1ZWAgdG8gYWxsb3cgdGhlIGFjdGlvbjsgYGZhbHNlYCB0byBkaXNhYmxlIGFjdGlvbiBmb3IgYWxsIEludGVyYWN0YWJsZXNcbiAgICAgPSAoYm9vbGVhbiB8IG9iamVjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5lbmFibGVSZXNpemluZyA9IHV0aWxzLndhcm5PbmNlKGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAobmV3VmFsdWUgIT09IG51bGwgJiYgbmV3VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2NvcGUuYWN0aW9uSXNFbmFibGVkLnJlc2l6ZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlLmFjdGlvbklzRW5hYmxlZC5yZXNpemU7XG4gICAgfSwgJ2ludGVyYWN0LmVuYWJsZVJlc2l6aW5nIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgc29vbiBiZSByZW1vdmVkLicpO1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmVuYWJsZUdlc3R1cmluZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEZXByZWNhdGVkLlxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgZ2VzdHVyaW5nIGlzIGVuYWJsZWQgZm9yIGFueSBJbnRlcmFjdGFibGVzXG4gICAgICpcbiAgICAgLSBuZXdWYWx1ZSAoYm9vbGVhbikgI29wdGlvbmFsIGB0cnVlYCB0byBhbGxvdyB0aGUgYWN0aW9uOyBgZmFsc2VgIHRvIGRpc2FibGUgYWN0aW9uIGZvciBhbGwgSW50ZXJhY3RhYmxlc1xuICAgICA9IChib29sZWFuIHwgb2JqZWN0KSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0LmVuYWJsZUdlc3R1cmluZyA9IHV0aWxzLndhcm5PbmNlKGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAobmV3VmFsdWUgIT09IG51bGwgJiYgbmV3VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2NvcGUuYWN0aW9uSXNFbmFibGVkLmdlc3R1cmUgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5hY3Rpb25Jc0VuYWJsZWQuZ2VzdHVyZTtcbiAgICB9LCAnaW50ZXJhY3QuZW5hYmxlR2VzdHVyaW5nIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgc29vbiBiZSByZW1vdmVkLicpO1xuXG4gICAgaW50ZXJhY3QuZXZlbnRUeXBlcyA9IHNjb3BlLmV2ZW50VHlwZXM7XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3QuZGVidWdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBkZWJ1Z2dpbmcgZGF0YVxuICAgICA9IChvYmplY3QpIEFuIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgdGhhdCBvdXRsaW5lIHRoZSBjdXJyZW50IHN0YXRlIGFuZCBleHBvc2UgaW50ZXJuYWwgZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXNcbiAgICBcXCovXG4gICAgaW50ZXJhY3QuZGVidWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9uc1swXSB8fCBuZXcgSW50ZXJhY3Rpb24oKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW50ZXJhY3Rpb25zICAgICAgICAgIDogc2NvcGUuaW50ZXJhY3Rpb25zLFxuICAgICAgICAgICAgdGFyZ2V0ICAgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24udGFyZ2V0LFxuICAgICAgICAgICAgZHJhZ2dpbmcgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24uZHJhZ2dpbmcsXG4gICAgICAgICAgICByZXNpemluZyAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5yZXNpemluZyxcbiAgICAgICAgICAgIGdlc3R1cmluZyAgICAgICAgICAgICA6IGludGVyYWN0aW9uLmdlc3R1cmluZyxcbiAgICAgICAgICAgIHByZXBhcmVkICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnByZXBhcmVkLFxuICAgICAgICAgICAgbWF0Y2hlcyAgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ubWF0Y2hlcyxcbiAgICAgICAgICAgIG1hdGNoRWxlbWVudHMgICAgICAgICA6IGludGVyYWN0aW9uLm1hdGNoRWxlbWVudHMsXG5cbiAgICAgICAgICAgIHByZXZDb29yZHMgICAgICAgICAgICA6IGludGVyYWN0aW9uLnByZXZDb29yZHMsXG4gICAgICAgICAgICBzdGFydENvb3JkcyAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5zdGFydENvb3JkcyxcblxuICAgICAgICAgICAgcG9pbnRlcklkcyAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucG9pbnRlcklkcyxcbiAgICAgICAgICAgIHBvaW50ZXJzICAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgICAgICAgYWRkUG9pbnRlciAgICAgICAgICAgIDogc2NvcGUubGlzdGVuZXJzLmFkZFBvaW50ZXIsXG4gICAgICAgICAgICByZW1vdmVQb2ludGVyICAgICAgICAgOiBzY29wZS5saXN0ZW5lcnMucmVtb3ZlUG9pbnRlcixcbiAgICAgICAgICAgIHJlY29yZFBvaW50ZXIgICAgICAgICA6IHNjb3BlLmxpc3RlbmVycy5yZWNvcmRQb2ludGVyLFxuXG4gICAgICAgICAgICBzbmFwICAgICAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5zbmFwU3RhdHVzLFxuICAgICAgICAgICAgcmVzdHJpY3QgICAgICAgICAgICAgIDogaW50ZXJhY3Rpb24ucmVzdHJpY3RTdGF0dXMsXG4gICAgICAgICAgICBpbmVydGlhICAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzLFxuXG4gICAgICAgICAgICBkb3duVGltZSAgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF0sXG4gICAgICAgICAgICBkb3duRXZlbnQgICAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5kb3duRXZlbnQsXG4gICAgICAgICAgICBkb3duUG9pbnRlciAgICAgICAgICAgOiBpbnRlcmFjdGlvbi5kb3duUG9pbnRlcixcbiAgICAgICAgICAgIHByZXZFdmVudCAgICAgICAgICAgICA6IGludGVyYWN0aW9uLnByZXZFdmVudCxcblxuICAgICAgICAgICAgSW50ZXJhY3RhYmxlICAgICAgICAgIDogSW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgaW50ZXJhY3RhYmxlcyAgICAgICAgIDogc2NvcGUuaW50ZXJhY3RhYmxlcyxcbiAgICAgICAgICAgIHBvaW50ZXJJc0Rvd24gICAgICAgICA6IGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24sXG4gICAgICAgICAgICBkZWZhdWx0T3B0aW9ucyAgICAgICAgOiBzY29wZS5kZWZhdWx0T3B0aW9ucyxcbiAgICAgICAgICAgIGRlZmF1bHRBY3Rpb25DaGVja2VyICA6IGRlZmF1bHRBY3Rpb25DaGVja2VyLFxuXG4gICAgICAgICAgICBhY3Rpb25DdXJzb3JzICAgICAgICAgOiBzY29wZS5hY3Rpb25DdXJzb3JzLFxuICAgICAgICAgICAgZHJhZ01vdmUgICAgICAgICAgICAgIDogc2NvcGUubGlzdGVuZXJzLmRyYWdNb3ZlLFxuICAgICAgICAgICAgcmVzaXplTW92ZSAgICAgICAgICAgIDogc2NvcGUubGlzdGVuZXJzLnJlc2l6ZU1vdmUsXG4gICAgICAgICAgICBnZXN0dXJlTW92ZSAgICAgICAgICAgOiBzY29wZS5saXN0ZW5lcnMuZ2VzdHVyZU1vdmUsXG4gICAgICAgICAgICBwb2ludGVyVXAgICAgICAgICAgICAgOiBzY29wZS5saXN0ZW5lcnMucG9pbnRlclVwLFxuICAgICAgICAgICAgcG9pbnRlckRvd24gICAgICAgICAgIDogc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJEb3duLFxuICAgICAgICAgICAgcG9pbnRlck1vdmUgICAgICAgICAgIDogc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJNb3ZlLFxuICAgICAgICAgICAgcG9pbnRlckhvdmVyICAgICAgICAgIDogc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJIb3ZlcixcblxuICAgICAgICAgICAgZXZlbnRUeXBlcyAgICAgICAgICAgIDogc2NvcGUuZXZlbnRUeXBlcyxcblxuICAgICAgICAgICAgZXZlbnRzICAgICAgICAgICAgICAgIDogZXZlbnRzLFxuICAgICAgICAgICAgZ2xvYmFsRXZlbnRzICAgICAgICAgIDogc2NvcGUuZ2xvYmFsRXZlbnRzLFxuICAgICAgICAgICAgZGVsZWdhdGVkRXZlbnRzICAgICAgIDogc2NvcGUuZGVsZWdhdGVkRXZlbnRzXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIGV4cG9zZSB0aGUgZnVuY3Rpb25zIHVzZWQgdG8gY2FsY3VsYXRlIG11bHRpLXRvdWNoIHByb3BlcnRpZXNcbiAgICBpbnRlcmFjdC5nZXRUb3VjaEF2ZXJhZ2UgID0gdXRpbHMudG91Y2hBdmVyYWdlO1xuICAgIGludGVyYWN0LmdldFRvdWNoQkJveCAgICAgPSB1dGlscy50b3VjaEJCb3g7XG4gICAgaW50ZXJhY3QuZ2V0VG91Y2hEaXN0YW5jZSA9IHV0aWxzLnRvdWNoRGlzdGFuY2U7XG4gICAgaW50ZXJhY3QuZ2V0VG91Y2hBbmdsZSAgICA9IHV0aWxzLnRvdWNoQW5nbGU7XG5cbiAgICBpbnRlcmFjdC5nZXRFbGVtZW50UmVjdCAgID0gc2NvcGUuZ2V0RWxlbWVudFJlY3Q7XG4gICAgaW50ZXJhY3QubWF0Y2hlc1NlbGVjdG9yICA9IHNjb3BlLm1hdGNoZXNTZWxlY3RvcjtcbiAgICBpbnRlcmFjdC5jbG9zZXN0ICAgICAgICAgID0gc2NvcGUuY2xvc2VzdDtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5tYXJnaW5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtYXJnaW4gZm9yIGF1dG9jaGVjayByZXNpemluZyB1c2VkIGluXG4gICAgICogQEludGVyYWN0YWJsZS5nZXRBY3Rpb24uIFRoYXQgaXMgdGhlIGRpc3RhbmNlIGZyb20gdGhlIGJvdHRvbSBhbmQgcmlnaHRcbiAgICAgKiBlZGdlcyBvZiBhbiBlbGVtZW50IGNsaWNraW5nIGluIHdoaWNoIHdpbGwgc3RhcnQgcmVzaXppbmdcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChudW1iZXIpICNvcHRpb25hbFxuICAgICA9IChudW1iZXIgfCBpbnRlcmFjdCkgVGhlIGN1cnJlbnQgbWFyZ2luIHZhbHVlIG9yIGludGVyYWN0XG4gICAgXFwqL1xuICAgIGludGVyYWN0Lm1hcmdpbiA9IGZ1bmN0aW9uIChuZXd2YWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNOdW1iZXIobmV3dmFsdWUpKSB7XG4gICAgICAgICAgICBzY29wZS5tYXJnaW4gPSBuZXd2YWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5tYXJnaW47XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBpbnRlcmFjdC5zdXBwb3J0c1RvdWNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICA9IChib29sZWFuKSBXaGV0aGVyIG9yIG5vdCB0aGUgYnJvd3NlciBzdXBwb3J0cyB0b3VjaCBpbnB1dFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5zdXBwb3J0c1RvdWNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYnJvd3Nlci5zdXBwb3J0c1RvdWNoO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3Quc3VwcG9ydHNQb2ludGVyRXZlbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgID0gKGJvb2xlYW4pIFdoZXRoZXIgb3Igbm90IHRoZSBicm93c2VyIHN1cHBvcnRzIFBvaW50ZXJFdmVudHNcbiAgICBcXCovXG4gICAgaW50ZXJhY3Quc3VwcG9ydHNQb2ludGVyRXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogaW50ZXJhY3Quc3RvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBDYW5jZWxzIGFsbCBpbnRlcmFjdGlvbnMgKGVuZCBldmVudHMgYXJlIG5vdCBmaXJlZClcbiAgICAgKlxuICAgICAtIGV2ZW50IChFdmVudCkgQW4gZXZlbnQgb24gd2hpY2ggdG8gY2FsbCBwcmV2ZW50RGVmYXVsdCgpXG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICBcXCovXG4gICAgaW50ZXJhY3Quc3RvcCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBpID0gc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0aW9uc1tpXS5zdG9wKGV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LmR5bmFtaWNEcm9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRoZSBkaW1lbnNpb25zIG9mIGRyb3B6b25lIGVsZW1lbnRzIGFyZVxuICAgICAqIGNhbGN1bGF0ZWQgb24gZXZlcnkgZHJhZ21vdmUgb3Igb25seSBvbiBkcmFnc3RhcnQgZm9yIHRoZSBkZWZhdWx0XG4gICAgICogZHJvcENoZWNrZXJcbiAgICAgKlxuICAgICAtIG5ld1ZhbHVlIChib29sZWFuKSAjb3B0aW9uYWwgVHJ1ZSB0byBjaGVjayBvbiBlYWNoIG1vdmUuIEZhbHNlIHRvIGNoZWNrIG9ubHkgYmVmb3JlIHN0YXJ0XG4gICAgID0gKGJvb2xlYW4gfCBpbnRlcmFjdCkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5keW5hbWljRHJvcCA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNCb29sKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgLy9pZiAoZHJhZ2dpbmcgJiYgZHluYW1pY0Ryb3AgIT09IG5ld1ZhbHVlICYmICFuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgIC8vY2FsY1JlY3RzKGRyb3B6b25lcyk7XG4gICAgICAgICAgICAvL31cblxuICAgICAgICAgICAgc2NvcGUuZHluYW1pY0Ryb3AgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZS5keW5hbWljRHJvcDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0LnBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIGRpc3RhbmNlIHRoZSBwb2ludGVyIG11c3QgYmUgbW92ZWQgYmVmb3JlIGFuIGFjdGlvblxuICAgICAqIHNlcXVlbmNlIG9jY3Vycy4gVGhpcyBhbHNvIGFmZmVjdHMgdG9sZXJhbmNlIGZvciB0YXAgZXZlbnRzLlxuICAgICAqXG4gICAgIC0gbmV3VmFsdWUgKG51bWJlcikgI29wdGlvbmFsIFRoZSBtb3ZlbWVudCBmcm9tIHRoZSBzdGFydCBwb3NpdGlvbiBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB0aGlzIHZhbHVlXG4gICAgID0gKG51bWJlciB8IEludGVyYWN0YWJsZSkgVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgIFxcKi9cbiAgICBpbnRlcmFjdC5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNOdW1iZXIobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICBzY29wZS5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY29wZS5wb2ludGVyTW92ZVRvbGVyYW5jZTtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIGludGVyYWN0Lm1heEludGVyYWN0aW9uc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBjb25jdXJyZW50IGludGVyYWN0aW9ucyBhbGxvd2VkLlxuICAgICAqIEJ5IGRlZmF1bHQgb25seSAxIGludGVyYWN0aW9uIGlzIGFsbG93ZWQgYXQgYSB0aW1lIChmb3IgYmFja3dhcmRzXG4gICAgICogY29tcGF0aWJpbGl0eSkuIFRvIGFsbG93IG11bHRpcGxlIGludGVyYWN0aW9ucyBvbiB0aGUgc2FtZSBJbnRlcmFjdGFibGVzXG4gICAgICogYW5kIGVsZW1lbnRzLCB5b3UgbmVlZCB0byBlbmFibGUgaXQgaW4gdGhlIGRyYWdnYWJsZSwgcmVzaXphYmxlIGFuZFxuICAgICAqIGdlc3R1cmFibGUgYCdtYXgnYCBhbmQgYCdtYXhQZXJFbGVtZW50J2Agb3B0aW9ucy5cbiAgICAgKipcbiAgICAgLSBuZXdWYWx1ZSAobnVtYmVyKSAjb3B0aW9uYWwgQW55IG51bWJlci4gbmV3VmFsdWUgPD0gMCBtZWFucyBubyBpbnRlcmFjdGlvbnMuXG4gICAgXFwqL1xuICAgIGludGVyYWN0Lm1heEludGVyYWN0aW9ucyA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoc2NvcGUuaXNOdW1iZXIobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICBzY29wZS5tYXhJbnRlcmFjdGlvbnMgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2NvcGUubWF4SW50ZXJhY3Rpb25zO1xuICAgIH07XG5cbiAgICBpbnRlcmFjdC5jcmVhdGVTbmFwR3JpZCA9IGZ1bmN0aW9uIChncmlkKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgdmFyIG9mZnNldFggPSAwLFxuICAgICAgICAgICAgICAgIG9mZnNldFkgPSAwO1xuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaXNPYmplY3QoZ3JpZC5vZmZzZXQpKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0WCA9IGdyaWQub2Zmc2V0Lng7XG4gICAgICAgICAgICAgICAgb2Zmc2V0WSA9IGdyaWQub2Zmc2V0Lnk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBncmlkeCA9IE1hdGgucm91bmQoKHggLSBvZmZzZXRYKSAvIGdyaWQueCksXG4gICAgICAgICAgICAgICAgZ3JpZHkgPSBNYXRoLnJvdW5kKCh5IC0gb2Zmc2V0WSkgLyBncmlkLnkpLFxuXG4gICAgICAgICAgICAgICAgbmV3WCA9IGdyaWR4ICogZ3JpZC54ICsgb2Zmc2V0WCxcbiAgICAgICAgICAgICAgICBuZXdZID0gZ3JpZHkgKiBncmlkLnkgKyBvZmZzZXRZO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IG5ld1gsXG4gICAgICAgICAgICAgICAgeTogbmV3WSxcbiAgICAgICAgICAgICAgICByYW5nZTogZ3JpZC5yYW5nZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZW5kQWxsSW50ZXJhY3Rpb25zIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjb3BlLmludGVyYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJFbmQoZXZlbnQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpc3RlblRvRG9jdW1lbnQgKGRvYykge1xuICAgICAgICBpZiAoc2NvcGUuY29udGFpbnMoc2NvcGUuZG9jdW1lbnRzLCBkb2MpKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHZhciB3aW4gPSBkb2MuZGVmYXVsdFZpZXcgfHwgZG9jLnBhcmVudFdpbmRvdztcblxuICAgICAgICAvLyBhZGQgZGVsZWdhdGUgZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgZm9yICh2YXIgZXZlbnRUeXBlIGluIHNjb3BlLmRlbGVnYXRlZEV2ZW50cykge1xuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsIGV2ZW50VHlwZSwgZGVsZWdhdGVMaXN0ZW5lcik7XG4gICAgICAgICAgICBldmVudHMuYWRkKGRvYywgZXZlbnRUeXBlLCBkZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3BlLlBvaW50ZXJFdmVudCkge1xuICAgICAgICAgICAgaWYgKHNjb3BlLlBvaW50ZXJFdmVudCA9PT0gd2luLk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICAgICAgICAgICAgc2NvcGUucEV2ZW50VHlwZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVwOiAnTVNQb2ludGVyVXAnLCBkb3duOiAnTVNQb2ludGVyRG93bicsIG92ZXI6ICdtb3VzZW92ZXInLFxuICAgICAgICAgICAgICAgICAgICBvdXQ6ICdtb3VzZW91dCcsIG1vdmU6ICdNU1BvaW50ZXJNb3ZlJywgY2FuY2VsOiAnTVNQb2ludGVyQ2FuY2VsJyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NvcGUucEV2ZW50VHlwZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVwOiAncG9pbnRlcnVwJywgZG93bjogJ3BvaW50ZXJkb3duJywgb3ZlcjogJ3BvaW50ZXJvdmVyJyxcbiAgICAgICAgICAgICAgICAgICAgb3V0OiAncG9pbnRlcm91dCcsIG1vdmU6ICdwb2ludGVybW92ZScsIGNhbmNlbDogJ3BvaW50ZXJjYW5jZWwnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5kb3duICAsIHNjb3BlLmxpc3RlbmVycy5zZWxlY3RvckRvd24gKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5tb3ZlICAsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyTW92ZSAgKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5vdmVyICAsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyT3ZlciAgKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5vdXQgICAsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyT3V0ICAgKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy51cCAgICAsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyVXAgICAgKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCBzY29wZS5wRXZlbnRUeXBlcy5jYW5jZWwsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyQ2FuY2VsKTtcblxuICAgICAgICAgICAgLy8gYXV0b3Njcm9sbFxuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsIHNjb3BlLnBFdmVudFR5cGVzLm1vdmUsIHNjb3BlLmxpc3RlbmVycy5hdXRvU2Nyb2xsTW92ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNlZG93bicsIHNjb3BlLmxpc3RlbmVycy5zZWxlY3RvckRvd24pO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZW1vdmUnLCBzY29wZS5saXN0ZW5lcnMucG9pbnRlck1vdmUgKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnbW91c2V1cCcgICwgc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJVcCAgICk7XG4gICAgICAgICAgICBldmVudHMuYWRkKGRvYywgJ21vdXNlb3ZlcicsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyT3ZlciApO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZW91dCcgLCBzY29wZS5saXN0ZW5lcnMucG9pbnRlck91dCAgKTtcblxuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaHN0YXJ0JyAsIHNjb3BlLmxpc3RlbmVycy5zZWxlY3RvckRvd24gKTtcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCAndG91Y2htb3ZlJyAgLCBzY29wZS5saXN0ZW5lcnMucG9pbnRlck1vdmUgICk7XG4gICAgICAgICAgICBldmVudHMuYWRkKGRvYywgJ3RvdWNoZW5kJyAgICwgc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJVcCAgICApO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaGNhbmNlbCcsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyQ2FuY2VsKTtcblxuICAgICAgICAgICAgLy8gYXV0b3Njcm9sbFxuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsICdtb3VzZW1vdmUnLCBzY29wZS5saXN0ZW5lcnMuYXV0b1Njcm9sbE1vdmUpO1xuICAgICAgICAgICAgZXZlbnRzLmFkZChkb2MsICd0b3VjaG1vdmUnLCBzY29wZS5saXN0ZW5lcnMuYXV0b1Njcm9sbE1vdmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXZlbnRzLmFkZCh3aW4sICdibHVyJywgZW5kQWxsSW50ZXJhY3Rpb25zKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHdpbi5mcmFtZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50RG9jID0gd2luLmZyYW1lRWxlbWVudC5vd25lckRvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRXaW5kb3cgPSBwYXJlbnREb2MuZGVmYXVsdFZpZXc7XG5cbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudERvYyAgICwgJ21vdXNldXAnICAgICAgLCBzY29wZS5saXN0ZW5lcnMucG9pbnRlckVuZCk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnREb2MgICAsICd0b3VjaGVuZCcgICAgICwgc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJFbmQpO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50RG9jICAgLCAndG91Y2hjYW5jZWwnICAsIHNjb3BlLmxpc3RlbmVycy5wb2ludGVyRW5kKTtcbiAgICAgICAgICAgICAgICBldmVudHMuYWRkKHBhcmVudERvYyAgICwgJ3BvaW50ZXJ1cCcgICAgLCBzY29wZS5saXN0ZW5lcnMucG9pbnRlckVuZCk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZChwYXJlbnREb2MgICAsICdNU1BvaW50ZXJVcCcgICwgc2NvcGUubGlzdGVuZXJzLnBvaW50ZXJFbmQpO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5hZGQocGFyZW50V2luZG93LCAnYmx1cicgICAgICAgICAsIGVuZEFsbEludGVyYWN0aW9ucyApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaW50ZXJhY3Qud2luZG93UGFyZW50RXJyb3IgPSBlcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudHMudXNlQXR0YWNoRXZlbnQpIHtcbiAgICAgICAgICAgIC8vIEZvciBJRSdzIGxhY2sgb2YgRXZlbnQjcHJldmVudERlZmF1bHRcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnc2VsZWN0c3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnNbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uY3VycmVudEFjdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLmNoZWNrQW5kUHJldmVudERlZmF1bHQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBGb3IgSUUncyBiYWQgZGJsY2xpY2sgZXZlbnQgc2VxdWVuY2VcbiAgICAgICAgICAgIGV2ZW50cy5hZGQoZG9jLCAnZGJsY2xpY2snLCBkb09uSW50ZXJhY3Rpb25zKCdpZThEYmxjbGljaycpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmRvY3VtZW50cy5wdXNoKGRvYyk7XG4gICAgfVxuXG4gICAgbGlzdGVuVG9Eb2N1bWVudChzY29wZS5kb2N1bWVudCk7XG5cbiAgICBzY29wZS5pbnRlcmFjdCA9IGludGVyYWN0O1xuICAgIHNjb3BlLkludGVyYWN0YWJsZSA9IEludGVyYWN0YWJsZTtcbiAgICBzY29wZS5JbnRlcmFjdGlvbiA9IEludGVyYWN0aW9uO1xuICAgIHNjb3BlLkludGVyYWN0RXZlbnQgPSBJbnRlcmFjdEV2ZW50O1xuXG4gICAgLyogZ2xvYmFsIGV4cG9ydHM6IHRydWUsIG1vZHVsZSwgZGVmaW5lICovXG5cbiAgICAvLyBodHRwOi8vZG9jdW1lbnRjbG91ZC5naXRodWIuaW8vdW5kZXJzY29yZS9kb2NzL3VuZGVyc2NvcmUuaHRtbCNzZWN0aW9uLTExXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGludGVyYWN0O1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuaW50ZXJhY3QgPSBpbnRlcmFjdDtcbiAgICB9XG4gICAgLy8gQU1EXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZSgnaW50ZXJhY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzY29wZS5yZWFsV2luZG93LmludGVyYWN0ID0gaW50ZXJhY3Q7XG4gICAgfVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2NvcGUgPSByZXF1aXJlKCcuL3Njb3BlJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbmZ1bmN0aW9uIEludGVyYWN0RXZlbnQgKGludGVyYWN0aW9uLCBldmVudCwgYWN0aW9uLCBwaGFzZSwgZWxlbWVudCwgcmVsYXRlZCkge1xuICAgIHZhciBjbGllbnQsXG4gICAgICAgIHBhZ2UsXG4gICAgICAgIHRhcmdldCAgICAgID0gaW50ZXJhY3Rpb24udGFyZ2V0LFxuICAgICAgICBzbmFwU3RhdHVzICA9IGludGVyYWN0aW9uLnNuYXBTdGF0dXMsXG4gICAgICAgIHJlc3RyaWN0U3RhdHVzICA9IGludGVyYWN0aW9uLnJlc3RyaWN0U3RhdHVzLFxuICAgICAgICBwb2ludGVycyAgICA9IGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgICBkZWx0YVNvdXJjZSA9ICh0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMgfHwgc2NvcGUuZGVmYXVsdE9wdGlvbnMpLmRlbHRhU291cmNlLFxuICAgICAgICBzb3VyY2VYICAgICA9IGRlbHRhU291cmNlICsgJ1gnLFxuICAgICAgICBzb3VyY2VZICAgICA9IGRlbHRhU291cmNlICsgJ1knLFxuICAgICAgICBvcHRpb25zICAgICA9IHRhcmdldD8gdGFyZ2V0Lm9wdGlvbnM6IHNjb3BlLmRlZmF1bHRPcHRpb25zLFxuICAgICAgICBvcmlnaW4gICAgICA9IHNjb3BlLmdldE9yaWdpblhZKHRhcmdldCwgZWxlbWVudCksXG4gICAgICAgIHN0YXJ0aW5nICAgID0gcGhhc2UgPT09ICdzdGFydCcsXG4gICAgICAgIGVuZGluZyAgICAgID0gcGhhc2UgPT09ICdlbmQnLFxuICAgICAgICBjb29yZHMgICAgICA9IHN0YXJ0aW5nPyBpbnRlcmFjdGlvbi5zdGFydENvb3JkcyA6IGludGVyYWN0aW9uLmN1ckNvb3JkcztcblxuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IGludGVyYWN0aW9uLmVsZW1lbnQ7XG5cbiAgICBwYWdlICAgPSB1dGlscy5leHRlbmQoe30sIGNvb3Jkcy5wYWdlKTtcbiAgICBjbGllbnQgPSB1dGlscy5leHRlbmQoe30sIGNvb3Jkcy5jbGllbnQpO1xuXG4gICAgcGFnZS54IC09IG9yaWdpbi54O1xuICAgIHBhZ2UueSAtPSBvcmlnaW4ueTtcblxuICAgIGNsaWVudC54IC09IG9yaWdpbi54O1xuICAgIGNsaWVudC55IC09IG9yaWdpbi55O1xuXG4gICAgdmFyIHJlbGF0aXZlUG9pbnRzID0gb3B0aW9uc1thY3Rpb25dLnNuYXAgJiYgb3B0aW9uc1thY3Rpb25dLnNuYXAucmVsYXRpdmVQb2ludHMgO1xuXG4gICAgaWYgKHNjb3BlLmNoZWNrU25hcCh0YXJnZXQsIGFjdGlvbikgJiYgIShzdGFydGluZyAmJiByZWxhdGl2ZVBvaW50cyAmJiByZWxhdGl2ZVBvaW50cy5sZW5ndGgpKSB7XG4gICAgICAgIHRoaXMuc25hcCA9IHtcbiAgICAgICAgICAgIHJhbmdlICA6IHNuYXBTdGF0dXMucmFuZ2UsXG4gICAgICAgICAgICBsb2NrZWQgOiBzbmFwU3RhdHVzLmxvY2tlZCxcbiAgICAgICAgICAgIHggICAgICA6IHNuYXBTdGF0dXMuc25hcHBlZFgsXG4gICAgICAgICAgICB5ICAgICAgOiBzbmFwU3RhdHVzLnNuYXBwZWRZLFxuICAgICAgICAgICAgcmVhbFggIDogc25hcFN0YXR1cy5yZWFsWCxcbiAgICAgICAgICAgIHJlYWxZICA6IHNuYXBTdGF0dXMucmVhbFksXG4gICAgICAgICAgICBkeCAgICAgOiBzbmFwU3RhdHVzLmR4LFxuICAgICAgICAgICAgZHkgICAgIDogc25hcFN0YXR1cy5keVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzbmFwU3RhdHVzLmxvY2tlZCkge1xuICAgICAgICAgICAgcGFnZS54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBwYWdlLnkgKz0gc25hcFN0YXR1cy5keTtcbiAgICAgICAgICAgIGNsaWVudC54ICs9IHNuYXBTdGF0dXMuZHg7XG4gICAgICAgICAgICBjbGllbnQueSArPSBzbmFwU3RhdHVzLmR5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNjb3BlLmNoZWNrUmVzdHJpY3QodGFyZ2V0LCBhY3Rpb24pICYmICEoc3RhcnRpbmcgJiYgb3B0aW9uc1thY3Rpb25dLnJlc3RyaWN0LmVsZW1lbnRSZWN0KSAmJiByZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkKSB7XG4gICAgICAgIHBhZ2UueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgcGFnZS55ICs9IHJlc3RyaWN0U3RhdHVzLmR5O1xuICAgICAgICBjbGllbnQueCArPSByZXN0cmljdFN0YXR1cy5keDtcbiAgICAgICAgY2xpZW50LnkgKz0gcmVzdHJpY3RTdGF0dXMuZHk7XG5cbiAgICAgICAgdGhpcy5yZXN0cmljdCA9IHtcbiAgICAgICAgICAgIGR4OiByZXN0cmljdFN0YXR1cy5keCxcbiAgICAgICAgICAgIGR5OiByZXN0cmljdFN0YXR1cy5keVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMucGFnZVggICAgID0gcGFnZS54O1xuICAgIHRoaXMucGFnZVkgICAgID0gcGFnZS55O1xuICAgIHRoaXMuY2xpZW50WCAgID0gY2xpZW50Lng7XG4gICAgdGhpcy5jbGllbnRZICAgPSBjbGllbnQueTtcblxuICAgIHRoaXMueDAgICAgICAgID0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54IC0gb3JpZ2luLng7XG4gICAgdGhpcy55MCAgICAgICAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueTtcbiAgICB0aGlzLmNsaWVudFgwICA9IGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54IC0gb3JpZ2luLng7XG4gICAgdGhpcy5jbGllbnRZMCAgPSBpbnRlcmFjdGlvbi5zdGFydENvb3Jkcy5jbGllbnQueSAtIG9yaWdpbi55O1xuICAgIHRoaXMuY3RybEtleSAgID0gZXZlbnQuY3RybEtleTtcbiAgICB0aGlzLmFsdEtleSAgICA9IGV2ZW50LmFsdEtleTtcbiAgICB0aGlzLnNoaWZ0S2V5ICA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgIHRoaXMubWV0YUtleSAgID0gZXZlbnQubWV0YUtleTtcbiAgICB0aGlzLmJ1dHRvbiAgICA9IGV2ZW50LmJ1dHRvbjtcbiAgICB0aGlzLnRhcmdldCAgICA9IGVsZW1lbnQ7XG4gICAgdGhpcy50MCAgICAgICAgPSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG4gICAgdGhpcy50eXBlICAgICAgPSBhY3Rpb24gKyAocGhhc2UgfHwgJycpO1xuXG4gICAgdGhpcy5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGFyZ2V0O1xuXG4gICAgdmFyIGluZXJ0aWFTdGF0dXMgPSBpbnRlcmFjdGlvbi5pbmVydGlhU3RhdHVzO1xuXG4gICAgaWYgKGluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuZGV0YWlsID0gJ2luZXJ0aWEnO1xuICAgIH1cblxuICAgIGlmIChyZWxhdGVkKSB7XG4gICAgICAgIHRoaXMucmVsYXRlZFRhcmdldCA9IHJlbGF0ZWQ7XG4gICAgfVxuXG4gICAgLy8gZW5kIGV2ZW50IGR4LCBkeSBpcyBkaWZmZXJlbmNlIGJldHdlZW4gc3RhcnQgYW5kIGVuZCBwb2ludHNcbiAgICBpZiAoZW5kaW5nKSB7XG4gICAgICAgIGlmIChkZWx0YVNvdXJjZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgICAgIHRoaXMuZHggPSBjbGllbnQueCAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLmNsaWVudC54O1xuICAgICAgICAgICAgdGhpcy5keSA9IGNsaWVudC55IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMuY2xpZW50Lnk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gcGFnZS54IC0gaW50ZXJhY3Rpb24uc3RhcnRDb29yZHMucGFnZS54O1xuICAgICAgICAgICAgdGhpcy5keSA9IHBhZ2UueSAtIGludGVyYWN0aW9uLnN0YXJ0Q29vcmRzLnBhZ2UueTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLmR4ID0gMDtcbiAgICAgICAgdGhpcy5keSA9IDA7XG4gICAgfVxuICAgIC8vIGNvcHkgcHJvcGVydGllcyBmcm9tIHByZXZpb3VzbW92ZSBpZiBzdGFydGluZyBpbmVydGlhXG4gICAgZWxzZSBpZiAocGhhc2UgPT09ICdpbmVydGlhc3RhcnQnKSB7XG4gICAgICAgIHRoaXMuZHggPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHg7XG4gICAgICAgIHRoaXMuZHkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZHk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoZGVsdGFTb3VyY2UgPT09ICdjbGllbnQnKSB7XG4gICAgICAgICAgICB0aGlzLmR4ID0gY2xpZW50LnggLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBjbGllbnQueSAtIGludGVyYWN0aW9uLnByZXZFdmVudC5jbGllbnRZO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5keCA9IHBhZ2UueCAtIGludGVyYWN0aW9uLnByZXZFdmVudC5wYWdlWDtcbiAgICAgICAgICAgIHRoaXMuZHkgPSBwYWdlLnkgLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQucGFnZVk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXZFdmVudCAmJiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGV0YWlsID09PSAnaW5lcnRpYSdcbiAgICAgICAgJiYgIWluZXJ0aWFTdGF0dXMuYWN0aXZlXG4gICAgICAgICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhICYmIG9wdGlvbnNbYWN0aW9uXS5pbmVydGlhLnplcm9SZXN1bWVEZWx0YSkge1xuXG4gICAgICAgIGluZXJ0aWFTdGF0dXMucmVzdW1lRHggKz0gdGhpcy5keDtcbiAgICAgICAgaW5lcnRpYVN0YXR1cy5yZXN1bWVEeSArPSB0aGlzLmR5O1xuXG4gICAgICAgIHRoaXMuZHggPSB0aGlzLmR5ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uID09PSAncmVzaXplJyAmJiBpbnRlcmFjdGlvbi5yZXNpemVBeGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR4ID0gdGhpcy5keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZHkgPSB0aGlzLmR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5heGVzID0gJ3h5JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXM7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmR5ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuZHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2dlc3R1cmUnKSB7XG4gICAgICAgIHRoaXMudG91Y2hlcyA9IFtwb2ludGVyc1swXSwgcG9pbnRlcnNbMV1dO1xuXG4gICAgICAgIGlmIChzdGFydGluZykge1xuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZSA9IHV0aWxzLnRvdWNoRGlzdGFuY2UocG9pbnRlcnMsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuYm94ICAgICAgPSB1dGlscy50b3VjaEJCb3gocG9pbnRlcnMpO1xuICAgICAgICAgICAgdGhpcy5zY2FsZSAgICA9IDE7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB1dGlscy50b3VjaEFuZ2xlKHBvaW50ZXJzLCB1bmRlZmluZWQsIGRlbHRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuZGEgICAgICAgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVuZGluZyB8fCBldmVudCBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzdGFuY2UgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuZGlzdGFuY2U7XG4gICAgICAgICAgICB0aGlzLmJveCAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmJveDtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc2NhbGU7XG4gICAgICAgICAgICB0aGlzLmRzICAgICAgID0gdGhpcy5zY2FsZSAtIDE7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmFuZ2xlO1xuICAgICAgICAgICAgdGhpcy5kYSAgICAgICA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnN0YXJ0QW5nbGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpc3RhbmNlID0gdXRpbHMudG91Y2hEaXN0YW5jZShwb2ludGVycywgZGVsdGFTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5ib3ggICAgICA9IHV0aWxzLnRvdWNoQkJveChwb2ludGVycyk7XG4gICAgICAgICAgICB0aGlzLnNjYWxlICAgID0gdGhpcy5kaXN0YW5jZSAvIGludGVyYWN0aW9uLmdlc3R1cmUuc3RhcnREaXN0YW5jZTtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgICAgPSB1dGlscy50b3VjaEFuZ2xlKHBvaW50ZXJzLCBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZSwgZGVsdGFTb3VyY2UpO1xuXG4gICAgICAgICAgICB0aGlzLmRzID0gdGhpcy5zY2FsZSAtIGludGVyYWN0aW9uLmdlc3R1cmUucHJldlNjYWxlO1xuICAgICAgICAgICAgdGhpcy5kYSA9IHRoaXMuYW5nbGUgLSBpbnRlcmFjdGlvbi5nZXN0dXJlLnByZXZBbmdsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydGluZykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLmRvd25UaW1lc1swXTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSAwO1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IDA7XG4gICAgICAgIHRoaXMuc3BlZWQgICAgID0gMDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVggPSAwO1xuICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBoYXNlID09PSAnaW5lcnRpYXN0YXJ0Jykge1xuICAgICAgICB0aGlzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHQgICAgICAgID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LmR0O1xuICAgICAgICB0aGlzLmR1cmF0aW9uICA9IGludGVyYWN0aW9uLnByZXZFdmVudC5kdXJhdGlvbjtcbiAgICAgICAgdGhpcy5zcGVlZCAgICAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQuc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHlYID0gaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVkgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdGhpcy5kdCAgICAgICAgPSB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXA7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gID0gdGhpcy50aW1lU3RhbXAgLSBpbnRlcmFjdGlvbi5kb3duVGltZXNbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCkge1xuICAgICAgICAgICAgdmFyIGR4ID0gdGhpc1tzb3VyY2VYXSAtIGludGVyYWN0aW9uLnByZXZFdmVudFtzb3VyY2VYXSxcbiAgICAgICAgICAgICAgICBkeSA9IHRoaXNbc291cmNlWV0gLSBpbnRlcmFjdGlvbi5wcmV2RXZlbnRbc291cmNlWV0sXG4gICAgICAgICAgICAgICAgZHQgPSB0aGlzLmR0IC8gMTAwMDtcblxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IHV0aWxzLmh5cG90KGR4LCBkeSkgLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlYID0gZHggLyBkdDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlZID0gZHkgLyBkdDtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBub3JtYWwgbW92ZSBvciBlbmQgZXZlbnQsIHVzZSBwcmV2aW91cyB1c2VyIGV2ZW50IGNvb3Jkc1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNwZWVkIGFuZCB2ZWxvY2l0eSBpbiBwaXhlbHMgcGVyIHNlY29uZFxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0uc3BlZWQ7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WCA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udng7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5WSA9IGludGVyYWN0aW9uLnBvaW50ZXJEZWx0YVtkZWx0YVNvdXJjZV0udnk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKGVuZGluZyB8fCBwaGFzZSA9PT0gJ2luZXJ0aWFzdGFydCcpXG4gICAgICAgICYmIGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCA+IDYwMCAmJiB0aGlzLnRpbWVTdGFtcCAtIGludGVyYWN0aW9uLnByZXZFdmVudC50aW1lU3RhbXAgPCAxNTApIHtcblxuICAgICAgICB2YXIgYW5nbGUgPSAxODAgKiBNYXRoLmF0YW4yKGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVksIGludGVyYWN0aW9uLnByZXZFdmVudC52ZWxvY2l0eVgpIC8gTWF0aC5QSSxcbiAgICAgICAgICAgIG92ZXJsYXAgPSAyMi41O1xuXG4gICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICAgIGFuZ2xlICs9IDM2MDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWZ0ID0gMTM1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDIyNSArIG92ZXJsYXAsXG4gICAgICAgICAgICB1cCAgID0gMjI1IC0gb3ZlcmxhcCA8PSBhbmdsZSAmJiBhbmdsZSA8IDMxNSArIG92ZXJsYXAsXG5cbiAgICAgICAgICAgIHJpZ2h0ID0gIWxlZnQgJiYgKDMxNSAtIG92ZXJsYXAgPD0gYW5nbGUgfHwgYW5nbGUgPCAgNDUgKyBvdmVybGFwKSxcbiAgICAgICAgICAgIGRvd24gID0gIXVwICAgJiYgICA0NSAtIG92ZXJsYXAgPD0gYW5nbGUgJiYgYW5nbGUgPCAxMzUgKyBvdmVybGFwO1xuXG4gICAgICAgIHRoaXMuc3dpcGUgPSB7XG4gICAgICAgICAgICB1cCAgIDogdXAsXG4gICAgICAgICAgICBkb3duIDogZG93bixcbiAgICAgICAgICAgIGxlZnQgOiBsZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IHJpZ2h0LFxuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlLFxuICAgICAgICAgICAgc3BlZWQ6IGludGVyYWN0aW9uLnByZXZFdmVudC5zcGVlZCxcbiAgICAgICAgICAgIHZlbG9jaXR5OiB7XG4gICAgICAgICAgICAgICAgeDogaW50ZXJhY3Rpb24ucHJldkV2ZW50LnZlbG9jaXR5WCxcbiAgICAgICAgICAgICAgICB5OiBpbnRlcmFjdGlvbi5wcmV2RXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5JbnRlcmFjdEV2ZW50LnByb3RvdHlwZSA9IHtcbiAgICBwcmV2ZW50RGVmYXVsdDogdXRpbHMuYmxhbmssXG4gICAgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgIH0sXG4gICAgc3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0RXZlbnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzY29wZSA9IHJlcXVpcmUoJy4vc2NvcGUnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBhbmltYXRpb25GcmFtZSA9IHV0aWxzLnJhZjtcbnZhciBJbnRlcmFjdEV2ZW50ID0gcmVxdWlyZSgnLi9JbnRlcmFjdEV2ZW50Jyk7XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9ldmVudHMnKTtcbnZhciBicm93c2VyID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyJyk7XG5cbmZ1bmN0aW9uIEludGVyYWN0aW9uICgpIHtcbiAgICB0aGlzLnRhcmdldCAgICAgICAgICA9IG51bGw7IC8vIGN1cnJlbnQgaW50ZXJhY3RhYmxlIGJlaW5nIGludGVyYWN0ZWQgd2l0aFxuICAgIHRoaXMuZWxlbWVudCAgICAgICAgID0gbnVsbDsgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgICB0aGlzLmRyb3BUYXJnZXQgICAgICA9IG51bGw7IC8vIHRoZSBkcm9wem9uZSBhIGRyYWcgdGFyZ2V0IG1pZ2h0IGJlIGRyb3BwZWQgaW50b1xuICAgIHRoaXMuZHJvcEVsZW1lbnQgICAgID0gbnVsbDsgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcbiAgICB0aGlzLnByZXZEcm9wVGFyZ2V0ICA9IG51bGw7IC8vIHRoZSBkcm9wem9uZSB0aGF0IHdhcyByZWNlbnRseSBkcmFnZ2VkIGF3YXkgZnJvbVxuICAgIHRoaXMucHJldkRyb3BFbGVtZW50ID0gbnVsbDsgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcblxuICAgIHRoaXMucHJlcGFyZWQgICAgICAgID0geyAgICAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgICAgICAgbmFtZSA6IG51bGwsXG4gICAgICAgIGF4aXMgOiBudWxsLFxuICAgICAgICBlZGdlczogbnVsbFxuICAgIH07XG5cbiAgICB0aGlzLm1hdGNoZXMgICAgICAgICA9IFtdOyAgIC8vIGFsbCBzZWxlY3RvcnMgdGhhdCBhcmUgbWF0Y2hlZCBieSB0YXJnZXQgZWxlbWVudFxuICAgIHRoaXMubWF0Y2hFbGVtZW50cyAgID0gW107ICAgLy8gY29ycmVzcG9uZGluZyBlbGVtZW50c1xuXG4gICAgdGhpcy5pbmVydGlhU3RhdHVzID0ge1xuICAgICAgICBhY3RpdmUgICAgICAgOiBmYWxzZSxcbiAgICAgICAgc21vb3RoRW5kICAgIDogZmFsc2UsXG5cbiAgICAgICAgc3RhcnRFdmVudDogbnVsbCxcbiAgICAgICAgdXBDb29yZHM6IHt9LFxuXG4gICAgICAgIHhlOiAwLCB5ZTogMCxcbiAgICAgICAgc3g6IDAsIHN5OiAwLFxuXG4gICAgICAgIHQwOiAwLFxuICAgICAgICB2eDA6IDAsIHZ5czogMCxcbiAgICAgICAgZHVyYXRpb246IDAsXG5cbiAgICAgICAgcmVzdW1lRHg6IDAsXG4gICAgICAgIHJlc3VtZUR5OiAwLFxuXG4gICAgICAgIGxhbWJkYV92MDogMCxcbiAgICAgICAgb25lX3ZlX3YwOiAwLFxuICAgICAgICBpICA6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpKSB7XG4gICAgICAgIHRoaXMuYm91bmRJbmVydGlhRnJhbWUgPSB0aGlzLmluZXJ0aWFGcmFtZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kU21vb3RoRW5kRnJhbWUgPSB0aGlzLnNtb290aEVuZEZyYW1lLmJpbmQodGhpcyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5ib3VuZEluZXJ0aWFGcmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoYXQuaW5lcnRpYUZyYW1lKCk7IH07XG4gICAgICAgIHRoaXMuYm91bmRTbW9vdGhFbmRGcmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoYXQuc21vb3RoRW5kRnJhbWUoKTsgfTtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZURyb3BzID0ge1xuICAgICAgICBkcm9wem9uZXM6IFtdLCAgICAgIC8vIHRoZSBkcm9wem9uZXMgdGhhdCBhcmUgbWVudGlvbmVkIGJlbG93XG4gICAgICAgIGVsZW1lbnRzIDogW10sICAgICAgLy8gZWxlbWVudHMgb2YgZHJvcHpvbmVzIHRoYXQgYWNjZXB0IHRoZSB0YXJnZXQgZHJhZ2dhYmxlXG4gICAgICAgIHJlY3RzICAgIDogW10gICAgICAgLy8gdGhlIHJlY3RzIG9mIHRoZSBlbGVtZW50cyBtZW50aW9uZWQgYWJvdmVcbiAgICB9O1xuXG4gICAgLy8ga2VlcCB0cmFjayBvZiBhZGRlZCBwb2ludGVyc1xuICAgIHRoaXMucG9pbnRlcnMgICAgPSBbXTtcbiAgICB0aGlzLnBvaW50ZXJJZHMgID0gW107XG4gICAgdGhpcy5kb3duVGFyZ2V0cyA9IFtdO1xuICAgIHRoaXMuZG93blRpbWVzICAgPSBbXTtcbiAgICB0aGlzLmhvbGRUaW1lcnMgID0gW107XG5cbiAgICAvLyBQcmV2aW91cyBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgdGhpcy5wcmV2Q29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuICAgIC8vIGN1cnJlbnQgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHRoaXMuY3VyQ29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuXG4gICAgLy8gU3RhcnRpbmcgSW50ZXJhY3RFdmVudCBwb2ludGVyIGNvb3JkaW5hdGVzXG4gICAgdGhpcy5zdGFydENvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgdGltZVN0YW1wOiAwXG4gICAgfTtcblxuICAgIC8vIENoYW5nZSBpbiBjb29yZGluYXRlcyBhbmQgdGltZSBvZiB0aGUgcG9pbnRlclxuICAgIHRoaXMucG9pbnRlckRlbHRhID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwLCBzcGVlZDogMCB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwLCBzcGVlZDogMCB9LFxuICAgICAgICB0aW1lU3RhbXA6IDBcbiAgICB9O1xuXG4gICAgdGhpcy5kb3duRXZlbnQgICA9IG51bGw7ICAgIC8vIHBvaW50ZXJkb3duL21vdXNlZG93bi90b3VjaHN0YXJ0IGV2ZW50XG4gICAgdGhpcy5kb3duUG9pbnRlciA9IHt9O1xuXG4gICAgdGhpcy5fZXZlbnRUYXJnZXQgICAgPSBudWxsO1xuICAgIHRoaXMuX2N1ckV2ZW50VGFyZ2V0ID0gbnVsbDtcblxuICAgIHRoaXMucHJldkV2ZW50ID0gbnVsbDsgICAgICAvLyBwcmV2aW91cyBhY3Rpb24gZXZlbnRcbiAgICB0aGlzLnRhcFRpbWUgICA9IDA7ICAgICAgICAgLy8gdGltZSBvZiB0aGUgbW9zdCByZWNlbnQgdGFwIGV2ZW50XG4gICAgdGhpcy5wcmV2VGFwICAgPSBudWxsO1xuXG4gICAgdGhpcy5zdGFydE9mZnNldCAgICA9IHsgbGVmdDogMCwgcmlnaHQ6IDAsIHRvcDogMCwgYm90dG9tOiAwIH07XG4gICAgdGhpcy5yZXN0cmljdE9mZnNldCA9IHsgbGVmdDogMCwgcmlnaHQ6IDAsIHRvcDogMCwgYm90dG9tOiAwIH07XG4gICAgdGhpcy5zbmFwT2Zmc2V0cyAgICA9IFtdO1xuXG4gICAgdGhpcy5nZXN0dXJlID0ge1xuICAgICAgICBzdGFydDogeyB4OiAwLCB5OiAwIH0sXG5cbiAgICAgICAgc3RhcnREaXN0YW5jZTogMCwgICAvLyBkaXN0YW5jZSBiZXR3ZWVuIHR3byB0b3VjaGVzIG9mIHRvdWNoU3RhcnRcbiAgICAgICAgcHJldkRpc3RhbmNlIDogMCxcbiAgICAgICAgZGlzdGFuY2UgICAgIDogMCxcblxuICAgICAgICBzY2FsZTogMSwgICAgICAgICAgIC8vIGdlc3R1cmUuZGlzdGFuY2UgLyBnZXN0dXJlLnN0YXJ0RGlzdGFuY2VcblxuICAgICAgICBzdGFydEFuZ2xlOiAwLCAgICAgIC8vIGFuZ2xlIG9mIGxpbmUgam9pbmluZyB0d28gdG91Y2hlc1xuICAgICAgICBwcmV2QW5nbGUgOiAwICAgICAgIC8vIGFuZ2xlIG9mIHRoZSBwcmV2aW91cyBnZXN0dXJlIGV2ZW50XG4gICAgfTtcblxuICAgIHRoaXMuc25hcFN0YXR1cyA9IHtcbiAgICAgICAgeCAgICAgICA6IDAsIHkgICAgICAgOiAwLFxuICAgICAgICBkeCAgICAgIDogMCwgZHkgICAgICA6IDAsXG4gICAgICAgIHJlYWxYICAgOiAwLCByZWFsWSAgIDogMCxcbiAgICAgICAgc25hcHBlZFg6IDAsIHNuYXBwZWRZOiAwLFxuICAgICAgICB0YXJnZXRzIDogW10sXG4gICAgICAgIGxvY2tlZCAgOiBmYWxzZSxcbiAgICAgICAgY2hhbmdlZCA6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMucmVzdHJpY3RTdGF0dXMgPSB7XG4gICAgICAgIGR4ICAgICAgICAgOiAwLCBkeSAgICAgICAgIDogMCxcbiAgICAgICAgcmVzdHJpY3RlZFg6IDAsIHJlc3RyaWN0ZWRZOiAwLFxuICAgICAgICBzbmFwICAgICAgIDogbnVsbCxcbiAgICAgICAgcmVzdHJpY3RlZCA6IGZhbHNlLFxuICAgICAgICBjaGFuZ2VkICAgIDogZmFsc2VcbiAgICB9O1xuXG4gICAgdGhpcy5yZXN0cmljdFN0YXR1cy5zbmFwID0gdGhpcy5zbmFwU3RhdHVzO1xuXG4gICAgdGhpcy5wb2ludGVySXNEb3duICAgPSBmYWxzZTtcbiAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlO1xuICAgIHRoaXMuZ2VzdHVyaW5nICAgICAgID0gZmFsc2U7XG4gICAgdGhpcy5kcmFnZ2luZyAgICAgICAgPSBmYWxzZTtcbiAgICB0aGlzLnJlc2l6aW5nICAgICAgICA9IGZhbHNlO1xuICAgIHRoaXMucmVzaXplQXhlcyAgICAgID0gJ3h5JztcblxuICAgIHRoaXMubW91c2UgPSBmYWxzZTtcblxuICAgIHNjb3BlLmludGVyYWN0aW9ucy5wdXNoKHRoaXMpO1xufVxuXG4vLyBDaGVjayBpZiBhY3Rpb24gaXMgZW5hYmxlZCBnbG9iYWxseSBhbmQgdGhlIGN1cnJlbnQgdGFyZ2V0IHN1cHBvcnRzIGl0XG4vLyBJZiBzbywgcmV0dXJuIHRoZSB2YWxpZGF0ZWQgYWN0aW9uLiBPdGhlcndpc2UsIHJldHVybiBudWxsXG5mdW5jdGlvbiB2YWxpZGF0ZUFjdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUpIHtcbiAgICBpZiAoIXNjb3BlLmlzT2JqZWN0KGFjdGlvbikpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgIHZhciBhY3Rpb25OYW1lID0gYWN0aW9uLm5hbWUsXG4gICAgICAgIG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucztcblxuICAgIGlmICgoICAoYWN0aW9uTmFtZSAgPT09ICdyZXNpemUnICAgJiYgb3B0aW9ucy5yZXNpemUuZW5hYmxlZCApXG4gICAgICAgIHx8IChhY3Rpb25OYW1lICAgICAgPT09ICdkcmFnJyAgICAgJiYgb3B0aW9ucy5kcmFnLmVuYWJsZWQgIClcbiAgICAgICAgfHwgKGFjdGlvbk5hbWUgICAgICA9PT0gJ2dlc3R1cmUnICAmJiBvcHRpb25zLmdlc3R1cmUuZW5hYmxlZCkpXG4gICAgICAgICYmIHNjb3BlLmFjdGlvbklzRW5hYmxlZFthY3Rpb25OYW1lXSkge1xuXG4gICAgICAgIGlmIChhY3Rpb25OYW1lID09PSAncmVzaXplJyB8fCBhY3Rpb25OYW1lID09PSAncmVzaXpleXgnKSB7XG4gICAgICAgICAgICBhY3Rpb25OYW1lID0gJ3Jlc2l6ZXh5JztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRBY3Rpb25DdXJzb3IgKGFjdGlvbikge1xuICAgIHZhciBjdXJzb3IgPSAnJztcblxuICAgIGlmIChhY3Rpb24ubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICAgIGN1cnNvciA9ICBzY29wZS5hY3Rpb25DdXJzb3JzLmRyYWc7XG4gICAgfVxuICAgIGlmIChhY3Rpb24ubmFtZSA9PT0gJ3Jlc2l6ZScpIHtcbiAgICAgICAgaWYgKGFjdGlvbi5heGlzKSB7XG4gICAgICAgICAgICBjdXJzb3IgPSAgc2NvcGUuYWN0aW9uQ3Vyc29yc1thY3Rpb24ubmFtZSArIGFjdGlvbi5heGlzXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY3Rpb24uZWRnZXMpIHtcbiAgICAgICAgICAgIHZhciBjdXJzb3JLZXkgPSAncmVzaXplJyxcbiAgICAgICAgICAgICAgICBlZGdlTmFtZXMgPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24uZWRnZXNbZWRnZU5hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3JLZXkgKz0gZWRnZU5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3Vyc29yID0gc2NvcGUuYWN0aW9uQ3Vyc29yc1tjdXJzb3JLZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnNvcjtcbn1cblxuZnVuY3Rpb24gcHJldmVudE9yaWdpbmFsRGVmYXVsdCAoKSB7XG4gICAgdGhpcy5vcmlnaW5hbEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59XG5cbkludGVyYWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICBnZXRQYWdlWFkgIDogZnVuY3Rpb24gKHBvaW50ZXIsIHh5KSB7IHJldHVybiAgIHV0aWxzLmdldFBhZ2VYWShwb2ludGVyLCB4eSwgdGhpcyk7IH0sXG4gICAgZ2V0Q2xpZW50WFk6IGZ1bmN0aW9uIChwb2ludGVyLCB4eSkgeyByZXR1cm4gdXRpbHMuZ2V0Q2xpZW50WFkocG9pbnRlciwgeHksIHRoaXMpOyB9LFxuICAgIHNldEV2ZW50WFkgOiBmdW5jdGlvbiAodGFyZ2V0LCBwdHIpIHsgcmV0dXJuICB1dGlscy5zZXRFdmVudFhZKHRhcmdldCwgcHRyLCB0aGlzKTsgfSxcblxuICAgIHBvaW50ZXJPdmVyOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIGlmICh0aGlzLnByZXBhcmVkLm5hbWUgfHwgIXRoaXMubW91c2UpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIGN1ck1hdGNoZXMgPSBbXSxcbiAgICAgICAgICAgIGN1ck1hdGNoRWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgIHByZXZUYXJnZXRFbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuXG4gICAgICAgIHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKTtcblxuICAgICAgICBpZiAodGhpcy50YXJnZXRcbiAgICAgICAgICAgICYmIChzY29wZS50ZXN0SWdub3JlKHRoaXMudGFyZ2V0LCB0aGlzLmVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgfHwgIXNjb3BlLnRlc3RBbGxvdyh0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50LCBldmVudFRhcmdldCkpKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgZXZlbnRUYXJnZXQgc2hvdWxkIGJlIGlnbm9yZWQgb3Igc2hvdWxkbid0IGJlIGFsbG93ZWRcbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBwcmV2aW91cyB0YXJnZXRcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVsZW1lbnRJbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmdldChldmVudFRhcmdldCksXG4gICAgICAgICAgICBlbGVtZW50QWN0aW9uID0gKGVsZW1lbnRJbnRlcmFjdGFibGVcbiAgICAgICAgICAgICYmICFzY29wZS50ZXN0SWdub3JlKGVsZW1lbnRJbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhlbGVtZW50SW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAmJiB2YWxpZGF0ZUFjdGlvbihcbiAgICAgICAgICAgICAgICBlbGVtZW50SW50ZXJhY3RhYmxlLmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgZXZlbnRUYXJnZXQpLFxuICAgICAgICAgICAgICAgIGVsZW1lbnRJbnRlcmFjdGFibGUpKTtcblxuICAgICAgICBpZiAoZWxlbWVudEFjdGlvbiAmJiAhc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChlbGVtZW50SW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZWxlbWVudEFjdGlvbikpIHtcbiAgICAgICAgICAgIGVsZW1lbnRBY3Rpb24gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHVzaEN1ck1hdGNoZXMgKGludGVyYWN0YWJsZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUubWF0Y2hlc1NlbGVjdG9yKGV2ZW50VGFyZ2V0LCBzZWxlY3RvcikpIHtcblxuICAgICAgICAgICAgICAgIGN1ck1hdGNoZXMucHVzaChpbnRlcmFjdGFibGUpO1xuICAgICAgICAgICAgICAgIGN1ck1hdGNoRWxlbWVudHMucHVzaChldmVudFRhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBlbGVtZW50SW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hFbGVtZW50cyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5mb3JFYWNoU2VsZWN0b3IocHVzaEN1ck1hdGNoZXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0ZVNlbGVjdG9yKHBvaW50ZXIsIGV2ZW50LCBjdXJNYXRjaGVzLCBjdXJNYXRjaEVsZW1lbnRzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IGN1ck1hdGNoZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gY3VyTWF0Y2hFbGVtZW50cztcblxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlckhvdmVyKHBvaW50ZXIsIGV2ZW50LCB0aGlzLm1hdGNoZXMsIHRoaXMubWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLmFkZChldmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuUG9pbnRlckV2ZW50PyBzY29wZS5wRXZlbnRUeXBlcy5tb3ZlIDogJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUubm9kZUNvbnRhaW5zKHByZXZUYXJnZXRFbGVtZW50LCBldmVudFRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb2ludGVySG92ZXIocG9pbnRlciwgZXZlbnQsIHRoaXMubWF0Y2hlcywgdGhpcy5tYXRjaEVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmFkZCh0aGlzLmVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5Qb2ludGVyRXZlbnQ/IHNjb3BlLnBFdmVudFR5cGVzLm1vdmUgOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIENoZWNrIHdoYXQgYWN0aW9uIHdvdWxkIGJlIHBlcmZvcm1lZCBvbiBwb2ludGVyTW92ZSB0YXJnZXQgaWYgYSBtb3VzZVxuICAgIC8vIGJ1dHRvbiB3ZXJlIHByZXNzZWQgYW5kIGNoYW5nZSB0aGUgY3Vyc29yIGFjY29yZGluZ2x5XG4gICAgcG9pbnRlckhvdmVyOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgbWF0Y2hlcywgbWF0Y2hFbGVtZW50cykge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUgJiYgdGhpcy5tb3VzZSkge1xuXG4gICAgICAgICAgICB2YXIgYWN0aW9uO1xuXG4gICAgICAgICAgICAvLyB1cGRhdGUgcG9pbnRlciBjb29yZHMgZm9yIGRlZmF1bHRBY3Rpb25DaGVja2VyIHRvIHVzZVxuICAgICAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuY3VyQ29vcmRzLCBwb2ludGVyKTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSB0aGlzLnZhbGlkYXRlU2VsZWN0b3IocG9pbnRlciwgZXZlbnQsIG1hdGNoZXMsIG1hdGNoRWxlbWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gdmFsaWRhdGVBY3Rpb24odGFyZ2V0LmdldEFjdGlvbih0aGlzLnBvaW50ZXJzWzBdLCBldmVudCwgdGhpcywgdGhpcy5lbGVtZW50KSwgdGhpcy50YXJnZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gZ2V0QWN0aW9uQ3Vyc29yKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucHJlcGFyZWQubmFtZSkge1xuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcG9pbnRlck91dDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5uYW1lKSB7IHJldHVybjsgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0ZW1wb3JhcnkgZXZlbnQgbGlzdGVuZXJzIGZvciBzZWxlY3RvciBJbnRlcmFjdGFibGVzXG4gICAgICAgIGlmICghc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZXZlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgICBldmVudHMucmVtb3ZlKGV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgIHNjb3BlLlBvaW50ZXJFdmVudD8gc2NvcGUucEV2ZW50VHlwZXMubW92ZSA6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgICAgIHNjb3BlLmxpc3RlbmVycy5wb2ludGVySG92ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICYmIHRoaXMudGFyZ2V0Lm9wdGlvbnMuc3R5bGVDdXJzb3IgJiYgIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQuX2RvYy5kb2N1bWVudEVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2VsZWN0b3JEb3duOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXG4gICAgICAgIC8vIGNvcHkgZXZlbnQgdG8gYmUgdXNlZCBpbiB0aW1lb3V0IGZvciBJRThcbiAgICAgICAgICAgIGV2ZW50Q29weSA9IGV2ZW50cy51c2VBdHRhY2hFdmVudD8gdXRpbHMuZXh0ZW5kKHt9LCBldmVudCkgOiBldmVudCxcbiAgICAgICAgICAgIGVsZW1lbnQgPSBldmVudFRhcmdldCxcbiAgICAgICAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKSxcbiAgICAgICAgICAgIGFjdGlvbjtcblxuICAgICAgICB0aGlzLmhvbGRUaW1lcnNbcG9pbnRlckluZGV4XSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC5wb2ludGVySG9sZChldmVudHMudXNlQXR0YWNoRXZlbnQ/IGV2ZW50Q29weSA6IHBvaW50ZXIsIGV2ZW50Q29weSwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KTtcbiAgICAgICAgfSwgc2NvcGUuZGVmYXVsdE9wdGlvbnMuX2hvbGREdXJhdGlvbik7XG5cbiAgICAgICAgdGhpcy5wb2ludGVySXNEb3duID0gdHJ1ZTtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgZG93biBldmVudCBoaXRzIHRoZSBjdXJyZW50IGluZXJ0aWEgdGFyZ2V0XG4gICAgICAgIGlmICh0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlICYmIHRoaXMudGFyZ2V0LnNlbGVjdG9yKSB7XG4gICAgICAgICAgICAvLyBjbGltYiB1cCB0aGUgRE9NIHRyZWUgZnJvbSB0aGUgZXZlbnQgdGFyZ2V0XG4gICAgICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGVsZW1lbnQgaXMgdGhlIGN1cnJlbnQgaW5lcnRpYSB0YXJnZXQgZWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLmVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCB0aGUgcHJvc3BlY3RpdmUgYWN0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBvbmdvaW5nIG9uZVxuICAgICAgICAgICAgICAgICAgICAmJiB2YWxpZGF0ZUFjdGlvbih0aGlzLnRhcmdldC5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIHRoaXMuZWxlbWVudCksIHRoaXMudGFyZ2V0KS5uYW1lID09PSB0aGlzLnByZXBhcmVkLm5hbWUpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIGluZXJ0aWEgc28gdGhhdCB0aGUgbmV4dCBtb3ZlIHdpbGwgYmUgYSBub3JtYWwgb25lXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkZyYW1lLmNhbmNlbCh0aGlzLmluZXJ0aWFTdGF0dXMuaSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90aGluZyBpZiBpbnRlcmFjdGluZ1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnZG93bicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHVzaE1hdGNoZXMgKGludGVyYWN0YWJsZSwgc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgID8gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaW5Db250ZXh0KGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLnRlc3RBbGxvdyhpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvciwgZWxlbWVudHMpKSB7XG5cbiAgICAgICAgICAgICAgICB0aGF0Lm1hdGNoZXMucHVzaChpbnRlcmFjdGFibGUpO1xuICAgICAgICAgICAgICAgIHRoYXQubWF0Y2hFbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHBvaW50ZXIgY29vcmRzIGZvciBkZWZhdWx0QWN0aW9uQ2hlY2tlciB0byB1c2VcbiAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuY3VyQ29vcmRzLCBwb2ludGVyKTtcbiAgICAgICAgdGhpcy5kb3duRXZlbnQgPSBldmVudDtcblxuICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpICYmICFhY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG5cbiAgICAgICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKHB1c2hNYXRjaGVzKTtcblxuICAgICAgICAgICAgYWN0aW9uID0gdGhpcy52YWxpZGF0ZVNlbGVjdG9yKHBvaW50ZXIsIGV2ZW50LCB0aGlzLm1hdGNoZXMsIHRoaXMubWF0Y2hFbGVtZW50cyk7XG4gICAgICAgICAgICBlbGVtZW50ID0gc2NvcGUucGFyZW50RWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSAgPSBhY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuZWRnZXMgPSBhY3Rpb24uZWRnZXM7XG5cbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICdkb3duJyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBvaW50ZXJEb3duKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyB0aGVzZSBub3cgc2luY2UgcG9pbnRlckRvd24gaXNuJ3QgYmVpbmcgY2FsbGVkIGZyb20gaGVyZVxuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB1dGlscy5leHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcik7XG5cbiAgICAgICAgICAgIHV0aWxzLmNvcHlDb29yZHModGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2Rvd24nKTtcbiAgICB9LFxuXG4gICAgLy8gRGV0ZXJtaW5lIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gbmV4dCBwb2ludGVyTW92ZSBhbmQgYWRkIGFwcHJvcHJpYXRlXG4gICAgLy8gc3R5bGUgYW5kIGV2ZW50IExpc3RlbmVyc1xuICAgIHBvaW50ZXJEb3duOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgZm9yY2VBY3Rpb24pIHtcbiAgICAgICAgaWYgKCFmb3JjZUFjdGlvbiAmJiAhdGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZSAmJiB0aGlzLnBvaW50ZXJXYXNNb3ZlZCAmJiB0aGlzLnByZXBhcmVkLm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWU7XG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnQ7XG5cbiAgICAgICAgdmFyIHBvaW50ZXJJbmRleCA9IHRoaXMuYWRkUG9pbnRlcihwb2ludGVyKSxcbiAgICAgICAgICAgIGFjdGlvbjtcblxuICAgICAgICAvLyBJZiBpdCBpcyB0aGUgc2Vjb25kIHRvdWNoIG9mIGEgbXVsdGktdG91Y2ggZ2VzdHVyZSwga2VlcCB0aGUgdGFyZ2V0XG4gICAgICAgIC8vIHRoZSBzYW1lIGlmIGEgdGFyZ2V0IHdhcyBzZXQgYnkgdGhlIGZpcnN0IHRvdWNoXG4gICAgICAgIC8vIE90aGVyd2lzZSwgc2V0IHRoZSB0YXJnZXQgaWYgdGhlcmUgaXMgbm8gYWN0aW9uIHByZXBhcmVkXG4gICAgICAgIGlmICgodGhpcy5wb2ludGVySWRzLmxlbmd0aCA8IDIgJiYgIXRoaXMudGFyZ2V0KSB8fCAhdGhpcy5wcmVwYXJlZC5uYW1lKSB7XG5cbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmdldChjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGN1ckV2ZW50VGFyZ2V0LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBjdXJFdmVudFRhcmdldCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgJiYgKGFjdGlvbiA9IHZhbGlkYXRlQWN0aW9uKGZvcmNlQWN0aW9uIHx8IGludGVyYWN0YWJsZS5nZXRBY3Rpb24ocG9pbnRlciwgZXZlbnQsIHRoaXMsIGN1ckV2ZW50VGFyZ2V0KSwgaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldCkpXG4gICAgICAgICAgICAgICAgJiYgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChpbnRlcmFjdGFibGUsIGN1ckV2ZW50VGFyZ2V0LCBhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBpbnRlcmFjdGFibGU7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gY3VyRXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQsXG4gICAgICAgICAgICBvcHRpb25zID0gdGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zO1xuXG4gICAgICAgIGlmICh0YXJnZXQgJiYgKGZvcmNlQWN0aW9uIHx8ICF0aGlzLnByZXBhcmVkLm5hbWUpKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBhY3Rpb24gfHwgdmFsaWRhdGVBY3Rpb24oZm9yY2VBY3Rpb24gfHwgdGFyZ2V0LmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgY3VyRXZlbnRUYXJnZXQpLCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLnN0YXJ0Q29vcmRzKTtcblxuICAgICAgICAgICAgaWYgKCFhY3Rpb24pIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9IGdldEFjdGlvbkN1cnNvcihhY3Rpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUF4ZXMgPSBhY3Rpb24ubmFtZSA9PT0gJ3Jlc2l6ZSc/IGFjdGlvbi5heGlzIDogbnVsbDtcblxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2dlc3R1cmUnICYmIHRoaXMucG9pbnRlcklkcy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5uYW1lICA9IGFjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5heGlzICA9IGFjdGlvbi5heGlzO1xuICAgICAgICAgICAgdGhpcy5wcmVwYXJlZC5lZGdlcyA9IGFjdGlvbi5lZGdlcztcblxuICAgICAgICAgICAgdGhpcy5zbmFwU3RhdHVzLnNuYXBwZWRYID0gdGhpcy5zbmFwU3RhdHVzLnNuYXBwZWRZID1cbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWRYID0gdGhpcy5yZXN0cmljdFN0YXR1cy5yZXN0cmljdGVkWSA9IE5hTjtcblxuICAgICAgICAgICAgdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdID0gZXZlbnRUYXJnZXQ7XG4gICAgICAgICAgICB1dGlscy5leHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcik7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLnByZXZDb29yZHMpO1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgaW5lcnRpYSBpcyBhY3RpdmUgdHJ5IHRvIHJlc3VtZSBhY3Rpb25cbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbmVydGlhU3RhdHVzLmFjdGl2ZVxuICAgICAgICAgICAgJiYgY3VyRXZlbnRUYXJnZXQgPT09IHRoaXMuZWxlbWVudFxuICAgICAgICAgICAgJiYgdmFsaWRhdGVBY3Rpb24odGFyZ2V0LmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgdGhpcy5lbGVtZW50KSwgdGFyZ2V0KS5uYW1lID09PSB0aGlzLnByZXBhcmVkLm5hbWUpIHtcblxuICAgICAgICAgICAgYW5pbWF0aW9uRnJhbWUuY2FuY2VsKHRoaXMuaW5lcnRpYVN0YXR1cy5pKTtcbiAgICAgICAgICAgIHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50LCB0YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0TW9kaWZpY2F0aW9uczogZnVuY3Rpb24gKGNvb3JkcywgcHJlRW5kKSB7XG4gICAgICAgIHZhciB0YXJnZXQgICAgICAgICA9IHRoaXMudGFyZ2V0LFxuICAgICAgICAgICAgc2hvdWxkTW92ZSAgICAgPSB0cnVlLFxuICAgICAgICAgICAgc2hvdWxkU25hcCAgICAgPSBzY29wZS5jaGVja1NuYXAodGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpICAgICAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uc25hcC5lbmRPbmx5ICAgICB8fCBwcmVFbmQpLFxuICAgICAgICAgICAgc2hvdWxkUmVzdHJpY3QgPSBzY29wZS5jaGVja1Jlc3RyaWN0KHRhcmdldCwgdGhpcy5wcmVwYXJlZC5uYW1lKSAmJiAoIXRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0ucmVzdHJpY3QuZW5kT25seSB8fCBwcmVFbmQpO1xuXG4gICAgICAgIGlmIChzaG91bGRTbmFwICAgICkgeyB0aGlzLnNldFNuYXBwaW5nICAgKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMuc25hcFN0YXR1cyAgICAubG9ja2VkICAgICA9IGZhbHNlOyB9XG4gICAgICAgIGlmIChzaG91bGRSZXN0cmljdCkgeyB0aGlzLnNldFJlc3RyaWN0aW9uKGNvb3Jkcyk7IH0gZWxzZSB7IHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCA9IGZhbHNlOyB9XG5cbiAgICAgICAgaWYgKHNob3VsZFNuYXAgJiYgdGhpcy5zbmFwU3RhdHVzLmxvY2tlZCAmJiAhdGhpcy5zbmFwU3RhdHVzLmNoYW5nZWQpIHtcbiAgICAgICAgICAgIHNob3VsZE1vdmUgPSBzaG91bGRSZXN0cmljdCAmJiB0aGlzLnJlc3RyaWN0U3RhdHVzLnJlc3RyaWN0ZWQgJiYgdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNob3VsZFJlc3RyaWN0ICYmIHRoaXMucmVzdHJpY3RTdGF0dXMucmVzdHJpY3RlZCAmJiAhdGhpcy5yZXN0cmljdFN0YXR1cy5jaGFuZ2VkKSB7XG4gICAgICAgICAgICBzaG91bGRNb3ZlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hvdWxkTW92ZTtcbiAgICB9LFxuXG4gICAgc2V0U3RhcnRPZmZzZXRzOiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KSxcbiAgICAgICAgICAgIG9yaWdpbiA9IHNjb3BlLmdldE9yaWdpblhZKGludGVyYWN0YWJsZSwgZWxlbWVudCksXG4gICAgICAgICAgICBzbmFwID0gaW50ZXJhY3RhYmxlLm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5zbmFwLFxuICAgICAgICAgICAgcmVzdHJpY3QgPSBpbnRlcmFjdGFibGUub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnJlc3RyaWN0LFxuICAgICAgICAgICAgd2lkdGgsIGhlaWdodDtcblxuICAgICAgICBpZiAocmVjdCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydE9mZnNldC5sZWZ0ID0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnggLSByZWN0LmxlZnQ7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueSAtIHJlY3QudG9wO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICA9IHJlY3QucmlnaHQgIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLng7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0T2Zmc2V0LmJvdHRvbSA9IHJlY3QuYm90dG9tIC0gdGhpcy5zdGFydENvb3Jkcy5wYWdlLnk7XG5cbiAgICAgICAgICAgIGlmICgnd2lkdGgnIGluIHJlY3QpIHsgd2lkdGggPSByZWN0LndpZHRoOyB9XG4gICAgICAgICAgICBlbHNlIHsgd2lkdGggPSByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0OyB9XG4gICAgICAgICAgICBpZiAoJ2hlaWdodCcgaW4gcmVjdCkgeyBoZWlnaHQgPSByZWN0LmhlaWdodDsgfVxuICAgICAgICAgICAgZWxzZSB7IGhlaWdodCA9IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7IH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRPZmZzZXQubGVmdCA9IHRoaXMuc3RhcnRPZmZzZXQudG9wID0gdGhpcy5zdGFydE9mZnNldC5yaWdodCA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc25hcE9mZnNldHMuc3BsaWNlKDApO1xuXG4gICAgICAgIHZhciBzbmFwT2Zmc2V0ID0gc25hcCAmJiBzbmFwLm9mZnNldCA9PT0gJ3N0YXJ0Q29vcmRzJ1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICB4OiB0aGlzLnN0YXJ0Q29vcmRzLnBhZ2UueCAtIG9yaWdpbi54LFxuICAgICAgICAgICAgeTogdGhpcy5zdGFydENvb3Jkcy5wYWdlLnkgLSBvcmlnaW4ueVxuICAgICAgICB9XG4gICAgICAgICAgICA6IHNuYXAgJiYgc25hcC5vZmZzZXQgfHwgeyB4OiAwLCB5OiAwIH07XG5cbiAgICAgICAgaWYgKHJlY3QgJiYgc25hcCAmJiBzbmFwLnJlbGF0aXZlUG9pbnRzICYmIHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNuYXAucmVsYXRpdmVQb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBPZmZzZXRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogc25hcC5yZWxhdGl2ZVBvaW50c1tpXS54KSArIHNuYXBPZmZzZXQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogdGhpcy5zdGFydE9mZnNldC50b3AgIC0gKGhlaWdodCAqIHNuYXAucmVsYXRpdmVQb2ludHNbaV0ueSkgKyBzbmFwT2Zmc2V0LnlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc25hcE9mZnNldHMucHVzaChzbmFwT2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWN0ICYmIHJlc3RyaWN0LmVsZW1lbnRSZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnN0YXJ0T2Zmc2V0LmxlZnQgLSAod2lkdGggICogcmVzdHJpY3QuZWxlbWVudFJlY3QubGVmdCk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnRvcCAgLSAoaGVpZ2h0ICogcmVzdHJpY3QuZWxlbWVudFJlY3QudG9wKTtcblxuICAgICAgICAgICAgdGhpcy5yZXN0cmljdE9mZnNldC5yaWdodCAgPSB0aGlzLnN0YXJ0T2Zmc2V0LnJpZ2h0ICAtICh3aWR0aCAgKiAoMSAtIHJlc3RyaWN0LmVsZW1lbnRSZWN0LnJpZ2h0KSk7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IHRoaXMuc3RhcnRPZmZzZXQuYm90dG9tIC0gKGhlaWdodCAqICgxIC0gcmVzdHJpY3QuZWxlbWVudFJlY3QuYm90dG9tKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc3RyaWN0T2Zmc2V0LmxlZnQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnRvcCA9IHRoaXMucmVzdHJpY3RPZmZzZXQucmlnaHQgPSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSA9IDA7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLypcXFxuICAgICAqIEludGVyYWN0aW9uLnN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgICAqIGFjdGlvbiBtdXN0IGJlIGVuYWJsZWQgZm9yIHRoZSB0YXJnZXQgSW50ZXJhY3RhYmxlIGFuZCBhbiBhcHByb3ByaWF0ZSBudW1iZXJcbiAgICAgKiBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biDigJMgMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAgICpcbiAgICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAgICpcbiAgICAgLSBhY3Rpb24gICAgICAgKG9iamVjdCkgIFRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIC0gZHJhZywgcmVzaXplLCBldGMuXG4gICAgIC0gaW50ZXJhY3RhYmxlIChJbnRlcmFjdGFibGUpIFRoZSBJbnRlcmFjdGFibGUgdG8gdGFyZ2V0XG4gICAgIC0gZWxlbWVudCAgICAgIChFbGVtZW50KSBUaGUgRE9NIEVsZW1lbnQgdG8gdGFyZ2V0XG4gICAgID0gKG9iamVjdCkgaW50ZXJhY3RcbiAgICAgKipcbiAgICAgfCBpbnRlcmFjdCh0YXJnZXQpXG4gICAgIHwgICAuZHJhZ2dhYmxlKHtcbiAgICAgfCAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICAgfCAgICAgbWFudWFsU3RhcnQ6IHRydWVcbiAgICAgfCAgIH0pXG4gICAgIHwgICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAgIHwgICAub24oJ2hvbGQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgfCAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb247XG4gICAgIHxcbiAgICAgfCAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAgIHwgICAgICAgaW50ZXJhY3Rpb24uc3RhcnQoeyBuYW1lOiAnZHJhZycgfSxcbiAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgIHwgICAgIH1cbiAgICAgfCB9KTtcbiAgICAgXFwqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgfHwgIXRoaXMucG9pbnRlcklzRG93blxuICAgICAgICAgICAgfHwgdGhpcy5wb2ludGVySWRzLmxlbmd0aCA8IChhY3Rpb24ubmFtZSA9PT0gJ2dlc3R1cmUnPyAyIDogMSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoaXMgaW50ZXJhY3Rpb24gaGFkIGJlZW4gcmVtb3ZlZCBhZnRlciBzdG9wcGluZ1xuICAgICAgICAvLyBhZGQgaXQgYmFja1xuICAgICAgICBpZiAoc2NvcGUuaW5kZXhPZihzY29wZS5pbnRlcmFjdGlvbnMsIHRoaXMpID09PSAtMSkge1xuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLnB1c2godGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgID0gYWN0aW9uLm5hbWU7XG4gICAgICAgIHRoaXMucHJlcGFyZWQuYXhpcyAgPSBhY3Rpb24uYXhpcztcbiAgICAgICAgdGhpcy5wcmVwYXJlZC5lZGdlcyA9IGFjdGlvbi5lZGdlcztcbiAgICAgICAgdGhpcy50YXJnZXQgICAgICAgICA9IGludGVyYWN0YWJsZTtcbiAgICAgICAgdGhpcy5lbGVtZW50ICAgICAgICA9IGVsZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5zZXRFdmVudFhZKHRoaXMuc3RhcnRDb29yZHMpO1xuICAgICAgICB0aGlzLnNldFN0YXJ0T2Zmc2V0cyhhY3Rpb24ubmFtZSwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KTtcbiAgICAgICAgdGhpcy5zZXRNb2RpZmljYXRpb25zKHRoaXMuc3RhcnRDb29yZHMucGFnZSk7XG5cbiAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSB0aGlzW3RoaXMucHJlcGFyZWQubmFtZSArICdTdGFydCddKHRoaXMuZG93bkV2ZW50KTtcbiAgICB9LFxuXG4gICAgcG9pbnRlck1vdmU6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBwcmVFbmQpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRQb2ludGVyKHBvaW50ZXIpO1xuXG4gICAgICAgIHRoaXMuc2V0RXZlbnRYWSh0aGlzLmN1ckNvb3JkcywgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50KVxuICAgICAgICAgICAgPyB0aGlzLmluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudFxuICAgICAgICAgICAgOiB1bmRlZmluZWQpO1xuXG4gICAgICAgIHZhciBkdXBsaWNhdGVNb3ZlID0gKHRoaXMuY3VyQ29vcmRzLnBhZ2UueCA9PT0gdGhpcy5wcmV2Q29vcmRzLnBhZ2UueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5wYWdlLnkgPT09IHRoaXMucHJldkNvb3Jkcy5wYWdlLnlcbiAgICAgICAgJiYgdGhpcy5jdXJDb29yZHMuY2xpZW50LnggPT09IHRoaXMucHJldkNvb3Jkcy5jbGllbnQueFxuICAgICAgICAmJiB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueSA9PT0gdGhpcy5wcmV2Q29vcmRzLmNsaWVudC55KTtcblxuICAgICAgICB2YXIgZHgsIGR5LFxuICAgICAgICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIG1vdmVtZW50IGdyZWF0ZXIgdGhhbiBwb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgICAgICAgZHggPSB0aGlzLmN1ckNvb3Jkcy5jbGllbnQueCAtIHRoaXMuc3RhcnRDb29yZHMuY2xpZW50Lng7XG4gICAgICAgICAgICBkeSA9IHRoaXMuY3VyQ29vcmRzLmNsaWVudC55IC0gdGhpcy5zdGFydENvb3Jkcy5jbGllbnQueTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gc2NvcGUucG9pbnRlck1vdmVUb2xlcmFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWR1cGxpY2F0ZU1vdmUgJiYgKCF0aGlzLnBvaW50ZXJJc0Rvd24gfHwgdGhpcy5wb2ludGVyV2FzTW92ZWQpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVySXNEb3duKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ21vdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5wb2ludGVySXNEb3duKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmIChkdXBsaWNhdGVNb3ZlICYmIHRoaXMucG9pbnRlcldhc01vdmVkICYmICFwcmVFbmQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgcG9pbnRlciBjb29yZGluYXRlLCB0aW1lIGNoYW5nZXMgYW5kIHNwZWVkc1xuICAgICAgICB1dGlscy5zZXRFdmVudERlbHRhcyh0aGlzLnBvaW50ZXJEZWx0YSwgdGhpcy5wcmV2Q29vcmRzLCB0aGlzLmN1ckNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByZXBhcmVkLm5hbWUpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkXG4gICAgICAgICAgICAgICAgLy8gaWdub3JlIG1vdmVtZW50IHdoaWxlIGluZXJ0aWEgaXMgYWN0aXZlXG4gICAgICAgICAgICAmJiAoIXRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUgfHwgKHBvaW50ZXIgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50ICYmIC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkpKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIGp1c3Qgc3RhcnRpbmcgYW4gYWN0aW9uLCBjYWxjdWxhdGUgdGhlIHBvaW50ZXIgc3BlZWQgbm93XG4gICAgICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNldEV2ZW50RGVsdGFzKHRoaXMucG9pbnRlckRlbHRhLCB0aGlzLnByZXZDb29yZHMsIHRoaXMuY3VyQ29vcmRzKTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGEgZHJhZyBpcyBpbiB0aGUgY29ycmVjdCBheGlzXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJlcGFyZWQubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhYnNYID0gTWF0aC5hYnMoZHgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWJzWSA9IE1hdGguYWJzKGR5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEF4aXMgPSB0aGlzLnRhcmdldC5vcHRpb25zLmRyYWcuYXhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXMgPSAoYWJzWCA+IGFic1kgPyAneCcgOiBhYnNYIDwgYWJzWSA/ICd5JyA6ICd4eScpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBtb3ZlbWVudCBpc24ndCBpbiB0aGUgYXhpcyBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgICAgIGlmIChheGlzICE9PSAneHknICYmIHRhcmdldEF4aXMgIT09ICd4eScgJiYgdGFyZ2V0QXhpcyAhPT0gYXhpcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuY2VsIHRoZSBwcmVwYXJlZCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRvIGdldCBhIGRyYWcgZnJvbSBhbm90aGVyIGluZXJhY3RhYmxlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGVsZW1lbnQgaW50ZXJhY3RhYmxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHV0aWxzLmlzRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50SW50ZXJhY3RhYmxlID0gc2NvcGUuaW50ZXJhY3RhYmxlcy5nZXQoZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudEludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBlbGVtZW50SW50ZXJhY3RhYmxlICE9PSB0aGlzLnRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhZWxlbWVudEludGVyYWN0YWJsZS5vcHRpb25zLmRyYWcubWFudWFsU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgZWxlbWVudEludGVyYWN0YWJsZS5nZXRBY3Rpb24odGhpcy5kb3duUG9pbnRlciwgdGhpcy5kb3duRXZlbnQsIHRoaXMsIGVsZW1lbnQpLm5hbWUgPT09ICdkcmFnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5jaGVja0F4aXMoYXhpcywgZWxlbWVudEludGVyYWN0YWJsZSkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gZWxlbWVudEludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlJ3Mgbm8gZHJhZyBmcm9tIGVsZW1lbnQgaW50ZXJhY3RhYmxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBzZWxlY3RvciBpbnRlcmFjdGFibGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucHJlcGFyZWQubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzSW50ZXJhY3Rpb24gPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdldERyYWdnYWJsZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHNjb3BlLmllOE1hdGNoZXNTZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3RhYmxlID09PSB0aGlzSW50ZXJhY3Rpb24udGFyZ2V0KSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5pbkNvbnRleHQoaW50ZXJhY3RhYmxlLCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFpbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhc2NvcGUudGVzdElnbm9yZShpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUudGVzdEFsbG93KGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIGVsZW1lbnRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgaW50ZXJhY3RhYmxlLmdldEFjdGlvbih0aGlzSW50ZXJhY3Rpb24uZG93blBvaW50ZXIsIHRoaXNJbnRlcmFjdGlvbi5kb3duRXZlbnQsIHRoaXNJbnRlcmFjdGlvbiwgZWxlbWVudCkubmFtZSA9PT0gJ2RyYWcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBzY29wZS5jaGVja0F4aXMoYXhpcywgaW50ZXJhY3RhYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2NvcGUud2l0aGluSW50ZXJhY3Rpb25MaW1pdChpbnRlcmFjdGFibGUsIGVsZW1lbnQsICdkcmFnJykpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZXZlbnRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodXRpbHMuaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RvckludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaFNlbGVjdG9yKGdldERyYWdnYWJsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9ySW50ZXJhY3RhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSAnZHJhZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IHNlbGVjdG9ySW50ZXJhY3RhYmxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHNjb3BlLnBhcmVudEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3RhcnRpbmcgPSAhIXRoaXMucHJlcGFyZWQubmFtZSAmJiAhdGhpcy5pbnRlcmFjdGluZygpO1xuXG4gICAgICAgICAgICBpZiAoc3RhcnRpbmdcbiAgICAgICAgICAgICAgICAmJiAodGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgfHwgIXNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQodGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCwgdGhpcy5wcmVwYXJlZCkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5uYW1lICYmIHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQodGhpcy5wcmVwYXJlZCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNob3VsZE1vdmUgPSB0aGlzLnNldE1vZGlmaWNhdGlvbnModGhpcy5jdXJDb29yZHMucGFnZSwgcHJlRW5kKTtcblxuICAgICAgICAgICAgICAgIC8vIG1vdmUgaWYgc25hcHBpbmcgb3IgcmVzdHJpY3Rpb24gZG9lc24ndCBwcmV2ZW50IGl0XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZE1vdmUgfHwgc3RhcnRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2RXZlbnQgPSB0aGlzW3RoaXMucHJlcGFyZWQubmFtZSArICdNb3ZlJ10oZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGhpcy50YXJnZXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1dGlscy5jb3B5Q29vcmRzKHRoaXMucHJldkNvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuXG4gICAgICAgIGlmICh0aGlzLmRyYWdnaW5nIHx8IHRoaXMucmVzaXppbmcpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Njcm9sbE1vdmUocG9pbnRlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHJhZ1N0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGRyYWdFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZHJhZycsICdzdGFydCcsIHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMudGFyZ2V0LmZpcmUoZHJhZ0V2ZW50KTtcblxuICAgICAgICAvLyByZXNldCBhY3RpdmUgZHJvcHpvbmVzXG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHMgID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgID0gW107XG5cbiAgICAgICAgaWYgKCF0aGlzLmR5bmFtaWNEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLnNldEFjdGl2ZURyb3BzKHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHRoaXMuZ2V0RHJvcEV2ZW50cyhldmVudCwgZHJhZ0V2ZW50KTtcblxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5hY3RpdmF0ZSkge1xuICAgICAgICAgICAgdGhpcy5maXJlQWN0aXZlRHJvcHMoZHJvcEV2ZW50cy5hY3RpdmF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJhZ0V2ZW50O1xuICAgIH0sXG5cbiAgICBkcmFnTW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIGRyYWdFdmVudCAgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ2RyYWcnLCAnbW92ZScsIHRoaXMuZWxlbWVudCksXG4gICAgICAgICAgICBkcmFnZ2FibGVFbGVtZW50ID0gdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgZHJvcCA9IHRoaXMuZ2V0RHJvcChldmVudCwgZHJhZ2dhYmxlRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5kcm9wVGFyZ2V0ID0gZHJvcC5kcm9wem9uZTtcbiAgICAgICAgdGhpcy5kcm9wRWxlbWVudCA9IGRyb3AuZWxlbWVudDtcblxuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHRoaXMuZ2V0RHJvcEV2ZW50cyhldmVudCwgZHJhZ0V2ZW50KTtcblxuICAgICAgICB0YXJnZXQuZmlyZShkcmFnRXZlbnQpO1xuXG4gICAgICAgIGlmIChkcm9wRXZlbnRzLmxlYXZlKSB7IHRoaXMucHJldkRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmxlYXZlKTsgfVxuICAgICAgICBpZiAoZHJvcEV2ZW50cy5lbnRlcikgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5lbnRlcik7IH1cbiAgICAgICAgaWYgKGRyb3BFdmVudHMubW92ZSApIHsgICAgIHRoaXMuZHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMubW92ZSApOyB9XG5cbiAgICAgICAgdGhpcy5wcmV2RHJvcFRhcmdldCAgPSB0aGlzLmRyb3BUYXJnZXQ7XG4gICAgICAgIHRoaXMucHJldkRyb3BFbGVtZW50ID0gdGhpcy5kcm9wRWxlbWVudDtcblxuICAgICAgICByZXR1cm4gZHJhZ0V2ZW50O1xuICAgIH0sXG5cbiAgICByZXNpemVTdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciByZXNpemVFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAncmVzaXplJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICBpZiAodGhpcy5wcmVwYXJlZC5lZGdlcykge1xuICAgICAgICAgICAgdmFyIHN0YXJ0UmVjdCA9IHRoaXMudGFyZ2V0LmdldFJlY3QodGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Lm9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgICAgICAgICAgICAgIHZhciBzcXVhcmVFZGdlcyA9IHV0aWxzLmV4dGVuZCh7fSwgdGhpcy5wcmVwYXJlZC5lZGdlcyk7XG5cbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy50b3AgICAgPSBzcXVhcmVFZGdlcy50b3AgICAgfHwgKHNxdWFyZUVkZ2VzLmxlZnQgICAmJiAhc3F1YXJlRWRnZXMuYm90dG9tKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5sZWZ0ICAgPSBzcXVhcmVFZGdlcy5sZWZ0ICAgfHwgKHNxdWFyZUVkZ2VzLnRvcCAgICAmJiAhc3F1YXJlRWRnZXMucmlnaHQgKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5ib3R0b20gPSBzcXVhcmVFZGdlcy5ib3R0b20gfHwgKHNxdWFyZUVkZ2VzLnJpZ2h0ICAmJiAhc3F1YXJlRWRnZXMudG9wICAgKTtcbiAgICAgICAgICAgICAgICBzcXVhcmVFZGdlcy5yaWdodCAgPSBzcXVhcmVFZGdlcy5yaWdodCAgfHwgKHNxdWFyZUVkZ2VzLmJvdHRvbSAmJiAhc3F1YXJlRWRnZXMubGVmdCAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZWQuX3NxdWFyZUVkZ2VzID0gc3F1YXJlRWRnZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVkLl9zcXVhcmVFZGdlcyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucmVzaXplUmVjdHMgPSB7XG4gICAgICAgICAgICAgICAgc3RhcnQgICAgIDogc3RhcnRSZWN0LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQgICA6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgICAgICAgICAgICAgIGRlbHRhICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMCwgcmlnaHQgOiAwLCB3aWR0aCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvcCA6IDAsIGJvdHRvbTogMCwgaGVpZ2h0OiAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmVzaXplRXZlbnQucmVjdCA9IHRoaXMucmVzaXplUmVjdHMucmVzdHJpY3RlZDtcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmRlbHRhUmVjdCA9IHRoaXMucmVzaXplUmVjdHMuZGVsdGE7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKHJlc2l6ZUV2ZW50KTtcblxuICAgICAgICB0aGlzLnJlc2l6aW5nID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gcmVzaXplRXZlbnQ7XG4gICAgfSxcblxuICAgIHJlc2l6ZU1vdmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcmVzaXplRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ3Jlc2l6ZScsICdtb3ZlJywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICB2YXIgZWRnZXMgPSB0aGlzLnByZXBhcmVkLmVkZ2VzLFxuICAgICAgICAgICAgaW52ZXJ0ID0gdGhpcy50YXJnZXQub3B0aW9ucy5yZXNpemUuaW52ZXJ0LFxuICAgICAgICAgICAgaW52ZXJ0aWJsZSA9IGludmVydCA9PT0gJ3JlcG9zaXRpb24nIHx8IGludmVydCA9PT0gJ25lZ2F0ZSc7XG5cbiAgICAgICAgaWYgKGVkZ2VzKSB7XG4gICAgICAgICAgICB2YXIgZHggPSByZXNpemVFdmVudC5keCxcbiAgICAgICAgICAgICAgICBkeSA9IHJlc2l6ZUV2ZW50LmR5LFxuXG4gICAgICAgICAgICAgICAgc3RhcnQgICAgICA9IHRoaXMucmVzaXplUmVjdHMuc3RhcnQsXG4gICAgICAgICAgICAgICAgY3VycmVudCAgICA9IHRoaXMucmVzaXplUmVjdHMuY3VycmVudCxcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkID0gdGhpcy5yZXNpemVSZWN0cy5yZXN0cmljdGVkLFxuICAgICAgICAgICAgICAgIGRlbHRhICAgICAgPSB0aGlzLnJlc2l6ZVJlY3RzLmRlbHRhLFxuICAgICAgICAgICAgICAgIHByZXZpb3VzICAgPSB1dGlscy5leHRlbmQodGhpcy5yZXNpemVSZWN0cy5wcmV2aW91cywgcmVzdHJpY3RlZCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldC5vcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxFZGdlcyA9IGVkZ2VzO1xuXG4gICAgICAgICAgICAgICAgZWRnZXMgPSB0aGlzLnByZXBhcmVkLl9zcXVhcmVFZGdlcztcblxuICAgICAgICAgICAgICAgIGlmICgob3JpZ2luYWxFZGdlcy5sZWZ0ICYmIG9yaWdpbmFsRWRnZXMuYm90dG9tKVxuICAgICAgICAgICAgICAgICAgICB8fCAob3JpZ2luYWxFZGdlcy5yaWdodCAmJiBvcmlnaW5hbEVkZ2VzLnRvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSAtZHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMubGVmdCB8fCBvcmlnaW5hbEVkZ2VzLnJpZ2h0KSB7IGR5ID0gZHg7IH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLnRvcCB8fCBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgeyBkeCA9IGR5OyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgJ2N1cnJlbnQnIHJlY3Qgd2l0aG91dCBtb2RpZmljYXRpb25zXG4gICAgICAgICAgICBpZiAoZWRnZXMudG9wICAgKSB7IGN1cnJlbnQudG9wICAgICs9IGR5OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMuYm90dG9tKSB7IGN1cnJlbnQuYm90dG9tICs9IGR5OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMubGVmdCAgKSB7IGN1cnJlbnQubGVmdCAgICs9IGR4OyB9XG4gICAgICAgICAgICBpZiAoZWRnZXMucmlnaHQgKSB7IGN1cnJlbnQucmlnaHQgICs9IGR4OyB9XG5cbiAgICAgICAgICAgIGlmIChpbnZlcnRpYmxlKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgaW52ZXJ0aWJsZSwgY29weSB0aGUgY3VycmVudCByZWN0XG4gICAgICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKHJlc3RyaWN0ZWQsIGN1cnJlbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGludmVydCA9PT0gJ3JlcG9zaXRpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN3YXAgZWRnZSB2YWx1ZXMgaWYgbmVjZXNzYXJ5IHRvIGtlZXAgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlXG4gICAgICAgICAgICAgICAgICAgIHZhciBzd2FwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN0cmljdGVkLnRvcCA+IHJlc3RyaWN0ZWQuYm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2FwID0gcmVzdHJpY3RlZC50b3A7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQudG9wID0gcmVzdHJpY3RlZC5ib3R0b207XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0cmljdGVkLmJvdHRvbSA9IHN3YXA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3RyaWN0ZWQubGVmdCA+IHJlc3RyaWN0ZWQucmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXAgPSByZXN0cmljdGVkLmxlZnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQubGVmdCA9IHJlc3RyaWN0ZWQucmlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0cmljdGVkLnJpZ2h0ID0gc3dhcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vdCBpbnZlcnRpYmxlLCByZXN0cmljdCB0byBtaW5pbXVtIG9mIDB4MCByZWN0XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC50b3AgICAgPSBNYXRoLm1pbihjdXJyZW50LnRvcCwgc3RhcnQuYm90dG9tKTtcbiAgICAgICAgICAgICAgICByZXN0cmljdGVkLmJvdHRvbSA9IE1hdGgubWF4KGN1cnJlbnQuYm90dG9tLCBzdGFydC50b3ApO1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0ZWQubGVmdCAgID0gTWF0aC5taW4oY3VycmVudC5sZWZ0LCBzdGFydC5yaWdodCk7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3RlZC5yaWdodCAgPSBNYXRoLm1heChjdXJyZW50LnJpZ2h0LCBzdGFydC5sZWZ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdHJpY3RlZC53aWR0aCAgPSByZXN0cmljdGVkLnJpZ2h0ICAtIHJlc3RyaWN0ZWQubGVmdDtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWQuaGVpZ2h0ID0gcmVzdHJpY3RlZC5ib3R0b20gLSByZXN0cmljdGVkLnRvcCA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGVkZ2UgaW4gcmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgIGRlbHRhW2VkZ2VdID0gcmVzdHJpY3RlZFtlZGdlXSAtIHByZXZpb3VzW2VkZ2VdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNpemVFdmVudC5lZGdlcyA9IHRoaXMucHJlcGFyZWQuZWRnZXM7XG4gICAgICAgICAgICByZXNpemVFdmVudC5yZWN0ID0gcmVzdHJpY3RlZDtcbiAgICAgICAgICAgIHJlc2l6ZUV2ZW50LmRlbHRhUmVjdCA9IGRlbHRhO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShyZXNpemVFdmVudCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc2l6ZUV2ZW50O1xuICAgIH0sXG5cbiAgICBnZXN0dXJlU3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ3N0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICBnZXN0dXJlRXZlbnQuZHMgPSAwO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyZS5zdGFydERpc3RhbmNlID0gdGhpcy5nZXN0dXJlLnByZXZEaXN0YW5jZSA9IGdlc3R1cmVFdmVudC5kaXN0YW5jZTtcbiAgICAgICAgdGhpcy5nZXN0dXJlLnN0YXJ0QW5nbGUgPSB0aGlzLmdlc3R1cmUucHJldkFuZ2xlID0gZ2VzdHVyZUV2ZW50LmFuZ2xlO1xuICAgICAgICB0aGlzLmdlc3R1cmUuc2NhbGUgPSAxO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyaW5nID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnRhcmdldC5maXJlKGdlc3R1cmVFdmVudCk7XG5cbiAgICAgICAgcmV0dXJuIGdlc3R1cmVFdmVudDtcbiAgICB9LFxuXG4gICAgZ2VzdHVyZU1vdmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoIXRoaXMucG9pbnRlcklkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZFdmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnZXN0dXJlRXZlbnQ7XG5cbiAgICAgICAgZ2VzdHVyZUV2ZW50ID0gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsICdnZXN0dXJlJywgJ21vdmUnLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICBnZXN0dXJlRXZlbnQuZHMgPSBnZXN0dXJlRXZlbnQuc2NhbGUgLSB0aGlzLmdlc3R1cmUuc2NhbGU7XG5cbiAgICAgICAgdGhpcy50YXJnZXQuZmlyZShnZXN0dXJlRXZlbnQpO1xuXG4gICAgICAgIHRoaXMuZ2VzdHVyZS5wcmV2QW5nbGUgPSBnZXN0dXJlRXZlbnQuYW5nbGU7XG4gICAgICAgIHRoaXMuZ2VzdHVyZS5wcmV2RGlzdGFuY2UgPSBnZXN0dXJlRXZlbnQuZGlzdGFuY2U7XG5cbiAgICAgICAgaWYgKGdlc3R1cmVFdmVudC5zY2FsZSAhPT0gSW5maW5pdHkgJiZcbiAgICAgICAgICAgIGdlc3R1cmVFdmVudC5zY2FsZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgZ2VzdHVyZUV2ZW50LnNjYWxlICE9PSB1bmRlZmluZWQgICYmXG4gICAgICAgICAgICAhaXNOYU4oZ2VzdHVyZUV2ZW50LnNjYWxlKSkge1xuXG4gICAgICAgICAgICB0aGlzLmdlc3R1cmUuc2NhbGUgPSBnZXN0dXJlRXZlbnQuc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2VzdHVyZUV2ZW50O1xuICAgIH0sXG5cbiAgICBwb2ludGVySG9sZDogZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAnaG9sZCcpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyVXA6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgICAgIHZhciBwb2ludGVySW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSk7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG9sZFRpbWVyc1twb2ludGVySW5kZXhdKTtcblxuICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAndXAnICk7XG4gICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsICd0YXAnKTtcblxuICAgICAgICB0aGlzLnBvaW50ZXJFbmQocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyQ2FuY2VsOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgcG9pbnRlckluZGV4ID0gdGhpcy5tb3VzZT8gMCA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhvbGRUaW1lcnNbcG9pbnRlckluZGV4XSk7XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0RXZlbnRUYXJnZXRzKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgJ2NhbmNlbCcpO1xuICAgICAgICB0aGlzLnBvaW50ZXJFbmQocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIpO1xuICAgIH0sXG5cbiAgICAvLyBodHRwOi8vd3d3LnF1aXJrc21vZGUub3JnL2RvbS9ldmVudHMvY2xpY2suaHRtbFxuICAgIC8vID5FdmVudHMgbGVhZGluZyB0byBkYmxjbGlja1xuICAgIC8vXG4gICAgLy8gSUU4IGRvZXNuJ3QgZmlyZSBkb3duIGV2ZW50IGJlZm9yZSBkYmxjbGljay5cbiAgICAvLyBUaGlzIHdvcmthcm91bmQgdHJpZXMgdG8gZmlyZSBhIHRhcCBhbmQgZG91YmxldGFwIGFmdGVyIGRibGNsaWNrXG4gICAgaWU4RGJsY2xpY2s6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICAgICAgaWYgKHRoaXMucHJldlRhcFxuICAgICAgICAgICAgJiYgZXZlbnQuY2xpZW50WCA9PT0gdGhpcy5wcmV2VGFwLmNsaWVudFhcbiAgICAgICAgICAgICYmIGV2ZW50LmNsaWVudFkgPT09IHRoaXMucHJldlRhcC5jbGllbnRZXG4gICAgICAgICAgICAmJiBldmVudFRhcmdldCAgID09PSB0aGlzLnByZXZUYXAudGFyZ2V0KSB7XG5cbiAgICAgICAgICAgIHRoaXMuZG93blRhcmdldHNbMF0gPSBldmVudFRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuZG93blRpbWVzWzBdID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RFdmVudFRhcmdldHMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCAndGFwJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBpbmVydGlhIGlzIGVuYWJsZWRcbiAgICBwb2ludGVyRW5kOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgICAgICB2YXIgZW5kRXZlbnQsXG4gICAgICAgICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0YXJnZXQgJiYgdGFyZ2V0Lm9wdGlvbnMsXG4gICAgICAgICAgICBpbmVydGlhT3B0aW9ucyA9IG9wdGlvbnMgJiYgdGhpcy5wcmVwYXJlZC5uYW1lICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5pbmVydGlhLFxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cyA9IHRoaXMuaW5lcnRpYVN0YXR1cztcblxuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG5cbiAgICAgICAgICAgIGlmIChpbmVydGlhU3RhdHVzLmFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgdmFyIHBvaW50ZXJTcGVlZCxcbiAgICAgICAgICAgICAgICBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgICAgICAgICBpbmVydGlhUG9zc2libGUgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpbmVydGlhID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgc21vb3RoRW5kID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgZW5kU25hcCA9IHNjb3BlLmNoZWNrU25hcCh0YXJnZXQsIHRoaXMucHJlcGFyZWQubmFtZSkgJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLnNuYXAuZW5kT25seSxcbiAgICAgICAgICAgICAgICBlbmRSZXN0cmljdCA9IHNjb3BlLmNoZWNrUmVzdHJpY3QodGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpICYmIG9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5yZXN0cmljdC5lbmRPbmx5LFxuICAgICAgICAgICAgICAgIGR4ID0gMCxcbiAgICAgICAgICAgICAgICBkeSA9IDAsXG4gICAgICAgICAgICAgICAgc3RhcnRFdmVudDtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAgICAgIChvcHRpb25zLmRyYWcuYXhpcyA9PT0gJ3gnICkgeyBwb2ludGVyU3BlZWQgPSBNYXRoLmFicyh0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudngpOyB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5kcmFnLmF4aXMgPT09ICd5JyApIHsgcG9pbnRlclNwZWVkID0gTWF0aC5hYnModGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnZ5KTsgfVxuICAgICAgICAgICAgICAgIGVsc2UgICAvKm9wdGlvbnMuZHJhZy5heGlzID09PSAneHknKi97IHBvaW50ZXJTcGVlZCA9IHRoaXMucG9pbnRlckRlbHRhLmNsaWVudC5zcGVlZDsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcG9pbnRlclNwZWVkID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnNwZWVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBpbmVydGlhIHNob3VsZCBiZSBzdGFydGVkXG4gICAgICAgICAgICBpbmVydGlhUG9zc2libGUgPSAoaW5lcnRpYU9wdGlvbnMgJiYgaW5lcnRpYU9wdGlvbnMuZW5hYmxlZFxuICAgICAgICAgICAgJiYgdGhpcy5wcmVwYXJlZC5uYW1lICE9PSAnZ2VzdHVyZSdcbiAgICAgICAgICAgICYmIGV2ZW50ICE9PSBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhID0gKGluZXJ0aWFQb3NzaWJsZVxuICAgICAgICAgICAgJiYgKG5vdyAtIHRoaXMuY3VyQ29vcmRzLnRpbWVTdGFtcCkgPCA1MFxuICAgICAgICAgICAgJiYgcG9pbnRlclNwZWVkID4gaW5lcnRpYU9wdGlvbnMubWluU3BlZWRcbiAgICAgICAgICAgICYmIHBvaW50ZXJTcGVlZCA+IGluZXJ0aWFPcHRpb25zLmVuZFNwZWVkKTtcblxuICAgICAgICAgICAgaWYgKGluZXJ0aWFQb3NzaWJsZSAmJiAhaW5lcnRpYSAmJiAoZW5kU25hcCB8fCBlbmRSZXN0cmljdCkpIHtcblxuICAgICAgICAgICAgICAgIHZhciBzbmFwUmVzdHJpY3QgPSB7fTtcblxuICAgICAgICAgICAgICAgIHNuYXBSZXN0cmljdC5zbmFwID0gc25hcFJlc3RyaWN0LnJlc3RyaWN0ID0gc25hcFJlc3RyaWN0O1xuXG4gICAgICAgICAgICAgICAgaWYgKGVuZFNuYXApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTbmFwcGluZyh0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzbmFwUmVzdHJpY3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc25hcFJlc3RyaWN0LmxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHggKz0gc25hcFJlc3RyaWN0LmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gc25hcFJlc3RyaWN0LmR5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGVuZFJlc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVzdHJpY3Rpb24odGhpcy5jdXJDb29yZHMucGFnZSwgc25hcFJlc3RyaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNuYXBSZXN0cmljdC5yZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeCArPSBzbmFwUmVzdHJpY3QuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBzbmFwUmVzdHJpY3QuZHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZHggfHwgZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoRW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpbmVydGlhIHx8IHNtb290aEVuZCkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmNvcHlDb29yZHMoaW5lcnRpYVN0YXR1cy51cENvb3JkcywgdGhpcy5jdXJDb29yZHMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyc1swXSA9IGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCA9IHN0YXJ0RXZlbnQgPVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgdGhpcy5wcmVwYXJlZC5uYW1lLCAnaW5lcnRpYXN0YXJ0JywgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudDAgPSBub3c7XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQuZmlyZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZXJ0aWEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy52eDAgPSB0aGlzLnBvaW50ZXJEZWx0YS5jbGllbnQudng7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMudnkwID0gdGhpcy5wb2ludGVyRGVsdGEuY2xpZW50LnZ5O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnYwID0gcG9pbnRlclNwZWVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsY0luZXJ0aWEoaW5lcnRpYVN0YXR1cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSB1dGlscy5leHRlbmQoe30sIHRoaXMuY3VyQ29vcmRzLnBhZ2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luID0gc2NvcGUuZ2V0T3JpZ2luWFkodGFyZ2V0LCB0aGlzLmVsZW1lbnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzT2JqZWN0O1xuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UueCA9IHBhZ2UueCArIGluZXJ0aWFTdGF0dXMueGUgLSBvcmlnaW4ueDtcbiAgICAgICAgICAgICAgICAgICAgcGFnZS55ID0gcGFnZS55ICsgaW5lcnRpYVN0YXR1cy55ZSAtIG9yaWdpbi55O1xuXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c09iamVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZVN0YXR1c1hZOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFnZS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFnZS55LFxuICAgICAgICAgICAgICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkeTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNuYXA6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNPYmplY3Quc25hcCA9IHN0YXR1c09iamVjdDtcblxuICAgICAgICAgICAgICAgICAgICBkeCA9IGR5ID0gMDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5kU25hcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNuYXAgPSB0aGlzLnNldFNuYXBwaW5nKHRoaXMuY3VyQ29vcmRzLnBhZ2UsIHN0YXR1c09iamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzbmFwLmxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHNuYXAuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHkgKz0gc25hcC5keTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRSZXN0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3RyaWN0ID0gdGhpcy5zZXRSZXN0cmljdGlvbih0aGlzLmN1ckNvb3Jkcy5wYWdlLCBzdGF0dXNPYmplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdHJpY3QucmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IHJlc3RyaWN0LmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ICs9IHJlc3RyaWN0LmR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5tb2RpZmllZFhlICs9IGR4O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWWUgKz0gZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5pID0gYW5pbWF0aW9uRnJhbWUucmVxdWVzdCh0aGlzLmJvdW5kSW5lcnRpYUZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc21vb3RoRW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy54ZSA9IGR4O1xuICAgICAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnllID0gZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IGluZXJ0aWFTdGF0dXMuc3kgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuaSA9IGFuaW1hdGlvbkZyYW1lLnJlcXVlc3QodGhpcy5ib3VuZFNtb290aEVuZEZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZW5kU25hcCB8fCBlbmRSZXN0cmljdCkge1xuICAgICAgICAgICAgICAgIC8vIGZpcmUgYSBtb3ZlIGV2ZW50IGF0IHRoZSBzbmFwcGVkIGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRyYWdnaW5nKSB7XG4gICAgICAgICAgICBlbmRFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZHJhZycsICdlbmQnLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgICAgICB2YXIgZHJhZ2dhYmxlRWxlbWVudCA9IHRoaXMuZWxlbWVudCxcbiAgICAgICAgICAgICAgICBkcm9wID0gdGhpcy5nZXREcm9wKGV2ZW50LCBkcmFnZ2FibGVFbGVtZW50KTtcblxuICAgICAgICAgICAgdGhpcy5kcm9wVGFyZ2V0ID0gZHJvcC5kcm9wem9uZTtcbiAgICAgICAgICAgIHRoaXMuZHJvcEVsZW1lbnQgPSBkcm9wLmVsZW1lbnQ7XG5cbiAgICAgICAgICAgIHZhciBkcm9wRXZlbnRzID0gdGhpcy5nZXREcm9wRXZlbnRzKGV2ZW50LCBlbmRFdmVudCk7XG5cbiAgICAgICAgICAgIGlmIChkcm9wRXZlbnRzLmxlYXZlKSB7IHRoaXMucHJldkRyb3BUYXJnZXQuZmlyZShkcm9wRXZlbnRzLmxlYXZlKTsgfVxuICAgICAgICAgICAgaWYgKGRyb3BFdmVudHMuZW50ZXIpIHsgICAgIHRoaXMuZHJvcFRhcmdldC5maXJlKGRyb3BFdmVudHMuZW50ZXIpOyB9XG4gICAgICAgICAgICBpZiAoZHJvcEV2ZW50cy5kcm9wICkgeyAgICAgdGhpcy5kcm9wVGFyZ2V0LmZpcmUoZHJvcEV2ZW50cy5kcm9wICk7IH1cbiAgICAgICAgICAgIGlmIChkcm9wRXZlbnRzLmRlYWN0aXZhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmVBY3RpdmVEcm9wcyhkcm9wRXZlbnRzLmRlYWN0aXZhdGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXJnZXQuZmlyZShlbmRFdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5yZXNpemluZykge1xuICAgICAgICAgICAgZW5kRXZlbnQgPSBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgJ3Jlc2l6ZScsICdlbmQnLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGFyZ2V0LmZpcmUoZW5kRXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuZ2VzdHVyaW5nKSB7XG4gICAgICAgICAgICBlbmRFdmVudCA9IG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCAnZ2VzdHVyZScsICdlbmQnLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGFyZ2V0LmZpcmUoZW5kRXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdG9wKGV2ZW50KTtcbiAgICB9LFxuXG4gICAgY29sbGVjdERyb3BzOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgZHJvcHMgPSBbXSxcbiAgICAgICAgICAgIGVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuZWxlbWVudDtcblxuICAgICAgICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2NvcGUuaW50ZXJhY3RhYmxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFzY29wZS5pbnRlcmFjdGFibGVzW2ldLm9wdGlvbnMuZHJvcC5lbmFibGVkKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gc2NvcGUuaW50ZXJhY3RhYmxlc1tpXSxcbiAgICAgICAgICAgICAgICBhY2NlcHQgPSBjdXJyZW50Lm9wdGlvbnMuZHJvcC5hY2NlcHQ7XG5cbiAgICAgICAgICAgIC8vIHRlc3QgdGhlIGRyYWdnYWJsZSBlbGVtZW50IGFnYWluc3QgdGhlIGRyb3B6b25lJ3MgYWNjZXB0IHNldHRpbmdcbiAgICAgICAgICAgIGlmICgodXRpbHMuaXNFbGVtZW50KGFjY2VwdCkgJiYgYWNjZXB0ICE9PSBlbGVtZW50KVxuICAgICAgICAgICAgICAgIHx8IChzY29wZS5pc1N0cmluZyhhY2NlcHQpXG4gICAgICAgICAgICAgICAgJiYgIXNjb3BlLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBhY2NlcHQpKSkge1xuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHF1ZXJ5IGZvciBuZXcgZWxlbWVudHMgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgICB2YXIgZHJvcEVsZW1lbnRzID0gY3VycmVudC5zZWxlY3Rvcj8gY3VycmVudC5fY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKGN1cnJlbnQuc2VsZWN0b3IpIDogW2N1cnJlbnQuX2VsZW1lbnRdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgbGVuID0gZHJvcEVsZW1lbnRzLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZHJvcEVsZW1lbnRzW2pdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRyb3BzLnB1c2goY3VycmVudCk7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChjdXJyZW50RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZHJvcHpvbmVzOiBkcm9wcyxcbiAgICAgICAgICAgIGVsZW1lbnRzOiBlbGVtZW50c1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBmaXJlQWN0aXZlRHJvcHM6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGN1cnJlbnQsXG4gICAgICAgICAgICBjdXJyZW50RWxlbWVudCxcbiAgICAgICAgICAgIHByZXZFbGVtZW50O1xuXG4gICAgICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgYWN0aXZlIGRyb3B6b25lcyBhbmQgdHJpZ2dlciBldmVudFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tpXTtcbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50ID0gdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyBbaV07XG5cbiAgICAgICAgICAgIC8vIHByZXZlbnQgdHJpZ2dlciBvZiBkdXBsaWNhdGUgZXZlbnRzIG9uIHNhbWUgZWxlbWVudFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRFbGVtZW50ICE9PSBwcmV2RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIC8vIHNldCBjdXJyZW50IGVsZW1lbnQgYXMgZXZlbnQgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0ID0gY3VycmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgY3VycmVudC5maXJlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByZXZFbGVtZW50ID0gY3VycmVudEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gQ29sbGVjdCBhIG5ldyBzZXQgb2YgcG9zc2libGUgZHJvcHMgYW5kIHNhdmUgdGhlbSBpbiBhY3RpdmVEcm9wcy5cbiAgICAvLyBzZXRBY3RpdmVEcm9wcyBzaG91bGQgYWx3YXlzIGJlIGNhbGxlZCB3aGVuIGEgZHJhZyBoYXMganVzdCBzdGFydGVkIG9yIGFcbiAgICAvLyBkcmFnIGV2ZW50IGhhcHBlbnMgd2hpbGUgZHluYW1pY0Ryb3AgaXMgdHJ1ZVxuICAgIHNldEFjdGl2ZURyb3BzOiBmdW5jdGlvbiAoZHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgLy8gZ2V0IGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgdGhhdCBjb3VsZCByZWNlaXZlIHRoZSBkcmFnZ2FibGVcbiAgICAgICAgdmFyIHBvc3NpYmxlRHJvcHMgPSB0aGlzLmNvbGxlY3REcm9wcyhkcmFnRWxlbWVudCwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMgPSBwb3NzaWJsZURyb3BzLmRyb3B6b25lcztcbiAgICAgICAgdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyAgPSBwb3NzaWJsZURyb3BzLmVsZW1lbnRzO1xuICAgICAgICB0aGlzLmFjdGl2ZURyb3BzLnJlY3RzICAgICA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRHJvcHMucmVjdHNbaV0gPSB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lc1tpXS5nZXRSZWN0KHRoaXMuYWN0aXZlRHJvcHMuZWxlbWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldERyb3A6IGZ1bmN0aW9uIChldmVudCwgZHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyIHZhbGlkRHJvcHMgPSBbXTtcblxuICAgICAgICBpZiAoc2NvcGUuZHluYW1pY0Ryb3ApIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlRHJvcHMoZHJhZ0VsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29sbGVjdCBhbGwgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB3aGljaCBxdWFsaWZ5IGZvciBhIGRyb3BcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmFjdGl2ZURyb3BzLmRyb3B6b25lcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnQgICAgICAgID0gdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXNbal0sXG4gICAgICAgICAgICAgICAgY3VycmVudEVsZW1lbnQgPSB0aGlzLmFjdGl2ZURyb3BzLmVsZW1lbnRzIFtqXSxcbiAgICAgICAgICAgICAgICByZWN0ICAgICAgICAgICA9IHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgICAgW2pdO1xuXG4gICAgICAgICAgICB2YWxpZERyb3BzLnB1c2goY3VycmVudC5kcm9wQ2hlY2sodGhpcy5wb2ludGVyc1swXSwgZXZlbnQsIHRoaXMudGFyZ2V0LCBkcmFnRWxlbWVudCwgY3VycmVudEVsZW1lbnQsIHJlY3QpXG4gICAgICAgICAgICAgICAgPyBjdXJyZW50RWxlbWVudFxuICAgICAgICAgICAgICAgIDogbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgdGhlIG1vc3QgYXBwcm9wcmlhdGUgZHJvcHpvbmUgYmFzZWQgb24gRE9NIGRlcHRoIGFuZCBvcmRlclxuICAgICAgICB2YXIgZHJvcEluZGV4ID0gc2NvcGUuaW5kZXhPZkRlZXBlc3RFbGVtZW50KHZhbGlkRHJvcHMpLFxuICAgICAgICAgICAgZHJvcHpvbmUgID0gdGhpcy5hY3RpdmVEcm9wcy5kcm9wem9uZXNbZHJvcEluZGV4XSB8fCBudWxsLFxuICAgICAgICAgICAgZWxlbWVudCAgID0gdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyBbZHJvcEluZGV4XSB8fCBudWxsO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkcm9wem9uZTogZHJvcHpvbmUsXG4gICAgICAgICAgICBlbGVtZW50OiBlbGVtZW50XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldERyb3BFdmVudHM6IGZ1bmN0aW9uIChwb2ludGVyRXZlbnQsIGRyYWdFdmVudCkge1xuICAgICAgICB2YXIgZHJvcEV2ZW50cyA9IHtcbiAgICAgICAgICAgIGVudGVyICAgICA6IG51bGwsXG4gICAgICAgICAgICBsZWF2ZSAgICAgOiBudWxsLFxuICAgICAgICAgICAgYWN0aXZhdGUgIDogbnVsbCxcbiAgICAgICAgICAgIGRlYWN0aXZhdGU6IG51bGwsXG4gICAgICAgICAgICBtb3ZlICAgICAgOiBudWxsLFxuICAgICAgICAgICAgZHJvcCAgICAgIDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0aGlzLmRyb3BFbGVtZW50ICE9PSB0aGlzLnByZXZEcm9wRWxlbWVudCkge1xuICAgICAgICAgICAgLy8gaWYgdGhlcmUgd2FzIGEgcHJldkRyb3BUYXJnZXQsIGNyZWF0ZSBhIGRyYWdsZWF2ZSBldmVudFxuICAgICAgICAgICAgaWYgKHRoaXMucHJldkRyb3BUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICBkcm9wRXZlbnRzLmxlYXZlID0ge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgICAgICAgOiB0aGlzLnByZXZEcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5wcmV2RHJvcFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZHJhZ0V2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICAgICAgZHJhZ0V2ZW50ICAgIDogZHJhZ0V2ZW50LFxuICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbiAgOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgICAgICB0eXBlICAgICAgICAgOiAnZHJhZ2xlYXZlJ1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQuZHJhZ0xlYXZlID0gdGhpcy5wcmV2RHJvcEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgZHJhZ0V2ZW50LnByZXZEcm9wem9uZSA9IHRoaXMucHJldkRyb3BUYXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiB0aGUgZHJvcFRhcmdldCBpcyBub3QgbnVsbCwgY3JlYXRlIGEgZHJhZ2VudGVyIGV2ZW50XG4gICAgICAgICAgICBpZiAodGhpcy5kcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgZHJvcEV2ZW50cy5lbnRlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogdGhpcy5kcm9wRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5kcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICByZWxhdGVkVGFyZ2V0OiBkcmFnRXZlbnQudGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUgICAgOiBkcmFnRXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgICAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uICA6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVTdGFtcCAgICA6IGRyYWdFdmVudC50aW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcmFnZW50ZXInXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGRyYWdFdmVudC5kcmFnRW50ZXIgPSB0aGlzLmRyb3BFbGVtZW50O1xuICAgICAgICAgICAgICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IHRoaXMuZHJvcFRhcmdldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdlbmQnICYmIHRoaXMuZHJvcFRhcmdldCkge1xuICAgICAgICAgICAgZHJvcEV2ZW50cy5kcm9wID0ge1xuICAgICAgICAgICAgICAgIHRhcmdldCAgICAgICA6IHRoaXMuZHJvcEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5kcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wVGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdzdGFydCcpIHtcbiAgICAgICAgICAgIGRyb3BFdmVudHMuYWN0aXZhdGUgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogbnVsbCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wYWN0aXZhdGUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdlbmQnKSB7XG4gICAgICAgICAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ICAgICAgIDogbnVsbCxcbiAgICAgICAgICAgICAgICBkcm9wem9uZSAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICB0aW1lU3RhbXAgICAgOiBkcmFnRXZlbnQudGltZVN0YW1wLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6ICdkcm9wZGVhY3RpdmF0ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ21vdmUnICYmIHRoaXMuZHJvcFRhcmdldCkge1xuICAgICAgICAgICAgZHJvcEV2ZW50cy5tb3ZlID0ge1xuICAgICAgICAgICAgICAgIHRhcmdldCAgICAgICA6IHRoaXMuZHJvcEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgZHJvcHpvbmUgICAgIDogdGhpcy5kcm9wVGFyZ2V0LFxuICAgICAgICAgICAgICAgIHJlbGF0ZWRUYXJnZXQ6IGRyYWdFdmVudC50YXJnZXQsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlICAgIDogZHJhZ0V2ZW50LmludGVyYWN0YWJsZSxcbiAgICAgICAgICAgICAgICBkcmFnRXZlbnQgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24gIDogdGhpcyxcbiAgICAgICAgICAgICAgICBkcmFnbW92ZSAgICAgOiBkcmFnRXZlbnQsXG4gICAgICAgICAgICAgICAgdGltZVN0YW1wICAgIDogZHJhZ0V2ZW50LnRpbWVTdGFtcCxcbiAgICAgICAgICAgICAgICB0eXBlICAgICAgICAgOiAnZHJvcG1vdmUnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wVGFyZ2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRyb3BFdmVudHM7XG4gICAgfSxcblxuICAgIGN1cnJlbnRBY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmRyYWdnaW5nICYmICdkcmFnJykgfHwgKHRoaXMucmVzaXppbmcgJiYgJ3Jlc2l6ZScpIHx8ICh0aGlzLmdlc3R1cmluZyAmJiAnZ2VzdHVyZScpIHx8IG51bGw7XG4gICAgfSxcblxuICAgIGludGVyYWN0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRyYWdnaW5nIHx8IHRoaXMucmVzaXppbmcgfHwgdGhpcy5nZXN0dXJpbmc7XG4gICAgfSxcblxuICAgIGNsZWFyVGFyZ2V0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRhcmdldCA9IHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kcm9wVGFyZ2V0ID0gdGhpcy5kcm9wRWxlbWVudCA9IHRoaXMucHJldkRyb3BUYXJnZXQgPSB0aGlzLnByZXZEcm9wRWxlbWVudCA9IG51bGw7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaEVsZW1lbnRzID0gW107XG5cbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgICAgICAgICAgaWYgKHRhcmdldC5vcHRpb25zLnN0eWxlQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Ll9kb2MuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBwcmV2ZW50IERlZmF1bHQgb25seSBpZiB3ZXJlIHByZXZpb3VzbHkgaW50ZXJhY3RpbmdcbiAgICAgICAgICAgIGlmIChldmVudCAmJiBzY29wZS5pc0Z1bmN0aW9uKGV2ZW50LnByZXZlbnREZWZhdWx0KSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCwgdGFyZ2V0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5kcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlRHJvcHMuZHJvcHpvbmVzID0gdGhpcy5hY3RpdmVEcm9wcy5lbGVtZW50cyA9IHRoaXMuYWN0aXZlRHJvcHMucmVjdHMgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNsZWFyVGFyZ2V0cygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wb2ludGVySXNEb3duID0gdGhpcy5zbmFwU3RhdHVzLmxvY2tlZCA9IHRoaXMuZHJhZ2dpbmcgPSB0aGlzLnJlc2l6aW5nID0gdGhpcy5nZXN0dXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wcmVwYXJlZC5uYW1lID0gdGhpcy5wcmV2RXZlbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHggPSB0aGlzLmluZXJ0aWFTdGF0dXMucmVzdW1lRHkgPSAwO1xuXG4gICAgICAgIC8vIHJlbW92ZSBwb2ludGVycyBpZiB0aGVpciBJRCBpc24ndCBpbiB0aGlzLnBvaW50ZXJJZHNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBvaW50ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIHV0aWxzLmdldFBvaW50ZXJJZCh0aGlzLnBvaW50ZXJzW2ldKSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2NvcGUuaW50ZXJhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhpcyBpbnRlcmFjdGlvbiBpZiBpdCdzIG5vdCB0aGUgb25seSBvbmUgb2YgaXQncyB0eXBlXG4gICAgICAgICAgICBpZiAoc2NvcGUuaW50ZXJhY3Rpb25zW2ldICE9PSB0aGlzICYmIHNjb3BlLmludGVyYWN0aW9uc1tpXS5tb3VzZSA9PT0gdGhpcy5tb3VzZSkge1xuICAgICAgICAgICAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5zcGxpY2Uoc2NvcGUuaW5kZXhPZihzY29wZS5pbnRlcmFjdGlvbnMsIHRoaXMpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbmVydGlhRnJhbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluZXJ0aWFTdGF0dXMgPSB0aGlzLmluZXJ0aWFTdGF0dXMsXG4gICAgICAgICAgICBvcHRpb25zID0gdGhpcy50YXJnZXQub3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLmluZXJ0aWEsXG4gICAgICAgICAgICBsYW1iZGEgPSBvcHRpb25zLnJlc2lzdGFuY2UsXG4gICAgICAgICAgICB0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwIC0gaW5lcnRpYVN0YXR1cy50MDtcblxuICAgICAgICBpZiAodCA8IGluZXJ0aWFTdGF0dXMudGUpIHtcblxuICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gIDEgLSAoTWF0aC5leHAoLWxhbWJkYSAqIHQpIC0gaW5lcnRpYVN0YXR1cy5sYW1iZGFfdjApIC8gaW5lcnRpYVN0YXR1cy5vbmVfdmVfdjA7XG5cbiAgICAgICAgICAgIGlmIChpbmVydGlhU3RhdHVzLm1vZGlmaWVkWGUgPT09IGluZXJ0aWFTdGF0dXMueGUgJiYgaW5lcnRpYVN0YXR1cy5tb2RpZmllZFllID09PSBpbmVydGlhU3RhdHVzLnllKSB7XG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeCA9IGluZXJ0aWFTdGF0dXMueGUgKiBwcm9ncmVzcztcbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN5ID0gaW5lcnRpYVN0YXR1cy55ZSAqIHByb2dyZXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1YWRQb2ludCA9IHNjb3BlLmdldFF1YWRyYXRpY0N1cnZlUG9pbnQoXG4gICAgICAgICAgICAgICAgICAgIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMueGUsIGluZXJ0aWFTdGF0dXMueWUsXG4gICAgICAgICAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMubW9kaWZpZWRYZSwgaW5lcnRpYVN0YXR1cy5tb2RpZmllZFllLFxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcyk7XG5cbiAgICAgICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gcXVhZFBvaW50Lng7XG4gICAgICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IHF1YWRQb2ludC55O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcblxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5pID0gYW5pbWF0aW9uRnJhbWUucmVxdWVzdCh0aGlzLmJvdW5kSW5lcnRpYUZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBpbmVydGlhU3RhdHVzLm1vZGlmaWVkWGU7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN5ID0gaW5lcnRpYVN0YXR1cy5tb2RpZmllZFllO1xuXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJNb3ZlKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcblxuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucG9pbnRlckVuZChpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc21vb3RoRW5kRnJhbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluZXJ0aWFTdGF0dXMgPSB0aGlzLmluZXJ0aWFTdGF0dXMsXG4gICAgICAgICAgICB0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBpbmVydGlhU3RhdHVzLnQwLFxuICAgICAgICAgICAgZHVyYXRpb24gPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uaW5lcnRpYS5zbW9vdGhFbmREdXJhdGlvbjtcblxuICAgICAgICBpZiAodCA8IGR1cmF0aW9uKSB7XG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLnN4ID0gc2NvcGUuZWFzZU91dFF1YWQodCwgMCwgaW5lcnRpYVN0YXR1cy54ZSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IHNjb3BlLmVhc2VPdXRRdWFkKHQsIDAsIGluZXJ0aWFTdGF0dXMueWUsIGR1cmF0aW9uKTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyTW92ZShpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQsIGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCk7XG5cbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuaSA9IGFuaW1hdGlvbkZyYW1lLnJlcXVlc3QodGhpcy5ib3VuZFNtb290aEVuZEZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGluZXJ0aWFTdGF0dXMuc3ggPSBpbmVydGlhU3RhdHVzLnhlO1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zeSA9IGluZXJ0aWFTdGF0dXMueWU7XG5cbiAgICAgICAgICAgIHRoaXMucG9pbnRlck1vdmUoaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50LCBpbmVydGlhU3RhdHVzLnN0YXJ0RXZlbnQpO1xuXG4gICAgICAgICAgICBpbmVydGlhU3RhdHVzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgaW5lcnRpYVN0YXR1cy5zbW9vdGhFbmQgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5wb2ludGVyRW5kKGluZXJ0aWFTdGF0dXMuc3RhcnRFdmVudCwgaW5lcnRpYVN0YXR1cy5zdGFydEV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhZGRQb2ludGVyOiBmdW5jdGlvbiAocG9pbnRlcikge1xuICAgICAgICB2YXIgaWQgPSB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlciksXG4gICAgICAgICAgICBpbmRleCA9IHRoaXMubW91c2U/IDAgOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgaWQpO1xuXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5wb2ludGVySWRzLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucG9pbnRlcklkc1tpbmRleF0gPSBpZDtcbiAgICAgICAgdGhpcy5wb2ludGVyc1tpbmRleF0gPSBwb2ludGVyO1xuXG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9LFxuXG4gICAgcmVtb3ZlUG9pbnRlcjogZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICAgICAgdmFyIGlkID0gdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpLFxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLm1vdXNlPyAwIDogc2NvcGUuaW5kZXhPZih0aGlzLnBvaW50ZXJJZHMsIGlkKTtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmICghdGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvaW50ZXJJZHMgLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMuZG93blRhcmdldHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdGhpcy5kb3duVGltZXMgIC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmhvbGRUaW1lcnMgLnNwbGljZShpbmRleCwgMSk7XG4gICAgfSxcblxuICAgIHJlY29yZFBvaW50ZXI6IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgICAgIC8vIERvIG5vdCB1cGRhdGUgcG9pbnRlcnMgd2hpbGUgaW5lcnRpYSBpcyBhY3RpdmUuXG4gICAgICAgIC8vIFRoZSBpbmVydGlhIHN0YXJ0IGV2ZW50IHNob3VsZCBiZSB0aGlzLnBvaW50ZXJzWzBdXG4gICAgICAgIGlmICh0aGlzLmluZXJ0aWFTdGF0dXMuYWN0aXZlKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubW91c2U/IDA6IHNjb3BlLmluZGV4T2YodGhpcy5wb2ludGVySWRzLCB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcikpO1xuXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdGhpcy5wb2ludGVyc1tpbmRleF0gPSBwb2ludGVyO1xuICAgIH0sXG5cbiAgICBjb2xsZWN0RXZlbnRUYXJnZXRzOiBmdW5jdGlvbiAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBldmVudFR5cGUpIHtcbiAgICAgICAgdmFyIHBvaW50ZXJJbmRleCA9IHRoaXMubW91c2U/IDAgOiBzY29wZS5pbmRleE9mKHRoaXMucG9pbnRlcklkcywgdXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpKTtcblxuICAgICAgICAvLyBkbyBub3QgZmlyZSBhIHRhcCBldmVudCBpZiB0aGUgcG9pbnRlciB3YXMgbW92ZWQgYmVmb3JlIGJlaW5nIGxpZnRlZFxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAndGFwJyAmJiAodGhpcy5wb2ludGVyV2FzTW92ZWRcbiAgICAgICAgICAgICAgICAvLyBvciBpZiB0aGUgcG9pbnRlcnVwIHRhcmdldCBpcyBkaWZmZXJlbnQgdG8gdGhlIHBvaW50ZXJkb3duIHRhcmdldFxuICAgICAgICAgICAgfHwgISh0aGlzLmRvd25UYXJnZXRzW3BvaW50ZXJJbmRleF0gJiYgdGhpcy5kb3duVGFyZ2V0c1twb2ludGVySW5kZXhdID09PSBldmVudFRhcmdldCkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGFyZ2V0cyA9IFtdLFxuICAgICAgICAgICAgZWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgIGVsZW1lbnQgPSBldmVudFRhcmdldDtcblxuICAgICAgICBmdW5jdGlvbiBjb2xsZWN0U2VsZWN0b3JzIChpbnRlcmFjdGFibGUsIHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgZWxzID0gc2NvcGUuaWU4TWF0Y2hlc1NlbGVjdG9yXG4gICAgICAgICAgICAgICAgPyBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGFibGUuX2lFdmVudHNbZXZlbnRUeXBlXVxuICAgICAgICAgICAgICAgICYmIHV0aWxzLmlzRWxlbWVudChlbGVtZW50KVxuICAgICAgICAgICAgICAgICYmIHNjb3BlLmluQ29udGV4dChpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgJiYgIXNjb3BlLnRlc3RJZ25vcmUoaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS50ZXN0QWxsb3coaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldClcbiAgICAgICAgICAgICAgICAmJiBzY29wZS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IsIGVscykpIHtcblxuICAgICAgICAgICAgICAgIHRhcmdldHMucHVzaChpbnRlcmFjdGFibGUpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBpbnRlcmFjdCA9IHNjb3BlLmludGVyYWN0O1xuXG4gICAgICAgIHdoaWxlIChlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoaW50ZXJhY3QuaXNTZXQoZWxlbWVudCkgJiYgaW50ZXJhY3QoZWxlbWVudCkuX2lFdmVudHNbZXZlbnRUeXBlXSkge1xuICAgICAgICAgICAgICAgIHRhcmdldHMucHVzaChpbnRlcmFjdChlbGVtZW50KSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NvcGUuaW50ZXJhY3RhYmxlcy5mb3JFYWNoU2VsZWN0b3IoY29sbGVjdFNlbGVjdG9ycyk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQgPSBzY29wZS5wYXJlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY3JlYXRlIHRoZSB0YXAgZXZlbnQgZXZlbiBpZiB0aGVyZSBhcmUgbm8gbGlzdGVuZXJzIHNvIHRoYXRcbiAgICAgICAgLy8gZG91YmxldGFwIGNhbiBzdGlsbCBiZSBjcmVhdGVkIGFuZCBmaXJlZFxuICAgICAgICBpZiAodGFyZ2V0cy5sZW5ndGggfHwgZXZlbnRUeXBlID09PSAndGFwJykge1xuICAgICAgICAgICAgdGhpcy5maXJlUG9pbnRlcnMocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0YXJnZXRzLCBlbGVtZW50cywgZXZlbnRUeXBlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBmaXJlUG9pbnRlcnM6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRhcmdldHMsIGVsZW1lbnRzLCBldmVudFR5cGUpIHtcbiAgICAgICAgdmFyIHBvaW50ZXJJbmRleCA9IHRoaXMubW91c2U/IDAgOiBzY29wZS5pbmRleE9mKHV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKSksXG4gICAgICAgICAgICBwb2ludGVyRXZlbnQgPSB7fSxcbiAgICAgICAgICAgIGksXG4gICAgICAgIC8vIGZvciB0YXAgZXZlbnRzXG4gICAgICAgICAgICBpbnRlcnZhbCwgY3JlYXRlTmV3RG91YmxlVGFwO1xuXG4gICAgICAgIC8vIGlmIGl0J3MgYSBkb3VibGV0YXAgdGhlbiB0aGUgZXZlbnQgcHJvcGVydGllcyB3b3VsZCBoYXZlIGJlZW5cbiAgICAgICAgLy8gY29waWVkIGZyb20gdGhlIHRhcCBldmVudCBhbmQgcHJvdmlkZWQgYXMgdGhlIHBvaW50ZXIgYXJndW1lbnRcbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ2RvdWJsZXRhcCcpIHtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudCA9IHBvaW50ZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB1dGlscy5leHRlbmQocG9pbnRlckV2ZW50LCBldmVudCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQgIT09IHBvaW50ZXIpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5leHRlbmQocG9pbnRlckV2ZW50LCBwb2ludGVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnByZXZlbnREZWZhdWx0ICAgICAgICAgICA9IHByZXZlbnRPcmlnaW5hbERlZmF1bHQ7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuc3RvcFByb3BhZ2F0aW9uICAgICAgICAgID0gSW50ZXJhY3RFdmVudC5wcm90b3R5cGUuc3RvcFByb3BhZ2F0aW9uO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiA9IEludGVyYWN0RXZlbnQucHJvdG90eXBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbjtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5pbnRlcmFjdGlvbiAgICAgICAgICAgICAgPSB0aGlzO1xuXG4gICAgICAgICAgICBwb2ludGVyRXZlbnQudGltZVN0YW1wICAgICA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50Lm9yaWdpbmFsRXZlbnQgPSBldmVudDtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC50eXBlICAgICAgICAgID0gZXZlbnRUeXBlO1xuICAgICAgICAgICAgcG9pbnRlckV2ZW50LnBvaW50ZXJJZCAgICAgPSB1dGlscy5nZXRQb2ludGVySWQocG9pbnRlcik7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQucG9pbnRlclR5cGUgICA9IHRoaXMubW91c2U/ICdtb3VzZScgOiAhYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudD8gJ3RvdWNoJ1xuICAgICAgICAgICAgICAgIDogc2NvcGUuaXNTdHJpbmcocG9pbnRlci5wb2ludGVyVHlwZSlcbiAgICAgICAgICAgICAgICA/IHBvaW50ZXIucG9pbnRlclR5cGVcbiAgICAgICAgICAgICAgICA6IFssLCd0b3VjaCcsICdwZW4nLCAnbW91c2UnXVtwb2ludGVyLnBvaW50ZXJUeXBlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICd0YXAnKSB7XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuZHQgPSBwb2ludGVyRXZlbnQudGltZVN0YW1wIC0gdGhpcy5kb3duVGltZXNbcG9pbnRlckluZGV4XTtcblxuICAgICAgICAgICAgaW50ZXJ2YWwgPSBwb2ludGVyRXZlbnQudGltZVN0YW1wIC0gdGhpcy50YXBUaW1lO1xuICAgICAgICAgICAgY3JlYXRlTmV3RG91YmxlVGFwID0gISEodGhpcy5wcmV2VGFwICYmIHRoaXMucHJldlRhcC50eXBlICE9PSAnZG91YmxldGFwJ1xuICAgICAgICAgICAgJiYgdGhpcy5wcmV2VGFwLnRhcmdldCA9PT0gcG9pbnRlckV2ZW50LnRhcmdldFxuICAgICAgICAgICAgJiYgaW50ZXJ2YWwgPCA1MDApO1xuXG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuZG91YmxlID0gY3JlYXRlTmV3RG91YmxlVGFwO1xuXG4gICAgICAgICAgICB0aGlzLnRhcFRpbWUgPSBwb2ludGVyRXZlbnQudGltZVN0YW1wO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhcmdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5jdXJyZW50VGFyZ2V0ID0gZWxlbWVudHNbaV07XG4gICAgICAgICAgICBwb2ludGVyRXZlbnQuaW50ZXJhY3RhYmxlID0gdGFyZ2V0c1tpXTtcbiAgICAgICAgICAgIHRhcmdldHNbaV0uZmlyZShwb2ludGVyRXZlbnQpO1xuXG4gICAgICAgICAgICBpZiAocG9pbnRlckV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZFxuICAgICAgICAgICAgICAgIHx8KHBvaW50ZXJFdmVudC5wcm9wYWdhdGlvblN0b3BwZWQgJiYgZWxlbWVudHNbaSArIDFdICE9PSBwb2ludGVyRXZlbnQuY3VycmVudFRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjcmVhdGVOZXdEb3VibGVUYXApIHtcbiAgICAgICAgICAgIHZhciBkb3VibGVUYXAgPSB7fTtcblxuICAgICAgICAgICAgdXRpbHMuZXh0ZW5kKGRvdWJsZVRhcCwgcG9pbnRlckV2ZW50KTtcblxuICAgICAgICAgICAgZG91YmxlVGFwLmR0ICAgPSBpbnRlcnZhbDtcbiAgICAgICAgICAgIGRvdWJsZVRhcC50eXBlID0gJ2RvdWJsZXRhcCc7XG5cbiAgICAgICAgICAgIHRoaXMuY29sbGVjdEV2ZW50VGFyZ2V0cyhkb3VibGVUYXAsIGV2ZW50LCBldmVudFRhcmdldCwgJ2RvdWJsZXRhcCcpO1xuXG4gICAgICAgICAgICB0aGlzLnByZXZUYXAgPSBkb3VibGVUYXA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXZlbnRUeXBlID09PSAndGFwJykge1xuICAgICAgICAgICAgdGhpcy5wcmV2VGFwID0gcG9pbnRlckV2ZW50O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHZhbGlkYXRlU2VsZWN0b3I6IGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgbWF0Y2hlcywgbWF0Y2hFbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbWF0Y2hlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gbWF0Y2hlc1tpXSxcbiAgICAgICAgICAgICAgICBtYXRjaEVsZW1lbnQgPSBtYXRjaEVsZW1lbnRzW2ldLFxuICAgICAgICAgICAgICAgIGFjdGlvbiA9IHZhbGlkYXRlQWN0aW9uKG1hdGNoLmdldEFjdGlvbihwb2ludGVyLCBldmVudCwgdGhpcywgbWF0Y2hFbGVtZW50KSwgbWF0Y2gpO1xuXG4gICAgICAgICAgICBpZiAoYWN0aW9uICYmIHNjb3BlLndpdGhpbkludGVyYWN0aW9uTGltaXQobWF0Y2gsIG1hdGNoRWxlbWVudCwgYWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gbWF0Y2g7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gbWF0Y2hFbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRTbmFwcGluZzogZnVuY3Rpb24gKHBhZ2VDb29yZHMsIHN0YXR1cykge1xuICAgICAgICB2YXIgc25hcCA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5zbmFwLFxuICAgICAgICAgICAgdGFyZ2V0cyA9IFtdLFxuICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgc3RhdHVzID0gc3RhdHVzIHx8IHRoaXMuc25hcFN0YXR1cztcblxuICAgICAgICBpZiAoc3RhdHVzLnVzZVN0YXR1c1hZKSB7XG4gICAgICAgICAgICBwYWdlID0geyB4OiBzdGF0dXMueCwgeTogc3RhdHVzLnkgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBvcmlnaW4gPSBzY29wZS5nZXRPcmlnaW5YWSh0aGlzLnRhcmdldCwgdGhpcy5lbGVtZW50KTtcblxuICAgICAgICAgICAgcGFnZSA9IHV0aWxzLmV4dGVuZCh7fSwgcGFnZUNvb3Jkcyk7XG5cbiAgICAgICAgICAgIHBhZ2UueCAtPSBvcmlnaW4ueDtcbiAgICAgICAgICAgIHBhZ2UueSAtPSBvcmlnaW4ueTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cy5yZWFsWCA9IHBhZ2UueDtcbiAgICAgICAgc3RhdHVzLnJlYWxZID0gcGFnZS55O1xuXG4gICAgICAgIHBhZ2UueCA9IHBhZ2UueCAtIHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeDtcbiAgICAgICAgcGFnZS55ID0gcGFnZS55IC0gdGhpcy5pbmVydGlhU3RhdHVzLnJlc3VtZUR5O1xuXG4gICAgICAgIHZhciBsZW4gPSBzbmFwLnRhcmdldHM/IHNuYXAudGFyZ2V0cy5sZW5ndGggOiAwO1xuXG4gICAgICAgIGZvciAodmFyIHJlbEluZGV4ID0gMDsgcmVsSW5kZXggPCB0aGlzLnNuYXBPZmZzZXRzLmxlbmd0aDsgcmVsSW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHJlbGF0aXZlID0ge1xuICAgICAgICAgICAgICAgIHg6IHBhZ2UueCAtIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLngsXG4gICAgICAgICAgICAgICAgeTogcGFnZS55IC0gdGhpcy5zbmFwT2Zmc2V0c1tyZWxJbmRleF0ueVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLmlzRnVuY3Rpb24oc25hcC50YXJnZXRzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBzbmFwLnRhcmdldHNbaV0ocmVsYXRpdmUueCwgcmVsYXRpdmUueSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBzbmFwLnRhcmdldHNbaV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgICAgIHRhcmdldHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IHNjb3BlLmlzTnVtYmVyKHRhcmdldC54KSA/ICh0YXJnZXQueCArIHRoaXMuc25hcE9mZnNldHNbcmVsSW5kZXhdLngpIDogcmVsYXRpdmUueCxcbiAgICAgICAgICAgICAgICAgICAgeTogc2NvcGUuaXNOdW1iZXIodGFyZ2V0LnkpID8gKHRhcmdldC55ICsgdGhpcy5zbmFwT2Zmc2V0c1tyZWxJbmRleF0ueSkgOiByZWxhdGl2ZS55LFxuXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBzY29wZS5pc051bWJlcih0YXJnZXQucmFuZ2UpPyB0YXJnZXQucmFuZ2U6IHNuYXAucmFuZ2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjbG9zZXN0ID0ge1xuICAgICAgICAgICAgdGFyZ2V0OiBudWxsLFxuICAgICAgICAgICAgaW5SYW5nZTogZmFsc2UsXG4gICAgICAgICAgICBkaXN0YW5jZTogMCxcbiAgICAgICAgICAgIHJhbmdlOiAwLFxuICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICBkeTogMFxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHRhcmdldHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldHNbaV07XG5cbiAgICAgICAgICAgIHZhciByYW5nZSA9IHRhcmdldC5yYW5nZSxcbiAgICAgICAgICAgICAgICBkeCA9IHRhcmdldC54IC0gcGFnZS54LFxuICAgICAgICAgICAgICAgIGR5ID0gdGFyZ2V0LnkgLSBwYWdlLnksXG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSB1dGlscy5oeXBvdChkeCwgZHkpLFxuICAgICAgICAgICAgICAgIGluUmFuZ2UgPSBkaXN0YW5jZSA8PSByYW5nZTtcblxuICAgICAgICAgICAgLy8gSW5maW5pdGUgdGFyZ2V0cyBjb3VudCBhcyBiZWluZyBvdXQgb2YgcmFuZ2VcbiAgICAgICAgICAgIC8vIGNvbXBhcmVkIHRvIG5vbiBpbmZpbml0ZSBvbmVzIHRoYXQgYXJlIGluIHJhbmdlXG4gICAgICAgICAgICBpZiAocmFuZ2UgPT09IEluZmluaXR5ICYmIGNsb3Nlc3QuaW5SYW5nZSAmJiBjbG9zZXN0LnJhbmdlICE9PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgIGluUmFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjbG9zZXN0LnRhcmdldCB8fCAoaW5SYW5nZVxuICAgICAgICAgICAgICAgICAgICAvLyBpcyB0aGUgY2xvc2VzdCB0YXJnZXQgaW4gcmFuZ2U/XG4gICAgICAgICAgICAgICAgICAgID8gKGNsb3Nlc3QuaW5SYW5nZSAmJiByYW5nZSAhPT0gSW5maW5pdHlcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHBvaW50ZXIgaXMgcmVsYXRpdmVseSBkZWVwZXIgaW4gdGhpcyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgPyBkaXN0YW5jZSAvIHJhbmdlIDwgY2xvc2VzdC5kaXN0YW5jZSAvIGNsb3Nlc3QucmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB0YXJnZXQgaGFzIEluZmluaXRlIHJhbmdlIGFuZCB0aGUgY2xvc2VzdCBkb2Vzbid0XG4gICAgICAgICAgICAgICAgICAgIDogKHJhbmdlID09PSBJbmZpbml0eSAmJiBjbG9zZXN0LnJhbmdlICE9PSBJbmZpbml0eSlcbiAgICAgICAgICAgICAgICAgICAgLy8gT1IgdGhpcyB0YXJnZXQgaXMgY2xvc2VyIHRoYXQgdGhlIHByZXZpb3VzIGNsb3Nlc3RcbiAgICAgICAgICAgICAgICB8fCBkaXN0YW5jZSA8IGNsb3Nlc3QuZGlzdGFuY2UpXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBvdGhlciBpcyBub3QgaW4gcmFuZ2UgYW5kIHRoZSBwb2ludGVyIGlzIGNsb3NlciB0byB0aGlzIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICA6ICghY2xvc2VzdC5pblJhbmdlICYmIGRpc3RhbmNlIDwgY2xvc2VzdC5kaXN0YW5jZSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAocmFuZ2UgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgIGluUmFuZ2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNsb3Nlc3QudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICAgICAgICAgIGNsb3Nlc3QuZGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LnJhbmdlID0gcmFuZ2U7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5pblJhbmdlID0gaW5SYW5nZTtcbiAgICAgICAgICAgICAgICBjbG9zZXN0LmR4ID0gZHg7XG4gICAgICAgICAgICAgICAgY2xvc2VzdC5keSA9IGR5O1xuXG4gICAgICAgICAgICAgICAgc3RhdHVzLnJhbmdlID0gcmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc25hcENoYW5nZWQ7XG5cbiAgICAgICAgaWYgKGNsb3Nlc3QudGFyZ2V0KSB7XG4gICAgICAgICAgICBzbmFwQ2hhbmdlZCA9IChzdGF0dXMuc25hcHBlZFggIT09IGNsb3Nlc3QudGFyZ2V0LnggfHwgc3RhdHVzLnNuYXBwZWRZICE9PSBjbG9zZXN0LnRhcmdldC55KTtcblxuICAgICAgICAgICAgc3RhdHVzLnNuYXBwZWRYID0gY2xvc2VzdC50YXJnZXQueDtcbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWSA9IGNsb3Nlc3QudGFyZ2V0Lnk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzbmFwQ2hhbmdlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWCA9IE5hTjtcbiAgICAgICAgICAgIHN0YXR1cy5zbmFwcGVkWSA9IE5hTjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cy5keCA9IGNsb3Nlc3QuZHg7XG4gICAgICAgIHN0YXR1cy5keSA9IGNsb3Nlc3QuZHk7XG5cbiAgICAgICAgc3RhdHVzLmNoYW5nZWQgPSAoc25hcENoYW5nZWQgfHwgKGNsb3Nlc3QuaW5SYW5nZSAmJiAhc3RhdHVzLmxvY2tlZCkpO1xuICAgICAgICBzdGF0dXMubG9ja2VkID0gY2xvc2VzdC5pblJhbmdlO1xuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIHNldFJlc3RyaWN0aW9uOiBmdW5jdGlvbiAocGFnZUNvb3Jkcywgc3RhdHVzKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICAgICAgICAgIHJlc3RyaWN0ID0gdGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0ucmVzdHJpY3QsXG4gICAgICAgICAgICByZXN0cmljdGlvbiA9IHJlc3RyaWN0ICYmIHJlc3RyaWN0LnJlc3RyaWN0aW9uLFxuICAgICAgICAgICAgcGFnZTtcblxuICAgICAgICBpZiAoIXJlc3RyaWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzID0gc3RhdHVzIHx8IHRoaXMucmVzdHJpY3RTdGF0dXM7XG5cbiAgICAgICAgcGFnZSA9IHN0YXR1cy51c2VTdGF0dXNYWVxuICAgICAgICAgICAgPyBwYWdlID0geyB4OiBzdGF0dXMueCwgeTogc3RhdHVzLnkgfVxuICAgICAgICAgICAgOiBwYWdlID0gdXRpbHMuZXh0ZW5kKHt9LCBwYWdlQ29vcmRzKTtcblxuICAgICAgICBpZiAoc3RhdHVzLnNuYXAgJiYgc3RhdHVzLnNuYXAubG9ja2VkKSB7XG4gICAgICAgICAgICBwYWdlLnggKz0gc3RhdHVzLnNuYXAuZHggfHwgMDtcbiAgICAgICAgICAgIHBhZ2UueSArPSBzdGF0dXMuc25hcC5keSB8fCAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFnZS54IC09IHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeDtcbiAgICAgICAgcGFnZS55IC09IHRoaXMuaW5lcnRpYVN0YXR1cy5yZXN1bWVEeTtcblxuICAgICAgICBzdGF0dXMuZHggPSAwO1xuICAgICAgICBzdGF0dXMuZHkgPSAwO1xuICAgICAgICBzdGF0dXMucmVzdHJpY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgIHZhciByZWN0LCByZXN0cmljdGVkWCwgcmVzdHJpY3RlZFk7XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzU3RyaW5nKHJlc3RyaWN0aW9uKSkge1xuICAgICAgICAgICAgaWYgKHJlc3RyaWN0aW9uID09PSAncGFyZW50Jykge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gc2NvcGUucGFyZW50RWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocmVzdHJpY3Rpb24gPT09ICdzZWxmJykge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gdGFyZ2V0LmdldFJlY3QodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gc2NvcGUuY2xvc2VzdCh0aGlzLmVsZW1lbnQsIHJlc3RyaWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFyZXN0cmljdGlvbikgeyByZXR1cm4gc3RhdHVzOyB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2NvcGUuaXNGdW5jdGlvbihyZXN0cmljdGlvbikpIHtcbiAgICAgICAgICAgIHJlc3RyaWN0aW9uID0gcmVzdHJpY3Rpb24ocGFnZS54LCBwYWdlLnksIHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbHMuaXNFbGVtZW50KHJlc3RyaWN0aW9uKSkge1xuICAgICAgICAgICAgcmVzdHJpY3Rpb24gPSBzY29wZS5nZXRFbGVtZW50UmVjdChyZXN0cmljdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICByZWN0ID0gcmVzdHJpY3Rpb247XG5cbiAgICAgICAgaWYgKCFyZXN0cmljdGlvbikge1xuICAgICAgICAgICAgcmVzdHJpY3RlZFggPSBwYWdlLng7XG4gICAgICAgICAgICByZXN0cmljdGVkWSA9IHBhZ2UueTtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgaXMgYXNzdW1lZCB0byBoYXZlXG4gICAgICAgIC8vIHgsIHksIHdpZHRoLCBoZWlnaHQgb3JcbiAgICAgICAgLy8gbGVmdCwgdG9wLCByaWdodCwgYm90dG9tXG4gICAgICAgIGVsc2UgaWYgKCd4JyBpbiByZXN0cmljdGlvbiAmJiAneScgaW4gcmVzdHJpY3Rpb24pIHtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRYID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC54ICsgcmVjdC53aWR0aCAgLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnJpZ2h0ICwgcGFnZS54KSwgcmVjdC54ICsgdGhpcy5yZXN0cmljdE9mZnNldC5sZWZ0KTtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRZID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC55ICsgcmVjdC5oZWlnaHQgLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSwgcGFnZS55KSwgcmVjdC55ICsgdGhpcy5yZXN0cmljdE9mZnNldC50b3AgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRYID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC5yaWdodCAgLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LnJpZ2h0ICwgcGFnZS54KSwgcmVjdC5sZWZ0ICsgdGhpcy5yZXN0cmljdE9mZnNldC5sZWZ0KTtcbiAgICAgICAgICAgIHJlc3RyaWN0ZWRZID0gTWF0aC5tYXgoTWF0aC5taW4ocmVjdC5ib3R0b20gLSB0aGlzLnJlc3RyaWN0T2Zmc2V0LmJvdHRvbSwgcGFnZS55KSwgcmVjdC50b3AgICsgdGhpcy5yZXN0cmljdE9mZnNldC50b3AgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cy5keCA9IHJlc3RyaWN0ZWRYIC0gcGFnZS54O1xuICAgICAgICBzdGF0dXMuZHkgPSByZXN0cmljdGVkWSAtIHBhZ2UueTtcblxuICAgICAgICBzdGF0dXMuY2hhbmdlZCA9IHN0YXR1cy5yZXN0cmljdGVkWCAhPT0gcmVzdHJpY3RlZFggfHwgc3RhdHVzLnJlc3RyaWN0ZWRZICE9PSByZXN0cmljdGVkWTtcbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWQgPSAhIShzdGF0dXMuZHggfHwgc3RhdHVzLmR5KTtcblxuICAgICAgICBzdGF0dXMucmVzdHJpY3RlZFggPSByZXN0cmljdGVkWDtcbiAgICAgICAgc3RhdHVzLnJlc3RyaWN0ZWRZID0gcmVzdHJpY3RlZFk7XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2hlY2tBbmRQcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24gKGV2ZW50LCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKCEoaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlIHx8IHRoaXMudGFyZ2V0KSkgeyByZXR1cm47IH1cblxuICAgICAgICB2YXIgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zLFxuICAgICAgICAgICAgcHJldmVudCA9IG9wdGlvbnMucHJldmVudERlZmF1bHQ7XG5cbiAgICAgICAgaWYgKHByZXZlbnQgPT09ICdhdXRvJyAmJiBlbGVtZW50ICYmICEvXihpbnB1dHxzZWxlY3R8dGV4dGFyZWEpJC9pLnRlc3QoZXZlbnQudGFyZ2V0Lm5vZGVOYW1lKSkge1xuICAgICAgICAgICAgLy8gZG8gbm90IHByZXZlbnREZWZhdWx0IG9uIHBvaW50ZXJkb3duIGlmIHRoZSBwcmVwYXJlZCBhY3Rpb24gaXMgYSBkcmFnXG4gICAgICAgICAgICAvLyBhbmQgZHJhZ2dpbmcgY2FuIG9ubHkgc3RhcnQgZnJvbSBhIGNlcnRhaW4gZGlyZWN0aW9uIC0gdGhpcyBhbGxvd3NcbiAgICAgICAgICAgIC8vIGEgdG91Y2ggdG8gcGFuIHRoZSB2aWV3cG9ydCBpZiBhIGRyYWcgaXNuJ3QgaW4gdGhlIHJpZ2h0IGRpcmVjdGlvblxuICAgICAgICAgICAgaWYgKC9kb3dufHN0YXJ0L2kudGVzdChldmVudC50eXBlKVxuICAgICAgICAgICAgICAgICYmIHRoaXMucHJlcGFyZWQubmFtZSA9PT0gJ2RyYWcnICYmIG9wdGlvbnMuZHJhZy5heGlzICE9PSAneHknKSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHdpdGggbWFudWFsU3RhcnQsIG9ubHkgcHJldmVudERlZmF1bHQgd2hpbGUgaW50ZXJhY3RpbmdcbiAgICAgICAgICAgIGlmIChvcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0gJiYgb3B0aW9uc1t0aGlzLnByZXBhcmVkLm5hbWVdLm1hbnVhbFN0YXJ0XG4gICAgICAgICAgICAgICAgJiYgIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmV2ZW50ID09PSAnYWx3YXlzJykge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjYWxjSW5lcnRpYTogZnVuY3Rpb24gKHN0YXR1cykge1xuICAgICAgICB2YXIgaW5lcnRpYU9wdGlvbnMgPSB0aGlzLnRhcmdldC5vcHRpb25zW3RoaXMucHJlcGFyZWQubmFtZV0uaW5lcnRpYSxcbiAgICAgICAgICAgIGxhbWJkYSA9IGluZXJ0aWFPcHRpb25zLnJlc2lzdGFuY2UsXG4gICAgICAgICAgICBpbmVydGlhRHVyID0gLU1hdGgubG9nKGluZXJ0aWFPcHRpb25zLmVuZFNwZWVkIC8gc3RhdHVzLnYwKSAvIGxhbWJkYTtcblxuICAgICAgICBzdGF0dXMueDAgPSB0aGlzLnByZXZFdmVudC5wYWdlWDtcbiAgICAgICAgc3RhdHVzLnkwID0gdGhpcy5wcmV2RXZlbnQucGFnZVk7XG4gICAgICAgIHN0YXR1cy50MCA9IHN0YXR1cy5zdGFydEV2ZW50LnRpbWVTdGFtcCAvIDEwMDA7XG4gICAgICAgIHN0YXR1cy5zeCA9IHN0YXR1cy5zeSA9IDA7XG5cbiAgICAgICAgc3RhdHVzLm1vZGlmaWVkWGUgPSBzdGF0dXMueGUgPSAoc3RhdHVzLnZ4MCAtIGluZXJ0aWFEdXIpIC8gbGFtYmRhO1xuICAgICAgICBzdGF0dXMubW9kaWZpZWRZZSA9IHN0YXR1cy55ZSA9IChzdGF0dXMudnkwIC0gaW5lcnRpYUR1cikgLyBsYW1iZGE7XG4gICAgICAgIHN0YXR1cy50ZSA9IGluZXJ0aWFEdXI7XG5cbiAgICAgICAgc3RhdHVzLmxhbWJkYV92MCA9IGxhbWJkYSAvIHN0YXR1cy52MDtcbiAgICAgICAgc3RhdHVzLm9uZV92ZV92MCA9IDEgLSBpbmVydGlhT3B0aW9ucy5lbmRTcGVlZCAvIHN0YXR1cy52MDtcbiAgICB9LFxuXG4gICAgYXV0b1Njcm9sbE1vdmU6IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgICAgIGlmICghKHRoaXMuaW50ZXJhY3RpbmcoKVxuICAgICAgICAgICAgJiYgc2NvcGUuY2hlY2tBdXRvU2Nyb2xsKHRoaXMudGFyZ2V0LCB0aGlzLnByZXBhcmVkLm5hbWUpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaW5lcnRpYVN0YXR1cy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHNjb3BlLmF1dG9TY3JvbGwueCA9IHNjb3BlLmF1dG9TY3JvbGwueSA9IDA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9wLFxuICAgICAgICAgICAgcmlnaHQsXG4gICAgICAgICAgICBib3R0b20sXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnNbdGhpcy5wcmVwYXJlZC5uYW1lXS5hdXRvU2Nyb2xsLFxuICAgICAgICAgICAgY29udGFpbmVyID0gb3B0aW9ucy5jb250YWluZXIgfHwgc2NvcGUuZ2V0V2luZG93KHRoaXMuZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKHNjb3BlLmlzV2luZG93KGNvbnRhaW5lcikpIHtcbiAgICAgICAgICAgIGxlZnQgICA9IHBvaW50ZXIuY2xpZW50WCA8IHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgdG9wICAgID0gcG9pbnRlci5jbGllbnRZIDwgc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICByaWdodCAgPSBwb2ludGVyLmNsaWVudFggPiBjb250YWluZXIuaW5uZXJXaWR0aCAgLSBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIGJvdHRvbSA9IHBvaW50ZXIuY2xpZW50WSA+IGNvbnRhaW5lci5pbm5lckhlaWdodCAtIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlY3QgPSBzY29wZS5nZXRFbGVtZW50UmVjdChjb250YWluZXIpO1xuXG4gICAgICAgICAgICBsZWZ0ICAgPSBwb2ludGVyLmNsaWVudFggPCByZWN0LmxlZnQgICArIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICAgICAgdG9wICAgID0gcG9pbnRlci5jbGllbnRZIDwgcmVjdC50b3AgICAgKyBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbjtcbiAgICAgICAgICAgIHJpZ2h0ICA9IHBvaW50ZXIuY2xpZW50WCA+IHJlY3QucmlnaHQgIC0gc2NvcGUuYXV0b1Njcm9sbC5tYXJnaW47XG4gICAgICAgICAgICBib3R0b20gPSBwb2ludGVyLmNsaWVudFkgPiByZWN0LmJvdHRvbSAtIHNjb3BlLmF1dG9TY3JvbGwubWFyZ2luO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC54ID0gKHJpZ2h0ID8gMTogbGVmdD8gLTE6IDApO1xuICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnkgPSAoYm90dG9tPyAxOiAgdG9wPyAtMTogMCk7XG5cbiAgICAgICAgaWYgKCFzY29wZS5hdXRvU2Nyb2xsLmlzU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICAvLyBzZXQgdGhlIGF1dG9TY3JvbGwgcHJvcGVydGllcyB0byB0aG9zZSBvZiB0aGUgdGFyZ2V0XG4gICAgICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLm1hcmdpbiA9IG9wdGlvbnMubWFyZ2luO1xuICAgICAgICAgICAgc2NvcGUuYXV0b1Njcm9sbC5zcGVlZCAgPSBvcHRpb25zLnNwZWVkO1xuXG4gICAgICAgICAgICBzY29wZS5hdXRvU2Nyb2xsLnN0YXJ0KHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF91cGRhdGVFdmVudFRhcmdldHM6IGZ1bmN0aW9uICh0YXJnZXQsIGN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRUYXJnZXQgICAgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMuX2N1ckV2ZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldDtcbiAgICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW50ZXJhY3Rpb247IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFmICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9yYWYnKSxcbiAgICBnZXRXaW5kb3cgPSByZXF1aXJlKCcuL3V0aWxzL3dpbmRvdycpLmdldFdpbmRvdyxcbiAgICBpc1dpbmRvdyAgPSByZXF1aXJlKCcuL3V0aWxzL2lzVHlwZScpLmlzV2luZG93O1xuXG52YXIgYXV0b1Njcm9sbCA9IHtcblxuICAgIGludGVyYWN0aW9uOiBudWxsLFxuICAgIGk6IG51bGwsICAgIC8vIHRoZSBoYW5kbGUgcmV0dXJuZWQgYnkgd2luZG93LnNldEludGVydmFsXG4gICAgeDogMCwgeTogMCwgLy8gRGlyZWN0aW9uIGVhY2ggcHVsc2UgaXMgdG8gc2Nyb2xsIGluXG5cbiAgICBpc1Njcm9sbGluZzogZmFsc2UsXG4gICAgcHJldlRpbWU6IDAsXG5cbiAgICBzdGFydDogZnVuY3Rpb24gKGludGVyYWN0aW9uKSB7XG4gICAgICAgIGF1dG9TY3JvbGwuaXNTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICByYWYuY2FuY2VsKGF1dG9TY3JvbGwuaSk7XG5cbiAgICAgICAgYXV0b1Njcm9sbC5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGF1dG9TY3JvbGwuaSA9IHJhZi5yZXF1ZXN0KGF1dG9TY3JvbGwuc2Nyb2xsKTtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBhdXRvU2Nyb2xsLmlzU2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIHJhZi5jYW5jZWwoYXV0b1Njcm9sbC5pKTtcbiAgICB9LFxuXG4gICAgLy8gc2Nyb2xsIHRoZSB3aW5kb3cgYnkgdGhlIHZhbHVlcyBpbiBzY3JvbGwueC95XG4gICAgc2Nyb2xsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi50YXJnZXQub3B0aW9uc1thdXRvU2Nyb2xsLmludGVyYWN0aW9uLnByZXBhcmVkLm5hbWVdLmF1dG9TY3JvbGwsXG4gICAgICAgICAgICBjb250YWluZXIgPSBvcHRpb25zLmNvbnRhaW5lciB8fCBnZXRXaW5kb3coYXV0b1Njcm9sbC5pbnRlcmFjdGlvbi5lbGVtZW50KSxcbiAgICAgICAgICAgIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgLy8gY2hhbmdlIGluIHRpbWUgaW4gc2Vjb25kc1xuICAgICAgICAgICAgZHQgPSAobm93IC0gYXV0b1Njcm9sbC5wcmV2VGltZSkgLyAxMDAwLFxuICAgICAgICAgICAgLy8gZGlzcGxhY2VtZW50XG4gICAgICAgICAgICBzID0gb3B0aW9ucy5zcGVlZCAqIGR0O1xuXG4gICAgICAgIGlmIChzID49IDEpIHtcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhjb250YWluZXIpKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbEJ5KGF1dG9TY3JvbGwueCAqIHMsIGF1dG9TY3JvbGwueSAqIHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbExlZnQgKz0gYXV0b1Njcm9sbC54ICogcztcbiAgICAgICAgICAgICAgICBjb250YWluZXIuc2Nyb2xsVG9wICArPSBhdXRvU2Nyb2xsLnkgKiBzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXRvU2Nyb2xsLnByZXZUaW1lID0gbm93O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGF1dG9TY3JvbGwuaXNTY3JvbGxpbmcpIHtcbiAgICAgICAgICAgIHJhZi5jYW5jZWwoYXV0b1Njcm9sbC5pKTtcbiAgICAgICAgICAgIGF1dG9TY3JvbGwuaSA9IHJhZi5yZXF1ZXN0KGF1dG9TY3JvbGwuc2Nyb2xsKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXV0b1Njcm9sbDtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYmFzZToge1xuICAgICAgICBhY2NlcHQgICAgICAgIDogbnVsbCxcbiAgICAgICAgYWN0aW9uQ2hlY2tlciA6IG51bGwsXG4gICAgICAgIHN0eWxlQ3Vyc29yICAgOiB0cnVlLFxuICAgICAgICBwcmV2ZW50RGVmYXVsdDogJ2F1dG8nLFxuICAgICAgICBvcmlnaW4gICAgICAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIGRlbHRhU291cmNlICAgOiAncGFnZScsXG4gICAgICAgIGFsbG93RnJvbSAgICAgOiBudWxsLFxuICAgICAgICBpZ25vcmVGcm9tICAgIDogbnVsbCxcbiAgICAgICAgX2NvbnRleHQgICAgICA6IHJlcXVpcmUoJy4vdXRpbHMvZG9tT2JqZWN0cycpLmRvY3VtZW50LFxuICAgICAgICBkcm9wQ2hlY2tlciAgIDogbnVsbFxuICAgIH0sXG5cbiAgICBkcmFnOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBtYW51YWxTdGFydDogdHJ1ZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiBudWxsLFxuICAgICAgICByZXN0cmljdDogbnVsbCxcbiAgICAgICAgaW5lcnRpYTogbnVsbCxcbiAgICAgICAgYXV0b1Njcm9sbDogbnVsbCxcblxuICAgICAgICBheGlzOiAneHknLFxuICAgIH0sXG5cbiAgICBkcm9wOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBhY2NlcHQ6IG51bGwsXG4gICAgICAgIG92ZXJsYXA6ICdwb2ludGVyJ1xuICAgIH0sXG5cbiAgICByZXNpemU6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiBudWxsLFxuICAgICAgICByZXN0cmljdDogbnVsbCxcbiAgICAgICAgaW5lcnRpYTogbnVsbCxcbiAgICAgICAgYXV0b1Njcm9sbDogbnVsbCxcblxuICAgICAgICBzcXVhcmU6IGZhbHNlLFxuICAgICAgICBheGlzOiAneHknLFxuXG4gICAgICAgIC8vIHVzZSBkZWZhdWx0IG1hcmdpblxuICAgICAgICBtYXJnaW46IE5hTixcblxuICAgICAgICAvLyBvYmplY3Qgd2l0aCBwcm9wcyBsZWZ0LCByaWdodCwgdG9wLCBib3R0b20gd2hpY2ggYXJlXG4gICAgICAgIC8vIHRydWUvZmFsc2UgdmFsdWVzIHRvIHJlc2l6ZSB3aGVuIHRoZSBwb2ludGVyIGlzIG92ZXIgdGhhdCBlZGdlLFxuICAgICAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgICAgICAvLyBvciB0aGUgRWxlbWVudHMgZm9yIGVhY2ggaGFuZGxlXG4gICAgICAgIGVkZ2VzOiBudWxsLFxuXG4gICAgICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAgICAgLy8gJ25lZ2F0ZScgd2lsbCBhbG93IHRoZSByZWN0IHRvIGhhdmUgbmVnYXRpdmUgd2lkdGgvaGVpZ2h0XG4gICAgICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgICAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgICAgICBpbnZlcnQ6ICdub25lJ1xuICAgIH0sXG5cbiAgICBnZXN0dXJlOiB7XG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIG1heDogSW5maW5pdHksXG4gICAgICAgIG1heFBlckVsZW1lbnQ6IDEsXG5cbiAgICAgICAgcmVzdHJpY3Q6IG51bGxcbiAgICB9LFxuXG4gICAgcGVyQWN0aW9uOiB7XG4gICAgICAgIG1hbnVhbFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgICAgbWF4UGVyRWxlbWVudDogMSxcblxuICAgICAgICBzbmFwOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgZW5kT25seSAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIHJhbmdlICAgICAgIDogSW5maW5pdHksXG4gICAgICAgICAgICB0YXJnZXRzICAgICA6IG51bGwsXG4gICAgICAgICAgICBvZmZzZXRzICAgICA6IG51bGwsXG5cbiAgICAgICAgICAgIHJlbGF0aXZlUG9pbnRzOiBudWxsXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzdHJpY3Q6IHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgZW5kT25seTogZmFsc2VcbiAgICAgICAgfSxcblxuICAgICAgICBhdXRvU2Nyb2xsOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgY29udGFpbmVyICAgOiBudWxsLCAgICAgLy8gdGhlIGl0ZW0gdGhhdCBpcyBzY3JvbGxlZCAoV2luZG93IG9yIEhUTUxFbGVtZW50KVxuICAgICAgICAgICAgbWFyZ2luICAgICAgOiA2MCxcbiAgICAgICAgICAgIHNwZWVkICAgICAgIDogMzAwICAgICAgIC8vIHRoZSBzY3JvbGwgc3BlZWQgaW4gcGl4ZWxzIHBlciBzZWNvbmRcbiAgICAgICAgfSxcblxuICAgICAgICBpbmVydGlhOiB7XG4gICAgICAgICAgICBlbmFibGVkICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICByZXNpc3RhbmNlICAgICAgIDogMTAsICAgIC8vIHRoZSBsYW1iZGEgaW4gZXhwb25lbnRpYWwgZGVjYXlcbiAgICAgICAgICAgIG1pblNwZWVkICAgICAgICAgOiAxMDAsICAgLy8gdGFyZ2V0IHNwZWVkIG11c3QgYmUgYWJvdmUgdGhpcyBmb3IgaW5lcnRpYSB0byBzdGFydFxuICAgICAgICAgICAgZW5kU3BlZWQgICAgICAgICA6IDEwLCAgICAvLyB0aGUgc3BlZWQgYXQgd2hpY2ggaW5lcnRpYSBpcyBzbG93IGVub3VnaCB0byBzdG9wXG4gICAgICAgICAgICBhbGxvd1Jlc3VtZSAgICAgIDogdHJ1ZSwgIC8vIGFsbG93IHJlc3VtaW5nIGFuIGFjdGlvbiBpbiBpbmVydGlhIHBoYXNlXG4gICAgICAgICAgICB6ZXJvUmVzdW1lRGVsdGEgIDogdHJ1ZSwgIC8vIGlmIGFuIGFjdGlvbiBpcyByZXN1bWVkIGFmdGVyIGxhdW5jaCwgc2V0IGR4L2R5IHRvIDBcbiAgICAgICAgICAgIHNtb290aEVuZER1cmF0aW9uOiAzMDAgICAgLy8gYW5pbWF0ZSB0byBzbmFwL3Jlc3RyaWN0IGVuZE9ubHkgaWYgdGhlcmUncyBubyBpbmVydGlhXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2hvbGREdXJhdGlvbjogNjAwXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2NvcGUgPSB7fSxcbiAgICBleHRlbmQgPSByZXF1aXJlKCcuL3V0aWxzL2V4dGVuZCcpO1xuXG5leHRlbmQoc2NvcGUsIHJlcXVpcmUoJy4vdXRpbHMvd2luZG93JykpO1xuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL2RvbU9iamVjdHMnKSk7XG5leHRlbmQoc2NvcGUsIHJlcXVpcmUoJy4vdXRpbHMvYXJyLmpzJykpO1xuZXh0ZW5kKHNjb3BlLCByZXF1aXJlKCcuL3V0aWxzL2lzVHlwZScpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzY29wZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaW5kZXhPZiAoYXJyYXksIHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoYXJyYXlbaV0gPT09IHRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zIChhcnJheSwgdGFyZ2V0KSB7XG4gICAgcmV0dXJuIGluZGV4T2YoYXJyYXksIHRhcmdldCkgIT09IC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbmRleE9mOiBpbmRleE9mLFxuICAgIGNvbnRhaW5zOiBjb250YWluc1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93JyksXG4gICAgZG9tT2JqZWN0cyA9IHJlcXVpcmUoJy4vZG9tT2JqZWN0cycpO1xuXG52YXIgYnJvd3NlciA9IHtcbiAgICAvLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgdG91Y2ggaW5wdXQ/XG4gICAgc3VwcG9ydHNUb3VjaCA6ICEhKCgnb250b3VjaHN0YXJ0JyBpbiB3aW4pIHx8IHdpbi53aW5kb3cuRG9jdW1lbnRUb3VjaFxuICAgICAgICAmJiBkb21PYmplY3RzLmRvY3VtZW50IGluc3RhbmNlb2Ygd2luLkRvY3VtZW50VG91Y2gpLFxuXG4gICAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IFBvaW50ZXJFdmVudHNcbiAgICBzdXBwb3J0c1BvaW50ZXJFdmVudCA6ICEhZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQsXG5cbiAgICAvLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gICAgaXNPcGVyYU1vYmlsZSA6IChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ09wZXJhJ1xuICAgICAgICAmJiBicm93c2VyLnN1cHBvcnRzVG91Y2hcbiAgICAgICAgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgnUHJlc3RvJykpLFxuXG4gICAgLy8gc2Nyb2xsaW5nIGRvZXNuJ3QgY2hhbmdlIHRoZSByZXN1bHQgb2ZcbiAgICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QvZ2V0Q2xpZW50UmVjdHMgb24gaU9TIDw9NyBidXQgaXQgZG9lcyBvbiBpT1MgOFxuICAgIGlzSU9TN29yTG93ZXIgOiAoL2lQKGhvbmV8b2R8YWQpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkgJiYgL09TIFsxLTddW15cXGRdLy50ZXN0KG5hdmlnYXRvci5hcHBWZXJzaW9uKSksXG5cbiAgICBpc0llOU9yT2xkZXIgOiBkb21PYmplY3RzLmRvY3VtZW50LmFsbCAmJiAhd2luLndpbmRvdy5hdG9iXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJyb3dzZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb21PYmplY3RzID0ge30sXG4gICAgd2luID0gcmVxdWlyZSgnLi93aW5kb3cnKS53aW5kb3csXG4gICAgYmxhbmsgPSBmdW5jdGlvbiAoKSB7fTtcblxuZG9tT2JqZWN0cy5kb2N1bWVudCAgICAgICAgICAgPSB3aW4uZG9jdW1lbnQ7XG5kb21PYmplY3RzLkRvY3VtZW50RnJhZ21lbnQgICA9IHdpbi5Eb2N1bWVudEZyYWdtZW50ICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR0VsZW1lbnQgICAgICAgICA9IHdpbi5TVkdFbGVtZW50ICAgICAgICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR1NWR0VsZW1lbnQgICAgICA9IHdpbi5TVkdTVkdFbGVtZW50ICAgICAgfHwgYmxhbms7XG5kb21PYmplY3RzLlNWR0VsZW1lbnRJbnN0YW5jZSA9IHdpbi5TVkdFbGVtZW50SW5zdGFuY2UgfHwgYmxhbms7XG5kb21PYmplY3RzLkhUTUxFbGVtZW50ICAgICAgICA9IHdpbi5IVE1MRWxlbWVudCAgICAgICAgfHwgd2luLkVsZW1lbnQ7XG5cbmRvbU9iamVjdHMuUG9pbnRlckV2ZW50ID0gKHdpbi5Qb2ludGVyRXZlbnQgfHwgd2luLk1TUG9pbnRlckV2ZW50KTtcblxubW9kdWxlLmV4cG9ydHMgPSBkb21PYmplY3RzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXJyID0gcmVxdWlyZSgnLi9hcnInKSxcbiAgICBpbmRleE9mICA9IGFyci5pbmRleE9mLFxuICAgIGNvbnRhaW5zID0gYXJyLmNvbnRhaW5zLFxuICAgIGdldFdpbmRvdyA9IHJlcXVpcmUoJy4vd2luZG93JykuZ2V0V2luZG93LFxuXG4gICAgdXNlQXR0YWNoRXZlbnQgPSAoJ2F0dGFjaEV2ZW50JyBpbiB3aW5kb3cpICYmICEoJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyksXG4gICAgYWRkRXZlbnQgICAgICAgPSB1c2VBdHRhY2hFdmVudD8gICdhdHRhY2hFdmVudCc6ICdhZGRFdmVudExpc3RlbmVyJyxcbiAgICByZW1vdmVFdmVudCAgICA9IHVzZUF0dGFjaEV2ZW50PyAgJ2RldGFjaEV2ZW50JzogJ3JlbW92ZUV2ZW50TGlzdGVuZXInLFxuICAgIG9uICAgICAgICAgICAgID0gdXNlQXR0YWNoRXZlbnQ/ICdvbic6ICcnLFxuXG4gICAgZWxlbWVudHMgICAgICAgICAgPSBbXSxcbiAgICB0YXJnZXRzICAgICAgICAgICA9IFtdLFxuICAgIGF0dGFjaGVkTGlzdGVuZXJzID0gW107XG5cbmZ1bmN0aW9uIGFkZCAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICB2YXIgZWxlbWVudEluZGV4ID0gaW5kZXhPZihlbGVtZW50cywgZWxlbWVudCksXG4gICAgICAgIHRhcmdldCA9IHRhcmdldHNbZWxlbWVudEluZGV4XTtcblxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHRhcmdldCA9IHtcbiAgICAgICAgICAgIGV2ZW50czoge30sXG4gICAgICAgICAgICB0eXBlQ291bnQ6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBlbGVtZW50SW5kZXggPSBlbGVtZW50cy5wdXNoKGVsZW1lbnQpIC0gMTtcbiAgICAgICAgdGFyZ2V0cy5wdXNoKHRhcmdldCk7XG5cbiAgICAgICAgYXR0YWNoZWRMaXN0ZW5lcnMucHVzaCgodXNlQXR0YWNoRXZlbnQgPyB7XG4gICAgICAgICAgICAgICAgc3VwcGxpZWQ6IFtdLFxuICAgICAgICAgICAgICAgIHdyYXBwZWQgOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VDb3VudDogW11cbiAgICAgICAgICAgIH0gOiBudWxsKSk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXQuZXZlbnRzW3R5cGVdKSB7XG4gICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0gPSBbXTtcbiAgICAgICAgdGFyZ2V0LnR5cGVDb3VudCsrO1xuICAgIH1cblxuICAgIGlmICghY29udGFpbnModGFyZ2V0LmV2ZW50c1t0eXBlXSwgbGlzdGVuZXIpKSB7XG4gICAgICAgIHZhciByZXQ7XG5cbiAgICAgICAgaWYgKHVzZUF0dGFjaEV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gYXR0YWNoZWRMaXN0ZW5lcnNbZWxlbWVudEluZGV4XSxcbiAgICAgICAgICAgICAgICBsaXN0ZW5lckluZGV4ID0gaW5kZXhPZihsaXN0ZW5lcnMuc3VwcGxpZWQsIGxpc3RlbmVyKTtcblxuICAgICAgICAgICAgdmFyIHdyYXBwZWQgPSBsaXN0ZW5lcnMud3JhcHBlZFtsaXN0ZW5lckluZGV4XSB8fCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBldmVudC5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0IHx8IHByZXZlbnREZWY7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IGV2ZW50LnN0b3BQcm9wYWdhdGlvbiB8fCBzdG9wUHJvcDtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIHx8IHN0b3BJbW1Qcm9wO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICgvbW91c2V8Y2xpY2svLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYID0gZXZlbnQuY2xpZW50WCArIGdldFdpbmRvdyhlbGVtZW50KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZID0gZXZlbnQuY2xpZW50WSArIGdldFdpbmRvdyhlbGVtZW50KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldCA9IGVsZW1lbnRbYWRkRXZlbnRdKG9uICsgdHlwZSwgd3JhcHBlZCwgQm9vbGVhbih1c2VDYXB0dXJlKSk7XG5cbiAgICAgICAgICAgIGlmIChsaXN0ZW5lckluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zdXBwbGllZC5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMud3JhcHBlZC5wdXNoKHdyYXBwZWQpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy51c2VDb3VudC5wdXNoKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnVzZUNvdW50W2xpc3RlbmVySW5kZXhdKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXQgPSBlbGVtZW50W2FkZEV2ZW50XSh0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0LmV2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlIChlbGVtZW50LCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgIHZhciBpLFxuICAgICAgICBlbGVtZW50SW5kZXggPSBpbmRleE9mKGVsZW1lbnRzLCBlbGVtZW50KSxcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0c1tlbGVtZW50SW5kZXhdLFxuICAgICAgICBsaXN0ZW5lcnMsXG4gICAgICAgIGxpc3RlbmVySW5kZXgsXG4gICAgICAgIHdyYXBwZWQgPSBsaXN0ZW5lcjtcblxuICAgIGlmICghdGFyZ2V0IHx8ICF0YXJnZXQuZXZlbnRzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodXNlQXR0YWNoRXZlbnQpIHtcbiAgICAgICAgbGlzdGVuZXJzID0gYXR0YWNoZWRMaXN0ZW5lcnNbZWxlbWVudEluZGV4XTtcbiAgICAgICAgbGlzdGVuZXJJbmRleCA9IGluZGV4T2YobGlzdGVuZXJzLnN1cHBsaWVkLCBsaXN0ZW5lcik7XG4gICAgICAgIHdyYXBwZWQgPSBsaXN0ZW5lcnMud3JhcHBlZFtsaXN0ZW5lckluZGV4XTtcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gJ2FsbCcpIHtcbiAgICAgICAgZm9yICh0eXBlIGluIHRhcmdldC5ldmVudHMpIHtcbiAgICAgICAgICAgIGlmICh0YXJnZXQuZXZlbnRzLmhhc093blByb3BlcnR5KHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlKGVsZW1lbnQsIHR5cGUsICdhbGwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRhcmdldC5ldmVudHNbdHlwZV0pIHtcbiAgICAgICAgdmFyIGxlbiA9IHRhcmdldC5ldmVudHNbdHlwZV0ubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsaXN0ZW5lciA9PT0gJ2FsbCcpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHJlbW92ZShlbGVtZW50LCB0eXBlLCB0YXJnZXQuZXZlbnRzW3R5cGVdW2ldLCBCb29sZWFuKHVzZUNhcHR1cmUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuZXZlbnRzW3R5cGVdW2ldID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50W3JlbW92ZUV2ZW50XShvbiArIHR5cGUsIHdyYXBwZWQsIHVzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuZXZlbnRzW3R5cGVdLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlQXR0YWNoRXZlbnQgJiYgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0tLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMudXNlQ291bnRbbGlzdGVuZXJJbmRleF0gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3VwcGxpZWQuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy53cmFwcGVkLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMudXNlQ291bnQuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRhcmdldC5ldmVudHNbdHlwZV0gJiYgdGFyZ2V0LmV2ZW50c1t0eXBlXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRhcmdldC5ldmVudHNbdHlwZV0gPSBudWxsO1xuICAgICAgICAgICAgdGFyZ2V0LnR5cGVDb3VudC0tO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXQudHlwZUNvdW50KSB7XG4gICAgICAgIHRhcmdldHMuc3BsaWNlKGVsZW1lbnRJbmRleCwgMSk7XG4gICAgICAgIGVsZW1lbnRzLnNwbGljZShlbGVtZW50SW5kZXgsIDEpO1xuICAgICAgICBhdHRhY2hlZExpc3RlbmVycy5zcGxpY2UoZWxlbWVudEluZGV4LCAxKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHByZXZlbnREZWYgKCkge1xuICAgIHRoaXMucmV0dXJuVmFsdWUgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc3RvcFByb3AgKCkge1xuICAgIHRoaXMuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc3RvcEltbVByb3AgKCkge1xuICAgIHRoaXMuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICB0aGlzLmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlLFxuICAgIHVzZUF0dGFjaEV2ZW50OiB1c2VBdHRhY2hFdmVudCxcblxuICAgIF9lbGVtZW50czogZWxlbWVudHMsXG4gICAgX3RhcmdldHM6IHRhcmdldHMsXG4gICAgX2F0dGFjaGVkTGlzdGVuZXJzOiBhdHRhY2hlZExpc3RlbmVyc1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQgKGRlc3QsIHNvdXJjZSkge1xuICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGRlc3RbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBoeXBvdCAoeCwgeSkgeyByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpOyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSB7fSxcbiAgICBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpLFxuICAgIHdpbiA9IHJlcXVpcmUoJy4vd2luZG93Jyk7XG5cbnV0aWxzLmJsYW5rICA9IGZ1bmN0aW9uICgpIHt9O1xuXG51dGlscy53YXJuT25jZSA9IGZ1bmN0aW9uIChtZXRob2QsIG1lc3NhZ2UpIHtcbiAgICB2YXIgd2FybmVkID0gZmFsc2U7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgICAgICAgd2luLndpbmRvdy5jb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICAgICAgICB3YXJuZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG59O1xuXG51dGlscy5leHRlbmQgID0gZXh0ZW5kO1xudXRpbHMuaHlwb3QgICA9IHJlcXVpcmUoJy4vaHlwb3QnKTtcbnV0aWxzLnJhZiAgICAgPSByZXF1aXJlKCcuL3JhZicpO1xudXRpbHMuYnJvd3NlciA9IHJlcXVpcmUoJy4vYnJvd3NlcicpO1xuXG5leHRlbmQodXRpbHMsIHJlcXVpcmUoJy4vYXJyJykpO1xuZXh0ZW5kKHV0aWxzLCByZXF1aXJlKCcuL2lzVHlwZScpKTtcbmV4dGVuZCh1dGlscywgcmVxdWlyZSgnLi9wb2ludGVyVXRpbHMnKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB3aW4gPSByZXF1aXJlKCcuL3dpbmRvdycpLFxuICAgIGRvbU9iamVjdHMgPSByZXF1aXJlKCcuL2RvbU9iamVjdHMnKTtcblxubW9kdWxlLmV4cG9ydHMuaXNFbGVtZW50ID0gZnVuY3Rpb24gKG8pIHtcbiAgICBpZiAoIW8gfHwgKHR5cGVvZiBvICE9PSAnb2JqZWN0JykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICB2YXIgX3dpbmRvdyA9IHdpbi5nZXRXaW5kb3cobykgfHwgd2luLndpbmRvdztcblxuICAgIHJldHVybiAoL29iamVjdHxmdW5jdGlvbi8udGVzdCh0eXBlb2YgX3dpbmRvdy5FbGVtZW50KVxuICAgICAgICA/IG8gaW5zdGFuY2VvZiBfd2luZG93LkVsZW1lbnQgLy9ET00yXG4gICAgICAgIDogby5ub2RlVHlwZSA9PT0gMSAmJiB0eXBlb2Ygby5ub2RlTmFtZSA9PT0gXCJzdHJpbmdcIik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5pc1dpbmRvdyAgID0gZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiAhISh0aGluZyAmJiB0aGluZy5XaW5kb3cpICYmICh0aGluZyBpbnN0YW5jZW9mIHRoaW5nLldpbmRvdyk7IH07XG5tb2R1bGUuZXhwb3J0cy5pc0RvY0ZyYWcgID0gZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiAhIXRoaW5nICYmIHRoaW5nIGluc3RhbmNlb2YgZG9tT2JqZWN0cy5Eb2N1bWVudEZyYWdtZW50OyB9O1xubW9kdWxlLmV4cG9ydHMuaXNBcnJheSAgICA9IGZ1bmN0aW9uICh0aGluZykge1xuICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cy5pc09iamVjdCh0aGluZylcbiAgICAmJiAodHlwZW9mIHRoaW5nLmxlbmd0aCAhPT0gdW5kZWZpbmVkKVxuICAgICYmIG1vZHVsZS5leHBvcnRzLmlzRnVuY3Rpb24odGhpbmcuc3BsaWNlKTtcbn07XG5tb2R1bGUuZXhwb3J0cy5pc09iamVjdCAgID0gZnVuY3Rpb24gKHRoaW5nKSB7IHJldHVybiAhIXRoaW5nICYmICh0eXBlb2YgdGhpbmcgPT09ICdvYmplY3QnKTsgfTtcbm1vZHVsZS5leHBvcnRzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJzsgfTtcbm1vZHVsZS5leHBvcnRzLmlzTnVtYmVyICAgPSBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ251bWJlcicgIDsgfTtcbm1vZHVsZS5leHBvcnRzLmlzQm9vbCAgICAgPSBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Jvb2xlYW4nIDsgfTtcbm1vZHVsZS5leHBvcnRzLmlzU3RyaW5nICAgPSBmdW5jdGlvbiAodGhpbmcpIHsgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ3N0cmluZycgIDsgfTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcG9pbnRlclV0aWxzID0ge30sXG4gICAgLy8gcmVkdWNlIG9iamVjdCBjcmVhdGlvbiBpbiBnZXRYWSgpXG4gICAgdG1wWFkgPSB7fSxcbiAgICB3aW4gPSByZXF1aXJlKCcuL3dpbmRvdycpLFxuICAgIGh5cG90ID0gcmVxdWlyZSgnLi9oeXBvdCcpLFxuICAgIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyksXG5cbiAgICAvLyBzY29wZSBzaG91bGRuJ3QgYmUgbmVjZXNzYXJ5IGluIHRoaXMgbW9kdWxlXG4gICAgc2NvcGUgPSByZXF1aXJlKCcuLi9zY29wZScpO1xuXG5wb2ludGVyVXRpbHMuY29weUNvb3JkcyA9IGZ1bmN0aW9uIChkZXN0LCBzcmMpIHtcbiAgICBkZXN0LnBhZ2UgPSBkZXN0LnBhZ2UgfHwge307XG4gICAgZGVzdC5wYWdlLnggPSBzcmMucGFnZS54O1xuICAgIGRlc3QucGFnZS55ID0gc3JjLnBhZ2UueTtcblxuICAgIGRlc3QuY2xpZW50ID0gZGVzdC5jbGllbnQgfHwge307XG4gICAgZGVzdC5jbGllbnQueCA9IHNyYy5jbGllbnQueDtcbiAgICBkZXN0LmNsaWVudC55ID0gc3JjLmNsaWVudC55O1xuXG4gICAgZGVzdC50aW1lU3RhbXAgPSBzcmMudGltZVN0YW1wO1xufTtcblxucG9pbnRlclV0aWxzLnNldEV2ZW50WFkgPSBmdW5jdGlvbiAodGFyZ2V0T2JqLCBwb2ludGVyLCBpbnRlcmFjdGlvbikge1xuICAgIGlmICghcG9pbnRlcikge1xuICAgICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcklkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlclV0aWxzLnRvdWNoQXZlcmFnZShpbnRlcmFjdGlvbi5wb2ludGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwb2ludGVyID0gaW50ZXJhY3Rpb24ucG9pbnRlcnNbMF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwb2ludGVyVXRpbHMuZ2V0UGFnZVhZKHBvaW50ZXIsIHRtcFhZLCBpbnRlcmFjdGlvbik7XG4gICAgdGFyZ2V0T2JqLnBhZ2UueCA9IHRtcFhZLng7XG4gICAgdGFyZ2V0T2JqLnBhZ2UueSA9IHRtcFhZLnk7XG5cbiAgICBwb2ludGVyVXRpbHMuZ2V0Q2xpZW50WFkocG9pbnRlciwgdG1wWFksIGludGVyYWN0aW9uKTtcbiAgICB0YXJnZXRPYmouY2xpZW50LnggPSB0bXBYWS54O1xuICAgIHRhcmdldE9iai5jbGllbnQueSA9IHRtcFhZLnk7XG5cbiAgICB0YXJnZXRPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuXG5wb2ludGVyVXRpbHMuc2V0RXZlbnREZWx0YXMgPSBmdW5jdGlvbiAodGFyZ2V0T2JqLCBwcmV2LCBjdXIpIHtcbiAgICB0YXJnZXRPYmoucGFnZS54ICAgICA9IGN1ci5wYWdlLnggICAgICAtIHByZXYucGFnZS54O1xuICAgIHRhcmdldE9iai5wYWdlLnkgICAgID0gY3VyLnBhZ2UueSAgICAgIC0gcHJldi5wYWdlLnk7XG4gICAgdGFyZ2V0T2JqLmNsaWVudC54ICAgPSBjdXIuY2xpZW50LnggICAgLSBwcmV2LmNsaWVudC54O1xuICAgIHRhcmdldE9iai5jbGllbnQueSAgID0gY3VyLmNsaWVudC55ICAgIC0gcHJldi5jbGllbnQueTtcbiAgICB0YXJnZXRPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBwcmV2LnRpbWVTdGFtcDtcblxuICAgIC8vIHNldCBwb2ludGVyIHZlbG9jaXR5XG4gICAgdmFyIGR0ID0gTWF0aC5tYXgodGFyZ2V0T2JqLnRpbWVTdGFtcCAvIDEwMDAsIDAuMDAxKTtcbiAgICB0YXJnZXRPYmoucGFnZS5zcGVlZCAgID0gaHlwb3QodGFyZ2V0T2JqLnBhZ2UueCwgdGFyZ2V0T2JqLnBhZ2UueSkgLyBkdDtcbiAgICB0YXJnZXRPYmoucGFnZS52eCAgICAgID0gdGFyZ2V0T2JqLnBhZ2UueCAvIGR0O1xuICAgIHRhcmdldE9iai5wYWdlLnZ5ICAgICAgPSB0YXJnZXRPYmoucGFnZS55IC8gZHQ7XG5cbiAgICB0YXJnZXRPYmouY2xpZW50LnNwZWVkID0gaHlwb3QodGFyZ2V0T2JqLmNsaWVudC54LCB0YXJnZXRPYmoucGFnZS55KSAvIGR0O1xuICAgIHRhcmdldE9iai5jbGllbnQudnggICAgPSB0YXJnZXRPYmouY2xpZW50LnggLyBkdDtcbiAgICB0YXJnZXRPYmouY2xpZW50LnZ5ICAgID0gdGFyZ2V0T2JqLmNsaWVudC55IC8gZHQ7XG59O1xuXG4vLyBHZXQgc3BlY2lmaWVkIFgvWSBjb29yZHMgZm9yIG1vdXNlIG9yIGV2ZW50LnRvdWNoZXNbMF1cbnBvaW50ZXJVdGlscy5nZXRYWSA9IGZ1bmN0aW9uICh0eXBlLCBwb2ludGVyLCB4eSkge1xuICAgIHh5ID0geHkgfHwge307XG4gICAgdHlwZSA9IHR5cGUgfHwgJ3BhZ2UnO1xuXG4gICAgeHkueCA9IHBvaW50ZXJbdHlwZSArICdYJ107XG4gICAgeHkueSA9IHBvaW50ZXJbdHlwZSArICdZJ107XG5cbiAgICByZXR1cm4geHk7XG59O1xuXG5wb2ludGVyVXRpbHMuZ2V0UGFnZVhZID0gZnVuY3Rpb24gKHBvaW50ZXIsIHBhZ2UsIGludGVyYWN0aW9uKSB7XG4gICAgcGFnZSA9IHBhZ2UgfHwge307XG5cbiAgICBpZiAocG9pbnRlciBpbnN0YW5jZW9mIHNjb3BlLkludGVyYWN0RXZlbnQpIHtcbiAgICAgICAgaWYgKC9pbmVydGlhc3RhcnQvLnRlc3QocG9pbnRlci50eXBlKSkge1xuICAgICAgICAgICAgaW50ZXJhY3Rpb24gPSBpbnRlcmFjdGlvbiB8fCBwb2ludGVyLmludGVyYWN0aW9uO1xuXG4gICAgICAgICAgICBleHRlbmQocGFnZSwgaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy51cENvb3Jkcy5wYWdlKTtcblxuICAgICAgICAgICAgcGFnZS54ICs9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuc3g7XG4gICAgICAgICAgICBwYWdlLnkgKz0gaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5zeTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhZ2UueCA9IHBvaW50ZXIucGFnZVg7XG4gICAgICAgICAgICBwYWdlLnkgPSBwb2ludGVyLnBhZ2VZO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIE9wZXJhIE1vYmlsZSBoYW5kbGVzIHRoZSB2aWV3cG9ydCBhbmQgc2Nyb2xsaW5nIG9kZGx5XG4gICAgZWxzZSBpZiAoc2NvcGUuaXNPcGVyYU1vYmlsZSkge1xuICAgICAgICBwb2ludGVyVXRpbHMuZ2V0WFkoJ3NjcmVlbicsIHBvaW50ZXIsIHBhZ2UpO1xuXG4gICAgICAgIHBhZ2UueCArPSB3aW4ud2luZG93LnNjcm9sbFg7XG4gICAgICAgIHBhZ2UueSArPSB3aW4ud2luZG93LnNjcm9sbFk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBwb2ludGVyVXRpbHMuZ2V0WFkoJ3BhZ2UnLCBwb2ludGVyLCBwYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFnZTtcbn07XG5cbnBvaW50ZXJVdGlscy5nZXRDbGllbnRYWSA9IGZ1bmN0aW9uIChwb2ludGVyLCBjbGllbnQsIGludGVyYWN0aW9uKSB7XG4gICAgY2xpZW50ID0gY2xpZW50IHx8IHt9O1xuXG4gICAgaWYgKHBvaW50ZXIgaW5zdGFuY2VvZiBzY29wZS5JbnRlcmFjdEV2ZW50KSB7XG4gICAgICAgIGlmICgvaW5lcnRpYXN0YXJ0Ly50ZXN0KHBvaW50ZXIudHlwZSkpIHtcbiAgICAgICAgICAgIGV4dGVuZChjbGllbnQsIGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMudXBDb29yZHMuY2xpZW50KTtcblxuICAgICAgICAgICAgY2xpZW50LnggKz0gaW50ZXJhY3Rpb24uaW5lcnRpYVN0YXR1cy5zeDtcbiAgICAgICAgICAgIGNsaWVudC55ICs9IGludGVyYWN0aW9uLmluZXJ0aWFTdGF0dXMuc3k7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjbGllbnQueCA9IHBvaW50ZXIuY2xpZW50WDtcbiAgICAgICAgICAgIGNsaWVudC55ID0gcG9pbnRlci5jbGllbnRZO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAvLyBPcGVyYSBNb2JpbGUgaGFuZGxlcyB0aGUgdmlld3BvcnQgYW5kIHNjcm9sbGluZyBvZGRseVxuICAgICAgICBwb2ludGVyVXRpbHMuZ2V0WFkoc2NvcGUuaXNPcGVyYU1vYmlsZT8gJ3NjcmVlbic6ICdjbGllbnQnLCBwb2ludGVyLCBjbGllbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBjbGllbnQ7XG59O1xuXG5wb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkID0gZnVuY3Rpb24gKHBvaW50ZXIpIHtcbiAgICByZXR1cm4gc2NvcGUuaXNOdW1iZXIocG9pbnRlci5wb2ludGVySWQpPyBwb2ludGVyLnBvaW50ZXJJZCA6IHBvaW50ZXIuaWRlbnRpZmllcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcG9pbnRlclV0aWxzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbGFzdFRpbWUgPSAwLFxuICAgIHZlbmRvcnMgPSBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddLFxuICAgIHJlcUZyYW1lLFxuICAgIGNhbmNlbEZyYW1lO1xuXG5mb3IodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xuICAgIHJlcUZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgIGNhbmNlbEZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ10gfHwgd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddO1xufVxuXG5pZiAoIXJlcUZyYW1lKSB7XG4gICAgcmVxRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgICAgIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSksXG4gICAgICAgICAgICBpZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7IH0sXG4gICAgICAgICAgdGltZVRvQ2FsbCk7XG4gICAgICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcbn1cblxuaWYgKCFjYW5jZWxGcmFtZSkge1xuICAgIGNhbmNlbEZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZXF1ZXN0OiByZXFGcmFtZSxcbiAgICBjYW5jZWw6IGNhbmNlbEZyYW1lXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cy53aW5kb3cgICAgID0gdW5kZWZpbmVkO1xuICAgIG1vZHVsZS5leHBvcnRzLnJlYWxXaW5kb3cgPSB1bmRlZmluZWQ7XG59XG5lbHNlIHtcbiAgICAvLyBnZXQgd3JhcHBlZCB3aW5kb3cgaWYgdXNpbmcgU2hhZG93IERPTSBwb2x5ZmlsbFxuXG4gICAgbW9kdWxlLmV4cG9ydHMucmVhbFdpbmRvdyA9IHdpbmRvdztcblxuICAgIC8vIGNyZWF0ZSBhIFRleHROb2RlXG4gICAgdmFyIGVsID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcblxuICAgIC8vIGNoZWNrIGlmIGl0J3Mgd3JhcHBlZCBieSBhIHBvbHlmaWxsXG4gICAgaWYgKGVsLm93bmVyRG9jdW1lbnQgIT09IHdpbmRvdy5kb2N1bWVudFxuICAgICAgICAmJiB0eXBlb2Ygd2luZG93LndyYXAgPT09ICdmdW5jdGlvbidcbiAgICAgICAgJiYgd2luZG93LndyYXAoZWwpID09PSBlbCkge1xuICAgICAgICAvLyByZXR1cm4gd3JhcHBlZCB3aW5kb3dcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMud2luZG93ID0gd2luZG93LndyYXAod2luZG93KTtcbiAgICB9XG5cbiAgICAvLyBubyBTaGFkb3cgRE9NIHBvbHlmaWwgb3IgbmF0aXZlIGltcGxlbWVudGF0aW9uXG4gICAgbW9kdWxlLmV4cG9ydHMud2luZG93ID0gd2luZG93O1xufVxuXG52YXIgaXNXaW5kb3cgPSByZXF1aXJlKCcuL2lzVHlwZScpLmlzV2luZG93O1xuXG5tb2R1bGUuZXhwb3J0cy5nZXRXaW5kb3cgPSBmdW5jdGlvbiBnZXRXaW5kb3cgKG5vZGUpIHtcbiAgICBpZiAoaXNXaW5kb3cobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdmFyIHJvb3ROb2RlID0gKG5vZGUub3duZXJEb2N1bWVudCB8fCBub2RlKTtcblxuICAgIHJldHVybiByb290Tm9kZS5kZWZhdWx0VmlldyB8fCByb290Tm9kZS5wYXJlbnRXaW5kb3cgfHwgbW9kdWxlLmV4cG9ydHMud2luZG93O1xufTtcbiJdfQ==
