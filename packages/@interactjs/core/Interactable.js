"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Interactable = void 0;
var arr = _interopRequireWildcard(require("../utils/arr.js"));
var _browser = _interopRequireDefault(require("../utils/browser.js"));
var _clone = _interopRequireDefault(require("../utils/clone.js"));
var _domUtils = require("../utils/domUtils.js");
var _extend = _interopRequireDefault(require("../utils/extend.js"));
var _is = _interopRequireDefault(require("../utils/is.js"));
var _isNonNativeEvent = _interopRequireDefault(require("../utils/isNonNativeEvent.js"));
var _normalizeListeners = _interopRequireDefault(require("../utils/normalizeListeners.js"));
var _window = require("../utils/window.js");
var _Eventable = require("./Eventable");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable no-dupe-class-members */
var OnOffMethod = /*#__PURE__*/function (OnOffMethod) {
  OnOffMethod[OnOffMethod["On"] = 0] = "On";
  OnOffMethod[OnOffMethod["Off"] = 1] = "Off";
  return OnOffMethod;
}(OnOffMethod || {});
/**
 * ```ts
 * const interactable = interact('.cards')
 *   .draggable({
 *     listeners: { move: event => console.log(event.type, event.pageX, event.pageY) }
 *   })
 *   .resizable({
 *     listeners: { move: event => console.log(event.rect) },
 *     modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })]
 *   })
 * ```
 */
class Interactable {
  /** @internal */get _defaults() {
    return {
      base: {},
      perAction: {},
      actions: {}
    };
  }
  target;
  /** @internal */
  options;
  /** @internal */
  _actions;
  /** @internal */
  events = new _Eventable.Eventable();
  /** @internal */
  _context;
  /** @internal */
  _win;
  /** @internal */
  _doc;
  /** @internal */
  _scopeEvents;
  constructor(target, options, defaultContext, scopeEvents) {
    this._actions = options.actions;
    this.target = target;
    this._context = options.context || defaultContext;
    this._win = (0, _window.getWindow)((0, _domUtils.trySelector)(target) ? this._context : target);
    this._doc = this._win.document;
    this._scopeEvents = scopeEvents;
    this.set(options);
  }
  setOnEvents(actionName, phases) {
    if (_is.default.func(phases.onstart)) {
      this.on(`${actionName}start`, phases.onstart);
    }
    if (_is.default.func(phases.onmove)) {
      this.on(`${actionName}move`, phases.onmove);
    }
    if (_is.default.func(phases.onend)) {
      this.on(`${actionName}end`, phases.onend);
    }
    if (_is.default.func(phases.oninertiastart)) {
      this.on(`${actionName}inertiastart`, phases.oninertiastart);
    }
    return this;
  }
  updatePerActionListeners(actionName, prev, cur) {
    var _this$_actions$map$ac;
    const actionFilter = (_this$_actions$map$ac = this._actions.map[actionName]) == null ? void 0 : _this$_actions$map$ac.filterEventType;
    const filter = type => (actionFilter == null || actionFilter(type)) && (0, _isNonNativeEvent.default)(type, this._actions);
    if (_is.default.array(prev) || _is.default.object(prev)) {
      this._onOff(OnOffMethod.Off, actionName, prev, undefined, filter);
    }
    if (_is.default.array(cur) || _is.default.object(cur)) {
      this._onOff(OnOffMethod.On, actionName, cur, undefined, filter);
    }
  }
  setPerAction(actionName, options) {
    const defaults = this._defaults;

    // for all the default per-action options
    for (const optionName_ in options) {
      const optionName = optionName_;
      const actionOptions = this.options[actionName];
      const optionValue = options[optionName];

      // remove old event listeners and add new ones
      if (optionName === 'listeners') {
        this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
      }

      // if the option value is an array
      if (_is.default.array(optionValue)) {
        ;
        actionOptions[optionName] = arr.from(optionValue);
      }
      // if the option value is an object
      else if (_is.default.plainObject(optionValue)) {
        // copy the object
        ;
        actionOptions[optionName] = (0, _extend.default)(actionOptions[optionName] || {}, (0, _clone.default)(optionValue));

        // set anabled field to true if it exists in the defaults
        if (_is.default.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
          ;
          actionOptions[optionName].enabled = optionValue.enabled !== false;
        }
      }
      // if the option value is a boolean and the default is an object
      else if (_is.default.bool(optionValue) && _is.default.object(defaults.perAction[optionName])) {
        ;
        actionOptions[optionName].enabled = optionValue;
      }
      // if it's anything else, do a plain assignment
      else {
        ;
        actionOptions[optionName] = optionValue;
      }
    }
  }

  /**
   * The default function to get an Interactables bounding rect. Can be
   * overridden using {@link Interactable.rectChecker}.
   *
   * @param {Element} [element] The element to measure.
   * @return {Rect} The object's bounding rectangle.
   */
  getRect(element) {
    element = element || (_is.default.element(this.target) ? this.target : null);
    if (_is.default.string(this.target)) {
      element = element || this._context.querySelector(this.target);
    }
    return (0, _domUtils.getElementRect)(element);
  }

  /**
   * Returns or sets the function used to calculate the interactable's
   * element's rectangle
   *
   * @param {function} [checker] A function which returns this Interactable's
   * bounding rectangle. See {@link Interactable.getRect}
   * @return {function | object} The checker function or this Interactable
   */

  rectChecker(checker) {
    if (_is.default.func(checker)) {
      this.getRect = element => {
        const rect = (0, _extend.default)({}, checker.apply(this, element));
        if (!('width' in rect)) {
          rect.width = rect.right - rect.left;
          rect.height = rect.bottom - rect.top;
        }
        return rect;
      };
      return this;
    }
    if (checker === null) {
      delete this.getRect;
      return this;
    }
    return this.getRect;
  }

  /** @internal */
  _backCompatOption(optionName, newValue) {
    if ((0, _domUtils.trySelector)(newValue) || _is.default.object(newValue)) {
      ;
      this.options[optionName] = newValue;
      for (const action in this._actions.map) {
        ;
        this.options[action][optionName] = newValue;
      }
      return this;
    }
    return this.options[optionName];
  }

  /**
   * Gets or sets the origin of the Interactable's element.  The x and y
   * of the origin will be subtracted from action event coordinates.
   *
   * @param {Element | object | string} [origin] An HTML or SVG Element whose
   * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
   * or any CSS selector
   *
   * @return {object} The current origin or this Interactable
   */
  origin(newValue) {
    return this._backCompatOption('origin', newValue);
  }

  /**
   * Returns or sets the mouse coordinate types used to calculate the
   * movement of the pointer.
   *
   * @param {string} [newValue] Use 'client' if you will be scrolling while
   * interacting; Use 'page' if you want autoScroll to work
   * @return {string | object} The current deltaSource or this Interactable
   */

  deltaSource(newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue;
      return this;
    }
    return this.options.deltaSource;
  }

  /** @internal */
  getAllElements() {
    const {
      target
    } = this;
    if (_is.default.string(target)) {
      return Array.from(this._context.querySelectorAll(target));
    }
    if (_is.default.func(target) && target.getAllElements) {
      return target.getAllElements();
    }
    return _is.default.element(target) ? [target] : [];
  }

  /**
   * Gets the selector context Node of the Interactable. The default is
   * `window.document`.
   *
   * @return {Node} The context Node of this Interactable
   */
  context() {
    return this._context;
  }
  inContext(element) {
    return this._context === element.ownerDocument || (0, _domUtils.nodeContains)(this._context, element);
  }

  /** @internal */
  testIgnoreAllow(options, targetNode, eventTarget) {
    return !this.testIgnore(options.ignoreFrom, targetNode, eventTarget) && this.testAllow(options.allowFrom, targetNode, eventTarget);
  }

  /** @internal */
  testAllow(allowFrom, targetNode, element) {
    if (!allowFrom) {
      return true;
    }
    if (!_is.default.element(element)) {
      return false;
    }
    if (_is.default.string(allowFrom)) {
      return (0, _domUtils.matchesUpTo)(element, allowFrom, targetNode);
    } else if (_is.default.element(allowFrom)) {
      return (0, _domUtils.nodeContains)(allowFrom, element);
    }
    return false;
  }

  /** @internal */
  testIgnore(ignoreFrom, targetNode, element) {
    if (!ignoreFrom || !_is.default.element(element)) {
      return false;
    }
    if (_is.default.string(ignoreFrom)) {
      return (0, _domUtils.matchesUpTo)(element, ignoreFrom, targetNode);
    } else if (_is.default.element(ignoreFrom)) {
      return (0, _domUtils.nodeContains)(ignoreFrom, element);
    }
    return false;
  }

  /**
   * Calls listeners for the given InteractEvent type bound globally
   * and directly to this Interactable
   *
   * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
   * Interactable
   * @return {Interactable} this Interactable
   */
  fire(iEvent) {
    this.events.fire(iEvent);
    return this;
  }

  /** @internal */
  _onOff(method, typeArg, listenerArg, options, filter) {
    if (_is.default.object(typeArg) && !_is.default.array(typeArg)) {
      options = listenerArg;
      listenerArg = null;
    }
    const listeners = (0, _normalizeListeners.default)(typeArg, listenerArg, filter);
    for (let type in listeners) {
      if (type === 'wheel') {
        type = _browser.default.wheelEvent;
      }
      for (const listener of listeners[type]) {
        // if it is an action event type
        if ((0, _isNonNativeEvent.default)(type, this._actions)) {
          this.events[method === OnOffMethod.On ? 'on' : 'off'](type, listener);
        }
        // delegated event
        else if (_is.default.string(this.target)) {
          this._scopeEvents[method === OnOffMethod.On ? 'addDelegate' : 'removeDelegate'](this.target, this._context, type, listener, options);
        }
        // remove listener from this Interactable's element
        else {
          this._scopeEvents[method === OnOffMethod.On ? 'add' : 'remove'](this.target, type, listener, options);
        }
      }
    }
    return this;
  }

  /**
   * Binds a listener for an InteractEvent, pointerEvent or DOM event.
   *
   * @param {string | array | object} types The types of events to listen
   * for
   * @param {function | array | object} [listener] The event listener function(s)
   * @param {object | boolean} [options] options object or useCapture flag for
   * addEventListener
   * @return {Interactable} This Interactable
   */
  on(types, listener, options) {
    return this._onOff(OnOffMethod.On, types, listener, options);
  }

  /**
   * Removes an InteractEvent, pointerEvent or DOM event listener.
   *
   * @param {string | array | object} types The types of events that were
   * listened for
   * @param {function | array | object} [listener] The event listener function(s)
   * @param {object | boolean} [options] options object or useCapture flag for
   * removeEventListener
   * @return {Interactable} This Interactable
   */
  off(types, listener, options) {
    return this._onOff(OnOffMethod.Off, types, listener, options);
  }

  /**
   * Reset the options of this Interactable
   *
   * @param {object} options The new settings to apply
   * @return {object} This Interactable
   */
  set(options) {
    const defaults = this._defaults;
    if (!_is.default.object(options)) {
      options = {};
    }
    ;
    this.options = (0, _clone.default)(defaults.base);
    for (const actionName_ in this._actions.methodDict) {
      const actionName = actionName_;
      const methodName = this._actions.methodDict[actionName];
      this.options[actionName] = {};
      this.setPerAction(actionName, (0, _extend.default)((0, _extend.default)({}, defaults.perAction), defaults.actions[actionName]));
      this[methodName](options[actionName]);
    }
    for (const setting in options) {
      if (setting === 'getRect') {
        this.rectChecker(options.getRect);
        continue;
      }
      if (_is.default.func(this[setting])) {
        ;
        this[setting](options[setting]);
      }
    }
    return this;
  }

  /**
   * Remove this interactable from the list of interactables and remove it's
   * action capabilities and event listeners
   */
  unset() {
    if (_is.default.string(this.target)) {
      // remove delegated events
      for (const type in this._scopeEvents.delegatedEvents) {
        const delegated = this._scopeEvents.delegatedEvents[type];
        for (let i = delegated.length - 1; i >= 0; i--) {
          const {
            selector,
            context,
            listeners
          } = delegated[i];
          if (selector === this.target && context === this._context) {
            delegated.splice(i, 1);
          }
          for (let l = listeners.length - 1; l >= 0; l--) {
            this._scopeEvents.removeDelegate(this.target, this._context, type, listeners[l][0], listeners[l][1]);
          }
        }
      }
    } else {
      this._scopeEvents.remove(this.target, 'all');
    }
  }
}
exports.Interactable = Interactable;
//# sourceMappingURL=Interactable.js.map