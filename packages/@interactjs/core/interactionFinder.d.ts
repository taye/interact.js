import type Interaction from '@interactjs/core/Interaction';
import type { Scope } from '@interactjs/core/scope';
import type { PointerType } from '@interactjs/core/types';
export interface SearchDetails {
    pointer: PointerType;
    pointerId: number;
    pointerType: string;
    eventType: string;
    eventTarget: EventTarget;
    curEventTarget: EventTarget;
    scope: Scope;
}
declare const finder: {
    methodOrder: readonly ["simulationResume", "mouseOrPen", "hasPointer", "idle"];
    search(details: SearchDetails): any;
    simulationResume({ pointerType, eventType, eventTarget, scope }: SearchDetails): Interaction<keyof import("@interactjs/core/types").ActionMap>;
    mouseOrPen({ pointerId, pointerType, eventType, scope }: SearchDetails): any;
    hasPointer({ pointerId, scope }: SearchDetails): Interaction<keyof import("@interactjs/core/types").ActionMap>;
    idle({ pointerType, scope }: SearchDetails): Interaction<keyof import("@interactjs/core/types").ActionMap>;
};
export default finder;
