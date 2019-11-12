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
export interface ModifierArg<State extends ModifierState = ModifierState> {
    interaction: Interact.Interaction;
    interactable: Interact.Interactable;
    phase: Interact.EventPhase;
    rect: Interact.Rect;
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
export interface ModifierModule<Defaults extends {
    enabled?: boolean;
}, State extends ModifierState> {
    defaults?: Defaults;
    start?(arg: ModifierArg<State>): void;
    set?(arg: ModifierArg<State>): void;
    beforeEnd?(arg: ModifierArg<State>): boolean;
    stop?(arg: ModifierArg<State>): void;
}
declare function start({ interaction, phase }: {
    interaction: Interact.Interaction;
    phase: Interact.EventPhase;
}, pageCoords: Interact.Point, prevCoords: Interact.Point): {
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
export declare function setAll(arg: ModifierArg): {
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
declare function beforeMove(arg: Partial<Interact.DoPhaseArg> & {
    interaction: Interact.Interaction;
    phase: Interact.EventPhase;
    preEnd?: boolean;
    skipModifiers?: number;
    prevCoords?: Interact.Point;
    modifiedCoords?: Interact.Point;
}): void | false;
declare function beforeEnd(arg: Interact.DoPhaseArg & {
    noPreEnd?: boolean;
    state?: ModifierState;
}): void | false;
declare function stop(arg: {
    interaction: Interact.Interaction;
    phase: Interact.EventPhase;
}): void;
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
}, State extends ModifierState, Name extends string>(module: ModifierModule<Defaults, State>, name?: Name): {
    (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>;
    _defaults: Defaults;
    _methods: {
        start: (arg: ModifierArg<State>) => void;
        set: (arg: ModifierArg<State>) => void;
        beforeEnd: (arg: ModifierArg<State>) => boolean;
        stop: (arg: ModifierArg<State>) => void;
    };
};
declare const _default: {
    id: string;
    install: (scope: any) => void;
    listeners: {
        'interactions:new': ({ interaction }: {
            interaction: any;
        }) => void;
        'interactions:before-action-start': (arg: any) => void;
        'interactions:action-resume': (arg: any) => void;
        'interactions:after-action-move': typeof restoreCoords;
        'interactions:before-action-move': typeof beforeMove;
        'interactions:after-action-start': typeof restoreCoords;
        'interactions:before-action-end': typeof beforeEnd;
        'interactions:stop': typeof stop;
    };
    before: string;
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
