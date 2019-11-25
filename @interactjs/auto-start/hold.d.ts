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
    listeners: {
        'interactions:new': ({ interaction }: {
            interaction: any;
        }) => void;
        'autoStart:prepared': ({ interaction }: {
            interaction: any;
        }) => void;
        'interactions:move': ({ interaction, duplicate }: {
            interaction: any;
            duplicate: any;
        }) => void;
        'autoStart:before-start': ({ interaction }: {
            interaction: any;
        }) => void;
    };
    getHoldDuration: typeof getHoldDuration;
};
export default _default;
