"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PointerInfo = void 0;
class PointerInfo {
  id;
  pointer;
  event;
  downTime;
  downTarget;
  constructor(id, pointer, event, downTime, downTarget) {
    this.id = id;
    this.pointer = pointer;
    this.event = event;
    this.downTime = downTime;
    this.downTarget = downTarget;
  }
}
exports.PointerInfo = PointerInfo;
//# sourceMappingURL=PointerInfo.js.map