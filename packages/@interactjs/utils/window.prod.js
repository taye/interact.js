/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import isWindow from"./isWindow.prod.js";let realWindow,win;function init(n){realWindow=n;const i=n.document.createTextNode("");i.ownerDocument!==n.document&&"function"==typeof n.wrap&&n.wrap(i)===i&&(n=n.wrap(n)),win=n}function getWindow(n){if(isWindow(n))return n;return(n.ownerDocument||n).defaultView||win.window}"undefined"!=typeof window&&window&&init(window);export{getWindow,init,realWindow,win as window};
//# sourceMappingURL=window.prod.js.map
