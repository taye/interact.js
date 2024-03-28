/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import aspectRatio from './aspectRatio.js';
import restrictEdges from './restrict/edges.js';
import restrict from './restrict/pointer.js';
import restrictRect from './restrict/rect.js';
import restrictSize from './restrict/size.js';
import snapEdges from './snap/edges.js';
import snap from './snap/pointer.js';
import snapSize from './snap/size.js';
import noop from './noop.js';
import "../utils/extend.js";
import "../utils/rect.js";
import './base.js';
import './Modification.js';
import "../utils/clone.js";
import "../utils/is.js";
import "../utils/getOriginXY.js";
import "../utils/hypot.js";

/* eslint-disable n/no-extraneous-import, import/no-unresolved */
var all = {
  aspectRatio,
  restrictEdges,
  restrict,
  restrictRect,
  restrictSize,
  snapEdges,
  snap,
  snapSize,
  spring: noop,
  avoid: noop,
  transform: noop,
  rubberband: noop
};
export { all as default };
//# sourceMappingURL=all.js.map
