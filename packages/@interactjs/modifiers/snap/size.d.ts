import type { ModifierArg } from '../types';
import type { SnapOptions, SnapState } from './pointer';
export type SnapSizeOptions = Pick<SnapOptions, 'targets' | 'offset' | 'endOnly' | 'range' | 'enabled'>;
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
    defaults: SnapSizeOptions;
};
declare const _default: {
    (_options?: Partial<SnapSizeOptions>): import("../types").Modifier<SnapSizeOptions, SnapState, "snapSize", {
        target: any;
        inRange: boolean;
        distance: number;
        range: number;
        delta: {
            x: number;
            y: number;
        };
    }>;
    _defaults: SnapSizeOptions;
    _methods: {
        start: (arg: ModifierArg<SnapState>) => void;
        set: (arg: ModifierArg<SnapState>) => {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        };
        beforeEnd: (arg: ModifierArg<SnapState>) => void | import("@interactjs/core/types").Point;
        stop: (arg: ModifierArg<SnapState>) => void;
    };
};
export default _default;
export { snapSize };
