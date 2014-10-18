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
        var handle = document.createElementNS(sns, 'use'),
            point = star.points.getItem(i),
            newPoint = root.createSVGPoint();

        handle.setAttributeNS(xns, 'href', '#point-handle');
        handle.setAttribute('class', 'point-handle');

        handle.x.baseVal.value = newPoint.x = point.x;
        handle.y.baseVal.value = newPoint.y = point.y;

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
            onstart: function (event) {
                root.setAttribute('class', 'dragging');
            },
            onmove: function (event) {
                var i = event.target.getAttribute('data-index')|0,
                    point = star.points.getItem(i);

                point.x += event.dx / rootMatrix.a;
                point.y += event.dy / rootMatrix.d;

                event.target.x.baseVal.value = point.x;
                event.target.y.baseVal.value = point.y;
            },
            onend: function (event) {
                root.setAttribute('class', '');
            },
            max: Infinity
        })
        .snap({
            mode: 'anchor',
            anchors: originalPoints,
            range: 10,
            elementOrigin: { x: 0.5, y: 0.5 }
        })
        .restrict({ drag: document.rootElement })
        .styleCursor(false);

    interact.maxInteractions(Infinity);

    document.addEventListener('dragstart', function (event) {
        event.preventDefault();
    });
});
