/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import is from"./is.prod.js";import"./isWindow.prod.js";import"./window.prod.js";function normalize(i,r){let o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:i=>!0,s=arguments.length>3?arguments[3]:void 0;if(s=s||{},is.string(i)&&-1!==i.search(" ")&&(i=split(i)),is.array(i))return i.forEach((i=>normalize(i,r,o,s))),s;if(is.object(i)&&(r=i,i=""),is.func(r)&&o(i))s[i]=s[i]||[],s[i].push(r);else if(is.array(r))for(const t of r)normalize(i,t,o,s);else if(is.object(r))for(const t in r){normalize(split(t).map((r=>`${i}${r}`)),r[t],o,s)}return s}function split(i){return i.trim().split(/ +/)}export{normalize as default};
//# sourceMappingURL=normalizeListeners.prod.js.map
