declare module '@interactjs/core/Interaction' {
    interface Interaction {
        holdIntervalHandle?: any;
    }
}
declare function install(scope: any): void;
declare const _default: {
    install: typeof install;
};
export default _default;
