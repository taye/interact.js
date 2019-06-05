export interface PointerExtend {
    webkit: RegExp;
    [prefix: string]: RegExp;
}
declare function pointerExtend(dest: any, source: any): any;
declare namespace pointerExtend {
    var prefixedPropREs: {
        webkit: RegExp;
    };
}
export default pointerExtend;
