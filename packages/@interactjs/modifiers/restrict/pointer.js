import extend from "../../utils/extend.js";
import is from "../../utils/is.js";
import * as rectUtils from "../../utils/rect.js";
import { makeModifier } from "../base.js";

function start({
  rect,
  startOffset,
  state,
  interaction,
  pageCoords
}) {
  const {
    options
  } = state;
  const {
    elementRect
  } = options;
  const offset = extend({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  }, options.offset || {});

  if (rect && elementRect) {
    const restriction = getRestrictionRect(options.restriction, interaction, pageCoords);

    if (restriction) {
      const widthDiff = restriction.right - restriction.left - rect.width;
      const heightDiff = restriction.bottom - restriction.top - rect.height;

      if (widthDiff < 0) {
        offset.left += widthDiff;
        offset.right += widthDiff;
      }

      if (heightDiff < 0) {
        offset.top += heightDiff;
        offset.bottom += heightDiff;
      }
    }

    offset.left += startOffset.left - rect.width * elementRect.left;
    offset.top += startOffset.top - rect.height * elementRect.top;
    offset.right += startOffset.right - rect.width * (1 - elementRect.right);
    offset.bottom += startOffset.bottom - rect.height * (1 - elementRect.bottom);
  }

  state.offset = offset;
}

function set({
  coords,
  interaction,
  state
}) {
  const {
    options,
    offset
  } = state;
  const restriction = getRestrictionRect(options.restriction, interaction, coords);
  if (!restriction) return;
  const rect = rectUtils.xywhToTlbr(restriction);
  coords.x = Math.max(Math.min(rect.right - offset.right, coords.x), rect.left + offset.left);
  coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top + offset.top);
}

export function getRestrictionRect(value, interaction, coords) {
  if (is.func(value)) {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction]);
  } else {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element);
  }
}
const defaults = {
  restriction: null,
  elementRect: null,
  offset: null,
  endOnly: false,
  enabled: false
};
const restrict = {
  start,
  set,
  defaults
};
export default makeModifier(restrict, 'restrict');
export { restrict };
//# sourceMappingURL=pointer.js.map