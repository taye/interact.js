import Eventable  from './Eventable';
import defaults   from './defaultOptions';
import * as utils from './utils';
import domObjects from './utils/domObjects';

import InteractEvent from './InteractEvent';
import Interactable from './Interactable';

const {
  win,
  browser,
  raf,
  Signals,
  events,
} = utils;

export const scope = {
  Signals,
  signals: new Signals(),
  browser,
  events,
  utils,
  defaults,
  Eventable,

  // main document
  document: null,
  // all documents being listened to
  documents: [/* { doc, options } */],

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

export function init (window) {
  win.init(window);
  domObjects.init(window);
  browser.init(window);
  raf.init(window);

  scope.document = window.document;

  scope.InteractEvent = InteractEvent;
  scope.Interactable = class extends Interactable {};
}
