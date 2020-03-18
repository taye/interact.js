export declare class BaseEvent<T extends Interact.ActionName = any> {
    type: string;
    target: EventTarget;
    currentTarget: EventTarget;
    interactable: Interact.Interactable;
    _interaction: Interact.Interaction<T>;
    timeStamp: any;
    immediatePropagationStopped: boolean;
    propagationStopped: boolean;
    readonly interaction: Interact.InteractionProxy<T>;
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
