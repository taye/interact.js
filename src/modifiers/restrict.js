const modifiers      = require('./index');
const utils          = require('../utils');
const defaultOptions = require('../defaultOptions');

const restrict = {
  defaults: {
    enabled    : false,
    endOnly    : false,
    restriction: null,
    elementRect: null,
  },

  setOffset: function (interaction, interactable, element, rect, startOffset) {
    const elementRect = interactable.options[interaction.prepared.name].restrict.elementRect;
    const offset = {};

    if (rect && elementRect) {
      offset.left = startOffset.left - (rect.width  * elementRect.left);
      offset.top  = startOffset.top  - (rect.height * elementRect.top);

      offset.right  = startOffset.right  - (rect.width  * (1 - elementRect.right));
      offset.bottom = startOffset.bottom - (rect.height * (1 - elementRect.bottom));
    }
    else {
      offset.left = offset.top = offset.right = offset.bottom = 0;
    }

    return offset;
  },

  set: function (pageCoords, interaction, status) {
    const target    = interaction.target;
    const restrictOptions  = target && target.options[interaction.prepared.name].restrict;
    let restriction = restrictOptions && restrictOptions.restriction;

    if (!restriction) {
      return status;
    }

    const page = status.useStatusXY
      ? { x: status.x, y: status.y }
      : utils.extend({}, pageCoords);

    status.dx = 0;
    status.dy = 0;
    status.locked = false;

    if (utils.isString(restriction)) {
      if (restriction === 'parent') {
        restriction = utils.parentNode(interaction.element);
      }
      else if (restriction === 'self') {
        restriction = target.getRect(interaction.element);
      }
      else {
        restriction = utils.closest(interaction.element, restriction);
      }

      if (!restriction) { return status; }
    }

    if (utils.isFunction(restriction)) {
      restriction = restriction(page.x, page.y, interaction.element);
    }

    if (utils.isElement(restriction)) {
      restriction = utils.getElementRect(restriction);
    }

    const rect = restriction;
    let modifiedX;
    let modifiedY;

    const offset = interaction.modifierOffsets.restrict;

    if (!restriction) {
      modifiedX = page.x;
      modifiedY = page.y;
    }
    // object is assumed to have
    // x, y, width, height or
    // left, top, right, bottom
    else if ('x' in restriction && 'y' in restriction) {
      modifiedX = Math.max(Math.min(rect.x + rect.width  - offset.right , page.x), rect.x + offset.left);
      modifiedY = Math.max(Math.min(rect.y + rect.height - offset.bottom, page.y), rect.y + offset.top );
    }
    else {
      modifiedX = Math.max(Math.min(rect.right  - offset.right , page.x), rect.left + offset.left);
      modifiedY = Math.max(Math.min(rect.bottom - offset.bottom, page.y), rect.top  + offset.top );
    }

    status.dx = modifiedX - page.x;
    status.dy = modifiedY - page.y;

    status.changed = status.modifiedX !== modifiedX || status.modifiedY !== modifiedY;
    status.locked = !!(status.dx || status.dy);

    status.modifiedX = modifiedX;
    status.modifiedY = modifiedY;

    return status;
  },

  reset: function (status) {
    status.dx = status.dy = 0;
    status.modifiedX = status.modifiedY = NaN;
    status.locked = false;
    status.changed = true;

    return status;
  },

  modifyCoords: function (page, client, interactable, status, actionName, phase) {
    const options = interactable.options[actionName].restrict;
    const elementRect = options && options.elementRect;

    if (options && options.enabled
        && !(phase === 'start' && elementRect && status.locked)) {

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

modifiers.restrict = restrict;
modifiers.names.push('restrict');

defaultOptions.perAction.restrict = restrict.defaults;

module.exports = restrict;
