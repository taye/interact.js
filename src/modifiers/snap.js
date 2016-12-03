const modifiers      = require('./index');
const interact       = require('../interact');
const utils          = require('../utils');
const defaultOptions = require('../defaultOptions');

const snap = {
  defaults: {
    enabled: false,
    endOnly: false,
    range  : Infinity,
    targets: null,
    offsets: null,

    relativePoints: null,
  },

  setOffset: function (interaction, interactable, element, rect, startOffset) {
    const offsets = [];
    const origin = utils.getOriginXY(interactable, element, interaction.prepared.name);
    const snapOptions = interactable.options[interaction.prepared.name].snap || {};
    let snapOffset;

    if (snapOptions.offset === 'startCoords') {
      snapOffset = {
        x: interaction.startCoords.page.x - origin.x,
        y: interaction.startCoords.page.y - origin.y,
      };
    }
    else if (snapOptions.offset === 'self') {
      snapOffset = {
        x: rect.left - origin.x,
        y: rect.top - origin.y,
      };
    }
    else {
      snapOffset = snapOptions.offset || { x: 0, y: 0 };
    }

    if (rect && snapOptions.relativePoints && snapOptions.relativePoints.length) {
      for (const { x: relativeX, y: relativeY } of snapOptions.relativePoints) {
        offsets.push({
          x: startOffset.left - (rect.width  * relativeX) + snapOffset.x,
          y: startOffset.top  - (rect.height * relativeY) + snapOffset.y,
        });
      }
    }
    else {
      offsets.push(snapOffset);
    }

    return offsets;
  },

  set: function (pageCoords, interaction, status) {
    const snapOptions = interaction.target.options[interaction.prepared.name].snap;
    const targets = [];
    let target;
    let page;
    let i;

    if (status.useStatusXY) {
      page = { x: status.x, y: status.y };
    }
    else {
      const origin = utils.getOriginXY(interaction.target, interaction.element, interaction.prepared.name);

      page = utils.extend({}, pageCoords);

      page.x -= origin.x;
      page.y -= origin.y;
    }

    status.realX = page.x;
    status.realY = page.y;

    const offsets = interaction.modifierOffsets.snap;
    let len = snapOptions.targets? snapOptions.targets.length : 0;

    for (const { x: offsetX, y: offsetY } of offsets) {
      const relativeX = page.x - offsetX;
      const relativeY = page.y - offsetY;

      for (const snapTarget of snapOptions.targets) {
        if (utils.isFunction(snapTarget)) {
          target = snapTarget(relativeX, relativeY, interaction);
        }
        else {
          target = snapTarget;
        }

        if (!target) { continue; }

        targets.push({
          x: utils.isNumber(target.x) ? (target.x + offsetX) : relativeX,
          y: utils.isNumber(target.y) ? (target.y + offsetY) : relativeY,

          range: utils.isNumber(target.range)? target.range: snapOptions.range,
        });
      }
    }

    const closest = {
      target: null,
      inRange: false,
      distance: 0,
      range: 0,
      dx: 0,
      dy: 0,
    };

    for (i = 0, len = targets.length; i < len; i++) {
      target = targets[i];

      const range = target.range;
      const dx = target.x - page.x;
      const dy = target.y - page.y;
      const distance = utils.hypot(dx, dy);
      let inRange = distance <= range;

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

        closest.target = target;
        closest.distance = distance;
        closest.range = range;
        closest.inRange = inRange;
        closest.dx = dx;
        closest.dy = dy;

        status.range = range;
      }
    }

    let snapChanged;

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
    const snapOptions = interactable.options[actionName].snap;
    const relativePoints = snapOptions && snapOptions.relativePoints;

    if (snapOptions && snapOptions.enabled
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
        dy     : status.dy,
      };
    }
  },
};

interact.createSnapGrid = function (grid) {
  return function (x, y) {
    const limits = grid.limits || {
      left  : -Infinity,
      right :  Infinity,
      top   : -Infinity,
      bottom:  Infinity,
    };
    let offsetX = 0;
    let offsetY = 0;

    if (utils.isObject(grid.offset)) {
      offsetX = grid.offset.x;
      offsetY = grid.offset.y;
    }

    const gridx = Math.round((x - offsetX) / grid.x);
    const gridy = Math.round((y - offsetY) / grid.y);

    const newX = Math.max(limits.left, Math.min(limits.right , gridx * grid.x + offsetX));
    const newY = Math.max(limits.top , Math.min(limits.bottom, gridy * grid.y + offsetY));

    return {
      x: newX,
      y: newY,
      range: grid.range,
    };
  };
};

modifiers.snap = snap;
modifiers.names.push('snap');

defaultOptions.perAction.snap = snap.defaults;

module.exports = snap;
