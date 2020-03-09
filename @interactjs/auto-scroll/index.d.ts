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
declare module '@interactjs/core/defaultOptions' {
    interface PerActionDefaults {
        autoScroll?: AutoScrollOptions;
    }
}
export interface AutoScrollOptions {
    container?: Window | HTMLElement;
    margin?: number;
    distance?: number;
    interval?: number;
    speed?: number;
    enabled?: boolean;
}
declare const autoScroll: {
    defaults: AutoScrollOptions;
    now: () => number;
    interaction: import("@interactjs/core/Interaction").Interaction<any>;
    i: number;
    x: number;
    y: number;
    isScrolling: boolean;
    prevTime: number;
    margin: number;
    speed: number;
    start(interaction: import("@interactjs/core/Interaction").Interaction<any>): void;
    stop(): void;
    scroll(): void;
    check(interactable: import("@interactjs/core/Interactable").Interactable, actionName: "resize" | "drag" | "drop" | "gesture"): boolean;
    onInteractionMove<T extends "resize" | "drag" | "drop" | "gesture">({ interaction, pointer }: {
        interaction: import("@interactjs/core/Interaction").Interaction<T>;
        pointer: import("@interactjs/types/types").PointerType;
    }): void;
};
export declare function getContainer(value: any, interactable: Interact.Interactable, element: Interact.Element): any;
export declare function getScroll(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSize(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSizeDelta<T extends Interact.ActionName>({ interaction, element }: {
    interaction: Partial<Interact.Interaction<T>>;
    element: Interact.Element;
}, func: any): {
    x: number;
    y: number;
};
declare const autoScrollPlugin: Interact.Plugin;
export default autoScrollPlugin;
