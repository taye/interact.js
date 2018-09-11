import Eventable  from './Eventable';
import defaults   from './defaultOptions';
import * as utils from '@interactjs/utils';
import domObjects from '@interactjs/utils/domObjects';

import interactions from './interactions';
import InteractEvent    from './InteractEvent';
import InteractableBase from './Interactable';

const {
  win,
  browser,
  raf,
  Signals,
  events,
} = utils;

export function createScope () {
  const scope = {
    Signals,
    signals: new Signals(),
    browser,
    events,
    utils,
    defaults: utils.clone(defaults),
    Eventable,

    InteractEvent: InteractEvent,
    Interactable: class Interactable extends InteractableBase {
      get _defaults () { return scope.defaults; }

      set (options) {
        super.set(options);

        scope.interactables.signals.fire('set', {
          options,
          interactable: this,
        });

        return this;
      }

      unset () {
        super.unset();
        scope.interactables.signals.fire('unset', { interactable: this });
      }
    },

    interactables: {
      // all set interactables
      list: [],

      new (target, options) {
        options = utils.extend(options || {}, {
          actions: scope.actions,
        });

        const interactable = new scope.Interactable(target, options, scope.document);

        scope.addDocument(interactable._doc);

        scope.interactables.list.push(interactable);

        scope.interactables.signals.fire('new', {
          target,
          options,
          interactable: interactable,
          win: this._win,
        });

        return interactable;
      },

      indexOfElement (target, context) {
        context = context || scope.document;

        const list = this.list;

        for (let i = 0; i < list.length; i++) {
          const interactable = list[i];

          if (interactable.target === target && interactable._context === context) {
            return i;
          }
        }

        return -1;
      },

      get (element, options, dontCheckInContext) {
        const ret = this.list[this.indexOfElement(element, options && options.context)];

        return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element))? ret : null;
      },

      forEachMatch (element, callback) {
        for (const interactable of this.list) {
          let ret;

          if ((utils.is.string(interactable.target)
            // target is a selector and the element matches
            ? (utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target))
            // target is the element
            : element === interactable.target)
            // the element is in context
            && (interactable.inContext(element))) {
            ret = callback(interactable);
          }

          if (ret !== undefined) {
            return ret;
          }
        }
      },

      signals: new utils.Signals(),
    },

    // main document
    document: null,
    // all documents being listened to
    documents: [/* { doc, options } */],

    init (window) {
      return initScope(scope, window);
    },

    addDocument (doc, options) {
      // do nothing if document is already known
      if (scope.getDocIndex(doc) !== -1) { return false; }

      const window = win.getWindow(doc);

      options = options ? utils.extend({}, options) : {};

      scope.documents.push({ doc, options });
      events.documents.push(doc);

      // don't add an unload event for the main document
      // so that the page may be cached in browser history
      if (doc !== scope.document) {
        events.add(window, 'unload', scope.onWindowUnload);
      }

      scope.signals.fire('add-document', { doc, window, scope, options });
    },

    removeDocument (doc) {
      const index = scope.getDocIndex(doc);

      const window = win.getWindow(doc);
      const options = scope.documents[index].options;

      events.remove(window, 'unload', scope.onWindowUnload);

      scope.documents.splice(index, 1);
      events.documents.splice(index, 1);

      scope.signals.fire('remove-document', { doc, window, scope, options });
    },

    onWindowUnload (event) {
      scope.removeDocument(event.currentTarget.document);
    },

    getDocIndex (doc) {
      for (let i = 0; i < scope.documents.length; i++) {
        if (scope.documents[i].doc === doc) {
          return i;
        }
      }

      return -1;
    },

    getDocOptions (doc) {
      const docIndex = scope.getDocIndex(doc);

      return docIndex === -1 ? null : scope.documents[docIndex].options;
    },
  };

  return scope;
}

export function initScope (scope, window) {
  win.init(window);
  domObjects.init(window);
  browser.init(window);
  raf.init(window);
  events.init(window);

  interactions.install(scope);
  scope.document = window.document;

  return scope;
}
