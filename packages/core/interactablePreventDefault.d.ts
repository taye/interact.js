declare module '@interactjs/core/Interactable' {
    interface Interactable {
        preventDefault: typeof preventDefault;
        checkAndPreventDefault: (event: Event) => void;
    }
}
declare function preventDefault(this: Interact.Interactable, newValue?: 'always' | 'never' | 'auto'): string | import("@interactjs/core/Interactable").Interactable;
export declare function install(scope: Interact.Scope): void;
export declare type Install = typeof install;
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
