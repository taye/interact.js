import Interactable from '@interactjs/core/Interactable';
import { ActionProps } from '@interactjs/core/Interaction';
import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        reflow: (action: ActionProps) => ReturnType<typeof reflow>;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        _reflowResolve: () => void;
    }
}
export declare function install(scope: Scope): void;
declare function reflow(interactable: Interactable, action: ActionProps, scope: Scope): any;
declare const _default: {
    install: typeof install;
};
export default _default;
