/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import clone from "../../utils/clone.js";
import extend from "../../utils/extend.js";
import { makeModifier } from '../base.js';
import { snapSize } from './size.js';
import '../Modification.js';
import "../../utils/rect.js";
import "../../utils/is.js";
import './pointer.js';
import "../../utils/getOriginXY.js";
import "../../utils/hypot.js";

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
    targets: undefined,
    range: undefined,
    offset: {
      x: 0,
      y: 0
    }
  })
};
var snapEdges$1 = makeModifier(snapEdges, 'snapEdges');
export { snapEdges$1 as default, snapEdges };
//# sourceMappingURL=edges.js.map
