const { jsdom } = require('jsdom');
const doc = jsdom('<!DOCTYPE html><html><body></body></html>');

require('../src/utils/window').init(doc.defaultView);

module.exports = require('tape');
