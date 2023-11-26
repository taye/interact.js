import type { PointerEventType, PointerType } from '@interactjs/core/types'

export class PointerInfo {
  id: number
  pointer: PointerType
  event: PointerEventType
  downTime: number
  downTarget: Node

  constructor(id: number, pointer: PointerType, event: PointerEventType, downTime: number, downTarget: Node) {
    this.id = id
    this.pointer = pointer
    this.event = event
    this.downTime = downTime
    this.downTarget = downTarget
  }
}
