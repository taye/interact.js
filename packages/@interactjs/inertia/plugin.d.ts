import type { Interaction, DoPhaseArg } from '@interactjs/core/Interaction';
import type { SignalArgs, Plugin } from '@interactjs/core/scope';
import type { ActionName, Point, PointerEventType } from '@interactjs/core/types';
import '@interactjs/modifiers/base';
import '@interactjs/offset/plugin';
import { Modification } from '@interactjs/modifiers/Modification';
import type { ModifierArg } from '@interactjs/modifiers/types';
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
declare module '@interactjs/core/options' {
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
        'interactions:before-action-inertiastart': Omit<DoPhaseArg<ActionName, 'inertiastart'>, 'iEvent'>;
        'interactions:action-inertiastart': DoPhaseArg<ActionName, 'inertiastart'>;
        'interactions:after-action-inertiastart': DoPhaseArg<ActionName, 'inertiastart'>;
        'interactions:before-action-resume': Omit<DoPhaseArg<ActionName, 'resume'>, 'iEvent'>;
        'interactions:action-resume': DoPhaseArg<ActionName, 'resume'>;
        'interactions:after-action-resume': DoPhaseArg<ActionName, 'resume'>;
    }
}
export declare class InertiaState {
    active: boolean;
    isModified: boolean;
    smoothEnd: boolean;
    allowResume: boolean;
    modification: Modification;
    modifierCount: number;
    modifierArg: ModifierArg;
    startCoords: Point;
    t0: number;
    v0: number;
    te: number;
    targetOffset: Point;
    modifiedOffset: Point;
    currentOffset: Point;
    lambda_v0?: number;
    one_ve_v0?: number;
    timeout: number;
    readonly interaction: Interaction;
    constructor(interaction: Interaction);
    start(event: PointerEventType): boolean;
    startInertia(): void;
    startSmoothEnd(): void;
    onNextFrame(tickFn: () => void): void;
    inertiaTick(): void;
    smoothEndTick(): void;
    resume({ pointer, event, eventTarget }: SignalArgs['interactions:down']): void;
    end(): void;
    stop(): void;
}
declare const inertia: Plugin;
export default inertia;
