export interface PointerExtend {
    webkit: RegExp;
    [prefix: string]: RegExp;
}
export declare function pointerExtend<PointerExtend>(dest: any, source: any): any;
export declare namespace pointerExtend {
    var prefixedPropREs: {
        webkit: RegExp;
    };
}
export default pointerExtend;
