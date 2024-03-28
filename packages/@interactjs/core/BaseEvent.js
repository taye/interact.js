/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

class BaseEvent {
  constructor(interaction) {
    /** @internal */
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
}

// defined outside of class definition to avoid assignment of undefined during
// construction

// getters and setters defined here to support typescript 3.6 and below which
// don't support getter and setters in .d.ts files
Object.defineProperty(BaseEvent.prototype, 'interaction', {
  get() {
    return this._interaction._proxy;
  },
  set() {}
});
export { BaseEvent };
//# sourceMappingURL=BaseEvent.js.map
