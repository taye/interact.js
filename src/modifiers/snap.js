'use strict';

var modifiers = require('./index'),
    scope = require('../scope'),
    utils = require('../utils');
    //defaultOptions = require('../defaultOptions');

var snap = {
    options: {
        enabled     : false,
        endOnly     : false,
        range       : Infinity,
        targets     : null,
        offsets     : null,

        relativePoints: null
    },
    shouldDo: function (interactable, actionName, preEnd) {
        var options = interactable.options;

        return (options[actionName].snap
                && options[actionName].snap.enabled
                && (preEnd || !interactable.options[actionName].snap.endOnly));
    },
    set: function (pageCoords, interaction, status) {
        var snap = interaction.target.options[interaction.prepared.name].snap,
            targets = [],
            target,
            page,
            i;

        status = status || interaction.snapStatus;

        if (status.useStatusXY) {
            page = { x: status.x, y: status.y };
        }
        else {
            var origin = scope.getOriginXY(interaction.target, interaction.element);

            page = utils.extend({}, pageCoords);

            page.x -= origin.x;
            page.y -= origin.y;
        }

        status.realX = page.x;
        status.realY = page.y;

        page.x = page.x - interaction.inertiaStatus.resumeDx;
        page.y = page.y - interaction.inertiaStatus.resumeDy;

        var len = snap.targets? snap.targets.length : 0;

        for (var relIndex = 0; relIndex < interaction.snapOffsets.length; relIndex++) {
            var relative = {
                x: page.x - interaction.snapOffsets[relIndex].x,
                y: page.y - interaction.snapOffsets[relIndex].y
            };

            for (i = 0; i < len; i++) {
                if (utils.isFunction(snap.targets[i])) {
                    target = snap.targets[i](relative.x, relative.y, interaction);
                }
                else {
                    target = snap.targets[i];
                }

                if (!target) { continue; }

                targets.push({
                    x: utils.isNumber(target.x) ? (target.x + interaction.snapOffsets[relIndex].x) : relative.x,
                    y: utils.isNumber(target.y) ? (target.y + interaction.snapOffsets[relIndex].y) : relative.y,

                    range: utils.isNumber(target.range)? target.range: snap.range
                });
            }
        }

        var closest = {
            target: null,
            inRange: false,
            distance: 0,
            range: 0,
            dx: 0,
            dy: 0
        };

        for (i = 0, len = targets.length; i < len; i++) {
            target = targets[i];

            var range = target.range,
                dx = target.x - page.x,
                dy = target.y - page.y,
                distance = utils.hypot(dx, dy),
                inRange = distance <= range;

            // Infinite targets count as being out of range
            // compared to non infinite ones that are in range
            if (range === Infinity && closest.inRange && closest.range !== Infinity) {
                inRange = false;
            }

            if (!closest.target || (inRange
                    // is the closest target in range?
                    ? (closest.inRange && range !== Infinity
                    // the pointer is relatively deeper in this target
                    ? distance / range < closest.distance / closest.range
                    // this target has Infinite range and the closest doesn't
                    : (range === Infinity && closest.range !== Infinity)
                    // OR this target is closer that the previous closest
                || distance < closest.distance)
                    // The other is not in range and the pointer is closer to this target
                    : (!closest.inRange && distance < closest.distance))) {

                if (range === Infinity) {
                    inRange = true;
                }

                closest.target = target;
                closest.distance = distance;
                closest.range = range;
                closest.inRange = inRange;
                closest.dx = dx;
                closest.dy = dy;

                status.range = range;
            }
        }

        var snapChanged;

        if (closest.target) {
            snapChanged = (status.snappedX !== closest.target.x || status.snappedY !== closest.target.y);

            status.snappedX = closest.target.x;
            status.snappedY = closest.target.y;
        }
        else {
            snapChanged = true;

            status.snappedX = NaN;
            status.snappedY = NaN;
        }

        status.dx = closest.dx;
        status.dy = closest.dy;

        status.changed = (snapChanged || (closest.inRange && !status.locked));
        status.locked = closest.inRange;

        return status;
    },

    modifyCoords: function (page, client, interactable, status, actionName, phase) {
        var relativePoints = interactable.options[actionName].snap && interactable.options.relativePoints;

        if (modifiers.snap.shouldDo(interactable, actionName)
            && !(phase === 'start' && relativePoints && relativePoints.length)) {

            if (status.locked) {
                page.x += status.dx;
                page.y += status.dy;
                client.x += status.dx;
                client.y += status.dy;
            }

            return {
                range  : status.range,
                locked : status.locked,
                x      : status.snappedX,
                y      : status.snappedY,
                realX  : status.realX,
                realY  : status.realY,
                dx     : status.dx,
                dy     : status.dy
            };
        }
    }
};

modifiers.snap = snap;
modifiers.names.push('snap');

module.exports = snap;
