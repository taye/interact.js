import { BaseEvent } from '@interactjs/core/BaseEvent'
import type Interaction from '@interactjs/core/Interaction'
import type { PointerEventType, PointerType, Point } from '@interactjs/types/index'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

export default class PointerEvent<T extends string = any> extends BaseEvent<never> {
  type: T
  originalEvent: PointerEventType
  pointerId: number
  pointerType: string
  double: boolean
  pageX: number
  pageY: number
  clientX: number
  clientY: number
  dt: number
  eventable: any;
  [key: string]: any

  /** */
  constructor (
    type: T,
    pointer: PointerType | PointerEvent<any>,
    event: PointerEventType,
    eventTarget: Node,
    interaction: Interaction<never>,
    timeStamp: number,
  ) {
    super(interaction)
    pointerUtils.pointerExtend(this, event)

    if (event !== pointer) {
      pointerUtils.pointerExtend(this, pointer)
    }

    this.timeStamp = timeStamp
    this.originalEvent = event
    this.type = type
    this.pointerId = pointerUtils.getPointerId(pointer)
    this.pointerType = pointerUtils.getPointerType(pointer)
    this.target = eventTarget
    this.currentTarget = null

    if (type === 'tap') {
      const pointerIndex = interaction.getPointerIndex(pointer)
      this.dt = this.timeStamp - interaction.pointers[pointerIndex].downTime

      const interval = this.timeStamp - interaction.tapTime

      this.double = !!(
        interaction.prevTap &&
        interaction.prevTap.type !== 'doubletap' &&
        interaction.prevTap.target === this.target &&
        interval < 500
      )
    } else if (type === 'doubletap') {
      this.dt = (pointer as PointerEvent<'tap'>).timeStamp - interaction.tapTime
    }
  }

  _subtractOrigin ({ x: originX, y: originY }: Point) {
    this.pageX -= originX
    this.pageY -= originY
    this.clientX -= originX
    this.clientY -= originY

    return this
  }

  _addOrigin ({ x: originX, y: originY }: Point) {
    this.pageX += originX
    this.pageY += originY
    this.clientX += originX
    this.clientY += originY

    return this
  }

  /**
   * Prevent the default behaviour of the original Event
   */
  preventDefault () {
    this.originalEvent.preventDefault()
  }
}

export { PointerEvent }
