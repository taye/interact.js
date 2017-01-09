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

const modifiers      = require('./index');
const restrictEdges  = require('./restrictEdges');
const utils          = require('../utils');
const rectUtils      = require('../utils/rect');
const defaultOptions = require('../defaultOptions');
const resize         = require('../actions/resize');

const noMin = { width: -Infinity, height: -Infinity };
const noMax = { width: +Infinity, height: +Infinity };

const restrictSize = {
  defaults: {
    enabled: false,
    endOnly: false,
    min: null,
    max: null,
  },

  setOffset: function ({ interaction }) {
    return interaction.startOffset;
  },

  set: function (arg) {
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
      min: utils.extend({}, restrictEdges.noMin),
      max: utils.extend({}, restrictEdges.noMax),
    };

    if (edges.top) {
      arg.options.min.top = rect.bottom - maxSize.height;
      arg.options.max.top = rect.bottom - minSize.height;
    }
    else if (edges.bottom) {
      arg.options.min.bottom = rect.top + minSize.height;
      arg.options.max.bottom = rect.top + maxSize.height;
    }
    if (edges.left) {
      arg.options.min.left = rect.right - maxSize.width;
      arg.options.max.left = rect.right - minSize.width;
    }
    else if (edges.right) {
      arg.options.min.right = rect.left + minSize.width;
      arg.options.max.right = rect.left + maxSize.width;
    }

    return restrictEdges.set(arg);
  },

  modifyCoords: restrictEdges.modifyCoords,
};

modifiers.restrictSize = restrictSize;
modifiers.names.push('restrictSize');

defaultOptions.perAction.restrictSize = restrictSize.defaults;
resize.defaults.restrictSize          = restrictSize.defaults;

module.exports = restrictSize;
