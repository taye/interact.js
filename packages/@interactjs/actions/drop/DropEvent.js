"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DropEvent = void 0;
var _BaseEvent = require("../../core/BaseEvent.js");
var arr = _interopRequireWildcard(require("../../utils/arr.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class DropEvent extends _BaseEvent.BaseEvent {
  dropzone;
  dragEvent;
  relatedTarget;
  draggable;
  propagationStopped = false;
  immediatePropagationStopped = false;

  /**
   * Class of events fired on dropzones during drags with acceptable targets.
   */
  constructor(dropState, dragEvent, type) {
    super(dragEvent._interaction);
    const {
      element,
      dropzone
    } = type === 'dragleave' ? dropState.prev : dropState.cur;
    this.type = type;
    this.target = element;
    this.currentTarget = element;
    this.dropzone = dropzone;
    this.dragEvent = dragEvent;
    this.relatedTarget = dragEvent.target;
    this.draggable = dragEvent.interactable;
    this.timeStamp = dragEvent.timeStamp;
  }

  /**
   * If this is a `dropactivate` event, the dropzone element will be
   * deactivated.
   *
   * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
   * dropzone element and more.
   */
  reject() {
    const {
      dropState
    } = this._interaction;
    if (this.type !== 'dropactivate' && (!this.dropzone || dropState.cur.dropzone !== this.dropzone || dropState.cur.element !== this.target)) {
      return;
    }
    dropState.prev.dropzone = this.dropzone;
    dropState.prev.element = this.target;
    dropState.rejected = true;
    dropState.events.enter = null;
    this.stopImmediatePropagation();
    if (this.type === 'dropactivate') {
      const activeDrops = dropState.activeDrops;
      const index = arr.findIndex(activeDrops, ({
        dropzone,
        element
      }) => dropzone === this.dropzone && element === this.target);
      dropState.activeDrops.splice(index, 1);
      const deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate');
      deactivateEvent.dropzone = this.dropzone;
      deactivateEvent.target = this.target;
      this.dropzone.fire(deactivateEvent);
    } else {
      this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'));
    }
  }
  preventDefault() {}
  stopPropagation() {
    this.propagationStopped = true;
  }
  stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }
}
exports.DropEvent = DropEvent;
//# sourceMappingURL=DropEvent.js.map