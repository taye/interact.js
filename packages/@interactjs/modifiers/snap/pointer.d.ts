import type { Interaction, InteractionProxy } from '@interactjs/core/Interaction';
import type { ActionName, Point, RectResolvable, Element } from '@interactjs/core/types';
import type { ModifierArg, ModifierState } from '../types';
export interface Offset {
    x: number;
    y: number;
    index: number;
    relativePoint?: Point | null;
}
export interface SnapPosition {
    x?: number;
    y?: number;
    range?: number;
    offset?: Offset;
    [index: string]: any;
}
export type SnapFunction = (x: number, y: number, interaction: InteractionProxy<ActionName>, offset: Offset, index: number) => SnapPosition;
export type SnapTarget = SnapPosition | SnapFunction;
export interface SnapOptions {
    targets?: SnapTarget[];
    range?: number;
    relativePoints?: Point[];
    offset?: Point | RectResolvable<[Interaction]> | 'startCoords';
    offsetWithOrigin?: boolean;
    origin?: RectResolvable<[Element]> | Point;
    endOnly?: boolean;
    enabled?: boolean;
}
export type SnapState = ModifierState<SnapOptions, {
    offsets?: Offset[];
    closest?: any;
    targetFields?: string[][];
}>;
declare function start(arg: ModifierArg<SnapState>): void;
declare function set(arg: ModifierArg<SnapState>): {
    target: any;
    inRange: boolean;
    distance: number;
    range: number;
    delta: {
        x: number;
        y: number;
    };
};
declare const snap: {
    start: typeof start;
    set: typeof set;
    defaults: SnapOptions;
};
declare const _default: {
    (_options?: Partial<SnapOptions>): import("../types").Modifier<SnapOptions, SnapState, "snap", {
        target: any;
        inRange: boolean;
        distance: number;
        range: number;
        delta: {
            x: number;
            y: number;
        };
    }>;
    _defaults: SnapOptions;
    _methods: {
        start: (arg: ModifierArg<SnapState>) => void;
        set: (arg: ModifierArg<SnapState>) => {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        };
        beforeEnd: (arg: ModifierArg<SnapState>) => void | Point;
        stop: (arg: ModifierArg<SnapState>) => void;
    };
};
export default _default;
export { snap };
