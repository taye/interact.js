export declare function getStringOptionResult(value: any, interactable: any, element: any): any;
export declare function resolveRectLike<T extends any[]>(value: Interact.RectResolvable<T>, interactable?: any, element?: any, functionArgs?: T): import("../types/types").Rect;
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
