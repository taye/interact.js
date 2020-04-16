/* eslint-disable @typescript-eslint/no-parameter-properties */
export class PointerInfo {
  id: number
  pointer: Interact.PointerType
  event: Interact.PointerEventType
  downTime: number
  downTarget: Interact.EventTarget

  constructor (
    id: number,
    pointer: Interact.PointerType,
    event: Interact.PointerEventType,
    downTime: number,
    downTarget: Interact.EventTarget,
  ) {
    this.id = id
    this.pointer = pointer
    this.event = event
    this.downTime = downTime
    this.downTarget = downTarget
  }
}

export default PointerInfo
