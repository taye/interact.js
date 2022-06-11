import type { Point, Listeners, OrBoolean, Element } from '@interactjs/core/types';
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
    context?: Node;
}
export interface PerActionDefaults {
    enabled?: boolean;
    origin?: Point | string | Element;
    listeners?: Listeners;
    allowFrom?: string | Element;
    ignoreFrom?: string | Element;
}
export declare type Options = Partial<BaseDefaults> & Partial<PerActionDefaults> & {
    [P in keyof ActionDefaults]?: Partial<ActionDefaults[P]>;
};
export interface OptionsArg extends BaseDefaults, OrBoolean<Partial<ActionDefaults>> {
}
export declare const defaults: Defaults;
