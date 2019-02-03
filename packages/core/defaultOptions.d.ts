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
}
export interface Options extends BaseDefaults, PerActionDefaults {
}
export interface OptionsArg extends BaseDefaults, Interact.OrBoolean<PerActionDefaults> {
}
export declare const defaults: Defaults;
export default defaults;
