import Modification from './Modification';
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        modification?: Modification;
    }
}
declare module '@interactjs/core/InteractEvent' {
    interface InteractEvent {
        modifiers?: Array<{
            name: string;
            [key: string]: any;
        }>;
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
        beforeEnd?: (arg: ModifierArg<State>) => Interact.Point | void;
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
    rect: Interact.FullRect;
    edges: Interact.EdgeOptions;
    state?: State;
    element: Interact.Element;
    pageCoords?: Interact.Point;
    prevCoords?: Interact.Point;
    prevRect?: Interact.FullRect;
    coords?: Interact.Point;
    startOffset?: Interact.Rect;
    preEnd?: boolean;
}
export interface ModifierModule<Defaults extends {
    enabled?: boolean;
}, State extends ModifierState> {
    defaults?: Defaults;
    start?(arg: ModifierArg<State>): void;
    set?(arg: ModifierArg<State>): any;
    beforeEnd?(arg: ModifierArg<State>): Interact.Point | void;
    stop?(arg: ModifierArg<State>): void;
}
export interface ModifierFunction<Defaults extends {
    enabled?: boolean;
}, State extends ModifierState, Name extends string> {
    (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>;
    _defaults: Defaults;
    _methods: ModifierModule<Defaults, State>;
}
export declare function makeModifier<Defaults extends {
    enabled?: boolean;
}, State extends ModifierState, Name extends string>(module: ModifierModule<Defaults, State>, name?: Name): {
    (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>;
    _defaults: Defaults;
    _methods: {
        start: (arg: ModifierArg<State>) => void;
        set: (arg: ModifierArg<State>) => any;
        beforeEnd: (arg: ModifierArg<State>) => void | import("../types/types").Point;
        stop: (arg: ModifierArg<State>) => void;
    };
};
export declare function addEventModifiers({ iEvent, interaction: { modification: { result } } }: {
    iEvent: Interact.InteractEvent<Interact.ActionName, Interact.EventPhase>;
    interaction: Interact.Interaction;
}): void;
declare const modifiersBase: Interact.Plugin;
export default modifiersBase;
