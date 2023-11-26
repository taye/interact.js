import type { Point, Rect, Size } from '@interactjs/core/types'
import extend from '@interactjs/utils/extend'
import * as rectUtils from '@interactjs/utils/rect'

import { makeModifier } from '../base'
import type { ModifierArg, ModifierState } from '../types'

import type { RestrictEdgesState } from './edges'
import { restrictEdges } from './edges'
import type { RestrictOptions } from './pointer'
import { getRestrictionRect } from './pointer'

const noMin = { width: -Infinity, height: -Infinity }
const noMax = { width: +Infinity, height: +Infinity }

export interface RestrictSizeOptions {
  min?: Size | Point | RestrictOptions['restriction']
  max?: Size | Point | RestrictOptions['restriction']
  endOnly: boolean
  enabled?: boolean
}

function start(arg: ModifierArg<RestrictEdgesState>) {
  return restrictEdges.start(arg)
}

export type RestrictSizeState = RestrictEdgesState &
  ModifierState<
    RestrictSizeOptions & { inner: Rect; outer: Rect },
    {
      min: Rect
      max: Rect
    }
  >

function set(arg: ModifierArg<RestrictSizeState>) {
  const { interaction, state, rect, edges } = arg
  const { options } = state

  if (!edges) {
    return
  }

  const minSize =
    rectUtils.tlbrToXywh(getRestrictionRect(options.min as any, interaction, arg.coords)) || noMin
  const maxSize =
    rectUtils.tlbrToXywh(getRestrictionRect(options.max as any, interaction, arg.coords)) || noMax

  state.options = {
    endOnly: options.endOnly,
    inner: extend({}, restrictEdges.noInner),
    outer: extend({}, restrictEdges.noOuter),
  }

  if (edges.top) {
    state.options.inner.top = rect.bottom - minSize.height
    state.options.outer.top = rect.bottom - maxSize.height
  } else if (edges.bottom) {
    state.options.inner.bottom = rect.top + minSize.height
    state.options.outer.bottom = rect.top + maxSize.height
  }
  if (edges.left) {
    state.options.inner.left = rect.right - minSize.width
    state.options.outer.left = rect.right - maxSize.width
  } else if (edges.right) {
    state.options.inner.right = rect.left + minSize.width
    state.options.outer.right = rect.left + maxSize.width
  }

  restrictEdges.set(arg)

  state.options = options
}

const defaults: RestrictSizeOptions = {
  min: null,
  max: null,
  endOnly: false,
  enabled: false,
}

const restrictSize = {
  start,
  set,
  defaults,
}

export default makeModifier(restrictSize, 'restrictSize')
export { restrictSize }
