"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Scope = void 0;
exports.initScope = initScope;
var _browser = _interopRequireDefault(require("../utils/browser.js"));
var _clone = _interopRequireDefault(require("../utils/clone.js"));
var _domObjects = _interopRequireDefault(require("../utils/domObjects.js"));
var _extend = _interopRequireDefault(require("../utils/extend.js"));
var _is = _interopRequireDefault(require("../utils/is.js"));
var _raf = _interopRequireDefault(require("../utils/raf.js"));
var win = _interopRequireWildcard(require("../utils/window.js"));
var _Eventable = require("./Eventable");
var _events = _interopRequireDefault(require("./events"));
var _interactions = _interopRequireDefault(require("./interactions"));
var _Interactable = require("./Interactable");
var _InteractableSet = require("./InteractableSet");
var _InteractEvent = require("./InteractEvent");
var _InteractStatic = require("./InteractStatic");
var _options = require("./options");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */

/* eslint-enable import/no-duplicates */

/** @internal */

/** @internal */
class Scope {
  id = `__interact_scope_${Math.floor(Math.random() * 100)}`;
  isInitialized = false;
  listenerMaps = [];
  browser = _browser.default;
  defaults = (0, _clone.default)(_options.defaults);
  Eventable = _Eventable.Eventable;
  actions = {
    map: {},
    phases: {
      start: true,
      move: true,
      end: true
    },
    methodDict: {},
    phaselessTypes: {}
  };
  interactStatic = (0, _InteractStatic.createInteractStatic)(this);
  InteractEvent = _InteractEvent.InteractEvent;
  Interactable;
  interactables = new _InteractableSet.InteractableSet(this);

  // main window
  _win;

  // main document
  document;

  // main window
  window;

  // all documents being listened to
  documents = [];
  _plugins = {
    list: [],
    map: {}
  };
  constructor() {
    const scope = this;
    this.Interactable = class extends _Interactable.Interactable {
      get _defaults() {
        return scope.defaults;
      }
      set(options) {
        super.set(options);
        scope.fire('interactable:set', {
          options,
          interactable: this
        });
        return this;
      }
      unset() {
        super.unset();
        const index = scope.interactables.list.indexOf(this);
        if (index < 0) return;
        scope.interactables.list.splice(index, 1);
        scope.fire('interactable:unset', {
          interactable: this
        });
      }
    };
  }
  addListeners(map, id) {
    this.listenerMaps.push({
      id,
      map
    });
  }
  fire(name, arg) {
    for (const {
      map: {
        [name]: listener
      }
    } of this.listenerMaps) {
      if (!!listener && listener(arg, this, name) === false) {
        return false;
      }
    }
  }
  onWindowUnload = event => this.removeDocument(event.target);
  init(window) {
    return this.isInitialized ? this : initScope(this, window);
  }
  pluginIsInstalled(plugin) {
    const {
      id
    } = plugin;
    return id ? !!this._plugins.map[id] : this._plugins.list.indexOf(plugin) !== -1;
  }
  usePlugin(plugin, options) {
    if (!this.isInitialized) {
      return this;
    }
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
      let index = 0;
      const len = this.listenerMaps.length;
      const before = plugin.before.reduce((acc, id) => {
        acc[id] = true;
        acc[pluginIdRoot(id)] = true;
        return acc;
      }, {});
      for (; index < len; index++) {
        const otherId = this.listenerMaps[index].id;
        if (otherId && (before[otherId] || before[pluginIdRoot(otherId)])) {
          break;
        }
      }
      this.listenerMaps.splice(index, 0, {
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
  addDocument(doc, options) {
    // do nothing if document is already known
    if (this.getDocIndex(doc) !== -1) {
      return false;
    }
    const window = win.getWindow(doc);
    options = options ? (0, _extend.default)({}, options) : {};
    this.documents.push({
      doc,
      options
    });
    this.events.documents.push(doc);

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== this.document) {
      this.events.add(window, 'unload', this.onWindowUnload);
    }
    this.fire('scope:add-document', {
      doc,
      window,
      scope: this,
      options
    });
  }
  removeDocument(doc) {
    const index = this.getDocIndex(doc);
    const window = win.getWindow(doc);
    const options = this.documents[index].options;
    this.events.remove(window, 'unload', this.onWindowUnload);
    this.documents.splice(index, 1);
    this.events.documents.splice(index, 1);
    this.fire('scope:remove-document', {
      doc,
      window,
      scope: this,
      options
    });
  }
  getDocIndex(doc) {
    for (let i = 0; i < this.documents.length; i++) {
      if (this.documents[i].doc === doc) {
        return i;
      }
    }
    return -1;
  }
  getDocOptions(doc) {
    const docIndex = this.getDocIndex(doc);
    return docIndex === -1 ? null : this.documents[docIndex].options;
  }
  now() {
    return (this.window.Date || Date).now();
  }
}

/** @internal */
exports.Scope = Scope;
function initScope(scope, window) {
  scope.isInitialized = true;
  if (_is.default.window(window)) {
    win.init(window);
  }
  _domObjects.default.init(window);
  _browser.default.init(window);
  _raf.default.init(window);

  // @ts-expect-error
  scope.window = window;
  scope.document = window.document;
  scope.usePlugin(_interactions.default);
  scope.usePlugin(_events.default);
  return scope;
}
function pluginIdRoot(id) {
  return id && id.replace(/\/.*$/, '');
}
//# sourceMappingURL=scope.js.map