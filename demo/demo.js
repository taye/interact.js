/*
 * Copyright (c) 2012, 2013 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js module
 * @name interact
 */
(function(interact) {
    'use strict';

    var svg,
        svgNS = 'http://www.w3.org/2000/svg',
        SVGElement = window.SVGElement;

    function DemoGraphic(id) {
            var width = window.innerWidth,
                height = window.innerHeight,
                group = svg.appendChild(document.createElementNS(svgNS, 'g')),
                ellipse = group.appendChild(document.createElementNS(svgNS, 'ellipse')),
                text = group.appendChild(document.createElementNS( svgNS, 'text')),
                title = group.appendChild(document.createElementNS(svgNS, 'text'));


            ellipse.demo = true;
            ellipse.text = text;
            window[id] = ellipse;

            ellipse.dragX = Math.random()*(width - 200);
            ellipse.dragY = Math.random()*(height - 200);
            ellipse.resizeWidth  = 80;
            ellipse.resizeHeight = 80;

            group.setAttribute('transform', ['translate(', ellipse.dragX, ellipse.dragY, ')'].join(' '));
            group.setAttribute('class', 'interact-demo-node');

            ellipse.setAttribute('cx', 0);
            ellipse.setAttribute('cy', 0);
            ellipse.setAttribute('rx', ellipse.resizeWidth);
            ellipse.setAttribute('ry', ellipse.resizeHeight);

            title.textContent = id;
            title.setAttribute('class', 'title');
            text.setAttribute('class', 'eventData');


            this.group = group;
            this.ellipse = ellipse;
            this.text = text;
            this.title = title;

            interact(this.ellipse).set({
                draggable: true,
                dropzone: true,
                resizeable: true
            });
    }

    function DemoNode (id) {
        this.element = document.body.appendChild(document.createElement('div'));
        this.element.className = 'demo-node';
        this.element.id = id;
        this.element.demo = true;
        this.element.style.width  = '200px';
        this.element.style.height = '200px';

        this.element.text = this.element.appendChild(document.createElement('p'));
        this.element.appendChild(document.createElement('br'));
        this.element.style.left = Math.random()*((window.innerWidth || 800) - 200) + 'px';
        this.element.style.top = Math.random()*((window.innerHeight || 800) - 200) + 'px';

        interact(this.element).set({
            draggable: true,
            dropzone: true,
            resizeable: true,
            gestureable: true
        });
        window[id] = this.element;
    }

    function nodeEventDebug(e) {
        var textProp,
            target = e.target,
            nl;

        if (window.SVGElement && target instanceof window.SVGElement) {
            textProp = 'textContent';
            nl = '\n';
        } else {
            textProp = 'innerHTML';
            nl = '<br> ';
        }

        if ( target.demo && interact.eventTypes.indexOf(e.type) !== -1 ) {
            target.text[textProp] = nl + e.type;
            target.text[textProp] += nl + ' x0, y0        :    (' + e.x0 + ', ' + e.y0 + ')';
            target.text[textProp] += nl + ' dx, dy        :    (' + e.dx + ', ' + e.dy + ')';
            target.text[textProp] += nl + ' pageX, pageY  :    (' + e.pageX + ', ' + e.pageY + ')';

            if (e.type.indexOf('gesture') !== -1) {
                target.text[textProp] += nl + ' distance  :     ' + e.distance;
                target.text[textProp] += nl + ' scale     :     ' + e.scale;
                target.text[textProp] += nl + ' angle     :     ' + e.angle;
                target.text[textProp] += nl + ' rotation  :     ' + e.rotation;
            }
        }
    }

    function eventProps(e) {
        var debug = [],
            prop;
        if (typeof e === 'object') {
            debug.push('event: ');
            for (prop in e) {
                if (e.hasOwnProperty(prop)) {
                    debug.push('\n    ' + prop + ' : ' + e[prop]);
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

    function dragMove(e) {
        var target = e.target;

        if ('SVGElement' in window && e.target instanceof SVGElement) {
            target.dragX += e.dx;
            target.dragY += e.dy;

            target.parentNode.setAttribute('transform', ['translate(', target.dragX, target.dragY, ')'].join(' '));
        } else {
            target.style.left = parseInt(target.style.left || 0, 10) + e.dx + 'px';
            target.style.top  = parseInt(target.style.top || 0, 10)  + e.dy + 'px';
        }
    }

    function resizeMove(e) {
        var target = e.target,
            rect = target.getClientRects()[0];

        if ('SVGElement' in window && target instanceof SVGElement) {
            target.resizeWidth += e.dx;
            target.resizeHeight += e.dy;

            target.setAttribute('rx',  target.resizeWidth);
            target.setAttribute('ry', target.resizeHeight);
        }
        else {
            target.style.width  = Math.max(parseInt(target.style.width  || 0, 10) + e.dx, 50) + 'px';
            target.style.height = Math.max(parseInt(target.style.height || 0, 10) + e.dy, 50) + 'px';
        }
    }

    interact.bind('resizemove', resizeMove);
    interact.bind('dragmove', dragMove);

    function dropNode (e) {
        if ('SVGElement' in window && e.draggable instanceof SVGElement) {
            return;
        }
  
        var dropzone = e.target,
            node = e.draggable,
            dropzoneRect = dropzone.getClientRects()[0],
            parent = node.parentNode,
            dropRect = {
                x: dropzoneRect.left + 20,
                y: dropzoneRect.top  + 20
            };

        dropRect.x += (window.scrollX || document.documentElement.scrollLeft);
        dropRect.y += (window.scrollY || document.documentElement.scrollTop);
        dropRect.width  = (dropzoneRect.right  - dropzoneRect.left) / 2;
        dropRect.height = (dropzoneRect.bottom - dropzoneRect.top)  / 2;
        
        node.style.left = dropRect.x + 'px';
        node.style.top  = dropRect.y + 'px';
        node.style.width  = dropRect.width  + 'px';
        node.style.height = dropRect.height + 'px';
        
        parent.appendChild(parent.removeChild(node));
    }

    function onReady () {
        var i;

        if ('SVGElement' in window) {
            var width = window.innerWidth,
                height = window.innerHeight;

            svg = document.createElementNS(svgNS, 'svg');
            svg.id = 'svg';
            svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);
            document.body.appendChild(svg);

            window.svg = svg;

            for (i = 0; i < 4; i++) {
                new DemoGraphic('graphic' + i);
            }
        }

        for (i = 0; i < 4; i++) {
            new DemoNode('node' + i);
        }
    }

    interact(window).bind('addEventListener' in document? 'DOMContentLoaded': 'load', onReady);

    // Display event properties for debugging
    interact.bind('resizestart', nodeEventDebug);
    interact.bind('resizemove', nodeEventDebug);
    interact.bind('resizeend', nodeEventDebug);
    interact.bind('gesturestart', nodeEventDebug);
    interact.bind('gesturemove', nodeEventDebug);
    interact.bind('gestureend', nodeEventDebug);
    interact.bind('dragstart', nodeEventDebug);
    interact.bind('dragmove', nodeEventDebug);
    interact.bind('dragend', nodeEventDebug);

    interact.bind('drop', dropNode);

    window.demo = {
        DemoNode      : DemoNode,
        DemoGraphic   : DemoGraphic,
        nodeEventDebug: nodeEventDebug,
        eventProps    : eventProps
    };
}(window.interact));
