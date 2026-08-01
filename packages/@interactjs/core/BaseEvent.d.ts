import type { Interactable } from '@interactjs/core/Interactable';
import type { Interaction, InteractionProxy } from '@interactjs/core/Interaction';
import type { ActionName } from '@interactjs/core/types';
export declare class BaseEvent<T extends ActionName | null = never> {
    type: string;
    target: EventTarget;
    currentTarget: Node;
    interactable: Interactable;
    timeStamp: number;
    immediatePropagationStopped: boolean;
    propagationStopped: boolean;
    constructor(interaction: Interaction<T>);
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
export interface BaseEvent<T extends ActionName | null = never> {
    interaction: InteractionProxy<T>;
}
