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
export default restrictSize;
