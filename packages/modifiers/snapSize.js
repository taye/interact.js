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
  const { interaction, options } = arg;
  const edges = interaction.prepared.edges;

  if (!edges) { return; }

  arg.options = {
    relativePoints: [{
      x: edges.left? 0 : 1,
      y: edges.top ? 0 : 1,
    }],
    origin: { x: 0, y: 0 },
    offset: 'self',
    range: options.range,
  };

  const offsets = snap.start(arg);
  arg.options = options;

  return offsets;
}

function set (arg) {
  const { interaction, options, offset, modifiedCoords } = arg;
  const page = extend({}, modifiedCoords);
  const relativeX = page.x - offset[0].x;
  const relativeY = page.y - offset[0].y;

  arg.options = extend({}, options);
  arg.options.targets = [];

  for (const snapTarget of (options.targets || [])) {
    let target;

    if (is.func(snapTarget)) {
      target = snapTarget(relativeX, relativeY, interaction);
    }
    else {
      target = snapTarget;
    }

    if (!target) { continue; }

    if ('width' in target && 'height' in target) {
      target.x = target.width;
      target.y = target.height;
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
    offsets: null,
  },
};

export default snapSize;
