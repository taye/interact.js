import drag from "./drag.js";
import drop from "./drop/index.js";
import gesture from "./gesture.js";
import resize from "./resize.js";

function install(scope) {
  scope.usePlugin(gesture);
  scope.usePlugin(resize);
  scope.usePlugin(drag);
  scope.usePlugin(drop);
}

const id = 'actions';
export { id, install, gesture, resize, drag, drop };
//# sourceMappingURL=index.js.map