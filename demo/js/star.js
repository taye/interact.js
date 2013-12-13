document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var sns="http://www.w3.org/2000/svg",
        xns="http://www.w3.org/1999/xlink",
        root = document.getElementById('svg-edit-demo'),
        star = document.getElementById('edit-star'),
        rootMatrix;

    for (var i = 0, len = star.points.numberOfItems; i < len; i++) {
        var handle = root.querySelector('defs .point-handle').cloneNode(true),
            point = star.points.getItem(i);

        handle.cx.baseVal.value = point.x;
        handle.cy.baseVal.value = point.y;

        handle.setAttribute('data-index', i);

        root.appendChild(handle);
    }

    interact('.point-handle')
        .draggable({
            onstart: function (event) {
                rootMatrix = root.getScreenCTM();
            },
            onmove: function (event) {
                var i = event.target.getAttribute('data-index')|0,
                    point = star.points.getItem(i);

                point.x += event.dx / rootMatrix.a;
                point.y += event.dy / rootMatrix.d;

                event.target.cx.baseVal.value = point.x;
                event.target.cy.baseVal.value = point.y;
            }
        });
});
