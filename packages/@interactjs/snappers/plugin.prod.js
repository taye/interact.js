/* interact.js 1.10.26 | https://raw.github.com/taye/interact.js/main/LICENSE */

import extend from"../utils/extend.prod.js";import{a as allSnappers}from"./all-1a4e2d09.js";import"./edgeTarget.prod.js";import"./elements.prod.js";import"./grid.prod.js";const snappersPlugin={id:"snappers",install(p){const{interactStatic:r}=p;r.snappers=extend(r.snappers||{},allSnappers),r.createSnapGrid=r.snappers.grid}};export{snappersPlugin as default};
//# sourceMappingURL=plugin.prod.js.map
