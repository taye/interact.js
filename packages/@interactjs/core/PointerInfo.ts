import * as Interact from '@interactjs/types/index'

export class PointerInfo {
  id: number
  pointer: Interact.PointerType
  event: Interact.PointerEventType
  downTime: number
  downTarget: Node

  constructor (
    id: number,
    pointer: Interact.PointerType,
    event: Interact.PointerEventType,
    downTime: number,
    downTarget: Node,
  ) {
    this.id = id
    this.pointer = pointer
    this.event = event
    this.downTime = downTime
    this.downTarget = downTarget
  }
}
