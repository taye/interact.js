// This module allows snapping of the size of targets during resize
// interactions.
import extend from "../../utils/extend.js";
import * as is from "../../utils/is.js";
import snap from "./pointer.js";

function start(arg) {
  const {
    interaction,
    state
  } = arg;
  const {
    options
  } = state;
  const edges = interaction.prepared.edges;

  if (!edges) {
    return null;
  }

  arg.state = {
    options: {
      targets: null,
      relativePoints: [{
        x: edges.left ? 0 : 1,
        y: edges.top ? 0 : 1
      }],
      offset: options.offset || 'self',
      origin: {
        x: 0,
        y: 0
      },
      range: options.range
    }
  };
  state.targetFields = state.targetFields || [['width', 'height'], ['x', 'y']];
  snap.start(arg);
  state.offsets = arg.state.offsets;
  arg.state = state;
}

function set(arg) {
  const {
    interaction,
    state,
    coords
  } = arg;
  const {
    options,
    offsets
  } = state;
  const relative = {
    x: coords.x - offsets[0].x,
    y: coords.y - offsets[0].y
  };
  state.options = extend({}, options);
  state.options.targets = [];

  for (const snapTarget of options.targets || []) {
    let target;

    if (is.func(snapTarget)) {
      target = snapTarget(relative.x, relative.y, interaction);
    } else {
      target = snapTarget;
    }

    if (!target) {
      continue;
    }

    for (const [xField, yField] of state.targetFields) {
      if (xField in target || yField in target) {
        target.x = target[xField];
        target.y = target[yField];
        break;
      }
    }

    state.options.targets.push(target);
  }

  snap.set(arg);
  state.options = options;
}

const defaults = {
  range: Infinity,
  targets: null,
  offset: null,
  endOnly: false,
  enabled: false
};
const snapSize = {
  start,
  set,
  defaults
};
export default snapSize;
//# sourceMappingURL=size.js.map