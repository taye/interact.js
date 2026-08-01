import type { Point, Listeners, OrBoolean, Element, Rect } from '@interactjs/core/types';
export interface Defaults {
    base: BaseDefaults;
    perAction: PerActionDefaults;
    actions: ActionDefaults;
}
export interface ActionDefaults {
}
export interface BaseDefaults {
    preventDefault?: 'always' | 'never' | 'auto';
    deltaSource?: 'page' | 'client';
    context?: Node;
    getRect?: (element: Element) => Rect;
}
export interface PerActionDefaults {
    enabled?: boolean;
    origin?: Point | string | Element;
    listeners?: Listeners;
    allowFrom?: string | Element;
    ignoreFrom?: string | Element;
}
export type Options = Partial<BaseDefaults> & Partial<PerActionDefaults> & {
    [P in keyof ActionDefaults]?: Partial<ActionDefaults[P]>;
};
export interface OptionsArg extends BaseDefaults, OrBoolean<Partial<ActionDefaults>> {
}
export declare const defaults: Defaults;
