/**
 * @module modifiers/snapEdges
 *
 * @description
 * This modifier allows snapping of the edges of targets during resize
 * interactions.
 *
 * ```js
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
 * ```
 */
import type { ModifierArg, ModifierModule } from '../types';
import type { SnapOptions, SnapState } from './pointer';
import { snapSize } from './size';
export type SnapEdgesOptions = Pick<SnapOptions, 'targets' | 'range' | 'offset' | 'endOnly' | 'enabled'>;
declare const snapEdges: ModifierModule<SnapEdgesOptions, SnapState, ReturnType<typeof snapSize.set>>;
declare const _default: {
    (_options?: Partial<SnapEdgesOptions>): import("../types").Modifier<SnapEdgesOptions, SnapState, "snapEdges", {
        target: any;
        inRange: boolean;
        distance: number;
        range: number;
        delta: {
            x: number;
            y: number;
        };
    }>;
    _defaults: SnapEdgesOptions;
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
export { snapEdges };
