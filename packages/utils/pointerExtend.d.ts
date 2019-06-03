export interface PointerExtend {
    webkit: RegExp;
    [prefix: string]: RegExp;
}
declare function pointerExtend<PointerExtend>(dest: any, source: any): any;
declare namespace pointerExtend {
    var prefixedPropREs: {
        webkit: RegExp;
    };
}
export default pointerExtend;
export default pointerExtend;
