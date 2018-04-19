// This module allows snapping of the size of targets during resize
// interactions.

import extend from '@interactjs/utils/extend';
import * as is from '@interactjs/utils/is';
import snap from './snap';

function start (arg) {
  const { interaction, status } = arg;
  const { options } = status;
  const edges = interaction.prepared.edges;

  if (!edges) { return null; }

  arg.status = {
    options: {
      relativePoints: [{
        x: edges.left? 0 : 1,
        y: edges.top ? 0 : 1,
      }],
      origin: { x: 0, y: 0 },
      offset: options.offset || 'self',
      range: options.range,
    },
  };

  status.targetFields = status.targetFields || [
    ['width', 'height'],
    ['x', 'y'],
  ];

  snap.start(arg);
  status.offset = arg.status.offset;

  arg.status = status;
}

function set (arg) {
  const { interaction, status, coords } = arg;
  const { options, offset } = status;
  const relative = {
    x: coords.x - offset[0].x,
    y: coords.y - offset[0].y,
  };

  status.options = extend({}, options);
  status.options.targets = [];

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

    status.options.targets.push(target);
  }

  snap.set(arg);

  status.options = options;
}

const snapSize = {
  start,
  set,
  defaults: {
    range  : Infinity,
    targets: null,
    offset: null,
    offsets: null,
  },
};

export default snapSize;
