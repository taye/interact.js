/**
 * @module modifiers/aspectRatio
 *
 * @description
 * This module forces elements to be resized with a specified dx/dy ratio.
 *
 * ```js
 * interact(target).resizable({
 *   modifiers: [
 *     interact.modifiers.snapSize({
 *       targets: [ interact.snappers.grid({ x: 20, y: 20 }) ],
 *     }),
 *     interact.aspectRatio({ ratio: 'preserve' }),
 *   ],
 * });
 * ```
 */

import type { Point, Rect, EdgeOptions } from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import { addEdges } from '@interactjs/utils/rect'

import Modification from './Modification'
import type { Modifier, ModifierModule, ModifierState } from './base'
import { makeModifier } from './base'

export interface AspectRatioOptions {
  ratio?: number | 'preserve'
  equalDelta?: boolean
  modifiers?: Modifier[]
  enabled?: boolean
}

export type AspectRatioState = ModifierState<
AspectRatioOptions,
{
  startCoords: Point
  startRect: Rect
  linkedEdges: EdgeOptions
  ratio: number
  equalDelta: boolean
  xIsPrimaryAxis: boolean
  edgeSign: {
    x: number
    y: number
  }
  subModification: Modification
}
>

const aspectRatio: ModifierModule<AspectRatioOptions, AspectRatioState> = {
  start (arg) {
    const { state, rect, edges: originalEdges, pageCoords: coords } = arg
    let { ratio } = state.options
    const { equalDelta, modifiers } = state.options

    if (ratio === 'preserve') {
      ratio = rect.width / rect.height
    }

    state.startCoords = extend({}, coords)
    state.startRect = extend({}, rect)
    state.ratio = ratio
    state.equalDelta = equalDelta

    const linkedEdges = (state.linkedEdges = {
      top: originalEdges.top || (originalEdges.left && !originalEdges.bottom),
      left: originalEdges.left || (originalEdges.top && !originalEdges.right),
      bottom: originalEdges.bottom || (originalEdges.right && !originalEdges.top),
      right: originalEdges.right || (originalEdges.bottom && !originalEdges.left),
    })

    state.xIsPrimaryAxis = !!(originalEdges.left || originalEdges.right)

    if (state.equalDelta) {
      const sign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1)
      state.edgeSign = {
        x: sign,
        y: sign,
      }
    } else {
      state.edgeSign = {
        x: linkedEdges.left ? -1 : 1,
        y: linkedEdges.top ? -1 : 1,
      }
    }

    extend(arg.edges, linkedEdges)

    if (!modifiers || !modifiers.length) return

    const subModification = new Modification(arg.interaction)

    subModification.copyFrom(arg.interaction.modification)
    subModification.prepareStates(modifiers)

    state.subModification = subModification
    subModification.startAll({ ...arg })
  },

  set (arg) {
    const { state, rect, coords } = arg
    const initialCoords = extend({}, coords)
    const aspectMethod = state.equalDelta ? setEqualDelta : setRatio

    aspectMethod(state, state.xIsPrimaryAxis, coords, rect)

    if (!state.subModification) {
      return null
    }

    const correctedRect = extend({}, rect)

    addEdges(state.linkedEdges, correctedRect, {
      x: coords.x - initialCoords.x,
      y: coords.y - initialCoords.y,
    })

    const result = state.subModification.setAll({
      ...arg,
      rect: correctedRect,
      edges: state.linkedEdges,
      pageCoords: coords,
      prevCoords: coords,
      prevRect: correctedRect,
    })

    const { delta } = result

    if (result.changed) {
      const xIsCriticalAxis = Math.abs(delta.x) > Math.abs(delta.y)

      // do aspect modification again with critical edge axis as primary
      aspectMethod(state, xIsCriticalAxis, result.coords, result.rect)
      extend(coords, result.coords)
    }

    return result.eventProps
  },

  defaults: {
    ratio: 'preserve',
    equalDelta: false,
    modifiers: [],
    enabled: false,
  },
}

function setEqualDelta ({ startCoords, edgeSign }: AspectRatioState, xIsPrimaryAxis: boolean, coords: Point) {
  if (xIsPrimaryAxis) {
    coords.y = startCoords.y + (coords.x - startCoords.x) * edgeSign.y
  } else {
    coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign.x
  }
}

function setRatio (
  { startRect, startCoords, ratio, edgeSign }: AspectRatioState,
  xIsPrimaryAxis: boolean,
  coords: Point,
  rect: Rect,
) {
  if (xIsPrimaryAxis) {
    const newHeight = rect.width / ratio

    coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign.y
  } else {
    const newWidth = rect.height * ratio

    coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign.x
  }
}

export default makeModifier(aspectRatio, 'aspectRatio')
export { aspectRatio }
