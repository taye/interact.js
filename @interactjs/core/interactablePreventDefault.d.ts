declare module '@interactjs/core/Interactable' {
    interface Interactable {
        preventDefault: typeof preventDefault;
        checkAndPreventDefault: (event: Event) => void;
    }
}
declare type PreventDefaultValue = 'always' | 'never' | 'auto';
declare function preventDefault(this: Interact.Interactable): PreventDefaultValue;
declare function preventDefault(this: Interact.Interactable, newValue: PreventDefaultValue): typeof this;
export declare function install(scope: Interact.Scope): void;
declare const _default: {
    id: string;
    install: typeof install;
    listeners: any;
};
export default _default;
