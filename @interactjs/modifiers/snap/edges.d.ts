/**
 * @module modifiers/snapEdges
 *
 * @description
 * This module allows snapping of the edges of targets during resize
 * interactions.
 *
 * @example
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
 *   },
 * })
 *
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [
 *       interact.snappers.grid({
 *        top: 50,
 *        left: 50,
 *        bottom: 100,
 *        right: 100,
 *       }),
 *     ],
 *   },
 * })
 */
import { ModifierArg, ModifierModule } from '../base';
import { SnapOptions, SnapState } from './pointer';
export declare type SnapEdgesOptions = Pick<SnapOptions, 'targets' | 'range' | 'offset' | 'endOnly' | 'enabled'>;
declare const snapEdges: ModifierModule<SnapEdgesOptions, SnapState>;
declare const _default: {
    (_options?: Partial<Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">>): import("../base").Modifier<Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">, import("../base").ModifierState<SnapOptions, {
        offsets?: import("./pointer").Offset[];
        closest?: any;
        targetFields?: string[][];
    }, any>, "snapEdges">;
    _defaults: Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">;
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
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: ModifierArg<import("../base").ModifierState<SnapOptions, {
            offsets?: import("./pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
    };
};
export default _default;
export { snapEdges };
