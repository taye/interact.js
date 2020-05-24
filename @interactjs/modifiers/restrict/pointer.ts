import * as Interact from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'
import * as rectUtils from '@interactjs/utils/rect'

import { makeModifier, ModifierArg, ModifierModule, ModifierState } from '../base'

export interface RestrictOptions {
  // where to drag over
  restriction: Interact.RectResolvable<[number, number, Interact.Interaction]>
  // what part of self is allowed to drag over
  elementRect: Interact.Rect
  offset: Interact.Rect
  // restrict just before the end drag
  endOnly: boolean
  enabled?: boolean
}

export type RestrictState = ModifierState<RestrictOptions, {
  offset: Interact.Rect
}>

function start ({ rect, startOffset, state, interaction, pageCoords }: ModifierArg<RestrictState>) {
  const { options } = state
  const { elementRect } = options
  const offset: Interact.Rect = extend({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  }, options.offset || {})

  if (rect && elementRect) {
    const restriction = getRestrictionRect(options.restriction, interaction, pageCoords)

    if (restriction) {
      const widthDiff = (restriction.right - restriction.left) - rect.width
      const heightDiff = (restriction.bottom - restriction.top) - rect.height

      if (widthDiff < 0) {
        offset.left += widthDiff
        offset.right += widthDiff
      }
      if (heightDiff < 0) {
        offset.top += heightDiff
        offset.bottom += heightDiff
      }
    }

    offset.left += startOffset.left - (rect.width  * elementRect.left)
    offset.top  += startOffset.top  - (rect.height * elementRect.top)

    offset.right  += startOffset.right  - (rect.width  * (1 - elementRect.right))
    offset.bottom += startOffset.bottom - (rect.height * (1 - elementRect.bottom))
  }

  state.offset = offset
}

function set ({ coords, interaction, state }: ModifierArg<RestrictState>) {
  const { options, offset } = state

  const restriction = getRestrictionRect(options.restriction, interaction, coords)

  if (!restriction) { return }

  const rect = rectUtils.xywhToTlbr(restriction)

  coords.x = Math.max(Math.min(rect.right  - offset.right, coords.x), rect.left + offset.left)
  coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top  + offset.top)
}

export function getRestrictionRect (
  value: Interact.RectResolvable<[number, number, Interact.Interaction]>,
  interaction: Interact.Interaction,
  coords?: Interact.Point,
) {
  if (is.func(value)) {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction])
  } else {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element)
  }
}

const defaults: RestrictOptions = {
  restriction: null,
  elementRect: null,
  offset: null,
  endOnly: false,
  enabled: false,
}

const restrict: ModifierModule<RestrictOptions, RestrictState> = {
  start,
  set,
  defaults,
}

export default makeModifier(restrict, 'restrict')
export { restrict }
