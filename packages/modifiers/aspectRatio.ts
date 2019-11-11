/* eslint-disable */

/**
 * @module modifiers/aspectRatio
 *
 * @description
 * This module forces elements to be resized with a specified dx/dy ratio.
 *
 * @example
 * interact(target).resizable({
 *   modifiers: [
 *     interact.modifiers.snapSize({
 *       targets: [ interact.createSnapGrid({ x: 20, y: 20 }) ],
 *     }),
 *     interact.aspectRatio({ ratio: 'preserve' }),
 *   ],
 * });
 */

import extend from '@interactjs/utils/extend'
import { ModifierModule, ModifierState } from './base'

export interface AspectRatioOptions {
  ratio?: number | 'preserve'
  equalDelta?: boolean
  enabled?: boolean
}

export type AspectRatioState = ModifierState<AspectRatioOptions, {
  startCoords: Interact.Point
  startRect: Interact.Rect
  linkedEdges: Interact.EdgeOptions
  originalEdges: Interact.EdgeOptions
  ratio: number
  equalDelta: boolean
  edgeSign: 1 | -1
}>

const aspectRatio: ModifierModule<AspectRatioOptions, AspectRatioState> = {
  start ({ interaction, state, rect, pageCoords }) {
    let { ratio } = state.options
    const { equalDelta } = state.options

    if (ratio === 'preserve') {
      ratio = rect.width / rect.height
    }

    state.startCoords = extend({}, pageCoords)
    state.startRect = extend({}, rect)
    state.ratio = ratio
    state.equalDelta = equalDelta
    const originalEdges = state.originalEdges = interaction.edges

    const linkedEdges = state.linkedEdges = interaction.edges = {
      top   : originalEdges.top    || (originalEdges.left   && !originalEdges.bottom),
      left  : originalEdges.left   || (originalEdges.top    && !originalEdges.right),
      bottom: originalEdges.bottom || (originalEdges.right  && !originalEdges.top),
      right : originalEdges.right  || (originalEdges.bottom && !originalEdges.left),
    }

    state.edgeSign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1) as 1 | -1
  },

  set ({ state, coords }) {
    const xIsPrimaryAxis = !!(state.originalEdges.left || state.originalEdges.right)

    if (state.equalDelta) {
      setEqualDelta(state, coords, xIsPrimaryAxis)
    }
    else {
      setRatio(state, coords, xIsPrimaryAxis)
    }
  },

  defaults: {
    ratio: 'preserve',
    equalDelta: false,
    enabled: false,
  },
}

function setEqualDelta ({ startCoords, edgeSign }: AspectRatioState, coords: Interact.Point, xIsPrimaryAxis: boolean) {
  if (xIsPrimaryAxis) {
    coords.y = startCoords.y + (coords.x - startCoords.x) / edgeSign
  }
  else {
    coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign
  }
}

function setRatio ({ startRect, startCoords, ratio, edgeSign }: AspectRatioState, coords: Interact.Point, xIsPrimaryAxis: boolean) {
  if (xIsPrimaryAxis) {
    const newWidth = (startRect.width + (coords.x - startCoords.x) * edgeSign)
    const newHeight = newWidth / ratio

    coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign
  }
  else {
    const newHeight = (startRect.height + (coords.y - startCoords.y) * edgeSign)
    const newWidth = newHeight * ratio

    coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign
  }
}

export default aspectRatio
