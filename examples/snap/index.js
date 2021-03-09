/* eslint-disable import/no-absolute-path */
import interact from '@interactjs/interactjs'

window.interact = interact

let canvas
let context
let guidesCanvas
let guidesContext
const width = 800
const height = 800
let status
const blue = '#2299ee'
const lightBlue = '#88ccff'
const tango = '#ff4400'
let draggingAnchor = null

const snapOffset = { x: 0, y: 0 }

const snapGrid = {
  x: 10,
  y: 10,
  range: 10,
  offset: { x: 0, y: 0 },
}
const gridFunc = interact.snappers.grid(snapGrid)
const anchors = [
  { x: 100, y: 100, range: 200 },
  { x: 600, y: 400, range: Infinity },
  { x: 500, y: 150, range: Infinity },
  { x: 250, y: 250, range: Infinity },
]

const prevCoords = { x: 0, y: 0 }
let prevClosest = { target: { x: 0, y: 0 }, range: 0 }
const cursorRadius = 10

function drawGrid (grid, gridOffset, range) {
  if (!grid.x || !grid.y) return

  const barLength = 16
  const offset = {
    x: gridOffset.x + snapOffset.x,
    y: gridOffset.y + snapOffset.y,
  }

  guidesContext.clearRect(0, 0, width, height)

  guidesContext.fillStyle = lightBlue

  if (range < 0 || range === Infinity) {
    guidesContext.fillRect(0, 0, width, height)
  }

  for (let i = -((1 + offset.x / grid.x) | 0), lenX = width / grid.x + 1; i < lenX; i++) {
    for (let j = -((1 + offset.y / grid.y) | 0), lenY = height / grid.y + 1; j < lenY; j++) {
      if (range > 0 && range !== Infinity) {
        guidesContext.circle(i * grid.x + offset.x, j * grid.y + offset.y, range, blue).fill()
      }

      guidesContext.beginPath()
      guidesContext.moveTo(i * grid.x + offset.x, j * grid.y + offset.y - barLength / 2)
      guidesContext.lineTo(i * grid.x + offset.x, j * grid.y + offset.y + barLength / 2)
      guidesContext.stroke()

      guidesContext.beginPath()
      guidesContext.moveTo(i * grid.x + offset.x - barLength / 2, j * grid.y + offset.y)
      guidesContext.lineTo(i * grid.x + offset.x + barLength / 2, j * grid.y + offset.y)
      guidesContext.stroke()
    }
  }
}

function drawAnchors (defaultRange) {
  const barLength = 16

  guidesContext.clearRect(0, 0, width, height)

  if (status.range.value < 0 && status.range.value !== Infinity) {
    guidesContext.fillStyle = lightBlue
    guidesContext.fillRect(0, 0, width, height)
  }

  for (let i = 0, len = anchors.length; i < len; i++) {
    const anchor = {
      x: anchors[i].x + snapOffset.x,
      y: anchors[i].y + snapOffset.y,
      range: anchors[i].range,
    }
    const range = typeof anchor.range === 'number' ? anchor.range : defaultRange

    if (range > 0 && range !== Infinity) {
      guidesContext.circle(anchor.x, anchor.y, range, blue).fill()
    }

    guidesContext.beginPath()
    guidesContext.moveTo(anchor.x, anchor.y - barLength / 2)
    guidesContext.lineTo(anchor.x, anchor.y + barLength / 2)
    guidesContext.stroke()

    guidesContext.beginPath()
    guidesContext.moveTo(anchor.x - barLength / 2, anchor.y)
    guidesContext.lineTo(anchor.x + barLength / 2, anchor.y)
    guidesContext.stroke()
  }
}

function drawSnap (snap) {
  context.clearRect(0, 0, width, height)
  guidesContext.clearRect(0, 0, width, height)

  if (status.gridMode.checked) {
    drawGrid(snapGrid, snapGrid.offset, snapGrid.range)
  } else if (status.anchorMode.checked) {
    drawAnchors(snap.range)
  }
}

function circle (x, y, radius, color) {
  this.fillStyle = color || this.fillStyle
  this.beginPath()
  this.arc(x, y, radius, 0, 2 * Math.PI)

  return this
}
window.CanvasRenderingContext2D.prototype.circle = circle

function dragMove (event) {
  const snap = event._interaction.modification.states.find((m) => m.name === 'snap')
  const closest = snap && snap.closest
  const rect = interact.getElementRect(canvas)

  context.clearRect(
    prevCoords.x - cursorRadius - 2,
    prevCoords.y - cursorRadius - 2,
    cursorRadius * 2 + 4,
    cursorRadius * 2 + 4,
  )

  context.clearRect(
    prevClosest.target.x - prevClosest.range - rect.left - 2,
    prevClosest.target.y - prevClosest.range - rect.top - 2,
    prevClosest.range * 2 + 4 + rect.left,
    prevClosest.range * 2 + 4 + rect.top,
  )

  if (closest && closest.range !== Infinity) {
    const closestTarget = {
      x: closest.target.x - rect.left,
      y: closest.target.y - rect.top,
    }

    context.circle(closestTarget.x, closestTarget.y, closest.range + 1, 'rgba(102, 225, 117, 0.8)').fill()
  }

  context.circle(event.pageX, event.pageY, cursorRadius, tango).fill()

  prevCoords.x = event.pageX
  prevCoords.y = event.pageY
  prevClosest = closest || prevClosest
}

function dragEnd (event) {
  context.clearRect(0, 0, width, height)
  context.circle(event.pageX, event.pageY, cursorRadius, tango).fill()

  prevCoords.x = event.pageX
  prevCoords.y = event.pageY
}

function anchorDragStart (event) {
  if (event.snap.locked) {
    interact(canvas).snap(false)
    draggingAnchor = event.snap.anchors.closest
  }
}

function anchorDragMove (event) {
  if (draggingAnchor) {
    const snap = interact(canvas).snap().drag

    draggingAnchor.x += event.dx
    draggingAnchor.y += event.dy

    drawAnchors(snap.range)
  }
}

function anchorDragEnd (event) {
  interact(canvas).draggable(true)
  draggingAnchor = null
}

function sliderChange () {
  snapGrid.x = Number(status.gridX.value)
  snapGrid.y = Number(status.gridY.value)
  snapGrid.range = Number(status.range.value)

  snapGrid.offset.x = Number(status.offsetX.value)
  snapGrid.offset.y = Number(status.offsetY.value)

  if (snapGrid.range < 0) {
    snapGrid.range = Infinity
  }

  drawSnap(interact(canvas).draggable().snap)
}

function modeChange (event) {
  if (status.anchorDrag.checked && !status.anchorMode.checked) {
    status.anchorMode.checked = true
  }

  if (status.anchorDrag.checked) {
    status.anchorMode.disabled = status.offMode.disabled = status.gridMode.disabled = true
    status.modes.className += ' disabled'

    interact(canvas)
      .off('dragstart', dragMove)
      .off('dragmove', dragMove)
      .off('dragend', dragEnd)
      .on('dragstart', anchorDragStart)
      .on('dragmove', anchorDragMove)
      .on('dragend', anchorDragEnd)
  } else {
    status.anchorMode.disabled = status.offMode.disabled = status.gridMode.disabled = false
    status.modes.className = status.modes.className.replace(/ *\bdisabled\b/g, '')

    interact(canvas)
      .on('dragstart', dragMove)
      .on('dragmove', dragMove)
      .on('dragend', dragEnd)
      .off('dragstart', anchorDragStart)
      .off('dragmove', anchorDragMove)
      .off('dragend', anchorDragEnd)
  }

  interact(canvas).draggable({
    inertia: {
      enabled: status.inertia.checked,
    },
    modifiers: [
      interact.modifiers.restrict({ restriction: 'self' }),
      interact.modifiers.snap({
        targets: status.gridMode.checked ? [gridFunc] : status.anchorMode.checked ? anchors : null,
        enabled: !status.offMode.checked,
        endOnly: status.endOnly.checked,
        offset: status.relative.checked ? 'startCoords' : null,
      }),
      interact.modifiers.spring(),
    ],
  })

  if (!status.relative.checked) {
    snapOffset.x = snapOffset.y = 0
  }

  drawSnap(interact(canvas).draggable().snap)
}

function sliderInput (event) {
  // eslint-disable-next-line no-mixed-operators
  if (
    (event.target.type === 'range' &&
      // eslint-disable-next-line no-mixed-operators
      Number(event.target.value) > Number(event.target.max)) ||
    Number(event.target.value) < Number(event.target.min)
  ) {
    return
  }

  sliderChange()
}

interact(document).on('DOMContentLoaded', () => {
  canvas = document.getElementById('drag')
  canvas.width = width
  canvas.height = height
  context = canvas.getContext('2d')

  interact(canvas)
    .on('move down', (event) => {
      if ((event.type === 'down' || !event.interaction.pointerIsDown) && status.relative.checked) {
        const rect = interact.getElementRect(canvas)

        snapOffset.x = event.pageX - rect.left
        snapOffset.y = event.pageY - rect.top

        drawSnap(interact(canvas).draggable().snap)
      }
    })
    .draggable({ origin: 'self' })

  guidesCanvas = document.getElementById('grid')
  guidesCanvas.width = width
  guidesCanvas.height = height
  guidesContext = guidesCanvas.getContext('2d')

  status = {
    container: document.getElementById('status'),

    sliders: document.getElementById('sliders'),
    gridX: document.getElementById('grid-x'),
    gridY: document.getElementById('grid-y'),
    offsetX: document.getElementById('offset-x'),
    offsetY: document.getElementById('offset-y'),
    range: document.getElementById('snap-range'),

    modes: document.getElementById('modes'),
    offMode: document.getElementById('off-mode'),
    gridMode: document.getElementById('grid-mode'),
    anchorMode: document.getElementById('anchor-mode'),
    anchorDrag: document.getElementById('drag-anchors'),
    endOnly: document.getElementById('end-only'),
    inertia: document.getElementById('inertia'),
    relative: document.getElementById('relative'),
  }

  interact('#sliders').on('change', sliderInput).on('input', sliderInput)

  interact('#modes').on('change', modeChange)

  sliderChange()
  modeChange()
})

window.grid = {
  drawGrid: drawGrid,
}
