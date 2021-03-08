/* eslint-disable import/no-absolute-path */
import '@interactjs/actions'
import '@interactjs/modifiers'
import '@interactjs/inertia'
import '@interactjs/auto-start'
import '@interactjs/dev-tools'

import interact from '@interactjs/interact'

const svgCanvas = document.querySelector('svg')
const svgNS = 'http://www.w3.org/2000/svg'
const rectangles = []

class Rectangle {
  constructor (x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.scale = 1.0
    this.stroke = 5
    this.el = document.createElementNS(svgNS, 'rect')

    this.el.setAttribute('data-index', rectangles.length)
    this.el.setAttribute('class', 'edit-rectangle')
    rectangles.push(this)

    this.draw()
  }

  draw () {
    let x = this.x
    let y = this.y
    let w = this.w
    let h = this.h
    let cssClass = 'edit-rectangle'

    if (w < 0) {
      x += w
      w = Math.abs(w)
      cssClass += ' neg-w'
    }
    if (h < 0) {
      y += h
      h = Math.abs(h)
      cssClass += ' neg-h'
    }

    this.el.setAttribute('x', x + this.stroke / 2)
    this.el.setAttribute('y', y + this.stroke / 2)
    this.el.setAttribute('width', Math.max(w, 10) - this.stroke)
    this.el.setAttribute('height', Math.max(h, 10) - this.stroke)
    this.el.setAttribute('stroke-width', this.stroke)
    this.el.style.transform = `scale(${this.scale})`

    this.el.setAttribute('class', cssClass)
  }
}

interact('.edit-rectangle')
  // change how interact gets the
  // dimensions of '.edit-rectangle' elements
  .rectChecker((element) => {
    // find the Rectangle object that the element belongs to
    const { x, y, w, h, scale } = rectangles[element.getAttribute('data-index')]

    // return a suitable object for interact.js
    const left = x * scale
    const top = y * scale

    return {
      left,
      top,
      right: left + w * scale,
      bottom: top + h * scale,
    }
  })
  .draggable({
    // inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        // restrict to a parent element that matches this CSS selector
        restriction: 'svg',
        // only restrict before ending the drag
        endOnly: true,
      }),
      interact.modifiers.transform(),
    ],
    onmove: function (event) {
      const rectangle = rectangles[event.target.getAttribute('data-index')]

      rectangle.x += event.dx
      rectangle.y += event.dy
      rectangle.draw()
    },
  })
  .resizable({
    edges: { left: true, right: true, top: true, bottom: true },
    invert: 'reposition',
    modifiers: [
      interact.modifiers.transform(),
      interact.modifiers.restrictEdges({
        restriction: 'svg',
      }),
    ],
    listeners: {
      move (event) {
        const rectangle = rectangles[event.target.getAttribute('data-index')]

        rectangle.x = event.rect.left
        rectangle.y = event.rect.top
        rectangle.w = event.rect.width
        rectangle.h = event.rect.height
        rectangle.draw()
      },
    },
  })

for (let i = 0; i < 5; i++) {
  const r = new Rectangle(50 + 100 * i, 80, 80, 80)
  svgCanvas.appendChild(r.el)
}

interact('#invert').on('input change', (event) => {
  interact('.edit-rectangle').resizable({ invert: event.target.value })
  console.log(event.target.value)
})
