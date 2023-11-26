import type { Interaction, InteractionProxy } from '@interactjs/core/Interaction'
import type { ActionName, Point, RectResolvable, Element } from '@interactjs/core/types'
import extend from '@interactjs/utils/extend'
import getOriginXY from '@interactjs/utils/getOriginXY'
import hypot from '@interactjs/utils/hypot'
import is from '@interactjs/utils/is'
import { resolveRectLike, rectToXY } from '@interactjs/utils/rect'

import { makeModifier } from '../base'
import type { ModifierArg, ModifierState } from '../types'

export interface Offset {
  x: number
  y: number
  index: number
  relativePoint?: Point | null
}

export interface SnapPosition {
  x?: number
  y?: number
  range?: number
  offset?: Offset
  [index: string]: any
}

export type SnapFunction = (
  x: number,
  y: number,
  interaction: InteractionProxy<ActionName>,
  offset: Offset,
  index: number,
) => SnapPosition
export type SnapTarget = SnapPosition | SnapFunction
export interface SnapOptions {
  targets?: SnapTarget[]
  // target range
  range?: number
  // self points for snapping. [0,0] = top left, [1,1] = bottom right
  relativePoints?: Point[]
  // startCoords = offset snapping from drag start page position
  offset?: Point | RectResolvable<[Interaction]> | 'startCoords'
  offsetWithOrigin?: boolean
  origin?: RectResolvable<[Element]> | Point
  endOnly?: boolean
  enabled?: boolean
}

export type SnapState = ModifierState<
  SnapOptions,
  {
    offsets?: Offset[]
    closest?: any
    targetFields?: string[][]
  }
>

function start(arg: ModifierArg<SnapState>) {
  const { interaction, interactable, element, rect, state, startOffset } = arg
  const { options } = state
  const origin = options.offsetWithOrigin ? getOrigin(arg) : { x: 0, y: 0 }

  let snapOffset: Point

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x,
      y: interaction.coords.start.page.y,
    }
  } else {
    const offsetRect = resolveRectLike(options.offset as any, interactable, element, [interaction])

    snapOffset = rectToXY(offsetRect) || { x: 0, y: 0 }
    snapOffset.x += origin.x
    snapOffset.y += origin.y
  }

  const { relativePoints } = options

  state.offsets =
    rect && relativePoints && relativePoints.length
      ? relativePoints.map((relativePoint, index) => ({
          index,
          relativePoint,
          x: startOffset.left - rect.width * relativePoint.x + snapOffset.x,
          y: startOffset.top - rect.height * relativePoint.y + snapOffset.y,
        }))
      : [
          {
            index: 0,
            relativePoint: null,
            x: snapOffset.x,
            y: snapOffset.y,
          },
        ]
}

function set(arg: ModifierArg<SnapState>) {
  const { interaction, coords, state } = arg
  const { options, offsets } = state

  const origin = getOriginXY(interaction.interactable!, interaction.element!, interaction.prepared.name)
  const page = extend({}, coords)
  const targets: SnapPosition[] = []

  if (!options.offsetWithOrigin) {
    page.x -= origin.x
    page.y -= origin.y
  }

  for (const offset of offsets!) {
    const relativeX = page.x - offset.x
    const relativeY = page.y - offset.y

    for (let index = 0, len = options.targets!.length; index < len; index++) {
      const snapTarget = options.targets![index]
      let target: SnapPosition

      if (is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction._proxy, offset, index)
      } else {
        target = snapTarget
      }

      if (!target) {
        continue
      }

      targets.push({
        x: (is.number(target.x) ? target.x : relativeX) + offset.x,
        y: (is.number(target.y) ? target.y : relativeY) + offset.y,

        range: is.number(target.range) ? target.range : options.range,
        source: snapTarget,
        index,
        offset,
      })
    }
  }

  const closest = {
    target: null,
    inRange: false,
    distance: 0,
    range: 0,
    delta: { x: 0, y: 0 },
  }

  for (const target of targets) {
    const range = target.range
    const dx = target.x - page.x
    const dy = target.y - page.y
    const distance = hypot(dx, dy)
    let inRange = distance <= range

    // Infinite targets count as being out of range
    // compared to non infinite ones that are in range
    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false
    }

    if (
      !closest.target ||
      (inRange
        ? // is the closest target in range?
          closest.inRange && range !== Infinity
          ? // the pointer is relatively deeper in this target
            distance / range < closest.distance / closest.range
          : // this target has Infinite range and the closest doesn't
            (range === Infinity && closest.range !== Infinity) ||
            // OR this target is closer that the previous closest
            distance < closest.distance
        : // The other is not in range and the pointer is closer to this target
          !closest.inRange && distance < closest.distance)
    ) {
      closest.target = target
      closest.distance = distance
      closest.range = range
      closest.inRange = inRange
      closest.delta.x = dx
      closest.delta.y = dy
    }
  }

  if (closest.inRange) {
    coords.x = closest.target.x
    coords.y = closest.target.y
  }

  state.closest = closest
  return closest
}

function getOrigin(arg: Partial<ModifierArg<SnapState>>) {
  const { element } = arg.interaction
  const optionsOrigin = rectToXY(resolveRectLike(arg.state.options.origin as any, null, null, [element]))
  const origin = optionsOrigin || getOriginXY(arg.interactable, element, arg.interaction.prepared.name)

  return origin
}

const defaults: SnapOptions = {
  range: Infinity,
  targets: null,
  offset: null,
  offsetWithOrigin: true,
  origin: null,
  relativePoints: null,
  endOnly: false,
  enabled: false,
}
const snap = {
  start,
  set,
  defaults,
}

export default makeModifier(snap, 'snap')
export { snap }
