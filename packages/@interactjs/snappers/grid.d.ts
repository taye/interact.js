import type { Rect, Point } from '@interactjs/core/types';
import type { SnapFunction } from '@interactjs/modifiers/snap/pointer';
export declare type GridOptions = (Partial<Rect> | Point) & {
    range?: number;
    limits?: Rect;
    offset?: Point;
};
declare const _default: (grid: GridOptions) => SnapFunction & {
    grid: GridOptions;
    coordFields: (readonly ["x", "y"] | readonly ["left", "top"] | readonly ["right", "bottom"] | readonly ["width", "height"])[];
};
export default _default;
