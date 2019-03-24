import { Scope } from '@interactjs/core/scope';
declare type Interactable = import('@interactjs/core/Interactable').default;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        pointerEvents: typeof pointerEventsMethod;
        __backCompatOption: (optionName: string, newValue: any) => any;
    }
}
declare function install(scope: Scope): void;
declare function pointerEventsMethod(this: Interactable, options: any): import("@interactjs/core/Interactable").Interactable;
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
