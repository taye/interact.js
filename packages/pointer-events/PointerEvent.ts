import BaseEvent from '@interactjs/core/BaseEvent'
import pointerUtils from '@interactjs/utils/pointerUtils'

/** */
export default class PointerEvent<T extends string> extends BaseEvent {
  type: T
  originalEvent: Interact.PointerEventType
  pointerId: number
  pointerType: string
  double: boolean
  pageX: number
  pageY: number
  clientX: number
  clientY: number
  dt: number
  eventable: any

  /** */
  constructor (
    type: T,
    pointer: Interact.PointerType | PointerEvent<any>,
    event: Interact.PointerEventType,
    eventTarget: Interact.EventTarget,
    interaction: Interact.Interaction,
    timeStamp: number,
  ) {
    super(interaction)
    pointerUtils.pointerExtend(this, event)

    if (event !== pointer) {
      pointerUtils.pointerExtend(this, pointer)
    }

    this.timeStamp     = timeStamp
    this.originalEvent = event
    this.type          = type
    this.pointerId     = pointerUtils.getPointerId(pointer)
    this.pointerType   = pointerUtils.getPointerType(pointer)
    this.target        = eventTarget
    this.currentTarget = null

    if (type === 'tap') {
      const pointerIndex = interaction.getPointerIndex(pointer)
      this.dt = this.timeStamp - interaction.pointers[pointerIndex].downTime

      const interval = this.timeStamp - interaction.tapTime

      this.double = !!(interaction.prevTap &&
        interaction.prevTap.type !== 'doubletap' &&
        interaction.prevTap.target === this.target &&
        interval < 500)
    }
    else if (type === 'doubletap') {
      this.dt = (pointer as PointerEvent<'tap'>).timeStamp - interaction.tapTime
    }
  }

  _subtractOrigin ({ x: originX, y: originY }) {
    this.pageX   -= originX
    this.pageY   -= originY
    this.clientX -= originX
    this.clientY -= originY

    return this
  }

  _addOrigin ({ x: originX, y: originY }) {
    this.pageX   += originX
    this.pageY   += originY
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
