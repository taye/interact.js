/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/biographer/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js module
 * @name interact
 */
window.interact = (function (window) {
    'use strict';

    var document = window.document,
        console = window.console,

        // Previous interact move event mouse/touch position
        prevX = 0,
        prevY = 0,

        // Previos interact start event mouse/touch position
        x0 = 0,
        y0 = 0,

        gesture = {
            start: {
                x: 0,
                y: 0
            },
            // Box enclosing all touch coordinates
            box: {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            },
            // distance between first two touche start events
            startDistance: 0,
            prevDistance: 0,
            scale: 1,
            startAngle: 0,
            prevAngle: 0
        },

        interactNodes = [],
        svgTags = [
            'g',
            'rect',
            'circle',
            'ellipse',
            'text',
            'path',
            'line',
            'image'
        ],
        scrollMargin = 70,

        //All things relating to autoScroll
        scroll = {
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

            // Contains the DIV elements which frame the page and initiate autoScroll on mouseMove
            edgeContainer: {
                element: document.createElement('div'),
                events: {}
            },
            edges: {
                top: {
                    element: document.createElement('div'),
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
                    element: document.createElement('div'),
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
                    element: document.createElement('div'),
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
                    element: document.createElement('div'),
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
                    var top = event.clientY < scroll.edges.bottom.element.offsetHeight,
                        right = event.clientX > scroll.edges.right.element.offsetLeft,
                        bottom = event.clientY > scroll.edges.bottom.element.offsetTop,
                        left = event.clientX < scroll.edges.left.element.offsetWidth;

                    scroll.x = scroll.distance * (right? 1: left? -1: 0);
                    scroll.y = scroll.distance * (bottom? 1: top? -1: 0);

                    if (!scroll.isScrolling && target.autoScroll) {
                        scroll.start();
                    }
                }
            },
            edgeOut: function (event) {
                // Mouse may have entered another edge while still being above this one
                // Need to check if mouse is still above this element
                scroll.edgeMove(event);

                // If the window is not supposed to be scrolling in any direction, clear interval
                if (!scroll.x && !scroll.y) {
                    scroll.stop();
                }
            },
            showEdges: function () {
                for (var edge in scroll.edges) {
                    if (scroll.edges.hasOwnProperty(edge)) {
                        scroll.edges[edge].element.classList.add('show');
                    }
                }
                scroll.edgesAreHidden = false;
            },
            hideEdges: function () {
                scroll.stop();

                for (var edge in scroll.edges) {
                    if (scroll.edges.hasOwnProperty(edge)) {
                        scroll.edges[edge].element.classList.remove('show');
                    }
                }
                scroll.edgesAreHidden = true;
            },
            addEdges: function () {
                var currentEdge,
                    style = document.createElement('style');

                style.type = 'text/css';
                style.innerHTML = scroll.edgeStyle;
                scroll.edgeContainer.element.appendChild(style);

                for (var edge in scroll.edges) {
                    if (scroll.edges.hasOwnProperty(edge)) {
                        currentEdge = scroll.edges[edge];
                        scroll.edges[edge].element.style.cssText = scroll.edges[edge].style;
                        scroll.edges[edge].element.classList.add('interact-edge');
                        scroll.edgeContainer.element.appendChild(currentEdge.element);

                        currentEdge.element.x = currentEdge.x;
                        currentEdge.element.y = currentEdge.y;
                    }
                }
                scroll.edgeContainer.element.id = 'edge-container';
                document.body.appendChild(scroll.edgeContainer.element);

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
        target = null,
        supportsTouch = 'createTouch' in document,

        // Less Precision with touch input
        margin = supportsTouch ? 20 : 10,

        mouseIsDown = false,
        gesturing = false,
        dragging = false,
        resizing = false,
        resizeAxes = 'xy',

        // What to do depending on action returned by getAction() of node
        // dictates what cursor should be used and
        // what mouseMove event Listner to is to be added after mouseDown
        actions = {
            resizex: {
                cursor: 'e-resize',
                ready: function () {
                    if (target.resize) {
                        resizeAxes = 'x';
                        events.add(docTarget, moveEvent, resizeMove);
                        addClass(target.element, 'interact-target interact-resizex');
                    }
                },
                start: function() {}
            },
            resizey: {
                cursor: 's-resize',
                ready: function () {
                    if (target.resize) {
                        resizeAxes = 'y';
                        events.add(docTarget, moveEvent, resizeMove);
                        addClass(target.element, 'interact-target interact-resizey');
                    }
                }
            },
            resizexy: {
                cursor: 'se-resize',
                ready: function () {
                    if (target.resize) {
                        resizeAxes = 'xy';
                        events.add(docTarget, moveEvent, resizeMove);
                        addClass(target.element, 'interact-target interact-resizexy');
                    }
                }
            },
            drag: {
                cursor: 'move',
                ready: function () {
                    if (target.drag) {
                        events.add(docTarget, moveEvent, dragMove);
                        addClass(target.element, 'interact-target interact-dragging');
                    }
                }
            },
            gesture: {
                cursor: '',
                ready: function () {
                   if (target.gesture) {
                        events.add(docTarget, moveEvent, gestureMove);
                        addClass(target.element, 'interact-target interact-gesturing');
                    }
                }
            }
        },
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
            element: document,
            events: {}
        },
        windowTarget = {
            element: window,
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

                return target.element.addEventListener(type, listener, useCapture || false);
            },
            remove: function (target, type, listener, useCapture) {
                var i;

                if (target && target.events && target.events[type]) {

                    if (listener === 'all') {
                        for (i = 0; i < target.events[type].length; i++) {
                            target.element.removeEventListener(type, target.events[type][i], useCapture || false);
                            target.events[type].splice(i, 1);
                        }
                    } else {
                        for (i = 0; i < target.events[type].length; i++) {
                            if (target.events[type][i] === listener) {
                                target.element.removeEventListener(type, target.events[type][i], useCapture || false);
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
            pageX = (event.touches)?
                    event.touches[0].pageX:
                    event.pageX,
            pageY = (event.touches)?
                    event.touches[0].pageY:
                    event.pageY;

        clientRect = (svgTags.indexOf(target.element.nodeName) !== -1)?
                target.element.getBoundingClientRect():
                clientRect = target.element.getClientRects()[0];

        right = ((pageX - window.scrollX - clientRect.left) > (clientRect.width - margin));
        bottom = ((pageY - window.scrollY - clientRect.top) > (clientRect.height - margin));

        if (event.touches && event.touches.length > 1 && !(dragging || resizing)) {
            action = 'gesture';
        } else {
            resizeAxes = (right?'x': '') + (bottom?'y': '');
            action = (resizeAxes && target.resize)?
                'resize' + resizeAxes:
                'drag';
        }

        return action;
    }

    // Get event.pageX/Y for mouse and event.touches[0].pageX/Y tor touch
    function getPageXY(event) {
        return {
            pageX: (event.touches)?
                event.touches[0].pageX:
                event.pageX,
            pageY: (event.touches)?
                event.touches[0].pageY:
                event.pageY
        };
    }

    function touchAverage(event) {
        var i,
            touches = event.touches,
            pageX = 0,
            pageY = 0;

        for (i = 0; i < touches.length; i++) {
            pageX += touches[i].pageX / touches.length;
            pageY += touches[i].pageY / touches.length;
        }

        return {
            pageX: pageX,
            pageY: pageY
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
            maxY = minY,
            width,
            height;

        for (i = 0; i < touches.length; i++) {
            minX = Math.max(minX, event.touches[i].pageX);
            minY = Math.max(minY, event.touches[i].pageY);
        }
        width = maxX - minX;
        height = maxY - minY;

        return {
            left: minX,
            top: minY,
            width: width,
            height: height
        };
    }

    function touchDistance(event) {
        var dx = event.touches[0].pageX - event.touches[1].pageX,
            dy = event.touches[0].pageY - event.touches[1].pageY;

        return Math.sqrt(dx * dx + dy * dy);
    }

    function touchAngle(event) {
        var dx = event.touches[0].pageX - event.touches[1].pageX,
            dy = event.touches[0].pageY - event.touches[1].pageY;

        return -Math.atan(dy / dx);
    }

    /**
     * @private
     */
    function resizeMove(event) {
        event.preventDefault();

        var detail,
            resizeEvent,
            page = getPageXY(event),
            pageX = page.pageX,
            pageY = page.pageY;

        if (!resizing) {
            resizeEvent = document.createEvent('CustomEvent');
            detail = {
                axes: resizeAxes,
                x0: x0,
                y0: y0,
                dx: (resizeAxes === 'xy' || resizeAxes === 'x')? (pageX - x0): 0,
                dy: (resizeAxes === 'xy' || resizeAxes === 'y')? (pageY - y0): 0,
                pageX: pageX,
                pageY: pageY,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                button: event.button
            };
            if (target.squareResize || event.shiftKey) {
                if (resizeAxes === 'xy' || resizeAxes === 'x') {
                    detail.dy = detail.dx;// = Math.max(detail.dx, detail.dy);
                } else {
                    detail.dx = detail.dy;
                }
                detail.axes = 'xy';
            }
            resizeEvent.initCustomEvent('interactresizestart', true, true, detail);
            target.element.dispatchEvent(resizeEvent);
            addClass(target.element, 'interact-resize-target');
            resizing = true;
        } else {
            resizeEvent = document.createEvent('CustomEvent');
            detail = {
                axes: resizeAxes,
                x0: x0,
                y0: y0,
                dx: (resizeAxes === 'xy' || resizeAxes === 'x')? (pageX - prevX): 0,
                dy: (resizeAxes === 'xy' || resizeAxes === 'y')? (pageY - prevY): 0,
                pageX: pageX,
                pageY: pageY,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                button: event.button
            };
            if (target.squareResize || event.shiftKey) {
                if (resizeAxes === 'xy' || resizeAxes === 'x') {
                    detail.dy = detail.dx;// = Math.max(detail.dx, detail.dy);
                } else {
                    detail.dx = detail.dy;
                }
                detail.axes = 'xy';
            }
            resizeEvent.initCustomEvent('interactresizemove', true, true, detail);
            target.element.dispatchEvent(resizeEvent);
        }
        prevX = pageX;
        prevY = pageY;
    }

    /**
     * @private
     */
    function dragMove(event) {
        event.preventDefault();

        var detail,
            dragEvent,
            page = getPageXY(event),
            pageX = page.pageX,
            pageY = page.pageY;

        if (!dragging) {
            dragEvent = document.createEvent('CustomEvent');
            detail = {
                x0: x0,
                y0: y0,
                dx: pageX - x0,
                dy: pageY - y0,
                pageX: pageX,
                pageY: pageY,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                button: event.button
            };
            dragEvent.initCustomEvent('interactdragstart', true, true, detail);
            target.element.dispatchEvent(dragEvent);
            dragging = true;
        } else {
            dragEvent = document.createEvent('CustomEvent');
            detail = {
                x0: x0,
                y0: y0,
                dx: pageX - prevX,
                dy: pageY - prevY,
                pageX: pageX,
                pageY: pageY,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                button: event.button
            };
            dragEvent.initCustomEvent('interactdragmove', true, true, detail);
            target.element.dispatchEvent(dragEvent);
        }

        prevX = pageX;
        prevY = pageY;
    }

    function gestureMove(event) {
        if (event.touches.length < 2) {
            return;
        }
        event.preventDefault();

        var detail,
            gestureEvent,
            page = touchAverage(event),
            pageX = page.pageX,
            pageY = page.pageY,
            distance = touchDistance(event),
            scale,
            angle = touchAngle(event),
            rotation = 0;

            gesture.box = getTouchBBox(event);
            gesture.angle = touchAngle(event);

        if (!gesturing) {
            gesture.startDistance = touchDistance(event);
            gesture.startAngle = angle;
            gesture.scale = 1;

            gestureEvent = document.createEvent('CustomEvent');
            detail = {
                x0: x0,
                y0: y0,
                dx: pageX - x0,
                dy: pageY - y0,
                pageX: pageX,
                pageY: pageY,
                touches: event.touches,
                distance: distance,
                scale: gesture.scale,
                ds: 0,
                angle: 180 * angle / Math.PI,
                rotation: rotation
            };
            gestureEvent.initCustomEvent('interactgesturestart', true, true, detail);
            target.element.dispatchEvent(gestureEvent);
            gesturing = true;
        } else {
            rotation = angle - gesture.prevAngle;
            scale = distance / gesture.startDistance;

            if (rotation > Math.PI) {
                rotation -= 2 * Math.PI;
            }
            if (rotation < -Math.PI) {
                rotation += 2 * Math.PI;
            }

            // Convert to degrees from radians
            rotation = 180 * rotation / Math.PI;

            gestureEvent = document.createEvent('CustomEvent');
            detail = {
                x0: x0,
                y0: y0,
                dx: pageX - prevX,
                dy: pageY - prevY,
                pageX: pageX,
                pageY: pageY,
                touches: event.touches,
                distance: distance,
                scale: scale,
                ds: scale - gesture.scale,
                angle: 180 * angle / Math.PI,
                rotation: rotation
            };
            gestureEvent.initCustomEvent('interactgesturemove', true, true, detail);
            target.element.dispatchEvent(gestureEvent);
        }

        prevX = pageX;
        prevY = pageY;
        gesture.prevAngle = angle;
        gesture.prevDistance = distance;
        if (scale !== Infinity && scale !== null && scale !== undefined  && scale !== NaN) {
			gesture.scale = scale;
		} else {
		//	gesture.scale = 1;
		}
    }

    /**
     * @private
     * @event
     * Check what action would be performed on mouseMove target if the mouse button were pressed and change the cursor accordingly
     */
    function mouseMove(event) {
        var action;

        // Check if target element or it's parent is interactable
        if (!mouseIsDown && (target = getInteractNode(event.target) || getInteractNode(event.target.parentNode))) {
            if (target.resize || target.drag) {
                removeClass(target.element, 'interact-resizexy interact-resizex interact-resizey');

                action = target.getAction(event);

				if (!action || !(target[action.match('resize') || action])) {
					return event;
				}
                if (action === 'resize') {
                    action = 'resizexy';
                }

                target.element.style.cursor = actions[action].cursor;
            } else if (dragging || resizing || gesturing) {
                event.preventDefault();
            }
        }
    }

    /**
     * @private
     * @event
     * Determine action to be performed on next mouseMove and add appropriate style and event Liseners
     */
    function mouseDown(event, forceAction) {
        var action = '',
            page = (event.touches)?
                touchAverage(event):
                getPageXY(event),
            pageX = page.pageX,
            pageY = page.pageY;

        mouseIsDown = true;

        // If it is the second touch of a multi-touch gesture, keep the target the same
        if ((event.touches && event.touches.length < 2) || !target) {
            target = getInteractNode(this) || getInteractNode(event.target);
		}

		if (target && !(dragging || resizing || gesturing)) {

			x0 = prevX = pageX;
			y0 = prevY = pageY;
			events.remove(docTarget, moveEvent, 'all');

			action = forceAction || target.getAction(event);
			if (!action || !(target[action.match('resize') || action])) {
				return event;
			}

            if (action === 'resize') {
                action = 'resizexy';
            }

			document.documentElement.style.cursor = target.element.style.cursor = actions[action].cursor;
			actions[action].ready();

            event.preventDefault();
			event.stopPropagation();
			return false;
        }
    }

    /**
     * @private
     * @event
     * End interact move events and stop auto-scroll
     */
    function docMouseUp (event) {
        var detail,
            pageX,
            pageY,
            endEvent;

        if (dragging) {
            endEvent = document.createEvent('CustomEvent');

            pageX = prevX;
            pageY = prevY;
            detail = {
                x0: x0,
                y0: y0,
                dx: pageX - x0,
                dy: pageY - y0,
                pageX: pageX,
                pageY: pageY,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                button: event.button
            };
            endEvent.initCustomEvent('interactdragend', true, true, detail);
            target.element.dispatchEvent(endEvent);
            dragging = false;
        }

        if (resizing) {
            endEvent = document.createEvent('CustomEvent');

            pageX = prevX;
            pageY = prevY;
            detail = {
                x0: x0,
                y0: y0,
                dx: (resizeAxes === 'xy' || resizeAxes === 'x')? (pageX - x0): 0,
                dy: (resizeAxes === 'xy' || resizeAxes === 'y')? (pageY - y0): 0,
                pageX: pageX,
                pageY: pageY,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                button: event.button
            };
            endEvent.initCustomEvent('interactresizeend', true, true, detail);
            target.element.dispatchEvent(endEvent);
            resizing = false;
        }

        if (gesturing) {
            endEvent = document.createEvent('CustomEvent');

            pageX = prevX;
            pageY = prevY;
            detail = {
                x0: x0,
                y0: y0,
                dx: pageX - x0,
                dy: pageY - y0,
                pageX: pageX,
                pageY: pageY,
                touches: event.touches,
                distance: gesture.prevDistance,
                scale: gesture.scale,
                ds: gesture.scale,
                angle: 180 * gesture.prevAngle / Math.PI,
                rotation: 180 * (gesture.prevAngle - gesture.startAngle) / Math.PI
            };
            endEvent.initCustomEvent('interactgestureend', true, true, detail);
            target.element.dispatchEvent(endEvent);
            gesturing = false;
        }

        // Add and remove appropriate events
        events.remove(docTarget, moveEvent, resizeMove);
        events.remove(docTarget, moveEvent, dragMove);
        events.remove(docTarget, moveEvent, gestureMove);
        events.add(docTarget, moveEvent, mouseMove);

        document.documentElement.style.cursor = '';
        mouseIsDown = false;

        // prevent Default only if were previously interacting
        if (target) {
            event.preventDefault();
        }
        clearTarget();

        return event;
    }

    /** @private */
    interactNodes.indexOf = function (element) {
        var i;

        for (i = 0; i < interactNodes.length; i++) {
            if (interactNodes[i].element === element) {
                return i;
            }
        }
        return -1;
    };

    /** @private */
    function getInteractNode(element) {
        var i = interactNodes.indexOf(element) ;

        return interactNodes[i];
    }

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
    function clearTarget() {
        if (target) {
            removeClass(target.element, 'interact-target interact-dragging interact-resizing interact-resizex interact-resizey interact-resizexy');
        }
        target = null;
    }

    /**
     * @global
     * @name interact
     * @description Global interact object
     */
    function interact(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        return getInteractNode(element);
    }

    /**
     * @function
     * @description Add an element to the list of interact nodes
     * @param {HTMLElement | SVGElement} element The DOM Element that will be added
     * @param {Object} options An object whose properties are the drag/resize/gesture options
     */
    interact.set = function (element, options) {
        var indexOfElement = interactNodes.indexOf(element),
            newNode;

        if (typeof options !== 'object') {
            options = {};
        }

        newNode = {
            element: element,
            drag: ('drag' in options)? options.drag : false,
            resize: ('resize' in options)? options.resize : false,
            gesture: ('gesture' in options)? options.gesture : false,
            squareResize: ('squareResize' in options)? options.squareResize : false,
            autoScroll: ('autoScroll' in options)? options.autoScroll : true,
            getAction: (typeof options.actionChecker === 'function')?
                    options.actionChecker:
                    actionCheck
        };

        if (indexOfElement !== -1) {
            interactNodes[indexOfElement] = newNode;
        } else {
            events.add(newNode, downEvent, mouseDown, false);
            interactNodes.push(newNode);
        }

        addClass(element, [
                'interact-node',
                newNode.drag? 'interact-draggable': '',
                newNode.resize? 'interact-resizeable': '',
                newNode.gesture? 'interact-gestureable': ''
            ].join(' '));
    };

    /**
     * @function
     * @description Remove an element from the list of interact nodes
     * @param {HTMLElement | SVGElement} element The DOM Element that will be removed
     */
    interact.unset = function (element) {
        var i = interactNodes.indexOf(element);

        if (i !== -1) {
            events.removeAll(interactNodes[i]);
            interactNodes.splice(i, 1);
            removeClass(element, [
                    'interact-node',
                    'interact-target',
                    'interact-dragging',
                    'interact-draggable',
                    'interact-resizeable',
                    'interact-resize-xy',
                    'interact-resize-x',
                    'interact-resize-y',
                    'interact-gestureable',
                    'interact-gesturing',
                ].join(' '));
        }

    };

    /**
     * @function
     * @description Check if an element has been set
     * @param {HTMLElement | SVGElement} element The DOM Element that will be searched for
     * @returns bool
     */
    interact.isSet = function(element) {
        return interactNodes.indexOf(element !== -1);
    };

    /**
     * @function
     * @description Simulate mouse down to begin drag/resize on an interactable element
     * @param {String} action The action to be performed - drag, resize, resizex, resizey;
     * @param {HTMLElement | SVGElement} element The DOM Element to resize/drag
     * @param {MouseEvent | TouchEvent} [mouseEvent] A mouse event whose pageX/Y coordinates will be the starting point of the interact drag/resize
     */
    interact.simulate = function (action, element, mouseEvent) {
        var event = {},
            prop,
            clientRect;

        if (mouseEvent) {
            for (prop in mouseEvent) {
                if (mouseEvent.hasOwnProperty(prop)) {
                    event[prop] = mouseEvent[prop];
                }
            }
        } else {
            clientRect = (svgTags.indexOf(element.nodeName) !== -1)?
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

        if (action === 'resize') {
            action = 'resizexy';
        }

        event.target = event.currentTarget = element;
        event.preventDefault = event.stopPropagation = function () {};

        mouseDown(event, action);
    };

    interact.eventTypes = eventTypes;

    /**
     * @function
     * @description Displays debugging data in the browser console
     */
    interact.debug = function () {
        console.log('target         :  ' + target);
        console.log('prevX, prevY   :  ' + prevX, prevY);
        console.log('x0, y0         :  ' + x0, y0);
        console.log('supportsTouch  :  ' + supportsTouch);
        console.log('mouseIsDown    :  ' + mouseIsDown);

        return {
            target: target,
            dragging: dragging,
            resizing: resizing,
            gesturing: gesturing,
            prevX: prevX,
            prevY: prevY,
            x0: x0,
            y0: y0,
            nodes: interactNodes,
            mouseIsDown: mouseIsDown,
            supportsTouch: supportsTouch,
            defaultActionCheck: actionCheck,
            dragMove: dragMove,
            resizeMove: resizeMove,
            gestureMove: gestureMove,
            mouseUp: docMouseUp,
            mouseDown: mouseDown,
            mouseMove: mouseMove
        };
    };

    interact.margin = function () {
        return margin;
    };

    events.add(docTarget, upEvent, docMouseUp);
    events.add(docTarget, 'touchcancel', docMouseUp);
    events.add(windowTarget, 'blur' , docMouseUp);
    events.add(docTarget, moveEvent, mouseMove);

    events.add(docTarget, 'DOMContentLoaded', function () {
            scroll.addEdges();
        });


     // Drag and resize start event listeners to show autoScroll
     // edges when interaction starts and hide on drag and resize end

     events.add(docTarget, 'interactresizestart', scroll.showEdges);
     events.add(docTarget, 'interactdragstart', scroll.showEdges);
     events.add(docTarget, 'interactresizeend', scroll.hideEdges);
     events.add(docTarget, 'interactdragend', scroll.hideEdges);

    return interact;
}(window));

