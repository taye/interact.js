import Interactable from '../core/Interactable';
import { ActionProps } from '../core/Interaction';
import { Scope } from '../core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        reflow: (action: ActionProps) => ReturnType<typeof reflow>;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        _reflowPromise: Promise<void>;
        _reflowResolve: () => void;
    }
}
declare module '@interactjs/core/InteractEvent' {
    enum EventPhase {
        Reflow = "reflow"
    }
}
export declare function install(scope: Scope): void;
declare function reflow(interactable: Interactable, action: ActionProps, scope: Scope): Promise<Interactable>;
declare const _default: import("@interactjs/core/scope").Plugin;
export default _default;
