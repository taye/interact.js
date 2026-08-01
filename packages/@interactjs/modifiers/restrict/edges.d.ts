import type { Point, Rect } from '@interactjs/core/types';
import type { ModifierArg, ModifierState } from '../types';
import type { RestrictOptions } from './pointer';
export interface RestrictEdgesOptions {
    inner: RestrictOptions['restriction'];
    outer: RestrictOptions['restriction'];
    offset?: RestrictOptions['offset'];
    endOnly: boolean;
    enabled?: boolean;
}
export type RestrictEdgesState = ModifierState<RestrictEdgesOptions, {
    inner: Rect;
    outer: Rect;
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
    (_options?: Partial<RestrictEdgesOptions>): import("../types").Modifier<RestrictEdgesOptions, RestrictEdgesState, "restrictEdges", void>;
    _defaults: RestrictEdgesOptions;
    _methods: {
        start: (arg: ModifierArg<RestrictEdgesState>) => void;
        set: (arg: ModifierArg<RestrictEdgesState>) => void;
        beforeEnd: (arg: ModifierArg<RestrictEdgesState>) => void | Point;
        stop: (arg: ModifierArg<RestrictEdgesState>) => void;
    };
};
export default _default;
export { restrictEdges };
