declare function pointerExtend<T>(dest: Partial<T>, source: T): Partial<T>;
declare namespace pointerExtend {
    var prefixedPropREs: {
        [prefix: string]: RegExp;
    };
}
export default pointerExtend;
