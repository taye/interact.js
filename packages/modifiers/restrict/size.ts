// This module adds the options.resize.restrictSize setting which sets min and
// max width and height for the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictSize: {
//     min: { width: -600, height: -600 },
//     max: { width:  600, height:  600 },
//   },
// })

import extend from '@interactjs/utils/extend'
import rectUtils from '@interactjs/utils/rect'
import restrictEdges from './edges'

const noMin = { width: -Infinity, height: -Infinity }
const noMax = { width: +Infinity, height: +Infinity }

function start (arg) {
  return restrictEdges.start(arg)
}

function set (arg) {
  const { interaction, state } = arg
  const { options } = state
  const edges = interaction.prepared.linkedEdges || interaction.prepared.edges

  if (!edges) {
    return
  }

  const rect = rectUtils.xywhToTlbr(interaction.resizeRects.inverted)

  const minSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.min, interaction)) || noMin
  const maxSize = rectUtils.tlbrToXywh(restrictEdges.getRestrictionRect(options.max, interaction)) || noMax

  state.options = {
    enabled: options.enabled,
    endOnly: options.endOnly,
    inner: extend({}, restrictEdges.noInner),
    outer: extend({}, restrictEdges.noOuter),
  }

  if (edges.top) {
    state.options.inner.top = rect.bottom - minSize.height
    state.options.outer.top = rect.bottom - maxSize.height
  }
  else if (edges.bottom) {
    state.options.inner.bottom = rect.top + minSize.height
    state.options.outer.bottom = rect.top + maxSize.height
  }
  if (edges.left) {
    state.options.inner.left = rect.right - minSize.width
    state.options.outer.left = rect.right - maxSize.width
  }
  else if (edges.right) {
    state.options.inner.right = rect.left + minSize.width
    state.options.outer.right = rect.left + maxSize.width
  }

  restrictEdges.set(arg)

  state.options = options
}

const restrictSize = {
  start,
  set,
  defaults: {
    enabled: false,
    min: null,
    max: null,
  },
}

export default restrictSize
