declare module '@interactjs/core/defaultOptions' {
    interface PerActionDefaults {
        hold?: number;
        delay?: number;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        autoStartHoldTimer?: any;
    }
}
declare function install(scope: Interact.Scope): void;
declare function getHoldDuration(interaction: any): any;
declare const _default: {
    id: string;
    install: typeof install;
    getHoldDuration: typeof getHoldDuration;
};
export default _default;
