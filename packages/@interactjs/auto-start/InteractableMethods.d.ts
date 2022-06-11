import type { Interactable } from '@interactjs/core/Interactable';
import type { Interaction } from '@interactjs/core/Interaction';
import type { Scope } from '@interactjs/core/scope';
import type { ActionProps, PointerType, PointerEventType, Element } from '@interactjs/core/types';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        getAction: (this: Interactable, pointer: PointerType, event: PointerEventType, interaction: Interaction, element: Element) => ActionProps | null;
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
declare function install(scope: Scope): void;
declare function styleCursor(this: Interactable): boolean;
declare function styleCursor(this: Interactable, newValue: boolean): typeof this;
declare function actionChecker(this: Interactable, checker: any): any;
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
