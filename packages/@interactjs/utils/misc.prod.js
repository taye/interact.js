/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import{window as win}from"./window.prod.js";import"./isWindow.prod.js";function warnOnce(n,o){let i=!1;return function(){return i||(win.console.warn(o),i=!0),n.apply(this,arguments)}}function copyAction(n,o){return n.name=o.name,n.axis=o.axis,n.edges=o.edges,n}const sign=n=>n>=0?1:-1;export{copyAction,sign,warnOnce};
//# sourceMappingURL=misc.prod.js.map
