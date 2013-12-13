document.addEventListener('DOMContentLoaded', function () {
    var sns="http://www.w3.org/2000/svg",
        xns="http://www.w3.org/1999/xlink",
        root = document.getElementById('svg-edit-demo'),
        star = document.getElementById('edit-star');

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
            onmove: function (event) {
                var i = event.target.getAttribute('data-index')|0,
                    point = star.points.getItem(i);

                point.x += event.dx;
                point.y += event.dy;

                event.target.cx.baseVal.value = point.x;
                event.target.cy.baseVal.value = point.y;
            }
        });
});
