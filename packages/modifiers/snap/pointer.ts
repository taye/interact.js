import * as utils from '@interactjs/utils';

function start ({ interaction, interactable, element, rect, state, startOffset }) {
  const { options } = state;
  const offsets = [];
  const optionsOrigin = utils.rect.rectToXY(utils.rect.resolveRectLike(options.origin));
  const origin = optionsOrigin || utils.getOriginXY(interactable, element, interaction.prepared.name);

  let snapOffset;

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x - origin.x,
      y: interaction.coords.start.page.y - origin.y,
    };
  }
  else  {
    const offsetRect = utils.rect.resolveRectLike(options.offset, interactable, element, [interaction]);

    snapOffset = utils.rect.rectToXY(offsetRect) || { x: 0, y: 0 };
  }

  const relativePoints = options.relativePoints || [];

  if (rect && options.relativePoints && options.relativePoints.length) {
    for (let index = 0; index < relativePoints.length; index++) {
      const relativePoint = relativePoints[index];

      offsets.push({
        index,
        relativePoint,
        x: startOffset.left - (rect.width  * relativePoint.x) + snapOffset.x,
        y: startOffset.top  - (rect.height * relativePoint.y) + snapOffset.y,
      });
    }
  }
  else {
    offsets.push(utils.extend({
      index: 0,
      relativePoint: null,
    }, snapOffset));
  }

  state.offsets = offsets;
}

function set ({ interaction, coords, state }) {
  const { options, offsets } = state;

  const origin = utils.getOriginXY(interaction.target, interaction.element, interaction.prepared.name);
  const page = utils.extend({}, coords);
  const targets = [];
  let target;
  let i;

  page.x -= origin.x;
  page.y -= origin.y;

  state.realX = page.x;
  state.realY = page.y;

  let len = options.targets? options.targets.length : 0;

  for (const offset of offsets) {

    const relativeX = page.x - offset.x;
    const relativeY = page.y - offset.y;

    for (let index = 0; index < options.targets.length; index++) {
      const snapTarget = options.targets[index];
      if (utils.is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction, offset, index);
      }
      else {
        target = snapTarget;
      }

      if (!target) { continue; }

      targets.push({
        x: utils.is.number(target.x) ? (target.x + offset.x) : relativeX,
        y: utils.is.number(target.y) ? (target.y + offset.y) : relativeY,

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
        : (range === Infinity && closest.range !== Infinity) ||
          // OR this target is closer that the previous closest
          distance < closest.distance)
      // The other is not in range and the pointer is closer to this target
      : (!closest.inRange && distance < closest.distance))) {

      closest.target = target;
      closest.distance = distance;
      closest.range = range;
      closest.inRange = inRange;
      closest.dx = dx;
      closest.dy = dy;

      state.range = range;
    }
  }

  if (closest.inRange) {
    coords.x = closest.target.x;
    coords.y = closest.target.y;
  }

  state.closest = closest;
}

const snap = {
  start,
  set,
  defaults: {
    enabled: false,
    range  : Infinity,
    targets: null,
    offset: null,

    relativePoints: null,
  },
};

export default snap;
