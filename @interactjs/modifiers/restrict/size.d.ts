import { ModifierArg, ModifierState } from '../base';
import { RestrictEdgesState } from './edges';
import { RestrictOptions } from './pointer';
export interface RestrictSizeOptions {
    min?: Interact.Size | Interact.Point | RestrictOptions['restriction'];
    max?: Interact.Size | Interact.Point | RestrictOptions['restriction'];
    endOnly: boolean;
    enabled?: boolean;
}
declare function start(arg: ModifierArg<RestrictEdgesState>): void;
export declare type RestrictSizeState = RestrictEdgesState & ModifierState<RestrictSizeOptions & {
    inner: Interact.Rect;
    outer: Interact.Rect;
}, {
    min: Interact.Rect;
    max: Interact.Rect;
}>;
declare function set(arg: ModifierArg<RestrictSizeState>): void;
declare const restrictSize: {
    start: typeof start;
    set: typeof set;
    defaults: RestrictSizeOptions;
};
declare const _default: {
    (_options?: Partial<RestrictSizeOptions>): import("../base").Modifier<RestrictSizeOptions, ModifierState<import("./edges").RestrictEdgesOptions, {
        inner: import("../../types/types").Rect;
        outer: import("../../types/types").Rect;
        offset: import("../../types/types").Rect;
    }, any>, "restrictSize">;
    _defaults: RestrictSizeOptions;
    _methods: {
        start: (arg: ModifierArg<ModifierState<import("./edges").RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => void;
        set: (arg: ModifierArg<ModifierState<import("./edges").RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: ModifierArg<ModifierState<import("./edges").RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => void | import("../../types/types").Point;
        stop: (arg: ModifierArg<ModifierState<import("./edges").RestrictEdgesOptions, {
            inner: import("../../types/types").Rect;
            outer: import("../../types/types").Rect;
            offset: import("../../types/types").Rect;
        }, any>>) => void;
    };
};
export default _default;
export { restrictSize };
