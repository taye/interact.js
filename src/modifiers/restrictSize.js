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

const extend = require('../utils/extend');
const rectUtils = require('../utils/rect');
const restrictEdges = require('./restrictEdges');

const noMin = { width: -Infinity, height: -Infinity };
const noMax = { width: +Infinity, height: +Infinity };

function init (scope) {
  const {
    actions,
    modifiers,
    defaults,
  } = scope;

  const { resize } = actions;

  modifiers.restrictSize = module.exports;
  modifiers.names.push('restrictSize');

  defaults.perAction.restrictSize = module.exports.defaults;
  resize.defaults.restrictSize = module.exports.defaults;
}

function setOffset ({ interaction }) {
  return interaction.startOffset;
}

function set (arg) {
  const { interaction, options } = arg;
  const edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges) {
    return;
  }

  const rect = rectUtils.xywhToTlbr(interaction.resizeRects.inverted);

  const minSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.min, interaction)) || noMin;
  const maxSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.max, interaction)) || noMax;

  arg.options = {
    enabled: options.enabled,
    endOnly: options.endOnly,
    inner: extend({}, restrictEdges.noInner),
    outer: extend({}, restrictEdges.noOuter),
  };

  if (edges.top) {
    arg.options.inner.top = rect.bottom - minSize.height;
    arg.options.outer.top = rect.bottom - maxSize.height;
  }
  else if (edges.bottom) {
    arg.options.inner.bottom = rect.top + minSize.height;
    arg.options.outer.bottom = rect.top + maxSize.height;
  }
  if (edges.left) {
    arg.options.inner.left = rect.right - minSize.width;
    arg.options.outer.left = rect.right - maxSize.width;
  }
  else if (edges.right) {
    arg.options.inner.right = rect.left + minSize.width;
    arg.options.outer.right = rect.left + maxSize.width;
  }

  restrictEdges.set(arg);
}

module.exports = {
  init,
  setOffset,
  set,
  modifyCoords: restrictEdges.modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    min: null,
    max: null,
  },
};
