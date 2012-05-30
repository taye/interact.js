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
        nodeStyle,
        target = null,
        supportsTouch = 'createTouch' in document,
        mouseIsDown = false,
        dragging = false,
        resizing = false,
        resizeAxes = 'xy',
        downEvent,
        upEvent,
        moveEvent,
        initialDownEvent = null,
        eventDict = {
            interactresizestart: 'resizestart',
            interactresizemove: 'resizemove',
            interactresizeend: 'resizeend',
            interactdragstart: 'dragstart',
            interactdragmove: 'dragmove',
            interactdragend: 'dragend'
        },
        margin = supportsTouch ? 30 : 10,
        typeErr = new TypeError('Type Error'),
        docTarget = {
            element: document,
            events: []
        },
        /* interactNode events wrapper */
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
                if (target && target.events && target.events[type]) {
                    var i;

                    if (listener === 'all') {
                        for (i = 0; i < target.events[type].length; i++) {
                            target.element.removeEventListener(type, target.events[type][i], useCapture || false);
                            target.events[type].splice(i, 1);
                        }
                    }
                    else {
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
                for (var type in target.evetns) {
                    if (target.events.hasOwnProperty(type)) {
                        events.remove(target, type, 'all');
                    }
                }
            }
        };

    /* Should change this so devices with mouse and touch can use both */
    if (supportsTouch) {
        downEvent = 'touchstart',
        upEvent = 'touchend',
        moveEvent = 'touchmove';
    }
    else {
        downEvent = 'mousedown',
        upEvent = 'mouseup',
        moveEvent = 'mousemove';
    }

    /**
     * @private
     * @event
     */
    function resizeMove(event) {
        var detail;

        if (!resizing) {
            var resizeStartEvent = document.createEvent('CustomEvent');

            detail = {
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
            resizeStartEvent.initCustomEvent('interactresizestart', true, true, detail);
            target.element.dispatchEvent(resizeStartEvent);

            resizing = true;
            addClass(target.element, 'interact-resize-target');
        }
        else {
            var resizeMoveEvent = document.createEvent('CustomEvent');

            detail = {
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
            resizeMoveEvent.initCustomEvent('interactresizemove', true, true, detail);
            target.element.dispatchEvent(resizeMoveEvent);
        }
        if (mouseIsDown && target.resize) {
            prevX = event.pageX;
            prevY = event.pageY;
        }
    }


    /**
     * @private
     * @event
     */
    function dragMove(event) {
        var detail;

        /* if(initialDownEvent) {//
            initialDownEvent.preventDefault();
            initialDownEvent.stopPropagation();
        }
        */
        //event.preventDefault();
        if (!dragging) {
            var dragStartEvent = document.createEvent('CustomEvent');

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
            dragStartEvent.initCustomEvent('interactdragstart', true, true, detail);
            target.element.dispatchEvent(dragStartEvent);
            dragging = true;
        }
        else {
            var dragMoveEvent = document.createEvent('CustomEvent');

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
            dragMoveEvent.initCustomEvent('interactdragmove', true, true, detail);
            target.element.dispatchEvent(dragMoveEvent);
        }
        if (true) {
            prevX = event.pageX;
            prevY = event.pageY;
        }
    }


    /**
     * @private
     * @event
     */
    function mouseMove(event) {
        if (!mouseIsDown && (target = getInteractNode(event.target))) {
            if (target.resize) {
                var clientRect = target.element.getClientRects()[0],
                    axes,
                    right = ((event.pageX - clientRect.left) > (clientRect.width - margin)),
                    bottom = ((event.pageY - clientRect.top) > (clientRect.height - margin));

                removeClass(target.element, 'interact-xyresize interact-xresize interact-yresize');
                axes = (right?'x': '') + (bottom?'y': '');
                
                if (axes) {
                    addClass(target.element, 'interact-' + axes + 'resize');
                }
            }
        }
        else if (dragging || resizing) {
            event.preventDefault();
        }
    }


    /**
     * @private
     * @event
     */
    function mouseDown(event) {
        mouseIsDown = true;
        if ((target = getInteractNode(event.currentTarget))) {
            initialDownEvent = event;
            event.preventDefault();

            if (target.drag || target.resize) {
                x0 = prevX = event.pageX;
                y0 = prevY = event.pageY;
                events.remove(docTarget, moveEvent, 'all');
            }
            var clientRect = target.element.getClientRects()[0],
                right = ((x0 - clientRect.left) > (clientRect.width - margin)),
                bottom = ((y0 - clientRect.top) > (clientRect.height - margin));

            if (right || bottom) {
                resizeAxes = (right?'x': '') + (bottom?'y': '');
                addClass(document.documentElement, 'interact-' + resizeAxes + 'resize');
                addClass(target.element, 'interact-target ineract-resizing');
                events.add(docTarget, moveEvent, resizeMove);
            }
            else if (target.drag) {
                events.add(docTarget, moveEvent, dragMove);
                addClass(target.element, 'interact-target ineract-dragging');
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
            pageY;

        if (dragging) {
            var dragEnd = document.createEvent('CustomEvent');

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
            dragEnd.initCustomEvent('interactdragend', true, true, detail);
            target.element.dispatchEvent(dragEnd);
            dragging = false;
        }
        if (resizing) {
            var resizeEnd = document.createEvent('CustomEvent');

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
            resizeEnd.initCustomEvent('interactresizeend', true, true, detail);
            target.element.dispatchEvent(resizeEnd);
            resizing = false;
        }
        /* Add and remove appropriate events */
        events.remove(docTarget, moveEvent, resizeMove);
        events.remove(docTarget, moveEvent, dragMove);
        events.add(docTarget, upEvent, docMouseUp, false);
        events.add(docTarget, moveEvent, mouseMove);
        removeClass(document.documentElement, 'interact-' + resizeAxes + 'resize');
        mouseIsDown = false;
        clearTarget();
    }


    /** @private */
    function getInteractNode(element) {
        for(var i=0; i < interactNodes.length; i++) {
            if (interactNodes[i].element === element) {
                return interactNodes[i];
            }
        }
        return null;
    }

    /** @private */
    function addClass(element, classNames) {
        classNames = classNames.split(' ');
        for (var i = 0; i < classNames.length; i++) {
            element.classList.add(classNames[i]);
        }
    }

    /** @private */
    function removeClass(element, classNames) {
        classNames = classNames.split(' ');
        for (var i = 0; i < classNames.length; i++) {
            element.classList.remove(classNames[i]);
        }
    }

    /** @private */
    function clearTarget() {
        if (target) {
            removeClass(target.element, 'interact-target interact-dragging interact-resizing');
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
     * @description Displays debugging data in the browser console
     */
    interact.debug = function () {
        console.log('target         :  ' + target);
        console.log('prevX, prevY   :  ' + prevX + ', ' + prevY);
        console.log('x0, y0         :  ' + x0 + ', ' + y0);
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

    /**
     * @function
     * @description Add an element to the list of interact nodes
     * @param {object HTMLElement} element The DOM Element that will be added
     * @param {object} options An object whose properties are the drag/resize options
     */
    interact.set = function (element, options) {
        var nodeAlreadySet = !!getInteractNode(element),
            i = 0,
            newNode,
            styleClass = 'interact-node',
            clientRect = element.getClientRects()[0];

        if (typeof options !== 'object') {
            options = {};
        }

        newNode = {
                element: element,
                drag: ('drag' in options)? options.drag : false,
                resize: ('resize' in options)? options.resize : false
            };
        if (nodeAlreadySet) {
            interactNodes[i] = newNode;
        }
        else {
            /* Add event listeners */
//            events.add(newNode, moveEvent, mouseMove);
            events.add(newNode, downEvent, mouseDown, false);

            interactNodes.push(newNode);
        }
        if (newNode.drag) {
            newNode.element.style.setProperty('left', (options.x? options.x : clientRect.left) + 'px', '');
            newNode.element.style.setProperty('top', (options.y? options.y : clientRect.top) + 'px', '');
            styleClass += ' interact-draggable';
        }
        if (newNode.resize) {
            styleClass += ' interact-resizeable';
        }
        addClass(element, styleClass);
    };

    /**
     * @function
     * @description Remove an element from the list of interact nodes
     * @param {object HTMLElement} element The DOM Element that will be removed
     */
    interact.unset = function (element) {
        var i;

        for (i = 0; i < interactNodes.length; i++) {
            if (interactNodes[i].element === element) {
                interactNodes.splice(i, 1);
                events.removeAll(interactNodes[i]);
            }
        }
        removeClass(element, 'interact-node interact-target interact-dragging interact-resizing interact-draggable interact-resizeable interact-resize-xy interact-resize-x interact-resize-y');
    };

    /**
     * @function
     * @description Check if an element has been set
     * @param {object HTMLElement} element The DOM Element that will be searched for
     * @returns bool
     */
    interact.isSet = function(element) {
        for(var i=0; i < interactNodes.length; i++) {
            if (interactNodes[i].element === element) {
                return true;
            }
        }
        return false;
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
    events.add(docTarget, upEvent, docMouseUp);
    events.add(docTarget, moveEvent, mouseMove);

    /*
     * For debugging
     */
    //events.add(docTarget, upEvent, function(e) {alert(e.pageX + ', ' + e.pageY)}, false);

    return interact;
}());

