"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PointerEvent = void 0;
var _BaseEvent = require("../core/BaseEvent.js");
var pointerUtils = _interopRequireWildcard(require("../utils/pointerUtils.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class PointerEvent extends _BaseEvent.BaseEvent {
  constructor(type, pointer, event, eventTarget, interaction, timeStamp) {
    super(interaction);
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
      this.double = !!interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === this.target && interval < 500;
    } else if (type === 'doubletap') {
      this.dt = pointer.timeStamp - interaction.tapTime;
      this.double = true;
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
exports.PointerEvent = PointerEvent;
//# sourceMappingURL=PointerEvent.js.map