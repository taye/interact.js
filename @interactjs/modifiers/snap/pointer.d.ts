import { ModifierArg, ModifierState } from '../base';
export interface Offset {
    x: number;
    y: number;
    index: number;
    relativePoint?: Interact.Point;
}
export interface SnapPosition {
    x?: number;
    y?: number;
    range?: number;
    offset?: Offset;
    [index: string]: any;
}
export declare type SnapFunction = (x: number, y: number, interaction: Interact.Interaction, offset: Offset, index: number) => SnapPosition;
export declare type SnapTarget = SnapPosition | SnapFunction;
export interface SnapOptions {
    targets: SnapTarget[];
    range: number;
    relativePoints: Interact.Point[];
    offset: Interact.Point | Interact.RectResolvable<[Interact.Interaction]> | 'startCoords';
    offsetWithOrigin?: boolean;
    origin: Interact.RectResolvable<[Interact.Element]> | Interact.Point;
    endOnly?: boolean;
    enabled?: boolean;
}
export declare type SnapState = ModifierState<SnapOptions, {
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
    (_options?: Partial<SnapOptions>): import("../base").Modifier<SnapOptions, ModifierState<SnapOptions, {
        offsets?: Offset[];
        closest?: any;
        targetFields?: string[][];
    }, any>, "snap">;
    _defaults: SnapOptions;
    _methods: {
        start: (arg: ModifierArg<ModifierState<SnapOptions, {
            offsets?: Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
        set: (arg: ModifierArg<ModifierState<SnapOptions, {
            offsets?: Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => any;
        beforeEnd: (arg: ModifierArg<ModifierState<SnapOptions, {
            offsets?: Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void | import("../../types/types").Point;
        stop: (arg: ModifierArg<ModifierState<SnapOptions, {
            offsets?: Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
    };
};
export default _default;
export { snap };
