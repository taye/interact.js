'use strict';

if (typeof window === 'undefined') {
    module.exports.window     = undefined;
    module.exports.realWindow = undefined;
}
else {
    // get wrapped window if using Shadow DOM polyfill

    module.exports.realWindow = window;

    // create a TextNode
    var el = window.document.createTextNode('');

    // check if it's wrapped by a polyfill
    if (el.ownerDocument !== window.document
        && typeof window.wrap === 'function'
        && window.wrap(el) === el) {
        // return wrapped window
        module.exports.window = window.wrap(window);
    }

    // no Shadow DOM polyfil or native implementation
    module.exports.window = window;
}

var isWindow = require('./isType').isWindow;

module.exports.getWindow = function getWindow (node) {
    if (isWindow(node)) {
        return node;
    }

    var rootNode = (node.ownerDocument || node);

    return rootNode.defaultView || rootNode.parentWindow || module.exports.window;
};
