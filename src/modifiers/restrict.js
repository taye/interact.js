const modifiers = require('./base');
const utils = require('../utils');
const defaultOptions = require('../defaultOptions');

const restrict = {
  defaults: {
    enabled    : false,
    endOnly    : false,
    restriction: null,
    elementRect: null,
  },

  shouldDo: function (interactable, actionName, preEnd, requireEndOnly) {
    const restrictOptions = interactable.options[actionName].restrict;

    return (restrictOptions && restrictOptions.enabled
            && (preEnd || !restrictOptions.endOnly)
            && (!requireEndOnly || restrictOptions.endOnly));
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

    page.x -= interaction.inertiaStatus.resumeDx;
    page.y -= interaction.inertiaStatus.resumeDy;

    status.dx = 0;
    status.dy = 0;
    status.locked = false;

    let rect;
    let restrictedX;
    let restrictedY;

    if (utils.isString(restriction)) {
      if (restriction === 'parent') {
        restriction = utils.parentElement(interaction.element);
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

    rect = restriction;

    const offset = interaction.modifierOffsets.restrict;

    if (!restriction) {
      restrictedX = page.x;
      restrictedY = page.y;
    }
    // object is assumed to have
    // x, y, width, height or
    // left, top, right, bottom
    else if ('x' in restriction && 'y' in restriction) {
      restrictedX = Math.max(Math.min(rect.x + rect.width  - offset.right , page.x), rect.x + offset.left);
      restrictedY = Math.max(Math.min(rect.y + rect.height - offset.bottom, page.y), rect.y + offset.top );
    }
    else {
      restrictedX = Math.max(Math.min(rect.right  - offset.right , page.x), rect.left + offset.left);
      restrictedY = Math.max(Math.min(rect.bottom - offset.bottom, page.y), rect.top  + offset.top );
    }

    status.dx = restrictedX - page.x;
    status.dy = restrictedY - page.y;

    status.changed = status.restrictedX !== restrictedX || status.restrictedY !== restrictedY;
    status.locked = !!(status.dx || status.dy);

    status.restrictedX = restrictedX;
    status.restrictedY = restrictedY;

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

    if (modifiers.restrict.shouldDo(interactable, actionName)
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
