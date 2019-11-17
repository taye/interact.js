import { ModifierModule, ModifierState } from '../base';
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
export declare function getRestrictionRect(value: any, interaction: any, coords?: Interact.Point): import("../../types/types").Rect;
declare const restrict: ModifierModule<RestrictOptions, RestrictState>;
export default restrict;
