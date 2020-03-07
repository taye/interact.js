import Interactable from './Interactable';
export declare class BaseEvent<T extends Interact.ActionName = any> {
    type: string;
    target: EventTarget;
    currentTarget: EventTarget;
    interactable: Interactable;
    _interaction: Interact.Interaction<T>;
    timeStamp: any;
    immediatePropagationStopped: boolean;
    propagationStopped: boolean;
    readonly interaction: Pick<import("@interactjs/core/Interaction").Interaction<"resize" | "drag" | "drop" | "gesture">, "end" | "stop" | "start" | "move" | "interactable" | "element" | "prepared" | "pointerIsDown" | "pointerWasMoved" | "_proxy" | "interacting" | "offsetBy">;
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
