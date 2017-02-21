const domator = require('domator');
domator.setDocument(require('../src/utils/window').window.document);

module.exports = domator;
