/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

import drag from"./drag/plugin.prod.js";import drop from"./drop/plugin.prod.js";import gesture from"./gesture/plugin.prod.js";import resize from"./resize/plugin.prod.js";import"../utils/is.prod.js";import"../utils/domUtils.prod.js";import"../utils/extend.prod.js";import"../utils/getOriginXY.prod.js";import"../utils/normalizeListeners.prod.js";import"../utils/pointerUtils.prod.js";import"./drop/DropEvent.prod.js";import"../core/BaseEvent.prod.js";import"../utils/arr.prod.js";var plugin={id:"actions",install(r){r.usePlugin(gesture),r.usePlugin(resize),r.usePlugin(drag),r.usePlugin(drop)}};export{plugin as default};
//# sourceMappingURL=plugin.prod.js.map
