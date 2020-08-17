import extend from "../utils/extend.js";
import * as allSnappers from "./all.js";
const snappersPlugin = {
  id: 'snappers',

  install(scope) {
    const {
      interactStatic: interact
    } = scope;
    interact.snappers = extend(interact.snappers || {}, allSnappers);
    interact.createSnapGrid = interact.snappers.grid;
  }

};
export default snappersPlugin;
//# sourceMappingURL=plugin.js.map