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
    methodOrder: readonly ["simulationResume", "mouseOrPen", "hasPointer", "idle"];
    search(details: SearchDetails): any;
    simulationResume({ pointerType, eventType, eventTarget, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<"resize" | "drag" | "drop" | "gesture">;
    mouseOrPen({ pointerId, pointerType, eventType, scope }: SearchDetails): any;
    hasPointer({ pointerId, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<"resize" | "drag" | "drop" | "gesture">;
    idle({ pointerType, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<"resize" | "drag" | "drop" | "gesture">;
};
export default finder;
