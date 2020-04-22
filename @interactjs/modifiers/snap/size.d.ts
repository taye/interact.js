import { ModifierArg } from '../base';
import { SnapOptions, SnapState } from './pointer';
export declare type SnapSizeOptions = Pick<SnapOptions, 'targets' | 'offset' | 'endOnly' | 'range' | 'enabled'>;
declare function start(arg: ModifierArg<SnapState>): any;
declare function set(arg: any): {
    target: any;
    inRange: boolean;
    distance: number;
    range: number;
    delta: {
        x: number;
        y: number;
    };
};
declare const snapSize: {
    start: typeof start;
    set: typeof set;
    defaults: Pick<SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
};
declare const _default: {
    (_options?: Partial<Pick<SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">>): import("../base").Modifier<Pick<SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">, import("../base").ModifierState<SnapOptions, {
        offsets?: import("./pointer").Offset[];
        closest?: any;
        targetFields?: string[][];
    }, any>, "snapSize">;
    _defaults: Pick<SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
    _methods: {
        start: (arg: ModifierArg<import("../base").ModifierState<SnapOptions, {
            offsets?: import("./pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
        set: (arg: ModifierArg<import("../base").ModifierState<SnapOptions, {
            offsets?: import("./pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => any;
        beforeEnd: (arg: ModifierArg<import("../base").ModifierState<SnapOptions, {
            offsets?: import("./pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void | import("../../types/types").Point;
        stop: (arg: ModifierArg<import("../base").ModifierState<SnapOptions, {
            offsets?: import("./pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
    };
};
export default _default;
export { snapSize };
