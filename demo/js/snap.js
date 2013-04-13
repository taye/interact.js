/*
 * Copyright (c) 2013 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

/**
 * @namespace interact.js module
 * @name interact
 */
(function(interact) {
    'use strict';

    var canvas,
        context,
        gridCanvas,
        gridContext,
        width = 800,
        height = 800,
        snap = interact.snap(),
        status,
        prevX = 0,
        prevY = 0,
        quickClear = true;

    function drawGrid (grid) {
        var barWidth = 4,
            barLength = 16;

        gridContext.clearRect(0, 0, width, height);

        if (snap.mode === 'grid') {
            gridCanvas.fillStyle = '#2299ee';

            for (var i = 0, lenX = width / grid.x; i < lenX; i++) {
                for (var j = 0, lenY = height / grid.y; j < lenY; j++) {
                    if (snap.range > 0) {
                        gridContext.circle(i * grid.x + grid.offsetX, j * grid.y + grid.offsetY, snap.range, '#2299ee').fill();
                    }

                    gridContext.beginPath();
                    gridContext.moveTo(i * grid.x + grid.offsetX, j * grid.y + grid.offsetY - barLength / 2);
                    gridContext.lineTo(i * grid.x + grid.offsetX, j * grid.y + grid.offsetY + barLength / 2);
                    gridContext.stroke();

                    gridContext.beginPath();
                    gridContext.moveTo(i * grid.x + grid.offsetX - barLength / 2, j * grid.y + grid.offsetY);
                    gridContext.lineTo(i * grid.x + grid.offsetX + barLength / 2, j * grid.y + grid.offsetY);
                    gridContext.stroke();
                }
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
 
    function dragStart (event) {
        context.clearRect(0, 0, width, height);
        context.circle(event.pageX, event.pageY, 10, '#ff4400').fill();

        prevX = event.pageX;
        prevY = event.pageY;
    }

    function dragMove (event) {
        if (quickClear) {
            context.clearRect(0, 0, width, height);
        }

        var highlightRadius = snap.range > 0? snap.range + 1: 10;

        context.circle(snap.x, snap.y, highlightRadius, 'rgba(102, 225, 117, 0.8)').fill();
        context.circle(event.pageX, event.pageY, 10, '#ff4400').fill();

        prevX = event.pageX;
        prevY = event.pageY;
    }

    function dragEnd (event) {
        context.circle(event.pageX, event.pageY, 10, '#ff4400').fill();

        prevX = event.pageX;
        prevY = event.pageY;
    }

    function mouseMove (event) {
        if (snap && snap.enabled && snap.locked) {
            context.circle(snap.realX,
                snap.realY,
                3, '#aaaaaa');
        }
    }

    function statusChange (event) {
        snap.grid.x = Number(status.gridX.value);
        snap.grid.y = Number(status.gridY.value);
        snap.grid.offsetX = Number(status.offsetX.value);
        snap.grid.offsetY = Number(status.offsetY.value);

        snap.range = Number(status.range.value);

        drawGrid(snap.grid);
    }

    interact.styleCursor(false)(document).bind('DOMContentLoaded', function () {
        canvas = document.getElementById('drag');
        canvas.width = width;
        canvas.height = height;
        context = canvas.getContext('2d');

        gridCanvas = document.getElementById('grid');
        gridCanvas.width = width;
        gridCanvas.height = height;
        gridContext = gridCanvas.getContext('2d');

        interact(canvas)
            .draggable({
                onstart: dragStart,
                onmove: dragMove,
                onend: dragEnd
            })
            .bind('mousemove', mouseMove)
            .checkOnHover(false);

        status = {
            container: document.getElementById('status'),
            range: document.getElementById('snap-range'),
            snapX: document.getElementById('snap-x'),
            snapY: document.getElementById('snap-y'),
            gridX: document.getElementById('grid-x'),
            gridY: document.getElementById('grid-y'),
            offsetX: document.getElementById('offset-x'),
            offsetY: document.getElementById('offset-y')
        }

        interact(status.container).bind('change', statusChange);

        statusChange();
        drawGrid(snap.grid);
    });

    interact.bind('dragmove', function (event) {
        if (snap.enabled && snap.locked && event.pageX % snap.grid.x) {
            console.log(e.pageX, e.pageY);
        }
    });

    window.grid = {
        drawGrid: drawGrid
    };

}(window.interact));
