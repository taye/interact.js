import Modification from '@interactjs/modifiers/Modification';
import * as modifiers from '@interactjs/modifiers/base';
declare module '@interactjs/core/InteractEvent' {
    interface PhaseMap {
        resume?: true;
        inertiastart?: true;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        inertia?: InertiaState;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface PerActionDefaults {
        inertia?: {
            enabled?: boolean;
            resistance?: number;
            minSpeed?: number;
            endSpeed?: number;
            allowResume?: true;
            smoothEndDuration?: number;
        };
    }
}
declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'interactions:before-action-inertiastart': Omit<Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>, 'iEvent'>;
        'interactions:action-inertiastart': Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>;
        'interactions:after-action-inertiastart': Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>;
        'interactions:before-action-resume': Omit<Interact.DoPhaseArg<Interact.ActionName, 'resume'>, 'iEvent'>;
        'interactions:action-resume': Interact.DoPhaseArg<Interact.ActionName, 'resume'>;
        'interactions:after-action-resume': Interact.DoPhaseArg<Interact.ActionName, 'resume'>;
    }
}
export declare class InertiaState {
    private readonly interaction;
    active: boolean;
    isModified: boolean;
    smoothEnd: boolean;
    allowResume: boolean;
    modification: Modification;
    modifierCount: number;
    modifierArg: modifiers.ModifierArg;
    startCoords: Interact.Point;
    t0: number;
    v0: number;
    te: number;
    targetOffset: Interact.Point;
    modifiedOffset: Interact.Point;
    currentOffset: Interact.Point;
    lambda_v0?: number;
    one_ve_v0?: number;
    timeout: number;
    constructor(interaction: Interact.Interaction);
    start(event: Interact.PointerEventType): boolean;
    startInertia(): void;
    startSmoothEnd(): void;
    inertiaTick(): void;
    smoothEndTick(): void;
    resume({ pointer, event, eventTarget }: Interact.SignalArgs['interactions:down']): void;
    end(): void;
    stop(): void;
}
declare const inertia: Interact.Plugin;
export default inertia;
