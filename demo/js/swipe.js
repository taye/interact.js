(function (interact) {
'use strict';

var dirs = ['up', 'down', 'left', 'right'];

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
    })
    .on('tap', function (event) {
        event.target.innerHTML = 'tap';
        console.log('tap');
    });

}(window.interact));
