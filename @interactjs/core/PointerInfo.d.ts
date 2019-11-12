export declare class PointerInfo {
    id: number;
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    downTime: number;
    downTarget: Interact.EventTarget;
    constructor(id: number, pointer: Interact.PointerType, event: Interact.PointerEventType, downTime: number, downTarget: Interact.EventTarget);
}
export default PointerInfo;
