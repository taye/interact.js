/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/biographer/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js module
 * @name interact
 */
window.interactDemo = (function(interact) {
    'use strict';

    var interactDemo = {},
        svg,
        svgTags = {
            g: 'g',
            rect: {
                setSize: function (element, x, y) {
                    if (typeof x === 'number') {
                        element.setAttribute('width', x);
                    }
                    if (typeof y === 'number') {
                        element.setAttribute('height', y);
                    }
                },
                getSize: function (element) {
                    return {
                        x: Number(element.getAttribute('width')),
                        y: Number(element.getAttribute('height'))
                    }
                }
            },
            circle: {
                setSize: function (element, x, y) {
                    if (typeof x === 'number') {
                        element.setAttribute('r', x * 0.5);
                    }
                },
                getSize: function (element) {
                    return {
                        x: Number(element.getAttribute('r')) * 2,
                        y: Number(element.getAttribute('r')) * 2
                    }
                }
            },
            ellipse: {
                setSize: function (element, x, y) {
                    if (typeof x === 'number') {
                        element.setAttribute('rx', x * 0.5);
                    }
                    if (typeof y === 'number') {
                        element.setAttribute('ry', y * 0.5);
                    }
                },
                getSize: function (element) {
                    return {
                        x: Number(element.getAttribute('rx')) * 2,
                        y: Number(element.getAttribute('ry')) * 2
                    }
                }
            },
            text: 'text',
            path: 'path',
            line: 'line',
            image: 'image'
        },
        margin = 15,
        minSize = 30,
        prevX = 0,
        prevY = 0,
        realtime = true;

        interact = interact || window.interact;
        if (!interact) {
            console.log('interact not included');
            return;
        }

    function divActionChecker(event) {
        var target = (event.currentTarget === document)? event.target: event.currentTarget,
            clientRect = target.getClientRects()[0],
            right = ((event.pageX - window.scrollX - clientRect.left) > (clientRect.width - margin)),
            bottom = ((event.pageY - window.scrollY - clientRect.top) > (clientRect.height - margin)),
            axes = (right?'x': '') + (bottom?'y': ''),
            action = (axes)?
                'resize' + axes:
                'drag';

        return action;
    }

    function graphicActionChecker(event) {
        var target = (event.currentTarget === document)? event.target: event.currentTarget,
            clientRect = target.getBoundingClientRect(),
            right = ((event.pageX - window.scrollX - clientRect.left) > (clientRect.width - margin)),
            bottom = ((event.pageY - window.scrollY - clientRect.top) > (clientRect.height - margin)),
            axes = (right?'x': '') + (bottom?'y': ''),
            action = (axes)?
                'resize' + axes:
                'drag';

        return action;
    }

    /**
     * @function
     * @description Introduce random draggable, resizeable graphic nodes to the document (for testing)
     * @param {number} [n] The number of nodes to be added (default: 5)
     */
    function randomGraphics(n) {
        var svgNS = 'http://www.w3.org/2000/svg',
            newGraphic,
            rect,
            parent,
            text,
            title,
            width = window.innerWidth,
            height = window.innerHeight,
            x,
            y,
            i,
            buttunFunction = function (e) {
                e.target.innerHTML = e.type;
            };

        if (!svg) {
            svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', '0 0 0 0');
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);

            document.body.appendChild(svg);
            window.s = svg;
        }

        if (n < 0 || !Number(n)) {
            n = 5;
        }

        parent = svg;

        for (i = 0; i < n; i++) {
            newGraphic = svg.appendChild(document.createElementNS(svgNS, 'g'));
            newGraphic.style.setProperty('class', 'interact-demo-node');
            newGraphic.id = 'graphic' + i;
            newGraphic.setAttribute('fill', '#ee0');
            newGraphic.setAttribute('stroke', '#000');
            newGraphic.setAttribute('stroke-width', '2px');

            x = Math.random()*(width - 200);
            y = Math.random()*(height - 200);

            setTransform(newGraphic, 'translate', [x, y]);

            rect = document.createElementNS(svgNS, 'rect');
            rect.interactDemo = true;
            rect.setAttribute('width', 150);
            rect.setAttribute('height', 150);
            newGraphic.appendChild(rect);
            window['r'+i] = rect;

            text = newGraphic.appendChild(document.createElementNS( svgNS, 'text'));
            text.setAttribute('fill', '#000');
            text.setAttribute('stroke', '#000');
            text.setAttribute('stroke-width', '0px');
            rect.text = text;

            title = newGraphic.appendChild(document.createElementNS(svgNS, 'text'));
            title.textContent = newGraphic.id;
            title.setAttribute('fill', '#000');
            title.setAttribute('stroke', '#000');
            title.setAttribute('stroke-width', '0px');
            title.setAttribute('x', 50);
            title.setAttribute('y', 20);

            interact.set(rect, {
                drag: true,
                resize: true,
                squareResize: true
            });
            window['g' + i] = newGraphic;
        }
    }

    /**
     * @function
     * @description Introduce random draggable, resizeable nodes to the document (for testing)
     * @param {number} [n] The number of nodes to be added (default: 5)
     * @param {object} [parent] An object with boolean properties (default: document.body)
     */
    function randomDivs(n, parent) {
        var newDiv,
            text,
            button,
            i,
            buttunFunction = function (e) {
                e.target.innerHTML = e.type;
            };

        if (n < 0 || typeof n !== 'number') {
            n = 5;
        }

        parent = parent || document.body;

        for (i = 0; i < n; i++) {
            newDiv = parent.appendChild(document.createElement('div'));
            newDiv.className = 'interact-demo-node';
            newDiv.id = 'node' + i;
            newDiv.interactDemo = true;

            text = newDiv.appendChild(document.createElement('p'));
            newDiv.text = text;
            newDiv.appendChild(document.createElement('br'));
            newDiv.style.left = Math.random()*(window.innerWidth - 200) + 'px';
            newDiv.style.top = Math.random()*(window.innerHeight - 200) + 'px';

            button = newDiv.appendChild(document.createElement('button'));
            button.innerHTML = 'button gets event?';
            button.addEventListener('click', buttunFunction);
            button.addEventListener('mousedown', buttunFunction);
            button.addEventListener('mouseenter', buttunFunction);
            button.addEventListener('mouseleave', buttunFunction);
            button.addEventListener('touchstart', buttunFunction);
            button.addEventListener('touchmove', buttunFunction);
            button.addEventListener('mouseup', buttunFunction);

            interact.set(newDiv, {
                drag: true,
                resize: true
            });
            window['d' + i] = newDiv;
        }
    }

    function parseStyleLength(element, string) {
        var lastChar = string[string.length - 1];

        if (lastChar === 'x') {
            return Number(string.substring(string.length - 2, 0));
        } else if (lastChar === '%') {
            return parseStyleLength(element.parentNode) * Number(string.substring(string.length - 1, 0)) / 100;
        } else if (lastChar === 'm') {
            // Not Ready ***
            return Number(string.substring(string.length - 2, 0)) * parseStyleLength(element, window.getComputedStyle(element).fontSize);
        }
        return string;
    }

    function getSize(element) {
        var width,
            height,
            dimensions;

        if (element.nodeName in svgTags) {
            dimensions = svgTags[element.nodeName].getSize(element);
            width = dimensions.x;
            height = dimensions.y;
        } else {
            width = element.style.width;
            height = element.style.height;

            if(width !== '') {
                width = parseStyleLength(element, width);
                height  = parseStyleLength(element, height);
            } else {
                width = parseStyleLength(element, window.getComputedStyle(element).width);
                height = parseStyleLength(element, window.getComputedStyle(element).height);
            }
        }
        return {x: width, y: height};
    }

    function setSize(element, x, y) {
        if (element.nodeName in svgTags) {
            svgTags[element.nodeName].setSize(element, x, y);
        } else {
            if (typeof x === 'number') {
                x += 'px';
            }
            if (typeof y === 'number') {
                y += 'px';
            }

            if (typeof x === 'string') {
                element.style.setProperty('width', x);
            }
            if (typeof y === 'string') {
                element.style.setProperty('height', y);
            }
        }
    }

    function changeSize(element, dx, dy, minx, miny) {
        var size = getSize(element),
            width = size.x,
            height = size.y;

        minx = Number(minx) || minSize;
        miny = Number(miny) || minSize;

        width = Math.max(width + dx, minx);
        height = Math.max(height + dy, miny);

        setSize(element, width, height);
    }

    function getPosition(element){
        var left,
            top;

        if (element.nodeName in svgTags) {
            var screenCTM = element.getScreenCTM();

            left = screenCTM.e;
            top = screenCTM.f;
        } else {
            var clientRect = element.getBoundingClientRect(),
                compStyle = window.getComputedStyle(element);
                
            
            left = clientRect.left + window.scrollX - parseStyleLength(element, compStyle.marginLeft),
            top = clientRect.top + window.scrollY - parseStyleLength(element, compStyle.marginTop);
        }
        return {x: left, y: top};
    }

    function setPosition(element, x, y) {
        var translate;

        if (element.nodeName in svgTags) {
            if (typeof x === 'number' && typeof y === 'number') {
                translate = 'translate(' + x + ', ' + y + ')';
                element.parentNode.setAttribute('transform', translate);
            }
        } else if (typeof x === 'number' && typeof y === 'number') {
            element.style.setProperty('left', x + 'px', '');
            element.style.setProperty('top', y + 'px', '');
        }
    }

    function changePosition(element, dx, dy) {
        var variable,
            x,
            y;

        if (element.nodeName in svgTags) {
            if (typeof dx === 'number' && typeof dy === 'number') {
                variable = getTransform(element, 'translate');
                x = Number(variable[0]);
                y = Number(variable[1]);

                setTransform(element, 'translate',  [ x + dx, y + dy]);
            }
        } else if (typeof dx === 'number' && typeof dy === 'number') {
            variable = window.getComputedStyle(element);
            x = parseStyleLength(element, variable.left);
            y = parseStyleLength(element, variable.top);

            setPosition(element, x + dx, y + dy);
        }
    }

    function getTransform(element, property) {
        var transform = element.getAttribute('transform') || property + '(0, 0)',
            transformations = {
                translate: 2,
                scale: 2,
                rotate: 3,
                skewX: 1,
                skewY: 1,
                matrix: 6
            },
            regExp = new RegExp(property + '\\s*\\(\\s*[^)]*\\)', 'i'),
            r = [0, 0, 0];

        if (property in transformations && transform && (transform = transform.match(regExp))) {

            if (transform) {
                transform = transform[0];
            }

            // To get the numbers out
            regExp = /([\d\.]+)/g;
            r = transform.match(regExp);
        } else {
            r = transform;
        }
        return r;
    }

    function setTransform(element, property, valueArray) {
        var transform = element.getAttribute('transform') || property + '(0, 0)',
            transformFunction,
            regExp;

        if (!property) {
            element.setAttribute('transform', '');
        } else if (typeof property !== 'string') {
            return false;
        }

        // To remove the property from the previous transform attribute
        regExp = new RegExp('/([\\s\\S]*)(?:' + property + '\\s*\\(\\s*)[^\\)]+\\)([\\s\\S]*)/', 'i');
        transform = transform.match(regExp);
        if (transform) {
            transform = transform[0];
        } else {
            transform = '';
        }
        if (typeof valueArray === 'object') {
            valueArray = valueArray.join(', ');
        }
        transformFunction = property + '(' + valueArray + ') ';
        element.setAttribute('transform', transformFunction + transform);
    }

    // Display event properties for debugging
    function nodeEventDebug(e) {
        var textProp,
            nl;

        if (e.target.nodeName in svgTags) {
            textProp = 'textContent';
            nl = '\n';
        } else {
            textProp = 'innerHTML';
            nl = '<br> ';
        }

        if ( e.target.interactDemo && e.type in interact.eventDict()) {
            e.target.text[textProp] = nl + interact.eventDict(e.type) + ' x0, y0    :    (' + e.detail.x0 + ', ' + e.detail.y0 + ')';
            e.target.text[textProp] += nl + ' dx, dy        :    (' + e.detail.dx + ', ' + e.detail.dy + ')';
            e.target.text[textProp] += nl + ' pageX, pageY    :    (' + e.detail.pageX + ', ' + e.detail.pageY + ')';
        }
    }

    function eventProps(e) {
        var debug = [],
            prop;
        if (typeof e.detail === 'object') {
            debug.push['event.detail: '];
            for (prop in e.detail) {
                if (e.detail.hasOwnProperty(prop)) {
                    debug.push('\n    ' + prop + ' : ' + e.detail[prop]);
                }
            }
        }
        if (event.touches && event.touches.length) {
            debug += 'touches[0]: ';
            for (prop in e.touches[0]) {
                if (e.touches[0].hasOwnProperty(prop)) {
                    debug.push('\n    ' + prop + ' : ' + e.touches[0][prop]);
                }
            }
        }
        for (prop in e) {
            if (e.hasOwnProperty(prop)) {
                debug.push('\n' + prop + ' : ' + e[prop]);
            }
        }

        return debug.join('');
    }

    function staticMove(e) {
        if (e.target.nodeName in svgTags) {
            changePosition(e.target.parentNode, e.detail.dx, e.detail.dy);
        } else {
            changePosition(e.target, e.detail.dx, e.detail.dy);
        }
    }

    function realtimeMove(e) {
        if (e.target.nodeName in svgTags) {
            changePosition(
                e.target.nodeName === 'g'?
                    e.target:
                    e.target.parentNode,
                e.detail.dx,
                e.detail.dy);
        } else {
            changePosition(e.target, e.detail.dx, e.detail.dy);
        }
    }

    function staticResize(e) {
        var target = e.target,
            dx = event.detail.dx,
            dy = event.detail.dy;

        changeSize(target, dx, dy);
    }

    function realtimeResize(e) {
        var target = e.target,
            position = getPosition(target),
            newWidth,
            newHeight,
            dx = 0,
            dy = 0;

        // + (margin * 1.5) so the mouse must be in the middle of the margin space
        if ((e.detail.axes === 'x' || e.detail.axes === 'xy') && e.detail.pageX > position.x + (margin * 1.5)) {
            dx = Math.max(e.detail.dx);
        }

        if ((e.detail.axes === 'y' || e.detail.axes === 'xy') && e.detail.pageY > position.y + (margin * 1.5)) {
            dy = Math.max(e.detail.dy);
        }

        changeSize(target, dx, dy);
    }

    function realtimeUpdate(newValue) {
        if (newValue !== undefined) {
            return (realtime = Boolean(newValue));
        } else {
            return realtime;
        }
    }
    
    function setPrevMouse(e) {
        prevX = e.pageX || e.detail.pageX;
        prevY = e.pageX || e.detail.pageY;
    }

    document.addEventListener('interactresizeend', function (e) {
        if (!realtime) {
            staticResize(e);
        }
    });

    document.addEventListener('interactresizemove', function (e) {
        if (realtime) {
            realtimeResize(e);
        }
    });

    document.addEventListener('interactdragmove', function (e) {
        if (realtime) {
            realtimeMove(e);
        }
    });

    document.addEventListener('interactdragend', function (e) {
        if (!realtime) {
            staticMove(e);
        }
    });

    // Display event properties for debugging
    document.addEventListener('interactresizestart', nodeEventDebug);
    document.addEventListener('interactresizemove', nodeEventDebug);
    document.addEventListener('interactresizeend', nodeEventDebug);
    document.addEventListener('interactdragstart', nodeEventDebug);
    document.addEventListener('interactdragmove', nodeEventDebug);
    document.addEventListener('interactdragend', nodeEventDebug);

    // These listeners must be triggered after the others
    // so prevX !== e.detail.pageX for other event listeners
    document.addEventListener('interactdragstart', setPrevMouse);
    document.addEventListener('interactdragmove', setPrevMouse);
    document.addEventListener('interactresizestart', setPrevMouse);
    document.addEventListener('interactresizemove', setPrevMouse);

    interactDemo.randomDivs = randomDivs;
    interactDemo.randomGraphics = randomGraphics;
    interactDemo.setSize = setSize;
    interactDemo.setPosition = setPosition;
    interactDemo.nodeEventDebug = nodeEventDebug;
    interactDemo.eventProps = eventProps;
    interactDemo.staticMove = staticMove;
    interactDemo.realtimeMove = realtimeMove;
    interactDemo.graphicActionChecker = graphicActionChecker;
    interactDemo.divActionChecker = divActionChecker;
    interactDemo.getSize = getSize;
    interactDemo.getPosition = getPosition;
    interactDemo.realtimeUpdate = realtimeUpdate;
    interactDemo.getTransform = getTransform;
    interactDemo.setTransform = setTransform;
    interactDemo.changePosition = changePosition;
    interactDemo.changeSize = changeSize;

    if (!('$' in window)) {
        window.$ = function (id) {
            return document.getElementById(id);
        };
    }
    return interactDemo;
}(window.interact));

window.getTransform = window.interactDemo.getTransform;
window.setTransform = window.interactDemo.setTransform;
window.changePosition = window.interactDemo.changePosition;
window.changeSize = window.interactDemo.changeSize;

