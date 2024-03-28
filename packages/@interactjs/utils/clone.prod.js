/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import{from}from"./arr.prod.js";import is from"./is.prod.js";import"./isWindow.prod.js";import"./window.prod.js";function clone(o){const r={};for(const i in o){const n=o[i];is.plainObject(n)?r[i]=clone(n):is.array(n)?r[i]=from(n):r[i]=n}return r}export{clone as default};
//# sourceMappingURL=clone.prod.js.map
