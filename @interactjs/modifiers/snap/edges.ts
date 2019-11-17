/**
 * @module modifiers/snapEdges
 *
 * @description
 * This module allows snapping of the edges of targets during resize
 * interactions.
 *
 * @example
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
 */

import clone from '../../utils/clone'
import extend from '../../utils/extend'
import { ModifierArg } from '../base'
import { SnapState } from './pointer'
import snapSize, { SnapSizeOptions } from './size'

function start (arg: ModifierArg<SnapState>) {
  const { edges } = arg.interaction.prepared

  if (!edges) { return null }

  arg.state.targetFields = arg.state.targetFields || [
    [edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom'],
  ]

  return snapSize.start(arg)
}

function set (arg) {
  return snapSize.set(arg)
}

const snapEdges = {
  start,
  set,
  defaults: extend(clone(snapSize.defaults) as SnapSizeOptions, {
    offset: { x: 0, y: 0 },
  } as unknown),
}

export default snapEdges
