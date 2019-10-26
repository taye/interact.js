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
import { ModifierArg } from '../base';
import { SnapState } from './pointer';
declare function start(arg: ModifierArg<SnapState>): any;
declare function set(arg: any): void;
declare const snapEdges: {
    start: typeof start;
    set: typeof set;
    defaults: Pick<import("./pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
};
export default snapEdges;
