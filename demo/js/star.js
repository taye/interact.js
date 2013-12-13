document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var sns="http://www.w3.org/2000/svg",
        xns="http://www.w3.org/1999/xlink",
        root = document.getElementById('svg-edit-demo'),
        star = document.getElementById('edit-star'),
        rootMatrix,
        originalPoints = [],
        transformedPoints = [];

    for (var i = 0, len = star.points.numberOfItems; i < len; i++) {
        var handle = root.querySelector('defs .point-handle').cloneNode(true),
            point = star.points.getItem(i),
            newPoint = root.createSVGPoint();

        handle.cx.baseVal.value = newPoint.x = point.x;
        handle.cy.baseVal.value = newPoint.y = point.y;

        handle.setAttribute('data-index', i);

        originalPoints.push(newPoint);

        root.appendChild(handle);
    }

    function applyTransforms (event) {
        rootMatrix = root.getScreenCTM();

        transformedPoints = originalPoints.map(function(point) {
            return point.matrixTransform(rootMatrix);
        });

        interact('.point-handle').snap({
            anchors: transformedPoints,
            range: 20 * Math.max(rootMatrix.a, rootMatrix.d)
        });
    }

    interact(root)
        .on('mousedown', applyTransforms)
        .on('touchstart', applyTransforms);

    interact('.point-handle')
        .draggable({
            onmove: function (event) {
                var i = event.target.getAttribute('data-index')|0,
                    point = star.points.getItem(i);

                point.x += event.dx / rootMatrix.a;
                point.y += event.dy / rootMatrix.d;

                event.target.cx.baseVal.value = point.x;
                event.target.cy.baseVal.value = point.y;
            }
        })
        .snap({
            mode: 'anchor',
            anchors: originalPoints,
            range: 10
        });
});
