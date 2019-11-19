function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import BaseEvent from "../core/BaseEvent.js";
import * as pointerUtils from "../utils/pointerUtils.js";
/** */

export default class PointerEvent extends BaseEvent {
  /** */
  constructor(type, pointer, event, eventTarget, interaction, timeStamp) {
    super(interaction);

    _defineProperty(this, "type", void 0);

    _defineProperty(this, "originalEvent", void 0);

    _defineProperty(this, "pointerId", void 0);

    _defineProperty(this, "pointerType", void 0);

    _defineProperty(this, "double", void 0);

    _defineProperty(this, "pageX", void 0);

    _defineProperty(this, "pageY", void 0);

    _defineProperty(this, "clientX", void 0);

    _defineProperty(this, "clientY", void 0);

    _defineProperty(this, "dt", void 0);

    _defineProperty(this, "eventable", void 0);

    pointerUtils.pointerExtend(this, event);

    if (event !== pointer) {
      pointerUtils.pointerExtend(this, pointer);
    }

    this.timeStamp = timeStamp;
    this.originalEvent = event;
    this.type = type;
    this.pointerId = pointerUtils.getPointerId(pointer);
    this.pointerType = pointerUtils.getPointerType(pointer);
    this.target = eventTarget;
    this.currentTarget = null;

    if (type === 'tap') {
      const pointerIndex = interaction.getPointerIndex(pointer);
      this.dt = this.timeStamp - interaction.pointers[pointerIndex].downTime;
      const interval = this.timeStamp - interaction.tapTime;
      this.double = !!(interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === this.target && interval < 500);
    } else if (type === 'doubletap') {
      this.dt = pointer.timeStamp - interaction.tapTime;
    }
  }

  _subtractOrigin({
    x: originX,
    y: originY
  }) {
    this.pageX -= originX;
    this.pageY -= originY;
    this.clientX -= originX;
    this.clientY -= originY;
    return this;
  }

  _addOrigin({
    x: originX,
    y: originY
  }) {
    this.pageX += originX;
    this.pageY += originY;
    this.clientX += originX;
    this.clientY += originY;
    return this;
  }
  /**
   * Prevent the default behaviour of the original Event
   */


  preventDefault() {
    this.originalEvent.preventDefault();
  }

}
//# sourceMappingURL=PointerEvent.js.map