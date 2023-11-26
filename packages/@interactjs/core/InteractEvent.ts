import extend from '@interactjs/utils/extend'
import getOriginXY from '@interactjs/utils/getOriginXY'
import hypot from '@interactjs/utils/hypot'

import type { Point, FullRect, PointerEventType, Element, ActionName } from '@interactjs/core/types'

import { BaseEvent } from './BaseEvent'
import type { Interaction } from './Interaction'
import { defaults } from './options'

export type EventPhase = keyof PhaseMap

export interface PhaseMap {
  start: true
  move: true
  end: true
}

// defined outside of class definition to avoid assignment of undefined during
// construction
export interface InteractEvent {
  pageX: number
  pageY: number

  clientX: number
  clientY: number

  dx: number
  dy: number

  velocityX: number
  velocityY: number
}

export class InteractEvent<
  T extends ActionName = never,
  P extends EventPhase = EventPhase,
> extends BaseEvent<T> {
  declare target: Element
  declare currentTarget: Element
  relatedTarget: Element | null = null
  screenX?: number
  screenY?: number
  button: number
  buttons: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  page: Point
  client: Point
  delta: Point
  rect: FullRect
  x0: number
  y0: number
  t0: number
  dt: number
  duration: number
  clientX0: number
  clientY0: number
  velocity: Point
  speed: number
  swipe: ReturnType<InteractEvent<T>['getSwipe']>
  // resize
  axes?: 'x' | 'y' | 'xy'
  /** @internal */
  preEnd?: boolean

  constructor(
    interaction: Interaction<T>,
    event: PointerEventType,
    actionName: T,
    phase: P,
    element: Element,
    preEnd?: boolean,
    type?: string,
  ) {
    super(interaction)

    element = element || interaction.element

    const target = interaction.interactable
    const deltaSource = (((target && target.options) || defaults) as any).deltaSource as 'page' | 'client'
    const origin = getOriginXY(target, element, actionName)
    const starting = phase === 'start'
    const ending = phase === 'end'
    const prevEvent = starting ? this : interaction.prevEvent
    const coords = starting
      ? interaction.coords.start
      : ending
        ? { page: prevEvent.page, client: prevEvent.client, timeStamp: interaction.coords.cur.timeStamp }
        : interaction.coords.cur

    this.page = extend({}, coords.page)
    this.client = extend({}, coords.client)
    this.rect = extend({}, interaction.rect)
    this.timeStamp = coords.timeStamp

    if (!ending) {
      this.page.x -= origin.x
      this.page.y -= origin.y

      this.client.x -= origin.x
      this.client.y -= origin.y
    }

    this.ctrlKey = event.ctrlKey
    this.altKey = event.altKey
    this.shiftKey = event.shiftKey
    this.metaKey = event.metaKey
    this.button = (event as MouseEvent).button
    this.buttons = (event as MouseEvent).buttons
    this.target = element
    this.currentTarget = element
    this.preEnd = preEnd
    this.type = type || actionName + (phase || '')
    this.interactable = target

    this.t0 = starting ? interaction.pointers[interaction.pointers.length - 1].downTime : prevEvent.t0

    this.x0 = interaction.coords.start.page.x - origin.x
    this.y0 = interaction.coords.start.page.y - origin.y
    this.clientX0 = interaction.coords.start.client.x - origin.x
    this.clientY0 = interaction.coords.start.client.y - origin.y

    if (starting || ending) {
      this.delta = { x: 0, y: 0 }
    } else {
      this.delta = {
        x: this[deltaSource].x - prevEvent[deltaSource].x,
        y: this[deltaSource].y - prevEvent[deltaSource].y,
      }
    }

    this.dt = interaction.coords.delta.timeStamp
    this.duration = this.timeStamp - this.t0

    // velocity and speed in pixels per second
    this.velocity = extend({}, interaction.coords.velocity[deltaSource])
    this.speed = hypot(this.velocity.x, this.velocity.y)

    this.swipe = ending || phase === 'inertiastart' ? this.getSwipe() : null
  }

  getSwipe() {
    const interaction = this._interaction

    if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
      return null
    }

    let angle = (180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX)) / Math.PI
    const overlap = 22.5

    if (angle < 0) {
      angle += 360
    }

    const left = 135 - overlap <= angle && angle < 225 + overlap
    const up = 225 - overlap <= angle && angle < 315 + overlap

    const right = !left && (315 - overlap <= angle || angle < 45 + overlap)
    const down = !up && 45 - overlap <= angle && angle < 135 + overlap

    return {
      up,
      down,
      left,
      right,
      angle,
      speed: interaction.prevEvent.speed,
      velocity: {
        x: interaction.prevEvent.velocityX,
        y: interaction.prevEvent.velocityY,
      },
    }
  }

  preventDefault() {}

  /**
   * Don't call listeners on the remaining targets
   */
  stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true
  }

  /**
   * Don't call any other listeners (even on the current target)
   */
  stopPropagation() {
    this.propagationStopped = true
  }
}

// getters and setters defined here to support typescript 3.6 and below which
// don't support getter and setters in .d.ts files
Object.defineProperties(InteractEvent.prototype, {
  pageX: {
    get() {
      return this.page.x
    },
    set(value) {
      this.page.x = value
    },
  },
  pageY: {
    get() {
      return this.page.y
    },
    set(value) {
      this.page.y = value
    },
  },

  clientX: {
    get() {
      return this.client.x
    },
    set(value) {
      this.client.x = value
    },
  },
  clientY: {
    get() {
      return this.client.y
    },
    set(value) {
      this.client.y = value
    },
  },

  dx: {
    get() {
      return this.delta.x
    },
    set(value) {
      this.delta.x = value
    },
  },
  dy: {
    get() {
      return this.delta.y
    },
    set(value) {
      this.delta.y = value
    },
  },

  velocityX: {
    get() {
      return this.velocity.x
    },
    set(value) {
      this.velocity.x = value
    },
  },
  velocityY: {
    get() {
      return this.velocity.y
    },
    set(value) {
      this.velocity.y = value
    },
  },
})
