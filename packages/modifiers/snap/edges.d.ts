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
declare function start(arg: any): any;
declare function set(arg: any): void;
declare const snapEdges: {
    start: typeof start;
    set: typeof set;
    defaults: {
        offset: {
            x: number;
            y: number;
        };
    } & Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>;
};
export default snapEdges;
