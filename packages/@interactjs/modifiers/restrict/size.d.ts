import type { Point, Rect, Size } from '@interactjs/core/types';
import type { ModifierArg, ModifierState } from '../types';
import type { RestrictEdgesState } from './edges';
import type { RestrictOptions } from './pointer';
export interface RestrictSizeOptions {
    min?: Size | Point | RestrictOptions['restriction'];
    max?: Size | Point | RestrictOptions['restriction'];
    endOnly: boolean;
    enabled?: boolean;
}
declare function start(arg: ModifierArg<RestrictEdgesState>): void;
export type RestrictSizeState = RestrictEdgesState & ModifierState<RestrictSizeOptions & {
    inner: Rect;
    outer: Rect;
}, {
    min: Rect;
    max: Rect;
}>;
declare function set(arg: ModifierArg<RestrictSizeState>): void;
declare const restrictSize: {
    start: typeof start;
    set: typeof set;
    defaults: RestrictSizeOptions;
};
declare const _default: {
    (_options?: Partial<RestrictSizeOptions>): import("../types").Modifier<RestrictSizeOptions, RestrictEdgesState, "restrictSize", void>;
    _defaults: RestrictSizeOptions;
    _methods: {
        start: (arg: ModifierArg<RestrictEdgesState>) => void;
        set: (arg: ModifierArg<RestrictEdgesState>) => void;
        beforeEnd: (arg: ModifierArg<RestrictEdgesState>) => void | Point;
        stop: (arg: ModifierArg<RestrictEdgesState>) => void;
    };
};
export default _default;
export { restrictSize };
