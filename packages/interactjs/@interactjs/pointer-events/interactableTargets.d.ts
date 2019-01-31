import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        pointerEvents: typeof pointerEventsMethod;
        __backCompatOption: (string: any, any: any) => any;
    }
}
declare function install(scope: Scope): void;
declare function pointerEventsMethod(options: any): any;
declare const _default: {
    install: typeof install;
};
export default _default;
