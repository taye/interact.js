export class BaseEvent {
  constructor(interaction) {
    this.type = void 0;
    this.target = void 0;
    this.currentTarget = void 0;
    this.interactable = void 0;
    this._interaction = void 0;
    this.timeStamp = void 0;
    this.immediatePropagationStopped = false;
    this.propagationStopped = false;
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

} // defined outside of class definition to avoid assignment of undefined during
// construction

// getters and setters defined here to support typescript 3.6 and below which
// don't support getter and setters in .d.ts files
Object.defineProperty(BaseEvent.prototype, 'interaction', {
  get() {
    return this._interaction._proxy;
  },

  set() {}

});
//# sourceMappingURL=BaseEvent.js.map