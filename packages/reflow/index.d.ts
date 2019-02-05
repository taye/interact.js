import Interactable from '@interactjs/core/Interactable';
import { Action } from '@interactjs/core/Interaction';
import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        reflow: (action: Action) => ReturnType<typeof reflow>;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        _reflowResolve: () => void;
    }
}
export declare function install(scope: Scope): void;
declare function reflow(interactable: Interactable, action: Action, scope: Scope): any;
declare const _default: {
    install: typeof install;
};
export default _default;
