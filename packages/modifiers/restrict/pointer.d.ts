import { ModifierArg, ModifierState } from '../base';
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
declare function start({ rect, startOffset, state, interaction, pageCoords }: ModifierArg<RestrictState>): void;
declare function set({ coords, interaction, state }: {
    coords: any;
    interaction: any;
    state: any;
}): void;
declare function getRestrictionRect(value: any, interaction: any, coords?: Interact.Point): import("../../types/types").Rect;
declare const restrict: {
    start: typeof start;
    set: typeof set;
    getRestrictionRect: typeof getRestrictionRect;
    defaults: RestrictOptions;
};
export default restrict;
