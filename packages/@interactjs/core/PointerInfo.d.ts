import type { PointerEventType, PointerType } from '@interactjs/core/types';
export declare class PointerInfo {
    id: number;
    pointer: PointerType;
    event: PointerEventType;
    downTime: number;
    downTarget: Node;
    constructor(id: number, pointer: PointerType, event: PointerEventType, downTime: number, downTarget: Node);
}
