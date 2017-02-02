const utils   = require('./utils');
const events  = require('./utils/events');
const signals = require('./utils/Signals').new();

const scope = {
  signals,
  events,
  utils,

  // main document
  document: require('./utils/domObjects').document,
  // all documents being listened to
  documents: [],

  addDocument: function (doc, win) {
    // do nothing if document is already known
    if (utils.contains(scope.documents, doc)) { return false; }

    win = win || scope.getWindow(doc);

    scope.documents.push(doc);
    events.documents.push(doc);

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== scope.document) {
      events.add(win, 'unload', scope.onWindowUnload);
    }

    signals.fire('add-document', { doc, win });
  },

  removeDocument: function (doc, win) {
    const index = utils.indexOf(scope.documents, doc);

    win = win || scope.getWindow(doc);

    events.remove(win, 'unload', scope.onWindowUnload);

    scope.documents.splice(index, 1);
    events.documents.splice(index, 1);

    signals.fire('remove-document', { win, doc });
  },

  onWindowUnload: function () {
    scope.removeDocument(this.document, this);
  },
};

module.exports = scope;
