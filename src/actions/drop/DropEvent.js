export default class DropEvent {
  constructor (interaction, dragEvent, type) {
    this.dragEvent     = dragEvent;
    this.interaction   = interaction;
    this.target        = interaction.dropElement;
    this.dropzone      = interaction.dropTarget;
    this.relatedTarget = dragEvent.target;
    this.draggable     = dragEvent.interactable;
    this.timeStamp     = dragEvent.timeStamp;
    this.type          = type;
  }
}
