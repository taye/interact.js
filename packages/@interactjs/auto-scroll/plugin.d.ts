import type { Interactable } from '@interactjs/core/Interactable';
import type Interaction from '@interactjs/core/Interaction';
import type { Plugin } from '@interactjs/core/scope';
import type { ActionName, PointerType } from '@interactjs/core/types';
declare module '@interactjs/core/scope' {
    interface Scope {
        autoScroll: typeof autoScroll;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        autoScroll?: typeof autoScroll;
    }
}
declare module '@interactjs/core/options' {
    interface PerActionDefaults {
        autoScroll?: AutoScrollOptions;
    }
}
export interface AutoScrollOptions {
    container?: Window | HTMLElement | string;
    margin?: number;
    distance?: number;
    interval?: number;
    speed?: number;
    enabled?: boolean;
}
declare const autoScroll: {
    defaults: AutoScrollOptions;
    now: () => number;
    interaction: Interaction<keyof import("@interactjs/core/types").ActionMap>;
    i: number;
    x: number;
    y: number;
    isScrolling: boolean;
    prevTime: number;
    margin: number;
    speed: number;
    start(interaction: Interaction): void;
    stop(): void;
    scroll(): void;
    check(interactable: Interactable, actionName: ActionName): boolean;
    onInteractionMove<T extends keyof import("@interactjs/core/types").ActionMap>({ interaction, pointer, }: {
        interaction: Interaction<T>;
        pointer: PointerType;
    }): void;
};
export declare function getContainer(value: any, interactable: Interactable, element: Element): any;
export declare function getScroll(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSize(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSizeDelta<T extends ActionName>({ interaction, element, }: {
    interaction: Partial<Interaction<T>>;
    element: Element;
}, func: any): {
    x: number;
    y: number;
};
declare const autoScrollPlugin: Plugin;
export default autoScrollPlugin;
