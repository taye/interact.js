/**
 * @module modifiers/snapEdges
 *
 * @description
 * WOW> This module allows snapping of the edges of targets during resize
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
import clone from "../../utils/clone.js";
import extend from "../../utils/extend.js";
import { makeModifier } from "../base.js";
import { snapSize } from "./size.js";

function start(arg) {
  const {
    edges
  } = arg;

  if (!edges) {
    return null;
  }

  arg.state.targetFields = arg.state.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];
  return snapSize.start(arg);
}

const snapEdges = {
  start,
  set: snapSize.set,
  defaults: extend(clone(snapSize.defaults), {
    targets: null,
    range: null,
    offset: {
      x: 0,
      y: 0
    }
  })
};
export default makeModifier(snapEdges, 'snapEdges');
export { snapEdges };
//# sourceMappingURL=edges.js.map