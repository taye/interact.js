import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        reflow?: (Action: any) => ReturnType<typeof reflow>;
    }
}
export declare function install(scope: Scope): void;
declare function reflow(interactable: any, action: any, scope: Scope): any;
declare const _default: {
    install: typeof install;
};
export default _default;
