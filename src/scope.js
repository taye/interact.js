import Eventable  from './Eventable';
import defaults   from './defaultOptions';
import * as utils from './utils';
import browser    from './utils/browser';
import events     from './utils/events';
import Signals    from './utils/Signals';

import { getWindow } from './utils/window';
import { document } from './utils/domObjects';

const scope = {
  Signals,
  signals: new Signals(),
  browser,
  events,
  utils,
  defaults,
  Eventable,

  // main document
  document,
  // all documents being listened to
  documents: [/* { doc, options } */],

  addDocument (doc, options) {
    // do nothing if document is already known
    if (scope.getDocIndex(doc) !== -1) { return false; }

    const win = getWindow(doc);

    scope.documents.push({ doc, options });
    events.documents.push(doc);

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== scope.document) {
      events.add(win, 'unload', scope.onWindowUnload);
    }

    scope.signals.fire('add-document', { doc, win, scope, options });
  },

  removeDocument (doc) {
    const index = scope.getDocIndex(doc);

    const win = getWindow(doc);
    const options = scope.documents[index].options;

    events.remove(win, 'unload', scope.onWindowUnload);

    scope.documents.splice(index, 1);
    events.documents.splice(index, 1);

    scope.signals.fire('remove-document', { doc, win, scope, options });
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

export default scope;
