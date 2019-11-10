import extend from '@interactjs/utils/extend'
import * as is from '@interactjs/utils/is'

export default {
  start ({ interaction, status, rect, pageCoords }) {
    let { options: { ratio } } = status

    if (is.func(ratio)) {
      ratio = ratio(interaction)
    }

    if (ratio === 'preserve') {
      ratio = rect.width / rect.height
    }
    else if (ratio === 'square') {
      ratio = 1
    }

    status.startCoords = extend({}, pageCoords)
    status.startRect = extend({}, rect)
    status.ratio = ratio
    const originalEdges = status.originalEdges = interaction.edges

    status.linkedEdges = interaction.edges = {
      top   : originalEdges.top    || (originalEdges.left   && !originalEdges.bottom),
      left  : originalEdges.left   || (originalEdges.top    && !originalEdges.right),
      bottom: originalEdges.bottom || (originalEdges.right  && !originalEdges.top),
      right : originalEdges.right  || (originalEdges.bottom && !originalEdges.left),
    }
  },

  set ({ status, coords }) {
    const { startCoords, ratio, originalEdges } = status

    const dx0 = coords.x - startCoords.x
    const dy0 = coords.y - startCoords.y

    let dx = dx0
    let dy = dy0

    if ((originalEdges.left && originalEdges.bottom) ||
         (originalEdges.right && originalEdges.top)) {
      dy = dx / ratio
    }
    else if (originalEdges.left || originalEdges.right) { dy = dx / ratio }
    else if (originalEdges.top  || originalEdges.bottom) { dx = dy * ratio }

    coords.x = startCoords.x + dx
    coords.y = startCoords.y + dy
  },

  defaults: {
    ratio: null,
    enabled: false,
  },
}
