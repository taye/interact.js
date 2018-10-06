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
 * });
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
 * });
 */

import clone from '@interactjs/utils/clone';
import extend from '@interactjs/utils/extend';
import snapSize from './size';

function install (scope) {
  const {
    defaults,
  } = scope;

  defaults.perAction.snapEdges = snapEdges.defaults;
}

function start (arg) {
  const edges = arg.interaction.prepared.edges;

  if (!edges) { return null; }

  arg.state.targetFields = arg.state.targetFields || [
    [edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom'],
  ];

  return snapSize.start(arg);
}

function set (arg) {
  return snapSize.set(arg);
}

function modifyCoords (arg) {
  snapSize.modifyCoords(arg);
}

const snapEdges = {
  install,
  start,
  set,
  modifyCoords,
  defaults: extend(clone(snapSize.defaults), {
    offset: { x: 0, y: 0 },
  }),
};

export default snapEdges;
