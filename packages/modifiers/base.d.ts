import { Scope } from '@interactjs/core/scope';
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
        modifiers?: Modifier[];
    }
}
export interface Modifier<Name extends string = any> {
    options?: {
        enabled?: boolean;
        [key: string]: any;
    };
    methods: {
        start?: (arg: Interact.SignalArg) => void;
        set: (arg: Interact.SignalArg) => void;
        beforeEnd?: (arg: Interact.SignalArg) => void;
        stop?: (arg: Interact.SignalArg) => void;
    };
    name?: Name;
}
declare function install(scope: Scope): void;
declare function start({ interaction, phase }: Interact.SignalArg, pageCoords: Interact.Point): {
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
declare function beforeMove(arg: Interact.SignalArg): void | false;
declare function beforeEnd(arg: Interact.SignalArg): void | false;
declare function stop(arg: Interact.SignalArg): void;
declare function getModifierList(interaction: any): any;
export declare function prepareStates(modifierList: any): any[];
declare function shouldDo(options: any, preEnd?: boolean, requireEndOnly?: boolean, phase?: string): any;
declare function getRectOffset(rect: any, coords: any): {
    left: number;
    top: number;
    right: number;
    bottom: number;
};
declare function makeModifier<Defaults extends {
    enabled?: boolean;
}, Name extends string>(module: {
    defaults?: Defaults;
    [key: string]: any;
}, name?: Name): {
    (options?: Partial<Defaults>): Modifier<Name>;
    _defaults: Defaults;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
declare const _default: {
    id: string;
    install: typeof install;
    startAll: typeof startAll;
    setAll: typeof setAll;
    prepareStates: typeof prepareStates;
    start: typeof start;
    beforeMove: typeof beforeMove;
    beforeEnd: typeof beforeEnd;
    stop: typeof stop;
    shouldDo: typeof shouldDo;
    getModifierList: typeof getModifierList;
    getRectOffset: typeof getRectOffset;
    makeModifier: typeof makeModifier;
};
export default _default;
export { makeModifier, };
