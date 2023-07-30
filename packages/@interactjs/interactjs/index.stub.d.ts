import interact from '@interactjs/interact';
export default interact;
declare const _: {
    actions: {
        id: string;
        install(scope: import("@interactjs/core/scope").Scope): void;
    };
    autoScroll: import("@interactjs/core/scope").Plugin;
    autoStart: {
        id: string;
        install(scope: import("@interactjs/core/scope").Scope): void;
    };
    interactablePreventDefault: {
        id: string;
        install: typeof import("@interactjs/core/interactablePreventDefault").install;
        listeners: any;
    };
    devTools: import("@interactjs/core/scope").Plugin;
    inertia: import("@interactjs/core/scope").Plugin;
    interact: import("@interactjs/core/InteractStatic").InteractStatic;
    modifiers: import("@interactjs/core/scope").Plugin;
    offset: import("@interactjs/core/scope").Plugin;
    pointerEvents: import("@interactjs/core/scope").Plugin;
    reflow: import("@interactjs/core/scope").Plugin;
};
export declare type __internal_plugin_types__ = typeof _;
