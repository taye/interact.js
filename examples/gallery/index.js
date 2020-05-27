/* eslint-disable import/no-absolute-path */
import interact from '/@interactjs/interactjs/index.js'

/*
* This demo is very broken!
*/

let snapTarget = {}

interact('#gallery .thumbnail')
  .draggable({
    snap: {
      targets: [],
      relativePoints: [{ x: 0.5, y: 0.5 }],
      endOnly: true,
    },
    inertia: true,
    onstart: function (event) {
      snapTarget = {
        x: $('#gallery .stage').width() / 2,
        y: $('#gallery .stage').height() / 2,
        range: Infinity,
      }

      const thumb = event.target

      thumb.classList.add('dragging')
      thumb.dataset.dragX = 0
      thumb.dataset.dragY = 0
    },
    onmove: function (event) {
      const thumb = event.target
      const x = (thumb.dataset.dragX | 0) + event.dx
      const y = (thumb.dataset.dragY | 0) + event.dy

      thumb.style.transform = 'translate(' + x + 'px,' + y + 'px)'

      thumb.dataset.dragX = x
      thumb.dataset.dragY = y
    },
    onend: function (event) {
      const $thumb = $(event.target)

      // if the drag was snapped to the stage
      if (event.dropzone) {
        $('#gallery .stage img').removeClass('active')
        $('#gallery .thumbnail').removeClass('expanded')
          .not($thumb).css('transform', '')

        $thumb.addClass('expanded')
        $('#gallery [data-image=' + $thumb.data('for') + ']').addClass('active')
      }
      else {
        $thumb.css('transform', '')
      }

      $thumb.removeClass('dragging')
    },
  })
  .origin($('#gallery')[0])

interact('#gallery .stage')
  .dropzone({
    accept: ' #gallery .thumbnail',
    overlap: 1,
  })
  .on('dragenter', (event) => {
    event.draggable.draggable({
      snap: { targets: [snapTarget] },
    })
  })
  .on('dragleave drop', (event) => {
    event.draggable.draggable({
      snap: { targets: [] },
    })
  })
