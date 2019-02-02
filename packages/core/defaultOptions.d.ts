export interface Defaults {
    base: BaseDefaults;
    perAction: PerActionDefaults;
    actions: ActionDefaults;
}
export interface ActionDefaults {
    [key: string]: Options;
}
export interface BaseDefaults {
    preventDefault?: 'auto' | 'never' | string;
    deltaSource?: 'page' | 'client';
    [key: string]: any;
}
export interface PerActionDefaults {
    enabled?: boolean;
    origin?: Interact.Point | string | Element;
    listeners?: Interact.Listeners;
    [key: string]: any;
}
export interface Options extends BaseDefaults, PerActionDefaults, ActionDefaults {
}
export declare const defaults: Defaults;
export default defaults;
