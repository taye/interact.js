import { NormalizedListeners } from '@interactjs/utils/normalizeListeners';
declare class Eventable {
    options: any;
    types: NormalizedListeners;
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    global: any;
    constructor(options?: {
        [index: string]: any;
    });
    fire(event: any): void;
    on(type: string, listener: Interact.ListenersArg): void;
    off(type: string, listener: Interact.ListenersArg): void;
}
export default Eventable;
