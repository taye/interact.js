declare module '@interactjs/core/Interactable' {
    interface Interactable {
        getAction: typeof getAction;
        defaultActionChecker: (pointer: any, event: any, interaction: any, element: any) => any;
        styleCursor: typeof styleCursor;
        actionChecker: typeof actionChecker;
        ignoreFrom: (...args: any) => boolean;
        allowFrom: (...args: any) => boolean;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        pointerIsDown: boolean;
    }
}
declare function install(scope: Interact.Scope): void;
declare function getAction(this: Interact.Interactable, pointer: Interact.PointerType, event: Interact.PointerEventType, interaction: Interact.Interaction, element: Interact.Element): Interact.ActionProps;
declare function styleCursor(this: Interact.Interactable, newValue?: boolean): any;
declare function actionChecker(this: Interact.Interactable, checker: any): any;
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
