export interface SearchDetails {
    pointer: Interact.PointerType;
    pointerId: number;
    pointerType: string;
    eventType: string;
    eventTarget: Interact.EventTarget;
    curEventTarget: Interact.EventTarget;
    scope: Interact.Scope;
}
declare const finder: {
    methodOrder: string[];
    search(details: any): any;
    simulationResume({ pointerType, eventType, eventTarget, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<any>;
    mouseOrPen({ pointerId, pointerType, eventType, scope }: SearchDetails): any;
    hasPointer({ pointerId, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<any>;
    idle({ pointerType, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<any>;
};
export default finder;
