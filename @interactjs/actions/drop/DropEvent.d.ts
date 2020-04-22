import BaseEvent from '@interactjs/core/BaseEvent';
import InteractEvent from '@interactjs/core/InteractEvent';
import Interactable from '@interactjs/core/Interactable';
declare class DropEvent extends BaseEvent {
    target: Interact.Element;
    dropzone: Interactable;
    dragEvent: InteractEvent<'drag'>;
    relatedTarget: Interact.Element;
    draggable: Interactable;
    timeStamp: number;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */
    constructor(dropState: import('./').DropState, dragEvent: InteractEvent<'drag'>, type: string);
    /**
     * If this is a `dropactivate` event, the dropzone element will be
     * deactivated.
     *
     * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
     * dropzone element and more.
     */
    reject(): void;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}
export default DropEvent;
