document.addEventListener('DOMContentLoaded', () => {
  const sns = 'http://www.w3.org/2000/svg'
  const xns = 'http://www.w3.org/1999/xlink'
  const root = document.getElementById('svg-edit-demo')
  const star = document.getElementById('edit-star')
  let rootMatrix
  const originalPoints = []
  let transformedPoints = []

  for (let i = 0, len = star.points.numberOfItems; i < len; i++) {
    const handle = document.createElementNS(sns, 'use')
    const point = star.points.getItem(i)
    const newPoint = root.createSVGPoint()

    handle.setAttributeNS(xns, 'href', '#point-handle')
    handle.setAttribute('class', 'point-handle')

    handle.x.baseVal.value = newPoint.x = point.x
    handle.y.baseVal.value = newPoint.y = point.y

    handle.setAttribute('data-index', i)

    originalPoints.push(newPoint)

    root.appendChild(handle)
  }

  function applyTransforms (event) {
    rootMatrix = root.getScreenCTM()

    transformedPoints = originalPoints.map((point) => {
      return point.matrixTransform(rootMatrix)
    })

    interact('.point-handle').draggable({
      snap: {
        targets: transformedPoints,
        range: 20 * Math.max(rootMatrix.a, rootMatrix.d),
      },
    })
  }

  interact(root).on('mousedown', applyTransforms).on('touchstart', applyTransforms)

  interact('.point-handle')
    .draggable({
      onstart: function (event) {
        root.setAttribute('class', 'dragging')
      },
      onmove: function (event) {
        const i = event.target.getAttribute('data-index') | 0
        const point = star.points.getItem(i)

        point.x += event.dx / rootMatrix.a
        point.y += event.dy / rootMatrix.d

        event.target.x.baseVal.value = point.x
        event.target.y.baseVal.value = point.y
      },
      onend: function (event) {
        root.setAttribute('class', '')
      },
      snap: {
        targets: originalPoints,
        range: 10,
        relativePoints: [{ x: 0.5, y: 0.5 }],
      },
      restrict: { restriction: document.rootElement },
    })
    .styleCursor(false)

  document.addEventListener('dragstart', (event) => {
    event.preventDefault()
  })
})
