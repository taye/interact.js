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
    // dropzone #1 accepts draggable #1
    setupDropzone('#drop1', '#drag1');
    // dropzone #2 accepts draggable #1 and #2
    setupDropzone('#drop2', '#drag1, #drag2');
    // every dropzone accepts draggable #3
    setupDropzone('.js-drop', '#drag3');

    /**
     * Setup a given element as a dropzone.
     *
     * @param {HTMLElement|String} el
     * @param {String} accept
     */
    function setupDropzone(el, accept) {
        interact(el)
            .dropzone({
                accept: accept,
                ondropactivate: function (event) {
                    event.relatedTarget.classList.add('-drop-possible');
                },
                ondropdeactivate: function (event) {
                    event.relatedTarget.classList.remove('-drop-possible');
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
    }

}(window.interact));
