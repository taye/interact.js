import { ModifierArg, ModifierState } from '../base';
import { RestrictOptions } from './pointer';
export interface RestrictEdgesOptions {
    inner: RestrictOptions['restriction'];
    outer: RestrictOptions['restriction'];
    offset?: RestrictOptions['offset'];
    endOnly: boolean;
    enabled?: boolean;
}
export declare type RestrictEdgesState = ModifierState<RestrictEdgesOptions, {
    inner: Interact.Rect;
    outer: Interact.Rect;
    offset: RestrictEdgesOptions['offset'];
}>;
declare function start({ interaction, state }: ModifierArg<RestrictEdgesState>): void;
declare function set({ coords, interaction, state }: ModifierArg<RestrictEdgesState>): void;
declare const restrictEdges: {
    noInner: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    };
    noOuter: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    };
    getRestrictionRect: (value: any, interaction: any, coords?: import("../../types/types").Point) => import("../../types/types").Rect;
    start: typeof start;
    set: typeof set;
    defaults: RestrictEdgesOptions;
};
export default restrictEdges;
