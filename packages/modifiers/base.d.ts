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
export interface Modifier<Defaults = any, State extends ModifierState = any, Name extends string = any> {
    options?: Defaults;
    methods: {
        start?: (arg: ModifierArg<State>) => void;
        set: (arg: ModifierArg<State>) => void;
        beforeEnd?: (arg: ModifierArg<State>) => boolean;
        stop?: (arg: ModifierArg<State>) => void;
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
export interface ModifierArg<State extends ModifierState = ModifierState> extends Pick<Interact.SignalArg, 'interaction' | 'interactable' | 'phase' | 'rect'> {
    states?: State[];
    state?: State;
    element: Interact.Element;
    pageCoords?: Interact.Point;
    prevCoords?: Interact.Point;
    coords?: Interact.Point;
    startOffset?: Interact.Rect;
    preEnd?: boolean;
    requireEndOnly?: boolean;
}
declare function install(scope: Scope): void;
declare function start({ interaction, phase }: Interact.SignalArg, pageCoords: Interact.Point, prevCoords: Interact.Point): {
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
export declare function startAll(arg: ModifierArg<any>): void;
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
        start?: (arg: ModifierArg<any>) => void;
        set: (arg: ModifierArg<any>) => void;
        beforeEnd?: (arg: ModifierArg<any>) => boolean;
        stop?: (arg: ModifierArg<any>) => void;
    };
    index?: number;
    name?: any;
}[];
export declare function setCoords(arg: {
    interaction: Interact.Interaction;
    phase: Interact.EventPhase;
    rect?: Interact.Rect;
}): void;
export declare function restoreCoords({ interaction: { coords, rect, modifiers } }: {
    interaction: Interact.Interaction;
}): void;
declare function shouldDo(options: any, preEnd?: boolean, requireEndOnly?: boolean, phase?: string): any;
declare function getRectOffset(rect: any, coords: any): {
    left: number;
    top: number;
    right: number;
    bottom: number;
};
export declare function makeModifier<Defaults extends {
    enabled?: boolean;
}, State extends ModifierState, Name extends string>(module: {
    defaults?: Defaults;
    [key: string]: any;
}, name?: Name): {
    (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>;
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
