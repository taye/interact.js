declare function createGrid(grid: (Interact.Rect | Interact.Point) & {
    range?: number;
    limits: Interact.Rect;
    offset: Interact.Point;
}): (x: any, y: any) => {
    range: number;
};
export default createGrid;
