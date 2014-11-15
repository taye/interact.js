(function (interact) {
'use strict';

var dirs = ['up', 'down', 'left', 'right'],
    console = window.console;

interact('#swipe')
.draggable(true)
    .on('dragstart', function (event) {
        event.target.innerHTML = 'dragging...';
    })
    .on('dragend', function (event) {
        if (!event.swipe) {
            event.target.innerHTML = 'no swipe';
            return;
        }

        var str = 'swipe';

        dirs.forEach(function (dir) {
            if (event.swipe[dir]) {
                str += ' ' + dir;
            }
        });
        
        str += '<br>' + event.swipe.angle.toFixed(2) + '°'
            + '<br>' + event.swipe.speed.toFixed(2) + 'px/sec';

        event.target.innerHTML = str;
        console.log(str.replace(/<br>/g, ' '));
    });

['tap', 'doubletap', 'hold', 'down', 'move', 'up'].forEach(function (eventType) {
    interact('#swipe').on(eventType, function (event) {
        event.target.innerHTML = eventType;
        console.log(eventType);
    });
});

}(window.interact));
