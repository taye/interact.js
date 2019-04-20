import BaseEvent from '@interactjs/core/BaseEvent';
/** */
export default class PointerEvent<T extends string> extends BaseEvent {
    type: T;
    originalEvent: Interact.PointerEventType;
    pointerId: number;
    pointerType: string;
    double: boolean;
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    dt: number;
    eventable: any;
    /** */
    constructor(type: T, pointer: Interact.PointerType | PointerEvent<any>, event: Interact.PointerEventType, eventTarget: Interact.EventTarget, interaction: Interact.Interaction, timeStamp: number);
    _subtractOrigin({ x: originX, y: originY }: {
        x: any;
        y: any;
    }): this;
    _addOrigin({ x: originX, y: originY }: {
        x: any;
        y: any;
    }): this;
    /**
     * Prevent the default behaviour of the original Event
     */
    preventDefault(): void;
}
