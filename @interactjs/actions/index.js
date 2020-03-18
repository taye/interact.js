import drag from "./drag.js";
import drop from "./drop/index.js";
import gesture from "./gesture.js";
import resize from "./resize.js";
export default {
  id: 'actions',

  install(scope) {
    scope.usePlugin(gesture);
    scope.usePlugin(resize);
    scope.usePlugin(drag);
    scope.usePlugin(drop);
  }

};
export { gesture, resize, drag, drop };
//# sourceMappingURL=index.js.map