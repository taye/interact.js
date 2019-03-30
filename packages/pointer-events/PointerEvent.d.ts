import Interaction from '@interactjs/core/Interaction';
/** */
export default class PointerEvent<T extends string> {
    interaction: Interaction;
    timeStamp: number;
    originalEvent: Interact.PointerEventType;
    type: T;
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
    eventable: any;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    /** */
    constructor(type: T, pointer: Interact.PointerType | PointerEvent<any>, event: Interact.PointerEventType, eventTarget: Interact.EventTarget, interaction: Interact.Interaction, timeStamp: number);
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
