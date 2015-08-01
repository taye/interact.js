'use strict';

var modifiers = require('./index'),
    scope = require('../scope'),
    interact = require('../interact'),
    utils = require('../utils');
    //defaultOptions = require('../defaultOptions');

var snap = {
    options: {
        enabled: false,
        endOnly: false,
        range  : Infinity,
        targets: null,
        offsets: null,

        relativePoints: null
    },
    shouldDo: function (interactable, actionName, preEnd, requireEndOnly) {
        var snap = interactable.options[actionName].snap;

        return snap && snap.enabled && (preEnd || !snap.endOnly) && (!requireEndOnly || snap.endOnly);
    },

    setOffset: function (interaction, interactable, element, rect, startOffset) {
        var offsets = [],
            origin = scope.getOriginXY(interactable, element),
            snapOffset = (snap && snap.offset === 'startCoords'
                ? {
                    x: interaction.startCoords.page.x - origin.x,
                    y: interaction.startCoords.page.y - origin.y
                }
                : snap && snap.offset || { x: 0, y: 0 });

        if (rect && snap && snap.relativePoints && snap.relativePoints.length) {
            for (var i = 0; i < snap.relativePoints.length; i++) {
                offsets.push({
                    x: startOffset.left - (rect.width  * snap.relativePoints[i].x) + snapOffset.x,
                    y: startOffset.top  - (rect.height * snap.relativePoints[i].y) + snapOffset.y
                });
            }
        }
        else {
            offsets.push(snapOffset);
        }

        return offsets;
    },

    set: function (pageCoords, interaction, status) {
        var snap = interaction.target.options[interaction.prepared.name].snap,
            targets = [],
            target,
            page,
            i;

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

        page.x -= interaction.inertiaStatus.resumeDx;
        page.y -= interaction.inertiaStatus.resumeDy;

        var len = snap.targets? snap.targets.length : 0,
            offsets = interaction.modifierOffsets.snap;

        for (var relIndex = 0; relIndex < offsets.length; relIndex++) {
            var relative = {
                x: page.x - offsets[relIndex].x,
                y: page.y - offsets[relIndex].y
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
                    x: utils.isNumber(target.x) ? (target.x + offsets[relIndex].x) : relative.x,
                    y: utils.isNumber(target.y) ? (target.y + offsets[relIndex].y) : relative.y,

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

    reset: function (status) {
        status.dx = status.dy = 0;
        status.snappedX = status.snappedY = NaN;
        status.locked = false;
        status.changed = true;

        return status;
    },

    modifyCoords: function (page, client, interactable, status, actionName, phase) {
        var snap = interactable.options[actionName].snap,
            relativePoints = snap && snap.relativePoints;

        if (snap && snap.enabled
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

interact.createSnapGrid = function (grid) {
    return function (x, y) {
        var offsetX = 0,
            offsetY = 0;

        if (utils.isObject(grid.offset)) {
            offsetX = grid.offset.x;
            offsetY = grid.offset.y;
        }

        var gridx = Math.round((x - offsetX) / grid.x),
            gridy = Math.round((y - offsetY) / grid.y),

            newX = gridx * grid.x + offsetX,
            newY = gridy * grid.y + offsetY;

        return {
            x: newX,
            y: newY,
            range: grid.range
        };
    };
};

module.exports = snap;
