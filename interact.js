/*
 * Copyright (c) 2012 Taye Adeyemi
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
        prevX = 0,
        prevY = 0,
        prevClientX = 0,
        prevClientY = 0,

        // Previos interact start event mouse/touch position
        x0 = 0,
        y0 = 0,
        clientX0 = 0,
        clientY0 = 0,

        gesture = {
            start: {
                x: 0,
                y: 0
            },
            // distance between first two touches of touchStart event
            startDistance: 0,
            prevDistance: 0,
            distance: 0,
            scale: 1,
            startAngle: 0,
            prevAngle: 0
        },

        interactables = [],
        dropzones = [],
        target = null,
        dropTarget = null,
        prevDropTarget = null,

        //All things relating to autoScroll
        scrollMargin = 70,
        scroll = {
            isEnabled: true,
            margin: scrollMargin,

            // The distance in x and y that the page is scrolled
            distance: 10,

            // Pause in ms between each scroll pulse
            interval: 20,

            // Direction each pulse is to scroll in
            x: 0,
            y: 0,

            // scroll the window by the values in scroll.x/y
            autoScroll: function () {
                window.scrollBy(scroll.x, scroll.y);
            },

            // To store return value of window.setInterval
            i: null,

            // Contains the DIV elements which frame the page and initiate
            // autoScroll on mouseMove
            edgeContainer: {
                _element: document.createElement('div'),
                events: {}
            },
            edges: {
                top: {
                    _element: document.createElement('div'),
                    events: {},
                    style: [
                        '',
                        'top: 0px;',
                        'left: 0px;',
                        // screen width * 5 in case page is zoomed out
                        'width: ' + window.screen.width * 5 + 'px !important;',
                        'height: ' + scrollMargin + 'px !important;'
                        ].join(''),
                    y: -1
                },
                right: {
                    _element: document.createElement('div'),
                    events: {},
                    style: [
                        '',
                        'top: 0px;',
                        'right: 0px;',
                        'width: ' + scrollMargin + 'px !important;',
                        'height: ' + window.screen.height * 4 + 'px !important;'
                        ].join(''),
                    x: 1
                },
                bottom: {
                    _element: document.createElement('div'),
                    events: {},
                    style: [
                        '',
                        'bottom: 0px;',
                        'left: 0px;',
                        'width: ' + window.screen.width * 4 + 'px !important;',
                        'height: ' + scrollMargin + 'px !important;'
                        ].join(''),
                    y: 1
                },
                left: {
                    _element: document.createElement('div'),
                    events: {},
                    style: [
                        '',
                        'top: 0px;',
                        'left: 0px;',
                        'width: ' + scrollMargin + 'px !important;',
                        'height: ' + window.screen.height * 4 + 'px !important;'
                        ].join(''),
                    x: -1
                }
            },
            edgeStyle: [
                '#edge-container {',
                '    width: 0;',
                '    height: 0;',
                '    margin: 0;',
                '    padding: 0;',
                '    border: none;',
                '}',

                '.interact-edge {',
                '   position: fixed !important;',
                '   background-color: transparent !important;',
                '   z-index: 9000 !important;',
                '   margin: 0px !important;',
                '   padding: 0px !important;',
                '   border: none 0 !important;',
                '   display: none',
                '}',

                '.interact-edge.show{',
                '   display: block !important;',
                '}'
                ].join('\n'),
            edgeMove: function (event) {
            if (dragging || resizing) {
                    var top = event.clientY < scroll.edges.bottom._element.offsetHeight,
                        right = event.clientX > scroll.edges.right._element.offsetLeft,
                        bottom = event.clientY > scroll.edges.bottom._element.offsetTop,
                        left = event.clientX < scroll.edges.left._element.offsetWidth;

                    scroll.x = scroll.distance * (right? 1: left? -1: 0);
                    scroll.y = scroll.distance * (bottom? 1: top? -1: 0);

                    if (!scroll.isScrolling && scroll.isEnabled && target._autoScroll) {
                        scroll.start();
                    }
                }
            },
            edgeOut: function (event) {
                // Mouse may have entered another edge while still being above
                // this one; Need to check if mouse is still above this element
                scroll.edgeMove(event);

                // If the window is not supposed to be scrolling in any direction,
                // clear interval
                if (!scroll.x && !scroll.y) {
                    scroll.stop();
                }
            },
            showEdges: function () {
                for (var edge in scroll.edges) {
                    if (scroll.edges.hasOwnProperty(edge)) {
                        scroll.edges[edge]._element.classList.add('show');
                    }
                }
                scroll.edgesAreHidden = false;
            },
            hideEdges: function () {
                scroll.stop();

                for (var edge in scroll.edges) {
                    if (scroll.edges.hasOwnProperty(edge)) {
                        scroll.edges[edge]._element.classList.remove('show');
                    }
                }
                scroll.edgesAreHidden = true;
            },
            addEdges: function () {
                var currentEdge,
                    style = document.createElement('style');

                style.type = 'text/css';
                style.innerHTML = scroll.edgeStyle;
                scroll.edgeContainer._element.appendChild(style);

                for (var edge in scroll.edges) {
                    if (scroll.edges.hasOwnProperty(edge)) {
                        currentEdge = scroll.edges[edge];
                        scroll.edges[edge]._element.style.cssText = scroll.edges[edge].style;
                        scroll.edges[edge]._element.classList.add('interact-edge');
                        scroll.edgeContainer._element.appendChild(currentEdge._element);

                        currentEdge._element.x = currentEdge.x;
                        currentEdge._element.y = currentEdge.y;
                    }
                }
                scroll.edgeContainer._element.id = 'edge-container';
                document.body.appendChild(scroll.edgeContainer._element);

                events.add(scroll.edgeContainer, moveEvent, scroll.edgeMove);
                events.add(scroll.edgeContainer, outEvent, scroll.edgeOut);
            },
            edgesAreHidden: true,
            isScrolling: false,
            start: function () {
                scroll.isScrolling = true;
                window.clearInterval(scroll.i);
                scroll.i = window.setInterval(scroll.autoScroll, scroll.interval);
            },
            stop: function () {
                window.clearInterval(scroll.i);
                scroll.x = scroll.y = 0;
                scroll.isScrolling = false;
            }
        },
        supportsTouch = 'createTouch' in document,

        // Less Precision with touch input
        margin = supportsTouch ? 20 : 10,

        mouseIsDown = false,
        gesturing = false,
        dragging = false,
        resizing = false,
        resizeAxes = 'xy',

        // What to do depending on action returned by getAction() of node
        // dictates what styles should be used and
        // what mouseMove event Listner is to be added after mouseDown
        actions = {},
        actionIsEnabled = {
            drag: true,
            resize: true,
            gesture: true
        },
        
        // Action that's ready to be fired on next move event
        prepared = null,
        styleCursor = true,
        
        // user interaction event types. will be set depending on touch or mouse
        downEvent,
        upEvent,
        moveEvent,
        overEvent,
        outEvent,
        enterEvent,
        leaveEvent,
        
        eventTypes = [
            'interactresizestart',
            'interactresizemove',
            'interactresizeend',
            'interactdragstart',
            'interactdragmove',
            'interactdragend',
            'interactgesturestart',
            'interactgesturemove',
            'interactgestureend'
        ],
        
        docTarget = {
            _element: document,
            events: {}
        },
        windowTarget = {
            _element: window,
            events: {}
        },

        // Events wrapper
        events = {
            add: function (target, type, listener, useCapture) {
                if (typeof target.events !== 'object') {
                    target.events = {};
                }

                if (typeof target.events[type] !== 'array') {
                    target.events[type] = [];
                }

                target.events[type].push(listener);

                return target._element.addEventListener(type, listener, useCapture || false);
            },
            remove: function (target, type, listener, useCapture) {
                var i;

                if (target && target.events && target.events[type]) {

                    if (listener === 'all') {
                        for (i = 0; i < target.events[type].length; i++) {
                            target._element.removeEventListener(type, target.events[type][i], useCapture || false);
                            target.events[type].splice(i, 1);
                        }
                    } else {
                        for (i = 0; i < target.events[type].length; i++) {
                            if (target.events[type][i] === listener) {
                                target._element.removeEventListener(type, target.events[type][i], useCapture || false);
                                target.events[type].splice(i, 1);
                            }
                        }
                    }
                }
            },
            removeAll: function (target) {
                var type;

                for (type in target.events) {
                    if (target.events.hasOwnProperty(type)) {
                        events.remove(target, type, 'all');
                    }
                }
            }
        };

    // Set event types to be used depending on input available
    if (supportsTouch) {
        downEvent = 'touchstart',
        upEvent = 'touchend',
        moveEvent = 'touchmove',
        overEvent = 'touchover',
        outEvent = 'touchout';
        enterEvent = 'touchover',
        leaveEvent = 'touchout';
    } else {
        downEvent = 'mousedown',
        upEvent = 'mouseup',
        moveEvent = 'mousemove',
        overEvent = 'mosueover',
        outEvent = 'mouseout';
        enterEvent = 'touchenter',
        leaveEvent = 'touchleave';
    }

    /**
     * @private
     * @returns{String} action to be performed - drag/resize[axes]
     */
    function actionCheck(event) {
        var clientRect,
            right,
            bottom,
            action,
            page = getPageXY(event),
            x = page.x - window.scrollX,
            y = page.y - window.scrollY;

        clientRect = (target._element instanceof SVGElement)?
                target._element.getBoundingClientRect():
                target._element.getClientRects()[0];

        if (actionIsEnabled.resize && target._resize) {
            right = ((x - clientRect.left) > (clientRect.width - margin));
            bottom = ((y - clientRect.top) > (clientRect.height - margin));
        }

        if (actionIsEnabled.gesture &&
            event.touches && event.touches.length > 1 &&
            !(dragging || resizing)) {
            action = 'gesture';
        } else {
            resizeAxes = (right?'x': '') + (bottom?'y': '');
            action = (resizeAxes)?
                'resize' + resizeAxes:
                actionIsEnabled.drag?
                    'drag': null;
        }

        return action;
    }

    // Get event.pageX/Y for mouse and event.touches[0].pageX/Y tor touch
    function getXY(event, type) {
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
        } else {
            x = event[type + 'X'];
            y = event[type + 'Y'];
        }

        // Opera Mobile handles the viewport and scrolling oddly 
        if (navigator.appName == 'Opera' && supportsTouch) {
            x -= window.scrollX;
            y -= window.scrollY;
        }

        return {
            x: x,
            y: y
        };
    }
    function getPageXY(event) {
        return getXY(event, 'page');
    }

    function getClientXY(event) {
        return getXY(event, 'client');
    }

    function touchAverage(event) {
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

    function getTouchBBox(event) {
        if (!event.touches.length) {
            return;
        }

        var i,
            touches = event.touches,
            minX = event.touches[0].pageX,
            minY = event.touches[0].pageY,
            maxX = minX,
            maxY = minY;

        for (i = 0; i < touches.length; i++) {
            minX = Math.max(minX, event.touches[i].pageX);
            minY = Math.max(minY, event.touches[i].pageY);
        }

        return {
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    function touchDistance(event) {
        var dx = event.touches[0].pageX,
            dy = event.touches[0].pageY;

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0].pageX;
            dy -= event.changedTouches[0].pageY;
        } else {
            dx -= event.touches[1].pageX;
            dy -= event.touches[1].pageY;
        }

        return Math.sqrt(dx * dx + dy * dy);
    }

    function touchAngle(event) {
        var dx = event.touches[0].pageX,
            dy = event.touches[0].pageY;

        if (event.type === 'touchend' && event.touches.length === 1) {
            dx -= event.changedTouches[0].pageX;
            dy -= event.changedTouches[0].pageY;
        } else {
            dx -= event.touches[1].pageX;
            dy -= event.touches[1].pageY;
        }

        return 180 * -Math.atan(dy / dx) / Math.PI;
    }

    // Test to see which dropzone element is "above" all other qualifying
    // dropzones on the page
    function resolveDrops(drops) {
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
                
                //~~~***
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
                } else {
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
                    } else if (child === parent[2]) {
                        break;
                    }
                    child = child.previousSibling;
                }
            }
            return deepestZone;
        }
    }

    function getEventDetail(event, action, phase) {
        var client,
            page,
            detail;

        if (action === 'gesture') {
            var average = touchAverage(event);

            page = {x: average.pageX, y: average.pageY};
            client = {x: average.clientX, y: average.clientY};
        } else {
            client = getClientXY(event);
            page = getPageXY(event);
        }
        detail = {
            x0: x0,
            y0: y0,
            clientX0: clientX0,
            clientY0: clientY0,
            pageX: page.x,
            pageY: page.y,
            clientX: client.x,
            clientY: client.y,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            button: event.button
        };

        // Start/end event dx, dy is difference between start and current points
        if (phase === 'start' || phase === 'end') {
            detail.dx = page.x - x0;
            detail.dy = page.y - y0;
        } else {
            detail.dx = page.x - prevX;
            detail.dy = page.y - prevY;
        }

        if (action === 'resize') {
            if (target._squareResize || event.shiftKey) {
                if (resizeAxes === 'y') {
                    detail.dx = detail.dy;
                } else {
                    detail.dy = detail.dx;
                }
                detail.axes = 'xy';
            } else {
                detail.axes = resizeAxes;

                if (resizeAxes === 'x') {
                detail.dy = 0;
                } else if (resizeAxes === 'y') {
                    detail.dx = 0;
                }
            }
        } else if (action === 'gesture') {
            detail.touches = event.touches;
            detail.distance = touchDistance(event);
            detail.box = getTouchBBox(event);
            detail.angle = touchAngle(event);

            if (phase === 'start') {
                detail.scale = 1;
                detail.ds = 0;
                detail.rotation = 0;
            } else {
            detail.scale = detail.distance / gesture.startDistance;
                if (phase === 'end') {
                    detail.rotation = detail.angle - gesture.startAngle;
                    detail.ds = detail.scale - 1;
                } else {
                    detail.rotation = detail.angle - gesture.prevAngle;
                    detail.ds = detail.scale - gesture.prevScale;
                }
            }
        }
        else if (action === 'drop' ||
                (action === 'drag' && (phase === 'enter' || phase === 'leave'))) {
            detail.draggable = target._element;
        }
        return detail;
    }
    
    // Check if the action is enabled globally and the current target supports it
    // If so, return the validated action. Otherwise, return null
    function validateAction (action) {
        var actionProperty;
        
        if (!action ||
            !(actionProperty = action.match('resize')? 'resize': action) || 
            !target['_' + actionProperty] ||
            !actionIsEnabled[actionProperty]) {
            return null;
        }
        if (action === 'resize' || action === 'resizexy' || action === 'resizeyx') {
            action = 'resizexy';
        }
        return action;
    }

    /**
     * @private
     * @event
     * Determine action to be performed on next mouseMove and add appropriate
     * style and event Liseners
     */
    function mouseDown(event, forceAction) {
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
        } else {
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

        mouseIsDown = true;

        if (target && !(dragging || resizing || gesturing)) {

            x0 = prevX = page.x;
            y0 = prevY = page.y;
            clientX0 = prevClientX = client.x;
            clientY0 = prevClientY = client.y;

            action = validateAction(forceAction || target._getAction(event));
            
            if (!action) {
                return event;
            }

            if (styleCursor) {
                document.documentElement.style.cursor =
                    target._element.style.cursor =
                        actions[action].cursor;
            }
            resizeAxes = (action === 'resizexy')?
                    'xy': (action === 'resizex')?
                        'x': (action === 'resizey')?
                            'y': '';

            prepared = (action in actions)? action: null;

            event.preventDefault();
        }
    }

    function mouseMove(event) {
        if (mouseIsDown && prepared && target) {
            addClass(target._element, actions[prepared].className);
            actions[prepared].moveListener.call(this, event);
        }
    }

    /**
     * @private
     */
    function dragMove(event) {
        event.preventDefault();

        var detail,
            dragEvent;

        if (!dragging) {
            detail = getEventDetail(event, 'drag', 'start');
            dragEvent = document.createEvent('CustomEvent');
            dragEvent.initCustomEvent('interactdragstart', true, true, detail);
            target._element.dispatchEvent(dragEvent);
            dragging = true;
        } else {
            detail = getEventDetail(event, 'drag', 'move');
            dragEvent = document.createEvent('CustomEvent');
            dragEvent.initCustomEvent('interactdragmove', true, true, detail);

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

                // If the current dropTarget is not the same as the previous one
                if (dropTarget !== prevDropTarget) {
                    // if there was a prevDropTarget, first dispatch a dragleave event
                    if (prevDropTarget) {
                        var dragLeaveEvent = document.createEvent('CustomEvent'),
							dragLeaveDetail = getEventDetail(event, 'drag', 'leave');

                        dragLeaveEvent.initCustomEvent('interactdragleave', true, true, dragLeaveDetail);
                        prevDropTarget._element.dispatchEvent(dragLeaveEvent);

                        detail.dragLeave = prevDropTarget._element;
                        prevDropTarget = null;
                    }
					// If the dropTarget is not null, dispatch a dragenter event
                    if (dropTarget) {
                        var dragEnterEvent = document.createEvent('CustomEvent'),
							dragEnterDetail = getEventDetail(event, 'drag', 'enter');

                        dragEnterEvent.initCustomEvent('interactdragenter', true, true, dragEnterDetail);
                        dropTarget._element.dispatchEvent(dragEnterEvent);

                        detail.dragEnter = dropTarget._element;
                        prevDropTarget = dropTarget;
                    }
                }
            }
            target._element.dispatchEvent(dragEvent);
        }

        prevX = detail.pageX;
        prevY = detail.pageY;

        prevClientX = detail.clientX;
        prevClientY = detail.clientY;
    }

    /**
     * @private
     */
    function resizeMove(event) {
        event.preventDefault();

        var detail,
            resizeEvent;

        if (!resizing) {
            detail = getEventDetail(event, 'resize', 'start');
            resizeEvent = document.createEvent('CustomEvent');
            resizeEvent.initCustomEvent('interactresizestart', true, true, detail);
            target._element.dispatchEvent(resizeEvent);
            resizing = true;
        } else {
            detail = getEventDetail(event, 'resize', 'move');
            resizeEvent = document.createEvent('CustomEvent');
            resizeEvent.initCustomEvent('interactresizemove', true, true, detail);
            target._element.dispatchEvent(resizeEvent);
        }

        prevX = detail.pageX;
        prevY = detail.pageY;

        prevClientX = detail.clientX;
        prevClientY = detail.clientY;
    }

    function gestureMove(event) {
        if (event.touches.length < 2) {
            return;
        }
        event.preventDefault();

        var detail,
            gestureEvent;

        if (!gesturing) {

            detail = getEventDetail(event, 'gesture', 'start');
            detail.ds = 0;

            gesture.startDistance = detail.distance;
            gesture.startAngle = detail.angle;
            gesture.scale = 1;

            gestureEvent = document.createEvent('CustomEvent');
            gestureEvent.initCustomEvent('interactgesturestart', true, true, detail);
            target._element.dispatchEvent(gestureEvent);
            gesturing = true;
        } else {
            detail = getEventDetail(event, 'gesture', 'move');
            detail.ds = detail.scale - gesture.scale;
            gestureEvent = document.createEvent('CustomEvent');
            gestureEvent.initCustomEvent('interactgesturemove', true, true, detail);
            target._element.dispatchEvent(gestureEvent);
        }

        prevX = detail.pageX;
        prevY = detail.pageY;

        prevClientX = detail.clientX;
        prevClientY = detail.clientY;

        gesture.prevAngle = detail.angle;
        gesture.prevDistance = detail.distance;
        if (detail.scale !== Infinity && detail.scale !== null && detail.scale !== undefined  && !isNaN(detail.scale)) {
            gesture.scale = detail.scale;
        }
    }

    /**
     * @private
     * @event
     * Check what action would be performed on mouseMove target if the mouse
     * button were pressed and change the element classes accordingly
     */
    function mouseHover(event) {
        var action;

        // Check if target element or it's parent is interactable
        if (!(mouseIsDown || dragging || resizing || gesturing) &&
            (target = interactables.get(event.target) || interactables.get(event.target.parentNode))) {
            if ((target._resize || target._drag) && target._checkOnHover) {
                action = validateAction(target._getAction(event));

                if (styleCursor) {
                    if (action) {
                        target._element.style.cursor = actions[action].cursor;
                    } else {
                        target._element.style.cursor = '';
                    }
                }
            } else if (dragging || resizing || gesturing) {
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
        var detail,
            endEvent;

        if (dragging) {
            endEvent = document.createEvent('CustomEvent');
            detail = getEventDetail(event, 'drag', 'end');

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
                    var dropDetail = getEventDetail(event, 'drop'),
                        dropEvent = document.createEvent('CustomEvent');

                    dropEvent.initCustomEvent('interactdrop', true, true, dropDetail);

                    detail.dropzone = dropTarget._element;
                }

                // Otherwise, If there was a prevDropTarget (perhaps if for some reason
                // this dragend happens without the mouse moving out of the previousdroptarget)
                else if (prevDropTarget) {
                    var dragLeaveEvent = document.createEvent('CustomEvent'),
						dragLeaveDetail = getEventDetail(event, 'drag', 'leave');

                    dragLeaveEvent.initCustomEvent('interactdragleave', true, true, dragLeaveDetail);
                    prevDropTarget._element.dispatchEvent(dragLeaveEvent);

                    detail.dragLeave = prevDropTarget._element;
                }
            }

            endEvent.initCustomEvent('interactdragend', true, true, detail);
            target._element.dispatchEvent(endEvent);
            if (dropTarget) {
                dropTarget._element.dispatchEvent(dropEvent);
            }
        } else if (resizing) {
            endEvent = document.createEvent('CustomEvent');
            detail = getEventDetail(event, 'resize', 'start');
            endEvent.initCustomEvent('interactresizeend', true, true, detail);
            target._element.dispatchEvent(endEvent);
        } else if (gesturing) {
            endEvent = document.createEvent('CustomEvent');
            detail = getEventDetail(event, 'gesture', 'end');
            detail.ds = detail.scale;
            endEvent.initCustomEvent('interactgestureend', true, true, detail);
            target._element.dispatchEvent(endEvent);
        }

        mouseIsDown = dragging = resizing = gesturing = false;

        if (target) {
            if (styleCursor) {
                document.documentElement.style.cursor = '';
                target._element.style.cursor = '';
            }
            // prevent Default only if were previously interacting
            event.preventDefault();

            clearTargets();
        }
        prepared = null;

        return event;
    }

    actions = {
        drag: {
            cursor: 'move',
            className: 'interact-dragging',
            moveListener: dragMove
        },
        resizex: {
            cursor: 'e-resize',
            className: 'interact-resizing',
            moveListener: resizeMove
        },
        resizey: {
            cursor: 's-resize',
            className: 'interact-resizing',
            moveListener: resizeMove
        },
        resizexy: {
            cursor: 'se-resize',
            className: 'interact-resizing',
            moveListener: resizeMove
        },
        gesture: {
            cursor: '',
            className: 'interact-gesturing',
            moveListener: gestureMove
        }
    };

    /** @private */
    interactables.indexOf = dropzones.indexOf = function (element) {
        var i;

        for (i = 0; i < this.length; i++) {
            if (this[i]._element === element) {
                return i;
            }
        }
        return -1;
    };

    interactables.get = dropzones.get = function (element) {
        var i = this.indexOf(element) ;

        return interactables[i];
    };

    /** @private */
    function addClass(element, classNames) {
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

    /** @private */
    function removeClass(element, classNames) {
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

    /** @private */
    function clearTargets() {
        if (target) {
            removeClass(target._element, 'interact-dragging interact-resizing interact-gesturing');
        }
        if (dropTarget) {
            removeClass(target._element, 'interact-droptarget');
        }
        target = dropTarget = prevDropTarget = null;
    }

    function interact(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        return interactables.get(element);
    }


    /**
     * Object type returned by interact.set(element) and interact(element) if
     * the element was previously set.
     *
     * @class Interactable
     * @name Interactable
     */
    function Interactable(element, options) {

        if (typeof options !== 'object') {
            options = {};
        }

        this._element = element,
        this._drag = ('drag' in options)? options.drag : false;
        this._dropzone = ('dropzone' in options)? options.dropzone : false;
        this._resize = ('resize' in options)? options.resize : false;
        this._gesture = ('gesture' in options)? options.gesture : false;
        this._squareResize = ('squareResize' in options)? options.squareResize : false;
        this._autoScroll = ('autoScroll' in options)? options.autoScroll : true;
        this._getAction = (typeof options.actionChecker === 'function')?
                options.actionChecker:
                actionCheck,
        this._checkOnHover = ('autoScroll' in options)? options.checkOnHover : true;

        events.add(this, moveEvent, mouseHover);
        events.add(this, downEvent, mouseDown, false);

        interactables.push(this);
        this._index = interactables.length - 1;
        this._dropzoneIndex = -1;

        if (this._dropzone) {
            dropzones.push(this);
            this._dropzoneIndex = dropzones.length - 1;
        }

        addClass(element, [
                'interactable',
                this._drag? 'interact-draggable': '',
                this._dropzone? 'interact-dropzone': '',
                this._resize? 'interact-resizeable': '',
                this._gesture? 'interact-gestureable': ''
            ].join(' '));
    }

    Interactable.prototype = {

        /**
         * Returns or sets whether multitouch this Interactable's element can be
         * dragged
         *
         * @function
         * @param {bool} newValue
         * @returns {bool | Interactable}
         */
        draggable: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this._drag  = newValue;

                return this;
            }
            return this._drag;
        },

        /**
         * Returns or sets whether elements can be dropped onto this
         * Interactable to trigger interactdrop events
         *
         * @function
         * @param {bool} newValue The new value to be set. Passing null returns
         *              the current value
         * @returns {bool | Interactable}
         */
        dropzone: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                if (this._dropzone !== newValue) {
                    if (newValue) {
                        dropzones.push(this);
                        this._dropzoneIndex = dropzones.length - 1;
                    } else {
                        dropzones.splice(this._dropzoneIndex, 1);
                        this._dropzoneIndex = -1;
                    }
                }
                this._dropzone  = newValue;

                return this;
            }
            return this._dropzone;
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

                horizontal = (x > clientRect.left) && ( x < clientRect.left + clientRect.width);
                vertical = (y > clientRect.top) && (y < clientRect.top + clientRect.height);

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
         * @param {bool} newValue
         * @returns {bool | Interactable}
         */
        resizeable: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this._resize  = newValue;

                return this;
            }
            return this._resize;
        },

        /**
         * Returns or sets whether resizing can only be done on both axes equally
         *
         * @function
         * @param {bool} newValue
         * @returns {bool | Interactable}
         */
        squareResize: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this._drag  = newValue;

                return this;
            }
            return this._squareResize;
        },

        /**
         * Returns or sets whether multitouch gestures can be performed on the
         * Interactables element
         *
         * @function
         * @param {bool} newValue
         * @returns {bool | Interactable}
         */
        gestureable: function (newValue) {
            if (newValue !== null && newValue !== undefined) {
                this._gesture  = newValue;

                return this;
            }
            return this._gesture;
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
                this._autoScroll  = newValue;

                return this;
            }
            return this._autoScroll;
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
                this._getAction  = newValue;

                return this;
            }
            return this._getAction;
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
                this._checkOnHover  = newValue;

                return this;
            }
            return this._checkOnHover;
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
         * Remove this interactable from the list of interactables
         * and remove it's drag, drop, resize and gesture capabilities
         *
         * @function
         * @returns {} {@link interact}
         */
        unset: function () {
                events.removeAll(this);
                if (styleCursor) {
                    this._element.style.cursor = '';
                }
                interactables.splice(this._index, 1);
                if (this._dropzoneIndex !== -1) {
                    dropzones.splice(this._dropzoneIndex, 1);
                }
                removeClass(this._element, [
                        'interactable',
                        'interact-draggable',
                        'interact-dragging',
                        'interact-dropzone',
                        'interact-resizeable',
                        'interact-resizeing',
                        'interact-gestureable',
                        'interact-gesturing'
                    ].join(' '));
                return interact;
            }
    };

    /**
     * @function
     * @description Add an element to the list of interact nodes
     * @param {HTMLElement | SVGElement} element The DOM Element that will be added
     * @param {Object} options An object whose properties are the drag/resize/gesture options
     * @returns {Interactable}
     */
    interact.set = function (element, options) {
        var interactable = interactables.get(element);

        if (interactable) {
            interactables.splice(interactable._index, 1);

            if (interactable._dropzoneIndex !== -1) {
                dropzones.splice(interactable._dropzoneIndex, 1);
            }
        }
        return new Interactable(element, options);
    };

    /**
     * @function
     * @description Check if an element has been set
     * @param {HTMLElement | SVGElement} element The DOM Element that will be searched for
     * @returns {bool}
     */
    interact.isSet = function(element) {
        return interactables.indexOf(element !== -1);
    };

    /**
     * @function
     * @description Simulate mouse down to begin drag/resize on an interactable element
     * @param {String} action The action to be performed - drag, resize, resizex, resizey;
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
        } else {
            clientRect = (target._element instanceof SVGElement)?
                    element.getBoundingClientRect():
                    clientRect = element.getClientRects()[0];

            if (action === 'drag') {
                event.pageX = clientRect.left + clientRect.width / 2;
                event.pageY = clientRect.top + clientRect.height / 2;
            } else {
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
    }
    
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
    }
    
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
    }

    interact.eventTypes = eventTypes;

    /**
     * Returns debugging data
     * @function
     */
    interact.debug = function () {
        return {
            target: target,
            dragging: dragging,
            resizing: resizing,
            gesturing: gesturing,
            prevX: prevX,
            prevY: prevY,
            x0: x0,
            y0: y0,
            Interactable: Interactable,
            interactables: interactables,
            dropzones: dropzones,
            mouseIsDown: mouseIsDown,
            supportsTouch: supportsTouch,
            defaultActionChecker: actionCheck,
            dragMove: dragMove,
            resizeMove: resizeMove,
            gestureMove: gestureMove,
            mouseUp: docMouseUp,
            mouseDown: mouseDown,
            mouseHover: mouseHover,
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
     * Returns or sets whether or not the cursor style of the document is changed
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
            scroll.isEnabled  = newValue;

            return interact;
        }
        return scroll.isEnabled;
    };


    events.add(docTarget, upEvent, docMouseUp);
    events.add(docTarget, moveEvent, mouseMove);
    events.add(docTarget, 'touchcancel', docMouseUp);
    events.add(windowTarget, 'blur' , docMouseUp);

    events.add(docTarget, 'DOMContentLoaded', function () {
            scroll.addEdges();
        });


     // Drag and resize start event listeners to show autoScroll
     // edges when interaction starts and hide on drag and resize end

     events.add(docTarget, 'interactresizestart', scroll.showEdges);
     events.add(docTarget, 'interactdragstart', scroll.showEdges);
     events.add(docTarget, 'interactresizeend', scroll.hideEdges);
     events.add(docTarget, 'interactdragend', scroll.hideEdges);

    window.interact = interact;
}(window));

