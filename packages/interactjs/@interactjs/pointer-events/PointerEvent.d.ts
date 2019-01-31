import Interaction from '@interactjs/core/Interaction';
/** */
export default class PointerEvent {
    interaction: Interaction;
    timeStamp: number;
    originalEvent: Interact.PointerEventType;
    type: string;
    pointerId: number;
    pointerType: string;
    target: Node | Window;
    currentTarget: Node | Window;
    double: boolean;
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    dt: number;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    /** */
    constructor(type: any, pointer: any, event: any, eventTarget: any, interaction: any);
    subtractOrigin({ x: originX, y: originY }: {
        x: any;
        y: any;
    }): this;
    addOrigin({ x: originX, y: originY }: {
        x: any;
        y: any;
    }): this;
    /**
     * Prevent the default behaviour of the original Event
     */
    preventDefault(): void;
    /**
     * Don't call listeners on the remaining targets
     */
    stopPropagation(): void;
    /**
     * Don't call any other listeners (even on the current target)
     */
    stopImmediatePropagation(): void;
}
