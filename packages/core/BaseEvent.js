function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

export let EventPhase;

(function (EventPhase) {
  EventPhase["Start"] = "start";
  EventPhase["Move"] = "move";
  EventPhase["End"] = "end";
  EventPhase["_NONE"] = "";
})(EventPhase || (EventPhase = {}));

export class BaseEvent {
  get interaction() {
    return this._interaction._proxy;
  }

  constructor(interaction) {
    _defineProperty(this, "type", void 0);

    _defineProperty(this, "target", void 0);

    _defineProperty(this, "currentTarget", void 0);

    _defineProperty(this, "interactable", void 0);

    _defineProperty(this, "_interaction", void 0);

    _defineProperty(this, "timeStamp", void 0);

    _defineProperty(this, "immediatePropagationStopped", false);

    _defineProperty(this, "propagationStopped", false);

    this._interaction = interaction;
  }

  preventDefault() {}
  /**
   * Don't call any other listeners (even on the current target)
   */


  stopPropagation() {
    this.propagationStopped = true;
  }
  /**
   * Don't call listeners on the remaining targets
   */


  stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }

}
export default BaseEvent;
//# sourceMappingURL=BaseEvent.js.map