const scope   = {};
const utils   = require('./utils');
const events  = require('./utils/events');
const signals = require('./utils/Signals').new();

scope.defaultOptions = require('./defaultOptions');
scope.signals        = signals;
scope.events         = events;

utils.extend(scope, require('./utils/window'));
utils.extend(scope, require('./utils/domObjects'));

scope.documents  = [];  // all documents being listened to

scope.prefixedPropREs = utils.prefixedPropREs;

scope.addDocument = function (doc, win) {
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
};

scope.removeDocument = function (doc, win) {
  const index = utils.indexOf(scope.documents, doc);

  win = win || scope.getWindow(doc);

  events.remove(win, 'unload', scope.onWindowUnload);

  scope.documents.splice(index, 1);
  events.documents.splice(index, 1);

  signals.fire('remove-document', { win, doc });
};

scope.onWindowUnload = function () {
  scope.removeDocument(this.document, this);
};

module.exports = scope;
