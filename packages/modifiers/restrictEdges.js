// This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// });

import extend from '@interactjs/utils/extend';
import rectUtils from '@interactjs/utils/rect';
import restrict from './restrict';

const { getRestrictionRect } = restrict;
const noInner = { top: +Infinity, left: +Infinity, bottom: -Infinity, right: -Infinity };
const noOuter = { top: -Infinity, left: -Infinity, bottom: +Infinity, right: +Infinity };

function start ({ interaction, status }) {
  const { options } = status;
  const startOffset = interaction.modifiers.startOffset;
  let offset;

  if (options) {
    const offsetRect = getRestrictionRect(options.offset, interaction, interaction.coords.start.page);

    offset = rectUtils.rectToXY(offsetRect);
  }

  offset = offset || { x: 0, y: 0 };

  status.offset = {
    top:    offset.y + startOffset.top,
    left:   offset.x + startOffset.left,
    bottom: offset.y - startOffset.bottom,
    right:  offset.x - startOffset.right,
  };
}

function set ({ modifiedCoords, interaction, status, phase }) {
  const { offset, options } = status;
  const edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges || phase === 'start') {
    return;
  }

  const page = extend({}, modifiedCoords);
  const inner = getRestrictionRect(options.inner, interaction, page) || {};
  const outer = getRestrictionRect(options.outer, interaction, page) || {};

  fixRect(inner, noInner);
  fixRect(outer, noOuter);

  let modifiedX = page.x;
  let modifiedY = page.y;

  status.delta.x = 0;
  status.delta.y = 0;

  if (edges.top) {
    modifiedY = Math.min(Math.max(outer.top    + offset.top,    page.y), inner.top    + offset.top);
  }
  else if (edges.bottom) {
    modifiedY = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
  }
  if (edges.left) {
    modifiedX = Math.min(Math.max(outer.left   + offset.left,   page.x), inner.left   + offset.left);
  }
  else if (edges.right) {
    modifiedX = Math.max(Math.min(outer.right  + offset.right,  page.x), inner.right  + offset.right);
  }

  status.delta.x = modifiedX - page.x;
  status.delta.y = modifiedY - page.y;
}

function fixRect (rect, defaults) {
  for (const edge of ['top', 'left', 'bottom', 'right']) {
    if (!(edge in rect)) {
      rect[edge] = defaults[edge];
    }
  }

  return rect;
}

const restrictEdges = {
  noInner,
  noOuter,
  getRestrictionRect,
  start,
  set,
  defaults: {
    enabled: false,
    endOnly: false,
    inner: null,
    outer: null,
    offset: null,
  },
};

export default restrictEdges;
