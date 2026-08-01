import type { Interactable } from '@interactjs/core/Interactable';
import type { Interaction } from '@interactjs/core/Interaction';
import type { Scope, Plugin } from '@interactjs/core/scope';
import type { CursorChecker, Element, ActionName, ActionProps } from '@interactjs/core/types';
import './InteractableMethods';
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        /**
         * Returns or sets the maximum number of concurrent interactions allowed.  By
         * default only 1 interaction is allowed at a time (for backwards
         * compatibility). To allow multiple interactions on the same Interactables and
         * elements, you need to enable it in the draggable, resizable and gesturable
         * `'max'` and `'maxPerElement'` options.
         *
         * @param {number} [newValue] Any number. newValue <= 0 means no interactions.
         */
        maxInteractions: (newValue: any) => any;
    }
}
declare module '@interactjs/core/scope' {
    interface Scope {
        autoStart: AutoStart;
    }
    interface SignalArgs {
        'autoStart:before-start': Omit<SignalArgs['interactions:move'], 'interaction'> & {
            interaction: Interaction<ActionName>;
        };
        'autoStart:prepared': {
            interaction: Interaction;
        };
        'auto-start:check': CheckSignalArg;
    }
}
declare module '@interactjs/core/options' {
    interface BaseDefaults {
        actionChecker?: any;
        cursorChecker?: any;
        styleCursor?: any;
    }
    interface PerActionDefaults {
        manualStart?: boolean;
        max?: number;
        maxPerElement?: number;
        allowFrom?: string | Element;
        ignoreFrom?: string | Element;
        cursorChecker?: CursorChecker;
        mouseButtons?: 0 | 1 | 2 | 4 | 8 | 16;
    }
}
interface CheckSignalArg {
    interactable: Interactable;
    interaction: Interaction;
    element: Element;
    action: ActionProps<ActionName>;
    buttons: number;
}
export interface AutoStart {
    maxInteractions: number;
    withinInteractionLimit: typeof withinInteractionLimit;
    cursorElement: Element;
}
declare function withinInteractionLimit<T extends ActionName>(interactable: Interactable, element: Element, action: ActionProps<T>, scope: Scope): boolean;
declare const autoStart: Plugin;
export default autoStart;
