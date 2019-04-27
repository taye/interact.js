import Interactable from './Interactable';
import Interaction from './Interaction';
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
    _interaction: Interaction<T>;
    timeStamp: any;
    immediatePropagationStopped: boolean;
    propagationStopped: boolean;
    readonly interaction: Pick<Interaction<any>, "start" | "end" | "stop" | "pointerIsDown" | "pointerWasMoved" | "move" | "interacting" | "_proxy">;
    constructor(interaction: any);
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
