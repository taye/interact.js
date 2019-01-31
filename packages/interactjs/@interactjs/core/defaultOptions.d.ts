export interface Defaults {
    base: BaseDefaults;
    perAction: PerActionDefaults;
}
export interface BaseDefaults extends SubDefaults {
}
export interface PerActionDefaults extends SubDefaults {
}
export interface SubDefaults {
    [key: string]: any;
}
export declare const defaults: Defaults;
export default defaults;
