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
        scroll = {
            margin: 70,
            distance: 10,
            vector: {
                x: 0,
                y: 0
            },
            autoScroll: function () {
                window.scrollBy(scroll.vector.x, scroll.vector.y);
            },
            interval: 20,
            // To store return value of window.setInterval
            i: null
        },
        edges = {
            top: {
                element: document.createElement('div'),
                events: {},
                style: [
                    '',
                    'top: 0px;',
                    'left: 0px;',
                    // screen width * 5 in case page is zoomed out
                    'width: ' + window.screen.width * 5 + 'px !important;',
                    'height: ' + scroll.margin + 'px !important;'
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
                    'width: ' + scroll.margin + 'px !important;',
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
                    'height: ' + scroll.margin + 'px !important;'
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
                    'width: ' + scroll.margin + 'px !important;',
                    'height: ' + window.screen.height * 4 + 'px !important;'
                    ].join(''),
                x: -1
            }
        },
        edgeStyle = [
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
            ].join(''),
        edgesInBody = false,
        target = null,
        supportsTouch = 'createTouch' in document,
        margin = supportsTouch ? 30 : 10,
        mouseIsDown = false,
        dragging = false,
        resizing = false,
        resizeAxes = 'xy',
        actions = {
            resizex: {
                cursor: 'e-resize',
                ready: function () {
                    if (!target.resize) {
                        return false;
                    }
                    resizeAxes = 'x';
                    events.add(docTarget, moveEvent, resizeMove);
                    addClass(target.element, 'interact-target interact-resizex');
                },
                start: function() {}
            },
            resizey: {
                cursor: 's-resize',
                ready: function () {
                    if (!target.resize) {
                        return false;
                    }
                    resizeAxes = 'y';
                    events.add(docTarget, moveEvent, resizeMove);
                    addClass(target.element, 'interact-target interact-resizey');
                }
            },
            resizexy: {
                cursor: 'se-resize',
                ready: function () {
                    if (!target.resize) {
                        return false;
                    }
                    resizeAxes = 'xy';
                    events.add(docTarget, moveEvent, resizeMove);
                    addClass(target.element, 'interact-target interact-resizexy');
                }
            },
            drag: {
                cursor: 'move',
                ready: function () {
                    if (!target.drag) {
                        return false;
                    }
                    events.add(docTarget, moveEvent, dragMove);
                    addClass(target.element, 'interact-target interact-dragging');
                }
            }
        },
        downEvent,
        upEvent,
        moveEvent,
        eventDict = {
            interactresizestart: 'resizestart',
            interactresizemove: 'resizemove',
            interactresizeend: 'resizeend',
            interactdragstart: 'dragstart',
            interactdragmove: 'dragmove',
            interactdragend: 'dragend'
        },
        // So autoScroll knows what type of event to simulate after scrolling
        currentInteractEvent = null,
        docTarget = {
            element: document,
            events: {}
        },
        windowTarget = {
            element: window,
            events: {}
        },
        // interact events wrapper
        events = {};

        events.add = function (target, type, listener, useCapture) {
            if (typeof target.events !== 'object') {
                target.events = {};
            }

            if (typeof target.events[type] !== 'array') {
                target.events[type] = [];
            }

            target.events[type].push(listener);

            return target.element.addEventListener(type, listener, useCapture || false);
        };

        events.remove = function (target, type, listener, useCapture) {
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
        };

        events.removeAll = function (target) {
            var type;

            for (type in target.events) {
                if (target.events.hasOwnProperty(type)) {
                    events.remove(target, type, 'all');
                }
            }
        };

    // Should change this so devices with mouse and touch can use either/both
    if (supportsTouch) {
        downEvent = 'touchstart',
        upEvent = 'touchend',
        moveEvent = 'touchmove';
    } else {
        downEvent = 'mousedown',
        upEvent = 'mouseup',
        moveEvent = 'mousemove';
    }

    function edgeEnter(event) {
        if (dragging || resizing) {
            if (event.target.x !== undefined) {
                scroll.vector.x = scroll.distance * event.target.x;
            }
            if (event.target.y !== undefined) {
                scroll.vector.y = scroll.distance * event.target.y;
            }

            window.scrollBy(scroll.vector.x, scroll.vector.y);
            window.clearInterval(scroll.i);
            scroll.i = window.setInterval(scroll.autoScroll, scroll.interval );
        }
    }

    function edgeMove(event) {
        var top = event.clientY < edges.bottom.element.getBoundingClientRect().height,
            right = event.clientX > edges.right.element.getBoundingClientRect().left,
            bottom = event.clientY > edges.bottom.element.getBoundingClientRect().top,
            left = event.clientX < edges.left.element.getBoundingClientRect().width;
        /*
         * If the mouse is not over the right or left edge,
         * Don't scroll in x
         */
        if (scroll.vector.x !== 0 &&
            !right &&
            !left) {
            scroll.vector.x = 0;
        } else {
            scroll.vector.x = scroll.distance * (right? 1: left? -1: 0);
        }
        /*
         * If the mouse is not over the bottom or top edge,
         * Don't scroll in y
         */
        if (scroll.vector.y !== 0 &&
            !top &&
            !bottom) {
            scroll.vector.y = 0;
        } else {
            scroll.vector.y = scroll.distance * (bottom? 1: top? -1: 0);
        }
    }
            
    function edgeOut(event) {
        var edge = event.target;

        /*
         * Mouse may have entered another edge while still being above this one
         * Need to check if mouse is still above this element
         */
        edgeMove(event);

        // If the window is not supposed to be scrolling in any direction, clear interval
        if (!scroll.vector.x && !scroll.vector.y) {
            window.clearInterval(scroll.i);
        }
    }
    
    function showEdges (event) {
        for (var edge in edges) {
            if (edges.hasOwnProperty(edge)) {
                edges[edge].element.classList.add('show');
            }
        }
    }
    
    function hideEdges () {
        for (var edge in edges) {
            if (edges.hasOwnProperty(edge)) {
                edges[edge].element.classList.remove('show');
            }
        }
    }
    
    
    for (var edge in edges) {
        if (edges.hasOwnProperty(edge)) {
            edges[edge].element.style.cssText = edges[edge].style;
            edges[edge].element.classList.add('interact-edge');
            
            events.add(edges[edge], 'mouseenter', edgeEnter);
            events.add(edges[edge], moveEvent, edgeMove);
            events.add(edges[edge], 'mouseout', edgeOut);
        }
    }

    function addScrollEdges() {
        var currentEdge,
            style = document.createElement('style');

        style.type = 'text/css';
        style.innerHTML = edgeStyle;
        document.body.appendChild(style);
        
        for (var edge in edges) {
            if (edges.hasOwnProperty(edge)) {
                currentEdge = edges[edge];
                document.body.appendChild(currentEdge.element);
                
                currentEdge.element.x = currentEdge.x;
                currentEdge.element.y = currentEdge.y;
            }
        }
        edgesInBody = true;
    }
    
    function autoCheck(event) {
        var clientRect,
            right,
            bottom,
            action;
            
        if (target.element.nodeName in svgTags) {
            clientRect = target.element.getBoundingClientRect();
            right = ((event.pageX - window.scrollX - clientRect.left) > (clientRect.width - margin));
            bottom = ((event.pageY - window.scrollY - clientRect.top) > (clientRect.height - margin));
            resizeAxes = (right?'x': '') + (bottom?'y': '');
            action = (resizeAxes && target.resize)?
                'resize' + resizeAxes:
                'drag';

            return action;
        }
        
        clientRect = target.element.getClientRects()[0];
        right = ((event.pageX - window.scrollX - clientRect.left) > (clientRect.width - margin));
        bottom = ((event.pageY - window.scrollY - clientRect.top) > (clientRect.height - margin));

        resizeAxes = (right?'x': '') + (bottom?'y': '');
        action = (resizeAxes && target.resize)?
            'resize' + resizeAxes:
            'drag';

        return action;
    }
    
    function bringToFront(element) {
        if (element.nodeName in svgTags) {
            element.parentNode.parentNode.appendChild(element.parentNode);
        } else {
            element.parentNode.appendChild(element);
        }
    }

    /**
     * @private
     * @event
     */
    function resizeMove(event) {
        var detail,
            resizeEvent;

        if (!resizing) {
            resizeEvent = document.createEvent('CustomEvent');
            detail = {
                axes: resizeAxes,
                x0: x0,
                y0: y0,
                dx: (resizeAxes === 'xy' || resizeAxes === 'x')? (event.pageX - x0): 0,
                dy: (resizeAxes === 'xy' || resizeAxes === 'y')? (event.pageY - y0): 0,
                pageX: event.pageX,
                pageY: event.pageY,
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
                dx: (resizeAxes === 'xy' || resizeAxes === 'x')? (event.pageX - prevX): 0,
                dy: (resizeAxes === 'xy' || resizeAxes === 'y')? (event.pageY - prevY): 0,
                pageX: event.pageX,
                pageY: event.pageY,
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
        prevX = event.pageX;
        prevY = event.pageY;
    }

    /**
     * @private
     * @event
     */
    function dragMove(event) {
        var detail,
            dragEvent;

        if (!dragging) {
            dragEvent = document.createEvent('CustomEvent');
            detail = {
                x0: x0,
                y0: y0,
                dx: event.pageX - x0,
                dy: event.pageY - y0,
                pageX: event.pageX,
                pageY: event.pageY,
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
                dx: event.pageX - prevX,
                dy: event.pageY - prevY,
                pageX: event.pageX,
                pageY: event.pageY,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                button: event.button
            };
            dragEvent.initCustomEvent('interactdragmove', true, true, detail);
            target.element.dispatchEvent(dragEvent);
        }

        prevX = event.pageX;
        prevY = event.pageY;
    }

    /**
     * @private
     * @event
     */
    function mouseMove(event) {
        var right,
            bottom,
            axes,
            action;

        if (!mouseIsDown && (target = getInteractNode(event.target))) {
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
     */
    function mouseDown(event) {
        var right,
            bottom,
            action = '';

        mouseIsDown = true;
        if ((target = getInteractNode(event.currentTarget))) {
            event.preventDefault();

            if (target.drag || target.resize) {
                x0 = prevX = event.pageX;
                y0 = prevY = event.pageY;
                events.remove(docTarget, moveEvent, 'all');

                action = target.getAction(event);

                document.documentElement.style.cursor = target.element.style.cursor = actions[action].cursor;
                actions[action].ready();
            }
        }
    }

    /**
     * @private
     * @event
     */
    function docMouseUp (event) {
        var detail,
            pageX,
            pageY,
            endEvent;

        /*
         * With the way autoScroll currently works, it might be a good idea to
         * use the pageX/Y from the previous mousemove event (prevX, prevY)
         * so in situation where page is crolled but element position remains the same,
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
        
        // Stop AutoScroll
        hideEdges();
        window.clearInterval(scroll.i);
        scroll.vector.x = scroll.vector.y = 0;

        document.documentElement.style.cursor = '';
        mouseIsDown = false;
        clearTarget();
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
     * @param {object HTMLElement} {object SVGElement} element The DOM Element that will be added
     * @param {object} options An object whose properties are the drag/resize options
     */
    interact.set = function (element, options) {
        var indexOfElement = interactNodes.indexOf(element),
            newNode;

        if (!edgesInBody) {
            addScrollEdges();
        }
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
     * @param {object HTMLElement} element The DOM Element that will be removed
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
     * @param {object HTMLElement} element The DOM Element that will be searched for
     * @returns bool
     */
    interact.isSet = function(element) {
        var i;

        return interactNodes.indexOf(element !== -1);
    };
        

    /**
     * @function
     * @description
     * @param {string} [type] Event type to be searched for
     * @returns {string} The name of the custom interact event
     * @returns OR
     * @returns {object} An object linking event types to string values
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
    interact.removeClass = removeClass;
    window.nodes = interactNodes;

    events.add(docTarget, upEvent, docMouseUp);
    events.add(windowTarget, 'blur' , docMouseUp);
    events.add(docTarget, moveEvent, mouseMove, 'true');

    /*
     * Drag and resize start event listeners to show autoScroll
     * edges when interaction starts (hidden on document mouseup)
     */
     events.add(docTarget, 'interactresizestart', showEdges);
     events.add(docTarget, 'interactdragstart', showEdges);
     events.add(docTarget, 'interactresizeend', hideEdges);
     events.add(docTarget, 'interactdragend', hideEdges);

    return interact;
}());

