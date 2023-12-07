/* interact.js 1.10.26 | https://raw.github.com/taye/interact.js/main/LICENSE */

import extend from"../../utils/extend.prod.js";import*as rectUtils from"../../utils/rect.prod.js";import{makeModifier}from"../base.prod.js";import{restrictEdges}from"./edges.prod.js";import{getRestrictionRect}from"./pointer.prod.js";import"../Modification.prod.js";import"../../utils/clone.prod.js";import"../../utils/is.prod.js";const noMin={width:-1/0,height:-1/0},noMax={width:1/0,height:1/0};function start(t){return restrictEdges.start(t)}function set(t){const{interaction:e,state:o,rect:i,edges:r}=t,{options:s}=o;if(!r)return;const n=rectUtils.tlbrToXywh(getRestrictionRect(s.min,e,t.coords))||noMin,d=rectUtils.tlbrToXywh(getRestrictionRect(s.max,e,t.coords))||noMax;o.options={endOnly:s.endOnly,inner:extend({},restrictEdges.noInner),outer:extend({},restrictEdges.noOuter)},r.top?(o.options.inner.top=i.bottom-n.height,o.options.outer.top=i.bottom-d.height):r.bottom&&(o.options.inner.bottom=i.top+n.height,o.options.outer.bottom=i.top+d.height),r.left?(o.options.inner.left=i.right-n.width,o.options.outer.left=i.right-d.width):r.right&&(o.options.inner.right=i.left+n.width,o.options.outer.right=i.left+d.width),restrictEdges.set(t),o.options=s}const defaults={min:null,max:null,endOnly:!1,enabled:!1},restrictSize={start:start,set:set,defaults:defaults};var restrictSize$1=makeModifier(restrictSize,"restrictSize");export{restrictSize$1 as default,restrictSize};
//# sourceMappingURL=size.prod.js.map
