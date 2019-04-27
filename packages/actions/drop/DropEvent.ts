import BaseEvent from '@interactjs/core/BaseEvent'
import Interactable from '@interactjs/core/Interactable'
import InteractEvent from '@interactjs/core/InteractEvent'
import Interaction from '@interactjs/core/Interaction'
import { ActionName } from '@interactjs/core/scope'
import * as arr from '@interactjs/utils/arr'

class DropEvent extends BaseEvent {
  target: Element
  dropzone: Interactable
  dragEvent: InteractEvent<ActionName.Drag>
  relatedTarget: Element
  draggable: Interactable
  timeStamp: number
  propagationStopped = false
  immediatePropagationStopped = false

  /**
   * Class of events fired on dropzones during drags with acceptable targets.
   */
  constructor (dropState: Interaction['dropState'], dragEvent: InteractEvent, type: string) {
    super(dragEvent._interaction)

    const { element, dropzone } = type === 'dragleave'
      ? dropState.prev
      : dropState.cur

    this.type          = type
    this.target        = element
    this.currentTarget = element
    this.dropzone      = dropzone
    this.dragEvent     = dragEvent
    this.relatedTarget = dragEvent.target
    this.draggable     = dragEvent.interactable
    this.timeStamp     = dragEvent.timeStamp
  }

  /**
   * If this is a `dropactivate` event, the dropzone element will be
   * deactivated.
   *
   * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
   * dropzone element and more.
   */
  reject () {
    const { dropState } = this._interaction

    if (
      (this.type !== 'dropactivate') && (
        !this.dropzone ||
        dropState.cur.dropzone !== this.dropzone ||
        dropState.cur.element !== this.target)) {
      return
    }

    dropState.prev.dropzone = this.dropzone
    dropState.prev.element = this.target

    dropState.rejected = true
    dropState.events.enter = null

    this.stopImmediatePropagation()

    if (this.type === 'dropactivate') {
      const activeDrops = dropState.activeDrops
      const index = arr.findIndex(activeDrops, ({ dropzone, element }) =>
        dropzone === this.dropzone && element === this.target)

      dropState.activeDrops = [
        ...activeDrops.slice(0, index),
        ...activeDrops.slice(index + 1),
      ]

      const deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate')

      deactivateEvent.dropzone = this.dropzone
      deactivateEvent.target = this.target

      this.dropzone.fire(deactivateEvent)
    }
    else {
      this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'))
    }
  }

  preventDefault () {}

  stopPropagation () {
    this.propagationStopped = true
  }

  stopImmediatePropagation () {
    this.immediatePropagationStopped = this.propagationStopped = true
  }
}

export default DropEvent
