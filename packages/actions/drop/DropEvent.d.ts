import BaseEvent from '../../core/BaseEvent';
import Interactable from '../../core/Interactable';
import InteractEvent from '../../core/InteractEvent';
import Interaction from '../../core/Interaction';
import { ActionName } from '../../core/scope';
declare class DropEvent extends BaseEvent {
    target: Interact.Element;
    dropzone: Interactable;
    dragEvent: InteractEvent<ActionName.Drag>;
    relatedTarget: Interact.Element;
    draggable: Interactable;
    timeStamp: number;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */
    constructor(dropState: Interaction['dropState'], dragEvent: InteractEvent, type: string);
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
