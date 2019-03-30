declare module '@interactjs/core/InteractEvent' {
    enum EventPhase {
        Resume = "resume",
        InertiaStart = "inertiastart"
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        inertia?: {
            active: boolean;
            smoothEnd: boolean;
            allowResume: boolean;
            startEvent?: Interact.InteractEvent;
            upCoords: {
                page: Interact.Point;
                client: Interact.Point;
                timeStamp: number;
            };
            xe?: number;
            ye?: number;
            sx?: number;
            sy?: number;
            t0?: number;
            te?: number;
            v0?: number;
            vx0?: number;
            vy0?: number;
            duration?: number;
            modifiedXe?: number;
            modifiedYe?: number;
            lambda_v0?: number;
            one_ve_v0?: number;
            timeout: any;
        };
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
declare function install(scope: Interact.Scope): void;
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
