// This module adds the options.resize.restrictEdges setting which sets min and
// max width and height for the target being resized.
//
//     interact(target).resizable({
//       restrictEdges: {
//         min: { width: -100, height: -100 },
//         min: { width: -100, height: -100 },
//       }
//     });

const modifiers      = require('./index');
const utils          = require('../utils');
const defaultOptions = require('../defaultOptions');
const resize         = require('../actions/resize');

const noMin = { top: -Infinity, left: -Infinity, bottom: -Infinity, right: -Infinity };
const noMax = { top: +Infinity, left: +Infinity, bottom: +Infinity, right: +Infinity };

const restrictEdges = {
  defaults: {
    enabled: true,
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
    const min = getRestrictionRect(options.min) || noMin;
    const max = getRestrictionRect(options.max) || noMax;
    const offset = interaction.startOffset;

    let restrictedX = page.x;
    let restrictedY = page.y;

    status.dx = 0;
    status.dy = 0;
    status.locked = false;

    if (edges.left) {
      restrictedX = Math.max(Math.min(max.left   - offset.left,   page.x), min.left   + offset.left);
    }
    else if (edges.right) {
      restrictedX = Math.max(Math.min(max.right  - offset.right,  page.x), min.right  + offset.right);
    }
    if (edges.top) {
      restrictedY = Math.max(Math.min(max.top    - offset.top,    page.y), min.top    + offset.top);
    }
    else if (edges.bottom) {
      restrictedY = Math.max(Math.min(max.bottom - offset.bottom, page.y), min.bottom + offset.bottom);
    }

    status.dx = restrictedX - page.x;
    status.dy = restrictedY - page.y;

    status.changed = status.restrictedX !== restrictedX || status.restrictedY !== restrictedY;
    status.locked = !!(status.dx || status.dy);

    status.restrictedX = restrictedX;
    status.restrictedY = restrictedY;

    return status;

    function getRestrictionRect (value) {
      value = utils.getStringOptionResult(value, interaction.element) || value;

      if (utils.isFunction(value)) {
        value = value(interaction.resizeRects.inverted);
      }

      if (utils.isElement(value)) {
        value = utils.getElementRect(value);
      }

      return xywhToTlbr(value);
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

function xywhToTlbr (rect) {
  if (rect && !('left' in rect && 'top' in rect)) {
    rect = utils.extend({}, rect);

    rect.left   = rect.x;
    rect.top    = rect.y;
    rect.right  = rect.x + rect.width;
    rect.bottom = rect.y + rect.height;
  }

  return rect;
}

modifiers.restrictEdges = restrictEdges;
modifiers.names.push('restrictEdges');

defaultOptions.perAction.restrictEdges = restrictEdges.defaults;
resize.defaults.restrictEdges          = restrictEdges.defaults;

module.exports = restrictEdges;
