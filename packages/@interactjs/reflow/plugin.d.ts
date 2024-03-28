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
        /**
         * ```js
         * const interactable = interact(target)
         * const drag = { name: drag, axis: 'x' }
         * const resize = { name: resize, edges: { left: true, bottom: true }
         *
         * interactable.reflow(drag)
         * interactable.reflow(resize)
         * ```
         *
         * Start an action sequence to re-apply modifiers, check drops, etc.
         *
         * @param { Object } action The action to begin
         * @param { string } action.name The name of the action
         * @returns { Promise } A promise that resolves to the `Interactable` when actions on all targets have ended
         */
        reflow<T extends ActionName>(action: ActionProps<T>): ReturnType<typeof doReflow>;
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
declare function doReflow<T extends ActionName>(interactable: Interactable, action: ActionProps<T>, scope: Scope): Promise<Interactable>;
declare const reflow: Plugin;
export default reflow;
