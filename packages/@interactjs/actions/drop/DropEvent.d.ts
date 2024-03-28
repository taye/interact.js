import { BaseEvent } from '@interactjs/core/BaseEvent';
import type { Interactable } from '@interactjs/core/Interactable';
import type { InteractEvent } from '@interactjs/core/InteractEvent';
import type { Element } from '@interactjs/core/types';
import type { DropState } from './plugin';
export declare class DropEvent extends BaseEvent<'drag'> {
    target: Element;
    dropzone: Interactable;
    dragEvent: InteractEvent<'drag'>;
    relatedTarget: Element;
    draggable: Interactable;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */
    constructor(dropState: DropState, dragEvent: InteractEvent<'drag'>, type: string);
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
