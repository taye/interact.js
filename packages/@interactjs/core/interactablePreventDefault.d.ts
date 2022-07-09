import type { Interactable } from '@interactjs/core/Interactable';
import type { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        preventDefault: typeof preventDefault;
        checkAndPreventDefault: (event: Event) => void;
    }
}
declare type PreventDefaultValue = 'always' | 'never' | 'auto';
declare function preventDefault(this: Interactable): PreventDefaultValue;
declare function preventDefault(this: Interactable, newValue: PreventDefaultValue): typeof this;
export declare function install(scope: Scope): void;
declare const _default: {
    id: string;
    install: typeof install;
    listeners: any;
};
export default _default;
