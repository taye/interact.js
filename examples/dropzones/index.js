/* eslint-disable import/no-absolute-path */
import interact from '@interactjs/interactjs'

let transformProp
const dragPositions = [1, 2, 3, 4].reduce((acc, n) => {
  acc[`drag${n}`] = { x: 0, y: 0 }
  return acc
}, {})

interact.maxInteractions(Infinity)

// setup draggable elements.
interact('.js-drag').draggable({
  listeners: {
    start (event) {
      const position = dragPositions[event.target.id]
      position.x = parseInt(event.target.getAttribute('data-x'), 10) || 0
      position.y = parseInt(event.target.getAttribute('data-y'), 10) || 0
    },
    move (event) {
      const position = dragPositions[event.target.id]
      position.x += event.dx
      position.y += event.dy

      if (transformProp) {
        event.target.style[transformProp] = 'translate(' + position.x + 'px, ' + position.y + 'px)'
      } else {
        event.target.style.left = position.x + 'px'
        event.target.style.top = position.y + 'px'
      }
    },
    end (event) {
      const position = dragPositions[event.target.id]
      event.target.setAttribute('data-x', position.x)
      event.target.setAttribute('data-y', position.y)
    },
  },
})

// setup drop areas.
// dropzone #1 accepts draggable #1
setupDropzone('#drop1', '#drag1')
// dropzone #2 accepts draggable #1 and #2
setupDropzone('#drop2', '#drag1, #drag2')
// every dropzone accepts draggable #3
setupDropzone('.js-drop', '#drag3')

/**
 * Setup a given element as a dropzone.
 *
 * @param {HTMLElement|String} target
 * @param {String} accept
 */
function setupDropzone (target, accept) {
  interact(target)
    .dropzone({
      accept: accept,
      ondropactivate: function (event) {
        addClass(event.relatedTarget, '-drop-possible')
      },
      ondropdeactivate: function (event) {
        removeClass(event.relatedTarget, '-drop-possible')
      },
    })
    .on('dropactivate', (event) => {
      const active = event.target.getAttribute('active') | 0

      // change style if it was previously not active
      if (active === 0) {
        addClass(event.target, '-drop-possible')
        event.target.textContent = 'Drop me here!'
      }

      event.target.setAttribute('active', active + 1)
    })
    .on('dropdeactivate', (event) => {
      const active = event.target.getAttribute('active') | 0

      // change style if it was previously active
      // but will no longer be active
      if (active === 1) {
        removeClass(event.target, '-drop-possible')
        event.target.textContent = 'Dropzone'
      }

      event.target.setAttribute('active', active - 1)
    })
    .on('dragenter', (event) => {
      addClass(event.target, '-drop-over')
      event.relatedTarget.textContent = "I'm in"
    })
    .on('dragleave', (event) => {
      removeClass(event.target, '-drop-over')
      event.relatedTarget.textContent = 'Drag me…'
    })
    .on('drop', (event) => {
      removeClass(event.target, '-drop-over')
      event.relatedTarget.textContent = 'Dropped'
    })
}

function addClass (element, className) {
  if (element.classList) {
    return element.classList.add(className)
  } else {
    element.className += ' ' + className
  }
}

function removeClass (element, className) {
  if (element.classList) {
    return element.classList.remove(className)
  } else {
    element.className = element.className.replace(new RegExp(className + ' *', 'g'), '')
  }
}

/* eslint-disable multiline-ternary */
interact(document).on('ready', () => {
  transformProp =
    'transform' in document.body.style
      ? 'transform'
      : 'webkitTransform' in document.body.style
        ? 'webkitTransform'
        : 'mozTransform' in document.body.style
          ? 'mozTransform'
          : 'oTransform' in document.body.style
            ? 'oTransform'
            : 'msTransform' in document.body.style
              ? 'msTransform'
              : null
})
/* eslint-enable multiline-ternary */
