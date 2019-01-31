import autoStart from './base';
import dragAxis from './dragAxis';
import hold from './hold';
function install(scope) {
    autoStart.install(scope);
    hold.install(scope);
    dragAxis.install(scope);
}
export { autoStart, hold, dragAxis, install, };
//# sourceMappingURL=index.js.map