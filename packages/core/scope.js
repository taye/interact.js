import Eventable  from './Eventable';
import defaults   from './defaultOptions';
import * as utils from '@interactjs/utils';
import domObjects from '@interactjs/utils/domObjects';

import InteractEvent from './InteractEvent';
import Interactable from './Interactable';

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
    // eslint-disable-next-line no-shadow
    Interactable: class Interactable extends Interactable {
      get _defaults () { return scope.defaults; }
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
      scope.removeDocument(event.target.document);
    },

    getDocIndex (doc) {
      for (let i = 0; i < scope.documents.length; i++) {
        if (scope.documents[i].doc === doc) {
          return i;
        }
      }

      return -1;
    },
  };

  return scope;
}

export function initScope (scope, window) {
  win.init(window);
  domObjects.init(window);
  browser.init(window);
  raf.init(window);

  scope.document = window.document;

  return scope;
}
