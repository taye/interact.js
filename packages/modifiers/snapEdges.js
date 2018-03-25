// This module allows snapping of the edges of targets during resize
// interactions.

import clone from '@interactjs/utils/clone';
import extend from '@interactjs/utils/extend';
import snapSize from './snapSize';

function init (scope) {
  const {
    modifiers,
    defaults,
  } = scope;

  modifiers.snapEdges = snapEdges;
  modifiers.names.push('snapEdges');

  defaults.perAction.snapEdges = snapEdges.defaults;
}

function start (arg) {
  const edges = arg.interaction.prepared.edges;

  if (!edges) { return null; }

  arg.status.targetFields = arg.status.targetFields || [
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
  init,
  start,
  set,
  modifyCoords,
  defaults: extend(clone(snapSize.defaults), {
    offset: { x: 0, y: 0 },
  }),
};

export default snapEdges;
