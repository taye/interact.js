/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import{resolveRectLike,rectToXY}from"./rect.prod.js";import"./domUtils.prod.js";import"./browser.prod.js";import"./domObjects.prod.js";import"./is.prod.js";import"./isWindow.prod.js";import"./window.prod.js";import"./extend.prod.js";function getOriginXY(o,r,i){const t=i&&o.options[i],e=t&&t.origin||o.options.origin,p=resolveRectLike(e,o,r,[o&&r]);return rectToXY(p)||{x:0,y:0}}export{getOriginXY as default};
//# sourceMappingURL=getOriginXY.prod.js.map
