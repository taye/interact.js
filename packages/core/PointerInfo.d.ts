export declare class PointerInfo {
    id: number;
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    downTime: number;
    downTarget: Node;
    constructor(id: number, pointer: Interact.PointerType, event: Interact.PointerEventType, downTime: number, downTarget: Node);
}
export default PointerInfo;
