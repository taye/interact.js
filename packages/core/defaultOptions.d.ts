export interface Defaults {
    base: BaseDefaults;
    perAction: PerActionDefaults;
    actions: ActionDefaults;
}
export interface ActionDefaults {
}
export interface BaseDefaults {
    preventDefault?: 'auto' | 'never' | string;
    deltaSource?: 'page' | 'client';
    context?: Window | Document | Element;
}
export interface PerActionDefaults {
    enabled?: boolean;
    origin?: Interact.Point | string | Element;
    listeners?: Interact.Listeners;
    allowFrom?: string | Element;
    ignoreFrom?: string | Element;
}
export declare type Options = Partial<BaseDefaults> & Partial<PerActionDefaults> & {
    [P in keyof ActionDefaults]?: Partial<ActionDefaults[P]>;
};
export interface OptionsArg extends BaseDefaults, Interact.OrBoolean<PerActionDefaults> {
}
export declare const defaults: Defaults;
export default defaults;
