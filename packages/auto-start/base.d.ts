import * as utils from '@interactjs/utils';
declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        maxInteractions: (newValue: any) => any;
    }
}
declare module '@interactjs/core/scope' {
    interface Scope {
        autoStart: AutoStart;
        maxInteractions: (...args: any) => any;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface BaseDefaults {
        actionChecker?: any;
        styleCursor?: any;
    }
    interface PerActionDefaults {
        manualStart?: boolean;
        max?: number;
        maxPerElement?: number;
        allowFrom?: string | Element;
        ignoreFrom?: string | Element;
        mouseButtons?: 0 | 1 | 2 | 4 | 16;
    }
}
export interface AutoStart {
    maxInteractions: number;
    withinInteractionLimit: typeof withinInteractionLimit;
    cursorElement: HTMLElement;
    signals: utils.Signals;
}
declare function install(scope: Interact.Scope): void;
declare function validateAction(action: any, interactable: any, element: any, eventTarget: any, scope: any): any;
declare function withinInteractionLimit(interactable: Interact.Interactable, element: Element, action: any, scope: Interact.Scope): boolean;
declare function maxInteractions(newValue: any, scope: Interact.Scope): any;
declare const _default: {
    install: typeof install;
    maxInteractions: typeof maxInteractions;
    withinInteractionLimit: typeof withinInteractionLimit;
    validateAction: typeof validateAction;
};
export default _default;
