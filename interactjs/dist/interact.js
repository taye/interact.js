/**
 * interact.js 1.9.9
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interact = f()}})(function(){var define,module,exports;
var createModuleFactory = function createModuleFactory(t){var e;return function(r){return e||t(e={exports:{},parent:r},e.exports),e.exports}};
var _$Interactable_20 = createModuleFactory(function (module, exports) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Interactable = void 0;

var arr = _interopRequireWildcard(_$arr_65);

var _browser = _interopRequireDefault(_$browser_66);

var _clone = _interopRequireDefault(_$clone_67);

/* removed: var _$domUtils_70 = require("@interactjs/utils/domUtils"); */;

var _extend = _interopRequireDefault(_$extend_72);

var is = _interopRequireWildcard(_$is_76);

var _normalizeListeners = _interopRequireDefault(_$normalizeListeners_78);

/* removed: var _$window_83 = require("@interactjs/utils/window"); */;

var _Eventable = _interopRequireDefault(_$Eventable_17);

var _scope = _$scope_29({});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/** */
var Interactable = /*#__PURE__*/function () {
  _createClass(Interactable, [{
    key: "_defaults",
    get: function get() {
      return {
        base: {},
        perAction: {},
        actions: {}
      };
    }
  }]);

  /** */
  function Interactable(target, options, defaultContext, _scopeEvents) {
    _classCallCheck(this, Interactable);

    this._scopeEvents = _scopeEvents;

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "_actions", void 0);

    _defineProperty(this, "target", void 0);

    _defineProperty(this, "events", new _Eventable["default"]());

    _defineProperty(this, "_context", void 0);

    _defineProperty(this, "_win", void 0);

    _defineProperty(this, "_doc", void 0);

    this._actions = options.actions;
    this.target = target;
    this._context = options.context || defaultContext;
    this._win = (0, _$window_83.getWindow)((0, _$domUtils_70.trySelector)(target) ? this._context : target);
    this._doc = this._win.document;
    this.set(options);
  }

  _createClass(Interactable, [{
    key: "setOnEvents",
    value: function setOnEvents(actionName, phases) {
      if (is.func(phases.onstart)) {
        this.on("".concat(actionName, "start"), phases.onstart);
      }

      if (is.func(phases.onmove)) {
        this.on("".concat(actionName, "move"), phases.onmove);
      }

      if (is.func(phases.onend)) {
        this.on("".concat(actionName, "end"), phases.onend);
      }

      if (is.func(phases.oninertiastart)) {
        this.on("".concat(actionName, "inertiastart"), phases.oninertiastart);
      }

      return this;
    }
  }, {
    key: "updatePerActionListeners",
    value: function updatePerActionListeners(actionName, prev, cur) {
      if (is.array(prev) || is.object(prev)) {
        this.off(actionName, prev);
      }

      if (is.array(cur) || is.object(cur)) {
        this.on(actionName, cur);
      }
    }
  }, {
    key: "setPerAction",
    value: function setPerAction(actionName, options) {
      var defaults = this._defaults; // for all the default per-action options

      for (var optionName_ in options) {
        var optionName = optionName_;
        var actionOptions = this.options[actionName];
        var optionValue = options[optionName]; // remove old event listeners and add new ones

        if (optionName === 'listeners') {
          this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
        } // if the option value is an array


        if (is.array(optionValue)) {
          actionOptions[optionName] = arr.from(optionValue);
        } // if the option value is an object
        else if (is.plainObject(optionValue)) {
            // copy the object
            actionOptions[optionName] = (0, _extend["default"])(actionOptions[optionName] || {}, (0, _clone["default"])(optionValue)); // set anabled field to true if it exists in the defaults

            if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
              actionOptions[optionName].enabled = optionValue.enabled !== false;
            }
          } // if the option value is a boolean and the default is an object
          else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
              actionOptions[optionName].enabled = optionValue;
            } // if it's anything else, do a plain assignment
            else {
                actionOptions[optionName] = optionValue;
              }
      }
    }
    /**
     * The default function to get an Interactables bounding rect. Can be
     * overridden using {@link Interactable.rectChecker}.
     *
     * @param {Element} [element] The element to measure.
     * @return {object} The object's bounding rectangle.
     */

  }, {
    key: "getRect",
    value: function getRect(element) {
      element = element || (is.element(this.target) ? this.target : null);

      if (is.string(this.target)) {
        element = element || this._context.querySelector(this.target);
      }

      return (0, _$domUtils_70.getElementRect)(element);
    }
    /**
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     * @param {function} [checker] A function which returns this Interactable's
     * bounding rectangle. See {@link Interactable.getRect}
     * @return {function | object} The checker function or this Interactable
     */

  }, {
    key: "rectChecker",
    value: function rectChecker(checker) {
      if (is.func(checker)) {
        this.getRect = checker;
        return this;
      }

      if (checker === null) {
        delete this.getRect;
        return this;
      }

      return this.getRect;
    }
  }, {
    key: "_backCompatOption",
    value: function _backCompatOption(optionName, newValue) {
      if ((0, _$domUtils_70.trySelector)(newValue) || is.object(newValue)) {
        this.options[optionName] = newValue;

        for (var action in this._actions.map) {
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

  }, {
    key: "origin",
    value: function origin(newValue) {
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

  }, {
    key: "deltaSource",
    value: function deltaSource(newValue) {
      if (newValue === 'page' || newValue === 'client') {
        this.options.deltaSource = newValue;
        return this;
      }

      return this.options.deltaSource;
    }
    /**
     * Gets the selector context Node of the Interactable. The default is
     * `window.document`.
     *
     * @return {Node} The context Node of this Interactable
     */

  }, {
    key: "context",
    value: function context() {
      return this._context;
    }
  }, {
    key: "inContext",
    value: function inContext(element) {
      return this._context === element.ownerDocument || (0, _$domUtils_70.nodeContains)(this._context, element);
    }
  }, {
    key: "testIgnoreAllow",
    value: function testIgnoreAllow(options, targetNode, eventTarget) {
      return !this.testIgnore(options.ignoreFrom, targetNode, eventTarget) && this.testAllow(options.allowFrom, targetNode, eventTarget);
    }
  }, {
    key: "testAllow",
    value: function testAllow(allowFrom, targetNode, element) {
      if (!allowFrom) {
        return true;
      }

      if (!is.element(element)) {
        return false;
      }

      if (is.string(allowFrom)) {
        return (0, _$domUtils_70.matchesUpTo)(element, allowFrom, targetNode);
      } else if (is.element(allowFrom)) {
        return (0, _$domUtils_70.nodeContains)(allowFrom, element);
      }

      return false;
    }
  }, {
    key: "testIgnore",
    value: function testIgnore(ignoreFrom, targetNode, element) {
      if (!ignoreFrom || !is.element(element)) {
        return false;
      }

      if (is.string(ignoreFrom)) {
        return (0, _$domUtils_70.matchesUpTo)(element, ignoreFrom, targetNode);
      } else if (is.element(ignoreFrom)) {
        return (0, _$domUtils_70.nodeContains)(ignoreFrom, element);
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

  }, {
    key: "fire",
    value: function fire(iEvent) {
      this.events.fire(iEvent);
      return this;
    }
  }, {
    key: "_onOff",
    value: function _onOff(method, typeArg, listenerArg, options) {
      if (is.object(typeArg) && !is.array(typeArg)) {
        options = listenerArg;
        listenerArg = null;
      }

      var addRemove = method === 'on' ? 'add' : 'remove';
      var listeners = (0, _normalizeListeners["default"])(typeArg, listenerArg);

      for (var type in listeners) {
        if (type === 'wheel') {
          type = _browser["default"].wheelEvent;
        }

        for (var _i = 0; _i < listeners[type].length; _i++) {
          var _ref;

          _ref = listeners[type][_i];
          var listener = _ref;

          // if it is an action event type
          if ((0, _scope.isNonNativeEvent)(type, this._actions)) {
            this.events[method](type, listener);
          } // delegated event
          else if (is.string(this.target)) {
              this._scopeEvents["".concat(addRemove, "Delegate")](this.target, this._context, type, listener, options);
            } // remove listener from this Interactable's element
            else {
                this._scopeEvents[addRemove](this.target, type, listener, options);
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

  }, {
    key: "on",
    value: function on(types, listener, options) {
      return this._onOff('on', types, listener, options);
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

  }, {
    key: "off",
    value: function off(types, listener, options) {
      return this._onOff('off', types, listener, options);
    }
    /**
     * Reset the options of this Interactable
     *
     * @param {object} options The new settings to apply
     * @return {object} This Interactable
     */

  }, {
    key: "set",
    value: function set(options) {
      var defaults = this._defaults;

      if (!is.object(options)) {
        options = {};
      }

      this.options = (0, _clone["default"])(defaults.base);

      for (var actionName_ in this._actions.methodDict) {
        var actionName = actionName_;
        var methodName = this._actions.methodDict[actionName];
        this.options[actionName] = {};
        this.setPerAction(actionName, (0, _extend["default"])((0, _extend["default"])({}, defaults.perAction), defaults.actions[actionName]));
        this[methodName](options[actionName]);
      }

      for (var setting in options) {
        if (is.func(this[setting])) {
          this[setting](options[setting]);
        }
      }

      return this;
    }
    /**
     * Remove this interactable from the list of interactables and remove it's
     * action capabilities and event listeners
     */

  }, {
    key: "unset",
    value: function unset() {
      if (is.string(this.target)) {
        // remove delegated events
        for (var type in this._scopeEvents.delegatedEvents) {
          var delegated = this._scopeEvents.delegatedEvents[type];

          for (var i = delegated.length - 1; i >= 0; i--) {
            var _delegated$i = delegated[i],
                selector = _delegated$i.selector,
                context = _delegated$i.context,
                listeners = _delegated$i.listeners;

            if (selector === this.target && context === this._context) {
              delegated.splice(i, 1);
            }

            for (var l = listeners.length - 1; l >= 0; l--) {
              this._scopeEvents.removeDelegate(this.target, this._context, type, listeners[l][0], listeners[l][1]);
            }
          }
        }
      } else {
        this._scopeEvents.remove(this.target, 'all');
      }
    }
  }]);

  return Interactable;
}();

exports.Interactable = Interactable;
var _default = Interactable;
exports["default"] = _default;

});
var _$scope_29 = createModuleFactory(function (module, exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNonNativeEvent = isNonNativeEvent;
exports.initScope = initScope;
exports.Scope = exports["default"] = void 0;

var _domObjects = _interopRequireDefault(_$domObjects_69);

var utils = _interopRequireWildcard(_$index_75);

var _Eventable = _interopRequireDefault(_$Eventable_17);

var _InteractEvent = _interopRequireDefault(_$InteractEvent_18);

var _InteractStatic = _interopRequireDefault(_$InteractStatic_19({}));

var _Interactable = _interopRequireDefault(_$Interactable_20({}));

var _InteractableSet = _interopRequireDefault(_$InteractableSet_21);

var _defaultOptions = _interopRequireDefault(_$defaultOptions_24);

var _events = _interopRequireDefault(_$events_25);

var _interactions = _interopRequireDefault(_$interactions_28({}));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var win = utils.win,
    browser = utils.browser,
    raf = utils.raf; // eslint-disable-next-line @typescript-eslint/no-empty-interface

var Scope = /*#__PURE__*/function () {
  // main window
  // main document
  // main window
  // all documents being listened to
  function Scope() {
    var _this = this;

    _classCallCheck(this, Scope);

    _defineProperty(this, "id", "__interact_scope_".concat(Math.floor(Math.random() * 100)));

    _defineProperty(this, "isInitialized", false);

    _defineProperty(this, "listenerMaps", []);

    _defineProperty(this, "browser", browser);

    _defineProperty(this, "utils", utils);

    _defineProperty(this, "defaults", utils.clone(_defaultOptions["default"]));

    _defineProperty(this, "Eventable", _Eventable["default"]);

    _defineProperty(this, "actions", {
      map: {},
      phases: {
        start: true,
        move: true,
        end: true
      },
      methodDict: {},
      phaselessTypes: {}
    });

    _defineProperty(this, "interactStatic", new _InteractStatic["default"](this));

    _defineProperty(this, "InteractEvent", _InteractEvent["default"]);

    _defineProperty(this, "Interactable", void 0);

    _defineProperty(this, "interactables", new _InteractableSet["default"](this));

    _defineProperty(this, "_win", void 0);

    _defineProperty(this, "document", void 0);

    _defineProperty(this, "window", void 0);

    _defineProperty(this, "documents", []);

    _defineProperty(this, "_plugins", {
      list: [],
      map: {}
    });

    _defineProperty(this, "onWindowUnload", function (event) {
      return _this.removeDocument(event.target);
    });

    var scope = this;

    this.Interactable = /*#__PURE__*/function (_InteractableBase) {
      _inherits(_class, _InteractableBase);

      function _class() {
        _classCallCheck(this, _class);

        return _possibleConstructorReturn(this, _getPrototypeOf(_class).apply(this, arguments));
      }

      _createClass(_class, [{
        key: "set",
        value: function set(options) {
          _get(_getPrototypeOf(_class.prototype), "set", this).call(this, options);

          scope.fire('interactable:set', {
            options: options,
            interactable: this
          });
          return this;
        }
      }, {
        key: "unset",
        value: function unset() {
          _get(_getPrototypeOf(_class.prototype), "unset", this).call(this);

          scope.interactables.list.splice(scope.interactables.list.indexOf(this), 1);
          scope.fire('interactable:unset', {
            interactable: this
          });
        }
      }, {
        key: "_defaults",
        get: function get() {
          return scope.defaults;
        }
      }]);

      return _class;
    }(_Interactable["default"]);
  }

  _createClass(Scope, [{
    key: "addListeners",
    value: function addListeners(map, id) {
      this.listenerMaps.push({
        id: id,
        map: map
      });
    }
  }, {
    key: "fire",
    value: function fire(name, arg) {
      for (var _i = 0; _i < this.listenerMaps.length; _i++) {
        var _ref;

        _ref = this.listenerMaps[_i];
        var _ref2 = _ref,
            listener = _ref2.map[name];

        if (!!listener && listener(arg, this, name) === false) {
          return false;
        }
      }
    }
  }, {
    key: "init",
    value: function init(window) {
      return this.isInitialized ? this : initScope(this, window);
    }
  }, {
    key: "pluginIsInstalled",
    value: function pluginIsInstalled(plugin) {
      return this._plugins.map[plugin.id] || this._plugins.list.indexOf(plugin) !== -1;
    }
  }, {
    key: "usePlugin",
    value: function usePlugin(plugin, options) {
      if (this.pluginIsInstalled(plugin)) {
        return this;
      }

      if (plugin.id) {
        this._plugins.map[plugin.id] = plugin;
      }

      this._plugins.list.push(plugin);

      if (plugin.install) {
        plugin.install(this, options);
      }

      if (plugin.listeners && plugin.before) {
        var _index = 0;
        var len = this.listenerMaps.length;
        var before = plugin.before.reduce(function (acc, id) {
          acc[id] = true;
          return acc;
        }, {});

        for (; _index < len; _index++) {
          var otherId = this.listenerMaps[_index].id;

          if (before[otherId]) {
            break;
          }
        }

        this.listenerMaps.splice(_index, 0, {
          id: plugin.id,
          map: plugin.listeners
        });
      } else if (plugin.listeners) {
        this.listenerMaps.push({
          id: plugin.id,
          map: plugin.listeners
        });
      }

      return this;
    }
  }, {
    key: "addDocument",
    value: function addDocument(doc, options) {
      // do nothing if document is already known
      if (this.getDocIndex(doc) !== -1) {
        return false;
      }

      var window = win.getWindow(doc);
      options = options ? utils.extend({}, options) : {};
      this.documents.push({
        doc: doc,
        options: options
      });
      this.events.documents.push(doc); // don't add an unload event for the main document
      // so that the page may be cached in browser history

      if (doc !== this.document) {
        this.events.add(window, 'unload', this.onWindowUnload);
      }

      this.fire('scope:add-document', {
        doc: doc,
        window: window,
        scope: this,
        options: options
      });
    }
  }, {
    key: "removeDocument",
    value: function removeDocument(doc) {
      var index = this.getDocIndex(doc);
      var window = win.getWindow(doc);
      var options = this.documents[index].options;
      this.events.remove(window, 'unload', this.onWindowUnload);
      this.documents.splice(index, 1);
      this.events.documents.splice(index, 1);
      this.fire('scope:remove-document', {
        doc: doc,
        window: window,
        scope: this,
        options: options
      });
    }
  }, {
    key: "getDocIndex",
    value: function getDocIndex(doc) {
      for (var i = 0; i < this.documents.length; i++) {
        if (this.documents[i].doc === doc) {
          return i;
        }
      }

      return -1;
    }
  }, {
    key: "getDocOptions",
    value: function getDocOptions(doc) {
      var docIndex = this.getDocIndex(doc);
      return docIndex === -1 ? null : this.documents[docIndex].options;
    }
  }, {
    key: "now",
    value: function now() {
      return (this.window.Date || Date).now();
    }
  }]);

  return Scope;
}();

exports.Scope = exports["default"] = Scope;

function isNonNativeEvent(type, actions) {
  if (actions.phaselessTypes[type]) {
    return true;
  }

  for (var name in actions.map) {
    if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
      return true;
    }
  }

  return false;
}

function initScope(scope, window) {
  scope.isInitialized = true;
  win.init(window);

  _domObjects["default"].init(window);

  browser.init(window);
  raf.init(window);
  scope.window = window;
  scope.document = window.document;
  scope.usePlugin(_interactions["default"]);
  scope.usePlugin(_events["default"]);
  return scope;
}

});
var _$interactions_28 = createModuleFactory(function (module, exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _browser = _interopRequireDefault(_$browser_66);

var _domObjects = _interopRequireDefault(_$domObjects_69);

/* removed: var _$domUtils_70 = require("@interactjs/utils/domUtils"); */;

var pointerUtils = _interopRequireWildcard(_$pointerUtils_80);

var _Interaction = _interopRequireDefault(_$Interaction_22);

var _interactablePreventDefault = _interopRequireDefault(_$interactablePreventDefault_26);

var _interactionFinder = _interopRequireDefault(_$interactionFinder_27);

var _scope = _interopRequireDefault(_$scope_29({}));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];

function install(scope) {
  var listeners = {};

  for (var _i = 0; _i < methodNames.length; _i++) {
    var _ref;

    _ref = methodNames[_i];
    var method = _ref;
    listeners[method] = doOnInteractions(method, scope);
  }

  var pEventTypes = _browser["default"].pEventTypes;
  var docEvents;

  if (_domObjects["default"].PointerEvent) {
    docEvents = [{
      type: pEventTypes.down,
      listener: releasePointersOnRemovedEls
    }, {
      type: pEventTypes.down,
      listener: listeners.pointerDown
    }, {
      type: pEventTypes.move,
      listener: listeners.pointerMove
    }, {
      type: pEventTypes.up,
      listener: listeners.pointerUp
    }, {
      type: pEventTypes.cancel,
      listener: listeners.pointerUp
    }];
  } else {
    docEvents = [{
      type: 'mousedown',
      listener: listeners.pointerDown
    }, {
      type: 'mousemove',
      listener: listeners.pointerMove
    }, {
      type: 'mouseup',
      listener: listeners.pointerUp
    }, {
      type: 'touchstart',
      listener: releasePointersOnRemovedEls
    }, {
      type: 'touchstart',
      listener: listeners.pointerDown
    }, {
      type: 'touchmove',
      listener: listeners.pointerMove
    }, {
      type: 'touchend',
      listener: listeners.pointerUp
    }, {
      type: 'touchcancel',
      listener: listeners.pointerUp
    }];
  }

  docEvents.push({
    type: 'blur',
    listener: function listener(event) {
      for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
        var _ref2;

        _ref2 = scope.interactions.list[_i2];
        var interaction = _ref2;
        interaction.documentBlur(event);
      }
    }
  }); // for ignoring browser's simulated mouse events

  scope.prevTouchTime = 0;

  scope.Interaction = /*#__PURE__*/function (_InteractionBase) {
    _inherits(_class, _InteractionBase);

    function _class() {
      _classCallCheck(this, _class);

      return _possibleConstructorReturn(this, _getPrototypeOf(_class).apply(this, arguments));
    }

    _createClass(_class, [{
      key: "_now",
      value: function _now() {
        return scope.now();
      }
    }, {
      key: "pointerMoveTolerance",
      get: function get() {
        return scope.interactions.pointerMoveTolerance;
      },
      set: function set(value) {
        scope.interactions.pointerMoveTolerance = value;
      }
    }]);

    return _class;
  }(_Interaction["default"]);

  scope.interactions = {
    // all active and idle interactions
    list: [],
    "new": function _new(options) {
      options.scopeFire = function (name, arg) {
        return scope.fire(name, arg);
      };

      var interaction = new scope.Interaction(options);
      scope.interactions.list.push(interaction);
      return interaction;
    },
    listeners: listeners,
    docEvents: docEvents,
    pointerMoveTolerance: 1
  };

  function releasePointersOnRemovedEls() {
    // for all inactive touch interactions with pointers down
    for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
      var _ref3;

      _ref3 = scope.interactions.list[_i3];
      var interaction = _ref3;

      if (!interaction.pointerIsDown || interaction.pointerType !== 'touch' || interaction._interacting) {
        continue;
      } // if a pointer is down on an element that is no longer in the DOM tree


      var _loop = function _loop() {
        _ref4 = interaction.pointers[_i4];
        var pointer = _ref4;

        if (!scope.documents.some(function (_ref5) {
          var doc = _ref5.doc;
          return (0, _$domUtils_70.nodeContains)(doc, pointer.downTarget);
        })) {
          // remove the pointer from the interaction
          interaction.removePointer(pointer.pointer, pointer.event);
        }
      };

      for (var _i4 = 0; _i4 < interaction.pointers.length; _i4++) {
        var _ref4;

        _loop();
      }
    }
  }

  scope.usePlugin(_interactablePreventDefault["default"]);
}

function doOnInteractions(method, scope) {
  return function (event) {
    var interactions = scope.interactions.list;
    var pointerType = pointerUtils.getPointerType(event);

    var _pointerUtils$getEven = pointerUtils.getEventTargets(event),
        _pointerUtils$getEven2 = _slicedToArray(_pointerUtils$getEven, 2),
        eventTarget = _pointerUtils$getEven2[0],
        curEventTarget = _pointerUtils$getEven2[1];

    var matches = []; // [ [pointer, interaction], ...]

    if (/^touch/.test(event.type)) {
      scope.prevTouchTime = scope.now();

      for (var _i5 = 0; _i5 < event.changedTouches.length; _i5++) {
        var _ref6;

        _ref6 = event.changedTouches[_i5];
        var changedTouch = _ref6;
        var pointer = changedTouch;
        var pointerId = pointerUtils.getPointerId(pointer);
        var searchDetails = {
          pointer: pointer,
          pointerId: pointerId,
          pointerType: pointerType,
          eventType: event.type,
          eventTarget: eventTarget,
          curEventTarget: curEventTarget,
          scope: scope
        };
        var interaction = getInteraction(searchDetails);
        matches.push([searchDetails.pointer, searchDetails.eventTarget, searchDetails.curEventTarget, interaction]);
      }
    } else {
      var invalidPointer = false;

      if (!_browser["default"].supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (var i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
        } // try to ignore mouse events that are simulated by the browser
        // after a touch event


        invalidPointer = invalidPointer || scope.now() - scope.prevTouchTime < 500 || // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
        event.timeStamp === 0;
      }

      if (!invalidPointer) {
        var _searchDetails = {
          pointer: event,
          pointerId: pointerUtils.getPointerId(event),
          pointerType: pointerType,
          eventType: event.type,
          curEventTarget: curEventTarget,
          eventTarget: eventTarget,
          scope: scope
        };

        var _interaction = getInteraction(_searchDetails);

        matches.push([_searchDetails.pointer, _searchDetails.eventTarget, _searchDetails.curEventTarget, _interaction]);
      }
    } // eslint-disable-next-line no-shadow


    for (var _i6 = 0; _i6 < matches.length; _i6++) {
      var _matches$_i = _slicedToArray(matches[_i6], 4),
          _pointer = _matches$_i[0],
          _eventTarget = _matches$_i[1],
          _curEventTarget = _matches$_i[2],
          _interaction2 = _matches$_i[3];

      _interaction2[method](_pointer, event, _eventTarget, _curEventTarget);
    }
  };
}

function getInteraction(searchDetails) {
  var pointerType = searchDetails.pointerType,
      scope = searchDetails.scope;

  var foundInteraction = _interactionFinder["default"].search(searchDetails);

  var signalArg = {
    interaction: foundInteraction,
    searchDetails: searchDetails
  };
  scope.fire('interactions:find', signalArg);
  return signalArg.interaction || scope.interactions["new"]({
    pointerType: pointerType
  });
}

function onDocSignal(_ref7, eventMethodName) {
  var doc = _ref7.doc,
      scope = _ref7.scope,
      options = _ref7.options;
  var docEvents = scope.interactions.docEvents,
      events = scope.events;
  var eventMethod = events[eventMethodName];

  if (scope.browser.isIOS && !options.events) {
    options.events = {
      passive: false
    };
  } // delegate event listener


  for (var eventType in events.delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener);
    eventMethod(doc, eventType, events.delegateUseCapture, true);
  }

  var eventOptions = options && options.events;

  for (var _i7 = 0; _i7 < docEvents.length; _i7++) {
    var _ref8;

    _ref8 = docEvents[_i7];
    var _ref9 = _ref8,
        _type = _ref9.type,
        listener = _ref9.listener;
    eventMethod(doc, _type, listener, eventOptions);
  }
}

var interactions = {
  id: 'core/interactions',
  install: install,
  listeners: {
    'scope:add-document': function scopeAddDocument(arg) {
      return onDocSignal(arg, 'add');
    },
    'scope:remove-document': function scopeRemoveDocument(arg) {
      return onDocSignal(arg, 'remove');
    },
    'interactable:unset': function interactableUnset(_ref10, scope) {
      var interactable = _ref10.interactable;

      // Stop and destroy related interactions when an Interactable is unset
      for (var i = scope.interactions.list.length - 1; i >= 0; i--) {
        var interaction = scope.interactions.list[i];

        if (interaction.interactable !== interactable) {
          continue;
        }

        interaction.stop();
        scope.fire('interactions:destroy', {
          interaction: interaction
        });
        interaction.destroy();

        if (scope.interactions.list.length > 2) {
          scope.interactions.list.splice(i, 1);
        }
      }
    }
  },
  onDocSignal: onDocSignal,
  doOnInteractions: doOnInteractions,
  methodNames: methodNames
};
var _default = interactions;
exports["default"] = _default;

});
var _$InteractStatic_19 = createModuleFactory(function (module, exports) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.InteractStatic = void 0;

var _browser = _interopRequireDefault(_$browser_66);

var utils = _interopRequireWildcard(_$index_75);

var _scope = _$scope_29({});

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var InteractStatic = /*#__PURE__*/function () {
  // expose the functions used to calculate multi-touch properties
  // eslint-disable-next-line no-undef
  function InteractStatic(scope) {
    var _this = this;

    _classCallCheck(this, InteractStatic);

    this.scope = scope;

    _defineProperty(this, "getPointerAverage", utils.pointer.pointerAverage);

    _defineProperty(this, "getTouchBBox", utils.pointer.touchBBox);

    _defineProperty(this, "getTouchDistance", utils.pointer.touchDistance);

    _defineProperty(this, "getTouchAngle", utils.pointer.touchAngle);

    _defineProperty(this, "getElementRect", utils.dom.getElementRect);

    _defineProperty(this, "getElementClientRect", utils.dom.getElementClientRect);

    _defineProperty(this, "matchesSelector", utils.dom.matchesSelector);

    _defineProperty(this, "closest", utils.dom.closest);

    _defineProperty(this, "globalEvents", {});

    _defineProperty(this, "dynamicDrop", void 0);

    _defineProperty(this, "version", "1.9.9");

    _defineProperty(this, "interact", void 0);

    var prototype = this.constructor.prototype;
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
     * @global
     *
     * @param {Element | string} target The HTML or SVG Element to interact with
     * or CSS selector
     * @return {Interactable}
     */

    var interact = function interact(target, options) {
      var interactable = scope.interactables.get(target, options);

      if (!interactable) {
        interactable = scope.interactables["new"](target, options);
        interactable.events.global = _this.globalEvents;
      }

      return interactable;
    };

    for (var _i = 0; _i < Object.getOwnPropertyNames(this.constructor.prototype).length; _i++) {
      var _ref;

      _ref = Object.getOwnPropertyNames(this.constructor.prototype)[_i];
      var _key = _ref;
      interact[_key] = prototype[_key];
    }

    utils.extend(interact, this);
    interact.constructor = this.constructor;
    this.interact = interact;
    return interact;
  }
  /**
   * Use a plugin
   *
   * @alias module:interact.use
   *
   * @param {Object} plugin
   * @param {function} plugin.install
   * @return {InteractStatic}
   */


  _createClass(InteractStatic, [{
    key: "use",
    value: function use(plugin, options) {
      this.scope.usePlugin(plugin, options);
      return this;
    }
    /**
     * Check if an element or selector has been set with the {@link interact}
     * function
     *
     * @alias module:interact.isSet
     *
     * @param {Element} element The Element being searched for
     * @return {boolean} Indicates if the element or CSS selector was previously
     * passed to interact
     */

  }, {
    key: "isSet",
    value: function isSet(target, options) {
      return !!this.scope.interactables.get(target, options && options.context);
    }
    /**
     * Add a global listener for an InteractEvent or adds a DOM event to `document`
     *
     * @alias module:interact.on
     *
     * @param {string | array | object} type The types of events to listen for
     * @param {function} listener The function event (s)
     * @param {object | boolean} [options] object or useCapture flag for
     * addEventListener
     * @return {object} interact
     */

  }, {
    key: "on",
    value: function on(type, listener, options) {
      if (utils.is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }

      if (utils.is.array(type)) {
        for (var _i2 = 0; _i2 < type.length; _i2++) {
          var _ref2;

          _ref2 = type[_i2];
          var eventType = _ref2;
          this.on(eventType, listener, options);
        }

        return this;
      }

      if (utils.is.object(type)) {
        for (var prop in type) {
          this.on(prop, type[prop], listener);
        }

        return this;
      } // if it is an InteractEvent type, add listener to globalEvents


      if ((0, _scope.isNonNativeEvent)(type, this.scope.actions)) {
        // if this type of event was never bound
        if (!this.globalEvents[type]) {
          this.globalEvents[type] = [listener];
        } else {
          this.globalEvents[type].push(listener);
        }
      } // If non InteractEvent type, addEventListener to document
      else {
          this.scope.events.add(this.scope.document, type, listener, {
            options: options
          });
        }

      return this;
    }
    /**
     * Removes a global InteractEvent listener or DOM event from `document`
     *
     * @alias module:interact.off
     *
     * @param {string | array | object} type The types of events that were listened
     * for
     * @param {function} listener The listener function to be removed
     * @param {object | boolean} options [options] object or useCapture flag for
     * removeEventListener
     * @return {object} interact
     */

  }, {
    key: "off",
    value: function off(type, listener, options) {
      if (utils.is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }

      if (utils.is.array(type)) {
        for (var _i3 = 0; _i3 < type.length; _i3++) {
          var _ref3;

          _ref3 = type[_i3];
          var eventType = _ref3;
          this.off(eventType, listener, options);
        }

        return this;
      }

      if (utils.is.object(type)) {
        for (var prop in type) {
          this.off(prop, type[prop], listener);
        }

        return this;
      }

      if ((0, _scope.isNonNativeEvent)(type, this.scope.actions)) {
        var index;

        if (type in this.globalEvents && (index = this.globalEvents[type].indexOf(listener)) !== -1) {
          this.globalEvents[type].splice(index, 1);
        }
      } else {
        this.scope.events.remove(this.scope.document, type, listener, options);
      }

      return this;
    }
  }, {
    key: "debug",
    value: function debug() {
      return this.scope;
    }
    /**
     * @alias module:interact.supportsTouch
     *
     * @return {boolean} Whether or not the browser supports touch input
     */

  }, {
    key: "supportsTouch",
    value: function supportsTouch() {
      return _browser["default"].supportsTouch;
    }
    /**
     * @alias module:interact.supportsPointerEvent
     *
     * @return {boolean} Whether or not the browser supports PointerEvents
     */

  }, {
    key: "supportsPointerEvent",
    value: function supportsPointerEvent() {
      return _browser["default"].supportsPointerEvent;
    }
    /**
     * Cancels all interactions (end events are not fired)
     *
     * @alias module:interact.stop
     *
     * @return {object} interact
     */

  }, {
    key: "stop",
    value: function stop() {
      for (var _i4 = 0; _i4 < this.scope.interactions.list.length; _i4++) {
        var _ref4;

        _ref4 = this.scope.interactions.list[_i4];
        var interaction = _ref4;
        interaction.stop();
      }

      return this;
    }
    /**
     * Returns or sets the distance the pointer must be moved before an action
     * sequence occurs. This also affects tolerance for tap events.
     *
     * @alias module:interact.pointerMoveTolerance
     *
     * @param {number} [newValue] The movement from the start position must be greater than this value
     * @return {interact | number}
     */

  }, {
    key: "pointerMoveTolerance",
    value: function pointerMoveTolerance(newValue) {
      if (utils.is.number(newValue)) {
        this.scope.interactions.pointerMoveTolerance = newValue;
        return this;
      }

      return this.scope.interactions.pointerMoveTolerance;
    }
  }, {
    key: "addDocument",
    value: function addDocument(doc, options) {
      this.scope.addDocument(doc, options);
    }
  }, {
    key: "removeDocument",
    value: function removeDocument(doc) {
      this.scope.removeDocument(doc);
    }
  }]);

  return InteractStatic;
}();

exports.InteractStatic = InteractStatic;
var _default = InteractStatic;
exports["default"] = _default;

});
var _$index_64 = {};
/// <reference path="./types.d.ts" />
"use strict";

var _$isWindow_77 = {};
"use strict";

Object.defineProperty(_$isWindow_77, "__esModule", {
  value: true
});
_$isWindow_77["default"] = void 0;

var _default = function _default(thing) {
  return !!(thing && thing.Window) && thing instanceof thing.Window;
};

_$isWindow_77["default"] = _default;

var _$window_83 = {};
"use strict";

Object.defineProperty(_$window_83, "__esModule", {
  value: true
});
_$window_83.init = init;
_$window_83.getWindow = getWindow;
_$window_83["default"] = void 0;

var _isWindow = _interopRequireDefault(_$isWindow_77);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var win = {
  realWindow: undefined,
  window: undefined,
  getWindow: getWindow,
  init: init
};

function init(window) {
  // get wrapped window if using Shadow DOM polyfill
  win.realWindow = window; // create a TextNode

  var el = window.document.createTextNode(''); // check if it's wrapped by a polyfill

  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }

  win.window = window;
}

if (typeof window === 'undefined') {
  win.window = undefined;
  win.realWindow = undefined;
} else {
  init(window);
}

function getWindow(node) {
  if ((0, _isWindow["default"])(node)) {
    return node;
  }

  var rootNode = node.ownerDocument || node;
  return rootNode.defaultView || win.window;
}

win.init = init;
var ___default_83 = win;
_$window_83["default"] = ___default_83;

var _$is_76 = {};
"use strict";

Object.defineProperty(_$is_76, "__esModule", {
  value: true
});
_$is_76.array = _$is_76.plainObject = _$is_76.element = _$is_76.string = _$is_76.bool = _$is_76.number = _$is_76.func = _$is_76.object = _$is_76.docFrag = _$is_76.window = void 0;

var ___isWindow_76 = ___interopRequireDefault_76(_$isWindow_77);

var _window2 = ___interopRequireDefault_76(_$window_83);

function ___interopRequireDefault_76(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __window_76 = function window(thing) {
  return thing === _window2["default"].window || (0, ___isWindow_76["default"])(thing);
};

_$is_76.window = __window_76;

var docFrag = function docFrag(thing) {
  return object(thing) && thing.nodeType === 11;
};

_$is_76.docFrag = docFrag;

var object = function object(thing) {
  return !!thing && _typeof(thing) === 'object';
};

_$is_76.object = object;

var func = function func(thing) {
  return typeof thing === 'function';
};

_$is_76.func = func;

var number = function number(thing) {
  return typeof thing === 'number';
};

_$is_76.number = number;

var bool = function bool(thing) {
  return typeof thing === 'boolean';
};

_$is_76.bool = bool;

var string = function string(thing) {
  return typeof thing === 'string';
};

_$is_76.string = string;

var element = function element(thing) {
  if (!thing || _typeof(thing) !== 'object') {
    return false;
  }

  var _window = _window2["default"].getWindow(thing) || _window2["default"].window;

  return /object|function/.test(_typeof(_window.Element)) ? thing instanceof _window.Element // DOM2
  : thing.nodeType === 1 && typeof thing.nodeName === 'string';
};

_$is_76.element = element;

var plainObject = function plainObject(thing) {
  return object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString());
};

_$is_76.plainObject = plainObject;

var array = function array(thing) {
  return object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
};

_$is_76.array = array;

var _$drag_1 = {};
"use strict";

function ___typeof_1(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_1 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_1(obj); }

Object.defineProperty(_$drag_1, "__esModule", {
  value: true
});
_$drag_1["default"] = void 0;

var is = _interopRequireWildcard(_$is_76);

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_1(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function install(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      defaults = scope.defaults;
  Interactable.prototype.draggable = drag.draggable;
  actions.map.drag = drag;
  actions.methodDict.drag = 'draggable';
  defaults.actions.drag = drag.defaults;
}

function beforeMove(_ref) {
  var interaction = _ref.interaction;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var axis = interaction.prepared.axis;

  if (axis === 'x') {
    interaction.coords.cur.page.y = interaction.coords.start.page.y;
    interaction.coords.cur.client.y = interaction.coords.start.client.y;
    interaction.coords.velocity.client.y = 0;
    interaction.coords.velocity.page.y = 0;
  } else if (axis === 'y') {
    interaction.coords.cur.page.x = interaction.coords.start.page.x;
    interaction.coords.cur.client.x = interaction.coords.start.client.x;
    interaction.coords.velocity.client.x = 0;
    interaction.coords.velocity.page.x = 0;
  }
}

function move(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var axis = interaction.prepared.axis;

  if (axis === 'x' || axis === 'y') {
    var opposite = axis === 'x' ? 'y' : 'x';
    iEvent.page[opposite] = interaction.coords.start.page[opposite];
    iEvent.client[opposite] = interaction.coords.start.client[opposite];
    iEvent.delta[opposite] = 0;
  }
}
/**
 * ```js
 * interact(element).draggable({
 *     onstart: function (event) {},
 *     onmove : function (event) {},
 *     onend  : function (event) {},
 *
 *     // the axis in which the first movement must be
 *     // for the drag sequence to start
 *     // 'xy' by default - any direction
 *     startAxis: 'x' || 'y' || 'xy',
 *
 *     // 'xy' by default - don't restrict to one axis (move in any direction)
 *     // 'x' or 'y' to restrict movement to either axis
 *     // 'start' to restrict movement to the axis the drag started in
 *     lockAxis: 'x' || 'y' || 'xy' || 'start',
 *
 *     // max number of drags that can happen concurrently
 *     // with elements of this Interactable. Infinity by default
 *     max: Infinity,
 *
 *     // max number of drags that can target the same element+Interactable
 *     // 1 by default
 *     maxPerElement: 2
 * })
 *
 * var isDraggable = interact('element').draggable(); // true
 * ```
 *
 * Get or set whether drag actions can be performed on the target
 *
 * @alias Interactable.prototype.draggable
 *
 * @param {boolean | object} [options] true/false or An object with event
 * listeners to be fired on drag events (object makes the Interactable
 * draggable)
 * @return {boolean | Interactable} boolean indicating if this can be the
 * target of drag events, or this Interctable
 */


var draggable = function draggable(options) {
  if (is.object(options)) {
    this.options.drag.enabled = options.enabled !== false;
    this.setPerAction('drag', options);
    this.setOnEvents('drag', options);

    if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
      this.options.drag.lockAxis = options.lockAxis;
    }

    if (/^(xy|x|y)$/.test(options.startAxis)) {
      this.options.drag.startAxis = options.startAxis;
    }

    return this;
  }

  if (is.bool(options)) {
    this.options.drag.enabled = options;
    return this;
  }

  return this.options.drag;
};

var drag = {
  id: 'actions/drag',
  install: install,
  listeners: {
    'interactions:before-action-move': beforeMove,
    'interactions:action-resume': beforeMove,
    // dragmove
    'interactions:action-move': move,
    'auto-start:check': function autoStartCheck(arg) {
      var interaction = arg.interaction,
          interactable = arg.interactable,
          buttons = arg.buttons;
      var dragOptions = interactable.options.drag;

      if (!(dragOptions && dragOptions.enabled) || // check mouseButton setting if the pointer is down
      interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & interactable.options.drag.mouseButtons) === 0) {
        return undefined;
      }

      arg.action = {
        name: 'drag',
        axis: dragOptions.lockAxis === 'start' ? dragOptions.startAxis : dragOptions.lockAxis
      };
      return false;
    }
  },
  draggable: draggable,
  beforeMove: beforeMove,
  move: move,
  defaults: {
    startAxis: 'xy',
    lockAxis: 'xy'
  },
  getCursor: function getCursor() {
    return 'move';
  }
};
var ___default_1 = drag;
_$drag_1["default"] = ___default_1;

var _$arr_65 = {};
"use strict";

Object.defineProperty(_$arr_65, "__esModule", {
  value: true
});
_$arr_65.find = _$arr_65.findIndex = _$arr_65.from = _$arr_65.merge = _$arr_65.remove = _$arr_65.contains = void 0;

var contains = function contains(array, target) {
  return array.indexOf(target) !== -1;
};

_$arr_65.contains = contains;

var remove = function remove(array, target) {
  return array.splice(array.indexOf(target), 1);
};

_$arr_65.remove = remove;

var merge = function merge(target, source) {
  for (var _i = 0; _i < source.length; _i++) {
    var _ref;

    _ref = source[_i];
    var item = _ref;
    target.push(item);
  }

  return target;
};

_$arr_65.merge = merge;

var from = function from(source) {
  return merge([], source);
};

_$arr_65.from = from;

var findIndex = function findIndex(array, func) {
  for (var i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i;
    }
  }

  return -1;
};

_$arr_65.findIndex = findIndex;

var find = function find(array, func) {
  return array[findIndex(array, func)];
};

_$arr_65.find = find;

var _$domObjects_69 = {};
"use strict";

Object.defineProperty(_$domObjects_69, "__esModule", {
  value: true
});
_$domObjects_69["default"] = void 0;
var domObjects = {
  init: __init_69,
  document: null,
  DocumentFragment: null,
  SVGElement: null,
  SVGSVGElement: null,
  SVGElementInstance: null,
  Element: null,
  HTMLElement: null,
  Event: null,
  Touch: null,
  PointerEvent: null
};

function blank() {}

var ___default_69 = domObjects;
_$domObjects_69["default"] = ___default_69;

function __init_69(window) {
  var win = window;
  domObjects.document = win.document;
  domObjects.DocumentFragment = win.DocumentFragment || blank;
  domObjects.SVGElement = win.SVGElement || blank;
  domObjects.SVGSVGElement = win.SVGSVGElement || blank;
  domObjects.SVGElementInstance = win.SVGElementInstance || blank;
  domObjects.Element = win.Element || blank;
  domObjects.HTMLElement = win.HTMLElement || domObjects.Element;
  domObjects.Event = win.Event;
  domObjects.Touch = win.Touch || blank;
  domObjects.PointerEvent = win.PointerEvent || win.MSPointerEvent;
}

var _$browser_66 = {};
"use strict";

function ___typeof_66(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_66 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_66 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_66(obj); }

Object.defineProperty(_$browser_66, "__esModule", {
  value: true
});
_$browser_66["default"] = void 0;

var _domObjects = ___interopRequireDefault_66(_$domObjects_69);

var __is_66 = ___interopRequireWildcard_66(_$is_76);

var _window = ___interopRequireDefault_66(_$window_83);

function ___getRequireWildcardCache_66() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_66 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_66(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_66(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_66(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_66(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var browser = {
  init: __init_66,
  supportsTouch: null,
  supportsPointerEvent: null,
  isIOS7: null,
  isIOS: null,
  isIe9: null,
  isOperaMobile: null,
  prefixedMatchesSelector: null,
  pEventTypes: null,
  wheelEvent: null
};

function __init_66(window) {
  var Element = _domObjects["default"].Element;
  var navigator = _window["default"].window.navigator; // Does the browser support touch input?

  browser.supportsTouch = 'ontouchstart' in window || __is_66.func(window.DocumentTouch) && _domObjects["default"].document instanceof window.DocumentTouch; // Does the browser support PointerEvents

  browser.supportsPointerEvent = navigator.pointerEnabled !== false && !!_domObjects["default"].PointerEvent;
  browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform); // scrolling doesn't change the result of getClientRects on iOS 7

  browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);
  browser.isIe9 = /MSIE 9/.test(navigator.userAgent); // Opera Mobile must be handled differently

  browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && /Presto/.test(navigator.userAgent); // prefix matchesSelector

  browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';
  browser.pEventTypes = browser.supportsPointerEvent ? _domObjects["default"].PointerEvent === window.MSPointerEvent ? {
    up: 'MSPointerUp',
    down: 'MSPointerDown',
    over: 'mouseover',
    out: 'mouseout',
    move: 'MSPointerMove',
    cancel: 'MSPointerCancel'
  } : {
    up: 'pointerup',
    down: 'pointerdown',
    over: 'pointerover',
    out: 'pointerout',
    move: 'pointermove',
    cancel: 'pointercancel'
  } : null; // because Webkit and Opera still use 'mousewheel' event type

  browser.wheelEvent = 'onmousewheel' in _domObjects["default"].document ? 'mousewheel' : 'wheel';
}

var ___default_66 = browser;
_$browser_66["default"] = ___default_66;

var _$clone_67 = {};
"use strict";

function ___typeof_67(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_67 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_67 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_67(obj); }

Object.defineProperty(_$clone_67, "__esModule", {
  value: true
});
_$clone_67["default"] = clone;

var arr = ___interopRequireWildcard_67(_$arr_65);

var __is_67 = ___interopRequireWildcard_67(_$is_76);

function ___getRequireWildcardCache_67() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_67 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_67(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_67(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_67(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// tslint:disable-next-line ban-types
function clone(source) {
  var dest = {};

  for (var prop in source) {
    var value = source[prop];

    if (__is_67.plainObject(value)) {
      dest[prop] = clone(value);
    } else if (__is_67.array(value)) {
      dest[prop] = arr.from(value);
    } else {
      dest[prop] = value;
    }
  }

  return dest;
}

var _$domUtils_70 = {};
"use strict";

function ___typeof_70(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_70 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_70 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_70(obj); }

Object.defineProperty(_$domUtils_70, "__esModule", {
  value: true
});
_$domUtils_70.nodeContains = nodeContains;
_$domUtils_70.closest = closest;
_$domUtils_70.parentNode = parentNode;
_$domUtils_70.matchesSelector = matchesSelector;
_$domUtils_70.indexOfDeepestElement = indexOfDeepestElement;
_$domUtils_70.matchesUpTo = matchesUpTo;
_$domUtils_70.getActualElement = getActualElement;
_$domUtils_70.getScrollXY = getScrollXY;
_$domUtils_70.getElementClientRect = getElementClientRect;
_$domUtils_70.getElementRect = getElementRect;
_$domUtils_70.getPath = getPath;
_$domUtils_70.trySelector = trySelector;

var _browser = ___interopRequireDefault_70(_$browser_66);

var ___domObjects_70 = ___interopRequireDefault_70(_$domObjects_69);

var __is_70 = ___interopRequireWildcard_70(_$is_76);

var ___window_70 = ___interopRequireWildcard_70(_$window_83);

function ___getRequireWildcardCache_70() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_70 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_70(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_70(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_70(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_70(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function nodeContains(parent, child) {
  while (child) {
    if (child === parent) {
      return true;
    }

    child = child.parentNode;
  }

  return false;
}

function closest(element, selector) {
  while (__is_70.element(element)) {
    if (matchesSelector(element, selector)) {
      return element;
    }

    element = parentNode(element);
  }

  return null;
}

function parentNode(node) {
  var parent = node.parentNode;

  if (__is_70.docFrag(parent)) {
    // skip past #shado-root fragments
    // tslint:disable-next-line
    while ((parent = parent.host) && __is_70.docFrag(parent)) {
      continue;
    }

    return parent;
  }

  return parent;
}

function matchesSelector(element, selector) {
  // remove /deep/ from selectors if shadowDOM polyfill is used
  if (___window_70["default"].window !== ___window_70["default"].realWindow) {
    selector = selector.replace(/\/deep\//g, ' ');
  }

  return element[_browser["default"].prefixedMatchesSelector](selector);
}

var getParent = function getParent(el) {
  return el.parentNode ? el.parentNode : el.host;
}; // Test for the element that's "above" all other qualifiers


function indexOfDeepestElement(elements) {
  var deepestZoneParents = [];
  var deepestZone = elements[0];
  var index = deepestZone ? 0 : -1;
  var i;
  var n;

  for (i = 1; i < elements.length; i++) {
    var dropzone = elements[i]; // an element might belong to multiple selector dropzones

    if (!dropzone || dropzone === deepestZone) {
      continue;
    }

    if (!deepestZone) {
      deepestZone = dropzone;
      index = i;
      continue;
    } // check if the deepest or current are document.documentElement or document.rootElement
    // - if the current dropzone is, do nothing and continue


    if (dropzone.parentNode === dropzone.ownerDocument) {
      continue;
    } // - if deepest is, update with the current dropzone and continue to next
    else if (deepestZone.parentNode === dropzone.ownerDocument) {
        deepestZone = dropzone;
        index = i;
        continue;
      } // compare zIndex of siblings


    if (dropzone.parentNode === deepestZone.parentNode) {
      var deepestZIndex = parseInt((0, ___window_70.getWindow)(deepestZone).getComputedStyle(deepestZone).zIndex, 10) || 0;
      var dropzoneZIndex = parseInt((0, ___window_70.getWindow)(dropzone).getComputedStyle(dropzone).zIndex, 10) || 0;

      if (dropzoneZIndex >= deepestZIndex) {
        deepestZone = dropzone;
        index = i;
      }

      continue;
    } // populate the ancestry array for the latest deepest dropzone


    if (!deepestZoneParents.length) {
      var _parent = deepestZone;
      var parentParent = void 0;

      while ((parentParent = getParent(_parent)) && parentParent !== _parent.ownerDocument) {
        deepestZoneParents.unshift(_parent);
        _parent = parentParent;
      }
    }

    var parent = void 0; // if this element is an svg element and the current deepest is an
    // HTMLElement

    if (deepestZone instanceof ___domObjects_70["default"].HTMLElement && dropzone instanceof ___domObjects_70["default"].SVGElement && !(dropzone instanceof ___domObjects_70["default"].SVGSVGElement)) {
      if (dropzone === deepestZone.parentNode) {
        continue;
      }

      parent = dropzone.ownerSVGElement;
    } else {
      parent = dropzone;
    }

    var dropzoneParents = [];

    while (parent.parentNode !== parent.ownerDocument) {
      dropzoneParents.unshift(parent);
      parent = getParent(parent);
    }

    n = 0; // get (position of last common ancestor) + 1

    while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
      n++;
    }

    var parents = [dropzoneParents[n - 1], dropzoneParents[n], deepestZoneParents[n]];
    var child = parents[0].lastChild;

    while (child) {
      if (child === parents[1]) {
        deepestZone = dropzone;
        index = i;
        deepestZoneParents = dropzoneParents;
        break;
      } else if (child === parents[2]) {
        break;
      }

      child = child.previousSibling;
    }
  }

  return index;
}

function matchesUpTo(element, selector, limit) {
  while (__is_70.element(element)) {
    if (matchesSelector(element, selector)) {
      return true;
    }

    element = parentNode(element);

    if (element === limit) {
      return matchesSelector(element, selector);
    }
  }

  return false;
}

function getActualElement(element) {
  return element instanceof ___domObjects_70["default"].SVGElementInstance ? element.correspondingUseElement : element;
}

function getScrollXY(relevantWindow) {
  relevantWindow = relevantWindow || ___window_70["default"].window;
  return {
    x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
    y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
  };
}

function getElementClientRect(element) {
  var clientRect = element instanceof ___domObjects_70["default"].SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];
  return clientRect && {
    left: clientRect.left,
    right: clientRect.right,
    top: clientRect.top,
    bottom: clientRect.bottom,
    width: clientRect.width || clientRect.right - clientRect.left,
    height: clientRect.height || clientRect.bottom - clientRect.top
  };
}

function getElementRect(element) {
  var clientRect = getElementClientRect(element);

  if (!_browser["default"].isIOS7 && clientRect) {
    var scroll = getScrollXY(___window_70["default"].getWindow(element));
    clientRect.left += scroll.x;
    clientRect.right += scroll.x;
    clientRect.top += scroll.y;
    clientRect.bottom += scroll.y;
  }

  return clientRect;
}

function getPath(node) {
  var path = [];

  while (node) {
    path.push(node);
    node = parentNode(node);
  }

  return path;
}

function trySelector(value) {
  if (!__is_70.string(value)) {
    return false;
  } // an exception will be raised if it is invalid


  ___domObjects_70["default"].document.querySelector(value);

  return true;
}

var _$extend_72 = {};
"use strict";

Object.defineProperty(_$extend_72, "__esModule", {
  value: true
});
_$extend_72["default"] = extend;

function extend(dest, source) {
  for (var prop in source) {
    dest[prop] = source[prop];
  }

  var ret = dest;
  return ret;
}

var _$normalizeListeners_78 = {};
"use strict";

function ___typeof_78(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_78 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_78 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_78(obj); }

Object.defineProperty(_$normalizeListeners_78, "__esModule", {
  value: true
});
_$normalizeListeners_78["default"] = normalize;

var _extend = ___interopRequireDefault_78(_$extend_72);

var __is_78 = ___interopRequireWildcard_78(_$is_76);

function ___getRequireWildcardCache_78() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_78 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_78(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_78(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_78(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_78(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function normalize(type, listeners, result) {
  result = result || {};

  if (__is_78.string(type) && type.search(' ') !== -1) {
    type = split(type);
  }

  if (__is_78.array(type)) {
    return type.reduce(function (acc, t) {
      return (0, _extend["default"])(acc, normalize(t, listeners, result));
    }, result);
  } // ({ type: fn }) -> ('', { type: fn })


  if (__is_78.object(type)) {
    listeners = type;
    type = '';
  }

  if (__is_78.func(listeners)) {
    result[type] = result[type] || [];
    result[type].push(listeners);
  } else if (__is_78.array(listeners)) {
    for (var _i = 0; _i < listeners.length; _i++) {
      var _ref;

      _ref = listeners[_i];
      var l = _ref;
      normalize(type, l, result);
    }
  } else if (__is_78.object(listeners)) {
    for (var prefix in listeners) {
      var combinedTypes = split(prefix).map(function (p) {
        return "".concat(type).concat(p);
      });
      normalize(combinedTypes, listeners[prefix], result);
    }
  }

  return result;
}

function split(type) {
  return type.trim().split(/ +/);
}

var _$Eventable_17 = {};
"use strict";

function ___typeof_17(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_17 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_17 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_17(obj); }

Object.defineProperty(_$Eventable_17, "__esModule", {
  value: true
});
_$Eventable_17["default"] = void 0;

var __arr_17 = ___interopRequireWildcard_17(_$arr_65);

var ___extend_17 = ___interopRequireDefault_17(_$extend_72);

var _normalizeListeners = ___interopRequireDefault_17(_$normalizeListeners_78);

function ___interopRequireDefault_17(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_17() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_17 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_17(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_17(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_17(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function fireUntilImmediateStopped(event, listeners) {
  for (var _i = 0; _i < listeners.length; _i++) {
    var _ref;

    _ref = listeners[_i];
    var listener = _ref;

    if (event.immediatePropagationStopped) {
      break;
    }

    listener(event);
  }
}

var Eventable = /*#__PURE__*/function () {
  function Eventable(options) {
    _classCallCheck(this, Eventable);

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "types", {});

    _defineProperty(this, "propagationStopped", false);

    _defineProperty(this, "immediatePropagationStopped", false);

    _defineProperty(this, "global", void 0);

    this.options = (0, ___extend_17["default"])({}, options || {});
  }

  _createClass(Eventable, [{
    key: "fire",
    value: function fire(event) {
      var listeners;
      var global = this.global; // Interactable#on() listeners
      // tslint:disable no-conditional-assignment

      if (listeners = this.types[event.type]) {
        fireUntilImmediateStopped(event, listeners);
      } // interact.on() listeners


      if (!event.propagationStopped && global && (listeners = global[event.type])) {
        fireUntilImmediateStopped(event, listeners);
      }
    }
  }, {
    key: "on",
    value: function on(type, listener) {
      var listeners = (0, _normalizeListeners["default"])(type, listener);

      for (type in listeners) {
        this.types[type] = __arr_17.merge(this.types[type] || [], listeners[type]);
      }
    }
  }, {
    key: "off",
    value: function off(type, listener) {
      var listeners = (0, _normalizeListeners["default"])(type, listener);

      for (type in listeners) {
        var eventList = this.types[type];

        if (!eventList || !eventList.length) {
          continue;
        }

        for (var _i2 = 0; _i2 < listeners[type].length; _i2++) {
          var _ref2;

          _ref2 = listeners[type][_i2];
          var subListener = _ref2;

          var _index = eventList.indexOf(subListener);

          if (_index !== -1) {
            eventList.splice(_index, 1);
          }
        }
      }
    }
  }, {
    key: "getRect",
    value: function getRect(_element) {
      return null;
    }
  }]);

  return Eventable;
}();

var ___default_17 = Eventable;
_$Eventable_17["default"] = ___default_17;

var _$hypot_74 = {};
"use strict";

Object.defineProperty(_$hypot_74, "__esModule", {
  value: true
});
_$hypot_74["default"] = void 0;

var ___default_74 = function _default(x, y) {
  return Math.sqrt(x * x + y * y);
};

_$hypot_74["default"] = ___default_74;

var _$pointerExtend_79 = {};
"use strict";

Object.defineProperty(_$pointerExtend_79, "__esModule", {
  value: true
});
_$pointerExtend_79["default"] = void 0;

function pointerExtend(dest, source) {
  for (var prop in source) {
    var prefixedPropREs = pointerExtend.prefixedPropREs;
    var deprecated = false; // skip deprecated prefixed properties

    for (var vendor in prefixedPropREs) {
      if (prop.indexOf(vendor) === 0 && prefixedPropREs[vendor].test(prop)) {
        deprecated = true;
        break;
      }
    }

    if (!deprecated && typeof source[prop] !== 'function') {
      dest[prop] = source[prop];
    }
  }

  return dest;
}

pointerExtend.prefixedPropREs = {
  webkit: /(Movement[XY]|Radius[XY]|RotationAngle|Force)$/,
  moz: /(Pressure)$/
};
var ___default_79 = pointerExtend;
_$pointerExtend_79["default"] = ___default_79;

var _$pointerUtils_80 = {};
"use strict";

function ___typeof_80(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_80 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_80 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_80(obj); }

Object.defineProperty(_$pointerUtils_80, "__esModule", {
  value: true
});
_$pointerUtils_80.copyCoords = copyCoords;
_$pointerUtils_80.setCoordDeltas = setCoordDeltas;
_$pointerUtils_80.setCoordVelocity = setCoordVelocity;
_$pointerUtils_80.setZeroCoords = setZeroCoords;
_$pointerUtils_80.isNativePointer = isNativePointer;
_$pointerUtils_80.getXY = getXY;
_$pointerUtils_80.getPageXY = getPageXY;
_$pointerUtils_80.getClientXY = getClientXY;
_$pointerUtils_80.getPointerId = getPointerId;
_$pointerUtils_80.setCoords = setCoords;
_$pointerUtils_80.getTouchPair = getTouchPair;
_$pointerUtils_80.pointerAverage = pointerAverage;
_$pointerUtils_80.touchBBox = touchBBox;
_$pointerUtils_80.touchDistance = touchDistance;
_$pointerUtils_80.touchAngle = touchAngle;
_$pointerUtils_80.getPointerType = getPointerType;
_$pointerUtils_80.getEventTargets = getEventTargets;
_$pointerUtils_80.newCoords = newCoords;
_$pointerUtils_80.coordsToEvent = coordsToEvent;
Object.defineProperty(_$pointerUtils_80, "pointerExtend", {
  enumerable: true,
  get: function get() {
    return _pointerExtend["default"];
  }
});

var ___browser_80 = ___interopRequireDefault_80(_$browser_66);

var ___domObjects_80 = ___interopRequireDefault_80(_$domObjects_69);

var domUtils = ___interopRequireWildcard_80(_$domUtils_70);

var _hypot = ___interopRequireDefault_80(_$hypot_74);

var __is_80 = ___interopRequireWildcard_80(_$is_76);

var _pointerExtend = ___interopRequireDefault_80(_$pointerExtend_79);

function ___getRequireWildcardCache_80() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_80 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_80(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_80(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_80(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_80(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function copyCoords(dest, src) {
  dest.page = dest.page || {};
  dest.page.x = src.page.x;
  dest.page.y = src.page.y;
  dest.client = dest.client || {};
  dest.client.x = src.client.x;
  dest.client.y = src.client.y;
  dest.timeStamp = src.timeStamp;
}

function setCoordDeltas(targetObj, prev, cur) {
  targetObj.page.x = cur.page.x - prev.page.x;
  targetObj.page.y = cur.page.y - prev.page.y;
  targetObj.client.x = cur.client.x - prev.client.x;
  targetObj.client.y = cur.client.y - prev.client.y;
  targetObj.timeStamp = cur.timeStamp - prev.timeStamp;
}

function setCoordVelocity(targetObj, delta) {
  var dt = Math.max(delta.timeStamp / 1000, 0.001);
  targetObj.page.x = delta.page.x / dt;
  targetObj.page.y = delta.page.y / dt;
  targetObj.client.x = delta.client.x / dt;
  targetObj.client.y = delta.client.y / dt;
  targetObj.timeStamp = dt;
}

function setZeroCoords(targetObj) {
  targetObj.page.x = 0;
  targetObj.page.y = 0;
  targetObj.client.x = 0;
  targetObj.client.y = 0;
}

function isNativePointer(pointer) {
  return pointer instanceof ___domObjects_80["default"].Event || pointer instanceof ___domObjects_80["default"].Touch;
} // Get specified X/Y coords for mouse or event.touches[0]


function getXY(type, pointer, xy) {
  xy = xy || {};
  type = type || 'page';
  xy.x = pointer[type + 'X'];
  xy.y = pointer[type + 'Y'];
  return xy;
}

function getPageXY(pointer, page) {
  page = page || {
    x: 0,
    y: 0
  }; // Opera Mobile handles the viewport and scrolling oddly

  if (___browser_80["default"].isOperaMobile && isNativePointer(pointer)) {
    getXY('screen', pointer, page);
    page.x += window.scrollX;
    page.y += window.scrollY;
  } else {
    getXY('page', pointer, page);
  }

  return page;
}

function getClientXY(pointer, client) {
  client = client || {};

  if (___browser_80["default"].isOperaMobile && isNativePointer(pointer)) {
    // Opera Mobile handles the viewport and scrolling oddly
    getXY('screen', pointer, client);
  } else {
    getXY('client', pointer, client);
  }

  return client;
}

function getPointerId(pointer) {
  return __is_80.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
}

function setCoords(targetObj, pointers, timeStamp) {
  var pointer = pointers.length > 1 ? pointerAverage(pointers) : pointers[0];
  var tmpXY = {};
  getPageXY(pointer, tmpXY);
  targetObj.page.x = tmpXY.x;
  targetObj.page.y = tmpXY.y;
  getClientXY(pointer, tmpXY);
  targetObj.client.x = tmpXY.x;
  targetObj.client.y = tmpXY.y;
  targetObj.timeStamp = timeStamp;
}

function getTouchPair(event) {
  var touches = []; // array of touches is supplied

  if (__is_80.array(event)) {
    touches[0] = event[0];
    touches[1] = event[1];
  } // an event
  else {
      if (event.type === 'touchend') {
        if (event.touches.length === 1) {
          touches[0] = event.touches[0];
          touches[1] = event.changedTouches[0];
        } else if (event.touches.length === 0) {
          touches[0] = event.changedTouches[0];
          touches[1] = event.changedTouches[1];
        }
      } else {
        touches[0] = event.touches[0];
        touches[1] = event.touches[1];
      }
    }

  return touches;
}

function pointerAverage(pointers) {
  var average = {
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    screenX: 0,
    screenY: 0
  };

  for (var _i = 0; _i < pointers.length; _i++) {
    var _ref;

    _ref = pointers[_i];
    var pointer = _ref;

    for (var _prop in average) {
      average[_prop] += pointer[_prop];
    }
  }

  for (var prop in average) {
    average[prop] /= pointers.length;
  }

  return average;
}

function touchBBox(event) {
  if (!event.length && !(event.touches && event.touches.length > 1)) {
    return null;
  }

  var touches = getTouchPair(event);
  var minX = Math.min(touches[0].pageX, touches[1].pageX);
  var minY = Math.min(touches[0].pageY, touches[1].pageY);
  var maxX = Math.max(touches[0].pageX, touches[1].pageX);
  var maxY = Math.max(touches[0].pageY, touches[1].pageY);
  return {
    x: minX,
    y: minY,
    left: minX,
    top: minY,
    right: maxX,
    bottom: maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function touchDistance(event, deltaSource) {
  var sourceX = deltaSource + 'X';
  var sourceY = deltaSource + 'Y';
  var touches = getTouchPair(event);
  var dx = touches[0][sourceX] - touches[1][sourceX];
  var dy = touches[0][sourceY] - touches[1][sourceY];
  return (0, _hypot["default"])(dx, dy);
}

function touchAngle(event, deltaSource) {
  var sourceX = deltaSource + 'X';
  var sourceY = deltaSource + 'Y';
  var touches = getTouchPair(event);
  var dx = touches[1][sourceX] - touches[0][sourceX];
  var dy = touches[1][sourceY] - touches[0][sourceY];
  var angle = 180 * Math.atan2(dy, dx) / Math.PI;
  return angle;
}

function getPointerType(pointer) {
  return __is_80.string(pointer.pointerType) ? pointer.pointerType : __is_80.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType] // if the PointerEvent API isn't available, then the "pointer" must
  // be either a MouseEvent, TouchEvent, or Touch object
  : /touch/.test(pointer.type) || pointer instanceof ___domObjects_80["default"].Touch ? 'touch' : 'mouse';
} // [ event.target, event.currentTarget ]


function getEventTargets(event) {
  var path = __is_80.func(event.composedPath) ? event.composedPath() : event.path;
  return [domUtils.getActualElement(path ? path[0] : event.target), domUtils.getActualElement(event.currentTarget)];
}

function newCoords() {
  return {
    page: {
      x: 0,
      y: 0
    },
    client: {
      x: 0,
      y: 0
    },
    timeStamp: 0
  };
}

function coordsToEvent(coords) {
  var event = {
    coords: coords,

    get page() {
      return this.coords.page;
    },

    get client() {
      return this.coords.client;
    },

    get timeStamp() {
      return this.coords.timeStamp;
    },

    get pageX() {
      return this.coords.page.x;
    },

    get pageY() {
      return this.coords.page.y;
    },

    get clientX() {
      return this.coords.client.x;
    },

    get clientY() {
      return this.coords.client.y;
    },

    get pointerId() {
      return this.coords.pointerId;
    },

    get target() {
      return this.coords.target;
    },

    get type() {
      return this.coords.type;
    },

    get pointerType() {
      return this.coords.pointerType;
    },

    get buttons() {
      return this.coords.buttons;
    },

    preventDefault: function preventDefault() {}
  };
  return event;
}

var _$rect_82 = {};
"use strict";

function ___typeof_82(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_82 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_82 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_82(obj); }

Object.defineProperty(_$rect_82, "__esModule", {
  value: true
});
_$rect_82.getStringOptionResult = getStringOptionResult;
_$rect_82.resolveRectLike = resolveRectLike;
_$rect_82.rectToXY = rectToXY;
_$rect_82.xywhToTlbr = xywhToTlbr;
_$rect_82.tlbrToXywh = tlbrToXywh;
_$rect_82.addEdges = addEdges;

/* removed: var _$domUtils_70 = require("./domUtils"); */;

var ___extend_82 = ___interopRequireDefault_82(_$extend_72);

var __is_82 = ___interopRequireWildcard_82(_$is_76);

function ___getRequireWildcardCache_82() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_82 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_82(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_82(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_82(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_82(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function getStringOptionResult(value, target, element) {
  if (value === 'parent') {
    return (0, _$domUtils_70.parentNode)(element);
  }

  if (value === 'self') {
    return target.getRect(element);
  }

  return (0, _$domUtils_70.closest)(element, value);
}

function resolveRectLike(value, target, element, functionArgs) {
  var returnValue = value;

  if (__is_82.string(returnValue)) {
    returnValue = getStringOptionResult(returnValue, target, element);
  } else if (__is_82.func(returnValue)) {
    returnValue = returnValue.apply(void 0, _toConsumableArray(functionArgs));
  }

  if (__is_82.element(returnValue)) {
    returnValue = (0, _$domUtils_70.getElementRect)(returnValue);
  }

  return returnValue;
}

function rectToXY(rect) {
  return rect && {
    x: 'x' in rect ? rect.x : rect.left,
    y: 'y' in rect ? rect.y : rect.top
  };
}

function xywhToTlbr(rect) {
  if (rect && !('left' in rect && 'top' in rect)) {
    rect = (0, ___extend_82["default"])({}, rect);
    rect.left = rect.x || 0;
    rect.top = rect.y || 0;
    rect.right = rect.right || rect.left + rect.width;
    rect.bottom = rect.bottom || rect.top + rect.height;
  }

  return rect;
}

function tlbrToXywh(rect) {
  if (rect && !('x' in rect && 'y' in rect)) {
    rect = (0, ___extend_82["default"])({}, rect);
    rect.x = rect.left || 0;
    rect.y = rect.top || 0;
    rect.width = rect.width || rect.right || 0 - rect.x;
    rect.height = rect.height || rect.bottom || 0 - rect.y;
  }

  return rect;
}

function addEdges(edges, rect, delta) {
  if (edges.left) {
    rect.left += delta.x;
  }

  if (edges.right) {
    rect.right += delta.x;
  }

  if (edges.top) {
    rect.top += delta.y;
  }

  if (edges.bottom) {
    rect.bottom += delta.y;
  }

  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;
}

var _$getOriginXY_73 = {};
"use strict";

Object.defineProperty(_$getOriginXY_73, "__esModule", {
  value: true
});
_$getOriginXY_73["default"] = ___default_73;

/* removed: var _$rect_82 = require("./rect"); */;

function ___default_73(target, element, actionName) {
  var actionOptions = target.options[actionName];
  var actionOrigin = actionOptions && actionOptions.origin;
  var origin = actionOrigin || target.options.origin;
  var originRect = (0, _$rect_82.resolveRectLike)(origin, target, element, [target && element]);
  return (0, _$rect_82.rectToXY)(originRect) || {
    x: 0,
    y: 0
  };
}

var _$raf_81 = {};
"use strict";

Object.defineProperty(_$raf_81, "__esModule", {
  value: true
});
_$raf_81["default"] = void 0;
var lastTime = 0;

var _request;

var _cancel;

function __init_81(window) {
  _request = window.requestAnimationFrame;
  _cancel = window.cancelAnimationFrame;

  if (!_request) {
    var vendors = ['ms', 'moz', 'webkit', 'o'];

    for (var _i = 0; _i < vendors.length; _i++) {
      var vendor = vendors[_i];
      _request = window["".concat(vendor, "RequestAnimationFrame")];
      _cancel = window["".concat(vendor, "CancelAnimationFrame")] || window["".concat(vendor, "CancelRequestAnimationFrame")];
    }
  }

  if (!_request) {
    _request = function request(callback) {
      var currTime = Date.now();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime)); // eslint-disable-next-line standard/no-callback-literal

      var token = setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return token;
    };

    _cancel = function cancel(token) {
      return clearTimeout(token);
    };
  }
}

var ___default_81 = {
  request: function request(callback) {
    return _request(callback);
  },
  cancel: function cancel(token) {
    return _cancel(token);
  },
  init: __init_81
};
_$raf_81["default"] = ___default_81;

var _$index_75 = {};
"use strict";

function ___typeof_75(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_75 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_75 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_75(obj); }

Object.defineProperty(_$index_75, "__esModule", {
  value: true
});
_$index_75.warnOnce = warnOnce;
_$index_75.copyAction = copyAction;
Object.defineProperty(_$index_75, "win", {
  enumerable: true,
  get: function get() {
    return ___window_75["default"];
  }
});
Object.defineProperty(_$index_75, "browser", {
  enumerable: true,
  get: function get() {
    return ___browser_75["default"];
  }
});
Object.defineProperty(_$index_75, "clone", {
  enumerable: true,
  get: function get() {
    return _clone["default"];
  }
});
Object.defineProperty(_$index_75, "extend", {
  enumerable: true,
  get: function get() {
    return ___extend_75["default"];
  }
});
Object.defineProperty(_$index_75, "getOriginXY", {
  enumerable: true,
  get: function get() {
    return _getOriginXY["default"];
  }
});
Object.defineProperty(_$index_75, "hypot", {
  enumerable: true,
  get: function get() {
    return ___hypot_75["default"];
  }
});
Object.defineProperty(_$index_75, "normalizeListeners", {
  enumerable: true,
  get: function get() {
    return ___normalizeListeners_75["default"];
  }
});
Object.defineProperty(_$index_75, "raf", {
  enumerable: true,
  get: function get() {
    return _raf["default"];
  }
});
_$index_75.rect = _$index_75.pointer = _$index_75.is = _$index_75.dom = _$index_75.arr = void 0;

var __arr_75 = ___interopRequireWildcard_75(_$arr_65);

_$index_75.arr = __arr_75;

var dom = ___interopRequireWildcard_75(_$domUtils_70);

_$index_75.dom = dom;

var __is_75 = ___interopRequireWildcard_75(_$is_76);

_$index_75.is = __is_75;

var pointer = ___interopRequireWildcard_75(_$pointerUtils_80);

_$index_75.pointer = pointer;

var rect = ___interopRequireWildcard_75(_$rect_82);

_$index_75.rect = rect;

var ___window_75 = ___interopRequireDefault_75(_$window_83);

var ___browser_75 = ___interopRequireDefault_75(_$browser_66);

var _clone = ___interopRequireDefault_75(_$clone_67);

var ___extend_75 = ___interopRequireDefault_75(_$extend_72);

var _getOriginXY = ___interopRequireDefault_75(_$getOriginXY_73);

var ___hypot_75 = ___interopRequireDefault_75(_$hypot_74);

var ___normalizeListeners_75 = ___interopRequireDefault_75(_$normalizeListeners_78);

var _raf = ___interopRequireDefault_75(_$raf_81);

function ___interopRequireDefault_75(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_75() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_75 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_75(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_75(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_75(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function warnOnce(method, message) {
  var warned = false; // eslint-disable-next-line no-shadow

  return function () {
    if (!warned) {
      ___window_75["default"].window.console.warn(message);

      warned = true;
    }

    return method.apply(this, arguments);
  };
}

function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;
  return dest;
}

var _$BaseEvent_16 = {};
"use strict";

Object.defineProperty(_$BaseEvent_16, "__esModule", {
  value: true
});
_$BaseEvent_16["default"] = _$BaseEvent_16.BaseEvent = void 0;

function ___classCallCheck_16(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_16(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_16(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_16(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_16(Constructor, staticProps); return Constructor; }

function ___defineProperty_16(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var BaseEvent = /*#__PURE__*/function () {
  ___createClass_16(BaseEvent, [{
    key: "interaction",
    get: function get() {
      return this._interaction._proxy;
    }
  }]);

  function BaseEvent(interaction) {
    ___classCallCheck_16(this, BaseEvent);

    ___defineProperty_16(this, "type", void 0);

    ___defineProperty_16(this, "target", void 0);

    ___defineProperty_16(this, "currentTarget", void 0);

    ___defineProperty_16(this, "interactable", void 0);

    ___defineProperty_16(this, "_interaction", void 0);

    ___defineProperty_16(this, "timeStamp", void 0);

    ___defineProperty_16(this, "immediatePropagationStopped", false);

    ___defineProperty_16(this, "propagationStopped", false);

    this._interaction = interaction;
  }

  ___createClass_16(BaseEvent, [{
    key: "preventDefault",
    value: function preventDefault() {}
    /**
     * Don't call any other listeners (even on the current target)
     */

  }, {
    key: "stopPropagation",
    value: function stopPropagation() {
      this.propagationStopped = true;
    }
    /**
     * Don't call listeners on the remaining targets
     */

  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }
  }]);

  return BaseEvent;
}();

_$BaseEvent_16.BaseEvent = BaseEvent;
var ___default_16 = BaseEvent;
_$BaseEvent_16["default"] = ___default_16;

var _$defaultOptions_24 = {};
"use strict";

Object.defineProperty(_$defaultOptions_24, "__esModule", {
  value: true
});
_$defaultOptions_24["default"] = _$defaultOptions_24.defaults = void 0;
// tslint:disable no-empty-interface
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface Options extends BaseDefaults, PerActionDefaults {}
var defaults = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page'
  },
  perAction: {
    enabled: false,
    origin: {
      x: 0,
      y: 0
    }
  },
  actions: {}
};
_$defaultOptions_24.defaults = defaults;
var ___default_24 = defaults;
_$defaultOptions_24["default"] = ___default_24;

var _$InteractEvent_18 = {};
"use strict";

Object.defineProperty(_$InteractEvent_18, "__esModule", {
  value: true
});
_$InteractEvent_18["default"] = _$InteractEvent_18.InteractEvent = void 0;

var ___extend_18 = ___interopRequireDefault_18(_$extend_72);

var ___getOriginXY_18 = ___interopRequireDefault_18(_$getOriginXY_73);

var ___hypot_18 = ___interopRequireDefault_18(_$hypot_74);

var _BaseEvent2 = ___interopRequireDefault_18(_$BaseEvent_16);

var _defaultOptions = ___interopRequireDefault_18(_$defaultOptions_24);

function ___interopRequireDefault_18(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___typeof_18(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_18 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_18 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_18(obj); }

function ___classCallCheck_18(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_18(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_18(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_18(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_18(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (___typeof_18(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function ___defineProperty_18(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var InteractEvent = /*#__PURE__*/function (_BaseEvent) {
  _inherits(InteractEvent, _BaseEvent);

  // drag
  // resize

  /** */
  function InteractEvent(interaction, event, actionName, phase, element, preEnd, type) {
    var _this;

    ___classCallCheck_18(this, InteractEvent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InteractEvent).call(this, interaction));

    ___defineProperty_18(_assertThisInitialized(_this), "target", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "currentTarget", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "relatedTarget", null);

    ___defineProperty_18(_assertThisInitialized(_this), "screenX", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "screenY", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "button", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "buttons", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "ctrlKey", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "shiftKey", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "altKey", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "metaKey", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "page", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "client", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "delta", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "rect", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "x0", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "y0", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "t0", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "dt", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "duration", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "clientX0", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "clientY0", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "velocity", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "speed", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "swipe", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "timeStamp", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "dragEnter", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "dragLeave", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "axes", void 0);

    ___defineProperty_18(_assertThisInitialized(_this), "preEnd", void 0);

    element = element || interaction.element;
    var target = interaction.interactable;
    var deltaSource = (target && target.options || _defaultOptions["default"]).deltaSource;
    var origin = (0, ___getOriginXY_18["default"])(target, element, actionName);
    var starting = phase === 'start';
    var ending = phase === 'end';
    var prevEvent = starting ? _assertThisInitialized(_this) : interaction.prevEvent;
    var coords = starting ? interaction.coords.start : ending ? {
      page: prevEvent.page,
      client: prevEvent.client,
      timeStamp: interaction.coords.cur.timeStamp
    } : interaction.coords.cur;
    _this.page = (0, ___extend_18["default"])({}, coords.page);
    _this.client = (0, ___extend_18["default"])({}, coords.client);
    _this.rect = (0, ___extend_18["default"])({}, interaction.rect);
    _this.timeStamp = coords.timeStamp;

    if (!ending) {
      _this.page.x -= origin.x;
      _this.page.y -= origin.y;
      _this.client.x -= origin.x;
      _this.client.y -= origin.y;
    }

    _this.ctrlKey = event.ctrlKey;
    _this.altKey = event.altKey;
    _this.shiftKey = event.shiftKey;
    _this.metaKey = event.metaKey;
    _this.button = event.button;
    _this.buttons = event.buttons;
    _this.target = element;
    _this.currentTarget = element;
    _this.preEnd = preEnd;
    _this.type = type || actionName + (phase || '');
    _this.interactable = target;
    _this.t0 = starting ? interaction.pointers[interaction.pointers.length - 1].downTime : prevEvent.t0;
    _this.x0 = interaction.coords.start.page.x - origin.x;
    _this.y0 = interaction.coords.start.page.y - origin.y;
    _this.clientX0 = interaction.coords.start.client.x - origin.x;
    _this.clientY0 = interaction.coords.start.client.y - origin.y;

    if (starting || ending) {
      _this.delta = {
        x: 0,
        y: 0
      };
    } else {
      _this.delta = {
        x: _this[deltaSource].x - prevEvent[deltaSource].x,
        y: _this[deltaSource].y - prevEvent[deltaSource].y
      };
    }

    _this.dt = interaction.coords.delta.timeStamp;
    _this.duration = _this.timeStamp - _this.t0; // velocity and speed in pixels per second

    _this.velocity = (0, ___extend_18["default"])({}, interaction.coords.velocity[deltaSource]);
    _this.speed = (0, ___hypot_18["default"])(_this.velocity.x, _this.velocity.y);
    _this.swipe = ending || phase === 'inertiastart' ? _this.getSwipe() : null;
    return _this;
  }

  ___createClass_18(InteractEvent, [{
    key: "getSwipe",
    value: function getSwipe() {
      var interaction = this._interaction;

      if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
        return null;
      }

      var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
      var overlap = 22.5;

      if (angle < 0) {
        angle += 360;
      }

      var left = 135 - overlap <= angle && angle < 225 + overlap;
      var up = 225 - overlap <= angle && angle < 315 + overlap;
      var right = !left && (315 - overlap <= angle || angle < 45 + overlap);
      var down = !up && 45 - overlap <= angle && angle < 135 + overlap;
      return {
        up: up,
        down: down,
        left: left,
        right: right,
        angle: angle,
        speed: interaction.prevEvent.speed,
        velocity: {
          x: interaction.prevEvent.velocityX,
          y: interaction.prevEvent.velocityY
        }
      };
    }
  }, {
    key: "preventDefault",
    value: function preventDefault() {}
    /**
     * Don't call listeners on the remaining targets
     */

  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }
    /**
     * Don't call any other listeners (even on the current target)
     */

  }, {
    key: "stopPropagation",
    value: function stopPropagation() {
      this.propagationStopped = true;
    }
  }, {
    key: "pageX",
    get: function get() {
      return this.page.x;
    },
    set: function set(value) {
      this.page.x = value;
    }
  }, {
    key: "pageY",
    get: function get() {
      return this.page.y;
    },
    set: function set(value) {
      this.page.y = value;
    }
  }, {
    key: "clientX",
    get: function get() {
      return this.client.x;
    },
    set: function set(value) {
      this.client.x = value;
    }
  }, {
    key: "clientY",
    get: function get() {
      return this.client.y;
    },
    set: function set(value) {
      this.client.y = value;
    }
  }, {
    key: "dx",
    get: function get() {
      return this.delta.x;
    },
    set: function set(value) {
      this.delta.x = value;
    }
  }, {
    key: "dy",
    get: function get() {
      return this.delta.y;
    },
    set: function set(value) {
      this.delta.y = value;
    }
  }, {
    key: "velocityX",
    get: function get() {
      return this.velocity.x;
    },
    set: function set(value) {
      this.velocity.x = value;
    }
  }, {
    key: "velocityY",
    get: function get() {
      return this.velocity.y;
    },
    set: function set(value) {
      this.velocity.y = value;
    }
  }]);

  return InteractEvent;
}(_BaseEvent2["default"]);

_$InteractEvent_18.InteractEvent = InteractEvent;
var ___default_18 = InteractEvent;
_$InteractEvent_18["default"] = ___default_18;

var _$InteractableSet_21 = {};
"use strict";

function ___typeof_21(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_21 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_21 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_21(obj); }

Object.defineProperty(_$InteractableSet_21, "__esModule", {
  value: true
});
_$InteractableSet_21["default"] = void 0;

var __arr_21 = ___interopRequireWildcard_21(_$arr_65);

var __domUtils_21 = ___interopRequireWildcard_21(_$domUtils_70);

var ___extend_21 = ___interopRequireDefault_21(_$extend_72);

var __is_21 = ___interopRequireWildcard_21(_$is_76);

function ___interopRequireDefault_21(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_21() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_21 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_21(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_21(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_21(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___classCallCheck_21(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_21(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_21(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_21(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_21(Constructor, staticProps); return Constructor; }

function ___defineProperty_21(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var InteractableSet = /*#__PURE__*/function () {
  // all set interactables
  function InteractableSet(scope) {
    var _this = this;

    ___classCallCheck_21(this, InteractableSet);

    this.scope = scope;

    ___defineProperty_21(this, "list", []);

    ___defineProperty_21(this, "selectorMap", {});

    scope.addListeners({
      'interactable:unset': function interactableUnset(_ref) {
        var interactable = _ref.interactable;
        var target = interactable.target,
            context = interactable._context;
        var targetMappings = __is_21.string(target) ? _this.selectorMap[target] : target[_this.scope.id];
        var targetIndex = targetMappings.findIndex(function (m) {
          return m.context === context;
        });

        if (targetMappings[targetIndex]) {
          // Destroying mappingInfo's context and interactable
          targetMappings[targetIndex].context = null;
          targetMappings[targetIndex].interactable = null;
        }

        targetMappings.splice(targetIndex, 1);
      }
    });
  }

  ___createClass_21(InteractableSet, [{
    key: "new",
    value: function _new(target, options) {
      options = (0, ___extend_21["default"])(options || {}, {
        actions: this.scope.actions
      });
      var interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events);
      var mappingInfo = {
        context: interactable._context,
        interactable: interactable
      };
      this.scope.addDocument(interactable._doc);
      this.list.push(interactable);

      if (__is_21.string(target)) {
        if (!this.selectorMap[target]) {
          this.selectorMap[target] = [];
        }

        this.selectorMap[target].push(mappingInfo);
      } else {
        if (!interactable.target[this.scope.id]) {
          Object.defineProperty(target, this.scope.id, {
            value: [],
            configurable: true
          });
        }

        target[this.scope.id].push(mappingInfo);
      }

      this.scope.fire('interactable:new', {
        target: target,
        options: options,
        interactable: interactable,
        win: this.scope._win
      });
      return interactable;
    }
  }, {
    key: "get",
    value: function get(target, options) {
      var context = options && options.context || this.scope.document;
      var isSelector = __is_21.string(target);
      var targetMappings = isSelector ? this.selectorMap[target] : target[this.scope.id];

      if (!targetMappings) {
        return null;
      }

      var found = __arr_21.find(targetMappings, function (m) {
        return m.context === context && (isSelector || m.interactable.inContext(target));
      });
      return found && found.interactable;
    }
  }, {
    key: "forEachMatch",
    value: function forEachMatch(node, callback) {
      for (var _i = 0; _i < this.list.length; _i++) {
        var _ref2;

        _ref2 = this.list[_i];
        var _interactable = _ref2;
        var ret = void 0;

        if ((__is_21.string(_interactable.target) // target is a selector and the element matches
        ? __is_21.element(node) && __domUtils_21.matchesSelector(node, _interactable.target) : // target is the element
        node === _interactable.target) && // the element is in context
        _interactable.inContext(node)) {
          ret = callback(_interactable);
        }

        if (ret !== undefined) {
          return ret;
        }
      }
    }
  }]);

  return InteractableSet;
}();

_$InteractableSet_21["default"] = InteractableSet;

var _$events_25 = {};
"use strict";

function ___typeof_25(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_25 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_25 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_25(obj); }

Object.defineProperty(_$events_25, "__esModule", {
  value: true
});
_$events_25["default"] = _$events_25.FakeEvent = void 0;

var __arr_25 = ___interopRequireWildcard_25(_$arr_65);

var __domUtils_25 = ___interopRequireWildcard_25(_$domUtils_70);

var ___extend_25 = ___interopRequireDefault_25(_$extend_72);

var __is_25 = ___interopRequireWildcard_25(_$is_76);

var ___pointerExtend_25 = ___interopRequireDefault_25(_$pointerExtend_79);

var pointerUtils = ___interopRequireWildcard_25(_$pointerUtils_80);

function ___interopRequireDefault_25(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_25() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_25 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_25(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_25(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_25(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___classCallCheck_25(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_25(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_25(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_25(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_25(Constructor, staticProps); return Constructor; }

function ___defineProperty_25(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function __install_25(scope) {
  var targets = [];
  var delegatedEvents = {};
  var documents = [];
  var eventsMethods = {
    add: add,
    remove: remove,
    addDelegate: addDelegate,
    removeDelegate: removeDelegate,
    delegateListener: delegateListener,
    delegateUseCapture: delegateUseCapture,
    delegatedEvents: delegatedEvents,
    documents: documents,
    targets: targets,
    supportsOptions: false,
    supportsPassive: false
  }; // check if browser supports passive events and options arg

  scope.document.createElement('div').addEventListener('test', null, {
    get capture() {
      return eventsMethods.supportsOptions = true;
    },

    get passive() {
      return eventsMethods.supportsPassive = true;
    }

  });
  scope.events = eventsMethods;

  function add(eventTarget, type, listener, optionalArg) {
    var options = getOptions(optionalArg);
    var target = __arr_25.find(targets, function (t) {
      return t.eventTarget === eventTarget;
    });

    if (!target) {
      target = {
        eventTarget: eventTarget,
        events: {}
      };
      targets.push(target);
    }

    if (!target.events[type]) {
      target.events[type] = [];
    }

    if (eventTarget.addEventListener && !__arr_25.contains(target.events[type], listener)) {
      eventTarget.addEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
      target.events[type].push(listener);
    }
  }

  function remove(eventTarget, type, listener, optionalArg) {
    var options = getOptions(optionalArg);
    var targetIndex = __arr_25.findIndex(targets, function (t) {
      return t.eventTarget === eventTarget;
    });
    var target = targets[targetIndex];

    if (!target || !target.events) {
      return;
    }

    if (type === 'all') {
      for (type in target.events) {
        if (target.events.hasOwnProperty(type)) {
          remove(eventTarget, type, 'all');
        }
      }

      return;
    }

    var typeIsEmpty = false;
    var typeListeners = target.events[type];

    if (typeListeners) {
      if (listener === 'all') {
        for (var i = typeListeners.length - 1; i >= 0; i--) {
          remove(eventTarget, type, typeListeners[i], options);
        }

        return;
      } else {
        for (var _i = 0; _i < typeListeners.length; _i++) {
          if (typeListeners[_i] === listener) {
            eventTarget.removeEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
            typeListeners.splice(_i, 1);

            if (typeListeners.length === 0) {
              delete target.events[type];
              typeIsEmpty = true;
            }

            break;
          }
        }
      }
    }

    if (typeIsEmpty && !Object.keys(target.events).length) {
      targets.splice(targetIndex, 1);
    }
  }

  function addDelegate(selector, context, type, listener, optionalArg) {
    var options = getOptions(optionalArg);

    if (!delegatedEvents[type]) {
      delegatedEvents[type] = []; // add delegate listener functions

      for (var _i2 = 0; _i2 < documents.length; _i2++) {
        var _ref;

        _ref = documents[_i2];
        var doc = _ref;
        add(doc, type, delegateListener);
        add(doc, type, delegateUseCapture, true);
      }
    }

    var delegates = delegatedEvents[type];
    var delegate = __arr_25.find(delegates, function (d) {
      return d.selector === selector && d.context === context;
    });

    if (!delegate) {
      delegate = {
        selector: selector,
        context: context,
        listeners: []
      };
      delegates.push(delegate);
    }

    delegate.listeners.push([listener, options]);
  }

  function removeDelegate(selector, context, type, listener, optionalArg) {
    var options = getOptions(optionalArg);
    var delegates = delegatedEvents[type];
    var matchFound = false;
    var index;

    if (!delegates) {
      return;
    } // count from last index of delegated to 0


    for (index = delegates.length - 1; index >= 0; index--) {
      var cur = delegates[index]; // look for matching selector and context Node

      if (cur.selector === selector && cur.context === context) {
        var listeners = cur.listeners; // each item of the listeners array is an array: [function, capture, passive]

        for (var i = listeners.length - 1; i >= 0; i--) {
          var _listeners$i = _slicedToArray(listeners[i], 2),
              fn = _listeners$i[0],
              _listeners$i$ = _listeners$i[1],
              capture = _listeners$i$.capture,
              passive = _listeners$i$.passive; // check if the listener functions and capture and passive flags match


          if (fn === listener && capture === options.capture && passive === options.passive) {
            // remove the listener from the array of listeners
            listeners.splice(i, 1); // if all listeners for this target have been removed
            // remove the target from the delegates array

            if (!listeners.length) {
              delegates.splice(index, 1); // remove delegate function from context

              remove(context, type, delegateListener);
              remove(context, type, delegateUseCapture, true);
            } // only remove one listener


            matchFound = true;
            break;
          }
        }

        if (matchFound) {
          break;
        }
      }
    }
  } // bound to the interactable context when a DOM event
  // listener is added to a selector interactable


  function delegateListener(event, optionalArg) {
    var options = getOptions(optionalArg);
    var fakeEvent = new FakeEvent(event);
    var delegates = delegatedEvents[event.type];

    var _pointerUtils$getEven = pointerUtils.getEventTargets(event),
        _pointerUtils$getEven2 = _slicedToArray(_pointerUtils$getEven, 1),
        eventTarget = _pointerUtils$getEven2[0];

    var element = eventTarget; // climb up document tree looking for selector matches

    while (__is_25.element(element)) {
      for (var i = 0; i < delegates.length; i++) {
        var cur = delegates[i];
        var selector = cur.selector,
            context = cur.context;

        if (__domUtils_25.matchesSelector(element, selector) && __domUtils_25.nodeContains(context, eventTarget) && __domUtils_25.nodeContains(context, element)) {
          var listeners = cur.listeners;
          fakeEvent.currentTarget = element;

          for (var _i3 = 0; _i3 < listeners.length; _i3++) {
            var _ref2;

            _ref2 = listeners[_i3];

            var _ref3 = _ref2,
                _ref4 = _slicedToArray(_ref3, 2),
                fn = _ref4[0],
                _ref4$ = _ref4[1],
                capture = _ref4$.capture,
                passive = _ref4$.passive;

            if (capture === options.capture && passive === options.passive) {
              fn(fakeEvent);
            }
          }
        }
      }

      element = __domUtils_25.parentNode(element);
    }
  }

  function delegateUseCapture(event) {
    return delegateListener.call(this, event, true);
  } // for type inferrence


  return eventsMethods;
}

var FakeEvent = /*#__PURE__*/function () {
  function FakeEvent(originalEvent) {
    ___classCallCheck_25(this, FakeEvent);

    this.originalEvent = originalEvent;

    ___defineProperty_25(this, "currentTarget", void 0);

    // duplicate the event so that currentTarget can be changed
    (0, ___pointerExtend_25["default"])(this, originalEvent);
  }

  ___createClass_25(FakeEvent, [{
    key: "preventOriginalDefault",
    value: function preventOriginalDefault() {
      this.originalEvent.preventDefault();
    }
  }, {
    key: "stopPropagation",
    value: function stopPropagation() {
      this.originalEvent.stopPropagation();
    }
  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this.originalEvent.stopImmediatePropagation();
    }
  }]);

  return FakeEvent;
}();

_$events_25.FakeEvent = FakeEvent;

function getOptions(param) {
  if (!__is_25.object(param)) {
    return {
      capture: !!param,
      passive: false
    };
  }

  var options = (0, ___extend_25["default"])({}, param);
  options.capture = !!param.capture;
  options.passive = !!param.passive;
  return options;
}

var ___default_25 = {
  id: 'events',
  install: __install_25
};
_$events_25["default"] = ___default_25;

var _$PointerInfo_23 = {};
"use strict";

Object.defineProperty(_$PointerInfo_23, "__esModule", {
  value: true
});
_$PointerInfo_23["default"] = _$PointerInfo_23.PointerInfo = void 0;

function ___classCallCheck_23(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable @typescript-eslint/no-parameter-properties */
var PointerInfo = function PointerInfo(id, pointer, event, downTime, downTarget) {
  ___classCallCheck_23(this, PointerInfo);

  this.id = id;
  this.pointer = pointer;
  this.event = event;
  this.downTime = downTime;
  this.downTarget = downTarget;
};

_$PointerInfo_23.PointerInfo = PointerInfo;
var ___default_23 = PointerInfo;
_$PointerInfo_23["default"] = ___default_23;

var _$Interaction_22 = {};
"use strict";

function ___typeof_22(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_22 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_22 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_22(obj); }

Object.defineProperty(_$Interaction_22, "__esModule", {
  value: true
});
Object.defineProperty(_$Interaction_22, "PointerInfo", {
  enumerable: true,
  get: function get() {
    return _PointerInfo["default"];
  }
});
_$Interaction_22["default"] = _$Interaction_22.Interaction = _$Interaction_22._ProxyMethods = _$Interaction_22._ProxyValues = void 0;

var __utils_22 = ___interopRequireWildcard_22(_$index_75);

var _InteractEvent = ___interopRequireDefault_22(_$InteractEvent_18);

var _PointerInfo = ___interopRequireDefault_22(_$PointerInfo_23);

function ___interopRequireDefault_22(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_22() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_22 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_22(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_22(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_22(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___classCallCheck_22(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_22(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_22(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_22(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_22(Constructor, staticProps); return Constructor; }

function ___defineProperty_22(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _ProxyValues;

_$Interaction_22._ProxyValues = _ProxyValues;

(function (_ProxyValues) {
  _ProxyValues["interactable"] = "";
  _ProxyValues["element"] = "";
  _ProxyValues["prepared"] = "";
  _ProxyValues["pointerIsDown"] = "";
  _ProxyValues["pointerWasMoved"] = "";
  _ProxyValues["_proxy"] = "";
})(_ProxyValues || (_$Interaction_22._ProxyValues = _ProxyValues = {}));

var _ProxyMethods;

_$Interaction_22._ProxyMethods = _ProxyMethods;

(function (_ProxyMethods) {
  _ProxyMethods["start"] = "";
  _ProxyMethods["move"] = "";
  _ProxyMethods["end"] = "";
  _ProxyMethods["stop"] = "";
  _ProxyMethods["interacting"] = "";
})(_ProxyMethods || (_$Interaction_22._ProxyMethods = _ProxyMethods = {}));

var idCounter = 0;

var Interaction = /*#__PURE__*/function () {
  ___createClass_22(Interaction, [{
    key: "pointerMoveTolerance",
    // current interactable being interacted with
    // the target element of the interactable
    // action that's ready to be fired on next move event
    // keep track of added pointers
    // pointerdown/mousedown/touchstart event
    // previous action event
    get: function get() {
      return 1;
    }
    /**
     * @alias Interaction.prototype.move
     */

  }]);

  /** */
  function Interaction(_ref) {
    var _this = this;

    var pointerType = _ref.pointerType,
        scopeFire = _ref.scopeFire;

    ___classCallCheck_22(this, Interaction);

    ___defineProperty_22(this, "interactable", null);

    ___defineProperty_22(this, "element", null);

    ___defineProperty_22(this, "rect", void 0);

    ___defineProperty_22(this, "_rects", void 0);

    ___defineProperty_22(this, "edges", void 0);

    ___defineProperty_22(this, "_scopeFire", void 0);

    ___defineProperty_22(this, "prepared", {
      name: null,
      axis: null,
      edges: null
    });

    ___defineProperty_22(this, "pointerType", void 0);

    ___defineProperty_22(this, "pointers", []);

    ___defineProperty_22(this, "downEvent", null);

    ___defineProperty_22(this, "downPointer", {});

    ___defineProperty_22(this, "_latestPointer", {
      pointer: null,
      event: null,
      eventTarget: null
    });

    ___defineProperty_22(this, "prevEvent", null);

    ___defineProperty_22(this, "pointerIsDown", false);

    ___defineProperty_22(this, "pointerWasMoved", false);

    ___defineProperty_22(this, "_interacting", false);

    ___defineProperty_22(this, "_ending", false);

    ___defineProperty_22(this, "_stopped", true);

    ___defineProperty_22(this, "_proxy", null);

    ___defineProperty_22(this, "simulation", null);

    ___defineProperty_22(this, "doMove", __utils_22.warnOnce(function (signalArg) {
      this.move(signalArg);
    }, 'The interaction.doMove() method has been renamed to interaction.move()'));

    ___defineProperty_22(this, "coords", {
      // Starting InteractEvent pointer coordinates
      start: __utils_22.pointer.newCoords(),
      // Previous native pointer move event coordinates
      prev: __utils_22.pointer.newCoords(),
      // current native pointer move event coordinates
      cur: __utils_22.pointer.newCoords(),
      // Change in coordinates and time of the pointer
      delta: __utils_22.pointer.newCoords(),
      // pointer velocity
      velocity: __utils_22.pointer.newCoords()
    });

    ___defineProperty_22(this, "_id", idCounter++);

    this._scopeFire = scopeFire;
    this.pointerType = pointerType;
    var that = this;
    this._proxy = {};

    var _loop = function _loop(key) {
      Object.defineProperty(_this._proxy, key, {
        get: function get() {
          return that[key];
        }
      });
    };

    for (var key in _ProxyValues) {
      _loop(key);
    }

    var _loop2 = function _loop2(_key) {
      Object.defineProperty(_this._proxy, _key, {
        value: function value() {
          return that[_key].apply(that, arguments);
        }
      });
    };

    for (var _key in _ProxyMethods) {
      _loop2(_key);
    }

    this._scopeFire('interactions:new', {
      interaction: this
    });
  }

  ___createClass_22(Interaction, [{
    key: "pointerDown",
    value: function pointerDown(pointer, event, eventTarget) {
      var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);
      var pointerInfo = this.pointers[pointerIndex];

      this._scopeFire('interactions:down', {
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        pointerIndex: pointerIndex,
        pointerInfo: pointerInfo,
        type: 'down',
        interaction: this
      });
    }
    /**
     * ```js
     * interact(target)
     *   .draggable({
     *     // disable the default drag start by down->move
     *     manualStart: true
     *   })
     *   // start dragging after the user holds the pointer down
     *   .on('hold', function (event) {
     *     var interaction = event.interaction
     *
     *     if (!interaction.interacting()) {
     *       interaction.start({ name: 'drag' },
     *                         event.interactable,
     *                         event.currentTarget)
     *     }
     * })
     * ```
     *
     * Start an action with the given Interactable and Element as tartgets. The
     * action must be enabled for the target Interactable and an appropriate
     * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
     *
     * Use it with `interactable.<action>able({ manualStart: false })` to always
     * [start actions manually](https://github.com/taye/interact.js/issues/114)
     *
     * @param {object} action   The action to be performed - drag, resize, etc.
     * @param {Interactable} target  The Interactable to target
     * @param {Element} element The DOM Element to target
     * @return {object} interact
     */

  }, {
    key: "start",
    value: function start(action, interactable, element) {
      if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1) || !interactable.options[action.name].enabled) {
        return false;
      }

      __utils_22.copyAction(this.prepared, action);
      this.interactable = interactable;
      this.element = element;
      this.rect = interactable.getRect(element);
      this.edges = this.prepared.edges ? __utils_22.extend({}, this.prepared.edges) : {
        left: true,
        right: true,
        top: true,
        bottom: true
      };
      this._stopped = false;
      this._interacting = this._doPhase({
        interaction: this,
        event: this.downEvent,
        phase: 'start'
      }) && !this._stopped;
      return this._interacting;
    }
  }, {
    key: "pointerMove",
    value: function pointerMove(pointer, event, eventTarget) {
      if (!this.simulation && !(this.modification && this.modification.endResult)) {
        this.updatePointer(pointer, event, eventTarget, false);
      }

      var duplicateMove = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
      var dx;
      var dy; // register movement greater than pointerMoveTolerance

      if (this.pointerIsDown && !this.pointerWasMoved) {
        dx = this.coords.cur.client.x - this.coords.start.client.x;
        dy = this.coords.cur.client.y - this.coords.start.client.y;
        this.pointerWasMoved = __utils_22.hypot(dx, dy) > this.pointerMoveTolerance;
      }

      var pointerIndex = this.getPointerIndex(pointer);
      var signalArg = {
        pointer: pointer,
        pointerIndex: pointerIndex,
        pointerInfo: this.pointers[pointerIndex],
        event: event,
        type: 'move',
        eventTarget: eventTarget,
        dx: dx,
        dy: dy,
        duplicate: duplicateMove,
        interaction: this
      };

      if (!duplicateMove) {
        // set pointer coordinate, time changes and velocity
        __utils_22.pointer.setCoordVelocity(this.coords.velocity, this.coords.delta);
      }

      this._scopeFire('interactions:move', signalArg);

      if (!duplicateMove && !this.simulation) {
        // if interacting, fire an 'action-move' signal etc
        if (this.interacting()) {
          signalArg.type = null;
          this.move(signalArg);
        }

        if (this.pointerWasMoved) {
          __utils_22.pointer.copyCoords(this.coords.prev, this.coords.cur);
        }
      }
    }
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('dragmove', function (event) {
     *     if (someCondition) {
     *       // change the snap settings
     *       event.interactable.draggable({ snap: { targets: [] }})
     *       // fire another move event with re-calculated snap
     *       event.interaction.move()
     *     }
     *   })
     * ```
     *
     * Force a move of the current action at the same coordinates. Useful if
     * snap/restrict has been changed and you want a movement with the new
     * settings.
     */

  }, {
    key: "move",
    value: function move(signalArg) {
      if (!signalArg || !signalArg.event) {
        __utils_22.pointer.setZeroCoords(this.coords.delta);
      }

      signalArg = __utils_22.extend({
        pointer: this._latestPointer.pointer,
        event: this._latestPointer.event,
        eventTarget: this._latestPointer.eventTarget,
        interaction: this
      }, signalArg || {});
      signalArg.phase = 'move';

      this._doPhase(signalArg);
    } // End interact move events and stop auto-scroll unless simulation is running

  }, {
    key: "pointerUp",
    value: function pointerUp(pointer, event, eventTarget, curEventTarget) {
      var pointerIndex = this.getPointerIndex(pointer);

      if (pointerIndex === -1) {
        pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
      }

      var type = /cancel$/i.test(event.type) ? 'cancel' : 'up';

      this._scopeFire("interactions:".concat(type), {
        pointer: pointer,
        pointerIndex: pointerIndex,
        pointerInfo: this.pointers[pointerIndex],
        event: event,
        eventTarget: eventTarget,
        type: type,
        curEventTarget: curEventTarget,
        interaction: this
      });

      if (!this.simulation) {
        this.end(event);
      }

      this.pointerIsDown = false;
      this.removePointer(pointer, event);
    }
  }, {
    key: "documentBlur",
    value: function documentBlur(event) {
      this.end(event);

      this._scopeFire('interactions:blur', {
        event: event,
        type: 'blur',
        interaction: this
      });
    }
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('move', function (event) {
     *     if (event.pageX > 1000) {
     *       // end the current action
     *       event.interaction.end()
     *       // stop all further listeners from being called
     *       event.stopImmediatePropagation()
     *     }
     *   })
     * ```
     *
     * @param {PointerEvent} [event]
     */

  }, {
    key: "end",
    value: function end(event) {
      this._ending = true;
      event = event || this._latestPointer.event;
      var endPhaseResult;

      if (this.interacting()) {
        endPhaseResult = this._doPhase({
          event: event,
          interaction: this,
          phase: 'end'
        });
      }

      this._ending = false;

      if (endPhaseResult === true) {
        this.stop();
      }
    }
  }, {
    key: "currentAction",
    value: function currentAction() {
      return this._interacting ? this.prepared.name : null;
    }
  }, {
    key: "interacting",
    value: function interacting() {
      return this._interacting;
    }
    /** */

  }, {
    key: "stop",
    value: function stop() {
      this._scopeFire('interactions:stop', {
        interaction: this
      });

      this.interactable = this.element = null;
      this._interacting = false;
      this._stopped = true;
      this.prepared.name = this.prevEvent = null;
    }
  }, {
    key: "getPointerIndex",
    value: function getPointerIndex(pointer) {
      var pointerId = __utils_22.pointer.getPointerId(pointer); // mouse and pen interactions may have only one pointer

      return this.pointerType === 'mouse' || this.pointerType === 'pen' ? this.pointers.length - 1 : __utils_22.arr.findIndex(this.pointers, function (curPointer) {
        return curPointer.id === pointerId;
      });
    }
  }, {
    key: "getPointerInfo",
    value: function getPointerInfo(pointer) {
      return this.pointers[this.getPointerIndex(pointer)];
    }
  }, {
    key: "updatePointer",
    value: function updatePointer(pointer, event, eventTarget, down) {
      var id = __utils_22.pointer.getPointerId(pointer);
      var pointerIndex = this.getPointerIndex(pointer);
      var pointerInfo = this.pointers[pointerIndex];
      down = down === false ? false : down || /(down|start)$/i.test(event.type);

      if (!pointerInfo) {
        pointerInfo = new _PointerInfo["default"](id, pointer, event, null, null);
        pointerIndex = this.pointers.length;
        this.pointers.push(pointerInfo);
      } else {
        pointerInfo.pointer = pointer;
      }

      __utils_22.pointer.setCoords(this.coords.cur, this.pointers.map(function (p) {
        return p.pointer;
      }), this._now());
      __utils_22.pointer.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);

      if (down) {
        this.pointerIsDown = true;
        pointerInfo.downTime = this.coords.cur.timeStamp;
        pointerInfo.downTarget = eventTarget;
        __utils_22.pointer.pointerExtend(this.downPointer, pointer);

        if (!this.interacting()) {
          __utils_22.pointer.copyCoords(this.coords.start, this.coords.cur);
          __utils_22.pointer.copyCoords(this.coords.prev, this.coords.cur);
          this.downEvent = event;
          this.pointerWasMoved = false;
        }
      }

      this._updateLatestPointer(pointer, event, eventTarget);

      this._scopeFire('interactions:update-pointer', {
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        down: down,
        pointerInfo: pointerInfo,
        pointerIndex: pointerIndex,
        interaction: this
      });

      return pointerIndex;
    }
  }, {
    key: "removePointer",
    value: function removePointer(pointer, event) {
      var pointerIndex = this.getPointerIndex(pointer);

      if (pointerIndex === -1) {
        return;
      }

      var pointerInfo = this.pointers[pointerIndex];

      this._scopeFire('interactions:remove-pointer', {
        pointer: pointer,
        event: event,
        eventTarget: null,
        pointerIndex: pointerIndex,
        pointerInfo: pointerInfo,
        interaction: this
      });

      this.pointers.splice(pointerIndex, 1);
    }
  }, {
    key: "_updateLatestPointer",
    value: function _updateLatestPointer(pointer, event, eventTarget) {
      this._latestPointer.pointer = pointer;
      this._latestPointer.event = event;
      this._latestPointer.eventTarget = eventTarget;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this._latestPointer.pointer = null;
      this._latestPointer.event = null;
      this._latestPointer.eventTarget = null;
    }
  }, {
    key: "_createPreparedEvent",
    value: function _createPreparedEvent(event, phase, preEnd, type) {
      return new _InteractEvent["default"](this, event, this.prepared.name, phase, this.element, preEnd, type);
    }
  }, {
    key: "_fireEvent",
    value: function _fireEvent(iEvent) {
      this.interactable.fire(iEvent);

      if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
        this.prevEvent = iEvent;
      }
    }
  }, {
    key: "_doPhase",
    value: function _doPhase(signalArg) {
      var event = signalArg.event,
          phase = signalArg.phase,
          preEnd = signalArg.preEnd,
          type = signalArg.type;
      var rect = this.rect;

      if (rect && phase === 'move') {
        // update the rect changes due to pointer move
        __utils_22.rect.addEdges(this.edges, rect, this.coords.delta[this.interactable.options.deltaSource]);
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;
      }

      var beforeResult = this._scopeFire("interactions:before-action-".concat(phase), signalArg);

      if (beforeResult === false) {
        return false;
      }

      var iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);

      this._scopeFire("interactions:action-".concat(phase), signalArg);

      if (phase === 'start') {
        this.prevEvent = iEvent;
      }

      this._fireEvent(iEvent);

      this._scopeFire("interactions:after-action-".concat(phase), signalArg);

      return true;
    }
  }, {
    key: "_now",
    value: function _now() {
      return Date.now();
    }
  }]);

  return Interaction;
}();

_$Interaction_22.Interaction = Interaction;
var ___default_22 = Interaction;
_$Interaction_22["default"] = ___default_22;

var _$interactablePreventDefault_26 = {};
"use strict";

function ___typeof_26(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_26 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_26 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_26(obj); }

Object.defineProperty(_$interactablePreventDefault_26, "__esModule", {
  value: true
});
_$interactablePreventDefault_26.install = __install_26;
_$interactablePreventDefault_26["default"] = void 0;

/* removed: var _$domUtils_70 = require("@interactjs/utils/domUtils"); */;

var __is_26 = ___interopRequireWildcard_26(_$is_76);

/* removed: var _$window_83 = require("@interactjs/utils/window"); */;

function ___getRequireWildcardCache_26() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_26 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_26(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_26(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_26(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function preventDefault(newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    this.options.preventDefault = newValue;
    return this;
  }

  if (__is_26.bool(newValue)) {
    this.options.preventDefault = newValue ? 'always' : 'never';
    return this;
  }

  return this.options.preventDefault;
}

function checkAndPreventDefault(interactable, scope, event) {
  var setting = interactable.options.preventDefault;

  if (setting === 'never') {
    return;
  }

  if (setting === 'always') {
    event.preventDefault();
    return;
  } // setting === 'auto'
  // if the browser supports passive event listeners and isn't running on iOS,
  // don't preventDefault of touch{start,move} events. CSS touch-action and
  // user-select should be used instead of calling event.preventDefault().


  if (scope.events.supportsPassive && /^touch(start|move)$/.test(event.type)) {
    var doc = (0, _$window_83.getWindow)(event.target).document;
    var docOptions = scope.getDocOptions(doc);

    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return;
    }
  } // don't preventDefault of pointerdown events


  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  } // don't preventDefault on editable elements


  if (__is_26.element(event.target) && (0, _$domUtils_70.matchesSelector)(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
    return;
  }

  event.preventDefault();
}

function onInteractionEvent(_ref) {
  var interaction = _ref.interaction,
      event = _ref.event;

  if (interaction.interactable) {
    interaction.interactable.checkAndPreventDefault(event);
  }
}

function __install_26(scope) {
  /** @lends Interactable */
  var Interactable = scope.Interactable;
  /**
   * Returns or sets whether to prevent the browser's default behaviour in
   * response to pointer events. Can be set to:
   *  - `'always'` to always prevent
   *  - `'never'` to never prevent
   *  - `'auto'` to let interact.js try to determine what would be best
   *
   * @param {string} [newValue] `'always'`, `'never'` or `'auto'`
   * @return {string | Interactable} The current setting or this Interactable
   */

  Interactable.prototype.preventDefault = preventDefault;

  Interactable.prototype.checkAndPreventDefault = function (event) {
    return checkAndPreventDefault(this, scope, event);
  }; // prevent native HTML5 drag on interact.js target elements


  scope.interactions.docEvents.push({
    type: 'dragstart',
    listener: function listener(event) {
      for (var _i = 0; _i < scope.interactions.list.length; _i++) {
        var _ref2;

        _ref2 = scope.interactions.list[_i];
        var interaction = _ref2;

        if (interaction.element && (interaction.element === event.target || (0, _$domUtils_70.nodeContains)(interaction.element, event.target))) {
          interaction.interactable.checkAndPreventDefault(event);
          return;
        }
      }
    }
  });
}

var ___default_26 = {
  id: 'core/interactablePreventDefault',
  install: __install_26,
  listeners: ['down', 'move', 'up', 'cancel'].reduce(function (acc, eventType) {
    acc["interactions:".concat(eventType)] = onInteractionEvent;
    return acc;
  }, {})
};
_$interactablePreventDefault_26["default"] = ___default_26;

var _$interactionFinder_27 = {};
"use strict";

function ___typeof_27(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_27 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_27 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_27(obj); }

Object.defineProperty(_$interactionFinder_27, "__esModule", {
  value: true
});
_$interactionFinder_27["default"] = void 0;

var __dom_27 = ___interopRequireWildcard_27(_$domUtils_70);

function ___getRequireWildcardCache_27() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_27 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_27(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_27(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_27(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var finder = {
  methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
  search: function search(details) {
    for (var _i = 0; _i < finder.methodOrder.length; _i++) {
      var _ref;

      _ref = finder.methodOrder[_i];
      var method = _ref;
      var interaction = finder[method](details);

      if (interaction) {
        return interaction;
      }
    }

    return null;
  },
  // try to resume simulation with a new pointer
  simulationResume: function simulationResume(_ref2) {
    var pointerType = _ref2.pointerType,
        eventType = _ref2.eventType,
        eventTarget = _ref2.eventTarget,
        scope = _ref2.scope;

    if (!/down|start/i.test(eventType)) {
      return null;
    }

    for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
      var _ref3;

      _ref3 = scope.interactions.list[_i2];
      var interaction = _ref3;
      var element = eventTarget;

      if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }

          element = __dom_27.parentNode(element);
        }
      }
    }

    return null;
  },
  // if it's a mouse or pen interaction
  mouseOrPen: function mouseOrPen(_ref4) {
    var pointerId = _ref4.pointerId,
        pointerType = _ref4.pointerType,
        eventType = _ref4.eventType,
        scope = _ref4.scope;

    if (pointerType !== 'mouse' && pointerType !== 'pen') {
      return null;
    }

    var firstNonActive;

    for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
      var _ref5;

      _ref5 = scope.interactions.list[_i3];
      var interaction = _ref5;

      if (interaction.pointerType === pointerType) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
          continue;
        } // if the interaction is active, return it immediately


        if (interaction.interacting()) {
          return interaction;
        } // otherwise save it and look for another active interaction
        else if (!firstNonActive) {
            firstNonActive = interaction;
          }
      }
    } // if no active mouse interaction was found use the first inactive mouse
    // interaction


    if (firstNonActive) {
      return firstNonActive;
    } // find any mouse or pen interaction.
    // ignore the interaction if the eventType is a *down, and a simulation
    // is active


    for (var _i4 = 0; _i4 < scope.interactions.list.length; _i4++) {
      var _ref6;

      _ref6 = scope.interactions.list[_i4];
      var _interaction = _ref6;

      if (_interaction.pointerType === pointerType && !(/down/i.test(eventType) && _interaction.simulation)) {
        return _interaction;
      }
    }

    return null;
  },
  // get interaction that has this pointer
  hasPointer: function hasPointer(_ref7) {
    var pointerId = _ref7.pointerId,
        scope = _ref7.scope;

    for (var _i5 = 0; _i5 < scope.interactions.list.length; _i5++) {
      var _ref8;

      _ref8 = scope.interactions.list[_i5];
      var interaction = _ref8;

      if (hasPointerId(interaction, pointerId)) {
        return interaction;
      }
    }

    return null;
  },
  // get first idle interaction with a matching pointerType
  idle: function idle(_ref9) {
    var pointerType = _ref9.pointerType,
        scope = _ref9.scope;

    for (var _i6 = 0; _i6 < scope.interactions.list.length; _i6++) {
      var _ref10;

      _ref10 = scope.interactions.list[_i6];
      var interaction = _ref10;

      // if there's already a pointer held down
      if (interaction.pointers.length === 1) {
        var target = interaction.interactable; // don't add this pointer if there is a target interactable and it
        // isn't gesturable

        if (target && !(target.options.gesture && target.options.gesture.enabled)) {
          continue;
        }
      } // maximum of 2 pointers per interaction
      else if (interaction.pointers.length >= 2) {
          continue;
        }

      if (!interaction.interacting() && pointerType === interaction.pointerType) {
        return interaction;
      }
    }

    return null;
  }
};

function hasPointerId(interaction, pointerId) {
  return interaction.pointers.some(function (_ref11) {
    var id = _ref11.id;
    return id === pointerId;
  });
}

var ___default_27 = finder;
_$interactionFinder_27["default"] = ___default_27;

var _$DropEvent_2 = {};
"use strict";

Object.defineProperty(_$DropEvent_2, "__esModule", {
  value: true
});
_$DropEvent_2["default"] = void 0;

var ___BaseEvent2_2 = ___interopRequireDefault_2(_$BaseEvent_16);

var __arr_2 = ___interopRequireWildcard_2(_$arr_65);

function ___getRequireWildcardCache_2() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_2 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_2(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_2(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_2(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_2(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___typeof_2(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_2 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_2 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_2(obj); }

function ___classCallCheck_2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_2(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_2(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_2(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_2(Constructor, staticProps); return Constructor; }

function ___possibleConstructorReturn_2(self, call) { if (call && (___typeof_2(call) === "object" || typeof call === "function")) { return call; } return ___assertThisInitialized_2(self); }

function ___getPrototypeOf_2(o) { ___getPrototypeOf_2 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return ___getPrototypeOf_2(o); }

function ___assertThisInitialized_2(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function ___inherits_2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) ___setPrototypeOf_2(subClass, superClass); }

function ___setPrototypeOf_2(o, p) { ___setPrototypeOf_2 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return ___setPrototypeOf_2(o, p); }

function ___defineProperty_2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DropEvent = /*#__PURE__*/function (_BaseEvent) {
  ___inherits_2(DropEvent, _BaseEvent);

  /**
   * Class of events fired on dropzones during drags with acceptable targets.
   */
  function DropEvent(dropState, dragEvent, type) {
    var _this;

    ___classCallCheck_2(this, DropEvent);

    _this = ___possibleConstructorReturn_2(this, ___getPrototypeOf_2(DropEvent).call(this, dragEvent._interaction));

    ___defineProperty_2(___assertThisInitialized_2(_this), "target", void 0);

    ___defineProperty_2(___assertThisInitialized_2(_this), "dropzone", void 0);

    ___defineProperty_2(___assertThisInitialized_2(_this), "dragEvent", void 0);

    ___defineProperty_2(___assertThisInitialized_2(_this), "relatedTarget", void 0);

    ___defineProperty_2(___assertThisInitialized_2(_this), "draggable", void 0);

    ___defineProperty_2(___assertThisInitialized_2(_this), "timeStamp", void 0);

    ___defineProperty_2(___assertThisInitialized_2(_this), "propagationStopped", false);

    ___defineProperty_2(___assertThisInitialized_2(_this), "immediatePropagationStopped", false);

    var _ref = type === 'dragleave' ? dropState.prev : dropState.cur,
        element = _ref.element,
        dropzone = _ref.dropzone;

    _this.type = type;
    _this.target = element;
    _this.currentTarget = element;
    _this.dropzone = dropzone;
    _this.dragEvent = dragEvent;
    _this.relatedTarget = dragEvent.target;
    _this.draggable = dragEvent.interactable;
    _this.timeStamp = dragEvent.timeStamp;
    return _this;
  }
  /**
   * If this is a `dropactivate` event, the dropzone element will be
   * deactivated.
   *
   * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
   * dropzone element and more.
   */


  ___createClass_2(DropEvent, [{
    key: "reject",
    value: function reject() {
      var _this2 = this;

      var dropState = this._interaction.dropState;

      if (this.type !== 'dropactivate' && (!this.dropzone || dropState.cur.dropzone !== this.dropzone || dropState.cur.element !== this.target)) {
        return;
      }

      dropState.prev.dropzone = this.dropzone;
      dropState.prev.element = this.target;
      dropState.rejected = true;
      dropState.events.enter = null;
      this.stopImmediatePropagation();

      if (this.type === 'dropactivate') {
        var activeDrops = dropState.activeDrops;
        var index = __arr_2.findIndex(activeDrops, function (_ref2) {
          var dropzone = _ref2.dropzone,
              element = _ref2.element;
          return dropzone === _this2.dropzone && element === _this2.target;
        });
        dropState.activeDrops.splice(index, 1);
        var deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate');
        deactivateEvent.dropzone = this.dropzone;
        deactivateEvent.target = this.target;
        this.dropzone.fire(deactivateEvent);
      } else {
        this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'));
      }
    }
  }, {
    key: "preventDefault",
    value: function preventDefault() {}
  }, {
    key: "stopPropagation",
    value: function stopPropagation() {
      this.propagationStopped = true;
    }
  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }
  }]);

  return DropEvent;
}(___BaseEvent2_2["default"]);

var ___default_2 = DropEvent;
_$DropEvent_2["default"] = ___default_2;

var _$index_3 = {};
"use strict";

function ___typeof_3(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_3 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_3 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_3(obj); }

Object.defineProperty(_$index_3, "__esModule", {
  value: true
});
_$index_3["default"] = void 0;

var ___Interactable_3 = ___interopRequireDefault_3(_$Interactable_20({}));

var ___scope_3 = ___interopRequireDefault_3(_$scope_29({}));

var __utils_3 = ___interopRequireWildcard_3(_$index_75);

var _drag = ___interopRequireDefault_3(_$drag_1);

var _DropEvent = ___interopRequireDefault_3(_$DropEvent_2);

function ___getRequireWildcardCache_3() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_3 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_3(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_3(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_3(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_3(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function __install_3(scope) {
  var actions = scope.actions,
      interact = scope.interactStatic,
      Interactable = scope.Interactable,
      defaults = scope.defaults;
  scope.usePlugin(_drag["default"]);
  /**
   *
   * ```js
   * interact('.drop').dropzone({
   *   accept: '.can-drop' || document.getElementById('single-drop'),
   *   overlap: 'pointer' || 'center' || zeroToOne
   * }
   * ```
   *
   * Returns or sets whether draggables can be dropped onto this target to
   * trigger drop events
   *
   * Dropzones can receive the following events:
   *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
   *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
   *  - `dragmove` when a draggable that has entered the dropzone is moved
   *  - `drop` when a draggable is dropped into this dropzone
   *
   * Use the `accept` option to allow only elements that match the given CSS
   * selector or element. The value can be:
   *
   *  - **an Element** - only that element can be dropped into this dropzone.
   *  - **a string**, - the element being dragged must match it as a CSS selector.
   *  - **`null`** - accept options is cleared - it accepts any element.
   *
   * Use the `overlap` option to set how drops are checked for. The allowed
   * values are:
   *
   *   - `'pointer'`, the pointer must be over the dropzone (default)
   *   - `'center'`, the draggable element's center must be over the dropzone
   *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
   *   e.g. `0.5` for drop to happen when half of the area of the draggable is
   *   over the dropzone
   *
   * Use the `checker` option to specify a function to check if a dragged element
   * is over this Interactable.
   *
   * @param {boolean | object | null} [options] The new options to be set.
   * @return {boolean | Interactable} The current setting or this Interactable
   */

  Interactable.prototype.dropzone = function (options) {
    return dropzoneMethod(this, options);
  };
  /**
   * ```js
   * interact(target)
   * .dropChecker(function(dragEvent,         // related dragmove or dragend event
   *                       event,             // TouchEvent/PointerEvent/MouseEvent
   *                       dropped,           // bool result of the default checker
   *                       dropzone,          // dropzone Interactable
   *                       dropElement,       // dropzone elemnt
   *                       draggable,         // draggable Interactable
   *                       draggableElement) {// draggable element
   *
   *   return dropped && event.target.hasAttribute('allow-drop')
   * }
   * ```
   */


  Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
    return dropCheckMethod(this, dragEvent, event, draggable, draggableElement, dropElement, rect);
  };
  /**
   * Returns or sets whether the dimensions of dropzone elements are calculated
   * on every dragmove or only on dragstart for the default dropChecker
   *
   * @param {boolean} [newValue] True to check on each move. False to check only
   * before start
   * @return {boolean | interact} The current setting or interact
   */


  interact.dynamicDrop = function (newValue) {
    if (__utils_3.is.bool(newValue)) {
      // if (dragging && scope.dynamicDrop !== newValue && !newValue) {
      //  calcRects(dropzones)
      // }
      scope.dynamicDrop = newValue;
      return interact;
    }

    return scope.dynamicDrop;
  };

  __utils_3.extend(actions.phaselessTypes, {
    dragenter: true,
    dragleave: true,
    dropactivate: true,
    dropdeactivate: true,
    dropmove: true,
    drop: true
  });
  actions.methodDict.drop = 'dropzone';
  scope.dynamicDrop = false;
  defaults.actions.drop = drop.defaults;
}

function collectDrops(_ref, draggableElement) {
  var interactables = _ref.interactables;
  var drops = []; // collect all dropzones and their elements which qualify for a drop

  for (var _i = 0; _i < interactables.list.length; _i++) {
    var _ref2;

    _ref2 = interactables.list[_i];
    var dropzone = _ref2;

    if (!dropzone.options.drop.enabled) {
      continue;
    }

    var accept = dropzone.options.drop.accept; // test the draggable draggableElement against the dropzone's accept setting

    if (__utils_3.is.element(accept) && accept !== draggableElement || __utils_3.is.string(accept) && !__utils_3.dom.matchesSelector(draggableElement, accept) || __utils_3.is.func(accept) && !accept({
      dropzone: dropzone,
      draggableElement: draggableElement
    })) {
      continue;
    } // query for new elements if necessary


    var dropElements = __utils_3.is.string(dropzone.target) ? dropzone._context.querySelectorAll(dropzone.target) : __utils_3.is.array(dropzone.target) ? dropzone.target : [dropzone.target];

    for (var _i2 = 0; _i2 < dropElements.length; _i2++) {
      var _ref3;

      _ref3 = dropElements[_i2];
      var dropzoneElement = _ref3;

      if (dropzoneElement !== draggableElement) {
        drops.push({
          dropzone: dropzone,
          element: dropzoneElement
        });
      }
    }
  }

  return drops;
}

function fireActivationEvents(activeDrops, event) {
  // loop through all active dropzones and trigger event
  for (var _i3 = 0; _i3 < activeDrops.slice().length; _i3++) {
    var _ref4;

    _ref4 = activeDrops.slice()[_i3];
    var _ref5 = _ref4,
        dropzone = _ref5.dropzone,
        element = _ref5.element;
    event.dropzone = dropzone; // set current element as event target

    event.target = element;
    dropzone.fire(event);
    event.propagationStopped = event.immediatePropagationStopped = false;
  }
} // return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true


function getActiveDrops(scope, dragElement) {
  // get dropzones and their elements that could receive the draggable
  var activeDrops = collectDrops(scope, dragElement);

  for (var _i4 = 0; _i4 < activeDrops.length; _i4++) {
    var _ref6;

    _ref6 = activeDrops[_i4];
    var activeDrop = _ref6;
    activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
  }

  return activeDrops;
}

function getDrop(_ref7, dragEvent, pointerEvent) {
  var dropState = _ref7.dropState,
      draggable = _ref7.interactable,
      dragElement = _ref7.element;
  var validDrops = []; // collect all dropzones and their elements which qualify for a drop

  for (var _i5 = 0; _i5 < dropState.activeDrops.length; _i5++) {
    var _ref8;

    _ref8 = dropState.activeDrops[_i5];
    var _ref9 = _ref8,
        dropzone = _ref9.dropzone,
        dropzoneElement = _ref9.element,
        _rect = _ref9.rect;
    validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, _rect) ? dropzoneElement : null);
  } // get the most appropriate dropzone based on DOM depth and order


  var dropIndex = __utils_3.dom.indexOfDeepestElement(validDrops);
  return dropState.activeDrops[dropIndex] || null;
}

function getDropEvents(interaction, _pointerEvent, dragEvent) {
  var dropState = interaction.dropState;
  var dropEvents = {
    enter: null,
    leave: null,
    activate: null,
    deactivate: null,
    move: null,
    drop: null
  };

  if (dragEvent.type === 'dragstart') {
    dropEvents.activate = new _DropEvent["default"](dropState, dragEvent, 'dropactivate');
    dropEvents.activate.target = null;
    dropEvents.activate.dropzone = null;
  }

  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = new _DropEvent["default"](dropState, dragEvent, 'dropdeactivate');
    dropEvents.deactivate.target = null;
    dropEvents.deactivate.dropzone = null;
  }

  if (dropState.rejected) {
    return dropEvents;
  }

  if (dropState.cur.element !== dropState.prev.element) {
    // if there was a previous dropzone, create a dragleave event
    if (dropState.prev.dropzone) {
      dropEvents.leave = new _DropEvent["default"](dropState, dragEvent, 'dragleave');
      dragEvent.dragLeave = dropEvents.leave.target = dropState.prev.element;
      dragEvent.prevDropzone = dropEvents.leave.dropzone = dropState.prev.dropzone;
    } // if dropzone is not null, create a dragenter event


    if (dropState.cur.dropzone) {
      dropEvents.enter = new _DropEvent["default"](dropState, dragEvent, 'dragenter');
      dragEvent.dragEnter = dropState.cur.element;
      dragEvent.dropzone = dropState.cur.dropzone;
    }
  }

  if (dragEvent.type === 'dragend' && dropState.cur.dropzone) {
    dropEvents.drop = new _DropEvent["default"](dropState, dragEvent, 'drop');
    dragEvent.dropzone = dropState.cur.dropzone;
    dragEvent.relatedTarget = dropState.cur.element;
  }

  if (dragEvent.type === 'dragmove' && dropState.cur.dropzone) {
    dropEvents.move = new _DropEvent["default"](dropState, dragEvent, 'dropmove');
    dropEvents.move.dragmove = dragEvent;
    dragEvent.dropzone = dropState.cur.dropzone;
  }

  return dropEvents;
}

function fireDropEvents(interaction, events) {
  var dropState = interaction.dropState;
  var activeDrops = dropState.activeDrops,
      cur = dropState.cur,
      prev = dropState.prev;

  if (events.leave) {
    prev.dropzone.fire(events.leave);
  }

  if (events.move) {
    cur.dropzone.fire(events.move);
  }

  if (events.enter) {
    cur.dropzone.fire(events.enter);
  }

  if (events.drop) {
    cur.dropzone.fire(events.drop);
  }

  if (events.deactivate) {
    fireActivationEvents(activeDrops, events.deactivate);
  }

  dropState.prev.dropzone = cur.dropzone;
  dropState.prev.element = cur.element;
}

function onEventCreated(_ref10, scope) {
  var interaction = _ref10.interaction,
      iEvent = _ref10.iEvent,
      event = _ref10.event;

  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
    return;
  }

  var dropState = interaction.dropState;

  if (scope.dynamicDrop) {
    dropState.activeDrops = getActiveDrops(scope, interaction.element);
  }

  var dragEvent = iEvent;
  var dropResult = getDrop(interaction, dragEvent, event); // update rejected status

  dropState.rejected = dropState.rejected && !!dropResult && dropResult.dropzone === dropState.cur.dropzone && dropResult.element === dropState.cur.element;
  dropState.cur.dropzone = dropResult && dropResult.dropzone;
  dropState.cur.element = dropResult && dropResult.element;
  dropState.events = getDropEvents(interaction, event, dragEvent);
}

function dropzoneMethod(interactable, options) {
  if (__utils_3.is.object(options)) {
    interactable.options.drop.enabled = options.enabled !== false;

    if (options.listeners) {
      var normalized = __utils_3.normalizeListeners(options.listeners); // rename 'drop' to '' as it will be prefixed with 'drop'

      var corrected = Object.keys(normalized).reduce(function (acc, type) {
        var correctedType = /^(enter|leave)/.test(type) ? "drag".concat(type) : /^(activate|deactivate|move)/.test(type) ? "drop".concat(type) : type;
        acc[correctedType] = normalized[type];
        return acc;
      }, {});
      interactable.off(interactable.options.drop.listeners);
      interactable.on(corrected);
      interactable.options.drop.listeners = corrected;
    }

    if (__utils_3.is.func(options.ondrop)) {
      interactable.on('drop', options.ondrop);
    }

    if (__utils_3.is.func(options.ondropactivate)) {
      interactable.on('dropactivate', options.ondropactivate);
    }

    if (__utils_3.is.func(options.ondropdeactivate)) {
      interactable.on('dropdeactivate', options.ondropdeactivate);
    }

    if (__utils_3.is.func(options.ondragenter)) {
      interactable.on('dragenter', options.ondragenter);
    }

    if (__utils_3.is.func(options.ondragleave)) {
      interactable.on('dragleave', options.ondragleave);
    }

    if (__utils_3.is.func(options.ondropmove)) {
      interactable.on('dropmove', options.ondropmove);
    }

    if (/^(pointer|center)$/.test(options.overlap)) {
      interactable.options.drop.overlap = options.overlap;
    } else if (__utils_3.is.number(options.overlap)) {
      interactable.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
    }

    if ('accept' in options) {
      interactable.options.drop.accept = options.accept;
    }

    if ('checker' in options) {
      interactable.options.drop.checker = options.checker;
    }

    return interactable;
  }

  if (__utils_3.is.bool(options)) {
    interactable.options.drop.enabled = options;
    return interactable;
  }

  return interactable.options.drop;
}

function dropCheckMethod(interactable, dragEvent, event, draggable, draggableElement, dropElement, rect) {
  var dropped = false; // if the dropzone has no rect (eg. display: none)
  // call the custom dropChecker or just return false

  if (!(rect = rect || interactable.getRect(dropElement))) {
    return interactable.options.drop.checker ? interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement) : false;
  }

  var dropOverlap = interactable.options.drop.overlap;

  if (dropOverlap === 'pointer') {
    var origin = __utils_3.getOriginXY(draggable, draggableElement, 'drag');
    var page = __utils_3.pointer.getPageXY(dragEvent);
    page.x += origin.x;
    page.y += origin.y;
    var horizontal = page.x > rect.left && page.x < rect.right;
    var vertical = page.y > rect.top && page.y < rect.bottom;
    dropped = horizontal && vertical;
  }

  var dragRect = draggable.getRect(draggableElement);

  if (dragRect && dropOverlap === 'center') {
    var cx = dragRect.left + dragRect.width / 2;
    var cy = dragRect.top + dragRect.height / 2;
    dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
  }

  if (dragRect && __utils_3.is.number(dropOverlap)) {
    var overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));
    var overlapRatio = overlapArea / (dragRect.width * dragRect.height);
    dropped = overlapRatio >= dropOverlap;
  }

  if (interactable.options.drop.checker) {
    dropped = interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement);
  }

  return dropped;
}

var drop = {
  id: 'actions/drop',
  install: __install_3,
  listeners: {
    'interactions:before-action-start': function interactionsBeforeActionStart(_ref11) {
      var interaction = _ref11.interaction;

      if (interaction.prepared.name !== 'drag') {
        return;
      }

      interaction.dropState = {
        cur: {
          dropzone: null,
          element: null
        },
        prev: {
          dropzone: null,
          element: null
        },
        rejected: null,
        events: null,
        activeDrops: []
      };
    },
    'interactions:after-action-start': function interactionsAfterActionStart(_ref12, scope) {
      var interaction = _ref12.interaction,
          event = _ref12.event,
          dragEvent = _ref12.iEvent;

      if (interaction.prepared.name !== 'drag') {
        return;
      }

      var dropState = interaction.dropState; // reset active dropzones

      dropState.activeDrops = null;
      dropState.events = null;
      dropState.activeDrops = getActiveDrops(scope, interaction.element);
      dropState.events = getDropEvents(interaction, event, dragEvent);

      if (dropState.events.activate) {
        fireActivationEvents(dropState.activeDrops, dropState.events.activate);
        scope.fire('actions/drop:start', {
          interaction: interaction,
          dragEvent: dragEvent
        });
      }
    },
    // FIXME proper signal types
    'interactions:action-move': onEventCreated,
    'interactions:action-end': onEventCreated,
    'interactions:after-action-move': function fireDropAfterMove(_ref13, scope) {
      var interaction = _ref13.interaction,
          dragEvent = _ref13.iEvent;

      if (interaction.prepared.name !== 'drag') {
        return;
      }

      fireDropEvents(interaction, interaction.dropState.events);
      scope.fire('actions/drop:move', {
        interaction: interaction,
        dragEvent: dragEvent
      });
      interaction.dropState.events = {};
    },
    'interactions:after-action-end': function interactionsAfterActionEnd(_ref14, scope) {
      var interaction = _ref14.interaction,
          dragEvent = _ref14.iEvent;

      if (interaction.prepared.name !== 'drag') {
        return;
      }

      fireDropEvents(interaction, interaction.dropState.events);
      scope.fire('actions/drop:end', {
        interaction: interaction,
        dragEvent: dragEvent
      });
    },
    'interactions:stop': function interactionsStop(_ref15) {
      var interaction = _ref15.interaction;

      if (interaction.prepared.name !== 'drag') {
        return;
      }

      var dropState = interaction.dropState;

      if (dropState) {
        dropState.activeDrops = null;
        dropState.events = null;
        dropState.cur.dropzone = null;
        dropState.cur.element = null;
        dropState.prev.dropzone = null;
        dropState.prev.element = null;
        dropState.rejected = false;
      }
    }
  },
  getActiveDrops: getActiveDrops,
  getDrop: getDrop,
  getDropEvents: getDropEvents,
  fireDropEvents: fireDropEvents,
  defaults: {
    enabled: false,
    accept: null,
    overlap: 'pointer'
  }
};
var ___default_3 = drop;
_$index_3["default"] = ___default_3;

var _$gesture_4 = {};
"use strict";

function ___typeof_4(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_4 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_4 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_4(obj); }

Object.defineProperty(_$gesture_4, "__esModule", {
  value: true
});
_$gesture_4["default"] = void 0;

var __utils_4 = ___interopRequireWildcard_4(_$index_75);

function ___getRequireWildcardCache_4() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_4 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_4(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_4(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_4(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function __install_4(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      defaults = scope.defaults;
  /**
   * ```js
   * interact(element).gesturable({
   *     onstart: function (event) {},
   *     onmove : function (event) {},
   *     onend  : function (event) {},
   *
   *     // limit multiple gestures.
   *     // See the explanation in {@link Interactable.draggable} example
   *     max: Infinity,
   *     maxPerElement: 1,
   * })
   *
   * var isGestureable = interact(element).gesturable()
   * ```
   *
   * Gets or sets whether multitouch gestures can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on gesture events (makes the Interactable gesturable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of gesture events, or this Interactable
   */

  Interactable.prototype.gesturable = function (options) {
    if (__utils_4.is.object(options)) {
      this.options.gesture.enabled = options.enabled !== false;
      this.setPerAction('gesture', options);
      this.setOnEvents('gesture', options);
      return this;
    }

    if (__utils_4.is.bool(options)) {
      this.options.gesture.enabled = options;
      return this;
    }

    return this.options.gesture;
  };

  actions.map.gesture = gesture;
  actions.methodDict.gesture = 'gesturable';
  defaults.actions.gesture = gesture.defaults;
}

function updateGestureProps(_ref) {
  var interaction = _ref.interaction,
      iEvent = _ref.iEvent,
      phase = _ref.phase;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  var pointers = interaction.pointers.map(function (p) {
    return p.pointer;
  });
  var starting = phase === 'start';
  var ending = phase === 'end';
  var deltaSource = interaction.interactable.options.deltaSource;
  iEvent.touches = [pointers[0], pointers[1]];

  if (starting) {
    iEvent.distance = __utils_4.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = __utils_4.pointer.touchBBox(pointers);
    iEvent.scale = 1;
    iEvent.ds = 0;
    iEvent.angle = __utils_4.pointer.touchAngle(pointers, deltaSource);
    iEvent.da = 0;
    interaction.gesture.startDistance = iEvent.distance;
    interaction.gesture.startAngle = iEvent.angle;
  } else if (ending) {
    var prevEvent = interaction.prevEvent;
    iEvent.distance = prevEvent.distance;
    iEvent.box = prevEvent.box;
    iEvent.scale = prevEvent.scale;
    iEvent.ds = 0;
    iEvent.angle = prevEvent.angle;
    iEvent.da = 0;
  } else {
    iEvent.distance = __utils_4.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = __utils_4.pointer.touchBBox(pointers);
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
    iEvent.angle = __utils_4.pointer.touchAngle(pointers, deltaSource);
    iEvent.ds = iEvent.scale - interaction.gesture.scale;
    iEvent.da = iEvent.angle - interaction.gesture.angle;
  }

  interaction.gesture.distance = iEvent.distance;
  interaction.gesture.angle = iEvent.angle;

  if (__utils_4.is.number(iEvent.scale) && iEvent.scale !== Infinity && !isNaN(iEvent.scale)) {
    interaction.gesture.scale = iEvent.scale;
  }
}

var gesture = {
  id: 'actions/gesture',
  before: ['actions/drag', 'actions/resize'],
  install: __install_4,
  listeners: {
    'interactions:action-start': updateGestureProps,
    'interactions:action-move': updateGestureProps,
    'interactions:action-end': updateGestureProps,
    'interactions:new': function interactionsNew(_ref2) {
      var interaction = _ref2.interaction;
      interaction.gesture = {
        angle: 0,
        distance: 0,
        scale: 1,
        startAngle: 0,
        startDistance: 0
      };
    },
    'auto-start:check': function autoStartCheck(arg) {
      if (arg.interaction.pointers.length < 2) {
        return undefined;
      }

      var gestureOptions = arg.interactable.options.gesture;

      if (!(gestureOptions && gestureOptions.enabled)) {
        return undefined;
      }

      arg.action = {
        name: 'gesture'
      };
      return false;
    }
  },
  defaults: {},
  getCursor: function getCursor() {
    return '';
  }
};
var ___default_4 = gesture;
_$gesture_4["default"] = ___default_4;

var _$resize_6 = {};
"use strict";

function ___typeof_6(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_6 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_6 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_6(obj); }

Object.defineProperty(_$resize_6, "__esModule", {
  value: true
});
_$resize_6["default"] = void 0;

/* removed: var _$Interaction_22 = require("@interactjs/core/Interaction"); */;

var __dom_6 = ___interopRequireWildcard_6(_$domUtils_70);

var ___extend_6 = ___interopRequireDefault_6(_$extend_72);

var __is_6 = ___interopRequireWildcard_6(_$is_76);

function ___interopRequireDefault_6(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_6() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_6 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_6(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_6(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_6(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function __install_6(scope) {
  var actions = scope.actions,
      browser = scope.browser,
      Interactable = scope.Interactable,
      defaults = scope.defaults; // Less Precision with touch input

  resize.cursors = initCursors(browser);
  resize.defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;
  /**
   * ```js
   * interact(element).resizable({
   *   onstart: function (event) {},
   *   onmove : function (event) {},
   *   onend  : function (event) {},
   *
   *   edges: {
   *     top   : true,       // Use pointer coords to check for resize.
   *     left  : false,      // Disable resizing from left edge.
   *     bottom: '.resize-s',// Resize if pointer target matches selector
   *     right : handleEl    // Resize if pointer target is the given Element
   *   },
   *
   *     // Width and height can be adjusted independently. When `true`, width and
   *     // height are adjusted at a 1:1 ratio.
   *     square: false,
   *
   *     // Width and height can be adjusted independently. When `true`, width and
   *     // height maintain the aspect ratio they had when resizing started.
   *     preserveAspectRatio: false,
   *
   *   // a value of 'none' will limit the resize rect to a minimum of 0x0
   *   // 'negate' will allow the rect to have negative width/height
   *   // 'reposition' will keep the width/height positive by swapping
   *   // the top and bottom edges and/or swapping the left and right edges
   *   invert: 'none' || 'negate' || 'reposition'
   *
   *   // limit multiple resizes.
   *   // See the explanation in the {@link Interactable.draggable} example
   *   max: Infinity,
   *   maxPerElement: 1,
   * })
   *
   * var isResizeable = interact(element).resizable()
   * ```
   *
   * Gets or sets whether resize actions can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on resize events (object makes the Interactable
   * resizable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of resize elements, or this Interactable
   */

  Interactable.prototype.resizable = function (options) {
    return resizable(this, options, scope);
  };

  actions.map.resize = resize;
  actions.methodDict.resize = 'resizable';
  defaults.actions.resize = resize.defaults;
}

function resizeChecker(arg) {
  var interaction = arg.interaction,
      interactable = arg.interactable,
      element = arg.element,
      rect = arg.rect,
      buttons = arg.buttons;

  if (!rect) {
    return undefined;
  }

  var page = (0, ___extend_6["default"])({}, interaction.coords.cur.page);
  var resizeOptions = interactable.options.resize;

  if (!(resizeOptions && resizeOptions.enabled) || // check mouseButton setting if the pointer is down
  interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & resizeOptions.mouseButtons) === 0) {
    return undefined;
  } // if using resize.edges


  if (__is_6.object(resizeOptions.edges)) {
    var resizeEdges = {
      left: false,
      right: false,
      top: false,
      bottom: false
    };

    for (var edge in resizeEdges) {
      resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._latestPointer.eventTarget, element, rect, resizeOptions.margin || resize.defaultMargin);
    }

    resizeEdges.left = resizeEdges.left && !resizeEdges.right;
    resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;

    if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
      arg.action = {
        name: 'resize',
        edges: resizeEdges
      };
    }
  } else {
    var right = resizeOptions.axis !== 'y' && page.x > rect.right - resize.defaultMargin;
    var bottom = resizeOptions.axis !== 'x' && page.y > rect.bottom - resize.defaultMargin;

    if (right || bottom) {
      arg.action = {
        name: 'resize',
        axes: (right ? 'x' : '') + (bottom ? 'y' : '')
      };
    }
  }

  return arg.action ? false : undefined;
}

function resizable(interactable, options, scope) {
  if (__is_6.object(options)) {
    interactable.options.resize.enabled = options.enabled !== false;
    interactable.setPerAction('resize', options);
    interactable.setOnEvents('resize', options);

    if (__is_6.string(options.axis) && /^x$|^y$|^xy$/.test(options.axis)) {
      interactable.options.resize.axis = options.axis;
    } else if (options.axis === null) {
      interactable.options.resize.axis = scope.defaults.actions.resize.axis;
    }

    if (__is_6.bool(options.preserveAspectRatio)) {
      interactable.options.resize.preserveAspectRatio = options.preserveAspectRatio;
    } else if (__is_6.bool(options.square)) {
      interactable.options.resize.square = options.square;
    }

    return interactable;
  }

  if (__is_6.bool(options)) {
    interactable.options.resize.enabled = options;
    return interactable;
  }

  return interactable.options.resize;
}

function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
  // false, '', undefined, null
  if (!value) {
    return false;
  } // true value, use pointer coords and element rect


  if (value === true) {
    // if dimensions are negative, "switch" edges
    var width = __is_6.number(rect.width) ? rect.width : rect.right - rect.left;
    var height = __is_6.number(rect.height) ? rect.height : rect.bottom - rect.top; // don't use margin greater than half the relevent dimension

    margin = Math.min(margin, (name === 'left' || name === 'right' ? width : height) / 2);

    if (width < 0) {
      if (name === 'left') {
        name = 'right';
      } else if (name === 'right') {
        name = 'left';
      }
    }

    if (height < 0) {
      if (name === 'top') {
        name = 'bottom';
      } else if (name === 'bottom') {
        name = 'top';
      }
    }

    if (name === 'left') {
      return page.x < (width >= 0 ? rect.left : rect.right) + margin;
    }

    if (name === 'top') {
      return page.y < (height >= 0 ? rect.top : rect.bottom) + margin;
    }

    if (name === 'right') {
      return page.x > (width >= 0 ? rect.right : rect.left) - margin;
    }

    if (name === 'bottom') {
      return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
    }
  } // the remaining checks require an element


  if (!__is_6.element(element)) {
    return false;
  }

  return __is_6.element(value) // the value is an element to use as a resize handle
  ? value === element // otherwise check if element matches value as selector
  : __dom_6.matchesUpTo(element, value, interactableElement);
}

function initCursors(browser) {
  return browser.isIe9 ? {
    x: 'e-resize',
    y: 's-resize',
    xy: 'se-resize',
    top: 'n-resize',
    left: 'w-resize',
    bottom: 's-resize',
    right: 'e-resize',
    topleft: 'se-resize',
    bottomright: 'se-resize',
    topright: 'ne-resize',
    bottomleft: 'ne-resize'
  } : {
    x: 'ew-resize',
    y: 'ns-resize',
    xy: 'nwse-resize',
    top: 'ns-resize',
    left: 'ew-resize',
    bottom: 'ns-resize',
    right: 'ew-resize',
    topleft: 'nwse-resize',
    bottomright: 'nwse-resize',
    topright: 'nesw-resize',
    bottomleft: 'nesw-resize'
  };
}

function start(_ref) {
  var iEvent = _ref.iEvent,
      interaction = _ref.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var resizeEvent = iEvent;
  var rect = interaction.rect;
  interaction._rects = {
    start: (0, ___extend_6["default"])({}, rect),
    corrected: (0, ___extend_6["default"])({}, rect),
    previous: (0, ___extend_6["default"])({}, rect),
    delta: {
      left: 0,
      right: 0,
      width: 0,
      top: 0,
      bottom: 0,
      height: 0
    }
  };
  resizeEvent.edges = interaction.prepared.edges;
  resizeEvent.rect = interaction._rects.corrected;
  resizeEvent.deltaRect = interaction._rects.delta;
}

function __move_6(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var resizeEvent = iEvent;
  var resizeOptions = interaction.interactable.options.resize;
  var invert = resizeOptions.invert;
  var invertible = invert === 'reposition' || invert === 'negate'; // eslint-disable-next-line no-shadow

  var current = interaction.rect;
  var _interaction$_rects = interaction._rects,
      startRect = _interaction$_rects.start,
      corrected = _interaction$_rects.corrected,
      deltaRect = _interaction$_rects.delta,
      previous = _interaction$_rects.previous;
  (0, ___extend_6["default"])(previous, corrected);

  if (invertible) {
    // if invertible, copy the current rect
    (0, ___extend_6["default"])(corrected, current);

    if (invert === 'reposition') {
      // swap edge values if necessary to keep width/height positive
      if (corrected.top > corrected.bottom) {
        var swap = corrected.top;
        corrected.top = corrected.bottom;
        corrected.bottom = swap;
      }

      if (corrected.left > corrected.right) {
        var _swap = corrected.left;
        corrected.left = corrected.right;
        corrected.right = _swap;
      }
    }
  } else {
    // if not invertible, restrict to minimum of 0x0 rect
    corrected.top = Math.min(current.top, startRect.bottom);
    corrected.bottom = Math.max(current.bottom, startRect.top);
    corrected.left = Math.min(current.left, startRect.right);
    corrected.right = Math.max(current.right, startRect.left);
  }

  corrected.width = corrected.right - corrected.left;
  corrected.height = corrected.bottom - corrected.top;

  for (var edge in corrected) {
    deltaRect[edge] = corrected[edge] - previous[edge];
  }

  resizeEvent.edges = interaction.prepared.edges;
  resizeEvent.rect = corrected;
  resizeEvent.deltaRect = deltaRect;
}

function end(_ref3) {
  var iEvent = _ref3.iEvent,
      interaction = _ref3.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var resizeEvent = iEvent;
  resizeEvent.edges = interaction.prepared.edges;
  resizeEvent.rect = interaction._rects.corrected;
  resizeEvent.deltaRect = interaction._rects.delta;
}

function updateEventAxes(_ref4) {
  var iEvent = _ref4.iEvent,
      interaction = _ref4.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.resizeAxes) {
    return;
  }

  var options = interaction.interactable.options;
  var resizeEvent = iEvent;

  if (options.resize.square) {
    if (interaction.resizeAxes === 'y') {
      resizeEvent.delta.x = resizeEvent.delta.y;
    } else {
      resizeEvent.delta.y = resizeEvent.delta.x;
    }

    resizeEvent.axes = 'xy';
  } else {
    resizeEvent.axes = interaction.resizeAxes;

    if (interaction.resizeAxes === 'x') {
      resizeEvent.delta.y = 0;
    } else if (interaction.resizeAxes === 'y') {
      resizeEvent.delta.x = 0;
    }
  }
}

var resize = {
  id: 'actions/resize',
  before: ['actions/drag'],
  install: __install_6,
  listeners: {
    'interactions:new': function interactionsNew(_ref5) {
      var interaction = _ref5.interaction;
      interaction.resizeAxes = 'xy';
    },
    'interactions:action-start': function interactionsActionStart(arg) {
      start(arg);
      updateEventAxes(arg);
    },
    'interactions:action-move': function interactionsActionMove(arg) {
      __move_6(arg);
      updateEventAxes(arg);
    },
    'interactions:action-end': end,
    'auto-start:check': resizeChecker
  },
  defaults: {
    square: false,
    preserveAspectRatio: false,
    axis: 'xy',
    // use default margin
    margin: NaN,
    // object with props left, right, top, bottom which are
    // true/false values to resize when the pointer is over that edge,
    // CSS selectors to match the handles for each direction
    // or the Elements for each handle
    edges: null,
    // a value of 'none' will limit the resize rect to a minimum of 0x0
    // 'negate' will alow the rect to have negative width/height
    // 'reposition' will keep the width/height positive by swapping
    // the top and bottom edges and/or swapping the left and right edges
    invert: 'none'
  },
  cursors: null,
  getCursor: function getCursor(_ref6) {
    var edges = _ref6.edges,
        axis = _ref6.axis,
        name = _ref6.name;
    var cursors = resize.cursors;
    var result = null;

    if (axis) {
      result = cursors[name + axis];
    } else if (edges) {
      var cursorKey = '';
      var _arr = ['top', 'bottom', 'left', 'right'];

      for (var _i = 0; _i < _arr.length; _i++) {
        var edge = _arr[_i];

        if (edges[edge]) {
          cursorKey += edge;
        }
      }

      result = cursors[cursorKey];
    }

    return result;
  },
  defaultMargin: null
};
var ___default_6 = resize;
_$resize_6["default"] = ___default_6;

var _$index_5 = {};
"use strict";

Object.defineProperty(_$index_5, "__esModule", {
  value: true
});
Object.defineProperty(_$index_5, "drag", {
  enumerable: true,
  get: function get() {
    return ___drag_5["default"];
  }
});
Object.defineProperty(_$index_5, "drop", {
  enumerable: true,
  get: function get() {
    return _index["default"];
  }
});
Object.defineProperty(_$index_5, "gesture", {
  enumerable: true,
  get: function get() {
    return _gesture["default"];
  }
});
Object.defineProperty(_$index_5, "resize", {
  enumerable: true,
  get: function get() {
    return _resize["default"];
  }
});
_$index_5["default"] = void 0;

var ___drag_5 = ___interopRequireDefault_5(_$drag_1);

var _index = ___interopRequireDefault_5(_$index_3);

var _gesture = ___interopRequireDefault_5(_$gesture_4);

var _resize = ___interopRequireDefault_5(_$resize_6);

function ___interopRequireDefault_5(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var ___default_5 = {
  id: 'actions',
  install: function install(scope) {
    scope.usePlugin(_gesture["default"]);
    scope.usePlugin(_resize["default"]);
    scope.usePlugin(___drag_5["default"]);
    scope.usePlugin(_index["default"]);
  }
};
_$index_5["default"] = ___default_5;

var _$index_7 = {};
"use strict";

Object.defineProperty(_$index_7, "__esModule", {
  value: true
});
_$index_7["default"] = void 0;
var ___default_7 = {};
_$index_7["default"] = ___default_7;

var _$index_8 = {};
"use strict";

function ___typeof_8(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_8 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_8 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_8(obj); }

Object.defineProperty(_$index_8, "__esModule", {
  value: true
});
_$index_8.getContainer = getContainer;
_$index_8.getScroll = getScroll;
_$index_8.getScrollSize = getScrollSize;
_$index_8.getScrollSizeDelta = getScrollSizeDelta;
_$index_8["default"] = void 0;

var __domUtils_8 = ___interopRequireWildcard_8(_$domUtils_70);

var __is_8 = ___interopRequireWildcard_8(_$is_76);

var ___raf_8 = ___interopRequireDefault_8(_$raf_81);

/* removed: var _$rect_82 = require("@interactjs/utils/rect"); */;

/* removed: var _$window_83 = require("@interactjs/utils/window"); */;

function ___interopRequireDefault_8(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_8() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_8 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_8(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_8(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_8(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function __install_8(scope) {
  var defaults = scope.defaults,
      actions = scope.actions;
  scope.autoScroll = autoScroll;

  autoScroll.now = function () {
    return scope.now();
  };

  actions.phaselessTypes.autoscroll = true;
  defaults.perAction.autoScroll = autoScroll.defaults;
}

var autoScroll = {
  defaults: {
    enabled: false,
    margin: 60,
    // the item that is scrolled (Window or HTMLElement)
    container: null,
    // the scroll speed in pixels per second
    speed: 300
  },
  now: Date.now,
  interaction: null,
  i: 0,
  // the handle returned by window.setInterval
  // Direction each pulse is to scroll in
  x: 0,
  y: 0,
  isScrolling: false,
  prevTime: 0,
  margin: 0,
  speed: 0,
  start: function start(interaction) {
    autoScroll.isScrolling = true;

    ___raf_8["default"].cancel(autoScroll.i);

    interaction.autoScroll = autoScroll;
    autoScroll.interaction = interaction;
    autoScroll.prevTime = autoScroll.now();
    autoScroll.i = ___raf_8["default"].request(autoScroll.scroll);
  },
  stop: function stop() {
    autoScroll.isScrolling = false;

    if (autoScroll.interaction) {
      autoScroll.interaction.autoScroll = null;
    }

    ___raf_8["default"].cancel(autoScroll.i);
  },
  // scroll the window by the values in scroll.x/y
  scroll: function scroll() {
    var interaction = autoScroll.interaction;
    var interactable = interaction.interactable,
        element = interaction.element;
    var actionName = interaction.prepared.name;
    var options = interactable.options[actionName].autoScroll;
    var container = getContainer(options.container, interactable, element);
    var now = autoScroll.now(); // change in time in seconds

    var dt = (now - autoScroll.prevTime) / 1000; // displacement

    var s = options.speed * dt;

    if (s >= 1) {
      var scrollBy = {
        x: autoScroll.x * s,
        y: autoScroll.y * s
      };

      if (scrollBy.x || scrollBy.y) {
        var prevScroll = getScroll(container);

        if (__is_8.window(container)) {
          container.scrollBy(scrollBy.x, scrollBy.y);
        } else if (container) {
          container.scrollLeft += scrollBy.x;
          container.scrollTop += scrollBy.y;
        }

        var curScroll = getScroll(container);
        var delta = {
          x: curScroll.x - prevScroll.x,
          y: curScroll.y - prevScroll.y
        };

        if (delta.x || delta.y) {
          interactable.fire({
            type: 'autoscroll',
            target: element,
            interactable: interactable,
            delta: delta,
            interaction: interaction,
            container: container
          });
        }
      }

      autoScroll.prevTime = now;
    }

    if (autoScroll.isScrolling) {
      ___raf_8["default"].cancel(autoScroll.i);

      autoScroll.i = ___raf_8["default"].request(autoScroll.scroll);
    }
  },
  check: function check(interactable, actionName) {
    var options = interactable.options;
    return options[actionName].autoScroll && options[actionName].autoScroll.enabled;
  },
  onInteractionMove: function onInteractionMove(_ref) {
    var interaction = _ref.interaction,
        pointer = _ref.pointer;

    if (!(interaction.interacting() && autoScroll.check(interaction.interactable, interaction.prepared.name))) {
      return;
    }

    if (interaction.simulation) {
      autoScroll.x = autoScroll.y = 0;
      return;
    }

    var top;
    var right;
    var bottom;
    var left;
    var interactable = interaction.interactable,
        element = interaction.element;
    var actionName = interaction.prepared.name;
    var options = interactable.options[actionName].autoScroll;
    var container = getContainer(options.container, interactable, element);

    if (__is_8.window(container)) {
      left = pointer.clientX < autoScroll.margin;
      top = pointer.clientY < autoScroll.margin;
      right = pointer.clientX > container.innerWidth - autoScroll.margin;
      bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
    } else {
      var rect = __domUtils_8.getElementClientRect(container);
      left = pointer.clientX < rect.left + autoScroll.margin;
      top = pointer.clientY < rect.top + autoScroll.margin;
      right = pointer.clientX > rect.right - autoScroll.margin;
      bottom = pointer.clientY > rect.bottom - autoScroll.margin;
    }

    autoScroll.x = right ? 1 : left ? -1 : 0;
    autoScroll.y = bottom ? 1 : top ? -1 : 0;

    if (!autoScroll.isScrolling) {
      // set the autoScroll properties to those of the target
      autoScroll.margin = options.margin;
      autoScroll.speed = options.speed;
      autoScroll.start(interaction);
    }
  }
};

function getContainer(value, interactable, element) {
  return (__is_8.string(value) ? (0, _$rect_82.getStringOptionResult)(value, interactable, element) : value) || (0, _$window_83.getWindow)(element);
}

function getScroll(container) {
  if (__is_8.window(container)) {
    container = window.document.body;
  }

  return {
    x: container.scrollLeft,
    y: container.scrollTop
  };
}

function getScrollSize(container) {
  if (__is_8.window(container)) {
    container = window.document.body;
  }

  return {
    x: container.scrollWidth,
    y: container.scrollHeight
  };
}

function getScrollSizeDelta(_ref2, func) {
  var interaction = _ref2.interaction,
      element = _ref2.element;
  var scrollOptions = interaction && interaction.interactable.options[interaction.prepared.name].autoScroll;

  if (!scrollOptions || !scrollOptions.enabled) {
    func();
    return {
      x: 0,
      y: 0
    };
  }

  var scrollContainer = getContainer(scrollOptions.container, interaction.interactable, element);
  var prevSize = getScroll(scrollContainer);
  func();
  var curSize = getScroll(scrollContainer);
  return {
    x: curSize.x - prevSize.x,
    y: curSize.y - prevSize.y
  };
}

var autoScrollPlugin = {
  id: 'auto-scroll',
  install: __install_8,
  listeners: {
    'interactions:new': function interactionsNew(_ref3) {
      var interaction = _ref3.interaction;
      interaction.autoScroll = null;
    },
    'interactions:destroy': function interactionsDestroy(_ref4) {
      var interaction = _ref4.interaction;
      interaction.autoScroll = null;
      autoScroll.stop();

      if (autoScroll.interaction) {
        autoScroll.interaction = null;
      }
    },
    'interactions:stop': autoScroll.stop,
    'interactions:action-move': function interactionsActionMove(arg) {
      return autoScroll.onInteractionMove(arg);
    }
  }
};
var ___default_8 = autoScrollPlugin;
_$index_8["default"] = ___default_8;

var _$InteractableMethods_9 = {};
"use strict";

function ___typeof_9(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_9 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_9 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_9(obj); }

Object.defineProperty(_$InteractableMethods_9, "__esModule", {
  value: true
});
_$InteractableMethods_9["default"] = void 0;

/* removed: var _$index_75 = require("@interactjs/utils/index"); */;

var __is_9 = ___interopRequireWildcard_9(_$is_76);

function ___getRequireWildcardCache_9() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_9 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_9(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_9(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_9(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function __install_9(scope) {
  var Interactable = scope.Interactable;

  Interactable.prototype.getAction = function getAction(pointer, event, interaction, element) {
    var action = defaultActionChecker(this, event, interaction, element, scope);

    if (this.options.actionChecker) {
      return this.options.actionChecker(pointer, event, action, this, element, interaction);
    }

    return action;
  };
  /**
   * ```js
   * interact(element, { ignoreFrom: document.getElementById('no-action') })
   * // or
   * interact(element).ignoreFrom('input, textarea, a')
   * ```
   * @deprecated
   * If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
   * of it's parents match the given CSS selector or Element, no
   * drag/resize/gesture is started.
   *
   * Don't use this method. Instead set the `ignoreFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .draggable({
   *     ignoreFrom: 'input, textarea, a[href]'',
   *   })
   *   .pointerEvents({
   *     ignoreFrom: '[no-pointer]',
   *   })
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to not ignore any elements
   * @return {string | Element | object} The current ignoreFrom value or this
   * Interactable
   */


  Interactable.prototype.ignoreFrom = (0, _$index_75.warnOnce)(function (newValue) {
    return this._backCompatOption('ignoreFrom', newValue);
  }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');
  /**
   * @deprecated
   *
   * A drag/resize/gesture is started only If the target of the `mousedown`,
   * `pointerdown` or `touchstart` event or any of it's parents match the given
   * CSS selector or Element.
   *
   * Don't use this method. Instead set the `allowFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .resizable({
   *     allowFrom: '.resize-handle',
   *   .pointerEvents({
   *     allowFrom: '.handle',,
   *   })
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to allow from any element
   * @return {string | Element | object} The current allowFrom value or this
   * Interactable
   */

  Interactable.prototype.allowFrom = (0, _$index_75.warnOnce)(function (newValue) {
    return this._backCompatOption('allowFrom', newValue);
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');
  /**
   * ```js
   * interact('.resize-drag')
   *   .resizable(true)
   *   .draggable(true)
   *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
   *
   *   if (interact.matchesSelector(event.target, '.drag-handle')) {
   *     // force drag with handle target
   *     action.name = drag
   *   }
   *   else {
   *     // resize from the top and right edges
   *     action.name  = 'resize'
   *     action.edges = { top: true, right: true }
   *   }
   *
   *   return action
   * })
   * ```
   *
   * Returns or sets the function used to check action to be performed on
   * pointerDown
   *
   * @param {function | null} [checker] A function which takes a pointer event,
   * defaultAction string, interactable, element and interaction as parameters
   * and returns an object with name property 'drag' 'resize' or 'gesture' and
   * optionally an `edges` object with boolean 'top', 'left', 'bottom' and right
   * props.
   * @return {Function | Interactable} The checker function or this Interactable
   */

  Interactable.prototype.actionChecker = actionChecker;
  /**
   * Returns or sets whether the the cursor should be changed depending on the
   * action that would be performed if the mouse were pressed and dragged.
   *
   * @param {boolean} [newValue]
   * @return {boolean | Interactable} The current setting or this Interactable
   */

  Interactable.prototype.styleCursor = styleCursor;
}

function defaultActionChecker(interactable, event, interaction, element, scope) {
  var rect = interactable.getRect(element);
  var buttons = event.buttons || {
    0: 1,
    1: 4,
    3: 8,
    4: 16
  }[event.button];
  var arg = {
    action: null,
    interactable: interactable,
    interaction: interaction,
    element: element,
    rect: rect,
    buttons: buttons
  };
  scope.fire('auto-start:check', arg);
  return arg.action;
}

function styleCursor(newValue) {
  if (__is_9.bool(newValue)) {
    this.options.styleCursor = newValue;
    return this;
  }

  if (newValue === null) {
    delete this.options.styleCursor;
    return this;
  }

  return this.options.styleCursor;
}

function actionChecker(checker) {
  if (__is_9.func(checker)) {
    this.options.actionChecker = checker;
    return this;
  }

  if (checker === null) {
    delete this.options.actionChecker;
    return this;
  }

  return this.options.actionChecker;
}

var ___default_9 = {
  id: 'auto-start/interactableMethods',
  install: __install_9
};
_$InteractableMethods_9["default"] = ___default_9;

var _$base_10 = {};
"use strict";

function ___typeof_10(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_10 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_10 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_10(obj); }

Object.defineProperty(_$base_10, "__esModule", {
  value: true
});
_$base_10["default"] = void 0;

var __utils_10 = ___interopRequireWildcard_10(_$index_75);

var _InteractableMethods = ___interopRequireDefault_10(_$InteractableMethods_9);

function ___interopRequireDefault_10(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_10() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_10 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_10(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_10(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_10(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function __install_10(scope) {
  var interact = scope.interactStatic,
      defaults = scope.defaults;
  scope.usePlugin(_InteractableMethods["default"]);
  defaults.base.actionChecker = null;
  defaults.base.styleCursor = true;
  __utils_10.extend(defaults.perAction, {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1,
    allowFrom: null,
    ignoreFrom: null,
    // only allow left button by default
    // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
    mouseButtons: 1
  });
  /**
   * Returns or sets the maximum number of concurrent interactions allowed.  By
   * default only 1 interaction is allowed at a time (for backwards
   * compatibility). To allow multiple interactions on the same Interactables and
   * elements, you need to enable it in the draggable, resizable and gesturable
   * `'max'` and `'maxPerElement'` options.
   *
   * @alias module:interact.maxInteractions
   *
   * @param {number} [newValue] Any number. newValue <= 0 means no interactions.
   */

  interact.maxInteractions = function (newValue) {
    return maxInteractions(newValue, scope);
  };

  scope.autoStart = {
    // Allow this many interactions to happen simultaneously
    maxInteractions: Infinity,
    withinInteractionLimit: withinInteractionLimit,
    cursorElement: null
  };
}

function prepareOnDown(_ref, scope) {
  var interaction = _ref.interaction,
      pointer = _ref.pointer,
      event = _ref.event,
      eventTarget = _ref.eventTarget;

  if (interaction.interacting()) {
    return;
  }

  var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
  prepare(interaction, actionInfo, scope);
}

function prepareOnMove(_ref2, scope) {
  var interaction = _ref2.interaction,
      pointer = _ref2.pointer,
      event = _ref2.event,
      eventTarget = _ref2.eventTarget;

  if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) {
    return;
  }

  var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
  prepare(interaction, actionInfo, scope);
}

function startOnMove(arg, scope) {
  var interaction = arg.interaction;

  if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
    return;
  }

  scope.fire('autoStart:before-start', arg);
  var interactable = interaction.interactable;
  var actionName = interaction.prepared.name;

  if (actionName && interactable) {
    // check manualStart and interaction limit
    if (interactable.options[actionName].manualStart || !withinInteractionLimit(interactable, interaction.element, interaction.prepared, scope)) {
      interaction.stop();
    } else {
      interaction.start(interaction.prepared, interactable, interaction.element);
      setInteractionCursor(interaction, scope);
    }
  }
}

function clearCursorOnStop(_ref3, scope) {
  var interaction = _ref3.interaction;
  var interactable = interaction.interactable;

  if (interactable && interactable.options.styleCursor) {
    setCursor(interaction.element, '', scope);
  }
} // Check if the current interactable supports the action.
// If so, return the validated action. Otherwise, return null


function validateAction(action, interactable, element, eventTarget, scope) {
  if (interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
    return action;
  }

  return null;
}

function validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
  for (var i = 0, len = matches.length; i < len; i++) {
    var match = matches[i];
    var matchElement = matchElements[i];
    var matchAction = match.getAction(pointer, event, interaction, matchElement);

    if (!matchAction) {
      continue;
    }

    var action = validateAction(matchAction, match, matchElement, eventTarget, scope);

    if (action) {
      return {
        action: action,
        interactable: match,
        element: matchElement
      };
    }
  }

  return {
    action: null,
    interactable: null,
    element: null
  };
}

function getActionInfo(interaction, pointer, event, eventTarget, scope) {
  var matches = [];
  var matchElements = [];
  var element = eventTarget;

  function pushMatches(interactable) {
    matches.push(interactable);
    matchElements.push(element);
  }

  while (__utils_10.is.element(element)) {
    matches = [];
    matchElements = [];
    scope.interactables.forEachMatch(element, pushMatches);
    var actionInfo = validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope);

    if (actionInfo.action && !actionInfo.interactable.options[actionInfo.action.name].manualStart) {
      return actionInfo;
    }

    element = __utils_10.dom.parentNode(element);
  }

  return {
    action: null,
    interactable: null,
    element: null
  };
}

function prepare(interaction, _ref4, scope) {
  var action = _ref4.action,
      interactable = _ref4.interactable,
      element = _ref4.element;
  action = action || {
    name: null
  };
  interaction.interactable = interactable;
  interaction.element = element;
  __utils_10.copyAction(interaction.prepared, action);
  interaction.rect = interactable && action.name ? interactable.getRect(element) : null;
  setInteractionCursor(interaction, scope);
  scope.fire('autoStart:prepared', {
    interaction: interaction
  });
}

function withinInteractionLimit(interactable, element, action, scope) {
  var options = interactable.options;
  var maxActions = options[action.name].max;
  var maxPerElement = options[action.name].maxPerElement;
  var autoStartMax = scope.autoStart.maxInteractions;
  var activeInteractions = 0;
  var interactableCount = 0;
  var elementCount = 0; // no actions if any of these values == 0

  if (!(maxActions && maxPerElement && autoStartMax)) {
    return false;
  }

  for (var _i = 0; _i < scope.interactions.list.length; _i++) {
    var _ref5;

    _ref5 = scope.interactions.list[_i];
    var interaction = _ref5;
    var otherAction = interaction.prepared.name;

    if (!interaction.interacting()) {
      continue;
    }

    activeInteractions++;

    if (activeInteractions >= autoStartMax) {
      return false;
    }

    if (interaction.interactable !== interactable) {
      continue;
    }

    interactableCount += otherAction === action.name ? 1 : 0;

    if (interactableCount >= maxActions) {
      return false;
    }

    if (interaction.element === element) {
      elementCount++;

      if (otherAction === action.name && elementCount >= maxPerElement) {
        return false;
      }
    }
  }

  return autoStartMax > 0;
}

function maxInteractions(newValue, scope) {
  if (__utils_10.is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue;
    return this;
  }

  return scope.autoStart.maxInteractions;
}

function setCursor(element, cursor, scope) {
  var prevCursorElement = scope.autoStart.cursorElement;

  if (prevCursorElement && prevCursorElement !== element) {
    prevCursorElement.style.cursor = '';
  }

  element.ownerDocument.documentElement.style.cursor = cursor;
  element.style.cursor = cursor;
  scope.autoStart.cursorElement = cursor ? element : null;
}

function setInteractionCursor(interaction, scope) {
  var interactable = interaction.interactable,
      element = interaction.element,
      prepared = interaction.prepared;

  if (!(interaction.pointerType === 'mouse' && interactable && interactable.options.styleCursor)) {
    // clear previous target element cursor
    if (scope.autoStart.cursorElement) {
      setCursor(scope.autoStart.cursorElement, '', scope);
    }

    return;
  }

  var cursor = '';

  if (prepared.name) {
    var cursorChecker = interactable.options[prepared.name].cursorChecker;

    if (__utils_10.is.func(cursorChecker)) {
      cursor = cursorChecker(prepared, interactable, element, interaction._interacting);
    } else {
      cursor = scope.actions.map[prepared.name].getCursor(prepared);
    }
  }

  setCursor(interaction.element, cursor || '', scope);
}

var autoStart = {
  id: 'auto-start/base',
  before: ['actions', 'actions/drag', 'actions/resize', 'actions/gesture'],
  install: __install_10,
  listeners: {
    'interactions:down': prepareOnDown,
    'interactions:move': function interactionsMove(arg, scope) {
      prepareOnMove(arg, scope);
      startOnMove(arg, scope);
    },
    'interactions:stop': clearCursorOnStop
  },
  maxInteractions: maxInteractions,
  withinInteractionLimit: withinInteractionLimit,
  validateAction: validateAction
};
var ___default_10 = autoStart;
_$base_10["default"] = ___default_10;

var _$dragAxis_11 = {};
"use strict";

function ___typeof_11(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_11 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_11 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_11(obj); }

Object.defineProperty(_$dragAxis_11, "__esModule", {
  value: true
});
_$dragAxis_11["default"] = void 0;

/* removed: var _$domUtils_70 = require("@interactjs/utils/domUtils"); */;

var __is_11 = ___interopRequireWildcard_11(_$is_76);

var _base = ___interopRequireDefault_11(_$base_10);

function ___interopRequireDefault_11(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_11() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_11 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_11(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_11(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_11(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function beforeStart(_ref, scope) {
  var interaction = _ref.interaction,
      eventTarget = _ref.eventTarget,
      dx = _ref.dx,
      dy = _ref.dy;

  if (interaction.prepared.name !== 'drag') {
    return;
  } // check if a drag is in the correct axis


  var absX = Math.abs(dx);
  var absY = Math.abs(dy);
  var targetOptions = interaction.interactable.options.drag;
  var startAxis = targetOptions.startAxis;
  var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';
  interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
  : targetOptions.lockAxis; // if the movement isn't in the startAxis of the interactable

  if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
    // cancel the prepared action
    interaction.prepared.name = null; // then try to get a drag from another ineractable

    var element = eventTarget;

    var getDraggable = function getDraggable(interactable) {
      if (interactable === interaction.interactable) {
        return;
      }

      var options = interaction.interactable.options.drag;

      if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
        var action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);

        if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && _base["default"].validateAction(action, interactable, element, eventTarget, scope)) {
          return interactable;
        }
      }
    }; // check all interactables


    while (__is_11.element(element)) {
      var interactable = scope.interactables.forEachMatch(element, getDraggable);

      if (interactable) {
        interaction.prepared.name = 'drag';
        interaction.interactable = interactable;
        interaction.element = element;
        break;
      }

      element = (0, _$domUtils_70.parentNode)(element);
    }
  }
}

function checkStartAxis(startAxis, interactable) {
  if (!interactable) {
    return false;
  }

  var thisAxis = interactable.options.drag.startAxis;
  return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
}

var ___default_11 = {
  id: 'auto-start/dragAxis',
  listeners: {
    'autoStart:before-start': beforeStart
  }
};
_$dragAxis_11["default"] = ___default_11;

var _$hold_12 = {};
"use strict";

Object.defineProperty(_$hold_12, "__esModule", {
  value: true
});
_$hold_12["default"] = void 0;

var ___base_12 = ___interopRequireDefault_12(_$base_10);

function ___interopRequireDefault_12(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function __install_12(scope) {
  var defaults = scope.defaults;
  scope.usePlugin(___base_12["default"]);
  defaults.perAction.hold = 0;
  defaults.perAction.delay = 0;
}

function getHoldDuration(interaction) {
  var actionName = interaction.prepared && interaction.prepared.name;

  if (!actionName) {
    return null;
  }

  var options = interaction.interactable.options;
  return options[actionName].hold || options[actionName].delay;
}

var ___default_12 = {
  id: 'auto-start/hold',
  install: __install_12,
  listeners: {
    'interactions:new': function interactionsNew(_ref) {
      var interaction = _ref.interaction;
      interaction.autoStartHoldTimer = null;
    },
    'autoStart:prepared': function autoStartPrepared(_ref2) {
      var interaction = _ref2.interaction;
      var hold = getHoldDuration(interaction);

      if (hold > 0) {
        interaction.autoStartHoldTimer = setTimeout(function () {
          interaction.start(interaction.prepared, interaction.interactable, interaction.element);
        }, hold);
      }
    },
    'interactions:move': function interactionsMove(_ref3) {
      var interaction = _ref3.interaction,
          duplicate = _ref3.duplicate;

      if (interaction.pointerWasMoved && !duplicate) {
        clearTimeout(interaction.autoStartHoldTimer);
      }
    },
    // prevent regular down->move autoStart
    'autoStart:before-start': function autoStartBeforeStart(_ref4) {
      var interaction = _ref4.interaction;
      var hold = getHoldDuration(interaction);

      if (hold > 0) {
        interaction.prepared.name = null;
      }
    }
  },
  getHoldDuration: getHoldDuration
};
_$hold_12["default"] = ___default_12;

var _$index_13 = {};
"use strict";

Object.defineProperty(_$index_13, "__esModule", {
  value: true
});
Object.defineProperty(_$index_13, "autoStart", {
  enumerable: true,
  get: function get() {
    return ___base_13["default"];
  }
});
Object.defineProperty(_$index_13, "dragAxis", {
  enumerable: true,
  get: function get() {
    return _dragAxis["default"];
  }
});
Object.defineProperty(_$index_13, "hold", {
  enumerable: true,
  get: function get() {
    return _hold["default"];
  }
});
_$index_13["default"] = void 0;

var ___base_13 = ___interopRequireDefault_13(_$base_10);

var _dragAxis = ___interopRequireDefault_13(_$dragAxis_11);

var _hold = ___interopRequireDefault_13(_$hold_12);

function ___interopRequireDefault_13(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var ___default_13 = {
  id: 'auto-start',
  install: function install(scope) {
    scope.usePlugin(___base_13["default"]);
    scope.usePlugin(_hold["default"]);
    scope.usePlugin(_dragAxis["default"]);
  }
};
_$index_13["default"] = ___default_13;

var _$index_14 = {};
"use strict";

Object.defineProperty(_$index_14, "__esModule", {
  value: true
});
_$index_14["default"] = void 0;
var ___default_14 = {};
_$index_14["default"] = ___default_14;

var _$index_15 = {};
"use strict";

Object.defineProperty(_$index_15, "__esModule", {
  value: true
});
_$index_15["default"] = void 0;
var ___default_15 = {};
_$index_15["default"] = ___default_15;

var _$index_30 = {};
"use strict";

function ___typeof_30(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_30 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_30 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_30(obj); }

Object.defineProperty(_$index_30, "__esModule", {
  value: true
});
_$index_30["default"] = void 0;

var ___domObjects_30 = ___interopRequireDefault_30(_$domObjects_69);

/* removed: var _$domUtils_70 = require("@interactjs/utils/domUtils"); */;

var ___extend_30 = ___interopRequireDefault_30(_$extend_72);

var __is_30 = ___interopRequireWildcard_30(_$is_76);

var ___window_30 = ___interopRequireDefault_30(_$window_83);

function ___getRequireWildcardCache_30() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_30 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_30(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_30(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_30(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_30(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___toConsumableArray_30(arr) { return ___arrayWithoutHoles_30(arr) || ___iterableToArray_30(arr) || ___nonIterableSpread_30(); }

function ___nonIterableSpread_30() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function ___iterableToArray_30(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function ___arrayWithoutHoles_30(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var CheckName;

(function (CheckName) {
  CheckName["touchAction"] = "touchAction";
  CheckName["boxSizing"] = "boxSizing";
  CheckName["noListeners"] = "noListeners";
})(CheckName || (CheckName = {}));

var prefix = '[interact.js] ';
var links = {
  touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
  boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'
};
var isProduction = "production" === 'production'; // eslint-disable-next-line no-restricted-syntax

function __install_30(scope) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      logger = _ref.logger;

  var Interactable = scope.Interactable,
      defaults = scope.defaults;
  scope.logger = logger || console;
  defaults.base.devTools = {
    ignore: {}
  };

  Interactable.prototype.devTools = function (options) {
    if (options) {
      (0, ___extend_30["default"])(this.options.devTools, options);
      return this;
    }

    return this.options.devTools;
  };
}

var checks = [{
  name: CheckName.touchAction,
  perform: function perform(_ref2) {
    var element = _ref2.element;
    return !parentHasStyle(element, 'touchAction', /pan-|pinch|none/);
  },
  getInfo: function getInfo(_ref3) {
    var element = _ref3.element;
    return [element, links.touchAction];
  },
  text: 'Consider adding CSS "touch-action: none" to this element\n'
}, {
  name: CheckName.boxSizing,
  perform: function perform(interaction) {
    var element = interaction.element;
    return interaction.prepared.name === 'resize' && element instanceof ___domObjects_30["default"].HTMLElement && !hasStyle(element, 'boxSizing', /border-box/);
  },
  text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
  getInfo: function getInfo(_ref4) {
    var element = _ref4.element;
    return [element, links.boxSizing];
  }
}, {
  name: CheckName.noListeners,
  perform: function perform(interaction) {
    var actionName = interaction.prepared.name;
    var moveListeners = interaction.interactable.events.types["".concat(actionName, "move")] || [];
    return !moveListeners.length;
  },
  getInfo: function getInfo(interaction) {
    return [interaction.prepared.name, interaction.interactable];
  },
  text: 'There are no listeners set for this action'
}];

function hasStyle(element, prop, styleRe) {
  return styleRe.test(element.style[prop] || ___window_30["default"].window.getComputedStyle(element)[prop]);
}

function parentHasStyle(element, prop, styleRe) {
  var parent = element;

  while (__is_30.element(parent)) {
    if (hasStyle(parent, prop, styleRe)) {
      return true;
    }

    parent = (0, _$domUtils_70.parentNode)(parent);
  }

  return false;
}

var id = 'dev-tools';
var defaultExport = isProduction ? {
  id: id,
  install: function install() {}
} : {
  id: id,
  install: __install_30,
  listeners: {
    'interactions:action-start': function interactionsActionStart(_ref5, scope) {
      var interaction = _ref5.interaction;

      for (var _i = 0; _i < checks.length; _i++) {
        var _ref6;

        _ref6 = checks[_i];
        var check = _ref6;
        var options = interaction.interactable && interaction.interactable.options;

        if (!(options && options.devTools && options.devTools.ignore[check.name]) && check.perform(interaction)) {
          var _scope$logger;

          (_scope$logger = scope.logger).warn.apply(_scope$logger, [prefix + check.text].concat(___toConsumableArray_30(check.getInfo(interaction))));
        }
      }
    }
  },
  checks: checks,
  CheckName: CheckName,
  links: links,
  prefix: prefix
};
var ___default_30 = defaultExport;
_$index_30["default"] = ___default_30;

var _$index_31 = {};
"use strict";

Object.defineProperty(_$index_31, "__esModule", {
  value: true
});
_$index_31["default"] = void 0;
var ___default_31 = {};
_$index_31["default"] = ___default_31;

var _$Modification_35 = {};
"use strict";

function ___typeof_35(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_35 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_35 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_35(obj); }

Object.defineProperty(_$Modification_35, "__esModule", {
  value: true
});
_$Modification_35.getRectOffset = getRectOffset;
_$Modification_35["default"] = void 0;

var ___clone_35 = ___interopRequireDefault_35(_$clone_67);

var ___extend_35 = ___interopRequireDefault_35(_$extend_72);

var rectUtils = ___interopRequireWildcard_35(_$rect_82);

function ___getRequireWildcardCache_35() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_35 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_35(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_35(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_35(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_35(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___slicedToArray_35(arr, i) { return ___arrayWithHoles_35(arr) || ___iterableToArrayLimit_35(arr, i) || ___nonIterableRest_35(); }

function ___nonIterableRest_35() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function ___iterableToArrayLimit_35(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function ___arrayWithHoles_35(arr) { if (Array.isArray(arr)) return arr; }

function ___classCallCheck_35(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_35(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_35(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_35(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_35(Constructor, staticProps); return Constructor; }

function ___defineProperty_35(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Modification = /*#__PURE__*/function () {
  function Modification(interaction) {
    ___classCallCheck_35(this, Modification);

    this.interaction = interaction;

    ___defineProperty_35(this, "states", []);

    ___defineProperty_35(this, "startOffset", {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    });

    ___defineProperty_35(this, "startDelta", null);

    ___defineProperty_35(this, "result", null);

    ___defineProperty_35(this, "endResult", null);

    ___defineProperty_35(this, "edges", void 0);

    this.result = createResult();
  }

  ___createClass_35(Modification, [{
    key: "start",
    value: function start(_ref, pageCoords) {
      var phase = _ref.phase;
      var interaction = this.interaction;
      var modifierList = getModifierList(interaction);
      this.prepareStates(modifierList);
      this.edges = (0, ___extend_35["default"])({}, interaction.edges);
      this.startOffset = getRectOffset(interaction.rect, pageCoords);
      this.startDelta = {
        x: 0,
        y: 0
      };
      var arg = {
        phase: phase,
        pageCoords: pageCoords,
        preEnd: false
      };
      this.result = createResult();
      this.startAll(arg);
      var result = this.result = this.setAll(arg);
      return result;
    }
  }, {
    key: "fillArg",
    value: function fillArg(arg) {
      var interaction = this.interaction;
      arg.interaction = interaction;
      arg.interactable = interaction.interactable;
      arg.element = interaction.element;
      arg.rect = arg.rect || interaction.rect;
      arg.edges = this.edges;
      arg.startOffset = this.startOffset;
    }
  }, {
    key: "startAll",
    value: function startAll(arg) {
      this.fillArg(arg);

      for (var _i = 0; _i < this.states.length; _i++) {
        var _ref2;

        _ref2 = this.states[_i];
        var state = _ref2;

        if (state.methods.start) {
          arg.state = state;
          state.methods.start(arg);
        }
      }
    }
  }, {
    key: "setAll",
    value: function setAll(arg) {
      this.fillArg(arg);
      var phase = arg.phase,
          preEnd = arg.preEnd,
          skipModifiers = arg.skipModifiers,
          unmodifiedRect = arg.rect;
      arg.coords = (0, ___extend_35["default"])({}, arg.pageCoords);
      arg.rect = (0, ___extend_35["default"])({}, unmodifiedRect);
      var states = skipModifiers ? this.states.slice(skipModifiers) : this.states;
      var newResult = createResult(arg.coords, arg.rect);

      for (var _i2 = 0; _i2 < states.length; _i2++) {
        var _ref3;

        _ref3 = states[_i2];
        var state = _ref3;
        var options = state.options;
        var lastModifierCoords = (0, ___extend_35["default"])({}, arg.coords);
        var returnValue = null;

        if (state.methods.set && this.shouldDo(options, preEnd, phase)) {
          arg.state = state;
          returnValue = state.methods.set(arg);
          rectUtils.addEdges(this.interaction.edges, arg.rect, {
            x: arg.coords.x - lastModifierCoords.x,
            y: arg.coords.y - lastModifierCoords.y
          });
        }

        newResult.eventProps.push(returnValue);
      }

      newResult.delta.x = arg.coords.x - arg.pageCoords.x;
      newResult.delta.y = arg.coords.y - arg.pageCoords.y;
      newResult.rectDelta.left = arg.rect.left - unmodifiedRect.left;
      newResult.rectDelta.right = arg.rect.right - unmodifiedRect.right;
      newResult.rectDelta.top = arg.rect.top - unmodifiedRect.top;
      newResult.rectDelta.bottom = arg.rect.bottom - unmodifiedRect.bottom;
      var prevCoords = this.result.coords;
      var prevRect = this.result.rect;

      if (prevCoords && prevRect) {
        var rectChanged = newResult.rect.left !== prevRect.left || newResult.rect.right !== prevRect.right || newResult.rect.top !== prevRect.top || newResult.rect.bottom !== prevRect.bottom;
        newResult.changed = rectChanged || prevCoords.x !== newResult.coords.x || prevCoords.y !== newResult.coords.y;
      }

      return newResult;
    }
  }, {
    key: "applyToInteraction",
    value: function applyToInteraction(arg) {
      var interaction = this.interaction;
      var phase = arg.phase;
      var curCoords = interaction.coords.cur;
      var startCoords = interaction.coords.start;
      var result = this.result,
          startDelta = this.startDelta;
      var curDelta = result.delta;

      if (phase === 'start') {
        (0, ___extend_35["default"])(this.startDelta, result.delta);
      }

      for (var _i3 = 0; _i3 < [[startCoords, startDelta], [curCoords, curDelta]].length; _i3++) {
        var _ref4;

        _ref4 = [[startCoords, startDelta], [curCoords, curDelta]][_i3];

        var _ref5 = _ref4,
            _ref6 = ___slicedToArray_35(_ref5, 2),
            coordsSet = _ref6[0],
            delta = _ref6[1];

        coordsSet.page.x += delta.x;
        coordsSet.page.y += delta.y;
        coordsSet.client.x += delta.x;
        coordsSet.client.y += delta.y;
      }

      var rectDelta = this.result.rectDelta;
      var rect = arg.rect || interaction.rect;
      rect.left += rectDelta.left;
      rect.right += rectDelta.right;
      rect.top += rectDelta.top;
      rect.bottom += rectDelta.bottom;
      rect.width = rect.right - rect.left;
      rect.height = rect.bottom - rect.top;
    }
  }, {
    key: "setAndApply",
    value: function setAndApply(arg) {
      var interaction = this.interaction;
      var phase = arg.phase,
          preEnd = arg.preEnd,
          skipModifiers = arg.skipModifiers;
      var result = this.setAll({
        preEnd: preEnd,
        phase: phase,
        pageCoords: arg.modifiedCoords || interaction.coords.cur.page
      });
      this.result = result; // don't fire an action move if a modifier would keep the event in the same
      // cordinates as before

      if (!result.changed && (!skipModifiers || skipModifiers < this.states.length) && interaction.interacting()) {
        return false;
      }

      if (arg.modifiedCoords) {
        var page = interaction.coords.cur.page;
        var adjustment = {
          x: arg.modifiedCoords.x - page.x,
          y: arg.modifiedCoords.y - page.y
        };
        result.coords.x += adjustment.x;
        result.coords.y += adjustment.y;
        result.delta.x += adjustment.x;
        result.delta.y += adjustment.y;
      }

      this.applyToInteraction(arg);
    }
  }, {
    key: "beforeEnd",
    value: function beforeEnd(arg) {
      var interaction = arg.interaction,
          event = arg.event;
      var states = this.states;

      if (!states || !states.length) {
        return;
      }

      var doPreend = false;

      for (var _i4 = 0; _i4 < states.length; _i4++) {
        var _ref7;

        _ref7 = states[_i4];
        var state = _ref7;
        arg.state = state;
        var options = state.options,
            methods = state.methods;
        var endPosition = methods.beforeEnd && methods.beforeEnd(arg);

        if (endPosition) {
          this.endResult = endPosition;
          return false;
        }

        doPreend = doPreend || !doPreend && this.shouldDo(options, true, arg.phase, true);
      }

      if (doPreend) {
        // trigger a final modified move before ending
        interaction.move({
          event: event,
          preEnd: true
        });
      }
    }
  }, {
    key: "stop",
    value: function stop(arg) {
      var interaction = arg.interaction;

      if (!this.states || !this.states.length) {
        return;
      }

      var modifierArg = (0, ___extend_35["default"])({
        states: this.states,
        interactable: interaction.interactable,
        element: interaction.element,
        rect: null
      }, arg);
      this.fillArg(modifierArg);

      for (var _i5 = 0; _i5 < this.states.length; _i5++) {
        var _ref8;

        _ref8 = this.states[_i5];
        var state = _ref8;
        modifierArg.state = state;

        if (state.methods.stop) {
          state.methods.stop(modifierArg);
        }
      }

      this.states = null;
      this.endResult = null;
    }
  }, {
    key: "prepareStates",
    value: function prepareStates(modifierList) {
      this.states = [];

      for (var index = 0; index < modifierList.length; index++) {
        var _modifierList$index = modifierList[index],
            options = _modifierList$index.options,
            methods = _modifierList$index.methods,
            name = _modifierList$index.name;

        if (options && options.enabled === false) {
          continue;
        }

        this.states.push({
          options: options,
          methods: methods,
          index: index,
          name: name
        });
      }

      return this.states;
    }
  }, {
    key: "restoreInteractionCoords",
    value: function restoreInteractionCoords(_ref9) {
      var _ref9$interaction = _ref9.interaction,
          coords = _ref9$interaction.coords,
          rect = _ref9$interaction.rect,
          modification = _ref9$interaction.modification;

      if (!modification.result) {
        return;
      }

      var startDelta = modification.startDelta;
      var _modification$result = modification.result,
          curDelta = _modification$result.delta,
          rectDelta = _modification$result.rectDelta;
      var coordsAndDeltas = [[coords.start, startDelta], [coords.cur, curDelta]];

      for (var _i6 = 0; _i6 < coordsAndDeltas.length; _i6++) {
        var _ref10;

        _ref10 = coordsAndDeltas[_i6];

        var _ref11 = _ref10,
            _ref12 = ___slicedToArray_35(_ref11, 2),
            coordsSet = _ref12[0],
            delta = _ref12[1];

        coordsSet.page.x -= delta.x;
        coordsSet.page.y -= delta.y;
        coordsSet.client.x -= delta.x;
        coordsSet.client.y -= delta.y;
      }

      rect.left -= rectDelta.left;
      rect.right -= rectDelta.right;
      rect.top -= rectDelta.top;
      rect.bottom -= rectDelta.bottom;
    }
  }, {
    key: "shouldDo",
    value: function shouldDo(options, preEnd, phase, requireEndOnly) {
      if ( // ignore disabled modifiers
      !options || options.enabled === false || // check if we require endOnly option to fire move before end
      requireEndOnly && !options.endOnly || // don't apply endOnly modifiers when not ending
      options.endOnly && !preEnd || // check if modifier should run be applied on start
      phase === 'start' && !options.setStart) {
        return false;
      }

      return true;
    }
  }, {
    key: "copyFrom",
    value: function copyFrom(other) {
      this.startOffset = other.startOffset;
      this.startDelta = other.startDelta;
      this.edges = other.edges;
      this.states = other.states.map(function (s) {
        return (0, ___clone_35["default"])(s);
      });
      this.result = createResult((0, ___extend_35["default"])({}, other.result.coords), (0, ___extend_35["default"])({}, other.result.rect));
    }
  }, {
    key: "destroy",
    value: function destroy() {
      for (var prop in this) {
        this[prop] = null;
      }
    }
  }]);

  return Modification;
}();

_$Modification_35["default"] = Modification;

function createResult(coords, rect) {
  return {
    rect: rect,
    coords: coords,
    delta: {
      x: 0,
      y: 0
    },
    rectDelta: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },
    eventProps: [],
    changed: true
  };
}

function getModifierList(interaction) {
  var actionOptions = interaction.interactable.options[interaction.prepared.name];
  var actionModifiers = actionOptions.modifiers;

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers.filter(function (modifier) {
      return !modifier.options || modifier.options.enabled !== false;
    });
  }

  return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize'].map(function (type) {
    var options = actionOptions[type];
    return options && options.enabled && {
      options: options,
      methods: options._methods
    };
  }).filter(function (m) {
    return !!m;
  });
}

function getRectOffset(rect, coords) {
  return rect ? {
    left: coords.x - rect.left,
    top: coords.y - rect.top,
    right: rect.right - coords.x,
    bottom: rect.bottom - coords.y
  } : {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  };
}

var _$base_39 = {};
"use strict";

Object.defineProperty(_$base_39, "__esModule", {
  value: true
});
_$base_39.makeModifier = makeModifier;
_$base_39.addEventModifiers = addEventModifiers;
_$base_39["default"] = void 0;

var _Modification = ___interopRequireDefault_39(_$Modification_35);

function ___interopRequireDefault_39(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function makeModifier(module, name) {
  var defaults = module.defaults;
  var methods = {
    start: module.start,
    set: module.set,
    beforeEnd: module.beforeEnd,
    stop: module.stop
  };

  var modifier = function modifier(_options) {
    var options = _options || {};
    options.enabled = options.enabled !== false; // add missing defaults to options

    for (var _prop in defaults) {
      if (!(_prop in options)) {
        options[_prop] = defaults[_prop];
      }
    }

    var m = {
      options: options,
      methods: methods,
      name: name
    };
    return m;
  };

  if (name && typeof name === 'string') {
    // for backwrads compatibility
    modifier._defaults = defaults;
    modifier._methods = methods;
  }

  return modifier;
}

function addEventModifiers(_ref) {
  var iEvent = _ref.iEvent,
      result = _ref.interaction.modification.result;

  if (result) {
    iEvent.modifiers = result.eventProps;
  }
}

var modifiersBase = {
  id: 'modifiers/base',
  install: function install(scope) {
    scope.defaults.perAction.modifiers = [];
  },
  listeners: {
    'interactions:new': function interactionsNew(_ref2) {
      var interaction = _ref2.interaction;
      interaction.modification = new _Modification["default"](interaction);
    },
    'interactions:before-action-start': function interactionsBeforeActionStart(arg) {
      var modification = arg.interaction.modification;
      modification.start(arg, arg.interaction.coords.start.page);
      arg.interaction.edges = modification.edges;
      modification.applyToInteraction(arg);
    },
    'interactions:before-action-move': function interactionsBeforeActionMove(arg) {
      return arg.interaction.modification.setAndApply(arg);
    },
    'interactions:before-action-end': function interactionsBeforeActionEnd(arg) {
      return arg.interaction.modification.beforeEnd(arg);
    },
    'interactions:action-start': addEventModifiers,
    'interactions:action-move': addEventModifiers,
    'interactions:action-end': addEventModifiers,
    'interactions:after-action-start': function interactionsAfterActionStart(arg) {
      return arg.interaction.modification.restoreInteractionCoords(arg);
    },
    'interactions:after-action-move': function interactionsAfterActionMove(arg) {
      return arg.interaction.modification.restoreInteractionCoords(arg);
    },
    'interactions:stop': function interactionsStop(arg) {
      return arg.interaction.modification.stop(arg);
    }
  },
  before: ['actions', 'action/drag', 'actions/resize', 'actions/gesture']
};
var ___default_39 = modifiersBase;
_$base_39["default"] = ___default_39;

var _$index_52 = {};
"use strict";

function ___typeof_52(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_52 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_52 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_52(obj); }

Object.defineProperty(_$index_52, "__esModule", {
  value: true
});
_$index_52.addTotal = addTotal;
_$index_52.applyPending = applyPending;
_$index_52["default"] = void 0;

/* removed: var _$Interaction_22 = require("@interactjs/core/Interaction"); */;

var __rectUtils_52 = ___interopRequireWildcard_52(_$rect_82);

function ___getRequireWildcardCache_52() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_52 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_52(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_52(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_52(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

_$Interaction_22._ProxyMethods.offsetBy = '';

function addTotal(interaction) {
  if (!interaction.pointerIsDown) {
    return;
  }

  addToCoords(interaction.coords.cur, interaction.offset.total);
  interaction.offset.pending.x = 0;
  interaction.offset.pending.y = 0;
}

function beforeAction(_ref) {
  var interaction = _ref.interaction;
  applyPending(interaction);
}

function beforeEnd(_ref2) {
  var interaction = _ref2.interaction;
  var hadPending = applyPending(interaction);

  if (!hadPending) {
    return;
  }

  interaction.move({
    offset: true
  });
  interaction.end();
  return false;
}

function __end_52(_ref3) {
  var interaction = _ref3.interaction;
  interaction.offset.total.x = 0;
  interaction.offset.total.y = 0;
  interaction.offset.pending.x = 0;
  interaction.offset.pending.y = 0;
}

function applyPending(interaction) {
  if (!hasPending(interaction)) {
    return false;
  }

  var pending = interaction.offset.pending;
  addToCoords(interaction.coords.cur, pending);
  addToCoords(interaction.coords.delta, pending);
  __rectUtils_52.addEdges(interaction.edges, interaction.rect, pending);
  pending.x = 0;
  pending.y = 0;
  return true;
}

function offsetBy(_ref4) {
  var x = _ref4.x,
      y = _ref4.y;
  this.offset.pending.x += x;
  this.offset.pending.y += y;
  this.offset.total.x += x;
  this.offset.total.y += y;
}

function addToCoords(_ref5, _ref6) {
  var page = _ref5.page,
      client = _ref5.client;
  var x = _ref6.x,
      y = _ref6.y;
  page.x += x;
  page.y += y;
  client.x += x;
  client.y += y;
}

function hasPending(interaction) {
  return !!(interaction.offset.pending.x || interaction.offset.pending.y);
}

var offset = {
  id: 'offset',
  install: function install(scope) {
    scope.Interaction.prototype.offsetBy = offsetBy;
  },
  listeners: {
    'interactions:new': function interactionsNew(_ref7) {
      var interaction = _ref7.interaction;
      interaction.offset = {
        total: {
          x: 0,
          y: 0
        },
        pending: {
          x: 0,
          y: 0
        }
      };
    },
    'interactions:update-pointer': function interactionsUpdatePointer(_ref8) {
      var interaction = _ref8.interaction;
      return addTotal(interaction);
    },
    'interactions:before-action-start': beforeAction,
    'interactions:before-action-move': beforeAction,
    'interactions:before-action-end': beforeEnd,
    'interactions:stop': __end_52
  }
};
var ___default_52 = offset;
_$index_52["default"] = ___default_52;

var _$index_32 = {};
"use strict";

function ___typeof_32(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_32 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_32 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_32(obj); }

Object.defineProperty(_$index_32, "__esModule", {
  value: true
});
_$index_32["default"] = _$index_32.InertiaState = void 0;

var ___Modification_32 = ___interopRequireDefault_32(_$Modification_35);

var modifiers = ___interopRequireWildcard_32(_$base_39);

var ___index_32 = ___interopRequireDefault_32(_$index_52);

var __dom_32 = ___interopRequireWildcard_32(_$domUtils_70);

var ___hypot_32 = ___interopRequireDefault_32(_$hypot_74);

var __is_32 = ___interopRequireWildcard_32(_$is_76);

/* removed: var _$pointerUtils_80 = require("@interactjs/utils/pointerUtils"); */;

var ___raf_32 = ___interopRequireDefault_32(_$raf_81);

function ___getRequireWildcardCache_32() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_32 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_32(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_32(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_32(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_32(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___classCallCheck_32(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_32(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_32(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_32(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_32(Constructor, staticProps); return Constructor; }

function ___defineProperty_32(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function __install_32(scope) {
  var defaults = scope.defaults;
  scope.usePlugin(___index_32["default"]);
  scope.usePlugin(modifiers["default"]);
  scope.actions.phases.inertiastart = true;
  scope.actions.phases.resume = true;
  defaults.perAction.inertia = {
    enabled: false,
    resistance: 10,
    // the lambda in exponential decay
    minSpeed: 100,
    // target speed must be above this for inertia to start
    endSpeed: 10,
    // the speed at which inertia is slow enough to stop
    allowResume: true,
    // allow resuming an action in inertia phase
    smoothEndDuration: 300 // animate to snap/restrict endOnly if there's no inertia

  };
}

var InertiaState = /*#__PURE__*/function () {
  // eslint-disable-line camelcase
  // eslint-disable-line camelcase
  function InertiaState(interaction) {
    ___classCallCheck_32(this, InertiaState);

    this.interaction = interaction;

    ___defineProperty_32(this, "active", false);

    ___defineProperty_32(this, "isModified", false);

    ___defineProperty_32(this, "smoothEnd", false);

    ___defineProperty_32(this, "allowResume", false);

    ___defineProperty_32(this, "modification", null);

    ___defineProperty_32(this, "modifierCount", 0);

    ___defineProperty_32(this, "modifierArg", null);

    ___defineProperty_32(this, "startCoords", null);

    ___defineProperty_32(this, "t0", 0);

    ___defineProperty_32(this, "v0", 0);

    ___defineProperty_32(this, "te", 0);

    ___defineProperty_32(this, "targetOffset", null);

    ___defineProperty_32(this, "modifiedOffset", null);

    ___defineProperty_32(this, "currentOffset", null);

    ___defineProperty_32(this, "lambda_v0", 0);

    ___defineProperty_32(this, "one_ve_v0", 0);

    ___defineProperty_32(this, "timeout", null);
  }

  ___createClass_32(InertiaState, [{
    key: "start",
    value: function start(event) {
      var interaction = this.interaction;
      var options = __getOptions_32(interaction);

      if (!options || !options.enabled) {
        return false;
      }

      var velocityClient = interaction.coords.velocity.client;
      var pointerSpeed = (0, ___hypot_32["default"])(velocityClient.x, velocityClient.y);
      var modification = this.modification || (this.modification = new ___Modification_32["default"](interaction));
      modification.copyFrom(interaction.modification);
      this.t0 = interaction._now();
      this.allowResume = options.allowResume;
      this.v0 = pointerSpeed;
      this.currentOffset = {
        x: 0,
        y: 0
      };
      this.startCoords = interaction.coords.cur.page;
      this.modifierArg = {
        interaction: interaction,
        interactable: interaction.interactable,
        element: interaction.element,
        rect: interaction.rect,
        edges: interaction.edges,
        pageCoords: this.startCoords,
        preEnd: true,
        phase: 'inertiastart'
      };
      var thrown = this.t0 - interaction.coords.cur.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;

      if (thrown) {
        this.startInertia();
      } else {
        modification.result = modification.setAll(this.modifierArg);

        if (!modification.result.changed) {
          return false;
        }

        this.startSmoothEnd();
      } // force modification change


      interaction.modification.result.rect = null; // bring inertiastart event to the target coords

      interaction.offsetBy(this.targetOffset);

      interaction._doPhase({
        interaction: interaction,
        event: event,
        phase: 'inertiastart'
      });

      interaction.offsetBy({
        x: -this.targetOffset.x,
        y: -this.targetOffset.y
      }); // force modification change

      interaction.modification.result.rect = null;
      this.active = true;
      interaction.simulation = this;
      return true;
    }
  }, {
    key: "startInertia",
    value: function startInertia() {
      var _this = this;

      var startVelocity = this.interaction.coords.velocity.client;
      var options = __getOptions_32(this.interaction);
      var lambda = options.resistance;
      var inertiaDur = -Math.log(options.endSpeed / this.v0) / lambda;
      this.targetOffset = {
        x: (startVelocity.x - inertiaDur) / lambda,
        y: (startVelocity.y - inertiaDur) / lambda
      };
      this.te = inertiaDur;
      this.lambda_v0 = lambda / this.v0;
      this.one_ve_v0 = 1 - options.endSpeed / this.v0;
      var modification = this.modification,
          modifierArg = this.modifierArg;
      modifierArg.pageCoords = {
        x: this.startCoords.x + this.targetOffset.x,
        y: this.startCoords.y + this.targetOffset.y
      };
      modification.result = modification.setAll(modifierArg);

      if (modification.result.changed) {
        this.isModified = true;
        this.modifiedOffset = {
          x: this.targetOffset.x + modification.result.delta.x,
          y: this.targetOffset.y + modification.result.delta.y
        };
      }

      this.timeout = ___raf_32["default"].request(function () {
        return _this.inertiaTick();
      });
    }
  }, {
    key: "startSmoothEnd",
    value: function startSmoothEnd() {
      var _this2 = this;

      this.smoothEnd = true;
      this.isModified = true;
      this.targetOffset = {
        x: this.modification.result.delta.x,
        y: this.modification.result.delta.y
      };
      this.timeout = ___raf_32["default"].request(function () {
        return _this2.smoothEndTick();
      });
    }
  }, {
    key: "inertiaTick",
    value: function inertiaTick() {
      var _this3 = this;

      var interaction = this.interaction;
      var options = __getOptions_32(interaction);
      var lambda = options.resistance;
      var t = (interaction._now() - this.t0) / 1000;

      if (t < this.te) {
        var progress = 1 - (Math.exp(-lambda * t) - this.lambda_v0) / this.one_ve_v0;
        var newOffset;

        if (this.isModified) {
          newOffset = getQuadraticCurvePoint(0, 0, this.targetOffset.x, this.targetOffset.y, this.modifiedOffset.x, this.modifiedOffset.y, progress);
        } else {
          newOffset = {
            x: this.targetOffset.x * progress,
            y: this.targetOffset.y * progress
          };
        }

        var delta = {
          x: newOffset.x - this.currentOffset.x,
          y: newOffset.y - this.currentOffset.y
        };
        this.currentOffset.x += delta.x;
        this.currentOffset.y += delta.y;
        interaction.offsetBy(delta);
        interaction.move();
        this.timeout = ___raf_32["default"].request(function () {
          return _this3.inertiaTick();
        });
      } else {
        interaction.offsetBy({
          x: this.modifiedOffset.x - this.currentOffset.x,
          y: this.modifiedOffset.y - this.currentOffset.y
        });
        this.end();
      }
    }
  }, {
    key: "smoothEndTick",
    value: function smoothEndTick() {
      var _this4 = this;

      var interaction = this.interaction;
      var t = interaction._now() - this.t0;

      var _getOptions = __getOptions_32(interaction),
          duration = _getOptions.smoothEndDuration;

      if (t < duration) {
        var newOffset = {
          x: easeOutQuad(t, 0, this.targetOffset.x, duration),
          y: easeOutQuad(t, 0, this.targetOffset.y, duration)
        };
        var delta = {
          x: newOffset.x - this.currentOffset.x,
          y: newOffset.y - this.currentOffset.y
        };
        this.currentOffset.x += delta.x;
        this.currentOffset.y += delta.y;
        interaction.offsetBy(delta);
        interaction.move({
          skipModifiers: this.modifierCount
        });
        this.timeout = ___raf_32["default"].request(function () {
          return _this4.smoothEndTick();
        });
      } else {
        interaction.offsetBy({
          x: this.targetOffset.x - this.currentOffset.x,
          y: this.targetOffset.y - this.currentOffset.y
        });
        this.end();
      }
    }
  }, {
    key: "resume",
    value: function resume(_ref) {
      var pointer = _ref.pointer,
          event = _ref.event,
          eventTarget = _ref.eventTarget;
      var interaction = this.interaction; // undo inertia changes to interaction coords

      interaction.offsetBy({
        x: -this.currentOffset.x,
        y: -this.currentOffset.y
      }); // update pointer at pointer down position

      interaction.updatePointer(pointer, event, eventTarget, true); // fire resume signals and event

      interaction._doPhase({
        interaction: interaction,
        event: event,
        phase: 'resume'
      });

      (0, _$pointerUtils_80.copyCoords)(interaction.coords.prev, interaction.coords.cur);
      this.stop();
    }
  }, {
    key: "end",
    value: function end() {
      this.interaction.move();
      this.interaction.end();
      this.stop();
    }
  }, {
    key: "stop",
    value: function stop() {
      this.active = this.smoothEnd = false;
      this.interaction.simulation = null;

      ___raf_32["default"].cancel(this.timeout);
    }
  }]);

  return InertiaState;
}();

_$index_32.InertiaState = InertiaState;

function __start_32(_ref2) {
  var interaction = _ref2.interaction,
      event = _ref2.event;

  if (!interaction._interacting || interaction.simulation) {
    return null;
  }

  var started = interaction.inertia.start(event); // prevent action end if inertia or smoothEnd

  return started ? false : null;
} // Check if the down event hits the current inertia target
// control should be return to the user


function resume(arg) {
  var interaction = arg.interaction,
      eventTarget = arg.eventTarget;
  var state = interaction.inertia;

  if (!state.active) {
    return;
  }

  var element = eventTarget; // climb up the DOM tree from the event target

  while (__is_32.element(element)) {
    // if interaction element is the current inertia target element
    if (element === interaction.element) {
      state.resume(arg);
      break;
    }

    element = __dom_32.parentNode(element);
  }
}

function stop(_ref3) {
  var interaction = _ref3.interaction;
  var state = interaction.inertia;

  if (state.active) {
    state.stop();
  }
}

function __getOptions_32(_ref4) {
  var interactable = _ref4.interactable,
      prepared = _ref4.prepared;
  return interactable && interactable.options && prepared.name && interactable.options[prepared.name].inertia;
}

var inertia = {
  id: 'inertia',
  before: ['modifiers/base'],
  install: __install_32,
  listeners: {
    'interactions:new': function interactionsNew(_ref5) {
      var interaction = _ref5.interaction;
      interaction.inertia = new InertiaState(interaction);
    },
    'interactions:before-action-end': __start_32,
    'interactions:down': resume,
    'interactions:stop': stop,
    'interactions:before-action-resume': function interactionsBeforeActionResume(arg) {
      var modification = arg.interaction.modification;
      modification.stop(arg);
      modification.start(arg, arg.interaction.coords.cur.page);
      modification.applyToInteraction(arg);
    },
    'interactions:before-action-inertiastart': function interactionsBeforeActionInertiastart(arg) {
      return arg.interaction.modification.setAndApply(arg);
    },
    'interactions:action-resume': modifiers.addEventModifiers,
    'interactions:action-inertiastart': modifiers.addEventModifiers,
    'interactions:after-action-inertiastart': function interactionsAfterActionInertiastart(arg) {
      return arg.interaction.modification.restoreInteractionCoords(arg);
    },
    'interactions:after-action-resume': function interactionsAfterActionResume(arg) {
      return arg.interaction.modification.restoreInteractionCoords(arg);
    }
  }
}; // http://stackoverflow.com/a/5634528/2280888

function _getQBezierValue(t, p1, p2, p3) {
  var iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}

function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
  return {
    x: _getQBezierValue(position, startX, cpX, endX),
    y: _getQBezierValue(position, startY, cpY, endY)
  };
} // http://gizma.com/easing/


function easeOutQuad(t, b, c, d) {
  t /= d;
  return -c * t * (t - 2) + b;
}

var ___default_32 = inertia;
_$index_32["default"] = ___default_32;

var _$index_33 = {};
"use strict";

Object.defineProperty(_$index_33, "__esModule", {
  value: true
});
_$index_33.init = _$index_33["default"] = void 0;

_$index_64;

var ___scope_33 = ___interopRequireDefault_33(_$scope_29({}));

function ___interopRequireDefault_33(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___typeof_33(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_33 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_33 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_33(obj); }

var scope = new ___scope_33["default"]();
var interact = scope.interactStatic;
var ___default_33 = interact;
_$index_33["default"] = ___default_33;

var __init_33 = function init(win) {
  return scope.init(win);
};

_$index_33.init = __init_33;

if ((typeof window === "undefined" ? "undefined" : ___typeof_33(window)) === 'object' && !!window) {
  __init_33(window);
}

var _$edgeTarget_60 = {};
"use strict";

Object.defineProperty(_$edgeTarget_60, "__esModule", {
  value: true
});
_$edgeTarget_60["default"] = void 0;
var ___default_60 = {};
_$edgeTarget_60["default"] = ___default_60;

var _$elements_61 = {};
"use strict";

Object.defineProperty(_$elements_61, "__esModule", {
  value: true
});
_$elements_61["default"] = void 0;
var ___default_61 = {};
_$elements_61["default"] = ___default_61;

var _$grid_62 = {};
"use strict";

Object.defineProperty(_$grid_62, "__esModule", {
  value: true
});
_$grid_62["default"] = void 0;

function ___slicedToArray_62(arr, i) { return ___arrayWithHoles_62(arr) || ___iterableToArrayLimit_62(arr, i) || ___nonIterableRest_62(); }

function ___nonIterableRest_62() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function ___iterableToArrayLimit_62(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function ___arrayWithHoles_62(arr) { if (Array.isArray(arr)) return arr; }

var ___default_62 = function _default(grid) {
  var coordFields = [['x', 'y'], ['left', 'top'], ['right', 'bottom'], ['width', 'height']].filter(function (_ref) {
    var _ref2 = ___slicedToArray_62(_ref, 2),
        xField = _ref2[0],
        yField = _ref2[1];

    return xField in grid || yField in grid;
  });

  var gridFunc = function gridFunc(x, y) {
    var range = grid.range,
        _grid$limits = grid.limits,
        limits = _grid$limits === void 0 ? {
      left: -Infinity,
      right: Infinity,
      top: -Infinity,
      bottom: Infinity
    } : _grid$limits,
        _grid$offset = grid.offset,
        offset = _grid$offset === void 0 ? {
      x: 0,
      y: 0
    } : _grid$offset;
    var result = {
      range: range,
      grid: grid,
      x: null,
      y: null
    };

    for (var _i2 = 0; _i2 < coordFields.length; _i2++) {
      var _ref3;

      _ref3 = coordFields[_i2];

      var _ref4 = _ref3,
          _ref5 = ___slicedToArray_62(_ref4, 2),
          xField = _ref5[0],
          yField = _ref5[1];

      var gridx = Math.round((x - offset.x) / grid[xField]);
      var gridy = Math.round((y - offset.y) / grid[yField]);
      result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * grid[xField] + offset.x));
      result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * grid[yField] + offset.y));
    }

    return result;
  };

  gridFunc.grid = grid;
  gridFunc.coordFields = coordFields;
  return gridFunc;
};

_$grid_62["default"] = ___default_62;

var _$all_59 = {};
"use strict";

Object.defineProperty(_$all_59, "__esModule", {
  value: true
});
Object.defineProperty(_$all_59, "edgeTarget", {
  enumerable: true,
  get: function get() {
    return _edgeTarget["default"];
  }
});
Object.defineProperty(_$all_59, "elements", {
  enumerable: true,
  get: function get() {
    return _elements["default"];
  }
});
Object.defineProperty(_$all_59, "grid", {
  enumerable: true,
  get: function get() {
    return _grid["default"];
  }
});

var _edgeTarget = ___interopRequireDefault_59(_$edgeTarget_60);

var _elements = ___interopRequireDefault_59(_$elements_61);

var _grid = ___interopRequireDefault_59(_$grid_62);

function ___interopRequireDefault_59(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _$index_63 = {};
"use strict";

function ___typeof_63(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_63 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_63 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_63(obj); }

Object.defineProperty(_$index_63, "__esModule", {
  value: true
});
_$index_63["default"] = void 0;

var ___extend_63 = ___interopRequireDefault_63(_$extend_72);

var allSnappers = ___interopRequireWildcard_63(_$all_59);

function ___getRequireWildcardCache_63() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_63 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_63(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_63(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_63(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_63(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var snappersPlugin = {
  id: 'snappers',
  install: function install(scope) {
    var interact = scope.interactStatic;
    interact.snappers = (0, ___extend_63["default"])(interact.snappers || {}, allSnappers);
    interact.createSnapGrid = interact.snappers.grid;
  }
};
var ___default_63 = snappersPlugin;
_$index_63["default"] = ___default_63;

var _$aspectRatio_37 = {};
"use strict";

Object.defineProperty(_$aspectRatio_37, "__esModule", {
  value: true
});
_$aspectRatio_37.aspectRatio = _$aspectRatio_37["default"] = void 0;

var ___extend_37 = ___interopRequireDefault_37(_$extend_72);

/* removed: var _$rect_82 = require("@interactjs/utils/rect"); */;

var ___Modification_37 = ___interopRequireDefault_37(_$Modification_35);

/* removed: var _$base_39 = require("./base"); */;

function ___interopRequireDefault_37(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { ___defineProperty_37(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function ___defineProperty_37(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var aspectRatio = {
  start: function start(arg) {
    var state = arg.state,
        rect = arg.rect,
        originalEdges = arg.edges,
        coords = arg.pageCoords;
    var ratio = state.options.ratio;
    var _state$options = state.options,
        equalDelta = _state$options.equalDelta,
        modifiers = _state$options.modifiers;

    if (ratio === 'preserve') {
      ratio = rect.width / rect.height;
    }

    state.startCoords = (0, ___extend_37["default"])({}, coords);
    state.startRect = (0, ___extend_37["default"])({}, rect);
    state.ratio = ratio;
    state.equalDelta = equalDelta;
    var linkedEdges = state.linkedEdges = {
      top: originalEdges.top || originalEdges.left && !originalEdges.bottom,
      left: originalEdges.left || originalEdges.top && !originalEdges.right,
      bottom: originalEdges.bottom || originalEdges.right && !originalEdges.top,
      right: originalEdges.right || originalEdges.bottom && !originalEdges.left
    };
    state.xIsPrimaryAxis = !!(originalEdges.left || originalEdges.right);

    if (state.equalDelta) {
      state.edgeSign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1);
    } else {
      var negativeSecondaryEdge = state.xIsPrimaryAxis ? linkedEdges.top : linkedEdges.left;
      state.edgeSign = negativeSecondaryEdge ? -1 : 1;
    }

    (0, ___extend_37["default"])(arg.edges, linkedEdges);

    if (!modifiers || !modifiers.length) {
      return;
    }

    var subModification = new ___Modification_37["default"](arg.interaction);
    subModification.copyFrom(arg.interaction.modification);
    subModification.prepareStates(modifiers);
    state.subModification = subModification;
    subModification.startAll(_objectSpread({}, arg));
  },
  set: function set(arg) {
    var state = arg.state,
        rect = arg.rect,
        coords = arg.coords;
    var initialCoords = (0, ___extend_37["default"])({}, coords);
    var aspectMethod = state.equalDelta ? setEqualDelta : setRatio;
    aspectMethod(state, state.xIsPrimaryAxis, coords, rect);

    if (!state.subModification) {
      return null;
    }

    var correctedRect = (0, ___extend_37["default"])({}, rect);
    (0, _$rect_82.addEdges)(state.linkedEdges, correctedRect, {
      x: coords.x - initialCoords.x,
      y: coords.y - initialCoords.y
    });
    var result = state.subModification.setAll(_objectSpread({}, arg, {
      rect: correctedRect,
      edges: state.linkedEdges,
      pageCoords: coords,
      prevCoords: coords,
      prevRect: correctedRect
    }));
    var delta = result.delta;

    if (result.changed) {
      var xIsCriticalAxis = Math.abs(delta.x) > Math.abs(delta.y); // do aspect modification again with critical edge axis as primary

      aspectMethod(state, xIsCriticalAxis, result.coords, result.rect);
      (0, ___extend_37["default"])(coords, result.coords);
    }

    return result.eventProps;
  },
  defaults: {
    ratio: 'preserve',
    equalDelta: false,
    modifiers: [],
    enabled: false
  }
};
_$aspectRatio_37.aspectRatio = aspectRatio;

function setEqualDelta(_ref, xIsPrimaryAxis, coords) {
  var startCoords = _ref.startCoords,
      edgeSign = _ref.edgeSign;

  if (xIsPrimaryAxis) {
    coords.y = startCoords.y + (coords.x - startCoords.x) * edgeSign;
  } else {
    coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign;
  }
}

function setRatio(_ref2, xIsPrimaryAxis, coords, rect) {
  var startRect = _ref2.startRect,
      startCoords = _ref2.startCoords,
      ratio = _ref2.ratio,
      edgeSign = _ref2.edgeSign;

  if (xIsPrimaryAxis) {
    var newHeight = rect.width / ratio;
    coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign;
  } else {
    var newWidth = rect.height * ratio;
    coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign;
  }
}

var ___default_37 = (0, _$base_39.makeModifier)(aspectRatio, 'aspectRatio');

_$aspectRatio_37["default"] = ___default_37;

var _$avoid_38 = {};
"use strict";

Object.defineProperty(_$avoid_38, "__esModule", {
  value: true
});
_$avoid_38["default"] = void 0;

var avoid = function avoid() {};

avoid._defaults = {};
var ___default_38 = avoid;
_$avoid_38["default"] = ___default_38;

var _$pointer_42 = {};
"use strict";

function ___typeof_42(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_42 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_42 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_42(obj); }

Object.defineProperty(_$pointer_42, "__esModule", {
  value: true
});
_$pointer_42.getRestrictionRect = getRestrictionRect;
_$pointer_42.restrict = _$pointer_42["default"] = void 0;

var ___extend_42 = ___interopRequireDefault_42(_$extend_72);

var __is_42 = ___interopRequireWildcard_42(_$is_76);

var __rectUtils_42 = ___interopRequireWildcard_42(_$rect_82);

/* removed: var _$base_39 = require("../base"); */;

function ___getRequireWildcardCache_42() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_42 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_42(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_42(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_42(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_42(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function __start_42(_ref) {
  var rect = _ref.rect,
      startOffset = _ref.startOffset,
      state = _ref.state,
      interaction = _ref.interaction,
      pageCoords = _ref.pageCoords;
  var options = state.options;
  var elementRect = options.elementRect;
  var offset = (0, ___extend_42["default"])({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  }, options.offset || {});

  if (rect && elementRect) {
    var restriction = getRestrictionRect(options.restriction, interaction, pageCoords);

    if (restriction) {
      var widthDiff = restriction.right - restriction.left - rect.width;
      var heightDiff = restriction.bottom - restriction.top - rect.height;

      if (widthDiff < 0) {
        offset.left += widthDiff;
        offset.right += widthDiff;
      }

      if (heightDiff < 0) {
        offset.top += heightDiff;
        offset.bottom += heightDiff;
      }
    }

    offset.left += startOffset.left - rect.width * elementRect.left;
    offset.top += startOffset.top - rect.height * elementRect.top;
    offset.right += startOffset.right - rect.width * (1 - elementRect.right);
    offset.bottom += startOffset.bottom - rect.height * (1 - elementRect.bottom);
  }

  state.offset = offset;
}

function set(_ref2) {
  var coords = _ref2.coords,
      interaction = _ref2.interaction,
      state = _ref2.state;
  var options = state.options,
      offset = state.offset;
  var restriction = getRestrictionRect(options.restriction, interaction, coords);

  if (!restriction) {
    return;
  }

  var rect = __rectUtils_42.xywhToTlbr(restriction);
  coords.x = Math.max(Math.min(rect.right - offset.right, coords.x), rect.left + offset.left);
  coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top + offset.top);
}

function getRestrictionRect(value, interaction, coords) {
  if (__is_42.func(value)) {
    return __rectUtils_42.resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction]);
  } else {
    return __rectUtils_42.resolveRectLike(value, interaction.interactable, interaction.element);
  }
}

var __defaults_42 = {
  restriction: null,
  elementRect: null,
  offset: null,
  endOnly: false,
  enabled: false
};
var restrict = {
  start: __start_42,
  set: set,
  defaults: __defaults_42
};
_$pointer_42.restrict = restrict;

var ___default_42 = (0, _$base_39.makeModifier)(restrict, 'restrict');

_$pointer_42["default"] = ___default_42;

var _$edges_41 = {};
"use strict";

function ___typeof_41(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_41 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_41 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_41(obj); }

Object.defineProperty(_$edges_41, "__esModule", {
  value: true
});
_$edges_41.restrictEdges = _$edges_41["default"] = void 0;

var ___extend_41 = ___interopRequireDefault_41(_$extend_72);

var __rectUtils_41 = ___interopRequireWildcard_41(_$rect_82);

/* removed: var _$base_39 = require("../base"); */;

/* removed: var _$pointer_42 = require("./pointer"); */;

function ___getRequireWildcardCache_41() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_41 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_41(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_41(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_41(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_41(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// })
var noInner = {
  top: +Infinity,
  left: +Infinity,
  bottom: -Infinity,
  right: -Infinity
};
var noOuter = {
  top: -Infinity,
  left: -Infinity,
  bottom: +Infinity,
  right: +Infinity
};

function __start_41(_ref) {
  var interaction = _ref.interaction,
      startOffset = _ref.startOffset,
      state = _ref.state;
  var options = state.options;
  var offset;

  if (options) {
    var offsetRect = (0, _$pointer_42.getRestrictionRect)(options.offset, interaction, interaction.coords.start.page);
    offset = __rectUtils_41.rectToXY(offsetRect);
  }

  offset = offset || {
    x: 0,
    y: 0
  };
  state.offset = {
    top: offset.y + startOffset.top,
    left: offset.x + startOffset.left,
    bottom: offset.y - startOffset.bottom,
    right: offset.x - startOffset.right
  };
}

function __set_41(_ref2) {
  var coords = _ref2.coords,
      edges = _ref2.edges,
      interaction = _ref2.interaction,
      state = _ref2.state;
  var offset = state.offset,
      options = state.options;

  if (!edges) {
    return;
  }

  var page = (0, ___extend_41["default"])({}, coords);
  var inner = (0, _$pointer_42.getRestrictionRect)(options.inner, interaction, page) || {};
  var outer = (0, _$pointer_42.getRestrictionRect)(options.outer, interaction, page) || {};
  fixRect(inner, noInner);
  fixRect(outer, noOuter);

  if (edges.top) {
    coords.y = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
  } else if (edges.bottom) {
    coords.y = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
  }

  if (edges.left) {
    coords.x = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
  } else if (edges.right) {
    coords.x = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
  }
}

function fixRect(rect, defaults) {
  var _arr = ['top', 'left', 'bottom', 'right'];

  for (var _i = 0; _i < _arr.length; _i++) {
    var edge = _arr[_i];

    if (!(edge in rect)) {
      rect[edge] = defaults[edge];
    }
  }

  return rect;
}

var __defaults_41 = {
  inner: null,
  outer: null,
  offset: null,
  endOnly: false,
  enabled: false
};
var restrictEdges = {
  noInner: noInner,
  noOuter: noOuter,
  start: __start_41,
  set: __set_41,
  defaults: __defaults_41
};
_$edges_41.restrictEdges = restrictEdges;

var ___default_41 = (0, _$base_39.makeModifier)(restrictEdges, 'restrictEdges');

_$edges_41["default"] = ___default_41;

var _$rect_43 = {};
"use strict";

Object.defineProperty(_$rect_43, "__esModule", {
  value: true
});
_$rect_43.restrictRect = _$rect_43["default"] = void 0;

var ___extend_43 = ___interopRequireDefault_43(_$extend_72);

/* removed: var _$base_39 = require("../base"); */;

/* removed: var _$pointer_42 = require("./pointer"); */;

function ___interopRequireDefault_43(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var __defaults_43 = (0, ___extend_43["default"])({
  get elementRect() {
    return {
      top: 0,
      left: 0,
      bottom: 1,
      right: 1
    };
  },

  set elementRect(_) {}

}, _$pointer_42.restrict.defaults);
var restrictRect = {
  start: _$pointer_42.restrict.start,
  set: _$pointer_42.restrict.set,
  defaults: __defaults_43
};
_$rect_43.restrictRect = restrictRect;

var ___default_43 = (0, _$base_39.makeModifier)(restrictRect, 'restrictRect');

_$rect_43["default"] = ___default_43;

var _$size_44 = {};
"use strict";

function ___typeof_44(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_44 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_44 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_44(obj); }

Object.defineProperty(_$size_44, "__esModule", {
  value: true
});
_$size_44.restrictSize = _$size_44["default"] = void 0;

var ___extend_44 = ___interopRequireDefault_44(_$extend_72);

var __rectUtils_44 = ___interopRequireWildcard_44(_$rect_82);

/* removed: var _$base_39 = require("../base"); */;

/* removed: var _$edges_41 = require("./edges"); */;

/* removed: var _$pointer_42 = require("./pointer"); */;

function ___getRequireWildcardCache_44() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_44 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_44(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_44(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_44(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_44(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var noMin = {
  width: -Infinity,
  height: -Infinity
};
var noMax = {
  width: +Infinity,
  height: +Infinity
};

function __start_44(arg) {
  return _$edges_41.restrictEdges.start(arg);
}

function __set_44(arg) {
  var interaction = arg.interaction,
      state = arg.state,
      rect = arg.rect,
      edges = arg.edges;
  var options = state.options;

  if (!edges) {
    return;
  }

  var minSize = __rectUtils_44.tlbrToXywh((0, _$pointer_42.getRestrictionRect)(options.min, interaction, arg.coords)) || noMin;
  var maxSize = __rectUtils_44.tlbrToXywh((0, _$pointer_42.getRestrictionRect)(options.max, interaction, arg.coords)) || noMax;
  state.options = {
    endOnly: options.endOnly,
    inner: (0, ___extend_44["default"])({}, _$edges_41.restrictEdges.noInner),
    outer: (0, ___extend_44["default"])({}, _$edges_41.restrictEdges.noOuter)
  };

  if (edges.top) {
    state.options.inner.top = rect.bottom - minSize.height;
    state.options.outer.top = rect.bottom - maxSize.height;
  } else if (edges.bottom) {
    state.options.inner.bottom = rect.top + minSize.height;
    state.options.outer.bottom = rect.top + maxSize.height;
  }

  if (edges.left) {
    state.options.inner.left = rect.right - minSize.width;
    state.options.outer.left = rect.right - maxSize.width;
  } else if (edges.right) {
    state.options.inner.right = rect.left + minSize.width;
    state.options.outer.right = rect.left + maxSize.width;
  }

  _$edges_41.restrictEdges.set(arg);

  state.options = options;
}

var __defaults_44 = {
  min: null,
  max: null,
  endOnly: false,
  enabled: false
};
var restrictSize = {
  start: __start_44,
  set: __set_44,
  defaults: __defaults_44
};
_$size_44.restrictSize = restrictSize;

var ___default_44 = (0, _$base_39.makeModifier)(restrictSize, 'restrictSize');

_$size_44["default"] = ___default_44;

var _$rubberband_45 = {};
"use strict";

Object.defineProperty(_$rubberband_45, "__esModule", {
  value: true
});
_$rubberband_45["default"] = void 0;

var rubberband = function rubberband() {};

rubberband._defaults = {};
var ___default_45 = rubberband;
_$rubberband_45["default"] = ___default_45;

var _$pointer_47 = {};
"use strict";

function ___typeof_47(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_47 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_47 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_47(obj); }

Object.defineProperty(_$pointer_47, "__esModule", {
  value: true
});
_$pointer_47.snap = _$pointer_47["default"] = void 0;

var __utils_47 = ___interopRequireWildcard_47(_$index_75);

/* removed: var _$base_39 = require("../base"); */;

function ___getRequireWildcardCache_47() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_47 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_47(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_47(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_47(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function __start_47(arg) {
  var interaction = arg.interaction,
      interactable = arg.interactable,
      element = arg.element,
      rect = arg.rect,
      state = arg.state,
      startOffset = arg.startOffset;
  var options = state.options;
  var origin = options.offsetWithOrigin ? getOrigin(arg) : {
    x: 0,
    y: 0
  };
  var snapOffset;

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x,
      y: interaction.coords.start.page.y
    };
  } else {
    var offsetRect = __utils_47.rect.resolveRectLike(options.offset, interactable, element, [interaction]);
    snapOffset = __utils_47.rect.rectToXY(offsetRect) || {
      x: 0,
      y: 0
    };
    snapOffset.x += origin.x;
    snapOffset.y += origin.y;
  }

  var relativePoints = options.relativePoints;
  state.offsets = rect && relativePoints && relativePoints.length ? relativePoints.map(function (relativePoint, index) {
    return {
      index: index,
      relativePoint: relativePoint,
      x: startOffset.left - rect.width * relativePoint.x + snapOffset.x,
      y: startOffset.top - rect.height * relativePoint.y + snapOffset.y
    };
  }) : [__utils_47.extend({
    index: 0,
    relativePoint: null
  }, snapOffset)];
}

function __set_47(arg) {
  var interaction = arg.interaction,
      coords = arg.coords,
      state = arg.state;
  var options = state.options,
      offsets = state.offsets;
  var origin = __utils_47.getOriginXY(interaction.interactable, interaction.element, interaction.prepared.name);
  var page = __utils_47.extend({}, coords);
  var targets = [];

  if (!options.offsetWithOrigin) {
    page.x -= origin.x;
    page.y -= origin.y;
  }

  for (var _i = 0; _i < offsets.length; _i++) {
    var _ref;

    _ref = offsets[_i];
    var _offset = _ref;
    var relativeX = page.x - _offset.x;
    var relativeY = page.y - _offset.y;

    for (var _index = 0, len = options.targets.length; _index < len; _index++) {
      var snapTarget = options.targets[_index];
      var target = void 0;

      if (__utils_47.is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction, _offset, _index);
      } else {
        target = snapTarget;
      }

      if (!target) {
        continue;
      }

      targets.push({
        x: (__utils_47.is.number(target.x) ? target.x : relativeX) + _offset.x,
        y: (__utils_47.is.number(target.y) ? target.y : relativeY) + _offset.y,
        range: __utils_47.is.number(target.range) ? target.range : options.range,
        source: snapTarget,
        index: _index,
        offset: _offset
      });
    }
  }

  var closest = {
    target: null,
    inRange: false,
    distance: 0,
    range: 0,
    delta: {
      x: 0,
      y: 0
    }
  };

  for (var _i2 = 0; _i2 < targets.length; _i2++) {
    var _target = targets[_i2];
    var range = _target.range;
    var dx = _target.x - page.x;
    var dy = _target.y - page.y;
    var distance = __utils_47.hypot(dx, dy);
    var inRange = distance <= range; // Infinite targets count as being out of range
    // compared to non infinite ones that are in range

    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false;
    }

    if (!closest.target || (inRange // is the closest target in range?
    ? closest.inRange && range !== Infinity // the pointer is relatively deeper in this target
    ? distance / range < closest.distance / closest.range // this target has Infinite range and the closest doesn't
    : range === Infinity && closest.range !== Infinity || // OR this target is closer that the previous closest
    distance < closest.distance : // The other is not in range and the pointer is closer to this target
    !closest.inRange && distance < closest.distance)) {
      closest.target = _target;
      closest.distance = distance;
      closest.range = range;
      closest.inRange = inRange;
      closest.delta.x = dx;
      closest.delta.y = dy;
    }
  }

  if (closest.inRange) {
    coords.x = closest.target.x;
    coords.y = closest.target.y;
  }

  state.closest = closest;
  return closest;
}

function getOrigin(arg) {
  var element = arg.interaction.element;
  var optionsOrigin = __utils_47.rect.rectToXY(__utils_47.rect.resolveRectLike(arg.state.options.origin, null, null, [element]));
  var origin = optionsOrigin || __utils_47.getOriginXY(arg.interactable, element, arg.interaction.prepared.name);
  return origin;
}

var __defaults_47 = {
  range: Infinity,
  targets: null,
  offset: null,
  offsetWithOrigin: true,
  origin: null,
  relativePoints: null,
  endOnly: false,
  enabled: false
};
var snap = {
  start: __start_47,
  set: __set_47,
  defaults: __defaults_47
};
_$pointer_47.snap = snap;

var ___default_47 = (0, _$base_39.makeModifier)(snap, 'snap');

_$pointer_47["default"] = ___default_47;

var _$size_48 = {};
"use strict";

function ___typeof_48(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_48 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_48 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_48(obj); }

Object.defineProperty(_$size_48, "__esModule", {
  value: true
});
_$size_48.snapSize = _$size_48["default"] = void 0;

var ___extend_48 = ___interopRequireDefault_48(_$extend_72);

var __is_48 = ___interopRequireWildcard_48(_$is_76);

/* removed: var _$base_39 = require("../base"); */;

/* removed: var _$pointer_47 = require("./pointer"); */;

function ___getRequireWildcardCache_48() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_48 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_48(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_48(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_48(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_48(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___slicedToArray_48(arr, i) { return ___arrayWithHoles_48(arr) || ___iterableToArrayLimit_48(arr, i) || ___nonIterableRest_48(); }

function ___nonIterableRest_48() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function ___iterableToArrayLimit_48(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function ___arrayWithHoles_48(arr) { if (Array.isArray(arr)) return arr; }

function __start_48(arg) {
  var state = arg.state,
      edges = arg.edges;
  var options = state.options;

  if (!edges) {
    return null;
  }

  arg.state = {
    options: {
      targets: null,
      relativePoints: [{
        x: edges.left ? 0 : 1,
        y: edges.top ? 0 : 1
      }],
      offset: options.offset || 'self',
      origin: {
        x: 0,
        y: 0
      },
      range: options.range
    }
  };
  state.targetFields = state.targetFields || [['width', 'height'], ['x', 'y']];

  _$pointer_47.snap.start(arg);

  state.offsets = arg.state.offsets;
  arg.state = state;
}

function __set_48(arg) {
  var interaction = arg.interaction,
      state = arg.state,
      coords = arg.coords;
  var options = state.options,
      offsets = state.offsets;
  var relative = {
    x: coords.x - offsets[0].x,
    y: coords.y - offsets[0].y
  };
  state.options = (0, ___extend_48["default"])({}, options);
  state.options.targets = [];

  for (var _i = 0; _i < (options.targets || []).length; _i++) {
    var _ref;

    _ref = (options.targets || [])[_i];
    var snapTarget = _ref;
    var target = void 0;

    if (__is_48.func(snapTarget)) {
      target = snapTarget(relative.x, relative.y, interaction);
    } else {
      target = snapTarget;
    }

    if (!target) {
      continue;
    }

    for (var _i2 = 0; _i2 < state.targetFields.length; _i2++) {
      var _ref2;

      _ref2 = state.targetFields[_i2];

      var _ref3 = _ref2,
          _ref4 = ___slicedToArray_48(_ref3, 2),
          xField = _ref4[0],
          yField = _ref4[1];

      if (xField in target || yField in target) {
        target.x = target[xField];
        target.y = target[yField];
        break;
      }
    }

    state.options.targets.push(target);
  }

  var returnValue = _$pointer_47.snap.set(arg);

  state.options = options;
  return returnValue;
}

var __defaults_48 = {
  range: Infinity,
  targets: null,
  offset: null,
  endOnly: false,
  enabled: false
};
var snapSize = {
  start: __start_48,
  set: __set_48,
  defaults: __defaults_48
};
_$size_48.snapSize = snapSize;

var ___default_48 = (0, _$base_39.makeModifier)(snapSize, 'snapSize');

_$size_48["default"] = ___default_48;

var _$edges_46 = {};
"use strict";

Object.defineProperty(_$edges_46, "__esModule", {
  value: true
});
_$edges_46.snapEdges = _$edges_46["default"] = void 0;

var ___clone_46 = ___interopRequireDefault_46(_$clone_67);

var ___extend_46 = ___interopRequireDefault_46(_$extend_72);

/* removed: var _$base_39 = require("../base"); */;

/* removed: var _$size_48 = require("./size"); */;

function ___interopRequireDefault_46(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * @module modifiers/snapEdges
 *
 * @description
 * This module allows snapping of the edges of targets during resize
 * interactions.
 *
 * @example
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
 *   },
 * })
 *
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [
 *       interact.snappers.grid({
 *        top: 50,
 *        left: 50,
 *        bottom: 100,
 *        right: 100,
 *       }),
 *     ],
 *   },
 * })
 */
function __start_46(arg) {
  var edges = arg.edges;

  if (!edges) {
    return null;
  }

  arg.state.targetFields = arg.state.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];
  return _$size_48.snapSize.start(arg);
}

var snapEdges = {
  start: __start_46,
  set: _$size_48.snapSize.set,
  defaults: (0, ___extend_46["default"])((0, ___clone_46["default"])(_$size_48.snapSize.defaults), {
    targets: null,
    range: null,
    offset: {
      x: 0,
      y: 0
    }
  })
};
_$edges_46.snapEdges = snapEdges;

var ___default_46 = (0, _$base_39.makeModifier)(snapEdges, 'snapEdges');

_$edges_46["default"] = ___default_46;

var _$spring_49 = {};
"use strict";

Object.defineProperty(_$spring_49, "__esModule", {
  value: true
});
_$spring_49["default"] = void 0;

var spring = function spring() {};

spring._defaults = {};
var ___default_49 = spring;
_$spring_49["default"] = ___default_49;

var _$transform_50 = {};
"use strict";

Object.defineProperty(_$transform_50, "__esModule", {
  value: true
});
_$transform_50["default"] = void 0;

var transform = function transform() {};

transform._defaults = {};
var ___default_50 = transform;
_$transform_50["default"] = ___default_50;

var _$all_36 = {};
"use strict";

Object.defineProperty(_$all_36, "__esModule", {
  value: true
});
_$all_36["default"] = void 0;

var _aspectRatio = ___interopRequireDefault_36(_$aspectRatio_37);

var _avoid = ___interopRequireDefault_36(_$avoid_38);

var ___edges_36 = ___interopRequireDefault_36(_$edges_41);

var ___pointer_36 = ___interopRequireDefault_36(_$pointer_42);

var ___rect_36 = ___interopRequireDefault_36(_$rect_43);

var ___size_36 = ___interopRequireDefault_36(_$size_44);

var _rubberband = ___interopRequireDefault_36(_$rubberband_45);

var _edges2 = ___interopRequireDefault_36(_$edges_46);

var _pointer2 = ___interopRequireDefault_36(_$pointer_47);

var _size2 = ___interopRequireDefault_36(_$size_48);

var _spring = ___interopRequireDefault_36(_$spring_49);

var _transform = ___interopRequireDefault_36(_$transform_50);

function ___interopRequireDefault_36(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable node/no-extraneous-import */
var ___default_36 = {
  aspectRatio: _aspectRatio["default"],
  restrictEdges: ___edges_36["default"],
  restrict: ___pointer_36["default"],
  restrictRect: ___rect_36["default"],
  restrictSize: ___size_36["default"],
  snapEdges: _edges2["default"],
  snap: _pointer2["default"],
  snapSize: _size2["default"],
  spring: _spring["default"],
  avoid: _avoid["default"],
  transform: _transform["default"],
  rubberband: _rubberband["default"]
};
_$all_36["default"] = ___default_36;

var _$index_40 = {};
"use strict";

Object.defineProperty(_$index_40, "__esModule", {
  value: true
});
_$index_40["default"] = void 0;

var ___index_40 = ___interopRequireDefault_40(_$index_63);

var _all2 = ___interopRequireDefault_40(_$all_36);

var ___base_40 = ___interopRequireDefault_40(_$base_39);

function ___interopRequireDefault_40(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var __modifiers_40 = {
  id: 'modifiers',
  install: function install(scope) {
    var interact = scope.interactStatic;
    scope.usePlugin(___base_40["default"]);
    scope.usePlugin(___index_40["default"]);
    interact.modifiers = _all2["default"]; // for backwrads compatibility

    for (var type in _all2["default"]) {
      var _all = _all2["default"][type],
          _defaults = _all._defaults,
          _methods = _all._methods;
      _defaults._methods = _methods;
      scope.defaults.perAction[type] = _defaults;
    }
  }
};
var ___default_40 = __modifiers_40;
_$index_40["default"] = ___default_40;

var _$index_51 = {};
"use strict";

Object.defineProperty(_$index_51, "__esModule", {
  value: true
});
_$index_51["default"] = void 0;
var ___default_51 = {};
_$index_51["default"] = ___default_51;

var _$PointerEvent_53 = {};
"use strict";

Object.defineProperty(_$PointerEvent_53, "__esModule", {
  value: true
});
_$PointerEvent_53.PointerEvent = _$PointerEvent_53["default"] = void 0;

var ___BaseEvent2_53 = ___interopRequireDefault_53(_$BaseEvent_16);

var __pointerUtils_53 = ___interopRequireWildcard_53(_$pointerUtils_80);

function ___getRequireWildcardCache_53() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_53 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_53(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_53(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_53(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_53(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___typeof_53(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_53 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_53 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_53(obj); }

function ___classCallCheck_53(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_53(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_53(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_53(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_53(Constructor, staticProps); return Constructor; }

function ___possibleConstructorReturn_53(self, call) { if (call && (___typeof_53(call) === "object" || typeof call === "function")) { return call; } return ___assertThisInitialized_53(self); }

function ___getPrototypeOf_53(o) { ___getPrototypeOf_53 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return ___getPrototypeOf_53(o); }

function ___assertThisInitialized_53(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function ___inherits_53(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) ___setPrototypeOf_53(subClass, superClass); }

function ___setPrototypeOf_53(o, p) { ___setPrototypeOf_53 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return ___setPrototypeOf_53(o, p); }

function ___defineProperty_53(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var PointerEvent = /*#__PURE__*/function (_BaseEvent) {
  ___inherits_53(PointerEvent, _BaseEvent);

  /** */
  function PointerEvent(type, pointer, event, eventTarget, interaction, timeStamp) {
    var _this;

    ___classCallCheck_53(this, PointerEvent);

    _this = ___possibleConstructorReturn_53(this, ___getPrototypeOf_53(PointerEvent).call(this, interaction));

    ___defineProperty_53(___assertThisInitialized_53(_this), "type", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "originalEvent", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "pointerId", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "pointerType", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "double", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "pageX", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "pageY", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "clientX", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "clientY", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "dt", void 0);

    ___defineProperty_53(___assertThisInitialized_53(_this), "eventable", void 0);

    __pointerUtils_53.pointerExtend(___assertThisInitialized_53(_this), event);

    if (event !== pointer) {
      __pointerUtils_53.pointerExtend(___assertThisInitialized_53(_this), pointer);
    }

    _this.timeStamp = timeStamp;
    _this.originalEvent = event;
    _this.type = type;
    _this.pointerId = __pointerUtils_53.getPointerId(pointer);
    _this.pointerType = __pointerUtils_53.getPointerType(pointer);
    _this.target = eventTarget;
    _this.currentTarget = null;

    if (type === 'tap') {
      var pointerIndex = interaction.getPointerIndex(pointer);
      _this.dt = _this.timeStamp - interaction.pointers[pointerIndex].downTime;
      var interval = _this.timeStamp - interaction.tapTime;
      _this["double"] = !!(interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === _this.target && interval < 500);
    } else if (type === 'doubletap') {
      _this.dt = pointer.timeStamp - interaction.tapTime;
    }

    return _this;
  }

  ___createClass_53(PointerEvent, [{
    key: "_subtractOrigin",
    value: function _subtractOrigin(_ref) {
      var originX = _ref.x,
          originY = _ref.y;
      this.pageX -= originX;
      this.pageY -= originY;
      this.clientX -= originX;
      this.clientY -= originY;
      return this;
    }
  }, {
    key: "_addOrigin",
    value: function _addOrigin(_ref2) {
      var originX = _ref2.x,
          originY = _ref2.y;
      this.pageX += originX;
      this.pageY += originY;
      this.clientX += originX;
      this.clientY += originY;
      return this;
    }
    /**
     * Prevent the default behaviour of the original Event
     */

  }, {
    key: "preventDefault",
    value: function preventDefault() {
      this.originalEvent.preventDefault();
    }
  }]);

  return PointerEvent;
}(___BaseEvent2_53["default"]);

_$PointerEvent_53.PointerEvent = _$PointerEvent_53["default"] = PointerEvent;

var _$base_54 = {};
"use strict";

function ___typeof_54(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_54 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_54 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_54(obj); }

Object.defineProperty(_$base_54, "__esModule", {
  value: true
});
_$base_54["default"] = void 0;

var ___Interaction_54 = ___interopRequireDefault_54(_$Interaction_22);

var ___scope_54 = ___interopRequireDefault_54(_$scope_29({}));

var __utils_54 = ___interopRequireWildcard_54(_$index_75);

var _PointerEvent = ___interopRequireDefault_54(_$PointerEvent_53);

function ___getRequireWildcardCache_54() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_54 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_54(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_54(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_54(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_54(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var __defaults_54 = {
  holdDuration: 600,
  ignoreFrom: null,
  allowFrom: null,
  origin: {
    x: 0,
    y: 0
  }
};
var pointerEvents = {
  id: 'pointer-events/base',
  install: __install_54,
  listeners: {
    'interactions:new': addInteractionProps,
    'interactions:update-pointer': addHoldInfo,
    'interactions:move': moveAndClearHold,
    'interactions:down': function interactionsDown(arg, scope) {
      downAndStartHold(arg, scope);
      fire(arg, scope);
    },
    'interactions:up': function interactionsUp(arg, scope) {
      clearHold(arg);
      fire(arg, scope);
      tapAfterUp(arg, scope);
    },
    'interactions:cancel': function interactionsCancel(arg, scope) {
      clearHold(arg);
      fire(arg, scope);
    }
  },
  PointerEvent: _PointerEvent["default"],
  fire: fire,
  collectEventTargets: collectEventTargets,
  defaults: __defaults_54,
  types: {
    down: true,
    move: true,
    up: true,
    cancel: true,
    tap: true,
    doubletap: true,
    hold: true
  }
};

function fire(arg, scope) {
  var interaction = arg.interaction,
      pointer = arg.pointer,
      event = arg.event,
      eventTarget = arg.eventTarget,
      type = arg.type,
      _arg$targets = arg.targets,
      targets = _arg$targets === void 0 ? collectEventTargets(arg, scope) : _arg$targets;
  var pointerEvent = new _PointerEvent["default"](type, pointer, event, eventTarget, interaction, scope.now());
  scope.fire('pointerEvents:new', {
    pointerEvent: pointerEvent
  });
  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    targets: targets,
    type: type,
    pointerEvent: pointerEvent
  };

  for (var i = 0; i < targets.length; i++) {
    var target = targets[i];

    for (var prop in target.props || {}) {
      pointerEvent[prop] = target.props[prop];
    }

    var origin = __utils_54.getOriginXY(target.eventable, target.node);

    pointerEvent._subtractOrigin(origin);

    pointerEvent.eventable = target.eventable;
    pointerEvent.currentTarget = target.node;
    target.eventable.fire(pointerEvent);

    pointerEvent._addOrigin(origin);

    if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].node !== pointerEvent.currentTarget) {
      break;
    }
  }

  scope.fire('pointerEvents:fired', signalArg);

  if (type === 'tap') {
    // if pointerEvent should make a double tap, create and fire a doubletap
    // PointerEvent and use that as the prevTap
    var prevTap = pointerEvent["double"] ? fire({
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'doubletap'
    }, scope) : pointerEvent;
    interaction.prevTap = prevTap;
    interaction.tapTime = prevTap.timeStamp;
  }

  return pointerEvent;
}

function collectEventTargets(_ref, scope) {
  var interaction = _ref.interaction,
      pointer = _ref.pointer,
      event = _ref.event,
      eventTarget = _ref.eventTarget,
      type = _ref.type;
  var pointerIndex = interaction.getPointerIndex(pointer);
  var pointerInfo = interaction.pointers[pointerIndex]; // do not fire a tap event if the pointer was moved before being lifted

  if (type === 'tap' && (interaction.pointerWasMoved || // or if the pointerup target is different to the pointerdown target
  !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
    return [];
  }

  var path = __utils_54.dom.getPath(eventTarget);
  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    type: type,
    path: path,
    targets: [],
    node: null
  };

  for (var _i = 0; _i < path.length; _i++) {
    var _ref2;

    _ref2 = path[_i];
    var node = _ref2;
    signalArg.node = node;
    scope.fire('pointerEvents:collect-targets', signalArg);
  }

  if (type === 'hold') {
    signalArg.targets = signalArg.targets.filter(function (target) {
      return target.eventable.options.holdDuration === interaction.pointers[pointerIndex].hold.duration;
    });
  }

  return signalArg.targets;
}

function addInteractionProps(_ref3) {
  var interaction = _ref3.interaction;
  interaction.prevTap = null; // the most recent tap event on this interaction

  interaction.tapTime = 0; // time of the most recent tap event
}

function addHoldInfo(_ref4) {
  var down = _ref4.down,
      pointerInfo = _ref4.pointerInfo;

  if (!down && pointerInfo.hold) {
    return;
  }

  pointerInfo.hold = {
    duration: Infinity,
    timeout: null
  };
}

function clearHold(_ref5) {
  var interaction = _ref5.interaction,
      pointerIndex = _ref5.pointerIndex;

  if (interaction.pointers[pointerIndex].hold) {
    clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
  }
}

function moveAndClearHold(_ref6, scope) {
  var interaction = _ref6.interaction,
      pointer = _ref6.pointer,
      event = _ref6.event,
      eventTarget = _ref6.eventTarget,
      duplicate = _ref6.duplicate;
  var pointerIndex = interaction.getPointerIndex(pointer);

  if (!duplicate && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
    if (interaction.pointerIsDown) {
      clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
    }

    fire({
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'move'
    }, scope);
  }
}

function downAndStartHold(_ref7, scope) {
  var interaction = _ref7.interaction,
      pointer = _ref7.pointer,
      event = _ref7.event,
      eventTarget = _ref7.eventTarget,
      pointerIndex = _ref7.pointerIndex;
  var timer = interaction.pointers[pointerIndex].hold;
  var path = __utils_54.dom.getPath(eventTarget);
  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    type: 'hold',
    targets: [],
    path: path,
    node: null
  };

  for (var _i2 = 0; _i2 < path.length; _i2++) {
    var _ref8;

    _ref8 = path[_i2];
    var node = _ref8;
    signalArg.node = node;
    scope.fire('pointerEvents:collect-targets', signalArg);
  }

  if (!signalArg.targets.length) {
    return;
  }

  var minDuration = Infinity;

  for (var _i3 = 0; _i3 < signalArg.targets.length; _i3++) {
    var _ref9;

    _ref9 = signalArg.targets[_i3];
    var target = _ref9;
    var holdDuration = target.eventable.options.holdDuration;

    if (holdDuration < minDuration) {
      minDuration = holdDuration;
    }
  }

  timer.duration = minDuration;
  timer.timeout = setTimeout(function () {
    fire({
      interaction: interaction,
      eventTarget: eventTarget,
      pointer: pointer,
      event: event,
      type: 'hold'
    }, scope);
  }, minDuration);
}

function tapAfterUp(_ref10, scope) {
  var interaction = _ref10.interaction,
      pointer = _ref10.pointer,
      event = _ref10.event,
      eventTarget = _ref10.eventTarget;

  if (!interaction.pointerWasMoved) {
    fire({
      interaction: interaction,
      eventTarget: eventTarget,
      pointer: pointer,
      event: event,
      type: 'tap'
    }, scope);
  }
}

function __install_54(scope) {
  scope.pointerEvents = pointerEvents;
  scope.defaults.actions.pointerEvents = pointerEvents.defaults;
  __utils_54.extend(scope.actions.phaselessTypes, pointerEvents.types);
}

var ___default_54 = pointerEvents;
_$base_54["default"] = ___default_54;

var _$holdRepeat_55 = {};
"use strict";

Object.defineProperty(_$holdRepeat_55, "__esModule", {
  value: true
});
_$holdRepeat_55["default"] = void 0;

var ___PointerEvent_55 = ___interopRequireDefault_55(_$PointerEvent_53);

var ___base_55 = ___interopRequireDefault_55(_$base_54);

function ___interopRequireDefault_55(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function __install_55(scope) {
  scope.usePlugin(___base_55["default"]);
  var pointerEvents = scope.pointerEvents; // don't repeat by default

  pointerEvents.defaults.holdRepeatInterval = 0;
  pointerEvents.types.holdrepeat = scope.actions.phaselessTypes.holdrepeat = true;
}

function onNew(_ref) {
  var pointerEvent = _ref.pointerEvent;

  if (pointerEvent.type !== 'hold') {
    return;
  }

  pointerEvent.count = (pointerEvent.count || 0) + 1;
}

function onFired(_ref2, scope) {
  var interaction = _ref2.interaction,
      pointerEvent = _ref2.pointerEvent,
      eventTarget = _ref2.eventTarget,
      targets = _ref2.targets;

  if (pointerEvent.type !== 'hold' || !targets.length) {
    return;
  } // get the repeat interval from the first eventable


  var interval = targets[0].eventable.options.holdRepeatInterval; // don't repeat if the interval is 0 or less

  if (interval <= 0) {
    return;
  } // set a timeout to fire the holdrepeat event


  interaction.holdIntervalHandle = setTimeout(function () {
    scope.pointerEvents.fire({
      interaction: interaction,
      eventTarget: eventTarget,
      type: 'hold',
      pointer: pointerEvent,
      event: pointerEvent
    }, scope);
  }, interval);
}

function endHoldRepeat(_ref3) {
  var interaction = _ref3.interaction;

  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle);
    interaction.holdIntervalHandle = null;
  }
}

var holdRepeat = {
  id: 'pointer-events/holdRepeat',
  install: __install_55,
  listeners: ['move', 'up', 'cancel', 'endall'].reduce(function (acc, enderTypes) {
    acc["pointerEvents:".concat(enderTypes)] = endHoldRepeat;
    return acc;
  }, {
    'pointerEvents:new': onNew,
    'pointerEvents:fired': onFired
  })
};
var ___default_55 = holdRepeat;
_$holdRepeat_55["default"] = ___default_55;

var _$interactableTargets_57 = {};
"use strict";

Object.defineProperty(_$interactableTargets_57, "__esModule", {
  value: true
});
_$interactableTargets_57["default"] = void 0;

var ___extend_57 = ___interopRequireDefault_57(_$extend_72);

function ___interopRequireDefault_57(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function __install_57(scope) {
  var Interactable = scope.Interactable;
  Interactable.prototype.pointerEvents = pointerEventsMethod;
  var __backCompatOption = Interactable.prototype._backCompatOption;

  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    var ret = __backCompatOption.call(this, optionName, newValue);

    if (ret === this) {
      this.events.options[optionName] = newValue;
    }

    return ret;
  };
}

function pointerEventsMethod(options) {
  (0, ___extend_57["default"])(this.events.options, options);
  return this;
}

var plugin = {
  id: 'pointer-events/interactableTargets',
  install: __install_57,
  listeners: {
    'pointerEvents:collect-targets': function pointerEventsCollectTargets(_ref, scope) {
      var targets = _ref.targets,
          node = _ref.node,
          type = _ref.type,
          eventTarget = _ref.eventTarget;
      scope.interactables.forEachMatch(node, function (interactable) {
        var eventable = interactable.events;
        var options = eventable.options;

        if (eventable.types[type] && eventable.types[type].length && interactable.testIgnoreAllow(options, node, eventTarget)) {
          targets.push({
            node: node,
            eventable: eventable,
            props: {
              interactable: interactable
            }
          });
        }
      });
    },
    'interactable:new': function interactableNew(_ref2) {
      var interactable = _ref2.interactable;

      interactable.events.getRect = function (element) {
        return interactable.getRect(element);
      };
    },
    'interactable:set': function interactableSet(_ref3, scope) {
      var interactable = _ref3.interactable,
          options = _ref3.options;
      (0, ___extend_57["default"])(interactable.events.options, scope.pointerEvents.defaults);
      (0, ___extend_57["default"])(interactable.events.options, options.pointerEvents || {});
    }
  }
};
var ___default_57 = plugin;
_$interactableTargets_57["default"] = ___default_57;

var _$index_56 = {};
"use strict";

function ___typeof_56(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_56 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_56 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_56(obj); }

Object.defineProperty(_$index_56, "__esModule", {
  value: true
});
Object.defineProperty(_$index_56, "holdRepeat", {
  enumerable: true,
  get: function get() {
    return _holdRepeat["default"];
  }
});
Object.defineProperty(_$index_56, "interactableTargets", {
  enumerable: true,
  get: function get() {
    return _interactableTargets["default"];
  }
});
_$index_56.pointerEvents = _$index_56["default"] = void 0;

var __pointerEvents_56 = ___interopRequireWildcard_56(_$base_54);

_$index_56.pointerEvents = __pointerEvents_56;

var _holdRepeat = ___interopRequireDefault_56(_$holdRepeat_55);

var _interactableTargets = ___interopRequireDefault_56(_$interactableTargets_57);

function ___interopRequireDefault_56(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___getRequireWildcardCache_56() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_56 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_56(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_56(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_56(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var ___default_56 = {
  id: 'pointer-events',
  install: function install(scope) {
    scope.usePlugin(__pointerEvents_56);
    scope.usePlugin(_holdRepeat["default"]);
    scope.usePlugin(_interactableTargets["default"]);
  }
};
_$index_56["default"] = ___default_56;

var _$index_58 = {};
"use strict";

Object.defineProperty(_$index_58, "__esModule", {
  value: true
});
_$index_58.install = __install_58;
_$index_58["default"] = void 0;

var ___Interactable_58 = ___interopRequireDefault_58(_$Interactable_20({}));

/* removed: var _$Interaction_22 = require("@interactjs/core/Interaction"); */;

/* removed: var _$index_75 = require("@interactjs/utils/index"); */;

function ___interopRequireDefault_58(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function __install_58(scope) {
  var Interactable = scope.Interactable;
  scope.actions.phases.reflow = true;
  /**
   * ```js
   * const interactable = interact(target)
   * const drag = { name: drag, axis: 'x' }
   * const resize = { name: resize, edges: { left: true, bottom: true }
   *
   * interactable.reflow(drag)
   * interactable.reflow(resize)
   * ```
   *
   * Start an action sequence to re-apply modifiers, check drops, etc.
   *
   * @param { Object } action The action to begin
   * @param { string } action.name The name of the action
   * @returns { Promise } A promise that resolves to the `Interactable` when actions on all targets have ended
   */

  Interactable.prototype.reflow = function (action) {
    return reflow(this, action, scope);
  };
}

function reflow(interactable, action, scope) {
  var elements = _$index_75.is.string(interactable.target) ? _$index_75.arr.from(interactable._context.querySelectorAll(interactable.target)) : [interactable.target]; // tslint:disable-next-line variable-name

  var Promise = _$index_75.win.window.Promise;
  var promises = Promise ? [] : null;

  var _loop = function _loop() {
    _ref = elements[_i];
    var element = _ref;
    var rect = interactable.getRect(element);

    if (!rect) {
      return "break";
    }

    var runningInteraction = _$index_75.arr.find(scope.interactions.list, function (interaction) {
      return interaction.interacting() && interaction.interactable === interactable && interaction.element === element && interaction.prepared.name === action.name;
    });

    var reflowPromise = void 0;

    if (runningInteraction) {
      runningInteraction.move();

      if (promises) {
        reflowPromise = runningInteraction._reflowPromise || new Promise(function (resolve) {
          runningInteraction._reflowResolve = resolve;
        });
      }
    } else {
      var xywh = _$index_75.rect.tlbrToXywh(rect);

      var coords = {
        page: {
          x: xywh.x,
          y: xywh.y
        },
        client: {
          x: xywh.x,
          y: xywh.y
        },
        timeStamp: scope.now()
      };

      var event = _$index_75.pointer.coordsToEvent(coords);

      reflowPromise = startReflow(scope, interactable, element, action, event);
    }

    if (promises) {
      promises.push(reflowPromise);
    }
  };

  for (var _i = 0; _i < elements.length; _i++) {
    var _ref;

    var _ret = _loop();

    if (_ret === "break") break;
  }

  return promises && Promise.all(promises).then(function () {
    return interactable;
  });
}

function startReflow(scope, interactable, element, action, event) {
  var interaction = scope.interactions["new"]({
    pointerType: 'reflow'
  });
  var signalArg = {
    interaction: interaction,
    event: event,
    pointer: event,
    eventTarget: element,
    phase: 'reflow'
  };
  interaction.interactable = interactable;
  interaction.element = element;
  interaction.prepared = (0, _$index_75.extend)({}, action);
  interaction.prevEvent = event;
  interaction.updatePointer(event, event, element, true);

  interaction._doPhase(signalArg);

  var reflowPromise = _$index_75.win.window.Promise ? new _$index_75.win.window.Promise(function (resolve) {
    interaction._reflowResolve = resolve;
  }) : null;
  interaction._reflowPromise = reflowPromise;
  interaction.start(action, interactable, element);

  if (interaction._interacting) {
    interaction.move(signalArg);
    interaction.end(event);
  } else {
    interaction.stop();
  }

  interaction.removePointer(event, event);
  interaction.pointerIsDown = false;
  return reflowPromise;
}

var ___default_58 = {
  id: 'reflow',
  install: __install_58,
  listeners: {
    // remove completed reflow interactions
    'interactions:stop': function interactionsStop(_ref2, scope) {
      var interaction = _ref2.interaction;

      if (interaction.pointerType === 'reflow') {
        if (interaction._reflowResolve) {
          interaction._reflowResolve();
        }

        _$index_75.arr.remove(scope.interactions.list, interaction);
      }
    }
  }
};
_$index_58["default"] = ___default_58;

var _$displace_68 = {};
"use strict";

Object.defineProperty(_$displace_68, "__esModule", {
  value: true
});
_$displace_68["default"] = void 0;
var ___default_68 = {};
_$displace_68["default"] = ___default_68;

var _$exchange_71 = {};
"use strict";

Object.defineProperty(_$exchange_71, "__esModule", {
  value: true
});
_$exchange_71.exchange = void 0;
var exchange = {};
_$exchange_71.exchange = exchange;

var _$index_84 = {};
"use strict";

Object.defineProperty(_$index_84, "__esModule", {
  value: true
});
_$index_84["default"] = void 0;
var ___default_84 = {};
_$index_84["default"] = ___default_84;

var _$index_34 = {};
"use strict";

function ___typeof_34(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_34 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_34 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_34(obj); }

Object.defineProperty(_$index_34, "__esModule", {
  value: true
});
_$index_34["default"] = void 0;

_$index_64;

var _actions = ___interopRequireDefault_34(_$index_5);

var _arrange = ___interopRequireDefault_34(_$index_7);

var _autoScroll = ___interopRequireDefault_34(_$index_8);

var _autoStart = ___interopRequireDefault_34(_$index_13);

var ___clone_34 = ___interopRequireDefault_34(_$index_14);

var _components = ___interopRequireDefault_34(_$index_15);

var ___interactablePreventDefault_34 = ___interopRequireDefault_34(_$interactablePreventDefault_26);

var _devTools = ___interopRequireDefault_34(_$index_30);

var feedback = ___interopRequireWildcard_34(_$index_31);

var _inertia = ___interopRequireDefault_34(_$index_32);

var _interact = ___interopRequireDefault_34(_$index_33);

var ___index_34 = ___interopRequireDefault_34(_$index_40);

var _multiTarget = ___interopRequireDefault_34(_$index_51);

var _offset = ___interopRequireDefault_34(_$index_52);

var _pointerEvents = ___interopRequireDefault_34(_$index_56);

var _reflow = ___interopRequireDefault_34(_$index_58);

var displace = ___interopRequireWildcard_34(_$displace_68);

/* removed: var _$exchange_71 = require("@interactjs/utils/exchange"); */;

var __pointerUtils_34 = ___interopRequireWildcard_34(_$pointerUtils_80);

var vueComponents = ___interopRequireWildcard_34(_$index_84);

function ___getRequireWildcardCache_34() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); ___getRequireWildcardCache_34 = function _getRequireWildcardCache() { return cache; }; return cache; }

function ___interopRequireWildcard_34(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || ___typeof_34(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = ___getRequireWildcardCache_34(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ___interopRequireDefault_34(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

_interact["default"].use(_multiTarget["default"]);

_interact["default"].use(___interactablePreventDefault_34["default"]);

_interact["default"].use(_offset["default"]); // interaction element cloning


_interact["default"].use(___clone_34["default"]); // sortable and swappable


_interact["default"].use(_arrange["default"]); // pointerEvents


_interact["default"].use(_pointerEvents["default"]); // inertia


_interact["default"].use(_inertia["default"]); // snap, resize, etc.


_interact["default"].use(___index_34["default"]); // autoStart, hold


_interact["default"].use(_autoStart["default"]); // drag and drop, resize, gesture


_interact["default"].use(_actions["default"]); // autoScroll


_interact["default"].use(_autoScroll["default"]); // reflow


_interact["default"].use(_reflow["default"]);

_interact["default"].feedback = feedback;

_interact["default"].use(_components["default"]);

_interact["default"].vue = {
  components: vueComponents
};
_interact["default"].__utils = {
  exchange: _$exchange_71.exchange,
  displace: displace,
  pointer: __pointerUtils_34
}; // eslint-disable-next-line no-undef

if ("production" !== 'production') {
  _interact["default"].use(_devTools["default"]);
}

var ___default_34 = _interact["default"];
_$index_34["default"] = ___default_34;

var _$index_85 = { exports: {} };
"use strict";

Object.defineProperty(_$index_85.exports, "__esModule", {
  value: true
});
_$index_85.exports["default"] = void 0;

var ___index_85 = ___interopRequireDefault_85(_$index_34);

function ___interopRequireDefault_85(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ___typeof_85(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_85 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_85 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_85(obj); }

if (("object" === "undefined" ? "undefined" : ___typeof_85(_$index_85)) === 'object' && !!_$index_85) {
  try {
    _$index_85.exports = ___index_85["default"];
  } catch (_unused) {}
}

___index_85["default"]["default"] = ___index_85["default"];
var ___default_85 = ___index_85["default"];
_$index_85.exports["default"] = ___default_85;

_$index_85 = _$index_85.exports
return _$index_85;

});


//# sourceMappingURL=interact.js.map
