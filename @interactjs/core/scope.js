function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import domObjects from "../utils/domObjects.js";
import * as utils from "../utils/index.js";
import defaults from "./defaultOptions.js";
import Eventable from "./Eventable.js";
import InteractableBase from "./Interactable.js";
import InteractableSet from "./InteractableSet.js";
import InteractEvent from "./InteractEvent.js";
import interactions from "./interactions.js";
const {
  win,
  browser,
  raf,
  events
} = utils;
export let ActionName;

(function (ActionName) {})(ActionName || (ActionName = {}));

export function createScope() {
  return new Scope();
}
export class Scope {
  // main window
  // main document
  // main window
  // all documents being listened to
  constructor() {
    _defineProperty(this, "id", `__interact_scope_${Math.floor(Math.random() * 100)}`);

    _defineProperty(this, "listenerMaps", []);

    _defineProperty(this, "browser", browser);

    _defineProperty(this, "events", events);

    _defineProperty(this, "utils", utils);

    _defineProperty(this, "defaults", utils.clone(defaults));

    _defineProperty(this, "Eventable", Eventable);

    _defineProperty(this, "actions", {
      names: [],
      methodDict: {},
      eventTypes: []
    });

    _defineProperty(this, "InteractEvent", InteractEvent);

    _defineProperty(this, "Interactable", void 0);

    _defineProperty(this, "interactables", new InteractableSet(this));

    _defineProperty(this, "_win", void 0);

    _defineProperty(this, "document", void 0);

    _defineProperty(this, "window", void 0);

    _defineProperty(this, "documents", []);

    _defineProperty(this, "_plugins", {
      list: [],
      map: {}
    });

    _defineProperty(this, "onWindowUnload", event => this.removeDocument(event.target));

    const scope = this;
    this.Interactable = class Interactable extends InteractableBase {
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

        for (let i = scope.interactions.list.length - 1; i >= 0; i--) {
          const interaction = scope.interactions.list[i];

          if (interaction.interactable === this) {
            interaction.stop();
            scope.fire('interactions:destroy', {
              interaction
            });
            interaction.destroy();

            if (scope.interactions.list.length > 2) {
              scope.interactions.list.splice(i, 1);
            }
          }
        }

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

  init(window) {
    return initScope(this, window);
  }

  pluginIsInstalled(plugin) {
    return this._plugins.map[plugin.id] || this._plugins.list.indexOf(plugin) !== -1;
  }

  usePlugin(plugin, options) {
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

      for (; index < this.listenerMaps.length; index++) {
        const otherId = this.listenerMaps[index].id;

        if (otherId === plugin.before) {
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
    options = options ? utils.extend({}, options) : {};
    this.documents.push({
      doc,
      options
    });
    events.documents.push(doc); // don't add an unload event for the main document
    // so that the page may be cached in browser history

    if (doc !== this.document) {
      events.add(window, 'unload', this.onWindowUnload);
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
    events.remove(window, 'unload', this.onWindowUnload);
    this.documents.splice(index, 1);
    events.documents.splice(index, 1);
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
export function initScope(scope, window) {
  win.init(window);
  domObjects.init(window);
  browser.init(window);
  raf.init(window);
  events.init(window);
  scope.usePlugin(interactions);
  scope.document = window.document;
  scope.window = window;
  return scope;
}
//# sourceMappingURL=scope.js.map