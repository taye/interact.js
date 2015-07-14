'use strict';

var modifiers = require('./index'),
    utils = require('../utils');

var restrict = {
    options: {
        enabled    : false,
        endOnly    : false,
        restriction: null,
        elementRect: null
    },
    shouldDo: function (interactable, actionName, preEnd, requireEndOnly) {
        var restrict = interactable.options[actionName].restrict;

        return restrict && restrict.enabled && (preEnd || !restrict.endOnly) && (!requireEndOnly || restrict.endOnly);
    },
    set: function (pageCoords, interaction, status) {
        var target = interaction.target,
            restrict = target && target.options[interaction.prepared.name].restrict,
            restriction = restrict && restrict.restriction,
            page;

        if (!restriction) {
            return status;
        }

        page = status.useStatusXY
            ? page = { x: status.x, y: status.y }
            : page = utils.extend({}, pageCoords);

        page.x -= interaction.inertiaStatus.resumeDx;
        page.y -= interaction.inertiaStatus.resumeDy;

        status.dx = 0;
        status.dy = 0;
        status.locked = false;

        var rect, restrictedX, restrictedY;

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

        var offset = interaction.restrictOffset;

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
        var options = interactable.options[actionName].restrict,
            elementRect = options && options.elementRect;

        if (modifiers.restrict.shouldDo(interactable, actionName)
            && !(phase === 'start' && elementRect && status.locked)) {

            if (status.locked) {
                page.x += status.dx;
                page.y += status.dy;
                client.x += status.dx;
                client.y += status.dy;

                return {
                    dx: status.dx,
                    dy: status.dy
                };
            }
        }
    }
};

modifiers.restrict = restrict;
modifiers.names.push('restrict');

module.exports = restrict;

