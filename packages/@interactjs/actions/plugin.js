import drag from './drag/plugin';
import drop from './drop/plugin';
import gesture from './gesture/plugin';
import resize from './resize/plugin';
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