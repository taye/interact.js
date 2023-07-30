import browser from "../utils/browser.js";
import clone from "../utils/clone.js";
import domObjects from "../utils/domObjects.js";
import extend from "../utils/extend.js";
import is from "../utils/is.js";
import raf from "../utils/raf.js";
import * as win from "../utils/window.js";
import { Eventable } from './Eventable';
import { InteractEvent } from './InteractEvent';
import { createInteractStatic } from './InteractStatic';
import { Interactable as InteractableBase } from './Interactable';
import { InteractableSet } from './InteractableSet';
import events from './events';
import interactions from './interactions';
import { defaults } from './options';
export class Scope {
  id = `__interact_scope_${Math.floor(Math.random() * 100)}`;
  isInitialized = false;
  listenerMaps = [];
  browser = browser;
  defaults = clone(defaults);
  Eventable = Eventable;
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
  interactStatic = createInteractStatic(this);
  InteractEvent = InteractEvent;
  Interactable;
  interactables = new InteractableSet(this); // main window

  _win; // main document

  document; // main window

  window; // all documents being listened to

  documents = [];
  _plugins = {
    list: [],
    map: {}
  };

  constructor() {
    const scope = this;
    this.Interactable = class extends InteractableBase {
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
        super.unset();
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
    return this._plugins.map[plugin.id] || this._plugins.list.indexOf(plugin) !== -1;
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

        if (before[otherId] || before[pluginIdRoot(otherId)]) {
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
    options = options ? extend({}, options) : {};
    this.documents.push({
      doc,
      options
    });
    this.events.documents.push(doc); // don't add an unload event for the main document
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
export function initScope(scope, window) {
  scope.isInitialized = true;

  if (is.window(window)) {
    win.init(window);
  }

  domObjects.init(window);
  browser.init(window);
  raf.init(window); // @ts-expect-error

  scope.window = window;
  scope.document = window.document;
  scope.usePlugin(interactions);
  scope.usePlugin(events);
  return scope;
}

function pluginIdRoot(id) {
  return id && id.replace(/\/.*$/, '');
}
//# sourceMappingURL=scope.js.map