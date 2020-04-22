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
declare function start({ interaction, startOffset, state }: ModifierArg<RestrictEdgesState>): void;
declare function set({ coords, edges, interaction, state }: ModifierArg<RestrictEdgesState>): void;
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
    start: typeof start;
    set: typeof set;
    defaults: RestrictEdgesOptions;
};
declare const _default: {
    (_options?: Partial<RestrictEdgesOptions>): import("../base").Modifier<RestrictEdgesOptions, ModifierState<RestrictEdgesOptions, {
        inner: import("../../types/types").Rect;
        outer: import("../../types/types").Rect;
        offset: import("../../types/types").Rect;
    }, any>, "restrictEdges">;
    _defaults: RestrictEdgesOptions;
    _methods: {
        start: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => void;
        set: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => void | import("../../types/types").Point;
        stop: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => void;
    };
};
export default _default;
export { restrictEdges };
