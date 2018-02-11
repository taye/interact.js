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

const extend = require('../utils/extend');
const rectUtils = require('../utils/rect');
const restrict = require('./restrict');

const { getRestrictionRect } = restrict;
const noInner = { top: +Infinity, left: +Infinity, bottom: -Infinity, right: -Infinity };
const noOuter = { top: -Infinity, left: -Infinity, bottom: +Infinity, right: +Infinity };

function init (scope) {
  const {
    modifiers,
    defaults,
    actions,
  } = scope;

  const { resize } = actions;

  modifiers.restrictEdges = module.exports;
  modifiers.names.push('restrictEdges');

  defaults.perAction.restrictEdges = module.exports.defaults;
  resize.defaults.restrictEdges = module.exports.defaults;
}

function setOffset ({ interaction, options }) {
  const startOffset = interaction.startOffset;
  let offset;

  if (options) {
    const offsetRect = getRestrictionRect(options.offset, interaction, interaction.startCoords.page);

    offset = rectUtils.rectToXY(offsetRect);
  }

  offset = offset || { x: 0, y: 0 };

  return {
    top:    offset.y + startOffset.top,
    left:   offset.x + startOffset.left,
    bottom: offset.y - startOffset.bottom,
    right:  offset.x - startOffset.right,
  };
}

function set ({ modifiedCoords, interaction, status, offset, options }) {
  const edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges) {
    return;
  }

  const page = extend({}, modifiedCoords);
  const inner = getRestrictionRect(options.inner, interaction, page) || {};
  const outer = getRestrictionRect(options.outer, interaction, page) || {};

  fixRect(inner, noInner);
  fixRect(outer, noOuter);

  let modifiedX = page.x;
  let modifiedY = page.y;

  status.dx = 0;
  status.dy = 0;
  status.locked = false;

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

  status.dx = modifiedX - page.x;
  status.dy = modifiedY - page.y;

  status.changed = status.modifiedX !== modifiedX || status.modifiedY !== modifiedY;
  status.locked = !!(status.dx || status.dy);

  status.modifiedX = modifiedX;
  status.modifiedY = modifiedY;
}

function modifyCoords ({ page, client, status, phase, options }) {
  if (options && options.enabled && phase !== 'start') {

    if (status.locked) {
      page.x += status.dx;
      page.y += status.dy;
      client.x += status.dx;
      client.y += status.dy;

      return {
        dx: status.dx,
        dy: status.dy,
      };
    }
  }
}

function fixRect (rect, defaults) {
  for (const edge of ['top', 'left', 'bottom', 'right']) {
    if (!(edge in rect)) {
      rect[edge] = defaults[edge];
    }
  }

  return rect;
}

module.exports = {
  init,
  noInner,
  noOuter,
  getRestrictionRect,
  setOffset,
  set,
  modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    inner: null,
    outer: null,
    offset: null,
  },
};
