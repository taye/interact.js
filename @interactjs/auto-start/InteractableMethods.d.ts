declare module '@interactjs/core/Interactable' {
    interface Interactable {
        getAction: (this: Interact.Interactable, pointer: Interact.PointerType, event: Interact.PointerEventType, interaction: Interact.Interaction, element: Interact.Element) => Interact.ActionProps | null;
        styleCursor: typeof styleCursor;
        actionChecker: typeof actionChecker;
        ignoreFrom: {
            (...args: any[]): Interactable;
            (): boolean;
        };
        allowFrom: {
            (...args: any[]): Interactable;
            (): boolean;
        };
    }
}
declare function install(scope: Interact.Scope): void;
declare function styleCursor(this: Interact.Interactable): boolean;
declare function styleCursor(this: Interact.Interactable, newValue: boolean): typeof this;
declare function actionChecker(this: Interact.Interactable, checker: any): any;
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
