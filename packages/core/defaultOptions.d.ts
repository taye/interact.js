export interface Defaults {
    base: BaseDefaults;
    perAction: PerActionDefaults;
}
export interface BaseDefaults extends SubDefaults {
    preventDefault?: 'auto' | 'never' | string;
    deltaSource?: 'page' | 'client';
}
export interface PerActionDefaults extends SubDefaults {
    enabled?: boolean;
    origin?: Interact.Point | string | Element;
}
export interface SubDefaults {
    [key: string]: any;
}
export interface Options extends BaseDefaults, PerActionDefaults {
}
export declare const defaults: Defaults;
export default defaults;
