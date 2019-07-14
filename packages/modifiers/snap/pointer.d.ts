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
    offsetWithOrigin: boolean;
    endOnly: boolean;
    enabled: boolean;
}
declare function start(arg: Interact.SignalArg): void;
declare function set(arg: Interact.SignalArg): void;
declare const snap: {
    start: typeof start;
    set: typeof set;
    defaults: SnapOptions;
};
export default snap;
