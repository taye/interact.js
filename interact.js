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
        autoScrollMargin = 70,
        scrollDistance = 30,
        topEdge = document.createElement('div'),
        rightEdge = document.createElement('div'),
        bottomEdge = document.createElement('div'),
        leftEdge = document.createElement('div'),
        edgeCSS = [
            'position: fixed !important;',
            'background-color: transparent !important;',
            'z-index: 9000 !important;',
            'margin: 0 !important;',
            'padding: 0 !important;',
            'border: none 0 !important;'
        ].join('\n'),
        topEdgeCSS = [
            '',
            'top: 0;',
            'left: 0;',
            'width: ' + window.screen.width * 4 + 'px !important;',
            'height: ' + autoScrollMargin + 'px !important;'
        ].join('\n'),
        rightEdgeCSS = [
            '',
            'top: 0;',
            'right: 0;',
            'width: ' + autoScrollMargin + 'px !important;',
            'height: ' + window.screen.height * 4 + 'px !important;'
        ].join('\n'),
        bottomEdgeCSS = [
            '',
            'bottom: 0;',
            'left: 0;',
            'width: ' + window.screen.width * 4 + 'px !important;',
            'height: ' + autoScrollMargin + 'px !important;'
        ].join('\n'),
        leftEdgeCSS = [
            '',
            'top: 0;',
            'left: 0;',
            'width: ' + autoScrollMargin + 'px !important;',
            'height: ' + window.screen.height * 4 + 'px !important;'
        ].join('\n'),
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

    topEdge.style.cssText =
        rightEdge.style.cssText =
            bottomEdge.style.cssText =
                leftEdge.style.cssText = edgeCSS;

    topEdge.style.cssText += topEdgeCSS;
    rightEdge.style.cssText += rightEdgeCSS;
    bottomEdge.style.cssText += bottomEdgeCSS;
    leftEdge.style.cssText += leftEdgeCSS;

    topEdge.y = -1;
    rightEdge.x = 1;
    bottomEdge.y = 1;
    leftEdge.x = -1

    function addScrollEdges() {
        document.body.appendChild(topEdge);
        document.body.appendChild(rightEdge);
        document.body.appendChild(bottomEdge);
        document.body.appendChild(leftEdge);
        
        edgesInBody = true;
    }
    
    function edgeMoveListener(event) {
        if (dragging || resizing) {
            var x = scrollDistance * (event.target.x || 0),
                y = scrollDistance * (event.target.y || 0);
            
            window.scrollBy(x, y);
        }
    }

    topEdge.addEventListener(moveEvent, edgeMoveListener);
    rightEdge.addEventListener(moveEvent, edgeMoveListener);
    bottomEdge.addEventListener(moveEvent, edgeMoveListener);
    leftEdge.addEventListener(moveEvent, edgeMoveListener);
    
    /**    function addScrollEd
     * @private
     * @event
     */
    function resizeMove(event) {
        var detail,
            resizeEvent,
            autoScroll = checkScrollEdges();

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
        action,
        right = ((event.pageX - window.scrollX - clientRect.left) > (clientRect.width - margin));
        bottom = ((event.pageY - window.scrollY - clientRect.top) > (clientRect.height - margin));

        resizeAxes = (right?'x': '') + (bottom?'y': '');
        action = (resizeAxes && target.resize)?
            'resize' + resizeAxes:
            'drag';

        return action;
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
            }
            action = target.getAction(event);

            document.documentElement.style.cursor = target.element.style.cursor = actions[action].cursor;
            actions[action].ready();
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
    }

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
            getAction: (typeof options.actionChecker === 'function')? options.actionChecker: autoCheck
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

    return interact;
}());

