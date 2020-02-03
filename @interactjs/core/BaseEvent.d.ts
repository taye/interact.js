import Interactable from './Interactable';
import { ActionName } from './scope';
export declare enum EventPhase {
    Start = "start",
    Move = "move",
    End = "end",
    _NONE = ""
}
export declare class BaseEvent<T extends ActionName = any> {
    type: string;
    target: EventTarget;
    currentTarget: EventTarget;
    interactable: Interactable;
    _interaction: Interact.Interaction<T>;
    timeStamp: any;
    immediatePropagationStopped: boolean;
    propagationStopped: boolean;
    readonly interaction: Pick<import("@interactjs/core/Interaction").Interaction<any>, "end" | "stop" | "start" | "interactable" | "element" | "prepared" | "pointerIsDown" | "pointerWasMoved" | "_proxy" | "move" | "interacting">;
    constructor(interaction: Interact.Interaction);
    preventDefault(): void;
    /**
     * Don't call any other listeners (even on the current target)
     */
    stopPropagation(): void;
    /**
     * Don't call listeners on the remaining targets
     */
    stopImmediatePropagation(): void;
}
export default BaseEvent;
