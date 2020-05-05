import Interactable from '@interactjs/core/Interactable';
import { ActionProps } from '@interactjs/core/Interaction';
import Scope from '@interactjs/core/scope';
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
    interface PhaseMap {
        reflow?: true;
    }
}
export declare function install(scope: Scope): void;
declare function reflow<T extends Interact.ActionName>(interactable: Interactable, action: ActionProps<T>, scope: Scope): Promise<Interactable>;
declare const _default: import("@interactjs/core/scope").Plugin;
export default _default;
