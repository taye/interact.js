import type { NormalizedListeners } from '@interactjs/utils/normalizeListeners';
import type { ListenersArg, Rect } from '@interactjs/core/types';
export declare class Eventable {
    options: any;
    types: NormalizedListeners;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    global: any;
    constructor(options?: {
        [index: string]: any;
    });
    fire<T extends {
        type: string;
        propagationStopped?: boolean;
    }>(event: T): void;
    on(type: string, listener: ListenersArg): void;
    off(type: string, listener: ListenersArg): void;
    getRect(_element: Element): Rect;
}
