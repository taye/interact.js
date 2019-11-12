import autoStart from "./base.js";
import dragAxis from "./dragAxis.js";
import hold from "./hold.js";

function install(scope) {
  scope.usePlugin(autoStart);
  scope.usePlugin(hold);
  scope.usePlugin(dragAxis);
}

const id = 'auto-start';
export { id, install, autoStart, hold, dragAxis };
//# sourceMappingURL=index.js.map