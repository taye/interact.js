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
  }
}
