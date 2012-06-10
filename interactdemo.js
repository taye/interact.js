/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/biographer/interact.js/master/LICENSE
 */

/*jshint smarttabs:true */

/**
 * @namespace interact.js module
 * @name interact
 */
window.interactDemo = (function(interact) {
    'use strict';

    var interact = interact || window.interact,
        interactDemo = {},
        svg,
        svgTags = {
            g: 'g',
            rect: 'rect',
            circle: 'circle',
            text: 'text',
        },
        margin = 20;

        if (!interact) {
            return false;
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
        var clientRect = target.element.getClientRects()[0],
            right = ((event.pageX - clientRect.left) > (clientRect.width - margin)),
            bottom = ((event.pageY - clientRect.top) > (clientRect.height - margin)),
            axes = (right?'x': '') + (bottom?'y': ''),
            action = (axes)? 'resize' + axes: 'drag';

        return action;
    }

    function graphicActionChecker(event) {
        var target = event.target,
            clientRect = target.getClientRects()[0],
            right = ((event.pageX - clientRect.left) > (clientRect.width - margin)),
            bottom = ((event.pageY - clientRect.top) > (clientRect.height - margin)),
            axes = (right?'x': '') + (bottom?'y': ''),
            action = (axes)? 'resize' + axes: 'drag';

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
            document.body.appendChild(svg);
        }

        if (n < 0 || typeof n !== 'number') {
            n = 5;
        }

        parent = svg;

        svg.setAttributeNS (null, 'viewBox', '0 0 ' + width + ' ' + height);
        svg.setAttributeNS (null, 'width', width);
        svg.setAttributeNS (null, 'height', height);

        for (i = 0; i < n; i++) {
            newGraphic = svg.appendChild(document.createElementNS(svgNS, 'g'));
//            newGraphic.className = 'interact-demo-node';
            newGraphic.id = 'graphic' + i;
            newGraphic.interactDemo = true;
            newGraphic.setAttributeNS (null, 'fill', '#ee0');
            newGraphic.setAttributeNS (null, 'stroke', '#000');
            newGraphic.setAttributeNS (null, 'stroke-width', '2px');

            text = newGraphic.appendChild(document.createElementNS( svgNS, 'text'));
            text.setAttributeNS (null, 'fill', '#000');
            text.setAttributeNS (null, 'stroke', '#000');
            text.setAttributeNS (null, 'stroke-width', '0px');

            newGraphic.text = text;

            x = Math.random()*(width - 200);
            y = Math.random()*(width - 200);

            translate = 'translate(' + x + ', ' + y + ')';
            newGraphic.setAttributeNS (null, 'transform', translate );

            rect = document.createElementNS(svgNS, 'rect');
            rect.setAttributeNS (null, 'width', 150);
            rect.setAttributeNS (null, 'height', 150);
            newGraphic.mainElement = newGraphic.appendChild(rect);

            interact.set(newGraphic, {
                drag: true,
                resize: true,
                actionChecker: graphicActionChecker
            });
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

    function position(element, x, y) {
        var translate;

        if (element.nodeName in svgTags) {
            if (typeof x === 'number' && typeof y === 'number') {
                translate = 'translate(' + x + ', ' + y + ')';
                element.setAttributeNS(null, 'transform', translate);
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

    document.addEventListener('interactresizeend', function(e) {
        var target,
            clientRect,
            newWidth,
            newHeight;

        if (e.target.nodeName in svgTags) {
            target = e.target.mainElement;
        } else {
            target = e.target;
        }

        clientRect = target.getClientRects()[0];
        newWidth = Math.max((getWidth(target) + e.detail.dx), 0);
        newHeight = Math.max((getHeight(target) + e.detail.dy), 0);

        if (e.detail.shiftKey) {
            if (newWidth > newHeight) {
                newHeight = newWidth;
            } else {
                newWidth = newHeight;
            }
        }

        setSize(target, newWidth, newHeight);
        //if (e.target.nodeName === 'rect') alert('rect');
    });

    document.addEventListener('interactdragend', function(e) {
        var clientRect = e.target.getClientRects()[0],
            compStyle = window.getComputedStyle(e.target),
            left = clientRect.left + (e.detail.pageX + window.scrollX - e.detail.x0) - parseStyleLength(e.target, compStyle.marginLeft),
            top = clientRect.top + (e.detail.pageY + window.scrollY - e.detail.y0) - parseStyleLength(e.target, compStyle.marginRight),
            debug = '';


        position(e.target, left, top);
    });

/*    document.addEventListener('interactdragmove', function(e) {
        var compStyle = window.getComputedStyle(e.target),
            left = parseStyleLength(e.target, compStyle.left),
            right = parseStyleLength(e.target, compStyle.top);

        position(e.target, left + e.detail.dx, right + e.detail.dy);
    });
*/
    // Display event properties for debugging
    document.addEventListener('interactresizestart', nodeEventDebug);
    document.addEventListener('interactresizemove', nodeEventDebug);
    document.addEventListener('interactresizeend', nodeEventDebug);
    document.addEventListener('interactdragstart', nodeEventDebug);
    document.addEventListener('interactdragmove', nodeEventDebug);
    document.addEventListener('interactdragend', nodeEventDebug);

    interactDemo.randomDivs = randomDivs;
    interactDemo.randomGraphics = randomGraphics;
    interactDemo.setSize = setSize;
    interactDemo.position = position;
    interactDemo.nodeEventDebug = nodeEventDebug;
    interactDemo.eventProps = eventProps;

    if (!('$' in window)) {
        window.$ = function (id) {
            return document.getElementById(id);
        };
    }
    return interactDemo;
}(interact));

