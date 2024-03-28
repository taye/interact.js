/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import snappers from"../snappers/plugin.prod.js";import all from"./all.prod.js";import modifiersBase from"./base.prod.js";import"./aspectRatio.prod.js";import"../utils/extend.prod.js";import"../utils/rect.prod.js";import"./Modification.prod.js";import"../utils/clone.prod.js";import"./restrict/edges.prod.js";import"./restrict/pointer.prod.js";import"../utils/is.prod.js";import"./restrict/rect.prod.js";import"./restrict/size.prod.js";import"./snap/edges.prod.js";import"./snap/size.prod.js";import"./snap/pointer.prod.js";import"../utils/getOriginXY.prod.js";import"../utils/hypot.prod.js";import"./noop.prod.js";const modifiers={id:"modifiers",install(r){const{interactStatic:o}=r;r.usePlugin(modifiersBase),r.usePlugin(snappers),o.modifiers=all;for(const o in all){const{_defaults:s,_methods:i}=all[o];s._methods=i,r.defaults.perAction[o]=s}}};export{modifiers as default};
//# sourceMappingURL=plugin.prod.js.map
