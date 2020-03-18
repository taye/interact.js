export declare type GridOptions = (Partial<Interact.Rect> | Interact.Point) & {
    range?: number;
    limits?: Interact.Rect;
    offset?: Interact.Point;
};
declare const _default: (grid: GridOptions) => import("@interactjs/modifiers/snap/pointer").SnapFunction & {
    grid: GridOptions;
    coordFields: (readonly ["x", "y"] | readonly ["left", "top"] | readonly ["right", "bottom"] | readonly ["width", "height"])[];
};
export default _default;
