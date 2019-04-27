import * as is from '@interactjs/utils/is'
import rectUtils from '@interactjs/utils/rect'

function start ({ rect, startOffset, state }) {
  const { options } = state
  const { elementRect } = options
  const offset = {} as { [key: string]: number }

  if (rect && elementRect) {
    offset.left = startOffset.left - (rect.width  * elementRect.left)
    offset.top  = startOffset.top  - (rect.height * elementRect.top)

    offset.right  = startOffset.right  - (rect.width  * (1 - elementRect.right))
    offset.bottom = startOffset.bottom - (rect.height * (1 - elementRect.bottom))
  }
  else {
    offset.left = offset.top = offset.right = offset.bottom = 0
  }

  state.offset = offset
}

function set ({ coords, interaction, state }) {
  const { options, offset } = state

  const restriction = getRestrictionRect(options.restriction, interaction, coords)

  if (!restriction) { return state }

  const rect = restriction

  // object is assumed to have
  // x, y, width, height or
  // left, top, right, bottom
  if ('x' in restriction && 'y' in restriction) {
    coords.x = Math.max(Math.min(rect.x + rect.width  - offset.right, coords.x), rect.x + offset.left)
    coords.y = Math.max(Math.min(rect.y + rect.height - offset.bottom, coords.y), rect.y + offset.top)
  }
  else {
    coords.x = Math.max(Math.min(rect.right  - offset.right, coords.x), rect.left + offset.left)
    coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top  + offset.top)
  }
}

function getRestrictionRect (value, interaction, coords?: Interact.Point) {
  if (is.func(value)) {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction])
  } else {
    return rectUtils.resolveRectLike(value, interaction.interactable, interaction.element)
  }
}

const restrict = {
  start,
  set,
  getRestrictionRect,
  defaults: {
    enabled: false,
    restriction: null,
    elementRect: null,
  },
}

export default restrict
