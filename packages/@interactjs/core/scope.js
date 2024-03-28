/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import browser from "../utils/browser.js";
import clone from "../utils/clone.js";
import domObjects from "../utils/domObjects.js";
import extend from "../utils/extend.js";
import is from "../utils/is.js";
import raf from "../utils/raf.js";
import * as win from "../utils/window.js";
import { Eventable } from './Eventable.js';
import events from './events.js';
import interactions from './interactions.js';
import { Interactable } from './Interactable.js';
import { InteractableSet } from './InteractableSet.js';
import { InteractEvent } from './InteractEvent.js';
import { createInteractStatic } from './InteractStatic.js';
import { defaults } from './options.js';
import "../utils/arr.js";
import "../utils/normalizeListeners.js";
import "../utils/domUtils.js";
import "../utils/pointerExtend.js";
import "../utils/pointerUtils.js";
import './interactablePreventDefault.js';
import './Interaction.js';
import "../utils/hypot.js";
import "../utils/misc.js";
import "../utils/rect.js";
import './PointerInfo.js';
import './interactionFinder.js';
import "../utils/isNonNativeEvent.js";
import "../utils/getOriginXY.js";
import './BaseEvent.js';

/** @internal */
class Scope {
  constructor() {
    this.id = `__interact_scope_${Math.floor(Math.random() * 100)}`;
    this.isInitialized = false;
    this.listenerMaps = [];
    this.browser = browser;
    this.defaults = clone(defaults);
    this.Eventable = Eventable;
    this.actions = {
      map: {},
      phases: {
        start: true,
        move: true,
        end: true
      },
      methodDict: {},
      phaselessTypes: {}
    };
    this.interactStatic = createInteractStatic(this);
    this.InteractEvent = InteractEvent;
    this.Interactable = void 0;
    this.interactables = new InteractableSet(this);
    // main window
    this._win = void 0;
    // main document
    this.document = void 0;
    // main window
    this.window = void 0;
    // all documents being listened to
    this.documents = [];
    this._plugins = {
      list: [],
      map: {}
    };
    this.onWindowUnload = event => this.removeDocument(event.target);
    const scope = this;
    this.Interactable = class extends Interactable {
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
    options = options ? extend({}, options) : {};
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

// Keep Scope class internal, but expose minimal interface to avoid broken types when Scope is stripped out

/** @internal */
function initScope(scope, window) {
  scope.isInitialized = true;
  if (is.window(window)) {
    win.init(window);
  }
  domObjects.init(window);
  browser.init(window);
  raf.init(window);

  // @ts-expect-error
  scope.window = window;
  scope.document = window.document;
  scope.usePlugin(interactions);
  scope.usePlugin(events);
  return scope;
}
function pluginIdRoot(id) {
  return id && id.replace(/\/.*$/, '');
}
export { Scope, initScope };
//# sourceMappingURL=scope.js.map
