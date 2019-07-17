import { ModifierArg, ModifierState } from '../base';
export interface SnapPosition {
    x: number;
    y: number;
    range?: number;
}
export declare type SnapFunction = (x: number, y: number, interaction: Interact.Interaction, offset: Interact.Point, index: number) => SnapPosition;
export declare type SnapTarget = SnapPosition | SnapFunction;
export interface SnapOptions {
    targets: SnapTarget[];
    range: number;
    relativePoints: Interact.Point[];
    offset: Interact.Point | Interact.RectResolvable<[Interact.Interaction]> | 'startCoords';
    offsetWithOrigin?: boolean;
    origin: Interact.RectResolvable<[Element]> | Interact.Point;
    endOnly?: boolean;
    enabled?: boolean;
}
export declare type SnapState = ModifierState<SnapOptions, {
    offsets?: Interact.Point[];
    realX?: number;
    realY?: number;
    range?: number;
    closest?: any;
    targetFields?: string[][];
}>;
declare function start(arg: ModifierArg<SnapState>): void;
declare function set(arg: ModifierArg<SnapState>): void;
declare const snap: {
    start: typeof start;
    set: typeof set;
    defaults: SnapOptions;
};
export default snap;
