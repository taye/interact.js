export default class DropEvent {
  constructor (dropStatus, dragEvent, type) {
    const { element, dropzone } = type === 'deactivate'
      ? { element: null, dropzone: null }
      : type === 'dragleave'
        ? dropStatus.prev
        : dropStatus.cur;

    this.type          = type;
    this.target        = element;
    this.currentTarget = element;
    this.dropzone      = dropzone;
    this.dragEvent     = dragEvent;
    this.relatedTarget = dragEvent.target;
    this.interaction   = dragEvent.interaction;
    this.draggable     = dragEvent.interactable;
    this.timeStamp     = dragEvent.timeStamp;

    this.propagationStopped = this.immediatePropagationStopped = false;
  }

  reject () {
    const { dropStatus } = this.interaction;

    if (
      !this.dropzone ||
      dropStatus.cur.dropzone !== this.dropzone ||
      dropStatus.cur.element !== this.target) {
      return;
    }

    dropStatus.prev.dropzone = this.dropzone;
    dropStatus.prev.element = this.target;

    dropStatus.rejected = true;
    dropStatus.events.enter = null;

    // TODO: reject dropactivate

    this.stopImmediatePropagation();
    this.dropzone.fire(new DropEvent(dropStatus, this.dragEvent, 'dragleave'));
  }

  preventDefault () {}

  stopPropagation () {
    this.propagationStopped = true;
  }

  stopImmediatePropagation () {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }
}
