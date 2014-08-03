(function (interact) {

    'use strict';

    var position = {};

    // setup draggable elements.
    interact('.js-drag')
        .draggable(true)
        .on('dragstart', function (event) {
            position.x = parseInt(event.target.dataset.x, 10) || 0;
            position.y = parseInt(event.target.dataset.y, 10) || 0;
        })
        .on('dragmove', function (event) {
            position.x += event.dx;
            position.y += event.dy;

            event.target.dataset.x = position.x;
            event.target.dataset.y = position.y;
            event.target.style.webkitTransform = event.target.style.transform = 'translate(' + position.x + 'px, ' + position.y + 'px)';
        });

    // setup drop areas.
    interact('.js-drop')
        .dropzone({
            accept: '.js-drag',
            ondropactivate: function () {
                console.log('ondropactivate callback');
            },
            ondropdeactivate: function () {
                console.log('ondropdeactivate callback');
            }
        })
        .on('dropactivate', function (event) {
            console.log('activate', event);
            event.target.classList.add('-drop-possible');
            event.target.textContent = 'Drop me here!';

        })
        .on('dropdeactivate', function (event) {
            console.log('deactivate', event);
            event.target.classList.remove('-drop-possible');
            event.target.textContent = 'Dropzone';
        })
        .on('dragenter', function (event) {
            event.target.classList.add('-drop-over');
            event.relatedTarget.textContent = 'I\'m in';
        })
        .on('dragleave', function (event) {
            event.target.classList.remove('-drop-over');
            event.relatedTarget.textContent = 'Drag me…';
        })
        .on('drop', function (event) {
            event.target.classList.remove('-drop-over');
            event.relatedTarget.textContent = 'Dropped';
        });

}(window.interact));