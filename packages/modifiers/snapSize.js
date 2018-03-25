// This module allows snapping of the size of targets during resize
// interactions.

import extend from '@interactjs/utils/extend';
import * as is from '@interactjs/utils/is';
import snap from './snap';

function init (scope) {
  const {
    modifiers,
    defaults,
  } = scope;

  modifiers.snapSize = snapSize;
  modifiers.names.push('snapSize');

  defaults.perAction.snapSize = snapSize.defaults;
}

function start (arg) {
  const { interaction, status, options } = arg;
  const edges = interaction.prepared.edges;

  if (!edges) { return null; }

  arg.options = {
    relativePoints: [{
      x: edges.left? 0 : 1,
      y: edges.top ? 0 : 1,
    }],
    origin: { x: 0, y: 0 },
    offset: options.offset || 'self',
    range: options.range,
  };

  status.targetFields = status.targetFields || [
    ['width', 'height'],
    ['x', 'y'],
  ];

  const offsets = snap.start(arg);
  arg.options = options;

  return offsets;
}

function set (arg) {
  const { interaction, status, options, offset, modifiedCoords } = arg;
  const relative = {
    x: modifiedCoords.x - offset[0].x,
    y: modifiedCoords.y - offset[0].y,
  };

  arg.options = extend({}, options);
  arg.options.targets = [];

  for (const snapTarget of (options.targets || [])) {
    let target;

    if (is.func(snapTarget)) {
      target = snapTarget(relative.x, relative.y, interaction);
    }
    else {
      target = snapTarget;
    }

    if (!target) { continue; }

    for (const [xField, yField] of status.targetFields) {
      if (xField in target || yField in target) {
        target.x = target[xField];
        target.y = target[yField];

        break;
      }
    }

    arg.options.targets.push(target);
  }

  snap.set(arg);
}

const snapSize = {
  init,
  start,
  set,
  defaults: {
    enabled: false,
    endOnly: false,
    range  : Infinity,
    targets: null,
    offset: null,
    offsets: null,
  },
};

export default snapSize;
