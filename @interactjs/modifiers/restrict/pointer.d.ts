import { ModifierArg, ModifierModule, ModifierState } from '../base';
export interface RestrictOptions {
    restriction: Interact.RectResolvable<[number, number, Interact.Interaction]>;
    elementRect: Interact.Rect;
    offset: Interact.Rect;
    endOnly: boolean;
    enabled?: boolean;
}
export declare type RestrictState = ModifierState<RestrictOptions, {
    offset: Interact.Rect;
}>;
export declare function getRestrictionRect(value: Interact.RectResolvable<[number, number, Interact.Interaction]>, interaction: Interact.Interaction, coords?: Interact.Point): import("@interactjs/types/types").Rect;
declare const restrict: ModifierModule<RestrictOptions, RestrictState>;
declare const _default: {
    (_options?: Partial<RestrictOptions>): import("../base").Modifier<RestrictOptions, ModifierState<RestrictOptions, {
        offset: import("@interactjs/types/types").Rect;
    }, any>, "restrict">;
    _defaults: RestrictOptions;
    _methods: {
        start: (arg: ModifierArg<ModifierState<RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
        set: (arg: ModifierArg<ModifierState<RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: ModifierArg<ModifierState<RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: ModifierArg<ModifierState<RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
    };
};
export default _default;
export { restrict };
