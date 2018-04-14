// This module adds the options.resize.restrictSize setting which sets min and
// max width and height for the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictSize: {
//     min: { width: -600, height: -600 },
//     max: { width:  600, height:  600 },
//   },
// });

import extend from '@interactjs/utils/extend';
import rectUtils from '@interactjs/utils/rect';
import restrictEdges from './restrictEdges';

const noMin = { width: -Infinity, height: -Infinity };
const noMax = { width: +Infinity, height: +Infinity };

function start (arg) {
  return restrictEdges.start(arg);
}

function set (arg) {
  const { interaction, phase, status } = arg;
  const { options } = status;
  const edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges || phase === 'start') {
    return;
  }

  const rect = rectUtils.xywhToTlbr(interaction.resizeRects.inverted);

  const minSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.min, interaction)) || noMin;
  const maxSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.max, interaction)) || noMax;

  status.options = {
    enabled: options.enabled,
    endOnly: options.endOnly,
    inner: extend({}, restrictEdges.noInner),
    outer: extend({}, restrictEdges.noOuter),
  };

  if (edges.top) {
    status.options.inner.top = rect.bottom - minSize.height;
    status.options.outer.top = rect.bottom - maxSize.height;
  }
  else if (edges.bottom) {
    status.options.inner.bottom = rect.top + minSize.height;
    status.options.outer.bottom = rect.top + maxSize.height;
  }
  if (edges.left) {
    status.options.inner.left = rect.right - minSize.width;
    status.options.outer.left = rect.right - maxSize.width;
  }
  else if (edges.right) {
    status.options.inner.right = rect.left + minSize.width;
    status.options.outer.right = rect.left + maxSize.width;
  }

  restrictEdges.set(arg);

  status.options = options;
}

const restrictSize = {
  start,
  set,
  defaults: {
    min: null,
    max: null,
  },
};

export default restrictSize;
