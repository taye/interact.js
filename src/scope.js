const Eventable = require('./Eventable');
const defaults  = require('./defaultOptions');
const utils     = require('./utils');
const browser   = require('./utils/browser');
const events    = require('./utils/events');
const Signals   = require('./utils/Signals');

const { getWindow } = require('./utils/window');

const scope = {
  Signals,
  signals: new Signals(),
  browser,
  events,
  utils,
  defaults,
  Eventable,

  // all active and idle interactions
  interactions: [],

  // main document
  document: require('./utils/domObjects').document,
  // all documents being listened to
  documents: [],

  addDocument: function (doc, win) {
    // do nothing if document is already known
    if (utils.contains(scope.documents, doc)) { return false; }

    win = win || getWindow(doc);

    scope.documents.push(doc);
    events.documents.push(doc);

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== scope.document) {
      events.add(win, 'unload', scope.onWindowUnload);
    }

    scope.signals.fire('add-document', { doc, win, scope });
  },

  removeDocument: function (doc, win) {
    const index = scope.documents.indexOf(doc);

    win = win || getWindow(doc);

    events.remove(win, 'unload', scope.onWindowUnload);

    scope.documents.splice(index, 1);
    events.documents.splice(index, 1);

    scope.signals.fire('remove-document', { win, doc, scope });
  },

  onWindowUnload: function () {
    scope.removeDocument(this.document, this);
  },
};

module.exports = scope;

require('./Interaction').init(scope);
require('./docEvents').init(scope);
