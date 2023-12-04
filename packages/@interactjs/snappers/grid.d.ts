import type { Rect, Point } from '@interactjs/core/types';
import type { SnapFunction } from '@interactjs/modifiers/snap/pointer';
export interface GridOptionsBase {
    range?: number;
    limits?: Rect;
    offset?: Point;
}
export interface GridOptionsXY extends GridOptionsBase {
    x: number;
    y: number;
}
export interface GridOptionsTopLeft extends GridOptionsBase {
    top?: number;
    left?: number;
}
export interface GridOptionsBottomRight extends GridOptionsBase {
    bottom?: number;
    right?: number;
}
export interface GridOptionsWidthHeight extends GridOptionsBase {
    width?: number;
    height?: number;
}
export type GridOptions = GridOptionsXY | GridOptionsTopLeft | GridOptionsBottomRight | GridOptionsWidthHeight;
declare const _default: (grid: GridOptions) => SnapFunction & {
    grid: GridOptions;
    coordFields: (readonly ["x", "y"] | readonly ["left", "top"] | readonly ["right", "bottom"] | readonly ["width", "height"])[];
};
export default _default;
