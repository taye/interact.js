import { BaseEvent } from '@interactjs/core/BaseEvent';
import type Interaction from '@interactjs/core/Interaction';
import type { PointerEventType, PointerType, Point } from '@interactjs/core/types';
export declare class PointerEvent<T extends string = any> extends BaseEvent<never> {
    type: T;
    originalEvent: PointerEventType;
    pointerId: number;
    pointerType: string;
    double: boolean;
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    dt: number;
    eventable: any;
    [key: string]: any;
    constructor(type: T, pointer: PointerType | PointerEvent<any>, event: PointerEventType, eventTarget: Node, interaction: Interaction<never>, timeStamp: number);
    _subtractOrigin({ x: originX, y: originY }: Point): this;
    _addOrigin({ x: originX, y: originY }: Point): this;
    /**
     * Prevent the default behaviour of the original Event
     */
    preventDefault(): void;
}
