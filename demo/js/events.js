(function (interact) {
'use strict';

var dirs = ['up', 'down', 'left', 'right'],
    console = window.console;

interact('#swipe')
.draggable(true)
    .on('dragend', function (event) {
        if (!event.swipe) {
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
        event.target.innerHTML = event.pointerType;

        if (interact.supportsTouch() || interact.supportsPointerEvent()) {
            event.target.innerHTML += ' #' + event.pointerId;
        }

        var interactionIndex = interact.debug().interactions.indexOf(event.interaction);

        event.target.innerHTML += ' ' + event.type
                                    + '<br>(' + event.pageX + ', ' + event.pageY + ')<br>'
                                    + 'interaction #' + interactionIndex;

        console.log(event.pointerType, event.pointerId, event.type, event.pageX, event.pageY, interactionIndex);

        event.preventDefault();
    });
});

function changeTolerance (event) {
    var value = event.target.value|0;

    interact.pointerMoveTolerance(value);

    document.getElementById('tolerance-display').textContent = value;
}

interact('.tolerance-slider').on('input' , changeTolerance);
interact('.tolerance-slider').on('change', changeTolerance);

}(window.interact));
