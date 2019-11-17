export declare function getStringOptionResult(value: any, target: Interact.HasGetRect, element: any): any;
export declare function resolveRectLike<T extends any[]>(value: Interact.RectResolvable<T>, target?: Interact.HasGetRect, element?: Interact.Element, functionArgs?: T): import("../types/types").Rect;
export declare function rectToXY(rect: any): {
    x: any;
    y: any;
};
export declare function xywhToTlbr(rect: any): any;
export declare function tlbrToXywh(rect: any): any;
declare const _default: {
    getStringOptionResult: typeof getStringOptionResult;
    resolveRectLike: typeof resolveRectLike;
    rectToXY: typeof rectToXY;
    xywhToTlbr: typeof xywhToTlbr;
    tlbrToXywh: typeof tlbrToXywh;
};
export default _default;
