import extend from "../../utils/extend.js";
import * as rectUtils from "../../utils/rect.js";
import { makeModifier } from "../base.js";
import { restrictEdges } from "./edges.js";
import { getRestrictionRect } from "./pointer.js";
const noMin = {
  width: -Infinity,
  height: -Infinity
};
const noMax = {
  width: +Infinity,
  height: +Infinity
};

function start(arg) {
  return restrictEdges.start(arg);
}

function set(arg) {
  const {
    interaction,
    state,
    rect,
    edges
  } = arg;
  const {
    options
  } = state;

  if (!edges) {
    return;
  }

  const minSize = rectUtils.tlbrToXywh(getRestrictionRect(options.min, interaction, arg.coords)) || noMin;
  const maxSize = rectUtils.tlbrToXywh(getRestrictionRect(options.max, interaction, arg.coords)) || noMax;
  state.options = {
    endOnly: options.endOnly,
    inner: extend({}, restrictEdges.noInner),
    outer: extend({}, restrictEdges.noOuter)
  };

  if (edges.top) {
    state.options.inner.top = rect.bottom - minSize.height;
    state.options.outer.top = rect.bottom - maxSize.height;
  } else if (edges.bottom) {
    state.options.inner.bottom = rect.top + minSize.height;
    state.options.outer.bottom = rect.top + maxSize.height;
  }

  if (edges.left) {
    state.options.inner.left = rect.right - minSize.width;
    state.options.outer.left = rect.right - maxSize.width;
  } else if (edges.right) {
    state.options.inner.right = rect.left + minSize.width;
    state.options.outer.right = rect.left + maxSize.width;
  }

  restrictEdges.set(arg);
  state.options = options;
}

const defaults = {
  min: null,
  max: null,
  endOnly: false,
  enabled: false
};
const restrictSize = {
  start,
  set,
  defaults
};
export default makeModifier(restrictSize, 'restrictSize');
export { restrictSize };
//# sourceMappingURL=size.js.map