import { BaseEvent } from "../../core/BaseEvent.js";
import * as arr from "../../utils/arr.js";
export class DropEvent extends BaseEvent {
  /**
   * Class of events fired on dropzones during drags with acceptable targets.
   */
  constructor(dropState, dragEvent, type) {
    super(dragEvent._interaction);
    this.target = void 0;
    this.dropzone = void 0;
    this.dragEvent = void 0;
    this.relatedTarget = void 0;
    this.draggable = void 0;
    this.timeStamp = void 0;
    this.propagationStopped = false;
    this.immediatePropagationStopped = false;
    const {
      element,
      dropzone
    } = type === 'dragleave' ? dropState.prev : dropState.cur;
    this.type = type;
    this.target = element;
    this.currentTarget = element;
    this.dropzone = dropzone;
    this.dragEvent = dragEvent;
    this.relatedTarget = dragEvent.target;
    this.draggable = dragEvent.interactable;
    this.timeStamp = dragEvent.timeStamp;
  }
  /**
   * If this is a `dropactivate` event, the dropzone element will be
   * deactivated.
   *
   * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
   * dropzone element and more.
   */


  reject() {
    const {
      dropState
    } = this._interaction;

    if (this.type !== 'dropactivate' && (!this.dropzone || dropState.cur.dropzone !== this.dropzone || dropState.cur.element !== this.target)) {
      return;
    }

    dropState.prev.dropzone = this.dropzone;
    dropState.prev.element = this.target;
    dropState.rejected = true;
    dropState.events.enter = null;
    this.stopImmediatePropagation();

    if (this.type === 'dropactivate') {
      const activeDrops = dropState.activeDrops;
      const index = arr.findIndex(activeDrops, ({
        dropzone,
        element
      }) => dropzone === this.dropzone && element === this.target);
      dropState.activeDrops.splice(index, 1);
      const deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate');
      deactivateEvent.dropzone = this.dropzone;
      deactivateEvent.target = this.target;
      this.dropzone.fire(deactivateEvent);
    } else {
      this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'));
    }
  }

  preventDefault() {}

  stopPropagation() {
    this.propagationStopped = true;
  }

  stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }

}
//# sourceMappingURL=DropEvent.js.map