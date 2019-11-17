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

import extend from '../utils/extend'
import { addEdges } from '../utils/rect'
import modifiersBase, { Modifier, ModifierModule, ModifiersResult, ModifierState, setAll, startAll } from './base'

export interface AspectRatioOptions {
  ratio?: number | 'preserve'
  equalDelta?: boolean
  modifiers?: Modifier[]
  enabled?: boolean
}

export type AspectRatioState = ModifierState<AspectRatioOptions, {
  startCoords: Interact.Point
  startRect: Interact.Rect
  linkedEdges: Interact.EdgeOptions
  ratio: number
  equalDelta: boolean
  xIsPrimaryAxis: boolean
  edgeSign: 1 | -1
  subStates: ModifierState[]
  prevSubResult: ModifiersResult
}>

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

    const linkedEdges = state.linkedEdges = {
      top   : originalEdges.top    || (originalEdges.left   && !originalEdges.bottom),
      left  : originalEdges.left   || (originalEdges.top    && !originalEdges.right),
      bottom: originalEdges.bottom || (originalEdges.right  && !originalEdges.top),
      right : originalEdges.right  || (originalEdges.bottom && !originalEdges.left),
    }

    state.xIsPrimaryAxis = !!(originalEdges.left || originalEdges.right)

    if (state.equalDelta) {
      state.edgeSign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1) as 1 | -1
    }
    else {
      const negativeSecondaryEdge = state.xIsPrimaryAxis ? linkedEdges.top : linkedEdges.left
      state.edgeSign = negativeSecondaryEdge ? -1 : 1
    }

    extend(arg.edges, linkedEdges)

    if (!modifiers || !modifiers.length) { return }

    state.subStates = modifiersBase.prepareStates(modifiers).map(subState => {
      subState.options = {
        ...subState.options,
      }

      return subState
    })

    startAll({
      ...arg,
      states: state.subStates,
    })

    state.prevSubResult = setAll({
      ...arg,
      pageCoords: coords,
      prevCoords: coords,
      states: state.subStates,
    })
  },

  set (arg) {
    const { state, rect, coords } = arg
    const initialCoords = extend({}, coords)
    const aspectMethod = state.equalDelta ? setEqualDelta : setRatio

    aspectMethod(state, state.xIsPrimaryAxis, coords, rect)

    if (!state.subStates) { return }

    const correctedRect = extend({}, rect)

    addEdges(state.linkedEdges, correctedRect, { x: coords.x - initialCoords.x, y: coords.y - initialCoords.y })

    const result = setAll({
      ...arg,
      rect: correctedRect,
      edges: state.linkedEdges,
      pageCoords: coords,
      prevCoords: state.prevSubResult.coords,
      prevRect: state.prevSubResult.rect,
      states: state.subStates,
    })

    state.prevSubResult = result

    if (!result.changed) { return }

    const { delta } = result

    // do aspect modification again with critical edge as primary
    aspectMethod(state, Math.abs(delta.x) > Math.abs(delta.y), result.coords, result.rect)
    extend(coords, result.coords)
  },

  defaults: {
    ratio: 'preserve',
    equalDelta: false,
    modifiers: [],
    enabled: false,
  },
}

function setEqualDelta ({ startCoords, edgeSign }: AspectRatioState, xIsPrimaryAxis, coords: Interact.Point) {
  if (xIsPrimaryAxis) {
    coords.y = startCoords.y + (coords.x - startCoords.x) * edgeSign
  }
  else {
    coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign
  }
}

function setRatio ({ startRect, startCoords, ratio, edgeSign }: AspectRatioState, xIsPrimaryAxis, coords: Interact.Point, rect: Interact.Rect) {
  if (xIsPrimaryAxis) {
    const newHeight = rect.width / ratio

    coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign
  }
  else {
    const newWidth = rect.height * ratio

    coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign
  }
}

export default aspectRatio
