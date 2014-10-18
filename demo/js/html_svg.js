/*
 * Copyright (c) 2012, 2013 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
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
            group.setAttribute('class', 'demo-node');

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

            /*
            interact(this.ellipse).set({
                draggable: true,
                dropzone: true,
                resizable: true
            });
           */
    }

    function DemoNode (id) {
        this.element = document.body.appendChild(document.createElement('div'));
        this.element.className = 'demo-node';
        this.element.id = id;
        this.element.demo = true;
        this.element.style.width  = '200px';
        this.element.style.height = '200px';

        this.element.text = this.element.appendChild(document.createElement('pre'));
        this.element.appendChild(document.createElement('br'));
        this.element.style.left = Math.random()*((window.innerWidth || 800) - 200) + 'px';
        this.element.style.top = Math.random()*((window.innerHeight || 800) - 200) + 'px';

        /*interact(this.element).set({
            draggable: true,
            dropzone: true,
            resizable: true,
            gesturable: true
        });*/
        window[id] = this.element;
    }

    function nodeEventDebug(e) {
        var textProp,
            target = e.target,
            nl;

        textProp = 'textContent';
        nl = '\n';

        if ( target.demo && indexOf(interact.eventTypes, e.type) !== -1 ) {
            target.text[textProp] = nl + e.type;
            target.text[textProp] += nl + ' x0, y0      : (' + e.x0 + ', ' + e.y0 + ')';
            target.text[textProp] += nl + ' dx, dy      : (' + e.dx + ', ' + e.dy + ')';
            target.text[textProp] += nl + ' pageX, pageY: (' + e.pageX + ', ' + e.pageY + ')';
            target.text[textProp] += nl + ' speed       :  ' + e.speed;

            if (indexOf(e.type, 'gesture') !== -1) {
                target.text[textProp] += nl + ' distance: ' + e.distance;
                target.text[textProp] += nl + ' scale   : ' + e.scale;
                target.text[textProp] += nl + ' angle   : ' + e.angle;
                target.text[textProp] += nl + ' rotation: ' + e.rotation;
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

    interact.on('resizemove', resizeMove);
    interact.on('dragmove', dragMove);

    function dropNode (e) {
        if ('SVGElement' in window && e.draggable instanceof SVGElement) {
            return;
        }
  
        var dropzone = e.target,
            draggable = e.relatedTarget,
            dropzoneRect = dropzone.getClientRects()[0],
            parent = draggable.parentNode,
            dropRect = {
                x: dropzoneRect.left + 20,
                y: dropzoneRect.top  + 20
            };

        dropRect.x += (window.scrollX || document.documentElement.scrollLeft);
        dropRect.y += (window.scrollY || document.documentElement.scrollTop);
        dropRect.width  = (dropzoneRect.right  - dropzoneRect.left) / 2;
        dropRect.height = (dropzoneRect.bottom - dropzoneRect.top)  / 2;
        
        draggable.style.left = dropRect.x + 'px';
        draggable.style.top  = dropRect.y + 'px';
        draggable.style.width  = dropRect.width  + 'px';
        draggable.style.height = dropRect.height + 'px';
        
        parent.appendChild(parent.removeChild(draggable));
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

            for (i = 0; i < 2; i++) {
                new DemoGraphic('graphic' + i);
            }
        }

        for (i = 0; i < 2; i++) {
            new DemoNode('node' + i);
        }

        interact('div.demo-node, .demo-node ellipse')
            .draggable({ max: 2 })
            .gesturable({ max: 1 })
            .resizable({ max: 2 })
            .dropzone(true);
    }

    function indexOf (array, target) {
        for (var i = 0, len = array.length; i < len; i++) {
            if (array[i] === target) {
                return i;
            }
        }

        return -1;
    }

    interact.maxInteractions(Infinity);

    interact(window).on('addEventListener' in document? 'DOMContentLoaded': 'load', onReady);

    // Display event properties for debugging
    interact.on('resizestart', nodeEventDebug);
    interact.on('resizemove', nodeEventDebug);
    interact.on('resizeend', nodeEventDebug);
    interact.on('gesturestart', nodeEventDebug);
    interact.on('gesturemove', nodeEventDebug);
    interact.on('gestureend', nodeEventDebug);
    interact.on('dragstart', nodeEventDebug);
    interact.on('dragmove', nodeEventDebug);
    interact.on('dragend', nodeEventDebug);

    interact.on('drop', dropNode);

    window.demo = {
        DemoNode      : DemoNode,
        DemoGraphic   : DemoGraphic,
        nodeEventDebug: nodeEventDebug,
        eventProps    : eventProps
    };
}(window.interact));
