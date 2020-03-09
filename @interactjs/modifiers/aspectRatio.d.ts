import { Modifier, ModifierModule, ModifierState } from './base';
import Modification from './Modification';
export interface AspectRatioOptions {
    ratio?: number | 'preserve';
    equalDelta?: boolean;
    modifiers?: Modifier[];
    enabled?: boolean;
}
export declare type AspectRatioState = ModifierState<AspectRatioOptions, {
    startCoords: Interact.Point;
    startRect: Interact.Rect;
    linkedEdges: Interact.EdgeOptions;
    ratio: number;
    equalDelta: boolean;
    xIsPrimaryAxis: boolean;
    edgeSign: 1 | -1;
    subModification: Modification;
}>;
declare const aspectRatio: ModifierModule<AspectRatioOptions, AspectRatioState>;
declare const _default: {
    (_options?: Partial<AspectRatioOptions>): Modifier<AspectRatioOptions, ModifierState<AspectRatioOptions, {
        startCoords: import("@interactjs/types/types").Point;
        startRect: import("@interactjs/types/types").Rect;
        linkedEdges: import("@interactjs/types/types").EdgeOptions;
        ratio: number;
        equalDelta: boolean;
        xIsPrimaryAxis: boolean;
        edgeSign: 1 | -1;
        subModification: Modification;
    }, any>, "aspectRatio">;
    _defaults: AspectRatioOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>>) => void;
    };
};
export default _default;
export { aspectRatio };
