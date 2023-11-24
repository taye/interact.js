import type { Interactable } from '@interactjs/core/Interactable';
import type { DoAnyPhaseArg } from '@interactjs/core/Interaction';
import type { Scope, Plugin } from '@interactjs/core/scope';
import type { ActionName, ActionProps } from '@interactjs/core/types';
declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'interactions:before-action-reflow': Omit<DoAnyPhaseArg, 'iEvent'>;
        'interactions:action-reflow': DoAnyPhaseArg;
        'interactions:after-action-reflow': DoAnyPhaseArg;
    }
}
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        reflow: <T extends ActionName>(action: ActionProps<T>) => ReturnType<typeof doReflow>;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        _reflowPromise: Promise<void>;
        _reflowResolve: (...args: unknown[]) => void;
    }
}
declare module '@interactjs/core/InteractEvent' {
    interface PhaseMap {
        reflow?: true;
    }
}
export declare function install(scope: Scope): void;
declare function doReflow<T extends ActionName>(interactable: Interactable, action: ActionProps<T>, scope: Scope): Promise<Interactable>;
declare const reflow: Plugin;
export default reflow;
