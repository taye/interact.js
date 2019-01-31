import Interactable from '@interactjs/core/Interactable';
import InteractEvent from '@interactjs/core/InteractEvent';
import Interaction from '@interactjs/core/Interaction';
declare class DropEvent {
    type: string;
    target: Element;
    currentTarget: Element;
    dropzone: Interactable;
    dragEvent: InteractEvent;
    relatedTarget: Element;
    interaction: Interaction;
    draggable: Interactable;
    timeStamp: number;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */
    constructor(dropStatus: any, dragEvent: any, type: any);
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
