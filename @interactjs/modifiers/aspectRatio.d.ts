/**
 * @module modifiers/aspectRatio
 *
 * @description
 * This module forces elements to be resized with a specified dx/dy ratio.
 *
 * @example
 * interact(target).resizable({
 *   modifiers: [
 *     interact.modifiers.snapSize({
 *       targets: [ interact.createSnapGrid({ x: 20, y: 20 }) ],
 *     }),
 *     interact.aspectRatio({ ratio: 'preserve' }),
 *   ],
 * });
 */
import Modification from './Modification';
import { Modifier, ModifierModule, ModifierState } from './base';
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
        startCoords: import("../types").Point;
        startRect: import("../types").Rect;
        linkedEdges: import("../types").EdgeOptions;
        ratio: number;
        equalDelta: boolean;
        xIsPrimaryAxis: boolean;
        edgeSign: 1 | -1;
        subModification: Modification;
    }, any>, "aspectRatio">;
    _defaults: AspectRatioOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("../types").Point;
            startRect: import("../types").Rect;
            linkedEdges: import("../types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("../types").Point;
            startRect: import("../types").Rect;
            linkedEdges: import("../types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("../types").Point;
            startRect: import("../types").Rect;
            linkedEdges: import("../types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>>) => void | import("../types").Point;
        stop: (arg: import("./base").ModifierArg<ModifierState<AspectRatioOptions, {
            startCoords: import("../types").Point;
            startRect: import("../types").Rect;
            linkedEdges: import("../types").EdgeOptions;
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
