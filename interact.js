/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/biographer/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js module
 * @name interact
 */
window.interact = (function () {
    'use strict';

    var prevX = 0,
        prevY = 0,
        x0 = 0,
        y0 = 0,
        interactNodes = [],
        svgTags = {
            g: 'g',
            rect: 'rect',
            circle: 'circle',
            ellipse: 'ellipse',
            text: 'text',
            path: 'path',
            line: 'line',
            image: 'image'
        },
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
            	'	width: 0;',
            	'	height: 0;',
            	'	margin: 0;',
            	'	padding: 0;',
            	'	border: none;',
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

		            if (!scroll.isScrolling) {
			            scroll.start();
		            }
	            }
            },
            edgeOut: function (event) {
                var edge = event.target;

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
            }
        },
        downEvent,
        upEvent,
        moveEvent,
        overEvent,
        outEvent,
        enterEvent,
        leaveEvent,
        eventDict = {
            interactresizestart: 'resizestart',
            interactresizemove: 'resizemove',
            interactresizeend: 'resizeend',
            interactdragstart: 'dragstart',
            interactdragmove: 'dragmove',
            interactdragend: 'dragend'
        },
        docTarget = {
            element: document,
            events: {}
        },
        windowTarget = {
            element: window,
            events: {}
        },
        
        // Get event.pageX/Y for mouse and event.touches[0].pageX/Y tor touch
        getPageXY = function (event) {
			return {
				x: (event.touches)?
					event.touches[0].pageX:
					event.pageX,
				y: (event.touches)?
					event.touches[0].pageY:
					event.pageY
			};
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
    function autoCheck(event) {
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

        clientRect = (target.element.nodeName in svgTags)?
                target.element.getBoundingClientRect():
                clientRect = target.element.getClientRects()[0];

        right = ((pageX - window.scrollX - clientRect.left) > (clientRect.width - margin));
        bottom = ((pageY - window.scrollY - clientRect.top) > (clientRect.height - margin));

        resizeAxes = (right?'x': '') + (bottom?'y': '');
        action = (resizeAxes && target.resize)?
            'resize' + resizeAxes:
            'drag';

        return action;
    }

    /**
     * @private
     * @param {Object HTMLElement | Object SVGElement} element
     * Place element above others under the same parent
     */
    function bringToFront(element) {
        if (element.nodeName in svgTags) {
            return(element.parentNode.parentNode.appendChild(element.parentNode));
        } else {
            return(element.parentNode.appendChild(element));
        }
    }

    /**
     * @private
     */
    function resizeMove(event) {
        var detail,
            resizeEvent,
			page = getPageXY(event),
			pageX = page.x,
			pageY = page.y;

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
        var detail,
            dragEvent,
			page = getPageXY(event),
			pageX = page.x,
			pageY = page.y;

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
            if (target.order) {
                bringToFront(target.element);
            }
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

    /**
     * @private
     * @event
     * Check what action would be performed on mouseMove target if the mouse button were pressed and change the cursor accordingly
     */
    function mouseMove(event) {
        var right,
            bottom,
            axes,
            action;

        // Check if target element or it's parent is interactable
        if (!mouseIsDown && (target = getInteractNode(event.target) || getInteractNode(event.target.parentNode))) {
            if (target.resize) {
                removeClass(target.element, 'interact-resizexy interact-resizex interact-resizey');

                action = target.getAction(event);

                target.element.style.cursor = actions[action].cursor;
            } else if (dragging || resizing) {
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
        var right,
            bottom,
            action = '',
			page = getPageXY(event),
			pageX = page.x,
			pageY = page.y;

        mouseIsDown = true;
        if ((target = getInteractNode(event.currentTarget))) {
            event.preventDefault();

            if (target.drag || target.resize) {
                x0 = prevX = pageX;
                y0 = prevY = pageY;
                events.remove(docTarget, moveEvent, 'all');

                action = forceAction || target.getAction(event);

                document.documentElement.style.cursor = target.element.style.cursor = actions[action].cursor;
                actions[action].ready();
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
            pageX,
            pageY,
            endEvent;

        /*
         * With the way autoScroll currently works, it might be a good idea to
         * use the pageX/Y from the previous mousemove event (prevX, prevY)
         * so in situation where page is scrolled but element position remains the same,
         * the element being dragged/moved doesn't jump or explode after mouseup
         */

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

        // Add and remove appropriate events
        events.remove(docTarget, moveEvent, resizeMove);
        events.remove(docTarget, moveEvent, dragMove);
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
            element.classList.add(classNames[i]);
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
            element.classList.remove(classNames[i]);
        }
    }

    /** @private */
    function clearTarget() {
        if (target) {
            removeClass(target.element, 'interact-target interact-dragging interact-resizing interact-resizexy interact-resizex interact-resizexy');
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
     * @param {Object HTMLElement | Object SVGElement} element The DOM Element that will be added
     * @param {Object} options An object whose properties are the drag/resize options
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
            squareResize: ('squareResize' in options)? options.squareResize : false,
            getAction: (typeof options.actionChecker === 'function')? options.actionChecker: autoCheck,
            order: ('order' in options)? options.order : false
        };

        if (indexOfElement !== -1) {
            interactNodes[indexOfElement] = newNode;
        } else {
            events.add(newNode, downEvent, mouseDown, false);
            interactNodes.push(newNode);
        }

        addClass(element, 'interact-node' + (newNode.resize? ' interact-resizeable': '') + (newNode.drag? ' interact-dragable': ''));
    };

    /**
     * @function
     * @description Remove an element from the list of interact nodes
     * @param {Object HTMLElement | Object SVGElement} element The DOM Element that will be removed
     */
    interact.unset = function (element) {
        var i = interactNodes.indexOf(element);

        if (i !== -1) {
            events.removeAll(interactNodes[i]);
            interactNodes.splice(i, 1);
            removeClass(element, 'interact-node interact-target interact-dragging interact-draggable interact-resizeable interact-resize-xy interact-resize-x interact-resize-y');
        }

    };

    /**
     * @function
     * @description Check if an element has been set
     * @param {Object HTMLElement | Object SVGElement} element The DOM Element that will be searched for
     * @returns bool
     */
    interact.isSet = function(element) {
        var i;

        return interactNodes.indexOf(element !== -1);
    };

    /**
     * @function
     * @description Simulate mouse down to begin drag/resize on an interactable element
     * @param {String} action The action to be performed - drag, resize, resizex, resizey;
     * @param {Object HTMLElement | Object SVGElement} element The DOM Element to resize/drag
     * @param {MouseEvent} [mouseEvent] A mouse event whose pageX/Y coordinates will be the starting point of the interact drag/resize
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
            clientRect = (element.nodeName in svgTags)?
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
    }

    /**
     * @function
     * @param {string} [type] Event type to be searched for
     * @returns {string} The name of the custom interact event
     * @returns OR
     * @returns {Object} An object linking event types to string values
     */
    interact.eventDict = function (type) {
        if (arguments.length === 0) {
            return eventDict;
        }

        return eventDict[type];
    };

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
            prevX: prevX,
            prevY: prevY,
            startX: x0,
            startY: y0,
            nodes: interactNodes,
            mouseIsDown: mouseIsDown,
            supportsTouch: supportsTouch
        };
    };
    interact.margin = function () {
        return margin;
    }
    events.add(docTarget, upEvent, docMouseUp);
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
}());

