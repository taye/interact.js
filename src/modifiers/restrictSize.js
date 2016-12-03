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

  setOffset: function () {},

  set: function (pageCoords, interaction, status) {
    if (!interaction.interacting()) {
      return status;
    }

    const target  = interaction.target;
    const options = target && target.options[interaction.prepared.name].restrictSize;
    const edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

    if (!options.enabled || !edges) {
      return status;
    }

    const rect = rectUtils.xywhToTlbr(interaction.resizeRects.inverted);

    const minSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.min, interaction)) || noMin;
    const maxSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.max, interaction)) || noMax;

    status.options = {
      enabled: options.enabled,
      endOnly: options.endOnly,
      min: utils.extend({}, restrictEdges.noMin),
      max: utils.extend({}, restrictEdges.noMax),
    };

    if (edges.top) {
      status.options.min.top = rect.bottom - maxSize.height;
      status.options.max.top = rect.bottom - minSize.height;
    }
    else if (edges.bottom) {
      status.options.min.bottom = rect.top + minSize.height;
      status.options.max.bottom = rect.top + maxSize.height;
    }
    if (edges.left) {
      status.options.min.left = rect.right - maxSize.width;
      status.options.max.left = rect.right - minSize.width;
    }
    else if (edges.right) {
      status.options.min.right = rect.left + minSize.width;
      status.options.max.right = rect.left + maxSize.width;
    }

    return restrictEdges.set(pageCoords, interaction, status);
  },

  reset: restrictEdges.reset,

  modifyCoords: restrictEdges.modifyCoords,
};

modifiers.restrictSize = restrictSize;
modifiers.names.push('restrictSize');

defaultOptions.perAction.restrictSize = restrictSize.defaults;
resize.defaults.restrictSize          = restrictSize.defaults;

module.exports = restrictSize;
