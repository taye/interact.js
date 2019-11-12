declare function createGrid(grid: (Interact.Rect | Interact.Point) & {
    range?: number;
    limits: Interact.Rect;
    offset: Interact.Point;
}): {
    (x: any, y: any): {
        range: number;
    };
    _isSnapGrid: boolean;
    grid: (import("../../types/types").Point & {
        range?: number;
        limits: import("../../types/types").Rect;
        offset: import("../../types/types").Point;
    }) | (import("../../types/types").Rect & {
        range?: number;
        limits: import("../../types/types").Rect;
        offset: import("../../types/types").Point;
    });
    coordFields: string[][];
};
export default createGrid;
