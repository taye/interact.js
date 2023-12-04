"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Eventable = void 0;
var arr = _interopRequireWildcard(require("../utils/arr.js"));
var _extend = _interopRequireDefault(require("../utils/extend.js"));
var _normalizeListeners = _interopRequireDefault(require("../utils/normalizeListeners.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function fireUntilImmediateStopped(event, listeners) {
  for (const listener of listeners) {
    if (event.immediatePropagationStopped) {
      break;
    }
    listener(event);
  }
}
class Eventable {
  options;
  types = {};
  propagationStopped = false;
  immediatePropagationStopped = false;
  global;
  constructor(options) {
    this.options = (0, _extend.default)({}, options || {});
  }
  fire(event) {
    let listeners;
    const global = this.global;

    // Interactable#on() listeners
    // tslint:disable no-conditional-assignment
    if (listeners = this.types[event.type]) {
      fireUntilImmediateStopped(event, listeners);
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type])) {
      fireUntilImmediateStopped(event, listeners);
    }
  }
  on(type, listener) {
    const listeners = (0, _normalizeListeners.default)(type, listener);
    for (type in listeners) {
      this.types[type] = arr.merge(this.types[type] || [], listeners[type]);
    }
  }
  off(type, listener) {
    const listeners = (0, _normalizeListeners.default)(type, listener);
    for (type in listeners) {
      const eventList = this.types[type];
      if (!eventList || !eventList.length) {
        continue;
      }
      for (const subListener of listeners[type]) {
        const index = eventList.indexOf(subListener);
        if (index !== -1) {
          eventList.splice(index, 1);
        }
      }
    }
  }
  getRect(_element) {
    return null;
  }
}
exports.Eventable = Eventable;
//# sourceMappingURL=Eventable.js.map