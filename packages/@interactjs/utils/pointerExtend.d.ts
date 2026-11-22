export default function pointerExtend<T>(dest: Partial<T & {
    __set?: Partial<T>;
}>, source: T): Partial<T & {
    __set?: Partial<T>;
}>;
