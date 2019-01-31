import { Action } from '@interactjs/core/Interaction';
import { Scope } from '@interactjs/core/scope';
type Interactable = import('@interactjs/core/Interactable').default;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        reflow: (action: Action) => ReturnType<typeof reflow>;
    }
}
export declare function install(scope: Scope): void;
declare function reflow(interactable: Interactable, action: Action, scope: Scope): any;
declare const _default: {
    install: typeof install;
};
export default _default;
