// This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     min: { top:   0, left:   0, right: 100, bottom: 100 },
//     max: { top: 500, left: 500, right: 600, bottom: 600 },
//   },
// });

const modifiers      = require('./index');
const utils          = require('../utils');
const defaultOptions = require('../defaultOptions');
const resize         = require('../actions/resize');

const noMin = { top: -Infinity, left: -Infinity, bottom: -Infinity, right: -Infinity };
const noMax = { top: +Infinity, left: +Infinity, bottom: +Infinity, right: +Infinity };

const restrictEdges = {
  defaults: {
    enabled: false,
    endOnly: false,
    min: null,
    max: null,
  },

  setOffset: function () {},

  set: function (pageCoords, interaction, status) {
    const target  = interaction.target;
    const options = target && target.options[interaction.prepared.name].restrictEdges;
    const edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

    if (!options.enabled || !edges) {
      return status;
    }

    const page = status.useStatusXY
      ? { x: status.x, y: status.y }
      : utils.extend({}, pageCoords);
    const min = utils.xywhToTlbr(getRestrictionRect(options.min)) || noMin;
    const max = utils.xywhToTlbr(getRestrictionRect(options.max)) || noMax;
    const offset = interaction.startOffset;

    let modifiedX = page.x;
    let modifiedY = page.y;

    status.dx = 0;
    status.dy = 0;
    status.locked = false;

    if (edges.left) {
      modifiedX = Math.max(Math.min(max.left   - offset.left,   page.x), min.left   + offset.left);
    }
    else if (edges.right) {
      modifiedX = Math.max(Math.min(max.right  - offset.right,  page.x), min.right  + offset.right);
    }
    if (edges.top) {
      modifiedY = Math.max(Math.min(max.top    - offset.top,    page.y), min.top    + offset.top);
    }
    else if (edges.bottom) {
      modifiedY = Math.max(Math.min(max.bottom - offset.bottom, page.y), min.bottom + offset.bottom);
    }

    status.dx = modifiedX - page.x;
    status.dy = modifiedY - page.y;

    status.changed = status.modifiedX !== modifiedX || status.modifiedY !== modifiedY;
    status.locked = !!(status.dx || status.dy);

    status.modifiedX = modifiedX;
    status.modifiedY = modifiedY;

    return status;

    function getRestrictionRect (value) {
      value = utils.getStringOptionResult(value, interaction.element) || value;

      if (utils.isFunction(value)) {
        value = value(interaction.resizeRects.inverted);
      }

      if (utils.isElement(value)) {
        value = utils.getElementRect(value);
      }

      return value;
    }
  },

  reset: function (status) {
    status.dx = status.dy = 0;
    status.modifiedX = status.modifiedY = NaN;
    status.locked = false;
    status.changed = true;

    return status;
  },

  modifyCoords: function (page, client, interactable, status, actionName, phase) {
    const options = interactable.options[actionName].restrictEdges;

    if (options && options.enabled
        && !(phase === 'start' && status.locked)) {

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
  },
};

modifiers.restrictEdges = restrictEdges;
modifiers.names.push('restrictEdges');

defaultOptions.perAction.restrictEdges = restrictEdges.defaults;
resize.defaults.restrictEdges          = restrictEdges.defaults;

module.exports = restrictEdges;
