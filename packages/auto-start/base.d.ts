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
declare function withinInteractionLimit(interactable: Interact.Interactable, element: Element, action: any, scope: Interact.Scope): boolean;
declare const _default: import("@interactjs/core/scope").Plugin;
export default _default;
