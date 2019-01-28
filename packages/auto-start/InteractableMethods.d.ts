declare type Scope = import('@interactjs/core/scope').Scope;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        getAction: typeof getAction;
        defaultActionChecker: (pointer: any, event: any, interaction: any, element: any) => any;
        styleCursor: typeof styleCursor;
        actionChecker: typeof actionChecker;
        testIgnoreAllow: typeof testIgnoreAllow;
        testAllow: typeof testAllow;
        testIgnore: typeof testIgnore;
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
declare function getAction(pointer: any, event: any, interaction: any, element: any): any;
declare function styleCursor(newValue: any): any;
declare function actionChecker(checker: any): any;
declare function testIgnoreAllow(options: any, interactableElement: any, eventTarget: any): any;
declare function testAllow(allowFrom: any, interactableElement: any, element: any): any;
declare function testIgnore(ignoreFrom: any, interactableElement: any, element: any): any;
declare const _default: {
    install: typeof install;
};
export default _default;
