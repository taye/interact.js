import * as utils from '@interactjs/utils'
import { ModifierArg, ModifierState } from '../base'

export interface SnapPosition {
  x: number
  y: number
  range?: number
}

export type SnapFunction = (
  x: number,
  y: number,
  interaction: Interact.Interaction,
  offset: Interact.Point,
  index: number
) => SnapPosition
export type SnapTarget = SnapPosition | SnapFunction
export interface SnapOptions {
  targets: SnapTarget[]
  // target range
  range: number
  // self points for snapping. [0,0] = top left, [1,1] = bottom right
  relativePoints: Interact.Point[]
  // startCoords = offset snapping from drag start page position
  offset: Interact.Point | Interact.RectResolvable<[Interact.Interaction]> | 'startCoords'
  offsetWithOrigin?: boolean
  origin: Interact.RectResolvable<[Element]> | Interact.Point
  endOnly?: boolean
  enabled?: boolean
}

export type SnapState = ModifierState<SnapOptions, {
  offsets?: Interact.Point[]
  realX?: number
  realY?: number
  range?: number
  closest?: any
  targetFields?: string[][]
}>

function start (arg: ModifierArg<SnapState>) {
  const { interaction, interactable, element, rect, state, startOffset } = arg
  const { options } = state
  const offsets = []
  const origin = options.offsetWithOrigin
    ? getOrigin(arg)
    : { x: 0, y: 0 }

  let snapOffset

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x,
      y: interaction.coords.start.page.y,
    }
  }
  else  {
    const offsetRect = utils.rect.resolveRectLike(options.offset as any, interactable, element, [interaction])

    snapOffset = utils.rect.rectToXY(offsetRect) || { x: 0, y: 0 }
    snapOffset.x += origin.x
    snapOffset.y += origin.y
  }

  const relativePoints = options.relativePoints || []

  if (rect && options.relativePoints && options.relativePoints.length) {
    for (let index = 0; index < relativePoints.length; index++) {
      const relativePoint = relativePoints[index]

      offsets.push({
        index,
        relativePoint,
        x: startOffset.left - (rect.width  * relativePoint.x) + snapOffset.x,
        y: startOffset.top  - (rect.height * relativePoint.y) + snapOffset.y,
      })
    }
  }
  else {
    offsets.push(utils.extend({
      index: 0,
      relativePoint: null,
    }, snapOffset))
  }

  state.offsets = offsets
}

function set (arg: ModifierArg<SnapState>) {
  const { interaction, coords, state } = arg
  const { options, offsets } = state

  const origin = utils.getOriginXY(interaction.interactable, interaction.element, interaction.prepared.name)
  const page = utils.extend({}, coords)
  const targets = []
  let target

  if (!options.offsetWithOrigin) {
    page.x -= origin.x
    page.y -= origin.y
  }

  state.realX = page.x
  state.realY = page.y

  for (const offset of offsets) {
    const relativeX = page.x - offset.x
    const relativeY = page.y - offset.y

    for (let index = 0, len = options.targets.length; index < len; index++) {
      const snapTarget = options.targets[index]
      if (utils.is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction, offset, index)
      }
      else {
        target = snapTarget
      }

      if (!target) { continue }

      targets.push({
        x: (utils.is.number(target.x) ? target.x : relativeX) + offset.x,
        y: (utils.is.number(target.y) ? target.y : relativeY) + offset.y,

        range: utils.is.number(target.range) ? target.range : options.range,
      })
    }
  }

  const closest = {
    target: null,
    inRange: false,
    distance: 0,
    range: 0,
    dx: 0,
    dy: 0,
  }

  for (let i = 0, len = targets.length; i < len; i++) {
    target = targets[i]

    const range = target.range
    const dx = target.x - page.x
    const dy = target.y - page.y
    const distance = utils.hypot(dx, dy)
    let inRange = distance <= range

    // Infinite targets count as being out of range
    // compared to non infinite ones that are in range
    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false
    }

    if (!closest.target || (inRange
      // is the closest target in range?
      ? (closest.inRange && range !== Infinity
        // the pointer is relatively deeper in this target
        ? distance / range < closest.distance / closest.range
        // this target has Infinite range and the closest doesn't
        : (range === Infinity && closest.range !== Infinity) ||
          // OR this target is closer that the previous closest
          distance < closest.distance)
      // The other is not in range and the pointer is closer to this target
      : (!closest.inRange && distance < closest.distance))) {
      closest.target = target
      closest.distance = distance
      closest.range = range
      closest.inRange = inRange
      closest.dx = dx
      closest.dy = dy

      state.range = range
    }
  }

  if (closest.inRange) {
    coords.x = closest.target.x
    coords.y = closest.target.y
  }

  state.closest = closest
}

function getOrigin (arg: Partial<ModifierArg<SnapState>>) {
  const optionsOrigin = utils.rect.rectToXY(
    utils.rect.resolveRectLike(arg.state.options.origin as any, [arg.interaction.element])
  )
  const origin = optionsOrigin || utils.getOriginXY(
    arg.interactable,
    arg.interaction.element,
    arg.interaction.prepared.name,
  )

  return origin
}

const defaults: SnapOptions = {
  range  : Infinity,
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

export default snap
