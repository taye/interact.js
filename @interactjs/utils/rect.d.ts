export declare function getStringOptionResult(value: any, target: Interact.HasGetRect, element: any): (Node & ParentNode) | import("@interactjs/types/types").Rect;
export declare function resolveRectLike<T extends any[]>(value: Interact.RectResolvable<T>, target?: Interact.HasGetRect, element?: Node, functionArgs?: T): import("@interactjs/types/types").Rect;
export declare function rectToXY(rect: any): {
    x: any;
    y: any;
};
export declare function xywhToTlbr(rect: any): any;
export declare function tlbrToXywh(rect: any): any;
export declare function addEdges(edges: Interact.EdgeOptions, rect: Interact.Rect, delta: Interact.Point): void;
