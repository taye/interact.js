import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        gesturable?: (options: any) => Interactable | {
            [key: string]: any;
        };
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface Defaults {
        gesture?: any;
    }
}
declare module '@interactjs/core/scope' {
    interface Actions {
        gesture?: typeof gesture;
    }
}
declare function install(scope: Scope): void;
declare const gesture: {
    defaults: {};
    checker: (_pointer: any, _event: any, _interactable: any, _element: any, interaction: any) => {
        name: string;
    };
    getCursor: () => string;
};
declare const _default: {
    install: typeof install;
};
export default _default;
