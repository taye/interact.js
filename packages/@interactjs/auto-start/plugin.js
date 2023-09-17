import autoStart from './base';
import dragAxis from './dragAxis';
import hold from './hold';
export default {
  id: 'auto-start',

  install(scope) {
    scope.usePlugin(autoStart);
    scope.usePlugin(hold);
    scope.usePlugin(dragAxis);
  }

};
//# sourceMappingURL=plugin.js.map