/*
 * Copyright (c) 2013 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

(function(interact) {
    'use strict';

    var canvas,
        context,
        guidesCanvas,
        guidesContext,
        width = 800,
        height = 800,
        snap = {
            mode: 'grid',
            grid: {x: 0, y: 0},
            gridOffset: {x: 0, y: 0},
            range: Infinity
        },
        status,
        prevX = 0,
        prevY = 0,
        blue = '#2299ee',
        lightBlue = '#88ccff',
        peppermint = '#66e075',
        tango = '#ff4400',
        draggingAnchor = false;

    function drawGrid (grid, gridOffset) {
        var barLength = 16;

        guidesContext.clearRect(0, 0, width, height);

        guidesCanvas.fillStyle = blue;

        if (snap.range < 0 || snap.range === Infinity) {
            guidesContext.fillStyle = lightBlue;
            guidesContext.fillRect(0, 0, width, height);
        }

        for (var i = -(1 + gridOffset.x / grid.x | 0), lenX = width / grid.x + 1; i < lenX; i++) {
            for (var j = -( 1 + gridOffset.y / grid.y | 0), lenY = height / grid.y + 1; j < lenY; j++) {
                if (snap.range > 0 && snap.range !== Infinity) {
                    guidesContext.circle(i * grid.x + gridOffset.x, j * grid.y + gridOffset.y, snap.range, blue).fill();
                }

                guidesContext.beginPath();
                guidesContext.moveTo(i * grid.x + gridOffset.x, j * grid.y + gridOffset.y - barLength / 2);
                guidesContext.lineTo(i * grid.x + gridOffset.x, j * grid.y + gridOffset.y + barLength / 2);
                guidesContext.stroke();

                guidesContext.beginPath();
                guidesContext.moveTo(i * grid.x + gridOffset.x - barLength / 2, j * grid.y + gridOffset.y);
                guidesContext.lineTo(i * grid.x + gridOffset.x + barLength / 2, j * grid.y + gridOffset.y);
                guidesContext.stroke();
            }
        }
    }

    function drawAnchors (anchors) {
        var barLength = 16;
 
        guidesContext.clearRect(0, 0, width, height);

        if (snap.range < 0 && snap.range !== Infinity) {
            guidesContext.fillStyle = lightBlue;
            guidesContext.fillRect(0, 0, width, height);
        }

        for (var i = 0, len = anchors.length; i < len; i++) {
            var anchor = anchors[i],
                range = typeof anchor.range === 'number'? anchor.range: snap.range;

            if (range > 0 && snap.range !== Infinity) {
                guidesContext.circle(anchor.x, anchor.y, range, blue).fill();
            }

            guidesContext.beginPath();
            guidesContext.moveTo(anchor.x, anchor.y - barLength / 2);
            guidesContext.lineTo(anchor.x, anchor.y + barLength / 2);
            guidesContext.stroke();

            guidesContext.beginPath();
            guidesContext.moveTo(anchor.x - barLength / 2, anchor.y);
            guidesContext.lineTo(anchor.x + barLength / 2, anchor.y);
            guidesContext.stroke();
        }
    }

    function drawSnap () {
        context.clearRect(0, 0, width, height);
        if (!status.offMode.checked) {
            if (snap.mode === 'grid') {
                drawGrid(snap.grid, snap.gridOffset);
            }
            else if (snap.mode === 'anchor') {
                drawAnchors(snap.anchors);
            }
        }
        else {
            context.clearRect(0, 0, width, height);
            guidesContext.clearRect(0, 0, width, height);
        }
    }

    function circle (x, y, radius, color) {
        this.fillStyle = color || this.fillStyle;
        this.beginPath();
        this.arc(x, y, radius, 0, 2*Math.PI);

        return this;
    }
    window.CanvasRenderingContext2D.prototype.circle = circle;

    function dragMove (event) {
        var range;

        snap = interact.snap();

        if (snap.mode === 'grid') {
            range = snap.range;
        }
        else if (snap.mode === 'anchor') {
            range = typeof snap.anchors.closest.range === 'number'? snap.anchors.closest.range: snap.range;
        }
        else {
            range = 80;
        }

        context.clearRect(0, 0, width, height);

        if (snap.enabled && range !== Infinity) {
            context.circle(snap.x, snap.y, range + 1, 'rgba(102, 225, 117, 0.8)').fill();
        }

        context.circle(event.pageX, event.pageY, 10, tango).fill();

        prevX = event.pageX;
        prevY = event.pageY;
    }

    function dragEnd (event) {
        context.circle(event.pageX, event.pageY, 10, tango).fill();

        prevX = event.pageX;
        prevY = event.pageY;
    }

    function anchorDragStart (event) {
        if (interact.snap().locked) {
            interact.snap(false);
            draggingAnchor = true;
        }
    }

    function anchorDragMove (event) {
        if (draggingAnchor && snap.anchors.closest) {
            snap.anchors.closest.x += event.dx;
            snap.anchors.closest.y += event.dy;

            drawAnchors(snap.anchors);
        }
    }

    function anchorDragEnd (event) {
        snap.enabled = true;
        draggingAnchor = false;
    }

    function sliderChange (event, valid) {
        if (!valid) {
            return;
        }
        snap.grid.x = Number(status.gridX.value);
        snap.grid.y = Number(status.gridY.value);
        snap.gridOffset.x = Number(status.offsetX.value);
        snap.gridOffset.y = Number(status.offsetY.value);

        snap.range = Number(status.range.value);

        snap.enabled = !status.offMode.checked;

        drawSnap();
    }

    function modeChange (event) {
        if (status.anchorDrag.checked && !status.anchorMode.checked) {
            status.anchorMode.checked = true;
        }

        if (status.anchorDrag.checked) {
            status.anchorMode.disabled = status.offMode.disabled = status.gridMode.disabled = true;
            status.modes.classList.add('disabled');

            interact(canvas)
                .off('dragstart', dragMove)
                .off('dragmove', dragMove)
                .off('dragend', dragEnd)
                .on('dragstart', anchorDragStart)
                .on('dragmove', anchorDragMove)
                .on('dragend', anchorDragEnd)
                .checkOnHover(false);
        }
        else {
            status.anchorMode.disabled = status.offMode.disabled = status.gridMode.disabled = false;
            status.modes.classList.remove('disabled');

            interact(canvas)
                .on('dragstart', dragMove)
                .on('dragmove', dragMove)
                .on('dragend', dragEnd)
                .off('dragstart', anchorDragStart)
                .off('dragmove', anchorDragMove)
                .off('dragend', anchorDragEnd)
                .checkOnHover(false);
        }

        if (status.offMode.checked) {
            snap.enabled = false;
        }

        snap.mode = status.anchorMode.checked || status.anchorDrag.checked? 'anchor': 'grid';

        drawSnap();
    }

    function sliderInput (event) {
        if (event.target.type === 'range' &&
            (Number(event.target.value) > Number(event.target.max)) ||
            Number(event.target.value) < Number(event.target.min)) {

            return;
        }

        sliderChange(event, true);
    }

    function setSnap () {
        if (status.offMode.checked) {
            interact.snap(false);
        }
        else {
            snap = interact.snap(snap).snap();
        }
    }

    interact.styleCursor(false);

    interact(document).on('DOMContentLoaded', function () {
        canvas = document.getElementById('drag');
        canvas.width = width;
        canvas.height = height;
        context = canvas.getContext('2d');

        interact(canvas)
            .draggable(true)
            .on('mousedown', setSnap)
            .on('touchstart', setSnap);

        guidesCanvas = document.getElementById('grid');
        guidesCanvas.width = width;
        guidesCanvas.height = height;
        guidesContext = guidesCanvas.getContext('2d');

        status = {
            container: document.getElementById('status'),

            sliders: document.getElementById('sliders'),
            gridX: document.getElementById('grid-x'),
            gridY: document.getElementById('grid-y'),
            offsetX: document.getElementById('offset-x'),
            offsetY: document.getElementById('offset-y'),
            range: document.getElementById('snap-range'),

            modes: document.getElementById('modes'),
            offMode: document.getElementById('off-mode'),
            gridMode: document.getElementById('grid-mode'),
            anchorMode: document.getElementById('anchor-mode'),
            anchorDrag: document.getElementById('drag-anchors')
        }

        interact(status.sliders)
            .on('change', sliderChange)
            .on('input', sliderInput);

        interact(document.getElementById('modes'))
            .on('change', modeChange);

        snap.anchors = [
            {x: 100, y: 100, range: 200},
            {x: 600, y: 400},
            {x: 500, y: 150},
            {x: 250, y: 250}
        ];

        sliderChange(null, true);
        modeChange();
    });

    window.grid = {
        drawGrid: drawGrid
    };

}(window.interact));
