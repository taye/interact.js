declare type Scope = import('@interactjs/core/scope').Scope;
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
    container?: Element;
    margin?: number;
    distance?: number;
    interval?: number;
}
declare function install(scope: Scope): void;
declare const autoScroll: {
    defaults: AutoScrollOptions;
    now: () => number;
    interaction: any;
    i: any;
    x: number;
    y: number;
    isScrolling: boolean;
    prevTime: number;
    margin: number;
    speed: number;
    start(interaction: import("@interactjs/core/Interaction").Interaction<any>): void;
    stop(): void;
    scroll(): void;
    check(interactable: any, actionName: any): any;
    onInteractionMove({ interaction, pointer }: {
        interaction: any;
        pointer: any;
    }): void;
};
export declare function getContainer(value: any, interactable: any, element: any): any;
export declare function getScroll(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSize(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSizeDelta({ interaction, element }: {
    interaction: any;
    element: any;
}, func: any): {
    x: number;
    y: number;
};
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
