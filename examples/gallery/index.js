interact(document).on('DOMContentLoaded', function () {

  /* global interact, Modernizr */

  /*
 * This demo is very broken!
 */

  let preTransform = Modernizr.prefixed('transform'),
    snapTarget = {};

  interact('#gallery .thumbnail')
    .draggable({
      snap: {
        targets: [],
        relativePoints: [ { x: 0.5, y: 0.5 } ],
        endOnly: true,
      },
      inertia: true,
      onstart: function (event) {
        snapTarget = {
          x: $('#gallery .stage').width() / 2,
          y: $('#gallery .stage').height() / 2,
          range: Infinity,
        };

        const thumb = event.target;

        thumb.classList.add('dragging');
        thumb.dataset.dragX = 0;
        thumb.dataset.dragY = 0;
      },
      onmove: function (event) {
        let thumb = event.target,
          x = (thumb.dataset.dragX|0) + event.dx,
          y = (thumb.dataset.dragY|0) + event.dy;

        thumb.style[preTransform] = 'translate(' + x + 'px,' + y + 'px)';

        thumb.dataset.dragX = x;
        thumb.dataset.dragY = y;
      },
      onend: function (event) {
        const $thumb = $(event.target);

        // if the drag was snapped to the stage
        if (event.dropzone) {
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
      },
    })
    .origin($('#gallery')[0]);

  interact('#gallery .stage')
    .dropzone({
      accept: ' #gallery .thumbnail',
      overlap: 1,
    })
    .on('dragenter', function (event) {
      event.draggable.draggable({
        snap: { targets: [snapTarget] },
      });
    })
    .on('dragleave drop', function (event) {
      event.draggable.draggable({
        snap: { targets: [] },
      });
    });
}());
