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
        status,
        prevX = 0,
        prevY = 0,
        blue = '#2299ee',
        lightBlue = '#88ccff',
        peppermint = '#44ee44',
        tango = '#ff4400',
        draggingAnchor = null;

    function drawGrid (grid, gridOffset, range) {
        if (!grid.x || !grid.y) { return; }

        var barLength = 16;

        guidesContext.clearRect(0, 0, width, height);

        guidesContext.fillStyle = lightBlue;

        if (range < 0 || range === Infinity) {
            guidesContext.fillRect(0, 0, width, height);
        }

        for (var i = -(1 + gridOffset.x / grid.x | 0), lenX = width / grid.x + 1; i < lenX; i++) {
            for (var j = -( 1 + gridOffset.y / grid.y | 0), lenY = height / grid.y + 1; j < lenY; j++) {
                if (range > 0 && range !== Infinity) {
                    guidesContext.circle(i * grid.x + gridOffset.x, j * grid.y + gridOffset.y, range, blue).fill();
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

    function drawAnchors (anchors, defaultRange) {
        var barLength = 16;
 
        guidesContext.clearRect(0, 0, width, height);

        if (range < 0 && range !== Infinity) {
            guidesContext.fillStyle = lightBlue;
            guidesContext.fillRect(0, 0, width, height);
        }

        for (var i = 0, len = anchors.length; i < len; i++) {
            var anchor = anchors[i],
                range = typeof anchor.range === 'number'? anchor.range: defaultRange;

            if (range > 0 && range !== Infinity) {
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

    function drawSnap (snap) {
        context.clearRect(0, 0, width, height);
        guidesContext.clearRect(0, 0, width, height);

        if (!status.offMode.checked) {
            if (snap.mode === 'grid') {
                drawGrid(snap.grid, snap.gridOffset, snap.range);
            }
            else if (snap.mode === 'anchor') {
                drawAnchors(snap.anchors, snap.range);
            }
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
        var snap = event.snap;

        context.clearRect(0, 0, width, height);

        if (snap && snap.range !== Infinity && typeof snap.x === 'number' && typeof snap.y === 'number') {
            context.circle(snap.x, snap.y, snap.range + 1, 'rgba(102, 225, 117, 0.8)').fill();
        }

        context.circle(event.pageX, event.pageY, 10, tango).fill();

        prevX = event.pageX;
        prevY = event.pageY;
    }

    function dragEnd (event) {
        context.clearRect(0, 0, width, height);
        context.circle(event.pageX, event.pageY, 10, tango).fill();

        prevX = event.pageX;
        prevY = event.pageY;
    }

    function anchorDragStart (event) {
        if (event.snap.locked) {
            interact(canvas).snap(false);
            draggingAnchor = event.snap.anchors.closest;
        }
    }

    function anchorDragMove (event) {
        if (draggingAnchor) {
            var snap = interact(canvas).snap();

            draggingAnchor.x += event.dx;
            draggingAnchor.y += event.dy;

            drawAnchors(snap.anchors, snap.range);
        }
    }

    function anchorDragEnd (event) {
        interact(canvas).snap(true);
        draggingAnchor = null;
    }

    function sliderChange (event, valid) {
        if (!valid) {
            return;
        }

        interact(canvas).snap({
            grid: {
                x: Number(status.gridX.value),
                y: Number(status.gridY.value)
            },
            gridOffset: {
                x: Number(status.offsetX.value),
                y: Number(status.offsetY.value)
            },
            range: Number(status.range.value)
        });

        drawSnap(interact(canvas).snap());
    }

    function modeChange (event) {
        var snap = interact(canvas).snap(true).snap();

        if (status.anchorDrag.checked && !status.anchorMode.checked) {
            status.anchorMode.checked = true;
        }

        if (status.anchorDrag.checked) {
            status.anchorMode.disabled = status.offMode.disabled = status.gridMode.disabled = true;
            status.modes.className += ' disabled';

            interact(canvas)
                .off('dragstart', dragMove)
                .off('dragmove', dragMove)
                .off('dragend', dragEnd)
                .on('dragstart', anchorDragStart)
                .on('dragmove', anchorDragMove)
                .on('dragend', anchorDragEnd);
        }
        else {
            status.anchorMode.disabled = status.offMode.disabled = status.gridMode.disabled = false;
            status.modes.className = status.modes.className.replace(/ *\<disabled\>/g, '');

            interact(canvas)
                .on('dragstart', dragMove)
                .on('dragmove', dragMove)
                .on('dragend', dragEnd)
                .off('dragstart', anchorDragStart)
                .off('dragmove', anchorDragMove)
                .off('dragend', anchorDragEnd);
        }

        interact(canvas)
            .snap({
                mode: status.anchorMode.checked? 'anchor': 'grid',
                endOnly: status.endOnly.checked
            })
            .inertia(status.inertia.checked);

        interact(canvas).snap(status.offMode.checked? false: true);

        drawSnap(interact(canvas).snap());
    }

    function sliderInput (event) {
        if (event.target.type === 'range' &&
            (Number(event.target.value) > Number(event.target.max)) ||
            Number(event.target.value) < Number(event.target.min)) {

            return;
        }

        sliderChange(event, true);
    }

    interact.styleCursor(false);

    interact(document).on('DOMContentLoaded', function () {
        canvas = document.getElementById('drag');
        canvas.width = width;
        canvas.height = height;
        context = canvas.getContext('2d');

        interact(canvas)
            .snap({
                mode: 'grid',
                endOnly: true,
                grid: {x: 0, y: 0},
                gridOffset: {x: 0, y: 0},
                range: Infinity,
                anchors: [
                    {x: 100, y: 100, range: 200},
                    {x: 600, y: 400},
                    {x: 500, y: 150},
                    {x: 250, y: 250}
                ]
            })
            .restrict({drag: 'self'})
            .origin('self')
            .draggable(true);

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
            anchorDrag: document.getElementById('drag-anchors'),
            endOnly: document.getElementById('end-only'),
            inertia: document.getElementById('inertia')
        };

        interact(status.sliders)
            .on('change', sliderChange)
            .on('input', sliderInput);

        interact(document.getElementById('modes'))
            .on('change', modeChange);

        sliderChange(null, true);
        modeChange();
    });

    window.grid = {
        drawGrid: drawGrid
    };

}(window.interact));
