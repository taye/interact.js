// This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// })
import extend from "../../utils/extend.js";
import * as rectUtils from "../../utils/rect.js";
import { makeModifier } from "../base.js";
import { getRestrictionRect } from "./pointer.js";
const noInner = {
  top: +Infinity,
  left: +Infinity,
  bottom: -Infinity,
  right: -Infinity
};
const noOuter = {
  top: -Infinity,
  left: -Infinity,
  bottom: +Infinity,
  right: +Infinity
};

function start({
  interaction,
  startOffset,
  state
}) {
  const {
    options
  } = state;
  let offset;

  if (options) {
    const offsetRect = getRestrictionRect(options.offset, interaction, interaction.coords.start.page);
    offset = rectUtils.rectToXY(offsetRect);
  }

  offset = offset || {
    x: 0,
    y: 0
  };
  state.offset = {
    top: offset.y + startOffset.top,
    left: offset.x + startOffset.left,
    bottom: offset.y - startOffset.bottom,
    right: offset.x - startOffset.right
  };
}

function set({
  coords,
  edges,
  interaction,
  state
}) {
  const {
    offset,
    options
  } = state;

  if (!edges) {
    return;
  }

  const page = extend({}, coords);
  const inner = getRestrictionRect(options.inner, interaction, page) || {};
  const outer = getRestrictionRect(options.outer, interaction, page) || {};
  fixRect(inner, noInner);
  fixRect(outer, noOuter);

  if (edges.top) {
    coords.y = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
  } else if (edges.bottom) {
    coords.y = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
  }

  if (edges.left) {
    coords.x = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
  } else if (edges.right) {
    coords.x = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
  }
}

function fixRect(rect, defaults) {
  for (const edge of ['top', 'left', 'bottom', 'right']) {
    if (!(edge in rect)) {
      rect[edge] = defaults[edge];
    }
  }

  return rect;
}

const defaults = {
  inner: null,
  outer: null,
  offset: null,
  endOnly: false,
  enabled: false
};
const restrictEdges = {
  noInner,
  noOuter,
  start,
  set,
  defaults
};
export default makeModifier(restrictEdges, 'restrictEdges');
export { restrictEdges };
//# sourceMappingURL=edges.js.map