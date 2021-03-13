/**
 * @module modifiers/snapEdges
 *
 * @description
 * WOW> This module allows snapping of the edges of targets during resize
 * interactions.
 *
 * ```js
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
 *   },
 * })
 *
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [
 *       interact.snappers.grid({
 *        top: 50,
 *        left: 50,
 *        bottom: 100,
 *        right: 100,
 *       }),
 *     ],
 *   },
 * })
 * ```
 */

import clone from '@interactjs/utils/clone'
import extend from '@interactjs/utils/extend'

import type { ModifierArg, ModifierModule } from '../base'
import { makeModifier } from '../base'

import type { SnapOptions, SnapState } from './pointer'
import { snapSize } from './size'

export type SnapEdgesOptions = Pick<SnapOptions, 'targets' | 'range' | 'offset' | 'endOnly' | 'enabled'>

function start (arg: ModifierArg<SnapState>) {
  const { edges } = arg

  if (!edges) {
    return null
  }

  arg.state.targetFields = arg.state.targetFields || [
    [edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom'],
  ]

  return snapSize.start(arg)
}

const snapEdges: ModifierModule<SnapEdgesOptions, SnapState, ReturnType<typeof snapSize.set>> = {
  start,
  set: snapSize.set,
  defaults: extend(clone(snapSize.defaults), {
    targets: null,
    range: null,
    offset: { x: 0, y: 0 },
  } as const),
}

export default makeModifier(snapEdges, 'snapEdges')
export { snapEdges }
