/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import extend from"../../utils/extend.prod.js";import{makeModifier}from"../base.prod.js";import{restrict}from"./pointer.prod.js";import"../Modification.prod.js";import"../../utils/clone.prod.js";import"../../utils/rect.prod.js";import"../../utils/is.prod.js";const defaults=extend({get elementRect(){return{top:0,left:0,bottom:1,right:1}},set elementRect(t){}},restrict.defaults),restrictRect={start:restrict.start,set:restrict.set,defaults:defaults};var restrictRect$1=makeModifier(restrictRect,"restrictRect");export{restrictRect$1 as default,restrictRect};
//# sourceMappingURL=rect.prod.js.map
