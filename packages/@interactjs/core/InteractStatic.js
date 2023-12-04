"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createInteractStatic = createInteractStatic;
var _browser = _interopRequireDefault(require("../utils/browser.js"));
var domUtils = _interopRequireWildcard(require("../utils/domUtils.js"));
var _is = _interopRequireDefault(require("../utils/is.js"));
var _isNonNativeEvent = _interopRequireDefault(require("../utils/isNonNativeEvent.js"));
var _misc = require("../utils/misc.js");
var pointerUtils = _interopRequireWildcard(require("../utils/pointerUtils.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * ```js
 * interact('#draggable').draggable(true)
 *
 * var rectables = interact('rect')
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   })
 * ```
 *
 * The methods of this variable can be used to set elements as interactables
 * and also to change various default settings.
 *
 * Calling it as a function and passing an element or a valid CSS selector
 * string returns an Interactable object which has various methods to configure
 * it.
 *
 * @param {Element | string} target The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */

function createInteractStatic(scope) {
  const interact = (target, options) => {
    let interactable = scope.interactables.getExisting(target, options);
    if (!interactable) {
      interactable = scope.interactables.new(target, options);
      interactable.events.global = interact.globalEvents;
    }
    return interactable;
  };

  // expose the functions used to calculate multi-touch properties
  interact.getPointerAverage = pointerUtils.pointerAverage;
  interact.getTouchBBox = pointerUtils.touchBBox;
  interact.getTouchDistance = pointerUtils.touchDistance;
  interact.getTouchAngle = pointerUtils.touchAngle;
  interact.getElementRect = domUtils.getElementRect;
  interact.getElementClientRect = domUtils.getElementClientRect;
  interact.matchesSelector = domUtils.matchesSelector;
  interact.closest = domUtils.closest;
  interact.globalEvents = {};

  // eslint-disable-next-line no-undef
  interact.version = "1.10.25";
  interact.scope = scope;
  interact.use = function (plugin, options) {
    this.scope.usePlugin(plugin, options);
    return this;
  };
  interact.isSet = function (target, options) {
    return !!this.scope.interactables.get(target, options && options.context);
  };
  interact.on = (0, _misc.warnOnce)(function on(type, listener, options) {
    if (_is.default.string(type) && type.search(' ') !== -1) {
      type = type.trim().split(/ +/);
    }
    if (_is.default.array(type)) {
      for (const eventType of type) {
        this.on(eventType, listener, options);
      }
      return this;
    }
    if (_is.default.object(type)) {
      for (const prop in type) {
        this.on(prop, type[prop], listener);
      }
      return this;
    }

    // if it is an InteractEvent type, add listener to globalEvents
    if ((0, _isNonNativeEvent.default)(type, this.scope.actions)) {
      // if this type of event was never bound
      if (!this.globalEvents[type]) {
        this.globalEvents[type] = [listener];
      } else {
        this.globalEvents[type].push(listener);
      }
    }
    // If non InteractEvent type, addEventListener to document
    else {
      this.scope.events.add(this.scope.document, type, listener, {
        options
      });
    }
    return this;
  }, 'The interact.on() method is being deprecated');
  interact.off = (0, _misc.warnOnce)(function off(type, listener, options) {
    if (_is.default.string(type) && type.search(' ') !== -1) {
      type = type.trim().split(/ +/);
    }
    if (_is.default.array(type)) {
      for (const eventType of type) {
        this.off(eventType, listener, options);
      }
      return this;
    }
    if (_is.default.object(type)) {
      for (const prop in type) {
        this.off(prop, type[prop], listener);
      }
      return this;
    }
    if ((0, _isNonNativeEvent.default)(type, this.scope.actions)) {
      let index;
      if (type in this.globalEvents && (index = this.globalEvents[type].indexOf(listener)) !== -1) {
        this.globalEvents[type].splice(index, 1);
      }
    } else {
      this.scope.events.remove(this.scope.document, type, listener, options);
    }
    return this;
  }, 'The interact.off() method is being deprecated');
  interact.debug = function () {
    return this.scope;
  };
  interact.supportsTouch = function () {
    return _browser.default.supportsTouch;
  };
  interact.supportsPointerEvent = function () {
    return _browser.default.supportsPointerEvent;
  };
  interact.stop = function () {
    for (const interaction of this.scope.interactions.list) {
      interaction.stop();
    }
    return this;
  };
  interact.pointerMoveTolerance = function (newValue) {
    if (_is.default.number(newValue)) {
      this.scope.interactions.pointerMoveTolerance = newValue;
      return this;
    }
    return this.scope.interactions.pointerMoveTolerance;
  };
  interact.addDocument = function (doc, options) {
    this.scope.addDocument(doc, options);
  };
  interact.removeDocument = function (doc) {
    this.scope.removeDocument(doc);
  };
  return interact;
}
//# sourceMappingURL=InteractStatic.js.map