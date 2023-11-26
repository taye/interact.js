import type { Rect, Point } from '@interactjs/core/types'
import type { SnapFunction, SnapTarget } from '@interactjs/modifiers/snap/pointer'

export interface GridOptionsBase {
  range?: number
  limits?: Rect
  offset?: Point
}
export interface GridOptionsXY extends GridOptionsBase {
  x: number
  y: number
}
export interface GridOptionsTopLeft extends GridOptionsBase {
  top?: number
  left?: number
}
export interface GridOptionsBottomRight extends GridOptionsBase {
  bottom?: number
  right?: number
}
export interface GridOptionsWidthHeight extends GridOptionsBase {
  width?: number
  height?: number
}

export type GridOptions = GridOptionsXY | GridOptionsTopLeft | GridOptionsBottomRight | GridOptionsWidthHeight

export default (grid: GridOptions) => {
  const coordFields = (
    [
      ['x', 'y'],
      ['left', 'top'],
      ['right', 'bottom'],
      ['width', 'height'],
    ] as const
  ).filter(([xField, yField]) => xField in grid || yField in grid)

  const gridFunc: SnapFunction & {
    grid: typeof grid
    coordFields: typeof coordFields
  } = (x, y) => {
    const {
      range,
      limits = {
        left: -Infinity,
        right: Infinity,
        top: -Infinity,
        bottom: Infinity,
      },
      offset = { x: 0, y: 0 },
    } = grid

    const result: SnapTarget & {
      grid: typeof grid
    } = { range, grid, x: null as number, y: null as number }

    for (const [xField, yField] of coordFields) {
      const gridx = Math.round((x - offset.x) / (grid as any)[xField])
      const gridy = Math.round((y - offset.y) / (grid as any)[yField])

      result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * (grid as any)[xField] + offset.x))
      result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * (grid as any)[yField] + offset.y))
    }

    return result
  }

  gridFunc.grid = grid
  gridFunc.coordFields = coordFields

  return gridFunc
}
