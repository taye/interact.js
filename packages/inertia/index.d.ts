declare type Scope = import('@interactjs/core/scope').Scope;
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
declare function install(scope: Scope): void;
declare function calcInertia(interaction: any, state: any): void;
declare function inertiaTick(interaction: any): void;
declare function smothEndTick(interaction: any): void;
declare function updateInertiaCoords(interaction: any): void;
declare const _default: {
    install: typeof install;
    calcInertia: typeof calcInertia;
    inertiaTick: typeof inertiaTick;
    smothEndTick: typeof smothEndTick;
    updateInertiaCoords: typeof updateInertiaCoords;
};
export default _default;
