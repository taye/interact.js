import type { HasGetRect, RectResolvable, Rect, Point, FullRect, EdgeOptions } from '@interactjs/core/types';
export declare function getStringOptionResult(value: any, target: HasGetRect, element: Node): ParentNode | Rect;
export declare function resolveRectLike<T extends any[]>(value: RectResolvable<T>, target?: HasGetRect, element?: Node, functionArgs?: T): Rect;
export declare function toFullRect(rect: Rect): FullRect;
export declare function rectToXY(rect: Rect | Point): {
    x: number;
    y: number;
};
export declare function xywhToTlbr<T extends Partial<Rect & Point>>(rect: T): Rect & T;
export declare function tlbrToXywh(rect: Rect & Partial<Point>): Required<Rect> & Point;
export declare function addEdges(edges: EdgeOptions, rect: Rect, delta: Point): void;
