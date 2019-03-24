declare type Scope = import('@interactjs/core/scope').Scope;
declare module '@interactjs/core/InteractEvent' {
    enum EventPhase {
        Resume = "resume",
        InertiaStart = "inertiastart"
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        inertia?: any;
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
        } | boolean;
    }
}
declare function install(scope: Scope): void;
declare function calcInertia(interaction: Interact.Interaction, state: any): void;
declare function inertiaTick(interaction: Interact.Interaction): void;
declare function smothEndTick(interaction: Interact.Interaction): void;
declare function updateInertiaCoords(interaction: Interact.Interaction): void;
declare const _default: {
    id: string;
    install: typeof install;
    calcInertia: typeof calcInertia;
    inertiaTick: typeof inertiaTick;
    smothEndTick: typeof smothEndTick;
    updateInertiaCoords: typeof updateInertiaCoords;
};
export default _default;
