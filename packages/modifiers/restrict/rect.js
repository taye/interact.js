import extend from "../../utils/extend.js";
import restrictPointer from "./pointer.js";
const defaults = extend({
  get elementRect() {
    return {
      top: 0,
      left: 0,
      bottom: 1,
      right: 1
    };
  },

  set elementRect(_) {}

}, restrictPointer.defaults);
const restrictRect = {
  start: restrictPointer.start,
  set: restrictPointer.set,
  defaults
};
export default restrictRect;
//# sourceMappingURL=rect.js.map