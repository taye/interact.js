import type { EventPhase, InteractEvent } from '@interactjs/core/InteractEvent';
import type { Interactable } from '@interactjs/core/Interactable';
import type Interaction from '@interactjs/core/Interaction';
import type { Plugin } from '@interactjs/core/scope';
import type { EdgeOptions, FullRect, Point, Rect } from '@interactjs/core/types';
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
declare module '@interactjs/core/options' {
    interface PerActionDefaults {
        modifiers?: Modifier[];
    }
}
export interface Modifier<Defaults = any, State extends ModifierState = any, Name extends string = any, Result = any> {
    options: Defaults;
    methods: {
        start?: (arg: ModifierArg<State>) => void;
        set?: (arg: ModifierArg<State>) => Result;
        beforeEnd?: (arg: ModifierArg<State>) => Point | void;
        stop?: (arg: ModifierArg<State>) => void;
    };
    name?: Name;
    enable: () => Modifier<Defaults, State, Name, Result>;
    disable: () => Modifier<Defaults, State, Name, Result>;
}
export declare type ModifierState<Defaults = unknown, StateProps = unknown, Name extends string = any> = {
    options: Defaults;
    methods?: Modifier<Defaults>['methods'];
    index?: number;
    name?: Name;
} & StateProps;
export interface ModifierArg<State extends ModifierState = ModifierState> {
    interaction: Interaction;
    interactable: Interactable;
    phase: EventPhase;
    rect: FullRect;
    edges: EdgeOptions;
    state: State;
    element: Element;
    pageCoords: Point;
    prevCoords: Point;
    prevRect?: FullRect;
    coords: Point;
    startOffset: Rect;
    preEnd?: boolean;
}
export interface ModifierModule<Defaults extends {
    enabled?: boolean;
}, State extends ModifierState, Result = unknown> {
    defaults?: Defaults;
    start?(arg: ModifierArg<State>): void;
    set?(arg: ModifierArg<State>): Result;
    beforeEnd?(arg: ModifierArg<State>): Point | void;
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
}, State extends ModifierState, Name extends string, Result>(module: ModifierModule<Defaults, State, Result>, name?: Name): {
    (_options?: Partial<Defaults>): Modifier<Defaults, State, Name, Result>;
    _defaults: Defaults;
    _methods: {
        start: (arg: ModifierArg<State>) => void;
        set: (arg: ModifierArg<State>) => Result;
        beforeEnd: (arg: ModifierArg<State>) => void | Point;
        stop: (arg: ModifierArg<State>) => void;
    };
};
export declare function addEventModifiers({ iEvent, interaction, }: {
    iEvent: InteractEvent<any>;
    interaction: Interaction<any>;
}): void;
declare const modifiersBase: Plugin;
export default modifiersBase;
