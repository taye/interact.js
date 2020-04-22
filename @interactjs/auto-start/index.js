import autoStart from "./base.js";
import dragAxis from "./dragAxis.js";
import hold from "./hold.js";
export default {
  id: 'auto-start',

  install(scope) {
    scope.usePlugin(autoStart);
    scope.usePlugin(hold);
    scope.usePlugin(dragAxis);
  }

};
export { autoStart, hold, dragAxis };
//# sourceMappingURL=index.js.map