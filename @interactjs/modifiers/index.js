import base from "./base.js";
import restrictEdgesModule from "./restrict/edges.js";
import restrictModule from "./restrict/pointer.js";
import restrictRectModule from "./restrict/rect.js";
import restrictSizeModule from "./restrict/size.js";
import snapEdgesModule from "./snap/edges.js";
import snapModule from "./snap/pointer.js";
import snapSizeModule from "./snap/size.js";
const {
  makeModifier
} = base;
export const snap = makeModifier(snapModule, 'snap');
export const snapSize = makeModifier(snapSizeModule, 'snapSize');
export const snapEdges = makeModifier(snapEdgesModule, 'snapEdges');
export const restrict = makeModifier(restrictModule, 'restrict');
export const restrictRect = makeModifier(restrictRectModule, 'restrictRect');
export const restrictEdges = makeModifier(restrictEdgesModule, 'restrictEdges');
export const restrictSize = makeModifier(restrictSizeModule, 'restrictSize');
//# sourceMappingURL=index.js.map