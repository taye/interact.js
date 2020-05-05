import drag from "./drag/plugin.js";
import drop from "./drop/plugin.js";
import gesture from "./gesture/plugin.js";
import resize from "./resize/plugin.js";
export default {
  id: 'actions',

  install(scope) {
    scope.usePlugin(gesture);
    scope.usePlugin(resize);
    scope.usePlugin(drag);
    scope.usePlugin(drop);
  }

};
//# sourceMappingURL=plugin.js.map