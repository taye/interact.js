declare type Scope = import('@interactjs/core/scope').Scope;
declare function install(scope: Scope): void;
declare function getHoldDuration(interaction: any): any;
declare const _default: {
    install: typeof install;
    getHoldDuration: typeof getHoldDuration;
};
export default _default;
