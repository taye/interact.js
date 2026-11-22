import type Interaction from '@interactjs/core/Interaction';
import type { RectResolvable, Rect, Point } from '@interactjs/core/types';
import type { ModifierArg, ModifierModule, ModifierState } from '../types';
export interface RestrictOptions {
    restriction: RectResolvable<[number, number, Interaction]>;
    elementRect: Rect;
    offset: Rect;
    endOnly: boolean;
    enabled?: boolean;
}
export type RestrictState = ModifierState<RestrictOptions, {
    offset: Rect;
}>;
export declare function getRestrictionRect(value: RectResolvable<[number, number, Interaction]>, interaction: Interaction, coords?: Point): Rect;
declare const restrict: ModifierModule<RestrictOptions, RestrictState>;
declare const _default: {
    (_options?: Partial<RestrictOptions>): import("../types").Modifier<RestrictOptions, RestrictState, "restrict", unknown>;
    _defaults: RestrictOptions;
    _methods: {
        start: (arg: ModifierArg<RestrictState>) => void;
        set: (arg: ModifierArg<RestrictState>) => unknown;
        beforeEnd: (arg: ModifierArg<RestrictState>) => void | Point;
        stop: (arg: ModifierArg<RestrictState>) => void;
    };
};
export default _default;
export { restrict };
