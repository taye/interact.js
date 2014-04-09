interact(document).on('DOMContentLoaded', function () {
"use strict";
/* global interact, Modernizr */

var preTransform = Modernizr.prefixed('transform'),
    snapTarget = {};

interact('#gallery .thumbnail')
    .draggable({
        onstart: function (event) {
            snapTarget = {
                x: $('#gallery .stage').width() / 2,
                y: $('#gallery .stage').height() / 2,
                range: Infinity
            };

            var thumb = event.target;

            thumb.classList.add('dragging');
            thumb.dataset.dragX = 0;
            thumb.dataset.dragY = 0;
        },
        onmove: function (event) {
            var thumb = event.target,
                x = (thumb.dataset.dragX|0) + event.dx,
                y = (thumb.dataset.dragY|0) + event.dy;

            thumb.style[preTransform] = 'translate(' + x + 'px,' + y + 'px)';

            thumb.dataset.dragX = x;
            thumb.dataset.dragY = y;
        },
        onend: function (event) {
            var $thumb = $(event.target);

            // if the drag was snapped to the stage
            if (event.pageX === snapTarget.x && event.pageY === snapTarget.y) {
                $('#gallery .stage img').removeClass('active');
                $('#gallery .thumbnail').removeClass('expanded')
                    .not($thumb).css(preTransform, '');

                $thumb.addClass('expanded');
                $('#gallery [data-image=' + $thumb.data('for') + ']').addClass('active');
            }
            else {
                $thumb.css(preTransform, '');
            }

            $thumb.removeClass('dragging');
        }
    })
    .origin($('#gallery')[0])
    .snap({
        mode: 'path',
        // If the pointer is far enough above the bottom of the stage
        // then snap to the center of the stage
        paths: [function (x, y) {
            if (y < $('#gallery .stage').height() * 0.7) {
                return snapTarget;
            }
            return {};
        }],
        endOnly: true
    })
    //.snap(false)
    .inertia(true);
}());
