declare type Scope = import('@interactjs/core/scope').Scope;
declare type Interaction = import('@interactjs/core/Interaction').default;
declare type Interactable = import('@interactjs/core/Interactable').default;
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
declare function install(scope: Scope): void;
declare function getAction(this: Interactable, pointer: Interact.PointerType, event: Interact.PointerEventType, interaction: Interaction, element: Element): Interact.ActionProps;
declare function styleCursor(this: Interactable, newValue?: boolean): any;
declare function actionChecker(this: Interactable, checker: any): any;
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
