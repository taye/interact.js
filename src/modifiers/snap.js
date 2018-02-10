const utils = require('../utils');

function init (scope) {
  const {
    modifiers,
    defaults,
  } = scope;


  modifiers.snap = module.exports;
  modifiers.names.push('snap');

  defaults.perAction.snap = module.exports.defaults;
}

function setOffset ({ interaction, interactable, element, rect, startOffset, options }) {
  const offsets = [];
  const optionsOrigin = utils.rect.rectToXY(utils.rect.resolveRectLike(options.origin));
  const origin = optionsOrigin || utils.getOriginXY(interactable, element, interaction.prepared.name);
  options = options || interactable.options[interaction.prepared.name].snap || {};

  let snapOffset;

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.startCoords.page.x - origin.x,
      y: interaction.startCoords.page.y - origin.y,
    };
  }
  else  {
    const offsetRect = utils.rect.resolveRectLike(options.offset, interactable, element, [interaction]);

    snapOffset = utils.rect.rectToXY(offsetRect) || { x: 0, y: 0 };
  }

  if (rect && options.relativePoints && options.relativePoints.length) {
    for (const { x: relativeX, y: relativeY } of (options.relativePoints || [])) {
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
}

function set ({ interaction, modifiedCoords, status, options, offset: offsets }) {
  const origin = utils.getOriginXY(interaction.target, interaction.element, interaction.prepared.name);
  const page = utils.extend({}, modifiedCoords);
  const targets = [];
  let target;
  let i;

  page.x -= origin.x;
  page.y -= origin.y;

  status.realX = page.x;
  status.realY = page.y;

  let len = options.targets? options.targets.length : 0;

  for (const { x: offsetX, y: offsetY } of offsets) {
    const relativeX = page.x - offsetX;
    const relativeY = page.y - offsetY;

    for (const snapTarget of options.targets) {
      if (utils.is.function(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction);
      }
      else {
        target = snapTarget;
      }

      if (!target) { continue; }

      targets.push({
        x: utils.is.number(target.x) ? (target.x + offsetX) : relativeX,
        y: utils.is.number(target.y) ? (target.y + offsetY) : relativeY,

        range: utils.is.number(target.range)? target.range: options.range,
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
    snapChanged = (status.modifiedX !== closest.target.x || status.modifiedY !== closest.target.y);

    status.modifiedX = closest.target.x;
    status.modifiedY = closest.target.y;
  }
  else {
    snapChanged = true;

    status.modifiedX = NaN;
    status.modifiedY = NaN;
  }

  status.dx = closest.dx;
  status.dy = closest.dy;

  status.changed = (snapChanged || (closest.inRange && !status.locked));
  status.locked = closest.inRange;
}

function modifyCoords ({ page, client, status, phase, options }) {
  const relativePoints = options && options.relativePoints;

  if (options && options.enabled
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
      x      : status.modifiedX,
      y      : status.modifiedY,
      realX  : status.realX,
      realY  : status.realY,
      dx     : status.dx,
      dy     : status.dy,
    };
  }
}

module.exports = {
  init,
  setOffset,
  set,
  modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    range  : Infinity,
    targets: null,
    offsets: null,

    relativePoints: null,
  },
};
