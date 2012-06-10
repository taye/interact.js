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
            rect: 'rect',
            circle: 'circle',
            text: 'text',
            path: 'path',
            line: 'line',
            image: 'image'
        },
        margin = 20,
        prevX = 0,
        prevY = 0,
        realtime = true;

        interact = interact || window.interact;
        if (!interact) {
            return;
        }

    function parseStyleLength(element, string) {
        var lastChar = string[string.length - 1];

        if (lastChar === 'x') {
            return Number(string.substring(string.length - 2, 0));
        } else if (lastChar === '%') {
            return parseStyleLength(element.parent) * Number(string.substring(string.length - 1, 0)) / 100;
        } else if (lastChar === 'm') {
            // Not Ready ***
            return Number(string.substring(string.length - 2, 0)) * parseStyleLength(element, window.getComputedStyle(element).fontSize);
        }
        return string;
    }

    function getWidth(element) {
        var width;

        if (element.nodeName in svgTags) {
            width = Number(element.getAttributeNS(null, 'width'));
        } else {
            width = element.style.width;

            if(width !== '') {
                width = parseStyleLength(element, width);
            } else {
                width =  parseStyleLength(element, window.getComputedStyle(element).width);
            }
        }
        return width;
    }

    function getHeight(element) {
        var height;

        if (element.nodeName in svgTags) {
            height = Number(element.getAttributeNS(null, 'height'));
        } else {
            height = element.style.height;

            if(height !== '') {
                height = parseStyleLength(element, height);
            } else {
                height =  parseStyleLength(element, window.getComputedStyle(element).height);
            }
        }
        return height;
    }

    function divActionChecker(event) {
        var target = event.target,
            clientRect = target.element.getClientRects()[0],
            right = ((event.pageX - window.scrollY - clientRect.left) > (clientRect.width - margin)),
            bottom = ((event.pageY - window.scrollY - clientRect.top) > (clientRect.height - margin)),
            axes = (right?'x': '') + (bottom?'y': ''),
            action = (axes)?
                'resize' + axes:
                'drag';

        return action;
    }

    function graphicActionChecker(event) {
        var target = event.target,
            clientRect = target.getClientRects()[0],
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
            width = window.innerWidth,
            height = window.innerHeight,
            x,
            y,
            translate,
            i,
            buttunFunction = function (e) {
                e.target.innerHTML = e.type;
            };

        if (!svg) {
            svg = document.createElementNS(svgNS, 'svg');
            svg.setAttributeNS (null, 'viewBox', '0 0 ' + width + ' ' + height);
            svg.setAttributeNS (null, 'width', width);
            svg.setAttributeNS (null, 'height', height);
 //           svg.style.setProperty('margin', 0);

            document.body.appendChild(svg);
        }

        if (n < 0 || typeof n !== 'number') {
            n = 5;
        }

        parent = svg;

        for (i = 0; i < n; i++) {
            newGraphic = svg.appendChild(document.createElementNS(svgNS, 'g'));
//            newGraphic.style.setProperty('class', 'interact-demo-node');
            newGraphic.id = 'graphic' + i;
            newGraphic.interactDemo = true;
            newGraphic.setAttributeNS (null, 'fill', '#ee0');
            newGraphic.setAttributeNS (null, 'stroke', '#000');
            newGraphic.setAttributeNS (null, 'stroke-width', '2px');

            x = Math.random()*(width - 200);
            y = Math.random()*(width - 200);

            translate = 'translate(' + x + ', ' + y + ')';
            newGraphic.setAttributeNS (null, 'transform', translate );

            rect = document.createElementNS(svgNS, 'rect');
            rect.setAttributeNS (null, 'width', 150);
            rect.setAttributeNS (null, 'height', 150);

            text = newGraphic.appendChild(document.createElementNS( svgNS, 'text'));
            text.setAttributeNS (null, 'fill', '#000');
            text.setAttributeNS (null, 'stroke', '#000');
            text.setAttributeNS (null, 'stroke-width', '0px');
            rect.text = text;

            newGraphic.appendChild(rect);

            interact.set(rect, {
                drag: true,
                resize: true,
                actionChecker: graphicActionChecker
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
                resize: true,
                actionChecker: 'auto'//myActionChecker
            });
            window['d' + i] = newDiv;
        }
    }

    function setSize(element, x, y) {
        if (element.nodeName in svgTags) {
            if (typeof x === 'number' && typeof y === 'number') {
                element.setAttributeNS(null, 'width', x);
                element.setAttributeNS(null, 'height', y);
            }
        }
        else {
            if (typeof x === 'string' && typeof y === 'string') {
                element.style.setProperty('width', Math.max(x, 20), '');
                element.style.setProperty('height', Math.max(y, 20), '');
            } else if (typeof x === 'number' && typeof y === 'number') {
                element.style.setProperty('width', Math.max(x, 20) + 'px', '');
                element.style.setProperty('height', Math.max(y, 20) + 'px', '');
            }
        }
    }

    function getPosition(element){
        var clientRect = element.getClientRects()[0],
            compStyle = window.getComputedStyle(element),
            left = clientRect.left + window.scrollX - parseStyleLength(element, compStyle.marginLeft),
            top = clientRect.top + window.scrollY - parseStyleLength(element, compStyle.marginRight);
        
        if (element.nodeName in svgTags) {
            var container = element.ownerSVGElement;
                
            left -= container.offsetLeft;
            top -= container.offsetTop;
        }
        return {x: left, y: top};
    }

    function setPosition(element, x, y) {
        var translate;

        if (element.nodeName in svgTags) {
            if (typeof x === 'number' && typeof y === 'number') {
                translate = 'translate(' + x + ', ' + y + ')';
                element.parentNode.setAttributeNS(null, 'transform', translate);
            }
        } else if (typeof x === 'number' && typeof y === 'number') {
            element.style.setProperty('left', x + 'px', '');
            element.style.setProperty('top', y + 'px', '');
        }
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
        var debug = '',
            prop;
        if (typeof e.detail === 'object') {
            debug += 'event.detail: ';
            for (prop in e.detail) {
                if (e.detail.hasOwnProperty(prop)) {
                    debug += '\n    ' + prop + ' : ' + e.detail[prop];
                }
            }
        }
        if (event.touches && event.touches.length) {
            debug += 'touches[0]: ';
            for (prop in e.touches[0]) {
                if (e.touches[0].hasOwnProperty(prop)) {
                    debug += '\n    ' + prop + ' : ' + e.touches[0][prop];
                }
            }
        }
        for (prop in e) {
            if (e.hasOwnProperty(prop)) {
                debug += '\n' + prop + ' : ' + e[prop];
            }
        }

        return debug;
    }

    function dynamicMove(e) {
        var position = getPosition(e.target),
            left = position.x + (e.detail.pageX - prevX),
            top = position.y + (e.detail.pageY - prevY);

        setPosition(e.target, left, top);
    }

    function staticMove(e) {
        var position = getPosition(e.target),
            left = position.x + e.detail.dx,
            top = position.y + e.detail.dy,
            debug = '';

        setPosition(e.target, left, top);
    }

    function staticResize(e) {
        var target = e.target,
            newWidth = Math.max((getWidth(target) + e.detail.dx), 0),
            newHeight = Math.max((getHeight(target) + e.detail.dy), 0);

        // Square resizing when Shift key is held
        if (e.detail.shiftKey) {
            if (newWidth > newHeight) {
                newHeight = newWidth;
            } else {
                newWidth = newHeight;
            }
        }

        setSize(target, newWidth, newHeight);
    }

    function dynamicResize(e) {
        var target = e.target,
            newWidth = Math.max(getWidth(target) + (e.detail.pageX - prevX), 0),
            newHeight = Math.max(getHeight(target) + (e.detail.pageY - prevY), 0);

        // Square resizing when Shift key is held
        if (e.detail.shiftKey) {
            if (newWidth > newHeight) {
                newHeight = newWidth;
            } else {
                newWidth = newHeight;
            }
        }

        setSize(target, newWidth, newHeight);
    }
    
    function realtimeUpdate(newValue) {
        if (newValue !== undefined) {
            return realtime = Boolean(newValue);
        } else {
            return realtime;
        }
    }
    
    document.addEventListener('interactresizeend', function (e) {
        if (!realtime) {
            staticResize(e);
        }
    });
    
    document.addEventListener('interactresizemove', function (e) {
        if (realtime) {
            dynamicResize(e);
        }
    });

    document.addEventListener('interactdragmove', function (e) {
        if (realtime) {
            dynamicMove(e);
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

    // These events must happen after the others so preVx !== e.detail.pageX for other event listeners
    document.addEventListener('interactdragstart', function(e) {
        prevX = e.detail.pageX;
        prevY = e.detail.pageY;
    });
    document.addEventListener('interactdragmove', function(e) {
        prevX = e.detail.pageX;
        prevY = e.detail.pageY;
    });
    document.addEventListener('interactresizestart', function(e) {
        prevX = e.detail.pageX;
        prevY = e.detail.pageY;
    });
    document.addEventListener('interactresizemove', function(e) {
        prevX = e.detail.pageX;
        prevY = e.detail.pageY;
    });

    interactDemo.randomDivs = randomDivs;
    interactDemo.randomGraphics = randomGraphics;
    interactDemo.setSize = setSize;
    interactDemo.setPosition = setPosition;
    interactDemo.nodeEventDebug = nodeEventDebug;
    interactDemo.eventProps = eventProps;
    interactDemo.staticMove = staticMove;
    interactDemo.dynamicMove = dynamicMove;
    interactDemo.graphicActionChecker = graphicActionChecker;
    interactDemo.getPosition = getPosition;
    interactDemo.realtimeUpdate = realtimeUpdate;

    if (!('$' in window)) {
        window.$ = function (id) {
            return document.getElementById(id);
        };
    }
    return interactDemo;
}(window.interact));

