import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/scope' {
    interface Scope {
        modifiers?: any;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        modifiers?: {
            states: ModifierState[];
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
export interface Modifier<Defaults = any, Name extends string = any> {
    options?: Defaults;
    methods: {
        start?: (arg: Interact.SignalArg) => void;
        set: (arg: Interact.SignalArg) => void;
        beforeEnd?: (arg: Interact.SignalArg) => boolean | void;
        stop?: (arg: Interact.SignalArg) => void;
    };
    name?: Name;
}
export declare type ModifierState<Defaults = {}, StateProps extends {
    [prop: string]: any;
} = {}, Name extends string = any> = {
    options: Defaults;
    methods?: Modifier<Defaults>['methods'];
    index?: number;
    name?: Name;
} & StateProps;
export interface ModifierArg<State extends ModifierState> extends Interact.SignalArg {
    state: State;
    pageCoords?: Interact.Point;
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
export declare function prepareStates(modifierList: Modifier[]): {
    options: {};
    methods?: {
        start?: (arg: import("../utils/Signals").SignalArg<any>) => void;
        set: (arg: import("../utils/Signals").SignalArg<any>) => void;
        beforeEnd?: (arg: import("../utils/Signals").SignalArg<any>) => boolean | void;
        stop?: (arg: import("../utils/Signals").SignalArg<any>) => void;
    };
    index?: number;
    name?: any;
}[];
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
    (_options?: Partial<Defaults>): Modifier<Defaults, Name>;
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
