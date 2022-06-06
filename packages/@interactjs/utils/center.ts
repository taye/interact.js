import type { Rect } from '@interactjs/core/types'

export default (rect: Rect) => ({
  x: rect.left + (rect.right - rect.left) / 2,
  y: rect.top + (rect.bottom - rect.top) / 2,
})
