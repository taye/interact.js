export declare class PointerInfo {
    id: number;
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    downTime: number;
    downTarget: EventTarget;
    constructor(id: number, pointer: Interact.PointerType, event: Interact.PointerEventType, downTime: number, downTarget: EventTarget);
}
export default PointerInfo;
