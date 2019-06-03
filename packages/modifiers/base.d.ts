declare module '@interactjs/core/scope' {
    interface Scope {
        modifiers?: any;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        modifiers?: {
            states: any[];
            offsets: any;
            startOffset: any;
            startDelta: Interact.Point;
            result?: {
                delta: {
                    x: number;
                    y: number;
                };
                rectDelta: {
                    left: number;
                    right: number;
                    top: number;
                    bottom: number;
                };
                coords: Interact.Point;
                changed: boolean;
            };
            endPrevented: boolean;
        };
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface PerActionDefaults {
        modifiers?: Array<ReturnType<typeof makeModifier>>;
    }
}
export declare function startAll(arg: any): void;
export declare function setAll(arg: Partial<Interact.SignalArg>): {
    delta: {
        x: number;
        y: number;
    };
    rectDelta: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    coords: import("../types/types").Point;
    changed: boolean;
};
export declare function prepareStates(modifierList: any): any[];
declare function makeModifier<Options extends {
    enabled?: boolean;
    [key: string]: any;
}>(module: {
    defaults: Options;
    [key: string]: any;
}, name?: string): {
    (options?: Partial<Options>): {
        options: Partial<Options>;
        methods: {
            start: any;
            set: any;
            beforeEnd: any;
            stop: any;
        };
        name: string;
    };
    _defaults: Options;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
declare const _default: import("@interactjs/core/scope").Plugin;
export default _default;
export { makeModifier, };
